import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import {
  ChoiceButton,
  FeedbackPanel,
  Pill,
  type ChoiceState,
} from '../../design/components';
import { dur } from '../../design/motion';
import { haptic, type FxTierCapabilities } from '../../design/fx';
import { playSfx } from '../../core/audio/sfx';
import type { CharDiffSegment, V1FeedbackState } from './engine';

/** Thanh tiến độ dày 8px có vệt sáng chạy qua (400ms, chỉ transform/opacity, SR-44). */
export const ProgressSweepBar: React.FC<{
  progress: number;
  sweepKey: number;
  isBoss?: boolean;
  allowSweep: boolean;
}> = ({ progress, sweepKey, isBoss = false, allowSweep }) => {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div
      className="relative h-2 flex-1 rounded-full overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
      }}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Tiến độ phiên chạy"
    >
      <div
        className="h-full w-full origin-left rounded-full"
        style={{
          backgroundColor: isBoss ? 'var(--color-wrong)' : 'var(--color-vocab)',
          transform: `scaleX(${clamped})`,
          transition: allowSweep ? 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
        }}
      />
      {allowSweep && sweepKey > 0 && (
        <motion.div
          key={sweepKey}
          aria-hidden="true"
          initial={{ x: '-100%', opacity: 0.7 }}
          animate={{ x: '220%', opacity: 0 }}
          transition={{ duration: dur.slow, ease: [0.2, 0.8, 0.2, 1] }}
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 rounded-full"
          style={{
            backgroundImage:
              'linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-text) 55%, transparent), transparent)',
          }}
        />
      )}
    </div>
  );
};

/** Icon ✓ vẽ nét 220ms (`pathLength 0 -> 1`) dùng khi trả lời đúng (03 §3 dòng 3). */
export const AnimatedCheckIcon: React.FC<{ animate: boolean; className?: string }> = ({
  animate,
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <motion.path
      d="M5 13l4 4L19 7"
      initial={animate ? { pathLength: 0, opacity: 0.4 } : false}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: animate ? 0.22 : 0, ease: [0.2, 0.8, 0.2, 1] }}
    />
  </svg>
);

/** Bọc `ChoiceButton` bổ sung tap scale .97 (80ms) + ripple tại điểm chạm (WAAPI, 0 re-render) + tap SFX + haptic. */
export const V1ChoiceItem: React.FC<{
  indexLabel: string;
  label: string;
  state: ChoiceState;
  disabled: boolean;
  examMode: boolean;
  fx: FxTierCapabilities;
  onSelect: (origin?: { x: number; y: number }) => void;
}> = ({ indexLabel, label, state, disabled, examMode, fx, onSelect }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const btn = e.currentTarget;
    const clientX = e.clientX;
    const clientY = e.clientY;
    const origin = clientX > 0 || clientY > 0 ? { x: clientX, y: clientY } : undefined;

    onSelect(origin);

    window.setTimeout(() => {
      playSfx('tap', { examMode });
      haptic('tap', { examMode });
      if (fx.allowE1Slide && !examMode && btn.isConnected && btn.parentElement) {
        const rect = btn.getBoundingClientRect();
        const clickX = clientX > 0 ? clientX : rect.left + rect.width / 2;
        const clickY = clientY > 0 ? clientY : rect.top + rect.height / 2;
        const host = btn.parentElement;
        const dot = document.createElement('span');
        dot.setAttribute('aria-hidden', 'true');
        dot.style.position = 'absolute';
        dot.style.pointerEvents = 'none';
        dot.style.width = '96px';
        dot.style.height = '96px';
        dot.style.borderRadius = '9999px';
        dot.style.left = `${clickX - rect.left - 48}px`;
        dot.style.top = `${clickY - rect.top - 48}px`;
        dot.style.backgroundColor = 'var(--color-vocab)';
        host.appendChild(dot);
        if (typeof dot.animate === 'function') {
          const anim = dot.animate(
            [
              { transform: 'scale(0)', opacity: 0.25 },
              { transform: 'scale(2.6)', opacity: 0 },
            ],
            { duration: 240, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
          );
          anim.onfinish = () => dot.remove();
        } else {
          window.setTimeout(() => dot.remove(), 250);
        }
      }
    }, 0);
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-[var(--radius-md)]"
      whileTap={
        !disabled && !examMode && fx.tier !== 'reduced'
          ? { scale: 0.97, transition: { duration: dur.instant } }
          : undefined
      }
    >
      <ChoiceButton
        indexLabel={indexLabel}
        label={label}
        state={state}
        disabled={disabled}
        examMode={examMode}
        onClick={handleClick}
      />
    </motion.div>
  );
};

