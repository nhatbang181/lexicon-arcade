import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

const SCREENS = [
  { slug: 'today', hash: '#/', expectedHeading: 'Chào bạn · Hôm nay học gì?' },
  { slug: 'hub', hash: '#/hub', expectedHeading: '12 Chế độ luyện IELTS 8.0' },
  { slug: 'settings', hash: '#/settings', expectedHeading: 'Cài đặt hệ thống' },
  { slug: 'dev-components', hash: '#/dev/components', expectedHeading: 'Thư viện component chuẩn V3' },
] as const;

const OUT_DIR = path.resolve(process.cwd(), 'e2e/screenshots/m0');

test.describe('M0 App Shell · 3 viewports screenshots & 0 console errors', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test('Capture Today, Hub, Settings, /dev/components at 360/768/1280 with 0 console errors', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    for (const screen of SCREENS) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/${screen.hash}`, { waitUntil: 'networkidle' });
        await expect(page.getByRole('heading', { name: screen.expectedHeading })).toBeVisible();

        const fullHeight = await page.evaluate(() =>
          Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
        );
        await page.setViewportSize({
          width: vp.width,
          height: Math.max(vp.height, fullHeight),
        });

        const filePath = path.join(OUT_DIR, `${screen.slug}-${vp.name}.png`);
        await page.screenshot({ path: filePath });
        expect(fs.existsSync(filePath)).toBe(true);
      }
    }

    expect(consoleErrors).toEqual([]);
  });

  test('Verify #/legacy mounts cleanly with 0 console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/legacy', { waitUntil: 'networkidle' });

    await expect(page.getByText('Kho lưu trữ V1/V2 (Legacy Mode)')).toBeVisible();
    await expect(page.getByText('LEXICON ARCADE')).toBeVisible({ timeout: 15_000 });

    const legacyShot = path.join(OUT_DIR, 'legacy-1280.png');
    await page.screenshot({ path: legacyShot, fullPage: false });
    expect(fs.existsSync(legacyShot)).toBe(true);
    expect(consoleErrors).toEqual([]);
  });
});

test('X4: CSS legacy chỉ có hiệu lực ở #/legacy, rời route thì không rò sang V3', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  const bodyRendering = (): Promise<string> =>
    page.evaluate(() => getComputedStyle(document.body).imageRendering);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#/hub', { waitUntil: 'networkidle' });
  expect(await bodyRendering()).not.toBe('pixelated');

  // Vào kho legacy bằng điều hướng trong app (không tải lại trang): CSS legacy phải bật.
  await page.evaluate(() => {
    window.location.hash = '#/legacy';
  });
  await expect(page.getByText('LEXICON ARCADE')).toBeVisible({ timeout: 15_000 });
  expect(await bodyRendering()).toBe('pixelated');

  // Quay về V3 cũng bằng điều hướng trong app: không còn pixelated.
  await page.getByRole('button', { name: /Về Lexicon V3/ }).click();
  await expect(page.getByRole('heading', { name: 'Cài đặt hệ thống' })).toBeVisible({ timeout: 10_000 });
  // Màn legacy còn chạy hiệu ứng thoát vài trăm ms trước khi unmount nên chờ có thời hạn.
  await expect.poll(bodyRendering, { timeout: 5_000 }).not.toBe('pixelated');

  // Vào lại legacy lần 2: CSS bật lại (không bị kẹt ở trạng thái đã tắt).
  await page.evaluate(() => {
    window.location.hash = '#/legacy';
  });
  await expect(page.getByText('LEXICON ARCADE')).toBeVisible({ timeout: 15_000 });
  expect(await bodyRendering()).toBe('pixelated');
  expect(consoleErrors).toEqual([]);
});

for (const leaveAfterMs of [50, 300]) {
  test(`X4: rời #/legacy sau ${leaveAfterMs} ms (chunk legacy chưa nạp xong) vẫn không rò CSS sang V3`, async ({ page }) => {
    const bodyRendering = (): Promise<string> =>
      page.evaluate(() => getComputedStyle(document.body).imageRendering);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/hub', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      window.location.hash = '#/legacy';
    });
    await page.waitForTimeout(leaveAfterMs);
    await page.evaluate(() => {
      window.location.hash = '#/';
    });
    await expect(page.getByRole('heading', { name: 'Chào bạn · Hôm nay học gì?' })).toBeVisible({ timeout: 10_000 });
    // Chunk legacy nạp xong muộn sau khi đã rời: chờ đủ lâu để CSS của nó kịp chèn vào <head>.
    await page.waitForTimeout(4_000);
    expect(await bodyRendering()).not.toBe('pixelated');
    expect(
      await page.evaluate(
        () => Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).filter((l) => l.href.includes('legacyEntry') && !l.disabled).length,
      ),
    ).toBe(0);
  });
}
