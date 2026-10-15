-- Đồng bộ tức thì: báo cho mọi máy đang mở app khi dữ liệu đổi (RLS vẫn áp dụng: máy nào được xem mới nhận).
-- Bảng nào chưa nối vào app thì chưa cần thêm ở đây.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.customers; exception when duplicate_object then null; end;
  end if;
end $$;
