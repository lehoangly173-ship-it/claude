-- Mộc AI: kho kiến thức đã duyệt + giới hạn lượt hỏi. Không lưu nội dung câu hỏi/trả lời (bảo vệ riêng tư).
create table public.moc_docs (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (length(title) between 2 and 120),
  body       text not null check (length(body) between 2 and 4000),
  roles      text[] not null default '{ktv,reception,leader,marketing,ceo}',
  updated_by text default public.app_staff_id(),
  updated_at timestamptz not null default now()
);
alter table public.moc_docs enable row level security;
revoke all on public.moc_docs from anon;
grant select, insert, update, delete on public.moc_docs to authenticated;
create policy moc_docs_read on public.moc_docs for select to authenticated using (public.app_role() = any(roles) or public.has_role('ceo'));
create policy moc_docs_write on public.moc_docs for insert to authenticated with check (public.has_role('ceo','leader') and updated_by is not distinct from public.app_staff_id());
create policy moc_docs_update on public.moc_docs for update to authenticated using (public.has_role('ceo','leader')) with check (public.has_role('ceo','leader') and updated_by is not distinct from public.app_staff_id());
create policy moc_docs_delete on public.moc_docs for delete to authenticated using (public.has_role('ceo'));
create trigger audit_moc_docs after insert or update or delete on public.moc_docs for each row execute function public.audit_row();

-- Chỉ đếm lượt (ai, lúc nào) — không lưu câu hỏi
create table public.moc_usage (staff_id text not null, at timestamptz not null default now());
alter table public.moc_usage enable row level security;   -- không có policy: chỉ hàm dưới ghi được
revoke all on public.moc_usage from anon, authenticated;
create index on public.moc_usage (staff_id, at);

-- Trả về vai trò thật của người hỏi và trừ 1 lượt; chưa được duyệt hoặc quá 60 lượt/24 giờ → báo lỗi
create function public.moc_take_quota() returns text
  language plpgsql security definer set search_path = public as $$
declare r text := public.app_role(); sid text := public.app_staff_id();
begin
  if r is null then raise exception 'not approved'; end if;
  if (select count(*) from public.moc_usage where staff_id = sid and at > now() - interval '24 hours') >= 60 then raise exception 'quota'; end if;
  insert into public.moc_usage (staff_id) values (sid);
  return r;
end $$;
revoke all on function public.moc_take_quota() from public, anon;
grant execute on function public.moc_take_quota() to authenticated;
