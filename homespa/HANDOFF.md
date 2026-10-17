# HOME SPA Flow — bàn giao cho phiên làm việc tiếp theo

Chủ dự án: **Ly** (trả lời bằng tiếng Việt, ngắn gọn, tiết kiệm token). App nhân sự cho **Home Spa – Clinic Dr Quyên (Đà Nẵng)**.
Đọc file này trước, rồi đọc `docs/` khi cần chi tiết nghiệp vụ.

## Đang ở đâu (07/10/2026)
- App đã **thiết kế lại theo video mẫu** của Ly (app Base44 do cháu Ly làm): xanh lá Home, tiêu đề chữ có chân (Playfair Display), thẻ trắng bo tròn, hero xanh, **nút mẹ đánh số**, thanh tab dưới theo vai trò, dải "Demo — chuyển vai trò" phía trên.
- Logic giữ từ bản trước (lịch điều phối Gantt kéo thả, chia tour xoay vòng, thu ngân + thẻ liệu trình, duyệt CEO, Leader Home), thêm toàn bộ luồng hằng ngày theo sơ đồ Lark.
- Đã chạy thử headless mọi vai trò/trang con + rà soát độc lập (17 lỗi đã sửa).
- Bản web (từ 11/10): https://hayquen2-homespa--flow.expo.app (Expo account `hayquen2`, project `@hayquen2/homespa`, projectId `70f679aa-20f1-43e3-9858-a4fea2cf4522`). Link cũ https://homespa--flow.expo.app (`hayquen`, projectId `16f65a26-63a8-4b23-8d5f-3e610e2aa3cc`) vẫn chạy bản fix lần 1.

## Các bản (đánh số theo yêu cầu của Ly)
| Bản | Nhánh GitHub | Commit | Nội dung |
|---|---|---|---|
| Bản 1 — bản chuẩn đầu tiên | `ban-1` | aafa1d7 | Bản trước khi sửa 07/10. Trang lưu: https://claude.ai/artifact/T2qvJupenjggrB9uajMXnT |
| Bản 2 | `ban-2` | 2112c49 | Chạy trên web 08–10/10. | Menu "Hôm nay" bật ra trên máy tính + sửa logic các luồng. Trang xem thử: https://claude.ai/artifact/QQsdqNiCi2D137VqaXbT9Q |
| Bản 3 | `ban-3` | 695aa4e | Fix lần 1 + Fix lần 3 (11/10): mức ưu tiên thông báo Đỏ/Vàng/Xanh/Trắng, giao diện đồng nhất, sơ đồ giường KTV, ô số tự do, bộ lọc khách hàng. **Đang chạy ở https://hayquen2-homespa--flow.expo.app (deploy 11/10)**; link cũ homespa--flow.expo.app vẫn bản fix lần 1. Xem thử: https://claude.ai/artifact/2aArSe57RwaNQ9rRRTiYV3 |
| (chờ Bản 4) | `develop` | 695aa4e | Bản đang phát triển tiếp. |
Mỗi lần sửa xong và Ly đồng ý → tạo bản tiếp theo bằng NHÁNH (proxy chặn đẩy tag): `git push origin HEAD:refs/heads/ban-N` + ghi thêm dòng vào bảng này.
Quay lại bản cũ: deploy file `homespa/dist/index.html` của nhánh bản đó lên Expo.

## Hai tài khoản Claude cùng làm (từ 08/10)
- Claude lehoangly173@gmail.com ↔ GitHub `lehoangly173-ship-it` (chủ repo).
- Claude levanly1703@gmail.com ↔ GitHub `levanly1703-cell` (cộng tác, quyền ghi).
- Quy tắc: không làm 2 tài khoản cùng lúc; đầu phiên `git pull origin develop`, cuối phiên đẩy lên `develop` (không đẩy `main`; Ly duyệt bằng Merge pull request) + cập nhật HANDOFF.

## Deploy Expo (qua Expo connector trong Claude)
Đang dùng: `hayquen2`, project `@hayquen2/homespa`, projectId `70f679aa-20f1-43e3-9858-a4fea2cf4522`, link https://hayquen2-homespa--flow.expo.app (alias `flow`). Tài khoản cũ: `hayquen`, project `@hayquen/homespa`, projectId `16f65a26-63a8-4b23-8d5f-3e610e2aa3cc`, link https://homespa--flow.expo.app (alias `flow`). Gói miễn phí: 60 phút CI/tháng; hết hạn mức 11/10, cấp lại 01/11/2026.