export interface CharDiffBoxProps {
  segments: readonly CharDiffSegment[];
  correctAnswer: string;
  wrongCharNotice?: string;
  vnTrap?: string;
}

export const CharDiffBox: React.FC<CharDiffBoxProps> = ({
  segments,
  correctAnswer,
  wrongCharNotice,
  vnTrap,
}) => {
  return (
    <div
      className="rounded-[var(--radius-md)] border p-3.5 sm:p-4 space-y-2.5"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-wrong)',
      }}
      aria-label="So sánh từng ký tự"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold" style={{ color: 'var(--color-text-dim)' }}>
          Đối chiếu từng ký tự (ký tự sai tô đỏ):
        </span>
        {wrongCharNotice && (
          <span className="font-medium" style={{ color: 'var(--color-wrong)' }}>
            {wrongCharNotice}
          </span>
        )}
      </div>

      <div
        className="flex flex-wrap items-center gap-1 text-base font-bold tracking-wider"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {segments.map((seg) => {
          const isMatch = seg.status === 'match';
          return (
            <span
              key={seg.index}
              className="inline-flex items-center justify-center min-w-[26px] h-8 px-1.5 rounded border"
              style={{
                backgroundColor: isMatch
                  ? 'color-mix(in srgb, var(--color-correct) 12%, var(--color-surface-2))'
                  : 'color-mix(in srgb, var(--color-wrong) 22%, var(--color-surface-2))',
                borderColor: isMatch ? 'var(--color-correct)' : 'var(--color-wrong)',
                color: isMatch ? 'var(--color-correct)' : 'var(--color-wrong)',
              }}
              title={
                isMatch
                  ? `Đúng: ${seg.char}`
                  : `Bạn gõ: "${seg.char}" · Đúng: "${seg.expectedChar ?? ''}"`
              }
            >
              {seg.char}
            </span>
          );
        })}
      </div>

      <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
        Đáp án chuẩn:{' '}
        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-correct)' }}>
          {correctAnswer}
        </strong>
      </div>

      {vnTrap && (
        <div
          className="text-xs px-3 py-2 rounded border flex items-start gap-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-partial) 12%, var(--color-surface-2))',
            borderColor: 'var(--color-partial)',
            color: 'var(--color-text)',
          }}
        >
          <AlertTriangle
            className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: 'var(--color-partial)' }}
            aria-hidden="true"
          />
          <span>
            <strong>Bẫy hay gặp:</strong> {vnTrap}
          </span>
        </div>
      )}
    </div>
  );
};

export const GameLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a
    href={href}
    className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-[var(--radius-md)] border text-sm font-medium"
    style={{
      backgroundColor: 'var(--color-surface-2)',
      color: 'var(--color-text)',
      borderColor: 'var(--color-border)',
    }}
  >
    {children}
  </a>
);

/** Tô bằng chứng trong đoạn văn (chỉ truyền `quote` sau khi đã trả lời để không lộ đáp án). */
export const QuoteHighlight: React.FC<{ text: string; quote?: string }> = ({ text, quote }) => {
  if (!quote) return <>{text}</>;
  const at = text.indexOf(quote);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark
        className="rounded px-0.5"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-correct) 22%, transparent)',
          color: 'var(--color-text)',
        }}
      >
        {quote}
      </mark>
      {text.slice(at + quote.length)}
    </>
  );
};

/**
 * Hiển thị khung từ gõ (`c _ _ _ _ _ _ _ _ _`) không bị rơi lẻ 1 dấu `_` xuống dòng mới
 * trên màn nhỏ (375–390px): mỗi từ trong cụm tách theo ` · ` được giữ `whitespace-nowrap`.
 */
