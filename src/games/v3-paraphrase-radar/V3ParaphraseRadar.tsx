import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Crosshair,
  Flame,
  Radar,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ParaphraseItem } from '../../core/content/schemas';
import { playSfx } from '../../core/audio/sfx';
import { registerProgressSaver } from '../../core/adaptive/progressSaver';
import type { SRSCard } from '../../core/srs/fsrsAdapter';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { eventRepo } from '../../core/storage/repos/eventRepo';
import {
  Button,
  Card,
  EmptyState,
  Pill,
  RecapScreen,
  Skeleton,
  Timer,
} from '../../design/components';
import {
  ease,
  feedbackSlideVariants,
  questionSlideVariants,
  reducedRouteVariants,
} from '../../design/motion';
import type { GameProps } from '../registry';
import { getV3Kv, loadV3Paraphrases, setV3Kv } from './loader';
import { createProgressSaver } from './progressSaver';
import {
  buildV3ProgressSnapshot,
  computeAvgResponseSec,
  createV3RetrySession,
  createV3Session,
  expandClickToChunk,
  formatV3WinStatement,
  nextV3Round,
  setV3Selection,
  snapSpanToWords,
  submitV3Round,
  tokenizeContextWithSpans,
  type CharSpan,
  type V3EngineState,
} from './engine';

const V3_PREV_AVG_KV_KEY = 'v3_prev_avg_sec';
const V3_RECENT_ITEMS_KV_KEY = 'v3_recent_items';
const V3_RECENT_TTL_MS = 24 * 60 * 60 * 1000;
const CIRCLED_NUMS = ['①', '②', '③', '④', '⑤'] as const;

interface RecentEntry {
  id: string;
  ts: number;
}

interface ContextSegment {
  text: string;
  start: number;
  end: number;
  kind: 'plain' | 'target' | 'decoy';
  decoyIndex?: number;
}

/** Split context into ordered segments for post-answer annotation (target + numbered decoys). */
function buildAnnotatedSegments(item: ParaphraseItem): ContextSegment[] {
  const markers: Array<{
    start: number;
    end: number;
    kind: 'target' | 'decoy';
    decoyIndex?: number;
  }> = [
    { start: item.target.start, end: item.target.end, kind: 'target' as const },
    ...item.decoys.map((d, idx) => ({
      start: d.start,
      end: d.end,
      kind: 'decoy' as const,
      decoyIndex: idx,
    })),
  ].sort((a, b) => a.start - b.start);

  const segments: ContextSegment[] = [];
  let cursor = 0;

  for (const m of markers) {
    if (m.start > cursor) {
      segments.push({
        text: item.context.slice(cursor, m.start),
        start: cursor,
        end: m.start,
        kind: 'plain',
      });
    }
    if (m.start >= cursor) {
      segments.push({
        text: item.context.slice(m.start, m.end),
        start: m.start,
        end: m.end,
        kind: m.kind,
        decoyIndex: m.decoyIndex,
      });
      cursor = Math.max(cursor, m.end);
    }
  }

  if (cursor < item.context.length) {
    segments.push({
      text: item.context.slice(cursor),
      start: cursor,
      end: item.context.length,
      kind: 'plain',
    });
  }

  return segments;
}

/** Interactive word-level piece for click-chunk & pointer-drag span selection. */
interface InteractivePiece {
  text: string;
  start: number;
  end: number;
  isWord: boolean;
}

function buildInteractivePieces(context: string): InteractivePiece[] {
  const tokens = tokenizeContextWithSpans(context);
  const pieces: InteractivePiece[] = [];
  let cursor = 0;

  for (const tok of tokens) {
    if (tok.start > cursor) {
      pieces.push({
        text: context.slice(cursor, tok.start),
        start: cursor,
        end: tok.start,
        isWord: false,
      });
    }
    pieces.push({
      text: tok.text,
      start: tok.start,
      end: tok.end,
      isWord: true,
    });
    cursor = tok.end;
  }

  if (cursor < context.length) {
    pieces.push({
      text: context.slice(cursor),
      start: cursor,
      end: context.length,
      isWord: false,
    });
  }

  return pieces;
}

