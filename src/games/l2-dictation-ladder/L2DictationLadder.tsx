import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Headphones,
  Info,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  createIdleTrackState,
  createTrackPlayer,
  type TrackPlayerController,
  type TrackPlayerState,
} from '../../core/audio/trackPlayer';
import { playSfx, sfxEngine } from '../../core/audio/sfx';
import type { DictationItem } from '../../core/content/schemas';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import { Button, Card, Pill, RecapScreen, Skeleton, type RecapMistakeItem } from '../../design/components';
import { dur, ease, feedbackSlideVariants, pickVariants } from '../../design/motion';
import type { GameProps } from '../registry';
import { loadDictationPool } from './dictationLoader';
import {
  ALL_DICTATION_ERROR_TYPES,
  DICTATION_ERROR_LABELS_VI,
  L2_MAX_LEVEL,
  L2_MIN_LEVEL,
  L2_PERFECT_BONUS_XP,
  advanceToNextSentence,
  buildL2SessionSavePayload,
  canPlayNormal,
  canPlaySlow,
  clampL2Level,
  createL2Session,
  getMaxPlaysForLevel,
  recordNormalPlay,
  recordSlowPlay,
  selectL2SessionItems,
  setDictationInput,
  startL2Session,
  submitCurrentSentence,
  summarizeL2Session,
  type DictationErrorType,
  type L2DiffToken,
  type L2SessionState,
} from './engine';

const ACCENT_LABELS: Record<'uk' | 'us' | 'au', string> = {
  uk: 'Giọng Anh (UK)',
  us: 'Giọng Mỹ (US)',
  au: 'Giọng Úc (AU)',
};

const LEVEL_WPM_HINTS: Record<number, string> = {
  1: '110–120 WPM · Câu ngắn',
  2: '120–130 WPM · Số & đuôi -s',
  3: '130–145 WPM · Contraction',
  4: '145–155 WPM · Nối âm & âm yếu',
  5: '155–165 WPM · Học thuật',
  6: '165–175 WPM · Đa giọng',
  7: '175–185 WPM · 1 lượt phát',
  8: '185–195 WPM · Câu phức dài',
  9: '195–205 WPM · Tốc độ thi thật',
  10: '205+ WPM · Tự sửa & tốc độ cao',
};

const SILENT_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

function estimateDurationSec(item: DictationItem): number {
  const words = item.text.trim().split(/\s+/).filter(Boolean).length;
  const wpm = Math.max(90, item.wpm || 140);
  return Math.max(2.5, Math.round(((words / wpm) * 60 + 0.8) * 10) / 10);
}

interface LadderRailProps {
  currentLevel: number;
  recommendedLevel?: number;
  interactive?: boolean;
  onSelectLevel?: (level: number) => void;
}

