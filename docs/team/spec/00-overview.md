# FIX LẦN 1 — APP HOME KTV (lane M) — Tổng quan

Nguồn: `homespa/docs/ktv-fix-lan-1.md` (A–H). Nền: `ktv-spec.md`, `ktv-mindmaps.md`. Stack theo decisions.md (HOME SPA): React+Vite+TS, dữ liệu mẫu trong `data.ts`/`store.tsx`, KHÔNG backend, KHÔNG thư viện mới. Chữ mới → `homespa/src/i18n.ts` (tạo ở m1, các module sau dùng tiếp). Chữ cũ giữ nguyên.

## Mục tiêu
KTV dùng app gọn hơn: màu rõ việc quan trọng, bấm vào số ra chi tiết, dọn dẹp có luồng gửi-kiểm-làm lại, có góp ý/sáng kiến, mục Khách hàng đầy đủ lọc, mục Của tôi đủ 8 nhóm. Giữ giao diện xanh lá Home (hero xanh, Playfair, thẻ trắng bo tròn, nút mẹ đánh số, tab dưới, dải Demo).

## Vai trò và quyền
| Vai trò | Quyền trong lane này |
|---|---|
| KTV | Chỉ xem/ghi dữ liệu CỦA MÌNH. SĐT và địa chỉ khách bị ẩn. Không xuất file. Tiền khách: chỉ Ngân sách, không tổng đã trả/giá thẻ/còn thiếu. |
| Lễ tân | Thấy SĐT + địa chỉ khách; kiểm tra ảnh dọn dẹp; xác nhận sản phẩm. Tiền khách: chỉ "còn thiếu" (để nhắc đóng), không tổng chi/doanh thu (G12). |
| Leader | Xem chế độ kiểm tra (các trang Hôm nay dùng chung); kiểm tra ảnh. Không thấy SĐT. Tiền khách: như Lễ tân (G12). |
| CEO | Thấy SĐT + địa chỉ + mọi số tiền; DUY NHẤT được xuất file; xem góp ý về cấp trên. |
Trang `dailySub` dùng chung nhiều vai trò: sửa không được làm hỏng bản Lễ tân/Leader/CEO.

## Bảng module (5 đợt, theo mục H)
| # | Module | File spec | Nội dung | sensitive |
|---|---|---|---|---|
| 1 | m1-mau-nut-nho | 01-m1-mau-nut-nho.md | B màu, C6 chuyển mục, C1–C5, nút 11 | no |
| 2 | m2-don-dep | 02-m2-don-dep.md | D luồng Dọn dẹp KTV + AI giả lập | no |
| 3 | m3-gop-y | 03-m3-gop-y.md | E đóng góp ý kiến | no (góp ý về cấp trên: chỉ CEO xem) |
| 4 | m4-khach-hang | 04-m4-khach-hang.md | F khách VN + khách nước ngoài | SENSITIVE (SĐT, xuất file, phân quyền) |
| 5 | m5-cua-toi | 05-m5-cua-toi.md | G 8 nhóm Của tôi + Hiệu suất KTV | no |
Thứ tự bắt buộc 1→5 (m3 dùng nút 11 của m1; m5 dùng dữ liệu góp ý của m3 và điểm từ m2).

## Quy tắc nghiệp vụ chung
- R1 Ba màu: xanh nhạt = vừa, trắng = bình thường, vàng = quan trọng; xanh đậm = ô số/nhãn nhấn (mục B). Tối đa 3 nhóm màu mỗi màn.
- R2 Mỗi số một nguồn: tính từ `store` (hàm trong `logic.ts`), đổi ở đâu cập nhật ngay mọi nơi (badge Hôm nay, tile, danh sách).
- R3 Chưa có dữ liệu thật → "Chưa nối"; số tự dựng → "số liệu mẫu". Không bịa số.
- R4 AI kiểm tra dọn dẹp chỉ GIẢ LẬP, luôn có nhãn "Giả lập — Chưa nối AI thật"; AI không tự cộng/trừ điểm.
- R5 SĐT khách chỉ Lễ tân + CEO (KTV: không có trong DOM, thuộc tính, tooltip, `tel:`; cũng không dùng SĐT để tìm/lọc/sắp xếp). Chỉ CEO có nút xuất. Doanh thu/tổng chi chỉ CEO; Lễ tân/Leader chỉ "còn thiếu" (G12).
- R8 Dữ liệu mẫu dùng SĐT giả rõ ràng (dạng `0900 000 0xx`), nhãn "số liệu mẫu". Không nhập SĐT/địa chỉ khách thật vào `data.ts` hay app demo.
- R6 UI states: có dữ liệu mẫu nên loading/offline = N/A; bắt buộc có trạng thái trống (`<Empty>`) và không đủ quyền (chữ "Bạn không có quyền xem mục này").
- R7 Mở rộng sau: giữ hình dữ liệu dễ chuyển Supabase (id, createdAt, staffId); chưa viết bảng/RLS. ĐIỀU KIỆN TRƯỚC KHI DÙNG DỮ LIỆU THẬT: phải có Supabase Auth + RLS (cột phone/address chỉ role reception/ceo, qua view hoặc bảng tách riêng; khách lọc theo staffId cho ktv; xuất file chỉ qua hàm server kiểm role ceo). Dải "Demo — chuyển vai trò" chỉ tồn tại ở bản demo, bỏ khi có đăng nhập thật.

