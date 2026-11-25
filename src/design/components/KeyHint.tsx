import React from 'react';

export interface KeyHintProps {
  keyName: string;
  className?: string;
}

export const KeyHint: React.FC<KeyHintProps> = ({ keyName, className = '' }) => {
  return (
    <kbd
      className={`inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 text-xs font-medium leading-none rounded border select-none ${className}`}
      style={{
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--color-surface-2)',
        borderColor: 'var(--color-border-strong)',
        color: 'var(--color-text-dim)',
        boxShadow: '0 1px 0 var(--color-border)',
      }}
      aria-label={`Phím tắt ${keyName}`}
    >
      {keyName}
    </kbd>
  );
};
