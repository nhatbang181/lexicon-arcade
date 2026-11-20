import React from 'react';
import { ArrowUpRight, ArrowRight, ArrowDownRight, HelpCircle } from 'lucide-react';
import type { SkillColor } from './Button';

export interface BandMeterProps {
  skillLabel: string;
  skillCode?: 'L' | 'R' | 'W' | 'S';
  skill?: SkillColor;
  currentBand: number | null;
  targetBand: number;
  confidence?: number; // e.g. 0.5 means ±0.5
  trend?: 'up' | 'flat' | 'down';
  className?: string;
}

const skillVarMap: Record<SkillColor, string> = {
  vocab: 'var(--color-vocab)',
  listening: 'var(--color-listening)',
  reading: 'var(--color-reading)',
  writing: 'var(--color-writing)',
  speaking: 'var(--color-speaking)',
  exam: 'var(--color-exam)',
  info: 'var(--color-info)',
};

const MIN_BAND = 4.0;
const MAX_BAND = 9.0;

function bandToPercent(band: number): number {
  const clamped = Math.max(MIN_BAND, Math.min(MAX_BAND, band));
  return ((clamped - MIN_BAND) / (MAX_BAND - MIN_BAND)) * 100;
}

export const BandMeter: React.FC<BandMeterProps> = ({
  skillLabel,
  skillCode,
  skill = 'info',
  currentBand,
  targetBand,
  confidence = 0,
  trend = 'flat',
  className = '',
}) => {
  const color = skillVarMap[skill];
  const isUnplaced = currentBand === null;
  const fillPct = isUnplaced ? 0 : bandToPercent(currentBand);
  const targetPct = bandToPercent(targetBand);
  const confLowPct =
    !isUnplaced && confidence > 0 ? bandToPercent(currentBand - confidence) : fillPct;
  const confHighPct =
    !isUnplaced && confidence > 0 ? bandToPercent(currentBand + confidence) : fillPct;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {skillCode && (
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold"
              style={{
                backgroundColor: `color-mix(in srgb, ${color} 16%, var(--color-surface-2))`,
                color,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {skillCode}
            </span>
          )}
          <span className="font-medium" style={{ color: 'var(--color-text)' }}>
            {skillLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 tabular-nums shrink-0">
          {isUnplaced ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap"
              style={{ color: 'var(--color-text-dim)' }}
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              Chưa định vị
            </span>
          ) : (
            <span
              className="text-base font-bold whitespace-nowrap"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
            >
              {currentBand.toFixed(1)}
            </span>
          )}

          {!isUnplaced && (
            <span aria-label={`Xu hướng ${trend}`}>
              {trend === 'up' && (
                <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--color-correct)' }} />
              )}
              {trend === 'flat' && (
                <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-text-dim)' }} />
              )}
              {trend === 'down' && (
                <ArrowDownRight className="w-4 h-4" style={{ color: 'var(--color-partial)' }} />
              )}
            </span>
          )}

          <span
            className="text-xs whitespace-nowrap"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-faint)' }}
          >
            (Mục tiêu {targetBand.toFixed(1)})
          </span>
        </div>
      </div>

      {/* Thanh 4.0 -> 9.0 */}
      <div
        className="relative h-2.5 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-2)' }}
        role="meter"
        aria-label={`Band ${skillLabel}`}
        aria-valuemin={MIN_BAND}
        aria-valuemax={MAX_BAND}
        aria-valuenow={currentBand ?? MIN_BAND}
      >
        {/* Vùng mờ độ tin cậy */}
        {!isUnplaced && confidence > 0 && (
          <div
            className="absolute top-0 bottom-0 rounded-full opacity-30"
            style={{
              left: `${confLowPct}%`,
              width: `${Math.max(2, confHighPct - confLowPct)}%`,
              backgroundColor: color,
            }}
          />
        )}

        {/* Thanh chính */}
        {!isUnplaced && (
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${fillPct}%`,
              backgroundColor: color,
            }}
          />
        )}

        {/* Vạch mục tiêu */}
        <div
          className="absolute top-0 bottom-0 w-0.5"
          style={{
            left: `${targetPct}%`,
            backgroundColor: 'var(--color-text)',
          }}
          title={`Mục tiêu ${targetBand.toFixed(1)}`}
        />
      </div>
    </div>
  );
};

export const Meter = BandMeter;