Các bước (Claude tự làm khi connector đã nối đúng tài khoản):
1. `sandbox_create` { appFullName: `@<chủ>/homespa`, operatingSystem: LINUX, resourceClass: MEDIUM, waitForReady: true }.
2. `sandbox_exec`: `git clone --depth 1 -b develop https://github.com/lehoangly173-ship-it/claude.git repo && mkdir -p ~/site/dist && cp repo/homespa/dist/index.html ~/site/dist/`
   (repo phải Public mới clone được không cần đăng nhập. Nếu repo Private: đẩy file vào sandbox bằng base64 chia nhỏ qua `sandbox_exec`, hoặc dùng `projectArchive.gitRef` khi project Expo đã liên kết GitHub.)
3. Trong `~/site`: tạo `app.json` = `{"expo":{"name":"homespa","slug":"homespa","owner":"<chủ>","extra":{"eas":{"projectId":"<projectId>"}}}}` và `package.json` = `{"name":"homespa","version":"1.0.0","private":true}`.
4. `cd ~/site && npx eas-cli deploy --export-dir dist --alias flow --non-interactive` → link `https://<tên-project>--flow.expo.app`.
5. `sandbox_stop` (luôn tắt để không tốn phút).

### Đổi sang tài khoản Expo mới (Ly làm, điện thoại cũng được)
1. expo.dev → đăng ký tài khoản mới (Ly đã tạo 11/10).
2. Trên expo.dev, bấm **Create a project**, đặt tên `homespa`. Nếu không tạo, Claude không mở được sandbox vì sandbox cần project có sẵn.
3. claude.ai → Settings → Connectors → Expo → ngắt `hayquen` → kết nối lại bằng tài khoản mới.
4. Nhắn Claude "đã đổi Expo, tài khoản <tên>". Claude: lấy projectId (`npx eas-cli project:info` trong sandbox hoặc trang project), sửa dòng "Tài khoản" ở trên, deploy theo 5 bước, gửi link mới.
- Link sẽ đổi (link cũ thuộc `hayquen`). Muốn dùng lại link cũ: nối lại `hayquen` sau 01/11.
- Không cần lưu mật khẩu/token nào vào repo; connector tự giữ đăng nhập.

## Phân quyền thật (13/10, nhánh `team/phan-quyen`, CHƯA phát hành)
- Phương án đầy đủ + ma trận quyền: `docs/PHAN-QUYEN.md`. Rà soát bảo mật: `../docs/team/security-phan-quyen.md`.
- SQL: `supabase/migrations/0001_phan_quyen.sql` (bảng, RLS, hàm duyệt tài khoản, nhật ký, Storage). Kiểm thử: `supabase/test/rls.test.ts` (PGlite, 20 ca).
- App: `src/auth.tsx` (đăng nhập Google/email, xin tham gia, CEO duyệt — `RealMembers`). Có `VITE_SUPABASE_URL/ANON_KEY` → bản thật (tắt dải demo, vai trò cố định); không có → demo như cũ.
- Lớp 2 ở app: `allow()` trong store; tìm SĐT chỉ Lễ tân/CEO, khớp đủ số (`phoneMatch`).
- Còn lại: Ly tạo dự án Supabase → chạy migration → nối dữ liệu nghiệp vụ → thử nội bộ → phát hành.

## Rà soát số liệu 13/10 (trước phát hành)
- Leader ③④⑤ (Vận hành, Chi tổng, Doanh thu–LN) giờ lấy cùng nguồn `period.ts` theo kỳ chung (trước lấy chi phí cả tháng trừ tiền thu hôm nay → lợi nhuận âm sai).
- `vndShort` hiện số âm đúng (-24,2tr). Mục tiêu tháng = đúng mục tiêu CEO (chia theo số ngày thật của tháng).
- Hôm nay: tổng tiền theo KTV = tiền thu hóa đơn (chia theo giá trị dòng, `ktvShareOfInvoice`); lễ tân cộng cả bán sản phẩm.
- Khách mới + quay lại = khách đã đến; lượt đặt không tính lịch hủy & khách vãng lai; lợi nhuận trừ giá vốn hàng bán.
- Tồn kho ở bảng cây dùng `stockQty`; tiền theo nguồn khách theo kỳ; bảng cây không còn tự bịa mục tiêu/kỳ trước/tỉ lệ → "Chưa nối".
- Công nợ: thẻ tiền định giá theo giá bán; "Lợi nhuận từ công nợ" = tổng công nợ − chi phí. Ảnh bill khớp 1-1 với tour. KTV rảnh phải đã chấm công.
- Chưa sửa (ghi nhận): chi "Hàng hóa sử dụng" có thể trùng vật tư; điểm đánh giá NV tính cả đời; chi phí cố định ghi 1 lần/tháng nên kỳ ngắn dao động.

