import type { Transition, Variants } from 'motion/react';

export const dur = {
  instant: 0.08,
  fast: 0.15,
  base: 0.22,
  slow: 0.35,
  celebrate: 0.6,
} as const;

export const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  in: [0.4, 0, 1, 1] as [number, number, number, number],
} as const;

export const spring = {
  snappy: { type: 'spring', stiffness: 520, damping: 32 } as Transition,
  soft: { type: 'spring', stiffness: 260, damping: 26 } as Transition,
  bouncy: { type: 'spring', stiffness: 420, damping: 14 } as Transition,
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
    scale: [1, 1.05, 1],
    transition: { duration: 0.3, ease: ease.out },
  },
};

export const wrongShakeVariants: Variants = {
  idle: { x: 0 },
  wrong: {
    x: [0, -6, 6, -4, 4, 0],
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
