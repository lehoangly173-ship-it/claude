// Fix lần 4: lưu trú Đà Nẵng · hoa hồng sale gói · bảng lương theo ngày · hiệu suất theo tháng · doanh thu thực tế · trang nút cháu
import { describe, it, expect } from 'vitest'
import * as D from './data'
import type { State } from './logic'
import { stayState, stayError, canContact, commissionsOf, careGroup, usedPkgValue } from './logic'
import { staffDays, staffMetrics, payslip, rangeOf, today } from './period'
import { cell } from './tree'

const day = (n: number) => { const d = new Date(D.TODAY); d.setDate(d.getDate() + n); return D.dateShort(d) }
const S = (over: Partial<State> = {}) => ({ now: D.START_MIN, appts: D.SEED_APPTS, customers: D.SEED_CUSTOMERS, invoices: D.SEED_INVOICES, feedback: D.SEED_FEEDBACK, staff: D.STAFF,
  stockMoves: D.SEED_STOCK_MOVES, expenses: D.SEED_EXPENSES, points: [], attendance: { mai: { in: 8 * 60 + 12 } }, leaves: [], ...over }) as unknown as State

describe('Lưu trú tại Đà Nẵng', () => {
  it('đang ở / đã rời / chưa tới / chưa nhập', () => {
    expect(stayState({ stayFrom: day(-3), stayTo: day(2) })).toBe('in')
    expect(stayState({ stayFrom: day(-9), stayTo: day(-1) })).toBe('left')
    expect(stayState({ stayFrom: day(2), stayTo: day(5) })).toBe('soon')
    expect(stayState({})).toBe(null)
    expect(stayState({ stayTo: day(0) })).toBe('in') // ngày rời là hôm nay vẫn còn ở
  })
  it('kiểm tra ngày: rời trước ngày đến → lỗi; sai định dạng → lỗi', () => {
    expect(stayError(day(3), day(1))).toMatch(/sau ngày đến/)
    expect(stayError('32/13/2026', '')).toMatch(/không hợp lệ/)
    expect(stayError('2026-10-01', '2026-10-05')).toBeNull()
  })
  it('khách đã rời Đà Nẵng: không liên hệ CSKH và bị loại khỏi mọi tệp khách', () => {
    const left = { ...D.SEED_CUSTOMERS.find(c => c.group === 'NN' && !c.packages.length)!, stayFrom: day(-10), stayTo: day(-1) }
    const here = { ...left, id: 'x2', stayFrom: day(-1), stayTo: day(3) }
    expect(canContact(left)).toBe(false); expect(canContact(here)).toBe(true)
    const s = { customers: [left, here] }
    expect(careGroup(s, 'Khách nước ngoài lẻ đang cư trú tại Đà Nẵng').map(c => c.id)).toEqual(['x2'])
    expect(careGroup(s, 'Khách lâu chưa quay lại (tệp 1–5)').some(c => c.id === left.id)).toBe(false)
  })
})

describe('Hoa hồng sale gói (lễ tân nhập)', () => {
  const pkg = (code: string, date: string, coms: D.PkgCommission[]): D.Package => ({ cardCode: code, catalogId: 'p10', name: 'Gói 10', type: 'session', group: 'Massage trị liệu', buyDate: date, expiry: day(180), finalPrice: 3500000, closer: 'mai', closerIds: ['mai'], sessions: 10, bonus: 1, used: 0, payments: [], usage: [], commissions: coms })
  const c = { ...D.SEED_CUSTOMERS[0], packages: [pkg('A', day(0), [{ staffId: 'mai', role: 'Chốt chính', amount: 200000, date: day(0), at: '', by: 'Lam' }, { staffId: 'lan', role: 'Hỗ trợ', amount: 50000, date: day(0), at: '', by: 'Lam' }]), pkg('B', day(-40), [{ staffId: 'mai', role: 'Chốt chính', amount: 150000, date: day(-40), at: '', by: 'Lam' }])] }
  it('lọc đúng người và đúng tháng', () => {
    const m = rangeOf('month', today())
    expect(commissionsOf({ customers: [c] }, 'mai', m).reduce((t, e) => t + e.x.amount, 0)).toBe(200000)
    expect(commissionsOf({ customers: [c] }, 'mai').length).toBe(2)
    expect(commissionsOf({ customers: [c] }, 'lan', m)[0].x.role).toBe('Hỗ trợ')
  })
  it('bảng lương: bỏ hoa hồng % doanh thu, cộng hoa hồng sale gói, tiền tour Chưa nối (không cộng)', () => {
    const sm = { id: 'mai', name: 'Mai', role: 'ktv' as const, days: 13, tours: 40, revenue: 15e6, requested: 3, points: 3, late: 1, leave: 0, rating: null }
    const p = payslip(sm, 200000)
    expect(p.commission).toBe(200000); expect(p.tourPay).toBeNull()
    expect(p.total).toBe(p.byDays + 200000 + p.bonus - p.penalty)
    expect(payslip(sm).total).toBe(p.total - 200000)
  })
})

