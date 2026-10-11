// KTV · Ghi nhận chăm sóc khách hàng sau buổi (5 phần) → lưu vào hồ sơ khách để cá nhân hóa lần sau.
// Chỉ chọn được khách KTV đó đã phục vụ HÔM NAY (đang làm / xong / đã thanh toán).
import { useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { cust } from '../logic'
import { Modal, NumInput, Pill } from '../ui'
import { isPastDay } from '../period'

type Form = Omit<D.CareNote, 'at' | 'date' | 'by' | 'byId'>
const blank = (): Form => ({ pain: { area: '', type: '', side: '', level: 0 }, findings: { stiff: '', numb: '', stress: 'Không', other: '' }, pref: { force: '', technique: '', wish: '' }, after: { relief: '', reliefPct: 0, remain: '', remainLevel: 0 }, spend: '', unhappy: [], unhappyOther: '' })

/** Chọn nhanh 1 giá trị */
function Pick({ v, set, opts }: { v: string; set: (x: string) => void; opts: readonly string[] }) {
  return <div className="row" style={{ gap: 6 }}>{opts.map(o => <button key={o} type="button" className={`btn sm${v === o ? ' pri' : ''}`} aria-pressed={v === o} onClick={() => set(v === o ? '' : o)}>{o}</button>)}</div>
}

export function CareNoteModal({ onClose, preset }: { onClose: () => void; preset?: string }) {
  const { s, me, addCareNote } = useStore()
  const served = [...new Map(s.appts.filter(a => a.ktvId === me.id && ['in_service', 'done', 'paid'].includes(a.status)).map(a => [a.customerId, a])).values()]
  const [cid, setCid] = useState(preset && served.some(a => a.customerId === preset) ? preset : served[0]?.customerId ?? '')
  const [f, setF] = useState<Form>(blank)
  const up = <K extends keyof Form>(k: K, v: Partial<Form[K]> | Form[K]) => setF(o => ({ ...o, [k]: typeof v === 'object' && !Array.isArray(v) ? { ...(o[k] as object), ...v } : v }))
  const c = cid ? cust(s, cid) : null, last = c?.careNotes?.[0]
  const past = isPastDay()
  const ok = !past && !!cid && !!f.pain.area && !!f.pref.force
  return <Modal wide title="Ghi nhận chăm sóc khách hàng" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button>
    <button className="btn pri" disabled={!ok} onClick={() => { addCareNote(cid, f); onClose() }}>Lưu vào hồ sơ khách</button></>}>
    {past ? <div className="warn">Đang xem ngày đã qua — chỉ ghi nhận cho khách đã chăm sóc trong ngày hôm nay. Bấm "Về hôm nay" để ghi.</div> : !served.length ? <div className="warn">Hôm nay bạn chưa có khách đang làm hoặc đã xong — chỉ ghi nhận được khách bạn đã chăm sóc trong ngày.</div> : <div className="col">
      <label className="f">Khách đã chăm sóc hôm nay {D.dateShort().slice(0, 5)}<select className="inp" value={cid} onChange={e => setCid(e.target.value)}>
        {served.map(a => <option key={a.customerId} value={a.customerId}>{cust(s, a.customerId).name} · {D.hhmm(a.start)} · {D.svc(a.serviceId).name}</option>)}</select></label>
      {last && <div className="note small"><b>Lần trước ({last.date} · KTV {last.by}):</b> {last.pain.area} mức {last.pain.level}/10 · lực {last.pref.force.toLowerCase()}{last.after.relief ? ` · giảm ${last.after.reliefPct}% ở ${last.after.relief}` : ''}</div>}

      <section className="care-sec"><span className="eyebrow">1. Tình trạng</span>
        <div className="f" role="group" aria-label="Vùng đau chính">Vùng đau chính *<Pick v={f.pain.area} set={x => up('pain', { area: x })} opts={D.CARE_OPTS.area} /></div>
        <div className="grid fgrid">
          <div className="f" role="group" aria-label="Đau">Đau<Pick v={f.pain.type} set={x => up('pain', { type: x })} opts={D.CARE_OPTS.type} /></div>
          <div className="f" role="group" aria-label="Bên">Bên<Pick v={f.pain.side} set={x => up('pain', { side: x })} opts={D.CARE_OPTS.side} /></div>
          <label className="f">Mức độ (0–10)<NumInput className="inp num" min={0} max={10} value={f.pain.level} onChange={v => up('pain', { level: v })} /></label>
        </div></section>

      <section className="care-sec"><span className="eyebrow">2. Ghi nhận</span><div className="grid fgrid">
        <label className="f">Cứng cơ<input className="inp" placeholder="VD: cơ thang phải" value={f.findings.stiff} onChange={e => up('findings', { stiff: e.target.value })} /></label>
        <label className="f">Tê<input className="inp" placeholder="VD: tê tay trái" value={f.findings.numb} onChange={e => up('findings', { numb: e.target.value })} /></label>
        <div className="f" role="group" aria-label="Stress / mất ngủ">Stress / mất ngủ<Pick v={f.findings.stress} set={x => up('findings', { stress: x || 'Không' })} opts={D.CARE_OPTS.stress} /></div>
        <label className="f">Khác<input className="inp" value={f.findings.other} onChange={e => up('findings', { other: e.target.value })} /></label>
      </div></section>

      <section className="care-sec"><span className="eyebrow">3. Sở thích</span><div className="grid fgrid">
        <div className="f" role="group" aria-label="Lực">Lực *<Pick v={f.pref.force} set={x => up('pref', { force: x })} opts={D.CARE_OPTS.force} /></div>
        <label className="f">Kỹ thuật<input className="inp" placeholder="VD: day ấn huyệt, đá nóng" value={f.pref.technique} onChange={e => up('pref', { technique: e.target.value })} /></label>
        <label className="f">Mong muốn khác<input className="inp" placeholder="VD: phòng ấm, ít nói chuyện" value={f.pref.wish} onChange={e => up('pref', { wish: e.target.value })} /></label>
      </div></section>

      <section className="care-sec"><span className="eyebrow">4. Sau buổi</span><div className="grid fgrid">
        <label className="f">Giảm đau ở đâu<input className="inp" placeholder="VD: cổ vai" value={f.after.relief} onChange={e => up('after', { relief: e.target.value })} /></label>
        <label className="f">Giảm bao nhiêu (%)<NumInput className="inp num" min={0} max={100} value={f.after.reliefPct} onChange={v => up('after', { reliefPct: v })} /></label>
        <label className="f">Còn đau ở đâu<input className="inp" placeholder="VD: thắt lưng" value={f.after.remain} onChange={e => up('after', { remain: e.target.value })} /></label>
        <label className="f">Còn đau mức (0–10)<NumInput className="inp num" min={0} max={10} value={f.after.remainLevel} onChange={v => up('after', { remainLevel: v })} /></label>
      </div></section>

      <section className="care-sec"><span className="eyebrow">5. Tiềm năng & trải nghiệm</span>
        <div className="f" role="group" aria-label="Tiềm năng chi của khách">Tiềm năng chi của khách<Pick v={f.spend} set={x => up('spend', x)} opts={D.CARE_OPTS.spend} /></div>
        <div className="f" role="group" aria-label="Ngoài kỹ thuật, khách chưa hài lòng ở">Ngoài kỹ thuật, khách chưa hài lòng ở<div className="row" style={{ gap: 6 }}>{D.CARE_OPTS.unhappy.map(o => { const on = f.unhappy.includes(o)
          return <button key={o} type="button" className={`btn sm${on ? ' pri' : ''}`} aria-pressed={on} onClick={() => up('unhappy', on ? f.unhappy.filter(x => x !== o) : [...f.unhappy, o])}>{o}</button> })}</div></div>
        <label className="f">Khác<input className="inp" value={f.unhappyOther} onChange={e => up('unhappyOther', e.target.value)} /></label>
      </section>
      <div className="tiny muted">* bắt buộc. Lưu vào hồ sơ khách (mục Chăm sóc & phản hồi, Sức khỏe, Sở thích) để lần sau KTV và lễ tân phục vụ đúng ý khách.</div>
    </div>}
  </Modal>
}

