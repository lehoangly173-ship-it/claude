// ⑬ 13.10 — BẢNG CÀI ĐẶT LƯƠNG (CEO sửa không cần code) + CHẤM ĐIỂM NĂNG LỰC LEADER (thang 1–10).
// Lưu một lần → mọi màn Thu nhập / Bảng lương / Tổng kết của KTV, Lễ tân, Leader, Marketing cập nhật ngay (một nguồn: store.pay).
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { T } from '../i18n'
import { Block, Pill, Seg, Empty } from '../ui'
import { PAY_ROLES, SHIFT_ROLES, TOUR_DURATIONS, servicesOf, evalAvg, evalOf, ymOf, EVAL_N, type PayConfig, type PayRole, type RolePay } from '../pay'
import { LEADER_EVAL } from './fix4'

const fmt = (v: number | null) => (v == null ? '' : v.toLocaleString('vi-VN'))
const parseMoney = (x: string): number | null => { const d = x.replace(/[^\d]/g, ''); return d ? Math.min(Number(d), 1e12) : null }
const parseDec = (x: string): number | null => { const v = x.trim().replace(',', '.'); if (!v) return null; const n = Number(v); return Number.isFinite(n) ? n : NaN }

/** Ô nhập số tiền: để trống = Chưa đặt */
function MoneyIn({ id, label, value, onChange }: { id: string; label: string; value: number | null; onChange: (v: number | null) => void; suffix?: string }) {
  return <label className="f" htmlFor={id}>{label}
    <input id={id} className="inp" inputMode="numeric" placeholder={T.pay.unset} value={fmt(value)} onChange={e => onChange(parseMoney(e.target.value))} />
  </label>
}

