import type {
  ReadingPassage,
  ReadingQuestion,
  ReadingQuestionGroup,
  Span,
} from '../../core/content/schemas';
import { accuracyToBand } from '../../core/band/tables';
import { evaluateEvidence } from '../../core/scoring/evidence';
import { isCardRetired } from '../../core/srs/faces';
import { createNewCard, type SRSCard } from '../../core/srs/fsrsAdapter';
import type { BandSnapshotRecord } from '../../core/storage/db';
import type { ProgressPayload } from '../../core/storage/repos/attemptRepo';
import type { UserItemInput } from '../../core/storage/repos/userItemRepo';
import { seededRng, shuffleSeeded } from './rng';

export const R2_RETRY_MAX_ITEMS = 5;

export interface R2CatalogCandidate {
  id: string;
  level: 'P1' | 'P2' | 'P3';
}

/**
 * Chọn passage cho R2 tránh bài chơi gần đây (R2-1), xáo có seed.
 */
export function selectR2Passage<T extends R2CatalogCandidate>(
  catalog: readonly T[],
  options: { recentIds?: readonly string[]; seed?: string } = {},
): T | null {
  if (catalog.length === 0) return null;
  const recentSet = new Set(options.recentIds ?? []);
  const fresh = catalog.filter((c) => !recentSet.has(c.id));
  const pool = fresh.length > 0 ? fresh : catalog;
  const rng = seededRng(options.seed ?? `r2:${pool.length}`);
  return shuffleSeeded(pool, rng)[0];
}

// ---------------------------------------------------------------------------
// Types & Constants (docs/games/R2-HEADLINE-EDITOR.md)
// ---------------------------------------------------------------------------

export type HeadingDistractorType =
  | 'detail_only'
  | 'too_broad'
  | 'keyword_match'
  | 'adjacent_paragraph'
  | 'opposite_stance';

export type R2GradingMode = 'per_paragraph' | 'end_of_passage';
export type R2MainIdeaRequirement = 'required' | 'optional' | 'off';

export interface R2DifficultyConfig {
  level: number;
  targetSecPerParagraph: number;
  mainIdeaStep: R2MainIdeaRequirement;
  gradingMode: R2GradingMode;
  extraHeadings: number;
}

export interface HeadingOption {
  key: string;
  text: string;
}

export interface HeadlineParagraphTask {
  qid: string;
  number: number;
  paragraphLabel: string;
  paragraphText: string;
  correctHeadingKey: string;
  mainIdeaSpan: Span | null;
  distractors: ReadonlyArray<{
    key: string;
    type: HeadingDistractorType;
    whyVi: string;
  }>;
  explanationVi: string;
  isExample: boolean;
}

export type R2ScoreBranch =
  | 'both_correct'
  | 'heading_only'
  | 'main_idea_only'
  | 'both_wrong';

export interface ParagraphGradeResult {
  qid: string;
  paragraphLabel: string;
  chosenHeadingKey: string;
  correctHeadingKey: string;
  headingCorrect: boolean;
  mainIdeaCorrect: boolean;
  mainIdeaIoU: number;
  userMainIdeaSpan: Span | null;
  goldMainIdeaSpan: Span | null;
  branch: R2ScoreBranch;
  baseXp: number;
  speedBonusXp: number;
  totalXp: number;
  durationSec: number;
  metSpeedTarget: boolean;
  distractorType?: HeadingDistractorType;
  feedbackVi: string;
}

export interface HeadlineSessionState {
  passageId: string;
  passageTitle: string;
  passageLevel: 'P1' | 'P2' | 'P3';
  reserved: boolean;
  /** Phiên "Ôn lại câu sai": 0 XP, 0 FSRS, không lưu attempt (C3). */
  isRetry: boolean;
  mode: 'training' | 'exam';
  level: number;
  config: R2DifficultyConfig;
  headings: readonly HeadingOption[];
  tasks: readonly HeadlineParagraphTask[];
  /** Index into `tasks` of currently focused paragraph */
  currentIndex: number;
  /** Draft or confirmed heading choice per paragraphLabel */
  assignedHeadings: Readonly<Record<string, string>>;
  /** Paragraphs locked because they are example items or graded in per_paragraph mode */
  lockedParagraphs: Readonly<Record<string, boolean>>;
  /** Headings locked so they cannot be reused (examples + graded paragraphs in per_paragraph mode) */
  lockedHeadings: Readonly<Record<string, string>>;
  /** User highlighted main idea span per paragraphLabel */
  userMainIdeaSpans: Readonly<Record<string, Span>>;
  /** Accumulated duration in seconds per paragraphLabel */
  paragraphDurationsSec: Readonly<Record<string, number>>;
  /** Graded results per paragraphLabel */
  results: Readonly<Record<string, ParagraphGradeResult>>;
  /** Last error/status message for UI */
  lastFeedback: ParagraphGradeResult | null;
  /** Whether the whole passage session is finished */
  completed: boolean;
  totalXp: number;
  startedAt: number;
  endedAt: number | null;
  /** Nội dung thẻ `head:<qid>` cần ghi xuống `userItems` cho V1 (G1). */
  producedItems: Readonly<Record<string, UserItemInput>>;
}

