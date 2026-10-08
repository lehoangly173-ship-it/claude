import { defineConfig } from 'vitest/config'
// Chỉ chạy unit test trong src/; e2e/ là của Playwright.
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } })
