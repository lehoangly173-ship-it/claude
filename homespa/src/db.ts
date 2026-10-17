// Nối dữ liệu Khách với Supabase (nhóm 1). Quyền do RLS ở máy chủ quyết định:
// KTV không nhận được SĐT/tiền (bảng riêng trả về rỗng), nên ở đây chỉ việc đọc những gì máy chủ cho phép.
import type { SupabaseClient } from '@supabase/supabase-js'
import * as D from './data'
import { fromIso, iso } from './period'
import { defaultPay, PAY_ROLES, TOUR_DURATIONS, type PayConfig, type LeaderEvalRec } from './pay'

type One<T> = T | T[] | null | undefined
const one = <T,>(x: One<T>): T | undefined => (Array.isArray(x) ? x[0] : x ?? undefined)

export type CustomerRow = {
  id: string; code: string; name: string; grp: 'VN' | 'NN'; source: string | null; first_visit: string | null
  visits: number; last_visit: string | null; vip: boolean; birthday: string | null; stay_from?: string | null; stay_to?: string | null
  customer_contacts?: One<{ phone: string | null; address: string | null }>
  customer_health?: One<{ health: string | null; allergies: string | null; preference: string | null }>
  customer_finance?: One<{ total_paid: number | string }>
}
export const CUSTOMER_SELECT = '*, customer_contacts(phone,address), customer_health(health,allergies,preference), customer_finance(total_paid)'

const daysBetween = (a: string | null) => (a ? Math.max(0, Math.round((+new Date(D.TODAY.getFullYear(), D.TODAY.getMonth(), D.TODAY.getDate()) - +fromIso(a)) / 864e5)) : 0)

/** Dòng máy chủ → khách trong app. Phần máy chủ không cho xem (SĐT, tiền…) → để trống, không bịa. */
export function rowToCustomer(r: CustomerRow): D.Customer {
  const ct = one(r.customer_contacts), h = one(r.customer_health), f = one(r.customer_finance)
  return {
    id: r.id, code: r.code, name: r.name, phone: ct?.phone ?? '', group: r.grp, source: r.source ?? '',
    firstVisit: r.first_visit ? D.dateShort(fromIso(r.first_visit)) : '', visits: r.visits, lastVisitDays: daysBetween(r.last_visit),
    totalPaid: Number(f?.total_paid ?? 0), vip: r.vip || undefined, dob: r.birthday ? D.dateShort(fromIso(r.birthday)) : undefined,
    address: ct?.address ?? undefined, health: [h?.health, h?.allergies].filter(Boolean).join(' · ') || undefined, preference: h?.preference ?? undefined,
    packages: [], care: [], // gói liệu trình & ghi nhận: nhóm kế tiếp
    ...(r.stay_from ? { stayFrom: D.dateShort(fromIso(r.stay_from)) } : {}), ...(r.stay_to ? { stayTo: D.dateShort(fromIso(r.stay_to)) } : {}),
  }
}

export async function loadCustomers(sb: SupabaseClient): Promise<D.Customer[]> {
  const { data, error } = await sb.from('customers').select(CUSTOMER_SELECT).order('code')
  if (error) throw new Error(error.message)
  return ((data ?? []) as CustomerRow[]).map(rowToCustomer)
}

export async function loadStaff(sb: SupabaseClient): Promise<D.Staff[]> {
  const { data, error } = await sb.from('staff_directory').select('id,name,role,shift').order('name')
  if (error) throw new Error(error.message)
  return ((data ?? []) as { id: string; name: string; role: D.Role; shift: 1 | 2 | null }[]).map(x => ({ id: x.id, name: x.name, role: x.role, ...(x.shift ? { shift: x.shift } : {}) }))
}

