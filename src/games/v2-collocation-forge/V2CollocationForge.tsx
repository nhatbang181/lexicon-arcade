import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Flame,
  Hammer,
  Layers,
  Lightbulb,
  Sparkles,
  Timer as TimerIcon,
  XCircle,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react';
import type { CollocationItem, VocabItem } from '../../core/content/schemas';
import { playSfx } from '../../core/audio/sfx';
import type { SRSCard } from '../../core/srs/fsrsAdapter';
import { registerProgressSaver } from '../../core/adaptive/progressSaver';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { essayRepo } from '../../core/storage/repos/essayRepo';
import { userItemRepo } from '../../core/storage/repos/userItemRepo';
import {
  AnswerInput,
  AudioButton,
  Button,
  Card,
  EmptyState,
  Pill,
  RecapScreen,
  Sheet,
  Skeleton,
  Timer,
} from '../../design/components';
import {
  dur,
  ease,
  feedbackSlideVariants,
  questionSlideVariants,
  reducedRouteVariants,
  wrongShakeVariants,
} from '../../design/motion';
import type { GameProps } from '../registry';
import {
  getV2Kv,
  loadV2Collocations,
  loadV2VocabItems,
  playV2LearningAudio,
  setV2Kv,
} from './loader';
import { createProgressSaver } from './progressSaver';
import {
  V2_NUNG_CARD_SEC,
  V2_NUNG_PREVIEW_COUNT,
  V2_SPRINT_DURATION_SEC,
  advanceFromNung,
  buildHeadwordForges,
  buildV2ProgressSnapshot,
  confirmToiSpot,
  createV2RetrySession,
  createV2Session,
  detectUsedCollocations,
  finishSprintSession,
  formatV2WinStatement,
  nextDapQuestion,
  nextToiRound,
  selectDefaultHeadwordForge,
  selectToiCard,
  submitDapAnswer,
  submitNungSelection,
  submitSelfWrite,
  submitSprintAnswer,
  submitToiFix,
  toggleNungChoice,
  toggleToiCard,
  useDapHint,
  type HeadwordForge,
  type SelfWriteChecklist,
  type V2EngineState,
  type V2Stage,
} from './engine';

const V2_SPRINT_BEST_KV_KEY = 'v2_sprint_best_xp';
const V2_LAST_HEADWORD_KV_KEY = 'v2_last_headword';

/** Chip phím tắt trong nhãn (chữ ≥ 12 px, D4); thay cho KeyHint 11 px của design. */
const Key: React.FC<{ k: string }> = ({ k }) => (
  <span
    className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-medium rounded border select-none"
    style={{
      fontFamily: 'var(--font-mono)',
      backgroundColor: 'var(--color-surface-2)',
      borderColor: 'var(--color-border)',
      color: 'var(--color-text-dim)',
    }}
  >
    {k}
  </span>
);

/** Thở nhẹ cho thẻ chưa trả lời bằng Web Animations API (transform + opacity); tắt khi giảm chuyển động (J9/J8). */
function useBreath(ref: React.RefObject<HTMLElement | null>, active: boolean, reduced: boolean | null) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !active || reduced || typeof el.animate !== 'function') return;
    const anim = el.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.025)', opacity: 0.94 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: 2600, iterations: Infinity, easing: 'ease-in-out' },
    );
    return () => anim.cancel();
  }, [ref, active, reduced]);
}

/** 6 radial spark trajectories for the 0.35s anvil forge burst (transform + opacity only). */
const SPARK_VECTORS: ReadonlyArray<{ x: number; y: number; rotate: number }> = [
  { x: -56, y: -38, rotate: -35 },
  { x: -24, y: -54, rotate: -15 },
  { x: 24, y: -54, rotate: 15 },
  { x: 56, y: -38, rotate: 35 },
  { x: -64, y: -8, rotate: -65 },
  { x: 64, y: -8, rotate: 65 },
];

function getStageMeta(stage: V2Stage): {
  label: string;
  shortLabel: string;
  borderColor: string;
  badgeTone: 'writing' | 'info' | 'vocab' | 'correct';
} {
  switch (stage) {
    case 'nung':
      return {
        label: 'Giai đoạn 1/3: NUNG',
        shortLabel: 'NUNG · Nhận diện',
        borderColor: 'color-mix(in srgb, var(--color-writing) 55%, var(--color-border))',
        badgeTone: 'writing',
      };
    case 'dap':
      return {
        label: 'Giai đoạn 2/3: ĐẬP',
        shortLabel: 'ĐẬP · Sản xuất',
        borderColor: 'var(--color-writing)',
        badgeTone: 'writing',
      };
    case 'toi':
      return {
        label: 'Giai đoạn 3/3: TÔI',
        shortLabel: 'TÔI · Bẫy L1',
        borderColor: 'var(--color-info)',
        badgeTone: 'info',
      };
    case 'write':
      return {
        label: 'Thử thách Tự viết (Level 7+)',
        shortLabel: 'Tự viết',
        borderColor: 'var(--color-vocab)',
        badgeTone: 'vocab',
      };
    case 'sprint':
      return {
        label: 'SPRINT 60 GIÂY',
        shortLabel: 'Sprint 60s',
        borderColor: 'var(--color-vocab)',
        badgeTone: 'vocab',
      };
    case 'recap':
      return {
        label: 'Thành phẩm lò rèn',
        shortLabel: 'Tổng kết',
        borderColor: 'var(--color-correct)',
        badgeTone: 'correct',
      };
  }
}

