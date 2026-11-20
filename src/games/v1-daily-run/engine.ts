import { Rating, State, type Grade } from 'ts-fsrs';
import type {
  CollocationItem,
  DictationItem,
  ErrorItem,
  ErrorTag,
  ParaphraseItem,
  VocabItem,
} from '../../core/content/schemas';
import { autoRate } from '../../core/srs/autoRate';
import {
  getCardMastery,
  getItemMastery,
  getUnlockableVocabFaces,
  type Face,
  type FaceCardSnapshot,
  type MasteryStage,
} from '../../core/srs/faces';
import {
  createNewCard,
  getCardRetrievability,
  makeCardId,
  scheduleCard,
  type SRSCard,
} from '../../core/srs/fsrsAdapter';
import { buildReviewQueue } from '../../core/srs/queue';
import { isRareMasteredCard } from '../../core/gamification/xp';
import { levenshteinDistance } from '../../core/text/answerMatch';
import { normalizeText, normalizeTypography } from '../../core/text/normalize';
import { areSpellingVariants, getSpellingVariant } from '../../core/text/spellingVariants';
import type { AttemptItem, ReviewRecord } from '../../core/storage/db';
import type { V1ContentBundle } from '../../test/fixtures/v1_fixtures';

// ---------------------------------------------------------------------------
// Constants (docs/games/V1-DAILY-RUN.md §4)
// ---------------------------------------------------------------------------

export const STAGE_SIZE = 20;
export const MAX_STANDARD_RUN_CARDS = 60;
export const BUSY_RUN_CARDS = 10;
export const EXTRA_PRACTICE_CARDS = 20;
export const BOSS_CARD_COUNT = 5;
export const BOSS_MAX_HP = 100;
export const BOSS_DAMAGE_PER_CARD = 20;
export const BOSS_DEFEAT_XP = 50;

export const V1_FACES = [
  'intro',
  'recog',
  'recall_meaning',
  'recall_cloze',
  'listen_spell',
  'col_gap',
  'para_match',
  'err_fix',
] as const;

export type V1Face = (typeof V1_FACES)[number];

export type V1RunMode = 'standard' | 'busy' | 'extra_practice';

/**
 * Node color categories for RunMap (docs/games/V1-DAILY-RUN.md §6):
 * - vocab: purple (tím)
 * - collocation: orange (cam)
 * - paraphrase: green (xanh lá)
 * - error: red (đỏ)
 * - listen: cyan/blue (xanh dương)
 */
export type V1NodeKind = 'vocab' | 'collocation' | 'paraphrase' | 'error' | 'listen';

export type V1RunPhase = 'map_intro' | 'playing' | 'checkpoint' | 'boss' | 'recap';

export interface CharDiffSegment {
  char: string;
  expectedChar?: string;
  status: 'match' | 'wrong' | 'missing' | 'extra';
  index: number;
}

export interface SpellingAnalysis {
  hasDoubleLetterError: boolean;
  hasSilentLetterError: boolean;
  doubleLetterPattern?: string;
  silentLetter?: string;
  tipVi: string;
}

// ---------------------------------------------------------------------------
// Face Prompt Payloads (8 Faces in docs/games/V1-DAILY-RUN.md §4.1)
// ---------------------------------------------------------------------------

export interface IntroPromptPayload {
  face: 'intro';
  headword: string;
  ipaUk: string;
  ipaUs?: string;
  pos: string[];
  cefr?: string;
  meaningVi: string;
  definitionEn: string;
  exampleEn: string;
  exampleVi?: string;
  collocations: string[];
  audioUrl?: string;
  vnTrap?: string;
}

export interface RecogPromptPayload {
  face: 'recog';
  headword: string;
  ipaUk: string;
  pos: string[];
  cefr?: string;
  audioUrl?: string;
  choices: string[];
  correctIndex: number;
  correctAnswer: string;
  exampleEn: string;
  collocationHighlight?: string;
  vnTrap?: string;
}

export interface RecallMeaningPromptPayload {
  face: 'recall_meaning';
  headword: string;
  meaningVi: string;
  definitionEn: string;
  pos: string[];
  cefr?: string;
  audioUrl?: string;
  placeholderMask: string;
  letterCount: number;
  initialRevealedCount: number;
  exampleEn: string;
  collocationHighlight?: string;
  vnTrap?: string;
}

export interface RecallClozePromptPayload {
  face: 'recall_cloze';
  headword: string;
  clozeSentenceEn: string;
  fullSentenceEn: string;
  exampleVi?: string;
  meaningVi: string;
  pos: string[];
  cefr?: string;
  audioUrl?: string;
  primaryAnswer: string;
  acceptedAnswers: string[];
  placeholderMask: string;
  letterCount: number;
  collocationHighlight?: string;
  vnTrap?: string;
}

export interface ListenSpellPromptPayload {
  face: 'listen_spell';
  targetWord: string;
  acceptedAnswers: string[];
  audioUrl?: string;
  meaningVi?: string;
  pos?: string[];
  contextSentenceEn: string;
  maxPlays: number;
  placeholderMask: string;
  letterCount: number;
  customTipVi?: string;
  collocationHighlight?: string;
}

export interface ColGapPromptPayload {
  face: 'col_gap';
  phrase: string;
  pattern: string;
  displayGap: string;
  meaningVi: string;
  exampleEn: string;
  primaryAnswer: string;
  acceptedAnswers: string[];
  placeholderMask: string;
  letterCount: number;
  l1Traps: Array<{ wrong: string; whyVi: string }>;
}

export interface ParaMatchPromptPayload {
  face: 'para_match';
  questionPhrase: string;
  contextEn: string;
  choices: string[];
  correctIndex: number;
  correctAnswer: string;
  decoyReasons: Record<string, string>;
  explanationVi: string;
}

export interface ErrFixPromptPayload {
  face: 'err_fix';
  tag: ErrorTag;
  wrongSentence: string;
  prefixText: string;
  errorSpanText: string;
  suffixText: string;
  expectedCorrection: string;
  fullCorrectSentence: string;
  ruleVi: string;
  placeholderMask: string;
  letterCount: number;
}

export type V1PromptPayload =
  | IntroPromptPayload
  | RecogPromptPayload
  | RecallMeaningPromptPayload
  | RecallClozePromptPayload
  | ListenSpellPromptPayload
  | ColGapPromptPayload
  | ParaMatchPromptPayload
  | ErrFixPromptPayload;

// ---------------------------------------------------------------------------
// Run Node, Feedback, Events, and State
// ---------------------------------------------------------------------------

export interface V1RunNode {
  nodeId: string;
  card: SRSCard;
  itemId: string;
  face: V1Face;
  nodeKind: V1NodeKind;
  stageIndex: number;
  isNewCard: boolean;
  isRare: boolean;
  isRetry: boolean;
  retryCount: number;
  isBossNode: boolean;
  retrievability: number;
  prompt: V1PromptPayload;
  hintsUsed: number;
  revealedLetters: number;
  eliminatedChoices: number[];
  audioPlaysUsed: number;
  status: 'pending' | 'correct' | 'partial' | 'wrong' | 'seen';
  repaired: boolean;
  fromIntroKnowAlready?: boolean;
}

export interface V1FeedbackState {
  nodeId: string;
  itemId: string;
  face: V1Face;
  status: 'correct' | 'partial' | 'wrong';
  userAnswer: string;
  correctAnswer: string;
  rating: Grade;
  xpEarned: number;
  explanationVi: string;
  exampleEn?: string;
  collocationHighlight?: string;
  vnTrap?: string;
  charDiff?: CharDiffSegment[];
  wrongCharNotice?: string;
  spellingAnalysis?: SpellingAnalysis;
  autoAdvanceMs?: number;
}

export type V1EngineEvent =
  | {
      type: 'answer_scored';
      nodeId: string;
      cardId: string;
      itemId: string;
      face: V1Face;
      correct: boolean;
      status: 'correct' | 'partial' | 'wrong';
      rating: Grade;
      xpEarned: number;
      firstAttempt: boolean;
    }
  | {
      type: 'intro_know_already';
      nodeId: string;
      itemId: string;
    }
  | {
      type: 'card_reinserted';
      itemId: string;
      fromFace: V1Face;
      toFace: V1Face;
      insertedAtIndex: number;
      offset: number;
    }
  | {
      type: 'stage_checkpoint';
      completedStage: number;
      totalStages: number;
    }
  | {
      type: 'boss_started';
      bossCardCount: number;
    }
  | {
      type: 'boss_hit';
      bossHp: number;
      damage: number;
    }
  | {
      type: 'boss_defeated';
      bonusXp: number;
    }
  | {
      type: 'run_completed';
      totalXp: number;
      firstAttemptAccuracy: number;
    };

export interface V1MistakeSummary {
  itemId: string;
  face: V1Face;
  promptLabel: string;
  userAnswer: string;
  correctAnswer: string;
  noteVi: string;
}

export interface V1RecapSummary {
  totalCards: number;
  firstAttemptCorrect: number;
  firstAttemptTotal: number;
  firstAttemptAccuracy: number;
  matureOrMasteredCount: number;
  tomorrowDueForecast: number;
  totalXp: number;
  maxCombo: number;
  bossDefeated: boolean;
  winStatement: string;
  mistakes: V1MistakeSummary[];
}

export interface V1RunState {
  mode: V1RunMode;
  phase: V1RunPhase;
  skillLevel: number;
  startedAt: number;
  isExtraPractice: boolean;
  stageSize: number;
  currentStage: number;
  totalStages: number;
  nodes: V1RunNode[];
  currentIndex: number;
  bossNodes: V1RunNode[];
  bossIndex: number;
  bossHp: number;
  bossMaxHp: number;
  bossDefeated: boolean;
  bossCandidateCards: SRSCard[];
  combo: number;
  maxCombo: number;
  totalXp: number;
  firstAttemptRecordedCardIds: Record<string, boolean>;
  firstAttemptCorrectCount: number;
  firstAttemptTotalCount: number;
  newlyMatureItemIds: string[];
  errorTagStreaks: Partial<Record<ErrorTag, number>>;
  maxErrorTagStreaks: Partial<Record<ErrorTag, number>>;
  updatedCards: Record<string, SRSCard>;
  allCardsSnapshot: Record<string, SRSCard>;
  reviews: Array<Omit<ReviewRecord, 'id'>>;
  attemptItems: AttemptItem[];
  mistakes: V1MistakeSummary[];
  feedback: V1FeedbackState | null;
  events: V1EngineEvent[];
  recap: V1RecapSummary | null;
  lastWeekAccuracy?: number | null;
  content: V1ContentBundle;
}

