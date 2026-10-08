// m4 — Mục KHÁCH HÀNG của KTV: Khách hàng của tôi + Khách Home Spa (khách Việt / nước ngoài).
// Bảo mật: KTV không thấy SĐT, địa chỉ, tổng đã trả; tìm/lọc chỉ theo mã/tên trong tập khách của mình (G4).
import { useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { T } from '../i18n'
import { ktvCustomers, pointsOf, sortByBudget, closedSplit, filterByRange, customerSegments, pkgFileOf, isUnhappy, KtvTab, SegFilter, PkgFile } from '../logic'
import { Hero, Nodes, SubHead, Tiles, Seg, Empty, Av, Pill } from '../ui'

type P = { back: () => void }
const C = T.cust

/** Tab dưới "Khách hàng" của KTV: 2 nút lớn */
export function KtvCustTab({ sub }: { sub: string[] }) {
  const { go, user } = useStore()
  if (user.role !== 'ktv') return <Empty>{C.noAccess}</Empty>
  if (sub[0] === 'mine') return <KtvCustomersPage back={() => go('cust')} />
  if (sub[0] === 'all') return <KtvHomeSpaPage back={() => go('cust')} />
  return <>
    <Hero tag={C.tabTitle} title={C.tabTitle} sub={C.tabSub} />
    <Nodes items={[{ t: C.mine, d: C.mineDesc, onClick: () => go('cust/mine') }, { t: C.all, d: C.allDesc, onClick: () => go('cust/all') }]} />
  </>
}

/** Một dòng khách cho KTV: không SĐT, không địa chỉ, tiền chỉ Ngân sách */
function KtvRow({ c, extra }: { c: D.Customer; extra?: string }) {
  const { openCustomer } = useStore()
  const p = c.packages[0]
  const pk = p ? ` · ${p.cardCode} ${p.type === 'session' ? C.left(D.pkgLeft(p)) : C.moneyCard}` : ' · khách lẻ'
  return <button className="item" data-testid="cust-row" onClick={() => openCustomer(c.id)}><Av name={c.name} /><div className="body">
    <div className="t">{c.name} <span className="tiny muted">· mã {c.code}</span></div>
    <div className="d">{C.budget}: {c.budget != null ? D.vnd(c.budget) : C.noBudget} · {C.times(c.visits)} · {C.lastVisit(c.lastVisitDays)}{pk}{extra ? ` · ${extra}` : ''}{c.health ? ` · ${c.health}` : ''}</div>
  </div>{c.vip && <Pill tone="yellow">VIP</Pill>}</button>
}

const viDate = (iso: string) => { const [y, m, d] = iso.split('-'); return y && m && d ? `${+d}/${+m}/${y}` : '' }

// ── 1. Khách hàng của tôi ──
export function KtvCustomersPage({ back }: P) {
  const { s, me } = useStore()
  const [tab, setTab] = useState<KtvTab>('cared')
  const [kind, setKind] = useState<'all' | 'le' | 'lt'>('all')
  const [minTimes, setMinTimes] = useState(1)
  const [closedSub, setClosedSub] = useState<'all' | 'le' | 'renew'>('all')
  const [a, setA] = useState(''), [b, setB] = useState('')
  const kc = ktvCustomers(s, me)
  const caredIds = kc.cared, reqIds = kc.requested, closed = kc.closed
  const split = closedSplit(s, me)
  const base = tab === 'cared' ? s.customers.filter(c => caredIds.has(c.id)) : tab === 'req' ? s.customers.filter(c => reqIds.has(c.id))
    : closedSub === 'le' ? split.le : closedSub === 'renew' ? split.renew : closed
  const ranged = filterByRange(s, me, base, tab, a, b)
  const list = sortByBudget(ranged.list.filter(c => (kind === 'all' || (kind === 'lt') === c.packages.length > 0) && c.visits >= minTimes))
  const all = s.customers.filter(c => caredIds.has(c.id)).length
  return <>
    <SubHead title="Khách hàng của tôi" sub="SĐT khách được ẩn với KTV. Doanh thu theo tệp khách chỉ CEO xem." onBack={back} />
    <Tiles items={[{ v: all, l: 'KH tôi đã chăm sóc', onClick: () => setTab('cared') }, { v: reqIds.size, l: 'KH yêu cầu tôi', s: all ? `tỉ suất ${Math.round(reqIds.size / all * 100)}%` : undefined, tone: 'ok', onClick: () => setTab('req') }, { v: closed.length, l: 'KH tôi chốt liệu trình', onClick: () => setTab('closed') }, { v: pointsOf(s, me.id), l: 'Điểm uy tín' }]} />
    <Seg value={tab} onChange={setTab} items={[{ k: 'cared', label: 'Tôi đã chăm sóc' }, { k: 'req', label: 'Yêu cầu tôi' }, { k: 'closed', label: 'Tôi chốt liệu trình' }]} />
    {tab === 'closed' && <div className="frow">
      <button className={`btn sm${closedSub === 'le' ? ' pri' : ''}`} aria-pressed={closedSub === 'le'} onClick={() => setClosedSub(closedSub === 'le' ? 'all' : 'le')}>{C.closedLe} <span className="badge">{split.le.length}</span></button>
      <button className={`btn sm${closedSub === 'renew' ? ' pri' : ''}`} aria-pressed={closedSub === 'renew'} onClick={() => setClosedSub(closedSub === 'renew' ? 'all' : 'renew')}>{C.closedRenew} <span className="badge">{split.renew.length}</span></button>
    </div>}
    <div className="frow"><Seg value={kind} onChange={setKind} items={[{ k: 'all', label: 'Tất cả' }, { k: 'le', label: 'Khách lẻ' }, { k: 'lt', label: 'Liệu trình' }]} />
      <label className="frow small muted">Số lần ≥<input className="inp num" type="number" min={1} value={minTimes} onChange={e => setMinTimes(Math.max(1, +e.target.value || 1))} style={{ width: 70 }} /></label></div>
    <div className="frow small">
      <span className="muted">{C.range}</span>
      <input className="inp" type="date" aria-label={C.rangeFrom} value={a} onChange={e => setA(e.target.value)} />
      <span>→</span>
      <input className="inp" type="date" aria-label={C.rangeTo} value={b} onChange={e => setB(e.target.value)} />
      {(a || b) && <button className="btn sm" onClick={() => { setA(''); setB('') }}>{C.rangeClear}</button>}
      {a && b && !ranged.error && <span className="muted">{viDate(a)}–{viDate(b)}</span>}
    </div>
    {ranged.error && <div className="err small" role="alert">{ranged.error}</div>}
    <div className="card list">{list.map(c => <KtvRow key={c.id} c={c} />)}
      {!list.length && <Empty>Chưa có khách trong mục này</Empty>}</div>
  </>
}

// ── 2. Khách Home Spa (chỉ khách liên quan KTV — G4) ──
export function KtvHomeSpaPage({ back }: P) {
  const { s, me } = useStore()
  const [group, setGroup] = useState<'VN' | 'NN'>('VN')
  const [kind, setKind] = useState<'le' | 'lt'>('le')
  const [f, setF] = useState<SegFilter>({})
  const set = (x: Partial<SegFilter>) => setF(o => ({ ...o, ...x }))
  const num = (v: string) => (v.trim() === '' ? undefined : Math.max(0, +v || 0))
  const list = customerSegments(s, me, group, kind, f)
  const g4 = customerSegments(s, me, group, kind)
  const referrers = customerSegments(s, me, group, 'le')
  const sources = [...new Set(g4.map(c => c.source))]
  const files = C.files.map((l, i) => ({ l, k: (i + 1) as PkgFile, n: customerSegments(s, me, group, kind, { ...f, file: (i + 1) as PkgFile }).length }))
  const fileLabel = (c: D.Customer) => C.files.filter((_, i) => c.packages.some(p => pkgFileOf(p, (i + 1) as PkgFile))).join(', ')
  return <>
    <SubHead title={C.all} sub={C.allSub} onBack={back} />
    <Seg value={group} onChange={g => { setGroup(g); setF({}) }} items={[{ k: 'VN', label: C.vn }, { k: 'NN', label: C.nn }]} />
    <Seg value={kind} onChange={k => { setKind(k); setF({}) }} items={[{ k: 'le', label: C.le }, { k: 'lt', label: C.lt }]} />
    {kind === 'lt' && <div className="frow">
      <button className={`btn sm${!f.file ? ' pri' : ''}`} onClick={() => set({ file: undefined })}>{C.any}</button>
      {files.map(x => <button key={x.k} className={`btn sm${f.file === x.k ? ' pri' : ''}`} aria-pressed={f.file === x.k} onClick={() => set({ file: f.file === x.k ? undefined : x.k })}>{x.k}. {x.l} <span className="badge">{x.n}</span></button>)}
    </div>}
    <div className="card pad col small">
      <input className="inp" type="search" placeholder={kind === 'lt' ? C.searchCode : C.search} aria-label={kind === 'lt' ? C.searchCode : C.search} value={f.q ?? ''} onChange={e => set({ q: e.target.value })} />
      {kind === 'le' && <>
        <label className="frow">{C.visits}
          <select className="inp" value={f.visitsOp ?? ''} onChange={e => set({ visitsOp: (e.target.value || undefined) as SegFilter['visitsOp'] })}><option value="">{C.any}</option><option value="gte">{C.visitsGte}</option><option value="lte">{C.visitsLte}</option><option value="once">{C.visitsOnce}</option></select>
          {(f.visitsOp === 'gte' || f.visitsOp === 'lte') && <input className="inp num" type="number" min={1} aria-label={C.visits} value={f.visits ?? ''} onChange={e => set({ visits: num(e.target.value) })} style={{ width: 70 }} />}
        </label>
        <div className="frow"><label className="frow">{C.budgetMin}<input className="inp num" type="number" min={0} step={100000} value={f.budgetMin ?? ''} onChange={e => set({ budgetMin: num(e.target.value) })} style={{ width: 120 }} /></label>
          <label className="frow">{C.budgetMax}<input className="inp num" type="number" min={0} step={100000} value={f.budgetMax ?? ''} onChange={e => set({ budgetMax: num(e.target.value) })} style={{ width: 120 }} /></label></div>
        <label className="frow">{C.referral}
          <select className="inp" value={f.referrerId ?? ''} onChange={e => set({ referrerId: e.target.value || undefined })}><option value="">{C.any}</option>{referrers.map(c => <option key={c.id} value={c.id}>{c.name} · mã {c.code}</option>)}</select></label>
        <label className="frow">{C.source}
          <select className="inp" value={f.source ?? ''} onChange={e => set({ source: e.target.value || undefined })}><option value="">{C.any}</option>{sources.map(x => <option key={x} value={x}>{x}</option>)}</select></label>
      </>}
      <label className="frow">{C.away}
        <select className="inp" value={f.awayDays ?? ''} onChange={e => set({ awayDays: e.target.value ? +e.target.value : undefined })}><option value="">{C.any}</option>{[30, 60, 90].map(d => <option key={d} value={d}>{C.awayOpt(d)}</option>)}</select></label>
      <label className="frow">{C.bday}
        <select className="inp" value={f.birthMonth ?? ''} onChange={e => set({ birthMonth: e.target.value ? +e.target.value : undefined })}><option value="">{C.any}</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{C.month(i + 1)}</option>)}</select></label>
      <label className="check"><input type="checkbox" checked={!!f.unhappy} onChange={e => set({ unhappy: e.target.checked || undefined })} />{C.unhappy}</label>
      {group === 'NN' && <label className="check"><input type="checkbox" checked={!!f.departed} onChange={e => set({ departed: e.target.checked || undefined })} />{C.departed} <span className="tiny muted">({C.sample})</span></label>}
    </div>
    <div className="card list">{list.map(c => <KtvRow key={c.id} c={c} extra={[kind === 'lt' ? fileLabel(c) : '', isUnhappy(s, c) ? C.unhappy.toLowerCase() : '', c.departed ? C.departed.toLowerCase() : ''].filter(Boolean).join(' · ')} />)}
      {!list.length && <Empty>{C.empty}</Empty>}</div>
  </>
}

