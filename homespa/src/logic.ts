// Các phép tính dẫn xuất (không lưu) — mọi con số trên màn hình đều tính từ đây,
// để Tổng quan, Sơ đồ giường, Hàng chờ, Leader... luôn khớp nhau.
import { T } from './i18n'
import * as D from './data'
import {
  daysAhead, Appt, BEDS, Bed, Customer, ktvs, SHIFTS, Staff, svc, bedZoneFor, pkgLeft, pkgOwed, hhmm, Feedback, Invoice, Task,
} from './data'

export type State = {
  now: number
  appts: Appt[]
  queue: import('./data').QueueGuest[]
  customers: Customer[]
  invoices: Invoice[]
  cleaning: Record<string, string> // bedId -> ktvId đang dọn
  rotation: { 1: string[]; 2: string[] }
  tasks: Task[]
  feedback: Feedback[]
  programs: import('./data').Program[]
  initiatives: import('./data').Initiative[]
  approvals: import('./data').Approval[]
  reports: import('./data').WeeklyReport[]
  notifs: import('./data').Notif[]
  join: import('./data').JoinRequest[]
  staff: Staff[]
  seq: number
  zoneOwner: Record<number, string>
  cleanReports: import('./data').CleanReport[]
  bills: import('./data').BillPhoto[]
  billCheck: import('./data').BillCheck | null
  reviews: import('./data').Review[]
  productLogs: import('./data').ProductLog[]
  leaves: import('./data').Leave[]
  attendance: Record<string, { in?: number; out?: number }>
  shiftCloses: import('./data').ShiftClose[]
  points: import('./data').PointEntry[]
  opsChecks: import('./data').OpsCheck[]
  zoneRead: Record<string, boolean> // "Tôi đã đọc nhiệm vụ" theo khu/ngày/KTV (xem zoneKey)
  zoneChecks: Record<string, boolean[]> // ô tích từng việc theo khu/ngày/KTV
  suggestions: import('./data').Suggestion[] // m3: góp ý / sáng kiến KTV
  stockMoves: import('./data').StockMove[]
  opsReqs: import('./data').OpsReq[]
  xpChecks: import('./data').XpCheck[]
  handovers: import('./data').Handover[]
  expenses: import('./data').Expense[]
  profiles: Record<string, import('./data').StaffProfile>
  adjusts: import('./data').AdjustReq[]
}

const LIVE: Appt['status'][] = ['booked', 'checked_in', 'in_service']
export const CLEAN_MIN = 10 // phút dọn giường giữa 2 khách

export const cust = (s: State, id: string) => s.customers.find(c => c.id === id)!
export const inShift = (k: Staff, m: number) => !!k.shift && m >= SHIFTS[k.shift].start && m < SHIFTS[k.shift].end

const overlap = (a1: number, a2: number, b1: number, b2: number) => a1 < b2 && b1 < a2

/** KTV có trống trong [start,end) không — tính cả 10 phút dọn sau mỗi khách */
export function ktvConflict(s: State, ktvId: string, start: number, end: number, ignore?: string): string | null {
  const k = s.staff.find(x => x.id === ktvId)
  if (!k?.shift) return 'Không phải KTV'
  const sh = SHIFTS[k.shift]
  if (start < sh.start || end > sh.end) return `Ngoài giờ ${sh.label}`
  if (Object.values(s.cleaning).includes(ktvId) && start < s.now + CLEAN_MIN) return `KTV ${k.name} đang dọn giường — nhận khách từ ${hhmm(s.now + CLEAN_MIN)}`
  const hit = s.appts.find(a => a.id !== ignore && a.ktvId === ktvId && LIVE.includes(a.status) && overlap(start, end, a.start, a.end + CLEAN_MIN))
  if (hit) return `KTV ${k.name} đã có khách ${hhmm(hit.start)}–${hhmm(hit.end)}`
  return null
}
export function custConflict(s: State, customerId: string, start: number, end: number, ignore?: string): string | null {
  const hit = s.appts.find(a => a.id !== ignore && a.customerId === customerId && LIVE.includes(a.status) && overlap(start, end, a.start, a.end))
  return hit ? `Khách đã có lịch ${hhmm(hit.start)}–${hhmm(hit.end)} (KTV ${s.staff.find(x => x.id === hit.ktvId)?.name})` : null
}
export function bedConflict(s: State, bedId: string, start: number, end: number, ignore?: string): string | null {
  if (s.cleaning[bedId] && start < s.now + CLEAN_MIN) return `Giường ${bedId} đang dọn`
  const hit = s.appts.find(a => a.id !== ignore && a.bedId === bedId && LIVE.includes(a.status) && overlap(start, end, a.start, a.end + CLEAN_MIN))
  return hit ? `Giường ${bedId} đã có lịch ${hhmm(hit.start)}–${hhmm(hit.end)}` : null
}

/** Giờ sớm nhất (≥ from) KTV nhận được khách dịch vụ dài `dur` phút */
export function earliestFor(s: State, ktvId: string, dur: number, from: number): number | null {
  const k = s.staff.find(x => x.id === ktvId)
  if (!k?.shift) return null
  let t = Math.max(from, SHIFTS[k.shift].start)
  // KTV đang dọn giường → chỉ nhận khách sau khi dọn xong (ước tính 10 phút)
  if (Object.values(s.cleaning).includes(ktvId)) t = Math.max(t, s.now + CLEAN_MIN)
  for (let i = 0; i < 40; i++) {
    if (t + dur > SHIFTS[k.shift].end) return null
    const hit = s.appts.find(a => a.ktvId === ktvId && LIVE.includes(a.status) && overlap(t, t + dur, a.start, a.end + CLEAN_MIN))
    if (!hit) return t
    t = hit.end + CLEAN_MIN
  }
  return null
}
export function freeBedFor(s: State, serviceId: string, start: number, end: number): string | null {
  const zone = bedZoneFor(serviceId)
  return BEDS.find(b => b.zone === zone && !bedConflict(s, b.id, start, end))?.id ?? null
}

