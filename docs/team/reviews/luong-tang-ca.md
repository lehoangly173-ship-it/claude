# Review: luong-tang-ca (bảng lương CEO, tiền tour, tăng ca, điểm Leader, công nợ theo ngày)

VERDICT: FAIL (4 medium)

Phạm vi đã đọc: pay.ts, pay.test.ts, paySettings.tsx, 0006_luong_tour_tang_ca.sql, period.ts (staffDay/staffDays/staffMetrics), store.tsx (savePay/saveLeaderEval/hydrate), db.ts (normalizePay…), fix4.tsx (monthPay/IncomeBody/IncomeSummary/LeaderEval/LeaderSalary), leader2.tsx (LeaderDebt), logic.debtSummary, i18n.ts, settings.tsx/roles.tsx (route 13.10), mọi nơi gọi staffMetrics/staffDays/debtSummary.
Lưu ý: không có `docs/team/diff.txt` và không chạy được git/test (reviewer chỉ đọc); đọc thẳng file nguồn.

## Đúng (đã kiểm tra)
- payslip: tổng chỉ cộng khoản đã có đơn giá; khoản thiếu đơn giá vào `missing`, không cộng (pay.ts:94-123). Tiền tour chỉ tính appt done/paid (period.ts:246). Tour thiếu giá một loại: cộng loại đã có, ghi loại thiếu.
- Tăng ca: otOfDay đúng (ngưỡng, âm, chưa chấm công ra, vai trò không ca dùng giờ chuẩn); hôm nay lấy từ chấm công thật, ngày trước là mẫu có nhãn SAMPLE_NOTE. Bản thật ngày trước trả null (không bịa).
- Cấu hình lương là state toàn cục trong store (store.tsx:85), không theo ngày làm việc. Một nguồn cho Income / IncomeSummary / LeaderSalary / Marketing 4.9.
- Người gọi staffMetrics/staffDays chỉ truyền ktv/reception (timeDash.tsx:99, tree.tsx:111, fix4 perfValue) → số liệu cũ không đổi; thêm field `tourBy` không phá chỗ nào. debtSummary(s) không tham số giữ nguyên hành vi.
- LeaderDebt tách khỏi nhánh điều kiện: hooks gọi vô điều kiện, đúng. LeaderScoring: hooks đứng trước `return` sớm, đúng.
- SQL: RLS bật; pay_settings chỉ CEO đọc/ghi (policy `for all` + has_role('ceo')); leader_evals đọc = CEO hoặc chính Leader, ghi = CEO; my_pay_settings chỉ trả phần vai trò của người gọi (tour chỉ KTV, evalPerPoint chỉ Leader), anon gọi → null. Idempotent (if not exists, drop policy, DO-block bắt duplicate_object). Không có service_role ở client.
- savePay/saveLeaderEval kiểm quyền CEO ở client + RLS ở máy chủ; saveLeaderEval kiểm đúng Leader, định dạng tháng, điểm 1-10.

## Lỗi (high/medium làm FAIL)

1. [medium] src/screens/fix4.tsx:119 — cột "Thưởng" của Tổng kết: điều kiện `ps.bonus == null && ps.evalBonus == null` không bao giờ đúng với KTV/Lễ tân/Marketing vì `evalBonus` = 0 (không phải null) khi không phải Leader (pay.ts:118). Khi CEO chưa đặt "thưởng/điểm uy tín" mà nhân sự có điểm, ô hiện "0đ" thay vì "Chưa đặt" — vi phạm luật "không bịa số". Fix: tính ô theo `ps.bonus == null && (role !== 'leader' || ps.evalBonus == null)` (hoặc `role==='leader' ? … : ps.bonus`), và nên hiện "Chưa đặt" khi chỉ một trong hai thành phần của Leader bị null (hiện ô đang âm thầm bỏ phần null; tổng có dấu * nên chỉ lệch cột).

2. [medium] src/screens/paySettings.tsx:101 — `useEffect(..., [lid, ym, evals])` đặt lại điểm đang nhập (`setSc`) mỗi khi `evals` đổi tham chiếu. Ở bản thật `hydrate()` chạy mỗi 30 giây, khi quay lại tab và mỗi sự kiện realtime, và luôn `setEvals(ev)` bằng mảng mới (store.tsx:103) → CEO đang chấm dở 8 tiêu chí bị xóa điểm chưa lưu và xóa luôn thông báo lỗi. Fix: chỉ đặt lại khi đổi (lid, ym) hoặc khi nội dung bản ghi đã lưu đổi và người dùng chưa sửa (so sánh JSON như `dirty` ở PaySettings), không phụ thuộc vào tham chiếu mảng.

