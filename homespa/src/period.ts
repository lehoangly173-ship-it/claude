// MỘT NGUỒN cho mọi con số theo thời gian (doanh thu, chi phí, lợi nhuận, khách, tour, nhân sự).
// Quy tắc: hôm nay = dữ liệu thật trong app (hóa đơn, lịch, chấm công, chi tiêu, kho).
//          ngày đã qua = số liệu mẫu cố định theo ngày (cùng một ngày luôn ra cùng một số) — khi nối dữ liệu
//          thật chỉ cần thay hàm pastDay() bằng truy vấn, mọi màn/biểu đồ tự đúng.
//          ngày tương lai = 0 (không bịa).
import { useSyncExternalStore } from 'react'
import * as D from './data'
import { soldToday, type State } from './logic'

// ── Kỳ thời gian ──
export type Gran = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
export type Period = { g: Gran; from?: string; to?: string } // from/to dạng yyyy-mm-dd khi 'custom'
export const GRANS: { k: Gran; label: string }[] = [
  { k: 'day', label: 'Ngày' }, { k: 'week', label: 'Tuần' }, { k: 'month', label: 'Tháng' },
  { k: 'quarter', label: 'Quý' }, { k: 'year', label: 'Năm' }, { k: 'custom', label: 'Tùy chọn' },
]
const DAY = 864e5
export const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return startOf(x) }
export const today = () => startOf(D.TODAY)
const days = (a: Date, b: Date) => Math.round((startOf(b).getTime() - startOf(a).getTime()) / DAY) + 1
export const fmtD = (d: Date) => D.dateShort(d)
const fmtDM = (d: Date) => fmtD(d).slice(0, 5)
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const fromIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const parseVN = (s: string) => { const [d, m, y] = s.split('/').map(Number); return new Date(y, m - 1, d) }

