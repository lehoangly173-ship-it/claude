// Biểu đồ dùng chung (không thư viện ngoài): cột, cột ngang, tròn + thanh chọn kỳ ghi rõ ngày.
// Màu lấy từ biến giao diện Home → tự đúng ở chế độ sáng/tối.
import { ReactNode, useState } from 'react'
import * as D from './data'
import { Seg } from './ui'
import { GRANS, Gran, Period, periodRanges, usePeriod, iso, today, Range, MIN_DAY, spanDays } from './period'

export const PALETTE = ['var(--green)', 'var(--gold)', 'var(--b-fg)', 'var(--p-fg)', 'var(--c5)', 'var(--c6)']
export const C_REV = 'var(--green)', C_COST = 'var(--b-fg)', C_PROFIT = 'var(--gold)'

/** Thanh chọn kỳ: Ngày · Tuần · Tháng · Quý · Năm · Tùy chọn — luôn hiện ngày bắt đầu/kết thúc và kỳ so sánh */
export function PeriodBar({ note, compare = true }: { note?: ReactNode; compare?: boolean }) {
  const [p, set] = usePeriod()
  const { cur, prev } = periodRanges(p)
  const t = iso(today())
  return <section className="card pad col pbar">
    <div style={{ overflowX: 'auto' }}><Seg value={p.g} onChange={(g: Gran) => set(g === 'custom' ? { g, from: iso(cur.from), to: iso(cur.to) } : { g })} items={GRANS} /></div>
    {p.g === 'custom' && <div className="grid fgrid">
      <label className="f">Từ ngày<input className="inp" type="date" min={iso(MIN_DAY())} max={t} value={p.from ?? ''} onChange={e => e.target.value && set({ ...p, from: e.target.value })} /></label>
      <label className="f">Đến ngày<input className="inp" type="date" min={iso(MIN_DAY())} max={t} value={p.to ?? ''} onChange={e => e.target.value && set({ ...p, to: e.target.value })} /></label>
    </div>}
    <div className="prange"><span className="eyebrow">{cur.name}</span><b className="num">{cur.label}</b>{cur.partial && <span className="tiny muted">(tính đến hôm nay)</span>}</div>
    {compare && <div className="small muted">So với: <b>{prev.label}</b> · {prev.name}{p.g === 'day' || p.g === 'custom' ? '' : spanDays(prev) === spanDays(cur) ? ' (cùng số ngày)' : ` (kỳ trước chỉ có ${spanDays(prev)} ngày)`}</div>}
    {note && <div className="tiny muted">{note}</div>}
  </section>
}
/** Dòng nhỏ ghi kỳ cho một khối số liệu */
export const RangeTag = ({ r, prefix = '' }: { r: Range; prefix?: string }) => <span className="rtag">📅 {prefix}{r.label}</span>