/** Thêm khách: bảng chính trước, rồi SĐT (chỉ Lễ tân/CEO được ghi — máy chủ chặn vai khác). */
export async function insertCustomer(sb: SupabaseClient, c: D.Customer, role: D.Role): Promise<void> {
  const a = await sb.from('customers').insert({ id: c.id, code: c.code, name: c.name, grp: c.group, source: c.source || null, first_visit: iso(D.TODAY), visits: 0, stay_from: c.stayFrom ? toIso(c.stayFrom) : null, stay_to: c.stayTo ? toIso(c.stayTo) : null })
  if (a.error) throw new Error(a.error.message)
  if (c.phone && (role === 'reception' || role === 'ceo')) {
    const b = await sb.from('customer_contacts').insert({ customer_id: c.id, phone: c.phone })
    if (b.error) throw new Error(b.error.message)
  }
}

// ───────────── Nhóm 2: gói liệu trình + ghi nhận chăm sóc ─────────────
export type PackageRow = {
  card_code: string; customer_id: string; name: string; type: 'session' | 'money'; grp: string | null; buy_date: string; expiry: string | null
  final_price: number | string; closer_ids: string[] | null; closer: string | null; catalog_id: string | null; renewal_of: string | null
  sessions: number | null; bonus: number | null; used: number | null; value: number | string | null; bonus_value: number | string | null; value_used: number | string | null
  payments: D.Payment[] | null; usage: D.Usage[] | null; commissions?: D.PkgCommission[] | null
}
const num = (x: number | string | null | undefined) => (x == null ? undefined : Number(x))

export function rowToPackage(r: PackageRow): D.Package {
  return {
    cardCode: r.card_code, catalogId: r.catalog_id ?? '', name: r.name, type: r.type, group: (r.grp ?? 'Tất cả') as D.Package['group'],
    buyDate: D.dateShort(fromIso(r.buy_date)), expiry: r.expiry ? D.dateShort(fromIso(r.expiry)) : '', finalPrice: Number(r.final_price), closer: r.closer ?? '',
    closerIds: r.closer_ids ?? [], renewalOf: r.renewal_of ?? undefined, sessions: num(r.sessions), bonus: num(r.bonus), used: num(r.used),
    value: num(r.value), bonusValue: num(r.bonus_value), valueUsed: num(r.value_used), payments: r.payments ?? [], usage: r.usage ?? [], commissions: r.commissions ?? [],
  }
}
function toIso(vn: string) { if (/^\d{4}-\d{2}-\d{2}$/.test(vn)) return vn; const [d, m, y] = vn.split('/').map(Number); return d && m && y ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null }
export function packageToRow(customerId: string, p: D.Package) {
  return {
    card_code: p.cardCode, customer_id: customerId, name: p.name, type: p.type, grp: p.group, buy_date: toIso(p.buyDate) ?? iso(D.TODAY), expiry: toIso(p.expiry),
    final_price: p.finalPrice, closer_ids: p.closerIds ?? [], closer: p.closer || null, catalog_id: p.catalogId || null, renewal_of: p.renewalOf ?? null,
    sessions: p.sessions ?? null, bonus: p.bonus ?? null, used: p.used ?? 0, value: p.value ?? null, bonus_value: p.bonusValue ?? null, value_used: p.valueUsed ?? 0,
    payments: p.payments, usage: p.usage, commissions: p.commissions ?? [],
  }
}

