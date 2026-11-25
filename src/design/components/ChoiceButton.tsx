import React from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { correctPopVariants, wrongShakeVariants } from '../motion';
import { useFxTier } from '../fx/fxTier';

export type ChoiceState =
  | 'idle'
  | 'selected'
  | 'correct'
  | 'wrong'
  | 'reveal-correct';

export interface ChoiceButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  indexLabel: string; // e.g. 'A', 'B', '1', '2'
  label: React.ReactNode;
  state?: ChoiceState;
  examMode?: boolean;
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  indexLabel,
  label,
  state = 'idle',
  examMode = false,
  disabled,
  className = '',
  style,
  ...rest
}) => {
  const fx = useFxTier({ examMode });
  const allowAnim = fx.allowShake && (state === 'wrong' || state === 'correct');

  const getStyle = (): React.CSSProperties => {
    if (state === 'correct') {
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-correct) 14%, var(--color-surface))',
        borderColor: 'var(--color-correct)',
        color: 'var(--color-text)',
        boxShadow: 'var(--shadow-glow-ok)',
      };
    }
    if (state === 'wrong') {
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-wrong) 14%, var(--color-surface))',
        borderColor: 'var(--color-wrong)',
        color: 'var(--color-text)',
      };
    }
    if (state === 'reveal-correct') {
      return {
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-correct)',
        borderStyle: 'dashed',
        color: 'var(--color-text)',
      };
    }
    if (state === 'selected') {
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-info) 14%, var(--color-surface))',
        borderColor: 'var(--color-info)',
        color: 'var(--color-text)',
      };
    }
    return {
      backgroundColor: 'var(--color-surface)',
      borderColor: disabled ? 'var(--color-border-subtle)' : 'var(--color-border-strong)',
      color: 'var(--color-text)',
    };
  };

  return (
    <motion.div
      variants={
        !allowAnim
          ? undefined
          : state === 'wrong'
          ? wrongShakeVariants
          : correctPopVariants
      }
      animate={
        !allowAnim
          ? undefined
          : state === 'wrong'
          ? 'wrong'
          : state === 'correct'
          ? 'correct'
          : 'idle'
      }
    >
      <button
        type="button"
        disabled={disabled}
        data-state={state}
        className={`design-choice w-full min-h-[48px] px-4 py-3 rounded-[var(--radius-md)] border text-left flex items-center justify-between gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={{ ...getStyle(), ...style }}
        {...rest}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] border text-xs font-bold shrink-0"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-dim)',
            }}
          >
            {indexLabel}
          </span>
          <span className="text-base font-medium leading-snug">{label}</span>
        </div>

        {state === 'correct' || state === 'reveal-correct' ? (
          <Check className="w-5 h-5 shrink-0" style={{ color: 'var(--color-correct)' }} aria-hidden="true" />
        ) : state === 'wrong' ? (
          <X className="w-5 h-5 shrink-0" style={{ color: 'var(--color-wrong)' }} aria-hidden="true" />
        ) : null}
      </button>
    </motion.div>
  );
};
