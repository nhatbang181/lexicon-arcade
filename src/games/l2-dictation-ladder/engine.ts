import { alignTranscript, detectEndingError, type AlignedToken, type AlignTokenStatus } from '../../core/text/align';
import { normalizeTypography, slugifyWord } from '../../core/text/normalize';
import { canonicalizeSpelling } from '../../core/text/spellingVariants';
import type { DictationItem } from '../../core/content/schemas';
import {
  createNewCard,
  makeCardId,
  Rating,
  scheduleCard,
  type Grade,
  type SRSCard,
} from '../../core/srs/fsrsAdapter';
import type { AttemptItem, ReviewRecord } from '../../core/storage/db';
import type { SessionSavePayload } from '../../core/storage/repos/attemptRepo';

export const L2_SESSION_LENGTH = 10;
export const L2_MIN_LEVEL = 1;
export const L2_MAX_LEVEL = 10;
export const L2_SLOW_PLAY_PENALTY = 0.3;
export const L2_PERFECT_BONUS_XP = 5;
export const L2_PROMOTION_THRESHOLD_COUNT = 8;
export const L2_PROMOTION_SCORE_THRESHOLD = 0.9;
export const L2_SRS_CREATE_THRESHOLD = 0.7;
export const L2_SPELLING_CARD_THRESHOLD = 2;

export type DictationErrorType =
  | 'final_consonant'
  | 'weak_form'
  | 'spelling'
  | 'number'
  | 'wrong_word';

export const ALL_DICTATION_ERROR_TYPES: readonly DictationErrorType[] = [
  'final_consonant',
  'weak_form',
  'spelling',
  'number',
  'wrong_word',
] as const;

export const DICTATION_ERROR_LABELS_VI: Record<DictationErrorType, string> = {
  final_consonant: 'Âm cuối (-s/-ed/-t/-d)',
  weak_form: 'Âm yếu (a/the/to/of...)',
  spelling: 'Chính tả học thuật',
  number: 'Số & ngày tháng',
  wrong_word: 'Sai / thiếu / thừa từ',
};

export const WEAK_FORM_WORDS = new Set<string>([
  'a',
  'an',
  'the',
  'to',
  'of',
  'for',
  'and',
  'can',
  'have',
  'has',
  'are',
  'was',
  'were',
  'at',
  'in',
  'on',
]);