export type KtvState = { label: 'Chưa vào ca' | 'Hết ca' | 'Đang làm' | 'Sắp xong' | 'Dọn phòng' | 'Chuẩn bị đón khách' | 'Rảnh'; tone: Tone; until?: number; next?: Appt; current?: Appt }
export type Tone = 'green' | 'yellow' | 'brown' | 'purple' | 'grey' | 'red'
export function ktvState(s: State, ktvId: string): KtvState {
  const k = s.staff.find(x => x.id === ktvId)!
  const mine = s.appts.filter(a => a.ktvId === ktvId && LIVE.includes(a.status)).sort((a, b) => a.start - b.start)
  const current = mine.find(a => a.status === 'in_service')
  const next = mine.find(a => a.status !== 'in_service' && a.start >= s.now - 30)
  if (k.shift && s.now < SHIFTS[k.shift].start) return { label: 'Chưa vào ca', tone: 'grey', until: SHIFTS[k.shift].start, next }
  if (k.shift && s.now >= SHIFTS[k.shift].end) return { label: 'Hết ca', tone: 'grey' }
  if (current) return s.now >= current.end - 15 ? { label: 'Sắp xong', tone: 'yellow', until: current.end, current, next } : { label: 'Đang làm', tone: 'green', until: current.end, current, next }
  if (Object.values(s.cleaning).includes(ktvId)) return { label: 'Dọn phòng', tone: 'brown', next }
  if (next && next.start - s.now <= 30) return { label: 'Chuẩn bị đón khách', tone: 'purple', until: next.start, next }
  return { label: 'Rảnh', tone: 'grey', next }
}

export type BedState = { label: 'Đang làm' | 'Sắp xong' | 'Đang dọn' | 'Khách đã đến' | 'Lịch hẹn' | 'Trống'; tone: Tone; appt?: Appt; ktv?: string }
export function bedState(s: State, b: Bed): BedState {
  const live = s.appts.filter(a => a.bedId === b.id && LIVE.includes(a.status))
  const cur = live.find(a => a.status === 'in_service')
  if (cur) return { label: s.now >= cur.end - 15 ? 'Sắp xong' : 'Đang làm', tone: s.now >= cur.end - 15 ? 'yellow' : 'green', appt: cur }
  if (s.cleaning[b.id]) return { label: 'Đang dọn', tone: 'brown', ktv: s.cleaning[b.id] }
  const arrived = live.find(a => a.status === 'checked_in')
  if (arrived) return { label: 'Khách đã đến', tone: 'purple', appt: arrived }
  const soon = live.filter(a => a.status === 'booked' && a.start - s.now <= 60).sort((a, b) => a.start - b.start)[0]
  if (soon) return { label: 'Lịch hẹn', tone: 'purple', appt: soon }
  return { label: 'Trống', tone: 'grey' }
}

/** Gợi ý KTV cho khách đang chờ: KTV khách yêu cầu → đầu hàng xoay tour → giờ trống sớm nhất */
export function suggestKtv(s: State, serviceId: string, requested?: string) {
  const dur = svc(serviceId).duration
  const order = [...s.rotation[1], ...s.rotation[2]].filter(id => s.attendance[id]?.in != null && s.attendance[id]?.out == null)
  const opts = order.map(id => {
    const t = earliestFor(s, id, dur, s.now)
    const bed = t != null ? freeBedFor(s, serviceId, t, t + dur) : null
    return { id, t, bed, requested: id === requested, pos: order.indexOf(id) }
  }).filter(o => o.t != null && o.bed)
  opts.sort((a, b) => (a.requested !== b.requested ? (a.requested ? -1 : 1) : (a.t! - b.t!) || a.pos - b.pos))
  return opts
}

export const waitingBills = (s: State) => s.appts.filter(a => a.status === 'done')

export function overview(s: State) {
  const working = ktvs().filter(k => inShift(k, s.now))
  const states = ktvs().map(k => ktvState(s, k.id))
  const beds = BEDS.map(b => bedState(s, b))
  const today = s.appts.filter(a => a.status !== 'cancelled' && a.status !== 'no_show')
  const paidToday = s.invoices.filter(i => i.status !== 'Nháp' && i.status !== 'Đã xóa').reduce((t, i) => t + i.paid, 0)
  return {
    ktvIn: working.length, ktvBusy: states.filter(x => x.label === 'Đang làm' || x.label === 'Sắp xong').length,
    ktvFree: states.filter(x => x.label === 'Rảnh' || x.label === 'Chuẩn bị đón khách').length,
    finishing: s.appts.filter(a => a.status === 'in_service' && a.end - s.now <= 30),
    bedsUsed: beds.filter(b => b.label === 'Đang làm' || b.label === 'Sắp xong').length,
    bedsCleaning: beds.filter(b => b.label === 'Đang dọn').length, bedsTotal: BEDS.length,
    bedsFree: beds.filter(b => b.label === 'Trống').length,
    waiting: s.queue.length, waitingLong: s.queue.filter(q => s.now - q.arrival > 10).length,
    apptTotal: today.length, apptDone: today.filter(a => a.status === 'done' || a.status === 'paid').length,
    apptLeft: today.filter(a => a.status === 'booked' || a.status === 'checked_in').length,
    inService: today.filter(a => a.status === 'in_service').length,
    late: s.appts.filter(a => a.status === 'booked' && s.now - a.start > 10),
    bills: waitingBills(s), revenue: paidToday,
  }
}

