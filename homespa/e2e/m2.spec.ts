import { test, expect, type Page } from '@playwright/test'
import { openAs, switchRole, openHomeItem, goTab } from './helpers'

const FAKE_PNG = { name: 'khu.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') }
// Hiền: phụ trách khu 3, seed chưa có báo cáo nào (Mai đã có báo cáo cr3 nên không dùng cho test trống)
const KTV = 'Hiền'
const con = (page: Page, name: string) => page.getByRole('button', { name: new RegExp(name) }).first()
const tabBtn = (page: Page, name: string) => page.getByRole('tab', { name })

async function toZone(page: Page) {
  await openHomeItem(page, /dọn dẹp/i)
  await con(page, 'Nhiệm vụ của tôi').click()
  await con(page, 'Nhiệm vụ theo khu vực').click()
  await page.locator('button.item', { hasText: 'Khu 3' }).first().click()
}
async function homeCleaning(page: Page) { await goTab(page, 'Hôm nay'); await openHomeItem(page, /dọn dẹp/i) }

/** Tích n trên tổng checklist rồi gửi báo cáo kèm ảnh. */
async function submitWith(page: Page, n: number) {
  await tabBtn(page, 'Tiêu chuẩn và checklist').click()
  const boxes = page.locator('input[type=checkbox]')
  const total = await boxes.count()
  for (let i = 0; i < n; i++) await boxes.nth(i).check()
  await tabBtn(page, 'Ảnh minh chứng').click()
  await page.locator('input[type=file]').first().setInputFiles(FAKE_PNG)
  await page.getByRole('button', { name: 'Gửi báo cáo' }).click()
  return total
}

