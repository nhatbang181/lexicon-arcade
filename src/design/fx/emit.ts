import { enqueueParticles, type ActiveParticle, type ParticleTextureName } from './fxCanvas';
import { getCurrentFxCapabilities } from './fxTier';

export type FxEmitKind = 'spark' | 'star' | 'ember' | 'smoke' | 'confetti' | 'magic' | 'flare' | 'twirl';

export interface FxEmitOptions {
  x: number;
  y: number;
  count?: number;
  colors?: string[];
  spread?: number;
  examMode?: boolean;
}

const KIND_TEXTURE: Record<FxEmitKind, ParticleTextureName> = {
  spark: 'spark',
  star: 'star',
  ember: 'flame',
  smoke: 'smoke',
  confetti: 'circle',
  magic: 'magic',
  flare: 'flare',
  twirl: 'twirl',
};

function resolveTokenColor(varName: string, fallback: string): string {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return val || fallback;
}

function defaultColorsFor(kind: FxEmitKind): string[] {
  const ok = resolveTokenColor('--color-correct', 'currentColor');
  const vocab = resolveTokenColor('--color-vocab', 'currentColor');
  const write = resolveTokenColor('--color-writing', 'currentColor');
  const info = resolveTokenColor('--color-info', 'currentColor');
  const dim = resolveTokenColor('--color-text-dim', 'currentColor');
  switch (kind) {
    case 'smoke':
      return [dim];
    case 'ember':
      return [write, resolveTokenColor('--color-speaking', write)];
    case 'star':
    case 'magic':
      return [ok, vocab, write];
    case 'confetti':
      return [ok, vocab, write, info];
    default:
      return [ok, info, vocab];
  }
}

/**
 * Bắn hạt VFX dùng 8 texture Kenney CC0 lên canvas overlay duy nhất.
 * Tự động hạ số hạt hoặc tắt theo `useFxTier()` / `prefers-reduced-motion` / `examMode`.
 */
export function emit(kind: FxEmitKind, options: FxEmitOptions): number {
  const caps = getCurrentFxCapabilities(options.examMode);
  if (!caps.allowParticles) return 0;

  const requested = options.count ?? (kind === 'smoke' ? 6 : 12);
  const count = Math.min(requested, caps.maxParticles);
  if (count <= 0) return 0;

  const palette = options.colors && options.colors.length > 0 ? options.colors : defaultColorsFor(kind);
  const texture = KIND_TEXTURE[kind];
  const spread = options.spread ?? Math.PI * 2;
  const list: ActiveParticle[] = [];

  for (let i = 0; i < count; i++) {
    const angle =
      kind === 'ember' || kind === 'smoke'
        ? -Math.PI / 2 + (Math.random() - 0.5) * 1.1
        : (i / count) * spread + (Math.random() - 0.5) * 0.45;
    const speed =
      kind === 'smoke'
        ? 28 + Math.random() * 44
        : kind === 'ember'
        ? 45 + Math.random() * 65
        : 90 + Math.random() * 140;

    list.push({
      x: options.x,
      y: options.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (kind === 'confetti' ? 90 : 20),
      gravity: kind === 'smoke' ? -25 : kind === 'ember' ? -45 : 320,
      size: kind === 'smoke' ? 22 + Math.random() * 12 : 14 + Math.random() * 12,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 6,
      lifeMs: 0,
      maxLifeMs: kind === 'confetti' ? 950 : 480 + Math.random() * 220,
      color: palette[i % palette.length],
      texture,
    });
  }

  return enqueueParticles(list, options.examMode);
}
