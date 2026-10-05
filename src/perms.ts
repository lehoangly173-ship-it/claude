import { Role } from './data';

// Danh sách tính năng CEO có thể bật/tắt cho từng tài khoản (khớp với valid_permissions() trong Supabase)
export type Perm =
  | 'dispatch' | 'schedule' | 'beds' | 'cashier' | 'customers' | 'customer_phone'
  | 'care' | 'content' | 'area_tasks' | 'reports' | 'staff_admin';

export const PERM_INFO: { key: Perm; label: string; desc: string }[] = [
  { key: 'dispatch', label: 'Điều phối & chia tour', desc: 'Hàng chờ, chia KTV + giường, tạo lịch' },
  { key: 'schedule', label: 'Lịch hẹn', desc: 'Xem và sửa lịch trong ngày' },
  { key: 'beds', label: 'Sơ đồ giường', desc: 'Trạng thái giường, dọn giường' },
  { key: 'cashier', label: 'Thu ngân', desc: 'Thu tiền, chọn hình thức thanh toán' },
  { key: 'customers', label: 'Hồ sơ khách hàng', desc: 'Xem danh sách và hồ sơ khách' },
  { key: 'customer_phone', label: 'Thấy số điện thoại khách', desc: 'Nhạy cảm — chỉ bật khi cần' },
  { key: 'care', label: 'Chăm sóc khách (CSKH)', desc: 'Danh sách cần gọi, ghi nhận đã liên hệ' },
  { key: 'content', label: 'Nội dung & kênh', desc: 'Lịch nội dung, phễu kênh, chiến dịch' },
  { key: 'area_tasks', label: 'Việc khu vực chung', desc: 'Giặt sấy, dọn dẹp, checklist' },
  { key: 'reports', label: 'Báo cáo doanh thu', desc: 'Doanh thu, năng suất, lợi nhuận' },
  { key: 'staff_admin', label: 'Duyệt & phân quyền nhân sự', desc: 'Quyền như CEO với tài khoản' },
];

export const ALL_PERMS = PERM_INFO.map((p) => p.key);

export const DEFAULT_PERMS: Record<Role, Perm[]> = {
  ceo: ALL_PERMS,
  leader: ['dispatch', 'schedule', 'beds', 'cashier', 'customers', 'customer_phone', 'care', 'area_tasks', 'reports'],
  reception: ['dispatch', 'schedule', 'beds', 'cashier', 'customers', 'customer_phone', 'care'],
  ktv: ['area_tasks'],
  marketing: ['content', 'care', 'customers'],
};

// Tính năng nào có ý nghĩa với vai trò nào (để màn hình phân quyền không hiện thứ vô nghĩa)
export const ROLE_PERMS: Record<Role, Perm[]> = {
  ceo: ALL_PERMS,
  leader: ['dispatch', 'schedule', 'beds', 'cashier', 'customers', 'customer_phone', 'care', 'area_tasks', 'reports', 'staff_admin'],
  reception: ['dispatch', 'schedule', 'beds', 'cashier', 'customers', 'customer_phone', 'care', 'reports'],
  ktv: ['area_tasks'],
  marketing: ['content', 'care', 'customers', 'customer_phone', 'reports'],
};

export const ROLE_OPTIONS: { v: Role; label: string; desc: string }[] = [
  { v: 'leader', label: 'Leader / Quản lý ca', desc: 'Điều phối như lễ tân + xem báo cáo' },
  { v: 'reception', label: 'Lễ tân', desc: 'Đón khách, chia tour, thu ngân' },
  { v: 'ktv', label: 'Kỹ thuật viên', desc: 'Nhận tour, checklist giường' },
  { v: 'marketing', label: 'Marketing · CSKH', desc: 'Nội dung, kênh, chăm sóc khách' },
  { v: 'ceo', label: 'CEO', desc: 'Toàn quyền' },
];