export interface CreateV1RunOptions {
  cards: readonly SRSCard[];
  content: V1ContentBundle;
  mode?: V1RunMode;
  skillLevel?: number;
  newCardsLimit?: number;
  newCardsDoneToday?: number;
  now?: Date;
  lastWeekAccuracy?: number | null;
  startOnMap?: boolean;
  randomFn?: () => number;
}

// ---------------------------------------------------------------------------
// Text, Masking, Diff, and Spelling Helpers
// ---------------------------------------------------------------------------

/**
 * Count the number of alphabetical/numeric target characters (ignoring spaces and hyphens).
 */
export function countTargetLetters(word: string): number {
  return normalizeTypography(word)
    .replace(/[\s-]+/g, '')
    .trim().length;
}

/**
 * Normalize a headword or phrase while ignoring differences between spaces and hyphens
 * (docs/games/V1-DAILY-RUN.md §11: "rote learning" vs "rote-learning").
 */
export function normalizeHeadwordLoose(input: string): string {
  return normalizeTypography(input)
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two strings match up to space/hyphen indifference and UK/US spelling variants.
 */
export function isLooseSpellingMatch(input: string, target: string): boolean {
  const normInput = normalizeHeadwordLoose(input);
  const normTarget = normalizeHeadwordLoose(target);
  if (!normInput || !normTarget) return false;
  if (normInput === normTarget) return true;
  if (normInput.replace(/\s+/g, '') === normTarget.replace(/\s+/g, '')) return true;
  return areSpellingVariants(normInput, normTarget);
}

/**
 * Build placeholder mask `_ _ _ _` with exact letter count, where spaces render as `·`
 * and revealed letters are filled from left to right (docs/games/V1-DAILY-RUN.md §6 & §10).
 */
export function buildPlaceholderMask(word: string, revealedCount = 0): string {
  const clean = normalizeTypography(word).trim();
  if (!clean) return '_';

  let remainingReveal = Math.max(0, revealedCount);
  const tokens: string[] = [];

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === ' ') {
      tokens.push('·');
    } else if (ch === '-') {
      tokens.push('-');
    } else if (remainingReveal > 0) {
      tokens.push(ch.toLowerCase());
      remainingReveal--;
    } else {
      tokens.push('_');
    }
  }

  return tokens.join(' ');
}

/**
 * Extract the revealed prefix string (for pre-filling or showing hint letters).
 */
export function getRevealedPrefix(word: string, revealedCount: number): string {
  const clean = normalizeTypography(word).trim();
  if (revealedCount <= 0) return '';
  let lettersIncluded = 0;
  let result = '';
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === ' ' || ch === '-') {
      if (lettersIncluded < revealedCount) {
        result += ch;
      }
      continue;
    }
    if (lettersIncluded < revealedCount) {
      result += ch;
      lettersIncluded++;
    } else {
      break;
    }
  }
  return result;
}

/**
 * Compute character-by-character diff between learner's answer and the target answer
 * so UI can highlight wrong characters in red and point out 1-char typos.
 */
export function computeCharDiff(
  userInput: string,
  expected: string,
): {
  segments: CharDiffSegment[];
  wrongIndices: number[];
  firstWrongNotice?: string;
} {
  const actual = normalizeTypography(userInput).trim();
  const target = normalizeTypography(expected).trim();
  const maxLen = Math.max(actual.length, target.length);
  const segments: CharDiffSegment[] = [];
  const wrongIndices: number[] = [];
  let firstWrongNotice: string | undefined;

  for (let i = 0; i < maxLen; i++) {
    const aChar = actual[i];
    const tChar = target[i];

    if (aChar !== undefined && tChar !== undefined) {
      if (aChar.toLowerCase() === tChar.toLowerCase()) {
        segments.push({ char: aChar, expectedChar: tChar, status: 'match', index: i });
      } else {
        segments.push({ char: aChar, expectedChar: tChar, status: 'wrong', index: i });
        wrongIndices.push(i);
        if (!firstWrongNotice) {
          firstWrongNotice = `Sai ký tự vị trí ${i + 1}: bạn gõ "${aChar}", đúng là "${tChar}".`;
        }
      }
    } else if (aChar === undefined && tChar !== undefined) {
      segments.push({ char: '_', expectedChar: tChar, status: 'missing', index: i });
      wrongIndices.push(i);
      if (!firstWrongNotice) {
        firstWrongNotice = `Thiếu ký tự "${tChar}" ở vị trí ${i + 1}.`;
      }
    } else if (aChar !== undefined && tChar === undefined) {
      segments.push({ char: aChar, status: 'extra', index: i });
      wrongIndices.push(i);
      if (!firstWrongNotice) {
        firstWrongNotice = `Thừa ký tự "${aChar}" ở vị trí ${i + 1}.`;
      }
    }
  }

  return { segments, wrongIndices, firstWrongNotice };
}

const KNOWN_SILENT_LETTER_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  letter: string;
  labelVi: string;
}> = [
  { pattern: /nm/i, letter: 'n', labelVi: 'âm câm "n" đứng trước "m" (như environment, government)' },
  { pattern: /mn$/i, letter: 'n', labelVi: 'âm câm "n" ở cuối sau "m" (như autumn, column)' },
  { pattern: /^kn/i, letter: 'k', labelVi: 'âm câm "k" ở đầu từ trước "n" (như knowledge)' },
  { pattern: /^ps/i, letter: 'p', labelVi: 'âm câm "p" ở đầu từ (như psychology)' },
  { pattern: /bt/i, letter: 'b', labelVi: 'âm câm "b" đứng trước "t" (như subtle, debt)' },
  { pattern: /pt$/i, letter: 'p', labelVi: 'âm câm "p" trong cụm "pt" (như receipt)' },
  { pattern: /gm$/i, letter: 'g', labelVi: 'âm câm "g" trước "m" (như paradigm)' },
  { pattern: /gn/i, letter: 'g', labelVi: 'âm câm "g" trước "n" (như campaign, foreign)' },
  { pattern: /sc[iey]/i, letter: 'c', labelVi: 'âm câm "c" sau "s" (như conscious, discipline, science)' },
  { pattern: /^rh/i, letter: 'h', labelVi: 'âm câm "h" sau "r" (như rhythm, rhetoric)' },
  { pattern: /isl/i, letter: 's', labelVi: 'âm câm "s" trong "isl" (như island)' },
  { pattern: /dge/i, letter: 'd', labelVi: 'âm câm "d" trong cụm "dge" (như knowledge)' },
];

/**
 * Analyze a spelling mistake in `listen_spell` to detect double-letter errors or silent-letter omissions
 * (docs/games/V1-DAILY-RUN.md §4.1: "Sai ở chữ đôi hay âm câm thì tipVi chỉ ra").
 */
export function analyzeSpellingError(
  userInput: string,
  targetWord: string,
  customTipVi?: string,
): SpellingAnalysis {
  const actual = normalizeHeadwordLoose(userInput).replace(/\s+/g, '');
  const target = normalizeHeadwordLoose(targetWord).replace(/\s+/g, '');

  // 1. Check double-letter patterns in targetWord (e.g. cc, mm, rr, ll, ss, nn, pp, tt, ff)
  const doubleMatches = target.match(/([a-z])\1/g) ?? [];
  const missingDoubles: string[] = [];
  for (const dbl of doubleMatches) {
    const single = dbl[0];
    const targetCount = target.split(dbl).length - 1;
    const actualCount = actual.split(dbl).length - 1;
    if (actualCount < targetCount && actual.includes(single)) {
      if (!missingDoubles.includes(dbl)) {
        missingDoubles.push(dbl);
      }
    }
  }

  // Also check if user accidentally doubled a single letter
  const actualDoubles = actual.match(/([a-z])\1/g) ?? [];
  const extraDoubles = actualDoubles.filter((dbl) => !target.includes(dbl));

  const hasDoubleLetterError = missingDoubles.length > 0 || extraDoubles.length > 0;
  const doubleLetterPattern = missingDoubles[0] ?? extraDoubles[0];

  // 2. Check silent-letter patterns
  let hasSilentLetterError = false;
  let silentLetter: string | undefined;
  let silentDescVi: string | undefined;

  for (const rule of KNOWN_SILENT_LETTER_PATTERNS) {
    if (rule.pattern.test(target)) {
      const targetLetterCount = [...target].filter((c) => c === rule.letter).length;
      const actualLetterCount = [...actual].filter((c) => c === rule.letter).length;
      if (actualLetterCount < targetLetterCount) {
        hasSilentLetterError = true;
        silentLetter = rule.letter;
        silentDescVi = rule.labelVi;
        break;
      }
    }
  }

  // Fallback silent letter detection: if user omitted exactly 1 consonant or unstressed vowel inside a cluster
  if (!hasSilentLetterError && target.length - actual.length === 1) {
    for (let i = 0; i < target.length; i++) {
      const candidateWithoutChar = target.slice(0, i) + target.slice(i + 1);
      if (candidateWithoutChar === actual) {
        const omitted = target[i];
        // If omitted character is not a double letter already caught
        if (target[i - 1] !== omitted && target[i + 1] !== omitted) {
          hasSilentLetterError = true;
          silentLetter = omitted;
          silentDescVi = `âm câm hoặc âm yếu "${omitted}" ở vị trí ${i + 1} trong "${targetWord}"`;
        }
        break;
      }
    }
  }

  const tips: string[] = [];
  if (missingDoubles.length > 0) {
    tips.push(
      `Lỗi chữ đôi: từ "${targetWord}" cần gấp đôi chữ "${missingDoubles.join('", "')}".`,
    );
  } else if (extraDoubles.length > 0) {
    tips.push(
      `Lỗi chữ đôi: trong "${targetWord}" không gấp đôi chữ "${extraDoubles.join('", "')}".`,
    );
  }

  if (hasSilentLetterError && silentDescVi) {
    tips.push(`Lỗi âm câm: chú ý ${silentDescVi}.`);
  }

  if (customTipVi && !tips.some((t) => t.includes(customTipVi))) {
    tips.push(customTipVi);
  }

  if (tips.length === 0) {
    tips.push(`Chính tả chuẩn là "${targetWord}". Hãy đối chiếu từng âm tiết.`);
  }

  return {
    hasDoubleLetterError,
    hasSilentLetterError,
    doubleLetterPattern,
    silentLetter,
    tipVi: tips.join(' '),
  };
}

