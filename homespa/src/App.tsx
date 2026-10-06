// Khung ứng dụng: MỘT codebase, hai bố cục — desktop (thanh bên) và điện thoại (thanh tab dưới).
import { useState } from 'react'
import { useStore, defaultStaffFor } from './store'
import * as D from './data'
import { alerts, waitingBills } from './logic'
import { Icon, CustomerModal, Modal, Empty, PageHeader, Pill } from './ui'
import { OverviewScreen, ScheduleScreen, QueueScreen, BedsScreen, NotifScreen } from './screens/ops'
import { CashierScreen } from './screens/cashier'
import { MyWorkScreen } from './screens/ktv'
import { LeaderToday, LeaderCustomers, MocScreen, MineScreen, TaskModal, PrioPill } from './screens/leader'
import { ApprovalsScreen, MembersScreen, MarketingScreen } from './screens/ceo'

type NavItem = { id: string; label: string; icon: string; badge?: number }
function navFor(role: D.Role, b: Record<string, number>): { sec?: string; items: NavItem[] }[] {
  const notif = { id: 'notifs', label: 'Thông báo', icon: 'bell', badge: b.notifs }
  switch (role) {
    case 'reception': return [{ items: [{ id: 'overview', label: 'Tổng quan', icon: 'home' }, { id: 'schedule', label: 'Lịch điều phối', icon: 'cal' }, { id: 'queue', label: 'Hàng chờ chia tour', icon: 'queue', badge: b.queue }, { id: 'beds', label: 'Sơ đồ giường', icon: 'bed' }, { id: 'cashier', label: 'Thu ngân', icon: 'cash', badge: b.bills }, { id: 'mytasks', label: 'Việc được giao', icon: 'today', badge: b.tasks }, notif] }]
    case 'ktv': return [{ items: [{ id: 'mywork', label: 'Công việc của tôi', icon: 'work' }, { id: 'beds', label: 'Sơ đồ giường', icon: 'bed' }, notif] }]
    case 'leader': return [{ sec: 'Leader', items: [{ id: 'today', label: 'Hôm nay', icon: 'today', badge: b.tasks }, { id: 'customers', label: 'Khách hàng', icon: 'users', badge: b.risk }, { id: 'moc', label: 'Hỏi đáp Mộc', icon: 'chat' }, { id: 'mine', label: 'Của tôi', icon: 'me' }] }, { sec: 'Vận hành (xem)', items: [{ id: 'overview', label: 'Tổng quan', icon: 'home' }, { id: 'schedule', label: 'Lịch điều phối', icon: 'cal' }, notif] }]
    case 'ceo': return [{ items: [{ id: 'approvals', label: 'Phê duyệt', icon: 'shield', badge: b.approvals }, { id: 'overview', label: 'Vận hành', icon: 'home' }, { id: 'customers', label: 'Khách hàng', icon: 'users' }, { id: 'cashier', label: 'Thu ngân', icon: 'cash' }, { id: 'members', label: 'Thành viên', icon: 'me' }, notif] }]
    case 'marketing': return [{ items: [{ id: 'programs', label: 'Chương trình', icon: 'mega' }, { id: 'customers', label: 'Khách hàng', icon: 'users' }, notif] }]
  }
}

function TasksScreen() {
  const { s, me } = useStore()
  const [open, setOpen] = useState<string | null>(null)
  const list = s.tasks.filter(t => t.ownerId === me.id && t.status !== 'transferred')
  return <>
    <PageHeader title="Việc được giao" sub="Leader giao: chuẩn bị quà, xác nhận lịch, nhắc đóng tiếp…" />
    <div className="card list">{list.map(t => <button key={t.id} className="item" onClick={() => setOpen(t.id)}><span className={`sev ${t.priority}`} /><div className="body"><div className="t">{t.title}</div><div className="d">{t.detail}</div></div>{t.status === 'done' ? <Pill tone="green">Xong</Pill> : <PrioPill p={t.priority} />}</button>)}{!list.length && <Empty>Không có việc</Empty>}</div>
    {open && <TaskModal id={open} onClose={() => setOpen(null)} />}
  </>
}

