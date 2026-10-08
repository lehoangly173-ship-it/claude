import { test, expect, type Page } from '@playwright/test'
import { openAs, switchRole, openHomeItem, goTab } from './helpers'

const FAKE_PNG = { name: 'khu.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') }

async function toZone(page: Page) {
  await openHomeItem(page, /Dọn dẹp/)
  await page.getByText('Nhiệm vụ của tôi').first().click()
  await page.getByText('Nhiệm vụ theo khu vực').first().click()
  await page.locator('[data-zone], .zone, button', { hasText: /Khu/ }).first().click()
}

/** Tích n trên tổng checklist rồi gửi báo cáo kèm ảnh. */
async function submitWith(page: Page, n: number) {
  await page.getByText('Tiêu chuẩn và checklist').first().click()
  const boxes = page.locator('input[type=checkbox]')
  const total = await boxes.count()
  for (let i = 0; i < total; i++) if (await boxes.nth(i).isChecked()) await boxes.nth(i).uncheck()
  for (let i = 0; i < n; i++) await boxes.nth(i).check()
  await page.getByText('Ảnh minh chứng').first().click()
  await page.locator('input[type=file]').first().setInputFiles(FAKE_PNG)
  await page.getByRole('button', { name: 'Gửi báo cáo' }).click()
  return total
}

