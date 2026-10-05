import { DEFAULT_PERMS, Perm } from './perms';
import { create } from 'zustand';
import {
  AREA_TASKS, AreaTask, BEDS, BOOKINGS, Booking, CareLog, CLEAN_STEPS, CONTENT_TASKS, ContentTask,
  CUSTOMERS, Customer, DEMO_START, MONTH_BASE, TODAY, Role, SERVICES, SHIFTS, STAFF, ServiceKind, Source, Tier,
} from './data';
import type { Tone } from './theme';

// ===================== STATE =====================
export type State = {
  now: number;
  session: { role: Role; staffId: string; perms: Perm[]; name?: string; demo?: boolean } | null;
  bookings: Booking[];
  customers: Customer[];
  checkins: Record<string, number>;
  cleaning: Record<string, boolean[]>;
  areaTasks: AreaTask[];
  contentTasks: ContentTask[];
  careLogs: CareLog[];
  toast: string | null;
};

export const initialState = (): State => ({
  now: DEMO_START,
  session: null,
  bookings: BOOKINGS.map((b) => ({ ...b })),
  customers: CUSTOMERS.map((c) => ({ ...c })),
  checkins: Object.fromEntries(STAFF.filter((s) => s.role !== 'ktv' || s.shift === 'ca1').map((s) => [s.id, 475])),
  cleaning: { 'TL-01': [false, false, false, false], 'TL-02': [true, false, false, false] },
  areaTasks: AREA_TASKS.map((a) => ({ ...a })),
  contentTasks: CONTENT_TASKS.map((c) => ({ ...c })),
  careLogs: [],
  toast: null,
});

// ===================== HELPERS =====================
export const svc = (id: string) => SERVICES.find((s) => s.id === id)!;
export const staffById = (id?: string) => STAFF.find((s) => s.id === id);
export const ktvs = () => STAFF.filter((s) => s.role === 'ktv');
export const cust = (s: State, id: string) => s.customers.find((c) => c.id === id)!;
export const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`;
export const money = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1).replace('.', ',')}tr` : `${Math.round(v / 1000)}k`);
export const vnd = (v: number) => v.toLocaleString('vi-VN') + 'đ';
export const maskPhone = (p: string) => p.slice(0, 4) + ' ••• •••';
export const endOf = (b: Booking) => b.endedAt ?? (b.startedAt ?? b.start) + svc(b.serviceId).minutes;
export const isActive = (b: Booking) => b.status !== 'cancelled';
export const SOON = 30; // phút — ngưỡng "sắp xong" dùng chung mọi màn hình
export const digits = (t: string) => t.replace(/\D/g, '');
export const can = (s: { session: State['session'] } | null | undefined, p: Perm) => !!s?.session?.perms.includes(p);
export const canSeePhone = (s: { session: State['session'] }) => can(s, 'customer_phone');
export const phoneFor = (s: { session: State['session'] }, phone: string) => (canSeePhone(s) ? phone : maskPhone(phone));

type Badge = { key: string; label: string; tone: Tone; until?: number };

export function ktvStatus(s: State, id: string): Badge {
  const st = staffById(id)!;
  const shift = SHIFTS[st.shift];
  if (!s.checkins[id]) {
    return s.now < shift.start
      ? { key: 'off', label: `Vào ca ${hhmm(shift.start)}`, tone: 'gray' }
      : { key: 'notIn', label: 'Chưa vào ca', tone: 'red' };
  }
  const cur = s.bookings.find((b) => b.ktvId === id && (b.status === 'inService' || b.status === 'assigned'));
  if (cur?.status === 'assigned') return { key: 'prep', label: 'Chuẩn bị đón khách', tone: 'purple' };
  if (cur) {
    const end = endOf(cur);
    if (end - s.now <= SOON) return { key: 'soon', label: end < s.now ? 'Quá giờ' : 'Sắp xong', tone: end < s.now ? 'red' : 'amber', until: end };
    return { key: 'busy', label: 'Đang làm', tone: 'green', until: end };
  }
  if (s.now >= shift.end) return { key: 'off', label: 'Hết ca', tone: 'gray' };
  return { key: 'free', label: 'Rảnh', tone: 'blue' };
}

export const isKtvFree = (s: State, id: string) => ktvStatus(s, id).key === 'free';

