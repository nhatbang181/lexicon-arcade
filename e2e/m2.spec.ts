import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

const OUT_DIR = path.resolve(process.cwd(), 'e2e/screenshots/m2');

async function captureAllViewports(page: Page, slug: string): Promise<void> {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(250);
    const fullHeight = await page.evaluate(() =>
      Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    );
    await page.setViewportSize({
      width: vp.width,
      height: Math.max(vp.height, Math.min(fullHeight, 3200)),
    });
    const filePath = path.join(OUT_DIR, `${slug}-${vp.name}.png`);
    await page.screenshot({ path: filePath });
    expect(fs.existsSync(filePath)).toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
}

test.describe('M2 Reading Games: R1 TFNG Judge & R2 Headline Editor', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test('R1 (Judge + Passage Mode) & R2 (Headline Editor) load with 0 console errors and capture 3-viewport screenshots', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // 1. R1 TFNG Judge (Judge Mode + Passage Mode)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/play/r1', { waitUntil: 'networkidle' });
    await expect(page.getByText('R1 · TFNG Judge')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);

    // Capture 3 viewports for R1 (Judge Mode)
    await captureAllViewports(page, 'r1');

    // Switch to Passage Mode (if toggle button is visible) and verify no errors
    const passageModeBtn = page.getByRole('button', { name: /Passage Mode|Đủ dạng bài/i }).first();
    if (await passageModeBtn.isVisible().catch(() => false)) {
      await passageModeBtn.click();
      await page.waitForTimeout(300);
    }

    // 2. R2 Headline Editor (Per-paragraph mode & End-of-passage mode)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/play/r2', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('r2-headline-editor')).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByTestId('r2-headline-editor').getByText('R2 · Headline Editor'),
    ).toBeVisible();
    await page.waitForTimeout(400);

    // Select a heading via button in desktop Kho tít to show active newsroom state
    const firstHeadingBtn = page.getByTestId('r2-heading-iii');
    if (await firstHeadingBtn.isVisible().catch(() => false)) {
      await firstHeadingBtn.click();
      await page.waitForTimeout(200);
    }

    // Capture 3 viewports for R2
    await captureAllViewports(page, 'r2');

    // Switch to End-of-Passage mode (Level 8) and verify mode toggle works cleanly
    await page.getByTestId('r2-mode-end-passage').click();
    await expect(page.getByTestId('r2-submit-passage-btn')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
