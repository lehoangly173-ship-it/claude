# HOME SPA Flow

Một codebase cho cả máy tính và điện thoại (bố cục tự đổi dưới 860px). Dữ liệu hiện là **dữ liệu mẫu** để chạy thử.

## Chạy
```
npm install
npm run dev      # xem thử
npm run build    # ra 1 file dist/index.html
```

## Cấu trúc
| File | Nội dung |
|---|---|
| `src/data.ts` | Kiểu dữ liệu + dữ liệu mẫu. Mỗi mảng = 1 bảng Supabase sau này |
| `src/logic.ts` | Mọi con số dẫn xuất (trạng thái KTV/giường, trùng lịch, gợi ý chia tour, cảnh báo) |
| `src/store.tsx` | Mọi thao tác. Màn hình chỉ gọi hành động ở đây nên các module luôn liên thông |
| `src/screens/ops.tsx` | Lễ tân: Tổng quan, Lịch điều phối, Hàng chờ, Sơ đồ giường, Thông báo |
| `src/screens/cashier.tsx` | Thu ngân |
| `src/screens/ktv.tsx` | KTV: Công việc của tôi |
| `src/screens/leader.tsx` | Leader: Hôm nay, Khách hàng, Hỏi đáp Mộc, Của tôi |
| `src/screens/ceo.tsx` | CEO (phê duyệt, thành viên) và Marketing |

## Quy tắc chính
- Lượt khách: đã đặt → khách đã đến → đang làm → chờ thanh toán → đã thanh toán (hoặc hủy / không đến).
- Mọi lịch đều kiểm tra trùng KTV, trùng giường, trùng khách, đúng khu giường, có 10 phút dọn giường, và nằm trong ca.
- Thu ngân: thẻ chỉ bị trừ khi chọn đúng thẻ và bấm xác nhận. Dịch vụ lẻ phải thu đủ, chỉ gói mới được cọc. Xóa hóa đơn là xóa mềm, chị phải duyệt, và hệ thống tự hoàn lại thẻ.
- Ngân sách trên 2 triệu, đổi giá / ưu đãi, việc vượt quyền và xác nhận kết quả sáng kiến đều phải qua chị duyệt.

## Khi nối Supabase
1. Tạo bảng theo các kiểu trong `data.ts`. Bảng lịch hẹn cần thêm cột `date`.
2. Thay `s.now` (giờ mô phỏng) bằng giờ thật. Đặt `DEMO = false` để ẩn nút đổi vai trò, tua giờ và khôi phục dữ liệu mẫu.
3. Phân quyền theo vai trò bằng RLS. Màn hình hiện chỉ ẩn nút theo vai trò.
4. Thay `HISTORY` (số liệu mẫu các kỳ trước) bằng truy vấn tổng hợp. Thay trả lời của Mộc bằng AI thật, giữ nguyên khung 3 phần: dữ liệu đã xác nhận, giả thuyết, bước tiếp theo.
