// Xử lý một câu hỏi gửi Mộc (chạy trên máy chủ Supabase Edge Functions).
// Khóa AI chỉ nằm ở máy chủ (biến bí mật ANTHROPIC_API_KEY), không bao giờ ở app.
// Vai trò thật đọc ở máy chủ (moc_take_quota), không tin app → lọc lại dữ liệu theo danh sách trắng của vai trò đó.
import { sanitizeContext, systemPrompt, userMessage, parseAnswer, MAX_BODY, MAX_DOCS, MAX_Q, type Role } from '../_shared/moc-policy.ts'

export type Env = { get(k: string): string | undefined }
type Res = { data: unknown; error: { message: string } | null }
type Db = {
  rpc(fn: string): PromiseLike<Res>
  from(t: string): { select(c: string): { eq(c: string, v: unknown): { order(c: string, o: { ascending: boolean }): { limit(n: number): PromiseLike<Res> } } } }
}
export type Deps = { db: (authHeader: string) => Db; fetch: typeof fetch; timeoutMs?: number }

const ROLES: Role[] = ['ktv', 'reception', 'leader', 'marketing', 'ceo']

export async function handle(req: Request, env: Env, deps: Deps): Promise<Response> {
  const cors = { 'Access-Control-Allow-Origin': env.get('ALLOWED_ORIGIN') ?? '*', 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Chỉ nhận POST' }, 405)
  const auth = req.headers.get('Authorization') ?? ''
  if (!/^Bearer \S{10,}$/.test(auth)) return json({ error: 'Cần đăng nhập' }, 401)
  const key = env.get('ANTHROPIC_API_KEY'); if (!key) return json({ error: 'Mộc AI chưa được bật' }, 503)

  // Giới hạn kích thước trước khi đọc (chống làm tốn phí AI)
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return json({ error: 'Dữ liệu gửi lên quá lớn' }, 413)
  const raw = await req.text(); if (raw.length > MAX_BODY) return json({ error: 'Dữ liệu gửi lên quá lớn' }, 413)
  let body: { q?: unknown; context?: unknown }
  try { body = JSON.parse(raw) } catch { return json({ error: 'Dữ liệu gửi lên không hợp lệ' }, 400) }
  const q = typeof body.q === 'string' ? body.q.trim() : ''
  if (!q || q.length > MAX_Q) return json({ error: `Câu hỏi trống hoặc dài quá ${MAX_Q} ký tự` }, 400)

  try {
    const db = deps.db(auth)
    const quota = await db.rpc('moc_take_quota')
    if (quota.error) { const over = /quota/.test(quota.error.message); return json({ error: over ? 'Hôm nay bạn đã hỏi Mộc đủ số lượt, mai hỏi tiếp nhé' : 'Tài khoản chưa được duyệt' }, over ? 429 : 403) }
    const role = quota.data as Role; if (!ROLES.includes(role)) return json({ error: 'Tài khoản chưa được duyệt' }, 403)

    const ctx = sanitizeContext(body.context, role)
    // Chỉ kiến thức CEO đã duyệt, đúng vai trò (RLS), tối đa MAX_DOCS mục. Kiến thức app tự gửi lên bị bỏ qua.
    const d = await db.from('moc_docs').select('title,body').eq('approved', true).order('updated_at', { ascending: false }).limit(MAX_DOCS)
    const docs = (Array.isArray(d.data) ? d.data : []) as { title: string; body: string }[]

    const ac = new AbortController(), timer = setTimeout(() => ac.abort(), deps.timeoutMs ?? 25000)
    let r: Response
    try {
      r = await deps.fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: ac.signal,
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: env.get('MOC_MODEL') ?? 'claude-haiku-5-5', max_tokens: 900, system: systemPrompt(role), messages: [{ role: 'user', content: userMessage(q, ctx, docs) }] }),
      })
    } finally { clearTimeout(timer) }
    if (!r.ok) return json({ error: 'Mộc AI đang bận, thử lại sau ít phút' }, 502)
    const out = await r.json() as { content?: { type: string; text?: string }[] }
    const text = (out.content ?? []).filter(c => c.type === 'text').map(c => c.text ?? '').join('\n')
    return json(parseAnswer(text))
  } catch {
    return json({ error: 'Mộc AI đang bận, thử lại sau ít phút' }, 502) // không lộ chi tiết lỗi bên trong
  }
}
