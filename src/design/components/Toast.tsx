import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { spring } from '../motion';

export type ToastTone = 'correct' | 'wrong' | 'partial' | 'info';

export interface ToastProps {
  title: string;
  description?: string;
  tone?: ToastTone;
  onDismiss?: () => void;
  className?: string;
}

const toneColorMap: Record<ToastTone, string> = {
  correct: 'var(--color-correct)',
  wrong: 'var(--color-wrong)',
  partial: 'var(--color-partial)',
  info: 'var(--color-info)',
};

export const Toast: React.FC<ToastProps> = ({
  title,
  description,
  tone = 'info',
  onDismiss,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const color = toneColorMap[tone];

  const Icon =
    tone === 'correct'
      ? CheckCircle2
      : tone === 'wrong' || tone === 'partial'
      ? AlertCircle
      : Info;

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={prefersReduced ? { duration: 0.1 } : spring.snappy}
      className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        borderLeftWidth: '4px',
        borderLeftColor: color,
        boxShadow: 'var(--shadow-card)',
      }}
      role="status"
      aria-live="polite"
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {title}
        </p>
        {description && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
            {description}
          </p>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded cursor-pointer"
          style={{ color: 'var(--color-text-dim)' }}
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};
