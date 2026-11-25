import type { GameId } from '../../planner/today';
import {
  formatDateKey,
  qualifiesForStreak,
  toStreakEvent,
  updateStreak,
  type StreakEvent,
} from '../../gamification/streak';
import {
  evaluateNewBadges,
  type BadgeDefinition,
  type BadgeStats,
} from '../../gamification/badges';
import { xpToLevel } from '../../gamification/xp';
import { getCardMastery } from '../../srs/faces';
import type { SRSCard } from '../../srs/fsrsAdapter';
import {
  db as defaultDb,
  type AttemptRecord,
  type BandSnapshotRecord,
  type LexiconV3DB,
  type ReviewRecord,
} from '../db';
import { createDefaultProfile } from './profileRepo';

/** Loại lượt luyện tập theo PP-02: gợi nhớ / sản xuất / nhận diện. */
export type TurnPracticeKind = 'retrieval' | 'production' | 'recognition';

export interface TurnKindCounts {
  retrieval: number;
  production: number;
  recognition: number;
}

export type AttemptWithTurnKind = AttemptRecord & {
  turnKind?: TurnPracticeKind;
  turnCounts?: TurnKindCounts;
};

export interface LevelUpEvent {
  from: number;
  to: number;
}

export interface SessionGamificationOutcome {
  newBadges: BadgeDefinition[];
  levelUp: LevelUpEvent | null;
  streakEvent: StreakEvent;
}

export interface SessionSavePayload {
  attempt: Omit<AttemptRecord, 'id'> & {
    turnKind?: TurnPracticeKind;
    turnCounts?: TurnKindCounts;
  };
  updatedCards?: readonly SRSCard[];
  reviews?: ReadonlyArray<Omit<ReviewRecord, 'id'>>;
  bandEvidence?: ReadonlyArray<Omit<BandSnapshotRecord, 'id'>>;
}

export interface ProgressPayload {
  /** Có sau lần `saveProgress` đầu tiên; thiếu = tạo attempt mới `in_progress`. */
  attemptId?: number;
  attempt: Omit<AttemptRecord, 'id' | 'status' | 'reviewsSaved' | 'xpApplied'> & {
    turnKind?: TurnPracticeKind;
    turnCounts?: TurnKindCounts;
  };
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
  newBadges?: BadgeDefinition[];
  levelUp?: LevelUpEvent | null;
  streakEvent?: StreakEvent;
}

export interface SessionSaveResult extends SessionGamificationOutcome {
  attemptId: number;
  totalXp: number;
  streakCount: number;
}

export const PENDING_STREAK_EVENT_KEY = 'pending_streak_event';

/** Suy đoán loại lượt mặc định cho từng game theo PP-02 (nếu caller chưa gắn tường minh). */
export function inferTurnKind(gameId: GameId): TurnPracticeKind {
  switch (gameId) {
    case 'w1':
    case 'w2':
    case 's1':
    case 's2':
      return 'production';
    case 'v1':
    case 'v2':
    case 'l2':
      return 'retrieval';
    case 'v3':
    case 'l1':
    case 'r1':
    case 'r2':
    case 'x1':
    default:
      return 'recognition';
  }
}

function buildTurnCounts(
  attempt: Pick<AttemptWithTurnKind, 'gameId' | 'total' | 'items' | 'turnKind' | 'turnCounts'>,
): { turnKind: TurnPracticeKind; turnCounts: TurnKindCounts } {
  const turnKind = attempt.turnKind ?? inferTurnKind(attempt.gameId);
  if (attempt.turnCounts) {
    return { turnKind, turnCounts: attempt.turnCounts };
  }
  const n = Math.max(attempt.items.length, attempt.total, 1);
  return {
    turnKind,
    turnCounts: {
      retrieval: turnKind === 'retrieval' ? n : 0,
      production: turnKind === 'production' ? n : 0,
      recognition: turnKind === 'recognition' ? n : 0,
    },
  };
}

