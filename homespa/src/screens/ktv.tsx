// Công việc của tôi (KTV) — dữ liệu lấy từ lịch chung; bấm Bắt đầu/Hoàn thành/Dọn xong
// sẽ cập nhật ngay Lịch điều phối, Sơ đồ giường và Thu ngân.
import { useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { cust, ktvState } from '../logic'
import { Pill, PageHeader, Sec, Empty, Modal } from '../ui'
import { ApptPill } from './ops'
import { T } from '../i18n'

export function MyWorkScreen() {
  const { s, me, setApptStatus, bedReady, openCustomer, startTask, completeTask, addTask } = useStore()
  const st = ktvState(s, me.id)
  const mine = s.appts.filter(a => a.ktvId === me.id && a.status !== 'cancelled').sort((a, b) => a.start - b.start)
  const focus = st.current ?? mine.find(a => a.status === 'checked_in') ?? mine.find(a => a.status === 'booked')
  const myBeds = Object.entries(s.cleaning).filter(([, k]) => k === me.id).map(([b]) => b)
  const [checks, setChecks] = useState<Record<string, boolean[]>>({})
  const tasks = s.tasks.filter(t => t.ownerId === me.id && t.status !== 'transferred')
  const [report, setReport] = useState(false)
  const [txt, setTxt] = useState('')
  const [doneFor, setDoneFor] = useState<string | null>(null)
  const [result, setResult] = useState('')
  const counts = { all: mine.filter(a => a.status !== 'no_show').length, done: mine.filter(a => a.status === 'done' || a.status === 'paid').length, active: mine.filter(a => a.status === 'in_service').length }
  return <>
    <PageHeader eyebrow={`${T.menu.work} · KTV ${me.name} · ${me.shift ? D.SHIFTS[me.shift].label : ''}`} title="Công việc của tôi" sub={<>Trạng thái: <Pill tone={st.tone} dot>{st.label}{st.until ? ` · ${D.hhmm(st.until)}` : ''}</Pill></>}
      right={<button className="btn" onClick={() => setReport(true)}>⚠ Báo sự cố sớm</button>} />
    <div className="split">
      <div className="col" style={{ gap: 18 }}>
        <Sec eyebrow={st.current ? 'Đang phục vụ' : 'Việc tiếp theo'}>
          {focus ? <div className="card pad col">
            <div className="row"><span className="num" style={{ fontSize: 28, fontWeight: 800 }}>{D.hhmm(focus.start)}</span><div style={{ minWidth: 0 }}><div className="strong" style={{ fontSize: 17 }}>{cust(s, focus.customerId).name}</div><div className="small muted">{D.svc(focus.serviceId).name} · giường {focus.bedId}</div></div><span className="right-al"><ApptPill a={focus} now={s.now} /></span></div>
            {(focus.note || cust(s, focus.customerId).health || cust(s, focus.customerId).preference) && <div className="warn small">📌 {[focus.note, cust(s, focus.customerId).health, cust(s, focus.customerId).preference].filter(Boolean).join(' · ')}</div>}
            <div className="row">
              <button className="btn" onClick={() => openCustomer(focus.customerId)}>Xem khách</button>
              {focus.status === 'booked' && <span className="small muted">Chờ lễ tân xác nhận khách đã đến</span>}
              {focus.status === 'checked_in' && <button className="btn pri" disabled={!!s.cleaning[focus.bedId]} onClick={() => setApptStatus(focus.id, 'in_service')}>{s.cleaning[focus.bedId] ? `Giường ${focus.bedId} chưa dọn xong` : '▶ Bắt đầu'}</button>}
              {focus.status === 'in_service' && <button className="btn pri" onClick={() => setApptStatus(focus.id, 'done')}>✓ Hoàn thành — đến {D.hhmm(focus.end)}</button>}
            </div>
          </div> : <div className="card"><Empty>Không có khách tiếp theo — đang rảnh</Empty></div>}
        </Sec>
        <Sec eyebrow="Dọn giường sau khi phục vụ">
          {myBeds.length ? myBeds.map(b => { const c = checks[b] ?? [false, false, false, false]; const sop = D.SOPS[0]
            return <div key={b} className="card pad col"><b>Giường {b}</b>
              {sop.steps.slice(0, 3).map((x, i) => <label key={i} className="check"><input type="checkbox" checked={c[i]} onChange={() => setChecks({ ...checks, [b]: c.map((v, j) => (j === i ? !v : v)) })} />{x}</label>)}
              <button className="btn pri" disabled={!c.slice(0, 3).every(Boolean)} onClick={() => { bedReady(b); setChecks({ ...checks, [b]: [false, false, false, false] }) }}>Báo giường sẵn sàng</button>
            </div> }) : <div className="card"><Empty>Không có giường cần dọn</Empty></div>}
        </Sec>
        <Sec eyebrow="Việc được giao">
          <div className="card list">{tasks.map(t => <div key={t.id} className="item"><span className={`sev ${t.priority}`} /><div className="body"><div className="t">{t.title}</div><div className="d">{t.detail}{t.result && ` · Kết quả: ${t.result}`}</div></div>
            {t.status === 'open' && <button className="btn sm" onClick={() => startTask(t.id)}>Nhận việc</button>}
            {t.status === 'doing' && <button className="btn sm pri" onClick={() => { setDoneFor(t.id); setResult('') }}>Hoàn thành</button>}
            {t.status === 'done' && <Pill tone="green">Xong</Pill>}</div>)}
            {!tasks.length && <Empty>Không có việc được giao</Empty>}</div>
        </Sec>
      </div>
      <Sec eyebrow="Tour hôm nay">
        <div className="card pad col">
          <div className="grid g3">{[[counts.all, 'tour'], [counts.done, 'hoàn thành'], [counts.active, 'đang làm']].map(([n, l]) => <div key={l as string}><div className="num" style={{ fontSize: 24, fontWeight: 800 }}>{n}</div><div className="tiny muted">{l}</div></div>)}</div>
          {mine.map(a => <div key={a.id} className="row small" style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}><span className="num strong">{D.hhmm(a.start)}</span><span style={{ flex: 1, minWidth: 0 }}>{cust(s, a.customerId).name}{a.requested && <span className="tiny muted"> · yêu cầu bạn</span>}</span><ApptPill a={a} now={s.now} /></div>)}
          {!mine.length && <Empty>Chưa có tour</Empty>}
        </div>
      </Sec>
    </div>
    {report && <Modal title="Báo sự cố sớm cho Leader" onClose={() => setReport(false)} footer={<><button className="btn" onClick={() => setReport(false)}>Hủy</button><button className="btn pri" disabled={!txt.trim()} onClick={() => { addTask({ title: `KTV ${me.name} báo: ${txt.trim().slice(0, 60)}`, detail: txt.trim(), category: 'Vận hành', priority: 'vừa', ownerId: D.firstOf('leader'), earlyReport: true }); setReport(false); setTxt('') }}>Gửi Leader</button></>}>
      <div className="small muted">Báo sớm được ghi nhận tích cực, không trừ điểm. Leader nhận việc ngay trong mục "Hôm nay".</div>
      <textarea id="rp-txt" className="inp" value={txt} onChange={e => setTxt(e.target.value)} placeholder="VD: máy xông giường TL-08 yếu, khách phàn nàn lạnh" />
    </Modal>}
    {doneFor && <Modal title="Ghi kết quả" onClose={() => setDoneFor(null)} footer={<button className="btn pri" disabled={!result.trim()} onClick={() => { completeTask(doneFor, result.trim(), ''); setDoneFor(null) }}>Hoàn thành</button>}>
      <input id="kt-res" className="inp" value={result} onChange={e => setResult(e.target.value)} placeholder="VD: đã vệ sinh, thay nước" />
    </Modal>}
  </>
}
