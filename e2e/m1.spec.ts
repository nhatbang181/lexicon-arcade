import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

const OUT_DIR = path.resolve(process.cwd(), 'e2e/screenshots/m1');

async function captureAllViewports(page: Page, slug: string): Promise<void> {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(200);
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

test.describe('M1 Full Flow: Onboarding -> Placement -> Today -> V1/V2/V3 -> Stats/Settings', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test('Complete M1 journey with 0 console errors and capture 3-viewport screenshots', async ({
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

    // 1. Onboarding 4 bước (Chào mừng, Mục tiêu, Thiết bị, Định vị)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/onboarding', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Chào mừng tới Lộ trình IELTS 8.0' })).toBeVisible();

    await page.getByTestId('onboarding-next-1').click();
    await expect(page.getByRole('heading', { name: 'Chọn mục tiêu Band & Thời lượng ngày' })).toBeVisible();

    await page.getByTestId('onboarding-goal-45').click();
    await page.getByTestId('onboarding-next-2').click();
    await expect(page.getByRole('heading', { name: 'Thử loa và micro' })).toBeVisible();
    await page.getByTestId('onboarding-next-3').click();
    await expect(page.getByRole('heading', { name: 'Định vị nhanh vốn từ học thuật' })).toBeVisible();

    await page.getByTestId('onboarding-start-placement').click();

    // 2. Placement Vocab (15 questions)
    await expect(page.getByText('Câu 1 / 15')).toBeVisible({ timeout: 10_000 });
    for (let q = 0; q < 15; q++) {
      await expect(page.getByText(`Câu ${q + 1} / 15`)).toBeVisible();
      await page.getByTestId(`placement-choice-${q % 4}`).click();
      await page.getByTestId('placement-next-btn').click();
    }

    await expect(page.getByTestId('placement-result')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('placement-estimated-band')).toContainText('Band');
    await page.getByTestId('placement-go-today').click();

    // 3. Today screen with generated plan including V1
    await expect(page.getByRole('heading', { name: 'Chào bạn · Hôm nay học gì?' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('today-plan-list')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('today-task-v1')).toBeVisible();
    await expect(page.getByTestId('today-start-v1')).toBeVisible();

    await captureAllViewports(page, 'today');

    // 4. V1 Daily Run
    await page.goto('/#/play/v1', { waitUntil: 'networkidle' });
    await expect(page.getByText('V1 · Daily Run')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);
    await captureAllViewports(page, 'v1');

    // 5. V2 Collocation Forge
    await page.goto('/#/play/v2', { waitUntil: 'networkidle' });
    await expect(page.getByText('V2 · Collocation Forge')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);
    await captureAllViewports(page, 'v2');

    // 6. V3 Paraphrase Radar
    await page.goto('/#/play/v3', { waitUntil: 'networkidle' });
    await expect(page.getByText('V3 · Paraphrase Radar')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);
    await captureAllViewports(page, 'v3');

    // 7. Stats screen verification
    await page.goto('/#/stats', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Thống kê & Tiến độ' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bộ sưu tập 12 Huy hiệu' })).toBeVisible();

    // 8. Settings backup button verification
    await page.goto('/#/settings', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Cài đặt hệ thống' })).toBeVisible();
    await expect(page.getByTestId('settings-export-backup')).toBeVisible();
    await expect(page.getByTestId('settings-import-backup')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
