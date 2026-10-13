-- HOME SPA Flow · Phân quyền thật (Supabase Auth + RLS)
-- Nguyên tắc:
--   • Vai trò lưu ở bảng staff, client KHÔNG được ghi. Chỉ CEO duyệt tài khoản / đổi vai trò qua hàm ở server.
--   • Mọi bảng bật RLS (chủ bảng = hàm security definer mới vượt qua được).
--   • Không có policy = không ai đọc/ghi được (trừ hàm security definer).
--   • SĐT/địa chỉ, sức khỏe, tiền của khách tách bảng riêng.
--   • Ngày đã qua: chỉ Leader/CEO ghi. Không ai tự duyệt đơn của mình.
--   • Nhật ký thao tác chỉ thêm, không sửa/xóa.
-- Giờ Việt Nam: Asia/Ho_Chi_Minh.

-- ════════════════ 1. Nhân sự & tài khoản ════════════════
create table public.staff (
  id         text primary key,
  user_id    uuid unique,                       -- auth.users.id (null = chưa có tài khoản đăng nhập)
  name       text not null,
  role       text not null check (role in ('ktv','reception','leader','marketing','ceo')),
  shift      smallint check (shift in (1,2)),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.join_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  email       text not null,
  name        text not null,
  wanted_role text not null check (wanted_role in ('ktv','reception','leader','marketing','ceo')),
  status      text not null default 'Chờ duyệt' check (status in ('Chờ duyệt','Đã duyệt','Từ chối')),
  decided_by  text,
  decided_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ── Hàm quyền (security definer: đọc bảng staff không bị RLS chặn, không đệ quy) ──
create function public.app_staff_id() returns text
  language sql stable security definer set search_path = public as
$$ select id from public.staff where user_id = auth.uid() and active $$;

create function public.app_role() returns text
  language sql stable security definer set search_path = public as
$$ select role from public.staff where user_id = auth.uid() and active $$;

create function public.has_role(variadic roles text[]) returns boolean
  language sql stable security definer set search_path = public as
$$ select coalesce(public.app_role() = any(roles), false) $$;

create function public.vn_today() returns date
  language sql stable set search_path = public as
$$ select (now() at time zone 'Asia/Ho_Chi_Minh')::date $$;

-- Ghi dữ liệu cho một ngày: hôm nay hoặc tương lai ai cũng được (theo quyền bảng); ngày đã qua chỉ Leader/CEO
create function public.can_write_day(d date) returns boolean
  language sql stable set search_path = public as
$$ select d >= public.vn_today() or public.has_role('leader','ceo') $$;

-- ════════════════ 2. Khách hàng (tách phần nhạy cảm) ════════════════
create table public.customers (
  id          text primary key default gen_random_uuid()::text,
  code        text unique not null,
  name        text not null,
  grp         text not null default 'VN' check (grp in ('VN','NN')),
  source      text,
  first_visit date,
  visits      int not null default 0,
  last_visit  date,
  vip         boolean not null default false,
  birthday    date,
  created_by  text default public.app_staff_id(),
  created_at  timestamptz not null default now()
);
create table public.customer_contacts (   -- SĐT, địa chỉ: chỉ Lễ tân + CEO
  customer_id text primary key references public.customers(id) on delete cascade,
  phone       text,
  phone_norm  text generated always as (regexp_replace(coalesce(phone,''), '\D', '', 'g')) stored,
  address     text
);
create index on public.customer_contacts (phone_norm);
create table public.customer_health (     -- sức khỏe, dị ứng: nhạy cảm
  customer_id text primary key references public.customers(id) on delete cascade,
  health      text,
  allergies   text,
  preference  text
);
create table public.customer_finance (    -- tổng chi: KTV không xem
  customer_id text primary key references public.customers(id) on delete cascade,
  total_paid  bigint not null default 0
);

-- ════════════════ 3. Lịch hẹn, hóa đơn, gói, ghi nhận ════════════════
create table public.appointments (
  id          text primary key default gen_random_uuid()::text,
  customer_id text not null references public.customers(id),
  ktv_id      text references public.staff(id),
  bed_id      text,
  service_id  text not null,
  work_date   date not null default public.vn_today(),
  start_min   int not null,
  end_min     int not null,
  status      text not null default 'booked' check (status in ('booked','checked_in','in_service','done','paid','cancelled','no_show')),
  requested   boolean not null default false,
  channel     text,
  note        text,
  created_by  text default public.app_staff_id()
);
create index on public.appointments (work_date, ktv_id);

create table public.invoices (
  id           text primary key default gen_random_uuid()::text,
  code         text unique not null,
  customer_id  text references public.customers(id),
  work_date    date not null default public.vn_today(),
  creator_id   text not null default public.app_staff_id(),
  status       text not null check (status in ('Nháp','Đã thanh toán','Thanh toán một phần','Chờ xóa','Đã xóa')),
  total        bigint not null default 0,
  paid         bigint not null default 0,
  lines        jsonb not null default '[]',
  payments     jsonb not null default '[]',
  pkg_sale     jsonb,
  voucher      text,
  created_at   timestamptz not null default now()
);

create table public.packages (
  card_code    text primary key,
  customer_id  text not null references public.customers(id),
  name         text not null,
  type         text not null check (type in ('session','money')),
  grp          text,
  buy_date     date not null default public.vn_today(),
  expiry       date,
  final_price  bigint not null default 0,
  closer_ids   text[] not null default '{}',
  sessions     int, bonus int, used int not null default 0,
  value        bigint, bonus_value bigint, value_used bigint not null default 0,
  payments     jsonb not null default '[]',
  usage        jsonb not null default '[]'
);

create table public.care_notes (
  id          uuid primary key default gen_random_uuid(),
  customer_id text not null references public.customers(id),
  by_staff_id text not null default public.app_staff_id(),
  work_date   date not null default public.vn_today(),
  data        jsonb not null,               -- tình trạng, ghi nhận, sở thích, sau buổi, chưa hài lòng
  spend       text,                         -- tiềm năng chi: chỉ người ghi + Lễ tân/Leader/CEO
  created_at  timestamptz not null default now()
);

-- KTV được xem khách: có lịch với mình, mình đã ghi nhận, hoặc mình chốt gói (G4 làm ở server, không lọc ở client)
create function public.ktv_can_see_customer(cid text) returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.appointments a where a.customer_id = cid and a.ktv_id = public.app_staff_id())
       or exists (select 1 from public.care_notes n where n.customer_id = cid and n.by_staff_id = public.app_staff_id())
       or exists (select 1 from public.packages p where p.customer_id = cid and public.app_staff_id() = any(p.closer_ids)) $$;

