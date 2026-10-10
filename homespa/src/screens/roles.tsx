// LEADER · MARKETING · CEO — cùng khung 4 nút mẹ, nội dung theo sơ đồ từng ban
import { ReactNode, useState } from 'react'
import { useStore, BUDGET_LIMIT } from '../store'
import * as D from '../data'
import { alerts, billRows, overview, pointsOf, ktvState, custSegment, zoneReport, inboxSuggestions, customersCsv } from '../logic'
import { T } from '../i18n'
import { Hero, Tiles, Nodes, Block, ChipGrid, SubHead, Pill, Empty, Seg, Av, NodeSpec, Icon, Delta } from '../ui'
import { CEO_NODES, MKT_NODES, SpecRow } from '../specs'
import { TreeNodes, ConPage, ChauPage, chau, kidsOf } from '../tree'
import { dailySub, OpsHub, BackBtn, MyPage, ReceptionCustomers } from './staff'
import { AttendancePage, ShiftTourPage, LeavePage } from './daily'
import { LeaderToday, LeaderCustomers, MocScreen, ProgramsPanel, RoiPanel } from './leader'
import { ApprovalsScreen, MembersScreen, MarketingScreen } from './ceo'
import { OpsBase2, HandoverPage } from './reception2'
import { TeamOps, LeaveApprove, OpsApprove, LeaderFin, LeaderMothers, StaffPerf, SalaryPage, TrainTree, LeaderCareTop } from './leader2'

/** Hub nút con theo bảng tài liệu: chạm nút con là xổ nút cháu; trang con → nút cháu → số liệu mẫu */
function SpecHub({ rows, sub, leaf, base, title, tag, custom, intro }: { rows: SpecRow[]; sub?: string; leaf?: string; base: string; title: string; tag: string; custom?: Record<string, () => ReactNode>; intro?: ReactNode }) {
  const { go } = useStore()
  const row = rows.find(r => r.no === sub)
  if (row && leaf !== undefined) return <ChauPage row={row} idx={Number(leaf) || 0} base={base} ctx={`${tag} ${title}`} />
  if (row) return <ConPage row={row} base={base} back={() => go(base)} custom={custom?.[row.no]?.()} />
  return <>
    {base.includes('/') && <BackBtn to={base.split('/')[0]} />}
    <Hero tag={tag} title={title} sub="Chạm vào nút con để xổ nút cháu · bấm lần nữa để mở" />
    {intro}
    <TreeNodes items={rows.map(r => ({ no: r.no, t: r.t, d: chau(r).join(' · '), onClick: () => go(`${base}/${r.no}`), kids: chau(r).map((k, i) => ({ no: `${r.no}.${i + 1}`, l: k, onClick: () => go(`${base}/${r.no}/${i}`) })) }))} />
  </>
}

