-- Home Spa: thành viên, yêu cầu tham gia, CEO duyệt & phân quyền
-- Mọi thay đổi đi qua hàm (RPC) có kiểm tra quyền; bảng không cho ghi trực tiếp.

create table if not exists public.app_owners (
  email text primary key
);
insert into public.app_owners (email) values
  ('lehoangly173@gmail.com'), ('levanly1703@gmail.com')
on conflict do nothing;
alter table public.app_owners enable row level security; -- không ai đọc trực tiếp

create table if not exists public.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  status text not null default 'pending' check (status in ('pending','active','rejected','disabled')),
  requested_role text check (requested_role in ('leader','reception','ktv','marketing')),
  note text,
  role text check (role in ('ceo','leader','reception','ktv','marketing')),
  staff_id text,
  permissions text[] not null default '{}',
  is_owner boolean not null default false,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.members enable row level security;
alter table public.members drop constraint if exists members_decided_by_fkey;
alter table public.members add constraint members_decided_by_fkey foreign key (decided_by) references auth.users(id) on delete set null;

-- Danh sách tính năng hợp lệ (dùng để kiểm tra đầu vào)
create or replace function public.valid_permissions() returns text[]
language sql immutable as $$
  select array['dispatch','schedule','beds','cashier','customers','customer_phone',
               'care','content','area_tasks','reports','staff_admin']::text[]
$$;

create or replace function public.default_permissions(r text) returns text[]
language sql immutable as $$
  select case r
    when 'ceo'       then public.valid_permissions()
    when 'leader'    then array['dispatch','schedule','beds','cashier','customers','customer_phone','care','area_tasks','reports']
    when 'reception' then array['dispatch','schedule','beds','cashier','customers','customer_phone','care']
    when 'ktv'       then array['area_tasks']
    when 'marketing' then array['content','care','customers']
    else '{}'::text[] end
$$;

-- Email đăng nhập đã được xác minh (Google hoặc đã bấm link xác nhận) và nằm trong danh sách chủ spa
create or replace function public.is_verified_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from auth.users u join app_owners o on lower(o.email) = lower(u.email)
                 where u.id = auth.uid() and u.email_confirmed_at is not null)
$$;

-- CEO thật (vai trò CEO), khác với người chỉ được giao quyền duyệt nhân sự
create or replace function public.is_real_ceo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m where m.user_id = auth.uid() and m.status = 'active' and m.role = 'ceo')
$$;

-- Người đang đăng nhập có phải CEO đang hoạt động không
create or replace function public.is_ceo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m
                 where m.user_id = auth.uid() and m.status = 'active'
                   and (m.role = 'ceo' or 'staff_admin' = any(m.permissions)))
$$;

-- Đọc: ai cũng xem được hồ sơ của mình; CEO/quản trị xem tất cả
drop policy if exists "members read own" on public.members;
create policy "members read own" on public.members for select to authenticated
  using (user_id = auth.uid() or (select public.is_ceo()));

-- Gửi (hoặc gửi lại) yêu cầu tham gia
create or replace function public.request_access(p_full_name text, p_role text, p_note text)
returns public.members
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  em text := lower(coalesce(auth.jwt() ->> 'email', ''));
  owner boolean;
  r public.members;
begin
  if uid is null then raise exception 'Chưa đăng nhập'; end if;
  if p_role is not null and p_role not in ('leader','reception','ktv','marketing') then
    raise exception 'Vai trò không hợp lệ';
  end if;
  owner := public.is_verified_owner();
  select * into r from members where user_id = uid;

  if owner then
    insert into members (user_id, email, full_name, status, role, staff_id, permissions, is_owner, decided_at)
    values (uid, em, coalesce(nullif(trim(p_full_name),''), em), 'active', 'ceo', 'quyen', default_permissions('ceo'), true, now())
    on conflict (user_id) do update
      set status = 'active', role = 'ceo', is_owner = true,
          permissions = default_permissions('ceo'), updated_at = now()
    returning * into r;
    return r;
  end if;

  if r.user_id is not null and r.status in ('active','disabled') then
    return r; -- đã có quyền hoặc bị khóa: không cho tự gửi lại
  end if;

  insert into members (user_id, email, full_name, status, requested_role, note, requested_at)
  values (uid, em, left(coalesce(nullif(trim(p_full_name),''), em), 80), 'pending', p_role, left(p_note, 300), now())
  on conflict (user_id) do update
    set full_name = excluded.full_name, requested_role = excluded.requested_role,
        note = excluded.note, status = 'pending', requested_at = now(),
        decided_at = null, decided_by = null, updated_at = now()
  returning * into r;
  return r;
end $$;

-- CEO duyệt / từ chối / cập nhật vai trò, quyền, khóa – mở khóa
create or replace function public.ceo_set_member(
  p_user uuid, p_status text, p_role text, p_permissions text[], p_staff_id text)
