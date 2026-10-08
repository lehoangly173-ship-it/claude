# m4-khach-hang — Mục KHÁCH HÀNG (F) + khách nước ngoài
sensitive: yes — SĐT khách (chỉ Lễ tân + CEO), xuất file (chỉ CEO), phân quyền KTV chỉ xem dữ liệu của mình, số tiền khách (doanh thu chỉ CEO).

## Mục đích
Tab mẹ "Khách hàng" của KTV (đã lên từ m1) có 2 nút lớn: "Khách hàng của tôi" và "Khách Home Spa"; hồ sơ khách 9 trường; bộ lọc khách lẻ / liệu trình / nước ngoài.

## 1. Khách hàng của tôi (mở rộng `KtvCustomersPage`)
- 3 ô đếm + 3 tab: Tôi đã chăm sóc | Yêu cầu tôi | Tôi chốt liệu trình; bộ lọc Tất cả | Khách lẻ | Liệu trình | Số lần ≥ (giữ).
- Tab "Tôi chốt liệu trình": bấm vào hiện 2 nút "Khách lẻ tôi chốt" và "Khách liệu trình tái tục tôi chốt" (tái tục = `pkgSale.mode==='renew'`).
- Mọi tab có nút chọn khoảng thời gian A → B (hai ô `type=date`, hiển thị ví dụ 25/9/2026–28/11/2026; A ≤ B; lọc theo giả định G6).
- Danh sách sắp: ngân sách giảm dần; bằng nhau → khách cũ trước (firstVisit sớm hơn); không có ngân sách → cuối, ghi "Chưa có". Hàm thuần `sortByBudget` trong logic.ts.

## 2. Hồ sơ khách (modal `openCustomer`, 9 trường theo thứ tự)
1 Tên · 2 Địa chỉ · 3 Sinh nhật · 4 SĐT (ẩn) · 5 Lịch sử CSKH + tiến triển (lần 1, lần 2…, chốt thẻ) · 6 Ngân sách · 7 Triệu chứng đau/tiến triển hiện tại (cho khách đánh giá sau 4 ngày trị liệu) · 8 Nguồn · 9 Đã quét QR CSKH chưa. Trường chưa có → "Chưa nối". KTV: trường 4 hiện "Ẩn" và số không tồn tại trong DOM/tooltip/copy; Lễ tân + CEO thấy số.
- KTV: trường 2 Địa chỉ hiện "Ẩn" (Lễ tân + CEO thấy; G13); Sinh nhật chỉ ngày/tháng. Dòng danh sách và modal của KTV không có số tiền nào ngoài Ngân sách.
- Quyền mở hồ sơ: khi KTV mở khách không thuộc tập G4 và không có tour hôm nay với KTV đó → modal hiện "Bạn không có quyền xem mục này" (áp cho mọi đường mở: cảnh báo, việc, Board, Hôm nay, Công việc).
- SĐT mẫu trong `data.ts` là số giả (`0900 000 0xx`), nhãn "số liệu mẫu" (R8).

## 3. Khách Home Spa (chỉ khách liên quan KTV — giả định G4)
Chọn nhóm: Khách Việt | Khách nước ngoài (cùng một component, lọc `group` VN/NN). Trong mỗi nhóm: Khách lẻ | Khách liệu trình có mã.
- **Khách lẻ**: lọc số lần (1,2,3… ≥/≤ và "chỉ 1 lần"), ngân sách (≥/≤; giả định G5), nguồn; khách lâu chưa quay lại (≥ 30/60/90 ngày, theo `lastVisitDays`); sinh nhật theo tháng (1–12); có phản hồi chưa hài lòng (`unhappy`); khách giới thiệu: chọn 1 KH lẻ → danh sách khách họ giới thiệu = `referredBy` ∩ tập G4 (khách ngoài tập G4 không hiện, không đếm).
- **Tìm kiếm/lọc của KTV (mọi ô trong mục này, Board, Hôm nay, Công việc)**: chỉ khớp mã KH và tên, TRONG tập G4; không bao giờ khớp `phone`. Gõ một SĐT → 0 kết quả.
- **Tiền (KTV)**: `customerSegments`/`sortByBudget` cho KTV không đọc `totalPaid`, `finalPrice`, `pkgPaid`, `pkgOwed`; không dùng chúng để sắp xếp. Tệp "Đã cọc còn thiếu"/"Đã hoàn thành" chỉ hiện nhãn + số dòng, không số tiền (G14).
- **Khách liệu trình có mã**: ô "Tìm mã KH"; 5 tệp: 1 Đã cọc còn thiếu · 2 Đã hoàn thành · 3 Còn 2 buổi cuối · 4 Còn buổi cuối cùng · 5 Đã hết liệu trình; thêm Sinh nhật (theo tháng), Có phản hồi chưa hài lòng; bộ lọc "lâu chưa quay lại" áp dụng cho tệp 1–5.
- **Khách nước ngoài**: y hệt; 2 ô "Khách hàng đi" và "Sinh nhật khách" gộp vào bộ lọc (Ly chốt): "Khách đã đi" (`departed`, số liệu mẫu) và Sinh nhật theo tháng — không còn ô lẻ.
- Số trên nút tệp = số dòng danh sách (một nguồn `customerSegments(s, me, group, kind, filters)` trong logic.ts).