export type R2EngineEvent =
  | { type: 'heading_assigned'; paragraphLabel: string; headingKey: string; releasedKey?: string }
  | { type: 'heading_locked_rejected'; paragraphLabel: string; headingKey: string; usedBy: string }
  | { type: 'main_idea_selected'; paragraphLabel: string; span: Span }
  | { type: 'paragraph_graded'; result: ParagraphGradeResult; srsCard?: SRSCard }
  | { type: 'passage_graded'; results: ParagraphGradeResult[]; srsCards: SRSCard[] }
  | { type: 'session_completed'; totalXp: number; correctCount: number; totalCount: number };

export interface R2Transition {
  state: HeadlineSessionState;
  events: R2EngineEvent[];
}

export interface CreateHeadlineSessionOptions {
  level?: number;
  mode?: 'training' | 'exam';
  gradingModeOverride?: R2GradingMode;
  exampleAssignments?: Readonly<Record<string, string>>;
  nowMs?: number;
}

export const HEADING_DISTRACTOR_LABELS_VI: Record<HeadingDistractorType, string> = {
  detail_only: 'detail_only (chỉ là chi tiết nhỏ)',
  too_broad: 'too_broad (quá rộng so với đoạn)',
  keyword_match: 'keyword_match (bẫy trùng từ khoá)',
  adjacent_paragraph: 'adjacent_paragraph (ý chính của đoạn khác)',
  opposite_stance: 'opposite_stance (ngược quan điểm đoạn)',
};

const ABBREVIATION_ENDINGS = /(?:Dr|Mr|Mrs|Ms|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|U\.S|U\.K|Fig|No)\.$/i;

// ---------------------------------------------------------------------------
// Pure Helpers
// ---------------------------------------------------------------------------

/**
 * Difficulty config table from docs/games/R2-HEADLINE-EDITOR.md §5.
 */
export function getR2DifficultyConfig(
  level: number,
  mode: 'training' | 'exam' = 'training',
  gradingModeOverride?: R2GradingMode,
): R2DifficultyConfig {
  const clamped = Math.max(1, Math.min(10, Math.round(level)));

  let targetSecPerParagraph: number;
  let mainIdeaStep: R2MainIdeaRequirement;
  let extraHeadings: number;

  if (clamped <= 2) {
    targetSecPerParagraph = 75;
    mainIdeaStep = 'required';
    extraHeadings = 2;
  } else if (clamped <= 4) {
    targetSecPerParagraph = 60;
    mainIdeaStep = 'required';
    extraHeadings = 2;
  } else if (clamped <= 6) {
    targetSecPerParagraph = 45;
    mainIdeaStep = 'optional';
    extraHeadings = 3;
  } else if (clamped <= 8) {
    targetSecPerParagraph = 35;
    mainIdeaStep = 'optional';
    extraHeadings = 3;
  } else {
    targetSecPerParagraph = 30;
    mainIdeaStep = 'off';
    extraHeadings = 3;
  }

  const defaultGradingMode: R2GradingMode =
    mode === 'exam' || clamped >= 7 ? 'end_of_passage' : 'per_paragraph';

  return {
    level: clamped,
    targetSecPerParagraph,
    mainIdeaStep: mode === 'exam' ? 'off' : mainIdeaStep,
    gradingMode: mode === 'exam' ? 'end_of_passage' : (gradingModeOverride ?? defaultGradingMode),
    extraHeadings,
  };
}

/**
 * Map keyboard digit '1'..'9' -> 0..8 (i..ix), '0' -> 9 (x).
 * Returns -1 for any other key.
 */
export function keyToHeadingIndex(key: string): number {
  if (key >= '1' && key <= '9') {
    return Number(key) - 1;
  }
  if (key === '0') {
    return 9;
  }
  return -1;
}

/**
 * Pure sentence boundary finder (mirrors Highlighter.findSentenceBounds without DOM imports).
 */
export function findSentenceBoundsPure(
  text: string,
  offset: number,
): { start: number; end: number } {
  if (!text.length) return { start: 0, end: 0 };
  const clamped = Math.max(0, Math.min(text.length - 1, offset));

  const boundaries: number[] = [0];
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
    const isEndOfText = next === undefined;
    const followedBySpaceOrQuote =
      next === ' ' ||
      next === '\n' ||
      next === '\t' ||
      next === '"' ||
      next === '\u201d' ||
      next === ')';
    if (!isEndOfText && !followedBySpaceOrQuote) continue;

    const sliceUpToDot = text.slice(Math.max(0, i - 10), i + 1);
    if (ch === '.' && ABBREVIATION_ENDINGS.test(sliceUpToDot)) continue;

    let endIdx = i + 1;
    while (
      endIdx < text.length &&
      (text[endIdx] === '"' || text[endIdx] === '\u201d' || text[endIdx] === ')')
    ) {
      endIdx++;
    }
    boundaries.push(endIdx);
  }

  if (boundaries[boundaries.length - 1] < text.length) {
    boundaries.push(text.length);
  }

  for (let b = 0; b < boundaries.length - 1; b++) {
    let segStart = boundaries[b];
    const segEnd = boundaries[b + 1];
    while (segStart < segEnd && /\s/.test(text[segStart])) segStart++;
    let trimmedEnd = segEnd;
    while (trimmedEnd > segStart && /\s/.test(text[trimmedEnd - 1])) trimmedEnd--;
    if (clamped >= boundaries[b] && clamped < segEnd) {
      return { start: segStart, end: Math.max(segStart, trimmedEnd) };
    }
  }

  return { start: 0, end: text.length };
}

