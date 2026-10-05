-- Kiểm tra logic duyệt & phân quyền bằng tài khoản giả, cuối cùng xóa sạch dữ liệu thử
create temp table t_res (n serial, name text, ok boolean, detail text);
grant all on t_res to authenticated;
grant all on sequence t_res_n_seq to authenticated;
insert into public.app_owners values ('owner.test@homespa.test') on conflict do nothing;
delete from public.members where email like '%@homespa.test';
delete from auth.users where email like '%@homespa.test';
insert into auth.users (id, email, email_confirmed_at, aud, role, instance_id) values
  ('00000000-0000-0000-0000-0000000000a1','owner.test@homespa.test', now(),'authenticated','authenticated','00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-0000-0000-0000000000a2','ktv.test@homespa.test',   now(),'authenticated','authenticated','00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-0000-0000-0000000000a3','lead.test@homespa.test',  now(),'authenticated','authenticated','00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-0000-0000-0000000000a4','owner2.test@homespa.test', null,'authenticated','authenticated','00000000-0000-0000-0000-000000000000');
insert into public.app_owners values ('owner2.test@homespa.test') on conflict do nothing;

create or replace function pg_temp.act(u text, em text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'email', em, 'role', 'authenticated')::text, false);
$$;

do $$
declare r public.members; n int; e text;
  O uuid := '00000000-0000-0000-0000-0000000000a1';
  K uuid := '00000000-0000-0000-0000-0000000000a2';
  L uuid := '00000000-0000-0000-0000-0000000000a3';
  F uuid := '00000000-0000-0000-0000-0000000000a4';
begin
  -- 1. Chủ spa đã xác minh → tự thành CEO
  perform pg_temp.act(O::text, 'owner.test@homespa.test');
  r := public.claim_owner();
  insert into t_res(name, ok, detail) values ('Chủ spa tự thành CEO', r.status='active' and r.role='ceo' and r.is_owner, r.status||'/'||coalesce(r.role,'-'));

  -- 2. Email chủ spa CHƯA xác minh → không được làm CEO
  perform pg_temp.act(F::text, 'owner2.test@homespa.test');
  r := public.claim_owner();
  insert into t_res(name, ok, detail) values ('Email chủ chưa xác minh không thành CEO', r.user_id is null, coalesce(r.status,'null'));

  -- 3. Người lạ gửi yêu cầu → pending, không có quyền
  perform pg_temp.act(K::text, 'ktv.test@homespa.test');
  r := public.request_access('KTV Thử', 'ktv', 'em ca 2');
  insert into t_res(name, ok, detail) values ('Yêu cầu tham gia → chờ duyệt', r.status='pending' and r.role is null and cardinality(r.permissions)=0, r.status);

  -- 4. Người chờ duyệt không tự duyệt được
  begin r := public.ceo_set_member(K, 'active', 'ceo', null, null);
    insert into t_res(name, ok, detail) values ('Không tự duyệt được', false, 'đã tự duyệt!');
  exception when others then insert into t_res(name, ok, detail) values ('Không tự duyệt được', true, sqlerrm); end;

  -- 5. CEO duyệt KTV với hồ sơ hien + bỏ bớt quyền, chèn quyền rác
  perform pg_temp.act(O::text, 'owner.test@homespa.test');
  r := public.ceo_set_member(K, 'active', 'ktv', array['area_tasks','hack_everything'], 'hien');
  insert into t_res(name, ok, detail) values ('CEO duyệt KTV, lọc quyền rác', r.status='active' and r.role='ktv' and r.permissions = array['area_tasks'] and r.staff_id='hien', array_to_string(r.permissions,','));

  -- 6. Duyệt người thứ hai vào cùng hồ sơ hien → bị chặn
  perform pg_temp.act(L::text, 'lead.test@homespa.test');
  r := public.request_access('Leader Thử', 'leader', null);
  perform pg_temp.act(O::text, 'owner.test@homespa.test');
  begin r := public.ceo_set_member(L, 'active', 'ktv', null, 'hien');
    insert into t_res(name, ok, detail) values ('Chặn 2 tài khoản dùng chung hồ sơ', false, 'cho phép!');
  exception when others then insert into t_res(name, ok, detail) values ('Chặn 2 tài khoản dùng chung hồ sơ', true, sqlerrm); end;

  -- 7. Duyệt leader không chọn hồ sơ → bị chặn
  begin r := public.ceo_set_member(L, 'active', 'leader', null, '');
    insert into t_res(name, ok, detail) values ('Bắt buộc gắn hồ sơ', false, 'cho phép!');
  exception when others then insert into t_res(name, ok, detail) values ('Bắt buộc gắn hồ sơ', true, sqlerrm); end;

  -- 8. Duyệt leader có quyền duyệt nhân sự
  r := public.ceo_set_member(L, 'active', 'leader', array['dispatch','staff_admin'], 'tuan');
  insert into t_res(name, ok, detail) values ('CEO cấp quyền duyệt nhân sự cho Leader', 'staff_admin' = any(r.permissions), array_to_string(r.permissions,','));

  -- 9. Leader (staff_admin) không được tự phong CEO
  perform pg_temp.act(L::text, 'lead.test@homespa.test');
  begin r := public.ceo_set_member(L, 'active', 'ceo', null, null);
    insert into t_res(name, ok, detail) values ('Leader không tự phong CEO', false, 'đã thành CEO!');
  exception when others then insert into t_res(name, ok, detail) values ('Leader không tự phong CEO', true, sqlerrm); end;

  -- 10. Leader (staff_admin) không khóa được chủ spa
  begin r := public.ceo_set_member(O, 'disabled', null, null, null);
    insert into t_res(name, ok, detail) values ('Không ai khóa được chủ spa', false, 'đã khóa!');
  exception when others then insert into t_res(name, ok, detail) values ('Không ai khóa được chủ spa', true, sqlerrm); end;

  -- 11. Leader (staff_admin) chỉnh được KTV thường
  r := public.ceo_set_member(K, 'active', 'ktv', array['area_tasks','customers'], 'hien');
  insert into t_res(name, ok, detail) values ('Leader chỉnh quyền KTV thường', r.permissions @> array['customers'], array_to_string(r.permissions,','));

  -- 12. KTV bị khóa → gửi lại yêu cầu vẫn bị khóa
  perform pg_temp.act(O::text, 'owner.test@homespa.test');
  r := public.ceo_set_member(K, 'disabled', null, null, null);
  perform pg_temp.act(K::text, 'ktv.test@homespa.test');
  r := public.request_access('KTV Thử', 'ktv', 'mở lại giúp em');
  insert into t_res(name, ok, detail) values ('Bị khóa thì tự gửi lại không mở được', r.status='disabled', r.status);

  -- 13. CEO từ chối rồi người đó gửi lại → về chờ duyệt
  perform pg_temp.act(O::text, 'owner.test@homespa.test');
  r := public.ceo_set_member(K, 'rejected', null, null, null);
  perform pg_temp.act(K::text, 'ktv.test@homespa.test');
  r := public.request_access('KTV Thử', 'ktv', 'xin lại');
  insert into t_res(name, ok, detail) values ('Bị từ chối có thể gửi lại', r.status='pending', r.status);

  -- 14. Chủ spa không tự khóa mình
  perform pg_temp.act(O::text, 'owner.test@homespa.test');
  begin r := public.ceo_set_member(O, 'disabled', null, null, null);
    insert into t_res(name, ok, detail) values ('Chủ spa không tự khóa', false, 'đã khóa!');
  exception when others then insert into t_res(name, ok, detail) values ('Chủ spa không tự khóa', true, sqlerrm); end;
