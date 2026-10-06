// Màn vận hành: Tổng quan, Lịch điều phối, Hàng chờ chia tour, Sơ đồ giường, Thông báo
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { overview, alerts, ktvState, bedState, cust, suggestKtv, earliestFor, freeBedFor, ktvConflict, bedConflict, custConflict, inShift, Alert, CLEAN_MIN } from '../logic'
import { Icon, Pill, Stat, PageHeader, Seg, Modal, Empty, Sec, Av } from '../ui'

const STATUS_LABEL: Record<D.ApptStatus, [string, any]> = {
  booked: ['Đã đặt', 'purple'], checked_in: ['Khách đã đến', 'purple'], in_service: ['Đang làm', 'green'],
  done: ['Chờ thanh toán', 'yellow'], paid: ['Đã thanh toán', 'brown'], cancelled: ['Đã hủy', 'grey'], no_show: ['Không đến', 'red'],
}
export const ApptPill = ({ a, now }: { a: D.Appt; now: number }) => {
  if (a.status === 'in_service' && now >= a.end - 15) return <Pill tone="yellow" dot>Sắp xong</Pill>
  if (a.status === 'booked' && now - a.start > 10) return <Pill tone="red" dot>Trễ {now - a.start}p</Pill>
  const [l, t] = STATUS_LABEL[a.status]; return <Pill tone={t} dot>{l}</Pill>
}

// ─────────────────────────── TỔNG QUAN ───────────────────────────
export function OverviewScreen({ readonly }: { readonly?: boolean }) {
  const { s, go, me, user } = useStore()
  const o = overview(s)
  const al = alerts(s).filter(a => a.who === 'reception')
  const myTasks = s.tasks.filter(t => t.ownerId === me.id && (t.status === 'open' || t.status === 'doing'))
  const [modal, setModal] = useState<null | 'ktv' | 'finishing' | 'done'>(null)
  const hello = s.now < 11 * 60 ? 'Chào buổi sáng' : s.now < 14 * 60 ? 'Chào buổi trưa' : 'Chào buổi chiều'
  return <>
    <PageHeader eyebrow={readonly ? 'Vận hành · chỉ xem' : 'Điều phối hôm nay'} title={`${hello}, ${me.name}`} sub={`${D.dateLabel()} · Home Spa Đà Nẵng`}
      right={!readonly && user.role === 'reception' && <><button className="btn" onClick={() => go('queue')}><Icon n="queue" />Thêm khách chờ</button><button className="btn pri" onClick={() => go('schedule:new')}><Icon n="plus" />Tạo lịch nhanh</button></>} />
    <Sec eyebrow="Vận hành hôm nay">
      <div className="grid g3">
        <Stat label="KTV trong ca" value={o.ktvIn} tone="g-fg" sub={`${D.ktvs().filter(k => k.shift === 1).length} Ca 1 · ${D.ktvs().filter(k => k.shift === 2).length} Ca 2`} onClick={() => setModal('ktv')} extra={<><Pill tone="green">{o.ktvBusy} đang làm</Pill><Pill>{o.ktvFree} rảnh</Pill></>} />
        <Stat label="Sắp hoàn thành" value={o.finishing.length} tone="y-fg" sub="Trong 30 phút tới" onClick={() => setModal('finishing')} extra={o.finishing[0] && <Pill tone="yellow">Sớm nhất {D.hhmm(o.finishing.sort((a, b) => a.end - b.end)[0].end)}</Pill>} />
        <Stat label="Giường sử dụng" value={<>{o.bedsUsed}<small>/{o.bedsTotal}</small></>} tone="g-fg" sub={`${o.bedsFree} trống · ${o.bedsCleaning} đang dọn`} onClick={() => go('beds')} extra={<span className="link small">Xem sơ đồ →</span>} />
        <Stat label="Khách đang chờ" value={o.waiting} tone="p-fg" sub="Chờ chia tour" onClick={() => go('queue')} extra={o.waitingLong > 0 && <Pill tone="red">{o.waitingLong} chờ quá 10 phút</Pill>} />
        <Stat label="Lịch hẹn hôm nay" value={o.apptTotal} tone="p-fg" sub={`${o.apptDone} xong · ${o.inService} đang làm · ${o.apptLeft} còn lại`} onClick={() => go('schedule')} extra={o.late.length > 0 && <Pill tone="red">{o.late.length} trễ hẹn</Pill>} />
        <Stat label="Thu ngân" value={o.bills.length} tone="b-fg" sub={`chờ thanh toán · đã thu ${D.vnd(o.revenue)}`} onClick={() => go('cashier')} />
      </div>
    </Sec>
    <div className="split">
      <Sec eyebrow="Việc cần xử lý ngay" right={<span className="badge">{al.length + myTasks.length}</span>}>
        <div className="card list">
          {al.map(a => <AlertRow key={a.key} a={a} />)}
          {myTasks.map(t => <button key={t.id} className="item" onClick={() => go('mytasks')}><span className={`sev ${t.priority}`} /><div className="body"><div className="t">{t.title}</div><div className="d">Việc được giao · {t.detail}</div></div><span className="link small">Mở →</span></button>)}
          {!al.length && !myTasks.length && <Empty>Không có việc tồn đọng 🎉</Empty>}
        </div>
      </Sec>
      <Sec eyebrow="KTV đang làm gì">
        <div className="card list">{D.ktvs().map(k => { const st = ktvState(s, k.id); return <div key={k.id} className="item"><Av name={k.name} /><div className="body"><div className="t">{k.name} <span className="muted tiny">Ca {k.shift}</span></div><div className="d">{st.current ? `${cust(s, st.current.customerId).name} · ${st.current.bedId} · đến ${D.hhmm(st.current.end)}` : st.next ? `Kế tiếp ${D.hhmm(st.next.start)} · ${cust(s, st.next.customerId).name}` : 'Chưa có lịch tiếp theo'}</div></div><Pill tone={st.tone} dot>{st.label}</Pill></div> })}</div>
      </Sec>
    </div>
    {modal === 'ktv' && <Modal title="KTV trong ca hôm nay" onClose={() => setModal(null)}>{D.ktvs().map(k => { const st = ktvState(s, k.id); return <div key={k.id} className="row"><Av name={k.name} /><b>{k.name}</b><span className="muted small">{D.SHIFTS[k.shift!].label}</span><span className="right-al"><Pill tone={st.tone} dot>{st.label}{st.until ? ` · ${D.hhmm(st.until)}` : ''}</Pill></span></div> })}</Modal>}
    {modal === 'finishing' && <Modal title="Sắp hoàn thành (30 phút tới)" onClose={() => setModal(null)}>{o.finishing.length ? o.finishing.map(a => <div key={a.id} className="row"><b>{cust(s, a.customerId).name}</b><span className="muted small">KTV {D.staffName(a.ktvId)} · {a.bedId} · {D.svc(a.serviceId).name}</span><span className="right-al"><Pill tone="yellow">{D.hhmm(a.end)}</Pill></span></div>) : <Empty>Không có ca sắp xong</Empty>}</Modal>}
  </>
}
function AlertRow({ a }: { a: Alert }) {
  const { go } = useStore()
  return <button className="item" onClick={() => go(a.nav)}><span className={`sev ${a.level}`} /><div className="body"><div className="t">{a.title}</div><div className="d">{a.detail}</div></div><span className="link small">Xử lý →</span></button>
}

