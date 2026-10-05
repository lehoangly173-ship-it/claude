// ===== Kiểu dữ liệu dùng chung cho cả 4 vai trò =====
export type Role = 'reception' | 'ktv' | 'ceo' | 'marketing';

export type Shift = { id: 'ca1' | 'ca2'; name: string; start: number; end: number };
export const SHIFTS: Record<'ca1' | 'ca2', Shift> = {
  ca1: { id: 'ca1', name: 'Ca 1', start: 8 * 60, end: 18 * 60 },
  ca2: { id: 'ca2', name: 'Ca 2', start: 10 * 60, end: 20 * 60 },
};

export type Staff = {
  id: string;
  name: string;
  role: Role;
  shift: 'ca1' | 'ca2';
  order: number; // số thứ tự xoay tour
  color: string;
  training: { title: string; done: boolean }[];
};

export type ServiceKind = 'body' | 'head';
export type Service = { id: string; name: string; minutes: number; price: number; kind: ServiceKind; tourFee: number };

export type Bed = { id: string; floor: string; room: string; kind: ServiceKind };

export type Tier = 'Thành viên' | 'VIP' | 'Khách mới' | 'Khách NN';
export type Source = 'Facebook' | 'TikTok' | 'Google Maps' | 'Giới thiệu' | 'Vãng lai' | 'Tour';

export type Customer = {
  id: string;
  name: string;
  phone: string;
  tier: Tier;
  source: Source;
  birthday: string; // MM-DD
  lastVisitDaysAgo: number; // trước hôm nay
  visits: number; // trước hôm nay
  pressure: 'nhẹ' | 'vừa' | 'mạnh';
  note: string;
  packageLeft: number; // số buổi còn trong gói
  budget: string;
  isNew?: boolean; // khách lần đầu trong ngày — không đổi khi thanh toán
};

export type BookingStatus = 'booked' | 'waiting' | 'assigned' | 'inService' | 'done' | 'cancelled';
export type Booking = {
  id: string;
  customerId: string;
  serviceId: string;
  start: number; // giờ hẹn / giờ dự kiến (phút trong ngày)
  status: BookingStatus;
  ktvId?: string;
  requestedKtvId?: string;
  bedId?: string;
  arrivedAt?: number;
  startedAt?: number;
  endedAt?: number;
  paid: boolean;
  payMethod?: 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ' | 'Trừ gói';
  note?: string;
};

export type AreaTask = { id: string; title: string; desc: string; assigneeId: string; status: 'todo' | 'doing' | 'done' };
export type ContentTask = { id: string; kind: 'Ảnh' | 'Video'; title: string; channel: string; ownerId: string; done: boolean };
export type CareLog = { customerId: string; at: number; byId: string; kind: string };

// ===== Danh mục =====
export const SERVICES: Service[] = [
  { id: 's1', name: 'Massage thư giãn', minutes: 60, price: 350000, kind: 'body', tourFee: 60000 },
  { id: 's2', name: 'Massage trị liệu', minutes: 90, price: 550000, kind: 'body', tourFee: 90000 },
  { id: 's3', name: 'Chăm sóc da', minutes: 45, price: 400000, kind: 'body', tourFee: 50000 },
  { id: 's4', name: 'Gội đầu dưỡng sinh', minutes: 30, price: 180000, kind: 'head', tourFee: 30000 },
  { id: 's5', name: 'Body đá nóng', minutes: 90, price: 600000, kind: 'body', tourFee: 90000 },
];