async function computeBadgeStats(
  database: LexiconV3DB,
  streakCount: number,
  overallBand: number | null,
): Promise<BadgeStats> {
  const [attempts, cards, essays] = await Promise.all([
    database.attempts.toArray(),
    database.cards.toArray(),
    database.essays.toArray(),
  ]);

  let matureItemsCount = 0;
  let masteredItemsCount = 0;
  for (const c of cards) {
    const m = getCardMastery(c);
    if (m === 'mature' || m === 'mastered') matureItemsCount += 1;
    if (m === 'mastered') masteredItemsCount += 1;
  }

  let trapsCaughtCount = 0;
  let bestTfngSessionAccuracy = 0;
  let mockExamsCompleted = 0;
  for (const a of attempts) {
    if (a.gameId === 'l1') {
      trapsCaughtCount += a.items.filter((it) => it.correct && it.trapType).length;
    }
    if (a.gameId === 'r1' && a.total > 0) {
      bestTfngSessionAccuracy = Math.max(bestTfngSessionAccuracy, a.score / a.total);
    }
    if (a.gameId === 'x1' && a.status !== 'in_progress') {
      mockExamsCompleted += 1;
    }
  }

  const essaysRevisedCount = essays.filter((e) => e.revisionOfId !== undefined).length;

  return {
    totalSessions: attempts.filter((a) => a.status !== 'in_progress').length,
    streakCount,
    matureItemsCount,
    masteredItemsCount,
    trapsCaughtCount,
    essaysRevisedCount,
    mockExamsCompleted,
    rareCardsSolved: 0,
    bestTfngSessionAccuracy,
    estimatedOverallBand: overallBand,
  };
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
      database.essays,
      database.kv,
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

      const { turnKind, turnCounts } = buildTurnCounts(payload.attempt);
      const record: Omit<AttemptWithTurnKind, 'id'> = {
        ...payload.attempt,
        turnKind,
        turnCounts,
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
      const prevLevel = xpToLevel(profile.xp).level;
      const xpDelta = Math.max(0, payload.attempt.xp) - xpApplied;
      const nextXp = profile.xp + Math.max(0, xpDelta);
      const nextLevel = xpToLevel(nextXp).level;
      const levelUp: LevelUpEvent | null =
        nextLevel > prevLevel ? { from: prevLevel, to: nextLevel } : null;

      const dateKey = formatDateKey(new Date(payload.attempt.endedAt));
      const qualifies = qualifiesForStreak({
        cardsReviewed: reviews.length,
        sessionsCompleted: final ? 1 : 0,
      });
      const streakRes = qualifies
        ? updateStreak(profile.streak, dateKey)
        : {
            state: profile.streak,
            changed: false,
            freezeUsed: false,
            freezeEarned: false,
            broken: false,
          };
      const streakEvent = toStreakEvent(streakRes);

      let newBadges: BadgeDefinition[] = [];
      let nextBadges = profile.badges;
      if (final) {
        const badgeStats = await computeBadgeStats(
          database,
          Math.max(streakRes.state.count, streakRes.state.longest),
          profile.estimatedBands.overall,
        );
        newBadges = evaluateNewBadges(badgeStats, profile.badges);
        if (newBadges.length > 0) {
          nextBadges = [...profile.badges, ...newBadges.map((b) => b.id)];
        }
      }

      await database.profile.put({
        ...profile,
        xp: nextXp,
        streak: streakRes.state,
        badges: nextBadges,
      });

      if (streakEvent.freezeUsed || streakEvent.freezeEarned) {
        await database.kv.put({ key: PENDING_STREAK_EVENT_KEY, value: streakEvent });
      }

      return {
        attemptId,
        totalXp: nextXp,
        streakCount: streakRes.state.count,
        reviewsSaved: reviews.length,
        ...(final ? { newBadges, levelUp, streakEvent } : {}),
      };
    },
  );
}

