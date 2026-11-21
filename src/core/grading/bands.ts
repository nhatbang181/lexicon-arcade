import { roundIeltsBand } from '../band/tables';
import type { WritingKind } from './schemas';

export const MIN_WORDS_TASK1 = 150;
export const MIN_WORDS_TASK2 = 250;
export const MIN_GRADING_WORDS_WRITING = 50;

export const UNDER_LENGTH_TR_TA_CAP = 5.5;
export const OFF_TOPIC_TR_TA_CAP = 5.0;
export const NO_OVERVIEW_TA_CAP = 5.5;

export interface WritingCriteriaBands {
  TR_TA: number;
  CC: number;
  LR: number;
  GRA: number;
}

export interface SpeakingCriteriaBands {
  FC: number;
  LR: number;
  GRA: number;
  P: number;
}

export interface WritingPenalty {
  code: 'under_length' | 'off_topic' | 'no_overview';
  criterion: 'TR_TA';
  cap: number;
  originalBand: number;
  appliedBand: number;
  capApplied: boolean;
  reasonVi: string;
}

export interface WritingCapOptions {
  kind: WritingKind;
  wordCount: number;
  relevance?: 'on_topic' | 'partly_off' | 'off_topic';
  overviewPresent?: boolean;
}

export interface WritingBandComputation {
  overallBand: number;
  rawAverage: number;
  rawCriteria: WritingCriteriaBands;
  adjustedCriteria: WritingCriteriaBands;
  penalties: WritingPenalty[];
}

export interface SpeakingBandComputation {
  overallBand: number;
  rawAverage: number;
  criteria: SpeakingCriteriaBands;
}

/**
 * Official IELTS rounding to the nearest 0.5 band (docs/01-IELTS-EXAM-BRIEF.md §1):
 * - .25 rounds UP to .5
 * - .75 rounds UP to next integer
 * - clamped to [0, 9]
 */
export function roundBandHalf(score: number): number {
  return roundIeltsBand(score);
}

export function getMinWordsForWriting(kind: WritingKind): number {
  return kind === 'task1' ? MIN_WORDS_TASK1 : MIN_WORDS_TASK2;
}

/**
 * Apply IELTS hard caps on Writing TR/TA:
 * - Task 1 < 150 words or Task 2 < 250 words -> TR_TA capped at 5.5 (docs/07 §4)
 * - Off-topic (`relevance === 'off_topic'`) -> TR_TA capped at 5.0 (W1 §11)
 * - Task 1 with no clear overview -> TA capped at 5.5 (docs/grading/WRITING.md Hard rules)
 */