-- ════════════════ 4. Kho, chi tiêu, chấm công, nghỉ phép, điểm, lương ════════════════
create table public.stock_moves (
  id         uuid primary key default gen_random_uuid(),
  item       text not null,
  kind       text not null check (kind in ('Nhập','Cấp NV','Dùng chung','Bán','Hoàn trả','Hỏng/hao hụt','Kiểm kê','Đề xuất mua')),
  qty        numeric not null,
  staff_id   text references public.staff(id),
  by_id      text not null default public.app_staff_id(),
  work_date  date not null default public.vn_today(),
  price      bigint,
  note       text,
  status     text check (status in ('Chờ duyệt','Đã duyệt','Từ chối')),
  created_at timestamptz not null default now()
);

create table public.expenses (
  id         uuid primary key default gen_random_uuid(),
  cat        text not null,
  amount     bigint not null check (amount >= 0),
  work_date  date not null default public.vn_today(),
  note       text,
  photo_path text,
  by_id      text not null default public.app_staff_id(),
  created_at timestamptz not null default now()
);

create table public.attendance (
  staff_id  text not null references public.staff(id),
  work_date date not null default public.vn_today(),
  check_in  int, check_out int,
  primary key (staff_id, work_date)
);

create table public.leaves (
  id         uuid primary key default gen_random_uuid(),
  staff_id   text not null default public.app_staff_id() references public.staff(id),
  kind       text not null,
  leave_date date not null,
  with_id    text references public.staff(id),
  reason     text,
  status     text not null default 'Chờ duyệt' check (status in ('Chờ duyệt','Đã duyệt','Từ chối')),
  decided_by text,
  created_at timestamptz not null default now()
);