## Cập nhật 12/10 (đợt 2) — chọn kỳ thống nhất, màu, ảnh mẫu theo khu, thu gọn cài đặt
- Kỳ dùng chung mọi màn (`period.ts`): Hôm nay · 7 ngày (cuốn chiếu) · 1 tháng · 1 quý · 1 năm (lịch, tính đến hôm nay) · Tùy chọn (Ngày bắt đầu/kết thúc + nút Xem). Thu ngân, trang nút cháu (cây) cũng theo kỳ này.
- Chip/tab đang chọn, nhãn ngày: xanh đậm; vách ngăn tầng: nâu đậm.
- Ảnh mẫu: Leader/CEO thêm ảnh và gán cho khu/hạng mục cụ thể (`RefPhotosPage`).
- Cài đặt CEO: các khối dài thu gọn (`Block fold`).
- Báo cáo dọn dẹp đang chờ: chụp lại / chọn album (`replaceCleanPhoto`).

## Cập nhật 12/10 — ngày làm việc, ảnh mẫu, ghi nhận CSKH, cài đặt, lương mẫu
Nhánh dự phòng trước đợt này: `du-phong-truoc-anh-ngay`.
- **Ô 📅 trên đầu chọn được ngày** (period.ts `setWorkDay/useWorkDay/isPastDay`, đổi `D.TODAY`; tối đa lùi 1 năm). Mỗi ngày một bộ dữ liệu riêng trong store (cất/mở theo ngày; ngày chưa có → dữ liệu mẫu). Ngày đã qua: chỉ Leader/CEO ghi/sửa (mutate/tryMutate/addCustomer/confirmInvoice/reset chặn), người khác chỉ xem + thanh "Về hôm nay".
- **Ảnh minh chứng**: `PhotoInput` có Chụp ảnh (camera) + Chọn ảnh có sẵn; `RefPhoto` ảnh mẫu đối chiếu (s.refPhotos, chỉ Leader/CEO sửa); trang quản lý chung `home/refphotos` (Leader Hôm nay, CEO Cài đặt).
- **KTV Ghi nhận chăm sóc khách** (screens/careNote.tsx): nút trong "Tour hôm nay"; chỉ khách KTV đã làm hôm nay; 5 phần theo mẫu; lưu `customer.careNotes`, không ghi đè sức khỏe/sở thích gốc; hồ sơ khách hiện "Ghi nhận gần nhất"; KTV chỉ thấy ghi nhận của mình, không thấy tiềm năng chi.
- **⑬ Cài đặt hệ thống** (screens/settings.tsx): 16 mục bấm được, dữ liệu thật nếu app có, còn lại ghi "số liệu mẫu".
- **Thu nhập của tôi**: chọn tháng, ngày công, ngày nghỉ, hoa hồng, thưởng, phạt, Tổng lương thưởng, phiếu 3 tháng (`PAY_RULE/payslip` — số liệu mẫu, chờ CEO cài công thức).
- **Công nợ**: 2 cột (trái công nợ + Tổng công nợ = nợ cọc + nợ khách đã trả đủ; phải lợi nhuận); nợ cọc = giá trị buổi còn lại − phần khách còn thiếu.
- Giao diện: ô số lớn nền xanh nhạt cả app; sơ đồ giường tên tầng đỏ + gạch ngăn; không còn trôi ngang (`.main{overflow-x:hidden}`, thẻ cây co theo màn); đổi trang tự cuộn lên đầu.