/** Cảnh báo tự động — nguồn việc cho Leader/Lễ tân, mỗi cảnh báo có khóa để không tạo việc trùng */
export type Alert = { key: string; level: 'cao' | 'vừa' | 'thấp'; title: string; detail: string; nav: string; customerId?: string; who: 'leader' | 'reception' }
export function alerts(s: State): Alert[] {
  const out: Alert[] = []
  s.queue.filter(q => s.now - q.arrival > 10).forEach(q => out.push({ key: `wait-${q.id}`, level: 'cao', title: `${cust(s, q.customerId).name} chờ chia tour ${s.now - q.arrival} phút`, detail: svc(q.serviceId).name, nav: 'queue', customerId: q.customerId, who: 'reception' }))
  s.appts.filter(a => a.status === 'booked' && s.now - a.start > 10).forEach(a => out.push({ key: `late-${a.id}`, level: 'vừa', title: `${cust(s, a.customerId).name} trễ hẹn ${s.now - a.start} phút`, detail: `${hhmm(a.start)} · ${svc(a.serviceId).name} — gọi xác nhận hoặc đánh dấu không đến`, nav: 'schedule', customerId: a.customerId, who: 'reception' }))
  s.appts.filter(a => a.status === 'done' && s.now - (a.finishedAt ?? a.end) > 15).forEach(a => out.push({ key: `bill-${a.id}`, level: 'vừa', title: `${cust(s, a.customerId).name} xong dịch vụ ${s.now - (a.finishedAt ?? a.end)} phút chưa thanh toán`, detail: svc(a.serviceId).name, nav: 'cashier', customerId: a.customerId, who: 'reception' }))
  s.feedback.filter(f => f.rating <= 3 && f.status === 'mới').forEach(f => out.push({ key: `fb-${f.id}`, level: (f.repeat ?? 1) >= 3 ? 'cao' : 'vừa', title: `Phản hồi ${f.rating}/5 chưa xử lý — ${f.group}`, detail: `${cust(s, f.customerId).name}: ${f.text}${f.repeat ? ` · lặp lại ${f.repeat} lần/tháng` : ''}`, nav: 'customers', customerId: f.customerId, who: 'leader' }))
  s.customers.forEach(c => {
    c.packages.forEach(p => {
      const left = pkgLeft(p)
      if (p.type === 'session' && left <= 2) out.push({ key: `low-${p.cardCode}`, level: left <= 0 ? 'cao' : 'vừa', title: `${c.name}: gói ${p.cardCode} ${left <= 0 ? 'đã hết buổi' : `còn ${left} buổi`}`, detail: 'Cơ hội tái tục — dùng chương trình "Tái tục sớm"', nav: 'customers', customerId: c.id, who: 'leader' })
      if (pkgOwed(p) > 0) out.push({ key: `owe-${p.cardCode}`, level: 'thấp', title: `${c.name} còn thiếu ${(pkgOwed(p) / 1000).toLocaleString('vi-VN')}k gói ${p.cardCode}`, detail: 'Nhắc đóng tiếp khi khách đến', nav: 'cashier', customerId: c.id, who: 'reception' })
    })
    if (c.lastVisitDays >= 45 && (c.vip || c.packages.length)) out.push({ key: `risk-${c.id}`, level: 'cao', title: `${c.name} ${c.lastVisitDays} ngày chưa quay lại`, detail: c.vip ? 'Khách VIP — nguy cơ ngừng sử dụng' : 'Khách liệu trình — nguy cơ ngừng sử dụng', nav: 'customers', customerId: c.id, who: 'leader' })
  })
  const order = { cao: 0, vừa: 1, thấp: 2 }
  return out.sort((a, b) => order[a.level] - order[b.level])
}

export const custSegment = (c: Customer) =>
  c.visits <= 1 ? 'Khách mới' : c.lastVisitDays >= 45 ? 'Lâu chưa đến' : c.packages.some(p => pkgLeft(p) > 0) ? 'Đang dùng liệu trình' : 'Khách quay lại'

