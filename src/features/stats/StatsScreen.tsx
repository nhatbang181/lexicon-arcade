import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Award,
  Clock,
  Flame,
  History,
  Layers,
  Snowflake,
  Star,
  Trophy,
} from 'lucide-react';
import { Button, Card, EmptyState, Pill, Skeleton } from '../../design/components';
import { getCardMastery, type MasteryStage } from '../../core/srs/faces';
import type { SRSCard } from '../../core/srs/fsrsAdapter';
import type { AttemptRecord, UserProfile } from '../../core/storage/db';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { essayRepo } from '../../core/storage/repos/essayRepo';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import { recordingRepo } from '../../core/storage/repos/recordingRepo';
import { getGameById } from '../../games/registry';

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
    requirementVi: '100 thẻ đạt Mature/Mastered',
    check: (c) => c.matureOrMastered >= 100 || c.unlockedIds.has('vocab_100_mature'),
  },
  {
    id: 'cards-500',
    file: 'cards-500.svg',
    titleVi: '500 thẻ vững',
    requirementVi: '500 thẻ đạt Mature/Mastered',
    check: (c) => c.matureOrMastered >= 500,
  },
  {
    id: 'cards-1000',
    file: 'cards-1000.svg',
    titleVi: '1.000 thẻ học thuật',
    requirementVi: '1.000 thẻ đạt Mature/Mastered',
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
  { stage: 'new', label: 'New', color: 'var(--color-text-faint)' },
  { stage: 'learning', label: 'Learning', color: 'var(--color-partial)' },
  { stage: 'young', label: 'Young', color: 'var(--color-listening)' },
  { stage: 'mature', label: 'Mature', color: 'var(--color-reading)' },
  { stage: 'mastered', label: 'Mastered', color: 'var(--color-vocab)' },
];

export const StatsScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cards, setCards] = useState<SRSCard[]>([]);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [essaysCount, setEssaysCount] = useState(0);
  const [recordingsCount, setRecordingsCount] = useState(0);

  const baseUrl = import.meta.env.BASE_URL;

  useEffect(() => {
    let active = true;
    void (async () => {
      const [p, c, a, essays, recordings] = await Promise.all([
        profileRepo.getOrCreate(),
        cardRepo.getAll(),
        attemptRepo.getRecent({ limit: 15 }),
        essayRepo.list(),
        recordingRepo.list(),
      ]);
      if (!active) return;
      setProfile(p);
      setCards(c);
      setAttempts(a);
      setEssaysCount(essays.length);
      setRecordingsCount(recordings.length);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const masteryCounts = useMemo(() => {
    const counts: Record<MasteryStage, number> = {
      new: 0,
      learning: 0,
      young: 0,
      mature: 0,
      mastered: 0,
    };
    for (const card of cards) {
      counts[getCardMastery(card)] += 1;
    }
    return counts;
  }, [cards]);

  const badgeContext = useMemo(() => {
    const unlockedIds = new Set(profile?.badges ?? []);
    return {
      streakLongest: Math.max(profile?.streak.count ?? 0, profile?.streak.longest ?? 0),
      matureOrMastered: masteryCounts.mature + masteryCounts.mastered,
      essaysCount,
      recordingsCount,
      overallBand: profile?.estimatedBands.overall ?? null,
      unlockedIds,
    };
  }, [essaysCount, masteryCounts.mastered, masteryCounts.mature, profile, recordingsCount]);

  if (loading) {
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

  const totalCards = cards.length;
  const unlockedBadgesCount = BADGE_TILES.filter((b) => b.check(badgeContext)).length;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Thống kê & Tiến độ
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
            Theo dõi chuỗi ngày học, tổng XP, phân bố bậc mastery FSRS và bộ sưu tập 12 huy hiệu.
          </p>
        </div>
        <Pill tone="vocab" icon={<Award className="w-3.5 h-3.5" />}>
          {unlockedBadgesCount} / {BADGE_TILES.length} huy hiệu
        </Pill>
      </div>

      {/* 4 KPI tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
            <span>Streak hiện tại</span>
            <Flame className="w-4 h-4" style={{ color: 'var(--color-writing)' }} />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {profile?.streak.count ?? 0} ngày
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-listening)' }}>
            <Snowflake className="w-3.5 h-3.5" />
            <span>{profile?.streak.freezes ?? 1} lượt đóng băng</span>
          </div>
        </Card>

        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
            <span>Kỷ lục Streak</span>
            <Trophy className="w-4 h-4" style={{ color: 'var(--color-partial)' }} />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {Math.max(profile?.streak.count ?? 0, profile?.streak.longest ?? 0)} ngày
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
            Chuỗi dài nhất từng đạt
          </div>
        </Card>

        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
            <span>Tổng XP</span>
            <Star className="w-4 h-4" style={{ color: 'var(--color-partial)' }} />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {(profile?.xp ?? 0).toLocaleString('vi-VN')}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
            {attempts.length} phiên gần đây
          </div>
        </Card>

        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
            <span>Tổng thẻ SRS</span>
            <Layers className="w-4 h-4" style={{ color: 'var(--color-vocab)' }} />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {totalCards}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-reading)' }}>
            {masteryCounts.mature + masteryCounts.mastered} thẻ Mature+
          </div>
        </Card>
      </div>

      {/* Phân bố bậc Mastery */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Phân bố thẻ theo bậc Mastery (FSRS)
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
              New → Learning → Young (&lt;21 ngày) → Mature (21–89 ngày) → Mastered (≥90 ngày)
            </p>
          </div>
          <Pill tone="neutral">{totalCards} thẻ</Pill>
        </div>

        {/* Thanh stacked bar */}
        <div
          className="h-4 w-full rounded-full overflow-hidden flex"
          style={{ backgroundColor: 'var(--color-surface-2)' }}
          aria-label="Phân bố thẻ FSRS"
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
                          <Clock className="w-3 h-3" />
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
              Tự động mở khoá theo kỷ luật streak, số thẻ Mature, bài viết/nói và cột mốc Band.
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
                  unlocked ? '' : 'opacity-55'
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
                <div className="space-y-0.5">
                  <div className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                    {badge.titleVi}
                  </div>
                  <div className="text-[11px] leading-snug" style={{ color: 'var(--color-text-dim)' }}>
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
