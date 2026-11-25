import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Flame,
  LayoutGrid,
  Play,
  RefreshCw,
  Snowflake,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import {
  BandMeter,
  Button,
  Card,
  EmptyState,
  LiveCard,
  Mascot,
  Pill,
  ProgressRing,
  Skeleton,
  Toast,
} from '../../design/components';
import { celebrate } from '../../design/fx';
import { useTheme } from '../../app/providers';
import {
  buildBusyDayPlan,
  buildTodayPlan,
  computeFourStrands,
  createKeepStreakTask,
  type DailyPlan,
  type FourStrandsSummary,
  type GameId,
  type PlannedTask,
  type StrandId,
} from '../../core/planner/today';
import {
  displayStreakCount,
  formatDateKey,
  msUntilNextDay,
  type StreakEvent,
} from '../../core/gamification/streak';
import { db, type AttemptRecord, type UserProfile } from '../../core/storage/db';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { bandRepo } from '../../core/storage/repos/bandRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { planRepo } from '../../core/storage/repos/planRepo';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import { GAME_REGISTRY, getGameById, isGameReady } from '../../games/registry';
import { playPath } from '../../app/playTask';
import { ScreenErrorState } from '../shared/ScreenErrorState';
import { useAsyncData } from '../shared/useAsyncData';
import { downloadDailyReminderIcs } from './icsReminder';
import { ensureReadyTasks, swapToReadyGame } from './readyPlan';

const ALL_GAME_IDS: GameId[] = GAME_REGISTRY.map((g) => g.id);
const DEFAULT_DISPLAY_NAME = 'bạn';
const DEFAULT_REMINDER_TIME = '20:00';
const REMINDER_TIME_KV = 'study_reminder_time';
const REMINDER_DISMISSED_KV = 'reminder_dismissed_date';
const BACKUP_DISMISSED_KV = 'backup_reminder_dismissed_date';
const GOAL_CELEBRATED_KV = 'daily_goal_celebrated_date';

const STRAND_COLORS: Record<StrandId, string> = {
  input: 'var(--color-listening)',
  output: 'var(--color-writing)',
  language: 'var(--color-vocab)',
  fluency: 'var(--color-reading)',
};

const STRAND_ICONS: Record<StrandId, string> = {
  input: 'assets/icons/fluent/ui/compass.webp',
  output: 'assets/icons/fluent/ui/lightbulb.webp',
  language: 'assets/icons/fluent/ui/bookmark.webp',
  fluency: 'assets/icons/fluent/ui/clock.webp',
};

interface TodayPayload {
  profile: UserProfile;
  displayName: string;
  onboardingDone: boolean;
  onboardingSkipped: boolean;
  placementVocabBand: number | null;
  dueCardsCount: number;
  totalCardsCount: number;
  recentAttempts: AttemptRecord[];
  plan: DailyPlan | null;
  fourStrands: FourStrandsSummary;
  reminderTime: string;
  showReminderBanner: boolean;
  showBackupReminder: boolean;
  backupDaysSince: number | null;
  streakToast: StreakEvent | null;
}

