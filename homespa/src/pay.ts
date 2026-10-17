// BẢNG CÀI ĐẶT LƯƠNG — một nguồn duy nhất cho mọi màn Thu nhập / Bảng lương / Tổng kết.
// CEO sửa ở ⑬ Cài đặt → 13.10. Ô CEO chưa nhập = null → màn hình ghi "Chưa đặt", KHÔNG tự đặt số, KHÔNG cộng vào tổng.
// Quy tắc (chị Quyên chốt 18/10):
//  • Tiền tour: giá theo thời lượng dịch vụ (45/60/90/120 phút khác nhau), CEO đặt. Chỉ tính tour đã làm xong.
//  • Lương, thưởng, phạt, tăng ca của mọi nhân sự (KTV, Lễ tân, Leader, Marketing): CEO đặt.
//  • Tăng ca: phút làm sau giờ hết ca (theo giờ chấm công ra). Người không có ca cố định: phút làm vượt số giờ chuẩn/ngày.
//    Chỉ tính ngày tăng ca từ ngưỡng tối thiểu trở lên. Tiền = số giờ tăng ca × đơn giá/giờ của vai trò.
//  • Đánh giá năng lực Leader: 8 tiêu chí, thang 1–10, CEO chấm theo tháng. Thưởng năng lực = điểm TB × đơn giá/điểm (CEO đặt).
import * as D from './data'
import { T } from './i18n'

export type PayRole = 'ktv' | 'reception' | 'leader' | 'marketing'
export const PAY_ROLES: PayRole[] = ['ktv', 'reception', 'leader', 'marketing']
export const isPayRole = (r: D.Role): r is PayRole => (PAY_ROLES as string[]).includes(r)
/** Vai trò có ca cố định (giờ hết ca lấy từ ca làm) — các vai trò khác dùng "giờ làm chuẩn/ngày" */
export const SHIFT_ROLES: PayRole[] = ['ktv', 'reception']

export type RolePay = {
  base: number | null       // lương cơ bản / tháng
  stdDays: number           // công chuẩn / tháng
  perPoint: number | null   // thưởng / 1 điểm uy tín
  perLate: number | null    // phạt / 1 lần đi muộn
  otPerHour: number | null  // tăng ca / giờ
  stdHours: number | null   // giờ làm chuẩn / ngày (chỉ vai trò không có ca cố định)
}
export type PayConfig = {
  roles: Record<PayRole, RolePay>
  tour: Record<string, number | null> // khóa = thời lượng dịch vụ (phút)
  otMinMin: number                    // tăng ca từ bao nhiêu phút trở lên mới tính
  evalPerPoint: number | null         // thưởng năng lực Leader / 1 điểm trung bình (thang 1–10)
  sample: boolean                     // true = số liệu mẫu của bản demo, CEO chưa lưu lần nào
  by?: string; at?: string
}
/** Các thời lượng tour đang bán (lấy từ danh mục dịch vụ — thêm dịch vụ mới là tự có dòng giá) */
export const TOUR_DURATIONS: number[] = [...new Set(D.SERVICES.map(x => x.duration))].sort((a, b) => a - b)
export const servicesOf = (dur: number) => D.SERVICES.filter(x => x.duration === dur).map(x => x.name)

const blank = (): RolePay => ({ base: null, stdDays: 26, perPoint: null, perLate: null, otPerHour: null, stdHours: null })
/** Mặc định: bản thật để trống hết (CEO nhập). Bản demo giữ số mẫu cũ cho KTV/Lễ tân (ghi "số liệu mẫu"); tour, tăng ca, Leader, Marketing để trống. */
export function defaultPay(demo: boolean): PayConfig {
  const roles = { ktv: blank(), reception: blank(), leader: blank(), marketing: blank() }
  if (demo) {
    roles.ktv = { ...roles.ktv, base: 6000000, perPoint: 20000, perLate: 50000 }
    roles.reception = { ...roles.reception, base: 6500000, perPoint: 20000, perLate: 50000 }
  }
  return { roles, tour: Object.fromEntries(TOUR_DURATIONS.map(d => [String(d), null])), otMinMin: 30, evalPerPoint: null, sample: demo }
}

const money = (v: number | null, max = 1e9) => v == null || (Number.isInteger(v) && v >= 0 && v <= max)
/** Kiểm tra trước khi lưu — trả câu báo lỗi dễ hiểu, hoặc null nếu hợp lệ */
export function payError(c: PayConfig): string | null {
  for (const r of PAY_ROLES) {
    const p = c.roles[r], n = D.ROLE_LABEL[r]
    if (!money(p.base, 500000000)) return T.pay.err.base(n)
    if (!Number.isInteger(p.stdDays) || p.stdDays < 1 || p.stdDays > 31) return T.pay.err.stdDays(n)
    if (!money(p.perPoint, 10000000)) return T.pay.err.perPoint(n)
    if (!money(p.perLate, 10000000)) return T.pay.err.perLate(n)
    if (!money(p.otPerHour, 10000000)) return T.pay.err.otPerHour(n)
    if (p.stdHours != null && (!Number.isFinite(p.stdHours) || p.stdHours < 1 || p.stdHours > 16)) return T.pay.err.stdHours(n)
  }
  for (const d of TOUR_DURATIONS) if (!money(c.tour[String(d)] ?? null, 10000000)) return T.pay.err.tour(d)
  if (!Number.isInteger(c.otMinMin) || c.otMinMin < 0 || c.otMinMin > 240) return T.pay.err.otMin
  if (!money(c.evalPerPoint, 100000000)) return T.pay.err.evalPer
  return null
}

