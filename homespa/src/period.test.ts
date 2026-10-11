import { describe, it, expect } from 'vitest'
import * as D from './data'
import type { State } from './logic'
import { periodRanges, lastRanges, metrics, cost, profit, staffMetrics, today, addDays, rangeOf, type Gran } from './period'

const S = () => ({ now: D.START_MIN, appts: D.SEED_APPTS, customers: D.SEED_CUSTOMERS, invoices: D.SEED_INVOICES, feedback: D.SEED_FEEDBACK, staff: D.STAFF,
  stockMoves: D.SEED_STOCK_MOVES, expenses: D.SEED_EXPENSES, points: [], attendance: {}, leaves: [] }) as unknown as State
const t = today()

describe('Kỳ thời gian', () => {
  it('tháng: từ ngày 1 đến hôm nay; kỳ trước cùng số ngày', () => {
    const { cur, prev } = periodRanges({ g: 'month' })
    expect(cur.from.getDate()).toBe(1); expect(+cur.to).toBe(+t); expect(cur.partial).toBe(true)
    const n = (r: { from: Date; to: Date }) => Math.round((+r.to - +r.from) / 864e5) + 1
    expect(n(prev)).toBe(Math.min(n(cur), new Date(prev.from.getFullYear(), prev.from.getMonth() + 1, 0).getDate()))
    expect(prev.from.getMonth()).toBe((cur.from.getMonth() + 11) % 12)
  })
  it('7 ngày cuốn chiếu đến hôm nay, so với 7 ngày liền trước; ngày = hôm nay; nhãn ghi rõ ngày', () => {
    const w = periodRanges({ g: 'week' }); expect(+w.cur.from).toBe(+addDays(t, -6)); expect(+w.cur.to).toBe(+t); expect(+w.prev.to).toBe(+addDays(t, -7)); expect(+w.prev.from).toBe(+addDays(t, -13))
    const d = periodRanges({ g: 'day' }); expect(+d.cur.from).toBe(+t); expect(+d.prev.from).toBe(+addDays(t, -1))
    expect(periodRanges({ g: 'quarter' }).cur.label).toMatch(/^\d{2}\/\d{2}\/\d{4} – \d{2}\/\d{2}\/\d{4}$/)
  })
  it('tùy chọn: đảo ngày nếu chọn ngược, không vượt hôm nay', () => {
    const a = D.dateShort(addDays(t, -3)).split('/').reverse().join('-'), b = D.dateShort(addDays(t, 5)).split('/').reverse().join('-')
    const { cur, prev } = periodRanges({ g: 'custom', from: b, to: a })
    expect(+cur.to).toBe(+t); expect(+cur.from).toBe(+addDays(t, -3)); expect(+prev.to).toBe(+addDays(t, -4))
  })
  it('xu hướng: kỳ cuối = kỳ đang chọn, các kỳ liền nhau không chồng', () => {
    for (const g of ['day', 'week', 'month', 'quarter', 'year'] as Gran[]) {
      const rs = lastRanges(g, 4); expect(+rs[3].from).toBe(+rangeOf(g as 'day', t).from)
      for (let i = 1; i < rs.length; i++) expect(+addDays(rs[i - 1].to, 1)).toBe(+rs[i].from)
    }
  })
})

