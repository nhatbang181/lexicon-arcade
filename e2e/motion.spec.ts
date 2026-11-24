import { test, expect, type Page } from '@playwright/test';

/**
 * KIEM-THU §2.2 mục 10 (J8): prefers-reduced-motion.
 * Sau 200 ms và 600 ms ở Hôm nay, V1, R1 (chạy ở reduced-motion):
 * - 0 animation lặp vô hạn đang chạy
 * - 0 phần tử đang animate transform
 * - 0 phần tử hiển thị có `getComputedStyle(el).transform` khác `none` (sau 200 ms)
 * Nợ đã biết ghi ở KNOWN_DEBT: số không được tăng. Đặt MOTION_STRICT=1 để bỏ nợ.
 * Ghi chú: Cài đặt "Giảm chuyển động" trong app chưa tồn tại ở SettingsScreen.tsx (đã ghi HANDOFF cho T3-C/T4-A).
 */

const ROUTES = [
  { name: 'today', hash: '#/' },
  { name: 'play-v1', hash: '#/play/v1' },
  { name: 'play-r1', hash: '#/play/r1' },
] as const;

// Nợ: route -> { infinite, transformAnims, transformed }
const KNOWN_DEBT: Record<string, { infinite: number; transformAnims: number; transformed: number }> = {};

interface MotionState {
  infinite: number;
  transformAnims: number;
  transformed: number;
  names: string[];
  transformedNames: string[];
}

async function measure(page: Page): Promise<MotionState> {
  return page.evaluate(() => {
    const running = document.getAnimations().filter((a) => a.playState === 'running');
    const infinite = running.filter((a) => a.effect?.getTiming().iterations === Infinity);
    const transformAnims = running.filter((a) => {
      const frames = (a.effect as KeyframeEffect | null)?.getKeyframes?.() ?? [];
      return frames.some((f) => 'transform' in f || 'translate' in f || 'scale' in f || 'rotate' in f);
    });
    const label = (a: Animation): string => {
      const t = (a.effect as KeyframeEffect | null)?.target as HTMLElement | null;
      return `${t?.tagName ?? '?'}.${(t?.className ?? '').toString().slice(0, 40)}`;
    };

    const transformedEls: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (el instanceof SVGElement) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      if (cs.transform && cs.transform !== 'none') {
        transformedEls.push(`${el.tagName}.${(el.className ?? '').toString().slice(0, 30)}=${cs.transform}`);
      }
    }

    return {
      infinite: infinite.length,
      transformAnims: transformAnims.length,
      transformed: transformedEls.length,
      names: [...new Set([...infinite, ...transformAnims].map(label))].slice(0, 8),
      transformedNames: transformedEls.slice(0, 8),
    };
  });
}

for (const route of ROUTES) {
  test(`reduced-motion: không animation lặp / transform sau 200 ms · ${route.name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${route.hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);

    const state200 = await measure(page);
    await page.waitForTimeout(350);
    const state600 = await measure(page);
    test.info().annotations.push({ type: 'motion-200ms', description: JSON.stringify(state200) });
    test.info().annotations.push({ type: 'motion-600ms', description: JSON.stringify(state600) });

    const debt = process.env.MOTION_STRICT
      ? { infinite: 0, transformAnims: 0, transformed: 0 }
      : (KNOWN_DEBT[route.name] ?? { infinite: 0, transformAnims: 0, transformed: 0 });
    for (const state of [state200, state600]) {
      expect(state.infinite, `animation lặp vô hạn: ${state.names.join(', ')}`).toBeLessThanOrEqual(debt.infinite);
      expect(state.transformAnims, `animation transform: ${state.names.join(', ')}`).toBeLessThanOrEqual(debt.transformAnims);
      expect(state.transformed, `transform khác none: ${state.transformedNames.join(', ')}`).toBeLessThanOrEqual(debt.transformed);
    }
    expect(errors).toEqual([]);
  });
}

test('không bật reduced-motion thì cờ media là false (đối chứng)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#/', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
});

test('bộ đo phát hiện được animation lặp vô hạn, animation transform và computed transform (đối chứng dương)', async ({ page }) => {
  await page.goto('/#/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const el = document.createElement('div');
    el.id = 'motion-probe';
    el.style.cssText = 'width:20px;height:20px;position:fixed;left:0;top:0;transform:translateX(12px)';
    document.body.appendChild(el);
    el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(30px)' }], { duration: 400, iterations: Infinity });
  });
  const state = await measure(page);
  expect(state.infinite).toBeGreaterThanOrEqual(1);
  expect(state.transformAnims).toBeGreaterThanOrEqual(1);
  expect(state.transformed).toBeGreaterThanOrEqual(1);
});
