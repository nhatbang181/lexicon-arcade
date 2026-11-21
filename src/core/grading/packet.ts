import writingPromptRaw from '../../../docs/grading/WRITING.md?raw';
import speakingPromptRaw from '../../../docs/grading/SPEAKING.md?raw';
import sprintsPromptRaw from '../../../docs/grading/SPRINTS.md?raw';
import { countIeltsWords } from '../text/tokenize';
import {
  extractPromptVersion,
  getGradingFamily,
  type GradingFamily,
  type GradingKind,
  type SprintKind,
  type WritingKind,
} from './schemas';
import { MIN_GRADING_WORDS_WRITING } from './bands';

// ---------------------------------------------------------------------------
// Single source of truth prompt exports (docs/07 §2)
// ---------------------------------------------------------------------------

export const RAW_PROMPTS: Record<GradingFamily, string> = {
  writing: writingPromptRaw.trim(),
  speaking: speakingPromptRaw.trim(),
  sprint: sprintsPromptRaw.trim(),
};

export const PROMPT_VERSIONS: Record<GradingFamily, string> = {
  writing: extractPromptVersion(writingPromptRaw),
  speaking: extractPromptVersion(speakingPromptRaw),
  sprint: extractPromptVersion(sprintsPromptRaw),
};

export const PACKET_CLOSING_INSTRUCTION =
  'Trả lời theo đúng mục OUTPUT ở trên. Khối JSON phải nằm cuối câu trả lời.';

export function getRawPrompt(family: GradingFamily): string {
  return RAW_PROMPTS[family];
}

export function getPromptVersionForKind(kind: GradingKind): string {
  return PROMPT_VERSIONS[getGradingFamily(kind)];
}

export function canBuildWritingPacket(essayText: string): {
  ok: boolean;
  wordCount: number;
  minWords: number;
  reasonVi?: string;
} {
  const wordCount = countIeltsWords(essayText);
  if (wordCount < MIN_GRADING_WORDS_WRITING) {
    return {
      ok: false,
      wordCount,
      minWords: MIN_GRADING_WORDS_WRITING,
      reasonVi: `Bài quá ngắn để chấm (${wordCount}/${MIN_GRADING_WORDS_WRITING} từ tối thiểu).`,
    };
  }
  return { ok: true, wordCount, minWords: MIN_GRADING_WORDS_WRITING };
}

// ---------------------------------------------------------------------------
// Input Types
// ---------------------------------------------------------------------------

export interface LearnerContext {
  currentBand?: number;
  targetBand?: number;
  weakestCriterion?: string;
  note?: string;
}

export interface PreviousIssueRef {
  criterion?: string;
  quote: string;
  problemVi: string;
  fix: string;
}

export interface Task1KeyFeatureInput {
  id: string;
  kind?: string;
  textEn: string;
  mustMention?: boolean;
}

export interface Task1VisualDataInput {
  chart?: {
    title: string;
    unit?: string;
    categories: string[];
    series: Array<{ name: string; values: number[] }>;
  };
  table?: {
    title: string;
    columns: string[];
    rows: Array<Array<string | number>>;
  };
  process?: {
    title: string;
    steps: Array<{ id: string; label: string }>;
    edges: Array<[string, string]>;
    cyclic?: boolean;
  };
  maps?: {
    before: { year: string; title?: string; landmarks?: Array<{ label: string }> };
    after: { year: string; title?: string; landmarks?: Array<{ label: string }> };
    summary?: string;
  };
  dataMarkdown?: string;
}

export interface WritingAttemptInput {
  attemptId: string;
  kind: WritingKind;
  date?: string;
  mode: 'exam' | 'training';
  promptText: string;
  essayText: string;
  durationSec: number;
  wordCount?: number;
  learnerContext?: LearnerContext;
  task1Visual?: Task1VisualDataInput;
  keyFeatures?: Task1KeyFeatureInput[];
  partsToAddress?: string[];
  previousIssues?: PreviousIssueRef[];
  revisionNumber?: number;
}

export interface SpeakingTurnInput {
  part: '1' | '2' | '3';
  question: string;
  transcript: string;
  durationSec?: number;
  startLatencySec?: number;
}

