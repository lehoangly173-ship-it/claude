import { ReactNode, useState, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
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
  arrow: 'M5 12h14 M13 6l6 6-6 6', back: 'M19 12H5 M11 18l-6-6 6-6', camera: 'M3 8h4l2-3h6l2 3h4v12H3z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  ops: 'M4 6h16 M4 12h16 M4 18h10', team: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.9',
  qr: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M20 20h1 M17 20h1 M20 17h1', star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  box: 'M21 8 12 3 3 8v8l9 5 9-5z M3 8l9 5 9-5 M12 13v8', gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
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
  if (prev === 0) return <span className="delta up">phát sinh mới</span>
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
// ── Bộ khung theo phong cách Home (video mẫu) ──
export function Hero({ tag, title, sub, children }: { tag: string; title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return <div className="hero"><span className="tag">{tag}</span><h1>{title}</h1>{sub && <p>{sub}</p>}{children && <div className="hrow">{children}</div>}</div>
}
export type Color = 'mint' | 'deep' | 'gold' // xanh nhạt = vừa · xanh đậm = ô số/nhãn nhấn · vàng = quan trọng
export type TileT = { v: ReactNode; l: string; s?: string; tone?: 'warn' | 'ok'; color?: Color; onClick?: () => void }
export function Tiles({ items, soft }: { items: TileT[]; soft?: boolean }) {
  return <div className={`tiles${soft ? ' soft' : ''}`}>{items.map((t, i) => {
    const inner = <><span className="v num">{t.v}</span><span className="l">{t.l}</span>{t.s && <span className="s">{t.s}</span>}</>
    const cls = `tile${t.tone ? ` ${t.tone}-t` : ''}${t.color ? ` ${t.color}` : ''}`
    return t.onClick ? <button key={i} className={cls} onClick={t.onClick}>{inner}</button> : <div key={i} className={cls}>{inner}</div>
  })}</div>
}
/** Máy tính: các nút mẹ/nhóm nút của trang Hôm nay được đưa vào menu bật ra cạnh nút "Hôm nay" ở thanh trái */
export const MenuCtx = createContext<{ host: HTMLElement; close: () => void } | null>(null)
const GroupCtx = createContext<string | null>(null)
function useMenuPortal(content: (close: () => void) => ReactNode) {
  const m = useContext(MenuCtx), g = useContext(GroupCtx)
  if (!m) return null
  return createPortal(<div className="fm-group">{g && <div className="fm-h">{g}</div>}{content(m.close)}</div>, m.host)
}
export function Block({ title, sub, right, children, color }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode; color?: Color }) {
  return <section className="block"><div className={`bh${color ? ` ${color}` : ''}`}><div style={{ minWidth: 0 }}><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{right && <div className="right">{right}</div>}</div><GroupCtx.Provider value={typeof title === 'string' ? title : null}>{children}</GroupCtx.Provider></section>
}
export type NodeT = { no?: ReactNode; t: string; d?: string; badge?: number; alert?: boolean; onClick: () => void }
export function Nodes({ items }: { items: NodeT[] }) {
  const menu = useMenuPortal(close => items.map((n, i) => <button key={i} className={`fm-item${n.alert ? ' alert' : ''}`} onClick={() => { close(); n.onClick() }}>
    <span className="no">{n.no ?? i + 1}</span><span className="t">{n.t}</span>{n.badge ? <span className="badge red">{n.badge}</span> : null}</button>))
  if (menu) return menu
  return <div className="nodes">{items.map((n, i) => <button key={i} className={`node${n.alert ? ' alert' : ''}`} onClick={n.onClick}>
    <span className="no">{n.no ?? i + 1}</span><span className="body"><span className="t" style={{ display: 'block' }}>{n.t}</span>{n.d && <span className="d" style={{ display: 'block' }}>{n.d}</span>}</span>
    {n.badge ? <span className="badge red">{n.badge}</span> : null}<span className="arr"><Icon n="arrow" s={18} /></span></button>)}</div>
}
export function ChipGrid({ items }: { items: { l: string; onClick: () => void; solid?: boolean; badge?: number }[] }) {
  const menu = useMenuPortal(close => items.map(c => <button key={c.l} className={`fm-item${c.solid ? ' solid' : ''}`} onClick={() => { close(); c.onClick() }}>
    <span className="t">{c.l}</span>{c.badge ? <span className="badge red">{c.badge}</span> : null}</button>))
  if (menu) return menu
  return <div className="chipgrid">{items.map(c => <button key={c.l} className={`cbtn${c.solid ? ' solid' : ''}`} onClick={c.onClick}>{c.l}{c.badge ? <span className="badge red">{c.badge}</span> : null}</button>)}</div>
}
export function SubHead({ title, sub, onBack, right }: { title: string; sub?: ReactNode; onBack: () => void; right?: ReactNode }) {
  return <div className="subhead"><button className="back" onClick={onBack}><Icon n="back" />Quay lại</button>
    <div className="row" style={{ alignItems: 'flex-end' }}><div style={{ minWidth: 0, flex: 1 }}><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{right}</div></div>
}
/** Ảnh minh chứng: chọn ảnh thật từ máy/điện thoại (giữ trong phiên chạy thử) */
export function PhotoInput({ value, onChange, label = 'Tải ảnh lên' }: { value: string; onChange: (v: string) => void; label?: string }) {
  return <label className={`photo${value ? ' done' : ''}`}>
    <input type="file" accept="image/*" capture="environment" onChange={e => { const f = e.target.files?.[0]; if (f) onChange(URL.createObjectURL(f)) }} />
    {value ? (value.startsWith('blob:') ? <img src={value} alt="Ảnh đã chọn" /> : <span className="ph-ic">🖼</span>) : <span className="ph-ic"><Icon n="camera" s={20} /></span>}
    <span>{value ? 'Đã có ảnh · bấm để đổi' : label}<span className="tiny muted" style={{ display: 'block', fontWeight: 400 }}>Không chụp được ảnh? Báo quản lý kiểm tra hệ thống.</span></span>
  </label>
}
export const Thumb = ({ src }: { src: string }) => <span className="thumb">{src.startsWith('blob:') ? <img src={src} alt="" /> : '🖼'}</span>
/** Nút chưa nối dữ liệu: vẫn hiện đủ cấu trúc theo sơ đồ để kiểm tra luồng */
export function NodeSpec({ rows }: { rows: { t: string; d: string }[] }) {
  return <div className="col"><div className="note">Mục này đã có <b>cấu trúc theo sơ đồ</b>; số liệu sẽ hiện khi nối dữ liệu thật (Supabase). App không hiển thị số mẫu ở đây.</div>
    <div className="card list">{rows.map(r => <div key={r.t} className="item"><div className="body"><div className="t">{r.t}</div><div className="d">{r.d}</div></div><Pill>Chưa nối</Pill></div>)}</div></div>
}
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
      <div className="col small"><span className="eyebrow">Liên hệ</span><span>SĐT: {user.role === 'reception' || user.role === 'ceo' ? c.phone || '—' : 'ẩn (chỉ lễ tân thấy)'}</span><span>Sinh nhật: {c.dob || '—'}</span><span>Khách từ: {c.firstVisit}</span>{canSeeMoney && <span>Tổng chi: <b className="num">{D.vnd(c.totalPaid)}</b></span>}</div>
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
