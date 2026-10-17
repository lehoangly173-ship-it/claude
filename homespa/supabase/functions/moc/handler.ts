// Xử lý một câu hỏi gửi Mộc (chạy trên máy chủ Supabase Edge Functions).
// Khóa AI chỉ nằm ở máy chủ (biến bí mật ANTHROPIC_API_KEY), không bao giờ ở app.
// Quyền: đọc vai trò thật của người hỏi ở máy chủ (không tin app gửi lên) → lọc lại dữ liệu theo vai trò.
import { sanitizeContext, systemPrompt, userMessage, parseAnswer, type Role } from '../_shared/moc-policy.ts'

export type Env = { get(k: string): string | undefined }
type Db = {
  rpc(fn: string): PromiseLike<{ data: unknown; error: { message: string } | null }>
  from(t: string): { select(c: string): PromiseLike<{ data: unknown; error: { message: string } | null }> }
}
export type Deps = { db: (authHeader: string) => Db; fetch: typeof fetch }

const ROLES: Role[] = ['ktv', 'reception', 'leader', 'marketing', 'ceo']
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

export async function handle(req: Request, env: Env, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Chỉ nhận POST' }, 405)
  const auth = req.headers.get('Authorization') ?? ''
  if (!/^Bearer .+/.test(auth)) return json({ error: 'Cần đăng nhập' }, 401)
  const key = env.get('ANTHROPIC_API_KEY'); if (!key) return json({ error: 'Mộc AI chưa được bật (thiếu khóa AI ở máy chủ)' }, 503)

  let body: { q?: unknown; context?: unknown }
  try { body = await req.json() } catch { return json({ error: 'Dữ liệu gửi lên không hợp lệ' }, 400) }
  const q = typeof body.q === 'string' ? body.q.trim() : ''
  if (!q || q.length > 500) return json({ error: 'Câu hỏi trống hoặc dài quá 500 ký tự' }, 400)

  const db = deps.db(auth)
  // Vai trò thật + giới hạn lượt/ngày (hàm ở máy chủ; chưa được duyệt hoặc hết lượt → báo lỗi)
  const quota = await db.rpc('moc_take_quota')
  if (quota.error) return json({ error: /quota/.test(quota.error.message) ? 'Hôm nay bạn đã hỏi Mộc đủ số lượt, mai hỏi tiếp nhé' : 'Tài khoản chưa được duyệt' }, /quota/.test(quota.error.message) ? 429 : 403)
  const role = quota.data as Role; if (!ROLES.includes(role)) return json({ error: 'Tài khoản chưa được duyệt' }, 403)

  const ctx = sanitizeContext(body.context, role)
  const d = await db.from('moc_docs').select('title,body') // RLS: chỉ kiến thức dành cho vai trò này
  const docs = (Array.isArray(d.data) ? d.data : []) as { title: string; body: string }[]

  const r = await deps.fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: env.get('MOC_MODEL') ?? 'claude-haiku-5-5', max_tokens: 900, system: systemPrompt(role), messages: [{ role: 'user', content: userMessage(q, ctx, docs) }] }),
  })
  if (!r.ok) return json({ error: 'Mộc AI đang bận, thử lại sau ít phút' }, 502)
  const out = await r.json() as { content?: { type: string; text?: string }[] }
  const text = (out.content ?? []).filter(c => c.type === 'text').map(c => c.text ?? '').join('\n')
  return json(parseAnswer(text))
}
