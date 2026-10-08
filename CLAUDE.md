# Dự án HOME SPA Flow

Chủ dự án: **Ly** (không code, là super admin mọi app). Luôn trả lời **tiếng Việt, ngắn gọn, dễ hiểu, tiết kiệm token**. Ly thích Claude tự làm, chỉ hỏi khi thật sự phải chọn hướng.

App nhân sự **Home Spa – Clinic Dr Quyên** (Đà Nẵng). Code ở `homespa/` (React 18 + Vite + TypeScript).

## Bắt đầu phiên
1. Làm việc trên nhánh `develop`: `git switch develop && git pull origin develop`. `main` chỉ nhận bản đã duyệt qua pull request.
2. Việc nhờ qua `/doi-agent`: chỉ đọc `docs/team/STATE.md`, đội tự lo phần còn lại. Việc sửa trực tiếp: đọc `homespa/HANDOFF.md` (tình trạng, cấu trúc, các bản, cách deploy).
3. Nghiệp vụ ở `homespa/docs/` (chép từ Lark): chỉ mở file liên quan, theo đúng luồng và nút trong đó.

## Quy tắc app
- Giữ giao diện hiện tại: xanh lá Home, hero xanh, chữ có chân Playfair Display, thẻ trắng bo tròn, nút mẹ đánh số, thanh tab dưới theo vai trò, dải "Demo — chuyển vai trò".
- Không bịa số liệu: chưa có dữ liệu → "Chưa nối"; số mẫu → ghi "số liệu mẫu".
- Bảo mật: SĐT khách chỉ lễ tân + CEO thấy; chỉ CEO xuất file; KTV chỉ xem dữ liệu của mình.
- Mọi app: có đăng nhập và phân quyền (RLS), có /admin sửa nội dung không cần code, mỗi con số chỉ có một nguồn và cập nhật ngay mọi nơi, không viết cứng chữ hiển thị (dùng file i18n), một mã nguồn cho điện thoại và máy tính, dễ mở rộng thêm hóa đơn/thuế/doanh thu/thanh toán.

## An toàn
- Không push hay deploy lên `main`, không đụng database thật, không đọc hay in file `.env`. Ly duyệt phát hành bằng cách bấm Merge pull request `develop` → `main` trên GitHub.
- Trước khi nói "không làm được": thử cách khác, rồi báo đã thử gì.

## Làm việc
- Đội agent chạy bằng `/doi-agent` (agent ở `.claude/agents/`, trạng thái ở `docs/team/STATE.md`). Đội đã tự kiểm tra bằng `check.sh` và người soát lỗi, đừng chạy lại.
- Ở phiên cloud: `gh pr create` bị chặn → tạo PR bằng `gh api repos/lehoangly173-ship-it/claude/pulls ...`; không đẩy được tag → lưu bản bằng nhánh (`ban-N`, `chuan-YYYYMMDD`).
- Việc sửa trực tiếp (không qua đội): trước khi báo xong chạy `cd homespa && npx tsc -p . --noEmit && npx vite build`, thử các luồng bằng trình duyệt headless; việc lớn thì nhờ một agent rà soát độc lập.

## Cuối phiên
1. Commit và push lên `develop` (hoặc `team/*`), không push `main`.
2. Cập nhật `homespa/HANDOFF.md` nếu có thay đổi đáng kể.
3. Ly đồng ý bản mới → lưu bản kế tiếp: `git push origin HEAD:refs/heads/ban-N`, ghi thêm dòng vào bảng trong HANDOFF.
4. Chỉ khi Ly đồng ý mới deploy bản xem thử lên https://homespa--flow.expo.app (Expo `hayquen`, project `@hayquen/homespa`), cách làm trong HANDOFF.
5. Báo Ly gọn: đã làm gì, link xem thử, việc tiếp theo.

## Tài khoản
- Claude lehoangly173@gmail.com ↔ GitHub `lehoangly173-ship-it` (chủ repo).
- Claude levanly1703@gmail.com ↔ GitHub `levanly1703-cell` (cộng tác, quyền ghi).
- Không để 2 tài khoản sửa cùng lúc.
