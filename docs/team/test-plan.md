# Test plan — FIX LẦN 1 KTV (lane M)

Chạy: `bash scripts/team/e2e.sh` (Playwright trên bản build tĩnh, cổng 4173). Chọn phần tử theo chữ/role trong spec. Unit do Builder viết bằng Vitest (hiện CHƯA có vitest trong package.json: Orchestrator quyết định).
Mỗi test mở app bằng `openAs(role, staff?)` (e2e/helpers.ts) qua dải "Demo — chuyển vai trò"; viewport 390x844.

## data-testid Builder PHẢI thêm
- `detail-row`: mỗi dòng trong Modal chi tiết 4 ô Dọn dẹp (M1-08)
- `cust-row`: mỗi dòng khách ở mọi danh sách khách (M4)
- `cal-cell`: mỗi ô lịch ở Của tôi → Lịch (M5-03)
- `perf-row`: mỗi chỉ số ở Hiệu suất KTV (M5-05/06; 20 dòng: 6+4+6+2+2)
- `empty` hoặc class `empty` trên `<Empty>` (M2-10)
- Lớp màu: `.mint`, `.deep`, `.gold` (M1-01..04)
- Tab dưới là `nav`/`.tabbar`; Modal là `[role=dialog]` hoặc `.modal`

## Ánh xạ tiêu chí
| ID | Loại | Kịch bản |
|---|---|---|
| M1-01..04 | e2e m1 | lớp mint/deep/gold trên thẻ theo chữ |
| M1-05, 06, 07 | e2e m1 | 4 tab, 11 nút (không Khách hàng), tab Khách hàng |
| M1-08 | e2e m1 | bấm 4 ô, số = số `detail-row` |
| M1-09 | e2e m1 + unit U-M1-09 | Đã đọc/Chưa đọc đảo; Vitest markRead/markUnread |
| M1-10 | e2e m1 (một phần) | Tiêu chuẩn mẫu + "Tệp tài liệu: Chưa nối"; phần tích còn lại bổ sung sau |
| M1-11, 11a | e2e m1 | chặn thiếu thông tin / SĐT, 0 gợi ý, không "Tải file" |
| M1-11b | e2e m1 (một phần) | Leader không thấy; KTV khác/Lễ tân/CEO bổ sung khi có dữ liệu |
| M1-12, 13 | e2e m1 | không lỗi console 3 vai trò; nút 11 trang khung. check.sh/i18n: Reviewer |
| M2-01..03 | e2e m2 | 3 Con, 3 nút Chít, chặn thiếu ảnh, Xem ảnh Home |
| M2-04..06 | e2e m2 | tích 2/5, 3/5, 5/5 → nhánh 1/3/2, thông báo, điểm chỉ đổi sau Đạt |
| M2-07..10, 12 | e2e m2 | làm lại, nhãn Giả lập, khu người khác, Empty, Lễ tân kiểm tra |
| M2-11 | unit (Builder) | aiCheck 0/5, 2/5, 3/5, 4/5, 5/5, thiếu ảnh |
| M3-01..04, 07, 08 | e2e m3 | 4 loại, khóa Gửi, ngày mặc định/max, gửi 4 loại, điểm không đổi |
| M3-05, 05a, 06 | e2e m3 (bảo mật) | KTV khác, CEO, Leader chỉ đọc, loại 2 chỉ người gửi + CEO, Lễ tân |
| M4-01..03, 05, 07, 08, 10..13 | e2e m4 | theo m4.spec.ts |
| M4-06, 06a, 08b, 08c, 08d | e2e m4 (bảo mật) | dò SĐT/thuộc tính/tiền, tìm bằng SĐT, hồ sơ ngoài G4, địa chỉ Ẩn |
| M4-04, 08c (thứ tự) | unit (Builder) | sortByBudget; customerSegments/sortByBudget role ktv không đọc totalPaid/finalPrice/pkgPaid/pkgOwed |
| M4-09 | unit (giá trị lọc) + e2e (có đủ bộ lọc) | customerSegments từng bộ lọc |
| M5-01..06, 08..10 | e2e m5 | theo m5.spec.ts |
| M5-02a | e2e m5 (bảo mật) | 6 trường hồ sơ, thu nhập chỉ KTV đó + CEO |
| M5-07, M5-10 | unit (Builder) | pointsOf, ktvPerf |

## Giới hạn đã biết
- `@playwright/test` chưa có trong homespa/package.json (cần devDependency + lockfile). Chromium có sẵn ở /opt/pw-browsers; nếu không tự tìm thấy, đặt PW_CHROMIUM_PATH.
- Vài test hẹp vì app chưa có UI (M2-09, M4-08b, M1-10 phần tích): bổ sung sau khi Builder xong module.
