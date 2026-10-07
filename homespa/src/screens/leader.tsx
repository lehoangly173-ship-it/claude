// LEADER HOME — theo tài liệu "Leader Home":
// Hôm nay = việc cần làm · Khách hàng = quá trình theo từng khách · Hỏi đáp Mộc = hướng dẫn · Của tôi = kết quả & năng lực.
// Một việc chỉ nhập kết quả MỘT lần → tự cập nhật hồ sơ khách và chỉ số cá nhân.
import { useMemo, useState } from 'react'
import { useStore, BUDGET_LIMIT } from '../store'
import * as D from '../data'
import { alerts, overview, cust, ktvState, custSegment, Alert, State, myZones, zoneReport, tourOrder, pointsOf } from '../logic'
import { Icon, Pill, Stat, PageHeader, Seg, Modal, Empty, Sec, Av, Delta, Hero } from '../ui'

const isRec = (s: State, id: string) => s.staff.find(x => x.id === id)?.role === 'reception'
const FLOW = ['Mở việc', 'Nhận xử lý', 'Ghi kết quả / minh chứng', 'Hoàn thành / chuyển']
const flowStep = (t: D.Task) => (t.status === 'open' ? 0 : t.status === 'doing' ? (t.result ? 2 : 1) : 3)
export const PrioPill = ({ p }: { p: D.Task['priority'] }) => <Pill tone={p === 'cao' ? 'red' : p === 'vừa' ? 'yellow' : 'grey'}>{p}</Pill>

// ═══════════════════════════ 1. HÔM NAY ═══════════════════════════
export function LeaderToday() {
  const { s, me, addTask, go } = useStore()
  const o = overview(s)
  const al = alerts(s)
  const [filter, setFilter] = useState<'mine' | 'team' | 'done'>('mine')
  const [open, setOpen] = useState<string | null>(null)
  const [drill, setDrill] = useState<null | 'reception' | 'ktv'>(null)
  const [newTask, setNewTask] = useState(false)
  const convert = (a: Alert) => addTask({ title: a.title, detail: a.detail, category: a.nav === 'customers' ? 'Khách hàng' : 'Vận hành', priority: a.level, ownerId: a.who === 'leader' ? me.id : D.firstOf('reception'), customerId: a.customerId, sourceKey: a.key })
  const taken = new Set(s.tasks.map(t => t.sourceKey).filter(Boolean))
  const openAlerts = al.filter(a => !taken.has(a.key))
  const list = s.tasks.filter(t => filter === 'mine' ? t.ownerId === me.id && (t.status === 'open' || t.status === 'doing') : filter === 'team' ? t.ownerId !== me.id && t.createdBy === me.id && t.status !== 'done' : t.status === 'done' && (t.ownerId === me.id || t.createdBy === me.id))
  const fbNew = s.feedback.filter(f => f.status !== 'đã xử lý' && f.rating <= 3).length
  const loads = D.ktvs().map(k => ({ k, n: s.appts.filter(a => a.ktvId === k.id && !['cancelled', 'no_show'].includes(a.status)).length }))
  const maxLoad = Math.max(...loads.map(l => l.n), 1)
  return <>
    <PageHeader eyebrow={`Leader ${me.name} · ${D.dateLabel()}`} title="Hôm nay" sub="Việc cần hành động trước — chỉ mở chi tiết lễ tân / KTV khi cần kiểm tra"
      right={<><button className="btn" onClick={() => go('moc')}><Icon n="chat" />Hỏi Mộc</button><button className="btn pri" onClick={() => setNewTask(true)}><Icon n="plus" />Tạo việc</button></>} />
    <Sec eyebrow="Bảng tổng hợp">
      <div className="grid g4">
        <Stat label="Lễ tân" value={o.waiting + o.bills.length + o.late.length} tone="p-fg" sub={`${o.waiting} chờ chia tour · ${o.bills.length} chờ thu · ${o.late.length} trễ hẹn`} onClick={() => setDrill('reception')} extra={<span className="link small">Xem chi tiết →</span>} />
        <Stat label="Kỹ thuật viên" value={<>{o.ktvBusy}<small>/{o.ktvIn} đang làm</small></>} tone="g-fg" sub={`${o.ktvFree} rảnh · ${o.bedsCleaning} giường đang dọn`} onClick={() => setDrill('ktv')} extra={<span className="link small">Xem chi tiết →</span>} />
        <Stat label="Khách cần chú ý" value={al.filter(a => a.who === 'leader').length} tone="r-fg" sub={`${fbNew} phản hồi xấu chưa xong`} onClick={() => go('customers')} />
        <Stat label="Chờ chị duyệt" value={s.approvals.filter(a => a.fromId === me.id && a.status === 'Chờ duyệt').length} tone="gold" sub="đề xuất / báo cáo đã gửi" onClick={() => go('mine')} />
      </div>
    </Sec>
    <div className="split">
      <Sec eyebrow="Việc cần làm" right={<Seg value={filter} onChange={setFilter} items={[{ k: 'mine', label: 'Của tôi', badge: s.tasks.filter(t => t.ownerId === me.id && (t.status === 'open' || t.status === 'doing')).length }, { k: 'team', label: 'Đã giao đi' }, { k: 'done', label: 'Đã xong' }]} />}>
        <div className="tiny muted" style={{ marginBottom: 8 }}>Luồng: {FLOW.join(' → ')}</div>
        <div className="card list">{list.map(t => <button key={t.id} className="item" onClick={() => setOpen(t.id)}><span className={`sev ${t.priority}`} /><div className="body"><div className="t">{t.title}</div><div className="d">{t.category} · {t.ownerId === me.id ? 'tôi xử lý' : `giao ${D.staffName(t.ownerId)}`} · bước {flowStep(t) + 1}/4: {FLOW[flowStep(t)]}{t.earlyReport && ' · báo sớm'}</div></div><PrioPill p={t.priority} /></button>)}
          {!list.length && <Empty>Không có việc trong mục này</Empty>}</div>
      </Sec>
      <Sec eyebrow="Cảnh báo tự động" right={<span className="badge">{openAlerts.length}</span>}>
        <div className="card list">{openAlerts.slice(0, 8).map(a => <div key={a.key} className="item"><span className={`sev ${a.level}`} /><div className="body"><div className="t">{a.title}</div><div className="d">{a.detail}</div></div><button className="btn sm" onClick={() => convert(a)}>{a.who === 'leader' ? 'Nhận việc' : 'Giao lễ tân'}</button></div>)}
          {!openAlerts.length && <Empty>Mọi cảnh báo đã có người xử lý</Empty>}</div>
        <div className="tiny muted" style={{ marginTop: 6 }}>Mỗi cảnh báo chỉ tạo việc một lần. Việc liên quan khách sẽ tự ghi vào hồ sơ khi hoàn thành.</div>
      </Sec>
    </div>
    <Sec eyebrow="Tải công việc KTV hôm nay" right={<span className="tiny muted">Cân bằng tăng trưởng với chất lượng: tránh dồn khách cho 1 người</span>}>
      <div className="card pad grid g4">{loads.map(({ k, n }) => <div key={k.id} className="col" style={{ gap: 4 }}><div className="row small"><b>{k.name}</b><span className="muted">Ca {k.shift}</span><span className="right-al num strong">{n} tour</span></div><div className="bar"><i style={{ width: `${(n / maxLoad) * 100}%`, background: n >= 4 ? 'var(--r-fg)' : undefined }} /></div></div>)}</div>
    </Sec>
    {open && <TaskModal id={open} onClose={() => setOpen(null)} />}
    {newTask && <NewTaskModal onClose={() => setNewTask(false)} />}
    {drill && <Modal wide title={drill === 'reception' ? 'Chi tiết lễ tân' : 'Chi tiết KTV'} onClose={() => setDrill(null)}>
      {drill === 'reception' ? <div className="col">
        {[...o.late.map(a => `Trễ hẹn: ${cust(s, a.customerId).name} ${D.hhmm(a.start)} (${s.now - a.start}p)`), ...s.queue.map(q => `Chờ chia tour: ${cust(s, q.customerId).name} · ${s.now - q.arrival} phút`), ...o.bills.map(a => `Chờ thu: ${cust(s, a.customerId).name} · ${D.svc(a.serviceId).name}`)].map((t, i) => <div key={i} className="small">• {t}</div>)}
        {s.tasks.filter(t => isRec(s, t.ownerId)).map(t => <div key={t.id} className="small">• Việc giao {D.staffName(t.ownerId)}: {t.title} — <b>{t.status === 'done' ? 'xong' : t.status === 'doing' ? 'đang làm' : 'chưa nhận'}</b></div>)}
      </div> : <div className="col">{D.ktvs().map(k => { const st = ktvState(s, k.id); const fb = s.feedback.filter(f => f.ktvId === k.id); return <div key={k.id} className="row small"><Av name={k.name} /><b>{k.name}</b><Pill tone={st.tone} dot>{st.label}</Pill><span className="muted">{loads.find(l => l.k.id === k.id)!.n} tour</span>{fb.map(f => <Pill key={f.id} tone={f.rating >= 4 ? 'green' : 'yellow'}>{f.group} {f.rating}/5</Pill>)}</div> })}</div>}
    </Modal>}
  </>
}

