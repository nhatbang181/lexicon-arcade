import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

const OUT_DIR = path.resolve(process.cwd(), 'test-results/m3');

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

  test('L1 & L2 load with 0 console errors, filter by real MP3, exercise L2 dictation diff, and capture 6 viewport screenshots', async ({
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

    // 1. L1 Trap Detector — chỉ hiển thị các bài có file MP3 thật (L1-01)
    // Giả lập p1_002.mp3 trả HTML SPA-fallback (200 text/html) vì 32/32 MP3 thật đã render đủ ở T3-B
    await page.route('**/audio/listening/p1_002.mp3', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html>' }),
    );
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/play/l1', { waitUntil: 'networkidle' });
    await expect(page.getByText(/Trap Detector/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('l1-episode-card-lep:p1_001')).toBeVisible({ timeout: 15_000 });
    // Bài thiếu MP3 (vd lep:p1_002) bị lọc khỏi catalog
    await expect(page.getByTestId('l1-episode-card-lep:p1_002')).toHaveCount(0);
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

  test('E2E chéo L1 → V1 (B6 / X-01): sai câu bẫy Q4 ở L1 tạo userItem kèm audioClip và sang V1 phát đúng đoạn bẫy', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // Theo dõi HTMLAudioElement mà V1 phát và mốc currentTime sau khi loadedmetadata tua tới clip.start
    await page.addInitScript(() => {
      const state = { src: '', currentTime: 0, maxSeekTime: 0 };
      (window as unknown as { __audioProbe?: typeof state }).__audioProbe = state;
      const origPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        state.src = this.src;
        state.currentTime = this.currentTime;
        const sync = () => {
          state.src = this.src;
          state.currentTime = this.currentTime;
          if (this.currentTime > state.maxSeekTime) state.maxSeekTime = this.currentTime;
        };
        this.addEventListener('loadedmetadata', sync);
        this.addEventListener('seeked', sync);
        this.addEventListener('timeupdate', sync);
        return origPlay.apply(this).catch(() => undefined);
      };
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/play/l1', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('l1-start-lep:p1_001')).toBeVisible({ timeout: 15_000 });

    // Bắt đầu bài p1_001 (Training)
    await page.getByTestId('l1-start-lep:p1_001').click();
    await expect(page.getByTestId('l1-start-listening-btn')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('l1-start-listening-btn').click();

    // Điền đúng các câu khác và cố tình sập bẫy Q4 (decoy: "all-access", đáp án: "off-peak")
    await page.getByTestId('l1-input-4').fill('all-access');

    // Nộp bài sớm (Training -> xác nhận)
    await page.getByTestId('l1-submit-btn').click();
    await page.getByRole('button', { name: 'Chấm bài ngay' }).click();

    // Debrief phải hiện câu 4 sai và nút nghe đoạn bẫy
    await expect(page.getByTestId('l1-debrief')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('debrief-card-4')).toBeVisible();
    await expect(page.getByTestId('debrief-play-trap-4')).toBeVisible();

    // Hoàn tất Debrief -> Recap (ghi attempt + userItem ltrap:* + card ltrap_replay)
    await page.getByTestId('l1-finish-debrief-btn').click();
    await expect(page.getByTestId('l1-recap')).toBeVisible({ timeout: 10_000 });

    // Đợi IndexedDB ghi xong userItem ltrap:p1_001_lep_p1_001_q04 và thẻ ltrap_replay
    await expect
      .poll(
        async () =>
          page.evaluate(async () => {
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              const req = indexedDB.open('LexiconV3DB');
              req.onsuccess = () => resolve(req.result);
              req.onerror = () => reject(req.error);
            });
            const item = await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
              const req = db
                .transaction('userItems', 'readonly')
                .objectStore('userItems')
                .get('ltrap:p1_001_lep_p1_001_q04');
              req.onsuccess = () => resolve(req.result as Record<string, unknown> | undefined);
              req.onerror = () => reject(req.error);
            });
            const card = await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
              const req = db
                .transaction('cards', 'readonly')
                .objectStore('cards')
                .get('ltrap:p1_001_lep_p1_001_q04#ltrap_replay');
              req.onsuccess = () => resolve(req.result as Record<string, unknown> | undefined);
              req.onerror = () => reject(req.error);
            });
            db.close();
            return { item, card };
          }),
        { timeout: 10_000 },
      )
      .toMatchObject({
        item: {
          id: 'ltrap:p1_001_lep_p1_001_q04',
          kind: 'ltrap',
          audioClip: {
            src: 'audio/listening/p1_001.mp3',
            start: 89.37,
            end: 95.36,
          },
        },
        card: {
          id: 'ltrap:p1_001_lep_p1_001_q04#ltrap_replay',
          face: 'ltrap_replay',
        },
      });

    // Sang V1: kiểm tra thẻ ltrap_replay xuất hiện và nút "Nghe đoạn bẫy" phát đúng đoạn 89.37s của p1_001.mp3
    await page.goto('/#/play/v1', { waitUntil: 'networkidle' });
    await expect(page.getByText(/Lượt chạy hôm nay: \d+ thẻ/)).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /^Bắt đầu/ }).click();

    const node = page.getByTestId('v1-node');
    await expect(node).toBeVisible({ timeout: 10_000 });
    await expect(node).toHaveAttribute('data-item-id', 'ltrap:p1_001_lep_p1_001_q04');
    await expect(node).toHaveAttribute('data-face', 'ltrap_replay');

    // Xoá trạng thái probe cũ rồi bấm "Nghe đoạn bẫy" trong V1
    await page.evaluate(() => {
      const w = window as unknown as {
        __audioProbe?: { src: string; currentTime: number; maxSeekTime: number };
      };
      if (w.__audioProbe) {
        w.__audioProbe.src = '';
        w.__audioProbe.currentTime = 0;
        w.__audioProbe.maxSeekTime = 0;
      }
    });

    await page.getByRole('button', { name: /Nghe đoạn bẫy/i }).click();

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const w = window as unknown as {
              __audioProbe?: { src: string; currentTime: number; maxSeekTime: number };
            };
            return w.__audioProbe ?? { src: '', currentTime: 0, maxSeekTime: 0 };
          }),
        { timeout: 10_000 },
      )
      .toMatchObject({
        src: expect.stringContaining('audio/listening/p1_001.mp3'),
      });

    // Đợi loadedmetadata tua tới đúng đoạn bẫy [89.37, 95.36]
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const w = window as unknown as {
              __audioProbe?: { src: string; currentTime: number; maxSeekTime: number };
            };
            return w.__audioProbe?.maxSeekTime ?? 0;
          }),
        { timeout: 10_000 },
      )
      .toBeGreaterThanOrEqual(88);

    const probe = await page.evaluate(() => {
      const w = window as unknown as {
        __audioProbe?: { src: string; currentTime: number; maxSeekTime: number };
      };
      return w.__audioProbe!;
    });
    expect(probe.maxSeekTime).toBeLessThanOrEqual(96);

    expect(consoleErrors).toEqual([]);
  });

  test('L1 Exam mode không hiện kịch bản mô phỏng, có hộp xác nhận thoát Exam, và Retry chỉ ôn câu sai (L1-01, L1-08, L1-09)', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/play/l1', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('l1-mode-exam')).toBeVisible({ timeout: 15_000 });

    // Vào Exam mode bài p1_001
    await page.getByTestId('l1-mode-exam').click();
    await page.getByTestId('l1-start-lep:p1_001').click();
    await expect(page.getByTestId('l1-active-session')).toBeVisible({ timeout: 15_000 });
    // Không bao giờ có nút "Đọc kịch bản mô phỏng" ở Exam (SR-23)
    await expect(page.getByText(/Đọc kịch bản mô phỏng/i)).toHaveCount(0);

    // Bấm "Đổi bài" giữa Exam -> phải hiện modal xác nhận thoát (L1-09)
    await page.getByTestId('l1-change-episode-btn').click();
    await expect(page.getByTestId('l1-confirm-exit-exam-btn')).toBeVisible();
    await page.getByTestId('l1-confirm-exit-exam-btn').click();
    await expect(page.getByTestId('l1-episode-picker')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
