import { test, expect, type Page } from '@playwright/test'
import { openAs, switchRole, openHomeItem, goTab } from './helpers'

const KINDS = ['Ý kiến về cơ sở vật chất', 'Nhân sự / cấp trên', 'Khách hàng – dịch vụ', 'Ý kiến khác']
const today = () => { const d = new Date(); const z = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}` }

async function send(page: Page, kind: string, text: string) {
  await page.getByRole('button', { name: new RegExp(kind) }).click()
  await page.getByRole('textbox').first().fill(text)
  await page.getByRole('button', { name: 'Gửi', exact: true }).click()
}

test.describe('m3 góp ý / sáng kiến', () => {
  test('M3-01 4 loại đúng thứ tự', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, 'Sáng kiến phát triển Home Spa')
    const txt = await page.locator('.page').innerText()
    let last = -1
    for (const k of KINDS) { const i = txt.indexOf(k); expect(i, k).toBeGreaterThan(last); last = i }
  })

  test('M3-02/03 Gửi khóa khi rỗng; ngày mặc định hôm nay, không chọn tương lai', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, 'Sáng kiến phát triển Home Spa')
    for (const k of KINDS) {
      await page.getByRole('button', { name: new RegExp(k) }).click()
      const send = page.getByRole('button', { name: 'Gửi', exact: true })
      await expect(send).toBeDisabled()
      await page.getByRole('textbox').first().fill('   ')
      await expect(send).toBeDisabled()
      const date = page.locator('input[type=date]')
      await expect(date).toHaveValue(today())
      const max = await date.getAttribute('max')
      expect(max).toBe(today())
      await date.fill('')
      await page.getByRole('textbox').first().fill('abc')
      await expect(send).toBeDisabled()
      await date.fill(today())
      await expect(send).toBeEnabled()
      await page.getByRole('button', { name: /Quay lại/ }).first().click()
      await openHomeItem(page, 'Sáng kiến phát triển Home Spa')
    }
  })

  test('M3-04/07 Gửi 4 loại: xuất hiện ngay, form xóa, Chưa nối điểm uy tín', async ({ page }) => {
    await openAs(page, 'KTV')
    await openHomeItem(page, 'Sáng kiến phát triển Home Spa')
    for (const [i, k] of KINDS.entries()) {
      await send(page, k, `Ý kiến thử ${i}`)
      await expect(page.getByText('Đã gửi').first()).toBeVisible()
      await expect(page.getByText(/Chưa nối: điểm uy tín từ sáng kiến/).first()).toBeVisible()
      await expect(page.getByText(`Ý kiến thử ${i}`).first()).toBeVisible()
    }
  })

  test('M3-05 KTV khác không thấy; CEO thấy cả; Leader chỉ đọc', async ({ page }) => {
    await openAs(page, 'KTV', 'Hiền')
    await openHomeItem(page, 'Sáng kiến phát triển Home Spa')
    await send(page, KINDS[0], 'HIEN-loai1')
    await switchRole(page, 'KTV', 'Lan')
    await openHomeItem(page, 'Sáng kiến phát triển Home Spa')
    await expect(page.getByText('HIEN-loai1')).toHaveCount(0)
    await switchRole(page, 'CEO')
    await expect(page.getByText('HIEN-loai1').first()).toBeVisible().catch(async () => { await openHomeItem(page, /Ý kiến KTV/); await expect(page.getByText('HIEN-loai1').first()).toBeVisible() })
    await switchRole(page, 'Leader/Manager')
    await openHomeItem(page, /Ý kiến KTV/)
    await expect(page.getByText('HIEN-loai1').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Sửa|Xóa/ })).toHaveCount(0)
  })

  test('M3-05a (bảo mật) loại 2: chỉ người gửi + CEO', async ({ page }) => {
    await openAs(page, 'KTV', 'Hiền')
    await openHomeItem(page, 'Sáng kiến phát triển Home Spa')
    await send(page, KINDS[1], 'BI-MAT-loai2')
    await expect(page.getByText('BI-MAT-loai2').first()).toBeVisible()
    await switchRole(page, 'KTV', 'Lan')
    await openHomeItem(page, 'Sáng kiến phát triển Home Spa')
    expect(await page.content()).not.toContain('BI-MAT-loai2')
    await switchRole(page, 'Leader/Manager')
    expect(await page.content()).not.toContain('BI-MAT-loai2')
    await openHomeItem(page, /Ý kiến KTV/).catch(() => {})
    expect(await page.content()).not.toContain('BI-MAT-loai2')
    await switchRole(page, 'Lễ Tân')
    expect(await page.content()).not.toContain('BI-MAT-loai2')
    await switchRole(page, 'CEO')
    await openHomeItem(page, /Ý kiến KTV/).catch(() => {})
    await expect(page.getByText('BI-MAT-loai2').first()).toBeVisible()
  })

  test('M3-06 Lễ tân không có đường vào', async ({ page }) => {
    await openAs(page, 'Lễ Tân')
    await expect(page.getByRole('button', { name: /Ý kiến KTV|Sáng kiến phát triển/ })).toHaveCount(0)
    await goTab(page, 'Hôm nay')
  })

  test('M3-07 Điểm uy tín không đổi sau khi gửi', async ({ page }) => {
    await openAs(page, 'KTV', 'Hiền')
    await goTab(page, 'Của tôi')
    const before = await page.locator('.page').innerText()
    await goTab(page, 'Hôm nay')
    await openHomeItem(page, 'Sáng kiến phát triển Home Spa')
    await send(page, KINDS[3], 'diem-khong-doi')
    await goTab(page, 'Của tôi')
    const pts = (s: string) => (s.match(/(\d+)\s*điểm/i) ?? [])[1]
    expect(pts(await page.locator('.page').innerText())).toBe(pts(before))
  })
})
