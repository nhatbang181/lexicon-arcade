import React, { useMemo } from 'react';
import { formatTrackTime } from '../../core/audio/trackPlayer';

export interface WaveformMarker {
  id: string;
  kind: 'evidence' | 'trap';
  startSec: number;
  endSec: number;
  label?: string;
  qid?: string;
}

export interface WaveformProps {
  /** Normalized amplitude peaks in [0, 1]. If omitted, a deterministic pseudo-waveform is generated from `seed`. */
  peaks?: readonly number[];
  /** Seed string for deterministic pseudo-waveform generation when `peaks` is omitted. */
  seed?: string;
  /** Number of vertical bars when generating or resampling peaks. Default: 64. */
  barCount?: number;
  durationSec: number;
  currentTimeSec: number;
  /** Evidence (green) and trap (red) regions shown in Debrief. */
  markers?: readonly WaveformMarker[];
  /** Show colored evidence/trap overlays (true in Debrief, false during Listening). */
  showMarkers?: boolean;
  /** Visual dimming during active listening so learner stays focused on questions. */
  dimmed?: boolean;
  /** Allow seeking/clicking bars. Disabled in Exam mode. */
  interactive?: boolean;
  onSeek?: (sec: number) => void;
  onSelectMarker?: (marker: WaveformMarker) => void;
  height?: number;
  className?: string;
}

function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic speech-like pseudo-waveform generator (mulberry32 + gentle phrase envelope).
 */
export function generatePseudoPeaks(seed: string, count = 64): number[] {
  const safeCount = Math.max(8, Math.min(200, Math.floor(count)));
  let state = hashSeed(seed || 'lexicon-waveform') || 1;
  const nextRand = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const out: number[] = [];
  for (let i = 0; i < safeCount; i++) {
    const progress = i / Math.max(1, safeCount - 1);
    const phraseWave = 0.55 + 0.35 * Math.sin(progress * Math.PI * 7.5);
    const pauseDip = nextRand() < 0.14 ? 0.25 : 1;
    const raw = (0.22 + nextRand() * 0.72) * phraseWave * pauseDip;
    out.push(Number(Math.min(0.96, Math.max(0.14, raw)).toFixed(3)));
  }
  return out;
}

function resamplePeaks(peaks: readonly number[], targetCount: number): number[] {
  if (peaks.length === 0) return generatePseudoPeaks('empty', targetCount);
  if (peaks.length === targetCount) {
    return peaks.map((p) => Math.min(1, Math.max(0.12, p)));
  }
  const out: number[] = [];
  for (let i = 0; i < targetCount; i++) {
    const startIdx = Math.floor((i * peaks.length) / targetCount);
    const endIdx = Math.max(startIdx + 1, Math.floor(((i + 1) * peaks.length) / targetCount));
    let sum = 0;
    let n = 0;
    for (let j = startIdx; j < endIdx && j < peaks.length; j++) {
      sum += peaks[j];
      n++;
    }
    const avg = n > 0 ? sum / n : 0.2;
    out.push(Math.min(1, Math.max(0.12, avg)));
  }
  return out;
}

