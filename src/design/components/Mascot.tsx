import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  getMascotLine,
  getMascotTapTip,
  MASCOT_STATE_ALT_VI,
  type MascotContext,
  type MascotState,
} from '../../content/mascotLines';
import { dur, spring } from '../motion';
import { emit } from '../fx/emit';
import { useFxTier } from '../fx/fxTier';
import { haptic } from '../fx/haptic';
import { useMotionPref } from '../fx/motionPref';

export interface MascotProps {
  state: MascotState;
  say?: string;
  context?: MascotContext;
  /** Cỡ hiển thị (px): iPhone 72–120, laptop ≤ 220 (SR-46, 11-ASSET §4). */
  size?: number;
  interactive?: boolean;
  showBubble?: boolean;
  examMode?: boolean;
  className?: string;
}

const TAP_COOLDOWN_MS = 2_000;
const TYPEWRITER_STEP_MS = 18;
const TAP_EXPRESSIONS: readonly MascotState[] = ['vui', 'co-vu', 'chao'];

function getBaseUrl(): string {
  const base = import.meta.env?.BASE_URL ?? '/';
  return base.endsWith('/') ? base : `${base}/`;
}

export const Mascot: React.FC<MascotProps> = ({
  state,
  say,
  context,
  size = 96,
  interactive = true,
  showBubble = true,
  examMode = false,
  className = '',
}) => {
  const { showMascot, mascotName } = useMotionPref();
  const fx = useFxTier({ examMode });
  const [tapState, setTapState] = useState<MascotState | null>(null);
  const [tapTip, setTapTip] = useState<string | null>(null);
  const tapCountRef = useRef(0);
  const lastTapTsRef = useRef(0);
  const tapResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeState = tapState ?? state;
  const fullText = tapTip ?? say ?? getMascotLine(activeState, context);
  const shouldAnimateText = fx.allowE1Slide && fullText.length > 0;
  const [shownCount, setShownCount] = useState<number>(shouldAnimateText ? 0 : fullText.length);

  useEffect(() => {
    setTapState(null);
    setTapTip(null);
  }, [state, say]);

  useEffect(() => {
    if (!shouldAnimateText) {
      setShownCount(fullText.length);
      return;
    }
    setShownCount(0);
    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setShownCount(idx);
      if (idx >= fullText.length) {
        clearInterval(timer);
      }
    }, TYPEWRITER_STEP_MS);
    return () => clearInterval(timer);
  }, [fullText, shouldAnimateText]);

  useEffect(() => {
    return () => {
      if (tapResetRef.current) clearTimeout(tapResetRef.current);
    };
  }, []);

  // Luật SR-24, SR-50, J10: Exam mode hoặc người học tắt "Hiện nhân vật" → ẩn hoàn toàn
  if (examMode || !showMascot) {
    return null;
  }

  const clampedSize = Math.max(48, Math.min(220, Math.round(size)));
  const imgSrc = `${getBaseUrl()}assets/mascot/lexi-${activeState}.webp`;
  const altText = `${mascotName} ${MASCOT_STATE_ALT_VI[activeState]}`;
  const visibleText = fullText.slice(0, shownCount);

  const handleMascotTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!interactive) return;
    const now = Date.now();
    if (now - lastTapTsRef.current < TAP_COOLDOWN_MS) return;
    lastTapTsRef.current = now;

    const count = tapCountRef.current;
    tapCountRef.current += 1;
    setTapState(TAP_EXPRESSIONS[count % TAP_EXPRESSIONS.length]);
    setTapTip(getMascotTapTip(count));
    haptic('tap', { examMode });

    if (fx.allowParticles) {
      const rect = e.currentTarget.getBoundingClientRect();
      emit('spark', {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        count: 4,
        examMode,
      });
    }

    if (tapResetRef.current) clearTimeout(tapResetRef.current);
    tapResetRef.current = setTimeout(() => {
      setTapState(null);
      setTapTip(null);
    }, 3_600);
  };

  const idleMotion =
    fx.tier === 'full' || fx.tier === 'medium'
      ? activeState === 'an-mung'
        ? { y: [0, -10, 0], scale: [1, 1.04, 1] }
        : activeState === 'vui' || activeState === 'chao'
        ? { y: [0, -6, 0], scale: [1, 1.03, 1] }
        : activeState === 'suy-nghi'
        ? { rotate: [-2.5, 2.5, -2.5] }
        : activeState === 'co-vu'
        ? { rotate: [0, 3.5, 0] }
        : { scale: [1, 1.02, 1] }
      : undefined;

  const idleTransition =
    fx.tier === 'full' || fx.tier === 'medium'
      ? activeState === 'an-mung' || activeState === 'vui' || activeState === 'chao'
        ? { duration: 0.55, ease: 'easeOut' as const }
        : { duration: activeState === 'ngu' ? 4 : 3, repeat: Infinity, ease: 'easeInOut' as const }
      : { duration: dur.fast };

  const avatar = (
    <motion.div
      key={activeState}
      initial={fx.allowE1Slide ? { opacity: 0.7, scaleY: 0.92 } : false}
      animate={idleMotion ?? { opacity: 1, scaleY: 1 }}
      transition={idleMotion ? idleTransition : spring.bouncy}
      className="aspect-square shrink-0 select-none"
      style={{ width: clampedSize, height: clampedSize }}
    >
      <img
        src={imgSrc}
        alt={altText}
        width={clampedSize}
        height={clampedSize}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-contain block"
        draggable={false}
      />
    </motion.div>
  );

  return (
    <div
      data-mascot={activeState}
      className={`inline-flex items-center gap-3 max-w-full ${className}`}
    >
      {interactive ? (
        <button
          type="button"
          onClick={handleMascotTap}
          className="inline-flex items-center justify-center rounded-[var(--radius-md)] cursor-pointer min-w-[44px] min-h-[44px] p-1 focus-visible:outline-2"
          style={{ backgroundColor: 'transparent' }}
          aria-label={`Chạm vào ${mascotName} để nhận mẹo học`}
        >
          {avatar}
        </button>
      ) : (
        avatar
      )}

      {showBubble && fullText && (
        <div
          role="status"
          aria-live="polite"
          onClick={() => setShownCount(fullText.length)}
          className="rounded-[var(--radius-md)] border px-3.5 py-2.5 text-sm leading-snug max-w-[280px] cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span className="sr-only">{mascotName} nói: </span>
          {visibleText}
        </div>
      )}
    </div>
  );
};
