// Nối dữ liệu Khách với Supabase (nhóm 1). Quyền do RLS ở máy chủ quyết định:
// KTV không nhận được SĐT/tiền (bảng riêng trả về rỗng), nên ở đây chỉ việc đọc những gì máy chủ cho phép.
import type { SupabaseClient } from '@supabase/supabase-js'
import * as D from './data'
import { fromIso, iso } from './period'

type One<T> = T | T[] | null | undefined
const one = <T,>(x: One<T>): T | undefined => (Array.isArray(x) ? x[0] : x ?? undefined)

export type CustomerRow = {
  id: string; code: string; name: string; grp: 'VN' | 'NN'; source: string | null; first_visit: string | null
  visits: number; last_visit: string | null; vip: boolean; birthday: string | null
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
  const a = await sb.from('customers').insert({ id: c.id, code: c.code, name: c.name, grp: c.group, source: c.source || null, first_visit: iso(D.TODAY), visits: 0 })
  if (a.error) throw new Error(a.error.message)
  if (c.phone && (role === 'reception' || role === 'ceo')) {
    const b = await sb.from('customer_contacts').insert({ customer_id: c.id, phone: c.phone })
    if (b.error) throw new Error(b.error.message)
  }
}