export function bedStatus(s: State, bedId: string): Badge & { booking?: Booking } {
  const b = s.bookings.find((x) => x.bedId === bedId && (x.status === 'inService' || x.status === 'assigned'));
  if (b?.status === 'assigned') return { key: 'prep', label: 'Chuẩn bị', tone: 'blue', booking: b };
  if (b) {
    const end = endOf(b);
    return end - s.now <= SOON
      ? { key: 'soon', label: end < s.now ? 'Quá giờ' : 'Sắp hoàn thành', tone: 'amber', until: end, booking: b }
      : { key: 'busy', label: 'Đang làm', tone: 'green', until: end, booking: b };
  }
  if (s.cleaning[bedId]) return { key: 'cleaning', label: 'Đang dọn', tone: 'tan' };
  const r = s.bookings.find((x) => x.bedId === bedId && x.status === 'booked' && x.start - s.now <= 60 && x.start - s.now >= -30);
  if (r) return { key: 'reserved', label: 'Lịch hẹn', tone: 'purple', booking: r };
  return { key: 'free', label: 'Trống', tone: 'gray' };
}

export const tourCount = (s: State, ktvId: string) =>
  s.bookings.filter((b) => b.ktvId === ktvId && (b.status === 'inService' || b.status === 'done')).length;

export function freeBeds(s: State, kind: ServiceKind, forBooking?: Booking) {
  return BEDS.filter((bed) => {
    if (bed.kind !== kind) return false;
    const st = bedStatus(s, bed.id);
    if (st.key === 'free') return true;
    return st.key === 'reserved' && st.booking?.id === forBooking?.id;
  });
}

export function suggestKtv(s: State, b: Booking) {
  if (b.requestedKtvId && isKtvFree(s, b.requestedKtvId)) return b.requestedKtvId;
  const free = ktvs().filter((k) => isKtvFree(s, k.id));
  free.sort((a, c) => tourCount(s, a.id) - tourCount(s, c.id) || a.order - c.order);
  return free[0]?.id;
}

export function suggestBed(s: State, b: Booking) {
  const beds = freeBeds(s, svc(b.serviceId).kind, b);
  return beds.find((x) => x.id === b.bedId)?.id ?? beds[0]?.id;
}

// ===================== METRICS (đều tính lại từ dữ liệu gốc) =====================
export function metrics(s: State) {
  const today = s.bookings.filter(isActive);
  const k = ktvs();
  const inShift = k.filter((x) => s.checkins[x.id]);
  const busy = inShift.filter((x) => ['busy', 'soon', 'prep'].includes(ktvStatus(s, x.id).key));
  const inService = today.filter((b) => b.status === 'inService');
  const soon = inService.filter((b) => endOf(b) - s.now <= SOON && endOf(b) >= s.now);
  const bedStates = BEDS.map((b) => bedStatus(s, b.id).key);
  const bedsUsed = bedStates.filter((x) => x === 'busy' || x === 'soon' || x === 'prep').length;
  const waiting = today.filter((b) => b.status === 'waiting');
  const waitingLong = waiting.filter((b) => s.now - (b.arrivedAt ?? s.now) > 10);
  const done = today.filter((b) => b.status === 'done');
  const paid = done.filter((b) => b.paid);
  const unpaid = done.filter((b) => !b.paid);
  // Tiền thực thu (không gồm trừ gói — gói đã thu tiền lúc bán) và doanh thu dịch vụ ghi nhận (gồm trừ gói)
  const revenuePaid = paid.filter((b) => b.payMethod !== 'Trừ gói').reduce((a, b) => a + svc(b.serviceId).price, 0);
  const serviceRevenue = paid.reduce((a, b) => a + svc(b.serviceId).price, 0);
  const revenuePending = unpaid.reduce((a, b) => a + svc(b.serviceId).price, 0);
  const lateBooked = today.filter((b) => b.status === 'booked' && s.now - b.start > 10);
  const notIn = k.filter((x) => ktvStatus(s, x.id).key === 'notIn');
  const overtime = inService.filter((b) => endOf(b) < s.now);
  return {
    ktvInShift: inShift.length,
    ktvBusy: busy.length,
    ktvFree: inShift.length - busy.length,
    soon, inService,
    bedsUsed, bedsTotal: BEDS.length,
    bedsFree: bedStates.filter((x) => x === 'free').length,
    bedsCleaning: bedStates.filter((x) => x === 'cleaning').length,
    bedsReserved: bedStates.filter((x) => x === 'reserved').length,
    bedsPrep: bedStates.filter((x) => x === 'prep').length,
    waiting, waitingLong,
    todayTotal: today.length,
    doneCount: done.length,
    remaining: today.length - done.length,
    paid, unpaid, revenuePaid, serviceRevenue, revenuePending,
    lateBooked, notIn, overtime,
  };
}

