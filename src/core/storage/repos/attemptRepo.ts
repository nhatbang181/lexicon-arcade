import type { GameId } from '../../planner/today';
import { formatDateKey, qualifiesForStreak, updateStreak } from '../../gamification/streak';
import type { SRSCard } from '../../srs/fsrsAdapter';
import {
  db as defaultDb,
  type AttemptRecord,
  type BandSnapshotRecord,
  type LexiconV3DB,
  type ReviewRecord,
} from '../db';
import { createDefaultProfile } from './profileRepo';

export interface SessionSavePayload {
  attempt: Omit<AttemptRecord, 'id'>;
  updatedCards?: readonly SRSCard[];
  reviews?: ReadonlyArray<Omit<ReviewRecord, 'id'>>;
  bandEvidence?: ReadonlyArray<Omit<BandSnapshotRecord, 'id'>>;
}

export interface ProgressPayload {
  /** Có sau lần `saveProgress` đầu tiên; thiếu = tạo attempt mới `in_progress`. */
  attemptId?: number;
  attempt: Omit<AttemptRecord, 'id' | 'status' | 'reviewsSaved' | 'xpApplied'>;
  updatedCards?: readonly SRSCard[];
  /** Toàn bộ review của phiên tới thời điểm này (chỉ thêm vào cuối). Repo chỉ ghi phần chưa ghi. */
  reviews?: ReadonlyArray<Omit<ReviewRecord, 'id'>>;
}

export interface FinalizePayload extends ProgressPayload {
  bandEvidence?: ReadonlyArray<Omit<BandSnapshotRecord, 'id'>>;
}

export interface ProgressResult {
  attemptId: number;
  totalXp: number;
  streakCount: number;
  reviewsSaved: number;
}

async function writeProgress(
  payload: FinalizePayload,
  final: boolean,
  database: LexiconV3DB,
): Promise<ProgressResult> {
  return database.transaction(
    'rw',
    [
      database.attempts,
      database.profile,
      database.cards,
      database.reviews,
      database.bandSnapshots,
    ],
    async () => {
      const existing =
        payload.attemptId !== undefined ? await database.attempts.get(payload.attemptId) : undefined;
      const reviews = payload.reviews ?? [];
      const alreadySaved = Math.min(existing?.reviewsSaved ?? 0, reviews.length);
      const xpApplied = existing?.xpApplied ?? 0;

      if (payload.updatedCards && payload.updatedCards.length > 0) {
        await database.cards.bulkPut([...payload.updatedCards]);
      }
      const freshReviews = reviews.slice(alreadySaved);
      if (freshReviews.length > 0) {
        await database.reviews.bulkAdd([...freshReviews]);
      }
      if (final && payload.bandEvidence && payload.bandEvidence.length > 0) {
        await database.bandSnapshots.bulkAdd([...payload.bandEvidence]);
      }

      const record: Omit<AttemptRecord, 'id'> = {
        ...payload.attempt,
        status: final ? 'final' : 'in_progress',
        reviewsSaved: reviews.length,
        xpApplied: Math.max(0, payload.attempt.xp),
      };
      let attemptId: number;
      if (existing?.id !== undefined) {
        attemptId = existing.id;
        await database.attempts.put({ ...record, id: attemptId });
      } else {
        attemptId = (await database.attempts.add(record)) ?? 0;
      }

      const profile = (await database.profile.get('me')) ?? createDefaultProfile();
      const xpDelta = Math.max(0, payload.attempt.xp) - xpApplied;
      const nextXp = profile.xp + Math.max(0, xpDelta);
      const dateKey = formatDateKey(new Date(payload.attempt.endedAt));
      const qualifies = qualifiesForStreak({
        cardsReviewed: reviews.length,
        sessionsCompleted: final ? 1 : 0,
      });
      const nextStreak = qualifies ? updateStreak(profile.streak, dateKey).state : profile.streak;
      await database.profile.put({ ...profile, xp: nextXp, streak: nextStreak });

      return {
        attemptId,
        totalXp: nextXp,
        streakCount: nextStreak.count,
        reviewsSaved: reviews.length,
      };
    },
  );
}

