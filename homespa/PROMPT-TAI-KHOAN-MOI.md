# PROMPT DÁN VÀO TÀI KHOẢN CLAUDE MỚI

(Trước khi dán: vào Settings → Connectors của tài khoản mới, kết nối **GitHub**. Nếu GitHub đăng nhập bằng tài khoản khác thì cho tài khoản đó quyền vào repo `lehoangly173-ship-it/claude`. Muốn xuất bản web thì kết nối thêm **Expo** bằng tài khoản `hayquen`. Sau đó mở phiên Claude Code mới, chọn repo trên, rồi dán toàn bộ phần dưới.)

---

Chào bạn. Mình là **Ly**. Mình đang cùng Claude xây một app nhân sự tên **HOME SPA Flow** cho tiệm **Home Spa – Clinic Dr Quyên** (Đà Nẵng: massage trị liệu, gội đầu dưỡng sinh). Chủ tiệm là **chị Quyên (CEO)**. Mình chuyển sang tài khoản này vì tài khoản cũ hết lượt, nên bạn làm tiếp từ đúng chỗ cũ đã dừng.

## Cách làm việc với mình
- Luôn trả lời bằng **tiếng Việt**, ngắn gọn, dễ hiểu (mình không phải lập trình viên), tiết kiệm token.
- Không đọc lại thứ không cần; ưu tiên đọc `homespa/HANDOFF.md` và tài liệu trong `homespa/docs/`.
- Mình thích bạn **tự làm**, không hỏi nhiều. Chỉ hỏi khi thật sự phải chọn hướng.
- Trước khi báo xong, **luôn tự kiểm tra**:
  - chạy build;
  - chạy thử mọi luồng trên trình duyệt headless;
  - soát logic có hợp lý với nghiệp vụ không;
  - với thay đổi lớn, nhờ một agent rà soát độc lập.
- Báo kết quả gọn: đã làm gì, link xem thử, việc tiếp theo.

## Mình đang muốn làm gì (mục tiêu)
App cho **5 bộ phận** của Home dùng hằng ngày trên điện thoại (và máy tính): **KTV (kỹ thuật viên), Lễ tân, Leader/Quản lý, Marketing, CEO**.

Mỗi bộ phận có **4 nút mẹ** giống nhau về khung: **HÔM NAY · KHÁCH HÀNG · HỎI ĐÁP MỘC · CỦA TÔI**. Nội dung và quyền hạn mỗi bộ phận khác nhau. CEO thấy được mọi thứ; nhân sự chỉ thấy phần của mình.

Mục đích của app:
1. **Vận hành trơn tru mỗi ngày:**
   - chia ca, xoay tour KTV;
   - lịch hẹn, hàng chờ, sơ đồ giường, thu ngân & thẻ liệu trình;
   - dọn dẹp 12 khu có ảnh và chấm điểm;
   - Bill Money đối soát với tour;
   - đánh giá Google/Facebook;
   - đối chiếu sản phẩm xác nhận 2 bên;
   - xin nghỉ/đổi ca;
   - báo sự cố;
   - chấm công QR;
   - chốt ca tiền.
2. **Chăm sóc khách & giữ khách:** lọc tệp khách (lẻ/liệu trình, Việt/nước ngoài, 5 trạng thái gói, sinh nhật, lâu chưa quay lại, chưa hài lòng) → kịch bản mục tiêu → ghi kết quả chăm sóc.
3. **Minh bạch & công bằng:**
   - điểm uy tín đi theo sự kiện thật + minh chứng;
   - lễ tân ghi nhận, Leader/CEO duyệt;
   - việc vượt quyền (đổi giá, ngân sách > 2 triệu, xóa hóa đơn, nghỉ phép) phải chờ chị Quyên duyệt.
4. **Mộc:** trợ lý trong app. Mộc hướng dẫn quy trình, nhắc việc, giải thích dữ liệu của chính người hỏi; không tự quyết thay Leader/CEO; báo rõ khi Home chưa có quy định.
5. **Về sau:** nối dữ liệu thật (Supabase), đăng nhập Google, lưu ảnh; CEO có báo cáo tài chính, quỹ, nhân sự.

