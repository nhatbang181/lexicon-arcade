import type {
  ReadingPassage,
  ReadingQType,
  ReadingQuestion,
  ReadingQuestionGroup,
  ReadingTrap,
  Span,
} from '../../core/content/schemas';
import { accuracyToBand } from '../../core/band/tables';
import { evaluateEvidence, type OffsetSpan } from '../../core/scoring/evidence';
import {
  scoreReadingAnswer,
  type ReadingQuestionScoringInput,
  type ReadingScoreResult,
} from '../../core/scoring/readingAnswer';
import { isCardRetired } from '../../core/srs/faces';
import {
  createNewCard,
  Rating,
  scheduleCard,
  type Grade,
  type SRSCard,
} from '../../core/srs/fsrsAdapter';
import type { ProgressPayload } from '../../core/storage/repos/attemptRepo';
import type { UserItemInput } from '../../core/storage/repos/userItemRepo';
import { seededRng, shuffleSeeded } from './rng';

export const R1_RETRY_MAX_ITEMS = 5;

// ---------------------------------------------------------------------------
// Constants & Labels
// ---------------------------------------------------------------------------

export const READING_TRAP_LABELS_VI: Record<ReadingTrap, string> = {
  qualifier: 'Bẫy lượng từ / mức độ (all, most, only, never)',
  comparison: 'Bẫy so sánh ngược / sai đối tượng',
  causation: 'Bẫy quan hệ nguyên nhân – kết quả',
  time_sequence: 'Bẫy trình tự thời gian',
  number_date: 'Bẫy con số / mốc thời gian',
  opinion_vs_fact: 'Bẫy ý kiến tác giả vs sự thật',
  partial_match: 'Bẫy đúng nửa câu, sai nửa còn lại',
  keyword_echo: 'Bẫy lặp từ khoá nhưng khác nghĩa',
  extra_claim: 'Bẫy thêm chi tiết bài không nhắc (NG)',
};

export type JudgeVerdict = 'TRUE' | 'FALSE' | 'NOT GIVEN' | 'YES' | 'NO';
export type VerdictSlot = 'TRUE' | 'FALSE' | 'NOT GIVEN';

export type JudgeOutcome = 'perfect' | 'lucky' | 'misread' | 'lost';

export interface R1DifficultyConfig {
  level: number;
  allowedPassageLevels: ReadonlyArray<'P1' | 'P2' | 'P3'>;
  glossaryDefaultOn: boolean;
  allowParagraphHint: boolean;
  targetSecPerQuestion: number | null;
  warnOverSec: number | null;
  mixTfngAndYnng: boolean;
}

export function getR1DifficultyConfig(level: number): R1DifficultyConfig {
  const clamped = Math.max(1, Math.min(10, Math.round(level)));
  if (clamped <= 2) {
    return {
      level: clamped,
      allowedPassageLevels: ['P1'],
      glossaryDefaultOn: true,
      allowParagraphHint: true,
      targetSecPerQuestion: null,
      warnOverSec: null,
      mixTfngAndYnng: false,
    };
  }
  if (clamped <= 4) {
    return {
      level: clamped,
      allowedPassageLevels: ['P1', 'P2'],
      glossaryDefaultOn: false,
      allowParagraphHint: true,
      targetSecPerQuestion: null,
      warnOverSec: null,
      mixTfngAndYnng: false,
    };
  }
  if (clamped <= 6) {
    return {
      level: clamped,
      allowedPassageLevels: ['P2'],
      glossaryDefaultOn: false,
      allowParagraphHint: false,
      targetSecPerQuestion: 75,
      warnOverSec: null,
      mixTfngAndYnng: false,
    };
  }
  if (clamped <= 8) {
    return {
      level: clamped,
      allowedPassageLevels: ['P2', 'P3'],
      glossaryDefaultOn: false,
      allowParagraphHint: false,
      targetSecPerQuestion: clamped >= 8 ? 55 : 65,
      warnOverSec: null,
      mixTfngAndYnng: true,
    };
  }
  return {
    level: clamped,
    allowedPassageLevels: ['P3'],
    glossaryDefaultOn: false,
    allowParagraphHint: false,
    targetSecPerQuestion: 55,
    warnOverSec: 90,
    mixTfngAndYnng: true,
  };
}

export interface R1CatalogCandidate {
  id: string;
  level: 'P1' | 'P2' | 'P3';
  hasJudgeQuestions: boolean;
  hasTfng?: boolean;
  hasYnng?: boolean;
}

export interface SelectR1PassageOptions {
  recentIds?: readonly string[];
  seed?: string;
  /** PP-05: ưu tiên bài có YNNG khi người học đã vững TFNG hoặc ở level ≥ 7. */
  preferYnng?: boolean;
}

/**
 * Chọn passage cho R1 theo `allowedPassageLevels` của `level`, tránh bài chơi trong 14 ngày gần đây
 * và ưu tiên xen kẽ TFNG↔YNNG khi level ≥ 7 hoặc `preferYnng` bật (R1-1, PP-05).
 */
