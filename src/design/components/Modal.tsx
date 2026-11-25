import React, { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { modalVariants, reducedRouteVariants } from '../motion';
import { useDialogFocusTrap } from './focusTrap';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidthClass = 'max-w-lg',
}) => {
  const prefersReduced = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useDialogFocusTrap(open, panelRef, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 'var(--z-modal)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-xs"
            style={{ backgroundColor: 'var(--color-backdrop)' }}
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            variants={prefersReduced ? reducedRouteVariants : modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative z-10 w-full ${maxWidthClass} rounded-[var(--radius-lg)] border p-6 outline-none`}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-lg font-bold"
                  style={{ color: 'var(--color-text)' }}
                >
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
                className="inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-[var(--radius-sm)] border cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-dim)',
                }}
                aria-label="Đóng hộp thoại"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm" style={{ color: 'var(--color-text)' }}>
              {children}
            </div>

            {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
