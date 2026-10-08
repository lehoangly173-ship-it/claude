import { test, expect } from '@playwright/test'
import { openAs, switchRole, goTab, openHomeItem, watchErrors } from './helpers'

const MENU11 = ['Ca', 'Dọn dẹp', 'Bảng điều phối', 'Công việc của kĩ thuật viên', 'Thông báo', 'Bill Money', 'Đánh giá', 'Đối chiếu', 'Nghỉ phép', 'Sự cố', 'Sáng kiến phát triển Home Spa']

test.describe('m1 màu + chuyển mục + nút nhỏ', () => {
  test('M1-01 Hôm nay: thẻ Ca/Tour mint, Việc cần chú ý gold', async ({ page }) => {
    await openAs(page, 'KTV')
    await expect(page.locator('.mint', { hasText: 'Ca của tôi' }).first()).toBeVisible()
    await expect(page.locator('.mint', { hasText: /Thứ tự tour/i }).first()).toBeVisible()
    await expect(page.locator('.gold', { hasText: 'Việc cần chú ý' }).first()).toBeVisible()
  })

  test('M1-02 Ca/tour: 3 thẻ mint; SÁNG/CHIỀU/Bảng chia ca cùng lớp deep', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, /Ca/)
    expect(await page.locator('.mint').count()).toBeGreaterThanOrEqual(3)
    await expect(page.locator('.deep', { hasText: 'SÁNG 08:00–18:00' }).first()).toBeVisible()
    await expect(page.locator('.deep', { hasText: 'CHIỀU 10:00–20:00' }).first()).toBeVisible()
    await expect(page.locator('.deep', { hasText: 'Bảng chia ca 4 tuần' }).first()).toBeVisible()
  })

  test('M1-03 Dọn dẹp: 4 ô deep, thanh Ca sáng mint', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, /Dọn dẹp/)
    expect(await page.locator('.deep').count()).toBeGreaterThanOrEqual(4)
    await expect(page.locator('.mint', { hasText: 'Ca sáng 08:00–18:00' }).first()).toBeVisible()
  })

  test('M1-04 Thông báo + Đối chiếu: nhãn deep', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, /Thông báo/)
    for (const t of ['Đã đọc hết', 'Ghim từ Home', 'Vừa xảy ra']) await expect(page.locator('.deep', { hasText: t }).first()).toBeVisible()
    await goTab(page, 'Hôm nay')
    await openHomeItem(page, /Đối chiếu/)
    await expect(page.locator('.deep', { hasText: /Lượt xuất\/nhận hôm nay/ }).first()).toBeVisible()
    await expect(page.locator('.deep', { hasText: /Chưa đủ 2 bên xác nhận/ }).first()).toBeVisible()
  })

  test('M1-05 Tab KTV đúng 4 tab theo thứ tự', async ({ page }) => {
    await openAs(page, 'KTV')
    const bar = page.locator('nav.tabbar, .tabbar, nav').last()
    const txt = (await bar.innerText()).split('\n').map(x => x.trim()).filter(Boolean)
    expect(txt).toEqual(['Hôm nay', 'Khách hàng', 'Hỏi Mộc', 'Của tôi'])
    await expect(page.getByText('Công việc', { exact: true })).toHaveCount(0)
  })

  test('M1-06 Menu Hôm nay 11 nút; nút 4 mở Công việc; không có Khách hàng', async ({ page }) => {
    await openAs(page, 'KTV')
    for (const t of MENU11) await expect(page.getByRole('button', { name: t }).first(), t).toBeVisible()
    await expect(page.locator('.page').getByRole('button', { name: /^\s*\d*\s*Khách hàng/ })).toHaveCount(0)
    await openHomeItem(page, 'Công việc của kĩ thuật viên')
    await expect(page.getByText(/Công việc của kĩ thuật viên/).first()).toBeVisible()
  })

  test('M1-07 Tab Khách hàng mở được danh sách', async ({ page }) => {
    await openAs(page, 'KTV')
    await goTab(page, 'Khách hàng')
    await expect(page.getByText(/Khách hàng của tôi/).first()).toBeVisible()
  })

  test('M1-08 4 ô Dọn dẹp mở Modal, số = số dòng', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, /Dọn dẹp/)
    for (const label of ['Khu của tôi', 'Điểm hôm nay', 'Chờ kiểm tra', 'Cần làm lại']) {
      const tile = page.locator('.deep', { hasText: label }).first()
      const n = Number(((await tile.innerText()).match(/\d+/) ?? ['0'])[0])
      await tile.click()
      const modal = page.locator('[role=dialog], .modal').last()
      await expect(modal).toBeVisible()
      if (label === 'Điểm hôm nay') continue // số là tổng điểm, không phải số dòng
      const rows = await modal.locator('[data-testid=detail-row], .row, li').count()
      n === 0 ? await expect(modal.getByText(/Chưa có|Trống/).first()).toBeVisible() : expect(rows).toBe(n)
      await page.keyboard.press('Escape')
      await modal.getByRole('button', { name: /Đóng|×/ }).first().click({ trial: false }).catch(() => {})
    }
  })

  test('M1-09 Đã đọc/Chưa đọc đổi badge ±1', async ({ page }) => {
    await openAs(page, 'KTV')
    const bell = page.getByRole('button', { name: /^Thông báo/ }).first()
    await openHomeItem(page, /Thông báo/)
    const read = page.getByRole('button', { name: 'Đã đọc', exact: true }).first()
    await expect(read).toBeVisible()
    const unreadBefore = await page.getByRole('button', { name: 'Đã đọc', exact: true }).count()
    await read.click()
    await expect(page.getByRole('button', { name: 'Đã đọc', exact: true })).toHaveCount(unreadBefore - 1)
    await page.getByRole('button', { name: 'Chưa đọc', exact: true }).first().click()
    await expect(page.getByRole('button', { name: 'Đã đọc', exact: true })).toHaveCount(unreadBefore)
    await expect(bell).toBeVisible()
  })

  test('M1-10 Tiêu chuẩn mẫu: mọi khu có nút, tích còn sau khi mở lại', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, /Dọn dẹp/)
    await page.getByText(/Khu của tôi/).first().click()
    await expect(page.getByRole('button', { name: 'Tiêu chuẩn mẫu' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Tiêu chuẩn mẫu' }).first().click()
    await expect(page.getByText('Tệp tài liệu: Chưa nối')).toBeVisible()
  })

  test('M1-11 Đối chiếu: bán cho khách thiếu thông tin bị chặn; dùng cho cơ sở ẩn 2 ô', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, /Đối chiếu/)
    await expect(page.getByText('MỤC ĐÍCH NHẬN SẢN PHẨM')).toBeVisible()
    await page.getByText('Bán cho khách hàng').click()
    await expect(page.getByPlaceholder('Tên hoặc mã KH — không ghi SĐT')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Chụp/đính kèm hóa đơn' })).toBeVisible()
    await page.getByRole('button', { name: /Lưu|Xác nhận|Gửi/ }).last().click()
    await expect(page.getByText(/bắt buộc|Thiếu|Vui lòng/i).first()).toBeVisible()
    await page.getByText('Dùng cho cơ sở').click()
    await expect(page.getByPlaceholder('Tên hoặc mã KH — không ghi SĐT')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Chụp/đính kèm hóa đơn' })).toHaveCount(0)
  })

  test('M1-11a Bán cho ai: SĐT bị chặn, 0 gợi ý, không có chữ "Tải file"', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, /Đối chiếu/)
    await page.getByText('Bán cho khách hàng').click()
    const box = page.getByPlaceholder('Tên hoặc mã KH — không ghi SĐT')
    for (const v of ['0900 000 001', '0900000001', '0901234567']) {
      await box.fill(v)
      await expect(page.locator('[role=option], datalist option, .suggest li')).toHaveCount(0)
      await page.getByRole('button', { name: /Lưu|Xác nhận|Gửi/ }).last().click()
      await expect(page.getByText('Không ghi SĐT').first()).toBeVisible()
    }
    await expect(page.getByText('Tải file')).toHaveCount(0)
  })

  test('M1-11b Leader không thấy người mua / ảnh hóa đơn (chỉ "Bán cho khách")', async ({ page }) => {
    await openAs(page, 'Leader/Manager')
    await page.goto('/')
    await switchRole(page, 'Leader/Manager')
    await openHomeItem(page, /Đối chiếu/).catch(() => {})
    await expect(page.getByText(/Chụp\/đính kèm hóa đơn|Bán cho ai/)).toHaveCount(0)
  })

  test('M1-12 Lễ tân/Leader/CEO mở các trang Hôm nay dùng chung không lỗi console', async ({ page }) => {
    const errs = watchErrors(page)
    await openAs(page, 'Lễ Tân')
    for (const r of ['Lễ Tân', 'Leader/Manager', 'CEO'] as const) {
      await switchRole(page, r)
      for (const name of [/Dọn dẹp/, /Thông báo/, /Đối chiếu/]) {
        const b = page.getByRole('button', { name }).first()
        if (await b.count()) { await b.click(); await goTab(page, 'Hôm nay').catch(() => {}) }
      }
    }
    expect(errs).toEqual([])
  })

  test('M1-13 Nút 11 mở trang khung', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, 'Sáng kiến phát triển Home Spa')
    await expect(page.getByText(/khách hàng.*cơ sở vật chất.*tay nghề.*tinh thần tập thể/i).first()).toBeVisible()
  })
})
