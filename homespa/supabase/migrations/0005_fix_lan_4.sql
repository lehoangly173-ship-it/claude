-- Fix lần 4: thời gian lưu trú tại Đà Nẵng của khách · hoa hồng sale gói (lễ tân nhập khi bán gói)
alter table public.customers add column if not exists stay_from date;
alter table public.customers add column if not exists stay_to   date;
do $$ begin
  alter table public.customers add constraint stay_order check (stay_from is null or stay_to is null or stay_to >= stay_from);
exception when duplicate_object then null; end $$;
-- cho phép Lễ tân/Leader cập nhật 2 cột mới (khóa cột cũ giữ nguyên)
drop trigger if exists lock_cust on public.customers;
create trigger lock_cust before update on public.customers for each row execute function public.only_cols('*ceo','name','grp','source','vip','birthday','first_visit','visits','last_visit','stay_from','stay_to');

-- [{staffId, role: 'Chốt chính'|'Hỗ trợ', amount, date, at, by}] — chỉ Lễ tân/Leader/CEO đọc được (RLS bảng packages); KTV xem phần của mình khi nối bảng lương
alter table public.packages add column if not exists commissions jsonb not null default '[]';