## Cập nhật 11/10 (20h) — rà soát logic + deploy
- "Tiền đã thu" mọi màn (CEO Hôm nay, Điều phối, Thu ngân, CEO/Leader theo kỳ) = hóa đơn + bán sản phẩm (`soldToday` trong logic.ts) → cùng một số. Chốt ca chỉ đối chiếu hóa đơn theo phương thức, ghi rõ khoản bán sản phẩm đếm riêng.
- Nút cây: menu máy tính mở bằng bàn phím (onFocus), nút mẹ không có con thì chạm là vào trang; `iconFor` sửa nhận nhầm "giá"; ② Chăm sóc KH: nút con cuộn tới đúng khối.
- `withDay`: ngày gắn ngay sau chữ "hôm nay" (VD "Khách mới hôm nay 11/10"). Mộc: thiếu dữ liệu hiện "—".
- Kiểm tra: scratchpad consist.mjs (20 kiểm tra số khớp giữa màn + luồng), chạy cả trên web thật: 20/20.
- Đã deploy commit ce5939f lên https://hayquen2-homespa--flow.expo.app (11/10 20h).

## Cập nhật 11/10 (tối) — gọn nút con + mốc ngày khắp app
- `TreeNodes` (tree.tsx): chạm nút mẹ → danh sách nút con nằm TRONG cùng thẻ (kiểu danh sách cài đặt), mỗi lần mở một nút, có số lượng ▾ và dòng "Xem tổng hợp"; máy tính rê chuột vẫn mở, bấm không bị đóng ngược.
- Bỏ mã số kiểu 1.8.1: nút mẹ vẫn đánh số (quy tắc giao diện); nút con dùng biểu tượng theo nội dung (`iconFor`), nút cháu chỉ có chữ; tiêu đề trang không còn mã số.
- Mốc ngày: chip "📅 CN 11/10/2026" trên thanh đầu mọi vai trò; mọi nhãn có chữ "hôm nay" (eyebrow, tiêu đề khối, ô số, Stat, hero tag) tự thêm ngày dd/mm (`withDay` trong ui.tsx). Phê duyệt CEO, Mộc trả lời, Báo cáo tuần Leader dùng số theo kỳ từ period.ts, ghi rõ ngày.

## Cập nhật 11/10 (chiều) — THỜI GIAN + BIỂU ĐỒ cho Leader/CEO (yêu cầu cháu Ly)
Nhánh dự phòng trước khi làm: `du-phong-truoc-bieu-do` (= Bản 3).
- **Một nguồn số theo thời gian: `src/period.ts`.** Hôm nay = dữ liệu thật trong state (hóa đơn, lịch, chấm công, chi tiêu, kho); ngày đã qua = số liệu mẫu cố định theo ngày (`pastDay`, có cache); tương lai = 0. Chi tiêu lễ tân nhập trong tháng hiện tại thay phần mẫu của đúng hạng mục. Tiền mặt bằng/điện/nước/wifi mẫu ghi một lần/tháng vào ngày cố định. Khi nối dữ liệu thật: chỉ thay `pastDay()` (và lọc theo ngày trong `todayReal`).
- **Kỳ dùng chung toàn app**: `usePeriod()` (Ngày · Tuần (thứ Hai) · Tháng · Quý · Năm · Tùy chọn, tối đa từ đầu năm cách 3 năm). Kỳ so sánh = kỳ liền trước cắt cùng số ngày (`prevOf`). Mọi khối ghi rõ "dd/mm/yyyy – dd/mm/yyyy" và kỳ so sánh.
- **Biểu đồ không thư viện: `src/charts.tsx`**: `PeriodBar`, `ColChart` (cột nhóm, số âm đỏ, chạm cột xem số), `HBars` (so sánh người, xếp hạng), `Donut` (cơ cấu, ≤6 phần). Màu theo biến giao diện (sáng/tối).
- **Bảng dùng lại: `src/screens/timeDash.tsx`**: `HealthDash` (khách, tiền thu, tỷ lệ đến, chờ TB + 2 biểu đồ), `FinanceDash` (thu–chi–lợi nhuận + cơ cấu thu/chi/nguồn), `StaffCompare` (KTV/lễ tân: tour, doanh thu, khách yêu cầu, điểm, đi muộn, nghỉ — tổng theo người = tổng Home), `SourceDash`, `PeriodSummary`.
- Gắn vào: CEO Hôm nay (tóm tắt kỳ), ① Tổng quan 1.1/1.2, ④ Khách hàng, ⑤ Nguồn khách, ⑧ Doanh thu–Chi phí–LN, ⑨ Dòng tiền, ⑩ Nhân sự, Chấm công; Leader Hôm nay (tóm tắt), ③ Vận hành, ④ Chi tổng, ⑤ Thu–LN, ⑥ Công nợ (ghi ngày), Đội ngũ: Hiệu suất, Chấm công, Điểm uy tín; Leader "Của tôi"; Thu ngân lễ tân (7 ngày/tháng có ngày). Trang nút cháu (CEO/Marketing) tự có biểu đồ: theo thời gian → cột, nguồn/bộ phận → tròn, còn lại → cột ngang; kỳ chưa hết không đem so cao/thấp.
- Chi phí chưa gồm đủ lương (Chưa nối). Kiểm tra: `src/period.test.ts` (14 test).

