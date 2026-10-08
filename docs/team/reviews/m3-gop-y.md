VERDICT: PASS

Module m3-gop-y (SENSITIVE). Spec 03-m3-gop-y.md, test-plan M3 rows, diff.txt.

Bằng chứng tiêu chí: M3-01 unit `m3.test.ts` + e2e M3-01 · M3-02/03 unit suggestionError + e2e M3-02/03 (ô ngày có max=today, store kiểm lại khi ghi) · M3-04/07 e2e M3-04/07, M3-07 · M3-05 unit mySuggestions/inboxSuggestions + e2e M3-05 · M3-05a lọc ở dữ liệu (`inboxSuggestions` trong logic.ts, badge Leader dùng cùng selector) + unit + e2e M3-05a · M3-06 inboxSuggestions trả [] cho vai trò khác, trang chặn bằng isBoss + e2e M3-06 · M3-08 chữ mới ở i18n.ts.
Bảo mật: loại 2 không vào dữ liệu của Leader/Lễ tân/KTV khác, không có thông báo, không có export, không ghi SĐT khách, không cộng điểm uy tín. Giao diện: chỉ thay thẻ khung "Chưa nối" ở trang nút 11 và thêm 1 nút "Ý kiến KTV" cho Leader + CEO. Cả hai đều đúng spec.

Lỗi:
1. [low] homespa/src/screens/roles.tsx:57,172 — Badge "Ý kiến KTV" đếm tổng số ý kiến, không đếm ý kiến mới chưa xem, nên con số chỉ tăng mãi. — Sửa sau, khi có trạng thái đã xem. Đã đúng spec: Leader không đếm loại 2.
2. [low] homespa/src/logic.ts:98 — Ghi chú code nói "mới nhất trước" nhưng hàm không sắp xếp; thứ tự đúng chỉ vì store chèn mới lên đầu (unshift). — Sửa: sắp theo createdAt, hoặc bỏ câu trong ghi chú.
3. [low] homespa/src/screens/daily.tsx:219 — Gửi thành công thì cờ busy giữ nguyên true cho tới khi chọn loại mới. Hiện không lỗi vì form cũng bị đóng (setKind(null)). — Không bắt buộc sửa.
