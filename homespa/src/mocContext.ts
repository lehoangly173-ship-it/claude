// Gói dữ liệu cho Mộc AI: CHỈ số đếm vận hành + kiến thức, theo vai trò. Không có SĐT, sức khỏe, tiền.
// Lọc 2 lớp: ở đây (chỉ lấy trường cần) + sanitizeContext (bỏ mọi trường nhạy cảm, theo vai trò thật ở máy chủ).
import * as D from './data'
import { State, custSegment, stockQty, zoneReport } from './logic'
import { sanitizeContext, type Role } from '../supabase/functions/_shared/moc-policy'

const STATUS: Record<D.ApptStatus, string> = { booked: 'đã đặt', checked_in: 'khách đã đến', in_service: 'đang làm', done: 'xong, chờ thu', paid: 'đã thanh toán', cancelled: 'đã hủy', no_show: 'không đến' }
const countBy = <T,>(xs: T[], f: (x: T) => string) => xs.reduce<Record<string, number>>((m, x) => { const k = f(x); m[k] = (m[k] ?? 0) + 1; return m }, {})
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 10) / 10 : null)

export function buildMocContext(s: State, me: D.Staff, role: D.Role) {
  // tên khách trong chữ tự do (VD tiêu đề việc) → đổi thành mã khách, không gửi tên thật cho AI
  const names = s.customers.filter(c => c.name && c.name.length > 2).sort((a, b) => b.name.length - a.name.length)
  const anon = (t: string) => names.reduce((x, c) => x.split(c.name).join(c.code), t)
  const code = (id: string) => s.customers.find(c => c.id === id)?.code ?? '—'
  const lateOf = (x: D.Staff) => { const i = s.attendance[x.id]?.in; const st = x.shift ? D.SHIFTS[x.shift].start : null; return i != null && st != null ? Math.max(0, i - st) : null }
  const fb = s.feedback
  const raw = {
    me: { name: me.name, role, shift: me.shift ?? null },
    today: D.dateShort(), now: D.hhmm(s.now),
    services: D.SERVICES.map(v => ({ name: v.name, group: v.group, minutes: v.duration })),
    docs: D.SOPS.map(p => ({ title: p.title, body: p.steps.map((x, i) => `${i + 1}. ${x}`).join('\n') })),
    myDay: {
      tours: s.appts.filter(a => a.ktvId === me.id).sort((a, b) => a.start - b.start).map(a => ({ from: D.hhmm(a.start), to: D.hhmm(a.end), service: D.svc(a.serviceId).name, bed: a.bedId, status: STATUS[a.status], customerCode: code(a.customerId) })),
      checkIn: s.attendance[me.id]?.in != null ? D.hhmm(s.attendance[me.id]!.in!) : null, lateMinutes: lateOf(me),
      reputationPoints: s.points.filter(p => p.staffId === me.id && p.status === 'Đã duyệt').reduce((t, p) => t + p.delta, 0),
      leaves: s.leaves.filter(l => l.staffId === me.id).map(l => ({ date: l.date, kind: l.kind, status: l.status })),
      cleaningZones: Object.entries(s.zoneOwner).filter(([, id]) => id === me.id).map(([z]) => ({ zone: +z, name: D.ZONES.find(x => x.no === +z)?.name ?? '', report: zoneReport(s, +z)?.status ?? 'chưa gửi' })),
      myTasks: s.tasks.filter(t => t.ownerId === me.id && ['open', 'doing'].includes(t.status)).map(t => ({ title: anon(t.title), priority: t.priority })),
    },
    ops: {
      appointments: countBy(s.appts, a => STATUS[a.status]), queueWaiting: s.queue.length, queueOver10min: s.queue.filter(q => s.now - q.arrival > 10).length,
      ktv: D.ktvs().map(k => ({ name: k.name, shift: k.shift ?? null, checkedIn: s.attendance[k.id]?.in != null, busy: s.appts.some(a => a.ktvId === k.id && a.status === 'in_service') })),
      bedsBeingCleaned: Object.keys(s.cleaning).length, cleaningReportsWaiting: s.cleanReports.filter(r => r.status === 'Chờ kiểm tra').length,
      openTasks: countBy(s.tasks.filter(t => ['open', 'doing'].includes(t.status)), t => t.category),
    },
    team: {
      attendance: s.staff.filter(x => x.role !== 'ceo').map(x => ({ name: x.name, role: D.ROLE_LABEL[x.role], checkIn: s.attendance[x.id]?.in != null ? D.hhmm(s.attendance[x.id]!.in!) : null, lateMinutes: lateOf(x) })),
      leavesWaiting: s.leaves.filter(l => l.status === 'Chờ duyệt').length, pointsWaiting: s.points.filter(p => p.status === 'Chờ duyệt').length,
      tasks: countBy(s.tasks, t => t.status),
    },
    feedback: { count: fb.length, avgRating: avg(fb.map(f => f.rating)), byGroup: Object.fromEntries(Object.entries(countBy(fb, f => f.group)).map(([g, n]) => [g, { count: n, avgRating: avg(fb.filter(f => f.group === g).map(f => f.rating)) }])), lowNotResolved: fb.filter(f => f.rating <= 3 && f.status !== 'đã xử lý').length },
    segments: { customers: s.customers.length, byGroup: countBy(s.customers, c => c.group === 'NN' ? 'Nước ngoài' : 'Việt Nam'), bySegment: countBy(s.customers, custSegment), bySource: countBy(s.customers, c => c.source || 'Chưa rõ') },
    programs: s.programs.map(p => ({ name: p.name, type: p.type, status: p.status, reached: p.reached, booked: p.booked, arrived: p.arrived })),
    stockLow: D.STOCK_ITEMS.map(it => ({ item: it.name, qty: stockQty(s, it.id), unit: it.unit, warnAt: it.warn })).filter(x => x.qty < x.warnAt),
    approvals: countBy(s.approvals.filter(a => a.status === 'Chờ duyệt'), a => a.kind),
  }
  return sanitizeContext(raw, role as Role)
}
