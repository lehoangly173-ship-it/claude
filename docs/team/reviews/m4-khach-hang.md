VERDICT: FAIL

Module m4-khach-hang (SENSITIVE). Spec 04-m4-khach-hang.md + 00-overview G4–G14, R5/R7/R8. Diff docs/team/diff.txt.

Đã đạt (bằng chứng):
- KTV dữ liệu: ktvMatch/customerSegments/sortByBudget không đọc phone/totalPaid/finalPrice (unit test bẫy Proxy M4-08c; gõ SĐT → 0, M4-06a). referredBy ∩ G4 (M4-08a unit). Ngoài G4 + không tour → "Bạn không có quyền xem mục này" cho mọi đường mở vì chặn trong CustomerModal (M4-08b unit + e2e). Địa chỉ/SĐT "Ẩn", sinh nhật không năm (M4-08d). canSeePhone chỉ reception+ceo (M4-13 unit); Leader CustTable không SĐT; CEO thấy SĐT. CSV chỉ CEO (CeoExport kiểm role, e2e M4-07). sortByBudget đúng thứ tự (M4-04 unit). 5 tệp, sinh nhật theo tháng, A→B lỗi khi A>B, NN cùng component + "Khách đã đi" (M4-02/03/09/10/11). SĐT mẫu 0900 000 0xx (R8 unit). Chữ mới trong i18n T.cust.

Lỗi:
1. [medium] homespa/src/ui.tsx:155 (KtvCustomerModal, `if (user.role === 'ktv') return <KtvCustomerModal …/>`) — Thay đổi NGOÀI spec: modal khách của KTV bỏ hẳn 3 tab cũ "Thông tin / Gói liệu trình / Chăm sóc & phản hồi" → KTV mất "Sở thích" (lưu ý khi phục vụ), lịch "Hôm nay" của khách, lịch sử trừ buổi của gói và phản hồi khách. Spec chỉ yêu cầu thêm hồ sơ 9 trường và bỏ số tiền, Ly dặn giữ nguyên giao diện cũ. — Sửa: giữ modal cũ cho KTV (các tab cũ, vẫn ẩn tiền như canSeeMoney; với thẻ tiền thì thay "Còn X đ" bằng "thẻ tiền") và thêm tab "Hồ sơ" như các vai khác; giữ cổng ktvCanOpen phía trước.
2. [low] homespa/src/logic.ts:248 fold — 'Đ' hoa không đổi thành 'd' (replace chạy trước toLowerCase): gõ "dang" không tìm ra "Đặng Thùy Dung". — Sửa: toLowerCase trước rồi mới replace(/đ/g,'d').
3. [low] homespa/src/data.ts (m4a–m4j, budget/address/progress thêm vào c125, kl042, kl061) — khách mẫu mới có gói và lần đóng tiền nên cũng hiện ở màn Lễ tân/Leader/CEO và có thể đổi các số tổng ở đó; màn "Khách hàng của tôi" và mục tiến triển trong hồ sơ không có nhãn "số liệu mẫu". — Sửa: báo cho Ly biết; thêm nhãn T.cust.sample ở SubHead "Khách hàng của tôi".
4. [low] homespa/src/logic.ts customersCsv — ô bắt đầu bằng = + - @ có thể bị Excel chạy như công thức (chỉ CEO dùng). — Sửa: thêm dấu ' trước các ô này.
5. [low] homespa/src/styles.css:152 — thêm lớp `.frow` trùng y hệt `.row` (không đổi giao diện, chỉ để phục vụ selector e2e). Chấp nhận được, ghi lại để biết.
