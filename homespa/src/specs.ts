// Trích tự động từ docs/ceo-tables.md và docs/marketing-spec.md — cấu trúc nút con theo sơ đồ
export type SpecRow = { no: string; t: string; d: string }
export const CEO_NODES: Record<string, { title: string; rows: SpecRow[] }> = {
"NM1": {
"title": "Tổng quan – Báo cáo CEO",
"rows": [
{
"no": "1.1",
"t": "Sức khỏe Home",
"d": "Khách hàng · tài chính · Marketing · nhân sự · chất lượng → Kết quả hiện tại · mục tiêu · tăng/giảm · cảnh báo"
},
{
"no": "1.2",
"t": "Tăng trưởng – Suy giảm",
"d": "Theo ngày · tuần · tháng · quý · năm → Số kỳ này/kỳ trước · chênh lệch số lượng · tỷ lệ thay đổi · xu hướng"
},
{
"no": "1.3",
"t": "Cảnh báo quan trọng",
"d": "Khách giảm · dòng tiền thiếu · chi phí tăng · chất lượng giảm · thiếu nhân sự → Mức ảnh hưởng · dữ liệu liên quan · người xử lý · thời hạn"
},
{
"no": "1.4",
"t": "Điểm nghẽn toàn Home",
"d": "Mới phát hiện · đang xác minh · đang xử lý · cần CEO quyết định → Nguyên nhân có bằng chứng · phương án · tiến độ · kết quả"
},
{
"no": "1.5",
"t": "Báo cáo bộ phận",
"d": "Leader · lễ tân · KTV · Marketing → Kết quả · vấn đề · việc tồn · đề xuất"
},
{
"no": "1.6",
"t": "Báo cáo tổng hợp",
"d": "Ngày · tuần · tháng · quý · năm → Tóm tắt · biểu đồ · giải thích biến động · xuất báo cáo"
},
{
"no": "1.7",
"t": "Ưu tiên CEO",
"d": "Ba ưu tiên tuần · quyết định đến hạn → Người chịu trách nhiệm · hạn hoàn thành · trạng thái"
}
]
},
"NM2": {
"title": "Khách hàng – VIP – Giới thiệu",
"rows": [
{
"no": "2.1",
"t": "Tổng quan khách hàng",
"d": "Tổng hồ sơ · khách hoạt động · khách mới · khách quay lại → Danh sách · lượt đến · dịch vụ sử dụng · biến động theo kỳ"
},
{
"no": "2.2",
"t": "Hồ sơ khách",
"d": "Thông tin · lịch sử dịch vụ · liệu trình · sở thích → Tên, điện thoại, địa chỉ · KTV quen · phản hồi · lưu ý chăm sóc"
},
{
"no": "2.3",
"t": "Khách VIP",
"d": "Danh sách VIP · VIP mới · VIP đang hoạt động · VIP lâu chưa đến → Giá trị gói · mức chi tiêu · tần suất · quyền lợi · lịch sử thay đổi hạng"
},
{
"no": "2.4",
"t": "Tăng trưởng VIP",
"d": "Đầu kỳ · mới đạt hạng · thay đổi hạng · cuối kỳ → Tăng/giảm số khách · lý do · hoạt động chăm sóc liên quan"
},
{
"no": "2.5",
"t": "Khách giới thiệu",
"d": "Người giới thiệu · khách được giới thiệu · quyền lợi giới thiệu → Số người được giới thiệu · đặt lịch · đến thực tế · mua gói · quà đã trao"
},
{
"no": "2.6",
"t": "Giữ chân – Tái tục",
"d": "Quay lại lần hai · sử dụng gói · sắp hết gói · tái tục → Tỷ lệ quay lại · khoảng cách giữa các lần đến · lý do chưa tái tục"
},
{
"no": "2.7",
"t": "Khách lâu chưa đến",
"d": "Theo mốc thời gian · theo nhóm khách → Lý do đã xác minh · người chăm sóc · kết quả liên hệ · ngày theo dõi lại"
},
{
"no": "2.8",
"t": "Trải nghiệm – Khiếu nại",
"d": "Feedback · chưa hài lòng · sự cố · khách cần hỗ trợ riêng → Nội dung · bộ phận liên quan · người xử lý · khách xác nhận kết quả"
},
{
"no": "2.9",
"t": "Hiệu quả chăm sóc",
"d": "AI · lễ tân · Leader · offline · gọi điện → Đúng hạn · kết nối · kết quả · đặt lịch · khách đến thực tế"
}
]
},
"NM3": {
"title": "Tệp khách – Nguồn khách",
"rows": [
{
"no": "3.1",
"t": "Theo nguồn biết đến Home",
"d": "Google Maps · Facebook · TikTok · website · giới thiệu · đối tác · nguồn khác → Số khách · khách mới đến · mua gói · quay lại"
},
{
"no": "3.2",
"t": "Theo kênh đặt lịch",
"d": "Điện thoại · Facebook · Zalo · website · trực tiếp → Số lịch · lịch xác nhận · khách đến · hủy/không đến"
},
{
"no": "3.3",
"t": "Theo loại khách",
"d": "Lẻ Việt · liệu trình Việt · lẻ nước ngoài · liệu trình nước ngoài → Số khách · lượt phục vụ · tiền đã thu · dịch vụ sử dụng"
},
{
"no": "3.4",
"t": "Theo hành vi",
"d": "Mới · thường xuyên · lâu chưa đến · sắp hết gói → Quy mô tệp · thay đổi theo kỳ · danh sách cần chăm sóc"
},
{
"no": "3.5",
"t": "Theo nhu cầu",
"d": "Massage trị liệu · gội dưỡng sinh · nhu cầu khách đã cung cấp → Tần suất sử dụng · phản hồi · nhu cầu chưa đáp ứng"
},
{
"no": "3.6",
"t": "Theo giá trị",
"d": "Giá trị gói · mức chi tiêu · tần suất đến · mức gắn bó → Xếp hạng · lịch sử · đóng góp · phương án chăm sóc"
},
{
"no": "3.7",
"t": "Hiệu quả từng tệp",
"d": "Thu hút · chuyển đổi · giữ chân → Chi phí thu hút · tỷ lệ đến · quay lại · tái tục"
}
]
},
"NM4": {
"title": "Marketing – Phát triển nguồn khách",
"rows": [
{
"no": "4.1",
"t": "Tổng quan kênh",
"d": "Facebook · Google Maps · TikTok · Instagram · website · kênh khác → Người theo dõi tăng ròng · tiếp cận · lượt xem · tương tác"
},
{
"no": "4.2",
"t": "Kế hoạch nội dung",
"d": "Ý tưởng · kịch bản · sản xuất · chờ duyệt · đã đăng → Người phụ trách · hạn đăng · sản phẩm · kết quả"
},
{
"no": "4.3",
"t": "Tư liệu từ lễ tân",
"d": "Ảnh khách đồng ý · video hoạt động · video feedback → Người quay · ngày quay · đồng ý sử dụng hình ảnh · chất lượng · bàn giao"
},
{
"no": "4.4",
"t": "Khách tiềm năng",
"d": "Khách hỏi mới · nhu cầu phù hợp · đang tư vấn → Nguồn · chiến dịch · số khách riêng biệt · kết quả"
},
{
"no": "4.5",
"t": "Phễu chuyển đổi",
"d": "Hỏi → đặt lịch → đến → mua gói → tái tục → Số khách mỗi bước · tỷ lệ chuyển đổi · điểm giảm"
},
{
"no": "4.6",
"t": "Chiến dịch",
"d": "Đề xuất · được duyệt · đang chạy · kết thúc → Mục tiêu · ngân sách · thực chi · khách đến · kết quả"
},
{
"no": "4.7",
"t": "Chi phí – Hiệu quả",
"d": "Quảng cáo · nhân sự · sản xuất · công cụ · đối tác → Chi phí mỗi khách hỏi · mỗi khách mới đến · tiền thu liên quan"
},
{
"no": "4.8",
"t": "Đối tác – Cộng đồng",
"d": "BNI · doanh nghiệp · đối tác địa phương → Khách giới thiệu · khách đến · chi phí/quyền lợi · hiệu quả"
},
{
"no": "4.9",
"t": "Thử nghiệm Marketing",
"d": "Nội dung · nhóm khách · ưu đãi · kênh mới → Giả thuyết · ngân sách thử · kết quả · tiếp tục/điều chỉnh/dừng"
}
]
},
"NM5": {
"title": "Doanh thu – Chi phí – Lợi nhuận",
"rows": [
{
"no": "5.1",
"t": "Doanh thu dịch vụ",
"d": "Massage · gội dưỡng sinh · theo loại khách/cơ sở → Dịch vụ đã thực hiện · số lượt · giá trị · tăng/giảm"
},
{
"no": "5.2",
"t": "Bán liệu trình",
"d": "Gói mới · tái tục · cọc · khoản còn cần thanh toán → Khách · gói · tiền đã thu · nghĩa vụ phục vụ còn lại"
},
{
"no": "5.3",
"t": "Chi phí vận hành",
"d": "Nhân sự · mặt bằng · điện nước · vật tư · Marketing · chi phí khác → Ngân sách · thực chi · chứng từ · người phụ trách"
},
{
"no": "5.4",
"t": "Hiệu quả dịch vụ",
"d": "Massage · gội · nhóm dịch vụ → Doanh thu/lượt · chi phí phân bổ/lượt · phần đóng góp"
},
{
"no": "5.5",
"t": "Lợi nhuận quản trị",
"d": "Toàn Home · cơ sở · nhóm dịch vụ → Doanh thu · chi phí · lợi nhuận · biên lợi nhuận"
},
{
"no": "5.6",
"t": "Điểm hòa vốn",
"d": "Kế hoạch · thực tế · kịch bản → Chi phí · lượng dịch vụ cần đạt · khoảng cách với mục tiêu"
},
{
"no": "5.7",
"t": "Ngân sách – Sai lệch",
"d": "Theo tháng · bộ phận · dự án → Kế hoạch · thực tế · chênh lệch · giải trình · điều chỉnh"
},
{
"no": "5.8",
"t": "Kiểm tra số liệu",
"d": "Hóa đơn · khoản chi · dữ liệu thiếu/sai · chốt kỳ → Đối chiếu · người xác nhận · lịch sử sửa · trạng thái chốt"
}
]
},
"NM6": {
"title": "Dòng tiền – Quỹ – Đầu tư",
"rows": [
{
"no": "6.1",
"t": "Tiền vào",
"d": "Dịch vụ lẻ · bán gói · tái tục · khoản thu khác → Ngày thu · khách/đối tượng · số tiền · phương thức · chứng từ"
},
{
"no": "6.2",
"t": "Vốn và khoản vay",
"d": "Vốn bổ sung · tiền vay · hoàn trả → Nguồn · số tiền · điều kiện · lịch thanh toán"
},
{
"no": "6.3",
"t": "Tiền ra",
"d": "Vận hành · đầu tư · nghĩa vụ thanh toán → Người nhận · mục đích · hạn trả · trạng thái"
},
{
"no": "6.4",
"t": "Số dư – Đối chiếu",
"d": "Tiền mặt · tài khoản ngân hàng · khoản thanh toán đang chờ về → Số theo dõi · thực tế · chênh lệch · xác nhận"
},
{
"no": "6.5",
"t": "Dự báo dòng tiền",
"d": "Khoản dự kiến thu · khoản chắc chắn phải trả · kịch bản → Thời điểm · giả định · mức thiếu/dư · phương án"
},
{
"no": "6.6",
"t": "Các quỹ",
"d": "Vận hành · an toàn · dự phòng · đầu tư · mặt bằng cơ sở 1 → Mục tiêu · số đã phân bổ · thiếu/dư · lịch sử sử dụng"
},
{
"no": "6.7",
"t": "Phân bổ – Điều chuyển",
"d": "Bổ sung quỹ · chuyển quỹ · đề xuất chi → Số tiền · lý do · CEO duyệt · lịch sử"
},
{
"no": "6.8",
"t": "Cơ hội đầu tư",
"d": "Thiết bị · công suất · đào tạo · Marketing · phần mềm · mặt bằng → Vốn cần · lợi ích dự kiến · chi phí duy trì · rủi ro · thời gian thu hồi dự kiến"
},
{
"no": "6.9",
"t": "Khoản đã cam kết",
"d": "Dự án được duyệt · mua sắm · hợp đồng → Tổng cam kết · đã trả · còn phải trả · tiền còn có thể phân bổ"
}
]
},
"NM7": {
"title": "Nhân sự – Năng lực – Thu nhập",
"rows": [
{
"no": "7.1",
"t": "Quy mô đội ngũ",
"d": "Đầu kỳ · tuyển mới · nghỉ việc · cuối kỳ → Theo vai trò · cơ sở · ca · tăng/giảm"
},
{
"no": "7.2",
"t": "Định biên – Tuyển dụng",
"d": "Vị trí thiếu · đang tuyển · thử việc · chính thức → Số lượng cần · ứng viên · tiến độ · chi phí"
},
{
"no": "7.3",
"t": "Hồ sơ nhân viên",
"d": "Thông tin · mã nhân viên · vai trò · lịch sử làm việc → Ngày vào · bộ phận · quản lý trực tiếp · trạng thái"
},
{
"no": "7.4",
"t": "Chấm công – Ca làm",
"d": "Lịch ca · thực tế · nghỉ · đổi ca · tăng ca → Sai lệch · đề nghị chỉnh · người xác nhận"
},
{
"no": "7.5",
"t": "Năng suất – KPI",
"d": "Leader · lễ tân · KTV · Marketing → Mục tiêu · kết quả · minh chứng · nhận xét"
},
{
"no": "7.6",
"t": "Năng lực – Đào tạo",
"d": "Kiến thức · kỹ thuật · thái độ · kỹ năng quản lý → Đánh giá đầu vào · kế hoạch học · kiểm tra · tiến bộ"
},
{
"no": "7.7",
"t": "Lương – Hoa hồng – Thưởng",
"d": "Bảng tính kỳ này · khoản thành phần · điều chỉnh → Căn cứ tính · đối chiếu · duyệt · trạng thái thanh toán"
},
{
"no": "7.8",
"t": "Điểm uy tín",
"d": "Điểm hiện tại · cộng/trừ · đề nghị xem xét → Tiêu chí · minh chứng · người xác nhận · lịch sử"
},
{
"no": "7.9",
"t": "Gắn bó – Kế cận",
"d": "Nguy cơ thiếu người · người tiềm năng · người thay thế → Kế hoạch phát triển · mức sẵn sàng · hỗ trợ cần thiết"
},
{
"no": "7.10",
"t": "Nghỉ việc – Bàn giao",
"d": "Công việc · tài sản · dữ liệu · quyền truy cập → Người nhận · xác nhận hoàn tất · thu hồi quyền"
}
]
},
"NM8": {
"title": "Vận hành – Chất lượng cơ sở",
"rows": [
{
"no": "8.1",
"t": "Tổng hợp lễ tân",
"d": "Đón khách · thu ngân · CSKH · quay chụp · bàn giao → Hoàn thành · tồn · quá hạn · vấn đề cần hỗ trợ"
},
{
"no": "8.2",
"t": "Tổng hợp KTV",
"d": "Lượt phục vụ · chất lượng · vệ sinh · đào tạo → Kết quả cá nhân · phản hồi · lỗi cần sửa"
},
{
"no": "8.3",
"t": "Điều phối – Công suất",
"d": "Lịch khách · KTV · phòng/giường · thời gian chờ → Giờ trống · cao điểm · xung đột · nguyên nhân"
},
{
"no": "8.4",
"t": "Vệ sinh – Không gian",
"d": "Sảnh · phòng · nhà vệ sinh · khu chung → Checklist · ảnh kiểm tra · lỗi · khắc phục · kiểm tra lại"
},
{
"no": "8.5",
"t": "Vật tư – Tồn kho",
"d": "Nhập · xuất · tồn · kiểm kê → Mức tối thiểu · chênh lệch · đề xuất mua · người nhận"
},
{
"no": "8.6",
"t": "Thiết bị – Bảo dưỡng",
"d": "Danh sách thiết bị · lịch bảo dưỡng · sửa chữa → Tình trạng · người phụ trách · chi phí · hạn tiếp theo"
},
{
"no": "8.7",
"t": "Sự cố vận hành",
"d": "Mới ghi nhận · đang xử lý · đã khắc phục → Mức ảnh hưởng · nguyên nhân · giải pháp · kiểm tra tái diễn"
},
{
"no": "8.8",
"t": "Tuân thủ quy trình",
"d": "Theo bộ phận · theo SOP → Kết quả kiểm tra · lỗi lặp lại · đào tạo bổ sung"
}
]
},
"NM9": {
"title": "Tổ chức – Trách nhiệm – KPI",
"rows": [
{
"no": "9.1",
"t": "Sơ đồ điều hành",
"d": "CEO · Leader · lễ tân · KTV · Marketing · hỗ trợ → Tuyến báo cáo · đội phụ trách · người thay thế"
},
{
"no": "9.2",
"t": "Mô tả vai trò",
"d": "Mục tiêu · công việc · đầu ra → Việc phải làm · tiêu chuẩn hoàn thành · giới hạn trách nhiệm"
},
{
"no": "9.3",
"t": "Phối hợp liên bộ phận",
"d": "Quy trình · đầu việc · bàn giao → Người làm · người chịu trách nhiệm cuối cùng · người duyệt · người nhận thông tin"
},
{
"no": "9.4",
"t": "Quyền quyết định hiện hành",
"d": "Chi tiêu · ưu đãi · nhân sự · xử lý khách → Ai được quyết định · hạn mức · khi nào chuyển cấp"
},
{
"no": "9.5",
"t": "Bộ KPI đang áp dụng",
"d": "Theo vai trò · cá nhân · đội nhóm → Công thức · mục tiêu · trọng số · nguồn dữ liệu · kỳ đánh giá"
},
{
"no": "9.6",
"t": "Đánh giá kết quả",
"d": "Tự đánh giá · Leader đánh giá · CEO xem xét → Minh chứng · giải trình · kết quả xác nhận · kế hoạch cải thiện"
},
{
"no": "9.7",
"t": "Ủy quyền – Bàn giao",
"d": "Người giao · người nhận · thời hạn → Phạm vi · việc tồn · xác nhận · kết thúc ủy quyền"
}
]
},
"NM10": {
"title": "Hồ sơ – Hợp đồng – Quy định",
"rows": [
{
"no": "10.1",
"t": "Hợp đồng nhân sự",
"d": "Hợp đồng · phụ lục · thỏa thuận liên quan → Người liên quan · hiệu lực · bản đã ký · mốc cần theo dõi"
},
{
"no": "10.2",
"t": "Chính sách thu nhập",
"d": "Lương · tour · hoa hồng · thưởng → Phiên bản · đối tượng áp dụng · ngày hiệu lực · người duyệt"
},
{
"no": "10.3",
"t": "Nội quy – Quy định",
"d": "Tác phong · giao tiếp · dữ liệu · tài sản · phối hợp → Nội dung · phiên bản · ngày áp dụng · xác nhận phổ biến"
},
{
"no": "10.4",
"t": "SOP – Biểu mẫu",
"d": "Theo lễ tân · KTV · Leader · Marketing → Tài liệu · checklist liên quan · hướng dẫn · biểu mẫu"
},
{
"no": "10.5",
"t": "Hợp đồng kinh doanh",
"d": "Mặt bằng · nhà cung cấp · đối tác · phần mềm → Giá trị · nghĩa vụ · lịch thanh toán · gia hạn"
},
{
"no": "10.6",
"t": "Thời hạn – Nhắc việc",
"d": "Sắp hết hạn · đến hạn thanh toán · cần cập nhật → Người phụ trách · thời điểm nhắc · kết quả xử lý"
},
{
"no": "10.7",
"t": "Phiên bản – Xác nhận",
"d": "Bản nháp · hiện hành · hết hiệu lực → Lịch sử thay đổi · người duyệt · người đã đọc"
}
]
},
"NM11": {
"title": "Chiến lược – Sáng kiến – Dự án",
"rows": [
{
"no": "11.1",
"t": "Mục tiêu phát triển",
"d": "Năm · quý · tháng → Kết quả cần đạt · chỉ số · người chịu trách nhiệm · tiến độ"
},
{
"no": "11.2",
"t": "Sáng kiến đội nhóm",
"d": "Leader · lễ tân · KTV · Marketing → Vấn đề · bằng chứng · giải pháp · lợi ích dự kiến"
},
{
"no": "11.3",
"t": "Danh mục dự án",
"d": "Đề xuất · chờ duyệt · đang làm · hoàn tất · tạm dừng → Ưu tiên · nguồn lực · ngân sách · tiến độ"
},
{
"no": "11.4",
"t": "Dự án tăng trưởng",
"d": "Marketing · khách hàng · công suất · công nghệ → Đầu việc · người phối hợp · kết quả kỳ vọng"
},
{
"no": "11.5",
"t": "Cơ sở – Mặt bằng",
"d": "Cơ sở 1 · cải tạo · mở rộng → Nhu cầu vốn · phương án · điều kiện triển khai · mốc quyết định"
},
{
"no": "11.6",
"t": "Hướng kinh doanh mới",
"d": "Đào tạo · setup chuyển giao · sản phẩm → Nhu cầu thị trường cần kiểm chứng · nguồn lực · thử nghiệm"
},
{
"no": "11.7",
"t": "Thử nghiệm nhỏ",
"d": "Giả thuyết · phạm vi · thời gian → Ngân sách · tiêu chí thành công · điều kiện dừng · kết quả"
},
{
"no": "11.8",
"t": "Đánh giá sau dự án",
"d": "Trước/sau · chi phí · hiệu quả · bài học → Duy trì · điều chỉnh · dừng · cập nhật SOP"
}
]
},
"NM12": {
"title": "Mộc CEO – Phê duyệt – Chỉ đạo",
"rows": [
{
"no": "12.1",
"t": "Hỏi Mộc",
"d": "Kinh doanh · khách hàng · nhân sự · vận hành → Câu hỏi · dữ liệu tham chiếu · phân tích · điều còn thiếu"
},
{
"no": "12.2",
"t": "Phân tích nguyên nhân",
"d": "Khách giảm · chi phí tăng · năng suất thấp · chất lượng giảm → Dữ kiện · giả thuyết · việc cần kiểm chứng · người xác minh"
},
{
"no": "12.3",
"t": "Chờ CEO duyệt",
"d": "Ngân sách · mua sắm · ưu đãi · nhân sự · dự án → Đề xuất · căn cứ · ảnh hưởng · duyệt/yêu cầu sửa/từ chối"
},
{
"no": "12.4",
"t": "Giao việc",
"d": "Cho Leader · cho bộ phận · việc phối hợp → Mục tiêu · người chính · hạn · đầu ra · người kiểm tra"
},
{
"no": "12.5",
"t": "Theo dõi quyết định",
"d": "Chưa làm · đang làm · chờ phối hợp · hoàn thành · quá hạn → Cập nhật · minh chứng · nhắc việc · đánh giá kết quả"
},
{
"no": "12.6",
"t": "Chuẩn bị báo cáo/cuộc họp",
"d": "Tổng hợp tình hình · vấn đề cần bàn · quyết định → Nội dung · người phụ trách · đầu việc sau họp"
}
]
},
"NM13": {
"title": "Cài đặt hệ thống",
"rows": [
{
"no": "13.1",
"t": "Thông tin Home",
"d": "Thương hiệu · cơ sở · giờ hoạt động → Tên · logo · màu · địa chỉ · liên hệ · ngày áp dụng"
},
{
"no": "13.2",
"t": "Không gian cơ sở",
"d": "Tầng · phòng · giường · thiết bị → Thêm/sửa · loại giường · trạng thái sử dụng"
},
{
"no": "13.3",
"t": "Cơ cấu tổ chức",
"d": "Bộ phận · vai trò · tuyến quản lý → Tạo vai trò · gán người quản lý · phạm vi phụ trách"
},
{
"no": "13.4",
"t": "Tài khoản – Phân quyền",
"d": "Theo vai trò · cơ sở · loại dữ liệu → Xem/tạo/sửa/xóa/xuất · cấp/khóa tài khoản · thu hồi quyền"
},
{
"no": "13.5",
"t": "Ca làm – Điều phối",
"d": "Ca · xoay tour · thời lượng · dọn giường → Khung giờ · quy tắc ưu tiên · quyền chia tour · xử lý xung đột"
},
{
"no": "13.6",
"t": "Dịch vụ – Giá – Gói",
"d": "Massage · gội · liệu trình · ưu đãi → Giá · thời lượng · buổi tặng · hạn dùng · trừ buổi/số dư · ngày hiệu lực"
},
{
"no": "13.7",
"t": "Khách hàng – VIP – CSKH",
"d": "Phân loại · nguồn · VIP · mốc chăm sóc → Điều kiện phân nhóm · ngưỡng VIP · sinh nhật/quà · nhắc gọi · mốc lâu chưa đến"
},
{
"no": "13.8",
"t": "Công việc – Checklist",
"d": "Việc lặp · mẫu đầu/giữa/cuối ca · bàn giao → Tần suất · người nhận · hạn · minh chứng · người kiểm tra"
},
{
"no": "13.9",
"t": "KPI – Điểm uy tín",
"d": "Theo vai trò · theo nhóm công việc → Công thức · mục tiêu · trọng số · tiêu chí điểm · chu kỳ · người xác nhận"
},
{
"no": "13.10",
"t": "Lương – Hoa hồng – Thưởng",
"d": "Thành phần thu nhập · điều kiện áp dụng → Mức/công thức · nguồn dữ liệu · ngày hiệu lực · người duyệt"
},
{
"no": "13.11",
"t": "Tài chính – Quỹ",
"d": "Nhóm thu/chi · tài khoản · kỳ ghi nhận · quỹ → Quy tắc ghi nhận · phân bổ chi phí · mục tiêu quỹ · đối chiếu · chốt kỳ"
},
{
"no": "13.12",
"t": "Luồng phê duyệt",
"d": "Mua sắm · ưu đãi · nhân sự · dự án · sự cố → Hạn mức · cấp duyệt · người thay thế · thời hạn phản hồi"
},
{
"no": "13.13",
"t": "Mộc AI",
"d": "Kiến thức · giọng giao tiếp · quyền dữ liệu · chuyển người → Tài liệu được duyệt · nội dung cần duyệt · trường hợp chuyển lễ tân/Leader/CEO"
},
{
"no": "13.14",
"t": "Kết nối – Đồng bộ",
"d": "Nguồn dữ liệu · kênh nhắn tin · công cụ liên quan → Cấu hình kết nối được hỗ trợ · lịch nhập/đồng bộ · kiểm tra lỗi"
},
{
"no": "13.15",
"t": "Báo cáo – Cảnh báo",
"d": "Dashboard · kỳ so sánh · lịch gửi · ngưỡng cảnh báo → Chỉ số hiển thị · người nhận · khung giờ · mức ưu tiên"
},
{
"no": "13.16",
"t": "Bảo mật – Lịch sử – Sao lưu",
"d": "Đăng nhập · thay đổi dữ liệu · phiên bản · sao lưu → Người thao tác · trước/sau · thời gian · khôi phục · quyền truy cập"
}
]
}
}
export const MKT_NODES: Record<string, { title: string; rows: SpecRow[] }> = {
"M1": {
"title": "",
"rows": [
{
"no": "1.1",
"t": "Tổng quan hôm nay",
"d": "Nội dung · nguồn khách · CSKH AI → Mục tiêu · kết quả · cảnh báo → Xem chi tiết · mở việc cần xử lý"
},
{
"no": "1.2",
"t": "Công việc được giao",
"d": "Cá nhân · phối hợp · định kỳ → Chưa làm · đang làm · chờ duyệt · quá hạn → Nhận việc · cập nhật · nộp kết quả · bàn giao"
},
{
"no": "1.3",
"t": "Kế hoạch nội dung",
"d": "Ngày · tuần · tháng → Chủ đề · kênh · đối tượng · mục tiêu → Thêm ý tưởng · giao người · đặt hạn"
},
{
"no": "1.4",
"t": "Sản xuất nội dung",
"d": "Bài viết · hình ảnh · video → Kịch bản → cảnh quay → quay/dựng → kiểm tra → Nộp bản nháp · nhận góp ý · sửa · gửi duyệt"
},
{
"no": "1.5",
"t": "Tư liệu từ lễ tân",
"d": "Ảnh khách đồng ý · video hoạt động · video feedback → Đã nhận · dùng được · cần bổ sung → Xem người quay · kiểm tra đồng ý sử dụng · xác nhận bàn giao"
},
{
"no": "1.6",
"t": "Duyệt – Đăng bài",
"d": "Chờ duyệt · cần sửa · đã duyệt · đã đăng → Phiên bản · lịch đăng · nền tảng → Chuyển người duyệt · đăng theo quyền · lưu link"
},
{
"no": "1.7",
"t": "Chiến dịch Marketing",
"d": "Đề xuất · chuẩn bị · đang chạy · tổng kết → Mục tiêu · tệp khách · ngân sách · người phụ trách → Gửi duyệt · cập nhật chi phí · kiểm tra kết quả"
},
{
"no": "1.8",
"t": "Phát triển kênh",
"d": "Facebook · Google Maps · TikTok · Instagram · website · kênh khác → Nội dung · bình luận/đánh giá · thông tin cần cập nhật → Tạo việc · soạn phản hồi · gửi duyệt · ghi kết quả"
},
{
"no": "1.9",
"t": "Giám sát CSKH AI",
"d": "Tin chờ duyệt · lỗi gửi · lỗi nội dung · việc chuyển người → Hội thoại · nguyên nhân · người xử lý → Kiểm tra · duyệt theo quyền · tạm dừng luồng liên quan · chuyển lễ tân/Leader"
},
{
"no": "1.10",
"t": "Điểm nghẽn – Sáng kiến",
"d": "Khách hỏi giảm · đặt lịch giảm · chi phí tăng · phản hồi kém → Dữ liệu → giả thuyết → việc xác minh → giải pháp → Lập đề xuất · giao việc · thử nghiệm · đo lại"
},
{
"no": "1.11",
"t": "Báo cáo – Bàn giao",
"d": "Cuối ngày · cuối tuần · kết thúc chiến dịch → Kết quả · việc tồn · nguyên nhân · kiến nghị → Gửi Leader/CEO · chỉ định người nhận · xác nhận bàn giao"
}
]
},
"M2": {
"title": "",
"rows": [
{
"no": "2.1",
"t": "Tổng quan khách hàng",
"d": "Khách tiềm năng · khách mới đến · khách quay lại → Theo thời gian · nguồn · chiến dịch → Xem số khách riêng biệt · mức tăng/giảm · mở danh sách"
},
{
"no": "2.2",
"t": "Dữ liệu – Hồ sơ khách",
"d": "Nhập dữ liệu · kiểm tra thiếu · kiểm tra trùng → Thông tin · mã khách · kênh liên hệ · nguồn → Xác minh · bổ sung · đề nghị gộp hồ sơ · lưu lịch sử"
},
{
"no": "2.3",
"t": "Nguồn khách",
"d": "Google · Facebook · TikTok · giới thiệu · đối tác · voucher · khác → Nguồn đầu tiên · chiến dịch · kênh đặt lịch → Xem hành trình · bổ sung nguồn thiếu · đối chiếu"
},
{
"no": "2.4",
"t": "Phân tệp khách",
"d": "Lẻ/liệu trình · Việt/nước ngoài · mới/cũ → Theo nhu cầu · tần suất · giá trị gói · lần đến gần nhất → Lọc · lưu tệp · xem điều kiện chọn khách"
},
{
"no": "2.5",
"t": "Hội thoại – Nhu cầu",
"d": "Hỏi dịch vụ · hỏi giá · đặt lịch · phản hồi → Mới · đang xử lý · chờ khách · chờ nội bộ → Xem hội thoại · ghi nhu cầu · giao người"
},
{
"no": "2.6",
"t": "Hành trình chuyển đổi",
"d": "Hỏi → đặt lịch → đến → mua gói → tái tục → Danh sách ở từng bước · lý do chưa chuyển tiếp → Mở hồ sơ · tạo việc theo dõi · chuyển lễ tân"
},
{
"no": "2.7",
"t": "Chăm sóc khách mới",
"d": "Chưa đặt lịch · đã đặt · sau buổi đầu → Thông tin cần bổ sung · hỏi cảm nhận · nhu cầu tiếp theo → AI soạn nháp · người duyệt · chuyển hỗ trợ"
},
{
"no": "2.8",
"t": "Chăm sóc khách đang sử dụng",
"d": "Khách lẻ quay lại · khách đang dùng gói → Lịch sử · số buổi/số dư · phản hồi còn tồn → Kiểm tra dữ liệu · đề xuất chăm sóc · giao việc"
},
{
"no": "2.9",
"t": "Tái tục – Khách lâu chưa đến",
"d": "Sắp hết gói · hết gói · gián đoạn → Nhu cầu · lý do · lần liên hệ gần nhất → Soạn tin · đề nghị gọi · ghi kết quả · hẹn theo dõi"
},
{
"no": "2.10",
"t": "VIP – Sinh nhật – Tri ân",
"d": "VIP · khách thân thiết · sinh nhật → Quyền lợi · sở thích · lịch sắp đến · quà → Tạo việc cho lễ tân · xác nhận chuẩn bị/trao · ghi phản hồi"
},
{
"no": "2.11",
"t": "Khách giới thiệu – Đối tác",
"d": "Người giới thiệu · khách được giới thiệu → Đã hỏi · đặt lịch · đến · mua gói · đủ điều kiện nhận quyền lợi → Đối chiếu · gửi duyệt quyền lợi · giao lễ tân thực hiện"
},
{
"no": "2.12",
"t": "Khiếu nại – Tình huống khó",
"d": "Chưa hài lòng · yêu cầu người thật · vấn đề vượt phạm vi AI → Mức ưu tiên · người phụ trách · hạn xử lý → Chuyển lễ tân/Leader/CEO · theo dõi · xác nhận kết quả"
},
{
"no": "2.13",
"t": "Tùy chọn liên hệ",
"d": "Kênh mong muốn · giờ thuận tiện · yêu cầu dừng → Luồng được nhận · luồng tạm dừng → Cập nhật · loại khỏi danh sách không phù hợp"
},
{
"no": "2.14",
"t": "Hiệu quả chăm sóc",
"d": "Theo tệp · nguồn · luồng AI · người phụ trách → Liên hệ → phản hồi → lịch → đến → tái tục → Xem kết quả · so kỳ trước · đề xuất cải thiện"
}
]
},
"M3": {
"title": "",
"rows": [
{
"no": "3.1",
"t": "Hiểu Home – Hiểu dịch vụ",
"d": "Thương hiệu · massage trị liệu · gội dưỡng sinh → Giá/gói · điểm khác biệt · chính sách hiện hành → Hỏi · xem tài liệu nguồn · báo thông tin cần cập nhật"
},
{
"no": "3.2",
"t": "SOP – Quy định Marketing",
"d": "Quy trình nội dung · đăng bài · hình ảnh khách · bàn giao → Các bước · người duyệt · tiêu chuẩn hoàn thành → Mở quy trình · áp dụng mẫu · tạo việc"
},
{
"no": "3.3",
"t": "Viết nội dung",
"d": "Bài đăng · kịch bản · tiêu đề · lời dẫn → Nhóm khách · mục tiêu · giọng Home · cảnh quay → Tạo nháp · chỉnh · lưu vào kế hoạch · gửi duyệt"
},
{
"no": "3.4",
"t": "Soạn nội dung CSKH",
"d": "Sau dịch vụ · sinh nhật · tái tục · khách lâu chưa đến → Thông tin được phép dùng · cách xưng hô · mục đích → Tạo nháp cá nhân hóa · kiểm tra · chuyển duyệt"
},
{
"no": "3.5",
"t": "Phân tích kết quả",
"d": "Nguồn khách · nội dung · chiến dịch · CSKH → Dữ kiện · biến động · giả thuyết · dữ liệu thiếu → Hỏi sâu · mở báo cáo · tạo việc xác minh"
},
{
"no": "3.6",
"t": "Xây dựng chiến dịch",
"d": "Mục tiêu · tệp khách · thông điệp → Kế hoạch · ngân sách đề xuất · phối hợp · cách đo → Lập đề xuất · gửi Leader/CEO"
},
{
"no": "3.7",
"t": "Xử lý tình huống",
"d": "Khách chưa hiểu · thắc mắc · khiếu nại · yêu cầu khó → Cách tiếp nhận · giới hạn trả lời · người cần chuyển → Tham khảo câu trả lời · tạo bàn giao"
},
{
"no": "3.8",
"t": "Đào tạo – Nâng năng lực",
"d": "Viết · quay dựng · đọc số liệu · chăm sóc khách · sử dụng AI → Bài học · ví dụ · bài thực hành → Học · nộp bài · nhận góp ý"
},
{
"no": "3.9",
"t": "Sáng kiến – Cải tiến",
"d": "Nội dung · tệp khách · luồng chăm sóc · quy trình → Vấn đề · giải pháp · thử nghiệm · kết quả mong muốn → Gửi sáng kiến · theo dõi duyệt · cập nhật kết quả"
}
]
},
"M4": {
"title": "",
"rows": [
{
"no": "4.1",
"t": "Hồ sơ – Vai trò",
"d": "Thông tin · mã nhân viên · bộ phận → Người quản lý · kênh/dự án được giao → Xem trách nhiệm · quyền hạn · đề nghị cập nhật"
},
{
"no": "4.2",
"t": "Lịch làm – Chấm công",
"d": "Lịch cá nhân · công · nghỉ/đổi ca → Thực tế · sai lệch · đơn từ → Gửi yêu cầu · xem duyệt · đối chiếu"
},
{
"no": "4.3",
"t": "Công việc của tôi",
"d": "Nội dung · chiến dịch · CSKH AI · phối hợp → Đang làm · đã hoàn thành · quá hạn → Xem lịch sử · minh chứng · nhận xét"
},
{
"no": "4.4",
"t": "Sản phẩm của tôi",
"d": "Bài viết · hình ảnh · video · kịch bản → Bản duyệt · link đăng · kết quả → Mở sản phẩm · xem phản hồi · lưu bài học"
},
{
"no": "4.5",
"t": "Kênh – Chiến dịch tôi phụ trách",
"d": "Danh sách được giao → Mục tiêu · nguồn lực · kết quả · biến động → Báo cáo · giải trình · đề xuất hỗ trợ"
},
{
"no": "4.6",
"t": "Kết quả giám sát AI",
"d": "Lỗi được giao · việc chuyển người · cải tiến luồng → Đúng hạn · chất lượng xử lý · lỗi tái diễn → Xem trường hợp gốc · góp ý · đề nghị sửa kiến thức"
},
{
"no": "4.7",
"t": "KPI cá nhân",
"d": "Tiến độ · chất lượng · kết quả theo vai trò → Mục tiêu · thực tế · trọng số · điểm → Xem công thức · dữ liệu · yêu cầu xem xét"
},
{
"no": "4.8",
"t": "Điểm uy tín – Ghi nhận",
"d": "Điểm hiện tại · cộng/trừ · lời khen → Minh chứng · người xác nhận · lịch sử → Xem · bổ sung giải trình · đề nghị kiểm tra"
},
{
"no": "4.9",
"t": "Thu nhập của tôi",
"d": "Lương · phụ cấp · thưởng theo chính sách → Dự kiến · đã chốt · thanh toán → Xem căn cứ · báo sai lệch"
},
{
"no": "4.10",
"t": "Năng lực – Phát triển",
"d": "Viết · quay dựng · phân tích · quảng cáo · AI/CSKH → Đánh giá · mục tiêu học · người hướng dẫn → Xem tiến bộ · đăng ký học · nhận góp ý"
},
{
"no": "4.11",
"t": "Sáng kiến – Dự án của tôi",
"d": "Đã đề xuất · được duyệt · đang thử · đã áp dụng → Tiến độ · hiệu quả · bài học → Cập nhật · báo cáo · đề nghị nhân rộng"
},
{
"no": "4.12",
"t": "Yêu cầu – Tài liệu",
"d": "Đề xuất hỗ trợ · hợp đồng · chính sách · nội quy → Trạng thái yêu cầu · phiên bản tài liệu → Gửi · theo dõi · xác nhận đã đọc"
},
{
"no": "4.13",
"t": "Tài khoản – Thông báo",
"d": "Bảo mật · nhắc việc · quyền được cấp → Tùy chọn cá nhân · lỗi truy cập → Cập nhật trong quyền · báo quản trị"
}
]
}
}