// ── Luồng hằng ngày ──
/** Thông báo người này được thấy: đúng vai trò, và nếu có người nhận cụ thể thì chỉ người đó */
export const canSee = (n: import('./data').Notif, role: import('./data').Role, staffId: string) => (n.to ? n.to.includes(staffId) : n.roles.includes(role))
export const myZones = (s: State, staffId: string) => Object.entries(s.zoneOwner).filter(([, v]) => v === staffId).map(([k]) => +k)
/** KTV chỉ được gửi khi khu chưa có báo cáo hoặc báo cáo gần nhất 'Chưa đạt' */
export const canSendReport = (r?: { status: string }) => !r || r.status === 'Chưa đạt'
export const zoneReport = (s: State, zone: number) => s.cleanReports.filter(r => r.zone === zone).sort((a, b) => b.at - a.at)[0]
/** Thứ tự tour hôm nay: ca sáng trước, ca chiều sau (theo hàng xoay tour hiện tại) */
export const tourOrder = (s: State) => [...s.rotation[1], ...s.rotation[2]]
export const pointsOf = (s: State, staffId: string) => s.points.filter(p => p.staffId === staffId && p.status === 'Đã duyệt').reduce((t, p) => t + p.delta, 0)
/** Tour hôm nay cần đối soát bill: lượt đã/đang phục vụ */
export function billRows(s: State) {
  return s.appts.filter(a => ['in_service', 'done', 'paid'].includes(a.status)).sort((a, b) => a.start - b.start).map(a => {
    const inv = s.invoices.find(i => i.status !== 'Đã xóa' && i.status !== 'Nháp' && i.lines.some(l => l.apptId === a.id))
    const photo = s.bills.some(b => b.staffId === a.ktvId && b.at >= a.start) // ảnh bill chụp sau khi tour bắt đầu
    const issue = a.status === 'in_service' ? null : !inv ? `Chưa thu tiền — trách nhiệm KTV ${s.staff.find(x => x.id === a.ktvId)?.name} hoặc lễ tân` : !photo ? `KTV ${s.staff.find(x => x.id === a.ktvId)?.name} chưa tải ảnh bill` : null
    return { a, inv, photo, issue }
  })
}
/** Tiền hệ thống của ca hiện tại: hóa đơn tạo SAU lần chốt ca gần nhất trong ngày (bàn giao giữa 2 lễ tân) */
export const lastCloseAt = (s: State) => Math.max(-1, ...s.shiftCloses.map(x => x.at))
/** Hóa đơn chưa thuộc lần chốt ca nào (không mất hóa đơn tạo cùng phút với lần chốt trước) */
export const shiftInvoices = (s: State) => {
  const done = new Set(s.shiftCloses.flatMap(x => x.codes ?? []))
  const since = s.shiftCloses.some(x => x.codes) ? -1 : lastCloseAt(s)
  return s.invoices.filter(i => i.status !== 'Nháp' && i.status !== 'Đã xóa' && !done.has(i.code) && i.createdMin > since)
}
export const expectedByMethod = (s: State) => {
  const r: Record<'Tiền mặt' | 'Chuyển khoản' | 'Thẻ ngân hàng', number> = { 'Tiền mặt': 0, 'Chuyển khoản': 0, 'Thẻ ngân hàng': 0 }
  shiftInvoices(s).forEach(i => i.payments.forEach(p => { r[p.method] += p.amount }))
  return r
}

// ── m1: thông báo đọc/chưa đọc (theo từng người) ──
type NotifBox = { notifs: import('./data').Notif[] }
export function markReadIn(d: NotifBox, nid: string, staffId: string) {
  const n = d.notifs.find(x => x.id === nid); if (n && !n.readBy.includes(staffId)) n.readBy.push(staffId)
}
export function markUnreadIn(d: NotifBox, nid: string, staffId: string) {
  const n = d.notifs.find(x => x.id === nid); if (n) n.readBy = n.readBy.filter(x => x !== staffId)
}
/** Số thông báo chưa đọc — một nguồn cho badge Hôm nay, chuông và nút số 5 */
export const unreadCount = (s: NotifBox, role: import('./data').Role, staffId: string) => s.notifs.filter(n => canSee(n, role, staffId) && !n.readBy.includes(staffId)).length

// ── m1: Dọn dẹp — 4 ô số bấm ra chi tiết ──
export const zoneKey = (zone: number, staffId: string) => `${daysAhead(0)}|${zone}|${staffId}`
export function cleanDetail(s: State, role: import('./data').Role, meId: string) {
  const scoped = role === 'ktv' ? s.cleanReports.filter(r => r.staffId === meId) : s.cleanReports // KTV chỉ thấy báo cáo của mình
  const mine = s.cleanReports.filter(r => r.staffId === meId)
  return {
    zones: myZones(s, meId),
    mine,
    points: mine.reduce((t, r) => t + (r.points ?? 0), 0),
    pending: scoped.filter(r => r.status === 'Chờ kiểm tra'),
    redo: scoped.filter(r => r.status === 'Chưa đạt' && zoneReport(s, r.zone)?.id === r.id),
  }
}

