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

export const BACKUP_SCHEMA_VERSION = 2;
export const LAST_BACKUP_KV_KEY = 'last_backup_at';
export const BACKUP_REMINDER_DAYS = 7;

export type BackupImportMode = 'replace' | 'merge';

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

// SR-34: kiểm cấu trúc từng bảng bằng zod trước khi ghi vào IndexedDB.
const ProfileRowSchema = z
  .object({
    id: z.literal('me'),
    xp: z.number().min(0),
    dailyGoalMin: z.number().min(5).max(360),
    badges: z.array(z.string()),
    streak: z
      .object({
        count: z.number().int().min(0),
        longest: z.number().int().min(0),
        lastActiveDay: z.string().nullable(),
        freezes: z.number().int().min(0),
        freezeUsedDates: z.array(z.string()),
      })
      .passthrough(),
  })
  .passthrough();

const CardRowSchema = z
  .object({
    id: z.string().min(1),
    itemId: z.string().min(1),
    face: z.string().min(1),
  })
  .passthrough();

const ReviewRowSchema = z
  .object({
    cardId: z.string().min(1),
    ts: z.number(),
    gameId: z.string().min(1),
    correct: z.boolean(),
  })
  .passthrough();

const AttemptRowSchema = z
  .object({
    gameId: z.string().min(1),
    mode: z.enum(['training', 'exam', 'sprint']),
    startedAt: z.number(),
    endedAt: z.number(),
    score: z.number(),
    total: z.number(),
    xp: z.number(),
    items: z.array(z.any()),
  })
  .passthrough();

