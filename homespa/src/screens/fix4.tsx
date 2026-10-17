// FIX LẦN 4 (chị Quyên, 17/10): Thu nhập minh bạch (chi tiết từng hàng + Tổng kết 2 năm) · Hiệu suất có mũi tên so tháng trước + Tổng kết
// Mọi con số lấy từ một nguồn: period.ts (staffDays/staffMetrics/metrics) + hoa hồng sale gói lễ tân nhập (logic.commissionsOf).
// Quy tắc tính tiền chưa chốt (tiền tour, lương Leader/Marketing) → "Chưa nối", không tự đặt số.
import { ReactNode, useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { commissionsOf, usedPkgValue, debtSummary } from '../logic'
import { staffDays, staffMetrics, rangeOf, today, metrics, showRate, waitAvg, periodRanges, usePeriod, FIXED_CATS } from '../period'
import { SubHead, Block, Pill, Empty, Tiles, Seg, MonthArrow, Icon } from '../ui'
import { ColChart, Donut } from '../charts'
import { useMemo } from 'react'
import { f4, T } from '../i18n'
import { payslip, otOfDay, evalAvg, evalOf, isPayRole, SHIFT_ROLES, ymOf, EVAL_N, type PayConfig, type PayRole, type LeaderEvalRec } from '../pay'
/** Số theo kỳ chung (giống usePeriodMetrics ở timeDash — để tránh import vòng) */
function usePeriodMetricsLite() { const { s } = useStore(), [p] = usePeriod(); return useMemo(() => { const { cur } = periodRanges(p); return { cur, m: metrics(s, cur) } }, [s, p]) }

const CN = <Pill>{f4('Chưa nối')}</Pill>
const money = (n: number) => <span className="num strong">{D.vnd(n)}</span>
const monthRange = (ym: string) => { const [y, m] = ym.split('-').map(Number); return rangeOf('month', new Date(y, m - 1, 1)) }
const lastMonths = (n: number) => { const t = today(); return Array.from({ length: n }, (_, i) => rangeOf('month', new Date(t.getFullYear(), t.getMonth() - (n - 1 - i), 1))) }
const short = (name: string) => name.replace(/^Tháng (\d+)\/\d{2}(\d{2})$/, 'T$1/$2')

/** Một hàng có nút "Xem chi tiết" xổ danh sách bên dưới (minh bạch vì sao ra con số) */
function Row({ t, v, open, onToggle, children, sub }: { t: ReactNode; v: ReactNode; open?: boolean; onToggle?: () => void; children?: ReactNode; sub?: ReactNode }) {
  return <>
    <div className="item"><div className="body"><div className="t">{t}</div>{sub && <div className="d">{sub}</div>}</div>{v}
      {onToggle && <button className="link small" aria-expanded={!!open} onClick={onToggle}>{open ? 'Ẩn chi tiết' : f4('Xem chi tiết')}</button>}</div>
    {open && <div className="item"><div className="body col" style={{ gap: 4 }}>{children}</div></div>}
  </>
}
const dl = (d: Date) => D.dateShort(d)

/** Phiếu lương một người trong một kỳ — đơn giá từ Bảng cài đặt lương CEO (pay.ts), số liệu từ period.ts (một nguồn) */
type St = ReturnType<typeof useStore>['s']
export function monthPay(s: St, pay: PayConfig, evals: LeaderEvalRec[], id: string, role: PayRole, r: { from: Date; to: Date }) {
  const sm = staffMetrics(s, r, role).find(x => x.id === id); if (!sm) return null
  const days = staffDays(s, r, id, role)
  const otMin = days.reduce((t, d) => t + otOfDay(pay, role, d), 0)
  const com = commissionsOf(s, id, r), comSum = com.reduce((t, e) => t + e.x.amount, 0)
  const ev = role === 'leader' ? evalAvg(evalOf(evals, id, ymOf(r.from))) : null
  const ps = payslip(pay, sm, { commission: comSum, otMin, evalAvg: ev })
  // vai trò không có ca: chưa đặt giờ chuẩn/ngày thì không tính được tăng ca → ghi rõ, không im lặng ra 0
  if (ps && !SHIFT_ROLES.includes(role) && pay.roles[role].stdHours == null && sm.days > 0) ps.missing.push(T.pay.miss.stdHours)
  return ps ? { sm, com, ps, days } : null
}
const UN = <Pill>{T.pay.unset}</Pill>
const rate = (v: number | null) => (v == null ? T.pay.unset : D.vndShort(v))
const orUn = (v: number | null) => (v == null ? UN : money(v))

// ═══════════════ 2. THU NHẬP CỦA TÔI (KTV · Lễ tân · Leader · Marketing) ═══════════════
export function Income({ back }: { back: () => void }) {
  return <><SubHead title="Thu nhập của tôi" sub={f4('Chỉ bạn và CEO xem ·') + ' ' + T.pay.title} onBack={back} /><IncomeBody /><IncomeSummary /></>
}
export function IncomeBody() {
  const { s, me, pay, evals } = useStore()
  const t = today(), [ym, setYm] = useState(ymOf(t))
  const r = monthRange(ym)
  const role = isPayRole(me.role) ? me.role : null
  const mp = role ? monthPay(s, pay, evals, me.id, role, r) : null
  const [open, setOpen] = useState<string | null>(null)
  const tog = (k: string) => () => setOpen(open === k ? null : k)
  // Bản thật: KTV không đọc được bảng gói (RLS) → chưa có hoa hồng của mình cho tới khi nối bảng lương máy chủ — ghi Chưa nối, không hiện 0đ
  const comHidden = !D.DEMO && me.role === 'ktv'
  return <>
    <div className="row" style={{ flexWrap: 'wrap' }}><label className="f" style={{ maxWidth: 220 }}>{f4('Chọn tháng')}<input className="inp" type="month" value={ym} max={ymOf(t)} onChange={e => /^\d{4}-\d{2}$/.test(e.target.value) && setYm(e.target.value)} /></label>
      <span className="rtag">📅 {r.label}</span>{pay.sample ? <Pill tone="yellow">{T.pay.sample}</Pill> : pay.by ? <Pill tone="green">{T.pay.savedBy(pay.by, pay.at ?? '')}</Pill> : null}</div>
    {!role || !mp ? <Empty>{T.pay.noPayroll}</Empty> : (() => { const { sm, com, ps, days } = mp, rp = ps.rp
      const worked = days.filter(d => d.worked), off = days.filter(d => d.leave), late = days.filter(d => d.late), pts = days.filter(d => d.points)
      const otDays = days.map(d => ({ d, m: otOfDay(pay, role, d) })).filter(x => x.m > 0)
      const miss = comHidden ? [...ps.missing, T.pay.miss.comReal] : ps.missing
      return <>
        <Tiles items={[{ v: D.vndShort(ps.total), l: T.pay.rowTotal, s: miss.length ? T.pay.missing(miss.join(', ')) : undefined, color: 'deep' }, { v: `${sm.days}/${rp.stdDays}`, l: f4('Ngày công') }, { v: sm.leave, l: f4('Ngày nghỉ'), s: f4('nghỉ phép đã duyệt') }, { v: sm.late, l: f4('Lần đi muộn') }]} />
        <div className="card list">
          <Row t={T.pay.rowBase} v={ps.base == null ? UN : <span className="num strong">{D.vnd(ps.base)}{T.pay.perMonth}</span>} />
          <Row t={T.pay.rowWork(sm.days, rp.stdDays)} v={orUn(ps.byDays)} open={open === 'work'} onToggle={tog('work')}>
            {worked.length ? worked.map(d => <span key={+d.d} className="small">{dl(d.d)} · đi làm{d.inMin != null ? ` ${D.hhmm(d.inMin)}${d.outMin != null ? `–${D.hhmm(d.outMin)}` : ''}` : ''}{d.late ? ` · trễ ${d.lateMin ?? ''} phút` : ''}{d.real ? '' : ` · ${D.SAMPLE_NOTE}`}</span>) : <span className="small muted">{f4('Chưa có ngày công trong tháng')}</span>}
          </Row>
          <Row t={T.pay.rowOff} v={<span className="num strong">{sm.leave} ngày</span>} open={open === 'off'} onToggle={tog('off')}>
            {off.length ? off.map(d => <span key={+d.d} className="small">{dl(d.d)} · nghỉ{d.real ? ' phép đã duyệt' : ` · ${D.SAMPLE_NOTE}`}</span>) : <span className="small muted">{f4('Không nghỉ ngày nào')}</span>}
          </Row>
          {role === 'ktv' && <Row t={T.pay.rowTour} sub={T.pay.tourSubLine(ps.tourN)} v={orUn(ps.tourPay)} open={open === 'tour'} onToggle={tog('tour')}>
            {ps.tour.map(x => <span key={x.dur} className="small strong">{x.pay == null ? T.pay.tourNoRate(x.dur, x.n) : T.pay.tourLine(x.dur, x.n, D.vndShort(x.rate!), D.vnd(x.pay))}</span>)}
            {worked.filter(d => Object.keys(d.tourBy).length).map(d => <span key={+d.d} className="small">{dl(d.d)} · {Object.entries(d.tourBy).map(([du, n]) => `${n} tour ${du}′`).join(' · ')}{d.requested ? ` · ${d.requested} khách yêu cầu` : ''}{d.real ? '' : ` · ${D.SAMPLE_NOTE}`}</span>)}
            {!ps.tourN && <span className="small muted">{T.pay.noTour}</span>}
          </Row>}
          <Row t={`${T.pay.rowOt} (${rate(rp.otPerHour)}${T.pay.perHour})`} sub={T.pay.otSubLine(T.pay.hm(ps.otMin))} v={orUn(ps.ot)} open={open === 'ot'} onToggle={tog('ot')}>
            {otDays.length ? otDays.map(({ d, m }) => <span key={+d.d} className="small">{d.outMin != null && d.otRaw != null && SHIFT_ROLES.includes(role) ? T.pay.otDay(dl(d.d), D.hhmm(d.outMin), T.pay.hm(m)) : T.pay.otDayNoShift(dl(d.d), T.pay.hm(d.workMin ?? 0), T.pay.hm(m))}{d.real ? '' : ` · ${D.SAMPLE_NOTE}`}</span>) : <span className="small muted">{T.pay.noOt}</span>}
            <span className="tiny muted">{T.pay.otMinNote} ({pay.otMinMin} phút){!SHIFT_ROLES.includes(role) ? ` · ${T.pay.stdHours}: ${rp.stdHours ?? T.pay.unset}` : ''}</span>
          </Row>
          <Row t={T.pay.rowCom} sub={comHidden ? 'Bản thật: KTV xem hoa hồng của mình khi nối bảng lương máy chủ' : f4('Lễ tân nhập khi bán gói (người chốt chính / người hỗ trợ)')} v={comHidden ? CN : money(ps.commission)} open={open === 'com'} onToggle={comHidden ? undefined : tog('com')}>
            {com.length ? com.map(e => <span key={e.p.cardCode + e.x.role} className="small">{e.x.date} · gói {e.p.cardCode} ({e.p.name}) · khách {e.c.code} · {e.x.role} · <b>{D.vnd(e.x.amount)}</b> · {e.x.by} nhập</span>) : <span className="small muted">{f4('Chưa có hoa hồng sale gói trong tháng')}</span>}
          </Row>
          <Row t={T.pay.rowBonus(Math.max(0, sm.points), rate(rp.perPoint))} v={orUn(ps.bonus)} open={open === 'pt'} onToggle={tog('pt')}>
            {pts.length ? pts.map(d => <span key={+d.d} className="small">{dl(d.d)} · {d.points > 0 ? '+' : ''}{d.points} điểm{d.real ? '' : ` · ${D.SAMPLE_NOTE}`}</span>) : <span className="small muted">{f4('Chưa có điểm uy tín trong tháng')}</span>}
            {+r.to >= +t && s.points.filter(p => p.staffId === me.id && p.status === 'Đã duyệt').map(p => <span key={p.id} className="tiny muted">Hôm nay: {p.delta > 0 ? '+' : ''}{p.delta} · {p.reason}</span>)}
          </Row>
          {role === 'leader' && <Row t={T.pay.rowEval} sub={ps.evalAvg == null ? T.pay.evalNone : T.pay.evalLine(ps.evalAvg, rate(pay.evalPerPoint))} v={orUn(ps.evalBonus)} />}
          <Row t={T.pay.rowPenalty(sm.late, rate(rp.perLate))} v={ps.penalty == null ? UN : <span className="num strong" style={{ color: ps.penalty ? 'var(--r-fg)' : undefined }}>−{D.vnd(ps.penalty)}</span>} open={open === 'late'} onToggle={tog('late')}>
            {late.length ? late.map(d => <span key={+d.d} className="small">{dl(d.d)} · đi muộn {d.lateMin ?? ''} phút{d.real ? '' : ` · ${D.SAMPLE_NOTE}`}</span>) : <span className="small muted">{f4('Không đi muộn lần nào')}</span>}
          </Row>
          <Row t={T.pay.rowTotal} sub={<>{T.pay.totalSub}{miss.length ? <><br /><span style={{ color: 'var(--r-fg)' }}>{T.pay.missing(miss.join(', '))}</span></> : null}</>} v={<span className="num strong" style={{ color: 'var(--g-fg)', fontSize: 16 }}>{D.vnd(ps.total)}</span>} />
        </div>
        <div className="tiny muted">{T.pay.note} {D.DEMO ? T.pay.pastSample : T.pay.pastNone}</div>
      </> })()}
  </>
}

/** TỔNG KẾT: quá trình lương 1–2 năm (biểu đồ cột) + ngày nghỉ, tour, tăng ca, hoa hồng, thưởng, phạt từng tháng */
export function IncomeSummary() {
  const { s, me, pay, evals } = useStore()
  const [n, setN] = useState<12 | 24>(12)
  const role = isPayRole(me.role) ? me.role : null
  const tKey = +today() // đổi ngày làm việc → tính lại
  const ms = useMemo(() => (role ? lastMonths(n).map(r => ({ r, p: monthPay(s, pay, evals, me.id, role, r) })) : []), [s, pay, evals, me.id, role, n, tKey])
  if (!role) return null
  const rows = ms.filter(x => x.p && (x.p.sm.days || x.p.sm.leave || x.p.ps.commission))
  return <Block title="Tổng kết" sub={`Quá trình lương ${n === 12 ? '1 năm' : f4('2 năm')} · nhìn lại để thấy mình tiến bộ hay đi xuống`} right={<Seg value={String(n)} onChange={v => setN(+v as 12 | 24)} items={[{ k: '12', label: f4('1 năm') }, { k: '24', label: f4('2 năm') }]} />}>
    {rows.length > 0 && <ColChart label="Tổng lương thưởng" cats={rows.map(x => short(x.r.name) + (x.r.partial ? '*' : ''))} tips={rows.map(x => x.r.label)} series={[{ name: 'Tổng lương thưởng', color: 'var(--green)', values: rows.map(x => x.p!.ps.total) }, { name: f4('Hoa hồng + thưởng'), color: 'var(--gold)', values: rows.map(x => x.p!.ps.commission + (x.p!.ps.bonus ?? 0) + (x.p!.ps.evalBonus ?? 0)) }]} />}
    <div className="tbl-wrap"><table><thead><tr><th>{f4('Tháng')}</th><th>{f4('Ngày công')}</th><th>{f4('Ngày nghỉ')}</th>{role === 'ktv' && <th>Tour</th>}{role === 'ktv' && <th>{T.pay.colTour}</th>}<th>{T.pay.colOt}</th><th>{f4('Hoa hồng gói')}</th><th>{f4('Thưởng')}</th><th>{f4('Phạt')}</th><th>{f4('Tổng')}</th></tr></thead>
      <tbody>{[...rows].reverse().map(({ r, p }) => { const ps = p!.ps, c = (v: number | null) => (v == null ? T.pay.unset : D.vndShort(v))
        return <tr key={r.name}><td className="strong">{r.name}{r.partial ? ' *' : ''}</td><td className="num">{p!.sm.days}</td><td className="num">{p!.sm.leave}</td>{role === 'ktv' && <td className="num">{ps.tourN}</td>}{role === 'ktv' && <td className="num">{c(ps.tourPay)}</td>}<td className="num">{ps.otMin ? `${T.pay.hm(ps.otMin)} · ${c(ps.ot)}` : '—'}</td><td className="num">{D.vndShort(ps.commission)}</td><td className="num">{(() => { const parts = role === 'leader' ? [ps.bonus, ps.evalBonus] : [ps.bonus], known = parts.filter((v): v is number => v != null); return known.length ? D.vndShort(known.reduce((a, b) => a + b, 0)) + (known.length < parts.length ? ' *' : '') : T.pay.unset })()}</td><td className="num">{ps.penalty == null ? T.pay.unset : `−${D.vndShort(ps.penalty)}`}</td><td className="num strong">{D.vndShort(ps.total)}{ps.missing.length ? ' *' : ''}</td></tr> })}</tbody></table></div>
    {!rows.length && <Empty>{f4('Chưa có dữ liệu lương')}</Empty>}
    {rows.length > 0 && rows.length < ms.length && <div className="tiny muted">{f4('Tháng không có dữ liệu không vẽ cột (không tính là 0).')}</div>}
    <div className="tiny muted">* tháng hiện tại, tính đến hôm nay; tổng có * là còn khoản CEO chưa đặt mức (không cộng). Các tháng trước: {D.DEMO ? D.SAMPLE_NOTE : f4('Chưa nối (chờ dữ liệu máy chủ)')}.</div>
  </Block>
}

// ═══════════════ 3. HIỆU SUẤT: mũi tên so với tháng trước + TỔNG KẾT 1–2 năm ═══════════════
type Rg = { from: Date; to: Date }
type PerfKey = 'tours' | 'requested' | 'days' | 'late' | 'points' | 'rating' | 'pkgNew' | 'pkgRenew' | 'pkgAll' | 'newCust' | 'bookings' | 'showRate' | 'returning' | 'guests' | 'waitAvg' | 'teamLate' | 'teamPkgNew' | 'teamPkgRenew'
type PerfMetric = { k: PerfKey; l: string; invert?: boolean; unit?: string }
const fbDate = (daysAgo: number) => { const d = new Date(D.TODAY); d.setDate(d.getDate() - daysAgo); return d }
const inR = (d: Date, r: Rg) => +new Date(d.getFullYear(), d.getMonth(), d.getDate()) >= +r.from && +new Date(d.getFullYear(), d.getMonth(), d.getDate()) <= +r.to
const vnToDate = (vn: string) => { const [d, m, y] = vn.split('/').map(Number); return new Date(y, m - 1, d) }
/** Số KHÁCH của cả đội trong kỳ: mới mua liệu trình (gói đầu tiên) · cũ tái liệu trình (gói nối tiếp gói cũ) — đếm mỗi khách một lần */
export function teamPkgCustomers(s: ReturnType<typeof useStore>['s'], r: Rg) {
  const nw = new Set<string>(), rn = new Set<string>()
  for (const c of s.customers) for (const p of c.packages) if (inR(vnToDate(p.buyDate), r)) (p.renewalOf ? rn : nw).add(c.id)
  return { newPkg: nw.size, renewPkg: rn.size }
}

/** Chỉ số theo tháng của một người (một nguồn: staffDays · gói · phản hồi · metrics) */
export function perfValue(s: ReturnType<typeof useStore>['s'], id: string, role: D.Role, k: PerfKey, r: Rg): number | null {
  const sr = role === 'reception' ? 'reception' : 'ktv'
  const name = s.staff.find(x => x.id === id)?.name ?? ''
  if (!D.DEMO && role === 'ktv' && (k === 'pkgAll' || k === 'pkgNew' || k === 'pkgRenew')) return null // bản thật: KTV không đọc bảng gói (RLS)
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
    case 'teamPkgNew': return teamPkgCustomers(s, r).newPkg
    case 'teamPkgRenew': return teamPkgCustomers(s, r).renewPkg
    case 'teamLate': return [...staffMetrics(s, r, 'ktv'), ...staffMetrics(s, r, 'reception')].reduce((t, x) => t + x.late, 0)
  }
}
export function perfMetrics(role: D.Role): PerfMetric[] {
  if (role === 'ktv') return [{ k: 'tours', l: f4('Số lượt khách phục vụ') }, { k: 'requested', l: 'Số khách yêu cầu' }, { k: 'rating', l: 'Điểm TB khách đánh giá', unit: '/5' }, { k: 'pkgAll', l: f4('Gói đã chốt (best sale)') }, { k: 'days', l: f4('Ngày công') }, { k: 'late', l: f4('Số lần đi muộn'), invert: true }, { k: 'points', l: f4('Điểm uy tín') }]
  if (role === 'reception') return [{ k: 'tours', l: f4('Hóa đơn đã lập') }, { k: 'pkgAll', l: f4('Gói đã chốt (best sale)') }, { k: 'days', l: f4('Ngày công') }, { k: 'late', l: f4('Số lần đi muộn'), invert: true }, { k: 'points', l: f4('Điểm uy tín') }]
  if (role === 'marketing') return [{ k: 'newCust', l: f4('Khách mới') }, { k: 'bookings', l: f4('Lượt đặt lịch') }, { k: 'showRate', l: f4('Tỉ lệ khách đến'), unit: '%' }, { k: 'returning', l: f4('Khách quay lại') }]
  return [{ k: 'guests', l: f4('Khách đã phục vụ') }, { k: 'returning', l: f4('Khách quay lại') }, { k: 'teamPkgNew', l: f4('Khách mới mua liệu trình') }, { k: 'teamPkgRenew', l: f4('Khách cũ tái liệu trình') }, { k: 'showRate', l: f4('Tỉ lệ khách đến'), unit: '%' }, { k: 'waitAvg', l: f4('Thời gian chờ TB'), unit: ' phút', invert: true }, { k: 'teamLate', l: f4('Lượt đi muộn của đội'), invert: true }]
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
  const tKey = +today()
  const months = useMemo(() => lastMonths(n), [n, tKey]) // eslint-disable-line react-hooks/exhaustive-deps
  // tháng không có số (VD chưa có phản hồi, chưa có lịch) → không vẽ cột thay vì vẽ 0
  const pts = useMemo(() => months.map(r => ({ r, v: perfValue(s, id, role, m.k, r) })).filter((x): x is { r: typeof x.r; v: number } => x.v != null), [s, id, role, m.k, months])
  return <>
    <Block title="So với tháng trước" sub={`Tháng này đến hôm nay ${D.dateShort()} · so với cùng số ngày tháng trước`}>
      <div className="card list">{ms.map(x => { const a = perfValue(s, id, role, x.k, cur), b = perfValue(s, id, role, x.k, prev)
        return <div key={x.k} className="item"><div className="body"><div className="t">{x.l}</div><div className="d"><MonthArrow now={a} prev={b} invert={x.invert} unit={x.unit} />{a != null && b == null && f4('chưa có số tháng trước')}</div></div>{a == null ? CN : <span className="num strong">{a}{x.unit ?? ''}</span>}</div> })}</div>
    </Block>
    <Block title="Tổng kết" sub={`So sánh ${n === 12 ? '1 năm' : f4('2 năm')} theo tháng`} right={<Seg value={String(n)} onChange={v => setN(+v as 12 | 24)} items={[{ k: '12', label: f4('1 năm') }, { k: '24', label: f4('2 năm') }]} />}>
      <div style={{ overflowX: 'auto' }}><Seg value={m.k} onChange={v => setK(v as PerfKey)} items={ms.map(x => ({ k: x.k, label: x.l }))} /></div>
      {pts.length ? <ColChart label={m.l} fmt={v => `${v}${m.unit ?? ''}`} cats={pts.map(x => short(x.r.name) + (x.r.partial ? '*' : ''))} tips={pts.map(x => x.r.label)} series={[{ name: m.l, color: m.invert ? 'var(--b-fg)' : 'var(--green)', values: pts.map(x => x.v) }]} /> : <Empty>{f4('Chưa có dữ liệu cho chỉ số này')}</Empty>}
      {pts.length > 0 && pts.length < months.length && <div className="tiny muted">{months.length - pts.length} tháng chưa có số — không vẽ cột (không tính là 0).</div>}
      <div className="tiny muted">* tháng hiện tại, tính đến hôm nay. {m.invert ? 'Cột thấp hơn là tốt hơn. ' : ''}Các tháng trước: {D.DEMO ? D.SAMPLE_NOTE : f4('Chưa nối (chờ dữ liệu máy chủ)')}.</div>
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
  return <div className="d">{f4('Tháng này:')} <b>{a}{k === 'rating' ? '/5' : ''}</b>{label ? ` ${label}` : ''} · <MonthArrow now={a} prev={b} invert={k === 'late'} /></div>
}