export const attemptRepo = {
  async save(
    attempt: Omit<AttemptWithTurnKind, 'id'>,
    database: LexiconV3DB = defaultDb,
  ): Promise<number> {
    const { turnKind, turnCounts } = buildTurnCounts(attempt);
    const id = await database.attempts.add({
      ...attempt,
      turnKind,
      turnCounts,
    } as Omit<AttemptRecord, 'id'>);
    return id ?? 0;
  },

  async getRecent(
    options: { gameId?: GameId; limit?: number } = {},
    database: LexiconV3DB = defaultDb,
  ): Promise<AttemptWithTurnKind[]> {
    const { gameId, limit = 50 } = options;
    const all = gameId
      ? await database.attempts.where('gameId').equals(gameId).toArray()
      : await database.attempts.toArray();
    return (all as AttemptWithTurnKind[])
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit);
  },

  async getSince(
    sinceTs: number,
    gameId?: GameId,
    database: LexiconV3DB = defaultDb,
  ): Promise<AttemptWithTurnKind[]> {
    const rows = (await database.attempts
      .where('startedAt')
      .aboveOrEqual(sinceTs)
      .toArray()) as AttemptWithTurnKind[];
    return gameId ? rows.filter((r) => r.gameId === gameId) : rows;
  },

  /** Thống kê tỷ lệ loại lượt (gợi nhớ / sản xuất / nhận diện) theo PP-02. */
  async getTurnKindSummary(
    sinceTs = 0,
    database: LexiconV3DB = defaultDb,
  ): Promise<TurnKindCounts & { total: number; activeRatio: number | null }> {
    const rows = await attemptRepo.getSince(sinceTs, undefined, database);
    const counts: TurnKindCounts = { retrieval: 0, production: 0, recognition: 0 };
    for (const r of rows) {
      const { turnCounts } = buildTurnCounts(r);
      counts.retrieval += turnCounts.retrieval;
      counts.production += turnCounts.production;
      counts.recognition += turnCounts.recognition;
    }
    const total = counts.retrieval + counts.production + counts.recognition;
    return {
      ...counts,
      total,
      activeRatio: total > 0 ? (counts.retrieval + counts.production) / total : null,
    };
  },

  /** Đọc và xoá thông báo cứu chuỗi / nhận freeze gần nhất (F8). */
  async consumePendingStreakEvent(
    database: LexiconV3DB = defaultDb,
  ): Promise<StreakEvent | null> {
    const row = await database.kv.get(PENDING_STREAK_EVENT_KEY);
    if (!row || !row.value || typeof row.value !== 'object') return null;
    await database.kv.delete(PENDING_STREAK_EVENT_KEY);
    return row.value as StreakEvent;
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
    return database.transaction(
      'rw',
      [database.attempts, database.profile, database.cards, database.essays, database.kv],
      async () => {
        const existing = await database.attempts.get(attemptId);
        if (!existing) throw new Error(`attempt ${attemptId} not found`);
        await database.attempts.update(attemptId, { status: 'final' });
        const profile = (await database.profile.get('me')) ?? createDefaultProfile();
        const dateKey = formatDateKey(new Date(existing.endedAt));
        const qualifies = qualifiesForStreak({
          cardsReviewed: existing.reviewsSaved ?? 0,
          sessionsCompleted: 1,
        });
        const streakRes = qualifies
          ? updateStreak(profile.streak, dateKey)
          : {
              state: profile.streak,
              changed: false,
              freezeUsed: false,
              freezeEarned: false,
              broken: false,
            };
        const streakEvent = toStreakEvent(streakRes);
        const badgeStats = await computeBadgeStats(
          database,
          Math.max(streakRes.state.count, streakRes.state.longest),
          profile.estimatedBands.overall,
        );
        const newBadges = evaluateNewBadges(badgeStats, profile.badges);
        const nextBadges =
          newBadges.length > 0
            ? [...profile.badges, ...newBadges.map((b) => b.id)]
            : profile.badges;

        await database.profile.put({
          ...profile,
          streak: streakRes.state,
          badges: nextBadges,
        });

        if (streakEvent.freezeUsed || streakEvent.freezeEarned) {
          await database.kv.put({ key: PENDING_STREAK_EVENT_KEY, value: streakEvent });
        }

        return {
          attemptId,
          totalXp: profile.xp,
          streakCount: streakRes.state.count,
          reviewsSaved: existing.reviewsSaved ?? 0,
          newBadges,
          levelUp: null,
          streakEvent,
        };
      },
    );
  },

  /**
   * Atomically persist a finished game session (docs/03-ARCHITECTURE.md §3.1):
   * writes attempt, card updates, review logs, band snapshots, XP, streak and new badges in one transaction.
   */
  async saveSession(
    payload: SessionSavePayload,
    database: LexiconV3DB = defaultDb,
  ): Promise<SessionSaveResult> {
    return database.transaction(
      'rw',
      [
        database.attempts,
        database.profile,
        database.cards,
        database.reviews,
        database.bandSnapshots,
        database.essays,
        database.kv,
      ],
      async () => {
        const { turnKind, turnCounts } = buildTurnCounts(payload.attempt);
        const attemptId =
          (await database.attempts.add({
            ...payload.attempt,
            turnKind,
            turnCounts,
            status: 'final',
          } as Omit<AttemptWithTurnKind, 'id'>)) ?? 0;

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
        const prevLevel = xpToLevel(profile.xp).level;
        const nextXp = profile.xp + Math.max(0, payload.attempt.xp);
        const nextLevel = xpToLevel(nextXp).level;
        const levelUp: LevelUpEvent | null =
          nextLevel > prevLevel ? { from: prevLevel, to: nextLevel } : null;

        const dateKey = formatDateKey(new Date(payload.attempt.endedAt));
        const shouldAdvanceStreak = qualifiesForStreak({
          cardsReviewed: payload.reviews?.length ?? 0,
          sessionsCompleted: 1,
        });
        const streakRes = shouldAdvanceStreak
          ? updateStreak(profile.streak, dateKey)
          : {
              state: profile.streak,
              changed: false,
              freezeUsed: false,
              freezeEarned: false,
              broken: false,
            };
        const streakEvent = toStreakEvent(streakRes);

        const badgeStats = await computeBadgeStats(
          database,
          Math.max(streakRes.state.count, streakRes.state.longest),
          profile.estimatedBands.overall,
        );
        const newBadges = evaluateNewBadges(badgeStats, profile.badges);
        const nextBadges =
          newBadges.length > 0
            ? [...profile.badges, ...newBadges.map((b) => b.id)]
            : profile.badges;

        await database.profile.put({
          ...profile,
          xp: nextXp,
          streak: streakRes.state,
          badges: nextBadges,
        });

        if (streakEvent.freezeUsed || streakEvent.freezeEarned) {
          await database.kv.put({ key: PENDING_STREAK_EVENT_KEY, value: streakEvent });
        }

        return {
          attemptId,
          totalXp: nextXp,
          streakCount: streakRes.state.count,
          newBadges,
          levelUp,
          streakEvent,
        };
      },
    );
  },
};
