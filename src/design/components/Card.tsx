import React from 'react';
import type { SkillColor } from './Button';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  skillAccent?: SkillColor;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  elevated?: boolean;
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

export const Card: React.FC<CardProps> = ({
  skillAccent,
  padding = 'md',
  interactive = false,
  elevated = true,
  className = '',
  style,
  children,
  ...rest
}) => {
  const padClass = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }[padding];

  return (
    <div
      className={`rounded-[var(--radius-lg)] border transition-transform duration-150 ${padClass} ${
        interactive ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        borderLeftWidth: skillAccent ? '4px' : '1px',
        borderLeftColor: skillAccent ? skillVarMap[skillAccent] : 'var(--color-border)',
        boxShadow: elevated ? 'var(--shadow-card)' : 'none',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};
