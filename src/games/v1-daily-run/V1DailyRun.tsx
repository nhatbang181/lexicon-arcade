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
  RotateCw,
  Shield,
  Swords,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AnswerInput,
  AudioButton,
  Button,
  Card,
  EmptyState,
  LiveCard,
  Mascot,
  Pill,
  ProgressRing,
  RecapScreen,
  type ChoiceState,
} from '../../design/components';
import {
  pickVariants,
  questionSlideVariants,
} from '../../design/motion';
import {
  emit,
  haptic,
  numberPop,
  screenPunch,
  useFxTier,
  type FxTierCapabilities,
} from '../../design/fx';
import { registerProgressSaver } from '../../core/adaptive/progressSaver';
import { formatBandLabel } from '../../core/adaptive/sessionLevel';
import { computeComboRate, playSfx, sfxEngine } from '../../core/audio/sfx';
import { resolveAssetUrl } from '../../core/content/loaders';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { eventRepo } from '../../core/storage/repos/eventRepo';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import type { SRSCard } from '../../core/srs/fsrsAdapter';
import { computeAbsenceDays } from '../../core/srs/queue';
import type { GameProps } from '../registry';
import {
  BOSS_MODIFIER_INFO,
  advanceAfterFeedback,
  applyNodeHint,
  buildV1ProgressPayload,
  chooseCheckpointFork,
  computeLastWeekAccuracy,
  computeRecent7DayRetention,
  createV1Run,
  finishAtCheckpoint,
  getActiveNode,
  getComboMultiplier,
  getRevealedPrefix,
  getTypedTargetText,
  hydrateRunContent,
  isChoicePrompt,
  previewThornyForkCards,
  recordNodeAudioPlay,
  refundNodeAudioPlay,
  startPlayingFromMap,
  submitIntroAction,
  submitNodeAnswer,
  type V1ContentBundle,
  type V1ForkPath,
  type V1RunMode,
  type V1RunState,
} from './engine';
import {
  hasVocabDetails,
  loadV1Content,
  loadV1Extras,
  loadV1VocabDetails,
  mergeVocabDetails,
} from './extras';
import { createProgressSaver } from './progressSaver';
import { buildStarterVocabCards } from './starter';
import { RunMap } from './RunMap';
import {
  GameLink,
  PlaceholderMaskDisplay,
  ProgressSweepBar,
  QuoteHighlight,
  V1ChoiceItem,
  V1FeedbackSection,
} from './V1JuiceBits';

