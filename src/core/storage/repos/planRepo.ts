import type { DailyPlan } from '../../planner/today';
import { db as defaultDb, type LexiconV3DB } from '../db';

export const planRepo = {
  async get(date: string, database: LexiconV3DB = defaultDb): Promise<DailyPlan | undefined> {
    return database.dailyPlans.get(date);
  },

  async save(plan: DailyPlan, database: LexiconV3DB = defaultDb): Promise<string> {
    return database.dailyPlans.put(plan);
  },

  async markTaskCompleted(
    date: string,
    taskId: string,
    database: LexiconV3DB = defaultDb,
  ): Promise<DailyPlan | undefined> {
    const existing = await database.dailyPlans.get(date);
    if (!existing) return undefined;
    const updated: DailyPlan = {
      ...existing,
      tasks: existing.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t,
      ),
    };
    await database.dailyPlans.put(updated);
    return updated;
  },
};
