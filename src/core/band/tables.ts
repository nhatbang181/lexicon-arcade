export interface BandThreshold {
  minRaw: number;
  maxRaw: number;
  band: number;
}

/**
 * IELTS Academic Listening raw score (/40) -> Band conversion table (docs/01-IELTS-EXAM-BRIEF.md §1).
 */
export const LISTENING_BAND_TABLE: readonly BandThreshold[] = [
  { minRaw: 39, maxRaw: 40, band: 9.0 },
  { minRaw: 37, maxRaw: 38, band: 8.5 },
  { minRaw: 35, maxRaw: 36, band: 8.0 },
  { minRaw: 32, maxRaw: 34, band: 7.5 },
  { minRaw: 30, maxRaw: 31, band: 7.0 },
  { minRaw: 26, maxRaw: 29, band: 6.5 },
  { minRaw: 23, maxRaw: 25, band: 6.0 },
  { minRaw: 18, maxRaw: 22, band: 5.5 },
  { minRaw: 16, maxRaw: 17, band: 5.0 },
  { minRaw: 13, maxRaw: 15, band: 4.5 },
  { minRaw: 10, maxRaw: 12, band: 4.0 },
  { minRaw: 8, maxRaw: 9, band: 3.5 },
  { minRaw: 6, maxRaw: 7, band: 3.0 },
  { minRaw: 4, maxRaw: 5, band: 2.5 },
  { minRaw: 2, maxRaw: 3, band: 2.0 },
  { minRaw: 1, maxRaw: 1, band: 1.0 },
  { minRaw: 0, maxRaw: 0, band: 0.0 },
];

/**
 * IELTS Academic Reading raw score (/40) -> Band conversion table (docs/01-IELTS-EXAM-BRIEF.md §1).
 */
export const READING_BAND_TABLE: readonly BandThreshold[] = [
  { minRaw: 39, maxRaw: 40, band: 9.0 },
  { minRaw: 37, maxRaw: 38, band: 8.5 },
  { minRaw: 35, maxRaw: 36, band: 8.0 },
  { minRaw: 33, maxRaw: 34, band: 7.5 },
  { minRaw: 30, maxRaw: 32, band: 7.0 },
  { minRaw: 27, maxRaw: 29, band: 6.5 },
  { minRaw: 23, maxRaw: 26, band: 6.0 },
  { minRaw: 19, maxRaw: 22, band: 5.5 },
  { minRaw: 15, maxRaw: 18, band: 5.0 },
  { minRaw: 13, maxRaw: 14, band: 4.5 },
  { minRaw: 10, maxRaw: 12, band: 4.0 },
  { minRaw: 8, maxRaw: 9, band: 3.5 },
  { minRaw: 6, maxRaw: 7, band: 3.0 },
  { minRaw: 4, maxRaw: 5, band: 2.5 },
  { minRaw: 2, maxRaw: 3, band: 2.0 },
  { minRaw: 1, maxRaw: 1, band: 1.0 },
  { minRaw: 0, maxRaw: 0, band: 0.0 },
];

/**
 * Official IELTS rounding to nearest 0.5 band:
 * - .25 rounds UP to .5
 * - .75 rounds UP to the next whole band
 * - clamped to [0, 9]
 */
export function roundIeltsBand(score: number): number {
  if (!Number.isFinite(score) || score <= 0) return 0;
  if (score >= 9) return 9;
  // Adding 1e-9 guards against binary floating point drift on exact .25 / .75
  return Math.min(9, Math.max(0, Math.floor(score * 2 + 0.5 + 1e-9) / 2));
}

/**
 * Convert an IELTS Listening or Academic Reading raw score out of 40 to a Band score.
 */
export function rawScoreToBand(skill: 'L' | 'R', rawOutOf40: number): number {
  const clamped = Math.min(40, Math.max(0, Math.round(rawOutOf40)));
  const table = skill === 'L' ? LISTENING_BAND_TABLE : READING_BAND_TABLE;
  for (const row of table) {
    if (clamped >= row.minRaw && clamped <= row.maxRaw) {
      return row.band;
    }
  }
  return 0;
}

/**
 * Convert a proportion correct in [0, 1] directly to an IELTS L/R band.
 */
export function accuracyToBand(skill: 'L' | 'R', accuracy: number): number {
  const clamped = Math.min(1, Math.max(0, accuracy));
  return rawScoreToBand(skill, clamped * 40);
}
