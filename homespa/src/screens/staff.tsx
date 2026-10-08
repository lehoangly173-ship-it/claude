// KTV & LỄ TÂN — 4 nút mẹ: HÔM NAY · (CÔNG VIỆC / VẬN HÀNH) · KHÁCH HÀNG · HỎI ĐÁP MỘC · CỦA TÔI
import { ReactNode, useState, useRef } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { unreadCount, cust, myZones, zoneReport, tourOrder, billRows, overview, alerts, pointsOf, expectedByMethod, ktvState, lastCloseAt } from '../logic'
import { Hero, Tiles, Nodes, Block, ChipGrid, SubHead, Pill, Empty, Modal, Seg, Av, PhotoInput, NodeSpec, Icon } from '../ui'
import { ShiftTourPage, CleaningPage, BoardPage, KtvCustomersPage, NoticesPage, BillsPage, ReviewsPage, ProductsPage, LeavePage, IncidentPage, LeaveModal, IdeaPage } from './daily'
import { T } from '../i18n'
import { OverviewScreen, ScheduleScreen, QueueScreen, BedsScreen } from './ops'
import { CashierScreen } from './cashier'
import { MyWorkScreen } from './ktv'
import { TaskModal, PrioPill } from './leader'

export const BackBtn = ({ to }: { to: string }) => { const { go } = useStore(); return <button className="back" onClick={() => go(to)}><Icon n="back" />Quay lại</button> }

/** Trang con chung của "Hôm nay" — dùng cho KTV, Lễ tân, Leader, CEO */
export function dailySub(key: string | undefined, back: () => void): ReactNode | null {
  switch (key) {
    case 'shift': return <ShiftTourPage back={back} />
    case 'cleaning': return <CleaningPage back={back} />
    case 'board': return <BoardPage back={back} />
    case 'cust': return <KtvCustomersPage back={back} />
    case 'notices': return <NoticesPage back={back} />
    case 'bills': return <BillsPage back={back} />
    case 'reviews': return <ReviewsPage back={back} />
    case 'products': return <ProductsPage back={back} />
    case 'leave': return <LeavePage back={back} />
    case 'incident': return <IncidentPage back={back} />
    case 'idea': return <IdeaPage back={back} />
    case 'close': return <ClosesView back={back} />
  }
  return null
}

function useCounts() {
  const { s, me, user } = useStore()
  const zonesTodo = myZones(s, me.id).filter(n => { const r = zoneReport(s, n); return !r || r.status === 'Chưa đạt' })
  const prodTodo = s.productLogs.filter(p => (user.role === 'reception' ? !p.recOk : p.ktvId === me.id && !p.ktvOk)).length
  const tasksOpen = s.tasks.filter(t => t.ownerId === me.id && (t.status === 'open' || t.status === 'doing')).length
  const unread = unreadCount(s, user.role, me.id)
  const reviewsTodo = s.reviews.filter(r => r.status === 'Chờ đối soát').length
  const billIssues = billRows(s).filter(r => r.issue).length
  return { zonesTodo, prodTodo, tasksOpen, unread, reviewsTodo, billIssues }
}

function QrButton() {
  const { s, me, checkIn } = useStore()
  const a = s.attendance[me.id]
  return a?.in != null ? <div className="note">✓ Đã chấm công vào ca lúc <b>{D.hhmm(a.in)}</b>{me.shift && a.in > D.SHIFTS[me.shift].start ? ` · trễ ${a.in - D.SHIFTS[me.shift].start} phút` : ' · đúng giờ'}</div>
    : <button className="softbtn wide" onClick={checkIn}><Icon n="qr" /> Quét QR chấm công</button>
}

