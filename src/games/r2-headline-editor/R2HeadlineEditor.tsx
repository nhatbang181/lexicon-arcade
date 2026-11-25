import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  ListChecks,
  MousePointerClick,
  Newspaper,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ReadingPassage } from '../../core/content/schemas';
import { playSfx } from '../../core/audio/sfx';
import { registerProgressSaver } from '../../core/adaptive/progressSaver';
import type { SRSCard } from '../../core/srs/fsrsAdapter';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { db } from '../../core/storage/db';
import { userItemRepo } from '../../core/storage/repos/userItemRepo';
import {
  Button,
  Card,
  EmptyState,
  Highlighter,
  Pill,
  RecapScreen,
  Sheet,
  Skeleton,
  formatSeconds,
  type RecapMistakeItem,
} from '../../design/components';
import {
  feedbackSlideVariants,
  reducedRouteVariants,
  spring,
  wrongShakeVariants,
} from '../../design/motion';
import type { GameProps } from '../registry';
import { createProgressSaver } from './progressSaver';
import {
  HEADING_DISTRACTOR_LABELS_VI,
  addParagraphDuration,
  advanceAfterParagraphGrade,
  assignHeadingChoice,
  buildR2ProgressSnapshot,
  buildR2WinStatement,
  canSubmitCurrentParagraph,
  canSubmitPassage,
  clearHeadingChoice,
  createHeadlineRetrySession,
  createHeadlineSession,
  getCurrentTask,
  getUsedHeadingsMap,
  keyToHeadingIndex,
  selectMainIdeaSpan,
  selectParagraphIndex,
  selectR2Passage,
  submitCurrentParagraph,
  submitEntirePassage,
  type HeadlineSessionState,
  type ParagraphGradeResult,
  type R2GradingMode,
} from './engine';
import {
  getR2Kv,
  loadHeadlineCatalog,
  loadHeadlinePassage,
  setR2Kv,
  type HeadlineCatalogItem,
} from './readingLoader';

const R2_RECENT_PASSAGES_KV_KEY = 'r2_recent_passages_v1';
const R2_RECENT_TTL_MS = 14 * 86_400_000;

interface RecentR2Passage {
  id: string;
  ts: number;
}

