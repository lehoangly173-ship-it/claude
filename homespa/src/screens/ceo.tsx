// CEO (chị) & Marketing
import { useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { Pill, PageHeader, Seg, Empty, Sec, Stat, Delta, Modal } from '../ui'
import { ProgramsPanel, RoiPanel } from './leader'

export function ApprovalsScreen() {
  const { s, decide } = useStore()
  const [tab, setTab] = useState<'wait' | 'done'>('wait')
  const [note, setNote] = useState<Record<string, string>>({})
  const [read, setRead] = useState<D.WeeklyReport | null>(null)
  const list = s.approvals.filter(a => (tab === 'wait' ? a.status === 'Chờ duyệt' : a.status !== 'Chờ duyệt'))
  const m = D.HISTORY.month
  return <>
    <PageHeader eyebrow="Chị Quyên · CEO" title="Phê duyệt" sub="Đổi giá / ưu đãi, ngân sách ngoài mức, xóa hóa đơn, việc vượt quyền, báo cáo tuần, tài khoản mới" />
    <div className="grid g4">
      <Stat label="Chờ duyệt" value={s.approvals.filter(a => a.status === 'Chờ duyệt').length} tone="gold" />
      <Stat label="Doanh thu tháng" value={D.vndShort(m.now.revenue)} tone="g-fg" extra={<Delta now={m.now.revenue} prev={m.prev.revenue} unit="đ" />} />
      <Stat label="Khách quay lại (tháng)" value={m.now.returning} tone="p-fg" extra={<Delta now={m.now.returning} prev={m.prev.returning} />} />
      <Stat label="Tỷ lệ đến" value={`${m.now.showRate}%`} tone="y-fg" extra={<Delta now={m.now.showRate} prev={m.prev.showRate} unit=" điểm %" />} />
    </div>
    <Seg value={tab} onChange={setTab} items={[{ k: 'wait', label: 'Chờ duyệt', badge: s.approvals.filter(a => a.status === 'Chờ duyệt').length }, { k: 'done', label: 'Đã xử lý' }]} />
    <div className="card list">{list.map(a => { const rep = s.reports.find(r => r.id === a.refId)
      return <div key={a.id} className="item" style={{ alignItems: 'flex-start' }}><div className="body col" style={{ gap: 4 }}>
        <div className="row"><Pill tone="purple">{a.kind}</Pill><span className="t">{a.title}</span></div>
        <div className="d">Từ {a.fromId === 'system' ? 'hệ thống' : D.staffName(a.fromId)} · {a.detail}{a.deadline && ` · cần trước ${a.deadline}`}{a.note && ` · ghi chú: ${a.note}`}</div>
        {rep && <button className="link small" style={{ alignSelf: 'flex-start' }} onClick={() => setRead(rep)}>Đọc báo cáo 6 câu →</button>}
        {a.status === 'Chờ duyệt' && <div className="row"><input className="inp" style={{ flex: 1, minWidth: 160 }} placeholder="Ghi chú (tùy chọn)" value={note[a.id] ?? ''} onChange={e => setNote({ ...note, [a.id]: e.target.value })} />
          <button className="btn sm danger" onClick={() => decide(a.id, false, note[a.id])}>Từ chối</button><button className="btn sm pri" onClick={() => decide(a.id, true, note[a.id])}>{a.kind === 'Báo cáo tuần' ? 'Đã xem' : 'Duyệt'}</button></div>}
      </div>{a.status !== 'Chờ duyệt' && <Pill tone={a.status === 'Đã duyệt' ? 'green' : 'red'}>{a.status}</Pill>}</div> })}
      {!list.length && <Empty>Không có mục nào</Empty>}</div>
    {read && <Modal wide title={`Báo cáo tuần ${read.week} · ${D.staffName(read.fromId)}`} onClose={() => setRead(null)}>
      {['Kết quả so mục tiêu & kỳ trước', 'Điểm nghẽn lớn nhất', 'Nguyên nhân: có bằng chứng / đang kiểm tra', 'Leader đã chủ động làm gì', '3 ưu tiên tuần tới', 'Cần chị quyết định / hỗ trợ'].map((q, i) => <div key={i} className="col" style={{ gap: 2 }}><span className="eyebrow">{i + 1}. {q}</span><span>{read.answers[i] || '—'}</span></div>)}
    </Modal>}
  </>
}

export function MembersScreen() {
  const { s } = useStore()
  return <>
    <PageHeader eyebrow="Chị Quyên · CEO" title="Thành viên & phân quyền" sub="Ai cũng đăng nhập bằng Google, gửi yêu cầu tham gia — chị duyệt và gán vai trò" />
    <Sec eyebrow="Yêu cầu tham gia"><div className="card list">{s.join.map(j => <div key={j.id} className="item"><div className="body"><div className="t">{j.name} · {j.email}</div><div className="d">Xin vai trò {D.ROLE_LABEL[j.wantedRole]} · duyệt trong mục Phê duyệt</div></div><Pill tone={j.status === 'Đã duyệt' ? 'green' : j.status === 'Từ chối' ? 'red' : 'yellow'}>{j.status}</Pill></div>)}</div></Sec>
    <Sec eyebrow="Đội ngũ"><div className="card tbl-wrap"><table className="resp"><thead><tr><th>Tên</th><th>Vai trò</th><th>Ca</th><th>Quyền chính</th></tr></thead><tbody>
      {s.staff.map(x => <tr key={x.id}><td className="strong">{x.name}</td><td><Pill tone="purple">{D.ROLE_LABEL[x.role]}</Pill></td><td>{x.shift ? D.SHIFTS[x.shift].label : '—'}</td><td className="small muted full">{{ reception: 'Lịch, hàng chờ, thu ngân', ktv: 'Công việc của tôi, dọn giường', leader: 'Hôm nay, khách hàng, Mộc, của tôi; tự quyết trong ngân sách ≤ 2tr', ceo: 'Toàn quyền, duyệt', marketing: 'Chương trình, hiệu quả' }[x.role]}</td></tr>)}
    </tbody></table></div></Sec>
  </>
}

export function MarketingScreen() {
  const { s } = useStore()
  const [tab, setTab] = useState<'list' | 'roi' | 'source'>('list')
  const bySource = Object.entries(s.customers.reduce((m, c) => { m[c.source] = (m[c.source] ?? 0) + 1; return m }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])
  return <>
    <PageHeader eyebrow="Marketing" title="Chương trình khách hàng" sub="Tiếp cận → đặt lịch → đến thực tế → tiền đã thu → chi phí" />
    <Seg value={tab} onChange={setTab} items={[{ k: 'list', label: 'Chương trình' }, { k: 'roi', label: 'Hiệu quả' }, { k: 'source', label: 'Nguồn khách' }]} />
    {tab === 'list' && <ProgramsPanel />}
    {tab === 'roi' && <RoiPanel />}
    {tab === 'source' && <div className="card pad col">{bySource.map(([src, n]) => <div key={src} className="col" style={{ gap: 3 }}><div className="row small"><span>{src}</span><span className="right-al num strong">{n} khách</span></div><div className="bar"><i style={{ width: `${(n / bySource[0][1]) * 100}%` }} /></div></div>)}
      <div className="tiny muted">Nguồn biết đến Home lần đầu — không ghi đè khi khách quay lại.</div></div>}
  </>
}
