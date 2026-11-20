import type {
  ListeningEpisode,
  ListeningQType,
  ListeningQuestion,
  ListeningQuestionGroup,
  ListeningTrap,
} from '../../core/content/schemas';
import {
  scoreListeningAnswer,
  type ListeningScoreResult,
} from '../../core/scoring/listeningAnswer';
import { scoreMCQ } from '../../core/scoring/readingAnswer';
import { createNewCard, type SRSCard } from '../../core/srs/fsrsAdapter';
import { accuracyToBand } from '../../core/band/tables';
import type { AttemptItem, BandSnapshotRecord } from '../../core/storage/db';
import type { SessionSavePayload } from '../../core/storage/repos/attemptRepo';
import type { PlaybackRate } from '../../core/audio/trackPlayer';

export type L1Mode = 'training' | 'exam';
export type L1Phase = 'preview' | 'listening' | 'review' | 'debrief' | 'recap';

export type PredictionType =
  | 'number'
  | 'date'
  | 'name'
  | 'noun'
  | 'plural'
  | 'adjective';

export interface PredictionOption {
  id: PredictionType;
  labelVi: string;
}

export const PREDICTION_OPTIONS: readonly PredictionOption[] = [
  { id: 'number', labelVi: 'Số' },
  { id: 'date', labelVi: 'Ngày / Giờ' },
  { id: 'name', labelVi: 'Tên riêng' },
  { id: 'noun', labelVi: 'Danh từ' },
  { id: 'plural', labelVi: 'Số nhiều (-s)' },
  { id: 'adjective', labelVi: 'Tính từ' },
] as const;

export const LISTENING_TRAP_LABELS_VI: Record<ListeningTrap, string> = {
  self_correction: 'Tự sửa lời (self-correction)',
  changed_plan: 'Đổi kế hoạch / lịch trình',
  distractor_number: 'Số nhiễu (distractor number)',
  spelling_out: 'Đánh vần tên / mã',
  double_letter: 'Chữ cái lặp (double letter)',
  negation_shift: 'Phủ định / đổi chiều',
  option_mentioned_rejected: 'Nhắc rồi loại bỏ',
  synonym_paraphrase: 'Paraphrase đồng nghĩa',
  plural_singular: 'Số nhiều / số ít (-s)',
  word_limit: 'Vượt giới hạn từ',
  homophone_minimal_pair: 'Từ đồng âm / dễ nhầm âm',
  signpost_skip: 'Lỡ tín hiệu chuyển ý',
  map_direction: 'Bẫy phương hướng bản đồ',
};

export const ALL_LISTENING_TRAPS: readonly ListeningTrap[] = [
  'self_correction',
  'changed_plan',
  'distractor_number',
  'spelling_out',
  'double_letter',
  'negation_shift',
  'option_mentioned_rejected',
  'synonym_paraphrase',
  'plural_singular',
  'word_limit',
  'homophone_minimal_pair',
  'signpost_skip',
  'map_direction',
] as const;

export type L1ErrorCategory =
  | 'none'
  | 'no_answer'
  | 'word_limit'
  | 'spelling'
  | 'plural'
  | `trap:${ListeningTrap}`
  | 'wrong_content';

export interface L1DifficultyConfig {
  level: number;
  mode: L1Mode;
  defaultRate: PlaybackRate;
  showSignposts: boolean;
  allowPause: boolean;
  allowRewind: boolean;
  allowRateChange: boolean;
  allowPredictions: boolean;
  examLocked: boolean;
  previewSec: number;
  reviewSec: number;
  countsForBand: boolean;
}

export interface FlattenedListeningQuestion {
  group: ListeningQuestionGroup;
  question: ListeningQuestion;
  groupIndex: number;
  questionIndexInGroup: number;
}

export interface ResolvedTimestampRange {
  start: number;
  end: number;
  lineId: string;
}

export interface GradedListeningQuestion {
  qid: string;
  number: number;
  groupId: string;
  qType: ListeningQType;
  prompt: string;
  userAnswer: string;
  acceptedAnswers: string[];
  correct: boolean;
  errorCategory: L1ErrorCategory;
  primaryTrap: ListeningTrap | null;
  trapTypes: ListeningTrap[];
  explanationVi: string;
  feedbackVi: string;
  evidence: ResolvedTimestampRange;
  primaryTrapClip: ResolvedTimestampRange | null;
}

export interface SelfTrapLabelRecord {
  chosen: ListeningTrap;
  expected: ListeningTrap[];
  matched: boolean;
  xpAwarded: number;
}