const tl = (n: number, floor: string, room: string): Bed => ({ id: `TL-${String(n).padStart(2, '0')}`, floor, room, kind: 'body' });
export const BEDS: Bed[] = [
  tl(1, 'Tầng 1', 'Phòng trị liệu'), tl(2, 'Tầng 1', 'Phòng trị liệu'), tl(3, 'Tầng 1', 'Phòng trị liệu'),
  { id: 'G-01', floor: 'Tầng 1', room: 'Khu gội đầu', kind: 'head' },
  { id: 'G-02', floor: 'Tầng 1', room: 'Khu gội đầu', kind: 'head' },
  { id: 'G-03', floor: 'Tầng 1', room: 'Khu gội đầu', kind: 'head' },
  { id: 'G-04', floor: 'Tầng 1', room: 'Khu gội đầu', kind: 'head' },
  tl(4, 'Tầng 2', 'Phòng A'), tl(5, 'Tầng 2', 'Phòng A'),
  tl(6, 'Tầng 2', 'Phòng B'), tl(7, 'Tầng 2', 'Phòng B'), tl(8, 'Tầng 2', 'Phòng B'),
  tl(9, 'Tầng 2', 'Phòng C'), tl(10, 'Tầng 2', 'Phòng C'), tl(11, 'Tầng 2', 'Phòng C'),
  tl(12, 'Tầng 3', 'Phòng D'), tl(13, 'Tầng 3', 'Phòng D'), tl(14, 'Tầng 3', 'Phòng D'), tl(15, 'Tầng 3', 'Phòng D'),
];

export const CLEAN_STEPS = ['Thay khăn / ga giường', 'Dọn giường', 'Kiểm tra vật dụng', 'Báo giường sẵn sàng'];

const tr = (done: number) =>
  ['SOP setup đầu ca', 'Quy trình khăn nóng', 'Xử lý khách đau sau trị liệu', 'Kỹ thuật đá nóng'].map((t, i) => ({ title: t, done: i < done }));

const COLORS = ['#4A9B6E', '#B07A4F', '#7556C9', '#3477C5', '#C8473B', '#3E8E7E', '#8A6410', '#5B6B8C', '#A04F7A', '#6E8B3D'];
export const STAFF: Staff[] = [
  { id: 'lam', name: 'Lam', role: 'reception', shift: 'ca1', order: 0, color: '#4A9B6E', training: tr(4) },
  { id: 'quyen', name: 'Dr Quyền', role: 'ceo', shift: 'ca1', order: 0, color: '#8A6410', training: [] },
  { id: 'vy', name: 'Vy', role: 'marketing', shift: 'ca1', order: 0, color: '#7556C9', training: tr(2) },
  ...['Hiền', 'Lan', 'Triều', 'Mai', 'Phương', 'Hoa'].map((n, i) => ({
    id: n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(),
    name: n, role: 'ktv' as Role, shift: 'ca1' as const, order: i + 1, color: COLORS[i], training: tr((i % 4) + 1),
  })),
  ...['Ngọc', 'Bảo', 'Thu', 'Dung'].map((n, i) => ({
    id: n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(),
    name: n, role: 'ktv' as Role, shift: 'ca2' as const, order: i + 1, color: COLORS[i + 6], training: tr(i % 3),
  })),
];