export interface SpeakingMetricsInput {
  wpm?: number;
  longPausesPerMin?: number;
  midPausesPerMin?: number;
  meanRunLength?: number;
  medianStartLatencySec?: number;
  fillersPerMin?: number;
  part2DurationSec?: number;
  mattr?: number;
}

export interface SpeakingAttemptInput {
  attemptId: string;
  kind: 'speaking';
  date?: string;
  mode: 'exam' | 'training';
  durationSec: number;
  learnerContext?: LearnerContext;
  cueCard?: {
    prompt: string;
    bullets: string[];
    finalBullet?: string;
    notes?: string;
  };
  turns: SpeakingTurnInput[];
  metrics?: SpeakingMetricsInput;
  lowConfidenceWords?: Array<string | { word: string; confidence?: number; context?: string }>;
}

export interface SprintItemInput {
  ref: string;
  prompt: string;
  response: string;
  dataMarkdown?: string;
  keyFeatures?: string[];
  partsToAddress?: string[];
  durationSec?: number;
  startLatencySec?: number;
}

export interface SprintAttemptInput {
  attemptId: string;
  kind: SprintKind;
  date?: string;
  mode?: 'sprint' | 'training' | 'exam';
  durationSec?: number;
  learnerContext?: LearnerContext;
  items: SprintItemInput[];
}

export type GradingPacketInput = WritingAttemptInput | SpeakingAttemptInput | SprintAttemptInput;

export interface BuiltGradingPacket {
  attemptId: string;
  kind: GradingKind;
  promptVersion: string;
  filename: string;
  wordCount: number;
  charCount: number;
  markdown: string;
}

// ---------------------------------------------------------------------------
// Formatting Helpers
// ---------------------------------------------------------------------------

function formatIsoDate(date?: string): string {
  if (date && date.trim()) return date.trim();
  return new Date().toISOString().slice(0, 10);
}

export function formatDurationCompact(durationSec: number): string {
  const safe = Math.max(0, Math.round(durationSec));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (mins === 0) return `${secs} giây`;
  return `${mins} phút ${secs.toString().padStart(2, '0')} giây`;
}

export function sanitizePacketFilename(attemptId: string): string {
  const safeId = attemptId.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'attempt';
  return `cham_${safeId}.md`;
}

/**
 * Convert a Task 1 visual specification into a clean Markdown table / summary for Claude.
 */
export function formatTask1VisualToMarkdown(visual: Task1VisualDataInput): string {
  const sections: string[] = [];

  if (visual.dataMarkdown && visual.dataMarkdown.trim()) {
    sections.push(visual.dataMarkdown.trim());
  }

  if (visual.chart) {
    const { title, unit, categories, series } = visual.chart;
    const headerCols = ['Danh mục', ...series.map((s) => s.name)];
    const header = `| ${headerCols.join(' | ')} |`;
    const divider = `| ${headerCols.map(() => '---').join(' | ')} |`;
    const rows = categories.map((cat, idx) => {
      const vals = series.map((s) => (s.values[idx] !== undefined ? String(s.values[idx]) : '—'));
      return `| ${cat} | ${vals.join(' | ')} |`;
    });
    const titleLine = unit ? `**${title}** (Đơn vị: ${unit})` : `**${title}**`;
    sections.push([titleLine, header, divider, ...rows].join('\n'));
  }

  if (visual.table) {
    const { title, columns, rows } = visual.table;
    const header = `| ${columns.join(' | ')} |`;
    const divider = `| ${columns.map(() => '---').join(' | ')} |`;
    const body = rows.map((r) => `| ${r.map((c) => String(c)).join(' | ')} |`);
    sections.push([`**${title}**`, header, divider, ...body].join('\n'));
  }

  if (visual.process) {
    const { title, steps, edges, cyclic } = visual.process;
    const stepMap = new Map(steps.map((s) => [s.id, s.label]));
    const stepLines = steps.map((s, i) => `${i + 1}. \`${s.id}\`: ${s.label}`);
    const edgeLines = edges.map(
      ([from, to]) => `- ${stepMap.get(from) ?? from} → ${stepMap.get(to) ?? to}`,
    );
    sections.push(
      [
        `**${title}** (${cyclic ? 'Quy trình tuần hoàn' : 'Quy trình tuyến tính'})`,
        ...stepLines,
        ...(edgeLines.length > 0 ? ['', 'Luồng chuyển tiếp:', ...edgeLines] : []),
      ].join('\n'),
    );
  }

  if (visual.maps) {
    const { before, after, summary } = visual.maps;
    const lines = [
      `**So sánh bản đồ (${before.year} → ${after.year})**`,
      ...(before.landmarks?.length
        ? [`- Trước (${before.year}): ${before.landmarks.map((l) => l.label).join(', ')}`]
        : []),
      ...(after.landmarks?.length
        ? [`- Sau (${after.year}): ${after.landmarks.map((l) => l.label).join(', ')}`]
        : []),
      ...(summary ? [`- Ghi chú: ${summary}`] : []),
    ];
    sections.push(lines.join('\n'));
  }

  return sections.join('\n\n');
}

