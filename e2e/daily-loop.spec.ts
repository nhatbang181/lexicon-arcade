import { test, expect, type Page } from '@playwright/test';

const MODULE_DB = '/src/core/storage/db.ts';
const MODULE_PROFILE = '/src/core/storage/repos/profileRepo.ts';
const MODULE_BACKUP = '/src/core/storage/backup.ts';
const MODULE_FSRS = '/src/core/srs/fsrsAdapter.ts';

function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function gotoApp(page: Page, hash: string): Promise<void> {
  await page.goto(`/${hash}`, { waitUntil: 'networkidle' });
}

test.describe('T3-C · Vòng lặp ngày, Hub Sheet, Thống kê, Cài đặt & Sao lưu Gộp', () => {
  test('1. Hôm nay: Việc tiếp theo ở đầu, Ngày bận, Giữ chuỗi 5p, 4 mạch học và vào việc đầu', async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await gotoApp(page, '#/');

    await page.evaluate(
      async ({ mDb, mProfile, mFsrs }) => {
        const { db } = await import(/* @vite-ignore */ mDb);
        const { createDefaultProfile } = await import(/* @vite-ignore */ mProfile);
        const { createNewCard } = await import(/* @vite-ignore */ mFsrs);
        const prof = createDefaultProfile();
        prof.xp = 260;
        prof.dailyGoalMin = 30;
        await db.profile.put(prof);
        await db.kv.put({ key: 'onboarding_done', value: true });
        await db.cards.put(createNewCard('vocab:analyze', 'recog', { unlocked: true }));
      },
      { mDb: MODULE_DB, mProfile: MODULE_PROFILE, mFsrs: MODULE_FSRS },
    );

    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.getByTestId('today-next-action')).toBeVisible();
    await expect(page.getByTestId('today-keep-streak')).toBeVisible();
    await expect(page.getByTestId('today-four-strands')).toBeVisible();
    await expect(page.getByTestId('today-export-ics')).toBeVisible();

    // Chuyển chế độ Ngày bận (~10p)
    await page.getByTestId('today-busy-toggle').click();
    await expect(page.getByTestId('today-busy-toggle')).toContainText('Đang ở Ngày bận');

    // Bấm bắt đầu việc đầu tiên
    await page.getByTestId('today-next-start').click();
    await expect(page).toHaveURL(/#\/play\/[a-z0-9]+\?from=today/);
    expect(errors).toEqual([]);
  });

  test('2. Hub: Sắp có ở cuối, mở Sheet chọn chế độ Luyện/Thi và không lộ chữ FSRS', async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await gotoApp(page, '#/hub');

    await expect(page.getByRole('heading', { name: '12 Chế độ luyện IELTS 8.0' })).toBeVisible();
    await expect(page.getByTestId('hub-coming-soon-section')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('FSRS');

    // Bấm thẻ R1 mở Sheet chọn chế độ
    await page.getByTestId('hub-card-r1').click();
    await expect(page.getByTestId('hub-mode-sheet')).toBeVisible();

    // Chọn chế độ Thi thử
    await page.getByTestId('hub-launch-r1-exam').click();
    await expect(page).toHaveURL(/#\/play\/r1\?mode=exam/);
    expect(errors).toEqual([]);
  });

  test('3. Thống kê: hiện Cấp độ XP, Từ vững, 4 mạch học và 12 huy hiệu', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await gotoApp(page, '#/stats');

    await expect(page.getByRole('heading', { name: 'Thống kê & Tiến độ' })).toBeVisible();
    await expect(page.getByTestId('stats-level-card')).toBeVisible();
    await expect(page.getByTestId('stats-mastered-card')).toBeVisible();
    await expect(page.getByTestId('stats-four-strands')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('FSRS');
    expect(errors).toEqual([]);
  });

  test('4. Cài đặt: 3 công tắc motion, đổi tên, cảnh báo iPhone PWA và sao lưu/nhập chế độ Gộp', async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await gotoApp(page, '#/settings');

    // Đổi tên hiển thị
    await page.getByTestId('settings-display-name').fill('Minh');
    await page.getByTestId('settings-save-name').click();

    // Bật 3 công tắc motion & tắt mascot
    for (const id of [
      'pref-reduced-motion',
      'pref-particles-off',
      'pref-haptics-off',
      'pref-show-mascot',
    ]) {
      await page.getByTestId(id).click();
    }

    // Cảnh báo iPhone PWA + nút Sao lưu trước khi cài
    await expect(page.getByTestId('settings-iphone-pwa')).toBeVisible();
    await expect(page.getByTestId('settings-backup-before-pwa')).toBeVisible();

    // Reload kiểm tra công tắc được lưu trong IndexedDB
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('pref-reduced-motion')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('pref-particles-off')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('pref-haptics-off')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('pref-show-mascot')).toHaveAttribute('aria-checked', 'false');

    // Khi tắt "Hiện nhân vật", sang Hôm nay phải ẩn [data-mascot]
    await gotoApp(page, '#/');
    await expect(page.locator('[data-mascot]')).toHaveCount(0);

    // Bật lại "Hiện nhân vật" -> sang Hôm nay phải thấy [data-mascot]
    await gotoApp(page, '#/settings');
    await page.getByTestId('pref-show-mascot').click();
    await expect(page.getByTestId('pref-show-mascot')).toHaveAttribute('aria-checked', 'true');
    await gotoApp(page, '#/');
    await expect(page.locator('[data-mascot]').first()).toBeVisible();
    await gotoApp(page, '#/settings');

    // Tạo 1 bản sao lưu hợp lệ bằng exportBackupJson rồi nhập ở chế độ Gộp
    const backupJson = await page.evaluate(
      async ({ mDb, mBackup, mFsrs }) => {
        const { db } = await import(/* @vite-ignore */ mDb);
        const { exportBackupJson } = await import(/* @vite-ignore */ mBackup);
        const { createNewCard } = await import(/* @vite-ignore */ mFsrs);
        await db.cards.put(createNewCard('vocab:merge_test', 'recog', { unlocked: true }));
        const json = await exportBackupJson(db);
        // Xoá thẻ vừa tạo để kiểm tra bước nhập Gộp phục hồi nó mà vẫn giữ thẻ cục bộ khác
        await db.cards.delete('vocab:merge_test:recog');
        await db.cards.put(createNewCard('vocab:local_keep', 'recog', { unlocked: true }));
        return json;
      },
      { mDb: MODULE_DB, mBackup: MODULE_BACKUP, mFsrs: MODULE_FSRS },
    );

    await page.getByTestId('settings-import-input').setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(backupJson, 'utf-8'),
    });

    // Chế độ Gộp được chọn mặc định
    await expect(page.getByTestId('settings-import-mode-merge')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await page.getByTestId('settings-confirm-restore').click();
    await expect(page.getByText('Đã gộp dữ liệu sao lưu thành công')).toBeVisible();

    const cardCount = await page.evaluate(async (mDb) => {
      const { db } = await import(/* @vite-ignore */ mDb);
      return db.cards.count();
    }, MODULE_DB);
    expect(cardCount).toBe(2);
    expect(errors).toEqual([]);
  });

  test('5. Toast cập nhật SW chỉ hiện ngoài /play/* (X9)', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await gotoApp(page, '#/');
    await page.evaluate(() => {
      window.dispatchEvent(new Event('lexicon:sw-update'));
    });
    await expect(page.getByTestId('sw-update-toast')).toBeVisible();

    await gotoApp(page, '#/play/v1');
    await page.evaluate(() => {
      window.dispatchEvent(new Event('lexicon:sw-update'));
    });
    await expect(page.getByTestId('sw-update-toast')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
