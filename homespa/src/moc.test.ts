import { describe, it, expect } from 'vitest'
import * as D from './data'
import type { State } from './logic'
import { buildMocContext } from './mocContext'
import { sanitizeContext, parseAnswer, scrub, FORBIDDEN_KEY, SECTIONS } from '../supabase/functions/_shared/moc-policy'
import { handle } from '../supabase/functions/moc/handler'

const S = () => ({ now: D.START_MIN, appts: D.SEED_APPTS, customers: D.SEED_CUSTOMERS, invoices: D.SEED_INVOICES, feedback: D.SEED_FEEDBACK, staff: D.STAFF,
  stockMoves: D.SEED_STOCK_MOVES, expenses: D.SEED_EXPENSES, points: [], attendance: { mai: { in: 8 * 60 + 5 } }, leaves: [], queue: [], cleaning: {}, cleanReports: [], tasks: D.SEED_TASKS,
  zoneOwner: { ...D.SEED_ZONE_OWNER }, programs: D.SEED_PROGRAMS, approvals: D.SEED_APPROVALS }) as unknown as State
const ROLES: D.Role[] = ['ktv', 'reception', 'leader', 'marketing', 'ceo']
const keysDeep = (v: unknown, out: string[] = []): string[] => { if (Array.isArray(v)) v.forEach(x => keysDeep(x, out)); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { out.push(k); keysDeep(x, out) } return out }

describe('Mộc: dữ liệu gửi cho AI', () => {
  for (const role of ROLES) it(`${role}: không có SĐT, địa chỉ, sức khỏe, tiền; chỉ phần đúng vai trò`, () => {
    const me = D.STAFF.find(x => x.role === role)!
    const ctx = buildMocContext(S(), me, role), j = JSON.stringify(ctx)
    for (const c of D.SEED_CUSTOMERS) {
      if (c.phone) expect(j).not.toContain(c.phone)
      if (c.health) expect(j).not.toContain(c.health)
      if (c.address) expect(j).not.toContain(c.address)
      expect(j).not.toContain(c.name) // tên khách không gửi đi, chỉ mã khách
    }
    expect(keysDeep(ctx).filter(k => FORBIDDEN_KEY.test(k))).toEqual([])
    expect(j).not.toMatch(/\d{1,3}(\.\d{3})+\s*đ/)
    const allowed = new Set(['me', 'today', 'now', 'services', 'docs', 'role', ...SECTIONS[role]])
    expect(Object.keys(ctx).filter(k => !allowed.has(k))).toEqual([])
    expect(ctx.docs).toBeTruthy()
  })
  it('KTV chỉ có ngày làm của mình, không có số liệu toàn Home', () => {
    const ctx = buildMocContext(S(), D.STAFF.find(x => x.id === 'mai')!, 'ktv')
    expect(ctx).not.toHaveProperty('ops'); expect(ctx).not.toHaveProperty('team'); expect(ctx).not.toHaveProperty('segments'); expect(ctx).toHaveProperty('myDay')
  })
  it('máy chủ lọc lại: trường tiền/SĐT bị nhét vào vẫn bị bỏ, chữ có SĐT/tiền bị che', () => {
    const c = sanitizeContext({ ops: { revenue: 9e6, phone: '0905123456', note: 'gọi 0905 123 456, thu 1.500.000đ, nợ 2tr' }, programs: [{ name: 'A', cost: 5 }], me: { name: 'Mai' } }, 'ceo')
    const j = JSON.stringify(c)
    expect(j).not.toContain('revenue'); expect(j).not.toContain('0905'); expect(j).not.toContain('1.500.000'); expect(j).not.toMatch(/2tr/); expect(j).not.toContain('cost')
    expect(sanitizeContext({ ops: { a: 1 }, team: { b: 1 } }, 'ktv')).toEqual({ role: 'ktv' }) // KTV gửi phần không được phép → bỏ
  })
  it('đọc câu trả lời AI: JSON hoặc chữ thường, luôn che SĐT/tiền', () => {
    expect(parseAnswer('{"title":"X","facts":["a"],"hyps":[],"next":["b"]}')).toEqual({ title: 'X', facts: ['a'], hyps: [], next: ['b'] })
    expect(parseAnswer('xin chào 0905123456').facts[0]).toContain('[đã ẩn SĐT]')
    expect(scrub('giá 350.000đ')).toBe('giá [đã ẩn số tiền]')
  })
})

describe('Mộc: máy chủ (hàm moc)', () => {
  const env = (k?: string) => ({ get: (x: string) => (x === 'ANTHROPIC_API_KEY' ? k : undefined) })
  const req = (body: unknown, auth = 'Bearer t') => new Request('http://x/moc', { method: 'POST', headers: { Authorization: auth, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const db = (role: string | null, quota = false, docs: unknown[] = [{ title: 'Quy trình', body: 'Bước 1' }]) => () => ({
    rpc: async () => (quota ? { data: null, error: { message: 'quota' } } : role ? { data: role, error: null } : { data: null, error: { message: 'not approved' } }),
    from: () => ({ select: async () => ({ data: docs, error: null }) }),
  })
  it('chưa đăng nhập → 401; chưa có khóa AI → 503; chưa duyệt → 403; hết lượt → 429', async () => {
    const f = (async () => new Response('{}')) as unknown as typeof fetch
    expect((await handle(req({ q: 'a' }, ''), env('k'), { db: db('ktv'), fetch: f })).status).toBe(401)
    expect((await handle(req({ q: 'a' }), env(undefined), { db: db('ktv'), fetch: f })).status).toBe(503)
    expect((await handle(req({ q: 'a' }), env('k'), { db: db(null), fetch: f })).status).toBe(403)
    expect((await handle(req({ q: 'a' }), env('k'), { db: db('ktv', true), fetch: f })).status).toBe(429)
  })
  it('vai trò lấy ở máy chủ, không tin app: KTV giả làm CEO vẫn chỉ gửi phần KTV; không lộ khóa', async () => {
    let sent = ''
    const f = (async (_u: string, init: RequestInit) => { sent = String(init.body); return new Response(JSON.stringify({ content: [{ type: 'text', text: '{"title":"OK","facts":["Gọi 0905123456"],"hyps":[],"next":[]}' }] })) }) as unknown as typeof fetch
    const res = await handle(req({ q: 'Doanh thu tuần?', context: { role: 'ceo', ops: { queueWaiting: 3 }, myDay: { tours: [] }, segments: { customers: 9 } } }), env('k'), { db: db('ktv'), fetch: f })
    expect(res.status).toBe(200)
    const body = JSON.parse(sent)
    expect(body.system).toContain('ktv'); expect(body.messages[0].content).not.toContain('queueWaiting'); expect(body.messages[0].content).not.toContain('segments'); expect(body.messages[0].content).toContain('Quy trình')
    expect(sent).not.toContain('"k"')
    const out = await res.json(); expect(out.title).toBe('OK'); expect(out.facts[0]).toContain('[đã ẩn SĐT]')
  })
  it('AI lỗi → 502, không làm hỏng app', async () => {
    const f = (async () => new Response('err', { status: 500 })) as unknown as typeof fetch
    expect((await handle(req({ q: 'a' }), env('k'), { db: db('leader'), fetch: f })).status).toBe(502)
  })
})