describe('Bảng lương theo từng ngày = một nguồn với tổng tháng', () => {
  it('cộng các ngày ra đúng số công, nghỉ, trễ, tour của staffMetrics', () => {
    const s = S(), r = rangeOf('month', today())
    for (const x of D.STAFF.filter(y => y.role === 'ktv')) {
      const days = staffDays(s, r, x.id, 'ktv'), m = staffMetrics(s, r, 'ktv').find(y => y.id === x.id)!
      expect(days.filter(d => d.worked).length).toBe(m.days); expect(days.filter(d => d.leave).length).toBe(m.leave)
      expect(days.filter(d => d.late).length).toBe(m.late); expect(days.reduce((t, d) => t + d.tours, 0)).toBe(m.tours)
      expect(days.every(d => d.d <= today())).toBe(true)
    }
  })
  it('hôm nay là dữ liệu thật (chấm công trễ → có số phút trễ)', () => {
    const d = staffDays(S(), { from: today(), to: today() }, 'mai', 'ktv')[0]
    expect(d.real).toBe(true); expect(d.worked).toBe(true); expect(d.late).toBe(true); expect(d.lateMin).toBe(12)
  })
})

describe('Doanh thu thực tế từ gói', () => {
  it('giá trị buổi đã làm = giá bán ÷ tổng buổi (kể cả tặng), chỉ tính trong kỳ', () => {
    const p: D.Package = { cardCode: 'Z', catalogId: 'p10', name: 'x', type: 'session', group: 'Massage trị liệu', buyDate: day(-5), expiry: day(100), finalPrice: 3300000, closer: 'mai', sessions: 10, bonus: 1, used: 2, payments: [],
      usage: [{ at: `${day(0)} · 10:00`, service: 'M', ktv: 'Mai', deducted: '1 buổi', before: '', after: '', invoice: '' }, { at: `${day(-40)} · 10:00`, service: 'M', ktv: 'Mai', deducted: '1 buổi', before: '', after: '', invoice: '' }] }
    const r = usedPkgValue({ customers: [{ ...D.SEED_CUSTOMERS[0], packages: [p] }] }, { from: today(), to: today() })
    expect(r).toEqual({ value: 300000, sessions: 1 })
  })
})

describe('Trang nút cháu không lặp số / không ghép nhầm cột', () => {
  const e = { l: 'X', v: 7, rev: 0, cost: 0, owner: 'Thảo', ch: '', note: '' }
  it('cột trạng thái "Chờ duyệt" không hiện tên người', () => { expect(cell('Chờ duyệt', e).v).not.toBe('Thảo'); expect(cell('Người phụ trách', e).v).toBe('Thảo') })
  it('chỉ một cột lạ được nhận số đếm chính, cột lạ sau → Chưa nối', () => { expect(cell('Số lượng', e, true).v).toBe('7'); expect(cell('Số lượng khác', e, false).v).toBe('Chưa nối') })
  it('số đếm theo trạng thái việc khớp đúng tên cột', () => {
    const t = { ...e, cnt: { 'chưa làm': 2, 'đang làm': 1, 'quá hạn': 0, 'hoàn thành': 4 } }
    expect(cell('Chưa làm', t).v).toBe('2'); expect(cell('Đang làm', t).v).toBe('1'); expect(cell('Hoàn thành', t).v).toBe('4'); expect(cell('Cột lạ', t, true).v).toBe('Chưa nối')
  })
})

import { monthPair } from './screens/fix4'
import { metrics } from './period'
describe('Sau rà soát Fix lần 4', () => {
  it('so với tháng trước: ngày 31 → tháng trước cắt ở ngày cuối tháng (không tràn sang tháng sau)', () => {
    const keep = +D.TODAY
    try { D.TODAY.setTime(+new Date(2026, 2, 31)); const { cur, prev } = monthPair()
      expect(cur.from.getDate()).toBe(1); expect(prev.from.getMonth()).toBe(1); expect(prev.to.getMonth()).toBe(1); expect(prev.to.getDate()).toBe(28)
    } finally { D.TODAY.setTime(keep) }
  })
  it('hóa đơn vừa dịch vụ lẻ vừa bán gói: tách đúng tiền lẻ và tiền gói', () => {
    const inv: D.Invoice = { code: 'HDX', customerId: D.SEED_CUSTOMERS[0].id, status: 'Đã thu đủ', lines: [{ serviceId: 'm60', ktvId: 'mai', price: 350000, discount: 0 }], total: 3850000, paid: 3850000, payments: [{ method: 'Tiền mặt', amount: 3850000 }], pkgSale: { cardCode: 'Q1', name: 'Gói', price: 3500000, mode: 'new' }, pkgCollect: 3500000, createdAt: '', createdMin: 600, creator: 'Lam', log: [] }
    const m = metrics(S({ invoices: [inv], stockMoves: [] } as Partial<State>), { from: today(), to: today() })
    expect(m.pkgPart).toBe(3500000); expect(m.lePart).toBe(350000); expect(m.revenue).toBe(3850000)
  })
})
