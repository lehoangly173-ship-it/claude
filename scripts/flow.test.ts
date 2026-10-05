// Kiểm tra luồng: khách đến → chia tour → làm → xong → dọn giường → thu tiền; số liệu phải nhảy theo.
import { alerts, bedStatus, ceo, isKtvFree, ktvStatus, metrics, suggestKtv, useApp, tourCount } from '../src/store';

let fail = 0;
const ok = (cond: boolean, msg: string) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fail++; };
const S = () => useApp.getState();

console.log('— Trạng thái ban đầu 10:15');
let m = metrics(S());
ok(m.ktvInShift === 6, `KTV trong ca = 6 (${m.ktvInShift})`);
ok(m.waiting.length === 4, `Khách chờ = 4 (${m.waiting.length})`);
ok(m.waitingLong.length === 2, `Chờ quá 10p = 2 (${m.waitingLong.length})`);
ok(m.unpaid.length === 1, `Chưa thanh toán = 1 (${m.unpaid.length})`);
ok(m.bedsUsed === 2, `Giường đang dùng = 2 (${m.bedsUsed})`);
ok(bedStatus(S(), 'TL-01').key === 'cleaning', 'TL-01 đang dọn');
ok(ktvStatus(S(), 'ngoc').key === 'notIn', 'Ngọc (Ca 2) chưa vào ca → cảnh báo');
ok(alerts(S()).some((a) => a.title.includes('Ngọc')), 'Có cảnh báo KTV chưa vào ca');
const rev0 = m.revenuePaid; const month0 = ceo(S()).monthRevenue;

console.log('— Chia tour khách VIP yêu cầu Lan');
const vip = S().bookings.find((b) => b.customerId === 'KH1101')!;
ok(suggestKtv(S(), vip) === 'lan', 'Gợi ý đúng KTV khách yêu cầu (Lan)');
ok(S().assign(vip.id, 'lan', 'TL-01') !== null, 'Không cho chia vào giường đang dọn');
ok(S().assign(vip.id, 'trieu', 'TL-03') !== null, 'Không cho chia KTV đang bận');
ok(S().assign(vip.id, 'lan', 'TL-03') === null, 'Chia Lan + TL-03 thành công');
ok(ktvStatus(S(), 'lan').key === 'prep', 'Lan → Chuẩn bị đón khách');
ok(bedStatus(S(), 'TL-03').key === 'prep', 'TL-03 → Chuẩn bị');
ok(metrics(S()).waiting.length === 3, 'Hàng chờ giảm còn 3');
ok(S().assign(vip.id, 'hien', 'TL-04') !== null, 'Không chia trùng lần hai');

console.log('— KTV bắt đầu, tua giờ, hoàn thành');
S().startService(vip.id);
ok(metrics(S()).bedsUsed === 3, 'Giường dùng tăng lên 3');
S().tick(45);
ok(ktvStatus(S(), 'lan').key === 'soon' || ktvStatus(S(), 'lan').key === 'busy', 'Lan vẫn đang làm sau 45p (dịch vụ 45p → sắp xong)');
S().complete(vip.id);
ok(bedStatus(S(), 'TL-03').key === 'cleaning', 'Xong → TL-03 chuyển Đang dọn');
ok(isKtvFree(S(), 'lan'), 'Lan rảnh lại');
ok(tourCount(S(), 'lan') === 2, `Lan có 2 tour (${tourCount(S(), 'lan')})`);
ok(metrics(S()).unpaid.length === 2, 'Chờ thanh toán tăng lên 2');
ok(metrics(S()).revenuePaid === rev0, 'Chưa thu thì doanh thu đã thu KHÔNG đổi');

console.log('— Dọn giường bằng checklist');
for (let i = 0; i < 4; i++) S().toggleClean('TL-03', i);
ok(bedStatus(S(), 'TL-03').key === 'free', 'Tick đủ 4 bước → TL-03 Trống');

