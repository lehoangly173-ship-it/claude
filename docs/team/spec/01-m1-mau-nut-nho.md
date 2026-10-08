# m1-mau-nut-nho — Màu + chuyển mục + nút nhỏ (B, C1–C5, C6, nút 11)
sensitive: no

## Mục đích
Chỉnh màu theo 3 nhóm, đổi vị trí mục, làm các nút bấm-ra-chi-tiết nhỏ. Dựng i18n.ts đầu tiên.

## Màn hình / thay đổi
**Màu (B)** — thêm lớp màu dùng chung trong `styles.css` (mint = xanh nhạt, deep = xanh đậm `var(--green)` chữ trắng, gold = vàng) và prop `tone`/`color` cho `Tiles`/`Block`; không đổi bố cục.
- Hôm nay (`KtvHome`): thẻ Ca của tôi + Thứ tự tour = xanh nhạt; khối "Việc cần chú ý" = vàng.
- Ca/đổi ca/tour (`ShiftTourPage`): 3 thẻ = xanh nhạt; tiêu đề "SÁNG 08:00–18:00" và "CHIỀU 10:00–20:00" = xanh đậm (giả định 1); tiêu đề "Bảng chia ca 4 tuần" = xanh đậm.
- Dọn dẹp (`CleaningPage`): 4 ô số = xanh đậm; thanh "Ca sáng 08:00–18:00" = xanh nhạt.
- Thông báo (`NoticesPage`): nút "Đã đọc hết", tiêu đề/nhãn "Ghim từ Home", "Vừa xảy ra" = xanh đậm.
- Đối chiếu (`ProductsPage`): ô "Lượt xuất/nhận hôm nay", "Chưa đủ 2 bên xác nhận" = xanh đậm.

**C6 chuyển mục:** `App.tsx` TABS.ktv = Hôm nay · Khách hàng(`cust`) · Hỏi Mộc · Của tôi. `KtvWork`/tab `work` bỏ; "Công việc của kĩ thuật viên" (MyWorkScreen) thành nút số 4 trong Hôm nay (`home/work`). Nút "Khách hàng" bỏ khỏi Hôm nay. Sửa `route()` (customers/mywork/beds của KTV → đường mới); `BedsScreen` mở từ `home/work/beds`. Menu Hôm nay (11): 1 Ca 2 Dọn dẹp 3 Bảng điều phối 4 Công việc của KTV 5 Thông báo 6 Bill Money 7 Đánh giá 8 Đối chiếu 9 Nghỉ phép 10 Sự cố 11 Sáng kiến. Màn `cust` của KTV ở m1 vẫn dùng `KtvCustomersPage` hiện có (m4 mở rộng).

**C1:** 4 ô số Dọn dẹp bấm được (`Tiles onClick`) → Modal chi tiết: Khu của tôi = danh sách khu + trạng thái; Điểm hôm nay = các báo cáo + điểm từng khu; Chờ kiểm tra = báo cáo đang chờ (khu, giờ); Cần làm lại = báo cáo "Chưa đạt" + lý do. Trống → `<Empty>`.

**C2:** mỗi thông báo có nút "Đã đọc"/"Chưa đọc" (đảo trạng thái). Thêm `markUnread` trong store cạnh `markRead`. Badge Notif trên Hôm nay và nút số 5 cập nhật ngay.

**C3:** trong `ZoneModal` mỗi khu có nút "Tiêu chuẩn mẫu" → Modal xem tiêu chuẩn + dòng "Tệp tài liệu: Chưa nối". Ô tích "Tôi đã đọc nhiệm vụ" (lưu theo khu/ngày/KTV). Ô tích từng việc cần làm lưu vào store (không mất khi đóng modal).

**C4:** `ProductsPage`: 2 ô bấm được → danh sách sản phẩm cụ thể (tên, SL, KTV, giờ, ai xác nhận). Thêm "MỤC ĐÍCH NHẬN SẢN PHẨM" (chọn 1: Bán cho khách hàng / Dùng cho cơ sở). Nếu bán: ô "Bán cho ai" (bắt buộc) + nút tải hóa đơn (`PhotoInput`, bắt buộc). Lưu vào ProductLog.

**C5 nút 11:** thêm "Sáng kiến phát triển Home Spa" vào Nodes (mô tả: khách hàng · cơ sở vật chất · tay nghề · tinh thần tập thể), trang `home/idea` — m1 dựng trang khung + chữ "Chưa nối" cho đến khi m3 xong; ghi chú "dữ liệu sau này dùng chấm điểm uy tín".

## Tiêu chí nghiệm thu
- M1-01 Given KTV mở Hôm nay When xem Then thẻ Ca và Tour có lớp xanh nhạt, "Việc cần chú ý" lớp vàng.
- M1-02 Given trang Ca/tour Then 3 thẻ xanh nhạt; 2 tiêu đề SÁNG và CHIỀU cùng lớp xanh đậm; "Bảng chia ca 4 tuần" xanh đậm.
- M1-03 Given trang Dọn dẹp Then 4 ô số lớp xanh đậm, thanh Ca sáng xanh nhạt.
- M1-04 Given trang Thông báo Then "Đã đọc hết", "Ghim từ Home", "Vừa xảy ra" lớp xanh đậm. Đối chiếu: 2 ô xanh đậm.
- M1-05 Thanh tab KTV đúng 4 tab theo thứ tự Hôm nay, Khách hàng, Hỏi Mộc, Của tôi; không còn tab Công việc.
- M1-06 Menu Hôm nay có đúng 11 nút; nút 4 = Công việc của KTV mở MyWorkScreen; không có nút Khách hàng; nút 11 có.
- M1-07 Tab Khách hàng mở được danh sách khách (hiện có), link cũ `customers` điều hướng đúng.
- M1-08 Bấm từng ô trong 4 ô Dọn dẹp mở Modal đúng nội dung; số trên ô = số dòng trong Modal.
- M1-09 Bấm "Đã đọc" một thông báo: badge Hôm nay giảm 1 ngay; bấm "Chưa đọc": tăng lại 1.
- M1-10 "Tiêu chuẩn mẫu" xuất hiện ở mọi khu; mở được; ô "đã đọc" và ô tích việc còn nguyên sau khi đóng-mở lại.
- M1-11 Chọn "Bán cho khách" mà thiếu "Bán cho ai" hoặc hóa đơn → không lưu, báo lỗi; chọn "Dùng cho cơ sở" → không hiện 2 ô đó.
- M1-12 Màn Lễ tân/Leader/CEO mở trang dùng chung vẫn chạy, không lỗi console.
- M1-13 Chữ mới nằm trong `i18n.ts`; check.sh xanh.

## File nên sửa
`App.tsx`, `screens/staff.tsx` (KtvHome, KtvWork), `screens/daily.tsx` (Shift, Cleaning, Zone, Notices, Products), `screens/ktv.tsx`, `ui.tsx` (Tiles tone), `styles.css`, `store.tsx`, `data.ts`, `logic.ts`, mới `i18n.ts`.
