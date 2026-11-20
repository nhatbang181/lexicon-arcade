import React from 'react';
import { Check } from 'lucide-react';
import type { SkillColor } from './Button';

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  skill?: SkillColor;
  label?: string;
  showCheckWhenDone?: boolean;
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

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 56,
  strokeWidth = 5,
  skill = 'info',
  label,
  showCheckWhenDone = true,
  className = '',
}) => {
  const safeMax = max <= 0 ? 1 : max;
  const pct = Math.max(0, Math.min(1, value / safeMax));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const isComplete = pct >= 1;
  const strokeColor = isComplete ? 'var(--color-correct)' : skillVarMap[skill];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || 'Tiến độ'}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--color-surface-2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
      >
        {isComplete && showCheckWhenDone ? (
          <Check className="w-4 h-4" style={{ color: 'var(--color-correct)' }} />
        ) : (
          label ?? `${Math.round(pct * 100)}%`
        )}
      </div>
    </div>
  );
};
