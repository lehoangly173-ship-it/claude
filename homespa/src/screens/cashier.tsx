// Thu ngân — đã sửa: phải chọn đúng thẻ mới trừ, hóa đơn chỉ dùng thẻ = "Dùng liệu trình",
// dịch vụ lẻ phải thu đủ (chỉ gói mới được cọc), "đóng tiếp" tính trên số còn thiếu, hoa hồng chia đúng 100%.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { cust, waitingBills } from '../logic'
import { Icon, Pill, Stat, PageHeader, Seg, Modal, Empty } from '../ui'

const MAX_MANUAL_DISCOUNT = 0.2 // giảm tay tối đa 20%/dòng; hơn nữa phải qua chương trình/voucher đã được chị duyệt
// Giá trị giảm của từng mã; mã chỉ dùng được khi chương trình gắn mã đó đang chạy (đã được duyệt)
const VOUCHER_VALUE: Record<string, { kind: 'amount' | 'pct'; value: number }> = {
  SINHNHAT: { kind: 'amount', value: 100000 }, BANTHAN15: { kind: 'pct', value: 15 }, TRIAN1NAM: { kind: 'amount', value: 150000 },
}

export function CashierScreen() {
  const { s, draftBill, setDraftBill, user } = useStore()
  const [tab, setTab] = useState<'waiting' | 'invoices' | 'deposits' | 'cards'>('waiting')
  const [range, setRange] = useState<'day' | 'week' | 'month'>('day')
  const [editor, setEditor] = useState<{ customerId?: string; apptIds: string[]; continueCard?: string } | null>(null)
  const [opening, setOpening] = useState(false)
  const bills = waitingBills(s)
  useEffect(() => { if (draftBill) { const a = s.appts.find(x => x.id === draftBill); if (a) openFor(a.customerId); setDraftBill(null) } }, [draftBill])
  const openFor = (customerId: string) => setEditor({ customerId, apptIds: bills.filter(b => b.customerId === customerId).map(b => b.id) })
  const valid = s.invoices.filter(i => i.status !== 'Nháp' && i.status !== 'Đã xóa')
  const today = { confirmed: valid.length, collected: valid.reduce((t, i) => t + i.paid, 0) }
  const owedAll = s.customers.flatMap(c => c.packages).reduce((t, p) => t + D.pkgOwed(p), 0)
  const stats = range === 'day' ? { ...today, due: owedAll } : { confirmed: D.HISTORY[range].now.bookings, collected: D.HISTORY[range].now.revenue, due: owedAll }
  const byCustomer = Array.from(new Set(bills.map(b => b.customerId)))
  return <>
    <PageHeader eyebrow="Điều phối hôm nay" title="Thu ngân" sub="Thanh toán, hóa đơn, thẻ liệu trình"
      right={<>{user.role === 'ceo' && <button className="btn" onClick={() => setOpening(true)}>⇪ Số dư đầu kỳ</button>}{user.role === 'reception' && <button className="btn pri" onClick={() => setEditor({ apptIds: [] })}><Icon n="plus" />Tạo hóa đơn</button>}</>} />
    <Seg value={range} onChange={setRange} items={[{ k: 'day', label: 'Hôm nay' }, { k: 'week', label: '7 ngày' }, { k: 'month', label: 'Tháng này' }]} />
    <div className="grid g4">
      <Stat label="Chờ thanh toán" value={bills.length} tone="r-fg" sub="lượt phục vụ xong" />
      <Stat label={range === 'day' ? 'Hóa đơn đã xác nhận' : 'Lượt phục vụ'} value={stats.confirmed} tone="g-fg" sub={range === 'day' ? 'hôm nay' : D.SAMPLE_NOTE} />
      <Stat label="Tiền đã thu" value={D.vndShort(stats.collected)} tone="gold" sub={range === 'day' ? 'tiền mặt · CK · thẻ NH' : D.SAMPLE_NOTE} />
      <Stat label="Còn phải thu (gói)" value={D.vndShort(stats.due)} tone="y-fg" sub="cọc & còn thiếu" />
    </div>
    <Seg value={tab} onChange={setTab} items={[{ k: 'waiting', label: 'Chờ thanh toán', badge: bills.length }, { k: 'invoices', label: 'Hóa đơn' }, { k: 'deposits', label: 'Cọc & còn thiếu' }, { k: 'cards', label: 'Thẻ liệu trình' }]} />
    {tab === 'waiting' && <div className="card list">{byCustomer.map(cid => { const mine = bills.filter(b => b.customerId === cid); const c = cust(s, cid)
      return <div key={cid} className="item"><div className="body"><div className="t">{c.name} <span className="muted tiny">· {c.code}</span></div><div className="d">{mine.map(b => `${D.svc(b.serviceId).name} · KTV ${D.staffName(b.ktvId)} · xong ${D.hhmm(b.finishedAt ?? b.end)}`).join(' | ')}</div>
        {c.packages.some(p => D.pkgLeft(p) > 0) && <div className="tiny" style={{ color: 'var(--g-fg)' }}>Có thẻ liệu trình còn {c.packages.filter(p => D.pkgLeft(p) > 0).map(D.pkgLeftLabel).join(', ')}</div>}</div>
        <span className="strong num hide-m">{D.vnd(mine.reduce((t, b) => t + D.svc(b.serviceId).price, 0))}</span>{user.role === 'reception' && <button className="btn sm gold" onClick={() => openFor(cid)}>Thu tiền</button>}</div> })}
      {!bills.length && <Empty>Đã thu hết — không còn khách chờ thanh toán</Empty>}</div>}
    {tab === 'invoices' && <InvoiceList />}
    {tab === 'deposits' && <div className="grid g2">{s.customers.flatMap(c => c.packages.filter(p => D.pkgOwed(p) > 0).map(p => ({ c, p }))).map(({ c, p }) => { const pct = Math.round(D.pkgPaid(p) / p.finalPrice * 100)
      return <div key={p.cardCode} className="card pad col"><div className="row"><b>{c.name}</b><span className="muted small">mã {c.code}</span><span className="right-al strong num" style={{ color: 'var(--r-fg)' }}>Thiếu {D.vnd(D.pkgOwed(p))}</span></div>
        <div className="small muted">{p.name} · thẻ {p.cardCode}</div><div className="bar"><i style={{ width: pct + '%' }} /></div><div className="row tiny muted">Đã đóng {D.vnd(D.pkgPaid(p))} / {D.vnd(p.finalPrice)} ({pct}%){user.role === 'reception' && <button className="btn sm right-al" onClick={() => setEditor({ customerId: c.id, apptIds: [], continueCard: p.cardCode })}>Thu thêm cho gói</button>}</div></div> })}
      {!owedAll && <Empty>Không có gói còn thiếu tiền</Empty>}</div>}
    {tab === 'cards' && <div className="card tbl-wrap"><table className="resp"><thead><tr><th>Mã thẻ</th><th>Khách</th><th>Gói</th><th>Còn lại</th><th>Hạn</th><th>Người chốt</th><th>Giá</th></tr></thead><tbody>
      {s.customers.flatMap(c => c.packages.map(p => ({ c, p }))).map(({ c, p }) => <tr key={p.cardCode}><td className="strong">{p.cardCode}</td><td>{c.name}</td><td className="full">{p.name}{p.renewalOf && <span className="muted tiny"> · tái tục {p.renewalOf}</span>}</td><td><Pill tone={D.pkgLeft(p) <= (p.type === 'session' ? 2 : 500000) ? 'red' : 'green'}>{D.pkgLeftLabel(p)}</Pill></td><td className="num">{p.expiry}</td><td>{D.staffName(p.closer) !== '—' ? D.staffName(p.closer) : p.closer}</td><td className="num">{D.vnd(p.finalPrice)}</td></tr>)}</tbody></table></div>}
    {editor && <InvoiceEditor init={editor} onClose={() => setEditor(null)} />}
    {opening && <OpeningModal onClose={() => setOpening(false)} />}
  </>
}