const LadderRail: React.FC<LadderRailProps> = ({
  currentLevel,
  recommendedLevel,
  interactive = false,
  onSelectLevel,
}) => {
  const levels = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  return (
    <Card padding="md" className="space-y-3" data-testid="l2-ladder-rail">
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--color-listening)' }}
        >
          Thang 10 bậc
        </span>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
        >
          Bậc {currentLevel}/{L2_MAX_LEVEL}
        </span>
      </div>

      <div className="relative space-y-1.5">
        {levels.map((lvl) => {
          const isCurrent = lvl === currentLevel;
          const isPassed = lvl < currentLevel;
          const isRecommended = recommendedLevel !== undefined && lvl === recommendedLevel && lvl !== currentLevel;
          const maxK = getMaxPlaysForLevel(lvl);

          const rowContent = (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 border-2 transition-transform"
                  style={{
                    backgroundColor: isCurrent
                      ? 'var(--color-listening)'
                      : isRecommended
                        ? 'var(--color-correct)'
                        : isPassed
                          ? 'color-mix(in srgb, var(--color-listening) 45%, var(--color-surface))'
                          : 'var(--color-surface)',
                    borderColor: isCurrent
                      ? 'var(--color-listening)'
                      : isRecommended
                        ? 'var(--color-correct)'
                        : 'var(--color-border)',
                    transform: isCurrent ? 'scale(1.15)' : undefined,
                  }}
                />
                <span
                  className="text-xs font-bold tabular-nums shrink-0"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: isCurrent
                      ? 'var(--color-listening)'
                      : isRecommended
                        ? 'var(--color-correct)'
                        : 'var(--color-text)',
                  }}
                >
                  Lv {lvl}
                </span>
                <span
                  className="text-[11px] truncate"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  {LEVEL_WPM_HINTS[lvl]}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isCurrent && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-listening) 18%, var(--color-surface))',
                      color: 'var(--color-listening)',
                    }}
                  >
                    Hiện tại
                  </span>
                )}
                {isRecommended && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-correct) 18%, var(--color-surface))',
                      color: 'var(--color-correct)',
                    }}
                  >
                    Lên bậc!
                  </span>
                )}
                <span
                  className="text-[11px] tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                >
                  {maxK}×
                </span>
              </div>
            </>
          );

          const baseStyle: React.CSSProperties = {
            backgroundColor: isCurrent
              ? 'color-mix(in srgb, var(--color-listening) 12%, var(--color-surface-2))'
              : isRecommended
                ? 'color-mix(in srgb, var(--color-correct) 10%, var(--color-surface-2))'
                : 'var(--color-surface-2)',
            borderColor: isCurrent
              ? 'var(--color-listening)'
              : isRecommended
                ? 'var(--color-correct)'
                : 'var(--color-border)',
          };

          if (interactive && onSelectLevel) {
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onSelectLevel(lvl)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] border text-left transition-colors cursor-pointer"
                style={baseStyle}
                data-testid={`l2-level-rung-${lvl}`}
                aria-pressed={isCurrent}
              >
                {rowContent}
              </button>
            );
          }

          return (
            <div
              key={lvl}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] border"
              style={baseStyle}
            >
              {rowContent}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

interface DiffTokenViewProps {
  token: L2DiffToken;
  index: number;
  reducedMotion: boolean;
}

const DiffTokenView: React.FC<DiffTokenViewProps> = ({ token, index, reducedMotion }) => {
  const delay = reducedMotion ? 0 : Math.min(index * 0.025, 0.6);

  return (
    <motion.span
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.fast, ease: ease.out, delay }}
      className="inline-flex items-baseline gap-1 mr-1.5 mb-1.5"
      data-testid={`l2-diff-token-${token.status}`}
    >
      {token.status === 'correct' && (
        <span
          className="px-1.5 py-0.5 rounded-[var(--radius-sm)] font-medium"
          style={{
            color: 'var(--color-correct)',
            backgroundColor: 'color-mix(in srgb, var(--color-correct) 12%, transparent)',
          }}
        >
          {token.expected}
        </span>
      )}

      {(token.status === 'substitution' || token.status === 'ending_error') && (
        <span
          className="inline-flex items-baseline gap-1 px-1.5 py-0.5 rounded-[var(--radius-sm)] border"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-wrong) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-wrong) 35%, var(--color-border))',
          }}
        >
          <span className="line-through" style={{ color: 'var(--color-wrong)' }}>
            {token.actual}
          </span>
          <strong style={{ color: 'var(--color-correct)' }}>{token.expected}</strong>
        </span>
      )}

      {token.status === 'missing' && (
        <span
          className="inline-flex items-baseline gap-1 px-1.5 py-0.5 rounded-[var(--radius-sm)] border-b-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-wrong) 10%, transparent)',
            borderColor: 'var(--color-wrong)',
          }}
        >
          <span aria-hidden="true" style={{ color: 'var(--color-wrong)' }}>
            ▢
          </span>
          <strong style={{ color: 'var(--color-wrong)' }}>{token.expected}</strong>
        </span>
      )}

      {token.status === 'extra' && (
        <span
          className="px-1.5 py-0.5 rounded-[var(--radius-sm)] line-through"
          style={{
            color: 'var(--color-text-dim)',
            backgroundColor: 'var(--color-surface-2)',
          }}
        >
          {token.actual}
        </span>
      )}
    </motion.span>
  );
};