// ═══════════════ KTV ═══════════════
export function KtvHome({ sub }: { sub: string[] }) {
  const { s, me, go } = useStore()
  const c = useCounts()
  const page = dailySub(sub[0], () => go('home'))
  if (page) return <>{page}</>
  if (sub[0] === 'work') return <KtvWork sub={sub.slice(1)} />
  const order = tourOrder(s), pos = order.indexOf(me.id)
  const mine = s.appts.filter(a => a.ktvId === me.id && !['cancelled', 'no_show'].includes(a.status))
  const done = mine.filter(a => a.status === 'done' || a.status === 'paid').length
  const attention = c.zonesTodo.length + c.prodTodo + c.tasksOpen + (s.bills.some(b => b.staffId === me.id) ? 0 : 1)
  const st = ktvState(s, me.id)
  return <>
    <Hero tag="KTV · Hôm nay" title="Hôm nay của tôi" sub={D.dateLabel()}>
      <span className="hbtn">{st.label}{st.until ? ` · ${D.hhmm(st.until)}` : ''}</span>
    </Hero>
    <div className="tiles">
      <button className="tile mint" onClick={() => go('home/shift')}><span className="l">CA CỦA TÔI</span><span className="v" style={{ fontSize: 18 }}>{me.shift ? (me.shift === 1 ? 'Ca sáng 08–18' : 'Ca chiều 10–20') : 'Chưa có ca được duyệt'}</span><span className="s" style={{ color: 'var(--green)' }}>Lịch 4 tuần / đổi ca →</span></button>
      <div className="tile mint"><span className="l">THỨ TỰ TOUR</span><span className="v serif" style={{ color: 'var(--green)' }}>#{pos >= 0 ? pos + 1 : '–'}</span><span className="s">{done}/{mine.length} tour hoàn tất</span></div>
    </div>
    <button className="node gold" onClick={() => go('home/work')}><span className="body"><span className="t" style={{ display: 'block' }}>Việc cần chú ý</span><span className="d" style={{ display: 'block' }}>{c.tasksOpen} nhiệm vụ · {c.zonesTodo.length} khu dọn chưa xong · {c.prodTodo} sản phẩm chờ xác nhận{s.bills.some(b => b.staffId === me.id) ? '' : ' · chưa tải ảnh bill'}</span></span><span className="badge">{attention}</span></button>
    <Nodes items={[
      { t: 'Ca, đổi ca & thứ tự tour', d: 'Lịch 4 tuần · ca của tôi · số tour', onClick: () => go('home/shift') },
      { t: 'Nhiệm vụ dọn dẹp', d: myZones(s, me.id).length ? `${T.menu.cleaningDescPrefix} · khu vực của bạn là số ${myZones(s, me.id).join(', ')} · ảnh mẫu · checklist · điểm` : `${T.menu.cleaningDescPrefix} · khu vực · ảnh mẫu · checklist · điểm`, badge: c.zonesTodo.length, onClick: () => go('home/cleaning') },
      { t: 'Bảng điều phối / lịch hẹn', d: 'Khách và tour được giao cho tôi', onClick: () => go('home/board') },
      { t: T.menu.work, d: T.menu.workDesc, badge: c.tasksOpen, onClick: () => go('home/work') },
      { t: 'Thông báo quan trọng', d: 'Cập nhật · đào tạo · yêu cầu khách', badge: c.unread, onClick: () => go('home/notices') },
      { t: 'Bill Money', d: 'Ảnh bill · đối soát tour · xác nhận', onClick: () => go('home/bills') },
      { t: 'Đánh giá Google, Facebook', d: 'Minh chứng riêng cho từng tour', onClick: () => go('home/reviews') },
      { t: 'Đối chiếu sản phẩm', d: 'Ảnh · xác nhận hai bên · báo cáo tháng', badge: c.prodTodo, onClick: () => go('home/products') },
      { t: 'Xin nghỉ phép', d: 'Gửi đơn · theo dõi kết quả', onClick: () => go('home/leave') },
      { t: 'Báo cáo sự cố', d: 'Mô tả · ảnh · trạng thái xử lý', onClick: () => go('home/incident') },
      { t: T.menu.idea, d: T.menu.ideaDesc, onClick: () => go('home/idea') },
    ]} />
    <QrButton />
  </>
}

export function KtvWork({ sub }: { sub: string[] }) {
  if (sub[0] === 'beds') return <><BackBtn to="home/work" /><BedsScreen /></>
  return <><BackBtn to="home" /><MyWorkScreen /></>
}

// ═══════════════ LỄ TÂN ═══════════════
export function ReceptionHome({ sub }: { sub: string[] }) {
  const { s, me, go } = useStore()
  const c = useCounts()
  const back = () => go('home')
  if (sub[0] === 'close') return <CloseShiftPage back={back} />
  const page = dailySub(sub[0], back)
  if (page) return <>{page}</>
  if (sub[0] === 'base') return <OpsBasePage key={sub[1]} sub={sub[1]} />
  if (sub[0] === 'tasks') return <MyTasksPage back={back} />
  const o = overview(s)
  const needCare = alerts(s).filter(a => a.customerId).length
  const closed = s.shiftCloses.find(x => x.staffId === me.id)
  return <>
    <Hero tag="Lễ tân · Bản điều phối" title="Điều phối khách & vận hành" sub="Ưu tiên KTV rảnh/bận, thứ tự tour và việc cần đối chiếu." />
    <Block title="Cần chú ý hôm nay" sub="Chỉ hiện việc cần ưu tiên; chức năng chi tiết nằm trong các nút mẹ bên dưới.">
      <Tiles soft items={[
        { v: o.ktvFree, l: 'KTV sẵn sàng', onClick: () => go('home/shift') },
        { v: s.tasks.filter(t => t.earlyReport && ['open', 'doing'].includes(t.status)).length, l: 'Sự cố chưa đóng', onClick: () => go('home/tasks') },
        { v: c.billIssues + c.reviewsTodo, l: 'Bill/review cần xem', onClick: () => go('home/bills') },
        { v: needCare, l: 'Khách cần CSKH', onClick: () => go('cust') },
        { v: o.waiting, l: 'Khách chờ chia tour', tone: o.waitingLong ? 'warn' : undefined, onClick: () => go('ops/queue') },
        { v: o.bills.length, l: 'Chờ thanh toán', onClick: () => go('ops/cashier') },
      ]} />
    </Block>
    <Block title="Ca & thứ tự tour KTV" sub={`${o.ktvBusy} KTV đang bận · ${o.ktvFree} KTV sẵn sàng`} right={<button className="softbtn" onClick={() => go('home/shift')}>Xem</button>}>
      <div className="row">{tourOrder(s).slice(0, 8).map((id, i) => { const st = ktvState(s, id); return <Pill key={id} tone={st.tone} dot>{i + 1}. {D.staffName(id)}</Pill> })}</div>
    </Block>
    <Nodes items={[
      { t: 'Ca, đổi ca & thứ tự tour', d: `${me.name} – ${me.shift === 1 ? 'ca sáng' : 'ca chiều'} · lịch 4 tuần`, onClick: () => go('home/shift') },
      { t: 'Nhiệm vụ dọn dẹp', d: `Khu vực của bạn là số ${myZones(s, me.id).join(', ') || '—'} · bảng KTV – lễ tân`, badge: c.zonesTodo.length, onClick: () => go('home/cleaning') },
      { t: 'Bảng điều phối / lịch hẹn / thu ngân', d: 'Lịch · hàng chờ · sơ đồ giường · thu ngân', onClick: () => go('ops') },
      { t: 'Thông báo quan trọng', d: 'Cập nhật · đào tạo · yêu cầu khách', badge: c.unread, onClick: () => go('home/notices') },
      { t: 'Bill Money nhóm chung', d: 'Xác nhận danh sách khách & hóa đơn khớp cho nhóm', badge: c.billIssues, onClick: () => go('home/bills') },
      { t: 'Đánh giá Google, Facebook', d: 'Đối soát ảnh với Google Map', badge: c.reviewsTodo, onClick: () => go('home/reviews') },
      { t: 'Đối chiếu sản phẩm, kiểm kho', d: 'Xác nhận KTV · xác nhận lễ tân', badge: c.prodTodo, onClick: () => go('home/products') },
      { t: 'Xin nghỉ phép', d: 'Điền biểu mẫu → CEO duyệt', onClick: () => go('home/leave') },
      { t: 'Báo cáo sự cố', d: 'Mô tả · ảnh · trạng thái xử lý', onClick: () => go('home/incident') },
      { t: 'Chốt ca', d: closed ? `Đã chốt ${D.hhmm(closed.at)}` : 'Tiền · công việc sổ sách', alert: !closed && s.now >= (me.shift === 1 ? 17 * 60 + 30 : 19 * 60 + 30), onClick: () => go('home/close') },
    ]} />
    <Block title="Vận hành cơ sở – hoạt động đội nhóm" sub={me.shift === 1 ? 'Ca 1: ưu tiên kiểm tra đầu ngày, rà danh sách khách, chuẩn bị quà, vệ sinh & vật tư.' : 'Ca 2: nhận bàn giao, theo sát trải nghiệm khách, kiểm tra khắc phục, tổng hợp việc tồn cuối ngày.'}>
      <ChipGrid items={D.OPS_ITEMS.map((x, i) => ({ l: x, onClick: () => go(`home/base/${i}`), solid: i === 0 }))} />
    </Block>
    {c.tasksOpen > 0 && <button className="softbtn wide" onClick={() => go('home/tasks')}>Việc Leader giao cho tôi ({c.tasksOpen})</button>}
    <QrButton />
  </>
}

