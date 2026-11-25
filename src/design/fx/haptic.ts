import { getMotionPrefSnapshot } from './motionPref';

export type HapticKind = 'tap' | 'correct' | 'wrong' | 'streak' | 'celebrate' | 'timeup';

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 8,
  correct: 15,
  wrong: [25, 35, 25],
  streak: 20,
  celebrate: 45,
  timeup: 60,
};

/**
 * Rung nhẹ bổ sung trên thiết bị hỗ trợ `navigator.vibrate`.
 * An toàn tuyệt đối trên iOS Safari (không có API vibrate) và tôn trọng công tắc "Tắt rung".
 */
export function haptic(kind: HapticKind | number | number[], options?: { examMode?: boolean }): boolean {
  const prefs = getMotionPrefSnapshot();
  if (prefs.disableHaptic) return false;
  if (options?.examMode && kind !== 'timeup') return false;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;

  const pattern = typeof kind === 'string' ? PATTERNS[kind] : kind;
  try {
    return Boolean(navigator.vibrate(pattern));
  } catch {
    return false;
  }
}
