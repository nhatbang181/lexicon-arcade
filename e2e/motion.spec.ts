import { test, expect, type Page } from '@playwright/test';

/**
 * KIEM-THU §2.2 mục 10 (J8): prefers-reduced-motion.
 * Sau 600 ms ở Hôm nay, V1, R1 (chạy ở reduced-motion): 0 animation lặp vô hạn đang chạy,
 * 0 phần tử đang animate transform. Nợ đã biết ghi ở KNOWN_DEBT (đo 23/11/2026): số không được tăng.
 * Đặt MOTION_STRICT=1 để bỏ nợ.
 */

const ROUTES = [
  { name: 'today', hash: '#/' },
  { name: 'play-v1', hash: '#/play/v1' },
  { name: 'play-r1', hash: '#/play/r1' },
] as const;

// Nợ: route -> { infinite: số animation lặp vô hạn tối đa, transformAnims: số animation transform tối đa }
const KNOWN_DEBT: Record<string, { infinite: number; transformAnims: number }> = {};

interface MotionState {
  infinite: number;
  transformAnims: number;
  names: string[];
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
    return {
      infinite: infinite.length,
      transformAnims: transformAnims.length,
      names: [...new Set([...infinite, ...transformAnims].map(label))].slice(0, 8),
    };
  });
}

for (const route of ROUTES) {
  test(`reduced-motion: không animation lặp / transform · ${route.name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${route.hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);

    const state = await measure(page);
    test.info().annotations.push({ type: 'motion', description: JSON.stringify(state) });
    const debt = process.env.MOTION_STRICT ? { infinite: 0, transformAnims: 0 } : (KNOWN_DEBT[route.name] ?? { infinite: 0, transformAnims: 0 });
    expect(state.infinite, `animation lặp vô hạn: ${state.names.join(', ')}`).toBeLessThanOrEqual(debt.infinite);
    expect(state.transformAnims, `animation transform: ${state.names.join(', ')}`).toBeLessThanOrEqual(debt.transformAnims);
    expect(errors).toEqual([]);
  });
}

test('không bật reduced-motion thì cờ media là false (đối chứng)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#/', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
});

test('bộ đo phát hiện được animation lặp vô hạn và animation transform (đối chứng dương)', async ({ page }) => {
  await page.goto('/#/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const el = document.createElement('div');
    el.id = 'motion-probe';
    el.style.cssText = 'width:20px;height:20px;position:fixed;left:0;top:0';
    document.body.appendChild(el);
    el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(30px)' }], { duration: 400, iterations: Infinity });
  });
  const state = await measure(page);
  expect(state.infinite).toBeGreaterThanOrEqual(1);
  expect(state.transformAnims).toBeGreaterThanOrEqual(1);
});
