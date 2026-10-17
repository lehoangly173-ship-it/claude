// Bảng số liệu theo thời gian cho Leader & CEO: luôn ghi rõ kỳ (từ ngày – đến ngày), so với kỳ trước,
// và vẽ biểu đồ cột (xu hướng / so sánh người) hoặc tròn (cơ cấu một tổng). Mọi số lấy từ period.ts.
import { useMemo, useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { Block, Delta, Seg, Pill } from '../ui'
import { PeriodBar, ColChart, HBars, Donut, C_REV, C_COST, C_PROFIT, RangeTag } from '../charts'
import { usePeriod, periodRanges, lastRanges, trendCount, shortName, customUnit, metrics, cost, profit, showRate, waitAvg, targetFor, staffMetrics, trendUnit, hasPast, type StaffM } from '../period'

export const SAMPLE_PAST = D.DEMO ? 'Hôm nay lấy từ hóa đơn, lịch, chấm công thật trong app; các ngày trước là số liệu mẫu (sẽ thay bằng dữ liệu thật khi nối).' : 'Các ngày trước: Chưa nối (hiện 0) — sẽ lấy từ hóa đơn, lịch, chấm công trên máy chủ khi nối xong.'
const pctOf = (a: number, b: number) => (b ? Math.round(a / b * 100) : 0)

function useTrend() {
  const { s } = useStore(), [p] = usePeriod()
  return useMemo(() => {
    const rs = lastRanges(p.g, trendCount[p.g], p)
    return { rs, ms: rs.map(r => metrics(s, r)), cats: rs.map(r => shortName(r, p.g === 'custom' ? customUnit(p) : p.g) + (r.partial ? '*' : '')), tips: rs.map(r => `${r.name} · ${r.label}`), unit: trendUnit(p.g, p) }
  }, [s, p])
}
export function usePeriodMetrics() {
  const { s } = useStore(), [p] = usePeriod()
  return useMemo(() => { const { cur, prev } = periodRanges(p); return { p, cur, prev, m: metrics(s, cur), pm: metrics(s, prev), tg: targetFor(cur) } }, [s, p])
}

type K = { l: string; v: number | null; p: number | null; t?: number; unit?: 'đ' | '%' | ' phút' | ''; invert?: boolean; s?: string }
export function KpiCards({ items }: { items: K[] }) {
  const f = (n: number, u?: string) => (u === 'đ' ? D.vndShort(n) : `${n.toLocaleString('vi-VN')}${u ?? ''}`)
  return <div className="grid g3 kpis">{items.map(k => { const hit = k.t == null || k.v == null ? null : k.invert ? k.v <= k.t : k.v >= k.t
    return <div key={k.l} className="card stat" style={{ ['--tone' as any]: hit == null ? 'var(--green)' : hit ? 'var(--g-fg)' : 'var(--y-fg)' }}>
      <span className="l">{k.l}</span><span className="v num">{k.v == null ? '—' : f(k.v, k.unit)}</span>
      {k.v == null ? <span className="delta muted">Chưa có dữ liệu trong kỳ</span> : k.p == null ? <span className="delta muted">Kỳ trước chưa có dữ liệu</span> : <Delta now={k.v} prev={k.p} invert={k.invert} unit={k.unit === 'đ' ? 'đ' : k.unit === '%' ? ' điểm %' : k.unit ?? ''} />}
      <span className="tiny muted">Kỳ trước {k.p == null ? '—' : f(k.p, k.unit)}{k.t != null ? ` · mục tiêu ${f(k.t, k.unit)} ${hit ? '✓' : ''}` : ''}{k.s ? ` · ${k.s}` : ''}</span>
    </div> })}</div>
}

/** ① Sức khỏe Home (CEO) / "Home đang tăng hay giảm" (Leader) */
export function HealthDash({ bar = true }: { bar?: boolean }) {
  const { cur, prev, m, pm, tg } = usePeriodMetrics(), tr = useTrend()
  return <>
    {bar && <PeriodBar note={SAMPLE_PAST} />}
    <Block title="Home đang tăng hay giảm" sub={`${cur.label} so với ${prev.label}`} right={hasPast(cur) ? <Pill tone="yellow">{D.SAMPLE_NOTE}</Pill> : <Pill tone="green">Dữ liệu thật hôm nay</Pill>}>
      <KpiCards items={[
        { l: 'Tiền đã thu', v: m.revenue, p: pm.revenue, t: tg.revenue, unit: 'đ' },
        { l: 'Khách mới', v: m.newCust, p: pm.newCust, t: tg.newCust },
        { l: 'Khách quay lại', v: m.returning, p: pm.returning, t: tg.returning },
        { l: 'Lượt đặt lịch', v: m.bookings, p: pm.bookings, t: tg.bookings },
        { l: 'Tỷ lệ khách đến', v: showRate(m), p: showRate(pm), t: tg.showRate, unit: '%' },
        { l: 'Chờ trung bình', v: waitAvg(m), p: waitAvg(pm), t: tg.waitAvg, unit: ' phút', invert: true },
      ]} />
    </Block>
    <Block title={`Tiền đã thu theo ${tr.unit}`} sub={`${tr.rs.length} ${tr.unit} gần nhất · ${tr.rs[0]?.from ? `${tr.rs[0].label.split(' – ')[0]} – ${tr.rs[tr.rs.length - 1].label.split(' – ').pop()}` : ''}`}>
      <ColChart label="Tiền đã thu" cats={tr.cats} tips={tr.tips} series={[{ name: 'Tiền đã thu', color: C_REV, values: tr.ms.map(x => x.revenue) }]} />
    </Block>
    <Block title={`Khách mới & khách quay lại theo ${tr.unit}`}>
      <ColChart label="Khách" fmt={n => String(n)} cats={tr.cats} tips={tr.tips} series={[{ name: 'Khách mới', color: 'var(--gold)', values: tr.ms.map(x => x.newCust) }, { name: 'Khách quay lại', color: C_REV, values: tr.ms.map(x => x.returning) }]} />
    </Block>
  </>
}

/** Doanh thu – Chi phí – Lợi nhuận theo kỳ (CEO ⑧ · Leader ⑤) */
export function FinanceDash({ bar = true, show = ['kpi', 'trend', 'mix', 'cost', 'source'] }: { bar?: boolean; show?: ('kpi' | 'trend' | 'mix' | 'cost' | 'source')[] }) {
  const { cur, prev, m, pm } = usePeriodMetrics(), tr = useTrend()
  const margin = (x: typeof m) => pctOf(profit(x), x.revenue)
  return <>
    {bar && <PeriodBar note={<>{SAMPLE_PAST} Chi phí chưa gồm đủ lương nhân sự (Chưa nối) — chỉ có khoản lễ tân đã nhập ở Chi tiêu.</>} />}
    {show.includes('kpi') && <Block title="Thu – chi – lợi nhuận" sub={`${cur.label} so với ${prev.label}`} right={<Pill tone="yellow">{D.SAMPLE_NOTE}</Pill>}>
      <KpiCards items={[
        { l: 'Tiền đã thu', v: m.revenue, p: pm.revenue, unit: 'đ' },
        { l: 'Chi phí', v: cost(m), p: cost(pm), unit: 'đ', invert: true, s: 'chưa đủ lương' },
        { l: 'Lợi nhuận', v: profit(m), p: profit(pm), unit: 'đ' },
        { l: 'Biên lợi nhuận', v: margin(m), p: margin(pm), unit: '%' },
        { l: 'Khách có hóa đơn', v: m.guests, p: pm.guests },
        { l: 'Chi phí / 1 khách', v: m.guests ? Math.round(cost(m) / m.guests) : 0, p: pm.guests ? Math.round(cost(pm) / pm.guests) : 0, unit: 'đ', invert: true },
      ]} />
    </Block>}
    {show.includes('trend') && <Block title={`Thu – chi – lợi nhuận theo ${tr.unit}`} sub={`Chạm vào cột để xem ngày cụ thể · ${tr.rs.length} ${tr.unit} gần nhất`}>
      <ColChart label="Thu chi lợi nhuận" cats={tr.cats} tips={tr.tips} series={[{ name: 'Tiền thu', color: C_REV, values: tr.ms.map(x => x.revenue) }, { name: 'Chi phí', color: C_COST, values: tr.ms.map(cost) }, { name: 'Lợi nhuận', color: C_PROFIT, values: tr.ms.map(profit) }]} />
      <div className="tiny muted">* kỳ hiện tại, tính đến hôm nay. Cột lợi nhuận màu đỏ khi lỗ. Tháng có tiền mặt bằng ghi một lần nên các ngày đầu tháng có thể lỗ — xem theo tháng để so công bằng.</div>
    </Block>}
    <div className="grid g2">
      {show.includes('mix') && <Block title="Cơ cấu tiền thu" sub={cur.label}><Donut label="Cơ cấu tiền thu" parts={[{ l: 'Dịch vụ lẻ', v: m.lePart }, { l: 'Gói liệu trình', v: m.pkgPart }, { l: 'Bán sản phẩm', v: m.prodPart }]} /></Block>}
      {show.includes('cost') && <Block title="Cơ cấu chi phí" sub={cur.label}><Donut label="Cơ cấu chi phí" parts={Object.entries(m.byCat).map(([l, v]) => ({ l, v }))} /></Block>}
      {show.includes('source') && <Block title="Tiền thu theo nguồn khách" sub={cur.label}><Donut label="Tiền thu theo nguồn khách" parts={Object.entries(m.bySource).map(([l, v]) => ({ l, v }))} /></Block>}
    </div>
  </>
}

const STAFF_METRICS: { k: keyof StaffM; label: string; fmt?: (n: number) => string; unit?: string; invert?: boolean }[] = [
  { k: 'tours', label: 'Số tour' }, { k: 'revenue', label: 'Doanh thu', fmt: D.vndShort }, { k: 'requested', label: 'Khách yêu cầu lại' },
  { k: 'points', label: 'Điểm uy tín' }, { k: 'late', label: 'Đi muộn', unit: ' lần', invert: true }, { k: 'leave', label: 'Ngày nghỉ phép', unit: ' ngày', invert: true },
]
/** So sánh nhân sự với nhau trong kỳ (cột ngang) + xu hướng tour cả đội (cột) */
export function StaffCompare({ role: role0 = 'ktv', bar = true, pick = 'tours', lockRole }: { role?: 'ktv' | 'reception'; bar?: boolean; pick?: keyof StaffM; lockRole?: boolean }) {
  const { s } = useStore(), [p] = usePeriod()
  const [role, setRole] = useState(role0)
  const [k, setK] = useState<keyof StaffM>(pick)
  const r = lockRole ? role0 : role
  const { cur } = periodRanges(p)
  const list = useMemo(() => staffMetrics(s, cur, r), [s, cur.from.getTime(), cur.to.getTime(), r])
  const mt = STAFF_METRICS.find(x => x.k === k) ?? STAFF_METRICS[0]
  const items = (r === 'reception' ? STAFF_METRICS.filter(x => x.k !== 'requested').map(x => (x.k === 'tours' ? { ...x, label: 'Hóa đơn lập' } : x)) : STAFF_METRICS)
  const total = list.reduce((t, x) => t + (x[mt.k] as number), 0)
  return <>
    {bar && <PeriodBar compare={false} note={SAMPLE_PAST} />}
    <Block title={`So sánh ${r === 'ktv' ? 'kĩ thuật viên' : 'lễ tân'}: ${(items.find(x => x.k === k) ?? mt).label.toLowerCase()}`} sub={<><RangeTag r={cur} /> · tổng {mt.fmt ? mt.fmt(total) : total.toLocaleString('vi-VN')}{mt.unit ?? ''}</>} right={<Pill tone="yellow">{D.SAMPLE_NOTE}</Pill>}>
      {!lockRole && <Seg value={r} onChange={setRole} items={[{ k: 'ktv', label: 'Kĩ thuật viên' }, { k: 'reception', label: 'Lễ tân' }]} />}
      <div style={{ overflowX: 'auto' }}><Seg value={k} onChange={setK} items={items.map(x => ({ k: x.k, label: x.label }))} /></div>
      <HBars label={mt.label} rows={list.map(x => ({ l: x.name, v: x[mt.k] as number }))} fmt={mt.fmt} unit={mt.unit} color={mt.invert ? 'var(--b-fg)' : 'var(--green)'} />
      <div className="tiny muted">{mt.invert ? 'Ít hơn là tốt hơn.' : 'Cột vàng = cao nhất kỳ.'} Điểm uy tín và chấm công hôm nay lấy từ app; ngày trước là {D.SAMPLE_NOTE}.</div>
    </Block>
  </>
}

/** Nguồn khách: số khách & tiền thu theo nguồn (cơ cấu → biểu đồ tròn) */
export function SourceDash({ bar = true }: { bar?: boolean }) {
  const { s } = useStore(), { cur, m } = usePeriodMetrics()
  const byCount = Object.entries(s.customers.reduce((o, c) => { o[c.source] = (o[c.source] ?? 0) + 1; return o }, {} as Record<string, number>)).map(([l, v]) => ({ l, v }))
  return <>
    {bar && <PeriodBar compare={false} note={SAMPLE_PAST} />}
    <div className="grid g2">
      <Block title="Tiền thu theo nguồn khách" sub={cur.label}><Donut label="Tiền thu theo nguồn" parts={Object.entries(m.bySource).map(([l, v]) => ({ l, v }))} /></Block>
      <Block title="Số khách theo nguồn" sub={`Toàn bộ tệp khách đến hôm nay · ${D.dateShort()}`}><Donut label="Số khách theo nguồn" fmt={n => `${n} khách`} center={`${s.customers.length}`} parts={byCount} /></Block>
    </div>
  </>
}

/** Dòng tóm tắt kỳ cho màn chính CEO/Leader (bấm để mở chi tiết) */
export function PeriodSummary({ onOpen }: { onOpen?: () => void }) {
  const { cur, prev, m, pm } = usePeriodMetrics()
  return <Block title={`Kết quả ${cur.name.toLowerCase()}`} sub={<><RangeTag r={cur} /> · so với {prev.label}</>} right={onOpen && <button className="btn sm" onClick={onOpen}>Xem biểu đồ</button>}>
    <KpiCards items={[{ l: 'Tiền đã thu', v: m.revenue, p: pm.revenue, unit: 'đ' }, { l: 'Chi phí', v: cost(m), p: cost(pm), unit: 'đ', invert: true, s: 'chưa đủ lương' }, { l: 'Lợi nhuận', v: profit(m), p: profit(pm), unit: 'đ' }]} />
    <div className="tiny muted">{SAMPLE_PAST}</div>
  </Block>
}
