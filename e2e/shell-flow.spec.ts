import { test, expect, type Page } from '@playwright/test';

/**
 * T1-B: shell, Esc, streak/XP thật, độ khó thích ứng, onboarding bằng Enter.
 * Dùng module dev của Vite (`/src/...`) trong page.evaluate để gieo dữ liệu vào IndexedDB.
 */

const MODULE_DB = '/src/core/storage/db.ts';
const MODULE_PROFILE = '/src/core/storage/repos/profileRepo.ts';
const MODULE_STREAK = '/src/core/gamification/streak.ts';
const MODULE_SAVER = '/src/core/adaptive/progressSaver.ts';

function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function seedProfile(
  page: Page,
  patch: { xp?: number; streakCount?: number; skillLevels?: Record<string, number>; onboardingDone?: boolean },
): Promise<void> {
  await page.evaluate(
    async (args) => {
      const { db } = await import(/* @vite-ignore */ args.mDb);
      const { createDefaultProfile } = await import(/* @vite-ignore */ args.mProfile);
      const { formatDateKey } = await import(/* @vite-ignore */ args.mStreak);
      const base = (await db.profile.get('me')) ?? createDefaultProfile();
      const streak =
        args.patch.streakCount === undefined
          ? base.streak
          : {
              ...base.streak,
              count: args.patch.streakCount,
              longest: args.patch.streakCount,
              lastActiveDay: formatDateKey(new Date()),
            };
      await db.profile.put({
        ...base,
        xp: args.patch.xp ?? base.xp,
        streak,
        skillLevels: { ...base.skillLevels, ...(args.patch.skillLevels ?? {}) },
      });
      if (args.patch.onboardingDone) await db.kv.put({ key: 'onboarding_done', value: true });
    },
    { mDb: MODULE_DB, mProfile: MODULE_PROFILE, mStreak: MODULE_STREAK, patch },
  );
}

async function gotoApp(page: Page, hash: string): Promise<void> {
  await page.goto(`/${hash}`, { waitUntil: 'networkidle' });
}

test.describe('T1-B · Esc không thoát game khi chưa hỏi (F1)', () => {
  test('1. V3: chọn span rồi Esc chỉ bỏ chọn, vẫn ở màn chơi', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await gotoApp(page, '#/play/v3');
    const firstWord = page.locator('.reading-prose span[role="button"]').first();
    await firstWord.click();
    const lock = page.getByRole('button', { name: /Khoá mục tiêu/ });
    await expect(lock).toBeEnabled();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    await expect(lock).toBeDisabled(); // span đã được bỏ chọn
    await expect(page.getByTestId('play-exit-confirm')).toHaveCount(0);
    expect(page.url()).toContain('#/play/v3');
    expect(errors).toEqual([]);
  });

  test('2. Esc lúc rảnh mở hộp xác nhận, mặc định "Chơi tiếp"; không điều hướng', async ({ page }) => {
    await gotoApp(page, '#/play/v3');
    await expect(page.getByTestId('play-level-chip')).toBeVisible();
    await page.waitForTimeout(300);

    await page.keyboard.press('Escape');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('play-exit-continue')).toBeFocused();
    expect(page.url()).toContain('#/play/v3');

    await page.keyboard.press('Enter'); // Enter trên "Chơi tiếp" => đóng hộp, ở lại
    await expect(dialog).toBeHidden();
    expect(page.url()).toContain('#/play/v3');
  });

  test('3. Esc khi hộp đang mở chỉ đóng hộp; "Thoát" về Hub; "Lưu và thoát" chạy saver của game', async ({ page }) => {
    await gotoApp(page, '#/play/v3');
    await page.waitForTimeout(300);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(page.url()).toContain('#/play/v3');

    // Chưa game nào đăng ký lưu giữa phiên => nhãn trung thực là "Thoát"
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('play-exit-confirm')).toHaveText('Thoát');
    await page.getByTestId('play-exit-continue').click();

    // Game đăng ký saver => "Lưu và thoát", saver chạy xong rồi mới rời màn
    await page.evaluate(async (m) => {
      const { registerProgressSaver } = await import(/* @vite-ignore */ m);
      (window as unknown as { __saved: number }).__saved = 0;
      registerProgressSaver(async () => {
        await new Promise((r) => setTimeout(r, 250));
        (window as unknown as { __saved: number }).__saved += 1;
      });
    }, MODULE_SAVER);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('play-exit-confirm')).toHaveText('Lưu và thoát');
    await page.getByTestId('play-exit-confirm').click();
    await expect(page).toHaveURL(/#\/hub$/);
    const saved = await page.evaluate(() => (window as unknown as { __saved: number }).__saved);
    expect(saved).toBe(1);
  });

  test('4. Nút X ở header cũng hỏi trước khi thoát và đủ 44 px ở 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoApp(page, '#/play/v3');
    const exit = page.getByTestId('play-exit');
    const mute = page.getByRole('button', { name: /âm thanh/ });
    for (const el of [exit, mute]) {
      const box = await el.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await exit.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(page.url()).toContain('#/play/v3');
  });
});