create table public.points (
  id         uuid primary key default gen_random_uuid(),
  staff_id   text not null references public.staff(id),
  delta      int not null,
  reason     text not null,
  status     text not null default 'Chờ duyệt' check (status in ('Chờ duyệt','Đã duyệt','Từ chối')),
  by_id      text not null default public.app_staff_id(),
  decided_by text,
  created_at timestamptz not null default now()
);

create table public.payslips (
  staff_id text not null references public.staff(id),
  month    text not null,                    -- 'YYYY-MM'
  data     jsonb not null,
  primary key (staff_id, month)
);

-- ════════════════ 5. Thông báo, cài đặt, ảnh mẫu, nhật ký ════════════════
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  cat        text not null,
  text       text not null,
  detail     text,
  roles      text[] not null default '{}',
  to_ids     text[] not null default '{}',
  nav        text,
  by_id      text default public.app_staff_id(),
  created_at timestamptz not null default now()
);
create table public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_by text default public.app_staff_id(),
  updated_at timestamptz not null default now()
);
create table public.ref_photos (
  target     text primary key,               -- 'zone:2', 'item:…'
  path       text not null,                  -- đường dẫn trong bucket ref (private)
  by_id      text not null default public.app_staff_id(),
  updated_at timestamptz not null default now()
);
create table public.audit_log (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  actor   text,
  action  text not null,
  tbl     text not null,
  row_id  text,
  detail  jsonb
);

