import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Flag, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { feedbackSlideVariants, reducedRouteVariants } from '../motion';
import { Button } from './Button';

export interface FeedbackPanelProps {
  open: boolean;
  status: 'correct' | 'wrong' | 'partial';
  title: string;
  correctAnswer?: string;
  explanation: string;
  evidenceQuote?: string;
  onNext: () => void;
  onFlagItem?: () => void;
  className?: string;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  open,
  status,
  title,
  correctAnswer,
  explanation,
  evidenceQuote,
  onNext,
  onFlagItem,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();

  const accentColor =
    status === 'correct'
      ? 'var(--color-correct)'
      : status === 'partial'
      ? 'var(--color-partial)'
      : 'var(--color-wrong)';

  const StatusIcon =
    status === 'correct'
      ? CheckCircle2
      : status === 'partial'
      ? AlertTriangle
      : XCircle;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={prefersReduced ? reducedRouteVariants : feedbackSlideVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`rounded-[var(--radius-lg)] border p-5 space-y-4 ${className}`}
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: accentColor,
            borderTopWidth: '3px',
            boxShadow: 'var(--shadow-card)',
          }}
          role="region"
          aria-live="polite"
          aria-label="Phản hồi kết quả"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <StatusIcon className="w-5 h-5 shrink-0" style={{ color: accentColor }} />
              <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                {title}
              </h3>
            </div>

            {onFlagItem && (
              <button
                type="button"
                onClick={onFlagItem}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-dim)',
                }}
                title="Báo item sai"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Báo item sai</span>
              </button>
            )}
          </div>

          {correctAnswer && (
            <div
              className="px-3.5 py-2 rounded-[var(--radius-sm)] border text-sm"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <span style={{ color: 'var(--color-text-dim)' }}>Đáp án chuẩn: </span>
              <strong
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-correct)',
                }}
              >
                {correctAnswer}
              </strong>
            </div>
          )}

          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {explanation}
          </p>

          {evidenceQuote && (
            <blockquote
              className="pl-3.5 py-1.5 border-l-2 text-sm italic reading-prose"
              style={{
                borderColor: 'var(--color-partial)',
                color: 'var(--color-text-dim)',
              }}
            >
              “{evidenceQuote}”
            </blockquote>
          )}

          <div className="flex items-center justify-end pt-1">
            <Button
              variant="primary"
              skill={status === 'correct' ? 'reading' : 'info'}
              hotkey="Enter"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={onNext}
            >
              Tiếp
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
