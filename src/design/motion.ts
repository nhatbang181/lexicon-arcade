import type { Transition, Variants } from 'motion/react';

/* Token chuyển động theo 13-ANIMATION.md §2 & L-7 */
export const dur = {
  instant: 0.08,
  fast: 0.16,
  base: 0.24,
  slow: 0.4,
  celebrate: 0.9,
} as const;

export const ease = {
  out: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  in: [0.4, 0, 1, 1] as [number, number, number, number],
} as const;

export const spring = {
  snappy: { type: 'spring', stiffness: 500, damping: 32 } as Transition,
  soft: { type: 'spring', stiffness: 220, damping: 26 } as Transition,
  bouncy: { type: 'spring', stiffness: 380, damping: 14 } as Transition,
} as const;

export const reducedFadeTransition: Transition = {
  duration: 0.1,
  ease: 'linear',
};

export const routeVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.base, ease: ease.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: dur.fast, ease: ease.in },
  },
};

export const reducedRouteVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: reducedFadeTransition },
  exit: { opacity: 0, transition: reducedFadeTransition },
};

export const questionSlideVariants: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: dur.base, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: -24,
    transition: { duration: dur.fast, ease: ease.in },
  },
};

export const correctPopVariants: Variants = {
  idle: { scale: 1 },
  correct: {
    scale: [1, 1.06, 1],
    transition: { duration: 0.22, ease: ease.out },
  },
};

export const wrongShakeVariants: Variants = {
  idle: { x: 0 },
  wrong: {
    /* L-7: lắc thẻ ±6 px ×3 trong 300 ms, không rung màn hình */
    x: [0, -6, 6, -6, 6, -3, 3, 0],
    transition: { duration: 0.3, ease: ease.inOut },
  },
};

export const feedbackSlideVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring.soft,
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: { duration: dur.fast, ease: ease.in },
  },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: dur.fast, ease: ease.in },
  },
};

export function pickVariants(normal: Variants, reduced: boolean): Variants {
  return reduced ? reducedRouteVariants : normal;
}
