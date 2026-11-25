import React, { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Clock, Compass, FileText, Mic, Play } from 'lucide-react';
import { Button, LiveCard, Mascot, Pill, Sheet, Skeleton } from '../../design/components';
import {
  GAME_REGISTRY,
  type GameDefinition,
  type GameId,
  type GameSkill,
} from '../../games/registry';
import { levelToBand, modeLabelVi } from '../../core/adaptive/sessionLevel';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import { useAsyncData } from '../../features/shared/useAsyncData';
import { ScreenErrorState } from '../../features/shared/ScreenErrorState';

type FilterSkill = 'all' | GameSkill;

const FILTER_TABS: Array<{ id: FilterSkill; label: string }> = [
  { id: 'all', label: 'Tất cả (12)' },
  { id: 'vocab', label: 'Từ vựng (3)' },
  { id: 'listening', label: 'Listening (2)' },
  { id: 'reading', label: 'Reading (2)' },
  { id: 'writing', label: 'Writing (2)' },
  { id: 'speaking', label: 'Speaking (2)' },
  { id: 'exam', label: 'Thi thử (1)' },
];

const MODE_DESC_VI: Record<'training' | 'exam' | 'sprint', string> = {
  training: 'Có giải thích ngay, bằng chứng bấm được, không áp lực đồng hồ.',
  exam: 'Đúng nhịp phòng thi thật, không gợi ý hay hiệu ứng trong lúc làm.',
  sprint: 'Phiên ngắn 5–10 phút tập trung tốc độ và phản xạ.',
};

interface HubStatsData {
  skillLevels: Partial<Record<GameId, number>>;
  sessionsByGame: Partial<Record<GameId, number>>;
}

