import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Lock,
  Radio,
  RefreshCw,
} from 'lucide-react';
import {
  formatTrackTime,
  type PlaybackRate,
  type TrackStatus,
} from '../../core/audio/trackPlayer';

export interface TrackPlayerProps {
  status: TrackStatus;
  currentTime: number;
  duration: number;
  rate: PlaybackRate;
  volume: number;
  muted?: boolean;
  /** Exam mode: single pass, no pause, no seek, rate locked to 1.0x. */
  examMode?: boolean;
  /** Training Lv.7-8 disables pausing while still showing speed/progress. */
  disablePause?: boolean;
  /** Optional label for the currently playing debrief segment clip. */
  activeSegmentLabel?: string | null;
  /** True when MP3 is unavailable and running in simulated transcript timing mode. */
  simulatedMode?: boolean;
  /** True when browser autoplay policy rejected play() (NotAllowedError); file is valid (L1-10). */
  autoplayBlocked?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek?: (sec: number) => void;
  onRewind?: (sec: number) => void;
  onRateChange?: (rate: PlaybackRate) => void;
  onVolumeChange?: (volume: number) => void;
  onToggleMute?: () => void;
  onRetryLoad?: () => void;
  className?: string;
}

const UI_RATES: readonly PlaybackRate[] = [0.75, 1, 1.25];