// ═══════════════ LEADER ═══════════════
export function LeaderHome({ sub }: { sub: string[] }) {
  const { s, go } = useStore()
  const back = () => go('home')
  const page = dailySub(sub[0], back)
  if (page) return <>{page}</>
  if (sub[0] === 'tasks') return <><BackBtn to="home" /><LeaderToday /></>
  if (sub[0] === 'ops') return <OpsHub sub={sub[1]} base="home/ops" />
  if (sub[0] === 'attendance') return <AttendancePage back={back} />
  if (sub[0] === 'base') return <OpsBase2 key={sub[1]} sub={sub[1]} sub2={sub[2]} />
  if (sub[0] === 'handover') return <HandoverPage back={back} />
  if (sub[0] === 'leaveok') return <LeaveApprove back={back} />
  if (sub[0] === 'approve') return <OpsApprove back={back} />
  if (sub[0] === 'fin') return <LeaderFin sub={sub.slice(1)} back={back} />
  const redo = s.cleanReports.filter(r => r.status === 'Chưa đạt' && zoneReport(s, r.zone)?.id === r.id).length
  const toCheck = s.cleanReports.filter(r => r.status === 'Chờ kiểm tra').length
  const stock = s.productLogs.filter(p => !(p.ktvOk && p.recOk)).length
  const incidents = s.tasks.filter(t => t.earlyReport && ['open', 'doing'].includes(t.status)).length
  const tourIssues = billRows(s).filter(r => r.issue).length
  const taken = new Set(s.tasks.map(t => t.sourceKey).filter(Boolean))
  const al = alerts(s).filter(a => !taken.has(a.key)) // chỉ cảnh báo chưa có người nhận việc — khớp danh sách Việc bất thường
  const opsBad = s.opsChecks.filter(x => !x.ok).length + s.xpChecks.filter(x => x.status === 'Không đạt – lễ tân xử lý' || x.help).length
  return <>
    <Hero tag="Leader · Phạm vi chi nhánh" title="Điều hành ca hôm nay" sub={al.length + opsBad ? `${al.length} cảnh báo tự động · ${opsBad} vấn đề cơ sở lễ tân báo` : 'Chưa có ngoại lệ vận hành nổi bật.'} />
    <Tiles items={[{ v: redo, l: 'Task cần làm lại', tone: redo ? 'warn' : undefined, onClick: () => go('home/cleaning') }, { v: stock, l: 'Kho cần đối chiếu', onClick: () => go('home/products') }, { v: incidents, l: 'Sự cố chưa đóng', tone: incidents ? 'warn' : undefined, onClick: () => go('home/tasks') }, { v: tourIssues, l: 'Lệch tour', onClick: () => go('home/bills') }]} />
    <TeamOps />
    {s.opsReqs.some(r => r.status === 'Chờ duyệt') && <button className="softbtn wide" onClick={() => go('home/approve')}>Duyệt đề xuất vận hành của lễ tân ({s.opsReqs.filter(r => r.status === 'Chờ duyệt').length})</button>}
    <LeaderMothers />
    {opsBad > 0 && <Block title="Vấn đề cơ sở lễ tân báo"><div className="card list">{[...s.opsChecks.filter(x => !x.ok).map(x => ({ id: x.id, t: x.item, d: x.note, by: x.by, at: x.at })), ...s.xpChecks.filter(x => x.status === 'Không đạt – lễ tân xử lý' || x.help).map(x => ({ id: x.id, t: x.area, d: x.note || x.ai || '', by: x.by, at: x.at }))].map(x => <div key={x.id} className="item"><span className="sev cao" /><div className="body"><div className="t">{x.t}</div><div className="d">{x.d} · {D.staffName(x.by)} · {D.hhmm(x.at)}</div></div></div>)}</div></Block>}
  </>
}

export function TeamTab({ sub }: { sub: string[] }) {
  const { s, go } = useStore()
  const back = () => go('team')
  switch (sub[0]) {
    case 'staff': return <StaffPage back={back} />
    case 'roster': return <ShiftTourPage back={back} />
    case 'attendance': return <AttendancePage back={back} />
    case 'points': return <PointsPage back={back} />
    case 'leave': return <LeavePage back={back} />
    case 'perf': return <StaffPerf back={back} />
    case 'salary': return <SalaryPage back={back} />
    case 'train': return <TrainTree back={back} />
    case 'train-old': return <><SubHead title="Đào tạo" sub="Học → Test → Tìm điểm yếu → Lộ trình → Nhắc luyện → Test lại" onBack={back} />
      <NodeSpec rows={[{ t: 'Khóa học & SOP theo vai trò', d: D.SOPS.map(x => x.title).join(' · ') }, { t: 'Bài test & kết quả từng nhân viên', d: 'Điểm, phần còn yếu, người chấm' }, { t: 'Kèm cặp', d: 'Từ phản hồi khách: lực/kỹ thuật, thái độ, thời gian chờ' }, { t: 'Lộ trình phát triển', d: 'KTV → KTV chính → Leader ca' }]} /></>
  }
  const pending = s.points.filter(p => p.status === 'Chờ duyệt').length
  return <>
    <Hero tag="Đội ngũ" title="Nhân sự & năng lực" sub={`${D.ktvs().length} KTV · ${s.staff.filter(x => x.role === 'reception').length} lễ tân`} />
    <Nodes items={[
      { t: 'Nhân viên', d: 'Trạng thái hôm nay · điểm uy tín · phản hồi', onClick: () => go('team/staff') },
      { t: 'Lịch chia ca', d: 'Bảng 4 tuần · thứ tự tour', onClick: () => go('team/roster') },
      { t: 'Chấm công', d: 'Giờ vào · đi trễ · chưa chấm', onClick: () => go('team/attendance') },
      { t: 'Điểm uy tín', d: 'Duyệt điểm lễ tân ghi nhận · bảng xếp hạng', badge: pending, onClick: () => go('team/points') },
      { t: 'Đơn nghỉ / đổi ca', d: 'CEO duyệt — Leader theo dõi để xếp tour', badge: s.leaves.filter(l => l.status === 'Chờ duyệt').length, onClick: () => go('team/leave') },
      { t: 'Đào tạo', d: 'KTV / lễ tân → chuyên môn · sale · văn hóa · kĩ năng mềm', onClick: () => go('team/train') },
      { t: 'Lương', d: 'Bảng lương nhân sự từng tháng', onClick: () => go('team/salary') },
      { t: 'Hiệu suất nhân sự', d: 'Chọn kĩ thuật viên hoặc lễ tân', onClick: () => go('team/perf') },
    ]} />
  </>
}