## Cập nhật 11/10 — FIX LẦN 3 (Lark "Fix app Home lần 3") + đồng nhất cả app
Chi tiết yêu cầu: tài liệu Project `claude/lark-fix-lan-3.md`. Nhánh dự phòng trước khi sửa: `du-phong-truoc-fix-3`.
- **Quy tắc giao diện chung** (cuối `styles.css`, mục "FIX LẦN 3"): tiêu đề khối đậm trên dải xanh nhạt; nhãn mục (eyebrow) thành chip xanh; nhãn ô nhập đậm trên nền xanh; chạm/rê chuột vào nút → vàng (`--hov`); không cắt chữ/bóp cột (`.deep.bar`, `.g-auto`); hướng dẫn dài gập vào "Cách kéo thả".
- **Mức ưu tiên dùng chung**: 1 Đỏ làm ngay · 2 Vàng quan trọng · 3 Xanh vừa · 4 Trắng bình thường (`D.PRIO`, `prioOf`). Mặc định theo loại `s.prioCat` (CEO → Cài đặt), Leader/CEO đổi từng thông báo `s.prioSet`, Leader/CEO ghim thông báo mới. Thông báo ghim nằm trong `s.notifs` (`pinned`) nên có nút đã đọc từng cái. Thông báo Đỏ chưa đọc cộng vào "Việc cần chú ý" (KTV) và ô "Thông báo làm ngay" (Lễ tân).
- **Ô nhập số** `NumInput` (ui.tsx) thay 28 ô: xóa được, gõ từ 0; trống = 0 (hoặc "không lọc" với `optional`); số lượng 0 không lưu được.
- **Checklist dọn dẹp**: người phụ trách tích tự do cả khi đang chờ kiểm tra; khóa khi đã Đạt; Chưa đạt → tích lại từ đầu.
- **KTV Bảng điều phối**: thêm Sơ đồ giường + Lịch điều phối (chỉ xem, ẩn tên khách của KTV khác) + nút "Báo lễ tân" (`flagBed`).
- Sáng kiến: 4 nút nền đậm, form nền đậm. Hồ sơ khách: nhãn đậm (`.kv-l`). Hóa đơn: 4 mục A–D thành khối tiêu đề xanh đậm.
- Leader duyệt nghỉ/đổi ca (không tự duyệt đơn của mình); thông báo ghi đúng người duyệt.
- Kiểm tra: tsc, 53 unit test, 16 bài kiểm tra luồng, bò tự động 2 cỡ màn không lỗi; agent rà soát độc lập (9 lỗi đã sửa).

## Cập nhật 10/10 — FIX LẦN 1 (3 tài liệu Lark: KTV · Lễ tân · Leader) + CEO/Marketing
Tóm tắt yêu cầu đầy đủ: tài liệu Project `claude/lark-fix-lan-1.md`.
- **KTV:** (m1–m4 phiên trước) + nút 12 "Nhận bàn giao ca"; tab Của tôi 8 nút (`screens/mine.tsx`): hồ sơ (form), lịch tuần/tháng, chấm công + yêu cầu điều chỉnh, Hiệu suất 5 nhóm (`ktvPerf` trong logic.ts), KPI, đào tạo, thu nhập (Chưa nối), yêu cầu & lịch sử.
- **Lễ tân** (`screens/reception2.tsx`): Vận hành cơ sở 8 nút — vệ sinh lao công 4 khu (AI giả lập), không gian trải nghiệm 9 mục, vật tư 8 nút con (phiếu kho `stockMoves`, tiêu hao = đầu+nhận−trả−cuối, cảnh báo/đề xuất mua, tiền hàng, duyệt), thiết bị & sinh nhật → Leader duyệt (`opsReqs`), điểm uy tín + ảnh, bàn giao ca (`handovers`), Chi tiêu vận hành (`expenses`, mục mới).
- **Leader** (`screens/leader2.tsx`): Hôm nay = Vận hành nhóm (chọn KTV/Lễ tân, số đỏ), duyệt nghỉ phép có đối chiếu (Leader được duyệt đơn nghỉ/đổi ca), duyệt đề xuất vận hành; nút mẹ ② CSKH (tab Khách hàng) ③ Vận hành ④ Chi tổng ⑤ Doanh thu–lợi nhuận ⑥ Công nợ (`debtSummary`) ⑦ Nhân sự (lương, hiệu suất, đào tạo).
- **CEO + Marketing** (`tree.tsx`): chạm/rê vào nút mẹ là xổ nút con; nút con xổ nút cháu; trang nút cháu = bảng theo cột "chắt" của tài liệu, danh sách lấy từ dữ liệu app (nhân viên, khách, chiến dịch, nguồn, dự án, kho, khu dọn, sự cố, kỳ), mục tiêu/kỳ trước là số liệu mẫu suy ra; Mộc phân tích (giả lập); nút thao tác cuối.
- Kiểm tra: tsc + build; bò tự động hơn 4.000 lần bấm ở 390px, không lỗi console/trang trắng.