export const CUSTOMERS: Customer[] = [
  { id: 'KH1042', name: 'Nguyễn Minh', phone: '0905 112 334', tier: 'Thành viên', source: 'Google Maps', birthday: '10-09', lastVisitDaysAgo: 21, visits: 6, pressure: 'mạnh', note: 'Đau thắt lưng, thích phòng yên tĩnh', packageLeft: 4, budget: '500–800k' },
  { id: 'KH1031', name: 'Chị Hà', phone: '0912 450 778', tier: 'Thành viên', source: 'Giới thiệu', birthday: '03-14', lastVisitDaysAgo: 0, visits: 9, pressure: 'vừa', note: 'Không dùng tinh dầu sả', packageLeft: 2, budget: '500k' },
  { id: 'KH1058', name: 'Anh Minh Khoa', phone: '0935 778 120', tier: 'Khách mới', source: 'TikTok', birthday: '12-02', lastVisitDaysAgo: 0, visits: 0, pressure: 'mạnh', note: 'Tập gym, căng cơ đùi', packageLeft: 0, budget: '600k' },
  { id: 'KH1060', name: 'Bảo Trâm', phone: '0977 330 912', tier: 'Thành viên', source: 'Facebook', birthday: '10-08', lastVisitDaysAgo: 30, visits: 4, pressure: 'nhẹ', note: 'Da nhạy cảm', packageLeft: 1, budget: '300k' },
  { id: 'KH1003', name: 'Thanh Hương', phone: '0901 777 456', tier: 'VIP', source: 'Giới thiệu', birthday: '05-21', lastVisitDaysAgo: 0, visits: 31, pressure: 'vừa', note: 'Thích trà gừng sau gội', packageLeft: 8, budget: '1–2tr' },
  { id: 'KH1071', name: 'Nguyễn Lan', phone: '0906 221 090', tier: 'Thành viên', source: 'Facebook', birthday: '11-30', lastVisitDaysAgo: 14, visits: 3, pressure: 'vừa', note: 'Đau cổ vai gáy', packageLeft: 3, budget: '500k' },
  { id: 'KH1075', name: 'Chị Lan Phạm', phone: '0939 008 552', tier: 'VIP', source: 'Google Maps', birthday: '10-07', lastVisitDaysAgo: 9, visits: 18, pressure: 'nhẹ', note: 'Yêu cầu KTV nữ, phòng riêng', packageLeft: 5, budget: '1tr+' },
  { id: 'KH1080', name: 'Chị Duyên', phone: '0918 666 701', tier: 'Thành viên', source: 'TikTok', birthday: '08-19', lastVisitDaysAgo: 40, visits: 2, pressure: 'nhẹ', note: '', packageLeft: 0, budget: '200–300k' },
  { id: 'KH1084', name: 'Anh Phong', phone: '0944 512 888', tier: 'Thành viên', source: 'Vãng lai', birthday: '01-11', lastVisitDaysAgo: 60, visits: 2, pressure: 'mạnh', note: '', packageLeft: 0, budget: '400k' },
  { id: 'KH1090', name: 'Trần Mai', phone: '0909 404 161', tier: 'Thành viên', source: 'Facebook', birthday: '10-15', lastVisitDaysAgo: 7, visits: 5, pressure: 'vừa', note: 'Mới sinh 6 tháng — tránh đá nóng vùng bụng', packageLeft: 2, budget: '600k' },
  { id: 'KH1095', name: 'Anna Schmidt', phone: '+49 151 2233 4455', tier: 'Khách NN', source: 'Tour', birthday: '06-02', lastVisitDaysAgo: 0, visits: 0, pressure: 'vừa', note: 'Speaks English', packageLeft: 0, budget: '$30' },
  { id: 'KH1097', name: 'Chị Bình', phone: '0913 870 225', tier: 'VIP', source: 'Giới thiệu', birthday: '02-28', lastVisitDaysAgo: 3, visits: 22, pressure: 'vừa', note: 'Hay giới thiệu bạn bè', packageLeft: 6, budget: '1tr+' },
  { id: 'KH1100', name: 'Thanh Thảo', phone: '0938 115 642', tier: 'Thành viên', source: 'Google Maps', birthday: '04-04', lastVisitDaysAgo: 18, visits: 7, pressure: 'vừa', note: 'Cổ vai gáy căng nhiều', packageLeft: 3, budget: '400k' },
  { id: 'KH1101', name: 'Ngọc Anh', phone: '0903 990 117', tier: 'VIP', source: 'Giới thiệu', birthday: '10-11', lastVisitDaysAgo: 6, visits: 26, pressure: 'nhẹ', note: 'Chỉ làm với KTV Lan', packageLeft: 7, budget: '1–2tr' },
  { id: 'KH1102', name: 'Quốc Huy', phone: '0971 223 809', tier: 'Khách mới', source: 'TikTok', birthday: '09-09', lastVisitDaysAgo: 0, visits: 0, pressure: 'mạnh', note: '', packageLeft: 0, budget: '600k' },
  { id: 'KH1103', name: 'Hồng Nhung', phone: '0987 654 200', tier: 'Thành viên', source: 'Facebook', birthday: '07-17', lastVisitDaysAgo: 33, visits: 4, pressure: 'nhẹ', note: '', packageLeft: 1, budget: '200k' },
  { id: 'KH1110', name: 'Kim Oanh', phone: '0902 337 488', tier: 'Thành viên', source: 'Facebook', birthday: '10-06', lastVisitDaysAgo: 2, visits: 8, pressure: 'vừa', note: 'Vừa làm trị liệu — hỏi thăm cơn đau', packageLeft: 4, budget: '500k' },
  { id: 'KH1111', name: 'Đức Tài', phone: '0916 404 909', tier: 'Thành viên', source: 'Google Maps', birthday: '12-24', lastVisitDaysAgo: 75, visits: 3, pressure: 'mạnh', note: '', packageLeft: 2, budget: '500k' },
  { id: 'KH1112', name: 'Mỹ Linh', phone: '0934 119 336', tier: 'VIP', source: 'TikTok', birthday: '10-20', lastVisitDaysAgo: 45, visits: 15, pressure: 'nhẹ', note: 'VIP lâu chưa quay lại', packageLeft: 6, budget: '1tr+' },
  { id: 'KH1113', name: 'John Park', phone: '+82 10 4455 6677', tier: 'Khách NN', source: 'Tour', birthday: '03-03', lastVisitDaysAgo: 1, visits: 1, pressure: 'mạnh', note: 'Khách đoàn Hàn Quốc', packageLeft: 0, budget: '$40' },
];