const CONTRACTION_MAP: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bcan't\b/g, 'can not'],
  [/\bcannot\b/g, 'can not'],
  [/\bwon't\b/g, 'will not'],
  [/\bshan't\b/g, 'shall not'],
  [/\bdon't\b/g, 'do not'],
  [/\bdoesn't\b/g, 'does not'],
  [/\bdidn't\b/g, 'did not'],
  [/\bisn't\b/g, 'is not'],
  [/\baren't\b/g, 'are not'],
  [/\bwasn't\b/g, 'was not'],
  [/\bweren't\b/g, 'were not'],
  [/\bhasn't\b/g, 'has not'],
  [/\bhaven't\b/g, 'have not'],
  [/\bhadn't\b/g, 'had not'],
  [/\bwouldn't\b/g, 'would not'],
  [/\bcouldn't\b/g, 'could not'],
  [/\bshouldn't\b/g, 'should not'],
  [/\bmustn't\b/g, 'must not'],
  [/\bneedn't\b/g, 'need not'],
  [/\blet's\b/g, 'let us'],
  [/\bi'm\b/g, 'i am'],
  [/\byou're\b/g, 'you are'],
  [/\bwe're\b/g, 'we are'],
  [/\bthey're\b/g, 'they are'],
  [/\bhe's\b/g, 'he is'],
  [/\bshe's\b/g, 'she is'],
  [/\bit's\b/g, 'it is'],
  [/\bthat's\b/g, 'that is'],
  [/\bthere's\b/g, 'there is'],
  [/\bhere's\b/g, 'here is'],
  [/\bwhat's\b/g, 'what is'],
  [/\bwho's\b/g, 'who is'],
  [/\bi've\b/g, 'i have'],
  [/\byou've\b/g, 'you have'],
  [/\bwe've\b/g, 'we have'],
  [/\bthey've\b/g, 'they have'],
  [/\bi'll\b/g, 'i will'],
  [/\byou'll\b/g, 'you will'],
  [/\bhe'll\b/g, 'he will'],
  [/\bshe'll\b/g, 'she will'],
  [/\bit'll\b/g, 'it will'],
  [/\bwe'll\b/g, 'we will'],
  [/\bthey'll\b/g, 'they will'],
  [/\bi'd\b/g, 'i would'],
  [/\byou'd\b/g, 'you would'],
  [/\bhe'd\b/g, 'he would'],
  [/\bshe'd\b/g, 'she would'],
  [/\bwe'd\b/g, 'we would'],
  [/\bthey'd\b/g, 'they would'],
];

const SMALL_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS_NUMBERS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const ORDINAL_WORDS: Record<string, string> = {
  first: '1st',
  second: '2nd',
  third: '3rd',
  fourth: '4th',
  fifth: '5th',
  sixth: '6th',
  seventh: '7th',
  eighth: '8th',
  ninth: '9th',
  tenth: '10th',
  eleventh: '11th',
  twelfth: '12th',
  thirteenth: '13th',
  fourteenth: '14th',
  fifteenth: '15th',
  sixteenth: '16th',
  seventeenth: '17th',
  eighteenth: '18th',
  nineteenth: '19th',
  twentieth: '20th',
  thirtieth: '30th',
};

const IRREGULAR_FINAL_TD_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['spend', 'spent'],
  ['send', 'sent'],
  ['build', 'built'],
  ['lend', 'lent'],
  ['bend', 'bent'],
];

export interface L2DiffToken {
  status: AlignTokenStatus;
  expected?: string;
  actual?: string;
  refIndex?: number;
  hypIndex?: number;
  endingDetail?: string;
  errorType?: DictationErrorType;
}

export interface L2FocusTip {
  feature: string;
  tipVi: string;
  ipaConnected?: string;
  source: 'data' | 'generic';
}

export interface L2GradedSentence {
  itemId: string;
  referenceText: string;
  userInput: string;
  matchedReference: string;
  tokens: L2DiffToken[];
  correctWords: number;
  totalRefWords: number;
  /** Raw word accuracy in [0, 1]: correctWords / totalRefWords */
  rawAccuracy: number;
  /** Effective score in [0, 1] after optional -30% slow-play penalty */
  effectiveScore: number;
  slowPlayUsed: boolean;
  playsUsed: number;
  maxPlays: number;
  isPerfect: boolean;
  xpEarned: number;
  errorCounts: Record<DictationErrorType, number>;
  spellingWrongWords: string[];
  focusTips: L2FocusTip[];
  srsRating: Grade;
  durationMs: number;
}

export type L2Phase = 'intro' | 'playing' | 'graded' | 'recap';

export interface L2SessionState {
  phase: L2Phase;
  level: number;
  items: DictationItem[];
  currentIndex: number;
  playsUsed: number;
  maxPlays: number;
  slowPlayUsed: boolean;
  currentInput: string;
  lastGraded: L2GradedSentence | null;
  results: L2GradedSentence[];
  totalXp: number;
  startedAt: number;
  questionStartedAt: number;
  endedAt: number | null;
  spellingErrorCounts: Record<string, number>;
}

export interface L2SessionSummary {
  level: number;
  completedCount: number;
  totalQuestions: number;
  averageScorePct: number;
  perfectCount: number;
  highScoreCount: number;
  totalXp: number;
  shouldRecommendLevelUp: boolean;
  nextRecommendedLevel: number;
  errorCounts: Record<DictationErrorType, number>;
  errorPercents: Record<DictationErrorType, number>;
  totalErrors: number;
  listenSpellCandidates: string[];
  dictFullCardCount: number;
  winStatement: string;
}

export function clampL2Level(level: number): number {
  if (!Number.isFinite(level)) return L2_MIN_LEVEL;
  return Math.max(L2_MIN_LEVEL, Math.min(L2_MAX_LEVEL, Math.round(level)));
}

/**
 * Max normal-speed plays K per level (docs/games/L2-DICTATION-LADDER.md §4):
 * - Level 1–3: 3 plays
 * - Level 4–6: 2 plays
 * - Level 7–10: 1 play
 */
export function getMaxPlaysForLevel(level: number): number {
  const lvl = clampL2Level(level);
  if (lvl <= 3) return 3;
  if (lvl <= 6) return 2;
  return 1;
}

/**
 * Character-level Levenshtein edit distance (used for spelling error classification).
 */
export function charLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function isNumericToken(token: string | undefined): boolean {
  if (!token) return false;
  return /^\d+(?:[.,:]\d+)?(?:st|nd|rd|th)?$/.test(token);
}

/**
 * Convert English number phrases (e.g. "fifteen", "twenty five", "two hundred and fifty",
 * "second") into normalized numeric tokens so "15" === "fifteen" and "25" === "twenty-five".
 */
function normalizeNumberWords(tokens: string[]): string[] {
  const out: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];

    // Ordinals (first -> 1st, second -> 2nd, ...)
    if (ORDINAL_WORDS[tok] !== undefined) {
      out.push(ORDINAL_WORDS[tok]);
      i++;
      continue;
    }

    // Compound number phrase: [small/tens] [hundred] [and] [tens] [small] / [thousand]
    if (
      SMALL_NUMBERS[tok] !== undefined ||
      TENS_NUMBERS[tok] !== undefined
    ) {
      let total = 0;
      let current = 0;
      let consumed = 0;

      while (i + consumed < tokens.length) {
        const w = tokens[i + consumed];
        if (SMALL_NUMBERS[w] !== undefined) {
          // Do not merge two adjacent standalone small numbers like "one two"
          if (consumed > 0 && current > 0 && current < 20) break;
          current += SMALL_NUMBERS[w];
          consumed++;
        } else if (TENS_NUMBERS[w] !== undefined) {
          if (consumed > 0 && current > 0 && current < 100) break;
          current += TENS_NUMBERS[w];
          consumed++;
        } else if (w === 'hundred' && current > 0 && current < 100) {
          current *= 100;
          consumed++;
          if (
            tokens[i + consumed] === 'and' &&
            i + consumed + 1 < tokens.length &&
            (SMALL_NUMBERS[tokens[i + consumed + 1]] !== undefined ||
              TENS_NUMBERS[tokens[i + consumed + 1]] !== undefined)
          ) {
            consumed++;
          }
        } else if (w === 'thousand' && current > 0) {
          total += current * 1000;
          current = 0;
          consumed++;
          if (
            tokens[i + consumed] === 'and' &&
            i + consumed + 1 < tokens.length &&
            (SMALL_NUMBERS[tokens[i + consumed + 1]] !== undefined ||
              TENS_NUMBERS[tokens[i + consumed + 1]] !== undefined)
          ) {
            consumed++;
          }
        } else {
          break;
        }
      }

      if (consumed > 0) {
        out.push(String(total + current));
        i += consumed;
        continue;
      }
    }

    out.push(tok);
    i++;
  }

  return out;
}

/**
 * Normalize dictation text for word-level Levenshtein alignment:
 * - ASCII typography, lowercase
 * - Hyphenated compounds ("well-known" == "well known", "twenty-five" == "twenty five")
 * - Contractions expanded to full forms ("don't" == "do not", "can't" == "can not" == "cannot")
 * - Percent sign ("30%" == "30 percent" == "thirty percent")
 * - Number words converted to digits ("fifteen" == "15", "twenty-five" == "25")
 */
export function normalizeDictationText(raw: string): string {
  let s = normalizeTypography(raw).toLowerCase();

  // Normalize percent forms
  s = s.replace(/(\d+(?:\.\d+)?)\s*%/g, '$1 percent');
  s = s.replace(/\bper\s+cent\b/g, 'percent');

  // Split hyphenated compounds so "well-known" matches "well known"
  s = s.replace(/([a-z0-9])-([a-z0-9])/g, '$1 $2');

  // Expand contractions consistently
  for (const [pattern, replacement] of CONTRACTION_MAP) {
    s = s.replace(pattern, replacement);
  }

  // Strip punctuation except internal apostrophes, decimal dots, and time colons
  s = s.replace(/(\d)\.(\d)/g, '$1\uE001$2');
  s = s.replace(/(\d):(\d)/g, '$1\uE002$2');
  s = s.replace(/([a-z])'([a-z])/g, '$1\uE003$2');
  s = s.replace(/[^a-z0-9\s\uE001\uE002\uE003]/g, ' ');
  s = s
    .replace(/\uE001/g, '.')
    .replace(/\uE002/g, ':')
    .replace(/\uE003/g, "'");

  const rawTokens = s.trim().split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) return '';

  const normalizedTokens = normalizeNumberWords(rawTokens);
  return normalizedTokens.join(' ');
}

function isFinalConsonantDifference(expected: string, actual: string): boolean {
  const e = canonicalizeSpelling(expected);
  const a = canonicalizeSpelling(actual);
  if (e === a) return false;
  if (detectEndingError(e, a) !== null) return true;

  for (const [x, y] of IRREGULAR_FINAL_TD_PAIRS) {
    if ((e === x && a === y) || (e === y && a === x)) return true;
  }

  // Missing/extra final -t or -d on same stem (e.g. "past"/"pas", "world"/"worl", "first"/"firs")
  const checkDrop = (longer: string, shorter: string): boolean => {
    if (shorter.length < 3) return false;
    const last = longer[longer.length - 1];
    return (last === 't' || last === 'd' || last === 's') && longer.slice(0, -1) === shorter;
  };
  return checkDrop(e, a) || checkDrop(a, e);
}

/**
 * Classify a single aligned token error into one of the 5 L2 error types
 * (docs/games/L2-DICTATION-LADDER.md §4):
 * - final_consonant: missing/wrong -s/-es/-ed/-t/-d with same stem
 * - number: numeric token mismatch/missing/extra
 * - weak_form: missing/wrong function word (a, an, the, to, of, for, and, can, have, has, are, was, were, at, in, on)
 * - spelling: substitution with char edit distance <= 2 and length >= 5
 * - wrong_word: everything else
 */
export function classifyDictationError(token: AlignedToken): DictationErrorType | undefined {
  if (token.status === 'correct') return undefined;

  const expected = token.expected;
  const actual = token.actual;

  // 1. Final consonant / inflectional ending error
  if (token.status === 'ending_error') {
    return 'final_consonant';
  }
  if (expected && actual && isFinalConsonantDifference(expected, actual)) {
    return 'final_consonant';
  }

  // 2. Number error
  if (isNumericToken(expected) || isNumericToken(actual)) {
    return 'number';
  }

  // 3. Weak form (function word missing or substituted)
  if (expected && WEAK_FORM_WORDS.has(expected)) {
    return 'weak_form';
  }

  // 4. Spelling error (substitution, edit distance <= 2, word length >= 5)
  if (token.status === 'substitution' && expected && actual) {
    const e = canonicalizeSpelling(expected);
    const a = canonicalizeSpelling(actual);
    if (Math.max(e.length, a.length) >= 5 && charLevenshtein(e, a) <= 2) {
      return 'spelling';
    }
  }

  // 5. Fallback
  return 'wrong_word';
}

export function createEmptyErrorCounts(): Record<DictationErrorType, number> {
  return {
    final_consonant: 0,
    weak_form: 0,
    spelling: 0,
    number: 0,
    wrong_word: 0,
  };
}

/**
 * Map effective sentence score [0, 1] to FSRS rating (docs/games/L2-DICTATION-LADDER.md §8):
 * - >= 95%: Good
 * - 80%–95%: Hard
 * - < 80%: Again
 */
export function rateDictationScore(score: number): Grade {
  if (score >= 0.95) return Rating.Good;
  if (score >= 0.8) return Rating.Hard;
  return Rating.Again;
}

const GENERIC_ERROR_TIPS: Partial<Record<DictationErrorType, string>> = {
  final_consonant:
    'Chú ý âm cuối (-s, -es, -ed, -t, -d): trong giọng nói tự nhiên âm cuối hay nối sang từ sau hoặc đọc rất nhẹ, hãy kiểm tra lại ngữ pháp số nhiều/thì quá khứ.',
  weak_form:
    'Chú ý âm yếu (a, an, the, to, of, for, was, were...): các từ chức năng thường bị lướt nhanh thành /ə/, hãy nghe nhịp câu và kiểm tra cấu trúc ngữ pháp.',
};

/**
 * Select up to 2 focus tips from item.focus[] and append generic Vietnamese tips
 * if final_consonant or weak_form errors occurred without a matching data focus tip.
 */
export function resolveFocusTips(
  item: DictationItem,
  tokens: readonly L2DiffToken[],
): L2FocusTip[] {
  const erroredRefIndices = new Set<number>();
  const detectedErrorTypes = new Set<DictationErrorType>();

  for (const t of tokens) {
    if (t.errorType) {
      detectedErrorTypes.add(t.errorType);
      if (t.refIndex !== undefined) {
        erroredRefIndices.add(t.refIndex);
      }
    }
  }

  const prioritized = [...item.focus].sort((a, b) => {
    const aHit =
      erroredRefIndices.has(a.tokenIndex) ||
      detectedErrorTypes.has(a.feature as DictationErrorType);
    const bHit =
      erroredRefIndices.has(b.tokenIndex) ||
      detectedErrorTypes.has(b.feature as DictationErrorType);
    if (aHit !== bHit) return aHit ? -1 : 1;
    return a.tokenIndex - b.tokenIndex;
  });

  const tips: L2FocusTip[] = prioritized.slice(0, 2).map((f) => ({
    feature: f.feature,
    tipVi: f.tipVi,
    ipaConnected: f.ipaConnected,
    source: 'data',
  }));

  for (const errType of ['final_consonant', 'weak_form'] as const) {
    if (
      detectedErrorTypes.has(errType) &&
      !tips.some((t) => t.feature === errType)
    ) {
      const genericTip = GENERIC_ERROR_TIPS[errType];
      if (genericTip) {
        tips.push({
          feature: errType,
          tipVi: genericTip,
          source: 'generic',
        });
      }
    }
  }

  return tips;
}

/**
 * Grade a single dictation sentence against item.text (and optional acceptedVariants)
 * using word-level Levenshtein alignment from core/text/align.ts.
 */
export function gradeDictationSentence(
  item: DictationItem,
  userInput: string,
  options: {
    level: number;
    playsUsed: number;
    slowPlayUsed: boolean;
    durationMs?: number;
  },
): L2GradedSentence {
  const candidates = [item.text, ...(item.acceptedVariants ?? [])];
  const normHyp = normalizeDictationText(userInput);

  let bestRef = item.text;
  let bestAlign = alignTranscript(normalizeDictationText(item.text), normHyp);

  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i];
    const aligned = alignTranscript(normalizeDictationText(candidate), normHyp);
    const alignedErrs =
      aligned.counts.substitution +
      aligned.counts.missing +
      aligned.counts.extra +
      aligned.counts.ending_error;
    const bestErrs =
      bestAlign.counts.substitution +
      bestAlign.counts.missing +
      bestAlign.counts.extra +
      bestAlign.counts.ending_error;

    if (
      aligned.accuracy > bestAlign.accuracy ||
      (aligned.accuracy === bestAlign.accuracy && alignedErrs < bestErrs)
    ) {
      bestRef = candidate;
      bestAlign = aligned;
    }
  }

  const errorCounts = createEmptyErrorCounts();
  const spellingWrongWords: string[] = [];

  const tokens: L2DiffToken[] = bestAlign.tokens.map((tok) => {
    const errorType = classifyDictationError(tok);
    if (errorType) {
      errorCounts[errorType] += 1;
      if (errorType === 'spelling' && tok.expected) {
        spellingWrongWords.push(canonicalizeSpelling(tok.expected));
      }
    }
    return {
      ...tok,
      errorType,
    };
  });

  const totalRefWords = tokens.filter((t) => t.status !== 'extra').length;
  const correctWords = bestAlign.counts.correct;
  const rawAccuracy = totalRefWords > 0 ? correctWords / totalRefWords : 0;
  const effectiveScore = options.slowPlayUsed
    ? Math.max(0, rawAccuracy * (1 - L2_SLOW_PLAY_PENALTY))
    : rawAccuracy;

  const isPerfect =
    totalRefWords > 0 &&
    correctWords === totalRefWords &&
    bestAlign.counts.extra === 0 &&
    !options.slowPlayUsed;

  const xpEarned =
    Math.round(effectiveScore * 10) + (isPerfect ? L2_PERFECT_BONUS_XP : 0);

  const maxPlays = getMaxPlaysForLevel(options.level);
  const focusTips = resolveFocusTips(item, tokens);
  const srsRating = rateDictationScore(effectiveScore);

  return {
    itemId: item.id,
    referenceText: item.text,
    userInput,
    matchedReference: bestRef,
    tokens,
    correctWords,
    totalRefWords,
    rawAccuracy,
    effectiveScore,
    slowPlayUsed: options.slowPlayUsed,
    playsUsed: options.playsUsed,
    maxPlays,
    isPerfect,
    xpEarned,
    errorCounts,
    spellingWrongWords,
    focusTips,
    srsRating,
    durationMs: Math.max(0, Math.round(options.durationMs ?? 0)),
  };
}

/**
 * Select a 10-item session pool prioritized around the requested level.
 */
export function selectL2SessionItems(
  pool: readonly DictationItem[],
  level: number,
  count = L2_SESSION_LENGTH,
): DictationItem[] {
  if (pool.length === 0) return [];
  const targetLevel = clampL2Level(level);
  const sorted = [...pool].sort((a, b) => {
    const da = Math.abs(a.level - targetLevel);
    const db = Math.abs(b.level - targetLevel);
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });

  return sorted.slice(0, Math.min(count, sorted.length));
}

export function createL2Session(
  items: readonly DictationItem[],
  level: number,
  now = Date.now(),
): L2SessionState {
  const safeLevel = clampL2Level(level);
  const sessionItems = items.slice(0, L2_SESSION_LENGTH);
  return {
    phase: 'intro',
    level: safeLevel,
    items: sessionItems,
    currentIndex: 0,
    playsUsed: 0,
    maxPlays: getMaxPlaysForLevel(safeLevel),
    slowPlayUsed: false,
    currentInput: '',
    lastGraded: null,
    results: [],
    totalXp: 0,
    startedAt: now,
    questionStartedAt: now,
    endedAt: null,
    spellingErrorCounts: {},
  };
}

export function startL2Session(
  state: L2SessionState,
  now = Date.now(),
): L2SessionState {
  if (state.items.length === 0) return state;
  return {
    ...state,
    phase: 'playing',
    currentIndex: 0,
    playsUsed: 0,
    slowPlayUsed: false,
    currentInput: '',
    lastGraded: null,
    results: [],
    totalXp: 0,
    startedAt: now,
    questionStartedAt: now,
    endedAt: null,
    spellingErrorCounts: {},
  };
}

export function canPlayNormal(state: L2SessionState): boolean {
  return state.phase === 'playing' && state.playsUsed < state.maxPlays;
}

export function canPlaySlow(state: L2SessionState): boolean {
  return state.phase === 'playing' && !state.slowPlayUsed;
}

export function recordNormalPlay(state: L2SessionState): L2SessionState {
  if (!canPlayNormal(state)) return state;
  return {
    ...state,
    playsUsed: state.playsUsed + 1,
  };
}

export function recordSlowPlay(state: L2SessionState): L2SessionState {
  if (!canPlaySlow(state)) return state;
  return {
    ...state,
    slowPlayUsed: true,
  };
}

export function setDictationInput(
  state: L2SessionState,
  value: string,
): L2SessionState {
  if (state.phase !== 'playing') return state;
  return {
    ...state,
    currentInput: value,
  };
}

export function submitCurrentSentence(
  state: L2SessionState,
  now = Date.now(),
): L2SessionState {
  if (state.phase !== 'playing') return state;
  const item = state.items[state.currentIndex];
  if (!item) return state;

  const graded = gradeDictationSentence(item, state.currentInput, {
    level: state.level,
    playsUsed: state.playsUsed,
    slowPlayUsed: state.slowPlayUsed,
    durationMs: Math.max(0, now - state.questionStartedAt),
  });

  const nextSpellingCounts = { ...state.spellingErrorCounts };
  for (const word of graded.spellingWrongWords) {
    nextSpellingCounts[word] = (nextSpellingCounts[word] ?? 0) + 1;
  }

  return {
    ...state,
    phase: 'graded',
    lastGraded: graded,
    results: [...state.results, graded],
    totalXp: state.totalXp + graded.xpEarned,
    spellingErrorCounts: nextSpellingCounts,
  };
}

export function advanceToNextSentence(
  state: L2SessionState,
  now = Date.now(),
): L2SessionState {
  if (state.phase !== 'graded') return state;
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.items.length) {
    return {
      ...state,
      phase: 'recap',
      endedAt: now,
    };
  }
  return {
    ...state,
    phase: 'playing',
    currentIndex: nextIndex,
    playsUsed: 0,
    slowPlayUsed: false,
    currentInput: '',
    lastGraded: null,
    questionStartedAt: now,
  };
}

export function summarizeL2Session(state: L2SessionState): L2SessionSummary {
  const results = state.results;
  const completedCount = results.length;
  const totalQuestions = state.items.length;

  const avgScore =
    completedCount > 0
      ? results.reduce((sum, r) => sum + r.effectiveScore, 0) / completedCount
      : 0;
  const averageScorePct = Math.round(avgScore * 100);
  const perfectCount = results.filter((r) => r.isPerfect).length;
  const highScoreCount = results.filter(
    (r) => r.effectiveScore >= L2_PROMOTION_SCORE_THRESHOLD,
  ).length;

  const shouldRecommendLevelUp =
    state.level < L2_MAX_LEVEL &&
    completedCount >= L2_SESSION_LENGTH &&
    highScoreCount >= L2_PROMOTION_THRESHOLD_COUNT;
  const nextRecommendedLevel = shouldRecommendLevelUp
    ? Math.min(L2_MAX_LEVEL, state.level + 1)
    : state.level;

  const errorCounts = createEmptyErrorCounts();
  for (const r of results) {
    for (const key of ALL_DICTATION_ERROR_TYPES) {
      errorCounts[key] += r.errorCounts[key];
    }
  }
  const totalErrors = ALL_DICTATION_ERROR_TYPES.reduce(
    (sum, k) => sum + errorCounts[k],
    0,
  );
  const errorPercents = createEmptyErrorCounts();
  for (const key of ALL_DICTATION_ERROR_TYPES) {
    errorPercents[key] =
      totalErrors > 0 ? Math.round((errorCounts[key] / totalErrors) * 100) : 0;
  }

  const listenSpellCandidates = Object.entries(state.spellingErrorCounts)
    .filter(([, count]) => count >= L2_SPELLING_CARD_THRESHOLD)
    .map(([word]) => word)
    .sort();

  const dictFullCardCount = results.filter(
    (r) => r.effectiveScore < L2_SRS_CREATE_THRESHOLD,
  ).length;

  let winStatement: string;
  if (shouldRecommendLevelUp) {
    winStatement = `${highScoreCount}/${completedCount} câu đạt ≥ 90% ở Level ${state.level} — sẵn sàng leo lên Level ${nextRecommendedLevel}!`;
  } else if (perfectCount >= 5) {
    winStatement = `${perfectCount}/${completedCount} câu chép hoàn hảo 100% ở Level ${state.level}.`;
  } else if (totalErrors === 0 && completedCount > 0) {
    winStatement = `Không có lỗi nào trong cả phiên Level ${state.level} — khả năng nghe chi tiết rất vững!`;
  } else {
    const topError = [...ALL_DICTATION_ERROR_TYPES].sort(
      (a, b) => errorCounts[b] - errorCounts[a],
    )[0];
    winStatement = `Độ chính xác trung bình ${averageScorePct}% ở Level ${state.level}. Điểm cần tập trung nhất: ${DICTATION_ERROR_LABELS_VI[topError]} (${errorCounts[topError]} lỗi).`;
  }

  return {
    level: state.level,
    completedCount,
    totalQuestions,
    averageScorePct,
    perfectCount,
    highScoreCount,
    totalXp: state.totalXp,
    shouldRecommendLevelUp,
    nextRecommendedLevel,
    errorCounts,
    errorPercents,
    totalErrors,
    listenSpellCandidates,
    dictFullCardCount,
    winStatement,
  };
}

/**
 * Build an atomic SessionSavePayload for attemptRepo.saveSession():
 * - Sentences < 70% create/update `dict:*#dict_full` cards (rating: >=95% Good, 80-95% Hard, <80% Again).
 * - Existing `dict:*#dict_full` cards are also updated with their new rating.
 * - Words with >= 2 spelling errors create/update `vocab:<slug>#listen_spell` cards for V1.
 */
export function buildL2SessionSavePayload(
  state: L2SessionState,
  existingCards: ReadonlyMap<string, SRSCard> = new Map(),
  nowDate: Date = new Date(),
): SessionSavePayload {
  const nowMs = nowDate.getTime();
  const endedAt = state.endedAt ?? nowMs;
  const updatedCardsMap = new Map<string, SRSCard>();
  const reviews: Array<Omit<ReviewRecord, 'id'>> = [];
  const attemptItems: AttemptItem[] = [];

  for (const r of state.results) {
    attemptItems.push({
      itemId: r.itemId,
      correct: r.effectiveScore >= L2_PROMOTION_SCORE_THRESHOLD,
      responseTimeMs: r.durationMs,
    });

    const cardId = makeCardId(r.itemId, 'dict_full');
    const existing = updatedCardsMap.get(cardId) ?? existingCards.get(cardId);
    const shouldPersistDictCard =
      r.effectiveScore < L2_SRS_CREATE_THRESHOLD || existing !== undefined;

    if (shouldPersistDictCard) {
      const baseCard =
        existing ??
        createNewCard(r.itemId, 'dict_full', {
          now: nowDate,
          unlocked: true,
          source: 'dictation',
        });
      const scheduled = scheduleCard(baseCard, r.srsRating, nowDate);
      updatedCardsMap.set(cardId, scheduled.card);
      reviews.push({
        cardId,
        rating: r.srsRating,
        correct: r.srsRating !== Rating.Again,
        hintUsed: r.slowPlayUsed,
        durationMs: r.durationMs,
        ts: endedAt,
        gameId: 'l2',
        prevState: scheduled.prevState,
      });
    }
  }

  // Words with >= 2 spelling errors -> create/update vocab:<slug>#listen_spell for V1
  for (const [word, count] of Object.entries(state.spellingErrorCounts)) {
    if (count < L2_SPELLING_CARD_THRESHOLD) continue;
    const slug = slugifyWord(word);
    if (!slug) continue;
    const vocabItemId = `vocab:${slug}`;
    const cardId = makeCardId(vocabItemId, 'listen_spell');
    const existing = updatedCardsMap.get(cardId) ?? existingCards.get(cardId);
    const baseCard =
      existing ??
      createNewCard(vocabItemId, 'listen_spell', {
        now: nowDate,
        unlocked: true,
        source: 'dictation',
      });
    const scheduled = scheduleCard(baseCard, Rating.Again, nowDate);
    updatedCardsMap.set(cardId, scheduled.card);
    reviews.push({
      cardId,
      rating: Rating.Again,
      correct: false,
      hintUsed: false,
      durationMs: 0,
      ts: endedAt,
      gameId: 'l2',
      prevState: scheduled.prevState,
    });
  }

  const highScoreCount = state.results.filter(
    (r) => r.effectiveScore >= L2_PROMOTION_SCORE_THRESHOLD,
  ).length;

  return {
    attempt: {
      gameId: 'l2',
      mode: 'training',
      startedAt: state.startedAt,
      endedAt,
      score: highScoreCount,
      total: state.results.length,
      xp: state.totalXp,
      items: attemptItems,
    },
    updatedCards: Array.from(updatedCardsMap.values()),
    reviews,
  };
}
