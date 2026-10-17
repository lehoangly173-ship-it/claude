# Security review: Mộc AI (team/phan-quyen, working tree)

VERDICT: FAIL (2 high, 0 critical)

What works: the AI key stays on the server (handler.ts:22, not in src/ or .env.example). The role comes from the server through `moc_take_quota` (handler.ts:31-33), so a client cannot fake its role or add sections it is not allowed. `moc_docs` and `moc_usage` both have RLS. `moc_usage` cannot be read by any client. Questions and answers are not stored. The answer is shown as plain React text with no innerHTML.

## Issues

1. [high] supabase/functions/_shared/moc-policy.ts:20,36-38 and src/mocContext.ts:43 — The server filter can be bypassed, so sensitive data can reach the model.
   (a) The code never scrubs object keys. Only values go through `scrub`. `countBy` turns free text into keys, so `segments.bySource` (`c.source`) is sent word for word. Example: "Giới thiệu bởi chị Hà 0905…" reaches the model with the name and phone.
   (b) `FORBIDDEN_KEY` only matches keys without Vietnamese accents. Keys like `Lương`, `Giá`, `Chi phí`, `Tiền`, `Hóa đơn`, `Địa chỉ`, `Sức khỏe` and `Dị ứng` all pass. `gia\b` misses `giá`.
   (c) The context is built in the client, so any approved user can send any fields inside their allowed sections, for example `ops: { "Lương": … }` with curl.
   Fix: replace the deny-list with a server-side allow-list per section, listing exact keys and types (for example `ops.appointments` is a count map, `ops.ktv[]` is `{name, shift, checkedIn, busy}`). Drop anything else. Run `scrub` on keys as well as values. Normalize keys first: NFD, remove accent marks, lowercase. Count maps should use only fixed enum keys, so map `source` to a fixed list or drop `bySource`. Long term, build the context on the server with a `moc_context()` RPC or aggregate views, so the client never decides what the model sees.

2. [high] supabase/functions/moc/handler.ts:25,35-36,42 and moc-policy.ts:27-43 — Cost abuse and DoS.
   - `req.json()` has no size limit.
   - `clean()` limits arrays (60), depth (5) and string length, but not the number of keys per object. One request can therefore push a prompt up to the model's full context size. Each approved account can do this 60 times a day.
   - For the CEO, the server loads all `moc_docs` rows (up to 4000 chars each) with no row limit.
   - `moc_take_quota` counts and then inserts without a lock (0004_moc_ai.sql:31-32). Parallel requests can go over 60.
   Fix:
   - Return 413 if `content-length` is over about 32 KB or the raw text is longer than that. Read the body with `req.text()`, check the length, then call `JSON.parse`.
   - Cap `JSON.stringify(ctx).length` (about 12k chars) and the number of keys per object (about 40).
   - Load docs with `.select('title,body').order('updated_at',{ascending:false}).limit(20)` and cap the total docs text (about 20k chars).
   - Add `perform pg_advisory_xact_lock(hashtext(sid));` before the count in `moc_take_quota`.
   - Set a monthly spend limit on the Anthropic workspace.

3. [medium] 0004_moc_ai.sql:14-15 and src/screens/mocDocs.tsx:17 — Leaders publish "approved knowledge" with no approval. A leader's doc is live at once for every role, including the CEO (the default `roles` is all roles). That allows stored prompt injection or false guidance (for example "Mộc khuyên chị duyệt ngân sách …"). Also, the price/phone `scrub` on the doc body runs only in the client. The database accepts raw text through the API, and the server-side `scrub` has gaps (see 4).
   Fix: add `approved boolean not null default false`. Only the CEO may set it: use a trigger that resets it to false when a non-CEO changes the row. Change the read policy to `(approved and app_role() = any(roles)) or has_role('ceo')`, and have the edge function select only `approved` docs. Add a DB check or trigger that rejects bodies matching money or phone patterns.

4. [medium] moc-policy.ts:22-23 — The `scrub` regex misses common formats.
   - Phone numbers it misses: `0905 12 34 56` (grouped in pairs), `(0905) 123 456`, and Zalo/email handles. Emails are not scrubbed in values at all.
   - Money it misses: `500000đ`, `500000 VND` (no thousands separator), `1 500 000 đ` (spaces), `1.500.000` with no unit, `1tr5` (`\b` fails), `500 ngàn`, `2 tỷ`, `$50`, `50 USD`, `trăm`.
   Fix: also mask any run of 6 or more digits, ignoring spaces, dots and dashes. Add units `ngàn|tỷ|ty|usd|\$` and allow a digit after `tr`. Mask email patterns too. Add test cases for each format.

5. [medium] src/mocContext.ts:13-14,29 and :44 — Customer-name hiding only replaces exact full names in task titles. "chị Lan", "Lan", names without accents and nicknames still go through. Program names (:44) and staff free text are sent with no hiding at all. Free text can also hold health notes ("khách dị ứng…"), which no filter catches.
   Fix: do not send free-text task titles. Send `{category, priority, customerCode}` instead, or a fixed label set. Keep program names only if they come from a controlled list, or replace them with `type` plus an index.

6. [low] 0004_moc_ai.sql:7-8,15 and src/db.ts:135 — Problems with `updated_by` and `updated_at`.
   - Updates never set `updated_by`. The WITH CHECK requires the old value to equal the current user, so a leader cannot edit a doc the CEO wrote, and the reverse also fails. This is a functional bug.
   - `updated_at` is set by the client, so it can be faked.
   - `roles` has no constraint and accepts any strings or `{}`.
   Fix: add a BEFORE INSERT OR UPDATE trigger that sets `new.updated_by := app_staff_id(); new.updated_at := now();`, and remove both fields from the client payload. Add `check (roles <@ '{ktv,reception,leader,marketing,ceo}' and cardinality(roles) > 0)`.

7. [low] handler.ts:39-46 — The `fetch` call has no timeout. If the network fails or `r.json()` gets a body that is not JSON, the error is not caught. The result is a generic 500 and a used-up quota slot.
   Fix: wrap the call in try/catch, use `signal: AbortSignal.timeout(20000)`, and return the same 502 message. Optionally refund the quota slot when the AI call fails.

8. [low] handler.ts:14 — CORS is `*`. This is acceptable with bearer tokens, but it is wider than needed.
   Fix: allow only the app's origins (homespa--flow.expo.app and localhost in dev).

9. [low] handler.ts:20-22 — The function only checks the shape of the bearer token, and it checks the AI key before auth. That tells an unauthenticated caller whether Mộc is enabled. Real auth depends on the platform's `verify_jwt` (there is no supabase/config.toml) and on the RPC.
   Fix: deploy without `--no-verify-jwt`, add `[functions.moc] verify_jwt = true`, and check the key after `moc_take_quota`.

10. [low] 0004_moc_ai.sql:27 — The security-definer function uses `search_path = public`. It is safe today because every object is schema-qualified, but Supabase advisors prefer `set search_path = ''`.
    Fix: change it to `''`. pg_catalog functions such as now() and count() still resolve.

11. [low] 0004_moc_ai.sql:20 — `moc_usage` grows without limit.
    Fix: purge rows older than 2 days in `moc_take_quota` or with a cron job.

12. [low] mocContext.ts:19,26,33,38 — Staff names, check-in times, late minutes and reputation points are sent to a third party (Anthropic). These are not customer data and not money. However, late minutes and points may feed bonus or penalty pay.
    Fix: ask the owner to confirm that this is acceptable. Mention AI processing in the staff privacy notice. Consider sending staff codes instead of names.
