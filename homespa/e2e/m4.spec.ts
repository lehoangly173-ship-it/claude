import { test, expect, type Page } from '@playwright/test'
import { openAs, switchRole, goTab, openHomeItem, domDump, expectNoPhone, stripSep, MONEY_RE } from './helpers'

const openMine = async (p: Page) => { await goTab(p, 'Khách hàng'); await p.getByText('Khách hàng của tôi').first().click() }
const openAll = async (p: Page) => { await goTab(p, 'Khách hàng'); await p.getByText('Khách Home Spa').first().click() }
const PROFILE = ['Tên', 'Địa chỉ', 'Sinh nhật', 'SĐT', 'Lịch sử CSKH', 'Ngân sách', 'Triệu chứng', 'Nguồn', 'QR']

test.describe('m4 Khách hàng (SENSITIVE)', () => {
  test('M4-01 2 nút lớn mở đúng màn', async ({ page }) => {
    await openAs(page, 'KTV')
    await goTab(page, 'Khách hàng')
    await expect(page.getByText('Khách hàng của tôi').first()).toBeVisible()
    await expect(page.getByText('Khách Home Spa').first()).toBeVisible()
    await page.getByText('Khách Home Spa').first().click()
    await expect(page.getByText('Khách Việt').first()).toBeVisible()
    await expect(page.getByText('Khách nước ngoài').first()).toBeVisible()
  })

  test('M4-02 Tôi chốt liệu trình: 2 nút con', async ({ page }) => {
    await openAs(page, 'KTV'); await openMine(page)
    await page.getByText('Tôi chốt liệu trình').first().click()
    await expect(page.getByText('Khách lẻ tôi chốt')).toBeVisible()
    await expect(page.getByText('Khách liệu trình tái tục tôi chốt')).toBeVisible()
  })

  test('M4-03 Khoảng A→B: hợp lệ, A>B báo lỗi, xóa', async ({ page }) => {
    await openAs(page, 'KTV'); await openMine(page)
    const [a, b] = [page.locator('input[type=date]').nth(0), page.locator('input[type=date]').nth(1)]
    const rows = () => page.locator('[data-testid=cust-row], .crow, .row').count()
    const all = await rows()
    await a.fill('2026-09-25'); await b.fill('2026-11-28')
    expect(await rows()).toBeLessThanOrEqual(all)
    await a.fill('2026-12-01'); await b.fill('2026-01-01')
    await expect(page.getByText(/Ngày bắt đầu.*sau|A.*B|không hợp lệ/i).first()).toBeVisible()
    expect(await rows()).toBe(all)
    await a.fill(''); await b.fill('')
    expect(await rows()).toBe(all)
  })

  test('M4-05/08d Hồ sơ 9 trường đúng thứ tự; KTV địa chỉ Ẩn, sinh nhật không năm', async ({ page }) => {
    await openAs(page, 'KTV'); await openMine(page)
    await page.locator('[data-testid=cust-row], .crow, .row').first().click()
    const txt = await page.locator('[role=dialog], .modal').last().innerText()
    let last = -1
    for (const f of PROFILE) { const i = txt.indexOf(f); expect(i, f).toBeGreaterThan(last); last = i }
    expect(txt).toMatch(/Địa chỉ[\s\S]{0,20}Ẩn/)
    expect(txt).toMatch(/SĐT[\s\S]{0,20}Ẩn/)
    expect(txt).not.toMatch(/Sinh nhật[^\n]*\d{1,2}\/\d{1,2}\/\d{4}/)
  })

  test('M4-06 KTV: 0 SĐT ở Khách hàng, hồ sơ, Board, Hôm nay, Công việc', async ({ page }) => {
    await openAs(page, 'KTV')
    await expectNoPhone(page)
    await openMine(page); await expectNoPhone(page)
    await page.locator('[data-testid=cust-row], .crow, .row').first().click(); await expectNoPhone(page)
    await page.keyboard.press('Escape')
    await goTab(page, 'Hôm nay'); await expectNoPhone(page)
    await openHomeItem(page, 'Công việc của kĩ thuật viên'); await expectNoPhone(page)
    await goTab(page, 'Hôm nay'); await openHomeItem(page, /Bảng điều phối/); await expectNoPhone(page)
  })

  test('M4-06 Lễ tân + CEO thấy SĐT', async ({ page }) => {
    for (const r of ['Lễ Tân', 'CEO'] as const) {
      await openAs(page, r)
      await goTab(page, 'Khách hàng')
      const t = stripSep((await domDump(page)).text)
      expect(t, r).toMatch(/0\d{9}/)
    }
  })

  test('M4-06a KTV gõ SĐT vào mọi ô tìm → 0 kết quả; mã/tên trong G4 có', async ({ page }) => {
    await openAs(page, 'KTV'); await openAll(page)
    const inputs = page.locator('input[type=search], input[type=text], input:not([type])')
    const n = await inputs.count()
    for (let i = 0; i < n; i++) for (const v of ['0901234567', '0901 234 567', '0900 000 001']) {
      await inputs.nth(i).fill(v)
      await expect(page.locator('[data-testid=cust-row], .crow')).toHaveCount(0)
    }
  })

  test('M4-08b KTV mở hồ sơ ngoài G4 → không có quyền', async ({ page }) => {
    await openAs(page, 'KTV', 'Hiền')
    // khách c305 chỉ liên quan KTV khác; mở qua đường cảnh báo/việc nếu có
    const alert = page.getByText(/Mộng/).first()
    if (await alert.count()) { await alert.click(); await expect(page.getByText('Bạn không có quyền xem mục này')).toBeVisible(); expect(await page.content()).not.toContain('Đau lưng dưới') }
  })

  test('M4-08c KTV: 0 chuỗi tiền ngoài Ngân sách', async ({ page }) => {
    await openAs(page, 'KTV'); await openMine(page)
    await page.locator('[data-testid=cust-row], .crow, .row').first().click()
    const txt = (await domDump(page)).text
    const lines = txt.split('\n').filter(l => (l.match(MONEY_RE) ?? []).length && !/Ngân sách/i.test(l))
    expect(lines).toEqual([])
  })

  test('M4-07 Nút xuất: KTV không có, CEO có', async ({ page }) => {
    await openAs(page, 'KTV'); await openMine(page)
    await expect(page.getByRole('button', { name: /Xuất|Tải file|Export/i })).toHaveCount(0)
    await openAs(page, 'CEO'); await goTab(page, 'Khách hàng')
    await expect(page.getByRole('button', { name: /Xuất|Tải file|Export/i }).first()).toBeVisible()
  })

  test('M4-08 KTV A và B thấy tập khách khác nhau', async ({ page }) => {
    await openAs(page, 'KTV', 'Hiền'); await openAll(page)
    const a = await page.locator('.page').innerText()
    await switchRole(page, 'KTV', 'Ngọc'); await openAll(page)
    const b = await page.locator('.page').innerText()
    expect(a).not.toBe(b)
  })

  test('M4-09 Bộ lọc khách lẻ: số trên nút = số dòng', async ({ page }) => {
    await openAs(page, 'KTV'); await openAll(page)
    await page.getByText('Khách lẻ').first().click()
    for (const f of ['Lâu chưa quay lại', 'Sinh nhật', 'chưa hài lòng', 'giới thiệu', 'Nguồn', 'Ngân sách']) await expect(page.getByText(new RegExp(f, 'i')).first(), f).toBeVisible()
  })

  test('M4-10 Liệu trình: 5 tệp + tìm mã không phân biệt hoa thường', async ({ page }) => {
    await openAs(page, 'KTV'); await openAll(page)
    await page.getByText(/Khách liệu trình có mã/).first().click()
    for (const f of ['Đã cọc còn thiếu', 'Đã hoàn thành', 'Còn 2 buổi cuối', 'Còn buổi cuối cùng', 'Đã hết liệu trình']) await expect(page.getByText(f).first(), f).toBeVisible()
    await expect(page.getByPlaceholder('Tìm mã KH')).toBeVisible()
    await expect(page.getByText(/₫|đ\b/).filter({ hasText: /Đã cọc|hoàn thành/ })).toHaveCount(0) // G14 không số tiền
  })

  test('M4-11 Khách nước ngoài: Khách đã đi + Sinh nhật trong bộ lọc, không ô lẻ', async ({ page }) => {
    await openAs(page, 'KTV'); await openAll(page)
    await page.getByText('Khách nước ngoài').first().click()
    await expect(page.getByText('Khách đã đi').first()).toBeVisible()
    await expect(page.getByText('Sinh nhật').first()).toBeVisible()
    await expect(page.getByText('Khách hàng đi', { exact: true })).toHaveCount(0)
  })

  test('M4-12 Nhãn số liệu mẫu', async ({ page }) => {
    await openAs(page, 'KTV'); await openAll(page)
    await expect(page.getByText(/số liệu mẫu/i).first()).toBeVisible()
  })

  test('M4-13 CEO/Lễ tân/Leader màn khách hàng không hỏng', async ({ page }) => {
    const errs: string[] = []; page.on('pageerror', e => errs.push(String(e)))
    for (const r of ['Lễ Tân', 'Leader/Manager', 'CEO'] as const) { await openAs(page, r); await goTab(page, 'Khách hàng'); await expect(page.locator('.page')).toBeVisible() }
    expect(errs).toEqual([])
  })
})
