import { db as defaultDb, type LexiconV3DB } from '../storage/db';
import { profileRepo } from '../storage/repos/profileRepo';
import type { GameId } from '../planner/today';
import {
  SELF_MANAGED_LEVEL_GAMES,
  clampLevel,
  replayLevelFromAttempts,
  type AttemptForLevel,
} from './sessionLevel';

/** Số attempt gần nhất của game được đọc để dựng cửa sổ 20 lượt. */
const ATTEMPT_LOOKBACK = 12;

interface StoredTracker {
  turnsSinceLastChange: number;
  lastAttemptId: number;
}

export interface AppliedSessionLevel {
  level: number;
  changed: boolean;
  direction: 'up' | 'down' | 'hold';
}

export function trackerKey(gameId: string): string {
  return `adaptive:${gameId}`;
}

/** Level hiện tại của game cho PlayScreen (chưa xử lý attempt mới). */
export async function readSkillLevel(
  gameId: GameId,
  database: LexiconV3DB = defaultDb,
): Promise<number> {
  const profile = await profileRepo.getOrCreate(database);
  return clampLevel(profile.skillLevels?.[gameId] ?? 1);
}

/**
 * Đọc các attempt mới của game, cập nhật `profile.skillLevels[gameId]` theo cửa sổ 20 lượt
 * (đúng >= 90% -> +1, <= 65% -> -1, cooldown 10 lượt) rồi trả level hiện hành.
 * Gọi được nhiều lần: attempt đã tính được nhớ trong kv `adaptive:<gameId>`.
 */
export async function applySessionLevel(
  gameId: GameId,
  database: LexiconV3DB = defaultDb,
): Promise<AppliedSessionLevel> {
  if (SELF_MANAGED_LEVEL_GAMES.includes(gameId)) {
    return { level: await readSkillLevel(gameId, database), changed: false, direction: 'hold' };
  }

  return database.transaction('rw', [database.profile, database.attempts, database.kv], async () => {
    const profile = await profileRepo.getOrCreate(database);
    const currentLevel = clampLevel(profile.skillLevels?.[gameId] ?? 1);

    const row = await database.kv.get(trackerKey(gameId));
    const stored = (row?.value ?? null) as Partial<StoredTracker> | null;
    const start = {
      level: currentLevel,
      turnsSinceLastChange: Math.max(0, stored?.turnsSinceLastChange ?? 0),
      lastAttemptId: Math.max(0, stored?.lastAttemptId ?? 0),
    };

    const rows = (await database.attempts.where('gameId').equals(gameId).toArray())
      .sort((a, b) => a.startedAt - b.startedAt)
      .slice(-ATTEMPT_LOOKBACK);

    const attempts: AttemptForLevel[] = rows.map((r) => ({
      id: r.id ?? 0,
      mode: r.mode,
      items: r.items.map((it) => ({
        correct: it.correct,
        responseTimeMs: it.responseTimeMs,
      })),
    }));

    const result = replayLevelFromAttempts(start, attempts);

    if (result.processed > 0) {
      await database.kv.put({
        key: trackerKey(gameId),
        value: {
          turnsSinceLastChange: result.turnsSinceLastChange,
          lastAttemptId: result.lastAttemptId,
        } satisfies StoredTracker,
      });
    }
    if (result.level !== currentLevel) {
      await database.profile.put({
        ...profile,
        skillLevels: { ...profile.skillLevels, [gameId]: result.level },
      });
    }

    return { level: result.level, changed: result.changed, direction: result.direction };
  });
}
