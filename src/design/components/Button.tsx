import React from 'react';
import { Loader2 } from 'lucide-react';
import { KeyHint } from './KeyHint';

export type SkillColor = 'vocab' | 'listening' | 'reading' | 'writing' | 'speaking' | 'exam' | 'info';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  skill?: SkillColor;
  loading?: boolean;
  hotkey?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
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

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  skill = 'info',
  loading = false,
  hotkey,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  /* SR-41 / D3: mọi nút tương tác đều đạt vùng chạm tối thiểu 44 px */
  const sizeClasses = {
    sm: 'min-h-[44px] px-3 py-1.5 text-sm gap-1.5 rounded-[var(--radius-sm)]',
    md: 'min-h-[44px] px-4 py-2.5 text-sm font-medium gap-2 rounded-[var(--radius-md)]',
    lg: 'min-h-[48px] px-6 py-3 text-base font-semibold gap-2.5 rounded-[var(--radius-md)]',
  }[size];

  const getVariantStyle = (): React.CSSProperties => {
    const accent = skillVarMap[skill];
    const vars = { '--btn-accent': accent } as React.CSSProperties;
    if (variant === 'primary') {
      return {
        ...vars,
        backgroundColor: accent,
        color: 'var(--color-on-accent)',
        borderColor: 'transparent',
      };
    }
    if (variant === 'secondary') {
      return {
        ...vars,
        backgroundColor: 'var(--color-surface-2)',
        color: 'var(--color-text)',
        borderColor: isDisabled ? 'var(--color-border-subtle)' : 'var(--color-border)',
      };
    }
    if (variant === 'danger') {
      return {
        ...vars,
        backgroundColor: 'var(--color-wrong)',
        color: 'var(--color-on-accent)',
        borderColor: 'transparent',
      };
    }
    return {
      ...vars,
      backgroundColor: 'transparent',
      color: 'var(--color-text-dim)',
      borderColor: 'transparent',
    };
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      data-variant={variant}
      data-loading={loading ? 'true' : undefined}
      className={`design-btn inline-flex items-center justify-center border font-medium select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      style={{ ...getVariantStyle(), ...style }}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      {hotkey && !loading && <KeyHint keyName={hotkey} className="ml-1" />}
    </button>
  );
};
