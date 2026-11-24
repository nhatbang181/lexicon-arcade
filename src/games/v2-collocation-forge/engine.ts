import { Rating, type Grade } from 'ts-fsrs';
import type { CollocationItem, Topic, VocabItem } from '../../core/content/schemas';
import { autoRate } from '../../core/srs/autoRate';
import {
  createNewCard,
  makeCardId,
  scheduleCard,
  type SRSCard,
} from '../../core/srs/fsrsAdapter';
import type { AttemptItem, ReviewRecord } from '../../core/storage/db';
import type { ProgressPayload } from '../../core/storage/repos/attemptRepo';
import type { UserItemInput } from '../../core/storage/repos/userItemRepo';
import { matchAnswer } from '../../core/text/answerMatch';
import { normalizeText } from '../../core/text/normalize';
import { seededRng, shuffleSeeded } from './rng';

// ---------------------------------------------------------------------------
// Constants & XP Table (docs/games/V2-COLLOCATION-FORGE.md §4 & §5)
// ---------------------------------------------------------------------------

export const V2_XP = {
  DAP_CORRECT: 12,
  TOI_SPOT_CORRECT: 10,
  TOI_FIX_CORRECT: 8,
  FORGE_COMPLETE_BONUS: 40,
  SPRINT_BASE: 10,
} as const;

/** Bậc ×1/×2/×3 theo combo (5/10 đúng liền), cùng bảng với V1 (V2-3). */
export function getComboMultiplier(combo: number): 1 | 2 | 3 {
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}

/** Retry "Ôn lại câu sai": tối đa 5 câu (docs/02 §5, G4). */
export const V2_RETRY_MAX_ITEMS = 5;
/** Màn xem mẫu hiện 3 cụm đầu của lò; câu hỏi nhận diện dùng các cụm KHÁC (V2-1). */
export const V2_NUNG_PREVIEW_COUNT = 3;

export const V2_MIN_COLLOCATIONS_PER_FORGE = 6;
export const V2_MIN_TRAPS_PER_FORGE = 2;
export const V2_SPRINT_DURATION_SEC = 60;
export const V2_NUNG_CARD_SEC = 8;

export type V2Stage = 'nung' | 'dap' | 'toi' | 'write' | 'sprint' | 'recap';

export interface HeadwordForge {
  headwordId: `vocab:${string}`;
  headword: string;
  ipaUk: string;
  pos: string[];
  meaningVi: string;
  audioUk?: string;
  topics: Topic[];
  collocations: CollocationItem[];
  totalL1Traps: number;
  unlearnedCount: number;
}

export interface NungSentenceChoice {
  index: number;
  collocationId: string;
  phrase: string;
  sentence: string;
  meaningVi: string;
  isCorrect: boolean;
  correctPhrase?: string;
  whyVi?: string;
}

export interface DapGapSpec {
  display: string;
  answers: string[];
  primary: string;
}

export interface DapQuestion {
  collocation: CollocationItem;
  gap: DapGapSpec;
  sentenceWithGap: string;
  beforeGap: string;
  afterGap: string;
  alternativeExample: string;
  hintText: string;
  hintUsed: boolean;
  /** Câu sai được chèn lại cuối hàng (V2-6): XP 0, không chấm FSRS lần 2. */
  isRequeue?: boolean;
}

export type GapScoreOutcome = 'primary' | 'alt_accepted' | 'l1_trap' | 'wrong';

export interface GapScoreResult {
  correct: boolean;
  outcome: GapScoreOutcome;
  primary: string;
  matchedAnswer?: string;
  matchedTrap?: { wrong: string; whyVi: string };
  comparison?: { wrong: string; correct: string };
  messageVi: string;
  whyVi?: string;
}

export interface ToiCardItem {
  index: number;
  collocationId: string;
  text: string;
  meaningVi: string;
  isTrap: boolean;
  correctPhrase: string;
  AcceptedFixes: string[];
  whyVi?: string;
}

export interface ToiRound {
  roundIndex: number;
  cards: ToiCardItem[];
  /** Số cụm bẫy trong vòng (1–2). ≥ 2 thì bước `spot` chọn nhiều thẻ rồi "Xác nhận" (V2-4). */
  trapCount: number;
  /** Các thẻ đang chọn ở vòng nhiều bẫy. */
  selectedIndices: number[];
  /** Thẻ bẫy người học bỏ sót ở vòng nhiều bẫy. */
  missedTrapIndices: number[];
  /** Cụm (collocationId) đã chấm FSRS Again trong vòng này: mỗi vòng tối đa 1 review mỗi cụm (V2-8). */
  reviewedErrIds: string[];
  selectedCardIndex: number | null;
  crackedCardIndex: number | null;
  activeTrapCard: ToiCardItem | null;
  spotCorrect: boolean | null;
  fixInput: string;
  fixCorrect: boolean | null;
  step: 'spot' | 'type_fix' | 'feedback';
}

export interface SelfWriteChecklist {
  correctPhrase: boolean;
  correctPreposition: boolean;
  correctMeaning: boolean;
}

export interface SelfWriteState {
  targetCollocations: [CollocationItem, CollocationItem];
  sentence: string;
  checklist: SelfWriteChecklist;
  matchedPhrases: string[];
  submitted: boolean;
}

export interface V2MistakeRecord {
  id: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  note?: string;
  isL1Trap?: boolean;
  /** Vòng Tôi: cụm bẫy cụ thể đã sai (để dựng lại vòng retry). */
  trapText?: string;
  collocationId?: string;
  stage?: 'dap' | 'toi';
}

export type V2EngineEvent =
  | { type: 'nung_scored'; correct: boolean }
  | {
      type: 'answer_scored';
      stage: 'dap' | 'toi' | 'sprint';
      correct: boolean;
      outcome: GapScoreOutcome | 'toi_spot' | 'toi_fix';
      xpEarned: number;
      cardId?: string;
      errorCardId?: string;
      rating?: Grade;
    }
  | { type: 'stage_changed'; stage: V2Stage }
  | { type: 'forge_completed'; bonusXp: number; totalXp: number };

