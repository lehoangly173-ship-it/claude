# Security review — SPEC (lane M, FIX LẦN 1)

VERDICT: FAIL

Phạm vi: 00-overview.md, 04-m4-khach-hang.md, 05-m5-cua-toi.md, phần liên quan trong 01-m1 và 03-m3, decisions.md (HOME SPA). Không backend → bảng/RLS/đăng nhập/secret = N/A (decisions.md dòng 5, 12). Đã đối chiếu code hiện có để thấy rủi ro builder dùng lại.

## Vấn đề

1. [high] 04-m4 M4-06 — Regex `0\d{9}` không bắt được SĐT mẫu vì data.ts lưu dạng có khoảng trắng (`0901 234 567`), nên test luôn qua dù SĐT bị lộ. — Sửa M4-06: bỏ khoảng trắng/dấu chấm/gạch ngang trong toàn bộ text DOM rồi mới dò (`/(\+?84|0)\d{9}/`). Dò cả thuộc tính (`title`, `aria-label`, `data-*`, `value`, `href="tel:"`). So thêm với danh sách SĐT thật trong data.ts (đã chuẩn hóa). Áp dụng cho mục Khách hàng, modal hồ sơ và mọi màn KTV mở được hồ sơ (Board, Hôm nay, Công việc).

2. [high] 04-m4 §3 "Tìm mã KH" và mọi ô tìm/lọc của KTV — Spec không cấm tìm theo SĐT. Code hiện có (ops.tsx:234, cashier.tsx:155) đang khớp cả `c.phone`. Nếu builder dùng lại, KTV gõ số và thấy có kết quả là biết số đó thuộc khách nào, dù SĐT không hiện ra. — Ghi vào spec: với KTV, tìm kiếm chỉ dùng mã KH/tên, không bao giờ dùng `phone`. Chỉ tìm trong tập G4. Thêm tiêu chí: KTV gõ đúng một SĐT mẫu → 0 kết quả.

3. [high] 04-m4 §3 Khách lẻ, lọc "khách giới thiệu" — Chọn 1 khách → hiện danh sách khách người đó giới thiệu (`referredBy`). Những khách này có thể nằm ngoài tập G4 của KTV, nên làm lộ tên khách của KTV khác. — Sửa: danh sách giới thiệu = `referredBy` ∩ tập G4. Thêm vào M4-08: KTV A không thấy khách ngoài tập của mình qua lọc giới thiệu.

4. [medium] 04-m4 §2 modal `openCustomer` — G4 chỉ áp cho danh sách. Modal dùng chung, nên KTV mở được hồ sơ bất kỳ khách nào nếu có id (cảnh báo, việc, Board). — Thêm: khi vai trò KTV mở hồ sơ khách không thuộc tập G4 và cũng không có tour hôm nay với KTV đó → hiện "Bạn không có quyền xem mục này".

5. [medium] 04-m4 §1/§3 tiền khách — Spec chỉ ghi "không hiện tổng đã trả". Nhưng `ReceptionCustomers` (staff.tsx:269,288) đang sắp theo `totalPaid` và in `D.vnd(c.totalPaid)` cho mọi vai trò. Nếu dùng lại cho "cùng một component" VN/NN, KTV sẽ thấy doanh thu, hoặc suy ra thứ hạng doanh thu qua thứ tự sắp xếp. — Ghi rõ: `customerSegments`/`sortByBudget` cho KTV không đọc `totalPaid`, `finalPrice`, `pkgPaid`, `pkgOwed`. Dòng danh sách và modal của KTV không có số tiền nào ngoài Ngân sách. Tệp "Đã cọc còn thiếu"/"Đã hoàn thành" chỉ hiện nhãn, không hiện số tiền. Thêm tiêu chí: KTV xem DOM thấy 0 chuỗi tiền (`\d[\d.]*\s?(đ|₫|VND)`) ngoài ô Ngân sách.

6. [medium] 00-overview R5 / 04-m4 tiêu đề — Quy tắc "doanh thu chỉ CEO" chưa rõ cho Lễ tân/Leader. Code hiện có `canSeeMoney = user.role !== 'ktv'` (ui.tsx:128), tức Lễ tân/Leader đang thấy tổng chi, giá thẻ, còn thiếu. — Planner ghi rõ trong bảng vai trò: Lễ tân/Leader được thấy số tiền nào (đề xuất: chỉ "còn thiếu" để nhắc khách đóng, không thấy tổng chi). Nếu thay đổi hành vi hiện có thì hỏi Ly.