export function selectR1Passage<T extends R1CatalogCandidate>(
  catalog: readonly T[],
  level: number,
  options: SelectR1PassageOptions = {},
): T | null {
  const judgePool = catalog.filter((c) => c.hasJudgeQuestions);
  if (judgePool.length === 0) return catalog[0] ?? null;

  const config = getR1DifficultyConfig(level);
  const byLevel = judgePool.filter((c) => config.allowedPassageLevels.includes(c.level));
  const pool = byLevel.length > 0 ? byLevel : judgePool;

  const recentSet = new Set(options.recentIds ?? []);
  const fresh = pool.filter((c) => !recentSet.has(c.id));
  const candidates = fresh.length > 0 ? fresh : pool;

  const rng = seededRng(options.seed ?? `r1:${level}:${candidates.length}`);
  if (config.mixTfngAndYnng || options.preferYnng) {
    const ynngOnes = candidates.filter((c) => c.hasYnng);
    if (ynngOnes.length > 0) {
      return shuffleSeeded(ynngOnes, rng)[0];
    }
  }

  return shuffleSeeded(candidates, rng)[0];
}

// ---------------------------------------------------------------------------
// 3x3 Confusion Matrix (TRUE / FALSE / NOT GIVEN, with YES->TRUE, NO->FALSE)
// ---------------------------------------------------------------------------

export type ConfusionMatrix3x3 = Record<VerdictSlot, Record<VerdictSlot, number>>;

export function normalizeVerdictSlot(raw: string): VerdictSlot | null {
  const clean = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  if (clean === 'TRUE' || clean === 'T' || clean === 'YES' || clean === 'Y') return 'TRUE';
  if (clean === 'FALSE' || clean === 'F' || clean === 'NO' || clean === 'N') return 'FALSE';
  if (clean === 'NOT GIVEN' || clean === 'NG' || clean === 'NOTGIVEN') return 'NOT GIVEN';
  return null;
}

export function createEmptyConfusionMatrix(): ConfusionMatrix3x3 {
  return {
    TRUE: { TRUE: 0, FALSE: 0, 'NOT GIVEN': 0 },
    FALSE: { TRUE: 0, FALSE: 0, 'NOT GIVEN': 0 },
    'NOT GIVEN': { TRUE: 0, FALSE: 0, 'NOT GIVEN': 0 },
  };
}

export function recordConfusion(
  matrix: ConfusionMatrix3x3,
  expectedRaw: string,
  actualRaw: string,
): ConfusionMatrix3x3 {
  const exp = normalizeVerdictSlot(expectedRaw);
  const act = normalizeVerdictSlot(actualRaw);
  if (!exp || !act) return matrix;
  return {
    TRUE: { ...matrix.TRUE },
    FALSE: { ...matrix.FALSE },
    'NOT GIVEN': { ...matrix['NOT GIVEN'] },
    [exp]: {
      ...matrix[exp],
      [act]: matrix[exp][act] + 1,
    },
  };
}

export function mergeConfusionMatrices(
  a: ConfusionMatrix3x3,
  b: ConfusionMatrix3x3,
): ConfusionMatrix3x3 {
  const slots: VerdictSlot[] = ['TRUE', 'FALSE', 'NOT GIVEN'];
  const out = createEmptyConfusionMatrix();
  for (const r of slots) {
    for (const c of slots) {
      out[r][c] = (a[r]?.[c] ?? 0) + (b[r]?.[c] ?? 0);
    }
  }
  return out;
}

export function getFalseVsNgStats(matrix: ConfusionMatrix3x3): {
  correct: number;
  total: number;
  confusedCount: number;
} {
  const falseCorrect = matrix.FALSE.FALSE;
  const ngCorrect = matrix['NOT GIVEN']['NOT GIVEN'];
  const falseTotal = matrix.FALSE.TRUE + matrix.FALSE.FALSE + matrix.FALSE['NOT GIVEN'];
  const ngTotal =
    matrix['NOT GIVEN'].TRUE + matrix['NOT GIVEN'].FALSE + matrix['NOT GIVEN']['NOT GIVEN'];
  const confusedCount = matrix.FALSE['NOT GIVEN'] + matrix['NOT GIVEN'].FALSE;
  return {
    correct: falseCorrect + ngCorrect,
    total: falseTotal + ngTotal,
    confusedCount,
  };
}

// ---------------------------------------------------------------------------
// Trap Stats
// ---------------------------------------------------------------------------

export type TrapStatsMap = Partial<Record<ReadingTrap, { total: number; wrong: number }>>;

export function recordTrapStat(
  stats: TrapStatsMap,
  trapType: ReadingTrap | undefined,
  wasWrong: boolean,
): TrapStatsMap {
  if (!trapType) return stats;
  const prev = stats[trapType] ?? { total: 0, wrong: 0 };
  return {
    ...stats,
    [trapType]: {
      total: prev.total + 1,
      wrong: prev.wrong + (wasWrong ? 1 : 0),
    },
  };
}

// ---------------------------------------------------------------------------
// Pure Sentence Bounds & Evidence Matching (IoU >= 0.3 OR same sentence)
// ---------------------------------------------------------------------------

const ABBREV_REGEX = /(?:Dr|Mr|Mrs|Ms|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|U\.S|U\.K|Fig|No)\.$/i;

