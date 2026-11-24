import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * KIEM-THU §2.2 mục 8 (D2): axe-core ở 2 theme cho Hôm nay, Hub, Cài đặt, V1, R1, W1.
 * Ngưỡng ĐẠT: 0 vi phạm mức serious/critical. Nợ đã biết (đo ngày 23/11/2026, sẽ trả ở T3-A/T3-C)
 * ghi ở KNOWN_DEBT: test chỉ cho phép số nút vi phạm KHÔNG TĂNG so với nợ; vi phạm mới là đỏ.
 * Đặt A11Y_STRICT=1 để bỏ nợ và đòi 0 vi phạm.
 */

const ROUTES = [
  { name: 'today', hash: '#/' },
  { name: 'hub', hash: '#/hub' },
  { name: 'settings', hash: '#/settings' },
  { name: 'play-v1', hash: '#/play/v1' },
  { name: 'play-r1', hash: '#/play/r1' },
  { name: 'play-w1', hash: '#/play/w1' },
] as const;
const THEMES = ['dark', 'light'] as const;

// Nợ: `${route}/${theme}` -> { luật axe: số node tối đa }, lấy số lớn hơn giữa project chromium và mobile
const CC = 'color-contrast';
const LCN = 'label-content-name-mismatch';
const SRF = 'scrollable-region-focusable';
const KNOWN_DEBT: Record<string, Record<string, number>> = {
  'today/dark': { [CC]: 6, [LCN]: 1 },
  'today/light': { [CC]: 6, [LCN]: 1 },
  'hub/dark': { [CC]: 6, [LCN]: 1 },
  'hub/light': { [CC]: 14, [LCN]: 1 },
  'settings/dark': { [CC]: 3, [LCN]: 1 },
  'settings/light': { [CC]: 8, [LCN]: 1 },
  'play-v1/dark': { [CC]: 3, [SRF]: 1 },
  'play-v1/light': { [CC]: 4, [SRF]: 1 },
  'play-r1/dark': { [CC]: 1, [SRF]: 1 },
  'play-r1/light': { [CC]: 6, [SRF]: 1 },
  'play-w1/dark': { [CC]: 120 },
  'play-w1/light': { [CC]: 123 },
};

async function setTheme(page: Page, theme: string): Promise<void> {
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await page.waitForTimeout(150);
}

for (const route of ROUTES) {
  for (const theme of THEMES) {
    test(`không vượt nợ axe (serious/critical) · ${route.name} · ${theme}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`/${route.hash}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      await setTheme(page, theme);

      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      const counts: Record<string, number> = {};
      for (const v of serious) counts[v.id] = v.nodes.length;
      test.info().annotations.push({ type: 'axe', description: JSON.stringify(counts) });

      const debt = process.env.A11Y_STRICT ? {} : (KNOWN_DEBT[`${route.name}/${theme}`] ?? {});
      const over = Object.entries(counts).filter(([id, n]) => n > (debt[id] ?? 0));
      expect(
        over.map(([id, n]) => `${id}: ${n} node (cho phép ${debt[id] ?? 0})`),
        `Vi phạm axe vượt nợ cho phép ở ${route.name}/${theme}`,
      ).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
