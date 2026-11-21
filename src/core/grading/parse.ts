import type { z } from 'zod';
import {
  getGradingFamily,
  resolveGradingSchema,
  type GradingFamily,
  type GradingKind,
  type GradingResult,
  type SpeakingResult,
  type SprintResult,
  type WritingResult,
} from './schemas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExtractionSource = 'fenced_json' | 'fenced_generic' | 'balanced_brace';

export type ParseErrorCode =
  | 'EMPTY_INPUT'
  | 'NO_JSON_FOUND'
  | 'INVALID_JSON'
  | 'KIND_MISMATCH'
  | 'SCHEMA_VALIDATION_FAILED';

export interface ParseValidationIssue {
  path: string;
  message: string;
}

export interface AttemptIdMismatch {
  expected: string;
  actual: string;
}

export interface ParseGradingSuccess<T extends GradingResult = GradingResult> {
  ok: true;
  data: T;
  rawJson: string;
  rawObject: Record<string, unknown>;
  partAText: string;
  extractionSource: ExtractionSource;
  repairsApplied: string[];
  attemptIdMismatch: AttemptIdMismatch | null;
}

export interface ParseGradingFailure {
  ok: false;
  errorCode: ParseErrorCode;
  messageVi: string;
  issues: ParseValidationIssue[];
  repairPrompt: string;
  rawCandidate?: string;
}

export type ParseGradingResult<T extends GradingResult = GradingResult> =
  | ParseGradingSuccess<T>
  | ParseGradingFailure;

export interface ParseGradingOptions {
  /** Expected grading kind (e.g. 'task2', 'task1', 'speaking', 'w2_overview'). */
  expectedKind?: GradingKind;
  /** Expected grading family if exact task1/task2 is flexible. */
  expectedFamily?: GradingFamily;
  /** Expected attemptId to detect pasting a response from a different essay/attempt. */
  expectedAttemptId?: string;
}

// ---------------------------------------------------------------------------
// JSON Block Extraction
// ---------------------------------------------------------------------------

interface ExtractedCandidate {
  jsonText: string;
  source: ExtractionSource;
  partAText: string;
}

/**
 * Find all balanced `{ ... }` top-level objects in raw text while respecting quoted strings.
 */
function findBalancedJsonObjects(text: string): Array<{ start: number; end: number; raw: string }> {
  const results: Array<{ start: number; end: number; raw: string }> = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      if (depth > 0) {
        depth--;
        if (depth === 0 && start !== -1) {
          results.push({ start, end: i + 1, raw: text.slice(start, i + 1) });
          start = -1;
        }
      }
    }
  }

  return results;
}

/**
 * Extract the JSON candidate from a raw Claude chat response:
 * 1. Take the LAST fenced ```json ... ``` block (docs/07 §4).
 * 2. Fallback to the LAST generic ``` ... ``` block containing an object `{...}`.
 * 3. Fallback to the LARGEST balanced `{ ... }` object in the text.
 */
