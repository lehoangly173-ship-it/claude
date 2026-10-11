// ⑬ Cài đặt hệ thống (CEO): mỗi mục 13.x mở trang riêng. Có dữ liệu trong app → lấy THẬT; chưa có → "số liệu mẫu".
// Đây là nơi CEO xem/sửa quy tắc mà các màn KTV, lễ tân, Leader đang đọc theo.
import { ReactNode, useState } from 'react'
import { useStore, BUDGET_LIMIT } from '../store'
import * as D from '../data'
import { custSegment, pointsOf } from '../logic'
import { Block, Pill, Tiles, SubHead, Empty, RefPhoto, PhotoInput } from '../ui'
import { PAY_RULE, FIXED_CATS } from '../period'
import { CEO_NODES } from '../specs'

const S = <Pill tone="yellow">{D.SAMPLE_NOTE}</Pill>
const R = <Pill tone="green">dữ liệu app</Pill>
const CN = <Pill>Chưa nối</Pill>
const Tbl = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => <div className="tbl-wrap"><table><thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j ? '' : 'strong'}>{c}</td>)}</tr>)}</tbody></table></div>
const yes = (b: boolean) => b ? <b style={{ color: 'var(--g-fg)' }}>✓</b> : <span className="muted">—</span>

/** Danh sách mục 13.x — bấm để mở */
export function settingRows() { return CEO_NODES.NM13.rows }

