import React, { Suspense, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { X, Volume2, VolumeX } from 'lucide-react';
import { getGameById } from '../../games/registry';
import { Button, Skeleton, EmptyState } from '../../design/components';
import { useAudio } from '../providers';

export interface PlayScreenProps {
  gameId: string;
}

export const PlayScreen: React.FC<PlayScreenProps> = ({ gameId }) => {
  const [, navigate] = useLocation();
  const { muted, toggleMute } = useAudio();
  const game = getGameById(gameId);

  const LazyGame = useMemo(() => {
    if (!game) return null;
    return React.lazy(game.load);
  }, [game]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/hub');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [navigate]);

  if (!game || !LazyGame) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <EmptyState
          title={`Không tìm thấy chế độ "${gameId}"`}
          description="Mã chế độ không tồn tại trong bảng 12 chế độ chuẩn."
          action={
            <Button variant="primary" onClick={() => navigate('/hub')}>
              Quay lại Hub 12 chế độ
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Thanh trên 56px chuẩn 08 §4 & 09 §6 */}
      <header
        className="h-14 px-4 border-b flex items-center justify-between gap-4 shrink-0"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hub')}
            className="inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] border cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-dim)',
            }}
            aria-label="Thoát phiên (Esc)"
            title="Thoát (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: `var(--color-${game.skill})` }}
          />
          <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--color-text)' }}>
            {game.code} · {game.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-xs font-semibold tabular-nums px-2.5 py-1 rounded border"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-dim)',
            }}
          >
            Level 1 · Training
          </span>

          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] border cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-dim)',
            }}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-xl mx-auto p-8 space-y-4">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton lines={4} />
            </div>
          }
        >
          <LazyGame mode="training" level={1} onExit={() => navigate('/hub')} />
        </Suspense>
      </main>
    </div>
  );
};