## Cập nhật 07/10 (phiên mới)
- Máy tính: bấm "Hôm nay" ở thanh trái → menu bật ra chứa nút mẹ/nhóm nút (cơ chế `MenuCtx` trong ui.tsx: `Nodes`/`ChipGrid` của trang gốc Hôm nay tự chuyển vào menu). Điện thoại giữ nguyên.
- Sửa logic (2 agent rà soát độc lập): chốt ca chặn bấm 2 lần/tiền âm/lệch phải ghi lý do, ô sổ sách Bill Money & sản phẩm chỉ tick được khi đủ điều kiện, chốt ca lưu mã hóa đơn (`codes`) để không sót hóa đơn; "Home sắp xếp" xoay tour; không gợi ý KTV chưa chấm công; đổi ca chọn người đổi (`Leave.withId`) → duyệt thì bảng ca đảo cả 2; KTV chỉ xem bill/khách của mình; sự cố chuyển việc không đếm trùng; review ghi cho KTV của tour, không cộng điểm 2 lần; duyệt điểm chỉ Leader/CEO + báo người liên quan; thông báo duyệt không lộ đơn cá nhân; từ chối tăng ngân sách giữ số đã duyệt; Mộc không tự đặt quy chuẩn/không trả sai quy trình; số mẫu có nhãn; Mộc Marketing theo nút 3.1–3.9.
- Còn để sau (là thêm giao diện): CEO ⑦ thêm nút 12.2/12.4/12.5/12.6; Marketing Hôm nay 6 ô theo doc; Leader thiếu nút "Kiểm tra đầu ca", "Bàn giao – chốt ngày"; tiếp tục/hủy hóa đơn nháp; CEO thẻ lợi nhuận/dòng tiền "Chưa nối".

## Chạy & build
```
cd homespa && npm install
npm run dev            # chạy thử
npx tsc -p . --noEmit  # kiểm tra kiểu
npx vite build         # ra dist/index.html (1 file duy nhất, vite-plugin-singlefile)
```
Deploy Expo: xem mục "Deploy Expo" ở trên.

## Cấu trúc code (`homespa/src`)
| File | Vai trò |
|---|---|
| `data.ts` | Kiểu dữ liệu + dữ liệu mẫu (nhân sự, giường, dịch vụ, gói, khách, lịch…), 12 khu dọn `ZONES`, `PRODUCTS`, `rosterCell` (lịch 4 tuần), `MOC_GROUPS`, `OPS_ITEMS`, `BOOK_CHECKS`. Khi nối Supabase: mỗi mảng = 1 bảng. |
| `logic.ts` | Phép tính dẫn xuất (trùng lịch KTV/giường, trạng thái KTV/giường, gợi ý chia tour, cảnh báo, `billRows` đối soát bill, `expectedByMethod` tiền chốt ca, `canSee` thông báo). |
| `store.tsx` | Kho dữ liệu chung + mọi thao tác (một thay đổi cập nhật mọi vai trò). |
| `ui.tsx` | Thành phần dùng chung: `Hero`, `Tiles`, `Nodes`, `Block`, `ChipGrid`, `SubHead`, `PhotoInput`, `NodeSpec`, `CustomerModal`… |
| `specs.ts` | Trích tự động bảng nút con từ `docs/ceo-tables.md` & `docs/marketing-spec.md` (mục chưa nối dữ liệu hiện cấu trúc + nhãn "Chưa nối", không bịa số). |
| `App.tsx` | Khung, tab theo vai trò (`TABS`), `route()` đổi id cũ → `tab/sub`. |
| `screens/daily.tsx` | Trang con dùng chung của "Hôm nay": ca & tour, dọn dẹp, bảng điều phối, khách của KTV, thông báo, Bill Money, đánh giá Google/FB, sản phẩm 2 bên, nghỉ phép, sự cố, chấm công nhóm. |
| `screens/staff.tsx` | KTV & Lễ tân: Hôm nay, Vận hành (OpsHub), Khách hàng CSKH, Chốt ca, Vận hành cơ sở, Của tôi (5 nút). |
| `screens/roles.tsx` | Leader (Hôm nay, Đội ngũ, điểm uy tín), Marketing (nút 1.x–4.x), CEO (13 nút mẹ ①–⑬, cài đặt phân khu). |
| `screens/ops.tsx`, `cashier.tsx`, `ktv.tsx`, `leader.tsx`, `ceo.tsx` | Màn cũ được tái dùng (lịch Gantt, hàng chờ, giường, thu ngân, Leader Today/Customers/Mộc/Mine, phê duyệt). |

