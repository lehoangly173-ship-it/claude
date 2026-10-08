import { describe, it, expect } from 'vitest'
import * as D from './data'
import { State, sortByBudget, customerSegments, ktvMatch, ktvCanOpen, closedSplit, filterByRange, dobNoYear, customersCsv, dayNum } from './logic'

const mai = { id: 'mai', name: 'Mai' }, hien = { id: 'hien', name: 'Hiền' }
const S = (customers = D.SEED_CUSTOMERS) => ({ customers, appts: D.SEED_APPTS, invoices: D.SEED_INVOICES, feedback: D.SEED_FEEDBACK }) as unknown as State
const ids = (l: { id: string }[]) => l.map(c => c.id)

/** Bẫy: đọc tiền (totalPaid, finalPrice, số tiền đã đóng) → ném lỗi */
const FORBIDDEN = new Set(['totalPaid', 'finalPrice', 'amount'])
const trap = <T extends object>(o: T): T => new Proxy(o, { get(t, k, r) { if (typeof k === 'string' && FORBIDDEN.has(k)) throw new Error('đọc ' + k); const v = Reflect.get(t, k, r); return Array.isArray(v) ? v.map(x => (x && typeof x === 'object' ? trap(x) : x)) : v && typeof v === 'object' ? trap(v) : v } })

describe('M4-04 sortByBudget', () => {
  const c = (id: string, budget: number | undefined, firstVisit: string) => ({ id, budget, firstVisit })
  it('ngân sách giảm dần; bằng nhau → firstVisit sớm hơn trước; không có → cuối', () => {
    const l = [c('x', undefined, '01/01/2020'), c('a', 500000, '01/01/2026'), c('b', 800000, '05/03/2026'), c('d', 800000, '04/03/2025'), c('e', 1200000, '01/06/2026')]
    expect(ids(sortByBudget(l))).toEqual(['e', 'd', 'b', 'a', 'x'])
  })
  it('không đổi mảng gốc', () => { const l = [c('a', 1, '01/01/2026'), c('b', 2, '01/01/2026')]; sortByBudget(l); expect(ids(l)).toEqual(['a', 'b']) })
})

describe('M4-08c tiền: KTV không đọc totalPaid/finalPrice/số tiền đã đóng', () => {
  it('customerSegments + sortByBudget chạy được khi đọc tiền bị chặn', () => {
    const s = S(D.SEED_CUSTOMERS.map(trap))
    for (const g of ['VN', 'NN'] as const) for (const k of ['le', 'lt'] as const) for (const file of [undefined, 1, 2, 3, 4, 5] as const)
      expect(() => customerSegments(s, mai, g, k, { file })).not.toThrow()
  })
  it('đổi totalPaid không đổi thứ tự', () => {
    const a = ids(customerSegments(S(), mai, 'VN', 'le'))
    const b = ids(customerSegments(S(D.SEED_CUSTOMERS.map((c, i) => ({ ...c, totalPaid: i * 7777777 }))), mai, 'VN', 'le'))
    expect(b).toEqual(a)
  })
})

describe('M4-09 customerSegments (khách lẻ, số liệu mẫu, KTV Mai)', () => {
  const s = S()
  it('tập G4 + sắp theo ngân sách', () => expect(ids(customerSegments(s, mai, 'VN', 'le'))).toEqual(['m4c', 'kl061', 'm4b', 'm4a']))
  it('số lần', () => {
    expect(ids(customerSegments(s, mai, 'VN', 'le', { visitsOp: 'once' }))).toEqual(['m4a'])
    expect(ids(customerSegments(s, mai, 'VN', 'le', { visitsOp: 'gte', visits: 3 }))).toEqual(['kl061', 'm4b'])
    expect(ids(customerSegments(s, mai, 'VN', 'le', { visitsOp: 'lte', visits: 2 }))).toEqual(['m4c', 'm4a'])
  })
  it('ngân sách (G5), nguồn, lâu chưa quay lại, tháng sinh, chưa hài lòng', () => {
    expect(customerSegments(s, mai, 'VN', 'le', { budgetMin: 800000 })).toHaveLength(3)
    expect(ids(customerSegments(s, mai, 'VN', 'le', { budgetMax: 600000 }))).toEqual(['m4a'])
    expect(ids(customerSegments(s, mai, 'VN', 'le', { source: 'Zalo' }))).toEqual(['m4b'])
    expect(ids(customerSegments(s, mai, 'VN', 'le', { awayDays: 60 }))).toEqual(['m4c', 'm4a'])
    expect(ids(customerSegments(s, mai, 'VN', 'le', { birthMonth: 11 }))).toEqual(['m4b'])
    expect(ids(customerSegments(s, mai, 'VN', 'le', { unhappy: true }))).toEqual(['m4a'])
  })
  it('M4-08a khách giới thiệu = referredBy ∩ G4 (khách của KTV khác không hiện)', () => {
    const r = ids(customerSegments(s, mai, 'VN', 'le', { referrerId: 'kl061' }))
    expect(r).toEqual(['m4b', 'm4a'])
    expect(r).not.toContain('m4j')
  })
  it('khách nước ngoài: Khách đã đi', () => {
    expect(ids(customerSegments(s, mai, 'NN', 'le'))).toEqual(['m4d', 'm4e'])
    expect(ids(customerSegments(s, mai, 'NN', 'le', { departed: true }))).toEqual(['m4d'])
    expect(ids(customerSegments(s, mai, 'NN', 'lt', { departed: true }))).toEqual(['m4h'])
  })
})

