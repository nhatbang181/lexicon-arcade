import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Flame,
  Sparkles,
  Lightbulb,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Calendar,
  Award,
  Zap,
  BookmarkCheck,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AnswerInput,
  AudioButton,
  Button,
  Card,
  ChoiceButton,
  EmptyState,
  FeedbackPanel,
  Pill,
  ProgressRing,
  RecapScreen,
  type ChoiceState,
} from '../../design/components';
import {
  pickVariants,
  questionSlideVariants,
} from '../../design/motion';
import { playSfx } from '../../core/audio/sfx';
import { resolveAssetUrl } from '../../core/content/loaders';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { eventRepo } from '../../core/storage/repos/eventRepo';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import type { SRSCard } from '../../core/srs/fsrsAdapter';
import type { GameProps } from '../registry';
import {
  advanceAfterFeedback,
  applyNodeHint,
  buildV1ProgressPayload,
  computeLastWeekAccuracy,
  continueFromCheckpoint,
  createV1Run,
  finishAtCheckpoint,
  getActiveNode,
  getComboMultiplier,
  getRevealedPrefix,
  getTypedTargetText,
  isChoicePrompt,
  recordNodeAudioPlay,
  refundNodeAudioPlay,
  startPlayingFromMap,
  submitIntroAction,
  submitNodeAnswer,
  type CharDiffSegment,
  type V1ContentBundle,
  type V1RunMode,
  type V1RunState,
} from './engine';
import { loadV1Content, loadV1Extras } from './extras';
import { createProgressSaver } from './progressSaver';
import { buildStarterVocabCards } from './starter';
import { RunMap } from './RunMap';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty'; content: V1ContentBundle }
  | { kind: 'ready' };

interface RunContext {
  content: V1ContentBundle;
  newCardsLimit: number;
  newCardsDoneToday: number;
  lastWeekAccuracy: number | null;
}

const DAY_MS = 86_400_000;

function startOfLocalDay(now: Date): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Ghi `missing_item` (V1-2) tối đa 1 lần/thẻ/ngày để bảng events không phình ra. */
async function logMissingItems(items: V1RunState['missingItems']): Promise<void> {
  if (items.length === 0) return;
  const recent = await eventRepo.listRecent({ type: 'missing_item', limit: 300 }).catch(() => []);
  const cutoff = Date.now() - DAY_MS;
  const seen = new Set(
    recent.filter((e) => e.ts >= cutoff).map((e) => String(e.payload?.cardId ?? '')),
  );
  for (const m of items.slice(0, 50)) {
    if (seen.has(m.cardId)) continue;
    await eventRepo
      .log('missing_item', {
        game: 'v1',
        cardId: m.cardId,
        itemId: m.itemId,
        face: m.face,
        ...(m.reason ? { reason: m.reason } : {}),
      })
      .catch(() => undefined);
  }
}