-- ════════════════ 6. Bật RLS cho MỌI bảng ════════════════
do $$ declare t text; begin
  foreach t in array array['staff','join_requests','customers','customer_contacts','customer_health','customer_finance','appointments','invoices','packages','care_notes','stock_moves','expenses','attendance','leaves','points','payslips','notifications','settings','ref_photos','audit_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop; end $$;
grant usage on sequence public.audit_log_id_seq to authenticated;

-- ── staff: ai đã vào hệ thống đọc được danh sách (tên, vai trò, ca); KHÔNG ai ghi trực tiếp ──
create policy staff_read on public.staff for select to authenticated using (user_id = auth.uid() or public.has_role('ceo'));
-- danh bạ nhân sự cho mọi người trong hệ thống: chỉ tên, vai trò, ca (không lộ user_id / email)
create view public.staff_directory with (security_invoker = false) as
  select id, name, role, shift from public.staff where active and public.app_role() is not null;
revoke all on public.staff_directory from anon;
grant select on public.staff_directory to authenticated;

-- ── xin tham gia: tự gửi của mình; CEO xem tất cả ──
create policy join_insert on public.join_requests for insert to authenticated
  with check (user_id = auth.uid() and email = (auth.jwt() ->> 'email') and status = 'Chờ duyệt' and decided_by is null and public.app_role() is null);
create unique index join_one_pending on public.join_requests (user_id) where status = 'Chờ duyệt';
create policy join_read on public.join_requests for select to authenticated using (user_id = auth.uid() or public.has_role('ceo'));

-- ── khách ──
create policy cust_read on public.customers for select to authenticated
  using (public.has_role('reception','leader','marketing','ceo') or (public.has_role('ktv') and public.ktv_can_see_customer(id)));
create policy cust_insert on public.customers for insert to authenticated with check (public.has_role('reception','leader','ceo') and created_by is not distinct from public.app_staff_id());
create policy cust_update on public.customers for update to authenticated using (public.has_role('reception','leader','ceo')) with check (public.has_role('reception','leader','ceo'));
create policy cust_delete on public.customers for delete to authenticated using (public.has_role('ceo'));

create policy contact_all on public.customer_contacts for all to authenticated
  using (public.has_role('reception','ceo')) with check (public.has_role('reception','ceo'));

create policy health_read on public.customer_health for select to authenticated
  using (public.has_role('reception','leader','ceo') or (public.has_role('ktv') and public.ktv_can_see_customer(customer_id)));
create policy health_write on public.customer_health for insert to authenticated with check (public.has_role('reception','leader','ceo'));
create policy health_update on public.customer_health for update to authenticated using (public.has_role('reception','leader','ceo'));

create policy fin_read on public.customer_finance for select to authenticated using (public.has_role('reception','leader','ceo'));
-- tổng chi chỉ cập nhật bằng trigger từ hóa đơn (không có policy ghi)

-- ── lịch hẹn: KTV chỉ thấy lịch của mình; KTV đổi trạng thái qua hàm ktv_set_appt_status ──
create policy appt_read on public.appointments for select to authenticated
  using (public.has_role('reception','leader','marketing','ceo') or ktv_id = public.app_staff_id());
create policy appt_insert on public.appointments for insert to authenticated
  with check (public.has_role('reception','leader','ceo') and public.can_write_day(work_date) and created_by is not distinct from public.app_staff_id());
create policy appt_update on public.appointments for update to authenticated
  using (public.has_role('reception','leader','ceo') and public.can_write_day(work_date))
  with check (public.has_role('reception','leader','ceo') and public.can_write_day(work_date));

-- ── hóa đơn: Lễ tân/Leader/CEO lập; chỉ CEO sửa/duyệt xóa; KTV không xem ──
create policy inv_read on public.invoices for select to authenticated using (public.has_role('reception','leader','ceo'));
create policy inv_insert on public.invoices for insert to authenticated
  with check (public.has_role('reception','leader','ceo') and creator_id = public.app_staff_id() and public.can_write_day(work_date) and status <> 'Đã xóa');
create policy inv_update_ceo on public.invoices for update to authenticated using (public.has_role('ceo')) with check (public.has_role('ceo'));
-- người lập xin xóa hóa đơn của mình: chỉ qua hàm request_delete_invoice (chỉ đổi trạng thái, không sửa được tiền)

-- ── gói liệu trình: KTV xem số buổi còn qua hàm ktv_packages (không thấy giá) ──
create policy pkg_read on public.packages for select to authenticated using (public.has_role('reception','leader','ceo'));
create policy pkg_insert on public.packages for insert to authenticated with check (public.has_role('reception','leader','ceo'));
create policy pkg_update on public.packages for update to authenticated using (public.has_role('reception','leader','ceo')) with check (public.has_role('reception','leader','ceo'));

-- ── ghi nhận chăm sóc: KTV chỉ ghi cho khách MÌNH phục vụ HÔM NAY; chỉ đọc ghi nhận của mình ──
create policy care_read on public.care_notes for select to authenticated
  using (public.has_role('reception','leader','ceo') or by_staff_id = public.app_staff_id());
create policy care_insert_ktv on public.care_notes for insert to authenticated
  with check (by_staff_id = public.app_staff_id() and work_date = public.vn_today() and (
    public.has_role('reception','leader','ceo') or exists (
      select 1 from public.appointments a where a.customer_id = care_notes.customer_id and a.ktv_id = public.app_staff_id()
        and a.work_date = public.vn_today() and a.status in ('in_service','done','paid'))));

-- ── kho: KTV xem/tạo phiếu của mình (chờ duyệt); Leader/CEO duyệt ──
create policy stock_read on public.stock_moves for select to authenticated
  using (public.has_role('reception','leader','ceo') or staff_id = public.app_staff_id());
create policy stock_insert on public.stock_moves for insert to authenticated
  with check (by_id = public.app_staff_id() and public.can_write_day(work_date) and (
    (public.has_role('reception','leader','ceo') and (status is null or status = 'Chờ duyệt'))   -- không tạo phiếu "Đã duyệt" sẵn
    or (public.has_role('ktv') and staff_id = public.app_staff_id() and status = 'Chờ duyệt')));
create policy stock_approve on public.stock_moves for update to authenticated
  using (public.has_role('leader','ceo') and by_id <> public.app_staff_id() and coalesce(staff_id,'') <> public.app_staff_id())
  with check (public.has_role('leader','ceo') and by_id <> public.app_staff_id() and coalesce(staff_id,'') <> public.app_staff_id());

-- ── chi tiêu: Lễ tân nhập & xem phiếu mình nhập; Leader/CEO xem tất cả ──
create policy exp_read on public.expenses for select to authenticated using (public.has_role('leader','ceo') or by_id = public.app_staff_id());
create policy exp_insert on public.expenses for insert to authenticated
  with check (public.has_role('reception','leader','ceo') and by_id = public.app_staff_id() and public.can_write_day(work_date));
create policy exp_update on public.expenses for update to authenticated using (public.has_role('leader','ceo')) with check (public.has_role('leader','ceo'));

-- ── chấm công: tự chấm trong ngày; Leader/CEO xem & chỉnh ──
create policy att_read on public.attendance for select to authenticated
  using (staff_id = public.app_staff_id() or public.has_role('reception','leader','ceo'));
-- nhân viên tự chấm công CHỈ qua hàm clock_in()/clock_out() (lấy giờ máy chủ, không khai giờ tay); Leader/CEO điều chỉnh
create policy att_boss_insert on public.attendance for insert to authenticated with check (public.has_role('leader','ceo') and staff_id <> public.app_staff_id());
create policy att_boss_update on public.attendance for update to authenticated
  using (public.has_role('leader','ceo') and staff_id <> public.app_staff_id()) with check (public.has_role('leader','ceo') and staff_id <> public.app_staff_id());

-- ── nghỉ phép / đổi ca: tự gửi đơn; Leader/CEO duyệt, KHÔNG tự duyệt đơn của mình ──
create policy leave_read on public.leaves for select to authenticated
  using (staff_id = public.app_staff_id() or with_id = public.app_staff_id() or public.has_role('leader','ceo'));
create policy leave_insert on public.leaves for insert to authenticated
  with check (staff_id = public.app_staff_id() and status = 'Chờ duyệt' and decided_by is null);
create policy leave_decide on public.leaves for update to authenticated
  using (public.has_role('leader','ceo') and staff_id <> public.app_staff_id())
  with check (public.has_role('leader','ceo') and staff_id <> public.app_staff_id() and decided_by = public.app_staff_id());

-- ── điểm uy tín: Lễ tân đề xuất (chờ duyệt); Leader/CEO ghi & duyệt; ai cũng xem điểm của mình ──
create policy pt_read on public.points for select to authenticated
  using (staff_id = public.app_staff_id() or by_id = public.app_staff_id() or public.has_role('leader','ceo'));
create policy pt_insert on public.points for insert to authenticated
  with check (by_id = public.app_staff_id() and staff_id <> public.app_staff_id() and (
    public.has_role('leader','ceo') or (public.has_role('reception') and status = 'Chờ duyệt')) and decided_by is null);
create policy pt_decide on public.points for update to authenticated
  using (public.has_role('leader','ceo') and staff_id <> public.app_staff_id() and by_id <> public.app_staff_id())
  with check (public.has_role('leader','ceo') and decided_by = public.app_staff_id() and staff_id <> public.app_staff_id() and by_id <> public.app_staff_id());

-- ── lương: tự xem phiếu của mình; Leader/CEO xem; chỉ CEO ghi ──
create policy pay_read on public.payslips for select to authenticated using (staff_id = public.app_staff_id() or public.has_role('leader','ceo'));
create policy pay_write on public.payslips for all to authenticated using (public.has_role('ceo')) with check (public.has_role('ceo'));

-- ── thông báo: theo vai trò hoặc gửi đích danh ──
create policy notif_read on public.notifications for select to authenticated
  using (public.app_role() = any(roles) or public.app_staff_id() = any(to_ids) or public.has_role('ceo'));
create policy notif_insert on public.notifications for insert to authenticated
  with check (public.app_role() is not null and by_id = public.app_staff_id());

-- ── cài đặt: ai trong hệ thống cũng đọc; chỉ CEO sửa ──
create policy set_read on public.settings for select to authenticated using (public.app_role() is not null);
create policy set_write on public.settings for all to authenticated using (public.has_role('ceo')) with check (public.has_role('ceo'));

-- ── ảnh mẫu: ai cũng xem; chỉ Leader/CEO đổi ──
create policy ref_read on public.ref_photos for select to authenticated using (public.app_role() is not null);
create policy ref_write on public.ref_photos for all to authenticated using (public.has_role('leader','ceo')) with check (public.has_role('leader','ceo'));

-- ── nhật ký: chỉ CEO đọc; ghi bằng trigger (không có policy ghi → client không tự thêm/sửa/xóa) ──
create policy audit_read on public.audit_log for select to authenticated using (public.has_role('ceo'));

-- ════════════════ 7. Hàm nghiệp vụ chạy ở server ════════════════
-- CEO duyệt tài khoản & gán vai trò
create function public.approve_join(req uuid, p_role text, p_staff_id text default null, p_shift smallint default null) returns text
  language plpgsql security definer set search_path = public as $$
declare r public.join_requests; sid text;
begin
  if not public.has_role('ceo') then raise exception 'Chỉ CEO được duyệt tài khoản' using errcode = '42501'; end if;
  select * into r from public.join_requests where id = req and status = 'Chờ duyệt' for update;
  if not found then raise exception 'Không tìm thấy yêu cầu đang chờ'; end if;
  if p_role not in ('ktv','reception','leader','marketing','ceo') then raise exception 'Vai trò không hợp lệ'; end if;
  if p_staff_id is not null and exists (select 1 from public.staff where id = p_staff_id) then
    update public.staff set user_id = r.user_id, role = p_role, shift = coalesce(p_shift, shift), active = true where id = p_staff_id and user_id is null;
    if not found then raise exception 'Nhân sự này đã gắn tài khoản khác'; end if;
    sid := p_staff_id;
  else
    sid := coalesce(p_staff_id, 'st_' || substr(md5(r.user_id::text), 1, 10));
    insert into public.staff (id, user_id, name, role, shift) values (sid, r.user_id, r.name, p_role, p_shift);
  end if;
  update public.join_requests set status = 'Đã duyệt', decided_by = public.app_staff_id(), decided_at = now() where id = req;
  insert into public.audit_log (actor, action, tbl, row_id, detail) values (public.app_staff_id(), 'duyệt tài khoản', 'staff', sid, jsonb_build_object('role', p_role));
  return sid;
end $$;

create function public.reject_join(req uuid) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('ceo') then raise exception 'Chỉ CEO được từ chối' using errcode = '42501'; end if;
  update public.join_requests set status = 'Từ chối', decided_by = public.app_staff_id(), decided_at = now() where id = req and status = 'Chờ duyệt';
end $$;

-- CEO đổi vai trò / khóa tài khoản (không tự hạ quyền chính mình để tránh mất CEO cuối cùng)
create function public.set_staff_role(p_staff_id text, p_role text, p_active boolean default true) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('ceo') then raise exception 'Chỉ CEO được đổi vai trò' using errcode = '42501'; end if;
  if p_staff_id = public.app_staff_id() and (p_role <> 'ceo' or not p_active) then raise exception 'Không thể tự hạ quyền / khóa chính mình'; end if;
  if p_role not in ('ktv','reception','leader','marketing','ceo') then raise exception 'Vai trò không hợp lệ'; end if;
  update public.staff set role = p_role, active = p_active where id = p_staff_id;
  insert into public.audit_log (actor, action, tbl, row_id, detail) values (public.app_staff_id(), 'đổi vai trò', 'staff', p_staff_id, jsonb_build_object('role', p_role, 'active', p_active));
end $$;

-- Tìm khách theo SĐT: chỉ Lễ tân/CEO, phải khớp ĐỦ số (không dò từng phần)
create function public.find_customer_by_phone(p_phone text) returns table (id text, code text, name text)
  language sql stable security definer set search_path = public as $$
  select c.id, c.code, c.name from public.customers c join public.customer_contacts k on k.customer_id = c.id
  where public.has_role('reception','ceo') and length(regexp_replace(p_phone, '\D', '', 'g')) >= 9
    and k.phone_norm = regexp_replace(p_phone, '\D', '', 'g') $$;

-- KTV đổi trạng thái tour của chính mình, trong ngày, đúng thứ tự
create function public.ktv_set_appt_status(p_appt text, p_status text) returns void
  language plpgsql security definer set search_path = public as $$
declare a public.appointments;
begin
  select * into a from public.appointments where id = p_appt for update;
  if not found or a.ktv_id is distinct from public.app_staff_id() then raise exception 'Không phải tour của bạn' using errcode = '42501'; end if;
  if a.work_date <> public.vn_today() then raise exception 'Ngày đã qua chỉ xem'; end if;
  if not ((a.status in ('booked','checked_in') and p_status = 'in_service') or (a.status = 'in_service' and p_status = 'done')) then
    raise exception 'Không đổi được từ % sang %', a.status, p_status; end if;
  update public.appointments set status = p_status where id = p_appt;
end $$;

-- KTV xem số buổi còn lại của khách mình (không thấy giá, tiền)
create function public.ktv_packages(p_customer text) returns table (card_code text, name text, type text, left_amount bigint, expiry date)
  language sql stable security definer set search_path = public as $$
  select p.card_code, p.name, p.type,
         case when p.type = 'session' then coalesce(p.sessions,0) + coalesce(p.bonus,0) - p.used else null end, p.expiry
  from public.packages p
  where (public.has_role('reception','leader','ceo') or (public.has_role('ktv') and public.ktv_can_see_customer(p_customer)))
    and p.customer_id = p_customer $$;

-- Người lập xin xóa hóa đơn của mình trong ngày: CHỈ đổi trạng thái
create function public.request_delete_invoice(p_id text) returns void
  language plpgsql security definer set search_path = public as $$
begin
  update public.invoices set status = 'Chờ xóa'
   where id = p_id and creator_id = public.app_staff_id() and work_date = public.vn_today() and status not in ('Chờ xóa','Đã xóa');
  if not found then raise exception 'Không xin xóa được hóa đơn này' using errcode = '42501'; end if;
end $$;

-- Chấm công vào/ra: giờ lấy từ máy chủ (phút trong ngày, giờ VN)
create function public.clock_in() returns int
  language plpgsql security definer set search_path = public as $$
declare m int := extract(hour from now() at time zone 'Asia/Ho_Chi_Minh') * 60 + extract(minute from now() at time zone 'Asia/Ho_Chi_Minh');
begin
  if public.app_staff_id() is null then raise exception 'Chưa có vai trò' using errcode = '42501'; end if;
  insert into public.attendance (staff_id, work_date, check_in) values (public.app_staff_id(), public.vn_today(), m)
  on conflict (staff_id, work_date) do nothing;
  return m;
end $$;
create function public.clock_out() returns int
  language plpgsql security definer set search_path = public as $$
declare m int := extract(hour from now() at time zone 'Asia/Ho_Chi_Minh') * 60 + extract(minute from now() at time zone 'Asia/Ho_Chi_Minh');
begin
  update public.attendance set check_out = m where staff_id = public.app_staff_id() and work_date = public.vn_today() and check_in is not null and check_out is null;
  if not found then raise exception 'Chưa chấm công vào hoặc đã ra ca'; end if;
  return m;
end $$;

-- Khóa cột khi sửa: chỉ các cột liệt kê được đổi (hàm security definer / chủ bảng không bị khóa)
create function public.only_cols() returns trigger
  language plpgsql set search_path = public as $$
declare a jsonb := to_jsonb(old); b jsonb := to_jsonb(new); c text;
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if tg_argv[0] = '*ceo' and public.has_role('ceo') then return new; end if;
  foreach c in array tg_argv loop a := a - c; b := b - c; end loop;
  if a is distinct from b then raise exception 'Không được sửa các thông tin này' using errcode = '42501'; end if;
  return new;
end $$;
create trigger lock_leaves before update on public.leaves for each row execute function public.only_cols('status','decided_by');
create trigger lock_points before update on public.points for each row execute function public.only_cols('status','decided_by');
create trigger lock_stock  before update on public.stock_moves for each row execute function public.only_cols('status');
create trigger lock_appt   before update on public.appointments for each row execute function public.only_cols('*ceo','ktv_id','bed_id','service_id','start_min','end_min','status','requested','channel','note');
create trigger lock_exp    before update on public.expenses for each row execute function public.only_cols('*ceo','cat','amount','note','photo_path');
create trigger lock_cust   before update on public.customers for each row execute function public.only_cols('*ceo','name','grp','source','vip','birthday','first_visit','visits','last_visit');
create trigger lock_att    before update on public.attendance for each row execute function public.only_cols('check_in','check_out');

revoke all on function public.approve_join, public.reject_join, public.set_staff_role, public.find_customer_by_phone, public.ktv_set_appt_status, public.ktv_packages, public.request_delete_invoice, public.clock_in, public.clock_out from public, anon;
grant execute on function public.approve_join, public.reject_join, public.set_staff_role, public.find_customer_by_phone, public.ktv_set_appt_status, public.ktv_packages, public.request_delete_invoice, public.clock_in, public.clock_out to authenticated;
-- hàm phụ dùng trong policy: chỉ người đã đăng nhập gọi được
revoke all on function public.app_staff_id, public.app_role, public.has_role, public.vn_today, public.can_write_day, public.ktv_can_see_customer from public, anon;
grant execute on function public.app_staff_id, public.app_role, public.has_role, public.vn_today, public.can_write_day, public.ktv_can_see_customer to authenticated;

-- ════════════════ 8. Nhật ký thao tác (trigger) & tổng chi khách ════════════════
create function public.audit_row() returns trigger
  language plpgsql security definer set search_path = public as $$
declare rid text; d jsonb;
begin
  d := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  rid := coalesce(d->>'id', d->>'code', d->>'card_code', d->>'staff_id');
  -- không ghi SĐT / sức khỏe / dữ liệu chăm sóc vào nhật ký
  d := d - 'phone' - 'address' - 'health' - 'allergies' - 'data';
  insert into public.audit_log (actor, action, tbl, row_id, detail) values (public.app_staff_id(), lower(tg_op), tg_table_name, rid, d);
  return null;
end $$;
do $$ declare t text; begin
  foreach t in array array['invoices','packages','expenses','points','leaves','stock_moves','payslips','settings','ref_photos'] loop
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.audit_row()', t);
  end loop;
  execute 'create trigger audit_appt after update or delete on public.appointments for each row execute function public.audit_row()';
end $$;

create function public.sync_total_paid() returns trigger
  language plpgsql security definer set search_path = public as $$
declare cid text;
begin
  foreach cid in array array[new.customer_id, case when tg_op = 'UPDATE' then old.customer_id end] loop
    continue when cid is null;
    insert into public.customer_finance (customer_id, total_paid)
      select cid, coalesce(sum(paid),0) from public.invoices where customer_id = cid and status not in ('Nháp','Đã xóa')
    on conflict (customer_id) do update set total_paid = excluded.total_paid;
  end loop;
  return null;
end $$;
create trigger inv_total_paid after insert or update on public.invoices for each row execute function public.sync_total_paid();

-- ════════════════ 9. Kho ảnh (Storage): private, đường dẫn bắt đầu bằng mã nhân sự ════════════════
-- bucket 'photos': ảnh minh chứng (dọn dẹp, bill, review, sản phẩm, chứng từ chi) · bucket 'ref': ảnh mẫu
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos','photos', false, 5242880, array['image/jpeg','image/png','image/webp','image/heic']),
       ('ref','ref', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = public.app_staff_id());
create policy photos_read on storage.objects for select to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = public.app_staff_id() or public.has_role('reception','leader','ceo')));
create policy ref_obj_read on storage.objects for select to authenticated using (bucket_id = 'ref' and public.app_role() is not null);
create policy ref_obj_write on storage.objects for insert to authenticated with check (bucket_id = 'ref' and public.has_role('leader','ceo'));
create policy ref_obj_update on storage.objects for update to authenticated using (bucket_id = 'ref' and public.has_role('leader','ceo'));
create policy ref_obj_delete on storage.objects for delete to authenticated using (bucket_id = 'ref' and public.has_role('leader','ceo'));