export function extractJsonCandidate(rawText: string): ExtractedCandidate | null {
  const cleaned = rawText.replace(/^\uFEFF/, '');

  // 1. All fenced ```json ... ``` blocks (case-insensitive)
  const jsonFenceRe = /```[ \t]*json[ \t]*\r?\n([\s\S]*?)```/gi;
  const jsonFences: Array<{ fullStart: number; fullEnd: number; body: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = jsonFenceRe.exec(cleaned)) !== null) {
    jsonFences.push({
      fullStart: match.index,
      fullEnd: match.index + match[0].length,
      body: match[1].trim(),
    });
  }

  if (jsonFences.length > 0) {
    const last = jsonFences[jsonFences.length - 1];
    const partAText = cleaned.slice(0, last.fullStart).trim();
    return { jsonText: last.body, source: 'fenced_json', partAText };
  }

  // 1b. Unclosed trailing ```json fence (e.g. user stopped copying right before closing ```)
  const unclosedJsonFence = cleaned.match(/```[ \t]*json[ \t]*\r?\n([\s\S]+)$/i);
  if (unclosedJsonFence && unclosedJsonFence.index !== undefined) {
    const body = unclosedJsonFence[1].trim();
    if (body.includes('{')) {
      return {
        jsonText: body,
        source: 'fenced_json',
        partAText: cleaned.slice(0, unclosedJsonFence.index).trim(),
      };
    }
  }

  // 2. Generic ``` ... ``` fences whose content looks like a JSON object
  const genericFenceRe = /```[ \t]*[a-zA-Z0-9_-]*[ \t]*\r?\n([\s\S]*?)```/g;
  const genericFences: Array<{ fullStart: number; body: string }> = [];
  while ((match = genericFenceRe.exec(cleaned)) !== null) {
    const body = match[1].trim();
    if (body.startsWith('{') && body.endsWith('}')) {
      genericFences.push({ fullStart: match.index, body });
    }
  }

  if (genericFences.length > 0) {
    const last = genericFences[genericFences.length - 1];
    return {
      jsonText: last.body,
      source: 'fenced_generic',
      partAText: cleaned.slice(0, last.fullStart).trim(),
    };
  }

  // 3. Largest balanced `{ ... }` object anywhere in the text
  const objects = findBalancedJsonObjects(cleaned);
  if (objects.length > 0) {
    let largest = objects[0];
    for (const obj of objects) {
      if (obj.raw.length > largest.raw.length) {
        largest = obj;
      }
    }
    return {
      jsonText: largest.raw.trim(),
      source: 'balanced_brace',
      partAText: cleaned.slice(0, largest.start).trim(),
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Safe Syntax Cleanup for Minor LLM JSON Glitches
// ---------------------------------------------------------------------------

/**
 * Strip JS comments (`// ...` and `/* ... *\/`) that are NOT inside double-quoted JSON strings.
 */
function stripJsonCommentsOutsideStrings(input: string): string {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];

    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }

    // Single-line comment
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < input.length && input[i] !== '\n') i++;
      if (i < input.length) out += '\n';
      continue;
    }

    // Block comment
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i++;
      i += 1;
      continue;
    }

    out += ch;
  }

  return out;
}

/**
 * Escape raw CR/LF characters accidentally emitted inside JSON string literals.
 */
function escapeRawNewlinesInStrings(input: string): string {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        continue;
      }
      if (ch === '\r') {
        continue;
      }
      if (ch === '\n') {
        out += '\\n';
        continue;
      }
      out += ch;
    } else {
      if (ch === '"') inString = true;
      out += ch;
    }
  }
  return out;
}

/**
 * Remove trailing commas before `}` or `]` outside strings.
 */
function stripTrailingCommas(input: string): string {
  return input.replace(/,\s*([}\]])/g, '$1');
}

function tryParseJsonWithRepairs(raw: string): {
  ok: true;
  value: unknown;
  repairedJson: string;
  repairsApplied: string[];
} | {
  ok: false;
  errorMessage: string;
} {
  // Fast path: strict JSON.parse
  try {
    return {
      ok: true,
      value: JSON.parse(raw),
      repairedJson: raw,
      repairsApplied: [],
    };
  } catch (strictErr) {
    const repairsApplied: string[] = [];
    let current = raw;

    // 1. Strip invisible BOM / zero-width chars
    const noBom = current.replace(/[\uFEFF\u200B-\u200D\u2060]/g, '');
    if (noBom !== current) {
      current = noBom;
      repairsApplied.push('strip_zero_width');
    }

    // 2. Strip JS comments
    const noComments = stripJsonCommentsOutsideStrings(current);
    if (noComments !== current) {
      current = noComments;
      repairsApplied.push('strip_comments');
    }

    // 3. Replace typographic double quotes
    const asciiQuotes = current.replace(/[\u201C\u201D]/g, '"');
    if (asciiQuotes !== current) {
      current = asciiQuotes;
      repairsApplied.push('normalize_smart_quotes');
    }

    // 4. Escape literal newlines inside strings
    const escapedNl = escapeRawNewlinesInStrings(current);
    if (escapedNl !== current) {
      current = escapedNl;
      repairsApplied.push('escape_newlines');
    }

    // 5. Remove trailing commas
    const noTrailing = stripTrailingCommas(current);
    if (noTrailing !== current) {
      current = noTrailing;
      repairsApplied.push('strip_trailing_commas');
    }

    try {
      return {
        ok: true,
        value: JSON.parse(current),
        repairedJson: current,
        repairsApplied,
      };
    } catch {
      const msg = strictErr instanceof Error ? strictErr.message : 'Lỗi cú pháp JSON';
      return { ok: false, errorMessage: msg };
    }
  }
}

