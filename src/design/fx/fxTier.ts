import { useSyncExternalStore } from 'react';
import { getMotionPrefSnapshot, isReducedMotionActive, useMotionPref } from './motionPref';

export type FxTier = 'full' | 'medium' | 'low' | 'reduced' | 'exam';

export interface FxTierCapabilities {
  tier: FxTier;
  /** E0: phản hồi học (màu, icon, đáp án đúng) — không bao giờ cắt trừ Exam. */
  allowE0: boolean;
  /** Rung ngang thẻ khi sai (tắt ở reduced/exam). */
  allowShake: boolean;
  /** E1 trượt/spring (ở low/reduced đổi sang fade 100 ms). */
  allowE1Slide: boolean;
  /** E2 trang trí sống (nghiêng/specular LiveCard, Lexi chuyển động đầy đủ). */
  allowE2Living: boolean;
  /** Bật canvas hạt Kenney. */
  allowParticles: boolean;
  maxParticles: number;
  /** E3 lễ hội (confetti, tia sáng mốc lớn). */
  allowE3: boolean;
  maxConfetti: number;
  canvasMaxDpr: number;
}

interface FrameSample {
  ts: number;
  deltaMs: number;
}

const WINDOW_FPS_MS = 3_000;
const WINDOW_SPIKE_MS = 5_000;
const UPGRADE_COOLDOWN_MS = 30_000;

let samples: FrameSample[] = [];
let runtimeTier: 'full' | 'medium' | 'low' = detectInitialHardwareTier();
let lastDowngradeTs = 0;
const tierListeners = new Set<() => void>();

function detectInitialHardwareTier(): 'full' | 'medium' {
  if (typeof navigator === 'undefined') return 'full';
  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 8;
  const mem =
    typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 'number'
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory!
      : 8;
  if (cores <= 4 || mem <= 4) return 'medium';
  return 'full';
}

function notifyTier(): void {
  for (const fn of tierListeners) fn();
}

export function subscribeFxTier(listener: () => void): () => void {
  tierListeners.add(listener);
  return () => tierListeners.delete(listener);
}

/**
 * Ghi nhận một mẫu thời gian khung hình (ms) từ vòng rAF khi đang có animation.
 * Theo 13-ANIMATION.md §3:
 * - FPS < 40 trong 3 s HOẶC ≥ 3 frame > 50 ms trong 5 s -> hạ ngay xuống 'low'
 * - FPS < 50 trong 3 s -> hạ xuống 'medium'
 * - Chỉ nâng bậc lại sau 30 s ổn định (tránh nhảy qua lại).
 */
export function reportFrameSample(deltaMs: number, now = performance.now()): void {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
  samples.push({ ts: now, deltaMs });

  const cutoffSpike = now - WINDOW_SPIKE_MS;
  while (samples.length > 0 && samples[0].ts < cutoffSpike) {
    samples.shift();
  }

  const spikeCount = samples.reduce((acc, s) => (s.deltaMs > 50 ? acc + 1 : acc), 0);
  const recent3s = samples.filter((s) => s.ts >= now - WINDOW_FPS_MS);
  const avgDelta =
    recent3s.length >= 6 ? recent3s.reduce((acc, s) => acc + s.deltaMs, 0) / recent3s.length : 16.6;
  const avgFps = avgDelta > 0 ? 1000 / avgDelta : 60;

  let next = runtimeTier;
  if (spikeCount >= 3 || (recent3s.length >= 6 && avgFps < 40)) {
    next = 'low';
  } else if (recent3s.length >= 6 && avgFps < 50) {
    if (runtimeTier === 'full') next = 'medium';
  } else if (recent3s.length >= 12 && avgFps >= 55 && spikeCount === 0) {
    const hwCap = detectInitialHardwareTier();
    if (now - lastDowngradeTs >= UPGRADE_COOLDOWN_MS) {
      if (runtimeTier === 'low') next = 'medium';
      else if (runtimeTier === 'medium' && hwCap === 'full') next = 'full';
    }
  }

  if (next !== runtimeTier) {
    const order = { low: 0, medium: 1, full: 2 } as const;
    if (order[next] < order[runtimeTier]) {
      lastDowngradeTs = now;
    }
    runtimeTier = next;
    notifyTier();
  }
}

export function getRuntimeFxTier(): 'full' | 'medium' | 'low' {
  return runtimeTier;
}

export function resolveFxTier(options?: {
  examMode?: boolean;
  reducedMotion?: boolean;
  disableParticles?: boolean;
  runtime?: 'full' | 'medium' | 'low';
}): FxTier {
  if (options?.examMode) return 'exam';
  const reduced = options?.reducedMotion ?? isReducedMotionActive();
  if (reduced) return 'reduced';
  const noParticles = options?.disableParticles ?? getMotionPrefSnapshot().disableParticles;
  if (noParticles) return 'low';
  return options?.runtime ?? runtimeTier;
}

export function getFxCapabilities(tier: FxTier): FxTierCapabilities {
  switch (tier) {
    case 'exam':
      return {
        tier,
        allowE0: false,
        allowShake: false,
        allowE1Slide: false,
        allowE2Living: false,
        allowParticles: false,
        maxParticles: 0,
        allowE3: false,
        maxConfetti: 0,
        canvasMaxDpr: 1,
      };
    case 'reduced':
      return {
        tier,
        allowE0: true,
        allowShake: false,
        allowE1Slide: false,
        allowE2Living: false,
        allowParticles: false,
        maxParticles: 0,
        allowE3: false,
        maxConfetti: 0,
        canvasMaxDpr: 1,
      };
    case 'low':
      return {
        tier,
        allowE0: true,
        allowShake: true,
        allowE1Slide: false,
        allowE2Living: false,
        allowParticles: false,
        maxParticles: 0,
        allowE3: false,
        maxConfetti: 0,
        canvasMaxDpr: 1,
      };
    case 'medium':
      return {
        tier,
        allowE0: true,
        allowShake: true,
        allowE1Slide: true,
        allowE2Living: false,
        allowParticles: true,
        maxParticles: 16,
        allowE3: true,
        maxConfetti: 40,
        canvasMaxDpr: 1.5,
      };
    case 'full':
    default:
      return {
        tier: 'full',
        allowE0: true,
        allowShake: true,
        allowE1Slide: true,
        allowE2Living: true,
        allowParticles: true,
        maxParticles: 40,
        allowE3: true,
        maxConfetti: 120,
        canvasMaxDpr: 2,
      };
  }
}

export function getCurrentFxCapabilities(examMode = false): FxTierCapabilities {
  return getFxCapabilities(resolveFxTier({ examMode }));
}

/** Dành cho unit test đặt lại bộ đo FPS & bậc FX. */
export function resetFxTierForTest(initial: 'full' | 'medium' | 'low' = 'full'): void {
  samples = [];
  runtimeTier = initial;
  lastDowngradeTs = 0;
  notifyTier();
}

export function useFxTier(options?: { examMode?: boolean }): FxTierCapabilities {
  const { reducedMotion, disableParticles } = useMotionPref();
  const rt = useSyncExternalStore<'full' | 'medium' | 'low'>(
    subscribeFxTier,
    getRuntimeFxTier,
    () => 'full',
  );
  const tier = resolveFxTier({
    examMode: options?.examMode,
    reducedMotion,
    disableParticles,
    runtime: rt,
  });
  return getFxCapabilities(tier);
}