// ── m1: khách của KTV (G4) và ô "Bán cho ai" ──
export function ktvCustomers(s: State, me: { id: string; name: string }) {
  const cared = new Set([...s.appts.filter(a => a.ktvId === me.id && ['in_service', 'done', 'paid'].includes(a.status)).map(a => a.customerId), ...s.customers.filter(c => c.packages.some(p => p.usage.some(u => u.ktv === me.name)) || c.care.some(x => x.by === me.name)).map(c => c.id)])
  const requested = new Set(s.appts.filter(a => a.ktvId === me.id && a.requested).map(a => a.customerId))
  const closed = s.customers.filter(c => c.packages.some(p => p.closerIds?.includes(me.id) || p.closer === me.name || p.closer === me.id))
  const all = s.customers.filter(c => cared.has(c.id) || requested.has(c.id) || closed.some(x => x.id === c.id))
  return { cared, requested, closed, all }
}
export const PHONE_RE = /(\+?84|0)\d{9}/
/** Nội dung có dạng SĐT (bỏ khoảng trắng, chấm, gạch) */
export const looksLikePhone = (t: string) => PHONE_RE.test(t.replace(/[^\d+]/g, ''))
const fold = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
/** Gợi ý khách theo mã/tên trong tập của KTV; KHÔNG tìm theo SĐT, nhập SĐT → không gợi ý */
export function buyerSuggestions(s: State, me: { id: string; name: string }, q: string) {
  const k = fold(q.trim())
  if (!k || looksLikePhone(q)) return []
  return ktvCustomers(s, me).all.filter(c => fold(c.name).includes(k) || fold(c.code).includes(k)).slice(0, 5)
}
/** Kiểm tra form nhận sản phẩm của KTV; trả về câu báo lỗi hoặc null */
export function validateReceive(f: { purpose?: 'ban_khach' | 'dung_co_so'; buyer: string; invoice: string; photo: string }): string | null {
  if (f.purpose === 'ban_khach' && looksLikePhone(f.buyer)) return T.product.errPhone
  if (!f.purpose) return T.product.errPurpose
  if (f.purpose === 'ban_khach') {
    if (!f.buyer.trim()) return T.product.errBuyer
    if (!f.invoice) return T.product.errInvoice
  }
  if (!f.photo) return T.product.errPhoto
  return null
}
/** Người mua + ảnh hóa đơn: chỉ KTV tạo, Lễ tân, CEO */
export const canSeeBuyer = (role: import('./data').Role, viewerId: string, p: { ktvId: string }) => role === 'reception' || role === 'ceo' || (role === 'ktv' && p.ktvId === viewerId)

// ── m2: "AI kiểm tra" GIẢ LẬP (G7) — chỉ chọn nhánh theo tỉ lệ checklist đã tích, không đọc ảnh ──
export type AiResult = { branch: 0 | 1 | 2 | 3; status?: 'Chưa đạt' | 'Chờ kiểm tra'; label: string; reason: string; done: number; total: number }
/** branch 0 = thiếu ảnh (không chạy AI) · 1 = lỗi rõ (<50%) · 3 = chưa đủ căn cứ (50% đến <100%) · 2 = phù hợp (100%) */
export function aiCheck(checks: boolean[], photo: string): AiResult {
  const total = checks.length, done = checks.filter(Boolean).length
  if (!photo) return { branch: 0, label: '', reason: 'Cần tải ảnh minh chứng', done, total }
  if (total === 0 || done * 2 < total) return { branch: 1, status: 'Chưa đạt', label: 'AI (giả lập): lỗi rõ', reason: `AI (giả lập): mới tích ${done}/${total} việc, chưa đạt tiêu chuẩn — dọn lại và gửi ảnh mới`, done, total }
  if (done < total) return { branch: 3, status: 'Chờ kiểm tra', label: 'AI (giả lập): chưa đủ căn cứ', reason: `AI (giả lập): tích ${done}/${total} việc, chưa đủ căn cứ — cần Lễ tân/Leader kiểm tra`, done, total }
  return { branch: 2, status: 'Chờ kiểm tra', label: 'AI: phù hợp (giả lập)', reason: `AI (giả lập): tích đủ ${done}/${total} việc, ảnh phù hợp`, done, total }
}

// ── m3: Góp ý / sáng kiến ──
type Sug = import('./data').Suggestion
/** Ngày hôm nay dạng yyyy-mm-dd (giờ máy) cho ô chọn ngày */
export const isoToday = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
/** yyyy-mm-dd → dd/mm/yyyy */
export const isoToVi = (iso: string) => { const [y, m, d] = iso.split('-'); return y && m && d ? `${d}/${m}/${y}` : iso }
/** Ý kiến do chính người này gửi (mới nhất trước) */
export const mySuggestions = (s: Pick<State, 'suggestions'>, staffId: string): Sug[] => s.suggestions.filter(x => x.staffId === staffId)
/** Danh sách ý kiến KTV phía nhận — lọc ở dữ liệu, không ẩn bằng giao diện.
 *  CEO: tất cả · Leader: loại 1, 3, 4 (không loại 2 "Nhân sự / cấp trên", G15) · vai trò khác: không có. */
export function inboxSuggestions(s: Pick<State, 'suggestions'>, role: import('./data').Role): Sug[] {
  if (role === 'ceo') return s.suggestions
  if (role === 'leader') return s.suggestions.filter(x => x.kind !== 2)
  return []
}
/** Lỗi khi gửi ý kiến (null = hợp lệ): nội dung rỗng sau trim, ngày rỗng/sai, ngày tương lai, loại sai */
export function suggestionError(kind: number, text: string, date: string, today = isoToday()): string | null {
  if (![1, 2, 3, 4].includes(kind)) return T.idea.errKind
  if (!text.trim()) return T.idea.errText
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return T.idea.errDate
  if (date > today) return T.idea.errFuture
  return null
}

