import type { IeltsSkill } from '../../band/estimator';
import { db as defaultDb, type BandSnapshotRecord, type LexiconV3DB } from '../db';

export const bandRepo = {
  async add(
    snapshot: Omit<BandSnapshotRecord, 'id'>,
    database: LexiconV3DB = defaultDb,
  ): Promise<number> {
    const id = await database.bandSnapshots.add(snapshot);
    return id ?? 0;
  },

  async list(
    options: { skill?: IeltsSkill; limit?: number } = {},
    database: LexiconV3DB = defaultDb,
  ): Promise<BandSnapshotRecord[]> {
    const { skill, limit } = options;
    const rows = skill
      ? await database.bandSnapshots.where('skill').equals(skill).toArray()
      : await database.bandSnapshots.toArray();
    rows.sort((a, b) => b.ts - a.ts);
    return limit !== undefined ? rows.slice(0, limit) : rows;
  },

  async getLatest(
    skill: IeltsSkill,
    database: LexiconV3DB = defaultDb,
  ): Promise<BandSnapshotRecord | undefined> {
    const rows = await bandRepo.list({ skill, limit: 1 }, database);
    return rows[0];
  },
};
