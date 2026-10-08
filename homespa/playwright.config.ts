import { defineConfig } from '@playwright/test'

// Chạy trên bản build tĩnh (vite build → vite preview), cổng 4173.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 }, // điện thoại: menu Hôm nay là danh sách, không phải flymenu
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
