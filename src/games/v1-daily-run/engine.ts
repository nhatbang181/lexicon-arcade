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
import { alignTranscript } from '../../core/text/align';
import { scoreListeningAnswer } from '../../core/scoring/listeningAnswer';
import type {
  AttemptItem,
  AttemptRecord,
  ReviewRecord,
  UserItemAudioClip,
  UserItemKind,
} from '../../core/storage/db';
import type { V1ContentBundle, V1ListeningRef, V1ReadingRef } from './content';
import { localDayKey, placeCorrectSeeded, seededRng, shuffleSeeded } from './seed';

export type { V1ContentBundle } from './content';

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
  // Mặt mới cho thẻ do game khác tạo (G1 / V1-2)
  'tfng_retry',
  'head_retry',
  'ltrap_replay',
  'dict_full',
  'err_user',
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

export interface TfngRetryPromptPayload {
  face: 'tfng_retry';
  qType: 'tfng' | 'ynng';
  passageTitle: string;
  paragraphLabel: string;
  paragraphText: string;
  statement: string;
  choices: string[];
  correctIndex: number;
  correctAnswer: string;
  evidenceQuote?: string;
  explanationVi: string;
}

export interface HeadRetryPromptPayload {
  face: 'head_retry';
  passageTitle: string;
  paragraphLabel: string;
  paragraphText: string;
  choices: string[];
  correctIndex: number;
  correctAnswer: string;
  decoyReasons: Record<string, string>;
  evidenceQuote?: string;
  explanationVi: string;
}

export interface LtrapReplayPromptPayload {
  face: 'ltrap_replay';
  questionPrompt: string;
  acceptedAnswers: string[];
  audioUrl?: string;
  clipStart: number;
  clipEnd: number;
  transcriptLine?: string;
  trapType?: string;
  decoy?: string;
  trapExplanationVi: string;
  placeholderMask: string;
  letterCount: number;
}

export interface DictFullPromptPayload {
  face: 'dict_full';
  text: string;
  acceptedVariants: string[];
  audioUrl?: string;
  level: number;
  tipsVi: string[];
  maxPlays: number;
}

export interface ErrUserPromptPayload {
  face: 'err_user';
  userKind: UserItemKind;
  /** Nhãn hiển thị phía trên: "Lỗi từng gặp", "Cụm kiểu Việt"… */
  labelVi: string;
  front: string;
  back: string;
  acceptedAnswers: string[];
  noteVi: string;
  audioClip?: UserItemAudioClip;
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
  | ErrFixPromptPayload
  | TfngRetryPromptPayload
  | HeadRetryPromptPayload
  | LtrapReplayPromptPayload
  | DictFullPromptPayload
  | ErrUserPromptPayload;

/** Prompt có danh sách lựa chọn bấm/phím 1–4. */
export type V1ChoicePrompt =
  | RecogPromptPayload
  | ParaMatchPromptPayload
  | TfngRetryPromptPayload
  | HeadRetryPromptPayload;

export function isChoicePrompt(prompt: V1PromptPayload): prompt is V1ChoicePrompt {
  return (
    prompt.face === 'recog' ||
    prompt.face === 'para_match' ||
    prompt.face === 'tfng_retry' ||
    prompt.face === 'head_retry'
  );
}

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
      type: 'intro_seen';
      nodeId: string;
      itemId: string;
      /** Vị trí node `recog` được chèn lại trong cùng run (V1-1). */
      insertedAtIndex: number;
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
  /** Thẻ đáng lẽ vào hàng đợi nhưng không dựng được nội dung (V1-2): bị bỏ, caller ghi `missing_item`. */
  missingItems: Array<{ cardId: string; itemId: string; face: string }>;
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
  if (
    face === 'listen_spell' ||
    face === 'dict_full' ||
    face === 'ltrap_replay' ||
    itemId.startsWith('dict:') ||
    itemId.startsWith('ltrap:')
  ) {
    return 'listen';
  }
  if (face === 'col_gap' || itemId.startsWith('col:')) return 'collocation';
  if (
    face === 'para_match' ||
    face === 'tfng_retry' ||
    face === 'head_retry' ||
    itemId.startsWith('para:') ||
    itemId.startsWith('tfng:') ||
    itemId.startsWith('head:')
  ) {
    return 'paraphrase';
  }
  if (face === 'err_fix' || face === 'err_user' || itemId.startsWith('err:')) return 'error';
  return 'vocab';
}

interface ContentIndex {
  vocab: Map<string, VocabItem>;
  col: Map<string, CollocationItem>;
  para: Map<string, ParaphraseItem>;
  err: Map<string, ErrorItem>;
  dict: Map<string, DictationItem>;
}

const contentIndexCache = new WeakMap<V1ContentBundle, ContentIndex>();

