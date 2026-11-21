import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Info,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Wand2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  buildGradingPacket,
  isSpeakingResult,
  isSprintResult,
  isWritingResult,
  parseGradingResponse,
  postcheckGradingResult,
  type CriterionFeedback,
  type GradingPacketInput,
  type ParseGradingFailure,
  type ParseGradingSuccess,
  type PostcheckReport,
  type SrsFeedbackItem,
} from '../../core/grading';
import { Button, Card, Pill, Toast } from '../../design/components';
import type { SkillColor } from '../../design/components/Button';
import { dur, ease } from '../../design/motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GradingPanelGradedPayload {
  parsed: ParseGradingSuccess;
  postcheck: PostcheckReport;
  rawResponse: string;
}

export interface GradingPanelProps {
  /** Attempt payload used to generate the Markdown grading packet. */
  packetInput: GradingPacketInput;
  /** Original learner text for post-checking quotes & word count (auto-derived if omitted). */
  sourceText?: string;
  /** Optional sample Claude chat response to enable a 1-click "Dán kết quả mẫu" button. */
  sampleResponse?: string;
  /** Skill color accent. Defaults automatically based on packetInput.kind. */
  skill?: Extract<SkillColor, 'writing' | 'speaking'>;
  /** Expected sprint refs for Sprint completeness checking (auto-derived if omitted). */
  expectedSprintRefs?: string[];
  /** Called once a Claude response passes Zod validation and post-checks. */
  onGraded?: (payload: GradingPanelGradedPayload) => void;
  /** Optional handler to add a suggested feedback item into the user's SRS queue. */
  onAddSrsItem?: (item: SrsFeedbackItem) => void;
  /** Optional already-graded payload to display immediately. */
  initialGraded?: GradingPanelGradedPayload | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WRITING_CRITERIA_META: ReadonlyArray<{
  key: 'TR_TA' | 'CC' | 'LR' | 'GRA';
  short: string;
  task1Label: string;
  task2Label: string;
}> = [
  { key: 'TR_TA', short: 'TR/TA', task1Label: 'Task Achievement (TA)', task2Label: 'Task Response (TR)' },
  { key: 'CC', short: 'CC', task1Label: 'Coherence & Cohesion', task2Label: 'Coherence & Cohesion' },
  { key: 'LR', short: 'LR', task1Label: 'Lexical Resource', task2Label: 'Lexical Resource' },
  { key: 'GRA', short: 'GRA', task1Label: 'Grammatical Range & Accuracy', task2Label: 'Grammatical Range & Accuracy' },
];

const SPEAKING_CRITERIA_META: ReadonlyArray<{
  key: 'FC' | 'LR' | 'GRA' | 'P';
  short: string;
  label: string;
}> = [
  { key: 'FC', short: 'FC', label: 'Fluency & Coherence' },
  { key: 'LR', short: 'LR', label: 'Lexical Resource' },
  { key: 'GRA', short: 'GRA', label: 'Grammatical Range & Accuracy' },
  { key: 'P', short: 'P', label: 'Pronunciation (ước tính gián tiếp)' },
];

function deriveSourceText(input: GradingPacketInput): string {
  switch (input.kind) {
    case 'task1':
    case 'task2':
      return input.essayText;
    case 'speaking':
      return input.turns.map((t) => t.transcript).join('\n');
    case 'w2_overview':
    case 'w2_idea':
    case 's2':
      return input.items.map((i) => i.response).join('\n');
  }
}

function deriveExpectedSprintRefs(input: GradingPacketInput): string[] | undefined {
  switch (input.kind) {
    case 'w2_overview':
    case 'w2_idea':
    case 's2':
      return input.items.map((i) => i.ref);
    default:
      return undefined;
  }
}

function getBandColorVar(band: number): string {
  if (band >= 7.5) return 'var(--color-correct)';
  if (band >= 6.5) return 'var(--color-info)';
  if (band >= 5.5) return 'var(--color-partial)';
  return 'var(--color-wrong)';
}

function confidenceLabelVi(conf: 'low' | 'medium' | 'high'): string {
  if (conf === 'high') return 'Độ tin cậy: cao';
  if (conf === 'medium') return 'Độ tin cậy: vừa';
  return 'Độ tin cậy: thấp';
}

function severityTone(sev: 'high' | 'medium' | 'low'): 'wrong' | 'partial' | 'neutral' {
  if (sev === 'high') return 'wrong';
  if (sev === 'medium') return 'partial';
  return 'neutral';
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sub-component: Criterion Card with Score Bar & Quotes
// ---------------------------------------------------------------------------

interface CriterionRowProps {
  code: string;
  label: string;
  feedback: CriterionFeedback;
  defaultOpen?: boolean;
}

const CriterionRow: React.FC<CriterionRowProps> = ({
  code,
  label,
  feedback,
  defaultOpen = false,
}) => {
  const [expanded, setExpanded] = useState(defaultOpen);
  const pct = Math.min(100, Math.max(0, (feedback.band / 9) * 100));
  const barColor = getBandColorVar(feedback.band);
  const hasDetails = feedback.strengths.length > 0 || feedback.issues.length > 0;

  return (
    <div
      className="rounded-[var(--radius-md)] border p-4 space-y-3"
      style={{
        backgroundColor: 'var(--color-surface-2)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-xs font-bold px-2 py-0.5 rounded-[var(--radius-sm)]"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: barColor,
                border: '1px solid var(--color-border)',
              }}
            >
              {code}
            </span>
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              {label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-lg font-bold tabular-nums" style={{ color: barColor }}>
            {feedback.band.toFixed(1)}
          </span>
          <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
            /9.0
          </span>
        </div>
      </div>

      {/* Score progress bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)' }}
        role="progressbar"
        aria-valuenow={feedback.band}
        aria-valuemin={0}
        aria-valuemax={9}
        aria-label={`${label}: ${feedback.band.toFixed(1)}`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
        {feedback.summaryVi}
      </p>

      {hasDetails && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            style={{ color: 'var(--color-info)' }}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>
              {expanded ? 'Thu gọn trích dẫn' : 'Xem trích dẫn'} ({feedback.strengths.length} điểm mạnh ·{' '}
              {feedback.issues.length} lỗi)
            </span>
          </button>

          {expanded && (
            <div className="mt-3 space-y-2.5">
              {feedback.strengths.map((s, idx) => (
                <div
                  key={`str-${idx}`}
                  className="rounded-[var(--radius-sm)] border p-3 space-y-1"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    borderLeftWidth: '3px',
                    borderLeftColor: 'var(--color-correct)',
                  }}
                >
                  <p
                    className="text-xs font-mono italic"
                    style={{ color: 'var(--color-correct)' }}
                  >
                    &ldquo;{s.quote}&rdquo;
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                    {s.whyVi}
                  </p>
                </div>
              ))}

              {feedback.issues.map((iss, idx) => (
                <div
                  key={`iss-${idx}`}
                  className="rounded-[var(--radius-sm)] border p-3 space-y-1.5"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    borderLeftWidth: '3px',
                    borderLeftColor:
                      iss.severity === 'high' ? 'var(--color-wrong)' : 'var(--color-partial)',
                  }}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Pill tone={severityTone(iss.severity)} size="sm">
                      {iss.severity}
                    </Pill>
                    <Pill tone="neutral" size="sm">
                      {iss.errorTag}
                    </Pill>
                  </div>
                  <p className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>
                    &ldquo;{iss.quote}&rdquo;
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                    {iss.problemVi}
                  </p>
                  {iss.fix && (
                    <p className="text-xs font-medium" style={{ color: 'var(--color-correct)' }}>
                      → Gợi ý sửa: <span className="font-mono">{iss.fix}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component: GradingPanel
// ---------------------------------------------------------------------------

export const GradingPanel: React.FC<GradingPanelProps> = ({
  packetInput,
  sourceText,
  sampleResponse,
  skill,
  expectedSprintRefs,
  onGraded,
  onAddSrsItem,
  initialGraded = null,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const accentSkill: Extract<SkillColor, 'writing' | 'speaking'> =
    skill ??
    (packetInput.kind === 'speaking' || packetInput.kind === 's2' ? 'speaking' : 'writing');

  const packet = useMemo(() => buildGradingPacket(packetInput), [packetInput]);
  const effectiveSourceText = useMemo(
    () => sourceText ?? deriveSourceText(packetInput),
    [sourceText, packetInput],
  );
  const effectiveSprintRefs = useMemo(
    () => expectedSprintRefs ?? deriveExpectedSprintRefs(packetInput),
    [expectedSprintRefs, packetInput],
  );

  const [showPreview, setShowPreview] = useState(false);
  const [clipboardFallback, setClipboardFallback] = useState(false);
  const [copiedPacket, setCopiedPacket] = useState(false);
  const [copiedRepair, setCopiedRepair] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ title: string; description?: string; tone: 'correct' | 'partial' | 'info' } | null>(null);

  const [pastedText, setPastedText] = useState('');
  const [parseFailure, setParseFailure] = useState<ParseGradingFailure | null>(null);
  const [graded, setGraded] = useState<GradingPanelGradedPayload | null>(initialGraded);
  const [addedSrsKeys, setAddedSrsKeys] = useState<Record<string, boolean>>({});

  const pasteInputRef = useRef<HTMLTextAreaElement | null>(null);
  const previewInputRef = useRef<HTMLTextAreaElement | null>(null);
  const copiedRecentlyRef = useRef(false);

  // Reset state if attemptId changes
  useEffect(() => {
    setGraded(initialGraded);
    setParseFailure(null);
    setPastedText('');
    setAddedSrsKeys({});
  }, [packetInput.attemptId, initialGraded]);

  // Auto-focus paste box when returning from Claude tab (docs/games/W1 §10)
  useEffect(() => {
    const onVisibility = () => {
      if (
        document.visibilityState === 'visible' &&
        copiedRecentlyRef.current &&
        !pastedText.trim() &&
        !graded
      ) {
        pasteInputRef.current?.focus();
        copiedRecentlyRef.current = false;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pastedText, graded]);

  const handleCopyPacket = async () => {
    const ok = await copyTextToClipboard(packet.markdown);
    if (ok) {
      setCopiedPacket(true);
      setClipboardFallback(false);
      copiedRecentlyRef.current = true;
      setToastMsg({
        tone: 'correct',
        title: 'Đã copy gói chấm!',
        description: 'Dán vào Claude rồi copy toàn bộ câu trả lời quay lại bước 2.',
      });
      window.setTimeout(() => setCopiedPacket(false), 2000);
    } else {
      setShowPreview(true);
      setClipboardFallback(true);
      setToastMsg({
        tone: 'partial',
        title: 'Trình duyệt chặn tự động copy',
        description: 'Gói chấm đã mở sẵn bên dưới — nhấn Ctrl+C để copy thủ công.',
      });
      window.setTimeout(() => {
        previewInputRef.current?.focus();
        previewInputRef.current?.select();
      }, 50);
    }
  };

  const handleDownloadPacket = () => {
    downloadMarkdownFile(packet.filename, packet.markdown);
    setToastMsg({
      tone: 'info',
      title: `Đã tải ${packet.filename}`,
      description: 'Bạn có thể tải file này lên Claude.ai hoặc dán nội dung vào khung chat.',
    });
  };

  const handlePasteSample = () => {
    if (!sampleResponse) return;
    setPastedText(sampleResponse);
    setParseFailure(null);
  };

  const handleAnalyze = () => {
    const parsed = parseGradingResponse(pastedText, {
      expectedKind: packetInput.kind,
      expectedAttemptId: packetInput.attemptId,
    });

    if (!parsed.ok) {
      setParseFailure(parsed);
      setGraded(null);
      return;
    }

    const postcheck = postcheckGradingResult(parsed.data, {
      sourceText: effectiveSourceText,
      rawObject: parsed.rawObject,
      expectedAttemptId: packetInput.attemptId,
      expectedSprintRefs: effectiveSprintRefs,
    });

    const payload: GradingPanelGradedPayload = {
      parsed,
      postcheck,
      rawResponse: pastedText,
    };
    setParseFailure(null);
    setGraded(payload);
    onGraded?.(payload);
  };

  const handleCopyRepairPrompt = async () => {
    if (!parseFailure) return;
    const ok = await copyTextToClipboard(parseFailure.repairPrompt);
    if (ok) {
      setCopiedRepair(true);
      setToastMsg({
        tone: 'info',
        title: 'Đã copy lời nhắc sửa JSON',
        description: 'Dán câu này gửi lại Claude rồi dán câu trả lời mới vào Bước 2.',
      });
      window.setTimeout(() => setCopiedRepair(false), 2000);
    }
  };

  const activeStep: 1 | 2 | 3 = graded || parseFailure ? 3 : pastedText.trim() ? 2 : 1;

  return (
    <div className={`space-y-5 ${className}`} data-testid="grading-panel">
      {/* Header & 3-Step Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={accentSkill} icon={<Sparkles className="w-3.5 h-3.5" />}>
            Chấm qua Claude chat · 0đ
          </Pill>
          <Pill tone="neutral">{packet.promptVersion}</Pill>
          <Pill tone="neutral">{packet.wordCount} từ</Pill>
        </div>

        <div className="flex items-center gap-1.5 text-xs" aria-label="Tiến trình chấm 3 bước">
          {([
            [1, '1. Copy gói'],
            [2, '2. Dán kết quả'],
            [3, '3. Báo cáo'],
          ] as const).map(([stepNum, label]) => {
            const reached = activeStep >= stepNum;
            return (
              <span
                key={stepNum}
                className="px-2.5 py-1 rounded-full font-medium border"
                style={{
                  backgroundColor: reached
                    ? 'color-mix(in srgb, var(--color-info) 15%, var(--color-surface))'
                    : 'var(--color-surface-2)',
                  borderColor: reached ? 'var(--color-info)' : 'var(--color-border)',
                  color: reached ? 'var(--color-text)' : 'var(--color-text-faint)',
                }}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toastMsg && (
          <Toast
            tone={toastMsg.tone}
            title={toastMsg.title}
            description={toastMsg.description}
            onDismiss={() => setToastMsg(null)}
          />
        )}
      </AnimatePresence>

      {/* STEP 1: Copy / Download Grading Packet */}
      <Card padding="md" skillAccent={accentSkill} className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              Bước 1 · Gói chấm cho Claude
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
              Gói Markdown đã gắn sẵn rubric chuẩn (`{packet.promptVersion}`), đề bài, bài làm và định
              dạng JSON. Không gọi API, không tốn phí.
            </p>
          </div>
          <span
            className="font-mono text-xs px-2 py-1 rounded-[var(--radius-sm)]"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              color: 'var(--color-text-faint)',
            }}
          >
            {packet.attemptId}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            skill={accentSkill}
            leftIcon={copiedPacket ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            onClick={handleCopyPacket}
            data-testid="grading-copy-packet-btn"
          >
            {copiedPacket ? '✓ Đã copy gói chấm' : 'Copy gói chấm'}
          </Button>

          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleDownloadPacket}
            data-testid="grading-download-md-btn"
          >
            Tải .md
          </Button>

          <a
            href="https://claude.ai/new"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="grading-open-claude-link"
            className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm font-medium gap-2 rounded-[var(--radius-md)] border transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)',
            }}
          >
            <span>Mở Claude.ai</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => setShowPreview((v) => !v)}
            data-testid="grading-toggle-preview-btn"
          >
            {showPreview ? 'Ẩn xem trước' : 'Xem trước gói chấm'}
          </Button>
        </div>

        {showPreview && (
          <div className="space-y-1.5">
            {clipboardFallback && (
              <p className="text-xs font-medium" style={{ color: 'var(--color-partial)' }}>
                Chọn tất cả (Ctrl+A) rồi nhấn Ctrl+C để copy gói chấm bên dưới:
              </p>
            )}
            <textarea
              ref={previewInputRef}
              readOnly
              value={packet.markdown}
              rows={10}
              aria-label="Nội dung gói chấm Markdown"
              className="w-full rounded-[var(--radius-md)] border p-3 font-mono text-xs leading-relaxed resize-y"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-dim)',
              }}
            />
          </div>
        )}
      </Card>

      {/* STEP 2: Paste Claude Response */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              Bước 2 · Dán toàn bộ câu trả lời của Claude
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
              Dán nguyên văn cả phần nhận xét tiếng Việt lẫn khối <code>```json</code> cuối cùng —
              app sẽ tự tách, kiểm schema và hậu kiểm trích dẫn.
            </p>
          </div>

          {sampleResponse && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Wand2 className="w-4 h-4" />}
              onClick={handlePasteSample}
              data-testid="grading-paste-sample-btn"
            >
              Dán kết quả mẫu
            </Button>
          )}
        </div>

        <textarea
          ref={pasteInputRef}
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          rows={7}
          placeholder="Dán toàn bộ câu trả lời của Claude vào đây (bao gồm cả khối ```json ... ``` ở cuối)..."
          aria-label="Ô dán câu trả lời từ Claude"
          data-testid="grading-paste-input"
          className="w-full rounded-[var(--radius-md)] border p-3.5 text-sm leading-relaxed font-mono resize-y"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            skill={accentSkill}
            leftIcon={<ClipboardCheck className="w-4 h-4" />}
            onClick={handleAnalyze}
            disabled={!pastedText.trim()}
            data-testid="grading-parse-btn"
          >
            Phân tích & Lưu kết quả
          </Button>

          {pastedText.trim() && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={() => {
                setPastedText('');
                setParseFailure(null);
              }}
            >
              Xoá ô dán
            </Button>
          )}
        </div>
      </Card>

      {/* STEP 3A: Parse Error + 1-click Repair Prompt */}
      <AnimatePresence mode="wait">
        {parseFailure && (
          <motion.div
            key="grading-error"
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.base, ease: ease.out }}
          >
            <Card
              padding="md"
              className="space-y-4"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: 'var(--color-wrong)',
              }}
              data-testid="grading-error-box"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: 'var(--color-wrong)' }}
                />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    JSON chưa đúng định dạng ({parseFailure.errorCode})
                  </h4>
                  <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                    {parseFailure.messageVi}
                  </p>
                </div>
              </div>

              {parseFailure.issues.length > 0 && (
                <ul
                  className="rounded-[var(--radius-sm)] border p-3 space-y-1 text-xs font-mono"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-wrong)',
                  }}
                >
                  {parseFailure.issues.slice(0, 8).map((iss, idx) => (
                    <li key={idx}>
                      • {iss.path ? `${iss.path}: ` : ''}
                      {iss.message}
                    </li>
                  ))}
                </ul>
              )}

              <div
                className="rounded-[var(--radius-sm)] border p-3 text-xs space-y-2"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  Lời nhắc sửa sẵn (gửi lại cho Claude):
                </p>
                <p className="font-mono" style={{ color: 'var(--color-text-dim)' }}>
                  {parseFailure.repairPrompt}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={copiedRepair ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  onClick={handleCopyRepairPrompt}
                  data-testid="grading-copy-repair-btn"
                >
                  {copiedRepair ? '✓ Đã copy lời nhắc sửa' : 'Copy lời nhắc sửa gửi lại Claude'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* STEP 3B: Parsed & Post-checked Report */}
        {graded && (
          <motion.div
            key="grading-report"
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.base, ease: ease.out }}
            className="space-y-4"
            data-testid="grading-report"
          >
            {/* Overview Header */}
            <Card padding="lg" skillAccent={accentSkill} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="correct" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                      Đã phân tích & hậu kiểm
                    </Pill>
                    {!isSprintResult(graded.postcheck.cleanedResult) && (
                      <Pill tone="neutral">
                        {confidenceLabelVi(graded.postcheck.cleanedResult.confidence)}
                      </Pill>
                    )}
                    <Pill tone="neutral">{graded.postcheck.appWordCount} từ (app đếm)</Pill>
                  </div>
                  <h3 className="text-lg font-bold pt-1" style={{ color: 'var(--color-text)' }}>
                    Bước 3 · Báo cáo kết quả chi tiết
                  </h3>
                </div>

                {graded.postcheck.computedOverallBand !== null && (
                  <div
                    className="rounded-[var(--radius-md)] border px-4 py-2.5 text-center"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-dim)' }}>
                      Band ước tính
                    </p>
                    <p
                      className="font-mono text-2xl font-extrabold tabular-nums"
                      style={{ color: getBandColorVar(graded.postcheck.computedOverallBand) }}
                      data-testid="grading-overall-band"
                    >
                      {graded.postcheck.computedOverallBand.toFixed(1)}
                    </p>
                  </div>
                )}
              </div>

              {/* Post-check warnings */}
              {graded.postcheck.warnings.length > 0 && (
                <div className="space-y-2" data-testid="grading-postcheck-warnings">
                  {graded.postcheck.warnings.map((w, idx) => {
                    const color =
                      w.severity === 'error'
                        ? 'var(--color-wrong)'
                        : w.severity === 'warning'
                          ? 'var(--color-partial)'
                          : 'var(--color-info)';
                    const Icon = w.severity === 'info' ? Info : AlertTriangle;
                    return (
                      <div
                        key={`${w.code}-${idx}`}
                        className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border p-3 text-xs"
                        style={{
                          backgroundColor: 'var(--color-surface-2)',
                          borderColor: 'var(--color-border)',
                          borderLeftWidth: '3px',
                          borderLeftColor: color,
                          color: 'var(--color-text)',
                        }}
                      >
                        <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color }} />
                        <span>{w.messageVi}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Writing 4 Criteria */}
              {isWritingResult(graded.postcheck.cleanedResult) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {WRITING_CRITERIA_META.map((meta) => {
                    const result = graded.postcheck.cleanedResult;
                    if (!isWritingResult(result)) return null;
                    const label = result.kind === 'task1' ? meta.task1Label : meta.task2Label;
                    return (
                      <CriterionRow
                        key={meta.key}
                        code={meta.short}
                        label={label}
                        feedback={result.criteria[meta.key]}
                        defaultOpen={result.criteria[meta.key].issues.some(
                          (i) => i.severity === 'high',
                        )}
                      />
                    );
                  })}
                </div>
              )}

              {/* Speaking 4 Criteria */}
              {isSpeakingResult(graded.postcheck.cleanedResult) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SPEAKING_CRITERIA_META.map((meta) => {
                      const result = graded.postcheck.cleanedResult;
                      if (!isSpeakingResult(result)) return null;
                      return (
                        <CriterionRow
                          key={meta.key}
                          code={meta.short}
                          label={meta.label}
                          feedback={result.criteria[meta.key]}
                          defaultOpen={result.criteria[meta.key].issues.some(
                            (i) => i.severity === 'high',
                          )}
                        />
                      );
                    })}
                  </div>

                  {graded.postcheck.cleanedResult.partNotes.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {graded.postcheck.cleanedResult.partNotes.map((pn) => (
                        <div
                          key={pn.part}
                          className="rounded-[var(--radius-sm)] border p-3 text-xs space-y-1"
                          style={{
                            backgroundColor: 'var(--color-surface-2)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <span className="font-bold" style={{ color: 'var(--color-speaking)' }}>
                            Part {pn.part}
                          </span>
                          <p style={{ color: 'var(--color-text-dim)' }}>{pn.noteVi}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sprint Items */}
              {isSprintResult(graded.postcheck.cleanedResult) && (
                <div className="space-y-3">
                  {graded.postcheck.cleanedResult.items.map((item) => (
                    <div
                      key={item.ref}
                      className="rounded-[var(--radius-md)] border p-4 space-y-2.5"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className="font-mono text-xs font-bold"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {item.ref}
                        </span>
                        <div
                          className="flex items-center gap-0.5"
                          aria-label={`${item.stars} trên 3 sao`}
                        >
                          {[1, 2, 3].map((n) => (
                            <Star
                              key={n}
                              className="w-4 h-4"
                              style={{
                                color:
                                  n <= item.stars
                                    ? 'var(--color-writing)'
                                    : 'var(--color-text-faint)',
                                fill: n <= item.stars ? 'var(--color-writing)' : 'transparent',
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(item.checks).map(([k, ok]) => (
                          <Pill key={k} tone={ok ? 'correct' : 'wrong'} size="sm">
                            {ok ? '✓' : '✗'} {k}
                          </Pill>
                        ))}
                      </div>

                      <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                        {item.tipVi}
                      </p>

                      {item.betterChunk && (
                        <div
                          className="rounded-[var(--radius-sm)] border p-2.5 text-xs space-y-1"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <p className="font-mono" style={{ color: 'var(--color-text-faint)' }}>
                            Gốc: &ldquo;{item.betterChunk.original}&rdquo;
                          </p>
                          <p className="font-mono font-medium" style={{ color: 'var(--color-correct)' }}>
                            Nâng cấp: &ldquo;{item.betterChunk.better}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Top 3 Priorities + Upgrades + SRS Items (Writing & Speaking) */}
            {!isSprintResult(graded.postcheck.cleanedResult) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card padding="md" className="space-y-3">
                  <h4 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    3 ưu tiên tăng band nhanh nhất
                  </h4>
                  <ol className="space-y-2.5">
                    {graded.postcheck.cleanedResult.topPriorities.map((p, idx) => (
                      <li
                        key={idx}
                        className="rounded-[var(--radius-sm)] border p-3 space-y-1"
                        style={{
                          backgroundColor: 'var(--color-surface-2)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Pill tone={accentSkill} size="sm">
                            #{idx + 1} · {p.criterion}
                          </Pill>
                          <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                            {p.titleVi}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                          {p.actionVi}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Card>

                <Card padding="md" className="space-y-3">
                  <h4 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    Nâng cấp câu & Thẻ ôn tập ({graded.postcheck.cleanedResult.upgrades.length} câu ·{' '}
                    {graded.postcheck.cleanedResult.srsItems.length} thẻ)
                  </h4>

                  <div className="space-y-2.5">
                    {graded.postcheck.cleanedResult.upgrades.map((u, idx) => (
                      <div
                        key={idx}
                        className="rounded-[var(--radius-sm)] border p-3 text-xs space-y-1"
                        style={{
                          backgroundColor: 'var(--color-surface-2)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        <Pill tone="neutral" size="sm">
                          {u.criterion}
                        </Pill>
                        <p className="font-mono" style={{ color: 'var(--color-text-faint)' }}>
                          Gốc: {u.original}
                        </p>
                        <p className="font-mono font-medium" style={{ color: 'var(--color-correct)' }}>
                          Band 8: {u.upgraded}
                        </p>
                        <p style={{ color: 'var(--color-text-dim)' }}>{u.noteVi}</p>
                      </div>
                    ))}

                    {graded.postcheck.cleanedResult.srsItems.map((item, idx) => {
                      const itemKey = `${item.kind}:${item.front}`;
                      const added = Boolean(addedSrsKeys[itemKey]);
                      return (
                        <div
                          key={itemKey + idx}
                          className="flex items-start justify-between gap-3 rounded-[var(--radius-sm)] border p-2.5 text-xs"
                          style={{
                            backgroundColor: 'var(--color-surface-2)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Pill tone="vocab" size="sm">
                                {item.kind}
                              </Pill>
                              <span className="font-mono font-semibold" style={{ color: 'var(--color-text)' }}>
                                {item.back}
                              </span>
                            </div>
                            <p style={{ color: 'var(--color-text-dim)' }}>{item.noteVi}</p>
                          </div>

                          {onAddSrsItem && (
                            <Button
                              size="sm"
                              variant={added ? 'ghost' : 'secondary'}
                              disabled={added}
                              leftIcon={added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              onClick={() => {
                                onAddSrsItem(item);
                                setAddedSrsKeys((prev) => ({ ...prev, [itemKey]: true }));
                              }}
                            >
                              {added ? 'Đã thêm' : 'SRS'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
