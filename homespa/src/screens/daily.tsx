// Trang con dùng chung của "HÔM NAY" (KTV & Lễ tân) — theo sơ đồ NÚT MẸ 1.
// Leader / CEO mở cùng trang này ở chế độ kiểm tra.
import { useRef, useState, ChangeEvent } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { canSee, cust, myZones, zoneReport, tourOrder, billRows, ktvState, pointsOf, unreadCount, cleanDetail, zoneKey, ktvCustomers, buyerSuggestions, validateReceive, canSeeBuyer } from '../logic'
import { T } from '../i18n'
import { Pill, Empty, Modal, SubHead, Block, Tiles, PhotoInput, Thumb, Seg, Av, Icon, Nodes } from '../ui'
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
      <div className="tile mint"><span className="l">Ca của tôi hôm nay</span><span className="v" style={{ fontSize: 19 }}>{me.shift === 1 ? 'Ca sáng' : 'Ca chiều'}</span><span className="s">{D.SHIFTS[me.shift].label}</span></div>
      {me.role === 'ktv' && <div className="tile mint"><span className="l">Thứ tự tour</span><span className="v">#{pos + 1}</span><span className="s">trong {order.length} KTV · tự xoay khi nhận khách</span></div>}
      <div className="tile mint"><span className="l">Chấm công</span><span className="v" style={{ fontSize: 19 }}>{s.attendance[me.id]?.in != null ? D.hhmm(s.attendance[me.id].in!) : 'Chưa'}</span><span className="s">{s.attendance[me.id]?.in == null ? 'chưa quét QR' : s.attendance[me.id].in! > D.SHIFTS[me.shift].start ? `trễ ${s.attendance[me.id].in! - D.SHIFTS[me.shift].start} phút` : 'đúng giờ'}</span></div>
    </div>}
    <Block title="Lịch chia tour hôm nay" sub="Khách yêu cầu đích danh không làm mất lượt. Thứ tự do hệ thống xoay theo quy luật CEO cài đặt.">
      <div className="grid g2">{([1, 2] as const).map(sh => <div key={sh} className="card pad col"><div className="deep bar">{sh === 1 ? 'SÁNG 08:00–18:00' : 'CHIỀU 10:00–20:00'}</div>
        {s.rotation[sh].map(id => { const k = s.staff.find(x => x.id === id)!; const st = ktvState(s, id)
          return <div key={id} className="row small" style={{ background: id === me.id ? 'var(--mint)' : undefined, borderRadius: 10, padding: '4px 6px' }}><span className="num strong" style={{ width: 22 }}>{order.indexOf(id) + 1}</span><span style={{ flex: 1 }}>{k.name}{id === me.id && ' (tôi)'}</span><Pill tone={st.tone} dot>{st.label}</Pill></div> })}
        <div className="tiny muted">Lễ tân: {recs.filter(r => r.shift === sh).map(r => r.name).join(', ') || '—'}</div></div>)}</div>
    </Block>
    <Block color="deep" title="Bảng chia ca 4 tuần" sub="S = sáng · C = chiều · OFF = nghỉ đã duyệt · đổi ca đã duyệt tự đảo S↔C" right={<Seg value={String(week)} onChange={v => setWeek(+v)} items={[0, 1, 2, 3].map(w => ({ k: String(w), label: `Tuần ${w + 1}` }))} />}>
      <div className="tbl-wrap"><table className="roster"><thead><tr><th>Nhân viên</th>{Array.from({ length: 7 }, (_, i) => <th key={i}>{D.dayLabel(week * 7 + i)}</th>)}</tr></thead>
        <tbody>{people.map(p => <tr key={p.id} style={{ background: p.id === me.id ? 'var(--mint)' : undefined }}><td className="strong">{p.name}<span className="tiny muted"> · {p.role === 'ktv' ? 'KTV' : 'LT'}</span></td>
          {Array.from({ length: 7 }, (_, i) => { const off = week * 7 + i; const lv = s.leaves.find(l => (l.staffId === p.id || (l.kind === 'Đổi ca' && l.withId === p.id)) && l.status === 'Đã duyệt' && l.date === D.daysAhead(off)); const base = D.rosterCell(p, off); const c = !lv ? base : lv.kind === 'Nghỉ phép' ? 'OFF' : base === 'S' ? 'C' : base === 'C' ? 'S' : base; return <td key={i}><span className={`cell ${c}`}>{c}</span></td> })}</tr>)}</tbody></table></div>
    </Block>
    {ask && <LeaveModal kind="Đổi ca" onClose={() => setAsk(false)} />}
  </>
}

