import type {
  ChartKind,
  EssayType,
  Topic,
  WritingTask1Prompt,
  WritingTask2Prompt,
} from '../../core/content/schemas';
import {
  buildGradingPacket,
  computeWritingTaskBand,
  getMinWordsForWriting,
  MIN_GRADING_WORDS_WRITING,
  roundBandHalf,
  type BuiltGradingPacket,
  type PreviousIssueRef,
  type Task1VisualDataInput,
  type WritingAttemptInput,
  type WritingCriteriaBands,
  type WritingResult,
} from '../../core/grading';
import { countIeltsWords } from '../../core/text/tokenize';
import type { EssayRecord } from '../../core/storage/db';
import type { ClicheEntry, Task1IndexEntry } from './writingLoader';

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

export type WritingTaskType = 'task1' | 'task2';
export type EssayMode = 'training' | 'exam';
export type EssayStage = 'select' | 'write' | 'review' | 'graded' | 'revise';
export type EssayStatus = 'draft' | 'awaiting_grade' | 'graded' | 'revised';

export const RECOMMENDED_MINUTES: Record<WritingTaskType, number> = {
  task1: 20,
  task2: 40,
};

export const MAX_REVISIONS_PER_ESSAY = 3;
export const PASTE_WARNING_CHAR_THRESHOLD = 100;

export interface WordCountEvaluation {
  wordCount: number;
  minWords: number;
  minGradingWords: number;
  meetsMinimum: boolean;
  canGrade: boolean;
  deficit: number;
  status: 'too_short' | 'under_min' | 'ok';
}

export interface TimerWarningEvaluation {
  recommendedSec: number;
  elapsedSec: number;
  remainingSec: number;
  isOvertime: boolean;
  warningLevel: 'normal' | 'five_min' | 'one_min' | 'overtime';
  messageVi: string | null;
}

export interface ClicheMatch {
  id: string;
  phrase: string;
  matchedText: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  betterAlternatives: string[];
  whyAvoidVi: string;
  count: number;
  firstIndex: number;
}

export interface PasteDetectionResult {
  isSuspiciousPaste: boolean;
  charCount: number;
  warningVi: string | null;
}

export interface SelfCheckItem {
  id: string;
  labelVi: string;
  detailEn?: string;
  autoChecked?: boolean;
  autoPassed?: boolean;
  mustMention?: boolean;
}

export interface CriterionDelta {
  criterion: 'TR_TA' | 'CC' | 'LR' | 'GRA';
  v1: number;
  v2: number;
  delta: number;
}

export interface RevisionComparison {
  overallV1: number;
  overallV2: number;
  overallDelta: number;
  criteriaDeltas: Record<'TR_TA' | 'CC' | 'LR' | 'GRA', CriterionDelta>;
  improvedCount: number;
  improvedLabels: string[];
  winMessageVi: string;
}

export interface EssayXpInput {
  meetsMinimum: boolean;
  checklistCompleted: boolean;
  claudeGraded: boolean;
  improvedRevisionsCount: number;
  mode: EssayMode;
  onTime: boolean;
  pasted: boolean;
}

export interface EssayXpBreakdown {
  submitXp: number;
  checklistXp: number;
  gradeXp: number;
  revisionXp: number;
  examBonusXp: number;
  totalXp: number;
}

export interface BiasCalibrationSummary {
  sampleCount: number;
  canShowStats: boolean;
  shouldSuggestOffset: boolean;
  /** Mean(officialBand - claudeBand) */
  meanDiff: number;
  /** Nearest 0.5 step suggested offset when sampleCount >= 5 and |meanDiff| >= 0.5 */
  suggestedOffset: number;
  task1Count: number;
  task2Count: number;
  directionVi: string;
}

export interface EssayLifecycleState {
  stage: EssayStage;
  status: EssayStatus;
  revisionNumber: number;
  canReviseAgain: boolean;
}

// ---------------------------------------------------------------------------
// Word Count & Timer Logic
// ---------------------------------------------------------------------------

export function countWords(text: string): number {
  return countIeltsWords(text);
}

export function getMinWords(taskType: WritingTaskType): number {
  return getMinWordsForWriting(taskType);
}

