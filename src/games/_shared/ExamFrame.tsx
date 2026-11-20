import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, LogOut } from 'lucide-react';
import { playSfx, sfxEngine } from '../../core/audio/sfx';
import {
  Button,
  QuestionNav,
  Timer,
  type QuestionNavItem,
} from '../../design/components';

export interface ExamFrameProps {
  /** Header title, e.g. "IELTS Academic Reading · Passage 1" */
  title: string;
  /** Subtitle or instructions summary */
  subtitle?: string;
  /** Total duration in seconds (defaults to 20 minutes = 1200s) */
  durationSec?: number;
  /** Controlled remaining seconds (if omitted, ExamFrame runs its own internal countdown) */
  remainingSec?: number;
  /** Whether the exam has been submitted (stops countdown) */
  submitted?: boolean;
  /** Navigation items for QuestionNav (1..14) */
  navItems: readonly QuestionNavItem[];
  currentQid: string;
  onSelectQuestion: (qid: string) => void;
  onToggleFlag?: (qid: string) => void;
  /** Triggered when user clicks Submit or countdown reaches 0 */
  onSubmit: (reason: 'manual' | 'timeout') => void;
  /** Optional exit handler */
  onExit?: () => void;
  /** Optional tick callback when using internal timer */
  onTick?: (remainingSec: number) => void;
  children: React.ReactNode;
  className?: string;
}

const DEFAULT_EXAM_DURATION_SEC = 20 * 60;

export const ExamFrame: React.FC<ExamFrameProps> = ({
  title,
  subtitle,
  durationSec = DEFAULT_EXAM_DURATION_SEC,
  remainingSec: controlledRemainingSec,
  submitted = false,
  navItems,
  currentQid,
  onSelectQuestion,
  onToggleFlag,
  onSubmit,
  onExit,
  onTick,
  children,
  className = '',
}) => {
  const [internalRemaining, setInternalRemaining] = useState(durationSec);
  const timeoutFiredRef = useRef(false);

  const activeRemaining = controlledRemainingSec ?? internalRemaining;

  // Reset internal timer if duration changes for a new passage
  useEffect(() => {
    setInternalRemaining(durationSec);
    timeoutFiredRef.current = false;
  }, [durationSec]);

  // Mute non-exam SFX while ExamFrame is active (docs/10-MOTION-AND-SOUND.md §3)
  useEffect(() => {
    sfxEngine.setExamMode(true);
    return () => {
      sfxEngine.setExamMode(false);
    };
  }, []);

  // Internal countdown when uncontrolled
  useEffect(() => {
    if (controlledRemainingSec !== undefined || submitted) return;
    const timer = window.setInterval(() => {
      setInternalRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        onTick?.(next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [controlledRemainingSec, onTick, submitted]);

  // Auto-submit when countdown hits 0
  useEffect(() => {
    if (submitted || timeoutFiredRef.current) return;
    if (activeRemaining <= 0) {
      timeoutFiredRef.current = true;
      playSfx('countdownEnd', { examMode: true });
      onSubmit('timeout');
    }
  }, [activeRemaining, onSubmit, submitted]);

  const answeredCount = navItems.filter((i) => i.answered).length;

  return (
    <div
      data-theme="exam"
      data-mode="exam"
      data-testid="exam-frame"
      className={`min-h-[calc(100vh-56px)] flex flex-col ${className}`}
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      {/* Neutral computer-delivered IELTS top bar (no XP, no skill glow, no reward animations) */}
      <header
        className="px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              EXAM MODE
            </span>
            <h1 className="text-sm sm:text-base font-bold truncate" style={{ color: 'var(--color-text)' }}>
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-dim)' }}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Timer
            remainingSec={activeRemaining}
            totalSec={durationSec}
            examMode={true}
            size="md"
          />

          {!submitted && (
            <Button
              variant="primary"
              skill="exam"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => onSubmit('manual')}
              data-testid="exam-submit-btn"
            >
              Nộp bài ({answeredCount}/{navItems.length})
            </Button>
          )}

          {onExit && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={onExit}
            >
              Thoát thi
            </Button>
          )}
        </div>
      </header>

      {/* Exam workspace */}
      <div className="flex-1 p-4 sm:p-5 max-w-[1440px] w-full mx-auto">
        {children}
      </div>

      {/* Persistent computer-test bottom question navigator */}
      <footer
        className="px-4 sm:px-6 py-3 border-t sticky bottom-0 z-10 shrink-0"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-[1440px] mx-auto">
          <QuestionNav
            items={navItems}
            currentQid={currentQid}
            onSelect={onSelectQuestion}
            onToggleFlag={submitted ? undefined : onToggleFlag}
          />
        </div>
      </footer>
    </div>
  );
};
