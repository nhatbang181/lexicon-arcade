import React from 'react';
import { ArrowLeft, Sparkles, Clock, Mic, Headphones, FileText } from 'lucide-react';
import { Card, Button, Pill } from '../design/components';
import type { GameDefinition, GameProps } from '../games/registry';
import { playChipLabel } from '../core/adaptive/sessionLevel';

export function createGamePlaceholder(game: Omit<GameDefinition, 'load'>): React.FC<GameProps> {
  const PlaceholderGame: React.FC<GameProps & { calibrated?: boolean }> = ({
    mode,
    level,
    calibrated = false,
    onExit,
  }) => {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card skillAccent={game.skill} padding="lg" className="max-w-xl w-full space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Pill tone={game.skill}>{game.code} · {game.skillLabelVi}</Pill>
              <Pill tone="info" icon={<Sparkles className="w-3.5 h-3.5" />}>
                Sắp có trong bản cập nhật tới
              </Pill>
            </div>
            <span
              className="text-xs font-medium"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            >
              Chế độ: {playChipLabel({ mode, level, calibrated })}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {game.title}
            </h1>
            <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
              {game.subtitleVi}
            </p>
          </div>

          <div
            className="p-4 rounded-[var(--radius-md)] border space-y-2 text-sm"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Clock className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
              <span>
                Thời lượng mỗi phiên: <strong>{game.estMinutes[0]}–{game.estMinutes[1]} phút</strong>
              </span>
            </div>
            {game.requires.audio && (
              <div className="flex items-center gap-2" style={{ color: 'var(--color-text-dim)' }}>
                <Headphones className="w-4 h-4" />
                <span>Yêu cầu tai nghe / loa để nghe audio học thuật Kokoro offline.</span>
              </div>
            )}
            {game.requires.mic && (
              <div className="flex items-center gap-2" style={{ color: 'var(--color-text-dim)' }}>
                <Mic className="w-4 h-4" />
                <span>Yêu cầu micro để thu âm và đo chỉ số Fluency trực tiếp.</span>
              </div>
            )}
            {game.requires.ai && (
              <div className="flex items-center gap-2" style={{ color: 'var(--color-text-dim)' }}>
                <FileText className="w-4 h-4" />
                <span>Hỗ trợ xuất bài để Claude chấm theo 4 tiêu chí IELTS (0 đồng).</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              hotkey="Esc"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => onExit()}
            >
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  PlaceholderGame.displayName = `Placeholder(${game.code})`;
  return PlaceholderGame;
}
