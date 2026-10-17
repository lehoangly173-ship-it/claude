// Bảng cài đặt lương CEO (chị Quyên chốt 18/10): giá tour 45/60/90/120, lương – thưởng – phạt – tăng ca theo vai trò, điểm năng lực Leader 1–10
import { describe, it, expect } from 'vitest'
import * as D from './data'
import type { State } from './logic'
import { defaultPay, payError, payslip, otOfDay, evalError, evalAvg, TOUR_DURATIONS, type PayConfig } from './pay'
import { staffDays, staffMetrics, rangeOf, today } from './period'
import { normalizePay } from './db'

const S = (over: Partial<State> = {}) => ({ now: 19 * 60, appts: D.SEED_APPTS, customers: D.SEED_CUSTOMERS, invoices: D.SEED_INVOICES, feedback: D.SEED_FEEDBACK, staff: D.STAFF,
  stockMoves: D.SEED_STOCK_MOVES, expenses: D.SEED_EXPENSES, points: [], attendance: {}, leaves: [], ...over }) as unknown as State
const cfg = (f: (c: PayConfig) => void) => { const c = JSON.parse(JSON.stringify(defaultPay(false))) as PayConfig; f(c); return c }
const M = (o: Partial<{ role: D.Role; days: number; points: number; late: number; tourBy: Record<number, number> }> = {}) => ({ role: 'ktv' as D.Role, days: 26, points: 0, late: 0, tourBy: {}, ...o })

describe('Mặc định không tự đặt số', () => {
  it('bản thật: mọi đơn giá trống (Chưa đặt) → tổng 0, liệt kê khoản chưa đặt', () => {
    const c = defaultPay(false)
    expect(Object.values(c.tour).every(v => v == null)).toBe(true)
    for (const r of ['ktv', 'reception', 'leader', 'marketing'] as const) expect(c.roles[r].base).toBeNull()
    const p = payslip(c, M({ tourBy: { 60: 3 }, points: 2, late: 1 }), { otMin: 60 })!
    expect(p.total).toBe(0); expect(p.byDays).toBeNull(); expect(p.tourPay).toBeNull(); expect(p.ot).toBeNull()
    expect(p.missing).toEqual(expect.arrayContaining(['lương cơ bản', 'giá tour 60 phút', 'đơn giá tăng ca', 'thưởng/điểm uy tín', 'phạt/lần đi muộn']))
  })
  it('bản demo: giá tour, tăng ca, lương Leader/Marketing vẫn để trống', () => {
    const c = defaultPay(true)
    expect(Object.values(c.tour).every(v => v == null)).toBe(true); expect(c.roles.leader.base).toBeNull(); expect(c.roles.marketing.base).toBeNull(); expect(c.roles.ktv.otPerHour).toBeNull()
  })
  it('CEO không có bảng lương', () => { expect(payslip(defaultPay(true), M({ role: 'ceo' }))).toBeNull() })
})

describe('Tiền tour theo thời lượng (60/90/120 khác giá)', () => {
  const c = cfg(c => { c.tour['45'] = 30000; c.tour['60'] = 40000; c.tour['90'] = 60000; c.tour['120'] = 80000 })
  it('cộng đúng từng loại tour', () => {
    const p = payslip(c, M({ tourBy: { 45: 2, 60: 5, 90: 3, 120: 1 } }))!
    expect(p.tourPay).toBe(2 * 30000 + 5 * 40000 + 3 * 60000 + 80000); expect(p.tourN).toBe(11)
    expect(p.tour.map(x => x.dur)).toEqual([45, 60, 90, 120])
  })
  it('thiếu giá một loại: cộng phần đã có giá, ghi rõ loại thiếu', () => {
    const p = payslip(cfg(c => { c.tour['60'] = 40000 }), M({ tourBy: { 60: 2, 90: 1 } }))!
    expect(p.tourPay).toBe(80000); expect(p.missing).toEqual(['lương cơ bản', 'giá tour 90 phút'])
  })
  it('chỉ KTV có tiền tour', () => { expect(payslip(c, M({ role: 'reception', tourBy: { 60: 4 } }))!.tourPay).toBe(0) })
  it('có đủ dòng giá cho mọi thời lượng dịch vụ đang bán', () => { expect(TOUR_DURATIONS).toEqual([45, 60, 90, 120]) })
})

describe('Tăng ca (mọi nhân sự)', () => {
  const c = cfg(c => { c.otMinMin = 30; c.roles.ktv.otPerHour = 30000; c.roles.leader.otPerHour = 50000; c.roles.leader.stdHours = 9 })
  it('KTV/Lễ tân: theo giờ hết ca; dưới ngưỡng không tính', () => {
    expect(otOfDay(c, 'ktv', { worked: true, otRaw: 25, workMin: 0 })).toBe(0)
    expect(otOfDay(c, 'ktv', { worked: true, otRaw: 45, workMin: 0 })).toBe(45)
    expect(otOfDay(c, 'ktv', { worked: true, otRaw: -10, workMin: 0 })).toBe(0)
    expect(otOfDay(c, 'ktv', { worked: false, otRaw: 90, workMin: 0 })).toBe(0)
  })
  it('Leader (không có ca): theo giờ làm chuẩn/ngày; chưa đặt giờ chuẩn → không tính', () => {
    expect(otOfDay(c, 'leader', { worked: true, otRaw: null, workMin: 9 * 60 + 40 })).toBe(40)
    expect(otOfDay(c, 'marketing', { worked: true, otRaw: null, workMin: 12 * 60 })).toBe(0)
  })
  it('tiền = giờ × đơn giá vai trò (làm tròn nghìn)', () => {
    expect(payslip(c, M(), { otMin: 90 })!.ot).toBe(45000)
    expect(payslip(c, M({ role: 'leader' }), { otMin: 40 })!.ot).toBe(33000)
  })
  it('ngày hôm nay: chấm công ra sau giờ hết ca → có phút tăng ca', () => {
    const d = staffDays(S({ attendance: { mai: { in: 8 * 60, out: 19 * 60 + 10 } } }), { from: today(), to: today() }, 'mai', 'ktv')[0]
    expect(d.otRaw).toBe(70); expect(d.workMin).toBe(11 * 60 + 10); expect(otOfDay(c, 'ktv', d)).toBe(70)
  })
})