export type Range = { from: Date; to: Date; name: string; label: string; partial: boolean }
/** Kỳ chứa ngày `ref` theo đơn vị g (tuần bắt đầu thứ Hai). `to` không vượt hôm nay. */
export function rangeOf(g: Exclude<Gran, 'custom'>, ref: Date): Range {
  const r = startOf(ref), t = today()
  let from: Date, end: Date, name: string
  if (g === 'day') { from = r; end = r; name = +r === +t ? 'Hôm nay' : fmtDM(r) }
  else if (g === 'week') { from = addDays(r, -((r.getDay() + 6) % 7)); end = addDays(from, 6); name = `Tuần ${fmtDM(from)}` }
  else if (g === 'month') { from = new Date(r.getFullYear(), r.getMonth(), 1); end = new Date(r.getFullYear(), r.getMonth() + 1, 0); name = `Tháng ${r.getMonth() + 1}/${r.getFullYear()}` }
  else if (g === 'quarter') { const q = Math.floor(r.getMonth() / 3); from = new Date(r.getFullYear(), q * 3, 1); end = new Date(r.getFullYear(), q * 3 + 3, 0); name = `Quý ${q + 1}/${r.getFullYear()}` }
  else { from = new Date(r.getFullYear(), 0, 1); end = new Date(r.getFullYear(), 11, 31); name = `Năm ${r.getFullYear()}` }
  const partial = end > t, to = partial ? t : end
  return { from, to, name, partial, label: +from === +to ? fmtD(from) : `${fmtD(from)} – ${fmtD(to)}` }
}
export const MIN_DAY = () => new Date(today().getFullYear() - 3, 0, 1) // xem lại tối đa từ đầu năm cách đây 3 năm
/** Kỳ đang chọn + kỳ so sánh cùng độ dài (đến cùng ngày) để so công bằng */
export function periodRanges(p: Period): { cur: Range; prev: Range } {
  if (p.g === 'custom') {
    const t = today()
    let a = p.from ? fromIso(p.from) : addDays(t, -6), b = p.to ? fromIso(p.to) : t
    if (a > b) [a, b] = [b, a]
    if (b > t) b = t
    if (a > b) a = b
    if (a < MIN_DAY()) a = MIN_DAY()
    if (b < a) b = a
    const n = days(a, b), pa = addDays(a, -n), pb = addDays(a, -1)
    const mk = (x: Date, y: Date, name: string): Range => ({ from: x, to: y, name, partial: false, label: +x === +y ? fmtD(x) : `${fmtD(x)} – ${fmtD(y)}` })
    return { cur: mk(a, b, `${n} ngày đã chọn`), prev: mk(pa, pb, `${n} ngày liền trước`) }
  }
  const cur = rangeOf(p.g, today())
  return { cur, prev: prevOf(cur, p.g) }
}
/** Kỳ liền trước của r, cắt cùng số ngày với r (VD 01/10–11/10 so với 01/09–11/09) */
export function prevOf(cur: Range, g: Exclude<Gran, 'custom'>): Range {
  const back = g === 'day' ? addDays(cur.from, -1) : g === 'week' ? addDays(cur.from, -7)
    : new Date(cur.from.getFullYear() - (g === 'year' ? 1 : 0), cur.from.getMonth() - (g === 'month' ? 1 : g === 'quarter' ? 3 : 0), 1)
  const pr = rangeOf(g, back)
  const n = days(cur.from, cur.to), pto = addDays(pr.from, n - 1) < pr.to ? addDays(pr.from, n - 1) : pr.to
  return { ...pr, to: pto, partial: false, label: +pr.from === +pto ? fmtD(pr.from) : `${fmtD(pr.from)} – ${fmtD(pto)}` }
}
export const spanDays = (r: { from: Date; to: Date }) => days(r.from, r.to)
/** n kỳ gần nhất (cũ → mới) để vẽ xu hướng */
export function lastRanges(g: Gran, n: number, p?: Period): Range[] {
  if (g === 'custom') { // tùy chọn: chia theo ngày nếu ≤ 31 ngày, theo tuần nếu ≤ 26 tuần, còn lại theo tháng
    const { cur } = periodRanges(p ?? { g })
    const len = days(cur.from, cur.to), unit: Exclude<Gran, 'custom'> = len <= 31 ? 'day' : len <= 182 ? 'week' : 'month'
    const out: Range[] = []; let d = cur.from
    while (d <= cur.to) { const r = rangeOf(unit, d), from = r.from < cur.from ? cur.from : r.from, to = r.to > cur.to ? cur.to : r.to
      out.push({ ...r, from, to, label: +from === +to ? fmtD(from) : `${fmtD(from)} – ${fmtD(to)}` }); d = addDays(rangeOf(unit, d).to, 1) }
    return out.slice(-40)
  }
  const out: Range[] = []; let ref = today()
  for (let i = 0; i < n; i++) { const r = rangeOf(g, ref); out.unshift(r); ref = addDays(r.from, -1) }
  return out
}
export const shortName = (r: Range, g: Gran) => g === 'day' ? (r.name === 'Hôm nay' ? 'Hôm nay' : fmtDM(r.from)) : g === 'week' ? fmtDM(r.from) : g === 'month' ? `T${r.from.getMonth() + 1}` : g === 'quarter' ? `Q${Math.floor(r.from.getMonth() / 3) + 1}/${String(r.from.getFullYear()).slice(2)}` : g === 'year' ? String(r.from.getFullYear()) : (+r.from === +r.to ? fmtDM(r.from) : `${fmtDM(r.from)}`)
export const trendCount: Record<Gran, number> = { day: 7, week: 8, month: 6, quarter: 4, year: 3, custom: 0 }
export const customUnit = (p: Period): Exclude<Gran, 'custom'> => { const { cur } = periodRanges(p); const n = days(cur.from, cur.to); return n <= 31 ? 'day' : n <= 182 ? 'week' : 'month' }
export const trendUnit = (g: Gran, p: Period) => g !== 'custom' ? GRANS.find(x => x.k === g)!.label.toLowerCase() : (() => { const { cur } = periodRanges(p); const n = days(cur.from, cur.to); return n <= 31 ? 'ngày' : n <= 182 ? 'tuần' : 'tháng' })()

