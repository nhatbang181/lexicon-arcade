import { db as defaultDb, type LexiconV3DB } from '../storage/db';
import { profileRepo } from '../storage/repos/profileRepo';
import type { GameId } from '../planner/today';
import {
  SELF_MANAGED_LEVEL_GAMES,
  bandSkillOfGame,
  bandToLevel,
  clampLevel,
  replayLevelFromAttempts,
  type AttemptForLevel,
} from './sessionLevel';

/** Số attempt gần nhất của game được đọc để dựng cửa sổ 20 lượt. */
const ATTEMPT_LOOKBACK = 12;

interface StoredTracker {
  turnsSinceLastChange: number;
  lastAttemptId: number;
  /** Band định vị đã dùng để đặt level xuất phát (null/thiếu = chưa định vị). */
  seedBand?: number | null;
}

export interface AppliedSessionLevel {
  level: number;
  /** true khi level xuất phát đến từ band placement, nên nhãn "Band ≈" mới có nghĩa. */
  calibrated: boolean;
  changed: boolean;
  direction: 'up' | 'down' | 'hold';
}

export function trackerKey(gameId: string): string {
  return `adaptive:${gameId}`;
}

/**
 * Band định vị của game: `estimatedBands` (Listening/Reading/Writing/Speaking) hoặc, với từ vựng,
 * bản ghi band mới nhất của placement từ vựng (`sourceGameId = v1`). null nếu chưa định vị.
 */
async function readSeedBand(gameId: GameId, database: LexiconV3DB): Promise<number | null> {
  const skill = bandSkillOfGame(gameId);
  if (!skill) return null;
  const profile = await profileRepo.getOrCreate(database);
  if (skill !== 'vocab') {
    const b: number | null | undefined = profile.estimatedBands?.[skill];
    return typeof b === 'number' && Number.isFinite(b) ? b : null;
  }
  const rows = await database.bandSnapshots.where('skill').equals('R').toArray();
  const latest = rows.filter((r) => r.sourceGameId === 'v1').sort((a, b) => b.ts - a.ts)[0];
  return latest && typeof latest.band === 'number' && Number.isFinite(latest.band) ? latest.band : null;
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
    return {
      level: await readSkillLevel(gameId, database),
      calibrated: false,
      changed: false,
      direction: 'hold',
    };
  }

  return database.transaction(
    'rw',
    [database.profile, database.attempts, database.kv, database.bandSnapshots],
    async () => {
    const profile = await profileRepo.getOrCreate(database);
    const seedBand = await readSeedBand(gameId, database);

    const row = await database.kv.get(trackerKey(gameId));
    const stored = (row?.value ?? null) as Partial<StoredTracker> | null;

    // Placement mới (hoặc lần đầu có placement): đặt level theo cùng thang band <-> level của chip.
    const reseeded = seedBand !== null && stored?.seedBand !== seedBand;
    const currentLevel = reseeded
      ? bandToLevel(seedBand)
      : clampLevel(profile.skillLevels?.[gameId] ?? 1);
    const start = {
      level: currentLevel,
      turnsSinceLastChange: reseeded ? 0 : Math.max(0, stored?.turnsSinceLastChange ?? 0),
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

    if (result.processed > 0 || reseeded) {
      await database.kv.put({
        key: trackerKey(gameId),
        value: {
          turnsSinceLastChange: result.turnsSinceLastChange,
          lastAttemptId: result.lastAttemptId,
          seedBand: seedBand ?? stored?.seedBand ?? null,
        } satisfies StoredTracker,
      });
    }
    if (result.level !== clampLevel(profile.skillLevels?.[gameId] ?? 1)) {
      await database.profile.put({
        ...profile,
        skillLevels: { ...profile.skillLevels, [gameId]: result.level },
      });
    }

    return {
      level: result.level,
      calibrated: seedBand !== null,
      changed: result.changed,
      direction: result.direction,
    };
    },
  );
}