export const Waveform: React.FC<WaveformProps> = ({
  peaks,
  seed = 'listening-track',
  barCount = 64,
  durationSec,
  currentTimeSec,
  markers = [],
  showMarkers = false,
  dimmed = false,
  interactive = true,
  onSeek,
  onSelectMarker,
  height = 68,
  className = '',
}) => {
  const safeDuration = durationSec > 0 ? durationSec : 1;
  const safeCurrent = Math.max(0, Math.min(safeDuration, currentTimeSec));
  const progressRatio = safeCurrent / safeDuration;

  const bars = useMemo(() => {
    if (peaks && peaks.length > 0) {
      return resamplePeaks(peaks, barCount);
    }
    return generatePseudoPeaks(seed, barCount);
  }, [peaks, seed, barCount]);

  const handleBarAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSec = ratio * safeDuration;

    if (showMarkers && onSelectMarker) {
      // Prioritize exact trap or evidence marker under click
      const hit = markers.find((m) => targetSec >= m.startSec && targetSec <= m.endSec);
      if (hit) {
        onSelectMarker(hit);
        return;
      }
    }

    onSeek?.(targetSec);
  };

  return (
    <div
      className={`space-y-2 ${className}`}
      data-testid="waveform"
    >
      <div
        role={interactive ? 'slider' : 'img'}
        aria-label="Dạng sóng bài nghe"
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? Math.round(safeDuration) : undefined}
        aria-valuenow={interactive ? Math.round(safeCurrent) : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={handleBarAreaClick}
        onKeyDown={(e) => {
          if (!interactive || !onSeek) return;
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            onSeek(Math.min(safeDuration, safeCurrent + 5));
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onSeek(Math.max(0, safeCurrent - 5));
          }
        }}
        className={`relative w-full rounded-[var(--radius-md)] border px-2.5 py-2 overflow-hidden select-none transition-opacity ${
          interactive ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{
          height: `${height}px`,
          backgroundColor: 'var(--color-surface-2)',
          borderColor: 'var(--color-border)',
          opacity: dimmed ? 0.58 : 1,
        }}
      >
        {/* Colored marker background regions (Debrief only) */}
        {showMarkers &&
          markers.map((marker) => {
            const leftPct = Math.max(0, Math.min(100, (marker.startSec / safeDuration) * 100));
            const widthPct = Math.max(
              1.5,
              Math.min(100 - leftPct, ((marker.endSec - marker.startSec) / safeDuration) * 100),
            );
            const markerColor =
              marker.kind === 'evidence' ? 'var(--color-correct)' : 'var(--color-wrong)';

            return (
              <button
                key={marker.id}
                type="button"
                title={
                  marker.label ??
                  `${marker.kind === 'evidence' ? 'Đoạn đáp án' : 'Đoạn bẫy'} (${formatTrackTime(
                    marker.startSec,
                  )}–${formatTrackTime(marker.endSec)})`
                }
                aria-label={`Phát ${
                  marker.kind === 'evidence' ? 'đoạn đáp án' : 'đoạn bẫy'
                } ${marker.label ?? ''} từ ${formatTrackTime(marker.startSec)} đến ${formatTrackTime(
                  marker.endSec,
                )}`}
                data-testid={`waveform-marker-${marker.kind}-${marker.id}`}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (onSelectMarker) {
                    onSelectMarker(marker);
                  } else {
                    onSeek?.(marker.startSec);
                  }
                }}
                className="absolute top-0 bottom-0 z-10 border-x transition-opacity hover:opacity-100 cursor-pointer"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: `color-mix(in srgb, ${markerColor} 22%, transparent)`,
                  borderColor: `color-mix(in srgb, ${markerColor} 65%, transparent)`,
                  opacity: 0.85,
                }}
              />
            );
          })}

        {/* Vertical waveform bars */}
        <div className="relative z-0 flex items-center justify-between gap-[2px] w-full h-full pointer-events-none">
          {bars.map((amp, idx) => {
            const barCenterSec = ((idx + 0.5) / bars.length) * safeDuration;
            const isPlayed = barCenterSec <= safeCurrent;

            let barColor = isPlayed ? 'var(--color-listening)' : 'var(--color-border)';

            if (showMarkers) {
              const hitTrap = markers.some(
                (m) => m.kind === 'trap' && barCenterSec >= m.startSec && barCenterSec <= m.endSec,
              );
              const hitEvidence = markers.some(
                (m) =>
                  m.kind === 'evidence' && barCenterSec >= m.startSec && barCenterSec <= m.endSec,
              );
              if (hitEvidence) {
                barColor = 'var(--color-correct)';
              } else if (hitTrap) {
                barColor = 'var(--color-wrong)';
              }
            }

            return (
              <span
                key={idx}
                className="flex-1 rounded-full"
                style={{
                  height: `${Math.round(amp * 100)}%`,
                  backgroundColor: barColor,
                  opacity: isPlayed || showMarkers ? 1 : 0.75,
                }}
              />
            );
          })}
        </div>

        {/* Playhead hairline */}
        <div
          aria-hidden="true"
          className="absolute top-1 bottom-1 w-[2px] z-20 pointer-events-none rounded-full"
          style={{
            left: `calc(${Math.max(0, Math.min(100, progressRatio * 100))}% - 1px)`,
            backgroundColor: 'var(--color-text)',
          }}
        />
      </div>

      {/* Legend & clickable segment chips when markers are visible in Debrief */}
      {showMarkers && markers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3" style={{ color: 'var(--color-text-dim)' }}>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block"
                style={{ backgroundColor: 'var(--color-correct)' }}
              />
              Vùng đáp án (bấm để nghe)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block"
                style={{ backgroundColor: 'var(--color-wrong)' }}
              />
              Vùng bẫy (bấm để nghe)
            </span>
          </div>
          <span
            className="tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-faint)' }}
          >
            {formatTrackTime(safeCurrent)} / {formatTrackTime(safeDuration)}
          </span>
        </div>
      )}
    </div>
  );
};
