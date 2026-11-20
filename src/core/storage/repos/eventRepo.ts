import { db as defaultDb, type AppEventRecord, type LexiconV3DB } from '../db';

export const eventRepo = {
  async log(
    type: string,
    payload?: Record<string, unknown>,
    ts = Date.now(),
    database: LexiconV3DB = defaultDb,
  ): Promise<number> {
    const id = await database.events.add({ type, ts, payload });
    return id ?? 0;
  },

  async listRecent(
    options: { type?: string; limit?: number } = {},
    database: LexiconV3DB = defaultDb,
  ): Promise<AppEventRecord[]> {
    const { type, limit = 100 } = options;
    const rows = type
      ? await database.events.where('type').equals(type).toArray()
      : await database.events.toArray();
    return rows.sort((a, b) => b.ts - a.ts).slice(0, limit);
  },

  async pruneBefore(beforeTs: number, database: LexiconV3DB = defaultDb): Promise<number> {
    return database.events.where('ts').below(beforeTs).delete();
  },
};
