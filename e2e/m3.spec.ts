import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

const OUT_DIR = path.resolve(process.cwd(), 'e2e/screenshots/m3');

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

test.describe('M3 Listening Games: L1 Trap Detector & L2 Dictation Ladder', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test('L1 & L2 load with 0 console errors, exercise L2 dictation diff, and capture 6 viewport screenshots', async ({
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

    // 1. L1 Trap Detector
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/play/l1', { waitUntil: 'networkidle' });
    await expect(page.getByText(/Trap Detector/i).first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);
    await captureAllViewports(page, 'l1');

    // 2. L2 Dictation Ladder — Intro + Ladder + Playing + Diff
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/play/l2', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('l2-dictation-ladder')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('l2-ladder-rail')).toBeVisible();

    // Start session at Level 1
    await page.getByTestId('l2-start-btn').click();
    await expect(page.getByTestId('l2-play-btn')).toBeVisible();
    await expect(page.getByTestId('l2-answer-input')).toBeVisible();

    // Type a partial answer to trigger diff + focus tips view, then capture 3 viewports for L2
    await page.getByTestId('l2-answer-input').fill('The library open at nine every morning');
    await page.getByTestId('l2-submit-btn').click();
    await expect(page.getByTestId('l2-graded-panel')).toBeVisible();
    await expect(page.getByTestId('l2-diff-view')).toBeVisible();
    await expect(page.getByTestId('l2-focus-tips')).toBeVisible();
    await page.waitForTimeout(450);

    await captureAllViewports(page, 'l2');

    // Advance to Q2 to verify session progression
    await page.getByTestId('l2-next-btn').click();
    await expect(page.getByTestId('l2-progress-counter')).toHaveText('2/10');

    expect(consoleErrors).toEqual([]);
  });
});