function isTextInputFocused(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function getHotkeyLabel(index: number): string {
  if (index >= 0 && index <= 8) return String(index + 1);
  if (index === 9) return '0';
  return '';
}

export const R2HeadlineEditor: React.FC<GameProps> = ({
  mode: initialModeProp,
  level: initialLevelProp,
  onExit,
}) => {
  const prefersReduced = useReducedMotion();
  const gameMode: 'training' | 'exam' = initialModeProp === 'exam' ? 'exam' : 'training';

  const [catalog, setCatalog] = useState<HeadlineCatalogItem[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [loading, setLoading] = useState(true);

  const [level, setLevel] = useState<number>(() =>
    Math.max(1, Math.min(10, Math.round(initialLevelProp || 3))),
  );
  const [gradingOverride, setGradingOverride] = useState<R2GradingMode | undefined>(undefined);
  const [session, setSession] = useState<HeadlineSessionState | null>(null);
  const sessionRef = useRef<HeadlineSessionState | null>(null);
  sessionRef.current = session;
  const [clickSelectsSentence, setClickSelectsSentence] = useState(true);
  const [mobileBankOpen, setMobileBankOpen] = useState(false);
  const [passageSheetOpen, setPassageSheetOpen] = useState(false);

  // Elapsed seconds on current paragraph
  const [paraElapsedSec, setParaElapsedSec] = useState(0);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [rejectedHeadingKey, setRejectedHeadingKey] = useState<string | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);

  const pendingSrsCardsRef = useRef<SRSCard[]>([]);
  const activeParaElRef = useRef<HTMLDivElement | null>(null);
  const saverRef = useRef(
    createProgressSaver({
      saveProgress: (payload) => attemptRepo.saveProgress(payload),
      finalize: (attemptId, payload) => attemptRepo.finalize(attemptId, payload),
    }),
  );

  const persistSnapshot = useCallback((target: HeadlineSessionState | null, final: boolean) => {
    if (!target) return Promise.resolve();
    const snap = buildR2ProgressSnapshot(target, pendingSrsCardsRef.current, Date.now());
    if (!snap) return saverRef.current.persist(null, final);
    const before =
      snap.items.length > 0 || (final && snap.bandEvidence && snap.bandEvidence.length > 0)
        ? async () => {
            for (const item of snap.items) {
              await userItemRepo.upsertWithCard(item, 'head_retry', { cardSource: 'user' });
            }
            if (final && snap.bandEvidence && snap.bandEvidence.length > 0) {
              await db.bandSnapshots.bulkAdd(snap.bandEvidence);
            }
          }
        : undefined;
    return saverRef.current.persist(snap.progress, final, before);
  }, []);

  // Đăng ký lưu tiến độ cho nút "Lưu và thoát" của PlayScreen (TU-02)
  useEffect(() => {
    return registerProgressSaver(() => persistSnapshot(sessionRef.current, false));
  }, [persistSnapshot]);

  // 1. Load catalog on mount & chọn bài tránh lặp 14 ngày (R2-1)
  useEffect(() => {
    let active = true;
    void (async () => {
      const now = Date.now();
      const [items, recentRaw] = await Promise.all([
        loadHeadlineCatalog(),
        getR2Kv<RecentR2Passage[]>(R2_RECENT_PASSAGES_KV_KEY, []),
      ]);
      if (!active) return;
      setCatalog(items);
      if (items.length > 0) {
        const recentIds = (Array.isArray(recentRaw) ? recentRaw : [])
          .filter((r) => now - r.ts < R2_RECENT_TTL_MS)
          .map((r) => r.id);
        const picked =
          selectR2Passage(items, {
            recentIds,
            seed: `r2:${now}:${Math.random().toString(36).slice(2, 8)}`,
          }) ?? items[0];
        setSelectedCatalogId(picked.id);
        const firstPassage = await loadHeadlinePassage(picked);
        if (!active) return;
        setPassage(firstPassage);
        const updatedRecent = [
          ...(Array.isArray(recentRaw) ? recentRaw : []).filter(
            (r) => r.id !== firstPassage.id && now - r.ts < R2_RECENT_TTL_MS,
          ),
          { id: firstPassage.id, ts: now },
        ];
        void setR2Kv(R2_RECENT_PASSAGES_KV_KEY, updatedRecent);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // 2. Initialize / reset session whenever passage, level, or gradingOverride changes
  useEffect(() => {
    if (!passage) return;
    saverRef.current.reset();
    pendingSrsCardsRef.current = [];
    setSessionSaved(false);
    setParaElapsedSec(0);
    setRejectedHeadingKey(null);
    setMobileBankOpen(false);
    const next = createHeadlineSession(passage, {
      level,
      mode: gameMode,
      gradingModeOverride: gradingOverride,
    });
    sessionRef.current = next;
    setSession(next);
  }, [passage, level, gameMode, gradingOverride]);

  const currentTask = session ? getCurrentTask(session) : null;
  const isCurrentGraded = Boolean(
    session &&
      currentTask &&
      session.config.gradingMode === 'per_paragraph' &&
      session.results[currentTask.paragraphLabel],
  );

  // 3. Per-paragraph skimming timer (pauses when graded or completed)
  useEffect(() => {
    if (!session || session.completed || isCurrentGraded) return;
    const id = window.setInterval(() => {
      setParaElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [session, isCurrentGraded]);

  // 4. Smooth scroll active paragraph into view on paragraph change
  useEffect(() => {
    if (!currentTask) return;
    const el = activeParaElRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'nearest',
      });
    }
  }, [currentTask?.paragraphLabel, prefersReduced]);

  // 5. Finalize completed session to IndexedDB (idempotent qua progressSaver + userItems head:*)
  useEffect(() => {
    if (!session || !session.completed || sessionSaved) return;
    setSessionSaved(true);
    playSfx('sessionDone', { examMode: gameMode === 'exam' });
    void persistSnapshot(session, true);
  }, [session, sessionSaved, gameMode, persistSnapshot]);

  const handleSelectCatalogPassage = async (id: string) => {
    const item = catalog.find((c) => c.id === id);
    if (!item) return;
    setSelectedCatalogId(id);
    setLoading(true);
    const loaded = await loadHeadlinePassage(item);
    setPassage(loaded);
    const now = Date.now();
    const prevRecent = await getR2Kv<RecentR2Passage[]>(R2_RECENT_PASSAGES_KV_KEY, []);
    const nextRecent = [
      ...(Array.isArray(prevRecent) ? prevRecent : []).filter(
        (r) => r.id !== loaded.id && now - r.ts < R2_RECENT_TTL_MS,
      ),
      { id: loaded.id, ts: now },
    ];
    void setR2Kv(R2_RECENT_PASSAGES_KV_KEY, nextRecent);
    setLoading(false);
  };

  const handleFocusParagraph = useCallback(
    (index: number) => {
      if (!session || session.completed) return;
      const cur = getCurrentTask(session);
      let next = session;
      if (cur && paraElapsedSec > 0 && !session.lockedParagraphs[cur.paragraphLabel]) {
        next = addParagraphDuration(next, cur.paragraphLabel, paraElapsedSec);
      }
      setParaElapsedSec(0);
      setSession(selectParagraphIndex(next, index));
    },
    [session, paraElapsedSec],
  );

  const handleSelectHeading = useCallback(
    (headingKey: string) => {
      if (!session || session.completed || isCurrentGraded) return;
      const transition = assignHeadingChoice(session, headingKey);
      const rejected = transition.events.find((e) => e.type === 'heading_locked_rejected');
      if (rejected) {
        setRejectedHeadingKey(headingKey);
        setShakeTrigger((n) => n + 1);
        playSfx('wrong', { examMode: gameMode === 'exam' });
        window.setTimeout(() => setRejectedHeadingKey(null), 500);
        return;
      }
      playSfx('page', { examMode: gameMode === 'exam' });
      setSession(transition.state);
      setMobileBankOpen(false);
    },
    [session, isCurrentGraded, gameMode],
  );

  const handleSubmitParagraph = useCallback(() => {
    if (!session || !canSubmitCurrentParagraph(session)) return;
    const transition = submitCurrentParagraph(session, paraElapsedSec);
    sessionRef.current = transition.state;
    setSession(transition.state);
    setParaElapsedSec(0);

    const gradedEvt = transition.events.find((e) => e.type === 'paragraph_graded');
    if (gradedEvt && gradedEvt.type === 'paragraph_graded') {
      if (gradedEvt.srsCard) {
        pendingSrsCardsRef.current = [...pendingSrsCardsRef.current, gradedEvt.srsCard];
      }
      if (gradedEvt.result.headingCorrect) {
        playSfx('correct', { examMode: gameMode === 'exam' });
      } else {
        setShakeTrigger((n) => n + 1);
        playSfx('wrong', { examMode: gameMode === 'exam' });
      }
    }
    void persistSnapshot(transition.state, false);
  }, [session, paraElapsedSec, gameMode, persistSnapshot]);

  const handleAdvanceNext = useCallback(() => {
    if (!session) return;
    playSfx('page', { examMode: gameMode === 'exam' });
    const transition = advanceAfterParagraphGrade(session);
    setParaElapsedSec(0);
    sessionRef.current = transition.state;
    setSession(transition.state);
  }, [session, gameMode]);

  const handleSubmitAllPassage = useCallback(() => {
    if (!session || !canSubmitPassage(session)) return;
    const cur = getCurrentTask(session);
    let prepared = session;
    if (cur && paraElapsedSec > 0) {
      prepared = addParagraphDuration(prepared, cur.paragraphLabel, paraElapsedSec);
    }
    const totalSec = Math.max(1, Math.round((Date.now() - prepared.startedAt) / 1000));
    const transition = submitEntirePassage(prepared, totalSec);

    const gradedEvt = transition.events.find((e) => e.type === 'passage_graded');
    if (gradedEvt && gradedEvt.type === 'passage_graded') {
      pendingSrsCardsRef.current = [...pendingSrsCardsRef.current, ...gradedEvt.srsCards];
      // R2-4: phản hồi âm thanh khi nộp cả bài
      const anyCorrect = gradedEvt.results.some((r) => r.headingCorrect);
      playSfx(anyCorrect ? 'correct' : 'wrong', { examMode: gameMode === 'exam' });
    }
    setParaElapsedSec(0);
    sessionRef.current = transition.state;
    setSession(transition.state);
  }, [session, paraElapsedSec, gameMode]);

  const handleRestart = useCallback(() => {
    if (!passage) return;
    saverRef.current.reset();
    pendingSrsCardsRef.current = [];
    setSessionSaved(false);
    setParaElapsedSec(0);
    const fresh = createHeadlineSession(passage, {
      level,
      mode: gameMode,
      gradingModeOverride: gradingOverride,
    });
    sessionRef.current = fresh;
    setSession(fresh);
  }, [passage, level, gameMode, gradingOverride]);

  const handleRetryMistakes = useCallback(() => {
    const cur = sessionRef.current;
    if (!cur) return;
    const retry = createHeadlineRetrySession(cur, Date.now());
    if (!retry) {
      handleRestart();
      return;
    }
    saverRef.current.reset();
    pendingSrsCardsRef.current = [];
    setSessionSaved(false);
    setParaElapsedSec(0);
    sessionRef.current = retry;
    setSession(retry);
  }, [handleRestart]);

  // 6. Keyboard shortcuts: 1-9 -> i-ix, 0 -> x, Enter -> submit / next
  useEffect(() => {
    if (!session || session.completed) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTextInputFocused(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const idx = keyToHeadingIndex(e.key);
      if (idx >= 0 && idx < session.headings.length && !isCurrentGraded) {
        e.preventDefault();
        handleSelectHeading(session.headings[idx].key);
        return;
      }

      if (e.key === 'Enter') {
        if (session.config.gradingMode === 'per_paragraph') {
          if (isCurrentGraded) {
            e.preventDefault();
            handleAdvanceNext();
          } else if (canSubmitCurrentParagraph(session)) {
            e.preventDefault();
            handleSubmitParagraph();
          }
        } else if (canSubmitPassage(session)) {
          e.preventDefault();
          handleSubmitAllPassage();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    session,
    isCurrentGraded,
    handleSelectHeading,
    handleAdvanceNext,
    handleSubmitParagraph,
    handleSubmitAllPassage,
  ]);

  const usedHeadingsMap = useMemo(
    () => (session ? getUsedHeadingsMap(session) : {}),
    [session],
  );

  const headingByKey = useMemo(() => {
    const map: Record<string, string> = {};
    if (session) {
      for (const h of session.headings) {
        map[h.key] = h.text;
      }
    }
    return map;
  }, [session]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 py-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton lines={8} />
      </div>
    );
  }

  if (!passage || !session) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <EmptyState
          title="Chưa có bài đọc Matching Headings"
          description="Không tìm thấy passage có nhóm câu hỏi headings để khởi chạy Headline Editor."
          action={
            <Button variant="primary" skill="reading" onClick={() => onExit()}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RECAP VIEW: Metrics + "Trang báo hoàn chỉnh" (Complete Newspaper Page)
  // -------------------------------------------------------------------------
  if (session.completed) {
    const editableTasks = session.tasks.filter((t) => !t.isExample);
    const results = editableTasks
      .map((t) => session.results[t.paragraphLabel])
      .filter((r): r is ParagraphGradeResult => Boolean(r));
    const correctCount = results.filter((r) => r.headingCorrect).length;
    const accuracyPercent =
      editableTasks.length > 0 ? Math.round((correctCount / editableTasks.length) * 100) : 0;
    const durationSec = Math.max(
      1,
      Math.round(((session.endedAt ?? Date.now()) - session.startedAt) / 1000),
    );
    const winStatement = buildR2WinStatement(session);
    const mistakes: RecapMistakeItem[] = results
      .filter((r) => !r.headingCorrect)
      .map((r) => ({
        id: r.qid,
        prompt: `Đoạn ${r.paragraphLabel}`,
        userAnswer: `${r.chosenHeadingKey} · ${headingByKey[r.chosenHeadingKey] ?? ''}`,
        correctAnswer: `${r.correctHeadingKey} · ${headingByKey[r.correctHeadingKey] ?? ''}`,
        note: r.feedbackVi,
      }));

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12" data-testid="r2-recap">
        <RecapScreen
          scoreLabel={`${correctCount}/${editableTasks.length}`}
          xpEarned={session.totalXp}
          winStatement={winStatement}
          accuracyPercent={accuracyPercent}
          durationSec={durationSec}
          mistakes={mistakes}
          onRetryMistakes={handleRetryMistakes}
          onGoToday={() =>
            onExit({
              gameId: 'r2',
              score: correctCount,
              maxScore: editableTasks.length,
              xp: session.totalXp,
            })
          }
          className="max-w-none"
        />

        {/* Trang báo hoàn chỉnh */}
        <Card
          padding="lg"
          skillAccent="reading"
          className="space-y-6"
          data-testid="r2-newspaper-page"
        >
          <div
            className="pb-4 border-b-2 text-center space-y-1.5"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-reading)' }}>
              <Newspaper className="w-4 h-4" />
              <span>Trang báo hoàn chỉnh · The Lexicon Chronicle</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-reading)', color: 'var(--color-text)' }}
            >
              {passage.title}
            </h2>
            {passage.subtitle && (
              <p className="text-sm italic" style={{ color: 'var(--color-text-dim)' }}>
                {passage.subtitle}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {passage.paragraphs.map((para) => {
              const task = session.tasks.find((t) => t.paragraphLabel === para.label);
              const res = session.results[para.label];
              const finalKey = task?.correctHeadingKey;
              const finalHeadingText = finalKey ? headingByKey[finalKey] : undefined;

              return (
                <article
                  key={para.label}
                  className="p-4 sm:p-5 rounded-[var(--radius-md)] border space-y-3"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: res
                      ? res.headingCorrect
                        ? 'color-mix(in srgb, var(--color-correct) 45%, var(--color-border))'
                        : 'color-mix(in srgb, var(--color-wrong) 45%, var(--color-border))'
                      : 'var(--color-border)',
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] text-xs font-bold shrink-0"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-reading)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        {para.label}
                      </span>
                      {finalKey && finalHeadingText ? (
                        <h3
                          className="text-lg sm:text-xl font-bold leading-snug"
                          style={{
                            fontFamily: 'var(--font-reading)',
                            color: 'var(--color-text)',
                          }}
                        >
                          <span
                            className="mr-2 text-sm uppercase"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--color-reading)',
                            }}
                          >
                            {finalKey}.
                          </span>
                          {finalHeadingText}
                        </h3>
                      ) : (
                        <span className="text-xs italic" style={{ color: 'var(--color-text-faint)' }}>
                          Đoạn mở rộng (không có câu hỏi tít)
                        </span>
                      )}
                    </div>

                    {res && (
                      <Pill tone={res.headingCorrect ? 'correct' : 'wrong'}>
                        {res.headingCorrect
                          ? `✓ +${res.totalXp} XP`
                          : `Bạn chọn ${res.chosenHeadingKey} → Đúng: ${res.correctHeadingKey}`}
                      </Pill>
                    )}
                  </div>

                  <Highlighter
                    paragraphLabel={para.label}
                    text={para.text}
                    mode="readonly"
                    answerSpans={task?.mainIdeaSpan ? [task.mainIdeaSpan] : []}
                    autoScrollToAnswer={false}
                  />
                </article>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={handleRestart}
            >
              Chơi lại bài này
            </Button>
            <Button
              variant="primary"
              skill="reading"
              onClick={() => onExit()}
            >
              Về trang Hôm nay
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ACTIVE NEWSROOM WORKSPACE
  // -------------------------------------------------------------------------
  const editableTasks = session.tasks.filter((t) => !t.isExample);
  const currentEditablePosition = currentTask
    ? Math.max(
        1,
        editableTasks.findIndex((t) => t.paragraphLabel === currentTask.paragraphLabel) + 1,
      )
    : 1;
  const activeResult = currentTask ? session.results[currentTask.paragraphLabel] : undefined;
  const activeChosenKey = currentTask ? session.assignedHeadings[currentTask.paragraphLabel] : undefined;
  const activeUserSpan = currentTask ? session.userMainIdeaSpans[currentTask.paragraphLabel] : undefined;
  const targetSec = session.config.targetSecPerParagraph;
  const isOverTimeTarget = paraElapsedSec > targetSec;

  const assignedCount = editableTasks.filter((t) =>
    Boolean(session.assignedHeadings[t.paragraphLabel]),
  ).length;

  const renderHeadlineBankList = () => (
    <div className="space-y-2" data-testid="r2-heading-bank">
      {session.headings.map((h, idx) => {
        const usedByPara = usedHeadingsMap[h.key];
        const isLockedByOther = Boolean(
          usedByPara && currentTask && usedByPara !== currentTask.paragraphLabel,
        );
        const isSelectedForCurrent = Boolean(activeChosenKey === h.key);
        const isRejected = rejectedHeadingKey === h.key;
        const hotkey = getHotkeyLabel(idx);

        return (
          <motion.button
            key={h.key}
            type="button"
            disabled={isLockedByOther || isCurrentGraded}
            onClick={() => handleSelectHeading(h.key)}
            variants={prefersReduced ? undefined : wrongShakeVariants}
            animate={isRejected ? 'wrong' : 'idle'}
            data-testid={`r2-heading-${h.key}`}
            className="w-full text-left px-3.5 py-2.5 rounded-[var(--radius-md)] border transition-colors flex items-start gap-3 cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
            style={{
              backgroundColor: isSelectedForCurrent
                ? 'color-mix(in srgb, var(--color-reading) 16%, var(--color-surface-2))'
                : isLockedByOther
                  ? 'var(--color-surface)'
                  : 'var(--color-surface-2)',
              borderColor: isSelectedForCurrent
                ? 'var(--color-reading)'
                : isRejected
                  ? 'var(--color-wrong)'
                  : 'var(--color-border)',
              opacity: isLockedByOther ? 0.45 : 1,
            }}
          >
            <span
              className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-[var(--radius-sm)] text-xs font-bold shrink-0"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: isSelectedForCurrent
                  ? 'var(--color-reading)'
                  : 'var(--color-surface)',
                color: isSelectedForCurrent ? 'var(--color-bg)' : 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            >
              {h.key}
            </span>

            <div className="min-w-0 flex-1 space-y-1">
              <div
                className="text-sm font-medium leading-snug break-words"
                style={{
                  color: 'var(--color-text)',
                  textDecoration: isLockedByOther ? 'line-through' : 'none',
                }}
              >
                {h.text}
              </div>
              {usedByPara && (
                <div
                  className="text-xs font-semibold"
                  style={{
                    color: isSelectedForCurrent
                      ? 'var(--color-reading)'
                      : 'var(--color-text-dim)',
                  }}
                >
                  {isSelectedForCurrent
                    ? `← Đang chọn cho Đoạn ${usedByPara}`
                    : `Đã dùng cho Đoạn ${usedByPara}`}
                </div>
              )}
            </div>

            {hotkey && !isLockedByOther && (
              <span
                className="shrink-0 hidden sm:inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-medium rounded border select-none"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-dim)',
                }}
              >
                {hotkey}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );

  return (
    <div
      className="max-w-7xl mx-auto px-3 sm:px-4 space-y-4 pb-24 min-[900px]:pb-10 overflow-x-clip"
      data-testid="r2-headline-editor"
    >
      {/* Thanh trạng thái phiên (không lặp nút thoát ✕ của PlayScreen - U3; chống tràn ngang - U7) */}
      <div
        className="px-3 sm:px-4 py-3 rounded-[var(--radius-lg)] border flex flex-wrap items-center justify-between gap-2.5 min-w-0"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="reading" icon={<Newspaper className="w-3.5 h-3.5" />}>
                R2 · Headline Editor
              </Pill>
              {session.isRetry && <Pill tone="neutral">Ôn câu sai · 0 XP</Pill>}
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
              >
                {currentTask
                  ? `Đoạn ${currentTask.paragraphLabel} (${currentEditablePosition}/${editableTasks.length})`
                  : `${editableTasks.length} đoạn`}
              </span>
            </div>
            <h1
              className="text-sm sm:text-base font-bold truncate mt-0.5"
              style={{ color: 'var(--color-text)' }}
            >
              {passage.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
          {/* Grading Mode / Level Quick Switcher */}
          {gameMode === 'training' && (
            <div
              className="inline-flex flex-wrap items-center gap-1 p-1 rounded-[var(--radius-sm)] border text-xs max-w-full"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
              role="group"
              aria-label="Kiểu chấm bài"
            >
              <button
                type="button"
                onClick={() => {
                  setLevel(3);
                  setGradingOverride('per_paragraph');
                }}
                data-testid="r2-mode-per-paragraph"
                className="px-2.5 py-2 min-h-[44px] rounded font-semibold cursor-pointer transition-colors"
                style={{
                  backgroundColor:
                    session.config.gradingMode === 'per_paragraph'
                      ? 'var(--color-surface)'
                      : 'transparent',
                  color:
                    session.config.gradingMode === 'per_paragraph'
                      ? 'var(--color-reading)'
                      : 'var(--color-text-dim)',
                }}
              >
                Từng đoạn (Lv.{session.config.gradingMode === 'per_paragraph' ? level : 3})
              </button>
              <button
                type="button"
                onClick={() => {
                  setLevel(8);
                  setGradingOverride('end_of_passage');
                }}
                data-testid="r2-mode-end-passage"
                className="px-2.5 py-2 min-h-[44px] rounded font-semibold cursor-pointer transition-colors"
                style={{
                  backgroundColor:
                    session.config.gradingMode === 'end_of_passage'
                      ? 'var(--color-surface)'
                      : 'transparent',
                  color:
                    session.config.gradingMode === 'end_of_passage'
                      ? 'var(--color-reading)'
                      : 'var(--color-text-dim)',
                }}
              >
                Chấm cuối (Lv.8)
              </button>
            </div>
          )}

          {/* Passage picker button + Sheet (thay <select> gốc để đạt D10 & U7) */}
          {catalog.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Chọn bài đọc"
                onClick={() => setPassageSheetOpen(true)}
                className="w-full sm:w-auto max-w-full min-w-0 min-h-[44px] inline-flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-sm)] border text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                <span className="truncate">
                  {passage.level} · {passage.title}
                </span>
                <span className="shrink-0" style={{ color: 'var(--color-text-dim)' }}>
                  Đổi bài
                </span>
              </button>
              <Sheet
                open={passageSheetOpen}
                onClose={() => setPassageSheetOpen(false)}
                title="Chọn bài đọc R2"
                subtitle="Chọn bài đọc Matching Headings để luyện tập."
              >
                <div className="space-y-2">
                  {catalog.map((c) => {
                    const active = c.id === selectedCatalogId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setPassageSheetOpen(false);
                          void handleSelectCatalogPassage(c.id);
                        }}
                        className="w-full text-left min-h-[44px] px-3.5 py-2.5 rounded-[var(--radius-md)] border cursor-pointer transition-colors"
                        style={{
                          backgroundColor: active
                            ? 'color-mix(in srgb, var(--color-reading) 14%, var(--color-surface-2))'
                            : 'var(--color-surface-2)',
                          borderColor: active ? 'var(--color-reading)' : 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      >
                        <div className="text-sm font-semibold">
                          {c.level} · {c.title}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                          {c.paragraphCount} đoạn · {c.wordCount} từ
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Sheet>
            </>
          )}

          {/* Skimming Timer */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border text-xs font-bold tabular-nums"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: isOverTimeTarget
                ? 'color-mix(in srgb, var(--color-partial) 14%, var(--color-surface-2))'
                : 'var(--color-surface-2)',
              borderColor: isOverTimeTarget ? 'var(--color-partial)' : 'var(--color-border)',
              color: isOverTimeTarget ? 'var(--color-partial)' : 'var(--color-text)',
            }}
            data-testid="r2-skimming-timer"
            title={`Mục tiêu đọc lướt: ${targetSec}s/đoạn (+5 XP nếu đạt)`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {formatSeconds(paraElapsedSec)} / {formatSeconds(targetSec)}
            </span>
          </div>

          <Pill tone="correct">+{session.totalXp} XP</Pill>
        </div>
      </div>

      {/* Main 2-column Newsroom Layout: Left Bản thảo | Right Kho tít */}
      <div className="min-[900px]:grid min-[900px]:grid-cols-12 min-[900px]:gap-5 items-start">
        {/* LEFT COLUMN: BẢN THẢO (MANUSCRIPT) */}
        <section
          aria-label="Bản thảo bài báo"
          className="min-[900px]:col-span-7 rounded-[var(--radius-lg)] border flex flex-col"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Manuscript Toolbar */}
          <div
            className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: 'var(--color-reading)' }} />
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-dim)' }}
              >
                Bản thảo · {passage.level} · {passage.wordCount} từ
              </span>
            </div>

            {session.config.mainIdeaStep !== 'off' && (
              <button
                type="button"
                onClick={() => setClickSelectsSentence((v) => !v)}
                aria-pressed={clickSelectsSentence}
                data-testid="r2-toggle-sentence-select"
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-[var(--radius-sm)] border text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: clickSelectsSentence
                    ? 'color-mix(in srgb, var(--color-info) 16%, var(--color-surface))'
                    : 'var(--color-surface-2)',
                  borderColor: clickSelectsSentence ? 'var(--color-info)' : 'var(--color-border)',
                  color: clickSelectsSentence ? 'var(--color-text)' : 'var(--color-text-dim)',
                }}
              >
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>Chạm câu để bôi ý chính</span>
              </button>
            )}
          </div>

          {/* Paragraph List */}
          <div className="p-4 sm:p-5 space-y-4 min-[900px]:max-h-[calc(100vh-260px)] min-[900px]:overflow-y-auto">
            {passage.paragraphs.map((para) => {
              const taskIdx = session.tasks.findIndex((t) => t.paragraphLabel === para.label);
              const task = taskIdx >= 0 ? session.tasks[taskIdx] : null;
              const isActive = Boolean(currentTask && currentTask.paragraphLabel === para.label);
              const res = session.results[para.label];
              const assignedKey = session.assignedHeadings[para.label];
              const printedHeadingKey = res ? res.correctHeadingKey : assignedKey;
              const printedHeadingText = printedHeadingKey ? headingByKey[printedHeadingKey] : undefined;
              const userSpan = session.userMainIdeaSpans[para.label];
              const showGoldAnswer = Boolean(res && task?.mainIdeaSpan);

              // Visual dimming per R2 §10: active = crisp surface-2 + reading left border, others dimmed 40% (opacity 0.6)
              const isInteractiveSwitch =
                Boolean(task) &&
                !task?.isExample &&
                (session.config.gradingMode === 'end_of_passage' || Boolean(res));

              return (
                <div
                  key={para.label}
                  ref={isActive ? activeParaElRef : undefined}
                  onClick={() => {
                    if (isInteractiveSwitch && taskIdx >= 0 && !isActive) {
                      handleFocusParagraph(taskIdx);
                    }
                  }}
                  data-testid={`r2-paragraph-${para.label}`}
                  className={`rounded-[var(--radius-md)] border p-4 transition-all ${
                    isInteractiveSwitch && !isActive ? 'cursor-pointer hover:opacity-85' : ''
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? 'var(--color-surface-2)'
                      : 'var(--color-surface)',
                    borderColor: isActive ? 'var(--color-reading)' : 'var(--color-border)',
                    borderLeftWidth: isActive ? '4px' : '1px',
                    borderLeftColor: isActive ? 'var(--color-reading)' : 'var(--color-border)',
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  {/* Paragraph header row + Printed Serif Headline */}
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] border text-xs font-bold shrink-0"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: isActive
                            ? 'var(--color-reading)'
                            : 'var(--color-surface-2)',
                          borderColor: isActive ? 'var(--color-reading)' : 'var(--color-border)',
                          color: isActive ? 'var(--color-bg)' : 'var(--color-text-dim)',
                        }}
                      >
                        {para.label}
                      </span>

                      {task?.isExample && <Pill tone="neutral">Ví dụ có sẵn</Pill>}

                      {!task && (
                        <span className="text-xs italic" style={{ color: 'var(--color-text-faint)' }}>
                          Đoạn đọc thêm (không đặt tít)
                        </span>
                      )}

                      {isActive && task && !res && (
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-reading)' }}>
                          Đang biên tập
                        </span>
                      )}
                    </div>

                    {res && (
                      <Pill tone={res.headingCorrect ? 'correct' : 'wrong'}>
                        {res.headingCorrect ? `✓ +${res.totalXp} XP` : `Đúng: ${res.correctHeadingKey}`}
                      </Pill>
                    )}

                    {!res &&
                      assignedKey &&
                      session.config.gradingMode === 'end_of_passage' && (
                        <div className="flex items-center gap-1.5">
                          <Pill tone="reading">Đã chọn: {assignedKey}</Pill>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSession(clearHeadingChoice(session, para.label));
                            }}
                            className="p-1 rounded hover:opacity-80 cursor-pointer"
                            style={{ color: 'var(--color-text-dim)' }}
                            aria-label={`Bỏ chọn tít đoạn ${para.label}`}
                            title="Bỏ chọn tít"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                  </div>

                  {/* Printed Headline in Bold Serif */}
                  <AnimatePresence mode="wait">
                    {printedHeadingKey && printedHeadingText && (
                      <motion.div
                        key={`${para.label}-${printedHeadingKey}`}
                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={prefersReduced ? { duration: 0.1 } : spring.snappy}
                        className="mb-3 px-3 py-2 rounded-[var(--radius-sm)] border-l-2"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-reading) 10%, var(--color-surface))',
                          borderLeftColor: 'var(--color-reading)',
                        }}
                        data-testid={`r2-printed-heading-${para.label}`}
                      >
                        <div
                          className="text-base sm:text-lg font-bold leading-snug"
                          style={{
                            fontFamily: 'var(--font-reading)',
                            color: 'var(--color-text)',
                          }}
                        >
                          <span
                            className="mr-2 text-xs uppercase"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--color-reading)',
                            }}
                          >
                            {printedHeadingKey}.
                          </span>
                          {printedHeadingText}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Paragraph text with Highlighter */}
                  <Highlighter
                    paragraphLabel={para.label}
                    text={para.text}
                    mode={
                      isActive &&
                      !isCurrentGraded &&
                      session.config.mainIdeaStep !== 'off'
                        ? 'evidence'
                        : 'readonly'
                    }
                    clickSelectsSentence={clickSelectsSentence}
                    userSpans={userSpan ? [userSpan] : []}
                    answerSpans={showGoldAnswer && task?.mainIdeaSpan ? [task.mainIdeaSpan] : []}
                    autoScrollToAnswer={false}
                    onSelectSpan={(sp) => {
                      if (!isActive || isCurrentGraded) return;
                      playSfx('highlight', { examMode: gameMode === 'exam' });
                      const tr = selectMainIdeaSpan(session, {
                        paragraph: para.label,
                        start: sp.start,
                        end: sp.end,
                        quote: sp.quote ?? para.text.slice(sp.start, sp.end),
                      });
                      setSession(tr.state);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT COLUMN (DESKTOP >= 900px): KHO TÍT + FEEDBACK */}
        <aside
          aria-label="Kho tiêu đề"
          className="hidden min-[900px]:flex min-[900px]:col-span-5 flex-col gap-4 min-[900px]:sticky min-[900px]:top-4"
        >
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" style={{ color: 'var(--color-reading)' }} />
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                  Kho tít ({session.headings.length})
                </h2>
              </div>
              <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                Phím 1–9 chọn nhanh
              </span>
            </div>

            <div className="max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
              {renderHeadlineBankList()}
            </div>
          </Card>

          {/* Immediate Feedback Card (per_paragraph mode) */}
          <AnimatePresence mode="wait">
            {activeResult && (
              <motion.div
                key={`fb-${activeResult.qid}-${shakeTrigger}`}
                variants={prefersReduced ? reducedRouteVariants : feedbackSlideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Card
                  padding="md"
                  className="space-y-2.5"
                  style={{
                    borderColor: activeResult.headingCorrect
                      ? 'var(--color-correct)'
                      : activeResult.mainIdeaCorrect
                        ? 'var(--color-partial)'
                        : 'var(--color-wrong)',
                  }}
                  data-testid="r2-feedback-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      {activeResult.headingCorrect ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-correct)' }} />
                      ) : activeResult.mainIdeaCorrect ? (
                        <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-partial)' }} />
                      ) : (
                        <XCircle className="w-4 h-4" style={{ color: 'var(--color-wrong)' }} />
                      )}
                      <span style={{ color: 'var(--color-text)' }}>
                        {activeResult.headingCorrect
                          ? 'Đặt tít chuẩn xác!'
                          : activeResult.mainIdeaCorrect
                            ? 'Đúng ý chính · Chưa đúng tít'
                            : 'Chưa khớp ý chính'}
                      </span>
                    </div>
                    <Pill
                      tone={
                        activeResult.headingCorrect
                          ? 'correct'
                          : activeResult.mainIdeaCorrect
                            ? 'partial'
                            : 'wrong'
                      }
                    >
                      +{activeResult.totalXp} XP
                    </Pill>
                  </div>

                  {activeResult.distractorType && (
                    <div>
                      <Pill tone="wrong">
                        Bẫy: {HEADING_DISTRACTOR_LABELS_VI[activeResult.distractorType]}
                      </Pill>
                    </div>
                  )}

                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>
                    {activeResult.feedbackVi}
                  </p>

                  {!activeResult.headingCorrect && !session.reserved && (
                    <div
                      className="text-xs flex items-center gap-1.5 pt-1"
                      style={{ color: 'var(--color-text-dim)' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-vocab)' }} />
                      <span>Đã thêm thẻ ôn tập head:{activeResult.qid} vào hàng đợi FSRS.</span>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>

      {/* Mobile Feedback Banner (< 900px) */}
      {activeResult && (
        <div className="min-[900px]:hidden">
          <Card
            padding="md"
            className="space-y-2"
            style={{
              borderColor: activeResult.headingCorrect
                ? 'var(--color-correct)'
                : 'var(--color-wrong)',
            }}
          >
            <div className="flex items-center justify-between gap-2 text-sm font-bold">
              <span style={{ color: 'var(--color-text)' }}>
                {activeResult.headingCorrect ? 'Đặt tít chuẩn xác!' : 'Chưa đúng tít'}
              </span>
              <Pill tone={activeResult.headingCorrect ? 'correct' : 'wrong'}>
                +{activeResult.totalXp} XP
              </Pill>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>
              {activeResult.feedbackVi}
            </p>
          </Card>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t px-4 py-3 backdrop-blur-md min-[900px]:static min-[900px]:rounded-[var(--radius-lg)] min-[900px]:border"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-surface) 94%, transparent)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Step indicators */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {session.config.mainIdeaStep !== 'off' && (
              <div className="inline-flex items-center gap-1.5">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: activeUserSpan
                      ? 'var(--color-correct)'
                      : 'var(--color-surface-2)',
                    color: activeUserSpan ? 'var(--color-bg)' : 'var(--color-text-dim)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {activeUserSpan ? <Check className="w-3 h-3" /> : '1'}
                </span>
                <span style={{ color: 'var(--color-text)' }}>
                  Bôi ý chính
                  {session.config.mainIdeaStep === 'optional' && (
                    <span style={{ color: 'var(--color-text-dim)' }}> (tuỳ chọn +5 XP)</span>
                  )}
                </span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5">
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: activeChosenKey
                    ? 'var(--color-reading)'
                    : 'var(--color-surface-2)',
                  color: activeChosenKey ? 'var(--color-bg)' : 'var(--color-text-dim)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {activeChosenKey ? <Check className="w-3 h-3" /> : '2'}
              </span>
              <span style={{ color: 'var(--color-text)' }}>
                Chọn tít:{' '}
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-reading)' }}>
                  {activeChosenKey ? `[ ${activeChosenKey} ]` : '[ — ]'}
                </strong>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Narrow screen button to open Kho tít Bottom Sheet */}
            <Button
              variant="secondary"
              size="md"
              className="min-[900px]:hidden"
              leftIcon={<ListChecks className="w-4 h-4" />}
              onClick={() => setMobileBankOpen(true)}
              data-testid="r2-open-mobile-bank"
            >
              Kho tít ({session.headings.length})
            </Button>

            {session.config.gradingMode === 'per_paragraph' ? (
              isCurrentGraded ? (
                <Button
                  variant="primary"
                  skill="reading"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleAdvanceNext}
                  data-testid="r2-next-paragraph-btn"
                >
                  {editableTasks.every((t) => session.lockedParagraphs[t.paragraphLabel])
                    ? 'Xem trang báo hoàn chỉnh (Enter)'
                    : 'Đoạn tiếp theo (Enter)'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  skill="reading"
                  disabled={!canSubmitCurrentParagraph(session)}
                  onClick={handleSubmitParagraph}
                  data-testid="r2-place-heading-btn"
                >
                  Đặt tít (Enter)
                </Button>
              )
            ) : (
              <Button
                variant="primary"
                skill="reading"
                disabled={!canSubmitPassage(session)}
                onClick={handleSubmitAllPassage}
                data-testid="r2-submit-passage-btn"
              >
                Nộp cả bài ({assignedCount}/{editableTasks.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet for Kho tít (< 900px) */}
      <Sheet
        open={mobileBankOpen}
        onClose={() => setMobileBankOpen(false)}
        side="bottom"
        title={`Kho tít — Đoạn ${currentTask?.paragraphLabel ?? ''}`}
        subtitle="Mỗi tít chỉ dùng 1 lần. Chọn tít phù hợp nhất với ý chính cả đoạn."
      >
        {renderHeadlineBankList()}
      </Sheet>
    </div>
  );
};

export default R2HeadlineEditor;
