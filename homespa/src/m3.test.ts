import { describe, it, expect } from 'vitest'
import { mySuggestions, inboxSuggestions, suggestionError, isoToday, isoToVi } from './logic'
import type { Suggestion, Role } from './data'
import { T } from './i18n'

const sg = (id: string, staffId: string, kind: Suggestion['kind']): Suggestion => ({ id, staffId, kind, text: `${id}-text`, date: '2026-10-01', createdAt: 600, status: 'Đã gửi' })
const s = { suggestions: [sg('a1', 'hien', 1), sg('a2', 'hien', 2), sg('b3', 'lan', 3), sg('b4', 'lan', 4), sg('b2', 'lan', 2)] }

describe('m3 góp ý: 4 loại', () => {
  it('M3-01 đúng 4 loại theo thứ tự', () => {
    expect(T.idea.kinds).toEqual(['Ý kiến về cơ sở vật chất', 'Nhân sự / cấp trên', 'Khách hàng – dịch vụ', 'Ý kiến khác'])
  })
})

describe('suggestionError (M3-02/03)', () => {
  const today = '2026-10-09'
  it('hợp lệ với nội dung + ngày hôm nay hoặc quá khứ', () => {
    expect(suggestionError(1, 'abc', today, today)).toBeNull()
    expect(suggestionError(4, ' x ', '2026-01-01', today)).toBeNull()
  })
  it('khóa khi nội dung rỗng sau trim', () => {
    expect(suggestionError(1, '', today, today)).not.toBeNull()
    expect(suggestionError(2, '   \n ', today, today)).not.toBeNull()
  })
  it('khóa khi ngày rỗng hoặc sai dạng', () => {
    expect(suggestionError(1, 'abc', '', today)).not.toBeNull()
    expect(suggestionError(1, 'abc', '09/10/2026', today)).not.toBeNull()
  })
  it('không cho ngày tương lai', () => {
    expect(suggestionError(3, 'abc', '2026-10-10', today)).toBe(T.idea.errFuture)
  })
  it('loại ngoài 1–4 bị chặn', () => {
    expect(suggestionError(0, 'abc', today, today)).not.toBeNull()
    expect(suggestionError(5, 'abc', today, today)).not.toBeNull()
  })
  it('isoToday dạng yyyy-mm-dd, isoToVi đổi sang dd/mm/yyyy', () => {
    expect(isoToday(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(isoToVi('2026-01-05')).toBe('05/01/2026')
  })
})

describe('mySuggestions (M3-04/05): KTV chỉ thấy của mình', () => {
  it('chỉ trả ý kiến của người gửi, kể cả loại 2', () => {
    expect(mySuggestions(s, 'hien').map(x => x.id)).toEqual(['a1', 'a2'])
    expect(mySuggestions(s, 'lan').every(x => x.staffId === 'lan')).toBe(true)
    expect(mySuggestions(s, 'mai')).toEqual([])
  })
})

describe('inboxSuggestions (M3-05/05a/06): lọc theo vai trò ở dữ liệu', () => {
  it('CEO thấy tất cả, kể cả loại 2', () => {
    expect(inboxSuggestions(s, 'ceo').length).toBe(5)
  })
  it('Leader không thấy loại 2; số đếm = số loại 1/3/4', () => {
    const l = inboxSuggestions(s, 'leader')
    expect(l.some(x => x.kind === 2)).toBe(false)
    expect(l.length).toBe(s.suggestions.filter(x => x.kind !== 2).length)
  })
  it('KTV, Lễ tân, Marketing: không có danh sách phía nhận', () => {
    for (const r of ['ktv', 'reception', 'marketing'] as Role[]) expect(inboxSuggestions(s, r)).toEqual([])
  })
})