export function findParagraphSentenceBounds(
  text: string,
  offset: number,
): { start: number; end: number } {
  if (!text.length) return { start: 0, end: 0 };
  const clamped = Math.max(0, Math.min(text.length - 1, offset));
  const cuts: number[] = [0];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== '.' && ch !== '!' && ch !== '?') continue;
    if (
      ch === '.' &&
      i > 0 &&
      i + 1 < text.length &&
      /\d/.test(text[i - 1]) &&
      /\d/.test(text[i + 1])
    ) {
      continue;
    }
    const next = text[i + 1];
    if (
      next !== undefined &&
      next !== ' ' &&
      next !== '\n' &&
      next !== '\t' &&
      next !== '"' &&
      next !== '\u201d' &&
      next !== ')'
    ) {
      continue;
    }
    const tail = text.slice(Math.max(0, i - 10), i + 1);
    if (ch === '.' && ABBREV_REGEX.test(tail)) continue;

    let end = i + 1;
    while (end < text.length && (text[end] === '"' || text[end] === '\u201d' || text[end] === ')')) {
      end++;
    }
    cuts.push(end);
  }
  if (cuts[cuts.length - 1] < text.length) cuts.push(text.length);

  for (let idx = 0; idx < cuts.length - 1; idx++) {
    let start = cuts[idx];
    let end = cuts[idx + 1];
    if (clamped >= start && clamped < end) {
      while (start < end && /\s/.test(text[start])) start++;
      while (end > start && /\s/.test(text[end - 1])) end--;
      return { start, end: Math.max(start, end) };
    }
  }
  return { start: 0, end: text.length };
}

export interface JudgeEvidenceCheckResult {
  passed: boolean;
  iou: number;
  matchedBy: 'iou' | 'same_sentence' | 'ng_no_direct_info' | 'ng_no_gold' | 'none';
  highlightedTooBroad: boolean;
}

export function evaluateJudgeEvidence(
  passage: Pick<ReadingPassage, 'paragraphs'>,
  goldEvidence: readonly Span[],
  expectedVerdict: string,
  userSpan: Span | null,
  noDirectInfo: boolean,
): JudgeEvidenceCheckResult {
  const expectedSlot = normalizeVerdictSlot(expectedVerdict);
  const isExpectedNg = expectedSlot === 'NOT GIVEN';

  if (isExpectedNg) {
    if (noDirectInfo) {
      return { passed: true, iou: 1, matchedBy: 'ng_no_direct_info', highlightedTooBroad: false };
    }
    if (goldEvidence.length === 0) {
      return { passed: true, iou: 1, matchedBy: 'ng_no_gold', highlightedTooBroad: false };
    }
  }

  // Non-NG questions require direct highlighted evidence
  if (noDirectInfo || !userSpan || userSpan.end <= userSpan.start) {
    return { passed: false, iou: 0, matchedBy: 'none', highlightedTooBroad: false };
  }

  // Layer 1: Char-level IoU >= 0.3 via core/scoring/evidence.ts
  const iouEval = evaluateEvidence([userSpan], goldEvidence, { threshold: 0.3, mode: 'char' });
  if (iouEval.passed) {
    return { passed: true, iou: iouEval.iou, matchedBy: 'iou', highlightedTooBroad: false };
  }

  // Layer 2: Same-sentence check (rejecting overly broad multi-sentence / full-paragraph highlights)
  let highlightedTooBroad = false;
  for (const gold of goldEvidence) {
    if (gold.paragraph !== userSpan.paragraph) continue;
    const para = passage.paragraphs.find((p) => p.label === gold.paragraph);
    if (!para) continue;

    const goldMid = Math.floor((gold.start + gold.end) / 2);
    const goldSentence = findParagraphSentenceBounds(para.text, goldMid);
    const sentenceLen = Math.max(1, goldSentence.end - goldSentence.start);
    const userLen = userSpan.end - userSpan.start;

    const overlapsGoldSentence =
      Math.min(userSpan.end, goldSentence.end) - Math.max(userSpan.start, goldSentence.start) > 0;

    if (!overlapsGoldSentence) continue;

    // Guard against highlighting the entire paragraph (R1 spec §11)
    if (userLen > sentenceLen * 1.35) {
      highlightedTooBroad = true;
      continue;
    }

    // User span lies within the same sentence (with small 2-char punctuation tolerance)
    if (userSpan.start >= goldSentence.start - 2 && userSpan.end <= goldSentence.end + 2) {
      return {
        passed: true,
        iou: iouEval.iou,
        matchedBy: 'same_sentence',
        highlightedTooBroad: false,
      };
    }
  }

  return {
    passed: false,
    iou: iouEval.iou,
    matchedBy: 'none',
    highlightedTooBroad,
  };
}

// ---------------------------------------------------------------------------
// SRS Helpers: tfng:<qid> retry cards & paraphrase suggestions from `steps`
// ---------------------------------------------------------------------------

export interface ParaphraseSuggestion {
  id: `para:${string}`;
  qid: string;
  sourcePhrase: string;
  targetPhrase: string;
  rawStep: string;
}

function slugifyPhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

/**
 * Extract paraphrase pairs (e.g. `"doubled" ↔ "by 100%"` or `"narrow streets" <-> "narrow corridors"`)
 * from question reasoning `steps` so learners can add them to SRS.
 */