## Tab theo vai trò
- **KTV:** Hôm nay · Công việc · Hỏi Mộc · Của tôi
- **Lễ tân:** Hôm nay · Vận hành · Khách hàng · Hỏi Mộc · Của tôi
- **Leader:** Hôm nay · Đội ngũ · Khách hàng · Hỏi Mộc · Của tôi
- **Marketing:** Hôm nay · Khách hàng · Hỏi Mộc · Của tôi
- **CEO:** Hôm nay (①②③) · Khách hàng (④⑤⑥) · Mộc & Duyệt (⑦) · Của tôi (⑧–⑬)

## Quy tắc nghiệp vụ đã cài
- Ca 1 08:00–18:00, ca 2 10:00–20:00; dọn giường 10 phút giữa 2 khách; vòng đời lượt khách: booked → checked_in → in_service → done → paid.
- 12 khu dọn: 1–6 ca sáng, 7–12 ca chiều; giặt khăn 4 lần chỉ báo sau 10:00/12:00/15:00/17:00; bắt buộc ảnh + tick đủ; Leader kiểm tra → Đạt +2 điểm / Chưa đạt kèm lý do.
- Điểm uy tín: lễ tân **ghi nhận**, Leader/CEO **duyệt** (ghi chú của chị Quyên). Mộc không tự cộng/trừ điểm.
- Bill Money: KTV tải ảnh theo ca; lễ tân xác nhận danh sách tour ↔ hóa đơn cho nhóm; tour chưa thu → nêu trách nhiệm KTV/lễ tân.
- Sản phẩm: xác nhận 2 bên KTV + lễ tân, ảnh là căn cứ truy cứu.
- Nghỉ phép / đổi ca: CEO duyệt → bảng chia ca tự cập nhật; người gửi nhận thông báo.
- Chốt ca lễ tân: tiền theo phương thức (từ hóa đơn sau lần chốt gần nhất) + 5 mục sổ sách; lệch phải ghi lý do.
- SĐT khách: chỉ lễ tân (và CEO) thấy; chỉ CEO xuất file. Ngân sách Leader/Marketing tự quyết ≤ 2.000.000đ, có đổi giá/ưu đãi → chị duyệt.

## Việc còn lại (gợi ý thứ tự)
1. Ly duyệt giao diện mới, góp ý chỉnh.
2. Nối **Supabase** (bảng theo `data.ts`; đăng nhập Google; ảnh lưu Storage). Hiện dữ liệu chỉ nằm trong bộ nhớ phiên chạy thử.
3. Các nút CEO/Marketing đang "Chưa nối": tài chính, quỹ, hợp đồng, nội dung, CSKH AI…
4. Lễ tân "Của tôi" trong Lark mới có tiêu đề — chờ Ly bổ sung.
5. Mộc hiện trả lời theo luật cài sẵn; sau này có thể nối AI thật.

## Tài liệu nghiệp vụ (`homespa/docs`)
`ktv-spec.md`, `ktv-mindmaps.md`, `receptionist-spec.md`, `leader-home-spec.md`, `marketing-spec.md`, `ceo-spec.md`, `ceo-tables.md` — chép đầy đủ từ Lark (bảng + sơ đồ).

