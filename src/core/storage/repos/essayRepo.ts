import { db as defaultDb, type EssayRecord, type LexiconV3DB } from '../db';

export interface EssayDraftRecord {
  taskType: 'task1' | 'task2';
  promptId: string;
  task1File?: string;
  mode: 'training' | 'exam';
  text: string;
  planNotes: string;
  elapsedSec: number;
  revisionNumber: number;
  v1EssayId?: number | null;
  updatedAt: number;
}

export interface EssayMetaRecord {
  essayId: number;
  attemptId: string;
  pasted: boolean;
  mode: 'training' | 'exam';
  durationSec: number;
  gradedFirstTime?: boolean;
}

const DRAFT_KV_KEY = 'w1.activeDraft';
const META_KV_PREFIX = 'w1.essayMeta.';
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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
    await database.kv.delete(`${META_KV_PREFIX}${id}`);
  },

  /** Lưu nháp W1 thật vào IndexedDB (kv) để khôi phục sau reload (W1-01). */
  async saveDraft(
    draft: Omit<EssayDraftRecord, 'updatedAt'> & { updatedAt?: number },
    database: LexiconV3DB = defaultDb,
  ): Promise<EssayDraftRecord> {
    const record: EssayDraftRecord = {
      ...draft,
      updatedAt: draft.updatedAt ?? Date.now(),
    };
    await database.kv.put({ key: DRAFT_KV_KEY, value: record });
    return record;
  },

  /** Đọc nháp W1 nếu còn mới (< 24h) và có nội dung (W1-01). */
  async loadDraft(
    now = Date.now(),
    database: LexiconV3DB = defaultDb,
  ): Promise<EssayDraftRecord | null> {
    const row = await database.kv.get(DRAFT_KV_KEY);
    if (!row || typeof row.value !== 'object' || row.value === null) return null;
    const draft = row.value as Partial<EssayDraftRecord>;
    if (
      (draft.taskType !== 'task1' && draft.taskType !== 'task2') ||
      typeof draft.promptId !== 'string' ||
      typeof draft.text !== 'string' ||
      typeof draft.updatedAt !== 'number'
    ) {
      return null;
    }
    if (now - draft.updatedAt > DRAFT_MAX_AGE_MS || !draft.text.trim()) {
      return null;
    }
    return {
      taskType: draft.taskType,
      promptId: draft.promptId,
      task1File: typeof draft.task1File === 'string' ? draft.task1File : undefined,
      mode: draft.mode === 'exam' ? 'exam' : 'training',
      text: draft.text,
      planNotes: typeof draft.planNotes === 'string' ? draft.planNotes : '',
      elapsedSec: typeof draft.elapsedSec === 'number' && draft.elapsedSec >= 0 ? draft.elapsedSec : 0,
      revisionNumber: typeof draft.revisionNumber === 'number' ? draft.revisionNumber : 0,
      v1EssayId: typeof draft.v1EssayId === 'number' ? draft.v1EssayId : null,
      updatedAt: draft.updatedAt,
    };
  },

  async clearDraft(database: LexiconV3DB = defaultDb): Promise<void> {
    await database.kv.delete(DRAFT_KV_KEY);
  },

  /** Lưu metadata của bài viết (attemptId, pasted, mode, durationSec) cho Portfolio & W1-06. */
  async saveMeta(
    meta: EssayMetaRecord,
    database: LexiconV3DB = defaultDb,
  ): Promise<void> {
    await database.kv.put({ key: `${META_KV_PREFIX}${meta.essayId}`, value: meta });
  },

  async getMeta(
    essayId: number,
    database: LexiconV3DB = defaultDb,
  ): Promise<EssayMetaRecord | null> {
    const row = await database.kv.get(`${META_KV_PREFIX}${essayId}`);
    if (!row || typeof row.value !== 'object' || row.value === null) return null;
    return row.value as EssayMetaRecord;
  },
};