/** Gói theo khách. Lễ tân/Leader/CEO đọc bảng; KTV chỉ nhận số buổi còn (hàm ktv_packages, không có giá/tiền). */
export async function loadPackages(sb: SupabaseClient, role: D.Role, customerIds: string[]): Promise<Record<string, D.Package[]>> {
  const out: Record<string, D.Package[]> = {}
  if (role === 'ktv') {
    const res = await Promise.all(customerIds.map(async id => {
      const { data, error } = await sb.rpc('ktv_packages', { p_customer: id }); if (error) throw new Error(error.message)
      return [id, (data ?? []) as { card_code: string; name: string; type: 'session' | 'money'; left_amount: number | null; expiry: string | null }[]] as const
    }))
    for (const [id, rows] of res) out[id] = rows.filter(r => r.type === 'session').map(r => ({ cardCode: r.card_code, catalogId: '', name: r.name, type: 'session' as const, group: 'Tất cả' as const, buyDate: '', expiry: r.expiry ? D.dateShort(fromIso(r.expiry)) : '', finalPrice: 0, closer: '', sessions: Number(r.left_amount ?? 0), used: 0, payments: [], usage: [] }))
    return out
  }
  if (role === 'marketing') return out // Marketing không được xem gói (RLS)
  const { data, error } = await sb.from('packages').select('*').order('buy_date', { ascending: false })
  if (error) throw new Error(error.message)
  for (const r of (data ?? []) as PackageRow[]) (out[r.customer_id] ??= []).push(rowToPackage(r))
  return out
}

export async function upsertPackage(sb: SupabaseClient, customerId: string, p: D.Package): Promise<void> {
  const { error } = await sb.from('packages').upsert(packageToRow(customerId, p), { onConflict: 'card_code' })
  if (error) throw new Error(error.message)
}

/** Ghi nhận chăm sóc: một bảng, hai loại — `note` (phiếu ghi nhận của KTV) và `entry` (dòng nhật ký: nhắn tin, gọi điện, kết quả việc…). */
export type CareRow = { id: string; customer_id: string; by_staff_id: string; work_date: string; data: { note?: D.CareNote; entry?: D.CareEntry }; created_at: string }
export async function loadCare(sb: SupabaseClient): Promise<Record<string, { careNotes: D.CareNote[]; care: D.CareEntry[] }>> {
  const { data, error } = await sb.from('care_notes').select('id,customer_id,by_staff_id,work_date,data,created_at').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  const out: Record<string, { careNotes: D.CareNote[]; care: D.CareEntry[] }> = {}
  for (const r of (data ?? []) as CareRow[]) {
    const g = (out[r.customer_id] ??= { careNotes: [], care: [] })
    if (r.data.note) { g.careNotes.push(r.data.note); g.care.push({ at: r.data.note.at, by: r.data.note.by, text: `Ghi nhận chăm sóc: ${D.careSummary(r.data.note)}` }) }
    else if (r.data.entry) g.care.push(r.data.entry)
  }
  return out
}
export async function insertCare(sb: SupabaseClient, customerId: string, payload: { note?: D.CareNote; entry?: D.CareEntry }): Promise<void> {
  const { error } = await sb.from('care_notes').insert({ customer_id: customerId, data: payload, spend: payload.note?.spend ?? null })
  if (error) throw new Error(error.message)
}

// ───────────── Mộc AI (máy chủ: supabase/functions/moc) ─────────────
export type MocReply = { title: string; facts: string[]; hyps: string[]; next: string[] }
export async function askMoc(sb: SupabaseClient, q: string, context: Record<string, unknown>): Promise<MocReply> {
  const { data, error } = await sb.functions.invoke('moc', { body: { q, context } })
  if (error) { let msg = error.message; try { const j = await (error as { context?: Response }).context?.json(); if (j?.error) msg = j.error } catch { /* giữ thông báo gốc */ } throw new Error(msg) }
  return data as MocReply
}
export type MocDoc = { id: string; title: string; body: string; roles: D.Role[]; approved: boolean }
export async function loadMocDocs(sb: SupabaseClient): Promise<MocDoc[]> {
  const { data, error } = await sb.from('moc_docs').select('id,title,body,roles,approved').order('updated_at', { ascending: false }); if (error) throw new Error(error.message); return (data ?? []) as MocDoc[]
}
export async function saveMocDoc(sb: SupabaseClient, d: Omit<MocDoc, 'id'> & { id?: string }): Promise<void> {
  const row = { title: d.title, body: d.body, roles: d.roles, approved: d.approved } // người sửa + giờ sửa do máy chủ ghi; chỉ CEO duyệt được
  const { error } = d.id ? await sb.from('moc_docs').update(row).eq('id', d.id) : await sb.from('moc_docs').insert(row)
  if (error) throw new Error(error.message)
}
export async function deleteMocDoc(sb: SupabaseClient, id: string): Promise<void> { const { error } = await sb.from('moc_docs').delete().eq('id', id); if (error) throw new Error(error.message) }

