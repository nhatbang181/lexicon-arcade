import { test, expect, type Page } from '@playwright/test';
import { startPreview } from '../scripts/qa/preview-server.mjs';

/**
 * KIEM-THU §2.2 mục 13 / LUAT P5: đo trên bản build production (`vite preview`), CPU ×4, mạng Fast 4G.
 *   LCP Hôm nay ≤ 2,5 s · INP khi thao tác ≤ 200 ms.
 * Số khung hình > 32 ms chỉ ghi lại (annotation), chưa chặn: máy dùng chung có thể làm nhiễu; phần
 * "30 s chơi V1" sẽ do juice.spec.ts đo khi có animation (đợt 4).
 */

const PORT = Number(process.env.PW_PORT ?? 5173) + 1000;
let server: Awaited<ReturnType<typeof startPreview>>;

test.beforeAll(async () => {
  test.setTimeout(180_000);
  server = await startPreview({ port: PORT });
});
test.afterAll(async () => {
  await server?.stop();
});

async function throttle(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 170,
    downloadThroughput: (9 * 1024 * 1024) / 8,
    uploadThroughput: (1.5 * 1024 * 1024) / 8,
  });
}

test('LCP Hôm nay ≤ 2,5 s (CPU ×4, Fast 4G, bản build)', async ({ browser }) => {
  test.setTimeout(60_000);
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    (window as unknown as { __lcp: number }).__lcp = 0;
    new PerformanceObserver((list) => {
      const last = list.getEntries().at(-1);
      if (last) (window as unknown as { __lcp: number }).__lcp = last.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await throttle(page);
  await page.goto(`${server.url}#/`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  // LCP chốt khi có tương tác đầu tiên; gõ phím trung tính để trình duyệt ngừng cập nhật.
  await page.keyboard.press('Shift');
  const lcp = await page.evaluate(() => (window as unknown as { __lcp: number }).__lcp);
  test.info().annotations.push({ type: 'lcp-ms', description: String(Math.round(lcp)) });
  expect(lcp, 'LCP phải đo được').toBeGreaterThan(0);
  expect(lcp).toBeLessThanOrEqual(2500);
  await context.close();
});

test('INP khi bấm tab Hub ≤ 200 ms và khung hình chậm được ghi lại', async ({ browser }) => {
  test.setTimeout(60_000);
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const w = window as unknown as { __maxEvent: number; __slowFrames: number };
    w.__maxEvent = 0;
    w.__slowFrames = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__maxEvent = Math.max(w.__maxEvent, e.duration);
    }).observe({ type: 'event', durationThreshold: 16, buffered: true } as PerformanceObserverInit);
    let prev = 0;
    const tick = (t: number): void => {
      if (prev && t - prev > 32) w.__slowFrames++;
      prev = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await throttle(page);
  await page.goto(`${server.url}#/hub`, { waitUntil: 'networkidle' });
  const tabs = page.getByRole('tab');
  const n = await tabs.count();
  expect(n, 'Hub phải có tab lọc').toBeGreaterThan(1);
  for (let i = 0; i < n; i++) {
    await tabs.nth(i).click();
    await page.waitForTimeout(150);
  }
  const { maxEvent, slowFrames } = await page.evaluate(() => {
    const w = window as unknown as { __maxEvent: number; __slowFrames: number };
    return { maxEvent: w.__maxEvent, slowFrames: w.__slowFrames };
  });
  test.info().annotations.push({ type: 'inp-ms', description: String(Math.round(maxEvent)) });
  test.info().annotations.push({ type: 'slow-frames>32ms', description: String(slowFrames) });
  expect(maxEvent).toBeLessThanOrEqual(200);
  await context.close();
});
