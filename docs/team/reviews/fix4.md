# Review: commit c193d47 (Fix lần 4, 9 mục) — branch team/phan-quyen

VERDICT: FAIL (5 medium). No high issues. Reviewed by reading the current files (no git access in this session, so the diff itself was not replayed; period.ts "identical to before" is checked by reasoning + period.test.ts expectations, not by diffing).

## Spec coverage (9 items)
1. Hoa hồng sale gói (cashier): present (new/renew only, ≤ giá gói, ≥ 0, notify to recipient with nav me/income). Gaps below (#1, #2).
2. Thu nhập của tôi: hoa hồng % row removed; "Tiền tour" (Chưa nối) + "Hoa hồng sale gói" rows with Xem chi tiết; Tổng kết 1/2 năm chart + table. OK. Reception same minus tour row. Leader: LeaderSalary. Marketing: Chưa nối.
3. Hiệu suất: "So với tháng trước" arrows + Tổng kết chart for KTV, reception, marketing, leader; RowTrend under rows. OK (see #4).
4. CSKH: WhatsApp + TikTok added; new tệp "Khách nước ngoài lẻ đang cư trú tại Đà Nẵng"; stay from/to on new-customer forms + StayEditor in customer card + filters + migration 0005. OK.
5. Rename: reception tab = "Khách lẻ nước ngoài ở Đà Nẵng", Leader tệp = "Khách nước ngoài lẻ đang cư trú tại Đà Nẵng" (two different names for the same idea; align if Ly wants one).
6. Gộp ③: LeaderMoney table — math checked: costProd + (costFixed+salary) + (costOther−salary) = allCost, no double count. OK.
7. Leader Của tôi: Bảng lương + 8 criteria pages with indicators, scores "Chưa nối". OK.
8/9. Marketing/CEO grandchild pages: tree.tsx entities/cell changes reviewed; could not verify the Hỏi Mộc layout change from code alone.

## Issues

1. [medium] screens/cashier.tsx:95,201 — `helper` state is not cleared when `closer` is changed to the same person. Select options hide the closer, but state keeps `helper === closer`, so `closerIds` = [A, A] and two commission rows (Chốt chính + Hỗ trợ) go to the same person, and the "vượt giá bán" check counts both. Fix: in the closer onChange, `if (e.target.value === helper) { setHelper(''); setComHelp(0) }`; also reject `helper === closer` in `problem`.

2. [medium] supabase/migrations/0005_fix_lan_4.sql:9-10 + db.ts:84-94 + fix4.tsx:69 (and :276) — in the real build KTV (RPC ktv_packages) and Marketing never receive `commissions`, so "Hoa hồng sale gói" shows a real-looking "0 đ" and PerfTrend "Gói đã chốt" shows 0, instead of "Chưa nối". The notification is the only place the KTV sees the amount. Fix: when `!D.DEMO` and role is ktv, render `CN` for the commission row/summary (or add an RPC `my_commissions` that returns only the caller's rows) and show "Chưa nối" for pkgAll.

3. [medium] screens/fix4.tsx:180 (+ period.ts:133) — "Doanh thu thực tế" = lePart + prodPart + usedPkgValue. `isPkg(i)` puts the WHOLE paid amount of an invoice into pkgPart when it has any card line or a package sale, but the cashier allows mixing retail services + package sale/card lines on one invoice. The retail cash on those invoices is dropped from "thực tế" (undercount) and the same amount stays in "Tiền thu vào". Fix: split an invoice's `paid` into package part (`pkgCollect`, already on Invoice) and the rest (lePart); only the rest goes to lePart. Add a unit test (invoice with retail line + pkgSale: lePart = paid − pkgCollect).

4. [medium] screens/fix4.tsx:96,149,157 — charts plot `?? 0` for months with no data. Rating, show-rate, wait-avg (null = no data) are drawn as 0 bars; in the demo every past month of "Điểm TB khách đánh giá" is 0 (feedback only has recent daysAgo), and in the real build all past months of every metric are 0. A 0/5 rating bar is an invented number against the "Chưa nối" rule. Fix: pass `null` for no-data months and let ColChart skip/label them "Chưa nối", or drop those months from `cats`; keep the footnote.

5. [medium] screens/fix4.tsx (whole file, ~150 new user-facing strings), leader2.tsx:82,152, cashier.tsx:96-203, ui.tsx StayEditor — decisions.md (HOME SPA) says NEW text goes in `homespa/src/i18n.ts`; only the `T.stay` block was moved there. Fix: move the new labels (Row titles, notes, MONEY_KIDS, LEADER_EVAL, table headers, "Chưa nối" notes) into i18n.ts.

6. [low] screens/leader.tsx:311-317 — early `return`s (`sub[0]==='salary'|'eval'`) before `useState` (Rules of Hooks). It does not crash today only because `useStore` is a bare `useContext`; any hook added to `useStore`/above would throw "Rendered fewer hooks", and visiting salary resets MineScreen state. Fix: move the two `if` returns to a wrapper (`MineScreen` → `MineHome`), or place them after the hooks.

7. [low] screens/fix4.tsx:187,196-198 — "Trên 1 khách" is shown for "Công nợ gói" (a stock as of today divided by the selected period's guests) and for doanh thu thực tế over long periods; the number changes with the period for no business reason. Fix: show "—" in the per-guest cell of the Công nợ row.

8. [low] period.ts:120 vs fix4.tsx:181 vs settings.tsx:72 — "Lương cơ sở" is "Phí duy trì" only inside LeaderMoney (salary moved by subtraction), while period.ts keeps it in costOther and Settings lists it as "Phát sinh". Not a double count, but the definition lives in one screen. Fix: put 'Lương cơ sở' into the maintenance group in period.ts (one constant) and have both screens read it.

9. [low] screens/fix4.tsx:149 — `months = useMemo(() => lastMonths(n), [n])` does not depend on the working day (`setWorkDay` changes D.TODAY), so the 12/24-month axis goes stale after changing the date. Fix: add `useWorkDay()` value to the deps.

10. [low] screens/fix4.tsx:52,35 — `<input type="month">` on browsers without support (desktop Safari) lets partial text through (`"2026-1"`, `"abc"`): `monthRange` then produces Invalid Date and the label shows "Invalid Date". Fix: ignore values not matching /^\d{4}-\d{2}$/.

11. [low] store.tsx:268 / cashier.tsx:199 — commission is notified and stored even when the package is saved with 0 collected ("Chưa thu"); and the closer list includes marketing, who has no screen that shows the amount (4.9 = Chưa nối). Confirm the rule with Ly; at least filter closer/helper to ktv/reception/leader.

12. [low] tree.tsx:129 — `cell()` checks `e.cnt` keys with `c.includes(key)` before the rate rules, so a column such as "Tỷ lệ hoàn thành" on a Công việc page returns the count, not the %. Not present in current specs, but fragile; match whole column names.

13. [low] supabase/migrations/0005_fix_lan_4.sql:4 — `add constraint stay_order` is not idempotent (re-run fails). Fix: drop constraint if exists first.

14. [low] Process — homespa/dist/index.html already contains the new code (rebuilt in the working tree). decisions.md: dist is committed only by the Release step, never in team/* branches. Confirm with `git show c193d47 --stat` that dist is not part of the commit.

15. [low] Tests — fix4.test.ts is meaningful (stay edge cases, commission date filter, day-level = month totals, usedPkgValue, cell()). Missing: LeaderMoney sum check (keep + other + costProd = allCost), perfValue/monthPair on month ends (31 Mar vs 28 Feb), mixed invoice split (#3), helper==closer (#1).

## Checked and OK
- stayState/stayError/realDay: date-only compare via Date.UTC, same-day departure still "in", invalid dates (31/02) rejected, DB constraint matches.
- commissionsOf / usedPkgValue use the same day-number scale as dayNum (no time-zone drift); usage `at` format "dd/mm/yyyy · hh:mm" matches store.stamp.
- period.ts staffDays/staffMetrics: month totals are the sum of the day rows (same source for Income, Summary, StaffCompare); future days never iterated; real build returns null for past days (no sample data). payslip: tourPay null and not added to total.
- careGroup: left guests removed from all tệp; NN-lẻ needs stay 'in'; reception "Ghi CSKH" hidden for left guests; Leader does not see phone (canSeePhone unchanged: reception + CEO).
- KTV sees only own commissions/income (filter by staffId = me.id); notification addressed with `to:[staffId]`; no service_role key introduced; RLS: packages read stays reception/leader/ceo, only_cols trigger is a superset of the old list.
- Deleting an invoice removes the package and its commissions (store.tsx:394).