export function SettingDetail({ no, back }: { no: string; back: () => void }) {
  const { s, say } = useStore()
  const row = CEO_NODES.NM13.rows.find(r => r.no === no)
  const [info, setInfo] = useState({ name: 'Home Spa – Clinic Dr Quyên', addr: 'Đà Nẵng (số nhà – đường: số liệu mẫu)', phone: '0236 3xx xxx (mẫu)', open: '08:00', close: '20:00', from: D.dateShort() })
  if (!row) return <Empty>Không tìm thấy mục cài đặt</Empty>
  const staffBy = (r: D.Role) => s.staff.filter(x => x.role === r)
  const head = <SubHead title={`${row.t}`} sub={row.d.split(' → ')[0]} onBack={back} />
  const body: Record<string, () => ReactNode> = {
    '13.1': () => <Block title="Thông tin Home" sub="CEO sửa trực tiếp · áp dụng cho hóa đơn, tin nhắn, Mộc" right={S}>
      <div className="grid fgrid">
        {([['name', 'Tên thương hiệu'], ['addr', 'Địa chỉ'], ['phone', 'Hotline'], ['open', 'Giờ mở cửa'], ['close', 'Giờ đóng cửa'], ['from', 'Ngày áp dụng']] as const).map(([k, l]) =>
          <label key={k} className="f">{l}<input className="inp" type={k === 'open' || k === 'close' ? 'time' : 'text'} value={info[k]} onChange={e => setInfo({ ...info, [k]: e.target.value })} /></label>)}
      </div>
      <div className="row"><span className="small">Màu chủ đạo</span><span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--green)', display: 'inline-block' }} /><span className="small">Xanh lá Home</span>
        <button className="btn pri right-al" onClick={() => say('Đã lưu trong phiên chạy thử — chưa nối máy chủ nên tải lại trang sẽ mất')}>Lưu thay đổi</button></div>
      <div className="tiny muted">Giờ hoạt động khớp ca làm: {D.SHIFTS[1].label} · {D.SHIFTS[2].label}.</div>
    </Block>,
    '13.2': () => <>
      <Block title="Tầng · giường" sub={`${D.BEDS.length} giường`} right={R}><Tbl head={['Tầng', 'Giường trị liệu', 'Giường gội', 'Tổng']} rows={([1, 2, 3] as const).map(f => { const b = D.BEDS.filter(x => x.floor === f); return [`Tầng ${f}`, b.filter(x => x.zone === 'treatment').map(x => x.id).join(', ') || '—', b.filter(x => x.zone === 'wash').map(x => x.id).join(', ') || '—', b.length] })} /></Block>
      <Block title="Thiết bị" right={S}><Tbl head={['Thiết bị', 'Vị trí', 'Bảo dưỡng', 'Trạng thái']} rows={[['Điều hòa', 'Mỗi phòng', 'Vệ sinh lưới lọc mỗi tháng', <Pill tone="green">Tốt</Pill>], ['Máy giặt khăn', 'Tầng 1', '3 tháng/lần', <Pill tone="green">Tốt</Pill>], ['Bồn ngâm chân', 'Tầng 1', 'Thay gioăng khi rò', <Pill tone="yellow">Cần xem</Pill>], ['Máy xông', 'Tầng 2', 'Kiểm tra mỗi tuần', <Pill tone="green">Tốt</Pill>]]} /></Block>
    </>,
    '13.3': () => <Block title="Cơ cấu tổ chức" sub="Tuyến quản lý · số người thật trong app" right={R}>
      <div className="org"><div className="org-n top">CEO · {staffBy('ceo').map(x => x.name).join(', ')}</div>
        <div className="org-n">Leader · {staffBy('leader').map(x => x.name).join(', ') || '—'}</div>
        <div className="org-row">{(['reception', 'ktv', 'marketing'] as D.Role[]).map(r => <div key={r} className="org-n sm"><b>{D.ROLE_LABEL[r]}</b><span className="tiny">{staffBy(r).length} người</span><span className="tiny muted">{staffBy(r).map(x => x.name).join(', ')}</span></div>)}</div></div>
      <div className="tiny muted">Leader quản lý lễ tân + KTV hằng ngày; Marketing báo cáo thẳng CEO; ngân sách Leader/Marketing tự quyết ≤ {D.vnd(BUDGET_LIMIT)}.</div>
    </Block>,
    '13.4': () => <Block title="Quyền theo vai trò" sub="Đúng quy tắc app hiện đang chạy" right={<Pill tone="green">theo quy tắc app</Pill>}>
      <Tbl head={['Quyền', 'KTV', 'Lễ tân', 'Leader', 'Marketing', 'CEO']} rows={([
        ['Xem SĐT / địa chỉ khách', 0, 1, 0, 0, 1], ['Xuất file dữ liệu khách', 0, 0, 0, 0, 1], ['Xem doanh thu toàn Home', 0, 0, 1, 0, 1], ['Tạo hóa đơn · thu tiền', 0, 1, 0, 0, 0],
        ['Duyệt nghỉ phép / đổi ca', 0, 0, 1, 0, 1], ['Duyệt điểm uy tín', 0, 0, 1, 0, 1], ['Thêm / sửa ảnh mẫu đối chiếu', 0, 0, 1, 0, 1], ['Ghi / sửa vào ngày đã qua', 0, 0, 1, 0, 1],
        ['Ghi nhận chăm sóc khách (khách mình làm)', 1, 0, 0, 0, 0], ['Chỉ xem dữ liệu của mình', 1, 0, 0, 0, 0], ['Cài đặt hệ thống', 0, 0, 0, 0, 1],
      ] as [string, ...number[]][]).map(([t, ...v]) => [t, ...v.map(x => yes(!!x))])} />
    </Block>,
    '13.5': () => <Block title="Ca làm · điều phối" right={<Pill tone="green">theo quy tắc app</Pill>}>
      <Tbl head={['Quy tắc', 'Giá trị']} rows={[['Ca 1', D.SHIFTS[1].label], ['Ca 2', D.SHIFTS[2].label], ['Dọn giường giữa 2 khách', '10 phút'], ['Thứ tự nhận khách', 'Xoay tour theo thứ tự trong ca'], ['Khách yêu cầu đích danh', 'Giao đúng KTV, không làm mất lượt'], ['Quyền chia tour', 'Lễ tân; xung đột → Leader quyết'], ['Khách chờ quá', '10 phút → cảnh báo Leader']]} />
    </Block>,
    '13.6': () => <>
      <Block title="Dịch vụ & giá" right={R}><Tbl head={['Dịch vụ', 'Thời lượng', 'Giá']} rows={D.SERVICES.map(x => [x.name, `${x.duration} phút`, D.vnd(x.price)])} /></Block>
      <Block title="Gói liệu trình" right={R}><Tbl head={['Gói', 'Buổi / giá trị', 'Tặng', 'Giá', 'Hạn dùng']} rows={D.PACKAGE_CATALOG.map(p => [p.name, p.type === 'session' ? `${p.sessions} buổi` : D.vnd(p.value ?? 0), p.type === 'session' ? `${p.bonus ?? 0} buổi` : D.vnd(p.bonusValue ?? 0), D.vnd(p.listPrice), `${p.months} tháng`])} /></Block>
    </>,
    '13.7': () => { const segs = ['Khách mới', 'Khách quay lại', 'Đang dùng liệu trình', 'Lâu chưa đến']
      return <><Tiles items={segs.map(g => ({ v: s.customers.filter(c => custSegment(c) === g).length, l: g }))} />
        <Block title="Điều kiện phân nhóm & mốc chăm sóc" right={S}><Tbl head={['Nhóm / mốc', 'Điều kiện', 'Việc cần làm']} rows={[['Khách mới', '1 lượt', 'Nhắn hỏi thăm sau 1 ngày'], ['Khách quay lại', '≥ 2 lượt', 'Mời gói liệu trình phù hợp'], ['Lâu chưa đến', '≥ 45 ngày (dữ liệu app)', 'Gọi mời quay lại, ưu đãi 10%'], ['VIP', 'Chi ≥ 10 triệu hoặc ≥ 15 lượt', 'Ưu tiên KTV quen, quà dịp lễ'], ['Sinh nhật', 'Trong tháng sinh', 'Tặng voucher SINHNHAT'], ['Sau buổi liệu trình', '3 ngày', 'KTV/lễ tân hỏi tiến triển']]} /></Block></> },
    '13.8': () => <Block title="Checklist khu vực dọn dẹp" sub={`${D.ZONES.length} khu · người phụ trách đổi ở "Phân khu dọn dẹp"`} right={R}>
      <Tbl head={['Khu', 'Ca', 'Số việc', 'Phụ trách', 'Minh chứng']} rows={D.ZONES.map(z => [`${z.no}. ${z.name}`, z.shift === 1 ? 'Sáng' : 'Chiều', z.std.length, D.staffName(s.zoneOwner[z.no]), 'Ảnh + Leader kiểm tra'])} /></Block>,
    '13.9': () => <><Block title="Tiêu chí điểm uy tín" right={S}><Tbl head={['Sự việc', 'Điểm', 'Người xác nhận']} rows={[['Khu vực dọn dẹp đạt chuẩn', `+${D.ZONE_POINTS}`, 'Leader'], ['Khách khen / đánh giá 5★', '+2', 'Lễ tân → Leader duyệt'], ['Báo sự cố sớm', '+1', 'Leader'], ['Đi muộn không báo', '−1', 'Hệ thống chấm công'], ['Khách phàn nàn có căn cứ', '−2', 'Leader / CEO']]} /></Block>
      <Block title="Điểm hiện tại" right={R}><Tbl head={['Nhân viên', 'Vai trò', 'Điểm']} rows={s.staff.filter(x => x.role === 'ktv' || x.role === 'reception').map(x => [x.name, D.ROLE_LABEL[x.role], pointsOf(s, x.id)])} /></Block></>,
    '13.10': () => <Block title="Công thức lương – hoa hồng – thưởng" sub="Đang dùng cho trang Thu nhập của tôi" right={S}>
      <Tbl head={['Thành phần', 'KTV', 'Lễ tân']} rows={[['Lương cơ bản / tháng', D.vnd(PAY_RULE.base.ktv), D.vnd(PAY_RULE.base.reception)], ['Công chuẩn', `${PAY_RULE.stdDays} ngày`, `${PAY_RULE.stdDays} ngày`], ['Hoa hồng', `${PAY_RULE.commission.ktv * 100}% doanh thu tour`, `${PAY_RULE.commission.reception * 100}% tiền thu`], ['Thưởng', `${D.vnd(PAY_RULE.perPoint)} / điểm uy tín`, `${D.vnd(PAY_RULE.perPoint)} / điểm uy tín`], ['Phạt', `${D.vnd(PAY_RULE.perLate)} / lần đi muộn`, `${D.vnd(PAY_RULE.perLate)} / lần đi muộn`]]} />
      <div className="tiny muted">Tổng lương thưởng = lương theo công + hoa hồng + thưởng − phạt. Khi CEO chốt công thức thật, cập nhật bảng này là mọi trang (Thu nhập của tôi, Lương) tự tính lại.</div></Block>,
    '13.11': () => <><Block title="Nhóm chi phí" right={R}><Tbl head={['Hạng mục', 'Loại']} rows={D.EXP_CATS.map(c => [c, (FIXED_CATS as readonly string[]).includes(c) ? 'Cố định hằng tháng' : 'Phát sinh'])} /></Block>
      <Block title="Quỹ" right={S}><Tbl head={['Quỹ', 'Trích từ lợi nhuận', 'Mục đích']} rows={[['Quỹ vận hành', '20%', 'Lương, mặt bằng khi doanh thu thấp'], ['Quỹ dự phòng', '10%', 'Sửa chữa, sự cố'], ['Quỹ đầu tư', '5%', 'Thiết bị, mở rộng']]} /></Block></>,
    '13.12': () => <Block title="Luồng phê duyệt" right={<Pill tone="green">theo quy tắc app</Pill>}><Tbl head={['Việc', 'Ai duyệt', 'Hạn phản hồi']} rows={[['Ngân sách ≤ ' + D.vndShort(BUDGET_LIMIT), 'Leader / Marketing tự quyết', '—'], ['Ngân sách > ' + D.vndShort(BUDGET_LIMIT) + ' · đổi giá · ưu đãi', 'CEO', '24 giờ (mẫu)'], ['Nghỉ phép / đổi ca', 'Leader hoặc CEO (không tự duyệt đơn mình)', 'Trước ca'], ['Điểm uy tín lễ tân ghi nhận', 'Leader / CEO', '24 giờ (mẫu)'], ['Xóa hóa đơn', 'CEO', 'Trong ngày'], ['Đề xuất vận hành của lễ tân', 'Leader', 'Trong ca']]} /></Block>,
    '13.13': () => <Block title="Mộc AI" right={CN}><Tbl head={['Cài đặt', 'Hiện tại']} rows={[['Kiến thức đã duyệt', D.SOPS.map(x => x.title).slice(0, 4).join(' · ') + '…'], ['Giọng giao tiếp', 'Ấm áp, ngắn gọn, xưng "Home" (mẫu)'], ['Quyền dữ liệu', 'Theo vai trò người hỏi (13.4)'], ['Chuyển người thật', 'Khiếu nại → Lễ tân; vượt quyền → Leader; tiền/giá → CEO'], ['AI thật', 'Chưa nối — đang trả lời giả lập']]} /></Block>,
    '13.14': () => <Block title="Kết nối" right={R}><Tbl head={['Dịch vụ', 'Dùng cho', 'Trạng thái']} rows={[['Expo (web)', 'Bản xem thử', <Pill tone="green">Đã kết nối</Pill>], ['Supabase', 'Lưu dữ liệu thật, đăng nhập', CN], ['Zalo OA', 'Nhắn tin CSKH', CN], ['Facebook / TikTok', 'Nguồn khách, quảng cáo', CN], ['Google Maps', 'Đối soát đánh giá', CN]]} /></Block>,
    '13.15': () => <Block title="Ngưỡng cảnh báo & báo cáo" right={<Pill tone="green">theo quy tắc app</Pill>}><Tbl head={['Cảnh báo', 'Ngưỡng', 'Ai nhận', 'Mức']} rows={[['Khách chờ chia tour', '> 10 phút', 'Lễ tân, Leader', <Pill tone="red">Làm ngay</Pill>], ['Khách trễ hẹn', '> 10 phút', 'Lễ tân', <Pill tone="yellow">Quan trọng</Pill>], ['Lệch đối soát tour', 'Có lệch', 'Leader, CEO', <Pill tone="yellow">Quan trọng</Pill>], ['Kho dưới ngưỡng', `VD dầu massage < ${D.STOCK_ITEMS[0].warn} ${D.STOCK_ITEMS[0].unit}`, 'Lễ tân, Leader', <Pill tone="green">Vừa</Pill>], ['Báo cáo tuần', 'Thứ Hai 08:00 (mẫu)', 'CEO', <Pill>Bình thường</Pill>]]} /></Block>,
    '13.16': () => <><Block title="Nhật ký thay đổi gần đây" sub="Từ thông báo trong app" right={R}><div className="card list">{s.notifs.slice(0, 8).map(n => <div key={n.id} className="item"><div className="body"><div className="t">{n.text}</div><div className="d">{n.cat}{n.by ? ` · ${n.by}` : ''}</div></div></div>)}{!s.notifs.length && <Empty>Chưa có</Empty>}</div></Block>
      <Block title="Đăng nhập · sao lưu"><Tbl head={['Mục', 'Trạng thái']} rows={[['Đăng nhập Google theo vai trò', CN], ['Sao lưu dữ liệu hằng ngày', CN], ['Khôi phục phiên bản', 'Theo nhánh bản (ban-1, ban-2, ban-3…)']]} /></Block></>,
  }
  return <>{head}{(body[no] ?? (() => <Empty>Mục này chưa có nội dung</Empty>))()}</>
}