export function extractParaphraseSuggestions(
  steps: readonly string[] | undefined,
  qid: string,
): ParaphraseSuggestion[] {
  if (!steps || steps.length === 0) return [];
  const results: ParaphraseSuggestion[] = [];
  const seen = new Set<string>();

  const pairRegex = /["“']([^"”']{2,80})["”']\s*(?:↔|<->)\s*["“']([^"”']{2,80})["”']/g;

  for (const step of steps) {
    let match: RegExpExecArray | null;
    pairRegex.lastIndex = 0;
    while ((match = pairRegex.exec(step)) !== null) {
      const sourcePhrase = match[1].trim();
      const targetPhrase = match[2].trim();
      const key = `${sourcePhrase.toLowerCase()}|${targetPhrase.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const slug = slugifyPhrase(`${qid}-${sourcePhrase}`);
      results.push({
        id: `para:r1-${slug || results.length + 1}`,
        qid,
        sourcePhrase,
        targetPhrase,
        rawStep: step,
      });
    }
  }

  return results;
}

/**
 * Create a `tfng:<qid>` retry card (face `tfng_retry`) for misread/lost items.
 * Never creates cards for `reserved` exam passages ([INV-X1] / R1 §8).
 */
export function createTfngRetryCardIfNeeded(
  passage: Pick<ReadingPassage, 'reserved'>,
  question: Pick<ReadingQuestion, 'qid'>,
  outcome: JudgeOutcome,
  now: Date = new Date(),
): SRSCard | null {
  if (passage.reserved === true) return null;
  if (outcome !== 'misread' && outcome !== 'lost') return null;

  return createNewCard(`tfng:${question.qid}`, 'tfng_retry', {
    now,
    unlocked: true,
    source: 'reading_mistake',
  });
}

/**
 * Review a `tfng_retry` SRS card and auto-retire (suspend via `unlocked: false`)
 * once it reaches 3 successful repetitions (docs/02 §3.2 & R1 §8).
 */
export function reviewTfngRetryCard(
  card: SRSCard,
  correct: boolean,
  now: Date = new Date(),
): { card: SRSCard; retired: boolean } {
  const rating: Grade = correct ? Rating.Good : Rating.Again;
  const scheduled = scheduleCard(card, rating, now);
  const retired = isCardRetired(scheduled.card);
  const finalCard: SRSCard = retired
    ? { ...scheduled.card, unlocked: false }
    : scheduled.card;
  return { card: finalCard, retired };
}

export function createParaphraseSrsCard(
  suggestion: Pick<ParaphraseSuggestion, 'id'>,
  now: Date = new Date(),
): SRSCard {
  return createNewCard(suggestion.id, 'para_match', {
    now,
    unlocked: true,
    source: 'reading_mistake',
  });
}

// ---------------------------------------------------------------------------
// Judge Mode Pure State Machine
// ---------------------------------------------------------------------------

export interface JudgeQuestionEntry {
  groupType: 'tfng' | 'ynng';
  instructions: string;
  question: ReadingQuestion;
}

export interface JudgeAttemptResult {
  qid: string;
  number: number;
  groupType: 'tfng' | 'ynng';
  prompt: string;
  userVerdict: JudgeVerdict;
  expectedVerdict: string;
  answerCorrect: boolean;
  evidenceCheck: JudgeEvidenceCheckResult;
  outcome: JudgeOutcome;
  outcomeLabelVi: string;
  diagnosisVi: string;
  xpEarned: number;
  fsrsRating: Grade;
  hintUsed: boolean;
  responseTimeMs: number;
  trapType?: ReadingTrap;
  goldEvidence: readonly Span[];
  userSpan: Span | null;
  noDirectInfo: boolean;
  paraphraseSuggestions: ParaphraseSuggestion[];
  retryCard: SRSCard | null;
}

export interface JudgeSessionState {
  passage: ReadingPassage;
  /** Phiên "Ôn lại câu sai": 0 XP, không FSRS, không lưu attempt (C3). */
  isRetry: boolean;
  level: number;
  difficulty: R1DifficultyConfig;
  items: JudgeQuestionEntry[];
  currentIndex: number;
  selectedSpan: Span | null;
  noDirectInfo: boolean;
  hintedParagraph: string | null;
  hintUsedForCurrent: boolean;
  lastResult: JudgeAttemptResult | null;
  results: JudgeAttemptResult[];
  confusionMatrix: ConfusionMatrix3x3;
  trapStats: TrapStatsMap;
  totalXp: number;
  startedAt: number;
  finished: boolean;
  finishedAt: number | null;
  /** Nội dung thẻ `tfng:<qid>` cần ghi xuống `userItems` cho V1 (G1). */
  producedItems: Record<string, UserItemInput>;
}

export function extractJudgeQuestions(passage: ReadingPassage): JudgeQuestionEntry[] {
  const out: JudgeQuestionEntry[] = [];
  for (const group of passage.questionGroups) {
    if (group.type !== 'tfng' && group.type !== 'ynng') continue;
    for (const q of group.questions) {
      out.push({
        groupType: group.type,
        instructions: group.instructions,
        question: q,
      });
    }
  }
  return out;
}

export function createJudgeSession(
  passage: ReadingPassage,
  options: { level?: number; nowMs?: number } = {},
): JudgeSessionState {
  const level = options.level ?? 1;
  const difficulty = getR1DifficultyConfig(level);
  const items = extractJudgeQuestions(passage);
  const startedAt = options.nowMs ?? Date.now();

  return {
    passage,
    isRetry: false,
    level: difficulty.level,
    difficulty,
    items,
    currentIndex: 0,
    selectedSpan: null,
    noDirectInfo: false,
    hintedParagraph: null,
    hintUsedForCurrent: false,
    lastResult: null,
    results: [],
    confusionMatrix: createEmptyConfusionMatrix(),
    trapStats: {},
    totalXp: 0,
    startedAt,
    finished: items.length === 0,
    finishedAt: items.length === 0 ? startedAt : null,
    producedItems: {},
  };
}

/** Phiên "Ôn lại câu sai" (C3): tối đa 5 câu sai, 0 XP, 0 FSRS, không ghi attempt. */
export function createJudgeRetrySession(
  prev: JudgeSessionState,
  nowMs: number = Date.now(),
): JudgeSessionState | null {
  const wrongQids = new Set(
    prev.results
      .filter((r) => !r.answerCorrect || !r.evidenceCheck.passed)
      .slice(0, R1_RETRY_MAX_ITEMS)
      .map((r) => r.qid),
  );
  const retryItems = prev.items.filter((it) => wrongQids.has(it.question.qid));
  if (retryItems.length === 0) return null;

  return {
    passage: prev.passage,
    isRetry: true,
    level: prev.level,
    difficulty: prev.difficulty,
    items: retryItems,
    currentIndex: 0,
    selectedSpan: null,
    noDirectInfo: false,
    hintedParagraph: null,
    hintUsedForCurrent: false,
    lastResult: null,
    results: [],
    confusionMatrix: createEmptyConfusionMatrix(),
    trapStats: {},
    totalXp: 0,
    startedAt: nowMs,
    finished: false,
    finishedAt: null,
    producedItems: {},
  };
}

export function getCurrentJudgeItem(state: JudgeSessionState): JudgeQuestionEntry | null {
  if (state.finished || state.currentIndex < 0 || state.currentIndex >= state.items.length) {
    return null;
  }
  return state.items[state.currentIndex];
}

export function selectJudgeEvidence(
  state: JudgeSessionState,
  span: Span | null,
): JudgeSessionState {
  if (state.finished || state.lastResult) return state;
  return {
    ...state,
    selectedSpan: span,
    noDirectInfo: span ? false : state.noDirectInfo,
  };
}

export function toggleJudgeNoDirectInfo(
  state: JudgeSessionState,
  enabled?: boolean,
): JudgeSessionState {
  if (state.finished || state.lastResult) return state;
  const next = enabled ?? !state.noDirectInfo;
  return {
    ...state,
    noDirectInfo: next,
    selectedSpan: next ? null : state.selectedSpan,
  };
}

export function useJudgeParagraphHint(state: JudgeSessionState): JudgeSessionState {
  if (state.finished || state.lastResult || !state.difficulty.allowParagraphHint) {
    return state;
  }
  const current = getCurrentJudgeItem(state);
  if (!current) return state;
  const targetPara = current.question.evidence[0]?.paragraph ?? null;
  if (!targetPara) return state;
  return {
    ...state,
    hintedParagraph: targetPara,
    hintUsedForCurrent: true,
  };
}

/**
 * Enforce R1 §4 step ① gate:
 * - Must highlight an evidence span OR toggle "Không tìm thấy thông tin trực tiếp".
 * - When `noDirectInfo` is active, only FALSE/NO or NOT GIVEN are allowed (never TRUE/YES).
 */
export function canSubmitJudgeVerdict(
  state: JudgeSessionState,
  verdict: JudgeVerdict,
): boolean {
  if (state.finished || state.lastResult) return false;
  const current = getCurrentJudgeItem(state);
  if (!current) return false;

  // Validate verdict matches group type
  if (current.groupType === 'tfng') {
    if (verdict !== 'TRUE' && verdict !== 'FALSE' && verdict !== 'NOT GIVEN') return false;
  } else {
    if (verdict !== 'YES' && verdict !== 'NO' && verdict !== 'NOT GIVEN') return false;
  }

  if (state.noDirectInfo) {
    return verdict === 'NOT GIVEN' || verdict === 'FALSE' || verdict === 'NO';
  }

  return Boolean(state.selectedSpan && state.selectedSpan.end > state.selectedSpan.start);
}

export function submitJudgeVerdict(
  state: JudgeSessionState,
  verdict: JudgeVerdict,
  responseTimeMs = 0,
  now: Date = new Date(),
): JudgeSessionState {
  if (!canSubmitJudgeVerdict(state, verdict)) return state;
  const current = getCurrentJudgeItem(state);
  if (!current) return state;

  const expectedKey = current.question.answer.key ?? '';
  const scoreRes = scoreReadingAnswer(
    current.groupType === 'tfng'
      ? { type: 'tfng', expectedKey }
      : { type: 'ynng', expectedKey },
    verdict,
  );
  const answerCorrect = scoreRes.correct;

  const evidenceCheck = evaluateJudgeEvidence(
    state.passage,
    current.question.evidence,
    expectedKey,
    state.selectedSpan,
    state.noDirectInfo,
  );

  let outcome: JudgeOutcome;
  let baseXp: number;
  let fsrsRating: Grade;
  let outcomeLabelVi: string;
  let diagnosisVi: string;

  const firstGoldPara = current.question.evidence[0]?.paragraph;
  const paraMention = firstGoldPara ? `đoạn ${firstGoldPara}` : 'đoạn liên quan';

  if (answerCorrect && evidenceCheck.passed) {
    outcome = 'perfect';
    baseXp = 15;
    fsrsRating =
      !state.hintUsedForCurrent && responseTimeMs > 0 && responseTimeMs <= 30_000
        ? Rating.Easy
        : Rating.Good;
    outcomeLabelVi = 'Chuẩn';
    diagnosisVi =
      evidenceCheck.matchedBy === 'ng_no_direct_info'
        ? 'Bạn xác định đúng rằng bài không nêu thông tin trực tiếp → NOT GIVEN.'
        : `Đúng cả kết luận lẫn vật chứng tại ${paraMention}.`;
  } else if (answerCorrect && !evidenceCheck.passed) {
    outcome = 'lucky';
    baseXp = 5;
    fsrsRating = Rating.Hard;
    outcomeLabelVi = 'Đúng may';
    diagnosisVi = evidenceCheck.highlightedTooBroad
      ? `Bạn đúng kết luận, nhưng vùng bôi quá rộng. Hãy bôi câu cụ thể ở ${paraMention}.`
      : `Bạn đúng kết luận, nhưng vật chứng chính xác nằm ở ${paraMention}.`;
  } else if (!answerCorrect && evidenceCheck.passed) {
    outcome = 'misread';
    baseXp = 0;
    fsrsRating = Rating.Again;
    outcomeLabelVi = 'Hiểu sai';
    diagnosisVi = `Bạn định vị đúng chỗ (${paraMention}), nhưng so sánh logic bị lệch — xem kỹ từ khoá mức độ / phủ định.`;
  } else {
    outcome = 'lost';
    baseXp = 0;
    fsrsRating = Rating.Again;
    outcomeLabelVi = 'Lạc';
    diagnosisVi = `Cả định vị lẫn kết luận đều lệch. Hãy tìm từ khoá & paraphrase dẫn về ${paraMention}.`;
  }

  const rawXp = state.hintUsedForCurrent ? Math.round(baseXp * 0.5) : baseXp;
  const xpEarned = state.isRetry ? 0 : rawXp;
  const paraphraseSuggestions = extractParaphraseSuggestions(
    current.question.steps,
    current.question.qid,
  );
  const retryCard = state.isRetry
    ? null
    : createTfngRetryCardIfNeeded(state.passage, current.question, outcome, now);

  const nextProducedItems: Record<string, UserItemInput> = { ...state.producedItems };
  if (retryCard && !state.isRetry) {
    const tfngItemId = `tfng:${current.question.qid}`;
    const firstEv = current.question.evidence[0];
    const evidenceHint = firstEv
      ? `Đoạn ${firstEv.paragraph}: “${firstEv.quote}”. `
      : '';
    nextProducedItems[tfngItemId] = {
      id: tfngItemId,
      kind: 'tfng',
      front: current.question.prompt,
      back: expectedKey,
      noteVi: `${evidenceHint}${current.question.explanationVi}`.trim(),
      source: 'r1',
    };
  }

  const attemptResult: JudgeAttemptResult = {
    qid: current.question.qid,
    number: current.question.number,
    groupType: current.groupType,
    prompt: current.question.prompt,
    userVerdict: verdict,
    expectedVerdict: expectedKey,
    answerCorrect,
    evidenceCheck,
    outcome,
    outcomeLabelVi,
    diagnosisVi,
    xpEarned,
    fsrsRating,
    hintUsed: state.hintUsedForCurrent,
    responseTimeMs: Math.max(0, responseTimeMs),
    trapType: current.question.trapType,
    goldEvidence: current.question.evidence,
    userSpan: state.selectedSpan,
    noDirectInfo: state.noDirectInfo,
    paraphraseSuggestions,
    retryCard,
  };

  return {
    ...state,
    lastResult: attemptResult,
    results: [...state.results, attemptResult],
    confusionMatrix: recordConfusion(state.confusionMatrix, expectedKey, verdict),
    trapStats: recordTrapStat(state.trapStats, current.question.trapType, !answerCorrect),
    totalXp: state.totalXp + xpEarned,
    producedItems: nextProducedItems,
  };
}

export function nextJudgeQuestion(
  state: JudgeSessionState,
  nowMs: number = Date.now(),
): JudgeSessionState {
  if (state.finished) return state;
  const nextIdx = state.currentIndex + 1;
  if (nextIdx >= state.items.length) {
    return {
      ...state,
      lastResult: null,
      selectedSpan: null,
      noDirectInfo: false,
      hintedParagraph: null,
      hintUsedForCurrent: false,
      finished: true,
      finishedAt: nowMs,
    };
  }
  return {
    ...state,
    currentIndex: nextIdx,
    lastResult: null,
    selectedSpan: null,
    noDirectInfo: false,
    hintedParagraph: null,
    hintUsedForCurrent: false,
  };
}

export interface R1JudgeProgressSnapshot {
  progress: Omit<ProgressPayload, 'attemptId'>;
  /** Nội dung thẻ `tfng:*` để ghi `userItemRepo.upsertWithCard(item, 'tfng_retry')` (G1). */
  items: UserItemInput[];
}

/**
 * Ảnh chụp tiến độ R1 Judge để lưu từng lượt và khi bấm "Lưu và thoát" (G3/TU-02).
 * Trả về `null` khi chưa có câu nào hoặc là phiên retry.
 */
export function buildR1JudgeProgressSnapshot(
  state: JudgeSessionState,
  now: number = Date.now(),
): R1JudgeProgressSnapshot | null {
  if (state.isRetry || state.results.length === 0) return null;

  const updatedCards = state.results
    .map((r) => r.retryCard)
    .filter((c): c is SRSCard => Boolean(c));

  const perfectOrLucky = state.results.filter((r) => r.answerCorrect).length;

  return {
    progress: {
      attempt: {
        gameId: 'r1',
        mode: 'training',
        startedAt: state.startedAt,
        endedAt: state.finishedAt ?? now,
        score: perfectOrLucky,
        total: Math.max(1, state.items.length),
        xp: state.totalXp,
        items: state.results.map((r) => ({
          itemId: r.qid,
          correct: r.answerCorrect && r.evidenceCheck.passed,
          responseTimeMs: r.responseTimeMs,
          trapType: r.trapType,
        })),
      },
      updatedCards,
      reviews: [],
    },
    items: Object.values(state.producedItems),
  };
}

export function buildJudgeWinStatement(state: JudgeSessionState): string {
  const total = state.results.length;
  if (total === 0) return 'Hoàn thành phiên luyện TFNG Judge.';

  const perfectCount = state.results.filter((r) => r.outcome === 'perfect').length;
  const fnStats = getFalseVsNgStats(state.confusionMatrix);
  const avgSec = Math.round(
    state.results.reduce((acc, r) => acc + r.responseTimeMs, 0) / total / 1000,
  );

  if (fnStats.total >= 2 && fnStats.correct === fnStats.total && perfectCount < total) {
    return `Phân biệt FALSE/NOT GIVEN: ${fnStats.correct}/${fnStats.total} (không nhầm bẫy nào).`;
  }

  if (
    state.difficulty.targetSecPerQuestion &&
    avgSec > 0 &&
    avgSec <= state.difficulty.targetSecPerQuestion &&
    perfectCount >= Math.ceil(total * 0.7)
  ) {
    return `Chuẩn ${perfectCount}/${total} · Tốc độ trung bình ${avgSec} giây/câu (mục tiêu ${state.difficulty.targetSecPerQuestion} giây).`;
  }

  return `Chuẩn ${perfectCount}/${total} (đúng cả kết luận lẫn bằng chứng).`;
}

// ---------------------------------------------------------------------------
// Passage Mode Pure State Machine (Training & Exam, ALL ReadingQType)
// ---------------------------------------------------------------------------

export interface FlatPassageQuestion {
  qid: string;
  number: number;
  group: ReadingQuestionGroup;
  question: ReadingQuestion;
}

export function flattenPassageQuestions(passage: ReadingPassage): FlatPassageQuestion[] {
  const flat: FlatPassageQuestion[] = [];
  for (const group of passage.questionGroups) {
    for (const q of group.questions) {
      flat.push({ qid: q.qid, number: q.number, group, question: q });
    }
  }
  return flat.sort((a, b) => a.number - b.number);
}

function buildScoringInput(
  group: ReadingQuestionGroup,
  question: ReadingQuestion,
): ReadingQuestionScoringInput {
  const qType: ReadingQType = group.type;
  switch (qType) {
    case 'tfng':
      return { type: 'tfng', expectedKey: question.answer.key ?? '' };
    case 'ynng':
      return { type: 'ynng', expectedKey: question.answer.key ?? '' };
    case 'headings':
      return { type: 'headings', expectedKey: question.answer.key ?? '' };
    case 'mcq_single':
      return {
        type: 'mcq_single',
        expectedKeys: question.answer.keys ?? (question.answer.key ? [question.answer.key] : []),
      };
    case 'mcq_multi':
      return {
        type: 'mcq_multi',
        expectedKeys: question.answer.keys ?? (question.answer.key ? [question.answer.key] : []),
      };
    case 'matching_info':
      return {
        type: 'matching_info',
        expectedKeys: question.answer.keys ?? (question.answer.key ? [question.answer.key] : []),
      };
    case 'matching_features':
      return {
        type: 'matching_features',
        expectedKeys: question.answer.keys ?? (question.answer.key ? [question.answer.key] : []),
      };
    case 'sentence_endings':
    case 'summary_wordlist':
      return {
        type: 'sentence_endings',
        expectedKeys: question.answer.keys ?? (question.answer.key ? [question.answer.key] : []),
      };
    case 'sentence_completion':
    case 'summary_completion':
    case 'table_completion':
    case 'flowchart_completion':
    case 'diagram_labelling':
    case 'short_answer': {
      const accepted =
        question.answer.accepted ??
        (question.answer.key ? [question.answer.key] : question.answer.keys ?? []);
      return {
        type: 'gap_fill',
        accepted,
        wordLimit: group.wordLimit,
      };
    }
  }
}

export function formatExpectedAnswer(question: ReadingQuestion): string {
  if (question.answer.key) return question.answer.key;
  if (question.answer.keys && question.answer.keys.length > 0) {
    return question.answer.keys.join(', ');
  }
  if (question.answer.accepted && question.answer.accepted.length > 0) {
    return question.answer.accepted[0];
  }
  return '';
}

export function scorePassageQuestion(
  group: ReadingQuestionGroup,
  question: ReadingQuestion,
  userAnswer: string | readonly string[] | undefined,
): ReadingScoreResult {
  const input = buildScoringInput(group, question);
  const safeAnswer = userAnswer ?? '';
  return scoreReadingAnswer(input, safeAnswer);
}

export interface PassageQuestionGrade {
  qid: string;
  number: number;
  groupType: ReadingQType;
  prompt: string;
  userAnswer: string;
  expectedAnswer: string;
  scoreResult: ReadingScoreResult;
  evidencePassed: boolean | null;
  trapType?: ReadingTrap;
  goldEvidence: readonly Span[];
  explanationVi: string;
}

export interface PassageSessionSummary {
  score: number;
  total: number;
  accuracy: number;
  estimatedBand: number;
  xp: number;
  submitReason: 'manual' | 'timeout';
  grades: PassageQuestionGrade[];
  confusionMatrix: ConfusionMatrix3x3;
  trapStats: TrapStatsMap;
  retryCards: SRSCard[];
}

export interface PassageSessionState {
  passage: ReadingPassage;
  mode: 'training' | 'exam';
  questions: FlatPassageQuestion[];
  currentQid: string;
  answers: Record<string, string | string[]>;
  flaggedQids: string[];
  requireEvidence: boolean;
  evidenceByQid: Record<string, OffsetSpan | null>;
  durationSec: number;
  remainingSec: number;
  startedAt: number;
  submitted: boolean;
  submittedAt: number | null;
  summary: PassageSessionSummary | null;
}

export function createPassageSession(
  passage: ReadingPassage,
  options: {
    mode: 'training' | 'exam';
    durationSec?: number;
    requireEvidence?: boolean;
    nowMs?: number;
  },
): PassageSessionState {
  const questions = flattenPassageQuestions(passage);
  const durationSec = options.durationSec ?? 20 * 60;
  return {
    passage,
    mode: options.mode,
    questions,
    currentQid: questions[0]?.qid ?? '',
    answers: {},
    flaggedQids: [],
    requireEvidence: options.mode === 'training' ? Boolean(options.requireEvidence) : false,
    evidenceByQid: {},
    durationSec,
    remainingSec: durationSec,
    startedAt: options.nowMs ?? Date.now(),
    submitted: false,
    submittedAt: null,
    summary: null,
  };
}

export function isPassageAnswerFilled(val: string | readonly string[] | undefined): boolean {
  if (!val) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  return val.length > 0;
}

export function setPassageAnswer(
  state: PassageSessionState,
  qid: string,
  answer: string | string[],
): PassageSessionState {
  if (state.submitted) return state;
  return {
    ...state,
    answers: {
      ...state.answers,
      [qid]: answer,
    },
  };
}

export function setPassageEvidence(
  state: PassageSessionState,
  qid: string,
  span: OffsetSpan | null,
): PassageSessionState {
  if (state.submitted) return state;
  return {
    ...state,
    evidenceByQid: {
      ...state.evidenceByQid,
      [qid]: span,
    },
  };
}

export function togglePassageFlag(state: PassageSessionState, qid: string): PassageSessionState {
  if (state.submitted) return state;
  const exists = state.flaggedQids.includes(qid);
  return {
    ...state,
    flaggedQids: exists
      ? state.flaggedQids.filter((id) => id !== qid)
      : [...state.flaggedQids, qid],
  };
}

export function selectPassageQuestion(
  state: PassageSessionState,
  qid: string,
): PassageSessionState {
  if (!state.questions.some((q) => q.qid === qid)) return state;
  return {
    ...state,
    currentQid: qid,
  };
}

export function tickPassageTimer(
  state: PassageSessionState,
  deltaSec = 1,
): PassageSessionState {
  if (state.submitted || state.mode !== 'exam') return state;
  const nextRemaining = Math.max(0, state.remainingSec - Math.max(0, deltaSec));
  return {
    ...state,
    remainingSec: nextRemaining,
  };
}

export function submitPassageSession(
  state: PassageSessionState,
  reason: 'manual' | 'timeout' = 'manual',
  now: Date = new Date(),
): PassageSessionState {
  if (state.submitted) return state;

  let score = 0;
  let confusionMatrix = createEmptyConfusionMatrix();
  let trapStats: TrapStatsMap = {};
  const retryCards: SRSCard[] = [];
  const grades: PassageQuestionGrade[] = [];

  for (const item of state.questions) {
    const rawUser = state.answers[item.qid];
    const scoreResult = scorePassageQuestion(item.group, item.question, rawUser);
    if (scoreResult.correct) score++;

    let evidencePassed: boolean | null = null;
    if (state.requireEvidence) {
      const userEv = state.evidenceByQid[item.qid] ?? null;
      const evSpan: Span | null =
        userEv && userEv.paragraph
          ? {
              paragraph: userEv.paragraph,
              start: userEv.start,
              end: userEv.end,
              quote: userEv.quote ?? '',
            }
          : null;
      const check = evaluateJudgeEvidence(
        state.passage,
        item.question.evidence,
        item.question.answer.key ?? '',
        evSpan,
        false,
      );
      evidencePassed = check.passed;
    }

    const userAnswerStr = Array.isArray(rawUser) ? rawUser.join(', ') : (rawUser ?? '').trim();
    const expectedStr = formatExpectedAnswer(item.question);

    if (item.group.type === 'tfng' || item.group.type === 'ynng') {
      if (userAnswerStr) {
        confusionMatrix = recordConfusion(confusionMatrix, expectedStr, userAnswerStr);
      }
      if (!scoreResult.correct && state.passage.reserved !== true) {
        retryCards.push(
          createNewCard(`tfng:${item.qid}`, 'tfng_retry', {
            now,
            unlocked: true,
            source: 'reading_mistake',
          }),
        );
      }
    }

    trapStats = recordTrapStat(trapStats, item.question.trapType, !scoreResult.correct);

    grades.push({
      qid: item.qid,
      number: item.number,
      groupType: item.group.type,
      prompt: item.question.prompt,
      userAnswer: userAnswerStr,
      expectedAnswer: expectedStr,
      scoreResult,
      evidencePassed,
      trapType: item.question.trapType,
      goldEvidence: item.question.evidence,
      explanationVi: item.question.explanationVi,
    });
  }

  const total = state.questions.length;
  const accuracy = total > 0 ? score / total : 0;
  const estimatedBand = accuracyToBand('R', accuracy);
  const xp = state.mode === 'exam' ? score * 8 : score * 10;

  return {
    ...state,
    submitted: true,
    submittedAt: now.getTime(),
    summary: {
      score,
      total,
      accuracy,
      estimatedBand,
      xp,
      submitReason: reason,
      grades,
      confusionMatrix,
      trapStats,
      retryCards,
    },
  };
}
