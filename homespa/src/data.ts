// ─────────────────────────────────────────────────────────────────────────────
// HOME SPA Flow — dữ liệu mẫu & kiểu dữ liệu dùng chung cho MỌI màn hình.
// Một nguồn dữ liệu duy nhất: KTV, giường, dịch vụ, khách... chỉ khai báo ở đây.
// Khi nối Supabase: mỗi mảng dưới đây = một bảng.
// ─────────────────────────────────────────────────────────────────────────────

export type Role = 'reception' | 'ktv' | 'leader' | 'ceo' | 'marketing'
export const ROLE_LABEL: Record<Role, string> = {
  reception: 'Lễ tân', ktv: 'Kỹ thuật viên', leader: 'Leader', ceo: 'CEO', marketing: 'Marketing',
}

export type Staff = { id: string; name: string; role: Role; shift?: 1 | 2 }
export const SHIFTS = { 1: { start: 8 * 60, end: 18 * 60, label: 'Ca 1 · 08:00–18:00' }, 2: { start: 10 * 60, end: 20 * 60, label: 'Ca 2 · 10:00–20:00' } } as const

export const STAFF: Staff[] = [
  { id: 'hien', name: 'Hiền', role: 'ktv', shift: 1 },
  { id: 'lan', name: 'Lan', role: 'ktv', shift: 1 },
  { id: 'trieu', name: 'Triều', role: 'ktv', shift: 1 },
  { id: 'mai', name: 'Mai', role: 'ktv', shift: 1 },
  { id: 'phuong', name: 'Phương', role: 'ktv', shift: 1 },
  { id: 'ngoc', name: 'Ngọc', role: 'ktv', shift: 2 },
  { id: 'bao', name: 'Bảo', role: 'ktv', shift: 2 },
  { id: 'thu', name: 'Thu', role: 'ktv', shift: 2 },
  { id: 'lam', name: 'Lam', role: 'reception', shift: 1 },
  { id: 'van', name: 'Vân', role: 'reception', shift: 2 },
  { id: 'thao', name: 'Thảo', role: 'leader' },
  { id: 'quyen', name: 'Chị Quyên', role: 'ceo' },
  { id: 'khoa', name: 'Khoa', role: 'marketing' },
]
// Danh sách nhân sự đang dùng (cập nhật khi chị duyệt thành viên mới) — mọi màn đọc từ đây
let STAFF_LIVE: Staff[] = STAFF
export const setStaffLive = (l: Staff[]) => { STAFF_LIVE = l }
export const ktvs = () => STAFF_LIVE.filter(s => s.role === 'ktv')
export const firstOf = (r: Role) => STAFF_LIVE.find(s => s.role === r)?.id ?? ''
export const staffName = (id?: string) => STAFF_LIVE.find(s => s.id === id)?.name ?? (id || '—')

// ── Giường: một cách đặt tên duy nhất (TL = trị liệu, G = gội) ──
export type Bed = { id: string; floor: 1 | 2 | 3; zone: 'treatment' | 'wash' }
export const BEDS: Bed[] = [
  ...['TL-01', 'TL-02', 'TL-03'].map(id => ({ id, floor: 1 as const, zone: 'treatment' as const })),
  ...['G-01', 'G-02', 'G-03', 'G-04'].map(id => ({ id, floor: 1 as const, zone: 'wash' as const })),
  ...['TL-04', 'TL-05', 'TL-06', 'TL-07', 'TL-08', 'TL-09', 'TL-10', 'TL-11'].map(id => ({ id, floor: 2 as const, zone: 'treatment' as const })),
  ...['TL-12', 'TL-13', 'TL-14', 'TL-15'].map(id => ({ id, floor: 3 as const, zone: 'treatment' as const })),
]

// ── Dịch vụ: chỉ 2 nhóm Home đang bán ──
export type Service = { id: string; group: 'Massage trị liệu' | 'Gội đầu dưỡng sinh'; name: string; duration: number; price: number }
export const SERVICES: Service[] = [
  { id: 'm60', group: 'Massage trị liệu', name: 'Massage trị liệu 60 phút', duration: 60, price: 350000 },
  { id: 'm90', group: 'Massage trị liệu', name: 'Massage trị liệu 90 phút', duration: 90, price: 570000 },
  { id: 'm120', group: 'Massage trị liệu', name: 'Massage trị liệu 120 phút', duration: 120, price: 750000 },
  { id: 'g45', group: 'Gội đầu dưỡng sinh', name: 'Gội đầu dưỡng sinh 45 phút', duration: 45, price: 250000 },
  { id: 'g60', group: 'Gội đầu dưỡng sinh', name: 'Gội đầu dưỡng sinh 60 phút', duration: 60, price: 320000 },
]
export const svc = (id: string) => SERVICES.find(s => s.id === id)!
export const bedZoneFor = (serviceId: string): Bed['zone'] => (svc(serviceId).group === 'Gội đầu dưỡng sinh' ? 'wash' : 'treatment')