// ─────────────────────────── LỊCH ĐIỀU PHỐI ───────────────────────────
// Ô lịch: rộng đúng bằng thời lượng; kéo ngang để đổi giờ (bước 15 phút), thả ra mới lưu,
// hệ thống kiểm tra trùng KTV / giường / khách / giờ ca trước khi ghi.
const H0 = 8, H1 = 20, HW = 92, SNAP = 15
const x = (m: number) => ((m - H0 * 60) / 60) * HW
const w = (a: number, b: number) => x(b) - x(a)
type NewDraft = { ktvId?: string; start?: number; bedId?: string }
type Drag = { kind: 'appt' | 'pot'; id: string; ktvId: string; bedId?: string; serviceId?: string; customerId?: string; orig: number; dur: number; min: number; max: number; x0: number; cur: number; moved: boolean }
type Pot = { key: string; ktvId: string; winStart: number; winEnd: number; maxStart: number }

export function ScheduleScreen({ openNew }: { openNew?: boolean }) {
  const { s, go, user, moveAppt, say } = useStore()
  const [view, setView] = useState<'ktv' | 'bed' | 'list'>(() => (window.innerWidth < 860 ? 'list' : 'ktv'))
  const [sel, setSel] = useState<string | null>(null)
  const [draft, setDraft] = useState<NewDraft | null>(openNew ? {} : null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [potPos, setPotPos] = useState<Record<string, number>>({})
  const canEdit = user.role === 'reception'
  const appts = s.appts.filter(a => a.status !== 'cancelled')
  const ganttRef = useRef<HTMLDivElement>(null)
  // mở lịch là cuộn tới giờ hiện tại
  useEffect(() => { if (ganttRef.current) ganttRef.current.scrollLeft = Math.max(0, x(s.now) - 60) }, [view])
  const nowSnap = Math.ceil(s.now / SNAP) * SNAP

  // Khoảng trống thật của từng KTV (đã trừ 10' dọn giường trước & sau), chỉ hiện khoảng ≥ 60 phút
  const pots = useMemo(() => D.ktvs().flatMap(k => {
    const out: Pot[] = []; const sh = D.SHIFTS[k.shift!]; let t = nowSnap
    for (let i = 0; i < 8; i++) {
      const e = earliestFor(s, k.id, 60, t); if (e == null) break
      const next = s.appts.filter(a => a.ktvId === k.id && ['booked', 'checked_in', 'in_service'].includes(a.status) && a.start >= e).sort((p, q) => p.start - q.start)[0]
      const winEnd = next ? next.start : sh.end
      const maxStart = (next ? next.start - CLEAN_MIN : sh.end) - 60
      if (maxStart >= e) out.push({ key: `${k.id}-${e}`, ktvId: k.id, winStart: e, winEnd, maxStart })
      if (!next) break
      t = next.end
    }
    return out
  }), [s, nowSnap])

  // kiểm tra vị trí đang kéo — trả lỗi để tô đỏ & không cho thả
  const dragCheck = (d: Drag): { err: string | null; bed?: string } => {
    if (d.kind === 'pot') return { err: null }
    const end = d.cur + d.dur
    const e = ktvConflict(s, d.ktvId, d.cur, end, d.id) || custConflict(s, d.customerId!, d.cur, end, d.id)
    if (e) return { err: e }
    if (!bedConflict(s, d.bedId!, d.cur, end, d.id)) return { err: null, bed: d.bedId }
    if (view === 'bed') return { err: bedConflict(s, d.bedId!, d.cur, end, d.id) }
    const alt = D.BEDS.find(b => b.zone === D.bedZoneFor(d.serviceId!) && !bedConflict(s, b.id, d.cur, end, d.id))
    return alt ? { err: null, bed: alt.id } : { err: 'Không còn giường trống giờ này' }
  }
  const startDrag = (e: React.PointerEvent, d: Omit<Drag, 'x0' | 'cur' | 'moved'>) => {
    if (!canEdit) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ ...d, x0: e.clientX, cur: d.orig, moved: false })
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return
    const dx = e.clientX - drag.x0
    const cur = Math.max(drag.min, Math.min(drag.max, drag.orig + Math.round((dx / HW) * 60 / SNAP) * SNAP))
    if (cur !== drag.cur || (!drag.moved && Math.abs(dx) > 5)) setDrag({ ...drag, cur, moved: drag.moved || Math.abs(dx) > 5 })
  }
  const endDrag = () => {
    if (!drag) return
    const d = drag; setDrag(null)
    if (!d.moved || d.cur === d.orig) { // chạm = mở chi tiết
      if (d.kind === 'appt') setSel(d.id); else setDraft({ ktvId: d.ktvId, start: d.cur })
      return
    }
    if (d.kind === 'pot') { setPotPos(p => ({ ...p, [d.id]: d.cur })); return }
    const c = dragCheck(d)
    if (c.err) { say('⚠ ' + c.err); return }
    const err = moveAppt(d.id, d.cur, d.ktvId, c.bed!)
    if (err) say('⚠ ' + err)
    else if (c.bed !== d.bedId) say(`Đã dời sang ${D.hhmm(d.cur)} · đổi giường ${d.bedId} → ${c.bed}`)
  }

  const rows = view === 'ktv' ? D.ktvs().map(k => ({ id: k.id, title: k.name, sub: D.SHIFTS[k.shift!].label, off: D.SHIFTS[k.shift!] as { start: number; end: number } | null, list: appts.filter(a => a.ktvId === k.id), pot: pots.filter(p => p.ktvId === k.id) }))
    : D.BEDS.map(b => ({ id: b.id, title: b.id, sub: `Tầng ${b.floor} · ${b.zone === 'wash' ? 'gội' : 'trị liệu'}`, off: null, list: appts.filter(a => a.bedId === b.id), pot: [] as Pot[] }))
  const check = drag?.moved ? dragCheck(drag) : null
  return <>
    <PageHeader eyebrow="Điều phối hôm nay" title="Lịch điều phối" sub={`${D.dateLabel()} · Ca 1: 08:00–18:00 · Ca 2: 10:00–20:00`}
      right={<><Seg value={view} onChange={setView} items={[{ k: 'ktv', label: 'Theo KTV' }, { k: 'bed', label: 'Theo giường' }, { k: 'list', label: 'Danh sách' }]} />{canEdit && <button className="btn pri" onClick={() => setDraft({})}><Icon n="plus" />Tạo lịch</button>}</>} />
    <div className="row small muted"><Pill tone="green" dot>Đang làm</Pill><Pill tone="yellow" dot>Sắp xong / chờ thu</Pill><Pill tone="brown" dot>Đã thanh toán</Pill><Pill tone="purple" dot>Lịch hẹn</Pill></div>
    {view !== 'list' && canEdit && <div className="tiny muted">Độ dài ô = đúng thời lượng dịch vụ. <b>Kéo ngang</b> ô lịch hẹn để đổi giờ (bước 15 phút) · ô viền vàng = khung 60 phút trong khoảng trống, kéo để chọn giờ rồi chạm để đặt lịch. Ô đang làm / đã xong không kéo được.</div>}
    {view === 'list' ? <div className="card list">
      {[...appts].sort((a, b) => a.start - b.start).map(a => <button key={a.id} className="item" onClick={() => setSel(a.id)}>
        <div className="num strong tcol" style={{ width: 92 }}>{D.hhmm(a.start)}–{D.hhmm(a.end)}</div>
        <div className="body"><div className="t">{cust(s, a.customerId).name}{a.requested && <span className="muted tiny"> · khách yêu cầu KTV</span>}</div><div className="d">{D.svc(a.serviceId).name} · KTV {D.staffName(a.ktvId)} · {a.bedId}</div></div><ApptPill a={a} now={s.now} /></button>)}
    </div> : <div className="card gantt" ref={ganttRef}><div className="g-inner" style={{ ['--hw' as any]: HW + 'px' }}>
      <div className="g-row head"><div className="g-name eyebrow">{view === 'ktv' ? 'KTV' : 'Giường'}</div><div className="g-track">{Array.from({ length: H1 - H0 + 1 }, (_, i) => <span key={i} className="g-hl" style={{ left: i * HW }}>{String(H0 + i).padStart(2, '0')}:00</span>)}</div></div>
      {rows.map(r => <div key={r.id} className="g-row">
        <div className="g-name"><b>{r.title}</b><span className="tiny muted hide-m">{r.sub}</span>{view === 'ktv' && (() => { const st = ktvState(s, r.id); return <Pill tone={st.tone} dot>{st.label}</Pill> })()}</div>
        <div className="g-track">
          {r.off && <><div className="g-off" style={{ left: 0, width: x(r.off.start) }} /><div className="g-off" style={{ left: x(r.off.end), right: 0 }} /></>}
          {Array.from({ length: H1 - H0 + 1 }, (_, i) => <div key={i} className="g-hour" style={{ left: i * HW }} />)}
          {Array.from({ length: (H1 - H0) * 2 }, (_, i) => <div key={'h' + i} className="g-half" style={{ left: i * HW / 2 + HW / 2 }} />)}
          <div className="g-now" style={{ left: x(s.now) }} />
          {canEdit && r.pot.map(p => { const isD = drag?.kind === 'pot' && drag.id === p.key; const st = isD ? drag!.cur : Math.min(Math.max(potPos[p.key] ?? p.winStart, p.winStart), p.maxStart)
            return <div key={p.key}>
              <div className="g-free" style={{ left: x(p.winStart), width: w(p.winStart, p.winEnd) }} title={`Trống ${D.hhmm(p.winStart)}–${D.hhmm(p.winEnd)}`} />
              <button className={`g-blk pot${isD ? ' dragging' : ''}`} style={{ left: x(st), width: w(st, st + 60) - 2 }}
                onPointerDown={e => startDrag(e, { kind: 'pot', id: p.key, ktvId: p.ktvId, orig: st, dur: 60, min: p.winStart, max: p.maxStart })} onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={() => setDrag(null)}>
                <b>{D.hhmm(st)}–{D.hhmm(st + 60)}</b>+ Đặt lịch</button></div> })}
          {r.list.map(a => {
            const tone = a.status === 'paid' ? 'brown' : a.status === 'done' || (a.status === 'in_service' && s.now >= a.end - 15) ? 'yellow' : a.status === 'in_service' ? 'green' : a.status === 'no_show' ? 'red' : 'purple'
            const movable = canEdit && (a.status === 'booked' || a.status === 'checked_in')
            const isD = drag?.kind === 'appt' && drag.id === a.id && drag.moved
            const st = isD ? drag!.cur : a.start, en = st + (a.end - a.start)
            const sh = D.SHIFTS[(s.staff.find(k => k.id === a.ktvId)?.shift ?? 1) as 1 | 2]
            return <button key={a.id} className={`g-blk t-${tone}${movable ? ' movable' : ''}${isD ? ' dragging' : ''}${isD && check?.err ? ' bad' : ''}`} style={{ left: x(st), width: Math.max(w(st, en) - 2, 30) }}
              title={`${cust(s, a.customerId).name} ${D.hhmm(st)}–${D.hhmm(en)}`}
              onPointerDown={movable ? e => startDrag(e, { kind: 'appt', id: a.id, ktvId: a.ktvId, bedId: a.bedId, serviceId: a.serviceId, customerId: a.customerId, orig: a.start, dur: a.end - a.start, min: Math.max(sh.start, nowSnap), max: sh.end - (a.end - a.start) }) : undefined}
              onPointerMove={movable ? onMove : undefined} onPointerUp={movable ? endDrag : undefined} onPointerCancel={movable ? () => setDrag(null) : undefined}
              onClick={movable ? undefined : () => setSel(a.id)}>
              <b>{cust(s, a.customerId).name}</b>{D.hhmm(st)}–{D.hhmm(en)} · {view === 'ktv' ? (isD && check?.bed ? check.bed : a.bedId) : D.staffName(a.ktvId)}
              {isD && check?.err && <span className="g-err">{check.err}</span>}</button> })}
        </div></div>)}
    </div></div>}
    {sel && <ApptModal id={sel} onClose={() => setSel(null)} />}
    {draft && <NewApptModal init={draft} onClose={() => { setDraft(null); if (openNew) go('schedule') }} />}
  </>
}

