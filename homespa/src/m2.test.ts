import { describe, it, expect } from 'vitest'
import { aiCheck } from './logic'

const ticks = (n: number, total = 5) => Array.from({ length: total }, (_, i) => i < n)

describe('aiCheck (M2-11): AI kiểm tra giả lập', () => {
  it('thiếu ảnh → nhánh 0, không có trạng thái', () => {
    const r = aiCheck(ticks(5), '')
    expect(r.branch).toBe(0); expect(r.status).toBeUndefined()
  })
  it('0/5 và 2/5 (< 50%) → nhánh 1, Chưa đạt, lý do ghi AI (giả lập)', () => {
    for (const n of [0, 2]) {
      const r = aiCheck(ticks(n), 'blob:x')
      expect(r.branch).toBe(1); expect(r.status).toBe('Chưa đạt'); expect(r.reason).toMatch(/^AI \(giả lập\)/)
    }
  })
  it('3/5 và 4/5 (50% đến < 100%) → nhánh 3, Chờ kiểm tra', () => {
    for (const n of [3, 4]) { const r = aiCheck(ticks(n), 'blob:x'); expect(r.branch).toBe(3); expect(r.status).toBe('Chờ kiểm tra') }
  })
  it('5/5 → nhánh 2, Chờ kiểm tra, nhãn "AI: phù hợp (giả lập)"', () => {
    const r = aiCheck(ticks(5), 'blob:x')
    expect(r.branch).toBe(2); expect(r.status).toBe('Chờ kiểm tra'); expect(r.label).toBe('AI: phù hợp (giả lập)')
  })
  it('ngưỡng đúng 50% (1/2) thuộc nhánh 3; checklist rỗng → nhánh 1', () => {
    expect(aiCheck(ticks(1, 2), 'p').branch).toBe(3)
    expect(aiCheck([], 'p').branch).toBe(1)
  })
})
