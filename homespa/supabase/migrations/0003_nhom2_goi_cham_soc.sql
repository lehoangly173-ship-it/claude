-- Nhóm 2: gói liệu trình + ghi nhận chăm sóc nối vào app.
-- Thêm các cột app cần để lưu đủ một gói (mã mẫu gói, người chốt, gói tái tục).
alter table public.packages add column if not exists catalog_id text;
alter table public.packages add column if not exists closer     text;
alter table public.packages add column if not exists renewal_of text;

-- Đồng bộ tức thì cho hai bảng mới nối (RLS vẫn áp dụng: KTV chỉ nhận ghi nhận của mình, không nhận gói).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.packages;   exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.care_notes; exception when duplicate_object then null; end;
  end if;
end $$;