export function ApptModal({ id, onClose }: { id: string; onClose: () => void }) {
  const st = useStore(); const { s, setApptStatus, moveAppt, openCustomer, go, setDraftBill, user } = st
  const a = s.appts.find(x => x.id === id)!
  const [edit, setEdit] = useState(false)
  const [f, setF] = useState({ start: D.hhmm(a.start), ktvId: a.ktvId, bedId: a.bedId })
  const [err, setErr] = useState<string | null>(null)
  const isRec = user.role === 'reception', isMine = user.role === 'ktv' && a.ktvId === user.staffId
  const save = () => { const m = D.parseHHMM(f.start); if (m == null) return setErr('Giờ không hợp lệ (HH:MM)'); const e = moveAppt(a.id, m, f.ktvId, f.bedId); if (e) setErr(e); else { setEdit(false); setErr(null) } }
  return <Modal title={cust(s, a.customerId).name} onClose={onClose} footer={<>
    <button className="btn ghost" onClick={() => openCustomer(a.customerId)}>Hồ sơ khách</button>
    {isRec && a.status === 'booked' && <><button className="btn danger" onClick={() => setApptStatus(a.id, 'no_show')}>Không đến</button><button className="btn danger" onClick={() => setApptStatus(a.id, 'cancelled')}>Hủy lịch</button><button className="btn" onClick={() => setEdit(true)}>Đổi giờ / KTV</button><button className="btn pri" onClick={() => setApptStatus(a.id, 'checked_in')}>Khách đã đến</button></>}
    {(isRec || isMine) && a.status === 'checked_in' && <button className="btn pri" onClick={() => setApptStatus(a.id, 'in_service')}>Bắt đầu phục vụ</button>}
    {(isRec || isMine) && a.status === 'in_service' && <button className="btn pri" onClick={() => setApptStatus(a.id, 'done')}>Hoàn thành dịch vụ</button>}
    {isRec && a.status === 'done' && <button className="btn gold" onClick={() => { setDraftBill(a.id); go('cashier'); onClose() }}>Thu tiền</button>}
  </>}>
    <div className="row"><ApptPill a={a} now={s.now} />{a.requested && <Pill tone="yellow">Khách yêu cầu đích danh</Pill>}<Pill>Kênh: {a.channel}</Pill></div>
    <div className="grid g2 small">
      <div><span className="eyebrow">Dịch vụ</span><div className="strong">{D.svc(a.serviceId).name}</div></div>
      <div><span className="eyebrow">Giờ</span><div className="strong num">{D.hhmm(a.start)}–{D.hhmm(a.end)}</div></div>
      <div><span className="eyebrow">KTV</span><div className="strong">{D.staffName(a.ktvId)}</div></div>
      <div><span className="eyebrow">Giường</span><div className="strong">{a.bedId}</div></div>
    </div>
    {(a.note || cust(s, a.customerId).health) && <div className="warn">📌 {[a.note, cust(s, a.customerId).health].filter(Boolean).join(' · ')}</div>}
    {edit && <div className="card pad col">
      <div className="grid g3"><label className="f">Giờ bắt đầu<input id="mv-start" className="inp" value={f.start} onChange={e => setF({ ...f, start: e.target.value })} /></label>
        <label className="f">KTV<select id="mv-ktv" className="inp" value={f.ktvId} onChange={e => setF({ ...f, ktvId: e.target.value })}>{D.ktvs().map(k => <option key={k.id} value={k.id}>{k.name} (Ca {k.shift})</option>)}</select></label>
        <label className="f">Giường<select id="mv-bed" className="inp" value={f.bedId} onChange={e => setF({ ...f, bedId: e.target.value })}>{D.BEDS.filter(b => b.zone === D.bedZoneFor(a.serviceId)).map(b => <option key={b.id}>{b.id}</option>)}</select></label></div>
      {err && <div className="err">{err}</div>}
      <div className="row"><button className="btn" onClick={() => setEdit(false)}>Thôi</button><button className="btn pri" onClick={save}>Lưu thay đổi</button></div>
    </div>}
  </Modal>
}

