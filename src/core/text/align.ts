import { tokenizeWords } from './tokenize';
import { canonicalizeSpelling } from './spellingVariants';

export type AlignTokenStatus =
  | 'correct'
  | 'substitution'
  | 'missing'
  | 'extra'
  | 'ending_error';

export interface AlignedToken {
  status: AlignTokenStatus;
  expected?: string;
  actual?: string;
  refIndex?: number;
  hypIndex?: number;
  endingDetail?: string;
}

export interface AlignmentCounts {
  correct: number;
  substitution: number;
  missing: number;
  extra: number;
  ending_error: number;
}

export interface AlignmentResult {
  tokens: AlignedToken[];
  counts: AlignmentCounts;
  /** Word accuracy in [0, 1]: correct / reference length */
  accuracy: number;
  /** Word Error Rate (WER): (sub + missing + extra + ending_error) / reference length */
  wer: number;
}

/**
 * Detect whether two tokens share the same stem and differ only in a common
 * English inflectional ending (-s, -es, -ies/-y, -ed, -d, -ied/-y, -ing, 's).
 */
export function detectEndingError(expected: string, actual: string): string | null {
  const e = canonicalizeSpelling(expected);
  const a = canonicalizeSpelling(actual);
  if (e === a) return null;

  const checkPair = (longWord: string, shortWord: string, missing: boolean): string | null => {
    if (shortWord.length < 2) return null;
    const prefix = missing ? 'missing' : 'extra';

    if (longWord === `${shortWord}s`) return `${prefix}_-s`;
    if (longWord === `${shortWord}es`) return `${prefix}_-es`;
    if (longWord === `${shortWord}'s`) return `${prefix}_-'s`;
    if (shortWord.endsWith('y') && longWord === `${shortWord.slice(0, -1)}ies`) {
      return `${prefix}_-ies`;
    }
    if (longWord === `${shortWord}ed`) return `${prefix}_-ed`;
    if (shortWord.endsWith('e') && longWord === `${shortWord}d`) return `${prefix}_-ed`;
    if (shortWord.endsWith('y') && longWord === `${shortWord.slice(0, -1)}ied`) {
      return `${prefix}_-ed`;
    }
    // Doubled final consonant + -ed (e.g. plan -> planned, stop -> stopped)
    const lastChar = shortWord[shortWord.length - 1];
    if (longWord === `${shortWord}${lastChar}ed`) return `${prefix}_-ed`;

    if (longWord === `${shortWord}ing`) return `${prefix}_-ing`;
    if (shortWord.endsWith('e') && longWord === `${shortWord.slice(0, -1)}ing`) {
      return `${prefix}_-ing`;
    }
    if (longWord === `${shortWord}${lastChar}ing`) return `${prefix}_-ing`;
    return null;
  };

  return checkPair(e, a, true) ?? checkPair(a, e, false);
}

/**
 * Word-level Levenshtein DP alignment for Dictation (L2).
 * Prioritizes aligning ending errors together (cost 0.6) rather than splitting
 * into separate missing + extra tokens (cost 2.0).
 */
export function alignTranscript(
  reference: string,
  hypothesis: string,
): AlignmentResult {
  const ref = tokenizeWords(reference);
  const hyp = tokenizeWords(hypothesis);
  const m = ref.length;
  const n = hyp.length;

  if (m === 0 && n === 0) {
    return {
      tokens: [],
      counts: { correct: 0, substitution: 0, missing: 0, extra: 0, ending_error: 0 },
      accuracy: 1,
      wer: 0,
    };
  }

  // DP cost matrix and backpointer matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  type Op = 'match' | 'ending' | 'sub' | 'del' | 'ins';
  const bt: Op[][] = Array.from({ length: m + 1 }, () => new Array<Op>(n + 1).fill('match'));

  for (let i = 1; i <= m; i++) {
    dp[i][0] = i;
    bt[i][0] = 'del';
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j;
    bt[0][j] = 'ins';
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const rTok = ref[i - 1];
      const hTok = hyp[j - 1];
      const isMatch = canonicalizeSpelling(rTok) === canonicalizeSpelling(hTok);
      const isEnding = !isMatch && detectEndingError(rTok, hTok) !== null;

      const diagCost = dp[i - 1][j - 1] + (isMatch ? 0 : isEnding ? 0.6 : 1);
      const delCost = dp[i - 1][j] + 1;
      const insCost = dp[i][j - 1] + 1;

      if (diagCost <= delCost && diagCost <= insCost) {
        dp[i][j] = diagCost;
        bt[i][j] = isMatch ? 'match' : isEnding ? 'ending' : 'sub';
      } else if (delCost <= insCost) {
        dp[i][j] = delCost;
        bt[i][j] = 'del';
      } else {
        dp[i][j] = insCost;
        bt[i][j] = 'ins';
      }
    }
  }

  const tokens: AlignedToken[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const op = bt[i][j];
    if (op === 'match') {
      tokens.push({
        status: 'correct',
        expected: ref[i - 1],
        actual: hyp[j - 1],
        refIndex: i - 1,
        hypIndex: j - 1,
      });
      i--;
      j--;
    } else if (op === 'ending') {
      tokens.push({
        status: 'ending_error',
        expected: ref[i - 1],
        actual: hyp[j - 1],
        refIndex: i - 1,
        hypIndex: j - 1,
        endingDetail: detectEndingError(ref[i - 1], hyp[j - 1]) ?? undefined,
      });
      i--;
      j--;
    } else if (op === 'sub') {
      tokens.push({
        status: 'substitution',
        expected: ref[i - 1],
        actual: hyp[j - 1],
        refIndex: i - 1,
        hypIndex: j - 1,
      });
      i--;
      j--;
    } else if (op === 'del') {
      tokens.push({
        status: 'missing',
        expected: ref[i - 1],
        refIndex: i - 1,
      });
      i--;
    } else {
      tokens.push({
        status: 'extra',
        actual: hyp[j - 1],
        hypIndex: j - 1,
      });
      j--;
    }
  }

  tokens.reverse();

  const counts: AlignmentCounts = {
    correct: 0,
    substitution: 0,
    missing: 0,
    extra: 0,
    ending_error: 0,
  };
  for (const t of tokens) {
    counts[t.status]++;
  }

  const denom = Math.max(1, m);
  const errors = counts.substitution + counts.missing + counts.extra + counts.ending_error;
  return {
    tokens,
    counts,
    accuracy: m === 0 ? 0 : counts.correct / denom,
    wer: errors / denom,
  };
}