test.describe('m2 luồng Dọn dẹp KTV', () => {
  test('M2-01 Mẹ có đúng 3 Con theo thứ tự; Con 3 mở trực tiếp', async ({ page }) => {
    await openAs(page, 'KTV', KTV)
    await openHomeItem(page, /dọn dẹp/i)
    const txt = await page.locator('.nodes, .fm-item').first().locator('xpath=ancestor-or-self::*[contains(@class,"nodes")]').innerText()
    const i1 = txt.indexOf('Nhiệm vụ của tôi'), i2 = txt.indexOf('Báo cáo đã gửi'), i3 = txt.indexOf('Cần dọn lại')
    expect(i1).toBeGreaterThanOrEqual(0); expect(i2).toBeGreaterThan(i1); expect(i3).toBeGreaterThan(i2)
    await con(page, 'Cần dọn lại').click()
    await expect(page.getByText('Chưa có báo cáo nào cần làm lại').first()).toBeVisible()
  })

  test('M2-02 Ảnh minh chứng: 3 nút; gửi thiếu ảnh bị chặn', async ({ page }) => {
    await openAs(page, 'KTV', KTV)
    await toZone(page)
    for (const b of ['Chụp ảnh', 'Tải ảnh', 'Gửi báo cáo']) await expect(page.getByRole('button', { name: b })).toBeVisible()
    await page.getByRole('button', { name: 'Gửi báo cáo' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Cần tải ảnh minh chứng' })).toBeVisible()
  })

  test('M2-03 Checklist lưu giữa các lần mở; có Xem ảnh Home', async ({ page }) => {
    await openAs(page, 'KTV', KTV)
    await toZone(page)
    await tabBtn(page, 'Tiêu chuẩn và checklist').click()
    await expect(page.getByRole('button', { name: 'Xem ảnh Home' })).toBeVisible()
    await expect(page.getByText('Tích checklist').first()).toBeVisible()
    await page.locator('input[type=checkbox]').first().check()
    await page.getByRole('button', { name: 'Quay lại' }).click()
    await page.locator('button.item', { hasText: 'Khu 3' }).first().click()
    await tabBtn(page, 'Tiêu chuẩn và checklist').click()
    await expect(page.locator('input[type=checkbox]').first()).toBeChecked()
  })

  test('M2-04 tích 2/5 → Chưa đạt, ở Con 3, KTV nhận thông báo, có nhãn giả lập', async ({ page }) => {
    await openAs(page, 'KTV', KTV)
    await toZone(page)
    expect(await submitWith(page, 2)).toBe(5)
    await expect(page.getByTestId('ai-result').getByText('Giả lập — Chưa nối AI thật')).toBeVisible()
    await expect(page.getByTestId('ai-result').getByText('Chưa đạt').first()).toBeVisible()
    await goTab(page, 'Hôm nay'); await openHomeItem(page, /dọn dẹp/i)
    await con(page, 'Cần dọn lại').click()
    await expect(page.getByTestId('redo-row')).toHaveCount(1)
    await expect(page.getByTestId('redo-row').getByText(/AI \(giả lập\)/).first()).toBeVisible()
    await goTab(page, 'Hôm nay'); await openHomeItem(page, /Thông báo/)
    await expect(page.getByText(/nhắc dọn lại/).first()).toBeVisible()
  })

  test('M2-05 tích 3/5 → Chờ kiểm tra; Lễ tân và Leader nhận thông báo', async ({ page }) => {
    await openAs(page, 'KTV', KTV)
    await toZone(page)
    await submitWith(page, 3)
    await expect(page.getByTestId('ai-result').getByText('Giả lập — Chưa nối AI thật')).toBeVisible()
    await goTab(page, 'Hôm nay'); await openHomeItem(page, /dọn dẹp/i)
    await con(page, 'Báo cáo đã gửi').click()
    await expect(page.getByTestId('sent-row').getByText('Chờ kiểm tra').first()).toBeVisible()
    for (const r of ['Lễ Tân', 'Leader/Manager'] as const) {
      await switchRole(page, r); await openHomeItem(page, /Thông báo/)
      await expect(page.getByText(/cần kiểm tra và nhắc/).first()).toBeVisible()
      await goTab(page, 'Hôm nay')
    }
  })

  test('M2-06 5/5 → AI phù hợp; điểm chỉ đổi khi Lễ tân bấm Đạt', async ({ page }) => {
    await openAs(page, 'KTV', KTV)
    await toZone(page)
    await submitWith(page, 5)
    await expect(page.getByTestId('ai-result').getByText('AI: phù hợp (giả lập)').first()).toBeVisible()
    await expect(page.getByTestId('ai-result').getByText('Giả lập — Chưa nối AI thật')).toBeVisible()
    await homeCleaning(page)
    const tile = () => page.locator('.deep', { hasText: 'Điểm hôm nay' }).first().innerText()
    const before = await tile()
    expect(before).toMatch(/0/)
    // thông báo kết quả cho KTV + Lễ tân + Leader
    await goTab(page, 'Hôm nay'); await openHomeItem(page, /Thông báo/)
    await expect(page.getByText(/AI phù hợp \(giả lập\)/).first()).toBeVisible()
    for (const r of ['Lễ Tân', 'Leader/Manager'] as const) {
      await switchRole(page, r); await openHomeItem(page, /Thông báo/)
      await expect(page.getByText(/AI phù hợp \(giả lập\)/).first()).toBeVisible()
      await goTab(page, 'Hôm nay')
    }
    await switchRole(page, 'Lễ Tân'); await openHomeItem(page, /dọn dẹp/i)
    await page.locator('.item', { hasText: KTV }).getByRole('button', { name: 'Đạt' }).first().click()
    await switchRole(page, 'KTV', KTV); await openHomeItem(page, /dọn dẹp/i)
    const after = await tile()
    expect(after).not.toBe(before)
    expect(after).toMatch(/2/)
  })

  test('M2-07 Làm lại: lý do đúng, báo cáo mới, cũ còn ở Con 2', async ({ page }) => {
    await openAs(page, 'KTV', KTV)
    await toZone(page); await submitWith(page, 2)
    await homeCleaning(page)
    await con(page, 'Cần dọn lại').click()
    await page.getByRole('button', { name: 'Lỗi và yêu cầu sửa' }).click()
    await expect(page.getByText(/AI \(giả lập\): mới tích 2\/5/).first()).toBeVisible()
    await page.getByRole('button', { name: 'Gửi ảnh mới' }).click()
    await page.locator('input[type=file]').first().setInputFiles(FAKE_PNG)
    await page.getByRole('button', { name: 'Gửi báo cáo' }).click()
    await expect(page.getByTestId('ai-result')).toBeVisible()
    await homeCleaning(page)
    await con(page, 'Báo cáo đã gửi').click()
    await expect(page.getByTestId('sent-row')).toHaveCount(2)
    expect(await page.getByText('Giả lập — Chưa nối AI thật').count()).toBeGreaterThanOrEqual(2)
  })

  test('M2-08 Không chỗ nào ghi AI là thật', async ({ page }) => {
    await openAs(page, 'KTV', KTV)
    await toZone(page); await submitWith(page, 3)
    await homeCleaning(page)
    await con(page, 'Báo cáo đã gửi').click()
    const txt = await page.locator('body').innerText()
    expect(txt.replace(/Chưa nối AI thật/g, '')).not.toMatch(/AI thật/)
    expect(txt).toContain('Giả lập — Chưa nối AI thật')
  })

  test('M2-09 KTV không gửi được khu của người khác', async ({ page }) => {
    await openAs(page, 'KTV', 'Ngọc')
    await openHomeItem(page, /dọn dẹp/i)
    await con(page, 'Nhiệm vụ của tôi').click()
    await con(page, 'Nhiệm vụ theo khu vực').click()
    // danh sách "của tôi" chỉ chứa khu của Ngọc (8, 10), không có khu 3 của Hiền
    await expect(page.locator('button.item', { hasText: 'Khu 3 ' })).toHaveCount(0)
    await expect(page.locator('button.item', { hasText: 'Khu 8' })).toHaveCount(1)
  })

  test('M2-10 Trống: Con 2 và Con 3 có Empty', async ({ page }) => {
    await openAs(page, 'KTV', KTV)
    await openHomeItem(page, /dọn dẹp/i)
    await con(page, 'Báo cáo đã gửi').click()
    await expect(page.getByText('Chưa có báo cáo nào được gửi')).toBeVisible()
    await page.getByRole('tab', { name: 'Cần dọn lại' }).click()
    await expect(page.getByText('Chưa có báo cáo nào cần làm lại')).toBeVisible()
  })

  test('M2-12 Lễ tân/Leader vẫn có chế độ kiểm tra Đạt/Chưa đạt', async ({ page }) => {
    await openAs(page, 'Lễ Tân')
    await openHomeItem(page, /dọn dẹp/i)
    await expect(page.getByText('Chờ kiểm tra ảnh')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Đạt' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Kiểm tra' }).first().click()
    await expect(page.getByRole('button', { name: 'Chưa đạt' })).toBeVisible()
  })
})