console.log('— Thu ngân');
const visits0 = S().customers.find((c) => c.id === 'KH1101')!.visits;
const pkg0 = S().customers.find((c) => c.id === 'KH1101')!.packageLeft;
S().pay(vip.id, 'Trừ gói');
S().pay(vip.id, 'Trừ gói'); // bấm 2 lần không được trừ 2 lần
m = metrics(S());
ok(m.revenuePaid === rev0, 'Trừ gói: tiền thực thu KHÔNG đổi (gói đã thu khi bán)');
ok(ceo(S()).monthRevenue === month0 + 400000, 'Doanh thu tháng của CEO nhảy theo +400k');
const c = S().customers.find((x) => x.id === 'KH1101')!;
ok(c.visits === visits0 + 1 && c.packageLeft === pkg0 - 1, 'Hồ sơ khách: +1 lần đến, gói −1 buổi (chỉ 1 lần)');

const newBefore = ceo(S()).newToday;
const kh = S().bookings.find((b) => b.customerId === 'KH1058')!;
S().tick(60); S().complete(kh.id); S().pay(kh.id, 'Tiền mặt');
ok(metrics(S()).revenuePaid === rev0 + 600000, 'Thu tiền mặt 600k → tiền thực thu +600k');
ok(ceo(S()).newToday === newBefore, 'Khách mới thanh toán xong vẫn là khách mới hôm nay');
const k2 = S().customers.find((c) => c.id === 'KH1058')!;
ok(S().bookings.filter((b) => b.customerId === 'KH1058').length === 1, 'Không phát sinh lịch thừa');
void k2;
console.log('— Khách mới vãng lai + KTV Ca 2 vào ca');
ok(S().createBooking({ newCustomer: { name: 'Khách Test', phone: '0900', source: 'TikTok' }, serviceId: 's4', start: 0 }) === null, 'Tạo khách mới đến ngay');
const nb = S().bookings[S().bookings.length - 1];
ok(nb.status === 'waiting', 'Khách mới vào thẳng hàng chờ');
S().staffCheckIn('ngoc');
ok(ktvStatus(S(), 'ngoc').key === 'free' && !alerts(S()).some((a) => a.title.includes('Ngọc')), 'Ngọc vào ca → hết cảnh báo, sẵn sàng nhận tour');
ok(S().createBooking({ newCustomer: { name: '  ', phone: '', source: 'TikTok' }, serviceId: 's1', start: 0 }) !== null, 'Không cho tạo khách tên rỗng');

console.log('— Lịch hẹn tới giờ → khách đến');
const lanB = S().bookings.find((b) => b.customerId === 'KH1071')!;
S().checkInCustomer(lanB.id);
ok(S().bookings.find((b) => b.id === lanB.id)!.status === 'waiting', 'Check-in → vào hàng chờ');
ok(suggestKtv(S(), lanB) === 'mai', 'Gợi ý Mai theo yêu cầu khách');

console.log('— Chống trùng hồ sơ, gói hết buổi, hết ca');
ok(S().createBooking({ newCustomer: { name: 'Trùng', phone: '0905112334', source: 'TikTok' }, serviceId: 's1', start: 0 })?.includes('Nguyễn Minh') ?? false, 'Số đã có hồ sơ → báo trùng, không tạo mới');
const nm = S().bookings.find((b) => b.customerId === 'KH1042')!;
const sv0 = metrics(S()).serviceRevenue;
S().pay(nm.id, 'Tiền mặt');
ok(metrics(S()).serviceRevenue === sv0 + 550000, 'Thu KH1042 → doanh thu dịch vụ +550k');
S().tick(20 * 60);
ok(ktvStatus(S(), 'hoa').key === 'off', 'Sau 18:00 KTV Ca 1 rảnh → Hết ca, không được gợi ý');

console.log(fail ? `\n${fail} LỖI` : '\nTẤT CẢ ĐÚNG');
process.exit(fail ? 1 : 0);