/**
 * Evaluate whether user's highlighted mainIdeaSpan matches the gold mainIdeaSpan:
 * Passes if IoU >= 0.3 OR both spans fall inside the same sentence of the target paragraph.
 */
export function evaluateMainIdeaHighlight(
  userSpan: Span | null | undefined,
  goldSpan: Span | null | undefined,
  paragraphText: string,
): { passed: boolean; iou: number; sameSentence: boolean } {
  if (!userSpan || !goldSpan) {
    return { passed: false, iou: 0, sameSentence: false };
  }
  if (userSpan.paragraph !== goldSpan.paragraph) {
    return { passed: false, iou: 0, sameSentence: false };
  }

  const ev = evaluateEvidence([userSpan], [goldSpan], { threshold: 0.3, mode: 'char' });
  if (ev.passed) {
    return { passed: true, iou: ev.iou, sameSentence: false };
  }

  // Same-sentence check using midpoints
  if (paragraphText.length > 0 && userSpan.end > userSpan.start && goldSpan.end > goldSpan.start) {
    const userMid = Math.floor((userSpan.start + userSpan.end) / 2);
    const goldMid = Math.floor((goldSpan.start + goldSpan.end) / 2);
    const userSent = findSentenceBoundsPure(paragraphText, userMid);
    const goldSent = findSentenceBoundsPure(paragraphText, goldMid);
    const sameSentence =
      userSent.start === goldSent.start &&
      userSent.end === goldSent.end &&
      userSent.end > userSent.start;
    if (sameSentence) {
      return { passed: true, iou: ev.iou, sameSentence: true };
    }
  }

  return { passed: false, iou: ev.iou, sameSentence: false };
}

function extractParagraphLabel(q: ReadingQuestion): string {
  if (q.mainIdeaSpan?.paragraph) return q.mainIdeaSpan.paragraph;
  if (q.evidence[0]?.paragraph) return q.evidence[0].paragraph;
  const m = q.prompt.match(/Paragraph\s+([A-Z])/i) ?? q.prompt.match(/\b([A-Z])\b/);
  return m ? m[1].toUpperCase() : 'A';
}

export function findHeadingsGroup(passage: ReadingPassage): ReadingQuestionGroup | null {
  return passage.questionGroups.find((g) => g.type === 'headings') ?? null;
}

/**
 * Resolve distractor type and Vietnamese explanation when the learner chooses a wrong heading.
 */
export function resolveDistractorFeedback(
  task: HeadlineParagraphTask,
  chosenKey: string,
  allTasks: readonly HeadlineParagraphTask[],
): { distractorType: HeadingDistractorType; whyVi: string } {
  const exact = task.distractors.find(
    (d) => d.key.toLowerCase() === chosenKey.toLowerCase(),
  );
  if (exact) {
    return { distractorType: exact.type, whyVi: exact.whyVi };
  }

  const otherOwner = allTasks.find(
    (t) =>
      t.paragraphLabel !== task.paragraphLabel &&
      t.correctHeadingKey.toLowerCase() === chosenKey.toLowerCase(),
  );
  if (otherOwner) {
    return {
      distractorType: 'adjacent_paragraph',
      whyVi: `Tít ${chosenKey} là ý chính của đoạn ${otherOwner.paragraphLabel}, không phải ý chính đoạn ${task.paragraphLabel}.`,
    };
  }

  return {
    distractorType: 'detail_only',
    whyVi: `Tít ${chosenKey} không khái quát hết ý chính của đoạn ${task.paragraphLabel}. Hãy đối chiếu lại câu chủ đề được bôi vàng.`,
  };
}

/**
 * Score a single paragraph according to docs/games/R2-HEADLINE-EDITOR.md §4:
 * - Heading correct + mainIdea correct => 15 XP
 * - Heading correct + mainIdea wrong/skipped => 10 XP
 * - Heading wrong + mainIdea correct => 3 XP + specific distractor feedback
 * - Both wrong => 0 XP
 * - Speed bonus: +5 XP when heading is correct and completed within targetSecPerParagraph
 */
