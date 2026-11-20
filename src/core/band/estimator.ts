import { rawScoreToBand, roundIeltsBand } from './tables';

export type IeltsSkill = 'L' | 'R' | 'W' | 'S';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type EvidenceMode = 'exam' | 'training' | 'claude' | 'official' | 'placement';

export interface BandEvidence {
  skill: IeltsSkill;
  /** Epoch ms timestamp */
  ts: number;
  mode: EvidenceMode;
  /** For L/R objective questions */
  correct?: number;
  total?: number;
  /** For W/S graded essays/mocks or placement/official scores */
  band?: number;
  /** For Writing: Task 2 has double weight (2x) vs Task 1 (1x) */
  taskType?: 'task1' | 'task2';
}

export interface SkillBandEstimate {
  skill: IeltsSkill;
  /** Rounded 0.5-step band, or null if insufficient evidence */
  band: number | null;
  /** Unrounded internal estimate */
  rawEstimate: number | null;
  /** ±confidence margin in band units (e.g. 0.25, 0.5, 0.75) */
  confidenceMargin: number | null;
  confidenceLevel: ConfidenceLevel | null;
  /** Total questions (L/R) or graded sessions (W/S) contributing */
  sampleSize: number;
}

export interface BandEstimateReport {
  L: SkillBandEstimate;
  R: SkillBandEstimate;
  W: SkillBandEstimate;
  S: SkillBandEstimate;
  overall: number | null;
}

export interface EstimateBandsOptions {
  now?: Date;
  /** Exponential decay half-life in days (default 30: evidence 30d old has 0.5x weight). */
  halfLifeDays?: number;
  /** Minimum objective questions needed for L/R band display (default 40, docs/02 §7). */
  minObjectiveQuestions?: number;
  /** Writing calibration offset applied to Claude scores (default 0, docs/02 §7). */
  writingBiasOffset?: number;
  /** Allow placement evidence to seed a low-confidence estimate when exam evidence < threshold. */
  allowPlacementFallback?: boolean;
}

const MS_PER_DAY = 86_400_000;

/**
 * Exponential time-decay weight: w(ageDays) = 2^(-ageDays / halfLifeDays).
 * At ageDays = 0 -> 1.0; at ageDays = halfLifeDays (30d) -> 0.5.
 */
export function decayWeight(ageDays: number, halfLifeDays = 30): number {
  const clampedAge = Math.max(0, ageDays);
  return Math.exp((-Math.LN2 * clampedAge) / Math.max(1, halfLifeDays));
}

function weightedStdDev(values: number[], weights: number[], mean: number): number {
  if (values.length <= 1) return 0;
  let wSum = 0;
  let sqSum = 0;
  for (let i = 0; i < values.length; i++) {
    wSum += weights[i];
    sqSum += weights[i] * (values[i] - mean) ** 2;
  }
  return wSum <= 0 ? 0 : Math.sqrt(sqSum / wSum);
}

/**
 * Official IELTS Overall Band: average of 4 skills rounded to nearest 0.5
 * (.25 -> .5, .75 -> next integer). Returns null if any skill is missing.
 */
export function calculateOverallBand(bands: {
  L: number | null;
  R: number | null;
  W: number | null;
  S: number | null;
}): number | null {
  if (
    bands.L === null ||
    bands.R === null ||
    bands.W === null ||
    bands.S === null
  ) {
    return null;
  }
  const avg = (bands.L + bands.R + bands.W + bands.S) / 4;
  return roundIeltsBand(avg);
}

