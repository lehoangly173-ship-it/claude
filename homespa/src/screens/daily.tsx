// Trang con dùng chung của "HÔM NAY" (KTV & Lễ tân) — theo sơ đồ NÚT MẸ 1.
// Leader / CEO mở cùng trang này ở chế độ kiểm tra.
import { useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { canSee, cust, myZones, zoneReport, tourOrder, billRows, ktvState, pointsOf } from '../logic'
import { Pill, Empty, Modal, SubHead, Block, Tiles, PhotoInput, Thumb, Seg, Av, Icon } from '../ui'
import { ApptPill } from './ops'

type P = { back: () => void }
const isBoss = (r: D.Role) => r === 'leader' || r === 'ceo'

// ── 1. Ca, đổi ca & thứ tự tour ──
export function ShiftTourPage({ back }: P) {
  const { s, me, user } = useStore()
  const [week, setWeek] = useState(0)
  const [ask, setAsk] = useState(false)
  const order = tourOrder(s)
  const pos = order.indexOf(me.id)
  const people = s.staff.filter(x => x.role === 'ktv' || x.role === 'reception')
  const recs = s.staff.filter(x => x.role === 'reception')
  return <>
    <SubHead title="Ca, đổi ca & thứ tự tour" sub="Lịch 4 tuần · ca của tôi · số thứ tự tour hôm nay" onBack={back}
      right={(user.role === 'ktv' || user.role === 'reception') && <button className="btn pri" onClick={() => setAsk(true)}>Xin đổi ca</button>} />
    {me.shift && <div className="tiles">
      <div className="tile"><span className="l">Ca của tôi hôm nay</span><span className="v" style={{ fontSize: 19 }}>{me.shift === 1 ? 'Ca sáng' : 'Ca chiều'}</span><span className="s">{D.SHIFTS[me.shift].label}</span></div>
      {me.role === 'ktv' && <div className="tile"><span className="l">Thứ tự tour</span><span className="v">#{pos + 1}</span><span className="s">trong {order.length} KTV · tự xoay khi nhận khách</span></div>}
      <div className="tile"><span className="l">Chấm công</span><span className="v" style={{ fontSize: 19 }}>{s.attendance[me.id]?.in != null ? D.hhmm(s.attendance[me.id].in!) : 'Chưa'}</span><span className="s">{s.attendance[me.id]?.in != null && s.attendance[me.id].in! > D.SHIFTS[me.shift].start ? `trễ ${s.attendance[me.id].in! - D.SHIFTS[me.shift].start} phút` : 'đúng giờ'}</span></div>
    </div>}
    <Block title="Lịch chia tour hôm nay" sub="Khách yêu cầu đích danh không làm mất lượt. Thứ tự do hệ thống xoay theo quy luật CEO cài đặt.">
      <div className="grid g2">{([1, 2] as const).map(sh => <div key={sh} className="card pad col"><b>{sh === 1 ? 'SÁNG · 08:00–18:00' : 'CHIỀU · 10:00–20:00'}</b>
        {s.rotation[sh].map(id => { const k = s.staff.find(x => x.id === id)!; const st = ktvState(s, id)
          return <div key={id} className="row small" style={{ background: id === me.id ? 'var(--mint)' : undefined, borderRadius: 10, padding: '4px 6px' }}><span className="num strong" style={{ width: 22 }}>{order.indexOf(id) + 1}</span><span style={{ flex: 1 }}>{k.name}{id === me.id && ' (tôi)'}</span><Pill tone={st.tone} dot>{st.label}</Pill></div> })}
        <div className="tiny muted">Lễ tân: {recs.filter(r => r.shift === sh).map(r => r.name).join(', ') || '—'}</div></div>)}</div>
    </Block>
    <Block title="Bảng chia ca 4 tuần" sub="S = sáng · C = chiều · OFF = nghỉ đã duyệt · đổi ca đã duyệt tự đảo S↔C" right={<Seg value={String(week)} onChange={v => setWeek(+v)} items={[0, 1, 2, 3].map(w => ({ k: String(w), label: `Tuần ${w + 1}` }))} />}>
      <div className="tbl-wrap"><table className="roster"><thead><tr><th>Nhân viên</th>{Array.from({ length: 7 }, (_, i) => <th key={i}>{D.dayLabel(week * 7 + i)}</th>)}</tr></thead>
        <tbody>{people.map(p => <tr key={p.id} style={{ background: p.id === me.id ? 'var(--mint)' : undefined }}><td className="strong">{p.name}<span className="tiny muted"> · {p.role === 'ktv' ? 'KTV' : 'LT'}</span></td>
          {Array.from({ length: 7 }, (_, i) => { const off = week * 7 + i; const lv = s.leaves.find(l => l.staffId === p.id && l.status === 'Đã duyệt' && l.date === D.daysAhead(off)); const base = D.rosterCell(p, off); const c = !lv ? base : lv.kind === 'Nghỉ phép' ? 'OFF' : base === 'S' ? 'C' : base === 'C' ? 'S' : base; return <td key={i}><span className={`cell ${c}`}>{c}</span></td> })}</tr>)}</tbody></table></div>
    </Block>
    {ask && <LeaveModal kind="Đổi ca" onClose={() => setAsk(false)} />}
  </>
}

// ── 2. Nhiệm vụ dọn dẹp ──
export function CleaningPage({ back }: P) {
  const { s, me, user, checkClean } = useStore()
  const [open, setOpen] = useState<number | null>(null)
  const [check, setCheck] = useState<D.CleanReport | null>(null)
  const [note, setNote] = useState('')
  const mine = myZones(s, me.id)
  const boss = isBoss(user.role)
  const pending = s.cleanReports.filter(r => r.status === 'Chờ kiểm tra')
  const todayPts = s.cleanReports.filter(r => r.staffId === me.id).reduce((t, r) => t + (r.points ?? 0), 0)
  const zoneRow = (z: D.Zone) => { const r = zoneReport(s, z.no); const own = s.zoneOwner[z.no] === me.id; const locked = z.after != null && s.now < z.after
    return <button key={z.no} className="item" onClick={() => (boss && r?.status === 'Chờ kiểm tra' ? setCheck(r) : setOpen(z.no))} style={{ background: own ? 'var(--mint)' : undefined }}>
      <span className="av" style={{ borderRadius: 10 }}>{z.no}</span>
      <div className="body"><div className="t">{z.name}{own && ' · của tôi'}</div><div className="d">{D.staffName(s.zoneOwner[z.no])}{z.after ? ` · sau ${D.hhmm(z.after)}` : ''}{r ? ` · báo ${D.hhmm(r.at)}` : ''}{r?.note ? ` · ${r.note}` : ''}</div></div>
      {r ? <Pill tone={r.status === 'Đạt' ? 'green' : r.status === 'Chưa đạt' ? 'red' : 'yellow'}>{r.status}{r.status === 'Đạt' ? ` +${r.points}` : ''}</Pill> : <Pill tone={locked ? 'grey' : 'brown'}>{locked ? 'Chưa đến giờ' : 'Chưa báo'}</Pill>}</button> }
  return <>
    <SubHead title="Nhiệm vụ dọn dẹp" sub={mine.length ? <>Khu vực của bạn là <b>số {mine.join(', ')}</b> — bấm vào khu để xem tiêu chuẩn, tải ảnh và gửi kiểm tra.</> : 'Bảng tổng quan dọn dẹp KTV – lễ tân'} onBack={back} />
    <Tiles items={[...(boss ? [] : [{ v: mine.length ? `số ${mine.join(', ')}` : '—', l: 'Khu của tôi' }, { v: todayPts, l: 'Điểm dọn dẹp hôm nay', tone: 'ok' as const }]), { v: pending.length, l: 'Chờ kiểm tra' }, { v: s.cleanReports.filter(r => r.status === 'Chưa đạt').length, l: 'Cần làm lại', tone: s.cleanReports.some(r => r.status === 'Chưa đạt') ? 'warn' : undefined }]} />
    {boss && pending.length > 0 && <Block title="Chờ kiểm tra ảnh" sub="Xem ảnh → Đạt (+điểm) hoặc Chưa đạt (ghi lý do để làm lại)">
      <div className="card list">{pending.map(r => <button key={r.id} className="item" onClick={() => setCheck(r)}><Thumb src={r.photo} /><div className="body"><div className="t">Khu {r.zone} · {D.ZONES[r.zone - 1].name}</div><div className="d">{D.staffName(r.staffId)} · {D.hhmm(r.at)}</div></div><span className="btn sm pri">Kiểm tra</span></button>)}</div></Block>}
    <Block title="Ca sáng · 08:00–18:00"><div className="card list">{D.ZONES.filter(z => z.shift === 1).map(zoneRow)}</div></Block>
    <Block title="Ca chiều · 10:00–20:00" sub="Giặt khăn 4 lần: chỉ báo cáo được sau mốc giờ"><div className="card list">{D.ZONES.filter(z => z.shift === 2).map(zoneRow)}</div></Block>
    {open != null && <ZoneModal zone={open} onClose={() => setOpen(null)} />}
    {check && <Modal title={`Kiểm tra khu ${check.zone} · ${D.staffName(check.staffId)}`} onClose={() => setCheck(null)} footer={<><button className="btn danger" disabled={!note.trim()} onClick={() => { checkClean(check.id, false, note.trim()); setCheck(null); setNote('') }}>Chưa đạt</button><button className="btn pri" onClick={() => { checkClean(check.id, true, note.trim()); setCheck(null); setNote('') }}>Đạt · +{D.ZONE_POINTS} điểm</button></>}>
      <div className="row"><Thumb src={check.photo} /><span className="small">{check.photo.startsWith('blob:') ? 'Ảnh vừa tải lên' : `Ảnh: ${check.photo}`} · {D.hhmm(check.at)}</span></div>
      {D.ZONES[check.zone - 1].std.map((x, i) => <div key={i} className="small">{check.checks[i] ? '✓' : '✗'} {x}</div>)}
      <label className="f">Nhận xét (bắt buộc khi chưa đạt)<input id="cl-note" className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder="VD: tủ khăn nóng chưa đủ khăn" /></label>
    </Modal>}
  </>
}
function ZoneModal({ zone, onClose }: { zone: number; onClose: () => void }) {
  const { s, me, submitClean, say } = useStore()
  const z = D.ZONES[zone - 1]
  const [photo, setPhoto] = useState('')
  const [checks, setChecks] = useState(z.std.map(() => false))
  const r = zoneReport(s, zone)
  const own = s.zoneOwner[zone] === me.id
  const canSend = own && (!r || r.status === 'Chưa đạt')
  return <Modal title={`Khu vực số ${zone} — ${z.name}`} onClose={onClose} footer={canSend && <button className="btn pri" onClick={() => { const e = submitClean(zone, photo, checks); if (e) say('⚠ ' + e); else onClose() }}>Gửi kiểm tra</button>}>
    <div className="small muted">Phụ trách hôm nay: <b>{D.staffName(s.zoneOwner[zone])}</b>{z.after ? ` · báo cáo sau ${D.hhmm(z.after)}` : ''}</div>
    {r && <div className={r.status === 'Đạt' ? 'ok small' : r.status === 'Chưa đạt' ? 'err small' : 'warn small'}>Lần báo gần nhất {D.hhmm(r.at)} · {r.status}{r.points ? ` · +${r.points} điểm` : ''}{r.note ? ` · ${r.note}` : ''}</div>}
    <div className="col" style={{ gap: 2 }}><span className="eyebrow">Tiêu chuẩn & việc cần làm</span>
      {z.std.map((x, i) => <label key={i} className="check"><input type="checkbox" disabled={!canSend} checked={checks[i]} onChange={() => setChecks(c => c.map((v, j) => (j === i ? !v : v)))} />{x}</label>)}</div>
    <div className="note">Ảnh mẫu: chụp toàn cảnh khu vực, đủ sáng, thấy rõ các điểm trong tiêu chuẩn. Ảnh là căn cứ chấm điểm.</div>
    {canSend ? <PhotoInput value={photo} onChange={setPhoto} label="Tải ảnh khu vực đã dọn" /> : !own ? <div className="small muted">Khu này không phải của bạn hôm nay.</div> : <div className="small muted">Đã gửi — chờ kết quả kiểm tra.</div>}
  </Modal>
}

// ── 3. Bảng điều phối / lịch hẹn (KTV xem) ──
export function BoardPage({ back }: P) {
  const { s, me, openCustomer } = useStore()
  const mine = s.appts.filter(a => a.ktvId === me.id && a.status !== 'cancelled').sort((a, b) => a.start - b.start)
  return <>
    <SubHead title="Bảng điều phối / lịch hẹn" sub="Khách và tour được giao cho tôi · trạng thái KTV toàn Home" onBack={back} />
    <Block title="Tour của tôi hôm nay">
      <div className="card list">{mine.map(a => <button key={a.id} className="item" onClick={() => openCustomer(a.customerId)}><span className="num strong" style={{ width: 46 }}>{D.hhmm(a.start)}</span><div className="body"><div className="t">{cust(s, a.customerId).name}{a.requested && <span className="tiny muted"> · yêu cầu tôi</span>}</div><div className="d">{D.svc(a.serviceId).name} · {a.bedId}{a.note ? ` · ${a.note}` : ''}</div></div><ApptPill a={a} now={s.now} /></button>)}{!mine.length && <Empty>Chưa có tour</Empty>}</div>
    </Block>
    <Block title="Trạng thái KTV" sub="Để biết ai rảnh/bận khi phối hợp"><div className="card list">{D.ktvs().map(k => { const st = ktvState(s, k.id); return <div key={k.id} className="item"><Av name={k.name} /><div className="body"><div className="t">{k.name}</div><div className="d">Ca {k.shift}{st.next ? ` · tiếp: ${D.hhmm(st.next.start)}` : ''}</div></div><Pill tone={st.tone} dot>{st.label}{st.until ? ` · ${D.hhmm(st.until)}` : ''}</Pill></div> })}</div></Block>
  </>
}

// ── 4. Khách hàng của KTV ──
export function KtvCustomersPage({ back }: P) {
  const { s, me, openCustomer } = useStore()
  const [tab, setTab] = useState<'cared' | 'req' | 'closed'>('cared')
  const [kind, setKind] = useState<'all' | 'le' | 'lt'>('all')
  const [minTimes, setMinTimes] = useState(1)
  const caredIds = new Set([...s.appts.filter(a => a.ktvId === me.id && ['in_service', 'done', 'paid'].includes(a.status)).map(a => a.customerId), ...s.customers.filter(c => c.packages.some(p => p.usage.some(u => u.ktv === me.name)) || c.care.some(x => x.by === me.name)).map(c => c.id)])
  const reqIds = new Set(s.appts.filter(a => a.ktvId === me.id && a.requested).map(a => a.customerId))
  const closed = s.customers.filter(c => c.packages.some(p => p.closer === me.name || p.closer === me.id))
  const base = tab === 'cared' ? s.customers.filter(c => caredIds.has(c.id)) : tab === 'req' ? s.customers.filter(c => reqIds.has(c.id)) : closed
  const list = base.filter(c => (kind === 'all' || (kind === 'lt') === c.packages.length > 0) && c.visits >= minTimes).sort((a, b) => b.visits - a.visits)
  const all = s.customers.filter(c => caredIds.has(c.id)).length
  return <>
    <SubHead title="Khách hàng của tôi" sub="SĐT khách được ẩn với KTV. Doanh thu theo tệp khách chỉ CEO xem." onBack={back} />
    <Tiles items={[{ v: all, l: 'KH tôi đã chăm sóc' }, { v: reqIds.size, l: 'KH yêu cầu tôi', s: all ? `tỉ suất ${Math.round(reqIds.size / all * 100)}%` : undefined, tone: 'ok' }, { v: closed.length, l: 'KH tôi chốt liệu trình' }, { v: pointsOf(s, me.id), l: 'Điểm uy tín' }]} />
    <Seg value={tab} onChange={setTab} items={[{ k: 'cared', label: 'Tôi đã chăm sóc' }, { k: 'req', label: 'Yêu cầu tôi' }, { k: 'closed', label: 'Tôi chốt liệu trình' }]} />
    <div className="row"><Seg value={kind} onChange={setKind} items={[{ k: 'all', label: 'Tất cả' }, { k: 'le', label: 'Khách lẻ' }, { k: 'lt', label: 'Liệu trình' }]} />
      <label className="row small muted">Số lần ≥<input className="inp num" type="number" min={1} value={minTimes} onChange={e => setMinTimes(Math.max(1, +e.target.value || 1))} style={{ width: 70 }} /></label></div>
    <div className="card list">{list.map(c => { const p = c.packages[0]; return <button key={c.id} className="item" onClick={() => openCustomer(c.id)}><Av name={c.name} /><div className="body"><div className="t">{c.name} <span className="tiny muted">· mã {c.code}</span></div><div className="d">{c.visits} lần · {c.lastVisitDays ? `${c.lastVisitDays} ngày trước` : 'hôm nay'}{p ? ` · ${p.cardCode} còn ${D.pkgLeftLabel(p)}` : ' · khách lẻ'}{c.health ? ` · ${c.health}` : ''}</div></div>{c.vip && <Pill tone="yellow">VIP</Pill>}</button> })}
      {!list.length && <Empty>Chưa có khách trong mục này</Empty>}</div>
  </>
}

// ── 5. Thông báo quan trọng ──
export function NoticesPage({ back }: P) {
  const { s, me, user, markRead, markAllRead, go } = useStore()
  const list = s.notifs.filter(n => canSee(n, user.role, me.id))
  return <>
    <SubHead title="Thông báo quan trọng" sub="Cập nhật mới · đào tạo · lịch yêu cầu khách · điểm số chung" onBack={back} right={<button className="btn" onClick={markAllRead}>Đã đọc hết</button>} />
    <Block title="Ghim từ Home"><div className="card list">{D.ANNOUNCEMENTS.map(a => <div key={a.id} className="item"><Pill tone="green">{a.tag}</Pill><div className="body"><div className="t">{a.title}</div><div className="d">{a.by}</div></div></div>)}</div></Block>
    <Block title="Vừa xảy ra"><div className="card list">{list.map(n => { const read = n.readBy.includes(me.id); return <button key={n.id} className="item" onClick={() => { markRead(n.id); if (n.nav) go(n.nav) }}>{!read && <span className="sev cao" />}<div className="body"><div className="t" style={{ fontWeight: read ? 500 : 700 }}>{n.text}</div><div className="d">{n.cat} · {D.hhmm(n.min)} · {n.detail}</div></div><Icon n="arrow" /></button> })}{!list.length && <Empty>Chưa có thông báo</Empty>}</div></Block>
  </>
}

// ── 6. Bill Money ──
export function BillsPage({ back }: P) {
  const { s, me, user, uploadBill, confirmBills } = useStore()
  const [shift, setShift] = useState<'1' | '2'>(String(me.shift ?? 1) as '1' | '2')
  const [photo, setPhoto] = useState('')
  const [note, setNote] = useState('')
  const rows = billRows(s)
  const issues = rows.filter(r => r.issue).map(r => `${cust(s, r.a.customerId).name}: ${r.issue}`)
  const isRec = user.role === 'reception'
  const canUpload = user.role === 'ktv' || isRec
  return <>
    <SubHead title={isRec ? 'Bill Money nhóm chung' : 'Bill Money'} sub="Chọn ca → tải ảnh bill. Hệ thống đối soát ngầm với tour đã làm để xác nhận bill." onBack={back} />
    {canUpload && <Block title="Tải ảnh bill" sub={`Ngày ${D.dateShort()}`}>
      <Seg value={shift} onChange={setShift} items={[{ k: '1', label: 'Ca sáng' }, { k: '2', label: 'Ca chiều' }]} />
      <PhotoInput value={photo} onChange={setPhoto} label="Chụp / chọn ảnh bill" />
      <input id="bill-note" className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tùy chọn) — VD: bill 2 khách gộp" />
      <button className="btn pri" disabled={!photo} onClick={() => { uploadBill(+shift as 1 | 2, photo, note.trim()); setPhoto(''); setNote('') }}>Gửi ảnh bill</button>
      <div className="row">{s.bills.filter(b => b.staffId === me.id).map(b => <span key={b.id} className="row small"><Thumb src={b.photo} />{D.hhmm(b.at)} · ca {b.shift}</span>)}</div>
    </Block>}
    <Block title="Đối soát tour ↔ hóa đơn" sub="Máy tự quét: tên khách – thời gian trị liệu – KTV – đã thu chưa" right={s.billCheck && <Pill tone={s.billCheck.issues.length ? 'yellow' : 'green'}>Đã xác nhận {D.hhmm(s.billCheck.at)}</Pill>}>
      <div className="card list">{rows.map(({ a, inv, photo: ph, issue }) => <div key={a.id} className="item"><span className="num strong" style={{ width: 46 }}>{D.hhmm(a.start)}</span><div className="body"><div className="t">{cust(s, a.customerId).name} · KTV {D.staffName(a.ktvId)}</div><div className="d">{D.svc(a.serviceId).name}{inv ? ` · ${inv.code} · đã thu ${D.vnd(inv.paid)}` : ''}{ph ? ' · có ảnh bill' : ''}</div>{issue && <div className="tiny" style={{ color: 'var(--r-fg)' }}>{issue}</div>}</div>
        <Pill tone={a.status === 'in_service' ? 'purple' : issue ? 'red' : 'green'}>{a.status === 'in_service' ? 'Đang làm' : issue ? 'Chưa khớp' : 'Khớp'}</Pill></div>)}{!rows.length && <Empty>Chưa có tour</Empty>}</div>
      {isRec && <button className="btn pri" onClick={() => confirmBills(rows.filter(r => !r.issue && r.a.status !== 'in_service').length, issues)}>Xác nhận danh sách khách & hóa đơn cho nhóm</button>}
      {s.billCheck && <div className={s.billCheck.issues.length ? 'warn small' : 'ok small'}>{D.staffName(s.billCheck.by)} xác nhận lúc {D.hhmm(s.billCheck.at)}: {s.billCheck.matched} tour khớp{s.billCheck.issues.length ? ` · chưa khớp: ${s.billCheck.issues.join(' · ')}` : ''}</div>}
    </Block>
  </>
}

// ── 7. Đánh giá Google / Facebook ──
export function ReviewsPage({ back }: P) {
  const { s, me, user, addReview, checkReview } = useStore()
  const [platform, setPlatform] = useState<D.Review['platform']>('Google')
  const [cid, setCid] = useState('')
  const [photo, setPhoto] = useState('')
  const myCust = [...new Set(s.appts.filter(a => a.ktvId === me.id && ['done', 'paid', 'in_service'].includes(a.status)).map(a => a.customerId))]
  const canCheck = user.role === 'reception' || isBoss(user.role)
  const list = user.role === 'ktv' ? s.reviews.filter(r => r.staffId === me.id) : s.reviews
  return <>
    <SubHead title="Đánh giá Google, Facebook" sub="Minh chứng riêng cho từng tour · đối soát với ảnh trên Google Map" onBack={back} />
    {(user.role === 'ktv' || user.role === 'reception') && <Block title="Gửi minh chứng đánh giá">
      <Seg value={platform} onChange={setPlatform} items={[{ k: 'Google', label: 'Google Maps' }, { k: 'Facebook', label: 'Facebook' }]} />
      <label className="f">Khách của tour<select id="rv-cust" className="inp" value={cid} onChange={e => setCid(e.target.value)}><option value="">— chọn khách —</option>{(user.role === 'ktv' ? myCust : s.customers.map(c => c.id)).map(id => <option key={id} value={id}>{cust(s, id).name}</option>)}</select></label>
      <PhotoInput value={photo} onChange={setPhoto} label="Ảnh chụp đánh giá của khách" />
      <button className="btn pri" disabled={!photo || !cid} onClick={() => { addReview(platform, cid, photo); setPhoto(''); setCid('') }}>Gửi đối soát</button>
    </Block>}
    <Block title="Danh sách minh chứng"><div className="card list">{list.map(r => <div key={r.id} className="item"><Thumb src={r.photo} /><div className="body"><div className="t">{r.platform} · {r.customerId ? cust(s, r.customerId).name : '—'}</div><div className="d">{D.staffName(r.staffId)} · {D.hhmm(r.at)}{r.checker ? ` · kiểm: ${D.staffName(r.checker)}` : ''}</div></div>
      {r.status === 'Chờ đối soát' && canCheck && r.staffId !== me.id ? <><button className="btn sm danger" onClick={() => checkReview(r.id, false)}>Không khớp</button><button className="btn sm pri" onClick={() => checkReview(r.id, true)}>Khớp Google/FB</button></> : <Pill tone={r.status === 'Đã xác nhận' ? 'green' : r.status === 'Không khớp' ? 'red' : 'yellow'}>{r.status}</Pill>}</div>)}{!list.length && <Empty>Chưa có minh chứng</Empty>}</div></Block>
  </>
}

// ── 8. Đối chiếu sản phẩm (xác nhận 2 bên) ──
export function ProductsPage({ back }: P) {
  const { s, me, user, addProduct, confirmProduct } = useStore()
  const [f, setF] = useState({ product: D.PRODUCTS[0] as string, qty: 1, ktvId: D.ktvs()[0]?.id ?? '' })
  const [photo, setPhoto] = useState('')
  const isRec = user.role === 'reception'
  const list = user.role === 'ktv' ? s.productLogs.filter(p => p.ktvId === me.id) : s.productLogs
  const open = list.filter(p => !(p.ktvOk && p.recOk)).length
  return <>
    <SubHead title={isRec ? 'Đối chiếu sản phẩm, kiểm kho' : 'Đối chiếu sản phẩm'} sub="Dầu, cao hổ, sữa chua… Bấm xác nhận 2 bên (KTV & lễ tân). Chưa đủ 2 bên → bộ ảnh là điểm chốt để truy cứu." onBack={back} />
    <Tiles items={[{ v: list.length, l: 'Lượt xuất/nhận hôm nay' }, { v: open, l: 'Chưa đủ 2 bên xác nhận', tone: open ? 'warn' : 'ok' }]} />
    {(user.role === 'ktv' || isRec) && <Block title={isRec ? 'Xuất sản phẩm cho KTV' : 'Ghi nhận sản phẩm tôi nhận'}>
      <div className="grid g3"><label className="f">Sản phẩm<select id="pr-p" className="inp" value={f.product} onChange={e => setF({ ...f, product: e.target.value })}>{D.PRODUCTS.map(p => <option key={p}>{p}</option>)}</select></label>
        <label className="f">Số lượng<input id="pr-q" className="inp num" type="number" min={1} value={f.qty} onChange={e => setF({ ...f, qty: Math.max(1, +e.target.value || 1) })} /></label>
        {isRec && <label className="f">KTV nhận<select id="pr-k" className="inp" value={f.ktvId} onChange={e => setF({ ...f, ktvId: e.target.value })}>{D.ktvs().map(k => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label>}</div>
      <PhotoInput value={photo} onChange={setPhoto} label="Ảnh xác minh sản phẩm" />
      <button className="btn pri" disabled={!photo} onClick={() => { addProduct(f.product, f.qty, f.ktvId, photo); setPhoto('') }}>Ghi nhận & xác nhận phía {isRec ? 'lễ tân' : 'KTV'}</button>
    </Block>}
    <Block title="Sổ đối chiếu"><div className="card list">{list.map(p => <div key={p.id} className="item"><Thumb src={p.photo} /><div className="body"><div className="t">{p.product} × {p.qty} · KTV {D.staffName(p.ktvId)}</div><div className="d">Lễ tân {p.recId ? D.staffName(p.recId) : 'chưa nhận'} · {D.hhmm(p.at)}</div></div>
      <Pill tone={p.ktvOk ? 'green' : 'yellow'}>KTV {p.ktvOk ? '✓' : 'chờ'}</Pill><Pill tone={p.recOk ? 'green' : 'yellow'}>LT {p.recOk ? '✓' : 'chờ'}</Pill>
      {((isRec && !p.recOk) || (user.role === 'ktv' && p.ktvId === me.id && !p.ktvOk)) && <button className="btn sm pri" onClick={() => confirmProduct(p.id)}>Xác nhận</button>}</div>)}{!list.length && <Empty>Chưa có lượt nào</Empty>}</div>
      <div className="tiny muted">Ảnh sản phẩm giữ 6 tháng – 1 năm rồi reset, báo cáo tổng giữ lại 1 lần.</div></Block>
  </>
}

// ── 9. Xin nghỉ phép ──
export function LeaveModal({ kind: k0, onClose }: { kind?: D.Leave['kind']; onClose: () => void }) {
  const { requestLeave } = useStore()
  const [kind, setKind] = useState<D.Leave['kind']>(k0 ?? 'Nghỉ phép')
  const [date, setDate] = useState(D.daysAhead(1))
  const [detail, setDetail] = useState('')
  return <Modal title="Gửi đơn — CEO duyệt" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn pri" disabled={!detail.trim()} onClick={() => { requestLeave(kind, date, detail.trim()); onClose() }}>Gửi đơn</button></>}>
    <Seg value={kind} onChange={setKind} items={[{ k: 'Nghỉ phép', label: 'Nghỉ phép' }, { k: 'Đổi ca', label: 'Đổi ca' }]} />
    <label className="f">Ngày<select id="lv-date" className="inp" value={date} onChange={e => setDate(e.target.value)}>{Array.from({ length: 28 }, (_, i) => D.daysAhead(i + 1)).map(d => <option key={d}>{d}</option>)}</select></label>
    <label className="f">{kind === 'Đổi ca' ? 'Đổi với ai / sang ca nào' : 'Lý do'}<textarea id="lv-detail" className="inp" value={detail} onChange={e => setDetail(e.target.value)} placeholder={kind === 'Đổi ca' ? 'VD: đổi ca sáng với Hiền' : 'VD: việc gia đình'} /></label>
  </Modal>
}
export function LeavePage({ back }: P) {
  const { s, me, user } = useStore()
  const [open, setOpen] = useState(false)
  const list = isBoss(user.role) ? s.leaves : s.leaves.filter(l => l.staffId === me.id)
  return <>
    <SubHead title="Xin nghỉ phép / đổi ca" sub="Điền biểu mẫu → CEO duyệt → tự cập nhật bảng chia ca" onBack={back} right={user.role !== 'ceo' && <button className="btn pri" onClick={() => setOpen(true)}>Tạo đơn</button>} />
    <div className="card list">{list.map(l => <div key={l.id} className="item"><div className="body"><div className="t">{l.kind} · {l.date}{isBoss(user.role) && ` · ${D.staffName(l.staffId)}`}</div><div className="d">{l.detail} · gửi {D.hhmm(l.at)}</div></div><Pill tone={l.status === 'Đã duyệt' ? 'green' : l.status === 'Từ chối' ? 'red' : 'yellow'}>{l.status}</Pill></div>)}{!list.length && <Empty>Chưa có đơn</Empty>}</div>
    {open && <LeaveModal onClose={() => setOpen(false)} />}
  </>
}

// ── 10. Báo cáo sự cố ──
export function IncidentPage({ back }: P) {
  const { s, me, addTask } = useStore()
  const [txt, setTxt] = useState('')
  const [photo, setPhoto] = useState('')
  const mine = s.tasks.filter(t => t.earlyReport && t.createdBy === me.id)
  return <>
    <SubHead title="Báo cáo sự cố" sub="Mô tả · ảnh · theo dõi trạng thái xử lý. Báo sớm được ghi nhận tích cực, không trừ điểm." onBack={back} />
    <Block title="Báo sự cố mới">
      <textarea id="inc-txt" className="inp" value={txt} onChange={e => setTxt(e.target.value)} placeholder="VD: máy xông giường TL-08 yếu, khách phàn nàn lạnh" />
      <PhotoInput value={photo} onChange={setPhoto} label="Ảnh sự cố (nếu có)" />
      <button className="btn pri" disabled={!txt.trim()} onClick={() => { addTask({ title: `${D.ROLE_LABEL[me.role]} ${me.name} báo: ${txt.trim().slice(0, 60)}`, detail: txt.trim(), category: 'Vận hành', priority: 'vừa', ownerId: D.firstOf('leader'), earlyReport: true, evidence: photo || undefined }); setTxt(''); setPhoto('') }}>Gửi Leader</button>
    </Block>
    <Block title="Sự cố tôi đã báo"><div className="card list">{mine.map(t => <div key={t.id} className="item"><span className={`sev ${t.priority}`} /><div className="body"><div className="t">{t.detail}</div><div className="d">{D.hhmm(t.createdMin)} · xử lý: {D.staffName(t.ownerId)}{t.result ? ` · ${t.result}` : ''}</div></div><Pill tone={t.status === 'done' ? 'green' : t.status === 'doing' ? 'yellow' : 'grey'}>{t.status === 'done' ? 'Đã xử lý' : t.status === 'doing' ? 'Đang xử lý' : 'Đã nhận'}</Pill></div>)}{!mine.length && <Empty>Chưa báo sự cố nào</Empty>}</div></Block>
  </>
}

// ── Chấm công nhóm (Leader/CEO) ──
export function AttendancePage({ back }: P) {
  const { s } = useStore()
  const people = s.staff.filter(x => x.shift)
  return <>
    <SubHead title="Chấm công nhóm" sub={`Hôm nay ${D.dateShort()} · quét QR khi vào ca`} onBack={back} />
    <Tiles items={[{ v: people.filter(p => s.attendance[p.id]?.in != null).length, l: 'Đã chấm công' }, { v: people.filter(p => { const a = s.attendance[p.id]?.in; return a != null && a > D.SHIFTS[p.shift!].start }).length, l: 'Đi trễ', tone: 'warn' }, { v: people.filter(p => s.attendance[p.id]?.in == null && s.now >= D.SHIFTS[p.shift!].start).length, l: 'Chưa chấm (đã vào ca)', tone: 'warn' }]} />
    <div className="card list">{people.map(p => { const a = s.attendance[p.id]; const st = D.SHIFTS[p.shift!].start; const late = a?.in != null && a.in > st
      return <div key={p.id} className="item"><Av name={p.name} /><div className="body"><div className="t">{p.name} · {p.role === 'ktv' ? 'KTV' : 'Lễ tân'}</div><div className="d">Ca {p.shift} · vào {D.hhmm(st)}</div></div>
        <Pill tone={a?.in == null ? (s.now >= st ? 'red' : 'grey') : late ? 'yellow' : 'green'}>{a?.in == null ? (s.now >= st ? 'Chưa chấm' : 'Chưa vào ca') : `${D.hhmm(a.in)}${late ? ` · trễ ${a.in - st}p` : ''}`}</Pill></div> })}</div>
  </>
}