function StaffPage({ back }: { back: () => void }) {
  const { s } = useStore()
  return <>
    <SubHead title="Nhân viên" sub="Trạng thái, tải tour, điểm uy tín và phản hồi — để cân bằng tăng trưởng với chất lượng" onBack={back} />
    <div className="card list">{s.staff.filter(x => x.role === 'ktv' || x.role === 'reception').map(k => { const st = k.role === 'ktv' ? ktvState(s, k.id) : null; const n = s.appts.filter(a => a.ktvId === k.id && !['cancelled', 'no_show'].includes(a.status)).length; const fb = s.feedback.filter(f => f.ktvId === k.id)
      return <div key={k.id} className="item"><Av name={k.name} /><div className="body"><div className="t">{k.name} <span className="tiny muted">· {D.ROLE_LABEL[k.role]} · ca {k.shift}</span></div><div className="d">{k.role === 'ktv' ? `${n} tour hôm nay` : `${s.invoices.filter(i => i.creator === k.name).length} hóa đơn`} · {pointsOf(s, k.id)} điểm{fb.length ? ` · ${fb.map(f => `${f.group} ${f.rating}/5`).join(', ')}` : ''}</div></div>{st && <Pill tone={st.tone} dot>{st.label}</Pill>}</div> })}</div>
  </>
}

export function PointsPage({ back }: { back: () => void }) {
  const { s, decidePoint, proposePoint } = useStore()
  const [f, setF] = useState({ staffId: '', delta: 1, reason: '' })
  const pending = s.points.filter(p => p.status === 'Chờ duyệt')
  const rank = s.staff.filter(x => x.role === 'ktv' || x.role === 'reception').map(x => ({ x, p: pointsOf(s, x.id) })).sort((a, b) => b.p - a.p)
  return <>
    <SubHead title="Điểm uy tín" sub="Điểm đi theo sự kiện thật + minh chứng. Lễ tân ghi nhận, Leader/CEO duyệt điểm có tranh chấp." onBack={back} />
    <Block title="Chờ duyệt" right={<span className="badge">{pending.length}</span>}><div className="card list">{pending.map(p => <div key={p.id} className="item"><div className="body"><div className="t">{D.staffName(p.staffId)} · {p.delta > 0 ? '+' : ''}{p.delta}</div><div className="d">{p.reason} · ghi nhận: {D.staffName(p.by)} · {D.hhmm(p.at)}</div></div><button className="btn sm danger" onClick={() => decidePoint(p.id, false)}>Từ chối</button><button className="btn sm pri" onClick={() => decidePoint(p.id, true)}>Duyệt</button></div>)}{!pending.length && <Empty>Không có điểm chờ duyệt</Empty>}</div></Block>
    <Block title="Ghi điểm trực tiếp">
      <div className="grid g3"><label className="f">Nhân viên<select id="lp-st" className="inp" value={f.staffId} onChange={e => setF({ ...f, staffId: e.target.value })}><option value="">— chọn —</option>{rank.map(r => <option key={r.x.id} value={r.x.id}>{r.x.name}</option>)}</select></label>
        <label className="f">Điểm<input id="lp-d" className="inp num" type="number" min={-10} max={10} value={f.delta} onChange={e => setF({ ...f, delta: +e.target.value })} /></label>
        <label className="f">Sự việc & minh chứng<input id="lp-r" className="inp" value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} /></label></div>
      <button className="btn pri" disabled={!f.staffId || !f.delta || !f.reason.trim()} onClick={() => { proposePoint(f.staffId, f.delta, f.reason.trim()); setF({ staffId: '', delta: 1, reason: '' }) }}>Ghi điểm</button>
    </Block>
    <Block title="Bảng điểm hôm nay"><div className="card list">{rank.map((r, i) => <div key={r.x.id} className="item"><span className="num strong" style={{ width: 22 }}>{i + 1}</span><Av name={r.x.name} /><div className="body"><div className="t">{r.x.name}</div><div className="d">{D.ROLE_LABEL[r.x.role]}</div></div><span className="num strong">{r.p}</span></div>)}</div></Block>
  </>
}