function estimateObjectiveSkill(
  skill: 'L' | 'R',
  items: readonly BandEvidence[],
  nowMs: number,
  halfLifeDays: number,
  minQuestions: number,
  allowPlacementFallback: boolean,
): SkillBandEstimate {
  // Training mode NEVER counts toward band (docs/02 §7)
  const examItems = items.filter(
    (e) =>
      e.skill === skill &&
      (e.mode === 'exam' || e.mode === 'official') &&
      typeof e.correct === 'number' &&
      typeof e.total === 'number' &&
      e.total > 0,
  );

  const officialBandItems = items.filter(
    (e) => e.skill === skill && e.mode === 'official' && typeof e.band === 'number',
  );

  const totalQuestions = examItems.reduce((sum, e) => sum + (e.total ?? 0), 0);

  if (totalQuestions < minQuestions) {
    if (officialBandItems.length > 0) {
      const latest = officialBandItems.sort((a, b) => b.ts - a.ts)[0];
      const b = roundIeltsBand(latest.band!);
      return {
        skill,
        band: b,
        rawEstimate: latest.band!,
        confidenceMargin: 0.5,
        confidenceLevel: 'medium',
        sampleSize: officialBandItems.length,
      };
    }

    if (allowPlacementFallback) {
      const placementItems = items
        .filter((e) => e.skill === skill && e.mode === 'placement')
        .sort((a, b) => b.ts - a.ts);
      if (placementItems.length > 0) {
        const p = placementItems[0];
        const band =
          typeof p.band === 'number'
            ? roundIeltsBand(p.band)
            : typeof p.correct === 'number' && typeof p.total === 'number' && p.total > 0
              ? rawScoreToBand(skill, (p.correct / p.total) * 40)
              : null;
        if (band !== null) {
          return {
            skill,
            band,
            rawEstimate: band,
            confidenceMargin: 1.0,
            confidenceLevel: 'low',
            sampleSize: p.total ?? 1,
          };
        }
      }
    }

    return {
      skill,
      band: null,
      rawEstimate: null,
      confidenceMargin: null,
      confidenceLevel: null,
      sampleSize: totalQuestions,
    };
  }

  let weightedCorrect = 0;
  let weightedTotal = 0;
  const sessionBands: number[] = [];
  const sessionWeights: number[] = [];

  for (const e of examItems) {
    const ageDays = (nowMs - e.ts) / MS_PER_DAY;
    const baseW = decayWeight(ageDays, halfLifeDays) * (e.mode === 'official' ? 2 : 1);
    const total = e.total!;
    const correct = Math.min(total, Math.max(0, e.correct!));

    weightedCorrect += baseW * correct;
    weightedTotal += baseW * total;

    sessionBands.push(rawScoreToBand(skill, (correct / total) * 40));
    sessionWeights.push(baseW * total);
  }

  const weightedAcc = weightedTotal > 0 ? weightedCorrect / weightedTotal : 0;
  const rawEstimate = rawScoreToBand(skill, weightedAcc * 40);
  const std = weightedStdDev(sessionBands, sessionWeights, rawEstimate);

  let confidenceLevel: ConfidenceLevel;
  let baseMargin: number;
  if (totalQuestions >= 120) {
    confidenceLevel = 'high';
    baseMargin = 0.25;
  } else if (totalQuestions >= 80) {
    confidenceLevel = 'medium';
    baseMargin = 0.5;
  } else {
    confidenceLevel = 'low';
    baseMargin = 0.75;
  }

  const confidenceMargin = Math.min(
    1.0,
    Math.round((baseMargin + Math.min(0.25, std * 0.25)) * 20) / 20,
  );

  return {
    skill,
    band: roundIeltsBand(rawEstimate),
    rawEstimate,
    confidenceMargin,
    confidenceLevel,
    sampleSize: totalQuestions,
  };
}

