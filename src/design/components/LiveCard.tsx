import React, { useId } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import type { SkillColor } from './Button';
import { dur, spring } from '../motion';
import { useFxTier } from '../fx/fxTier';

export interface LiveCardProps {
  children: React.ReactNode;
  /** Mặt sau thẻ khi lật 3D (bắt buộc tách 2 mặt riêng theo SR-45 & WebKit bug 71624). */
  backContent?: React.ReactNode;
  flipped?: boolean;
  skill?: SkillColor;
  edition?: 'default' | 'mastered';
  breathing?: boolean;
  tilt?: boolean;
  /** Tắt chuyển động khi đang gõ trong ô nhập hoặc đã trả lời (03-ANIMATION §5). */
  disabledMotion?: boolean;
  examMode?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

const SKILL_VAR: Record<SkillColor, string> = {
  vocab: 'var(--color-vocab)',
  listening: 'var(--color-listening)',
  reading: 'var(--color-reading)',
  writing: 'var(--color-writing)',
  speaking: 'var(--color-speaking)',
  exam: 'var(--color-exam)',
  info: 'var(--color-info)',
};

const MAX_TILT_DEG = 6;

export const LiveCard: React.FC<LiveCardProps> = ({
  children,
  backContent,
  flipped = false,
  skill,
  edition = 'default',
  breathing = false,
  tilt = true,
  disabledMotion = false,
  examMode = false,
  onClick,
  ariaLabel,
  className = '',
}) => {
  const fx = useFxTier({ examMode });
  const phaseSeed = useId();
  const delaySec = (phaseSeed.charCodeAt(phaseSeed.length - 1) % 8) * 0.2;

  const canLiveMotion = fx.allowE2Living && !disabledMotion && !examMode;
  const canTilt = canLiveMotion && tilt && !flipped;
  const can3DFlip = (fx.tier === 'full' || fx.tier === 'medium') && !examMode;
  const hasBack = backContent !== undefined;

  const rawRx = useMotionValue(0);
  const rawRy = useMotionValue(0);
  const shadowX = useMotionValue(0);
  const shadowY = useMotionValue(8);
  const rx = useSpring(rawRx, { stiffness: 220, damping: 26 });
  const ry = useSpring(rawRy, { stiffness: 220, damping: 26 });
  const sx = useSpring(shadowX, { stiffness: 220, damping: 26 });
  const sy = useSpring(shadowY, { stiffness: 220, damping: 26 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canTilt || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rawRx.set(-ny * MAX_TILT_DEG * 2);
    rawRy.set(nx * MAX_TILT_DEG * 2);
    shadowX.set(-nx * 6);
    shadowY.set(12 - ny * 4);
  };

  const handlePointerLeave = () => {
    rawRx.set(0);
    rawRy.set(0);
    shadowX.set(0);
    shadowY.set(8);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const accent = skill ? SKILL_VAR[skill] : undefined;
  const faceStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    borderColor: accent ? `color-mix(in srgb, ${accent} 38%, var(--color-border))` : 'var(--color-border)',
    borderLeftWidth: accent ? '3px' : undefined,
    borderLeftColor: accent,
  };

  const pressProps =
    onClick && !examMode && fx.tier !== 'reduced'
      ? {
          whileTap: { scale: 0.96, transition: { duration: dur.instant } },
          whileHover: canLiveMotion ? { scale: 1.02, y: -2, transition: spring.snappy } : undefined,
        }
      : {};

  const interactiveAttrs = onClick
    ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-label': ariaLabel,
        onClick,
        onKeyDown: handleKeyDown,
      }
    : {};

  return (
    <div
      className={`relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ perspective: '1000px' }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...interactiveAttrs}
    >
      {/* Lớp bóng tách riêng chỉ animate transform (SR-44: không animate box-shadow) */}
      {!examMode && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)]"
          style={{
            backgroundColor: 'var(--color-backdrop)',
            opacity: 0.32,
            x: canTilt ? sx : 0,
            y: canTilt ? sy : 6,
            scale: 0.98,
          }}
        />
      )}

      {/* Khung chính: animate thở / nghiêng / nhấn (scale tối đa ≤ 1.03 trên chữ theo SR-45) */}
      <motion.div
        animate={
          canLiveMotion && breathing && !flipped
            ? { y: [0, -2, 0], rotate: [-0.35, 0.35, -0.35] }
            : { y: 0, rotate: 0 }
        }
        transition={
          canLiveMotion && breathing && !flipped
            ? { duration: 3.2, delay: delaySec, repeat: Infinity, ease: 'easeInOut' }
            : spring.soft
        }
        style={
          canTilt
            ? { rotateX: rx, rotateY: ry, transformStyle: hasBack && can3DFlip ? 'preserve-3d' : undefined }
            : undefined
        }
        {...pressProps}
      >
        {hasBack && can3DFlip ? (
          /* SR-45 & WebKit bug 71624: phần tử preserve-3d KHÔNG đặt overflow, opacity, filter, clip-path, mask */
          <motion.div
            data-live-card-flipper="3d"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={spring.soft}
            className="relative w-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              data-face="front"
              aria-hidden={flipped}
              className="w-full rounded-[var(--radius-lg)] border p-5 overflow-hidden"
              style={{
                ...faceStyle,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)',
              }}
            >
              {edition === 'mastered' && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)]"
                  style={{
                    backgroundImage:
                      'linear-gradient(115deg, transparent 30%, color-mix(in srgb, var(--color-partial) 18%, transparent) 50%, transparent 70%)',
                  }}
                />
              )}
              {children}
            </div>

            <div
              data-face="back"
              aria-hidden={!flipped}
              className="absolute inset-0 w-full rounded-[var(--radius-lg)] border p-5 overflow-hidden"
              style={{
                ...faceStyle,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {backContent}
            </div>
          </motion.div>
        ) : hasBack ? (
          /* Reduced-motion / bậc Thấp / Exam: crossfade 120 ms, không xoay 3D */
          <div
            data-live-card-flipper="crossfade"
            className="relative w-full rounded-[var(--radius-lg)] border p-5 overflow-hidden"
            style={faceStyle}
          >
            <motion.div
              key={flipped ? 'back' : 'front'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12 }}
            >
              {flipped ? backContent : children}
            </motion.div>
          </div>
        ) : (
          <div
            className="relative w-full rounded-[var(--radius-lg)] border p-5 overflow-hidden"
            style={faceStyle}
          >
            {edition === 'mastered' && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)]"
                style={{
                  backgroundImage:
                    'linear-gradient(115deg, transparent 30%, color-mix(in srgb, var(--color-partial) 18%, transparent) 50%, transparent 70%)',
                }}
              />
            )}
            {children}
          </div>
        )}
      </motion.div>
    </div>
  );
};
