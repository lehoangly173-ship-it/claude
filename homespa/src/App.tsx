// Khung ứng dụng: MỘT codebase — điện thoại (thanh tab dưới) và máy tính (thanh bên).
// Mỗi vai trò có 4 nút mẹ theo sơ đồ: HÔM NAY · KHÁCH HÀNG · HỎI ĐÁP MỘC · CỦA TÔI (+ tab vận hành riêng).
import { ReactNode, useEffect, useState } from 'react'
import { useStore, defaultStaffFor } from './store'
import * as D from './data'
import { Icon, CustomerModal, MenuCtx } from './ui'
import { canSee } from './logic'
import { KtvHome, KtvWork, ReceptionHome, OpsHub, ReceptionCustomers, MyPage } from './screens/staff'
import { LeaderHome, TeamTab, MarketingHome, MarketingCust, MarketingMine, CeoHome, CeoCust, CeoMoc, CeoMine } from './screens/roles'
import { LeaderCustomers, MocScreen, MineScreen } from './screens/leader'

type Tab = { id: string; label: string; icon: string }
const H: Tab = { id: 'home', label: 'Hôm nay', icon: 'home' }, C: Tab = { id: 'cust', label: 'Khách hàng', icon: 'users' }
const M: Tab = { id: 'moc', label: 'Hỏi Mộc', icon: 'chat' }, ME: Tab = { id: 'me', label: 'Của tôi', icon: 'me' }
export const TABS: Record<D.Role, Tab[]> = {
  ktv: [H, { id: 'work', label: 'Công việc', icon: 'work' }, M, ME],
  reception: [H, { id: 'ops', label: 'Vận hành', icon: 'ops' }, C, M, ME],
  leader: [H, { id: 'team', label: 'Đội ngũ', icon: 'team' }, C, M, ME],
  marketing: [H, C, M, ME],
  ceo: [H, C, { id: 'moc', label: 'Mộc & Duyệt', icon: 'shield' }, ME],
}
const OPS = ['overview', 'schedule', 'queue', 'beds', 'cashier']
/** Đổi đường dẫn cũ (từ thông báo, cảnh báo, nút trong màn) sang tab/trang con của vai trò hiện tại */
function route(role: D.Role, page: string): string[] {
  const parts = page.split('/')
  if (TABS[role].some(t => t.id === parts[0])) return parts
  const p = parts[0], base = p.split(':')[0]
  if (OPS.includes(base)) {
    if (role === 'reception') return ['ops', p]
    if (role === 'ktv') return base === 'beds' ? ['work', 'beds'] : ['home', 'board']
    return ['home', 'ops', p]
  }
  const map: Record<string, string[]> = {
    notifs: ['home', 'notices'], mywork: role === 'ktv' ? ['work'] : ['home'], mytasks: ['home', 'tasks'], today: ['home'],
    customers: role === 'ktv' ? ['home', 'cust'] : ['cust', ...(role === 'ceo' ? ['all'] : [])], approvals: ['moc'], mine: ['me'], checklist: ['home', 'cleaning'], programs: ['cust'],
  }
  return map[p] ?? ['home']
}

function screenFor(role: D.Role, r: string[]): ReactNode {
  const [tab, ...sub] = r
  switch (role) {
    case 'ktv': return tab === 'work' ? <KtvWork sub={sub} /> : tab === 'moc' ? <MocScreen groups={D.MOC_GROUPS.ktv} /> : tab === 'me' ? <MyPage sub={sub} /> : <KtvHome sub={sub} />
    case 'reception': return tab === 'ops' ? <OpsHub sub={sub[0]} base="ops" /> : tab === 'cust' ? <ReceptionCustomers /> : tab === 'moc' ? <MocScreen groups={D.MOC_GROUPS.reception} /> : tab === 'me' ? <MyPage sub={sub} /> : <ReceptionHome sub={sub} />
    case 'leader': return tab === 'team' ? <TeamTab sub={sub} /> : tab === 'cust' ? <LeaderCustomers /> : tab === 'moc' ? <MocScreen /> : tab === 'me' ? <MineScreen /> : <LeaderHome sub={sub} />
    case 'marketing': return tab === 'cust' ? <MarketingCust sub={sub} /> : tab === 'moc' ? <MocScreen /> : tab === 'me' ? <MarketingMine sub={sub} /> : <MarketingHome sub={sub} />
    case 'ceo': return tab === 'cust' ? <CeoCust sub={sub} /> : tab === 'moc' ? <CeoMoc sub={sub} /> : tab === 'me' ? <CeoMine sub={sub} /> : <CeoHome sub={sub} />
  }
}

const ROLE_ORDER: D.Role[] = ['ktv', 'reception', 'leader', 'marketing', 'ceo']
const ROLE_CHIP: Record<D.Role, string> = { ktv: 'KTV', reception: 'Lễ Tân', leader: 'Leader/Manager', marketing: 'Marketing', ceo: 'CEO' }

