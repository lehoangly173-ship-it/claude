# m5-cua-toi — Mục "CỦA TÔI" của KTV + Hiệu suất (G)
sensitive: no (dữ liệu cá nhân chỉ của chính KTV; tiền lương hiện "Chưa nối"/số liệu mẫu, không lộ cho người khác)

## Mục đích
Tab Của tôi (KTV) từ 5 nút thành 8 nút theo sơ đồ G. Chỉ KTV đó thấy dữ liệu của mình (CEO xem chế độ riêng hiện có, không đổi).

## Nút mẹ (KTV, `MyPage`; vai trò khác giữ nguyên)
1 Hồ sơ cá nhân · 2 Lịch làm việc của tôi · 3 Chấm công của tôi · 4 Hiệu suất KTV · 5 KPI – Điểm uy tín · 6 Đào tạo & phát triển · 7 Thu nhập của tôi · 8 Yêu cầu & lịch sử cá nhân.

## Từng màn
1. **Hồ sơ** (biểu mẫu, giả định G11): họ tên, mã NV, ảnh đại diện (PhotoInput), chi nhánh/bộ phận, ngày vào làm, thông tin cơ bản; nút Lưu. Trống → "Chưa nối".
2. **Lịch làm việc**: ca hôm nay; chuyển Tuần/Tháng (Seg) từ `rosterCell`; lịch đổi ca; ngày nghỉ đã đăng ký (leaves đã duyệt).
3. **Chấm công**: giờ vào/ra, đi trễ/về sớm, ngày công, lịch sử chấm công, nút "Yêu cầu điều chỉnh chấm công" (tạo yêu cầu, trạng thái Chờ duyệt). Số liệu tháng chưa có → "Chưa nối"/số liệu mẫu.
4. **Hiệu suất KTV** — 5 nhóm (giả định G9), mỗi nhóm một Block, mỗi chỉ số một dòng số hoặc "Chưa nối":
   - Chuyên môn & khách hàng: điểm TB khách đánh giá; số khách yêu cầu; đánh giá chuyên môn; best saler / tỉ suất % sale; số lượt KH phục vụ; tổng giờ phục vụ.
   - Tăng trưởng KH: KH mới phục vụ; khách mới quay lại; KH mới mua liệu trình; KH cũ tái tục.
   - Tinh thần làm việc: set up dọn đẹp đúng; ý thức đúng giờ; nhận tăng ca; chấp hành quy trình; chuyên cần; tinh thần học tập.
   - Văn hóa ứng xử: được KTV/lễ tân bầu chọn yêu thích nhất; được cấp trên bình chọn.
   - Sáng tạo – đổi mới: có ý kiến sáng tạo (= số `Suggestion` của m3); giúp đỡ Home.
   Số tính được từ store (tour, yêu cầu, báo cáo dọn đúng từ m2, đi trễ, ý kiến m3) dùng hàm `ktvPerf(s, id)` trong logic.ts; còn lại "Chưa nối". Không tự cộng điểm.
5. **KPI – Điểm uy tín**: điểm hiện tại (`pointsOf`), điểm tăng/giảm, lý do, KPI đạt/chưa đạt (Chưa nối nếu chưa có mục tiêu), lịch sử điểm (giữ), gợi ý cần cải thiện (Chưa nối).
6. **Đào tạo & phát triển**: khóa đang học; video/SOP cần xem (D.SOPS); bài test; kết quả; kỹ năng đã đạt/cần cải thiện; lộ trình cá nhân (mô tả, Chưa nối khi trống).
7. **Thu nhập**: lương cơ bản; công thực tế; hoa hồng; thưởng; phạt; tổng dự kiến; phiếu lương từng tháng. Mọi số = "Chưa nối" hoặc "số liệu mẫu"; chỉ KTV đó thấy.
8. **Yêu cầu & lịch sử**: xin nghỉ; đổi ca; điều chỉnh chấm công; báo sự cố; góp ý/phản hồi (m3); danh sách lịch sử + trạng thái xử lý, sắp mới nhất trước.

## Tiêu chí nghiệm thu
- M5-01 Của tôi (KTV) hiện đúng 8 nút theo thứ tự; vai trò khác không đổi số nút so với trước.
- M5-02 Hồ sơ: lưu form → mở lại còn dữ liệu; thiếu họ tên không cho lưu; ngày vào làm trống hiện "Chưa nối".
- M5-03 Lịch: chuyển Tuần/Tháng đổi số ô (7 / 28); ngày nghỉ đã duyệt hiện OFF khớp trang 4 tuần.
- M5-04 Chấm công: quét vào ca → giờ vào hiện và "Hôm nay của tôi" cập nhật ngay; gửi yêu cầu điều chỉnh xuất hiện ở mục 8 trạng thái Chờ duyệt.
- M5-05 Hiệu suất có đủ 5 nhóm và đủ chỉ số đã liệt kê (đếm dòng); mỗi chỉ số hoặc có số hoặc ghi "Chưa nối"; không có số bịa không nhãn.
- M5-06 "Số khách yêu cầu" khớp số ở m4 "Yêu cầu tôi"; "Ý kiến sáng tạo" tăng 1 sau khi gửi góp ý (m3), cập nhật ngay.
- M5-07 KPI: điểm hiện tại = tổng lịch sử điểm đã duyệt (unit test `pointsOf` giữ đúng).
- M5-08 Thu nhập: không số nào không nhãn; KTV B không thấy dữ liệu KTV A.
- M5-09 Mục 8 liệt kê đủ loại yêu cầu của chính KTV, trạng thái đúng (Đã duyệt/Từ chối/Chờ).
- M5-10 Trống từng màn → `<Empty>`; unit test `ktvPerf`; check.sh xanh.

## File nên sửa
`screens/staff.tsx` (MyPage, tách `screens/mine.tsx`), `logic.ts` (`ktvPerf`), `store.tsx` (profile, adjustRequest), `data.ts`, `i18n.ts`.