export function scoreParagraphHeadline(params: {
  task: HeadlineParagraphTask;
  allTasks: readonly HeadlineParagraphTask[];
  chosenHeadingKey: string;
  userMainIdeaSpan: Span | null;
  durationSec: number;
  targetSecPerParagraph: number;
}): ParagraphGradeResult {
  const {
    task,
    allTasks,
    chosenHeadingKey,
    userMainIdeaSpan,
    durationSec,
    targetSecPerParagraph,
  } = params;

  const normalizedChosen = chosenHeadingKey.trim().toLowerCase();
  const normalizedCorrect = task.correctHeadingKey.trim().toLowerCase();
  const headingCorrect = normalizedChosen === normalizedCorrect;

  const mainEval = evaluateMainIdeaHighlight(
    userMainIdeaSpan,
    task.mainIdeaSpan,
    task.paragraphText,
  );
  const mainIdeaCorrect = mainEval.passed;

  let branch: R2ScoreBranch;
  let baseXp: number;
  if (headingCorrect && mainIdeaCorrect) {
    branch = 'both_correct';
    baseXp = 15;
  } else if (headingCorrect) {
    branch = 'heading_only';
    baseXp = 10;
  } else if (mainIdeaCorrect) {
    branch = 'main_idea_only';
    baseXp = 3;
  } else {
    branch = 'both_wrong';
    baseXp = 0;
  }

  const metSpeedTarget = durationSec <= targetSecPerParagraph;
  const speedBonusXp = headingCorrect && metSpeedTarget ? 5 : 0;
  const totalXp = baseXp + speedBonusXp;

  if (headingCorrect) {
    const speedNote = metSpeedTarget ? ' (+5 XP thưởng tốc độ)' : '';
    const feedbackVi = mainIdeaCorrect
      ? `Chính xác! Ý chính khớp với tít ${task.correctHeadingKey}${speedNote}. ${task.explanationVi}`
      : `Đúng tít ${task.correctHeadingKey}${speedNote}! ${task.explanationVi}`;
    return {
      qid: task.qid,
      paragraphLabel: task.paragraphLabel,
      chosenHeadingKey,
      correctHeadingKey: task.correctHeadingKey,
      headingCorrect,
      mainIdeaCorrect,
      mainIdeaIoU: mainEval.iou,
      userMainIdeaSpan,
      goldMainIdeaSpan: task.mainIdeaSpan,
      branch,
      baseXp,
      speedBonusXp,
      totalXp,
      durationSec,
      metSpeedTarget,
      feedbackVi,
    };
  }

  const { distractorType, whyVi } = resolveDistractorFeedback(
    task,
    chosenHeadingKey,
    allTasks,
  );
  const feedbackVi = mainIdeaCorrect
    ? `Bạn hiểu đúng ý chính, nhưng tít bạn chọn là ${distractorType}. ${whyVi}`
    : `Bạn chọn ${chosenHeadingKey}: ${distractorType}. ${whyVi}`;

  return {
    qid: task.qid,
    paragraphLabel: task.paragraphLabel,
    chosenHeadingKey,
    correctHeadingKey: task.correctHeadingKey,
    headingCorrect,
    mainIdeaCorrect,
    mainIdeaIoU: mainEval.iou,
    userMainIdeaSpan,
    goldMainIdeaSpan: task.mainIdeaSpan,
    branch,
    baseXp,
    speedBonusXp,
    totalXp,
    durationSec,
    metSpeedTarget,
    distractorType,
    feedbackVi,
  };
}

/**
 * Create an SRS retry card `head:<qid>` (face `head_retry`) for a wrong heading answer.
 * Returns null if the passage is `reserved` ([INV-X1] / R2 §8).
 */
export function createHeadRetrySrsCard(
  qid: string,
  reserved: boolean,
  now: Date = new Date(),
): SRSCard | null {
  if (reserved) return null;
  return createNewCard(`head:${qid}`, 'head_retry', {
    now,
    unlocked: true,
    source: 'reading_mistake',
  });
}

/**
 * Check if a `head_retry` card should be retired (after 3 correct reviews per docs/02 §3.2 & R2 §8).
 */
export function isHeadRetryRetired(
  card: Pick<SRSCard, 'face' | 'reps' | 'lastReviewCorrect'>,
): boolean {
  return isCardRetired(card);
}

// ---------------------------------------------------------------------------
// Session State Transitions (Pure)
// ---------------------------------------------------------------------------

export function createHeadlineSession(
  passage: ReadingPassage,
  options: CreateHeadlineSessionOptions = {},
): HeadlineSessionState {
  const level = options.level ?? 3;
  const mode = options.mode ?? 'training';
  const config = getR2DifficultyConfig(level, mode, options.gradingModeOverride);
  const group = findHeadingsGroup(passage);
  if (!group) {
    throw new Error(`Passage "${passage.id}" does not contain a headings question group.`);
  }

  const headings: HeadingOption[] = (group.headings ?? group.options ?? []).map((h) => ({
    key: h.key,
    text: h.text,
  }));

  const exampleMap = options.exampleAssignments ?? {};
  const tasks: HeadlineParagraphTask[] = group.questions.map((q) => {
    const label = extractParagraphLabel(q);
    const para = passage.paragraphs.find((p) => p.label === label);
    const isExample = Boolean(exampleMap[label]);
    const correctKey = exampleMap[label] ?? q.answer.key ?? '';
    return {
      qid: q.qid,
      number: q.number,
      paragraphLabel: label,
      paragraphText: para?.text ?? '',
      correctHeadingKey: correctKey,
      mainIdeaSpan: q.mainIdeaSpan ?? q.evidence[0] ?? null,
      distractors: (q.headingDistractors ?? []).map((d) => ({
        key: d.key,
        type: d.type,
        whyVi: d.whyVi,
      })),
      explanationVi: q.explanationVi,
      isExample,
    };
  });

  const assignedHeadings: Record<string, string> = {};
  const lockedParagraphs: Record<string, boolean> = {};
  const lockedHeadings: Record<string, string> = {};

  for (const t of tasks) {
    if (t.isExample && t.correctHeadingKey) {
      assignedHeadings[t.paragraphLabel] = t.correctHeadingKey;
      lockedParagraphs[t.paragraphLabel] = true;
      lockedHeadings[t.correctHeadingKey] = t.paragraphLabel;
    }
  }

  const firstEditableIdx = tasks.findIndex((t) => !t.isExample);

  return {
    passageId: passage.id,
    passageTitle: passage.title,
    passageLevel: passage.level,
    reserved: Boolean(passage.reserved),
    isRetry: false,
    mode,
    level: config.level,
    config,
    headings,
    tasks,
    currentIndex: firstEditableIdx >= 0 ? firstEditableIdx : 0,
    assignedHeadings,
    lockedParagraphs,
    lockedHeadings,
    userMainIdeaSpans: {},
    paragraphDurationsSec: {},
    results: {},
    lastFeedback: null,
    completed: tasks.every((t) => t.isExample),
    totalXp: 0,
    startedAt: options.nowMs ?? Date.now(),
    endedAt: null,
    producedItems: {},
  };
}

