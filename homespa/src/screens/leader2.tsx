// FIX LẦN 1 — Leader (Lark "FIX LẦN 1 APP LEADER"): Hôm nay (Vận hành nhóm), Chăm sóc KH Home,
// Vận hành, Chi tổng, Doanh thu – lợi nhuận, Công nợ, Nhân sự (lương · điểm · hiệu suất · đào tạo)
import { FinanceDash, StaffCompare, usePeriodMetrics } from './timeDash'
import { Donut, PeriodBar } from '../charts'
import { cost, FIXED_CATS, iso } from '../period'
import { useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { overview, billRows, zoneReport, inboxSuggestions, debtSummary, ktvPerf, alerts } from '../logic'
import { Block, Pill, Empty, Tiles, Seg, SubHead, Av } from '../ui'
import { TreeNodes } from '../tree'
import { ExpensePage } from './reception2'

const Red = ({ n }: { n: number }) => n ? <span className="badge red">{n}</span> : <Pill tone="green">Ổn</Pill>
type Row = { t: string; n: number; ai: string; go: string }

/** ① HÔM NAY — Vận hành nhóm: chọn vai trò KTV / Lễ tân → nhiệm vụ từng ban, số đỏ nếu bất cập */
export function TeamOps() {
  const { s, go } = useStore()
  const [role, setRole] = useState<'ktv' | 'reception'>('ktv')
  const o = overview(s)
  const leaves = s.leaves.filter(l => l.status === 'Chờ duyệt')
  const rows: Row[] = [
    { t: 'Đổi ca – STT tour', n: leaves.filter(l => l.kind === 'Đổi ca').length + (o.waitingLong ? 1 : 0), ai: 'Có bất cập → hiện số đỏ để Leader vào kiểm tra', go: 'home/shift' },
    { t: 'Dọn dẹp', n: s.cleanReports.filter(r => r.status === 'Chờ kiểm tra' || (r.status === 'Chưa đạt' && zoneReport(s, r.zone)?.id === r.id)).length + s.xpChecks.filter(x => x.status === 'Không đạt – lễ tân xử lý').length, ai: 'AI quét các ban ngành có khớp không → báo Leader trước, rồi KTV, lễ tân (giả lập)', go: role === 'ktv' ? 'home/cleaning' : 'home/base/0' },
    { t: 'Điều phối tour / lịch hẹn', n: o.waitingLong ? o.waiting : 0, ai: 'Khách chờ lâu → chia tour ngay', go: 'home/ops' },
    { t: 'Công việc nhân viên', n: s.tasks.filter(t => !t.earlyReport && ['open', 'doing'].includes(t.status)).length, ai: 'Việc chưa xong của từng người', go: 'home/tasks' },
    { t: 'Bill Money', n: billRows(s).filter(r => r.issue).length, ai: 'AI quét tour ↔ hóa đơn có khớp không → báo Leader trước (giả lập)', go: 'home/bills' },
    { t: 'Check đánh giá Google', n: s.reviews.filter(r => r.status === 'Chờ đối soát').length, ai: 'AI kết nối Google Map, báo xác nhận qua KTV và nhóm chung (Chưa nối)', go: 'home/reviews' },
    { t: 'Báo cáo sự cố', n: s.tasks.filter(t => t.earlyReport && ['open', 'doing'].includes(t.status)).length, ai: 'Đọc → báo cáo cấp trên → phương án giải quyết', go: 'home/tasks' },
    { t: 'Ý kiến / kiến nghị', n: inboxSuggestions(s, 'leader').length, ai: 'Đọc → báo cáo lên cấp trên → phương án giải quyết', go: 'home/ideas' },
    { t: 'Đối chiếu sản phẩm, kiểm kho', n: s.productLogs.filter(p => !(p.ktvOk && p.recOk)).length + s.stockMoves.filter(m => m.status === 'Chờ duyệt').length, ai: 'Kiểm tra xử lý nếu AI báo bất thường', go: role === 'ktv' ? 'home/products' : 'home/base/2/7' },
    { t: 'Duyệt xin nghỉ phép', n: leaves.length, ai: 'Đối chiếu lịch đặt của khách, dùng AI quét quy định → duyệt', go: 'home/leaveok' },
    { t: 'Chốt ca', n: s.shiftCloses.filter(x => (Object.keys(x.counted) as D.PayMethod[]).some(k => x.counted[k] !== x.expected[k])).length, ai: 'Xử lý nếu bất thường, hoặc giao lại cho người khác khi lễ tân thứ 2 nghỉ', go: 'home/close' },
  ]
  const recOps = [s.xpChecks.filter(x => x.area.startsWith('Lao công') && x.status === 'Không đạt – lễ tân xử lý').length, s.xpChecks.filter(x => x.area.startsWith('Trải nghiệm') && (x.status === 'Không đạt – lễ tân xử lý' || x.help)).length, s.stockMoves.filter(m => m.status === 'Chờ duyệt').length, s.opsReqs.filter(r => r.kind === 'Thiết bị' && r.status === 'Chờ duyệt').length, s.opsReqs.filter(r => r.kind === 'Hoạt động' && r.status === 'Chờ duyệt').length, s.points.filter(p => p.status === 'Chờ duyệt').length, s.handovers.filter(h => h.status === 'Không đồng ý').length, 0]
  const [all, setAll] = useState(false)
  const cb = (r: { t: string; n: number; ai: string; go: string }) => <button key={r.t} title={r.ai} onClick={() => go(r.go)}><span>{r.t}</span>{r.n ? <span className="badge red">{r.n}</span> : null}</button>
  return <Block title="Vận hành nhóm" sub="Chọn vai trò → nhiệm vụ của mỗi ban ngành · số đỏ = bất cập cần Leader kiểm tra" color="mint">
    <Seg value={role} onChange={v => { setRole(v); setAll(false) }} items={[{ k: 'ktv', label: 'Kĩ thuật viên', badge: rows.reduce((t, r) => t + r.n, 0) }, { k: 'reception', label: 'Lễ tân', badge: recOps.reduce((t, n) => t + n, 0) }]} />
    {(() => { const list = role === 'ktv' ? rows : D.OPS_ITEMS.map((x, i) => ({ t: `${i + 1}. ${x}`, n: recOps[i], ai: 'Vận hành cơ sở · Lễ tân', go: `home/base/${i}` }))
      const hot = list.filter(r => r.n > 0), calm = list.filter(r => !r.n)
      return <>{hot.length ? <div className="ops-mini">{hot.map(cb)}</div> : <div className="small muted">Không có bất cập nào cần kiểm tra.</div>}
        {calm.length > 0 && <button className="link small" style={{ alignSelf: 'flex-start' }} aria-expanded={all} onClick={() => setAll(!all)}>{all ? 'Ẩn mục không có bất cập' : `Xem thêm ${calm.length} mục không có bất cập`}</button>}
        {all && <div className="ops-mini calm">{calm.map(cb)}</div>}</> })()}
  </Block>
}

/** Leader duyệt nghỉ phép: đối chiếu lịch khách + quy định (giả lập) */
export function LeaveApprove({ back }: { back: () => void }) {
  const { s, me, decide } = useStore()
  const pend = s.approvals.filter(a => a.kind === 'Nghỉ phép / đổi ca' && a.status === 'Chờ duyệt' && a.fromId !== me.id) // không tự duyệt đơn của mình
  return <>
    <SubHead title="Duyệt xin nghỉ phép / đổi ca" sub="Đối chiếu lịch đặt của khách · AI quét quy định (giả lập — Chưa nối AI thật) · duyệt" onBack={back} />
    <div className="card list">{pend.map(a => { const l = s.leaves.find(x => x.id === a.refId); const sameDay = l ? s.leaves.filter(x => x.date === l.date && x.status !== 'Từ chối' && x.id !== l.id).length : 0
      const booked = l && l.date === D.dateShort() ? s.appts.filter(x => x.ktvId === l.staffId && x.status === 'booked').length : 0
      return <div key={a.id} className="item" style={{ flexWrap: 'wrap' }}><div className="body" style={{ minWidth: 200 }}><div className="t">{a.title}</div><div className="d">{a.detail}</div>
        <div className="small">📅 Lịch khách đã đặt với nhân viên ngày đó: <b>{l?.date === D.dateShort() ? booked : 'Chưa nối'}</b> · 🌿 Quy định: {sameDay ? <b style={{ color: 'var(--r-fg)' }}>đã có {sameDay} người nghỉ cùng ngày — cân nhắc</b> : 'không trùng người nghỉ'}</div></div>
        <button className="btn sm danger" onClick={() => decide(a.id, false)}>Từ chối</button><button className="btn sm pri" onClick={() => decide(a.id, true)}>Duyệt</button></div> })}
      {!pend.length && <Empty>Không có đơn chờ duyệt</Empty>}</div>
  </>
}

/** Duyệt đề xuất vận hành của lễ tân (thiết bị, hoạt động) */
export function OpsApprove({ back }: { back: () => void }) {
  const { s, decideOpsReq } = useStore()
  const pend = s.opsReqs.filter(r => r.status === 'Chờ duyệt')
  return <>
    <SubHead title="Duyệt đề xuất vận hành" sub="Thiết bị – sửa chữa · sinh nhật – quà – hoạt động chung → lễ tân nhận thông báo" onBack={back} />
    <div className="card list">{pend.map(r => <div key={r.id} className="item"><div className="body"><div className="t">{r.kind}: {r.title} · {D.vnd(r.cost)}</div><div className="d">{r.from ? `${r.from} → ${r.to} · ` : ''}{D.staffName(r.by)} · {D.hhmm(r.at)}</div></div><button className="btn sm danger" onClick={() => decideOpsReq(r.id, false)}>Từ chối</button><button className="btn sm pri" onClick={() => decideOpsReq(r.id, true)}>Duyệt</button></div>)}{!pend.length && <Empty>Không có đề xuất chờ duyệt</Empty>}</div>
  </>
}

/** Các nút mẹ còn lại của App Leader (xổ nút con khi chạm) */
export function LeaderMothers() {
  const { go } = useStore()
  const k = (base: string, ls: string[]) => ls.map((l, i) => ({ no: String(i + 1), l, onClick: () => go(`${base}/${i}`) }))
  return <TreeNodes items={[
    { no: '②', t: 'Chăm sóc khách hàng Home', d: 'Chiến lược · tin nhắn · phân quyền gọi · kết quả · 4 nhóm khách', onClick: () => go('cust'), kids: [['Chiến lược chăm sóc', 'care-1'], ['Kích hoạt luồng tin nhắn', 'care-2'], ['Phân quyền gọi điện → Kết quả', 'care-3'], ['Khách lẻ / liệu trình Việt & nước ngoài', 'care-4']].map(([l, id]) => ({ l, onClick: () => { go('cust'); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120) } })) },
    { no: '③', t: 'Vận hành', d: 'Chi phí sản phẩm · chi phí duy trì', onClick: () => go('home/fin/ops'), kids: k('home/fin/ops', ['Chi phí sản phẩm / 1 khách', 'Chi phí duy trì']) },
    { no: '④', t: 'Chi tổng', d: 'Chi phí tổng · tổng chi phí / 1 khách', onClick: () => go('home/fin/spend'), kids: k('home/fin/spend', ['Chi phí tổng', 'Tổng chi phí / 1 khách']) },
    { no: '⑤', t: 'Số tiền thu vào – Doanh thu – Lợi nhuận', d: 'Theo nhóm khách · nguồn khách · KTV · tổng', onClick: () => go('home/fin/rev'), kids: k('home/fin/rev', ['Lợi nhuận từng nhóm khách', 'Lợi nhuận tổng', 'Lợi nhuận từng nguồn khách', 'Theo kĩ thuật viên']) },
    { no: '⑥', t: 'Công nợ', d: 'Số buổi spa đang nợ khách · cọc · hoàn thành gói', onClick: () => go('home/fin/debt'), kids: k('home/fin/debt', ['Số buổi spa đang nợ khách', 'Tổng công nợ cọc', 'Công nợ khách đã hoàn thành gói']) },
    { no: '⑦', t: 'Nhân sự', d: 'Lương · điểm uy tín · hiệu suất · đào tạo', onClick: () => go('team'), kids: [{ l: 'Lương', onClick: () => go('team/salary') }, { l: 'Điểm uy tín', onClick: () => go('team/points') }, { l: 'Hiệu suất nhân sự (KTV / Lễ tân)', onClick: () => go('team/perf') }, { l: 'Đào tạo', onClick: () => go('team/train') }] },
  ]} />
}