/** Ô số thập phân (VD 8,5 giờ): giữ nguyên chữ đang gõ, chỉ đổi số khi hợp lệ */
function DecIn({ id, label, value, onChange }: { id: string; label: string; value: number | null; onChange: (v: number | null) => void }) {
  const [raw, setRaw] = useState(value == null ? '' : String(value).replace('.', ','))
  useEffect(() => { const v = parseDec(raw); if (v !== value && !(Number.isNaN(v) && Number.isNaN(value as number))) setRaw(value == null ? '' : String(value).replace('.', ',')) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return <label className="f" htmlFor={id}>{label}<input id={id} className="inp" inputMode="decimal" placeholder={T.pay.unset} value={raw} onChange={e => { setRaw(e.target.value); const v = parseDec(e.target.value); onChange(v) }} /></label>
}

export function PaySettings() {
  const { pay, savePay } = useStore()
  const [draft, setDraft] = useState<PayConfig>(pay)
  const [role, setRole] = useState<PayRole>('ktv')
  const [err, setErr] = useState<string | null>(null)
  // chỉ so phần số liệu (không so người lưu / giờ lưu / nhãn mẫu)
  const core = (c: PayConfig) => JSON.stringify([c.roles, c.tour, c.otMinMin, c.evalPerPoint])
  const dirty = core(draft) !== core(pay)
  // máy khác vừa lưu (đồng bộ tức thì) và mình chưa sửa gì → cập nhật theo
  useEffect(() => { if (!dirty) setDraft(pay) }, [pay]) // eslint-disable-line react-hooks/exhaustive-deps
  const rp = draft.roles[role]
  const setRp = (k: keyof RolePay, v: number | null) => { setErr(null); setDraft(d => ({ ...d, roles: { ...d.roles, [role]: { ...d.roles[role], [k]: v } } })) }
  const set = <K extends keyof PayConfig>(k: K, v: PayConfig[K]) => { setErr(null); setDraft(d => ({ ...d, [k]: v })) }
  const save = () => { const e = savePay(draft); setErr(e); if (!e) setDraft(d => ({ ...d, sample: false })) }
  const status = pay.sample ? <Pill tone="yellow">{T.pay.sample}</Pill> : pay.by ? <Pill tone="green">{T.pay.savedBy(pay.by, pay.at ?? '')}</Pill> : <Pill>{T.pay.unset}</Pill>
  const cell = (v: number | null, unit = '') => (v == null ? <span className="muted">{T.pay.unset}</span> : `${v.toLocaleString('vi-VN')}${unit}`)
  return <>
    <Block title={T.pay.title} sub={T.pay.sub} right={status}>
      <div className="col" style={{ gap: 6 }}>
        <div className="strong">{T.pay.roleBlock}</div>
        <div className="tiny muted">{T.pay.roleSub}</div>
        <Seg value={role} onChange={v => setRole(v as PayRole)} items={PAY_ROLES.map(r => ({ k: r, label: D.ROLE_LABEL[r] }))} />
        <div className="grid fgrid">
          <MoneyIn id="pay-base" label={T.pay.base} value={rp.base} onChange={v => setRp('base', v)} suffix={T.pay.perMonth} />
          <label className="f" htmlFor="pay-std">{T.pay.stdDays}<input id="pay-std" className="inp" inputMode="numeric" value={rp.stdDays || ''} onChange={e => setRp('stdDays', parseMoney(e.target.value) ?? 0)} /></label>
          <MoneyIn id="pay-point" label={T.pay.perPoint} value={rp.perPoint} onChange={v => setRp('perPoint', v)} />
          <MoneyIn id="pay-late" label={T.pay.perLate} value={rp.perLate} onChange={v => setRp('perLate', v)} />
          <MoneyIn id="pay-ot" label={T.pay.otPerHour} value={rp.otPerHour} onChange={v => setRp('otPerHour', v)} suffix={T.pay.perHour} />
          {SHIFT_ROLES.includes(role)
            ? <label className="f">{T.pay.stdHours}<input className="inp" disabled value={T.pay.byShift} /></label>
            : <DecIn key={role} id="pay-hours" label={T.pay.stdHours} value={rp.stdHours} onChange={v => setRp('stdHours', v)} />}
        </div>
        <div className="tiny muted">{T.pay.stdHoursNote}</div>
      </div>
    </Block>
    <Block title={T.pay.tourBlock} sub={T.pay.tourSub}>
      <div className="grid fgrid">{TOUR_DURATIONS.map(dur => <div key={dur} className="col" style={{ gap: 2 }}>
        <MoneyIn id={`pay-tour-${dur}`} label={T.pay.tourDur(dur)} value={draft.tour[String(dur)] ?? null} onChange={v => set('tour', { ...draft.tour, [String(dur)]: v })} suffix={T.pay.perTour} />
        <span className="tiny muted">{servicesOf(dur).join(' · ')}</span></div>)}</div>
    </Block>
    <Block title={T.pay.otBlock} sub={T.pay.otSub}>
      <label className="f" htmlFor="pay-otmin" style={{ maxWidth: 280 }}>{T.pay.otMin}<input id="pay-otmin" className="inp" inputMode="numeric" value={String(draft.otMinMin)} onChange={e => set('otMinMin', parseMoney(e.target.value) ?? 0)} /></label>
      <div className="tiny muted">{T.pay.otMinNote}</div>
    </Block>
    <Block title={T.pay.evalBlock} sub={T.pay.evalSub}>
      <div style={{ maxWidth: 280 }}><MoneyIn id="pay-eval" label={T.pay.evalPer} value={draft.evalPerPoint} onChange={v => set('evalPerPoint', v)} /></div>
    </Block>
    <Block title={T.pay.overview}>
      <div className="tbl-wrap"><table><thead><tr><th>{T.pay.component}</th>{PAY_ROLES.map(r => <th key={r}>{D.ROLE_LABEL[r]}</th>)}</tr></thead><tbody>
        <tr><td className="strong">{T.pay.base}</td>{PAY_ROLES.map(r => <td key={r} className="num">{cell(draft.roles[r].base)}</td>)}</tr>
        <tr><td className="strong">{T.pay.stdDays}</td>{PAY_ROLES.map(r => <td key={r} className="num">{draft.roles[r].stdDays}</td>)}</tr>
        <tr><td className="strong">{T.pay.perPoint}</td>{PAY_ROLES.map(r => <td key={r} className="num">{cell(draft.roles[r].perPoint)}</td>)}</tr>
        <tr><td className="strong">{T.pay.perLate}</td>{PAY_ROLES.map(r => <td key={r} className="num">{cell(draft.roles[r].perLate)}</td>)}</tr>
        <tr><td className="strong">{T.pay.otPerHour}</td>{PAY_ROLES.map(r => <td key={r} className="num">{cell(draft.roles[r].otPerHour)}</td>)}</tr>
        <tr><td className="strong">{T.pay.stdHours}</td>{PAY_ROLES.map(r => <td key={r} className="num">{SHIFT_ROLES.includes(r) ? T.pay.byShift : cell(draft.roles[r].stdHours)}</td>)}</tr>
        <tr><td className="strong">{T.pay.tourBlock}</td><td className="num">{TOUR_DURATIONS.map(d => `${d}′: ${draft.tour[String(d)] == null ? T.pay.unset : D.vndShort(draft.tour[String(d)]!)}`).join(' · ')}</td><td>—</td><td>—</td><td>—</td></tr>
        <tr><td className="strong">{T.pay.evalPer}</td><td>—</td><td>—</td><td className="num">{cell(draft.evalPerPoint)}</td><td>—</td></tr>
      </tbody></table></div>
    </Block>
    <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
      {dirty && <Pill tone="yellow">{T.pay.unsaved}</Pill>}
      {err && <span className="small" role="alert" style={{ color: 'var(--r-fg)' }}>{err}</span>}
      {dirty && <button className="btn" onClick={() => { setDraft(pay); setErr(null) }}>{T.pay.reset}</button>}
      <button id="pay-save" className="btn pri right-al" disabled={!dirty && !pay.sample} onClick={save}>{T.pay.save}</button>
    </div>
    <LeaderScoring />
  </>
}

/** CEO chấm 8 tiêu chí năng lực Leader theo tháng (thang 1–10) */
function LeaderScoring() {
  const { s, evals, saveLeaderEval } = useStore()
  const leaders = s.staff.filter(x => x.role === 'leader')
  const [ym, setYm] = useState(ymOf(D.TODAY))
  const [lid0, setLid] = useState(leaders[0]?.id ?? '')
  // danh sách nhân sự có thể tải sau (bản thật / đổi ngày) → luôn trỏ tới một Leader có thật
  const lid = leaders.some(x => x.id === lid0) ? lid0 : leaders[0]?.id ?? ''
  const rec = evalOf(evals, lid, ym), recKey = JSON.stringify(rec?.scores ?? null)
  const [sc, setSc] = useState<(number | null)[]>(rec?.scores ?? Array(EVAL_N).fill(null))
  const [edited, setEdited] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  // đổi Leader/tháng → nạp điểm đã lưu; máy chủ cập nhật (30 giây, realtime) → chỉ nạp lại khi CEO chưa sửa dở
  useEffect(() => { setSc(rec?.scores ?? Array(EVAL_N).fill(null)); setEdited(false); setErr(null) }, [lid, ym]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!edited) setSc(rec?.scores ?? Array(EVAL_N).fill(null)) }, [recKey]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!leaders.length) return <Block title={T.pay.scoreBlock}><Empty>{T.pay.noLeader}</Empty></Block>
  const avg = evalAvg({ leaderId: lid, ym, scores: sc, by: '', at: '' })
  return <Block title={T.pay.scoreBlock} sub={T.pay.scoreSub} right={rec ? <Pill tone="green">{T.pay.scoredBy(rec.by, rec.at)}</Pill> : <Pill>{T.pay.notScored}</Pill>}>
    <div className="grid fgrid">
      <label className="f" htmlFor="ev-month">{T.pay.month}<input id="ev-month" className="inp" type="month" value={ym} max={ymOf(D.TODAY)} onChange={e => /^\d{4}-\d{2}$/.test(e.target.value) && setYm(e.target.value)} /></label>
      {leaders.length > 1 && <label className="f" htmlFor="ev-leader">{T.pay.leader}<select id="ev-leader" className="inp" value={lid} onChange={e => setLid(e.target.value)}>{leaders.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
    </div>
    <div className="card list">{LEADER_EVAL.map((t, i) => <div key={t} className="item"><div className="body"><div className="t">{i + 1}. {t}</div></div>
      <select aria-label={t} className="inp" style={{ width: 84 }} value={sc[i] ?? ''} onChange={e => { const v = e.target.value ? Number(e.target.value) : null; setErr(null); setEdited(true); setSc(x => x.map((y, j) => (j === i ? v : y))) }}>
        <option value="">—</option>{Array.from({ length: 10 }, (_, k) => k + 1).map(k => <option key={k} value={k}>{k}</option>)}</select></div>)}
      <div className="item"><div className="body"><div className="t strong">{T.pay.avg}</div></div><span className="num strong">{avg != null ? `${avg}/10` : '—'}</span></div>
    </div>
    <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
      {err && <span className="small" role="alert" style={{ color: 'var(--r-fg)' }}>{err}</span>}
      <button id="ev-save" className="btn pri right-al" onClick={() => { const e = saveLeaderEval(lid, ym, sc); setErr(e); if (!e) setEdited(false) }}>{T.pay.saveScore}</button>
    </div>
  </Block>
}