export const TrackPlayer: React.FC<TrackPlayerProps> = ({
  status,
  currentTime,
  duration,
  rate,
  volume,
  muted = false,
  examMode = false,
  disablePause = false,
  activeSegmentLabel = null,
  simulatedMode = false,
  autoplayBlocked = false,
  onPlay,
  onPause,
  onSeek,
  onRewind,
  onRateChange,
  onVolumeChange,
  onToggleMute,
  onRetryLoad,
  className = '',
}) => {
  const safeDuration = duration > 0 ? duration : 1;
  const safeCurrent = Math.max(0, Math.min(safeDuration, currentTime));
  const progressPct = Math.max(0, Math.min(100, (safeCurrent / safeDuration) * 100));

  const isPlaying = status === 'playing';
  const isEnded = status === 'ended';
  const isAudioMissing = status === 'audio_missing' || simulatedMode;
  const pauseBlocked = examMode || disablePause;
  const examFinishedLocked = examMode && isEnded;

  const rateOptions: PlaybackRate[] =
    rate === 0.9 ? [0.75, 0.9, 1, 1.25] : [...UI_RATES];

  return (
    <div
      className={`rounded-[var(--radius-md)] border px-3.5 py-2.5 space-y-2 ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
      data-testid="track-player"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Play / Pause primary control */}
        {isPlaying && pauseBlocked ? (
          <div
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-[var(--radius-sm)] border text-xs font-semibold"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-dim)',
            }}
            data-testid="track-exam-playing"
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>{examMode ? 'Đang phát (1 lần)' : 'Đang phát (không dừng)'}</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={examFinishedLocked}
            onClick={isPlaying ? onPause : onPlay}
            aria-label={isPlaying ? 'Tạm dừng bài nghe' : 'Phát bài nghe'}
            data-testid="track-play-toggle"
            className="inline-flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-3 rounded-[var(--radius-sm)] font-semibold text-sm transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              backgroundColor: examMode ? 'var(--color-text)' : 'var(--color-listening)',
              color: 'var(--color-bg)',
            }}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Dừng</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">
                  {examFinishedLocked ? 'Đã phát xong' : isEnded ? 'Nghe lại' : 'Phát'}
                </span>
              </>
            )}
          </button>
        )}

        {/* Rewind 5s (Training only) */}
        {!examMode && onRewind && (
          <button
            type="button"
            onClick={() => onRewind(5)}
            aria-label="Tua lùi 5 giây"
            data-testid="track-rewind-5"
            className="inline-flex items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2.5 rounded-[var(--radius-sm)] border text-xs font-semibold tabular-nums cursor-pointer transition-colors hover:opacity-90"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>5s</span>
          </button>
        )}

        {/* Progress bar & timestamps */}
        <div className="flex-1 min-w-[160px] flex items-center gap-2.5">
          <span
            className="text-xs font-semibold tabular-nums shrink-0"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
            data-testid="track-current-time"
          >
            {formatTrackTime(safeCurrent)}
          </span>

          {examMode || !onSeek ? (
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-2)' }}
              aria-label={`Tiến độ bài nghe ${Math.round(progressPct)}%`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-100"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: examMode ? 'var(--color-text)' : 'var(--color-listening)',
                }}
              />
            </div>
          ) : (
            <input
              type="range"
              min={0}
              max={safeDuration}
              step={0.25}
              value={safeCurrent}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Thanh tiến trình bài nghe"
              data-testid="track-seek-slider"
              className="flex-1 min-h-[44px] appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[var(--color-surface-2)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-listening)]"
            />
          )}

          <span
            className="text-xs tabular-nums shrink-0"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
          >
            {formatTrackTime(duration)}
          </span>
        </div>

        {/* Speed buttons (Training only) */}
        {!examMode && onRateChange && (
          <div
            className="inline-flex items-center rounded-[var(--radius-sm)] border p-0.5 gap-0.5"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
            }}
            role="group"
            aria-label="Tốc độ phát"
          >
            {rateOptions.map((r) => {
              const active = rate === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRateChange(r)}
                  aria-pressed={active}
                  data-testid={`track-rate-${r}`}
                  className="min-w-[44px] min-h-[44px] px-2 rounded-[6px] text-xs font-semibold tabular-nums cursor-pointer transition-colors"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: active ? 'var(--color-listening)' : 'transparent',
                    color: active ? 'var(--color-bg)' : 'var(--color-text-dim)',
                  }}
                >
                  {r === 1 ? '1.0×' : `${r}×`}
                </button>
              );
            })}
          </div>
        )}

        {/* Volume control (available in both Training and Exam mode) */}
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-sm)] cursor-pointer"
            style={{ color: 'var(--color-text-dim)' }}
          >
            {muted || volume <= 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          {onVolumeChange && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Âm lượng bài nghe"
              className="w-16 sm:w-20 min-h-[44px] appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[var(--color-surface-2)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-listening)]"
            />
          )}
        </div>
      </div>

      {/* Active segment pill, autoplayBlocked prompt, or audio_missing status */}
      {(activeSegmentLabel || autoplayBlocked || isAudioMissing) && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {activeSegmentLabel ? (
            <span
              className="inline-flex items-center gap-1.5 font-medium"
              style={{ color: 'var(--color-listening)' }}
              data-testid="track-active-segment"
            >
              <Radio className="w-3.5 h-3.5" />
              Đang phát đoạn: {activeSegmentLabel}
            </span>
          ) : autoplayBlocked ? (
            <span
              className="inline-flex items-center gap-1.5 font-medium"
              style={{ color: 'var(--color-partial)' }}
              data-testid="track-autoplay-blocked-banner"
            >
              <Radio className="w-3.5 h-3.5" />
              Trình duyệt chặn tự phát — bấm nút Phát để bắt đầu nghe.
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: 'var(--color-wrong)' }}
              data-testid="track-audio-missing-banner"
            >
              <Radio className="w-3.5 h-3.5" />
              Không tải được file MP3 — không thể bắt đầu bài nghe này.
            </span>
          )}

          {autoplayBlocked && (
            <button
              type="button"
              onClick={onPlay}
              data-testid="track-autoplay-resume-btn"
              className="inline-flex items-center gap-1 min-h-[44px] px-3 rounded-[var(--radius-sm)] font-semibold cursor-pointer"
              style={{
                backgroundColor: 'var(--color-listening)',
                color: 'var(--color-bg)',
              }}
            >
              <Play className="w-3.5 h-3.5" />
              Bấm để phát
            </button>
          )}

          {isAudioMissing && !autoplayBlocked && onRetryLoad && (
            <button
              type="button"
              onClick={onRetryLoad}
              className="inline-flex items-center gap-1 min-h-[44px] px-2 font-medium cursor-pointer hover:underline"
              style={{ color: 'var(--color-info)' }}
            >
              <RefreshCw className="w-3 h-3" />
              Thử tải lại MP3
            </button>
          )}
        </div>
      )}
    </div>
  );
};