function getContentIndex(content: V1ContentBundle): ContentIndex {
  const cached = contentIndexCache.get(content);
  if (cached) return cached;
  const index: ContentIndex = {
    vocab: new Map(content.vocab.map((v) => [v.id, v])),
    col: new Map(content.collocations.map((c) => [c.id, c])),
    para: new Map(content.paraphrases.map((p) => [p.id, p])),
    err: new Map(content.errors.map((e) => [e.id, e])),
    dict: new Map(content.dictations.map((d) => [d.id, d])),
  };
  contentIndexCache.set(content, index);
  return index;
}

/**
 * Thẻ vocab mới chưa xem giới thiệu thì hiện `intro` đúng 1 lần (V1-1). Mặt khác (`recall_*`,
 * `listen_spell`) hiện thẳng mặt của nó; thẻ `recog` đã `introSeenAt` hoặc đã có lịch thì không intro nữa.
 */
export function shouldShowIntro(card: SRSCard): boolean {
  return (
    card.itemId.startsWith('vocab:') &&
    card.face === 'recog' &&
    card.state === State.New &&
    !card.introSeenAt
  );
}

function vocabFaceFor(face: Face): V1Face {
  switch (face) {
    case 'recall_meaning':
    case 'recall_cloze':
    case 'listen_spell':
      return face;
    case 'use':
      return 'recall_cloze';
    default:
      return 'recog';
  }
}

function userItemOf(content: V1ContentBundle, itemId: string) {
  return content.extras?.userItems[itemId];
}

function l1ColTrapSource(itemId: string, idx: ContentIndex): CollocationItem | null {
  if (!itemId.startsWith('err:l1col_')) return null;
  const col = idx.col.get(`col:${itemId.slice('err:l1col_'.length)}`);
  return col && col.l1Traps.length > 0 ? col : null;
}

/**
 * Quyết định thẻ SRS này hiển thị bằng mặt V1 nào. Trả `null` khi không dựng được nội dung thật
 * (không tìm thấy item): thẻ bị bỏ khỏi run và caller ghi `eventRepo.log('missing_item')`.
 * KHÔNG BAO GIỜ rơi về `content.X[0]` (V1-2).
 */