export type Alert = { id: string; level: 'red' | 'amber' | 'green'; title: string; sub: string; go?: string };

export function alerts(s: State): Alert[] {
  const m = metrics(s);
  const out: Alert[] = [];
  m.waitingLong.forEach((b) => out.push({ id: 'w' + b.id, level: 'red', title: `${cust(s, b.customerId).name} chờ chưa phân KTV`, sub: `Chờ ${s.now - (b.arrivedAt ?? s.now)} phút · ${svc(b.serviceId).name}`, go: 'queue' }));
  m.overtime.forEach((b) => out.push({ id: 'o' + b.id, level: 'red', title: `Ca quá giờ — ${staffById(b.ktvId)?.name}`, sub: `${b.bedId} · lẽ ra xong ${hhmm(endOf(b))}`, go: 'beds' }));
  m.notIn.forEach((x) => out.push({ id: 'n' + x.id, level: 'amber', title: `KTV ${x.name} chưa vào ca`, sub: `${SHIFTS[x.shift].name} bắt đầu ${hhmm(SHIFTS[x.shift].start)}`, go: 'queue' }));
  m.soon.forEach((b) => out.push({ id: 's' + b.id, level: 'amber', title: '1 ca sắp kết thúc', sub: `${staffById(b.ktvId)?.name} · ${b.bedId} · ${svc(b.serviceId).name} · xong ${hhmm(endOf(b))}`, go: 'beds' }));
  m.unpaid.forEach((b) => out.push({ id: 'u' + b.id, level: 'amber', title: `${cust(s, b.customerId).name} chưa thanh toán`, sub: `${b.customerId} · ${b.bedId} · ${vnd(svc(b.serviceId).price)}`, go: 'cashier' }));
  m.lateBooked.forEach((b) => out.push({ id: 'l' + b.id, level: 'green', title: `Lịch ${hhmm(b.start)} chưa đến`, sub: `${cust(s, b.customerId).name} · ${svc(b.serviceId).name} — gọi xác nhận`, go: 'schedule' }));
  return out;
}

// ===================== CSKH =====================
const todayMMDD = `${String(TODAY.month).padStart(2, '0')}-${String(TODAY.day).padStart(2, '0')}`;
const daysToBirthday = (mmdd: string) => {
  const [m, d] = mmdd.split('-').map(Number);
  const [tm, td] = todayMMDD.split('-').map(Number);
  let diff = (m - tm) * 30 + (d - td);
  if (diff < 0) diff += 365;
  return diff;
};
export type CareItem = { customer: Customer; reason: string; tone: Tone; kind: string };
export function careList(s: State): CareItem[] {
  const out: CareItem[] = [];
  const cared = new Set(s.careLogs.map((l) => l.customerId + l.kind));
  for (const c of s.customers) {
    const push = (kind: string, reason: string, t: Tone) => !cared.has(c.id + kind) && out.push({ customer: c, reason, tone: t, kind });
    const bd = daysToBirthday(c.birthday);
    if (bd <= 7) push('birthday', bd === 0 ? 'Sinh nhật hôm nay' : `Sinh nhật sau ${bd} ngày`, 'gold');
    if (c.visits > 0 && c.lastVisitDaysAgo >= 1 && c.lastVisitDaysAgo <= 3) push('after', `Hỏi thăm sau dịch vụ (${c.lastVisitDaysAgo} ngày)`, 'green');
    if (c.lastVisitDaysAgo >= 30) push('back', `${c.lastVisitDaysAgo} ngày chưa quay lại`, c.tier === 'VIP' ? 'red' : 'amber');
  }
  const rank: Record<string, number> = { red: 0, gold: 1, amber: 2, green: 3 };
  return out.sort((a, b) => (rank[a.tone] ?? 9) - (rank[b.tone] ?? 9));
}

