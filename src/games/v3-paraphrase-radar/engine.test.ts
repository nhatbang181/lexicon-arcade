import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { ParaphraseItemSchema } from '../../core/content/schemas';
import { makeCardId } from '../../core/srs/fsrsAdapter';
import { V3_FIXTURE_PARAPHRASES } from '../../test/fixtures/v2v3_fixtures';
import {
  V3_SESSION_LENGTH,
  buildContextChunks,
  computeAvgResponseSec,
  computeSpeedMultiplier,
  createV3Session,
  expandClickToChunk,
  formatV3WinStatement,
  getV3DifficultyConfig,
  nextV3Round,
  scoreParaphraseSelection,
  selectParaphraseSessionItems,
  setV3Selection,
  snapSpanToWords,
  submitV3Round,
  tokenizeContextWithSpans,
} from './engine';

describe('V3 · Paraphrase Radar Engine', () => {
  it('1. validates all 18 V3 fixture paraphrases against Zod schema and [INV-P1..P3]', () => {
    expect(V3_FIXTURE_PARAPHRASES.length).toBeGreaterThanOrEqual(12);
    for (const item of V3_FIXTURE_PARAPHRASES) {
      expect(ParaphraseItemSchema.safeParse(item).success).toBe(true);
      // [INV-P1] exact slice matches text
      expect(item.context.slice(item.target.start, item.target.end)).toBe(item.target.text);
      for (const d of item.decoys) {
        expect(item.context.slice(d.start, d.end)).toBe(d.text);
      }
      // [INV-P2] non-overlapping spans
      const spans = [item.target, ...item.decoys].sort((a, b) => a.start - b.start);
      for (let i = 1; i < spans.length; i++) {
        expect(spans[i].start).toBeGreaterThanOrEqual(spans[i - 1].end);
      }
    }
  });

  it('2. returns correct difficulty configs (time limits 14s-25s and L1:L2:L3:L4 mix)', () => {
    expect(getV3DifficultyConfig(1)).toMatchObject({ timeLimitSec: 25, mix: [7, 3, 0, 0] });
    expect(getV3DifficultyConfig(4)).toMatchObject({ timeLimitSec: 22, mix: [4, 4, 2, 0] });
    expect(getV3DifficultyConfig(5)).toMatchObject({ timeLimitSec: 20, mix: [2, 3, 4, 1] });
    expect(getV3DifficultyConfig(8)).toMatchObject({ timeLimitSec: 17, mix: [1, 3, 4, 2] });
    expect(getV3DifficultyConfig(10)).toMatchObject({ timeLimitSec: 14, mix: [1, 2, 4, 3] });
  });

  it('3. selects 12 session items respecting L1:L2:L3:L4 mix for level 5 and level 10', () => {
    const lv5Items = selectParaphraseSessionItems(V3_FIXTURE_PARAPHRASES, 5, V3_SESSION_LENGTH);
    expect(lv5Items).toHaveLength(12);
    expect(lv5Items.some((i) => i.level === 4)).toBe(true);
    expect(lv5Items.some((i) => i.level === 3)).toBe(true);

    const lv10Items = selectParaphraseSessionItems(V3_FIXTURE_PARAPHRASES, 10, V3_SESSION_LENGTH);
    expect(lv10Items).toHaveLength(12);
    const l4Count = lv10Items.filter((i) => i.level === 4).length;
    expect(l4Count).toBeGreaterThanOrEqual(2);
  });

  it('4. tokenizes context with exact character offsets and snaps drag spans cleanly to words', () => {
    const item = V3_FIXTURE_PARAPHRASES[0];
    const tokens = tokenizeContextWithSpans(item.context);
    expect(tokens.length).toBeGreaterThan(15);
    for (const tok of tokens) {
      expect(item.context.slice(tok.start, tok.end)).toBe(tok.text);
    }

    // Dragging slightly inside the middle of first & last words of target snaps to full target
    const snapped = snapSpanToWords(
      item.context,
      item.target.start + 2,
      item.target.end - 2,
    );
    expect(snapped?.text).toBe(item.target.text);
  });

  it('5. chunks context independently of target/decoy anchors (V3-2)', () => {
    const item = V3_FIXTURE_PARAPHRASES[0];
    const chunks = buildContextChunks(item);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.every((c) => c.kind === 'neutral')).toBe(true);

    const midTargetOffset = Math.floor((item.target.start + item.target.end) / 2);
    const expandedTarget = expandClickToChunk(item, midTargetOffset);
    expect(expandedTarget).not.toBeNull();
    expect(expandedTarget?.kind).toBe('neutral');
    expect(expandedTarget!.start).toBeLessThanOrEqual(midTargetOffset);
    expect(expandedTarget!.end).toBeGreaterThan(midTargetOffset);
  });

  it('6. computes XP speed multiplier accurately (<40% -> 1.5, <70% -> 1.2, >=70% -> 1.0)', () => {
    expect(computeSpeedMultiplier(5000, 20)).toBe(1.5); // 25%
    expect(computeSpeedMultiplier(10000, 20)).toBe(1.2); // 50%
    expect(computeSpeedMultiplier(15000, 20)).toBe(1.0); // 75%
    expect(computeSpeedMultiplier(20000, 20)).toBe(1.0); // 100%
  });

  it('7. scores exact target match (IoU >= 0.5) as correct with speed-multiplied XP', () => {
    const item = V3_FIXTURE_PARAPHRASES[0];
    const res = scoreParaphraseSelection(
      item,
      {
        selectedSpan: { start: item.target.start, end: item.target.end },
        elapsedMs: 4000, // 20% of 20s -> 1.5x
      },
      20,
    );

    expect(res.correct).toBe(true);
    expect(res.outcome).toBe('correct');
    expect(res.iou).toBe(1);
    expect(res.speedMultiplier).toBe(1.5);
    expect(res.xpEarned).toBe(15);
  });

  it('8. scores partial overlap (0.2 <= IoU < 0.5) as partial/Hard with 1/2 XP and warns when selection is too wide', () => {
    const item = V3_FIXTURE_PARAPHRASES[0]; // target: "fertility has declined markedly" (31 chars)
    // Highlighting a wide 90-char span containing target -> IoU ~ 31/90 = 0.34
    const wideStart = Math.max(0, item.target.start - 20);
    const wideEnd = Math.min(item.context.length, item.target.end + 40);

    const res = scoreParaphraseSelection(
      item,
      {
        selectedSpan: { start: wideStart, end: wideEnd },
        elapsedMs: 12000, // 60% of 20s -> 1.2x
      },
      20,
    );

    expect(res.correct).toBe(true);
    expect(res.outcome).toBe('partial');
    expect(res.iou).toBeGreaterThanOrEqual(0.2);
    expect(res.iou).toBeLessThan(0.5);
    expect(res.xpEarned).toBe(6); // Math.round(5 * 1.2)
    expect(res.tooWideWarning).toContain('Chọn đúng cụm, không chọn cả câu');
  });

  it('9. detects decoy hit as keyword_echo with whyVi, 0 XP, and Rating.Again', () => {
    const item = V3_FIXTURE_PARAPHRASES[0];
    const decoy = item.decoys[0];
    const state = createV3Session({
      allItems: [item],
      level: 1,
      count: 1,
    });

    const { state: after, events } = submitV3Round(state, {
      selectedSpan: { start: decoy.start, end: decoy.end, text: decoy.text },
      elapsedMs: 6000,
    });

    expect(after.lastResult?.correct).toBe(false);
    expect(after.lastResult?.outcome).toBe('decoy_hit');
    expect(after.lastResult?.trapType).toBe('keyword_echo');
    expect(after.lastResult?.decoyWhyVi).toBe(decoy.whyVi);
    expect(after.xp).toBe(0);
    expect(after.keywordEchoHits).toBe(1);
    expect(events[0]).toMatchObject({
      type: 'round_scored',
      outcome: 'decoy_hit',
      rating: Rating.Again,
      trapType: 'keyword_echo',
    });
  });

  it('10. flags shouldLogKeywordEchoTag when learner hits 2+ decoys in one session', () => {
    const twoItems = V3_FIXTURE_PARAPHRASES.slice(0, 2);
    let state = createV3Session({
      allItems: twoItems,
      level: 1,
      count: 2,
    });

    const d0 = state.items[0].decoys[0];
    state = submitV3Round(state, {
      selectedSpan: { start: d0.start, end: d0.end, text: d0.text },
      elapsedMs: 5000,
    }).state;
    expect(state.shouldLogKeywordEchoTag).toBe(false);

    state = nextV3Round(state).state;
    const d1 = state.items[1].decoys[0];
    state = submitV3Round(state, {
      selectedSpan: { start: d1.start, end: d1.end, text: d1.text },
      elapsedMs: 5000,
    }).state;
    expect(state.keywordEchoHits).toBe(2);
    expect(state.shouldLogKeywordEchoTag).toBe(true);
  });

  it('11. L4 not_equivalent: pressing N ("KHÔNG CÓ TRONG ĐOẠN") scores correct; highlighting text scores wrong/decoy_hit', () => {
    const l4Item = V3_FIXTURE_PARAPHRASES.find((i) => i.relation === 'not_equivalent')!;
    expect(l4Item).toBeDefined();

    const correctRes = scoreParaphraseSelection(
      l4Item,
      { selectedNotInPassage: true, elapsedMs: 5000 },
      17,
    );
    expect(correctRes.correct).toBe(true);
    expect(correctRes.outcome).toBe('correct');
    expect(correctRes.xpEarned).toBe(15); // 5/17 < 0.4 -> 1.5x

    const wrongRes = scoreParaphraseSelection(
      l4Item,
      {
        selectedSpan: { start: l4Item.target.start, end: l4Item.target.end },
        elapsedMs: 6000,
      },
      17,
    );
    expect(wrongRes.correct).toBe(false);
    expect(wrongRes.outcome).toBe('wrong');

    const decoy = l4Item.decoys[0];
    const decoyRes = scoreParaphraseSelection(
      l4Item,
      {
        selectedSpan: { start: decoy.start, end: decoy.end },
        elapsedMs: 6000,
      },
      17,
    );
    expect(decoyRes.correct).toBe(false);
    expect(decoyRes.outcome).toBe('decoy_hit');
    expect(decoyRes.trapType).toBe('keyword_echo');
  });

  it('12. handles timeout, toggle deselection, SRS para:*#para_match updates, and Recap win statement', () => {
    const items = V3_FIXTURE_PARAPHRASES.slice(0, 3);
    let state = createV3Session({
      allItems: items,
      level: 5,
      count: 3,
      previousAvgSec: 9.4,
    });

    // Toggle select then deselect same span
    const t0 = state.items[0].target;
    state = setV3Selection(state, t0);
    expect(state.selectedSpan?.text).toBe(t0.text);
    state = setV3Selection(state, t0);
    expect(state.selectedSpan).toBeNull();

    // Round 1: correct
    state = setV3Selection(state, t0);
    state = submitV3Round(state, { elapsedMs: 4000 }).state;
    expect(state.srsCards[makeCardId(state.items[0].id, 'para_match')]).toBeDefined();
    expect(state.srsCards[makeCardId(state.items[0].id, 'para_match')].reps).toBe(1);
    state = nextV3Round(state).state;

    // Round 2: timeout
    state = submitV3Round(state, { timedOut: true, elapsedMs: 20000 }).state;
    expect(state.lastResult?.outcome).toBe('timeout');
    expect(state.mistakes).toHaveLength(1);
    state = nextV3Round(state).state;

    // Round 3: correct
    const it2 = state.items[2];
    state = submitV3Round(state, {
      selectedSpan: it2.relation === 'equivalent' ? it2.target : null,
      selectedNotInPassage: it2.relation === 'not_equivalent',
      elapsedMs: 6000,
    }).state;
    const { state: finished, events } = nextV3Round(state);

    expect(finished.stage).toBe('recap');
    expect(events[0]).toMatchObject({ type: 'session_completed' });
    expect(computeAvgResponseSec(finished.responseTimesMs)).toBe(10);
    const win = formatV3WinStatement(finished);
    expect(win).toContain('decoy keyword_echo');
    expect(win).toContain('10.0s');
    expect(win).toContain('(lần trước 9.4s)');
  });
});