function MyTasksPage({ back }: { back: () => void }) {
  const { s, me } = useStore()
  const [open, setOpen] = useState<string | null>(null)
  const list = s.tasks.filter(t => (t.ownerId === me.id || (t.earlyReport && ['open', 'doing'].includes(t.status))) && t.status !== 'transferred')
  return <>
    <SubHead title="Việc được giao & sự cố" sub="Leader giao: chuẩn bị quà, xác nhận lịch, nhắc đóng tiếp… · sự cố đang mở" onBack={back} />
    <div className="card list">{list.map(t => <button key={t.id} className="item" onClick={() => setOpen(t.id)}><span className={`sev ${t.priority}`} /><div className="body"><div className="t">{t.title}</div><div className="d">{t.detail} · {D.staffName(t.ownerId)}</div></div>{t.status === 'done' ? <Pill tone="green">Xong</Pill> : <PrioPill p={t.priority} />}</button>)}{!list.length && <Empty>Không có việc</Empty>}</div>
    {open && <TaskModal id={open} onClose={() => setOpen(null)} />}
  </>
}

/** Tab "Vận hành" của lễ tân (và trang xem của Leader/CEO) */
const OPS_TABS = [{ k: 'overview', label: 'Tổng quan' }, { k: 'schedule', label: 'Lịch điều phối' }, { k: 'queue', label: 'Hàng chờ' }, { k: 'beds', label: 'Sơ đồ giường' }, { k: 'cashier', label: 'Thu ngân' }]
export function OpsHub({ sub, base }: { sub?: string; base: string }) {
  const { s, user, go } = useStore()
  const readonly = user.role !== 'reception'
  const tabs = readonly ? OPS_TABS.filter(t => t.k !== 'cashier' || user.role === 'ceo') : OPS_TABS
  const want = (sub ?? 'overview').split(':')[0]
  const cur = tabs.some(t => t.k === want) ? want : 'overview'
  return <>
    {base !== 'ops' && <BackBtn to={base.split('/')[0]} />}
    <div style={{ overflowX: 'auto' }}><Seg value={cur} onChange={v => go(`${base}/${v}`)} items={tabs.map(t => ({ ...t, badge: t.k === 'queue' ? s.queue.length : t.k === 'cashier' ? overview(s).bills.length : undefined }))} /></div>
    {cur === 'overview' && <OverviewScreen readonly={readonly} />}
    {cur === 'schedule' && <ScheduleScreen key={sub} openNew={sub === 'schedule:new'} />}
    {cur === 'queue' && <QueueScreen />}
    {cur === 'beds' && <BedsScreen />}
    {cur === 'cashier' && <CashierScreen />}
  </>
}

