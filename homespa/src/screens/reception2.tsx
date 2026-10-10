// FIX LẦN 1 — Lễ tân: "Vận hành cơ sở – hoạt động đội nhóm" (Lark "FIX LẦN 1 APP LỄ TÂN")
// 8 nút: vệ sinh lao công · không gian trải nghiệm · vật tư (8 nút con) · thiết bị · sinh nhật/hoạt động · điểm uy tín · bàn giao ca · chi tiêu
import { useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { stockQty, heldBy, usage, buySuggest } from '../logic'
import { SubHead, Seg, Block, PhotoInput, Pill, Empty, Tiles, Thumb } from '../ui'

const AI_NOTE = 'Giả lập — Chưa nối AI thật'
const tone = (st?: string) => st === 'Đạt' || st === 'Đã duyệt' || st === 'Đồng ý' || st === 'Đã xử lý' ? 'green' : st?.startsWith('Không') || st === 'Từ chối' || st === 'Cần xử lý' ? 'red' : 'yellow'
const Hist = ({ rows, empty }: { rows: { k: string; t: string; d: string; st?: string; act?: React.ReactNode; photo?: string }[]; empty: string }) =>
  <div className="card list">{rows.map(r => <div key={r.k} className="item">{r.photo && <Thumb src={r.photo} />}<div className="body"><div className="t">{r.t}</div><div className="d">{r.d}</div></div>{r.act}{r.st && <Pill tone={tone(r.st)}>{r.st}</Pill>}</div>)}{!rows.length && <Empty>{empty}</Empty>}</div>

export function OpsBase2({ sub, sub2 }: { sub?: string; sub2?: string }) {
  const { go } = useStore()
  const i = Math.min(Math.max(Number(sub ?? 0) || 0, 0), D.OPS_ITEMS.length - 1)
  const item = D.OPS_ITEMS[i]
  const body = [<LaborPage />, <XpPage />, <StockPage tab={sub2} />, <ReqPage kind="Thiết bị" />, <ReqPage kind="Hoạt động" />, <PointsRec />, <HandoverPage />, <ExpensePage />][i]
  return <>
    <SubHead title={item} sub="Vận hành cơ sở – hoạt động đội nhóm" onBack={() => go('home')} />
    <div style={{ overflowX: 'auto' }}><Seg value={String(i)} onChange={v => go(`home/base/${v}`)} items={D.OPS_ITEMS.map((_, j) => ({ k: String(j), label: `${j + 1}` }))} /></div>
    {body}
  </>
}

// ① Kiểm tra vệ sinh lao công: Tầng 1/2/3/Sân vườn → tiêu chuẩn · ảnh mẫu → tải ảnh → gửi duyệt → AI quét → đạt / không đạt – lễ tân xử lý
function LaborPage() {
  const { s, addXp, fixXp } = useStore()
  const [a, setA] = useState(0)
  const [photo, setPhoto] = useState('')
  const area = D.LC_AREAS[a], std = area.std.split(/[;,] /)
  const [ticks, setTicks] = useState<boolean[]>([])
  const send = () => {
    const all = std.every((_, j) => ticks[j])
    const ok = all && !!photo
    addXp({ area: `Lao công · ${area.t}`, res: ok ? 'Đạt' : 'Cần xử lý', note: ok ? '' : `Chưa đạt: ${std.filter((_, j) => !ticks[j]).join(', ') || 'thiếu ảnh'}`, photo, ai: ok ? 'Ảnh phù hợp tiêu chuẩn' : 'Phát hiện mục chưa đạt', status: ok ? 'Đạt' : 'Không đạt – lễ tân xử lý' })
    setPhoto(''); setTicks([])
  }
  const hist = s.xpChecks.filter(x => x.area.startsWith('Lao công'))
  return <>
    <div style={{ overflowX: 'auto' }}><Seg value={String(a)} onChange={v => { setA(+v); setTicks([]); setPhoto('') }} items={D.LC_AREAS.map((x, j) => ({ k: String(j), label: x.t.split(',')[0] }))} /></div>
    <Block title={`Tiêu chuẩn dọn ${area.t}`} sub="Tích từng mục khi đã đạt">
      <div className="card list">{std.map((t, j) => <label key={t} className="item" style={{ cursor: 'pointer' }}><input type="checkbox" checked={!!ticks[j]} onChange={e => { const n = [...ticks]; n[j] = e.target.checked; setTicks(n) }} /><div className="body"><div className="t">{t}</div></div></label>)}</div>
    </Block>
    <Block title="Ảnh mẫu → tải ảnh báo cáo theo mẫu">
      <div className="row small"><span className="thumb">🖼</span><span className="muted">Ảnh mẫu Home: tệp ảnh Chưa nối — chụp đúng góc như ảnh mẫu.</span></div>
      <PhotoInput value={photo} onChange={setPhoto} label="Tải ảnh báo cáo theo mẫu" />
      <button className="btn pri" disabled={!photo} onClick={send}>Gửi duyệt</button>
      <div className="tiny muted">Phản hồi (AI quét): {AI_NOTE}. Đạt → lưu kết quả; không đạt → lễ tân xử lý và bấm "Đã xử lý".</div>
    </Block>
    <Block title="Phản hồi & lịch sử"><Hist empty="Chưa gửi báo cáo" rows={hist.map(x => ({ k: x.id, photo: x.photo, t: `${x.area.replace('Lao công · ', '')} · ${x.ai}`, d: `${x.note || 'Đạt tiêu chuẩn'} · ${D.staffName(x.by)} · ${D.hhmm(x.at)} · ${AI_NOTE}`, st: x.status, act: x.status === 'Không đạt – lễ tân xử lý' ? <button className="btn sm" onClick={() => fixXp(x.id)}>Đã xử lý</button> : undefined }))} /></Block>
  </>
}

// ② Kiểm tra không gian trải nghiệm: 9 nút con · Đạt / Cần xử lý / Không áp dụng · ghi chú lỗi · báo cần hỗ trợ
function XpPage() {
  const { s, addXp, fixXp } = useStore()
  const [k, setK] = useState<number | null>(null)
  const [f, setF] = useState({ res: 'Đạt' as D.XpCheck['res'], note: '', photo: '', help: false })
  if (k === null) {
    const last = (j: number) => s.xpChecks.find(x => x.area === `Trải nghiệm · ${D.XP_ITEMS[j][0]}`)
    return <>
      <div className="note"><b>Phân vai:</b> KTV kiểm tra phòng, giường, khu được giao · Lễ tân kiểm tra sảnh, khu chờ, lối khách đi · Leader kiểm tra lại mục lỗi và xác nhận đã xử lý. Kiểm tra đủ <b>đầu ca</b> và <b>khi bàn giao ca</b>; kiểm tra nhanh giường, khăn, vật dụng trước mỗi khách.</div>
      <div className="nodes">{D.XP_ITEMS.map(([t, d], j) => { const l = last(j); return <button key={t} className="node" onClick={() => { setK(j); setF({ res: 'Đạt', note: '', photo: '', help: false }) }}>
        <span className="no">{j + 1}</span><span className="body"><span className="t" style={{ display: 'block' }}>{t}</span><span className="d" style={{ display: 'block' }}>{l ? `Lần gần nhất ${D.hhmm(l.at)}: ${l.res}` : d.split(';')[0]}</span></span>{l && <Pill tone={tone(l.status === 'Đã xử lý' ? 'Đã xử lý' : l.res)}>{l.status === 'Đã xử lý' ? 'Đã xử lý' : l.res}</Pill>}</button> })}</div>
    </>
  }
  const [t, d] = D.XP_ITEMS[k], direct = D.XP_DIRECT.includes(k)
  const hist = s.xpChecks.filter(x => x.area === `Trải nghiệm · ${t}`)
  const ok = f.res !== 'Cần xử lý' || f.note.trim()
  return <>
    <button className="back" onClick={() => setK(null)}>← 9 nội dung kiểm tra</button>
    <Block title={`${k + 1}. ${t}`} sub="Tiêu chuẩn Home"><div className="small">{d}</div>
      {direct && <div className="note small">Mục này nhân viên <b>kiểm tra trực tiếp rồi xác nhận</b>; ảnh chỉ hỗ trợ đối chiếu.</div>}
      <div className="row small"><span className="thumb">🖼</span><span className="muted">Ảnh mẫu Home: Chưa nối tệp ảnh</span></div></Block>
    <Block title="Kết quả">
      <Seg value={f.res} onChange={v => setF({ ...f, res: v })} items={[{ k: 'Đạt', label: 'Đạt' }, { k: 'Cần xử lý', label: 'Cần xử lý' }, { k: 'Không áp dụng', label: 'Không áp dụng' }]} />
      <PhotoInput value={f.photo} onChange={v => setF({ ...f, photo: v })} label={direct ? 'Ảnh hỗ trợ (không bắt buộc)' : 'Tải ảnh thực tế'} />
      <label className="f">Ghi chú lỗi (vị trí + vấn đề){f.res === 'Cần xử lý' ? ' *' : ''}<textarea className="inp" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} placeholder="VD: phòng 2 — điều hòa chảy nước" /></label>
      <label className="row small"><input type="checkbox" checked={f.help} onChange={e => setF({ ...f, help: e.target.checked })} />Báo cần hỗ trợ — chuyển Leader phụ trách xử lý</label>
      <button className="btn pri" disabled={!ok || (!direct && f.res !== 'Không áp dụng' && !f.photo)} onClick={() => { addXp({ area: `Trải nghiệm · ${t}`, res: f.res, note: f.note.trim(), photo: f.photo, help: f.help, status: f.res === 'Cần xử lý' ? 'Không đạt – lễ tân xử lý' : undefined }); setF({ res: 'Đạt', note: '', photo: '', help: false }) }}>Ghi kết quả</button>
    </Block>
    <Block title="Lịch sử"><Hist empty="Chưa kiểm tra" rows={hist.map(x => ({ k: x.id, photo: x.photo || undefined, t: `${x.res}${x.help ? ' · cần hỗ trợ' : ''}`, d: `${x.note || '—'} · ${D.staffName(x.by)} · ${D.hhmm(x.at)}`, st: x.status === 'Đã xử lý' ? 'Đã xử lý' : x.res, act: x.status === 'Không đạt – lễ tân xử lý' ? <button className="btn sm" onClick={() => fixXp(x.id)}>Đã xử lý</button> : undefined }))} /></Block>
  </>
}