// ── m4: Khách hàng của KTV (giả định G4–G6, G8, G14) ──
// Hàm cho KTV KHÔNG đọc totalPaid / finalPrice / pkgPaid / pkgOwed (doanh thu chỉ CEO).
type Me = { id: string; name: string }
/** "dd/mm/yyyy" hoặc "yyyy-mm-dd" → số ngày (để so sánh); sai → null */
export function dayNum(d?: string): number | null {
  if (!d) return null
  let m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d.trim()), y: number, mo: number, da: number
  if (m) { da = +m[1]; mo = +m[2]; y = +m[3] } else { m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.trim()); if (!m) return null; y = +m[1]; mo = +m[2]; da = +m[3] }
  return Math.floor(Date.UTC(y, mo - 1, da) / 864e5)
}
/** Ngân sách giảm dần; bằng nhau → khách cũ (firstVisit sớm hơn) trước; không có ngân sách → cuối. Chỉ đọc budget + firstVisit. */
export function sortByBudget<C extends Pick<Customer, 'budget' | 'firstVisit'>>(list: C[]): C[] {
  const fv = (c: C) => dayNum(c.firstVisit) ?? Infinity
  return [...list].sort((a, b) => {
    const ha = a.budget != null, hb = b.budget != null
    if (ha !== hb) return ha ? -1 : 1
    if (ha && hb && a.budget !== b.budget) return b.budget! - a.budget!
    return fv(a) - fv(b)
  })
}
/** Tìm của KTV: chỉ mã KH (cả mã thẻ) và tên, không dấu, không phân biệt hoa thường; SĐT → không khớp */
export function ktvMatch(c: Customer, q: string) {
  const k = fold(q.trim())
  if (!k) return true
  if (looksLikePhone(q)) return false
  return fold(c.name).includes(k) || fold(c.code).includes(k) || c.packages.some(p => fold(p.cardCode).includes(k))
}
/** KTV được mở hồ sơ: khách thuộc tập G4 hoặc có tour hôm nay với KTV đó */
export const ktvCanOpen = (s: State, me: Me, customerId: string) =>
  ktvCustomers(s, me).all.some(c => c.id === customerId) || s.appts.some(a => a.customerId === customerId && a.ktvId === me.id && a.status !== 'cancelled')

const closedByMe = (p: import('./data').Package, me: Me) => !!(p.closerIds?.includes(me.id) || p.closer === me.name || p.closer === me.id)
/** Tái tục = pkgSale.mode 'renew' trên hóa đơn của thẻ, hoặc thẻ ghi renewalOf */
export const isRenewal = (s: Pick<State, 'invoices'>, p: import('./data').Package) =>
  !!p.renewalOf || s.invoices.some(i => i.pkgSale?.cardCode === p.cardCode && i.pkgSale.mode === 'renew')
/** Tab "Tôi chốt liệu trình": khách lẻ tôi chốt (thẻ mới) và khách tái tục tôi chốt */
export function closedSplit(s: State, me: Me) {
  const mine = (c: Customer) => c.packages.filter(p => closedByMe(p, me))
  const closed = ktvCustomers(s, me).closed
  return { le: closed.filter(c => mine(c).some(p => !isRenewal(s, p))), renew: closed.filter(c => mine(c).some(p => isRenewal(s, p))) }
}
export type KtvTab = 'cared' | 'req' | 'closed'
/** G6: ngày sự kiện gần nhất của khách trong mục (chăm sóc / lịch hẹn / chốt thẻ) */
export function lastEventDay(s: State, me: Me, c: Customer, tab: KtvTab): number | null {
  const today = dayNum(daysAhead(0))
  const ds: (number | null)[] = []
  if (tab === 'cared') {
    c.care.filter(x => x.by === me.name).forEach(x => ds.push(dayNum(x.at)))
    c.packages.forEach(p => p.usage.filter(u => u.ktv === me.name).forEach(u => ds.push(dayNum(u.at.split(' ')[0]))))
    if (s.appts.some(a => a.customerId === c.id && a.ktvId === me.id && ['in_service', 'done', 'paid'].includes(a.status))) ds.push(today)
  } else if (tab === 'req') {
    if (s.appts.some(a => a.customerId === c.id && a.ktvId === me.id && a.requested)) ds.push(today)
  } else c.packages.filter(p => closedByMe(p, me)).forEach(p => ds.push(dayNum(p.buyDate)))
  const ok = ds.filter((x): x is number => x != null)
  return ok.length ? Math.max(...ok) : null
}
/** Lọc khoảng A→B (yyyy-mm-dd, bỏ trống = không giới hạn). A > B → báo lỗi, KHÔNG lọc. */
export function filterByRange(s: State, me: Me, list: Customer[], tab: KtvTab, a: string, b: string): { list: Customer[]; error: string | null } {
  const da = dayNum(a), db = dayNum(b)
  if (da == null && db == null) return { list, error: null }
  if (da != null && db != null && da > db) return { list, error: T.cust.rangeErr }
  return { list: list.filter(c => { const d = lastEventDay(s, me, c, tab); return d != null && (da == null || d >= da) && (db == null || d <= db) }), error: null }
}

