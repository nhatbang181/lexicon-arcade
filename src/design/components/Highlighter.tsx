import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Highlighter as HighlighterIcon, StickyNote, Trash2, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export interface TextSpan {
  start: number;
  end: number;
  quote?: string;
  note?: string;
  id?: string;
}

export interface GlossaryEntry {
  term: string;
  meaningVi: string;
}

export interface HighlighterProps {
  paragraphLabel: string;
  text: string;
  /** User-selected evidence spans (light blue) */
  userSpans?: readonly TextSpan[];
  /** Gold/answer spans revealed after grading (yellow, auto-scrolls into view) */
  answerSpans?: readonly TextSpan[];
  /** Exam mode highlights with optional learner notes */
  examHighlights?: readonly TextSpan[];
  /** Interaction mode */
  mode?: 'evidence' | 'exam' | 'readonly';
  /** When true, clicking anywhere inside a sentence selects that full sentence */
  clickSelectsSentence?: boolean;
  /** Fired when user selects a span in evidence mode */
  onSelectSpan?: (span: TextSpan) => void;
  /** Fired when user adds a highlight in exam mode */
  onAddExamHighlight?: (span: TextSpan) => void;
  /** Fired when user updates a note on an exam highlight */
  onUpdateExamNote?: (spanId: string, note: string) => void;
  /** Fired when user removes an exam highlight */
  onRemoveExamHighlight?: (spanId: string) => void;
  /** Scroll to the first answerSpan when it appears */
  autoScrollToAnswer?: boolean;
  /** Custom reading font size in px (16..22) */
  fontSizePx?: number;
  /** Optional glossary terms shown as subtle dotted underlines with tooltips */
  glossaryTerms?: readonly GlossaryEntry[];
  /** Visually highlight paragraph when paragraph hint is active */
  hinted?: boolean;
  className?: string;
}

const ABBREVIATION_ENDINGS = /(?:Dr|Mr|Mrs|Ms|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|U\.S|U\.K|Fig|No)\.$/i;

/**
 * Compute half-open character bounds [start, end) of the sentence containing `offset`.
 * Handles decimals (e.g. 10.5) and common English abbreviations.
 */
export function findSentenceBounds(text: string, offset: number): { start: number; end: number } {
  if (!text.length) return { start: 0, end: 0 };
  const clamped = Math.max(0, Math.min(text.length - 1, offset));

  const boundaries: number[] = [0];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== '.' && ch !== '!' && ch !== '?') continue;

    // Skip decimal numbers like 3.5 or 10.2%
    if (ch === '.' && i > 0 && i + 1 < text.length && /\d/.test(text[i - 1]) && /\d/.test(text[i + 1])) {
      continue;
    }

    const next = text[i + 1];
    const isEndOfText = next === undefined;
    const followedBySpaceOrQuote =
      next === ' ' || next === '\n' || next === '\t' || next === '"' || next === '\u201d' || next === ')';

    if (!isEndOfText && !followedBySpaceOrQuote) continue;

    const sliceUpToDot = text.slice(Math.max(0, i - 10), i + 1);
    if (ch === '.' && ABBREVIATION_ENDINGS.test(sliceUpToDot)) {
      continue;
    }

    let endIdx = i + 1;
    while (endIdx < text.length && (text[endIdx] === '"' || text[endIdx] === '\u201d' || text[endIdx] === ')')) {
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
    while (segStart < segEnd && /\s/.test(text[segStart])) {
      segStart++;
    }
    let trimmedEnd = segEnd;
    while (trimmedEnd > segStart && /\s/.test(text[trimmedEnd - 1])) {
      trimmedEnd--;
    }
    if (clamped >= boundaries[b] && clamped < segEnd) {
      return { start: segStart, end: Math.max(segStart, trimmedEnd) };
    }
  }

  return { start: 0, end: text.length };
}

/** Tách đoạn văn thành danh sách câu không trùng nhau để điều hướng bằng phím ↑/↓ + Enter (R1-5). */
export function splitParagraphSentences(text: string): TextSpan[] {
  const sentences: TextSpan[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
    if (cursor >= text.length) break;
    const bounds = findSentenceBounds(text, cursor);
    const trimmed = trimTextSpan(text, bounds.start, bounds.end);
    if (trimmed) {
      const prev = sentences[sentences.length - 1];
      if (!prev || trimmed.start >= prev.end) {
        sentences.push(trimmed);
      }
    }
    cursor = Math.max(cursor + 1, bounds.end + 1);
  }
  return sentences;
}

