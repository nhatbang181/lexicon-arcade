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
