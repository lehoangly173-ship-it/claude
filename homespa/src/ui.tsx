import { ReactNode, useState } from 'react'
import { useStore } from './store'
import { Tone, cust } from './logic'
import * as D from './data'

const P: Record<string, string> = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  cal: 'M4 5h16v15H4z M8 3v4 M16 3v4 M4 10h16',
  queue: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 20v-2a4 4 0 0 0-3-3.9 M16 2.1a4 4 0 0 1 0 7.8',
  bed: 'M2 5v15 M2 9h17a3 3 0 0 1 3 3v8 M2 16h20 M6 9v7',
  work: 'M4 7h16v13H4z M9 7V4h6v3 M4 12h16',
  cash: 'M2 6h20v12H2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M6 9v.01 M18 15v.01',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.9 1.9 0 0 0 3.4 0',
  today: 'M9 11l3 3 8-8 M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M19 8v6 M22 11h-6',
  chat: 'M21 12a8 8 0 0 1-11.8 7L3 21l2-6A8 8 0 1 1 21 12z',
  me: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10 M3 22a9 9 0 0 1 18 0',
  check: 'M20 6 9 17l-5-5', plus: 'M12 5v14 M5 12h14', clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M12 6v6l4 2',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10 M9 12l2 2 4-4',
  mega: 'M3 11v3a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1 M16 8a5 5 0 0 1 0 8',
  more: 'M5 12h.01 M12 12h.01 M19 12h.01', chart: 'M3 3v18h18 M7 15l4-4 3 3 5-6',
}
export function Icon({ n, s = 16 }: { n: string; s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n] ?? P.more} /></svg>
}
export const Pill = ({ tone = 'grey', children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) => <span className={`pill t-${tone}${dot ? ' dot' : ''}`}>{children}</span>

export function Stat({ label, value, sub, tone, onClick, extra }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string; onClick?: () => void; extra?: ReactNode }) {
  const style = { ['--tone' as any]: tone ? `var(--${tone})` : undefined }
  const inner = <><span className="l">{label}</span><span className="v num">{value}</span>{sub && <span className="small muted">{sub}</span>}{extra && <span className="row">{extra}</span>}</>
  return onClick ? <button className="card stat" style={style} onClick={onClick}>{inner}</button> : <div className="card stat" style={style}>{inner}</div>
}
/** So sánh kỳ: luôn hiện cả số tuyệt đối lẫn % */
export function Delta({ now, prev, invert, unit = '' }: { now: number; prev: number; invert?: boolean; unit?: string }) {
  const diff = now - prev, pct = D.pctChange(now, prev)
  if (diff === 0) return <span className="delta muted">= kỳ trước</span>
  const good = invert ? diff < 0 : diff > 0
  const abs = unit === 'đ' ? D.vndShort(Math.abs(diff)) : `${Math.abs(diff)}${unit}`
  return <span className={`delta ${good ? 'up' : 'down'}`}>{diff > 0 ? '▲' : '▼'} {diff > 0 ? 'tăng' : 'giảm'} {abs} ({Math.abs(pct)}%)</span>
}
export function PageHeader({ eyebrow, title, sub, right }: { eyebrow?: string; title: string; sub?: ReactNode; right?: ReactNode }) {
  return <div className="ph"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{sub && <p>{sub}</p>}</div>{right && <div className="right">{right}</div>}</div>
}
export function Seg<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { k: T; label: string; badge?: number }[] }) {
  return <div className="seg" role="tablist">{items.map(i => <button key={i.k} role="tab" aria-selected={value === i.k} className={value === i.k ? 'on' : ''} onClick={() => onChange(i.k)}>{i.label}{i.badge ? <span className="badge">{i.badge}</span> : null}</button>)}</div>
}
export function Modal({ title, onClose, children, footer, wide }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  return <div className="overlay" onClick={onClose}><div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
    <div className="mh"><h3>{title}</h3><button className="x" onClick={onClose} aria-label="Đóng">×</button></div>
    <div className="mb">{children}</div>{footer && <div className="mf">{footer}</div>}
  </div></div>
}
export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>
export const Sec = ({ eyebrow, title, right, children }: { eyebrow?: string; title?: string; right?: ReactNode; children: ReactNode }) =>
  <section><div className="sec-title">{eyebrow && <span className="eyebrow">{eyebrow}</span>}{title && <h2>{title}</h2>}{right}</div>{children}</section>
export const Av = ({ name }: { name: string }) => <span className="av">{name.replace('Chị ', '')[0]}</span>