export interface L1SessionState {
  episode: ListeningEpisode;
  mode: L1Mode;
  level: number;
  config: L1DifficultyConfig;
  phase: L1Phase;
  startedAt: number;
  gradedAt: number | null;
  endedAt: number | null;
  /** User predictions during preview (Training only): qid -> PredictionType */
  predictions: Record<string, PredictionType>;
  /** Raw text or choice letter answers keyed by qid */
  answers: Record<string, string>;
  /** Flagged question IDs */
  flaggedQids: string[];
  /** Currently focused question ID */
  currentQid: string;
  /** Graded results populated when entering debrief */
  results: GradedListeningQuestion[];
  /** Learner self-assigned trap labels in debrief */
  selfTrapLabels: Record<string, SelfTrapLabelRecord>;
  /** Score & XP summary */
  correctCount: number;
  totalQuestions: number;
  baseXp: number;
  bonusXp: number;
  debriefXp: number;
  totalXp: number;
}

export interface CreateL1SessionOptions {
  mode?: L1Mode;
  level?: number;
  nowMs?: number;
}

export interface L1EngineEvent {
  type:
    | 'phase_changed'
    | 'graded'
    | 'trap_labeled'
    | 'session_completed';
  phase?: L1Phase;
  correctCount?: number;
  totalQuestions?: number;
  xpDelta?: number;
  matched?: boolean;
}

export interface L1TransitionResult {
  state: L1SessionState;
  events: L1EngineEvent[];
}

export const CHOICE_QUESTION_TYPES: ReadonlySet<ListeningQType> = new Set<ListeningQType>([
  'mcq_single',
  'mcq_multi',
  'matching',
  'map_labelling',
  'diagram_labelling',
]);

export const COMPLETION_QUESTION_TYPES: ReadonlySet<ListeningQType> = new Set<ListeningQType>([
  'form_completion',
  'note_completion',
  'table_completion',
  'flowchart_completion',
  'sentence_completion',
  'summary_completion',
  'short_answer',
]);

/**
 * Derive difficulty & audio rules from mode and level (docs/games/L1-TRAP-DETECTOR.md §4.1 & §5).
 */
export function getL1DifficultyConfig(mode: L1Mode, level = 3): L1DifficultyConfig {
  const clampedLevel = Math.max(1, Math.min(10, Math.round(level)));

  if (mode === 'exam') {
    return {
      level: clampedLevel,
      mode: 'exam',
      defaultRate: 1,
      showSignposts: false,
      allowPause: false,
      allowRewind: false,
      allowRateChange: false,
      allowPredictions: false,
      examLocked: true,
      previewSec: 30,
      reviewSec: 30,
      countsForBand: true,
    };
  }

  // Training levels (L1-TRAP-DETECTOR.md §5)
  if (clampedLevel <= 2) {
    return {
      level: clampedLevel,
      mode: 'training',
      defaultRate: 0.9,
      showSignposts: true,
      allowPause: true,
      allowRewind: true,
      allowRateChange: true,
      allowPredictions: true,
      examLocked: false,
      previewSec: 30,
      reviewSec: 0,
      countsForBand: false,
    };
  }
  if (clampedLevel <= 4) {
    return {
      level: clampedLevel,
      mode: 'training',
      defaultRate: 1,
      showSignposts: true,
      allowPause: true,
      allowRewind: true,
      allowRateChange: true,
      allowPredictions: true,
      examLocked: false,
      previewSec: 30,
      reviewSec: 0,
      countsForBand: false,
    };
  }
  if (clampedLevel <= 6) {
    return {
      level: clampedLevel,
      mode: 'training',
      defaultRate: 1,
      showSignposts: false,
      allowPause: true,
      allowRewind: true,
      allowRateChange: true,
      allowPredictions: true,
      examLocked: false,
      previewSec: 30,
      reviewSec: 0,
      countsForBand: false,
    };
  }
  if (clampedLevel <= 8) {
    return {
      level: clampedLevel,
      mode: 'training',
      defaultRate: 1,
      showSignposts: false,
      allowPause: false,
      allowRewind: false,
      allowRateChange: true,
      allowPredictions: true,
      examLocked: false,
      previewSec: 30,
      reviewSec: 0,
      countsForBand: false,
    };
  }
  // Level 9-10: exam-like training (no pause/seek, still no band)
  return {
    level: clampedLevel,
    mode: 'training',
    defaultRate: 1,
    showSignposts: false,
    allowPause: false,
    allowRewind: false,
    allowRateChange: false,
    allowPredictions: false,
    examLocked: true,
    previewSec: 30,
    reviewSec: 0,
    countsForBand: false,
  };
}

export function flattenEpisodeQuestions(
  episode: ListeningEpisode,
): FlattenedListeningQuestion[] {
  const out: FlattenedListeningQuestion[] = [];
  episode.questionGroups.forEach((group, groupIndex) => {
    group.questions.forEach((question, questionIndexInGroup) => {
      out.push({ group, question, groupIndex, questionIndexInGroup });
    });
  });
  return out;
}