// ── Gói liệu trình ──
export type PkgCatalog = { id: string; name: string; type: 'session' | 'money'; group: Service['group'] | 'Tất cả'; listPrice: number; sessions?: number; bonus?: number; value?: number; bonusValue?: number; months: number }
export const PACKAGE_CATALOG: PkgCatalog[] = [
  { id: 'p10', name: 'Massage trị liệu · 10 buổi', type: 'session', group: 'Massage trị liệu', listPrice: 3500000, sessions: 10, bonus: 1, months: 6 },
  { id: 'p20', name: 'Massage trị liệu · 20 buổi', type: 'session', group: 'Massage trị liệu', listPrice: 7000000, sessions: 20, bonus: 3, months: 12 },
  { id: 'p15', name: 'Gội dưỡng sinh · 15 buổi', type: 'session', group: 'Gội đầu dưỡng sinh', listPrice: 4500000, sessions: 15, bonus: 2, months: 9 },
  { id: 'pm', name: 'Thẻ tiền dưỡng sinh', type: 'money', group: 'Tất cả', listPrice: 5000000, value: 5000000, bonusValue: 700000, months: 12 },
]
export type Payment = { at: string; amount: number; method: PayMethod; by: string; invoice: string; kind: 'Cọc' | 'Đóng tiếp' | 'Thanh toán đủ' }
export type Usage = { at: string; service: string; ktv: string; deducted: string; before: string; after: string; invoice: string }
export type Package = {
  cardCode: string; catalogId: string; name: string; type: 'session' | 'money'; group: PkgCatalog['group']
  buyDate: string; expiry: string; finalPrice: number; closer: string; closerIds?: string[]; renewalOf?: string
  sessions?: number; bonus?: number; used?: number; value?: number; bonusValue?: number; valueUsed?: number
  payments: Payment[]; usage: Usage[]
}
export const pkgPaid = (p: Package) => p.payments.reduce((s, x) => s + x.amount, 0)
export const pkgOwed = (p: Package) => Math.max(0, p.finalPrice - pkgPaid(p))
export const pkgLeft = (p: Package) => (p.type === 'session' ? (p.sessions ?? 0) + (p.bonus ?? 0) - (p.used ?? 0) : (p.value ?? 0) + (p.bonusValue ?? 0) - (p.valueUsed ?? 0))
export const pkgLeftLabel = (p: Package) => (p.type === 'session' ? `${pkgLeft(p)} buổi` : vnd(pkgLeft(p)))
export const pkgUsable = (p: Package, serviceId: string) => p.group === 'Tất cả' || p.group === svc(serviceId).group

// ── Khách hàng ──
export type CareEntry = { at: string; by: string; text: string; kind?: 'Nhắn tin' | 'Gọi điện'; ok?: boolean; replied?: boolean; came?: boolean }
export type Customer = {
  id: string; code: string; name: string; phone: string; group: 'VN' | 'NN'; dob?: string
  source: string; firstVisit: string; visits: number; lastVisitDays: number; totalPaid: number
  vip?: boolean; health?: string; preference?: string; packages: Package[]; care: CareEntry[]
  address?: string; budget?: number; referredBy?: string; qrCare?: boolean
}

// ── Lịch phục vụ: vòng đời 1 lượt khách ──
// booked → checked_in (đã đến) → in_service → done (chờ thu) → paid ; hoặc cancelled / no_show
export type ApptStatus = 'booked' | 'checked_in' | 'in_service' | 'done' | 'paid' | 'cancelled' | 'no_show'
export type Appt = {
  id: string; customerId: string; ktvId: string; bedId: string; serviceId: string
  start: number; end: number; status: ApptStatus; requested: boolean; channel: string; note?: string
  startedAt?: number; finishedAt?: number; waitMin?: number
}
export type QueueGuest = { id: string; customerId: string; serviceId: string; arrival: number; requestedKtvId?: string; strength: 'nhẹ' | 'vừa' | 'mạnh'; note?: string }

export type PayMethod = 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ ngân hàng'
export type InvoiceStatus = 'Chưa thu' | 'Thu một phần' | 'Đã thu đủ' | 'Dùng liệu trình' | 'Nháp' | 'Đã xóa'
export type InvoiceLine = { serviceId: string; ktvId: string; price: number; discount: number; cardCode?: string; apptId?: string }
export type Invoice = {
  code: string; customerId: string; createdAt: string; createdMin: number; creator: string; status: InvoiceStatus
  lines: InvoiceLine[]; pkgSale?: { cardCode: string; name: string; price: number; mode: 'new' | 'renew' | 'continue' }
  total: number; paid: number; payments: { method: PayMethod; amount: number }[]; voucher?: string; voucherProgramId?: string; voucherDiscount?: number; pkgCollect?: number; log: CareEntry[]
}

// ── Việc cần làm (dùng chung Leader / Lễ tân / KTV) ──
export type TaskStatus = 'open' | 'doing' | 'done' | 'transferred'
export type Task = {
  id: string; title: string; detail: string; category: 'Khách hàng' | 'Vận hành' | 'Nhân sự' | 'Chương trình' | 'Phê duyệt'
  priority: 'cao' | 'vừa' | 'thấp'; ownerId: string; createdBy: string; createdMin: number; dueMin?: number
  status: TaskStatus; customerId?: string; startedMin?: number; doneMin?: number; result?: string; evidence?: string
  transferTo?: string; earlyReport?: boolean; sourceKey?: string; feedbackId?: string; prevOwner?: string
}

export type FeedbackGroup = 'Thời gian chờ' | 'Lực / kỹ thuật' | 'Vệ sinh' | 'Thái độ' | 'Giá & gói' | 'Khen'
export type Feedback = { id: string; customerId: string; daysAgo: number; rating: number; group: FeedbackGroup; text: string; ktvId?: string; status: 'mới' | 'đang xử lý' | 'đã xử lý'; handlerId?: string; repeat?: number }

export type Program = {
  id: string; name: string; type: 'Sinh nhật' | 'Tri ân' | 'Giới thiệu bạn' | 'Tái tục' | 'Marketing'
  ownerId: string; target: string; reached: number; booked: number; arrived: number; revenue: number; cost: number
  budget: number; status: 'Nháp' | 'Chờ duyệt' | 'Đang chạy' | 'Đã kết thúc'; discount?: string; voucher?: string
}

export type Initiative = {
  id: string; kind: 'Sáng kiến' | 'Dự án'; title: string; problem: string; goal: string; solution: string
  partners: string[]; budget: number; dueLabel: string; before: string; after?: string; proposal?: string
  status: 'Đề xuất' | 'Chờ duyệt' | 'Đang làm' | 'Chờ xác nhận kết quả' | 'Đã kiểm chứng' | 'Dừng'; progress: number; ownerId: string; approvedBudget?: number
}