type Series = { name: string; color: string; values: number[] }
/** Biểu đồ cột (nhóm nhiều chuỗi), hỗ trợ số âm (lỗ) */
export function ColChart({ cats, tips, series, fmt = D.vndShort, height = 170, label }: { cats: string[]; tips?: string[]; series: Series[]; fmt?: (n: number) => string; height?: number; label: string }) {
  const all = series.flatMap(x => x.values)
  const max = Math.max(0, ...all), min = Math.min(0, ...all), span = max - min || 1
  const zero = (max / span) * 100 // % từ đỉnh tới đường 0
  const w = Math.max(18, Math.min(34, 120 / series.length)), dense = cats.length * series.length > 9
  const [sel0, setSel] = useState<number | null>(null), sel = sel0 != null && sel0 < cats.length ? sel0 : cats.length - 1
  return <figure className={`chart${dense ? ' dense' : ''}`} role="img" aria-label={`${label}: ${cats.map((c, i) => `${c} ${series.map(x => `${x.name} ${fmt(x.values[i])}`).join(', ')}`).join('; ')}`}>
    {series.length > 1 && <Legend items={series.map(x => ({ l: x.name, color: x.color }))} />}
    <div className="cc-scroll"><div className="cc" style={{ height, minWidth: cats.length * (series.length * 9 + 12) }}>
      <div className="cc-zero" style={{ top: `${zero}%` }} />
      {cats.map((c, i) => <div key={c + i} className={`cc-col${i === sel ? ' on' : ''}`} title={tips?.[i] ?? c} onClick={() => setSel(i)}>
        <div className="cc-bars">{series.map(x => { const v = x.values[i] ?? 0, h = Math.abs(v) / span * 100
          return <div key={x.name} className="cc-slot" style={{ maxWidth: w }}>
            <i className={`cc-bar${v < 0 ? ' neg' : ''}`} style={{ background: x.color, height: `${h}%`, top: v < 0 ? `${zero}%` : `${zero - h}%` }} />
            <span className="cc-v" style={{ top: v < 0 ? `calc(${zero + h}% + 2px)` : `calc(${zero - h}% - 15px)` }}>{v ? fmt(v) : ''}</span>
          </div> })}</div>
      </div>)}
    </div>
    <div className="cc-x" style={{ marginTop: min < 0 ? 20 : undefined, minWidth: cats.length * (series.length * 9 + 12) }}>{cats.map((c, i) => <span key={c + i} title={tips?.[i]}>{c}</span>)}</div></div>
      {cats.length > 0 && <div className="cc-sel"><b>{tips?.[sel] ?? cats[sel]}</b>{series.map(x => <span key={x.name}><i style={{ background: (x.values[sel] ?? 0) < 0 ? 'var(--r-fg)' : x.color }} />{x.name}: <b className="num">{fmt(x.values[sel] ?? 0)}</b></span>)}</div>}
  </figure>
}
/** Cột ngang: so sánh người/mục với nhau, xếp từ cao xuống thấp */
export function HBars({ rows, fmt = (n: number) => n.toLocaleString('vi-VN'), color = 'var(--green)', label, unit }: { rows: { l: string; v: number; sub?: string }[]; fmt?: (n: number) => string; color?: string; label: string; unit?: string }) {
  const list = [...rows].sort((a, b) => b.v - a.v), max = Math.max(1, ...list.map(r => Math.abs(r.v)))
  return <figure className="chart hb" role="img" aria-label={`${label}: ${list.map(r => `${r.l} ${fmt(r.v)}${unit ?? ''}`).join('; ')}`}>
    {list.map((r, i) => <div key={r.l} className="hb-row">
      <span className="hb-l"><b className="num">{i + 1}</b>{r.l}{r.sub && <span className="tiny muted"> · {r.sub}</span>}</span>
      <span className="hb-track"><i style={{ width: `${Math.max(2, Math.abs(r.v) / max * 100)}%`, background: r.v < 0 ? 'var(--r-fg)' : i === 0 ? 'var(--gold)' : color }} /></span>
      <span className="hb-v num">{fmt(r.v)}{unit ?? ''}</span>
    </div>)}
    {!list.length && <div className="tiny muted">Chưa có dữ liệu trong kỳ</div>}
  </figure>
}
/** Biểu đồ tròn: cơ cấu một tổng (tối đa 6 phần, phần nhỏ gộp "Khác") */
export function Donut({ parts, fmt = D.vndShort, label, center }: { parts: { l: string; v: number }[]; fmt?: (n: number) => string; label: string; center?: string }) {
  const pos = parts.filter(p => p.v > 0).sort((a, b) => b.v - a.v)
  const list = pos.length > 6 ? [...pos.slice(0, 5), { l: 'Các mục còn lại', v: pos.slice(5).reduce((t, p) => t + p.v, 0) }] : pos
  const total = list.reduce((t, p) => t + p.v, 0)
  const R = 15.915, C = 2 * Math.PI * R
  let acc = 0
  return <figure className="chart dn" role="img" aria-label={`${label}: ${list.map(p => `${p.l} ${fmt(p.v)} (${total ? Math.round(p.v / total * 100) : 0}%)`).join('; ')}`}>
    <div className="dn-wrap"><svg viewBox="0 0 42 42" className="dn-svg" aria-hidden="true">
      <circle cx="21" cy="21" r={R} fill="none" stroke="var(--line-2)" strokeWidth="6" />
      {total > 0 && list.map((p, i) => { const len = p.v / total * C, el = <circle key={p.l} cx="21" cy="21" r={R} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="6" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 21 21)" />; acc += len; return el })}
    </svg><div className="dn-c"><b className="num">{center ?? fmt(total)}</b><span className="tiny muted">tổng</span></div></div>
    <ul className="dn-leg">{list.map((p, i) => <li key={p.l}><i style={{ background: PALETTE[i % PALETTE.length] }} /><span className="dn-l">{p.l}</span><b className="num">{fmt(p.v)}</b><span className="num muted">{total ? Math.round(p.v / total * 100) : 0}%</span></li>)}
      {!list.length && <li className="tiny muted">Chưa có dữ liệu trong kỳ</li>}</ul>
  </figure>
}
export function Legend({ items }: { items: { l: string; color: string }[] }) {
  return <div className="lg">{items.map(x => <span key={x.l}><i style={{ background: x.color }} />{x.l}</span>)}</div>
}
export type { Period }