// ===================== CEO =====================
export function ceo(s: State) {
  const m = metrics(s);
  const arrived = s.bookings.filter((b) => isActive(b) && b.status !== 'booked');
  const custToday = new Set(arrived.map((b) => b.customerId));
  const newToday = [...custToday].filter((id) => cust(s, id).visits === 0 || cust(s, id).isNew).length;
  const vipToday = [...custToday].filter((id) => cust(s, id).tier === 'VIP').length;
  const tourFees = s.bookings.filter((b) => b.status === 'done' && b.paid).reduce((a, b) => a + svc(b.serviceId).tourFee, 0);
  const monthRevenue = MONTH_BASE.revenue + m.serviceRevenue;
  const monthCost = MONTH_BASE.cost + tourFees;
  const byService = SERVICES.map((sv) => ({
    name: sv.name,
    value: m.paid.filter((b) => b.serviceId === sv.id).reduce((a) => a + sv.price, 0),
    count: s.bookings.filter((b) => isActive(b) && b.serviceId === sv.id).length,
  }));
  const sources: Source[] = ['Facebook', 'TikTok', 'Google Maps', 'Giới thiệu', 'Vãng lai', 'Tour'];
  const bySource = sources.map((src) => ({ name: src, value: s.customers.filter((c) => c.source === src).length }));
  const productivity = ktvs().map((k) => ({
    k, tours: tourCount(s, k.id),
    revenue: s.bookings.filter((b) => b.ktvId === k.id && b.status === 'done').reduce((a, b) => a + svc(b.serviceId).price, 0),
    status: ktvStatus(s, k.id),
  })).sort((a, b) => b.revenue - a.revenue);
  const tiers: Tier[] = ['VIP', 'Thành viên', 'Khách mới', 'Khách NN'];
  return {
    m, custToday: custToday.size, newToday, vipToday,
    monthRevenue, monthCost, profit: monthRevenue - monthCost,
    targetPct: Math.round((monthRevenue / MONTH_BASE.target) * 100),
    vsLastMonth: Math.round(((monthRevenue / TODAY.day) * 31 / MONTH_BASE.lastMonthRevenue - 1) * 100),
    avgTicket: m.paid.length ? Math.round(m.serviceRevenue / m.paid.length) : 0,
    utilization: Math.round((m.bedsUsed / m.bedsTotal) * 100),
    byService, bySource, productivity,
    tierCount: tiers.map((t) => ({ name: t, value: s.customers.filter((c) => c.tier === t).length })),
    vipActive: s.customers.filter((c) => c.tier === 'VIP' && c.lastVisitDaysAgo < 30).length,
    vipAtRisk: s.customers.filter((c) => c.tier === 'VIP' && c.lastVisitDaysAgo >= 30),
  };
}

// ===================== ACTIONS =====================
type NewBooking = {
  customerId?: string;
  newCustomer?: { name: string; phone: string; source: Source };
  serviceId: string;
  start: number;
  requestedKtvId?: string;
};

type Actions = {
  login: (role: Role, staffId: string, perms?: Perm[], name?: string) => void;
  logout: () => void;
  tick: (mins: number) => void;
  say: (t: string | null) => void;
  createBooking: (nb: NewBooking) => string | null;
  checkInCustomer: (id: string) => void;
  assign: (id: string, ktvId: string, bedId: string) => string | null;
  startService: (id: string) => void;
  complete: (id: string) => void;
  toggleClean: (bedId: string, i: number) => void;
  bedReady: (bedId: string) => void;
  pay: (id: string, method: Booking['payMethod']) => void;
  cancel: (id: string) => void;
  staffCheckIn: (id: string) => void;
  cycleArea: (id: string) => void;
  toggleContent: (id: string) => void;
  logCare: (customerId: string, kind: string) => void;
  reset: () => void;
};

