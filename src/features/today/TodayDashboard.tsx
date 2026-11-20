import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  LayoutGrid,
  Play,
  RefreshCw,
  Snowflake,
  Sparkles,
  Star,
} from 'lucide-react';
import {
  BandMeter,
  Button,
  Card,
  EmptyState,
  Pill,
  ProgressRing,
  Skeleton,
} from '../../design/components';
import { useTheme } from '../../app/providers';
import {
  buildTodayPlan,
  swapPlanTask,
  type DailyPlan,
  type GameId,
  type PlannedTask,
} from '../../core/planner/today';
import { formatDateKey } from '../../core/gamification/streak';
import { db, type AttemptRecord, type UserProfile } from '../../core/storage/db';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { bandRepo } from '../../core/storage/repos/bandRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { planRepo } from '../../core/storage/repos/planRepo';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import { getGameById, isGameReady } from '../../games/registry';

const READY_M1_GAMES: GameId[] = ['v1', 'v2', 'v3'];
const SWAP_POOL: GameId[] = ['v1', 'v2', 'v3', 'r1', 'l1', 'w2', 's2'];

function normalizePlanForM1(plan: DailyPlan, dueCardsCount: number): DailyPlan {
  let next = plan;
  const existingIds = new Set(next.tasks.map((t) => t.gameId));

  // Ensure ready M1 games (V1 if due cards, V2, V3) are prioritized in Today's tasks
  const desiredReady: GameId[] = dueCardsCount > 0 ? ['v1', 'v2', 'v3'] : ['v2', 'v3', 'v1'];

  for (const desired of desiredReady) {
    if (existingIds.has(desired)) continue;
    const nonReadySlot = next.tasks.find(
      (t) => !isGameReady(t.gameId) && !t.completed,
    );
    if (nonReadySlot) {
      next = swapPlanTask(next, nonReadySlot.id, desired);
      existingIds.delete(nonReadySlot.gameId);
      existingIds.add(desired);
    }
  }

  // Restore clear Vietnamese reasons for V2/V3 if swapped in automatically
  const tasks = next.tasks.map((t) => {
    if (t.reasonVi === 'Đã đổi theo lựa chọn của bạn.') {
      if (t.gameId === 'v2') {
        return {
          ...t,
          reasonVi: 'Luyện tự gõ collocation học thuật & sửa lỗi ghép từ kiểu Việt.',
        };
      }
      if (t.gameId === 'v3') {
        return {
          ...t,
          reasonVi: 'Bắt nhanh cụm paraphrase trong ngữ cảnh — cầu nối trực tiếp sang Reading/Listening.',
        };
      }
      if (t.gameId === 'v1') {
        return {
          ...t,
          reasonVi:
            dueCardsCount > 0
              ? `Ôn ${dueCardsCount} thẻ SRS đến hạn để giữ trí nhớ dài hạn.`
              : 'Học lượt thẻ học thuật mới theo lịch FSRS.',
        };
      }
    }
    return t;
  });

  return { ...next, tasks };
}

interface TodayDataState {
  loading: boolean;
  profile: UserProfile | null;
  displayName: string;
  onboardingDone: boolean;
  onboardingSkipped: boolean;
  placementVocabBand: number | null;
  dueCardsCount: number;
  totalCardsCount: number;
  recentAttempts: AttemptRecord[];
  plan: DailyPlan | null;
}