describe('Lương Leader / Marketing + điểm năng lực 1–10', () => {
  const c = cfg(c => { c.roles.leader.base = 12000000; c.roles.leader.stdDays = 26; c.evalPerPoint = 100000 })
  it('thưởng năng lực = điểm TB × đơn giá; chưa chấm → không cộng, ghi rõ', () => {
    const p = payslip(c, M({ role: 'leader', days: 26 }), { evalAvg: 8.5 })!
    expect(p.byDays).toBe(12000000); expect(p.evalBonus).toBe(850000); expect(p.total).toBe(12850000)
    const q = payslip(c, M({ role: 'leader', days: 26 }))!
    expect(q.evalBonus).toBeNull(); expect(q.missing[0]).toMatch(/CEO chưa chấm/)
  })
  it('điểm hợp lệ: 8 tiêu chí, số nguyên 1–10, ít nhất 1 tiêu chí', () => {
    expect(evalError([8, 9, 7, null, 10, 6, 5, 8])).toBeNull()
    expect(evalError([11, 9, 7, 8, 10, 6, 5, 8])).toMatch(/1 đến 10/)
    expect(evalError([0, 9, 7, 8, 10, 6, 5, 8])).toMatch(/1 đến 10/)
    expect(evalError([7.5, 9, 7, 8, 10, 6, 5, 8])).toMatch(/1 đến 10/)
    expect(evalError(Array(8).fill(null))).toMatch(/Chưa chấm/)
    expect(evalError([8, 9])).toMatch(/8 tiêu chí/)
    expect(evalAvg({ leaderId: 'thao', ym: '2026-10', scores: [8, 9, null, null, null, null, null, 7], by: '', at: '' })).toBe(8)
  })
  it('Leader/Marketing có ngày công theo kỳ (một nguồn với staffMetrics)', () => {
    const s = S(), r = rangeOf('month', today())
    for (const role of ['leader', 'marketing'] as const) { const x = D.STAFF.find(y => y.role === role)!
      const days = staffDays(s, r, x.id, role), m = staffMetrics(s, r, role).find(y => y.id === x.id)!
      expect(days.filter(d => d.worked).length).toBe(m.days) }
  })
})

describe('Kiểm tra trước khi lưu + dữ liệu máy chủ', () => {
  it('chặn số âm, số lẻ, công chuẩn sai, giờ chuẩn sai', () => {
    expect(payError(defaultPay(true))).toBeNull()
    expect(payError(cfg(c => { c.roles.ktv.base = -1 }))).toMatch(/lương cơ bản/)
    expect(payError(cfg(c => { c.roles.ktv.stdDays = 0 }))).toMatch(/công chuẩn/)
    expect(payError(cfg(c => { c.roles.leader.stdHours = 30 }))).toMatch(/giờ làm chuẩn/)
    expect(payError(cfg(c => { c.roles.leader.stdHours = NaN }))).toMatch(/giờ làm chuẩn/)
    expect(payError(cfg(c => { c.tour['90'] = 1.5 }))).toMatch(/tour 90/)
    expect(payError(cfg(c => { c.otMinMin = 300 }))).toMatch(/Ngưỡng/)
  })
  it('máy chủ chỉ trả phần vai trò mình → các vai trò khác Chưa đặt; dữ liệu lạ → bỏ qua', () => {
    const c = normalizePay({ roles: { ktv: { base: 7000000, stdDays: 26, otPerHour: 25000 } }, tour: { 60: 45000, 90: 'x' }, otMinMin: 15 })
    expect(c.roles.ktv.base).toBe(7000000); expect(c.roles.ktv.perPoint).toBeNull(); expect(c.roles.leader.base).toBeNull()
    expect(c.tour['60']).toBe(45000); expect(c.tour['90']).toBeNull(); expect(c.otMinMin).toBe(15); expect(c.sample).toBe(false)
    expect(normalizePay(null).roles.ktv.base).toBeNull()
    expect(normalizePay({ roles: { ktv: { stdDays: 0 } } }).roles.ktv.stdDays).toBe(26) // máy chủ trả sai → không chia cho 0
  })
})

import { debtSummary } from './logic'
describe('④ Công nợ: chọn ngày bắt đầu – kết thúc (theo ngày mua gói)', () => {
  it('lọc đúng gói mua trong khoảng; không chọn = tất cả', () => {
    const s = S(), all = debtSummary(s)
    const buys = s.customers.flatMap(c => c.packages.map(p => p.buyDate)).map(v => { const [d, m, y] = v.split('/').map(Number); return new Date(y, m - 1, d) }).sort((a, b) => +a - +b)
    const mid = buys[Math.floor(buys.length / 2)]
    const a = debtSummary(s, { from: buys[0], to: mid }), b = debtSummary(s, { from: new Date(+mid + 864e5), to: buys[buys.length - 1] })
    expect(a.left.length + b.left.length).toBe(all.left.length)
    expect(a.sessionsOwed + b.sessionsOwed).toBe(all.sessionsOwed)
    expect(debtSummary(s, { from: new Date(2000, 0, 1), to: new Date(2000, 0, 2) }).left).toHaveLength(0)
  })
})
