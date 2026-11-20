import { Rating, type Grade } from 'ts-fsrs';

export type XpActionType =
  | 'srs_review'
  | 'exam_question'
  | 'writing_essay'
  | 'writing_sprint'
  | 'speaking_mock'
  | 'speaking_sprint'
  | 'dictation_sentence';

export interface XpAwardInput {
  action: XpActionType;
  correct?: boolean;
  rating?: Grade;
  /** Replaying an already-completed item in the same window awards 0 XP (docs/02 §2.4). */
  isRepeat?: boolean;
  /** Rare Mastered card (1/30 chance) awards 3x XP (docs/02 §2.3). */
  isRareCard?: boolean;
  /** Consecutive correct answers in current session (capped multiplier up to 1.5x). */
  comboCount?: number;
}

export interface XpLevelInfo {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
}

const BASE_XP_BY_ACTION: Record<XpActionType, number> = {
  srs_review: 10,
  exam_question: 15,
  dictation_sentence: 12,
  writing_sprint: 30,
  speaking_sprint: 25,
  writing_essay: 80,
  speaking_mock: 80,
};

/**
 * Calculate XP for a scored retrieval or production turn (docs/02 §2.3 & §2.4).
 * Zero XP for idle time or immediate replays.
 */
export function calculateTurnXp(input: XpAwardInput): number {
  if (input.isRepeat) return 0;

  let base = BASE_XP_BY_ACTION[input.action] ?? 10;

  if (input.action === 'srs_review' && input.rating !== undefined) {
    switch (input.rating) {
      case Rating.Again:
        base = 2;
        break;
      case Rating.Hard:
        base = 8;
        break;
      case Rating.Good:
        base = 10;
        break;
      case Rating.Easy:
        base = 12;
        break;
    }
  } else if (input.correct === false) {
    // Effort XP for trying retrieval/exam item without punishing or rewarding guessing
    base = Math.min(2, base);
  }

  const combo = Math.max(0, input.comboCount ?? 0);
  const comboMult = input.correct === false || input.rating === Rating.Again
    ? 1
    : 1 + Math.min(5, Math.floor(combo / 3)) * 0.1; // up to 1.5x

  const rareMult = input.isRareCard && input.correct !== false && input.rating !== Rating.Again
    ? 3
    : 1;

  return Math.round(base * comboMult * rareMult);
}

/**
 * Deterministically decide if a Mastered card spawns as a Rare Card (~1/30 chance, docs/02 §2.3).
 */
export function isRareMasteredCard(
  isMastered: boolean,
  randomValue: number = Math.random(),
): boolean {
  if (!isMastered) return false;
  return randomValue < 1 / 30;
}

/**
 * Compute XP required to advance from `level` to `level + 1`.
 */
export function xpRequiredForLevel(level: number): number {
  const lvl = Math.max(1, Math.floor(level));
  return 100 + (lvl - 1) * 50;
}

/**
 * Map total cumulative XP to level & progress info.
 */
export function xpToLevel(totalXp: number): XpLevelInfo {
  const safeXp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let remaining = safeXp;
  let needed = xpRequiredForLevel(level);

  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = xpRequiredForLevel(level);
  }

  return {
    level,
    totalXp: safeXp,
    currentLevelXp: remaining,
    nextLevelXp: needed,
    progress: needed > 0 ? remaining / needed : 0,
  };
}
