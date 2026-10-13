// Đăng nhập & phân quyền thật (Supabase). Chỉ bật khi build có VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.
// Không có 2 biến đó → chạy bản DEMO như cũ (dải "Demo — chuyển vai trò").
// Vai trò KHÔNG lấy từ máy người dùng: đọc từ bảng staff (RLS) — chỉ CEO đổi được qua hàm approve_join / set_staff_role.
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import * as D from './data'
import { T } from './i18n'

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const REAL = !!(URL_ && KEY)
let client: SupabaseClient | null = null
export const sb = () => (client ??= createClient(URL_!, KEY!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }))

export type StaffRow = { id: string; name: string; role: D.Role; shift: 1 | 2 | null }
type AuthCtx = { staff: StaffRow; email: string; signOut: () => Promise<void> }
const Ctx = createContext<AuthCtx | null>(null)
/** Người đang đăng nhập (chỉ có ở bản thật) */
export const useAuth = () => useContext(Ctx)

type St = { k: 'loading' } | { k: 'out' } | { k: 'pending'; session: Session; req: { status: string; wanted_role: string } | null } | { k: 'in'; session: Session; staff: StaffRow } | { k: 'error'; msg: string }

export function AuthGate({ children }: { children: (staff: StaffRow) => ReactNode }) {
  const [st, setSt] = useState<St>({ k: 'loading' })
  const load = async (session: Session | null) => {
    if (!session) return setSt({ k: 'out' })
    const { data, error } = await sb().from('staff').select('id,name,role,shift').eq('user_id', session.user.id).eq('active', true).maybeSingle()
    if (error) return setSt({ k: 'error', msg: error.message })
    if (data) return setSt({ k: 'in', session, staff: data as StaffRow })
    const r = await sb().from('join_requests').select('status,wanted_role').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    setSt({ k: 'pending', session, req: r.data })
  }
  useEffect(() => {
    const { data: sub } = sb().auth.onAuthStateChange((e, session) => { if (e !== 'TOKEN_REFRESHED') load(session) }) // INITIAL_SESSION đến ngay khi mở app
    return () => sub.subscription.unsubscribe()
  }, [])
  const signOut = async () => { await sb().auth.signOut(); setSt({ k: 'out' }) }
  if (st.k === 'loading') return <Shell><p className="muted">{T.auth.loading}</p></Shell>
  if (st.k === 'error') return <Shell><div className="warn">{T.auth.error}: {st.msg}</div><button className="btn" onClick={() => location.reload()}>{T.auth.retry}</button></Shell>
  if (st.k === 'out') return <Login />
  if (st.k === 'pending') return <Pending session={st.session} req={st.req} onSent={() => load(st.session)} signOut={signOut} />
  return <Ctx.Provider value={{ staff: st.staff, email: st.session.user.email ?? '', signOut }}>{children(st.staff)}</Ctx.Provider>
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="auth-wrap"><div className="card pad col auth-card">
    <div className="brand"><span className="logo">H</span><div><b>HOME SPA</b><small>Clinic Dr Quyên</small></div></div>{children}</div></div>
}

function Login() {
  const [email, setEmail] = useState(''), [sent, setSent] = useState(false), [err, setErr] = useState('')
  const google = async () => { const { error } = await sb().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }); if (error) setErr(error.message) }
  const magic = async () => { setErr(''); const { error } = await sb().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true } }); if (error) setErr(error.message); else setSent(true) }
  return <Shell>
    <h1 className="auth-h">{T.auth.title}</h1><p className="muted small">{T.auth.sub}</p>
    <button className="btn pri" onClick={google}>{T.auth.google}</button>
    <div className="tiny muted" style={{ textAlign: 'center' }}>{T.auth.or}</div>
    {sent ? <div className="ok small">{T.auth.sent(email)}</div> : <>
      <label className="f">{T.auth.email}<input className="inp" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <button className="btn" disabled={!/^\S+@\S+\.\S+$/.test(email)} onClick={magic}>{T.auth.sendLink}</button></>}
    {err && <div className="warn small">{err}</div>}
  </Shell>
}