// ═══════════════ 6. LEADER — VẬN HÀNH / TIỀN VÀO / DOANH THU / LỢI NHUẬN (gộp ③ Vận hành, ④ Chi tổng, ⑤ Tiền thu – DT – LN) ═══════════════
export const MONEY_KIDS = ['Tiền vào · doanh thu thực tế · công nợ gói', f4('Chi phí: sản phẩm · duy trì · khác'), f4('Lợi nhuận (tổng · trên 1 khách)'), f4('Lợi nhuận theo nhóm khách · nguồn khách · KTV')]
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
  const row = (l: ReactNode, total: number | null, note?: string, strong?: boolean, noPer?: boolean) => <tr><td className={strong ? 'strong' : ''}>{l}{note && <div className="tiny muted">{note}</div>}</td><td className="num strong">{total == null ? 'Chưa nối' : D.vnd(total)}</td><td className="num">{noPer ? '—' : per(total)}</td></tr>
  return <>
    <SubHead title="③ Vận hành · Tiền vào · Doanh thu · Lợi nhuận" sub="Một chỗ cho mọi con số tiền của Home theo kỳ — không trùng lặp: tiền thu vào → doanh thu thực tế → công nợ → chi phí → lợi nhuận, cho tổng khách và trên 1 khách" onBack={back} />
    {Dash()}
    <Block title="Bảng tổng hợp theo kỳ" sub={<><span className="rtag">📅 {cur.label}</span> · {g} khách có hóa đơn</>} color={open === 0 ? 'mint' : undefined}>
      <div className="tbl-wrap"><table><thead><tr><th>{f4('Hạng mục')}</th><th>{f4('Tổng')}</th><th>{f4('Trên 1 khách')}</th></tr></thead><tbody>
        {row(f4('Tổng tiền thu vào'), m.revenue, f4('Tiền thật đã thu: dịch vụ lẻ + bán/đóng gói + bán sản phẩm'), true)}
        {row(f4('Doanh thu thực tế'), real, `Dịch vụ lẻ + sản phẩm + giá trị ${used.sessions} buổi gói đã làm (định giá như Công nợ) — ngày trước chưa có lịch sử trừ thẻ: Chưa nối`)}
        {row(f4('Công nợ gói (Home còn nợ khách)'), debtHome, `Tính đến hôm nay (không theo kỳ) · ${d.sessionsOwed} buổi còn nợ · khách còn thiếu ${D.vndShort(d.depositMissing)}`, false, true)}
        {row(f4('Chi phí sản phẩm'), m.costProd, f4('Vật tư dùng cho khách (dầu, cao, khăn, dầu gội…)'))}
        {row(f4('Phí duy trì'), keep, f4('Điện · nước · mặt bằng · rác + wifi · lương cơ sở (lễ tân nhập ở Chi tiêu)'))}
        {row(f4('Chi khác'), other, f4('Quảng cáo, hàng hóa, giá vốn hàng bán…'))}
        {row(f4('Tổng chi phí'), allCost, undefined, true)}
        {row(f4('Lợi nhuận (trên tiền thu vào)'), m.revenue - allCost, f4('Tiền thu vào − tổng chi phí'), true)}
        {row(f4('Lợi nhuận (trên doanh thu thực tế)'), real - allCost, f4('Doanh thu thực tế − tổng chi phí'))}
      </tbody></table></div>
      <div className="tiny muted">Chi phí chưa gồm đủ lương nhân sự (Chưa nối) — chỉ có khoản lễ tân đã nhập. Các ngày trước: {D.DEMO ? D.SAMPLE_NOTE : f4('Chưa nối')}.</div>
    </Block>
    <Block title="Chi phí theo hạng mục" sub={cur.label} color={open === 1 ? 'mint' : undefined}>
      <Tiles items={[{ v: D.vndShort(m.costProd), l: f4('Chi phí sản phẩm'), s: `${per(m.costProd)} / khách` }, { v: D.vndShort(keep), l: f4('Phí duy trì'), s: `${per(keep)} / khách` }, { v: D.vndShort(other), l: f4('Chi khác'), s: `${per(other)} / khách` }]} />
      <div className="grid g2">{fixedParts.length > 0 && <Donut label="Phí duy trì" parts={fixedParts} />}{prodToday.some(x => x.cost > 0) && <Donut label="Vật tư hôm nay" parts={prodToday.filter(x => x.cost > 0).map(x => ({ l: x.name, v: x.cost }))} />}</div>
      {prodToday.some(x => x.qty > 0) && <div className="card list">{prodToday.filter(x => x.qty > 0).map(x => <div key={x.name} className="item"><div className="body"><div className="t">{x.name}</div><div className="d">Xuất hôm nay {x.qty.toLocaleString('vi-VN')} {x.unit}</div></div><span className="num strong">{D.vnd(x.cost)}</span></div>)}</div>}
      {Expenses()}
    </Block>
    <Block title="Lợi nhuận theo nhóm khách · nguồn khách" sub={`${cur.label} · chi phí chiếm ${m.revenue ? Math.round(share * 100) : 0}% tiền thu, phân bổ theo tỉ lệ tiền thu`} color={open >= 2 ? 'mint' : undefined}>
      <div className="tbl-wrap"><table><thead><tr><th>{f4('Nhóm')}</th><th>{f4('Tiền thu')}</th><th>{f4('Lợi nhuận ≈')}</th></tr></thead><tbody>
        {groups.map(([k, v]) => <tr key={k}><td className="strong">{k}</td><td className="num">{D.vnd(v)}</td><td className="num">{D.vnd(Math.round(v * (1 - share)))}</td></tr>)}
        {bySrc.map(([k, v]) => <tr key={k}><td>Nguồn: {k}</td><td className="num">{D.vnd(v)}</td><td className="num">{D.vnd(Math.round(v * (1 - share)))}</td></tr>)}
      </tbody></table></div>
      {!bySrc.length && <Empty>{f4('Chưa có tiền thu trong kỳ')}</Empty>}
    </Block>
    {Staff()}
  </>
}

