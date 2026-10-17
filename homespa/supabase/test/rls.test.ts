// Kiểm thử phân quyền (RLS) trên Postgres nhúng: chạy migration thật + dữ liệu thử, đăng nhập từng vai trò rồi thử đọc/ghi.
import { describe, it, expect, beforeAll } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(__dirname, '..')
const U = { ceo: '00000000-0000-0000-0000-000000000001', leader: '00000000-0000-0000-0000-000000000002', rec: '00000000-0000-0000-0000-000000000003', ktv1: '00000000-0000-0000-0000-000000000004', ktv2: '00000000-0000-0000-0000-000000000005', mkt: '00000000-0000-0000-0000-000000000006', newbie: '00000000-0000-0000-0000-000000000009' }
let db: PGlite

/** Đăng nhập giả: đặt auth.uid() rồi chuyển sang vai trò authenticated (hoặc anon) */
async function as(uid: string | null) {
  const claims = uid ? JSON.stringify({ sub: uid, email: `${uid.slice(-2)}@home.vn` }) : ''
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); select set_config('request.jwt.claims', '${claims}', false); set role ${uid ? 'authenticated' : 'anon'};`)
}
const rows = async (sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as Record<string, unknown>[]
const fails = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); return false } catch { return true } }
const root = () => db.exec('reset role;')

beforeAll(async () => {
  db = new PGlite()
  await db.exec(readFileSync(join(dir, 'test/stub.sql'), 'utf8'))
  await db.exec(readFileSync(join(dir, 'migrations/0001_phan_quyen.sql'), 'utf8'))
  await db.exec(readFileSync(join(dir, 'migrations/0003_nhom2_goi_cham_soc.sql'), 'utf8'))
  await db.exec(readFileSync(join(dir, 'migrations/0004_moc_ai.sql'), 'utf8'))
  await db.exec(`
    insert into auth.users (id) values ${Object.values(U).map(u => `('${u}')`).join(',')};
    insert into staff (id, user_id, name, role, shift) values
      ('quyen','${U.ceo}','Quyên','ceo',null), ('thao','${U.leader}','Thảo','leader',1), ('lam','${U.rec}','Lam','reception',1),
      ('mai','${U.ktv1}','Mai','ktv',1), ('hien','${U.ktv2}','Hiền','ktv',1), ('nga','${U.mkt}','Nga','marketing',null);
    insert into customers (id, code, name) values ('c1','KL0001','Khách Một'), ('c2','KL0002','Khách Hai');
    insert into customer_contacts (customer_id, phone, address) values ('c1','0905 123 456','12 Lê Lợi'), ('c2','0905 999 888','Mẫu');
    insert into customer_health values ('c1','Đau cổ vai gáy',null,null), ('c2','Huyết áp',null,null);
    insert into appointments (id, customer_id, ktv_id, service_id, start_min, end_min, status) values
      ('a1','c1','mai','s1',540,600,'in_service'), ('a2','c2','hien','s1',600,660,'booked');
    insert into packages (card_code, customer_id, name, type, final_price, sessions, bonus, used) values ('LT-1','c1','Gói 10 buổi','session',5000000,10,1,3), ('LT-2','c2','Gói 5','session',2000000,5,0,0);
    insert into invoices (id, code, customer_id, creator_id, status, total, paid) values ('i1','HD1','c1','lam','Đã thanh toán',500000,500000);
    insert into leaves (id, staff_id, kind, leave_date) values ('11111111-1111-1111-1111-111111111111','thao','Nghỉ phép', current_date + 3), ('22222222-2222-2222-2222-222222222222','mai','Nghỉ phép', current_date + 3);
  `)
})

describe('Chưa đăng nhập', () => {
  it('khách vãng lai (anon) không đọc được gì', async () => {
    await as(null)
    expect(await fails('select * from customers')).toBe(true)
    expect(await fails('select * from customer_contacts')).toBe(true)
    await root()
  })
  it('đăng nhập nhưng chưa được duyệt: không thấy dữ liệu, chỉ gửi được yêu cầu tham gia', async () => {
    await as(U.newbie)
    expect(await rows('select * from customers')).toHaveLength(0)
    expect(await rows('select * from staff')).toHaveLength(0)
    expect(await rows('select * from appointments')).toHaveLength(0)
    expect(await fails(`insert into join_requests (email, name, wanted_role) values ('sep@home.vn','Giả email','ktv')`)).toBe(true) // email phải đúng email đăng nhập
    await db.query(`insert into join_requests (email, name, wanted_role) values ('09@home.vn','Người mới','ktv')`)
    expect(await fails(`insert into join_requests (email, name, wanted_role) values ('09@home.vn','Gửi lần 2','ktv')`)).toBe(true) // 1 yêu cầu đang chờ
    expect(await fails(`insert into join_requests (email, name, wanted_role, status) values ('09@home.vn','Tự duyệt','ceo','Đã duyệt')`)).toBe(true)
    expect(await fails(`insert into staff (id, user_id, name, role) values ('hack','${U.newbie}','Hack','ceo')`)).toBe(true)
    await root()
  })
})

describe('KTV chỉ xem dữ liệu của mình', () => {
  it('chỉ thấy khách & lịch của mình; không thấy SĐT, hóa đơn, giá gói', async () => {
    await as(U.ktv1)
    expect((await rows('select id from customers')).map(r => r.id)).toEqual(['c1'])
    expect((await rows('select id from appointments')).map(r => r.id)).toEqual(['a1'])
    expect(await rows('select * from customer_contacts')).toHaveLength(0)
    expect(await rows('select * from customer_finance')).toHaveLength(0)
    expect(await rows('select * from invoices')).toHaveLength(0)
    expect(await rows('select * from packages')).toHaveLength(0)
    expect((await rows('select health from customer_health')).map(r => r.health)).toEqual(['Đau cổ vai gáy'])
    const pk = await rows(`select * from ktv_packages('c1')`); expect(pk).toHaveLength(1); expect(pk[0].left_amount).toBe(8); expect(pk[0]).not.toHaveProperty('final_price')
    expect(await rows(`select * from ktv_packages('c2')`)).toHaveLength(0)
    await root()
  })
  it('không tự nâng quyền, không sửa lịch người khác, không lập hóa đơn', async () => {
    await as(U.ktv1)
    expect((await db.query(`update staff set role = 'ceo' where id = 'mai'`)).affectedRows).toBe(0)
    expect(await fails(`select approve_join(gen_random_uuid(), 'ceo')`)).toBe(true)
    expect(await fails(`select ktv_set_appt_status('a2','in_service')`)).toBe(true)
    expect((await db.query(`update appointments set status = 'cancelled' where id = 'a1'`)).affectedRows).toBe(0)
    expect(await fails(`insert into invoices (code, customer_id, status) values ('HDX','c1','Đã thanh toán')`)).toBe(true)
    await db.query(`select ktv_set_appt_status('a1','done')`) // tour của mình: được
    await root()
    expect((await rows(`select status from appointments where id='a1'`))[0].status).toBe('done')
  })
  it('ghi nhận chăm sóc: chỉ khách mình phục vụ hôm nay', async () => {
    await as(U.ktv1)
    await db.query(`insert into care_notes (customer_id, data) values ('c1', '{"pain":"cổ vai"}')`)
    expect(await fails(`insert into care_notes (customer_id, data) values ('c2', '{}')`)).toBe(true)
    expect(await fails(`insert into care_notes (customer_id, data, by_staff_id) values ('c1', '{}', 'hien')`)).toBe(true)
    await as(U.ktv2)
    expect(await rows('select * from care_notes')).toHaveLength(0)
    await root()
  })
  it('ảnh: chỉ tải vào thư mục của mình', async () => {
    await as(U.ktv1)
    await db.query(`insert into storage.objects (bucket_id, name) values ('photos', 'mai/2026-10-13/don-khu-2.jpg')`)
    expect(await fails(`insert into storage.objects (bucket_id, name) values ('photos', 'hien/2026-10-13/x.jpg')`)).toBe(true)
    expect(await fails(`insert into storage.objects (bucket_id, name) values ('ref', 'zone-2.jpg')`)).toBe(true)
    await as(U.ktv2)
    expect(await rows(`select * from storage.objects`)).toHaveLength(0)
    await root()
  })
})

describe('SĐT khách chỉ Lễ tân + CEO', () => {
  it('đọc bảng liên hệ', async () => {
    for (const [u, n] of [[U.rec, 2], [U.ceo, 2], [U.leader, 0], [U.mkt, 0], [U.ktv1, 0]] as const) { await as(u); expect(await rows('select * from customer_contacts')).toHaveLength(n) }
    await root()
  })
  it('tìm theo SĐT phải khớp đủ số; Leader không dò được', async () => {
    await as(U.rec)
    expect((await rows(`select * from find_customer_by_phone('0905.123.456')`)).map(r => r.id)).toEqual(['c1'])
    expect(await rows(`select * from find_customer_by_phone('0905')`)).toHaveLength(0)
    await as(U.leader)
    expect(await rows(`select * from find_customer_by_phone('0905123456')`)).toHaveLength(0)
    await root()
  })
})

describe('Ngày đã qua chỉ Leader/CEO ghi', () => {
  it('lễ tân không thêm lịch/chi tiêu ngày cũ; Leader được', async () => {
    await as(U.rec)
    expect(await fails(`insert into appointments (customer_id, service_id, start_min, end_min, work_date) values ('c1','s1',600,660, current_date - 2)`)).toBe(true)
    expect(await fails(`insert into expenses (cat, amount, work_date) values ('Điện', 100000, current_date - 2)`)).toBe(true)
    await db.query(`insert into expenses (cat, amount) values ('Điện', 100000)`)
    await as(U.leader)
    await db.query(`insert into appointments (customer_id, service_id, start_min, end_min, work_date) values ('c1','s1',600,660, current_date - 2)`)
    await root()
  })
})

describe('Duyệt: không ai tự duyệt đơn của mình', () => {
  it('Leader không duyệt nghỉ phép của chính mình, duyệt được của KTV', async () => {
    await as(U.leader)
    expect((await db.query(`update leaves set status='Đã duyệt', decided_by='thao' where id='11111111-1111-1111-1111-111111111111'`)).affectedRows).toBe(0)
    expect((await db.query(`update leaves set status='Đã duyệt', decided_by='thao' where id='22222222-2222-2222-2222-222222222222'`)).affectedRows).toBe(1)
    await as(U.ktv1)
    expect((await db.query(`update leaves set status='Đã duyệt' where staff_id='mai'`)).affectedRows).toBe(0)
    await root()
  })
  it('Leader không chiếm đề xuất điểm của người khác để tự cộng', async () => {
    await as(U.rec); await db.query(`insert into points (id, staff_id, delta, reason) values ('33333333-3333-3333-3333-333333333333','hien', 1, 'đề xuất')`)
    await as(U.leader)
    expect(await fails(`update points set staff_id='thao', delta=50, status='Đã duyệt', decided_by='thao' where id='33333333-3333-3333-3333-333333333333'`)).toBe(true)
    expect(await fails(`update points set delta=50, status='Đã duyệt', decided_by='thao' where id='33333333-3333-3333-3333-333333333333'`)).toBe(true)
    expect((await db.query(`update points set status='Đã duyệt', decided_by='thao' where id='33333333-3333-3333-3333-333333333333'`)).affectedRows).toBe(1)
    expect(await fails(`update leaves set leave_date = current_date + 9 where id='22222222-2222-2222-2222-222222222222'`)).toBe(true)
    await root()
  })
  it('kho: không tạo phiếu "Đã duyệt" sẵn, không tự duyệt phiếu mình', async () => {
    await as(U.rec)
    expect(await fails(`insert into stock_moves (item, kind, qty, status) values ('dau','Nhập',100,'Đã duyệt')`)).toBe(true)
    await as(U.leader)
    await db.query(`insert into stock_moves (id, item, kind, qty, status) values ('44444444-4444-4444-4444-444444444444','dau','Nhập',100,'Chờ duyệt')`)
    expect((await db.query(`update stock_moves set status='Đã duyệt' where id='44444444-4444-4444-4444-444444444444'`)).affectedRows).toBe(0)
    await as(U.ceo)
    expect((await db.query(`update stock_moves set status='Đã duyệt' where id='44444444-4444-4444-4444-444444444444'`)).affectedRows).toBe(1)
    expect(await fails(`update stock_moves set qty = 1 where id='44444444-4444-4444-4444-444444444444'`)).toBe(true)
    await root()
  })
  it('chấm công: chỉ qua giờ máy chủ, không tự khai giờ', async () => {
    await as(U.ktv1)
    expect(await fails(`insert into attendance (staff_id, check_in) values ('mai', 420)`)).toBe(true)
    const m = (await rows('select clock_in() as m'))[0].m as number; expect(m).toBeGreaterThanOrEqual(0)
    expect((await db.query(`update attendance set check_in = 400 where staff_id='mai'`)).affectedRows).toBe(0)
    await db.query('select clock_out()')
    await as(U.leader); expect((await db.query(`update attendance set check_in = 470 where staff_id='mai'`)).affectedRows).toBe(1)
    await root()
  })
  it('nhân viên chỉ thấy danh bạ (tên, vai trò), không thấy tài khoản của người khác', async () => {
    await as(U.ktv1)
    expect(await rows('select * from staff')).toHaveLength(1)
    const dir = await rows('select * from staff_directory'); expect(dir.length).toBe(6); expect(dir[0]).not.toHaveProperty('user_id')
    await root()
  })
  it('điểm uy tín: lễ tân chỉ đề xuất (chờ duyệt), không tự cộng cho mình', async () => {
    await as(U.rec)
    await db.query(`insert into points (staff_id, delta, reason) values ('mai', 2, 'Khách khen')`)
    expect(await fails(`insert into points (staff_id, delta, reason, status) values ('mai', 5, 'x', 'Đã duyệt')`)).toBe(true)
    expect(await fails(`insert into points (staff_id, delta, reason) values ('lam', 5, 'tự cộng')`)).toBe(true)
    await as(U.ktv1)
    expect((await rows('select delta from points')).map(r => r.delta)).toEqual([2])
    expect(await fails(`insert into points (staff_id, delta, reason, decided_by) values ('hien', 1, 'x', 'mai')`)).toBe(true)
    await root()
  })
})

describe('Hóa đơn, lương, cài đặt, nhật ký', () => {
  it('lễ tân lập hóa đơn của mình; không sửa số tiền; chỉ xin xóa', async () => {
    await as(U.rec)
    await db.query(`insert into invoices (id, code, customer_id, status, total, paid) values ('i2','HD2','c1','Đã thanh toán',300000,300000)`)
    expect(await fails(`insert into invoices (code, customer_id, status, creator_id) values ('HD3','c1','Đã thanh toán','thao')`)).toBe(true)
    expect((await db.query(`update invoices set paid = 0 where code = 'HD2'`)).affectedRows).toBe(0)
    expect((await db.query(`update invoices set status = 'Chờ xóa', paid = 0 where code = 'HD2'`)).affectedRows).toBe(0) // không lách qua "xin xóa"
    await db.query(`select request_delete_invoice('i2')`)
    await root(); expect((await rows(`select status, paid from invoices where id='i2'`))[0]).toEqual({ status: 'Chờ xóa', paid: 300000 }); await as(U.rec)
    expect(await fails(`select request_delete_invoice('i1')`)).toBe(false) // i1 cũng do lam lập hôm nay → được xin xóa
    await root()
    expect((await rows(`select total_paid from customer_finance where customer_id='c1'`))[0].total_paid).toBe(800000)
  })
  it('lương: tự xem của mình; chỉ CEO ghi', async () => {
    await root(); await db.exec(`insert into payslips values ('mai','2026-10','{"total":7000000}'), ('hien','2026-10','{"total":6500000}')`)
    await as(U.ktv1); expect((await rows('select staff_id from payslips')).map(r => r.staff_id)).toEqual(['mai'])
    expect(await fails(`insert into payslips values ('mai','2026-11','{}')`)).toBe(true)
    await as(U.leader); expect(await fails(`insert into payslips values ('mai','2026-11','{}')`)).toBe(true)
    await as(U.ceo); await db.query(`insert into payslips values ('mai','2026-11','{"total":1}')`)
    await root()
  })
  it('cài đặt chỉ CEO sửa; ảnh mẫu Leader/CEO', async () => {
    await as(U.leader); expect(await fails(`insert into settings values ('prio', '{}')`)).toBe(true)
    await db.query(`insert into ref_photos (target, path) values ('zone:2','ref/zone-2.jpg')`)
    await as(U.ktv1); expect(await fails(`insert into ref_photos (target, path) values ('zone:3','x')`)).toBe(true)
    expect(await rows('select * from ref_photos')).toHaveLength(1)
    await as(U.ceo); await db.query(`insert into settings values ('prio', '{"Lịch hẹn":2}')`)
    await root()
  })
  it('nhật ký: chỉ CEO đọc, không ai sửa/xóa; không chứa SĐT/sức khỏe', async () => {
    await as(U.leader); expect(await rows('select * from audit_log')).toHaveLength(0)
    await as(U.ceo)
    const log = await rows('select * from audit_log'); expect(log.length).toBeGreaterThan(3)
    expect(JSON.stringify(log)).not.toMatch(/0905|Đau cổ|Huyết áp/)
    expect((await db.query('delete from audit_log')).affectedRows).toBe(0)
    expect((await db.query(`update audit_log set action = 'x'`)).affectedRows).toBe(0)
    expect(await fails(`insert into audit_log (action, tbl) values ('giả','x')`)).toBe(true)
    await root()
  })
})

describe('CEO duyệt tài khoản & vai trò', () => {
  it('CEO duyệt → người mới có vai trò; CEO không tự hạ quyền', async () => {
    await as(U.ceo)
    const req = (await rows(`select id from join_requests where status='Chờ duyệt'`))[0].id
    const sid = (await rows(`select approve_join($1, 'ktv', null, 2::smallint) as sid`, [req]))[0].sid
    expect(sid).toBeTruthy()
    expect(await fails(`select set_staff_role('quyen','leader')`)).toBe(true)
    await as(U.newbie)
    expect((await rows('select app_role() as r'))[0].r).toBe('ktv')
    expect(await rows('select * from customers')).toHaveLength(0) // KTV mới chưa có tour → chưa thấy khách nào
    await as(U.ceo); await db.query(`select set_staff_role($1, 'ktv', false)`, [sid]) // khóa tài khoản
    await as(U.newbie); expect((await rows('select app_role() as r'))[0].r).toBeNull()
    await root()
  })
})

describe('Nhóm 2: gói liệu trình + ghi nhận chăm sóc (app ghi/đọc)', () => {
  it('Lễ tân ghi dòng nhật ký chăm sóc cho khách; KTV khác không đọc được', async () => {
    await as(U.rec)
    await db.query(`insert into care_notes (customer_id, data) values ('c2', '{"entry":{"at":"x","by":"Lam","text":"Nhắn tin hỏi thăm"}}')`)
    expect((await rows(`select data from care_notes where customer_id='c2'`)).length).toBeGreaterThan(0)
    await as(U.ktv1); expect(await rows(`select * from care_notes where customer_id='c2'`)).toHaveLength(0)
    await root()
  })
  it('Không ghi giả tên người khác, không ghi cho ngày khác', async () => {
    await as(U.rec)
    expect(await fails(`insert into care_notes (customer_id, data, by_staff_id) values ('c2', '{}', 'mai')`)).toBe(true)
    expect(await fails(`insert into care_notes (customer_id, data, work_date) values ('c2', '{}', current_date - 3)`)).toBe(true)
    await root()
  })
  it('Lễ tân lưu gói đầy đủ cột mới (mã mẫu, người chốt, tái tục); ghi lại cùng mã thì cập nhật', async () => {
    await as(U.rec)
    await db.query(`insert into packages (card_code, customer_id, name, type, final_price, sessions, used, catalog_id, closer, closer_ids, renewal_of) values ('LT-9','c2','Gói 20','session',7000000,20,0,'p20','Lam',array['lam'],'LT-2')`)
    await db.query(`insert into packages (card_code, customer_id, name, type, final_price, sessions, used, catalog_id) values ('LT-9','c2','Gói 20','session',7000000,20,1,'p20') on conflict (card_code) do update set used = excluded.used`)
    const r = await rows(`select used, closer, catalog_id from packages where card_code='LT-9'`); expect(r[0].used).toBe(1); expect(r[0].closer).toBe('Lam'); expect(r[0].catalog_id).toBe('p20')
    await root()
  })
  it('KTV và Marketing không đọc/ghi bảng gói (KTV chỉ có số buổi còn qua hàm)', async () => {
    for (const u of [U.ktv1, U.mkt]) { await as(u); expect(await rows('select * from packages')).toHaveLength(0); expect(await fails(`insert into packages (card_code, customer_id, name, type) values ('X','c1','x','session')`)).toBe(true) }
    await root()
  })
})

describe('Mộc AI: kiến thức + lượt hỏi', () => {
  it('Có sẵn các quy trình của app (đã duyệt); KTV đọc được', async () => {
    await as(U.ktv1); expect((await rows(`select * from moc_docs where approved`)).length).toBeGreaterThanOrEqual(3); await root()
  })
  it('CEO soạn + duyệt cho KTV; Marketing không thấy; KTV không sửa/thêm được', async () => {
    await as(U.ceo); await db.query(`insert into moc_docs (title, body, roles, approved) values ('Quy định đồng phục','Mặc áo xanh', '{ktv}', true)`)
    await as(U.ktv1); expect(await rows(`select * from moc_docs where title='Quy định đồng phục'`)).toHaveLength(1)
    expect(await fails(`insert into moc_docs (title, body) values ('Tự thêm','x x')`)).toBe(true)
    await db.query(`update moc_docs set body='hack' where title='Quy định đồng phục'`)
    await as(U.mkt); expect(await rows(`select * from moc_docs where title='Quy định đồng phục'`)).toHaveLength(0)
    await as(U.ceo); expect((await rows(`select body from moc_docs where title='Quy định đồng phục'`))[0].body).toBe('Mặc áo xanh')
    await root()
  })
  it('Leader soạn → luôn "chờ CEO duyệt", không giả người sửa; KTV chưa thấy; Leader sửa bài đã duyệt → về chờ duyệt', async () => {
    await as(U.leader); await db.query(`insert into moc_docs (title, body, roles, approved, updated_by) values ('Leader viết','Nội dung', '{ktv}', true, 'quyen')`)
    let r = await rows(`select approved, updated_by from moc_docs where title='Leader viết'`); expect(r[0].approved).toBe(false); expect(r[0].updated_by).toBe('thao')
    await as(U.ktv1); expect(await rows(`select * from moc_docs where title='Leader viết'`)).toHaveLength(0)
    await as(U.leader); await db.query(`update moc_docs set body='Sửa', approved=true where title='Quy định đồng phục'`)
    await as(U.ceo); r = await rows(`select approved, updated_by from moc_docs where title='Quy định đồng phục'`); expect(r[0].approved).toBe(false); expect(r[0].updated_by).toBe('thao')
    expect(await fails(`insert into moc_docs (title, body, roles) values ('Sai vai','xx', '{admin}')`)).toBe(true)
    await db.query(`insert into moc_docs (title, body, roles, approved) values ('Chỉ CEO','Riêng', '{ceo}', true)`)
    await as(U.leader); expect(await rows(`select * from moc_docs where title='Chỉ CEO'`)).toHaveLength(0); await as(U.ceo)
    await root()
  })
  it('Lượt hỏi: trả về vai trò thật, tối đa 60/24 giờ; chưa duyệt/khách lạ bị chặn; không ai đọc được bảng lượt', async () => {
    await as(U.ktv2); expect((await rows('select moc_take_quota() as r'))[0].r).toBe('ktv')
    for (let i = 0; i < 59; i++) await db.query('select moc_take_quota()')
    expect(await fails('select moc_take_quota()')).toBe(true)
    expect(await fails('select * from moc_usage')).toBe(true)
    await as(U.newbie); expect(await fails('select moc_take_quota()')).toBe(true)
    await as(null); expect(await fails('select moc_take_quota()')).toBe(true)
    await root()
  })
})