/** Ngày làm việc tối thiểu cần để tính tăng ca (kiểu riêng, tránh import vòng với period.ts) */
export type OtDay = { worked: boolean; otRaw: number | null; workMin: number | null }
/** Số phút tăng ca được tính của MỘT ngày theo bảng cài đặt */
export function otOfDay(c: PayConfig, role: PayRole, d: OtDay): number {
  if (!d.worked) return 0
  let over: number | null = null
  if (SHIFT_ROLES.includes(role)) over = d.otRaw
  else { const h = c.roles[role].stdHours; over = h != null && d.workMin != null ? d.workMin - Math.round(h * 60) : null }
  return over != null && over > 0 && over >= c.otMinMin ? over : 0
}

export type TourLine = { dur: number; n: number; rate: number | null; pay: number | null }
export type Payslip = {
  role: PayRole; rp: RolePay
  base: number | null; byDays: number | null
  tour: TourLine[]; tourN: number; tourPay: number | null
  otMin: number; ot: number | null
  commission: number
  bonus: number | null; penalty: number | null
  evalAvg: number | null; evalBonus: number | null
  total: number
  /** Khoản có phát sinh nhưng CEO chưa đặt mức → không cộng vào tổng (ghi rõ cho người xem) */
  missing: string[]
}
type Base = { role: D.Role; days: number; points: number; late: number; tourBy: Record<number, number> }
const r1k = (n: number) => Math.round(n / 1000) * 1000

/** Phiếu lương của một người trong một kỳ. Mọi đơn giá lấy từ bảng cài đặt CEO. */
export function payslip(c: PayConfig, m: Base, o: { commission?: number; otMin?: number; evalAvg?: number | null } = {}): Payslip | null {
  if (!isPayRole(m.role)) return null
  const role = m.role, rp = c.roles[role], missing: string[] = []
  const days = Math.min(m.days, rp.stdDays)
  const byDays = rp.base == null ? null : r1k(rp.base * days / rp.stdDays)
  if (rp.base == null) missing.push(T.pay.miss.base)
  // tiền tour (KTV): theo thời lượng
  const tour: TourLine[] = role === 'ktv' ? TOUR_DURATIONS.map(dur => { const n = m.tourBy[dur] ?? 0, rate = c.tour[String(dur)] ?? null; return { dur, n, rate, pay: rate == null ? null : n * rate } }).filter(x => x.n > 0) : []
  const tourN = tour.reduce((t, x) => t + x.n, 0)
  const tourKnown = tour.filter(x => x.pay != null)
  for (const x of tour) if (x.pay == null) missing.push(T.pay.miss.tour(x.dur))
  const tourPay = role !== 'ktv' ? 0 : tourN === 0 ? 0 : tourKnown.length ? tourKnown.reduce((t, x) => t + x.pay!, 0) : null
  // tăng ca
  const otMin = o.otMin ?? 0
  const ot = otMin === 0 ? 0 : rp.otPerHour == null ? null : r1k(otMin / 60 * rp.otPerHour)
  if (otMin > 0 && rp.otPerHour == null) missing.push(T.pay.miss.ot)
  // thưởng điểm uy tín, phạt đi muộn
  const pts = Math.max(0, m.points)
  const bonus = pts === 0 ? 0 : rp.perPoint == null ? null : pts * rp.perPoint
  if (pts > 0 && rp.perPoint == null) missing.push(T.pay.miss.point)
  const penalty = m.late === 0 ? 0 : rp.perLate == null ? null : m.late * rp.perLate
  if (m.late > 0 && rp.perLate == null) missing.push(T.pay.miss.late)
  // thưởng năng lực (Leader)
  const evalAvg = role === 'leader' ? (o.evalAvg ?? null) : null
  const evalBonus = role !== 'leader' ? 0 : evalAvg == null || c.evalPerPoint == null ? null : r1k(evalAvg * c.evalPerPoint)
  if (role === 'leader' && evalAvg == null) missing.push(T.pay.miss.evalNone)
  else if (role === 'leader' && c.evalPerPoint == null) missing.push(T.pay.miss.evalRate)
  const commission = o.commission ?? 0
  const total = (byDays ?? 0) + (tourPay ?? 0) + (ot ?? 0) + commission + (bonus ?? 0) + (evalBonus ?? 0) - (penalty ?? 0)
  return { role, rp, base: rp.base, byDays, tour, tourN, tourPay, otMin, ot, commission, bonus, penalty, evalAvg, evalBonus, total, missing }
}

// ── Đánh giá năng lực Leader (thang 1–10, CEO chấm theo tháng) ──
export const EVAL_N = 8
export type LeaderEvalRec = { leaderId: string; ym: string; scores: (number | null)[]; by: string; at: string }
export const evalScoreOk = (v: number | null) => v == null || (Number.isInteger(v) && v >= 1 && v <= 10)
export function evalError(scores: (number | null)[]): string | null {
  if (scores.length !== EVAL_N) return T.pay.err.evalN
  if (!scores.every(evalScoreOk)) return T.pay.err.evalRange
  if (scores.every(v => v == null)) return T.pay.err.evalEmpty
  return null
}
/** Điểm trung bình các tiêu chí đã chấm (1 chữ số thập phân), null nếu chưa chấm */
export function evalAvg(rec: LeaderEvalRec | undefined): number | null {
  const v = (rec?.scores ?? []).filter((x): x is number => x != null)
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : null
}
export const ymOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
export const evalOf = (list: LeaderEvalRec[], leaderId: string, ym: string) => list.find(e => e.leaderId === leaderId && e.ym === ym)
