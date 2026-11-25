import { normalizeText } from '../text/normalize';
import { countIeltsWords, tokenizeWords } from '../text/tokenize';
import { levenshteinDistance } from '../text/answerMatch';
import {
  computeSpeakingBand,
  computeWritingTaskBand,
  type WritingPenalty,
} from './bands';
import {
  isSpeakingResult,
  isSprintResult,
  isWritingResult,
  type CriterionFeedback,
  type GradingResult,
  type SpeakingResult,
  type SprintResult,
  type WritingResult,
} from './schemas';

// ---------------------------------------------------------------------------
// Quote Verification (docs/07 §4: fuzzy match >= 0.9 after normalization)
// ---------------------------------------------------------------------------

export const DEFAULT_QUOTE_SIMILARITY_THRESHOLD = 0.9;

export interface QuoteMatchCheck {
  matched: boolean;
  similarity: number;
  exactNormalized: boolean;
}

/**
 * Verify whether `quote` genuinely appears in `sourceText` after text normalization.
 * Uses exact normalized substring match first, then fuzzy sliding-window match >= threshold (0.9).
 */
export function verifyQuoteInSource(
  quote: string,
  sourceText: string,
  threshold = DEFAULT_QUOTE_SIMILARITY_THRESHOLD,
): QuoteMatchCheck {
  const normQuote = normalizeText(quote);
  const normSource = normalizeText(sourceText);

  if (!normQuote || !normSource) {
    return { matched: false, similarity: 0, exactNormalized: false };
  }

  if (normSource.includes(normQuote)) {
    return { matched: true, similarity: 1, exactNormalized: true };
  }

  // Sliding word window around the quote's word length
  const quoteWords = tokenizeWords(quote);
  const sourceWords = tokenizeWords(sourceText);
  if (quoteWords.length === 0 || sourceWords.length === 0) {
    return { matched: false, similarity: 0, exactNormalized: false };
  }

  const target = quoteWords.join(' ');
  const minWin = Math.max(1, quoteWords.length - 1);
  const maxWin = Math.min(sourceWords.length, quoteWords.length + 1);

  let bestSimilarity = 0;

  for (let winSize = minWin; winSize <= maxWin; winSize++) {
    for (let start = 0; start <= sourceWords.length - winSize; start++) {
      const candidate = sourceWords.slice(start, start + winSize).join(' ');
      const maxLen = Math.max(target.length, candidate.length);
      if (maxLen === 0) continue;

      // Fast length lower-bound pruning before computing Levenshtein
      const lenDiff = Math.abs(target.length - candidate.length);
      if (1 - lenDiff / maxLen < Math.max(bestSimilarity, threshold - 0.15)) {
        continue;
      }

      const dist = levenshteinDistance(target, candidate);
      const sim = 1 - dist / maxLen;
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        if (bestSimilarity >= 0.999) {
          return { matched: true, similarity: 1, exactNormalized: false };
        }
      }
    }
  }

  return {
    matched: bestSimilarity >= threshold,
    similarity: Number(bestSimilarity.toFixed(4)),
    exactNormalized: false,
  };
}

// ---------------------------------------------------------------------------
// Post-check Types
// ---------------------------------------------------------------------------

export type PostcheckWarningCode =
  | 'QUOTE_NOT_FOUND'
  | 'QUOTE_HALLUCINATION_BLOCK'
  | 'INSUFFICIENT_SPECIFIC_FEEDBACK'
  | 'WORD_COUNT_MISMATCH'
  | 'UNDER_LENGTH_CAP'
  | 'OFF_TOPIC_CAP'
  | 'NO_OVERVIEW_CAP'
  | 'OVERALL_BAND_MISMATCH'
  | 'ATTEMPT_ID_MISMATCH'
  | 'PRONUNCIATION_INDIRECT'
  | 'MISSING_SPRINT_REFS';

export interface PostcheckWarning {
  code: PostcheckWarningCode;
  severity: 'info' | 'warning' | 'error';
  /** Khi true (vd ATTEMPT_ID_MISMATCH), UI phải chặn lưu tự động cho tới khi người dùng xác nhận (G-01). */
  blocking?: boolean;
  messageVi: string;
  details?: Record<string, unknown>;
}

