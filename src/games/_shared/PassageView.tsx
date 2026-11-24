import React, { useMemo, useState } from 'react';
import { BookOpen, FileText, HelpCircle, Minus, MousePointerClick, Plus } from 'lucide-react';
import type { ReadingPassage, Span } from '../../core/content/schemas';
import {
  Highlighter,
  Pill,
  type TextSpan,
} from '../../design/components';

export type PassageMobileTab = 'passage' | 'question';

export interface PassageViewProps {
  passage: Pick<
    ReadingPassage,
    'title' | 'subtitle' | 'level' | 'paragraphs' | 'glossary' | 'wordCount'
  >;
  highlighterMode?: 'evidence' | 'exam' | 'readonly';
  /** User-selected evidence spans across paragraphs (light blue) */
  userEvidence?: readonly Span[];
  /** Gold/correct evidence spans revealed after grading (yellow, auto-scrolls) */
  answerEvidence?: readonly Span[];
  /** Exam mode highlights keyed by paragraph label */
  examHighlightsByPara?: Readonly<Record<string, readonly TextSpan[]>>;
  /** Called when learner selects an evidence span */
  onSelectEvidence?: (span: Span) => void;
  /** Exam mode highlight callbacks */
  onAddExamHighlight?: (paragraph: string, span: TextSpan) => void;
  onUpdateExamNote?: (paragraph: string, spanId: string, note: string) => void;
  onRemoveExamHighlight?: (paragraph: string, spanId: string) => void;
  /** Show glossary toggle button (training low levels only, never in exam) */
  allowGlossary?: boolean;
  defaultShowGlossary?: boolean;
  /** Highlight a specific paragraph label as a hint (Level 1-4) */
  hintedParagraph?: string | null;
  /** Controlled or uncontrolled "click a sentence to select it" helper */
  clickSelectsSentence?: boolean;
  onToggleClickSelectsSentence?: (next: boolean) => void;
  /** Optional controlled mobile tab (< 900px) */
  activeMobileTab?: PassageMobileTab;
  onMobileTabChange?: (tab: PassageMobileTab) => void;
  /** Header label for passage pane */
  passageHeading?: string;
  /** Label for question tab on < 900px */
  questionTabLabel?: string;
  /** Optional indicator count on question tab */
  questionTabBadge?: string;
  /** Right column content (question card / controls). If omitted, renders single column. */
  children?: React.ReactNode;
  className?: string;
}

const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 22;