// ── Kỳ đang chọn: dùng chung cho mọi màn Leader/CEO (đổi ở đâu, cập nhật mọi nơi) ──
let cur: Period = { g: 'month' }
const subs = new Set<() => void>()
export function setPeriod(p: Period) { cur = p; subs.forEach(f => f()) }
export function usePeriod(): [Period, (p: Period) => void] {
  const p = useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f) } }, () => cur)
  return [p, setPeriod]
}

// ── Số liệu theo ngày ──
const hash = (str: string) => { let x = 2166136261; for (const c of str) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0; return x }
const rnd = (key: string) => (hash(key) % 1000) / 1000 // 0..1 cố định theo khóa
export type Metrics = {
  revenue: number; lePart: number; pkgPart: number; prodPart: number
  costProd: number; costFixed: number; costOther: number
  guests: number; newCust: number; returning: number; bookings: number; due: number; shown: number; waitSum: number; waitN: number
  bySource: Record<string, number>; byCat: Record<string, number>
}
const zero = (): Metrics => ({ revenue: 0, lePart: 0, pkgPart: 0, prodPart: 0, costProd: 0, costFixed: 0, costOther: 0, guests: 0, newCust: 0, returning: 0, bookings: 0, due: 0, shown: 0, waitSum: 0, waitN: 0, bySource: {}, byCat: {} })
export const FIXED_CATS = ['Tiền mặt bằng', 'Điện', 'Nước', 'Rác + Wifi'] as const
const FIXED_MONTH: Record<string, number> = { 'Tiền mặt bằng': 25000000, 'Điện': 4200000, 'Nước': 900000, 'Rác + Wifi': 600000 }
const FIXED_DAY: Record<string, number> = { 'Tiền mặt bằng': 2, 'Điện': 6, 'Nước': 6, 'Rác + Wifi': 6 }
const OTHER_MONTH: Record<string, number> = { 'Quảng cáo Facebook': 3500000, 'Hàng hóa sử dụng': 1800000 }
const PER_TOUR_COST = 3600 // chi phí vật tư / tour (định mức mẫu)
const okInv = (s: State) => s.invoices.filter(i => i.status !== 'Nháp' && i.status !== 'Đã xóa')
const sourceOf = (s: State, id: string) => s.customers.find(c => c.id === id)?.source ?? 'Khác'
const isPkg = (i: D.Invoice) => !!i.pkgSale || i.lines.some(l => l.cardCode)