export interface HiddenQuoteRecord {
  path: string;
  quote: string;
  bestSimilarity: number;
}

export interface QuoteAuditSummary {
  totalChecked: number;
  verifiedCount: number;
  hiddenCount: number;
  hiddenQuotes: HiddenQuoteRecord[];
}

export interface PostcheckOptions {
  /** Original learner essay or combined speaking/sprint transcript text. */
  sourceText: string;
  /** Raw parsed JSON object (to inspect optional Claude-reported `wordCount` or `overallBand`). */
  rawObject?: Record<string, unknown>;
  /** Explicit Claude-reported word count if already extracted. */
  reportedWordCount?: number;
  /** Explicit Claude-reported overall band if already extracted. */
  reportedOverallBand?: number;
  /** Expected attemptId for mismatch checking. */
  expectedAttemptId?: string;
  /** Expected item refs for Sprint checking (W2 / S2 §11). */
  expectedSprintRefs?: string[];
  /** Similarity threshold for quote verification (default 0.9 per docs/07 §4). */
  quoteThreshold?: number;
}

export interface PostcheckReport<T extends GradingResult = GradingResult> {
  cleanedResult: T;
  originalResult: T;
  computedOverallBand: number | null;
  rawAverageBand: number | null;
  appWordCount: number;
  reportedWordCount: number | null;
  reportedOverallBand: number | null;
  penalties: WritingPenalty[];
  quoteAudit: QuoteAuditSummary;
  warnings: PostcheckWarning[];
  hasAnomalies: boolean;
  /** True khi attemptId trong JSON lệch với bài đang mở (G-01). */
  attemptIdMismatch: boolean;
  /** True khi có ít nhất 1 cảnh báo chặn lưu tự động. */
  hasBlockingWarning: boolean;
  /** Tổng số nhận xét cụ thể (strengths + issues đã xác minh) cho PP-16 / SR-89. */
  specificFeedbackCount: number;
  /** True khi đủ điều kiện ghi band evidence (không lệch attemptId, ẩn trích dẫn ≤ 50%, ≥ 3 nhận xét cụ thể). */
  allowBandEvidence: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractOptionalNumber(
  obj: Record<string, unknown> | undefined,
  keys: string[],
): number | null {
  if (!obj) return null;
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'number' && Number.isFinite(val)) {
      return val;
    }
  }
  return null;
}

function filterCriterionQuotes(
  criterionKey: string,
  criterion: CriterionFeedback,
  sourceText: string,
  threshold: number,
  audit: QuoteAuditSummary,
): CriterionFeedback {
  const keptStrengths = criterion.strengths.filter((s, idx) => {
    audit.totalChecked++;
    const check = verifyQuoteInSource(s.quote, sourceText, threshold);
    if (check.matched) {
      audit.verifiedCount++;
      return true;
    }
    audit.hiddenCount++;
    audit.hiddenQuotes.push({
      path: `criteria.${criterionKey}.strengths[${idx}].quote`,
      quote: s.quote,
      bestSimilarity: check.similarity,
    });
    return false;
  });

  const keptIssues = criterion.issues.filter((iss, idx) => {
    audit.totalChecked++;
    const check = verifyQuoteInSource(iss.quote, sourceText, threshold);
    if (check.matched) {
      audit.verifiedCount++;
      return true;
    }
    audit.hiddenCount++;
    audit.hiddenQuotes.push({
      path: `criteria.${criterionKey}.issues[${idx}].quote`,
      quote: iss.quote,
      bestSimilarity: check.similarity,
    });
    return false;
  });

  return {
    ...criterion,
    strengths: keptStrengths,
    issues: keptIssues,
  };
}

// ---------------------------------------------------------------------------
// Main Post-check Pipeline
// ---------------------------------------------------------------------------

