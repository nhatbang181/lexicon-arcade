import { Rating, type Grade } from 'ts-fsrs';
import type { Face } from './faces';

export interface FaceTimePercentiles {
  p25: number;
  p90: number;
}

/**
 * Default p25 / p90 response time thresholds (ms) by face (docs/02-LEARNING-DESIGN.md §3.3).
 */
export const DEFAULT_FACE_PERCENTILES: Record<Face, FaceTimePercentiles> = {
  intro: { p25: 1500, p90: 6000 },
  recog: { p25: 2500, p90: 8000 },
  para_match: { p25: 3500, p90: 12000 },
  recall_meaning: { p25: 4000, p90: 15000 },
  recall_cloze: { p25: 4000, p90: 15000 },
  col_gap: { p25: 4000, p90: 15000 },
  err_fix: { p25: 4500, p90: 16000 },
  use: { p25: 5000, p90: 20000 },
  listen_spell: { p25: 5000, p90: 18000 },
  ltrap_replay: { p25: 5000, p90: 18000 },
  dict_full: { p25: 6000, p90: 24000 },
  tfng_retry: { p25: 6000, p90: 25000 },
  head_retry: { p25: 6000, p90: 25000 },
};

export interface AutoRateInput {
  correct: boolean;
  face?: Face;
  responseTimeMs: number;
  /** Optional target time for this item; used to derive p25/p90 when personalized percentiles are absent. */
  expectedTimeMs?: number;
  hintsUsed?: number;
  /** Number of attempts needed on this turn (> 1 means failed at least once first). */
  attemptCount?: number;
  /** True when answer was accepted with a 1-char minor typo (e.g. listen_spell). */
  isTypo?: boolean;
  /** True if learner revealed the answer before solving. */
  revealedAnswer?: boolean;
  /** Consecutive correct streak on this card prior to this turn (Easy requires >= 2). */
  cardStreak?: number;
  /** Personalized response-time percentiles computed from learner history. */
  percentiles?: FaceTimePercentiles;
}

/**
 * Compute empirical p25 and p90 response time percentiles from historical durations.
 * Falls back to face defaults if fewer than `minSamples` (default 10) data points exist.
 */
export function computeFacePercentiles(
  durationsMs: readonly number[],
  face: Face = 'recall_meaning',
  minSamples = 10,
): FaceTimePercentiles {
  const valid = durationsMs.filter((d) => Number.isFinite(d) && d > 0).sort((a, b) => a - b);
  if (valid.length < minSamples) {
    return DEFAULT_FACE_PERCENTILES[face];
  }
  const at = (q: number) => {
    const idx = Math.min(valid.length - 1, Math.max(0, Math.floor(q * (valid.length - 1))));
    return valid[idx];
  };
  return { p25: at(0.25), p90: at(0.9) };
}

/**
 * Automatically translate an answer attempt into an FSRS Grade (docs/02-LEARNING-DESIGN.md §3.3):
 * - Incorrect, answer revealed, or took multiple failed attempts -> Again (1)
 * - Correct with hints, minor typo, or slower than p90 -> Hard (2)
 * - Correct without hints/typo, faster than p25 AND cardStreak >= 2 -> Easy (4)
 * - Otherwise -> Good (3)
 */
export function autoRate(input: AutoRateInput): Grade {
  const {
    correct,
    face = 'recall_meaning',
    responseTimeMs,
    expectedTimeMs,
    hintsUsed = 0,
    attemptCount = 1,
    isTypo = false,
    revealedAnswer = false,
    cardStreak = 0,
    percentiles,
  } = input;

  if (!correct || revealedAnswer || attemptCount > 1) {
    return Rating.Again;
  }

  let bounds: FaceTimePercentiles;
  if (percentiles) {
    bounds = percentiles;
  } else if (expectedTimeMs !== undefined && expectedTimeMs > 0) {
    bounds = {
      p25: Math.round(expectedTimeMs * 0.45),
      p90: Math.round(expectedTimeMs * 1.6),
    };
  } else {
    bounds = DEFAULT_FACE_PERCENTILES[face];
  }

  if (hintsUsed > 0 || isTypo || responseTimeMs > bounds.p90) {
    return Rating.Hard;
  }

  if (responseTimeMs < bounds.p25 && cardStreak >= 2) {
    return Rating.Easy;
  }

  return Rating.Good;
}