// ── 2. Nhiệm vụ dọn dẹp ──
// KTV: Mẹ → Con (1 Nhiệm vụ của tôi · 2 Báo cáo đã gửi · 3 Cần dọn lại) → Cháu → Chắt → Chít (m2).
type CView = { k: 'home' } | { k: 'mine' } | { k: 'zones' } | { k: 'sent' } | { k: 'redo' } | { k: 'redoDetail'; id: string } | { k: 'zone'; zone: number; tab: 'photo' | 'std'; from: 'home' | 'zones' | 'redo' }
const statTone = (st: D.CleanReport['status']) => (st === 'Đạt' ? 'green' : st === 'Chưa đạt' ? 'red' : 'yellow') as 'green' | 'red' | 'yellow'
/** Kết quả AI giả lập của một báo cáo — luôn kèm nhãn "Giả lập — Chưa nối AI thật" */
const AiLine = ({ r }: { r: D.CleanReport }) => r.ai ? <div className="small"><b>{r.ai.label}</b> · {r.ai.reason}<div className="tiny muted">{T.clean.aiSim}</div></div> : null
export function CleaningPage({ back }: P) {
  const { s, me, user, checkClean } = useStore()
  const [view, setView] = useState<CView>({ k: 'home' })
  const [detail, setDetail] = useState<'zones' | 'points' | 'pending' | 'redo' | null>(null)
  const [check, setCheck] = useState<D.CleanReport | null>(null)
  const [note, setNote] = useState('')
  const [justSent, setJustSent] = useState<number | null>(null)
  const mine = myZones(s, me.id)
  const boss = isBoss(user.role)
  const canCheck = boss || user.role === 'reception'
  const isKtv = user.role === 'ktv'
  const pending = s.cleanReports.filter(r => r.status === 'Chờ kiểm tra')
  const cd = cleanDetail(s, user.role, me.id)
  const openZone = (zone: number, from: 'home' | 'zones' | 'redo', tab: 'photo' | 'std' = 'photo') => { setJustSent(null); setView({ k: 'zone', zone, tab, from }) }
  const zoneRow = (z: D.Zone) => { const r = zoneReport(s, z.no); const own = s.zoneOwner[z.no] === me.id; const locked = z.after != null && s.now < z.after
    return <button key={z.no} className="item" onClick={() => (canCheck && r?.status === 'Chờ kiểm tra' ? setCheck(r) : openZone(z.no, 'home'))} style={{ background: own ? 'var(--mint)' : undefined }}>
      <span className="av" style={{ borderRadius: 10 }}>{z.no}</span>
      <div className="body"><div className="t">{z.name}{own && ' · của tôi'}</div><div className="d">{D.staffName(s.zoneOwner[z.no])}{z.after ? ` · sau ${D.hhmm(z.after)}` : ''}{r ? ` · ${T.clean.reportedAt} ${D.hhmm(r.at)}` : ''}{r?.note ? ` · ${r.note}` : ''}</div></div>
      {r ? <Pill tone={statTone(r.status)}>{r.status}{r.status === 'Đạt' ? ` +${r.points}` : ''}</Pill> : <Pill tone={locked ? 'grey' : 'brown'}>{locked ? 'Chưa đến giờ' : 'Chưa báo'}</Pill>}</button> }
  const cons = [{ k: 'mine', label: T.clean.con1 }, { k: 'sent', label: T.clean.con2 }, { k: 'redo', label: T.clean.con3 }] as const
  const conSeg = (on: 'mine' | 'sent' | 'redo') => <Seg value={on} onChange={k => setView({ k })} items={cons.map(c => ({ k: c.k, label: c.label }))} />

  if (isKtv && view.k !== 'home') {
    if (view.k === 'zone') return <><ZoneView zone={view.zone} tab={view.tab} setTab={tab => setView({ ...view, tab })} justSent={justSent === view.zone} onSent={() => setJustSent(view.zone)}
      back={() => setView(view.from === 'home' ? { k: 'home' } : view.from === 'zones' ? { k: 'zones' } : { k: 'redo' })} /></>
    if (view.k === 'redoDetail') {
      const r = s.cleanReports.find(x => x.id === view.id)
      return <RedoDetail r={r} back={() => setView({ k: 'redo' })} onRedo={() => r && openZone(r.zone, 'redo', 'std')} onSendNew={() => r && openZone(r.zone, 'redo', 'photo')} />
    }
    const title = view.k === 'mine' ? T.clean.con1 : view.k === 'zones' ? T.clean.grandZones : view.k === 'sent' ? T.clean.con2 : T.clean.grandRedo
    return <>
      <SubHead title={title} onBack={() => setView(view.k === 'zones' ? { k: 'mine' } : { k: 'home' })} />
      {conSeg(view.k === 'zones' ? 'mine' : view.k)}
      {view.k === 'mine' && <Nodes items={[{ t: T.clean.grandZones, d: T.clean.con1Desc, badge: cd.zones.length, onClick: () => setView({ k: 'zones' }) }]} />}
      {view.k === 'zones' && (mine.length ? <div className="card list">{mine.map(n => { const z = D.ZONES[n - 1], r = zoneReport(s, n)
        return <button key={n} className="item" style={{ background: 'var(--mint)' }} onClick={() => openZone(n, 'zones')}><span className="av" style={{ borderRadius: 10 }}>{n}</span>
          <div className="body"><div className="t">Khu {n} · {z.name}</div><div className="d">{r ? `${T.clean.reportedAt} ${D.hhmm(r.at)}` : T.clean.notReported}</div></div>
          {r ? <Pill tone={statTone(r.status)}>{r.status}</Pill> : <Pill tone="brown">{T.clean.notReported}</Pill>}</button> })}</div> : <Empty>{T.clean.emptyZones}</Empty>)}
      {view.k === 'sent' && (cd.mine.length ? <div className="card list">{cd.mine.map(r => <div key={r.id} className="item" data-testid="sent-row"><span className="av" style={{ borderRadius: 10 }}>{r.zone}</span>
        <div className="body"><div className="t">Khu {r.zone} · {D.ZONES[r.zone - 1].name}</div><div className="d">{T.clean.reportedAt} {D.hhmm(r.at)}{r.status === 'Đạt' ? ` · +${r.points} ${T.clean.pointsUnit}` : ''}</div><AiLine r={r} /></div>
        <Pill tone={statTone(r.status)}>{r.status}</Pill></div>)}</div> : <Empty>{T.clean.emptySent}</Empty>)}
      {view.k === 'redo' && (cd.redo.length ? <div className="card list">{cd.redo.map(r => <div key={r.id} className="item" data-testid="redo-row"><span className="av" style={{ borderRadius: 10 }}>{r.zone}</span>
        <div className="body"><div className="t">Khu {r.zone} · {D.ZONES[r.zone - 1].name}</div><div className="d">{T.clean.reportedAt} {D.hhmm(r.at)}</div>{r.ai ? <AiLine r={r} /> : r.note && <div className="small">{T.clean.reason}: {r.note}</div>}</div>
        <button className="btn sm pri" onClick={() => setView({ k: 'redoDetail', id: r.id })}>{T.clean.greatErr}</button></div>)}</div> : <Empty>{T.clean.emptyRedo}</Empty>)}
    </>
  }
  if (!isKtv && view.k === 'zone') return <ZoneView zone={view.zone} tab={view.tab} setTab={tab => setView({ ...view, tab })} justSent={justSent === view.zone} onSent={() => setJustSent(view.zone)} back={() => setView({ k: 'home' })} />
  return <>
    <SubHead title="Nhiệm vụ dọn dẹp" sub={mine.length ? <>Khu vực của bạn là <b>số {mine.join(', ')}</b> — bấm vào khu để xem tiêu chuẩn, tải ảnh và gửi kiểm tra.</> : 'Bảng tổng quan dọn dẹp KTV – lễ tân'} onBack={back} />
    <Tiles items={[...(boss ? [] : [{ v: cd.zones.length, l: T.clean.myZones, s: cd.zones.length ? `${T.clean.zoneNo} ${cd.zones.join(', ')}` : undefined, color: 'deep' as const, onClick: () => setDetail('zones') }, { v: cd.points, l: T.clean.todayPoints, color: 'deep' as const, onClick: () => setDetail('points') }]), { v: cd.pending.length, l: T.clean.pending, color: 'deep' as const, onClick: () => setDetail('pending') }, { v: cd.redo.length, l: T.clean.redo, color: 'deep' as const, onClick: () => setDetail('redo') }]} />
    {isKtv && <Nodes items={[{ t: T.clean.con1, d: T.clean.con1Desc, onClick: () => setView({ k: 'mine' }) }, { t: T.clean.con2, d: T.clean.con2Desc, onClick: () => setView({ k: 'sent' }) }, { t: T.clean.con3, d: T.clean.con3Desc, onClick: () => setView({ k: 'redo' }) }]} />}
    {canCheck && pending.length > 0 && <Block title="Chờ kiểm tra ảnh" sub="Xem ảnh → Đạt (+điểm) hoặc Chưa đạt (ghi lý do để làm lại)">
      <div className="card list">{pending.map(r => <div key={r.id} className="item"><Thumb src={r.photo} /><div className="body"><div className="t">Khu {r.zone} · {D.ZONES[r.zone - 1].name}</div><div className="d">{D.staffName(r.staffId)} · {D.hhmm(r.at)}</div><AiLine r={r} /></div>
        <button className="btn sm pri" onClick={() => checkClean(r.id, true, '')}>{T.clean.pass}</button><button className="btn sm" onClick={() => setCheck(r)}>Kiểm tra</button></div>)}</div></Block>}
    <Block color="mint" title={T.clean.morning}><div className="card list">{D.ZONES.filter(z => z.shift === 1).map(zoneRow)}</div></Block>
    <Block color="mint" title={T.clean.afternoon} sub="Giặt khăn 4 lần: chỉ báo cáo được sau mốc giờ"><div className="card list">{D.ZONES.filter(z => z.shift === 2).map(zoneRow)}</div></Block>
    {detail && <CleanDetailModal kind={detail} onClose={() => setDetail(null)} onOpenZone={n => { setDetail(null); openZone(n, 'home') }} />}
    {check && <Modal title={`Kiểm tra khu ${check.zone} · ${D.staffName(check.staffId)}`} onClose={() => setCheck(null)} footer={<><button className="btn danger" disabled={!note.trim()} onClick={() => { checkClean(check.id, false, note.trim()); setCheck(null); setNote('') }}>Chưa đạt</button><button className="btn pri" onClick={() => { checkClean(check.id, true, note.trim()); setCheck(null); setNote('') }}>Đạt · +{D.ZONE_POINTS} điểm</button></>}>
      <div className="row"><Thumb src={check.photo} /><span className="small">{check.photo.startsWith('blob:') ? 'Ảnh vừa tải lên' : `Ảnh: ${check.photo}`} · {D.hhmm(check.at)}</span></div>
      <AiLine r={check} />
      {D.ZONES[check.zone - 1].std.map((x, i) => <div key={i} className="small">{check.checks[i] ? '✓' : '✗'} {x}</div>)}
      <label className="f">Nhận xét (bắt buộc khi chưa đạt)<input id="cl-note" className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder="VD: tủ khăn nóng chưa đủ khăn" /></label>
    </Modal>}
  </>
}
/** Con 3 → Chắt "Lỗi và yêu cầu sửa" → Chít: Xem lỗi / Dọn lại / Gửi ảnh mới */
function RedoDetail({ r, back, onRedo, onSendNew }: { r?: D.CleanReport; back: () => void; onRedo: () => void; onSendNew: () => void }) {
  const [showErr, setShowErr] = useState(false)
  if (!r) return <><SubHead title={T.clean.greatErr} onBack={back} /><Empty>{T.clean.emptyRedo}</Empty></>
  const z = D.ZONES[r.zone - 1]
  return <>
    <SubHead title={T.clean.greatErr} sub={`Khu ${r.zone} · ${z.name}`} onBack={back} />
    <div className="card pad col">
      <div className="err small">{T.clean.reason}: {r.note || r.ai?.reason || '—'}</div>
      <AiLine r={r} />
      {showErr && <div className="col" style={{ gap: 2 }}><span className="eyebrow">{T.clean.unticked}</span>{z.std.map((x, i) => (r.checks[i] ? null : <div key={i} className="small">✗ {x}</div>))}</div>}
      <div className="row"><button className="btn" onClick={() => setShowErr(v => !v)}>{T.clean.viewErr}</button><button className="btn" onClick={onRedo}>{T.clean.redoIt}</button><button className="btn pri" onClick={onSendNew}>{T.clean.sendNew}</button></div>
    </div>
  </>
}
/** Modal xem tiêu chuẩn mẫu của một khu (tệp tài liệu thật chưa nối) */
function StdModal({ zone, onClose }: { zone: number; onClose: () => void }) {
  const z = D.ZONES[zone - 1]
  return <Modal title={`${T.clean.stdTitle} — khu ${zone}: ${z.name}`} onClose={onClose}>
    <div className="col" style={{ gap: 6 }}>{z.std.map((x, i) => <div key={i} className="small">• {x}</div>)}</div>
    <div className="note">{T.clean.stdFile}</div>
  </Modal>
}
/** Chi tiết 4 ô số của trang Dọn dẹp: số trên ô = số dòng trong Modal */
function CleanDetailModal({ kind, onClose, onOpenZone }: { kind: 'zones' | 'points' | 'pending' | 'redo'; onClose: () => void; onOpenZone: (n: number) => void }) {
  const { s, me, user } = useStore()
  const [std, setStd] = useState<number | null>(null)
  const d = cleanDetail(s, user.role, me.id)
  const title = { zones: T.clean.myZones, points: T.clean.todayPoints, pending: T.clean.pending, redo: T.clean.redo }[kind]
  const stat = (r: D.CleanReport) => `${r.status}${r.status === 'Đạt' ? ` +${r.points}` : ''}`
  const rep = (r: D.CleanReport, extra?: string) => <div key={r.id} className="detail-row" data-testid="detail-row"><span className="av" style={{ borderRadius: 10 }}>{r.zone}</span>
    <div className="body"><div className="t">Khu {r.zone} · {D.ZONES[r.zone - 1].name}</div><div className="d">{D.staffName(r.staffId)} · {T.clean.reportedAt} {D.hhmm(r.at)}{extra}</div></div><Pill tone={r.status === 'Đạt' ? 'green' : r.status === 'Chưa đạt' ? 'red' : 'yellow'}>{stat(r)}</Pill></div>
  return <><Modal title={title} onClose={onClose}>
    {kind === 'zones' && (d.zones.length ? d.zones.map(n => { const z = D.ZONES[n - 1], r = zoneReport(s, n)
      return <div key={n} className="detail-row" data-testid="detail-row"><span className="av" style={{ borderRadius: 10 }}>{n}</span>
        <div className="body"><div className="t">{z.name}</div><div className="d">{r ? `${r.status} · ${T.clean.reportedAt} ${D.hhmm(r.at)}` : T.clean.notReported}</div></div>
        <button className="btn sm" onClick={() => setStd(n)}>{T.clean.stdButton}</button><button className="btn sm pri" onClick={() => onOpenZone(n)}>{T.clean.openZone}</button></div> }) : <Empty>{T.clean.emptyZones}</Empty>)}
    {kind === 'points' && (d.mine.length ? <>{d.mine.map(r => rep(r, ` · ${r.points ?? 0} ${T.clean.pointsUnit}`))}<div className="small strong">{T.clean.total}: {d.points}</div></> : <Empty>{T.clean.emptyPoints}</Empty>)}
    {kind === 'pending' && (d.pending.length ? d.pending.map(r => rep(r)) : <Empty>{T.clean.emptyPending}</Empty>)}
    {kind === 'redo' && (d.redo.length ? d.redo.map(r => rep(r, r.note ? ` · ${T.clean.reason}: ${r.note}` : '')) : <Empty>{T.clean.emptyRedo}</Empty>)}
  </Modal>{std != null && <StdModal zone={std} onClose={() => setStd(null)} />}</>
}
/** Chắt của một khu: "Ảnh minh chứng" (Chụp ảnh · Tải ảnh · Gửi báo cáo) và "Tiêu chuẩn và checklist" (Xem ảnh Home · Tích checklist) */
function ZoneView({ zone, tab, setTab, justSent, onSent, back }: { zone: number; tab: 'photo' | 'std'; setTab: (t: 'photo' | 'std') => void; justSent: boolean; onSent: () => void; back: () => void }) {
  const { s, me, submitClean, say, toggleZoneCheck } = useStore()
  const z = D.ZONES[zone - 1]
  const [photo, setPhoto] = useState('')
  const [err, setErr] = useState('')
  const [showStd, setShowStd] = useState(false)
  const snap = useRef<HTMLInputElement>(null), pick = useRef<HTMLInputElement>(null)
  const key = zoneKey(zone, me.id)
  const checks = s.zoneChecks[key] ?? z.std.map(() => false)
  const r = zoneReport(s, zone)
  const own = s.zoneOwner[zone] === me.id
  const canSend = own && r?.status !== 'Đạt'
  const onFile = (e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { setPhoto(URL.createObjectURL(f)); setErr('') } }
  const send = () => { const e = submitClean(zone, photo, checks); if (e) { setErr(e); say('⚠ ' + e) } else { setErr(''); setPhoto(''); onSent() } }
  return <>
    <SubHead title={`Khu vực số ${zone} — ${z.name}`} sub={<>Phụ trách hôm nay: <b>{D.staffName(s.zoneOwner[zone])}</b>{z.after ? ` · báo cáo sau ${D.hhmm(z.after)}` : ''}</>} onBack={back} />
    {r && <div className={r.status === 'Đạt' ? 'ok small' : r.status === 'Chưa đạt' ? 'err small' : 'warn small'}>Lần báo gần nhất {D.hhmm(r.at)} · {r.status}{r.points ? ` · +${r.points} điểm` : ''}{r.note ? ` · ${r.note}` : ''}</div>}
    {justSent && r && <div className="card pad col" data-testid="ai-result"><span className="eyebrow">{T.clean.aiResult}</span><Pill tone={statTone(r.status)}>{r.status}</Pill><AiLine r={r} /></div>}
    {!own ? <div className="small muted">{T.clean.notYours}.</div> : <>
      <Seg value={tab} onChange={setTab} items={[{ k: 'photo', label: T.clean.great1 }, { k: 'std', label: T.clean.great2 }]} />
      {tab === 'photo' && <div className="card pad col">
        <div className="note">{T.clean.photoNote}</div>
        <div className="row">{photo ? <Thumb src={photo} /> : null}<span className="small">{photo ? T.clean.hasPhoto : T.clean.noPhoto}</span></div>
        <input ref={snap} type="file" accept="image/*" capture="environment" hidden onChange={onFile} /><input ref={pick} type="file" accept="image/*" hidden onChange={onFile} />
        {err && <div className="err small" role="alert">{err}</div>}
        {canSend ? <div className="row"><button className="btn" onClick={() => snap.current?.click()}>{T.clean.snap}</button><button className="btn" onClick={() => pick.current?.click()}>{T.clean.upload}</button><button className="btn pri" onClick={send}>{T.clean.send}</button></div> : <div className="small muted">{T.clean.waitingResult}</div>}
      </div>}
      {tab === 'std' && <div className="card pad col" style={{ gap: 2 }}>
        <div className="row"><span className="eyebrow" style={{ marginRight: 'auto' }}>{T.clean.tick}</span><button className="btn sm" onClick={() => setShowStd(true)}>{T.clean.viewHome}</button></div>
        {z.std.map((x, i) => <label key={i} className="check"><input type="checkbox" disabled={!canSend} checked={checks[i]} onChange={() => toggleZoneCheck(zone, i, z.std.length)} />{x}</label>)}
      </div>}
    </>}
    {showStd && <StdModal zone={zone} onClose={() => setShowStd(false)} />}
  </>
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
  const kc = ktvCustomers(s, me)
  const caredIds = kc.cared, reqIds = kc.requested, closed = kc.closed
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
  const { s, me, user, markRead, markUnread, markAllRead, go } = useStore()
  const list = s.notifs.filter(n => canSee(n, user.role, me.id))
  return <>
    <SubHead title="Thông báo quan trọng" sub="Cập nhật mới · đào tạo · lịch yêu cầu khách · điểm số chung" onBack={back} right={<button className="btn deep" onClick={markAllRead}>Đã đọc hết</button>} />
    <Block color="deep" title="Ghim từ Home"><div className="card list">{D.ANNOUNCEMENTS.map(a => <div key={a.id} className="item"><Pill tone="green">{a.tag}</Pill><div className="body"><div className="t">{a.title}</div><div className="d">{a.by}</div></div></div>)}</div></Block>
    <Block color="deep" title="Vừa xảy ra"><div className="card list">{list.map(n => { const read = n.readBy.includes(me.id); return <div key={n.id} className="item" style={{ cursor: 'pointer' }} onClick={() => { markRead(n.id); if (n.nav) go(n.nav) }}>{!read && <span className="sev cao" />}
      <div className="body"><div className="t" style={{ fontWeight: read ? 500 : 700 }}>{n.text}</div><div className="d">{n.cat} · {D.hhmm(n.min)} · {n.detail}</div></div>
      <button className="btn sm" onClick={e => { e.stopPropagation(); (read ? markUnread(n.id) : markRead(n.id)) }}>{read ? T.notice.markUnread : T.notice.markRead}</button><Icon n="arrow" /></div> })}{!list.length && <Empty>Chưa có thông báo</Empty>}</div></Block>
  </>
}