export type Approval = {
  id: string; kind: 'Đổi giá / ưu đãi' | 'Ngân sách' | 'Báo cáo tuần' | 'Sửa / xóa hóa đơn' | 'Tham gia app' | 'Chuyển vượt quyền' | 'Xác nhận kết quả' | 'Nghỉ phép / đổi ca'
  fromId: string; title: string; detail: string; status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối'; refId?: string; deadline?: string; note?: string; budgetDelta?: number
}

export type WeeklyReport = { id: string; week: string; fromId: string; answers: string[]; sentAt: string; status: 'Đã gửi' | 'Đã xem' }

export type Notif = { id: string; cat: 'Lịch hẹn' | 'Điều phối' | 'KTV' | 'Thu ngân' | 'Leader' | 'Hệ thống' | 'Dọn dẹp' | 'Điểm uy tín'; text: string; detail: string; min: number; roles: Role[]; nav?: string; readBy: string[]; to?: string[] }

export type JoinRequest = { id: string; email: string; name: string; wantedRole: Role; status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối' }

// ── Tiện ích ──
export const vnd = (n: number) => (Math.round(n) || 0).toLocaleString('vi-VN') + 'đ'
export const vndShort = (n: number) => (n >= 1e6 ? (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'tr' : Math.round(n / 1000) + 'k')
export const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const parseHHMM = (s: string): number | null => { const r = /^(\d{1,2}):(\d{2})$/.exec(s.trim()); return r ? +r[1] * 60 + +r[2] : null }
export const TODAY = new Date()
export const dateLabel = (d = TODAY) => d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
export const dateShort = (d = TODAY) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const daysAgo = (n: number) => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return dateShort(d) }
export const daysAhead = (n: number) => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return dateShort(d) }
export const stamp = (min: number) => `${dateShort()} · ${hhmm(min)}`
export const weekNo = (d = TODAY) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((+t - +y) / 864e5 + 1) / 7) }
export const DEMO = true // chế độ chạy thử: hiện nút đổi vai trò, tua giờ, khôi phục dữ liệu mẫu
export const pctChange = (now: number, prev: number) => (prev === 0 ? 0 : Math.round(((now - prev) / prev) * 100))

// ─────────────────────────────────────────────────────────────────────────────
// DỮ LIỆU MẪU (ví dụ để chạy thử — không phải số liệu thật của Home)
// ─────────────────────────────────────────────────────────────────────────────
export const START_MIN = 10 * 60 + 15

const pkg = (p: Partial<Package> & Pick<Package, 'cardCode' | 'catalogId'>): Package => {
  const c = PACKAGE_CATALOG.find(x => x.id === p.catalogId)!
  return { name: c.name, type: c.type, group: c.group, buyDate: daysAgo(90), expiry: daysAhead(90), finalPrice: c.listPrice, closer: 'Lam', sessions: c.sessions, bonus: c.bonus, used: 0, value: c.value, bonusValue: c.bonusValue, valueUsed: 0, payments: [], usage: [], ...p }
}

