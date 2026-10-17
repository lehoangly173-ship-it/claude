// CEO/Leader soạn "kiến thức" cho Mộc AI (quy trình, quy định, câu trả lời mẫu) — lưu ở máy chủ (bảng moc_docs, RLS).
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import * as D from '../data'
import { T } from '../i18n'
import { sb } from '../auth'
import { loadMocDocs, saveMocDoc, deleteMocDoc, type MocDoc } from '../db'
import { scrub } from '../../supabase/functions/_shared/moc-policy'
import { Block, Empty } from '../ui'

const ALL: D.Role[] = ['ktv', 'reception', 'leader', 'marketing', 'ceo']
export function MocDocs() {
  const { say, user } = useStore(), ceo = user.role === 'ceo'
  const [docs, setDocs] = useState<MocDoc[]>([]), [ed, setEd] = useState<(Omit<MocDoc, 'id'> & { id?: string }) | null>(null)
  const reload = () => loadMocDocs(sb()).then(setDocs).catch(e => say('⚠ ' + (e as Error).message))
  useEffect(() => { reload() }, [])
  const save = async () => { if (!ed) return; try { await saveMocDoc(sb(), { ...ed, title: ed.title.trim(), body: scrub(ed.body.trim()) }); say(T.moc.saved); setEd(null); reload() } catch (e) { say('⚠ ' + (e as Error).message) } }
  const del = async (id: string) => { try { await deleteMocDoc(sb(), id); say(T.moc.deleted); reload() } catch (e) { say('⚠ ' + (e as Error).message) } }
  return <Block title={T.moc.docsTitle} sub={T.moc.docsSub} right={<button className="btn sm pri" onClick={() => setEd({ title: '', body: '', roles: ALL, approved: true })}>{T.moc.add}</button>}>
    {ed && <div className="card pad col">
      <label className="f">{T.moc.docTitle}<input className="inp" maxLength={120} value={ed.title} onChange={e => setEd({ ...ed, title: e.target.value })} /></label>
      <label className="f">{T.moc.docBody}<textarea className="inp" rows={6} maxLength={4000} value={ed.body} onChange={e => setEd({ ...ed, body: e.target.value })} /></label>
      <div className="tiny muted">{T.moc.noMoney}</div>
      <div className="f" role="group" aria-label={T.moc.docRoles}>{T.moc.docRoles}<div className="row" style={{ gap: 6 }}>{ALL.map(r => { const on = ed.roles.includes(r)
        return <button key={r} type="button" className={`btn sm${on ? ' pri' : ''}`} aria-pressed={on} onClick={() => setEd({ ...ed, roles: on ? ed.roles.filter(x => x !== r) : [...ed.roles, r] })}>{D.ROLE_LABEL[r]}</button> })}</div></div>
      <div className="row"><button className="btn" onClick={() => setEd(null)}>Hủy</button><button className="btn pri" disabled={ed.title.trim().length < 2 || ed.body.trim().length < 2 || !ed.roles.length} onClick={save}>{T.moc.save}</button></div>
    </div>}
    <div className="card list">{docs.map(d => <div key={d.id} className="item"><div className="body"><div className="t">{d.title}</div><div className="d">{d.roles.map(r => D.ROLE_LABEL[r]).join(' · ')} · {d.approved ? T.moc.approved : T.moc.pending}</div><div className="tiny muted">{d.body.slice(0, 140)}{d.body.length > 140 ? '…' : ''}</div></div>
      {!d.approved && ceo && <button className="btn sm pri" onClick={async () => { try { await saveMocDoc(sb(), { ...d, approved: true }); say(T.moc.saved); reload() } catch (e) { say('⚠ ' + (e as Error).message) } }}>{T.moc.approve}</button>}<button className="btn sm" onClick={() => setEd({ ...d, approved: true })}>Sửa</button><button className="btn sm danger" onClick={() => del(d.id)}>{T.moc.del}</button></div>)}
      {!docs.length && <Empty>{T.moc.none}</Empty>}</div>
  </Block>
}
