// Cây nút mẹ → con → cháu: chạm/rê chuột vào nút mẹ là xổ nút con ngay (chưa cần bấm mở trang).
// Trang nút cháu: bảng số liệu mẫu tự dựng theo cột "chắt" trong tài liệu + Mộc phân tích (giả lập).
import { ReactNode, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import * as D from './data'
import { MenuCtx, Icon, Pill, SubHead, Seg, Block } from './ui'
import { useStore } from './store'
import type { SpecRow } from './specs'

export type Kid = { no?: string; l: string; onClick: () => void }
export type TreeItem = { no?: ReactNode; t: string; d?: string; badge?: number; alert?: boolean; onClick: () => void; kids: Kid[] }

export function TreeNodes({ items }: { items: TreeItem[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const m = useContext(MenuCtx)
  if (m) return createPortal(<div className="fm-group">{items.map((n, i) => <div key={i}>
    <button className={`fm-item${n.alert ? ' alert' : ''}`} onMouseEnter={() => setOpen(i)} onClick={() => { m.close(); n.onClick() }}><span className="no">{n.no ?? i + 1}</span><span className="t">{n.t}</span>{n.badge ? <span className="badge red">{n.badge}</span> : null}</button>
    {open === i && n.kids.map(k => <button key={k.l} className="fm-item fm-kid" onClick={() => { m.close(); k.onClick() }}><span className="t">{k.no ? `${k.no} · ` : ''}{k.l}</span></button>)}
  </div>)}</div>, m.host)
  return <div className="nodes tree">{items.map((n, i) => { const on = open === i
    return <div key={i} className={`tnode${on ? ' on' : ''}`} onPointerEnter={e => { if (e.pointerType === 'mouse') setOpen(i) }} onPointerLeave={e => { if (e.pointerType === 'mouse') setOpen(o => (o === i ? null : o)) }}>
      <div className={`node${n.alert ? ' alert' : ''}`}>
        <button className="thead" aria-expanded={on} onClick={() => (on ? n.onClick() : setOpen(i))}>
          <span className="no">{n.no ?? i + 1}</span><span className="body"><span className="t" style={{ display: 'block' }}>{n.t}</span>{n.d && <span className="d" style={{ display: 'block' }}>{n.d}</span>}</span>
        </button>
        {n.badge ? <span className="badge red">{n.badge}</span> : null}
        <button className="arr tgo" aria-label={`Mở ${n.t}`} onClick={n.onClick}><Icon n="arrow" s={18} /></button>
      </div>
      {on && n.kids.length > 0 && <div className="tkids">{n.kids.map(k => <button key={k.l} className="tkid" onClick={k.onClick}>{k.no && <b>{k.no}</b>}{k.l}</button>)}</div>}
    </div> })}</div>
}

// ── Phân tích dòng tài liệu: "cháu · cháu → chắt · chắt → thao tác" ──
export const parts = (r: SpecRow) => r.d.split(' → ')
export const chau = (r: SpecRow) => { const l = (parts(r)[0] ?? '').split(' · ').map(x => x.trim()).filter(Boolean); const pre = /^(Theo|Khách|Chi phí|Số) /.exec(l[0] ?? '')?.[1]
  return l.map((x, i) => (i && pre && /^[a-zà-ỹđ]/.test(x) && x.split(' ').length <= 3 ? `${pre} ${x}` : x[0].toUpperCase() + x.slice(1))) }
const cols = (r: SpecRow) => (parts(r)[1] ?? 'Kết quả · Mục tiêu · Trạng thái').split(' · ').map(x => x.trim()).filter(Boolean).slice(0, 6)
const acts = (r: SpecRow) => (parts(r)[2] ?? '').split(' · ').map(x => x.trim()).filter(Boolean)

const h = (str: string) => { let x = 7; for (const c of str) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x }
// ── Dữ liệu cho nút cháu: lấy thực thể THẬT trong app (nhân viên, khách, chiến dịch, nguồn, dự án, kho, tháng)
//    rồi tính chỉ số theo cột chắt → số khớp với tổng quan; mục tiêu/kỳ trước là số liệu mẫu suy ra từ số thật.
type Ent = { l: string; v: number; rev: number; cost: number; budget?: number; owner: string; ch: string; note: string; rate?: number; prev?: number; target?: number; date?: string }
type St = ReturnType<typeof useStore>['s']
export function entities(s: St, ctx: string): { kind: string; rows: Ent[] } {
  const c = ctx.toLowerCase(), leader = D.STAFF.find(x => x.role === 'leader')?.name ?? 'Leader', mkt = D.STAFF.find(x => x.role === 'marketing')?.name ?? 'Marketing'
  const inv = s.invoices.filter(i => i.status !== 'Đã xóa' && i.status !== 'Nháp')
  if (/kết quả & năng lực/.test(c)) { const mine = s.programs.filter(p => D.staffName(p.ownerId) === mkt)
    return { kind: 'Tuần', rows: ['Tuần 37', 'Tuần 38', 'Tuần 39', 'Tuần 40 (này)'].map((l, i) => { const k = i === 3 ? 1 : 0.7 + (h(l) % 40) / 100
      return { l, v: Math.round(mine.reduce((t, p) => t + p.booked, 0) * k), rev: Math.round(mine.reduce((t, p) => t + p.revenue, 0) * k / 1e4) * 1e4, cost: Math.round(mine.reduce((t, p) => t + p.cost, 0) * k / 1e4) * 1e4, owner: mkt, ch: mine.map(p => p.type).join(', ') || '—', note: i === 3 ? 'Tuần hiện tại — số từ chiến dịch đang chạy' : 'Tuần trước (số liệu mẫu)', rate: Math.round(70 + (h(l) % 30)) } }) } }
  if (/thiết bị|bảo dưỡng|sửa chữa/.test(c)) { const reqs = s.opsReqs.filter(r => r.kind === 'Thiết bị')
    return { kind: 'Thiết bị', rows: [...reqs.map(r => ({ l: r.title, v: r.status === 'Đã duyệt' ? 1 : 0, rev: 0, cost: r.cost, owner: D.staffName(r.by), ch: r.status, note: `${r.from ?? ''}${r.to ? ` → ${r.to}` : ''} · ${r.status}`, rate: r.status === 'Đã duyệt' ? 100 : 30, date: r.to })), ...['Điều hòa phòng 2', 'Máy giặt khăn', 'Bồn ngâm chân tầng 3'].map((l, i) => ({ l, v: 1, rev: 0, cost: [450000, 0, 120000][i], owner: D.STAFF.find(y => y.role === 'leader')?.name ?? '', ch: 'Bảo dưỡng định kỳ', note: ['Vệ sinh lưới lọc mỗi tháng', 'Hoạt động tốt', 'Thay gioăng chống rò'][i], rate: [80, 100, 60][i] }))] } }
  if (/sự cố|khiếu nại|tình huống/.test(c)) {
    const fb = s.feedback.filter(f => f.rating <= 3).map(f => ({ l: `${s.customers.find(x => x.id === f.customerId)?.name ?? 'Khách'} · ${f.group}`, v: f.rating, rev: 0, cost: 0, owner: D.staffName(f.handlerId) || 'Chưa giao', ch: 'Phản hồi khách', note: f.text, rate: f.status === 'đã xử lý' ? 100 : f.status === 'đang xử lý' ? 50 : 0, target: 4 }))
    const tk = s.tasks.filter(t => t.earlyReport).map(t => ({ l: t.title, v: t.status === 'done' ? 1 : 0, rev: 0, cost: 0, owner: D.staffName(t.ownerId), ch: 'Sự cố vận hành', note: t.detail, rate: t.status === 'done' ? 100 : 40, target: 1 }))
    return { kind: 'Sự việc', rows: [...tk, ...fb].slice(0, 7) } }
  if (/vệ sinh|dọn|không gian/.test(c))
    return { kind: 'Khu vực', rows: D.ZONES.slice(0, 8).map(z => { const r = [...s.cleanReports].reverse().find(x => x.zone === z.no); return { l: `Khu ${z.no} · ${z.name}`, v: r?.status === 'Đạt' ? 1 : 0, rev: 0, cost: 0, owner: D.staffName(s.zoneOwner[z.no]), ch: z.no <= 6 ? 'Ca sáng' : 'Ca chiều', note: r ? `${r.status}${r.note ? ` — ${r.note}` : ''}` : 'Chưa gửi ảnh', rate: r?.status === 'Đạt' ? 100 : r ? 50 : 0, target: 1, date: r ? D.hhmm(r.at) : 'chưa báo' } }) }
  if (/chiến dịch|quảng cáo|nội dung|bài|video|truyền thông|ngân sách mkt|roi|chương trình/.test(c) && s.programs.length)
    return { kind: 'Chiến dịch', rows: s.programs.map(p => ({ l: p.name, v: p.booked, rev: p.revenue, cost: p.cost, budget: p.budget, owner: D.staffName(p.ownerId), ch: p.type, note: `${p.reached} người tiếp cận → ${p.booked} đặt lịch → ${p.arrived} đến`, rate: p.reached ? Math.round(p.arrived / p.reached * 100) : 0 })) }
  if (/nguồn|kênh|hành trình|phân nhóm/.test(c)) {
    const m: Record<string, D.Customer[]> = {}; s.customers.forEach(x => (m[x.source] ??= []).push(x))
    return { kind: 'Nguồn khách', rows: Object.entries(m).sort((a, b) => b[1].length - a[1].length).slice(0, 6).map(([k, l]) => ({ l: k, v: l.length, rev: l.reduce((t, x) => t + x.totalPaid, 0), cost: 0, owner: mkt, ch: k, note: `${l.filter(x => x.visits <= 1).length} khách mới · ${l.filter(x => x.packages.length).length} có liệu trình`, rate: Math.round(l.filter(x => x.visits > 1).length / l.length * 100) })) }
  }
  if (/khách|vip|tái tục|giới thiệu|phản hồi|cskh|giữ chân|trải nghiệm/.test(c))
    return { kind: 'Khách', rows: [...s.customers].sort((a, b) => b.totalPaid - a.totalPaid).slice(0, 6).map(x => { const p = x.packages[0]
      return { l: x.name, v: x.visits, rev: x.totalPaid, cost: 0, owner: x.care[0]?.by ?? D.STAFF.find(y => y.role === 'reception')?.name ?? '', ch: x.source, note: p ? `${p.cardCode}: còn ${D.pkgLeftLabel(p)}${D.pkgOwed(p) ? `, thiếu ${D.vndShort(D.pkgOwed(p))}` : ''}` : x.lastVisitDays > 30 ? `${x.lastVisitDays} ngày chưa quay lại — nên nhắn` : 'Khách lẻ, mời thử liệu trình', rate: Math.min(100, x.visits * 12), date: x.lastVisitDays ? `${x.lastVisitDays} ngày trước` : 'hôm nay' } }) }
  if (/dự án|sáng kiến|mục tiêu|kế hoạch|điểm nghẽn|chiến lược/.test(c) && s.initiatives.length)
    return { kind: 'Dự án', rows: s.initiatives.map(i => ({ l: i.title, v: i.progress, rev: 0, cost: i.approvedBudget ?? i.budget, budget: i.budget, owner: D.staffName(i.ownerId), ch: i.kind, note: `Trước: ${i.before}${i.after ? ` → sau: ${i.after}` : ''}`, rate: i.progress, date: i.dueLabel })) }
  if (/vật tư|tồn kho|nhập kho|(^|\s)kho(\s|$)|hàng hóa|nhà cung cấp/.test(c))
    return { kind: 'Mặt hàng', rows: D.STOCK_ITEMS.map(it => { const q = s.stockMoves.filter(m => m.item === it.id && !m.status).reduce((t, m) => t + (['Nhập', 'Hoàn trả', 'Kiểm kê'].includes(m.kind) ? m.qty : m.kind === 'Đề xuất mua' ? 0 : -m.qty), it.start)
      return { l: it.name, v: q, rev: s.stockMoves.filter(m => m.item === it.id && m.kind === 'Bán').reduce((t, m) => t + (m.price ?? 0) * m.qty, 0), cost: q * it.cost, owner: D.STAFF.find(y => y.role === 'reception')?.name ?? '', ch: it.unit, note: q < it.warn ? `Dưới ngưỡng — đề xuất mua ${it.keep - q} ${it.unit}` : 'Đủ hàng', rate: Math.round(q / it.keep * 100), target: it.keep } }) }
  if (/tài chính|tiền|chi phí|doanh thu|quỹ|lợi nhuận|dòng tiền|thuế|công nợ|lương|ngân sách/.test(c)) {
    const today = inv.reduce((t, i) => t + i.paid, 0) || 2500000, exp = s.expenses.reduce((t, e) => t + e.amount, 0)
    return { kind: 'Tháng', rows: ['Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10 (đến nay)'].map((l, i) => { const k = 0.85 + (h(l) % 30) / 100, days = i === 3 ? D.TODAY.getDate() : 30
      const rev = Math.round(today * days * k / 1e5) * 1e5, cost = Math.round((i === 3 ? exp : exp * k * 1.1) / 1e5) * 1e5
      return { l, v: Math.round(days * 9 * k), rev, cost, owner: D.STAFF.find(y => y.role === 'ceo')?.name ?? 'CEO', ch: 'Tiền mặt · CK · thẻ', note: rev > cost ? 'Dòng tiền dương' : 'Chi vượt thu — xem lại chi phí', rate: rev ? Math.round((rev - cost) / rev * 100) : 0 } }) }
  }
  if (/nhân sự|ktv|nhân viên|lễ tân|đội|tuyển|đào tạo|kpi|công suất|chất lượng|vệ sinh/.test(c))
    return { kind: 'Nhân sự', rows: s.staff.filter(x => x.role === 'ktv' || x.role === 'reception').slice(0, 7).map(x => { const ap = s.appts.filter(a => a.ktvId === x.id && !['cancelled', 'no_show'].includes(a.status)), fb = s.feedback.filter(f => f.ktvId === x.id)
      const rev = inv.reduce((t, i) => t + i.lines.filter(l => l.ktvId === x.id).reduce((y, l) => y + l.price - l.discount, 0), 0), pts = s.points.filter(p => p.staffId === x.id && p.status === 'Đã duyệt').reduce((t, p) => t + p.delta, 0)
      return { l: `${x.name} · ${x.role === 'ktv' ? 'KTV' : 'Lễ tân'}`, v: x.role === 'ktv' ? ap.length : inv.filter(i => i.creator === x.name).length, rev, cost: 0, owner: leader, ch: x.shift === 1 ? 'Ca sáng' : 'Ca chiều', note: fb.length ? `Khách chấm ${(fb.reduce((t, f) => t + f.rating, 0) / fb.length).toFixed(1)}/5` : `${pts} điểm uy tín`, rate: Math.min(100, Math.round(ap.length / 6 * 100)) } }) }
  const gran = /theo (ngày|tuần|tháng|quý|năm)/.exec(c)?.[1]
  if (gran || /tăng trưởng|suy giảm/.test(c)) { const n = s.appts.filter(a => !['cancelled', 'no_show'].includes(a.status)).length || 20, cash = s.invoices.reduce((t, x) => t + x.paid, 0) || 2500000
    const g = gran ?? 'tuần', mul = { ngày: 1, tuần: 6.5, tháng: 27, quý: 80, năm: 320 }[g as 'ngày']
    const now = new Date(D.TODAY), lab = (i: number) => { const d = new Date(now)
      if (g === 'ngày') { d.setDate(d.getDate() - i); return i ? D.dateShort(d).slice(0, 5) : 'Hôm nay' }
      if (g === 'tuần') return i ? `${i} tuần trước` : 'Tuần này'
      if (g === 'tháng') { d.setMonth(d.getMonth() - i); return i ? `Tháng ${d.getMonth() + 1}` : 'Tháng này' }
      if (g === 'quý') { const q = Math.floor(now.getMonth() / 3) - i; return i ? `Quý ${((q % 4) + 4) % 4 + 1}${q < 0 ? '/' + (now.getFullYear() - 1) : ''}` : 'Quý này' }
      return i ? String(now.getFullYear() - i) : 'Năm nay' }
    return { kind: g[0].toUpperCase() + g.slice(1), rows: [0, 1, 2, 3].map(i => { const k = i ? 0.82 + (h(g + i) % 30) / 100 : 1, kp = 0.82 + (h(g + (i + 1)) % 30) / 100
      return { l: lab(i), v: Math.round(n * mul * k), prev: Math.round(n * mul * kp), rev: Math.round(cash * mul * k / 1e5) * 1e5, cost: 0, owner: '', ch: '', note: i ? 'Ước theo nhịp hiện tại (số liệu mẫu)' : 'Số thật đến hiện tại', rate: 0 } }) } }
  const by = (r: D.Role) => s.staff.filter(x => x.role === r).length
  return { kind: 'Bộ phận', rows: [
    { l: 'Lễ tân', v: inv.length, rev: inv.reduce((t, i) => t + i.paid, 0), cost: 0, owner: leader, ch: `${by('reception')} người`, note: `${s.tasks.filter(t => ['open', 'doing'].includes(t.status) && s.staff.find(x => x.id === t.ownerId)?.role === 'reception').length} việc tồn` },
    { l: 'Kĩ thuật viên', v: s.appts.filter(a => ['done', 'paid'].includes(a.status)).length, rev: 0, cost: 0, owner: leader, ch: `${by('ktv')} người`, note: `${s.cleanReports.filter(r => r.status === 'Chưa đạt').length} khu cần làm lại` },
    { l: 'Leader', v: s.tasks.filter(t => t.status === 'done').length, rev: 0, cost: 0, owner: D.STAFF.find(y => y.role === 'ceo')?.name ?? '', ch: `${by('leader')} người`, note: `${s.tasks.filter(t => t.earlyReport && ['open', 'doing'].includes(t.status)).length} sự cố chưa đóng` },
    { l: 'Marketing', v: s.programs.filter(p => p.status === 'Đang chạy').length, rev: s.programs.reduce((t, p) => t + p.revenue, 0), cost: s.programs.reduce((t, p) => t + p.cost, 0), owner: D.STAFF.find(y => y.role === 'ceo')?.name ?? '', ch: `${by('marketing')} người`, note: `${s.programs.reduce((t, p) => t + p.booked, 0)} lượt đặt từ chiến dịch` },
  ].map(e => ({ ...e, rate: e.v ? 60 + (h(e.l) % 35) : 0 })) }
}
const pct = (n: number) => `${n}%`
export function cell(col: string, e: Ent): { v: string; n?: number; pill?: string } {
  const c = col.toLowerCase(), target = e.target ?? Math.max(1, Math.ceil(e.v * 1.15) + 1), prev = e.prev ?? Math.round(e.v * (0.8 + (h(e.l) % 30) / 100))
  const ok = e.v >= target * 0.9, d = e.v - prev
  if (/lợi nhuận|lãi/.test(c)) return { v: D.vndShort(e.rev - e.cost), n: e.rev - e.cost }
  if (/chi phí|chi |chi$|giá vốn/.test(c)) return { v: D.vndShort(e.cost), n: e.cost }
  if (/ngân sách|quỹ/.test(c)) return { v: D.vndShort(e.budget ?? e.cost), n: e.budget ?? e.cost }
  if (/tiền|doanh thu|thu|giá trị|số dư|công nợ|lương|thuế|thu nhập/.test(c)) return { v: D.vndShort(e.rev), n: e.rev }
  if (/tỷ lệ|tỉ lệ|%|hoàn thành|chuyển đổi|hiệu quả|công suất/.test(c)) return { v: pct(e.rate ?? 0), n: e.rate ?? 0 }
  if (/mục tiêu|kế hoạch|định mức/.test(c)) return { v: String(target), n: target }
  if (/kỳ trước|trước/.test(c)) return { v: String(prev), n: prev }
  if (/chênh lệch|xu hướng|tăng|giảm|thay đổi/.test(c)) return { v: `${d >= 0 ? '↑' : '↓'} ${Math.abs(d)}${prev ? ` (${Math.round(Math.abs(d) / prev * 100)}%)` : ''}`, n: d }
  if (/người|phụ trách|giao|chủ trì|xử lý|duyệt/.test(c)) return { v: e.owner || '—' }
  if (/hạn|ngày|thời gian|lịch|kỳ|lần cuối/.test(c)) return { v: e.date ?? D.daysAhead((h(e.l + col) % 14) + 1) }
  if (/trạng thái|tiến độ|kết quả|tình trạng|đánh giá/.test(c)) { const st = ok ? 'Đạt' : e.v >= target * 0.6 ? 'Đang làm' : 'Cần xử lý'; return { v: st, pill: st } }
  if (/cảnh báo|mức|ưu tiên|rủi ro|ảnh hưởng/.test(c)) { const lv = ok ? 'Thấp' : e.v >= target * 0.6 ? 'Vừa' : 'Cao'; return { v: lv, pill: lv === 'Thấp' ? 'Đạt' : lv === 'Vừa' ? 'Đang làm' : 'Cần xử lý' } }
  if (/kênh|nguồn|loại|nhóm/.test(c)) return { v: e.ch }
  if (/nguyên nhân|lý do|ghi chú|nội dung|vấn đề|đề xuất|phương án|bằng chứng|nhận xét|mô tả|bài học|hành động|việc/.test(c)) return { v: e.note }
  return { v: String(e.v), n: e.v }
}
/** Trang nút con: nút cháu (xổ sẵn) + phần màn thật nếu có */
export function ConPage({ row, base, back, custom }: { row: SpecRow; base: string; back: () => void; custom?: ReactNode }) {
  const { go } = useStore()
  const ks = chau(row)
  return <>
    <SubHead title={`${row.no}. ${row.t}`} sub={`Nút cháu: ${ks.join(' · ')}`} onBack={back} />
    {custom}
    <div className="nodes">{ks.map((k, i) => <button key={k} className="node" onClick={() => go(`${base}/${row.no}/${i}`)}>
      <span className="no">{row.no}.{i + 1}</span><span className="body"><span className="t" style={{ display: 'block' }}>{k}</span><span className="d" style={{ display: 'block' }}>{cols(row).join(' · ')}</span></span><span className="arr"><Icon n="arrow" s={18} /></span></button>)}</div>
  </>
}

/** Màn thật liên quan (CEO bấm để mở dữ liệu gốc) */
const LINKS: [RegExp, string, string][] = [
  [/khách|vip|tái tục|giới thiệu|phản hồi/i, 'cust/all', 'Danh sách khách & phản hồi'],
  [/chiến dịch|quảng cáo|nội dung|ngân sách/i, 'cust/n6', 'Chiến dịch Marketing'],
  [/duyệt|phê duyệt/i, 'moc', 'Phê duyệt'],
  [/nhân sự|nhân viên|ktv|lễ tân/i, 'me/n10', 'Nhân viên'],
  [/vận hành|ca|tour|giường/i, 'home/ops', 'Trung tâm vận hành'],
  [/vật tư|kho|sản phẩm/i, 'home/products', 'Đối chiếu sản phẩm'],
  [/vệ sinh|dọn/i, 'home/cleaning', 'Checklist dọn dẹp'],
]
/** Trang nút cháu: danh sách lấy từ dữ liệu app + chỉ số theo cột chắt + Mộc phân tích (giả lập) + thao tác cuối */
export function ChauPage({ row, idx, base, ctx }: { row: SpecRow; idx: number; base: string; ctx: string }) {
  const { s, go, user } = useStore()
  const [done, setDone] = useState<string[]>([])
  const ks = chau(row), k = ks[idx] ?? ks[0], cs = cols(row)
  const ents = entities(s, `${k} ${row.t} ${ctx}`)
  const data = ents.rows.map(e => ({ l: e.l, c: cs.map(c => cell(c, e)) }))
  const link = user.role === 'ceo' ? LINKS.find(([re]) => re.test(`${k} ${row.t}`)) : undefined
  const ni = cs.findIndex((_, j) => data.filter(r => r.c[j].n !== undefined).length > 1)
  const sorted = ni >= 0 ? [...data].sort((a, b) => (b.c[ni].n ?? 0) - (a.c[ni].n ?? 0)) : []
  return <>
    <SubHead title={`${row.no}.${idx + 1} · ${k}`} sub={`${row.t} · theo ${ents.kind.toLowerCase()}`} onBack={() => go(`${base}/${row.no}`)} />
    {ks.length > 1 && <div style={{ overflowX: 'auto' }}><Seg value={String(idx)} onChange={v => go(`${base}/${row.no}/${v}`)} items={ks.map((x, j) => ({ k: String(j), label: x }))} /></div>}
    <Block title={k} sub={`Chi tiết khi mở: ${cs.join(' · ')}`} right={<Pill tone="yellow">Dữ liệu app + {D.SAMPLE_NOTE}</Pill>}>
      <div className="tbl-wrap"><table><thead><tr><th>{ents.kind}</th>{cs.map(c => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{data.map(r => <tr key={r.l}><td className="strong">{r.l}</td>{r.c.map((x, j) => <td key={j} className={x.n !== undefined ? 'num' : 'small'}>{x.pill ? <Pill tone={x.pill === 'Đạt' ? 'green' : x.pill === 'Cần xử lý' ? 'red' : 'yellow'}>{x.v}</Pill> : x.v}</td>)}</tr>)}</tbody></table></div>
      <div className="tiny muted">Danh sách và số hiện tại lấy từ dữ liệu trong app (cập nhật ngay khi có thay đổi); mục tiêu, kỳ trước, các tháng cũ là {D.SAMPLE_NOTE} suy ra từ số hiện tại.</div>
    </Block>
    {link && <button className="softbtn wide" onClick={() => go(link[1])}>Mở màn liên quan: {link[2]}</button>}
    {sorted.length > 1 && <div className="note"><b>🌿 Mộc phân tích (giả lập — Chưa nối AI thật):</b> {sorted[0].l} cao nhất về "{cs[ni]}" ({sorted[0].c[ni].v}); {sorted[sorted.length - 1].l} thấp nhất ({sorted[sorted.length - 1].c[ni].v}) — nên xem nguyên nhân trước khi quyết định.</div>}
    {acts(row).length > 0 && <Block title="Thao tác"><div className="row">{acts(row).map(a0 => a0[0].toUpperCase() + a0.slice(1)).map(a => <button key={a} className={`btn${done.includes(a) ? '' : ' pri'}`} disabled={done.includes(a)} onClick={() => setDone([...done, a])}>{done.includes(a) ? `✓ ${a}` : a}</button>)}</div>
      {done.length > 0 && <div className="tiny muted">Đã ghi thao tác trong bản chạy thử (chưa lưu máy chủ).</div>}</Block>}
  </>
}

/** Hàng nút con của một nút mẹ → TreeItem.kids */
export const kidsOf = (rows: SpecRow[], base: string, go: (p: string) => void): Kid[] => rows.map(r => ({ no: r.no, l: r.t, onClick: () => go(`${base}/${r.no}`) }))
