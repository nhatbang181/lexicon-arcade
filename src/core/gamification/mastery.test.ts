import { describe, expect, it } from 'vitest';
import { computeMasteryMetrics, isCardMasteredPP16 } from './mastery';
import { createInitialStreak, toStreakEvent, updateStreak } from './streak';

const DAY_MS = 86_400_000;

describe('src/core/gamification/mastery (PP-07 & PP-16)', () => {
  it('marks card mastered only when stability >= 21 days AND last 3 reviews are correct', () => {
    const baseTs = Date.UTC(2026, 5, 1, 10, 0, 0);
    expect(
      isCardMasteredPP16(
        { id: 'c1', stability: 25 },
        [
          { ts: baseTs, correct: true },
          { ts: baseTs + DAY_MS, correct: true },
          { ts: baseTs + 2 * DAY_MS, correct: true },
        ],
      ),
    ).toBe(true);

    // Stability < 21 -> not mastered
    expect(
      isCardMasteredPP16(
        { id: 'c2', stability: 20.9 },
        [
          { ts: baseTs, correct: true },
          { ts: baseTs + DAY_MS, correct: true },
          { ts: baseTs + 2 * DAY_MS, correct: true },
        ],
      ),
    ).toBe(false);

    // Recent review incorrect -> not mastered even if stability >= 21
    expect(
      isCardMasteredPP16(
        { id: 'c3', stability: 30 },
        [
          { ts: baseTs, correct: true },
          { ts: baseTs + DAY_MS, correct: true },
          { ts: baseTs + 2 * DAY_MS, correct: true },
          { ts: baseTs + 3 * DAY_MS, correct: false },
        ],
      ),
    ).toBe(false);
  });

  it('computes delayed retention rate for reviews spaced >= 7 days apart (PP-07)', () => {
    const t0 = Date.UTC(2026, 5, 1, 10, 0, 0);
    const metrics = computeMasteryMetrics(
      [
        { id: 'c1', stability: 28 },
        { id: 'c2', stability: 14 },
      ],
      [
        { cardId: 'c1', ts: t0, correct: true },
        { cardId: 'c1', ts: t0 + 2 * DAY_MS, correct: true }, // gap 2d -> not delayed
        { cardId: 'c1', ts: t0 + 10 * DAY_MS, correct: true }, // gap 8d -> delayed correct
        { cardId: 'c2', ts: t0, correct: true },
        { cardId: 'c2', ts: t0 + 8 * DAY_MS, correct: false }, // gap 8d -> delayed incorrect
      ],
    );

    expect(metrics.masteredCount).toBe(1);
    expect(metrics.stableCount).toBe(1);
    expect(metrics.delayedRetention.total).toBe(2);
    expect(metrics.delayedRetention.correct).toBe(1);
    expect(metrics.delayedRetention.rate).toBeCloseTo(0.5);
  });

  it('maps StreakUpdateResult to StreakEvent including freeze_used and freeze_earned', () => {
    let st = createInitialStreak();
    const first = updateStreak(st, '2026-06-01');
    expect(toStreakEvent(first).kind).toBe('started');
    st = first.state;

    // Skip 2026-06-02, study on 2026-06-03 -> uses initial freeze
    const frozen = updateStreak(st, '2026-06-03');
    const ev = toStreakEvent(frozen);
    expect(ev.kind).toBe('freeze_used');
    expect(ev.freezeUsed).toBe(true);
    expect(ev.protectedDate).toBe('2026-06-02');
  });
});
