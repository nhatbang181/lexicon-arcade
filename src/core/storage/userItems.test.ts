import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Rating, State } from 'ts-fsrs';
import { LexiconV3DB, type AttemptRecord } from './db';
import { attemptRepo, cardRepo, profileRepo, userItemRepo } from './repos';
import { exportBackupJson, importBackup, verifyBackup, computeChecksum } from './backup';
import { createNewCard, scheduleCard } from '../srs/fsrsAdapter';

const V1_STORES = {
  profile: 'id',
  cards: 'id, itemId, face, due, state, starred, unlocked',
  reviews: '++id, cardId, ts, gameId',
  attempts: '++id, gameId, mode, startedAt',
  essays: '++id, taskType, promptId, createdAt',
  recordings: '++id, part, promptId, createdAt',
  dailyPlans: 'date',
  bandSnapshots: '++id, skill, ts',
  events: '++id, type, ts',
  kv: 'key',
};

function uniqueName(): string {
  return `LexiconT1A_${Math.random().toString(36).slice(2)}`;
}

describe('Dexie v1 → v2: migrate DB cũ có dữ liệu (LUAT P8)', () => {
  it('giữ nguyên dữ liệu cũ, thêm bảng userItems, đánh dấu attempt cũ là final', async () => {
    const name = uniqueName();
    const legacy = new Dexie(name);
    legacy.version(1).stores(V1_STORES);
    await legacy.open();

    const now = new Date('2026-11-01T08:00:00Z');
    const card = createNewCard('vocab:mitigate', 'recog', { now, source: 'placement' });
    await legacy.table('cards').put(card);
    await legacy.table('reviews').add({
      cardId: card.id,
      rating: 3,
      correct: true,
      hintUsed: false,
      durationMs: 1000,
      ts: now.getTime(),
      gameId: 'v1',
    });
    await legacy.table('attempts').add({
      gameId: 'v1',
      mode: 'training',
      startedAt: now.getTime(),
      endedAt: now.getTime() + 60_000,
      score: 4,
      total: 5,
      xp: 40,
      items: [{ itemId: 'vocab:mitigate', correct: true }],
    });
    await legacy.table('kv').put({ key: 'keep', value: 42 });
    legacy.close();

    const upgraded = new LexiconV3DB(name);
    await upgraded.open();
    try {
      expect(upgraded.verno).toBe(2);
      expect(upgraded.tables.map((t) => t.name)).toContain('userItems');
      expect(await upgraded.userItems.count()).toBe(0);

      expect(await upgraded.cards.count()).toBe(1);
      expect((await upgraded.cards.get('vocab:mitigate#recog'))?.source).toBe('placement');
      expect(await upgraded.reviews.count()).toBe(1);
      expect((await upgraded.kv.get('keep'))?.value).toBe(42);

      const attempts = await upgraded.attempts.toArray();
      expect(attempts).toHaveLength(1);
      expect(attempts[0].xp).toBe(40);
      expect(attempts[0].status).toBe('final');

      // bảng mới dùng được ngay trên DB đã nâng cấp
      await userItemRepo.upsertWithCard(
        { id: 'err:user_a1', kind: 'error', front: 'a informations', back: 'information', noteVi: 'Danh từ không đếm được', source: 'essay_feedback' },
        'err_fix',
        { now },
        upgraded,
      );
      expect(await upgraded.userItems.count()).toBe(1);
    } finally {
      await upgraded.delete();
    }
  });
});

