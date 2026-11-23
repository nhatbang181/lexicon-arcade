import { describe, expect, it } from 'vitest';
import { buildTodayPlan, type GameId } from '../../core/planner/today';
import { ensureReadyTasks, swapToReadyGame } from './readyPlan';

const ALL: GameId[] = ['v1', 'v2', 'v3', 'r1', 'r2', 'l1', 'l2', 'w1', 'w2', 's1', 's2', 'x1'];
const READY = new Set<GameId>(['v1', 'v2', 'v3', 'r1', 'r2', 'l1', 'l2', 'w1', 'w2']);
const isReady = (g: GameId) => READY.has(g);

const profile = {
  targetBands: { L: 8.5, R: 8.5, W: 7.5, S: 7.5 },
  estimatedBands: { L: null, R: null, W: null, S: 5 },
};

describe('kế hoạch Hôm nay chỉ gồm game sẵn sàng (F12)', () => {
  it('thay các việc trỏ vào game chưa có (S2, X1...) bằng game sẵn sàng', () => {
    const plan = buildTodayPlan({
      profile: { ...profile, dailyGoalMin: 60 },
      dueCardsCount: 12,
      now: new Date('2026-11-28T03:00:00Z'), // cuối tuần để kích hoạt x1
      recentAttempts: [{ gameId: 'x1', startedAt: new Date('2026-11-10T03:00:00Z').getTime() }],
    });
    const fixed = ensureReadyTasks(plan, ALL, isReady);
    expect(fixed.tasks.length).toBeGreaterThan(0);
    for (const t of fixed.tasks) expect(isReady(t.gameId)).toBe(true);
    expect(new Set(fixed.tasks.map((t) => t.gameId)).size).toBe(fixed.tasks.length);
  });

  it('"Đổi bài" 50 lần không bao giờ ra game chưa sẵn sàng hoặc trùng việc khác', () => {
    let plan = ensureReadyTasks(
      buildTodayPlan({ profile, dueCardsCount: 5, now: new Date('2026-11-25T03:00:00Z') }),
      ALL,
      isReady,
    );
    for (let i = 0; i < 50; i++) {
      const task = plan.tasks[i % plan.tasks.length];
      const next = swapToReadyGame(plan, task, ALL, isReady, (c) => c[i % c.length]);
      if (next) plan = next;
      for (const t of plan.tasks) expect(isReady(t.gameId)).toBe(true);
      expect(new Set(plan.tasks.map((t) => t.gameId)).size).toBe(plan.tasks.length);
    }
  });

  it('hết game trống thì trả null, không đổi bậy', () => {
    const plan = buildTodayPlan({ profile, dueCardsCount: 5, now: new Date('2026-11-25T03:00:00Z') });
    expect(swapToReadyGame(plan, plan.tasks[0], ['v1'], isReady)).toBeNull();
  });
});