// ── Tài chính Leader: MỘT nguồn số = period.ts (metrics/cost/profit) theo kỳ chung · chi tiết vật tư hôm nay lấy từ phiếu kho ──
const toISO = (vn: string) => { const [d, m, y] = vn.split('/'); return `${y}-${m}-${d}` }
function useFin() {
  const { s } = useStore()
  const ok = s.stockMoves.filter(m => m.status !== 'Chờ duyệt' && m.status !== 'Từ chối')
  const prod = D.STOCK_ITEMS.map(it => ({ it, v: ok.filter(m => m.item === it.id && (m.kind === 'Cấp NV' || m.kind === 'Dùng chung')).reduce((t, m) => t + m.qty, 0) - ok.filter(m => m.item === it.id && m.kind === 'Hoàn trả').reduce((t, m) => t + m.qty, 0) })).map(x => ({ ...x, cost: Math.max(0, x.v) * x.it.cost }))
  return { s, prod, ...usePeriodMetrics() }
}
export function LeaderFin({ sub, back }: { sub: string[]; back: () => void }) {
  const f = useFin(), { s, m, cur } = f
  const per = (v: number) => m.guests ? D.vnd(Math.round(v / m.guests)) : '—'
  const fixed = FIXED_CATS.map(c => ({ l: c, v: m.byCat[c] ?? 0 })).filter(x => x.v)
  const inCur = (e: D.Expense) => { const d = toISO(e.date); return d >= iso(cur.from) && d <= iso(cur.to) }
  const [page, idx] = sub
  if (page === 'ops') return <>
    <SubHead title="③ Vận hành" sub="Chi phí sản phẩm (dầu massage, cao hổ, sữa chua, khăn lạnh, dầu gội, dầu xả) · chi phí duy trì" onBack={back} />
    <PeriodBar compare={false} />
    <Tiles items={[{ v: D.vndShort(m.costProd), l: 'Chi phí sản phẩm', s: `${cur.label} · vật tư dùng cho khách` }, { v: per(m.costProd), l: 'Chi phí SP / 1 khách', s: `${m.guests} khách có hóa đơn` }, { v: D.vndShort(m.costFixed), l: 'Chi phí duy trì', s: `${cur.label} · điện · nước · rác+wifi · mặt bằng` }]} />
    <div className="grid g2">{f.prod.some(x => x.cost > 0) && <Block title="Vật tư đã xuất hôm nay theo loại" sub={`Phiếu kho ${D.dateShort()}`}><Donut label="Vật tư hôm nay" parts={f.prod.map(x => ({ l: x.it.name, v: x.cost }))} /></Block>}
      {fixed.length > 0 && <Block title="Chi phí duy trì theo hạng mục" sub={cur.label}><Donut label="Chi phí duy trì" parts={fixed} /></Block>}</div>
    {idx !== '1' && <Block title="Vật tư đã xuất hôm nay" sub={`Cấp − hoàn trả × giá vốn · ${D.dateShort()}`}><div className="card list">{f.prod.filter(x => x.v > 0).map(x => <div key={x.it.id} className="item"><div className="body"><div className="t">{x.it.name}</div><div className="d">{x.v.toLocaleString('vi-VN')} {x.it.unit} · giá vốn {D.SAMPLE_NOTE}</div></div><span className="num strong">{D.vnd(x.cost)}</span></div>)}{!f.prod.some(x => x.v > 0) && <Empty>Chưa xuất vật tư</Empty>}</div></Block>}
    {idx !== '0' && <Block title="Chứng từ chi phí duy trì đã nhập" sub={cur.label}><div className="card list">{s.expenses.filter(e => (FIXED_CATS as readonly string[]).includes(e.cat) && inCur(e)).map(e => <div key={e.id} className="item"><div className="body"><div className="t">{e.cat}</div><div className="d">{e.date} · {e.note}</div></div><span className="num strong">{D.vnd(e.amount)}</span></div>)}{!s.expenses.some(e => (FIXED_CATS as readonly string[]).includes(e.cat) && inCur(e)) && <Empty>Chưa có chứng từ trong kỳ — đang dùng số liệu mẫu</Empty>}</div></Block>}
  </>
  if (page === 'spend') return <>
    <SubHead title="④ Chi tổng" sub="Chi phí tổng = vật tư + duy trì + chi khác (quảng cáo, hàng hóa, giá vốn hàng bán) · lễ tân nhập ở Chi tiêu vận hành" onBack={back} />
    <FinanceDash show={['kpi', 'trend', 'cost']} />
    <Block title="Chi phí theo nhóm" sub={cur.label}><Tiles items={[{ v: D.vndShort(cost(m)), l: 'Chi phí tổng' }, { v: per(cost(m)), l: 'Chi phí / 1 khách', s: `${m.guests} khách có hóa đơn` }, { v: D.vndShort(m.costProd), l: 'Chi phí sản phẩm' }, { v: D.vndShort(m.costFixed), l: 'Chi phí duy trì' }, { v: D.vndShort(m.costOther), l: 'Chi khác' }]} /></Block>
    <ExpensePage readOnly />
  </>
  if (page === 'rev') {
    const share = m.revenue ? cost(m) / m.revenue : 0 // phân bổ chi phí theo tỉ lệ tiền thu
    const ln = (v: number) => D.vnd(Math.round(v * (1 - share)))
    const groups: [string, number][] = [['Khách lẻ', m.lePart], ['Liệu trình', m.pkgPart], ['Bán sản phẩm', m.prodPart]]
    const bySrc = Object.entries(m.bySource).filter(x => x[1]).sort((a, b) => b[1] - a[1])
    return <>
      <SubHead title="⑤ Số tiền thu vào – Doanh thu – Lợi nhuận" sub="Tiền thu từ hóa đơn + bán sản phẩm · lợi nhuận = thu − chi phí, phân bổ theo tỉ lệ tiền thu" onBack={back} />
      <FinanceDash />
      <StaffCompare bar={false} pick="revenue" lockRole />
      <Block title="Lợi nhuận trên từng nhóm khách" sub={`${cur.label} · chi phí chiếm ${m.revenue ? Math.round(share * 100) : 0}% tiền thu`}>{groups.map(([g, v]) => <div key={g} className="row small"><b>{g}</b><span className="right-al">thu {D.vnd(v)} · LN ≈ {ln(v)}</span></div>)}</Block>
      <Block title="Lợi nhuận trên từng nguồn khách" sub={`${cur.label} · Facebook · TikTok · Google…`}><div className="card list">{bySrc.map(([k, n]) => <div key={k} className="item"><div className="body"><div className="t">{k}</div><div className="d">LN ≈ {ln(n)}</div></div><span className="num strong">{D.vnd(n)}</span></div>)}{!bySrc.length && <Empty>Chưa có tiền thu trong kỳ</Empty>}</div></Block>
    </>
  }
  if (page === 'debt') {
    const d = debtSummary(s)
    const perTour = f.prod.reduce((t, x) => t + (x.it.perTour ?? 0) * x.it.cost, 0) || 3600
    const list = (nn: boolean, dep: boolean) => (dep ? d.deposit : d.full).filter(x => (x.c.group === 'NN') === nn)
    const L = ({ title, items }: { title: string; items: typeof d.left }) => <Block title={title} right={<span className="badge">{items.length}</span>}><div className="card list">{items.map(x => { const v = d.owedValue(x.p), cost = x.p.type === 'session' ? D.pkgLeft(x.p) * perTour : 0
      return <div key={x.p.cardCode} className="item"><div className="body"><div className="t">{x.c.name} · {x.p.cardCode}</div><div className="d">{x.p.name} · còn {D.pkgLeftLabel(x.p)} · hạn {x.p.expiry}{D.pkgOwed(x.p) ? ` · còn thiếu ${D.vnd(D.pkgOwed(x.p))}` : ''}</div></div><span className="small">lợi nhuận <b>{D.vnd(v - cost)}</b></span></div> })}{!items.length && <Empty>Không có</Empty>}</div></Block>
    const sorted = [...d.left].sort((a, b) => b.p.expiry.split('/').reverse().join('').localeCompare(a.p.expiry.split('/').reverse().join('')))
    return <>
      <SubHead title="⑥ Công nợ" sub={`Tính đến hôm nay ${D.dateShort()} · số buổi spa đang nợ khách · chi phí/tour ước theo định mức vật tư (${D.SAMPLE_NOTE})`} onBack={back} />
      {(() => { const cost = d.sessionsOwed * perTour, depCost = d.deposit.reduce((t, x) => t + (x.p.type === 'session' ? D.pkgLeft(x.p) * perTour : 0), 0)
        return <div className="debt2">
          <div className="col"><span className="eyebrow">Công nợ</span><Tiles items={[
            { v: D.vndShort(d.depositDebt + d.fullValue), l: 'Tổng công nợ', s: 'giá trị buổi Home còn nợ khách (cọc + đã trả đủ)', color: 'deep' },
            { v: d.sessionsOwed, l: 'Số buổi spa đang nợ khách' },
            { v: D.vndShort(d.depositDebt), l: 'Tổng công nợ cọc', s: `đã cọc ${D.vndShort(d.depositPaid)} · khách còn thiếu ${D.vndShort(d.depositMissing)}` },
            { v: D.vndShort(d.fullValue), l: 'Công nợ khách đã hoàn thành gói' },
            { v: D.vndShort(cost), l: 'Chi phí từ công nợ', s: 'vật tư cho các buổi còn nợ' }]} /></div>
          <div className="col"><span className="eyebrow">Lợi nhuận</span><Tiles items={[
            { v: D.vndShort(d.depositDebt + d.fullValue - cost), l: 'Lợi nhuận từ công nợ', s: 'tổng công nợ − chi phí vật tư' },
            { v: D.vndShort(d.depositPaid - depCost), l: 'Tổng lợi nhuận từ cọc' },
            { v: D.vndShort(d.deposit.reduce((t, x) => t + x.p.finalPrice, 0) - depCost), l: 'LN ước tính nếu khách hoàn thành gói' }]} /></div>
        </div> })()}
      <Block title="Danh sách khách còn buổi ở spa" sub="Xếp theo hạn từ xa tới gần"><div className="card list">{sorted.map(x => <div key={x.p.cardCode} className="item"><div className="body"><div className="t">{x.c.name}</div><div className="d">{x.p.cardCode} · còn {D.pkgLeftLabel(x.p)} · hạn {x.p.expiry}</div></div></div>)}{!sorted.length && <Empty>Không có</Empty>}</div></Block>
      <L title="Liệu trình Việt — cọc tiền chưa đi hết" items={list(false, true)} />
      <L title="Liệu trình nước ngoài — cọc tiền chưa đi hết" items={list(true, true)} />
      <L title="Liệu trình Việt — hoàn thành gói tiền, chưa đi hết" items={list(false, false)} />
      <L title="Liệu trình nước ngoài — hoàn thành gói tiền, chưa đi hết" items={list(true, false)} />
    </>
  }
  return null
}