export const V1DailyRun: React.FC<GameProps> = ({ mode, level, onExit }) => {
  const prefersReduced = useReducedMotion() ?? false;
  const initialRunMode: V1RunMode = mode === 'sprint' ? 'busy' : 'standard';

  const [loadState, setLoadState] = useState<LoadState>({ kind: 'loading' });
  const [runState, setRunState] = useState<V1RunState | null>(null);
  const [skillLevel, setSkillLevel] = useState<number>(Math.max(1, level || 1));
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [audioFallbackNotice, setAudioFallbackNotice] = useState<string | null>(null);
  const [audioMissing, setAudioMissing] = useState<boolean>(false);
  const [sessionSaved, setSessionSaved] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);

  const nodeStartedAtRef = useRef<number>(Date.now());
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);
  const initTokenRef = useRef<number>(0);
  const contextRef = useRef<RunContext | null>(null);
  const newCardsLimitRef = useRef<number>(15);

  // Lưu tiến độ giữa phiên (G3): hàng đợi ghi tuần tự, mỗi run 1 session riêng (xem progressSaver.ts).
  const saverRef = useRef(
    createProgressSaver({
      saveProgress: (payload) => attemptRepo.saveProgress(payload),
      finalize: (attemptId, payload) => attemptRepo.finalize(attemptId, payload),
    }),
  );
  const latestRunRef = useRef<V1RunState | null>(null);

  const persist = useCallback((state: V1RunState, final: boolean): Promise<void> => {
    const hasWork =
      state.attemptItems.length > 0 ||
      state.reviews.length > 0 ||
      Object.keys(state.updatedCards).length > 0;
    return saverRef.current.persist(hasWork ? buildV1ProgressPayload(state) : null, final);
  }, []);

  const resetPersistence = useCallback(() => {
    saverRef.current.reset();
    setSessionSaved(false);
  }, []);

  const startRun = useCallback(
    async (
      cards: SRSCard[],
      content: V1ContentBundle,
      effectiveLevel: number,
      newCardsLimit: number,
    ) => {
      const now = new Date();
      const [extras, doneToday, recentAttempts] = await Promise.all([
        loadV1Extras(cards, { now, dictations: content.dictations }),
        cardRepo.countNewCardsStartedSince(startOfLocalDay(now)).catch(() => 0),
        attemptRepo.getSince(now.getTime() - 2 * 7 * DAY_MS, 'v1').catch(() => []),
      ]);
      const bundle: V1ContentBundle = { ...content, extras };
      const lastWeekAccuracy = computeLastWeekAccuracy(recentAttempts, now);
      contextRef.current = {
        content: bundle,
        newCardsLimit,
        newCardsDoneToday: doneToday,
        lastWeekAccuracy,
      };
      const run = createV1Run({
        cards,
        content: bundle,
        mode: initialRunMode,
        skillLevel: effectiveLevel,
        newCardsLimit,
        newCardsDoneToday: doneToday,
        now,
        lastWeekAccuracy,
        startOnMap: true,
      });
      void logMissingItems(run.missingItems);
      if (!mountedRef.current) return;
      resetPersistence();
      setRunState(run);
      nodeStartedAtRef.current = Date.now();
    },
    [initialRunMode, resetPersistence],
  );

  // Khởi tạo run từ Dexie + nội dung THẬT. DB rỗng → EmptyState, KHÔNG ghi dữ liệu giả (V1-3).
  useEffect(() => {
    mountedRef.current = true;
    // StrictMode (dev) mount 2 lần: chỉ lần khởi tạo mới nhất được phép dựng run
    const token = ++initTokenRef.current;
    const isCurrent = () => mountedRef.current && token === initTokenRef.current;

    async function initRun() {
      try {
        const [profile, existingCards, content] = await Promise.all([
          profileRepo.getOrCreate().catch(() => null),
          cardRepo.getAll(),
          loadV1Content(),
        ]);
        if (!isCurrent()) return;

        const effectiveLevel = profile?.skillLevels?.v1 ?? Math.max(1, level || 1);
        newCardsLimitRef.current = profile?.newCardsPerDay ?? 15;
        setSkillLevel(effectiveLevel);

        if (existingCards.length === 0) {
          setLoadState({ kind: 'empty', content });
          return;
        }
        await startRun(existingCards, content, effectiveLevel, newCardsLimitRef.current);
        if (isCurrent()) setLoadState({ kind: 'ready' });
      } catch (err) {
        if (!isCurrent()) return;
        setLoadState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Không đọc được dữ liệu học.',
        });
      }
    }

    void initRun();
    return () => {
      mountedRef.current = false;
      if (fallbackTimerRef.current !== null) {
        window.clearTimeout(fallbackTimerRef.current);
      }
      if (audioElRef.current) {
        audioElRef.current.pause();
      }
    };
  }, [initialRunMode, level, startRun]);

  const handleStartWithStarter = useCallback(async () => {
    if (loadState.kind !== 'empty' || starting) return;
    setStarting(true);
    try {
      const starter = buildStarterVocabCards(loadState.content.vocab, new Date());
      await cardRepo.bulkUpsert(starter);
      await startRun(starter, loadState.content, skillLevel, newCardsLimitRef.current);
      if (mountedRef.current) setLoadState({ kind: 'ready' });
    } catch (err) {
      if (mountedRef.current) {
        setLoadState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Không tạo được thẻ khởi động.',
        });
      }
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  }, [loadState, skillLevel, startRun, starting]);

  const activeNode = useMemo(
    () => (runState ? getActiveNode(runState) : null),
    [runState],
  );

  // Lưu giữa phiên: debounce 500 ms sau mỗi thay đổi tiến độ, ngay lập tức ở checkpoint (V1-7);
  // flush khi ẩn tab / đóng trang / thoát màn (Esc, nút ✕).
  useEffect(() => {
    latestRunRef.current = runState;
  }, [runState]);

  const progressKey = runState
    ? `${runState.reviews.length}:${runState.attemptItems.length}:${Object.keys(runState.updatedCards).length}:${runState.totalXp}`
    : '';
  const runPhase = runState?.phase;
  useEffect(() => {
    if (!runPhase || runPhase === 'recap') return;
    if (progressKey.startsWith('0:0:0:')) return;
    const timer = window.setTimeout(
      () => {
        const latest = latestRunRef.current;
        if (latest && latest.phase !== 'recap') void persist(latest, false);
      },
      runPhase === 'checkpoint' ? 0 : 500,
    );
    return () => window.clearTimeout(timer);
  }, [progressKey, runPhase, persist]);

  useEffect(() => {
    const flush = () => {
      const latest = latestRunRef.current;
      if (latest && latest.phase !== 'recap' && !saverRef.current.isFinalized()) void persist(latest, false);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [persist]);

  // Reset input fields whenever the active node changes
  useEffect(() => {
    if (!activeNode) return;
    setSelectedChoiceIdx(null);
    setAudioFallbackNotice(null);
    setAudioMissing(false);
    nodeStartedAtRef.current = Date.now();

    if (
      activeNode.prompt.face === 'recall_meaning' &&
      activeNode.revealedLetters > 0
    ) {
      setTypedAnswer(
        getRevealedPrefix(activeNode.prompt.headword, activeNode.revealedLetters),
      );
    } else {
      setTypedAnswer('');
    }
  }, [activeNode?.nodeId, activeNode?.face]);

  // Play audio from static file (NEVER calling speechSynthesis per AGENTS.md §3)
  const playCardAudio = useCallback(
    (
      audioRelativePath?: string,
      checkPlayQuota = false,
      playOptions: { clip?: { start: number; end: number }; silent?: boolean } = {},
    ) => {
      if (!runState) return;
      const { clip, silent = false } = playOptions;

      const quotaNodeId = checkPlayQuota ? getActiveNode(runState)?.nodeId : undefined;
      if (checkPlayQuota) {
        const playAttempt = recordNodeAudioPlay(runState);
        setRunState(playAttempt.state);
        if (!playAttempt.allowed) {
          setAudioFallbackNotice('Đã hết lượt nghe cho thẻ này.');
          return;
        }
      }

      const reportMissing = () => {
        setAudioPlaying(false);
        if (quotaNodeId) {
          // Âm thanh không phát được thì không tính lượt nghe
          setRunState((prev) => (prev ? refundNodeAudioPlay(prev, quotaNodeId) : prev));
        }
        if (silent) return;
        setAudioMissing(true);
        setAudioFallbackNotice(
          clip || checkPlayQuota
            ? 'Không phát được file audio này. Thử lại sau.'
            : 'Chưa có file audio tĩnh trên đĩa — hãy đối chiếu IPA.',
        );
      };

      if (!audioRelativePath) {
        if (silent) return;
        setAudioPlaying(true);
        setAudioMissing(true);
        setAudioFallbackNotice('File âm thanh offline đang ở chế độ mô phỏng.');
        if (fallbackTimerRef.current !== null) {
          window.clearTimeout(fallbackTimerRef.current);
        }
        fallbackTimerRef.current = window.setTimeout(() => {
          setAudioPlaying(false);
        }, 700);
        return;
      }

      try {
        if (audioElRef.current) {
          audioElRef.current.pause();
        }
        const url = resolveAssetUrl(audioRelativePath);
        const audio = new Audio(url);
        audioElRef.current = audio;
        setAudioPlaying(true);
        setAudioFallbackNotice(null);
        setAudioMissing(false);

        if (clip) {
          // Phát đúng đoạn [start, end] của file dài (đoạn bẫy Listening)
          audio.addEventListener('loadedmetadata', () => {
            try {
              audio.currentTime = clip.start;
            } catch {
              // trình duyệt chưa cho tua: phát từ đầu
            }
          });
          audio.addEventListener('timeupdate', () => {
            if (audio.currentTime >= clip.end) {
              audio.pause();
              setAudioPlaying(false);
            }
          });
        }

        audio.onended = () => {
          setAudioPlaying(false);
        };
        audio.onerror = reportMissing;

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(reportMissing);
        }
      } catch {
        reportMissing();
      }
    },
    [runState],
  );

  // Auto-advance after 1.2s on exact 'correct' feedback (docs/games/V1-DAILY-RUN.md §6)
  useEffect(() => {
    if (!runState?.feedback || runState.feedback.status !== 'correct') return;
    const delayMs = runState.feedback.autoAdvanceMs ?? 1200;
    const timer = window.setTimeout(() => {
      setRunState((prev) => (prev && prev.feedback ? advanceAfterFeedback(prev) : prev));
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [runState?.feedback]);

  // Chốt phiên khi vào Recap (attempt đã lưu dần từ trước → chỉ finalize)
  useEffect(() => {
    if (!runState || runState.phase !== 'recap' || !runState.recap || sessionSaved) {
      return;
    }
    setSessionSaved(true);
    playSfx('sessionDone');
    void persist(runState, true);
  }, [runState, sessionSaved, persist]);

  // Thẻ giới thiệu tự phát âm 250 ms sau khi hiện (V1-13). Trình duyệt chặn autoplay thì im lặng.
  useEffect(() => {
    if (!activeNode || activeNode.prompt.face !== 'intro') return;
    const audioUrl = activeNode.prompt.audioUrl;
    const timer = window.setTimeout(() => {
      playCardAudio(audioUrl, false, { silent: true });
    }, 250);
    return () => window.clearTimeout(timer);
    // chỉ chạy khi chuyển sang thẻ intro mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNode?.nodeId]);

  const handleNextAfterFeedback = useCallback(() => {
    if (!runState || !runState.feedback) return;
    playSfx('flip');
    setRunState(advanceAfterFeedback(runState));
  }, [runState]);

  const handleSubmitAnswer = useCallback(
    (overrideAnswer?: string) => {
      if (!runState || !activeNode) return;
      if (runState.feedback) {
        handleNextAfterFeedback();
        return;
      }

      if (activeNode.face === 'intro') {
        playSfx('flip');
        setRunState(submitIntroAction(runState, 'seen'));
        return;
      }

      const answerToScore =
        overrideAnswer !== undefined ? overrideAnswer : typedAnswer;
      const elapsedMs = Math.max(300, Date.now() - nodeStartedAtRef.current);

      const next = submitNodeAnswer(runState, answerToScore, elapsedMs);
      setRunState(next);

      const latestEvent = next.events[next.events.length - 1];
      if (next.events.some((e) => e.type === 'boss_defeated') && !runState.bossDefeated) {
        playSfx('levelUp');
      } else if (next.feedback?.status === 'correct' || next.feedback?.status === 'partial') {
        if (next.combo >= 5 && next.combo > runState.combo) {
          playSfx('combo');
        } else {
          playSfx('correct');
        }
        // Auto-play word pronunciation on correct vocab answer (không phát lại audio vừa nghe)
        if (
          activeNode.face !== 'ltrap_replay' &&
          activeNode.face !== 'dict_full' &&
          'audioUrl' in activeNode.prompt &&
          activeNode.prompt.audioUrl
        ) {
          playCardAudio(activeNode.prompt.audioUrl, false);
        }
      } else if (latestEvent) {
        playSfx('wrong');
      }
    },
    [activeNode, handleNextAfterFeedback, playCardAudio, runState, typedAnswer],
  );

  const handleHint = useCallback(() => {
    if (!runState || !activeNode || runState.feedback) return;
    playSfx('tap');
    const next = applyNodeHint(runState);
    setRunState(next);

    const updated = getActiveNode(next);
    if (!updated) return;

    // Pre-fill revealed prefix into input if user hasn't typed past it
    const targetWord = getTypedTargetText(updated.prompt);
    if (targetWord && updated.face !== 'intro') {
      const prefix = getRevealedPrefix(targetWord, updated.revealedLetters);
      if (!typedAnswer.toLowerCase().startsWith(prefix.toLowerCase())) {
        setTypedAnswer(prefix);
      }
    }
  }, [activeNode, runState, typedAnswer]);

  const handleChoiceSelect = useCallback(
    (choiceIdx: number) => {
      if (!runState || !activeNode || runState.feedback) return;
      if (activeNode.eliminatedChoices.includes(choiceIdx)) return;
      if (!isChoicePrompt(activeNode.prompt)) return;
      const choiceText = activeNode.prompt.choices[choiceIdx];
      if (choiceText === undefined) return;
      setSelectedChoiceIdx(choiceIdx);
      handleSubmitAnswer(choiceText);
    },
    [activeNode, handleSubmitAnswer, runState],
  );

  const handleSwitchRunMode = useCallback(
    (nextMode: V1RunMode) => {
      if (!runState) return;
      const ctx = contextRef.current;
      const allCards = Object.values(runState.allCardsSnapshot);
      const fresh = createV1Run({
        cards: allCards,
        content: runState.content,
        mode: nextMode,
        skillLevel,
        newCardsLimit: ctx?.newCardsLimit ?? newCardsLimitRef.current,
        newCardsDoneToday: ctx?.newCardsDoneToday ?? 0,
        lastWeekAccuracy: ctx?.lastWeekAccuracy ?? null,
        startOnMap: runState.phase === 'map_intro',
        now: new Date(),
      });
      resetPersistence();
      setRunState(fresh);
    },
    [resetPersistence, runState, skillLevel],
  );

  // Global keyboard shortcuts: 1-4 for MCQ, H for Hint (outside text input or Alt+H), Enter to advance
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!runState || e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      const inTextInput =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (runState.phase === 'map_intro' && e.key === 'Enter') {
        e.preventDefault();
        setRunState((prev) => (prev ? startPlayingFromMap(prev) : prev));
        return;
      }

      if (runState.phase === 'checkpoint' && e.key === 'Enter') {
        e.preventDefault();
        setRunState((prev) => (prev ? continueFromCheckpoint(prev) : prev));
        return;
      }

      if (runState.feedback && e.key === 'Enter') {
        e.preventDefault();
        handleNextAfterFeedback();
        return;
      }

      if (!activeNode || runState.feedback) return;

      // Thẻ giới thiệu: Enter = "Đã xem"
      if (activeNode.face === 'intro' && e.key === 'Enter' && !inTextInput) {
        e.preventDefault();
        playSfx('flip');
        setRunState((prev) => (prev ? submitIntroAction(prev, 'seen') : prev));
        return;
      }

      // 1-4 hotkeys for MCQ faces (recog, para_match, tfng_retry, head_retry)
      if (isChoicePrompt(activeNode.prompt) && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        handleChoiceSelect(Number(e.key) - 1);
        return;
      }

      // 'H' key for Hint when not typing inside a text input (or with Alt+H)
      if (
        (e.key.toLowerCase() === 'h' && !inTextInput) ||
        (e.key.toLowerCase() === 'h' && e.altKey)
      ) {
        e.preventDefault();
        handleHint();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeNode,
    handleChoiceSelect,
    handleHint,
    handleNextAfterFeedback,
    runState,
  ]);

  if (loadState.kind === 'error') {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <EmptyState
          title="Không mở được Daily Run"
          description={`${loadState.message} Dữ liệu học của bạn không bị mất. Thử tải lại trang.`}
          icon={<AlertTriangle className="w-7 h-7" />}
          action={
            <Button variant="primary" skill="vocab" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
          }
          secondaryAction={<GameLink href="#/">Về Hôm nay</GameLink>}
        />
      </div>
    );
  }

  // DB rỗng: không ghi dữ liệu giả, mời làm placement hoặc bắt đầu bằng bộ thẻ khởi động thật (V1-3)
  if (loadState.kind === 'empty') {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <EmptyState
          title="Chưa có thẻ nào để ôn"
          description="Làm bài placement 10 phút để mình chọn đúng từ cho trình độ của bạn, hoặc bắt đầu ngay với 15 từ học thuật thường gặp nhất."
          icon={
            <motion.span
              className="inline-flex"
              animate={prefersReduced ? undefined : { y: [0, -5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-7 h-7" />
            </motion.span>
          }
          action={
            <Button
              variant="primary"
              skill="vocab"
              loading={starting}
              onClick={() => void handleStartWithStarter()}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Bắt đầu với 15 từ khởi động
            </Button>
          }
          secondaryAction={<GameLink href="#/placement">Làm placement</GameLink>}
        />
      </div>
    );
  }

  if (!runState) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center" style={{ color: 'var(--color-text-dim)' }}>
        Đang khởi tạo lộ trình V1 · Daily Run...
      </div>
    );
  }

  // Không có thẻ nào dựng được để ôn hôm nay (đã xong hoặc thẻ thiếu nội dung)
  if (runState.nodes.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <EmptyState
          title="Hôm nay đã ôn xong"
          description={
            runState.missingItems.length > 0
              ? `Không còn thẻ nào đến hạn. Có ${runState.missingItems.length} thẻ chưa có nội dung nên được bỏ qua (đã ghi lại để sửa).`
              : 'Không còn thẻ nào đến hạn và hạn mức thẻ mới hôm nay đã dùng hết. Quay lại vào ngày mai nhé.'
          }
          icon={<CheckCircle2 className="w-7 h-7" />}
          action={
            <Button variant="primary" skill="vocab" onClick={() => onExit()}>
              Về Hôm nay
            </Button>
          }
        />
      </div>
    );
  }

  // Bản đồ mở đầu run (V1-14): xem trước chặng rồi Enter để bắt đầu
  if (runState.phase === 'map_intro') {
    const newCount = runState.nodes.filter((n) => n.isNewCard).length;
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        <RunMap
          nodes={runState.nodes}
          currentIndex={0}
          stageIndex={0}
          stageSize={runState.stageSize}
          isBossPhase={false}
          bossHp={runState.bossHp}
          bossDefeated={false}
        />
        <Card padding="lg" skillAccent="vocab" className="text-center space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Lượt chạy hôm nay: {runState.nodes.length} thẻ
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
              {newCount > 0 ? `${newCount} thẻ mới · ` : ''}
              {runState.totalStages} chặng, cuối cùng là Boss 5 thẻ khó nhất.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                handleSwitchRunMode(runState.mode === 'busy' ? 'standard' : 'busy')
              }
            >
              {runState.mode === 'busy' ? 'Đổi sang Tiêu chuẩn' : 'Chế độ bận (10 thẻ)'}
            </Button>
            <Button
              variant="primary"
              skill="vocab"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setRunState(startPlayingFromMap(runState))}
            >
              Bắt đầu (Enter)
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 1. Màn Recap cuối run
  if (runState.phase === 'recap' && runState.recap) {
    const recap = runState.recap;
    const durationSec = Math.max(
      1,
      Math.round((Date.now() - runState.startedAt) / 1000),
    );

    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Các thẻ chỉ số chuyên biệt của V1 Daily Run (V1-DAILY-RUN.md §7) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card padding="sm" className="text-center space-y-1">
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
              Tổng số thẻ
            </div>
            <div
              className="text-2xl font-extrabold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
            >
              {recap.totalCards}
            </div>
          </Card>

          <Card padding="sm" className="text-center space-y-1">
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
              Đúng lượt đầu
            </div>
            <div
              className="text-2xl font-extrabold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-correct)' }}
            >
              {recap.firstAttemptAccuracy}%
            </div>
          </Card>

          <Card padding="sm" className="text-center space-y-1">
            <div className="text-xs font-medium flex items-center justify-center gap-1" style={{ color: 'var(--color-text-dim)' }}>
              <Award className="w-3.5 h-3.5" style={{ color: 'var(--color-vocab)' }} />
              <span>Lên Mature/Mastered</span>
            </div>
            <div
              className="text-2xl font-extrabold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-vocab)' }}
            >
              +{recap.matureOrMasteredCount}
            </div>
          </Card>

          <Card padding="sm" className="text-center space-y-1">
            <div className="text-xs font-medium flex items-center justify-center gap-1" style={{ color: 'var(--color-text-dim)' }}>
              <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-info)' }} />
              <span>Dự báo ngày mai</span>
            </div>
            <div
              className="text-2xl font-extrabold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}
            >
              Ngày mai: {recap.tomorrowDueForecast} thẻ
            </div>
          </Card>
        </div>

        <RecapScreen
          scoreLabel={`${recap.firstAttemptCorrect}/${Math.max(1, recap.totalCards)}`}
          xpEarned={recap.totalXp}
          winStatement={recap.winStatement}
          accuracyPercent={recap.firstAttemptAccuracy}
          durationSec={durationSec}
          mistakes={recap.mistakes.map((m, idx) => ({
            id: `${m.itemId}-${idx}`,
            prompt: m.promptLabel,
            userAnswer: m.userAnswer,
            correctAnswer: m.correctAnswer,
            note: m.noteVi,
          }))}
          onRetryMistakes={
            recap.mistakes.length > 0
              ? () => {
                  const mistakeIds = new Set(recap.mistakes.map((m) => m.itemId));
                  const mistakeCards = Object.values(runState.allCardsSnapshot).filter(
                    (c) => mistakeIds.has(c.itemId),
                  );
                  if (mistakeCards.length > 0) {
                    resetPersistence();
                    setRunState(
                      createV1Run({
                        cards: mistakeCards.slice(0, 5),
                        content: runState.content,
                        mode: 'extra_practice',
                        skillLevel,
                        now: new Date(),
                      }),
                    );
                  }
                }
              : undefined
          }
          onGoToday={() => onExit(recap)}
        />
      </div>
    );
  }

  // 2. Màn Checkpoint giữa các chặng 20 thẻ
  if (runState.phase === 'checkpoint') {
    const completedCards = runState.currentIndex;
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <RunMap
          nodes={runState.nodes}
          currentIndex={runState.currentIndex}
          stageIndex={runState.currentStage}
          stageSize={runState.stageSize}
          isBossPhase={false}
          bossHp={runState.bossHp}
          bossDefeated={runState.bossDefeated}
        />

        <Card padding="lg" skillAccent="vocab" className="text-center space-y-5">
          <div className="flex justify-center">
            <ProgressRing
              value={completedCards}
              max={runState.nodes.length}
              size={72}
              strokeWidth={6}
              skill="vocab"
            />
          </div>

          <div className="space-y-1.5">
            <Pill tone="vocab" icon={<BookmarkCheck className="w-3.5 h-3.5" />}>
              Checkpoint · Hoàn thành Chặng {runState.currentStage}/{runState.totalStages}
            </Pill>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Đã hoàn thành {completedCards}/{runState.nodes.length} thẻ
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
              Tiến độ đã được lưu. Bạn có thể đi tiếp sang Chặng{' '}
              {runState.currentStage + 1} hoặc lưu và nghỉ tại đây.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setRunState(finishAtCheckpoint(runState))}
            >
              Lưu & Dừng tại đây
            </Button>
            <Button
              variant="primary"
              skill="vocab"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setRunState(continueFromCheckpoint(runState))}
            >
              Đi tiếp Chặng {runState.currentStage + 1} (Enter)
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Màn chơi chính (Playing / Boss Phase)
  const isBossPhase = runState.phase === 'boss';
  const comboMult = getComboMultiplier(runState.combo);
  const stageNodes = isBossPhase
    ? runState.bossNodes
    : runState.nodes.filter((n) => n.stageIndex === runState.currentStage);
  const stagePosition = isBossPhase
    ? runState.bossIndex + 1
    : stageNodes.findIndex((n) => n.nodeId === activeNode?.nodeId) + 1;

  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] transition-colors duration-300"
      style={{
        // Pha Boss: nền tối hơn 10% (docs/games/V1-DAILY-RUN.md §10)
        backgroundColor: isBossPhase
          ? 'var(--color-boss-dim, color-mix(in srgb, var(--color-wrong) 10%, var(--color-bg)))'
          : 'var(--color-bg)',
      }}
    >
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        {/* HUD Header: Chặng, Thanh tiến độ chuỗi chấm (dot), Combo badge 🔥x2, XP, Chế độ bận */}
        <div
          className="rounded-[var(--radius-md)] border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: isBossPhase ? 'var(--color-wrong)' : 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-2.5">
            {isBossPhase ? (
              <Pill tone="wrong" icon={<Crown className="w-3.5 h-3.5" />}>
                Pha Boss · 5 thẻ khó nhất
              </Pill>
            ) : (
              <Pill tone="vocab">
                Chặng {runState.currentStage + 1}/{runState.totalStages}
              </Pill>
            )}

            {runState.isExtraPractice && (
              <Pill tone="info">Ôn thêm (không tính vào lịch ôn)</Pill>
            )}

            {/* Nút chuyển Chế độ tiêu chuẩn (20 thẻ/chặng) / Chế độ bận (10 thẻ) */}
            {!isBossPhase && runState.currentIndex === 0 && !runState.feedback && (
              <button
                type="button"
                onClick={() =>
                  handleSwitchRunMode(
                    runState.mode === 'busy' ? 'standard' : 'busy',
                  )
                }
                className="text-xs px-3 min-h-11 rounded border cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-dim)',
                }}
                title="Đổi quy mô Run"
              >
                {runState.mode === 'busy'
                  ? '⚡ Chế độ bận (10 thẻ) · Đổi sang Tiêu chuẩn'
                  : 'Chế độ bận (10 thẻ)'}
              </button>
            )}
          </div>

          {/* Thanh tiến độ chuỗi chấm (dot) — mỗi chấm đổi màu theo kết quả (V1-DAILY-RUN.md §6 & §10) */}
          <div
            className="flex items-center gap-1.5"
            aria-label="Thanh tiến độ chuỗi chấm"
          >
            <div className="flex items-center gap-1">
              {stageNodes.map((n) => {
                const isCur = n.nodeId === activeNode?.nodeId;
                const dotColor =
                  n.status === 'correct'
                    ? 'var(--color-correct)'
                    : n.status === 'partial'
                    ? 'var(--color-partial)'
                    : n.status === 'wrong'
                    ? 'var(--color-wrong)'
                    : n.status === 'seen'
                    ? 'var(--color-info)'
                    : isCur
                    ? 'var(--color-vocab)'
                    : 'var(--color-border)';

                return (
                  <span
                    key={n.nodeId}
                    className="inline-block rounded-full transition-transform"
                    style={{
                      width: isCur ? '10px' : '8px',
                      height: isCur ? '10px' : '8px',
                      backgroundColor:
                        n.status !== 'pending' || isCur
                          ? dotColor
                          : 'transparent',
                      border: `1.5px solid ${dotColor}`,
                    }}
                  />
                );
              })}
            </div>
            <span
              className="text-xs font-bold tabular-nums ml-1"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-dim)',
              }}
            >
              {Math.max(1, stagePosition)}/{stageNodes.length}
            </span>
          </div>

          {/* Combo badge 🔥x2 / 🔥x3 + XP cộng dồn */}
          <div className="flex items-center gap-2.5">
            {runState.combo >= 2 && (
              <motion.span
                key={runState.combo}
                initial={prefersReduced ? false : { scale: 1.25 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor:
                    comboMult >= 2
                      ? 'color-mix(in srgb, var(--color-writing) 18%, var(--color-surface-2))'
                      : 'var(--color-surface-2)',
                  color:
                    comboMult >= 2
                      ? 'var(--color-writing)'
                      : 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>
                  {comboMult > 1 ? `🔥x${comboMult}` : `${runState.combo}`}
                </span>
              </motion.span>
            )}

            <span
              className="text-sm font-bold tabular-nums"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-correct)',
              }}
            >
              +{runState.totalXp} XP
            </span>
          </div>
        </div>

        {/* Bản đồ Run (RunMap) */}
        <RunMap
          nodes={runState.nodes}
          currentIndex={runState.currentIndex}
          stageIndex={runState.currentStage}
          stageSize={runState.stageSize}
          isBossPhase={isBossPhase}
          bossHp={runState.bossHp}
          bossDefeated={runState.bossDefeated}
        />

        {/* Thẻ Node hiện tại */}
        {activeNode && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNode.nodeId}
              data-testid="v1-node"
              data-node-id={activeNode.nodeId}
              data-item-id={activeNode.itemId}
              data-face={activeNode.face}
              variants={pickVariants(questionSlideVariants, prefersReduced)}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Card
                padding="lg"
                skillAccent={
                  isBossPhase
                    ? 'speaking'
                    : activeNode.nodeKind === 'listen'
                    ? 'listening'
                    : activeNode.nodeKind === 'collocation'
                    ? 'writing'
                    : activeNode.nodeKind === 'paraphrase'
                    ? 'reading'
                    : activeNode.nodeKind === 'error'
                    ? 'speaking'
                    : 'vocab'
                }
                className="space-y-5"
                style={
                  isBossPhase
                    ? {
                        borderColor: 'var(--color-wrong)',
                        boxShadow: 'var(--shadow-glow-wrong)',
                      }
                    : undefined
                }
              >
                {/* Hàng nhãn Face + CEFR + POS + Thẻ hiếm / Làm lại */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill
                      tone={
                        isBossPhase
                          ? 'wrong'
                          : activeNode.nodeKind === 'listen'
                          ? 'listening'
                          : activeNode.nodeKind === 'collocation'
                          ? 'writing'
                          : activeNode.nodeKind === 'paraphrase'
                          ? 'reading'
                          : activeNode.nodeKind === 'error'
                          ? 'speaking'
                          : 'vocab'
                      }
                    >
                      {getFaceHeaderTitleVi(activeNode.face)}
                    </Pill>

                    {activeNode.isRetry && (
                      <Pill tone="partial">Làm lại (đã hạ 1 bậc)</Pill>
                    )}

                    {activeNode.isRare && (
                      <Pill tone="vocab" icon={<Sparkles className="w-3.5 h-3.5" />}>
                        Thẻ hiếm ×3 XP
                      </Pill>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {'cefr' in activeNode.prompt && activeNode.prompt.cefr && (
                      <Pill tone="info">{activeNode.prompt.cefr}</Pill>
                    )}
                    {'pos' in activeNode.prompt &&
                      activeNode.prompt.pos &&
                      activeNode.prompt.pos.map((p) => (
                        <Pill key={p} tone="neutral">
                          {p}.
                        </Pill>
                      ))}
                  </div>
                </div>

                {/* Nội dung chi tiết của từng Face (8 loại Face) */}
                {renderFaceContent({
                  activeNode,
                  typedAnswer,
                  setTypedAnswer,
                  selectedChoiceIdx,
                  onChoiceSelect: handleChoiceSelect,
                  onSubmit: () => handleSubmitAnswer(),
                  onIntroSeen: () => {
                    playSfx('flip');
                    setRunState(submitIntroAction(runState, 'seen'));
                  },
                  onIntroKnowAlready: () =>
                    setRunState(submitIntroAction(runState, 'know_already')),
                  audioPlaying,
                  audioFallbackNotice,
                  onPlayAudio: playCardAudio,
                  audioMissing,
                  hasFeedback: Boolean(runState.feedback),
                  feedbackStatus: runState.feedback?.status,
                })}

                {/* Thanh hành động dưới cùng: [Gợi ý H] [Không nhớ] [Nộp ↵] */}
                {activeNode.face !== 'intro' && !runState.feedback && (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div className="flex items-center gap-2">
                      {activeNode.prompt.face !== 'dict_full' && (
                        <Button
                          variant="secondary"
                          leftIcon={<Lightbulb className="w-4 h-4" />}
                          onClick={handleHint}
                        >
                          Gợi ý (H)
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        leftIcon={<HelpCircle className="w-4 h-4" />}
                        onClick={() => handleSubmitAnswer('')}
                      >
                        Không nhớ
                      </Button>
                    </div>

                    {!isChoicePrompt(activeNode.prompt) && (
                      <Button
                        variant="primary"
                        size="md"
                        skill={isBossPhase ? 'speaking' : 'vocab'}
                        onClick={() => handleSubmitAnswer()}
                      >
                        Nộp (Enter)
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Feedback tức thì sau mỗi thẻ:
            - Đúng: chip xanh + 1 collocation nổi lên (tự chuyển sau 1.2s hoặc bấm Enter)
            - Sai / Partial: hiện đáp án chuẩn, tô đỏ chữ cái sai (diff từng ký tự), câu ví dụ và vnTrap (chờ Enter) */}
        {runState.feedback && (
          <div className="space-y-3">
            {/* Banner bổ sung của V1: Collocation nổi lên khi đúng, hoặc Diff từng ký tự + vnTrap khi sai/partial */}
            {runState.feedback.status === 'correct' &&
              runState.feedback.collocationHighlight && (
                <motion.div
                  initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[var(--radius-md)] border px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--color-correct) 12%, var(--color-surface))',
                    borderColor: 'var(--color-correct)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Pill
                      tone="correct"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      +{runState.feedback.xpEarned} XP
                    </Pill>
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-text-dim)' }}
                    >
                      Collocation đi kèm:
                    </span>
                    <strong
                      className="text-sm font-bold"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {runState.feedback.collocationHighlight}
                    </strong>
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-text-dim)' }}
                  >
                    Tự chuyển sau 1,2 giây hoặc bấm Enter
                  </span>
                </motion.div>
              )}

            {(runState.feedback.status === 'wrong' ||
              runState.feedback.status === 'partial') &&
              runState.feedback.charDiff && (
                <CharDiffBox
                  segments={runState.feedback.charDiff}
                  correctAnswer={runState.feedback.correctAnswer}
                  wrongCharNotice={runState.feedback.wrongCharNotice}
                  vnTrap={runState.feedback.vnTrap}
                />
              )}

            <FeedbackPanel
              open={true}
              status={runState.feedback.status}
              title={
                runState.feedback.status === 'correct'
                  ? 'Chính xác!'
                  : runState.feedback.status === 'partial'
                  ? 'Gần đúng (Sai 1 ký tự → chấm Hard)'
                  : isBossPhase
                  ? 'Chưa chính xác (thẻ sẽ quay lại ở cuối Boss)'
                  : 'Chưa chính xác (thẻ sẽ quay lại sau 3–5 thẻ)'
              }
              correctAnswer={runState.feedback.correctAnswer}
              explanation={
                runState.feedback.vnTrap &&
                !runState.feedback.explanationVi.includes(runState.feedback.vnTrap)
                  ? `${runState.feedback.explanationVi} · Lưu ý: ${runState.feedback.vnTrap}`
                  : runState.feedback.explanationVi
              }
              evidenceQuote={runState.feedback.exampleEn}
              onNext={handleNextAfterFeedback}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components for rendering character diffs and each of the 8 V1 faces
// ---------------------------------------------------------------------------

interface CharDiffBoxProps {
  segments: readonly CharDiffSegment[];
  correctAnswer: string;
  wrongCharNotice?: string;
  vnTrap?: string;
}

const CharDiffBox: React.FC<CharDiffBoxProps> = ({
  segments,
  correctAnswer,
  wrongCharNotice,
  vnTrap,
}) => {
  return (
    <div
      className="rounded-[var(--radius-md)] border p-4 space-y-2.5"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-wrong)',
      }}
      aria-label="So sánh từng ký tự"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold" style={{ color: 'var(--color-text-dim)' }}>
          Đối chiếu từng ký tự (ký tự sai tô đỏ):
        </span>
        {wrongCharNotice && (
          <span className="font-medium" style={{ color: 'var(--color-wrong)' }}>
            {wrongCharNotice}
          </span>
        )}
      </div>

      <div
        className="flex flex-wrap items-center gap-1 text-base font-bold tracking-wider"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {segments.map((seg) => {
          const isMatch = seg.status === 'match';
          return (
            <span
              key={seg.index}
              className="inline-flex items-center justify-center min-w-[26px] h-8 px-1.5 rounded border"
              style={{
                backgroundColor: isMatch
                  ? 'color-mix(in srgb, var(--color-correct) 12%, var(--color-surface-2))'
                  : 'color-mix(in srgb, var(--color-wrong) 22%, var(--color-surface-2))',
                borderColor: isMatch
                  ? 'var(--color-correct)'
                  : 'var(--color-wrong)',
                color: isMatch ? 'var(--color-correct)' : 'var(--color-wrong)',
              }}
              title={
                isMatch
                  ? `Đúng: ${seg.char}`
                  : `Bạn gõ: "${seg.char}" · Đúng: "${seg.expectedChar ?? ''}"`
              }
            >
              {seg.char}
            </span>
          );
        })}
      </div>

      <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
        Đáp án chuẩn:{' '}
        <strong
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-correct)',
          }}
        >
          {correctAnswer}
        </strong>
      </div>

      {vnTrap && (
        <div
          className="text-xs px-3 py-2 rounded border flex items-start gap-2"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--color-partial) 12%, var(--color-surface-2))',
            borderColor: 'var(--color-partial)',
            color: 'var(--color-text)',
          }}
        >
          <AlertTriangle
            className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: 'var(--color-partial)' }}
          />
          <span>
            <strong>Bẫy hay gặp:</strong> {vnTrap}
          </span>
        </div>
      )}
    </div>
  );
};

