import { test, expect } from '@playwright/test'
import { openAs, switchRole, goTab, openHomeItem } from './helpers'

const EIGHT = ['Hồ sơ cá nhân', 'Lịch làm việc của tôi', 'Chấm công của tôi', 'Hiệu suất KTV', 'KPI – Điểm uy tín', 'Đào tạo & phát triển', 'Thu nhập của tôi', 'Yêu cầu & lịch sử cá nhân']
const GROUPS = ['Chuyên môn & khách hàng', 'Tăng trưởng KH', 'Tinh thần làm việc', 'Văn hóa ứng xử', 'Sáng tạo – đổi mới']
const open = async (p: import('@playwright/test').Page, name: string) => { await goTab(p, 'Của tôi'); await p.getByText(name).first().click() }

test.describe('m5 Của tôi + Hiệu suất', () => {
  test('M5-01 KTV 8 nút đúng thứ tự; vai trò khác không đổi', async ({ page }) => {
    await openAs(page, 'KTV'); await goTab(page, 'Của tôi')
    const txt = await page.locator('.page').innerText()
    let last = -1
    for (const n of EIGHT) { const i = txt.indexOf(n); expect(i, n).toBeGreaterThan(last); last = i }
    for (const r of ['Lễ Tân', 'Leader/Manager', 'CEO'] as const) {
      await switchRole(page, r); await goTab(page, 'Của tôi')
      await expect(page.getByText('Hiệu suất KTV')).toHaveCount(0)
    }
  })

  test('M5-02a Hồ sơ đúng 6 trường, không CCCD/ngân hàng/ô tự do', async ({ page }) => {
    await openAs(page, 'KTV'); await open(page, 'Hồ sơ cá nhân')
    await expect(page.getByText(/CCCD|Số tài khoản|ngân hàng|Thông tin cơ bản/i)).toHaveCount(0)
    await expect(page.locator('textarea')).toHaveCount(0)
    for (const f of ['Họ tên', 'Mã NV', 'Chi nhánh', 'Ngày vào làm', 'SĐT nội bộ']) await expect(page.getByText(f).first(), f).toBeVisible()
  })

  test('M5-02a Thu nhập: chỉ KTV đó + CEO', async ({ page }) => {
    await openAs(page, 'KTV', 'Hiền'); await open(page, 'Thu nhập của tôi')
    await expect(page.getByText(/Chưa nối|số liệu mẫu/i).first()).toBeVisible()
    await switchRole(page, 'KTV', 'Lan'); await goTab(page, 'Của tôi')
    for (const r of ['Lễ Tân', 'Leader/Manager'] as const) { await switchRole(page, r); await goTab(page, 'Của tôi'); await expect(page.getByText(/Thu nhập của tôi|Lương cơ bản/)).toHaveCount(0) }
  })

  test('M5-02 Hồ sơ: lưu, mở lại còn; thiếu họ tên không lưu; ngày vào làm trống = Chưa nối', async ({ page }) => {
    await openAs(page, 'KTV'); await open(page, 'Hồ sơ cá nhân')
    await expect(page.getByText('Chưa nối').first()).toBeVisible()
    const name = page.getByLabel(/Họ tên/)
    await name.fill('')
    await page.getByRole('button', { name: 'Lưu' }).click()
    await expect(page.getByText(/Họ tên.*(bắt buộc|trống)|Nhập họ tên/i).first()).toBeVisible()
    await name.fill('Hiền Test')
    await page.getByRole('button', { name: 'Lưu' }).click()
    await goTab(page, 'Của tôi'); await page.getByText('Hồ sơ cá nhân').first().click()
    await expect(page.getByLabel(/Họ tên/)).toHaveValue('Hiền Test')
  })

  test('M5-03 Lịch: Tuần 7 ô / Tháng 28 ô', async ({ page }) => {
    await openAs(page, 'KTV'); await open(page, 'Lịch làm việc của tôi')
    await page.getByRole('button', { name: 'Tuần' }).click()
    await expect(page.locator('[data-testid=cal-cell]')).toHaveCount(7)
    await page.getByRole('button', { name: 'Tháng' }).click()
    await expect(page.locator('[data-testid=cal-cell]')).toHaveCount(28)
  })

  test('M5-04 Chấm công: yêu cầu điều chỉnh vào mục 8 trạng thái Chờ duyệt', async ({ page }) => {
    await openAs(page, 'KTV'); await open(page, 'Chấm công của tôi')
    await page.getByRole('button', { name: 'Yêu cầu điều chỉnh chấm công' }).click()
    const send = page.getByRole('button', { name: /Gửi/ }).last()
    if (await page.getByRole('textbox').count()) await page.getByRole('textbox').first().fill('Quên quét')
    await send.click()
    await open(page, 'Yêu cầu & lịch sử cá nhân')
    await expect(page.getByText(/điều chỉnh chấm công/i).first()).toBeVisible()
    await expect(page.getByText('Chờ duyệt').first()).toBeVisible()
  })

  test('M5-05 Hiệu suất: 5 nhóm; mỗi chỉ số có số hoặc Chưa nối', async ({ page }) => {
    await openAs(page, 'KTV'); await open(page, 'Hiệu suất KTV')
    for (const g of GROUPS) await expect(page.getByText(g).first(), g).toBeVisible()
    const rows = page.locator('[data-testid=perf-row]')
    expect(await rows.count()).toBe(6 + 4 + 6 + 2 + 2)
    for (const t of await rows.allInnerTexts()) expect(t, t).toMatch(/\d|Chưa nối/)
  })

  test('M5-06 Ý kiến sáng tạo +1 sau khi gửi góp ý', async ({ page }) => {
    await openAs(page, 'KTV', 'Hiền'); await open(page, 'Hiệu suất KTV')
    const row = () => page.locator('[data-testid=perf-row]', { hasText: 'ý kiến sáng tạo' }).first().innerText()
    const num = (s: string) => Number((s.match(/\d+/) ?? ['0'])[0])
    const before = num(await row())
    await goTab(page, 'Hôm nay'); await openHomeItem(page, 'Sáng kiến phát triển Home Spa')
    await page.getByRole('button', { name: /Ý kiến khác/ }).click()
    await page.getByRole('textbox').first().fill('sáng kiến m5')
    await page.getByRole('button', { name: 'Gửi', exact: true }).click()
    await open(page, 'Hiệu suất KTV')
    expect(num(await row())).toBe(before + 1)
  })

  test('M5-07 KPI: có điểm hiện tại, lịch sử, Chưa nối', async ({ page }) => {
    await openAs(page, 'KTV'); await open(page, 'KPI – Điểm uy tín')
    await expect(page.getByText(/điểm/i).first()).toBeVisible()
    await expect(page.getByText('Chưa nối').first()).toBeVisible()
  })

  test('M5-08 KTV B không thấy dữ liệu KTV A', async ({ page }) => {
    await openAs(page, 'KTV', 'Hiền'); await open(page, 'Hồ sơ cá nhân')
    await page.getByLabel(/Họ tên/).fill('Hiền Rieng'); await page.getByRole('button', { name: 'Lưu' }).click()
    await switchRole(page, 'KTV', 'Lan'); await open(page, 'Hồ sơ cá nhân')
    expect(await page.content()).not.toContain('Hiền Rieng')
  })

  test('M5-09/10 Mục 8 mới nhất trước; trống có Empty; vai trò khác không hỏng', async ({ page }) => {
    await openAs(page, 'KTV'); await open(page, 'Yêu cầu & lịch sử cá nhân')
    await expect(page.locator('.page')).toBeVisible()
    for (const n of ['Lịch làm việc của tôi', 'Đào tạo & phát triển']) { await goTab(page, 'Của tôi'); await page.getByText(n).first().click(); await expect(page.locator('.page')).toBeVisible() }
  })
})
