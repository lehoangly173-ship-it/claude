// Các phép tính dẫn xuất (không lưu) — mọi con số trên màn hình đều tính từ đây,
// để Tổng quan, Sơ đồ giường, Hàng chờ, Leader... luôn khớp nhau.
import {
  Appt, BEDS, Bed, Customer, ktvs, SHIFTS, Staff, svc, bedZoneFor, pkgLeft, pkgOwed, hhmm, Feedback, Invoice, Task,
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
  const order = [...s.rotation[1], ...s.rotation[2]]
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