// ── Chốt ca: Tiền → Công việc sổ sách ──
function CloseShiftPage({ back }: { back: () => void }) {
  const { s, me, closeShift } = useStore()
  const exp = expectedByMethod(s)
  const methods = Object.keys(exp) as D.PayMethod[]
  const [counted, setCounted] = useState<Record<D.PayMethod, number>>({ 'Tiền mặt': 0, 'Chuyển khoản': 0, 'Thẻ ngân hàng': 0 })
  const [note, setNote] = useState('')
  const drafts = s.invoices.filter(i => i.status === 'Nháp').length + overview(s).bills.length
  const prodOpen = s.productLogs.filter(p => !(p.ktvOk && p.recOk)).length
  const billOk = !!s.billCheck && s.billCheck.at >= lastCloseAt(s) && !s.billCheck.issues.length
  const auto = [drafts === 0, billOk, false, prodOpen === 0, false]
  const sent = useRef(false)
  const [books, setBooks] = useState<boolean[]>(auto)
  const hints = [`${drafts} hóa đơn nháp / lượt chờ thu`, s.billCheck ? `Đã đối soát ${D.hhmm(s.billCheck.at)}` : 'Chưa đối soát Bill Money', 'Tự kiểm tra trên Lịch điều phối', `${prodOpen} lượt chưa đủ 2 bên`, 'Ghi vào ô ghi chú bên dưới']
  const diff = methods.reduce((t, k) => t + (counted[k] || 0) - exp[k], 0)
  const absDiff = methods.reduce((t, k) => t + Math.abs((counted[k] || 0) - exp[k]), 0)
  const done = s.shiftCloses.filter(x => x.staffId === me.id)
  return <>
    <SubHead title="Chốt ca" sub="Tiền → công việc sổ sách. Lệch tiền phải ghi lý do; Leader & chị nhận thông báo." onBack={back} />
    <Block title="1. Tiền" sub="Số hệ thống tính từ hóa đơn đã xác nhận hôm nay">
      <div className="card tbl-wrap"><table><thead><tr><th>Phương thức</th><th>Hệ thống</th><th>Thực đếm / sao kê</th><th>Lệch</th></tr></thead><tbody>
        {methods.map(m => { const d = (counted[m] || 0) - exp[m]; return <tr key={m}><td className="strong">{m}</td><td className="num">{D.vnd(exp[m])}</td><td><input className="inp num" type="number" step={1000} min={0} value={counted[m]} onChange={e => setCounted({ ...counted, [m]: Math.max(0, +e.target.value || 0) })} aria-label={`Thực đếm ${m}`} style={{ maxWidth: 160 }} /></td><td className="num strong" style={{ color: d ? 'var(--r-fg)' : 'var(--g-fg)' }}>{d ? `${d > 0 ? '+' : ''}${D.vnd(d)}` : 'Khớp'}</td></tr> })}
      </tbody></table></div>
      <div className={absDiff ? 'err small' : 'ok small'}>{absDiff ? `Tổng lệch ${diff > 0 ? '+' : ''}${D.vnd(diff)} — ghi rõ lý do bên dưới` : 'Tiền khớp với hệ thống'}</div>
    </Block>
    <Block title="2. Công việc sổ sách">
      {D.BOOK_CHECKS.map((x, i) => <label key={i} className="check"><input type="checkbox" checked={books[i]} disabled={[1, 3].includes(i) && !auto[i]} onChange={() => setBooks(b => b.map((v, j) => (j === i ? !v : v)))} /><span>{x}<span className="tiny muted" style={{ display: 'block' }}>{hints[i]}</span></span></label>)}
      <label className="f">Ghi chú / bàn giao ca sau<textarea id="cs-note" className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder="VD: khách Kim còn thiếu 1,7tr, hẹn đóng thứ 7; lệch 20k do thối tiền lẻ" /></label>
      <button className="btn pri" disabled={(absDiff !== 0 && !note.trim()) || !books.every(Boolean)} onClick={() => { if (sent.current) return; if (!closeShift(counted, exp, books, note.trim())) { sent.current = true; back() } }}>Chốt ca & gửi báo cáo</button>
      {!books.every(Boolean) && <div className="tiny muted">Tick đủ 5 mục sổ sách trước khi chốt.</div>}
    </Block>
    {done.length > 0 && <Block title="Đã chốt"><div className="card list">{done.map(x => { const d = (Object.keys(x.counted) as D.PayMethod[]).reduce((t, k) => t + x.counted[k] - x.expected[k], 0); return <div key={x.id} className="item"><div className="body"><div className="t">{D.hhmm(x.at)} · {d ? `lệch ${D.vnd(d)}` : 'khớp tiền'}</div><div className="d">{x.note || 'Không ghi chú'}</div></div><Pill tone={d ? 'yellow' : 'green'}>Đã gửi</Pill></div> })}</div></Block>}
  </>
}

