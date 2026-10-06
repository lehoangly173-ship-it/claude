// Kho dữ liệu chung + mọi thao tác. Màn hình chỉ gọi hành động ở đây,
// nên một thay đổi (chia tour, thu tiền, xong việc) cập nhật mọi nơi cùng lúc.
import { createContext, useContext, useState, ReactNode } from 'react'
import * as D from './data'
import { State, ktvConflict, bedConflict, custConflict, cust, CLEAN_MIN } from './logic'

export type User = { role: D.Role; staffId: string }
const DEFAULT_USER: Record<D.Role, string> = { reception: 'lam', ktv: 'mai', leader: 'thao', ceo: 'quyen', marketing: 'khoa' }
export const defaultStaffFor = (r: D.Role) => DEFAULT_USER[r]

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
const initial = (): State => ({
  now: D.START_MIN,
  appts: clone(D.SEED_APPTS), queue: clone(D.SEED_QUEUE), customers: clone(D.SEED_CUSTOMERS),
  invoices: clone(D.SEED_INVOICES), cleaning: { 'TL-02': 'lan' },
  rotation: { 1: ['mai', 'hien', 'lan', 'phuong', 'trieu'], 2: ['bao', 'ngoc', 'thu'] },
  tasks: clone(D.SEED_TASKS), feedback: clone(D.SEED_FEEDBACK), programs: clone(D.SEED_PROGRAMS),
  initiatives: clone(D.SEED_INITIATIVES), approvals: clone(D.SEED_APPROVALS), reports: [],
  notifs: [
    { id: 'n1', cat: 'Lịch hẹn', text: 'Nguyễn Thị Lan đặt lịch 10:30 với KTV Mai', detail: 'Massage trị liệu 90 phút · khách yêu cầu đích danh', min: 560, roles: ['reception', 'ktv'], nav: 'schedule', readBy: [] },
    { id: 'n2', cat: 'Thu ngân', text: 'Trần Văn Minh xong dịch vụ, chờ thanh toán', detail: 'Massage trị liệu 90 phút · 570.000đ', min: 600, roles: ['reception'], nav: 'cashier', readBy: [] },
    { id: 'n3', cat: 'Leader', text: 'Phản hồi 2/5 lặp lại lần 3 — Thời gian chờ', detail: 'Vũ Thị Kim · đã giao Leader Thảo xử lý', min: 520, roles: ['leader', 'ceo'], nav: 'customers', readBy: [] },
    { id: 'n4', cat: 'Hệ thống', text: 'Có tài khoản mới xin vào app', detail: 'ktv.dung@gmail.com · xin vai trò KTV', min: 500, roles: ['ceo'], nav: 'approvals', readBy: [] },
  ],
  join: clone(D.SEED_JOIN), staff: clone(D.STAFF), seq: 200,
})

type Ctx = ReturnType<typeof useStoreValue>
const StoreCtx = createContext<Ctx | null>(null)
export const useStore = () => useContext(StoreCtx)!

// Ngưỡng quyền hạn Leader/Marketing: vượt ngưỡng → gửi chị (CEO) duyệt trước
export const BUDGET_LIMIT = 2000000