function getCheckpointMascotLine(maxCombo: number): string {
  return maxCombo >= 2
    ? `Nửa đường rồi — combo dài nhất ${maxCombo}!`
    : 'Xong Chặng 1 rồi — chọn nhánh tiếp theo nhé!';
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty'; content: V1ContentBundle }
  | { kind: 'ready' };

interface RunContext {
  content: V1ContentBundle;
  newCardsLimit: number;
  newCardsDoneToday: number;
  completedRunsToday: number;
  lastWeekAccuracy: number | null;
  retention7d: number | null;
  absenceDays: number;
}

interface InterstitialBanner {
  title: string;
  subtitle: string;
  mascotState: 'vui' | 'co-vu' | 'an-mung';
  mascotSay: string;
}

const DAY_MS = 86_400_000;
const INTERSTITIAL_MS = 1_200;

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

export const V1DailyRun: React.FC<GameProps> = ({
  mode,
  level,
  onExit,
  nextTask,
  onNextTask,
}) => {
  const isExam = mode === 'exam';
  const fx = useFxTier({ examMode: isExam });
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

  // Juice & UI states
  const [introFlipped, setIntroFlipped] = useState<boolean>(false);
  const [progressSweepKey, setProgressSweepKey] = useState<number>(0);
  const [revealCorrectReady, setRevealCorrectReady] = useState<boolean>(false);
  const [brokenComboGhost, setBrokenComboGhost] = useState<{ id: number; count: number } | null>(null);
  const [interstitial, setInterstitial] = useState<InterstitialBanner | null>(null);

  const nodeStartedAtRef = useRef<number>(Date.now());
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const hitStopTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const interstitialTimerRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);
  const initTokenRef = useRef<number>(0);
  const contextRef = useRef<RunContext | null>(null);
  const newCardsLimitRef = useRef<number>(15);
  const detailsLoadedRef = useRef<boolean>(false);
  const prevPhaseRef = useRef<V1RunState['phase'] | null>(null);

  const questionCardRef = useRef<HTMLDivElement | null>(null);
  const bossStageRef = useRef<HTMLDivElement | null>(null);
  const mobileHudRef = useRef<HTMLDivElement | null>(null);
  const desktopHudRef = useRef<HTMLDivElement | null>(null);
  const mobileXpRef = useRef<HTMLSpanElement | null>(null);
  const desktopXpRef = useRef<HTMLSpanElement | null>(null);
  const mobileComboRef = useRef<HTMLSpanElement | null>(null);
  const desktopComboRef = useRef<HTMLSpanElement | null>(null);

  // Lưu tiến độ giữa phiên (G3)
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

  const getVisibleElement = useCallback(
    (mobileEl: HTMLElement | null, desktopEl: HTMLElement | null): HTMLElement | null => {
      if (desktopEl) {
        const r = desktopEl.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return desktopEl;
      }
      if (mobileEl) {
        const r = mobileEl.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return mobileEl;
      }
      return desktopEl ?? mobileEl;
    },
    [],
  );

  // Nạp lười words.detail.json ở nền (D17) CHỈ cho các từ vựng có trong phiên hiện tại (tránh chặn main thread)
  const ensureVocabDetailsLoaded = useCallback((run: V1RunState) => {
    if (detailsLoadedRef.current) return;
    const ctx = contextRef.current;
    if (!ctx || ctx.content.vocab.length === 0) return;
    const detailItemIds = Array.from(
      new Set(
        run.nodes
          .filter((n) => n.itemId.startsWith('vocab:'))
          .map((n) => n.itemId),
      ),
    );
    if (detailItemIds.length === 0) return;
    if (hasVocabDetails(ctx.content.vocab[0])) {
      detailsLoadedRef.current = true;
      return;
    }
    detailsLoadedRef.current = true;
    void loadV1VocabDetails({ itemIds: detailItemIds })
      .then((detailMap) => {
        if (!mountedRef.current || !contextRef.current) return;
        const mergedVocab = mergeVocabDetails(contextRef.current.content.vocab, detailMap);
        const mergedBundle: V1ContentBundle = {
          ...contextRef.current.content,
          vocab: mergedVocab,
        };
        contextRef.current = { ...contextRef.current, content: mergedBundle };
        setRunState((prev) => (prev ? hydrateRunContent(prev, mergedBundle) : prev));
      })
      .catch(() => {
        detailsLoadedRef.current = false;
      });
  }, []);

  const startRun = useCallback(
    async (
      cards: SRSCard[],
      content: V1ContentBundle,
      effectiveLevel: number,
      newCardsLimit: number,
      lastActiveDay: string | null = null,
    ) => {
      const now = new Date();
      const dayStart = startOfLocalDay(now);
      const [extras, doneToday, recentAttempts] = await Promise.all([
        loadV1Extras(cards, { now, dictations: content.dictations, vocab: content.vocab }),
        cardRepo.countNewCardsStartedSince(dayStart).catch(() => 0),
        attemptRepo.getSince(now.getTime() - 2 * 7 * DAY_MS, 'v1').catch(() => []),
      ]);
      const completedRunsToday = recentAttempts.filter(
        (a) => a.gameId === 'v1' && a.startedAt >= dayStart && a.status !== 'in_progress',
      ).length;
      const bundle: V1ContentBundle = { ...content, extras };
      const lastWeekAccuracy = computeLastWeekAccuracy(recentAttempts, now);
      const retention7d = computeRecent7DayRetention(recentAttempts, now);
      const absenceDays = computeAbsenceDays(lastActiveDay, now);
      contextRef.current = {
        content: bundle,
        newCardsLimit,
        newCardsDoneToday: doneToday,
        completedRunsToday,
        lastWeekAccuracy,
        retention7d,
        absenceDays,
      };
      const run = createV1Run({
        cards,
        content: bundle,
        mode: initialRunMode,
        examMode: isExam,
        completedRunsToday,
        skillLevel: effectiveLevel,
        newCardsLimit,
        newCardsDoneToday: doneToday,
        now,
        lastWeekAccuracy,
        retention7d,
        absenceDays,
        startOnMap: true,
      });
      void logMissingItems(run.missingItems);
      if (!mountedRef.current) return;
      resetPersistence();
      setRunState(run);
      nodeStartedAtRef.current = Date.now();
      ensureVocabDetailsLoaded(run);
    },
    [ensureVocabDetailsLoaded, initialRunMode, isExam, resetPersistence],
  );

  useEffect(() => {
    mountedRef.current = true;
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
        await startRun(
          existingCards,
          content,
          effectiveLevel,
          newCardsLimitRef.current,
          profile?.streak?.lastActiveDay ?? null,
        );
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
      if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current);
      if (hitStopTimerRef.current !== null) window.clearTimeout(hitStopTimerRef.current);
      if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
      if (interstitialTimerRef.current !== null) window.clearTimeout(interstitialTimerRef.current);
      if (audioElRef.current) audioElRef.current.pause();
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

  // Interstitial 1,2 s khi bước vào pha Boss (hiện RunMap + Lexi trong data-mascot-ok)
  useEffect(() => {
    const phase = runState?.phase ?? null;
    if (phase === 'boss' && prevPhaseRef.current && prevPhaseRef.current !== 'boss' && !isExam) {
      const mod = runState?.bossModifier;
      const modInfo = mod ? BOSS_MODIFIER_INFO[mod] : null;
      setInterstitial({
        title: modInfo ? `Pha Boss · Luật: ${modInfo.labelVi}` : 'Pha Boss · 5 thẻ khó nhất',
        subtitle: modInfo?.descVi ?? 'Hạ 5 thẻ khó nhất của phiên để nhận thưởng Boss.',
        mascotState: 'co-vu',
        mascotSay: modInfo
          ? `Vào Boss rồi! Luật lần này: ${modInfo.labelVi} — bình tĩnh xử từng thẻ nhé!`
          : 'Tới chặng Boss rồi — tập trung hạ 5 thẻ khó nhất nhé!',
      });
      if (interstitialTimerRef.current !== null) window.clearTimeout(interstitialTimerRef.current);
      interstitialTimerRef.current = window.setTimeout(() => {
        setInterstitial(null);
      }, INTERSTITIAL_MS);
    }
    prevPhaseRef.current = phase;
  }, [runState?.phase, runState?.bossModifier, isExam]);

  const showStageInterstitial = useCallback(
    (banner: InterstitialBanner) => {
      if (isExam) return;
      setInterstitial(banner);
      if (interstitialTimerRef.current !== null) window.clearTimeout(interstitialTimerRef.current);
      interstitialTimerRef.current = window.setTimeout(() => {
        setInterstitial(null);
      }, INTERSTITIAL_MS);
    },
    [isExam],
  );

  // Lưu tiến độ giữa phiên
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
      if (latest && latest.phase !== 'recap' && !saverRef.current.isFinalized()) {
        return persist(latest, false);
      }
      return undefined;
    };
    const unregisterSaver = registerProgressSaver(() => flush());
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void flush();
    };
    const onPageHide = () => {
      void flush();
    };
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      unregisterSaver();
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
      void flush();
    };
  }, [persist]);

  // Reset input & UI state whenever the active node changes
  useEffect(() => {
    if (!activeNode) return;
    setSelectedChoiceIdx(null);
    setAudioFallbackNotice(null);
    setAudioMissing(false);
    setIntroFlipped(false);
    setRevealCorrectReady(false);
    nodeStartedAtRef.current = Date.now();
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }

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

  // Play audio from static file (NEVER calling speechSynthesis)
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
        if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = window.setTimeout(() => {
          setAudioPlaying(false);
        }, 700);
        return;
      }

      try {
        if (audioElRef.current) audioElRef.current.pause();
        const url = resolveAssetUrl(audioRelativePath);
        const audio = new Audio(url);
        audioElRef.current = audio;
        setAudioPlaying(true);
        setAudioFallbackNotice(null);
        setAudioMissing(false);

        if (clip) {
          audio.addEventListener('loadedmetadata', () => {
            try {
              audio.currentTime = clip.start;
            } catch {
              // ignore
            }
          });
          audio.addEventListener('timeupdate', () => {
            if (audio.currentTime >= clip.end) {
              audio.pause();
              setAudioPlaying(false);
            }
          });
        }

        audio.onended = () => setAudioPlaying(false);
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

  // Auto-advance after <= 1.2s on exact 'correct' feedback
  useEffect(() => {
    if (!runState?.feedback || runState.feedback.status !== 'correct') return;
    const delayMs = runState.feedback.autoAdvanceMs ?? 1200;
    const timer = window.setTimeout(() => {
      playSfx('flip', { examMode: isExam });
      setProgressSweepKey((k) => k + 1);
      setRunState((prev) => (prev && prev.feedback ? advanceAfterFeedback(prev) : prev));
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [runState?.feedback, isExam]);

  // Chốt phiên khi vào Recap
  useEffect(() => {
    if (!runState || runState.phase !== 'recap' || !runState.recap || sessionSaved) {
      return;
    }
    setSessionSaved(true);
    // Nếu RecapScreen không chạy bộ đếm (XP = 0 hoặc reduced-motion), phát sessionDone một lần ở đây
    if (!isExam && (runState.recap.totalXp <= 0 || !fx.allowE1Slide)) {
      playSfx('sessionDone', { examMode: isExam });
    }
    void persist(runState, true);
  }, [runState, sessionSaved, persist, isExam, fx.allowE1Slide]);

  // Thẻ giới thiệu tự phát âm 250 ms sau khi hiện
  useEffect(() => {
    if (!activeNode || activeNode.prompt.face !== 'intro') return;
    const audioUrl = activeNode.prompt.audioUrl;
    const timer = window.setTimeout(() => {
      playCardAudio(audioUrl, false, { silent: true });
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNode?.nodeId]);

  const handleNextAfterFeedback = useCallback(() => {
    if (!runState || !runState.feedback) return;
    playSfx('flip', { examMode: isExam });
    setProgressSweepKey((k) => k + 1);
    setRunState(advanceAfterFeedback(runState));
  }, [runState, isExam]);

  const handleToggleIntroFlip = useCallback(() => {
    setIntroFlipped((prev) => !prev);
    playSfx('flip', { examMode: isExam });
    haptic('tap', { examMode: isExam });
  }, [isExam]);

  const handleChooseFork = useCallback(
    (path: V1ForkPath) => {
      if (!runState || runState.phase !== 'checkpoint') return;
      playSfx(path === 'thorny' ? 'streak' : 'flip', { examMode: isExam });
      haptic(path === 'thorny' ? 'streak' : 'tap', { examMode: isExam });
      const next = chooseCheckpointFork(runState, path);
      setRunState(next);
      showStageInterstitial(
        path === 'thorny'
          ? {
              title: 'Nhánh Đường gai · ×1,5 XP',
              subtitle: '5 thẻ khó nhất đang chờ — giữ chuỗi chính xác để tối đa thưởng!',
              mascotState: 'co-vu',
              mascotSay: 'Chọn Đường gai luôn — tập trung 5 thẻ khó nhất lấy ×1,5 XP nhé!',
            }
          : {
              title: `Chặng ${next.currentStage + 1}/${next.totalStages} · Đường an toàn`,
              subtitle: 'Tiếp tục lộ trình thẻ đến hạn ổn định.',
              mascotState: 'vui',
              mascotSay: getCheckpointMascotLine(next.maxCombo),
            },
      );
    },
    [runState, isExam, showStageInterstitial],
  );

  const handleSubmitAnswer = useCallback(
    (overrideAnswer?: string, origin?: { x: number; y: number }) => {
      if (!runState || !activeNode) return;
      if (runState.feedback) {
        handleNextAfterFeedback();
        return;
      }

      if (activeNode.face === 'intro') {
        playSfx('flip', { examMode: isExam });
        setRunState(submitIntroAction(runState, 'seen'));
        return;
      }

      const answerToScore = overrideAnswer !== undefined ? overrideAnswer : typedAnswer;
      const elapsedMs = Math.max(300, Date.now() - nodeStartedAtRef.current);

      const prevCombo = runState.combo;
      const next = submitNodeAnswer(runState, answerToScore, elapsedMs);
      setRunState(next);

      const cardEl = questionCardRef.current;

      const bossJustDefeated =
        next.events.some((e) => e.type === 'boss_defeated') && !runState.bossDefeated;
      const status = next.feedback?.status;

      if (hitStopTimerRef.current !== null) {
        window.clearTimeout(hitStopTimerRef.current);
        hitStopTimerRef.current = null;
      }

      // Chạy VFX/SFX/layout-read sau paint đầu (setTimeout 0 / 55ms hit-stop) để INP luôn thấp ở CPU ×4
      const scheduleEffects = (delayMs: number, fn: () => void) => {
        hitStopTimerRef.current = window.setTimeout(fn, Math.max(0, delayMs));
      };

      const resolveFxAnchors = () => {
        const cardRect = cardEl?.getBoundingClientRect();
        const fxX = origin?.x ?? (cardRect ? cardRect.left + cardRect.width / 2 : window.innerWidth / 2);
        const fxY = origin?.y ?? (cardRect ? cardRect.top + Math.min(120, cardRect.height / 2) : window.innerHeight / 2);
        const xpEl = getVisibleElement(mobileXpRef.current, desktopXpRef.current);
        const xpRect = xpEl?.getBoundingClientRect();
        const xpTarget = xpRect
          ? { x: xpRect.left + xpRect.width / 2, y: xpRect.top + xpRect.height / 2 }
          : undefined;
        const comboEl = getVisibleElement(mobileComboRef.current, desktopComboRef.current);
        const comboRect = comboEl?.getBoundingClientRect();
        const comboX = comboRect ? comboRect.left + comboRect.width / 2 : fxX;
        const comboY = comboRect ? comboRect.top + comboRect.height / 2 : 70;
        const hudEl = getVisibleElement(mobileHudRef.current, desktopHudRef.current);
        return { fxX, fxY, xpTarget, comboX, comboY, hudEl };
      };

      if (bossJustDefeated) {
        // Hạ Boss: hit-stop 50ms + screenPunch ≤ 8px/300ms + hạt vỡ khiên + levelUp SFX
        playSfx('levelUp', { examMode: isExam });
        haptic('celebrate', { examMode: isExam });
        setProgressSweepKey((k) => k + 1);
        screenPunch(bossStageRef.current ?? cardEl, {
          mode: 'boss',
          amplitudePx: 8,
          durationMs: 300,
          hitStopMs: 50,
          examMode: isExam,
        });
        scheduleEffects(fx.tier === 'full' && !isExam ? 50 : 0, () => {
          const { fxX, fxY, xpTarget } = resolveFxAnchors();
          emit('spark', { x: fxX, y: fxY, count: 24, examMode: isExam });
          emit('star', { x: fxX, y: fxY, count: 12, examMode: isExam });
          if (!isExam && !runState.isExtraPractice) {
            numberPop('+50 XP', { x: fxX, y: fxY - 12, to: xpTarget, examMode: isExam });
          }
        });
        return;
      }

      if (status === 'correct' || status === 'partial') {
        const xpGain = next.feedback?.xpEarned ?? 0;
        const hitMilestone =
          next.combo > prevCombo &&
          (next.combo === 3 || next.combo === 5 || next.combo === 10);

        setProgressSweepKey((k) => k + 1);

        // Hit-stop 55ms chỉ ở bậc full (13-ANIMATION §4)
        scheduleEffects(fx.tier === 'full' && !isExam ? 55 : 0, () => {
          haptic(hitMilestone ? 'streak' : 'correct', { examMode: isExam });
          if (hitMilestone) {
            const streakRate = next.combo >= 10 ? 1.25 : next.combo >= 5 ? 1.12 : 1.0;
            playSfx('streak', { rate: streakRate, examMode: isExam });
          } else {
            playSfx('correct', { rate: computeComboRate(next.combo), examMode: isExam });
          }
          const { fxX, fxY, xpTarget, comboX, comboY, hudEl } = resolveFxAnchors();
          if (hitMilestone && hudEl && fx.allowE1Slide && !isExam && typeof hudEl.animate === 'function') {
            hudEl.animate(
              [
                { transform: 'scale(1)' },
                { transform: 'scale(1.06)' },
                { transform: 'scale(1)' },
              ],
              { duration: 120, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
            );
          }
          if (cardEl && fx.allowE1Slide && !isExam && typeof cardEl.animate === 'function') {
            cardEl.animate(
              [
                { transform: 'scale(1)' },
                { transform: 'scale(1.04)' },
                { transform: 'scale(1)' },
              ],
              { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
            );
          }
          emit('spark', { x: fxX, y: fxY, count: 14, examMode: isExam });
          if (hitMilestone) {
            const emberCount = next.combo >= 10 ? 24 : next.combo >= 5 ? 14 : 8;
            emit('ember', { x: comboX, y: comboY, count: emberCount, examMode: isExam });
          }
          if (xpGain > 0 && !isExam) {
            numberPop(`+${xpGain} XP`, {
              x: fxX,
              y: fxY - 10,
              to: xpTarget,
              examMode: isExam,
            });
          }
          if (
            activeNode.face !== 'ltrap_replay' &&
            activeNode.face !== 'dict_full' &&
            'audioUrl' in activeNode.prompt &&
            activeNode.prompt.audioUrl
          ) {
            playCardAudio(activeNode.prompt.audioUrl, false);
          }
        });
      } else if (status === 'wrong') {
        // Sau 200ms hiện viền nét đứt quanh đáp án đúng (reduced-motion hiện ngay)
        if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
        if (fx.allowE1Slide && !isExam) {
          setRevealCorrectReady(false);
          revealTimerRef.current = window.setTimeout(() => {
            setRevealCorrectReady(true);
          }, 200);
        } else {
          setRevealCorrectReady(true);
        }

        scheduleEffects(0, () => {
          // Sai (≥ 3 kênh, CẤM hạt & CẤM rung cả màn hình theo L-7/Kao 2020)
          playSfx('wrong', { examMode: isExam });
          haptic('wrong', { examMode: isExam });
          // Rung ngang ±6px × 3 / 300ms CHỈ trên thẻ câu hỏi
          screenPunch(cardEl, {
            mode: 'wrong-card',
            amplitudePx: 6,
            durationMs: 300,
            examMode: isExam,
          });

          // Thẻ tối nhẹ brightness(.85) 150ms rồi trả lại
          if (
            cardEl &&
            fx.allowE0 &&
            !isExam &&
            fx.tier !== 'reduced' &&
            typeof cardEl.animate === 'function'
          ) {
            cardEl.animate(
              [
                { filter: 'brightness(1)' },
                { filter: 'brightness(0.85)' },
                { filter: 'brightness(1)' },
              ],
              { duration: 150, easing: 'ease-out' },
            );
          }

          // Vỡ combo (khi đang có chuỗi >= 3): rơi +12px mờ 300ms + 6 hạt smoke, KHÔNG phát tiếng phạt
          if (prevCombo >= 3 && next.combo === 0) {
            const { comboX, comboY } = resolveFxAnchors();
            setBrokenComboGhost({ id: Date.now(), count: prevCombo });
            emit('smoke', { x: comboX, y: comboY, count: 6, examMode: isExam });
            window.setTimeout(() => setBrokenComboGhost(null), 320);
          }
        });
      }
    },
    [
      activeNode,
      fx.allowE0,
      fx.allowE1Slide,
      fx.tier,
      getVisibleElement,
      handleNextAfterFeedback,
      isExam,
      playCardAudio,
      runState,
      typedAnswer,
    ],
  );

  const handleHint = useCallback(() => {
    if (!runState || !activeNode || runState.feedback) return;
    if (runState.phase === 'boss' && runState.bossModifier === 'no_hints') return;
    playSfx('tap', { examMode: isExam });
    haptic('tap', { examMode: isExam });
    const next = applyNodeHint(runState);
    setRunState(next);

    const updated = getActiveNode(next);
    if (!updated) return;

    const targetWord = getTypedTargetText(updated.prompt);
    if (targetWord && updated.face !== 'intro') {
      const prefix = getRevealedPrefix(targetWord, updated.revealedLetters);
      if (!typedAnswer.toLowerCase().startsWith(prefix.toLowerCase())) {
        setTypedAnswer(prefix);
      }
    }
  }, [activeNode, isExam, runState, typedAnswer]);

  const handleChoiceSelect = useCallback(
    (choiceIdx: number, origin?: { x: number; y: number }) => {
      if (!runState || !activeNode || runState.feedback) return;
      if (activeNode.eliminatedChoices.includes(choiceIdx)) return;
      if (!isChoicePrompt(activeNode.prompt)) return;
      const choiceText = activeNode.prompt.choices[choiceIdx];
      if (choiceText === undefined) return;
      setSelectedChoiceIdx(choiceIdx);
      handleSubmitAnswer(choiceText, origin);
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
        examMode: isExam,
        completedRunsToday: ctx?.completedRunsToday ?? 0,
        skillLevel,
        newCardsLimit: ctx?.newCardsLimit ?? newCardsLimitRef.current,
        newCardsDoneToday: ctx?.newCardsDoneToday ?? 0,
        lastWeekAccuracy: ctx?.lastWeekAccuracy ?? null,
        retention7d: ctx?.retention7d ?? null,
        absenceDays: ctx?.absenceDays ?? 0,
        startOnMap: runState.phase === 'map_intro',
        now: new Date(),
      });
      resetPersistence();
      setRunState(fresh);
    },
    [isExam, resetPersistence, runState, skillLevel],
  );

  // Global keyboard shortcuts: 1-4 MCQ, H Hint, Enter advance/safe-fork, ArrowRight thorny-fork, Space finish typewriter
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!runState || e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      const inTextInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (interstitial && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setInterstitial(null);
        return;
      }

      if (runState.phase === 'map_intro' && e.key === 'Enter') {
        e.preventDefault();
        playSfx('flip', { examMode: isExam });
        setRunState((prev) => (prev ? startPlayingFromMap(prev) : prev));
        return;
      }

      if (runState.phase === 'checkpoint') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleChooseFork('safe');
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleChooseFork('thorny');
          return;
        }
      }

      if (runState.feedback && e.key === 'Enter') {
        e.preventDefault();
        handleNextAfterFeedback();
        return;
      }

      if (!activeNode || runState.feedback) return;

      if (activeNode.face === 'intro' && e.key === 'Enter' && !inTextInput) {
        e.preventDefault();
        playSfx('flip', { examMode: isExam });
        setRunState((prev) => (prev ? submitIntroAction(prev, 'seen') : prev));
        return;
      }

      if (isChoicePrompt(activeNode.prompt) && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        playSfx('tap', { examMode: isExam });
        haptic('tap', { examMode: isExam });
        handleChoiceSelect(Number(e.key) - 1);
        return;
      }

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
    handleChooseFork,
    handleHint,
    handleNextAfterFeedback,
    interstitial,
    isExam,
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

  if (loadState.kind === 'empty') {
    const lobbyFeatures = [
      {
        icon: resolveAssetUrl('assets/icons/fluent/ui/rocket.webp'),
        title: '15 từ B2–C1',
        sub: 'Học thuật cốt lõi',
      },
      {
        icon: resolveAssetUrl('assets/icons/fluent/ui/xp.webp'),
        title: 'Ngã ba & Boss',
        sub: 'Đường gai ×1,5 XP',
      },
      {
        icon: resolveAssetUrl('assets/icons/fluent/ui/brain.webp'),
        title: 'Ôn nhớ lâu',
        sub: 'Lịch ôn tự động',
      },
    ];
    const allowLobbyMotion = !isExam && fx.tier !== 'reduced';

    return (
      <div className="max-w-xl mx-auto p-3.5 sm:p-6" data-mascot-ok="true">
        <style>{`
          @keyframes v1-lobby-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }
          .v1-lobby-emblem {
            animation: v1-lobby-float 2.6s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .v1-lobby-emblem { animation: none !important; }
          }
          [data-reduced-motion="true"] .v1-lobby-emblem {
            animation: none !important;
          }
        `}</style>

        <Card padding="lg" skillAccent="vocab" className="space-y-4 sm:space-y-5">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[var(--radius-lg)] border flex items-center justify-center shrink-0 ${
                allowLobbyMotion ? 'v1-lobby-emblem' : ''
              }`}
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-vocab) 14%, var(--color-surface-2))',
                borderColor: 'color-mix(in srgb, var(--color-vocab) 38%, var(--color-border))',
              }}
            >
              <img
                src={resolveAssetUrl('assets/icons/fluent/games/v1.webp')}
                alt=""
                aria-hidden="true"
                width={48}
                height={48}
                loading="eager"
                decoding="async"
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain"
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Pill tone="vocab">V1 · Daily Run</Pill>
              <h1
                className="font-display text-xl sm:text-2xl font-extrabold leading-tight"
                style={{ color: 'var(--color-text)' }}
              >
                Chưa có thẻ nào để ôn
              </h1>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                Bắt đầu ngay với 15 từ học thuật thường gặp, hoặc làm bài placement 10 phút để chọn đúng band của bạn.
              </p>
            </div>
          </div>

          {!isExam && (
            <div className="flex items-center gap-3">
              <Mascot
                state="chao"
                showBubble={false}
                size={72}
                examMode={isExam}
              />
              <div
                className="rounded-[var(--radius-md)] border px-3.5 py-2.5 text-xs sm:text-sm font-medium leading-snug"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                Nạp 15 từ IELTS cốt lõi để bắt đầu lượt chạy đầu tiên nhé!
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {lobbyFeatures.map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--radius-md)] border px-2 py-2.5 sm:px-3 sm:py-3 text-center space-y-1"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <img
                  src={item.icon}
                  alt=""
                  aria-hidden="true"
                  width={28}
                  height={28}
                  loading="eager"
                  decoding="async"
                  className="w-7 h-7 mx-auto object-contain"
                />
                <div className="text-xs font-bold leading-snug" style={{ color: 'var(--color-text)' }}>
                  {item.title}
                </div>
                <div className="text-xs leading-tight hidden sm:block" style={{ color: 'var(--color-text-dim)' }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <Button
              variant="primary"
              skill="vocab"
              className="w-full sm:flex-1 min-h-[48px]"
              loading={starting}
              onClick={() => void handleStartWithStarter()}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Bắt đầu với 15 từ khởi động
            </Button>
            <GameLink href="#/placement">Làm placement</GameLink>
          </div>
        </Card>
      </div>
    );
  }

  if (!runState) {
    const allowLoadingMotion = !isExam && fx.tier !== 'reduced';
    return (
      <div className="max-w-xl mx-auto p-3.5 sm:p-6">
        <style>{`
          @keyframes v1-load-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }
          .v1-load-emblem {
            animation: v1-load-float 2.4s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .v1-load-emblem { animation: none !important; }
          }
          [data-reduced-motion="true"] .v1-load-emblem {
            animation: none !important;
          }
        `}</style>
        <Card padding="lg" skillAccent="vocab" className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-[var(--radius-lg)] border flex items-center justify-center shrink-0 ${
              allowLoadingMotion ? 'v1-load-emblem' : ''
            }`}
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-vocab) 14%, var(--color-surface-2))',
              borderColor: 'color-mix(in srgb, var(--color-vocab) 38%, var(--color-border))',
            }}
          >
            <img
              src={resolveAssetUrl('assets/icons/fluent/games/v1.webp')}
              alt=""
              aria-hidden="true"
              width={44}
              height={44}
              loading="eager"
              decoding="async"
              className="w-11 h-11 object-contain"
            />
          </div>
          <div className="space-y-1">
            <div className="font-display text-base font-bold" style={{ color: 'var(--color-text)' }}>
              V1 · Daily Run
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
              Đang chuẩn bị kho thẻ hôm nay...
            </div>
          </div>
        </Card>
      </div>
    );
  }

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

  const bandChipText = formatBandLabel(skillLevel);

  // 0. Màn bản đồ mở đầu run (V1-14)
  if (runState.phase === 'map_intro') {
    const newCount = runState.nodes.filter((n) => n.isNewCard).length;
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        <RunMap
          nodes={runState.nodes}
          currentIndex={0}
          stageIndex={0}
          stageSize={runState.stageSize}
          isBossPhase={false}
          bossHp={runState.bossHp}
          bossDefeated={false}
          examMode={isExam}
        />
        <Card padding="lg" skillAccent="vocab" className="text-center space-y-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Pill tone="vocab">{bandChipText}</Pill>
              {runState.recoveryMode && runState.recoveryReasonVi && (
                <span data-testid="v1-recovery-badge">
                  <Pill tone="info">{runState.recoveryReasonVi}</Pill>
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Lượt chạy hôm nay: {runState.nodes.length} thẻ
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
              {newCount > 0 ? `${newCount} thẻ mới · ` : ''}
              {runState.totalStages} chặng, cuối cùng là Boss 5 thẻ khó nhất.
            </p>
            {runState.newCardsThrottleReasonVi && (
              <p
                data-testid="v1-new-card-valve-notice"
                className="text-sm rounded-[var(--radius-sm)] border px-3 py-2 inline-block"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                {runState.newCardsThrottleReasonVi}
              </p>
            )}
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
              onClick={() => {
                if (!isExam) sfxEngine.unlock();
                playSfx('flip', { examMode: isExam });
                setRunState(startPlayingFromMap(runState));
              }}
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
    const durationSec = Math.max(1, Math.round((Date.now() - runState.startedAt) / 1000));

    return (
      <div className="max-w-3xl mx-auto p-3.5 sm:p-6 space-y-4">
        <RunMap
          nodes={runState.nodes}
          currentIndex={runState.nodes.length}
          stageIndex={Math.max(0, runState.totalStages - 1)}
          stageSize={runState.stageSize}
          isBossPhase={false}
          bossHp={runState.bossHp}
          bossDefeated={recap.bossDefeated}
          bossModifier={runState.bossModifier}
          compact
          examMode={isExam}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <Card padding="sm" className="text-center space-y-1">
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
              Tổng số thẻ
            </div>
            <div
              className="font-display text-2xl font-extrabold tabular-nums"
              style={{ color: 'var(--color-text)' }}
            >
              {recap.totalCards}
            </div>
          </Card>

          <Card padding="sm" className="text-center space-y-1">
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
              Đúng lượt đầu
            </div>
            <div
              className="font-display text-2xl font-extrabold tabular-nums"
              style={{ color: 'var(--color-correct)' }}
            >
              {recap.firstAttemptAccuracy}%
            </div>
          </Card>

          <Card padding="sm" className="text-center space-y-1">
            <div
              className="text-xs font-medium flex items-center justify-center gap-1"
              style={{ color: 'var(--color-text-dim)' }}
            >
              <Award className="w-3.5 h-3.5" style={{ color: 'var(--color-vocab)' }} />
              <span>Từ mới vững</span>
            </div>
            <div
              className="font-display text-2xl font-extrabold tabular-nums"
              style={{ color: 'var(--color-vocab)' }}
            >
              +{recap.matureOrMasteredCount}
            </div>
          </Card>

          <Card padding="sm" className="text-center space-y-1">
            <div
              className="text-xs font-medium flex items-center justify-center gap-1"
              style={{ color: 'var(--color-text-dim)' }}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-info)' }} />
              <span>Dự báo ngày mai</span>
            </div>
            <div
              className="text-sm sm:text-base font-extrabold tabular-nums pt-1"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}
            >
              Ngày mai: {recap.tomorrowDueForecast} thẻ
            </div>
          </Card>
        </div>

        {(() => {
          const bonusParts: string[] = [];
          if (recap.comboBonusXp > 0) {
            bonusParts.push(`${recap.comboBonusXp} XP chuỗi`);
          }
          if (recap.bossBonusXp > 0) {
            bonusParts.push(`${recap.bossBonusXp} XP Boss`);
          }
          if (recap.sessionCompletionXp > 0) {
            bonusParts.push(`${recap.sessionCompletionXp} XP phiên`);
          }
          const bonusLabel = bonusParts.length > 0 ? bonusParts.join(' · ') : undefined;
          const recapMascotSay = recap.bossDefeated
            ? `Đạt ${recap.firstAttemptAccuracy}% lượt đầu và hạ Boss +${recap.bossBonusXp} XP — giữ nhịp này cho ngày mai nhé!`
            : recap.firstAttemptAccuracy >= 80
            ? `Đạt ${recap.firstAttemptAccuracy}% lượt đầu (${recap.firstAttemptCorrect}/${Math.max(1, recap.totalCards)} thẻ) — nhịp nhớ rất chắc!`
            : `Hoàn thành ${recap.firstAttemptCorrect}/${Math.max(1, recap.totalCards)} thẻ lượt đầu — mấy từ vấp sẽ quay lại sớm để bạn nhớ hẳn.`;

          return (
            <RecapScreen
              scoreLabel={`${recap.firstAttemptCorrect}/${Math.max(1, recap.totalCards)}`}
              xpEarned={recap.totalXp}
              correctCount={recap.firstAttemptCorrect}
              baseXp={recap.baseXp}
              comboMultiplier={recap.effectiveComboMultiplier}
              bonusLabel={bonusLabel}
              mascotSay={recapMascotSay}
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
                      const mistakeCards = Object.values(runState.allCardsSnapshot).filter((c) =>
                        mistakeIds.has(c.itemId),
                      );
                      if (mistakeCards.length > 0) {
                        resetPersistence();
                        setRunState(
                          createV1Run({
                            cards: mistakeCards.slice(0, 5),
                            content: runState.content,
                            mode: 'extra_practice',
                            examMode: isExam,
                            skillLevel,
                            now: new Date(),
                          }),
                        );
                      }
                    }
                  : undefined
              }
              nextTask={nextTask}
              onNextTask={onNextTask}
              onGoToday={() => onExit(recap)}
              examMode={isExam}
              autoCelebrate={true}
            />
          );
        })()}
      </div>
    );
  }

  // 2. Màn Checkpoint giữa chặng — kèm Ngã ba run (Run Fork, 01-GAME §6.3) & Lexi trong data-mascot-ok
  if (runState.phase === 'checkpoint') {
    const completedCards = runState.currentIndex;
    const thornyPreview = previewThornyForkCards(runState);

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4" data-mascot-ok="true">
        <RunMap
          nodes={runState.nodes}
          currentIndex={runState.currentIndex}
          stageIndex={runState.currentStage}
          stageSize={runState.stageSize}
          isBossPhase={false}
          bossHp={runState.bossHp}
          bossDefeated={runState.bossDefeated}
          examMode={isExam}
        />

        <Card padding="lg" skillAccent="vocab" className="space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <ProgressRing
                value={completedCards}
                max={runState.nodes.length}
                size={64}
                strokeWidth={6}
                skill="vocab"
              />
              <div className="space-y-1">
                <Pill tone="vocab" icon={<BookmarkCheck className="w-3.5 h-3.5" />}>
                  Checkpoint · Xong Chặng {runState.currentStage}/{runState.totalStages}
                </Pill>
                <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  Đã hoàn thành {completedCards}/{runState.nodes.length} thẻ
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Tiến độ đã được lưu. Chọn nhánh cho chặng kế tiếp hoặc lưu và nghỉ.
                </p>
              </div>
            </div>
            {!isExam && (
              <Mascot
                state="vui"
                say={getCheckpointMascotLine(runState.maxCombo)}
                size={84}
                examMode={isExam}
              />
            )}
          </div>

          {/* Ngã ba run (Run Fork): Đường an toàn (Enter) vs Đường gai (→) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="v1-run-fork">
            <button
              type="button"
              data-testid="v1-fork-safe"
              onClick={() => handleChooseFork('safe')}
              className="text-left p-4 rounded-[var(--radius-md)] border cursor-pointer min-h-[44px] space-y-2 transition-colors"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-vocab) 10%, var(--color-surface-2))',
                borderColor: 'var(--color-vocab)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-bold text-sm" style={{ color: 'var(--color-vocab)' }}>
                  <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Đường an toàn</span>
                </span>
                <Pill tone="vocab">Enter</Pill>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                Đi tiếp Chặng {runState.currentStage + 1} theo đúng thứ tự thẻ đến hạn chuẩn.
              </p>
            </button>

            <button
              type="button"
              data-testid="v1-fork-thorny"
              onClick={() => handleChooseFork('thorny')}
              className="text-left p-4 rounded-[var(--radius-md)] border cursor-pointer min-h-[44px] space-y-2 transition-colors"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-writing) 12%, var(--color-surface-2))',
                borderColor: 'var(--color-writing)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-bold text-sm" style={{ color: 'var(--color-writing)' }}>
                  <Swords className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Đường gai (×1,5 XP)</span>
                </span>
                <Pill tone="writing">Phím →</Pill>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                Thử thách {thornyPreview.length} thẻ khó nhớ nhất còn lại để nhận thưởng ×1,5 XP.
              </p>
            </button>
          </div>

          <div className="flex items-center justify-center pt-1">
            <Button
              variant="secondary"
              onClick={() => setRunState(finishAtCheckpoint(runState))}
            >
              Lưu & Dừng tại đây
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 2b. Interstitial 1,2 s chuyển chặng / vào Boss (hiện RunMap + Lexi trong data-mascot-ok)
  if (interstitial) {
    return (
      <div
        className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4"
        data-mascot-ok="true"
        data-testid="v1-interstitial"
      >
        <RunMap
          nodes={runState.nodes}
          currentIndex={runState.currentIndex}
          stageIndex={runState.currentStage}
          stageSize={runState.stageSize}
          isBossPhase={runState.phase === 'boss'}
          bossHp={runState.bossHp}
          bossDefeated={runState.bossDefeated}
          bossModifier={runState.bossModifier}
          examMode={isExam}
        />
        <Card padding="lg" skillAccent={runState.phase === 'boss' ? 'speaking' : 'vocab'} className="space-y-4 text-center">
          <div className="flex justify-center">
            <Mascot
              state={interstitial.mascotState}
              say={interstitial.mascotSay}
              size={96}
              examMode={isExam}
            />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {interstitial.title}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
              {interstitial.subtitle}
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              variant="primary"
              skill={runState.phase === 'boss' ? 'speaking' : 'vocab'}
              onClick={() => setInterstitial(null)}
            >
              Vào ngay (Enter)
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Màn chơi chính (Playing / Boss Phase) — 0 Lexi (J10), HUD mobile <= 20px (B5 / SR-42)
  const isBossPhase = runState.phase === 'boss';
  const comboMult = getComboMultiplier(runState.combo);
  const stageNodes = isBossPhase
    ? runState.bossNodes
    : runState.nodes.filter((n) => n.stageIndex === runState.currentStage);
  const stagePosition = isBossPhase
    ? runState.bossIndex + 1
    : Math.max(1, stageNodes.findIndex((n) => n.nodeId === activeNode?.nodeId) + 1);
  const progressRatio = stageNodes.length > 0 ? stagePosition / stageNodes.length : 0;
  const bossModInfo =
    isBossPhase && runState.bossModifier ? BOSS_MODIFIER_INFO[runState.bossModifier] : null;
  const hintsDisabledByBoss = isBossPhase && runState.bossModifier === 'no_hints';

  const cardBorderColor =
    runState.feedback?.status === 'wrong'
      ? 'var(--color-wrong)'
      : runState.feedback?.status === 'correct'
      ? 'var(--color-correct)'
      : isBossPhase
      ? 'var(--color-wrong)'
      : undefined;

  return (
    <div
      ref={bossStageRef}
      className="min-h-[calc(100vh-3.5rem)] transition-colors duration-300"
      style={{
        backgroundColor: isBossPhase
          ? 'var(--color-boss-dim, color-mix(in srgb, var(--color-wrong) 10%, var(--color-bg)))'
          : 'var(--color-bg)',
      }}
    >
      {/* HUD Mobile siêu gọn (≤ 20 px) để thẻ câu hỏi [data-testid="v1-node"] bắt đầu tại top ≤ 80 px */}
      <div
        ref={mobileHudRef}
        data-testid="v1-mobile-hud"
        className="md:hidden h-5 px-3 flex items-center gap-2"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <ProgressSweepBar
          progress={progressRatio}
          sweepKey={progressSweepKey}
          isBoss={isBossPhase}
          allowSweep={fx.allowE1Slide && !isExam}
        />
        <span
          className="text-xs font-bold tabular-nums leading-none shrink-0"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
        >
          {stagePosition}/{stageNodes.length}
        </span>
        {isBossPhase ? (
          <span
            className="text-xs font-bold leading-none shrink-0"
            style={{ color: 'var(--color-wrong)' }}
          >
            BOSS {runState.bossHp}%
          </span>
        ) : (
          <span
            className="text-xs font-semibold leading-none shrink-0"
            style={{ color: 'var(--color-text-dim)' }}
          >
            {bandChipText}
          </span>
        )}
        {runState.combo >= 2 && !isExam && (
          <motion.span
            ref={mobileComboRef}
            key={`m-combo-${runState.combo}`}
            data-testid="v1-combo-badge"
            initial={fx.allowE1Slide ? { scale: 1.4 } : false}
            animate={{ scale: 1 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-xs font-bold tabular-nums leading-none shrink-0"
            style={{
              fontFamily: 'var(--font-mono)',
              color: comboMult > 1 ? 'var(--color-writing)' : 'var(--color-text)',
            }}
          >
            🔥{comboMult > 1 ? `×${comboMult}` : runState.combo}
          </motion.span>
        )}
        {brokenComboGhost && fx.allowE1Slide && !isExam && (
          <motion.span
            key={brokenComboGhost.id}
            aria-hidden="true"
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs font-bold leading-none shrink-0"
            style={{ color: 'var(--color-text-dim)' }}
          >
            ×{brokenComboGhost.count}
          </motion.span>
        )}
        {!isExam && (
          <span
            ref={mobileXpRef}
            data-testid="v1-xp-chip"
            className="text-xs font-bold tabular-nums leading-none shrink-0"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-correct)' }}
          >
            +{runState.totalXp} XP
          </span>
        )}
      </div>

      {/* Khung nội dung chính: mobile sát trên; desktop căn giữa 720px + RunMap cột phải 280px */}
      <div className="max-w-[1040px] mx-auto px-3 pt-0.5 pb-20 md:p-4 lg:p-6 md:space-y-4">
        {/* HUD Desktop (≥ 768 px) */}
        <div
          ref={desktopHudRef}
          className="hidden md:flex rounded-[var(--radius-md)] border px-4 py-2.5 flex-wrap items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: isBossPhase ? 'var(--color-wrong)' : 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-2">
            {isBossPhase ? (
              <Pill tone="wrong" icon={<Crown className="w-3.5 h-3.5" />}>
                Boss{bossModInfo ? ` · ${bossModInfo.labelVi}` : ''}
              </Pill>
            ) : (
              <Pill tone="vocab">
                Chặng {runState.currentStage + 1}/{runState.totalStages}
              </Pill>
            )}

            <Pill tone="neutral">{bandChipText}</Pill>

            {runState.chosenForkPath === 'thorny' && !isBossPhase && (
              <Pill tone="writing" icon={<Swords className="w-3.5 h-3.5" />}>
                Đường gai ×1,5 XP
              </Pill>
            )}

            {runState.isExtraPractice && <Pill tone="info">Ôn thêm (0 XP)</Pill>}

            {!isBossPhase && runState.currentIndex === 0 && !runState.feedback && (
              <button
                type="button"
                onClick={() =>
                  handleSwitchRunMode(runState.mode === 'busy' ? 'standard' : 'busy')
                }
                className="text-xs px-3 min-h-[44px] rounded-[var(--radius-sm)] border cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-dim)',
                }}
                title="Đổi quy mô Run"
              >
                {runState.mode === 'busy' ? 'Đổi sang Tiêu chuẩn' : 'Chế độ bận (10 thẻ)'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-1 max-w-xs">
            <ProgressSweepBar
              progress={progressRatio}
              sweepKey={progressSweepKey}
              isBoss={isBossPhase}
              allowSweep={fx.allowE1Slide && !isExam}
            />
            <span
              className="text-xs font-bold tabular-nums shrink-0"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            >
              {stagePosition}/{stageNodes.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {runState.combo >= 2 && !isExam && (
              <motion.span
                ref={desktopComboRef}
                key={`d-combo-${runState.combo}`}
                data-testid="v1-combo-badge-desktop"
                initial={fx.allowE1Slide ? { scale: 1.4 } : false}
                animate={{ scale: 1 }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor:
                    comboMult > 1
                      ? 'color-mix(in srgb, var(--color-writing) 18%, var(--color-surface-2))'
                      : 'var(--color-surface-2)',
                  color: comboMult > 1 ? 'var(--color-writing)' : 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{comboMult > 1 ? `×${comboMult} (${runState.combo})` : `${runState.combo}`}</span>
              </motion.span>
            )}
            {brokenComboGhost && fx.allowE1Slide && !isExam && (
              <motion.span
                key={`d-ghost-${brokenComboGhost.id}`}
                aria-hidden="true"
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: 12, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xs font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
              >
                ×{brokenComboGhost.count}
              </motion.span>
            )}
            {!isExam && (
              <span
                ref={desktopXpRef}
                className="text-sm font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-correct)' }}
              >
                +{runState.totalXp} XP
              </span>
            )}
          </div>
        </div>

        {/* Thân 2 cột trên desktop (câu hỏi max-w-[720px] căn giữa + RunMap cột phải 280px) */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          <div className="flex-1 min-w-0 max-w-[720px] w-full mx-auto space-y-3">
            {activeNode && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeNode.nodeId}
                  ref={questionCardRef}
                  data-testid="v1-node"
                  data-node-id={activeNode.nodeId}
                  data-item-id={activeNode.itemId}
                  data-face={activeNode.face}
                  variants={pickVariants(questionSlideVariants, !fx.allowE1Slide)}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Card
                    padding="md"
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
                    className="space-y-3 sm:space-y-4"
                    style={{
                      ...(cardBorderColor
                        ? {
                            borderTopColor: cardBorderColor,
                            borderRightColor: cardBorderColor,
                            borderBottomColor: cardBorderColor,
                          }
                        : {}),
                      ...(isBossPhase ? { boxShadow: 'var(--shadow-glow-wrong)' } : {}),
                    }}
                  >
                      {/* Hàng nhãn Face + tín hiệu sống nhẹ ngoài vùng chữ + Luật Boss / CEFR / POS */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <motion.span
                            aria-hidden="true"
                            className="inline-flex w-4 h-4 rounded-full items-center justify-center shrink-0"
                            style={{
                              backgroundColor: isBossPhase
                                ? 'color-mix(in srgb, var(--color-wrong) 22%, transparent)'
                                : 'color-mix(in srgb, var(--color-vocab) 22%, transparent)',
                              color: isBossPhase ? 'var(--color-wrong)' : 'var(--color-vocab)',
                            }}
                            animate={
                              fx.allowE2Living && !isExam
                                ? { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }
                                : undefined
                            }
                            transition={
                              fx.allowE2Living && !isExam
                                ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
                                : undefined
                            }
                          >
                            <Sparkles className="w-3 h-3" />
                          </motion.span>

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

                          {bossModInfo && (
                            <Pill tone="wrong" data-testid="v1-boss-modifier-pill">
                              Luật Boss: {bossModInfo.labelVi}
                            </Pill>
                          )}

                          {activeNode.isThornyNode && !isBossPhase && (
                            <Pill tone="writing">Đường gai ×1,5</Pill>
                          )}

                          {activeNode.isRetry && <Pill tone="partial">Làm lại</Pill>}
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

                      {/* Nội dung chi tiết của từng Face */}
                      {renderFaceContent({
                        activeNode,
                        typedAnswer,
                        setTypedAnswer,
                        selectedChoiceIdx,
                        onChoiceSelect: handleChoiceSelect,
                        onSubmit: () => handleSubmitAnswer(),
                        onIntroSeen: () => {
                          playSfx('flip', { examMode: isExam });
                          setRunState(submitIntroAction(runState, 'seen'));
                        },
                        onIntroKnowAlready: () => {
                          playSfx('tap', { examMode: isExam });
                          setRunState(submitIntroAction(runState, 'know_already'));
                        },
                        introFlipped,
                        onToggleIntroFlip: handleToggleIntroFlip,
                        audioPlaying,
                        audioFallbackNotice,
                        onPlayAudio: playCardAudio,
                        audioMissing,
                        hasFeedback: Boolean(runState.feedback),
                        feedbackStatus: runState.feedback?.status,
                        revealCorrectReady,
                        examMode: isExam,
                        fx,
                      })}

                      {/* Thanh hành động phụ + Nút chính (trên mobile dính đáy min-h-[52px]) */}
                      {activeNode.face !== 'intro' && !runState.feedback && (
                        <div
                          className="sticky bottom-0 z-10 md:static -mx-3.5 px-3.5 py-2.5 md:mx-0 md:px-0 md:pb-0 md:pt-3 border-t flex flex-wrap items-center justify-between gap-2"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {activeNode.prompt.face !== 'dict_full' && !hintsDisabledByBoss && (
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
                              className="min-h-[52px] md:min-h-[44px] flex-1 sm:flex-none"
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

            {/* Phản hồi tức thì sau mỗi thẻ (tách riêng để typewriter 18ms không re-render toàn màn) */}
            {runState.feedback && (
              <V1FeedbackSection
                feedback={runState.feedback}
                isBossPhase={isBossPhase}
                examMode={isExam}
                fx={fx}
                onNext={handleNextAfterFeedback}
              />
            )}
          </div>

          {/* Cột phải Desktop (≥ 1024px): RunMap thu gọn 280px */}
          <aside className="hidden lg:block w-[280px] shrink-0 sticky top-4">
            <RunMap
              nodes={runState.nodes}
              currentIndex={runState.currentIndex}
              stageIndex={runState.currentStage}
              stageSize={runState.stageSize}
              isBossPhase={isBossPhase}
              bossHp={runState.bossHp}
              bossDefeated={runState.bossDefeated}
              bossModifier={runState.bossModifier}
              compact
              examMode={isExam}
            />
          </aside>
        </div>
      </div>
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
      return 'Sửa lỗi gạch chân';
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
      return 'Ôn tập thông minh';
  }
}

interface RenderFaceContentParams {
  activeNode: NonNullable<ReturnType<typeof getActiveNode>>;
  typedAnswer: string;
  setTypedAnswer: (val: string) => void;
  selectedChoiceIdx: number | null;
  onChoiceSelect: (idx: number, origin?: { x: number; y: number }) => void;
  onSubmit: () => void;
  onIntroSeen: () => void;
  onIntroKnowAlready: () => void;
  introFlipped: boolean;
  onToggleIntroFlip: () => void;
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
  revealCorrectReady: boolean;
  examMode: boolean;
  fx: FxTierCapabilities;
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
    introFlipped,
    onToggleIntroFlip,
    audioPlaying,
    audioFallbackNotice,
    onPlayAudio,
    hasFeedback,
    feedbackStatus,
    revealCorrectReady,
    examMode,
    fx,
  } = params;

  const { prompt } = activeNode;

  const renderChoices = (choices: readonly string[], correctIndex: number) => (
    <div className="grid grid-cols-1 gap-2">
      {choices.map((choice, idx) => {
        const isEliminated = activeNode.eliminatedChoices.includes(idx);
        let choiceState: ChoiceState = 'idle';

        if (hasFeedback) {
          if (idx === correctIndex) {
            if (selectedChoiceIdx === idx) {
              choiceState = 'correct';
            } else if (feedbackStatus !== 'wrong' || revealCorrectReady) {
              choiceState = 'reveal-correct';
            }
          } else if (selectedChoiceIdx === idx) {
            choiceState = 'wrong';
          }
        } else if (selectedChoiceIdx === idx) {
          choiceState = 'selected';
        }

        return (
          <V1ChoiceItem
            key={idx}
            indexLabel={String(idx + 1)}
            label={isEliminated ? '— Đã loại bằng gợi ý —' : choice}
            state={choiceState}
            disabled={hasFeedback || isEliminated}
            examMode={examMode}
            fx={fx}
            onSelect={(origin) => onChoiceSelect(idx, origin)}
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

  // 1. Face: intro — Thẻ lật 3D 2 mặt tách biệt bằng LiveCard (SR-45 WebKit-safe)
  if (prompt.face === 'intro') {
    const backFace = (
      <div className="h-full flex flex-col justify-between gap-3 overflow-y-auto">
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {prompt.meaningVi}
              </div>
              {prompt.definitionEn && (
                <div className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                  {prompt.definitionEn}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="whitespace-nowrap shrink-0"
              leftIcon={<RotateCw className="w-4 h-4" />}
              onClick={onToggleIntroFlip}
            >
              Mặt trước
            </Button>
          </div>

          <blockquote
            className="pl-3 py-0.5 border-l-2 text-xs sm:text-sm italic leading-snug"
            style={{ borderColor: 'var(--color-vocab)', color: 'var(--color-text)' }}
          >
            “{prompt.exampleEn}”
          </blockquote>

          {prompt.collocations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {prompt.collocations.map((col, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1.5 rounded-[var(--radius-sm)] border text-xs font-semibold"
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
          )}

          {prompt.vnTrap && (
            <p className="text-xs leading-snug" style={{ color: 'var(--color-partial)' }}>
              💡 {prompt.vnTrap}
            </p>
          )}
        </div>
      </div>
    );

    return (
      <div className="space-y-3.5">
        <LiveCard
          skill="vocab"
          flipped={introFlipped}
          examMode={examMode}
          breathing={false}
          tilt={fx.allowE2Living}
          backContent={backFace}
          className="min-h-[348px]"
        >
          <div className="min-h-[308px] flex flex-col justify-between gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-extrabold" style={{ color: 'var(--color-text)' }}>
                  {prompt.headword}
                </h2>
                <div className="mt-1 text-base ipa" style={{ color: 'var(--color-text-dim)' }}>
                  {prompt.ipaUk}
                  {prompt.ipaUs && prompt.ipaUs !== prompt.ipaUk ? ` · US ${prompt.ipaUs}` : ''}
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
              className="p-3.5 rounded-[var(--radius-md)] border space-y-1"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                {prompt.meaningVi}
              </div>
              {prompt.definitionEn && (
                <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                  {prompt.definitionEn}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                {prompt.collocations.length > 0
                  ? `Lật mặt sau để xem ví dụ & ${prompt.collocations.length} collocation`
                  : 'Lật mặt sau để xem ví dụ ngữ cảnh'}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="whitespace-nowrap shrink-0"
                leftIcon={<RotateCw className="w-4 h-4" />}
                onClick={onToggleIntroFlip}
                data-testid="v1-intro-flip-btn"
              >
                Lật thẻ
              </Button>
            </div>
          </div>
        </LiveCard>

        <div
          className="sticky bottom-0 z-10 md:static -mx-3.5 px-3.5 py-2 md:mx-0 md:px-0 md:py-0 flex flex-wrap items-center justify-end gap-2.5"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
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
            className="min-h-[52px] md:min-h-[44px]"
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
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              className="font-display text-2xl sm:text-3xl font-extrabold leading-tight truncate"
              style={{ color: 'var(--color-text)' }}
            >
              {prompt.headword}
            </h2>
            <div className="mt-0.5 text-sm sm:text-base ipa" style={{ color: 'var(--color-text-dim)' }}>
              {prompt.ipaUk}
            </div>
          </div>

          <AudioButton
            playing={audioPlaying}
            onToggle={() => onPlayAudio(prompt.audioUrl, false)}
            label="Phát âm"
          />
        </div>

        <p className="text-xs sm:text-sm" style={{ color: 'var(--color-text-dim)' }}>
          Chọn nghĩa tiếng Việt chính xác nhất (phím 1–4):
        </p>

        {renderChoices(prompt.choices, prompt.correctIndex)}
      </div>
    );
  }

  // 3. Face: recall_meaning
  if (prompt.face === 'recall_meaning') {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-bold leading-snug" style={{ color: 'var(--color-text)' }}>
            “{prompt.meaningVi}”
          </div>
          {prompt.definitionEn && (
            <div className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
              {prompt.definitionEn}
            </div>
          )}
        </div>

        <div
          className="px-3 py-2 rounded-[var(--radius-sm)] border flex items-center justify-between gap-2.5"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <PlaceholderMaskDisplay mask={prompt.placeholderMask} size="lg" />
          <span
            className="text-xs font-semibold tabular-nums shrink-0"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
          >
            {prompt.letterCount} chữ cái
          </span>
        </div>

        {renderTypedInput(prompt.placeholderMask, 'Gõ từ tiếng Anh')}
      </div>
    );
  }

  // 4. Face: recall_cloze
  if (prompt.face === 'recall_cloze') {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div
          className="p-3.5 sm:p-4 rounded-[var(--radius-md)] border space-y-1.5"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <p className="reading-prose text-base sm:text-lg font-medium" style={{ color: 'var(--color-text)' }}>
            {prompt.clozeSentenceEn}
          </p>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--color-text-dim)' }}>
            Nghĩa gốc: <strong>{prompt.meaningVi}</strong>
            {prompt.exampleVi ? ` — (${prompt.exampleVi})` : ''}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--color-text-dim)' }}>
          <PlaceholderMaskDisplay mask={prompt.placeholderMask} size="sm" prefix="Gợi ý khung:" />
          <span className="shrink-0">{prompt.letterCount} chữ cái</span>
        </div>

        {renderTypedInput(prompt.placeholderMask, 'Điền từ vào chỗ trống')}
      </div>
    );
  }

  // 5. Face: listen_spell
  if (prompt.face === 'listen_spell') {
    const remainingPlays = Math.max(0, prompt.maxPlays - activeNode.audioPlaysUsed);

    return (
      <div className="space-y-3 sm:space-y-4">
        <div
          className="p-4 rounded-[var(--radius-md)] border flex flex-col sm:flex-row items-center justify-between gap-3"
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
              Còn {remainingPlays}/{prompt.maxPlays} lượt nghe
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

        <div className="flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--color-text-dim)' }}>
          <PlaceholderMaskDisplay mask={prompt.placeholderMask} size="sm" prefix="Khung từ:" />
          <span className="shrink-0">{prompt.letterCount} chữ cái</span>
        </div>

        {renderTypedInput(prompt.placeholderMask, 'Gõ chính tả từ vừa nghe')}
      </div>
    );
  }

  // 6. Face: col_gap
  if (prompt.face === 'col_gap') {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div
          className="p-3.5 sm:p-4 rounded-[var(--radius-md)] border space-y-1.5"
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
            className="text-xl sm:text-2xl font-extrabold"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {prompt.displayGap}
          </div>

          <div className="text-sm sm:text-base font-medium" style={{ color: 'var(--color-text-dim)' }}>
            Nghĩa: “{prompt.meaningVi}”
          </div>
        </div>

        {renderTypedInput(prompt.placeholderMask, 'Điền từ còn thiếu trong cụm collocation')}
      </div>
    );
  }

  // 7. Face: para_match
  if (prompt.face === 'para_match') {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div
          className="p-3.5 sm:p-4 rounded-[var(--radius-md)] border space-y-1.5"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
            Cụm từ gốc trong câu hỏi
          </div>
          <div className="text-lg sm:text-xl font-bold" style={{ color: 'var(--color-reading)' }}>
            “{prompt.questionPhrase}”
          </div>
          <p className="text-xs italic reading-prose" style={{ color: 'var(--color-text-dim)' }}>
            Ngữ cảnh bài đọc: {prompt.contextEn}
          </p>
        </div>

        <p className="text-xs sm:text-sm" style={{ color: 'var(--color-text-dim)' }}>
          Chọn cụm Paraphrase đồng nghĩa trong bài (phím 1–4):
        </p>

        {renderChoices(prompt.choices, prompt.correctIndex)}
      </div>
    );
  }

  // 8. Face: tfng_retry / head_retry
  if (prompt.face === 'tfng_retry' || prompt.face === 'head_retry') {
    const quote = hasFeedback ? prompt.evidenceQuote : undefined;
    return (
      <div className="space-y-3 sm:space-y-4">
        {prompt.face === 'tfng_retry' ? (
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
              Phát biểu cần kiểm tra với đoạn {prompt.paragraphLabel}
            </div>
            <p className="text-base sm:text-lg font-bold leading-snug" style={{ color: 'var(--color-reading)' }}>
              “{prompt.statement}”
            </p>
          </div>
        ) : (
          <p className="text-sm sm:text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Chọn tiêu đề khớp ý chính của đoạn {prompt.paragraphLabel} (phím 1–4):
          </p>
        )}

        {renderChoices(prompt.choices, prompt.correctIndex)}

        <div
          className="p-3.5 rounded-[var(--radius-md)] border space-y-1.5 max-h-[32vh] overflow-y-auto"
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
          <p className="reading-prose text-sm sm:text-base leading-relaxed" style={{ color: 'var(--color-text)' }}>
            <QuoteHighlight text={prompt.paragraphText} quote={quote} />
          </p>
        </div>
      </div>
    );
  }

  // 9. Face: ltrap_replay
  if (prompt.face === 'ltrap_replay') {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div
          className="p-4 rounded-[var(--radius-md)] border flex flex-col sm:flex-row items-center justify-between gap-3"
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

        <div className="flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--color-text-dim)' }}>
          <PlaceholderMaskDisplay mask={prompt.placeholderMask} size="sm" prefix="Khung:" />
          <span className="shrink-0">{prompt.letterCount} chữ cái</span>
        </div>
        {renderTypedInput(prompt.placeholderMask, 'Gõ đáp án nghe được')}
      </div>
    );
  }

  // 10. Face: dict_full
  if (prompt.face === 'dict_full') {
    const remainingPlays = Math.max(0, prompt.maxPlays - activeNode.audioPlaysUsed);
    return (
      <div className="space-y-3 sm:space-y-4">
        <div
          className="p-4 rounded-[var(--radius-md)] border flex flex-col sm:flex-row items-center justify-between gap-3"
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
            label={
              remainingPlays > 0
                ? `Phát câu (${remainingPlays}/${prompt.maxPlays})`
                : 'Đã hết lượt nghe'
            }
          />
        </div>
        {renderTypedInput('Gõ lại câu bạn nghe được', 'Chép lại cả câu vừa nghe')}
      </div>
    );
  }

  // 11. Face: err_user
  if (prompt.face === 'err_user') {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div
          className="p-3.5 sm:p-4 rounded-[var(--radius-md)] border space-y-2"
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
          <p className="reading-prose text-base sm:text-lg leading-relaxed font-medium" style={{ color: 'var(--color-wrong)' }}>
            {prompt.front}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--color-text-dim)' }}>
          <PlaceholderMaskDisplay mask={prompt.placeholderMask} size="sm" prefix="Khung sửa đúng:" />
          <span className="shrink-0">{prompt.letterCount} chữ cái</span>
        </div>
        {renderTypedInput(prompt.placeholderMask, 'Gõ bản sửa đúng')}
      </div>
    );
  }

  // 12. Face: err_fix
  if (prompt.face !== 'err_fix') return null;
  return (
    <div className="space-y-3 sm:space-y-4">
      <div
        className="p-3.5 sm:p-4 rounded-[var(--radius-md)] border space-y-2"
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

        <p className="reading-prose text-base sm:text-lg leading-relaxed" style={{ color: 'var(--color-text)' }}>
          <span>{prompt.prefixText}</span>
          <span
            className="font-bold underline decoration-2 px-1 rounded"
            style={{
              textDecorationColor: 'var(--color-wrong)',
              backgroundColor: 'color-mix(in srgb, var(--color-wrong) 18%, transparent)',
              color: 'var(--color-wrong)',
            }}
          >
            {prompt.errorSpanText}
          </span>
          <span>{prompt.suffixText}</span>
        </p>
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
        <span style={{ fontFamily: 'var(--font-mono)' }}>Khung sửa đúng: {prompt.placeholderMask}</span>
        <span>{prompt.letterCount} chữ cái</span>
      </div>

      {renderTypedInput(prompt.placeholderMask, 'Gõ phần sửa đúng')}
    </div>
  );
}

export default V1DailyRun;
