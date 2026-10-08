# FIX LẦN 1 — APP HOME KTV (Lark, tác giả Quyên Phạm Thị Lệ, cập nhật 08/10)
Nguồn: wiki Lark ZPglwn4onitq1AkM2JljKpswpyH (3 bảng sơ đồ, chép từ ảnh tổng; ⚠ = chữ nhỏ/mờ, cần Ly xác nhận).

## A. Nguyên tắc chung về màu (vai trò KĨ THUẬT VIÊN, nút HÔM NAY)
Mỗi màn hình là các nút lớn, dùng 3 màu: **xanh** = việc cấp độ vừa; **trắng** = bình thường; **vàng** = việc quan trọng.

## B. Chỉnh màu trên các màn hiện có (ghi chú trên ảnh chụp app)
- Hôm nay của tôi: các thẻ "Ca sáng 08–18", "Thứ tự tour" → nền xanh nhạt; khối "Việc cần chú ý" → nền vàng.
- Ca, đổi ca & thứ tự tour: 3 thẻ (ca hôm nay, thứ tự tour, giờ/điểm check-in) → xanh nhạt; chữ "SÁNG 08:00–18:00" → xanh đậm; "CHIỀU 10:00–20:00" → vàng.
- Bảng chia ca 4 tuần: tiêu đề "Bảng chia ca 4 tuần" → nền xanh đậm.
- Nhiệm vụ dọn dẹp: các ô số (Khu của tôi, Điểm dọn dẹp hôm nay, Chờ kiểm tra, Cần làm lại) và thanh "Ca sáng 08:00–18:00" → xanh nhạt/xanh đậm ⚠ (chi tiết từng ô khó đọc).
- Thông báo quan trọng, Đối chiếu sản phẩm: các ô số và đầu mục theo cùng quy tắc 3 màu ⚠.

## C. Chức năng cần thêm / sửa
1. **Nhiệm vụ dọn dẹp**: các nút KHU CỦA TÔI – ĐIỂM DỌN DẸP HÔM NAY – CHỜ KIỂM TRA – CẦN LÀM LẠI: khi bấm vào phải ra thông tin cụ thể.
2. **Thông báo quan trọng**: thêm nút "đã đọc / chưa đọc" cho từng đầu mục.
3. **Cửa sổ "Khu vực số 1 – Tầng 1 – giường gối"** ⚠: thêm nút tích "tiêu chuẩn mẫu" của mỗi khu (tài liệu mô tả công việc, nút tiêu chuẩn); tích khi đã đọc nhiệm vụ / nhắc cẩn trọng; tích vào việc cần làm.
4. **Đối chiếu sản phẩm** ⚠: bấm vào dòng XUẤT/NHẬN HÔM NAY mà CHƯA ĐỦ 2 BÊN XÁC NHẬN → ra thông tin sản phẩm cụ thể. Thêm nút "MỤC ĐÍCH NHẬN SẢN PHẨM" với lựa chọn: bán cho khách hàng / dùng cho cơ sở. Nếu bán cho khách → thêm ô ghi chú bán cho ai và nút tải đơn lên.
5. **Menu "Hôm nay" (đang có 10 nút) → thêm nút số 11: "SÁNG KIẾN PHÁT TRIỂN HOME SPA"** ⚠: KTV góp ý phát triển khách hàng, cơ sở vật chất, tay nghề, tinh thần tập thể…; sau này dùng dữ liệu này để chấm điểm uy tín.
6. **Chuyển mục**: chuyển mục mẹ "công việc của kĩ thuật viên" vào mục con thứ 4 của mục mẹ HÔM NAY; chuyển mục "khách hàng" từ mục con của Hôm nay ra thành mục mẹ của app.

## D. Luồng "Mẹ – Dọn dẹp KTV" (sơ đồ xanh)
Mẹ: Dọn dẹp KTV
- Con: Nhiệm vụ của tôi → Cháu: Nhiệm vụ theo khu vực → Chắt: Ảnh minh chứng | Chắt: Tiêu chuẩn và checklist → Chít: Chụp ảnh / Tải ảnh / Gửi báo cáo | Chít: Xem ảnh Home / Tích checklist.
- Con: Báo cáo đã gửi.
- Gửi báo cáo → **Hệ thống: AI kiểm tra** → 3 nhánh:
  1. Phát hiện lỗi rõ → AI nhắc dọn lại và báo đội phụ trách.
  2. Ảnh phù hợp tiêu chuẩn → báo kết quả cho KTV / Lễ tân / Quản lý.
  3. Không đủ căn cứ → chờ người kiểm tra → Lễ tân / Quản lý kiểm tra và nhắc.
- Cả nhánh 1 và 3 → **Con: Cần dọn lại** → Cháu: Nhiệm vụ cần làm lại → Chắt: Lỗi và yêu cầu sửa → Chít: Xem lỗi / Dọn lại / Gửi ảnh mới → quay lại bước AI kiểm tra (vòng lặp).

## E. Nút đóng góp ý kiến / phản hồi (làm 1 nút)
Chọn loại ý kiến: (1) cơ sở vật chất, (2) nhân sự / cấp trên, (3) khách hàng, dịch vụ, (4) ý kiến khác.
Luồng: chọn loại → NỘI DUNG Ý KIẾN → NGÀY THÁNG NĂM → GỬI (vẽ chi tiết cho loại 1; 3 loại còn lại giả định cùng luồng ⚠).