let seq = 100;
export const useApp = create<State & Actions>((set, get) => {
  const patchB = (id: string, p: Partial<Booking>) => set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...p } : b)) }));
  return {
    ...initialState(),
    login: (role, staffId, perms, name) => set({ session: { role, staffId, perms: perms ?? DEFAULT_PERMS[role], name, demo: !perms } }),
    logout: () => set({ session: null }),
    tick: (mins) => set((s) => ({ now: Math.min(s.now + mins, 20 * 60) })),
    say: (t) => set({ toast: t }),

    createBooking: (nb) => {
      const s = get();
      let customerId = nb.customerId;
      let customers = s.customers;
      if (!customerId) {
        if (!nb.newCustomer?.name.trim()) return 'Nhập tên khách';
      const ph = digits(nb.newCustomer.phone);
      const dup = ph.length >= 9 && s.customers.find((c) => digits(c.phone) === ph);
      if (dup) return `Số này đã có hồ sơ: ${dup.name} — chọn khách đó`;
        customerId = `KH${1200 + ++seq}`;
        customers = [...customers, {
          id: customerId, name: nb.newCustomer.name.trim(), phone: nb.newCustomer.phone.trim() || '—',
          tier: 'Khách mới', source: nb.newCustomer.source, birthday: '01-01', lastVisitDaysAgo: 0, visits: 0,
          pressure: 'vừa', note: '', packageLeft: 0, budget: '—',
        }];
      }
      const walkIn = nb.start <= s.now;
      const b: Booking = {
        id: `B${++seq}`, customerId, serviceId: nb.serviceId, start: walkIn ? s.now : nb.start,
        status: walkIn ? 'waiting' : 'booked', arrivedAt: walkIn ? s.now : undefined,
        requestedKtvId: nb.requestedKtvId, paid: false,
      };
      set({ customers, bookings: [...s.bookings, b], toast: walkIn ? 'Đã thêm khách vào hàng chờ' : `Đã tạo lịch ${hhmm(b.start)}` });
      return null;
    },
    checkInCustomer: (id) => { patchB(id, { status: 'waiting', arrivedAt: get().now }); set({ toast: 'Khách đã đến — vào hàng chờ' }); },
    assign: (id, ktvId, bedId) => {
      const s = get();
      const b = s.bookings.find((x) => x.id === id);
      if (!b || b.status !== 'waiting') return 'Khách không còn trong hàng chờ';
      if (!isKtvFree(s, ktvId)) return 'KTV này không rảnh';
      if (!freeBeds(s, svc(b.serviceId).kind, b).some((x) => x.id === bedId)) return 'Giường không trống';
      patchB(id, { status: 'assigned', ktvId, bedId });
      set({ toast: `Đã chia tour cho ${staffById(ktvId)?.name} · ${bedId}` });
      return null;
    },
    startService: (id) => { patchB(id, { status: 'inService', startedAt: get().now }); set({ toast: 'Bắt đầu dịch vụ' }); },
    complete: (id) => {
      const b = get().bookings.find((x) => x.id === id);
      if (!b) return;
      patchB(id, { status: 'done', endedAt: get().now });
      if (b.bedId) set((s) => ({ cleaning: { ...s.cleaning, [b.bedId!]: CLEAN_STEPS.map(() => false) } }));
      set({ toast: 'Hoàn thành — khách chuyển sang thu ngân' });
    },
    toggleClean: (bedId, i) => set((s) => {
      const cur = s.cleaning[bedId];
      if (!cur) return {};
      const next = cur.map((v, j) => (j === i ? !v : v));
      if (next.every(Boolean)) {
        const { [bedId]: _, ...rest } = s.cleaning;
        return { cleaning: rest, toast: `${bedId} sẵn sàng` };
      }
      return { cleaning: { ...s.cleaning, [bedId]: next } };
    }),
    bedReady: (bedId) => set((s) => {
      const { [bedId]: _, ...rest } = s.cleaning;
      return { cleaning: rest, toast: `${bedId} sẵn sàng` };
    }),
    pay: (id, method) => {
      const b = get().bookings.find((x) => x.id === id);
      if (!b || b.paid || b.status !== 'done') return;
      if (method === 'Trừ gói' && cust(get(), b.customerId).packageLeft < 1) { set({ toast: 'Gói đã hết buổi — chọn hình thức khác' }); return; }
      set((s) => ({
        bookings: s.bookings.map((x) => (x.id === id ? { ...x, paid: true, payMethod: method } : x)),
        customers: s.customers.map((c) => c.id === b.customerId
          ? { ...c, isNew: c.isNew || c.visits === 0, visits: c.visits + 1, lastVisitDaysAgo: 0, packageLeft: method === 'Trừ gói' ? Math.max(0, c.packageLeft - 1) : c.packageLeft }
          : c),
        toast: method === 'Trừ gói' ? 'Đã trừ 1 buổi gói' : `Đã thu ${vnd(svc(b.serviceId).price)}`,
      }));
    },
    cancel: (id) => { patchB(id, { status: 'cancelled' }); set({ toast: 'Đã hủy lịch' }); },
    staffCheckIn: (id) => set((s) => ({ checkins: { ...s.checkins, [id]: s.now }, toast: 'Đã chấm công vào ca' })),
    cycleArea: (id) => set((s) => ({
      areaTasks: s.areaTasks.map((a) => (a.id === id ? { ...a, status: a.status === 'todo' ? 'doing' : a.status === 'doing' ? 'done' : 'todo' } : a)),
    })),
    toggleContent: (id) => set((s) => ({ contentTasks: s.contentTasks.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) })),
    logCare: (customerId, kind) => set((s) => ({
      careLogs: [...s.careLogs, { customerId, kind, at: s.now, byId: s.session?.staffId ?? '' }], toast: 'Đã ghi nhận chăm sóc',
    })),
    reset: () => set({ ...initialState(), session: get().session, toast: 'Đã đặt lại dữ liệu mẫu' }),
  };
});