export const SEED_CUSTOMERS: Customer[] = [
  { id: 'c125', code: '125', name: 'Nguyễn Thị Lan', phone: '0901 234 567', group: 'VN', dob: '14/03/1988', source: 'Google Maps', firstVisit: daysAgo(160), visits: 8, lastVisitDays: 22, totalPaid: 5250000, vip: true, health: 'Cổ vai gáy căng, mất ngủ nhẹ', preference: 'Thích KTV Mai, lực vừa, trà gừng',
    packages: [pkg({ cardCode: 'LT-0231', catalogId: 'p10', used: 9, closer: 'Lam', payments: [{ at: daysAgo(118), amount: 3500000, method: 'Chuyển khoản', by: 'Lam', invoice: 'HD000121', kind: 'Thanh toán đủ' }] })],
    care: [{ at: daysAgo(30), by: 'Lam', text: 'Gọi nhắc lịch, khách hẹn tuần sau' }, { at: daysAgo(22), by: 'Mai', text: 'Sau buổi 9: cổ vai giảm rõ, ngủ tốt hơn' }] },
  { id: 'c628', code: '628', name: 'Trần Thị Hà', phone: '0912 345 678', group: 'VN', source: 'Người giới thiệu', firstVisit: daysAgo(280), visits: 12, lastVisitDays: 9, totalPaid: 5700000, vip: true, health: 'Da đầu nhạy cảm',
    packages: [pkg({ cardCode: 'LT-0180', catalogId: 'pm', valueUsed: 3100000, closer: 'Thảo', expiry: daysAhead(25), payments: [{ at: daysAgo(270), amount: 5000000, method: 'Tiền mặt', by: 'Thảo', invoice: 'HD000098', kind: 'Thanh toán đủ' }] })],
    care: [{ at: daysAgo(9), by: 'Vân', text: 'Khách hỏi gói gội 15 buổi' }] },
  { id: 'c412', code: '412', name: 'Vũ Thị Kim', phone: '0933 777 888', group: 'VN', source: 'Facebook', firstVisit: daysAgo(40), visits: 3, lastVisitDays: 6, totalPaid: 1800000,
    packages: [pkg({ cardCode: 'LT-0210', catalogId: 'p10', used: 2, closer: 'Lam', payments: [{ at: daysAgo(40), amount: 1800000, method: 'Chuyển khoản', by: 'Lam', invoice: 'HD000140', kind: 'Cọc' }] })],
    care: [{ at: daysAgo(40), by: 'Lam', text: 'Cọc gói 10 buổi, hẹn đóng nốt trong tháng' }] },
  { id: 'c305', code: '305', name: 'Lê Thị Mộng', phone: '0909 333 444', group: 'VN', source: 'TikTok', firstVisit: daysAgo(200), visits: 15, lastVisitDays: 63, totalPaid: 7400000, vip: true, health: 'Đau lưng dưới',
    packages: [pkg({ cardCode: 'LT-0198', catalogId: 'p20', used: 23, closer: 'Thảo', payments: [{ at: daysAgo(200), amount: 7000000, method: 'Thẻ ngân hàng', by: 'Thảo', invoice: 'HD000077', kind: 'Thanh toán đủ' }] })],
    care: [{ at: daysAgo(63), by: 'Bảo', text: 'Hết buổi gói 20; khách phàn nàn chờ lâu cuối tuần' }] },
  { id: 'c077', code: '77', name: 'Phạm Văn Tùng', phone: '0977 111 000', group: 'VN', source: 'Đi ngang', firstVisit: daysAgo(400), visits: 20, lastVisitDays: 48, totalPaid: 4500000,
    packages: [pkg({ cardCode: 'LT-0077', catalogId: 'p15', used: 9, closer: 'Vân', payments: [{ at: daysAgo(300), amount: 4500000, method: 'Tiền mặt', by: 'Vân', invoice: 'Số dư đầu kỳ', kind: 'Thanh toán đủ' }] })], care: [] },
  { id: 'kl101', code: 'KL0101', name: 'Anna Schmidt', phone: '', group: 'NN', source: 'Google Maps', firstVisit: dateShort(), visits: 1, lastVisitDays: 0, totalPaid: 0, packages: [], care: [], preference: 'Khách nước ngoài, ưu tiên lực vừa' },
  { id: 'kl042', code: 'KL0042', name: 'Trần Văn Minh', phone: '0918 222 333', group: 'VN', source: 'Facebook', firstVisit: daysAgo(70), visits: 2, lastVisitDays: 0, totalPaid: 600000, packages: [], care: [] },
  { id: 'kl055', code: 'KL0055', name: 'Đỗ Thu Hoa', phone: '0939 555 666', group: 'VN', source: 'Zalo', firstVisit: daysAgo(15), visits: 2, lastVisitDays: 0, totalPaid: 570000, packages: [], care: [] },
  { id: 'kl060', code: 'KL0060', name: 'Hoàng Minh Đức', phone: '0905 888 999', group: 'VN', source: 'Google Maps', firstVisit: dateShort(), visits: 0, lastVisitDays: 0, totalPaid: 0, packages: [], care: [] },
  { id: 'kl061', code: 'KL0061', name: 'Ngô Bích Ngọc', phone: '0906 121 212', group: 'VN', source: 'Người giới thiệu', firstVisit: daysAgo(120), visits: 4, lastVisitDays: 0, totalPaid: 1400000, packages: [], care: [] },
  { id: 'kl062', code: 'KL0062', name: 'David Lee', phone: '', group: 'NN', source: 'Website', firstVisit: dateShort(), visits: 0, lastVisitDays: 0, totalPaid: 0, packages: [], care: [] },
  { id: 'kl064', code: 'KL0064', name: 'Châu Mỹ Linh', phone: '0908 565 656', group: 'VN', source: 'Instagram', firstVisit: daysAgo(30), visits: 1, lastVisitDays: 30, totalPaid: 320000, packages: [], care: [] },
  { id: 'kl065', code: 'KL0065', name: 'Trịnh Gia Bảo', phone: '0909 676 767', group: 'VN', source: 'Đi ngang', firstVisit: dateShort(), visits: 0, lastVisitDays: 0, totalPaid: 0, packages: [], care: [] },
  { id: 'kl063', code: 'KL0063', name: 'Bùi Thanh Tâm', phone: '0907 343 434', group: 'VN', source: 'Facebook', firstVisit: daysAgo(55), visits: 3, lastVisitDays: 41, totalPaid: 1050000, packages: [], care: [] },
]

const A = (id: string, customerId: string, ktvId: string, bedId: string, serviceId: string, start: number, status: ApptStatus, extra: Partial<Appt> = {}): Appt =>
  ({ id, customerId, ktvId, bedId, serviceId, start, end: start + svc(serviceId).duration, status, requested: false, channel: 'Zalo', ...extra })

export const SEED_APPTS: Appt[] = [
  A('a1', 'kl042', 'hien', 'TL-01', 'm90', 8 * 60 + 30, 'done', { finishedAt: 600 }),
  A('a2', 'kl055', 'lan', 'TL-02', 'm60', 9 * 60, 'paid', { finishedAt: 560 }),
  A('a3', 'kl061', 'mai', 'TL-03', 'm60', 8 * 60, 'paid', { finishedAt: 540 }),
  A('a4', 'kl060', 'phuong', 'G-01', 'g45', 9 * 60 + 50, 'in_service', { startedAt: 590, channel: 'Đến trực tiếp' }),
  A('a5', 'kl101', 'trieu', 'TL-05', 'm90', 10 * 60, 'in_service', { startedAt: 600, channel: 'Website' }),
  A('a6', 'c125', 'mai', 'TL-07', 'm90', 10 * 60 + 30, 'booked', { requested: true, channel: 'Messenger', note: 'Đau cổ vai gáy' }),
  A('a7', 'c628', 'thu', 'G-04', 'g60', 11 * 60, 'booked', { channel: 'Điện thoại' }),
  A('a8', 'c412', 'hien', 'TL-08', 'm60', 11 * 60, 'booked', { channel: 'Zalo' }),
  A('a9', 'kl062', 'bao', 'TL-09', 'm60', 10 * 60 + 30, 'booked', { channel: 'Website', note: 'Khách nước ngoài' }),
  A('a10', 'c305', 'lan', 'TL-12', 'm90', 13 * 60 + 30, 'booked', { channel: 'Zalo' }),
  A('a11', 'kl063', 'ngoc', 'TL-10', 'm60', 14 * 60, 'booked', { channel: 'Messenger' }),
  A('a12', 'c077', 'thu', 'G-02', 'g45', 15 * 60, 'booked', { channel: 'Điện thoại' }),
]