/** Chăm sóc khách hàng Home (Leader): chiến lược · luồng tin nhắn · phân quyền gọi · kết quả */
export function LeaderCareTop() {
  const { s } = useStore()
  const [ch, setCh] = useState<'Facebook' | 'Zalo' | 'SĐT'>('Zalo')
  const [on, setOn] = useState<string[]>([])
  const [caller, setCaller] = useState<Record<string, string>>({})
  const recs = s.staff.filter(x => x.role === 'reception')
  const groups = ['Khách lẻ Việt', 'Khách liệu trình Việt', 'Khách liệu trình nước ngoài', 'Khách lâu chưa quay lại (tệp 1–5)']
  const logs = s.customers.flatMap(c => c.care.filter(x => x.kind))
  return <>
    <div id="care-1" />
    <Block title="Chiến lược chăm sóc" sub="Cập nhật sau qua file, video — Chưa nối"><div className="card list">{groups.map(g => <div key={g} className="item"><div className="body"><div className="t">{g}</div><div className="d">Kịch bản & tài liệu: Chưa nối</div></div></div>)}</div></Block>
    <div id="care-2" />
    <Block title="Kích hoạt luồng tin nhắn" sub="Chọn nền tảng tin nhắn → chọn tệp khách (giả lập — chưa gửi thật)">
      <Seg value={ch} onChange={setCh} items={[{ k: 'Facebook', label: 'Facebook' }, { k: 'Zalo', label: 'Zalo' }, { k: 'SĐT', label: 'SĐT (gọi/nhắn)' }]} />
      <div className="row">{groups.map(g => { const k = `${ch}|${g}`; return <button key={k} className={`btn sm${on.includes(k) ? '' : ' pri'}`} onClick={() => setOn(on.includes(k) ? on.filter(x => x !== k) : [...on, k])}>{on.includes(k) ? `✓ ${g}` : `Kích hoạt: ${g}`}</button> })}</div>
      {ch === 'SĐT' && <div className="tiny muted">Leader không xem SĐT khách — luồng gọi giao cho lễ tân ở mục Phân quyền gọi điện.</div>}
    </Block>
    <div id="care-3" />
    <Block title="Phân quyền gọi điện → Kết quả">
      <div className="card list">{groups.map(g => <div key={g} className="item"><div className="body"><div className="t">{g}</div></div><select className="inp" style={{ width: 160 }} value={caller[g] ?? ''} onChange={e => setCaller({ ...caller, [g]: e.target.value })} aria-label={`Người gọi ${g}`}><option value="">— lễ tân gọi —</option>{recs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>)}</div>
      <Tiles items={[{ v: logs.filter(x => x.kind === 'Gọi điện' && x.ok).length, l: 'Gọi thành công' }, { v: logs.filter(x => x.kind === 'Nhắn tin' && x.ok).length, l: 'Nhắn tin thành công' }, { v: logs.filter(x => x.replied).length, l: 'Khách phản hồi' }, { v: logs.filter(x => x.came).length, l: 'Khách hẹn tới', tone: 'ok' }]} />
    </Block>
  </>
}

/** Nhân sự: hiệu suất (chọn KTV hoặc Lễ tân) · lương · đào tạo */
export function StaffPerf({ back }: { back: () => void }) {
  const { s } = useStore()
  const [role, setRole] = useState<'ktv' | 'reception'>('ktv')
  const ppl = s.staff.filter(x => x.role === role)
  const [id, setId] = useState(ppl[0]?.id ?? '')
  const cur = ppl.some(p => p.id === id) ? id : ppl[0]?.id
  return <>
    <SubHead title="Hiệu suất nhân sự" sub="Chọn kĩ thuật viên hoặc lễ tân · mục chưa có dữ liệu ghi Chưa nối" onBack={back} />
    <Seg value={role} onChange={r => { setRole(r); setId('') }} items={[{ k: 'ktv', label: 'Kĩ thuật viên' }, { k: 'reception', label: 'Lễ tân' }]} />
    <StaffCompare key={role} role={role} lockRole />
    <div className="sec-title"><span className="eyebrow">Chi tiết từng người · hôm nay {D.dateShort()}</span></div>
    <select className="inp" value={cur} onChange={e => setId(e.target.value)} aria-label="Chọn nhân sự">{ppl.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    {cur && <PerfView id={cur} extra />}
  </>
}
export function PerfView({ id, extra }: { id: string; extra?: boolean }) {
  const { s } = useStore()
  return <>{ktvPerf(s, id, extra).map(g => <Block key={g.g} title={g.g}><div className="card list">{g.rows.map(r => <div key={r.t} className="item"><div className="body"><div className="t">{r.t}</div></div>{r.v === null ? <Pill>Chưa nối</Pill> : <span className="num strong">{r.v}</span>}</div>)}</div></Block>)}</>
}
export function SalaryPage({ back }: { back: () => void }) {
  const { s } = useStore()
  return <>
    <SubHead title="Lương" sub="Bảng lương nhân sự từng tháng — chỉ Leader/CEO xem" onBack={back} />
    <div className="card list">{s.staff.filter(x => x.role === 'ktv' || x.role === 'reception').map(x => <div key={x.id} className="item"><Av name={x.name} /><div className="body"><div className="t">{x.name}</div><div className="d">{D.ROLE_LABEL[x.role]} · lương cơ bản · công thực tế · hoa hồng · thưởng/phạt</div></div><Pill>Chưa nối</Pill></div>)}</div>
    <div className="note small">Lương cơ sở lễ tân nhập ở "Chi tiêu vận hành"; công thức lương chờ CEO cài (⑨ Dòng tiền & lương).</div>
  </>
}
export function TrainTree({ back }: { back: () => void }) {
  const [r, setR] = useState<'ktv' | 'reception'>('ktv')
  return <>
    <SubHead title="Đào tạo" sub="Kĩ thuật viên / lễ tân → chuyên môn · sale · văn hóa · kĩ năng mềm" onBack={back} />
    <Seg value={r} onChange={setR} items={[{ k: 'ktv', label: 'Kĩ thuật viên' }, { k: 'reception', label: 'Lễ tân' }]} />
    <div className="card list">{['Chuyên môn', 'Sale', 'Văn hóa', 'Kĩ năng mềm'].map(t => <div key={t} className="item"><div className="body"><div className="t">{t}</div><div className="d">{t === 'Chuyên môn' ? D.SOPS.map(x => x.title).slice(0, 3).join(' · ') : 'Khóa học · bài test · kết quả'}</div></div><Pill>Chưa nối</Pill></div>)}</div>
  </>
}
export const leaderAlertsCount = (s: ReturnType<typeof useStore>['s']) => alerts(s).length