// ── Vận hành cơ sở – hoạt động đội nhóm ──
function OpsBasePage({ sub }: { sub?: string }) {
  const { s, me, go, addOpsCheck, proposePoint } = useStore()
  const i = Number(sub ?? 0)
  const item = D.OPS_ITEMS[i] ?? D.OPS_ITEMS[0]
  const [ok, setOk] = useState(true)
  const [note, setNote] = useState('')
  const [pt, setPt] = useState({ staffId: '', delta: 1, reason: '' })
  const hist = s.opsChecks.filter(x => x.item === item)
  const isPoints = item === 'Ghi nhận điểm uy tín'
  return <>
    <SubHead title={item} sub="Vận hành cơ sở – hoạt động đội nhóm" onBack={() => go('home')} />
    <div style={{ overflowX: 'auto' }}><Seg value={String(i)} onChange={v => go(`home/base/${v}`)} items={D.OPS_ITEMS.map((x, j) => ({ k: String(j), label: `${j + 1}` }))} /></div>
    {isPoints ? <>
      <div className="note"><b>Lưu ý của chị Quyên:</b> lễ tân ghi nhận & tổng hợp; Leader/CEO duyệt điểm cộng/trừ có tranh chấp hoặc cần đánh giá — lễ tân không tự quyết điểm của đồng nghiệp.</div>
      <Block title="Ghi nhận điểm">
        <div className="grid g3"><label className="f">Nhân viên<select id="pt-st" className="inp" value={pt.staffId} onChange={e => setPt({ ...pt, staffId: e.target.value })}><option value="">— chọn —</option>{s.staff.filter(x => x.id !== me.id && (x.role === 'ktv' || x.role === 'reception')).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="f">Điểm (+/−)<input id="pt-d" className="inp num" type="number" min={-10} max={10} value={pt.delta} onChange={e => setPt({ ...pt, delta: +e.target.value })} /></label>
          <label className="f">Sự việc & minh chứng<input id="pt-r" className="inp" value={pt.reason} onChange={e => setPt({ ...pt, reason: e.target.value })} placeholder="VD: khách khen trên Google" /></label></div>
        <button className="btn pri" disabled={!pt.staffId || !pt.delta || !pt.reason.trim()} onClick={() => { proposePoint(pt.staffId, pt.delta, pt.reason.trim()); setPt({ staffId: '', delta: 1, reason: '' }) }}>Gửi Leader/CEO duyệt</button>
      </Block>
      <Block title="Đã ghi nhận"><div className="card list">{s.points.filter(p => p.by === me.id).map(p => <div key={p.id} className="item"><div className="body"><div className="t">{D.staffName(p.staffId)} · {p.delta > 0 ? '+' : ''}{p.delta}</div><div className="d">{p.reason} · {D.hhmm(p.at)}</div></div><Pill tone={p.status === 'Đã duyệt' ? 'green' : p.status === 'Từ chối' ? 'red' : 'yellow'}>{p.status}</Pill></div>)}{!s.points.some(p => p.by === me.id) && <Empty>Chưa ghi nhận</Empty>}</div></Block>
    </> : <>
      <Block title="Ghi kết quả kiểm tra">
        <Seg value={ok ? 'ok' : 'no'} onChange={v => setOk(v === 'ok')} items={[{ k: 'ok', label: 'Đạt / đã xong' }, { k: 'no', label: 'Có vấn đề' }]} />
        <textarea id="ob-note" className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder={item.startsWith('Vật tư') ? 'VD: còn 2 chai dầu massage — đề xuất mua 10 chai' : item.startsWith('Bàn giao') ? 'VD: khách Hà hẹn 18:00 chưa xác nhận; máy sấy tầng 3 kêu to' : 'Mô tả ngắn'} />
        <button className="btn pri" disabled={!ok && !note.trim()} onClick={() => { addOpsCheck(item, ok, note.trim()); setNote('') }}>Ghi nhận</button>
        {!ok && <div className="tiny muted">Có vấn đề → bắt buộc mô tả; Leader thấy trong "Việc bất thường".</div>}
      </Block>
      <Block title="Lịch sử hôm nay"><div className="card list">{hist.map(h => <div key={h.id} className="item"><div className="body"><div className="t">{h.note || (h.ok ? 'Đạt' : 'Có vấn đề')}</div><div className="d">{D.staffName(h.by)} · {D.hhmm(h.at)}</div></div><Pill tone={h.ok ? 'green' : 'red'}>{h.ok ? 'Đạt' : 'Vấn đề'}</Pill></div>)}{!hist.length && <Empty>Chưa có ghi nhận</Empty>}</div></Block>
    </>}
  </>
}

// ── Khách hàng của lễ tân (CSKH) ──
type Grp = 'leVN' | 'ltVN' | 'leNN' | 'ltNN'
const pkgState = (p: D.Package) => { const left = D.pkgLeft(p); if (D.pkgOwed(p) > 0) return 'Đã cọc, còn thiếu'; if (left <= 0) return 'Đã hết liệu trình'; if (p.type === 'session' && left === 1) return 'Còn buổi cuối cùng'; if (p.type === 'session' && left === 2) return 'Còn 2 buổi cuối'; return 'Đã thanh toán đủ' }
const pkgIs = (p: D.Package, st: string) => { const left = D.pkgLeft(p), owed = D.pkgOwed(p); switch (st) { case 'Đã cọc, còn thiếu': return owed > 0; case 'Đã thanh toán đủ': return owed === 0 && left > 0; case 'Còn 2 buổi cuối': return p.type === 'session' && left === 2; case 'Còn buổi cuối cùng': return p.type === 'session' && left === 1; case 'Đã hết liệu trình': return left <= 0 } return false }
const thisMonth = () => D.TODAY.getMonth() + 1
const bday = (c: D.Customer) => !!c.dob && +c.dob.split('/')[1] === thisMonth()
export function ReceptionCustomers() {
  const { s, user, openCustomer } = useStore()
  const [grp, setGrp] = useState<Grp>('leVN')
  const [flt, setFlt] = useState('Tất cả')
  const [days, setDays] = useState(30)
  const [q, setQ] = useState('')
  const [care, setCare] = useState<D.Customer | null>(null)
  const isLT = grp.startsWith('lt'), isNN = grp.endsWith('NN')
  const unhappy = new Set(s.feedback.filter(f => f.rating <= 3 && f.status !== 'đã xử lý').map(f => f.customerId))
  const referrers = new Set(s.customers.map(c => c.referredBy).filter(Boolean))
  const base = s.customers.filter(c => (c.group === 'NN') === isNN && (c.packages.length > 0) === isLT)
  const filters = isLT ? ['Tất cả', 'Đã cọc, còn thiếu', 'Đã thanh toán đủ', 'Còn 2 buổi cuối', 'Còn buổi cuối cùng', 'Đã hết liệu trình', 'Sinh nhật tháng này', 'Chưa hài lòng', 'Lâu chưa quay lại']
    : ['Tất cả', 'Khách mới (1 lần)', 'Lâu chưa quay lại', 'Sinh nhật tháng này', 'Chưa hài lòng', 'Có giới thiệu khách']
  const match = (c: D.Customer) => {
    switch (flt) {
      case 'Khách mới (1 lần)': return c.visits <= 1
      case 'Lâu chưa quay lại': return c.lastVisitDays >= days
      case 'Sinh nhật tháng này': return bday(c)
      case 'Chưa hài lòng': return unhappy.has(c.id)
      case 'Có giới thiệu khách': return referrers.has(c.id)
      case 'Tất cả': return true
      default: return c.packages.some(p => pkgIs(p, flt))
    }
  }
  const list = base.filter(match).filter(c => !q.trim() || c.name.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.totalPaid - a.totalPaid)
  const script = (c: D.Customer) => unhappy.has(c.id) ? 'Gọi xin lỗi, hỏi rõ vấn đề, đề xuất xử lý trong quyền hạn' : bday(c) ? 'Chúc mừng sinh nhật + quà theo chương trình Sinh nhật vàng' : c.packages.some(p => ['Còn 2 buổi cuối', 'Còn buổi cuối cùng', 'Đã hết liệu trình'].includes(pkgState(p))) ? 'Hỏi tiến triển, tư vấn tái tục theo khung đã duyệt' : c.packages.some(p => D.pkgOwed(p) > 0) ? 'Nhắc nhẹ đóng tiếp khi khách đến' : c.lastVisitDays >= days ? 'Hỏi thăm, mời quay lại — hỏi lý do gián đoạn' : c.visits <= 1 ? 'Hỏi cảm nhận buổi đầu, mời đặt buổi 2' : 'Hỏi thăm sau dịch vụ'
  const logs = s.customers.flatMap(c => c.care.filter(x => x.kind))
  const fbBad = s.feedback.filter(f => f.rating <= 3)
  const recIds = new Set(s.staff.filter(x => x.role === 'reception').map(x => x.id))
  return <>
    <Hero tag="Khách hàng · CSKH" title="Chăm sóc khách hàng" sub="Lọc tệp khách → kịch bản mục tiêu → ghi kết quả CSKH. Lễ tân duyệt nội dung trước khi gửi tin." />
    <Tiles items={[
      { v: logs.filter(x => x.kind === 'Nhắn tin' && x.ok).length, l: 'Nhắn tin thành công' }, { v: logs.filter(x => x.kind === 'Gọi điện' && x.ok).length, l: 'Gọi điện thành công' },
      { v: logs.filter(x => x.replied).length, l: 'Khách có phản hồi' }, { v: logs.filter(x => x.came).length, l: 'Khách hẹn tới', tone: 'ok' },
      { v: s.feedback.length ? (s.feedback.reduce((t, f) => t + f.rating, 0) / s.feedback.length).toFixed(1) : '—', l: 'Điểm trải nghiệm TB' },
      { v: fbBad.length ? `${Math.round(fbBad.filter(f => f.status === 'đã xử lý' && f.handlerId && recIds.has(f.handlerId)).length / fbBad.length * 100)}%` : '—', l: 'Khiếu nại lễ tân xử lý' },
    ]} />
    <div style={{ overflowX: 'auto' }}><Seg value={grp} onChange={g => { setGrp(g); setFlt('Tất cả') }} items={[{ k: 'leVN', label: 'Khách lẻ Việt' }, { k: 'ltVN', label: 'Liệu trình Việt' }, { k: 'leNN', label: 'Khách lẻ nước ngoài' }, { k: 'ltNN', label: 'Liệu trình nước ngoài' }]} /></div>
    <div className="row">{filters.map(f => <button key={f} className={`btn sm${flt === f ? ' pri' : ''}`} onClick={() => setFlt(f)}>{f}</button>)}</div>
    <div className="row"><input className="inp" style={{ flex: 1, minWidth: 160 }} placeholder={isLT ? 'Tìm mã KH / tên' : 'Tìm tên / mã'} value={q} onChange={e => setQ(e.target.value)} aria-label="Tìm khách" />
      {flt === 'Lâu chưa quay lại' && <label className="row small muted">≥<input className="inp num" type="number" min={7} step={7} value={days} onChange={e => setDays(+e.target.value || 30)} style={{ width: 80 }} />ngày</label>}</div>
    <div className="card list">{list.map(c => <div key={c.id} className="item" style={{ alignItems: 'flex-start' }}><Av name={c.name} /><div className="body">
      <button className="link" onClick={() => openCustomer(c.id)} style={{ color: 'var(--ink)' }}>{c.name} <span className="tiny muted">· mã {c.code}</span></button>
      <div className="d">{user.role === 'reception' ? c.phone || 'chưa có SĐT' : 'SĐT ẩn'} · {c.visits} lần · {c.lastVisitDays ? `${c.lastVisitDays} ngày trước` : 'hôm nay'} · {D.vnd(c.totalPaid)}{c.packages.map(p => ` · ${p.cardCode}: ${pkgState(p)}`).join('')}</div>
      <div className="small" style={{ color: 'var(--green)' }}>🎯 {script(c)}</div>
      {c.care[0] && <div className="tiny muted">Gần nhất: {c.care[0].at} · {c.care[0].by}: {c.care[0].text}</div>}
    </div>{user.role === 'reception' && <button className="btn sm pri" onClick={() => setCare(c)}>Ghi CSKH</button>}</div>)}
      {!list.length && <Empty>Không có khách trong bộ lọc này</Empty>}</div>
    {care && <CareModal c={care} script={script(care)} onClose={() => setCare(null)} />}
  </>
}
function CareModal({ c, script, onClose }: { c: D.Customer; script: string; onClose: () => void }) {
  const { logCare, say } = useStore()
  const [f, setF] = useState({ kind: 'Nhắn tin' as 'Nhắn tin' | 'Gọi điện', ok: true, replied: false, came: false })
  const [text, setText] = useState(`Chào chị ${c.name.split(' ').pop()}, Home Spa hỏi thăm chị sau buổi trị liệu. ${script}.`)
  return <Modal title={`CSKH · ${c.name}`} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn pri" disabled={!text.trim()} onClick={() => { logCare(c.id, { ...f, text: `[${f.kind}${f.ok ? '' : ' · không liên hệ được'}] ${text.trim()}` }); say('Đã ghi kết quả CSKH vào hồ sơ'); onClose() }}>Lưu kết quả</button></>}>
    <div className="note">🎯 Kịch bản mục tiêu: <b>{script}</b></div>
    <Seg value={f.kind} onChange={k => setF({ ...f, kind: k })} items={[{ k: 'Nhắn tin', label: 'Nhắn tin' }, { k: 'Gọi điện', label: 'Gọi điện' }]} />
    <label className="f">Nội dung (lễ tân duyệt trước khi gửi)<textarea id="care-txt" className="inp" value={text} onChange={e => setText(e.target.value)} /></label>
    <label className="check"><input type="checkbox" checked={f.ok} onChange={() => setF({ ...f, ok: !f.ok })} />Liên hệ thành công</label>
    <label className="check"><input type="checkbox" checked={f.replied} onChange={() => setF({ ...f, replied: !f.replied })} />Khách có phản hồi</label>
    <label className="check"><input type="checkbox" checked={f.came} onChange={() => setF({ ...f, came: !f.came })} />Khách hẹn / đã tới</label>
  </Modal>
}

// ═══════════════ CỦA TÔI (KTV · Lễ tân · Marketing) ═══════════════
export function MyPage({ sub }: { sub: string[] }) {
  const { s, me, user, go, checkIn, checkOut } = useStore()
  const back = () => go('me')
  const pts = s.points.filter(p => p.staffId === me.id)
  const a = s.attendance[me.id]
  const [leave, setLeave] = useState(false)
  const tours = s.appts.filter(x => x.ktvId === me.id && !['cancelled', 'no_show'].includes(x.status))
  switch (sub[0]) {
    case 'profile': return <><SubHead title="Hồ sơ" onBack={back} />
      <div className="card pad col"><div className="row"><span className="avatar">{me.name.replace('Chị ', '')[0]}</span><div><b style={{ fontSize: 17 }}>{me.name}</b><div className="small muted">{D.ROLE_LABEL[me.role]} · mã NV {me.id.toUpperCase()}</div></div></div>
        <div className="small">Chi nhánh: <b>Home Spa Đà Nẵng</b></div><div className="small">Ca gốc: <b>{me.shift ? D.SHIFTS[me.shift].label : 'Hành chính'}</b></div>
        <div className="small muted">Ngày vào làm, thông tin cá nhân: chưa nối dữ liệu nhân sự (CEO → Hồ sơ – Hợp đồng).</div></div></>
    case 'time': return <><SubHead title="Lịch & chấm công" onBack={back} right={<button className="btn" onClick={() => setLeave(true)}>Xin nghỉ / đổi ca</button>} />
      <Tiles items={[{ v: a?.in != null ? D.hhmm(a.in) : '—', l: 'Giờ vào', s: me.shift && a?.in != null && a.in > D.SHIFTS[me.shift].start ? `trễ ${a.in - D.SHIFTS[me.shift].start} phút` : undefined }, { v: a?.out != null ? D.hhmm(a.out) : '—', l: 'Giờ ra' }]} />
      <div className="row">{a?.in == null ? <button className="btn pri" onClick={checkIn}><Icon n="qr" />Quét QR vào ca</button> : a.out == null && <button className="btn" onClick={checkOut}>Chấm công ra ca</button>}<button className="btn" onClick={() => go('home/shift')}>Xem lịch 4 tuần</button></div>
      <Block title="Đơn nghỉ / đổi ca"><div className="card list">{s.leaves.filter(l => l.staffId === me.id).map(l => <div key={l.id} className="item"><div className="body"><div className="t">{l.kind} · {l.date}</div><div className="d">{l.detail}</div></div><Pill tone={l.status === 'Đã duyệt' ? 'green' : l.status === 'Từ chối' ? 'red' : 'yellow'}>{l.status}</Pill></div>)}{!s.leaves.some(l => l.staffId === me.id) && <Empty>Chưa có đơn</Empty>}</div></Block>
      {leave && <LeaveModal onClose={() => setLeave(false)} />}</>
    case 'perf': return <><SubHead title="Hiệu suất & điểm uy tín" sub="Điểm đi theo sự kiện thật + minh chứng. Mộc chỉ giải thích, không tự cộng/trừ." onBack={back} />
      <Tiles items={user.role === 'ktv' ? [{ v: tours.length, l: 'Tour hôm nay' }, { v: tours.filter(x => ['done', 'paid'].includes(x.status)).length, l: 'Đã hoàn thành' }, { v: tours.filter(x => x.requested).length, l: 'Khách yêu cầu lại', tone: 'ok' }, { v: pointsOf(s, me.id), l: 'Điểm uy tín đã duyệt' }]
        : [{ v: s.invoices.filter(i => i.creator === me.name).length, l: 'Hóa đơn đã lập' }, { v: s.customers.reduce((t, c) => t + c.care.filter(x => x.by === me.name).length, 0), l: 'Lượt CSKH' }, { v: s.shiftCloses.filter(x => x.staffId === me.id).length, l: 'Lần chốt ca' }, { v: pointsOf(s, me.id), l: 'Điểm uy tín đã duyệt' }]} />
      <Block title="Lịch sử điểm"><div className="card list">{pts.map(p => <div key={p.id} className="item"><span className="av" style={{ background: p.delta >= 0 ? 'var(--g-bg)' : 'var(--r-bg)', color: p.delta >= 0 ? 'var(--g-fg)' : 'var(--r-fg)' }}>{p.delta > 0 ? '+' : ''}{p.delta}</span><div className="body"><div className="t">{p.reason}</div><div className="d">{p.source} · {D.staffName(p.by)} · {D.hhmm(p.at)}</div></div><Pill tone={p.status === 'Đã duyệt' ? 'green' : p.status === 'Từ chối' ? 'red' : 'yellow'}>{p.status}</Pill></div>)}{!pts.length && <Empty>Chưa có điểm hôm nay</Empty>}</div></Block>
      <div className="note">Tiêu chí điểm uy tín: chuyên môn · chăm sóc khách · khách yêu cầu lại · feedback · tinh thần · chủ động · tuân thủ quy trình · học tập · văn hóa Home · sáng tạo.</div></>
    case 'train': return <><SubHead title="Đào tạo" sub="Học → Test → Tìm điểm yếu → Lộ trình → Nhắc luyện → Test lại" onBack={back} />
      <NodeSpec rows={[{ t: 'Khóa đang học', d: 'Danh sách bài học theo vai trò' }, { t: 'Video / SOP cần xem', d: D.SOPS.map(x => x.title).join(' · ') }, { t: 'Bài test & kết quả', d: 'Điểm từng lần test, phần còn yếu' }, { t: 'Kỹ năng đã đạt / cần cải thiện', d: 'Do Leader / người phụ trách đào tạo xác nhận' }, { t: 'Lộ trình phát triển', d: 'Mục tiêu học & người hướng dẫn' }]} /></>
    case 'income': return <><SubHead title="Thu nhập & yêu cầu" onBack={back} />
      <NodeSpec rows={[{ t: 'Lương cơ bản · công thực tế', d: 'Từ bảng chấm công đã chốt' }, { t: 'Hoa hồng · thưởng · phạt', d: 'Theo tour, khách chốt liệu trình, điểm uy tín' }, { t: 'Tổng thu nhập dự kiến · phiếu lương', d: 'Từng tháng — chỉ bạn và CEO xem' }]} />
      <Block title="Lịch sử yêu cầu"><div className="card list">{[...s.leaves.filter(l => l.staffId === me.id).map(l => ({ k: l.id, t: `${l.kind} ${l.date}`, d: l.detail, st: l.status })), ...s.tasks.filter(t => t.earlyReport && t.createdBy === me.id && t.status !== 'transferred').map(t => ({ k: t.id, t: 'Báo sự cố', d: t.detail, st: t.status === 'done' ? 'Đã xử lý' : 'Đang xử lý' }))].map(r => <div key={r.k} className="item"><div className="body"><div className="t">{r.t}</div><div className="d">{r.d}</div></div><Pill tone={r.st === 'Đã duyệt' || r.st === 'Đã xử lý' ? 'green' : r.st === 'Từ chối' ? 'red' : 'yellow'}>{r.st}</Pill></div>)}</div></Block></>
  }
  return <>
    <Hero tag="Của tôi" title={me.name} sub={`${D.ROLE_LABEL[me.role]}${me.shift ? ` · ${D.SHIFTS[me.shift].label}` : ''} · ${pointsOf(s, me.id)} điểm uy tín`} />
    <Nodes items={[
      { t: 'Hồ sơ', d: 'Họ tên · mã nhân viên · bộ phận · ngày vào làm', onClick: () => go('me/profile') },
      { t: 'Lịch & chấm công', d: 'Ca hôm nay · giờ vào/ra · đơn nghỉ/đổi ca', onClick: () => go('me/time') },
      { t: 'Hiệu suất', d: 'Tour · khách yêu cầu lại · điểm uy tín & lý do', onClick: () => go('me/perf') },
      { t: 'Đào tạo', d: 'Khóa học · SOP · bài test · lộ trình', onClick: () => go('me/train') },
      { t: 'Thu nhập & yêu cầu', d: 'Lương · hoa hồng · thưởng/phạt · lịch sử yêu cầu', onClick: () => go('me/income') },
    ]} />
  </>
}

/** Leader/CEO xem báo cáo chốt ca (chỉ đọc) */
function ClosesView({ back }: { back: () => void }) {
  const { s } = useStore()
  return <>
    <SubHead title="Báo cáo chốt ca" sub="Tiền theo phương thức · lệch · sổ sách · bàn giao" onBack={back} />
    <div className="card list">{s.shiftCloses.map(x => { const ms = Object.keys(x.counted) as D.PayMethod[]; const d = ms.reduce((t, k) => t + x.counted[k] - x.expected[k], 0)
      return <div key={x.id} className="item" style={{ alignItems: 'flex-start' }}><div className="body"><div className="t">{D.staffName(x.staffId)} · {D.hhmm(x.at)} · {d ? `lệch ${d > 0 ? '+' : ''}${D.vnd(d)}` : 'khớp tiền'}</div>
        <div className="d">{ms.map(k => `${k}: ${D.vnd(x.counted[k])} / hệ thống ${D.vnd(x.expected[k])}`).join(' · ')}</div><div className="small">{x.note || 'Không ghi chú'}</div></div><Pill tone={d ? 'yellow' : 'green'}>{d ? 'Lệch' : 'Khớp'}</Pill></div> })}
      {!s.shiftCloses.length && <Empty>Chưa có lễ tân chốt ca hôm nay</Empty>}</div>
  </>
}