3. [medium] src/screens/paySettings.tsx:96-97 — `lid` khởi tạo một lần từ `leaders[0]?.id ?? ''`. Bản thật: lúc mở màn nếu danh sách nhân sự chưa tải (staff chỉ có chính CEO, store.tsx:63/101) thì `lid=''` mãi; với 1 Leader ô chọn Leader bị ẩn (`leaders.length > 1`, dòng 107) → bấm "Lưu điểm" ra lỗi "Người này không phải Leader", CEO không chấm được. Cũng xảy ra khi đổi ngày làm việc (emptyReal rồi hydrate). Fix: `const lidEff = leaders.some(x => x.id === lid) ? lid : (leaders[0]?.id ?? '')` và dùng `lidEff` cho mọi chỗ (rec, effect, lưu).

4. [medium] src/pay.ts:53-62,130-134,99-119 — chữ hiển thị MỚI nằm thẳng trong pay.ts: toàn bộ thông báo `payError`, `evalError` ("Cần đủ 8 tiêu chí"…), nhãn khoản thiếu trong `missing` ('lương cơ bản', 'giá tour 90 phút', 'điểm năng lực (CEO chưa chấm tháng này)'…) rồi hiện lên UI qua `T.pay.missing(...)` và vùng `role="alert"`. decisions.md dòng 7 yêu cầu chữ mới đặt trong src/i18n.ts. Fix: trả mã lỗi/khóa (hoặc đưa hàm tạo câu vào T.pay) và dịch ở i18n.ts; cập nhật pay.test.ts (đang so khớp regex tiếng Việt, dòng 21, 39, 73, 77-81, 95-100).

## Lỗi nhỏ (low, không làm FAIL)