/**
 * Resolve script line timestamps. If an episode's audio has not been rendered yet
 * (all script `end === 0`), deterministically estimate proportional line timings
 * across `episode.audio.durationSec` so Waveform, Debrief clips, and simulated mode work cleanly.
 */
export function resolveScriptTimings(
  episode: ListeningEpisode,
): Record<string, { start: number; end: number }> {
  const hasRealTimings = episode.script.some((line) => line.end > line.start);
  const map: Record<string, { start: number; end: number }> = {};

  if (hasRealTimings) {
    for (const line of episode.script) {
      map[line.lineId] = { start: line.start, end: line.end };
    }
    return map;
  }

  const totalDur = episode.audio.durationSec > 0 ? episode.audio.durationSec : 180;
  const weights = episode.script.map((line) =>
    Math.max(4, line.text.trim().split(/\s+/).filter(Boolean).length),
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

  let cursor = 0;
  episode.script.forEach((line, idx) => {
    const span = (weights[idx] / totalWeight) * totalDur;
    const start = Number(cursor.toFixed(2));
    const end = Number(Math.min(totalDur, cursor + span).toFixed(2));
    map[line.lineId] = { start, end };
    cursor += span;
  });

  return map;
}

export function resolveClipRange(
  raw: { lineId: string; start: number; end: number },
  lineTimings: Readonly<Record<string, { start: number; end: number }>>,
): ResolvedTimestampRange {
  if (raw.end > raw.start) {
    return { lineId: raw.lineId, start: raw.start, end: raw.end };
  }
  const line = lineTimings[raw.lineId];
  if (line && line.end > line.start) {
    return { lineId: raw.lineId, start: line.start, end: line.end };
  }
  return { lineId: raw.lineId, start: Math.max(0, raw.start), end: Math.max(raw.start + 5, raw.end) };
}

/**
 * Parse inline MCQ options if a question prompt embeds "A. ... \n B. ..." lines,
 * otherwise fall back to `group.options`.
 */
export function extractQuestionOptions(
  question: ListeningQuestion,
  group: ListeningQuestionGroup,
): { stem: string; options: Array<{ key: string; text: string }> } {
  const lines = question.prompt.split('\n').map((l) => l.trim()).filter(Boolean);
  const inlineOptions: Array<{ key: string; text: string }> = [];
  const stemLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^([A-I])[.)]\s+(.+)$/);
    if (match) {
      inlineOptions.push({ key: match[1].toUpperCase(), text: match[2].trim() });
    } else {
      stemLines.push(line);
    }
  }

  if (inlineOptions.length >= 2) {
    return {
      stem: stemLines.join(' ') || question.prompt,
      options: inlineOptions,
    };
  }

  return {
    stem: question.prompt,
    options: (group.options ?? []).map((o) => ({
      key: o.key.toUpperCase(),
      text: o.text,
    })),
  };
}

/**
 * Check whether an `mcq_multi` group uses the paired-questions IELTS format
 * (e.g. Q9 and Q10 both sharing `answer.keys: ['B', 'E']`).
 */
export function isPairedMcqMultiGroup(group: ListeningQuestionGroup): boolean {
  if (group.type !== 'mcq_multi' || group.questions.length < 2) return false;
  const firstKeys = (group.questions[0].answer.keys ?? group.questions[0].answer.accepted)
    .map((k) => k.trim().toUpperCase())
    .sort()
    .join(',');
  if (!firstKeys) return false;
  return group.questions.every((q) => {
    const k = (q.answer.keys ?? q.answer.accepted)
      .map((x) => x.trim().toUpperCase())
      .sort()
      .join(',');
    return k === firstKeys;
  });
}

export function createL1Session(
  episode: ListeningEpisode,
  options: CreateL1SessionOptions = {},
): L1SessionState {
  const mode: L1Mode = options.mode ?? 'training';
  const level = options.level ?? episode.difficulty;
  const config = getL1DifficultyConfig(mode, level);
  const flat = flattenEpisodeQuestions(episode);
  const startedAt = options.nowMs ?? Date.now();

  return {
    episode,
    mode,
    level: config.level,
    config,
    phase: 'preview',
    startedAt,
    gradedAt: null,
    endedAt: null,
    predictions: {},
    answers: {},
    flaggedQids: [],
    currentQid: flat[0]?.question.qid ?? '',
    results: [],
    selfTrapLabels: {},
    correctCount: 0,
    totalQuestions: flat.length,
    baseXp: 0,
    bonusXp: 0,
    debriefXp: 0,
    totalXp: 0,
  };
}

