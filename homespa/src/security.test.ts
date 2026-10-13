import { describe, it, expect } from 'vitest'
import { phoneMatch, canSeePhone } from './logic'
import * as D from './data'

describe('Bảo mật phía app (lớp 2 — lớp chính là RLS ở máy chủ)', () => {
  it('tìm theo SĐT: chỉ Lễ tân/CEO, khớp đủ số', () => {
    expect(phoneMatch('reception', '0905 123 456', '0905.123.456')).toBe(true)
    expect(phoneMatch('ceo', '0905 123 456', '0905123456')).toBe(true)
    expect(phoneMatch('reception', '0905 123 456', '0905')).toBe(false)
    for (const r of ['leader', 'marketing', 'ktv'] as D.Role[]) { expect(phoneMatch(r, '0905 123 456', '0905123456')).toBe(false); expect(canSeePhone(r)).toBe(false) }
  })
  it('bản build không cấu hình máy chủ = DEMO; có cấu hình = tắt DEMO', () => {
    expect(D.DEMO).toBe(!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY))
  })
})