/** Hồ sơ khách — mỗi khách một hồ sơ thật, dùng chung ở mọi màn */
export function CustomerModal({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const { s, addCare, user } = useStore()
  const c = cust(s, customerId)
  const [note, setNote] = useState('')
  const [tab, setTab] = useState<'info' | 'pkg' | 'care'>('info')
  const fb = s.feedback.filter(f => f.customerId === c.id)
  const visits = s.appts.filter(a => a.customerId === c.id && a.status !== 'cancelled')
  const canSeeMoney = user.role !== 'ktv'
  return <Modal title={<>{c.name} <span className="muted small">· mã {c.code}</span></>} onClose={onClose} wide>
    <div className="row">{c.vip && <Pill tone="yellow">VIP</Pill>}<Pill tone="purple">{c.group === 'NN' ? 'Khách nước ngoài' : 'Khách Việt Nam'}</Pill><Pill>Nguồn: {c.source}</Pill><span className="muted small">{c.visits} lượt · lần cuối {c.lastVisitDays === 0 ? 'hôm nay' : `${c.lastVisitDays} ngày trước`}</span></div>
    <Seg value={tab} onChange={setTab} items={[{ k: 'info', label: 'Thông tin' }, { k: 'pkg', label: `Gói liệu trình (${c.packages.length})` }, { k: 'care', label: 'Chăm sóc & phản hồi' }]} />
    {tab === 'info' && <div className="grid g2">
      <div className="col small"><span className="eyebrow">Liên hệ</span><span>SĐT: {user.role === 'ktv' ? 'ẩn với KTV' : c.phone || '—'}</span><span>Sinh nhật: {c.dob || '—'}</span><span>Khách từ: {c.firstVisit}</span>{canSeeMoney && <span>Tổng chi: <b className="num">{D.vnd(c.totalPaid)}</b></span>}</div>
      <div className="col small"><span className="eyebrow">Lưu ý khi phục vụ</span><span>Sức khỏe: {c.health || 'Không có lưu ý'}</span><span>Sở thích: {c.preference || '—'}</span></div>
      <div className="col small" style={{ gridColumn: '1 / -1' }}><span className="eyebrow">Hôm nay</span>{visits.length ? visits.map(a => <span key={a.id}>{D.hhmm(a.start)} · {D.svc(a.serviceId).name} · KTV {D.staffName(a.ktvId)} · {a.bedId}</span>) : <span className="muted">Không có lịch hôm nay</span>}</div>
    </div>}
    {tab === 'pkg' && (c.packages.length ? c.packages.map(p => <div key={p.cardCode} className="card pad col">
      <div className="row"><b>{p.name}</b><Pill tone="brown">{p.cardCode}</Pill><span className="right-al strong num">Còn {D.pkgLeftLabel(p)}</span></div>
      <div className="small muted">Mua {p.buyDate} · hạn {p.expiry} · người chốt {D.staffName(p.closer) !== '—' ? D.staffName(p.closer) : p.closer}{canSeeMoney && ` · giá ${D.vnd(p.finalPrice)} · đã đóng ${D.vnd(D.pkgPaid(p))}`}{canSeeMoney && D.pkgOwed(p) > 0 && <b style={{ color: 'var(--r-fg)' }}> · còn thiếu {D.vnd(D.pkgOwed(p))}</b>}</div>
      {p.usage.slice(0, 4).map((u, i) => <div key={i} className="tiny muted">• {u.at} · {u.service} · KTV {u.ktv} · trừ {u.deducted} ({u.before} → {u.after})</div>)}
    </div>) : <Empty>Khách chưa có gói liệu trình</Empty>)}
    {tab === 'care' && <div className="col">
      <div className="row"><input id="care-note" className="inp" style={{ flex: 1 }} placeholder="Ghi chú chăm sóc (VD: đã gọi hỏi thăm sau buổi 3)" value={note} onChange={e => setNote(e.target.value)} /><button className="btn pri" disabled={!note.trim()} onClick={() => { addCare(c.id, note.trim()); setNote('') }}>Lưu</button></div>
      {fb.map(f => <div key={f.id} className="row small"><Pill tone={f.rating >= 4 ? 'green' : f.rating === 3 ? 'yellow' : 'red'}>{f.rating}/5 · {f.group}</Pill><span>{f.text}</span><span className="muted">{f.daysAgo === 0 ? 'hôm nay' : `${f.daysAgo} ngày trước`} · {f.status}</span></div>)}
      {c.care.length ? c.care.map((x, i) => <div key={i} className="small"><b>{x.at}</b> · {x.by}: {x.text}</div>) : <span className="muted small">Chưa có ghi chú chăm sóc</span>}
    </div>}
  </Modal>
}
