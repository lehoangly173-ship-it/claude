# Test plan — FIX LẦN 1 KTV (lane M)

Công cụ: Vitest cho logic (`logic.ts`, `store.tsx`), Playwright trong `homespa/e2e/` cho giao diện (vai trò chuyển bằng dải "Demo — chuyển vai trò"). Mỗi ID khớp tiêu chí trong spec.

## Unit (Vitest)
| ID | Hàm | Kiểm tra |
|---|---|---|
| U-M2-11 | aiCheck | 0/5 và 2/5 → nhánh 1; 3/5, 4/5 → nhánh 3; 5/5 → nhánh 2; thiếu ảnh → lỗi |
| U-M4-04 | sortByBudget | giảm dần; hòa → firstVisit sớm trước; không ngân sách cuối |
| U-M4-09 | customerSegments | từng bộ lọc; KTV chỉ nhận khách của mình |
| U-M5-07 | pointsOf | tổng điểm đã duyệt |
| U-M5-06 | ktvPerf | số yêu cầu, ý kiến sáng tạo, báo cáo đúng |
| U-M1-09 | markRead/markUnread | readBy đổi 2 chiều, đếm chưa đọc đúng |

## E2E (Playwright) — theo module
**m1** (e2e/m1.spec.ts)
- E-M1-01..04: vào KTV, kiểm lớp màu (xanh nhạt/xanh đậm/vàng) bằng class trên các thẻ liệt kê.
- E-M1-05/06/07: đếm tab = 4 theo thứ tự; menu Hôm nay 11 nút; nút 4 vào Công việc; nút Khách hàng không còn; tab Khách hàng mở.
- E-M1-08: bấm 4 ô Dọn dẹp, số = số dòng modal.
- E-M1-09: bấm Đã đọc/Chưa đọc, badge ±1.
- E-M1-10: mở "Tiêu chuẩn mẫu", tích đọc + tích việc, đóng/mở lại còn tích.
- E-M1-11: Đối chiếu → Bán cho khách thiếu ghi chú/hóa đơn bị chặn; Dùng cho cơ sở không hiện 2 ô.
- E-M1-11a/11b (bảo mật): "Bán cho ai" gõ SĐT (có/không khoảng trắng) bị chặn; gợi ý chỉ mã/tên G4; KTV khác + Leader không thấy người mua/ảnh hóa đơn; nút tên "Chụp/đính kèm hóa đơn".
- E-M1-12: Lễ tân, Leader, CEO mở trang dùng chung không lỗi console.

**m2** (e2e/m2.spec.ts)
- E-M2-01..03: Mẹ + 3 Con; Chắt đủ nút Chít; gửi thiếu ảnh bị chặn.
- E-M2-04..06: ba kịch bản tích 2/5, 3/5, 5/5 → nhánh 1/3/2; đổi sang Lễ tân/Leader kiểm tra thông báo; sau Lễ tân bấm Đạt điểm đổi và tile cập nhật.
- E-M2-07: làm lại qua Con 3 → báo cáo mới, cũ còn ở Con 2.
- E-M2-08/09/10: có nhãn "Giả lập — Chưa nối AI thật"; khu người khác bị chặn; trạng thái trống.

**m3** (e2e/m3.spec.ts)
- E-M3-01..04: nút 11 → 4 loại; lặp luồng nội dung→ngày→Gửi cho từng loại; khóa Gửi khi rỗng; không chọn ngày tương lai; danh sách cập nhật ngay.
- E-M3-05/06: KTV khác không thấy; Leader + CEO thấy chỉ đọc; Lễ tân không có đường vào.
- E-M3-05a (bảo mật): gửi loại 2 → người gửi + CEO thấy; Leader (dòng + badge), Lễ tân, KTV khác không thấy.
- E-M3-07: điểm uy tín không đổi.

**m4** (e2e/m4.spec.ts) — SENSITIVE, chạy cả ba vai trò
- E-M4-01/02: 2 nút lớn; tab Tôi chốt có 2 nút con.
- E-M4-03: khoảng A→B (hợp lệ, A>B, xóa).
- E-M4-05: hồ sơ 9 trường đúng thứ tự.
- E-M4-06: KTV — chuẩn hóa text DOM (bỏ khoảng trắng/chấm/gạch) rồi regex `/(\+?84|0)\d{9}/` = 0; dò thuộc tính (title, aria-label, data-*, value, href tel:) = 0; so danh sách SĐT `data.ts` = 0; ở mục Khách hàng, hồ sơ, Board, Hôm nay, Công việc; Lễ tân + CEO thấy số (CEO cũng thấy ở danh sách cũ).
- E-M4-06a: KTV gõ SĐT mẫu vào mọi ô tìm/lọc → 0 kết quả; mã/tên trong G4 có, ngoài G4 không.
- E-M4-08a/08b: lọc khách giới thiệu chỉ trong G4 của KTV A; mở hồ sơ khách ngoài G4 → "Bạn không có quyền xem mục này", DOM không có dữ liệu khách.
- E-M4-08c: KTV — 0 chuỗi tiền ngoài ô Ngân sách; đổi `totalPaid` mẫu thì thứ tự không đổi. (Unit U-M4-08c: `customerSegments`/`sortByBudget` role ktv không đọc totalPaid/finalPrice/pkgPaid/pkgOwed.)
- E-M4-08d: KTV Địa chỉ "Ẩn", sinh nhật không năm; Lễ tân + CEO thấy địa chỉ.
- E-M4-07: KTV không có nút Xuất/Tải file; CEO có.
- E-M4-08: KTV A vs KTV B khác tập khách.
- E-M4-09..11: các bộ lọc lẻ, 5 tệp liệu trình, tìm mã, nhóm nước ngoài có "Khách đã đi" + sinh nhật trong bộ lọc, số nút = số dòng.
- E-M4-12/13: trạng thái trống; vai trò khác không hỏng.

**m5** (e2e/m5.spec.ts)
- E-M5-01: 8 nút; vai trò khác không đổi.
- E-M5-02a (bảo mật): hồ sơ đúng 6 trường, không ô CCCD/ngân hàng; Thu nhập chỉ KTV đó + CEO, Lễ tân/Leader/KTV khác 0 số.
- E-M5-02..04: lưu hồ sơ, Tuần/Tháng, chấm công và yêu cầu điều chỉnh.
- E-M5-05/06: 5 nhóm Hiệu suất đủ dòng, mỗi dòng có số hoặc "Chưa nối"; gửi góp ý (m3) → "ý kiến sáng tạo" +1.
- E-M5-08/09/10: không rò dữ liệu giữa hai KTV; lịch sử yêu cầu đúng trạng thái; trạng thái trống.

## Chạy
`scripts/team/check.sh` (tsc + vitest + build) rồi Playwright trên bản build; mỗi module QA xong mới sang module sau. Lỗi console, ảnh lỗi, chữ tràn ở 360 px = lỗi.
