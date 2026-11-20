import React from 'react';
import type { SkillColor } from './Button';

export type PillTone = SkillColor | 'correct' | 'wrong' | 'partial' | 'neutral';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

const toneColorMap: Record<PillTone, string> = {
  vocab: 'var(--color-vocab)',
  listening: 'var(--color-listening)',
  reading: 'var(--color-reading)',
  writing: 'var(--color-writing)',
  speaking: 'var(--color-speaking)',
  exam: 'var(--color-exam)',
  info: 'var(--color-info)',
  correct: 'var(--color-correct)',
  wrong: 'var(--color-wrong)',
  partial: 'var(--color-partial)',
  neutral: 'var(--color-text-dim)',
};

export const Pill: React.FC<PillProps> = ({
  tone = 'neutral',
  size = 'sm',
  icon,
  className = '',
  style,
  children,
  ...rest
}) => {
  const color = toneColorMap[tone];
  const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClass} ${className}`}
      style={{
        color: tone === 'neutral' ? 'var(--color-text-dim)' : color,
        backgroundColor:
          tone === 'neutral'
            ? 'var(--color-surface-2)'
            : `color-mix(in srgb, ${color} 14%, var(--color-surface))`,
        borderColor:
          tone === 'neutral'
            ? 'var(--color-border)'
            : `color-mix(in srgb, ${color} 35%, var(--color-border))`,
        ...style,
      }}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export const Badge = Pill;
