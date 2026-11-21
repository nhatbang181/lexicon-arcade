import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

const OUT_DIR = path.resolve(process.cwd(), 'e2e/screenshots/m4');

async function captureAllViewports(page: Page, slug: string): Promise<void> {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(250);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      overflow.scrollWidth,
      `Horizontal overflow on ${slug} at ${vp.width}px (${overflow.scrollWidth} > ${overflow.clientWidth})`,
    ).toBeLessThanOrEqual(overflow.clientWidth + 2);

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

test.describe('M4 Writing: W1 Essay Lab (ChartRenderer + GradingPanel + Portfolio) & W2 Writing Sprints', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test('W1 Task 1 ChartRenderer, Task 2 + Portfolio, and W2 Overview Sprint pass with 0 errors and 6 screenshots', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('requestfailed', (req) => {
      failedRequests.push(`${req.method()} ${req.url()} (${req.failure()?.errorText ?? 'failed'})`);
    });
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon')) {
        failedRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    // -----------------------------------------------------------------------
    // 1. W1 Essay Lab — Task 1 ChartRenderer + 3 viewport screenshots
    // -----------------------------------------------------------------------
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/play/w1', { waitUntil: 'networkidle' });
    await expect(page.getByText(/Essay Lab/i).first()).toBeVisible({ timeout: 15_000 });

    // Switch to Task 1 Visual tab and open first prompt
    await page.getByRole('button', { name: /Task 1 · Visual/i }).click();
    await page.getByRole('button', { name: /Viết đề này/i }).first().click();

    // Verify ChartRenderer renders an SVG or table
    const chartFigure = page.getByTestId('chart-renderer');
    await expect(chartFigure).toBeVisible({ timeout: 15_000 });
    const hasSvgOrTable = await chartFigure.locator('svg, table').count();
    expect(hasSvgOrTable).toBeGreaterThan(0);

    await page.waitForTimeout(300);
    await captureAllViewports(page, 'w1');

    // -----------------------------------------------------------------------
    // 2. W1 Essay Lab — Task 2 + GradingPanel flow + #/portfolio
    // -----------------------------------------------------------------------
    await page.getByRole('button', { name: /Chọn đề khác/i }).click();
    await page.getByRole('button', { name: /Task 2 · Essay/i }).click();
    await page.getByRole('button', { name: /Viết đề này/i }).first().click();

    const essayBox = page.locator('textarea').last();
    await expect(essayBox).toBeVisible({ timeout: 10_000 });
    await essayBox.fill(
      'Debate over secondary school curricula increasingly centres on whether computer coding should be compulsory alongside mathematics and languages. While I agree that introductory computational thinking ought to be taught to all pupils during early secondary years, I contend that advanced programming should remain an elective subject. Learning structured problem-solving builds transferable analytical habits and narrows digital literacy gaps across socio-economic groups. However, forcing every teenager to take examined software courses risks crowding out arts, history, and practical crafts in finite timetables. In conclusion, schools should balance foundational digital competence with broad educational choice.',
    );

    // Move to self-check / grading stage
    const finishBtn = page.getByRole('button', { name: /Nộp bài|Tự chấm/i }).first();
    await expect(finishBtn).toBeEnabled();
    await finishBtn.click();

    // Check GradingPanel step is accessible (either directly or after advancing from self-check)
    const toClaudeBtn = page.getByRole('button', { name: /Chấm với Claude|Gói chấm|Tiếp tục/i }).first();
    if (await toClaudeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await toClaudeBtn.click();
    }
    const sampleBtn = page.getByRole('button', { name: /Dán kết quả mẫu/i }).first();
    if (await sampleBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await sampleBtn.click();
      await expect(page.getByText(/Band|TR\/TA|CC|LR|GRA/i).first()).toBeVisible({ timeout: 5_000 });
    }

    // Visit Writing Portfolio route
    await page.goto('/#/portfolio', { waitUntil: 'networkidle' });
    await expect(page.getByText(/Portfolio|Hồ sơ bài viết|Bài viết/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // -----------------------------------------------------------------------
    // 3. W2 Writing Sprints — Hub + Overview Sprint + 3 viewport screenshots
    // -----------------------------------------------------------------------
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/play/w2', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('w2-writing-sprints')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('w2-start-overview')).toBeVisible();
    await expect(page.getByTestId('w2-start-idea')).toBeVisible();
    await expect(page.getByTestId('w2-start-thesis')).toBeVisible();
    await expect(page.getByTestId('w2-start-cliche')).toBeVisible();
    await expect(page.getByTestId('w2-start-upgrade')).toBeVisible();

    // Start Overview Sprint
    await page.getByTestId('w2-start-overview').click();
    await expect(page.getByTestId('chart-renderer')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('w2-overview-input')).toBeVisible();

    // Write overview & submit for self-check
    await page
      .getByTestId('w2-overview-input')
      .fill(
        'Overall, all five regions expanded their renewable electricity share markedly between 2010 and 2024, while Nordvale stayed clearly ahead and Eastbay trailed behind.',
      );
    await page.getByTestId('w2-submit-btn').click();
    await expect(page.getByTestId('w2-selfcheck')).toBeVisible();

    // Tick first 3 checklist items
    const checkboxes = page.getByTestId('w2-selfcheck').locator('input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();
    await page.waitForTimeout(350);

    await captureAllViewports(page, 'w2');

    // Advance to round 2/6
    await page.getByTestId('w2-next-btn').click();
    await expect(page.getByTestId('w2-progress')).toHaveText('2/6');

    expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
    expect(pageErrors, `Page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(failedRequests, `Failed network requests: ${failedRequests.join('\n')}`).toEqual([]);
  });
});