function todayReal(s: State): Metrics {
  const m = zero(), inv = okInv(s)
  for (const i of inv) { m.revenue += i.paid; (isPkg(i) ? (m.pkgPart += i.paid) : (m.lePart += i.paid)); const src = sourceOf(s, i.customerId); m.bySource[src] = (m.bySource[src] ?? 0) + i.paid }
  const sold = soldToday(s)
  m.prodPart = sold; m.revenue += sold
  if (sold) m.bySource['Khác'] = (m.bySource['Khác'] ?? 0) + sold // bán lẻ sản phẩm không gắn khách → để tổng theo nguồn khớp tổng tiền thu
  const ok = s.stockMoves.filter(x => x.status !== 'Chờ duyệt' && x.status !== 'Từ chối')
  m.costProd = D.STOCK_ITEMS.reduce((t, it) => t + Math.max(0, ok.filter(x => x.item === it.id && (x.kind === 'Cấp NV' || x.kind === 'Dùng chung')).reduce((a, x) => a + x.qty, 0) - ok.filter(x => x.item === it.id && x.kind === 'Hoàn trả').reduce((a, x) => a + x.qty, 0)) * it.cost, 0)
  m.byCat['Vật tư dùng cho khách'] = m.costProd
  m.guests = new Set(inv.map(i => i.customerId)).size
  m.newCust = s.customers.filter(c => c.firstVisit === D.dateShort()).length
  m.bookings = s.appts.length
  m.returning = s.appts.filter(a => ['in_service', 'done', 'paid'].includes(a.status) && (s.customers.find(c => c.id === a.customerId)?.visits ?? 0) > 1).length
  const past = s.appts.filter(a => a.start <= s.now)
  m.due = past.length; m.shown = past.filter(a => a.status !== 'no_show' && !(a.status === 'booked' && s.now - a.start > 10)).length
  const w = s.appts.filter(a => a.waitMin != null); m.waitSum = w.reduce((t, a) => t + a.waitMin!, 0); m.waitN = w.length
  return m
}
const cache = new WeakMap<object, Map<string, Metrics>>()
function pastDay(s: State, d: Date): Metrics {
  let c = cache.get(s.customers); if (!c) { c = new Map(); cache.set(s.customers, c) }
  const hit = c.get(iso(d)); if (hit) return clone(hit)
  const m = pastDay0(s, d); c.set(iso(d), m); return clone(m)
}
const clone = (m: Metrics): Metrics => ({ ...m, bySource: { ...m.bySource }, byCat: { ...m.byCat } })
function pastDay0(s: State, d: Date): Metrics {
  const m = zero(), k = iso(d), wd = d.getDay(), weekend = wd === 0 || wd === 6
  const f = (0.72 + rnd(k + 'r') * 0.5) * (weekend ? 1.22 : 1)
  m.revenue = Math.round(D.HISTORY.month.now.revenue / 30 * f / 1e4) * 1e4
  const pk = 0.28 + rnd(k + 'p') * 0.14, pr = 0.06 + rnd(k + 'q') * 0.06
  m.pkgPart = Math.round(m.revenue * pk / 1e4) * 1e4; m.prodPart = Math.round(m.revenue * pr / 1e4) * 1e4; m.lePart = m.revenue - m.pkgPart - m.prodPart
  // nguồn khách: theo tỉ lệ nguồn của tệp khách thật trong app
  const srcN: Record<string, number> = {}; s.customers.forEach(c => (srcN[c.source] = (srcN[c.source] ?? 0) + 1 + rnd(k + c.source) * 0.6))
  const tot = Object.values(srcN).reduce((a, b) => a + b, 0) || 1
  if (!Object.keys(srcN).length) srcN['Khác'] = 1
  let left = m.revenue; const keys = Object.keys(srcN)
  keys.forEach((src, i) => { const v = i === keys.length - 1 ? left : Math.round(m.revenue * srcN[src] / tot / 1e4) * 1e4; m.bySource[src] = v; left -= v })
  m.guests = Math.round(17 * f); m.bookings = Math.round(m.guests * 1.08); m.due = m.bookings; m.shown = Math.round(m.bookings * (0.82 + rnd(k + 's') * 0.1))
  m.newCust = Math.round(2.4 * f + rnd(k + 'n')); m.returning = Math.max(0, m.guests - m.newCust)
  m.waitN = m.guests; m.waitSum = Math.round(m.guests * (7 + rnd(k + 'w') * 6))
  m.costProd = m.guests * PER_TOUR_COST; m.byCat['Vật tư dùng cho khách'] = m.costProd
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  // chi phí cố định trả một lần mỗi tháng vào ngày cố định (giống chứng từ thật) → so kỳ công bằng
  for (const c of FIXED_CATS) if (d.getDate() === Math.min(dim, FIXED_DAY[c])) { m.costFixed += FIXED_MONTH[c]; m.byCat[c] = FIXED_MONTH[c] }
  for (const c in OTHER_MONTH) { const v = Math.round(OTHER_MONTH[c] / dim * (0.6 + rnd(k + c) * 0.8)); m.costOther += v; m.byCat[c] = v }
  return m
}
const add = (a: Metrics, b: Metrics) => {
  for (const k of ['revenue', 'lePart', 'pkgPart', 'prodPart', 'costProd', 'costFixed', 'costOther', 'guests', 'newCust', 'returning', 'bookings', 'due', 'shown', 'waitSum', 'waitN'] as const) a[k] += b[k]
  for (const [x, v] of Object.entries(b.bySource)) a.bySource[x] = (a.bySource[x] ?? 0) + v
  for (const [x, v] of Object.entries(b.byCat)) a.byCat[x] = (a.byCat[x] ?? 0) + v
  return a
}
/** Chi tiêu lễ tân nhập trong app (tháng hiện tại) thay cho chi phí cố định mẫu của đúng hạng mục, tháng đó */
function applyRecordedExpenses(s: State, r: { from: Date; to: Date }, m: Metrics) {
  const t = today(), monthStart = new Date(t.getFullYear(), t.getMonth(), 1)
  const from = r.from > monthStart ? r.from : monthStart
  if (r.to < monthStart) return m
  const inRange = s.expenses.filter(e => { const d = parseVN(e.date); return d >= from && d <= r.to })
  // chỉ thay phần mẫu của hạng mục ĐÃ có chứng từ trong tháng hiện tại (chưa nhập → giữ số mẫu, không để 0)
  const recordedCats = new Set(s.expenses.filter(e => parseVN(e.date) >= monthStart).map(e => e.cat as string))
  // bỏ phần mẫu của các hạng mục đã có chứng từ thật trong tháng, cộng số thật
  for (let d = from; d <= r.to && d <= t; d = addDays(d, 1)) { if (+d === +t) continue
    const pm = pastDay(s, d)
    for (const c of recordedCats) { const v = pm.byCat[c] ?? 0; if (!v) continue; m.byCat[c] -= v; if ((FIXED_CATS as readonly string[]).includes(c)) m.costFixed -= v; else m.costOther -= v } }
  for (const e of inRange) { m.byCat[e.cat] = (m.byCat[e.cat] ?? 0) + e.amount; if ((FIXED_CATS as readonly string[]).includes(e.cat)) m.costFixed += e.amount; else m.costOther += e.amount }
  for (const c of Object.keys(m.byCat)) if (Math.abs(m.byCat[c]) < 1) delete m.byCat[c]
  return m
}
export function metrics(s: State, r: { from: Date; to: Date }): Metrics {
  const t = today(), m = zero()
  for (let d = startOf(r.from < MIN_DAY() ? MIN_DAY() : r.from); d <= r.to; d = addDays(d, 1)) { if (d > t) break; add(m, +d === +t ? todayReal(s) : pastDay(s, d)) }
  return applyRecordedExpenses(s, r, m)
}
export const cost = (m: Metrics) => m.costProd + m.costFixed + m.costOther
export const profit = (m: Metrics) => m.revenue - cost(m)
export const showRate = (m: Metrics): number | null => m.due ? Math.round(m.shown / m.due * 100) : null
export const waitAvg = (m: Metrics): number | null => m.waitN ? Math.round(m.waitSum / m.waitN) : null
/** mục tiêu theo số ngày của kỳ (mục tiêu tháng của CEO / 30 × số ngày) — số liệu mẫu */
export function targetFor(r: { from: Date; to: Date }) {
  const n = days(r.from, r.to), T = D.HISTORY.month.target
  return { revenue: Math.round(T.revenue / 30 * n / 1e5) * 1e5, newCust: Math.round(T.newCust / 30 * n), returning: Math.round(T.returning / 30 * n), bookings: Math.round(T.bookings / 30 * n), showRate: T.showRate, waitAvg: T.waitAvg }
}
/** Phần trăm đóng góp của hôm nay (dữ liệu thật) trong kỳ — để ghi chú trung thực */
export const hasPast = (r: { from: Date }) => r.from < today()

