import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: process.env.EDUMONEY_WEB_URL || 'http://127.0.0.1:8081', browserName: 'chromium', launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] } },
  workers: 1,
  reporter: 'list',
});