7. [medium] 01-m1 C4 `buyerNote` + `invoicePhoto` — Ô "Bán cho ai" là chữ tự do (KTV có thể gõ SĐT). Ảnh hóa đơn thường có giá bán và SĐT khách. Spec chưa nói ai được xem 2 thông tin này trong danh sách ProductsPage. — Sửa: ô "Bán cho ai" chọn khách theo mã/tên trong tập G4 (cho phép gõ tên nếu khách mới), placeholder "Tên hoặc mã KH — không ghi SĐT". Ảnh hóa đơn và người mua chỉ hiện cho KTV tạo + Lễ tân + CEO; KTV khác/Leader chỉ thấy "Bán cho khách". Nút đặt tên "Chụp/đính kèm hóa đơn", không dùng chữ "Tải file", để khỏi lẫn với quy tắc xuất file (M4-07).

8. [medium] 04-m4 §2 trường Địa chỉ (và Sinh nhật) cho KTV — Dữ liệu cá nhân nên giữ tối thiểu, mà KTV làm tại cơ sở không cần địa chỉ nhà khách. — Đề xuất: KTV thấy "Ẩn" ở Địa chỉ giống SĐT (Lễ tân + CEO thấy). Sinh nhật cho KTV chỉ hiện ngày/tháng. Đây là chọn hướng, Planner ghi thành giả định để Ly chốt.

9. [medium] 03-m3 — Góp ý loại 2 "Nhân sự / cấp trên" cho Leader xem. Nhân viên có thể bị trả đũa khi góp ý về chính Leader, nên sẽ ngại góp ý. — Sửa: loại `nhansu` chỉ người gửi + CEO xem; các loại khác giữ Leader + CEO.

10. [medium] 00-overview R7 / Ngoài phạm vi — Không backend nên toàn bộ SĐT/địa chỉ mẫu nằm trong bundle `index.html` và state React; dải "Demo — chuyển vai trò" cho ai cũng thành CEO. Chấp nhận được với số liệu mẫu, nhưng spec chưa chặn việc nhập dữ liệu thật. — Thêm vào Ngoài phạm vi/R7: "Không nhập SĐT/địa chỉ khách thật vào data.ts hay app demo. Trước khi dùng dữ liệu thật phải có Supabase Auth + RLS: cột phone/address chỉ cho role reception/ceo (view hoặc bảng tách riêng), lọc khách theo staffId cho ktv, export chỉ qua hàm server kiểm role ceo."

11. [low] data.ts — SĐT mẫu có dạng số thật (`0901 234 567`, …). — Ghi trong spec dùng số giả rõ ràng (ví dụ `0900 000 0xx`), kèm nhãn "số liệu mẫu".

12. [low] staff.tsx:288 (màn khách hàng dùng chung) — CEO đang thấy "SĐT ẩn", trái quy tắc "Lễ tân + CEO thấy". — M4-13 nên kiểm cả: CEO thấy SĐT ở danh sách khách hiện có (sửa nhỏ khi tách component).

13. [low] 05-m5 Hồ sơ cá nhân — "thông tin cơ bản" không giới hạn. KTV có thể nhập CCCD hoặc số tài khoản, và dữ liệu này nằm trong store ai chuyển vai trò cũng đọc được. — Liệt kê đúng các trường (họ tên, mã NV, ảnh, chi nhánh/bộ phận, ngày vào làm, SĐT nội bộ tùy chọn). Ghi rõ không thu CCCD/tài khoản ngân hàng ở bản demo. Thu nhập (mục 7) chỉ KTV đó + CEO.

14. [low] 04-m4 §3 tệp "Đã cọc còn thiếu"/"Đã hoàn thành" — Dù không hiện số, KTV vẫn biết tình trạng thanh toán của khách. — Chấp nhận nếu Ly muốn KTV nhắc khách. Nếu không, hai tệp này chỉ dành cho Lễ tân/CEO. Planner ghi thành giả định.

## Kiểm tra theo yêu cầu
- SĐT chỉ Lễ tân + CEO, KTV ẩn cả DOM: spec có (R5, §2, M4-06) nhưng test hỏng (1) và còn hở ở tìm kiếm (2) → chưa đạt.
- Chỉ CEO xuất file: đạt (§4, M4-07). Lưu ý tên nút hóa đơn (7).
- KTV chỉ dữ liệu của mình (G4): danh sách đạt; còn hở ở lọc giới thiệu (3) và modal (4).
- Lộ doanh thu qua lọc số tiền: G5 dùng ngân sách là đúng; cần cấm `totalPaid` cả trong sắp xếp/dòng (5).
- Ghi chú bán hàng/hóa đơn m1: thiếu quyền xem và tối thiểu hóa dữ liệu (7).
- RLS/secret/edge function/thanh toán: N/A (không backend), có điều kiện ở (10).