export const PlaceholderMaskDisplay: React.FC<{
  mask: string;
  size?: 'lg' | 'sm';
  prefix?: string;
}> = ({ mask, size = 'lg', prefix }) => {
  const segments = mask.split(' · ');
  const isLg = size === 'lg';
  return (
    <span
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 max-w-full overflow-x-auto ${
        isLg
          ? 'text-sm sm:text-base font-bold tracking-[0.06em] sm:tracking-[0.14em]'
          : 'text-xs font-semibold tracking-[0.05em] sm:tracking-[0.1em]'
      }`}
      style={{
        fontFamily: 'var(--font-mono)',
        color: isLg ? 'var(--color-vocab)' : 'var(--color-text-dim)',
      }}
    >
      {prefix && (
        <span className="font-sans font-normal tracking-normal shrink-0">{prefix}</span>
      )}
      {segments.map((seg, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && (
            <span aria-hidden="true" className="opacity-60">
              ·
            </span>
          )}
          <span className="whitespace-nowrap">{seg}</span>
        </React.Fragment>
      ))}
    </span>
  );
};

const TYPEWRITER_MS = 18;

/**
 * Khối phản hồi tách riêng để hiệu ứng chữ hiện dần kiểu Undertale (18ms/ký tự, bấm/Space hiện hết)
 * chỉ re-render đúng vùng FeedbackPanel, không kéo theo re-render toàn màn V1.
 */
export const V1FeedbackSection: React.FC<{
  feedback: V1FeedbackState;
  isBossPhase: boolean;
  examMode: boolean;
  fx: FxTierCapabilities;
  onNext: () => void;
}> = ({ feedback, isBossPhase, examMode, fx, onNext }) => {
  const vnTrapAlreadyInTip =
    Boolean(feedback.vnTrap) &&
    Boolean(feedback.nextTipVi && feedback.nextTipVi.includes(feedback.vnTrap!));
  const fullExplanation =
    feedback.vnTrap &&
    !vnTrapAlreadyInTip &&
    !feedback.explanationVi.includes(feedback.vnTrap)
      ? `${feedback.explanationVi} · Lưu ý: ${feedback.vnTrap}`
      : feedback.explanationVi;

  const shouldTypewriter = feedback.status !== 'correct' && fx.allowE1Slide && !examMode;
  const [shownChars, setShownChars] = useState<number>(
    shouldTypewriter ? 0 : fullExplanation.length,
  );

  useEffect(() => {
    if (!shouldTypewriter) {
      setShownChars(fullExplanation.length);
      return;
    }
    setShownChars(0);
    let idx = 0;
    const interval = window.setInterval(() => {
      idx += 1;
      setShownChars(idx);
      if (idx >= fullExplanation.length) {
        window.clearInterval(interval);
      }
    }, TYPEWRITER_MS);
    return () => window.clearInterval(interval);
  }, [feedback.nodeId, fullExplanation, shouldTypewriter]);

  useEffect(() => {
    if (shownChars >= fullExplanation.length) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== ' ' || e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      e.preventDefault();
      setShownChars(fullExplanation.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shownChars, fullExplanation.length]);

  return (
    <div
      className="space-y-2.5"
      onClick={() => {
        if (shownChars < fullExplanation.length) {
          setShownChars(fullExplanation.length);
        }
      }}
    >
      {feedback.status === 'correct' && feedback.collocationHighlight && (
        <motion.div
          initial={fx.allowE1Slide ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.fast }}
          className="rounded-[var(--radius-md)] border px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--color-correct) 12%, var(--color-surface))',
            borderColor: 'var(--color-correct)',
          }}
        >
          <div className="flex items-center gap-2">
            {!examMode && (
              <Pill
                tone="correct"
                icon={<AnimatedCheckIcon animate={fx.allowE1Slide} className="w-3.5 h-3.5" />}
              >
                +{feedback.xpEarned} XP
              </Pill>
            )}
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
              Collocation:
            </span>
            <strong
              className="text-sm font-bold"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
            >
              {feedback.collocationHighlight}
            </strong>
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
            Tự chuyển · Enter
          </span>
        </motion.div>
      )}

      {(feedback.status === 'wrong' || feedback.status === 'partial') && feedback.charDiff && (
        <CharDiffBox
          segments={feedback.charDiff}
          correctAnswer={feedback.correctAnswer}
          wrongCharNotice={feedback.wrongCharNotice}
          vnTrap={feedback.vnTrap}
        />
      )}

      <FeedbackPanel
        open={true}
        status={feedback.status}
        title={
          feedback.status === 'correct'
            ? 'Chính xác!'
            : feedback.status === 'partial'
            ? 'Gần đúng (Sai 1 ký tự → chấm Hard)'
            : isBossPhase
            ? 'Chưa chính xác (thẻ sẽ quay lại ở cuối Boss)'
            : 'Chưa chính xác (thẻ sẽ quay lại sau 3–5 thẻ)'
        }
        correctAnswer={feedback.correctAnswer}
        explanation={fullExplanation.slice(0, shownChars)}
        evidenceQuote={feedback.exampleEn}
        nextTipVi={feedback.nextTipVi}
        onNext={onNext}
      />
    </div>
  );
};