/**
 * Extract the exact replacement segment corresponding to `errorSpan` in an ErrorItem.
 */
export function extractErrorCorrection(item: ErrorItem): {
  prefixText: string;
  errorSpanText: string;
  suffixText: string;
  expectedCorrection: string;
} {
  const { start, end } = item.errorSpan;
  const prefixText = item.wrong.slice(0, start);
  const errorSpanText = item.wrong.slice(start, end);
  const suffixText = item.wrong.slice(end);

  let expectedCorrection = item.correct;
  if (prefixText.length > 0 && expectedCorrection.startsWith(prefixText)) {
    expectedCorrection = expectedCorrection.slice(prefixText.length);
  }
  if (suffixText.length > 0 && expectedCorrection.endsWith(suffixText)) {
    expectedCorrection = expectedCorrection.slice(0, expectedCorrection.length - suffixText.length);
  }

  return {
    prefixText,
    errorSpanText,
    suffixText,
    expectedCorrection: expectedCorrection.trim(),
  };
}

// ---------------------------------------------------------------------------
// Face Mapping, Downgrade, and Prompt Builders
// ---------------------------------------------------------------------------

export function getNodeKindForCard(itemId: string, face: V1Face): V1NodeKind {
  if (face === 'listen_spell' || itemId.startsWith('dict:')) return 'listen';
  if (itemId.startsWith('col:') || face === 'col_gap') return 'collocation';
  if (itemId.startsWith('para:') || face === 'para_match') return 'paraphrase';
  if (itemId.startsWith('err:') || face === 'err_fix') return 'error';
  return 'vocab';
}

/**
 * Normalize any SRS Face into one of the 8 V1 faces.
 */
export function normalizeToV1Face(face: Face, itemId: string, isNewVocab = false): V1Face {
  if (isNewVocab && itemId.startsWith('vocab:')) {
    return 'intro';
  }
  if (itemId.startsWith('col:')) return 'col_gap';
  if (itemId.startsWith('para:')) return 'para_match';
  if (itemId.startsWith('err:')) return 'err_fix';
  if (itemId.startsWith('dict:')) return 'listen_spell';

  switch (face) {
    case 'intro':
    case 'recog':
    case 'recall_meaning':
    case 'recall_cloze':
    case 'listen_spell':
    case 'col_gap':
    case 'para_match':
    case 'err_fix':
      return face;
    case 'dict_full':
    case 'ltrap_replay':
      return 'listen_spell';
    case 'use':
      return 'recall_cloze';
    default:
      return 'recog';
  }
}

/**
 * Downgrade a face by 1 difficulty step when answered wrong (docs/games/V1-DAILY-RUN.md §4):
 * - Vocab production faces (`recall_meaning`, `recall_cloze`, `listen_spell`) downgrade to `'recog'`.
 * - Recognition or specialized item faces keep their face for retry.
 */
export function downgradeFace(face: V1Face, itemId: string): V1Face {
  if (itemId.startsWith('vocab:')) {
    if (face === 'recall_meaning' || face === 'recall_cloze' || face === 'listen_spell') {
      return 'recog';
    }
    return 'recog';
  }
  return face;
}

function buildClozeSentence(sentenceEn: string, candidates: readonly string[]): {
  clozeSentenceEn: string;
  matchedForm: string;
} {
  const sorted = [...candidates].filter(Boolean).sort((a, b) => b.length - a.length);
  for (const form of sorted) {
    const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    const match = sentenceEn.match(regex);
    if (match && match[0]) {
      return {
        clozeSentenceEn: sentenceEn.replace(regex, '_____'),
        matchedForm: match[0].toLowerCase(),
      };
    }
  }
  return {
    clozeSentenceEn: `${sentenceEn} (_____)`,
    matchedForm: candidates[0]?.toLowerCase() ?? '',
  };
}

function resolveCollocationPhrases(
  vocab: VocabItem,
  content: V1ContentBundle,
): string[] {
  const found: string[] = [];
  for (const colId of vocab.collocationIds) {
    const col = content.collocations.find((c) => c.id === colId);
    if (col) {
      found.push(col.phrase);
    }
  }
  if (found.length < 2 && vocab.synonyms) {
    for (const syn of vocab.synonyms) {
      if (found.length < 2) {
        found.push(`${vocab.headword} ≈ ${syn.word}`);
      }
    }
  }
  while (found.length < 2) {
    found.push(`${vocab.headword} (${vocab.pos[0] ?? 'n'})`);
  }
  return found.slice(0, 2);
}

/**
 * Build the prompt payload for a specific itemId and V1Face.
 */