export interface V2EngineState {
  mode: 'training' | 'sprint';
  /** Phiên "Ôn lại câu sai": XP 0, không FSRS, không ghi attempt (G4/C3). */
  isRetry: boolean;
  seed: string;
  level: number;
  stage: V2Stage;
  startedAt: number;
  endedAt?: number;
  forge: HeadwordForge;
  // Stage 1: Nung
  nungChoices: NungSentenceChoice[];
  nungSelected: number[];
  nungSubmitted: boolean;
  nungCorrect: boolean | null;
  // Stage 2: Dap
  dapQuestions: DapQuestion[];
  dapIndex: number;
  dapLastResult: GapScoreResult | null;
  dapAnswered: boolean;
  forgedShelf: CollocationItem[];
  // Stage 3: Toi
  toiRounds: ToiRound[];
  toiIndex: number;
  totalTrapsTested: number;
  trapsAvoided: number;
  // Level 7-10 Free Write
  selfWrite: SelfWriteState | null;
  // Sprint Mode (60s)
  sprintQuestions: DapQuestion[];
  sprintIndex: number;
  sprintRemainingSec: number;
  sprintLastResult: GapScoreResult | null;
  sprintCorrectCount: number;
  sprintPersonalBestXp: number;
  /** Thẻ đã chấm FSRS trong sprint này (mỗi thẻ 1 lần, V2-7). */
  sprintReviewedIds: string[];
  /** Nội dung thẻ do game tạo (`err:l1col_*`) để ghi `userItems` (G1). */
  producedItems: Record<string, UserItemInput>;
  // Shared Scoring & SRS
  xp: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  totalQuestions: number;
  mistakes: V2MistakeRecord[];
  attemptItems: AttemptItem[];
  srsCards: Record<string, SRSCard>;
  reviews: Array<Omit<ReviewRecord, 'id'>>;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

export function makeL1ErrorItemId(collocationId: string): `err:${string}` {
  const cleanSlug = collocationId.replace(/^col:/, '');
  return `err:l1col_${cleanSlug}`;
}

function stripLeadingArticle(text: string): string {
  return text.replace(/^(the|a|an)\s+/i, '').trim();
}

/**
 * Build hint text based on learner level (docs/games/V2-COLLOCATION-FORGE.md §5):
 * - Level 1-3: reveal first letter + total letter count (e.g. "e _ _ _ _ (5 chữ cái)")
 * - Level 4-10: reveal only the first letter (e.g. "e...")
 */
export function formatCollocationHint(primary: string, level: number): string {
  const clean = primary.trim();
  if (!clean) return '';
  const firstChar = clean[0];
  const letterCount = clean.replace(/\s+/g, '').length;
  if (level <= 3) {
    const underscores = Array.from({ length: Math.max(1, clean.length - 1) })
      .map((_v, idx) => (clean[idx + 1] === ' ' ? '  ' : '_'))
      .join(' ');
    return `${firstChar} ${underscores} (${letterCount} chữ cái)`;
  }
  return `${firstChar}…`;
}

/**
 * Pick which gap of a collocation to drill according to difficulty level (§5):
 * Level 7-10 prefers harder gaps (prepositions/adjectives at index > 0 when present).
 */
export function selectGapForLevel(col: CollocationItem, level: number): DapGapSpec {
  if (col.gaps.length > 1 && level >= 7) {
    return col.gaps[col.gaps.length - 1];
  }
  return col.gaps[0];
}

/**
 * Construct a gapped sentence from `col.example` and `gap.display`.
 */
export function buildSentenceWithGap(
  col: CollocationItem,
  gap: DapGapSpec,
): { sentenceWithGap: string; beforeGap: string; afterGap: string } {
  const example = col.example;
  const phraseLower = col.phrase.toLowerCase();
  const exLower = example.toLowerCase();
  const phraseIdx = exLower.indexOf(phraseLower);

  if (phraseIdx !== -1) {
    const beforePhrase = example.slice(0, phraseIdx);
    const afterPhrase = example.slice(phraseIdx + col.phrase.length);
    const gapMarkerIdx = gap.display.indexOf('___');
    if (gapMarkerIdx !== -1) {
      const displayPrefix = gap.display.slice(0, gapMarkerIdx);
      const displaySuffix = gap.display.slice(gapMarkerIdx + 3);
      const beforeGap = `${beforePhrase}${displayPrefix}`;
      const afterGap = `${displaySuffix}${afterPhrase}`;
      return {
        sentenceWithGap: `${beforeGap}___${afterGap}`,
        beforeGap,
        afterGap,
      };
    }
  }

  // Fallback: locate primary inside example or append display frame
  const primLower = gap.primary.toLowerCase();
  const primIdx = exLower.indexOf(primLower);
  if (primIdx !== -1) {
    const beforeGap = example.slice(0, primIdx);
    const afterGap = example.slice(primIdx + gap.primary.length);
    return {
      sentenceWithGap: `${beforeGap}___${afterGap}`,
      beforeGap,
      afterGap,
    };
  }

  const gapMarkerIdx = gap.display.indexOf('___');
  const beforeGap = gapMarkerIdx !== -1 ? gap.display.slice(0, gapMarkerIdx) : '';
  const afterGap = gapMarkerIdx !== -1 ? gap.display.slice(gapMarkerIdx + 3) : '';
  return {
    sentenceWithGap: gap.display,
    beforeGap,
    afterGap,
  };
}

export function buildAlternativeExample(col: CollocationItem, headword: string): string {
  return `In IELTS Task 2 essays on ${col.topics[0] ?? 'society'}, candidates can write "${col.phrase}" to discuss ${headword} with Band ${col.bandTarget} precision.`;
}

// ---------------------------------------------------------------------------
// Headword Forge Discovery & Selection (§4, §9, §11)
// ---------------------------------------------------------------------------

export function buildHeadwordForges(
  collocations: readonly CollocationItem[],
  vocabItems: readonly VocabItem[],
  existingCards: readonly SRSCard[] = [],
): HeadwordForge[] {
  const vocabById = new Map<string, VocabItem>();
  for (const v of vocabItems) {
    vocabById.set(v.id, v);
  }

  const learnedColIds = new Set<string>();
  for (const c of existingCards) {
    if (c.face === 'col_gap' && c.reps > 0) {
      learnedColIds.add(c.itemId);
    }
  }

  const grouped = new Map<`vocab:${string}`, CollocationItem[]>();
  for (const col of collocations) {
    const list = grouped.get(col.headwordId) ?? [];
    list.push(col);
    grouped.set(col.headwordId, list);
  }

  const forges: HeadwordForge[] = [];
  for (const [headwordId, cols] of grouped.entries()) {
    // §9 & §11: Each forge must have >= 6 collocations and >= 2 l1Traps total
    const totalL1Traps = cols.reduce((acc, c) => acc + c.l1Traps.length, 0);
    if (cols.length < V2_MIN_COLLOCATIONS_PER_FORGE || totalL1Traps < V2_MIN_TRAPS_PER_FORGE) {
      continue;
    }

    const vocab = vocabById.get(headwordId);
    const headword = vocab?.headword ?? headwordId.replace(/^vocab:/, '').replace(/_/g, ' ');
    const ipaUk = vocab?.ipa.uk ?? `/${headword}/`;
    const pos = vocab?.pos ?? ['n'];
    const meaningVi = vocab?.meaningVi ?? cols[0].meaningVi;
    const audioUk = vocab?.audio.uk;

    const topicSet = new Set<Topic>();
    if (vocab) {
      for (const t of vocab.topics) topicSet.add(t);
    }
    for (const c of cols) {
      for (const t of c.topics) topicSet.add(t);
    }

    const unlearnedCount = cols.filter((c) => !learnedColIds.has(c.id)).length;

    forges.push({
      headwordId,
      headword,
      ipaUk,
      pos,
      meaningVi,
      audioUk,
      topics: [...topicSet],
      collocations: cols.slice(0, 10),
      totalL1Traps,
      unlearnedCount,
    });
  }

  return forges;
}

export interface SelectForgeOptions {
  preferredHeadwordId?: string;
  recentTask2Topic?: Topic;
  weeklyTopic?: Topic;
}

export function selectDefaultHeadwordForge(
  forges: readonly HeadwordForge[],
  options: SelectForgeOptions = {},
): HeadwordForge {
  if (forges.length === 0) {
    throw new Error('No valid headword forge with >= 6 collocations and >= 2 L1 traps available.');
  }

  if (options.preferredHeadwordId) {
    const found = forges.find(
      (f) =>
        f.headwordId === options.preferredHeadwordId ||
        f.headword.toLowerCase() === options.preferredHeadwordId?.toLowerCase(),
    );
    if (found) return found;
  }

  const targetTopic = options.recentTask2Topic ?? options.weeklyTopic;
  const candidates = targetTopic
    ? forges.filter((f) => f.topics.includes(targetTopic))
    : [];
  const pool = candidates.length > 0 ? candidates : [...forges];

  return [...pool].sort((a, b) => {
    if (b.unlearnedCount !== a.unlearnedCount) {
      return b.unlearnedCount - a.unlearnedCount;
    }
    return b.collocations.length - a.collocations.length;
  })[0];
}

// ---------------------------------------------------------------------------
// Gap Scoring & L1 Trap Detection (§4, §7, §11)
// ---------------------------------------------------------------------------

/**
 * Extract the differing word(s) in an L1 trap relative to `gap.display` so that
 * typing either the full trap phrase ("make a profound impact on") or just the
 * trap filler ("make") triggers the Vietnamese L1 collocation warning.
 */
function extractTrapGapToken(trapWrong: string, gapDisplay: string): string | null {
  const normWrong = normalizeText(trapWrong);
  const parts = gapDisplay.split('___');
  if (parts.length !== 2) return null;

  const prefix = normalizeText(parts[0]);
  const suffix = normalizeText(parts[1]);

  // Check if trapWrong starts with prefix and ends with suffix
  if (prefix && !normWrong.startsWith(prefix)) {
    return null;
  }
  if (suffix && !normWrong.endsWith(suffix)) {
    // Some L1 traps also change the trailing preposition (e.g. "give a big impact to").
    // In that case, extract the first token if the gap is at the start.
    if (!prefix) {
      const firstWord = normWrong.split(' ')[0];
      return firstWord || null;
    }
    return null;
  }

  const sliced = normWrong
    .slice(prefix ? prefix.length : 0, suffix ? normWrong.length - suffix.length : undefined)
    .trim();
  return sliced || null;
}

export function scoreCollocationGap(
  rawInput: string,
  collocation: CollocationItem,
  gap: DapGapSpec = collocation.gaps[0],
): GapScoreResult {
  const normInput = normalizeText(rawInput);
  if (!normInput) {
    return {
      correct: false,
      outcome: 'wrong',
      primary: gap.primary,
      messageVi: `Chưa đúng. Đáp án chuẩn: ${gap.primary}`,
    };
  }

  const filledDisplay = normalizeText(gap.display.replace('___', rawInput.trim()));
  const strippedInput = stripLeadingArticle(normInput);

  // 1. Check L1 Traps first (Vietnamese literal translation traps)
  const answerNormSet = new Set(
    gap.answers.flatMap((a) => [normalizeText(a), stripLeadingArticle(normalizeText(a))]),
  );

  for (const trap of collocation.l1Traps) {
    const normTrap = normalizeText(trap.wrong);
    const trapGapToken = extractTrapGapToken(trap.wrong, gap.display);
    const matchesFullTrap = normInput === normTrap || filledDisplay === normTrap;
    const matchesTrapToken =
      trapGapToken !== null &&
      !answerNormSet.has(trapGapToken) &&
      (normInput === trapGapToken || strippedInput === trapGapToken);

    if (matchesFullTrap || matchesTrapToken) {
      return {
        correct: false,
        outcome: 'l1_trap',
        primary: gap.primary,
        matchedTrap: trap,
        comparison: {
          wrong: trap.wrong,
          correct: collocation.phrase,
        },
        messageVi: 'Đây là collocation kiểu Việt',
        whyVi: trap.whyVi,
      };
    }
  }

  // 2. Check accepted answers in `gap.answers` (ignoring redundant leading article a/an/the)
  const directMatch = matchAnswer(rawInput, gap.answers, {
    ignoreLeadingArticle: true,
    acceptSpellingVariants: true,
    allowMinorTypo: false,
  });

  // Also check if user typed the entire collocation phrase with a valid answer
  const fullPhraseCandidates = gap.answers.map((ans) => gap.display.replace('___', ans));
  const fullPhraseMatch = !directMatch.matched
    ? matchAnswer(rawInput, fullPhraseCandidates, {
        ignoreLeadingArticle: true,
        acceptSpellingVariants: true,
        allowMinorTypo: false,
      })
    : null;

  if (directMatch.matched || fullPhraseMatch?.matched) {
    const matchedAns =
      directMatch.matchedAccepted ??
      gap.answers[
        fullPhraseCandidates.findIndex(
          (c) => normalizeText(c) === normalizeText(fullPhraseMatch?.matchedAccepted ?? ''),
        )
      ] ??
      gap.primary;

    const isPrimary = matchAnswer(matchedAns, [gap.primary], {
      ignoreLeadingArticle: true,
      acceptSpellingVariants: true,
    }).matched;

    if (isPrimary) {
      return {
        correct: true,
        outcome: 'primary',
        primary: gap.primary,
        matchedAnswer: gap.primary,
        messageVi: 'Chính xác!',
      };
    }

    return {
      correct: true,
      outcome: 'alt_accepted',
      primary: gap.primary,
      matchedAnswer: matchedAns,
      messageVi: `Đúng. Cũng có thể dùng: ${gap.primary}`,
    };
  }

  return {
    correct: false,
    outcome: 'wrong',
    primary: gap.primary,
    messageVi: `Chưa đúng. Đáp án chuẩn: ${gap.primary}`,
  };
}

// ---------------------------------------------------------------------------
// Stage Builders (Stage 1 NUNG, Stage 2 DAP, Stage 3 TOI)
// ---------------------------------------------------------------------------

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Câu hỏi nhận diện dùng các cụm KHÁC màn xem mẫu (V2-1): 2 câu đúng + 1 câu bẫy lấy từ các cụm
 * ngoài `V2_NUNG_PREVIEW_COUNT` cụm đầu. Vị trí câu bẫy xáo theo seed (V2-5) nên không còn "bấm 1+3 là thắng".
 */
export function buildNungChoices(forge: HeadwordForge, seed: string = forge.headwordId): NungSentenceChoice[] {
  const rng = seededRng(`${seed}|nung`);
  const cols = forge.collocations;
  const previewIds = new Set(cols.slice(0, V2_NUNG_PREVIEW_COUNT).map((c) => c.id));
  const fresh = cols.filter((c) => !previewIds.has(c.id));

  const trapPool = fresh.filter((c) => c.l1Traps.length > 0);
  const trapCandidates = trapPool.length > 0 ? trapPool : cols.filter((c) => c.l1Traps.length > 0);
  const trapSource =
    shuffleSeeded(trapCandidates, rng)[0] ?? cols[cols.length - 1] ?? cols[0];

  const correctPool = [
    ...shuffleSeeded(
      fresh.filter((c) => c.id !== trapSource.id),
      rng,
    ),
    ...cols.slice(0, V2_NUNG_PREVIEW_COUNT).filter((c) => c.id !== trapSource.id),
  ];
  const c1 = correctPool[0] ?? cols[0];
  const c2 = correctPool[1] ?? c1;

  const trap = trapSource.l1Traps[
    Math.floor(rng() * Math.max(1, trapSource.l1Traps.length))
  ] ?? {
    wrong: `make ${forge.headword}`,
    whyVi: 'Lỗi dịch từng chữ từ tiếng Việt.',
  };

  const trapSentence = trapSource.example
    .toLowerCase()
    .includes(trapSource.phrase.toLowerCase())
    ? trapSource.example.replace(new RegExp(escapeRegExp(trapSource.phrase), 'i'), trap.wrong)
    : `Many candidates mistakenly write "${trap.wrong}" in their academic essays.`;

  const rawChoices: Omit<NungSentenceChoice, 'index'>[] = [
    {
      collocationId: c1.id,
      phrase: c1.phrase,
      sentence: c1.example,
      meaningVi: c1.meaningVi,
      isCorrect: true,
    },
    {
      collocationId: trapSource.id,
      phrase: trap.wrong,
      sentence: trapSentence,
      meaningVi: `${trapSource.meaningVi} (Bẫy dịch kiểu Việt)`,
      isCorrect: false,
      correctPhrase: trapSource.phrase,
      whyVi: trap.whyVi,
    },
    {
      collocationId: c2.id,
      phrase: c2.phrase,
      sentence: c2.example,
      meaningVi: c2.meaningVi,
      isCorrect: true,
    },
  ];

  return shuffleSeeded(rawChoices, rng).map((choice, idx) => ({ ...choice, index: idx }));
}

export function buildDapQuestions(forge: HeadwordForge, level: number): DapQuestion[] {
  const sorted = [...forge.collocations].sort((a, b) => {
    if (level <= 3) return a.bandTarget - b.bandTarget;
    if (level >= 7) return b.bandTarget - a.bandTarget;
    return 0;
  });

  const selected = sorted.slice(0, 8);
  return selected.map((col) => {
    const gap = selectGapForLevel(col, level);
    const { sentenceWithGap, beforeGap, afterGap } = buildSentenceWithGap(col, gap);
    return {
      collocation: col,
      gap,
      sentenceWithGap,
      beforeGap,
      afterGap,
      alternativeExample: buildAlternativeExample(col, forge.headword),
      hintText: formatCollocationHint(gap.primary, level),
      hintUsed: false,
    };
  });
}

export interface ToiTrapEntry {
  col: CollocationItem;
  trap: { wrong: string; whyVi: string };
}

function collectTraps(forge: HeadwordForge): ToiTrapEntry[] {
  const allTraps: ToiTrapEntry[] = [];
  for (const col of forge.collocations) {
    for (const trap of col.l1Traps) {
      allTraps.push({ col, trap });
    }
  }
  return allTraps;
}

/** Dựng 1 vòng Tôi: 4 thẻ gồm các cụm bẫy + cụm đúng, vị trí xáo theo seed (V2-5). */
export function buildToiRound(
  forge: HeadwordForge,
  trapEntries: readonly ToiTrapEntry[],
  roundIndex: number,
  rng: () => number,
): ToiRound {
  const usedColIds = new Set(trapEntries.map((e) => e.col.id));
  const validCols = shuffleSeeded(
    forge.collocations.filter((c) => !usedColIds.has(c.id)),
    rng,
  );
  const neededValid = Math.max(0, 4 - trapEntries.length);

  const rawCards: Omit<ToiCardItem, 'index'>[] = [];
  for (const entry of trapEntries) {
    const gap = entry.col.gaps[0];
    const acceptedFixes = [
      entry.col.phrase,
      ...gap.answers.map((ans) => gap.display.replace('___', ans)),
      ...gap.answers,
    ];
    rawCards.push({
      collocationId: entry.col.id,
      text: entry.trap.wrong,
      meaningVi: entry.col.meaningVi,
      isTrap: true,
      correctPhrase: entry.col.phrase,
      AcceptedFixes: acceptedFixes,
      whyVi: entry.trap.whyVi,
    });
  }

  for (let i = 0; i < neededValid; i++) {
    const vCol =
      validCols[i % Math.max(1, validCols.length)] ?? forge.collocations[i % forge.collocations.length];
    rawCards.push({
      collocationId: vCol.id,
      text: vCol.phrase,
      meaningVi: vCol.meaningVi,
      isTrap: false,
      correctPhrase: vCol.phrase,
      AcceptedFixes: [vCol.phrase],
    });
  }

  const shuffled = shuffleSeeded(rawCards, rng);
  return {
    roundIndex,
    cards: shuffled.map((c, idx) => ({ ...c, index: idx })),
    trapCount: trapEntries.length,
    selectedIndices: [],
    missedTrapIndices: [],
    reviewedErrIds: [],
    selectedCardIndex: null,
    crackedCardIndex: null,
    activeTrapCard: null,
    spotCorrect: null,
    fixInput: '',
    fixCorrect: null,
    step: 'spot',
  };
}

export function buildToiRounds(
  forge: HeadwordForge,
  level: number,
  seed: string = forge.headwordId,
): ToiRound[] {
  const rng = seededRng(`${seed}|toi`);
  const allTraps = shuffleSeeded(collectTraps(forge), rng);
  if (allTraps.length === 0) return [];

  const roundCount = Math.min(3, Math.max(2, Math.min(allTraps.length, 3)));
  const rounds: ToiRound[] = [];

  for (let r = 0; r < roundCount; r++) {
    const primaryTrapEntry = allTraps[r % allTraps.length];
    const includeSecondTrap = level >= 4 && allTraps.length >= 2 && r % 2 === 1;
    // Bẫy thứ hai phải thuộc cụm khác để 4 thẻ không trùng cụm (V2-4).
    const secondTrapEntry = includeSecondTrap
      ? allTraps.find((e, i) => i !== r % allTraps.length && e.col.id !== primaryTrapEntry.col.id) ??
        null
      : null;

    const trapEntries = secondTrapEntry ? [primaryTrapEntry, secondTrapEntry] : [primaryTrapEntry];
    rounds.push(buildToiRound(forge, trapEntries, r, rng));
  }

  return rounds;
}

// ---------------------------------------------------------------------------
// Session Initialization & Pure State Transitions
// ---------------------------------------------------------------------------

export interface CreateV2SessionOptions {
  mode?: 'training' | 'sprint';
  level?: number;
  forge: HeadwordForge;
  allCollocations?: readonly CollocationItem[];
  existingCards?: readonly SRSCard[];
  sprintPersonalBestXp?: number;
  nowMs?: number;
  /** Khoá seed cho vị trí câu bẫy/thứ tự thẻ; mặc định `headword|nowMs` nên mỗi phiên khác nhau. */
  seed?: string;
}

function makeDapQuestion(col: CollocationItem, forge: HeadwordForge, level: number): DapQuestion {
  const gap = selectGapForLevel(col, level);
  const { sentenceWithGap, beforeGap, afterGap } = buildSentenceWithGap(col, gap);
  return {
    collocation: col,
    gap,
    sentenceWithGap,
    beforeGap,
    afterGap,
    alternativeExample: buildAlternativeExample(col, forge.headword),
    hintText: formatCollocationHint(gap.primary, level),
    hintUsed: false,
  };
}

/**
 * Sprint chỉ ôn lại thẻ `col_gap` đã có (V2-7): thẻ đến hạn xáo theo seed lên trước, thẻ chưa đến hạn
 * theo thứ tự `due`. Chưa có thẻ nào thì dùng các cụm của lò để vẫn chơi được (không lặp cụm trong 1 vòng).
 */
export function buildSprintPool(
  forge: HeadwordForge,
  allCollocations: readonly CollocationItem[],
  existingCards: readonly SRSCard[],
  nowMs: number,
  rng: () => number,
): CollocationItem[] {
  const byId = new Map(allCollocations.map((c) => [c.id as string, c]));
  const eligible = existingCards
    .filter((c) => c.face === 'col_gap' && c.unlocked && byId.has(c.itemId))
    .sort((a, b) => a.due - b.due);
  const dueNow = shuffleSeeded(
    eligible.filter((c) => c.due <= nowMs),
    rng,
  );
  const later = eligible.filter((c) => c.due > nowMs);
  const pool: CollocationItem[] = [];
  const seen = new Set<string>();
  for (const card of [...dueNow, ...later]) {
    const col = byId.get(card.itemId);
    if (col && !seen.has(col.id)) {
      seen.add(col.id);
      pool.push(col);
    }
  }
  if (pool.length < 6) {
    for (const col of shuffleSeeded(forge.collocations, rng)) {
      if (!seen.has(col.id)) {
        seen.add(col.id);
        pool.push(col);
      }
    }
  }
  return pool;
}

export function createV2Session(options: CreateV2SessionOptions): V2EngineState {
  const {
    mode = 'training',
    level = 1,
    forge,
    allCollocations = forge.collocations,
    existingCards = [],
    sprintPersonalBestXp = 0,
    nowMs = Date.now(),
  } = options;
  const seed = options.seed ?? `${forge.headwordId}|${nowMs}`;

  const srsCards: Record<string, SRSCard> = {};
  for (const c of existingCards) {
    srsCards[c.id] = { ...c };
  }

  const nungChoices = buildNungChoices(forge, seed);
  const dapQuestions = buildDapQuestions(forge, level);
  const toiRounds = buildToiRounds(forge, level, seed);

  const sprintQuestions: DapQuestion[] =
    mode === 'sprint'
      ? buildSprintPool(forge, allCollocations, existingCards, nowMs, seededRng(`${seed}|sprint`)).map(
          (col) => makeDapQuestion(col, forge, level),
        )
      : [];

  const c1 = forge.collocations[0];
  const c2 = forge.collocations[1] ?? forge.collocations[0];

  return {
    mode,
    isRetry: false,
    seed,
    level,
    stage: mode === 'sprint' ? 'sprint' : 'nung',
    startedAt: nowMs,
    forge,
    nungChoices,
    nungSelected: [],
    nungSubmitted: false,
    nungCorrect: null,
    dapQuestions,
    dapIndex: 0,
    dapLastResult: null,
    dapAnswered: false,
    forgedShelf: [],
    toiRounds,
    toiIndex: 0,
    totalTrapsTested: toiRounds.length,
    trapsAvoided: 0,
    selfWrite:
      level >= 7
        ? {
            targetCollocations: [c1, c2],
            sentence: '',
            checklist: {
              correctPhrase: false,
              correctPreposition: false,
              correctMeaning: false,
            },
            matchedPhrases: [],
            submitted: false,
          }
        : null,
    sprintQuestions,
    sprintIndex: 0,
    sprintRemainingSec: V2_SPRINT_DURATION_SEC,
    sprintLastResult: null,
    sprintCorrectCount: 0,
    sprintPersonalBestXp,
    sprintReviewedIds: [],
    producedItems: {},
    xp: 0,
    combo: 0,
    maxCombo: 0,
    correctCount: 0,
    totalQuestions: dapQuestions.length + toiRounds.length,
    mistakes: [],
    attemptItems: [],
    srsCards,
    reviews: [],
  };
}

/**
 * "Ôn lại câu sai" (G4/C3/V2-2): chỉ gồm tối đa 5 câu sai của phiên vừa xong, bỏ Nung và Tự viết.
 * XP luôn 0, không chấm FSRS, không tạo thẻ lỗi mới và không ghi attempt (người gọi bỏ qua việc lưu).
 */
export function createV2RetrySession(
  prev: V2EngineState,
  nowMs = Date.now(),
): V2EngineState {
  const seed = `${prev.seed}|retry|${nowMs}`;
  const rng = seededRng(seed);
  const forge = prev.forge;
  const colById = new Map(forge.collocations.map((c) => [c.id as string, c]));

  const picked = prev.mistakes.slice(0, V2_RETRY_MAX_ITEMS);
  const dapCols: CollocationItem[] = [];
  const trapEntries: ToiTrapEntry[] = [];
  for (const m of picked) {
    const col = m.collocationId ? colById.get(m.collocationId) : undefined;
    if (!col) continue;
    if (m.stage === 'toi') {
      const trap = col.l1Traps.find((t) => t.wrong === m.trapText) ?? col.l1Traps[0];
      if (trap && !trapEntries.some((e) => e.col.id === col.id)) trapEntries.push({ col, trap });
    } else if (!dapCols.some((c) => c.id === col.id)) {
      dapCols.push(col);
    }
  }

  const dapQuestions = dapCols.map((col) => makeDapQuestion(col, forge, prev.level));
  const toiRounds = trapEntries.map((entry, i) => buildToiRound(forge, [entry], i, rng));
  const stage: V2Stage =
    dapQuestions.length > 0 ? 'dap' : toiRounds.length > 0 ? 'toi' : 'recap';

  return {
    ...createV2Session({
      mode: 'training',
      level: prev.level,
      forge,
      existingCards: [],
      nowMs,
      seed,
    }),
    isRetry: true,
    stage,
    endedAt: stage === 'recap' ? nowMs : undefined,
    nungChoices: [],
    dapQuestions,
    toiRounds,
    totalTrapsTested: toiRounds.length,
    selfWrite: null,
    totalQuestions: Math.max(1, dapQuestions.length + toiRounds.length),
  };
}

// --- Stage 1: NUNG ---

export function toggleNungChoice(state: V2EngineState, index: number): V2EngineState {
  if (state.stage !== 'nung' || state.nungSubmitted) return state;
  if (index < 0 || index >= state.nungChoices.length) return state;

  const exists = state.nungSelected.includes(index);
  let nextSelected: number[];
  if (exists) {
    nextSelected = state.nungSelected.filter((i) => i !== index);
  } else if (state.nungSelected.length >= 2) {
    nextSelected = [state.nungSelected[1], index];
  } else {
    nextSelected = [...state.nungSelected, index];
  }

  return {
    ...state,
    nungSelected: nextSelected,
  };
}

export function submitNungSelection(
  state: V2EngineState,
  selectedIndices: readonly number[] = state.nungSelected,
): { state: V2EngineState; events: V2EngineEvent[] } {
  if (state.stage !== 'nung' || selectedIndices.length !== 2) {
    return { state, events: [] };
  }

  const unique = [...new Set(selectedIndices)];
  if (unique.length !== 2) {
    return { state, events: [] };
  }

  const allCorrect = unique.every((idx) => state.nungChoices[idx]?.isCorrect === true);

  const nextState: V2EngineState = {
    ...state,
    nungSelected: unique,
    nungSubmitted: true,
    nungCorrect: allCorrect,
  };

  return {
    state: nextState,
    events: [{ type: 'nung_scored', correct: allCorrect }],
  };
}

export function advanceFromNung(state: V2EngineState): {
  state: V2EngineState;
  events: V2EngineEvent[];
} {
  if (state.stage !== 'nung') return { state, events: [] };
  return {
    state: {
      ...state,
      stage: 'dap',
    },
    events: [{ type: 'stage_changed', stage: 'dap' }],
  };
}

// --- Stage 2: DAP (Production) ---

export function useDapHint(state: V2EngineState): V2EngineState {
  if (state.stage !== 'dap' || state.dapAnswered) return state;
  const cur = state.dapQuestions[state.dapIndex];
  if (!cur || cur.hintUsed) return state;

  const updatedQuestions = state.dapQuestions.map((q, idx) =>
    idx === state.dapIndex ? { ...q, hintUsed: true } : q,
  );

  return {
    ...state,
    dapQuestions: updatedQuestions,
  };
}

function applySrsReview(
  srsCards: Record<string, SRSCard>,
  reviews: Array<Omit<ReviewRecord, 'id'>>,
  itemId: string,
  face: 'col_gap' | 'err_fix',
  rating: Grade,
  correct: boolean,
  hintUsed: boolean,
  durationMs: number,
  nowMs: number,
  onlyIfExisting = false,
): {
  nextCards: Record<string, SRSCard>;
  nextReviews: Array<Omit<ReviewRecord, 'id'>>;
  cardId?: string;
} {
  const cardId = makeCardId(itemId, face);
  const existing = srsCards[cardId];
  if (onlyIfExisting && !existing) {
    return { nextCards: srsCards, nextReviews: reviews };
  }

  const baseCard =
    existing ??
    createNewCard(itemId, face, {
      now: new Date(nowMs),
      unlocked: true,
      source: 'curriculum',
    });

  const scheduled = scheduleCard(baseCard, rating, new Date(nowMs));
  const nextCards = {
    ...srsCards,
    [cardId]: scheduled.card,
  };
  const nextReviews = [
    ...reviews,
    {
      cardId,
      rating,
      correct,
      hintUsed,
      durationMs,
      ts: nowMs,
      gameId: 'v2' as const,
      prevState: scheduled.prevState,
    },
  ];

  return { nextCards, nextReviews, cardId };
}

function errorItemFor(col: CollocationItem, trap: { wrong: string; whyVi: string }): UserItemInput {
  return {
    id: makeL1ErrorItemId(col.id),
    kind: 'collocation',
    front: trap.wrong,
    back: col.phrase,
    noteVi: trap.whyVi,
    source: 'v2_forge',
  };
}

function withProduced(
  produced: Record<string, UserItemInput>,
  col: CollocationItem,
  trap: { wrong: string; whyVi: string } | undefined,
): Record<string, UserItemInput> {
  const t = trap ?? col.l1Traps[0];
  if (!t) return produced;
  const item = errorItemFor(col, t);
  return produced[item.id] ? produced : { ...produced, [item.id]: item };
}

export function submitDapAnswer(
  state: V2EngineState,
  rawInput: string,
  responseTimeMs = 4500,
  nowMs = Date.now(),
): { state: V2EngineState; events: V2EngineEvent[] } {
  if (state.stage !== 'dap' || state.dapAnswered) {
    return { state, events: [] };
  }
  const currentQ = state.dapQuestions[state.dapIndex];
  if (!currentQ) {
    return { state, events: [] };
  }

  const scoreRes = scoreCollocationGap(rawInput, currentQ.collocation, currentQ.gap);
  // Câu chèn lại (V2-6) và phiên retry (G4): không XP, không FSRS, không tính điểm lần 2.
  const scored = !currentQ.isRequeue && !state.isRetry;
  const colCardId = makeCardId(currentQ.collocation.id, 'col_gap');
  const existingColCard = state.srsCards[colCardId];

  let rating: Grade | undefined;
  let nextCards = state.srsCards;
  let nextReviews = state.reviews;
  let cardId: string | undefined;
  let errorCardId: string | undefined;
  let nextProduced = state.producedItems;

  if (scored) {
    rating = autoRate({
      correct: scoreRes.correct,
      face: 'col_gap',
      responseTimeMs,
      hintsUsed: currentQ.hintUsed ? 1 : 0,
      cardStreak: existingColCard?.streak ?? 0,
    });

    const upd = applySrsReview(
      state.srsCards,
      state.reviews,
      currentQ.collocation.id,
      'col_gap',
      rating,
      scoreRes.correct,
      currentQ.hintUsed,
      responseTimeMs,
      nowMs,
    );
    nextCards = upd.nextCards;
    nextReviews = upd.nextReviews;
    cardId = upd.cardId;

    if (scoreRes.outcome === 'l1_trap') {
      const errItemId = makeL1ErrorItemId(currentQ.collocation.id);
      const errUpd = applySrsReview(
        nextCards,
        nextReviews,
        errItemId,
        'err_fix',
        Rating.Again,
        false,
        false,
        responseTimeMs,
        nowMs,
      );
      nextCards = errUpd.nextCards;
      nextReviews = errUpd.nextReviews;
      errorCardId = errUpd.cardId;
      nextProduced = withProduced(
        nextProduced,
        currentQ.collocation,
        scoreRes.matchedTrap,
      );
    }
  }

  const xpEarned = scored && scoreRes.correct ? V2_XP.DAP_CORRECT : 0;
  const nextCombo = scoreRes.correct ? state.combo + 1 : 0;
  const nextMaxCombo = Math.max(state.maxCombo, nextCombo);

  const nextForgedShelf =
    scoreRes.correct && !state.forgedShelf.some((c) => c.id === currentQ.collocation.id)
      ? [...state.forgedShelf, currentQ.collocation]
      : state.forgedShelf;

  const nextMistakes = [...state.mistakes];
  if (scored && !scoreRes.correct) {
    nextMistakes.push({
      id: `${currentQ.collocation.id}_dap`,
      prompt: `${currentQ.gap.display} (${currentQ.collocation.meaningVi})`,
      userAnswer: rawInput.trim() || '(bỏ trống)',
      correctAnswer: currentQ.collocation.phrase,
      note:
        scoreRes.outcome === 'l1_trap'
          ? `Collocation kiểu Việt: ${scoreRes.whyVi}`
          : currentQ.collocation.example,
      isL1Trap: scoreRes.outcome === 'l1_trap',
      collocationId: currentQ.collocation.id,
      stage: 'dap',
    });
  }

  // V2-6: câu Đập sai quay lại 1 lần ở cuối hàng trước khi sang Tôi.
  const nextQuestions =
    scored && !scoreRes.correct
      ? [...state.dapQuestions, { ...currentQ, hintUsed: false, isRequeue: true }]
      : state.dapQuestions;

  const nextAttemptItems: AttemptItem[] = scored
    ? [
        ...state.attemptItems,
        {
          itemId: currentQ.collocation.id,
          correct: scoreRes.correct,
          responseTimeMs,
          trapType: scoreRes.outcome === 'l1_trap' ? 'l1_collocation' : undefined,
        },
      ]
    : state.attemptItems;

  const nextState: V2EngineState = {
    ...state,
    dapQuestions: nextQuestions,
    dapLastResult: scoreRes,
    dapAnswered: true,
    forgedShelf: nextForgedShelf,
    xp: state.xp + xpEarned,
    combo: nextCombo,
    maxCombo: nextMaxCombo,
    correctCount: state.correctCount + (scored && scoreRes.correct ? 1 : 0),
    mistakes: nextMistakes,
    attemptItems: nextAttemptItems,
    srsCards: nextCards,
    reviews: nextReviews,
    producedItems: nextProduced,
  };

  return {
    state: nextState,
    events: [
      {
        type: 'answer_scored',
        stage: 'dap',
        correct: scoreRes.correct,
        outcome: scoreRes.outcome,
        xpEarned,
        cardId,
        errorCardId,
        rating,
      },
    ],
  };
}

export function nextDapQuestion(
  state: V2EngineState,
  nowMs = Date.now(),
): {
  state: V2EngineState;
  events: V2EngineEvent[];
} {
  if (state.stage !== 'dap' || !state.dapAnswered) {
    return { state, events: [] };
  }

  const nextIndex = state.dapIndex + 1;
  if (nextIndex < state.dapQuestions.length) {
    return {
      state: {
        ...state,
        dapIndex: nextIndex,
        dapLastResult: null,
        dapAnswered: false,
      },
      events: [],
    };
  }

  if (state.toiRounds.length === 0) {
    return {
      state: { ...state, stage: 'recap', dapLastResult: null, endedAt: nowMs },
      events: [{ type: 'stage_changed', stage: 'recap' }],
    };
  }

  return {
    state: {
      ...state,
      stage: 'toi',
      dapLastResult: null,
    },
    events: [{ type: 'stage_changed', stage: 'toi' }],
  };
}

// --- Stage 3: TOI (L1 Trap Tempering) ---

/** Ghi 1 review Again cho thẻ lỗi của cụm này, tối đa 1 lần mỗi vòng (V2-8); retry thì bỏ qua. */
function reviewErrOnce(
  state: V2EngineState,
  round: ToiRound,
  card: ToiCardItem,
  durationMs: number,
  nowMs: number,
): {
  srsCards: Record<string, SRSCard>;
  reviews: Array<Omit<ReviewRecord, 'id'>>;
  producedItems: Record<string, UserItemInput>;
  reviewedErrIds: string[];
  errorCardId?: string;
} {
  if (state.isRetry || round.reviewedErrIds.includes(card.collocationId)) {
    return {
      srsCards: state.srsCards,
      reviews: state.reviews,
      producedItems: state.producedItems,
      reviewedErrIds: round.reviewedErrIds,
    };
  }
  const upd = applySrsReview(
    state.srsCards,
    state.reviews,
    makeL1ErrorItemId(card.collocationId),
    'err_fix',
    Rating.Again,
    false,
    false,
    durationMs,
    nowMs,
  );
  const col = state.forge.collocations.find((c) => c.id === card.collocationId);
  const trap = col?.l1Traps.find((t) => t.wrong === card.text) ?? col?.l1Traps[0];
  return {
    srsCards: upd.nextCards,
    reviews: upd.nextReviews,
    producedItems: col ? withProduced(state.producedItems, col, trap) : state.producedItems,
    reviewedErrIds: [...round.reviewedErrIds, card.collocationId],
    errorCardId: upd.cardId,
  };
}

function replaceRound(state: V2EngineState, round: ToiRound): ToiRound[] {
  return state.toiRounds.map((r, idx) => (idx === state.toiIndex ? round : r));
}

/** Vòng 1 bẫy: bấm 1 thẻ là chấm luôn. Vòng ≥ 2 bẫy dùng `toggleToiCard` + `confirmToiSpot`. */
export function selectToiCard(
  state: V2EngineState,
  cardIndex: number,
  nowMs = Date.now(),
): { state: V2EngineState; events: V2EngineEvent[] } {
  if (state.stage !== 'toi') return { state, events: [] };
  const currentRound = state.toiRounds[state.toiIndex];
  if (!currentRound || currentRound.step !== 'spot') return { state, events: [] };
  if (currentRound.trapCount >= 2) return toggleToiCard(state, cardIndex);

  const clickedCard = currentRound.cards[cardIndex];
  if (!clickedCard) return { state, events: [] };

  const actualTrapCard = clickedCard.isTrap
    ? clickedCard
    : currentRound.cards.find((c) => c.isTrap) ?? clickedCard;

  const spotCorrect = clickedCard.isTrap;
  const xpEarned = !state.isRetry && spotCorrect ? V2_XP.TOI_SPOT_CORRECT : 0;
  const nextCombo = spotCorrect ? state.combo + 1 : 0;
  const nextMaxCombo = Math.max(state.maxCombo, nextCombo);

  let errUpd: ReturnType<typeof reviewErrOnce> | null = null;
  if (!spotCorrect) {
    errUpd = reviewErrOnce(state, currentRound, actualTrapCard, 3000, nowMs);
  }

  const updatedRound: ToiRound = {
    ...currentRound,
    selectedCardIndex: cardIndex,
    selectedIndices: [cardIndex],
    crackedCardIndex: actualTrapCard.index,
    activeTrapCard: actualTrapCard,
    spotCorrect,
    reviewedErrIds: errUpd?.reviewedErrIds ?? currentRound.reviewedErrIds,
    step: 'type_fix',
  };

  return {
    state: {
      ...state,
      toiRounds: replaceRound(state, updatedRound),
      xp: state.xp + xpEarned,
      combo: nextCombo,
      maxCombo: nextMaxCombo,
      srsCards: errUpd?.srsCards ?? state.srsCards,
      reviews: errUpd?.reviews ?? state.reviews,
      producedItems: errUpd?.producedItems ?? state.producedItems,
    },
    events: [
      {
        type: 'answer_scored',
        stage: 'toi',
        correct: spotCorrect,
        outcome: 'toi_spot',
        xpEarned,
        errorCardId: errUpd?.errorCardId,
      },
    ],
  };
}

/** Vòng ≥ 2 bẫy (V2-4): bật/tắt chọn một thẻ, chưa chấm. */
export function toggleToiCard(
  state: V2EngineState,
  cardIndex: number,
): { state: V2EngineState; events: V2EngineEvent[] } {
  if (state.stage !== 'toi') return { state, events: [] };
  const round = state.toiRounds[state.toiIndex];
  if (!round || round.step !== 'spot' || !round.cards[cardIndex]) return { state, events: [] };
  const selectedIndices = round.selectedIndices.includes(cardIndex)
    ? round.selectedIndices.filter((i) => i !== cardIndex)
    : [...round.selectedIndices, cardIndex];
  return {
    state: { ...state, toiRounds: replaceRound(state, { ...round, selectedIndices }) },
    events: [],
  };
}

/**
 * Xác nhận tập thẻ đã chọn ở vòng nhiều bẫy (V2-4): +10 XP cho mỗi bẫy bắt đúng, bẫy bị sót được đánh dấu
 * và ghi 1 review Again. Chọn nhầm thẻ đúng thì không cộng và không tính là bắt đủ.
 */
export function confirmToiSpot(
  state: V2EngineState,
  nowMs = Date.now(),
): { state: V2EngineState; events: V2EngineEvent[] } {
  if (state.stage !== 'toi') return { state, events: [] };
  const round = state.toiRounds[state.toiIndex];
  if (!round || round.step !== 'spot' || round.trapCount < 2 || round.selectedIndices.length === 0) {
    return { state, events: [] };
  }

  const traps = round.cards.filter((c) => c.isTrap);
  const hits = traps.filter((c) => round.selectedIndices.includes(c.index));
  const missed = traps.filter((c) => !round.selectedIndices.includes(c.index));
  const falsePicks = round.selectedIndices.filter((i) => !round.cards[i]?.isTrap);
  const spotCorrect = missed.length === 0 && falsePicks.length === 0;
  const xpEarned = state.isRetry ? 0 : hits.length * V2_XP.TOI_SPOT_CORRECT;
  const nextCombo = spotCorrect ? state.combo + 1 : 0;

  let working = state;
  let reviewed = round.reviewedErrIds;
  let errorCardId: string | undefined;
  for (const card of missed) {
    const upd = reviewErrOnce(working, { ...round, reviewedErrIds: reviewed }, card, 3000, nowMs);
    working = {
      ...working,
      srsCards: upd.srsCards,
      reviews: upd.reviews,
      producedItems: upd.producedItems,
    };
    reviewed = upd.reviewedErrIds;
    errorCardId = upd.errorCardId ?? errorCardId;
  }

  const activeTrapCard = hits[0] ?? traps[0] ?? null;
  const updatedRound: ToiRound = {
    ...round,
    selectedCardIndex: round.selectedIndices[0] ?? null,
    missedTrapIndices: missed.map((c) => c.index),
    crackedCardIndex: activeTrapCard?.index ?? null,
    activeTrapCard,
    spotCorrect,
    reviewedErrIds: reviewed,
    step: 'type_fix',
  };

  return {
    state: {
      ...working,
      toiRounds: replaceRound(working, updatedRound),
      xp: state.xp + xpEarned,
      combo: nextCombo,
      maxCombo: Math.max(state.maxCombo, nextCombo),
    },
    events: [
      {
        type: 'answer_scored',
        stage: 'toi',
        correct: spotCorrect,
        outcome: 'toi_spot',
        xpEarned,
        errorCardId,
      },
    ],
  };
}

export function submitToiFix(
  state: V2EngineState,
  typedFix: string,
  nowMs = Date.now(),
): { state: V2EngineState; events: V2EngineEvent[] } {
  if (state.stage !== 'toi') return { state, events: [] };
  const currentRound = state.toiRounds[state.toiIndex];
  if (!currentRound || currentRound.step !== 'type_fix' || !currentRound.activeTrapCard) {
    return { state, events: [] };
  }

  const trapCard = currentRound.activeTrapCard;
  const matchRes = matchAnswer(typedFix, trapCard.AcceptedFixes, {
    ignoreLeadingArticle: true,
    acceptSpellingVariants: true,
    allowMinorTypo: false,
  });

  const fixCorrect = matchRes.matched;
  const xpEarned = !state.isRetry && fixCorrect ? V2_XP.TOI_FIX_CORRECT : 0;
  const nextCombo = fixCorrect ? state.combo + 1 : 0;
  const nextMaxCombo = Math.max(state.maxCombo, nextCombo);

  // V2-8: nếu vòng này đã ghi Again cho cụm (bấm sai/bỏ sót) thì không ghi thêm lần nữa.
  let errUpd: ReturnType<typeof reviewErrOnce> | null = null;
  if (!fixCorrect) {
    errUpd = reviewErrOnce(state, currentRound, trapCard, 4000, nowMs);
  }

  const bothCorrect = Boolean(currentRound.spotCorrect && fixCorrect);
  const nextMistakes = [...state.mistakes];
  if (!bothCorrect && !state.isRetry) {
    nextMistakes.push({
      id: `${trapCard.collocationId}_toi_${currentRound.roundIndex}`,
      prompt: `Sửa bẫy kiểu Việt: ~~${trapCard.text}~~`,
      userAnswer: typedFix.trim() || '(chưa sửa đúng)',
      correctAnswer: trapCard.correctPhrase,
      note: trapCard.whyVi,
      isL1Trap: true,
      collocationId: trapCard.collocationId,
      trapText: trapCard.text,
      stage: 'toi',
    });
  }

  const updatedRound: ToiRound = {
    ...currentRound,
    fixInput: typedFix,
    fixCorrect,
    reviewedErrIds: errUpd?.reviewedErrIds ?? currentRound.reviewedErrIds,
    step: 'feedback',
  };

  const scoredNow = !state.isRetry;
  return {
    state: {
      ...state,
      toiRounds: replaceRound(state, updatedRound),
      xp: state.xp + xpEarned,
      combo: nextCombo,
      maxCombo: nextMaxCombo,
      trapsAvoided: state.trapsAvoided + (bothCorrect ? 1 : 0),
      correctCount: state.correctCount + (scoredNow && bothCorrect ? 1 : 0),
      mistakes: nextMistakes,
      attemptItems: scoredNow
        ? [
            ...state.attemptItems,
            {
              itemId: trapCard.collocationId,
              correct: bothCorrect,
              trapType: bothCorrect ? undefined : 'l1_collocation',
            },
          ]
        : state.attemptItems,
      srsCards: errUpd?.srsCards ?? state.srsCards,
      reviews: errUpd?.reviews ?? state.reviews,
      producedItems: errUpd?.producedItems ?? state.producedItems,
    },
    events: [
      {
        type: 'answer_scored',
        stage: 'toi',
        correct: fixCorrect,
        outcome: 'toi_fix',
        xpEarned,
        errorCardId: errUpd?.errorCardId,
      },
    ],
  };
}

export function nextToiRound(
  state: V2EngineState,
  nowMs = Date.now(),
): { state: V2EngineState; events: V2EngineEvent[] } {
  if (state.stage !== 'toi') return { state, events: [] };
  const currentRound = state.toiRounds[state.toiIndex];
  if (!currentRound || currentRound.step !== 'feedback') return { state, events: [] };

  const nextIdx = state.toiIndex + 1;
  if (nextIdx < state.toiRounds.length) {
    return {
      state: {
        ...state,
        toiIndex: nextIdx,
      },
      events: [],
    };
  }

  // Retry: kết thúc không thưởng. Phiên thường: +40 XP khi xong cả lò.
  if (state.isRetry) {
    return {
      state: { ...state, stage: 'recap', endedAt: nowMs },
      events: [{ type: 'stage_changed', stage: 'recap' }],
    };
  }

  const totalXp = state.xp + V2_XP.FORGE_COMPLETE_BONUS;
  const nextStage: V2Stage = state.level >= 7 && state.selfWrite ? 'write' : 'recap';

  const targetCols: [CollocationItem, CollocationItem] = [
    state.forgedShelf[0] ?? state.forge.collocations[0],
    state.forgedShelf[1] ?? state.forge.collocations[1] ?? state.forge.collocations[0],
  ];

  return {
    state: {
      ...state,
      stage: nextStage,
      xp: totalXp,
      endedAt: nextStage === 'recap' ? nowMs : state.endedAt,
      selfWrite: state.selfWrite
        ? {
            ...state.selfWrite,
            targetCollocations: targetCols,
          }
        : null,
    },
    events: [
      {
        type: 'forge_completed',
        bonusXp: V2_XP.FORGE_COMPLETE_BONUS,
        totalXp,
      },
      { type: 'stage_changed', stage: nextStage },
    ],
  };
}

// --- Level 7-10 Self-Write Step (§5) ---

const ARTICLES = new Set(['a', 'an', 'the']);

const IRREGULAR_VERBS: Readonly<Record<string, string>> = {
  had: 'have',
  has: 'have',
  made: 'make',
  took: 'take',
  taken: 'take',
  gave: 'give',
  given: 'give',
  did: 'do',
  does: 'do',
  done: 'do',
  went: 'go',
  gone: 'go',
  drew: 'draw',
  drawn: 'draw',
  brought: 'bring',
  held: 'hold',
  kept: 'keep',
  led: 'lead',
  paid: 'pay',
  set: 'set',
  put: 'put',
  met: 'meet',
  ran: 'run',
};

/** Rút gọn biến hình đơn giản (s/es/ed/ing/d) để "has made" khớp "make", "impacts" khớp "impact". */
function stemWord(word: string): string {
  let w = IRREGULAR_VERBS[word.toLowerCase()] ?? word.toLowerCase();
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ied')) w = `${w.slice(0, -3)}y`;
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith('es')) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s')) w = w.slice(0, -1);
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  if (w.length > 3 && w[w.length - 1] === w[w.length - 2]) w = w.slice(0, -1);
  return w;
}