// ═══════════════ MARKETING ═══════════════
export function MarketingHome({ sub }: { sub: string[] }) {
  const { s, me, go } = useStore()
  const page = dailySub(sub[0], () => go('home'))
  if (page) return <>{page}</>
  const running = s.programs.filter(p => p.status === 'Đang chạy')
  return <SpecHub rows={MKT_NODES.M1.rows} sub={sub[0]} leaf={sub[1]} base="home" tag="Marketing" title="Marketing hôm nay"
    intro={<Tiles items={[{ v: running.length, l: 'Chiến dịch đang chạy' }, { v: s.customers.filter(c => c.firstVisit === D.dateShort()).length, l: 'Khách mới hôm nay' }, { v: s.approvals.filter(a => a.status === 'Chờ duyệt' && a.fromId === me.id).length, l: 'Chờ chị duyệt' }, { v: D.vndShort(running.reduce((t, p) => t + p.revenue, 0)), l: 'Tiền thu từ chiến dịch', s: D.SAMPLE_NOTE }]} />}
    custom={{ '1.1': () => <MarketingScreen />, '1.7': () => <ProgramsPanel />, '1.10': () => <MocScreen /> }} />
}
export function MarketingCust({ sub }: { sub: string[] }) {
  const { s } = useStore()
  const bySource = Object.entries(s.customers.reduce((m, c) => { m[c.source] = (m[c.source] ?? 0) + 1; return m }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])
  const segs = ['Khách mới', 'Khách quay lại', 'Đang dùng liệu trình', 'Lâu chưa đến']
  return <SpecHub rows={MKT_NODES.M2.rows} sub={sub[0]} leaf={sub[1]} base="cust" tag="Khách hàng" title="Nguồn khách & hành trình"
    custom={{
      '2.3': () => <div className="card pad col">{bySource.map(([src, n]) => <div key={src} className="col" style={{ gap: 3 }}><div className="row small"><span>{src}</span><span className="right-al num strong">{n} khách</span></div><div className="bar"><i style={{ width: `${(n / bySource[0][1]) * 100}%` }} /></div></div>)}<div className="tiny muted">Nguồn đầu tiên — không ghi đè khi khách quay lại.</div></div>,
      '2.4': () => <Tiles items={segs.map(g => ({ v: s.customers.filter(c => custSegment(c) === g).length, l: g }))} />,
      '2.14': () => <RoiPanel />,
    }} />
}
export function MarketingMine({ sub }: { sub: string[] }) {
  const { me, go } = useStore()
  if (sub[0] === 'time' || sub[0] === 'perf') return <MyPage sub={sub} />
  return <SpecHub rows={MKT_NODES.M4.rows} sub={sub[0]} leaf={sub[1]} base="me" tag="Của tôi" title="Kết quả & năng lực"
    custom={{ '4.2': () => <button className="softbtn" onClick={() => go('me/time')}>Mở lịch & chấm công</button>, '4.8': () => <button className="softbtn" onClick={() => go('me/perf')}>Mở điểm uy tín của tôi</button>, '4.5': () => <ProgramsPanel ownerFilter={me.id} only /> }} />
}

