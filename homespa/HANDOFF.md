# HOME SPA Flow — bàn giao cho phiên làm việc tiếp theo

Chủ dự án: **Ly** (trả lời bằng tiếng Việt, ngắn gọn, tiết kiệm token). App nhân sự cho **Home Spa – Clinic Dr Quyên (Đà Nẵng)**.
Đọc file này trước, rồi đọc `docs/` khi cần chi tiết nghiệp vụ.

## Đang ở đâu (07/10/2026)
- App đã **thiết kế lại theo video mẫu** của Ly (app Base44 do cháu Ly làm): xanh lá Home, tiêu đề chữ có chân (Playfair Display), thẻ trắng bo tròn, hero xanh, **nút mẹ đánh số**, thanh tab dưới theo vai trò, dải "Demo — chuyển vai trò" phía trên.
- Logic giữ từ bản trước (lịch điều phối Gantt kéo thả, chia tour xoay vòng, thu ngân + thẻ liệu trình, duyệt CEO, Leader Home), thêm toàn bộ luồng hằng ngày theo sơ đồ Lark.
- Đã chạy thử headless mọi vai trò/trang con + rà soát độc lập (17 lỗi đã sửa).
- Bản web: https://homespa--flow.expo.app (Expo account `hayquen`, project `@hayquen/homespa`, projectId `16f65a26-63a8-4b23-8d5f-3e610e2aa3cc`).

## Các bản (đánh số theo yêu cầu của Ly)
| Bản | Git tag | Commit | Nội dung |
|---|---|---|---|
| Bản 1 — bản chuẩn đầu tiên | `ban-1` | aafa1d7 | Bản đang chạy ở homespa--flow.expo.app (trước khi sửa 07/10). Trang lưu: https://claude.ai/artifact/T2qvJupenjggrB9uajMXnT |
| Bản 2 | `ban-2` | (commit có tag ban-2) | Menu "Hôm nay" bật ra trên máy tính + sửa logic các luồng. Trang xem thử: https://claude.ai/artifact/QQsdqNiCi2D137VqaXbT9Q |
Mỗi lần sửa xong và Ly đồng ý → tạo bản tiếp theo: `git tag ban-N` + đẩy tag lên GitHub + ghi thêm dòng vào bảng này.
Quay lại bản cũ: `git checkout ban-1` (chỉ xem) hoặc deploy file `homespa/dist/index.html` của tag đó lên Expo.

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
Deploy Expo: tạo sandbox EAS, clone repo, copy `homespa/dist/index.html` vào `site/dist/`, `app.json` có projectId trên, chạy `eas deploy --export-dir dist --alias flow`.

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