end $$;

-- 15-16. Quyền đọc (RLS): KTV chỉ thấy chính mình; CEO thấy tất cả; không ghi trực tiếp được
select pg_temp.act('00000000-0000-0000-0000-0000000000a2', 'ktv.test@homespa.test');
set role authenticated;
insert into t_res(name, ok, detail) select 'KTV chỉ đọc được hồ sơ của mình', count(*) = 1, count(*)::text from public.members where email like '%homespa.test';
reset role;
select pg_temp.act('00000000-0000-0000-0000-0000000000a1', 'owner.test@homespa.test');
set role authenticated;
insert into t_res(name, ok, detail) select 'CEO đọc được tất cả', count(*) = 3, count(*)::text from public.members where email like '%homespa.test';
reset role;
select pg_temp.act('00000000-0000-0000-0000-0000000000a2', 'ktv.test@homespa.test');
do $$ begin
  set role authenticated;
  begin update public.members set role = 'ceo', status = 'active' where user_id = auth.uid();
    reset role; insert into t_res(name, ok, detail) values ('Không sửa trực tiếp bảng được', false, 'sửa được!');
  exception when others then reset role; insert into t_res(name, ok, detail) values ('Không sửa trực tiếp bảng được', true, sqlerrm); end;
end $$;
reset role;

-- Dọn dữ liệu thử
delete from public.members where email like '%@homespa.test';
delete from auth.users where email like '%@homespa.test';
delete from public.app_owners where email like '%@homespa.test';
select set_config('request.jwt.claims', '', false);
select count(*) filter (where not ok) as loi, count(*) as tong, string_agg(n || (case when ok then ' OK ' else ' FAIL ' end) || name || ' [' || coalesce(detail,'') || ']', ' || ' order by n) as chi_tiet from t_res;