export const HubScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const [selectedSkill, setSelectedSkill] = useState<FilterSkill>('all');
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null);
  const baseUrl = import.meta.env.BASE_URL;

  const loadHubStats = useCallback(async (): Promise<HubStatsData> => {
    const [profile, recent] = await Promise.all([
      profileRepo.getOrCreate(),
      attemptRepo.getRecent({ limit: 120 }),
    ]);
    const sessionsByGame: Partial<Record<GameId, number>> = {};
    for (const a of recent) {
      sessionsByGame[a.gameId] = (sessionsByGame[a.gameId] ?? 0) + 1;
    }
    return {
      skillLevels: profile.skillLevels,
      sessionsByGame,
    };
  }, []);

  const { data: hubStats, loading, error, reload } = useAsyncData(loadHubStats, [loadHubStats]);

  const { readyGames, comingSoonGames } = useMemo(() => {
    const filtered =
      selectedSkill === 'all'
        ? GAME_REGISTRY
        : GAME_REGISTRY.filter((g) => g.skill === selectedSkill);
    return {
      readyGames: filtered.filter((g) => g.status === 'ready'),
      comingSoonGames: filtered.filter((g) => g.status !== 'ready'),
    };
  }, [selectedSkill]);

  const launchGame = (game: GameDefinition, mode: 'training' | 'exam' | 'sprint') => {
    setActiveGame(null);
    const query = mode !== 'training' ? `?mode=${encodeURIComponent(mode)}` : '';
    navigate(`/play/${game.id}${query}`);
  };

  if (error) {
    return (
      <ScreenErrorState
        title="Không tải được danh sách chế độ"
        error={error}
        code="ERR-HUB-LOAD"
        onRetry={() => void reload()}
      />
    );
  }

  const renderGameCard = (game: GameDefinition, comingSoon = false) => {
    const level = hubStats?.skillLevels[game.id] ?? 1;
    const bandEst = levelToBand(level);
    const sessions = hubStats?.sessionsByGame[game.id] ?? 0;

    return (
      <LiveCard
        key={game.id}
        skill={game.skill}
        onClick={() => setActiveGame(game)}
        ariaLabel={`${game.code} ${game.title}`}
        className={`h-full ${comingSoon ? 'opacity-80' : ''}`}
      >
        <div
          className="flex flex-col justify-between gap-4 h-full"
          data-testid={`hub-card-${game.id}`}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {/* Icon Fluent 3D riêng cho từng game */}
              <div
                className="w-14 h-14 rounded-[var(--radius-md)] border flex items-center justify-center shrink-0 p-1.5"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--color-${game.skill}) 14%, var(--color-surface-2))`,
                  borderColor: `color-mix(in srgb, var(--color-${game.skill}) 35%, var(--color-border))`,
                }}
              >
                <img
                  src={`${baseUrl}assets/icons/fluent/games/${game.id}.webp`}
                  alt=""
                  width={44}
                  height={44}
                  loading="lazy"
                  decoding="async"
                  className="w-11 h-11 object-contain"
                />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Pill tone={game.skill}>
                    {game.code} · {game.skillLabelVi}
                  </Pill>
                  {comingSoon && <Pill tone="neutral">Sắp có</Pill>}
                </div>
                <span
                  className="inline-flex items-center gap-1 text-xs tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {game.estMinutes[0]}–{game.estMinutes[1]} phút
                  {!comingSoon && ` · Band ≈ ${bandEst.toFixed(1)}`}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {game.title}
              </h2>
              <p
                className="text-sm mt-1 leading-relaxed min-h-[3.75rem] line-clamp-3"
                style={{ color: 'var(--color-text-dim)' }}
              >
                {game.subtitleVi}
              </p>
            </div>
          </div>

          <div
            className="pt-3 border-t flex items-center justify-between gap-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {game.requires.ai && (
                <Pill tone="neutral" icon={<FileText className="w-3.5 h-3.5" />}>
                  Chấm qua Claude
                </Pill>
              )}
              {game.requires.mic && (
                <Pill tone="neutral" icon={<Mic className="w-3.5 h-3.5" />}>
                  Cần micro
                </Pill>
              )}
              {!game.requires.ai && !game.requires.mic && (
                <Pill tone="neutral">
                  {sessions > 0
                    ? `${sessions} phiên đã luyện`
                    : game.modes.map(modeLabelVi).join(' · ')}
                </Pill>
              )}
            </div>

            <span
              className="inline-flex items-center gap-1 text-xs font-semibold shrink-0"
              style={{ color: comingSoon ? 'var(--color-text-dim)' : `var(--color-${game.skill})` }}
            >
              {comingSoon ? 'Xem trước' : game.modes.length > 1 ? 'Chọn chế độ' : 'Vào luyện'}
              <Play className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </LiveCard>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Hub (M1 ≥ 15% + M3 Lexi + icon màu Fluent 3D) */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border p-4 sm:p-5 min-h-[160px] md:min-h-[205px] flex flex-col justify-between gap-3"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          backgroundImage: `linear-gradient(135deg, color-mix(in srgb, var(--color-vocab) 12%, transparent), color-mix(in srgb, var(--color-reading) 10%, transparent)), url(${baseUrl}assets/illustrations/goals.svg)`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right -12px bottom -12px',
          backgroundSize: 'cover',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, var(--color-surface) 0%, color-mix(in srgb, var(--color-surface) 92%, transparent) 70%, color-mix(in srgb, var(--color-surface) 78%, transparent) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="info">9 sẵn sàng · 3 sắp có</Pill>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              12 Chế độ luyện IELTS 8.0
            </h1>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--color-text-dim)' }}>
              Chọn thẻ game để xem mô tả và chọn chế độ Luyện tập hoặc Thi thử.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1" aria-label="4 nhóm kỹ năng chính">
              {[
                { file: 'rocket.webp', label: 'Từ vựng' },
                { file: 'compass.webp', label: 'Đọc · Nghe' },
                { file: 'brain.webp', label: 'Viết · Nói' },
                { file: 'shield.webp', label: 'Thi thử' },
              ].map((item) => (
                <span
                  key={item.file}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] border text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  <img
                    src={`${baseUrl}assets/icons/fluent/ui/${item.file}`}
                    alt=""
                    width={32}
                    height={32}
                    loading="lazy"
                    decoding="async"
                    className="w-8 h-8 object-contain shrink-0"
                  />
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>
          <Mascot
            state="co-vu"
            size={76}
            say="Chọn kỹ năng luyện nhé!"
            className="shrink-0"
          />
        </div>
      </div>

      {/* Bộ lọc nhóm kỹ năng */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Lọc chế độ theo nhóm kỹ năng"
      >
        {FILTER_TABS.map((tab) => {
          const active = selectedSkill === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedSkill(tab.id)}
              className="px-3.5 py-2 min-h-[44px] rounded-[var(--radius-md)] border text-sm font-medium whitespace-nowrap transition-colors cursor-pointer"
              style={{
                backgroundColor: active
                  ? 'color-mix(in srgb, var(--color-info) 16%, var(--color-surface))'
                  : 'var(--color-surface)',
                borderColor: active ? 'var(--color-info)' : 'var(--color-border)',
                color: active ? 'var(--color-text)' : 'var(--color-text-dim)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      )}

      {/* Nhóm 1: Các chế độ đã sẵn sàng (U5, U11) */}
      {!loading && readyGames.length > 0 && (
        <section className="space-y-3" aria-label="Chế độ sẵn sàng luyện">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            Sẵn sàng luyện ({readyGames.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {readyGames.map((g) => renderGameCard(g, false))}
          </div>
        </section>
      )}

      {/* Nhóm 2: Đẩy "Sắp có" (S1, S2, X1) xuống cuối (U5, U11) */}
      {!loading && comingSoonGames.length > 0 && (
        <section
          className="space-y-3 pt-4 border-t"
          style={{ borderColor: 'var(--color-border)' }}
          aria-label="Chế độ sắp có"
          data-testid="hub-coming-soon-section"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4" style={{ color: 'var(--color-text-dim)' }} />
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text-dim)' }}>
                Sắp có ({comingSoonGames.length})
              </h2>
            </div>
            <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Speaking & Phòng thi thử đang hoàn thiện
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {comingSoonGames.map((g) => renderGameCard(g, true))}
          </div>
        </section>
      )}

      {/* U5: Sheet chọn chế độ Luyện / Thi / Tăng tốc */}
      <Sheet
        open={activeGame !== null}
        onClose={() => setActiveGame(null)}
        title={activeGame ? `${activeGame.code} · ${activeGame.title}` : ''}
        subtitle={activeGame?.subtitleVi}
        side="bottom"
      >
        {activeGame && (
          <div className="space-y-4" data-testid="hub-mode-sheet">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={activeGame.skill}>{activeGame.skillLabelVi}</Pill>
              <Pill tone="neutral" icon={<Clock className="w-3.5 h-3.5" />}>
                {activeGame.estMinutes[0]}–{activeGame.estMinutes[1]} phút
              </Pill>
              {activeGame.status === 'ready' && (
                <Pill tone="info">
                  Band ≈ {levelToBand(hubStats?.skillLevels[activeGame.id] ?? 1).toFixed(1)}
                </Pill>
              )}
              {activeGame.status !== 'ready' && <Pill tone="neutral">Sắp có</Pill>}
            </div>

            {activeGame.status === 'ready' ? (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold" style={{ color: 'var(--color-text-dim)' }}>
                  Chọn chế độ bắt đầu:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeGame.modes.map((mode, idx) => (
                    <div
                      key={mode}
                      className="p-3.5 rounded-[var(--radius-md)] border flex flex-col justify-between gap-3"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor:
                          idx === 0 ? `var(--color-${activeGame.skill})` : 'var(--color-border)',
                      }}
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                          {modeLabelVi(mode)}
                        </div>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: 'var(--color-text-dim)' }}
                        >
                          {MODE_DESC_VI[mode]}
                        </p>
                      </div>
                      <Button
                        variant={idx === 0 ? 'primary' : 'secondary'}
                        skill={activeGame.skill}
                        rightIcon={<Play className="w-4 h-4" />}
                        onClick={() => launchGame(activeGame, mode)}
                        data-testid={`hub-launch-${activeGame.id}-${mode}`}
                        className="w-full"
                      >
                        Bắt đầu · {modeLabelVi(mode)}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
                  Chế độ này đang trong lộ trình phát triển tiếp theo. Bạn có thể xem trước mô tả
                  hoặc chọn các chế độ đã sẵn sàng ở trên.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => launchGame(activeGame, activeGame.modes[0] ?? 'training')}
                  data-testid={`hub-preview-${activeGame.id}`}
                >
                  Xem màn giới thiệu
                </Button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
};
