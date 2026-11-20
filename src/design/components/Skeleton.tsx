import React from 'react';

export interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-6 w-full', lines = 1 }) => {
  if (lines > 1) {
    return (
      <div className="space-y-2.5" aria-busy="true" aria-label="Đang tải nội dung">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={`animate-pulse rounded-[var(--radius-sm)] ${
              idx === lines - 1 ? 'w-3/4' : 'w-full'
            } h-4`}
            style={{ backgroundColor: 'var(--color-surface-2)' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse rounded-[var(--radius-sm)] ${className}`}
      style={{ backgroundColor: 'var(--color-surface-2)' }}
      aria-busy="true"
      aria-label="Đang tải"
    />
  );
};
