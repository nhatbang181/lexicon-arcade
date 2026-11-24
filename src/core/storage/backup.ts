import { z } from 'zod';
import {
  db as defaultDb,
  type AppEventRecord,
  type AttemptRecord,
  type BandSnapshotRecord,
  type EssayRecord,
  type KvRecord,
  type LexiconV3DB,
  type RecordingRecord,
  type ReviewRecord,
  type UserItemRecord,
  type UserProfile,
} from './db';
import type { SRSCard } from '../srs/fsrsAdapter';
import type { DailyPlan } from '../planner/today';

export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupDataPayload {
  profile: UserProfile[];
  cards: SRSCard[];
  reviews: ReviewRecord[];
  attempts: AttemptRecord[];
  essays: EssayRecord[];
  /** Audio Blobs are omitted in JSON backup to keep file size portable; transcripts & grades are preserved. */
  recordings: Array<Omit<RecordingRecord, 'audioBlob'>>;
  dailyPlans: DailyPlan[];
  bandSnapshots: BandSnapshotRecord[];
  events: AppEventRecord[];
  kv: KvRecord[];
  /** Có từ audit-max T1-A (Dexie v2). Backup cũ không có trường này vẫn đọc được. */
  userItems?: UserItemRecord[];
}

export interface BackupEnvelope {
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  checksum: string;
  data: BackupDataPayload;
}

const BackupEnvelopeSchema = z.object({
  schemaVersion: z.number().int().min(1),
  appVersion: z.string().min(1),
  exportedAt: z.string().min(1),
  checksum: z.string().min(8),
  data: z.object({
    profile: z.array(z.any()),
    cards: z.array(z.any()),
    reviews: z.array(z.any()),
    attempts: z.array(z.any()),
    essays: z.array(z.any()),
    recordings: z.array(z.any()),
    dailyPlans: z.array(z.any()),
    bandSnapshots: z.array(z.any()),
    events: z.array(z.any()),
    kv: z.array(z.any()),
    userItems: z.array(z.any()).optional(),
  }),
});

/**
 * Deterministic 64-bit FNV-1a checksum (formatted as 16-char hex) that works identically
 * across Node, jsdom, and all browsers without requiring async WebCrypto.
 */