test.describe('T1-B · shell = Today, độ khó thích ứng, vòng Hôm nay', () => {
  test('shell đọc streak/XP thật và khớp với Hôm nay (desktop + mobile), nav là link', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoApp(page, '#/');
    await seedProfile(page, { xp: 1234, streakCount: 5, onboardingDone: true });
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.getByTestId('shell-streak')).toHaveText('5 ngày');
    await expect(page.getByTestId('shell-xp')).toContainText('1.234 XP');
    await expect(page.getByTestId('today-streak-badge')).toContainText('5 ngày');
    await expect(page.getByTestId('today-xp-badge')).toContainText('1.234 XP');

    const sideLinks = page.locator('aside nav').getByRole('link');
    await expect(sideLinks).toHaveCount(5);
    await expect(sideLinks.first()).toHaveAttribute('href', '#/');
    await expect(sideLinks.nth(1)).toHaveAttribute('href', '#/hub');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('shell-streak-mobile')).toContainText('5');
    await expect(page.getByTestId('shell-xp-mobile')).toContainText('1.234 XP');
    await expect(page.getByRole('navigation', { name: 'Điều hướng di động' }).getByRole('link')).toHaveCount(5);

    // cập nhật sống khi DB đổi, không cần reload
    await seedProfile(page, { xp: 2000 });
    await expect(page.getByTestId('shell-xp-mobile')).toContainText('2.000 XP');
    expect(errors).toEqual([]);
  });

  test('profile mới: không còn tên cứng; chip hiện Band ≈ x.x theo skillLevels và ?mode=', async ({ page }) => {
    await gotoApp(page, '#/');
    await expect(page.getByRole('heading', { name: 'Chào bạn · Hôm nay học gì?' })).toBeVisible();
    await expect(page.getByTestId('shell-streak')).toHaveText('0 ngày');

    await seedProfile(page, { skillLevels: { v3: 5 } });
    await gotoApp(page, '#/play/v3');
    await expect(page.getByTestId('play-level-chip')).toHaveText('Band ≈ 6.0 · Luyện');
    await expect(page.getByTestId('play-level-chip')).not.toContainText('Level');

    await gotoApp(page, '#/play/v3?mode=sprint');
    await expect(page.getByTestId('play-level-chip')).toHaveText('Band ≈ 6.0 · Tốc độ');
  });

  test('Hôm nay -> game -> về #/ ; việc đầu chạy được bằng Enter', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await gotoApp(page, '#/');
    await seedProfile(page, { onboardingDone: true });
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('today-plan-list')).toBeVisible();

    // Enter (không focus nút) mở việc đầu chưa xong, kèm cờ from=today
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/play\/[a-z0-9]+\?from=today&task=/);
    await expect(page.getByTestId('play-level-chip')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.getByTestId('play-exit-confirm').click();
    await expect(page).toHaveURL(/#\/$/);
    await expect(page.getByTestId('today-plan-list')).toBeVisible();

    // V1 mở từ Hôm nay: thoát về #/ chứ không về Hub
    await gotoApp(page, '#/play/v1?from=today');
    await page.waitForTimeout(300);
    await page.getByTestId('play-exit').click();
    await page.getByTestId('play-exit-confirm').click();
    await expect(page).toHaveURL(/#\/$/);

    // mở từ Hub: thoát về Hub
    await gotoApp(page, '#/play/v1');
    await page.getByTestId('play-exit').click();
    await page.getByTestId('play-exit-confirm').click();
    await expect(page).toHaveURL(/#\/hub$/);
    expect(errors).toEqual([]);
  });

  test('"Đổi bài" nhiều lần không ra game chưa sẵn sàng', async ({ page }) => {
    await gotoApp(page, '#/');
    await seedProfile(page, { onboardingDone: true });
    await page.reload({ waitUntil: 'networkidle' });
    const notReady = ['s1', 's2', 'x1'];
    for (let i = 0; i < 12; i++) {
      const swaps = page.locator('[data-testid^="today-swap-"]');
      await swaps.nth(i % (await swaps.count())).click();
      await page.waitForTimeout(80);
      for (const g of notReady) await expect(page.getByTestId(`today-task-${g}`)).toHaveCount(0);
    }
  });
});

test.describe('T1-B · Onboarding 4 bước chỉ bằng Enter', () => {
  test('Enter x4 trong ≤ 90 s, mặc định 30 phút, không gán tên cứng', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const t0 = Date.now();
    await gotoApp(page, '#/onboarding');
    await expect(page.getByRole('heading', { name: 'Chào mừng tới Lộ trình IELTS 8.0' })).toBeVisible();
    await expect(page.getByText('Bước 1 / 4')).toBeVisible();
    await expect(page.locator('#onboarding-display-name')).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Chọn mục tiêu Band & Thời lượng ngày' })).toBeVisible();
    await expect(page.getByTestId('onboarding-goal-15')).toBeVisible();
    await expect(page.getByTestId('onboarding-goal-90')).toHaveCount(0);

    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Thử loa và micro' })).toBeVisible();
    await expect(page.getByText('Bước 3 / 4')).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Định vị nhanh vốn từ học thuật' })).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/placement$/);
    expect((Date.now() - t0) / 1000).toBeLessThan(90);

    const saved = await page.evaluate(async (args) => {
      const { db } = await import(/* @vite-ignore */ args.mDb);
      const profile = await db.profile.get('me');
      const name = await db.kv.get('display_name');
      return { goal: profile?.dailyGoalMin, name: name?.value ?? null };
    }, { mDb: MODULE_DB });
    expect(saved).toEqual({ goal: 30, name: null });
    expect(errors).toEqual([]);
  });
});
