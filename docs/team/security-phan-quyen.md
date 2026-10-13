# Rà soát bảo mật & phân quyền — HOME SPA Flow (bản DEMO)

Chỉ đọc code: `homespa/src/{data.ts,logic.ts,store.tsx,ui.tsx,App.tsx,screens/*}`. Không sửa gì.

## 1. Rủi ro hiện tại nếu link web bị lộ

1. [medium] `data.ts` SEED_* nằm hết trong `dist/index.html`: 27 khách (tên, SĐT, ngày sinh, địa chỉ, **tình trạng sức khỏe**, tổng chi, gói và tiền đã đóng), hóa đơn, chi tiêu (mặt bằng 25tr…), phản hồi, điểm uy tín, nghỉ phép. Hiện là **số liệu mẫu** (SĐT giả 0900 000 0xx, địa chỉ "Mẫu"), nên chưa lộ dữ liệu thật. Cách xử lý: tuyệt đối không nhập dữ liệu thật vào SEED; bản thật không đóng gói SEED vào bundle.
2. [high] Dải "Demo — chuyển vai trò" (`App.tsx:111`, `DEMO = true` ở `data.ts:173`): ai mở link cũng thành CEO, xuất CSV, duyệt mọi thứ. Không sao với dữ liệu mẫu, nhưng **cấm** dùng bản này cho dữ liệu thật. Bỏ `DEMO` bằng cờ lúc build, đặt mặc định là tắt.
3. Ra ngoài máy: không có localStorage/sessionStorage, không fetch/XHR, không console.log, không có script theo dõi. Dữ liệu chỉ nằm trong RAM, tải lại trang là mất. URL không chứa dữ liệu. → Đạt.
4. XSS: không có `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`href` động. Ảnh chỉ hiện khi là `blob:` hoặc `data:` (`ui.tsx:133,143`); SVG mẫu đã lọc `<&`. CSV đã chặn công thức Excel (`logic.ts:431`). → Đạt.
5. [low] Tải file lên: chỉ `accept="image/*"`, `URL.createObjectURL`, không gửi đi đâu. Chưa giới hạn dung lượng, chưa xóa EXIF/GPS, chưa `revokeObjectURL` (rò bộ nhớ). Bản thật cần kiểm tra MIME và dung lượng ở server, xóa EXIF.
6. [low] KTV mở "Lịch điều phối" (`daily.tsx:243` dùng ScheduleScreen của lễ tân) sẽ thấy tên và ghi chú (VD "Đau cổ vai gáy") của khách mọi KTV, trái quy tắc "KTV chỉ xem dữ liệu của mình". Ô tìm khách ở Thu ngân và Lịch mới (`cashier.tsx:159`, `ops.tsx:236`) **tìm được theo SĐT**. Leader/Marketing vào được các màn này qua `home/ops/*`, nên gõ số điện thoại vào là biết số đó của khách nào.

## 2. Ma trận quyền (đúng như app đang làm — toàn bộ chỉ chặn ở client)

Ký hiệu: Đ đọc · T tạo · S sửa · X xóa/duyệt · "mình" = chỉ dữ liệu của bản thân · — = không có.

| Dữ liệu | KTV | Lễ tân | Leader | Marketing | CEO |
|---|---|---|---|---|---|
| Khách (hồ sơ) | Đ khách G4/tour của mình (`ktvCanOpen`), sinh nhật không có năm, ẩn tiền | Đ T | Đ (cả tổng chi) | Đ thống kê nguồn/nhóm khách | Đ T |
| SĐT, địa chỉ khách | — (`canSeePhone`) | Đ | — (nhưng tìm theo SĐT được) | — | Đ, xuất CSV |
| Ghi nhận chăm sóc (CareNote) | T khách mình phục vụ hôm nay; Đ khách G4 | Đ, T ghi chú | Đ T | (không chặn) | Đ |
| Lịch hẹn / hàng chờ | Đ của mình, **nhưng xem được lịch toàn Home** | Đ T S hủy | Đ T S | Đ T S (route ops) | Đ T S |
| Hóa đơn | — | T, xin xóa | Đ T | (không chặn) | Đ, X duyệt xóa |
| Gói liệu trình / số dư đầu kỳ | Đ số buổi, ẩn giá | T bán/đóng tiếp, `importOpening` | T | (không chặn) | Đ T |
| Kho | Đ/T phiếu nhận SP của mình | T nhập/xuất/bán | X duyệt | — | X duyệt |
| Chi tiêu | — | T (`addExpense` không kiểm vai trò) | Đ | — | Đ |
| Chấm công | T mình, xin điều chỉnh | T mình | Đ cả nhóm | T mình | Đ |
| Nghỉ phép/đổi ca | T mình | T mình | X duyệt (không tự duyệt đơn mình) | T mình | X |
| Điểm uy tín | Đ mình | T đề xuất (chờ duyệt) | T trực tiếp, X | — | T, X |
| Lương | — | — | Đ (Chưa nối) | — | Đ |
| Thông báo | Đ theo `canSee` (role/to) | như KTV | + ghim, mức ưu tiên | Đ | + mặc định ưu tiên |
| Cài đặt (phân khu, quy tắc) | — | — | — | — | S (`setZoneOwner` không kiểm vai trò) |
| Ảnh mẫu | Đ | Đ | S X | Đ | S X |
| Ảnh minh chứng (dọn, bill, review, SP) | T mình | Đ, X đối soát | Đ X | — | Đ X |
| Ngày cũ | chỉ xem | chỉ xem | ghi | chỉ xem | ghi (`blocked()` ở client) |
| Duyệt tài khoản/vai trò | — | — | — | — | X (`decide` join) |

Các hàm không kiểm vai trò, ai gọi cũng được: `confirmInvoice`, `importOpening`, `addExpense`, `addStock`, `setZoneOwner`, `setFeedback`, `addCare/logCare`, `addTask/transferTask`, `fixXp`, `reset`, `advance`.

## 3. Khuyến nghị cho bản thật

1. **[critical] Đăng nhập:** dùng Supabase Auth với Google OAuth (đúng thiết kế "xin tham gia"). Phiên dùng JWT ngắn hạn kèm refresh token; điện thoại dùng chung thì phải đăng xuất khi hết ca. Bỏ hẳn dải demo, giờ mô phỏng và nút khôi phục dữ liệu mẫu.
2. **[critical] Vai trò:** lưu ở bảng `staff(user_id, role, branch_id, active)`, client **không được ghi**. Tài khoản mới vào `join_requests`; chỉ CEO duyệt qua RPC `security definer` (kiểm `auth_role()='ceo'`) để gán vai trò. Hàm `auth_role()` đọc từ bảng `staff`, không đọc từ `user_metadata` vì người dùng tự sửa được trường này.
3. **[critical] RLS bật cho mọi bảng.** Đi theo ma trận ở mục 2, kèm các điểm sau:
   - KTV chỉ đọc khách có lịch hẹn, ghi chú chăm sóc hoặc gói do mình chốt. Logic G4 làm thành view hoặc hàm ở server, không lọc ở client.
   - Ghi nhận chăm sóc: KTV chỉ insert khi có lịch hẹn `in_service/done/paid` của chính mình trong hôm nay.
   - Hóa đơn, thanh toán, gói liệu trình: chỉ lễ tân và CEO được insert, qua RPC dạng giao dịch. Không cho update/xóa thẳng; xóa mềm phải qua phê duyệt.
   - Ngày cũ: policy kiểm `work_date < current_date` thì chỉ leader/ceo được ghi.
   - Phê duyệt: chặn `from_id = auth.uid()` (không tự duyệt đơn của mình).
   - Lương, chi tiêu, tổng chi: chỉ leader/ceo đọc; chỉ CEO sửa cài đặt.
4. **[high] Tách bảng:** cho `customer_contacts(customer_id, phone, address)` ra bảng riêng, RLS chỉ cho lễ tân và CEO. Tách `customer_health` (dữ liệu sức khỏe nhạy cảm, đọc theo quyền như hồ sơ khách). Tìm theo SĐT làm bằng RPC chỉ dành cho lễ tân/CEO, trả về khi khớp đủ số (không tìm theo một phần số). Xuất file làm bằng Edge Function chỉ cho CEO và ghi nhật ký.
5. **[high] Storage ảnh:** bucket để riêng tư, đường dẫn `staff_id/yyyy-mm-dd/…`. Ảnh chỉ đọc qua signed URL ngắn hạn. Policy: người tạo, lễ tân/leader/CEO được đọc; ảnh mẫu chỉ leader/CEO ghi. Kiểm tra MIME, giới hạn khoảng 5MB, xóa EXIF. Ảnh hóa đơn người mua chỉ KTV tạo ảnh, lễ tân và CEO được xem.
6. **[high] Nhật ký thao tác:** bảng `audit_log` chỉ cho insert, ghi bằng trigger. Áp dụng cho hóa đơn, thanh toán, gói, chi tiêu, điểm, phê duyệt, đổi vai trò, xuất file, sửa ngày cũ. Không ghi SĐT hay nội dung sức khỏe vào log.
7. **Không được để ở client:** service_role key, khóa API trả phí (AI, SMS, Zalo), danh sách khách đầy đủ, logic tính tiền/hoa hồng/lương, quyết định duyệt, cờ vai trò, SEED. Client chỉ giữ anon key. Thanh toán thẻ (nếu có) đi qua cổng thanh toán đạt chuẩn.
8. Bật Supabase Advisors (security) trước mỗi lần phát hành; giữ CSP chặt cho bản web.
