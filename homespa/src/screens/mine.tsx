// FIX LẦN 1 — KTV "Của tôi": 8 nút theo sơ đồ G (chỉ KTV đó thấy dữ liệu của mình)
import { useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { pointsOf } from '../logic'
import { Hero, Nodes, SubHead, Block, Pill, Empty, Tiles, Seg, PhotoInput, Icon } from '../ui'
import { LeaveModal } from './daily'
import { PerfView } from './leader2'

const CN = <Pill>Chưa nối</Pill>
const Line = ({ t, v }: { t: string; v?: React.ReactNode }) => <div className="item"><div className="body"><div className="t">{t}</div></div>{v ?? CN}</div>
const st = (x: string) => <Pill tone={x === 'Đã duyệt' || x === 'Đã xử lý' || x === 'Đã gửi' ? 'green' : x === 'Từ chối' ? 'red' : 'yellow'}>{x}</Pill>

export function KtvMine({ sub }: { sub: string[] }) {
  const { s, me, go } = useStore()
  const back = () => go('me')
  const p = s.profiles[me.id]
  const pages: Record<string, () => JSX.Element> = { profile: () => <Profile back={back} />, schedule: () => <Schedule back={back} />, time: () => <Attend back={back} />, perf: () => <><SubHead title="Hiệu suất KTV" sub="5 nhóm theo sơ đồ · mục chưa có dữ liệu ghi Chưa nối · Mộc không tự cộng/trừ điểm" onBack={back} /><PerfView id={me.id} /></>, kpi: () => <Kpi back={back} />, train: () => <Train back={back} />, income: () => <Income back={back} />, req: () => <Requests back={back} /> }
  if (pages[sub[0]]) return pages[sub[0]]()
  return <>
    <Hero tag="Của tôi" title={p?.fullName || me.name} sub={`${D.ROLE_LABEL[me.role]}${me.shift ? ` · ${D.SHIFTS[me.shift].label}` : ''} · ${pointsOf(s, me.id)} điểm uy tín`} />
    <Nodes items={[
      { t: 'Hồ sơ cá nhân', d: 'Họ tên · mã NV · ảnh · bộ phận · ngày vào làm', onClick: () => go('me/profile') },
      { t: 'Lịch làm việc của tôi', d: 'Ca hôm nay · tuần / tháng · đổi ca · ngày nghỉ', onClick: () => go('me/schedule') },
      { t: 'Chấm công của tôi', d: 'Giờ vào/ra · đi trễ · ngày công · điều chỉnh', onClick: () => go('me/time') },
      { t: 'Hiệu suất KTV', d: 'Chuyên môn · tăng trưởng KH · tinh thần · văn hóa · sáng tạo', onClick: () => go('me/perf') },
      { t: 'KPI – Điểm uy tín', d: 'Điểm hiện tại · tăng/giảm · lý do · lịch sử', onClick: () => go('me/kpi') },
      { t: 'Đào tạo & phát triển', d: 'Khóa học · SOP · bài test · kỹ năng · lộ trình', onClick: () => go('me/train') },
      { t: 'Thu nhập của tôi', d: 'Lương · công · hoa hồng · thưởng/phạt · phiếu lương', onClick: () => go('me/income') },
      { t: 'Yêu cầu & lịch sử cá nhân', d: 'Xin nghỉ · đổi ca · điều chỉnh chấm công · sự cố · góp ý', onClick: () => go('me/req') },
    ]} />
  </>
}

function Profile({ back }: { back: () => void }) {
  const { s, me, saveProfile } = useStore()
  const p = s.profiles[me.id]
  const [f, setF] = useState<D.StaffProfile>(p ?? { fullName: me.name, avatar: '', dept: 'Kĩ thuật viên · Home Spa Đà Nẵng', joinDate: '', phone: '' })
  return <>
    <SubHead title="Hồ sơ cá nhân" sub="Điền biểu mẫu khi vào app · lưu trong bản chạy thử (chưa lưu máy chủ)" onBack={back} />
    <Block title="Biểu mẫu">
      <div className="small">Mã nhân viên: <b>{me.id.toUpperCase()}</b></div>
      <PhotoInput value={f.avatar} onChange={v => setF({ ...f, avatar: v })} label="Ảnh đại diện" />
      <div className="grid g3"><label className="f">Họ tên *<input className="inp" value={f.fullName} onChange={e => setF({ ...f, fullName: e.target.value })} /></label>
        <label className="f">Chi nhánh / bộ phận<input className="inp" value={f.dept} onChange={e => setF({ ...f, dept: e.target.value })} /></label>
        <label className="f">Ngày vào làm<input className="inp" type="date" value={f.joinDate} onChange={e => setF({ ...f, joinDate: e.target.value })} /></label>
        <label className="f">SĐT nội bộ (tùy chọn)<input className="inp" inputMode="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></label></div>
      <button className="btn pri" disabled={!f.fullName.trim()} onClick={() => saveProfile({ ...f, fullName: f.fullName.trim() })}>Lưu hồ sơ</button>
      {!f.joinDate && <div className="tiny muted">Ngày vào làm: Chưa nối (CEO nhập ở Hồ sơ – Hợp đồng nếu bạn không nhớ).</div>}
    </Block>
  </>
}

function Schedule({ back }: { back: () => void }) {
  const { s, me, go } = useStore()
  const [v, setV] = useState<'w' | 'm'>('w')
  const n = v === 'w' ? 7 : 28
  const days = Array.from({ length: n }, (_, i) => { const d = new Date(D.TODAY); d.setDate(d.getDate() + i); return D.dateShort(d) })
  const off = new Set(s.leaves.filter(l => l.staffId === me.id && l.status === 'Đã duyệt' && l.kind !== 'Đổi ca').map(l => l.date))
  const swaps = s.leaves.filter(l => (l.staffId === me.id || l.withId === me.id) && l.kind === 'Đổi ca')
  return <>
    <SubHead title="Lịch làm việc của tôi" sub="Ca hôm nay · lịch tuần / tháng · lịch đổi ca · ngày nghỉ đã đăng ký" onBack={back} right={<button className="btn" onClick={() => go('home/shift')}>Bảng 4 tuần</button>} />
    <Tiles items={[{ v: me.shift ? D.SHIFTS[me.shift].label : '—', l: 'Ca hôm nay', color: 'mint' }, { v: off.size, l: 'Ngày nghỉ đã duyệt' }, { v: swaps.length, l: 'Đơn đổi ca' }]} />
    <Seg value={v} onChange={setV} items={[{ k: 'w', label: 'Tuần' }, { k: 'm', label: 'Tháng' }]} />
    <div className="calgrid">{days.map(d => <div key={d} className={`calc${off.has(d) ? ' off' : ''}`}><b>{d.slice(0, 5)}</b><span>{off.has(d) ? 'OFF' : me.shift === 1 ? 'S' : me.shift === 2 ? 'C' : '—'}</span></div>)}</div>
    <div className="tiny muted">S = sáng 08:00–18:00 · C = chiều 10:00–20:00 · OFF = nghỉ đã duyệt (khớp bảng chia ca 4 tuần).</div>
    <Block title="Lịch đổi ca"><div className="card list">{swaps.map(l => <div key={l.id} className="item"><div className="body"><div className="t">{l.date} · {D.staffName(l.staffId)} ↔ {D.staffName(l.withId)}</div><div className="d">{l.detail}</div></div>{st(l.status)}</div>)}{!swaps.length && <Empty>Chưa có đổi ca</Empty>}</div></Block>
  </>
}

function Attend({ back }: { back: () => void }) {
  const { s, me, checkIn, checkOut, requestAdjust } = useStore()
  const a = s.attendance[me.id], sh = me.shift ? D.SHIFTS[me.shift] : null
  const [f, setF] = useState({ date: '', text: '' })
  const late = sh && a?.in != null ? a.in - sh.start : 0
  const early = sh && a?.out != null ? sh.end - a.out : 0
  return <>
    <SubHead title="Chấm công của tôi" onBack={back} />
    <Tiles items={[{ v: a?.in != null ? D.hhmm(a.in) : '—', l: 'Giờ vào' }, { v: a?.out != null ? D.hhmm(a.out) : '—', l: 'Giờ ra' }, { v: late > 0 ? `Trễ ${late}′` : early > 0 ? `Sớm ${early}′` : a?.in != null ? 'Đúng giờ' : '—', l: 'Đi trễ / về sớm', tone: late > 0 || early > 0 ? 'warn' : 'ok' }, { v: 'Chưa nối', l: 'Ngày công tháng' }]} />
    <div className="row">{a?.in == null ? <button className="btn pri" onClick={checkIn}><Icon n="qr" />Quét QR vào ca</button> : a.out == null && <button className="btn" onClick={checkOut}>Chấm công ra ca</button>}</div>
    <Block title="Lịch sử chấm công"><div className="card list"><Line t={`Hôm nay ${D.dateShort()}`} v={<span className="small">{a?.in != null ? `${D.hhmm(a.in)} → ${a.out != null ? D.hhmm(a.out) : 'đang làm'}` : 'chưa chấm'}</span>} /><Line t="Các ngày trước" /></div></Block>
    <Block title="Yêu cầu điều chỉnh chấm công">
      <div className="grid g3"><label className="f">Ngày *<input className="inp" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></label><label className="f">Lý do *<input className="inp" value={f.text} onChange={e => setF({ ...f, text: e.target.value })} placeholder="VD: quên quét QR ra ca 20:05" /></label></div>
      <button className="btn pri" disabled={!f.date || !f.text.trim()} onClick={() => { requestAdjust(f.date.split('-').reverse().join('/'), f.text.trim()); setF({ date: '', text: '' }) }}>Gửi yêu cầu</button>
    </Block>
  </>
}

function Kpi({ back }: { back: () => void }) {
  const { s, me } = useStore()
  const pts = s.points.filter(p => p.staffId === me.id)
  const ok = pts.filter(p => p.status === 'Đã duyệt')
  return <>
    <SubHead title="KPI – Điểm uy tín" sub="Điểm đi theo sự kiện thật + minh chứng · Leader/CEO duyệt" onBack={back} />
    <Tiles items={[{ v: pointsOf(s, me.id), l: 'Điểm hiện tại', color: 'deep' }, { v: `+${ok.filter(p => p.delta > 0).reduce((t, p) => t + p.delta, 0)} / ${ok.filter(p => p.delta < 0).reduce((t, p) => t + p.delta, 0)}`, l: 'Điểm tăng / giảm' }, { v: 'Chưa nối', l: 'KPI đạt / chưa đạt', s: 'chờ CEO đặt mục tiêu' }]} />
    <Block title="Lịch sử điểm & lý do thay đổi"><div className="card list">{pts.map(p => <div key={p.id} className="item"><span className="num strong" style={{ width: 34 }}>{p.delta > 0 ? '+' : ''}{p.delta}</span><div className="body"><div className="t">{p.reason}</div><div className="d">{p.source} · {D.staffName(p.by)} · {D.hhmm(p.at)}</div></div>{st(p.status)}</div>)}{!pts.length && <Empty>Chưa có điểm</Empty>}</div></Block>
    <div className="card list"><Line t="Gợi ý cần cải thiện" /></div>
  </>
}

function Train({ back }: { back: () => void }) {
  return <>
    <SubHead title="Đào tạo & phát triển" sub="Học → Test → Tìm điểm yếu → Lộ trình → Nhắc luyện → Test lại" onBack={back} />
    <div className="card list"><Line t="Khóa học đang học" /><Line t="Video / SOP cần xem" v={<span className="small">{D.SOPS.length} SOP</span>} />
      {D.SOPS.map(x => <div key={x.title} className="item"><div className="body"><div className="d">· {x.title}</div></div></div>)}
      <Line t="Bài test" /><Line t="Kết quả kiểm tra" /><Line t="Kỹ năng đã đạt" /><Line t="Kỹ năng cần cải thiện" /><Line t="Lộ trình phát triển cá nhân" /></div>
  </>
}

function Income({ back }: { back: () => void }) {
  return <>
    <SubHead title="Thu nhập của tôi" sub="Chỉ bạn và CEO xem · số liệu hiện khi nối bảng lương" onBack={back} />
    <div className="card list">{['Lương cơ bản', 'Công thực tế', 'Hoa hồng', 'Thưởng', 'Phạt', 'Tổng thu nhập dự kiến', 'Phiếu lương từng tháng'].map(t => <Line key={t} t={t} />)}</div>
  </>
}

function Requests({ back }: { back: () => void }) {
  const { s, me, go } = useStore()
  const [leave, setLeave] = useState<D.Leave['kind'] | null>(null)
  const rows = [
    ...s.leaves.filter(l => l.staffId === me.id).map(l => ({ k: l.id, at: l.at, t: `${l.kind} · ${l.date}`, d: l.detail, x: l.status })),
    ...s.adjusts.filter(a => a.staffId === me.id).map(a => ({ k: a.id, at: a.at, t: `Điều chỉnh chấm công · ${a.date}`, d: a.text, x: a.status })),
    ...s.tasks.filter(t => t.earlyReport && t.createdBy === me.id && t.status !== 'transferred').map(t => ({ k: t.id, at: t.createdMin, t: 'Báo sự cố', d: t.detail, x: t.status === 'done' ? 'Đã xử lý' : 'Đang xử lý' })),
    ...s.suggestions.filter(x => x.staffId === me.id).map(x => ({ k: x.id, at: x.createdAt, t: 'Góp ý / phản hồi', d: x.text, x: x.status })),
  ].sort((a, b) => b.at - a.at)
  return <>
    <SubHead title="Yêu cầu & lịch sử cá nhân" onBack={back} />
    <div className="chipgrid"><button className="cbtn" onClick={() => setLeave('Nghỉ phép')}>Xin nghỉ</button><button className="cbtn" onClick={() => setLeave('Đổi ca')}>Đổi ca</button><button className="cbtn" onClick={() => go('me/time')}>Điều chỉnh chấm công</button><button className="cbtn" onClick={() => go('home/incident')}>Báo sự cố</button><button className="cbtn" onClick={() => go('home/idea')}>Góp ý / phản hồi</button></div>
    <Block title="Lịch sử các yêu cầu đã gửi và trạng thái xử lý"><div className="card list">{rows.map(r => <div key={r.k} className="item"><div className="body"><div className="t">{r.t}</div><div className="d">{r.d} · {D.hhmm(r.at)}</div></div>{st(r.x)}</div>)}{!rows.length && <Empty>Chưa gửi yêu cầu</Empty>}</div></Block>
    {leave && <LeaveModal kind={leave} onClose={() => setLeave(null)} />}
  </>
}
