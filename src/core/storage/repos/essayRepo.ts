import { db as defaultDb, type EssayRecord, type LexiconV3DB } from '../db';

export const essayRepo = {
  async save(
    essay: Omit<EssayRecord, 'id'>,
    database: LexiconV3DB = defaultDb,
  ): Promise<number> {
    const id = await database.essays.add(essay);
    return id ?? 0;
  },

  async get(id: number, database: LexiconV3DB = defaultDb): Promise<EssayRecord | undefined> {
    return database.essays.get(id);
  },

  async list(
    filter: { taskType?: 'task1' | 'task2'; promptId?: string } = {},
    database: LexiconV3DB = defaultDb,
  ): Promise<EssayRecord[]> {
    let rows = await database.essays.toArray();
    if (filter.taskType) {
      rows = rows.filter((e) => e.taskType === filter.taskType);
    }
    if (filter.promptId) {
      rows = rows.filter((e) => e.promptId === filter.promptId);
    }
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },

  async update(
    id: number,
    patch: Partial<Omit<EssayRecord, 'id'>>,
    database: LexiconV3DB = defaultDb,
  ): Promise<void> {
    await database.essays.update(id, { ...patch, updatedAt: Date.now() });
  },

  async remove(id: number, database: LexiconV3DB = defaultDb): Promise<void> {
    await database.essays.delete(id);
  },
};