export const L2DictationLadder: React.FC<GameProps> = ({ level: initialLevel, onExit }) => {
  const prefersReduced = Boolean(useReducedMotion());

  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<DictationItem[]>([]);
  const [poolSource, setPoolSource] = useState<'data' | 'fixture'>('fixture');
  const [selectedLevel, setSelectedLevel] = useState<number>(() =>
    clampL2Level(initialLevel || L2_MIN_LEVEL),
  );
  const [session, setSession] = useState<L2SessionState | null>(null);
  const [promotedToLevel, setPromotedToLevel] = useState<number | null>(null);
  const [savingSession, setSavingSession] = useState(false);
  const savedOnceRef = useRef(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const playerRef = useRef<TrackPlayerController | null>(null);
  const [trackState, setTrackState] = useState<TrackPlayerState>(createIdleTrackState);

  // Initialize TrackPlayerController (0 speechSynthesis)
  useEffect(() => {
    const controller = createTrackPlayer({ initialRate: 1, initialVolume: 1 });
    playerRef.current = controller;
    const unsubState = controller.onStateChange((st) => setTrackState(st));
    const unsubTime = controller.onTime((currentTime, duration) => {
      setTrackState((prev) => ({ ...prev, currentTime, duration }));
    });
    return () => {
      unsubState();
      unsubTime();
      controller.destroy();
      playerRef.current = null;
      sfxEngine.setBlocked(false);
    };
  }, []);

  // Block SFX while audio is playing (L2-DICTATION-LADDER.md §10)
  useEffect(() => {
    sfxEngine.setBlocked(trackState.status === 'playing');
    return () => {
      sfxEngine.setBlocked(false);
    };
  }, [trackState.status]);

  // Load dictation pool + saved profile level on mount
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [loaded, profile] = await Promise.all([
          loadDictationPool(),
          profileRepo.getOrCreate().catch(() => null),
        ]);
        if (!alive) return;
        setPool(loaded.items);
        setPoolSource(loaded.source);
        const startLvl = clampL2Level(
          initialLevel || profile?.skillLevels?.l2 || L2_MIN_LEVEL,
        );
        setSelectedLevel(startLvl);
        const items = selectL2SessionItems(loaded.items, startLvl);
        setSession(createL2Session(items, startLvl));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialLevel]);

  const currentItem: DictationItem | null = useMemo(() => {
    if (!session) return null;
    return session.items[session.currentIndex] ?? null;
  }, [session]);

  // Load current sentence audio whenever currentItem or phase changes to playing
  useEffect(() => {
    const controller = playerRef.current;
    if (!controller || !session || !currentItem) return;
    if (session.phase !== 'playing' && session.phase !== 'graded') {
      controller.pause();
      return;
    }

    const durationHintSec = estimateDurationSec(currentItem);
    if (poolSource === 'data') {
      controller.load(currentItem.audio, { durationHintSec });
      const nextItem = session.items[session.currentIndex + 1];
      if (nextItem) {
        controller.preload(nextItem.audio);
      }
    } else {
      // Fixture fallback: never trigger a 404 network error in console
      controller.load(SILENT_DATA_URI, { durationHintSec });
      controller.markAudioMissing(
        'Audio câu mẫu chưa render trên đĩa — đang chạy chế độ mô phỏng theo nhịp WPM.',
      );
    }
  }, [currentItem, poolSource, session?.currentIndex, session?.phase === 'intro' || session?.phase === 'recap']);

  const handleSelectLevel = useCallback(
    (lvl: number) => {
      const clamped = clampL2Level(lvl);
      setSelectedLevel(clamped);
      const items = selectL2SessionItems(pool, clamped);
      setSession(createL2Session(items, clamped));
      setPromotedToLevel(null);
      savedOnceRef.current = false;
    },
    [pool],
  );

  const handleStartSession = useCallback(() => {
    if (!session) return;
    savedOnceRef.current = false;
    setPromotedToLevel(null);
    setSession((prev) => (prev ? startL2Session(prev) : prev));
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  }, [session]);

  const handlePlayNormal = useCallback(() => {
    const controller = playerRef.current;
    if (!controller || !session) return;
    if (trackState.status === 'playing') {
      controller.pause();
      return;
    }
    if (!canPlayNormal(session)) return;
    setSession((prev) => (prev ? recordNormalPlay(prev) : prev));
    controller.setRate(1);
    controller.seek(0);
    void controller.play();
  }, [session, trackState.status]);

  const handlePlaySlowBeforeGrade = useCallback(() => {
    const controller = playerRef.current;
    if (!controller || !session) return;
    if (!canPlaySlow(session)) return;
    setSession((prev) => (prev ? recordSlowPlay(prev) : prev));
    controller.setRate(0.75);
    controller.seek(0);
    void controller.play();
  }, [session]);

  const handleReplaySlowAfterGrade = useCallback(() => {
    const controller = playerRef.current;
    if (!controller) return;
    if (trackState.status === 'playing') {
      controller.pause();
      return;
    }
    controller.setRate(0.75);
    controller.seek(0);
    void controller.play();
  }, [trackState.status]);

  const handleSubmit = useCallback(() => {
    const controller = playerRef.current;
    if (controller && trackState.status === 'playing') {
      controller.pause();
    }
    setSession((prev) => {
      if (!prev || prev.phase !== 'playing') return prev;
      const next = submitCurrentSentence(prev);
      if (next.lastGraded) {
        if (next.lastGraded.effectiveScore >= 0.9) {
          playSfx('correct');
        } else if (next.lastGraded.effectiveScore >= 0.7) {
          playSfx('tap');
        } else {
          playSfx('wrong');
        }
      }
      return next;
    });
  }, [trackState.status]);

  const handleAdvance = useCallback(() => {
    const controller = playerRef.current;
    if (controller) controller.pause();
    setSession((prev) => (prev ? advanceToNextSentence(prev) : prev));
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  }, []);

  // Persist session once when entering recap
  useEffect(() => {
    if (!session || session.phase !== 'recap' || savedOnceRef.current) return;
    savedOnceRef.current = true;
    setSavingSession(true);

    void (async () => {
      try {
        const allCards = await cardRepo.getAll();
        const existingMap = new Map(allCards.map((c) => [c.id, c]));
        const payload = buildL2SessionSavePayload(session, existingMap, new Date());
        await attemptRepo.saveSession(payload);
        playSfx('sessionDone');
      } catch {
        // Non-fatal in private browsing / mock storage
      } finally {
        setSavingSession(false);
      }
    })();
  }, [session]);

  const handleAcceptPromotion = useCallback(
    async (nextLevel: number) => {
      const clamped = clampL2Level(nextLevel);
      try {
        const profile = await profileRepo.getOrCreate();
        await profileRepo.update({
          skillLevels: {
            ...profile.skillLevels,
            l2: clamped,
          },
        });
      } catch {
        // Ignore storage errors
      }
      setPromotedToLevel(clamped);
      setSelectedLevel(clamped);
    },
    [],
  );

  const handleRetryMistakes = useCallback(() => {
    if (!session) return;
    const mistakeIds = new Set(
      session.results.filter((r) => r.effectiveScore < 0.9).map((r) => r.itemId),
    );
    const retryItems = session.items.filter((it) => mistakeIds.has(it.id));
    if (retryItems.length === 0) return;
    savedOnceRef.current = false;
    setPromotedToLevel(null);
    setSession(startL2Session(createL2Session(retryItems, session.level)));
  }, [session]);

  // Global keyboard shortcuts: R to replay (when input not focused), Enter to advance on graded screen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!session) return;
      const target = e.target as HTMLElement | null;
      const isTypingField =
        target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT';

      if (session.phase === 'playing' && !isTypingField && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        handlePlayNormal();
      } else if (session.phase === 'graded' && e.key === 'Enter' && !isTypingField) {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleAdvance, handlePlayNormal, session]);

  if (loading || !session) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-8" data-testid="l2-loading">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton lines={5} />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // INTRO SCREEN
  // -------------------------------------------------------------------------
  if (session.phase === 'intro') {
    const maxK = getMaxPlaysForLevel(selectedLevel);
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-10" data-testid="l2-dictation-ladder">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => onExit()}
            >
              Thoát
            </Button>
            <Pill tone="listening" icon={<Headphones className="w-3.5 h-3.5" />}>
              L2 · Dictation Ladder
            </Pill>
          </div>
          <Pill tone="neutral">
            {poolSource === 'data' ? `${pool.length} câu chính thức` : `${pool.length} câu mẫu (fallback)`}
          </Pill>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card skillAccent="listening" padding="lg" className="lg:col-span-2 space-y-5">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                Dictation Ladder · Chép chính tả leo thang
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                Luyện nghe từ dưới lên: nhận diện âm cuối (-s/-ed/-t/-d), âm yếu (a/the/to/of),
                nối âm, số và chính tả học thuật qua 10 bậc tốc độ tăng dần.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                className="p-3.5 rounded-[var(--radius-md)] border space-y-1"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Bậc đang chọn
                </div>
                <div
                  className="text-xl font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-listening)' }}
                >
                  Level {selectedLevel}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
                  {LEVEL_WPM_HINTS[selectedLevel]}
                </div>
              </div>

              <div
                className="p-3.5 rounded-[var(--radius-md)] border space-y-1"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Số lượt phát tối đa
                </div>
                <div
                  className="text-xl font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
                >
                  {maxK} lần
                </div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
                  +1 lần 0.75× (−30% điểm)
                </div>
              </div>

              <div
                className="p-3.5 rounded-[var(--radius-md)] border space-y-1"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Điều kiện lên bậc
                </div>
                <div
                  className="text-xl font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-correct)' }}
                >
                  ≥ 8/10 câu
                </div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
                  Mỗi câu đạt ≥ 90%
                </div>
              </div>
            </div>

            <div
              className="p-3.5 rounded-[var(--radius-md)] border text-xs space-y-1"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-dim)',
              }}
            >
              <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                Luật chấm thông minh (Levenshtein mức từ):
              </div>
              <p>
                • Bỏ qua dấu câu & viết hoa · Chấp nhận viết tắt (don&apos;t = do not), số chữ/số (fifteen = 15), từ ghép có/không gạch nối (well-known = well known), chính tả Anh/Mỹ.
              </p>
              <p>
                • Câu 100% thưởng <strong>+{L2_PERFECT_BONUS_XP} XP</strong> · Câu &lt; 70% tự động lưu vào SRS ôn lại.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                Phiên gồm {session.items.length} câu · Phím tắt: <kbd className="font-mono">R</kbd> phát lại, <kbd className="font-mono">Enter</kbd> nộp
              </span>
              <Button
                variant="primary"
                skill="listening"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={handleStartSession}
                data-testid="l2-start-btn"
              >
                Bắt đầu phiên {session.items.length} câu
              </Button>
            </div>
          </Card>

          <LadderRail
            currentLevel={selectedLevel}
            interactive
            onSelectLevel={handleSelectLevel}
          />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RECAP SCREEN
  // -------------------------------------------------------------------------
  if (session.phase === 'recap') {
    const summary = summarizeL2Session(session);
    const durationSec = Math.max(
      1,
      Math.round(((session.endedAt ?? Date.now()) - session.startedAt) / 1000),
    );
    const mistakes: RecapMistakeItem[] = session.results
      .filter((r) => r.effectiveScore < 0.9)
      .map((r, idx) => ({
        id: `${r.itemId}-${idx}`,
        prompt: `Đạt ${Math.round(r.effectiveScore * 100)}%${r.slowPlayUsed ? ' (đã dùng 0.75×)' : ''}`,
        userAnswer: r.userInput.trim() || '(bỏ trống)',
        correctAnswer: r.referenceText,
        note: r.focusTips[0]?.tipVi,
      }));

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-10" data-testid="l2-recap">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pill tone="listening" icon={<Headphones className="w-3.5 h-3.5" />}>
            L2 · Dictation Ladder · Tổng kết Level {session.level}
          </Pill>
          {savingSession && (
            <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Đang lưu tiến độ...
            </span>
          )}
        </div>

        {/* Promotion banner */}
        {summary.shouldRecommendLevelUp && (
          <Card
            padding="md"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-correct) 10%, var(--color-surface))',
              borderColor: 'var(--color-correct)',
            }}
            data-testid="l2-promotion-banner"
          >
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 shrink-0 mt-0.5" style={{ color: 'var(--color-correct)' }} />
              <div className="space-y-0.5">
                <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  Đủ điều kiện leo lên Level {summary.nextRecommendedLevel}!
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Bạn đạt ≥ 90% ở {summary.highScoreCount}/{summary.completedCount} câu.
                  {promotedToLevel === summary.nextRecommendedLevel
                    ? ` Đã cập nhật level L2 lên Level ${promotedToLevel}.`
                    : ' Nhấn nút bên phải để lên bậc ngay.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {promotedToLevel === summary.nextRecommendedLevel ? (
                <Button
                  variant="primary"
                  skill="listening"
                  size="sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => {
                    const items = selectL2SessionItems(pool, summary.nextRecommendedLevel);
                    savedOnceRef.current = false;
                    setSession(startL2Session(createL2Session(items, summary.nextRecommendedLevel)));
                  }}
                >
                  Chơi ngay Level {summary.nextRecommendedLevel}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  skill="listening"
                  size="sm"
                  rightIcon={<ArrowUpRight className="w-4 h-4" />}
                  onClick={() => void handleAcceptPromotion(summary.nextRecommendedLevel)}
                  data-testid="l2-accept-promotion-btn"
                >
                  Lên Level {summary.nextRecommendedLevel}
                </Button>
              )}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-5">
            <RecapScreen
              scoreLabel={`${summary.highScoreCount}/${summary.completedCount}`}
              xpEarned={summary.totalXp}
              winStatement={summary.winStatement}
              accuracyPercent={summary.averageScorePct}
              durationSec={durationSec}
              mistakes={mistakes}
              onRetryMistakes={mistakes.length > 0 ? handleRetryMistakes : undefined}
              onGoToday={() => onExit({ gameId: 'l2', summary })}
              className="max-w-none"
            />

            {/* 5-error-type breakdown */}
            <Card padding="lg" className="space-y-4" data-testid="l2-error-stats">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                  Thống kê 5 loại lỗi chính tả &amp; nghe
                </h2>
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                >
                  Tổng: {summary.totalErrors} lỗi
                </span>
              </div>

              <div className="space-y-2.5">
                {ALL_DICTATION_ERROR_TYPES.map((errType: DictationErrorType) => {
                  const count = summary.errorCounts[errType];
                  const pct = summary.errorPercents[errType];
                  return (
                    <div key={errType} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {DICTATION_ERROR_LABELS_VI[errType]}
                        </span>
                        <span
                          className="tabular-nums font-semibold"
                          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                        >
                          {count} lỗi ({pct}%)
                        </span>
                      </div>
                      <div
                        className="h-2 w-full rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--color-surface-2)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              count > 0 ? 'var(--color-listening)' : 'transparent',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {(summary.dictFullCardCount > 0 || summary.listenSpellCandidates.length > 0) && (
                <div
                  className="p-3 rounded-[var(--radius-md)] border text-xs space-y-1"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-dim)',
                  }}
                >
                  {summary.dictFullCardCount > 0 && (
                    <div>
                      • Đã đưa <strong>{summary.dictFullCardCount} câu</strong> (&lt; 70%) vào lịch ôn FSRS (<code className="font-mono">dict_full</code>).
                    </div>
                  )}
                  {summary.listenSpellCandidates.length > 0 && (
                    <div>
                      • Tạo thẻ chính tả <code className="font-mono">listen_spell</code> cho V1:{' '}
                      <strong>{summary.listenSpellCandidates.join(', ')}</strong>.
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          <LadderRail
            currentLevel={promotedToLevel ?? session.level}
            recommendedLevel={
              summary.shouldRecommendLevelUp ? summary.nextRecommendedLevel : undefined
            }
          />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PLAYING & GRADED SCREENS
  // -------------------------------------------------------------------------
  const playsRemaining = Math.max(0, session.maxPlays - session.playsUsed);
  const isPlaying = trackState.status === 'playing';
  const normalDisabled = !isPlaying && !canPlayNormal(session);
  const slowDisabled = !canPlaySlow(session);
  const graded = session.lastGraded;
  const feedbackMotion = pickVariants(feedbackSlideVariants, prefersReduced);

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10" data-testid="l2-dictation-ladder">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => {
              playerRef.current?.pause();
              onExit();
            }}
          >
            Thoát
          </Button>
          <Pill tone="listening" icon={<Headphones className="w-3.5 h-3.5" />}>
            Dictation Ladder · Level {session.level}
          </Pill>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className="text-xs font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            data-testid="l2-progress-counter"
          >
            {session.currentIndex + 1}/{session.items.length}
          </span>

          {/* Remaining play dots ●●○ */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
            }}
            aria-label={`Còn ${playsRemaining} trên ${session.maxPlays} lượt phát`}
            data-testid="l2-play-dots"
          >
            <span style={{ color: 'var(--color-text-dim)' }}>Lượt phát:</span>
            <span className="inline-flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: session.maxPlays }).map((_, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border"
                  style={{
                    backgroundColor:
                      i < playsRemaining ? 'var(--color-listening)' : 'transparent',
                    borderColor:
                      i < playsRemaining ? 'var(--color-listening)' : 'var(--color-border)',
                  }}
                />
              ))}
            </span>
          </div>

          <span
            className="text-xs font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-correct)' }}
            data-testid="l2-xp-counter"
          >
            +{session.totalXp} XP
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-2)' }}
        role="progressbar"
        aria-valuenow={session.currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={session.items.length}
      >
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${Math.round(((session.currentIndex + 1) / session.items.length) * 100)}%`,
            backgroundColor: 'var(--color-listening)',
          }}
        />
      </div>

      {/* Main Play Card */}
      <Card skillAccent="listening" padding="lg" className="space-y-6">
        {currentItem && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill tone="neutral">{ACCENT_LABELS[currentItem.accent]}</Pill>
              <Pill tone="neutral">{Math.round(currentItem.wpm)} WPM</Pill>
            </div>
            {trackState.simulatedMode && (
              <span style={{ color: 'var(--color-text-dim)' }}>
                Chế độ mô phỏng (MP3 chưa render)
              </span>
            )}
          </div>
        )}

        {/* Centered Large Play Button with animated sound wave rings */}
        <div className="flex flex-col items-center justify-center gap-4 py-2">
          <div className="relative flex items-center justify-center">
            {isPlaying && !prefersReduced && (
              <>
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    border: '2px solid var(--color-listening)',
                  }}
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.55, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    border: '2px solid var(--color-listening)',
                  }}
                  initial={{ scale: 1, opacity: 0.55 }}
                  animate={{ scale: 1.35, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.4, ease: 'easeOut' }}
                />
              </>
            )}

            <button
              type="button"
              disabled={session.phase !== 'playing' || normalDisabled}
              onClick={handlePlayNormal}
              data-testid="l2-play-btn"
              className="relative z-10 inline-flex items-center justify-center gap-2.5 min-h-[60px] px-8 rounded-full font-bold text-base shadow-sm transition-transform active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
              style={{
                backgroundColor:
                  session.phase === 'playing' && !normalDisabled
                    ? 'var(--color-listening)'
                    : 'var(--color-surface-2)',
                color:
                  session.phase === 'playing' && !normalDisabled
                    ? 'var(--color-bg)'
                    : 'var(--color-text-dim)',
              }}
            >
              {isPlaying ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  <span>Đang phát...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>
                    {playsRemaining > 0 ? 'Phát (R)' : 'Hết lượt phát'}
                  </span>
                </>
              )}
            </button>
          </div>

          {session.phase === 'playing' && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Volume2 className="w-4 h-4" />}
                disabled={slowDisabled || isPlaying}
                onClick={handlePlaySlowBeforeGrade}
                data-testid="l2-slow-play-btn"
              >
                {session.slowPlayUsed ? 'Đã dùng 0.75× (−30%)' : 'Phát chậm 0.75× (−30%)'}
              </Button>
            </div>
          )}
        </div>

        {/* Dictation input box */}
        <div className="space-y-2">
          <label
            htmlFor="l2-dictation-input"
            className="block text-xs font-semibold"
            style={{ color: 'var(--color-text-dim)' }}
          >
            Gõ lại nguyên văn câu bạn nghe được (cho phép gõ ngay khi audio đang phát):
          </label>
          <textarea
            id="l2-dictation-input"
            ref={inputRef}
            rows={3}
            disabled={session.phase !== 'playing'}
            value={session.currentInput}
            onChange={(e) => setSession((prev) => (prev ? setDictationInput(prev, e.target.value) : prev))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && session.phase === 'playing') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ví dụ: The library opens at nine every morning."
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            data-testid="l2-answer-input"
            className="w-full px-4 py-3 rounded-[var(--radius-md)] border text-base leading-relaxed resize-none focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />

          {session.phase === 'playing' && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                Nhấn <kbd className="font-mono">Enter</kbd> để nộp và xem phân tích lỗi.
              </span>
              <Button
                variant="primary"
                skill="listening"
                hotkey="Enter"
                onClick={handleSubmit}
                data-testid="l2-submit-btn"
              >
                Nộp bài
              </Button>
            </div>
          )}
        </div>

        {/* Graded Diff & Focus Tips */}
        <AnimatePresence mode="wait">
          {session.phase === 'graded' && graded && (
            <motion.div
              key={`${graded.itemId}-graded`}
              variants={feedbackMotion}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="pt-5 border-t space-y-4"
              style={{ borderColor: 'var(--color-border)' }}
              data-testid="l2-graded-panel"
            >
              {/* Score header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-2xl font-extrabold tabular-nums"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color:
                        graded.effectiveScore >= 0.9
                          ? 'var(--color-correct)'
                          : graded.effectiveScore >= 0.7
                            ? 'var(--color-partial)'
                            : 'var(--color-wrong)',
                    }}
                    data-testid="l2-score-pct"
                  >
                    {Math.round(graded.effectiveScore * 100)}%
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                    ({graded.correctWords}/{graded.totalRefWords} từ đúng)
                  </span>
                  {graded.slowPlayUsed && (
                    <Pill tone="partial">Đã trừ 30% (0.75×)</Pill>
                  )}
                  {graded.isPerfect && (
                    <Pill tone="correct" icon={<Sparkles className="w-3.5 h-3.5" />}>
                      Hoàn hảo +{L2_PERFECT_BONUS_XP} XP
                    </Pill>
                  )}
                </div>

                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-correct)' }}
                >
                  +{graded.xpEarned} XP
                </span>
              </div>

              {/* Staggered word-level colored diff */}
              <div
                className="p-4 rounded-[var(--radius-md)] border text-base leading-relaxed"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
                data-testid="l2-diff-view"
              >
                {graded.tokens.map((tok, idx) => (
                  <DiffTokenView
                    key={`${idx}-${tok.status}-${tok.expected ?? tok.actual ?? ''}`}
                    token={tok}
                    index={idx}
                    reducedMotion={prefersReduced}
                  />
                ))}
              </div>

              {/* Active error type tags for this sentence */}
              {ALL_DICTATION_ERROR_TYPES.some((t) => graded.errorCounts[t] > 0) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {ALL_DICTATION_ERROR_TYPES.filter((t) => graded.errorCounts[t] > 0).map((t) => (
                    <Pill key={t} tone="wrong">
                      {DICTATION_ERROR_LABELS_VI[t]}: {graded.errorCounts[t]}
                    </Pill>
                  ))}
                </div>
              )}

              {/* Focus tips ("Điểm nghe khó") */}
              {graded.focusTips.length > 0 && (
                <div
                  className="p-4 rounded-[var(--radius-md)] border space-y-2.5"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-listening) 8%, var(--color-surface-2))',
                    borderColor: 'color-mix(in srgb, var(--color-listening) 35%, var(--color-border))',
                  }}
                  data-testid="l2-focus-tips"
                >
                  <div
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--color-listening)' }}
                  >
                    <Info className="w-4 h-4" />
                    <span>Điểm nghe khó</span>
                  </div>

                  <div className="space-y-2">
                    {graded.focusTips.map((tip, idx) => (
                      <div key={idx} className="text-xs leading-relaxed space-y-0.5">
                        {tip.ipaConnected && (
                          <div
                            className="font-semibold"
                            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-listening)' }}
                          >
                            {tip.ipaConnected}
                          </div>
                        )}
                        <p style={{ color: 'var(--color-text)' }}>{tip.tipVi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post-grade actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={isPlaying ? <Square className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  onClick={handleReplaySlowAfterGrade}
                  data-testid="l2-replay-slow-btn"
                >
                  {isPlaying ? 'Dừng phát' : '0.75× đoạn này'}
                </Button>

                <Button
                  variant="primary"
                  skill="listening"
                  hotkey="Enter"
                  rightIcon={
                    session.currentIndex + 1 >= session.items.length ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )
                  }
                  onClick={handleAdvance}
                  data-testid="l2-next-btn"
                >
                  {session.currentIndex + 1 >= session.items.length
                    ? 'Xem tổng kết'
                    : 'Câu tiếp theo'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default L2DictationLadder;