const V2CollocationForge: React.FC<GameProps> = ({ mode, level, onExit }) => {
  const prefersReduced = useReducedMotion();
  const initialMode: 'training' | 'sprint' = mode === 'sprint' ? 'sprint' : 'training';

  // Loaded data & metadata
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [allCollocations, setAllCollocations] = useState<CollocationItem[]>([]);
  const [forges, setForges] = useState<HeadwordForge[]>([]);
  const [existingCards, setExistingCards] = useState<SRSCard[]>([]);
  const [sprintBestXp, setSprintBestXp] = useState(0);

  // Active engine state
  const [state, setState] = useState<V2EngineState | null>(null);
  const stateRef = useRef<V2EngineState | null>(null);
  stateRef.current = state;

  // UI sub-states
  const [nungPhase, setNungPhase] = useState<'preview' | 'quiz'>('preview');
  const [nungPreviewIdx, setNungPreviewIdx] = useState<number>(0);
  const [nungPreviewSec, setNungPreviewSec] = useState<number>(V2_NUNG_CARD_SEC);
  const [dapInput, setDapInput] = useState('');
  const [toiFixInput, setToiFixInput] = useState('');
  const [sprintInput, setSprintInput] = useState('');
  const [sprintRemaining, setSprintRemaining] = useState<number>(V2_SPRINT_DURATION_SEC);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Anvil visual effect triggers (V2-11: useAnimationControls tránh remount)
  const [sparkKey, setSparkKey] = useState(0);
  const [showSparks, setShowSparks] = useState(false);
  const anvilControls = useAnimationControls();
  const anvilCardRef = useRef<HTMLDivElement | null>(null);

  // Level 7-10 self-write state
  const [selfWriteText, setSelfWriteText] = useState('');
  const [selfChecklist, setSelfChecklist] = useState<SelfWriteChecklist>({
    correctPhrase: false,
    correctPreposition: false,
    correctMeaning: false,
  });

  // Timing & persistence refs
  const questionStartRef = useRef<number>(Date.now());
  const sessionSavedRef = useRef<boolean>(false);
  const dapWrapRef = useRef<HTMLDivElement | null>(null);
  const toiWrapRef = useRef<HTMLDivElement | null>(null);
  const sprintWrapRef = useRef<HTMLDivElement | null>(null);
  const saverRef = useRef(
    createProgressSaver({
      saveProgress: (payload) => attemptRepo.saveProgress(payload),
      finalize: (attemptId, payload) => attemptRepo.finalize(attemptId, payload),
    }),
  );

  const persistSnapshot = useCallback((targetState: V2EngineState | null, final: boolean) => {
    if (!targetState) return Promise.resolve();
    const snap = buildV2ProgressSnapshot(targetState, Date.now());
    if (!snap) return saverRef.current.persist(null, final);
    const before =
      snap.items.length > 0
        ? async () => {
            for (const item of snap.items) {
              await userItemRepo.upsertWithCard(item, 'err_fix', { cardSource: 'user' });
            }
          }
        : undefined;
    return saverRef.current.persist(snap.progress, final, before);
  }, []);

  // Đăng ký lưu tiến độ cho nút "Lưu và thoát" của PlayScreen (TU-02, HANDOFF T1-B #5)
  useEffect(() => {
    return registerProgressSaver(() => persistSnapshot(stateRef.current, false));
  }, [persistSnapshot]);

  const startNewSession = useCallback(
    (
      targetForge: HeadwordForge,
      targetMode: 'training' | 'sprint',
      cols: readonly CollocationItem[],
      cards: readonly SRSCard[],
      bestXp: number,
    ) => {
      saverRef.current.reset();
      const next = createV2Session({
        mode: targetMode,
        level,
        forge: targetForge,
        allCollocations: cols,
        existingCards: cards,
        sprintPersonalBestXp: bestXp,
        nowMs: Date.now(),
      });
      sessionSavedRef.current = false;
      stateRef.current = next;
      setState(next);
      setNungPhase('preview');
      setNungPreviewIdx(0);
      setNungPreviewSec(V2_NUNG_CARD_SEC);
      setDapInput('');
      setToiFixInput('');
      setSprintInput('');
      setSprintRemaining(V2_SPRINT_DURATION_SEC);
      setSelfWriteText('');
      setSelfChecklist({
        correctPhrase: false,
        correctPreposition: false,
        correctMeaning: false,
      });
      questionStartRef.current = Date.now();
      void setV2Kv(V2_LAST_HEADWORD_KV_KEY, targetForge.headwordId);
    },
    [level],
  );

  const startRetrySession = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    if (current.mistakes.length === 0) {
      startNewSession(current.forge, current.mode, allCollocations, existingCards, sprintBestXp);
      return;
    }
    const retry = createV2RetrySession(current, Date.now());
    saverRef.current.reset();
    sessionSavedRef.current = false;
    stateRef.current = retry;
    setState(retry);
    setDapInput('');
    setToiFixInput('');
    setSprintInput('');
    questionStartRef.current = Date.now();
  }, [allCollocations, existingCards, sprintBestXp, startNewSession]);

  // Initial load
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        setLoading(true);
        const [cols, vocabs, cards, bestXp, lastHeadwordId] = await Promise.all([
          loadV2Collocations(),
          loadV2VocabItems(),
          cardRepo.getAll().catch(() => [] as SRSCard[]),
          getV2Kv<number>(V2_SPRINT_BEST_KV_KEY, 0),
          getV2Kv<string | null>(V2_LAST_HEADWORD_KV_KEY, null),
        ]);
        if (!active) return;

        const builtForges = buildHeadwordForges(cols, vocabs as VocabItem[], cards);
        setAllCollocations(cols);
        setForges(builtForges);
        setExistingCards(cards);
        setSprintBestXp(bestXp);

        if (builtForges.length === 0) {
          setLoadError('Chưa có headword nào đạt tối thiểu 6 collocation và 2 bẫy L1.');
          setLoading(false);
          return;
        }

        const candidateForges =
          lastHeadwordId && builtForges.length > 1
            ? builtForges.filter((f) => f.headwordId !== lastHeadwordId)
            : builtForges;
        const defaultForge = selectDefaultHeadwordForge(candidateForges);
        startNewSession(defaultForge, initialMode, cols, cards, bestXp);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Không tải được dữ liệu Collocation Forge.');
        setLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, [initialMode, startNewSession]);

  // Trigger sparks helper
  const triggerSparks = useCallback(() => {
    if (prefersReduced) return;
    setSparkKey((k) => k + 1);
    setShowSparks(true);
    window.setTimeout(() => {
      setShowSparks(false);
    }, 380);
  }, [prefersReduced]);

  const triggerAnvilShake = useCallback(() => {
    if (prefersReduced) return;
    void anvilControls.start('wrong');
  }, [prefersReduced, anvilControls]);

  useBreath(
    anvilCardRef,
    Boolean(state && (state.stage === 'nung' || state.stage === 'dap' || state.stage === 'toi')),
    prefersReduced,
  );

  // Stage 1 Nung preview: 3 thẻ × 8s (V2-1), người học có thể bấm bỏ qua bất cứ lúc nào
  useEffect(() => {
    if (!state || state.stage !== 'nung' || nungPhase !== 'preview') return;
    const previewCount = Math.min(V2_NUNG_PREVIEW_COUNT, state.forge.collocations.length);
    if (nungPreviewSec <= 0) {
      if (nungPreviewIdx + 1 < previewCount) {
        setNungPreviewIdx((i) => i + 1);
        setNungPreviewSec(V2_NUNG_CARD_SEC);
      } else {
        setNungPhase('quiz');
      }
      return;
    }
    const id = window.setInterval(() => {
      setNungPreviewSec((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [state, nungPhase, nungPreviewIdx, nungPreviewSec]);

  // Sprint 60s countdown timer (không gọi playSfx trong state updater - C7)
  useEffect(() => {
    if (!state || state.stage !== 'sprint') return;
    if (sprintRemaining <= 0) {
      playSfx('countdownEnd');
      const finished = finishSprintSession(state).state;
      setState(finished);
      return;
    }
    const id = window.setInterval(() => {
      setSprintRemaining((sec) => Math.max(0, sec - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [state?.stage, sprintRemaining]);

  // SFX tick ở 10 giây cuối Sprint (C7)
  useEffect(() => {
    if (state?.stage === 'sprint' && sprintRemaining > 0 && sprintRemaining <= 10) {
      playSfx('tick');
    }
  }, [state?.stage, sprintRemaining]);

  // Auto-focus inputs when switching questions/steps
  useEffect(() => {
    if (!state) return;
    if (state.stage === 'dap' && !state.dapAnswered) {
      questionStartRef.current = Date.now();
      dapWrapRef.current?.querySelector('input')?.focus();
    } else if (state.stage === 'toi') {
      const round = state.toiRounds[state.toiIndex];
      if (round?.step === 'type_fix') {
        toiWrapRef.current?.querySelector('input')?.focus();
      }
    } else if (state.stage === 'sprint') {
      questionStartRef.current = Date.now();
      sprintWrapRef.current?.querySelector('input')?.focus();
    }
  }, [state?.stage, state?.dapIndex, state?.dapAnswered, state?.toiIndex, state?.toiRounds, state?.sprintIndex]);

  // Chốt phiên khi vào Recap (idempotent qua progressSaver; nạp lại cards sau finalize - V2-2)
  useEffect(() => {
    if (!state || state.stage !== 'recap' || sessionSavedRef.current) return;
    sessionSavedRef.current = true;
    playSfx('sessionDone');

    const endedAt = state.endedAt ?? Date.now();

    void (async () => {
      try {
        await persistSnapshot(state, true);

        const freshCards = await cardRepo.getAll().catch(() => null);
        if (freshCards) {
          setExistingCards(freshCards);
        }

        if (!state.isRetry && state.mode === 'sprint' && state.sprintPersonalBestXp > sprintBestXp) {
          setSprintBestXp(state.sprintPersonalBestXp);
          await setV2Kv(V2_SPRINT_BEST_KV_KEY, state.sprintPersonalBestXp);
        }

        if (!state.isRetry && state.selfWrite?.submitted && state.selfWrite.sentence.trim().length > 0) {
          const words = state.selfWrite.sentence.trim().split(/\s+/).filter(Boolean).length;
          await essayRepo.save({
            taskType: 'task2',
            promptId: `v2_selfwrite:${state.forge.headwordId}`,
            text: state.selfWrite.sentence.trim(),
            wordCount: words,
            createdAt: endedAt,
            updatedAt: endedAt,
          });
        }
      } catch {
        // Ignore storage error in restricted environments
      }
    })();
  }, [state, sprintBestXp, persistSnapshot]);

  // Audio playback helper
  const handlePlayAudio = useCallback((audioPath?: string) => {
    if (!audioPath) return;
    setAudioPlaying(true);
    void playV2LearningAudio(audioPath, () => {
      setAudioPlaying(false);
    });
  }, []);

  // --- Stage 1: NUNG handlers (C7: không gọi playSfx trong updater) ---
  const handleToggleNung = useCallback((idx: number) => {
    playSfx('tap');
    setState((prev) => (prev ? toggleNungChoice(prev, idx) : prev));
  }, []);

  const handleSubmitNung = useCallback(() => {
    const prev = stateRef.current;
    if (!prev || prev.stage !== 'nung' || prev.nungSubmitted) return;
    const { state: next, events } = submitNungSelection(prev);
    stateRef.current = next;
    setState(next);
    const evt = events[0];
    if (evt && evt.type === 'nung_scored') {
      playSfx(evt.correct ? 'correct' : 'wrong');
    }
    void persistSnapshot(next, false);
  }, [persistSnapshot]);

  const handleAdvanceFromNung = useCallback(() => {
    playSfx('flip');
    setDapInput('');
    questionStartRef.current = Date.now();
    setState((prev) => (prev ? advanceFromNung(prev).state : prev));
  }, []);

  // --- Stage 2: DAP handlers ---
  const handleUseDapHint = useCallback(() => {
    playSfx('highlight');
    setState((prev) => (prev ? useDapHint(prev) : prev));
    dapWrapRef.current?.querySelector('input')?.focus();
  }, []);

  const handleSubmitDap = useCallback(() => {
    if (!state || state.stage !== 'dap' || state.dapAnswered) return;
    const elapsed = Math.max(300, Date.now() - questionStartRef.current);
    const { state: next, events } = submitDapAnswer(state, dapInput, elapsed, Date.now());
    stateRef.current = next;
    setState(next);

    const scored = events.find((e) => e.type === 'answer_scored');
    if (scored && scored.type === 'answer_scored') {
      if (scored.correct) {
        playSfx(next.combo >= 3 ? 'streak' : 'correct');
        triggerSparks();
      } else {
        playSfx('wrong');
        triggerAnvilShake();
      }
    }
    void persistSnapshot(next, false);
  }, [state, dapInput, triggerSparks, triggerAnvilShake, persistSnapshot]);

  const handleNextDap = useCallback(() => {
    playSfx('flip');
    setDapInput('');
    questionStartRef.current = Date.now();
    setState((prev) => (prev ? nextDapQuestion(prev).state : prev));
  }, []);

  // --- Stage 3: TOI handlers (hỗ trợ nhiều bẫy V2-4, không gọi side-effect trong updater C7) ---
  const handleSelectToiCard = useCallback(
    (cardIdx: number) => {
      const prev = stateRef.current;
      if (!prev || prev.stage !== 'toi') return;
      const round = prev.toiRounds[prev.toiIndex];
      if (!round || round.step !== 'spot') return;

      if (round.trapCount >= 2) {
        playSfx('tap');
        const { state: next } = toggleToiCard(prev, cardIdx);
        stateRef.current = next;
        setState(next);
        return;
      }

      const { state: next, events } = selectToiCard(prev, cardIdx, Date.now());
      stateRef.current = next;
      setState(next);
      setToiFixInput('');
      const scored = events.find((e) => e.type === 'answer_scored');
      if (scored && scored.type === 'answer_scored') {
        if (scored.correct) {
          playSfx('correct');
          triggerSparks();
        } else {
          playSfx('wrong');
          triggerAnvilShake();
        }
      }
      void persistSnapshot(next, false);
    },
    [triggerSparks, triggerAnvilShake, persistSnapshot],
  );

  const handleConfirmToiSpot = useCallback(() => {
    const prev = stateRef.current;
    if (!prev || prev.stage !== 'toi') return;
    const round = prev.toiRounds[prev.toiIndex];
    if (!round || round.step !== 'spot' || round.selectedIndices.length === 0) return;

    const { state: next, events } = confirmToiSpot(prev, Date.now());
    stateRef.current = next;
    setState(next);
    setToiFixInput('');
    const scored = events.find((e) => e.type === 'answer_scored');
    if (scored && scored.type === 'answer_scored') {
      if (scored.correct) {
        playSfx('correct');
        triggerSparks();
      } else {
        playSfx('wrong');
        triggerAnvilShake();
      }
    }
    void persistSnapshot(next, false);
  }, [triggerSparks, triggerAnvilShake, persistSnapshot]);

  const handleSubmitToiFix = useCallback(() => {
    if (!state || state.stage !== 'toi') return;
    const { state: next, events } = submitToiFix(state, toiFixInput, Date.now());
    stateRef.current = next;
    setState(next);

    const scored = events.find((e) => e.type === 'answer_scored');
    if (scored && scored.type === 'answer_scored') {
      if (scored.correct) {
        playSfx('correct');
        triggerSparks();
      } else {
        playSfx('wrong');
        triggerAnvilShake();
      }
    }
    void persistSnapshot(next, false);
  }, [state, toiFixInput, triggerSparks, triggerAnvilShake, persistSnapshot]);

  const handleNextToi = useCallback(() => {
    playSfx('flip');
    setToiFixInput('');
    setState((prev) => (prev ? nextToiRound(prev, Date.now()).state : prev));
  }, []);

  // --- Level 7-10 Self-Write handler ---
  const handleSubmitSelfWrite = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.stage !== 'write') return prev;
      return submitSelfWrite(prev, selfWriteText, selfChecklist, Date.now()).state;
    });
  }, [selfWriteText, selfChecklist]);

  // --- Sprint handler ---
  const handleSubmitSprint = useCallback(() => {
    if (!state || state.stage !== 'sprint') return;
    const elapsed = Math.max(200, Date.now() - questionStartRef.current);
    const { state: next, events } = submitSprintAnswer(state, sprintInput, elapsed, Date.now());
    stateRef.current = next;
    setState(next);
    setSprintInput('');
    questionStartRef.current = Date.now();

    const scored = events.find((e) => e.type === 'answer_scored');
    if (scored && scored.type === 'answer_scored') {
      if (scored.correct) {
        playSfx(next.combo >= 3 ? 'streak' : 'correct');
        triggerSparks();
      } else {
        playSfx('wrong');
        triggerAnvilShake();
      }
    }
    void persistSnapshot(next, false);
  }, [state, sprintInput, triggerSparks, triggerAnvilShake, persistSnapshot]);

  // Global keyboard shortcuts (1-4, H, Enter) when not typing inside text inputs
  useEffect(() => {
    if (!state || sheetOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (state.stage === 'nung') {
        if (nungPhase === 'preview' && e.key === 'Enter') {
          e.preventDefault();
          setNungPhase('quiz');
          return;
        }
        if (nungPhase === 'quiz') {
          if (!state.nungSubmitted && ['1', '2', '3'].includes(e.key)) {
            e.preventDefault();
            handleToggleNung(Number(e.key) - 1);
            return;
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            if (!state.nungSubmitted && state.nungSelected.length === 2) {
              handleSubmitNung();
            } else if (state.nungSubmitted) {
              handleAdvanceFromNung();
            }
          }
        }
        return;
      }

      if (state.stage === 'dap') {
        if (state.dapAnswered && e.key === 'Enter') {
          e.preventDefault();
          handleNextDap();
          return;
        }
        if (!state.dapAnswered && (e.key === 'h' || e.key === 'H') && (!isInputFocused || e.altKey)) {
          e.preventDefault();
          handleUseDapHint();
        }
        return;
      }

      if (state.stage === 'toi') {
        const round = state.toiRounds[state.toiIndex];
        if (!round) return;
        if (round.step === 'spot' && ['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          handleSelectToiCard(Number(e.key) - 1);
        } else if (
          round.step === 'spot' &&
          round.trapCount >= 2 &&
          round.selectedIndices.length > 0 &&
          e.key === 'Enter'
        ) {
          e.preventDefault();
          handleConfirmToiSpot();
        } else if (round.step === 'feedback' && e.key === 'Enter') {
          e.preventDefault();
          handleNextToi();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state,
    sheetOpen,
    nungPhase,
    handleToggleNung,
    handleSubmitNung,
    handleAdvanceFromNung,
    handleNextDap,
    handleUseDapHint,
    handleSelectToiCard,
    handleConfirmToiSpot,
    handleNextToi,
  ]);

  const selfWriteMatched = useMemo(() => {
    if (!state?.selfWrite) return [];
    return detectUsedCollocations(selfWriteText, state.selfWrite.targetCollocations);
  }, [state?.selfWrite, selfWriteText]);

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
          title="Không thể mở Collocation Forge"
          description={loadError ?? 'Dữ liệu collocation chưa sẵn sàng.'}
          action={
            <Button variant="primary" onClick={() => onExit()}>
              Quay về Hôm nay
            </Button>
          }
        />
      </div>
    );
  }

  const stageMeta = getStageMeta(state.stage);

  // Recap Screen
  if (state.stage === 'recap') {
    const durationSec = Math.max(
      1,
      Math.round(((state.endedAt ?? Date.now()) - state.startedAt) / 1000),
    );
    const total = Math.max(1, state.totalQuestions);
    const accuracyPercent = Math.round((state.correctCount / total) * 100);
    const scoreLabel =
      state.mode === 'sprint'
        ? `${state.sprintCorrectCount} cụm`
        : `${state.correctCount}/${state.totalQuestions}`;

    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        <RecapScreen
          scoreLabel={scoreLabel}
          xpEarned={state.xp}
          winStatement={formatV2WinStatement(state)}
          accuracyPercent={accuracyPercent}
          durationSec={durationSec}
          mistakes={state.mistakes}
          onRetryMistakes={startRetrySession}
          onGoToday={() =>
            onExit({
              gameId: 'v2',
              mode: state.mode,
              xp: state.xp,
              score: state.correctCount,
              total: state.totalQuestions,
            })
          }
        />
      </div>
    );
  }

  const currentDapQ = state.dapQuestions[state.dapIndex];
  const currentToiRound = state.toiRounds[state.toiIndex];
  const currentSprintQ =
    state.sprintQuestions[state.sprintIndex % Math.max(1, state.sprintQuestions.length)];

  const progressText =
    state.stage === 'nung'
      ? nungPhase === 'preview'
        ? 'Xem mẫu'
        : 'Chọn 2 câu đúng'
      : state.stage === 'dap'
      ? `${state.dapIndex + 1}/${state.dapQuestions.length}`
      : state.stage === 'toi'
      ? `${state.toiIndex + 1}/${state.toiRounds.length}`
      : state.stage === 'sprint'
      ? `${state.sprintCorrectCount} đúng`
      : 'Tự viết';

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Thanh trạng thái phiên (không lặp nút thoát ✕ và tiêu đề của PlayScreen - U3) */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-[var(--radius-lg)] border"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: stageMeta.borderColor,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Pill tone={stageMeta.badgeTone} icon={<Hammer className="w-3.5 h-3.5" />}>
            {stageMeta.label}
          </Pill>
          {state.isRetry && (
            <Pill tone="neutral">Ôn câu sai · 0 XP</Pill>
          )}
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-sm)] border tabular-nums"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            {progressText}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {state.stage === 'sprint' && (
            <Timer
              remainingSec={sprintRemaining}
              totalSec={V2_SPRINT_DURATION_SEC}
              size="sm"
            />
          )}

          {state.combo > 0 && (
            <Pill tone="writing" icon={<Flame className="w-3.5 h-3.5" />}>
              x{state.combo}
            </Pill>
          )}

          <Pill tone="correct" icon={<Sparkles className="w-3.5 h-3.5" />}>
            +{state.xp} XP
          </Pill>

          <Button
            variant="secondary"
            size="md"
            leftIcon={<Layers className="w-4 h-4" />}
            onClick={() => setSheetOpen(true)}
          >
            Đổi lò
          </Button>

          <Button
            variant={state.mode === 'sprint' ? 'primary' : 'ghost'}
            skill="vocab"
            size="md"
            leftIcon={<Zap className="w-4 h-4" />}
            onClick={() =>
              startNewSession(
                state.forge,
                state.mode === 'sprint' ? 'training' : 'sprint',
                allCollocations,
                existingCards,
                sprintBestXp,
              )
            }
            title="Chuyển giữa Lò rèn 3 giai đoạn và Sprint 60 giây"
          >
            {state.mode === 'sprint' ? 'Về Lò rèn' : 'Sprint 60s'}
          </Button>
        </div>
      </div>

      {/* Center Anvil (Headword) — V2-11: animate qua controls, không remount */}
      {(state.stage === 'nung' || state.stage === 'dap' || state.stage === 'toi') && (
        <div className="relative flex flex-col items-center justify-center py-1">
          <motion.div
            ref={anvilCardRef}
            variants={prefersReduced ? undefined : wrongShakeVariants}
            animate={anvilControls}
            className="relative px-6 py-3.5 rounded-[var(--radius-lg)] border-2 text-center"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: stageMeta.borderColor,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* 6 sparks burst (0.35s, transform + opacity only) */}
            <AnimatePresence>
              {showSparks && (
                <div
                  key={sparkKey}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
                >
                  {SPARK_VECTORS.map((vec, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: vec.rotate }}
                      animate={{
                        opacity: 0,
                        x: vec.x,
                        y: vec.y,
                        scale: 0.35,
                        rotate: vec.rotate * 1.4,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: dur.slow, ease: ease.out }}
                      className="absolute w-2.5 h-1 rounded-full"
                      style={{ backgroundColor: 'var(--color-writing)' }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase"
                style={{ color: 'var(--color-text)' }}
              >
                {state.forge.headword}
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{
                backgroundColor: 'var(--color-surface-2)',
                color: 'var(--color-text-dim)',
              }}>
                {state.forge.pos.join(', ')}.
              </span>
              <span className="ipa text-sm" style={{ color: 'var(--color-text-dim)' }}>
                {state.forge.ipaUk}
              </span>
              {state.forge.audioUk && (
                <AudioButton
                  size="sm"
                  playing={audioPlaying}
                  onToggle={() => handlePlayAudio(state.forge.audioUk)}
                  label="Nghe"
                />
              )}
            </div>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
              {state.forge.meaningVi}
            </p>
          </motion.div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STAGE 1: NUNG (Warmup preview + choose 2 authentic sentences)     */}
      {/* ================================================================= */}
      {state.stage === 'nung' && (
        <Card
          padding="lg"
          className="space-y-5"
          style={{ borderColor: stageMeta.borderColor }}
        >
          {nungPhase === 'preview' ? (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                    1. Nung phôi: 3 collocation mẫu với “{state.forge.headword}”
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                    Đọc nhanh ngữ cảnh tự nhiên trước khi chọn câu đúng.
                  </p>
                </div>
                <Pill tone="writing" icon={<TimerIcon className="w-3.5 h-3.5" />}>
                  Thẻ {Math.min(nungPreviewIdx + 1, V2_NUNG_PREVIEW_COUNT)}/{Math.min(V2_NUNG_PREVIEW_COUNT, state.forge.collocations.length)} · {nungPreviewSec}s
                </Pill>
              </div>

              <div className="space-y-3">
                {state.forge.collocations.slice(0, V2_NUNG_PREVIEW_COUNT).map((col, idx) => {
                  const activeCard = idx === nungPreviewIdx;
                  return (
                    <div
                      key={col.id}
                      className="p-4 rounded-[var(--radius-md)] border space-y-1.5 transition-opacity"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: activeCard ? 'var(--color-writing)' : 'var(--color-border)',
                        opacity: activeCard ? 1 : 0.78,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className="font-bold text-sm"
                          style={{ color: 'var(--color-writing)' }}
                        >
                          {col.phrase}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                          {col.meaningVi} · Band {col.bandTarget}
                        </span>
                      </div>
                      <p className="reading-prose text-base" style={{ color: 'var(--color-text)' }}>
                        {col.example}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  skill="writing"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setNungPhase('quiz')}
                >
                  Vào kiểm tra nhận diện (Enter)
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                  Chọn 2 câu dùng collocation ĐÚNG chuẩn học thuật
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                  Có 1 câu chứa bẫy collocation dịch từ tiếng Việt. Bấm phím 1–3 để chọn.
                </p>
              </div>

              <div className="space-y-3">
                {state.nungChoices.map((choice) => {
                  const selected = state.nungSelected.includes(choice.index);
                  let borderColor = selected ? 'var(--color-writing)' : 'var(--color-border)';
                  let bgColor = selected
                    ? 'color-mix(in srgb, var(--color-writing) 12%, var(--color-surface-2))'
                    : 'var(--color-surface-2)';

                  if (state.nungSubmitted) {
                    if (choice.isCorrect) {
                      borderColor = 'var(--color-correct)';
                      bgColor = 'color-mix(in srgb, var(--color-correct) 10%, var(--color-surface-2))';
                    } else {
                      borderColor = 'var(--color-wrong)';
                      bgColor = 'color-mix(in srgb, var(--color-wrong) 12%, var(--color-surface-2))';
                    }
                  }

                  return (
                    <button
                      key={choice.index}
                      type="button"
                      disabled={state.nungSubmitted}
                      onClick={() => handleToggleNung(choice.index)}
                      className="w-full text-left p-4 rounded-[var(--radius-md)] border transition-colors cursor-pointer disabled:cursor-default space-y-1.5"
                      style={{ backgroundColor: bgColor, borderColor }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 shrink-0">
                            <Key k={String(choice.index + 1)} />
                          </span>
                          <p className="text-sm sm:text-base" style={{ color: 'var(--color-text)' }}>
                            {choice.sentence}
                          </p>
                        </div>
                        {selected && !state.nungSubmitted && (
                          <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--color-writing)' }} />
                        )}
                        {state.nungSubmitted && choice.isCorrect && (
                          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--color-correct)' }} />
                        )}
                        {state.nungSubmitted && !choice.isCorrect && (
                          <XCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--color-wrong)' }} />
                        )}
                      </div>

                      {state.nungSubmitted && !choice.isCorrect && choice.whyVi && (
                        <div
                          className="mt-2 p-2.5 rounded-[var(--radius-sm)] border text-xs space-y-1"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-wrong) 14%, var(--color-surface))',
                            borderColor: 'var(--color-wrong)',
                            color: 'var(--color-text)',
                          }}
                        >
                          <div className="font-bold" style={{ color: 'var(--color-wrong)' }}>
                            Bẫy kiểu Việt: <span className="line-through">{choice.phrase}</span> →{' '}
                            <span style={{ color: 'var(--color-correct)' }}>{choice.correctPhrase}</span>
                          </div>
                          <p style={{ color: 'var(--color-text-dim)' }}>{choice.whyVi}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Đã chọn {state.nungSelected.length}/2 câu
                </span>
                {!state.nungSubmitted ? (
                  <Button
                    variant="primary"
                    skill="writing"
                    disabled={state.nungSelected.length !== 2}
                    onClick={handleSubmitNung}
                  >
                    Kiểm tra (Enter)
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    skill="writing"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={handleAdvanceFromNung}
                  >
                    Sang Giai đoạn 2: ĐẬP (Enter)
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      {/* ================================================================= */}
      {/* STAGE 2: ĐẬP (Gap Production)                                     */}
      {/* ================================================================= */}
      {state.stage === 'dap' && currentDapQ && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDapQ.collocation.id}
            variants={prefersReduced ? reducedRouteVariants : questionSlideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            <Card
              padding="lg"
              className="space-y-5"
              style={{ borderColor: stageMeta.borderColor }}
            >
              {/* Sentence with inline gap */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Pill tone="writing">
                    {currentDapQ.collocation.pattern} · Band {currentDapQ.collocation.bandTarget}
                  </Pill>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-dim)' }}>
                    “{currentDapQ.collocation.meaningVi}”
                  </span>
                </div>

                <p className="reading-prose text-lg sm:text-xl leading-relaxed" style={{ color: 'var(--color-text)' }}>
                  {currentDapQ.beforeGap}
                  <span
                    className="inline-block mx-1 px-2.5 py-0.5 rounded-[var(--radius-sm)] border font-bold"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: state.dapAnswered
                        ? state.dapLastResult?.correct
                          ? 'color-mix(in srgb, var(--color-correct) 16%, var(--color-surface-2))'
                          : 'color-mix(in srgb, var(--color-wrong) 16%, var(--color-surface-2))'
                        : 'color-mix(in srgb, var(--color-writing) 14%, var(--color-surface-2))',
                      borderColor: state.dapAnswered
                        ? state.dapLastResult?.correct
                          ? 'var(--color-correct)'
                          : 'var(--color-wrong)'
                        : 'var(--color-writing)',
                      color: state.dapAnswered
                        ? state.dapLastResult?.correct
                          ? 'var(--color-correct)'
                          : 'var(--color-wrong)'
                        : 'var(--color-writing)',
                    }}
                  >
                    {state.dapAnswered
                      ? state.dapLastResult?.matchedAnswer ?? currentDapQ.gap.primary
                      : dapInput.trim() || '________'}
                  </span>
                  {currentDapQ.afterGap}
                </p>

                {currentDapQ.hintUsed && (
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] border text-xs font-semibold"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: 'color-mix(in srgb, var(--color-partial) 12%, var(--color-surface-2))',
                      borderColor: 'var(--color-partial)',
                      color: 'var(--color-partial)',
                    }}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    Gợi ý: {currentDapQ.hintText}
                  </div>
                )}
              </div>

              {/* Input + Action buttons */}
              <div ref={dapWrapRef} className="space-y-3">
                <AnswerInput
                  value={dapInput}
                  onChange={setDapInput}
                  onSubmit={state.dapAnswered ? handleNextDap : handleSubmitDap}
                  disabled={state.dapAnswered}
                  status={
                    !state.dapAnswered
                      ? 'idle'
                      : state.dapLastResult?.correct
                      ? 'correct'
                      : 'wrong'
                  }
                  placeholder={`Điền vào: ${currentDapQ.gap.display}`}
                />

                {!state.dapAnswered && (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <Button
                      variant="secondary"
                      size="md"
                      leftIcon={<Lightbulb className="w-4 h-4" />}
                      disabled={currentDapQ.hintUsed}
                      onClick={handleUseDapHint}
                    >
                      Gợi ý (H)
                    </Button>

                    <Button
                      variant="primary"
                      skill="writing"
                      disabled={dapInput.trim().length === 0}
                      onClick={handleSubmitDap}
                    >
                      Nộp (Enter)
                    </Button>
                  </div>
                )}
              </div>

              {/* Feedback section */}
              <AnimatePresence>
                {state.dapAnswered && state.dapLastResult && (
                  <motion.div
                    variants={prefersReduced ? reducedRouteVariants : feedbackSlideVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="rounded-[var(--radius-md)] border-2 p-4 space-y-3"
                    style={{
                      backgroundColor:
                        state.dapLastResult.outcome === 'l1_trap'
                          ? 'color-mix(in srgb, var(--color-wrong) 18%, var(--color-surface))'
                          : state.dapLastResult.correct
                          ? 'color-mix(in srgb, var(--color-correct) 10%, var(--color-surface))'
                          : 'color-mix(in srgb, var(--color-wrong) 10%, var(--color-surface))',
                      borderColor: state.dapLastResult.correct
                        ? 'var(--color-correct)'
                        : 'var(--color-wrong)',
                    }}
                    role="region"
                    aria-live="polite"
                  >
                    {state.dapLastResult.outcome === 'l1_trap' ? (
                      <>
                        <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--color-wrong)' }}>
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Collocation kiểu Việt — {state.dapLastResult.messageVi}</span>
                        </div>
                        {state.dapLastResult.comparison && (
                          <div
                            className="flex flex-wrap items-center gap-2 text-sm font-semibold px-3 py-2 rounded-[var(--radius-sm)]"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              backgroundColor: 'var(--color-surface-2)',
                            }}
                          >
                            <span className="line-through" style={{ color: 'var(--color-wrong)' }}>
                              {state.dapLastResult.comparison.wrong}
                            </span>
                            <span style={{ color: 'var(--color-text-dim)' }}>→</span>
                            <span style={{ color: 'var(--color-correct)' }}>
                              {state.dapLastResult.comparison.correct}
                            </span>
                          </div>
                        )}
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                          {state.dapLastResult.whyVi}
                        </p>
                      </>
                    ) : state.dapLastResult.correct ? (
                      <>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--color-correct)' }}>
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{state.dapLastResult.messageVi} (+12 XP)</span>
                          </div>
                          {state.forge.audioUk && (
                            <AudioButton
                              size="sm"
                              playing={audioPlaying}
                              onToggle={() => handlePlayAudio(state.forge.audioUk)}
                              label="Nghe headword"
                            />
                          )}
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          {currentDapQ.collocation.example}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--color-wrong)' }}>
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>{state.dapLastResult.messageVi}</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p style={{ color: 'var(--color-text)' }}>
                            Cụm chuẩn:{' '}
                            <strong style={{ color: 'var(--color-correct)', fontFamily: 'var(--font-mono)' }}>
                              {currentDapQ.collocation.phrase}
                            </strong>{' '}
                            ({currentDapQ.collocation.meaningVi})
                          </p>
                          <p className="text-xs italic" style={{ color: 'var(--color-text-dim)' }}>
                            Ví dụ khác: {currentDapQ.alternativeExample}
                          </p>
                        </div>
                      </>
                    )}

                    <div className="flex justify-end pt-1">
                      <Button
                        variant="primary"
                        skill="writing"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        onClick={handleNextDap}
                      >
                        {state.dapIndex + 1 < state.dapQuestions.length
                          ? 'Câu tiếp (Enter)'
                          : 'Sang Giai đoạn 3: TÔI (Enter)'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Forged Shelf */}
            <div
              className="px-4 py-3 rounded-[var(--radius-md)] border space-y-2"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
                Đã rèn ({state.forgedShelf.length}/{state.dapQuestions.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {state.forgedShelf.map((col) => (
                  <span
                    key={col.id}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-[var(--radius-sm)] border"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-correct) 12%, var(--color-surface-2))',
                      borderColor: 'color-mix(in srgb, var(--color-correct) 40%, var(--color-border))',
                      color: 'var(--color-text)',
                    }}
                  >
                    <Check className="w-3 h-3" style={{ color: 'var(--color-correct)' }} />
                    {col.phrase}
                  </span>
                ))}
                {Array.from({
                  length: Math.max(0, state.dapQuestions.length - state.forgedShelf.length),
                }).map((_, idx) => (
                  <span
                    key={`empty-${idx}`}
                    className="inline-block w-8 h-6 rounded-[var(--radius-sm)] border border-dashed"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface-2)',
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ================================================================= */}
      {/* STAGE 3: TÔI (2×2 Grid L1 Trap Spot + Fix with 0.3s SVG Crack)    */}
      {/* ================================================================= */}
      {state.stage === 'toi' && currentToiRound && (
        <Card
          padding="lg"
          className="space-y-5"
          style={{ borderColor: stageMeta.borderColor }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                {currentToiRound.step === 'spot'
                  ? currentToiRound.trapCount >= 2
                    ? `Chọn ${currentToiRound.trapCount} cụm collocation SAI (kiểu Việt)`
                    : 'Bấm chọn cụm collocation SAI (kiểu Việt)'
                  : currentToiRound.step === 'type_fix'
                  ? 'Gõ lại bản sửa học thuật cho cụm bị nứt'
                  : 'Kết quả tôi thép'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                {currentToiRound.trapCount >= 2
                  ? 'Vòng nhiều bẫy: chọn hết các cụm sai (1–4) rồi bấm Xác nhận (Enter).'
                  : 'Chọn đúng cụm sai (+10 XP) → Gõ bản sửa đúng (+8 XP).'}
              </p>
            </div>
            <Pill tone="info">
              Lượt {state.toiIndex + 1}/{state.toiRounds.length}
            </Pill>
          </div>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentToiRound.cards.map((card) => {
              const isCracked = currentToiRound.crackedCardIndex === card.index;
              const isSelected =
                currentToiRound.selectedCardIndex === card.index ||
                currentToiRound.selectedIndices.includes(card.index);
              const isMissedTrap = currentToiRound.missedTrapIndices.includes(card.index);
              const revealed = currentToiRound.step !== 'spot';

              let borderColor = isSelected ? 'var(--color-info)' : 'var(--color-border)';
              let bgColor = isSelected
                ? 'color-mix(in srgb, var(--color-info) 12%, var(--color-surface-2))'
                : 'var(--color-surface-2)';
              if (revealed) {
                if (card.isTrap) {
                  borderColor = 'var(--color-wrong)';
                  bgColor = 'color-mix(in srgb, var(--color-wrong) 14%, var(--color-surface-2))';
                } else if (isSelected) {
                  borderColor = 'var(--color-partial)';
                } else {
                  borderColor = 'color-mix(in srgb, var(--color-correct) 40%, var(--color-border))';
                }
              }

              return (
                <button
                  key={card.index}
                  type="button"
                  disabled={revealed}
                  aria-pressed={currentToiRound.trapCount >= 2 ? isSelected : undefined}
                  onClick={() => handleSelectToiCard(card.index)}
                  className="relative overflow-hidden text-left p-4 rounded-[var(--radius-md)] border-2 transition-colors cursor-pointer disabled:cursor-default min-h-[84px] flex flex-col justify-between gap-2"
                  style={{ backgroundColor: bgColor, borderColor }}
                >
                  <div className="flex items-start justify-between gap-2 relative z-10">
                    <span
                      className={`font-semibold text-base ${isCracked ? 'line-through' : ''}`}
                      style={{
                        color: isCracked ? 'var(--color-wrong)' : 'var(--color-text)',
                      }}
                    >
                      {card.text}
                    </span>
                    <span className="shrink-0">
                      <Key k={String(card.index + 1)} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 relative z-10">
                    <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                      {card.meaningVi}
                    </span>
                    {revealed && isMissedTrap && (
                      <span
                        className="text-xs font-semibold"
                        style={{ color: 'var(--color-wrong)' }}
                      >
                        Bỏ sót bẫy
                      </span>
                    )}
                  </div>

                  {/* SVG Crack overlay (0.3s transform + opacity only) */}
                  {isCracked && (
                    <motion.svg
                      viewBox="0 0 220 90"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scaleX: 0.1, scaleY: 0.6 }}
                      animate={{ opacity: 0.85, scaleX: 1, scaleY: 1 }}
                      transition={{ duration: 0.3, ease: ease.out }}
                      className="pointer-events-none absolute inset-0 w-full h-full origin-left"
                    >
                      <path
                        d="M 8 18 L 58 38 L 92 26 L 136 58 L 176 44 L 214 74"
                        fill="none"
                        stroke="var(--color-wrong)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 92 26 L 108 8 M 136 58 L 122 82"
                        fill="none"
                        stroke="var(--color-wrong)"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </motion.svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Nút xác nhận cho vòng nhiều bẫy (V2-4) */}
          {currentToiRound.step === 'spot' && currentToiRound.trapCount >= 2 && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                Đã chọn {currentToiRound.selectedIndices.length}/{currentToiRound.trapCount} cụm sai
              </span>
              <Button
                variant="primary"
                skill="info"
                disabled={currentToiRound.selectedIndices.length === 0}
                onClick={handleConfirmToiSpot}
              >
                Xác nhận (Enter)
              </Button>
            </div>
          )}

          {/* Step 2: Type fix for the cracked L1 trap */}
          {currentToiRound.step === 'type_fix' && currentToiRound.activeTrapCard && (
            <motion.div
              variants={prefersReduced ? reducedRouteVariants : feedbackSlideVariants}
              initial="hidden"
              animate="visible"
              className="p-4 rounded-[var(--radius-md)] border-2 space-y-3"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-wrong) 14%, var(--color-surface))',
                borderColor: 'var(--color-wrong)',
              }}
            >
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: currentToiRound.spotCorrect ? 'var(--color-correct)' : 'var(--color-wrong)' }}>
                {currentToiRound.spotCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bắt đúng bẫy kiểu Việt! (+10 XP)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Chưa đúng — cụm sai là “{currentToiRound.activeTrapCard.text}”</span>
                  </>
                )}
              </div>

              {currentToiRound.activeTrapCard.whyVi && (
                <p className="text-xs sm:text-sm" style={{ color: 'var(--color-text-dim)' }}>
                  {currentToiRound.activeTrapCard.whyVi}
                </p>
              )}

              <div ref={toiWrapRef}>
                <AnswerInput
                  value={toiFixInput}
                  onChange={setToiFixInput}
                  onSubmit={handleSubmitToiFix}
                  label={`Sửa "${currentToiRound.activeTrapCard.text}" thành cụm chuẩn (${currentToiRound.activeTrapCard.meaningVi}):`}
                  placeholder="Gõ cụm collocation đúng (hoặc từ thay thế)..."
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  skill="info"
                  disabled={toiFixInput.trim().length === 0}
                  onClick={handleSubmitToiFix}
                >
                  Nộp bản sửa (Enter)
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Round feedback */}
          {currentToiRound.step === 'feedback' && currentToiRound.activeTrapCard && (
            <motion.div
              variants={prefersReduced ? reducedRouteVariants : feedbackSlideVariants}
              initial="hidden"
              animate="visible"
              className="p-4 rounded-[var(--radius-md)] border-2 space-y-3"
              style={{
                backgroundColor: currentToiRound.fixCorrect
                  ? 'color-mix(in srgb, var(--color-correct) 10%, var(--color-surface))'
                  : 'color-mix(in srgb, var(--color-wrong) 14%, var(--color-surface))',
                borderColor: currentToiRound.fixCorrect
                  ? 'var(--color-correct)'
                  : 'var(--color-wrong)',
              }}
            >
              <div
                className="flex items-center gap-2 text-sm font-bold"
                style={{
                  color: currentToiRound.fixCorrect
                    ? 'var(--color-correct)'
                    : 'var(--color-wrong)',
                }}
              >
                {currentToiRound.fixCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sửa chuẩn xác! (+8 XP)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Chưa đúng — đã thêm thẻ lỗi vào SRS ôn lại</span>
                  </>
                )}
              </div>

              <div
                className="flex flex-wrap items-center gap-2 text-sm font-semibold px-3 py-2 rounded-[var(--radius-sm)]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--color-surface-2)',
                }}
              >
                <span className="line-through" style={{ color: 'var(--color-wrong)' }}>
                  {currentToiRound.activeTrapCard.text}
                </span>
                <span style={{ color: 'var(--color-text-dim)' }}>→</span>
                <span style={{ color: 'var(--color-correct)' }}>
                  {currentToiRound.activeTrapCard.correctPhrase}
                </span>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  skill="info"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleNextToi}
                >
                  {state.toiIndex + 1 < state.toiRounds.length
                    ? 'Lượt tiếp (Enter)'
                    : 'Hoàn thành lò (+40 XP) (Enter)'}
                </Button>
              </div>
            </motion.div>
          )}
        </Card>
      )}

      {/* ================================================================= */}
      {/* LEVEL 7-10: SELF-WRITE CHALLENGE                                  */}
      {/* ================================================================= */}
      {state.stage === 'write' && state.selfWrite && (
        <Card
          padding="lg"
          className="space-y-5"
          style={{ borderColor: stageMeta.borderColor }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              Thử thách Level {state.level}: Tự viết 1 câu dùng 2 collocation vừa rèn
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
              Câu tự viết sẽ được lưu vào Portfolio để bạn có thể gửi chấm cùng bài W1.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {state.selfWrite.targetCollocations.map((col) => {
              const used = selfWriteMatched.includes(col.phrase);
              return (
                <div
                  key={col.id}
                  className="p-3 rounded-[var(--radius-md)] border space-y-1"
                  style={{
                    backgroundColor: used
                      ? 'color-mix(in srgb, var(--color-correct) 10%, var(--color-surface-2))'
                      : 'var(--color-surface-2)',
                    borderColor: used ? 'var(--color-correct)' : 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm" style={{ color: 'var(--color-vocab)' }}>
                      {col.phrase}
                    </span>
                    {used && <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-correct)' }} />}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                    Mẫu: {col.example}
                  </p>
                </div>
              );
            })}
          </div>

          <textarea
            rows={3}
            value={selfWriteText}
            onChange={(e) => setSelfWriteText(e.target.value)}
            placeholder="Viết 1 câu Task 2 sử dụng cả 2 collocation trên..."
            className="w-full p-3.5 rounded-[var(--radius-md)] border text-sm leading-relaxed"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
              Tự kiểm theo checklist
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {(
                [
                  ['correctPhrase', 'Đúng cụm collocation?'],
                  ['correctPreposition', 'Đúng giới từ đi kèm?'],
                  ['correctMeaning', 'Đúng ngữ cảnh & nghĩa?'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selfChecklist[key]}
                    onChange={(e) =>
                      setSelfChecklist((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                  />
                  <span style={{ color: 'var(--color-text)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleSubmitSelfWrite}>
              Bỏ qua
            </Button>
            <Button
              variant="primary"
              skill="vocab"
              disabled={selfWriteText.trim().length < 10}
              onClick={handleSubmitSelfWrite}
            >
              Lưu vào Portfolio & Xem tổng kết
            </Button>
          </div>
        </Card>
      )}

      {/* ================================================================= */}
      {/* SPRINT MODE (60 SECONDS)                                          */}
      {/* ================================================================= */}
      {state.stage === 'sprint' && currentSprintQ && (
        <Card
          padding="lg"
          className="space-y-5"
          style={{ borderColor: stageMeta.borderColor }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                Sprint 60 giây · +10 × combo mỗi câu đúng
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                Kỷ lục cá nhân: {state.sprintPersonalBestXp} XP · Chỉ ôn lại thẻ đã có.
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setState((prev) => (prev ? finishSprintSession(prev).state : prev))}
            >
              Kết thúc sớm
            </Button>
          </div>

          <div
            className="p-4 rounded-[var(--radius-md)] border space-y-2"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
              “{currentSprintQ.collocation.meaningVi}”
            </div>
            <p className="reading-prose text-lg" style={{ color: 'var(--color-text)' }}>
              {currentSprintQ.beforeGap}
              <span
                className="inline-block mx-1 px-2 py-0.5 rounded border font-bold"
                style={{
                  fontFamily: 'var(--font-mono)',
                  borderColor: 'var(--color-vocab)',
                  color: 'var(--color-vocab)',
                }}
              >
                {sprintInput.trim() || '________'}
              </span>
              {currentSprintQ.afterGap}
            </p>
          </div>

          <div ref={sprintWrapRef}>
            <AnswerInput
              value={sprintInput}
              onChange={setSprintInput}
              onSubmit={handleSubmitSprint}
              placeholder={`Gõ nhanh: ${currentSprintQ.gap.display}`}
            />
          </div>

          {state.sprintLastResult && (
            <div
              className="text-xs font-semibold px-3 py-2 rounded-[var(--radius-sm)] border"
              style={{
                backgroundColor: state.sprintLastResult.correct
                  ? 'color-mix(in srgb, var(--color-correct) 12%, var(--color-surface))'
                  : 'color-mix(in srgb, var(--color-wrong) 14%, var(--color-surface))',
                borderColor: state.sprintLastResult.correct
                  ? 'var(--color-correct)'
                  : 'var(--color-wrong)',
                color: state.sprintLastResult.correct
                  ? 'var(--color-correct)'
                  : 'var(--color-wrong)',
              }}
            >
              {state.sprintLastResult.messageVi}
              {state.sprintLastResult.outcome === 'l1_trap' && state.sprintLastResult.whyVi
                ? ` — ${state.sprintLastResult.whyVi}`
                : ''}
            </div>
          )}
        </Card>
      )}

      {/* Headword Selector Sheet */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Chọn Headword cho lò rèn"
        subtitle="Mỗi lò rèn có tối thiểu 6 collocation học thuật và 2 bẫy kiểu Việt."
      >
        <div className="space-y-2.5">
          {forges.map((forge) => {
            const active = forge.headwordId === state.forge.headwordId;
            return (
              <button
                key={forge.headwordId}
                type="button"
                onClick={() => {
                  playSfx('tap');
                  setSheetOpen(false);
                  startNewSession(forge, 'training', allCollocations, existingCards, sprintBestXp);
                }}
                className="w-full text-left p-3.5 rounded-[var(--radius-md)] border transition-colors cursor-pointer space-y-1"
                style={{
                  backgroundColor: active
                    ? 'color-mix(in srgb, var(--color-writing) 14%, var(--color-surface-2))'
                    : 'var(--color-surface-2)',
                  borderColor: active ? 'var(--color-writing)' : 'var(--color-border)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-base uppercase" style={{ color: 'var(--color-text)' }}>
                    {forge.headword}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-text-dim)' }}>
                    {forge.collocations.length} cụm · {forge.unlearnedCount} mới
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  {forge.meaningVi}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {forge.topics.map((t) => (
                    <Pill key={t} tone="neutral">
                      {t}
                    </Pill>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
};

export default V2CollocationForge;