function contentTokens(text: string): string[] {
  return normalizeText(text)
    .split(/\s+/)
    .filter((t) => t.length > 0 && !ARTICLES.has(t));
}

/**
 * Câu tự viết "đã dùng" cụm khi chứa đủ MỌI từ của cụm (bỏ mạo từ) theo đúng thứ tự liền nhau, cho phép
 * biến hình động từ/số nhiều (V2-10). Chỉ chứa từ gap (`have`, `make`...) thì không đủ.
 */
export function detectUsedCollocations(
  sentence: string,
  targets: readonly CollocationItem[],
): string[] {
  const sentenceStems = contentTokens(sentence).map(stemWord);
  if (sentenceStems.length === 0) return [];

  const matched: string[] = [];
  for (const col of targets) {
    const phraseStems = contentTokens(col.phrase).map(stemWord);
    if (phraseStems.length === 0) continue;
    for (let i = 0; i + phraseStems.length <= sentenceStems.length; i++) {
      if (phraseStems.every((stem, k) => sentenceStems[i + k] === stem)) {
        matched.push(col.phrase);
        break;
      }
    }
  }
  return matched;
}

export function submitSelfWrite(
  state: V2EngineState,
  sentence: string,
  checklist: SelfWriteChecklist,
  nowMs = Date.now(),
): { state: V2EngineState; events: V2EngineEvent[] } {
  if (state.stage !== 'write' || !state.selfWrite) {
    return { state, events: [] };
  }

  const matchedPhrases = detectUsedCollocations(
    sentence,
    state.selfWrite.targetCollocations,
  );

  return {
    state: {
      ...state,
      stage: 'recap',
      endedAt: nowMs,
      selfWrite: {
        ...state.selfWrite,
        sentence: sentence.trim(),
        checklist,
        matchedPhrases,
        submitted: true,
      },
    },
    events: [{ type: 'stage_changed', stage: 'recap' }],
  };
}