5. [low] src/screens/paySettings.tsx:53 (+ parseDec dòng 13) — ô "Giờ làm chuẩn/ngày" là ô điều khiển (controlled) lưu số: gõ "8." → 8 → React ghi lại "8" nên không gõ được 8.5 / 8,5 (chỉ dán được); gõ chữ ra NaN hiển thị "NaN". Fix: giữ chuỗi nhập trong state riêng, parse khi lưu.
6. [low] src/screens/leader.tsx:352 (và comment fix4.tsx:252) — dòng mô tả từng tiêu chí vẫn ghi "điểm CEO chấm: Chưa nối" dù điểm đã nối (hiển thị sai khi CEO đã chấm). Fix: dùng điểm thật từ `evals` hoặc bỏ cụm này.
7. [low] src/db.ts:155 + 0006 SQL — `normalizePay` nhận `stdDays = 0` hoặc số âm từ máy chủ (`numOrNull(...)?? 26` không bắt 0) → pay.ts:98 chia cho 0 → tổng Infinity/NaN. Máy chủ không kiểm tra JSON `pay_settings.data` (chỉ client `payError`). Chỉ CEO ghi được nên rủi ro thấp; fix: clamp trong normalizePay (stdDays 1-31, tiền ≥ 0) và/hoặc CHECK/hàm kiểm ở SQL.
8. [low] src/pay.ts:137-140, 118 — điểm TB làm tròn 1 chữ số rồi mới nhân đơn giá (lệch tối đa 0.05×đơn giá/điểm, trước khi làm tròn nghìn); và TB chỉ tính tiêu chí đã chấm: chấm 1/8 tiêu chí vẫn ra thưởng đầy đủ. Cân nhắc nhân điểm chưa làm tròn, và/hoặc yêu cầu chấm đủ 8 (hoặc hiện "n/8 tiêu chí" cạnh thưởng ở phiếu lương).
9. [low] src/screens/fix4.tsx:61,88 — bản thật, KTV: hoa hồng ghi "Chưa nối" nhưng tổng lương không có dòng "Chưa cộng: hoa hồng" nên tổng có vẻ đầy đủ. Fix: thêm 'hoa hồng sale gói' vào `missing` khi `comHidden`.
10. [low] src/pay.ts:73 — Leader/Marketing đã có đơn giá tăng ca nhưng chưa đặt "giờ làm chuẩn" → tăng ca = 0 âm thầm, không vào `missing` (chỉ có dòng nhỏ trong chi tiết fix4.tsx:86). Nên thêm 'giờ làm chuẩn/ngày' vào danh sách chưa đặt khi `otPerHour != null && stdHours == null` và có ngày làm.
11. [low] 0006_luong_tour_tang_ca.sql:12-16,33-34,57 — khác quy ước 0001 (`revoke all … from anon`): bảng/hàm mới vẫn giữ quyền mặc định cho anon (RLS và app_role()=null chặn nên không lộ). Thêm `revoke all on public.pay_settings, public.leader_evals from anon;` và `revoke execute on function public.my_pay_settings() from anon;`.
12. [low] 0006 SQL: `audit_row` trừ cột `data` (0001:520) nên nhật ký pay_settings không lưu giá trị cũ/mới (chỉ biết có sửa); leader_evals có row_id null (khóa là leader_id). Chú thích "mọi thay đổi ghi nhật ký" hơi quá; nếu cần truy vết lương, ghi bản chụp vào bảng lịch sử. Upsert `ON CONFLICT DO UPDATE` không cập nhật `updated_by` (db.ts:168,175) → cột này giữ người tạo đầu tiên; truyền `updated_by` hoặc trigger `before update`.
13. [low] Realtime: sự kiện postgres_changes của pay_settings/leader_evals chỉ tới người qua RLS (CEO, Leader cho dòng của mình); KTV/Lễ tân/Marketing chỉ cập nhật qua tải lại 30 giây/khi quay lại app — "cập nhật ngay" (i18n pay.saved) chỉ đúng với CEO. Nên sửa câu hoặc chấp nhận.
14. [low] src/i18n.ts:358-359 — hai khóa F4 rác ("}Các tháng trước: {D.DEMO ? …", "}{d.points} điểm{d.real ? ") còn sót từ lỗi chuỗi hỏng; không dùng, nên xóa. fix4.tsx:76 còn `ngày` viết cứng (cũ). Không còn chữ 'f4(' rò ra UI (đã grep).
15. [low] src/store.tsx:251-254 — saveLeaderEval cho phép tháng tương lai (UI chỉ chặn bằng `max`). Thêm kiểm `ym <= ymOf(D.TODAY)`. leader2.tsx:114 — `t0/m0` của LeaderDebt tính lúc render nhưng `rg` khởi tạo một lần: đổi ngày làm việc khi đang mở trang thì khoảng mặc định cũ (không nghiêm trọng).
16. [low] Kiểm thử: pay.test.ts phủ tốt toán lương/tăng ca/điểm/normalizePay/debtSummary, nhưng chưa có test cho (a) savePay/saveLeaderEval bị từ chối khi không phải CEO, (b) RLS/hàm my_pay_settings (cần test SQL), (c) e2e "CEO lưu bảng lương → Thu nhập của KTV đổi ngay" và "đặt khoảng ngày ở ④ Công nợ" (test-plan.md chưa có mục lương). Nên thêm vào docs/team/test-plan.md và một e2e.

## Việc cần làm lại để PASS
Sửa 1-4 (và nên kèm 5, 7), chạy lại `npx tsc -p . --noEmit && npx vitest run`; gửi lại để soát phần đã sửa.

## Đã sửa sau rà soát (18/10)
- M1: cột Thưởng ở Tổng kết: khoản chưa đặt → "Chưa đặt"; Leader thiếu một phần → số đã có + " *".
- M2: chấm điểm Leader không còn bị xóa khi máy chủ cập nhật (chỉ nạp lại khi CEO chưa sửa dở; đổi Leader/tháng thì nạp lại).
- M3: Leader được chọn luôn trỏ tới Leader có thật kể cả khi danh sách nhân sự tải sau.
- M4: chữ lỗi + tên khoản "chưa cộng" chuyển vào `i18n.ts` (`T.pay.err`, `T.pay.miss`).
- Nhỏ: gõ được giờ lẻ (8,5); bỏ "điểm CEO chấm: Chưa nối" ở Của tôi; `normalizePay` chặn công chuẩn sai (không chia 0); KTV bản thật: hoa hồng Chưa nối có trong "Chưa cộng"; Leader/Marketing chưa đặt giờ chuẩn → ghi rõ trong "Chưa cộng"; `revoke anon`; máy chủ tự ghi `updated_by/updated_at` (trigger); không chấm điểm tháng chưa tới; xóa 2 khóa F4 rác.
- Giữ nguyên (có lý do): audit không lưu số lương (dữ liệu nhạy cảm, chỉ ghi ai sửa lúc nào); điểm TB làm tròn 1 chữ số rồi nhân — khớp đúng con số Leader nhìn thấy; người không phải CEO nhận bảng lương mới qua lần tải 30 giây (RLS chặn realtime bảng này với họ).
