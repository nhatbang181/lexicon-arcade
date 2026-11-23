import { adjustDifficulty, type AdaptiveOptions, type TurnOutcome } from './difficulty';

/**
 * Độ khó thích ứng theo phiên (F6 / G2 / LUAT B6).
 * Thang chung: level 1..10 <-> band 4.0..8.5+ (docs/audit-max/01-GAME.md §4):
 *   level = clamp(round((band - 4.0) * 2) + 1, 1, 10)
 * Logic thuần: không React, không DOM, không IndexedDB (phần ghi DB ở applySessionLevel.ts).
 */

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

/** Game tự quản level riêng nên không áp độ khó chung (L2 có thang bậc thang riêng), x1 là thi thử. */
export const SELF_MANAGED_LEVEL_GAMES: readonly string[] = ['l2', 'x1'];

export type PlayMode = 'training' | 'exam' | 'sprint';

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_LEVEL;
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));
}

export function bandToLevel(band: number): number {
  return clampLevel(Math.round((band - 4.0) * 2) + 1);
}

export function levelToBand(level: number): number {
  return 4.0 + (clampLevel(level) - 1) / 2;
}

/** Nhãn hiển thị cho người học, ví dụ "Band ≈ 6.5". Không lộ "Level N" (LUAT D7). */
export function formatBandLabel(level: number): string {
  return `Band ≈ ${levelToBand(level).toFixed(1)}`;
}

/** Kỹ năng IELTS mà game dùng để lấy band định vị (v1-v3 từ vựng lấy từ bản ghi placement từ vựng). */
const GAME_BAND_SKILL: Readonly<Record<string, 'L' | 'R' | 'W' | 'S' | 'vocab' | undefined>> = {
  v1: 'vocab',
  v2: 'vocab',
  v3: 'vocab',
  l1: 'L',
  r1: 'R',
  r2: 'R',
  w1: 'W',
  w2: 'W',
  s1: 'S',
  s2: 'S',
};

export function bandSkillOfGame(gameId: string): 'L' | 'R' | 'W' | 'S' | 'vocab' | null {
  return GAME_BAND_SKILL[gameId] ?? null;
}

/**
 * Nhãn chip trên thanh chơi, dùng chung cho PlayScreen và GamePlaceholder (một thang duy nhất).
 * - Thi: chỉ "Thi", không có band luyện (exam không đổi bậc, LUAT B6).
 * - Chưa định vị (không có band placement): chỉ "Luyện", không bịa số band.
 * - Đã định vị: "Band ≈ x.x · Luyện" với x.x = levelToBand(level).
 */
export function playChipLabel(opts: {
  mode: PlayMode | string;
  level: number | null;
  calibrated: boolean;
}): string {
  const mode = modeLabelVi(opts.mode);
  if (opts.mode === 'exam' || !opts.calibrated || opts.level === null) return mode;
  return `${formatBandLabel(opts.level)} · ${mode}`;
}

export function modeLabelVi(mode: PlayMode | string): string {
  if (mode === 'exam') return 'Thi';
  if (mode === 'sprint') return 'Tốc độ';
  return 'Luyện';
}

export function parsePlayMode(raw: string | null | undefined, allowed: readonly PlayMode[]): PlayMode {
  if ((raw === 'training' || raw === 'exam' || raw === 'sprint') && allowed.includes(raw)) {
    return raw;
  }
  return allowed.includes('training') ? 'training' : (allowed[0] ?? 'training');
}

export interface AttemptForLevel {
  id: number;
  mode: PlayMode;
  items: ReadonlyArray<TurnOutcome>;
}

export interface LevelTrackerState {
  level: number;
  turnsSinceLastChange: number;
  /** id attempt lớn nhất đã được tính vào độ khó (0 = chưa có). */
  lastAttemptId: number;
}

export interface LevelReplayResult extends LevelTrackerState {
  changed: boolean;
  direction: 'up' | 'down' | 'hold';
  /** Số attempt mới đã xử lý lần này. */
  processed: number;
}

/**
 * Phát lại các attempt (đã xếp từ cũ đến mới) để cập nhật level.
 * - Mỗi attempt luyện/tốc độ đưa các lượt của nó vào cửa sổ 20 lượt gần nhất.
 * - Chỉ attempt có id > lastAttemptId mới được tính (idempotent: chạy lại không đổi level).
 * - Attempt thi (exam) bị bỏ qua hoàn toàn (LUAT B6: exam không đổi bậc).
 */
export function replayLevelFromAttempts(
  start: LevelTrackerState,
  attempts: ReadonlyArray<AttemptForLevel>,
  options: AdaptiveOptions = {},
): LevelReplayResult {
  const history: TurnOutcome[] = [];
  let level = clampLevel(start.level);
  let turnsSinceLastChange = start.turnsSinceLastChange;
  let lastAttemptId = start.lastAttemptId;
  let processed = 0;
  let netDelta = 0;

  for (const attempt of attempts) {
    if (attempt.mode === 'exam') continue;
    history.push(...attempt.items);
    if (attempt.id <= start.lastAttemptId) continue;

    processed += 1;
    lastAttemptId = Math.max(lastAttemptId, attempt.id);
    turnsSinceLastChange += attempt.items.length;
    const adj = adjustDifficulty({ level, turnsSinceLastChange }, history, {
      ...options,
      mode: 'training',
    });
    turnsSinceLastChange = adj.turnsSinceLastChange;
    if (adj.changed) {
      netDelta += adj.nextLevel - level;
      level = adj.nextLevel;
    }
  }

  const direction = netDelta > 0 ? 'up' : netDelta < 0 ? 'down' : 'hold';
  return {
    level,
    turnsSinceLastChange,
    lastAttemptId,
    changed: netDelta !== 0,
    direction,
    processed,
  };
}