export function TaskModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { s, me, startTask, completeTask, transferTask, openCustomer } = useStore()
  const t = s.tasks.find(x => x.id === id)!
  const [result, setResult] = useState(''); const [evidence, setEvidence] = useState('')
  const [to, setTo] = useState(''); const [reason, setReason] = useState('')
  const [mode, setMode] = useState<'done' | 'transfer'>('done')
  const step = flowStep(t)
  return <Modal title={t.title} onClose={onClose}>
    <div className="flow">{FLOW.map((f, i) => <span key={f} className={i <= step ? 'on' : ''}>{i + 1}. {f}</span>)}</div>
    <div className="row"><PrioPill p={t.priority} /><Pill>{t.category}</Pill><span className="small muted">Giao: {D.staffName(t.ownerId)} · tạo {D.hhmm(t.createdMin)} bởi {t.createdBy === 'system' ? 'hệ thống' : D.staffName(t.createdBy)}</span></div>
    <div className="small">{t.detail}</div>
    {t.customerId && <button className="btn sm" onClick={() => openCustomer(t.customerId!)}>Hồ sơ {cust(s, t.customerId).name}</button>}
    {t.status === 'open' && t.ownerId === me.id && <button className="btn pri" onClick={() => startTask(t.id)}>Nhận xử lý</button>}
    {t.status === 'doing' && t.ownerId === me.id && <div className="card pad col">
      <Seg value={mode} onChange={setMode} items={[{ k: 'done', label: 'Ghi kết quả & hoàn thành' }, { k: 'transfer', label: 'Chuyển người phụ trách' }]} />
      {mode === 'done' ? <>
        <label className="f">Kết quả<textarea id="tk-res" className="inp" value={result} onChange={e => setResult(e.target.value)} placeholder="VD: đã gọi khách, khách hẹn thứ 7 quay lại, đồng ý tái tục gói 10 buổi" /></label>
        <label className="f">Minh chứng (tùy chọn)<input id="tk-ev" className="inp" value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="VD: ảnh tin nhắn Zalo, mã hóa đơn HD000152" /></label>
        <button className="btn pri" disabled={!result.trim()} onClick={() => { completeTask(t.id, result.trim(), evidence.trim()); onClose() }}>Hoàn thành</button>
      </> : <>
        <label className="f">Chuyển cho<select id="tk-to" className="inp" value={to} onChange={e => setTo(e.target.value)}><option value="">— chọn —</option>{s.staff.filter(x => x.id !== me.id).map(x => <option key={x.id} value={x.id}>{x.name} · {D.ROLE_LABEL[x.role]}</option>)}</select></label>
        {s.staff.find(x => x.id === to)?.role === 'ceo' && <div className="warn small">Chuyển chị khi vượt năng lực / quyền hạn Leader (đổi giá, hoàn tiền, ngân sách ngoài mức). Sẽ vào hộp duyệt của chị.</div>}
        <label className="f">Lý do / bàn giao<input id="tk-reason" className="inp" value={reason} onChange={e => setReason(e.target.value)} /></label>
        <button className="btn pri" disabled={!to || !reason.trim()} onClick={() => { transferTask(t.id, to, reason.trim()); onClose() }}>Chuyển</button>
      </>}
    </div>}
    {t.status === 'done' && <div className="ok small">Kết quả: {t.result}{t.evidence && ` · Minh chứng: ${t.evidence}`} · xong {t.doneMin != null && D.hhmm(t.doneMin)}</div>}
    {t.status === 'transferred' && <div className="warn small">Đã chuyển {D.staffName(t.transferTo)}: {t.result}</div>}
  </Modal>
}

