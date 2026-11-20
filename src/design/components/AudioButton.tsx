import React from 'react';
import { Volume2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export interface AudioButtonProps {
  playing?: boolean;
  onToggle?: () => void;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  playing = false,
  onToggle,
  label,
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const sizeClass =
    size === 'sm' ? 'min-h-[36px] px-2.5 py-1.5 text-xs' : 'min-h-[44px] px-3.5 py-2 text-sm';

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-[var(--radius-md)] border font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${className}`}
      style={{
        backgroundColor: playing
          ? 'color-mix(in srgb, var(--color-listening) 16%, var(--color-surface))'
          : 'var(--color-surface-2)',
        borderColor: playing ? 'var(--color-listening)' : 'var(--color-border)',
        color: playing ? 'var(--color-listening)' : 'var(--color-text)',
      }}
      aria-label={label || (playing ? 'Đang phát âm thanh' : 'Phát âm thanh')}
      aria-pressed={playing}
    >
      {playing ? (
        <span className="inline-flex items-end gap-0.5 h-4 w-4 justify-center" aria-hidden="true">
          {[0, 1, 2].map((bar) => (
            <motion.span
              key={bar}
              animate={
                prefersReduced
                  ? { opacity: [0.5, 1, 0.5] }
                  : { scaleY: [0.4, 1, 0.5, 0.9, 0.4] }
              }
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: bar * 0.12,
                ease: 'easeInOut',
              }}
              className="w-1 h-3.5 rounded-full origin-bottom"
              style={{ backgroundColor: 'var(--color-listening)' }}
            />
          ))}
        </span>
      ) : (
        <Volume2 className="w-4 h-4 shrink-0" />
      )}
      {label && <span>{label}</span>}
    </button>
  );
};
