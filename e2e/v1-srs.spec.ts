import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * T1-A · V1 + kho thẻ SRS (G1, G3, V1-1, V1-3, V1-7).
 * - Trả lời 5 thẻ → reload → DB có đúng 5 review và lịch ôn của 5 thẻ đã đổi.
 * - DB rỗng → EmptyState, không thẻ `source: 'fixture'` nào được ghi.
 * - Thẻ mới: intro → recog trong cùng run, từ mới không kẹt ở thẻ giới thiệu.
 */

interface WordRow {
  id: string;
  headword: string;
  meaningVi: string;
}

const WORDS: WordRow[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'public/data/vocab/words.json'), 'utf8'),
) as WordRow[];

/** 8 từ 1 chữ, nghĩa khác nhau, dùng làm thẻ đến hạn. */
const SEED_WORDS = WORDS.filter((w) => /^[a-z]+$/.test(w.headword) && w.headword.length >= 6).slice(
  0,
  8,
);
const HEADWORD_BY_ID = new Map(SEED_WORDS.map((w) => [w.id, w.headword]));

function trackConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

/** Ghi thẳng thẻ vào IndexedDB của app (Dexie đã tạo DB khi mở trang lần đầu). */
async function seedDueCards(page: Page, ids: string[]): Promise<void> {
  await page.evaluate(async (itemIds) => {
    const now = Date.now();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('LexiconV3DB');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('cards', 'readwrite');
      const store = tx.objectStore('cards');
      for (const itemId of itemIds) {
        store.put({
          id: `${itemId}#recall_meaning`,
          itemId,
          face: 'recall_meaning',
          due: now - 3_600_000,
          stability: 5,
          difficulty: 5,
          elapsed_days: 3,
          scheduled_days: 5,
          learning_steps: 0,
          reps: 3,
          lapses: 0,
          state: 2,
          last_review: now - 3 * 86_400_000,
          unlocked: true,
          starred: false,
          source: 'curriculum',
          createdAt: now - 10 * 86_400_000,
          streak: 1,
        });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, ids);
}

interface DbSnapshot {
  cards: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  attempts: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  userItems: number;
}

async function readDb(page: Page): Promise<DbSnapshot> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('LexiconV3DB');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const all = (name: string) =>
      new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
        const req = db.transaction(name, 'readonly').objectStore(name).getAll();
        req.onsuccess = () => resolve(req.result as Array<Record<string, unknown>>);
        req.onerror = () => reject(req.error);
      });
    const snapshot = {
      cards: await all('cards'),
      reviews: await all('reviews'),
      attempts: await all('attempts'),
      events: await all('events'),
      userItems: (await all('userItems')).length,
    };
    db.close();
    return snapshot;
  });
}

interface NodeInfo {
  nodeId: string;
  itemId: string;
  face: string;
}

async function currentNode(page: Page): Promise<NodeInfo | null> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="v1-node"]');
    if (!el) return null;
    return {
      nodeId: el.getAttribute('data-node-id') ?? '',
      itemId: el.getAttribute('data-item-id') ?? '',
      face: el.getAttribute('data-face') ?? '',
    };
  });
}

/** Đợi node kế tiếp vào hẳn (node cũ đang chạy hiệu ứng thoát không được tính). */
async function nextNode(page: Page, previousNodeId?: string): Promise<NodeInfo> {
  let found: NodeInfo | null = null;
  await expect
    .poll(async () => {
      found = await currentNode(page);
      return found !== null && found.nodeId !== previousNodeId;
    }, { timeout: 10_000 })
    .toBe(true);
  return found as unknown as NodeInfo;
}

async function startRun(page: Page): Promise<void> {
  await expect(page.getByText(/Lượt chạy hôm nay: \d+ thẻ/)).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /^Bắt đầu/ }).click();
  await expect(page.getByTestId('v1-node')).toBeVisible();
}

async function answerCurrentCorrectly(page: Page): Promise<string> {
  // Ô gõ chỉ bật lại khi node mới đã vào (node cũ đang thoát bị khóa) → không đọc nhầm node cũ
  const input = page.getByRole('textbox', { name: 'Gõ từ tiếng Anh' });
  await expect(input).toBeEnabled();
  const itemId = (await currentNode(page))?.itemId ?? '';
  const headword = HEADWORD_BY_ID.get(itemId);
  expect(headword, `thẻ ${itemId} phải là một trong các từ đã seed`).toBeTruthy();
  await input.fill(headword as string);
  await input.press('Enter');
  await expect(page.getByText('Chính xác!').first()).toBeVisible();
  await page.keyboard.press('Enter');
  return itemId;
}