export function NewTaskModal({ onClose, preset }: { onClose: () => void; preset?: Partial<D.Task> }) {
  const { s, me, addTask } = useStore()
  const [f, setF] = useState({ title: preset?.title ?? '', detail: preset?.detail ?? '', category: (preset?.category ?? 'Vận hành') as D.Task['category'], priority: (preset?.priority ?? 'vừa') as D.Task['priority'], ownerId: preset?.ownerId ?? me.id })
  return <Modal title="Tạo việc cần làm" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn pri" disabled={!f.title.trim()} onClick={() => { addTask({ ...f, customerId: preset?.customerId }); onClose() }}>Tạo việc</button></>}>
    <label className="f">Việc<input id="nt-title" className="inp" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></label>
    <label className="f">Mô tả<textarea id="nt-detail" className="inp" value={f.detail} onChange={e => setF({ ...f, detail: e.target.value })} /></label>
    <div className="grid g3">
      <label className="f">Nhóm<select id="nt-cat" className="inp" value={f.category} onChange={e => setF({ ...f, category: e.target.value as any })}>{['Khách hàng', 'Vận hành', 'Nhân sự', 'Chương trình'].map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="f">Ưu tiên<select id="nt-pri" className="inp" value={f.priority} onChange={e => setF({ ...f, priority: e.target.value as any })}><option>cao</option><option>vừa</option><option>thấp</option></select></label>
      <label className="f">Người phụ trách<select id="nt-owner" className="inp" value={f.ownerId} onChange={e => setF({ ...f, ownerId: e.target.value })}>{s.staff.filter(x => x.role !== 'ceo').map(x => <option key={x.id} value={x.id}>{x.name} · {D.ROLE_LABEL[x.role]}</option>)}</select></label>
    </div>
  </Modal>
}

// ═══════════════════════════ 2. KHÁCH HÀNG ═══════════════════════════
type CTab = 'overview' | 'vip' | 'feedback' | 'programs' | 'roi' | 'intervene'
export function LeaderCustomers() {
  const { s, openCustomer, addTask, me, setFeedback, user } = useStore()
  const [tab, setTab] = useState<CTab>('overview')
  const [seg, setSeg] = useState('Tất cả')
  const segs = ['Khách mới', 'Khách quay lại', 'Đang dùng liệu trình', 'Lâu chưa đến']
  const shown = s.customers.filter(c => seg === 'Tất cả' || custSegment(c) === seg)
  const fbGroups = Object.entries(s.feedback.filter(f => f.group !== 'Khen').reduce((m, f) => { (m[f.group] ??= []).push(f); return m }, {} as Record<string, D.Feedback[]>)).sort((a, b) => b[1].length - a[1].length)
  const intervene = alerts(s).filter(a => a.who === 'leader')
  const taken = new Set(s.tasks.map(t => t.sourceKey))
  const isLeader = user.role === 'leader'
  return <>
    <PageHeader eyebrow="Giữ chân & phát triển khách hàng" title="Khách hàng" sub="Leader: chất lượng chuyên môn & ca khó · Lễ tân: quà, đón tiếp, xác nhận lịch · Vượt quyền → chuyển chị" />
    <Seg value={tab} onChange={setTab} items={[{ k: 'overview', label: 'Tổng quan' }, { k: 'vip', label: 'VIP – thân thiết' }, { k: 'feedback', label: 'Phản hồi – mất khách' }, { k: 'programs', label: 'Chương trình chăm sóc' }, { k: 'roi', label: 'Hiệu quả chương trình' }, { k: 'intervene', label: 'Cần Leader can thiệp', badge: intervene.length }]} />
    {tab === 'overview' && <>
      <div className="grid g4">{segs.map(g => <Stat key={g} label={g} value={s.customers.filter(c => custSegment(c) === g).length} tone={g === 'Lâu chưa đến' ? 'r-fg' : 'g-fg'} onClick={() => setSeg(seg === g ? 'Tất cả' : g)} sub={seg === g ? 'đang lọc · bấm để bỏ' : 'bấm để lọc'} />)}</div>
      <CustTable list={shown} onOpen={openCustomer} />
    </>}
    {tab === 'vip' && <div className="grid g2">{s.customers.filter(c => c.vip || c.totalPaid >= 5000000).sort((a, b) => b.totalPaid - a.totalPaid).map(c => { const p = c.packages[0]; const plan = c.lastVisitDays >= 45 ? 'Gọi hỏi lý do, mời quay lại kèm ưu đãi trong khung' : p && D.pkgLeft(p) <= 2 ? 'Tư vấn tái tục theo tiến triển' : 'Giữ KTV quen, hỏi thăm sau buổi'
      return <div key={c.id} className="card pad col"><div className="row"><Av name={c.name} /><b>{c.name}</b><Pill tone="yellow">VIP</Pill><span className="right-al small num">{D.vnd(c.totalPaid)}</span></div>
        <div className="small muted">{c.visits} lượt · lần cuối {c.lastVisitDays ? `${c.lastVisitDays} ngày trước` : 'hôm nay'}{p && ` · ${p.cardCode} còn ${D.pkgLeftLabel(p)}`}</div>
        <div className="small">Kế hoạch chăm sóc: <b>{plan}</b></div>
        <div className="tiny muted">{c.care[0] ? `Gần nhất: ${c.care[0].at} · ${c.care[0].text}` : 'Chưa có lịch sử chăm sóc'}</div>
        <div className="row"><button className="btn sm" onClick={() => openCustomer(c.id)}>Lịch sử</button>{isLeader && <button className="btn sm" onClick={() => addTask({ title: `Chăm sóc VIP ${c.name}`, detail: plan, category: 'Khách hàng', priority: 'vừa', ownerId: me.id, customerId: c.id })}>Tạo việc</button>}</div></div> })}</div>}
    {tab === 'feedback' && <div className="split">
      <div className="card list">{s.feedback.slice().sort((a, b) => a.rating - b.rating).map(f => <div key={f.id} className="item"><Pill tone={f.rating >= 4 ? 'green' : f.rating === 3 ? 'yellow' : 'red'}>{f.rating}/5</Pill><div className="body"><div className="t">{cust(s, f.customerId).name} · {f.group}</div><div className="d">{f.text}{f.ktvId && ` · KTV ${D.staffName(f.ktvId)}`} · {f.daysAgo ? `${f.daysAgo} ngày trước` : 'hôm nay'}{f.handlerId && ` · xử lý: ${D.staffName(f.handlerId)}`}</div></div>
        {isLeader && f.status !== 'đã xử lý' ? <select className="inp" style={{ width: 130 }} value={f.status} onChange={e => setFeedback(f.id, e.target.value as any)}><option>mới</option><option>đang xử lý</option><option>đã xử lý</option></select> : <Pill tone={f.status === 'đã xử lý' ? 'green' : 'yellow'}>{f.status}</Pill>}</div>)}</div>
      <div className="card pad col"><b>Nhóm vấn đề (30 ngày)</b>{fbGroups.map(([g, fs]) => <div key={g} className="col" style={{ gap: 3 }}><div className="row small"><span>{g}</span><span className="right-al num strong">{fs.length} lần</span></div><div className="bar"><i style={{ width: `${(fs.length / fbGroups[0][1].length) * 100}%` }} /></div><span className="tiny muted">Lặp lại nhiều nhất {Math.max(...fs.map(f => f.repeat ?? 1))} lần/tháng · chưa xong {fs.filter(f => f.status !== 'đã xử lý').length}</span></div>)}
        <div className="tiny muted">Phản hồi chưa đủ để kết luận do KTV — đối chiếu nguồn khách, lịch trống, hủy lịch trước khi quy trách nhiệm.</div></div>
    </div>}
    {tab === 'programs' && <ProgramsPanel ownerFilter={me.id} />}
    {tab === 'roi' && <RoiPanel />}
    {tab === 'intervene' && <div className="card list">{intervene.map(a => <div key={a.key} className="item"><span className={`sev ${a.level}`} /><div className="body"><div className="t">{a.title}</div><div className="d">{a.detail}</div></div>{a.customerId && <button className="btn sm ghost" onClick={() => openCustomer(a.customerId!)}>Hồ sơ</button>}
      {isLeader && (taken.has(a.key) ? <Pill tone="green">Đã có việc</Pill> : <button className="btn sm" onClick={() => addTask({ title: a.title, detail: a.detail, category: 'Khách hàng', priority: a.level, ownerId: me.id, customerId: a.customerId, sourceKey: a.key })}>Nhận việc</button>)}</div>)}
      {!intervene.length && <Empty>Không có khách cần can thiệp</Empty>}</div>}
  </>
}
function CustTable({ list, onOpen }: { list: D.Customer[]; onOpen: (id: string) => void }) {
  return <div className="card tbl-wrap"><table className="resp"><thead><tr><th>Khách</th><th>Nhóm</th><th>Lượt</th><th>Lần cuối</th><th>Thẻ</th><th>Nguồn</th></tr></thead><tbody>
    {list.map(c => <tr key={c.id} onClick={() => onOpen(c.id)} style={{ cursor: 'pointer' }}><td className="strong">{c.name} {c.vip && <Pill tone="yellow">VIP</Pill>}</td><td><Pill tone={custSegment(c) === 'Lâu chưa đến' ? 'red' : custSegment(c) === 'Khách mới' ? 'purple' : 'green'}>{custSegment(c)}</Pill></td><td className="num">{c.visits}</td><td className="num">{c.lastVisitDays ? `${c.lastVisitDays} ngày` : 'hôm nay'}</td><td className="small">{c.packages.map(p => `${p.cardCode}: ${D.pkgLeftLabel(p)}`).join(', ') || '—'}</td><td className="small muted">{c.source}</td></tr>)}
  </tbody></table></div>
}

export function ProgramsPanel({ ownerFilter }: { ownerFilter?: string }) {
  const { s, addProgram, me } = useStore()
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ name: '', type: 'Sinh nhật' as D.Program['type'], target: '', budget: 1000000, discount: '' })
  const list = [...s.programs].sort((a, b) => (a.ownerId === ownerFilter ? -1 : 0) - (b.ownerId === ownerFilter ? -1 : 0))
  return <>
    <div className="row"><span className="small muted">Ngân sách ≤ {D.vnd(BUDGET_LIMIT)} và không đổi giá/ưu đãi: Leader tự triển khai & báo cáo. Có ưu đãi hoặc vượt ngân sách: gửi chị duyệt trước.</span><button className="btn pri right-al" onClick={() => setAdding(true)}><Icon n="plus" />Chương trình mới</button></div>
    <div className="grid g2">{list.map(p => <div key={p.id} className="card pad col"><div className="row"><b>{p.name}</b><Pill tone="purple">{p.type}</Pill><span className="right-al"><Pill tone={p.status === 'Đang chạy' ? 'green' : p.status === 'Chờ duyệt' ? 'yellow' : 'grey'}>{p.status}</Pill></span></div>
      <div className="small muted">Đối tượng: {p.target} · phụ trách {D.staffName(p.ownerId)}{p.discount && ` · ưu đãi: ${p.discount}`}</div>
      <div className="small">Ngân sách {D.vnd(p.budget)} · đã chi {D.vnd(p.cost)} · thu về <b>{D.vnd(p.revenue)}</b></div></div>)}</div>
    {adding && <Modal title="Chương trình chăm sóc mới" onClose={() => setAdding(false)} footer={<><button className="btn" onClick={() => setAdding(false)}>Hủy</button><button className="btn pri" disabled={!f.name.trim() || !f.target.trim()} onClick={() => { addProgram({ name: f.name.trim(), type: f.type, target: f.target.trim(), budget: f.budget, discount: f.discount.trim() || undefined, ownerId: me.id }); setAdding(false) }}>{f.budget > BUDGET_LIMIT || f.discount.trim() ? 'Gửi chị duyệt' : 'Bắt đầu chương trình'}</button></>}>
      <label className="f">Tên<input id="pg-name" className="inp" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <div className="grid g2"><label className="f">Loại<select id="pg-type" className="inp" value={f.type} onChange={e => setF({ ...f, type: e.target.value as any })}>{['Sinh nhật', 'Tri ân', 'Giới thiệu bạn', 'Tái tục', 'Marketing'].map(t => <option key={t}>{t}</option>)}</select></label>
        <label className="f">Ngân sách<input id="pg-budget" className="inp num" type="number" step={100000} min={0} value={f.budget} onChange={e => setF({ ...f, budget: +e.target.value })} /></label></div>
      <label className="f">Đối tượng khách<input id="pg-target" className="inp" value={f.target} onChange={e => setF({ ...f, target: e.target.value })} placeholder="VD: khách lẻ 2–3 lượt, 30 ngày chưa quay lại" /></label>
      <label className="f">Ưu đãi / đổi giá (nếu có → chị duyệt)<input id="pg-disc" className="inp" value={f.discount} onChange={e => setF({ ...f, discount: e.target.value })} placeholder="Để trống nếu không có ưu đãi giá" /></label>
    </Modal>}
  </>
}
export function RoiPanel() {
  const { s } = useStore()
  return <div className="grid g2">{s.programs.filter(p => p.reached > 0).map(p => { const steps: [string, number][] = [['Tiếp cận', p.reached], ['Đặt lịch', p.booked], ['Đến thực tế', p.arrived]]; const roi = p.cost ? p.revenue / p.cost : 0
    return <div key={p.id} className="card pad col"><div className="row"><b>{p.name}</b><span className="right-al"><Pill tone={roi >= 3 ? 'green' : roi >= 1.5 ? 'yellow' : 'red'}>Thu/chi ×{roi.toFixed(1)}</Pill></span></div>
      <div className="funnel" style={{ marginTop: 14 }}>{steps.map(([l, n]) => <div key={l} style={{ height: `${Math.max(8, (n / p.reached) * 100)}%` }}><span className="num">{n}</span></div>)}</div>
      <div className="row tiny muted">{steps.map(([l, n], i) => <span key={l} style={{ flex: 1, textAlign: 'center' }}>{l}{i > 0 && ` (${Math.round(n / steps[i - 1][1] * 100)}%)`}</span>)}</div>
      <div className="row small"><span>Tiền đã thu <b className="num">{D.vnd(p.revenue)}</b></span><span className="right-al">Chi phí <b className="num">{D.vnd(p.cost)}</b></span></div>
      <div className="tiny muted">Chi phí / khách đến: {p.arrived ? D.vnd(p.cost / p.arrived) : '—'}</div></div> })}</div>
}