export function postcheckGradingResult(
  result: WritingResult,
  options: PostcheckOptions,
): PostcheckReport<WritingResult>;
export function postcheckGradingResult(
  result: SpeakingResult,
  options: PostcheckOptions,
): PostcheckReport<SpeakingResult>;
export function postcheckGradingResult(
  result: SprintResult,
  options: PostcheckOptions,
): PostcheckReport<SprintResult>;
export function postcheckGradingResult(
  result: GradingResult,
  options: PostcheckOptions,
): PostcheckReport<GradingResult>;
export function postcheckGradingResult(
  result: GradingResult,
  options: PostcheckOptions,
): PostcheckReport<GradingResult> {
  const threshold = options.quoteThreshold ?? DEFAULT_QUOTE_SIMILARITY_THRESHOLD;
  const appWordCount = countIeltsWords(options.sourceText);
  const reportedWordCount =
    options.reportedWordCount ??
    extractOptionalNumber(options.rawObject, ['wordCount', 'word_count']);
  const reportedOverallBand =
    options.reportedOverallBand ??
    extractOptionalNumber(options.rawObject, ['overallBand', 'overall', 'overall_band']);

  const warnings: PostcheckWarning[] = [];
  const quoteAudit: QuoteAuditSummary = {
    totalChecked: 0,
    verifiedCount: 0,
    hiddenCount: 0,
    hiddenQuotes: [],
  };

  // 1. Attempt ID check (G-01: blocking until user explicitly confirms)
  const attemptIdMismatch = Boolean(
    options.expectedAttemptId && result.attemptId !== options.expectedAttemptId,
  );
  if (attemptIdMismatch) {
    warnings.push({
      code: 'ATTEMPT_ID_MISMATCH',
      severity: 'error',
      blocking: true,
      messageVi: `Kết quả này có mã bài "${result.attemptId}" khác với bài đang mở ("${options.expectedAttemptId}"). Có thể bạn đã dán nhầm kết quả của bài khác?`,
      details: { expected: options.expectedAttemptId, actual: result.attemptId },
    });
  }

  // 2. Word count discrepancy check (app count is always authoritative)
  if (reportedWordCount !== null) {
    const diff = Math.abs(reportedWordCount - appWordCount);
    const tolerance = Math.max(5, Math.round(appWordCount * 0.05));
    if (diff > tolerance) {
      warnings.push({
        code: 'WORD_COUNT_MISMATCH',
        severity: 'warning',
        messageVi: `Số từ Claude báo (${reportedWordCount}) lệch so với app đếm (${appWordCount}). App dùng số từ tự đếm (${appWordCount}).`,
        details: { appWordCount, reportedWordCount, diff },
      });
    }
  }

  // 3. Kind-specific quote filtering & band computation
  let cleanedResult: GradingResult;
  let computedOverallBand: number | null = null;
  let rawAverageBand: number | null = null;
  let penalties: WritingPenalty[] = [];

  if (isWritingResult(result)) {
    const TR_TA = filterCriterionQuotes(
      'TR_TA',
      result.criteria.TR_TA,
      options.sourceText,
      threshold,
      quoteAudit,
    );
    const CC = filterCriterionQuotes(
      'CC',
      result.criteria.CC,
      options.sourceText,
      threshold,
      quoteAudit,
    );
    const LR = filterCriterionQuotes(
      'LR',
      result.criteria.LR,
      options.sourceText,
      threshold,
      quoteAudit,
    );
    const GRA = filterCriterionQuotes(
      'GRA',
      result.criteria.GRA,
      options.sourceText,
      threshold,
      quoteAudit,
    );

    let cleanedTask1 = result.task1;
    if (result.task1) {
      const keptDataErrors = result.task1.dataErrors.filter((err, idx) => {
        quoteAudit.totalChecked++;
        const check = verifyQuoteInSource(err.quote, options.sourceText, threshold);
        if (check.matched) {
          quoteAudit.verifiedCount++;
          return true;
        }
        quoteAudit.hiddenCount++;
        quoteAudit.hiddenQuotes.push({
          path: `task1.dataErrors[${idx}].quote`,
          quote: err.quote,
          bestSimilarity: check.similarity,
        });
        return false;
      });
      cleanedTask1 = { ...result.task1, dataErrors: keptDataErrors };
    }

    const bandCalc = computeWritingTaskBand(
      {
        TR_TA: TR_TA.band,
        CC: CC.band,
        LR: LR.band,
        GRA: GRA.band,
      },
      {
        kind: result.kind,
        wordCount: appWordCount,
        relevance: result.relevance,
        overviewPresent: result.kind === 'task1' ? result.task1?.overviewPresent : undefined,
      },
    );

    computedOverallBand = bandCalc.overallBand;
    rawAverageBand = bandCalc.rawAverage;
    penalties = bandCalc.penalties;

    for (const pen of penalties) {
      const code =
        pen.code === 'under_length'
          ? 'UNDER_LENGTH_CAP'
          : pen.code === 'off_topic'
            ? 'OFF_TOPIC_CAP'
            : 'NO_OVERVIEW_CAP';
      warnings.push({
        code,
        severity: pen.code === 'off_topic' ? 'error' : 'warning',
        messageVi: pen.capApplied
          ? `${pen.reasonVi} (Đã hạ từ ${pen.originalBand.toFixed(1)} xuống ${pen.appliedBand.toFixed(1)}).`
          : pen.reasonVi,
        details: {
          originalBand: pen.originalBand,
          appliedBand: pen.appliedBand,
          capApplied: pen.capApplied,
        },
      });
    }

    cleanedResult = {
      ...result,
      criteria: {
        TR_TA: { ...TR_TA, band: bandCalc.adjustedCriteria.TR_TA },
        CC,
        LR,
        GRA,
      },
      task1: cleanedTask1,
    };
  } else if (isSpeakingResult(result)) {
    const FC = filterCriterionQuotes(
      'FC',
      result.criteria.FC,
      options.sourceText,
      threshold,
      quoteAudit,
    );
    const LR = filterCriterionQuotes(
      'LR',
      result.criteria.LR,
      options.sourceText,
      threshold,
      quoteAudit,
    );
    const GRA = filterCriterionQuotes(
      'GRA',
      result.criteria.GRA,
      options.sourceText,
      threshold,
      quoteAudit,
    );
    const P = filterCriterionQuotes(
      'P',
      result.criteria.P,
      options.sourceText,
      threshold,
      quoteAudit,
    );

    const bandCalc = computeSpeakingBand({
      FC: FC.band,
      LR: LR.band,
      GRA: GRA.band,
      P: P.band,
    });
    computedOverallBand = bandCalc.overallBand;
    rawAverageBand = bandCalc.rawAverage;

    warnings.push({
      code: 'PRONUNCIATION_INDIRECT',
      severity: 'info',
      messageVi:
        'Điểm Pronunciation (P) chỉ là ước tính gián tiếp từ transcript & ASR (độ tin cậy thấp).',
    });

    cleanedResult = {
      ...result,
      criteria: { FC, LR, GRA, P },
    };
  } else if (isSprintResult(result)) {
    const cleanedItems = result.items.map((item, idx) => {
      if (!item.betterChunk) return item;
      quoteAudit.totalChecked++;
      const check = verifyQuoteInSource(item.betterChunk.original, options.sourceText, threshold);
      if (check.matched) {
        quoteAudit.verifiedCount++;
        return item;
      }
      quoteAudit.hiddenCount++;
      quoteAudit.hiddenQuotes.push({
        path: `items[${idx}].betterChunk.original`,
        quote: item.betterChunk.original,
        bestSimilarity: check.similarity,
      });
      return { ...item, betterChunk: null };
    });

    if (options.expectedSprintRefs && options.expectedSprintRefs.length > 0) {
      const present = new Set(result.items.map((i) => i.ref));
      const missing = options.expectedSprintRefs.filter((r) => !present.has(r));
      if (missing.length > 0) {
        warnings.push({
          code: 'MISSING_SPRINT_REFS',
          severity: 'warning',
          messageVi: `Thiếu kết quả cho ${missing.length} lượt sprint (${missing.join(', ')}). Chỉ cập nhật các lượt khớp ref.`,
          details: { missingRefs: missing },
        });
      }
    }

    cleanedResult = {
      ...result,
      items: cleanedItems,
    };
  } else {
    cleanedResult = result;
  }

  // 4. Overall band discrepancy check (if Claude also reported an overall band)
  if (reportedOverallBand !== null && computedOverallBand !== null) {
    const diff = Math.abs(reportedOverallBand - computedOverallBand);
    if (diff >= 0.5) {
      warnings.push({
        code: 'OVERALL_BAND_MISMATCH',
        severity: 'warning',
        messageVi: `Band tổng Claude ghi (${reportedOverallBand.toFixed(1)}) lệch với trung bình 4 tiêu chí app tính (${computedOverallBand.toFixed(1)}). App dùng điểm tự tính.`,
        details: { reportedOverallBand, computedOverallBand, rawAverageBand },
      });
    }
  }

  // 5. Quote hallucination warning (G-02: > 50% hidden quotes blocks band evidence)
  const highQuoteHallucination =
    quoteAudit.totalChecked > 0 && quoteAudit.hiddenCount / quoteAudit.totalChecked > 0.5;
  if (highQuoteHallucination) {
    warnings.push({
      code: 'QUOTE_HALLUCINATION_BLOCK',
      severity: 'error',
      messageVi: `Hơn 50% trích dẫn không khớp bài làm gốc (${quoteAudit.hiddenCount}/${quoteAudit.totalChecked}). Kết quả này sẽ không được tính vào ước lượng band.`,
      details: {
        hiddenCount: quoteAudit.hiddenCount,
        totalChecked: quoteAudit.totalChecked,
      },
    });
  } else if (quoteAudit.hiddenCount > 0) {
    warnings.push({
      code: 'QUOTE_NOT_FOUND',
      severity: 'warning',
      messageVi: `Đã ẩn ${quoteAudit.hiddenCount}/${quoteAudit.totalChecked} trích dẫn không khớp bài làm gốc (ngưỡng tương đồng ≥ ${Math.round(threshold * 100)}%).`,
      details: {
        hiddenCount: quoteAudit.hiddenCount,
        totalChecked: quoteAudit.totalChecked,
      },
    });
  }

  // 6. Specific feedback count (PP-16 / SR-89: require >= 3 specific comments for Writing/Speaking)
  let specificFeedbackCount = 0;
  if (isWritingResult(cleanedResult)) {
    const c = cleanedResult.criteria;
    specificFeedbackCount =
      c.TR_TA.strengths.length +
      c.TR_TA.issues.length +
      c.CC.strengths.length +
      c.CC.issues.length +
      c.LR.strengths.length +
      c.LR.issues.length +
      c.GRA.strengths.length +
      c.GRA.issues.length;
  } else if (isSpeakingResult(cleanedResult)) {
    const c = cleanedResult.criteria;
    specificFeedbackCount =
      c.FC.strengths.length +
      c.FC.issues.length +
      c.LR.strengths.length +
      c.LR.issues.length +
      c.GRA.strengths.length +
      c.GRA.issues.length +
      c.P.strengths.length +
      c.P.issues.length;
  } else if (isSprintResult(cleanedResult)) {
    specificFeedbackCount = cleanedResult.items.length;
  }

  const insufficientSpecificFeedback =
    (isWritingResult(cleanedResult) || isSpeakingResult(cleanedResult)) &&
    specificFeedbackCount < 3;
  if (insufficientSpecificFeedback) {
    warnings.push({
      code: 'INSUFFICIENT_SPECIFIC_FEEDBACK',
      severity: 'warning',
      messageVi: `Chỉ có ${specificFeedbackCount}/3 nhận xét cụ thể khớp bài làm (yêu cầu ≥ 3 nhận xét cụ thể). Điểm ước lượng này không được tính vào band.`,
      details: { specificFeedbackCount, minRequired: 3 },
    });
  }

  const hasAnomalies = warnings.some((w) => w.severity === 'warning' || w.severity === 'error');
  const hasBlockingWarning = warnings.some((w) => Boolean(w.blocking));
  const allowBandEvidence =
    !attemptIdMismatch && !highQuoteHallucination && !insufficientSpecificFeedback;

  return {
    cleanedResult,
    originalResult: result,
    computedOverallBand,
    rawAverageBand,
    appWordCount,
    reportedWordCount,
    reportedOverallBand,
    penalties,
    quoteAudit,
    warnings,
    hasAnomalies,
    attemptIdMismatch,
    hasBlockingWarning,
    specificFeedbackCount,
    allowBandEvidence,
  };
}