/**
 * Phiên "Ôn lại câu sai" (C3): tối đa 5 đoạn sai từ phiên vừa xong, 0 XP, 0 FSRS, không ghi attempt.
 */
export function createHeadlineRetrySession(
  prev: HeadlineSessionState,
  nowMs: number = Date.now(),
): HeadlineSessionState | null {
  const wrongLabels = new Set(
    Object.values(prev.results)
      .filter((r) => !r.headingCorrect)
      .slice(0, R2_RETRY_MAX_ITEMS)
      .map((r) => r.paragraphLabel),
  );
  if (wrongLabels.size === 0) return null;

  const retryTasks = prev.tasks.filter((t) => wrongLabels.has(t.paragraphLabel));
  if (retryTasks.length === 0) return null;

  return {
    ...prev,
    isRetry: true,
    mode: 'training',
    config: { ...prev.config, gradingMode: 'per_paragraph' },
    tasks: retryTasks,
    currentIndex: 0,
    assignedHeadings: {},
    lockedParagraphs: {},
    lockedHeadings: {},
    userMainIdeaSpans: {},
    paragraphDurationsSec: {},
    results: {},
    lastFeedback: null,
    completed: false,
    totalXp: 0,
    startedAt: nowMs,
    endedAt: null,
    producedItems: {},
  };
}

export function getCurrentTask(state: HeadlineSessionState): HeadlineParagraphTask | null {
  return state.tasks[state.currentIndex] ?? null;
}

/**
 * Returns a map of headingKey -> paragraphLabel for all currently used headings
 * (both locked and tentatively assigned).
 */
export function getUsedHeadingsMap(
  state: HeadlineSessionState,
): Record<string, string> {
  const used: Record<string, string> = { ...state.lockedHeadings };
  for (const [paraLabel, hKey] of Object.entries(state.assignedHeadings)) {
    if (hKey && !used[hKey]) {
      used[hKey] = paraLabel;
    }
  }
  return used;
}

/**
 * Focus a specific paragraph task by index (allowed freely in end_of_passage mode,
 * or to view any unlocked/completed paragraph).
 */
export function selectParagraphIndex(
  state: HeadlineSessionState,
  index: number,
): HeadlineSessionState {
  if (index < 0 || index >= state.tasks.length) return state;
  return {
    ...state,
    currentIndex: index,
    lastFeedback: state.results[state.tasks[index].paragraphLabel] ?? null,
  };
}

/**
 * Record user's highlighted main idea span for the active (or specified) paragraph.
 */
export function selectMainIdeaSpan(
  state: HeadlineSessionState,
  span: Span,
): R2Transition {
  if (state.completed) return { state, events: [] };
  const targetTask = state.tasks.find((t) => t.paragraphLabel === span.paragraph);
  if (!targetTask || state.lockedParagraphs[targetTask.paragraphLabel]) {
    return { state, events: [] };
  }

  const nextState: HeadlineSessionState = {
    ...state,
    userMainIdeaSpans: {
      ...state.userMainIdeaSpans,
      [span.paragraph]: span,
    },
  };

  return {
    state: nextState,
    events: [{ type: 'main_idea_selected', paragraphLabel: span.paragraph, span }],
  };
}

/**
 * Select or swap a heading for the currently focused paragraph.
 * Enforces single-use rule: if headingKey is already used by another paragraph,
 * rejects it. If the current paragraph previously held another heading, releases the old one.
 */