// ═══════════════════════════ 3. HỎI ĐÁP MỘC ═══════════════════════════
type Answer = { q: string; title: string; facts: string[]; hyps: string[]; next: string[]; sop?: string; task?: Partial<D.Task>; noRule?: boolean }
const PERMS: Record<D.Role, { can: string[]; cannot: string[] }> = {
  ktv: { can: ['Xem ca, tour, khách được giao của chính mình', 'Báo dọn dẹp, bill, đánh giá, sản phẩm, sự cố', 'Xem điểm uy tín và lý do'], cannot: ['Xem SĐT khách, lương/HR người khác', 'Tự chia tour, tạo/sửa hóa đơn', 'Sửa điểm uy tín, duyệt nghỉ/đổi ca, sửa SOP'] },
  reception: { can: ['Lịch hẹn, chia tour, thu ngân, hồ sơ khách (có SĐT)', 'Đối soát bill nhóm, xác nhận sản phẩm, chốt ca', 'Ghi nhận điểm uy tín (Leader/CEO duyệt)'], cannot: ['Xóa hóa đơn (gửi chị duyệt)', 'Đổi giá/ưu đãi ngoài khung đã duyệt', 'Tự quyết điểm uy tín của đồng nghiệp', 'Xuất file dữ liệu khách (chỉ CEO)'] },
  leader: { can: ['Giao việc, kiểm tra dọn dẹp, duyệt điểm uy tín', 'Chương trình ≤ 2tr không đổi giá'], cannot: ['Đổi giá, ngân sách vượt mức, hoàn tiền (chị duyệt)'] },
  ceo: { can: ['Toàn quyền, xem mọi giao diện, xuất file'], cannot: [] },
  marketing: { can: ['Nội dung, chiến dịch, nguồn khách, CSKH AI theo quyền'], cannot: ['Đổi giá/ưu đãi, ngân sách vượt mức (chị duyệt)', 'Xem SĐT khách khi không được cấp'] },
}
function answer(s: State, q: string, me?: D.Staff): Answer {
  const t = q.toLowerCase()
  const w = D.HISTORY.week
  if (me) {
    if (/ca nào|tour thứ|thứ tự tour/.test(t)) { const o = tourOrder(s); const pos = o.indexOf(me.id)
      return { q, title: 'Ca & tour hôm nay của bạn', facts: [me.shift ? `Bạn làm ${D.SHIFTS[me.shift].label}.` : 'Bạn không xếp ca theo giờ.', ...(pos >= 0 ? [`Bạn đang đứng thứ ${pos + 1}/${o.length} trong hàng xoay tour.`] : []), `Chấm công: ${s.attendance[me.id]?.in != null ? `đã vào lúc ${D.hhmm(s.attendance[me.id].in!)}` : 'chưa chấm — bấm "Quét QR chấm công" ở Hôm nay'}.`], hyps: [], next: ['Muốn đổi ca: Hôm nay → mục 1 → "Xin đổi ca" → CEO duyệt.'] } }
    if (/việc gì chưa xong|còn việc/.test(t)) { const z = myZones(s, me.id).filter(n => { const r = zoneReport(s, n); return !r || r.status === 'Chưa đạt' })
      const tk = s.tasks.filter(x => x.ownerId === me.id && (x.status === 'open' || x.status === 'doing'))
      const pr = s.productLogs.filter(p => (me.role === 'reception' ? !p.recOk : p.ktvId === me.id && !p.ktvOk))
      const facts = [...z.map(n => `Khu dọn số ${n} (${D.ZONES[n - 1].name}) ${zoneReport(s, n)?.status === 'Chưa đạt' ? 'chưa đạt — cần làm lại' : 'chưa báo cáo'}.`), ...tk.map(x => `Việc: ${x.title}`), ...(pr.length ? [`${pr.length} lượt sản phẩm chờ bạn xác nhận.`] : []), ...(me.role === 'ktv' && !s.bills.some(b => b.staffId === me.id) ? ['Chưa tải ảnh bill hôm nay.'] : []), ...(me.role === 'reception' && !s.billCheck ? ['Chưa xác nhận Bill Money nhóm.'] : [])]
      return { q, title: 'Việc còn lại của bạn', facts: facts.length ? facts : ['Bạn đã xong các việc được giao. 👏'], hyps: [], next: ['Mở mục tương ứng ở "Hôm nay" để làm tiếp.'] } }
    if (/điểm uy tín/.test(t)) { const mine = s.points.filter(p => p.staffId === me.id)
      return { q, title: `Điểm uy tín: ${pointsOf(s, me.id)} điểm đã duyệt`, facts: mine.length ? mine.map(p => `${p.delta > 0 ? '+' : ''}${p.delta} · ${p.reason} · ${p.source} · ${p.status}`) : ['Chưa có thay đổi điểm hôm nay.'], hyps: [], next: ['Mộc chỉ giải thích — không tự cộng/trừ, xóa vi phạm hay quyết định thưởng/phạt.', 'Điểm có tranh chấp do Leader/CEO duyệt.'] } }
    if (/nghỉ|đổi ca/.test(t)) return { q, title: 'Xin nghỉ / đổi ca', facts: ['Bước 1: Hôm nay → mục "Xin nghỉ phép" (hoặc mục 1 → "Xin đổi ca").', 'Bước 2: chọn ngày, ghi lý do / người đổi.', 'Bước 3: bấm "Gửi đơn" → vào hộp duyệt của chị (CEO).', 'Bước 4: khi được duyệt, bảng chia ca 4 tuần tự cập nhật OFF.'], hyps: [], next: [] }
    if (/được xem|quyền/.test(t)) { const pm = PERMS[me.role]; return { q, title: 'Quyền hạn & bảo mật dữ liệu', facts: pm.can, hyps: [], next: pm.cannot.map(x => `Không được: ${x}`) } }
    if (/học gì|đào tạo/.test(t)) { const fb = s.feedback.filter(f => f.ktvId === me.id && f.rating <= 3)
      return { q, title: 'Gợi ý học tiếp', facts: fb.length ? fb.map(f => `Phản hồi ${f.rating}/5 nhóm "${f.group}": ${f.text}`) : ['Chưa có phản hồi chưa tốt gần đây.'], hyps: fb.length ? [`Kỹ năng cần luyện: ${[...new Set(fb.map(f => f.group))].join(', ')}`] : [], next: ['Chu trình: Học → Test → Tìm điểm yếu → Lộ trình → Nhắc luyện → Test lại.', 'Đánh giá tay nghề cuối cùng do Leader/người phụ trách đào tạo quyết định.'] } }
    if (/tiến bộ/.test(t)) { const tours = s.appts.filter(a => a.ktvId === me.id && ['done', 'paid'].includes(a.status)).length
      return { q, title: 'Phát triển cá nhân', facts: [`Hôm nay đã xong ${tours} tour.`, `Khách yêu cầu bạn: ${s.appts.filter(a => a.ktvId === me.id && a.requested).length}.`, `Điểm uy tín đã duyệt: ${pointsOf(s, me.id)}.`], hyps: [], next: ['Xem chi tiết ở "Của tôi" → Hiệu suất.'] } }
    if (/quy chuẩn|văn hóa/.test(t)) return { q, title: 'Quy chuẩn Home Spa', facts: ['Theo quy chuẩn Home Spa đã được phê duyệt: chào khách bằng tên, hỏi vùng đau & lực mong muốn trước khi làm.', 'Mắc lỗi: nhận lỗi, xin lỗi, báo sớm cho lễ tân/Leader — không giấu.', 'Phối hợp: hỗ trợ đồng đội khi rảnh tour, giữ khu vực chung sạch.'], hyps: [], next: ['Câu chưa có trong quy chuẩn → Mộc báo cần Leader/CEO xác nhận.'] }
    if (/lâu chưa quay lại/.test(t)) { const l = s.customers.filter(c => c.lastVisitDays >= 30).sort((a, b) => b.lastVisitDays - a.lastVisitDays)
      return { q, title: 'Khách lâu chưa quay lại (≥ 30 ngày)', facts: l.map(c => `${c.name} · ${c.lastVisitDays} ngày · ${c.packages.length ? 'liệu trình' : 'khách lẻ'}`), hyps: [], next: ['Khách hàng → lọc "Lâu chưa quay lại" → Kịch bản mục tiêu → Ghi CSKH.'] } }
    if (/thiếu tiền/.test(t)) { const l = s.customers.flatMap(c => c.packages.filter(p => D.pkgOwed(p) > 0).map(p => `${c.name} · ${p.cardCode} còn thiếu ${D.vnd(D.pkgOwed(p))}`))
      return { q, title: 'Khách còn thiếu tiền gói', facts: l.length ? l : ['Không có khách còn thiếu.'], hyps: [], next: ['Thu tiếp tại Thu ngân → chọn "Đóng tiếp".'] } }
    if (/chốt ca/.test(t)) return { q, title: 'Chốt ca cần kiểm tra', facts: ['Tiền: so tiền mặt / chuyển khoản / thẻ thực đếm với số hệ thống tính từ hóa đơn.', ...D.BOOK_CHECKS.map(x => `Sổ sách: ${x}`)], hyps: [], next: ['Hôm nay → "Chốt ca". Lệch tiền phải ghi lý do — Leader & chị nhận thông báo.'] }
  }
  if (/quay lại|giảm khách|khách giảm/.test(t)) {
    const worst = [...D.RETURN_BY_GROUP].sort((a, b) => (a.now - a.prev) / a.prev - (b.now - b.prev) / b.prev)[0]
    return { q, title: 'Khách quay lại tuần này', facts: [`(${D.SAMPLE_NOTE}) Khách quay lại: ${w.now.returning} (tuần trước ${w.prev.returning}) → giảm ${w.prev.returning - w.now.returning} khách, tương đương ${Math.abs(D.pctChange(w.now.returning, w.prev.returning))}%.`, ...D.RETURN_BY_GROUP.map(g => `${g.group}: ${g.now} (trước ${g.prev}, ${D.pctChange(g.now, g.prev)}%)`), `Giảm mạnh nhất: ${worst.group}.`],
      hyps: ['Thời gian chờ cuối tuần tăng (phản hồi "Thời gian chờ" lặp lại 3 lần) — cần đối chiếu giờ đến/giờ bắt đầu.', 'Khách lẻ chưa được mời gói/tái hẹn sau buổi đầu — kiểm tra ghi chú chăm sóc.', 'Chưa đủ dữ liệu để kết luận do KTV: cần xem nguồn khách, lịch trống, hủy lịch.'],
      next: [`Lọc danh sách "${worst.group}" chưa quay lại > 30 ngày, gọi hỏi lý do.`, 'So sánh lịch trống giờ cao điểm 2 tuần gần nhất.'], task: { title: `Gọi lại nhóm "${worst.group}" chưa quay lại > 30 ngày`, detail: 'Hỏi lý do, ghi vào hồ sơ, mời tái hẹn trong khung ưu đãi đã duyệt', category: 'Khách hàng', priority: 'cao' } }
  }
  if (/đặt lịch nhiều|đến ít|không đến|no.?show|hủy/.test(t)) {
    const ns = s.appts.filter(a => a.status === 'no_show').length, late = s.appts.filter(a => a.status === 'booked' && s.now - a.start > 10).length
    return { q, title: 'Đặt lịch nhiều nhưng đến ít', facts: [`(${D.SAMPLE_NOTE}) Tỷ lệ đến tuần này ${w.now.showRate}% (tuần trước ${w.prev.showRate}%, mục tiêu ${w.target.showRate}%).`, `Hôm nay: ${ns} không đến, ${late} đang trễ hẹn > 10 phút.`],
      hyps: ['Chưa nhắc lịch trước 1–2 giờ.', 'Đặt qua kênh online (Website/Messenger) dễ bỏ hẹn hơn đặt qua điện thoại — cần thống kê theo kênh.', 'Khung giờ đặt quá xa ngày đặt.'], next: ['Lễ tân nhắn xác nhận lịch trước 1 giờ cho mọi lịch hẹn.', 'Theo dõi tỷ lệ đến theo kênh đặt trong 2 tuần.'], sop: 'sop-tour', task: { title: 'Nhắn xác nhận lịch trước 1 giờ', detail: 'Áp dụng cho mọi lịch hẹn, ghi lại khách không phản hồi', category: 'Vận hành', priority: 'vừa', ownerId: D.firstOf('reception') } }
  }
  if (/chờ|cao điểm|thời gian chờ/.test(t)) {
    const fb = s.feedback.filter(f => f.group === 'Thời gian chờ').length
    return { q, title: 'Giảm thời gian chờ giờ cao điểm', facts: [`(${D.SAMPLE_NOTE}) Thời gian chờ TB tuần: ${w.now.waitAvg} phút (tuần trước ${w.prev.waitAvg}, mục tiêu ${w.target.waitAvg}).`, `${fb} phản hồi nhóm "Thời gian chờ"; hiện ${s.queue.length} khách đang chờ chia tour.`, 'Sáng kiến "Giảm thời gian chờ cuối tuần" đang chạy: 14 → 9 phút sau 2 tuần.'],
      hyps: ['Giường chưa dọn kịp giữa 2 khách (cần ≥ 10 phút).', 'Lịch hẹn xếp sát nhau, không có đệm.'], next: ['Giãn khung lịch 15 phút giờ cao điểm.', 'Bật checklist dọn giường bắt buộc trước khi "Bắt đầu".'], task: { title: 'Thử giãn khung lịch 15 phút thứ 7–CN', detail: 'Theo dõi thời gian chờ & phản hồi 2 tuần, báo cáo kết quả trước/sau', category: 'Vận hành', priority: 'vừa' } }
  }
  if (/dự án|sáng kiến|kế hoạch/.test(t)) return { q, title: 'Mẫu lập sáng kiến / dự án', facts: ['Mẫu thống nhất: Vấn đề có dữ liệu → Mục tiêu → Giải pháp → Người phối hợp → Ngân sách → Hạn hoàn thành → Kết quả trước/sau → Đề xuất duy trì hoặc điều chỉnh.', `Ngân sách ≤ ${D.vnd(BUDGET_LIMIT)}: Leader tự làm & báo cáo. Vượt mức: gửi chị duyệt trước.`], hyps: [], next: ['Vào "Của tôi" → Sáng kiến & dự án → Tạo mới.'] }
  if (/marketing|chương trình|ưu đãi|khuyến mãi/.test(t)) {
    const best = [...s.programs].filter(p => p.cost).sort((a, b) => b.revenue / b.cost - a.revenue / a.cost)[0]
    return { q, title: 'Ý tưởng chương trình theo nhóm khách', facts: [`Hiệu quả nhất hiện tại: "${best.name}" — thu/chi ×${(best.revenue / best.cost).toFixed(1)}.`, `${s.customers.filter(c => custSegment(c) === 'Lâu chưa đến').length} khách lâu chưa đến; ${s.customers.filter(c => c.packages.some(p => p.type === 'session' && D.pkgLeft(p) <= 2)).length} khách gói còn ≤ 2 buổi.`],
      hyps: ['Khách lẻ 2–3 lượt phù hợp "buổi thứ 4 tặng gội 45 phút".', 'Khách nước ngoài cần nội dung tiếng Anh, đặt qua Google Maps.'], next: ['Mọi ưu đãi giá phải gửi chị duyệt trước khi chạy.'], task: { title: 'Soạn chương trình cho khách lẻ 2–3 lượt', detail: 'Đề xuất ưu đãi, ngân sách, cách đo hiệu quả (tiếp cận → đặt → đến → tiền thu → chi phí)', category: 'Chương trình', priority: 'thấp' } }
  }
  if (/báo cáo|ceo|chị/.test(t)) return { q, title: 'Soạn báo cáo / đề xuất cho chị', facts: ['Báo cáo tuần chỉ trả lời 6 câu: kết quả so mục tiêu & kỳ trước · điểm nghẽn lớn nhất · nguyên nhân có bằng chứng / đang kiểm tra · đã chủ động làm gì · 3 ưu tiên tuần tới · cần chị quyết định gì, trước ngày nào.', 'Số liệu tuần đã được điền sẵn trong mẫu.'], hyps: [], next: ['Vào "Của tôi" → Báo cáo tuần.'] }
  for (const sop of D.SOPS) if (t.includes(sop.title.toLowerCase().replace('quy trình ', '').split(' ')[0]) || (/dọn/.test(t) && sop.id === 'sop-don') || (/khiếu nại|phàn nàn/.test(t) && sop.id === 'sop-kn') || (/chia tour/.test(t) && sop.id === 'sop-tour') || (/tái tục/.test(t) && sop.id === 'sop-tt'))
    return { q, title: sop.title, facts: sop.steps.map((x, i) => `Bước ${i + 1}: ${x}`), hyps: [], next: [], sop: sop.id }
  if (/ktv|kỹ thuật viên|nhân viên/.test(t)) return { q, title: 'Đánh giá KTV', facts: s.feedback.filter(f => f.ktvId).map(f => `${D.staffName(f.ktvId)}: ${f.group} ${f.rating}/5 (${f.daysAgo ? `${f.daysAgo} ngày trước` : 'hôm nay'})`), hyps: ['Một vài phản hồi chưa đủ kết luận — cần xem số tour, khung giờ, loại dịch vụ.'], next: ['Kèm cặp trực tiếp 1 buổi, ghi kết quả trước/sau.'] }
  return { q, title: 'Chưa có quy định của Home', facts: [], hyps: [], next: ['Mộc chưa có dữ liệu hoặc quy định cho câu hỏi này. Đề nghị chuyển chị hoặc bổ sung quy trình.'], noRule: true, task: { title: `Bổ sung quy định: ${q.slice(0, 60)}`, detail: 'Câu hỏi chưa có quy định của Home', category: 'Vận hành', priority: 'thấp' } }
}
const PROMPTS = ['Tuần này khách quay lại giảm ở nhóm nào?', 'Khách đặt lịch nhiều nhưng đến ít, cần kiểm tra gì?', 'Đề xuất cách giảm thời gian chờ giờ cao điểm', 'Lên chương trình marketing cho từng nhóm khách', 'Soạn báo cáo đề xuất cho CEO', 'Quy trình xử lý khiếu nại']
export function MocScreen({ groups }: { groups?: { t: string; q: string }[] }) {
  const { s, me, user, requestApproval } = useStore()
  const [log, setLog] = useState<Answer[]>(() => groups?.length ? [] : [answer(s, PROMPTS[0], me)])
  const [q, setQ] = useState('')
  const [sop, setSop] = useState<string | null>(null)
  const [taskPreset, setTaskPreset] = useState<Partial<D.Task> | null>(null)
  const ask = (text: string) => { if (!text.trim()) return; setLog(l => [...l, answer(s, text.trim(), me)]); setQ('') }
  const canTask = user.role === 'leader' || user.role === 'ceo' || user.role === 'marketing'
  return <>
    <Hero tag="Hỏi đáp Mộc" title="Mộc luôn ở đây" sub="Hướng dẫn · nhắc việc · gia sư · giải thích dữ liệu của chính bạn. Mộc tách “dữ liệu đã xác nhận” với “giả thuyết”, và báo rõ khi Home chưa có quy định." />
    {groups?.length ? <div className="nodes">{groups.map((g, i) => <button key={g.t} className="node" onClick={() => ask(g.q)}><span className="no">{i + 1}</span><span className="body"><span className="t" style={{ display: 'block' }}>{g.t}</span><span className="d" style={{ display: 'block' }}>VD: {g.q}</span></span><span className="arr"><Icon n="arrow" s={18} /></span></button>)}</div>
      : <div className="row">{PROMPTS.map(p => <button key={p} className="btn sm" onClick={() => ask(p)}>{p}</button>)}</div>}
    <div className="chat">{log.map((a, i) => <div key={i} className="col"><div className="bubble me">{a.q}</div>
      <div className="bubble moc"><b>{a.title}</b>
        {a.facts.length > 0 && <><h4 className="fact">Dữ liệu đã xác nhận</h4><ul>{a.facts.map((f, j) => <li key={j}>{f}</li>)}</ul></>}
        {a.hyps.length > 0 && <><h4 className="hyp">Giả thuyết cần kiểm tra</h4><ul>{a.hyps.map((f, j) => <li key={j}>{f}</li>)}</ul></>}
        {a.next.length > 0 && <><h4 className="next">{a.noRule ? 'Lưu ý' : 'Bước tiếp theo'}</h4><ul>{a.next.map((f, j) => <li key={j}>{f}</li>)}</ul></>}
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn sm" disabled={!a.sop} onClick={() => setSop(a.sop!)}>Mở quy trình</button>
          {canTask && <button className="btn sm" onClick={() => setTaskPreset(a.task ?? { title: a.title, detail: a.facts.join(' ') })}>Tạo việc cần làm</button>}
          {a.noRule ? <button className="btn sm" onClick={() => requestApproval({ kind: 'Chuyển vượt quyền', title: `Chưa có quy định: ${a.q.slice(0, 70)}`, detail: 'Mộc chưa có dữ liệu/quy định — đề nghị chị quyết định hoặc ban hành quy trình' })}>{canTask ? 'Chuyển chị quyết định' : 'Gửi Leader/chị bổ sung quy định'}</button>
            : canTask && <button className="btn sm" onClick={() => setTaskPreset({ ...(a.task ?? { title: a.title }), ownerId: a.task?.ownerId ?? D.firstOf('reception') })}>Chuyển người phụ trách</button>}
        </div></div></div>)}</div>
    <form className="row" onSubmit={e => { e.preventDefault(); ask(q) }} style={{ position: 'sticky', bottom: 0, background: 'var(--bg)', paddingBlock: 8 }}>
      <input id="moc-q" className="inp" style={{ flex: 1 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Hỏi Mộc về số liệu, quy trình, sáng kiến…" /><button className="btn pri" type="submit">Hỏi</button></form>
    {sop && (() => { const p = D.SOPS.find(x => x.id === sop)!; return <Modal title={p.title} onClose={() => setSop(null)}><ol>{p.steps.map((x, i) => <li key={i} style={{ marginBottom: 6 }}>{x}</li>)}</ol></Modal> })()}
    {taskPreset && <NewTaskModal preset={taskPreset} onClose={() => setTaskPreset(null)} />}
  </>
}

// ═══════════════════════════ 4. CỦA TÔI ═══════════════════════════
type Per = 'day' | 'week' | 'month'
const METRICS: { k: keyof typeof D.HISTORY.day.prev; label: string; unit?: string; invert?: boolean }[] = [
  { k: 'newCust', label: 'Khách mới' }, { k: 'returning', label: 'Khách quay lại' }, { k: 'revenue', label: 'Tiền đã thu', unit: 'đ' },
  { k: 'bookings', label: 'Lượt đặt lịch' }, { k: 'showRate', label: 'Tỷ lệ đến', unit: '%' }, { k: 'waitAvg', label: 'Chờ trung bình', unit: ' phút', invert: true },
]
export function MineScreen() {
  const st = useStore(); const { s, me } = st
  const [per, setPer] = useState<Per>('week')
  const [report, setReport] = useState(false)
  const [ini, setIni] = useState<string | 'new' | null>(null)
  const todayNow = useMemo(() => {
    const past = s.appts.filter(a => a.start <= s.now)
    return { newCust: s.customers.filter(c => c.firstVisit === D.dateShort()).length, returning: s.appts.filter(a => ['in_service', 'done', 'paid'].includes(a.status) && cust(s, a.customerId).visits > 1).length,
      revenue: s.invoices.filter(i => i.status !== 'Nháp' && i.status !== 'Đã xóa').reduce((t, i) => t + i.paid, 0), bookings: s.appts.length,
      showRate: past.length ? Math.round(past.filter(a => a.status !== 'no_show' && !(a.status === 'booked' && s.now - a.start > 10)).length / past.length * 100) : 100, waitAvg: (() => { const w = s.appts.filter(a => a.waitMin != null); return w.length ? Math.round(w.reduce((t, a) => t + a.waitMin!, 0) / w.length) : D.HISTORY.day.prev.waitAvg })() }
  }, [s])
  const cur = per === 'day' ? todayNow : D.HISTORY[per].now, prev = D.HISTORY[per].prev, target = D.HISTORY[per].target
  const myTasks = s.tasks.filter(t => t.ownerId === me.id || t.createdBy === me.id)
  const done = myTasks.filter(t => t.status === 'done' && t.startedMin != null && t.doneMin != null)
  const avgHandle = done.length ? Math.round(done.reduce((x, t) => x + (t.doneMin! - t.startedMin!), 0) / done.length) : 0
  const early = s.tasks.filter(t => t.earlyReport).length
  const mineIni = s.initiatives.filter(i => i.ownerId === me.id)
  const verified = mineIni.filter(i => i.status === 'Đã kiểm chứng').length
  const fbBad = s.feedback.filter(f => f.rating <= 3), fbFixed = fbBad.filter(f => f.status === 'đã xử lý').length
  const loadsAll = D.ktvs().map(k => s.appts.filter(a => a.ktvId === k.id && !['cancelled', 'no_show'].includes(a.status)).length)
  const loadSpread = Math.max(...loadsAll) - Math.min(...loadsAll)
  // Không chấm theo số ý tưởng hay báo cáo đẹp; "đã kiểm chứng" phải được chị xác nhận
  const scores = [
    { l: 'Phát hiện vấn đề sớm', w: 25, v: Math.min(100, 50 + early * 10 + fbFixed * 5) },
    { l: 'Tốc độ xử lý', w: 20, v: done.length ? Math.max(40, 100 - Math.max(0, avgHandle - 30)) : 60 },
    { l: 'Tiến độ dự án', w: 15, v: mineIni.length ? Math.round(mineIni.reduce((x, i) => x + i.progress, 0) / mineIni.length) : 0 },
    { l: 'Hiệu quả được chị xác nhận', w: 25, v: mineIni.length ? Math.round(verified / mineIni.length * 100) : 0 },
    { l: 'Chất lượng & tải KTV cân bằng', w: 15, v: Math.max(0, Math.round((fbBad.length ? fbFixed / fbBad.length * 100 : 100) - loadSpread * 10)) },
  ]
  const total = Math.round(scores.reduce((x, c) => x + c.v * c.w, 0) / 100)
  const sent = s.approvals.filter(a => a.fromId === me.id)
  return <>
    <PageHeader eyebrow={`Leader ${me.name}`} title="Của tôi" sub="Kết quả quản lý & đóng góp phát triển — liên kết với dữ liệu ở “Hôm nay”, không cần nhập lại"
      right={<><Seg value={per} onChange={setPer} items={[{ k: 'day', label: 'Ngày' }, { k: 'week', label: 'Tuần' }, { k: 'month', label: 'Tháng' }]} /><button className="btn pri" onClick={() => setReport(true)}>Báo cáo tuần</button></>} />
    <Sec eyebrow="Home đang tăng hay giảm" right={<span className="tiny muted">So kỳ tương đương & mục tiêu · luôn hiện số tuyệt đối và % {per !== 'day' && <Pill tone="yellow">{D.SAMPLE_NOTE}</Pill>}</span>}>
      <div className="grid g3">{METRICS.map(m => { const v = cur[m.k], p = prev[m.k], tg = target[m.k]; const fmt = (n: number) => (m.unit === 'đ' ? D.vndShort(n) : `${n}${m.unit ?? ''}`)
        const hit = m.invert ? v <= tg : v >= tg
        return <div key={m.k} className="card stat" style={{ ['--tone' as any]: hit ? 'var(--g-fg)' : 'var(--y-fg)' }}><span className="l">{m.label}</span><span className="v num">{fmt(v)}</span><Delta now={v} prev={p} invert={m.invert} unit={m.unit === 'đ' ? 'đ' : m.unit === '%' ? ' điểm %' : m.unit} /><span className="tiny muted">Kỳ trước {fmt(p)} · mục tiêu {fmt(tg)} {hit ? '✓' : `· còn thiếu ${fmt(Math.abs(tg - v))}`}</span></div> })}</div>
    </Sec>
    <div className="split">
      <Sec eyebrow="KPI quản lý lễ tân & KTV">
        <div className="card list">
          {[[`${done.length} việc đã xử lý`, `TB ${avgHandle} phút từ lúc nhận đến lúc xong`], [`${early} sự cố được báo sớm`, 'Báo sớm được khuyến khích, không trừ điểm người báo'], [`${s.feedback.filter(f => f.status === 'đã xử lý' && f.rating <= 3).length}/${s.feedback.filter(f => f.rating <= 3).length} phản hồi xấu đã xử lý`, 'Đánh giá cả việc ngăn tái diễn'], [`${s.tasks.filter(t => isRec(s, t.ownerId) && t.status === 'done').length} việc lễ tân hoàn thành`, `${s.tasks.filter(t => isRec(s, t.ownerId) && t.status !== 'done').length} việc đang mở`]].map(([a, b]) => <div key={a} className="item"><div className="body"><div className="t">{a}</div><div className="d">{b}</div></div></div>)}
        </div>
      </Sec>
      <Sec eyebrow="Năng lực lãnh đạo · điểm uy tín">
        <div className="card pad col"><div className="row"><span className="num" style={{ fontSize: 34, fontWeight: 800 }}>{total}</span><span className="muted small">/100 · {total >= 80 ? 'Sẵn sàng nhận dự án lớn hơn' : total >= 60 ? 'Đang phát triển tốt' : 'Cần kèm cặp'}</span></div>
          {scores.map(c => <div key={c.l} className="col" style={{ gap: 3 }}><div className="row small"><span>{c.l} <span className="muted">· {c.w}%</span></span><span className="right-al num strong">{c.v}</span></div><div className="bar"><i style={{ width: c.v + '%' }} /></div></div>)}
          <div className="tiny muted">Số lượng ý tưởng chỉ là chỉ số phụ ({mineIni.length} đề xuất). Không thưởng chỉ vì báo cáo đẹp — xem sáng kiến đã thực hiện và kết quả thực tế.</div>
          <div className="small"><b>Lộ trình:</b> Leader ca → Quản lý vận hành (khi đạt ≥ 80 trong 3 tháng và có ≥ 2 sáng kiến được kiểm chứng)</div></div>
      </Sec>
    </div>
    <Sec eyebrow="Sáng kiến & dự án tôi phụ trách" right={<button className="btn sm pri" onClick={() => setIni('new')}><Icon n="plus" />Tạo mới</button>}>
      <div className="grid g2">{mineIni.map(i => <button key={i.id} className="card pad col" style={{ textAlign: 'left' }} onClick={() => setIni(i.id)}><div className="row"><Pill tone="purple">{i.kind}</Pill><b>{i.title}</b><span className="right-al"><Pill tone={i.status === 'Đã kiểm chứng' ? 'green' : i.status.startsWith('Chờ') ? 'yellow' : 'grey'}>{i.status}</Pill></span></div>
        <div className="small muted">Vấn đề: {i.problem}</div><div className="small">Trước: <b>{i.before}</b>{i.after && <> → Sau: <b>{i.after}</b></>}</div><div className="bar"><i style={{ width: i.progress + '%' }} /></div></button>)}</div>
    </Sec>
    <div className="split">
      <Sec eyebrow="Điểm nghẽn đã tháo gỡ · hiệu quả chương trình">
        <div className="card list">{s.tasks.filter(t => t.status === 'done' && (t.ownerId === me.id || t.createdBy === me.id) && t.category !== 'Chương trình').map(t => <div key={t.id} className="item"><Icon n="check" /><div className="body"><div className="t">{t.title}</div><div className="d">{t.result}</div></div></div>)}
          {s.programs.filter(p => p.ownerId === me.id && p.cost).map(p => <div key={p.id} className="item"><Icon n="chart" /><div className="body"><div className="t">{p.name}</div><div className="d">{p.arrived} khách đến · thu {D.vnd(p.revenue)} · chi {D.vnd(p.cost)}</div></div><Pill tone="green">×{(p.revenue / p.cost).toFixed(1)}</Pill></div>)}</div>
      </Sec>
      <Sec eyebrow="Báo cáo – đề xuất đã gửi chị">
        <div className="card list">{sent.map(a => <div key={a.id} className="item"><div className="body"><div className="t">{a.title}</div><div className="d">{a.kind}{a.note && ` · chị: ${a.note}`}</div></div><Pill tone={a.status === 'Đã duyệt' ? 'green' : a.status === 'Từ chối' ? 'red' : 'yellow'}>{a.status}</Pill></div>)}{!sent.length && <Empty>Chưa gửi báo cáo/đề xuất nào</Empty>}</div>
      </Sec>
    </div>
    {report && <WeeklyReportModal onClose={() => setReport(false)} />}
    {ini && <InitiativeModal id={ini} onClose={() => setIni(null)} />}
  </>
}

function WeeklyReportModal({ onClose }: { onClose: () => void }) {
  const { s, sendReport, me } = useStore()
  const w = D.HISTORY.week
  const doneT = s.tasks.filter(t => t.status === 'done' && (t.ownerId === me.id || t.createdBy === me.id))
  const QUESTIONS = ['Tuần này kết quả thay đổi thế nào so với mục tiêu và kỳ trước?', 'Điểm nghẽn lớn nhất nằm ở đâu?', 'Nguyên nhân nào đã có bằng chứng, nguyên nhân nào đang kiểm tra?', 'Leader đã chủ động làm gì và kết quả ra sao?', 'Tuần tới ưu tiên 3 việc nào?', 'Cần chị quyết định hoặc hỗ trợ điều gì, trước ngày nào?']
  const [a, setA] = useState<string[]>([
    `Doanh thu ${D.vndShort(w.now.revenue)} (mục tiêu ${D.vndShort(w.target.revenue)}, tuần trước ${D.vndShort(w.prev.revenue)}, ${D.pctChange(w.now.revenue, w.prev.revenue)}%). Khách quay lại ${w.now.returning} (tuần trước ${w.prev.returning}: ${w.now.returning - w.prev.returning} khách, ${D.pctChange(w.now.returning, w.prev.returning)}%). [${D.SAMPLE_NOTE} — kiểm tra lại]`,
    '', '',
    doneT.map(t => `${t.title} → ${t.result}`).join('; '),
    '', '',
  ])
  return <Modal wide title="Báo cáo tuần gửi chị" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn pri" disabled={a.slice(0, 5).some(x => !x.trim()) || a[0].includes('kiểm tra lại]')} onClick={() => { sendReport(`${D.weekNo()}/${D.TODAY.getFullYear()}`, a); onClose() }}>Gửi chị</button></>}>
    <div className="small muted">Chỉ trả lời rõ 6 câu. Câu 1 và 4 đã điền sẵn từ dữ liệu — kiểm tra lại trước khi gửi; các câu còn lại Leader tự viết.</div>
    {QUESTIONS.map((q, i) => <label key={i} className="f">{i + 1}. {q}<textarea id={`wr-${i}`} className="inp" value={a[i]} onChange={e => setA(x => x.map((y, j) => (j === i ? e.target.value : y)))} placeholder={i === 5 ? 'VD: Duyệt ngân sách 1,5tr cho chương trình giới thiệu bạn, trước thứ 6' : ''} /></label>)}
  </Modal>
}

function InitiativeModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { s, addInitiative, updateInitiative } = useStore()
  const ex = s.initiatives.find(i => i.id === id)
  const [f, setF] = useState<Omit<D.Initiative, 'id' | 'status' | 'progress' | 'ownerId'>>(ex ?? { kind: 'Sáng kiến', title: '', problem: '', goal: '', solution: '', partners: [], budget: 0, dueLabel: '', before: '', after: '', proposal: '' })
  const [progress, setProgress] = useState(ex?.progress ?? 0)
  const F = (k: keyof typeof f, label: string, ph = '') => <label className="f">{label}<input id={`in-${k}`} className="inp" value={(f as any)[k] ?? ''} onChange={e => setF({ ...f, [k]: e.target.value })} placeholder={ph} /></label>
  return <Modal wide title={ex ? ex.title : 'Sáng kiến / dự án mới'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Đóng</button>
    {ex ? <button className="btn pri" onClick={() => { updateInitiative(ex.id, { ...f, progress }); onClose() }}>Lưu</button>
      : <button className="btn pri" disabled={!f.title || !f.problem || !f.goal || !f.solution || !f.before} onClick={() => { addInitiative(f); onClose() }}>{f.budget > BUDGET_LIMIT ? 'Gửi chị duyệt' : 'Tạo & triển khai'}</button>}</>}>
    <div className="flow">{['Vấn đề có dữ liệu', 'Mục tiêu', 'Giải pháp', 'Người phối hợp', 'Ngân sách', 'Hạn', 'Kết quả trước/sau', 'Đề xuất'].map(x => <span key={x}>{x}</span>)}</div>
    <div className="grid g2">
      <label className="f">Loại<select id="in-kind" className="inp" value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as any })}><option>Sáng kiến</option><option>Dự án</option></select></label>
      {F('title', 'Tên')}
      {F('problem', '1. Vấn đề (kèm số liệu)', 'VD: cuối tuần chờ TB 14 phút, 3 phản hồi')}
      {F('goal', '2. Mục tiêu đo được', 'VD: chờ TB ≤ 7 phút sau 4 tuần')}
      {F('solution', '3. Giải pháp')}
      <label className="f">4. Người phối hợp<input id="in-partners" className="inp" value={f.partners.join(', ')} onChange={e => setF({ ...f, partners: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} placeholder="Lam, Vân, KTV ca 1" /></label>
      <label className="f">5. Ngân sách (đ)<input id="in-budget" className="inp num" type="number" min={0} step={100000} value={f.budget} onChange={e => setF({ ...f, budget: +e.target.value })} /></label>
      {F('dueLabel', '6. Hạn hoàn thành', 'VD: 30/11')}
      {F('before', '7a. Kết quả trước')}
      {F('after', '7b. Kết quả sau (khi đã đo)')}
      <label className="f">8. Đề xuất<select id="in-prop" className="inp" value={f.proposal ?? ''} onChange={e => setF({ ...f, proposal: e.target.value })}><option value="">Chưa có</option><option>Duy trì</option><option>Điều chỉnh</option><option>Dừng</option></select></label>
      {ex && <label className="f">Tiến độ ({progress}%)<input id="in-prog" type="range" min={0} max={100} step={10} value={progress} onChange={e => setProgress(+e.target.value)} /></label>}
    </div>
    {f.budget > BUDGET_LIMIT && <div className="warn small">Ngân sách vượt {D.vnd(BUDGET_LIMIT)} — cần chị duyệt trước khi triển khai.</div>}
  </Modal>
}