function getFaceHeaderTitleVi(face: string): string {
  switch (face) {
    case 'intro':
      return 'Thẻ mới · Giới thiệu từ';
    case 'recog':
      return 'Nhận diện nghĩa (1–4)';
    case 'recall_meaning':
      return 'Gõ từ tiếng Anh từ nghĩa';
    case 'recall_cloze':
      return 'Điền từ đúng dạng vào câu';
    case 'listen_spell':
      return 'Nghe & gõ chính tả 100%';
    case 'col_gap':
      return 'Điền khuyết Collocation';
    case 'para_match':
      return 'Chọn Paraphrase tương đương (1–4)';
    case 'err_fix':
      return 'Sửa lỗi ngữ pháp / từ vựng gạch chân';
    case 'tfng_retry':
      return 'Reading · True / False / Not Given';
    case 'head_retry':
      return 'Reading · Chọn tiêu đề cho đoạn';
    case 'ltrap_replay':
      return 'Listening · Nghe lại đoạn bẫy';
    case 'dict_full':
      return 'Nghe & chép cả câu';
    case 'err_user':
      return 'Ôn lỗi của chính bạn';
    default:
      return 'Ôn tập FSRS';
  }
}

interface RenderFaceContentParams {
  activeNode: NonNullable<ReturnType<typeof getActiveNode>>;
  typedAnswer: string;
  setTypedAnswer: (val: string) => void;
  selectedChoiceIdx: number | null;
  onChoiceSelect: (idx: number) => void;
  onSubmit: () => void;
  onIntroSeen: () => void;
  onIntroKnowAlready: () => void;
  audioPlaying: boolean;
  audioFallbackNotice: string | null;
  onPlayAudio: (
    url?: string,
    checkQuota?: boolean,
    options?: { clip?: { start: number; end: number }; silent?: boolean },
  ) => void;
  audioMissing: boolean;
  hasFeedback: boolean;
  feedbackStatus?: 'correct' | 'partial' | 'wrong';
}

