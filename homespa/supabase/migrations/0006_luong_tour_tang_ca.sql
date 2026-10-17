-- Bảng cài đặt lương (chị Quyên chốt 18/10): giá tour theo 45/60/90/120 phút, lương – thưởng – phạt – tăng ca từng vai trò,
-- thưởng năng lực Leader; và điểm năng lực Leader thang 1–10 do CEO chấm theo tháng.
-- Bảo mật: chỉ CEO đọc/ghi toàn bộ bảng lương. Nhân sự khác chỉ nhận PHẦN CỦA VAI TRÒ MÌNH qua hàm my_pay_settings()
-- (KTV không xem được lương Leader, v.v.). Mọi thay đổi ghi nhật ký (audit_log).

create table if not exists public.pay_settings (
  id         int primary key default 1 check (id = 1),     -- chỉ một dòng
  data       jsonb not null,
  updated_by text default public.app_staff_id(),
  updated_at timestamptz not null default now()
);
alter table public.pay_settings enable row level security;
drop policy if exists pay_settings_ceo on public.pay_settings;
create policy pay_settings_ceo on public.pay_settings for all to authenticated using (public.has_role('ceo')) with check (public.has_role('ceo'));
grant select, insert, update on public.pay_settings to authenticated;

-- Phần bảng lương của vai trò người đang đăng nhập: roles chỉ còn vai trò của mình; giá tour chỉ cho KTV; thưởng năng lực chỉ cho Leader
create or replace function public.my_pay_settings() returns jsonb
  language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r text := public.app_role(); d jsonb;
begin
  if r is null then return null; end if;
  select data into d from public.pay_settings where id = 1;
  if d is null then return null; end if;
  if r = 'ceo' then return d; end if;
  return jsonb_build_object(
    'roles', jsonb_build_object(r, d->'roles'->r),
    'tour', case when r = 'ktv' then d->'tour' else '{}'::jsonb end,
    'otMinMin', d->'otMinMin',
    'evalPerPoint', case when r = 'leader' then d->'evalPerPoint' else 'null'::jsonb end,
    'sample', false, 'by', d->'by', 'at', d->'at');
end $$;
revoke all on function public.my_pay_settings() from public;
grant execute on function public.my_pay_settings() to authenticated;

create table if not exists public.leader_evals (
  leader_id  text not null references public.staff(id),
  ym         text not null check (ym ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  scores     int[] not null,
  by_name    text not null default '',
  updated_by text default public.app_staff_id(),
  updated_at timestamptz not null default now(),
  primary key (leader_id, ym)
);
-- 8 tiêu chí, mỗi tiêu chí 1–10 hoặc để trống (null) — ràng buộc ở máy chủ, không tin máy người dùng
create or replace function public.eval_scores_ok(s int[]) returns boolean language sql immutable as $$
  select cardinality(s) = 8 and not exists (select 1 from unnest(s) v where v is not null and (v < 1 or v > 10))
         and exists (select 1 from unnest(s) v where v is not null) $$;
do $$ begin
  alter table public.leader_evals add constraint leader_evals_scores_ok check (public.eval_scores_ok(scores));
exception when duplicate_object then null; end $$;
alter table public.leader_evals enable row level security;
drop policy if exists leader_evals_read on public.leader_evals;
drop policy if exists leader_evals_write on public.leader_evals;
create policy leader_evals_read on public.leader_evals for select to authenticated using (public.has_role('ceo') or leader_id = public.app_staff_id());
create policy leader_evals_write on public.leader_evals for all to authenticated using (public.has_role('ceo')) with check (public.has_role('ceo'));
grant select, insert, update on public.leader_evals to authenticated;

-- Người chưa đăng nhập không có quyền gì; người sửa + giờ sửa do máy chủ ghi (không tin máy người dùng)
revoke all on public.pay_settings, public.leader_evals from anon;
create or replace function public.stamp_updated() returns trigger
  language plpgsql security definer set search_path = public, pg_temp as $$
begin new.updated_by := public.app_staff_id(); new.updated_at := now(); return new; end $$;
do $$ begin
  create trigger pay_settings_stamp before insert or update on public.pay_settings for each row execute function public.stamp_updated();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger leader_evals_stamp before insert or update on public.leader_evals for each row execute function public.stamp_updated();
exception when duplicate_object then null; end $$;

-- Nhật ký thay đổi
do $$ begin
  create trigger pay_settings_audit after insert or update or delete on public.pay_settings for each row execute function public.audit_row();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger leader_evals_audit after insert or update or delete on public.leader_evals for each row execute function public.audit_row();
exception when duplicate_object then null; end $$;

-- Đồng bộ tức thì
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.pay_settings; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.leader_evals; exception when duplicate_object then null; end;
  end if;
end $$;
