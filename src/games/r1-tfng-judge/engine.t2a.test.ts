import { describe, expect, it } from 'vitest';
import { R1_FIXTURE_P1 } from '../../test/fixtures/r1_fixtures';
import {
  buildR1JudgeProgressSnapshot,
  createJudgeRetrySession,
  createJudgeSession,
  getR1DifficultyConfig,
  nextJudgeQuestion,
  selectR1Passage,
  submitJudgeVerdict,
  toggleJudgeNoDirectInfo,
  type R1CatalogCandidate,
} from './engine';

const SAMPLE_CATALOG: R1CatalogCandidate[] = [
  { id: 'p1_001', level: 'P1', hasJudgeQuestions: true, hasTfng: true, hasYnng: false },
  { id: 'p1_002', level: 'P1', hasJudgeQuestions: true, hasTfng: true, hasYnng: false },
  { id: 'p1_003', level: 'P1', hasJudgeQuestions: true, hasTfng: true, hasYnng: false },
  { id: 'p2_001', level: 'P2', hasJudgeQuestions: true, hasTfng: true, hasYnng: false },
  { id: 'p3_001', level: 'P3', hasJudgeQuestions: true, hasTfng: false, hasYnng: true },
  { id: 'p3_002', level: 'P3', hasJudgeQuestions: true, hasTfng: true, hasYnng: true },
];

describe('R1 · TFNG Judge T2-A (R1-1, R1-2, PP-05, G1 producer, retry 0 XP, progress)', () => {
  it('R1-1: 3 phiên liên tiếp chọn 3 passage khác nhau khi truyền recentIds; level 9 chỉ ra P3', () => {
    const p1 = selectR1Passage(SAMPLE_CATALOG, 1, { seed: 's1', recentIds: [] })!;
    const p2 = selectR1Passage(SAMPLE_CATALOG, 1, { seed: 's2', recentIds: [p1.id] })!;
    const p3 = selectR1Passage(SAMPLE_CATALOG, 1, { seed: 's3', recentIds: [p1.id, p2.id] })!;
    expect(new Set([p1.id, p2.id, p3.id]).size).toBe(3);
    expect([p1.level, p2.level, p3.level]).toEqual(['P1', 'P1', 'P1']);

    const lv9 = selectR1Passage(SAMPLE_CATALOG, 9, { seed: 'lv9', recentIds: [] })!;
    expect(lv9.level).toBe('P3');
  });

  it('PP-05: level ≥ 7 hoặc preferYnng ưu tiên passage có YNNG', () => {
    const lv7 = selectR1Passage(SAMPLE_CATALOG, 7, { seed: 'lv7', recentIds: [] })!;
    expect(lv7.hasYnng).toBe(true);
  });

  it('R1-2: level 8 mục tiêu 55 s/câu', () => {
    expect(getR1DifficultyConfig(7).targetSecPerQuestion).toBe(65);
    expect(getR1DifficultyConfig(8).targetSecPerQuestion).toBe(55);
    expect(getR1DifficultyConfig(9).targetSecPerQuestion).toBe(55);
  });

  it('G1/G3: trả lời sai tạo producedItems tfng:<qid> và buildR1JudgeProgressSnapshot hợp lệ', () => {
    let state = createJudgeSession(R1_FIXTURE_P1, { level: 1, nowMs: 1000 });
    expect(buildR1JudgeProgressSnapshot(state)).toBeNull();

    const first = state.items[0];
    const wrongVerdict = first.question.answer.key === 'FALSE' ? 'NOT GIVEN' : 'FALSE';
    state = toggleJudgeNoDirectInfo(state, true);
    state = submitJudgeVerdict(state, wrongVerdict, 5000, new Date(6000));

    const tfngId = `tfng:${first.question.qid}`;
    expect(state.producedItems[tfngId]).toBeDefined();
    expect(state.producedItems[tfngId].kind).toBe('tfng');
    expect(state.producedItems[tfngId].front).toBe(first.question.prompt);

    const snap = buildR1JudgeProgressSnapshot(state, 7000);
    expect(snap).not.toBeNull();
    expect(snap!.items.some((it) => it.id === tfngId)).toBe(true);
    expect(snap!.progress.attempt.gameId).toBe('r1');
    expect(snap!.progress.attempt.items).toHaveLength(1);
  });

  it('C3: createJudgeRetrySession chỉ gồm ≤ 5 câu sai, 0 XP, 0 producedItems, snapshot = null', () => {
    let state = createJudgeSession(R1_FIXTURE_P1, { level: 1, nowMs: 1000 });
    const count = Math.min(6, state.items.length);
    for (let i = 0; i < count; i++) {
      const cur = state.items[state.currentIndex];
      const wrongVerdict = cur.question.answer.key === 'FALSE' ? 'NOT GIVEN' : 'FALSE';
      state = toggleJudgeNoDirectInfo(state, true);
      state = submitJudgeVerdict(state, wrongVerdict, 3000, new Date(4000 + i * 1000));
      state = nextJudgeQuestion(state, 5000 + i * 1000);
    }

    const retry = createJudgeRetrySession(state, 99000);
    expect(retry).not.toBeNull();
    expect(retry!.isRetry).toBe(true);
    expect(retry!.items.length).toBeLessThanOrEqual(5);
    expect(retry!.items.length).toBeGreaterThan(0);

    let rState = toggleJudgeNoDirectInfo(retry!, true);
    rState = submitJudgeVerdict(rState, 'NOT GIVEN', 2000, new Date(101000));
    expect(rState.totalXp).toBe(0);
    expect(Object.keys(rState.producedItems)).toHaveLength(0);
    expect(buildR1JudgeProgressSnapshot(rState)).toBeNull();
  });
});