export const TodayDashboard: React.FC = () => {
  const [, navigate] = useLocation();
  const { targetBands, dailyGoalMin, setTargetBands, setDailyGoalMin } = useTheme();
  const [todayKey, setTodayKey] = useState(() => formatDateKey(new Date()));
  const [localPlan, setLocalPlan] = useState<DailyPlan | null>(null);
  const [busyMode, setBusyMode] = useState(false);
  const [streakToast, setStreakToast] = useState<StreakEvent | null>(null);
  const [reminderHidden, setReminderHidden] = useState(false);
  const [backupBannerHidden, setBackupBannerHidden] = useState(false);
  const [icsDownloaded, setIcsDownloaded] = useState(false);
  const celebratedTodayRef = useRef<string | null>(null);

  const baseUrl = import.meta.env.BASE_URL;

  const loadTodayData = useCallback(async (): Promise<TodayPayload> => {
    const now = new Date();
    const key = formatDateKey(now);

    const [
      profile,
      dueCards,
      allCards,
      recentAttempts,
      savedPlan,
      obDoneRow,
      obSkipRow,
      nameRow,
      vocabBandRow,
      latestBands,
      reminderTimeRow,
      reminderDismissedRow,
      backupDismissedRow,
      lastBackupRow,
      pendingStreak,
    ] = await Promise.all([
      profileRepo.getOrCreate(),
      cardRepo.getDue(now.getTime()),
      cardRepo.getAll(),
      attemptRepo.getRecent({ limit: 80 }),
      planRepo.get(key),
      db.kv.get('onboarding_done'),
      db.kv.get('onboarding_skipped'),
      db.kv.get('display_name'),
      db.kv.get('placement_vocab_band'),
      bandRepo.list({ limit: 20 }),
      db.kv.get(REMINDER_TIME_KV),
      db.kv.get(REMINDER_DISMISSED_KV),
      db.kv.get(BACKUP_DISMISSED_KV),
      db.kv.get('last_backup_at'),
      attemptRepo.consumePendingStreakEvent(),
    ]);

    const lastBackupAt =
      typeof lastBackupRow?.value === 'number' && Number.isFinite(lastBackupRow.value)
        ? lastBackupRow.value
        : null;
    const backupDaysSince =
      lastBackupAt !== null
        ? Math.max(0, Math.floor((now.getTime() - lastBackupAt) / 86_400_000))
        : null;
    const backupReminder = {
      due:
        lastBackupAt === null
          ? recentAttempts.length >= 1 || allCards.length >= 5
          : (backupDaysSince ?? 0) >= 7,
      daysSince: backupDaysSince,
    };

    const onboardingDone = obDoneRow?.value === true || profile.placementDoneAt !== null;
    const onboardingSkipped = obSkipRow?.value === true;
    const displayName =
      typeof nameRow?.value === 'string' && nameRow.value.trim()
        ? nameRow.value.trim()
        : DEFAULT_DISPLAY_NAME;
    const placementVocabBand =
      typeof vocabBandRow?.value === 'number'
        ? vocabBandRow.value
        : latestBands.find((b) => b.sourceGameId === 'v1' && typeof b.band === 'number')?.band ??
          null;
    const reminderTime =
      typeof reminderTimeRow?.value === 'string' && /^\d{1,2}:\d{2}$/.test(reminderTimeRow.value)
        ? reminderTimeRow.value
        : DEFAULT_REMINDER_TIME;

    setTargetBands(profile.targetBands);
    setDailyGoalMin(profile.dailyGoalMin);

    const plannerAttempts = recentAttempts.map((a) => ({
      gameId: a.gameId,
      startedAt: a.startedAt,
      endedAt: a.endedAt,
      mode: a.mode,
    }));
    const fourStrands = computeFourStrands(plannerAttempts, now, 7);

    const shouldShowPlan =
      onboardingDone || allCards.length > 0 || recentAttempts.length > 0;

    let plan: DailyPlan | null = null;
    if (shouldShowPlan) {
      const rawPlan =
        savedPlan && savedPlan.tasks.length > 0
          ? savedPlan
          : buildTodayPlan({
              profile: {
                targetBands: profile.targetBands,
                estimatedBands: {
                  L: profile.estimatedBands.L,
                  R: profile.estimatedBands.R,
                  W: profile.estimatedBands.W,
                  S: profile.estimatedBands.S,
                },
                skillLevels: profile.skillLevels,
                dailyGoalMin: profile.dailyGoalMin,
              },
              dueCardsCount: dueCards.length,
              now,
              recentAttempts: plannerAttempts,
            });
      const basePlan = ensureReadyTasks(rawPlan, ALL_GAME_IDS, isGameReady);

      const completedTodayGames = new Set(
        recentAttempts
          .filter((a) => formatDateKey(new Date(a.endedAt)) === key)
          .map((a) => a.gameId),
      );

      plan = {
        ...basePlan,
        tasks: basePlan.tasks.map((t) => ({
          ...t,
          completed: t.completed || completedTodayGames.has(t.gameId),
        })),
      };

      await planRepo.save(plan);
    }

    const showReminderBanner = reminderDismissedRow?.value !== key;
    const showBackupReminder = backupReminder.due && backupDismissedRow?.value !== key;

    return {
      profile,
      displayName,
      onboardingDone,
      onboardingSkipped,
      placementVocabBand,
      dueCardsCount: dueCards.length,
      totalCardsCount: allCards.length,
      recentAttempts,
      plan,
      fourStrands,
      reminderTime,
      showReminderBanner,
      showBackupReminder,
      backupDaysSince: backupReminder.daysSince,
      streakToast: pendingStreak,
    };
  }, [setDailyGoalMin, setTargetBands]);

  const { data, loading, error, reload } = useAsyncData(loadTodayData, [loadTodayData, todayKey]);

  useEffect(() => {
    if (data) {
      setLocalPlan(data.plan);
      setBusyMode(false);
      if (data.streakToast) {
        setStreakToast(data.streakToast);
      }
    }
  }, [data]);

  useEffect(() => {
    const onFocus = () => {
      void reload();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reload]);

  // Ngày học đổi lúc 04:00 (F3)
  useEffect(() => {
    const sync = () =>
      setTodayKey((prev) => {
        const next = formatDateKey(new Date());
        return next === prev ? prev : next;
      });
    const timer = window.setTimeout(sync, msUntilNextDay(new Date()) + 500);
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', sync);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', sync);
    };
  }, [todayKey]);

  const activePlan = localPlan ?? data?.plan ?? null;

  const todayStats = useMemo(() => {
    const attempts = data?.recentAttempts ?? [];
    const todayAttempts = attempts.filter(
      (a) => formatDateKey(new Date(a.endedAt)) === todayKey,
    );
    const todayXp = todayAttempts.reduce((sum, a) => sum + (a.xp || 0), 0);
    const attemptMin = todayAttempts.reduce(
      (sum, a) => sum + Math.max(1, Math.round((a.endedAt - a.startedAt) / 60_000)),
      0,
    );
    const completedTaskMin = (activePlan?.tasks ?? [])
      .filter((t) => t.completed)
      .reduce((sum, t) => sum + t.estMinutes, 0);
    const minutesDone = Math.max(attemptMin, completedTaskMin);
    return { todayXp, minutesDone, sessionsToday: todayAttempts.length };
  }, [activePlan, data?.recentAttempts, todayKey]);

  const handleSwapTask = async (task: PlannedTask) => {
    if (!activePlan) return;
    const updated = swapToReadyGame(activePlan, task, ALL_GAME_IDS, isGameReady);
    if (!updated) return;
    await planRepo.save(updated);
    setLocalPlan(updated);
  };

  const handleToggleBusyMode = async () => {
    if (!data) return;
    const nextBusy = !busyMode;
    setBusyMode(nextBusy);
    const now = new Date();
    const plannerAttempts = data.recentAttempts.map((a) => ({
      gameId: a.gameId,
      startedAt: a.startedAt,
      endedAt: a.endedAt,
      mode: a.mode,
    }));
    const raw = nextBusy
      ? buildBusyDayPlan({
          profile: {
            targetBands: data.profile.targetBands,
            estimatedBands: {
              L: data.profile.estimatedBands.L,
              R: data.profile.estimatedBands.R,
              W: data.profile.estimatedBands.W,
              S: data.profile.estimatedBands.S,
            },
            skillLevels: data.profile.skillLevels,
            dailyGoalMin: data.profile.dailyGoalMin,
          },
          dueCardsCount: data.dueCardsCount,
          now,
          recentAttempts: plannerAttempts,
        })
      : buildTodayPlan({
          profile: {
            targetBands: data.profile.targetBands,
            estimatedBands: {
              L: data.profile.estimatedBands.L,
              R: data.profile.estimatedBands.R,
              W: data.profile.estimatedBands.W,
              S: data.profile.estimatedBands.S,
            },
            skillLevels: data.profile.skillLevels,
            dailyGoalMin: data.profile.dailyGoalMin,
          },
          dueCardsCount: data.dueCardsCount,
          now,
          recentAttempts: plannerAttempts,
        });
    const readyPlan = ensureReadyTasks(raw, ALL_GAME_IDS, isGameReady);
    await planRepo.save(readyPlan);
    setLocalPlan(readyPlan);
  };

  const startTask = useCallback(
    (task: PlannedTask) => {
      navigate(playPath(task.gameId, 'today', task.id, task.mode));
    },
    [navigate],
  );

  const handleStartKeepStreak = () => {
    const task = createKeepStreakTask(new Date());
    startTask(task);
  };

  const handleDismissReminder = async () => {
    setReminderHidden(true);
    await db.kv.put({ key: REMINDER_DISMISSED_KV, value: todayKey });
  };

  const handleDismissBackupReminder = async () => {
    setBackupBannerHidden(true);
    await db.kv.put({ key: BACKUP_DISMISSED_KV, value: todayKey });
  };

  const handleDownloadIcs = () => {
    downloadDailyReminderIcs(data?.reminderTime ?? DEFAULT_REMINDER_TIME, effectiveDailyGoal);
    setIcsDownloaded(true);
  };

  const activeProfile = data?.profile ?? null;
  const effectiveTargetBands = activeProfile?.targetBands ?? targetBands;
  const effectiveDailyGoal = busyMode ? 10 : activeProfile?.dailyGoalMin ?? dailyGoalMin;
  const streakCount = activeProfile ? displayStreakCount(activeProfile.streak) : 0;
  const streakFreezes = activeProfile?.streak.freezes ?? 1;
  const totalXp = activeProfile?.xp ?? 0;
  const estBands = activeProfile?.estimatedBands ?? {
    L: null,
    R: null,
    W: null,
    S: null,
    overall: null,
    confidence: { L: null, R: null, W: null, S: null },
  };
  const progressPct = Math.min(
    100,
    Math.round((todayStats.minutesDone / Math.max(1, effectiveDailyGoal)) * 100),
  );
  const allTasksDone =
    Boolean(activePlan && activePlan.tasks.length > 0) &&
    (activePlan?.tasks.every((t) => t.completed) ?? false);
  const dailyGoalReached = progressPct >= 100 || allTasksDone;

  const firstUnfinishedTask = activePlan?.tasks.find((t) => !t.completed && isGameReady(t.gameId));

  // F9: gọi celebrate() một lần mỗi ngày khi đạt mục tiêu ngày (tự tôn trọng useMotionPref / fxTier)
  useEffect(() => {
    if (!dailyGoalReached || celebratedTodayRef.current === todayKey) return;
    celebratedTodayRef.current = todayKey;
    void (async () => {
      const row = await db.kv.get(GOAL_CELEBRATED_KV);
      if (row?.value === todayKey) return;
      await db.kv.put({ key: GOAL_CELEBRATED_KV, value: todayKey });
      void celebrate('dailyGoal');
    })();
  }, [dailyGoalReached, todayKey]);

  // F12: Enter mở việc đầu chưa xong
  useEffect(() => {
    if (!firstUnfinishedTask) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing || e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest('button, a, input, textarea, select, summary, [role="button"], [contenteditable]')
      ) {
        return;
      }
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      e.preventDefault();
      startTask(firstUnfinishedTask);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [firstUnfinishedTask, startTask]);

  if (error) {
    return (
      <ScreenErrorState
        title="Không tải được kế hoạch Hôm nay"
        error={error}
        code="ERR-TODAY-LOAD"
        onRetry={() => void reload()}
      />
    );
  }

  const mascotState = dailyGoalReached
    ? 'an-mung'
    : 'co-vu';

  return (
    <div className="space-y-3.5 sm:space-y-5 pb-8">
      {/* F8: Toast khi Streak Freeze tự động cứu chuỗi hoặc nhận thêm lượt bảo vệ */}
      {streakToast && (
        <Toast
          tone="info"
          title={
            streakToast.freezeUsed
              ? `Đóng băng đã cứu chuỗi ${streakToast.count} ngày của bạn!`
              : `Nhận thêm +1 lượt đóng băng chuỗi (hiện có ${streakToast.freezes}/2)`
          }
          description={
            streakToast.freezeUsed
              ? `Ngày ${streakToast.protectedDate ?? 'hôm qua'} đã được bảo vệ tự động. Còn ${streakToast.freezes} lượt đóng băng.`
              : 'Học đều mỗi 7 ngày giúp bạn tích thêm lượt bảo vệ chuỗi (tối đa 2).'
          }
          onDismiss={() => setStreakToast(null)}
        />
      )}

      {/* Hero Hôm nay (M1 ≥ 15% diện tích + M3 Lexi + icon màu Fluent 3D) */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border p-3.5 sm:p-5 min-h-[155px] md:min-h-[205px] flex flex-col justify-between gap-3"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          backgroundImage: `linear-gradient(135deg, color-mix(in srgb, var(--color-info) 12%, transparent), color-mix(in srgb, var(--color-vocab) 10%, transparent)), url(${baseUrl}assets/illustrations/welcome.svg)`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right -12px bottom -12px',
          backgroundSize: 'cover',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, var(--color-surface) 0%, color-mix(in srgb, var(--color-surface) 92%, transparent) 68%, color-mix(in srgb, var(--color-surface) 78%, transparent) 100%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <img
                src={`${baseUrl}assets/icons/fluent/badges/band-80.webp`}
                alt=""
                width={32}
                height={32}
                loading="lazy"
                decoding="async"
                className="w-8 h-8 object-contain shrink-0"
              />
              <Pill tone="info">Lộ trình 6.0 → 8.0 Academic</Pill>
              {data?.placementVocabBand !== null && data?.placementVocabBand !== undefined && (
                <Pill tone="vocab">
                  Từ vựng đầu vào: Band {data.placementVocabBand.toFixed(1)}
                </Pill>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Chào {data?.displayName ?? DEFAULT_DISPLAY_NAME} · Hôm nay học gì?
            </h1>
            <Mascot
              state={mascotState}
              size={76}
              context={{
                streakDays: streakCount,
                dueCount: data?.dueCardsCount ?? 0,
                dailyGoalMin: effectiveDailyGoal,
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-[var(--radius-md)] border text-sm font-semibold tabular-nums"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                fontFamily: 'var(--font-mono)',
              }}
              data-testid="today-goal-chip"
            >
              <img
                src={`${baseUrl}assets/icons/fluent/ui/cloud.webp`}
                alt=""
                width={32}
                height={32}
                loading="lazy"
                decoding="async"
                className="w-8 h-8 object-contain shrink-0"
              />
              <span>{effectiveDailyGoal}p/ngày</span>
            </div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-[var(--radius-md)] border text-sm font-semibold tabular-nums"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                fontFamily: 'var(--font-mono)',
              }}
              data-testid="today-streak-badge"
            >
              <img
                src={`${baseUrl}assets/icons/fluent/ui/freeze.webp`}
                alt=""
                width={32}
                height={32}
                loading="lazy"
                decoding="async"
                className="w-8 h-8 object-contain shrink-0"
              />
              <Flame className="w-4 h-4 hidden" style={{ color: 'var(--color-writing)' }} />
              <span>{streakCount} ngày</span>
              <span
                className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-listening)',
                }}
                title="Lượt đóng băng bảo vệ chuỗi ngày học"
              >
                <Snowflake className="w-3.5 h-3.5" />
                {streakFreezes}
              </span>
            </div>

            <div
              className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-[var(--radius-md)] border text-sm font-semibold tabular-nums"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                fontFamily: 'var(--font-mono)',
              }}
              data-testid="today-xp-badge"
            >
              <img
                src={`${baseUrl}assets/icons/fluent/ui/xp.webp`}
                alt=""
                width={32}
                height={32}
                loading="lazy"
                decoding="async"
                className="w-8 h-8 object-contain shrink-0"
              />
              <Star className="w-4 h-4 hidden" style={{ color: 'var(--color-partial)' }} />
              <span>{totalXp.toLocaleString('vi-VN')} XP</span>
              {todayStats.todayXp > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--color-correct) 16%, var(--color-surface))',
                    color: 'var(--color-correct)',
                  }}
                >
                  +{todayStats.todayXp}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner mời Onboarding nếu chưa thiết lập lần đầu */}
      {!loading && data && !data.onboardingDone && !data.onboardingSkipped && (
        <Card
          skillAccent="info"
          padding="md"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          data-testid="today-onboarding-banner"
        >
          <div className="flex items-start gap-3">
            <img
              src={`${baseUrl}assets/icons/fluent/ui/rocket.webp`}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              decoding="async"
              className="w-10 h-10 object-contain shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Pill tone="info" icon={<Sparkles className="w-3.5 h-3.5" />}>
                  Thiết lập lần đầu (~90 giây)
                </Pill>
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                Cá nhân hoá lộ trình 6.0 → 8.0 & nạp sẵn thẻ ôn từ vựng
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                Chọn mục tiêu từng kỹ năng, làm nhanh 15 câu định vị từ vựng để mở kế hoạch học tự
                động mỗi ngày — hoặc bạn có thể vào thẳng Hub chơi thử.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              skill="info"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/onboarding')}
              data-testid="today-go-onboarding"
            >
              Bắt đầu thiết lập
            </Button>
            <Button variant="secondary" onClick={() => navigate('/hub')}>
              Vào Hub chơi thử
            </Button>
          </div>
        </Card>
      )}

      {/* U6: Đưa "Việc tiếp theo" lên ngay đầu (LiveCard) */}
      {!loading && firstUnfinishedTask && (
        <LiveCard skill={firstUnfinishedTask.skillGroup} tilt={false}>
          <div className="space-y-3" data-testid="today-next-action">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <img
                  src={`${baseUrl}assets/icons/fluent/ui/check.webp`}
                  alt=""
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="w-9 h-9 object-contain shrink-0"
                />
                <Pill tone={firstUnfinishedTask.skillGroup} icon={<Play className="w-3.5 h-3.5" />}>
                  Việc tiếp theo
                </Pill>
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                >
                  <Clock className="w-3.5 h-3.5" />~{firstUnfinishedTask.estMinutes} phút
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="md"
                  variant={busyMode ? 'primary' : 'ghost'}
                  skill="info"
                  onClick={() => void handleToggleBusyMode()}
                  data-testid="today-busy-toggle"
                >
                  {busyMode ? 'Đang ở Ngày bận (~10p)' : 'Ngày bận (~10p)'}
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  leftIcon={<Zap className="w-3.5 h-3.5" />}
                  onClick={handleStartKeepStreak}
                  data-testid="today-keep-streak"
                >
                  Giữ chuỗi 5 phút
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                  {firstUnfinishedTask.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                  {firstUnfinishedTask.reasonVi}
                </p>
              </div>
              <Button
                size="lg"
                variant="primary"
                skill={firstUnfinishedTask.skillGroup}
                rightIcon={<Play className="w-4 h-4" />}
                onClick={() => startTask(firstUnfinishedTask)}
                className="w-full sm:w-auto shrink-0"
                data-testid="today-next-start"
              >
                Bắt đầu ngay
                <span
                  className="hidden sm:inline text-xs font-semibold ml-1.5 px-1.5 rounded border"
                  style={{ borderColor: 'currentColor' }}
                  aria-hidden="true"
                >
                  Enter
                </span>
              </Button>
            </div>
          </div>
        </LiveCard>
      )}

      {/* F9: Banner ăn mừng khi đạt mục tiêu ngày */}
      {!loading && dailyGoalReached && (
        <Card
          skillAccent="reading"
          padding="md"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          data-testid="today-goal-celebration"
        >
          <div className="flex items-start gap-3">
            <img
              src={`${baseUrl}assets/icons/fluent/ui/party.webp`}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              decoding="async"
              className="w-10 h-10 object-contain shrink-0"
            />
            <div className="space-y-0.5">
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                Hoàn thành mục tiêu ngày hôm nay!
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                Bạn đã luyện {todayStats.minutesDone} phút ({todayStats.sessionsToday} phiên · +
                {todayStats.todayXp} XP). Chuỗi hiện tại: {streakCount} ngày.
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => navigate('/stats')}>
            Xem thống kê
          </Button>
        </Card>
      )}

      {/* PB-05: Nhắc sao lưu định kỳ nếu > 7 ngày chưa sao lưu */}
      {!loading && data?.showBackupReminder && !backupBannerHidden && (
        <Card
          padding="sm"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          data-testid="today-backup-reminder"
        >
          <div className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--color-text)' }}>
            <img
              src={`${baseUrl}assets/icons/fluent/ui/shield.webp`}
              alt=""
              width={36}
              height={36}
              loading="lazy"
              decoding="async"
              className="w-9 h-9 object-contain shrink-0"
            />
            <span>
              {data.backupDaysSince !== null
                ? `Đã ${data.backupDaysSince} ngày bạn chưa sao lưu dữ liệu học.`
                : 'Bạn đã có tiến độ học mới — nên xuất 1 bản sao lưu .json để tránh mất dữ liệu trên trình duyệt.'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="md" variant="secondary" onClick={() => navigate('/settings')}>
              Sao lưu ngay
            </Button>
            <Button size="md" variant="ghost" onClick={() => void handleDismissBackupReminder()}>
              Để sau
            </Button>
          </div>
        </Card>
      )}

      {/* Bố cục 2 cột: Kế hoạch hôm nay & Band ước lượng + 4 mạch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái: Mục tiêu & Danh sách nhiệm vụ hôm nay */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={`${baseUrl}assets/icons/fluent/ui/goal.webp`}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                className="w-10 h-10 object-contain shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                  Mục tiêu hôm nay
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                  {data && data.dueCardsCount > 0
                    ? `Có ${data.dueCardsCount} thẻ đến hạn · Mục tiêu ${effectiveDailyGoal} phút/ngày.`
                    : `Hoàn thành ${effectiveDailyGoal} phút luyện tập tập trung để giữ nhịp hằng ngày.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right whitespace-nowrap">
                <div
                  className="text-sm font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
                >
                  {todayStats.minutesDone} / {effectiveDailyGoal} phút
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  {todayStats.sessionsToday > 0
                    ? `Đã xong ${todayStats.sessionsToday} phiên`
                    : 'Chưa bắt đầu'}
                </div>
              </div>
              <ProgressRing
                value={todayStats.minutesDone}
                max={effectiveDailyGoal}
                size={52}
                skill={progressPct >= 100 ? 'reading' : 'info'}
                label={`${progressPct}%`}
              />
            </div>
          </Card>

          {loading ? (
            <Card padding="md" className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton lines={4} />
            </Card>
          ) : activePlan && activePlan.tasks.length > 0 ? (
            <div className="space-y-3" data-testid="today-plan-list">
              {activePlan.tasks.map((task, idx) => {
                const gameMeta = getGameById(task.gameId);
                const ready = isGameReady(task.gameId);
                const isPrimaryNext = firstUnfinishedTask?.id === task.id;

                return (
                  <LiveCard key={task.id} skill={task.skillGroup} tilt={false}>
                    <div
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-opacity ${
                        task.completed ? 'opacity-75' : ''
                      }`}
                      data-testid={`today-task-${task.gameId}`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={`${baseUrl}assets/icons/fluent/games/${task.gameId}.webp`}
                          alt=""
                          width={40}
                          height={40}
                          loading="lazy"
                          decoding="async"
                          className="w-10 h-10 object-contain shrink-0 mt-0.5"
                        />
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold tabular-nums shrink-0"
                              style={{
                                fontFamily: 'var(--font-mono)',
                                backgroundColor: task.completed
                                  ? 'color-mix(in srgb, var(--color-correct) 18%, var(--color-surface-2))'
                                  : 'var(--color-surface-2)',
                                color: task.completed
                                  ? 'var(--color-correct)'
                                  : 'var(--color-text)',
                              }}
                            >
                              {task.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                            </span>
                            <Pill tone={task.skillGroup}>
                              {gameMeta?.code ?? task.gameId.toUpperCase()} ·{' '}
                              {gameMeta?.skillLabelVi ?? task.skillGroup}
                            </Pill>
                            <span
                              className="inline-flex items-center gap-1 text-xs tabular-nums"
                              style={{
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--color-text-dim)',
                              }}
                            >
                              <Clock className="w-3.5 h-3.5" />~{task.estMinutes}p
                            </span>
                            {task.completed && <Pill tone="correct">Hoàn thành</Pill>}
                            {!ready && <Pill tone="neutral">Sắp có</Pill>}
                          </div>

                          <h3
                            className={`text-base font-bold ${task.completed ? 'line-through' : ''}`}
                            style={{ color: 'var(--color-text)' }}
                          >
                            {task.title}
                          </h3>
                          <p
                            className="text-xs leading-relaxed"
                            style={{ color: 'var(--color-text-dim)' }}
                          >
                            {task.reasonVi}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="md"
                          variant="ghost"
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          onClick={() => void handleSwapTask(task)}
                          data-testid={`today-swap-${task.gameId}`}
                        >
                          Đổi bài
                        </Button>
                        <Button
                          size="md"
                          variant={isPrimaryNext ? 'primary' : 'secondary'}
                          skill={task.skillGroup}
                          rightIcon={<Play className="w-3.5 h-3.5" />}
                          onClick={() => startTask(task)}
                          data-testid={`today-start-${task.gameId}`}
                        >
                          {task.completed ? 'Chơi lại' : 'Bắt đầu'}
                        </Button>
                      </div>
                    </div>
                  </LiveCard>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={
                <img
                  src={`${baseUrl}assets/icons/fluent/ui/zzz.webp`}
                  alt=""
                  width={44}
                  height={44}
                  loading="lazy"
                  decoding="async"
                  className="w-11 h-11 object-contain"
                />
              }
              title="Chưa có lịch học cá nhân hoá cho hôm nay"
              description="Bạn chưa làm bài định vị đầu vào hoặc chưa bắt đầu phiên học đầu tiên. Hãy định vị nhanh để hệ thống tự xếp 3–4 nhiệm vụ mỗi ngày, hoặc khám phá ngay 12 chế độ luyện tập."
              action={
                <Button
                  variant="primary"
                  skill="info"
                  leftIcon={<LayoutGrid className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => navigate('/hub')}
                >
                  Khám phá 12 Chế độ (Hub)
                </Button>
              }
              secondaryAction={
                <Button
                  variant="secondary"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  onClick={() => navigate('/placement')}
                >
                  Làm bài kiểm tra đầu vào
                </Button>
              }
            />
          )}

          {/* F13: Nhắc lịch học + xuất .ics (tối đa 1 nhắc/ngày, PP-14) */}
          {!loading && data?.showReminderBanner && !reminderHidden && (
            <Card
              padding="md"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              data-testid="today-reminder-banner"
            >
              <div className="flex items-start gap-3">
                <img
                  src={`${baseUrl}assets/icons/fluent/ui/calendar.webp`}
                  alt=""
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="w-9 h-9 object-contain shrink-0"
                />
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Nhắc học hằng ngày lúc {data.reminderTime}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                    {icsDownloaded
                      ? 'Đã tải tệp lịch .ics — mở tệp trên iPhone hoặc máy tính để thêm vào Lịch.'
                      : 'Tối đa 1 nhắc/ngày. Thêm vào Lịch iPhone/Google để không quên giữ chuỗi.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  size="md"
                  variant="secondary"
                  leftIcon={<CalendarPlus className="w-4 h-4" />}
                  onClick={handleDownloadIcs}
                  data-testid="today-export-ics"
                >
                  Thêm vào Lịch (.ics)
                </Button>
                <Button size="md" variant="ghost" onClick={() => void handleDismissReminder()}>
                  Ẩn hôm nay
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Cột phải: Đồng hồ Band ước lượng & 4 mạch học */}
        <div className="lg:col-span-5 space-y-4">
          <Card padding="lg" className="space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={`${baseUrl}assets/icons/fluent/ui/chart.webp`}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    decoding="async"
                    className="w-9 h-9 object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                      Band ước lượng
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                      Cập nhật tự động sau mỗi phiên luyện và thi thử
                    </p>
                  </div>
                </div>
                <Pill tone="reading">Mục tiêu 8.0</Pill>
              </div>

              <div className="space-y-4 pt-1">
                <BandMeter
                  skillCode="L"
                  skillLabel="Listening"
                  skill="listening"
                  currentBand={estBands.L}
                  targetBand={effectiveTargetBands.L}
                />
                <BandMeter
                  skillCode="R"
                  skillLabel="Reading"
                  skill="reading"
                  currentBand={estBands.R}
                  targetBand={effectiveTargetBands.R}
                />
                <BandMeter
                  skillCode="W"
                  skillLabel="Writing"
                  skill="writing"
                  currentBand={estBands.W}
                  targetBand={effectiveTargetBands.W}
                />
                <BandMeter
                  skillCode="S"
                  skillLabel="Speaking"
                  skill="speaking"
                  currentBand={estBands.S}
                  targetBand={effectiveTargetBands.S}
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div
                className="p-3.5 rounded-[var(--radius-md)] border flex items-center justify-between text-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-dim)',
                }}
              >
                <span>Overall ước tính hiện tại:</span>
                <strong
                  className="text-sm"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
                >
                  {estBands.overall !== null
                    ? `Band ${estBands.overall.toFixed(1)}`
                    : 'Chưa định vị (–)'}
                </strong>
              </div>

              {data && data.totalCardsCount > 0 && (
                <div
                  className="px-3.5 py-2.5 rounded-[var(--radius-md)] border flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-dim)',
                  }}
                >
                  <span>Kho thẻ ôn đang hoạt động:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-vocab)' }}>
                    {data.totalCardsCount} thẻ ({data.dueCardsCount} đến hạn)
                  </strong>
                </div>
              )}
            </div>
          </Card>

          {/* PP-06: Tóm tắt cân bằng 4 mạch học 7 ngày */}
          {data && (
            <Card padding="md" className="space-y-3" data-testid="today-four-strands">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={`${baseUrl}assets/icons/fluent/ui/brain.webp`}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    decoding="async"
                    className="w-9 h-9 object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                      Cân bằng 4 mạch học (7 ngày)
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                      Mục tiêu ~25% mỗi mạch · mạch dưới 15% được ưu tiên bù
                    </p>
                  </div>
                </div>
                <Pill tone="neutral">{data.fourStrands.totalMinutes}p</Pill>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {(['input', 'output', 'language', 'fluency'] as const).map((id) => {
                  const st = data.fourStrands.strands[id];
                  return (
                    <div
                      key={id}
                      className="p-2.5 rounded-[var(--radius-md)] border space-y-1.5"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: st.underrepresented
                          ? 'var(--color-partial)'
                          : 'var(--color-border)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-1 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                          <img
                            src={`${baseUrl}${STRAND_ICONS[id]}`}
                            alt=""
                            width={32}
                            height={32}
                            loading="lazy"
                            decoding="async"
                            className="w-8 h-8 object-contain shrink-0"
                          />
                          <span className="truncate">{st.labelVi.split(' (')[0]}</span>
                        </span>
                        <span
                          className="font-bold tabular-nums shrink-0"
                          style={{ fontFamily: 'var(--font-mono)', color: STRAND_COLORS[id] }}
                        >
                          {st.pct}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 w-full rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, st.pct)}%`,
                            backgroundColor: STRAND_COLORS[id],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