// ---------------------------------------------------------------------------
// Repair Prompt Builder (docs/07 §4 step 5)
// ---------------------------------------------------------------------------

export function buildRepairPrompt(
  issues: ParseValidationIssue[],
  context?: { expectedKind?: GradingKind; expectedAttemptId?: string },
): string {
  const summary =
    issues.length > 0
      ? issues
          .slice(0, 6)
          .map((it) => (it.path ? `${it.path}: ${it.message}` : it.message))
          .join('; ')
      : 'không tìm thấy khối JSON hợp lệ';

  const hints: string[] = [];
  if (context?.expectedAttemptId) {
    hints.push(`"attemptId": "${context.expectedAttemptId}"`);
  }
  if (context?.expectedKind) {
    hints.push(`"kind": "${context.expectedKind}"`);
  }
  const hintSuffix = hints.length > 0 ? ` (đảm bảo giữ đúng ${hints.join(', ')})` : '';

  return `JSON chưa đúng: ${summary}. Gửi lại CHỈ khối JSON đúng schema ở mục OUTPUT${hintSuffix}.`;
}

function formatZodIssues(error: z.ZodError): ParseValidationIssue[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return {
      path,
      message: issue.message,
    };
  });
}

function inferFamilyFromRawObject(raw: Record<string, unknown>): GradingFamily | null {
  const kind = raw.kind;
  if (kind === 'task1' || kind === 'task2') return 'writing';
  if (kind === 'speaking') return 'speaking';
  if (kind === 'w2_overview' || kind === 'w2_idea' || kind === 's2') return 'sprint';
  return null;
}

// ---------------------------------------------------------------------------
// Main Parser Entry Point
// ---------------------------------------------------------------------------