export function applyWritingCaps(
  criteria: WritingCriteriaBands,
  options: WritingCapOptions,
): {
  rawCriteria: WritingCriteriaBands;
  adjustedCriteria: WritingCriteriaBands;
  penalties: WritingPenalty[];
} {
  const rawCriteria: WritingCriteriaBands = { ...criteria };
  const adjustedCriteria: WritingCriteriaBands = { ...criteria };
  const penalties: WritingPenalty[] = [];

  const minWords = getMinWordsForWriting(options.kind);
  let effectiveCap = Infinity;

  if (options.wordCount < minWords) {
    const capApplied = criteria.TR_TA > UNDER_LENGTH_TR_TA_CAP;
    effectiveCap = Math.min(effectiveCap, UNDER_LENGTH_TR_TA_CAP);
    penalties.push({
      code: 'under_length',
      criterion: 'TR_TA',
      cap: UNDER_LENGTH_TR_TA_CAP,
      originalBand: criteria.TR_TA,
      appliedBand: Math.min(criteria.TR_TA, UNDER_LENGTH_TR_TA_CAP),
      capApplied,
      reasonVi:
        options.kind === 'task1'
          ? `Bài Task 1 thiếu từ (${options.wordCount}/${minWords} từ) — trần TA tối đa ${UNDER_LENGTH_TR_TA_CAP.toFixed(1)}.`
          : `Bài Task 2 thiếu từ (${options.wordCount}/${minWords} từ) — trần TR tối đa ${UNDER_LENGTH_TR_TA_CAP.toFixed(1)}.`,
    });
  }

  if (options.relevance === 'off_topic') {
    const capApplied = criteria.TR_TA > OFF_TOPIC_TR_TA_CAP;
    effectiveCap = Math.min(effectiveCap, OFF_TOPIC_TR_TA_CAP);
    penalties.push({
      code: 'off_topic',
      criterion: 'TR_TA',
      cap: OFF_TOPIC_TR_TA_CAP,
      originalBand: criteria.TR_TA,
      appliedBand: Math.min(criteria.TR_TA, OFF_TOPIC_TR_TA_CAP),
      capApplied,
      reasonVi: `Bài viết lạc đề (off_topic) — trần TR/TA tối đa ${OFF_TOPIC_TR_TA_CAP.toFixed(1)}.`,
    });
  }

  if (options.kind === 'task1' && options.overviewPresent === false) {
    const capApplied = criteria.TR_TA > NO_OVERVIEW_TA_CAP;
    effectiveCap = Math.min(effectiveCap, NO_OVERVIEW_TA_CAP);
    penalties.push({
      code: 'no_overview',
      criterion: 'TR_TA',
      cap: NO_OVERVIEW_TA_CAP,
      originalBand: criteria.TR_TA,
      appliedBand: Math.min(criteria.TR_TA, NO_OVERVIEW_TA_CAP),
      capApplied,
      reasonVi: `Bài Task 1 thiếu đoạn overview rõ ràng — trần TA tối đa ${NO_OVERVIEW_TA_CAP.toFixed(1)}.`,
    });
  }

  if (Number.isFinite(effectiveCap)) {
    adjustedCriteria.TR_TA = Math.min(adjustedCriteria.TR_TA, effectiveCap);
  }

  return { rawCriteria, adjustedCriteria, penalties };
}

/**
 * Compute task band from 4 Writing criteria, optionally enforcing hard caps.
 */
export function computeWritingTaskBand(
  criteria: WritingCriteriaBands,
  capOptions?: WritingCapOptions,
): WritingBandComputation {
  const { rawCriteria, adjustedCriteria, penalties } = capOptions
    ? applyWritingCaps(criteria, capOptions)
    : {
        rawCriteria: { ...criteria },
        adjustedCriteria: { ...criteria },
        penalties: [] as WritingPenalty[],
      };

  const rawAverage =
    (adjustedCriteria.TR_TA +
      adjustedCriteria.CC +
      adjustedCriteria.LR +
      adjustedCriteria.GRA) /
    4;

  return {
    overallBand: roundBandHalf(rawAverage),
    rawAverage,
    rawCriteria,
    adjustedCriteria,
    penalties,
  };
}

/**
 * Official IELTS Writing combined band (docs/07 §4):
 * `(Task1 + 2 * Task2) / 3`, rounded to nearest 0.5.
 */
export function computeCombinedWritingBand(task1Band: number, task2Band: number): number {
  return roundBandHalf((task1Band + 2 * task2Band) / 3);
}

/**
 * Compute Speaking overall band from 4 criteria (FC, LR, GRA, P), rounded to nearest 0.5.
 */
export function computeSpeakingBand(criteria: SpeakingCriteriaBands): SpeakingBandComputation {
  const rawAverage = (criteria.FC + criteria.LR + criteria.GRA + criteria.P) / 4;
  return {
    overallBand: roundBandHalf(rawAverage),
    rawAverage,
    criteria: { ...criteria },
  };
}

/**
 * Compute IELTS overall band from 4 skill scores (L, R, W, S), rounded to nearest 0.5.
 */
export function computeOverallIeltsBand(
  listening: number,
  reading: number,
  writing: number,
  speaking: number,
): number {
  return roundBandHalf((listening + reading + writing + speaking) / 4);
}
