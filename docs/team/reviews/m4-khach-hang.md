VERDICT: PASS

Module m4-khach-hang (SENSITIVE), re-review: diff so với 7537495 (docs/team/diff.txt) + lỗi cũ.

Lỗi cũ:
1. [medium → đã sửa] homespa/src/ui.tsx:126-151 — KTV lại thấy 3 tab cũ + tab "Hồ sơ". Cổng ktvCanOpen vẫn chạy trước khi dựng modal (ui.tsx:129). Kiểm tra từng tab với vai KTV: "Thông tin": SĐT ghi "ẩn", không có "Tổng chi" (canSeeMoney), sinh nhật không năm. "Gói liệu trình": giá, đã đóng, còn thiếu đều chỉ hiện khi canSeeMoney; thẻ tiền hiện "thẻ tiền" thay cho số dư, và dòng trừ tiền (deducted/before/after) bị bỏ hẳn, không có trong DOM. Thẻ buổi vẫn hiện số buổi (đúng). "Chăm sóc & phản hồi": chỉ có sao, nội dung phản hồi, ghi chú; không có trường tiền hay SĐT. Phần đầu modal chỉ có VIP, nhóm, nguồn, lượt. Mỗi tab chỉ được dựng khi đang mở, không có thuộc tính ẩn nào chứa dữ liệu.
2. [low a → đã sửa] logic.ts:248 fold chạy toLowerCase trước. Có unit test "dang" → m4c.
3. [low b → chấp nhận, báo Ly] Khách mẫu m4a–m4j có gói và lần đóng tiền, nên cũng hiện ở màn Lễ tân/Leader/CEO và làm đổi các số tổng ở đó (doanh thu, số khách, công nợ gói). Mức chấp nhận được với bản demo: toàn bộ dữ liệu hiện tại đều là dữ liệu mẫu chưa nối backend, và màn "Khách hàng của tôi" cùng các dòng tiến triển đã có nhãn "số liệu mẫu". Cần báo Ly biết: các số tổng ở màn vai khác đã khác bản trước vì có thêm 10 khách mẫu này. Khi nối dữ liệu thật thì bỏ seed m4a–m4j.
4. [low c → đã sửa] customersCsv thêm dấu ' trước ô bắt đầu bằng = + - @. Có unit test.
5. [low d → đã sửa] Đã bỏ lớp .frow, dùng lại .row.

Lỗi mới:
6. [low] homespa/e2e/m4.spec.ts M4-05b/M4-08c — chỉ quét tab "Thông tin" và "Hồ sơ". Chưa có e2e nào bấm tab "Gói liệu trình" của một khách có thẻ tiền để chứng minh KTV không thấy số tiền ở đó. Code hiện đúng. — Sửa: thêm bước bấm tab "Gói liệu trình" (với khách có p.type==='money') rồi chạy cùng bộ lọc MONEY_RE.