/** Fix lần 4: lưu thời gian lưu trú tại Đà Nẵng (RLS: Lễ tân/Leader/CEO sửa khách) */
export async function updateCustomerStay(sb: SupabaseClient, id: string, from: string, to: string): Promise<void> {
  const { error } = await sb.from('customers').update({ stay_from: from ? toIso(from) : null, stay_to: to ? toIso(to) : null }).eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Bảng cài đặt lương + điểm năng lực Leader (migration 0006) ──
const numOrNull = (v: unknown, fb: number | null): number | null => (v === null ? null : typeof v === 'number' && Number.isFinite(v) ? v : fb)
/** Dữ liệu máy chủ (có thể thiếu khóa, hoặc chỉ có phần của vai trò mình) → bảng đủ khóa; khóa thiếu = Chưa đặt */
export function normalizePay(x: unknown): PayConfig {
  const b = defaultPay(false), o = (x && typeof x === 'object' ? x : {}) as Record<string, any>
  for (const r of PAY_ROLES) { const s = o.roles?.[r]; if (!s || typeof s !== 'object') continue
    b.roles[r] = { base: numOrNull(s.base, null), stdDays: (v => (Number.isInteger(v) && v! >= 1 && v! <= 31 ? v! : 26))(numOrNull(s.stdDays, 26)), perPoint: numOrNull(s.perPoint, null), perLate: numOrNull(s.perLate, null), otPerHour: numOrNull(s.otPerHour, null), stdHours: numOrNull(s.stdHours, null) } }
  for (const d of TOUR_DURATIONS) b.tour[String(d)] = numOrNull(o.tour?.[String(d)], null)
  b.otMinMin = numOrNull(o.otMinMin, 30) ?? 30; b.evalPerPoint = numOrNull(o.evalPerPoint, null)
  if (typeof o.by === 'string') b.by = o.by; if (typeof o.at === 'string') b.at = o.at
  b.sample = false
  return b
}
/** CEO đọc cả bảng; người khác chỉ nhận phần của vai trò mình (hàm my_pay_settings ở máy chủ) */
export async function loadPayConfig(sb: SupabaseClient): Promise<PayConfig> {
  const { data, error } = await sb.rpc('my_pay_settings'); if (error) throw new Error(error.message)
  return normalizePay(data)
}
export async function savePayConfig(sb: SupabaseClient, c: PayConfig): Promise<void> {
  const { error } = await sb.from('pay_settings').upsert({ id: 1, data: c, updated_at: new Date().toISOString() }); if (error) throw new Error(error.message)
}
export async function loadLeaderEvals(sb: SupabaseClient): Promise<LeaderEvalRec[]> {
  const { data, error } = await sb.from('leader_evals').select('leader_id, ym, scores, by_name, updated_at'); if (error) throw new Error(error.message)
  return (Array.isArray(data) ? data : []).map((r: any) => ({ leaderId: r.leader_id, ym: r.ym, scores: Array.from({ length: 8 }, (_, i) => r.scores?.[i] ?? null), by: r.by_name ?? '', at: r.updated_at ? D.dateShort(new Date(r.updated_at)) : '' }))
}
export async function upsertLeaderEval(sb: SupabaseClient, e: LeaderEvalRec): Promise<void> {
  const { error } = await sb.from('leader_evals').upsert({ leader_id: e.leaderId, ym: e.ym, scores: e.scores, by_name: e.by, updated_at: new Date().toISOString() }); if (error) throw new Error(error.message)
}
