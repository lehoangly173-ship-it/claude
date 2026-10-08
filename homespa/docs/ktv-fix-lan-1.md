# FIX LẦN 1 — APP HOME KTV (Lark, tác giả Quyên Phạm Thị Lệ, cập nhật 08/10)
Nguồn: wiki Lark ZPglwn4onitq1AkM2JljKpswpyH, chép từ 6 ảnh Ly gửi (09/10). ⚠ = chữ còn nhỏ/mờ, cần Ly xác nhận.
Vai trò: KĨ THUẬT VIÊN (KTV). Thứ tự làm đề xuất ở cuối file.

## A. Nguyên tắc chung về màu
Mỗi màn là các nút lớn, tối đa 3 màu: **xanh** = việc cấp độ vừa; **trắng** = bình thường; **vàng** = việc quan trọng.

## B. Chỉnh màu (ghi chú trên ảnh chụp app)
- Hôm nay của tôi: thẻ "Ca của tôi" và "Thứ tự tour" → nền xanh nhạt; khối "Việc cần chú ý" → nền vàng.
- Ca, đổi ca & thứ tự tour: 3 thẻ (Ca của tôi hôm nay, Thứ tự tour, Chấm công) → xanh nhạt; chữ "SÁNG 08:00–18:00" → nền xanh đậm; chữ "CHIỀU 10:00–20:00" → ghi "xanh đậm" nhưng ô ghi chú tô vàng ⚠ (xanh đậm hay vàng?); "Bảng chia ca 4 tuần" → chữ nền xanh đậm.
- Nhiệm vụ dọn dẹp: 4 ô số (2 Khu của tôi, 0 Điểm dọn dẹp hôm nay, 1 Chờ kiểm tra, 1 Cần làm lại) → nền xanh đậm; thanh "Ca sáng 08:00–18:00" → xanh nhạt.
- Thông báo quan trọng: chữ "Đã đọc hết", "Ghim từ Home", "Vừa xảy ra" → nền xanh đậm.
- Đối chiếu sản phẩm: ô "Lượt xuất/nhận hôm nay" và ô "Chưa đủ 2 bên xác nhận" → nền xanh đậm.

## C. Chức năng cần thêm / sửa (menu "Hôm nay" hiện có 10 nút: 1 Ca-đổi ca-thứ tự tour, 2 Nhiệm vụ dọn dẹp, 3 Bảng điều phối/lịch hẹn, 4 Khách hàng, 5 Thông báo quan trọng, 6 Bill Money, 7 Đánh giá Google-Facebook, 8 Đối chiếu sản phẩm, 9 Xin nghỉ phép, 10 Báo cáo sự cố)
1. **Nhiệm vụ dọn dẹp**: các nút KHU CỦA TÔI – ĐIỂM DỌN DẸP HÔM NAY – CHỜ KIỂM TRA – CẦN LÀM LẠI: bấm vào ra thông tin cụ thể.
2. **Thông báo quan trọng**: thêm nút "đã đọc / chưa đọc" cho từng đầu mục.
3. **Cửa sổ "Khu vực số 1 – Tầng 1 + giường gối"**: tạo nút tên **"Tiêu chuẩn mẫu"** của mỗi mục (nơi chứa file tài liệu mô tả công việc; bấm vào để xem); nút tích khi đã đọc nhiệm vụ; nhân sự làm xong thì tích vào việc cần làm.
4. **Đối chiếu sản phẩm**: bấm vào lượt XUẤT/NHẬN HÔM NAY và CHƯA ĐỦ 2 BÊN XÁC NHẬN → ra thông tin sản phẩm cụ thể. Thêm nút **"MỤC ĐÍCH NHẬN SẢN PHẨM"**: bán cho khách hàng / dùng cho cơ sở. Nếu bán cho khách → thêm ô ghi chú bán cho ai + nút tải hóa đơn lên.
5. **Thêm nút số 11 "SÁNG KIẾN PHÁT TRIỂN HOME SPA"**: góp ý phát triển khách hàng, cơ sở vật chất, tay nghề, tinh thần tập thể…; sau này dùng dữ liệu để chấm điểm uy tín.
6. **Chuyển mục**: mục mẹ "công việc của kĩ thuật viên" → vào mục con thứ 4 của mục mẹ HÔM NAY; mục "khách hàng" từ mục con của Hôm nay → ra thành mục mẹ của app.