export function computeChecksum(payloadString: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < payloadString.length; i++) {
    const ch = payloadString.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= (ch ^ (i & 0xff));
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}`;
}

/**
 * Export the entire LexiconV3DB IndexedDB state to a versioned, checksummed JSON backup.
 */
export async function exportBackup(
  database: LexiconV3DB = defaultDb,
  now: Date = new Date(),
): Promise<BackupEnvelope> {
  const [
    profile,
    cards,
    reviews,
    attempts,
    essays,
    rawRecordings,
    dailyPlans,
    bandSnapshots,
    events,
    kv,
    userItems,
  ] = await Promise.all([
    database.profile.toArray(),
    database.cards.toArray(),
    database.reviews.toArray(),
    database.attempts.toArray(),
    database.essays.toArray(),
    database.recordings.toArray(),
    database.dailyPlans.toArray(),
    database.bandSnapshots.toArray(),
    database.events.toArray(),
    database.kv.toArray(),
    database.userItems.toArray(),
  ]);

  const recordings = rawRecordings.map(({ audioBlob: _omit, ...rest }) => rest);

  const data: BackupDataPayload = {
    profile,
    cards,
    reviews,
    attempts,
    essays,
    recordings,
    dailyPlans,
    bandSnapshots,
    events,
    kv,
    userItems,
  };

  const checksum = computeChecksum(JSON.stringify(data));
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: '3.0.0',
    exportedAt: now.toISOString(),
    checksum,
    data,
  };
}

export async function exportBackupJson(
  database: LexiconV3DB = defaultDb,
  now: Date = new Date(),
): Promise<string> {
  const envelope = await exportBackup(database, now);
  return JSON.stringify(envelope, null, 2);
}

export interface BackupVerificationResult {
  valid: boolean;
  error?: string;
  envelope?: BackupEnvelope;
}

/**
 * Verify a backup JSON string or object for structure, supported version, and integrity checksum.
 */
export function verifyBackup(input: string | unknown): BackupVerificationResult {
  let obj: unknown;
  if (typeof input === 'string') {
    try {
      obj = JSON.parse(input);
    } catch {
      return { valid: false, error: 'Invalid JSON format' };
    }
  } else {
    obj = input;
  }

  const parsed = BackupEnvelopeSchema.safeParse(obj);
  if (!parsed.success) {
    return { valid: false, error: `Invalid backup structure: ${parsed.error.message}` };
  }

  if (parsed.data.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `Unsupported backup schemaVersion ${parsed.data.schemaVersion}`,
    };
  }

  const expectedChecksum = computeChecksum(JSON.stringify(parsed.data.data));
  if (expectedChecksum !== parsed.data.checksum) {
    return {
      valid: false,
      error: 'Backup checksum mismatch — file may be corrupted or modified',
    };
  }

  return { valid: true, envelope: parsed.data as BackupEnvelope };
}

/**
 * Safely restore a verified backup into IndexedDB inside a single atomic transaction.
 */
export async function importBackup(
  input: string | BackupEnvelope,
  database: LexiconV3DB = defaultDb,
): Promise<{ restoredCounts: Record<keyof BackupDataPayload, number> }> {
  const verification = verifyBackup(input);
  if (!verification.valid || !verification.envelope) {
    throw new Error(verification.error ?? 'Backup verification failed');
  }

  const { data } = verification.envelope;

  await database.transaction(
    'rw',
    [
      database.profile,
      database.cards,
      database.reviews,
      database.attempts,
      database.essays,
      database.recordings,
      database.dailyPlans,
      database.bandSnapshots,
      database.events,
      database.kv,
      database.userItems,
    ],
    async () => {
      await Promise.all([
        database.profile.clear(),
        database.cards.clear(),
        database.reviews.clear(),
        database.attempts.clear(),
        database.essays.clear(),
        database.recordings.clear(),
        database.dailyPlans.clear(),
        database.bandSnapshots.clear(),
        database.events.clear(),
        database.kv.clear(),
        database.userItems.clear(),
      ]);

      if (data.profile.length > 0) await database.profile.bulkPut(data.profile);
      if (data.cards.length > 0) await database.cards.bulkPut(data.cards);
      if (data.reviews.length > 0) await database.reviews.bulkPut(data.reviews);
      if (data.attempts.length > 0) await database.attempts.bulkPut(data.attempts);
      if (data.essays.length > 0) await database.essays.bulkPut(data.essays);
      if (data.recordings.length > 0) {
        await database.recordings.bulkPut(
          data.recordings.map((r) => ({ ...r, audioBlob: null })),
        );
      }
      if (data.dailyPlans.length > 0) await database.dailyPlans.bulkPut(data.dailyPlans);
      if (data.bandSnapshots.length > 0) await database.bandSnapshots.bulkPut(data.bandSnapshots);
      if (data.events.length > 0) await database.events.bulkPut(data.events);
      if (data.kv.length > 0) await database.kv.bulkPut(data.kv);
      if (data.userItems && data.userItems.length > 0) {
        await database.userItems.bulkPut(data.userItems);
      }
    },
  );

  return {
    restoredCounts: {
      profile: data.profile.length,
      cards: data.cards.length,
      reviews: data.reviews.length,
      attempts: data.attempts.length,
      essays: data.essays.length,
      recordings: data.recordings.length,
      dailyPlans: data.dailyPlans.length,
      bandSnapshots: data.bandSnapshots.length,
      events: data.events.length,
      kv: data.kv.length,
      userItems: data.userItems?.length ?? 0,
    },
  };
}
