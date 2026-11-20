import React from 'react';
import { Clock } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export interface TimerProps {
  remainingSec: number;
  totalSec?: number;
  examMode?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function formatSeconds(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const Timer: React.FC<TimerProps> = ({
  remainingSec,
  totalSec = 60,
  examMode = false,
  size = 'md',
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const safeTotal = totalSec <= 0 ? 1 : totalSec;
  const ratio = Math.max(0, Math.min(1, remainingSec / safeTotal));
  const isDanger = ratio <= 0.1;
  const isWarning = !isDanger && ratio <= 0.25;

  const textColor = isDanger
    ? 'var(--color-wrong)'
    : isWarning && !examMode
    ? 'var(--color-partial)'
    : 'var(--color-text)';

  const sizeClass = {
    sm: 'text-sm px-2.5 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-xl px-4 py-2',
  }[size];

  const shouldPulse = isDanger && !examMode && !prefersReduced;

  return (
    <motion.div
      animate={shouldPulse ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={shouldPulse ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : undefined}
      className={`inline-flex items-center gap-2 rounded-[var(--radius-sm)] border font-semibold tabular-nums ${sizeClass} ${className}`}
      style={{
        fontFamily: 'var(--font-mono)',
        color: textColor,
        backgroundColor: 'var(--color-surface-2)',
        borderColor: isDanger ? 'var(--color-wrong)' : 'var(--color-border)',
      }}
      role="timer"
      aria-label={`Thời gian còn lại ${formatSeconds(remainingSec)}`}
    >
      <Clock className="w-4 h-4 shrink-0" />
      <span>{formatSeconds(remainingSec)}</span>
    </motion.div>
  );
};