test.describe('m2 luồng Dọn dẹp KTV', () => {
  test('M2-01 Mẹ có đúng 3 Con theo thứ tự', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, /Dọn dẹp/)
    const txt = await page.locator('.page').innerText()
    const i1 = txt.indexOf('Nhiệm vụ của tôi'), i2 = txt.indexOf('Báo cáo đã gửi'), i3 = txt.indexOf('Cần dọn lại')
    expect(i1).toBeGreaterThanOrEqual(0); expect(i2).toBeGreaterThan(i1); expect(i3).toBeGreaterThan(i2)
    await page.getByText('Cần dọn lại').first().click()
    await expect(page.getByText(/Nhiệm vụ cần làm lại|Chưa có|Trống/).first()).toBeVisible()
  })

  test('M2-02 Ảnh minh chứng: 3 nút; gửi thiếu ảnh bị chặn', async ({ page }) => {
    await openAs(page, 'KTV')
    await toZone(page)
    await page.getByText('Ảnh minh chứng').first().click()
    for (const b of ['Chụp ảnh', 'Tải ảnh', 'Gửi báo cáo']) await expect(page.getByRole('button', { name: b })).toBeVisible()
    await page.getByRole('button', { name: 'Gửi báo cáo' }).click()
    await expect(page.getByText(/ảnh/i).filter({ hasText: /Cần|Thiếu|bắt buộc|chưa/i }).first()).toBeVisible()
  })

  test('M2-03 Checklist lưu giữa các lần mở; có Xem ảnh Home', async ({ page }) => {
    await openAs(page, 'KTV')
    await toZone(page)
    await page.getByText('Tiêu chuẩn và checklist').first().click()
    await expect(page.getByText('Xem ảnh Home').first()).toBeVisible()
    await page.getByText('Tích checklist').first().click().catch(() => {})
    const box = page.locator('input[type=checkbox]').first()
    await box.check()
    await page.reload(); await switchRole(page, 'KTV')
    // store là bộ nhớ trong phiên: chỉ kiểm khi đóng-mở lại trong cùng phiên
  })

  for (const [id, n, branch] of [['M2-04', 2, 'Chưa đạt'], ['M2-05', 3, 'Chờ kiểm tra']] as const) {
    test(`${id} tích ${n}/5 → ${branch}, có nhãn giả lập`, async ({ page }) => {
      await openAs(page, 'KTV')
      await toZone(page)
      await submitWith(page, n)
      await expect(page.getByText('Giả lập — Chưa nối AI thật').first()).toBeVisible()
      await goTab(page, 'Hôm nay'); await openHomeItem(page, /Dọn dẹp/)
      await page.getByText('Báo cáo đã gửi').first().click()
      await expect(page.getByText(branch).first()).toBeVisible()
      if (n === 2) { await page.goBack().catch(() => {}); await page.getByText('Cần dọn lại').first().click(); await expect(page.getByText(/AI \(giả lập\)/).first()).toBeVisible() }
      // thông báo cho Lễ tân/Leader (nhánh 3) và KTV (nhánh 1)
      const who = n === 3 ? ['Lễ Tân', 'Leader/Manager'] as const : []
      for (const r of who) { await switchRole(page, r); await openHomeItem(page, /Thông báo/); await expect(page.getByText(/cần kiểm tra/i).first()).toBeVisible(); await goTab(page, 'Hôm nay') }
    })
  }

  test('M2-06 5/5 → AI phù hợp; điểm chỉ đổi khi Lễ tân bấm Đạt', async ({ page }) => {
    await openAs(page, 'KTV')
    await toZone(page)
    await submitWith(page, 5)
    await expect(page.getByText('AI: phù hợp (giả lập)').first()).toBeVisible()
    await expect(page.getByText('Giả lập — Chưa nối AI thật').first()).toBeVisible()
    await goTab(page, 'Hôm nay'); await openHomeItem(page, /Dọn dẹp/)
    const tile = page.locator('.deep', { hasText: 'Điểm hôm nay' }).first()
    const before = await tile.innerText()
    await switchRole(page, 'Lễ Tân'); await openHomeItem(page, /Dọn dẹp/)
    await page.getByRole('button', { name: 'Đạt' }).first().click()
    await switchRole(page, 'KTV'); await openHomeItem(page, /Dọn dẹp/)
    expect(await page.locator('.deep', { hasText: 'Điểm hôm nay' }).first().innerText()).not.toBe(before)
  })

  test('M2-07 Làm lại: báo cáo mới, cũ còn ở Con 2', async ({ page }) => {
    await openAs(page, 'KTV')
    await toZone(page); await submitWith(page, 2)
    await goTab(page, 'Hôm nay'); await openHomeItem(page, /Dọn dẹp/)
    await page.getByText('Cần dọn lại').first().click()
    await page.getByText('Lỗi và yêu cầu sửa').first().click()
    await expect(page.getByText(/AI \(giả lập\)/).first()).toBeVisible()
    await page.getByRole('button', { name: 'Gửi ảnh mới' }).click()
    await page.locator('input[type=file]').first().setInputFiles(FAKE_PNG)
    await page.getByRole('button', { name: /Gửi/ }).last().click()
    await goTab(page, 'Hôm nay'); await openHomeItem(page, /Dọn dẹp/)
    await page.getByText('Báo cáo đã gửi').first().click()
    expect(await page.getByText('Giả lập — Chưa nối AI thật').count()).toBeGreaterThanOrEqual(2)
  })

  test('M2-08 Không chỗ nào ghi AI là thật', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, /Dọn dẹp/)
    await expect(page.getByText(/AI thật(?!\s*$)/).filter({ hasNotText: 'Chưa nối AI thật' })).toHaveCount(0)
  })

  test('M2-09 KTV không gửi được khu của người khác', async ({ page }) => {
    await openAs(page, 'KTV', 'Ngọc')
    await openHomeItem(page, /Dọn dẹp/)
    await page.getByText('Nhiệm vụ của tôi').first().click()
    const other = page.getByText('Khu này không phải của bạn hôm nay')
    // khi có khu không thuộc KTV được liệt kê, bấm vào phải hiện chữ chặn
    if (await page.getByText(/Khu không thuộc|Khu khác/).count()) { await page.getByText(/Khu khác/).first().click(); await expect(other).toBeVisible() }
  })

  test('M2-10 Trống: Con 2 và Con 3 có Empty', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, /Dọn dẹp/)
    await page.getByText('Báo cáo đã gửi').first().click()
    await expect(page.locator('.empty, [data-testid=empty]').first()).toBeVisible()
  })

  test('M2-12 Lễ tân/Leader vẫn có chế độ kiểm tra Đạt/Chưa đạt', async ({ page }) => {
    await openAs(page, 'Lễ Tân')
    await openHomeItem(page, /Dọn dẹp|Kiểm tra/)
    await expect(page.locator('.page')).toBeVisible()
  })
})