function formatLearnerContextBlock(ctx?: LearnerContext): string[] {
  if (!ctx) return [];
  const parts: string[] = [];
  if (ctx.currentBand !== undefined) parts.push(`Band hiện tại ~${ctx.currentBand.toFixed(1)}`);
  if (ctx.targetBand !== undefined) parts.push(`Mục tiêu ${ctx.targetBand.toFixed(1)}`);
  if (ctx.weakestCriterion) parts.push(`Tiêu chí cần ưu tiên: ${ctx.weakestCriterion}`);
  if (ctx.note) parts.push(ctx.note);
  if (parts.length === 0) return [];
  return [`- **Ngữ cảnh học viên:** ${parts.join(' · ')}`];
}

// ---------------------------------------------------------------------------
// Builders per kind
// ---------------------------------------------------------------------------

function buildWritingSection(input: WritingAttemptInput): { body: string; wordCount: number } {
  const wordCount = input.wordCount ?? countIeltsWords(input.essayText);
  const lines: string[] = [
    '## BÀI CẦN CHẤM',
    '',
    `- **attemptId:** \`${input.attemptId}\``,
    `- **Ngày:** ${formatIsoDate(input.date)}`,
    `- **Loại bài:** \`${input.kind}\``,
    `- **Chế độ:** \`${input.mode}\``,
    `- **Số từ (app đếm):** ${wordCount}`,
    `- **Thời gian đã dùng:** ${formatDurationCompact(input.durationSec)}`,
    ...formatLearnerContextBlock(input.learnerContext),
    '',
    '### Đề bài',
    input.promptText.trim(),
  ];

  if (input.kind === 'task1') {
    if (input.task1Visual) {
      const visualMd = formatTask1VisualToMarkdown(input.task1Visual);
      if (visualMd) {
        lines.push('', '### Dữ liệu biểu đồ (Markdown)', visualMd);
      }
    }
    if (input.keyFeatures && input.keyFeatures.length > 0) {
      lines.push('', '### Key Features cần kiểm tra (`keyFeatures`)');
      for (const kf of input.keyFeatures) {
        const tag = kf.mustMention ? ' *(bắt buộc)*' : '';
        const kindTag = kf.kind ? ` [${kf.kind}]` : '';
        lines.push(`- \`${kf.id}\`${kindTag}: ${kf.textEn}${tag}`);
      }
    }
  } else if (input.partsToAddress && input.partsToAddress.length > 0) {
    lines.push('', '### Các phần đề bài yêu cầu (`partsToAddress`)');
    for (const part of input.partsToAddress) {
      lines.push(`- ${part}`);
    }
  }

  if (input.previousIssues && input.previousIssues.length > 0) {
    const revLabel = input.revisionNumber ? ` (Lần sửa #${input.revisionNumber})` : '';
    lines.push(
      '',
      `### Chấm lại – Danh sách lỗi lần trước${revLabel}`,
      'Kiểm tra xem bài sửa dưới đây đã khắc phục những lỗi nào và ghi quote đã sửa xong vào `revision.resolvedIssueQuotes`:',
    );
    input.previousIssues.forEach((iss, idx) => {
      const crit = iss.criterion ? `[${iss.criterion}] ` : '';
      lines.push(
        `${idx + 1}. ${crit}"${iss.quote}" — Lỗi: ${iss.problemVi} → Gợi ý cũ: ${iss.fix}`,
      );
    });
  }

  lines.push('', '### Bài làm nguyên văn', input.essayText.trim());

  return { body: lines.join('\n'), wordCount };
}