const EssayRowSchema = z
  .object({
    taskType: z.enum(['task1', 'task2']),
    promptId: z.string().min(1),
    text: z.string(),
    wordCount: z.number().int().min(0),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough();

const RecordingRowSchema = z
  .object({
    promptId: z.string().min(1),
    durationSec: z.number().min(0),
    transcript: z.string(),
    createdAt: z.number(),
  })
  .passthrough();

const DailyPlanRowSchema = z
  .object({
    date: z.string().min(1),
    goalMinutes: z.number(),
    tasks: z.array(z.any()),
  })
  .passthrough();

const BandSnapshotRowSchema = z
  .object({
    skill: z.enum(['L', 'R', 'W', 'S']),
    ts: z.number(),
  })
  .passthrough();

const EventRowSchema = z
  .object({
    type: z.string().min(1),
    ts: z.number(),
  })
  .passthrough();

const KvRowSchema = z
  .object({
    key: z.string().min(1),
    value: z.unknown(),
  })
  .passthrough();

const UserItemRowSchema = z
  .object({
    id: z.string().min(1),
    kind: z.string().min(1),
    front: z.string(),
    back: z.string(),
    noteVi: z.string(),
    source: z.string(),
    createdAt: z.number(),
  })
  .passthrough();

const BackupEnvelopeSchema = z.object({
  schemaVersion: z.number().int().min(1),
  appVersion: z.string().min(1),
  exportedAt: z.string().min(1),
  checksum: z.string().min(8),
  data: z.object({
    profile: z.array(ProfileRowSchema),
    cards: z.array(CardRowSchema),
    reviews: z.array(ReviewRowSchema),
    attempts: z.array(AttemptRowSchema),
    essays: z.array(EssayRowSchema),
    recordings: z.array(RecordingRowSchema),
    dailyPlans: z.array(DailyPlanRowSchema),
    bandSnapshots: z.array(BandSnapshotRowSchema),
    events: z.array(EventRowSchema),
    kv: z.array(KvRowSchema),
    userItems: z.array(UserItemRowSchema).optional(),
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
    h2 ^= ch ^ (i & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}`;
}

/** Kiểm tra lỗi hết bộ nhớ trình duyệt (PB-17). */
export function isQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; code?: number; inner?: { name?: string }; message?: string };
  if (e.name === 'QuotaExceededError' || e.inner?.name === 'QuotaExceededError') return true;
  if (e.code === 22 || e.code === 1014) return true;
  if (typeof e.message === 'string' && /quota|storage.*full/i.test(e.message)) return true;
  return false;
}

/** Ghi mốc lần sao lưu gần nhất vào `kv` (PB-05). */
export async function recordBackupTimestamp(
  now: Date = new Date(),
  database: LexiconV3DB = defaultDb,
): Promise<void> {
  try {
    await database.kv.put({ key: LAST_BACKUP_KV_KEY, value: now.getTime() });
  } catch {
    // Không chặn việc xuất file nếu ghi kv thất bại
  }
}

export interface BackupReminderStatus {
  due: boolean;
  lastBackupAt: number | null;
  daysSince: number | null;
}

/** Kiểm tra đã quá 7 ngày chưa sao lưu (PB-05). */
export async function shouldRemindBackup(
  now: Date = new Date(),
  database: LexiconV3DB = defaultDb,
): Promise<BackupReminderStatus> {
  const [row, attemptsCount, cardsCount] = await Promise.all([
    database.kv.get(LAST_BACKUP_KV_KEY),
    database.attempts.count(),
    database.cards.count(),
  ]);
  const lastBackupAt =
    typeof row?.value === 'number' && Number.isFinite(row.value) ? row.value : null;

  if (lastBackupAt === null) {
    // Chỉ nhắc khi người học đã có dữ liệu đáng giữ
    const hasProgress = attemptsCount >= 1 || cardsCount >= 5;
    return { due: hasProgress, lastBackupAt: null, daysSince: null };
  }

  const daysSince = Math.max(0, Math.floor((now.getTime() - lastBackupAt) / 86_400_000));
  return {
    due: daysSince >= BACKUP_REMINDER_DAYS,
    lastBackupAt,
    daysSince,
  };
}

export interface StorageUsageInfo {
  supported: boolean;
  persisted: boolean | null;
  usageBytes: number | null;
  quotaBytes: number | null;
}

/** Yêu cầu trình duyệt giữ bộ nhớ bền vững (PB-09, ưu tiên iPhone PWA standalone). */
export async function requestPersistentStorage(): Promise<boolean | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return null;
  try {
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

/** Đọc ước lượng dung lượng đang dùng và trạng thái persist (PB-09, F18). */
export async function estimateStorageUsage(): Promise<StorageUsageInfo> {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    return { supported: false, persisted: null, usageBytes: null, quotaBytes: null };
  }
  let persisted: boolean | null = null;
  let usageBytes: number | null = null;
  let quotaBytes: number | null = null;

  try {
    if (navigator.storage.persisted) {
      persisted = await navigator.storage.persisted();
    }
  } catch {
    persisted = null;
  }

  try {
    if (navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      usageBytes = typeof est.usage === 'number' ? est.usage : null;
      quotaBytes = typeof est.quota === 'number' ? est.quota : null;
    }
  } catch {
    usageBytes = null;
    quotaBytes = null;
  }

  return { supported: true, persisted, usageBytes, quotaBytes };
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
  await recordBackupTimestamp(now, database);

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: '3.1.0',
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
      return { valid: false, error: 'Tệp không đúng định dạng JSON.' };
    }
  } else {
    obj = input;
  }

  const parsed = BackupEnvelopeSchema.safeParse(obj);
  if (!parsed.success) {
    return { valid: false, error: `Cấu trúc bản sao lưu không hợp lệ: ${parsed.error.message}` };
  }

  if (parsed.data.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `Phiên bản bản sao lưu (${parsed.data.schemaVersion}) mới hơn ứng dụng hiện tại.`,
    };
  }

  const rawData = (obj as { data: unknown }).data;
  const expectedChecksum = computeChecksum(JSON.stringify(rawData));
  if (expectedChecksum !== parsed.data.checksum) {
    return {
      valid: false,
      error: 'Backup checksum mismatch — tệp có thể đã bị hỏng hoặc chỉnh sửa.',
    };
  }

  return { valid: true, envelope: parsed.data as unknown as BackupEnvelope };
}

function mergeProfiles(existing: UserProfile, incoming: UserProfile): UserProfile {
  const mergedBadges = Array.from(new Set([...(existing.badges ?? []), ...(incoming.badges ?? [])]));
  const mergedLevels = { ...existing.skillLevels };
  for (const [k, v] of Object.entries(incoming.skillLevels ?? {})) {
    const key = k as keyof UserProfile['skillLevels'];
    mergedLevels[key] = Math.max(mergedLevels[key] ?? 1, v ?? 1);
  }
  const existingLast = existing.streak?.lastActiveDay ?? '';
  const incomingLast = incoming.streak?.lastActiveDay ?? '';
  const latestStreak = incomingLast > existingLast ? incoming.streak : existing.streak;
  const mergedStreak = {
    ...latestStreak,
    longest: Math.max(existing.streak?.longest ?? 0, incoming.streak?.longest ?? 0),
    freezes: Math.min(2, Math.max(existing.streak?.freezes ?? 0, incoming.streak?.freezes ?? 0)),
    freezeUsedDates: Array.from(
      new Set([
        ...(existing.streak?.freezeUsedDates ?? []),
        ...(incoming.streak?.freezeUsedDates ?? []),
      ]),
    ),
  };
  return {
    ...existing,
    xp: Math.max(existing.xp, incoming.xp),
    badges: mergedBadges,
    skillLevels: mergedLevels,
    streak: mergedStreak,
    placementDoneAt: existing.placementDoneAt ?? incoming.placementDoneAt,
    id: 'me',
  };
}

function pickNewerCard(existing: SRSCard, incoming: SRSCard): SRSCard {
  const exReps = existing.reps ?? 0;
  const inReps = incoming.reps ?? 0;
  if (inReps !== exReps) return inReps > exReps ? incoming : existing;
  const exLast = existing.last_review ? new Date(existing.last_review).getTime() : 0;
  const inLast = incoming.last_review ? new Date(incoming.last_review).getTime() : 0;
  return inLast > exLast ? incoming : existing;
}

export interface ImportBackupOptions {
  mode?: BackupImportMode;
}

/**
 * Safely restore or merge a verified backup into IndexedDB inside a single atomic transaction.
 * Supports both 'replace' (ghi đè toàn bộ) and 'merge' (gộp giữ dữ liệu mới hơn & không mất ghi âm).
 */
export async function importBackup(
  input: string | BackupEnvelope,
  database: LexiconV3DB = defaultDb,
  options: ImportBackupOptions = {},
): Promise<{
  mode: BackupImportMode;
  restoredCounts: Record<keyof BackupDataPayload, number>;
}> {
  const mode: BackupImportMode = options.mode ?? 'replace';
  const verification = verifyBackup(input);
  if (!verification.valid || !verification.envelope) {
    throw new Error(verification.error ?? 'Kiểm tra bản sao lưu thất bại.');
  }

  const { data } = verification.envelope;

  try {
    const counts: Record<keyof BackupDataPayload, number> = {
      profile: 0,
      cards: 0,
      reviews: 0,
      attempts: 0,
      essays: 0,
      recordings: 0,
      dailyPlans: 0,
      bandSnapshots: 0,
      events: 0,
      kv: 0,
      userItems: 0,
    };

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
        if (mode === 'replace') {
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

          counts.profile = data.profile.length;
          counts.cards = data.cards.length;
          counts.reviews = data.reviews.length;
          counts.attempts = data.attempts.length;
          counts.essays = data.essays.length;
          counts.recordings = data.recordings.length;
          counts.dailyPlans = data.dailyPlans.length;
          counts.bandSnapshots = data.bandSnapshots.length;
          counts.events = data.events.length;
          counts.kv = data.kv.length;
          counts.userItems = data.userItems?.length ?? 0;
          return;
        }

        // Mode === 'merge': gộp an toàn, không xoá dữ liệu hiện có hay ghi âm đang lưu trên máy.
        const [
          exProfile,
          exCards,
          exReviews,
          exAttempts,
          exEssays,
          exRecordings,
          exPlans,
          exBands,
          exEvents,
          exKv,
          exUserItems,
        ] = await Promise.all([
          database.profile.get('me'),
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

        // 1. Profile
        const inProfile = data.profile.find((p) => p.id === 'me');
        if (inProfile) {
          await database.profile.put(
            exProfile ? mergeProfiles(exProfile, inProfile) : inProfile,
          );
          counts.profile = 1;
        }

        // 2. Cards (by id)
        const cardMap = new Map(exCards.map((c) => [c.id, c]));
        const cardsToPut: SRSCard[] = [];
        for (const c of data.cards) {
          const cur = cardMap.get(c.id);
          if (!cur) {
            cardsToPut.push(c);
          } else {
            const chosen = pickNewerCard(cur, c);
            if (chosen === c) cardsToPut.push(c);
          }
        }
        if (cardsToPut.length > 0) await database.cards.bulkPut(cardsToPut);
        counts.cards = cardsToPut.length;

        // 3. Reviews (dedup by cardId+ts+gameId)
        const revKeys = new Set(exReviews.map((r) => `${r.cardId}|${r.ts}|${r.gameId}`));
        const newReviews: Array<Omit<ReviewRecord, 'id'>> = [];
        for (const r of data.reviews) {
          const key = `${r.cardId}|${r.ts}|${r.gameId}`;
          if (!revKeys.has(key)) {
            revKeys.add(key);
            const { id: _drop, ...rest } = r;
            newReviews.push(rest);
          }
        }
        if (newReviews.length > 0) await database.reviews.bulkAdd(newReviews);
        counts.reviews = newReviews.length;

        // 4. Attempts (dedup by gameId+startedAt+endedAt)
        const attKeys = new Set(exAttempts.map((a) => `${a.gameId}|${a.startedAt}|${a.endedAt}`));
        const newAttempts: Array<Omit<AttemptRecord, 'id'>> = [];
        for (const a of data.attempts) {
          const key = `${a.gameId}|${a.startedAt}|${a.endedAt}`;
          if (!attKeys.has(key)) {
            attKeys.add(key);
            const { id: _drop, ...rest } = a;
            newAttempts.push(rest);
          }
        }
        if (newAttempts.length > 0) await database.attempts.bulkAdd(newAttempts);
        counts.attempts = newAttempts.length;

        // 5. Essays (dedup by promptId+createdAt+wordCount)
        const essayKeys = new Set(
          exEssays.map((e) => `${e.promptId}|${e.createdAt}|${e.wordCount}`),
        );
        const newEssays: Array<Omit<EssayRecord, 'id'>> = [];
        for (const e of data.essays) {
          const key = `${e.promptId}|${e.createdAt}|${e.wordCount}`;
          if (!essayKeys.has(key)) {
            essayKeys.add(key);
            const { id: _drop, ...rest } = e;
            newEssays.push(rest);
          }
        }
        if (newEssays.length > 0) await database.essays.bulkAdd(newEssays);
        counts.essays = newEssays.length;

        // 6. Recordings (dedup by promptId+createdAt+durationSec, never overwrite local audioBlob)
        const recKeys = new Set(
          exRecordings.map((r) => `${r.promptId}|${r.createdAt}|${r.durationSec}`),
        );
        const newRecs: Array<Omit<RecordingRecord, 'id'>> = [];
        for (const r of data.recordings) {
          const key = `${r.promptId}|${r.createdAt}|${r.durationSec}`;
          if (!recKeys.has(key)) {
            recKeys.add(key);
            const { id: _drop, ...rest } = r as RecordingRecord;
            newRecs.push({ ...rest, audioBlob: null });
          }
        }
        if (newRecs.length > 0) await database.recordings.bulkAdd(newRecs);
        counts.recordings = newRecs.length;

        // 7. Daily plans (by date)
        const planMap = new Map(exPlans.map((p) => [p.date, p]));
        const plansToPut: DailyPlan[] = [];
        for (const p of data.dailyPlans) {
          const cur = planMap.get(p.date);
          if (!cur) {
            plansToPut.push(p);
          } else {
            const doneIds = new Set(p.tasks.filter((t) => t.completed).map((t) => t.id));
            plansToPut.push({
              ...cur,
              tasks: cur.tasks.map((t) => ({ ...t, completed: t.completed || doneIds.has(t.id) })),
            });
          }
        }
        if (plansToPut.length > 0) await database.dailyPlans.bulkPut(plansToPut);
        counts.dailyPlans = plansToPut.length;

        // 8. Band snapshots (dedup by skill+mode+ts+sourceGameId)
        const bandKeys = new Set(
          exBands.map((b) => `${b.skill}|${b.mode}|${b.ts}|${b.sourceGameId ?? ''}`),
        );
        const newBands: Array<Omit<BandSnapshotRecord, 'id'>> = [];
        for (const b of data.bandSnapshots) {
          const key = `${b.skill}|${b.mode}|${b.ts}|${b.sourceGameId ?? ''}`;
          if (!bandKeys.has(key)) {
            bandKeys.add(key);
            const { id: _drop, ...rest } = b;
            newBands.push(rest);
          }
        }
        if (newBands.length > 0) await database.bandSnapshots.bulkAdd(newBands);
        counts.bandSnapshots = newBands.length;

        // 9. Events (dedup by type+ts)
        const evKeys = new Set(exEvents.map((e) => `${e.type}|${e.ts}`));
        const newEvents: Array<Omit<AppEventRecord, 'id'>> = [];
        for (const e of data.events) {
          const key = `${e.type}|${e.ts}`;
          if (!evKeys.has(key)) {
            evKeys.add(key);
            const { id: _drop, ...rest } = e;
            newEvents.push(rest);
          }
        }
        if (newEvents.length > 0) await database.events.bulkAdd(newEvents);
        counts.events = newEvents.length;

        // 10. KV (fill missing keys, don't clobber existing local settings)
        const exKvKeys = new Set(exKv.map((k) => k.key));
        const newKv = data.kv.filter((k) => !exKvKeys.has(k.key));
        if (newKv.length > 0) await database.kv.bulkPut(newKv);
        counts.kv = newKv.length;

        // 11. UserItems (by id, keep newer)
        const uiMap = new Map(exUserItems.map((u) => [u.id, u]));
        const uiToPut: UserItemRecord[] = [];
        for (const u of data.userItems ?? []) {
          const cur = uiMap.get(u.id);
          if (!cur || u.createdAt > cur.createdAt) {
            uiToPut.push(u);
          }
        }
        if (uiToPut.length > 0) await database.userItems.bulkPut(uiToPut);
        counts.userItems = uiToPut.length;
      },
    );

    return { mode, restoredCounts: counts };
  } catch (err) {
    if (isQuotaExceededError(err)) {
      throw new Error(
        'Bộ nhớ trình duyệt đã đầy (QuotaExceededError). Hãy xoá bớt bộ nhớ đệm hoặc giải phóng dung lượng rồi thử lại.',
      );
    }
    throw err;
  }
}

/**
 * Xoá dữ liệu học cục bộ trong 1 transaction (PB-12, không dùng `db.delete()` theo SR-33).
 * Có tuỳ chọn giữ lại bản ghi âm Speaking.
 */
export async function clearAllUserData(
  options: { keepRecordings?: boolean } = {},
  database: LexiconV3DB = defaultDb,
): Promise<void> {
  const keepRecordings = options.keepRecordings ?? true;
  const tables = [
    database.profile,
    database.cards,
    database.reviews,
    database.attempts,
    database.essays,
    database.dailyPlans,
    database.bandSnapshots,
    database.events,
    database.kv,
    database.userItems,
    ...(keepRecordings ? [] : [database.recordings]),
  ];

  await database.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()));
  });
}
