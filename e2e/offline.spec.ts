import { test, expect } from '@playwright/test';
import { startPreview } from '../scripts/qa/preview-server.mjs';

/**
 * KIEM-THU §2.2 mục 14 (X7): mở V1 một lần → setOffline(true) → tải lại → V1 vẫn mở được.
 * Chạy trên bản build production (`vite preview`, có service worker), cổng PW_PORT + 1000.
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

test('offline: V1 mở lại được sau khi đã nạp một lần (service worker + cache lúc chạy)', async ({ browser }) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto(`${server.url}#/play/v1`, { waitUntil: 'networkidle' });
  await expect(page.getByText('V1 · Daily Run')).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  // Tải lại một lần nữa để mọi tài nguyên đi qua service worker và vào cache lúc chạy.
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText('V1 · Daily Run')).toBeVisible({ timeout: 15_000 });
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('V1 · Daily Run')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Thử lại')).toHaveCount(0);

  await context.setOffline(false);
  await context.close();
  expect(
    errors.filter((e) => !/Failed to load resource|net::ERR_INTERNET_DISCONNECTED/.test(e)).map((e) => e.slice(0, 200)),
  ).toEqual([]);
});

test('manifest PWA: lang vi, đủ icon 192/512/maskable', async ({ request }) => {
  const res = await request.get(`${server.url}manifest.webmanifest`);
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.lang).toBe('vi');
  const sizes = manifest.icons.map((i: { sizes: string; purpose?: string }) => `${i.sizes}:${i.purpose ?? 'any'}`);
  expect(sizes).toEqual(expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable']));
  for (const icon of manifest.icons as { src: string }[]) {
    const r = await request.get(`${server.url}${icon.src}`);
    expect(r.ok(), icon.src).toBe(true);
  }
});

test('X4 (bản build): CSS legacy là chunk riêng, tắt khi rời #/legacy', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  const rendering = (): Promise<string> => page.evaluate(() => getComputedStyle(document.body).imageRendering);
  await page.goto(`${server.url}#/hub`, { waitUntil: 'networkidle' });
  expect(await rendering()).not.toBe('pixelated');
  await page.evaluate(() => {
    window.location.hash = '#/legacy';
  });
  await expect(page.getByText('LEXICON ARCADE')).toBeVisible({ timeout: 15_000 });
  expect(await rendering()).toBe('pixelated');
  await page.getByRole('button', { name: /Về Lexicon V3/ }).click();
  await expect.poll(rendering, { timeout: 5_000 }).not.toBe('pixelated');
  await context.close();
});