// Giờ hiện tại của bản demo: 10:15
export const DEMO_START = 10 * 60 + 15;

let n = 0;
const bk = (b: Omit<Booking, 'id' | 'paid'> & { paid?: boolean }): Booking => ({ id: `B${++n}`, paid: false, ...b });

export const BOOKINGS: Booking[] = [
  // Đã xong
  bk({ customerId: 'KH1003', serviceId: 's4', start: 480, status: 'done', ktvId: 'hoa', bedId: 'G-02', arrivedAt: 478, startedAt: 480, endedAt: 512, paid: true, payMethod: 'Trừ gói' }),
  bk({ customerId: 'KH1031', serviceId: 's2', start: 540, status: 'done', ktvId: 'lan', bedId: 'TL-02', arrivedAt: 535, startedAt: 540, endedAt: 610, paid: true, payMethod: 'Chuyển khoản' }),
  bk({ customerId: 'KH1042', serviceId: 's2', start: 510, status: 'done', ktvId: 'hien', bedId: 'TL-01', arrivedAt: 505, startedAt: 510, endedAt: 610 }),
  // Đang làm
  bk({ customerId: 'KH1058', serviceId: 's5', start: 600, status: 'inService', ktvId: 'trieu', bedId: 'TL-05', arrivedAt: 595, startedAt: 600 }),
  bk({ customerId: 'KH1060', serviceId: 's4', start: 600, status: 'inService', ktvId: 'phuong', bedId: 'G-01', arrivedAt: 598, startedAt: 600 }),
  // Khách đang chờ chia tour
  bk({ customerId: 'KH1100', serviceId: 's1', start: 605, status: 'waiting', arrivedAt: 605, note: 'Cổ vai gáy căng nhiều' }),
  bk({ customerId: 'KH1101', serviceId: 's3', start: 630, status: 'waiting', arrivedAt: 600, requestedKtvId: 'lan' }),
  bk({ customerId: 'KH1102', serviceId: 's5', start: 608, status: 'waiting', arrivedAt: 608 }),
  bk({ customerId: 'KH1103', serviceId: 's4', start: 600, status: 'waiting', arrivedAt: 570 }),
  // Lịch hẹn sắp tới
  bk({ customerId: 'KH1071', serviceId: 's2', start: 630, status: 'booked', requestedKtvId: 'mai', bedId: 'TL-06', note: 'Đau cổ vai gáy' }),
  bk({ customerId: 'KH1075', serviceId: 's3', start: 660, status: 'booked', requestedKtvId: 'hien', bedId: 'TL-07' }),
  bk({ customerId: 'KH1080', serviceId: 's4', start: 660, status: 'booked', requestedKtvId: 'thu', bedId: 'G-04' }),
  bk({ customerId: 'KH1084', serviceId: 's1', start: 780, status: 'booked', requestedKtvId: 'lan' }),
  bk({ customerId: 'KH1090', serviceId: 's2', start: 810, status: 'booked', requestedKtvId: 'mai' }),
  bk({ customerId: 'KH1097', serviceId: 's3', start: 840, status: 'booked', requestedKtvId: 'trieu', bedId: 'TL-12' }),
  bk({ customerId: 'KH1095', serviceId: 's1', start: 960, status: 'booked', requestedKtvId: 'mai' }),
];