function InvoiceList() {
  const { s, requestInvoiceDelete, user } = useStore()
  const [open, setOpen] = useState<D.Invoice | null>(null)
  const [reason, setReason] = useState('')
  const tone: Record<string, any> = { 'Đã thu đủ': 'green', 'Thu một phần': 'yellow', 'Chưa thu': 'red', 'Dùng liệu trình': 'purple', 'Nháp': 'grey', 'Đã xóa': 'grey' }
  const pending = (code: string) => s.approvals.some(a => a.refId === code && a.status === 'Chờ duyệt')
  return <>
    <div className="card tbl-wrap"><table className="resp"><thead><tr><th>Mã HĐ</th><th>Khách</th><th>Tổng</th><th>Đã thu</th><th>Trạng thái</th><th>Tạo lúc</th></tr></thead><tbody>
      {s.invoices.map(i => <tr key={i.code} onClick={() => { setOpen(i); setReason('') }} style={{ cursor: 'pointer', opacity: i.status === 'Đã xóa' ? .55 : 1 }}><td className="strong">{i.code}</td><td>{cust(s, i.customerId).name}</td><td className="num">{D.vnd(i.total)}</td><td className="num">{D.vnd(i.paid)}</td><td><Pill tone={tone[i.status]}>{i.status}</Pill></td><td className="num small muted">{i.createdAt} · {i.creator}</td></tr>)}
    </tbody></table></div>
    {open && <Modal title={`Hóa đơn ${open.code}`} onClose={() => setOpen(null)}>
      <div className="row"><b>{cust(s, open.customerId).name}</b><Pill tone={tone[open.status]}>{open.status}</Pill></div>
      {open.lines.map((l, i) => <div key={i} className="row small"><span>{D.svc(l.serviceId).name} · KTV {D.staffName(l.ktvId)}</span><span className="right-al num">{l.cardCode ? `Trừ thẻ ${l.cardCode}` : D.vnd(l.price - l.discount)}</span></div>)}
      {open.pkgSale && <div className="row small"><span>{open.pkgSale.mode === 'continue' ? 'Đóng tiếp' : open.pkgSale.mode === 'renew' ? 'Tái tục' : 'Bán gói'} · {open.pkgSale.name} ({open.pkgSale.cardCode})</span><span className="right-al num">{D.vnd(open.pkgSale.price)}</span></div>}
      <div className="row"><b>Tổng {D.vnd(open.total)}</b><span className="right-al">Đã thu <b className="num">{D.vnd(open.paid)}</b></span></div>
      <div className="eyebrow">Nhật ký thao tác (không xóa được)</div>
      {open.log.map((l, i) => <div key={i} className="tiny">{l.at} · {l.by}: {l.text}</div>)}
      {user.role === 'reception' && open.status !== 'Đã xóa' && (pending(open.code) ? <div className="warn">Đang chờ chị duyệt xóa</div> : <div className="row"><input id="del-reason" className="inp" style={{ flex: 1 }} value={reason} onChange={e => setReason(e.target.value)} placeholder="Lý do xóa (bắt buộc)" /><button className="btn danger" disabled={!reason.trim()} onClick={() => { requestInvoiceDelete(open.code, reason.trim()); setOpen(null) }}>Xin xóa mềm</button></div>)}
      <div className="tiny muted">Xóa là xóa mềm: hóa đơn vẫn lưu, CEO xem được nội dung và lịch sử.</div>
    </Modal>}
  </>
}

