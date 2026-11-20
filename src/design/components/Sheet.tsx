import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { spring } from '../motion';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  side?: 'bottom' | 'right';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  side = 'right',
  children,
  footer,
}) => {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const initialPos = prefersReduced
    ? { opacity: 0 }
    : side === 'right'
    ? { opacity: 0, x: 48 }
    : { opacity: 0, y: 48 };

  const animatePos = prefersReduced ? { opacity: 1 } : { opacity: 1, x: 0, y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <motion.div
            initial={initialPos}
            animate={animatePos}
            exit={initialPos}
            transition={prefersReduced ? { duration: 0.1 } : spring.soft}
            className={`relative z-10 flex flex-col border ${
              side === 'right'
                ? 'ml-auto h-full w-full max-w-md border-l'
                : 'mt-auto w-full max-h-[85vh] rounded-t-[var(--radius-xl)] border-t'
            } p-6 overflow-y-auto`}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] border cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-dim)',
                }}
                aria-label="Đóng bảng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
              {children}
            </div>

            {footer && (
              <div
                className="pt-4 border-t flex items-center justify-end gap-3"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