export function getRecommendedMinutes(taskType: WritingTaskType): number {
  return RECOMMENDED_MINUTES[taskType];
}

export function getRecommendedSeconds(taskType: WritingTaskType): number {
  return RECOMMENDED_MINUTES[taskType] * 60;
}

export function evaluateWordCount(
  taskType: WritingTaskType,
  text: string,
): WordCountEvaluation {
  const wordCount = countWords(text);
  const minWords = getMinWords(taskType);
  const meetsMinimum = wordCount >= minWords;
  const canGrade = wordCount >= MIN_GRADING_WORDS_WRITING;
  const deficit = Math.max(0, minWords - wordCount);
  const status: WordCountEvaluation['status'] = !canGrade
    ? 'too_short'
    : !meetsMinimum
      ? 'under_min'
      : 'ok';

  return {
    wordCount,
    minWords,
    minGradingWords: MIN_GRADING_WORDS_WRITING,
    meetsMinimum,
    canGrade,
    deficit,
    status,
  };
}

export function evaluateTimerWarning(
  taskType: WritingTaskType,
  elapsedSec: number,
  mode: EssayMode,
): TimerWarningEvaluation {
  const recommendedSec = getRecommendedSeconds(taskType);
  const clampedElapsed = Math.max(0, Math.floor(elapsedSec));
  const remainingSec = recommendedSec - clampedElapsed;
  const isOvertime = remainingSec <= 0;

  let warningLevel: TimerWarningEvaluation['warningLevel'] = 'normal';
  let messageVi: string | null = null;

  if (isOvertime) {
    warningLevel = 'overtime';
    messageVi =
      mode === 'exam'
        ? 'Hết thời gian chuẩn của bài thi!'
        : `Đã vượt mốc khuyến nghị ${RECOMMENDED_MINUTES[taskType]} phút.`;
  } else if (remainingSec <= 60) {
    warningLevel = 'one_min';
    messageVi = 'Còn dưới 1 phút — kiểm tra nhanh lỗi chính tả và câu kết.';
  } else if (remainingSec <= 300) {
    warningLevel = 'five_min';
    messageVi = 'Còn 5 phút — chuẩn bị hoàn thiện kết bài và rà lỗi.';
  }

  return {
    recommendedSec,
    elapsedSec: clampedElapsed,
    remainingSec,
    isOvertime,
    warningLevel,
    messageVi,
  };
}