/** Trim leading/trailing whitespace from a character span so quote matches exact non-space text. */
export function trimTextSpan(text: string, start: number, end: number): TextSpan | null {
  let s = Math.max(0, Math.min(text.length, Math.min(start, end)));
  let e = Math.max(0, Math.min(text.length, Math.max(start, end)));
  while (s < e && /\s/.test(text[s])) s++;
  while (e > s && /\s/.test(text[e - 1])) e--;
  if (e <= s) return null;
  return { start: s, end: e, quote: text.slice(s, e) };
}

interface RenderSegment {
  start: number;
  end: number;
  text: string;
  isUser: boolean;
  isAnswer: boolean;
  examSpan?: TextSpan;
  glossary?: GlossaryEntry;
}

function findGlossaryMatches(
  text: string,
  glossaryTerms: readonly GlossaryEntry[],
): Array<{ start: number; end: number; entry: GlossaryEntry }> {
  if (!glossaryTerms.length) return [];
  const lower = text.toLowerCase();
  const matches: Array<{ start: number; end: number; entry: GlossaryEntry }> = [];
  for (const entry of glossaryTerms) {
    const needle = entry.term.trim().toLowerCase();
    if (!needle) continue;
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(needle, from);
      if (idx === -1) break;
      const before = idx > 0 ? lower[idx - 1] : ' ';
      const after = idx + needle.length < lower.length ? lower[idx + needle.length] : ' ';
      if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) {
        matches.push({ start: idx, end: idx + needle.length, entry });
        break; // annotate first occurrence per paragraph
      }
      from = idx + needle.length;
    }
  }
  return matches;
}

function buildSegments(
  text: string,
  userSpans: readonly TextSpan[],
  answerSpans: readonly TextSpan[],
  examHighlights: readonly TextSpan[],
  glossaryTerms: readonly GlossaryEntry[],
): RenderSegment[] {
  const glossaryMatches = findGlossaryMatches(text, glossaryTerms);
  const cuts = new Set<number>([0, text.length]);

  const addCut = (s: number, e: number) => {
    const cs = Math.max(0, Math.min(text.length, s));
    const ce = Math.max(0, Math.min(text.length, e));
    if (ce > cs) {
      cuts.add(cs);
      cuts.add(ce);
    }
  };

  for (const sp of userSpans) addCut(sp.start, sp.end);
  for (const sp of answerSpans) addCut(sp.start, sp.end);
  for (const sp of examHighlights) addCut(sp.start, sp.end);
  for (const gm of glossaryMatches) addCut(gm.start, gm.end);

  const sortedCuts = Array.from(cuts).sort((a, b) => a - b);
  const segments: RenderSegment[] = [];

  for (let i = 0; i < sortedCuts.length - 1; i++) {
    const start = sortedCuts[i];
    const end = sortedCuts[i + 1];
    if (end <= start) continue;

    const isUser = userSpans.some((sp) => sp.start <= start && sp.end >= end);
    const isAnswer = answerSpans.some((sp) => sp.start <= start && sp.end >= end);
    const examSpan = examHighlights.find((sp) => sp.start <= start && sp.end >= end);
    const glossary = glossaryMatches.find((gm) => gm.start <= start && gm.end >= end)?.entry;

    segments.push({
      start,
      end,
      text: text.slice(start, end),
      isUser,
      isAnswer,
      examSpan,
      glossary,
    });
  }

  return segments;
}

function getOffsetFromNode(container: HTMLElement, node: Node, nodeOffset: number): number | null {
  let el: HTMLElement | null =
    node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
  while (el && el !== container && !el.dataset.charStart) {
    el = el.parentElement;
  }
  if (!el || !el.dataset.charStart) return null;
  const baseStart = Number(el.dataset.charStart);
  const baseEnd = Number(el.dataset.charEnd ?? baseStart);
  if (!Number.isFinite(baseStart)) return null;
  return Math.max(baseStart, Math.min(baseEnd, baseStart + nodeOffset));
}

