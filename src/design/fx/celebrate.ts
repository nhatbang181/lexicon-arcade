import { getCurrentFxCapabilities } from './fxTier';

export type CelebrateKind = 'session' | 'dailyGoal' | 'streakMilestone' | 'bandUp' | 'mastered';

export interface CelebrateOptions {
  colors?: string[];
  examMode?: boolean;
}

const DEFAULT_COUNTS: Record<CelebrateKind, number> = {
  session: 60,
  dailyGoal: 100,
  streakMilestone: 120,
  bandUp: 120,
  mastered: 70,
};

/**
 * Ăn mừng E3 ở mốc lớn (Recap ≥ 80%, mục tiêu ngày, mốc streak, lên band, Mastered).
 * Tải lười `canvas-confetti`, tự cắt hoặc tắt ở bậc `low`/`reduced`/`exam`.
 */
export async function celebrate(kind: CelebrateKind, options: CelebrateOptions = {}): Promise<boolean> {
  const caps = getCurrentFxCapabilities(options.examMode);
  if (!caps.allowE3 || caps.maxConfetti <= 0) return false;
  if (typeof window === 'undefined') return false;

  const particleCount = Math.min(DEFAULT_COUNTS[kind], caps.maxConfetti);
  try {
    const mod = await import('canvas-confetti');
    const confetti = mod.default ?? mod;
    if (typeof confetti !== 'function') return false;
    void confetti({
      particleCount,
      spread: kind === 'session' ? 65 : 85,
      origin: { y: 0.68 },
      disableForReducedMotion: true,
      ...(options.colors && options.colors.length > 0 ? { colors: options.colors } : {}),
    });
    return true;
  } catch {
    return false;
  }
}