export const SEED_QUEUE: QueueGuest[] = [
  { id: 'q1', customerId: 'kl064', serviceId: 'g60', arrival: 10 * 60 + 2, strength: 'nhẹ', note: 'Khách quay lại lần 2' },
  { id: 'q2', customerId: 'kl065', serviceId: 'm60', arrival: 10 * 60 + 10, requestedKtvId: 'lan', strength: 'vừa' },
]

export const SEED_INVOICES: Invoice[] = [
  { code: 'HD000150', customerId: 'kl055', createdAt: stamp(560), createdMin: 560, creator: 'Lam', status: 'Đã thu đủ', lines: [{ serviceId: 'm60', ktvId: 'lan', price: 350000, discount: 0, apptId: 'a2' }], total: 350000, paid: 350000, payments: [{ method: 'Tiền mặt', amount: 350000 }], log: [{ at: stamp(560), by: 'Lam', text: 'Tạo & thu đủ 350.000đ' }] },
  { code: 'HD000149', customerId: 'kl061', createdAt: stamp(545), createdMin: 545, creator: 'Lam', status: 'Đã thu đủ', lines: [{ serviceId: 'm60', ktvId: 'mai', price: 350000, discount: 0, apptId: 'a3' }], total: 350000, paid: 350000, payments: [{ method: 'Chuyển khoản', amount: 350000 }], log: [{ at: stamp(545), by: 'Lam', text: 'Tạo & thu đủ 350.000đ' }] },
]

export const SEED_TASKS: Task[] = [
  { id: 't1', title: 'Gọi lại khách Lê Thị Mộng — 63 ngày chưa quay lại', detail: 'Hết buổi gói 20, từng phàn nàn chờ lâu cuối tuần. Mục tiêu: hiểu lý do, mời tái tục.', category: 'Khách hàng', priority: 'cao', ownerId: 'thao', createdBy: 'system', createdMin: 480, status: 'open', customerId: 'c305', sourceKey: 'risk-c305' },
  { id: 't2', title: 'Xử lý phản hồi: chờ 25 phút trước giờ hẹn', detail: 'Khách Vũ Thị Kim chấm 2/5, nhóm "Thời gian chờ". Lặp lại lần 3 trong tháng.', category: 'Khách hàng', priority: 'cao', ownerId: 'thao', createdBy: 'van', createdMin: 500, status: 'doing', startedMin: 520, customerId: 'c412', earlyReport: true, feedbackId: 'f1' },
  { id: 't3', title: 'Kiểm tra lịch trống cuối tuần — khách chờ lâu giờ cao điểm', detail: 'So giờ khách đến với giờ bắt đầu dịch vụ thứ 7–CN, đề xuất chỉnh khung lịch.', category: 'Vận hành', priority: 'vừa', ownerId: 'thao', createdBy: 'thao', createdMin: 470, status: 'open' },
  { id: 't4', title: 'Kèm KTV Bảo kỹ thuật lực mạnh', detail: '2 phản hồi "lực yếu" trong 14 ngày.', category: 'Nhân sự', priority: 'vừa', ownerId: 'thao', createdBy: 'thao', createdMin: 460, status: 'open' },
  { id: 't5', title: 'Chuẩn bị quà sinh nhật khách Nguyễn Thị Lan', detail: 'Sinh nhật tháng 3 — chuẩn bị thiệp & voucher theo chương trình sinh nhật.', category: 'Chương trình', priority: 'thấp', ownerId: 'lam', createdBy: 'thao', createdMin: 450, status: 'done', doneMin: 560, customerId: 'c125', result: 'Đã gói quà, đặt tại quầy' },
  { id: 't6', title: 'Bàn ngâm chân 02 cần vệ sinh', detail: 'Khu vực ngâm chân tầng 1', category: 'Vận hành', priority: 'thấp', ownerId: 'mai', createdBy: 'lam', createdMin: 540, status: 'open' },
]

export const SEED_FEEDBACK: Feedback[] = [
  { id: 'f1', customerId: 'c412', daysAgo: 6, rating: 2, group: 'Thời gian chờ', text: 'Đến đúng giờ hẹn nhưng chờ 25 phút', status: 'đang xử lý', handlerId: 'thao', repeat: 3 },
  { id: 'f2', customerId: 'c305', daysAgo: 63, rating: 3, group: 'Thời gian chờ', text: 'Cuối tuần đông, chờ lâu', status: 'mới', repeat: 3 },
  { id: 'f3', customerId: 'kl063', daysAgo: 41, rating: 3, group: 'Lực / kỹ thuật', text: 'Lực hơi yếu so với yêu cầu', ktvId: 'bao', status: 'mới', repeat: 2 },
  { id: 'f4', customerId: 'c125', daysAgo: 22, rating: 5, group: 'Khen', text: 'KTV Mai rất có tâm', ktvId: 'mai', status: 'đã xử lý' },
  { id: 'f5', customerId: 'c628', daysAgo: 9, rating: 4, group: 'Giá & gói', text: 'Muốn có gói gội ngắn hơn', status: 'đã xử lý', handlerId: 'van' },
  { id: 'f6', customerId: 'c077', daysAgo: 48, rating: 3, group: 'Vệ sinh', text: 'Khăn chưa khô hẳn', status: 'đã xử lý', handlerId: 'thao' },
]

