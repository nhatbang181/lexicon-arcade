import { getCurrentFxCapabilities } from './fxTier';

export type ScreenPunchMode = 'wrong-card' | 'boss' | 'levelup';

export interface ScreenPunchOptions {
  mode?: ScreenPunchMode;
  /** Biên độ px: wrong-card khoá ≤ 6 px (L-7); boss/levelup khoá ≤ 8 px (13-ANIMATION §0). */
  amplitudePx?: number;
  /** Thời lượng ms (luôn ≤ 300 ms). */
  durationMs?: number;
  /** Hit-stop ms (chỉ cho boss/levelup ở bậc full, khoá ≤ 50 ms). */
  hitStopMs?: number;
  examMode?: boolean;
}

/**
 * Rung/đấm nhẹ bằng `transform` trên phần tử đích (SR-44, L-7):
 * - `wrong-card`: lắc thẻ câu ±6 px ×3 trong 300 ms — CẤM rung màn hình (`body`/`html`) khi sai!
 * - `boss` / `levelup`: rung ≤ 8 px ≤ 300 ms, kèm hit-stop tối đa 50 ms ở bậc `full`.
 */
export function screenPunch(target: HTMLElement | null | undefined, options: ScreenPunchOptions = {}): boolean {
  if (!target) return false;
  const mode = options.mode ?? 'wrong-card';
  const caps = getCurrentFxCapabilities(options.examMode);

  if (mode === 'wrong-card') {
    if (!caps.allowShake) return false;
    // Luật L-7: KHÔNG rung màn hình khi trả lời sai
    if (
      typeof document !== 'undefined' &&
      (target === document.body || target === document.documentElement)
    ) {
      return false;
    }
  } else if (!caps.allowE1Slide) {
    return false;
  }

  const maxAmp = mode === 'wrong-card' ? 6 : 8;
  const amp = Math.min(maxAmp, Math.max(2, options.amplitudePx ?? maxAmp));
  const duration = Math.min(300, Math.max(120, options.durationMs ?? 300));
  const delay =
    mode !== 'wrong-card' && caps.tier === 'full'
      ? Math.min(50, Math.max(0, options.hitStopMs ?? 50))
      : 0;

  if (typeof target.animate !== 'function') return true;

  const keyframes: Keyframe[] =
    mode === 'wrong-card'
      ? [
          { transform: 'translate3d(0, 0, 0)' },
          { transform: `translate3d(${-amp}px, 0, 0)` },
          { transform: `translate3d(${amp}px, 0, 0)` },
          { transform: `translate3d(${-amp}px, 0, 0)` },
          { transform: `translate3d(${amp}px, 0, 0)` },
          { transform: `translate3d(${-Math.round(amp / 2)}px, 0, 0)` },
          { transform: `translate3d(${Math.round(amp / 2)}px, 0, 0)` },
          { transform: 'translate3d(0, 0, 0)' },
        ]
      : [
          { transform: 'translate3d(0, 0, 0) scale(1)' },
          { transform: `translate3d(0, ${Math.round(amp * 0.6)}px, 0) scale(1.03)` },
          { transform: `translate3d(${-Math.round(amp * 0.5)}px, ${-Math.round(amp * 0.4)}px, 0) scale(1.02)` },
          { transform: `translate3d(${Math.round(amp * 0.4)}px, 0, 0) scale(1.01)` },
          { transform: 'translate3d(0, 0, 0) scale(1)' },
        ];

  target.animate(keyframes, {
    duration,
    delay,
    easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
  });
  return true;
}