export type PkgFile = 1 | 2 | 3 | 4 | 5
export type SegFilter = {
  q?: string; visitsOp?: 'gte' | 'lte' | 'once'; visits?: number; budgetMin?: number; budgetMax?: number; source?: string
  awayDays?: number; birthMonth?: number; unhappy?: boolean; referrerId?: string; departed?: boolean; file?: PkgFile
}
const paidInFull = (p: import('./data').Package) => p.payments.some(x => x.kind === 'Thanh toán đủ')
/** G8/G14: trạng thái thẻ theo loại lần đóng tiền (không đọc số tiền) */
export function pkgFileOf(p: import('./data').Package, f: PkgFile) {
  const left = pkgLeft(p)
  switch (f) {
    case 1: return p.payments.length > 0 && !paidInFull(p)
    case 2: return paidInFull(p) && left > 0
    case 3: return p.type === 'session' && left === 2
    case 4: return p.type === 'session' && left === 1
    case 5: return left <= 0
  }
}
export const birthMonth = (c: Pick<Customer, 'dob'>) => { const m = /^\d{1,2}\/(\d{1,2})/.exec(c.dob ?? ''); return m ? +m[1] : null }
/** Sinh nhật cho KTV: chỉ ngày/tháng (G13) */
export const dobNoYear = (dob?: string) => { const m = /^(\d{1,2})\/(\d{1,2})/.exec(dob ?? ''); return m ? `${m[1]}/${m[2]}` : null }
export const isUnhappy = (s: Pick<State, 'feedback'>, c: Customer) => !!c.unhappy || s.feedback.some(f => f.customerId === c.id && f.rating <= 3 && f.status !== 'đã xử lý')
/** Khách Home Spa của KTV: MỘT nguồn cho danh sách và số trên nút. Tập = G4 ∩ nhóm VN/NN ∩ lẻ/liệu trình. */
export function customerSegments(s: State, me: Me, group: 'VN' | 'NN', kind: 'le' | 'lt', f: SegFilter = {}): Customer[] {
  const rows = ktvCustomers(s, me).all.filter(c => {
    if (c.group !== group || (c.packages.length > 0) !== (kind === 'lt')) return false
    if (f.q && !ktvMatch(c, f.q)) return false
    if (f.visitsOp === 'once' && c.visits !== 1) return false
    if (f.visitsOp === 'gte' && f.visits != null && c.visits < f.visits) return false
    if (f.visitsOp === 'lte' && f.visits != null && c.visits > f.visits) return false
    if (f.budgetMin != null && (c.budget == null || c.budget < f.budgetMin)) return false
    if (f.budgetMax != null && (c.budget == null || c.budget > f.budgetMax)) return false
    if (f.source && c.source !== f.source) return false
    if (f.awayDays && c.lastVisitDays < f.awayDays) return false
    if (f.birthMonth && birthMonth(c) !== f.birthMonth) return false
    if (f.unhappy && !isUnhappy(s, c)) return false
    if (f.referrerId && c.referredBy !== f.referrerId) return false
    if (f.departed && !c.departed) return false
    if (f.file && !c.packages.some(p => pkgFileOf(p, f.file!))) return false
    return true
  })
  return sortByBudget(rows)
}
/** Xuất file khách — CHỈ màn CEO gọi hàm này (R5) */
export function customersCsv(list: Customer[]) {
  // chặn công thức Excel: ô bắt đầu bằng = + - @ → thêm dấu '
  const q = (v: unknown) => { const x = String(v ?? ''); return `"${(/^[=+\-@]/.test(x) ? "'" + x : x).replace(/"/g, '""')}"` }
  const head = ['Mã KH', 'Tên', 'SĐT', 'Nhóm', 'Nguồn', 'Số lần', 'Lần cuối (ngày trước)', 'Ngân sách', 'Tổng đã trả']
  return [head, ...list.map(c => [c.code, c.name, c.phone, c.group, c.source, c.visits, c.lastVisitDays, c.budget ?? '', c.totalPaid])].map(r => r.map(q).join(',')).join('\n')
}
/** R5: SĐT khách chỉ Lễ tân + CEO */
export const canSeePhone = (role: import('./data').Role) => role === 'reception' || role === 'ceo'

