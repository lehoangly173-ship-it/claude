# Sơ đồ trong tài liệu app HOME KTV / Lễ tân (đọc từ ảnh Lark)

## Sơ đồ 1 – "LÀM APP" (tổng quan, trong doc KTV)
- **LÀM APP** gồm 3 nhánh:
  1. **Tạo các nút mẹ, con, cháu, chắt, chít theo từng ngành, từng sơ đồ chi tiết nhất**
     - Dùng Figma hoặc ChatGPT site để minh họa giao diện. Mỗi ban ngành có 4 nút mẹ chính (dưới mỗi góc nhìn, 4 nút dưới đây sẽ là một trách nhiệm khác nhau, công việc khác nhau).
       → CEO toàn quyền nhìn thấy tất cả các giao diện; nhân sự chỉ thấy được 4 nút riêng lẻ, nhưng giới hạn kiến thức.
     - **Nút 1: HÔM NAY** (chứa toàn bộ thông báo đầu ngày, công việc cần xử lý)
       → Giao diện của lễ tân và kỹ thuật viên như nhau để lễ tân nhìn được giao diện của KTV biết mà phân tour khách; tuy nhiên lễ tân cao quyền hơn và có thêm phần CHỐT CA liên quan tới tiền kết và công việc.
     - **Nút 2: KHÁCH HÀNG** (data khách hàng cần chăm sóc của Home và kết quả cá nhân)
     - **Nút 3: HỎI ĐÁP MỘC** (cập nhật kiến thức, hỏi đáp vấn đề cá nhân hóa)
     - **Nút 4: CỦA TÔI** (theo dõi toàn bộ kết quả cá nhân, năng lực)
       → Giao diện: Kỹ thuật viên · Lễ tân · Leader quản lý · CEO
  2. **Quy định luật chạy luồng đến trong nền** (tích hợp các nút nền tảng quản lý, marketing vào app dùng nền chạy ngầm)
  3. **Luồng + luật + giao diện** → Sản phẩm test → Reset lại app, xuất dữ liệu cũ nhập vào

> Các sơ đồ lớn còn lại (lịch điều phối, luồng ca, mindmap lễ tân) là flowchart canvas chữ rất nhỏ; chưa chép được hết.

## Sơ đồ 2 – "NÚT MẸ 1: HÔM NAY" của KTV (luồng đầy đủ)
Luồng dọc gồm 9 khối đỏ, mỗi khối mở ra các bước xanh:

### 1. CA, ĐỔI CA VÀ STT TOUR HÔM NAY
Hiển thị ví dụ: *"Vân – ca sáng – đi tour thứ 1"*. Mở ra:
- **Bảng chia ca 4 tuần tới Home Spa** (bảng Excel nhúng: cột là ngày 14/9…20/9, hàng là tên KTV — Lan, Triều, Mai, Hương, Đồng, Quý, Vân, Khánh, Linh, Khang, Lam, Mỹ — ô ghi Sáng / Chiều / OFF).
- **Ca và số thứ tự tour trong ngày** → bảng *Lịch chia tour 20/9*: **SÁNG:** 1 Vân · 2 Đồng · 3 Linh · 4 Triều — **CHIỀU:** 5 Mai · 6 Hương · 7 Lan · 8 Khang.
- Ghi chú: *cài đặt ngầm thành viên ở bảng cài đặt CEO theo quy luật.*

### 2. NHIỆM VỤ DỌN DẸP
"Khu vực của bạn là số 1 – set". Mở ra **BẢNG TỔNG QUAN DỌN DẸP**:

**Ca sáng – bắt đầu 08h sáng đến 6h tối**
| Số | Khu vực |
|---|---|
| 1 | Tầng 1 + giường gội (nhấn vào để biết thêm chi tiết tiêu chuẩn ảnh và task nhiệm vụ) |
| 2 | Phòng 2 giường tầng 2 + kệ gội |
| 3 | Phòng CNC + kệ gỗ phía trước |
| 4 | Tầng 3 + phòng nghỉ nhân viên |
| 5 | Khu ngâm chân + khăn nóng |
| 6 | Bàn đá + nhà vệ sinh |

**Ca chiều – bắt đầu 10h sáng đến 8h tối**
| Số | Nhiệm vụ |
|---|---|
| 7 | Giặt khăn lần 1 — sau 10:00 |
| 8 | Giặt khăn lần 2 — sau 12:00 |
| 9 | Giặt khăn lần 3 — sau 15:00 |
| 10 | Giặt khăn lần 4 — sau 17:00 |
| 11 | Rác + hỗ trợ giặt |
| 12 | Khu giặt sấy + cây cối |

Ghi chú: *Lấy số từ thông báo điền vào, cho nhớ.*

Hai nhánh ra:
- **Báo cáo dọn dẹp** → "Hãy điền số khu vực của bạn là KHU VỰC: …" → **Nhấn vào đây** → **Khu vực số 1** (ảnh mẫu · nút tải ảnh) → *nhấn vào task việc nếu bạn…* → **xác nhận bắt kiểm tra** → **Thông báo hoàn thành hay chưa, số điểm đạt được**. (Tương tự có Khu vực số 2, số 3…)
- **Điểm số setup, dọn dẹp là** → **Tổng hợp báo cáo chi tiết qua bảng**.

### 3. BẢNG ĐIỀU PHỐI TOUR / LỊCH HẸN
→ link mẫu `https://lich-dieu-phoi-spa-dr-quyen.nyffd5j6sj.chatgpt.site` (ảnh giao diện: KTV đang gội 12 · đang chờ tour 3 · 8/19 giường đang dùng · 2 khách cần chăm sóc; tab Theo KTV / Theo phòng / Chia tour).

### 4. THÔNG BÁO QUAN TRỌNG
→ Cập nhật mới, đào tạo, lịch yêu cầu khách, điểm số chung…

### 5. BILL MONEY
→ Chọn ca… ngày… → Tải ảnh lên → *trường hợp không chụp ảnh được: báo quản lí kiểm lại hệ thống.*
Ghi chú: *đối soát tour mới ngầm bên dưới để xác nhận bill.*

### 6. ĐÁNH GIÁ GOOGLE, FACE
→ Tải ảnh lên. Ghi chú: *đối soát với tình trạng ảnh trên Google Map.*
*Bấm nút xác nhận 2 bên; nếu 2 bên không bấm nút xác nhận, bộ ảnh sẽ là điểm chốt để truy cứu. Riêng sản phẩm vẫn cần chụp ảnh xác minh để lục lại ảnh; 6 tháng — 1 năm cứ reset ảnh và giữ báo cáo 1 lần.*

### 7. ĐỐI CHIẾU SẢN PHẨM
→ Dầu, cao hổ, sữa chua…

### 8. XIN NGHỈ PHÉP
→ Điền biểu mẫu → *app CEO duyệt.*

### 9. BÁO CÁO SỰ CỐ