export const SEED_PROGRAMS: Program[] = [
  { id: 'pr1', name: 'Sinh nhật vàng', type: 'Sinh nhật', ownerId: 'thao', target: 'Khách có sinh nhật trong tháng', reached: 42, booked: 18, arrived: 15, revenue: 6200000, cost: 1100000, budget: 1500000, status: 'Đang chạy', discount: 'Tặng 1 buổi gội 45 phút', voucher: 'SINHNHAT' },
  { id: 'pr2', name: 'Bạn thân cùng thư giãn', type: 'Giới thiệu bạn', ownerId: 'khoa', target: 'Khách liệu trình đang dùng', reached: 120, booked: 26, arrived: 19, revenue: 9800000, cost: 2400000, budget: 3000000, status: 'Đang chạy', discount: 'Giảm 15% buổi đầu cho bạn', voucher: 'BANTHAN15' },
  { id: 'pr3', name: 'Tái tục sớm', type: 'Tái tục', ownerId: 'thao', target: 'Gói còn ≤ 2 buổi', reached: 15, booked: 9, arrived: 8, revenue: 28000000, cost: 1800000, budget: 2000000, status: 'Đang chạy', discount: 'Tặng thêm 1 buổi' },
  { id: 'pr4', name: 'Tri ân khách 1 năm', type: 'Tri ân', ownerId: 'thao', target: 'Khách gắn bó ≥ 12 tháng', reached: 30, booked: 7, arrived: 5, revenue: 1750000, cost: 900000, budget: 1000000, status: 'Đã kết thúc', voucher: 'TRIAN1NAM' },
]

export const SEED_INITIATIVES: Initiative[] = [
  { id: 'i1', kind: 'Sáng kiến', title: 'Giảm thời gian chờ cuối tuần', problem: 'Cuối tuần 3 phản hồi chờ > 20 phút; giờ bắt đầu trễ TB 14 phút', goal: 'Thời gian chờ TB ≤ 7 phút sau 4 tuần', solution: 'Giãn khung lịch 15 phút giờ cao điểm, lễ tân xác nhận lịch trước 1 giờ', partners: ['Lam', 'Vân', 'KTV ca 1'], budget: 0, approvedBudget: 0, dueLabel: 'Hết tháng này', before: 'Chờ TB 14 phút', after: 'Chờ TB 9 phút (tuần 2)', status: 'Đang làm', progress: 50, ownerId: 'thao' },
  { id: 'i2', kind: 'Dự án', title: 'Chuẩn hóa checklist dọn giường', problem: 'Phản hồi "khăn chưa khô" lặp lại; giường sẵn sàng chậm 10–15 phút', goal: '100% lượt dọn có checklist, không phản hồi vệ sinh trong tháng', solution: 'Checklist 4 bước trên app KTV, giường chỉ "sẵn sàng" khi đủ 4 bước', partners: ['Toàn bộ KTV'], budget: 500000, approvedBudget: 500000, dueLabel: 'Đã xong', before: '2 phản hồi vệ sinh/tháng', after: '0 phản hồi vệ sinh/tháng', proposal: 'Duy trì', status: 'Đã kiểm chứng', progress: 100, ownerId: 'thao' },
]

export const SEED_APPROVALS: Approval[] = [
  { id: 'ap1', kind: 'Ngân sách', fromId: 'khoa', title: 'Tăng ngân sách "Bạn thân cùng thư giãn" thêm 1.500.000đ', detail: 'Chương trình đạt 19 khách đến, chi phí/khách 126k.', status: 'Chờ duyệt', deadline: 'Thứ Sáu', refId: 'pr2', budgetDelta: 1500000 },
  { id: 'ap2', kind: 'Tham gia app', fromId: 'system', title: 'Tài khoản mới xin vào app: ktv.dung@gmail.com', detail: 'Đăng nhập Google, xin vai trò Kỹ thuật viên', status: 'Chờ duyệt', refId: 'j1' },
]

export const SEED_APPROVAL_LEAVE: Approval = { id: 'ap3', kind: 'Nghỉ phép / đổi ca', fromId: 'hien', title: `Nghỉ phép ${daysAhead(3)} — Hiền`, detail: 'Việc gia đình', status: 'Chờ duyệt', refId: 'lv1' }

export const SEED_JOIN: JoinRequest[] = [{ id: 'j1', email: 'ktv.dung@gmail.com', name: 'Dung', wantedRole: 'ktv', status: 'Chờ duyệt' }]

// SỐ LIỆU MẪU các kỳ trước (khi nối Supabase sẽ tính từ bảng lịch hẹn / hóa đơn).
export const SAMPLE_NOTE = 'số liệu mẫu'
// Hôm nay được tính trực tiếp từ dữ liệu.
export const HISTORY = {
  day: { prev: { newCust: 3, returning: 9, revenue: 7400000, waitAvg: 9, bookings: 15, showRate: 87 }, target: { newCust: 4, returning: 10, revenue: 8000000, waitAvg: 7, bookings: 16, showRate: 90 } },
  week: { now: { newCust: 19, returning: 80, revenue: 48200000, waitAvg: 11, bookings: 102, showRate: 84 }, prev: { newCust: 21, returning: 100, revenue: 51000000, waitAvg: 9, bookings: 108, showRate: 88 }, target: { newCust: 22, returning: 95, revenue: 52000000, waitAvg: 7, bookings: 110, showRate: 90 } },
  month: { now: { newCust: 74, returning: 352, revenue: 214600000, waitAvg: 10, bookings: 431, showRate: 86 }, prev: { newCust: 70, returning: 368, revenue: 205000000, waitAvg: 10, bookings: 420, showRate: 85 }, target: { newCust: 80, returning: 380, revenue: 225000000, waitAvg: 7, bookings: 450, showRate: 90 } },
}
// Theo nhóm khách — dùng cho "khách quay lại giảm ở nhóm nào"
export const RETURN_BY_GROUP = [
  { group: 'Khách liệu trình', now: 41, prev: 44 },
  { group: 'Khách lẻ quay lại', now: 22, prev: 35 },
  { group: 'Khách nước ngoài', now: 9, prev: 11 },
  { group: 'Khách VIP', now: 8, prev: 10 },
]

