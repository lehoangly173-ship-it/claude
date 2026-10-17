// Dựng dữ liệu cho Mộc AI theo đúng khuôn danh sách trắng (supabase/functions/_shared/moc-policy.ts).
// Chỉ số đếm vận hành + vài ô chữ ngắn (tên nhân sự, dịch vụ, khu, hàng). Không SĐT, sức khỏe, tên khách, tiền.
// Máy chủ kiểm lại theo vai trò thật — phần này chỉ để gửi đúng thứ cần, không phải lớp bảo vệ duy nhất.
import * as D from './data'
import { State, custSegment, stockQty, zoneReport } from './logic'
import { sanitizeContext, toCounts, L, type Role } from '../supabase/functions/_shared/moc-policy'

const STATUS: Record<D.ApptStatus, string> = { booked: 'đã đặt', checked_in: 'khách đã đến', in_service: 'đang làm', done: 'xong, chờ thu', paid: 'đã thanh toán', cancelled: 'đã hủy', no_show: 'không đến' }
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 10) / 10 : null)
const SRC = new Set<string>(L.source)

export function buildMocContext(s: State, me: D.Staff, role: D.Role) {
  const code = (id: string) => s.customers.find(c => c.id === id)?.code ?? '—'
  const inAt = (id: string) => { const i = s.attendance[id]?.in; return i != null ? D.hhmm(i) : null }
  const lateOf = (x: D.Staff) => { const i = s.attendance[x.id]?.in; const st = x.shift ? D.SHIFTS[x.shift].start : null; return i != null && st != null ? Math.max(0, i - st) : null }
  const fb = s.feedback, open = s.tasks.filter(t => ['open', 'doing'].includes(t.status))
  const raw = {
    me: { name: me.name, role, shift: me.shift ?? null },
    today: D.dateShort(), now: D.hhmm(s.now),
    services: D.SERVICES.map(v => ({ name: v.name, group: v.group, minutes: v.duration })),
    myDay: {
      tours: s.appts.filter(a => a.ktvId === me.id).sort((a, b) => a.start - b.start).map(a => ({ from: D.hhmm(a.start), to: D.hhmm(a.end), service: D.svc(a.serviceId).name, bed: a.bedId, status: STATUS[a.status], customerCode: code(a.customerId) })),
      checkIn: inAt(me.id), lateMinutes: lateOf(me),
      reputationPoints: s.points.filter(p => p.staffId === me.id && p.status === 'Đã duyệt').reduce((t, p) => t + p.delta, 0),
      leaves: s.leaves.filter(l => l.staffId === me.id).map(l => ({ date: l.date, kind: l.kind, status: l.status })),
      cleaningZones: Object.entries(s.zoneOwner).filter(([, id]) => id === me.id).map(([z]) => ({ zone: +z, name: D.ZONES.find(x => x.no === +z)?.name ?? '', report: zoneReport(s, +z)?.status ?? 'chưa gửi' })),
      myOpenTasks: toCounts(open.filter(t => t.ownerId === me.id), t => t.priority), // chỉ đếm theo mức ưu tiên — tiêu đề việc có thể chứa tên khách
    },
    ops: {
      appointments: toCounts(s.appts, a => STATUS[a.status]), queueWaiting: s.queue.length, queueOver10min: s.queue.filter(q => s.now - q.arrival > 10).length,
      ktv: D.ktvs().map(k => ({ name: k.name, shift: k.shift ?? null, checkedIn: s.attendance[k.id]?.in != null, busy: s.appts.some(a => a.ktvId === k.id && a.status === 'in_service') })),
      bedsBeingCleaned: Object.keys(s.cleaning).length, cleaningReportsWaiting: s.cleanReports.filter(r => r.status === 'Chờ kiểm tra').length,
      openTasks: toCounts(open, t => t.category),
    },
    team: {
      attendance: s.staff.filter(x => x.role !== 'ceo').map(x => ({ name: x.name, role: D.ROLE_LABEL[x.role], checkIn: inAt(x.id), lateMinutes: lateOf(x) })),
      leavesWaiting: s.leaves.filter(l => l.status === 'Chờ duyệt').length, pointsWaiting: s.points.filter(p => p.status === 'Chờ duyệt').length,
      tasks: toCounts(s.tasks, t => t.status),
    },
    feedback: { count: fb.length, avgRating: avg(fb.map(f => f.rating)), byGroup: L.fbGroup.map(g => ({ group: g, count: fb.filter(f => f.group === g).length, avgRating: avg(fb.filter(f => f.group === g).map(f => f.rating)) })).filter(x => x.count), lowNotResolved: fb.filter(f => f.rating <= 3 && f.status !== 'đã xử lý').length },
    segments: { customers: s.customers.length, byGroup: toCounts(s.customers, c => c.group === 'NN' ? 'Nước ngoài' : 'Việt Nam'), bySegment: toCounts(s.customers, custSegment), bySource: toCounts(s.customers, c => SRC.has(c.source) ? c.source : 'Khác') },
    programs: s.programs.map(p => ({ type: p.type, status: p.status, reached: p.reached, booked: p.booked, arrived: p.arrived })), // không gửi tên chương trình (chữ tự do)
    stockLow: D.STOCK_ITEMS.map(it => ({ item: it.name, qty: stockQty(s, it.id), unit: it.unit, warnAt: it.warn })).filter(x => x.qty < x.warnAt),
    approvals: toCounts(s.approvals.filter(a => a.status === 'Chờ duyệt'), a => a.kind),
  }
  return sanitizeContext(raw, role as Role)
}