## Dữ liệu mẫu (hình, thêm vào data.ts/store.tsx)
- `Notif`: đã có `readBy` (đọc/chưa đọc theo người).
- `ProductLog` + `purpose?: 'ban_khach'|'dung_co_so'`, `buyerNote?`, `invoicePhoto?` (m1).
- `CleanReport` + `ai?: {branch:1|2|3; at; msg}` ; `Zone` doc: `stdDoc?` (m1, m2).
- `Suggestion` {id, staffId, kind:'csvc'|'nhansu'|'khach'|'khac', text, date, createdAt, status} (m1/m3).
- `Customer` đã có address, budget, dob, referredBy, qrCare, source; thêm mẫu: `unhappy?`, `departed?`, `progress?[]` (m4, nhãn số liệu mẫu).
- `StaffProfile` {fullName, avatar, joinDate?, info} (m5).

## Giả định (Ly đã chốt 5 mặc định; phần còn lại do Planner chọn)
Đã chốt: (1) ô CHIỀU xanh đậm như SÁNG; (2) danh sách khách ngân sách giảm dần, bằng nhau thì khách cũ (firstVisit sớm hơn) trước; (3) góp ý loại 2,3,4 cùng luồng loại 1; (4) "Khách hàng đi"/"Sinh nhật khách" của NN gộp vào bộ lọc; (5) chuyển mục đúng C6.
Planner tự chọn:
- G1 "Công việc của KTV" thành mục số 4 trong Hôm nay; Khách hàng bỏ khỏi Hôm nay, lên tab dưới. Tab KTV mới: Hôm nay · Khách hàng · Hỏi Mộc · Của tôi (bỏ tab Công việc). Menu Hôm nay còn 11 nút (xem m1).
- G2 Nút 11 "Sáng kiến phát triển Home Spa" và "Đóng góp ý kiến" (E) là CÙNG MỘT nút/luồng (m1 dựng nút + trang, m3 hoàn thiện).
- G3 Tiêu chuẩn mẫu: một nút cho mỗi KHU; file tài liệu chưa có thật → hiển thị tiêu chuẩn văn bản + dòng "Tệp tài liệu: Chưa nối".
- G4 "Khách Home Spa" của KTV chỉ gồm khách liên quan KTV đó (đã chăm sóc ∪ yêu cầu ∪ chốt) — vì quy tắc KTV chỉ xem dữ liệu của mình.
- G5 Bộ lọc "số tiền" của KTV dùng Ngân sách (budget), KHÔNG dùng tổng đã trả (doanh thu chỉ CEO).
- G6 Khoảng thời gian A→B lọc theo ngày sự kiện gần nhất của khách trong mục đó (chăm sóc / lịch hẹn / chốt thẻ); dữ liệu mẫu thiếu thì bổ sung, ghi "số liệu mẫu".
- G7 Nhánh AI giả lập chọn theo tỉ lệ checklist tích (xem m2); kết quả AI chỉ tư vấn, điểm vẫn do Lễ tân/Leader duyệt.
- G8 Liệu trình: "Đã hoàn thành" = đã thanh toán đủ; "Đã hết liệu trình" = còn 0 buổi. "Đã cọc, còn thiếu" = đã trả < giá thẻ.
- G9 Nhãn nhóm Hiệu suất đọc từ chữ nhỏ trong ảnh (⚠): dùng đúng chữ trong file fix; điểm chưa có công thức → "Chưa nối".
- G10 "Đã đọc/chưa đọc" là theo từng KTV (readBy), bấm đảo được hai chiều.
- G11 Hồ sơ cá nhân: "điền biểu mẫu khi nhập app" = form lưu vào store (chưa lưu máy chủ); ngày vào làm do CEO nhập → KTV thấy "Chưa nối" nếu trống.
- G12 (từ review bảo mật) Lễ tân/Leader chỉ thấy số tiền "còn thiếu" của khách, không thấy tổng chi/giá thẻ. Code hiện có cho họ thấy nhiều hơn (`canSeeMoney = role !== 'ktv'`): đổi hành vi này CẦN Ly chốt; Ly có thể đổi. Trong lane này, chỉ mục Khách hàng mới của KTV bị ràng buộc cứng; màn Lễ tân/Leader hiện có giữ nguyên cho tới khi Ly chốt.
- G13 Địa chỉ khách: KTV thấy "Ẩn" (như SĐT; Lễ tân + CEO thấy). Sinh nhật cho KTV chỉ ngày/tháng, không năm. Ly chưa chốt — Ly có thể đổi.
- G14 Tệp "Đã cọc còn thiếu"/"Đã hoàn thành" cho KTV chỉ hiện nhãn, không số tiền (KTV được biết tình trạng để nhắc khách). Nếu Ly không muốn, hai tệp chỉ dành Lễ tân/CEO. Ly có thể đổi.
- G15 Góp ý loại "Nhân sự / cấp trên": chỉ người gửi + CEO xem (Leader không thấy); loại khác Leader + CEO.

## Phi chức năng
- `scripts/team/check.sh` xanh (tsc + build). Bundle một file không tăng > 60 KB gzip tổng lane.
- Màn hình 360 px và desktop đều dùng được (một mã nguồn).
- Mọi nút mới có `aria-label`/chữ đọc được; không thông tin chỉ nhờ màu (luôn có chữ/nhãn).

## Ngoài phạm vi
Backend/đăng nhập/RLS thật (và vì vậy KHÔNG nhập dữ liệu khách thật, xem R7/R8), AI thật, tải file thật lên máy chủ, xuất file (chỉ CEO, giữ như hiện có), công thức điểm Hiệu suất thật, sửa màn Lễ tân/Leader/CEO ngoài việc không được làm hỏng chúng, refactor chữ cũ sang i18n.