describe('Một nguồn số liệu', () => {
  const s = S()
  it('tổng theo tháng = cộng từng ngày; ngày cố định luôn ra cùng số', () => {
    const r = rangeOf('month', addDays(t, -40))
    let sum = 0; for (let d = r.from; d <= r.to; d = addDays(d, 1)) sum += metrics(s, { from: d, to: d }).revenue
    expect(metrics(s, r).revenue).toBe(sum)
    expect(metrics(s, r).revenue).toBe(metrics(s, r).revenue)
  })
  it('tiền theo nguồn khách và theo nhóm cộng lại đúng tổng tiền thu; lợi nhuận = thu − chi', () => {
    for (const g of ['day', 'month', 'year'] as Gran[]) {
      const m = metrics(s, periodRanges({ g }).cur)
      expect(Object.values(m.bySource).reduce((a, b) => a + b, 0)).toBe(m.revenue)
      expect(m.lePart + m.pkgPart + m.prodPart).toBe(m.revenue)
      expect(Object.values(m.byCat).reduce((a, b) => a + b, 0)).toBeCloseTo(cost(m), -1)
      expect(profit(m)).toBe(m.revenue - cost(m))
    }
  })
  it('hôm nay = đúng hóa đơn thật trong app', () => {
    const paid = D.SEED_INVOICES.filter(i => i.status !== 'Nháp' && i.status !== 'Đã xóa').reduce((a, i) => a + i.paid, 0)
    const sold = D.SEED_STOCK_MOVES.filter(x => x.kind === 'Bán' && !x.status).reduce((a, x) => a + (x.price ?? 0) * x.qty, 0)
    expect(metrics(s, { from: t, to: t }).revenue).toBe(paid + sold)
  })
  it('ngày tương lai không có số (không bịa)', () => { expect(metrics(s, { from: addDays(t, 1), to: addDays(t, 30) }).revenue).toBe(0) })
  const at = (d: Date) => D.dateShort(d)
  it('chi tiêu lễ tân nhập trong tháng thay phần mẫu của đúng hạng mục đó', () => {
    const first = new Date(t.getFullYear(), t.getMonth(), 1)
    const s2 = { ...S(), expenses: [{ id: 'e', cat: 'Tiền mặt bằng', amount: 31000000, date: at(first), note: '', photo: '', by: 'lam', at: 0 }] } as unknown as State
    expect(metrics(s2, rangeOf('month', t)).byCat['Tiền mặt bằng']).toBe(31000000)
  })
  it('chứng từ tháng trước KHÔNG xóa chi phí mẫu tháng này (không để tiền nhà = 0)', () => {
    const prevMonth = new Date(t.getFullYear(), t.getMonth() - 1, 20)
    const s2 = { ...S(), expenses: [{ id: 'e', cat: 'Tiền mặt bằng', amount: 25000000, date: at(prevMonth), note: '', photo: '', by: 'lam', at: 0 }] } as unknown as State
    const r = rangeOf('month', t), m = metrics(s2, r)
    expect(m.byCat['Tiền mặt bằng'] ?? 0).toBe(t.getDate() > 2 ? 25000000 : 0)
  })
  it('tổng theo nhân sự = tổng của Home (ngày đã qua)', () => {
    const r = rangeOf('month', addDays(t, -40)), m = metrics(s, r)
    const k = staffMetrics(s, r, 'ktv'), rc = staffMetrics(s, r, 'reception')
    expect(k.reduce((a, x) => a + x.tours, 0)).toBe(m.guests)
    expect(k.reduce((a, x) => a + x.revenue, 0)).toBe(m.revenue - m.prodPart)
    expect(rc.reduce((a, x) => a + x.revenue, 0)).toBe(m.revenue)
  })
  it('tùy chọn quá xa bị giới hạn (không treo máy)', () => {
    const { cur } = periodRanges({ g: 'custom', from: '1900-01-01', to: '1900-02-01' })
    expect(cur.from.getFullYear()).toBeGreaterThanOrEqual(t.getFullYear() - 3)
    expect(lastRanges('custom', 0, { g: 'custom', from: '1900-01-01' }).length).toBeLessThanOrEqual(40)
  })
  it('nhân sự: mỗi KTV có số, hôm nay khớp lịch thật', () => {
    const l = staffMetrics(s, { from: t, to: t }, 'ktv'), mai = l.find(x => x.id === 'mai')!
    expect(mai.tours).toBe(D.SEED_APPTS.filter(a => a.ktvId === 'mai' && !['cancelled', 'no_show'].includes(a.status)).length)
    expect(staffMetrics(s, rangeOf('month', addDays(t, -40)), 'ktv').every(x => x.tours > 0)).toBe(true)
  })
})

describe('Chấm công thống nhất', () => {
  it('đi muộn hôm nay đếm giống màn Chấm công (vào sau giờ ca)', () => {
    const att = { hien: { in: 8 * 60 + 2 }, lan: { in: 7 * 60 + 50 } }
    const s = { ...S(), attendance: att } as unknown as State
    const l = staffMetrics(s, { from: t, to: t }, 'ktv')
    expect(l.find(x => x.id === 'hien')!.late).toBe(1); expect(l.find(x => x.id === 'lan')!.late).toBe(0)
  })
})