export default function App() {
  const st = useStore()
  const { s, user, setUser, me, page, go, profile, openCustomer, toast, advance, reset } = st
  const [more, setMore] = useState(false)
  const badges = {
    notifs: s.notifs.filter(n => n.roles.includes(user.role) && !n.readBy.includes(me.id)).length,
    queue: s.queue.length, bills: waitingBills(s).length,
    tasks: s.tasks.filter(t => t.ownerId === me.id && (t.status === 'open' || t.status === 'doing')).length,
    risk: alerts(s).filter(a => a.who === 'leader').length, approvals: s.approvals.filter(a => a.status === 'Chờ duyệt').length,
  }
  const nav = navFor(user.role, badges)
  const flat = nav.flatMap(g => g.items)
  const base = page.split(':')[0]
  const cur = flat.some(i => i.id === base) ? base : flat[0].id
  const switchRole = (r: D.Role) => { setUser({ role: r, staffId: defaultStaffFor(r) }); go(navFor(r, badges)[0].items[0].id); setMore(false) }
  const screen = (() => {
    switch (cur) {
      case 'overview': return <OverviewScreen readonly={user.role !== 'reception'} />
      case 'schedule': return <ScheduleScreen key={page} openNew={page === 'schedule:new'} />
      case 'queue': return <QueueScreen />
      case 'beds': return <BedsScreen />
      case 'cashier': return <CashierScreen />
      case 'notifs': return <NotifScreen />
      case 'mywork': return <MyWorkScreen />
      case 'mytasks': return <TasksScreen />
      case 'today': return <LeaderToday />
      case 'customers': return <LeaderCustomers />
      case 'moc': return <MocScreen />
      case 'mine': return <MineScreen />
      case 'approvals': return <ApprovalsScreen />
      case 'members': return <MembersScreen />
      case 'programs': return <MarketingScreen />
    }
  })()
  const sameRole = s.staff.filter(x => x.role === user.role)
  const tabs = flat.slice(0, 4)
  return <div className="app">
    <aside className="side">
      <div className="brand"><span className="logo">H</span><div><b>HOME SPA</b><small>Clinic Dr Quyên</small></div></div>
      <nav className="nav">{nav.map((g, gi) => <div key={gi}>{g.sec && <div className="nav-sec">{g.sec}</div>}{g.items.map(i => <button key={i.id} className={cur === i.id ? 'on' : ''} onClick={() => go(i.id)}><Icon n={i.icon} />{i.label}{i.badge ? <span className="badge">{i.badge}</span> : null}</button>)}</div>)}</nav>
      <div className="me"><span className="logo" style={{ width: 32, height: 32, fontSize: 13 }}>{me.name.replace('Chị ', '')[0]}</span><div><b>{me.name}</b><small>{D.ROLE_LABEL[user.role]}{me.shift ? ` · Ca ${me.shift}` : ''}</small></div></div>
    </aside>
    <main className="main">
      <div className="topbar">
        {D.DEMO && <><span className="pill t-yellow hide-m">Bản chạy thử</span><label className="row small" htmlFor="role-sel"><span className="muted hide-m">Xem với vai trò</span>
          <select id="role-sel" className="inp" style={{ width: 'auto' }} value={user.role} onChange={e => switchRole(e.target.value as D.Role)}>{(Object.keys(D.ROLE_LABEL) as D.Role[]).map(r => <option key={r} value={r}>{D.ROLE_LABEL[r]}</option>)}</select>
        </label>{sameRole.length > 1 && <select id="staff-sel" className="inp" style={{ width: 'auto' }} value={user.staffId} onChange={e => setUser({ ...user, staffId: e.target.value })} aria-label="Chọn người">{sameRole.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>}</>}
        <span className="grow" />
        <span className="pill t-grey num" title="Giờ hiện tại">🕒 {D.hhmm(s.now)}</span>
        {D.DEMO && <><button className="btn sm" onClick={() => advance(15)} title="Tua giờ mô phỏng thêm 15 phút">+15 phút</button>
        <button className="btn sm ghost hide-m" onClick={reset}>Dữ liệu mẫu</button></>}
      </div>
      <div className="page">{screen}</div>
    </main>
    <nav className="tabbar">
      {tabs.map(i => <button key={i.id} className={cur === i.id ? 'on' : ''} onClick={() => go(i.id)}><Icon n={i.icon} s={20} /><span>{i.label.replace('Hàng chờ chia tour', 'Hàng chờ').replace('Lịch điều phối', 'Lịch').replace('Công việc của tôi', 'Việc của tôi')}</span>{i.badge ? <span className="badge">{i.badge}</span> : null}</button>)}
      <button className={flat.slice(4).some(i => i.id === cur) ? 'on' : ''} onClick={() => setMore(true)}><Icon n="more" s={20} /><span>Thêm</span>{flat.slice(4).reduce((t, i) => t + (i.badge ?? 0), 0) > 0 && <span className="badge">{flat.slice(4).reduce((t, i) => t + (i.badge ?? 0), 0)}</span>}</button>
    </nav>
    {more && <Modal title="Thêm" onClose={() => setMore(false)}>
      <div className="card list">{flat.slice(4).map(i => <button key={i.id} className="item" onClick={() => { go(i.id); setMore(false) }}><Icon n={i.icon} /><div className="body"><div className="t">{i.label}</div></div>{i.badge ? <span className="badge">{i.badge}</span> : null}</button>)}
        {!flat.slice(4).length && <Empty>Không có mục khác</Empty>}</div>
      {D.DEMO && <button className="btn" onClick={() => { reset(); setMore(false) }}>Khôi phục dữ liệu mẫu</button>}
    </Modal>}
    {profile && <CustomerModal customerId={profile} onClose={() => openCustomer(null)} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>
}