test.describe('V1 · kho thẻ SRS và lưu giữa phiên', () => {
  test('trả lời 5 thẻ → reload → DB có 5 review, lịch ôn của 5 thẻ đã đổi', async ({ page }) => {
    const errors = trackConsole(page);
    await page.goto('/#/play/v1');
    await expect(page.getByText('Chưa có thẻ nào để ôn')).toBeVisible({ timeout: 20_000 });
    await seedDueCards(page, SEED_WORDS.map((w) => w.id));
    await page.reload();

    await startRun(page);
    const answered: string[] = [];
    for (let i = 0; i < 5; i++) {
      answered.push(await answerCurrentCorrectly(page));
      if (i < 4) await expect(page.getByTestId('v1-node')).toBeVisible();
    }
    expect(new Set(answered).size).toBe(5);

    // Debounce 500 ms rồi mới ghi: đợi tới khi DB có đủ 5 review (không dừng ở Recap)
    await expect
      .poll(async () => (await readDb(page)).reviews.length, { timeout: 10_000 })
      .toBe(5);

    await page.reload();
    const db = await readDb(page);
    expect(db.reviews).toHaveLength(5);
    expect(new Set(db.reviews.map((r) => r.cardId)).size).toBe(5);
    expect(db.attempts).toHaveLength(1);
    expect(db.attempts[0].status).toBe('in_progress');
    expect((db.attempts[0].items as unknown[]).length).toBe(5);

    const now = Date.now();
    for (const itemId of answered) {
      const card = db.cards.find((c) => c.id === `${itemId}#recall_meaning`);
      expect(card, `thẻ ${itemId}`).toBeTruthy();
      expect(card?.reps).toBe(4);
      expect(card?.due as number).toBeGreaterThan(now);
    }

    // Mặt mới mở khóa sau khi trả lời đúng không bắt người học xem lại thẻ giới thiệu của từ đã biết
    const unlocked = db.cards.filter((c) => c.state === 0);
    expect(unlocked.length).toBeGreaterThan(0);
    expect(unlocked.every((c) => Boolean(c.introSeenAt))).toBe(true);

    // 5 thẻ đã ôn không còn đến hạn: run sau reload không có thẻ nào trong số đó
    await expect(page.getByText(/Lượt chạy hôm nay: \d+ thẻ/)).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /^Bắt đầu/ }).click();
    const nextItem = await page.getByTestId('v1-node').getAttribute('data-item-id');
    expect(answered).not.toContain(nextItem);
    expect(errors).toEqual([]);
  });

  test('thoát màn giữa phiên (đổi route ngay sau câu trả lời) vẫn lưu tiến độ', async ({ page }) => {
    const errors = trackConsole(page);
    await page.goto('/#/play/v1');
    await expect(page.getByText('Chưa có thẻ nào để ôn')).toBeVisible({ timeout: 20_000 });
    await seedDueCards(page, SEED_WORDS.map((w) => w.id));
    await page.reload();

    await startRun(page);
    await answerCurrentCorrectly(page);
    await answerCurrentCorrectly(page);
    // Rời màn trước khi hết debounce 500 ms
    await page.evaluate(() => {
      window.location.hash = '#/hub';
    });
    await expect(page).toHaveURL(/#\/hub/);
    await expect
      .poll(async () => (await readDb(page)).reviews.length, { timeout: 10_000 })
      .toBe(2);
    expect(errors).toEqual([]);
  });

  test('DB rỗng → EmptyState, 0 thẻ source:fixture; "15 từ khởi động" tạo thẻ thật', async ({ page }) => {
    const errors = trackConsole(page);
    await page.goto('/#/play/v1');
    await expect(page.getByText('Chưa có thẻ nào để ôn')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('link', { name: 'Làm placement' })).toHaveAttribute(
      'href',
      '#/placement',
    );

    let db = await readDb(page);
    expect(db.cards).toHaveLength(0);
    expect(db.cards.filter((c) => c.source === 'fixture')).toHaveLength(0);
    expect(db.attempts).toHaveLength(0);

    await page.getByRole('button', { name: /Bắt đầu với 15 từ khởi động/ }).click();
    await expect(page.getByText('Lượt chạy hôm nay: 15 thẻ')).toBeVisible({ timeout: 20_000 });
    db = await readDb(page);
    expect(db.cards).toHaveLength(15);
    expect(db.cards.filter((c) => c.source === 'fixture')).toHaveLength(0);
    expect(db.cards.every((c) => c.state === 0 && c.face === 'recog')).toBe(true);
    expect(errors).toEqual([]);
  });

  test('từ mới: intro → "Đã xem" → recog của chính từ đó trong cùng run → FSRS ghi prevState New', async ({
    page,
  }) => {
    const errors = trackConsole(page);
    await page.goto('/#/play/v1');
    await page.getByRole('button', { name: /Bắt đầu với 15 từ khởi động/ }).click();
    await startRun(page);

    let info = await nextNode(page);
    expect(info.face).toBe('intro');
    const firstItem = info.itemId;

    let sawRecog = false;
    for (let step = 0; step < 10 && !sawRecog; step++) {
      if (info.face === 'recog' && info.itemId === firstItem) {
        sawRecog = true;
        break;
      }
      if (info.face === 'intro') {
        await page.getByRole('button', { name: /^Đã xem/ }).click();
      } else {
        await page.keyboard.press('1');
        await page.keyboard.press('Enter');
      }
      info = await nextNode(page, info.nodeId);
    }
    expect(sawRecog).toBe(true);

    // Trả lời recog của từ mới → review đầu tiên của thẻ có prevState New (0)
    await page.keyboard.press('1');
    await expect
      .poll(async () => (await readDb(page)).reviews.some((r) => r.cardId === `${firstItem}#recog`), {
        timeout: 10_000,
      })
      .toBe(true);
    const db = await readDb(page);
    const review = db.reviews.find((r) => r.cardId === `${firstItem}#recog`);
    expect(review?.prevState).toBe(0);
    const card = db.cards.find((c) => c.id === `${firstItem}#recog`);
    expect(card?.introSeenAt).toBeTruthy();
    expect(errors).toEqual([]);
  });
});