export function setPrediction(
  state: L1SessionState,
  qid: string,
  prediction: PredictionType | null,
): L1SessionState {
  if (state.phase !== 'preview' || !state.config.allowPredictions) {
    return state;
  }
  const next = { ...state.predictions };
  if (prediction === null) {
    delete next[qid];
  } else {
    next[qid] = prediction;
  }
  return { ...state, predictions: next };
}

export function startListeningPhase(state: L1SessionState): L1TransitionResult {
  if (state.phase !== 'preview') {
    return { state, events: [] };
  }
  const next: L1SessionState = { ...state, phase: 'listening' };
  return {
    state: next,
    events: [{ type: 'phase_changed', phase: 'listening' }],
  };
}

export function setAnswer(
  state: L1SessionState,
  qid: string,
  value: string,
): L1SessionState {
  if (state.phase !== 'listening' && state.phase !== 'review') {
    return state;
  }
  return {
    ...state,
    answers: {
      ...state.answers,
      [qid]: value,
    },
  };
}

/**
 * Toggle an option key for either a paired `mcq_multi` group (distributing selected letters across
 * the group's questions) or a standalone `mcq_multi` question (comma-separated keys).
 */
export function toggleMcqMultiChoice(
  state: L1SessionState,
  groupId: string,
  qid: string,
  optionKey: string,
): L1SessionState {
  if (state.phase !== 'listening' && state.phase !== 'review') {
    return state;
  }
  const group = state.episode.questionGroups.find((g) => g.groupId === groupId);
  if (!group) return state;

  const keyUpper = optionKey.trim().toUpperCase();
  if (!keyUpper) return state;

  if (isPairedMcqMultiGroup(group)) {
    const maxSelect = group.questions.length;
    const currentKeys = Array.from(
      new Set(
        group.questions
          .map((q) => (state.answers[q.qid] ?? '').trim().toUpperCase())
          .filter(Boolean),
      ),
    );

    let nextKeys: string[];
    if (currentKeys.includes(keyUpper)) {
      nextKeys = currentKeys.filter((k) => k !== keyUpper);
    } else if (currentKeys.length < maxSelect) {
      nextKeys = [...currentKeys, keyUpper].sort();
    } else {
      // Cap reached: replace oldest selection or keep capped (strict IELTS max 2)
      return state;
    }

    const nextAnswers = { ...state.answers };
    group.questions.forEach((q, idx) => {
      nextAnswers[q.qid] = nextKeys[idx] ?? '';
    });
    return { ...state, answers: nextAnswers };
  }

  // Standalone single mcq_multi question
  const q = group.questions.find((item) => item.qid === qid);
  const maxSelect = Math.max(1, q?.answer.keys?.length ?? q?.answer.accepted.length ?? 2);
  const existing = (state.answers[qid] ?? '')
    .split(/[\s,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  let nextKeys: string[];
  if (existing.includes(keyUpper)) {
    nextKeys = existing.filter((k) => k !== keyUpper);
  } else if (existing.length < maxSelect) {
    nextKeys = [...existing, keyUpper].sort();
  } else {
    return state;
  }

  return {
    ...state,
    answers: {
      ...state.answers,
      [qid]: nextKeys.join(','),
    },
  };
}

export function getSelectedMultiKeys(
  state: L1SessionState,
  group: ListeningQuestionGroup,
  qid: string,
): string[] {
  if (isPairedMcqMultiGroup(group)) {
    return Array.from(
      new Set(
        group.questions
          .map((q) => (state.answers[q.qid] ?? '').trim().toUpperCase())
          .filter(Boolean),
      ),
    );
  }
  return (state.answers[qid] ?? '')
    .split(/[\s,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export function toggleFlag(state: L1SessionState, qid: string): L1SessionState {
  const exists = state.flaggedQids.includes(qid);
  const flaggedQids = exists
    ? state.flaggedQids.filter((id) => id !== qid)
    : [...state.flaggedQids, qid];
  return { ...state, flaggedQids };
}

export function setCurrentQid(state: L1SessionState, qid: string): L1SessionState {
  return { ...state, currentQid: qid };
}

/**
 * Transition after audio finishes playing:
 * - Exam mode -> `review` phase (30 seconds check window)
 * - Training mode -> directly stays ready to submit or enters `debrief` if `autoGrade` is true
 */
export function finishAudioListening(
  state: L1SessionState,
  options: { autoGradeTraining?: boolean; nowMs?: number } = {},
): L1TransitionResult {
  if (state.phase !== 'listening') {
    return { state, events: [] };
  }
  if (state.config.reviewSec > 0) {
    return {
      state: { ...state, phase: 'review' },
      events: [{ type: 'phase_changed', phase: 'review' }],
    };
  }
  if (options.autoGradeTraining) {
    return submitAndGrade(state, options.nowMs);
  }
  return { state, events: [] };
}

/**
 * Guard early submission per L1-TRAP-DETECTOR.md §11:
 * - Exam: cannot submit before audio ends + 30s review finishes.
 * - Training: can submit early (UI shows confirmation when audio has not ended).
 */
export function canSubmitNow(
  state: L1SessionState,
  audioEnded: boolean,
  reviewRemainingSec = 0,
): { allowed: boolean; needsConfirmation: boolean; reasonVi?: string } {
  if (state.phase !== 'listening' && state.phase !== 'review') {
    return { allowed: false, needsConfirmation: false };
  }
  if (state.mode === 'exam') {
    if (!audioEnded) {
      return {
        allowed: false,
        needsConfirmation: false,
        reasonVi: 'Ở Exam mode, bạn không thể nộp trước khi audio phát xong và hết 30 giây soát bài.',
      };
    }
    if (state.phase === 'review' && reviewRemainingSec > 0) {
      return {
        allowed: false,
        needsConfirmation: false,
        reasonVi: `Còn ${Math.ceil(reviewRemainingSec)} giây soát bài trước khi nộp Exam.`,
      };
    }
    return { allowed: true, needsConfirmation: false };
  }
  return {
    allowed: true,
    needsConfirmation: !audioEnded,
  };
}

/**
 * Active signpost helper (L1-TRAP-DETECTOR.md §5 & §10):
 * Highlights the upcoming/current question within ±10s of evidence.start ONLY in Training Lv 1–4.
 * ALWAYS returns null in Exam mode or Lv ≥ 5 (never leaks answers).
 */
export function getActiveSignpostQid(
  state: L1SessionState,
  currentTimeSec: number,
): string | null {
  if (!state.config.showSignposts || state.phase !== 'listening') {
    return null;
  }
  const lineTimings = resolveScriptTimings(state.episode);
  const flat = flattenEpisodeQuestions(state.episode);
  let bestQid: string | null = null;
  let bestDist = Infinity;

  for (const { question } of flat) {
    const ev = resolveClipRange(question.evidence, lineTimings);
    const dist = Math.abs(currentTimeSec - ev.start);
    if (dist <= 10 && dist < bestDist) {
      bestDist = dist;
      bestQid = question.qid;
    }
  }
  return bestQid;
}

function matchesTrapDecoy(userAnswer: string, decoy: string, isChoice: boolean): boolean {
  const cleanUser = userAnswer.trim();
  const cleanDecoy = decoy.trim();
  if (!cleanUser || !cleanDecoy) return false;
  if (isChoice) {
    return scoreMCQ(cleanUser, cleanDecoy).correct;
  }
  return scoreListeningAnswer(cleanUser, [cleanDecoy]).correct;
}

/**
 * Classify a graded answer into one of the spec's error categories:
 * `none | no_answer | word_limit | spelling | plural | trap:<type> | wrong_content`
 */
export function classifyListeningError(
  userAnswer: string,
  question: ListeningQuestion,
  group: ListeningQuestionGroup,
  scoreResult: { correct: boolean; reason: string },
): L1ErrorCategory {
  if (scoreResult.correct) return 'none';
  if (!userAnswer.trim() || scoreResult.reason === 'empty') return 'no_answer';

  if (scoreResult.reason === 'word_limit_exceeded') return 'word_limit';
  if (
    scoreResult.reason === 'missing_plural_s' ||
    scoreResult.reason === 'extra_plural_s'
  ) {
    return 'plural';
  }

  const isChoice = CHOICE_QUESTION_TYPES.has(group.type);

  // 1. Check explicit decoy match on any annotated trap BEFORE minor_spelling_error
  // (e.g. "13 March" vs "30 March" or "Bramhall" vs "Bramwell" is a trap decoy, not a random typo)
  for (const trap of question.traps) {
    if (trap.decoy && matchesTrapDecoy(userAnswer, trap.decoy, isChoice)) {
      return `trap:${trap.type}`;
    }
  }

  if (scoreResult.reason === 'minor_spelling_error') return 'spelling';

  // 2. If traps exist without explicit decoy text, map to primary trap for metacognition
  const trapWithoutDecoy = question.traps.find((t) => !t.decoy);
  if (trapWithoutDecoy) {
    return `trap:${trapWithoutDecoy.type}`;
  }

  return 'wrong_content';
}

function defaultFeedbackForError(
  errorCategory: L1ErrorCategory,
  accepted: string[],
  scoreFeedbackVi?: string,
): string {
  if (errorCategory === 'none') return 'Chính xác!';
  if (errorCategory === 'no_answer') {
    return `Bạn chưa điền đáp án. Đáp án đúng: "${accepted[0] ?? ''}".`;
  }
  if (scoreFeedbackVi) return scoreFeedbackVi;
  if (errorCategory === 'word_limit') {
    return `Vượt giới hạn từ cho phép. Đáp án đúng: "${accepted[0] ?? ''}".`;
  }
  if (errorCategory === 'plural') {
    return `Lỗi số ít / số nhiều (-s). Đáp án đúng: "${accepted[0] ?? ''}".`;
  }
  if (errorCategory === 'spelling') {
    return `Sai chính tả nhẹ — IELTS chấm sai khi sai chính tả. Đáp án: "${accepted[0] ?? ''}".`;
  }
  if (errorCategory.startsWith('trap:')) {
    const trapKey = errorCategory.slice(5) as ListeningTrap;
    return `Bạn đã sập bẫy ${LISTENING_TRAP_LABELS_VI[trapKey] ?? trapKey}. Đáp án đúng: "${accepted[0] ?? ''}".`;
  }
  return `Chưa đúng nội dung. Đáp án đúng: "${accepted[0] ?? ''}".`;
}

function computeBaseAndBonusXp(
  mode: L1Mode,
  correctCount: number,
  totalQuestions: number,
): { baseXp: number; bonusXp: number } {
  if (mode === 'exam') {
    const baseXp = correctCount * 15;
    // L1-TRAP-DETECTOR.md §4.3: Exam +50 if >= 9/10 (or >= 90% on smaller test episodes)
    const bonusXp =
      totalQuestions > 0 && (correctCount >= 9 || (totalQuestions < 10 && correctCount / totalQuestions >= 0.9))
        ? 50
        : 0;
    return { baseXp, bonusXp };
  }
  return { baseXp: correctCount * 10, bonusXp: 0 };
}

/**
 * Grade all questions in the episode using `scoreListeningAnswer` (completions) and
 * `scoreMCQ` (choice / matching / map labelling), classify errors, compute XP,
 * and transition to `debrief`.
 */
export function submitAndGrade(
  state: L1SessionState,
  nowMs = Date.now(),
): L1TransitionResult {
  if (state.phase === 'debrief' || state.phase === 'recap') {
    return { state, events: [] };
  }

  const lineTimings = resolveScriptTimings(state.episode);
  const results: GradedListeningQuestion[] = [];

  for (const group of state.episode.questionGroups) {
    if (isPairedMcqMultiGroup(group)) {
      // Paired IELTS Choose TWO/THREE: order does not matter; each distinct matching key = 1 point
      const expectedKeys = Array.from(
        new Set(
          (group.questions[0].answer.keys ?? group.questions[0].answer.accepted).map((k) =>
            k.trim().toUpperCase(),
          ),
        ),
      );
      const selectedKeys = Array.from(
        new Set(
          group.questions
            .map((q) => (state.answers[q.qid] ?? '').trim().toUpperCase())
            .filter(Boolean),
        ),
      );
      const matchedKeys = selectedKeys.filter((k) => expectedKeys.includes(k));
      const wrongKeys = selectedKeys.filter((k) => !expectedKeys.includes(k));
      const missingExpected = expectedKeys.filter((k) => !matchedKeys.includes(k));

      group.questions.forEach((question, idx) => {
        const isHit = idx < matchedKeys.length;
        const assignedUserKey = isHit
          ? matchedKeys[idx]
          : wrongKeys[idx - matchedKeys.length] ?? '';
        const expectedDisplay = isHit
          ? matchedKeys[idx]
          : missingExpected[idx - matchedKeys.length] ?? expectedKeys.join(', ');

        const scoreLike = {
          correct: isHit,
          reason: isHit ? 'exact' : assignedUserKey ? 'wrong_answer' : 'empty',
        };
        const errorCategory = classifyListeningError(assignedUserKey, question, group, scoreLike);
        const primaryTrap = question.traps[0] ?? null;

        results.push({
          qid: question.qid,
          number: question.number,
          groupId: group.groupId,
          qType: group.type,
          prompt: question.prompt,
          userAnswer: assignedUserKey,
          acceptedAnswers: [expectedDisplay],
          correct: isHit,
          errorCategory,
          primaryTrap: primaryTrap?.type ?? null,
          trapTypes: question.traps.map((t) => t.type),
          explanationVi: primaryTrap?.explanationVi ?? '',
          feedbackVi: defaultFeedbackForError(errorCategory, expectedKeys),
          evidence: resolveClipRange(question.evidence, lineTimings),
          primaryTrapClip: primaryTrap ? resolveClipRange(primaryTrap, lineTimings) : null,
        });
      });
      continue;
    }

    for (const question of group.questions) {
      const userAnswer = state.answers[question.qid] ?? '';
      const isChoice = CHOICE_QUESTION_TYPES.has(group.type);
      const acceptedAnswers =
        isChoice && question.answer.keys && question.answer.keys.length > 0
          ? question.answer.keys
          : question.answer.accepted;

      let scoreResult: { correct: boolean; reason: string; feedbackVi?: string };

      if (isChoice) {
        const expected =
          question.answer.keys && question.answer.keys.length > 0
            ? question.answer.keys
            : question.answer.accepted;
        const mcqRes = scoreMCQ(userAnswer, expected);
        scoreResult = mcqRes;
      } else {
        const listeningRes: ListeningScoreResult = scoreListeningAnswer(
          userAnswer,
          question.answer.accepted,
          { wordLimit: group.wordLimit ?? group.instructions },
        );
        scoreResult = listeningRes;
      }

      const errorCategory = classifyListeningError(userAnswer, question, group, scoreResult);
      const primaryTrap = question.traps[0] ?? null;

      results.push({
        qid: question.qid,
        number: question.number,
        groupId: group.groupId,
        qType: group.type,
        prompt: question.prompt,
        userAnswer: userAnswer.trim(),
        acceptedAnswers: [...acceptedAnswers],
        correct: scoreResult.correct,
        errorCategory,
        primaryTrap: primaryTrap?.type ?? null,
        trapTypes: question.traps.map((t) => t.type),
        explanationVi: primaryTrap?.explanationVi ?? '',
        feedbackVi: defaultFeedbackForError(
          errorCategory,
          acceptedAnswers,
          scoreResult.feedbackVi,
        ),
        evidence: resolveClipRange(question.evidence, lineTimings),
        primaryTrapClip: primaryTrap ? resolveClipRange(primaryTrap, lineTimings) : null,
      });
    }
  }

  const correctCount = results.filter((r) => r.correct).length;
  const totalQuestions = results.length;
  const { baseXp, bonusXp } = computeBaseAndBonusXp(state.mode, correctCount, totalQuestions);
  const totalXp = baseXp + bonusXp + state.debriefXp;

  const nextState: L1SessionState = {
    ...state,
    phase: 'debrief',
    gradedAt: nowMs,
    results,
    correctCount,
    totalQuestions,
    baseXp,
    bonusXp,
    totalXp,
  };

  return {
    state: nextState,
    events: [
      {
        type: 'graded',
        phase: 'debrief',
        correctCount,
        totalQuestions,
        xpDelta: baseXp + bonusXp,
      },
    ],
  };
}

/**
 * Metacognition step in Debrief: learner selects which trap caught them.
 * Awards +5 XP once per question when matched (no penalty for mismatch).
 */
export function submitTrapLabel(
  state: L1SessionState,
  qid: string,
  chosenTrap: ListeningTrap,
): L1TransitionResult {
  if (state.phase !== 'debrief') {
    return { state, events: [] };
  }

  const graded = state.results.find((r) => r.qid === qid);
  if (!graded || graded.correct) {
    return { state, events: [] };
  }

  // Already labeled once -> keep immutable so XP cannot be farmed by re-clicking
  if (state.selfTrapLabels[qid]) {
    return { state, events: [] };
  }

  const expected = graded.trapTypes;
  const matched = expected.includes(chosenTrap);
  const xpAwarded = matched ? 5 : 0;

  const nextLabels: Record<string, SelfTrapLabelRecord> = {
    ...state.selfTrapLabels,
    [qid]: {
      chosen: chosenTrap,
      expected: [...expected],
      matched,
      xpAwarded,
    },
  };

  const nextDebriefXp = state.debriefXp + xpAwarded;
  const nextState: L1SessionState = {
    ...state,
    selfTrapLabels: nextLabels,
    debriefXp: nextDebriefXp,
    totalXp: state.baseXp + state.bonusXp + nextDebriefXp,
  };

  return {
    state: nextState,
    events: [
      {
        type: 'trap_labeled',
        matched,
        xpDelta: xpAwarded,
      },
    ],
  };
}

export function finishDebrief(
  state: L1SessionState,
  nowMs = Date.now(),
): L1TransitionResult {
  if (state.phase !== 'debrief') {
    return { state, events: [] };
  }
  const nextState: L1SessionState = {
    ...state,
    phase: 'recap',
    endedAt: nowMs,
  };
  return {
    state: nextState,
    events: [
      {
        type: 'session_completed',
        phase: 'recap',
        correctCount: nextState.correctCount,
        totalQuestions: nextState.totalQuestions,
        xpDelta: 0,
      },
    ],
  };
}

/**
 * Build a concrete Vietnamese win statement per L1-TRAP-DETECTOR.md §7.
 */
export function buildL1WinStatement(state: L1SessionState): string {
  const { correctCount, totalQuestions, results, episode } = state;
  const trappedQs = results.filter((r) => r.trapTypes.length > 0);
  const trapsDodged = trappedQs.filter((r) => r.correct).length;

  if (totalQuestions > 0 && correctCount === totalQuestions) {
    return `Hoàn hảo ${correctCount}/${totalQuestions} ở Part ${episode.part} — vượt qua toàn bộ ${trappedQs.length} bẫy!`;
  }

  if (trappedQs.length > 0) {
    const byType = new Map<ListeningTrap, { dodged: number; total: number }>();
    for (const r of trappedQs) {
      const t = r.trapTypes[0];
      const entry = byType.get(t) ?? { dodged: 0, total: 0 };
      entry.total += 1;
      if (r.correct) entry.dodged += 1;
      byType.set(t, entry);
    }
    const breakdown = Array.from(byType.entries())
      .slice(0, 3)
      .map(([t, v]) => `${t} ${v.dodged}/${v.total}`)
      .join(', ');
    return `Bắt được ${trapsDodged}/${trappedQs.length} bẫy (${breakdown}).`;
  }

  return `Hoàn thành Part ${episode.part} với ${correctCount}/${totalQuestions} câu đúng.`;
}

function slugifyAnswer(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'word';
}

function stripEpisodePrefix(id: string): string {
  return id.replace(/^(?:lep|le):/, '');
}

/**
 * Build an atomic `SessionSavePayload` for `attemptRepo.saveSession(...)`:
 * - Records `AttemptRecord` (`gameId: 'l1'`)
 * - Emits `bandEvidence` ONLY in Exam mode (Training never moves BandMeter per L1 §4.1)
 * - Generates FSRS cards for spelling/plural errors (`vocab:<slug>#listen_spell`) and
 *   trap misses (`ltrap:<episodeId>_<qid>#ltrap_replay`), EXCLUDING `reserved` episodes (§8).
 */
export function buildL1SessionSavePayload(
  state: L1SessionState,
  endedAtMs = Date.now(),
): SessionSavePayload {
  const items: AttemptItem[] = state.results.map((r) => ({
    itemId: `${state.episode.id}:${r.qid}`,
    correct: r.correct,
    trapType: r.errorCategory.startsWith('trap:')
      ? r.errorCategory.slice(5)
      : r.primaryTrap ?? undefined,
  }));

  const updatedCards: SRSCard[] = [];
  const seenCardIds = new Set<string>();
  const nowDate = new Date(endedAtMs);

  // L1-TRAP-DETECTOR.md §8: Reserved exam episodes MUST NOT create SRS cards
  if (state.episode.reserved !== true) {
    const epSlug = stripEpisodePrefix(state.episode.id);

    for (const r of state.results) {
      if (r.correct) continue;

      if (r.errorCategory === 'spelling' || r.errorCategory === 'plural') {
        const primaryWord = r.acceptedAnswers[0] ?? '';
        if (primaryWord) {
          const itemId = `vocab:${slugifyAnswer(primaryWord)}`;
          const card = createNewCard(itemId, 'listen_spell', {
            now: nowDate,
            source: 'listening_trap',
            unlocked: true,
          });
          if (!seenCardIds.has(card.id)) {
            seenCardIds.add(card.id);
            updatedCards.push(card);
          }
        }
      } else if (r.errorCategory.startsWith('trap:') || r.trapTypes.length > 0) {
        const itemId = `ltrap:${epSlug}_${r.qid}`;
        const card = createNewCard(itemId, 'ltrap_replay', {
          now: nowDate,
          source: 'listening_trap',
          unlocked: true,
        });
        if (!seenCardIds.has(card.id)) {
          seenCardIds.add(card.id);
          updatedCards.push(card);
        }
      }
    }
  }

  const bandEvidence: Array<Omit<BandSnapshotRecord, 'id'>> = [];
  if (state.config.countsForBand && state.totalQuestions > 0) {
    const acc = state.correctCount / state.totalQuestions;
    bandEvidence.push({
      skill: 'L',
      mode: 'exam',
      ts: endedAtMs,
      correct: state.correctCount,
      total: state.totalQuestions,
      band: accuracyToBand('L', acc),
      sourceGameId: 'l1',
    });
  }

  return {
    attempt: {
      gameId: 'l1',
      mode: state.mode,
      startedAt: state.startedAt,
      endedAt: endedAtMs,
      score: state.correctCount,
      total: state.totalQuestions,
      xp: state.totalXp,
      items,
    },
    updatedCards,
    bandEvidence: bandEvidence.length > 0 ? bandEvidence : undefined,
  };
}