const V3ParaphraseRadar: React.FC<GameProps> = ({ mode, level, onExit }) => {
  const prefersReduced = useReducedMotion();
  const initialMode: 'training' | 'sprint' = mode === 'sprint' ? 'sprint' : 'training';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<ParaphraseItem[]>([]);
  const [existingCards, setExistingCards] = useState<SRSCard[]>([]);
  const [prevAvgSec, setPrevAvgSec] = useState<number | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [state, setState] = useState<V3EngineState | null>(null);
  const stateRef = useRef<V3EngineState | null>(null);
  stateRef.current = state;

  // Per-round countdown, drag & keyboard listbox state (V3-5)
  const [remainingSec, setRemainingSec] = useState<number>(20);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(0);
  const [kbRangeAnchor, setKbRangeAnchor] = useState<number | null>(null);
  const roundStartRef = useRef<number>(Date.now());
  const dragAnchorRef = useRef<{ start: number; end: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const didDragMoveRef = useRef<boolean>(false);
  const sessionSavedRef = useRef<boolean>(false);
  const saverRef = useRef(
    createProgressSaver({
      saveProgress: (payload) => attemptRepo.saveProgress(payload),
      finalize: (attemptId, payload) => attemptRepo.finalize(attemptId, payload),
    }),
  );

  const persistSnapshot = useCallback((target: V3EngineState | null, final: boolean) => {
    if (!target) return Promise.resolve();
    const snap = buildV3ProgressSnapshot(target, Date.now());
    return saverRef.current.persist(snap, final);
  }, []);

  // Đăng ký lưu tiến độ cho nút "Lưu và thoát" của PlayScreen (TU-02)
  useEffect(() => {
    return registerProgressSaver(() => persistSnapshot(stateRef.current, false));
  }, [persistSnapshot]);

  const startSession = useCallback(
    (
      items: readonly ParaphraseItem[],
      cards: readonly SRSCard[],
      previousAvg: number | null,
      recent: readonly string[],
    ) => {
      saverRef.current.reset();
      const now = Date.now();
      const next = createV3Session({
        mode: initialMode,
        level,
        allItems: items,
        existingCards: cards,
        recentIds: recent,
        seed: `v3:${level}:${now}:${Math.random().toString(36).slice(2, 8)}`,
        previousAvgSec: previousAvg,
        nowMs: now,
      });
      sessionSavedRef.current = false;
      stateRef.current = next;
      setState(next);
      setRemainingSec(next.config.timeLimitSec);
      setActiveWordIdx(0);
      setKbRangeAnchor(null);
      roundStartRef.current = now;
    },
    [initialMode, level],
  );

  const startRetrySession = useCallback(() => {
    const cur = stateRef.current;
    if (!cur) return;
    const retry = createV3RetrySession(cur, Date.now());
    if (!retry) {
      startSession(allItems, existingCards, prevAvgSec, recentIds);
      return;
    }
    saverRef.current.reset();
    sessionSavedRef.current = false;
    stateRef.current = retry;
    setState(retry);
    setRemainingSec(retry.config.timeLimitSec);
    setActiveWordIdx(0);
    setKbRangeAnchor(null);
    roundStartRef.current = Date.now();
  }, [allItems, existingCards, prevAvgSec, recentIds, startSession]);

  // Initial load
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        setLoading(true);
        const now = Date.now();
        const [items, cards, savedAvg, recentRaw] = await Promise.all([
          loadV3Paraphrases(),
          cardRepo.getAll().catch(() => [] as SRSCard[]),
          getV3Kv<number | null>(V3_PREV_AVG_KV_KEY, null),
          getV3Kv<RecentEntry[]>(V3_RECENT_ITEMS_KV_KEY, []),
        ]);
        if (!active) return;

        const validRecent = (Array.isArray(recentRaw) ? recentRaw : [])
          .filter((r) => now - r.ts < V3_RECENT_TTL_MS)
          .map((r) => r.id);

        setAllItems(items);
        setExistingCards(cards);
        setPrevAvgSec(savedAvg);
        setRecentIds(validRecent);

        if (items.length === 0) {
          setLoadError('Chưa có dữ liệu Paraphrase Radar.');
          setLoading(false);
          return;
        }

        startSession(items, cards, savedAvg, validRecent);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error ? err.message : 'Không tải được dữ liệu Paraphrase Radar.',
        );
        setLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, [startSession]);

  // Lock answer handler — không gọi playSfx trong state updater (C7/V3-6)
  const handleLockAnswer = useCallback(
    (options: { notInPassage?: boolean; timedOut?: boolean } = {}) => {
      const prev = stateRef.current;
      if (!prev || prev.stage !== 'playing' || prev.answered) return;
      if (!options.notInPassage && !options.timedOut && !prev.selectedSpan) {
        return;
      }
      const elapsedMs = Math.max(250, Date.now() - roundStartRef.current);
      const { state: next, events } = submitV3Round(
        prev,
        {
          selectedNotInPassage: options.notInPassage,
          timedOut: options.timedOut,
          elapsedMs,
        },
        Date.now(),
      );

      stateRef.current = next;
      setState(next);

      const scored = events.find((e) => e.type === 'round_scored');
      if (scored && scored.type === 'round_scored') {
        if (scored.outcome === 'timeout') {
          playSfx('countdownEnd');
        } else if (scored.correct) {
          playSfx(next.combo >= 3 ? 'streak' : 'correct');
        } else {
          playSfx('wrong');
        }
      }
      void persistSnapshot(next, false);
    },
    [persistSnapshot],
  );

  const handleNextRound = useCallback(() => {
    const prev = stateRef.current;
    if (!prev || prev.stage !== 'playing' || !prev.answered) return;
    playSfx('flip');
    const { state: next } = nextV3Round(prev, Date.now());
    stateRef.current = next;
    setState(next);
    if (next.stage === 'playing') {
      setRemainingSec(next.config.timeLimitSec);
      setActiveWordIdx(0);
      setKbRangeAnchor(null);
      roundStartRef.current = Date.now();
    }
  }, []);

  // Per-round countdown timer (C7: không gọi playSfx trong updater)
  useEffect(() => {
    if (!state || state.stage !== 'playing' || state.answered) return;
    if (remainingSec <= 0) {
      handleLockAnswer({ timedOut: true });
      return;
    }

    const id = window.setInterval(() => {
      setRemainingSec((sec) => Math.max(0, sec - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [state?.stage, state?.answered, state?.currentIndex, remainingSec, handleLockAnswer]);

  // V3-8: SFX tick ở 10 giây cuối
  useEffect(() => {
    if (state?.stage === 'playing' && !state.answered && remainingSec > 0 && remainingSec <= 10) {
      playSfx('tick');
    }
  }, [state?.stage, state?.answered, remainingSec]);

  // Release pointer drag globally if mouseup happens outside text
  useEffect(() => {
    const handlePointerUp = () => {
      isDraggingRef.current = false;
      dragAnchorRef.current = null;
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  // Keyboard shortcuts: N = KHÔNG CÓ TRONG ĐOẠN, Enter = Khoá / Tiếp, Escape = Bỏ chọn
  useEffect(() => {
    if (!state || state.stage !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (!state.answered) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          handleLockAnswer({ notInPassage: true });
          return;
        }
        if (e.key === 'Enter' && state.selectedSpan) {
          e.preventDefault();
          handleLockAnswer();
          return;
        }
        if (e.key === 'Escape' && state.selectedSpan) {
          e.preventDefault();
          setKbRangeAnchor(null);
          setState((prev) => (prev ? setV3Selection(prev, null) : prev));
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleNextRound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handleLockAnswer, handleNextRound]);

  // Finalize session atomically on recap + cập nhật recentIds (V3-3) + reload cards
  useEffect(() => {
    if (!state || state.stage !== 'recap' || sessionSavedRef.current) return;
    sessionSavedRef.current = true;
    playSfx('sessionDone');

    const now = Date.now();
    const avgSec = computeAvgResponseSec(state.responseTimesMs);

    void (async () => {
      try {
        await persistSnapshot(state, true);

        const freshCards = await cardRepo.getAll().catch(() => null);
        if (freshCards) setExistingCards(freshCards);

        if (!state.isRetry) {
          if (avgSec > 0) {
            await setV3Kv(V3_PREV_AVG_KV_KEY, avgSec);
            setPrevAvgSec(avgSec);
          }

          const prevRecent = await getV3Kv<RecentEntry[]>(V3_RECENT_ITEMS_KV_KEY, []);
          const freshMap = new Map<string, number>();
          for (const entry of Array.isArray(prevRecent) ? prevRecent : []) {
            if (now - entry.ts < V3_RECENT_TTL_MS) freshMap.set(entry.id, entry.ts);
          }
          for (const it of state.items) {
            freshMap.set(it.id, now);
          }
          const updatedRecent: RecentEntry[] = [...freshMap.entries()].map(([id, ts]) => ({
            id,
            ts,
          }));
          await setV3Kv(V3_RECENT_ITEMS_KV_KEY, updatedRecent);
          setRecentIds(updatedRecent.map((e) => e.id));

          if (state.shouldLogKeywordEchoTag) {
            await eventRepo.log('trap_stat', {
              tag: 'keyword_echo',
              gameId: 'v3',
              count: state.keywordEchoHits,
            });
          }
        }
      } catch {
        // Ignore storage error in restricted environments
      }
    })();
  }, [state, persistSnapshot]);

  const currentItem = state?.items[state.currentIndex];

  const interactivePieces = useMemo(
    () => (currentItem ? buildInteractivePieces(currentItem.context) : []),
    [currentItem],
  );

  const wordPieces = useMemo(
    () => interactivePieces.filter((p) => p.isWord),
    [interactivePieces],
  );

  const annotatedSegments = useMemo(
    () => (currentItem ? buildAnnotatedSegments(currentItem) : []),
    [currentItem],
  );

  // V3-5: Điều hướng bàn phím trong listbox (←/→ di chuyển, Shift+←/→ mở rộng cụm, Space chọn/bỏ chọn)
  const handleListboxKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!state || state.answered || !currentItem || wordPieces.length === 0) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const delta = e.key === 'ArrowRight' ? 1 : -1;
        const clampedCurrent = Math.max(0, Math.min(wordPieces.length - 1, activeWordIdx));
        const nextIdx = Math.max(0, Math.min(wordPieces.length - 1, clampedCurrent + delta));

        if (e.shiftKey) {
          const anchor = kbRangeAnchor ?? clampedCurrent;
          setKbRangeAnchor(anchor);
          setActiveWordIdx(nextIdx);
          const from = wordPieces[Math.min(anchor, nextIdx)];
          const to = wordPieces[Math.max(anchor, nextIdx)];
          const snapped = snapSpanToWords(currentItem.context, from.start, to.end);
          if (snapped) {
            playSfx('tap');
            setState((prev) => (prev ? { ...prev, selectedSpan: snapped } : prev));
          }
        } else {
          setKbRangeAnchor(null);
          setActiveWordIdx(nextIdx);
        }
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        const idx = Math.max(0, Math.min(wordPieces.length - 1, activeWordIdx));
        const word = wordPieces[idx];
        if (!word) return;
        playSfx('tap');
        const chunk = expandClickToChunk(currentItem, word.start);
        const span: CharSpan = chunk
          ? { start: chunk.start, end: chunk.end, text: chunk.text }
          : { start: word.start, end: word.end, text: word.text };
        setKbRangeAnchor(idx);
        setState((prev) => (prev ? setV3Selection(prev, span) : prev));
      }
    },
    [state, currentItem, wordPieces, activeWordIdx, kbRangeAnchor],
  );

  const handlePiecePointerDown = useCallback(
    (piece: InteractivePiece) => {
      if (!state || state.answered || !piece.isWord) return;
      isDraggingRef.current = true;
      didDragMoveRef.current = false;
      dragAnchorRef.current = { start: piece.start, end: piece.end };
    },
    [state],
  );

  const handlePiecePointerEnter = useCallback(
    (piece: InteractivePiece) => {
      if (
        !state ||
        state.answered ||
        !currentItem ||
        !isDraggingRef.current ||
        !dragAnchorRef.current ||
        !piece.isWord
      ) {
        return;
      }
      const anchor = dragAnchorRef.current;
      if (piece.start !== anchor.start || piece.end !== anchor.end) {
        didDragMoveRef.current = true;
        const snapped = snapSpanToWords(
          currentItem.context,
          Math.min(anchor.start, piece.start),
          Math.max(anchor.end, piece.end),
        );
        if (snapped) {
          setState((prev) => (prev ? { ...prev, selectedSpan: snapped } : prev));
        }
      }
    },
    [state, currentItem],
  );

  const handlePieceClick = useCallback(
    (piece: InteractivePiece) => {
      if (!state || state.answered || !currentItem || !piece.isWord) return;
      // If user just finished a multi-word drag, keep the dragged span
      if (didDragMoveRef.current) {
        didDragMoveRef.current = false;
        return;
      }
      playSfx('tap');
      const chunk = expandClickToChunk(currentItem, piece.start);
      const span: CharSpan = chunk
        ? { start: chunk.start, end: chunk.end, text: chunk.text }
        : { start: piece.start, end: piece.end, text: piece.text };
      setState((prev) => (prev ? setV3Selection(prev, span) : prev));
    },
    [state, currentItem],
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadError || !state) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <EmptyState
          title="Không thể mở Paraphrase Radar"
          description={loadError ?? 'Dữ liệu paraphrase chưa sẵn sàng.'}
          action={
            <Button variant="primary" onClick={() => onExit()}>
              Quay về Hôm nay
            </Button>
          }
        />
      </div>
    );
  }

  // Recap Screen
  if (state.stage === 'recap') {
    const durationSec = Math.max(
      1,
      Math.round(((state.endedAt ?? Date.now()) - state.startedAt) / 1000),
    );
    const total = Math.max(1, state.items.length);
    const accuracyPercent = Math.round((state.correctCount / total) * 100);

    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <RecapScreen
          scoreLabel={`${state.correctCount}/${state.items.length}`}
          xpEarned={state.xp}
          winStatement={formatV3WinStatement(state)}
          accuracyPercent={accuracyPercent}
          durationSec={durationSec}
          mistakes={state.mistakes}
          onRetryMistakes={startRetrySession}
          onGoToday={() =>
            onExit({
              gameId: 'v3',
              mode: state.mode,
              xp: state.xp,
              score: state.correctCount,
              total: state.items.length,
            })
          }
        />
      </div>
    );
  }

  if (!currentItem) return null;

  const isTargetLockedCorrect =
    state.answered &&
    (state.lastResult?.outcome === 'correct' || state.lastResult?.outcome === 'partial');
  const isDecoyHit = state.answered && state.lastResult?.outcome === 'decoy_hit';
  const safeActiveWordIdx =
    wordPieces.length > 0 ? Math.max(0, Math.min(wordPieces.length - 1, activeWordIdx)) : 0;
  const activeOptionId =
    wordPieces.length > 0 ? `v3-word-${state.currentIndex}-${safeActiveWordIdx}` : undefined;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Thanh trạng thái phiên (không lặp nút thoát ✕ và tiêu đề của PlayScreen - U3) */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-[var(--radius-lg)] border"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Radar className="w-4 h-4 shrink-0" style={{ color: 'var(--color-vocab)' }} />
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-sm)] border tabular-nums"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            {state.currentIndex + 1}/{state.items.length}
          </span>
          {state.isRetry && <Pill tone="neutral">Ôn câu sai · 0 XP</Pill>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Timer
            remainingSec={remainingSec}
            totalSec={state.config.timeLimitSec}
            size="sm"
          />

          {state.combo > 0 && (
            <Pill tone="writing" icon={<Flame className="w-3.5 h-3.5" />}>
              x{state.combo}
            </Pill>
          )}

          <Pill tone="correct" icon={<Sparkles className="w-3.5 h-3.5" />}>
            +{state.xp}
          </Pill>
        </div>
      </div>

      {/* Main Radar Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentItem.id}-${state.currentIndex}`}
          variants={prefersReduced ? reducedRouteVariants : questionSlideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-4"
        >
          <Card padding="lg" className="space-y-5">
            {/* Prominent Question Phrase — V3-1: ẩn Level trước khi trả lời */}
            <div
              className="p-4 rounded-[var(--radius-md)] border space-y-1.5"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-vocab) 10%, var(--color-surface-2))',
                borderColor: 'color-mix(in srgb, var(--color-vocab) 40%, var(--color-border))',
              }}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-vocab)' }}
                >
                  TÌM Ý TƯƠNG ĐƯƠNG
                </span>
                {state.answered && (
                  <Pill tone={currentItem.level === 4 ? 'speaking' : 'vocab'}>
                    Bậc {currentItem.level}
                  </Pill>
                )}
              </div>
              <p
                className="text-lg sm:text-xl font-extrabold leading-snug"
                style={{ color: 'var(--color-text)' }}
              >
                « {currentItem.questionPhrase} »
              </p>
            </div>

            {/* Context Passage with left-margin radar sweep line (never overlaps text) */}
            <div className="relative pl-5 sm:pl-6">
              {/* Left-margin radar track & subtle sweep beam (opacity 0.08, 2.5s, transform only) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-1 bottom-1 w-2.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface-2)' }}
              >
                {!prefersReduced && !state.answered && (
                  <motion.div
                    initial={{ y: '-100%' }}
                    animate={{ y: '400%' }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="w-full h-1/4 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-vocab)',
                      opacity: 0.08,
                    }}
                  />
                )}
              </div>

              {/* Serif 18px Context Text — V3-5: 1 vùng role="listbox" điều hướng bàn phím */}
              {!state.answered ? (
                <div
                  role="listbox"
                  tabIndex={0}
                  aria-label="Đoạn văn tìm cụm paraphrase (phím mũi tên di chuyển, Shift + mũi tên mở rộng, Space chọn)"
                  aria-multiselectable="true"
                  aria-activedescendant={activeOptionId}
                  onKeyDown={handleListboxKeyDown}
                  className="reading-prose select-none leading-relaxed rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  {(() => {
                    let wordCounter = -1;
                    return interactivePieces.map((piece, idx) => {
                      const isSelected =
                        state.selectedSpan !== null &&
                        piece.end > state.selectedSpan.start &&
                        piece.start < state.selectedSpan.end;

                      if (!piece.isWord) {
                        return (
                          <span
                            key={idx}
                            aria-hidden="true"
                            style={
                              isSelected
                                ? {
                                    backgroundColor:
                                      'color-mix(in srgb, var(--color-vocab) 26%, transparent)',
                                  }
                                : undefined
                            }
                          >
                            {piece.text}
                          </span>
                        );
                      }

                      wordCounter += 1;
                      const currentWordIdx = wordCounter;
                      const isActive = currentWordIdx === safeActiveWordIdx;
                      const optionId = `v3-word-${state.currentIndex}-${currentWordIdx}`;

                      return (
                        <span
                          key={idx}
                          id={optionId}
                          role="option"
                          aria-selected={isSelected}
                          onPointerDown={() => {
                            setActiveWordIdx(currentWordIdx);
                            setKbRangeAnchor(currentWordIdx);
                            handlePiecePointerDown(piece);
                          }}
                          onPointerEnter={() => handlePiecePointerEnter(piece)}
                          onClick={() => {
                            setActiveWordIdx(currentWordIdx);
                            handlePieceClick(piece);
                          }}
                          className="rounded-xs transition-colors cursor-pointer"
                          style={{
                            backgroundColor: isSelected
                              ? 'color-mix(in srgb, var(--color-vocab) 28%, transparent)'
                              : 'transparent',
                            color: isSelected ? 'var(--color-text)' : undefined,
                            boxShadow: isSelected
                              ? '0 2px 0 var(--color-vocab)'
                              : isActive
                              ? 'inset 0 -1px 0 var(--color-border-strong, var(--color-text-dim))'
                              : undefined,
                          }}
                        >
                          {piece.text}
                        </span>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* Post-answer annotated view: green target with 4 lock-on brackets + dashed amber decoys ①② */
                <div
                  className="reading-prose leading-relaxed"
                  style={{ color: 'var(--color-text)' }}
                >
                  {annotatedSegments.map((seg, idx) => {
                    if (seg.kind === 'plain') {
                      return <span key={idx}>{seg.text}</span>;
                    }

                    if (seg.kind === 'target') {
                      const isNotEq = currentItem.relation === 'not_equivalent';
                      return (
                        <span
                          key={idx}
                          className="relative inline-block px-1.5 py-0.5 mx-0.5 rounded-[var(--radius-sm)] border-2 font-medium"
                          style={{
                            borderColor: isNotEq
                              ? 'var(--color-info)'
                              : 'var(--color-correct)',
                            backgroundColor: isNotEq
                              ? 'color-mix(in srgb, var(--color-info) 12%, transparent)'
                              : 'color-mix(in srgb, var(--color-correct) 14%, transparent)',
                          }}
                        >
                          {/* 4 corner brackets lock-on animation (0.25s, transform + opacity only) */}
                          {isTargetLockedCorrect && !isNotEq && !prefersReduced && (
                            <>
                              <motion.span
                                aria-hidden="true"
                                initial={{ opacity: 0, x: -6, y: -6 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                transition={{ duration: 0.25, ease: ease.out }}
                                className="pointer-events-none absolute -top-1.5 -left-1.5 w-2.5 h-2.5 border-t-2 border-l-2"
                                style={{ borderColor: 'var(--color-correct)' }}
                              />
                              <motion.span
                                aria-hidden="true"
                                initial={{ opacity: 0, x: 6, y: -6 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                transition={{ duration: 0.25, ease: ease.out }}
                                className="pointer-events-none absolute -top-1.5 -right-1.5 w-2.5 h-2.5 border-t-2 border-r-2"
                                style={{ borderColor: 'var(--color-correct)' }}
                              />
                              <motion.span
                                aria-hidden="true"
                                initial={{ opacity: 0, x: -6, y: 6 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                transition={{ duration: 0.25, ease: ease.out }}
                                className="pointer-events-none absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 border-b-2 border-l-2"
                                style={{ borderColor: 'var(--color-correct)' }}
                              />
                              <motion.span
                                aria-hidden="true"
                                initial={{ opacity: 0, x: 6, y: 6 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                transition={{ duration: 0.25, ease: ease.out }}
                                className="pointer-events-none absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 border-b-2 border-r-2"
                                style={{ borderColor: 'var(--color-correct)' }}
                              />
                            </>
                          )}
                          {seg.text}
                        </span>
                      );
                    }

                    // Decoy span: dashed amber border + circled number ① ② ③
                    const dIdx = seg.decoyIndex ?? 0;
                    const badge = CIRCLED_NUMS[dIdx] ?? `(${dIdx + 1})`;
                    const wasHitDecoy =
                      isDecoyHit && state.lastResult?.matchedDecoyIndex === dIdx;

                    return (
                      <span
                        key={idx}
                        className="relative inline-block px-1.5 py-0.5 mx-0.5 rounded-[var(--radius-sm)] border-2 border-dashed"
                        style={{
                          borderColor: wasHitDecoy
                            ? 'var(--color-wrong)'
                            : 'var(--color-writing)',
                          backgroundColor: wasHitDecoy
                            ? 'color-mix(in srgb, var(--color-wrong) 14%, transparent)'
                            : 'color-mix(in srgb, var(--color-writing) 10%, transparent)',
                        }}
                      >
                        {/* Decoy hit: brackets pop out & drop (transform + opacity only) */}
                        {wasHitDecoy && !prefersReduced && (
                          <motion.span
                            aria-hidden="true"
                            initial={{ opacity: 1, scale: 1, y: 0 }}
                            animate={{ opacity: 0, scale: 1.25, y: 12 }}
                            transition={{ duration: 0.35, ease: ease.out }}
                            className="pointer-events-none absolute -inset-1 rounded border-2"
                            style={{ borderColor: 'var(--color-wrong)' }}
                          />
                        )}
                        <span
                          className="mr-1 text-xs font-bold align-super"
                          style={{
                            color: wasHitDecoy
                              ? 'var(--color-wrong)'
                              : 'var(--color-writing)',
                          }}
                        >
                          {badge}
                        </span>
                        {seg.text}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected span indicator & Action Buttons */}
            {!state.answered && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                  <span style={{ color: 'var(--color-text-dim)' }}>
                    {state.selectedSpan ? (
                      <>
                        Đang chọn:{' '}
                        <strong style={{ color: 'var(--color-vocab)' }}>
                          “{state.selectedSpan.text}”
                        </strong>{' '}
                        (bấm lại để bỏ chọn)
                      </>
                    ) : (
                      'Bấm vào 1 từ để chọn cụm, hoặc kéo bôi để chọn chính xác.'
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="secondary"
                    leftIcon={<Ban className="w-4 h-4" />}
                    onClick={() => handleLockAnswer({ notInPassage: true })}
                  >
                    KHÔNG CÓ TRONG ĐOẠN (N)
                  </Button>

                  <Button
                    variant="primary"
                    skill="vocab"
                    leftIcon={<Crosshair className="w-4 h-4" />}
                    disabled={!state.selectedSpan}
                    onClick={() => handleLockAnswer()}
                  >
                    Khoá mục tiêu (Enter)
                  </Button>
                </div>
              </div>
            )}

            {/* Post-Answer Feedback & Decoy Legend */}
            <AnimatePresence>
              {state.answered && state.lastResult && (
                <motion.div
                  variants={prefersReduced ? reducedRouteVariants : feedbackSlideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-[var(--radius-md)] border-2 p-4 space-y-3"
                  style={{
                    backgroundColor:
                      state.lastResult.outcome === 'correct'
                        ? 'color-mix(in srgb, var(--color-correct) 10%, var(--color-surface))'
                        : state.lastResult.outcome === 'partial'
                        ? 'color-mix(in srgb, var(--color-partial) 12%, var(--color-surface))'
                        : 'color-mix(in srgb, var(--color-wrong) 12%, var(--color-surface))',
                    borderColor:
                      state.lastResult.outcome === 'correct'
                        ? 'var(--color-correct)'
                        : state.lastResult.outcome === 'partial'
                        ? 'var(--color-partial)'
                        : 'var(--color-wrong)',
                  }}
                  role="region"
                  aria-live="polite"
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div
                      className="flex items-center gap-2 font-bold text-sm"
                      style={{
                        color:
                          state.lastResult.outcome === 'correct'
                            ? 'var(--color-correct)'
                            : state.lastResult.outcome === 'partial'
                            ? 'var(--color-partial)'
                            : 'var(--color-wrong)',
                      }}
                    >
                      {state.lastResult.outcome === 'correct' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : state.lastResult.outcome === 'partial' ? (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{state.lastResult.headlineVi}</span>
                    </div>

                    {state.lastResult.xpEarned > 0 && (
                      <Pill tone="correct">
                        +{state.lastResult.xpEarned} XP (x{state.lastResult.speedMultiplier})
                      </Pill>
                    )}
                  </div>

                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                    {state.lastResult.explanationVi}
                  </p>

                  {/* Numbered Decoy Explanations ① ② */}
                  {currentItem.decoys.length > 0 && (
                    <div
                      className="pt-2 border-t space-y-1.5"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <div
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--color-writing)' }}
                      >
                        Bẫy trong đoạn (Decoys)
                      </div>
                      {currentItem.decoys.map((decoy, idx) => (
                        <div key={idx} className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                          <span className="font-bold mr-1" style={{ color: 'var(--color-writing)' }}>
                            {CIRCLED_NUMS[idx] ?? `(${idx + 1})`} “{decoy.text}”:
                          </span>
                          {decoy.whyVi}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      variant="primary"
                      skill="vocab"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      onClick={handleNextRound}
                    >
                      {state.currentIndex + 1 < state.items.length
                        ? 'Lượt tiếp (Enter)'
                        : 'Xem tổng kết (Enter)'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default V3ParaphraseRadar;
