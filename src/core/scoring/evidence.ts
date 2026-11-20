import { tokenizeWords } from '../text/tokenize';

export interface OffsetSpan {
  paragraph?: string;
  start: number;
  end: number;
  quote?: string;
}

export interface EvidenceEvaluationOptions {
  /** Minimum IoU threshold to pass (default 0.5). */
  threshold?: number;
  /** 'char' uses character offset intervals; 'word' compares token multisets of quotes. */
  mode?: 'char' | 'word';
}

export interface EvidenceEvaluationResult {
  passed: boolean;
  iou: number;
  bestMatchIndex: number;
  notRequired?: boolean;
}

/**
 * Compute Intersection over Union (IoU) for two half-open character intervals [start, end).
 */
export function computeCharIoU(
  a: { start: number; end: number },
  b: { start: number; end: number },
): number {
  const lenA = a.end - a.start;
  const lenB = b.end - b.start;
  if (lenA <= 0 || lenB <= 0) return 0;

  const interStart = Math.max(a.start, b.start);
  const interEnd = Math.min(a.end, b.end);
  const intersection = Math.max(0, interEnd - interStart);
  if (intersection === 0) return 0;

  const union = lenA + lenB - intersection;
  return union <= 0 ? 0 : intersection / union;
}

/**
 * Compute bag-of-words (multiset) Intersection over Union between two text snippets.
 */
export function computeWordIoU(userText: string, goldText: string): number {
  const tokA = tokenizeWords(userText);
  const tokB = tokenizeWords(goldText);
  if (tokA.length === 0 || tokB.length === 0) return 0;

  const freqA = new Map<string, number>();
  const freqB = new Map<string, number>();
  for (const t of tokA) freqA.set(t, (freqA.get(t) ?? 0) + 1);
  for (const t of tokB) freqB.set(t, (freqB.get(t) ?? 0) + 1);

  const keys = new Set([...freqA.keys(), ...freqB.keys()]);
  let intersection = 0;
  let union = 0;
  for (const k of keys) {
    const ca = freqA.get(k) ?? 0;
    const cb = freqB.get(k) ?? 0;
    intersection += Math.min(ca, cb);
    union += Math.max(ca, cb);
  }
  return union === 0 ? 0 : intersection / union;
}

/**
 * Merge overlapping/adjacent intervals so multiple user highlights in the same
 * paragraph are evaluated fairly against a gold span.
 */
function mergeIntervals(spans: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  const valid = spans
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start);
  if (valid.length === 0) return [];

  const merged: Array<{ start: number; end: number }> = [{ ...valid[0] }];
  for (let i = 1; i < valid.length; i++) {
    const cur = valid[i];
    const prev = merged[merged.length - 1];
    if (cur.start <= prev.end) {
      prev.end = Math.max(prev.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

function computeMultiSpanCharIoU(
  userSpans: Array<{ start: number; end: number }>,
  gold: { start: number; end: number },
): number {
  const goldLen = gold.end - gold.start;
  if (goldLen <= 0 || userSpans.length === 0) return 0;

  const merged = mergeIntervals(userSpans);
  let userTotal = 0;
  let interTotal = 0;
  for (const s of merged) {
    userTotal += s.end - s.start;
    const interStart = Math.max(s.start, gold.start);
    const interEnd = Math.min(s.end, gold.end);
    if (interEnd > interStart) {
      interTotal += interEnd - interStart;
    }
  }
  const union = userTotal + goldLen - interTotal;
  return union <= 0 ? 0 : interTotal / union;
}

/**
 * Evaluate whether user-highlighted passage evidence overlaps sufficiently (IoU >= 0.5)
 * with any gold evidence span.
 */
export function evaluateEvidence(
  userHighlights: readonly OffsetSpan[],
  goldEvidence: readonly OffsetSpan[],
  options: EvidenceEvaluationOptions = {},
): EvidenceEvaluationResult {
  const { threshold = 0.5, mode = 'char' } = options;

  // NOT GIVEN items with no required evidence span pass automatically
  if (goldEvidence.length === 0) {
    return { passed: true, iou: 1, bestMatchIndex: -1, notRequired: true };
  }
  if (userHighlights.length === 0) {
    return { passed: false, iou: 0, bestMatchIndex: -1 };
  }

  let bestIoU = 0;
  let bestMatchIndex = -1;

  for (let gIdx = 0; gIdx < goldEvidence.length; gIdx++) {
    const gold = goldEvidence[gIdx];
    const matchingParagraphHighlights = userHighlights.filter(
      (u) => !gold.paragraph || !u.paragraph || u.paragraph === gold.paragraph,
    );
    if (matchingParagraphHighlights.length === 0) continue;

    if (mode === 'word') {
      const goldQuote = gold.quote ?? '';
      // Check individual highlights and combined quote
      const combinedUserQuote = matchingParagraphHighlights
        .map((h) => h.quote ?? '')
        .join(' ')
        .trim();
      const combinedIoU = computeWordIoU(combinedUserQuote, goldQuote);
      if (combinedIoU > bestIoU) {
        bestIoU = combinedIoU;
        bestMatchIndex = gIdx;
      }
      for (const h of matchingParagraphHighlights) {
        const singleIoU = computeWordIoU(h.quote ?? '', goldQuote);
        if (singleIoU > bestIoU) {
          bestIoU = singleIoU;
          bestMatchIndex = gIdx;
        }
      }
    } else {
      // Char-offset IoU: take the best of single-highlight IoU and combined-paragraph IoU
      const combinedIoU = computeMultiSpanCharIoU(matchingParagraphHighlights, gold);
      if (combinedIoU > bestIoU) {
        bestIoU = combinedIoU;
        bestMatchIndex = gIdx;
      }
      for (const h of matchingParagraphHighlights) {
        const singleIoU = computeCharIoU(h, gold);
        if (singleIoU > bestIoU) {
          bestIoU = singleIoU;
          bestMatchIndex = gIdx;
        }
      }
    }
  }

  return {
    passed: bestIoU >= threshold,
    iou: bestIoU,
    bestMatchIndex,
  };
}
