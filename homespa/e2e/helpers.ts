import { expect, type Page } from '@playwright/test'

export type RoleName = 'KTV' | 'Lễ Tân' | 'Leader/Manager' | 'CEO'

/** Mở app, chọn vai trò bằng dải "Demo — chuyển vai trò"; staff = tên KTV/Lễ tân (ô "Xem với người"). */
export async function openAs(page: Page, role: RoleName, staff?: string) {
  await page.goto('/')
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch {} })
  await page.reload()
  await expect(page.getByText('Demo — chuyển vai trò')).toBeVisible()
  await switchRole(page, role, staff)
}

export async function switchRole(page: Page, role: RoleName, staff?: string) {
  await page.locator('.rchip', { hasText: new RegExp(`^${role}$`) }).click()
  if (staff) await page.getByLabel('Xem với người').selectOption({ label: staff })
}

export const tab = (page: Page, name: string) => page.locator('nav, .tabbar, [role=tablist]').getByText(name, { exact: true }).first()
export const goTab = (page: Page, name: string) => tab(page, name).click()

/** Từ tab Hôm nay bấm nút mẹ theo chữ. */
export async function openHomeItem(page: Page, text: string | RegExp) {
  await page.getByRole('button', { name: text }).first().click()
}

/** Gom lỗi console/pageerror. */
export function watchErrors(page: Page) {
  const errs: string[] = []
  page.on('pageerror', e => errs.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  return errs
}

/** Toàn bộ text + thuộc tính của DOM, để dò dữ liệu nhạy cảm. */
export async function domDump(page: Page): Promise<{ text: string; attrs: string }> {
  return page.evaluate(() => {
    const text = document.body.innerText
    const attrs: string[] = []
    document.querySelectorAll('*').forEach(el => {
      for (const a of Array.from(el.attributes)) if (/^(title|aria-label|value|href|data-.*|placeholder|alt)$/.test(a.name)) attrs.push(a.value)
      if ((el as HTMLInputElement).value) attrs.push((el as HTMLInputElement).value)
    })
    return { text, attrs: attrs.join('\n') }
  })
}

export const PHONE_RE = /(\+?84|0)\d{9}/
export const stripSep = (s: string) => s.replace(/[\s.\-]/g, '')
/** SĐT mẫu hiện có (R8: sau m4 đổi thành 0900 000 0xx) — kiểm cả số cũ lẫn số mới. */
export const SAMPLE_PHONES = ['0901234567', '0912345678', '0933777888', '0909333444', '0900000001', '0900000002']
export async function expectNoPhone(page: Page) {
  const { text, attrs } = await domDump(page)
  expect(stripSep(text), 'text chứa SĐT').not.toMatch(PHONE_RE)
  expect(stripSep(attrs), 'thuộc tính chứa SĐT').not.toMatch(PHONE_RE)
  expect(attrs).not.toMatch(/tel:/)
  for (const p of SAMPLE_PHONES) { expect(stripSep(text)).not.toContain(p); expect(stripSep(attrs)).not.toContain(p) }
}
export const MONEY_RE = /\d[\d.,]*\s?(đ|₫|VND)/g
