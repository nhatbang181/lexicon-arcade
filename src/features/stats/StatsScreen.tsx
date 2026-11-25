import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Award,
  CheckCircle2,
  Clock,
  Flame,
  History,
  Layers,
  ShieldCheck,
  Snowflake,
  Star,
  Trophy,
} from 'lucide-react';
import { Button, Card, EmptyState, Pill, Skeleton, Toast } from '../../design/components';
import { getCardMastery, type MasteryStage } from '../../core/srs/faces';
import type { SRSCard } from '../../core/srs/fsrsAdapter';
import {
  computeMasteryMetrics,
  type MasteryMetrics,
} from '../../core/gamification/mastery';
import {
  displayStreakCount,
  MAX_STREAK_FREEZES,
  type StreakEvent,
} from '../../core/gamification/streak';
import { xpToLevel } from '../../core/gamification/xp';
import {
  computeFourStrands,
  type FourStrandsSummary,
  type StrandId,
} from '../../core/planner/today';
import {
  db,
  type AttemptRecord,
  type UserProfile,
} from '../../core/storage/db';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { essayRepo } from '../../core/storage/repos/essayRepo';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import { recordingRepo } from '../../core/storage/repos/recordingRepo';
import { getGameById } from '../../games/registry';
import { useAsyncData } from '../shared/useAsyncData';
import { ScreenErrorState } from '../shared/ScreenErrorState';

interface BadgeTileDef {
  id: string;
  file: string;
  titleVi: string;
  requirementVi: string;
  check: (ctx: {
    streakLongest: number;
    matureOrMastered: number;
    essaysCount: number;
    recordingsCount: number;
    overallBand: number | null;
    unlockedIds: ReadonlySet<string>;
  }) => boolean;
}

const BADGE_TILES: readonly BadgeTileDef[] = [
  {
    id: 'streak-7',
    file: 'streak-7.svg',
    titleVi: 'Nhịp 7 ngày',
    requirementVi: 'Chuỗi học 7 ngày liên tiếp',
    check: (c) => c.streakLongest >= 7 || c.unlockedIds.has('streak_7'),
  },
  {
    id: 'streak-30',
    file: 'streak-30.svg',
    titleVi: 'Thói quen 30 ngày',
    requirementVi: 'Chuỗi học 30 ngày liên tiếp',
    check: (c) => c.streakLongest >= 30 || c.unlockedIds.has('streak_30'),
  },
  {
    id: 'streak-100',
    file: 'streak-100.svg',
    titleVi: 'Kỷ luật 100 ngày',
    requirementVi: 'Chuỗi học 100 ngày liên tiếp',
    check: (c) => c.streakLongest >= 100,
  },
  {
    id: 'cards-100',
    file: 'cards-100.svg',
    titleVi: '100 thẻ vững',
    requirementVi: '100 thẻ đạt Vững trở lên',
    check: (c) => c.matureOrMastered >= 100 || c.unlockedIds.has('vocab_100_mature'),
  },
  {
    id: 'cards-500',
    file: 'cards-500.svg',
    titleVi: '500 thẻ vững',
    requirementVi: '500 thẻ đạt Vững trở lên',
    check: (c) => c.matureOrMastered >= 500,
  },
  {
    id: 'cards-1000',
    file: 'cards-1000.svg',
    titleVi: '1.000 thẻ học thuật',
    requirementVi: '1.000 thẻ đạt Vững trở lên',
    check: (c) => c.matureOrMastered >= 1000,
  },
  {
    id: 'first-essay',
    file: 'first-essay.svg',
    titleVi: 'Bài luận đầu tiên',
    requirementVi: 'Hoàn thành 1 bài Writing W1',
    check: (c) => c.essaysCount >= 1 || c.unlockedIds.has('essay_reviser'),
  },
  {
    id: 'first-speaking',
    file: 'first-speaking.svg',
    titleVi: 'Phiên nói đầu tiên',
    requirementVi: 'Hoàn thành 1 bản thu Speaking',
    check: (c) => c.recordingsCount >= 1,
  },
  {
    id: 'band-65',
    file: 'band-65.svg',
    titleVi: 'Cột mốc 6.5',
    requirementVi: 'Overall ước lượng ≥ 6.5',
    check: (c) => c.overallBand !== null && c.overallBand >= 6.5,
  },
  {
    id: 'band-70',
    file: 'band-70.svg',
    titleVi: 'Cột mốc 7.0',
    requirementVi: 'Overall ước lượng ≥ 7.0',
    check: (c) => (c.overallBand !== null && c.overallBand >= 7.0) || c.unlockedIds.has('band_7_0'),
  },
  {
    id: 'band-75',
    file: 'band-75.svg',
    titleVi: 'Cột mốc 7.5',
    requirementVi: 'Overall ước lượng ≥ 7.5',
    check: (c) => c.overallBand !== null && c.overallBand >= 7.5,
  },
  {
    id: 'band-80',
    file: 'band-80.svg',
    titleVi: 'Đích đến 8.0',
    requirementVi: 'Overall ước lượng ≥ 8.0 Academic',
    check: (c) => (c.overallBand !== null && c.overallBand >= 8.0) || c.unlockedIds.has('band_8_0'),
  },
];

