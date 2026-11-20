import React from 'react';
import { Compass } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border p-8 text-center flex flex-col items-center justify-center space-y-4 ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center border"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-info) 12%, var(--color-surface-2))',
          borderColor: 'color-mix(in srgb, var(--color-info) 30%, var(--color-border))',
          color: 'var(--color-info)',
        }}
      >
        {icon ?? <Compass className="w-7 h-7" />}
      </div>

      <div className="max-w-md space-y-1.5">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
          {description}
        </p>
      </div>

      {(action || secondaryAction) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