/** Leader & CEO: quản lý toàn bộ ảnh mẫu đối chiếu ở một chỗ (KTV/lễ tân thấy ảnh này khi chụp minh chứng) */
export function RefPhotosPage({ back }: { back: () => void }) {
  const groups: [string, [string, string, string][]][] = [
    ['Dọn dẹp theo khu', D.ZONES.map(z => [`zone:${z.no}`, `Khu ${z.no} · ${z.name}`, 'Chụp toàn cảnh khu vực, đủ sáng, thấy rõ các điểm trong tiêu chuẩn.'] as [string, string, string])],
    ['Kiểm tra cơ sở (lễ tân)', D.XP_ITEMS.map(([t], k) => [`xp:${k}`, t, 'Ảnh chuẩn Home để đối chiếu khi kiểm tra.'] as [string, string, string])],
    ['Chứng từ & minh chứng', [['bill', 'Ảnh bill', 'Chụp thẳng, đủ 4 góc bill.'], ['review', 'Ảnh đánh giá của khách', 'Có tên khách, số sao, ngày.'], ['product', 'Ảnh xác minh sản phẩm', 'Thấy rõ nhãn, dung tích.'], ['invoice', 'Ảnh hóa đơn', 'Rõ số tiền, ngày, nơi bán.'], ['stock-in', 'Ảnh hóa đơn nhập', 'Hóa đơn kèm hàng nhập.'], ['equipment', 'Ảnh thiết bị', 'Toàn bộ thiết bị và vị trí hỏng.'], ['ops-report', 'Ảnh báo cáo theo mẫu', 'Đúng góc như ảnh mẫu Home.']]],
  ]
  const { user, setRefPhoto } = useStore(), can = user.role === 'leader' || user.role === 'ceo'
  const all = groups.flatMap(([g, l]) => l.map(([k, t]) => ({ k, t, g })))
  const [target, setTarget] = useState(''), [img, setImg] = useState('')
  return <>
    <SubHead title="Ảnh mẫu đối chiếu" sub="Chỉ Leader và CEO thêm / đổi / xóa · nhân viên thấy ảnh này khi chụp minh chứng" onBack={back} />
    {can && <Block title="Thêm ảnh mẫu & chỉ định khu vực" sub="Chọn ảnh → chọn khu vực / mục áp dụng → Gán">
      <PhotoInput value={img} onChange={setImg} label="Ảnh mẫu mới" />
      <label className="f">Áp dụng cho khu vực / mục<select className="inp" value={target} onChange={e => setTarget(e.target.value)}><option value="">— chọn khu vực / mục —</option>
        {groups.map(([g, l]) => <optgroup key={g} label={g}>{l.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</optgroup>)}</select></label>
      <button className="btn pri" disabled={!img || !target} onClick={() => { setRefPhoto(target, img); setImg(''); setTarget('') }}>Gán ảnh mẫu{target ? ` cho ${all.find(x => x.k === target)?.t}` : ''}</button>
    </Block>}
    {groups.map(([g, list]) => <Block key={g} title={g}><div className="col">{list.map(([k, t, h]) => <RefPhoto key={k} k={k} title={t} hint={h} />)}</div></Block>)}
    <div className="tiny muted">Ảnh đang lưu trong phiên chạy thử (chưa nối máy chủ): tải lại trang sẽ về ảnh minh họa.</div>
  </>
}