export const PassageView: React.FC<PassageViewProps> = ({
  passage,
  highlighterMode = 'evidence',
  userEvidence = [],
  answerEvidence = [],
  examHighlightsByPara = {},
  onSelectEvidence,
  onAddExamHighlight,
  onUpdateExamNote,
  onRemoveExamHighlight,
  allowGlossary = false,
  defaultShowGlossary = false,
  hintedParagraph = null,
  clickSelectsSentence,
  onToggleClickSelectsSentence,
  activeMobileTab,
  onMobileTabChange,
  passageHeading,
  questionTabLabel = 'Câu hỏi',
  questionTabBadge,
  children,
  className = '',
}) => {
  const [internalTab, setInternalTab] = useState<PassageMobileTab>('passage');
  const [internalSentenceClick, setInternalSentenceClick] = useState(false);
  const [showGlossary, setShowGlossary] = useState(defaultShowGlossary);
  const [fontSizePx, setFontSizePx] = useState(18);

  const currentTab = activeMobileTab ?? internalTab;
  const setTab = (tab: PassageMobileTab) => {
    if (onMobileTabChange) onMobileTabChange(tab);
    else setInternalTab(tab);
  };

  const isSentenceClick = clickSelectsSentence ?? internalSentenceClick;
  const toggleSentenceClick = () => {
    const next = !isSentenceClick;
    if (onToggleClickSelectsSentence) onToggleClickSelectsSentence(next);
    else setInternalSentenceClick(next);
  };

  const userSpansByPara = useMemo(() => {
    const map: Record<string, TextSpan[]> = {};
    for (const sp of userEvidence) {
      if (!map[sp.paragraph]) map[sp.paragraph] = [];
      map[sp.paragraph].push({ start: sp.start, end: sp.end, quote: sp.quote });
    }
    return map;
  }, [userEvidence]);

  const answerSpansByPara = useMemo(() => {
    const map: Record<string, TextSpan[]> = {};
    for (const sp of answerEvidence) {
      if (!map[sp.paragraph]) map[sp.paragraph] = [];
      map[sp.paragraph].push({ start: sp.start, end: sp.end, quote: sp.quote });
    }
    return map;
  }, [answerEvidence]);

  const hasGlossary = allowGlossary && Boolean(passage.glossary && passage.glossary.length > 0);
  const activeGlossaryTerms = hasGlossary && showGlossary ? passage.glossary ?? [] : [];

  const passagePane = (
    <section
      aria-label="Bài đọc"
      className="rounded-[var(--radius-lg)] border flex flex-col min-h-0"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Passage toolbar */}
      <div
        className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2 shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--color-reading)' }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider truncate"
            style={{ color: 'var(--color-text-dim)' }}
          >
            {passageHeading ?? `${passage.level} · ${passage.wordCount} từ`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {highlighterMode === 'evidence' && (
            <button
              type="button"
              onClick={toggleSentenceClick}
              aria-pressed={isSentenceClick}
              data-testid="toggle-sentence-select"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-[var(--radius-sm)] border text-xs font-medium cursor-pointer transition-colors"
              style={{
                backgroundColor: isSentenceClick
                  ? 'color-mix(in srgb, var(--color-info) 16%, var(--color-surface))'
                  : 'var(--color-surface-2)',
                borderColor: isSentenceClick ? 'var(--color-info)' : 'var(--color-border)',
                color: isSentenceClick ? 'var(--color-text)' : 'var(--color-text-dim)',
              }}
              title="Chạm/click một câu bất kỳ để bôi cả câu làm vật chứng"
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>Chọn câu</span>
            </button>
          )}

          {hasGlossary && (
            <button
              type="button"
              onClick={() => setShowGlossary((v) => !v)}
              aria-pressed={showGlossary}
              data-testid="toggle-glossary"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-[var(--radius-sm)] border text-xs font-medium cursor-pointer transition-colors"
              style={{
                backgroundColor: showGlossary
                  ? 'color-mix(in srgb, var(--color-reading) 16%, var(--color-surface))'
                  : 'var(--color-surface-2)',
                borderColor: showGlossary ? 'var(--color-reading)' : 'var(--color-border)',
                color: showGlossary ? 'var(--color-text)' : 'var(--color-text-dim)',
              }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Glossary ({passage.glossary?.length ?? 0})</span>
            </button>
          )}

          {/* Font size adjuster 16..22px — never shifts char offsets */}
          <div
            className="inline-flex items-center rounded-[var(--radius-sm)] border overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
            }}
          >
            <button
              type="button"
              onClick={() => setFontSizePx((s) => Math.max(MIN_FONT_SIZE, s - 1))}
              disabled={fontSizePx <= MIN_FONT_SIZE}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-xs cursor-pointer disabled:opacity-40"
              style={{ color: 'var(--color-text-dim)' }}
              aria-label="Giảm cỡ chữ bài đọc"
              title="Giảm cỡ chữ"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span
              className="px-1.5 text-xs font-semibold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            >
              {fontSizePx}
            </span>
            <button
              type="button"
              onClick={() => setFontSizePx((s) => Math.min(MAX_FONT_SIZE, s + 1))}
              disabled={fontSizePx >= MAX_FONT_SIZE}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-xs cursor-pointer disabled:opacity-40"
              style={{ color: 'var(--color-text-dim)' }}
              aria-label="Tăng cỡ chữ bài đọc"
              title="Tăng cỡ chữ"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible glossary panel */}
      {hasGlossary && showGlossary && passage.glossary && (
        <div
          className="px-5 py-3 border-b space-y-1.5"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-reading) 6%, var(--color-surface-2))',
            borderColor: 'var(--color-border)',
          }}
          data-testid="passage-glossary-panel"
        >
          <div className="text-xs font-semibold" style={{ color: 'var(--color-reading)' }}>
            Từ vựng hỗ trợ (Level thấp)
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {passage.glossary.map((g) => (
              <span key={g.term} style={{ color: 'var(--color-text)' }}>
                <strong>{g.term}:</strong>{' '}
                <span style={{ color: 'var(--color-text-dim)' }}>{g.meaningVi}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable passage body */}
      <div
        tabIndex={0}
        aria-label="Nội dung bài đọc"
        className="p-5 sm:p-6 space-y-5 overflow-y-auto min-[900px]:max-h-[calc(100vh-190px)] focus:outline-none focus-visible:ring-2"
      >
        <header className="space-y-1.5 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2
            className="text-xl sm:text-2xl font-bold leading-snug"
            style={{ color: 'var(--color-text)' }}
          >
            {passage.title}
          </h2>
          {passage.subtitle && (
            <p className="text-sm italic" style={{ color: 'var(--color-text-dim)' }}>
              {passage.subtitle}
            </p>
          )}
        </header>

        <div className="space-y-5">
          {passage.paragraphs.map((para) => {
            const isHinted = hintedParagraph === para.label;
            return (
              <div key={para.label} className="flex items-start gap-3 sm:gap-4">
                <div className="sticky top-2 shrink-0 pt-1">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] border text-xs font-bold"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: isHinted
                        ? 'color-mix(in srgb, var(--color-reading) 18%, var(--color-surface))'
                        : 'var(--color-surface-2)',
                      borderColor: isHinted ? 'var(--color-reading)' : 'var(--color-border)',
                      color: isHinted ? 'var(--color-reading)' : 'var(--color-text-dim)',
                    }}
                  >
                    {para.label}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <Highlighter
                    paragraphLabel={para.label}
                    text={para.text}
                    mode={highlighterMode}
                    clickSelectsSentence={isSentenceClick}
                    userSpans={userSpansByPara[para.label]}
                    answerSpans={answerSpansByPara[para.label]}
                    examHighlights={examHighlightsByPara[para.label]}
                    glossaryTerms={activeGlossaryTerms}
                    fontSizePx={fontSizePx}
                    hinted={isHinted}
                    onSelectSpan={(sp) =>
                      onSelectEvidence?.({
                        paragraph: para.label,
                        start: sp.start,
                        end: sp.end,
                        quote: sp.quote ?? para.text.slice(sp.start, sp.end),
                      })
                    }
                    onAddExamHighlight={(sp) => onAddExamHighlight?.(para.label, sp)}
                    onUpdateExamNote={(id, note) => onUpdateExamNote?.(para.label, id, note)}
                    onRemoveExamHighlight={(id) => onRemoveExamHighlight?.(para.label, id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  if (!children) {
    return <div className={className}>{passagePane}</div>;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mobile / Narrow (< 900px) tab bar: "Bài đọc | Câu hỏi" */}
      <div
        className="min-[900px]:hidden flex items-center gap-1 p-1 rounded-[var(--radius-md)] border"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          borderColor: 'var(--color-border)',
        }}
        role="tablist"
        aria-label="Chuyển giữa Bài đọc và Câu hỏi"
      >
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'passage'}
          onClick={() => setTab('passage')}
          data-testid="mobile-tab-passage"
          className="flex-1 min-h-[44px] px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
          style={{
            backgroundColor: currentTab === 'passage' ? 'var(--color-surface)' : 'transparent',
            color: currentTab === 'passage' ? 'var(--color-text)' : 'var(--color-text-dim)',
          }}
        >
          <FileText className="w-4 h-4" />
          <span>Bài đọc</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'question'}
          onClick={() => setTab('question')}
          data-testid="mobile-tab-question"
          className="flex-1 min-h-[44px] px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
          style={{
            backgroundColor: currentTab === 'question' ? 'var(--color-surface)' : 'transparent',
            color: currentTab === 'question' ? 'var(--color-text)' : 'var(--color-text-dim)',
          }}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{questionTabLabel}</span>
          {questionTabBadge && <Pill tone="neutral">{questionTabBadge}</Pill>}
        </button>
      </div>

      {/* Responsive 2-column split on >= 900px (and 7/5 on >= 1024px) */}
      <div className="min-[900px]:grid min-[900px]:grid-cols-12 min-[900px]:gap-5 items-start">
        <div
          className={`min-[900px]:col-span-6 lg:col-span-7 ${
            currentTab === 'passage' ? 'block' : 'hidden min-[900px]:block'
          }`}
        >
          {passagePane}
        </div>
        <div
          className={`min-[900px]:col-span-6 lg:col-span-5 min-[900px]:max-h-[calc(100vh-190px)] min-[900px]:overflow-y-auto ${
            currentTab === 'question' ? 'block' : 'hidden min-[900px]:block'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