export function assignHeadingChoice(
  state: HeadlineSessionState,
  headingKey: string,
  paragraphLabelOverride?: string,
): R2Transition {
  if (state.completed) return { state, events: [] };
  const task = paragraphLabelOverride
    ? state.tasks.find((t) => t.paragraphLabel === paragraphLabelOverride)
    : getCurrentTask(state);
  if (!task) return { state, events: [] };
  if (state.lockedParagraphs[task.paragraphLabel]) {
    return { state, events: [] };
  }

  // Check if heading is locked by a graded/example paragraph
  const lockedBy = state.lockedHeadings[headingKey];
  if (lockedBy && lockedBy !== task.paragraphLabel) {
    return {
      state,
      events: [
        {
          type: 'heading_locked_rejected',
          paragraphLabel: task.paragraphLabel,
          headingKey,
          usedBy: lockedBy,
        },
      ],
    };
  }

  // Check if heading is currently assigned to another paragraph
  const usedByOther = Object.entries(state.assignedHeadings).find(
    ([pLabel, hKey]) => pLabel !== task.paragraphLabel && hKey === headingKey,
  );
  if (usedByOther) {
    return {
      state,
      events: [
        {
          type: 'heading_locked_rejected',
          paragraphLabel: task.paragraphLabel,
          headingKey,
          usedBy: usedByOther[0],
        },
      ],
    };
  }

  const previousKey = state.assignedHeadings[task.paragraphLabel];
  const nextAssigned = {
    ...state.assignedHeadings,
    [task.paragraphLabel]: headingKey,
  };

  const nextState: HeadlineSessionState = {
    ...state,
    assignedHeadings: nextAssigned,
  };

  return {
    state: nextState,
    events: [
      {
        type: 'heading_assigned',
        paragraphLabel: task.paragraphLabel,
        headingKey,
        releasedKey: previousKey && previousKey !== headingKey ? previousKey : undefined,
      },
    ],
  };
}

/**
 * Clear the tentative heading choice for a paragraph (in end_of_passage mode or before submit).
 */
export function clearHeadingChoice(
  state: HeadlineSessionState,
  paragraphLabel?: string,
): HeadlineSessionState {
  if (state.completed) return state;
  const label = paragraphLabel ?? getCurrentTask(state)?.paragraphLabel;
  if (!label || state.lockedParagraphs[label]) return state;
  if (!(label in state.assignedHeadings)) return state;

  const nextAssigned = { ...state.assignedHeadings };
  delete nextAssigned[label];
  return {
    ...state,
    assignedHeadings: nextAssigned,
  };
}

/**
 * Check if the current paragraph is ready to be submitted in per_paragraph mode.
 */
export function canSubmitCurrentParagraph(state: HeadlineSessionState): boolean {
  if (state.completed || state.config.gradingMode !== 'per_paragraph') return false;
  const task = getCurrentTask(state);
  if (!task || state.lockedParagraphs[task.paragraphLabel]) return false;

  const hasHeading = Boolean(state.assignedHeadings[task.paragraphLabel]);
  if (!hasHeading) return false;

  if (state.config.mainIdeaStep === 'required') {
    return Boolean(state.userMainIdeaSpans[task.paragraphLabel]);
  }
  return true;
}

/**
 * Check if all non-example paragraphs have been assigned a heading (for end_of_passage submit).
 */
export function canSubmitPassage(state: HeadlineSessionState): boolean {
  if (state.completed || state.config.gradingMode !== 'end_of_passage') return false;
  const editable = state.tasks.filter((t) => !t.isExample);
  if (editable.length === 0) return false;
  return editable.every((t) => Boolean(state.assignedHeadings[t.paragraphLabel]));
}

/**
 * Record elapsed seconds spent on a paragraph (e.g. when switching paragraphs in end_of_passage mode).
 */
export function addParagraphDuration(
  state: HeadlineSessionState,
  paragraphLabel: string,
  deltaSec: number,
): HeadlineSessionState {
  if (deltaSec <= 0) return state;
  return {
    ...state,
    paragraphDurationsSec: {
      ...state.paragraphDurationsSec,
      [paragraphLabel]: (state.paragraphDurationsSec[paragraphLabel] ?? 0) + deltaSec,
    },
  };
}

/**
 * Submit and immediately grade the currently focused paragraph (per_paragraph mode).
 */
export function submitCurrentParagraph(
  state: HeadlineSessionState,
  durationSec: number,
  nowMs: number = Date.now(),
): R2Transition {
  if (!canSubmitCurrentParagraph(state)) {
    return { state, events: [] };
  }
  const task = getCurrentTask(state);
  if (!task) return { state, events: [] };

  const chosenKey = state.assignedHeadings[task.paragraphLabel];
  const userSpan = state.userMainIdeaSpans[task.paragraphLabel] ?? null;
  const totalDur = (state.paragraphDurationsSec[task.paragraphLabel] ?? 0) + Math.max(0, durationSec);

  const rawResult = scoreParagraphHeadline({
    task,
    allTasks: state.tasks,
    chosenHeadingKey: chosenKey,
    userMainIdeaSpan: userSpan,
    durationSec: totalDur,
    targetSecPerParagraph: state.config.targetSecPerParagraph,
  });
  const result: ParagraphGradeResult = state.isRetry
    ? { ...rawResult, baseXp: 0, speedBonusXp: 0, totalXp: 0 }
    : rawResult;

  const srsCard =
    !state.isRetry && !result.headingCorrect
      ? createHeadRetrySrsCard(task.qid, state.reserved, new Date(nowMs)) ?? undefined
      : undefined;

  const nextProducedItems: Record<string, UserItemInput> = { ...state.producedItems };
  if (srsCard && !state.isRetry) {
    const headId = `head:${task.qid}`;
    const headingText =
      state.headings.find((h) => h.key === task.correctHeadingKey)?.text ?? task.correctHeadingKey;
    nextProducedItems[headId] = {
      id: headId,
      kind: 'head',
      front: task.paragraphText,
      back: `${task.correctHeadingKey}. ${headingText}`,
      noteVi: result.feedbackVi,
      source: 'r2',
    };
  }

  // Lock the paragraph and lock its TRUE heading so later paragraphs cannot reuse it
  // Also ensure the wrong chosen heading (if wrong) is freed from assignedHeadings
  const nextAssigned = {
    ...state.assignedHeadings,
    [task.paragraphLabel]: task.correctHeadingKey,
  };
  const nextLockedParagraphs = {
    ...state.lockedParagraphs,
    [task.paragraphLabel]: true,
  };
  const nextLockedHeadings = {
    ...state.lockedHeadings,
    [task.correctHeadingKey]: task.paragraphLabel,
  };
  const nextResults = {
    ...state.results,
    [task.paragraphLabel]: result,
  };
  const nextDurations = {
    ...state.paragraphDurationsSec,
    [task.paragraphLabel]: totalDur,
  };

  const nextTotalXp = state.totalXp + result.totalXp;
  const events: R2EngineEvent[] = [{ type: 'paragraph_graded', result, srsCard }];

  const nextState: HeadlineSessionState = {
    ...state,
    assignedHeadings: nextAssigned,
    lockedParagraphs: nextLockedParagraphs,
    lockedHeadings: nextLockedHeadings,
    paragraphDurationsSec: nextDurations,
    results: nextResults,
    lastFeedback: result,
    totalXp: nextTotalXp,
    producedItems: nextProducedItems,
  };

  return { state: nextState, events };
}