## 4. Bảo mật
KTV không có nút xuất/tải file nào trong mục này; chỉ CEO có (giữ nút hiện có của CEO). Không hiện tổng đã trả/doanh thu cho KTV. Lễ tân/Leader chỉ "còn thiếu" (G12). Điều kiện dữ liệu thật: xem R7. Vai trò không đủ quyền vào route → "Bạn không có quyền xem mục này".

## Tiêu chí nghiệm thu
- M4-01 Tab Khách hàng của KTV có 2 nút lớn; mỗi nút mở đúng màn.
- M4-02 Tab "Tôi chốt liệu trình" hiện đúng 2 nút con; mỗi nút lọc đúng tập (tái tục vs khách lẻ).
- M4-03 Chọn A→B: chỉ còn khách có sự kiện trong khoảng; đặt A > B báo lỗi và không lọc; xóa khoảng trả về đầy đủ.
- M4-04 Sắp xếp: ngân sách giảm dần; hai khách cùng ngân sách → firstVisit sớm hơn đứng trước (unit test); không ngân sách đứng cuối.
- M4-05 Hồ sơ có đủ 9 trường đúng thứ tự; trường thiếu dữ liệu ghi "Chưa nối".
- M4-06 Vai trò KTV: lấy toàn bộ text DOM, BỎ khoảng trắng/dấu chấm/gạch ngang rồi dò `/(\+?84|0)\d{9}/` = 0 kết quả; dò cả thuộc tính (`title`, `aria-label`, `data-*`, `value`, `href="tel:"`) = 0; đồng thời so với danh sách SĐT trong `data.ts` (đã chuẩn hóa) = 0 trùng. Áp dụng mục Khách hàng, modal hồ sơ, Board, Hôm nay, Công việc. Lễ tân và CEO thấy số.
- M4-06a KTV gõ đúng một SĐT mẫu (có và không có khoảng trắng) vào mọi ô tìm/lọc → 0 kết quả; gõ mã/tên khách trong G4 → có kết quả; mã/tên khách ngoài G4 → 0.
- M4-08a KTV A chọn khách giới thiệu: danh sách chỉ gồm khách thuộc tập G4 của A; khách của KTV B không hiện, số đếm khớp.
- M4-08b KTV mở hồ sơ khách ngoài G4 và không có tour hôm nay với mình (qua cảnh báo/Board/việc) → "Bạn không có quyền xem mục này", DOM không chứa tên/địa chỉ/ngân sách khách đó.
- M4-08c KTV xem DOM mục Khách hàng + modal: 0 chuỗi tiền khớp `\d[\d.,]*\s?(đ|₫|VND)` ngoài ô Ngân sách; thứ tự danh sách không phụ thuộc `totalPaid` (đổi `totalPaid` mẫu, thứ tự KTV không đổi).
- M4-08d KTV: Địa chỉ hiện "Ẩn" và chuỗi địa chỉ mẫu không có trong DOM; Sinh nhật không có năm. Lễ tân + CEO thấy địa chỉ.
- M4-07 Vai trò KTV: không có nút "Xuất"/"Tải file"/"Export" ở mục Khách hàng; CEO có.
- M4-08 KTV A không thấy khách chỉ liên quan KTV B ở "Khách Home Spa" (đếm khớp tập liên quan).
- M4-09 Mỗi bộ lọc khách lẻ trả kết quả đúng với dữ liệu mẫu (số lần, ngân sách, nguồn, lâu chưa quay lại, tháng sinh, chưa hài lòng, giới thiệu); số trên nút = số dòng.
- M4-10 5 tệp liệu trình + ô "Tìm mã KH" (tìm đúng mã, không phân biệt hoa thường) hoạt động; lọc "lâu chưa quay lại" áp dụng cho cả 5 tệp.
- M4-11 Khách nước ngoài cùng cấu trúc; có bộ lọc "Khách đã đi" và Sinh nhật trong bộ lọc, không còn 2 ô lẻ.
- M4-12 Rỗng → `<Empty>`; dữ liệu mẫu tự dựng có nhãn "số liệu mẫu".
- M4-13 CEO thấy SĐT ở danh sách khách hiện có (sửa chỗ đang hiện "SĐT ẩn" cho CEO khi tách component); Lễ tân/Leader/CEO màn khách hàng hiện có không bị hỏng; check.sh xanh; unit test `sortByBudget`, `customerSegments`.

## File nên sửa
`screens/daily.tsx` (KtvCustomersPage → tách `screens/ktvCustomers.tsx`), `App.tsx` (route tab cust cho KTV), `screens/staff.tsx` (modal hồ sơ nếu ở đây; kiểm `openCustomer` trong `store.tsx`/`ui.tsx`), `logic.ts`, `data.ts` (unhappy, departed, progress, mẫu NN), `i18n.ts`.