export const AREA_TASKS: AreaTask[] = [
  { id: 'a1', title: 'Khu ngâm chân', desc: 'Bàn ngâm chân 02 cần vệ sinh', assigneeId: 'mai', status: 'todo' },
  { id: 'a2', title: 'Giặt sấy khăn đợt 2', desc: 'Khăn tầng 1 + tầng 2', assigneeId: 'hoa', status: 'doing' },
  { id: 'a3', title: 'Checklist tầng 2', desc: 'Kiểm tra đèn, nhạc, tinh dầu phòng A–C', assigneeId: 'trieu', status: 'todo' },
  { id: 'a4', title: 'Setup khu gội đầu', desc: 'Bổ sung dầu gội, khăn nóng', assigneeId: 'phuong', status: 'done' },
  { id: 'a5', title: 'Ảnh Google Review', desc: 'Xin review khách VIP sau dịch vụ', assigneeId: 'lan', status: 'todo' },
];

export const CONTENT_TASKS: ContentTask[] = [
  { id: 'c1', kind: 'Ảnh', title: 'Không gian phòng trị liệu buổi sáng', channel: 'Facebook', ownerId: 'vy', done: true },
  { id: 'c2', kind: 'Ảnh', title: 'Feedback khách VIP (xin phép)', channel: 'Facebook', ownerId: 'lam', done: false },
  { id: 'c3', kind: 'Video', title: 'Quy trình gội đầu dưỡng sinh 30s', channel: 'TikTok', ownerId: 'vy', done: false },
  { id: 'c4', kind: 'Video', title: 'Mẹo giảm đau cổ vai gáy tại nhà', channel: 'TikTok', ownerId: 'vy', done: false },
];

export const CAMPAIGNS = [
  { name: 'Tháng 10 — Ưu đãi trị liệu cổ vai gáy', when: '01/10 – 31/10', channel: 'Facebook · TikTok', status: 'Đang chạy' },
  { name: 'Sinh nhật khách — tặng gội đầu', when: 'Hằng tháng', channel: 'Zalo · CSKH', status: 'Đang chạy' },
  { name: '20/10 — Combo cho phái đẹp', when: '15/10 – 20/10', channel: 'Facebook', status: 'Chuẩn bị' },
];

// Khách hỏi (lead) từ đầu tháng theo kênh — dữ liệu Marketing nhập
export const LEADS: Record<Source, number> = {
  Facebook: 142, TikTok: 118, 'Google Maps': 64, 'Giới thiệu': 38, 'Vãng lai': 20, Tour: 26,
};

// Số liệu tháng trước hôm nay (chốt sổ) — CEO
export const TODAY = { day: 5, month: 10, label: 'Thứ Hai, 05/10' };
export const MONTH_BASE = {
  revenue: 41_200_000, // 4 ngày đầu tháng (đã chốt sổ)
  cost: 22_600_000,
  target: 300_000_000,
  customers: 412,
  newCustomers: 61,
  lastMonthRevenue: 256_000_000,
};

export const CEO_PRIORITIES = [
  'Tuyển thêm 2 KTV ca chiều trước 20/10',
  'Chốt chương trình 20/10 với Marketing',
  'Giảm thời gian chờ chia tour xuống dưới 10 phút',
];
