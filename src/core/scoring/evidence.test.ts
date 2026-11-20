import { describe, expect, it } from 'vitest';
import { computeCharIoU, computeWordIoU, evaluateEvidence } from './evidence';

describe('evidence — Highlight IoU verification', () => {
  it('computes exact, partial, disjoint, and invalid char IoU', () => {
    expect(computeCharIoU({ start: 10, end: 50 }, { start: 10, end: 50 })).toBe(1);
    expect(computeCharIoU({ start: 0, end: 10 }, { start: 20, end: 30 })).toBe(0);
    expect(computeCharIoU({ start: 10, end: 10 }, { start: 10, end: 20 })).toBe(0);
    // Overlap [20, 40) = 20, union [10, 50) = 40 -> 0.5
    expect(computeCharIoU({ start: 10, end: 40 }, { start: 20, end: 50 })).toBeCloseTo(0.5);
  });

  it('computes word-level IoU', () => {
    expect(
      computeWordIoU(
        'The study showed a sharp decline in bees.',
        'The study showed a sharp decline in bees.',
      ),
    ).toBe(1);
    expect(computeWordIoU('', 'something')).toBe(0);
    const partial = computeWordIoU(
      'showed a sharp decline in bees',
      'The study showed a sharp decline in bees.',
    );
    expect(partial).toBeGreaterThan(0.7);
  });

  it('passes when char IoU >= 0.5 in matching paragraph and fails on wrong paragraph', () => {
    const gold = [{ paragraph: 'B', start: 100, end: 200, quote: 'evidence sentence' }];
    const ok = evaluateEvidence([{ paragraph: 'B', start: 110, end: 210 }], gold);
    expect(ok.passed).toBe(true);
    expect(ok.iou).toBeGreaterThanOrEqual(0.5);
    expect(ok.bestMatchIndex).toBe(0);

    const wrongPara = evaluateEvidence([{ paragraph: 'A', start: 100, end: 200 }], gold);
    expect(wrongPara.passed).toBe(false);
    expect(wrongPara.iou).toBe(0);
  });

  it('combines multiple adjacent/overlapping highlights in the same paragraph', () => {
    const gold = [{ paragraph: 'C', start: 0, end: 100 }];
    const res = evaluateEvidence(
      [
        { paragraph: 'C', start: 0, end: 50 },
        { paragraph: 'C', start: 45, end: 95 },
      ],
      gold,
    );
    expect(res.passed).toBe(true);
    expect(res.iou).toBeCloseTo(0.95);
  });

  it('evaluates word mode and handles NOT GIVEN empty goldEvidence', () => {
    const ng = evaluateEvidence([], []);
    expect(ng.passed).toBe(true);
    expect(ng.notRequired).toBe(true);

    const emptyHighlight = evaluateEvidence([], [{ paragraph: 'A', start: 0, end: 20 }]);
    expect(emptyHighlight.passed).toBe(false);

    const wordRes = evaluateEvidence(
      [{ paragraph: 'A', start: 0, end: 0, quote: 'some researchers argue that sleep helps memory' }],
      [{ paragraph: 'A', start: 0, end: 0, quote: 'researchers argue that sleep helps memory consolidation' }],
      { mode: 'word', threshold: 0.5 },
    );
    expect(wordRes.passed).toBe(true);
  });
});