export const SOPS = [
  { id: 'sop-don', title: 'Quy trình dọn giường sau khi phục vụ', steps: ['Thay khăn / ga giường', 'Dọn giường, lau bề mặt', 'Kiểm tra vật dụng (dầu, khăn, nước)', 'Bấm "Báo giường sẵn sàng" trên app'] },
  { id: 'sop-kn', title: 'Quy trình xử lý phản hồi / khiếu nại', steps: ['Ghi nhận đúng lời khách, nhóm vấn đề', 'Xin lỗi & đề xuất xử lý trong quyền hạn', 'Vượt quyền (hoàn tiền, đổi giá) → chuyển chị duyệt', 'Gọi lại khách trong 24 giờ, ghi kết quả vào hồ sơ'] },
  { id: 'sop-tour', title: 'Quy trình chia tour', steps: ['Ưu tiên KTV khách yêu cầu đích danh', 'Không có yêu cầu → KTV đầu hàng xoay tour đang rảnh', 'Kiểm tra giường cùng khu vực còn trống', 'Giao xong, KTV xuống cuối hàng'] },
  { id: 'sop-tt', title: 'Quy trình tái tục gói', steps: ['Gói còn ≤ 2 buổi hoặc sắp hết hạn → nhắc khách', 'Tư vấn theo tiến triển thực tế', 'Ưu đãi trong khung đã duyệt; ngoài khung → xin chị duyệt', 'Thu tiền tại Thu ngân, chọn "Tái tục"'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// LUỒNG HẰNG NGÀY (theo sơ đồ "NÚT MẸ 1: HÔM NAY" của KTV & Lễ tân)
// ─────────────────────────────────────────────────────────────────────────────
// 12 khu vực dọn dẹp: 1–6 ca sáng (08h–18h), 7–12 ca chiều (10h–20h).
// 7–10 là 4 lần giặt khăn, chỉ báo cáo được sau mốc giờ.
export type Zone = { no: number; shift: 1 | 2; name: string; after?: number; std: string[] }
export const ZONES: Zone[] = [
  { no: 1, shift: 1, name: 'Tầng 1 + giường gội', std: ['Lau sàn, quầy lễ tân', 'Giường gội: thay khăn, lau bồn', 'Sắp xếp dép, kệ đồ khách'] },
  { no: 2, shift: 1, name: 'Phòng 2 giường tầng 2 + kệ gội', std: ['Thay ga, gối, khăn giường', 'Lau kệ gội, bổ sung dầu gội', 'Kiểm tra máy xông, đèn'] },
  { no: 3, shift: 1, name: 'Phòng CNC + kệ gỗ phía trước', std: ['Lau máy, sắp dây gọn', 'Lau kệ gỗ, xếp sản phẩm trưng bày', 'Kiểm tra mùi phòng'] },
  { no: 4, shift: 1, name: 'Tầng 3 + phòng nghỉ nhân viên', std: ['Dọn giường tầng 3', 'Phòng nghỉ: rác, bàn, tủ đồ', 'Đóng cửa sổ, tắt điện thừa'] },
  { no: 5, shift: 1, name: 'Khu ngâm chân + khăn nóng', std: ['Thay nước, vệ sinh bồn ngâm', 'Tủ khăn nóng đủ khăn, đúng nhiệt', 'Lau khay, sàn khu ngâm'] },
  { no: 6, shift: 1, name: 'Bàn đá + nhà vệ sinh', std: ['Lau bàn đá', 'Nhà vệ sinh: sàn, bồn, giấy, xà phòng', 'Thay túi rác'] },
  { no: 7, shift: 2, name: 'Giặt khăn lần 1', after: 10 * 60, std: ['Gom khăn bẩn các tầng', 'Giặt – sấy đúng chương trình', 'Gấp & trả khăn về tủ'] },
  { no: 8, shift: 2, name: 'Giặt khăn lần 2', after: 12 * 60, std: ['Gom khăn bẩn các tầng', 'Giặt – sấy đúng chương trình', 'Gấp & trả khăn về tủ'] },
  { no: 9, shift: 2, name: 'Giặt khăn lần 3', after: 15 * 60, std: ['Gom khăn bẩn các tầng', 'Giặt – sấy đúng chương trình', 'Gấp & trả khăn về tủ'] },
  { no: 10, shift: 2, name: 'Giặt khăn lần 4', after: 17 * 60, std: ['Gom khăn bẩn các tầng', 'Giặt – sấy đúng chương trình', 'Gấp & trả khăn về tủ'] },
  { no: 11, shift: 2, name: 'Rác + hỗ trợ giặt', std: ['Đổ rác các tầng, thay túi', 'Hỗ trợ gấp khăn', 'Lau thùng rác'] },
  { no: 12, shift: 2, name: 'Khu giặt sấy + cây cối', std: ['Vệ sinh lồng giặt, lưới lọc máy sấy', 'Tưới & lau lá cây', 'Sắp xếp khu giặt gọn'] },
]
export const ZONE_POINTS = 2 // điểm uy tín cộng khi khu vực được kiểm tra "Đạt"
// Phân khu mặc định (CEO chỉnh trong Cài đặt): mỗi khu một người phụ trách hôm nay
export const SEED_ZONE_OWNER: Record<number, string> = { 1: 'lam', 2: 'mai', 3: 'hien', 4: 'lan', 5: 'phuong', 6: 'trieu', 7: 'bao', 8: 'ngoc', 9: 'bao', 10: 'ngoc', 11: 'thu', 12: 'van' }

export const PRODUCTS = ['Dầu massage', 'Cao hổ', 'Sữa chua đắp', 'Dầu gội thảo dược', 'Khăn dùng 1 lần'] as const

// Lịch chia ca 4 tuần: S = sáng 08–18 · C = chiều 10–20 · OFF = nghỉ đã duyệt.
// Quy luật mẫu (CEO cài đặt): mỗi người giữ ca gốc, nghỉ 1 ngày/tuần lệch nhau.
export type RosterCell = 'S' | 'C' | 'OFF'
export function rosterCell(st: Staff, dayOffset: number): RosterCell {
  if (!st.shift) return 'S'
  const idx = STAFF.findIndex(x => x.id === st.id)
  const dow = (TODAY.getDay() + dayOffset) % 7
  if (dayOffset !== 0 && (idx + dow) % 7 === 3) return 'OFF'
  return st.shift === 1 ? 'S' : 'C'
}
export const dayLabel = (off: number) => { const d = new Date(TODAY); d.setDate(d.getDate() + off); return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }) }

export const ANNOUNCEMENTS = [
  { id: 'an1', tag: 'Đào tạo', title: 'Thứ 6 17:00 — ôn kỹ thuật cổ vai gáy (bắt buộc KTV ca 1)', by: 'Leader Thảo' },
  { id: 'an2', tag: 'Quy định', title: 'Ảnh bill phải chụp rõ tên khách và giờ — thiếu ảnh không tính tour', by: 'Chị Quyên' },
  { id: 'an3', tag: 'Khách', title: 'Khách Nguyễn Thị Lan thích trà gừng, lực vừa — KTV Mai phụ trách', by: 'Lễ tân Lam' },
]

// Hỏi đáp Mộc — các nhóm theo sơ đồ của từng vai trò
export const MOC_GROUPS: Record<Role, { t: string; q: string }[]> = {
  ktv: [
    { t: 'SOP – quy trình – nội quy', q: 'Quy trình dọn giường sau khi phục vụ' }, { t: 'Công việc trong ngày', q: 'Hôm nay tôi làm ca nào, tour thứ mấy?' },
    { t: 'Nhắc việc chủ động', q: 'Tôi còn việc gì chưa xong?' }, { t: 'Đào tạo KTV', q: 'Tôi nên học gì tiếp theo?' },
    { t: 'Phát triển cá nhân', q: 'Tháng này tôi tiến bộ ở đâu?' }, { t: 'KPI – điểm uy tín', q: 'Tại sao điểm uy tín của tôi thay đổi?' },
    { t: 'Xử lý tình huống với khách', q: 'Quy trình xử lý khiếu nại' }, { t: 'Yêu cầu cá nhân', q: 'Xin nghỉ hoặc đổi ca thế nào?' },
    { t: 'Văn hóa – quy chuẩn Home', q: 'Quy chuẩn giao tiếp với khách của Home' }, { t: 'Quyền hạn & bảo mật', q: 'Tôi được xem và làm những gì?' },
  ],
  reception: [
    { t: 'SOP – quy trình – nội quy', q: 'Quy trình chia tour' }, { t: 'Công việc hôm nay – nhắc việc', q: 'Tôi còn việc gì chưa xong?' },
    { t: 'Đặt lịch – đón khách – điều phối', q: 'Khách đặt lịch nhiều nhưng đến ít, cần kiểm tra gì?' }, { t: 'Hồ sơ khách – nguồn khách', q: 'Khách nào lâu chưa quay lại?' },
    { t: 'Thu ngân – hóa đơn – liệu trình', q: 'Khách nào còn thiếu tiền gói?' }, { t: 'CSKH – tái tục – giới thiệu', q: 'Quy trình tái tục gói' },
    { t: 'Xử lý tình huống với khách', q: 'Quy trình xử lý khiếu nại' }, { t: 'Bàn giao ca – báo cáo – sự cố', q: 'Chốt ca cần kiểm tra gì?' },
    { t: 'Đào tạo – KPI – phát triển', q: 'Tại sao điểm uy tín của tôi thay đổi?' }, { t: 'Yêu cầu cá nhân – quyền hạn', q: 'Tôi được xem và làm những gì?' },
  ],
  leader: [], ceo: [], marketing: [],
}

export type CleanReport = { id: string; zone: number; staffId: string; photo: string; checks: boolean[]; at: number; status: 'Chờ kiểm tra' | 'Đạt' | 'Chưa đạt'; checker?: string; note?: string; points?: number }
export type BillPhoto = { id: string; staffId: string; shift: 1 | 2; photo: string; at: number; note?: string }
export type BillCheck = { by: string; at: number; matched: number; issues: string[] }
export type Review = { id: string; staffId: string; platform: 'Google' | 'Facebook'; customerId?: string; photo: string; at: number; status: 'Chờ đối soát' | 'Đã xác nhận' | 'Không khớp'; checker?: string }
export type ProductLog = { id: string; product: string; qty: number; ktvId: string; recId: string; photo: string; at: number; ktvOk: boolean; recOk: boolean }
export type Leave = { id: string; staffId: string; kind: 'Nghỉ phép' | 'Đổi ca'; date: string; detail: string; withId?: string; status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối'; at: number }
export type ShiftClose = { id: string; staffId: string; at: number; expected: Record<PayMethod, number>; counted: Record<PayMethod, number>; note: string; books: boolean[]; codes?: string[] }
export type PointEntry = { id: string; staffId: string; delta: number; reason: string; by: string; at: number; status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối'; source: 'Dọn dẹp' | 'Lễ tân ghi nhận' | 'Leader' | 'CEO' | 'Review' }
export type OpsCheck = { id: string; item: string; by: string; at: number; ok: boolean; note: string }
export const OPS_ITEMS = ['Kiểm tra vệ sinh lao công', 'Kiểm tra không gian trải nghiệm', 'Vật tư – tồn kho – đề xuất mua', 'Thiết bị – bảo dưỡng – sửa chữa', 'Sinh nhật nhân sự – quà tháng – hoạt động chung', 'Ghi nhận điểm uy tín', 'Bàn giao ca – việc còn tồn'] as const
export const BOOK_CHECKS = ['Không còn hóa đơn nháp / chưa thu', 'Bill Money nhóm đã đối soát', 'Lịch hẹn ngày mai đã nhắn xác nhận', 'Sản phẩm xuất trong ca đã xác nhận 2 bên', 'Việc tồn đã ghi bàn giao ca sau']