## Phong cách giao diện (bắt buộc giữ)
Theo video mẫu mình gửi (app của cháu mình làm trên Base44):
- nền sáng, **xanh lá Home** chủ đạo;
- khung "hero" xanh đậm ở đầu trang với tiêu đề **chữ có chân** (Playfair Display);
- các ô số liệu trắng bo tròn;
- danh sách **nút mẹ đánh số 1, 2, 3…** có mũi tên;
- nút viền xanh xếp 2 cột;
- **thanh tab dưới đáy** theo vai trò;
- trên cùng có **dải xanh "Demo — chuyển vai trò"** (KTV / Lễ Tân / Leader/Manager / Marketing / CEO) để mình bấm xem từng giao diện.

Thiết kế phải đẹp, gọn, dễ bấm trên điện thoại.

## Nguyên tắc khi sửa app
- **Luôn tuân theo luồng và các nút trong sơ đồ** ở `homespa/docs/`. Logic cũ hợp lý thì giữ; chỗ nào mâu thuẫn tài liệu thì sửa theo tài liệu.
- Không bịa số liệu. Mục chưa có dữ liệu thật thì hiện cấu trúc theo sơ đồ + nhãn "Chưa nối". Số liệu mẫu thì ghi rõ "số liệu mẫu".
- Bảo mật:
  - SĐT khách chỉ lễ tân (và CEO) thấy;
  - chỉ CEO xuất file;
  - KTV chỉ xem dữ liệu của chính mình.

## Code ở đâu
- GitHub: **`lehoangly173-ship-it/claude`**, thư mục **`homespa/`**, nhánh `main`.
- Đọc theo thứ tự:
  1. **`homespa/HANDOFF.md`** — tình trạng hiện tại, cấu trúc code từng file, quy tắc nghiệp vụ đã cài, việc còn lại, cách deploy.
  2. **`homespa/docs/`** — tài liệu nghiệp vụ chép từ Lark (cả bảng và sơ đồ):
     - `ktv-spec.md`, `ktv-mindmaps.md` (KTV + 12 khu dọn dẹp, Bill Money…);
     - `receptionist-spec.md` (Lễ tân: chốt ca, vận hành cơ sở, CSKH, ghi chú của chị Quyên về điểm uy tín và chia việc ca 1/ca 2);
     - `leader-home-spec.md`;
     - `marketing-spec.md` (12 bảng, nút 1.1–4.13);
     - `ceo-spec.md`, `ceo-tables.md` (13 nút mẹ ①–⑬, quỹ, công thức tài chính).
  3. Code trong **`homespa/src/`** (React 18 + Vite 5 + TypeScript; một kho dữ liệu chung `store.tsx`, nên thao tác ở vai trò này cập nhật ngay ở vai trò khác).
- Lệnh:
  ```
  cd homespa
  npm install
  npx tsc -p . --noEmit
  npx vite build
  ```
  Bản build là một file `dist/index.html`.
- Bản web đang chạy: **https://homespa--flow.expo.app**
  - tài khoản Expo `hayquen`;
  - project `@hayquen/homespa`;
  - projectId `16f65a26-63a8-4b23-8d5f-3e610e2aa3cc`.
  - Cách deploy có trong HANDOFF.md: sandbox EAS → clone repo → copy `homespa/dist/index.html` vào `site/dist/` → tạo `app.json` (có projectId) + `package.json` → `npx eas-cli deploy --export-dir dist --alias flow --non-interactive`.
- Commit xong thì push lên `main`, cập nhật HANDOFF.md nếu có thay đổi lớn, rồi deploy lại Expo để mình xem trên điện thoại.

## Việc bạn làm ngay bây giờ
1. Đọc `homespa/HANDOFF.md`, lướt `homespa/docs/` và cấu trúc `homespa/src/`.
2. `npm install`, build và chạy thử để chắc mọi thứ còn chạy.
3. Tóm tắt cho mình 5–7 dòng: bạn hiểu app đang ở đâu, và đề xuất 3 việc nên làm tiếp theo thứ tự ưu tiên.
4. Sau đó làm việc mình giao: **[ghi việc bạn muốn làm ở đây]**