// ═══ FIX LẦN 1 — Kho, chi tiêu, công nợ (một nguồn số) ═══
const IT = (id: string) => D.STOCK_ITEMS.find(x => x.id === id)!
/** Tồn kho chung: tồn đầu + nhập + hoàn trả − cấp − dùng chung − bán − hỏng ± kiểm kê */
export function stockQty(s: State, item: string) {
  return s.stockMoves.filter(m => m.item === item && m.status !== 'Chờ duyệt' && m.status !== 'Từ chối').reduce((t, m) => {
    switch (m.kind) { case 'Nhập': case 'Hoàn trả': return t + m.qty; case 'Kiểm kê': return t + m.qty; case 'Đề xuất mua': return t; default: return t - m.qty }
  }, IT(item).start)
}
/** Đang giữ tại nhân viên = cấp − hoàn trả − đã dùng (số liệu mẫu: phần đã dùng ước theo tour) */
export function heldBy(s: State, staffId: string, item: string) {
  const mv = s.stockMoves.filter(m => m.item === item && m.staffId === staffId)
  const got = mv.filter(m => m.kind === 'Cấp NV').reduce((t, m) => t + m.qty, 0), back = mv.filter(m => m.kind === 'Hoàn trả').reduce((t, m) => t + m.qty, 0)
  const lost = mv.filter(m => m.kind === 'Hỏng/hao hụt').reduce((t, m) => t + m.qty, 0)
  return { got, back, lost }
}
/** Tiêu hao = tồn đầu + nhận thêm − hoàn trả − tồn cuối */
export const usage = (start: number, got: number, back: number, end: number) => start + got - back - end
/** Cảnh báo & đề xuất mua: dưới ngưỡng cảnh báo → mua đủ mức cần duy trì, trừ hàng đã đặt chưa nhận */
export function buySuggest(s: State) {
  return D.STOCK_ITEMS.map(it => {
    const q = stockQty(s, it.id), ordered = s.stockMoves.filter(m => m.item === it.id && m.kind === 'Đề xuất mua' && m.status !== 'Từ chối').reduce((t, m) => t + m.qty, 0)
    const need = q < it.warn ? Math.max(0, it.keep - q - ordered) : 0
    return { it, q, ordered, need, state: q <= 0 ? 'Đã hết' : q < it.warn ? 'Sắp hết' : 'Đủ' }
  })
}
export const expensesTotal = (s: State) => s.expenses.reduce((t, e) => t + e.amount, 0)
/** Công nợ: buổi spa đang nợ khách (liệu trình còn buổi) và tiền cọc còn thiếu */
export function debtSummary(s: State) {
  const pk = s.customers.flatMap(c => c.packages.map(p => ({ c, p })))
  const left = pk.filter(x => D.pkgLeft(x.p) > 0)
  const deposit = pk.filter(x => D.pkgOwed(x.p) > 0), full = left.filter(x => D.pkgOwed(x.p) === 0)
  const perSession = (p: D.Package) => p.type === 'session' ? p.finalPrice / Math.max(1, (p.sessions ?? 0) + (p.bonus ?? 0)) : 1
  const owedValue = (p: D.Package) => p.type === 'session' ? D.pkgLeft(p) * perSession(p) : D.pkgLeft(p)
  return { left, deposit, full, sessionsOwed: left.filter(x => x.p.type === 'session').reduce((t, x) => t + D.pkgLeft(x.p), 0), owedValue, depositPaid: deposit.reduce((t, x) => t + D.pkgPaid(x.p), 0), depositMissing: deposit.reduce((t, x) => t + D.pkgOwed(x.p), 0), fullValue: full.reduce((t, x) => t + owedValue(x.p), 0) }
}
/** Hiệu suất nhân sự theo sơ đồ (5 nhóm). null = Chưa nối (chưa có dữ liệu/công thức). Không tự cộng điểm. */
export function ktvPerf(s: State, id: string, extra = false): { g: string; rows: { t: string; v: string | null }[] }[] {
  const me = s.staff.find(x => x.id === id), name = me?.name ?? ''
  const ap = s.appts.filter(a => a.ktvId === id && ['done', 'paid'].includes(a.status))
  const fb = s.feedback.filter(f => f.ktvId === id)
  const pk = s.customers.flatMap(c => c.packages.filter(p => (p.closerIds ?? []).includes(id) || p.closer === name))
  const served = new Set(ap.map(a => a.customerId))
  const cr = s.cleanReports.filter(r => r.staffId === id && r.status !== 'Chờ kiểm tra')
  const at = s.attendance[id], st = me?.shift ? D.SHIFTS[me.shift].start : null
  const c = (id2: string) => s.customers.find(x => x.id === id2)
  return [
    { g: '1. Chuyên môn và khách hàng', rows: [
      { t: 'Điểm TB khách đánh giá', v: fb.length ? (fb.reduce((t, f) => t + f.rating, 0) / fb.length).toFixed(1) + '/5' : null },
      { t: 'Số khách yêu cầu', v: String(s.appts.filter(a => a.ktvId === id && a.requested && !['cancelled', 'no_show'].includes(a.status)).length) },
      { t: 'Đánh giá chấm điểm chuyên môn theo kì', v: null },
      { t: 'Best saler, tỉ suất % sale', v: served.size ? `${pk.length} thẻ · ${Math.round(pk.length / served.size * 100)}%` : `${pk.length} thẻ` },
      { t: 'Số lượt KH phục vụ', v: String(ap.length) },
      { t: 'Tổng số giờ phục vụ khách', v: (ap.reduce((t, a) => t + a.end - a.start, 0) / 60).toFixed(1) + ' giờ' },
      ...(extra ? [{ t: 'Số hồ sơ khách hàng được cập nhật', v: String(s.customers.filter(x => x.care.some(e => e.by === name)).length) }] : []),
    ] },
    { g: '2. Tăng trưởng KH', rows: [
      { t: 'KH mới phục vụ', v: String([...served].filter(x => (c(x)?.visits ?? 0) <= 1).length) },
      { t: 'Khách mới quay lại', v: String([...served].filter(x => c(x)?.visits === 2).length) },
      { t: 'KH mới mua liệu trình', v: String(pk.filter(p => !p.renewalOf).length) },
      { t: 'KH cũ tái tục liệu trình', v: String(pk.filter(p => p.renewalOf).length) },
      ...(extra ? [{ t: 'Số data khách giới thiệu thêm', v: null }] : []),
    ] },
    { g: '3. Tinh thần làm việc', rows: [
      { t: 'Set up dọn dẹp đúng tiêu chuẩn', v: cr.length ? `${cr.filter(r => r.status === 'Đạt').length}/${cr.length} lần đạt` : null },
      { t: 'Ý thức đúng giờ', v: at?.in != null && st != null ? (at.in <= st ? 'Đúng giờ' : `Trễ ${at.in - st} phút`) : null },
      { t: 'Nhận tăng ca (Team 1 / Team 2)', v: null }, { t: 'Chấp hành quy trình', v: null }, { t: 'Chuyên cần', v: null }, { t: 'Tinh thần học tập', v: null },
    ] },
    { g: '4. Văn hóa ứng xử', rows: [{ t: extra ? 'Được nhân sự bầu chọn là người yêu thích nhất' : 'Được KTV, lễ tân bầu chọn là người yêu thích nhất', v: null }, { t: 'Được cấp trên bình chọn', v: null }] },
    { g: 'Sáng tạo – đổi mới', rows: [{ t: 'Có các ý kiến sáng tạo đóng góp cho spa', v: String(s.suggestions.filter(x => x.staffId === id).length) }, { t: 'Giúp đỡ Home', v: null }] },
  ]
}
