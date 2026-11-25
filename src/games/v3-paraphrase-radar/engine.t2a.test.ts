import { describe, expect, it } from 'vitest';
import type { ParaphraseItem } from '../../core/content/schemas';
import { V3_FIXTURE_PARAPHRASES } from '../../test/fixtures/v2v3_fixtures';
import {
  V3_SESSION_LENGTH,
  buildContextChunks,
  buildV3ProgressSnapshot,
  createV3RetrySession,
  createV3Session,
  getV3ComboMultiplier,
  nextV3Round,
  selectParaphraseSessionItems,
  submitV3Round,
} from './engine';

function makeSyntheticPool(size: number): ParaphraseItem[] {
  const pool: ParaphraseItem[] = [];
  for (let i = 0; i < size; i++) {
    const base = V3_FIXTURE_PARAPHRASES[i % V3_FIXTURE_PARAPHRASES.length];
    const lv = ((i % 4) + 1) as 1 | 2 | 3 | 4;
    pool.push({
      ...base,
      id: `para:syn_${i}`,
      level: lv,
      relation: lv === 4 ? 'not_equivalent' : 'equivalent',
    });
  }
  return pool;
}

describe('V3 · Paraphrase Radar T2-A (V3-2, V3-3, V3-4, V3-7, retry, progress)', () => {
  it('V3-2: tỉ lệ chunk trùng khít biên target ≤ 30% trên pool', () => {
    let exactMatches = 0;
    for (const item of V3_FIXTURE_PARAPHRASES) {
      const chunks = buildContextChunks(item);
      if (chunks.some((c) => c.start === item.target.start && c.end === item.target.end)) {
        exactMatches += 1;
      }
    }
    expect(exactMatches / V3_FIXTURE_PARAPHRASES.length).toBeLessThanOrEqual(0.3);
  });

  it('V3-3: 2 phiên liên tiếp (truyền recentIds) trùng ≤ 2 item khi pool ≥ 48', () => {
    const pool = makeSyntheticPool(60);
    const s1 = selectParaphraseSessionItems(pool, 5, V3_SESSION_LENGTH, {
      seed: 'session-1',
    });
    const s2 = selectParaphraseSessionItems(pool, 5, V3_SESSION_LENGTH, {
      seed: 'session-2',
      recentIds: s1.map((it) => it.id),
    });
    const ids1 = new Set(s1.map((it) => it.id));
    const overlap = s2.filter((it) => ids1.has(it.id)).length;
    expect(overlap).toBeLessThanOrEqual(2);
  });

  it('V3-4: timeout hoặc trả lời sai không tăng decoysAvoided', () => {
    const withDecoy = V3_FIXTURE_PARAPHRASES.find((it) => it.decoys.length > 0)!;
    const state = createV3Session({
      allItems: [withDecoy],
      level: 1,
      count: 1,
      seed: 'v3-4-timeout',
    });

    const afterTimeout = submitV3Round(state, {
      timedOut: true,
      elapsedMs: 25000,
    }).state;
    expect(afterTimeout.decoysAvoided).toBe(0);

    const afterWrongNotIn = submitV3Round(state, {
      selectedNotInPassage: true,
      elapsedMs: 5000,
    }).state;
    if (withDecoy.relation === 'equivalent') {
      expect(afterWrongNotIn.decoysAvoided).toBe(0);
    }
  });

  it('V3-7: hệ số combo ×1 / ×2 (≥5) / ×3 (≥10)', () => {
    expect(getV3ComboMultiplier(1)).toBe(1);
    expect(getV3ComboMultiplier(4)).toBe(1);
    expect(getV3ComboMultiplier(5)).toBe(2);
    expect(getV3ComboMultiplier(9)).toBe(2);
    expect(getV3ComboMultiplier(10)).toBe(3);
  });

  it('C3: phiên retry chỉ gồm câu sai (≤ 5), 0 XP, 0 FSRS review và không lưu snapshot', () => {
    const pool = V3_FIXTURE_PARAPHRASES.slice(0, 6);
    let state = createV3Session({
      allItems: pool,
      level: 5,
      count: 6,
      seed: 'v3-retry',
    });

    // Trả lời sai cả 6 câu (timeout)
    for (let i = 0; i < 6; i++) {
      state = submitV3Round(state, { timedOut: true, elapsedMs: 20000 }).state;
      state = nextV3Round(state).state;
    }
    expect(state.stage).toBe('recap');
    expect(state.mistakes.length).toBe(6);

    const retry = createV3RetrySession(state, 99999);
    expect(retry).not.toBeNull();
    expect(retry!.isRetry).toBe(true);
    expect(retry!.items.length).toBe(5);

    const first = retry!.items[0];
    const afterCorrect = submitV3Round(retry!, {
      selectedSpan: first.relation === 'equivalent' ? first.target : null,
      selectedNotInPassage: first.relation === 'not_equivalent',
      elapsedMs: 3000,
    }).state;

    expect(afterCorrect.xp).toBe(0);
    expect(afterCorrect.reviews).toHaveLength(0);
    expect(afterCorrect.attemptItems).toHaveLength(0);
    expect(buildV3ProgressSnapshot(afterCorrect)).toBeNull();
  });

  it('G3: buildV3ProgressSnapshot trả null khi chưa trả lời, trả payload hợp lệ sau 1 lượt', () => {
    const state = createV3Session({
      allItems: V3_FIXTURE_PARAPHRASES.slice(0, 3),
      level: 1,
      count: 3,
      seed: 'v3-snap',
    });
    expect(buildV3ProgressSnapshot(state)).toBeNull();

    const it0 = state.items[0];
    const after = submitV3Round(state, {
      selectedSpan: it0.relation === 'equivalent' ? it0.target : null,
      selectedNotInPassage: it0.relation === 'not_equivalent',
      elapsedMs: 4000,
    }).state;
    const snap = buildV3ProgressSnapshot(after);
    expect(snap).not.toBeNull();
    expect(snap!.attempt.gameId).toBe('v3');
    expect(snap!.attempt.items).toHaveLength(1);
    expect(snap!.reviews).toHaveLength(1);
    expect(snap!.updatedCards).toHaveLength(1);
  });
});