describe('M4-10 liệu trình: 5 tệp + tìm mã', () => {
  const s = S()
  const f = (file: 1 | 2 | 3 | 4 | 5, g: 'VN' | 'NN' = 'VN') => ids(customerSegments(s, mai, g, 'lt', { file }))
  it('5 tệp', () => {
    expect(f(1)).toEqual(['m4f'])
    expect(f(2).sort()).toEqual(['c125', 'm4g'])
    expect(f(3).sort()).toEqual(['c125', 'm4g'])
    expect(f(4, 'NN')).toEqual(['m4h'])
    expect(f(5)).toEqual(['m4i'])
  })
  it('lâu chưa quay lại áp cho tệp', () => expect(ids(customerSegments(s, mai, 'VN', 'lt', { file: 5, awayDays: 90 }))).toEqual([]))
  it('tìm mã không phân biệt hoa thường (cả mã thẻ)', () => {
    expect(ids(customerSegments(s, mai, 'VN', 'lt', { q: 'lt-0240' }))).toEqual(['m4f'])
    expect(ids(customerSegments(s, mai, 'VN', 'le', { q: 'kl0202' }))).toEqual(['m4b'])
  })
})

describe('M4-06a / M4-08 tìm và quyền của KTV', () => {
  const s = S()
  it('gõ SĐT (có/không khoảng trắng) → 0', () => {
    for (const q of ['0900 000 014', '0900000014', '0901234567', '+84 900 000 014']) {
      for (const k of ['le', 'lt'] as const) expect(customerSegments(s, mai, 'VN', k, { q }), q).toEqual([])
      expect(ktvMatch(D.SEED_CUSTOMERS.find(c => c.id === 'm4b')!, q)).toBe(false)
    }
  })
  it('tên/mã trong G4 có; ngoài G4 → 0', () => {
    expect(ids(customerSegments(s, mai, 'VN', 'le', { q: 'Khoa' }))).toEqual(['m4b'])
    expect(customerSegments(s, mai, 'VN', 'le', { q: 'Mạc' })).toEqual([])
    expect(customerSegments(s, mai, 'VN', 'le', { q: 'KL0210' })).toEqual([])
  })
  it('KTV A và B thấy tập khác nhau', () => {
    expect(ids(customerSegments(s, hien, 'VN', 'le'))).not.toEqual(ids(customerSegments(s, mai, 'VN', 'le')))
    expect(ids(customerSegments(s, { id: 'ngoc', name: 'Ngọc' }, 'VN', 'le'))).toEqual(['m4j'])
  })
  it('M4-08b mở hồ sơ: ngoài G4 và không có tour hôm nay → không', () => {
    expect(ktvCanOpen(s, hien, 'c305')).toBe(false)
    expect(ktvCanOpen(s, hien, 'c412')).toBe(true) // tour hôm nay
    expect(ktvCanOpen(s, mai, 'm4b')).toBe(true)
  })
})

describe('M4-02 / M4-03 Khách hàng của tôi', () => {
  const s = S()
  it('tôi chốt: khách lẻ vs tái tục', () => {
    const r = closedSplit(s, mai)
    expect(ids(r.renew)).toEqual(['m4g'])
    expect(ids(r.le).sort()).toEqual(['m4f', 'm4h', 'm4i'])
  })
  it('khoảng A→B: lọc; A > B báo lỗi và không lọc; trống → đầy đủ', () => {
    const base = s.customers.filter(c => c.care.some(x => x.by === 'Mai'))
    const iso = (n: number) => { const d = new Date(D.TODAY); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
    const r = filterByRange(s, mai, base, 'cared', iso(13), iso(0))
    expect(r.error).toBeNull()
    expect(ids(r.list).sort()).toEqual(['m4d', 'm4e', 'm4f', 'm4h'])
    const err = filterByRange(s, mai, base, 'cared', iso(0), iso(30))
    expect(err.error).toMatch(/không hợp lệ/)
    expect(err.list).toBe(base)
    expect(filterByRange(s, mai, base, 'cared', '', '').list).toBe(base)
    expect(dayNum('25/9/2026')).toBe(dayNum('2026-09-25'))
  })
})

describe('M4-08d / M4-07', () => {
  it('sinh nhật cho KTV không có năm', () => { expect(dobNoYear('14/03/1988')).toBe('14/03'); expect(dobNoYear(undefined)).toBeNull() })
  it('SĐT mẫu là số giả 0900 000 0xx (R8)', () => { for (const c of D.SEED_CUSTOMERS) if (c.phone) expect(c.phone).toMatch(/^0900 000 0\d\d$/) })
  it('CSV của CEO có SĐT', () => expect(customersCsv(D.SEED_CUSTOMERS.slice(0, 1))).toContain('0900 000 001'))
})