function buildSpeakingSection(input: SpeakingAttemptInput): { body: string; wordCount: number } {
  const combinedTranscript = input.turns.map((t) => t.transcript).join(' ');
  const wordCount = countIeltsWords(combinedTranscript);

  const lines: string[] = [
    '## BÀI CẦN CHẤM',
    '',
    `- **attemptId:** \`${input.attemptId}\``,
    `- **Ngày:** ${formatIsoDate(input.date)}`,
    `- **Loại bài:** \`speaking\``,
    `- **Chế độ:** \`${input.mode}\``,
    `- **Tổng số từ transcript (app đếm):** ${wordCount}`,
    `- **Tổng thời lượng:** ${formatDurationCompact(input.durationSec)}`,
    ...formatLearnerContextBlock(input.learnerContext),
  ];

  if (input.cueCard) {
    lines.push(
      '',
      '### Part 2 Cue Card',
      `**${input.cueCard.prompt}**`,
      ...input.cueCard.bullets.map((b) => `- ${b}`),
      ...(input.cueCard.finalBullet ? [`- ${input.cueCard.finalBullet}`] : []),
      ...(input.cueCard.notes ? ['', `Ghi chú chuẩn bị của thí sinh: ${input.cueCard.notes}`] : []),
    );
  }

  if (input.metrics) {
    const m = input.metrics;
    const rows: Array<[string, string]> = [];
    if (m.wpm !== undefined) rows.push(['WPM (tốc độ nói)', `${m.wpm.toFixed(0)} từ/phút`]);
    if (m.longPausesPerMin !== undefined)
      rows.push(['Long pauses (> 2s / phút)', m.longPausesPerMin.toFixed(1)]);
    if (m.midPausesPerMin !== undefined)
      rows.push(['Mid pauses (1–2s / phút)', m.midPausesPerMin.toFixed(1)]);
    if (m.meanRunLength !== undefined)
      rows.push(['Mean run length', `${m.meanRunLength.toFixed(1)} từ`]);
    if (m.medianStartLatencySec !== undefined)
      rows.push(['Start latency (trung vị)', `${m.medianStartLatencySec.toFixed(1)} giây`]);
    if (m.fillersPerMin !== undefined)
      rows.push(['Fillers / phút', m.fillersPerMin.toFixed(1)]);
    if (m.part2DurationSec !== undefined)
      rows.push(['Thời lượng Part 2', formatDurationCompact(m.part2DurationSec)]);
    if (m.mattr !== undefined) rows.push(['Lexical variety (MATTR)', m.mattr.toFixed(2)]);

    if (rows.length > 0) {
      lines.push(
        '',
        '### Chỉ số Fluency (đo từ audio)',
        '| Chỉ số | Giá trị |',
        '|---|---|',
        ...rows.map(([k, v]) => `| ${k} | ${v} |`),
      );
    }
  }

  if (input.lowConfidenceWords && input.lowConfidenceWords.length > 0) {
    const formatted = input.lowConfidenceWords.map((item) => {
      if (typeof item === 'string') return `\`${item}\``;
      const conf =
        item.confidence !== undefined ? ` (${Math.round(item.confidence * 100)}%)` : '';
      const ctx = item.context ? ` trong "${item.context}"` : '';
      return `\`${item.word}\`${conf}${ctx}`;
    });
    lines.push('', '### Từ ASR độ tin cậy thấp (dấu hiệu phát âm gián tiếp)', formatted.join(', '));
  }

  lines.push('', '### Transcript theo từng câu');
  for (const part of ['1', '2', '3'] as const) {
    const partTurns = input.turns.filter((t) => t.part === part);
    if (partTurns.length === 0) continue;
    lines.push('', `#### Part ${part}`);
    partTurns.forEach((turn, idx) => {
      const meta: string[] = [];
      if (turn.durationSec !== undefined) meta.push(`${Math.round(turn.durationSec)}s`);
      if (turn.startLatencySec !== undefined)
        meta.push(`latency ${turn.startLatencySec.toFixed(1)}s`);
      const metaStr = meta.length > 0 ? ` *(${meta.join(', ')})*` : '';
      lines.push(`**Q${idx + 1}:** ${turn.question}${metaStr}`);
      lines.push(`> ${turn.transcript.trim() || '(trống)'}`, '');
    });
  }

  return { body: lines.join('\n').trim(), wordCount };
}