type Line = D.InvoiceLine & { key: number }
function InvoiceEditor({ init, onClose }: { init: { customerId?: string; apptIds: string[]; continueCard?: string }; onClose: () => void }) {
  const { s, confirmInvoice, addCustomer, me } = useStore()
  const [customerId, setCustomerId] = useState(init.customerId ?? '')
  const [q, setQ] = useState('')
  const c = customerId ? cust(s, customerId) : null
  const [lines, setLines] = useState<Line[]>(() => init.apptIds.map((id, i) => { const a = s.appts.find(x => x.id === id)!; return { key: i, serviceId: a.serviceId, ktvId: a.ktvId, price: D.svc(a.serviceId).price, discount: 0, apptId: a.id } }))
  const [mode, setMode] = useState<'none' | 'new' | 'renew' | 'continue'>(init.continueCard ? 'continue' : 'none')
  const [cat, setCat] = useState('p10'); const catObj = D.PACKAGE_CATALOG.find(p => p.id === cat)!
  const [cardCode, setCardCode] = useState(''); const [pkgDiscount, setPkgDiscount] = useState(0)
  const [renewOf, setRenewOf] = useState(''); const [contCard, setContCard] = useState(init.continueCard ?? '')
  const [closer, setCloser] = useState(me.id); const [helper, setHelper] = useState(''); const [split, setSplit] = useState(100)
  const [voucher, setVoucher] = useState(''); const [pays, setPays] = useState<{ method: D.PayMethod; amount: number }[]>([{ method: 'Tiền mặt', amount: 0 }])
  const [pkgCollect, setPkgCollect] = useState(0)
  const [err, setErr] = useState<string | null>(null)

  const setLine = (k: number, p: Partial<Line>) => setLines(ls => ls.map(l => (l.key === k ? { ...l, ...p } : l)))
  const usable = (serviceId: string, price: number, key: number) => (c?.packages ?? []).filter(p => {
    if (!D.pkgUsable(p, serviceId)) return false
    const usedHere = lines.filter(l => l.key !== key && l.cardCode === p.cardCode).reduce((t, l) => t + (p.type === 'session' ? 1 : l.price), 0)
    return p.type === 'session' ? D.pkgLeft(p) - usedHere >= 1 : D.pkgLeft(p) - usedHere >= price
  })
  const vCode = voucher.trim().toUpperCase()
  const vProg = s.programs.find(p => p.voucher === vCode)
  const v = vProg && vProg.status === 'Đang chạy' && VOUCHER_VALUE[vCode] ? { ...VOUCHER_VALUE[vCode], label: vProg.name, program: vProg.id } : undefined
  const retail = lines.filter(l => !l.cardCode).reduce((t, l) => t + Math.max(0, l.price - l.discount), 0)
  const vDisc = !v ? 0 : v.kind === 'amount' ? Math.min(v.value, retail) : Math.round(retail * v.value / 100)
  const svcPayable = retail - vDisc
  const contPkg = c?.packages.find(p => p.cardCode === contCard)
  const pkgPrice = mode === 'new' || mode === 'renew' ? Math.max(0, catObj.listPrice - pkgDiscount) : 0
  const pkgDueNow = mode === 'continue' ? (contPkg ? D.pkgOwed(contPkg) : 0) : pkgPrice
  const total = svcPayable + pkgDueNow
  const paid = pays.reduce((t, p) => t + (p.amount || 0), 0)
  const hasPkg = mode !== 'none'
  const svcCollect = hasPkg ? paid - pkgCollect : paid
  const cardOnly = lines.length > 0 && lines.every(l => l.cardCode) && !hasPkg
  const status: D.InvoiceStatus = total === 0 && cardOnly ? 'Dùng liệu trình' : paid >= total && total > 0 ? 'Đã thu đủ' : paid > 0 ? 'Thu một phần' : 'Chưa thu'
  useEffect(() => { if (!hasPkg) setPkgCollect(0) }, [hasPkg])
  const fillExact = () => { setPays([{ method: pays[0].method, amount: total }]); if (hasPkg) setPkgCollect(pkgDueNow) }

  const problem = useMemo((): string | null => {
    if (!c) return 'Chưa chọn khách hàng'
    if (!lines.length && !hasPkg) return 'Hóa đơn trống — thêm dịch vụ hoặc chọn gói'
    const over = lines.find(l => !l.cardCode && l.discount > l.price * MAX_MANUAL_DISCOUNT)
    if (over) return `Giảm tay quá ${MAX_MANUAL_DISCOUNT * 100}% (${D.svc(over.serviceId).name}) — ưu đãi ngoài khung phải qua chương trình/voucher đã được chị duyệt`
    if (vCode && !v) return vProg ? `Chương trình "${vProg.name}" ${vProg.status === 'Đã kết thúc' ? 'đã kết thúc' : 'chưa được duyệt'} — không dùng được mã` : 'Mã voucher không tồn tại'
    if (mode === 'new' || mode === 'renew') {
      if (!cardCode.trim()) return 'Chưa nhập mã thẻ cho gói mới'
      if (s.customers.some(x => x.packages.some(p => p.cardCode === cardCode.trim()))) return `Mã thẻ ${cardCode.trim()} đã tồn tại`
      if (pkgPrice <= 0) return 'Giá gói bằng 0 — cần chị duyệt trước'
      if (pkgDiscount > catObj.listPrice * MAX_MANUAL_DISCOUNT) return 'Giảm giá gói vượt khung — gửi chị duyệt trước'
      if (helper && (split <= 0 || split >= 100)) return 'Có người hỗ trợ thì tỷ lệ người chốt phải từ 1–99%'
    }
    if (mode === 'renew' && !renewOf) return 'Chọn gói cũ để tái tục'
    if (mode === 'continue' && (!contPkg || D.pkgOwed(contPkg) <= 0)) return 'Chọn gói còn thiếu tiền'
    if (pays.some(p => p.amount < 0)) return 'Số tiền không được âm'
    if (paid > total) return `Thu thừa ${D.vnd(paid - total)} — kiểm tra lại`
    if (hasPkg && (pkgCollect < 0 || pkgCollect > pkgDueNow)) return 'Tiền phân bổ cho gói vượt số phải đóng'
    if (hasPkg && svcCollect > svcPayable) return `Phân bổ cho dịch vụ lẻ thừa ${D.vnd(svcCollect - svcPayable)} — tăng phần thu cho gói`
    if (svcCollect < svcPayable) return `Dịch vụ lẻ phải thu đủ ${D.vnd(svcPayable)} (đang phân bổ ${D.vnd(Math.max(0, svcCollect))}). Chỉ gói mới được cọc / đóng một phần`
    return null
  }, [c, lines, hasPkg, voucher, v, mode, cardCode, pkgPrice, pkgDiscount, helper, split, renewOf, contPkg, pays, paid, total, pkgCollect, pkgDueNow, svcCollect, svcPayable, s.customers, catObj])

  const sent = useRef(false)
  const submit = (draft: boolean) => {
    if (sent.current) return
    if (!draft && problem) return setErr(problem)
    if (!c) return setErr('Chưa chọn khách hàng')
    const today = D.dateShort(); const exp = new Date(D.TODAY); exp.setMonth(exp.getMonth() + catObj.months)
    const pkgNew: D.Package | undefined = (mode === 'new' || mode === 'renew') ? { cardCode: cardCode.trim(), catalogId: cat, name: catObj.name, type: catObj.type, group: catObj.group, buyDate: today, expiry: D.dateShort(exp), finalPrice: pkgPrice, closer: helper ? `${D.staffName(closer)} ${split}% · ${D.staffName(helper)} ${100 - split}%` : closer, renewalOf: mode === 'renew' ? renewOf : undefined, sessions: catObj.sessions, bonus: catObj.bonus, used: 0, value: catObj.value, bonusValue: catObj.bonusValue, valueUsed: 0, payments: [], usage: [] } : undefined
    sent.current = true
    confirmInvoice({ customerId: c.id, voucherProgramId: v?.program, voucherDiscount: vDisc, pkgCollect: draft ? 0 : pkgCollect, status: draft ? 'Nháp' : status, lines: lines.map(({ key, ...l }) => l), total, paid: draft ? 0 : paid, payments: pays.filter(p => p.amount > 0), voucher: v ? v.label : undefined,
      pkgSale: mode === 'none' ? undefined : mode === 'continue' ? { cardCode: contCard, name: contPkg?.name ?? '', price: pkgDueNow, mode } : { cardCode: cardCode.trim(), name: catObj.name, price: pkgPrice, mode } }, draft ? undefined : pkgNew, draft ? 0 : pkgCollect)
    onClose()
  }
  const matches = !c && q.trim() ? s.customers.filter(x => x.name.toLowerCase().includes(q.toLowerCase()) || x.code.toLowerCase() === q.toLowerCase() || x.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))).slice(0, 5) : []

  return <Modal wide title="Hóa đơn thanh toán" onClose={onClose} footer={<>
    <span className="small muted" style={{ marginRight: 'auto' }}>Người tạo: {me.name} · {D.hhmm(s.now)}</span>
    <button className="btn" onClick={() => submit(true)} disabled={!c}>Lưu nháp</button>
    <button className="btn pri" onClick={() => submit(false)} disabled={!!problem}>{status === 'Dùng liệu trình' ? 'Xác nhận trừ liệu trình' : paid > 0 ? `Xác nhận thu ${D.vnd(paid)}` : 'Xác nhận — chưa thu'}</button></>}>
    {/* A. Khách */}
    <div className="col"><span className="eyebrow">A · Khách hàng</span>
      {c ? <div className="row"><b>{c.name}</b><span className="muted small">mã {c.code} · {c.visits} lượt</span>{c.packages.map(p => <Pill key={p.cardCode} tone="brown">{p.cardCode}: còn {D.pkgLeftLabel(p)}</Pill>)}{!init.customerId && <button className="link small" onClick={() => setCustomerId('')}>Đổi</button>}</div>
        : <><div className="row"><input id="ie-q" className="inp" style={{ flex: 1 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm mã khách, tên hoặc SĐT" />{q.trim() && !matches.length && <button className="btn" onClick={() => { const nc = addCustomer({ name: q.trim(), phone: '', group: 'VN', source: 'Chưa xác định' }); if (typeof nc !== 'string') setCustomerId(nc.id) }}>Tạo khách mới "{q.trim()}"</button>}</div>
          {matches.map(x => <button key={x.id} className="btn sm" onClick={() => setCustomerId(x.id)}>{x.name} · {x.code}</button>)}</>}
    </div>
    {/* B. Dịch vụ */}
    <div className="col"><span className="eyebrow">B · Dịch vụ</span>
      {!lines.length && <div className="muted small">Chưa có dịch vụ. Nếu khách chỉ mua / đóng tiền gói thì bỏ qua phần này.</div>}
      {lines.map(l => { const cards = usable(l.serviceId, l.price, l.key); const chosen = c?.packages.find(p => p.cardCode === l.cardCode)
        return <div key={l.key} className="card pad grid g4" style={{ alignItems: 'end' }}>
          <label className="f">Dịch vụ<select className="inp" value={l.serviceId} disabled={!!l.apptId} onChange={e => setLine(l.key, { serviceId: e.target.value, price: D.svc(e.target.value).price, cardCode: undefined })}>{D.SERVICES.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="f">KTV thực hiện<select className="inp" value={l.ktvId} disabled={!!l.apptId} onChange={e => setLine(l.key, { ktvId: e.target.value })}>{D.ktvs().map(k => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label>
          <label className="f">Thanh toán bằng<select className="inp" value={l.cardCode ?? ''} onChange={e => setLine(l.key, { cardCode: e.target.value || undefined, discount: 0 })}><option value="">Trả tiền ({D.vnd(l.price)})</option>{cards.map(p => <option key={p.cardCode} value={p.cardCode}>Thẻ {p.cardCode} · còn {D.pkgLeftLabel(p)}</option>)}</select></label>
          {l.cardCode ? <div className="small">Trừ {chosen?.type === 'session' ? '1 buổi' : D.vnd(l.price)} · còn lại sau: <b>{chosen && (chosen.type === 'session' ? `${D.pkgLeft(chosen) - lines.filter(x => x.cardCode === chosen.cardCode).length} buổi` : D.vnd(D.pkgLeft(chosen) - lines.filter(x => x.cardCode === chosen.cardCode).reduce((t, x) => t + x.price, 0)))}</b></div>
            : <label className="f">Giảm tay (≤ 20%)<input className="inp num" type="number" min={0} step={10000} value={l.discount} onChange={e => setLine(l.key, { discount: Math.max(0, +e.target.value) })} /></label>}
          {!l.apptId && <button className="link small" onClick={() => setLines(ls => ls.filter(x => x.key !== l.key))}>✕ Bỏ dòng</button>}
        </div> })}
      <div><button className="btn sm" onClick={() => setLines(ls => [...ls, { key: Date.now(), serviceId: 'm60', ktvId: D.ktvs()[0].id, price: D.svc('m60').price, discount: 0 }])}><Icon n="plus" />Thêm dịch vụ</button></div>
    </div>
    {/* C. Gói */}
    <div className="col"><span className="eyebrow">C · Gói liệu trình</span>
      <Seg value={mode} onChange={setMode} items={[{ k: 'none', label: 'Không' }, { k: 'new', label: 'Bán gói mới' }, { k: 'renew', label: 'Tái tục' }, { k: 'continue', label: 'Đóng tiếp' }]} />
      {(mode === 'new' || mode === 'renew') && <div className="grid g3">
        {mode === 'renew' && <label className="f">Gói cũ<select id="ie-renew" className="inp" value={renewOf} onChange={e => setRenewOf(e.target.value)}><option value="">— chọn —</option>{c?.packages.map(p => <option key={p.cardCode} value={p.cardCode}>{p.cardCode} · còn {D.pkgLeftLabel(p)}</option>)}</select></label>}
        <label className="f">Gói<select id="ie-cat" className="inp" value={cat} onChange={e => setCat(e.target.value)}>{D.PACKAGE_CATALOG.map(p => <option key={p.id} value={p.id}>{p.name} · {D.vndShort(p.listPrice)}</option>)}</select></label>
        <label className="f">Mã thẻ (khác mã khách)<input id="ie-card" className="inp" value={cardCode} onChange={e => setCardCode(e.target.value)} placeholder="VD: LT-0250" /></label>
        <label className="f">Giảm giá gói (≤ 20%)<input id="ie-pdisc" className="inp num" type="number" min={0} step={100000} value={pkgDiscount} onChange={e => setPkgDiscount(Math.max(0, +e.target.value))} /></label>
        <label className="f">Người chốt chính<select id="ie-closer" className="inp" value={closer} onChange={e => setCloser(e.target.value)}>{s.staff.filter(x => x.role !== 'ceo').map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="f">Người hỗ trợ<select id="ie-helper" className="inp" value={helper} onChange={e => { setHelper(e.target.value); setSplit(e.target.value ? 70 : 100) }}><option value="">Không</option>{s.staff.filter(x => x.id !== closer && x.role !== 'ceo').map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        {helper && <label className="f">Tỷ lệ người chốt (%)<input id="ie-split" className="inp num" type="number" min={1} max={99} value={split} onChange={e => setSplit(+e.target.value)} /></label>}
        <div className="small" style={{ gridColumn: '1 / -1' }}>{catObj.type === 'session' ? `${catObj.sessions} buổi + tặng ${catObj.bonus}` : `Giá trị ${D.vnd(catObj.value!)} + tặng ${D.vnd(catObj.bonusValue!)}`} · hạn {catObj.months} tháng · giá bán <b>{D.vnd(pkgPrice)}</b>{helper && ` · hoa hồng chia ${split}% / ${100 - split}%`}</div>
      </div>}
      {mode === 'continue' && <label className="f">Gói còn thiếu<select id="ie-cont" className="inp" value={contCard} onChange={e => setContCard(e.target.value)}><option value="">— chọn —</option>{c?.packages.filter(p => D.pkgOwed(p) > 0).map(p => <option key={p.cardCode} value={p.cardCode}>{p.cardCode} · thiếu {D.vnd(D.pkgOwed(p))}</option>)}</select></label>}
    </div>
    {/* D. Thanh toán */}
    <div className="col"><span className="eyebrow">D · Thanh toán</span>
      <div className="grid g3"><label className="f">Voucher (nếu có)<input id="ie-voucher" className="inp" value={voucher} onChange={e => setVoucher(e.target.value)} placeholder="VD: SINHNHAT" /></label>
        {v && <div className="ok small" style={{ alignSelf: 'end' }}>{v.label} · giảm {D.vnd(vDisc)}</div>}</div>
      {pays.map((p, i) => <div key={i} className="row"><select className="inp" style={{ width: 170 }} value={p.method} onChange={e => setPays(ps => ps.map((x, j) => (j === i ? { ...x, method: e.target.value as D.PayMethod } : x)))}>{(['Tiền mặt', 'Chuyển khoản', 'Thẻ ngân hàng'] as D.PayMethod[]).map(m => <option key={m}>{m}</option>)}</select>
        <input className="inp num" style={{ flex: 1, minWidth: 120 }} type="number" min={0} step={10000} value={p.amount} onChange={e => setPays(ps => ps.map((x, j) => (j === i ? { ...x, amount: +e.target.value } : x)))} />
        {pays.length > 1 && <button className="link" onClick={() => setPays(ps => ps.filter((_, j) => j !== i))}>✕</button>}</div>)}
      <div className="row"><button className="btn sm" onClick={() => setPays(ps => [...ps, { method: 'Chuyển khoản', amount: 0 }])}>+ Chia phương thức</button><button className="btn sm" onClick={fillExact}>Điền đủ {D.vnd(total)}</button></div>
      {hasPkg && <label className="f">Trong đó thu cho gói<input id="ie-pkgc" className="inp num" type="number" min={0} step={100000} value={pkgCollect} onChange={e => setPkgCollect(Math.max(0, +e.target.value))} /></label>}
      <div className="card pad col small">
        <div className="row"><span>Dịch vụ lẻ</span><span className="right-al num">{D.vnd(retail)}</span></div>
        {vDisc > 0 && <div className="row"><span>Voucher</span><span className="right-al num">−{D.vnd(vDisc)}</span></div>}
        {hasPkg && <div className="row"><span>{mode === 'continue' ? 'Gói còn thiếu' : 'Giá gói'}</span><span className="right-al num">{D.vnd(pkgDueNow)}</span></div>}
        <div className="row strong"><span>Tổng phải thu</span><span className="right-al num">{D.vnd(total)}</span></div>
        <div className="row"><span>Thu lần này</span><span className="right-al num">{D.vnd(paid)}</span></div>
        {hasPkg && <div className="row muted"><span>Phân bổ: dịch vụ {D.vnd(Math.max(0, svcCollect))} · gói {D.vnd(pkgCollect)}</span><span className="right-al">Gói còn thiếu sau: {D.vnd(Math.max(0, pkgDueNow - pkgCollect))}</span></div>}
        <div className="row"><span>Trạng thái</span><span className="right-al"><Pill tone={status === 'Đã thu đủ' ? 'green' : status === 'Dùng liệu trình' ? 'purple' : status === 'Thu một phần' ? 'yellow' : 'red'}>{status}</Pill></span></div>
      </div>
      {problem ? <div className="err">{problem}</div> : <div className="ok">Sẵn sàng xác nhận. Thẻ chỉ bị trừ khi bấm xác nhận.</div>}
      {err && err !== problem && <div className="err">{err}</div>}
    </div>
  </Modal>
}

function OpeningModal({ onClose }: { onClose: () => void }) {
  const { s, importOpening } = useStore()
  const [cid, setCid] = useState(''); const [cat, setCat] = useState('p10'); const [card, setCard] = useState(''); const [used, setUsed] = useState(0); const [paidAmt, setPaid] = useState(0)
  const c = D.PACKAGE_CATALOG.find(x => x.id === cat)!
  const dup = s.customers.some(x => x.packages.some(p => p.cardCode === card.trim()))
  return <Modal title="Số dư đầu kỳ — chuyển từ hệ thống cũ" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn pri" disabled={!cid || !card.trim() || dup} onClick={() => { importOpening(cid, { cardCode: card.trim(), catalogId: cat, name: c.name, type: c.type, group: c.group, buyDate: 'Trước chuyển đổi', expiry: D.daysAhead(180), finalPrice: c.listPrice, closer: 'Hệ thống cũ', sessions: c.sessions, bonus: c.bonus, used: c.type === 'session' ? used : 0, value: c.value, bonusValue: c.bonusValue, valueUsed: c.type === 'money' ? used : 0, payments: paidAmt ? [{ at: 'Trước chuyển đổi', amount: paidAmt, method: 'Tiền mặt', by: 'Hệ thống cũ', invoice: 'Số dư đầu kỳ', kind: paidAmt >= c.listPrice ? 'Thanh toán đủ' : 'Cọc' }] : [], usage: [] }); onClose() }}>Lưu số dư</button></>}>
    <div className="warn small">Không tạo lượt phục vụ, hóa đơn hay tour. Tiền đã đóng trước ngày chuyển đổi không tính là doanh thu hôm nay và không sinh hoa hồng.</div>
    <div className="grid g2">
      <label className="f">Khách<select id="ob-c" className="inp" value={cid} onChange={e => setCid(e.target.value)}><option value="">— chọn —</option>{s.customers.map(x => <option key={x.id} value={x.id}>{x.name} · {x.code}</option>)}</select></label>
      <label className="f">Gói<select id="ob-p" className="inp" value={cat} onChange={e => setCat(e.target.value)}>{D.PACKAGE_CATALOG.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="f">Mã thẻ cũ<input id="ob-card" className="inp" value={card} onChange={e => setCard(e.target.value)} /></label>
      <label className="f">{c.type === 'session' ? 'Số buổi đã dùng' : 'Số tiền đã dùng'}<input id="ob-used" className="inp num" type="number" min={0} value={used} onChange={e => setUsed(+e.target.value)} /></label>
      <label className="f">Tiền đã đóng trước chuyển đổi<input id="ob-paid" className="inp num" type="number" min={0} value={paidAmt} onChange={e => setPaid(+e.target.value)} /></label>
    </div>
    {dup && <div className="err">Mã thẻ đã tồn tại</div>}
  </Modal>
}
