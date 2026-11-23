import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  BookA,
  Headphones,
  BookOpenText,
  PenLine,
  Mic,
  Timer as TimerIcon,
  Play,
  Clock,
  FileText,
} from 'lucide-react';
import { Card, Button, Pill } from '../../design/components';
import { GAME_REGISTRY, type GameSkill } from '../../games/registry';
import { modeLabelVi } from '../../core/adaptive/sessionLevel';

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

const skillIconMap: Record<GameSkill, React.ReactNode> = {
  vocab: <BookA className="w-5 h-5" />,
  listening: <Headphones className="w-5 h-5" />,
  reading: <BookOpenText className="w-5 h-5" />,
  writing: <PenLine className="w-5 h-5" />,
  speaking: <Mic className="w-5 h-5" />,
  exam: <TimerIcon className="w-5 h-5" />,
};

export const HubScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const [selectedSkill, setSelectedSkill] = useState<FilterSkill>('all');

  const filteredGames =
    selectedSkill === 'all'
      ? GAME_REGISTRY
      : GAME_REGISTRY.filter((g) => g.skill === selectedSkill);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            12 Chế độ luyện IELTS 8.0
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
            Chia thành 6 nhóm kỹ năng cốt lõi. Cơ chế chơi chính là hành động tạo ngôn ngữ và bắt bẫy đề thi.
          </p>
        </div>
        <Pill tone="info">6 nhóm · 12 chế độ</Pill>
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

      {/* Lưới 12 thẻ chế độ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredGames.map((game) => (
          <Card
            key={game.id}
            skillAccent={game.skill}
            padding="md"
            interactive
            onClick={() => navigate(`/play/${game.id}`)}
            className="flex flex-col justify-between gap-4"
            data-testid={`hub-card-${game.id}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: `var(--color-${game.skill})` }}>
                    {skillIconMap[game.skill]}
                  </span>
                  <Pill tone={game.skill}>
                    {game.code} · {game.skillLabelVi}
                  </Pill>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-xs tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {game.estMinutes[0]}–{game.estMinutes[1]}p
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                  {game.title}
                </h2>
                <p
                  className="text-sm mt-1 leading-relaxed"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  {game.subtitleVi}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex flex-wrap items-center gap-1.5">
                {game.requires.ai && (
                  <Pill tone="neutral" icon={<FileText className="w-3 h-3" />}>
                    Chấm qua Claude
                  </Pill>
                )}
                {game.requires.mic && (
                  <Pill tone="neutral" icon={<Mic className="w-3 h-3" />}>
                    Cần micro
                  </Pill>
                )}
                {!game.requires.ai && !game.requires.mic && (
                  <Pill tone="neutral">{game.modes.map(modeLabelVi).join(' · ')}</Pill>
                )}
              </div>

              <Button
                size="md"
                variant="secondary"
                skill={game.skill}
                rightIcon={<Play className="w-3.5 h-3.5" />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/play/${game.id}`);
                }}
              >
                Mở
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