function Pending({ session, req, onSent, signOut }: { session: Session; req: { status: string; wanted_role: string } | null; onSent: () => void; signOut: () => Promise<void> }) {
  const [name, setName] = useState((session.user.user_metadata?.full_name as string) ?? ''), [role, setRole] = useState<D.Role>('ktv'), [err, setErr] = useState('')
  const send = async () => { setErr(''); const { error } = await sb().from('join_requests').insert({ email: session.user.email, name: name.trim(), wanted_role: role }); if (error) setErr(error.message); else onSent() }
  return <Shell>
    <h1 className="auth-h">{T.auth.pendingTitle}</h1><p className="small">{session.user.email}</p>
    {req?.status === 'Chờ duyệt' ? <div className="note small">{T.auth.waiting(D.ROLE_LABEL[req.wanted_role as D.Role] ?? req.wanted_role)}</div> : <>
      {req?.status === 'Từ chối' && <div className="warn small">{T.auth.rejected}</div>}
      <label className="f">{T.auth.name}<input className="inp" value={name} onChange={e => setName(e.target.value)} /></label>
      <label className="f">{T.auth.wantRole}<select className="inp" value={role} onChange={e => setRole(e.target.value as D.Role)}>{(['ktv', 'reception', 'leader', 'marketing'] as D.Role[]).map(r => <option key={r} value={r}>{D.ROLE_LABEL[r]}</option>)}</select></label>
      <button className="btn pri" disabled={name.trim().length < 2} onClick={send}>{T.auth.request}</button></>}
    {err && <div className="warn small">{err}</div>}
    <button className="btn ghost" onClick={signOut}>{T.auth.signOut}</button>
  </Shell>
}

// ── CEO: duyệt tài khoản, đổi vai trò, khóa tài khoản (gọi hàm ở server, có ghi nhật ký) ──
type Req = { id: string; email: string; name: string; wanted_role: D.Role; status: string; created_at: string }
type Row = StaffRow & { active: boolean; user_id: string | null }
export function RealMembers() {
  const me = useAuth()
  const [reqs, setReqs] = useState<Req[]>([]), [staff, setStaff] = useState<Row[]>([]), [pick, setPick] = useState<Record<string, D.Role>>({}), [msg, setMsg] = useState('')
  const reload = async () => {
    const [a, b] = await Promise.all([sb().from('join_requests').select('*').order('created_at', { ascending: false }), sb().from('staff').select('id,name,role,shift,active,user_id').order('name')])
    setReqs((a.data ?? []) as Req[]); setStaff((b.data ?? []) as Row[])
  }
  useEffect(() => { reload() }, [])
  const run = async (p: PromiseLike<{ error: { message: string } | null }>, ok: string) => { const { error } = await p; setMsg(error ? error.message : ok); reload() }
  if (me?.staff.role !== 'ceo') return <div className="warn">{T.auth.ceoOnly}</div>
  return <div className="col">
    {msg && <div className="note small" role="status">{msg}</div>}
    <section className="card list"><div className="item"><b>{T.auth.requests}</b></div>
      {reqs.filter(r => r.status === 'Chờ duyệt').map(r => <div key={r.id} className="item"><div className="body"><div className="t">{r.name} · {r.email}</div><div className="d">{T.auth.wants} {D.ROLE_LABEL[r.wanted_role]}</div></div>
        <select className="inp" style={{ width: 130 }} aria-label={T.auth.roleFor(r.name)} value={pick[r.id] ?? r.wanted_role} onChange={e => setPick({ ...pick, [r.id]: e.target.value as D.Role })}>{(Object.keys(D.ROLE_LABEL) as D.Role[]).map(x => <option key={x} value={x}>{D.ROLE_LABEL[x]}</option>)}</select>
        <button className="btn sm danger" onClick={() => run(sb().rpc('reject_join', { req: r.id }), T.auth.rejectedOk)}>{T.auth.reject}</button>
        <button className="btn sm pri" onClick={() => run(sb().rpc('approve_join', { req: r.id, p_role: pick[r.id] ?? r.wanted_role }), T.auth.approvedOk)}>{T.auth.approve}</button></div>)}
      {!reqs.some(r => r.status === 'Chờ duyệt') && <div className="item muted small">{T.auth.noRequests}</div>}</section>
    <section className="card list"><div className="item"><b>{T.auth.team}</b></div>
      {staff.map(x => <div key={x.id} className="item"><div className="body"><div className="t">{x.name}{!x.active && ` · ${T.auth.locked}`}</div><div className="d">{x.user_id ? T.auth.hasAccount : T.auth.noAccount}</div></div>
        <select className="inp" style={{ width: 130 }} aria-label={T.auth.roleFor(x.name)} value={x.role} disabled={x.id === me.staff.id} onChange={e => run(sb().rpc('set_staff_role', { p_staff_id: x.id, p_role: e.target.value, p_active: x.active }), T.auth.roleChanged)}>{(Object.keys(D.ROLE_LABEL) as D.Role[]).map(r => <option key={r} value={r}>{D.ROLE_LABEL[r]}</option>)}</select>
        {x.id !== me.staff.id && <button className="btn sm" onClick={() => run(sb().rpc('set_staff_role', { p_staff_id: x.id, p_role: x.role, p_active: !x.active }), x.active ? T.auth.lockedOk : T.auth.unlockedOk)}>{x.active ? T.auth.lock : T.auth.unlock}</button>}</div>)}</section>
  </div>
}
