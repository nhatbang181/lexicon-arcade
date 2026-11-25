import React, { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { correctPopVariants, wrongShakeVariants } from '../motion';

export type AnswerInputStatus = 'idle' | 'correct' | 'wrong' | 'partial';

export interface AnswerInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  status?: AnswerInputStatus;
  wordLimit?: number;
  /** Ẩn bộ đếm số từ (vd chế độ Exam không hiện gợi ý đếm từ). */
  hideWordCount?: boolean;
  label?: string;
  helperText?: string;
}

function countIeltsWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  value,
  onChange,
  onSubmit,
  status = 'idle',
  wordLimit,
  hideWordCount = false,
  label,
  helperText,
  placeholder = 'Gõ đáp án của bạn...',
  className = '',
  id,
  ...rest
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const prefersReduced = useReducedMotion();
  const wordCount = countIeltsWords(value);
  const showWordCount = wordLimit !== undefined && !hideWordCount;
  const overLimit = showWordCount && wordCount > wordLimit;

  const borderColor =
    status === 'correct'
      ? 'var(--color-correct)'
      : status === 'wrong' || overLimit
      ? 'var(--color-wrong)'
      : status === 'partial'
      ? 'var(--color-partial)'
      : 'var(--color-border-strong)';

  const boxShadow =
    status === 'correct'
      ? 'var(--shadow-glow-ok)'
      : status === 'wrong'
      ? 'var(--shadow-glow-wrong)'
      : 'none';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
    rest.onKeyDown?.(e);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showWordCount) && (
        <div className="flex items-center justify-between text-xs">
          {label ? (
            <label
              htmlFor={inputId}
              className="font-medium"
              style={{ color: 'var(--color-text-dim)' }}
            >
              {label}
            </label>
          ) : (
            <span />
          )}
          {showWordCount && (
            <span
              className="tabular-nums font-medium"
              style={{
                fontFamily: 'var(--font-mono)',
                color: overLimit ? 'var(--color-wrong)' : 'var(--color-text-dim)',
              }}
            >
              {wordCount}/{wordLimit} từ
            </span>
          )}
        </div>
      )}

      <motion.div
        variants={
          prefersReduced
            ? undefined
            : status === 'wrong'
            ? wrongShakeVariants
            : correctPopVariants
        }
        animate={prefersReduced ? undefined : status === 'wrong' ? 'wrong' : status === 'correct' ? 'correct' : 'idle'}
        className="relative flex items-center"
      >
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className="w-full min-h-[48px] px-4 pr-16 py-2.5 text-lg font-medium rounded-[var(--radius-md)] border transition-colors"
          style={{
            fontFamily: 'var(--font-mono)',
            backgroundColor: 'var(--color-surface-2)',
            color: 'var(--color-text)',
            borderColor,
            boxShadow,
          }}
          {...rest}
        />
        <div className="absolute right-3 pointer-events-none">
          <kbd
            className="inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 text-xs font-medium leading-none rounded border select-none"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-dim)',
              boxShadow: '0 1px 0 var(--color-border)',
            }}
            aria-label="Phím tắt Enter"
          >
            ↵
          </kbd>
        </div>
      </motion.div>

      {helperText && (
        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
          {helperText}
        </p>
      )}
    </div>
  );
};