function renderFaceContent(params: RenderFaceContentParams): React.ReactNode {
  const {
    activeNode,
    typedAnswer,
    setTypedAnswer,
    selectedChoiceIdx,
    onChoiceSelect,
    onSubmit,
    onIntroSeen,
    onIntroKnowAlready,
    audioPlaying,
    audioFallbackNotice,
    onPlayAudio,
    audioMissing,
    hasFeedback,
    feedbackStatus,
  } = params;

  const { prompt } = activeNode;

  // Helper dùng chung cho các mặt chọn đáp án (recog / para_match / tfng_retry / head_retry)
  const renderChoices = (choices: readonly string[], correctIndex: number) => (
    <div className="grid grid-cols-1 gap-2.5">
      {choices.map((choice, idx) => {
        const isEliminated = activeNode.eliminatedChoices.includes(idx);
        let choiceState: ChoiceState = 'idle';

        if (hasFeedback) {
          if (idx === correctIndex) {
            choiceState = selectedChoiceIdx === idx ? 'correct' : 'reveal-correct';
          } else if (selectedChoiceIdx === idx) {
            choiceState = 'wrong';
          }
        } else if (selectedChoiceIdx === idx) {
          choiceState = 'selected';
        }

        return (
          <ChoiceButton
            key={idx}
            indexLabel={String(idx + 1)}
            label={isEliminated ? '— Đã loại bằng gợi ý —' : choice}
            state={choiceState}
            disabled={hasFeedback || isEliminated}
            onClick={() => onChoiceSelect(idx)}
          />
        );
      })}
    </div>
  );

  const renderTypedInput = (placeholder: string, ariaLabel: string) => (
    <AnswerInput
      value={typedAnswer}
      onChange={setTypedAnswer}
      onSubmit={onSubmit}
      placeholder={placeholder}
      status={hasFeedback ? feedbackStatus ?? 'idle' : 'idle'}
      disabled={hasFeedback}
      autoFocus
      aria-label={ariaLabel}
    />
  );

  // 1. Face: intro
  if (prompt.face === 'intro') {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              className="text-3xl font-extrabold"
              style={{ color: 'var(--color-text)' }}
            >
              {prompt.headword}
            </h2>
            <div
              className="mt-1 text-base ipa"
              style={{ color: 'var(--color-text-dim)' }}
            >
              {prompt.ipaUk}
              {prompt.ipaUs && prompt.ipaUs !== prompt.ipaUk
                ? ` · US ${prompt.ipaUs}`
                : ''}
            </div>
          </div>

          <AudioButton
            playing={audioPlaying}
            onToggle={() => onPlayAudio(prompt.audioUrl, false)}
            label="Nghe phát âm"
          />
        </div>

        {audioFallbackNotice && (
          <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
            {audioFallbackNotice}
          </p>
        )}

        <div
          className="p-4 rounded-[var(--radius-md)] border space-y-1.5"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {prompt.meaningVi}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
            {prompt.definitionEn}
          </div>
        </div>

        {/* 1 ví dụ */}
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
            Ví dụ ngữ cảnh IELTS
          </div>
          <blockquote
            className="pl-3.5 py-1.5 border-l-2 reading-prose text-base italic"
            style={{
              borderColor: 'var(--color-vocab)',
              color: 'var(--color-text)',
            }}
          >
            “{prompt.exampleEn}”
          </blockquote>
          {prompt.exampleVi && (
            <p className="text-xs pl-3.5" style={{ color: 'var(--color-text-dim)' }}>
              {prompt.exampleVi}
            </p>
          )}
        </div>

        {/* 2 collocations */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
            2 Collocations chủ lực
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {prompt.collocations.map((col, idx) => (
              <div
                key={idx}
                className="px-3.5 py-2.5 rounded-[var(--radius-sm)] border text-sm font-semibold"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-vocab)',
                }}
              >
                • {col}
              </div>
            ))}
          </div>
        </div>

        {prompt.vnTrap && (
          <p className="text-xs" style={{ color: 'var(--color-partial)' }}>
            💡 {prompt.vnTrap}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            leftIcon={<Zap className="w-4 h-4" />}
            onClick={onIntroKnowAlready}
          >
            Tôi biết rồi (Kiểm ngay)
          </Button>
          <Button
            variant="primary"
            skill="vocab"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={onIntroSeen}
          >
            Đã xem (Enter)
          </Button>
        </div>
      </div>
    );
  }

  // 2. Face: recog
  if (prompt.face === 'recog') {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              className="text-3xl font-extrabold"
              style={{ color: 'var(--color-text)' }}
            >
              {prompt.headword}
            </h2>
            <div
              className="mt-1 text-base ipa"
              style={{ color: 'var(--color-text-dim)' }}
            >
              {prompt.ipaUk}
            </div>
          </div>

          <AudioButton
            playing={audioPlaying}
            onToggle={() => onPlayAudio(prompt.audioUrl, false)}
            label="Phát âm"
          />
        </div>

        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
          Chọn nghĩa tiếng Việt chính xác nhất (phím 1–4):
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          {prompt.choices.map((choice, idx) => {
            const isEliminated = activeNode.eliminatedChoices.includes(idx);
            let choiceState: ChoiceState = 'idle';

            if (hasFeedback) {
              if (idx === prompt.correctIndex) {
                choiceState =
                  selectedChoiceIdx === idx ? 'correct' : 'reveal-correct';
              } else if (selectedChoiceIdx === idx) {
                choiceState = 'wrong';
              }
            } else if (selectedChoiceIdx === idx) {
              choiceState = 'selected';
            }

            return (
              <ChoiceButton
                key={idx}
                indexLabel={String(idx + 1)}
                label={isEliminated ? '— Đã loại bằng gợi ý —' : choice}
                state={choiceState}
                disabled={hasFeedback || isEliminated}
                onClick={() => onChoiceSelect(idx)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Face: recall_meaning
  if (prompt.face === 'recall_meaning') {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            “{prompt.meaningVi}”
          </div>
          <div
            className="text-base leading-relaxed"
            style={{ color: 'var(--color-text-dim)' }}
          >
            {prompt.definitionEn}
          </div>
        </div>

        {/* Khung hiển thị số chữ cái _ _ _ _ (khoảng trắng hiện ·) */}
        <div
          className="px-4 py-2.5 rounded-[var(--radius-sm)] border flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <span
            className="text-base sm:text-lg font-bold tracking-widest"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-vocab)',
            }}
          >
            {prompt.placeholderMask}
          </span>
          <span
            className="text-xs font-semibold tabular-nums shrink-0"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-dim)',
            }}
          >
            {prompt.letterCount} chữ cái
          </span>
        </div>

        <AnswerInput
          value={typedAnswer}
          onChange={setTypedAnswer}
          onSubmit={onSubmit}
          placeholder={prompt.placeholderMask}
          status={hasFeedback ? feedbackStatus ?? 'idle' : 'idle'}
          disabled={hasFeedback}
          autoFocus
          aria-label="Gõ từ tiếng Anh"
        />
      </div>
    );
  }

  // 4. Face: recall_cloze
  if (prompt.face === 'recall_cloze') {
    return (
      <div className="space-y-4">
        <div
          className="p-4 rounded-[var(--radius-md)] border space-y-2"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <p
            className="reading-prose text-lg font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            {prompt.clozeSentenceEn}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
            Nghĩa gốc: <strong>{prompt.meaningVi}</strong>
            {prompt.exampleVi ? ` — (${prompt.exampleVi})` : ''}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            Gợi ý khung: {prompt.placeholderMask}
          </span>
          <span>{prompt.letterCount} chữ cái (chấp nhận mọi dạng từ phù hợp)</span>
        </div>

        <AnswerInput
          value={typedAnswer}
          onChange={setTypedAnswer}
          onSubmit={onSubmit}
          placeholder={prompt.placeholderMask}
          status={hasFeedback ? feedbackStatus ?? 'idle' : 'idle'}
          disabled={hasFeedback}
          autoFocus
          aria-label="Điền từ vào chỗ trống"
        />
      </div>
    );
  }

  // 5. Face: listen_spell
  if (prompt.face === 'listen_spell') {
    const remainingPlays = Math.max(
      0,
      prompt.maxPlays - activeNode.audioPlaysUsed,
    );

    return (
      <div className="space-y-4">
        <div
          className="p-5 rounded-[var(--radius-md)] border flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              Nghe và gõ lại chính xác 100% chính tả
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Số lượt phát tối đa: {prompt.maxPlays} lần (còn {remainingPlays}/
              {prompt.maxPlays} lượt)
            </div>
            {audioFallbackNotice && (
              <div className="text-xs" style={{ color: 'var(--color-partial)' }}>
                {audioFallbackNotice}
                {prompt.meaningVi ? ` · Nghĩa: "${prompt.meaningVi}"` : ''}
              </div>
            )}
          </div>

          <AudioButton
            playing={audioPlaying}
            disabled={remainingPlays <= 0 && !hasFeedback}
            onToggle={() => onPlayAudio(prompt.audioUrl, true)}
            label={
              remainingPlays > 0
                ? `Phát âm thanh (${remainingPlays}/${prompt.maxPlays})`
                : 'Đã hết lượt nghe'
            }
          />
        </div>

        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            Khung từ: {prompt.placeholderMask}
          </span>
          <span>{prompt.letterCount} chữ cái</span>
        </div>

        <AnswerInput
          value={typedAnswer}
          onChange={setTypedAnswer}
          onSubmit={onSubmit}
          placeholder={prompt.placeholderMask}
          status={hasFeedback ? feedbackStatus ?? 'idle' : 'idle'}
          disabled={hasFeedback}
          autoFocus
          aria-label="Gõ chính tả từ vừa nghe"
        />
      </div>
    );
  }

  // 6. Face: col_gap
  if (prompt.face === 'col_gap') {
    return (
      <div className="space-y-4">
        <div
          className="p-4 rounded-[var(--radius-md)] border space-y-2"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--color-text-dim)' }}>
              Cấu trúc Collocation ({prompt.pattern}):
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-writing)' }}>
              {prompt.letterCount} chữ cái
            </span>
          </div>

          <div
            className="text-2xl font-extrabold"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text)',
            }}
          >
            {prompt.displayGap}
          </div>

          <div className="text-base font-medium" style={{ color: 'var(--color-text-dim)' }}>
            Nghĩa: “{prompt.meaningVi}”
          </div>
        </div>

        <AnswerInput
          value={typedAnswer}
          onChange={setTypedAnswer}
          onSubmit={onSubmit}
          placeholder={prompt.placeholderMask}
          status={hasFeedback ? feedbackStatus ?? 'idle' : 'idle'}
          disabled={hasFeedback}
          autoFocus
          aria-label="Điền từ còn thiếu trong cụm collocation"
        />
      </div>
    );
  }

  // 7. Face: para_match
  if (prompt.face === 'para_match') {
    return (
      <div className="space-y-4">
        <div
          className="p-4 rounded-[var(--radius-md)] border space-y-2"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
            Cụm từ gốc trong câu hỏi
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--color-reading)' }}>
            “{prompt.questionPhrase}”
          </div>
          <p className="text-xs italic reading-prose" style={{ color: 'var(--color-text-dim)' }}>
            Ngữ cảnh bài đọc: {prompt.contextEn}
          </p>
        </div>

        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
          Chọn cụm Paraphrase đồng nghĩa trong bài (phím 1–4):
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          {prompt.choices.map((choice, idx) => {
            const isEliminated = activeNode.eliminatedChoices.includes(idx);
            let choiceState: ChoiceState = 'idle';

            if (hasFeedback) {
              if (idx === prompt.correctIndex) {
                choiceState =
                  selectedChoiceIdx === idx ? 'correct' : 'reveal-correct';
              } else if (selectedChoiceIdx === idx) {
                choiceState = 'wrong';
              }
            } else if (selectedChoiceIdx === idx) {
              choiceState = 'selected';
            }

            return (
              <ChoiceButton
                key={idx}
                indexLabel={String(idx + 1)}
                label={isEliminated ? '— Đã loại bằng gợi ý —' : choice}
                state={choiceState}
                disabled={hasFeedback || isEliminated}
                onClick={() => onChoiceSelect(idx)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // 8. Face: tfng_retry / head_retry (Reading: câu hỏi + lựa chọn lên trước, đoạn văn cuộn trong khung)
  if (prompt.face === 'tfng_retry' || prompt.face === 'head_retry') {
    const quote = hasFeedback ? prompt.evidenceQuote : undefined;
    return (
      <div className="space-y-4">
        {prompt.face === 'tfng_retry' ? (
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
              Phát biểu cần kiểm tra với đoạn {prompt.paragraphLabel}
            </div>
            <p className="text-lg font-bold leading-snug" style={{ color: 'var(--color-reading)' }}>
              “{prompt.statement}”
            </p>
          </div>
        ) : (
          <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Chọn tiêu đề khớp ý chính của đoạn {prompt.paragraphLabel} (phím 1–4):
          </p>
        )}

        {renderChoices(prompt.choices, prompt.correctIndex)}

        <div
          className="p-4 rounded-[var(--radius-md)] border space-y-2 max-h-[36vh] overflow-y-auto"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
          tabIndex={0}
          aria-label={`Đoạn ${prompt.paragraphLabel} của bài đọc`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
            {prompt.passageTitle} · đoạn {prompt.paragraphLabel}
          </div>
          <p className="reading-prose text-base leading-relaxed" style={{ color: 'var(--color-text)' }}>
            <QuoteHighlight text={prompt.paragraphText} quote={quote} />
          </p>
        </div>
      </div>
    );
  }

  // 9. Face: ltrap_replay (nghe lại đúng đoạn bẫy rồi gõ đáp án)
  if (prompt.face === 'ltrap_replay') {
    return (
      <div className="space-y-4">
        <div
          className="p-5 rounded-[var(--radius-md)] border flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              Nghe lại đoạn bẫy và trả lời: “{prompt.questionPrompt}”
            </div>
            {audioFallbackNotice && (
              <div className="text-xs" style={{ color: 'var(--color-partial)' }}>
                {audioFallbackNotice}
              </div>
            )}
          </div>
          <AudioButton
            playing={audioPlaying}
            onToggle={() =>
              onPlayAudio(prompt.audioUrl, false, {
                clip: { start: prompt.clipStart, end: prompt.clipEnd },
              })
            }
            label="Nghe đoạn bẫy"
          />
        </div>

        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>Khung: {prompt.placeholderMask}</span>
          <span>{prompt.letterCount} chữ cái</span>
        </div>
        {renderTypedInput(prompt.placeholderMask, 'Gõ đáp án nghe được')}
      </div>
    );
  }

  // 10. Face: dict_full (nghe và chép cả câu)
  if (prompt.face === 'dict_full') {
    const remainingPlays = Math.max(0, prompt.maxPlays - activeNode.audioPlaysUsed);
    return (
      <div className="space-y-4">
        <div
          className="p-5 rounded-[var(--radius-md)] border flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              Nghe và chép lại cả câu
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Còn {remainingPlays}/{prompt.maxPlays} lượt nghe
            </div>
            {audioFallbackNotice && (
              <div className="text-xs" style={{ color: 'var(--color-partial)' }}>
                {audioFallbackNotice}
              </div>
            )}
          </div>
          <AudioButton
            playing={audioPlaying}
            disabled={remainingPlays <= 0 && !hasFeedback}
            onToggle={() => onPlayAudio(prompt.audioUrl, true)}
            label={remainingPlays > 0 ? `Phát câu (${remainingPlays}/${prompt.maxPlays})` : 'Đã hết lượt nghe'}
          />
        </div>
        {renderTypedInput('Gõ lại câu bạn nghe được', 'Chép lại cả câu vừa nghe')}
      </div>
    );
  }

  // 11. Face: err_user (lỗi của chính người học / cụm kiểu Việt / bẫy tự ghi)
  if (prompt.face === 'err_user') {
    return (
      <div className="space-y-4">
        <div
          className="p-4 rounded-[var(--radius-md)] border space-y-2"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span style={{ color: 'var(--color-text-dim)' }}>{prompt.labelVi}</span>
            {prompt.audioClip && (
              <AudioButton
                size="sm"
                playing={audioPlaying}
                onToggle={() =>
                  onPlayAudio(prompt.audioClip?.src, false, {
                    clip: { start: prompt.audioClip?.start ?? 0, end: prompt.audioClip?.end ?? 0 },
                  })
                }
                label="Nghe đoạn liên quan"
              />
            )}
          </div>
          <p className="reading-prose text-lg leading-relaxed font-medium" style={{ color: 'var(--color-wrong)' }}>
            {prompt.front}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>Khung sửa đúng: {prompt.placeholderMask}</span>
          <span>{prompt.letterCount} chữ cái</span>
        </div>
        {renderTypedInput(prompt.placeholderMask, 'Gõ bản sửa đúng')}
      </div>
    );
  }

  // 12. Face: err_fix
  if (prompt.face !== 'err_fix') return null;
  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-[var(--radius-md)] border space-y-2"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--color-text-dim)' }}>
            Gõ lại phần được gạch chân cho đúng chuẩn học thuật:
          </span>
          <Pill tone="speaking">Lỗi: {prompt.tag}</Pill>
        </div>

        <p
          className="reading-prose text-lg leading-relaxed"
          style={{ color: 'var(--color-text)' }}
        >
          <span>{prompt.prefixText}</span>
          <span
            className="font-bold underline decoration-2 px-1 rounded"
            style={{
              textDecorationColor: 'var(--color-wrong)',
              backgroundColor:
                'color-mix(in srgb, var(--color-wrong) 18%, transparent)',
              color: 'var(--color-wrong)',
            }}
          >
            {prompt.errorSpanText}
          </span>
          <span>{prompt.suffixText}</span>
        </p>
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          Khung sửa đúng: {prompt.placeholderMask}
        </span>
        <span>{prompt.letterCount} chữ cái</span>
      </div>

      <AnswerInput
        value={typedAnswer}
        onChange={setTypedAnswer}
        onSubmit={onSubmit}
        placeholder={prompt.placeholderMask}
        status={hasFeedback ? feedbackStatus ?? 'idle' : 'idle'}
        disabled={hasFeedback}
        autoFocus
        aria-label="Gõ phần sửa đúng"
      />
    </div>
  );
}

const GameLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-[var(--radius-md)] border text-sm font-medium"
    style={{
      backgroundColor: 'var(--color-surface-2)',
      color: 'var(--color-text)',
      borderColor: 'var(--color-border)',
    }}
  >
    {children}
  </a>
);

/** Tô bằng chứng trong đoạn văn (chỉ truyền `quote` sau khi đã trả lời để không lộ đáp án). */
const QuoteHighlight: React.FC<{ text: string; quote?: string }> = ({ text, quote }) => {
  if (!quote) return <>{text}</>;
  const at = text.indexOf(quote);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark
        className="rounded px-0.5"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-correct) 22%, transparent)',
          color: 'var(--color-text)',
        }}
      >
        {quote}
      </mark>
      {text.slice(at + quote.length)}
    </>
  );
};

export default V1DailyRun;
