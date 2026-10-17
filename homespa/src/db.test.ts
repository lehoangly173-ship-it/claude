import { describe, it, expect } from 'vitest'
import { rowToCustomer, CustomerRow } from './db'

const base: CustomerRow = { id: 'c1', code: 'KL0101', name: 'Lan', grp: 'VN', source: 'Zalo', first_visit: '2026-10-01', visits: 3, last_visit: null, vip: false, birthday: null }
describe('rowToCustomer', () => {
  it('KTV không nhận SĐT/tiền → để trống, không bịa', () => {
    const c = rowToCustomer({ ...base, customer_contacts: null, customer_finance: null })
    expect(c.phone).toBe(''); expect(c.totalPaid).toBe(0); expect(c.packages).toEqual([])
  })
  it('đủ quyền: nhận SĐT, tiền (bigint dạng chuỗi), sức khỏe', () => {
    const c = rowToCustomer({ ...base, customer_contacts: { phone: '0905123456', address: 'Đà Nẵng' }, customer_finance: { total_paid: '1500000' }, customer_health: { health: 'Đau lưng', allergies: 'Tinh dầu quế', preference: 'Lực vừa' } })
    expect(c.phone).toBe('0905123456'); expect(c.totalPaid).toBe(1500000); expect(c.health).toBe('Đau lưng · Tinh dầu quế'); expect(c.preference).toBe('Lực vừa')
  })
  it('máy chủ trả mảng 1 phần tử cũng đọc được', () => {
    expect(rowToCustomer({ ...base, customer_contacts: [{ phone: '0905', address: null }] }).phone).toBe('0905')
  })
  it('ngày đầu tiên đúng dd/mm/yyyy', () => { expect(rowToCustomer(base).firstVisit).toBe('01/10/2026') })
})

import { rowToPackage, packageToRow, PackageRow } from './db'
describe('gói liệu trình', () => {
  const row: PackageRow = { card_code: 'LT-1', customer_id: 'c1', name: 'Gói 10 buổi', type: 'session', grp: 'Massage trị liệu', buy_date: '2026-09-01', expiry: '2027-03-01', final_price: '5000000', closer_ids: ['lam'], closer: 'Lâm', catalog_id: 'p10', renewal_of: null, sessions: 10, bonus: 1, used: 3, value: null, bonus_value: null, value_used: 0, payments: [], usage: [] }
  it('đọc: số buổi còn đúng, tiền bigint dạng chuỗi', () => {
    const p = rowToPackage(row); expect(p.finalPrice).toBe(5000000); expect(p.buyDate).toBe('01/09/2026'); expect(p.sessions).toBe(10); expect(p.used).toBe(3); expect(p.catalogId).toBe('p10')
  })
  it('ghi rồi đọc lại không mất gì', () => {
    const p = rowToPackage(row); const back = packageToRow('c1', p)
    expect(back.card_code).toBe('LT-1'); expect(back.buy_date).toBe('2026-09-01'); expect(back.expiry).toBe('2027-03-01'); expect(back.final_price).toBe(5000000); expect(back.closer_ids).toEqual(['lam'])
  })
})
