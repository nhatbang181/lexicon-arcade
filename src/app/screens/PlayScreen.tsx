import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { X, Volume2, VolumeX } from 'lucide-react';
import { getGameById } from '../../games/registry';
import { Button, Modal, Skeleton, EmptyState } from '../../design/components';
import { useAudio } from '../providers';
import { useAppHashSearch } from '../hashRouter';
import { findNextTask, type NextTaskInfo } from '../playTask';
import { applySessionLevel, readSkillLevel } from '../../core/adaptive/applySessionLevel';
import {
  clampLevel,
  formatBandLabel,
  modeLabelVi,
  parsePlayMode,
} from '../../core/adaptive/sessionLevel';
import { hasProgressSavers, runProgressSavers } from '../../core/adaptive/progressSaver';
import type { GameId } from '../../core/planner/today';

export interface PlayScreenProps {
  gameId: string;
}

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

/** Chỉ Esc "rảnh" mới mở hộp thoát: bỏ qua ô nhập, IME, và hộp thoại đang mở (F1). */
function isEscapeForExit(e: KeyboardEvent): boolean {
  if (e.key !== 'Escape' || e.isComposing || e.repeat) return false;
  const target = e.target;
  if (target instanceof Element && target.closest(EDITABLE_SELECTOR)) return false;
  if (document.querySelector('[role="dialog"][aria-modal="true"]')) return false;
  return true;
}

export const PlayScreen: React.FC<PlayScreenProps> = ({ gameId }) => {
  const [, navigate] = useLocation();
  const search = useAppHashSearch();
  const { muted, toggleMute } = useAudio();
  const game = getGameById(gameId);

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const fromToday = params.get('from') === 'today';
  const taskId = params.get('task');
  const returnPath = fromToday ? '/' : '/hub';
  const mode = game ? parsePlayMode(params.get('mode'), game.modes) : 'training';

  const [level, setLevel] = useState<number | null>(null);
  const [nextTask, setNextTask] = useState<NextTaskInfo | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitOpenRef = useRef(false);
  exitOpenRef.current = exitOpen;
  const savable = exitOpen ? hasProgressSavers() : false;

  const LazyGame = useMemo(() => {
    if (!game) return null;
    return React.lazy(game.load);
  }, [game]);

  // Độ khó thích ứng (F6/G2): đọc level theo kỹ năng, cập nhật theo các phiên đã xong.
  useEffect(() => {
    if (!game) return;
    let active = true;
    setLevel(null);
    void applySessionLevel(game.id as GameId)
      .then((res) => active && setLevel(clampLevel(res.level)))
      .catch(() =>
        readSkillLevel(game.id as GameId)
          .then((lv) => active && setLevel(lv))
          .catch(() => active && setLevel(1)),
      );
    return () => {
      active = false;
    };
  }, [game]);

  // Việc kế tiếp trong Hôm nay (F5) cho màn Recap.
  useEffect(() => {
    if (!game || !fromToday) {
      setNextTask(null);
      return;
    }
    let active = true;
    void findNextTask(taskId, game.id)
      .then((n) => active && setNextTask(n))
      .catch(() => active && setNextTask(null));
    return () => {
      active = false;
    };
  }, [game, fromToday, taskId]);

  const requestExit = useCallback(() => setExitOpen(true), []);

  // Esc: không thoát ngay. Chạy ở pha capture để thấy trạng thái hộp thoại trước khi chúng đóng,
  // rồi đợi hết lượt phát sự kiện để tôn trọng `defaultPrevented` của game (V3 bỏ chọn span...).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (exitOpenRef.current || !isEscapeForExit(e)) return;
      window.setTimeout(() => {
        if (!e.defaultPrevented && !exitOpenRef.current) setExitOpen(true);
      }, 0);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  const leaveGame = useCallback(() => {
    if (game) void applySessionLevel(game.id as GameId).catch(() => undefined);
    navigate(returnPath);
  }, [game, navigate, returnPath]);

  const confirmExit = useCallback(async () => {
    setExiting(true);
    try {
      await runProgressSavers();
    } finally {
      setExiting(false);
      setExitOpen(false);
      leaveGame();
    }
  }, [leaveGame]);

  const goNextTask = useCallback(() => {
    if (nextTask) navigate(nextTask.path);
  }, [navigate, nextTask]);

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

  // Prop mở rộng cho game/Recap (F5); game chưa nhận thì bỏ qua.
  const extraProps = { from: fromToday ? 'today' : undefined, nextTask, onNextTask: goNextTask };
  const GameComponent = LazyGame as React.ComponentType<
    { mode: string; level: number; onExit: (result?: unknown) => void } & typeof extraProps
  >;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Thanh trên 56px chuẩn 08 §4 & 09 §6 */}
      <header
        className="h-14 px-4 border-b flex items-center justify-between gap-3 shrink-0"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={requestExit}
            className="inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-[var(--radius-sm)] border cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-dim)',
            }}
            aria-label="Thoát phiên (Esc)"
            title="Thoát (Esc)"
            data-testid="play-exit"
          >
            <X className="w-4 h-4" />
          </button>
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: `var(--color-${game.skill})` }}
          />
          <span
            className="font-bold text-sm sm:text-base min-w-0 truncate"
            style={{ color: 'var(--color-text)' }}
          >
            <span className="sm:hidden">{game.code}</span>
            <span className="hidden sm:inline">
              {game.code} · {game.title}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            className="text-xs font-semibold tabular-nums px-2.5 py-1 rounded border whitespace-nowrap"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-dim)',
            }}
            data-testid="play-level-chip"
          >
            {level === null ? 'Band ≈ …' : formatBandLabel(level)} · {modeLabelVi(mode)}
          </span>

          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-[var(--radius-sm)] border cursor-pointer"
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
          {level === null ? (
            <div className="max-w-xl mx-auto p-8 space-y-4">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton lines={4} />
            </div>
          ) : (
            <GameComponent
              mode={mode}
              level={level}
              onExit={leaveGame}
              from={extraProps.from}
              nextTask={nextTask}
              onNextTask={goNextTask}
            />
          )}
        </Suspense>
      </main>

      <Modal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title="Thoát phiên này?"
        subtitle={
          savable
            ? 'Tiến độ đang chơi sẽ được lưu trước khi thoát.'
            : 'Phiên chưa kết thúc nên tiến độ dở dang chưa được lưu.'
        }
        maxWidthClass="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => void confirmExit()}
              loading={exiting}
              data-testid="play-exit-confirm"
            >
              {savable ? 'Lưu và thoát' : 'Thoát'}
            </Button>
            <Button
              variant="primary"
              autoFocus
              onClick={() => setExitOpen(false)}
              data-testid="play-exit-continue"
            >
              Chơi tiếp
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-dim)' }}>
          {savable
            ? 'Bạn có thể quay lại và chơi tiếp bất cứ lúc nào.'
            : 'Hoàn thành phiên để điểm và thẻ ôn được ghi nhận. Bạn có muốn tiếp tục không?'}
        </p>
      </Modal>
    </div>
  );
};
