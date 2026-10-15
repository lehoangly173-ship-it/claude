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