export function parseGradingResponse(
  rawText: string,
  options: ParseGradingOptions & { expectedKind: 'task1' | 'task2' },
): ParseGradingResult<WritingResult>;
export function parseGradingResponse(
  rawText: string,
  options: ParseGradingOptions & { expectedKind: 'speaking' },
): ParseGradingResult<SpeakingResult>;
export function parseGradingResponse(
  rawText: string,
  options: ParseGradingOptions & { expectedKind: 'w2_overview' | 'w2_idea' | 's2' },
): ParseGradingResult<SprintResult>;
export function parseGradingResponse(
  rawText: string,
  options?: ParseGradingOptions,
): ParseGradingResult<GradingResult>;
export function parseGradingResponse(
  rawText: string,
  options: ParseGradingOptions = {},
): ParseGradingResult<GradingResult> {
  if (!rawText || !rawText.trim()) {
    const issues: ParseValidationIssue[] = [
      { path: '', message: 'Chưa dán nội dung câu trả lời từ Claude' },
    ];
    return {
      ok: false,
      errorCode: 'EMPTY_INPUT',
      messageVi: 'Ô dán kết quả đang trống. Hãy dán toàn bộ câu trả lời của Claude vào đây.',
      issues,
      repairPrompt: buildRepairPrompt(issues, options),
    };
  }

  const candidate = extractJsonCandidate(rawText);
  if (!candidate) {
    const issues: ParseValidationIssue[] = [
      { path: '', message: 'Không tìm thấy khối ```json hoặc đối tượng JSON {...}' },
    ];
    return {
      ok: false,
      errorCode: 'NO_JSON_FOUND',
      messageVi:
        'Không tìm thấy khối JSON nào trong văn bản bạn dán. Hãy đảm bảo copy đủ phần cuối câu trả lời của Claude.',
      issues,
      repairPrompt: buildRepairPrompt(issues, options),
    };
  }

  const parsedJson = tryParseJsonWithRepairs(candidate.jsonText);
  if (!parsedJson.ok) {
    const issues: ParseValidationIssue[] = [
      { path: '(json)', message: `Cú pháp JSON không hợp lệ: ${parsedJson.errorMessage}` },
    ];
    return {
      ok: false,
      errorCode: 'INVALID_JSON',
      messageVi: `Khối JSON bị lỗi cú pháp (${parsedJson.errorMessage}). Hãy dùng nút "Copy lời nhắc sửa" để yêu cầu Claude gửi lại.`,
      issues,
      repairPrompt: buildRepairPrompt(issues, options),
      rawCandidate: candidate.jsonText,
    };
  }

  if (
    typeof parsedJson.value !== 'object' ||
    parsedJson.value === null ||
    Array.isArray(parsedJson.value)
  ) {
    const issues: ParseValidationIssue[] = [
      { path: '(root)', message: 'JSON phải là một object {...}, không phải mảng hay giá trị đơn' },
    ];
    return {
      ok: false,
      errorCode: 'INVALID_JSON',
      messageVi: 'Khối JSON phải là một đối tượng `{ ... }` đúng schema OUTPUT.',
      issues,
      repairPrompt: buildRepairPrompt(issues, options),
      rawCandidate: candidate.jsonText,
    };
  }

  const rawObject = parsedJson.value as Record<string, unknown>;
  const targetFamily =
    options.expectedFamily ??
    (options.expectedKind ? getGradingFamily(options.expectedKind) : null) ??
    inferFamilyFromRawObject(rawObject);

  if (!targetFamily) {
    const issues: ParseValidationIssue[] = [
      {
        path: 'kind',
        message: `Giá trị kind "${String(rawObject.kind ?? '(trống)')}" không hợp lệ (cần task1, task2, speaking, w2_overview, w2_idea hoặc s2)`,
      },
    ];
    return {
      ok: false,
      errorCode: 'KIND_MISMATCH',
      messageVi: 'Trường `kind` trong JSON không khớp bất kỳ loại bài chấm nào.',
      issues,
      repairPrompt: buildRepairPrompt(issues, options),
      rawCandidate: candidate.jsonText,
    };
  }

  if (options.expectedKind && rawObject.kind !== options.expectedKind) {
    const issues: ParseValidationIssue[] = [
      {
        path: 'kind',
        message: `Mong đợi kind="${options.expectedKind}" nhưng nhận "${String(rawObject.kind ?? '(trống)')}"`,
      },
    ];
    return {
      ok: false,
      errorCode: 'KIND_MISMATCH',
      messageVi: `Kết quả có loại bài "${String(rawObject.kind ?? '(trống)')}" không khớp với bài đang mở ("${options.expectedKind}").`,
      issues,
      repairPrompt: buildRepairPrompt(issues, options),
      rawCandidate: candidate.jsonText,
    };
  }

  const promptVersion =
    typeof rawObject.promptVersion === 'string' ? rawObject.promptVersion : undefined;
  const schema = resolveGradingSchema(targetFamily, promptVersion);
  const validation = schema.safeParse(rawObject);

  if (!validation.success) {
    const issues = formatZodIssues(validation.error);
    return {
      ok: false,
      errorCode: 'SCHEMA_VALIDATION_FAILED',
      messageVi: `JSON thiếu hoặc sai định dạng ở ${issues.length} trường. Hãy gửi lời nhắc sửa lại cho Claude.`,
      issues,
      repairPrompt: buildRepairPrompt(issues, options),
      rawCandidate: candidate.jsonText,
    };
  }

  const data = validation.data as GradingResult;
  const attemptIdMismatch =
    options.expectedAttemptId && data.attemptId !== options.expectedAttemptId
      ? { expected: options.expectedAttemptId, actual: data.attemptId }
      : null;

  return {
    ok: true,
    data,
    rawJson: parsedJson.repairedJson,
    rawObject,
    partAText: candidate.partAText,
    extractionSource: candidate.source,
    repairsApplied: parsedJson.repairsApplied,
    attemptIdMismatch,
  };
}