export const attemptRepo = {
  async save(
    attempt: Omit<AttemptRecord, 'id'>,
    database: LexiconV3DB = defaultDb,
  ): Promise<number> {
    const id = await database.attempts.add(attempt);
    return id ?? 0;
  },

  async getRecent(
    options: { gameId?: GameId; limit?: number } = {},
    database: LexiconV3DB = defaultDb,
  ): Promise<AttemptRecord[]> {
    const { gameId, limit = 50 } = options;
    const all = gameId
      ? await database.attempts.where('gameId').equals(gameId).toArray()
      : await database.attempts.toArray();
    return all.sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
  },

  async getSince(
    sinceTs: number,
    gameId?: GameId,
    database: LexiconV3DB = defaultDb,
  ): Promise<AttemptRecord[]> {
    const rows = await database.attempts.where('startedAt').aboveOrEqual(sinceTs).toArray();
    return gameId ? rows.filter((r) => r.gameId === gameId) : rows;
  },

  /**
   * Lưu giữa phiên (G3): ghi thẻ đã đổi, review mới, XP mới và streak. Gọi lại nhiều lần an toàn
   * (idempotent: review/XP chỉ ghi phần chênh). Người gọi tự debounce (~500 ms) và flush ở `pagehide`.
   */
  async saveProgress(
    payload: ProgressPayload,
    database: LexiconV3DB = defaultDb,
  ): Promise<ProgressResult> {
    return writeProgress(payload, false, database);
  },

  /**
   * Kết thúc phiên đã `saveProgress`: đặt `status: 'final'` và ghi nốt phần còn lại (nếu có `payload`).
   * Không có `payload` thì chỉ chốt attempt hiện có.
   */
  async finalize(
    attemptId: number,
    payload?: Omit<FinalizePayload, 'attemptId'>,
    database: LexiconV3DB = defaultDb,
  ): Promise<ProgressResult> {
    if (payload) {
      return writeProgress({ ...payload, attemptId }, true, database);
    }
    return database.transaction('rw', [database.attempts, database.profile], async () => {
      const existing = await database.attempts.get(attemptId);
      if (!existing) throw new Error(`attempt ${attemptId} not found`);
      await database.attempts.update(attemptId, { status: 'final' });
      const profile = (await database.profile.get('me')) ?? createDefaultProfile();
      const dateKey = formatDateKey(new Date(existing.endedAt));
      const nextStreak = updateStreak(profile.streak, dateKey).state;
      await database.profile.put({ ...profile, streak: nextStreak });
      return {
        attemptId,
        totalXp: profile.xp,
        streakCount: nextStreak.count,
        reviewsSaved: existing.reviewsSaved ?? 0,
      };
    });
  },

  /**
   * Atomically persist a finished game session (docs/03-ARCHITECTURE.md §3.1):
   * writes attempt, card updates, review logs, band snapshots, XP and streak in one transaction.
   */
  async saveSession(
    payload: SessionSavePayload,
    database: LexiconV3DB = defaultDb,
  ): Promise<{ attemptId: number; totalXp: number; streakCount: number }> {
    return database.transaction(
      'rw',
      [
        database.attempts,
        database.profile,
        database.cards,
        database.reviews,
        database.bandSnapshots,
      ],
      async () => {
        const attemptId = (await database.attempts.add(payload.attempt)) ?? 0;

        if (payload.updatedCards && payload.updatedCards.length > 0) {
          await database.cards.bulkPut([...payload.updatedCards]);
        }
        if (payload.reviews && payload.reviews.length > 0) {
          await database.reviews.bulkAdd([...payload.reviews]);
        }
        if (payload.bandEvidence && payload.bandEvidence.length > 0) {
          await database.bandSnapshots.bulkAdd([...payload.bandEvidence]);
        }

        const profile = (await database.profile.get('me')) ?? createDefaultProfile();
        const nextXp = profile.xp + Math.max(0, payload.attempt.xp);

        const dateKey = formatDateKey(new Date(payload.attempt.endedAt));
        const shouldAdvanceStreak = qualifiesForStreak({
          cardsReviewed: payload.reviews?.length ?? 0,
          sessionsCompleted: 1,
        });
        const nextStreak = shouldAdvanceStreak
          ? updateStreak(profile.streak, dateKey).state
          : profile.streak;

        await database.profile.put({
          ...profile,
          xp: nextXp,
          streak: nextStreak,
        });

        return {
          attemptId,
          totalXp: nextXp,
          streakCount: nextStreak.count,
        };
      },
    );
  },
};
