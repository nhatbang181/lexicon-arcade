import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
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

interface WordRow {
  id: string;
  headword: string;
}
const WORDS = (
  JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'public/data/vocab/words.json'), 'utf8')) as WordRow[]
)
  .filter((w) => /^[a-z]+$/.test(w.headword) && w.headword.length >= 6)
  .slice(0, 8);
const HEADWORD_BY_ID = new Map(WORDS.map((w) => [w.id, w.headword]));

/** Ghi thẻ đến hạn thẳng vào IndexedDB (DB `LexiconV3DB` do Dexie tạo khi mở trang lần đầu). */
async function seedDueCards(page: Page, ids: string[]): Promise<void> {
  await page.evaluate(async (itemIds) => {
    const now = Date.now();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('LexiconV3DB');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('cards', 'readwrite');
      for (const itemId of itemIds) {
        tx.objectStore('cards').put({
          id: `${itemId}#recall_meaning`,
          itemId,
          face: 'recall_meaning',
          due: now - 3_600_000,
          stability: 5,
          difficulty: 5,
          elapsed_days: 3,
          scheduled_days: 5,
          learning_steps: 0,
          reps: 3,
          lapses: 0,
          state: 2,
          last_review: now - 3 * 86_400_000,
          unlocked: true,
          starred: false,
          source: 'curriculum',
          createdAt: now - 10 * 86_400_000,
          streak: 1,
        });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, ids);
}

test('offline: mở V1 online, tắt mạng, tải lại, chơi 3 thẻ (service worker + cache lúc chạy)', async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  // Online: mở V1, chờ service worker nhận trang, nạp seed rồi chạy thử đến màn "Bắt đầu".
  await page.goto(`${server.url}#/play/v1`, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload({ waitUntil: 'networkidle' });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await seedDueCards(page, WORDS.map((w) => w.id));
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText(/Lượt chạy hôm nay: \d+ thẻ/)).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /^Bắt đầu/ }).click();
  await expect(page.getByTestId('v1-node')).toBeVisible();
  // Cho cache lúc chạy ghi xong (CacheFirst/SWR ghi sau khi trả phản hồi).
  await page.waitForTimeout(1500);
  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames).toEqual(expect.arrayContaining(['lexicon-chunks', 'lexicon-data']));

  // Offline: tải lại, chờ ≥ 3 s (lỗi nạp chunk chỉ hiện sau vài giây), V1 phải còn chơi được.
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  await expect(page.getByText('Thử lại')).toHaveCount(0);
  await expect(page.getByText('Failed to fetch dynamically imported module')).toHaveCount(0);
  await expect(page.getByText(/Lượt chạy hôm nay: \d+ thẻ/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /^Bắt đầu/ }).click();
  await expect(page.getByTestId('v1-node')).toBeVisible();

  const answered = new Set<string>();
  for (let i = 0; i < 3; i++) {
    const input = page.getByRole('textbox', { name: 'Gõ từ tiếng Anh' });
    await expect(input).toBeEnabled();
    const itemId = (await page.getByTestId('v1-node').getAttribute('data-item-id')) ?? '';
    const headword = HEADWORD_BY_ID.get(itemId);
    expect(headword, `thẻ ${itemId} phải là từ đã seed`).toBeTruthy();
    await input.fill(headword as string);
    await input.press('Enter');
    await expect(page.getByText('Chính xác!').first()).toBeVisible();
    answered.add(itemId);
    await page.keyboard.press('Enter');
    if (i < 2) await expect(page.getByTestId('v1-node')).toBeVisible();
  }
  expect(answered.size).toBe(3);

  // R1 cũng phải nạp lại được khi offline (chunk game đã vào cache lúc chạy sau lần mở online đầu).
  await context.setOffline(false);
  await page.goto(`${server.url}#/play/r1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  await expect(page.getByText('Thử lại')).toHaveCount(0);
  await expect(page.getByText('Failed to fetch dynamically imported module')).toHaveCount(0);

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

for (const leaveAfterMs of [50, 300]) {
  test(`X4 (bản build): rời #/legacy sau ${leaveAfterMs} ms, chunk chưa nạp xong, body ở #/ không pixelated`, async ({ browser }) => {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage();
    const rendering = (): Promise<string> => page.evaluate(() => getComputedStyle(document.body).imageRendering);
    await page.goto(`${server.url}#/hub`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      window.location.hash = '#/legacy';
    });
    await page.waitForTimeout(leaveAfterMs);
    await page.evaluate(() => {
      window.location.hash = '#/';
    });
    await page.waitForTimeout(4_000);
    expect(await rendering()).not.toBe('pixelated');
    await context.close();
  });
}