/**
 * Advance to the next ungraded paragraph in per_paragraph mode, or finish session if all graded.
 */
export function advanceAfterParagraphGrade(
  state: HeadlineSessionState,
  nowMs: number = Date.now(),
): R2Transition {
  if (state.completed) return { state, events: [] };

  const nextIdx = state.tasks.findIndex(
    (t, idx) => idx > state.currentIndex && !state.lockedParagraphs[t.paragraphLabel],
  );
  const wrapIdx =
    nextIdx >= 0
      ? nextIdx
      : state.tasks.findIndex((t) => !state.lockedParagraphs[t.paragraphLabel]);

  if (wrapIdx >= 0) {
    return {
      state: {
        ...state,
        currentIndex: wrapIdx,
        lastFeedback: null,
      },
      events: [],
    };
  }

  // All paragraphs graded!
  const editableTasks = state.tasks.filter((t) => !t.isExample);
  const correctCount = editableTasks.filter(
    (t) => state.results[t.paragraphLabel]?.headingCorrect,
  ).length;

  const completedState: HeadlineSessionState = {
    ...state,
    completed: true,
    endedAt: nowMs,
  };

  return {
    state: completedState,
    events: [
      {
        type: 'session_completed',
        totalXp: state.totalXp,
        correctCount,
        totalCount: editableTasks.length,
      },
    ],
  };
}

/**
 * Submit and grade the entire passage at once (end_of_passage mode: level >= 7 or exam).
 */
export function submitEntirePassage(
  state: HeadlineSessionState,
  totalSessionDurationSec?: number,
  nowMs: number = Date.now(),
): R2Transition {
  if (!canSubmitPassage(state)) {
    return { state, events: [] };
  }

  const editableTasks = state.tasks.filter((t) => !t.isExample);
  const avgFallbackSec =
    totalSessionDurationSec !== undefined && editableTasks.length > 0
      ? totalSessionDurationSec / editableTasks.length
      : state.config.targetSecPerParagraph;

  const resultsList: ParagraphGradeResult[] = [];
  const srsCards: SRSCard[] = [];
  const nextResults: Record<string, ParagraphGradeResult> = { ...state.results };
  const nextLockedParagraphs: Record<string, boolean> = { ...state.lockedParagraphs };
  const nextLockedHeadings: Record<string, string> = { ...state.lockedHeadings };
  const nextAssigned: Record<string, string> = { ...state.assignedHeadings };
  const nextProducedItems: Record<string, UserItemInput> = { ...state.producedItems };

  let totalXp = state.totalXp;

  for (const task of editableTasks) {
    const chosenKey = state.assignedHeadings[task.paragraphLabel] ?? '';
    const userSpan = state.userMainIdeaSpans[task.paragraphLabel] ?? null;
    const durSec = state.paragraphDurationsSec[task.paragraphLabel] ?? avgFallbackSec;

    const rawRes = scoreParagraphHeadline({
      task,
      allTasks: state.tasks,
      chosenHeadingKey: chosenKey,
      userMainIdeaSpan: userSpan,
      durationSec: durSec,
      targetSecPerParagraph: state.config.targetSecPerParagraph,
    });
    const res: ParagraphGradeResult = state.isRetry
      ? { ...rawRes, baseXp: 0, speedBonusXp: 0, totalXp: 0 }
      : rawRes;

    resultsList.push(res);
    nextResults[task.paragraphLabel] = res;
    nextLockedParagraphs[task.paragraphLabel] = true;
    nextLockedHeadings[task.correctHeadingKey] = task.paragraphLabel;
    nextAssigned[task.paragraphLabel] = task.correctHeadingKey;
    totalXp += res.totalXp;

    if (!state.isRetry && !res.headingCorrect) {
      const card = createHeadRetrySrsCard(task.qid, state.reserved, new Date(nowMs));
      if (card) {
        srsCards.push(card);
        const headId = `head:${task.qid}`;
        const headingText =
          state.headings.find((h) => h.key === task.correctHeadingKey)?.text ??
          task.correctHeadingKey;
        nextProducedItems[headId] = {
          id: headId,
          kind: 'head',
          front: task.paragraphText,
          back: `${task.correctHeadingKey}. ${headingText}`,
          noteVi: res.feedbackVi,
          source: 'r2',
        };
      }
    }
  }

  const correctCount = resultsList.filter((r) => r.headingCorrect).length;

  const nextState: HeadlineSessionState = {
    ...state,
    assignedHeadings: nextAssigned,
    lockedParagraphs: nextLockedParagraphs,
    lockedHeadings: nextLockedHeadings,
    results: nextResults,
    lastFeedback: resultsList[resultsList.length - 1] ?? null,
    completed: true,
    totalXp,
    endedAt: nowMs,
    producedItems: nextProducedItems,
  };

  return {
    state: nextState,
    events: [
      { type: 'passage_graded', results: resultsList, srsCards },
      {
        type: 'session_completed',
        totalXp,
        correctCount,
        totalCount: editableTasks.length,
      },
    ],
  };
}