returns public.members
language plpgsql security definer set search_path = public as $$
declare
  t public.members;
  r public.members;
  perms text[];
  active_admins int;
begin
  if not public.is_ceo() then raise exception 'Chỉ CEO mới được cấp quyền'; end if;
  select * into t from members where user_id = p_user for update;
  if t.user_id is null then raise exception 'Không tìm thấy tài khoản'; end if;
  if p_status is null or p_status not in ('active','rejected','disabled') then raise exception 'Trạng thái không hợp lệ'; end if;
  if t.is_owner and (p_status <> 'active' or p_role is distinct from 'ceo') then
    raise exception 'Không thể hạ quyền hoặc khóa tài khoản chủ spa';
  end if;
  if p_status = 'active' then
    if p_role is null or p_role not in ('ceo','leader','reception','ktv','marketing') then
      raise exception 'Hãy chọn vai trò';
    end if;
    -- chỉ giữ quyền hợp lệ; CEO luôn có đủ quyền
    perms := case when p_role = 'ceo' then default_permissions('ceo')
                  else array(select distinct x from unnest(coalesce(p_permissions, default_permissions(p_role))) x
                             where x = any(valid_permissions())) end;
  else
    perms := t.permissions;
  end if;

  -- Chỉ CEO thật mới được: phong CEO, giao quyền duyệt nhân sự, hoặc sửa/khóa một CEO khác
  if not public.is_real_ceo() and (
       t.role = 'ceo' or t.status = 'active' and 'staff_admin' = any(t.permissions)
       or (p_status = 'active' and (p_role = 'ceo' or 'staff_admin' = any(perms)))) then
    raise exception 'Chỉ CEO mới được cấp hoặc thay đổi quyền quản trị';
  end if;
  -- Vai trò khác CEO phải gắn với một hồ sơ nhân viên, và hồ sơ đó chưa ai dùng
  if p_status = 'active' and p_role <> 'ceo' then
    if nullif(trim(p_staff_id),'') is null then raise exception 'Hãy chọn hồ sơ nhân viên'; end if;
    if exists (select 1 from members x where x.user_id <> p_user and x.status = 'active'
               and x.role <> 'ceo' and x.staff_id = trim(p_staff_id)) then
      raise exception 'Hồ sơ nhân viên này đã gắn với tài khoản khác';
    end if;
  end if;

  -- Không để hệ thống mất người quản trị: người tự sửa mình không được tự bỏ quyền quản trị
  if p_user = auth.uid() and not (p_status = 'active' and (p_role = 'ceo' or 'staff_admin' = any(perms))) then
    raise exception 'Bạn không thể tự bỏ quyền quản trị của mình';
  end if;

  update members set
    status = p_status,
    role = case when p_status = 'active' then p_role else role end,
    permissions = perms,
    staff_id = case when p_status = 'active' then nullif(trim(p_staff_id),'') else staff_id end,
    decided_at = now(), decided_by = auth.uid(), updated_at = now()
  where user_id = p_user
  returning * into r;

  select count(*) into active_admins from members
   where status = 'active' and (role = 'ceo' or 'staff_admin' = any(permissions));
  if active_admins = 0 then raise exception 'Phải còn ít nhất một người quản trị'; end if;
  return r;
end $$;


-- Chủ spa đăng nhập lần đầu: tự kích hoạt CEO. Người khác: không làm gì (trả về null).
create or replace function public.claim_owner()
returns public.members
language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', '')); r public.members;
begin
  if auth.uid() is null then return null; end if;
  if not public.is_verified_owner() then return null; end if;
  insert into members (user_id, email, full_name, status, role, staff_id, permissions, is_owner, decided_at)
  values (auth.uid(), em, coalesce(nullif(auth.jwt() -> 'user_metadata' ->> 'full_name',''), em), 'active', 'ceo', 'quyen', default_permissions('ceo'), true, now())
  on conflict (user_id) do update set status='active', role='ceo', is_owner=true, permissions=default_permissions('ceo'), updated_at=now()
  returning * into r;
  return r;
end $$;
revoke all on function public.claim_owner() from public, anon;
grant execute on function public.claim_owner() to authenticated;

revoke all on function public.request_access(text,text,text) from public, anon;
revoke all on function public.ceo_set_member(uuid,text,text,text[],text) from public, anon;
grant execute on function public.request_access(text,text,text) to authenticated;
grant execute on function public.ceo_set_member(uuid,text,text,text[],text) to authenticated;
revoke all on public.members, public.app_owners from anon, authenticated;
grant select on public.members to authenticated;
revoke all on function public.is_verified_owner() from public, anon;
grant execute on function public.is_verified_owner(), public.is_real_ceo(), public.is_ceo() to authenticated;

-- Bảng cũ không dùng nữa
drop table if exists public.staff_accounts;
