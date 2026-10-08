# m3-gop-y — Đóng góp ý kiến / Sáng kiến (E, nút 11)
sensitive: yes (ý kiến có thể nhắc người khác: loại 2 "Nhân sự / cấp trên" chỉ người gửi + CEO xem; loại khác người gửi + Leader/CEO)

## Mục đích
Một nút duy nhất (nút 11 "Sáng kiến phát triển Home Spa", giả định G2) để KTV gửi góp ý; dữ liệu sau này dùng chấm điểm uy tín.

## Màn hình (`home/idea`)
1. Chọn loại (4 nút lớn): 1 Ý kiến về cơ sở vật chất · 2 Nhân sự / cấp trên · 3 Khách hàng – dịch vụ · 4 Ý kiến khác. (Nhóm gợi ý của nút 11: khách hàng, cơ sở vật chất, tay nghề, tinh thần tập thể hiện trong mô tả.)
2. Cả 4 loại cùng luồng (Ly chốt): NỘI DUNG Ý KIẾN (textarea) → NGÀY THÁNG NĂM (date, mặc định hôm nay) → GỬI.
3. Sau gửi: màn xác nhận "Đã gửi" + ghi chú "Chưa nối: điểm uy tín từ sáng kiến" (không cộng điểm tự động).
4. Danh sách "Ý kiến tôi đã gửi" (loại, ngày, trạng thái "Đã gửi"); trống → `<Empty>`.
Phía nhận: CEO xem tất cả ý kiến; Leader xem loại 1, 3, 4 (KHÔNG thấy loại 2 "Nhân sự / cấp trên", tránh trả đũa) ở trang Hôm nay (nút/khối mới "Ý kiến KTV", chỉ đọc). Lọc theo loại phải làm ở selector, không chỉ ẩn bằng CSS. KTV khác không thấy ý kiến của nhau. Lễ tân không thấy.

## Dữ liệu
`Suggestion` {id, staffId, kind, text, date, createdAt, status:'Đã gửi'}; `store.addSuggestion`, selector `mySuggestions(s, id)` trong logic.ts. Cũng hiện trong Của tôi → Yêu cầu & lịch sử (m5).

## Tiêu chí nghiệm thu
- M3-01 Nút 11 mở trang có đúng 4 loại theo thứ tự trên.
- M3-02 Với mỗi loại 1–4 luồng giống nhau: nội dung → ngày → Gửi; Gửi bị khóa khi nội dung rỗng (sau trim) hoặc ngày rỗng.
- M3-03 Ngày mặc định = hôm nay; không cho chọn ngày tương lai.
- M3-04 Gửi thành công: ý kiến xuất hiện ở "Ý kiến tôi đã gửi" ngay, đúng loại/ngày; form được xóa.
- M3-05 Chuyển vai trò sang KTV khác: không thấy ý kiến của KTV đầu. CEO thấy cả hai, Leader thấy loại 1/3/4 của cả hai, chỉ đọc (không có nút sửa/xóa).
- M3-05a Gửi một ý kiến loại 2: người gửi và CEO thấy; Leader không thấy trong DOM (đếm số dòng Leader = số ý kiến loại 1/3/4); số đếm/badge của Leader cũng không tính loại 2; Lễ tân và KTV khác không thấy.
- M3-06 Lễ tân không có đường vào danh sách ý kiến KTV.
- M3-07 Không có điểm uy tín nào thay đổi sau khi gửi; có chữ "Chưa nối" cho phần chấm điểm.
- M3-08 Chữ mới trong `i18n.ts`; check.sh xanh; Playwright luồng gửi 4 loại.

## File nên sửa
`screens/daily.tsx` hoặc mới `screens/ideas.tsx`, `screens/staff.tsx` (dailySub case `idea`), `screens/leader.tsx`/`roles.tsx` (khối chỉ đọc cho Leader/CEO), `store.tsx`, `data.ts`, `logic.ts`, `i18n.ts`.