export interface R2ProgressSnapshot {
  progress: Omit<ProgressPayload, 'attemptId'>;
  /** Nội dung thẻ `head:*` cần ghi `userItemRepo.upsertWithCard(item, 'head_retry')` (G1). */
  items: UserItemInput[];
  /** Bằng chứng band Reading khi hoàn thành chế độ exam (R2-3). */
  bandEvidence?: Array<Omit<BandSnapshotRecord, 'id'>>;
}

/**
 * Ảnh chụp tiến độ R2 để lưu từng đoạn và khi bấm "Lưu và thoát" (G3/TU-02, R2-3 bandEvidence).
 * Trả về `null` khi chưa có đoạn nào được chấm hoặc là phiên retry.
 */
export function buildR2ProgressSnapshot(
  state: HeadlineSessionState,
  pendingSrsCards: readonly SRSCard[] = [],
  now: number = Date.now(),
): R2ProgressSnapshot | null {
  if (state.isRetry) return null;
  const editable = state.tasks.filter((t) => !t.isExample);
  const results = editable
    .map((t) => state.results[t.paragraphLabel])
    .filter((r): r is ParagraphGradeResult => Boolean(r));
  if (results.length === 0) return null;

  const correctCount = results.filter((r) => r.headingCorrect).length;
  const endedAt = state.endedAt ?? now;
  const accuracy = editable.length > 0 ? correctCount / editable.length : 0;

  return {
    progress: {
      attempt: {
        gameId: 'r2',
        mode: state.mode,
        startedAt: state.startedAt,
        endedAt,
        score: correctCount,
        total: Math.max(1, editable.length),
        xp: state.totalXp,
        items: results.map((r) => ({
          itemId: `head:${r.qid}`,
          correct: r.headingCorrect,
          responseTimeMs: Math.round(r.durationSec * 1000),
          trapType: r.distractorType,
        })),
      },
      updatedCards: [...pendingSrsCards],
      reviews: [],
    },
    items: Object.values(state.producedItems),
    bandEvidence:
      state.mode === 'exam' && state.completed
        ? [
            {
              skill: 'R',
              mode: 'exam',
              ts: endedAt,
              correct: correctCount,
              total: editable.length,
              band: accuracyToBand('R', accuracy),
              sourceGameId: 'r2',
            },
          ]
        : undefined,
  };
}

/**
 * Build an encouraging, specific Vietnamese win statement for Recap (R2 §7).
 */
export function buildR2WinStatement(state: HeadlineSessionState): string {
  const editable = state.tasks.filter((t) => !t.isExample);
  const total = editable.length;
  const results = editable
    .map((t) => state.results[t.paragraphLabel])
    .filter((r): r is ParagraphGradeResult => Boolean(r));

  const correctCount = results.filter((r) => r.headingCorrect).length;
  const keywordMatchTraps = results.filter(
    (r) => !r.headingCorrect && r.distractorType === 'keyword_match',
  ).length;
  const avgSec =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.durationSec, 0) / results.length)
      : 0;

  if (correctCount === total && total > 0) {
    return `${correctCount}/${total} tít đúng, thời gian trung bình ${avgSec} giây/đoạn (mục tiêu ${state.config.targetSecPerParagraph} giây)!`;
  }
  if (keywordMatchTraps === 0 && total > 0) {
    return `${correctCount}/${total} tít đúng · Bạn không sập bẫy keyword_match nào (0/${total})!`;
  }
  const mainIdeaHits = results.filter((r) => r.mainIdeaCorrect).length;
  if (mainIdeaHits > correctCount) {
    return `Bạn tìm đúng ý chính ${mainIdeaHits}/${total} đoạn — chỉ cần loại kỹ hơn các tít bẫy là điểm sẽ bật lên ngay.`;
  }
  return `Hoàn thành ${correctCount}/${total} tít với tốc độ trung bình ${avgSec} giây/đoạn.`;
}