function buildSprintSection(input: SprintAttemptInput): { body: string; wordCount: number } {
  const combined = input.items.map((it) => it.response).join(' ');
  const wordCount = countIeltsWords(combined);

  const lines: string[] = [
    '## BÀI CẦN CHẤM',
    '',
    `- **attemptId:** \`${input.attemptId}\``,
    `- **Ngày:** ${formatIsoDate(input.date)}`,
    `- **Loại bài:** \`${input.kind}\``,
    `- **Chế độ:** \`${input.mode ?? 'sprint'}\``,
    `- **Số lượt trong phiên:** ${input.items.length}`,
    `- **Tổng số từ (app đếm):** ${wordCount}`,
    ...(input.durationSec !== undefined
      ? [`- **Thời gian đã dùng:** ${formatDurationCompact(input.durationSec)}`]
      : []),
    ...formatLearnerContextBlock(input.learnerContext),
    '',
    '### Danh sách lượt cần chấm',
  ];

  input.items.forEach((item, idx) => {
    const meta: string[] = [];
    if (item.durationSec !== undefined) meta.push(`${Math.round(item.durationSec)}s`);
    if (item.startLatencySec !== undefined)
      meta.push(`latency ${item.startLatencySec.toFixed(1)}s`);
    const metaStr = meta.length > 0 ? ` (${meta.join(', ')})` : '';

    lines.push('', `#### Lượt ${idx + 1} · ref: \`${item.ref}\`${metaStr}`);
    lines.push(`**Đề bài:** ${item.prompt.trim()}`);
    if (item.dataMarkdown) {
      lines.push('', item.dataMarkdown.trim());
    }
    if (item.keyFeatures && item.keyFeatures.length > 0) {
      lines.push(`**Key features:** ${item.keyFeatures.join('; ')}`);
    }
    if (item.partsToAddress && item.partsToAddress.length > 0) {
      lines.push(`**Parts to address:** ${item.partsToAddress.join('; ')}`);
    }
    lines.push(`**Bài làm của học viên:**`, item.response.trim() || '(bỏ trống)');
  });

  return { body: lines.join('\n'), wordCount };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a complete grading packet with metadata (markdown, filename, promptVersion, wordCount).
 */
export function buildGradingPacket(input: GradingPacketInput): BuiltGradingPacket {
  const family = getGradingFamily(input.kind);
  const rawPrompt = RAW_PROMPTS[family];
  const promptVersion = PROMPT_VERSIONS[family];

  let section: { body: string; wordCount: number };
  switch (input.kind) {
    case 'task1':
    case 'task2':
      section = buildWritingSection(input);
      break;
    case 'speaking':
      section = buildSpeakingSection(input);
      break;
    case 'w2_overview':
    case 'w2_idea':
    case 's2':
      section = buildSprintSection(input);
      break;
  }

  const markdown = [rawPrompt, '---', section.body, '---', PACKET_CLOSING_INSTRUCTION].join('\n\n');

  return {
    attemptId: input.attemptId,
    kind: input.kind,
    promptVersion,
    filename: sanitizePacketFilename(input.attemptId),
    wordCount: section.wordCount,
    charCount: markdown.length,
    markdown,
  };
}

/**
 * Convenience signature matching `docs/07-GRADING-WITH-CLAUDE.md §3`: `buildPacket(kind, attempt)`.
 */
export function buildPacket(
  kind: 'task1' | 'task2',
  attempt: Omit<WritingAttemptInput, 'kind'>,
): string;
export function buildPacket(
  kind: 'speaking',
  attempt: Omit<SpeakingAttemptInput, 'kind'>,
): string;
export function buildPacket(
  kind: SprintKind,
  attempt: Omit<SprintAttemptInput, 'kind'>,
): string;
export function buildPacket(
  kind: GradingKind,
  attempt:
    | Omit<WritingAttemptInput, 'kind'>
    | Omit<SpeakingAttemptInput, 'kind'>
    | Omit<SprintAttemptInput, 'kind'>,
): string {
  const combined = { ...attempt, kind } as GradingPacketInput;
  return buildGradingPacket(combined).markdown;
}