/** Máy tính (rộng > 900px) */
function useDesktop() {
  const q = '(min-width: 901px)'
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => { const m = window.matchMedia(q); const f = () => setD(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  return d
}

export default function App() {
  const { s, user, setUser, me, page, go, profile, openCustomer, toast, advance, reset } = useStore()
  const r = route(user.role, page)
  const tabs = TABS[user.role]
  const unread = s.notifs.filter(n => canSee(n, user.role, me.id) && !n.readBy.includes(me.id)).length
  const badge: Record<string, number> = {
    moc: user.role === 'ceo' ? s.approvals.filter(a => a.status === 'Chờ duyệt').length : 0,
    ops: user.role === 'reception' ? s.queue.length + s.appts.filter(a => a.status === 'done').length : 0,
    team: user.role === 'leader' ? s.points.filter(p => p.status === 'Chờ duyệt').length : 0,
  }
  const switchRole = (role: D.Role) => { setUser({ role, staffId: defaultStaffFor(role) }); go('home') }
  const sameRole = s.staff.filter(x => x.role === user.role)
  const nav = (id: string) => { go(id); document.querySelector('.main')?.scrollTo({ top: 0 }) }
  // Máy tính: nút mẹ của "Hôm nay" nằm trong menu bật ra cạnh thanh trái
  const desktop = useDesktop()
  const [menuOpen, setMenuOpen] = useState(false)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const menuMode = desktop && r[0] === 'home' && r.length === 1 && !!host
  const closeMenu = () => setMenuOpen(false)
  useEffect(() => { if (!desktop) setMenuOpen(false) }, [desktop])
  useEffect(() => { setMenuOpen(false) }, [user.role])
  useEffect(() => {
    if (!menuOpen) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    const c = (e: MouseEvent) => { const t = e.target as HTMLElement; if (!t.closest('.flymenu') && !t.closest('[data-tab="home"]')) setMenuOpen(false) }
    document.addEventListener('keydown', k); document.addEventListener('mousedown', c)
    return () => { document.removeEventListener('keydown', k); document.removeEventListener('mousedown', c) }
  }, [menuOpen])
  const sideClick = (id: string) => {
    if (id === 'home' && desktop) { if (r[0] !== 'home' || r.length > 1) { nav('home'); setMenuOpen(true) } else setMenuOpen(o => !o); return }
    setMenuOpen(false); nav(id)
  }
  return <div className="app">
    <aside className="side">
      <div className="brand"><span className="logo">H</span><div><b>HOME SPA</b><small>Clinic Dr Quyên</small></div></div>
      <nav className="nav">{tabs.map(t => <button key={t.id} data-tab={t.id} aria-haspopup={t.id === 'home' ? 'menu' : undefined} aria-expanded={t.id === 'home' ? menuOpen : undefined} className={r[0] === t.id ? 'on' : ''} onClick={() => sideClick(t.id)}><Icon n={t.icon} s={18} />{t.label}{badge[t.id] ? <span className="badge">{badge[t.id]}</span> : null}</button>)}</nav>
      <div className="small" style={{ color: 'var(--side-dim)', padding: '0 8px' }}>🕒 {D.hhmm(s.now)} · {D.dateShort()}</div>
    </aside>
    <div className={`flymenu${menuOpen && menuMode ? ' open' : ''}`} role="menu" aria-label="Việc hôm nay">
      <div className="fm-top"><b>Hôm nay</b><button className="x" onClick={closeMenu} aria-label="Đóng">×</button></div>
      <div className="fm-body" ref={setHost} />
    </div>
    <main className="main">
      {D.DEMO && <div className="rolebar">
        <div className="rb-top"><span>Demo — chuyển vai trò</span><span>Bấm để xem giao diện khác</span></div>
        <div className="chips">{ROLE_ORDER.map(ro => <button key={ro} className={`rchip${user.role === ro ? ' on' : ''}`} onClick={() => switchRole(ro)}>{ROLE_CHIP[ro]}</button>)}</div>
        <div className="chips">
          {sameRole.length > 1 && <select className="rchip ghost" value={user.staffId} onChange={e => setUser({ ...user, staffId: e.target.value })} aria-label="Xem với người">{sameRole.map(x => <option key={x.id} value={x.id} style={{ color: '#000' }}>{x.name}</option>)}</select>}
          <button className="rchip ghost" onClick={() => advance(15)} title="Tua giờ mô phỏng">🕒 {D.hhmm(s.now)} · +15 phút</button>
          <button className="rchip ghost" onClick={reset}>Dữ liệu mẫu · 5 bộ phận</button>
        </div>
      </div>}
      <div className="appbar">
        <span className="avatar">{me.name.replace('Chị ', '')[0]}</span>
        <div className="who"><small>{user.role === 'ceo' ? 'CEO' : user.role === 'ktv' ? 'KTV Trị liệu' : D.ROLE_LABEL[user.role]}</small><b>{user.role === 'ceo' ? 'Dr. Quyên' : me.name}</b></div>
        <span className="grow" />
        <button className="iconbtn" onClick={() => nav('home/notices')} aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ''}`}><Icon n="bell" s={18} />{unread > 0 && <span className="dot" />}</button>
      </div>
      <div className="page" key={user.role + r.join('/')}>
        <MenuCtx.Provider value={menuMode && host ? { host, close: closeMenu } : null}>{screenFor(user.role, r)}</MenuCtx.Provider>
        {menuMode && !menuOpen && <button className="fm-hint" onClick={() => setMenuOpen(true)}><Icon n="home" s={16} />Mở danh mục việc hôm nay</button>}
      </div>
    </main>
    <nav className="tabbar">{tabs.map(t => <button key={t.id} className={r[0] === t.id ? 'on' : ''} onClick={() => nav(t.id)}><Icon n={t.icon} s={20} /><span>{t.label}</span>{badge[t.id] ? <span className="badge">{badge[t.id]}</span> : null}</button>)}</nav>
    {profile && <CustomerModal customerId={profile} onClose={() => openCustomer(null)} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>
}
