import { describe, it, expect } from 'vitest'
import * as D from './data'
import { State, markReadIn, markUnreadIn, unreadCount, looksLikePhone, buyerSuggestions, validateReceive, canSeeBuyer, cleanDetail } from './logic'

const notif = (id: string, readBy: string[] = []): D.Notif => ({ id, cat: 'KTV', text: id, detail: '', min: 0, roles: ['ktv'], readBy })
const mini = (ns: D.Notif[]) => ({ notifs: ns })
const me = { id: 'mai', name: 'Mai' }

describe('U-M1-09 markRead / markUnread (theo từng người)', () => {
  it('markRead rồi markUnread đảo trạng thái và đổi số chưa đọc ±1', () => {
    const d = mini([notif('a'), notif('b')])
    expect(unreadCount(d, 'ktv', 'mai')).toBe(2)
    markReadIn(d, 'a', 'mai')
    expect(unreadCount(d, 'ktv', 'mai')).toBe(1)
    markUnreadIn(d, 'a', 'mai')
    expect(unreadCount(d, 'ktv', 'mai')).toBe(2)
  })
  it('không thêm trùng khi đọc 2 lần; không ảnh hưởng người khác', () => {
    const d = mini([notif('a', ['hien'])])
    markReadIn(d, 'a', 'mai'); markReadIn(d, 'a', 'mai')
    expect(d.notifs[0].readBy).toEqual(['hien', 'mai'])
    markUnreadIn(d, 'a', 'mai')
    expect(d.notifs[0].readBy).toEqual(['hien'])
  })
  it('id không tồn tại: không lỗi', () => {
    const d = mini([notif('a')])
    markReadIn(d, 'zzz', 'mai'); markUnreadIn(d, 'zzz', 'mai')
    expect(d.notifs[0].readBy).toEqual([])
  })
})

describe('Ô "Bán cho ai" (C4, M1-11a)', () => {
  it('nhận ra SĐT kể cả có khoảng trắng/chấm/gạch', () => {
    for (const v of ['0900 000 001', '0900000001', '0901234567', '0901.234.567', '+84 901 234 567', '090-123-4567', '0900,000,001', '(0900)000001']) expect(looksLikePhone(v), v).toBe(true)
    for (const v of ['Lan', '125', 'KH 125', 'Nguyễn Thị Lan']) expect(looksLikePhone(v), v).toBe(false)
  })
  const s = { customers: D.SEED_CUSTOMERS, appts: D.SEED_APPTS } as unknown as State
  it('nhập SĐT thì 0 gợi ý; gõ tên thì gợi ý theo tên không dấu', () => {
    expect(buyerSuggestions(s, me, '0901234567')).toEqual([])
    expect(buyerSuggestions(s, me, '0900 000 001')).toEqual([])
    expect(buyerSuggestions(s, me, '')).toEqual([])
    const all = buyerSuggestions({ ...s, appts: s.appts.map(a => ({ ...a, ktvId: 'mai', status: 'done' as const })) } as State, me, 'lan')
    expect(all.some(c => c.name.includes('Lan'))).toBe(true)
  })
  it('chỉ gợi ý khách thuộc tập của KTV (khách của KTV khác thì không)', () => {
    const none = { customers: D.SEED_CUSTOMERS, appts: [] } as unknown as State
    expect(buyerSuggestions(none, { id: 'nobody', name: 'Nobody' }, 'lan')).toEqual([])
  })
})

describe('validateReceive (M1-11)', () => {
  const ok = { photo: 'x.jpg', buyer: '', invoice: '' }
  it('bán cho khách thiếu người mua hoặc hóa đơn → lỗi', () => {
    expect(validateReceive({ ...ok, purpose: 'ban_khach' })).toMatch(/Bán cho ai/)
    expect(validateReceive({ ...ok, purpose: 'ban_khach', buyer: 'Lan' })).toMatch(/hóa đơn/)
    expect(validateReceive({ ...ok, purpose: 'ban_khach', buyer: 'Lan', invoice: 'blob:1' })).toBeNull()
  })
  it('SĐT bị chặn: "Không ghi SĐT"', () => {
    expect(validateReceive({ ...ok, purpose: 'ban_khach', buyer: '0900 000 001', invoice: 'blob:1' })).toBe('Không ghi SĐT')
  })
  it('dùng cho cơ sở không cần người mua/hóa đơn; chưa chọn mục đích hoặc thiếu ảnh → lỗi', () => {
    expect(validateReceive({ ...ok, purpose: 'dung_co_so' })).toBeNull()
    expect(validateReceive({ ...ok })).toMatch(/mục đích/)
    expect(validateReceive({ ...ok, purpose: 'dung_co_so', photo: '' })).toMatch(/ảnh/)
  })
})

describe('canSeeBuyer (M1-11b)', () => {
  const p = { ktvId: 'mai' }
  it('chỉ KTV tạo, Lễ tân, CEO', () => {
    expect(canSeeBuyer('ktv', 'mai', p)).toBe(true)
    expect(canSeeBuyer('reception', 'lam', p)).toBe(true)
    expect(canSeeBuyer('ceo', 'quyen', p)).toBe(true)
    expect(canSeeBuyer('ktv', 'hien', p)).toBe(false)
    expect(canSeeBuyer('leader', 'thao', p)).toBe(false)
  })
})

describe('cleanDetail (M1-08): số trên ô = số dòng', () => {
  const rep = (id: string, zone: number, staffId: string, status: D.CleanReport['status'], at = 100, points = 0): D.CleanReport => ({ id, zone, staffId, photo: 'p', checks: [], at, status, points })
  const s = { zoneOwner: { 2: 'mai', 5: 'phuong' }, cleanReports: [rep('1', 2, 'mai', 'Chờ kiểm tra'), rep('2', 5, 'phuong', 'Chưa đạt'), rep('3', 1, 'lam', 'Đạt', 100, 2)] } as unknown as State
  it('KTV chỉ thấy báo cáo của mình', () => {
    const d = cleanDetail(s, 'ktv', 'mai')
    expect(d.zones).toEqual([2]); expect(d.pending.length).toBe(1); expect(d.redo.length).toBe(0)
  })
  it('Lễ tân/Leader thấy tất cả; điểm = tổng điểm báo cáo của chính mình', () => {
    const d = cleanDetail(s, 'leader', 'thao')
    expect(d.pending.length).toBe(1); expect(d.redo.length).toBe(1); expect(d.points).toBe(0)
    expect(cleanDetail(s, 'reception', 'lam').points).toBe(2)
  })
})
