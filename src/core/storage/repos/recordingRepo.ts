import { db as defaultDb, type LexiconV3DB, type RecordingRecord } from '../db';

export const AUDIO_STORAGE_WARNING_BYTES = 300 * 1024 * 1024; // 300 MB (docs/03 §4)

export const recordingRepo = {
  async save(
    recording: Omit<RecordingRecord, 'id'>,
    database: LexiconV3DB = defaultDb,
  ): Promise<number> {
    const id = await database.recordings.add(recording);
    return id ?? 0;
  },

  async get(id: number, database: LexiconV3DB = defaultDb): Promise<RecordingRecord | undefined> {
    return database.recordings.get(id);
  },

  async list(
    filter: { part?: 1 | 2 | 3 | 'full'; promptId?: string } = {},
    database: LexiconV3DB = defaultDb,
  ): Promise<RecordingRecord[]> {
    let rows = await database.recordings.toArray();
    if (filter.part !== undefined) {
      rows = rows.filter((r) => r.part === filter.part);
    }
    if (filter.promptId !== undefined) {
      rows = rows.filter((r) => r.promptId === filter.promptId);
    }
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getTotalAudioBytes(database: LexiconV3DB = defaultDb): Promise<number> {
    const rows = await database.recordings.toArray();
    return rows.reduce((sum, r) => sum + (r.audioBlob ? r.audioBytes : 0), 0);
  },

  /**
   * Remove audio blobs older than `olderThanDays` while preserving transcripts & scores (docs/03 §4).
   */
  async pruneOldAudioBlobs(
    olderThanDays = 60,
    nowMs = Date.now(),
    database: LexiconV3DB = defaultDb,
  ): Promise<{ prunedCount: number; freedBytes: number }> {
    const cutoff = nowMs - olderThanDays * 86_400_000;
    let prunedCount = 0;
    let freedBytes = 0;

    await database.transaction('rw', database.recordings, async () => {
      const old = await database.recordings.where('createdAt').below(cutoff).toArray();
      for (const rec of old) {
        if (rec.id !== undefined && rec.audioBlob) {
          freedBytes += rec.audioBytes;
          prunedCount++;
          await database.recordings.update(rec.id, {
            audioBlob: null,
            audioBytes: 0,
          });
        }
      }
    });

    return { prunedCount, freedBytes };
  },
};