/** Hiện các lần ghi nhận trong hồ sơ khách */
export function CareNotesList({ c }: { c: D.Customer }) {
  const { user } = useStore(), ktv = user.role === 'ktv'
  const list = (c.careNotes ?? []).filter(n => !ktv || n.byId === user.staffId) // KTV chỉ xem ghi nhận của chính mình
  if (!list.length) return null
  return <div className="col">{list.map((n, i) => <div key={i} className="card pad col small" style={{ gap: 4 }}>
    <div className="row"><b>{n.date}</b><span className="muted">KTV {n.by}</span>{n.spend && !ktv && <span className="right-al"><Pill tone="purple">Tiềm năng: {n.spend}</Pill></span>}</div>
    <div><span className="kv-l">Tình trạng:</span> {n.pain.area}{n.pain.side ? ` (${n.pain.side})` : ''}{n.pain.type ? ` · ${n.pain.type}` : ''} · mức {n.pain.level}/10</div>
    {(n.findings.stiff || n.findings.numb || n.findings.stress !== 'Không' || n.findings.other) && <div><span className="kv-l">Ghi nhận:</span> {[n.findings.stiff && `cứng cơ ${n.findings.stiff}`, n.findings.numb && `tê ${n.findings.numb}`, n.findings.stress !== 'Không' && `stress/mất ngủ ${n.findings.stress.toLowerCase()}`, n.findings.other].filter(Boolean).join(' · ')}</div>}
    <div><span className="kv-l">Sở thích:</span> lực {n.pref.force.toLowerCase()}{n.pref.technique ? ` · ${n.pref.technique}` : ''}{n.pref.wish ? ` · ${n.pref.wish}` : ''}</div>
    {(n.after.relief || n.after.remain) && <div><span className="kv-l">Sau buổi:</span> {n.after.relief && `giảm ${n.after.reliefPct}% ở ${n.after.relief}`}{n.after.remain && ` · còn đau ${n.after.remain} ${n.after.remainLevel}/10`}</div>}
    {(n.unhappy.length > 0 || n.unhappyOther) && <div style={{ color: 'var(--r-fg)' }}><span className="kv-l">Chưa hài lòng:</span> {[...n.unhappy, n.unhappyOther].filter(Boolean).join(', ')}</div>}
  </div>)}</div>
}