function estimateProductiveSkill(
  skill: 'W' | 'S',
  items: readonly BandEvidence[],
  nowMs: number,
  halfLifeDays: number,
  biasOffset: number,
  allowPlacementFallback: boolean,
): SkillBandEstimate {
  const maxRecent = skill === 'W' ? 5 : 3;
  const valid = items
    .filter(
      (e) =>
        e.skill === skill &&
        (e.mode === 'claude' || e.mode === 'official') &&
        typeof e.band === 'number',
    )
    .sort((a, b) => b.ts - a.ts)
    .slice(0, maxRecent);

  if (valid.length === 0) {
    if (allowPlacementFallback) {
      const placement = items
        .filter((e) => e.skill === skill && e.mode === 'placement' && typeof e.band === 'number')
        .sort((a, b) => b.ts - a.ts)[0];
      if (placement) {
        const b = roundIeltsBand(placement.band!);
        return {
          skill,
          band: b,
          rawEstimate: placement.band!,
          confidenceMargin: 1.0,
          confidenceLevel: 'low',
          sampleSize: 1,
        };
      }
    }

    return {
      skill,
      band: null,
      rawEstimate: null,
      confidenceMargin: null,
      confidenceLevel: null,
      sampleSize: 0,
    };
  }

  let wSum = 0;
  let vSum = 0;
  const values: number[] = [];
  const weights: number[] = [];

  for (const e of valid) {
    const ageDays = (nowMs - e.ts) / MS_PER_DAY;
    const timeW = decayWeight(ageDays, halfLifeDays);
    const taskW = skill === 'W' && e.taskType === 'task2' ? 2 : 1;
    const sourceW = e.mode === 'official' ? 2 : 1;
    const weight = timeW * taskW * sourceW;

    const adjustedBand =
      e.mode === 'claude' && skill === 'W'
        ? Math.min(9, Math.max(0, e.band! + biasOffset))
        : Math.min(9, Math.max(0, e.band!));

    wSum += weight;
    vSum += weight * adjustedBand;
    values.push(adjustedBand);
    weights.push(weight);
  }

  const rawEstimate = wSum > 0 ? vSum / wSum : 0;
  const std = weightedStdDev(values, weights, rawEstimate);

  let confidenceLevel: ConfidenceLevel;
  let baseMargin: number;
  if (valid.length >= maxRecent) {
    confidenceLevel = 'high';
    baseMargin = 0.25;
  } else if (valid.length >= 2) {
    confidenceLevel = 'medium';
    baseMargin = 0.5;
  } else {
    confidenceLevel = 'low';
    baseMargin = 0.75;
  }

  const confidenceMargin = Math.min(
    1.0,
    Math.round((baseMargin + Math.min(0.25, std * 0.25)) * 20) / 20,
  );

  return {
    skill,
    band: roundIeltsBand(rawEstimate),
    rawEstimate,
    confidenceMargin,
    confidenceLevel,
    sampleSize: valid.length,
  };
}

/**
 * Estimate IELTS Academic bands for all 4 skills (L, R, W, S) with exponential time decay,
 * ±confidence intervals, and official Overall Band rounding.
 */
export function estimateAllBands(
  evidence: readonly BandEvidence[],
  options: EstimateBandsOptions = {},
): BandEstimateReport {
  const {
    now = new Date(),
    halfLifeDays = 30,
    minObjectiveQuestions = 40,
    writingBiasOffset = 0,
    allowPlacementFallback = true,
  } = options;

  const nowMs = now.getTime();
  const L = estimateObjectiveSkill(
    'L',
    evidence,
    nowMs,
    halfLifeDays,
    minObjectiveQuestions,
    allowPlacementFallback,
  );
  const R = estimateObjectiveSkill(
    'R',
    evidence,
    nowMs,
    halfLifeDays,
    minObjectiveQuestions,
    allowPlacementFallback,
  );
  const W = estimateProductiveSkill(
    'W',
    evidence,
    nowMs,
    halfLifeDays,
    writingBiasOffset,
    allowPlacementFallback,
  );
  const S = estimateProductiveSkill(
    'S',
    evidence,
    nowMs,
    halfLifeDays,
    0,
    allowPlacementFallback,
  );

  const overall = calculateOverallBand({
    L: L.band,
    R: R.band,
    W: W.band,
    S: S.band,
  });

  return { L, R, W, S, overall };
}