const MASTERY_META: ReadonlyArray<{
  stage: MasteryStage;
  label: string;
  color: string;
}> = [
  { stage: 'new', label: 'Mới', color: 'var(--color-text-faint)' },
  { stage: 'learning', label: 'Đang học', color: 'var(--color-partial)' },
  { stage: 'young', label: 'Mới quen', color: 'var(--color-listening)' },
  { stage: 'mature', label: 'Khá vững', color: 'var(--color-reading)' },
  { stage: 'mastered', label: 'Rất vững', color: 'var(--color-vocab)' },
];

const STRAND_COLORS: Record<StrandId, string> = {
  input: 'var(--color-listening)',
  output: 'var(--color-writing)',
  language: 'var(--color-vocab)',
  fluency: 'var(--color-reading)',
};

interface StatsPayload {
  profile: UserProfile;
  cards: SRSCard[];
  attempts: AttemptRecord[];
  essaysCount: number;
  recordingsCount: number;
  masteryMetrics: MasteryMetrics;
  fourStrands: FourStrandsSummary;
  activeTurnRatio: number | null;
  pendingStreak: StreakEvent | null;
}

export const StatsScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const [streakToast, setStreakToast] = useState<StreakEvent | null>(null);
  const baseUrl = import.meta.env.BASE_URL;

  const loadStats = useCallback(async (): Promise<StatsPayload> => {
    const now = new Date();
    const [profile, cards, reviews, allRecentAttempts, essays, recordings, turnSummary, pendingStreak] =
      await Promise.all([
        profileRepo.getOrCreate(),
        cardRepo.getAll(),
        db.reviews.toArray(),
        attemptRepo.getRecent({ limit: 80 }),
        essayRepo.list(),
        recordingRepo.list(),
        attemptRepo.getTurnKindSummary(now.getTime() - 7 * 86_400_000),
        attemptRepo.consumePendingStreakEvent(),
      ]);

    const masteryMetrics = computeMasteryMetrics(cards, reviews);
    const fourStrands = computeFourStrands(
      allRecentAttempts.map((a) => ({
        gameId: a.gameId,
        startedAt: a.startedAt,
        endedAt: a.endedAt,
        mode: a.mode,
      })),
      now,
      7,
    );

    return {
      profile,
      cards,
      attempts: allRecentAttempts.slice(0, 15),
      essaysCount: essays.length,
      recordingsCount: recordings.length,
      masteryMetrics,
      fourStrands,
      activeTurnRatio: turnSummary.activeRatio,
      pendingStreak,
    };
  }, []);

  const { data, loading, error, reload } = useAsyncData(loadStats, [loadStats]);

  useEffect(() => {
    if (data?.pendingStreak) {
      setStreakToast(data.pendingStreak);
    }
  }, [data?.pendingStreak]);

  const masteryCounts = useMemo(() => {
    const counts: Record<MasteryStage, number> = {
      new: 0,
      learning: 0,
      young: 0,
      mature: 0,
      mastered: 0,
    };
    for (const card of data?.cards ?? []) {
      counts[getCardMastery(card)] += 1;
    }
    return counts;
  }, [data?.cards]);

  const badgeContext = useMemo(() => {
    const unlockedIds = new Set(data?.profile.badges ?? []);
    return {
      streakLongest: Math.max(
        data?.profile.streak.count ?? 0,
        data?.profile.streak.longest ?? 0,
      ),
      matureOrMastered: masteryCounts.mature + masteryCounts.mastered,
      essaysCount: data?.essaysCount ?? 0,
      recordingsCount: data?.recordingsCount ?? 0,
      overallBand: data?.profile.estimatedBands.overall ?? null,
      unlockedIds,
    };
  }, [data, masteryCounts.mastered, masteryCounts.mature]);

  if (error) {
    return (
      <ScreenErrorState
        title="Không tải được trang Thống kê"
        error={error}
        code="ERR-STATS-LOAD"
        onRetry={() => void reload()}
      />
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-9 w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton lines={5} />
      </div>
    );
  }

  const { profile, cards, attempts, masteryMetrics, fourStrands, activeTurnRatio } = data;
  const totalCards = cards.length;
  const levelInfo = xpToLevel(profile.xp);
  const currentStreak = displayStreakCount(profile.streak);
  const unlockedBadgesCount = BADGE_TILES.filter((b) => b.check(badgeContext)).length;
  const delayedRatePct =
    masteryMetrics.delayedRetention.rate !== null
      ? Math.round(masteryMetrics.delayedRetention.rate * 100)
      : null;

  return (
    <div className="space-y-6 pb-10">
      {streakToast && (
        <Toast
          tone="info"
          title={
            streakToast.freezeUsed
              ? `Đóng băng đã cứu chuỗi ${streakToast.count} ngày của bạn!`
              : `Nhận thêm +1 lượt đóng băng chuỗi (${streakToast.freezes}/${MAX_STREAK_FREEZES})`
          }
          description={
            streakToast.freezeUsed
              ? `Ngày ${streakToast.protectedDate ?? 'hôm qua'} đã được bảo vệ tự động.`
              : 'Mỗi 7 ngày học đều sẽ tích thêm 1 lượt bảo vệ chuỗi.'
          }
          onDismiss={() => setStreakToast(null)}
        />
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Thống kê & Tiến độ
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
            Theo dõi chuỗi ngày học, cấp độ XP, số từ vững sau 7 ngày, cân bằng 4 mạch và 12 huy hiệu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="info" icon={<Star className="w-3.5 h-3.5" />}>
            Cấp {levelInfo.level}
          </Pill>
          <Pill tone="vocab" icon={<Award className="w-3.5 h-3.5" />}>
            {unlockedBadgesCount} / {BADGE_TILES.length} huy hiệu
          </Pill>
        </div>
      </div>

      {/* 4 KPI tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
            <span>Chuỗi hiện tại</span>
            <Flame className="w-4 h-4" style={{ color: 'var(--color-writing)' }} />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {currentStreak} ngày
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-listening)' }}>
            <Snowflake className="w-3.5 h-3.5 shrink-0" />
            <span>
              {profile.streak.freezes}/{MAX_STREAK_FREEZES} đóng băng
            </span>
          </div>
        </Card>

        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
            <span>Kỷ lục chuỗi</span>
            <Trophy className="w-4 h-4" style={{ color: 'var(--color-partial)' }} />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {Math.max(profile.streak.count, profile.streak.longest)} ngày
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
            {profile.streak.freezeUsedDates.length > 0
              ? `Đã cứu ${profile.streak.freezeUsedDates.length} lần`
              : 'Chuỗi dài nhất từng đạt'}
          </div>
        </Card>

        <Card padding="md" className="space-y-1.5" data-testid="stats-level-card">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
            <span>Cấp {levelInfo.level} · Tổng XP</span>
            <Star className="w-4 h-4" style={{ color: 'var(--color-partial)' }} />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {profile.xp.toLocaleString('vi-VN')}
          </div>
          <div className="space-y-1">
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-2)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(levelInfo.progress * 100)}%`,
                  backgroundColor: 'var(--color-partial)',
                }}
              />
            </div>
            <div className="text-xs tabular-nums" style={{ color: 'var(--color-text-dim)' }}>
              {levelInfo.currentLevelXp}/{levelInfo.nextLevelXp} XP lên cấp {levelInfo.level + 1}
            </div>
          </div>
        </Card>

        <Card padding="md" className="space-y-1.5" data-testid="stats-mastered-card">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
            <span>Từ vững (≥ 21 ngày)</span>
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--color-vocab)' }} />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {masteryMetrics.masteredCount}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-reading)' }}>
            {delayedRatePct !== null
              ? `Giữ nhớ ≥ 7 ngày: ${delayedRatePct}% (${masteryMetrics.delayedRetention.correct}/${masteryMetrics.delayedRetention.total})`
              : `${totalCards} thẻ đang theo dõi`}
          </div>
        </Card>
      </div>

      {/* PP-06: Cân bằng 4 mạch học Paul Nation (7 ngày) */}
      <Card padding="lg" className="space-y-4" data-testid="stats-four-strands">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Cân bằng 4 mạch học (7 ngày gần nhất)
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
              Cân bằng ~25% mỗi mạch giúp tăng tốc độ đọc-nghe và khả năng dùng từ chủ động. Mạch dưới
              15% sẽ được Hôm nay đề xuất bù.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTurnRatio !== null && (
              <Pill tone="info">
                Gợi nhớ/Sản xuất: {Math.round(activeTurnRatio * 100)}%
              </Pill>
            )}
            <Pill tone="neutral">{fourStrands.totalMinutes} phút</Pill>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['input', 'output', 'language', 'fluency'] as const).map((id) => {
            const st = fourStrands.strands[id];
            return (
              <div
                key={id}
                className="p-3.5 rounded-[var(--radius-md)] border space-y-2"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: st.underrepresented ? 'var(--color-partial)' : 'var(--color-border)',
                }}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span style={{ color: 'var(--color-text)' }}>{st.labelVi}</span>
                  <span
                    className="font-bold tabular-nums"
                    style={{ fontFamily: 'var(--font-mono)', color: STRAND_COLORS[id] }}
                  >
                    {st.pct}%
                  </span>
                </div>
                <div
                  className="h-2 w-full rounded-full overflow-hidden"
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
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  <span>{st.minutes} phút</span>
                  {st.underrepresented && (
                    <span style={{ color: 'var(--color-partial)' }}>Cần bù</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Phân bố bậc trí nhớ thẻ ôn */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Phân bố độ vững của thẻ ôn
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
              Mới → Đang học → Mới quen (&lt;21 ngày) → Khá vững (21–89 ngày) → Rất vững (≥90 ngày)
            </p>
          </div>
          <Pill tone="neutral" icon={<Layers className="w-3.5 h-3.5" />}>
            {totalCards} thẻ
          </Pill>
        </div>

        <div
          className="h-4 w-full rounded-full overflow-hidden flex"
          style={{ backgroundColor: 'var(--color-surface-2)' }}
          aria-label="Phân bố độ vững thẻ ôn"
        >
          {totalCards > 0 &&
            MASTERY_META.map((m) => {
              const count = masteryCounts[m.stage];
              if (count === 0) return null;
              const pct = (count / totalCards) * 100;
              return (
                <div
                  key={m.stage}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: m.color,
                  }}
                  title={`${m.label}: ${count} thẻ (${Math.round(pct)}%)`}
                />
              );
            })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {MASTERY_META.map((m) => (
            <div
              key={m.stage}
              className="p-3 rounded-[var(--radius-md)] border space-y-1"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: m.color }}
                />
                <span style={{ color: 'var(--color-text-dim)' }}>{m.label}</span>
              </div>
              <div
                className="text-xl font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
              >
                {masteryCounts[m.stage]}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Danh sách phiên học gần nhất */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Phiên học gần nhất
          </h2>
        </div>

        {attempts.length === 0 ? (
          <EmptyState
            title="Chưa có phiên học nào được ghi nhận"
            description="Hoàn thành phiên Daily Run (V1), Collocation Forge (V2) hoặc Paraphrase Radar (V3) để thấy lịch sử tiến bộ tại đây."
            action={
              <Button variant="primary" skill="vocab" onClick={() => navigate('/play/v1')}>
                Chơi V1 Daily Run ngay
              </Button>
            }
          />
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {attempts.map((a) => {
              const game = getGameById(a.gameId);
              const durationMin = Math.max(1, Math.round((a.endedAt - a.startedAt) / 60_000));
              const dateStr = new Date(a.endedAt).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={a.id ?? `${a.gameId}-${a.startedAt}`}
                  className="py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Pill tone={game?.skill ?? 'info'}>
                      {game?.code ?? a.gameId.toUpperCase()}
                    </Pill>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {game?.title ?? a.gameId}
                      </div>
                      <div className="text-xs flex items-center gap-2" style={{ color: 'var(--color-text-dim)' }}>
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {durationMin}p
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 text-sm font-bold tabular-nums"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    <span style={{ color: 'var(--color-text)' }}>
                      {a.score}/{a.total}
                    </span>
                    <span style={{ color: 'var(--color-correct)' }}>+{a.xp} XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Lưới 12 huy hiệu */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Bộ sưu tập 12 Huy hiệu
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
              Tự động mở khoá theo kỷ luật chuỗi ngày, số thẻ vững, bài viết/nói và cột mốc Band.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {BADGE_TILES.map((badge) => {
            const unlocked = badge.check(badgeContext);
            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-[var(--radius-md)] border flex flex-col items-center text-center gap-2 transition-opacity ${
                  unlocked ? '' : 'opacity-60'
                }`}
                style={{
                  backgroundColor: unlocked
                    ? 'color-mix(in srgb, var(--color-vocab) 10%, var(--color-surface-2))'
                    : 'var(--color-surface-2)',
                  borderColor: unlocked ? 'var(--color-vocab)' : 'var(--color-border)',
                }}
              >
                <img
                  src={`${baseUrl}assets/icons/badges/${badge.file}`}
                  alt={badge.titleVi}
                  className={`w-12 h-12 object-contain ${unlocked ? '' : 'grayscale'}`}
                />
                <div className="space-y-1">
                  <div className="text-xs font-bold flex items-center justify-center gap-1" style={{ color: 'var(--color-text)' }}>
                    {unlocked && (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-correct)' }} />
                    )}
                    <span>{badge.titleVi}</span>
                  </div>
                  <div className="text-xs leading-snug" style={{ color: 'var(--color-text-dim)' }}>
                    {badge.requirementVi}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