export function resolveV1Face(
  card: SRSCard,
  content: V1ContentBundle,
  options: { allowIntro?: boolean } = {},
): V1Face | null {
  const { allowIntro = true } = options;
  const id = card.itemId;
  const idx = getContentIndex(content);
  const extras = content.extras;

  if (id.startsWith('vocab:')) {
    if (!idx.vocab.has(id)) return null;
    if (allowIntro && shouldShowIntro(card)) return 'intro';
    return vocabFaceFor(card.face);
  }
  if (id.startsWith('col:')) {
    if (idx.col.has(id)) return 'col_gap';
    return userItemOf(content, id) ? 'err_user' : null;
  }
  if (id.startsWith('para:')) {
    const para = idx.para.get(id);
    // Item "not_equivalent" (V3 Level 4) không có cụm paraphrase đúng để chọn → không làm thẻ V1.
    return para && para.relation === 'equivalent' ? 'para_match' : null;
  }
  if (id.startsWith('err:')) {
    if (idx.err.has(id)) return 'err_fix';
    if (l1ColTrapSource(id, idx)) return 'err_user';
    return userItemOf(content, id) ? 'err_user' : null;
  }
  if (id.startsWith('dict:')) {
    if (idx.dict.has(id)) return card.face === 'dict_full' ? 'dict_full' : 'listen_spell';
    return userItemOf(content, id) ? 'err_user' : null;
  }
  if (id.startsWith('tfng:')) {
    const ref = extras?.reading[id];
    if (ref && ref.kind === 'tfng') return 'tfng_retry';
    return userItemOf(content, id) ? 'err_user' : null;
  }
  if (id.startsWith('head:')) {
    const ref = extras?.reading[id];
    if (ref && ref.kind === 'head') return 'head_retry';
    return userItemOf(content, id) ? 'err_user' : null;
  }
  if (id.startsWith('ltrap:')) {
    if (extras?.listening[id]) return 'ltrap_replay';
    return userItemOf(content, id) ? 'err_user' : null;
  }
  return null;
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

function pickRecogDistractors(
  vocab: VocabItem,
  content: V1ContentBundle,
  rng: () => number,
): string[] {
  const len = vocab.meaningVi.length;
  const lo = len * 0.6;
  const hi = len * 1.4;
  const pos = vocab.pos[0];
  const topics = new Set<string>(vocab.topics ?? []);
  // Bậc ưu tiên: cùng loại từ + cùng chủ đề + độ dài ±40% → ... → bất kỳ (V1-4)
  const tiers: string[][] = [[], [], [], []];
  for (const v of content.vocab) {
    if (v.id === vocab.id || v.meaningVi === vocab.meaningVi) continue;
    const lenOk = v.meaningVi.length >= lo && v.meaningVi.length <= hi;
    const samePos = v.pos[0] === pos;
    const sharesTopic = (v.topics ?? []).some((t) => topics.has(t));
    if (lenOk && samePos && sharesTopic) tiers[0].push(v.meaningVi);
    else if (lenOk && samePos) tiers[1].push(v.meaningVi);
    else if (lenOk) tiers[2].push(v.meaningVi);
    else tiers[3].push(v.meaningVi);
  }
  const out: string[] = [];
  const used = new Set<string>([vocab.meaningVi]);
  for (const tier of tiers) {
    for (const meaning of shuffleSeeded(tier, rng)) {
      if (out.length >= 3) break;
      if (used.has(meaning)) continue;
      used.add(meaning);
      out.push(meaning);
    }
    if (out.length >= 3) break;
  }
  return out;
}

function splitAlternatives(text: string): string[] {
  const parts = text
    .split(/\s*\|\s*|\s*;\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text.trim()];
}

function buildReadingChoicePrompt(
  ref: V1ReadingRef,
  rng: () => number,
): TfngRetryPromptPayload | HeadRetryPromptPayload | null {
  const correct = ref.correctAnswer;
  if (ref.kind === 'tfng') {
    const choices = ref.options.length >= 2 ? ref.options : ref.qType === 'ynng'
      ? ['YES', 'NO', 'NOT GIVEN']
      : ['TRUE', 'FALSE', 'NOT GIVEN'];
    const correctIndex = choices.findIndex((c) => normalizeText(c) === normalizeText(correct));
    if (correctIndex < 0) return null;
    return {
      face: 'tfng_retry',
      qType: ref.qType === 'ynng' ? 'ynng' : 'tfng',
      passageTitle: ref.passageTitle,
      paragraphLabel: ref.paragraphLabel,
      paragraphText: ref.paragraphText,
      statement: ref.statement,
      choices,
      correctIndex,
      correctAnswer: choices[correctIndex],
      evidenceQuote: ref.evidenceQuote,
      explanationVi: ref.explanationVi,
    };
  }
  const distractors = shuffleSeeded(
    ref.options.filter((o) => normalizeText(o) !== normalizeText(correct)),
    rng,
  ).slice(0, 3);
  if (distractors.length < 1) return null;
  const placed = placeCorrectSeeded(correct, distractors, rng);
  return {
    face: 'head_retry',
    passageTitle: ref.passageTitle,
    paragraphLabel: ref.paragraphLabel,
    paragraphText: ref.paragraphText,
    choices: placed.choices,
    correctIndex: placed.correctIndex,
    correctAnswer: correct,
    decoyReasons: ref.decoyReasons ?? {},
    evidenceQuote: ref.evidenceQuote,
    explanationVi: ref.explanationVi,
  };
}

function buildErrUserPrompt(
  itemId: string,
  content: V1ContentBundle,
  rng: () => number,
): ErrUserPromptPayload | null {
  const idx = getContentIndex(content);

  const l1col = l1ColTrapSource(itemId, idx);
  if (l1col) {
    const trap = l1col.l1Traps[Math.floor(rng() * l1col.l1Traps.length)];
    const gap = l1col.gaps[0];
    const variants = [gap.primary, ...gap.answers].map((a) =>
      gap.display.includes('___') ? gap.display.replace('___', a) : a,
    );
    const accepted = Array.from(new Set([l1col.phrase, ...variants]));
    return {
      face: 'err_user',
      userKind: 'collocation',
      labelVi: 'Cụm kiểu Việt → cụm tự nhiên',
      front: trap.wrong,
      back: l1col.phrase,
      acceptedAnswers: accepted,
      noteVi: trap.whyVi,
      placeholderMask: buildPlaceholderMask(l1col.phrase, 0),
      letterCount: countTargetLetters(l1col.phrase),
    };
  }

  const item = userItemOf(content, itemId);
  if (!item) return null;
  const labelByKind: Record<UserItemKind, string> = {
    error: 'Lỗi bạn từng mắc: sửa lại cho đúng',
    collocation: 'Cụm bạn từng dùng chưa tự nhiên',
    tfng: 'Câu hỏi Reading cần ôn lại',
    head: 'Câu hỏi Reading cần ôn lại',
    ltrap: 'Bẫy Listening cần ôn lại',
    dict: 'Chép chính tả cần ôn lại',
    other: 'Ôn lại',
  };
  return {
    face: 'err_user',
    userKind: item.kind,
    labelVi: labelByKind[item.kind] ?? 'Ôn lại',
    front: item.front,
    back: item.back,
    acceptedAnswers: splitAlternatives(item.back),
    noteVi: item.noteVi,
    audioClip: item.audioClip,
    placeholderMask: buildPlaceholderMask(splitAlternatives(item.back)[0], 0),
    letterCount: countTargetLetters(splitAlternatives(item.back)[0]),
  };
}

export interface BuildPromptOptions {
  /** Khoá seed: thường `${cardId}|${reps}|${ngày}` (+ lần retry) → nhiễu và vị trí đáp án đổi theo lần ôn. */
  seedKey?: string;
}

/**
 * Build the prompt payload for a specific itemId and V1Face.
 * Trả `null` nếu không tìm thấy item thật (không bao giờ rơi về phần tử đầu danh sách, V1-2).
 */
export function buildPromptForCard(
  itemId: string,
  face: V1Face,
  content: V1ContentBundle,
  skillLevel = 1,
  options: BuildPromptOptions = {},
): V1PromptPayload | null {
  const idx = getContentIndex(content);
  const seedKey = options.seedKey ?? itemId;
  const rng = seededRng(`${seedKey}|${face}`);

  switch (face) {
    case 'col_gap': {
      const col = idx.col.get(itemId);
      if (!col) return null;
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

    case 'para_match': {
      const para = idx.para.get(itemId);
      if (!para) return null;
      const decoyTexts = Array.from(new Set(para.decoys.map((d) => d.text)));
      if (decoyTexts.length < 3) {
        const spare = shuffleSeeded(
          content.paraphrases
            .filter((p) => p.id !== para.id && p.relation === 'equivalent')
            .map((p) => p.target.text),
          rng,
        );
        for (const text of spare) {
          if (decoyTexts.length >= 3) break;
          if (text !== para.target.text && !decoyTexts.includes(text)) decoyTexts.push(text);
        }
      }
      const placed = placeCorrectSeeded(
        para.target.text,
        shuffleSeeded(decoyTexts.slice(0, 3), rng),
        rng,
      );
      const decoyReasons: Record<string, string> = {};
      for (const d of para.decoys) {
        decoyReasons[d.text] = d.whyVi;
      }
      return {
        face: 'para_match',
        questionPhrase: para.questionPhrase,
        contextEn: para.context,
        choices: placed.choices,
        correctIndex: placed.correctIndex,
        correctAnswer: para.target.text,
        decoyReasons,
        explanationVi: para.explanationVi,
      };
    }

    case 'err_fix': {
      const err = idx.err.get(itemId);
      if (!err) return null;
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

    case 'err_user':
      return buildErrUserPrompt(itemId, content, rng);

    case 'tfng_retry':
    case 'head_retry': {
      const ref = content.extras?.reading[itemId];
      return ref ? buildReadingChoicePrompt(ref, rng) : null;
    }

    case 'ltrap_replay': {
      const ref: V1ListeningRef | undefined = content.extras?.listening[itemId];
      if (!ref) return null;
      return {
        face: 'ltrap_replay',
        questionPrompt: ref.questionPrompt,
        acceptedAnswers: ref.acceptedAnswers,
        audioUrl: ref.audioPath,
        clipStart: ref.clipStart,
        clipEnd: ref.clipEnd,
        transcriptLine: ref.transcriptLine,
        trapType: ref.trapType,
        decoy: ref.decoy,
        trapExplanationVi: ref.trapExplanationVi,
        placeholderMask: buildPlaceholderMask(ref.acceptedAnswers[0] ?? '', 0),
        letterCount: countTargetLetters(ref.acceptedAnswers[0] ?? ''),
      };
    }

    case 'dict_full': {
      const dict = idx.dict.get(itemId);
      if (!dict) return null;
      return {
        face: 'dict_full',
        text: dict.text,
        acceptedVariants: Array.from(new Set([dict.text, ...(dict.acceptedVariants ?? [])])),
        audioUrl: dict.audio,
        level: dict.level,
        tipsVi: dict.focus.map((f) => f.tipVi).slice(0, 3),
        maxPlays: skillLevel >= 7 ? 2 : 3,
      };
    }

    default:
      break;
  }

  // Dictation item + mặt listen_spell: chép 1 từ trọng tâm của câu
  if (face === 'listen_spell' && itemId.startsWith('dict:')) {
    const dict = idx.dict.get(itemId);
    if (!dict) return null;
    const tokens = dict.text
      .replace(/[.,!?;:"]/g, '')
      .split(/\s+/)
      .filter(Boolean);
    const focusEntry = dict.focus[0];
    const targetWord =
      (focusEntry && tokens[focusEntry.tokenIndex]) ||
      tokens.reduce((longest, w) => (w.length > longest.length ? w : longest), tokens[0] ?? '');
    if (!targetWord) return null;
    const variant = getSpellingVariant(targetWord.toLowerCase());
    const accepted = Array.from(
      new Set([targetWord.toLowerCase(), ...(variant ? [variant] : [])]),
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

  // Vocab item -> intro, recog, recall_meaning, recall_cloze, listen_spell
  const vocab = idx.vocab.get(itemId);
  if (!vocab) return null;
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
    const distractors = pickRecogDistractors(vocab, content, rng);
    if (distractors.length < 1) return null;
    const placed = placeCorrectSeeded(vocab.meaningVi, distractors, rng);

    return {
      face: 'recog',
      headword: vocab.headword,
      ipaUk: vocab.ipa.uk,
      pos: vocab.pos,
      cefr: vocab.cefr,
      audioUrl: vocab.audio.uk,
      choices: placed.choices,
      correctIndex: placed.correctIndex,
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

  if (face !== 'recall_meaning') return null;

  // recall_meaning
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
  /** Combo dài nhất của run (dùng cho câu fallback khi chưa có dữ liệu tuần trước). */
  maxCombo?: number;
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
    maxCombo = 0,
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

  // Không có dữ liệu tuần trước thì KHÔNG bịa so sánh (V1-6).
  return `Tỷ lệ nhớ lượt đầu ${firstAttemptAccuracy}% · combo dài nhất ${maxCombo}`;
}

const WEEK_MS = 7 * 86_400_000;

/**
 * Tỷ lệ đúng lượt đầu của V1 trong tuần liền trước tuần này (V1-6): các attempt đã kết thúc có
 * `startedAt` ∈ [now − 14 ngày, now − 7 ngày). Không có dữ liệu → `null`.
 */
export function computeLastWeekAccuracy(
  attempts: ReadonlyArray<Pick<AttemptRecord, 'gameId' | 'startedAt' | 'score' | 'total' | 'status'>>,
  now: Date = new Date(),
): number | null {
  const to = now.getTime() - WEEK_MS;
  const from = to - WEEK_MS;
  let score = 0;
  let total = 0;
  for (const a of attempts) {
    if (a.gameId !== 'v1' || a.status === 'in_progress') continue;
    if (a.startedAt < from || a.startedAt >= to) continue;
    score += Math.max(0, a.score);
    total += Math.max(0, a.total);
  }
  if (total <= 0) return null;
  return Math.round((score / total) * 100);
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
      // Chỉ gắn lời giải thích "kiểu Việt" khi chính cụm người học gõ khớp một bẫy (V1-10)
      const typedLoose = normalizeHeadwordLoose(trimmed);
      const matchedTrap =
        typedLoose.length >= 2
          ? prompt.l1Traps.find((t) =>
              ` ${normalizeHeadwordLoose(t.wrong)} `.includes(` ${typedLoose} `),
            )
          : undefined;

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

    case 'tfng_retry':
    case 'head_retry': {
      let selectedText = trimmed;
      if (/^[1-4]$/.test(trimmed)) {
        selectedText = prompt.choices[Number(trimmed) - 1] ?? trimmed;
      }
      const isCorrect = normalizeText(selectedText) === normalizeText(prompt.correctAnswer);
      const decoyReason =
        prompt.face === 'head_retry' ? prompt.decoyReasons[selectedText] : undefined;
      const quote = prompt.evidenceQuote;
      return {
        status: isCorrect ? 'correct' : 'wrong',
        correct: isCorrect,
        isTypo: false,
        correctAnswer: prompt.correctAnswer,
        explanationVi: isCorrect
          ? `Chính xác! ${prompt.explanationVi}`
          : `${decoyReason ? `${decoyReason} ` : ''}${prompt.explanationVi}`,
        exampleEn: quote,
      };
    }

    case 'ltrap_replay': {
      const res = scoreListeningAnswer(trimmed, prompt.acceptedAnswers);
      const primary = prompt.acceptedAnswers[0] ?? '';
      return {
        status: res.correct ? 'correct' : 'wrong',
        correct: res.correct,
        isTypo: false,
        correctAnswer: primary,
        explanationVi: res.correct
          ? `Chính xác! ${prompt.trapExplanationVi}`
          : `${res.feedbackVi ? `${res.feedbackVi} ` : ''}${prompt.trapExplanationVi}`,
        exampleEn: prompt.transcriptLine,
        vnTrap: res.correct ? undefined : prompt.trapExplanationVi,
      };
    }

    case 'dict_full': {
      let best = alignTranscript(prompt.acceptedVariants[0] ?? prompt.text, trimmed);
      for (const variant of prompt.acceptedVariants.slice(1)) {
        const candidate = alignTranscript(variant, trimmed);
        if (candidate.wer < best.wer) best = candidate;
      }
      const fullMatch = trimmed.length > 0 && best.wer === 0;
      // Sai ≤ 1 từ trong câu ≥ 7 từ: chấp nhận ở mức Hard (giống luật gõ sai 1 ký tự)
      const wordCount = best.tokens.filter((t) => t.status !== 'extra').length;
      const nearMatch = !fullMatch && trimmed.length > 0 && wordCount >= 7 && best.wer <= 1 / wordCount + 1e-9;
      const problems = best.tokens
        .filter((t) => t.status !== 'correct')
        .slice(0, 4)
        .map((t) => {
          if (t.status === 'missing') return `thiếu "${t.expected}"`;
          if (t.status === 'extra') return `thừa "${t.actual}"`;
          return `"${t.actual ?? ''}" → "${t.expected ?? ''}"`;
        });
      return {
        status: fullMatch ? 'correct' : nearMatch ? 'partial' : 'wrong',
        correct: fullMatch || nearMatch,
        isTypo: nearMatch,
        correctAnswer: prompt.text,
        explanationVi: fullMatch
          ? 'Chép đúng toàn câu.'
          : `Lỗi: ${problems.join('; ') || 'chưa nhập gì'}.${
              prompt.tipsVi.length > 0 ? ` Mẹo: ${prompt.tipsVi[0]}` : ''
            }`,
        exampleEn: prompt.text,
      };
    }

    case 'err_user': {
      const matched = prompt.acceptedAnswers.find((acc) => isLooseSpellingMatch(trimmed, acc));
      const isCorrect = Boolean(matched);
      const primary = prompt.acceptedAnswers[0] ?? prompt.back;
      const diff = primary.length <= 60 ? computeCharDiff(trimmed, primary) : null;
      return {
        status: isCorrect ? 'correct' : 'wrong',
        correct: isCorrect,
        isTypo: false,
        correctAnswer: primary,
        explanationVi: prompt.noteVi,
        exampleEn: prompt.front,
        vnTrap: isCorrect ? undefined : prompt.noteVi,
        charDiff: isCorrect || !diff ? undefined : diff.segments,
        wrongCharNotice: isCorrect || !diff ? undefined : diff.firstWrongNotice,
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
  /** Ngày bắt đầu run – một phần của seed nhiễu/vị trí đáp án (V1-4, V1-5). */
  seedDay: string;
  fromIntroKnowAlready?: boolean;
}): V1RunNode | null {
  const prompt = buildPromptForCard(
    params.card.itemId,
    params.face,
    params.content,
    params.skillLevel,
    {
      seedKey: `${params.card.id}|${params.card.reps}|${params.seedDay}|r${params.retryCount}`,
    },
  );
  if (!prompt) return null;
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

  // Thẻ không dựng được nội dung thật bị loại trước khi xếp hàng đợi (V1-2: không hiện item sai).
  const missingItems: V1RunState['missingItems'] = [];
  const nowMs = now.getTime();
  const renderable: SRSCard[] = [];
  for (const card of cards) {
    if (resolveV1Face(card, content, { allowIntro: false }) !== null) {
      renderable.push(card);
    } else if (card.unlocked && card.face !== 'intro' && (card.state === State.New || card.due <= nowMs)) {
      missingItems.push({ cardId: card.id, itemId: card.itemId, face: card.face });
    }
  }

  const queueResult = buildReviewQueue(renderable, {
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
    // Ôn thêm chỉ lấy thẻ đã học (state ≠ New): thẻ mới thuộc hạn mức thẻ mới trong ngày
    const unlockedCards = renderable.filter(
      (c) => c.unlocked && c.face !== 'intro' && c.state !== State.New,
    );
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

  const seedDay = localDayKey(now);
  const builtNodes: Array<{ node: V1RunNode; entry: (typeof selectedEntries)[number] }> = [];
  for (const entry of selectedEntries) {
    const face = resolveV1Face(entry.card, content);
    const idx = builtNodes.length;
    const mastery = getCardMastery(toFaceSnapshot(entry.card));
    const isRare = isRareMasteredCard(mastery === 'mastered', randomFn());
    const node = face
      ? makeNode({
          nodeId: `node-${idx + 1}-${entry.card.id}`,
          card: entry.card,
          face,
          stageIndex: Math.floor(idx / stageSize),
          isNewCard: entry.card.state === State.New,
          isRare,
          isRetry: false,
          retryCount: 0,
          isBossNode: false,
          retrievability: entry.retrievability,
          content,
          skillLevel,
          seedDay,
        })
      : null;
    if (node) {
      builtNodes.push({ node, entry });
    } else {
      missingItems.push({ cardId: entry.card.id, itemId: entry.card.itemId, face: entry.card.face });
    }
  }
  const nodes: V1RunNode[] = builtNodes.map((b) => b.node);
  selectedEntries = builtNodes.map((b) => b.entry);

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
    missingItems,
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

  // Chép cả câu: không có chữ nào để gợi ý
  if (active.prompt.face === 'dict_full') return state;

  const updatedNode: V1RunNode = {
    ...active,
    hintsUsed: active.hintsUsed + 1,
  };
  const prompt = updatedNode.prompt;

  if (isChoicePrompt(prompt)) {
    // Luôn chừa lại ít nhất 2 lựa chọn
    const maxEliminated = Math.max(1, prompt.choices.length - 2);
    const candidates = prompt.choices
      .map((_, idx) => idx)
      .filter(
        (idx) =>
          idx !== prompt.correctIndex &&
          !updatedNode.eliminatedChoices.includes(idx),
      );
    if (candidates.length > 0 && updatedNode.eliminatedChoices.length < maxEliminated) {
      updatedNode.eliminatedChoices = [
        ...updatedNode.eliminatedChoices,
        candidates[0],
      ];
    }
  } else if (prompt.face !== 'intro') {
    const targetWord = getTypedTargetText(prompt);
    if (targetWord) {
      const maxReveal = Math.max(1, countTargetLetters(targetWord));
      const nextReveal = Math.min(maxReveal, updatedNode.revealedLetters + 1);
      updatedNode.revealedLetters = nextReveal;
      updatedNode.prompt = {
        ...prompt,
        placeholderMask: buildPlaceholderMask(targetWord, nextReveal),
      } as V1PromptPayload;
    }
  }

  return replaceActiveNode(state, updatedNode);
}

/** Chuỗi đáp án mà ô gõ nhắm tới (dùng cho gợi ý lộ chữ). `null` nếu mặt không gõ từ/cụm. */
export function getTypedTargetText(prompt: V1PromptPayload): string | null {
  switch (prompt.face) {
    case 'recall_meaning':
      return prompt.headword;
    case 'recall_cloze':
    case 'col_gap':
      return prompt.primaryAnswer;
    case 'listen_spell':
      return prompt.targetWord;
    case 'err_fix':
      return prompt.expectedCorrection;
    case 'err_user':
    case 'ltrap_replay':
      return prompt.acceptedAnswers[0] ?? null;
    default:
      return null;
  }
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

  if (active.prompt.face === 'listen_spell' || active.prompt.face === 'dict_full') {
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

function seedDayOf(state: V1RunState): string {
  return localDayKey(new Date(state.startedAt));
}

/**
 * Chèn node vào sau `currentIndex` và gán `stageIndex` của node đứng ngay trước vị trí chèn,
 * để không sinh checkpoint giả giữa chặng (V1-8).
 */
function insertNodeInStage(
  nodes: readonly V1RunNode[],
  currentIndex: number,
  node: V1RunNode,
  preferredOffset: 3 | 4 | 5,
): { nodes: V1RunNode[]; insertedAtIndex: number; offset: number } {
  const inserted = insertRetryNode(nodes, currentIndex, node, preferredOffset);
  const prev = inserted.nodes[inserted.insertedAtIndex - 1];
  const stageIndex = prev?.stageIndex ?? node.stageIndex;
  inserted.nodes[inserted.insertedAtIndex] = { ...inserted.nodes[inserted.insertedAtIndex], stageIndex };
  return inserted;
}

/**
 * Handle learner action on an `intro` face card (V1-1):
 * - `'seen'` ("Đã xem"): ghi `introSeenAt` lên thẻ (không còn intro ở các run sau) và chèn ngay
 *   node `recog` của chính thẻ đó sau 3–5 node trong cùng run để từ mới đi tiếp tới gợi nhớ.
 *   Không cộng XP và không ghi FSRS ở bước này (V1-12: XP đến từ lượt gợi nhớ đúng đầu tiên).
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

  const seenCard: SRSCard = { ...active.card, introSeenAt: now.getTime() };
  const withSeenCard: V1RunState = {
    ...state,
    updatedCards: { ...state.updatedCards, [seenCard.id]: seenCard },
    allCardsSnapshot: { ...state.allCardsSnapshot, [seenCard.id]: seenCard },
  };

  if (action === 'know_already') {
    const upgradedNode = makeNode({
      nodeId: `${active.nodeId}-know-check`,
      card: {
        ...seenCard,
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
      seedDay: seedDayOf(state),
      fromIntroKnowAlready: true,
    });
    if (!upgradedNode) return state;

    const nextState = replaceActiveNode(withSeenCard, upgradedNode);
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

  // action === 'seen'
  const seenNode: V1RunNode = { ...active, card: seenCard, status: 'seen' };
  const recogNode = makeNode({
    nodeId: `${active.nodeId}-recog`,
    card: seenCard,
    face: 'recog',
    stageIndex: active.stageIndex,
    isNewCard: true,
    isRare: false,
    isRetry: false,
    retryCount: 0,
    isBossNode: false,
    retrievability: 0,
    content: state.content,
    skillLevel: state.skillLevel,
    seedDay: seedDayOf(state),
  });

  const nodes = [...withSeenCard.nodes];
  nodes[withSeenCard.currentIndex] = seenNode;
  let nextState: V1RunState = { ...withSeenCard, nodes };
  if (recogNode) {
    const inserted = insertNodeInStage(nodes, withSeenCard.currentIndex, recogNode, 3);
    nextState = {
      ...nextState,
      nodes: inserted.nodes,
      events: [
        ...nextState.events,
        {
          type: 'intro_seen',
          nodeId: active.nodeId,
          itemId: active.itemId,
          insertedAtIndex: inserted.insertedAtIndex,
        },
      ],
    };
  }

  return advanceAfterFeedback(nextState, now);
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
    face: active.face === 'err_user' ? active.card.face : active.face,
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
            // Người học đã trả lời thẻ của từ này → mặt mới mở khóa không cần intro nữa
            const unlockedCard: SRSCard = {
              ...createNewCard(active.itemId, faceToUnlock, { now, unlocked: true }),
              introSeenAt: now.getTime(),
            };
            nextUpdatedCards[newId] = unlockedCard;
            nextAllCardsSnapshot[newId] = unlockedCard;
          }
        }
        // Also if learner clicked "Tôi biết rồi" on intro and answered recall_meaning right, unlock recall_meaning & recall_cloze
        if (active.fromIntroKnowAlready && outcome.correct) {
          for (const faceToUnlock of ['recog', 'recall_meaning', 'recall_cloze'] as const) {
            const newId = makeCardId(active.itemId, faceToUnlock);
            if (!nextAllCardsSnapshot[newId]) {
              const unlockedCard: SRSCard = {
                ...createNewCard(active.itemId, faceToUnlock, { now, unlocked: true }),
                introSeenAt: now.getTime(),
              };
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
        seedDay: seedDayOf(state),
      });
      if (retryBossNode) {
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
        seedDay: seedDayOf(state),
      });

      if (retryNode) {
        const inserted = insertNodeInStage(nextNodes, state.currentIndex, retryNode, 4);
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
    case 'tfng_retry':
      return prompt.statement;
    case 'head_retry':
      return `${prompt.passageTitle} · đoạn ${prompt.paragraphLabel}`;
    case 'ltrap_replay':
      return prompt.questionPrompt;
    case 'dict_full':
      return 'Nghe & chép cả câu';
    case 'err_user':
      return prompt.front;
  }
}

function buildBossNodes(
  candidates: readonly SRSCard[],
  content: V1ContentBundle,
  skillLevel: number,
  totalStages: number,
  seedDay: string,
): V1RunNode[] {
  const nodes: V1RunNode[] = [];
  for (const card of candidates) {
    // Boss luôn là gợi nhớ/nhận diện thật, không bao giờ `intro`
    const bossFace = resolveV1Face(card, content, { allowIntro: false });
    if (!bossFace) continue;
    const node = makeNode({
      nodeId: `boss-${nodes.length + 1}-${card.id}`,
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
      seedDay,
    });
    if (node) nodes.push(node);
  }
  return nodes;
}

function buildRecapSummary(state: V1RunState, now: Date): V1RecapSummary {
  const firstAttemptTotal = Math.max(1, state.firstAttemptTotalCount);
  const firstAttemptAccuracy = Math.round(
    (state.firstAttemptCorrectCount / firstAttemptTotal) * 100,
  );
  const matureOrMasteredCount = state.newlyMatureItemIds.length;
  const articleFixStreak = state.maxErrorTagStreaks.article ?? 0;

  // Hết ngày mai theo giờ máy (V1-11), không phải now + 48h
  const endOfTomorrow = new Date(now);
  endOfTomorrow.setHours(23, 59, 59, 999);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
  const endOfTomorrowMs = endOfTomorrow.getTime();
  const tomorrowDueForecast = Object.values(state.allCardsSnapshot).filter(
    (c) => c.unlocked && c.state !== State.New && c.due <= endOfTomorrowMs,
  ).length;

  const winStatement = buildV1WinStatement({
    matureOrMasteredCount,
    firstAttemptAccuracy,
    lastWeekAccuracy: state.lastWeekAccuracy,
    articleFixStreak,
    maxCombo: state.maxCombo,
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
    const bossNodes =
      clearedState.bossCandidateCards.length > 0
        ? buildBossNodes(
            clearedState.bossCandidateCards,
            clearedState.content,
            clearedState.skillLevel,
            clearedState.totalStages,
            seedDayOf(clearedState),
          )
        : [];
    if (bossNodes.length > 0) {
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

// ---------------------------------------------------------------------------
// Persistence payload (G3, V1-7)
// ---------------------------------------------------------------------------

export interface V1ProgressPayload {
  attempt: Omit<AttemptRecord, 'id' | 'status' | 'reviewsSaved' | 'xpApplied'>;
  updatedCards: SRSCard[];
  reviews: Array<Omit<ReviewRecord, 'id'>>;
}

/**
 * Ảnh chụp tiến độ của run để ghi xuống DB: dùng cho `attemptRepo.saveProgress` (giữa phiên) và
 * `finalize` (Recap). `reviews` luôn là danh sách đầy đủ, chỉ thêm vào cuối → repo tự ghi phần mới.
 */
export function buildV1ProgressPayload(
  state: V1RunState,
  now: Date = new Date(),
): V1ProgressPayload {
  const recap = state.recap;
  return {
    attempt: {
      gameId: 'v1',
      mode: state.mode === 'busy' ? 'sprint' : 'training',
      startedAt: state.startedAt,
      endedAt: now.getTime(),
      score: recap ? recap.firstAttemptCorrect : state.firstAttemptCorrectCount,
      total: Math.max(1, recap ? recap.totalCards : state.firstAttemptTotalCount),
      xp: state.totalXp,
      items: state.attemptItems,
    },
    updatedCards: Object.values(state.updatedCards),
    reviews: state.reviews,
  };
}
