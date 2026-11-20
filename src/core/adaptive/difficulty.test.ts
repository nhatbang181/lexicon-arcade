import { describe, expect, it } from 'vitest';
import { adjustDifficulty, levelToTier, tierToLevel, type TurnOutcome } from './difficulty';

function makeTurns(correctCount: number, total: number, responseTimeMs?: number, expectedTimeMs?: number): TurnOutcome[] {
  return Array.from({ length: total }, (_, i) => ({
    correct: i < correctCount,
    responseTimeMs,
    expectedTimeMs,
  }));
}

describe('src/core/adaptive/difficulty', () => {
  it('maps levels 1..10 <-> tiers 1..5 accurately', () => {
    expect(levelToTier(1)).toBe(1);
    expect(levelToTier(2)).toBe(1);
    expect(levelToTier(5)).toBe(3);
    expect(levelToTier(10)).toBe(5);
    expect(tierToLevel(1)).toBe(1);
    expect(tierToLevel(3)).toBe(5);
    expect(tierToLevel(5)).toBe(9);
  });

  it('skips adjustment in exam mode, insufficient samples, or cooldown', () => {
    const high = makeTurns(20, 20);
    expect(
      adjustDifficulty({ level: 3, turnsSinceLastChange: 15 }, high, { mode: 'exam' }).reason,
    ).toBe('exam_mode');
    expect(
      adjustDifficulty({ level: 3, turnsSinceLastChange: 15 }, makeTurns(5, 5)).reason,
    ).toBe('insufficient_samples');
    expect(
      adjustDifficulty({ level: 3, turnsSinceLastChange: 4 }, high).reason,
    ).toBe('cooldown');
  });

  it('levels up on >90% accuracy or fast mastery, and levels down on <70% or slow struggle', () => {
    const up = adjustDifficulty({ level: 3, turnsSinceLastChange: 12 }, makeTurns(19, 20));
    expect(up.changed).toBe(true);
    expect(up.direction).toBe('up');
    expect(up.nextLevel).toBe(4);
    expect(up.turnsSinceLastChange).toBe(0);

    const fastUp = adjustDifficulty(
      { level: 2, turnsSinceLastChange: 12 },
      makeTurns(17, 20, 3000, 5000), // 85% accuracy, 0.6x speed
      { maxLevel: 5 },
    );
    expect(fastUp.nextLevel).toBe(3);
    expect(fastUp.tier).toBe(3);
    expect(fastUp.reason).toBe('fast_mastery');

    const down = adjustDifficulty({ level: 4, turnsSinceLastChange: 10 }, makeTurns(12, 20));
    expect(down.direction).toBe('down');
    expect(down.nextLevel).toBe(3);

    const slowDown = adjustDifficulty(
      { level: 4, turnsSinceLastChange: 10 },
      makeTurns(15, 20, 8000, 5000), // 75% accuracy, 1.6x speed
    );
    expect(slowDown.direction).toBe('down');
    expect(slowDown.reason).toBe('slow_struggle');

    const hold = adjustDifficulty({ level: 4, turnsSinceLastChange: 12 }, makeTurns(16, 20));
    expect(hold.changed).toBe(false);
    expect(hold.reason).toBe('in_target_zone');
  });
});