// ═══════════════ 7. LEADER — CỦA TÔI: bảng lương + ĐÁNH GIÁ NĂNG LỰC LEADER (8 nút con) ═══════════════
export const LEADER_EVAL = ['Lập kế hoạch & giao việc', f4('Điều phối & kiểm soát vận hành'), f4('Đào tạo & phát triển nhân sự'), f4('Chất lượng dịch vụ & chăm sóc khách hàng'), f4('Kết quả kinh doanh của đội'), f4('Kiểm soát chi phí, kho & công nợ'), f4('Trách nhiệm & giải quyết vấn đề'), f4('Công bằng, gắn kết & xây dựng người kế cận')]
type EvalRow = { t: string; v: ReactNode | null; trend?: ReactNode }
/** Chỉ số từ dữ liệu app cho từng tiêu chí — Leader không nhập lại; điểm chấm do CEO (Chưa nối) */
export function evalRows(s: ReturnType<typeof useStore>['s'], meId: string, i: number): EvalRow[] {
  const { cur, prev } = monthPair(), mc = metrics(s, cur), mp = metrics(s, prev), pc = teamPkgCustomers(s, cur), pp = teamPkgCustomers(s, prev)
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
    case 0: return [{ t: f4('Việc đã giao cho nhân sự'), v: given.length || null }, { t: f4('Việc giao đã hoàn thành'), v: rate(givenDone.length, given.length) }, { t: f4('Việc giao còn mở'), v: given.filter(t => ['open', 'doing'].includes(t.status)).length }, { t: f4('Sáng kiến / dự án đang phụ trách'), v: myIni.length }, { t: f4('Kế hoạch tuần gửi chị'), v: s.reports.filter(r => r.fromId === meId).length }]
    case 1: return [{ t: f4('Tỉ lệ khách đến (tháng này)'), v: showRate(mc) != null ? `${showRate(mc)}%` : null, trend: arrow(showRate(mc), showRate(mp), false, '%') }, { t: f4('Thời gian chờ TB (tháng này)'), v: waitAvg(mc) != null ? `${waitAvg(mc)} phút` : null, trend: arrow(waitAvg(mc), waitAvg(mp), true, ' phút') }, { t: f4('Khách đang chờ quá 10 phút'), v: s.queue.filter(q => s.now - q.arrival > 10).length }, { t: f4('Đề xuất vận hành chờ duyệt'), v: s.opsReqs.filter(r => r.status === 'Chờ duyệt').length }]
    case 2: return [{ t: f4('SOP / quy trình đang áp dụng'), v: D.SOPS.length }, { t: f4('Khóa học, bài test, kết quả đào tạo'), v: null }, { t: f4('Nhân sự được kèm cặp trong tháng'), v: null }]
    case 3: { const avg = (f: typeof fbAll) => (f.length ? Math.round(f.reduce((t, x) => t + x.rating, 0) / f.length * 10) / 10 : null)
      return [{ t: 'Điểm TB khách đánh giá', v: avg(fbAll) != null ? `${avg(fbAll)}/5` : null }, { t: f4('Phản hồi xấu đã xử lý'), v: rate(fbBad.filter(f => f.status === 'đã xử lý').length, fbBad.length) }, { t: f4('Khu dọn dẹp đạt chuẩn'), v: rate(cr.filter(r => r.status === 'Đạt').length, cr.length) }, { t: f4('Lượt CSKH thành công'), v: s.customers.reduce((t, c) => t + c.care.filter(x => x.kind && x.ok).length, 0) }] }
    case 4: return [{ t: f4('Khách đã phục vụ (tháng này)'), v: mc.guests, trend: arrow(mc.guests, mp.guests) }, { t: f4('Khách quay lại (tháng này)'), v: mc.returning, trend: arrow(mc.returning, mp.returning) }, { t: f4('Khách mới (tháng này)'), v: mc.newCust, trend: arrow(mc.newCust, mp.newCust) }, { t: f4('Khách mới mua liệu trình (tháng này)'), v: pc.newPkg, trend: arrow(pc.newPkg, pp.newPkg) }, { t: f4('Khách cũ tái liệu trình (tháng này)'), v: pc.renewPkg, trend: arrow(pc.renewPkg, pp.renewPkg) }, { t: f4('Tiền thu vào (tháng này)'), v: D.vnd(mc.revenue), trend: arrow(Math.round(mc.revenue / 1e5) / 10, Math.round(mp.revenue / 1e5) / 10, false, 'tr') }]
    case 5: return [{ t: f4('Chi phí trên 1 khách (tháng này)'), v: mc.guests ? D.vnd(Math.round((mc.costProd + mc.costFixed + mc.costOther) / mc.guests)) : null }, { t: f4('Phiếu kho chờ duyệt'), v: s.stockMoves.filter(m => m.status === 'Chờ duyệt').length }, { t: f4('Đối chiếu sản phẩm chưa khớp'), v: s.productLogs.filter(p => !(p.ktvOk && p.recOk)).length }, { t: f4('Buổi spa Home còn nợ khách'), v: debt.sessionsOwed }]
    case 6: return [{ t: f4('Sự cố được báo sớm'), v: inc.length }, { t: f4('Sự cố đã xử lý'), v: rate(inc.filter(t => t.status === 'done').length, inc.length) }, { t: f4('Thời gian xử lý TB'), v: incDone.length ? `${Math.round(incDone.reduce((t, x) => t + (x.doneMin! - x.startedMin!), 0) / incDone.length)} phút` : null }, { t: f4('Đề xuất / báo cáo đã gửi chị'), v: s.approvals.filter(a => a.fromId === meId).length }]
    default: return [{ t: f4('Chênh lệch số tour giữa KTV hôm nay'), v: loads.length ? `${Math.max(...loads) - Math.min(...loads)} tour` : null }, { t: f4('Điểm uy tín đã duyệt cho nhân sự'), v: s.points.filter(p => p.status === 'Đã duyệt' && p.by === meId).length }, { t: f4('Đơn nghỉ / đổi ca chờ xử lý'), v: s.leaves.filter(l => l.status === 'Chờ duyệt').length }, { t: f4('Người kế cận đang bồi dưỡng'), v: null }]
  }
}
export function LeaderEval({ sub, back }: { sub?: string; back: () => void }) {
  const { s, me, go, evals } = useStore()
  const i = sub != null ? Number(sub) : NaN
  const rec = evalOf(evals, me.id, ymOf(monthPair().cur.from)), avg = evalAvg(rec)
  if (Number.isInteger(i) && LEADER_EVAL[i]) return <>
    <SubHead title={`${i + 1}. ${LEADER_EVAL[i]}`} sub="Chỉ số tự lấy từ dữ liệu app · điểm do CEO chấm (thang 1–10)" onBack={() => go('me/eval')} />
    <div className="card list">{evalRows(s, me.id, i).map(r => <div key={r.t} className="item"><div className="body"><div className="t">{r.t}</div>{r.trend && <div className="d">{r.trend}</div>}</div>{r.v == null ? CN : <span className="num strong">{r.v}</span>}</div>)}
      <div className="item"><div className="body"><div className="t">{T.pay.ceoScore}</div><div className="d">{rec ? T.pay.scoredBy(rec.by, rec.at) : T.pay.ceoScoreNone}</div></div>{rec?.scores[i] != null ? <span className="num strong">{rec.scores[i]}/10</span> : CN}</div></div>
  </>
  return <>
    <SubHead title="Đánh giá năng lực Leader" sub="8 tiêu chí · chạm từng mục để xem chỉ số chi tiết · CEO chấm thang 1–10" onBack={back} />
    <Tiles items={[{ v: avg != null ? `${avg}/10` : T.pay.unset, l: T.pay.avg, s: rec ? T.pay.scoredBy(rec.by, rec.at) : T.pay.ceoScoreNone, color: 'deep' }, { v: rec ? rec.scores.filter(x => x != null).length + `/${EVAL_N}` : `0/${EVAL_N}`, l: 'Tiêu chí đã chấm' }]} />
    <div className="nodes">{LEADER_EVAL.map((t, j) => { const rows = evalRows(s, me.id, j), known = rows.filter(r => r.v != null).length
      return <button key={t} className="node" onClick={() => go(`me/eval/${j}`)}><span className="no">{j + 1}</span><span className="body"><span className="t" style={{ display: 'block' }}>{t}</span><span className="d" style={{ display: 'block' }}>{rec?.scores[j] != null ? `CEO chấm ${rec.scores[j]}/10 · ` : ''}{rows.slice(0, 2).map(r => `${r.t}: ${r.v == null ? 'Chưa nối' : typeof r.v === 'string' || typeof r.v === 'number' ? r.v : '…'}`).join(' · ')} · {known}/{rows.length} chỉ số có dữ liệu</span></span><span className="arr"><Icon n="arrow" s={18} /></span></button> })}</div>
    <PerfTrend id={me.id} role="leader" />
  </>
}
export function LeaderSalary({ back }: { back: () => void }) {
  return <><SubHead title="Bảng lương của tôi" sub={`Leader · ${f4('Chỉ bạn và CEO xem ·')} ${T.pay.title}`} onBack={back} /><IncomeBody /><IncomeSummary /></>
}