## Kế hoạch tiếp theo (chốt 13/10 tối, chờ "con cháu" của Ly duyệt rồi mới làm)
Trạng thái: phân quyền thật + sao lưu đã CHUẨN BỊ xong trên nhánh `team/phan-quyen` (commit b82610b), CHƯA deploy. Ly nói: "khi nào tôi bảo public thì public".
**Khoảng trống lớn nhất:** app chưa nối dữ liệu nghiệp vụ vào Supabase (ngoài đăng nhập/duyệt tài khoản). Khách, lịch, hóa đơn, chấm công… vẫn nằm trong bộ nhớ từng máy → "nối dữ liệu" = mỗi thao tác ghi vào cơ sở dữ liệu chung, rồi kiểm quyền/số từng nhóm.
Thứ tự:
1. Ly tạo Supabase + Google OAuth (Claude hướng dẫn từng bước; Ly giữ mật khẩu): Authentication → Google (Client ID/Secret), thêm link app vào Redirect URLs.
2. Chạy `supabase/migrations/0001_phan_quyen.sql`; tạo dòng CEO đầu tiên (chị Quyên); chạy Supabase Advisors.
3. Claude nối dữ liệu theo nhóm: khách → lịch hẹn → hóa đơn → chấm công → kho/chi tiêu; kiểm thử từng nhóm; bỏ số liệu mẫu khỏi bản thật.
4. Làm trang `/admin`; xuất file khách ở máy chủ (chỉ CEO, có nhật ký); xóa EXIF ảnh; kiểm tra đường dẫn thông báo; không xóa hẳn (chỉ ẩn, CEO khôi phục).
5. Còn dở: ~44 chỗ "Chưa nối" (Cài đặt, Của tôi, Thời gian, Leader, Lễ tân), quy tắc lương thật (cần chị Quyên chốt), "Của tôi" của Lễ tân, i18n hết chữ, 3 điểm số liệu (Hàng hóa sử dụng trùng vật tư; điểm đánh giá NV tính cả đời; chi cố định ghi 1 lần/tháng).
6. Bảo mật thêm: xác thực 2 lớp cho Ly + chị Quyên; cảnh báo bất thường (xuất nhiều dữ liệu/đăng nhập lạ).
7. Chạy thử nội bộ 1–2 ngày với vài người → Ly duyệt → public.
**Sao lưu/khôi phục:** `docs/PHAN-QUYEN.md` mục 5 + `supabase/backup/backup.sh` (hằng đêm, mã hóa, giữ 30 ngày, nơi khác Supabase). Thử nội bộ: gói miễn phí + backup.sh; có khách thật: gói Pro + PITR (PITR = quay về từng giây trong ~7 ngày; kiểm tra lại giá trước khi mua). Thử khôi phục mỗi tháng.

### Tiến độ nối dữ liệu (cập nhật 15/10)
- Nhóm 1 xong trên `team/phan-quyen`: khách + nhân sự nối Supabase (`src/db.ts`, `store.tsx` hydrate + realtime, `migrations/0002_realtime.sql`). Bản thật không còn dữ liệu mẫu; các nhóm khác trống tới khi nối. Sửa lỗi Mộc khi chưa có chương trình.
- Kiểm thử: 97 test (có `src/db.test.ts`), quét bản thật bằng máy chủ giả cho 5 vai trò (không lỗi trang), thêm khách → ghi đúng bảng. Chưa thử với Supabase thật (chờ Ly tạo dự án).
- Tiếp theo: nhóm 2 = gói liệu trình + ghi nhận chăm sóc → lịch hẹn/hàng chờ → hóa đơn → chấm công → kho/chi tiêu.
- 17/10 — Nhóm 2 xong (nhánh `team/phan-quyen`): gói liệu trình + ghi nhận chăm sóc nối Supabase (`0003_nhom2_goi_cham_soc.sql`; KTV nhận số buổi qua `ktv_packages`). Bản thật dùng giờ VN thật (`vnNowMin`). 103 test đạt (24 RLS), quét 5 vai trò bản thật bằng máy chủ giả: 0 lỗi. Chưa thử Supabase thật. Tiếp theo: nhóm 3 = lịch hẹn + hàng chờ → hóa đơn (kèm bán gói/trừ buổi) → chấm công → kho/chi tiêu.
- Expo: ngày 15/10 sandbox kẹt "STARTING" > 6 phút (2 lần) nên chưa deploy; bản xem thử tạm qua trang xem thử Claude. Có thể do hết phút gói miễn phí — Ly kiểm tra expo.dev → Usage.
