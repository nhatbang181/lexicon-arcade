import React from 'react';
import { RotateCcw, Home, Sparkles, AlertCircle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Pill } from './Pill';

export interface RecapMistakeItem {
  id: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  note?: string;
}

export interface RecapScreenProps {
  scoreLabel: string; // e.g. '8/10' or '7.5'
  xpEarned: number;
  winStatement: string;
  accuracyPercent?: number;
  durationSec?: number;
  mistakes?: RecapMistakeItem[];
  onRetryMistakes?: () => void;
  onGoToday: () => void;
  className?: string;
}

export const RecapScreen: React.FC<RecapScreenProps> = ({
  scoreLabel,
  xpEarned,
  winStatement,
  accuracyPercent = 80,
  durationSec = 240,
  mistakes = [],
  onRetryMistakes,
  onGoToday,
  className = '',
}) => {
  return (
    <Card padding="lg" className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <Pill tone="correct" icon={<Sparkles className="w-3.5 h-3.5" />}>
            Hoàn thành phiên luyện
          </Pill>
          <div className="mt-3 flex items-baseline gap-3">
            <span
              className="text-4xl sm:text-5xl font-extrabold tabular-nums"
              style={{ color: 'var(--color-text)' }}
            >
              {scoreLabel}
            </span>
            <span
              className="text-base font-semibold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-correct)' }}
            >
              +{xpEarned} XP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="px-4 py-2.5 rounded-[var(--radius-md)] border text-center"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Chính xác
            </div>
            <div
              className="text-lg font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
            >
              {accuracyPercent}%
            </div>
          </div>
          <div
            className="px-4 py-2.5 rounded-[var(--radius-md)] border text-center"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Thời gian
            </div>
            <div
              className="text-lg font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
            >
              {Math.floor(durationSec / 60)}p {durationSec % 60}s
            </div>
          </div>
        </div>
      </div>

      {/* Câu thắng */}
      <div
        className="p-4 rounded-[var(--radius-md)] border"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-info) 10%, var(--color-surface-2))',
          borderColor: 'color-mix(in srgb, var(--color-info) 35%, var(--color-border))',
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-info)' }}>
          Điểm sáng phiên này
        </p>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text)' }}>
          {winStatement}
        </p>
      </div>

      {/* Danh sách câu sai */}
      {mistakes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            <AlertCircle className="w-4 h-4" style={{ color: 'var(--color-wrong)' }} />
            <span>Cần xem lại ({mistakes.length} câu)</span>
          </div>
          <div className="space-y-2">
            {mistakes.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-[var(--radius-md)] border text-sm space-y-1"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {m.prompt}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--color-wrong)' }}>Bạn gõ: {m.userAnswer}</span>
                  <span style={{ color: 'var(--color-correct)' }}>Đúng: {m.correctAnswer}</span>
                </div>
                {m.note && (
                  <p className="text-xs pt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                    {m.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {mistakes.length > 0 && onRetryMistakes && (
          <Button
            variant="secondary"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={onRetryMistakes}
          >
            Ôn ngay {mistakes.length} câu sai
          </Button>
        )}
        <Button
          variant="primary"
          hotkey="Enter"
          leftIcon={<Home className="w-4 h-4" />}
          onClick={onGoToday}
        >
          Về Hôm nay
        </Button>
      </div>
    </Card>
  );
};
