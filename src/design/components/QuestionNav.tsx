import React from 'react';
import { Check, Flag, X } from 'lucide-react';

export interface QuestionNavItem {
  qid: string;
  number: number;
  answered: boolean;
  flagged?: boolean;
  /** Optional post-submission result state for review mode */
  result?: 'correct' | 'wrong' | null;
}

export interface QuestionNavProps {
  items: readonly QuestionNavItem[];
  currentQid: string;
  onSelect: (qid: string) => void;
  /** Optional toggle flag action for the currently selected question */
  onToggleFlag?: (qid: string) => void;
  /** Compact mode omits legend text */
  compact?: boolean;
  className?: string;
}

export const QuestionNav: React.FC<QuestionNavProps> = ({
  items,
  currentQid,
  onSelect,
  onToggleFlag,
  compact = false,
  className = '',
}) => {
  const answeredCount = items.filter((item) => item.answered).length;
  const flaggedCount = items.filter((item) => item.flagged).length;
  const currentItem = items.find((item) => item.qid === currentQid);

  return (
    <nav
      aria-label="Điều hướng câu hỏi"
      className={`flex flex-col gap-2.5 ${className}`}
      data-testid="question-nav"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="list">
          {items.map((item) => {
            const isCurrent = item.qid === currentQid;
            const isCorrect = item.result === 'correct';
            const isWrong = item.result === 'wrong';

            let bg = 'var(--color-surface)';
            let border = 'var(--color-border)';
            let text = 'var(--color-text-dim)';

            if (isCorrect) {
              bg = 'color-mix(in srgb, var(--color-correct) 18%, var(--color-surface))';
              border = 'var(--color-correct)';
              text = 'var(--color-text)';
            } else if (isWrong) {
              bg = 'color-mix(in srgb, var(--color-wrong) 16%, var(--color-surface))';
              border = 'var(--color-wrong)';
              text = 'var(--color-text)';
            } else if (item.answered) {
              bg = 'color-mix(in srgb, var(--color-info) 16%, var(--color-surface))';
              border = 'var(--color-info)';
              text = 'var(--color-text)';
            }

            return (
              <button
                key={item.qid}
                type="button"
                role="listitem"
                onClick={() => onSelect(item.qid)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Câu ${item.number}${item.answered ? ', đã làm' : ', chưa làm'}${
                  item.flagged ? ', đã cắm cờ' : ''
                }`}
                data-testid={`qnav-btn-${item.number}`}
                className="relative inline-flex items-center justify-center min-w-[40px] h-10 px-2 rounded-[var(--radius-sm)] border text-sm font-semibold tabular-nums transition-colors cursor-pointer"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: bg,
                  borderColor: isCurrent ? 'var(--color-text)' : border,
                  borderWidth: isCurrent ? '2px' : '1px',
                  color: text,
                }}
              >
                <span>{item.number}</span>

                {item.flagged && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full inline-flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--color-partial)',
                      color: 'var(--color-bg)',
                    }}
                    aria-hidden="true"
                  >
                    <Flag className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}

                {isCorrect && (
                  <Check
                    className="w-3 h-3 ml-0.5 shrink-0"
                    style={{ color: 'var(--color-correct)' }}
                    aria-hidden="true"
                  />
                )}
                {isWrong && (
                  <X
                    className="w-3 h-3 ml-0.5 shrink-0"
                    style={{ color: 'var(--color-wrong)' }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {onToggleFlag && currentItem && (
          <button
            type="button"
            onClick={() => onToggleFlag(currentItem.qid)}
            aria-pressed={Boolean(currentItem.flagged)}
            data-testid="qnav-flag-toggle"
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-[var(--radius-sm)] border text-xs font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: currentItem.flagged
                ? 'color-mix(in srgb, var(--color-partial) 18%, var(--color-surface))'
                : 'var(--color-surface-2)',
              borderColor: currentItem.flagged ? 'var(--color-partial)' : 'var(--color-border)',
              color: currentItem.flagged ? 'var(--color-text)' : 'var(--color-text-dim)',
            }}
          >
            <Flag className={`w-3.5 h-3.5 ${currentItem.flagged ? 'fill-current' : ''}`} />
            <span>{currentItem.flagged ? `Bỏ cờ câu ${currentItem.number}` : `Cắm cờ câu ${currentItem.number}`}</span>
          </button>
        )}
      </div>

      {!compact && (
        <div
          className="flex flex-wrap items-center gap-4 text-xs"
          style={{ color: 'var(--color-text-dim)' }}
        >
          <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
            Đã làm: <strong style={{ color: 'var(--color-text)' }}>{answeredCount}/{items.length}</strong>
          </span>
          {flaggedCount > 0 && (
            <span className="inline-flex items-center gap-1 tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
              <Flag className="w-3 h-3" style={{ color: 'var(--color-partial)' }} />
              <span>Cắm cờ: {flaggedCount}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-[3px] border inline-block"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            />
            Chưa làm
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-[3px] border inline-block"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-info) 16%, var(--color-surface))',
                borderColor: 'var(--color-info)',
              }}
            />
            Đã làm
          </span>
        </div>
      )}
    </nav>
  );
};