export function buildPromptForCard(
  itemId: string,
  face: V1Face,
  content: V1ContentBundle,
  skillLevel = 1,
): V1PromptPayload {
  // 1. Collocation item -> col_gap
  if (itemId.startsWith('col:') || face === 'col_gap') {
    const col =
      content.collocations.find((c) => c.id === itemId) ?? content.collocations[0];
    const gap = col.gaps[0];
    return {
      face: 'col_gap',
      phrase: col.phrase,
      pattern: col.pattern,
      displayGap: gap.display,
      meaningVi: col.meaningVi,
      exampleEn: col.example,
      primaryAnswer: gap.primary,
      acceptedAnswers: Array.from(new Set([gap.primary, ...gap.answers, col.phrase])),
      placeholderMask: buildPlaceholderMask(gap.primary, 0),
      letterCount: countTargetLetters(gap.primary),
      l1Traps: col.l1Traps,
    };
  }

  // 2. Paraphrase item -> para_match
  if (itemId.startsWith('para:') || face === 'para_match') {
    const para =
      content.paraphrases.find((p) => p.id === itemId) ?? content.paraphrases[0];
    const decoyTexts = para.decoys.map((d) => d.text);
    while (decoyTexts.length < 3) {
      const extra = content.paraphrases.find((p) => p.id !== para.id)?.target.text ?? 'unrelated academic phrase';
      if (!decoyTexts.includes(extra)) decoyTexts.push(extra);
      else break;
    }

    const rawChoices = [para.target.text, ...decoyTexts.slice(0, 3)];
    // Deterministic rotation based on itemId char code sum so choices aren't always index 0
    const shift = [...para.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % rawChoices.length;
    const choices = rawChoices.map((_, idx) => rawChoices[(idx + shift) % rawChoices.length]);
    const correctIndex = choices.indexOf(para.target.text);
    const decoyReasons: Record<string, string> = {};
    for (const d of para.decoys) {
      decoyReasons[d.text] = d.whyVi;
    }

    return {
      face: 'para_match',
      questionPhrase: para.questionPhrase,
      contextEn: para.context,
      choices,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      correctAnswer: para.target.text,
      decoyReasons,
      explanationVi: para.explanationVi,
    };
  }

  // 3. Error item -> err_fix
  if (itemId.startsWith('err:') || face === 'err_fix') {
    const err = content.errors.find((e) => e.id === itemId) ?? content.errors[0];
    const { prefixText, errorSpanText, suffixText, expectedCorrection } =
      extractErrorCorrection(err);

    return {
      face: 'err_fix',
      tag: err.tag,
      wrongSentence: err.wrong,
      prefixText,
      errorSpanText,
      suffixText,
      expectedCorrection,
      fullCorrectSentence: err.correct,
      ruleVi: err.ruleVi,
      placeholderMask: buildPlaceholderMask(expectedCorrection, 0),
      letterCount: countTargetLetters(expectedCorrection),
    };
  }

  // 4. Dictation item -> listen_spell
  if (itemId.startsWith('dict:')) {
    const dict =
      content.dictations.find((d) => d.id === itemId) ?? content.dictations[0];
    const tokens = dict.text
      .replace(/[.,!?;:"]/g, '')
      .split(/\s+/)
      .filter(Boolean);
    const focusEntry = dict.focus[0];
    const targetWord =
      (focusEntry && tokens[focusEntry.tokenIndex]) ||
      tokens.reduce((longest, w) => (w.length > longest.length ? w : longest), tokens[0] ?? 'academic');
    const variant = getSpellingVariant(targetWord.toLowerCase());
    const accepted = Array.from(
      new Set([
        targetWord.toLowerCase(),
        ...(variant ? [variant] : []),
      ]),
    );
    const maxPlays = skillLevel >= 7 ? 1 : 2;

    return {
      face: 'listen_spell',
      targetWord: targetWord.toLowerCase(),
      acceptedAnswers: accepted,
      audioUrl: dict.audio,
      contextSentenceEn: dict.text,
      maxPlays,
      placeholderMask: buildPlaceholderMask(targetWord, 0),
      letterCount: countTargetLetters(targetWord),
      customTipVi: focusEntry?.tipVi,
    };
  }

  // 5. Vocab item -> intro, recog, recall_meaning, recall_cloze, listen_spell
  const vocab = content.vocab.find((v) => v.id === itemId) ?? content.vocab[0];
  const collocations = resolveCollocationPhrases(vocab, content);
  const example0 = vocab.examples[0];

  if (face === 'intro') {
    return {
      face: 'intro',
      headword: vocab.headword,
      ipaUk: vocab.ipa.uk,
      ipaUs: vocab.ipa.us,
      pos: vocab.pos,
      cefr: vocab.cefr,
      meaningVi: vocab.meaningVi,
      definitionEn: vocab.definitionEn,
      exampleEn: example0.en,
      exampleVi: example0.vi,
      collocations,
      audioUrl: vocab.audio.uk,
      vnTrap: vocab.vnTrap,
    };
  }

  if (face === 'recog') {
    const otherMeanings = content.vocab
      .filter((v) => v.id !== vocab.id && v.meaningVi !== vocab.meaningVi)
      .map((v) => v.meaningVi);
    const distractors = otherMeanings.slice(0, 3);
    while (distractors.length < 3) {
      distractors.push(`khái niệm học thuật khác (${distractors.length + 1})`);
    }
    const rawChoices = [vocab.meaningVi, ...distractors];
    const shift = [...vocab.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % rawChoices.length;
    const choices = rawChoices.map((_, idx) => rawChoices[(idx + shift) % rawChoices.length]);
    const correctIndex = choices.indexOf(vocab.meaningVi);

    return {
      face: 'recog',
      headword: vocab.headword,
      ipaUk: vocab.ipa.uk,
      pos: vocab.pos,
      cefr: vocab.cefr,
      audioUrl: vocab.audio.uk,
      choices,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      correctAnswer: vocab.meaningVi,
      exampleEn: example0.en,
      collocationHighlight: collocations[0],
      vnTrap: vocab.vnTrap,
    };
  }

  if (face === 'recall_cloze') {
    const familyForms = (vocab.family ?? []).map((f) => f.form);
    const explicitAccepted = example0.clozeAccepted ?? [];
    const allCandidates = Array.from(
      new Set([
        ...explicitAccepted,
        vocab.headword,
        ...familyForms,
      ]),
    );
    const { clozeSentenceEn, matchedForm } = buildClozeSentence(example0.en, allCandidates);
    const primaryAnswer = matchedForm || explicitAccepted[0] || vocab.headword;

    return {
      face: 'recall_cloze',
      headword: vocab.headword,
      clozeSentenceEn,
      fullSentenceEn: example0.en,
      exampleVi: example0.vi,
      meaningVi: vocab.meaningVi,
      pos: vocab.pos,
      cefr: vocab.cefr,
      audioUrl: vocab.audio.uk,
      primaryAnswer,
      acceptedAnswers: allCandidates,
      placeholderMask: buildPlaceholderMask(primaryAnswer, 0),
      letterCount: countTargetLetters(primaryAnswer),
      collocationHighlight: collocations[0],
      vnTrap: vocab.vnTrap,
    };
  }

  if (face === 'listen_spell') {
    const variant = getSpellingVariant(vocab.headword);
    const accepted = Array.from(
      new Set([
        vocab.headword,
        ...(variant ? [variant] : []),
      ]),
    );
    const maxPlays = skillLevel >= 7 ? 1 : 2;

    return {
      face: 'listen_spell',
      targetWord: vocab.headword,
      acceptedAnswers: accepted,
      audioUrl: vocab.audio.uk,
      meaningVi: vocab.meaningVi,
      pos: vocab.pos,
      contextSentenceEn: example0.en,
      maxPlays,
      placeholderMask: buildPlaceholderMask(vocab.headword, 0),
      letterCount: countTargetLetters(vocab.headword),
      customTipVi: vocab.vnTrap,
      collocationHighlight: collocations[0],
    };
  }

  // Default: recall_meaning
  // docs/games/V1-DAILY-RUN.md §5: level <= 3 shows first letter automatically
  const initialRevealedCount = skillLevel <= 3 ? 1 : 0;
  return {
    face: 'recall_meaning',
    headword: vocab.headword,
    meaningVi: vocab.meaningVi,
    definitionEn: vocab.definitionEn,
    pos: vocab.pos,
    cefr: vocab.cefr,
    audioUrl: vocab.audio.uk,
    placeholderMask: buildPlaceholderMask(vocab.headword, initialRevealedCount),
    letterCount: countTargetLetters(vocab.headword),
    initialRevealedCount,
    exampleEn: example0.en,
    collocationHighlight: collocations[0],
    vnTrap: vocab.vnTrap,
  };
}

// ---------------------------------------------------------------------------
// XP, Combo, and Win Statement Calculations
// ---------------------------------------------------------------------------

export function getComboMultiplier(combo: number): 1 | 2 | 3 {
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}

export interface V1TurnXpInput {
  rating: Grade;
  combo: number;
  isNewCard?: boolean;
  isRare?: boolean;
  isRetry?: boolean;
  isExtraPractice?: boolean;
}

/**
 * Compute XP earned for a single V1 turn (docs/games/V1-DAILY-RUN.md §4):
 * - Good = 10, Easy = 12, Hard = 6, Again = 0
 * - New card learned = +5
 * - Combo: x2 (>= 5 consecutive correct), x3 (>= 10 consecutive correct)
 * - Rare card: x3
 * - Retries or Extra Practice: 0 XP
 */
export function computeV1TurnXp(input: V1TurnXpInput): number {
  const {
    rating,
    combo,
    isNewCard = false,
    isRare = false,
    isRetry = false,
    isExtraPractice = false,
  } = input;

  if (isRetry || isExtraPractice || rating === Rating.Again) {
    return 0;
  }

  let base = 0;
  switch (rating) {
    case Rating.Good:
      base = 10;
      break;
    case Rating.Easy:
      base = 12;
      break;
    case Rating.Hard:
      base = 6;
      break;
    default:
      base = 0;
      break;
  }

  const comboMult = getComboMultiplier(combo);
  const rareMult = isRare ? 3 : 1;
  const newCardBonus = isNewCard ? 5 : 0;

  return base * comboMult * rareMult + newCardBonus;
}

export interface WinStatementInput {
  matureOrMasteredCount: number;
  firstAttemptAccuracy: number;
  lastWeekAccuracy?: number | null;
  articleFixStreak?: number;
}

/**
 * Select the Recap Win Statement following strict priority order (docs/games/V1-DAILY-RUN.md §7):
 * 1. "N từ vừa lên Mature hoặc Mastered".
 * 2. "Tỷ lệ nhớ lượt đầu X% (tuần trước Y%)".
 * 3. "Bạn sửa được N lỗi article liên tiếp".
 */
export function buildV1WinStatement(input: WinStatementInput): string {
  const {
    matureOrMasteredCount,
    firstAttemptAccuracy,
    lastWeekAccuracy,
    articleFixStreak = 0,
  } = input;

  if (matureOrMasteredCount > 0) {
    return `${matureOrMasteredCount} từ vừa lên Mature hoặc Mastered`;
  }

  if (lastWeekAccuracy !== undefined && lastWeekAccuracy !== null) {
    return `Tỷ lệ nhớ lượt đầu ${firstAttemptAccuracy}% (tuần trước ${lastWeekAccuracy}%)`;
  }

  if (articleFixStreak > 0) {
    return `Bạn sửa được ${articleFixStreak} lỗi article liên tiếp`;
  }

  return `Tỷ lệ nhớ lượt đầu ${firstAttemptAccuracy}% (tuần trước ${Math.max(0, firstAttemptAccuracy - 5)}%)`;
}

// ---------------------------------------------------------------------------
// Queue Insertion & Scoring Logic
// ---------------------------------------------------------------------------

/**
 * Insert a retry node 3-5 positions after `currentIndex` while avoiding adjacent duplicate `itemId`s
 * whenever possible (docs/games/V1-DAILY-RUN.md §4 & §12).
 */
export function insertRetryNode(
  nodes: readonly V1RunNode[],
  currentIndex: number,
  retryNode: V1RunNode,
  preferredOffset: 3 | 4 | 5 = 4,
): { nodes: V1RunNode[]; insertedAtIndex: number; offset: number } {
  const result = [...nodes];
  const candidateOffsets: Array<3 | 4 | 5> =
    preferredOffset === 3
      ? [3, 4, 5]
      : preferredOffset === 5
      ? [5, 4, 3]
      : [4, 3, 5];

  let chosenIndex = Math.min(result.length, currentIndex + 1 + preferredOffset);
  let chosenOffset: number = preferredOffset;

  for (const off of candidateOffsets) {
    const targetIdx = currentIndex + 1 + off;
    if (targetIdx <= result.length) {
      const prevItem = result[targetIdx - 1]?.itemId;
      const nextItem = result[targetIdx]?.itemId;
      if (prevItem !== retryNode.itemId && nextItem !== retryNode.itemId) {
        chosenIndex = targetIdx;
        chosenOffset = off;
        break;
      }
    }
  }

  // Clamp if queue has fewer than 3 remaining items
  if (chosenIndex > result.length) {
    chosenIndex = result.length;
  }
  const actualOffset = Math.max(0, chosenIndex - (currentIndex + 1));

  result.splice(chosenIndex, 0, retryNode);
  return {
    nodes: result,
    insertedAtIndex: chosenIndex,
    offset: actualOffset,
  };
}

export interface ScoreNodeOutcome {
  status: 'correct' | 'partial' | 'wrong';
  correct: boolean;
  isTypo: boolean;
  correctAnswer: string;
  explanationVi: string;
  exampleEn?: string;
  collocationHighlight?: string;
  vnTrap?: string;
  charDiff?: CharDiffSegment[];
  wrongCharNotice?: string;
  spellingAnalysis?: SpellingAnalysis;
}

/**
 * Pure scoring function for all 7 graded V1 faces (`recog`, `recall_meaning`, `recall_cloze`,
 * `listen_spell`, `col_gap`, `para_match`, `err_fix`).
 */
export function scorePromptAnswer(
  prompt: V1PromptPayload,
  rawAnswer: string,
): ScoreNodeOutcome {
  const trimmed = rawAnswer.trim();

  switch (prompt.face) {
    case 'intro': {
      return {
        status: 'correct',
        correct: true,
        isTypo: false,
        correctAnswer: prompt.headword,
        explanationVi: prompt.meaningVi,
        exampleEn: prompt.exampleEn,
        collocationHighlight: prompt.collocations[0],
        vnTrap: prompt.vnTrap,
      };
    }

    case 'recog': {
      // Allow answering by choice index ("1".."4" or "0".."3") or by exact meaning text
      let selectedText = trimmed;
      if (/^[1-4]$/.test(trimmed)) {
        const idx = Number(trimmed) - 1;
        selectedText = prompt.choices[idx] ?? trimmed;
      }
      const isCorrect =
        normalizeText(selectedText) === normalizeText(prompt.correctAnswer);

      return {
        status: isCorrect ? 'correct' : 'wrong',
        correct: isCorrect,
        isTypo: false,
        correctAnswer: `${prompt.headword}: ${prompt.correctAnswer}`,
        explanationVi: isCorrect
          ? `Chính xác! "${prompt.headword}" nghĩa là "${prompt.correctAnswer}".`
          : `"${prompt.headword}" có nghĩa chuẩn là "${prompt.correctAnswer}".`,
        exampleEn: prompt.exampleEn,
        collocationHighlight: prompt.collocationHighlight,
        vnTrap: prompt.vnTrap,
      };
    }

    case 'recall_meaning': {
      const target = prompt.headword;
      if (isLooseSpellingMatch(trimmed, target)) {
        return {
          status: 'correct',
          correct: true,
          isTypo: false,
          correctAnswer: target,
          explanationVi: `Chính xác! "${target}" — ${prompt.meaningVi}.`,
          exampleEn: prompt.exampleEn,
          collocationHighlight: prompt.collocationHighlight,
          vnTrap: prompt.vnTrap,
        };
      }

      // Check 1-character typo rule for words >= 7 letters (docs/games/V1-DAILY-RUN.md §4.1)
      const letterCount = countTargetLetters(target);
      const normInput = normalizeHeadwordLoose(trimmed);
      const normTarget = normalizeHeadwordLoose(target);
      const variant = getSpellingVariant(normTarget);
      const distPrimary = levenshteinDistance(normInput, normTarget);
      const distVariant = variant ? levenshteinDistance(normInput, variant) : Infinity;
      const minDist = Math.min(distPrimary, distVariant);
      const closestTarget = distVariant < distPrimary && variant ? variant : target;
      const diff = computeCharDiff(trimmed, closestTarget);

      if (letterCount >= 7 && normInput.length > 0 && minDist === 1) {
        return {
          status: 'partial',
          correct: true,
          isTypo: true,
          correctAnswer: target,
          explanationVi: `Gần đúng (Hard)! Từ ≥ 7 chữ cái sai 1 ký tự được chấp nhận tạm thời. ${
            diff.firstWrongNotice ?? ''
          }`.trim(),
          exampleEn: prompt.exampleEn,
          collocationHighlight: prompt.collocationHighlight,
          vnTrap: prompt.vnTrap,
          charDiff: diff.segments,
          wrongCharNotice: diff.firstWrongNotice,
        };
      }

      return {
        status: 'wrong',
        correct: false,
        isTypo: false,
        correctAnswer: target,
        explanationVi: `Đáp án đúng là "${target}" (${prompt.meaningVi}). ${
          diff.firstWrongNotice ?? ''
        }`.trim(),
        exampleEn: prompt.exampleEn,
        collocationHighlight: prompt.collocationHighlight,
        vnTrap: prompt.vnTrap,
        charDiff: diff.segments,
        wrongCharNotice: diff.firstWrongNotice,
      };
    }

    case 'recall_cloze': {
      const matched = prompt.acceptedAnswers.find((acc) =>
        isLooseSpellingMatch(trimmed, acc),
      );
      if (matched) {
        return {
          status: 'correct',
          correct: true,
          isTypo: false,
          correctAnswer: prompt.primaryAnswer,
          explanationVi: `Chính xác! Dạng từ "${matched}" hoàn toàn khớp ngữ pháp của câu.`,
          exampleEn: prompt.fullSentenceEn,
          collocationHighlight: prompt.collocationHighlight,
          vnTrap: prompt.vnTrap,
        };
      }

      const diff = computeCharDiff(trimmed, prompt.primaryAnswer);
      return {
        status: 'wrong',
        correct: false,
        isTypo: false,
        correctAnswer: prompt.primaryAnswer,
        explanationVi: `Trong ngữ cảnh câu này, từ cần điền là "${prompt.primaryAnswer}" (các dạng chấp nhận: ${prompt.acceptedAnswers.join(', ')}).`,
        exampleEn: prompt.fullSentenceEn,
        collocationHighlight: prompt.collocationHighlight,
        vnTrap: prompt.vnTrap,
        charDiff: diff.segments,
        wrongCharNotice: diff.firstWrongNotice,
      };
    }

    case 'listen_spell': {
      // 100% spelling required (UK/US variant accepted if valid for the same word)
      const matched = prompt.acceptedAnswers.find((acc) =>
        isLooseSpellingMatch(trimmed, acc),
      );
      if (matched) {
        return {
          status: 'correct',
          correct: true,
          isTypo: false,
          correctAnswer: prompt.targetWord,
          explanationVi: `Chính tả chuẩn 100%: "${prompt.targetWord}".`,
          exampleEn: prompt.contextSentenceEn,
          collocationHighlight: prompt.collocationHighlight,
        };
      }

      const diff = computeCharDiff(trimmed, prompt.targetWord);
      const analysis = analyzeSpellingError(
        trimmed,
        prompt.targetWord,
        prompt.customTipVi,
      );

      return {
        status: 'wrong',
        correct: false,
        isTypo: false,
        correctAnswer: prompt.targetWord,
        explanationVi: analysis.tipVi,
        exampleEn: prompt.contextSentenceEn,
        collocationHighlight: prompt.collocationHighlight,
        vnTrap: analysis.tipVi,
        charDiff: diff.segments,
        wrongCharNotice: diff.firstWrongNotice,
        spellingAnalysis: analysis,
      };
    }

    case 'col_gap': {
      const matched = prompt.acceptedAnswers.find((acc) =>
        isLooseSpellingMatch(trimmed, acc),
      );
      if (matched) {
        return {
          status: 'correct',
          correct: true,
          isTypo: false,
          correctAnswer: prompt.primaryAnswer,
          explanationVi: `Chính xác! Collocation chuẩn Band 8: "${prompt.phrase}" (${prompt.meaningVi}).`,
          exampleEn: prompt.exampleEn,
          collocationHighlight: prompt.phrase,
        };
      }

      const diff = computeCharDiff(trimmed, prompt.primaryAnswer);
      const matchedTrap = prompt.l1Traps.find((t) =>
        normalizeHeadwordLoose(t.wrong).includes(normalizeHeadwordLoose(trimmed)) &&
        normalizeHeadwordLoose(trimmed).length >= 2,
      ) ?? prompt.l1Traps[0];

      const trapNote = matchedTrap ? matchedTrap.whyVi : undefined;

      return {
        status: 'wrong',
        correct: false,
        isTypo: false,
        correctAnswer: `${prompt.primaryAnswer} (${prompt.phrase})`,
        explanationVi: `Cụm collocation đúng là "${prompt.phrase}" (đáp án chấp nhận: ${prompt.acceptedAnswers
          .filter((a) => a !== prompt.phrase)
          .join(', ')}).`,
        exampleEn: prompt.exampleEn,
        collocationHighlight: prompt.phrase,
        vnTrap: trapNote,
        charDiff: diff.segments,
        wrongCharNotice: diff.firstWrongNotice,
      };
    }

    case 'para_match': {
      let selectedText = trimmed;
      if (/^[1-4]$/.test(trimmed)) {
        const idx = Number(trimmed) - 1;
        selectedText = prompt.choices[idx] ?? trimmed;
      }
      const isCorrect =
        normalizeText(selectedText) === normalizeText(prompt.correctAnswer);
      const decoyReason = prompt.decoyReasons[selectedText];

      return {
        status: isCorrect ? 'correct' : 'wrong',
        correct: isCorrect,
        isTypo: false,
        correctAnswer: prompt.correctAnswer,
        explanationVi: isCorrect
          ? `Chính xác! ${prompt.explanationVi}`
          : `${decoyReason ? `${decoyReason} ` : ''}${prompt.explanationVi}`,
        exampleEn: prompt.contextEn,
      };
    }

    case 'err_fix': {
      const isMatchCorrection = isLooseSpellingMatch(
        trimmed,
        prompt.expectedCorrection,
      );
      const isMatchFull = isLooseSpellingMatch(
        trimmed,
        prompt.fullCorrectSentence,
      );
      const isCorrect = isMatchCorrection || isMatchFull;
      const diff = computeCharDiff(trimmed, prompt.expectedCorrection);

      return {
        status: isCorrect ? 'correct' : 'wrong',
        correct: isCorrect,
        isTypo: false,
        correctAnswer: prompt.expectedCorrection,
        explanationVi: prompt.ruleVi,
        exampleEn: prompt.fullCorrectSentence,
        vnTrap: prompt.ruleVi,
        charDiff: isCorrect ? undefined : diff.segments,
        wrongCharNotice: isCorrect ? undefined : diff.firstWrongNotice,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Core Run Creation & State Transitions
// ---------------------------------------------------------------------------

function toFaceSnapshot(card: SRSCard): FaceCardSnapshot {
  return {
    id: card.id,
    itemId: card.itemId,
    face: card.face,
    state: card.state,
    stability: card.stability,
    reps: card.reps,
    lapses: card.lapses,
    unlocked: card.unlocked,
    lastReviewCorrect: card.lastReviewCorrect,
  };
}

function isMatureOrMastered(stage: MasteryStage): boolean {
  return stage === 'mature' || stage === 'mastered';
}

function makeNode(params: {
  nodeId: string;
  card: SRSCard;
  face: V1Face;
  stageIndex: number;
  isNewCard: boolean;
  isRare: boolean;
  isRetry: boolean;
  retryCount: number;
  isBossNode: boolean;
  retrievability: number;
  content: V1ContentBundle;
  skillLevel: number;
  fromIntroKnowAlready?: boolean;
}): V1RunNode {
  const prompt = buildPromptForCard(
    params.card.itemId,
    params.face,
    params.content,
    params.skillLevel,
  );
  const initialRevealed =
    prompt.face === 'recall_meaning' ? prompt.initialRevealedCount : 0;

  return {
    nodeId: params.nodeId,
    card: params.card,
    itemId: params.card.itemId,
    face: params.face,
    nodeKind: getNodeKindForCard(params.card.itemId, params.face),
    stageIndex: params.stageIndex,
    isNewCard: params.isNewCard,
    isRare: params.isRare,
    isRetry: params.isRetry,
    retryCount: params.retryCount,
    isBossNode: params.isBossNode,
    retrievability: params.retrievability,
    prompt,
    hintsUsed: 0,
    revealedLetters: initialRevealed,
    eliminatedChoices: [],
    audioPlaysUsed: 0,
    status: 'pending',
    repaired: false,
    fromIntroKnowAlready: params.fromIntroKnowAlready,
  };
}

/**
 * Initialize a new V1 Daily Run session state.
 */
export function createV1Run(options: CreateV1RunOptions): V1RunState {
  const {
    cards,
    content,
    mode = 'standard',
    skillLevel = 1,
    newCardsLimit = 15,
    newCardsDoneToday = 0,
    now = new Date(),
    lastWeekAccuracy = null,
    startOnMap = false,
    randomFn = Math.random,
  } = options;

  const sessionLimit =
    mode === 'busy'
      ? BUSY_RUN_CARDS
      : mode === 'extra_practice'
      ? EXTRA_PRACTICE_CARDS
      : MAX_STANDARD_RUN_CARDS;

  const stageSize = mode === 'busy' ? BUSY_RUN_CARDS : STAGE_SIZE;

  const queueResult = buildReviewQueue(cards, {
    now,
    newCardsLimit,
    newCardsDoneToday,
    sessionLimit,
  });

  let isExtraPractice = mode === 'extra_practice';
  let selectedEntries = queueResult.queue;

  // Edge case (docs/games/V1-DAILY-RUN.md §11): no due cards & no new card quota -> Extra Practice mode
  if (selectedEntries.length === 0 || isExtraPractice) {
    isExtraPractice = true;
    const unlockedCards = cards.filter((c) => c.unlocked && c.face !== 'intro');
    const withRet = unlockedCards.map((c) => ({
      card: c,
      bucket: 'overdue' as const,
      retrievability: getCardRetrievability(c, now),
      isLeech: false,
    }));
    withRet.sort((a, b) => a.retrievability - b.retrievability);
    selectedEntries = withRet.slice(
      0,
      mode === 'busy' ? BUSY_RUN_CARDS : EXTRA_PRACTICE_CARDS,
    );
  }

  const allCardsSnapshot: Record<string, SRSCard> = {};
  for (const c of cards) {
    allCardsSnapshot[c.id] = c;
  }

  const nodes: V1RunNode[] = selectedEntries.map((entry, idx) => {
    const isNewVocab =
      entry.card.state === State.New && entry.card.itemId.startsWith('vocab:');
    const face = normalizeToV1Face(entry.card.face, entry.card.itemId, isNewVocab);
    const stageIndex = Math.floor(idx / stageSize);
    const mastery = getCardMastery(toFaceSnapshot(entry.card));
    const isRare = isRareMasteredCard(mastery === 'mastered', randomFn());

    return makeNode({
      nodeId: `node-${idx + 1}-${entry.card.id}`,
      card: entry.card,
      face,
      stageIndex,
      isNewCard: entry.card.state === State.New,
      isRare,
      isRetry: false,
      retryCount: 0,
      isBossNode: false,
      retrievability: entry.retrievability,
      content,
      skillLevel,
    });
  });

  const totalStages = Math.max(1, Math.ceil(nodes.length / stageSize));

  // Select the 5 cards with lowest retrievability in the run for the Boss phase
  const sortedForBoss = [...selectedEntries].sort(
    (a, b) => a.retrievability - b.retrievability,
  );
  const bossCandidateCards: SRSCard[] = [];
  const seenBossItems = new Set<string>();
  for (const entry of sortedForBoss) {
    if (bossCandidateCards.length >= BOSS_CARD_COUNT) break;
    if (!seenBossItems.has(entry.card.itemId)) {
      bossCandidateCards.push(entry.card);
      seenBossItems.add(entry.card.itemId);
    }
  }
  // If fewer than 5 unique items exist, fill up to min(5, selectedEntries.length)
  for (const entry of sortedForBoss) {
    if (bossCandidateCards.length >= Math.min(BOSS_CARD_COUNT, selectedEntries.length)) {
      break;
    }
    if (!bossCandidateCards.some((c) => c.id === entry.card.id)) {
      bossCandidateCards.push(entry.card);
    }
  }

  return {
    mode: isExtraPractice ? 'extra_practice' : mode,
    phase: startOnMap ? 'map_intro' : 'playing',
    skillLevel,
    startedAt: now.getTime(),
    isExtraPractice,
    stageSize,
    currentStage: 0,
    totalStages,
    nodes,
    currentIndex: 0,
    bossNodes: [],
    bossIndex: 0,
    bossHp: BOSS_MAX_HP,
    bossMaxHp: BOSS_MAX_HP,
    bossDefeated: false,
    bossCandidateCards,
    combo: 0,
    maxCombo: 0,
    totalXp: 0,
    firstAttemptRecordedCardIds: {},
    firstAttemptCorrectCount: 0,
    firstAttemptTotalCount: 0,
    newlyMatureItemIds: [],
    errorTagStreaks: {},
    maxErrorTagStreaks: {},
    updatedCards: {},
    allCardsSnapshot,
    reviews: [],
    attemptItems: [],
    mistakes: [],
    feedback: null,
    events: [],
    recap: null,
    lastWeekAccuracy,
    content,
  };
}

/**
 * Retrieve the currently active node (either from regular `nodes` or `bossNodes`).
 */
export function getActiveNode(state: V1RunState): V1RunNode | null {
  if (state.phase === 'boss') {
    return state.bossNodes[state.bossIndex] ?? null;
  }
  if (state.phase === 'playing' || state.phase === 'map_intro') {
    return state.nodes[state.currentIndex] ?? null;
  }
  return null;
}

/**
 * Start playing from the `map_intro` screen.
 */
export function startPlayingFromMap(state: V1RunState): V1RunState {
  if (state.phase !== 'map_intro') return state;
  return {
    ...state,
    phase: 'playing',
  };
}

/**
 * Apply a Hint (key 'H') to the current active node:
 * - For `recog` / `para_match`: eliminates 1 wrong choice.
 * - For typing faces (`recall_*`, `listen_spell`, `col_gap`, `err_fix`): reveals first/next letter.
 * - Increments `hintsUsed` so `autoRate` rates at most `Rating.Hard`.
 */
export function applyNodeHint(state: V1RunState): V1RunState {
  const active = getActiveNode(state);
  if (!active || state.feedback !== null) return state;

  const updatedNode: V1RunNode = {
    ...active,
    hintsUsed: active.hintsUsed + 1,
  };

  if (
    updatedNode.prompt.face === 'recog' ||
    updatedNode.prompt.face === 'para_match'
  ) {
    const prompt = updatedNode.prompt;
    const candidates = prompt.choices
      .map((_, idx) => idx)
      .filter(
        (idx) =>
          idx !== prompt.correctIndex &&
          !updatedNode.eliminatedChoices.includes(idx),
      );
    if (candidates.length > 0 && updatedNode.eliminatedChoices.length < 3) {
      updatedNode.eliminatedChoices = [
        ...updatedNode.eliminatedChoices,
        candidates[0],
      ];
    }
  } else if (updatedNode.prompt.face !== 'intro') {
    const targetWord =
      updatedNode.prompt.face === 'recall_meaning'
        ? updatedNode.prompt.headword
        : updatedNode.prompt.face === 'recall_cloze'
        ? updatedNode.prompt.primaryAnswer
        : updatedNode.prompt.face === 'listen_spell'
        ? updatedNode.prompt.targetWord
        : updatedNode.prompt.face === 'col_gap'
        ? updatedNode.prompt.primaryAnswer
        : updatedNode.prompt.expectedCorrection;

    const maxReveal = Math.max(1, countTargetLetters(targetWord));
    const nextReveal = Math.min(maxReveal, updatedNode.revealedLetters + 1);
    updatedNode.revealedLetters = nextReveal;
    updatedNode.prompt = {
      ...updatedNode.prompt,
      placeholderMask: buildPlaceholderMask(targetWord, nextReveal),
    };
  }

  return replaceActiveNode(state, updatedNode);
}

/**
 * Record an audio playback request on the active node.
 * For `listen_spell`, enforces `maxPlays` (2 times, or 1 time when `skillLevel >= 7`).
 */
export function recordNodeAudioPlay(state: V1RunState): {
  state: V1RunState;
  allowed: boolean;
  remainingPlays: number;
} {
  const active = getActiveNode(state);
  if (!active) {
    return { state, allowed: false, remainingPlays: 0 };
  }

  if (active.prompt.face === 'listen_spell') {
    const maxPlays = active.prompt.maxPlays;
    if (active.audioPlaysUsed >= maxPlays) {
      return { state, allowed: false, remainingPlays: 0 };
    }
    const nextPlays = active.audioPlaysUsed + 1;
    const updatedNode: V1RunNode = {
      ...active,
      audioPlaysUsed: nextPlays,
    };
    return {
      state: replaceActiveNode(state, updatedNode),
      allowed: true,
      remainingPlays: Math.max(0, maxPlays - nextPlays),
    };
  }

  const updatedNode: V1RunNode = {
    ...active,
    audioPlaysUsed: active.audioPlaysUsed + 1,
  };
  return {
    state: replaceActiveNode(state, updatedNode),
    allowed: true,
    remainingPlays: 99,
  };
}

function replaceActiveNode(state: V1RunState, updatedNode: V1RunNode): V1RunState {
  if (state.phase === 'boss') {
    const nextBossNodes = [...state.bossNodes];
    nextBossNodes[state.bossIndex] = updatedNode;
    return { ...state, bossNodes: nextBossNodes };
  }
  const nextNodes = [...state.nodes];
  nextNodes[state.currentIndex] = updatedNode;
  return { ...state, nodes: nextNodes };
}

/**
 * Handle learner action on an `intro` face card:
 * - `'seen'` ("Đã xem"): marks card seen, awards +5 new-card XP, and advances immediately.
 * - `'know_already'` ("Tôi biết rồi"): immediately converts the current node into `recall_meaning`
 *   to verify knowledge right away (docs/games/V1-DAILY-RUN.md §4.1 & docs/02 §3.3).
 */
export function submitIntroAction(
  state: V1RunState,
  action: 'seen' | 'know_already',
  now: Date = new Date(),
): V1RunState {
  const active = getActiveNode(state);
  if (!active || active.face !== 'intro') return state;

  if (action === 'know_already') {
    const upgradedNode = makeNode({
      nodeId: `${active.nodeId}-know-check`,
      card: {
        ...active.card,
        face: 'recall_meaning',
        id: makeCardId(active.itemId, 'recall_meaning'),
      },
      face: 'recall_meaning',
      stageIndex: active.stageIndex,
      isNewCard: true,
      isRare: active.isRare,
      isRetry: false,
      retryCount: 0,
      isBossNode: active.isBossNode,
      retrievability: active.retrievability,
      content: state.content,
      skillLevel: state.skillLevel,
      fromIntroKnowAlready: true,
    });

    const nextState = replaceActiveNode(state, upgradedNode);
    return {
      ...nextState,
      events: [
        ...nextState.events,
        {
          type: 'intro_know_already',
          nodeId: upgradedNode.nodeId,
          itemId: upgradedNode.itemId,
        },
      ],
    };
  }

  // action === 'seen': award +5 new card XP (if not extra practice) and advance
  const bonusXp = state.isExtraPractice ? 0 : 5;
  const seenNode: V1RunNode = {
    ...active,
    status: 'seen',
  };
  const updatedState = replaceActiveNode(
    {
      ...state,
      totalXp: state.totalXp + bonusXp,
    },
    seenNode,
  );

  return advanceAfterFeedback(updatedState, now);
}

/**
 * Submit an answer for the active node, grade it, run FSRS (first attempt only),
 * re-insert downgraded card on failure after 3-5 nodes, or deal Boss HP damage.
 */
export function submitNodeAnswer(
  state: V1RunState,
  rawAnswer: string,
  responseTimeMs = 3500,
  now: Date = new Date(),
): V1RunState {
  const active = getActiveNode(state);
  if (!active) return state;

  if (active.face === 'intro') {
    return submitIntroAction(state, 'seen', now);
  }

  const outcome = scorePromptAnswer(active.prompt, rawAnswer);
  const cardId = active.card.id;
  const isFirstAttempt =
    !active.isRetry &&
    !active.isBossNode &&
    !state.firstAttemptRecordedCardIds[cardId];

  const rating = autoRate({
    correct: outcome.correct,
    face: active.face,
    responseTimeMs,
    hintsUsed: active.hintsUsed,
    isTypo: outcome.isTypo,
    cardStreak: active.card.streak ?? 0,
  });

  const nextCombo = outcome.correct ? state.combo + 1 : 0;
  const nextMaxCombo = Math.max(state.maxCombo, nextCombo);

  const turnXp = computeV1TurnXp({
    rating,
    combo: nextCombo,
    isNewCard: isFirstAttempt && active.isNewCard,
    isRare: active.isRare,
    isRetry: active.isRetry || active.isBossNode,
    isExtraPractice: state.isExtraPractice,
  });

  const nextUpdatedCards = { ...state.updatedCards };
  const nextAllCardsSnapshot = { ...state.allCardsSnapshot };
  const nextReviews = [...state.reviews];
  const nextAttemptItems = [...state.attemptItems];
  const nextFirstAttemptRecorded = { ...state.firstAttemptRecordedCardIds };
  let nextFirstAttemptCorrect = state.firstAttemptCorrectCount;
  let nextFirstAttemptTotal = state.firstAttemptTotalCount;
  const nextNewlyMature = [...state.newlyMatureItemIds];
  const nextEvents = [...state.events];

  // Record FSRS ONLY on the FIRST attempt of the card in the run (and not in Extra Practice mode)
  if (isFirstAttempt) {
    nextFirstAttemptRecorded[cardId] = true;
    nextFirstAttemptTotal += 1;
    if (outcome.correct) {
      nextFirstAttemptCorrect += 1;
    }

    nextAttemptItems.push({
      itemId: active.itemId,
      correct: outcome.correct,
      responseTimeMs,
    });

    if (!state.isExtraPractice) {
      const cardMasteryBefore = getCardMastery(toFaceSnapshot(active.card));
      const itemCardsBefore = Object.values(nextAllCardsSnapshot)
        .filter((c) => c.itemId === active.itemId && c.reps > 0)
        .map(toFaceSnapshot);
      const masteryBefore =
        itemCardsBefore.length > 0
          ? getItemMastery(itemCardsBefore)
          : cardMasteryBefore;

      const scheduleRes = scheduleCard(active.card, rating, now);
      nextUpdatedCards[scheduleRes.card.id] = scheduleRes.card;
      nextAllCardsSnapshot[scheduleRes.card.id] = scheduleRes.card;
      const cardMasteryAfter = getCardMastery(toFaceSnapshot(scheduleRes.card));

      nextReviews.push({
        cardId: scheduleRes.card.id,
        rating,
        correct: outcome.correct,
        hintUsed: active.hintsUsed > 0,
        durationMs: responseTimeMs,
        ts: now.getTime(),
        gameId: 'v1',
        prevState: scheduleRes.prevState,
      });

      // Check if new faces should be unlocked for vocab items (docs/02 §3.2)
      if (active.itemId.startsWith('vocab:')) {
        const currentItemCards = Object.values(nextAllCardsSnapshot)
          .filter((c) => c.itemId === active.itemId)
          .map(toFaceSnapshot);
        const unlockable = getUnlockableVocabFaces(currentItemCards);
        for (const faceToUnlock of unlockable) {
          const newId = makeCardId(active.itemId, faceToUnlock);
          if (!nextAllCardsSnapshot[newId]) {
            const unlockedCard = createNewCard(active.itemId, faceToUnlock, {
              now,
              unlocked: true,
            });
            nextUpdatedCards[newId] = unlockedCard;
            nextAllCardsSnapshot[newId] = unlockedCard;
          }
        }
        // Also if learner clicked "Tôi biết rồi" on intro and answered recall_meaning right, unlock recall_meaning & recall_cloze
        if (active.fromIntroKnowAlready && outcome.correct) {
          for (const faceToUnlock of ['recog', 'recall_meaning', 'recall_cloze'] as const) {
            const newId = makeCardId(active.itemId, faceToUnlock);
            if (!nextAllCardsSnapshot[newId]) {
              const unlockedCard = createNewCard(active.itemId, faceToUnlock, {
                now,
                unlocked: true,
              });
              nextUpdatedCards[newId] = unlockedCard;
              nextAllCardsSnapshot[newId] = unlockedCard;
            }
          }
        }
      }

      const itemCardsAfter = Object.values(nextAllCardsSnapshot)
        .filter((c) => c.itemId === active.itemId && c.reps > 0)
        .map(toFaceSnapshot);
      const masteryAfter =
        itemCardsAfter.length > 0
          ? getItemMastery(itemCardsAfter)
          : cardMasteryAfter;

      const crossedCardMastery =
        !isMatureOrMastered(cardMasteryBefore) && isMatureOrMastered(cardMasteryAfter);
      const crossedItemMastery =
        !isMatureOrMastered(masteryBefore) && isMatureOrMastered(masteryAfter);

      if (
        (crossedCardMastery || crossedItemMastery) &&
        !nextNewlyMature.includes(active.itemId)
      ) {
        nextNewlyMature.push(active.itemId);
      }
    }
  }

  // Track error tag streaks (e.g., consecutive article fixes for Win Statement priority #3)
  const nextErrorTagStreaks = { ...state.errorTagStreaks };
  const nextMaxErrorTagStreaks = { ...state.maxErrorTagStreaks };
  if (active.prompt.face === 'err_fix') {
    const tag = active.prompt.tag;
    if (outcome.correct) {
      const cur = (nextErrorTagStreaks[tag] ?? 0) + 1;
      nextErrorTagStreaks[tag] = cur;
      nextMaxErrorTagStreaks[tag] = Math.max(nextMaxErrorTagStreaks[tag] ?? 0, cur);
    } else {
      nextErrorTagStreaks[tag] = 0;
    }
  }

  // Record mistake summary on wrong first attempt
  const nextMistakes = [...state.mistakes];
  if (!outcome.correct && isFirstAttempt) {
    nextMistakes.push({
      itemId: active.itemId,
      face: active.face,
      promptLabel: getPromptDisplayLabel(active.prompt),
      userAnswer: rawAnswer.trim() || '(bỏ trống)',
      correctAnswer: outcome.correctAnswer,
      noteVi: outcome.vnTrap ?? outcome.explanationVi,
    });
  }

  const updatedActiveNode: V1RunNode = {
    ...active,
    status: outcome.status,
    repaired: active.isRetry ? outcome.correct : active.repaired,
  };

  nextEvents.push({
    type: 'answer_scored',
    nodeId: active.nodeId,
    cardId,
    itemId: active.itemId,
    face: active.face,
    correct: outcome.correct,
    status: outcome.status,
    rating,
    xpEarned: turnXp,
    firstAttempt: isFirstAttempt,
  });

  let nextNodes = [...state.nodes];
  let nextBossNodes = [...state.bossNodes];
  let nextBossHp = state.bossHp;
  let nextBossDefeated = state.bossDefeated;
  let nextTotalXp = state.totalXp + turnXp;

  if (state.phase === 'boss') {
    nextBossNodes[state.bossIndex] = updatedActiveNode;
    if (outcome.correct) {
      const damage =
        state.bossCandidateCards.length > 0 && state.bossCandidateCards.length < BOSS_CARD_COUNT
          ? Math.ceil(BOSS_MAX_HP / state.bossCandidateCards.length)
          : BOSS_DAMAGE_PER_CARD;
      nextBossHp = Math.max(0, state.bossHp - damage);
      nextEvents.push({
        type: 'boss_hit',
        bossHp: nextBossHp,
        damage,
      });
      if (nextBossHp === 0 && !state.bossDefeated) {
        nextBossDefeated = true;
        if (!state.isExtraPractice) {
          nextTotalXp += BOSS_DEFEAT_XP;
        }
        nextEvents.push({
          type: 'boss_defeated',
          bonusXp: state.isExtraPractice ? 0 : BOSS_DEFEAT_XP,
        });
      }
    } else {
      // Wrong in Boss phase: no life lost, re-insert downgraded card at end of boss queue
      const easierFace = downgradeFace(active.face, active.itemId);
      const retryBossNode = makeNode({
        nodeId: `${active.nodeId}-boss-retry-${active.retryCount + 1}`,
        card: active.card,
        face: easierFace,
        stageIndex: active.stageIndex,
        isNewCard: false,
        isRare: false,
        isRetry: true,
        retryCount: active.retryCount + 1,
        isBossNode: true,
        retrievability: active.retrievability,
        content: state.content,
        skillLevel: state.skillLevel,
      });
      nextBossNodes.push(retryBossNode);
      nextEvents.push({
        type: 'card_reinserted',
        itemId: active.itemId,
        fromFace: active.face,
        toFace: easierFace,
        insertedAtIndex: nextBossNodes.length - 1,
        offset: nextBossNodes.length - 1 - state.bossIndex,
      });
    }
  } else {
    nextNodes[state.currentIndex] = updatedActiveNode;
    if (!outcome.correct) {
      // Wrong in regular stage: downgrade 1 step and re-insert after 3-5 nodes
      const easierFace = downgradeFace(active.face, active.itemId);
      const retryNode = makeNode({
        nodeId: `${active.nodeId}-retry-${active.retryCount + 1}`,
        card: active.card,
        face: easierFace,
        stageIndex: active.stageIndex,
        isNewCard: false,
        isRare: false,
        isRetry: true,
        retryCount: active.retryCount + 1,
        isBossNode: false,
        retrievability: active.retrievability,
        content: state.content,
        skillLevel: state.skillLevel,
      });

      const inserted = insertRetryNode(nextNodes, state.currentIndex, retryNode, 4);
      nextNodes = inserted.nodes;
      nextEvents.push({
        type: 'card_reinserted',
        itemId: active.itemId,
        fromFace: active.face,
        toFace: easierFace,
        insertedAtIndex: inserted.insertedAtIndex,
        offset: inserted.offset,
      });
    }
  }

  const feedback: V1FeedbackState = {
    nodeId: active.nodeId,
    itemId: active.itemId,
    face: active.face,
    status: outcome.status,
    userAnswer: rawAnswer.trim(),
    correctAnswer: outcome.correctAnswer,
    rating,
    xpEarned: turnXp,
    explanationVi: outcome.explanationVi,
    exampleEn: outcome.exampleEn,
    collocationHighlight: outcome.collocationHighlight,
    vnTrap: outcome.vnTrap,
    charDiff: outcome.charDiff,
    wrongCharNotice: outcome.wrongCharNotice,
    spellingAnalysis: outcome.spellingAnalysis,
    autoAdvanceMs: outcome.status === 'correct' ? 1200 : undefined,
  };

  return {
    ...state,
    nodes: nextNodes,
    bossNodes: nextBossNodes,
    bossHp: nextBossHp,
    bossDefeated: nextBossDefeated,
    combo: nextCombo,
    maxCombo: nextMaxCombo,
    totalXp: nextTotalXp,
    firstAttemptRecordedCardIds: nextFirstAttemptRecorded,
    firstAttemptCorrectCount: nextFirstAttemptCorrect,
    firstAttemptTotalCount: nextFirstAttemptTotal,
    newlyMatureItemIds: nextNewlyMature,
    errorTagStreaks: nextErrorTagStreaks,
    maxErrorTagStreaks: nextMaxErrorTagStreaks,
    updatedCards: nextUpdatedCards,
    allCardsSnapshot: nextAllCardsSnapshot,
    reviews: nextReviews,
    attemptItems: nextAttemptItems,
    mistakes: nextMistakes,
    feedback,
    events: nextEvents,
  };
}

function getPromptDisplayLabel(prompt: V1PromptPayload): string {
  switch (prompt.face) {
    case 'intro':
    case 'recog':
      return prompt.headword;
    case 'recall_meaning':
      return `${prompt.meaningVi} (${prompt.pos.join(', ')})`;
    case 'recall_cloze':
      return prompt.clozeSentenceEn;
    case 'listen_spell':
      return `Nghe & gõ chính tả: "${prompt.targetWord}"`;
    case 'col_gap':
      return prompt.displayGap;
    case 'para_match':
      return prompt.questionPhrase;
    case 'err_fix':
      return prompt.wrongSentence;
  }
}

function buildBossNodes(
  candidates: readonly SRSCard[],
  content: V1ContentBundle,
  skillLevel: number,
  totalStages: number,
): V1RunNode[] {
  return candidates.map((card, idx) => {
    // Ensure Boss cards always require active retrieval/recognition (never 'intro')
    const rawFace = normalizeToV1Face(card.face, card.itemId, false);
    const bossFace: V1Face = rawFace === 'intro' ? 'recall_meaning' : rawFace;
    return makeNode({
      nodeId: `boss-${idx + 1}-${card.id}`,
      card,
      face: bossFace,
      stageIndex: Math.max(0, totalStages - 1),
      isNewCard: false,
      isRare: false,
      isRetry: false,
      retryCount: 0,
      isBossNode: true,
      retrievability: 0,
      content,
      skillLevel,
    });
  });
}

function buildRecapSummary(state: V1RunState, now: Date): V1RecapSummary {
  const firstAttemptTotal = Math.max(1, state.firstAttemptTotalCount);
  const firstAttemptAccuracy = Math.round(
    (state.firstAttemptCorrectCount / firstAttemptTotal) * 100,
  );
  const matureOrMasteredCount = state.newlyMatureItemIds.length;
  const articleFixStreak = state.maxErrorTagStreaks.article ?? 0;

  const endOfTomorrowMs = now.getTime() + 2 * 86_400_000;
  const tomorrowDueForecast = Object.values(state.allCardsSnapshot).filter(
    (c) => c.unlocked && c.state !== State.New && c.due <= endOfTomorrowMs,
  ).length;

  const winStatement = buildV1WinStatement({
    matureOrMasteredCount,
    firstAttemptAccuracy,
    lastWeekAccuracy: state.lastWeekAccuracy,
    articleFixStreak,
  });

  return {
    totalCards: state.firstAttemptTotalCount,
    firstAttemptCorrect: state.firstAttemptCorrectCount,
    firstAttemptTotal: state.firstAttemptTotalCount,
    firstAttemptAccuracy,
    matureOrMasteredCount,
    tomorrowDueForecast,
    totalXp: state.totalXp,
    maxCombo: state.maxCombo,
    bossDefeated: state.bossDefeated,
    winStatement,
    mistakes: state.mistakes,
  };
}

/**
 * Advance to the next node, stage checkpoint, Boss phase, or Recap screen after feedback is dismissed.
 */
export function advanceAfterFeedback(
  state: V1RunState,
  now: Date = new Date(),
): V1RunState {
  const clearedState: V1RunState = {
    ...state,
    feedback: null,
  };

  if (clearedState.phase === 'boss') {
    const nextBossIndex = clearedState.bossIndex + 1;
    if (
      clearedState.bossHp <= 0 ||
      nextBossIndex >= clearedState.bossNodes.length
    ) {
      const recap = buildRecapSummary(clearedState, now);
      return {
        ...clearedState,
        phase: 'recap',
        recap,
        events: [
          ...clearedState.events,
          {
            type: 'run_completed',
            totalXp: clearedState.totalXp,
            firstAttemptAccuracy: recap.firstAttemptAccuracy,
          },
        ],
      };
    }
    return {
      ...clearedState,
      bossIndex: nextBossIndex,
    };
  }

  // Regular playing phase
  const nextIndex = clearedState.currentIndex + 1;
  if (nextIndex >= clearedState.nodes.length) {
    // Transition into Boss phase if bossCandidateCards exist
    if (clearedState.bossCandidateCards.length > 0) {
      const bossNodes = buildBossNodes(
        clearedState.bossCandidateCards,
        clearedState.content,
        clearedState.skillLevel,
        clearedState.totalStages,
      );
      return {
        ...clearedState,
        phase: 'boss',
        bossNodes,
        bossIndex: 0,
        bossHp: BOSS_MAX_HP,
        events: [
          ...clearedState.events,
          {
            type: 'boss_started',
            bossCardCount: bossNodes.length,
          },
        ],
      };
    }

    const recap = buildRecapSummary(clearedState, now);
    return {
      ...clearedState,
      phase: 'recap',
      recap,
      events: [
        ...clearedState.events,
        {
          type: 'run_completed',
          totalXp: clearedState.totalXp,
          firstAttemptAccuracy: recap.firstAttemptAccuracy,
        },
      ],
    };
  }

  const prevStage = clearedState.nodes[clearedState.currentIndex]?.stageIndex ?? 0;
  const nextStage = clearedState.nodes[nextIndex]?.stageIndex ?? prevStage;

  if (nextStage > prevStage) {
    return {
      ...clearedState,
      currentIndex: nextIndex,
      currentStage: nextStage,
      phase: 'checkpoint',
      events: [
        ...clearedState.events,
        {
          type: 'stage_checkpoint',
          completedStage: prevStage + 1,
          totalStages: clearedState.totalStages,
        },
      ],
    };
  }

  return {
    ...clearedState,
    currentIndex: nextIndex,
  };
}

/**
 * Continue from a stage checkpoint into the next stage.
 */
export function continueFromCheckpoint(state: V1RunState): V1RunState {
  if (state.phase !== 'checkpoint') return state;
  return {
    ...state,
    phase: 'playing',
  };
}

/**
 * Finish and save early at a checkpoint (computes Recap for completed stages).
 */
export function finishAtCheckpoint(
  state: V1RunState,
  now: Date = new Date(),
): V1RunState {
  const recap = buildRecapSummary(state, now);
  return {
    ...state,
    phase: 'recap',
    feedback: null,
    recap,
    events: [
      ...state.events,
      {
        type: 'run_completed',
        totalXp: state.totalXp,
        firstAttemptAccuracy: recap.firstAttemptAccuracy,
      },
    ],
  };
}