## D. Luồng "Mẹ – Dọn dẹp KTV"
Mẹ: Dọn dẹp KTV
- Con: Nhiệm vụ của tôi → Cháu: Nhiệm vụ theo khu vực → Chắt: Ảnh minh chứng → Chít: Chụp ảnh / Tải ảnh / Gửi báo cáo; Chắt: Tiêu chuẩn và checklist → Chít: Xem ảnh Home / Tích checklist.
- Con: Báo cáo đã gửi.
- Gửi báo cáo → **Hệ thống: AI kiểm tra** → 3 nhánh:
  1. Phát hiện lỗi rõ → AI nhắc dọn lại và báo đội phụ trách.
  2. Ảnh phù hợp tiêu chuẩn → báo kết quả cho KTV / Lễ tân / Quản lý.
  3. Không đủ căn cứ → chờ người kiểm tra → Lễ tân / Quản lý kiểm tra và nhắc.
- Nhánh 1 và 3 → **Con: Cần dọn lại** → Cháu: Nhiệm vụ cần làm lại → Chắt: Lỗi và yêu cầu sửa → Chít: Xem lỗi / Dọn lại / Gửi ảnh mới → quay lại bước AI kiểm tra.
- (Ngoài ra "Mẹ" cũng nối thẳng xuống "Con: Cần dọn lại".)

## E. Nút Đóng góp ý kiến / phản hồi (1 nút)
Chọn loại: (1) Ý kiến về cơ sở vật chất, (2) nhân sự / cấp trên, (3) khách hàng – dịch vụ, (4) ý kiến khác.
Luồng vẽ cho loại 1: NỘI DUNG Ý KIẾN → NGÀY THÁNG NĂM → GỬI. 3 loại còn lại không vẽ tiếp ⚠ (giả định cùng luồng).

## F. Mục KHÁCH HÀNG (nút mẹ "Khách hàng" trong KTV → "Khách hàng của tôi" và "Khách Home Spa")
**Màn "Khách hàng của tôi" (đã có trong app mẫu):** 3 ô đếm + 3 tab: *Tôi đã chăm sóc* | *Yêu cầu tôi* | *Tôi chốt liệu trình*; bộ lọc: Tất cả | Khách lẻ | Liệu trình | Số lần ≥.
- Lưu ý: ở mục **Tôi chốt liệu trình**, khi bấm vào xuất hiện thêm 2 nút: **"Khách lẻ tôi chốt"** và **"Khách liệu trình tái tục tôi chốt"**. Mọi mục này đều chọn được khoảng thời gian A → B (nút chọn thời gian, ví dụ 25/9/2026–28/11/2026).

**Hồ sơ khách (các trường):** 1 Tên; 2 Địa chỉ; 3 Sinh nhật; 4 SĐT ẩn; 5 Lịch sử nhân viên CSKH và báo cáo tiến triển (lần 1, lần 2…, chốt thẻ) ⚠; 6 Ngân sách; 7 Triệu chứng đau / tiến triển hiện tại (cho khách đánh giá sau 4 ngày trị liệu) ⚠; 8 Nguồn; 9 Quét mã QR CSKH chưa (cá nhân hóa chăm sóc bằng AI) ⚠.
**Quy tắc bảo mật (khớp CLAUDE.md):** KTV và các ban ngành khác bị ẨN SĐT; chỉ Lễ tân được thấy; không ai được xuất file trừ CEO.
**Danh sách** xếp ngân sách giảm dần theo thứ tự xưa → nay ⚠.

**Khách Home – KHÁCH LẺ VIỆT:**
- Bộ lọc số lần (1-2-3… lần), số tiền, lọc 1 lần, nguồn khách → ra danh sách lớn hơn / nhỏ hơn.
- Khách lâu chưa quay lại (bộ lọc thời gian).
- Sinh nhật khách lẻ (bộ lọc thời gian theo tháng).
- Khách lẻ có phản hồi chưa hài lòng.
- Khách lẻ giới thiệu khách (danh sách khách được giới thiệu / 1 KH lẻ).

