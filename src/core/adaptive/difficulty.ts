export type DifficultyTier = 1 | 2 | 3 | 4 | 5;

export interface TurnOutcome {
  correct: boolean;
  responseTimeMs?: number;
  expectedTimeMs?: number;
}

export interface AdaptiveState {
  /** Fine-grained game level 1..10 (docs/02-LEARNING-DESIGN.md §4) or tier 1..5 */
  level: number;
  turnsSinceLastChange: number;
}

export interface AdaptiveOptions {
  /** Minimum level bound (default 1). */
  minLevel?: number;
  /** Maximum level bound (default 10; set 5 for direct tier 1..5 mode). */
  maxLevel?: number;
  /** Rolling window size (default 20, docs/02 §4). */
  windowSize?: number;
  /** Minimum turns required before first adjustment (default 10). */
  minSamples?: number;
  /** Cooldown turns between level changes (default 10, docs/02 §4). */
  cooldownTurns?: number;
  /** Exam mode bypasses adaptive adjustments. */
  mode?: 'training' | 'exam' | 'sprint';
}

export interface AdaptiveAdjustment {
  prevLevel: number;
  nextLevel: number;
  tier: DifficultyTier;
  changed: boolean;
  direction: 'up' | 'down' | 'hold';
  accuracy: number;
  avgSpeedRatio: number | null;
  turnsSinceLastChange: number;
  reason: string;
}

/**
 * Map fine-grained level (1..10) to coarse difficulty tier (1..5).
 */
export function levelToTier(level: number): DifficultyTier {
  const clamped = Math.min(10, Math.max(1, Math.round(level)));
  return Math.ceil(clamped / 2) as DifficultyTier;
}

/**
 * Map tier (1..5) to its starting fine-grained level (1, 3, 5, 7, 9).
 */
export function tierToLevel(tier: DifficultyTier): number {
  return (tier - 1) * 2 + 1;
}

/**
 * Adjust difficulty level based on rolling accuracy and response speed
 * targeting desirable difficulty (70–90% accuracy band, docs/02 §4).
 */
export function adjustDifficulty(
  state: AdaptiveState,
  history: readonly TurnOutcome[],
  options: AdaptiveOptions = {},
): AdaptiveAdjustment {
  const {
    minLevel = 1,
    maxLevel = 10,
    windowSize = 20,
    minSamples = 10,
    cooldownTurns = 10,
    mode = 'training',
  } = options;

  const clampedCurrent = Math.min(maxLevel, Math.max(minLevel, Math.round(state.level)));
  const window = history.slice(-windowSize);
  const accuracy =
    window.length === 0
      ? 0
      : window.filter((t) => t.correct).length / window.length;

  const timedTurns = window.filter(
    (t): t is Required<TurnOutcome> =>
      typeof t.responseTimeMs === 'number' &&
      typeof t.expectedTimeMs === 'number' &&
      t.expectedTimeMs > 0,
  );
  const avgSpeedRatio =
    timedTurns.length > 0
      ? timedTurns.reduce((sum, t) => sum + t.responseTimeMs / t.expectedTimeMs, 0) /
        timedTurns.length
      : null;

  const toTier = (lvl: number): DifficultyTier =>
    maxLevel <= 5
      ? (Math.min(5, Math.max(1, lvl)) as DifficultyTier)
      : levelToTier(lvl);

  if (mode === 'exam') {
    return {
      prevLevel: clampedCurrent,
      nextLevel: clampedCurrent,
      tier: toTier(clampedCurrent),
      changed: false,
      direction: 'hold',
      accuracy,
      avgSpeedRatio,
      turnsSinceLastChange: state.turnsSinceLastChange,
      reason: 'exam_mode',
    };
  }

  if (window.length < minSamples) {
    return {
      prevLevel: clampedCurrent,
      nextLevel: clampedCurrent,
      tier: toTier(clampedCurrent),
      changed: false,
      direction: 'hold',
      accuracy,
      avgSpeedRatio,
      turnsSinceLastChange: state.turnsSinceLastChange,
      reason: 'insufficient_samples',
    };
  }

  if (state.turnsSinceLastChange < cooldownTurns) {
    return {
      prevLevel: clampedCurrent,
      nextLevel: clampedCurrent,
      tier: toTier(clampedCurrent),
      changed: false,
      direction: 'hold',
      accuracy,
      avgSpeedRatio,
      turnsSinceLastChange: state.turnsSinceLastChange,
      reason: 'cooldown',
    };
  }

  const fastMastery = accuracy >= 0.85 && avgSpeedRatio !== null && avgSpeedRatio <= 0.75;
  const slowStruggle = accuracy <= 0.75 && avgSpeedRatio !== null && avgSpeedRatio >= 1.5;

  if (accuracy > 0.9 || fastMastery) {
    const nextLevel = Math.min(maxLevel, clampedCurrent + 1);
    const changed = nextLevel !== clampedCurrent;
    return {
      prevLevel: clampedCurrent,
      nextLevel,
      tier: toTier(nextLevel),
      changed,
      direction: changed ? 'up' : 'hold',
      accuracy,
      avgSpeedRatio,
      turnsSinceLastChange: changed ? 0 : state.turnsSinceLastChange,
      reason: changed ? (accuracy > 0.9 ? 'high_accuracy' : 'fast_mastery') : 'at_max_level',
    };
  }

  if (accuracy < 0.7 || slowStruggle) {
    const nextLevel = Math.max(minLevel, clampedCurrent - 1);
    const changed = nextLevel !== clampedCurrent;
    return {
      prevLevel: clampedCurrent,
      nextLevel,
      tier: toTier(nextLevel),
      changed,
      direction: changed ? 'down' : 'hold',
      accuracy,
      avgSpeedRatio,
      turnsSinceLastChange: changed ? 0 : state.turnsSinceLastChange,
      reason: changed ? (accuracy < 0.7 ? 'low_accuracy' : 'slow_struggle') : 'at_min_level',
    };
  }

  return {
    prevLevel: clampedCurrent,
    nextLevel: clampedCurrent,
    tier: toTier(clampedCurrent),
    changed: false,
    direction: 'hold',
    accuracy,
    avgSpeedRatio,
    turnsSinceLastChange: state.turnsSinceLastChange,
    reason: 'in_target_zone',
  };
}