function useStoreValue() {
  const [s, setS] = useState<State>(initial)
  const [user, setUser] = useState<User>({ role: 'reception', staffId: 'lam' })
  const [toast, setToast] = useState<string | null>(null)
  const [page, go] = useState('overview')
  const [profile, openCustomer] = useState<string | null>(null)
  const [draftBill, setDraftBill] = useState<string | null>(null) // apptId mở sẵn ở Thu ngân
  D.setStaffLive(s.staff)
  const me = s.staff.find(x => x.id === user.staffId)!
  const say = (t: string) => { setToast(t); window.clearTimeout((say as any)._t); (say as any)._t = window.setTimeout(() => setToast(null), 2600) }

  // mutate: sao chép trạng thái, sửa trên bản sao, ghi lại
  const mutate = (fn: (d: State) => void) => setS(prev => { const d = clone(prev); fn(d); return d })
  const id = (d: State, p: string) => `${p}${++d.seq}`
  // kiểm tra trên dữ liệu hiện tại, rồi kiểm tra lại ngay lúc ghi (chống bấm đúp / dữ liệu cũ)
  const tryMutate = (check: (d: State) => string | null, apply: (d: State) => void, ok?: string): string | null => {
    const e = check(s); if (e) return e
    mutate(d => { if (!check(d)) apply(d) }); if (ok) say(ok); return null
  }
  const notify = (d: State, n: Omit<D.Notif, 'id' | 'min' | 'readBy'>) => d.notifs.unshift({ ...n, id: id(d, 'n'), min: d.now, readBy: [] })

  const actions = {
    reset: () => { setS(initial()); say('Đã khôi phục dữ liệu mẫu') },
    advance: (m: number) => mutate(d => { d.now = Math.min(20 * 60, d.now + m) }),

    // ── Lịch hẹn ── (kiểm tra 2 lần: trước khi bấm và ngay lúc ghi, để bấm đúp không tạo trùng)
    addAppt: (f: { customerId: string; serviceId: string; ktvId: string; bedId: string; start: number; requested: boolean; channel: string; note?: string; status?: D.ApptStatus }): string | null => {
      const end = f.start + D.svc(f.serviceId).duration
      return tryMutate(d => (D.bedZoneFor(f.serviceId) !== D.BEDS.find(b => b.id === f.bedId)?.zone ? 'Giường không đúng khu vực của dịch vụ' : null) || custConflict(d, f.customerId, f.start, end) || ktvConflict(d, f.ktvId, f.start, end) || bedConflict(d, f.bedId, f.start, end), d => {
        d.appts.push({ id: id(d, 'a'), end, status: f.status ?? 'booked', ...f })
        notify(d, { cat: 'Lịch hẹn', text: `Lịch mới ${D.hhmm(f.start)} — ${cust(d, f.customerId).name}`, detail: `${D.svc(f.serviceId).name} · KTV ${D.staffName(f.ktvId)} · ${f.bedId}`, roles: ['reception', 'ktv'], nav: 'schedule' })
      }, 'Đã tạo lịch hẹn')
    },
    moveAppt: (apptId: string, start: number, ktvId: string, bedId: string): string | null => {
      const dur = (() => { const a = s.appts.find(x => x.id === apptId)!; return a.end - a.start })()
      return tryMutate(d => custConflict(d, d.appts.find(x => x.id === apptId)!.customerId, start, start + dur, apptId) || ktvConflict(d, ktvId, start, start + dur, apptId) || bedConflict(d, bedId, start, start + dur, apptId),
        d => { Object.assign(d.appts.find(x => x.id === apptId)!, { start, end: start + dur, ktvId, bedId }) }, 'Đã cập nhật lịch hẹn')
    },
    setApptStatus: (apptId: string, status: D.ApptStatus): string | null => {
      const check = (d: State): string | null => {
        const a = d.appts.find(x => x.id === apptId)!
        if (status === 'in_service') {
          if (a.status !== 'checked_in') return 'Chỉ bắt đầu được khi khách đã đến'
          if (d.appts.some(x => x.ktvId === a.ktvId && x.status === 'in_service')) return `KTV ${D.staffName(a.ktvId)} đang phục vụ khách khác`
          if (d.cleaning[a.bedId]) return `Giường ${a.bedId} chưa dọn xong`
          const st = Math.max(d.now, a.start)
          return ktvConflict(d, a.ktvId, st, st + (a.end - a.start), a.id) ? `Bắt đầu lúc ${D.hhmm(st)} sẽ trùng lịch kế tiếp của KTV — đổi KTV/giờ lịch sau trước` : null
        }
        if (status === 'done' && a.status !== 'in_service') return 'Chỉ hoàn thành được lượt đang phục vụ'
        if (status === 'checked_in' && a.status !== 'booked') return 'Lịch không ở trạng thái đã đặt'
        if ((status === 'cancelled' || status === 'no_show') && a.status !== 'booked') return 'Chỉ hủy được lịch chưa đến'
        return null
      }
      const e = tryMutate(check, d => {
        const a = d.appts.find(x => x.id === apptId)!
        if (status === 'in_service') { const dur = a.end - a.start; a.startedAt = d.now; if (d.now > a.start) { a.start = d.now; a.end = d.now + dur } }
        if (status === 'done') {
          a.finishedAt = d.now; a.end = Math.min(a.end, Math.max(d.now, a.start + 1)); d.cleaning[a.bedId] = a.ktvId
          notify(d, { cat: 'Thu ngân', text: `${cust(d, a.customerId).name} xong dịch vụ, chờ thanh toán`, detail: `${D.svc(a.serviceId).name} · KTV ${D.staffName(a.ktvId)}`, roles: ['reception'], nav: 'cashier' })
        }
        if (status === 'checked_in') notify(d, { cat: 'KTV', text: `Khách ${cust(d, a.customerId).name} đã đến`, detail: `${D.hhmm(a.start)} · ${a.bedId}`, roles: ['ktv'], nav: 'mywork' })
        a.status = status
      })
      if (e) say('⚠ ' + e)
      return e
    },
    bedReady: (bedId: string) => mutate(d => {
      const k = d.cleaning[bedId]; if (!k) return; delete d.cleaning[bedId]
      notify(d, { cat: 'Điều phối', text: `Giường ${bedId} đã sẵn sàng`, detail: `KTV ${D.staffName(k)} dọn xong · có thể nhận khách`, roles: ['reception'], nav: 'beds' })
    }),

    // ── Hàng chờ & chia tour ──
    addQueue: (g: Omit<D.QueueGuest, 'id' | 'arrival'>): string | null => {
      const e = tryMutate(d => {
        if (d.queue.some(q => q.customerId === g.customerId)) return 'Khách đã có trong hàng chờ'
        const a = d.appts.find(x => x.customerId === g.customerId && ['booked', 'checked_in', 'in_service'].includes(x.status))
        return a ? `Khách đã có lịch ${D.hhmm(a.start)} với KTV ${D.staffName(a.ktvId)} — mở Lịch và bấm "Khách đã đến"` : null
      }, d => { d.queue.push({ ...g, id: id(d, 'q'), arrival: d.now }) }, 'Đã thêm vào hàng chờ')
      if (e) say('⚠ ' + e)
      return e
    },
    assignTour: (qid: string, ktvId: string, bedId: string, start: number): string | null => {
      const q0 = s.queue.find(x => x.id === qid); if (!q0) return 'Khách không còn trong hàng chờ'
      const end = start + D.svc(q0.serviceId).duration
      return tryMutate(d => (!d.queue.some(x => x.id === qid) ? 'Khách không còn trong hàng chờ' : start < d.now ? 'Giờ bắt đầu đã qua' : null) || ktvConflict(d, ktvId, start, end) || bedConflict(d, bedId, start, end), d => {
        const q = d.queue.find(x => x.id === qid)!
        d.queue = d.queue.filter(x => x.id !== qid)
        d.appts.push({ id: id(d, 'a'), customerId: q.customerId, ktvId, bedId, serviceId: q.serviceId, start, end, status: 'checked_in', requested: q.requestedKtvId === ktvId, channel: 'Đến trực tiếp', note: q.note, waitMin: start - q.arrival })
        // Xoay tour: KTV vừa nhận xuống cuối hàng — trừ khi khách yêu cầu đích danh (không mất lượt)
        const sh = d.staff.find(x => x.id === ktvId)!.shift!
        if (q.requestedKtvId !== ktvId) d.rotation[sh] = [...d.rotation[sh].filter(x => x !== ktvId), ktvId]
        notify(d, { cat: 'KTV', text: `Nhận khách ${cust(d, q.customerId).name} lúc ${D.hhmm(start)}`, detail: `${D.svc(q.serviceId).name} · ${bedId}`, roles: ['ktv'], nav: 'mywork' })
      }, `Đã chia tour cho KTV ${D.staffName(ktvId)}`)
    },
    removeQueue: (qid: string) => mutate(d => { d.queue = d.queue.filter(x => x.id !== qid) }),

    addCustomer: (c: Pick<D.Customer, 'name' | 'phone' | 'group' | 'source'> & { code?: string }): D.Customer | string => {
      if (c.code && s.customers.some(x => x.code === c.code)) return `Mã ${c.code} đã tồn tại`
      const n = s.customers.filter(x => x.code.startsWith('KL')).length + 101
      const nc: D.Customer = { id: 'c' + Date.now(), code: c.code || 'KL' + String(n).padStart(4, '0'), name: c.name || 'Khách mới', phone: c.phone, group: c.group, source: c.source, firstVisit: D.dateShort(), visits: 0, lastVisitDays: 0, totalPaid: 0, packages: [], care: [] }
      mutate(d => { d.customers.push(nc) }); return nc
    },
    addCare: (customerId: string, text: string) => mutate(d => { cust(d, customerId).care.unshift({ at: D.stamp(d.now), by: me.name, text }) }),

    // ── Thu ngân ──
    confirmInvoice: (inv: Omit<D.Invoice, 'code' | 'createdAt' | 'createdMin' | 'creator' | 'log'>, pkgNew?: D.Package, pkgCollect = 0): string => {
      let code = ''
      mutate(d => {
        code = 'HD' + String(150 + ++d.seq).padStart(6, '0')
        const c = cust(d, inv.customerId)
        const at = D.stamp(d.now)
        const rec: D.Invoice = { ...inv, code, createdAt: at, createdMin: d.now, creator: me.name, log: [{ at, by: me.name, text: inv.status === 'Nháp' ? 'Lưu nháp' : `Xác nhận · ${inv.status} · thu ${D.vnd(inv.paid)}` }] }
        d.invoices.unshift(rec)
        if (inv.status === 'Nháp') return
        // 1) trừ thẻ: chỉ trừ đúng thẻ được chọn trên từng dòng
        inv.lines.filter(l => l.cardCode).forEach(l => {
          const p = c.packages.find(x => x.cardCode === l.cardCode)!
          const before = D.pkgLeftLabel(p)
          if (p.type === 'session') p.used = (p.used ?? 0) + 1; else p.valueUsed = (p.valueUsed ?? 0) + l.price
          p.usage.unshift({ at, service: D.svc(l.serviceId).name, ktv: D.staffName(l.ktvId), deducted: p.type === 'session' ? '1 buổi' : D.vnd(l.price), before, after: D.pkgLeftLabel(p), invoice: code })
        })
        // 2) bán mới / tái tục / đóng tiếp gói
        const pay0 = inv.payments.find(p => p.amount > 0)?.method ?? 'Tiền mặt'
        if (pkgNew && inv.pkgSale) {
          const amt = Math.min(inv.pkgSale.price, pkgCollect)
          if (amt > 0) pkgNew.payments.push({ at, amount: amt, method: pay0, by: me.name, invoice: code, kind: amt >= pkgNew.finalPrice ? 'Thanh toán đủ' : 'Cọc' })
          c.packages.push(pkgNew)
        } else if (inv.pkgSale?.mode === 'continue') {
          const p = c.packages.find(x => x.cardCode === inv.pkgSale!.cardCode)!
          const amt = Math.min(D.pkgOwed(p), pkgCollect)
          if (amt > 0) p.payments.push({ at, amount: amt, method: pay0, by: me.name, invoice: code, kind: amt >= D.pkgOwed(p) ? 'Thanh toán đủ' : 'Đóng tiếp' })
        }
        // 3) lượt phục vụ → đã thanh toán; hồ sơ khách cập nhật
        inv.lines.forEach(l => { const a = d.appts.find(x => x.id === l.apptId); if (a) a.status = 'paid' })
        if (inv.lines.some(l => l.apptId)) { c.visits += 1; c.lastVisitDays = 0 }
        c.totalPaid += inv.paid
        // ghi nhận hiệu quả chương trình khi khách dùng voucher
        const pr = d.programs.find(p => p.id === inv.voucherProgramId)
        if (pr) { pr.arrived += 1; pr.revenue += inv.paid; pr.cost += inv.voucherDiscount ?? 0 }
        notify(d, { cat: 'Thu ngân', text: `${code} · ${c.name} · ${inv.status}`, detail: `Tổng ${D.vnd(inv.total)} · thu ${D.vnd(inv.paid)}`, roles: ['leader', 'ceo'], nav: 'cashier' })
      })
      say(inv.status === 'Nháp' ? 'Đã lưu nháp' : 'Đã xác nhận hóa đơn')
      return code
    },
    requestInvoiceDelete: (code: string, reason: string) => {
      mutate(d => { d.approvals.unshift({ id: id(d, 'ap'), kind: 'Sửa / xóa hóa đơn', fromId: me.id, title: `Xóa mềm hóa đơn ${code}`, detail: `Lý do: ${reason}`, status: 'Chờ duyệt', refId: code }) })
      say('Đã gửi yêu cầu xóa — chờ chị duyệt')
    },

    // ── Việc cần làm: Mở → Nhận xử lý → Ghi kết quả/minh chứng → Hoàn thành / Chuyển ──
    addTask: (t: Pick<D.Task, 'title' | 'detail' | 'category' | 'priority' | 'ownerId'> & Partial<D.Task>) => {
      mutate(d => { d.tasks.unshift({ status: 'open', createdBy: me.id, createdMin: d.now, ...t, id: id(d, 't') }) }); say('Đã tạo việc')
    },
    startTask: (tid: string) => mutate(d => { const t = d.tasks.find(x => x.id === tid)!; t.status = 'doing'; t.startedMin = d.now }),
    completeTask: (tid: string, result: string, evidence: string) => {
      mutate(d => {
        const t = d.tasks.find(x => x.id === tid)!
        Object.assign(t, { status: 'done', doneMin: d.now, result, evidence })
        // Nhập kết quả MỘT lần → tự vào hồ sơ khách + chỉ số cá nhân
        if (t.customerId) cust(d, t.customerId).care.unshift({ at: D.stamp(d.now), by: me.name, text: `${t.title} → ${result}` })
        const fb = d.feedback.find(f => f.id === t.feedbackId)
        if (fb) { fb.status = 'đã xử lý'; fb.handlerId = me.id }
      })
      say('Đã hoàn thành — kết quả đã lưu vào hồ sơ')
    },
    transferTask: (tid: string, to: string, reason: string) => {
      mutate(d => {
        const t = d.tasks.find(x => x.id === tid)!
        t.status = 'transferred'; t.transferTo = to; t.result = reason; t.prevOwner = t.ownerId
        if (d.staff.find(x => x.id === to)?.role === 'ceo') d.approvals.unshift({ id: id(d, 'ap'), kind: 'Chuyển vượt quyền', fromId: me.id, title: t.title, detail: reason, status: 'Chờ duyệt', refId: tid })
        else d.tasks.unshift({ ...t, id: id(d, 't'), ownerId: to, status: 'open', createdBy: me.id, createdMin: d.now, transferTo: undefined, result: undefined })
      })
      say(`Đã chuyển cho ${D.staffName(to)}`)
    },
    setFeedback: (fid: string, status: D.Feedback['status']) => mutate(d => { const f = d.feedback.find(x => x.id === fid)!; f.status = status; f.handlerId = me.id }),

    // ── Chương trình / sáng kiến: ngoài quyền hạn → chị duyệt trước ──
    addProgram: (p: Omit<D.Program, 'id' | 'status' | 'reached' | 'booked' | 'arrived' | 'revenue' | 'cost'>) => {
      const needs = p.budget > BUDGET_LIMIT || !!p.discount
      mutate(d => {
        const pid = id(d, 'pr')
        d.programs.unshift({ ...p, id: pid, status: needs ? 'Chờ duyệt' : 'Đang chạy', reached: 0, booked: 0, arrived: 0, revenue: 0, cost: 0 })
        if (needs) d.approvals.unshift({ id: id(d, 'ap'), kind: p.discount ? 'Đổi giá / ưu đãi' : 'Ngân sách', fromId: me.id, title: `Chương trình "${p.name}"`, detail: `Ngân sách ${D.vnd(p.budget)}${p.discount ? ` · ưu đãi: ${p.discount}` : ''}`, status: 'Chờ duyệt', refId: pid })
      })
      say(needs ? 'Có ưu đãi/ngân sách vượt mức — đã gửi chị duyệt' : 'Đã bắt đầu chương trình')
    },
    addInitiative: (i: Omit<D.Initiative, 'id' | 'status' | 'progress' | 'ownerId'>) => {
      const needs = i.budget > BUDGET_LIMIT
      mutate(d => {
        const iid = id(d, 'i')
        d.initiatives.unshift({ ...i, id: iid, status: needs ? 'Chờ duyệt' : 'Đang làm', progress: 0, ownerId: me.id, approvedBudget: needs ? undefined : i.budget })
        if (needs) d.approvals.unshift({ id: id(d, 'ap'), kind: 'Ngân sách', fromId: me.id, title: `${i.kind}: ${i.title}`, detail: `Ngân sách ${D.vnd(i.budget)} · ${i.goal}`, status: 'Chờ duyệt', refId: iid })
      })
      say(needs ? 'Vượt ngân sách được giao — đã gửi chị duyệt' : 'Đã tạo, bắt đầu triển khai')
    },
    updateInitiative: (iid: string, patch: Partial<D.Initiative>) => {
      let msg = 'Đã lưu'
      mutate(d => {
        const i = d.initiatives.find(x => x.id === iid)!
        const { status: _ignored, ...rest } = patch
        const budgetUp = rest.budget != null && rest.budget > BUDGET_LIMIT && rest.budget > (i.approvedBudget ?? 0)
        Object.assign(i, rest)
        if (i.status === 'Đề xuất' || i.status === 'Chờ duyệt' || i.status === 'Chờ xác nhận kết quả' || i.status === 'Đã kiểm chứng') { if (!budgetUp) return }
        if (budgetUp) {
          i.status = 'Chờ duyệt'; msg = 'Ngân sách tăng vượt mức — đã gửi chị duyệt'
          d.approvals.unshift({ id: id(d, 'ap'), kind: 'Ngân sách', fromId: me.id, title: `${i.kind}: ${i.title}`, detail: `Ngân sách mới ${D.vnd(i.budget)} (đã duyệt ${D.vnd(i.approvedBudget ?? 0)})`, status: 'Chờ duyệt', refId: iid })
        } else if (i.progress >= 100 && i.after) {
          // Kết quả phải được chị xác nhận mới tính "đã kiểm chứng"
          i.status = 'Chờ xác nhận kết quả'; msg = 'Đã gửi chị xác nhận kết quả trước/sau'
          d.approvals.unshift({ id: id(d, 'ap'), kind: 'Xác nhận kết quả', fromId: me.id, title: `${i.kind}: ${i.title}`, detail: `Trước: ${i.before} → Sau: ${i.after}${i.proposal ? ` · đề xuất ${i.proposal}` : ''}`, status: 'Chờ duyệt', refId: iid })
        }
      })
      say(msg)
    },
    sendReport: (week: string, answers: string[]) => {
      mutate(d => {
        const rid = id(d, 'r')
        d.reports.unshift({ id: rid, week, fromId: me.id, answers, sentAt: D.stamp(d.now), status: 'Đã gửi' })
        d.approvals.unshift({ id: id(d, 'ap'), kind: 'Báo cáo tuần', fromId: me.id, title: `Báo cáo tuần ${week}`, detail: answers[5] || 'Không có đề xuất cần quyết định', status: 'Chờ duyệt', refId: rid })
      })
      say('Đã gửi báo cáo tuần cho chị')
    },
    decide: (aid: string, ok: boolean, note = '') => {
      if (user.role !== 'ceo') return say('Chỉ chị (CEO) được duyệt')
      mutate(d => {
        const a = d.approvals.find(x => x.id === aid)!
        if (a.status !== 'Chờ duyệt') return
        a.status = ok ? 'Đã duyệt' : 'Từ chối'; a.note = note
        const pr = d.programs.find(x => x.id === a.refId)
        if (pr) { if (a.budgetDelta) { if (ok) pr.budget += a.budgetDelta } else pr.status = ok ? 'Đang chạy' : 'Nháp' }
        const ini = d.initiatives.find(x => x.id === a.refId)
        if (ini) {
          if (a.kind === 'Xác nhận kết quả') ini.status = ok ? 'Đã kiểm chứng' : 'Đang làm'
          else { ini.status = ok ? 'Đang làm' : 'Đề xuất'; if (ok) ini.approvedBudget = ini.budget }
        }
        const tk = d.tasks.find(x => x.id === a.refId)
        if (tk) { if (ok) Object.assign(tk, { status: 'done', doneMin: d.now, result: `Chị đã quyết: ${note || 'đồng ý'}` }); else Object.assign(tk, { status: 'doing', ownerId: tk.prevOwner ?? tk.ownerId, transferTo: undefined, result: `Chị trả lại: ${note || 'Leader tự xử lý trong quyền hạn'}` }) }
        const rep = d.reports.find(x => x.id === a.refId); if (rep) rep.status = 'Đã xem'
        const inv = d.invoices.find(x => x.code === a.refId)
        if (inv && ok && a.kind === 'Sửa / xóa hóa đơn' && inv.status !== 'Đã xóa') {
          // Đảo toàn bộ tác động của hóa đơn: hoàn buổi/tiền thẻ, gỡ khoản đóng gói, trả lượt về "chờ thanh toán"
          const c = cust(d, inv.customerId)
          if (inv.status !== 'Nháp') {
            c.packages.forEach(p => {
              p.usage.filter(u => u.invoice === inv.code).forEach(() => { if (p.type === 'session') p.used = Math.max(0, (p.used ?? 0) - 1) })
              if (p.type === 'money') p.valueUsed = Math.max(0, (p.valueUsed ?? 0) - inv.lines.filter(l => l.cardCode === p.cardCode).reduce((t, l) => t + l.price, 0))
              p.usage = p.usage.filter(u => u.invoice !== inv.code)
              p.payments = p.payments.filter(x => x.invoice !== inv.code)
            })
            if (inv.pkgSale && inv.pkgSale.mode !== 'continue') c.packages = c.packages.filter(p => p.cardCode !== inv.pkgSale!.cardCode || p.usage.length > 0)
            inv.lines.forEach(l => { const ap = d.appts.find(x => x.id === l.apptId); if (ap && ap.status === 'paid') ap.status = 'done' })
            if (inv.lines.some(l => l.apptId)) c.visits = Math.max(0, c.visits - 1)
            c.totalPaid = Math.max(0, c.totalPaid - inv.paid)
            const pr = d.programs.find(p => p.id === inv.voucherProgramId)
            if (pr) { pr.arrived -= 1; pr.revenue -= inv.paid; pr.cost -= inv.voucherDiscount ?? 0 }
          }
          inv.status = 'Đã xóa'; inv.log.push({ at: D.stamp(d.now), by: 'Chị Quyên', text: `Duyệt xóa mềm · ${a.detail} · đã hoàn thẻ & trả lượt về chờ thanh toán` })
        }
        const j = d.join.find(x => x.id === a.refId)
        if (j) { j.status = ok ? 'Đã duyệt' : 'Từ chối'; if (ok) { const nid = 'u' + j.id; d.staff.push({ id: nid, name: j.name, role: j.wantedRole, shift: j.wantedRole === 'ktv' ? 2 : undefined }); if (j.wantedRole === 'ktv') d.rotation[2].push(nid) } }
        notify(d, { cat: 'Hệ thống', text: `Chị ${ok ? 'đã duyệt' : 'từ chối'}: ${a.title}`, detail: note || a.kind, roles: ['leader', 'marketing', 'reception'], nav: a.kind === 'Báo cáo tuần' ? 'mine' : undefined })
      })
      say(ok ? 'Đã duyệt' : 'Đã từ chối')
    },
    requestApproval: (a: Pick<D.Approval, 'kind' | 'title' | 'detail'> & { refId?: string }) => {
      mutate(d => { d.approvals.unshift({ ...a, id: id(d, 'ap'), fromId: me.id, status: 'Chờ duyệt' }) }); say('Đã gửi chị duyệt')
    },
    importOpening: (customerId: string, p: D.Package) => {
      mutate(d => { cust(d, customerId).packages.push(p); cust(d, customerId).care.unshift({ at: D.stamp(d.now), by: me.name, text: `Nhập số dư đầu kỳ ${p.cardCode} (chuyển từ hệ thống cũ — không tính doanh thu hôm nay)` }) })
      say('Đã lưu số dư đầu kỳ')
    },
    markRead: (nid: string) => mutate(d => { const n = d.notifs.find(x => x.id === nid); if (n && !n.readBy.includes(me.id)) n.readBy.push(me.id) }),
    markAllRead: () => mutate(d => { d.notifs.forEach(n => { if (n.roles.includes(user.role) && !n.readBy.includes(me.id)) n.readBy.push(me.id) }) }),
  }
  return { s, user, setUser, me, toast, say, page, go, profile, openCustomer, draftBill, setDraftBill, ...actions, CLEAN_MIN }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreValue()
  return <StoreCtx.Provider value={v}>{children}</StoreCtx.Provider>
}