export function NewApptModal({ init, onClose }: { init: NewDraft; onClose: () => void }) {
  const { s, addAppt, addCustomer } = useStore()
  const [custId, setCustId] = useState('')
  const [q, setQ] = useState('')
  const [serviceId, setService] = useState('m60')
  const [ktvId, setKtv] = useState(init.ktvId ?? 'auto')
  const [start, setStart] = useState(D.hhmm(init.start ?? Math.ceil((s.now + 15) / 15) * 15))
  const [requested, setReq] = useState(false)
  const [channel, setChannel] = useState('Điện thoại')
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const m = D.parseHHMM(start), dur = D.svc(serviceId).duration
  // KTV "Home sắp xếp": người đầu hàng xoay tour trống đúng giờ đó
  const autoKtv = m == null ? null : [...s.rotation[1], ...s.rotation[2]].find(k => !ktvConflict(s, k, m, m + dur)) ?? null
  const realKtv = ktvId === 'auto' ? autoKtv : ktvId
  const bed = m != null ? freeBedFor(s, serviceId, m, m + dur) : null
  const conflict = m == null ? 'Giờ không hợp lệ (HH:MM)' : !realKtv ? 'Không còn KTV trống giờ này' : ktvConflict(s, realKtv, m, m + dur) || (!bed ? 'Không còn giường trống đúng khu vực' : null)
  const matches = q.trim() ? s.customers.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) || c.code.toLowerCase() === q.toLowerCase()).slice(0, 5) : []
  const submit = () => {
    let cid = custId
    if (!cid) { if (!q.trim()) return setErr('Chọn hoặc nhập tên khách'); const nc = addCustomer({ name: q.trim(), phone: '', group: 'VN', source: 'Chưa xác định' }); if (typeof nc === 'string') return setErr(nc); cid = nc.id }
    if (conflict || !realKtv || !bed || m == null) return setErr(conflict)
    const e = addAppt({ customerId: cid, serviceId, ktvId: realKtv, bedId: bed, start: m, requested: requested && ktvId !== 'auto', channel, note })
    if (e) setErr(e); else onClose()
  }
  return <Modal title="Tạo lịch hẹn" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn pri" onClick={submit} disabled={!!conflict}>Xác nhận tạo lịch</button></>}>
    <label className="f">Khách hàng (tên, SĐT hoặc mã)<input id="na-q" className="inp" value={custId ? cust(s, custId).name : q} onChange={e => { setCustId(''); setQ(e.target.value) }} placeholder="VD: Lan, 0901…, 125" /></label>
    {!custId && matches.length > 0 && <div className="card list">{matches.map(c => <button key={c.id} className="item" onClick={() => setCustId(c.id)}><div className="body"><div className="t">{c.name}</div><div className="d">Mã {c.code} · {c.visits} lượt{c.packages.length ? ` · ${c.packages.length} gói` : ''}</div></div></button>)}</div>}
    {!custId && q.trim() && !matches.length && <div className="muted small">Không thấy hồ sơ — sẽ tạo khách mới "{q.trim()}"</div>}
    <div className="grid g2">
      <label className="f">Dịch vụ<select id="na-svc" className="inp" value={serviceId} onChange={e => setService(e.target.value)}>{D.SERVICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
      <label className="f">Giờ bắt đầu<input id="na-start" className="inp" value={start} onChange={e => setStart(e.target.value)} placeholder="HH:MM" /></label>
      <label className="f">KTV<select id="na-ktv" className="inp" value={ktvId} onChange={e => setKtv(e.target.value)}><option value="auto">Home sắp xếp (theo xoay tour)</option>{D.ktvs().map(k => <option key={k.id} value={k.id}>{k.name} (Ca {k.shift})</option>)}</select></label>
      <label className="f">Kênh đặt<select id="na-ch" className="inp" value={channel} onChange={e => setChannel(e.target.value)}>{['Điện thoại', 'Zalo', 'Messenger', 'Website', 'Đến trực tiếp'].map(c => <option key={c}>{c}</option>)}</select></label>
    </div>
    {ktvId !== 'auto' && <label className="check"><input type="checkbox" checked={requested} onChange={e => setReq(e.target.checked)} />Khách yêu cầu đích danh KTV này</label>}
    <label className="f">Ghi chú cho KTV<input id="na-note" className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder="VD: đau cổ vai gáy, lực nhẹ" /></label>
    {conflict ? <div className="err">{conflict}</div> : <div className="ok">Hợp lệ · KTV {D.staffName(realKtv!)} · giường {bed} · {start}–{D.hhmm(m! + dur)}</div>}
    {err && err !== conflict && <div className="err">{err}</div>}
  </Modal>
}

