import { describe, expect, it } from 'vitest';
import {
  applyWritingCaps,
  computeCombinedWritingBand,
  computeOverallIeltsBand,
  computeSpeakingBand,
  computeWritingTaskBand,
  getMinWordsForWriting,
  roundBandHalf,
} from './bands';

describe('grading/bands', () => {
  it('rounds scores according to official IELTS 0.5 rules (.25 -> .5, .75 -> +1)', () => {
    expect(roundBandHalf(6.0)).toBe(6.0);
    expect(roundBandHalf(6.125)).toBe(6.0);
    expect(roundBandHalf(6.24)).toBe(6.0);
    expect(roundBandHalf(6.25)).toBe(6.5);
    expect(roundBandHalf(6.375)).toBe(6.5);
    expect(roundBandHalf(6.625)).toBe(6.5);
    expect(roundBandHalf(6.74)).toBe(6.5);
    expect(roundBandHalf(6.75)).toBe(7.0);
    expect(roundBandHalf(7.875)).toBe(8.0);
    expect(roundBandHalf(9.4)).toBe(9.0);
    expect(roundBandHalf(-1)).toBe(0);
  });

  it('returns official minimum words for Task 1 (150) and Task 2 (250)', () => {
    expect(getMinWordsForWriting('task1')).toBe(150);
    expect(getMinWordsForWriting('task2')).toBe(250);
  });

  it('computes Writing task band from 4 criteria without penalty when word count is sufficient', () => {
    const res = computeWritingTaskBand(
      { TR_TA: 7.0, CC: 7.0, LR: 6.0, GRA: 6.5 },
      { kind: 'task2', wordCount: 270, relevance: 'on_topic' },
    );
    // (7 + 7 + 6 + 6.5) / 4 = 6.625 -> 6.5
    expect(res.rawAverage).toBeCloseTo(6.625);
    expect(res.overallBand).toBe(6.5);
    expect(res.penalties).toHaveLength(0);
    expect(res.adjustedCriteria.TR_TA).toBe(7.0);
  });

  it('caps TR_TA at 5.5 when Task 2 has fewer than 250 words', () => {
    const res = computeWritingTaskBand(
      { TR_TA: 7.5, CC: 7.0, LR: 7.0, GRA: 7.0 },
      { kind: 'task2', wordCount: 210, relevance: 'on_topic' },
    );
    expect(res.adjustedCriteria.TR_TA).toBe(5.5);
    // (5.5 + 7 + 7 + 7) / 4 = 6.625 -> 6.5
    expect(res.overallBand).toBe(6.5);
    expect(res.penalties).toHaveLength(1);
    expect(res.penalties[0].code).toBe('under_length');
    expect(res.penalties[0].capApplied).toBe(true);
  });

  it('caps TR_TA at 5.5 when Task 1 has fewer than 150 words, but does not cap at exact 150', () => {
    const under = applyWritingCaps(
      { TR_TA: 7.0, CC: 6.5, LR: 6.5, GRA: 6.5 },
      { kind: 'task1', wordCount: 149, overviewPresent: true },
    );
    expect(under.adjustedCriteria.TR_TA).toBe(5.5);
    expect(under.penalties[0].code).toBe('under_length');

    const exact = applyWritingCaps(
      { TR_TA: 7.0, CC: 6.5, LR: 6.5, GRA: 6.5 },
      { kind: 'task1', wordCount: 150, overviewPresent: true },
    );
    expect(exact.adjustedCriteria.TR_TA).toBe(7.0);
    expect(exact.penalties).toHaveLength(0);
  });

  it('applies strictest cap (5.0) when essay is off_topic and also under length', () => {
    const res = applyWritingCaps(
      { TR_TA: 7.0, CC: 7.0, LR: 7.0, GRA: 7.0 },
      { kind: 'task2', wordCount: 180, relevance: 'off_topic' },
    );
    expect(res.adjustedCriteria.TR_TA).toBe(5.0);
    expect(res.penalties.map((p) => p.code)).toEqual(['under_length', 'off_topic']);
  });

  it('caps Task 1 TA at 5.5 when overviewPresent is false', () => {
    const res = applyWritingCaps(
      { TR_TA: 6.5, CC: 7.0, LR: 7.0, GRA: 7.0 },
      { kind: 'task1', wordCount: 170, overviewPresent: false },
    );
    expect(res.adjustedCriteria.TR_TA).toBe(5.5);
    expect(res.penalties[0].code).toBe('no_overview');
  });

  it('computes combined IELTS Writing band using (T1 + 2*T2) / 3', () => {
    // (6.0 + 2 * 7.5) / 3 = 7.0
    expect(computeCombinedWritingBand(6.0, 7.5)).toBe(7.0);
    // (6.5 + 2 * 7.0) / 3 = 6.8333 -> 7.0
    expect(computeCombinedWritingBand(6.5, 7.0)).toBe(7.0);
    // (7.5 + 2 * 6.5) / 3 = 6.8333 -> 7.0
    expect(computeCombinedWritingBand(7.5, 6.5)).toBe(7.0);
    // (6.0 + 2 * 6.5) / 3 = 6.3333 -> 6.5
    expect(computeCombinedWritingBand(6.0, 6.5)).toBe(6.5);
  });

  it('computes Speaking band and Overall 4-skill IELTS band', () => {
    const sp = computeSpeakingBand({ FC: 6.5, LR: 6.5, GRA: 6.5, P: 6.0 });
    // 25.5 / 4 = 6.375 -> 6.5
    expect(sp.overallBand).toBe(6.5);

    // Profile A from docs/01 §1: L 8.5, R 8.5, W 7.0, S 7.5 -> 7.875 -> 8.0
    expect(computeOverallIeltsBand(8.5, 8.5, 7.0, 7.5)).toBe(8.0);
  });
});
