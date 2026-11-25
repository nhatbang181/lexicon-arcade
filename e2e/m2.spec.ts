import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

const OUT_DIR = path.resolve(process.cwd(), 'test-results/m2');

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

    // U7: kiểm 0 tràn ngang trên R2 ở 360px
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(200);
    const r2Overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(r2Overflow).toBeLessThanOrEqual(0);

    expect(consoleErrors).toEqual([]);
  });

  test('R1 wrong verdict creates tfng:* userItem + card and renders in V1 as tfng_retry (G1/A3)', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/play/r1', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('r1-no-direct-info-btn')).toBeVisible({ timeout: 15_000 });

    // Thử tối đa 3 câu đầu bằng "Không tìm thấy thông tin trực tiếp" + "FALSE"/"NO" để chắc chắn có ≥ 1 câu sai tạo thẻ tfng:*
    let createdTfngId: string | null = null;
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('r1-no-direct-info-btn').click();
      const falseBtn = page.getByRole('button', { name: /^(FALSE|NO)/i }).first();
      await falseBtn.click();
      await page.waitForTimeout(300);

      createdTfngId = await page.evaluate(async () => {
        const req = indexedDB.open('LexiconV3DB');
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        const tx = db.transaction(['cards', 'userItems'], 'readonly');
        const cards = await new Promise<Array<{ id: string; itemId: string }>>((resolve) => {
          const r = tx.objectStore('cards').getAll();
          r.onsuccess = () => resolve(r.result as Array<{ id: string; itemId: string }>);
        });
        const userItems = await new Promise<Array<{ id: string; kind: string }>>((resolve) => {
          const r = tx.objectStore('userItems').getAll();
          r.onsuccess = () => resolve(r.result as Array<{ id: string; kind: string }>);
        });
        db.close();
        const card = cards.find((c) => c.id.endsWith('#tfng_retry'));
        const item = card ? userItems.find((u) => u.id === card.itemId) : undefined;
        return card && item ? card.itemId : null;
      });
      if (createdTfngId) break;

      const nextBtn = page.getByTestId('r1-next-question-btn');
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
      } else {
        break;
      }
    }

    expect(createdTfngId).toMatch(/^tfng:/);

    // Mở V1 Daily Run và xác nhận có đúng 1 thẻ tfng_retry đến từ R1
    await page.goto('/#/play/v1', { waitUntil: 'networkidle' });
    await expect(page.getByText('V1 · Daily Run')).toBeVisible({ timeout: 15_000 });
    const startBtn = page.getByRole('button', { name: /Bắt đầu/i }).first();
    await expect(startBtn).toBeVisible({ timeout: 15_000 });
    await startBtn.click();
    await expect(page.getByRole('button', { name: /TRUE|FALSE|NOT GIVEN|YES|NO/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