// ─────────────────────────── HÀNG CHỜ CHIA TOUR ───────────────────────────
export function QueueScreen() {
  const { s, assignTour, removeQueue, openCustomer, user } = useStore()
  const [sel, setSel] = useState<string | null>(s.queue[0]?.id ?? null)
  const [assign, setAssign] = useState<{ ktvId: string; start: number; bedId: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const guest = s.queue.find(g => g.id === sel)
  const opts = guest ? suggestKtv(s, guest.serviceId, guest.requestedKtvId) : []
  const canEdit = user.role === 'reception'
  return <>
    <PageHeader eyebrow="Điều phối hôm nay" title="Hàng chờ chia tour" sub={`${D.hhmm(s.now)} · ${s.queue.length} khách đang chờ`} right={canEdit && <button className="btn pri" onClick={() => setAdding(true)}><Icon n="plus" />Thêm khách</button>} />
    <div className="split">
      <Sec eyebrow="Khách đang chờ">
        <div className="card list">
          {s.queue.map(g => { const w = s.now - g.arrival; const c = cust(s, g.customerId); return <button key={g.id} className="item" onClick={() => setSel(g.id)} style={sel === g.id ? { background: 'var(--bg)', boxShadow: 'inset 3px 0 0 var(--gold)' } : undefined}>
            <Av name={c.name} /><div className="body"><div className="t">{c.name} {c.vip && <Pill tone="yellow">VIP</Pill>}</div><div className="d">{D.svc(g.serviceId).name} · lực {g.strength}{g.requestedKtvId && ` · yêu cầu KTV ${D.staffName(g.requestedKtvId)}`}</div></div>
            <Pill tone={w > 10 ? 'red' : 'yellow'}>Chờ {w}p</Pill></button> })}
          {!s.queue.length && <Empty>Không có khách chờ</Empty>}
        </div>
        {guest && <div className="card pad col" style={{ marginTop: 12 }}>
          <div className="row"><b>Gợi ý cho {cust(s, guest.customerId).name}</b><button className="link small right-al" onClick={() => openCustomer(guest.customerId)}>Hồ sơ</button></div>
          <div className="tiny muted">Thứ tự: KTV khách yêu cầu → giờ trống sớm nhất → vị trí xoay tour. Đã tính 10 phút dọn giường và giường đúng khu vực.</div>
          {opts.slice(0, 4).map(o => <div key={o.id} className="row"><Av name={D.staffName(o.id)} /><div style={{ flex: 1, minWidth: 0 }}><b>{D.staffName(o.id)}</b> {o.requested && <Pill tone="yellow">Khách yêu cầu</Pill>}<div className="tiny muted">{o.t === s.now ? 'Nhận ngay' : `Trống từ ${D.hhmm(o.t!)}`} · giường {o.bed}</div></div>
            {canEdit && <button className="btn sm pri" onClick={() => { setErr(null); setAssign({ ktvId: o.id, start: o.t!, bedId: o.bed! }) }}>Giao</button>}</div>)}
          {!opts.length && <div className="warn">Không còn KTV/giường trống trong ca cho dịch vụ này.</div>}
          {canEdit && <button className="btn sm danger" onClick={() => removeQueue(guest.id)}>Khách rời đi</button>}
        </div>}
      </Sec>
      <Sec eyebrow="Thứ tự xoay tour">
        <div className="grid g2">{([1, 2] as const).map(sh => <div key={sh} className="card list"><div className="pad eyebrow">{sh === 1 ? '☀️ Ca 1 · 08:00–18:00' : '🌙 Ca 2 · 10:00–20:00'}</div>
          {s.rotation[sh].map((kid, i) => { const st = ktvState(s, kid); const tours = s.appts.filter(a => a.ktvId === kid && a.status !== 'cancelled' && a.status !== 'no_show').length
            return <div key={kid} className="item"><span className="num strong muted" style={{ width: 18 }}>{i + 1}</span><Av name={D.staffName(kid)} /><div className="body"><div className="t">{D.staffName(kid)}</div><div className="d">{tours} tour hôm nay</div></div><Pill tone={st.tone} dot>{st.label}</Pill></div> })}</div>)}</div>
        <div className="tiny muted" style={{ marginTop: 8 }}>KTV vừa nhận khách xuống cuối hàng. Khách yêu cầu đích danh thì KTV không mất lượt.</div>
      </Sec>
    </div>
    {assign && guest && <Modal title="Xác nhận chia tour" onClose={() => setAssign(null)} footer={<><button className="btn" onClick={() => setAssign(null)}>Hủy</button><button className="btn pri" onClick={() => { const e = assignTour(guest.id, assign.ktvId, assign.bedId, assign.start); if (e) setErr(e); else { setAssign(null); setSel(null) } }}>Xác nhận chia tour</button></>}>
      <div className="row"><b>{cust(s, guest.customerId).name}</b>→<b>KTV {D.staffName(assign.ktvId)}</b><Pill>{D.svc(guest.serviceId).name}</Pill></div>
      <div className="grid g2"><label className="f">Giờ bắt đầu<input id="as-start" className="inp" value={D.hhmm(assign.start)} onChange={e => { const m = D.parseHHMM(e.target.value); if (m != null) setAssign({ ...assign, start: m }) }} /></label>
        <label className="f">Giường<select id="as-bed" className="inp" value={assign.bedId} onChange={e => setAssign({ ...assign, bedId: e.target.value })}>{D.BEDS.filter(b => b.zone === D.bedZoneFor(guest.serviceId)).map(b => <option key={b.id} disabled={!!bedConflict(s, b.id, assign.start, assign.start + D.svc(guest.serviceId).duration)}>{b.id}</option>)}</select></label></div>
      {assign.start > s.now && <div className="warn">KTV trống từ {D.hhmm(assign.start)} — báo khách chờ thêm {assign.start - s.now} phút.</div>}
      {err && <div className="err">{err}</div>}
    </Modal>}
    {adding && <AddGuestModal onClose={() => setAdding(false)} />}
  </>
}
function AddGuestModal({ onClose }: { onClose: () => void }) {
  const { s, addQueue, addCustomer } = useStore()
  const [q, setQ] = useState(''); const [cid, setCid] = useState('')
  const [serviceId, setSvc] = useState('m60'); const [strength, setStr] = useState<'nhẹ' | 'vừa' | 'mạnh'>('vừa'); const [req, setReq] = useState(''); const [note, setNote] = useState('')
  const matches = q.trim() && !cid ? s.customers.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.code === q).slice(0, 4) : []
  const add = () => { let id = cid; if (!id) { if (!q.trim()) return; const nc = addCustomer({ name: q.trim(), phone: '', group: 'VN', source: 'Đi ngang' }); if (typeof nc === 'string') return; id = nc.id } if (!addQueue({ customerId: id, serviceId, strength, requestedKtvId: req || undefined, note: note || undefined })) onClose() }
  return <Modal title="Thêm khách vào hàng chờ" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn pri" disabled={!q.trim() && !cid} onClick={add}>Thêm vào hàng chờ</button></>}>
    <label className="f">Khách<input id="ag-q" className="inp" value={cid ? cust(s, cid).name : q} onChange={e => { setCid(''); setQ(e.target.value) }} placeholder="Tên hoặc mã khách" /></label>
    {matches.map(c => <button key={c.id} className="btn sm" onClick={() => setCid(c.id)}>{c.name} · {c.code}</button>)}
    <div className="grid g2"><label className="f">Dịch vụ<select id="ag-svc" className="inp" value={serviceId} onChange={e => setSvc(e.target.value)}>{D.SERVICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
      <label className="f">Lực<select id="ag-str" className="inp" value={strength} onChange={e => setStr(e.target.value as any)}><option>nhẹ</option><option>vừa</option><option>mạnh</option></select></label>
      <label className="f">Yêu cầu KTV (nếu có)<select id="ag-req" className="inp" value={req} onChange={e => setReq(e.target.value)}><option value="">Không</option>{D.ktvs().map(k => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label>
      <label className="f">Ghi chú<input id="ag-note" className="inp" value={note} onChange={e => setNote(e.target.value)} /></label></div>
  </Modal>
}

// ─────────────────────────── SƠ ĐỒ GIƯỜNG ───────────────────────────
export function BedsScreen() {
  const { s, bedReady, user } = useStore()
  const [sel, setSel] = useState<string | null>(null)
  const counts = D.BEDS.map(b => bedState(s, b).label)
  return <>
    <PageHeader eyebrow="Điều phối hôm nay" title="Sơ đồ giường" sub={`${D.BEDS.length} giường · ${counts.filter(c => c === 'Trống').length} trống · ${counts.filter(c => c === 'Đang làm' || c === 'Sắp xong').length} đang dùng · ${counts.filter(c => c === 'Đang dọn').length} đang dọn`} />
    {([1, 2, 3] as const).map(fl => <Sec key={fl} eyebrow={`Tầng ${fl}`}><div className="beds">{D.BEDS.filter(b => b.floor === fl).map(b => { const st = bedState(s, b)
      return <button key={b.id} className={`bed t-${st.tone}`} onClick={() => st.appt ? setSel(st.appt.id) : undefined} style={{ cursor: st.appt ? 'pointer' : 'default' }}>
        <div className="row"><b>{b.id}</b><span className="tiny right-al">{b.zone === 'wash' ? 'Gội' : 'Trị liệu'}</span></div>
        <span className="small strong">{st.label}</span>
        {st.appt && <span className="tiny">{cust(s, st.appt.customerId).name} · {D.staffName(st.appt.ktvId)} · {D.hhmm(st.appt.start)}–{D.hhmm(st.appt.end)}</span>}
        {st.label === 'Đang dọn' && <><span className="tiny">KTV {D.staffName(st.ktv)} đang dọn</span>{(user.role === 'reception' || user.staffId === st.ktv) && <span className="link tiny" role="button" onClick={e => { e.stopPropagation(); bedReady(b.id) }}>Báo sẵn sàng</span>}</>}
      </button> })}</div></Sec>)}
    {sel && <ApptModal id={sel} onClose={() => setSel(null)} />}
  </>
}

// ─────────────────────────── THÔNG BÁO ───────────────────────────
export function NotifScreen() {
  const { s, user, me, markRead, markAllRead, go } = useStore()
  const mine = s.notifs.filter(n => n.roles.includes(user.role))
  const cats = ['Tất cả', ...Array.from(new Set(mine.map(n => n.cat)))] as string[]
  const [f, setF] = useState('Tất cả')
  const shown = f === 'Tất cả' ? mine : mine.filter(n => n.cat === f)
  const unread = mine.filter(n => !n.readBy.includes(me.id)).length
  return <>
    <PageHeader eyebrow="Sự kiện vừa xảy ra" title="Thông báo" sub={`${unread} chưa đọc`} right={<button className="btn" onClick={markAllRead}>Đánh dấu tất cả đã đọc</button>} />
    <Seg value={f} onChange={setF} items={cats.map(c => ({ k: c, label: c, badge: mine.filter(n => (c === 'Tất cả' || n.cat === c) && !n.readBy.includes(me.id)).length }))} />
    <div className="card list">{shown.map(n => { const read = n.readBy.includes(me.id); return <button key={n.id} className="item" onClick={() => { markRead(n.id); if (n.nav) go(n.nav) }} style={read ? { opacity: .7 } : undefined}>
      <span className={`sev ${read ? '' : 'cao'}`} style={read ? { background: 'var(--line)' } : undefined} /><div className="body"><div className="t">{n.text}</div><div className="d">{n.cat} · {n.detail}</div></div><span className="tiny muted num">{D.hhmm(n.min)}</span></button> })}
      {!shown.length && <Empty>Không có thông báo</Empty>}</div>
  </>
}
export { inShift }
