// FIX LẦN 4 (chị Quyên, 17/10): Thu nhập minh bạch (chi tiết từng hàng + Tổng kết 2 năm) · Hiệu suất có mũi tên so tháng trước + Tổng kết
// Mọi con số lấy từ một nguồn: period.ts (staffDays/staffMetrics/metrics) + hoa hồng sale gói lễ tân nhập (logic.commissionsOf).
// Quy tắc tính tiền chưa chốt (tiền tour, lương Leader/Marketing) → "Chưa nối", không tự đặt số.
import { ReactNode, useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { commissionsOf, usedPkgValue, debtSummary } from '../logic'
import { staffDays, staffMetrics, payslip, PAY_RULE, rangeOf, today, metrics, showRate, waitAvg, periodRanges, usePeriod, FIXED_CATS } from '../period'
import { SubHead, Block, Pill, Empty, Tiles, Seg, MonthArrow, Icon } from '../ui'
import { ColChart, Donut } from '../charts'
import { useMemo } from 'react'
/** Số theo kỳ chung (giống usePeriodMetrics ở timeDash — để tránh import vòng) */
function usePeriodMetricsLite() { const { s } = useStore(), [p] = usePeriod(); return useMemo(() => { const { cur } = periodRanges(p); return { cur, m: metrics(s, cur) } }, [s, p]) }

const CN = <Pill>Chưa nối</Pill>
const money = (n: number) => <span className="num strong">{D.vnd(n)}</span>
const ymOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const monthRange = (ym: string) => { const [y, m] = ym.split('-').map(Number); return rangeOf('month', new Date(y, m - 1, 1)) }
const lastMonths = (n: number) => { const t = today(); return Array.from({ length: n }, (_, i) => rangeOf('month', new Date(t.getFullYear(), t.getMonth() - (n - 1 - i), 1))) }
const short = (name: string) => name.replace(/^Tháng (\d+)\/\d{2}(\d{2})$/, 'T$1/$2')

/** Một hàng có nút "Xem chi tiết" xổ danh sách bên dưới (minh bạch vì sao ra con số) */
function Row({ t, v, open, onToggle, children, sub }: { t: ReactNode; v: ReactNode; open?: boolean; onToggle?: () => void; children?: ReactNode; sub?: ReactNode }) {
  return <>
    <div className="item"><div className="body"><div className="t">{t}</div>{sub && <div className="d">{sub}</div>}</div>{v}
      {onToggle && <button className="link small" aria-expanded={!!open} onClick={onToggle}>{open ? 'Ẩn chi tiết' : 'Xem chi tiết'}</button>}</div>
    {open && <div className="item"><div className="body col" style={{ gap: 4 }}>{children}</div></div>}
  </>
}
const dl = (d: Date) => D.dateShort(d)

/** Lương + hoa hồng sale gói của một người trong một tháng — dùng chung cho bảng tháng và Tổng kết */
function monthPay(s: ReturnType<typeof useStore>['s'], id: string, role: 'ktv' | 'reception', r: { from: Date; to: Date }) {
  const sm = staffMetrics(s, r, role).find(x => x.id === id)
  const com = commissionsOf(s, id, r), comSum = com.reduce((t, e) => t + e.x.amount, 0)
  return sm ? { sm, com, ps: payslip(sm, comSum) } : null
}

// ═══════════════ 2. THU NHẬP CỦA TÔI (KTV · Lễ tân; Leader/Marketing: chờ CEO cài bảng lương) ═══════════════
export function Income({ back }: { back: () => void }) {
  const { s, me } = useStore()
  const t = today(), [ym, setYm] = useState(ymOf(t))
  const r = monthRange(ym)
  const role = me.role === 'reception' ? 'reception' : 'ktv'
  const payroll = me.role === 'ktv' || me.role === 'reception'
  const mp = payroll ? monthPay(s, me.id, role, r) : null
  const days = payroll ? staffDays(s, r, me.id, role) : []
  const [open, setOpen] = useState<string | null>(null)
  const tog = (k: string) => () => setOpen(open === k ? null : k)
  return <>
    <SubHead title="Thu nhập của tôi" sub={<>Chỉ bạn và CEO xem · <span className="rtag">📅 {r.label}</span></>} onBack={back} />
    <label className="f" style={{ maxWidth: 220 }}>Chọn tháng<input className="inp" type="month" value={ym} max={ymOf(t)} onChange={e => e.target.value && setYm(e.target.value)} /></label>
    {!mp ? <Empty>Bảng lương {D.ROLE_LABEL[me.role]}: Chưa nối — chờ CEO cài công thức (⑨ Dòng tiền & lương)</Empty> : (() => { const { sm, com, ps } = mp
      const worked = days.filter(d => d.worked), off = days.filter(d => d.leave), late = days.filter(d => d.late), pts = days.filter(d => d.points)
      return <>
        <Tiles items={[{ v: D.vndShort(ps.total), l: 'Tổng lương thưởng tôi nhận', s: 'chưa gồm tiền tour (Chưa nối)', color: 'deep' }, { v: `${sm.days}/${PAY_RULE.stdDays}`, l: 'Ngày công' }, { v: sm.leave, l: 'Ngày nghỉ', s: 'nghỉ phép đã duyệt' }, { v: sm.late, l: 'Lần đi muộn' }]} />
        <div className="card list">
          <Row t="Lương cơ bản" v={<span className="num strong">{D.vnd(ps.base)}/tháng</span>} />
          <Row t={`Công thực tế (${sm.days}/${PAY_RULE.stdDays} công)`} v={money(ps.byDays)} open={open === 'work'} onToggle={tog('work')}>
            {worked.length ? worked.map(d => <span key={+d.d} className="small">{dl(d.d)} · đi làm{d.late ? ` · trễ ${d.lateMin ?? ''} phút` : ''}{d.real ? '' : ` · ${D.SAMPLE_NOTE}`}</span>) : <span className="small muted">Chưa có ngày công trong tháng</span>}
          </Row>
          <Row t="Ngày nghỉ" v={<span className="num strong">{sm.leave} ngày</span>} open={open === 'off'} onToggle={tog('off')}>
            {off.length ? off.map(d => <span key={+d.d} className="small">{dl(d.d)} · nghỉ{d.real ? ' phép đã duyệt' : ` · ${D.SAMPLE_NOTE}`}</span>) : <span className="small muted">Không nghỉ ngày nào</span>}
          </Row>
          {role === 'ktv' && <Row t="Tiền tour của tôi" sub={`${sm.tours} tour trong tháng · mức tiền/tour chờ CEO cài`} v={CN} open={open === 'tour'} onToggle={tog('tour')}>
            {worked.filter(d => d.tours).map(d => <span key={+d.d} className="small">{dl(d.d)} · {d.tours} tour{d.requested ? ` · ${d.requested} khách yêu cầu` : ''}{d.real ? '' : ` · ${D.SAMPLE_NOTE}`}</span>)}
            {!worked.some(d => d.tours) && <span className="small muted">Chưa có tour trong tháng</span>}
          </Row>}
          <Row t="Hoa hồng sale gói" sub="Lễ tân nhập khi bán gói (người chốt chính / người hỗ trợ)" v={money(ps.commission)} open={open === 'com'} onToggle={tog('com')}>
            {com.length ? com.map(e => <span key={e.p.cardCode + e.x.role} className="small">{e.x.date} · gói {e.p.cardCode} ({e.p.name}) · khách {e.c.code} · {e.x.role} · <b>{D.vnd(e.x.amount)}</b> · {e.x.by} nhập</span>) : <span className="small muted">Chưa có hoa hồng sale gói trong tháng</span>}
          </Row>
          <Row t={`Thưởng (${Math.max(0, sm.points)} điểm uy tín × ${D.vndShort(PAY_RULE.perPoint)})`} v={money(ps.bonus)} open={open === 'pt'} onToggle={tog('pt')}>
            {pts.length ? pts.map(d => <span key={+d.d} className="small">{dl(d.d)} · {d.points > 0 ? '+' : ''}{d.points} điểm{d.real ? '' : ` · ${D.SAMPLE_NOTE}`}</span>) : <span className="small muted">Chưa có điểm uy tín trong tháng</span>}
            {s.points.filter(p => p.staffId === me.id && p.status === 'Đã duyệt').map(p => <span key={p.id} className="tiny muted">Hôm nay: {p.delta > 0 ? '+' : ''}{p.delta} · {p.reason}</span>)}
          </Row>
          <Row t={`Phạt (${sm.late} lần đi muộn × ${D.vndShort(PAY_RULE.perLate)})`} v={<span className="num strong" style={{ color: ps.penalty ? 'var(--r-fg)' : undefined }}>−{D.vnd(ps.penalty)}</span>} open={open === 'late'} onToggle={tog('late')}>
            {late.length ? late.map(d => <span key={+d.d} className="small">{dl(d.d)} · đi muộn {d.lateMin ?? ''} phút{d.real ? '' : ` · ${D.SAMPLE_NOTE}`}</span>) : <span className="small muted">Không đi muộn lần nào</span>}
          </Row>
          <Row t="Tổng lương thưởng tôi nhận" sub="= công thực tế + hoa hồng sale gói + thưởng − phạt (chưa gồm tiền tour)" v={<span className="num strong" style={{ color: 'var(--g-fg)', fontSize: 16 }}>{D.vnd(ps.total)}</span>} />
        </div>
        <div className="tiny muted">{D.SAMPLE_NOTE}: lương cơ bản, thưởng/phạt là công thức tạm; tiền tour Chưa nối. Hôm nay lấy từ chấm công, lịch, điểm thật trong app; các ngày trước là {D.SAMPLE_NOTE}. Hoa hồng sale gói là số lễ tân nhập thật.</div>
      </> })()}
    <IncomeSummary />
  </>
}

/** TỔNG KẾT: quá trình lương 1–2 năm (biểu đồ cột) + ngày nghỉ, hoa hồng, thưởng, phạt từng tháng */
export function IncomeSummary() {
  const { s, me } = useStore()
  const [n, setN] = useState<12 | 24>(12)
  const payroll = me.role === 'ktv' || me.role === 'reception', role = me.role === 'reception' ? 'reception' : 'ktv'
  const ms = useMemo(() => (payroll ? lastMonths(n).map(r => ({ r, p: monthPay(s, me.id, role, r) })) : []), [s, me.id, role, n, payroll])
  if (!payroll) return <Block title="Tổng kết" sub="Quá trình lương 2 năm">{CN}<div className="tiny muted">Bảng lương {D.ROLE_LABEL[me.role]} chờ CEO cài — khi có sẽ hiện biểu đồ ở đây.</div></Block>
  const rows = ms.filter(x => x.p && (x.p.sm.days || x.p.sm.leave || x.p.ps.commission))
  return <Block title="Tổng kết" sub={`Quá trình lương ${n === 12 ? '1 năm' : '2 năm'} · nhìn lại để thấy mình tiến bộ hay đi xuống`} right={<Seg value={String(n)} onChange={v => setN(+v as 12 | 24)} items={[{ k: '12', label: '1 năm' }, { k: '24', label: '2 năm' }]} />}>
    <ColChart label="Tổng lương thưởng" cats={ms.map(x => short(x.r.name) + (x.r.partial ? '*' : ''))} tips={ms.map(x => x.r.label)} series={[{ name: 'Tổng lương thưởng', color: 'var(--green)', values: ms.map(x => x.p?.ps.total ?? 0) }, { name: 'Hoa hồng + thưởng', color: 'var(--gold)', values: ms.map(x => (x.p?.ps.commission ?? 0) + (x.p?.ps.bonus ?? 0)) }]} />
    <div className="tbl-wrap"><table><thead><tr><th>Tháng</th><th>Ngày công</th><th>Ngày nghỉ</th>{role === 'ktv' && <th>Tour</th>}<th>Hoa hồng gói</th><th>Thưởng</th><th>Phạt</th><th>Tổng</th></tr></thead>
      <tbody>{[...rows].reverse().map(({ r, p }) => <tr key={r.name}><td className="strong">{r.name}{r.partial ? ' *' : ''}</td><td className="num">{p!.sm.days}</td><td className="num">{p!.sm.leave}</td>{role === 'ktv' && <td className="num">{p!.sm.tours}</td>}<td className="num">{D.vndShort(p!.ps.commission)}</td><td className="num">{D.vndShort(p!.ps.bonus)}</td><td className="num">−{D.vndShort(p!.ps.penalty)}</td><td className="num strong">{D.vndShort(p!.ps.total)}</td></tr>)}</tbody></table></div>
    {!rows.length && <Empty>Chưa có dữ liệu lương các tháng trước</Empty>}
    <div className="tiny muted">* tháng hiện tại, tính đến hôm nay. Các tháng trước: {D.DEMO ? D.SAMPLE_NOTE : 'Chưa nối (chờ dữ liệu máy chủ)'} · chưa gồm tiền tour.</div>
  </Block>
}

// ═══════════════ 3. HIỆU SUẤT: mũi tên so với tháng trước + TỔNG KẾT 1–2 năm ═══════════════
type Rg = { from: Date; to: Date }
type PerfKey = 'tours' | 'requested' | 'days' | 'late' | 'points' | 'rating' | 'pkgNew' | 'pkgRenew' | 'pkgAll' | 'newCust' | 'bookings' | 'showRate' | 'returning' | 'guests' | 'waitAvg' | 'teamLate'
type PerfMetric = { k: PerfKey; l: string; invert?: boolean; unit?: string }
const fbDate = (daysAgo: number) => { const d = new Date(D.TODAY); d.setDate(d.getDate() - daysAgo); return d }
const inR = (d: Date, r: Rg) => +new Date(d.getFullYear(), d.getMonth(), d.getDate()) >= +r.from && +new Date(d.getFullYear(), d.getMonth(), d.getDate()) <= +r.to
const vnToDate = (vn: string) => { const [d, m, y] = vn.split('/').map(Number); return new Date(y, m - 1, d) }

/** Chỉ số theo tháng của một người (một nguồn: staffDays · gói · phản hồi · metrics) */
export function perfValue(s: ReturnType<typeof useStore>['s'], id: string, role: D.Role, k: PerfKey, r: Rg): number | null {
  const sr = role === 'reception' ? 'reception' : 'ktv'
  const name = s.staff.find(x => x.id === id)?.name ?? ''
  const mine = () => s.customers.flatMap(c => c.packages).filter(p => ((p.closerIds ?? []).includes(id) || p.closer === name) && inR(vnToDate(p.buyDate), r))
  switch (k) {
    case 'tours': case 'requested': case 'days': case 'late': case 'points': {
      const m = staffMetrics(s, r, sr).find(x => x.id === id); return m ? m[k] : null }
    case 'rating': { const f = s.feedback.filter(x => x.ktvId === id && inR(fbDate(x.daysAgo ?? 0), r)); return f.length ? Math.round(f.reduce((t, x) => t + x.rating, 0) / f.length * 10) / 10 : null }
    case 'pkgAll': return mine().length
    case 'pkgNew': return mine().filter(p => !p.renewalOf).length
    case 'pkgRenew': return mine().filter(p => p.renewalOf).length
    case 'newCust': case 'bookings': case 'returning': case 'guests': { const m = metrics(s, r); return m[k] }
    case 'showRate': return showRate(metrics(s, r))
    case 'waitAvg': return waitAvg(metrics(s, r))
    case 'teamLate': return [...staffMetrics(s, r, 'ktv'), ...staffMetrics(s, r, 'reception')].reduce((t, x) => t + x.late, 0)
  }
}
export function perfMetrics(role: D.Role): PerfMetric[] {
  if (role === 'ktv') return [{ k: 'tours', l: 'Số lượt khách phục vụ' }, { k: 'requested', l: 'Số khách yêu cầu' }, { k: 'rating', l: 'Điểm TB khách đánh giá', unit: '/5' }, { k: 'pkgAll', l: 'Gói đã chốt (best sale)' }, { k: 'days', l: 'Ngày công' }, { k: 'late', l: 'Số lần đi muộn', invert: true }, { k: 'points', l: 'Điểm uy tín' }]
  if (role === 'reception') return [{ k: 'tours', l: 'Hóa đơn đã lập' }, { k: 'pkgAll', l: 'Gói đã chốt (best sale)' }, { k: 'days', l: 'Ngày công' }, { k: 'late', l: 'Số lần đi muộn', invert: true }, { k: 'points', l: 'Điểm uy tín' }]
  if (role === 'marketing') return [{ k: 'newCust', l: 'Khách mới' }, { k: 'bookings', l: 'Lượt đặt lịch' }, { k: 'showRate', l: 'Tỉ lệ khách đến', unit: '%' }, { k: 'returning', l: 'Khách quay lại' }]
  return [{ k: 'guests', l: 'Khách đã phục vụ' }, { k: 'returning', l: 'Khách quay lại' }, { k: 'showRate', l: 'Tỉ lệ khách đến', unit: '%' }, { k: 'waitAvg', l: 'Thời gian chờ TB', unit: ' phút', invert: true }, { k: 'teamLate', l: 'Lượt đi muộn của đội', invert: true }]
}
/** Tháng này (đến hôm nay) và cùng số ngày của tháng trước — so công bằng */
export function monthPair() {
  const t = today(), cur = { from: new Date(t.getFullYear(), t.getMonth(), 1), to: t }
  const pFrom = new Date(t.getFullYear(), t.getMonth() - 1, 1), pEnd = new Date(t.getFullYear(), t.getMonth(), 0)
  const prev = { from: pFrom, to: new Date(pFrom.getFullYear(), pFrom.getMonth(), Math.min(t.getDate(), pEnd.getDate())) }
  return { cur, prev }
}
/** Bảng "So với tháng trước" + TỔNG KẾT biểu đồ cột 1–2 năm — dùng cho KTV, Lễ tân, Marketing, Leader */
export function PerfTrend({ id, role }: { id: string; role: D.Role }) {
  const { s } = useStore()
  const ms = perfMetrics(role), { cur, prev } = monthPair()
  const [k, setK] = useState<PerfKey>(ms[0].k), [n, setN] = useState<12 | 24>(12)
  const m = ms.find(x => x.k === k) ?? ms[0]
  const months = useMemo(() => lastMonths(n), [n]), vals = useMemo(() => months.map(r => perfValue(s, id, role, m.k, r) ?? 0), [s, id, role, m.k, months])
  return <>
    <Block title="So với tháng trước" sub={`Tháng này đến hôm nay ${D.dateShort()} · so với cùng số ngày tháng trước`}>
      <div className="card list">{ms.map(x => { const a = perfValue(s, id, role, x.k, cur), b = perfValue(s, id, role, x.k, prev)
        return <div key={x.k} className="item"><div className="body"><div className="t">{x.l}</div><div className="d"><MonthArrow now={a} prev={b} invert={x.invert} unit={x.unit} />{a != null && b == null && 'chưa có số tháng trước'}</div></div>{a == null ? CN : <span className="num strong">{a}{x.unit ?? ''}</span>}</div> })}</div>
    </Block>
    <Block title="Tổng kết" sub={`So sánh ${n === 12 ? '1 năm' : '2 năm'} theo tháng`} right={<Seg value={String(n)} onChange={v => setN(+v as 12 | 24)} items={[{ k: '12', label: '1 năm' }, { k: '24', label: '2 năm' }]} />}>
      <div style={{ overflowX: 'auto' }}><Seg value={m.k} onChange={v => setK(v as PerfKey)} items={ms.map(x => ({ k: x.k, label: x.l }))} /></div>
      <ColChart label={m.l} fmt={v => `${v}${m.unit ?? ''}`} cats={months.map(r => short(r.name) + (r.partial ? '*' : ''))} tips={months.map(r => r.label)} series={[{ name: m.l, color: m.invert ? 'var(--b-fg)' : 'var(--green)', values: vals }]} />
      <div className="tiny muted">* tháng hiện tại, tính đến hôm nay. {m.invert ? 'Cột thấp hơn là tốt hơn. ' : ''}Các tháng trước: {D.DEMO ? D.SAMPLE_NOTE : 'Chưa nối (chờ dữ liệu máy chủ)'}.</div>
    </Block>
  </>
}
/** Dòng "Tháng này · mũi tên" đặt dưới từng hạng mục hiệu suất (khớp tên hạng mục) */
const ROW_KEY: Record<string, PerfKey> = { 'Số khách yêu cầu': 'requested', 'Số lượt KH phục vụ': 'tours', 'Điểm TB khách đánh giá': 'rating', 'Best saler, tỉ suất % sale': 'pkgAll', 'KH mới mua liệu trình': 'pkgNew', 'KH cũ tái tục liệu trình': 'pkgRenew', 'Ý thức đúng giờ': 'late', 'Chuyên cần': 'days' }
export function RowTrend({ id, role, title }: { id: string; role: D.Role; title: string }) {
  const { s } = useStore()
  const k = ROW_KEY[title]; if (!k) return null
  const { cur, prev } = monthPair(), a = perfValue(s, id, role, k, cur), b = perfValue(s, id, role, k, prev)
  if (a == null) return null
  const label = k === 'late' ? 'lần đi muộn' : k === 'days' ? 'ngày công' : k === 'rating' ? 'điểm TB' : ''
  return <div className="d">Tháng này: <b>{a}{k === 'rating' ? '/5' : ''}</b>{label ? ` ${label}` : ''} · <MonthArrow now={a} prev={b} invert={k === 'late'} /></div>
}

// ═══════════════ 6. LEADER — VẬN HÀNH / TIỀN VÀO / DOANH THU / LỢI NHUẬN (gộp ③ Vận hành, ④ Chi tổng, ⑤ Tiền thu – DT – LN) ═══════════════
export const MONEY_KIDS = ['Tiền vào · doanh thu thực tế · công nợ gói', 'Chi phí: sản phẩm · duy trì · khác', 'Lợi nhuận (tổng · trên 1 khách)', 'Lợi nhuận theo nhóm khách · nguồn khách · KTV']
export function LeaderMoney({ idx, back, Dash, Staff, Expenses, prodToday }: { idx?: string; back: () => void; Dash: () => ReactNode; Staff: () => ReactNode; Expenses: () => ReactNode; prodToday: { name: string; unit: string; qty: number; cost: number }[] }) {
  const { s } = useStore()
  const p = usePeriodMetricsLite(), { m, cur } = p
  const g = m.guests, per = (v: number | null) => (v == null ? '—' : g ? D.vnd(Math.round(v / g)) : '—')
  const used = usedPkgValue(s, cur), real = m.lePart + m.prodPart + used.value
  const d = debtSummary(s), debtHome = d.depositDebt + d.fullValue
  const salary = m.byCat['Lương cơ sở'] ?? 0, keep = m.costFixed + salary, other = m.costOther - salary, allCost = m.costProd + m.costFixed + m.costOther
  const fixedParts = [...FIXED_CATS.map(c => ({ l: c, v: m.byCat[c] ?? 0 })), { l: 'Lương cơ sở', v: salary }].filter(x => x.v)
  const share = m.revenue ? allCost / m.revenue : 0
  const groups: [string, number][] = [['Khách lẻ', m.lePart], ['Liệu trình', m.pkgPart], ['Bán sản phẩm', m.prodPart]]
  const bySrc = Object.entries(m.bySource).filter(x => x[1]).sort((a, b) => b[1] - a[1])
  const open = Number(idx ?? 0)
  const row = (l: ReactNode, total: number | null, note?: string, strong?: boolean) => <tr><td className={strong ? 'strong' : ''}>{l}{note && <div className="tiny muted">{note}</div>}</td><td className="num strong">{total == null ? 'Chưa nối' : D.vnd(total)}</td><td className="num">{per(total)}</td></tr>
  return <>
    <SubHead title="③ Vận hành · Tiền vào · Doanh thu · Lợi nhuận" sub="Một chỗ cho mọi con số tiền của Home theo kỳ — không trùng lặp: tiền thu vào → doanh thu thực tế → công nợ → chi phí → lợi nhuận, cho tổng khách và trên 1 khách" onBack={back} />
    {Dash()}
    <Block title="Bảng tổng hợp theo kỳ" sub={<><span className="rtag">📅 {cur.label}</span> · {g} khách có hóa đơn</>} color={open === 0 ? 'mint' : undefined}>
      <div className="tbl-wrap"><table><thead><tr><th>Hạng mục</th><th>Tổng</th><th>Trên 1 khách</th></tr></thead><tbody>
        {row('Tổng tiền thu vào', m.revenue, 'Tiền thật đã thu: dịch vụ lẻ + bán/đóng gói + bán sản phẩm', true)}
        {row('Doanh thu thực tế', real, `Dịch vụ lẻ + sản phẩm + giá trị ${used.sessions} buổi gói đã làm (định giá như Công nợ) — ngày trước chưa có lịch sử trừ thẻ: Chưa nối`)}
        {row('Công nợ gói (Home còn nợ khách)', debtHome, `Tính đến hôm nay · ${d.sessionsOwed} buổi còn nợ · khách còn thiếu ${D.vndShort(d.depositMissing)}`)}
        {row('Chi phí sản phẩm', m.costProd, 'Vật tư dùng cho khách (dầu, cao, khăn, dầu gội…)')}
        {row('Phí duy trì', keep, 'Điện · nước · mặt bằng · rác + wifi · lương cơ sở (lễ tân nhập ở Chi tiêu)')}
        {row('Chi khác', other, 'Quảng cáo, hàng hóa, giá vốn hàng bán…')}
        {row('Tổng chi phí', allCost, undefined, true)}
        {row('Lợi nhuận (trên tiền thu vào)', m.revenue - allCost, 'Tiền thu vào − tổng chi phí', true)}
        {row('Lợi nhuận (trên doanh thu thực tế)', real - allCost, 'Doanh thu thực tế − tổng chi phí')}
      </tbody></table></div>
      <div className="tiny muted">Chi phí chưa gồm đủ lương nhân sự (Chưa nối) — chỉ có khoản lễ tân đã nhập. Các ngày trước: {D.DEMO ? D.SAMPLE_NOTE : 'Chưa nối'}.</div>
    </Block>
    <Block title="Chi phí theo hạng mục" sub={cur.label} color={open === 1 ? 'mint' : undefined}>
      <Tiles items={[{ v: D.vndShort(m.costProd), l: 'Chi phí sản phẩm', s: `${per(m.costProd)} / khách` }, { v: D.vndShort(keep), l: 'Phí duy trì', s: `${per(keep)} / khách` }, { v: D.vndShort(other), l: 'Chi khác', s: `${per(other)} / khách` }]} />
      <div className="grid g2">{fixedParts.length > 0 && <Donut label="Phí duy trì" parts={fixedParts} />}{prodToday.some(x => x.cost > 0) && <Donut label="Vật tư hôm nay" parts={prodToday.filter(x => x.cost > 0).map(x => ({ l: x.name, v: x.cost }))} />}</div>
      {prodToday.some(x => x.qty > 0) && <div className="card list">{prodToday.filter(x => x.qty > 0).map(x => <div key={x.name} className="item"><div className="body"><div className="t">{x.name}</div><div className="d">Xuất hôm nay {x.qty.toLocaleString('vi-VN')} {x.unit}</div></div><span className="num strong">{D.vnd(x.cost)}</span></div>)}</div>}
      {Expenses()}
    </Block>
    <Block title="Lợi nhuận theo nhóm khách · nguồn khách" sub={`${cur.label} · chi phí chiếm ${m.revenue ? Math.round(share * 100) : 0}% tiền thu, phân bổ theo tỉ lệ tiền thu`} color={open >= 2 ? 'mint' : undefined}>
      <div className="tbl-wrap"><table><thead><tr><th>Nhóm</th><th>Tiền thu</th><th>Lợi nhuận ≈</th></tr></thead><tbody>
        {groups.map(([k, v]) => <tr key={k}><td className="strong">{k}</td><td className="num">{D.vnd(v)}</td><td className="num">{D.vnd(Math.round(v * (1 - share)))}</td></tr>)}
        {bySrc.map(([k, v]) => <tr key={k}><td>Nguồn: {k}</td><td className="num">{D.vnd(v)}</td><td className="num">{D.vnd(Math.round(v * (1 - share)))}</td></tr>)}
      </tbody></table></div>
      {!bySrc.length && <Empty>Chưa có tiền thu trong kỳ</Empty>}
    </Block>
    {Staff()}
  </>
}

// ═══════════════ 7. LEADER — CỦA TÔI: bảng lương + ĐÁNH GIÁ NĂNG LỰC LEADER (8 nút con) ═══════════════
export const LEADER_EVAL = ['Lập kế hoạch & giao việc', 'Điều phối & kiểm soát vận hành', 'Đào tạo & phát triển nhân sự', 'Chất lượng dịch vụ & chăm sóc khách hàng', 'Kết quả kinh doanh của đội', 'Kiểm soát chi phí, kho & công nợ', 'Trách nhiệm & giải quyết vấn đề', 'Công bằng, gắn kết & xây dựng người kế cận']
type EvalRow = { t: string; v: ReactNode | null; trend?: ReactNode }
/** Chỉ số từ dữ liệu app cho từng tiêu chí — Leader không nhập lại; điểm chấm do CEO (Chưa nối) */
export function evalRows(s: ReturnType<typeof useStore>['s'], meId: string, i: number): EvalRow[] {
  const { cur, prev } = monthPair(), mc = metrics(s, cur), mp = metrics(s, prev)
  const arrow = (a: number | null, b: number | null, invert?: boolean, unit?: string) => <MonthArrow now={a} prev={b} invert={invert} unit={unit} />
  const given = s.tasks.filter(t => t.createdBy === meId && t.ownerId !== meId), givenDone = given.filter(t => t.status === 'done')
  const myIni = s.initiatives.filter(x => x.ownerId === meId)
  const fbAll = s.feedback, fbBad = fbAll.filter(f => f.rating <= 3)
  const cr = s.cleanReports.filter(r => r.status !== 'Chờ kiểm tra')
  const inc = s.tasks.filter(t => t.earlyReport), incDone = inc.filter(t => t.status === 'done' && t.startedMin != null && t.doneMin != null)
  const loads = D.ktvs().map(k => s.appts.filter(a => a.ktvId === k.id && !['cancelled', 'no_show'].includes(a.status)).length)
  const debt = debtSummary(s)
  const rate = (a: number, b: number) => (b ? `${a}/${b} (${Math.round(a / b * 100)}%)` : null)
  switch (i) {
    case 0: return [{ t: 'Việc đã giao cho nhân sự', v: given.length || null }, { t: 'Việc giao đã hoàn thành', v: rate(givenDone.length, given.length) }, { t: 'Việc giao còn mở', v: given.filter(t => ['open', 'doing'].includes(t.status)).length }, { t: 'Sáng kiến / dự án đang phụ trách', v: myIni.length }, { t: 'Kế hoạch tuần gửi chị', v: s.reports.filter(r => r.fromId === meId).length }]
    case 1: return [{ t: 'Tỉ lệ khách đến (tháng này)', v: showRate(mc) != null ? `${showRate(mc)}%` : null, trend: arrow(showRate(mc), showRate(mp), false, '%') }, { t: 'Thời gian chờ TB (tháng này)', v: waitAvg(mc) != null ? `${waitAvg(mc)} phút` : null, trend: arrow(waitAvg(mc), waitAvg(mp), true, ' phút') }, { t: 'Khách đang chờ quá 10 phút', v: s.queue.filter(q => s.now - q.arrival > 10).length }, { t: 'Đề xuất vận hành chờ duyệt', v: s.opsReqs.filter(r => r.status === 'Chờ duyệt').length }]
    case 2: return [{ t: 'SOP / quy trình đang áp dụng', v: D.SOPS.length }, { t: 'Khóa học, bài test, kết quả đào tạo', v: null }, { t: 'Nhân sự được kèm cặp trong tháng', v: null }]
    case 3: { const avg = (f: typeof fbAll) => (f.length ? Math.round(f.reduce((t, x) => t + x.rating, 0) / f.length * 10) / 10 : null)
      return [{ t: 'Điểm TB khách đánh giá', v: avg(fbAll) != null ? `${avg(fbAll)}/5` : null }, { t: 'Phản hồi xấu đã xử lý', v: rate(fbBad.filter(f => f.status === 'đã xử lý').length, fbBad.length) }, { t: 'Khu dọn dẹp đạt chuẩn', v: rate(cr.filter(r => r.status === 'Đạt').length, cr.length) }, { t: 'Lượt CSKH thành công', v: s.customers.reduce((t, c) => t + c.care.filter(x => x.kind && x.ok).length, 0) }] }
    case 4: return [{ t: 'Khách đã phục vụ (tháng này)', v: mc.guests, trend: arrow(mc.guests, mp.guests) }, { t: 'Khách quay lại (tháng này)', v: mc.returning, trend: arrow(mc.returning, mp.returning) }, { t: 'Khách mới (tháng này)', v: mc.newCust, trend: arrow(mc.newCust, mp.newCust) }, { t: 'Tiền thu vào (tháng này)', v: D.vnd(mc.revenue), trend: arrow(Math.round(mc.revenue / 1e5) / 10, Math.round(mp.revenue / 1e5) / 10, false, 'tr') }]
    case 5: return [{ t: 'Chi phí trên 1 khách (tháng này)', v: mc.guests ? D.vnd(Math.round((mc.costProd + mc.costFixed + mc.costOther) / mc.guests)) : null }, { t: 'Phiếu kho chờ duyệt', v: s.stockMoves.filter(m => m.status === 'Chờ duyệt').length }, { t: 'Đối chiếu sản phẩm chưa khớp', v: s.productLogs.filter(p => !(p.ktvOk && p.recOk)).length }, { t: 'Buổi spa Home còn nợ khách', v: debt.sessionsOwed }]
    case 6: return [{ t: 'Sự cố được báo sớm', v: inc.length }, { t: 'Sự cố đã xử lý', v: rate(inc.filter(t => t.status === 'done').length, inc.length) }, { t: 'Thời gian xử lý TB', v: incDone.length ? `${Math.round(incDone.reduce((t, x) => t + (x.doneMin! - x.startedMin!), 0) / incDone.length)} phút` : null }, { t: 'Đề xuất / báo cáo đã gửi chị', v: s.approvals.filter(a => a.fromId === meId).length }]
    default: return [{ t: 'Chênh lệch số tour giữa KTV hôm nay', v: loads.length ? `${Math.max(...loads) - Math.min(...loads)} tour` : null }, { t: 'Điểm uy tín đã duyệt cho nhân sự', v: s.points.filter(p => p.status === 'Đã duyệt' && p.by === meId).length }, { t: 'Đơn nghỉ / đổi ca chờ xử lý', v: s.leaves.filter(l => l.status === 'Chờ duyệt').length }, { t: 'Người kế cận đang bồi dưỡng', v: null }]
  }
}
export function LeaderEval({ sub, back }: { sub?: string; back: () => void }) {
  const { s, me, go } = useStore()
  const i = sub != null ? Number(sub) : NaN
  if (Number.isInteger(i) && LEADER_EVAL[i]) return <>
    <SubHead title={`${i + 1}. ${LEADER_EVAL[i]}`} sub="Chỉ số tự lấy từ dữ liệu app · điểm chấm do CEO (thang điểm chờ chị chốt)" onBack={() => go('me/eval')} />
    <div className="card list">{evalRows(s, me.id, i).map(r => <div key={r.t} className="item"><div className="body"><div className="t">{r.t}</div>{r.trend && <div className="d">{r.trend}</div>}</div>{r.v == null ? CN : <span className="num strong">{r.v}</span>}</div>)}
      <div className="item"><div className="body"><div className="t">Điểm CEO chấm cho tiêu chí này</div><div className="d">Thang điểm & trọng số chờ chị Quyên chốt</div></div>{CN}</div></div>
  </>
  return <>
    <SubHead title="Đánh giá năng lực Leader" sub="8 tiêu chí · chạm từng mục để xem chỉ số chi tiết" onBack={back} />
    <div className="nodes">{LEADER_EVAL.map((t, j) => { const rows = evalRows(s, me.id, j), known = rows.filter(r => r.v != null).length
      return <button key={t} className="node" onClick={() => go(`me/eval/${j}`)}><span className="no">{j + 1}</span><span className="body"><span className="t" style={{ display: 'block' }}>{t}</span><span className="d" style={{ display: 'block' }}>{rows.slice(0, 2).map(r => `${r.t}: ${r.v == null ? 'Chưa nối' : typeof r.v === 'string' || typeof r.v === 'number' ? r.v : '…'}`).join(' · ')} · {known}/{rows.length} chỉ số có dữ liệu</span></span><span className="arr"><Icon n="arrow" s={18} /></span></button> })}</div>
    <PerfTrend id={me.id} role="leader" />
  </>
}
export function LeaderSalary({ back }: { back: () => void }) {
  const { s, me } = useStore()
  const at = s.attendance[me.id]
  const [open, setOpen] = useState(false)
  return <>
    <SubHead title="Bảng lương của tôi" sub="Leader · chỉ bạn và CEO xem · công thức chờ CEO cài (⑨ Dòng tiền & lương)" onBack={back} />
    <div className="card list">
      <Row t="Lương cơ bản" v={CN} />
      <Row t="Ngày công" sub={at?.in != null ? `Hôm nay đã chấm công ${D.hhmm(at.in)}` : 'Hôm nay chưa chấm công'} v={CN} open={open} onToggle={() => setOpen(!open)}>
        <span className="small">{D.dateShort()} · {at?.in != null ? `vào ${D.hhmm(at.in)}${at.out != null ? ` · ra ${D.hhmm(at.out)}` : ''}` : 'chưa chấm công'}</span><span className="small muted">Các ngày trước: Chưa nối</span>
      </Row>
      <Row t="Thưởng theo kết quả đội & năng lực (8 tiêu chí)" v={CN} />
      <Row t="Hoa hồng sale gói" sub="Nếu Leader chốt gói — lễ tân nhập khi bán" v={money(commissionsOf(s, me.id, monthPair().cur).reduce((t, e) => t + e.x.amount, 0))} />
      <Row t="Phạt" v={CN} />
      <Row t="Tổng lương thưởng" v={CN} />
    </div>
    <IncomeSummary />
  </>
}