describe('userItemRepo.upsertWithCard (G1)', () => {
  let db: LexiconV3DB;
  beforeEach(async () => {
    db = new LexiconV3DB(uniqueName());
    await db.open();
  });
  afterEach(async () => {
    await db.delete();
  });

  const item = {
    id: 'err:user_x9',
    kind: 'error' as const,
    front: 'The informations are useful',
    back: 'The information is useful',
    noteVi: 'information không có số nhiều',
    source: 'essay_feedback',
  };

  it('ghi item và thẻ trong 1 transaction, thẻ trỏ đúng itemId', async () => {
    const res = await userItemRepo.upsertWithCard(item, 'err_fix', { cardSource: 'essay_feedback' }, db);
    expect(res.createdCard).toBe(true);
    expect((await userItemRepo.get(item.id, db))?.back).toBe(item.back);
    const cards = await cardRepo.getByItemId(item.id, db);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('err:user_x9#err_fix');
    expect(cards[0].source).toBe('essay_feedback');
    expect(cards[0].state).toBe(State.New);
  });

  it('rollback cả hai bảng nếu ghi thẻ lỗi (atomic)', async () => {
    const original = db.cards.put.bind(db.cards);
    db.cards.put = (() => Promise.reject(new Error('boom'))) as unknown as typeof db.cards.put;
    await expect(userItemRepo.upsertWithCard(item, 'err_fix', {}, db)).rejects.toThrow();
    db.cards.put = original;
    expect(await db.userItems.count()).toBe(0);
    expect(await db.cards.count()).toBe(0);
  });

  it('gọi lại không reset lịch FSRS của thẻ và giữ createdAt, nội dung được cập nhật', async () => {
    const t0 = new Date('2026-11-02T08:00:00Z');
    await userItemRepo.upsertWithCard(item, 'err_fix', { now: t0 }, db);
    const card = (await cardRepo.get('err:user_x9#err_fix', db))!;
    const scheduled = scheduleCard(card, Rating.Good, t0).card;
    await cardRepo.upsert(scheduled, db);

    const res = await userItemRepo.upsertWithCard(
      { ...item, back: 'The information is helpful' },
      'err_fix',
      { now: new Date('2026-11-09T08:00:00Z') },
      db,
    );
    expect(res.createdCard).toBe(false);
    expect(res.item.createdAt).toBe(t0.getTime());
    expect(res.item.back).toBe('The information is helpful');
    expect((await cardRepo.get('err:user_x9#err_fix', db))?.reps).toBe(1);
    expect(await db.userItems.count()).toBe(1);
  });

  it('getMany trả đúng các id có thật', async () => {
    await userItemRepo.upsertWithCard(item, 'err_fix', {}, db);
    const got = await userItemRepo.getMany([item.id, 'err:user_nope'], db);
    expect(Object.keys(got)).toEqual([item.id]);
  });
});

