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

---

## Re-review (after fixes, working tree)

VERDICT: PASS (0 critical, 0 high open). The only items left open are low or need an owner decision.

1. PASS — `SCHEMA` (moc-policy.ts:45-70) is now an exact allow-list: fixed keys and types, `hasOwnProperty`, enum-only count labels with `other: 'Khác'`, and unknown keys or sections dropped. Client-sent `docs` are no longer in `COMMON` (:80). Keys can no longer be used as a channel, and accented keys are dropped.
   - Residual [low]: the context is still built by the client. A malicious approved user could put customer text into free `str` fields (`me.name`, `ops.ktv[].name`, `stockLow[].item`, `tours[].service`) or a figure into a `num` field. This is the same channel as typing it into `q`, so it is accepted. The long-term fix is still a server-side `moc_context()` RPC.
   - Functional, not security: the `code` check (moc-policy.ts:95) requires at least one letter. Numeric customer codes from the seed data (`'125'`, `'628'`, `'77'`) are therefore dropped from `tours[].customerCode`. Use `/^[A-Za-z]{0,4}\d{1,8}$/`; with at most 8 digits it still cannot carry a phone number.
2. PASS — The body is capped at 32 KB (handler.ts:26-27). The schema bounds every array and string. Docs are limited to `approved` rows, `limit(20)` (:41). The quota uses `pg_advisory_xact_lock` (0004:68).
   - Residual [low]: `req.text()` buffers the whole body before the length check when there is no `content-length` (chunked upload). The platform request limit covers this. A streaming reader with a byte cap would be stricter.
   - Still recommended: a monthly spend cap on the Anthropic workspace (this is an operations step for Ly, not code).
3. PASS — The `approved` flag works. The BEFORE trigger forces `approved=false` for anyone who is not CEO, on both insert and update (0004:17-24). The edge function reads only approved docs. Non-CEO and non-leader roles see only approved docs for their own role.
   - Residual [low]: leaders can now read every doc, including ones whose `roles` exclude leader, such as CEO-only docs (0004:28). Accept this or limit it to `has_role('leader') and 'leader' = any(roles)`.
   - UX: mocDocs.tsx:19,29 shows "Duyệt" and sends `approved: true` for leaders too. The trigger silently resets it to false. Hide the button for non-CEO users.
4. PASS (partial) — Fixed: emails; any run of 9 or more digits with separators (covers grouped and bracketed phones); `đ/vnđ/ngàn/nghìn/triệu/tỷ/k/tr/1tr5/USD/$` (moc-policy.ts:83-86). Patterns were checked for catastrophic backtracking; the worst case is about quadratic on the 4000-char doc body, which is acceptable.
   - Residual [low]: plain thousand-separated numbers with no unit are still not masked: `1.500.000`, `300.000`, `1 500 000`. Neither are `50$`, `2 trăm nghìn`, or `5 trăm`. Approved docs, which the CEO checks, and `q` could carry prices written that way.
   - Fix: add `\b\d{1,3}(?:[.,\s]\d{3})+\b` and `\d+\s*\$`, plus `trăm` before the unit group.
5. PASS — Task titles were replaced by counts per priority or category. Program names were removed. `bySource` maps to the fixed list (mocContext.ts:27,42,41). The remaining free text is staff, service, zone and stock names only.
6. PASS — A trigger now sets `updated_by` and `updated_at` on the server, so client values are ignored. `roles` has a CHECK (cardinality 1-5, `<@` the allowed set). The functional bug where editing someone else's doc failed is gone.
7. PASS — Requests use an AbortController with a 25 s timeout, and every failure returns the same generic 502 with no internals (handler.ts:33-59).
   - Residual [low]: the timer is cleared before `r.json()`, so a body that streams slowly has no time limit. Clear the timer after `r.json()`.
8. PASS (config-dependent) — The origin now comes from `ALLOWED_ORIGIN` (handler.ts:17). It still falls back to `*` if the variable is unset. Set `ALLOWED_ORIGIN=https://homespa--flow.expo.app` when deploying.
9. PASS (accepted) — The bearer token needs at least 10 non-space characters. JWT checking relies on the platform default `verify_jwt` (documented). The AI key is still checked before auth, so the 503 tells callers whether Mộc is enabled. This is informational only.
10. PASS — `set search_path = public, pg_temp` with every object fully qualified is safe. Supabase advisors may still flag it; `''` would remove that warning.
11. PASS — `moc_take_quota` purges rows older than 2 days (0004:69).
12. OPEN (owner decision) — Unchanged. Staff names, check-in times, late minutes and reputation points still go to Anthropic. Ly should confirm this and mention it in the staff privacy notice.