// ③ Vật tư – tồn kho – đề xuất mua: 8 nút con
const IT = (id: string) => D.STOCK_ITEMS.find(x => x.id === id)!
const qtyL = (id: string, q: number) => `${q.toLocaleString('vi-VN')} ${IT(id).unit}`
function StockPage({ tab }: { tab?: string }) {
  const { go } = useStore()
  const t = Math.min(Math.max(Number(tab ?? 0) || 0, 0), 7)
  const views = [<StockIn />, <StockOut />, <StockSell />, <StockCount />, <StockUse />, <StockAlert />, <StockMoney />, <StockLog />]
  return <>
    <div className="chipgrid">{D.STOCK_TABS.map((x, j) => <button key={x} className={`cbtn${j === t ? ' solid' : ''}`} onClick={() => go(`home/base/2/${j}`)}>{j + 1}. {x}{D.STOCK_NEW.includes(j) ? ' 🆕' : ''}</button>)}</div>
    {views[t]}
    <div className="tiny muted">Danh mục hàng, đơn vị quy đổi, định mức, ngưỡng tồn và quyền duyệt cài ở CEO → Cài đặt → Kho hàng. Lễ tân nhập–xuất–bán; KTV xác nhận nhận/trả/tồn; Leader kiểm tra chênh lệch. Danh mục & tồn đầu: {D.SAMPLE_NOTE}.</div>
  </>
}
const ItemSel = ({ v, on, only }: { v: string; on: (v: string) => void; only?: (x: D.StockItem) => boolean }) =>
  <label className="f">Mặt hàng<select className="inp" value={v} onChange={e => on(e.target.value)}>{D.STOCK_ITEMS.filter(only ?? (() => true)).map(x => <option key={x.id} value={x.id}>{x.name} ({x.unit})</option>)}</select></label>
