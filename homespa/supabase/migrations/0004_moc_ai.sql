-- Mộc AI: kho kiến thức (CEO duyệt mới dùng) + giới hạn lượt hỏi. Không lưu nội dung câu hỏi/trả lời (riêng tư).
create table public.moc_docs (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (length(title) between 2 and 120),
  body       text not null check (length(body) between 2 and 4000),
  roles      text[] not null default '{ktv,reception,leader,marketing,ceo}'
             check (cardinality(roles) between 1 and 5 and roles <@ array['ktv','reception','leader','marketing','ceo']),
  approved   boolean not null default false,          -- chỉ CEO bật; Mộc chỉ dùng kiến thức đã duyệt
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.moc_docs enable row level security;
revoke all on public.moc_docs from anon;
grant select, insert, update, delete on public.moc_docs to authenticated;

-- Người sửa + giờ sửa do máy chủ ghi (app không giả được). Leader sửa → tự về "chờ CEO duyệt".
create function public.moc_docs_stamp() returns trigger
  language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.updated_by := public.app_staff_id(); new.updated_at := now();
  if not public.has_role('ceo') then new.approved := false; end if;
  return new;
end $$;
create trigger moc_docs_stamp before insert or update on public.moc_docs for each row execute function public.moc_docs_stamp();

-- Đọc: CEO thấy hết; Leader thấy hết để soạn; người khác chỉ thấy kiến thức đã duyệt dành cho vai trò mình
create policy moc_docs_read on public.moc_docs for select to authenticated
  using (public.has_role('ceo','leader') or (approved and public.app_role() = any(roles)));
create policy moc_docs_insert on public.moc_docs for insert to authenticated with check (public.has_role('ceo','leader'));
create policy moc_docs_update on public.moc_docs for update to authenticated using (public.has_role('ceo','leader')) with check (public.has_role('ceo','leader'));
create policy moc_docs_delete on public.moc_docs for delete to authenticated using (public.has_role('ceo'));

-- Kiến thức ban đầu = các quy trình đang có trong app (đã duyệt)
alter table public.moc_docs disable trigger moc_docs_stamp;
insert into public.moc_docs (title, body) values
  ('Quy trình dọn giường sau khi phục vụ', '1. Thay khăn / ga giường
2. Dọn giường, lau bề mặt
3. Kiểm tra vật dụng (dầu, khăn, nước)
4. Bấm "Báo giường sẵn sàng" trên app'),
  ('Quy trình xử lý phản hồi / khiếu nại', '1. Ghi nhận đúng lời khách, nhóm vấn đề
2. Xin lỗi & đề xuất xử lý trong quyền hạn
3. Vượt quyền (hoàn tiền, đổi giá) → chuyển chị duyệt
4. Gọi lại khách trong 24 giờ, ghi kết quả vào hồ sơ'),
  ('Quy trình chia tour', '1. Ưu tiên KTV khách yêu cầu đích danh
2. Không có yêu cầu → KTV đầu hàng xoay tour đang rảnh
3. Kiểm tra giường cùng khu vực còn trống
4. Giao xong, KTV xuống cuối hàng'),
  ('Quy trình tái tục gói', '1. Gói còn ≤ 2 buổi hoặc sắp hết hạn → nhắc khách
2. Tư vấn theo tiến triển thực tế
3. Ưu đãi trong khung đã duyệt; ngoài khung → xin chị duyệt
4. Thu tiền tại Thu ngân, chọn "Tái tục"');
update public.moc_docs set approved = true, updated_by = 'system';
alter table public.moc_docs enable trigger moc_docs_stamp;
create trigger audit_moc_docs after insert or update or delete on public.moc_docs for each row execute function public.audit_row();

-- Chỉ đếm lượt (ai, lúc nào) — không lưu câu hỏi
create table public.moc_usage (staff_id text not null, at timestamptz not null default now());
alter table public.moc_usage enable row level security;   -- không có policy: chỉ hàm dưới ghi được
revoke all on public.moc_usage from anon, authenticated;
create index on public.moc_usage (staff_id, at);

-- Trả về vai trò thật và trừ 1 lượt; chưa duyệt hoặc quá 60 lượt/24 giờ → báo lỗi. Khóa theo người để bấm dồn không vượt mức.
create function public.moc_take_quota() returns text
  language plpgsql security definer set search_path = public, pg_temp as $$
declare r text := public.app_role(); sid text := public.app_staff_id();
begin
  if r is null or sid is null then raise exception 'not approved'; end if;
  perform pg_advisory_xact_lock(hashtext('moc:' || sid));
  delete from public.moc_usage where at < now() - interval '2 days';
  if (select count(*) from public.moc_usage where staff_id = sid and at > now() - interval '24 hours') >= 60 then raise exception 'quota'; end if;
  insert into public.moc_usage (staff_id) values (sid);
  return r;
end $$;
revoke all on function public.moc_take_quota() from public, anon;
grant execute on function public.moc_take_quota() to authenticated;
revoke all on function public.moc_docs_stamp() from public, anon, authenticated;
