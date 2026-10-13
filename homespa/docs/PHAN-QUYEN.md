# Phương án phân quyền thật — HOME SPA Flow

Trạng thái: **đã làm xong phần nền, CHƯA phát hành**. Code nằm ở nhánh `team/phan-quyen`; bản web đang chạy vẫn là bản demo cũ.

## 1. Cách hoạt động

| | Bản demo (hiện tại) | Bản thật (đã chuẩn bị) |
|---|---|---|
| Vào app | Mở link là vào | Đăng nhập Google hoặc link qua email |
| Vai trò | Dải "Demo — chuyển vai trò", ai cũng đổi được | Cố định theo tài khoản, do **CEO duyệt và gán**; máy người dùng không sửa được |
| Kiểm quyền | Chỉ ở giao diện | **Ở máy chủ (RLS)**: kể cả gọi thẳng API cũng bị chặn. Giao diện kiểm thêm lớp 2 |
| Tua giờ, khôi phục dữ liệu mẫu | Có | Không |

App tự chọn chế độ: build **có** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` → bản thật; không có → demo.

Luồng tài khoản: nhân viên đăng nhập → gửi "Xin tham gia" (chọn vai trò, không được xin CEO) → CEO vào **Của tôi → Nhân viên** → Duyệt (chọn vai trò) / Từ chối / Đổi vai trò / Khóa. Mọi thao tác ghi nhật ký.

## 2. Ma trận quyền (thực thi ở máy chủ)

Đ đọc · T tạo · S sửa · D duyệt · "mình" = chỉ của bản thân.

| Dữ liệu | KTV | Lễ tân | Leader | Marketing | CEO |
|---|---|---|---|---|---|
| Hồ sơ khách | Đ khách có tour/ghi nhận/gói của mình | Đ T S | Đ T S | Đ | Đ T S, xóa |
| **SĐT, địa chỉ** | — | Đ T S | — | — | Đ T S |
| Tìm theo SĐT | — | khớp đủ số | — | — | khớp đủ số |
| Sức khỏe khách | Đ khách của mình | Đ T S | Đ T S | — | Đ T S |
| Tổng chi của khách | — | Đ | Đ | — | Đ |
| Lịch hẹn | Đ của mình; nhận/xong tour qua hàm | Đ T S | Đ T S | Đ | Đ T S |
| Hóa đơn | — | Đ, T của mình, **xin xóa** (không sửa tiền) | Đ T | — | Đ, S, duyệt xóa |
| Gói liệu trình | số buổi còn (không thấy giá) | Đ T S | Đ T S | — | Đ T S |
| Ghi nhận chăm sóc | T khách mình làm **hôm nay**, Đ của mình | Đ T | Đ T | — | Đ T |
| Kho | Đ/T phiếu của mình (chờ duyệt) | Đ T (chờ duyệt) | Đ T, D phiếu người khác | — | Đ T D |
| Chi tiêu | — | T, Đ phiếu mình nhập | Đ T S | — | Đ T S |
| Chấm công | vào/ra theo **giờ máy chủ** | như KTV | Đ, chỉnh người khác | như KTV | Đ, chỉnh |
| Nghỉ phép / đổi ca | gửi đơn của mình | như KTV | D (không tự duyệt) | như KTV | D (không tự duyệt) |
| Điểm uy tín | Đ của mình | đề xuất (chờ duyệt) | T, D (không cho mình) | — | T, D |
| Phiếu lương | Đ của mình | Đ của mình | Đ | Đ của mình | Đ T S |
| Cài đặt | Đ | Đ | Đ | Đ | **S** |
| Ảnh mẫu | Đ | Đ | S | Đ | S |
| Ảnh minh chứng | tải vào thư mục mình, Đ của mình | Đ | Đ | — | Đ |
| Ngày đã qua | chỉ xem | chỉ xem | ghi | chỉ xem | ghi |
| Tài khoản & vai trò | — | — | — | — | **duyệt, đổi, khóa** |
| Nhật ký thao tác | — | — | — | — | Đ (không ai sửa/xóa) |

Thêm: không ai sửa được cột ngoài phần được phép (VD duyệt đơn chỉ đổi trạng thái); nhật ký không chứa SĐT/sức khỏe; ảnh để riêng tư, tối đa 5MB, chỉ nhận định dạng ảnh.

## 3. Đã kiểm tra
- `supabase/test/rls.test.ts`: chạy migration thật trên Postgres giả lập, đăng nhập từng vai trò rồi thử đọc/ghi: **20/20 đạt**. Có cả các kiểu gian lận: tự nâng quyền, sửa tiền qua "xin xóa", chiếm đề xuất điểm, tự duyệt phiếu kho, khai giờ chấm công, giả email.
- Bản build thật thử với máy chủ giả: chưa đăng nhập → chỉ thấy màn đăng nhập; chưa duyệt → form xin tham gia; KTV vào không có dải demo; CEO duyệt gọi đúng hàm máy chủ.
- 2 người rà soát bảo mật độc lập. Lỗi họ tìm ra đã sửa hết: 2 high, 3 medium, các low chính. Báo cáo: `docs/team/security-phan-quyen.md`.
- Bản demo vẫn chạy y như cũ (toàn bộ kiểm tra luồng, số liệu đạt).

## 4. Việc còn lại để phát hành (theo thứ tự)
1. **Ly tạo dự án Supabase** (miễn phí). Mình hướng dẫn từng bước; Ly giữ mật khẩu, mình không cần biết. Bật đăng nhập Google, thêm link app vào "Redirect URLs".
2. Chạy file `supabase/migrations/0001_phan_quyen.sql` trên dự án đó. Tạo dòng CEO đầu tiên cho chị Quyên. Chạy Supabase Advisors (security).
3. **Nối dữ liệu nghiệp vụ** vào các bảng (khách, lịch, hóa đơn…). Hiện bản thật vẫn hiện số liệu mẫu trong máy (có ghi chú trên màn). Khi nối xong mới bỏ dữ liệu mẫu khỏi bản build.
4. Thông báo: chỉ chấp nhận đường dẫn trong app. Xuất file khách làm ở máy chủ, chỉ CEO, có ghi nhật ký. Ảnh: xóa thông tin vị trí (EXIF) trước khi tải lên.
5. Nhập nhân sự thật, chạy thử 1–2 ngày với vài người. Ly duyệt rồi mới phát hành.

**Không làm:** không để service_role key hay khóa trả phí ở app. App chỉ giữ anon key (công khai được vì RLS chặn).