// --- Sprint Mode (60 seconds, §3, §4, §8) ---

export function submitSprintAnswer(
  state: V2EngineState,
  rawInput: string,
  responseTimeMs = 3000,
  nowMs = Date.now(),
): { state: V2EngineState; events: V2EngineEvent[] } {
  if (state.stage !== 'sprint' || state.sprintRemainingSec <= 0) {
    return { state, events: [] };
  }

  const currentQ =
    state.sprintQuestions[state.sprintIndex % Math.max(1, state.sprintQuestions.length)];
  if (!currentQ) return { state, events: [] };

  const scoreRes = scoreCollocationGap(rawInput, currentQ.collocation, currentQ.gap);
  const nextCombo = scoreRes.correct ? state.combo + 1 : 0;
  const nextMaxCombo = Math.max(state.maxCombo, nextCombo);
  // §4: mỗi câu đúng +10 × bậc combo (×1/×2/×3, V2-3): tối đa 30 XP/câu, không tăng tuyến tính.
  const xpEarned = scoreRes.correct
    ? V2_XP.SPRINT_BASE * Math.min(getComboMultiplier(nextCombo), 3)
    : 0;

  const colCardId = makeCardId(currentQ.collocation.id, 'col_gap');
  const existingCard = state.srsCards[colCardId];
  const rating = autoRate({
    correct: scoreRes.correct,
    face: 'col_gap',
    responseTimeMs,
    cardStreak: existingCard?.streak ?? 0,
  });

  // §8 + V2-7: mỗi thẻ chỉ chấm FSRS 1 lần trong 1 sprint; lần lặp vẫn tính XP.
  const alreadyReviewed = state.sprintReviewedIds.includes(colCardId);
  let nextCards = state.srsCards;
  let nextReviews = state.reviews;
  let cardId: string | undefined;
  let reviewedIds = state.sprintReviewedIds;
  if (!alreadyReviewed) {
    const upd = applySrsReview(
      state.srsCards,
      state.reviews,
      currentQ.collocation.id,
      'col_gap',
      rating,
      scoreRes.correct,
      false,
      responseTimeMs,
      nowMs,
      true, // chỉ thẻ đã có
    );
    nextCards = upd.nextCards;
    nextReviews = upd.nextReviews;
    cardId = upd.cardId;
    reviewedIds = [...reviewedIds, colCardId];
  }

  let errorCardId: string | undefined;
  let producedItems = state.producedItems;
  if (scoreRes.outcome === 'l1_trap') {
    const errItemId = makeL1ErrorItemId(currentQ.collocation.id);
    const errCardKey = makeCardId(errItemId, 'err_fix');
    if (!reviewedIds.includes(errCardKey)) {
      const errUpd = applySrsReview(
        nextCards,
        nextReviews,
        errItemId,
        'err_fix',
        Rating.Again,
        false,
        false,
        responseTimeMs,
        nowMs,
        false,
      );
      nextCards = errUpd.nextCards;
      nextReviews = errUpd.nextReviews;
      errorCardId = errUpd.cardId;
      reviewedIds = [...reviewedIds, errCardKey];
      producedItems = withProduced(producedItems, currentQ.collocation, scoreRes.matchedTrap);
    }
  }

  const nextTotalXp = state.xp + xpEarned;
  const nextState: V2EngineState = {
    ...state,
    sprintIndex: state.sprintIndex + 1,
    sprintLastResult: scoreRes,
    sprintCorrectCount: state.sprintCorrectCount + (scoreRes.correct ? 1 : 0),
    sprintPersonalBestXp: Math.max(state.sprintPersonalBestXp, nextTotalXp),
    sprintReviewedIds: reviewedIds,
    producedItems,
    xp: nextTotalXp,
    combo: nextCombo,
    maxCombo: nextMaxCombo,
    correctCount: state.correctCount + (scoreRes.correct ? 1 : 0),
    totalQuestions: state.sprintIndex + 1,
    attemptItems: [
      ...state.attemptItems,
      {
        itemId: currentQ.collocation.id,
        correct: scoreRes.correct,
        responseTimeMs,
        trapType: scoreRes.outcome === 'l1_trap' ? 'l1_collocation' : undefined,
      },
    ],
    srsCards: nextCards,
    reviews: nextReviews,
  };

  return {
    state: nextState,
    events: [
      {
        type: 'answer_scored',
        stage: 'sprint',
        correct: scoreRes.correct,
        outcome: scoreRes.outcome,
        xpEarned,
        cardId,
        errorCardId,
        rating,
      },
    ],
  };
}

