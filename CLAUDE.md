# Dự án HOME SPA Flow — đọc trước khi làm bất cứ việc gì

Chủ dự án: **Ly** (không phải lập trình viên). Luôn trả lời **tiếng Việt, ngắn gọn, dễ hiểu, tiết kiệm token**. Ly thích Claude tự làm, chỉ hỏi khi thật sự phải chọn hướng.

App nhân sự cho **Home Spa – Clinic Dr Quyên** (Đà Nẵng). Code ở `homespa/` (React 18 + Vite + TypeScript).

## Bắt đầu mỗi phiên (tài khoản nào cũng vậy)
1. `git pull origin main` để lấy bản mới nhất (2 tài khoản Claude dùng chung repo này).
2. Đọc `homespa/HANDOFF.md`: tình trạng, cấu trúc code, quy tắc nghiệp vụ, danh sách các bản, cách deploy.
3. Nghiệp vụ chi tiết ở `homespa/docs/` (chép từ sơ đồ Lark) — luôn theo đúng luồng và nút trong đó.

## Khi sửa
- Giữ phong cách giao diện hiện tại: xanh lá Home, hero xanh, chữ có chân Playfair Display, thẻ trắng bo tròn, nút mẹ đánh số, thanh tab dưới theo vai trò, dải "Demo — chuyển vai trò".
- Không bịa số liệu: chưa có dữ liệu → "Chưa nối"; số mẫu → ghi "số liệu mẫu".
- Bảo mật: SĐT khách chỉ lễ tân + CEO thấy; chỉ CEO xuất file; KTV chỉ xem dữ liệu của mình.
- Trước khi báo xong: `cd homespa && npx tsc -p . --noEmit && npx vite build`, chạy thử mọi luồng bằng trình duyệt headless, soát logic theo tài liệu; thay đổi lớn thì nhờ một agent rà soát độc lập.

## Kết thúc mỗi phiên
1. Commit + `git push origin main`.
2. Cập nhật `homespa/HANDOFF.md` nếu có thay đổi đáng kể.
3. Ly đồng ý bản mới → lưu thành bản kế tiếp: `git push origin HEAD:refs/heads/ban-N` (Bản 1, Bản 2… xem bảng trong HANDOFF) và ghi thêm dòng vào bảng.
4. Deploy lên https://homespa--flow.expo.app (Expo tài khoản `hayquen`, project `@hayquen/homespa`) — cách làm trong HANDOFF.md.
5. Báo Ly gọn: đã làm gì, link xem thử, việc tiếp theo.

## Tài khoản
- Claude lehoangly173@gmail.com ↔ GitHub `lehoangly173-ship-it` (chủ repo).
- Claude levanly1703@gmail.com ↔ GitHub `levanly1703-cell` (cộng tác, quyền ghi).
- Không để 2 tài khoản sửa cùng lúc.
