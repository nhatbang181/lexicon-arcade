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

  const sizeClasses = {
    sm: 'min-h-[36px] px-3 py-1.5 text-sm gap-1.5 rounded-[var(--radius-sm)]',
    md: 'min-h-[44px] px-4 py-2.5 text-sm font-medium gap-2 rounded-[var(--radius-md)]',
    lg: 'min-h-[48px] px-6 py-3 text-base font-semibold gap-2.5 rounded-[var(--radius-md)]',
  }[size];

  const getVariantStyle = (): React.CSSProperties => {
    const accent = skillVarMap[skill];
    if (variant === 'primary') {
      return {
        backgroundColor: accent,
        color: 'var(--color-on-accent)',
        borderColor: 'transparent',
      };
    }
    if (variant === 'secondary') {
      return {
        backgroundColor: 'var(--color-surface-2)',
        color: 'var(--color-text)',
        borderColor: 'var(--color-border)',
      };
    }
    if (variant === 'danger') {
      return {
        backgroundColor: 'var(--color-wrong)',
        color: 'var(--color-on-accent)',
        borderColor: 'transparent',
      };
    }
    // ghost
    return {
      backgroundColor: 'transparent',
      color: 'var(--color-text-dim)',
      borderColor: 'transparent',
    };
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`inline-flex items-center justify-center border font-medium transition-opacity duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99] ${sizeClasses} ${
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