export function finishSprintSession(
  state: V2EngineState,
  nowMs = Date.now(),
): { state: V2EngineState; events: V2EngineEvent[] } {
  if (state.stage === 'recap') return { state, events: [] };
  return {
    state: {
      ...state,
      stage: 'recap',
      sprintRemainingSec: 0,
      endedAt: nowMs,
      sprintPersonalBestXp: Math.max(state.sprintPersonalBestXp, state.xp),
    },
    events: [{ type: 'stage_changed', stage: 'recap' }],
  };
}

export function formatV2WinStatement(state: V2EngineState): string {
  if (state.mode === 'sprint') {
    return `Sprint 60 giây: Gõ đúng ${state.sprintCorrectCount} collocation (Combo tối đa x${state.maxCombo}). Kỷ lục cá nhân: ${state.sprintPersonalBestXp} XP.`;
  }
  return `Rèn xong ${state.forgedShelf.length} collocation quanh ${state.forge.headword}. Bạn tránh được ${state.trapsAvoided}/${state.totalTrapsTested} bẫy kiểu Việt.`;
}

// ---------------------------------------------------------------------------
// Lưu tiến độ (G3): ảnh chụp để ghi xuống DB giữa phiên và lúc chốt
// ---------------------------------------------------------------------------

export interface V2ProgressSnapshot {
  progress: Omit<ProgressPayload, 'attemptId'>;
  /** Nội dung thẻ do game tạo, ghi bằng `userItemRepo.upsertWithCard(item, 'err_fix')`. */
  items: UserItemInput[];
}

