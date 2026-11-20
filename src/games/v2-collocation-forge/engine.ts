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
import { matchAnswer } from '../../core/text/answerMatch';
import { normalizeText } from '../../core/text/normalize';

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

function hasLeadingArticleInDisplay(display: string): boolean {
  const trimmed = display.trim();
  return /^(a|an|the)\s+___/i.test(trimmed) || /^___\s+(a|an|the)\s+/i.test(trimmed);
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
  const ignoreLeadingArticle = hasLeadingArticleInDisplay(gap.display) || true;
  const directMatch = matchAnswer(rawInput, gap.answers, {
    ignoreLeadingArticle,
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

export function buildNungChoices(forge: HeadwordForge): NungSentenceChoice[] {
  const cols = forge.collocations;
  const c1 = cols[0];
  const c2 = cols[1] ?? cols[0];
  const trapSource = cols.find((c) => c.l1Traps.length > 0 && c.id !== c1.id && c.id !== c2.id) ??
    cols.find((c) => c.l1Traps.length > 0) ??
    c1;
  const trap = trapSource.l1Traps[0] ?? {
    wrong: `make ${forge.headword}`,
    whyVi: 'Lỗi dịch từng chữ từ tiếng Việt.',
  };

  const trapSentence = trapSource.example
    .toLowerCase()
    .includes(trapSource.phrase.toLowerCase())
    ? trapSource.example.replace(new RegExp(trapSource.phrase, 'i'), trap.wrong)
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

  return rawChoices.map((choice, idx) => ({ ...choice, index: idx }));
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

export function buildToiRounds(forge: HeadwordForge, level: number): ToiRound[] {
  const allTraps: Array<{ col: CollocationItem; trap: { wrong: string; whyVi: string } }> = [];
  for (const col of forge.collocations) {
    for (const trap of col.l1Traps) {
      allTraps.push({ col, trap });
    }
  }

  const roundCount = Math.min(3, Math.max(2, Math.min(allTraps.length, 3)));
  const rounds: ToiRound[] = [];

  for (let r = 0; r < roundCount; r++) {
    const primaryTrapEntry = allTraps[r % allTraps.length];
    const includeSecondTrap = level >= 4 && allTraps.length >= 2 && r % 2 === 1;
    const secondTrapEntry = includeSecondTrap
      ? allTraps[(r + 1) % allTraps.length]
      : null;

    const trapEntries =
      secondTrapEntry && secondTrapEntry.trap.wrong !== primaryTrapEntry.trap.wrong
        ? [primaryTrapEntry, secondTrapEntry]
        : [primaryTrapEntry];

    const usedColIds = new Set(trapEntries.map((e) => e.col.id));
    const validCols = forge.collocations.filter((c) => !usedColIds.has(c.id));
    const neededValid = 4 - trapEntries.length;

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
      const vCol = validCols[(r + i) % Math.max(1, validCols.length)] ?? forge.collocations[i % forge.collocations.length];
      rawCards.push({
        collocationId: vCol.id,
        text: vCol.phrase,
        meaningVi: vCol.meaningVi,
        isTrap: false,
        correctPhrase: vCol.phrase,
        AcceptedFixes: [vCol.phrase],
      });
    }

    // Deterministic rotation so trap isn't always at index 0
    const rotated = rawCards.map((_c, idx) => rawCards[(idx + r) % rawCards.length]);

    rounds.push({
      roundIndex: r,
      cards: rotated.map((c, idx) => ({ ...c, index: idx })),
      selectedCardIndex: null,
      crackedCardIndex: null,
      activeTrapCard: null,
      spotCorrect: null,
      fixInput: '',
      fixCorrect: null,
      step: 'spot',
    });
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

  const srsCards: Record<string, SRSCard> = {};
  for (const c of existingCards) {
    srsCards[c.id] = { ...c };
  }

  const nungChoices = buildNungChoices(forge);
  const dapQuestions = buildDapQuestions(forge, level);
  const toiRounds = buildToiRounds(forge, level);

  const sprintSource = allCollocations.length >= 6 ? allCollocations : forge.collocations;
  const sprintQuestions: DapQuestion[] = sprintSource.map((col) => {
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

  const c1 = forge.collocations[0];
  const c2 = forge.collocations[1] ?? forge.collocations[0];

  return {
    mode,
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
  const colCardId = makeCardId(currentQ.collocation.id, 'col_gap');
  const existingColCard = state.srsCards[colCardId];

  const rating = autoRate({
    correct: scoreRes.correct,
    face: 'col_gap',
    responseTimeMs,
    hintsUsed: currentQ.hintUsed ? 1 : 0,
    cardStreak: existingColCard?.streak ?? 0,
  });

  let { nextCards, nextReviews, cardId } = applySrsReview(
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

  let errorCardId: string | undefined;
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
  }

  const xpEarned = scoreRes.correct ? V2_XP.DAP_CORRECT : 0;
  const nextCombo = scoreRes.correct ? state.combo + 1 : 0;
  const nextMaxCombo = Math.max(state.maxCombo, nextCombo);

  const nextForgedShelf =
    scoreRes.correct && !state.forgedShelf.some((c) => c.id === currentQ.collocation.id)
      ? [...state.forgedShelf, currentQ.collocation]
      : state.forgedShelf;

  const nextMistakes = [...state.mistakes];
  if (!scoreRes.correct) {
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
    });
  }

  const nextAttemptItems: AttemptItem[] = [
    ...state.attemptItems,
    {
      itemId: currentQ.collocation.id,
      correct: scoreRes.correct,
      responseTimeMs,
      trapType: scoreRes.outcome === 'l1_trap' ? 'l1_collocation' : undefined,
    },
  ];

  const nextState: V2EngineState = {
    ...state,
    dapLastResult: scoreRes,
    dapAnswered: true,
    forgedShelf: nextForgedShelf,
    xp: state.xp + xpEarned,
    combo: nextCombo,
    maxCombo: nextMaxCombo,
    correctCount: state.correctCount + (scoreRes.correct ? 1 : 0),
    mistakes: nextMistakes,
    attemptItems: nextAttemptItems,
    srsCards: nextCards,
    reviews: nextReviews,
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

export function nextDapQuestion(state: V2EngineState): {
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

export function selectToiCard(
  state: V2EngineState,
  cardIndex: number,
  nowMs = Date.now(),
): { state: V2EngineState; events: V2EngineEvent[] } {
  if (state.stage !== 'toi') return { state, events: [] };
  const currentRound = state.toiRounds[state.toiIndex];
  if (!currentRound || currentRound.step !== 'spot') return { state, events: [] };

  const clickedCard = currentRound.cards[cardIndex];
  if (!clickedCard) return { state, events: [] };

  const actualTrapCard = clickedCard.isTrap
    ? clickedCard
    : currentRound.cards.find((c) => c.isTrap) ?? clickedCard;

  const spotCorrect = clickedCard.isTrap;
  const xpEarned = spotCorrect ? V2_XP.TOI_SPOT_CORRECT : 0;
  const nextCombo = spotCorrect ? state.combo + 1 : 0;
  const nextMaxCombo = Math.max(state.maxCombo, nextCombo);

  let nextCards = state.srsCards;
  let nextReviews = state.reviews;
  let errorCardId: string | undefined;

  if (!spotCorrect) {
    const errItemId = makeL1ErrorItemId(actualTrapCard.collocationId);
    const upd = applySrsReview(
      nextCards,
      nextReviews,
      errItemId,
      'err_fix',
      Rating.Again,
      false,
      false,
      3000,
      nowMs,
    );
    nextCards = upd.nextCards;
    nextReviews = upd.nextReviews;
    errorCardId = upd.cardId;
  }

  const updatedRound: ToiRound = {
    ...currentRound,
    selectedCardIndex: cardIndex,
    crackedCardIndex: actualTrapCard.index,
    activeTrapCard: actualTrapCard,
    spotCorrect,
    step: 'type_fix',
  };

  const nextRounds = state.toiRounds.map((r, idx) =>
    idx === state.toiIndex ? updatedRound : r,
  );

  return {
    state: {
      ...state,
      toiRounds: nextRounds,
      xp: state.xp + xpEarned,
      combo: nextCombo,
      maxCombo: nextMaxCombo,
      srsCards: nextCards,
      reviews: nextReviews,
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
  const xpEarned = fixCorrect ? V2_XP.TOI_FIX_CORRECT : 0;
  const nextCombo = fixCorrect ? state.combo + 1 : 0;
  const nextMaxCombo = Math.max(state.maxCombo, nextCombo);

  let nextCards = state.srsCards;
  let nextReviews = state.reviews;
  let errorCardId: string | undefined;

  if (!fixCorrect) {
    const errItemId = makeL1ErrorItemId(trapCard.collocationId);
    const upd = applySrsReview(
      nextCards,
      nextReviews,
      errItemId,
      'err_fix',
      Rating.Again,
      false,
      false,
      4000,
      nowMs,
    );
    nextCards = upd.nextCards;
    nextReviews = upd.nextReviews;
    errorCardId = upd.cardId;
  }

  const bothCorrect = Boolean(currentRound.spotCorrect && fixCorrect);
  const nextMistakes = [...state.mistakes];
  if (!bothCorrect) {
    nextMistakes.push({
      id: `${trapCard.collocationId}_toi_${currentRound.roundIndex}`,
      prompt: `Sửa bẫy kiểu Việt: ~~${trapCard.text}~~`,
      userAnswer: typedFix.trim() || '(chưa sửa đúng)',
      correctAnswer: trapCard.correctPhrase,
      note: trapCard.whyVi,
      isL1Trap: true,
    });
  }

  const updatedRound: ToiRound = {
    ...currentRound,
    fixInput: typedFix,
    fixCorrect,
    step: 'feedback',
  };

  const nextRounds = state.toiRounds.map((r, idx) =>
    idx === state.toiIndex ? updatedRound : r,
  );

  return {
    state: {
      ...state,
      toiRounds: nextRounds,
      xp: state.xp + xpEarned,
      combo: nextCombo,
      maxCombo: nextMaxCombo,
      trapsAvoided: state.trapsAvoided + (bothCorrect ? 1 : 0),
      correctCount: state.correctCount + (bothCorrect ? 1 : 0),
      mistakes: nextMistakes,
      attemptItems: [
        ...state.attemptItems,
        {
          itemId: trapCard.collocationId,
          correct: bothCorrect,
          trapType: bothCorrect ? undefined : 'l1_collocation',
        },
      ],
      srsCards: nextCards,
      reviews: nextReviews,
    },
    events: [
      {
        type: 'answer_scored',
        stage: 'toi',
        correct: fixCorrect,
        outcome: 'toi_fix',
        xpEarned,
        errorCardId,
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

  // All 3 stages complete -> award +40 XP forge completion bonus
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

export function detectUsedCollocations(
  sentence: string,
  targets: readonly CollocationItem[],
): string[] {
  const normSentence = normalizeText(sentence);
  if (!normSentence) return [];

  const matched: string[] = [];
  for (const col of targets) {
    const normPhrase = normalizeText(stripLeadingArticle(col.phrase));
    const primaryWord = normalizeText(col.gaps[0]?.primary ?? '');
    if (
      (normPhrase && normSentence.includes(normPhrase)) ||
      (primaryWord && normSentence.includes(primaryWord))
    ) {
      matched.push(col.phrase);
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
    state.sprintQuestions[state.sprintIndex % state.sprintQuestions.length];
  if (!currentQ) return { state, events: [] };

  const scoreRes = scoreCollocationGap(rawInput, currentQ.collocation, currentQ.gap);
  const nextCombo = scoreRes.correct ? state.combo + 1 : 0;
  const nextMaxCombo = Math.max(state.maxCombo, nextCombo);
  // §4: Sprint: 60 giây. Mỗi câu đúng +10 × combo.
  const xpEarned = scoreRes.correct ? V2_XP.SPRINT_BASE * nextCombo : 0;

  const colCardId = makeCardId(currentQ.collocation.id, 'col_gap');
  const existingCard = state.srsCards[colCardId];
  const rating = autoRate({
    correct: scoreRes.correct,
    face: 'col_gap',
    responseTimeMs,
    cardStreak: existingCard?.streak ?? 0,
  });

  // §8: Sprint chỉ ghi review cho card đã có (như một lượt ôn bình thường)
  let { nextCards, nextReviews, cardId } = applySrsReview(
    state.srsCards,
    state.reviews,
    currentQ.collocation.id,
    'col_gap',
    rating,
    scoreRes.correct,
    false,
    responseTimeMs,
    nowMs,
    true, // onlyIfExisting = true
  );

  let errorCardId: string | undefined;
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
      false,
    );
    nextCards = errUpd.nextCards;
    nextReviews = errUpd.nextReviews;
    errorCardId = errUpd.cardId;
  }

  const nextTotalXp = state.xp + xpEarned;
  const nextState: V2EngineState = {
    ...state,
    sprintIndex: state.sprintIndex + 1,
    sprintLastResult: scoreRes,
    sprintCorrectCount: state.sprintCorrectCount + (scoreRes.correct ? 1 : 0),
    sprintPersonalBestXp: Math.max(state.sprintPersonalBestXp, nextTotalXp),
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
