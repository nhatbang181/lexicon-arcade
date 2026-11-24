import { defineConfig, devices } from '@playwright/test';

// X3: nhiều worktree chạy song song → đổi cổng bằng PW_PORT (mặc định 5173).
// Local muốn dùng Chrome cài sẵn: PW_CHANNEL=chrome. CI (Linux) dùng Chromium của Playwright.
const port = Number(process.env.PW_PORT ?? 5173);
const baseURL = `http://127.0.0.1:${port}`;
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  // CI dùng máy chia sẻ: thử lại 1 lần cho test đo thời gian (LCP/INP) thay vì nới ngưỡng.
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL,
    headless: true,
    trace: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel } },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], channel },
      // Mobile chỉ chạy các spec về khả năng truy cập và chuyển động (tự dựng context riêng cho perf/offline).
      testMatch: /(a11y|motion)\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