/**
 * `null` khi phiên chưa có gì đáng ghi hoặc là phiên "Ôn lại câu sai" (không ghi attempt/XP/FSRS).
 * `reviews` luôn là danh sách đầy đủ chỉ thêm vào cuối nên repo tự ghi phần mới (idempotent).
 */
export function buildV2ProgressSnapshot(
  state: V2EngineState,
  now: number = Date.now(),
): V2ProgressSnapshot | null {
  if (state.isRetry) return null;
  const hasWork = state.attemptItems.length > 0 || state.reviews.length > 0 || state.xp > 0;
  if (!hasWork) return null;

  const touched = [...new Set(state.reviews.map((r) => r.cardId))];
  const updatedCards = touched
    .map((id) => state.srsCards[id])
    .filter((c): c is SRSCard => Boolean(c));
  const sprint = state.mode === 'sprint';

  return {
    progress: {
      attempt: {
        gameId: 'v2',
        mode: state.mode,
        startedAt: state.startedAt,
        endedAt: state.endedAt ?? now,
        score: state.correctCount,
        total: Math.max(1, sprint ? state.attemptItems.length : state.totalQuestions),
        xp: state.xp,
        items: state.attemptItems,
      },
      updatedCards,
      reviews: state.reviews,
    },
    items: Object.values(state.producedItems),
  };
}