// ── Nhân sự theo kỳ ──
export type StaffM = { id: string; name: string; role: D.Role; tours: number; revenue: number; requested: number; points: number; late: number; leave: number; rating: number | null }
export function staffMetrics(s: State, r: { from: Date; to: Date }, role: 'ktv' | 'reception' = 'ktv'): StaffM[] {
  const t = today(), inv = okInv(s)
  return s.staff.filter(x => x.role === role).map(x => {
    const o: StaffM = { id: x.id, name: x.name, role: x.role, tours: 0, revenue: 0, requested: 0, points: 0, late: 0, leave: 0, rating: null }
    for (let d = startOf(r.from); d <= r.to && d <= t; d = addDays(d, 1)) {
      if (+d === +t) {
        const ap = s.appts.filter(a => a.ktvId === x.id && !['cancelled', 'no_show'].includes(a.status))
        o.tours += role === 'ktv' ? ap.length : inv.filter(i => i.creator === x.name).length
        o.requested += ap.filter(a => a.requested).length
        o.revenue += role === 'ktv' ? inv.reduce((a, i) => a + i.lines.filter(l => l.ktvId === x.id).reduce((b, l) => b + l.price - l.discount, 0), 0) : inv.filter(i => i.creator === x.name).reduce((a, i) => a + i.paid, 0)
        o.points += s.points.filter(p => p.staffId === x.id && p.status === 'Đã duyệt').reduce((a, p) => a + p.delta, 0)
        const at = s.attendance[x.id], st = x.shift ? D.SHIFTS[x.shift].start : null
        if (at?.in != null && st != null && at.in > st) o.late++ // cùng quy tắc màn Chấm công
        if (s.leaves.some(l => l.staffId === x.id && l.status === 'Đã duyệt' && l.kind === 'Nghỉ phép' && l.date === D.dateShort(d))) o.leave++
        continue
      }
      const sh = shareOf(s, d, role).get(x.id)
      if (!sh) { if (rnd(iso(d) + x.id + 'lv') < 0.12) o.leave++; continue } // ngày nghỉ trong tuần
      o.tours += sh.tours; o.revenue += sh.revenue; o.requested += sh.requested
      const k = iso(d) + x.id
      if (rnd(k + 'pt') < 0.12) o.points += rnd(k + 'ps') < 0.8 ? 2 : -1
      if (rnd(k + 'late') < 0.06 * (1.5 - sh.skill)) o.late++
    }
    const fb = s.feedback.filter(f => f.ktvId === x.id); o.rating = fb.length ? +(fb.reduce((a, f) => a + f.rating, 0) / fb.length).toFixed(1) : null
    return o
  })
}