export function formatClock(totalSeconds: number): string {
  const abs = Math.max(0, Math.floor(Math.abs(totalSeconds)));
  const mins = Math.floor(abs / 60);
  const secs = abs % 60;
  const prefix = totalSeconds < 0 ? '-' : '';
  return `${prefix}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Cliché Real-Time Scanner
// ---------------------------------------------------------------------------

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPhraseRegex(phrase: string): RegExp {
  const escaped = escapeRegex(phrase.trim()).replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'gi');
}

export function scanCliches(
  text: string,
  cliches: readonly ClicheEntry[],
): ClicheMatch[] {
  if (!text.trim() || cliches.length === 0) return [];

  const matches: ClicheMatch[] = [];

  for (const entry of cliches) {
    const candidates = [entry.phrase, ...(entry.variants ?? [])]
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Check longer variants first so we capture the most specific match
    candidates.sort((a, b) => b.length - a.length);

    let totalCount = 0;
    let firstIndex = Number.POSITIVE_INFINITY;
    let firstMatchedText = '';
    const matchedSpans: Array<[number, number]> = [];

    for (const candidate of candidates) {
      const regex = buildPhraseRegex(candidate);
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        const overlaps = matchedSpans.some(
          ([s, e]) => start < e && end > s,
        );
        if (!overlaps) {
          matchedSpans.push([start, end]);
          totalCount += 1;
          if (start < firstIndex) {
            firstIndex = start;
            firstMatchedText = m[0];
          }
        }
      }
    }

    if (totalCount > 0) {
      matches.push({
        id: entry.id,
        phrase: entry.phrase,
        matchedText: firstMatchedText,
        category: entry.category,
        severity: entry.severity,
        betterAlternatives: [...entry.betterAlternatives],
        whyAvoidVi: entry.whyAvoidVi,
        count: totalCount,
        firstIndex,
      });
    }
  }

  const severityOrder: Record<'high' | 'medium' | 'low', number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return matches.sort(
    (a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity] ||
      a.firstIndex - b.firstIndex,
  );
}

// ---------------------------------------------------------------------------
// Paste Detection (W1 §11)
// ---------------------------------------------------------------------------

export function detectPasteEvent(pastedText: string): PasteDetectionResult {
  const charCount = pastedText.length;
  if (charCount > PASTE_WARNING_CHAR_THRESHOLD) {
    return {
      isSuspiciousPaste: true,
      charCount,
      warningVi:
        'Bài dán vào (> 100 ký tự) sẽ không phản ánh đúng khả năng viết và không được tính vào ước lượng band.',
    };
  }
  return {
    isSuspiciousPaste: false,
    charCount,
    warningVi: null,
  };
}

// ---------------------------------------------------------------------------
// Self-Check Checklist Builder (W1 §4.2)
// ---------------------------------------------------------------------------

export function buildTask2Checklist(
  prompt: WritingTask2Prompt,
  text: string,
  clicheMatches: readonly ClicheMatch[],
): SelfCheckItem[] {
  const wc = evaluateWordCount('task2', text);
  const partsPreview = prompt.partsToAddress.join(' · ');

  return [
    {
      id: 't2_position',
      labelVi: 'Quan điểm (position) nêu rõ ngay ở mở bài và xuyên suốt bài viết',
    },
    {
      id: 't2_parts',
      labelVi: `Trả lời đầy đủ mọi vế của đề (${prompt.partsToAddress.length} phần)`,
      detailEn: partsPreview,
    },
    {
      id: 't2_body',
      labelVi: 'Mỗi đoạn thân bài có 1 ý chính rõ ràng, được giải thích và có ví dụ/hệ quả cụ thể',
    },
    {
      id: 't2_conclusion',
      labelVi: 'Có đoạn kết luận tổng hợp lại lập trường, không đưa ý mới',
    },
    {
      id: 't2_wordcount',
      labelVi: `Đạt tối thiểu 250 từ (hiện tại: ${wc.wordCount} từ)`,
      autoChecked: true,
      autoPassed: wc.meetsMinimum,
    },
    {
      id: 't2_cliches',
      labelVi:
        clicheMatches.length === 0
          ? 'Không dùng cụm sáo rỗng (cliché)'
          : `Phát hiện ${clicheMatches.length} cụm sáo rỗng — nên thay bằng diễn đạt học thuật`,
      autoChecked: true,
      autoPassed: clicheMatches.length === 0,
    },
  ];
}

export function buildTask1Checklist(
  prompt: WritingTask1Prompt,
  text: string,
  clicheMatches: readonly ClicheMatch[],
): SelfCheckItem[] {
  const wc = evaluateWordCount('task1', text);

  const items: SelfCheckItem[] = [
    {
      id: 't1_overview',
      labelVi: 'Có đoạn Overview rõ ràng nêu xu hướng / điểm nổi bật chung (không nhồi số liệu chi tiết)',
    },
    ...prompt.keyFeatures.map((kf) => ({
      id: `t1_kf_${kf.id}`,
      labelVi: kf.mustMention
        ? `Đã nêu Key Feature bắt buộc (${kf.kind})`
        : `Đã nêu Key Feature bổ trợ (${kf.kind})`,
      detailEn: kf.textEn,
      mustMention: kf.mustMention,
    })),
    {
      id: 't1_wordcount',
      labelVi: `Đạt tối thiểu 150 từ (hiện tại: ${wc.wordCount} từ)`,
      autoChecked: true,
      autoPassed: wc.meetsMinimum,
    },
    {
      id: 't1_cliches',
      labelVi:
        clicheMatches.length === 0
          ? 'Không dùng cụm sáo rỗng (cliché)'
          : `Phát hiện ${clicheMatches.length} cụm sáo rỗng`,
      autoChecked: true,
      autoPassed: clicheMatches.length === 0,
    },
  ];

  return items;
}

// ---------------------------------------------------------------------------
// Lifecycle & Revision Logic
// ---------------------------------------------------------------------------

export function canReviseEssay(revisionNumber: number): boolean {
  return revisionNumber < MAX_REVISIONS_PER_ESSAY;
}

export function createInitialLifecycle(): EssayLifecycleState {
  return {
    stage: 'select',
    status: 'draft',
    revisionNumber: 0,
    canReviseAgain: true,
  };
}

export function advanceLifecycle(
  current: EssayLifecycleState,
  event:
    | 'start_writing'
    | 'submit_draft'
    | 'grade_received'
    | 'start_revision'
    | 'submit_revision'
    | 'reset',
): EssayLifecycleState {
  switch (event) {
    case 'start_writing':
      return {
        stage: 'write',
        status: 'draft',
        revisionNumber: 0,
        canReviseAgain: true,
      };
    case 'submit_draft':
      return {
        ...current,
        stage: 'review',
        status: 'awaiting_grade',
      };
    case 'grade_received':
      return {
        ...current,
        stage: 'graded',
        status: current.revisionNumber > 0 ? 'revised' : 'graded',
        canReviseAgain: canReviseEssay(current.revisionNumber),
      };
    case 'start_revision': {
      if (!canReviseEssay(current.revisionNumber)) {
        return current;
      }
      return {
        stage: 'revise',
        status: 'draft',
        revisionNumber: current.revisionNumber + 1,
        canReviseAgain: canReviseEssay(current.revisionNumber + 1),
      };
    }
    case 'submit_revision':
      return {
        ...current,
        stage: 'review',
        status: 'awaiting_grade',
      };
    case 'reset':
      return createInitialLifecycle();
  }
}

export function extractPreviousIssues(result: WritingResult): PreviousIssueRef[] {
  const keys: Array<'TR_TA' | 'CC' | 'LR' | 'GRA'> = ['TR_TA', 'CC', 'LR', 'GRA'];
  const out: PreviousIssueRef[] = [];
  for (const key of keys) {
    for (const iss of result.criteria[key].issues) {
      out.push({
        criterion: key,
        quote: iss.quote,
        problemVi: iss.problemVi,
        fix: iss.fix,
      });
    }
  }
  return out;
}

export function compareRevisionBands(
  v1: WritingCriteriaBands,
  v2: WritingCriteriaBands,
  taskType: WritingTaskType = 'task2',
): RevisionComparison {
  const keys: Array<'TR_TA' | 'CC' | 'LR' | 'GRA'> = ['TR_TA', 'CC', 'LR', 'GRA'];
  const labelMap: Record<'TR_TA' | 'CC' | 'LR' | 'GRA', string> = {
    TR_TA: taskType === 'task1' ? 'TA' : 'TR',
    CC: 'CC',
    LR: 'LR',
    GRA: 'GRA',
  };

  const criteriaDeltas = {} as Record<'TR_TA' | 'CC' | 'LR' | 'GRA', CriterionDelta>;
  const improvedLabels: string[] = [];

  for (const key of keys) {
    const delta = Number((v2[key] - v1[key]).toFixed(1));
    criteriaDeltas[key] = {
      criterion: key,
      v1: v1[key],
      v2: v2[key],
      delta,
    };
    if (delta > 0) {
      improvedLabels.push(`${labelMap[key]} ${v1[key].toFixed(1)} → ${v2[key].toFixed(1)}`);
    }
  }

  const overallV1 = computeWritingTaskBand(v1).overallBand;
  const overallV2 = computeWritingTaskBand(v2).overallBand;
  const overallDelta = Number((overallV2 - overallV1).toFixed(1));

  const winMessageVi =
    improvedLabels.length > 0
      ? `Sau sửa: ${improvedLabels.join(', ')}.`
      : overallDelta === 0
        ? 'Điểm giữ ổn định — xem lại các issue còn sót để đẩy band ở lần sau.'
        : 'Điểm giảm nhẹ ở bản sửa — đối chiếu lại với bản 1 để giữ đoạn mạnh.';

  return {
    overallV1,
    overallV2,
    overallDelta,
    criteriaDeltas,
    improvedCount: improvedLabels.length,
    improvedLabels,
    winMessageVi,
  };
}

// ---------------------------------------------------------------------------
// XP Computation (W1 §4.3)
// ---------------------------------------------------------------------------

export function computeEssayXp(input: EssayXpInput): EssayXpBreakdown {
  const submitXp = input.meetsMinimum ? 60 : 25;
  const checklistXp = input.checklistCompleted ? 10 : 0;
  const gradeXp = input.claudeGraded ? 20 : 0;
  const revisionXp = Math.max(0, input.improvedRevisionsCount) * 30;
  const examBonusXp =
    input.mode === 'exam' && input.onTime && input.meetsMinimum && !input.pasted ? 40 : 0;

  return {
    submitXp,
    checklistXp,
    gradeXp,
    revisionXp,
    examBonusXp,
    totalXp: submitXp + checklistXp + gradeXp + revisionXp + examBonusXp,
  };
}

// ---------------------------------------------------------------------------
// Bias Offset Calibration (docs/07 §6)
// ---------------------------------------------------------------------------

export function computeBiasCalibration(
  essays: readonly EssayRecord[],
): BiasCalibrationSummary {
  const paired = essays.filter(
    (e) =>
      e.claudeResult !== undefined &&
      typeof e.officialBand === 'number' &&
      Number.isFinite(e.officialBand),
  );

  const sampleCount = paired.length;
  let task1Count = 0;
  let task2Count = 0;

  let diffSum = 0;
  for (const e of paired) {
    if (e.taskType === 'task1') task1Count += 1;
    else task2Count += 1;
    diffSum += (e.officialBand as number) - (e.claudeResult?.overallBand ?? 0);
  }

  const meanDiff = sampleCount > 0 ? Number((diffSum / sampleCount).toFixed(2)) : 0;
  const canShowStats = sampleCount >= 3;
  const shouldSuggestOffset = sampleCount >= 5 && Math.abs(meanDiff) >= 0.5;
  const suggestedOffset = shouldSuggestOffset
    ? Math.round(meanDiff * 2) / 2
    : 0;

  let directionVi = 'Chưa đủ dữ liệu đối chiếu (cần tối thiểu 3 bài có điểm thật).';
  if (canShowStats) {
    if (Math.abs(meanDiff) < 0.25) {
      directionVi = 'Claude chấm khá sát điểm thật (lệch < 0.25 band).';
    } else if (meanDiff > 0) {
      directionVi = `Claude đang chấm chặt hơn điểm thật trung bình ${meanDiff.toFixed(2)} band.`;
    } else {
      directionVi = `Claude đang chấm thoáng hơn điểm thật trung bình ${Math.abs(meanDiff).toFixed(2)} band.`;
    }
  }

  return {
    sampleCount,
    canShowStats,
    shouldSuggestOffset,
    meanDiff,
    suggestedOffset,
    task1Count,
    task2Count,
    directionVi,
  };
}

export function applyBiasOffsetToBand(rawBand: number, biasOffset: number): number {
  return roundBandHalf(rawBand + biasOffset);
}

// ---------------------------------------------------------------------------
// Grading Packet Builder Adapter
// ---------------------------------------------------------------------------

export function toTask1VisualDataInput(prompt: WritingTask1Prompt): Task1VisualDataInput {
  const visual: Task1VisualDataInput = {};
  if (prompt.chart) {
    visual.chart = {
      title: prompt.chart.title,
      unit: prompt.chart.unit,
      categories: prompt.chart.categories,
      series: prompt.chart.series,
    };
  }
  if (prompt.table) {
    visual.table = {
      title: prompt.table.title,
      columns: prompt.table.columns,
      rows: prompt.table.rows,
    };
  }
  if (prompt.process) {
    visual.process = {
      title: prompt.process.title,
      steps: prompt.process.steps.map((s) => ({ id: s.id, label: s.label })),
      edges: prompt.process.edges,
      cyclic: prompt.process.cyclic,
    };
  }
  if (prompt.maps) {
    visual.maps = {
      before: {
        year: prompt.maps.before.year,
        landmarks: prompt.maps.before.shapes
          .filter((s) => Boolean(s.label))
          .map((s) => ({ label: s.label as string })),
      },
      after: {
        year: prompt.maps.after.year,
        landmarks: prompt.maps.after.shapes
          .filter((s) => Boolean(s.label))
          .map((s) => ({ label: s.label as string })),
      },
    };
  }
  return visual;
}

export function createWritingPacketInput(params: {
  attemptId: string;
  taskType: WritingTaskType;
  mode: EssayMode;
  essayText: string;
  durationSec: number;
  task1Prompt?: WritingTask1Prompt | null;
  task2Prompt?: WritingTask2Prompt | null;
  previousIssues?: PreviousIssueRef[];
  revisionNumber?: number;
  currentBand?: number;
  targetBand?: number;
}): WritingAttemptInput {
  const base: WritingAttemptInput = {
    attemptId: params.attemptId,
    kind: params.taskType,
    mode: params.mode,
    promptText:
      params.taskType === 'task1'
        ? (params.task1Prompt?.prompt ?? '')
        : (params.task2Prompt?.prompt ?? ''),
    essayText: params.essayText,
    durationSec: params.durationSec,
    wordCount: countWords(params.essayText),
    learnerContext:
      params.currentBand !== undefined || params.targetBand !== undefined
        ? {
            currentBand: params.currentBand,
            targetBand: params.targetBand,
          }
        : undefined,
    previousIssues:
      params.previousIssues && params.previousIssues.length > 0
        ? params.previousIssues
        : undefined,
    revisionNumber:
      params.revisionNumber && params.revisionNumber > 0
        ? params.revisionNumber
        : undefined,
  };

  if (params.taskType === 'task1' && params.task1Prompt) {
    base.task1Visual = toTask1VisualDataInput(params.task1Prompt);
    base.keyFeatures = params.task1Prompt.keyFeatures.map((kf) => ({
      id: kf.id,
      kind: kf.kind,
      textEn: kf.textEn,
      mustMention: kf.mustMention,
    }));
  }

  if (params.taskType === 'task2' && params.task2Prompt) {
    base.partsToAddress = [...params.task2Prompt.partsToAddress];
  }

  return base;
}

export function buildEssayGradingPacket(input: WritingAttemptInput): BuiltGradingPacket {
  return buildGradingPacket(input);
}

// ---------------------------------------------------------------------------
// Prompt Filtering & Suggestion
// ---------------------------------------------------------------------------

export function filterTask2Prompts(
  prompts: readonly WritingTask2Prompt[],
  filter: { essayType?: EssayType | 'all'; topic?: Topic | 'all'; search?: string } = {},
): WritingTask2Prompt[] {
  const q = (filter.search ?? '').trim().toLowerCase();
  return prompts.filter((p) => {
    if (filter.essayType && filter.essayType !== 'all' && p.essayType !== filter.essayType) {
      return false;
    }
    if (filter.topic && filter.topic !== 'all' && p.topic !== filter.topic) {
      return false;
    }
    if (q && !p.prompt.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
}

export function filterTask1Entries(
  entries: readonly Task1IndexEntry[],
  filter: { kind?: ChartKind | 'all'; topic?: Topic | 'all'; search?: string } = {},
): Task1IndexEntry[] {
  const q = (filter.search ?? '').trim().toLowerCase();
  return entries.filter((e) => {
    if (filter.kind && filter.kind !== 'all' && e.kind !== filter.kind) {
      return false;
    }
    if (filter.topic && filter.topic !== 'all' && e.topic !== filter.topic) {
      return false;
    }
    if (
      q &&
      !e.title.toLowerCase().includes(q) &&
      !e.promptPreview.toLowerCase().includes(q) &&
      !e.id.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
}

export function pickSuggestedTask2(
  prompts: readonly WritingTask2Prompt[],
  completedPromptIds: ReadonlySet<string>,
  level = 1,
): WritingTask2Prompt | undefined {
  if (prompts.length === 0) return undefined;
  const unwritten = prompts.filter((p) => !completedPromptIds.has(p.id));
  const pool = unwritten.length > 0 ? unwritten : [...prompts];
  const targetDiff = Math.min(10, Math.max(1, level));
  return [...pool].sort(
    (a, b) => Math.abs(a.difficulty - targetDiff) - Math.abs(b.difficulty - targetDiff),
  )[0];
}