**Khách Home – KHÁCH LIỆU TRÌNH VIỆT CÓ MÃ** (có ô "Tìm mã KH"): 1 Đã cọc, còn thiếu; 2 Đã hoàn thành; 3 Khách còn 2 buổi cuối; 4 Khách còn buổi cuối cùng; 5 Khách đã hết liệu trình; Sinh nhật khách liệu trình (lọc theo tháng); Khách liệu trình có phản hồi chưa hài lòng. Bộ lọc thời gian "khách lâu chưa quay lại" áp dụng cho các tệp 1–5 ⚠.

**KHÁCH NƯỚC NGOÀI:** cấu trúc y hệt khách Việt (Khách lẻ nước ngoài + Khách liệu trình nước ngoài có mã). Có 2 ô lẻ "Khách hàng đi" và "Sinh nhật khách" chưa nối vào đâu ⚠.

## G. Mục "CỦA TÔI" của KTV (sơ đồ cây)
- Hồ sơ cá nhân (điền biểu mẫu khi nhập app): họ tên, mã nhân viên, ảnh đại diện; chi nhánh / bộ phận; ngày vào làm; thông tin cá nhân cơ bản.
- Lịch làm việc của tôi: ca hôm nay; lịch tuần / tháng; lịch đổi ca; ngày nghỉ đã đăng ký.
- Chấm công của tôi: giờ vào/ra; đi trễ / về sớm; ngày công; lịch sử chấm công; yêu cầu điều chỉnh chấm công.
- **Hiệu suất KTV** (sơ đồ riêng, 5 nhóm ⚠ chữ nhỏ):
  1. Chuyên môn & khách hàng: điểm TB khách đánh giá; số khách yêu cầu; đánh giá chấm điểm chuyên môn; best saler / tỉ suất % sale; số lượt KH phục vụ; tổng số giờ phục vụ khách.
  2. Tăng trưởng KH: KH mới phục vụ; khách mới quay lại; KH mới mua liệu trình; KH cũ tái tục liệu trình.
  3. Tinh thần làm việc: set up dọn đẹp đúng; ý thức đúng giờ; nhận tăng ca; chấp hành quy trình; chuyên cần; tinh thần học tập.
  4. Văn hóa ứng xử: được KTV/lễ tân bầu chọn là người yêu thích nhất; được cấp trên bình chọn.
  5. Sáng tạo – đổi mới: có ý kiến sáng tạo; giúp đỡ Home.
- KPI – Điểm uy tín: điểm hiện tại; điểm tăng/giảm; lý do thay đổi; KPI đạt/chưa đạt; lịch sử điểm; gợi ý cần cải thiện.
- Đào tạo & phát triển: khóa học đang học; video/SOP cần xem; bài test; kết quả kiểm tra; kỹ năng đã đạt; kỹ năng cần cải thiện; lộ trình phát triển cá nhân.
- Thu nhập của tôi: lương cơ bản; công thực tế; hoa hồng; thưởng; phạt; tổng thu nhập dự kiến; phiếu lương từng tháng.
- Yêu cầu & lịch sử cá nhân: xin nghỉ; đổi ca; điều chỉnh chấm công; báo sự cố; góp ý/phản hồi; lịch sử các yêu cầu đã gửi và trạng thái xử lý.

## H. Thứ tự làm đề xuất
1. Chỉnh màu (B) + chuyển mục (C6) + các nút nhỏ (C1–C5, nút đã đọc/chưa đọc, tiêu chuẩn mẫu, mục đích nhận sản phẩm, nút 11).
2. Luồng dọn dẹp (D) — phần AI kiểm tra làm giả lập, ghi "Chưa nối".
3. Nút đóng góp ý kiến (E).
4. Mục Khách hàng (F), rồi khách nước ngoài (cùng khung).
5. Mục "Của tôi" (G) + Hiệu suất KTV.
Số liệu chưa có thì ghi "Chưa nối"; số mẫu ghi "số liệu mẫu" (đúng quy tắc CLAUDE.md).