// ═══════════════ CEO ═══════════════
const NM = (k: string) => CEO_NODES[k]
export function CeoHome({ sub }: { sub: string[] }) {
  const { s, go } = useStore()
  const back = () => go('home')
  const page = dailySub(sub[0], back)
  if (page) return <>{page}</>
  if (sub[0] === 'ops') return <OpsHub sub={sub[1]} base="home/ops" />
  if (sub[0] === 'attendance') return <AttendancePage back={back} />
  if (sub[0] === 'n1') return <SpecHub rows={NM('NM1').rows} sub={sub[1]} leaf={sub[2]} base="home/n1" tag="① Hôm nay" title={NM('NM1').title} custom={{ '1.1': () => <CeoHealth />, '1.2': () => <CeoHealth />, '1.3': () => <AlertsList />, '1.7': () => <ApprovalsScreen /> }} />
  if (sub[0] === 'n2') return <SpecHub rows={NM('NM8').rows} sub={sub[1]} leaf={sub[2]} base="home/n2" tag="② Hôm nay" title={NM('NM8').title} custom={Object.fromEntries(NM('NM8').rows.map((r, i) => [r.no, () => i === 0 ? <button className="softbtn wide" onClick={() => go('home/ops')}>Mở trung tâm vận hành (lịch · hàng chờ · giường · thu ngân)</button> : /vệ sinh|chất lượng/i.test(r.t) ? <button className="softbtn" onClick={() => go('home/cleaning')}>Mở checklist dọn dẹp & điểm</button> : /vật tư|kho/i.test(r.t) ? <button className="softbtn" onClick={() => go('home/products')}>Mở đối chiếu sản phẩm</button> : /sự cố/i.test(r.t) ? <AlertsList /> : <NodeSpec rows={[{ t: r.t, d: r.d }]} />]))} />
  if (sub[0] === 'n3') return <SpecHub rows={NM('NM11').rows} sub={sub[1]} leaf={sub[2]} base="home/n3" tag="③ Hôm nay" title={NM('NM11').title} intro={<Initiatives />} />
  const o = overview(s)
  const waiting = s.approvals.filter(a => a.status === 'Chờ duyệt').length
  return <>
    <Hero tag="CEO · Dữ liệu thật" title="Trung tâm điều hành Home" sub={waiting ? `${waiting} việc đang chờ chị quyết định.` : 'Hiện chưa có ngoại lệ nổi bật cần xử lý.'}>
      <button className="hbtn solid" onClick={() => go('moc')}>Phê duyệt ({waiting})</button><button className="hbtn" onClick={() => go('home/ops')}>Trung tâm vận hành</button>
    </Hero>
    <Tiles items={[
      { v: s.tasks.filter(t => t.earlyReport && ['open', 'doing'].includes(t.status)).length, l: 'Sự cố chưa đóng', onClick: () => go('home/n2') },
      { v: s.productLogs.filter(p => !(p.ktvOk && p.recOk)).length, l: 'Kho cần đối chiếu', onClick: () => go('home/products') },
      { v: s.reviews.filter(r => r.status === 'Chờ đối soát').length + s.points.filter(p => p.status === 'Chờ duyệt').length, l: 'Review/điểm cần duyệt', onClick: () => go(s.points.some(p => p.status === 'Chờ duyệt') ? 'moc/points' : 'moc/reviews') },
      { v: billRows(s).filter(r => r.issue).length, l: 'Lệch đối soát tour', onClick: () => go('home/bills') },
      { v: D.vndShort(o.revenue), l: 'Tiền đã thu hôm nay', tone: 'ok' }, { v: `${o.ktvBusy}/${o.ktvIn}`, l: 'KTV đang làm / trong ca' },
    ]} />
    <ChipGrid items={[{ l: 'Ca & Tour', onClick: () => go('home/ops'), solid: true }, { l: 'Chấm công', onClick: () => go('home/attendance') }, { l: 'Lịch chia ca', onClick: () => go('home/shift') }, { l: 'Nhân viên', onClick: () => go('me/n10') }, { l: 'Cài đặt CEO & AI', onClick: () => go('me/settings') }, { l: 'Chiến dịch', onClick: () => go('cust/n6') }, { l: T.idea.inbox, onClick: () => go('home/ideas'), badge: inboxSuggestions(s, 'ceo').length }]} />
    <TreeNodes items={[
      { no: '①', t: NM('NM1').title, d: 'Sức khỏe Home · tăng/giảm · cảnh báo · ưu tiên', onClick: () => go('home/n1'), kids: kidsOf(NM('NM1').rows, 'home/n1', go) },
      { no: '②', t: NM('NM8').title, d: 'Lễ tân · KTV · công suất · vệ sinh · vật tư · sự cố', onClick: () => go('home/n2'), kids: kidsOf(NM('NM8').rows, 'home/n2', go) },
      { no: '③', t: NM('NM11').title, d: 'Mục tiêu · dự án · tiến độ · điểm nghẽn', onClick: () => go('home/n3'), kids: kidsOf(NM('NM11').rows, 'home/n3', go) },
    ]} />
    <div className="note"><b>Nguyên tắc màn CEO:</b> ưu tiên ngoại lệ cần quyết định. Mỗi chỉ số mở được xuống dữ liệu chi tiết; dữ liệu thiếu được đánh dấu, không xem như bằng 0.</div>
  </>
}
function AlertsList() {
  const { openCustomer } = useStore(); const { s } = useStore()
  const al = alerts(s)
  return <div className="card list">{al.map(a => <div key={a.key} className="item"><span className={`sev ${a.level}`} /><div className="body"><div className="t">{a.title}</div><div className="d">{a.detail} · {a.who === 'leader' ? 'Leader' : 'Lễ tân'} xử lý</div></div>{a.customerId && <button className="btn sm ghost" onClick={() => openCustomer(a.customerId!)}>Hồ sơ</button>}</div>)}{!al.length && <Empty>Không có cảnh báo</Empty>}</div>
}
function Initiatives() {
  const { s } = useStore()
  return <Block title="Sáng kiến & dự án đang chạy"><div className="card list">{s.initiatives.map(i => <div key={i.id} className="item"><div className="body"><div className="t">{i.kind}: {i.title}</div><div className="d">{D.staffName(i.ownerId)} · trước: {i.before}{i.after ? ` → sau: ${i.after}` : ''}</div><div className="bar" style={{ marginTop: 6 }}><i style={{ width: i.progress + '%' }} /></div></div><Pill tone={i.status === 'Đã kiểm chứng' ? 'green' : i.status.startsWith('Chờ') ? 'yellow' : 'grey'}>{i.status}</Pill></div>)}</div></Block>
}
/** m4: chỉ CEO xuất file khách (tải CSV trong trình duyệt) */
function CeoExport() {
  const { s, user } = useStore()
  if (user.role !== 'ceo') return null
  const run = () => { const url = URL.createObjectURL(new Blob(['\ufeff' + customersCsv(s.customers)], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `khach-hang-${D.dateShort().replace(/\//g, '-')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
  return <div className="row small"><button className="btn" onClick={run}>{T.cust.exportBtn}</button><span className="muted">{T.cust.exportNote}</span></div>
}
export function CeoCust({ sub }: { sub: string[] }) {
  const { go } = useStore()
  if (sub[0] === 'n4') return <SpecHub rows={NM('NM2').rows} sub={sub[1]} leaf={sub[2]} base="cust/n4" tag="④ Khách hàng" title={NM('NM2').title} intro={<button className="softbtn" onClick={() => go('cust/all')}>Mở danh sách khách & phản hồi</button>} />
  if (sub[0] === 'n5') return <SpecHub rows={NM('NM3').rows} sub={sub[1]} leaf={sub[2]} base="cust/n5" tag="⑤ Khách hàng" title={NM('NM3').title} />
  if (sub[0] === 'n6') return <SpecHub rows={NM('NM4').rows} sub={sub[1]} leaf={sub[2]} base="cust/n6" tag="⑥ Khách hàng" title={NM('NM4').title} intro={<MarketingScreen />} />
  if (sub[0] === 'all') return <><BackBtn to="cust" /><LeaderCustomers /></>
  return <>
    <Hero tag="Khách hàng" title="Khách hàng & nguồn khách" sub="Không ai được xuất file dữ liệu khách trừ CEO." />
    <TreeNodes items={[{ no: '④', t: NM('NM2').title, d: 'Khách mới/cũ · VIP · giữ chân · tái tục · giới thiệu', onClick: () => go('cust/n4'), kids: kidsOf(NM('NM2').rows, 'cust/n4', go) }, { no: '⑤', t: NM('NM3').title, d: 'Phân nhóm · nguồn · hành trình đến Home', onClick: () => go('cust/n5'), kids: kidsOf(NM('NM3').rows, 'cust/n5', go) }, { no: '⑥', t: NM('NM4').title, d: 'Nội dung · chiến dịch · ngân sách · hiệu quả', onClick: () => go('cust/n6'), kids: kidsOf(NM('NM4').rows, 'cust/n6', go) }]} />
    <button className="softbtn wide" onClick={() => go('cust/all')}>Danh sách khách, VIP, phản hồi, hiệu quả chương trình</button>
    <CeoExport />
  </>
}
export function CeoMoc({ sub }: { sub: string[] }) {
  const { s, go } = useStore()
  const tab = sub[0] ?? 'approvals'
  return <>
    <Hero tag="⑦ Mộc CEO – Phê duyệt – Chỉ đạo" title="Quyết định & chỉ đạo" sub="Duyệt đề xuất, đơn nghỉ, điểm uy tín · hỏi Mộc phân tích" />
    <div style={{ overflowX: 'auto' }}><Seg value={tab} onChange={v => go(`moc/${v}`)} items={[{ k: 'approvals', label: 'Phê duyệt', badge: s.approvals.filter(a => a.status === 'Chờ duyệt').length }, { k: 'points', label: 'Điểm uy tín', badge: s.points.filter(p => p.status === 'Chờ duyệt').length }, { k: 'reviews', label: 'Review chờ đối soát', badge: s.reviews.filter(r => r.status === 'Chờ đối soát').length }, { k: 'ask', label: 'Hỏi Mộc' }]} /></div>
    {tab === 'approvals' && <ApprovalsScreen />}
    {tab === 'points' && <PointsPage back={() => go('moc')} />}
    {tab === 'reviews' && dailySub('reviews', () => go('moc'))}
    {tab === 'ask' && <MocScreen />}
  </>
}
export function CeoMine({ sub }: { sub: string[] }) {
  const { go } = useStore()
  const map: [string, string, string][] = [['n8', 'NM5', '⑧'], ['n9', 'NM6', '⑨'], ['n10', 'NM7', '⑩'], ['n11', 'NM9', '⑪'], ['n12', 'NM10', '⑫'], ['n13', 'NM13', '⑬']]
  if (sub[0] === 'settings') return <SettingsPage />
  const hit = map.find(m => m[0] === sub[0])
  if (hit) return <SpecHub rows={NM(hit[1]).rows} sub={sub[1]} leaf={sub[2]} base={`me/${hit[0]}`} tag={`${hit[2]} Của tôi`} title={NM(hit[1]).title}
    intro={hit[0] === 'n10' ? <><MembersScreen /><button className="softbtn wide" onClick={() => go('moc/points')}>Điểm uy tín toàn Home</button></> : hit[0] === 'n13' ? <button className="softbtn wide" onClick={() => go('me/settings')}>Mở cài đặt phân khu dọn dẹp & quy tắc</button> : hit[0] === 'n8' ? <RevenueToday /> : undefined} />
  return <>
    <Hero tag="Của tôi · CEO" title="Doanh nghiệp của chị" sub="Tài chính · dòng tiền · nhân sự · tổ chức · hồ sơ · cài đặt" />
    <TreeNodes items={map.map(([k, n, no]) => ({ no, t: NM(n).title, d: NM(n).rows.slice(0, 3).map(r => r.t).join(' · '), onClick: () => go(`me/${k}`), kids: kidsOf(NM(n).rows, `me/${k}`, go) }))} />
  </>
}
function RevenueToday() {
  const { s } = useStore()
  const inv = s.invoices.filter(i => i.status !== 'Nháp' && i.status !== 'Đã xóa')
  return <Tiles items={[{ v: D.vndShort(inv.reduce((t, i) => t + i.paid, 0)), l: 'Tiền đã thu hôm nay', tone: 'ok' }, { v: inv.length, l: 'Hóa đơn đã xác nhận' }, { v: D.vndShort(D.HISTORY.month.now.revenue), l: 'Doanh thu tháng', s: D.SAMPLE_NOTE }, { v: D.vndShort(D.HISTORY.month.prev.revenue), l: 'Tháng trước', s: D.SAMPLE_NOTE }]} />
}
function SettingsPage() {
  const { s, go, setZoneOwner } = useStore()
  const people = s.staff.filter(x => x.role === 'ktv' || x.role === 'reception')
  return <>
    <SubHead title="Cài đặt CEO & AI" sub="Cài đặt ngầm thành viên theo quy luật — các màn KTV/lễ tân tự đọc từ đây" onBack={() => go('me')} />
    <Block title="Phân khu dọn dẹp hôm nay" sub="Khu 1–6 ca sáng · 7–12 ca chiều (giặt khăn 4 lần)">
      <div className="card list">{D.ZONES.map(z => <div key={z.no} className="item"><span className="av" style={{ borderRadius: 10 }}>{z.no}</span><div className="body"><div className="t">{z.name}</div><div className="d">Ca {z.shift === 1 ? 'sáng' : 'chiều'}{z.after ? ` · sau ${D.hhmm(z.after)}` : ''}</div></div>
        <select className="inp" style={{ width: 150 }} value={s.zoneOwner[z.no]} onChange={e => setZoneOwner(z.no, e.target.value)} aria-label={`Người phụ trách khu ${z.no}`}>{people.filter(p => p.shift === z.shift).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>)}</div>
    </Block>
    <Block title="Quy tắc đang áp dụng"><div className="card list">{[
      ['Ngân sách Leader/Marketing tự quyết', `≤ ${D.vnd(BUDGET_LIMIT)} và không đổi giá — vượt mức gửi chị duyệt`],
      ['Ca làm', `${D.SHIFTS[1].label} · ${D.SHIFTS[2].label}`], ['Dọn giường giữa 2 khách', '10 phút'],
      ['Điểm dọn dẹp đạt chuẩn', `+${D.ZONE_POINTS} điểm / khu`], ['Điểm lễ tân ghi nhận', 'Leader/CEO duyệt trước khi tính'],
      ['Đơn nghỉ / đổi ca', 'CEO duyệt → bảng chia ca tự cập nhật'], ['Dữ liệu khách', 'SĐT chỉ lễ tân thấy · chỉ CEO xuất file'],
    ].map(([a, b]) => <div key={a} className="item"><div className="body"><div className="t">{a}</div><div className="d">{b}</div></div><Icon n="check" /></div>)}</div></Block>
    <NodeSpec rows={NM('NM13').rows.map(r => ({ t: `${r.no}. ${r.t}`, d: r.d.split(' → ')[0] }))} />
  </>
}

function CeoHealth() {
  const [per, setPer] = useState<'week' | 'month'>('week')
  const h = D.HISTORY[per]
  const rows: [keyof typeof h.now, string, string?, boolean?][] = [['revenue', 'Tiền đã thu', 'đ'], ['newCust', 'Khách mới'], ['returning', 'Khách quay lại'], ['bookings', 'Lượt đặt lịch'], ['showRate', 'Tỷ lệ đến', '%'], ['waitAvg', 'Chờ trung bình', ' phút', true]]
  const fmt = (n: number, u?: string) => (u === 'đ' ? D.vndShort(n) : `${n}${u ?? ''}`)
  return <>
    <div className="row"><Seg value={per} onChange={setPer} items={[{ k: 'week', label: 'Tuần' }, { k: 'month', label: 'Tháng' }]} /><Pill tone="yellow">{D.SAMPLE_NOTE} — sẽ tính từ hóa đơn khi nối dữ liệu</Pill></div>
    <div className="tiles">{rows.map(([k, l, u, inv]) => { const v = h.now[k], p = h.prev[k], tg = h.target[k]; const hit = inv ? v <= tg : v >= tg
      return <div key={k} className="tile"><span className="l">{l}</span><span className="v num">{fmt(v, u)}</span><Delta now={v} prev={p} invert={inv} unit={u === 'đ' ? 'đ' : u === '%' ? ' điểm %' : u} /><span className="s">Kỳ trước {fmt(p, u)} · mục tiêu {fmt(tg, u)} {hit ? '✓' : ''}</span></div> })}</div>
  </>
}

/** Leader — nút mẹ ② Chăm sóc khách hàng Home */
export function LeaderCare({ sub }: { sub: string[] }) {
  const { go } = useStore()
  if (sub[0] === 'all') return <><BackBtn to="cust" /><LeaderCustomers /></>
  return <>
    <Hero tag="② Chăm sóc khách hàng Home" title="Chăm sóc khách hàng" sub="Chọn thời gian · 4 nhóm khách · chiến lược · luồng tin nhắn · phân quyền gọi · kết quả" />
    <LeaderCareTop />
    <ReceptionCustomers embed />
    <button className="softbtn wide" onClick={() => go('cust/all')}>Danh sách khách, VIP, phản hồi, hiệu quả chương trình</button>
  </>
}