export const TodayDashboard: React.FC = () => {
  const [, navigate] = useLocation();
  const { targetBands, dailyGoalMin, setTargetBands, setDailyGoalMin } = useTheme();

  const [state, setState] = useState<TodayDataState>({
    loading: true,
    profile: null,
    displayName: 'Bang',
    onboardingDone: false,
    onboardingSkipped: false,
    placementVocabBand: null,
    dueCardsCount: 0,
    totalCardsCount: 0,
    recentAttempts: [],
    plan: null,
  });

  const loadTodayData = useCallback(async () => {
    const now = new Date();
    const todayKey = formatDateKey(now);

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
    ] = await Promise.all([
      profileRepo.getOrCreate(),
      cardRepo.getDue(now.getTime()),
      cardRepo.getAll(),
      attemptRepo.getRecent({ limit: 50 }),
      planRepo.get(todayKey),
      db.kv.get('onboarding_done'),
      db.kv.get('onboarding_skipped'),
      db.kv.get('display_name'),
      db.kv.get('placement_vocab_band'),
      bandRepo.list({ limit: 20 }),
    ]);

    const onboardingDone = obDoneRow?.value === true || profile.placementDoneAt !== null;
    const onboardingSkipped = obSkipRow?.value === true;
    const displayName =
      typeof nameRow?.value === 'string' && nameRow.value.trim()
        ? nameRow.value.trim()
        : 'Bang';
    const placementVocabBand =
      typeof vocabBandRow?.value === 'number'
        ? vocabBandRow.value
        : latestBands.find((b) => b.sourceGameId === 'v1' && typeof b.band === 'number')?.band ??
          null;

    // Sync profile preferences into ThemeProvider
    setTargetBands(profile.targetBands);
    setDailyGoalMin(profile.dailyGoalMin);

    const shouldShowPlan =
      onboardingDone || allCards.length > 0 || recentAttempts.length > 0;

    let plan: DailyPlan | null = null;
    if (shouldShowPlan) {
      const basePlan =
        savedPlan && savedPlan.tasks.length > 0
          ? savedPlan
          : normalizePlanForM1(
              buildTodayPlan({
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
                recentAttempts: recentAttempts.map((a) => ({
                  gameId: a.gameId,
                  startedAt: a.startedAt,
                })),
              }),
              dueCards.length,
            );

      // Mark tasks completed if there is an attempt for that gameId today
      const completedTodayGames = new Set(
        recentAttempts
          .filter((a) => formatDateKey(new Date(a.endedAt)) === todayKey)
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

    setState({
      loading: false,
      profile,
      displayName,
      onboardingDone,
      onboardingSkipped,
      placementVocabBand,
      dueCardsCount: dueCards.length,
      totalCardsCount: allCards.length,
      recentAttempts,
      plan,
    });
  }, [setDailyGoalMin, setTargetBands]);

  useEffect(() => {
    void loadTodayData();
    const onFocus = () => {
      void loadTodayData();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadTodayData]);

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const todayStats = useMemo(() => {
    const todayAttempts = state.recentAttempts.filter(
      (a) => formatDateKey(new Date(a.endedAt)) === todayKey,
    );
    const todayXp = todayAttempts.reduce((sum, a) => sum + (a.xp || 0), 0);
    const attemptMin = todayAttempts.reduce(
      (sum, a) => sum + Math.max(1, Math.round((a.endedAt - a.startedAt) / 60_000)),
      0,
    );
    const completedTaskMin = (state.plan?.tasks ?? [])
      .filter((t) => t.completed)
      .reduce((sum, t) => sum + t.estMinutes, 0);
    const minutesDone = Math.max(attemptMin, completedTaskMin);
    return { todayXp, minutesDone, sessionsToday: todayAttempts.length };
  }, [state.plan, state.recentAttempts, todayKey]);

  const handleSwapTask = async (task: PlannedTask) => {
    if (!state.plan) return;
    const used = new Set(state.plan.tasks.map((t) => t.gameId));
    const candidates = SWAP_POOL.filter((gid) => gid !== task.gameId && !used.has(gid));
    const fallback = READY_M1_GAMES.find((gid) => gid !== task.gameId) ?? 'v2';
    const nextGameId = candidates[0] ?? fallback;

    const updated = swapPlanTask(state.plan, task.id, nextGameId);
    await planRepo.save(updated);
    setState((prev) => ({ ...prev, plan: updated }));
  };

  const activeProfile = state.profile;
  const effectiveTargetBands = activeProfile?.targetBands ?? targetBands;
  const effectiveDailyGoal = activeProfile?.dailyGoalMin ?? dailyGoalMin;
  const streakCount = activeProfile?.streak.count ?? 0;
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

  const firstUnfinishedTask = state.plan?.tasks.find((t) => !t.completed);

  return (
    <div className="space-y-6 pb-8">
      {/* Banner mời Onboarding nếu chưa thiết lập lần đầu */}
      {!state.loading && !state.onboardingDone && !state.onboardingSkipped && (
        <Card
          skillAccent="info"
          padding="md"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          data-testid="today-onboarding-banner"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill tone="info" icon={<Sparkles className="w-3.5 h-3.5" />}>
                Thiết lập lần đầu (~90 giây)
              </Pill>
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              Cá nhân hoá lộ trình 6.0 → 8.0 & nạp sẵn thẻ FSRS
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Chọn mục tiêu từng kỹ năng, làm nhanh 15 câu Placement từ vựng để mở kế hoạch học tự
              động mỗi ngày — hoặc bạn có thể vào thẳng Hub chơi thử.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="primary"
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

      {/* Thanh chào & thông số nhanh */}
      <Card padding="md" className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="info" icon={<Calendar className="w-3.5 h-3.5" />}>
              Lộ trình 6.0 → 8.0 Academic
            </Pill>
            {state.placementVocabBand !== null && (
              <Pill tone="vocab">
                Từ vựng đầu vào: Band {state.placementVocabBand.toFixed(1)}
              </Pill>
            )}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Chào {state.displayName} · Hôm nay học gì?
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
            Mỗi phút luyện đúng kỹ năng bài thi chấm. Không tốn tiền API, chấm bài qua Claude gói
            copy/dán.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-md)] border text-sm font-semibold tabular-nums"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              fontFamily: 'var(--font-mono)',
            }}
            data-testid="today-streak-badge"
          >
            <Flame className="w-4 h-4" style={{ color: 'var(--color-writing)' }} />
            <span>{streakCount} ngày</span>
            <span
              className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-listening)',
              }}
              title="Lượt đóng băng bảo vệ streak"
            >
              <Snowflake className="w-3 h-3" />
              {streakFreezes}
            </span>
          </div>

          <div
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-md)] border text-sm font-semibold tabular-nums"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              fontFamily: 'var(--font-mono)',
            }}
            data-testid="today-xp-badge"
          >
            <Star className="w-4 h-4" style={{ color: 'var(--color-partial)' }} />
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
      </Card>

      {/* Bố cục 2 cột: Kế hoạch hôm nay & Band ước lượng */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái: Mục tiêu & Danh sách nhiệm vụ hôm nay */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="md" className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                Mục tiêu hôm nay
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                {state.dueCardsCount > 0
                  ? `Có ${state.dueCardsCount} thẻ SRS đến hạn · Mục tiêu ${effectiveDailyGoal} phút/ngày.`
                  : `Hoàn thành ${effectiveDailyGoal} phút luyện tập tập trung để giữ nhịp hằng ngày.`}
              </p>
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

          {state.loading ? (
            <Card padding="md" className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton lines={4} />
            </Card>
          ) : state.plan && state.plan.tasks.length > 0 ? (
            <div className="space-y-3" data-testid="today-plan-list">
              {state.plan.tasks.map((task, idx) => {
                const gameMeta = getGameById(task.gameId);
                const ready = isGameReady(task.gameId);
                const isPrimaryNext = firstUnfinishedTask?.id === task.id;

                return (
                  <Card
                    key={task.id}
                    skillAccent={task.skillGroup}
                    padding="md"
                    className={`transition-opacity ${task.completed ? 'opacity-75' : ''}`}
                    data-testid={`today-task-${task.gameId}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                          {task.completed && <Pill tone="correct">Hoàn thành ✅</Pill>}
                          {!ready && (
                            <Pill tone="neutral">Mốc {gameMeta?.milestone ?? 'sau'}</Pill>
                          )}
                        </div>

                        <h3
                          className={`text-base font-bold ${task.completed ? 'line-through' : ''}`}
                          style={{ color: 'var(--color-text)' }}
                        >
                          {task.title}
                        </h3>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                          {task.reasonVi}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          onClick={() => void handleSwapTask(task)}
                          data-testid={`today-swap-${task.gameId}`}
                        >
                          Đổi bài
                        </Button>
                        <Button
                          size="sm"
                          variant={isPrimaryNext ? 'primary' : 'secondary'}
                          skill={task.skillGroup}
                          rightIcon={<Play className="w-3.5 h-3.5" />}
                          onClick={() => navigate(`/play/${task.gameId}`)}
                          data-testid={`today-start-${task.gameId}`}
                        >
                          {task.completed ? 'Chơi lại' : 'Bắt đầu'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Compass className="w-7 h-7" />}
              title="Chưa có lịch học cá nhân hoá cho hôm nay"
              description="Bạn chưa làm bài định vị đầu vào hoặc chưa bắt đầu phiên học đầu tiên. Hãy định vị nhanh để hệ thống tự xếp 3–4 nhiệm vụ mỗi ngày, hoặc khám phá ngay 12 chế độ luyện tập."
              action={
                <Button
                  variant="primary"
                  skill="info"
                  hotkey="Enter"
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
        </div>

        {/* Cột phải: Đồng hồ Band ước lượng 4 kỹ năng */}
        <div className="lg:col-span-5">
          <Card padding="lg" className="space-y-5 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                    Band ước lượng
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                    Cập nhật tự động sau mỗi phiên luyện và thi thử
                  </p>
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

            <div className="space-y-2.5 mt-6">
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

              {state.totalCardsCount > 0 && (
                <div
                  className="px-3.5 py-2.5 rounded-[var(--radius-md)] border flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-dim)',
                  }}
                >
                  <span>Kho thẻ SRS đang hoạt động:</span>
                  <strong
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-vocab)' }}
                  >
                    {state.totalCardsCount} thẻ ({state.dueCardsCount} đến hạn)
                  </strong>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