describe('attemptRepo.saveProgress / finalize (G3)', () => {
  let db: LexiconV3DB;
  beforeEach(async () => {
    db = new LexiconV3DB(uniqueName());
    await db.open();
  });
  afterEach(async () => {
    await db.delete();
  });

  const t0 = new Date('2026-11-10T10:00:00Z').getTime();
  const base: Omit<AttemptRecord, 'id' | 'status' | 'reviewsSaved' | 'xpApplied'> = {
    gameId: 'v1',
    mode: 'training',
    startedAt: t0,
    endedAt: t0 + 30_000,
    score: 0,
    total: 1,
    xp: 0,
    items: [],
  };
  const review = (n: number) => ({
    cardId: `vocab:w${n}#recog`,
    rating: Rating.Good,
    correct: true,
    hintUsed: false,
    durationMs: 900,
    ts: t0 + n * 1000,
    gameId: 'v1' as const,
  });

  it('lưu giữa phiên: thẻ + review + XP vào DB, attempt in_progress', async () => {
    const card = scheduleCard(createNewCard('vocab:w1', 'recog', { now: new Date(t0) }), Rating.Good, new Date(t0)).card;
    const res = await attemptRepo.saveProgress(
      { attempt: { ...base, xp: 10, score: 1 }, updatedCards: [card], reviews: [review(1)] },
      db,
    );
    expect(res.reviewsSaved).toBe(1);
    expect(res.totalXp).toBe(10);
    expect(await db.reviews.count()).toBe(1);
    expect((await db.cards.get(card.id))?.reps).toBe(1);
    const row = await db.attempts.get(res.attemptId);
    expect(row?.status).toBe('in_progress');
    expect((await profileRepo.get(db))?.xp).toBe(10);
  });

  it('gọi lặp lại không nhân đôi review hay XP; finalize chốt attempt', async () => {
    const r1 = await attemptRepo.saveProgress(
      { attempt: { ...base, xp: 10 }, reviews: [review(1)] },
      db,
    );
    const r2 = await attemptRepo.saveProgress(
      { attemptId: r1.attemptId, attempt: { ...base, xp: 10 }, reviews: [review(1)] },
      db,
    );
    expect(r2.attemptId).toBe(r1.attemptId);
    expect(await db.reviews.count()).toBe(1);
    expect(r2.totalXp).toBe(10);

    const r3 = await attemptRepo.saveProgress(
      { attemptId: r1.attemptId, attempt: { ...base, xp: 35 }, reviews: [review(1), review(2), review(3)] },
      db,
    );
    expect(await db.reviews.count()).toBe(3);
    expect(r3.totalXp).toBe(35);
    expect(await db.attempts.count()).toBe(1);

    const fin = await attemptRepo.finalize(
      r1.attemptId,
      { attempt: { ...base, xp: 45, score: 3, total: 3 }, reviews: [review(1), review(2), review(3), review(4)] },
      db,
    );
    expect(fin.totalXp).toBe(45);
    expect(await db.reviews.count()).toBe(4);
    const row = await db.attempts.get(r1.attemptId);
    expect(row?.status).toBe('final');
    expect(row?.score).toBe(3);
    expect(await db.attempts.count()).toBe(1);
  });

  it('finalize không payload chỉ chốt attempt, không đổi XP', async () => {
    const r1 = await attemptRepo.saveProgress({ attempt: { ...base, xp: 20 }, reviews: [review(1)] }, db);
    const fin = await attemptRepo.finalize(r1.attemptId, undefined, db);
    expect(fin.totalXp).toBe(20);
    expect((await db.attempts.get(r1.attemptId))?.status).toBe('final');
    await expect(attemptRepo.finalize(9999, undefined, db)).rejects.toThrow();
  });

  it('đủ 5 review giữa phiên thì streak được tính dù chưa finalize', async () => {
    const reviews = [1, 2, 3, 4, 5].map(review);
    const res = await attemptRepo.saveProgress({ attempt: { ...base, xp: 50 }, reviews }, db);
    expect(res.streakCount).toBe(1);
  });
});

describe('backup có userItems', () => {
  let db: LexiconV3DB;
  beforeEach(async () => {
    db = new LexiconV3DB(uniqueName());
    await db.open();
  });
  afterEach(async () => {
    await db.delete();
  });

  it('export/import khứ hồi giữ userItems', async () => {
    await userItemRepo.upsertWithCard(
      { id: 'err:user_b1', kind: 'error', front: 'x', back: 'y', noteVi: 'z', source: 'essay_feedback' },
      'err_fix',
      {},
      db,
    );
    const json = await exportBackupJson(db);
    await db.userItems.clear();
    const { restoredCounts } = await importBackup(json, db);
    expect(restoredCounts.userItems).toBe(1);
    expect((await db.userItems.get('err:user_b1'))?.back).toBe('y');
  });

  it('backup cũ (không có userItems) vẫn xác minh và khôi phục được', async () => {
    const data = {
      profile: [],
      cards: [],
      reviews: [],
      attempts: [],
      essays: [],
      recordings: [],
      dailyPlans: [],
      bandSnapshots: [],
      events: [],
      kv: [{ key: 'a', value: 1 }],
    };
    const envelope = {
      schemaVersion: 1,
      appVersion: '3.0.0',
      exportedAt: new Date().toISOString(),
      checksum: computeChecksum(JSON.stringify(data)),
      data,
    };
    expect(verifyBackup(envelope).valid).toBe(true);
    const res = await importBackup(JSON.stringify(envelope), db);
    expect(res.restoredCounts.userItems).toBe(0);
    expect((await db.kv.get('a'))?.value).toBe(1);
  });
});