/** Chia lượt khách & tiền dịch vụ của MỘT ngày đã qua cho nhân sự đi làm hôm đó → tổng theo người = tổng của Home */
function shareOf(s: State, d: Date, role: 'ktv' | 'reception') {
  const pd = pastDay(s, d), k0 = iso(d)
  const all = s.staff.filter(x => x.role === role).map(x => ({ x, skill: 0.75 + rnd(x.id) * 0.5 }))
  let ppl = all.filter(p => rnd(k0 + p.x.id + 'off') >= 1 / 7)
  if (!ppl.length) ppl = all.slice(0, 1) // luôn có người trực để tiền trong ngày có người nhận
  const out = new Map<string, { tours: number; revenue: number; requested: number; skill: number }>()
  if (!ppl.length) return out
  const w = ppl.map(p => p.skill * (0.7 + rnd(k0 + p.x.id + 'w') * 0.6)), W = w.reduce((a, b) => a + b, 0)
  const total = role === 'ktv' ? pd.guests : pd.guests, money = role === 'ktv' ? pd.revenue - pd.prodPart : pd.revenue
  let tl = total, ml = money
  ppl.forEach((p, i) => { const last = i === ppl.length - 1
    const t = last ? tl : Math.round(total * w[i] / W), m = last ? ml : Math.round(money * w[i] / W / 1e4) * 1e4
    tl -= t; ml -= m
    out.set(p.x.id, { tours: t, revenue: m, requested: role === 'ktv' ? Math.round(t * (0.15 + 0.25 * (p.skill - 0.75))) : 0, skill: p.skill }) })
  return out
}