// ── 6. Bill Money ──
export function BillsPage({ back }: P) {
  const { s, me, user, uploadBill, confirmBills } = useStore()
  const [shift, setShift] = useState<'1' | '2'>(String(me.shift ?? 1) as '1' | '2')
  const [photo, setPhoto] = useState('')
  const [note, setNote] = useState('')
  const all = billRows(s)
  // KTV chỉ xem tour của chính mình; lễ tân/Leader/CEO xem cả nhóm
  const rows = user.role === 'ktv' ? all.filter(r => r.a.ktvId === me.id) : all
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
      <div className="card list">{rows.map(({ a, inv, photo: ph, issue }) => <div key={a.id} className="item"><span className="num strong" style={{ width: 46 }}>{D.hhmm(a.start)}</span><div className="body"><div className="t">{cust(s, a.customerId).name} · KTV {D.staffName(a.ktvId)}</div><div className="d">{D.svc(a.serviceId).name}{inv ? (user.role === 'ktv' ? ' · đã thu' : ` · ${inv.code} · đã thu ${D.vnd(inv.paid)}`) : ''}{ph ? ' · có ảnh bill' : ''}</div>{issue && <div className="tiny" style={{ color: 'var(--r-fg)' }}>{issue}</div>}</div>
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
  const [purpose, setPurpose] = useState<D.ProductLog['purpose']>()
  const [buyer, setBuyer] = useState('')
  const [invoice, setInvoice] = useState('')
  const [err, setErr] = useState('')
  const [detail, setDetail] = useState<'all' | 'open' | null>(null)
  const isRec = user.role === 'reception', isKtv = user.role === 'ktv'
  const list = isKtv ? s.productLogs.filter(p => p.ktvId === me.id) : s.productLogs
  const openList = list.filter(p => !(p.ktvOk && p.recOk))
  const sugg = isKtv && purpose === 'ban_khach' ? buyerSuggestions(s, me, buyer) : []
  const save = () => {
    if (!isKtv) { addProduct(f.product, f.qty, f.ktvId, photo); setPhoto(''); return }
    const e = validateReceive({ purpose, buyer, invoice, photo })
    if (e) { setErr(e); return }
    addProduct(f.product, f.qty, f.ktvId, photo, purpose === 'ban_khach' ? { purpose, buyerNote: buyer.trim(), invoicePhoto: invoice } : { purpose })
    setPhoto(''); setPurpose(undefined); setBuyer(''); setInvoice(''); setErr('')
  }
  const who = (p: D.ProductLog) => `${T.product.confirmedBy}: ${p.ktvOk ? `${T.product.byKtv} ${D.staffName(p.ktvId)}` : `${T.product.byKtv} ${T.product.nobody}`} · ${p.recOk ? `${T.product.byRec} ${D.staffName(p.recId)}` : `${T.product.byRec} ${T.product.nobody}`}`
  return <>
    <SubHead title={isRec ? 'Đối chiếu sản phẩm, kiểm kho' : 'Đối chiếu sản phẩm'} sub="Dầu, cao hổ, sữa chua… Bấm xác nhận 2 bên (KTV & lễ tân). Chưa đủ 2 bên → bộ ảnh là điểm chốt để truy cứu." onBack={back} />
    <Tiles items={[{ v: list.length, l: T.product.total, color: 'deep', onClick: () => setDetail('all') }, { v: openList.length, l: T.product.open, color: 'deep', onClick: () => setDetail('open') }]} />
    {(isKtv || isRec) && <Block title={isRec ? 'Xuất sản phẩm cho KTV' : 'Ghi nhận sản phẩm tôi nhận'}>
      <div className="grid g3"><label className="f">Sản phẩm<select id="pr-p" className="inp" value={f.product} onChange={e => setF({ ...f, product: e.target.value })}>{D.PRODUCTS.map(p => <option key={p}>{p}</option>)}</select></label>
        <label className="f">Số lượng<input id="pr-q" className="inp num" type="number" min={1} value={f.qty} onChange={e => setF({ ...f, qty: Math.max(1, +e.target.value || 1) })} /></label>
        {isRec && <label className="f">KTV nhận<select id="pr-k" className="inp" value={f.ktvId} onChange={e => setF({ ...f, ktvId: e.target.value })}>{D.ktvs().map(k => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label>}</div>
      <PhotoInput value={photo} onChange={v => { setPhoto(v); setErr('') }} label="Ảnh xác minh sản phẩm" />
      {isKtv && <div className="col" style={{ gap: 8 }}>
        <span className="eyebrow">{T.product.purposeTitle}</span>
        <label className="radio"><input type="radio" name="pr-purpose" checked={purpose === 'ban_khach'} onChange={() => { setPurpose('ban_khach'); setErr('') }} />{T.product.sell}</label>
        <label className="radio"><input type="radio" name="pr-purpose" checked={purpose === 'dung_co_so'} onChange={() => { setPurpose('dung_co_so'); setErr('') }} />{T.product.facility}</label>
        {purpose === 'ban_khach' && <>
          <label className="f">{T.product.buyerLabel}<input id="pr-buyer" className="inp" autoComplete="off" value={buyer} placeholder={T.product.buyerPlaceholder} onChange={e => { setBuyer(e.target.value); setErr('') }} /></label>
          {sugg.length > 0 && <ul className="suggest">{sugg.map(c => <li key={c.id} role="option" aria-selected={false} onClick={() => setBuyer(`${c.name} (${c.code})`)}>{c.name} <span className="tiny muted">· mã {c.code}</span></li>)}</ul>}
          <PhotoInput value={invoice} onChange={v => { setInvoice(v); setErr('') }} label={T.product.invoiceButton} />
        </>}
      </div>}
      {err && <div className="err small" role="alert">{err}</div>}
      <button className="btn pri" disabled={!photo} onClick={save}>{isRec ? 'Ghi nhận & xác nhận phía lễ tân' : 'Ghi nhận & xác nhận phía KTV'}</button>
    </Block>}
    <Block title="Sổ đối chiếu"><div className="card list">{list.map(p => <div key={p.id} className="item"><Thumb src={p.photo} /><div className="body"><div className="t">{p.product} × {p.qty} · KTV {D.staffName(p.ktvId)}</div><div className="d">Lễ tân {p.recId ? D.staffName(p.recId) : 'chưa nhận'} · {D.hhmm(p.at)}</div>
      {p.purpose && <div className="d">{p.purpose === 'ban_khach' ? (canSeeBuyer(user.role, me.id, p) && p.buyerNote ? `${T.product.sellShort} · ${T.product.buyer}: ${p.buyerNote}` : T.product.sellShort) : T.product.facilityShort}</div>}</div>
      {p.purpose === 'ban_khach' && p.invoicePhoto && canSeeBuyer(user.role, me.id, p) && <Thumb src={p.invoicePhoto} />}
      <Pill tone={p.ktvOk ? 'green' : 'yellow'}>KTV {p.ktvOk ? '✓' : 'chờ'}</Pill><Pill tone={p.recOk ? 'green' : 'yellow'}>LT {p.recOk ? '✓' : 'chờ'}</Pill>
      {((isRec && !p.recOk) || (isKtv && p.ktvId === me.id && !p.ktvOk)) && <button className="btn sm pri" onClick={() => confirmProduct(p.id)}>Xác nhận</button>}</div>)}{!list.length && <Empty>Chưa có lượt nào</Empty>}</div>
      <div className="tiny muted">Ảnh sản phẩm giữ 6 tháng – 1 năm rồi reset, báo cáo tổng giữ lại 1 lần.</div></Block>
    {detail && <Modal title={detail === 'all' ? T.product.total : T.product.open} onClose={() => setDetail(null)}>
      {(detail === 'all' ? list : openList).map(p => <div key={p.id} className="detail-row" data-testid="detail-row"><div className="body"><div className="t">{p.product} × {p.qty}</div><div className="d">KTV {D.staffName(p.ktvId)} · {D.hhmm(p.at)}</div><div className="d">{who(p)}</div></div></div>)}
      {!(detail === 'all' ? list : openList).length && <Empty>{detail === 'all' ? T.product.emptyTotal : T.product.emptyOpen}</Empty>}
    </Modal>}
  </>
}

// ── 11. Sáng kiến phát triển Home Spa (trang khung; m3 hoàn thiện luồng góp ý) ──
export function IdeaPage({ back }: P) {
  return <>
    <SubHead title={T.menu.idea} sub={T.menu.ideaDesc} onBack={back} />
    <div className="card pad col"><div><Pill>{T.idea.unwired}</Pill></div><div className="note">{T.idea.note}</div></div>
  </>
}

// ── 9. Xin nghỉ phép ──
export function LeaveModal({ kind: k0, onClose }: { kind?: D.Leave['kind']; onClose: () => void }) {
  const { s, me, requestLeave } = useStore()
  const [kind, setKind] = useState<D.Leave['kind']>(k0 ?? 'Nghỉ phép')
  const [date, setDate] = useState(D.daysAhead(1))
  const [detail, setDetail] = useState('')
  const [withId, setWithId] = useState('')
  // Đổi ca: chỉ đổi với người cùng bộ phận đang làm ca ngược lại ngày đó (để bảng chia ca đảo đúng cả 2 người)
  const off = Array.from({ length: 28 }, (_, i) => D.daysAhead(i + 1)).indexOf(date) + 1
  const mine = D.rosterCell(me, off)
  const partners = s.staff.filter(x => x.id !== me.id && x.role === me.role && ['S', 'C'].includes(D.rosterCell(x, off)) && D.rosterCell(x, off) !== mine && ['S', 'C'].includes(mine))
  const needPartner = kind === 'Đổi ca'
  return <Modal title="Gửi đơn — CEO duyệt" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn pri" disabled={!detail.trim() || (needPartner && !partners.some(x => x.id === withId))} onClick={() => { requestLeave(kind, date, detail.trim(), needPartner ? withId : undefined); onClose() }}>Gửi đơn</button></>}>
    <Seg value={kind} onChange={setKind} items={[{ k: 'Nghỉ phép', label: 'Nghỉ phép' }, { k: 'Đổi ca', label: 'Đổi ca' }]} />
    <label className="f">Ngày<select id="lv-date" className="inp" value={date} onChange={e => setDate(e.target.value)}>{Array.from({ length: 28 }, (_, i) => D.daysAhead(i + 1)).map(d => <option key={d}>{d}</option>)}</select></label>
    {needPartner && <label className="f">Đổi với<select id="lv-with" className="inp" value={withId} onChange={e => setWithId(e.target.value)}><option value="">{partners.length ? '— Chọn người làm ca ngược lại —' : 'Không có ai làm ca ngược lại ngày này'}</option>{partners.map(x => <option key={x.id} value={x.id}>{x.name} · {D.rosterCell(x, off) === 'S' ? 'ca sáng' : 'ca chiều'}</option>)}</select></label>}
    <label className="f">{kind === 'Đổi ca' ? 'Lý do đổi ca' : 'Lý do'}<textarea id="lv-detail" className="inp" value={detail} onChange={e => setDetail(e.target.value)} placeholder={kind === 'Đổi ca' ? 'VD: bận việc buổi sáng' : 'VD: việc gia đình'} /></label>
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
  const mine = s.tasks.filter(t => t.earlyReport && t.createdBy === me.id && t.status !== 'transferred')
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