export const Highlighter: React.FC<HighlighterProps> = ({
  paragraphLabel,
  text,
  userSpans = [],
  answerSpans = [],
  examHighlights = [],
  mode = 'evidence',
  clickSelectsSentence = false,
  onSelectSpan,
  onAddExamHighlight,
  onUpdateExamNote,
  onRemoveExamHighlight,
  autoScrollToAnswer = true,
  fontSizePx,
  glossaryTerms = [],
  hinted = false,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const answerMarkRef = useRef<HTMLElement | null>(null);

  const [pendingExamSpan, setPendingExamSpan] = useState<TextSpan | null>(null);
  const [editingNoteSpanId, setEditingNoteSpanId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [focusedSentenceIdx, setFocusedSentenceIdx] = useState<number>(-1);
  const pointerDownRef = useRef<boolean>(false);

  const segments = useMemo(
    () => buildSegments(text, userSpans, answerSpans, examHighlights, glossaryTerms),
    [text, userSpans, answerSpans, examHighlights, glossaryTerms],
  );

  const sentences = useMemo(() => splitParagraphSentences(text), [text]);

  // Auto-scroll to revealed yellow answer span
  const answerKey = answerSpans.map((s) => `${s.start}-${s.end}`).join(',');
  useEffect(() => {
    if (!autoScrollToAnswer || answerSpans.length === 0) return;
    const el = answerMarkRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'center',
      });
    }
  }, [answerKey, answerSpans.length, autoScrollToAnswer, prefersReduced]);

  const readSelectionSpan = useCallback((): TextSpan | null => {
    if (typeof window === 'undefined' || !containerRef.current) return null;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    if (
      !containerRef.current.contains(range.startContainer) ||
      !containerRef.current.contains(range.endContainer)
    ) {
      return null;
    }
    const start = getOffsetFromNode(containerRef.current, range.startContainer, range.startOffset);
    const end = getOffsetFromNode(containerRef.current, range.endContainer, range.endOffset);
    if (start === null || end === null) return null;
    return trimTextSpan(text, start, end);
  }, [text]);

  const handlePointerFinish = useCallback(
    (e?: React.SyntheticEvent<HTMLDivElement>) => {
      pointerDownRef.current = false;
      if (mode === 'readonly') return;
      const span = readSelectionSpan();
      if (span) {
        if (mode === 'evidence') {
          onSelectSpan?.(span);
          window.getSelection()?.removeAllRanges();
        } else if (mode === 'exam') {
          setPendingExamSpan(span);
        }
        return;
      }

      // If no drag selection and sentence-click mode is active, select the clicked/tapped sentence
      if (mode === 'evidence' && clickSelectsSentence && containerRef.current) {
        let offset: number | null = null;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          if (containerRef.current.contains(range.startContainer)) {
            offset = getOffsetFromNode(containerRef.current, range.startContainer, range.startOffset);
          }
        }
        // Fallback cho cảm ứng mobile khi tap không tạo selection range (R1-5)
        if (offset === null && e?.target instanceof Node) {
          offset = getOffsetFromNode(containerRef.current, e.target, 0);
        }
        if (offset !== null) {
          const bounds = findSentenceBounds(text, offset);
          const trimmed = trimTextSpan(text, bounds.start, bounds.end);
          if (trimmed) {
            onSelectSpan?.(trimmed);
          }
        }
      }
    },
    [clickSelectsSentence, mode, onSelectSpan, readSelectionSpan, text],
  );

  // R1-5: lắng nghe selectionchange cho thao tác kéo tay cầm chọn chữ trên iOS/Android
  useEffect(() => {
    if (mode === 'readonly' || typeof document === 'undefined') return;
    let timer: number | undefined;
    const onSelectionChange = () => {
      if (pointerDownRef.current) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const span = readSelectionSpan();
        if (!span) return;
        if (mode === 'exam') {
          setPendingExamSpan(span);
        }
      }, 180);
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [mode, readSelectionSpan]);

  // R1-5: Điều hướng bàn phím theo câu (↑/↓ di chuyển, Enter/Space để bôi câu đang chọn)
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (mode !== 'evidence' || !clickSelectsSentence || sentences.length === 0) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedSentenceIdx((idx) => (idx < 0 ? 0 : Math.min(sentences.length - 1, idx + 1)));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedSentenceIdx((idx) => (idx <= 0 ? 0 : idx - 1));
      } else if (e.key === 'Enter' || e.key === ' ') {
        const targetIdx = focusedSentenceIdx >= 0 ? focusedSentenceIdx : 0;
        const sent = sentences[targetIdx];
        if (sent) {
          e.preventDefault();
          onSelectSpan?.(sent);
        }
      }
    },
    [clickSelectsSentence, focusedSentenceIdx, mode, onSelectSpan, sentences],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (mode !== 'exam') return;
      const span = readSelectionSpan();
      if (!span) return;
      e.preventDefault();
      onAddExamHighlight?.({
        ...span,
        id: `hl-${paragraphLabel}-${span.start}-${span.end}-${Date.now()}`,
      });
      setPendingExamSpan(null);
      window.getSelection()?.removeAllRanges();
    },
    [mode, onAddExamHighlight, paragraphLabel, readSelectionSpan],
  );

  const commitPendingExamHighlight = (withNote: boolean) => {
    if (!pendingExamSpan) return;
    const id = `hl-${paragraphLabel}-${pendingExamSpan.start}-${pendingExamSpan.end}-${Date.now()}`;
    onAddExamHighlight?.({ ...pendingExamSpan, id, note: '' });
    setPendingExamSpan(null);
    window.getSelection()?.removeAllRanges();
    if (withNote) {
      setEditingNoteSpanId(id);
      setNoteDraft('');
    }
  };

  const openNoteEditor = (span: TextSpan) => {
    if (!span.id) return;
    setEditingNoteSpanId(span.id);
    setNoteDraft(span.note ?? '');
  };

  const saveNote = () => {
    if (editingNoteSpanId) {
      onUpdateExamNote?.(editingNoteSpanId, noteDraft.trim());
    }
    setEditingNoteSpanId(null);
    setNoteDraft('');
  };

  let assignedAnswerRef = false;
  const activeEditingSpan = editingNoteSpanId
    ? examHighlights.find((s) => s.id === editingNoteSpanId)
    : undefined;

  return (
    <div
      className={`relative rounded-[var(--radius-md)] transition-colors ${className}`}
      style={{
        backgroundColor: hinted
          ? 'color-mix(in srgb, var(--color-reading) 8%, transparent)'
          : 'transparent',
        boxShadow: hinted ? 'inset 3px 0 0 var(--color-reading)' : 'none',
        paddingLeft: hinted ? '12px' : undefined,
      }}
      data-paragraph={paragraphLabel}
    >
      <div
        ref={containerRef}
        tabIndex={mode === 'evidence' && clickSelectsSentence ? 0 : undefined}
        role={mode === 'evidence' && clickSelectsSentence ? 'region' : undefined}
        aria-label={
          mode === 'evidence' && clickSelectsSentence
            ? `Đoạn ${paragraphLabel}: bấm chọn câu hoặc dùng phím mũi tên lên/xuống và Enter để bôi vật chứng`
            : undefined
        }
        onPointerDown={() => {
          pointerDownRef.current = true;
        }}
        onPointerUp={handlePointerFinish}
        onTouchEnd={handlePointerFinish}
        onKeyDown={handleContainerKeyDown}
        onKeyUp={(e) => {
          if (e.key === 'Shift' || e.shiftKey) handlePointerFinish(e);
        }}
        onContextMenu={handleContextMenu}
        className={`reading-prose select-text rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 ${
          mode === 'evidence' && clickSelectsSentence ? 'cursor-pointer' : 'cursor-text'
        }`}
        style={{
          color: 'var(--color-text)',
          fontSize: fontSizePx ? `${fontSizePx}px` : undefined,
        }}
        data-testid={`highlighter-para-${paragraphLabel}`}
      >
        {segments.map((seg) => {
          const isFirstAnswer = seg.isAnswer && !assignedAnswerRef;
          if (isFirstAnswer) assignedAnswerRef = true;

          // Determine highlight background & border using design tokens only
          let bg = 'transparent';
          let borderBottom: string | undefined;
          let titleText: string | undefined;

          if (seg.isAnswer) {
            bg = 'color-mix(in srgb, var(--color-partial) 32%, transparent)';
            borderBottom = '2px solid var(--color-partial)';
            titleText = 'Vật chứng đáp án';
          } else if (seg.isUser) {
            bg = 'color-mix(in srgb, var(--color-info) 24%, transparent)';
            borderBottom = '2px solid var(--color-info)';
            titleText = 'Vật chứng bạn chọn';
          } else if (seg.examSpan) {
            bg = 'color-mix(in srgb, var(--color-partial) 28%, transparent)';
            borderBottom = seg.examSpan.note ? '2px dotted var(--color-info)' : undefined;
            titleText = seg.examSpan.note
              ? `Ghi chú: ${seg.examSpan.note}`
              : 'Nhấn để thêm ghi chú hoặc xoá highlight';
          } else if (seg.glossary) {
            borderBottom = '1px dotted var(--color-reading)';
            titleText = `${seg.glossary.term}: ${seg.glossary.meaningVi}`;
          }

          const isHighlighted = seg.isAnswer || seg.isUser || Boolean(seg.examSpan);

          if (seg.isAnswer) {
            return (
              <motion.mark
                key={`${seg.start}-${seg.end}`}
                ref={isFirstAnswer ? answerMarkRef : undefined}
                initial={prefersReduced ? { opacity: 0.5 } : { opacity: 0.4, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: prefersReduced ? 0.1 : 0.35 }}
                data-char-start={seg.start}
                data-char-end={seg.end}
                data-highlight-kind="answer"
                title={titleText}
                className="rounded-[3px] px-0.5 text-inherit inline"
                style={{ backgroundColor: bg, borderBottom, color: 'inherit' }}
              >
                {seg.text}
              </motion.mark>
            );
          }

          if (isHighlighted) {
            const examSpanRef = seg.examSpan;
            return (
              <mark
                key={`${seg.start}-${seg.end}`}
                data-char-start={seg.start}
                data-char-end={seg.end}
                data-highlight-kind={seg.isUser ? 'evidence' : 'exam'}
                title={titleText}
                onClick={
                  examSpanRef && mode === 'exam'
                    ? (e) => {
                        e.stopPropagation();
                        openNoteEditor(examSpanRef);
                      }
                    : undefined
                }
                className={`rounded-[3px] px-0.5 text-inherit ${
                  examSpanRef && mode === 'exam' ? 'cursor-pointer' : ''
                }`}
                style={{ backgroundColor: bg, borderBottom, color: 'inherit' }}
              >
                {seg.text}
                {examSpanRef?.note && examSpanRef.end === seg.end && (
                  <span
                    className="inline-flex items-center align-middle ml-1 px-1 py-0.5 rounded text-xs font-sans"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-info) 16%, var(--color-surface))',
                      color: 'var(--color-info)',
                    }}
                    aria-label={`Ghi chú: ${examSpanRef.note}`}
                  >
                    <StickyNote className="w-3 h-3" />
                  </span>
                )}
              </mark>
            );
          }

          return (
            <span
              key={`${seg.start}-${seg.end}`}
              data-char-start={seg.start}
              data-char-end={seg.end}
              title={titleText}
              style={borderBottom ? { borderBottom } : undefined}
            >
              {seg.text}
            </span>
          );
        })}
      </div>

      {/* Exam mode selection action bar */}
      {mode === 'exam' && pendingExamSpan && (
        <div
          className="mt-2 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] border text-xs"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
          role="toolbar"
          aria-label="Công cụ bôi sáng Exam"
        >
          <button
            type="button"
            onClick={() => commitPendingExamHighlight(false)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded font-medium cursor-pointer"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-partial) 30%, var(--color-surface))',
              color: 'var(--color-text)',
            }}
          >
            <HighlighterIcon className="w-3.5 h-3.5" />
            <span>Bôi sáng</span>
          </button>
          <button
            type="button"
            onClick={() => commitPendingExamHighlight(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded font-medium cursor-pointer border"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Gắn ghi chú</span>
          </button>
          <button
            type="button"
            onClick={() => setPendingExamSpan(null)}
            className="p-1 rounded cursor-pointer"
            style={{ color: 'var(--color-text-dim)' }}
            aria-label="Huỷ vùng chọn"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Exam mode inline note editor for an existing highlight */}
      {mode === 'exam' && activeEditingSpan && (
        <div
          className="mt-2 p-3 rounded-[var(--radius-sm)] border space-y-2 max-w-md"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              Ghi chú cho “{activeEditingSpan.quote ?? text.slice(activeEditingSpan.start, activeEditingSpan.end)}”
            </span>
            <button
              type="button"
              onClick={() => {
                if (activeEditingSpan.id) onRemoveExamHighlight?.(activeEditingSpan.id);
                setEditingNoteSpanId(null);
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer"
              style={{ color: 'var(--color-wrong)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xoá</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveNote();
                if (e.key === 'Escape') setEditingNoteSpanId(null);
              }}
              placeholder="Nhập ghi chú ngắn..."
              className="flex-1 px-2.5 py-1.5 text-xs rounded border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={saveNote}
              className="px-2.5 py-1.5 text-xs font-medium rounded border cursor-pointer"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              Lưu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
