import { normalizeText } from './normalize';
import { areSpellingVariants } from './spellingVariants';

/**
 * Character-level Damerau-Levenshtein distance (treats adjacent transposition as 1 edit).
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, dp[i - 2][j - 2] + 1);
      }
      dp[i][j] = val;
    }
  }
  return dp[m][n];
}

export function isMinorTypo(a: string, b: string, maxDistance = 1): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb || na === nb) return false;
  if (Math.min(na.length, nb.length) < 4) return false;
  const dist = levenshteinDistance(na, nb);
  return dist > 0 && dist <= maxDistance;
}

export interface AnswerMatchOptions {
  /** Allow 1-edit minor typo (e.g. for V1 training recall, NOT exam mode). */
  allowMinorTypo?: boolean;
  /** Accept UK/US spelling variants (default true). */
  acceptSpellingVariants?: boolean;
  /** Strip leading articles a/an/the when comparing (default false). */
  ignoreLeadingArticle?: boolean;
}

export interface AnswerMatchResult {
  matched: boolean;
  exact: boolean;
  isSpellingVariant: boolean;
  isTypo: boolean;
  distance: number;
  matchedAccepted?: string;
}

function stripLeadingArticle(s: string): string {
  return s.replace(/^(the|a|an)\s+/i, '').trim();
}

export function matchAnswer(
  input: string,
  acceptedList: readonly string[],
  options: AnswerMatchOptions = {},
): AnswerMatchResult {
  const {
    allowMinorTypo = false,
    acceptSpellingVariants = true,
    ignoreLeadingArticle = false,
  } = options;

  const normInput = normalizeText(input);
  if (!normInput || acceptedList.length === 0) {
    return {
      matched: false,
      exact: false,
      isSpellingVariant: false,
      isTypo: false,
      distance: Infinity,
    };
  }

  const compareInput = ignoreLeadingArticle ? stripLeadingArticle(normInput) : normInput;

  // Pass 1: exact normalized match
  for (const acc of acceptedList) {
    const normAcc = normalizeText(acc);
    const compareAcc = ignoreLeadingArticle ? stripLeadingArticle(normAcc) : normAcc;
    if (compareInput === compareAcc) {
      return {
        matched: true,
        exact: true,
        isSpellingVariant: false,
        isTypo: false,
        distance: 0,
        matchedAccepted: acc,
      };
    }
  }

  // Pass 2: UK/US spelling variant match
  if (acceptSpellingVariants) {
    for (const acc of acceptedList) {
      const compareAcc = ignoreLeadingArticle
        ? stripLeadingArticle(normalizeText(acc))
        : normalizeText(acc);
      if (areSpellingVariants(compareInput, compareAcc)) {
        return {
          matched: true,
          exact: false,
          isSpellingVariant: true,
          isTypo: false,
          distance: 0,
          matchedAccepted: acc,
        };
      }
    }
  }

  // Pass 3: compute minimum character distance for typo detection
  let bestDist = Infinity;
  let bestAcc: string | undefined;
  for (const acc of acceptedList) {
    const compareAcc = ignoreLeadingArticle
      ? stripLeadingArticle(normalizeText(acc))
      : normalizeText(acc);
    const dist = levenshteinDistance(compareInput, compareAcc);
    if (dist < bestDist) {
      bestDist = dist;
      bestAcc = acc;
    }
  }

  const minorTypo =
    bestAcc !== undefined &&
    Math.min(compareInput.length, normalizeText(bestAcc).length) >= 4 &&
    bestDist === 1;

  if (allowMinorTypo && minorTypo) {
    return {
      matched: true,
      exact: false,
      isSpellingVariant: false,
      isTypo: true,
      distance: bestDist,
      matchedAccepted: bestAcc,
    };
  }

  return {
    matched: false,
    exact: false,
    isSpellingVariant: false,
    isTypo: minorTypo,
    distance: bestDist,
    matchedAccepted: bestAcc,
  };
}
