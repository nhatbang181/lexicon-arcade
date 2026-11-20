import { describe, expect, it } from 'vitest';
import { buildTodayPlan, swapPlanTask, type PlannerProfileInput } from './today';

describe('src/core/planner/today', () => {
  const baseProfile: PlannerProfileInput = {
    targetBands: { L: 8.5, R: 8.5, W: 7.5, S: 7.5 },
    estimatedBands: { L: 6.5, R: 7.5, W: 6.5, S: 7.0 },
    skillLevels: { l1: 2, l2: 1, r1: 3, r2: 2, w1: 1, w2: 2, s1: 1, s2: 1 },
    dailyGoalMin: 50,
  };

  it('puts V1 Daily Run first when cards are due, targets weakest skill, and produces 3-4 unique tasks', () => {
    const plan = buildTodayPlan({
      profile: baseProfile,
      dueCardsCount: 30,
      now: new Date('2026-06-03T08:00:00Z'), // Wednesday
      recentAttempts: [],
    });

    expect(plan.tasks[0].gameId).toBe('v1');
    expect(plan.weakestSkill).toBe('L'); // gap 2.0 (8.5 - 6.5) > W gap 1.0
    expect(plan.tasks.length).toBeGreaterThanOrEqual(3);
    expect(plan.tasks.length).toBeLessThanOrEqual(4);
    expect(plan.tasks.some((t) => t.gameId === 'l2' || t.gameId === 'l1')).toBe(true);

    // No duplicate gameIds
    const ids = new Set(plan.tasks.map((t) => t.gameId));
    expect(ids.size).toBe(plan.tasks.length);
  });

  it('respects 15-minute busy day mode (Daily Run + 1 short game)', () => {
    const plan = buildTodayPlan({
      profile: { ...baseProfile, dailyGoalMin: 15 },
      dueCardsCount: 10,
      now: new Date('2026-06-03T08:00:00Z'),
    });
    expect(plan.tasks.length).toBe(2);
    expect(plan.tasks[0].gameId).toBe('v1');
    expect(plan.totalMinutes).toBeLessThanOrEqual(20);
  });

  it('schedules weekly X1 Exam Room on weekends when >= 7 days since last exam', () => {
    const plan = buildTodayPlan({
      profile: baseProfile,
      dueCardsCount: 0,
      now: new Date('2026-06-06T08:00:00Z'), // Saturday
      recentAttempts: [
        { gameId: 'x1', startedAt: new Date('2026-05-25T08:00:00Z').getTime() },
      ],
    });
    expect(plan.tasks.some((t) => t.gameId === 'x1' && t.mode === 'exam')).toBe(true);
  });

  it('rotates productive skills W/S so non-weakest W is skipped if played yesterday', () => {
    const now = new Date('2026-06-03T08:00:00Z');
    const yesterday = new Date('2026-06-02T10:00:00Z').getTime();
    const plan = buildTodayPlan({
      profile: baseProfile, // L gap = 2.0 (weakest), W gap = 1.0, R gap = 1.0
      dueCardsCount: 20,
      now,
      recentAttempts: [{ gameId: 'w1', startedAt: yesterday }],
    });
    expect(plan.tasks.some((t) => t.gameId === 'w1' || t.gameId === 'w2')).toBe(false);
  });

  it('swaps a planned task cleanly when user clicks "Đổi"', () => {
    const plan = buildTodayPlan({
      profile: baseProfile,
      dueCardsCount: 15,
      now: new Date('2026-06-03T08:00:00Z'),
    });
    const targetId = plan.tasks[1].id;
    const swapped = swapPlanTask(plan, targetId, 'v3');
    expect(swapped.tasks[1].gameId).toBe('v3');
    expect(swapped.tasks[1].title).toBe('Paraphrase Radar');
  });
});
