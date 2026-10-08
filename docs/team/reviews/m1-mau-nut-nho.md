VERDICT: PASS

Tiêu chí M1-01..M1-13 đều có code + unit test (m1.test.ts) hoặc e2e (m1.spec.ts) tương ứng. Không có lỗi high/medium.

Lỗi nhỏ (low):
1. [low] daily.tsx CleanDetailModal — chữ mới viết cứng ngoài i18n: "Chưa báo", "báo ", " điểm", " · lý do: ", "khu số" — chuyển vào T.clean.
2. [low] logic.ts looksLikePhone — chỉ bỏ khoảng trắng/chấm/gạch; "0900,000,001" hoặc "(0900)000001" lọt qua — nên bỏ mọi ký tự không phải số (giữ dấu +).
3. [low] daily.tsx NoticesPage — dòng thông báo trước bấm cả hàng, nay chỉ bấm vùng chữ (cần để thêm nút Đã đọc) — chấp nhận, ghi nhận là thay đổi giao diện.

Thay đổi giao diện/chữ NGOÀI spec (báo Ly):
- Hôm nay: mô tả nút Dọn dẹp thêm tiền tố "Dọn dẹp ·" (T.menu.cleaningDescPrefix).
- MyWorkScreen: dòng eyebrow thêm "Công việc của kĩ thuật viên ·".
- Dọn dẹp: ô "Khu của tôi" đổi từ chữ "số 2, 3" thành số lượng + dòng phụ; nhãn "Điểm dọn dẹp hôm nay" -> "Điểm hôm nay"; bỏ viền/tông ok-warn cũ của các ô này; "Khu của tôi/Chờ kiểm tra" của KTV nay chỉ đếm báo cáo của chính KTV (đúng quy tắc riêng tư).
- Đối chiếu: nút lưu của KTV đổi chữ thành "Lưu · ghi nhận & xác nhận phía KTV" và không còn bị vô hiệu khi thiếu ảnh (báo lỗi thay vào).
- Ca/tour: tiêu đề SÁNG/CHIỀU bỏ dấu "·" (theo spec); Block header xanh đậm/nhạt có thêm padding + bo góc (CSS .block > .bh.deep/.mint).
- Thanh tab KTV đổi; nút "Khách hàng" bỏ khỏi Hôm nay; thêm badge cho nút 4 (số nhiệm vụ mở) — badge không có trong spec.

Đã kiểm, đúng:
- Màu 3 loại đúng từng màn (Hôm nay, Ca/tour, Dọn dẹp, Thông báo, Đối chiếu); biến CSS --mint-ink/--gold-ink/--mint-2 tồn tại.
- C6: TABS.ktv 4 tab; Hôm nay đúng 11 nút theo thứ tự spec; route() customers/mywork/work/beds đúng; vai trò khác không đổi TABS, dailySub dùng chung chỉ thêm case 'idea'.
- Đã đọc/chưa đọc theo từng người, unreadCount một nguồn cho tab, nút 5, chuông.
- Tiêu chuẩn mẫu ở mọi khu, "Tệp tài liệu: Chưa nối"; ô đọc/ô tích lưu store theo khu/ngày/KTV.
- Mục đích nhận SP: chặn SĐT, gợi ý chỉ theo tên/mã trong tập G4, hóa đơn bắt buộc, không dùng "Tải file"; canSeeBuyer chỉ KTV tạo + Lễ tân + CEO; Leader/KTV khác chỉ thấy "Bán cho khách".
- Nút 11 "Chưa nối" + ghi chú uy tín đúng spec.
