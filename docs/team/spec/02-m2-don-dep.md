# m2-don-dep — Luồng "Mẹ – Dọn dẹp KTV" (D)
sensitive: no (ảnh dọn dẹp là ảnh khu vực, không chứa SĐT/tiền)

## Mục đích
Tổ chức lại trang Dọn dẹp thành cây Mẹ → Con → Cháu → Chắt → Chít, gửi báo cáo qua bước "AI kiểm tra" GIẢ LẬP, 3 nhánh kết quả, vòng làm lại.

## Cấu trúc màn hình (`CleaningPage`, KTV; Lễ tân/Leader giữ chế độ kiểm tra hiện có)
- Mẹ "Dọn dẹp KTV" gồm 3 Con (nút lớn, đánh số): 1 Nhiệm vụ của tôi · 2 Báo cáo đã gửi · 3 Cần dọn lại (cũng bấm thẳng từ Mẹ). Giữ 4 ô số + màu từ m1.
- Con 1 → Cháu "Nhiệm vụ theo khu vực" (danh sách khu của tôi) → Chắt:
  - "Ảnh minh chứng": Chít = Chụp ảnh (`<input type=file accept=image/* capture=environment>`), Tải ảnh, Gửi báo cáo.
  - "Tiêu chuẩn và checklist": Chít = Xem ảnh Home (ảnh mẫu / nút Tiêu chuẩn mẫu của m1), Tích checklist.
- Con 2 → danh sách báo cáo đã gửi của KTV (khu, giờ, trạng thái, kết quả AI giả lập, điểm nếu đã duyệt).
- Con 3 → Cháu "Nhiệm vụ cần làm lại" → Chắt "Lỗi và yêu cầu sửa" → Chít: Xem lỗi / Dọn lại / Gửi ảnh mới → quay lại bước AI kiểm tra.

## Bước "Hệ thống: AI kiểm tra" (giả lập, hàm thuần trong `logic.ts`: `aiCheck(checks, photo)`)
Luôn hiện nhãn "Giả lập — Chưa nối AI thật". Quy tắc (giả định G7), photo bắt buộc:
- Nhánh 1 (lỗi rõ): tích < 50% checklist → báo cáo thành "Chưa đạt", lý do "AI (giả lập): …", thông báo KTV + nhóm Leader "nhắc dọn lại"; vào Con 3.
- Nhánh 3 (không đủ căn cứ): tích từ 50% đến < 100% → trạng thái "Chờ kiểm tra", thông báo Lễ tân/Leader "cần kiểm tra và nhắc"; nếu họ bấm Chưa đạt → vào Con 3.
- Nhánh 2 (phù hợp): tích 100% → trạng thái "Chờ kiểm tra" với nhãn "AI: phù hợp (giả lập)", thông báo kết quả cho KTV + Lễ tân + Leader. Điểm +ZONE_POINTS chỉ khi Lễ tân/Leader bấm Đạt (AI không cộng điểm).
- Mỗi lần gửi lại tạo báo cáo mới và chạy AI lại (không ghi đè lịch sử).

## Tiêu chí nghiệm thu
- M2-01 Trang Dọn dẹp KTV có Mẹ với đúng 3 Con theo thứ tự; Con 3 mở được trực tiếp.
- M2-02 Chắt "Ảnh minh chứng" có đủ 3 nút Chụp ảnh / Tải ảnh / Gửi báo cáo; Gửi báo cáo bị chặn (có thông báo) khi chưa có ảnh.
- M2-03 Chắt "Tiêu chuẩn và checklist" có Xem ảnh Home và Tích checklist; tích lưu được giữa các lần mở.
- M2-04 Given tích 2/5 + ảnh When gửi Then nhánh 1: báo cáo "Chưa đạt", xuất hiện ở Con 3, KTV nhận thông báo.
- M2-05 Given tích 3/5 When gửi Then nhánh 3: "Chờ kiểm tra", Lễ tân và Leader nhận thông báo.
- M2-06 Given tích 5/5 When gửi Then nhánh 2: KTV, Lễ tân, Leader đều nhận thông báo kết quả; điểm KTV chưa đổi; sau khi Lễ tân bấm Đạt điểm +ZONE_POINTS và con số tile "Điểm dọn dẹp hôm nay" cập nhật ngay.
- M2-07 Ở Con 3 mở "Lỗi và yêu cầu sửa" thấy đúng lý do; "Gửi ảnh mới" tạo báo cáo mới, chạy AI lại, báo cáo cũ còn trong Con 2.
- M2-08 Mọi kết quả AI đều kèm chữ "Giả lập — Chưa nối AI thật"; không có chỗ nào ghi AI là thật.
- M2-09 KTV không mở/gửi được khu của người khác (chữ "Khu này không phải của bạn hôm nay").
- M2-10 Trống: không có báo cáo → `<Empty>` ở Con 2 và Con 3.
- M2-11 Unit test `aiCheck`: các ngưỡng 0/5, 2/5, 3/5, 5/5, thiếu ảnh.
- M2-12 Chế độ kiểm tra của Lễ tân/Leader (Đạt/Chưa đạt) vẫn hoạt động; check.sh xanh.

## File nên sửa
`screens/daily.tsx` (CleaningPage, ZoneModal; có thể tách `screens/cleaning.tsx`), `logic.ts` (`aiCheck`, đếm Con), `store.tsx` (`submitClean` gọi aiCheck, tạo notif), `data.ts` (CleanReport.ai), `i18n.ts`.
