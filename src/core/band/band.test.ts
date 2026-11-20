import { describe, expect, it } from 'vitest';
import { accuracyToBand, rawScoreToBand, roundIeltsBand } from './tables';
import {
  calculateOverallBand,
  decayWeight,
  estimateAllBands,
  type BandEvidence,
} from './estimator';

describe('src/core/band', () => {
  describe('tables & rounding', () => {
    it('converts Listening raw /40 scores per docs/01 §1', () => {
      expect(rawScoreToBand('L', 40)).toBe(9.0);
      expect(rawScoreToBand('L', 39)).toBe(9.0);
      expect(rawScoreToBand('L', 37)).toBe(8.5);
      expect(rawScoreToBand('L', 35)).toBe(8.0);
      expect(rawScoreToBand('L', 32)).toBe(7.5);
      expect(rawScoreToBand('L', 30)).toBe(7.0);
      expect(rawScoreToBand('L', 26)).toBe(6.5);
      expect(rawScoreToBand('L', 23)).toBe(6.0);
      expect(rawScoreToBand('L', 18)).toBe(5.5);
      expect(rawScoreToBand('L', 16)).toBe(5.0);
      expect(rawScoreToBand('L', 0)).toBe(0.0);
    });

    it('converts Academic Reading raw /40 scores per docs/01 §1', () => {
      expect(rawScoreToBand('R', 39)).toBe(9.0);
      expect(rawScoreToBand('R', 37)).toBe(8.5);
      expect(rawScoreToBand('R', 35)).toBe(8.0);
      expect(rawScoreToBand('R', 33)).toBe(7.5);
      expect(rawScoreToBand('R', 32)).toBe(7.0);
      expect(rawScoreToBand('R', 30)).toBe(7.0);
      expect(rawScoreToBand('R', 27)).toBe(6.5);
      expect(rawScoreToBand('R', 23)).toBe(6.0);
      expect(rawScoreToBand('R', 19)).toBe(5.5);
      expect(rawScoreToBand('R', 15)).toBe(5.0);
      expect(accuracyToBand('R', 0.9)).toBe(8.0); // 36/40 -> 8.0
    });

    it('rounds IELTS Overall Band correctly (.25 -> .5, .75 -> next integer)', () => {
      expect(roundIeltsBand(6.125)).toBe(6.0);
      expect(roundIeltsBand(6.25)).toBe(6.5);
      expect(roundIeltsBand(6.375)).toBe(6.5);
      expect(roundIeltsBand(6.625)).toBe(6.5);
      expect(roundIeltsBand(6.75)).toBe(7.0);
      expect(roundIeltsBand(7.875)).toBe(8.0); // Profile A & B from docs/01 §1
      expect(roundIeltsBand(-1)).toBe(0);
      expect(roundIeltsBand(9.8)).toBe(9);
    });

    it('calculateOverallBand returns null if any skill is missing', () => {
      expect(calculateOverallBand({ L: 8.5, R: 8.5, W: 7.0, S: 7.5 })).toBe(8.0);
      expect(calculateOverallBand({ L: 6.5, R: 6.5, W: 6.0, S: 6.0 })).toBe(6.5); // 6.25 -> 6.5
      expect(calculateOverallBand({ L: 7.0, R: 7.0, W: 6.5, S: 6.5 })).toBe(7.0); // 6.75 -> 7.0
      expect(calculateOverallBand({ L: 8.0, R: 8.0, W: null, S: 7.5 })).toBeNull();
    });
  });

  describe('estimator', () => {
    it('applies exponential time decay (half-life 30 days)', () => {
      expect(decayWeight(0, 30)).toBeCloseTo(1.0);
      expect(decayWeight(30, 30)).toBeCloseTo(0.5);
      expect(decayWeight(60, 30)).toBeCloseTo(0.25);
    });

    it('ignores training mode and requires >= 40 exam questions for L/R', () => {
      const now = new Date('2026-06-01T00:00:00Z');
      const evidence: BandEvidence[] = [
        // Training mode must be ignored
        { skill: 'L', ts: now.getTime(), mode: 'training', correct: 40, total: 40 },
        // Only 20 exam questions (< 40 threshold)
        { skill: 'L', ts: now.getTime(), mode: 'exam', correct: 18, total: 20 },
      ];
      const report = estimateAllBands(evidence, { now, allowPlacementFallback: false });
      expect(report.L.band).toBeNull();
      expect(report.L.sampleSize).toBe(20);
      expect(report.overall).toBeNull();
    });

    it('weights recent exam evidence higher than old evidence and computes confidence levels', () => {
      const now = new Date('2026-06-01T00:00:00Z');
      const day = 86_400_000;
      const evidence: BandEvidence[] = [
        // Old L exam: 24/40 (6.0), 90 days ago -> weight 0.125
        { skill: 'L', ts: now.getTime() - 90 * day, mode: 'exam', correct: 24, total: 40 },
        // Recent L exams: 36/40 (8.0) and 38/40 (8.5)
        { skill: 'L', ts: now.getTime() - 2 * day, mode: 'exam', correct: 36, total: 40 },
        { skill: 'L', ts: now.getTime() - 1 * day, mode: 'exam', correct: 38, total: 40 },
        // Reading: 2 exams -> 80 questions -> medium confidence
        { skill: 'R', ts: now.getTime() - 3 * day, mode: 'exam', correct: 35, total: 40 },
        { skill: 'R', ts: now.getTime() - 1 * day, mode: 'exam', correct: 35, total: 40 },
        // Writing: Task 2 has double weight over Task 1 + biasOffset applied to Claude
        { skill: 'W', ts: now.getTime() - 2 * day, mode: 'claude', band: 6.5, taskType: 'task1' },
        { skill: 'W', ts: now.getTime() - 1 * day, mode: 'claude', band: 7.5, taskType: 'task2' },
        // Speaking: 3 mocks -> high confidence
        { skill: 'S', ts: now.getTime() - 5 * day, mode: 'claude', band: 7.0 },
        { skill: 'S', ts: now.getTime() - 3 * day, mode: 'claude', band: 7.5 },
        { skill: 'S', ts: now.getTime() - 1 * day, mode: 'claude', band: 7.5 },
      ];

      const report = estimateAllBands(evidence, { now, writingBiasOffset: -0.25 });
      expect(report.L.band).toBeGreaterThanOrEqual(8.0);
      expect(report.L.confidenceLevel).toBe('high'); // 120 questions
      expect(report.L.confidenceMargin).toBeGreaterThan(0);

      expect(report.R.band).toBe(8.0);
      expect(report.R.confidenceLevel).toBe('medium'); // 80 questions

      expect(report.W.band).toBe(7.0); // weighted avg ~7.17 - 0.25 = 6.92 -> 7.0
      expect(report.S.band).toBe(7.5);
      expect(report.S.confidenceLevel).toBe('high');
      expect(report.overall).not.toBeNull();
    });

    it('falls back to placement evidence with low confidence and prioritizes official scores', () => {
      const now = new Date('2026-06-01T00:00:00Z');
      const evidence: BandEvidence[] = [
        { skill: 'L', ts: now.getTime(), mode: 'placement', correct: 12, total: 15 },
        { skill: 'R', ts: now.getTime(), mode: 'official', band: 7.5 },
        { skill: 'W', ts: now.getTime(), mode: 'placement', band: 6.0 },
        { skill: 'S', ts: now.getTime(), mode: 'placement', band: 6.5 },
      ];
      const report = estimateAllBands(evidence, { now, allowPlacementFallback: true });
      expect(report.L.band).toBe(7.5); // 12/15 * 40 = 32 -> 7.5
      expect(report.L.confidenceLevel).toBe('low');
      expect(report.R.band).toBe(7.5);
      expect(report.R.confidenceLevel).toBe('medium');
      expect(report.W.band).toBe(6.0);
      expect(report.S.band).toBe(6.5);
      expect(report.overall).toBe(7.0); // (7.5+7.5+6+6.5)/4 = 6.875 -> 7.0
    });
  });
});