function StockIn() {
  const { s, me, addStock } = useStore()
  const [f, setF] = useState({ item: 'dau', packs: 1, price: 0, supplier: '', buyer: '', lot: '', photo: '' })
  const it = IT(f.item)
  return <>
    <Block title="Tạo phiếu nhập" sub={`Nhập theo ${it.packName}, theo dõi theo ${it.unit}`}>
      <div className="grid g3"><ItemSel v={f.item} on={v => setF({ ...f, item: v, price: 0 })} />
        <label className="f">Số lượng ({it.packName})<input className="inp num" type="number" min={1} value={f.packs} onChange={e => setF({ ...f, packs: Math.max(1, +e.target.value || 1) })} /></label>
        <label className="f">Giá nhập / {it.packName}<input className="inp num" type="number" min={0} value={f.price || ''} placeholder={String(it.cost * it.pack)} onChange={e => setF({ ...f, price: +e.target.value })} /></label>
        <label className="f">Nhà cung cấp<input className="inp" value={f.supplier} onChange={e => setF({ ...f, supplier: e.target.value })} /></label>
        <label className="f">Người đi mua<input className="inp" value={f.buyer} onChange={e => setF({ ...f, buyer: e.target.value })} /></label>
        <label className="f">Lô / hạn sử dụng (nếu có)<input className="inp" value={f.lot} onChange={e => setF({ ...f, lot: e.target.value })} /></label></div>
      <div className="small">Thành tiền: <b>{D.vnd(f.packs * (f.price || it.cost * it.pack))}</b> · Người nhận kho: <b>{me.name}</b> · quy đổi = {qtyL(f.item, f.packs * it.pack)}</div>
      <PhotoInput value={f.photo} onChange={v => setF({ ...f, photo: v })} label="Ảnh hóa đơn nhập" />
      <button className="btn pri" disabled={!f.supplier.trim() || !f.photo} onClick={() => { addStock({ item: f.item, kind: 'Nhập', qty: f.packs * it.pack, price: f.price || it.cost * it.pack, supplier: f.supplier.trim(), note: `Mua: ${f.buyer || me.name}${f.lot ? ` · lô/HSD ${f.lot}` : ''} · có ảnh hóa đơn` }); setF({ ...f, packs: 1, supplier: '', buyer: '', lot: '', photo: '' }) }}>Lưu phiếu nhập</button>
    </Block>
    <Block title="Phiếu nhập gần đây"><Hist empty="Chưa có phiếu nhập" rows={s.stockMoves.filter(m => m.kind === 'Nhập').map(m => ({ k: m.id, t: `${IT(m.item).name} +${qtyL(m.item, m.qty)}`, d: `${m.supplier ?? ''} · ${D.vnd((m.qty / IT(m.item).pack) * (m.price ?? 0))} · ${m.note} · ${D.staffName(m.by)} ${D.hhmm(m.at)}` }))} /></Block>
  </>
}
function StockOut() {
  const { s, addStock } = useStore()
  const [f, setF] = useState({ kind: 'Cấp NV' as D.StockMove['kind'], item: 'dau', qty: 0, staffId: '', note: '' })
  const needStaff = f.kind === 'Cấp NV' || f.kind === 'Hoàn trả'
  return <>
    <Block title="Phiếu xuất / cấp vật tư" sub="Mỗi phiếu có người giao, người nhận và mục đích sử dụng">
      <Seg value={f.kind} onChange={v => setF({ ...f, kind: v })} items={(['Cấp NV', 'Dùng chung', 'Hoàn trả', 'Hỏng/hao hụt'] as const).map(k => ({ k, label: k === 'Cấp NV' ? 'Cấp cho nhân viên' : k === 'Dùng chung' ? 'Dùng chung phòng/ca' : k === 'Hoàn trả' ? 'Nhân viên hoàn trả' : 'Hỏng, hao hụt' }))} />
      <div className="grid g3"><ItemSel v={f.item} on={v => setF({ ...f, item: v })} />
        <label className="f">Số lượng ({IT(f.item).unit})<input className="inp num" type="number" min={1} value={f.qty || ''} onChange={e => setF({ ...f, qty: +e.target.value })} /></label>
        {needStaff && <label className="f">Nhân viên<select className="inp" value={f.staffId} onChange={e => setF({ ...f, staffId: e.target.value })}><option value="">— chọn —</option>{s.staff.filter(x => x.role === 'ktv' || x.role === 'reception').map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}</div>
      <label className="f">Mục đích sử dụng / phòng / ca *<input className="inp" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} placeholder="VD: cấp đầu ca 1 · phòng 2" /></label>
      <div className="tiny muted">Chuyển kho (giữa chi nhánh): Chưa nối — Home hiện có 1 kho.</div>
      <button className="btn pri" disabled={f.qty <= 0 || !f.note.trim() || (needStaff && !f.staffId)} onClick={() => { addStock({ item: f.item, kind: f.kind, qty: f.qty, staffId: needStaff ? f.staffId : undefined, note: f.note.trim() }); setF({ ...f, qty: 0, note: '' }) }}>Lưu phiếu</button>
    </Block>
    <Block title="Phiếu xuất gần đây"><Hist empty="Chưa có phiếu" rows={s.stockMoves.filter(m => ['Cấp NV', 'Dùng chung', 'Hoàn trả', 'Hỏng/hao hụt'].includes(m.kind)).map(m => ({ k: m.id, t: `${m.kind} · ${IT(m.item).name} ${qtyL(m.item, m.qty)}`, d: `${m.staffId ? `nhận: ${D.staffName(m.staffId)} · ` : ''}giao: ${D.staffName(m.by)} · ${m.note} · ${D.hhmm(m.at)}` }))} /></Block>
  </>
}
function StockSell() {
  const { s, me, addStock } = useStore()
  const [f, setF] = useState({ item: 'caoho', cust: '', seller: me.id, qty: 1, price: 0, disc: 0, paid: 0, photo: '' })
  const it = IT(f.item), price = f.price || it.price || 0, total = Math.max(0, f.qty * price - f.disc)
  return <>
    <Block title="Bán hàng 🆕" sub="Nên liên kết Thu ngân để mỗi giao dịch chỉ trừ kho một lần (Chưa nối — hiện ghi riêng tại đây)">
      <div className="grid g3"><ItemSel v={f.item} on={v => setF({ ...f, item: v, price: 0 })} only={x => !!x.price} />
        <label className="f">Khách mua<select className="inp" value={f.cust} onChange={e => setF({ ...f, cust: e.target.value })}><option value="">— chọn —</option>{s.customers.slice(0, 40).map(c => <option key={c.id} value={c.id}>{c.name} · {c.code}</option>)}</select></label>
        <label className="f">Nhân viên bán<select className="inp" value={f.seller} onChange={e => setF({ ...f, seller: e.target.value })}>{s.staff.filter(x => x.role === 'ktv' || x.role === 'reception').map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="f">Số lượng<input className="inp num" type="number" min={1} value={f.qty} onChange={e => setF({ ...f, qty: Math.max(1, +e.target.value || 1) })} /></label>
        <label className="f">Giá bán<input className="inp num" type="number" min={0} value={f.price || ''} placeholder={String(it.price ?? '')} onChange={e => setF({ ...f, price: +e.target.value })} /></label>
        <label className="f">Giảm giá<input className="inp num" type="number" min={0} value={f.disc || ''} onChange={e => setF({ ...f, disc: +e.target.value })} /></label>
        <label className="f">Tiền đã thu<input className="inp num" type="number" min={0} value={f.paid || ''} placeholder={String(total)} onChange={e => setF({ ...f, paid: +e.target.value })} /></label></div>
      <div className="small">Thành tiền: <b>{D.vnd(total)}</b></div>
      <PhotoInput value={f.photo} onChange={v => setF({ ...f, photo: v })} label="Ảnh hóa đơn" />
      <button className="btn pri" disabled={!f.cust || stockQty(s, f.item) < f.qty} onClick={() => { addStock({ item: f.item, kind: 'Bán', qty: f.qty, staffId: f.seller, price: total / f.qty, note: `Bán cho ${s.customers.find(c => c.id === f.cust)?.name} · thu ${D.vnd(f.paid || total)}${f.photo ? ' · có hóa đơn' : ''}` }); setF({ ...f, cust: '', qty: 1, disc: 0, paid: 0, photo: '' }) }}>Lưu giao dịch bán</button>
      {stockQty(s, f.item) < f.qty && <div className="tiny" style={{ color: 'var(--r-fg)' }}>Kho không đủ hàng.</div>}
      <div className="tiny muted">Trả hàng / hoàn tiền: ghi phiếu "Nhân viên hoàn trả" ở mục 2 kèm lý do.</div>
    </Block>
    <Block title="Đã bán"><Hist empty="Chưa bán sản phẩm" rows={s.stockMoves.filter(m => m.kind === 'Bán').map(m => ({ k: m.id, t: `${IT(m.item).name} × ${m.qty} · ${D.vnd((m.price ?? 0) * m.qty)}`, d: `${m.note} · NV ${D.staffName(m.staffId)} · ${D.hhmm(m.at)}` }))} /></Block>
  </>
}
function StockCount() {
  const { s, addStock } = useStore()
  const [real, setReal] = useState<Record<string, string>>({})
  const [why, setWhy] = useState<Record<string, string>>({})
  const holders = s.staff.filter(x => x.role === 'ktv')
  return <Block title="Tồn kho & kiểm kê" sub="Kiểm đếm thực tế → chênh lệch so với app → giải trình → đề nghị điều chỉnh (Leader duyệt)">
    <div className="card list">{D.STOCK_ITEMS.map(it => { const q = stockQty(s, it.id), held = holders.reduce((t, h) => { const x = heldBy(s, h.id, it.id); return t + Math.max(0, x.got - x.back - x.lost) }, 0); const r = real[it.id]; const diff = r === undefined || r === '' ? null : +r - q
      return <div key={it.id} className="item" style={{ flexWrap: 'wrap' }}><div className="body" style={{ minWidth: 160 }}><div className="t">{it.name}</div><div className="d">Trong kho: <b>{qtyL(it.id, q)}</b> · đang giữ tại NV/phòng: {qtyL(it.id, held)}</div></div>
        <input className="inp num" style={{ width: 110 }} type="number" placeholder="Đếm thực tế" value={r ?? ''} onChange={e => setReal({ ...real, [it.id]: e.target.value })} aria-label={`Đếm thực tế ${it.name}`} />
        {diff !== null && diff !== 0 && <><Pill tone="red">lệch {diff > 0 ? '+' : ''}{diff}</Pill><input className="inp" style={{ flex: 1, minWidth: 140 }} placeholder="Giải trình *" value={why[it.id] ?? ''} onChange={e => setWhy({ ...why, [it.id]: e.target.value })} /><button className="btn sm pri" disabled={!why[it.id]?.trim()} onClick={() => { addStock({ item: it.id, kind: 'Kiểm kê', qty: diff, note: `Đề nghị điều chỉnh tồn: ${why[it.id]}`, status: 'Chờ duyệt' }); setReal({ ...real, [it.id]: '' }); setWhy({ ...why, [it.id]: '' }) }}>Đề nghị điều chỉnh</button></>}
        {diff === 0 && <Pill tone="green">Khớp</Pill>}</div> })}</div>
  </Block>
}
function StockUse() {
  const { s, user, me } = useStore()
  const ktvs = s.staff.filter(x => x.role === 'ktv')
  const [sid, setSid] = useState(user.role === 'ktv' ? me.id : 'mai')
  const ex = D.SEED_KTV_HOLD[sid]
  return <>
    <Block title="Sử dụng theo nhân sự 🆕" sub="Đã nhận · đã dùng · đã hoàn trả · còn giữ · hao hụt · chi phí vật tư · so với định mức Home">
      {user.role !== 'ktv' && <label className="f">Nhân viên<select className="inp" value={sid} onChange={e => setSid(e.target.value)}>{ktvs.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label>}
      <div className="card list">{D.STOCK_ITEMS.map(it => { const h = heldBy(s, sid, it.id); if (!h.got && !h.back && !h.lost) return null
        return <div key={it.id} className="item"><div className="body"><div className="t">{it.name}</div><div className="d">Đã nhận {qtyL(it.id, h.got)} · đã hoàn trả {qtyL(it.id, h.back)} · hao hụt {qtyL(it.id, h.lost)}</div></div></div> })}
        {!D.STOCK_ITEMS.some(it => { const h = heldBy(s, sid, it.id); return h.got || h.back || h.lost }) && <Empty>Chưa nhận vật tư hôm nay</Empty>}</div>
    </Block>
    {ex ? (() => { const it = IT(ex.item), got = heldBy(s, sid, ex.item).got, back = heldBy(s, sid, ex.item).back, end = ex.end ?? 0, use = usage(ex.start, got, back, end), per = ex.tours ? use / ex.tours : 0
      return <Block title={`Lượng tiêu hao — ${it.name}`} sub={`Tiêu hao = tồn đầu + nhận thêm − hoàn trả − tồn cuối · ${D.SAMPLE_NOTE}`}>
        <table className="tbl"><tbody>{[['Tồn đầu ca', ex.start], ['Nhận thêm', got], ['Hoàn trả kho', back], ['Tồn cuối ca', end], ['Lượng tiêu hao', use]].map(([l, v]) => <tr key={l as string}><td>{l}</td><td className="num strong">{qtyL(it.id, v as number)}</td></tr>)}</tbody></table>
        <Tiles items={[{ v: ex.tours, l: 'Tour massage' }, { v: `${per.toFixed(0)} ${it.unit}`, l: 'Dùng TB / tour', s: `Định mức ${it.perTour} ${it.unit}`, tone: it.perTour && per > it.perTour * 1.1 ? 'warn' : 'ok' }, { v: D.vnd(use * it.cost), l: 'Chi phí vật tư', s: `${D.vnd(per * it.cost)} / tour` }]} />
      </Block> })() : <div className="note small">Chưa ghi tồn đầu/cuối ca cho nhân viên này — KTV ghi ở mục "Đối chiếu sản phẩm".</div>}
  </>
}
function StockAlert() {
  const { s, addStock } = useStore()
  const rows = buySuggest(s)
  return <Block title="Cảnh báo & đề xuất mua" sub="Ngưỡng cảnh báo → đề xuất mua đủ mức cần duy trì, trừ hàng đã đặt chưa nhận">
    <div className="card list">{rows.map(r => <div key={r.it.id} className="item"><div className="body"><div className="t">{r.it.name} <Pill tone={r.state === 'Đủ' ? 'green' : 'red'}>{r.state}</Pill></div><div className="d">Còn {qtyL(r.it.id, r.q)} · cảnh báo &lt; {qtyL(r.it.id, r.it.warn)} · duy trì {qtyL(r.it.id, r.it.keep)}{r.ordered ? ` · đã đặt ${qtyL(r.it.id, r.ordered)}` : ''}</div>
      {r.need > 0 && <div className="small">Đề xuất mua <b>{qtyL(r.it.id, r.need)}</b> · dự kiến {D.vnd(r.need * r.it.cost)}</div>}</div>
      {r.need > 0 && <button className="btn sm pri" onClick={() => addStock({ item: r.it.id, kind: 'Đề xuất mua', qty: r.need, note: `Đề xuất mua · dự kiến ${D.vnd(r.need * r.it.cost)}`, status: 'Chờ duyệt' })}>Gửi duyệt</button>}</div>)}</div>
    <div className="tiny muted">Sắp hết hạn: Chưa nối (cần nhập lô/HSD khi nhập kho).</div>
  </Block>
}
function StockMoney() {
  const { s } = useStore()
  const ok = s.stockMoves.filter(m => m.status !== 'Chờ duyệt' && m.status !== 'Từ chối')
  const buy = ok.filter(m => m.kind === 'Nhập').reduce((t, m) => t + (m.qty / IT(m.item).pack) * (m.price ?? 0), 0)
  const used = ok.filter(m => m.kind === 'Cấp NV' || m.kind === 'Dùng chung').reduce((t, m) => t + m.qty * IT(m.item).cost, 0) - ok.filter(m => m.kind === 'Hoàn trả').reduce((t, m) => t + m.qty * IT(m.item).cost, 0)
  const sold = ok.filter(m => m.kind === 'Bán'), rev = sold.reduce((t, m) => t + (m.price ?? 0) * m.qty, 0), cogs = sold.reduce((t, m) => t + m.qty * IT(m.item).cost, 0)
  const value = D.STOCK_ITEMS.reduce((t, it) => t + Math.max(0, stockQty(s, it.id)) * it.cost, 0)
  return <Block title="Tiền hàng & báo cáo 🆕" sub={`Tính từ phiếu kho · danh mục giá vốn ${D.SAMPLE_NOTE}`}>
    <Tiles items={[{ v: D.vndShort(buy), l: 'Tiền nhập hàng' }, { v: 'Chưa nối', l: 'Đã thanh toán NCC' }, { v: 'Chưa nối', l: 'Còn phải trả' }, { v: D.vndShort(value), l: 'Giá trị hàng tồn' }, { v: D.vndShort(used), l: 'Chi phí vật tư đã dùng' }, { v: D.vndShort(rev), l: 'Doanh thu bán SP', tone: 'ok' }, { v: D.vndShort(rev), l: 'Tiền đã thu' }, { v: D.vndShort(rev - cogs), l: 'Lãi gộp sản phẩm' }]} />
  </Block>
}
function StockLog() {
  const { s, user, decideStock } = useStore()
  const can = user.role === 'leader' || user.role === 'ceo'
  const pend = s.stockMoves.filter(m => m.status === 'Chờ duyệt')
  return <>
    <Block title="Chờ duyệt" sub="Duyệt mua hàng · duyệt điều chỉnh chênh lệch · duyệt hủy/hỏng (Leader/CEO)"><Hist empty="Không có phiếu chờ duyệt" rows={pend.map(m => ({ k: m.id, t: `${m.kind} · ${IT(m.item).name} ${qtyL(m.item, m.qty)}`, d: `${m.note} · ${D.staffName(m.by)} ${D.hhmm(m.at)}`, st: m.status, act: can ? <><button className="btn sm danger" onClick={() => decideStock(m.id, false)}>Từ chối</button><button className="btn sm pri" onClick={() => decideStock(m.id, true)}>Duyệt</button></> : undefined }))} /></Block>
    <Block title="Lịch sử nhập – xuất – bán" sub="Ai thao tác, lúc nào, thay đổi gì"><Hist empty="Chưa có" rows={s.stockMoves.map(m => ({ k: m.id, t: `${m.kind} · ${IT(m.item).name} ${m.qty > 0 ? '' : ''}${qtyL(m.item, m.qty)}`, d: `${D.staffName(m.by)} · ${D.hhmm(m.at)} · ${m.note}`, st: m.status }))} /></Block>
  </>
}

// ④ Thiết bị – bảo dưỡng – sửa chữa · ⑤ Sinh nhật – quà tháng – hoạt động chung → gửi duyệt → thông báo Leader đã duyệt/chưa
function ReqPage({ kind }: { kind: D.OpsReq['kind'] }) {
  const { s, me, addOpsReq } = useStore()
  const eq = kind === 'Thiết bị'
  const [f, setF] = useState({ title: '', cost: 0, from: '', to: '', photo: '' })
  const okForm = f.title.trim() && f.cost >= 0 && (!eq || (f.from && f.to && f.from <= f.to))
  return <>
    <Block title={eq ? 'Thiết bị cần sửa chữa' : 'Tên hoạt động'} sub={eq ? 'Thiết bị → chi phí → thời gian sửa → gửi duyệt' : 'Sinh nhật nhân sự · quà tháng · hoạt động chung → chi phí → gửi duyệt'}>
      <label className="f">{eq ? 'Thiết bị cần sửa' : 'Tên hoạt động'} *<input className="inp" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder={eq ? 'VD: máy sấy tóc tầng 3' : 'VD: sinh nhật KTV Lan tháng 10'} /></label>
      <label className="f">Chi phí (đồng)<input className="inp num" type="number" min={0} value={f.cost || ''} onChange={e => setF({ ...f, cost: +e.target.value })} /></label>
      {eq && <div className="grid g3"><label className="f">Sửa từ ngày *<input className="inp" type="date" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></label><label className="f">Tới ngày *<input className="inp" type="date" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} /></label></div>}
      {eq && <PhotoInput value={f.photo} onChange={v => setF({ ...f, photo: v })} label="Tải ảnh thiết bị" />}
      <button className="btn pri" disabled={!okForm} onClick={() => { addOpsReq({ kind, title: f.title.trim(), cost: f.cost, from: f.from || undefined, to: f.to || undefined, photo: f.photo || undefined }); setF({ title: '', cost: 0, from: '', to: '', photo: '' }) }}>Gửi duyệt</button>
      {eq && f.from && f.to && f.from > f.to && <div className="tiny" style={{ color: 'var(--r-fg)' }}>Ngày kết thúc phải sau ngày bắt đầu.</div>}
    </Block>
    <Block title="Thông báo đã duyệt / chưa duyệt từ Leader"><Hist empty="Chưa gửi đề xuất" rows={s.opsReqs.filter(r => r.kind === kind && (r.by === me.id || me.role !== 'reception')).map(r => ({ k: r.id, photo: r.photo, t: `${r.title} · ${D.vnd(r.cost)}`, d: `${r.from ? `${r.from} → ${r.to} · ` : ''}${D.staffName(r.by)} · ${D.hhmm(r.at)}${r.decidedBy ? ` · ${D.staffName(r.decidedBy)} quyết định` : ''}`, st: r.status }))} /></Block>
  </>
}

// ⑥ Ghi nhận điểm uy tín (+ nút tải ảnh minh chứng)
function PointsRec() {
  const { s, me, proposePoint } = useStore()
  const [pt, setPt] = useState({ staffId: '', delta: 1, reason: '', photo: '' })
  return <>
    <div className="note"><b>Lưu ý của chị Quyên:</b> lễ tân ghi nhận & tổng hợp; Leader/CEO duyệt điểm cộng/trừ có tranh chấp hoặc cần đánh giá — lễ tân không tự quyết điểm của đồng nghiệp.</div>
    <Block title="Ghi nhận điểm">
      <div className="grid g3"><label className="f">Nhân viên<select id="pt-st" className="inp" value={pt.staffId} onChange={e => setPt({ ...pt, staffId: e.target.value })}><option value="">— chọn —</option>{s.staff.filter(x => x.id !== me.id && (x.role === 'ktv' || x.role === 'reception')).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="f">Điểm (+/−)<input id="pt-d" className="inp num" type="number" min={-10} max={10} value={pt.delta} onChange={e => setPt({ ...pt, delta: +e.target.value })} /></label>
        <label className="f">Sự việc & minh chứng<input id="pt-r" className="inp" value={pt.reason} onChange={e => setPt({ ...pt, reason: e.target.value })} placeholder="VD: khách khen trên Google" /></label></div>
      <PhotoInput value={pt.photo} onChange={v => setPt({ ...pt, photo: v })} label="Tải ảnh minh chứng" />
      <button className="btn pri" disabled={!pt.staffId || !pt.delta || !pt.reason.trim()} onClick={() => { proposePoint(pt.staffId, pt.delta, pt.reason.trim(), pt.photo || undefined); setPt({ staffId: '', delta: 1, reason: '', photo: '' }) }}>Gửi Leader/CEO duyệt</button>
    </Block>
    <Block title="Đã ghi nhận"><Hist empty="Chưa ghi nhận" rows={s.points.filter(p => p.by === me.id).map(p => ({ k: p.id, photo: p.photo, t: `${D.staffName(p.staffId)} · ${p.delta > 0 ? '+' : ''}${p.delta}`, d: `${p.reason} · ${D.hhmm(p.at)}`, st: p.status }))} /></Block>
  </>
}

// ⑦ Bàn giao ca – việc còn tồn (dùng chung KTV "Nhận bàn giao ca")
export function HandoverPage({ back }: { back?: () => void }) {
  const { s, me, addHandover, answerHandover } = useStore()
  const [f, setF] = useState({ text: '', to: '' })
  const [why, setWhy] = useState<Record<string, string>>({})
  const inbox = s.handovers.filter(h => h.to === me.id), sent = s.handovers.filter(h => h.from === me.id)
  return <>
    {back && <SubHead title="Nhận bàn giao ca" sub="Nội dung bàn giao (thu tiền hộ, chăm sóc khác, bàn giao tiền) → xác nhận đồng ý / không đồng ý" onBack={back} />}
    <Block title="Bàn giao cho tôi" right={<span className="badge">{inbox.filter(h => h.status === 'Chờ xác nhận').length}</span>}>
      <div className="card list">{inbox.map(h => <div key={h.id} className="item" style={{ flexWrap: 'wrap' }}><div className="body" style={{ minWidth: 180 }}><div className="t">{h.text}</div><div className="d">Từ {D.staffName(h.from)} · {D.hhmm(h.at)}{h.reason ? ` · lý do: ${h.reason}` : ''}</div></div>
        {h.status === 'Chờ xác nhận' ? <><input className="inp" style={{ flex: 1, minWidth: 120 }} placeholder="Lý do nếu không đồng ý" value={why[h.id] ?? ''} onChange={e => setWhy({ ...why, [h.id]: e.target.value })} /><button className="btn sm danger" disabled={!why[h.id]?.trim()} onClick={() => answerHandover(h.id, false, why[h.id].trim())}>Không đồng ý</button><button className="btn sm pri" onClick={() => answerHandover(h.id, true)}>Đồng ý</button></> : <Pill tone={tone(h.status)}>{h.status}</Pill>}</div>)}
        {!inbox.length && <Empty>Không có bàn giao nào cho bạn</Empty>}</div>
      <div className="tiny muted">Đồng ý → thông báo lên nhóm chung và về người bàn giao. Không đồng ý → người bàn giao giao lại cho người khác.</div>
    </Block>
    <Block title="Bàn giao việc còn tồn" sub="Nội dung việc bàn giao → chọn tên người nhận → gửi">
      <label className="f">Nội dung việc bàn giao<textarea className="inp" value={f.text} onChange={e => setF({ ...f, text: e.target.value })} placeholder="VD: khách Hà hẹn 18:00 chưa xác nhận; thu hộ 300.000đ" /></label>
      <label className="f">Người nhận bàn giao<select className="inp" value={f.to} onChange={e => setF({ ...f, to: e.target.value })}><option value="">— chọn —</option>{s.staff.filter(x => x.id !== me.id && ['ktv', 'reception', 'leader'].includes(x.role)).map(x => <option key={x.id} value={x.id}>{x.name} · {D.ROLE_LABEL[x.role]}</option>)}</select></label>
      <button className="btn pri" disabled={!f.text.trim() || !f.to} onClick={() => { addHandover(f.to, f.text.trim()); setF({ text: '', to: '' }) }}>Gửi</button>
    </Block>
    <Block title="Đã gửi"><Hist empty="Chưa gửi bàn giao" rows={sent.map(h => ({ k: h.id, t: h.text, d: `→ ${D.staffName(h.to)} · ${D.hhmm(h.at)}${h.reason ? ` · ${h.reason}` : ''}`, st: h.status }))} /></Block>
  </>
}

// ⑧ Chi tiêu vận hành: nhập hóa đơn · chọn thời gian · điện, nước, rác+wifi, mặt bằng, lương cơ sở, hàng hóa, quảng cáo FB/Google, khác
const toISO = (vn: string) => { const [d, m, y] = vn.split('/'); return `${y}-${m}-${d}` }
export function ExpensePage({ readOnly }: { readOnly?: boolean }) {
  const { s, addExpense } = useStore()
  const [f, setF] = useState({ cat: 'Điện' as D.Expense['cat'], amount: 0, date: toISO(D.dateShort()), note: '', photo: '' })
  const [rg, setRg] = useState({ from: toISO(D.daysAhead(-30)), to: toISO(D.dateShort()) })
  const list = s.expenses.filter(e => { const d = toISO(e.date); return d >= rg.from && d <= rg.to })
  const by = D.EXP_CATS.map(c => ({ c, v: list.filter(e => e.cat === c).reduce((t, e) => t + e.amount, 0) }))
  return <>
    {!readOnly && <Block title="Nhập hóa đơn chi phí" sub="Nút nhập các chi phí chi trả vận hành cho spa">
      <div className="grid g3"><label className="f">Hạng mục<select className="inp" value={f.cat} onChange={e => setF({ ...f, cat: e.target.value as D.Expense['cat'] })}>{D.EXP_CATS.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="f">Số tiền *<input className="inp num" type="number" min={0} value={f.amount || ''} onChange={e => setF({ ...f, amount: +e.target.value })} /></label>
        <label className="f">Ngày<input className="inp" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></label></div>
      <label className="f">Ghi chú<input className="inp" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></label>
      <PhotoInput value={f.photo} onChange={v => setF({ ...f, photo: v })} label="Ảnh hóa đơn" />
      <button className="btn pri" disabled={f.amount <= 0 || !f.photo || !f.date} onClick={() => { const [y, m, d] = f.date.split('-'); addExpense({ cat: f.cat, amount: f.amount, date: `${d}/${m}/${y}`, note: f.note.trim(), photo: f.photo }); setF({ ...f, amount: 0, note: '', photo: '' }) }}>Lưu chi phí</button>
      {f.cat === 'Lương cơ sở' && <div className="tiny muted">Bảng lương nhân sự từng tháng: CEO ⑨ Dòng tiền & lương — Chưa nối.</div>}
    </Block>}
    <Block title="Chọn thời gian" right={<b>{D.vnd(list.reduce((t, e) => t + e.amount, 0))}</b>}>
      <div className="grid g3"><label className="f">Từ<input className="inp" type="date" value={rg.from} onChange={e => setRg({ ...rg, from: e.target.value })} /></label><label className="f">Đến<input className="inp" type="date" value={rg.to} onChange={e => setRg({ ...rg, to: e.target.value })} /></label></div>
      <div className="card list">{by.filter(x => x.v).map(x => <div key={x.c} className="item"><div className="body"><div className="t">{x.c}</div></div><span className="num strong">{D.vnd(x.v)}</span></div>)}{!by.some(x => x.v) && <Empty>Không có chi phí trong khoảng này</Empty>}</div>
    </Block>
    <Block title="Hóa đơn đã nhập"><Hist empty="Chưa nhập" rows={list.map(e => ({ k: e.id, photo: e.photo, t: `${e.cat} · ${D.vnd(e.amount)}`, d: `${e.date} · ${e.note || '—'} · ${D.staffName(e.by)}` }))} /></Block>
  </>
}
