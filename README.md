# Home Spa App

App điện thoại cho Home Spa — Expo + React Native + TypeScript (cùng công nghệ với LinguaMe).

## 4 vai trò, cùng 1 khung 4 tab
| Vai trò | Hôm nay | Việc chính | Khách hàng | Của tôi |
|---|---|---|---|---|
| Lễ tân | 6 chỉ số + việc cần xử lý ngay | Hàng chờ · Lịch · Giường · Thu ngân | Hồ sơ (thấy SĐT), CSKH | Chấm công, quyền |
| KTV | Việc tiếp theo, Bắt đầu/Hoàn thành, checklist dọn giường | Việc khu vực chung | Khách của tôi (ẩn SĐT) | Thu nhập tour (chỉ xem) |
| CEO | Sức khỏe kinh doanh, cảnh báo, 3 ưu tiên | Doanh thu, năng suất KTV | Hạng khách, kênh, VIP sắp rời | Quyền |
| Marketing | 2 ảnh + 2 video/ngày, CSKH | Lịch chiến dịch | Phễu theo kênh | Quyền |

## Luồng chính
Khách đến → hàng chờ → lễ tân chia tour (gợi ý KTV ít tour nhất / KTV khách yêu cầu, giường trống đúng loại)
→ KTV Bắt đầu → Hoàn thành → giường “Đang dọn” (checklist 4 bước) → Thu ngân → số liệu CEO tự cập nhật.

Mọi con số tính lại từ một nguồn dữ liệu duy nhất (`src/store.ts`) nên luôn khớp giữa các màn hình.

## Chạy
```
npm install
npx expo start        # quét QR bằng Expo Go trên điện thoại
npx tsx scripts/flow.test.ts   # 39 bước kiểm tra luồng & số liệu
```

## Cấu trúc
- `src/data.ts` — kiểu dữ liệu, dịch vụ, 19 giường, nhân viên, khách mẫu
- `src/store.ts` — trạng thái, thao tác, chỉ số liên kết
- `src/shared.tsx` — chia tour, tạo lịch, sơ đồ giường, lịch điều phối, thu ngân, hồ sơ khách
- `src/roles/*` — màn hình từng vai trò
- Bước sau: nối Supabase (đăng nhập thật, dữ liệu dùng chung nhiều máy)
