import { getCurrentFxCapabilities, reportFrameSample } from './fxTier';

export type ParticleTextureName =
  | 'spark'
  | 'star'
  | 'circle'
  | 'flare'
  | 'smoke'
  | 'flame'
  | 'magic'
  | 'twirl';

export interface ActiveParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  size: number;
  rotation: number;
  vRot: number;
  lifeMs: number;
  maxLifeMs: number;
  color: string;
  texture: ParticleTextureName;
}

const MAX_DURATION_MS = 1_500;
const CANVAS_ID = 'lexicon-fx-canvas';

let canvasEl: HTMLCanvasElement | null = null;
let ctx2d: CanvasRenderingContext2D | null = null;
let particles: ActiveParticle[] = [];
let rafId: number | null = null;
let lastFrameTs = 0;

const textureCache = new Map<ParticleTextureName, HTMLImageElement | null>();
const tintedCache = new Map<string, HTMLCanvasElement>();

function getBaseUrl(): string {
  const base = import.meta.env?.BASE_URL ?? '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function getTexture(name: ParticleTextureName): HTMLImageElement | null {
  if (textureCache.has(name)) return textureCache.get(name) ?? null;
  if (typeof Image === 'undefined') return null;
  const img = new Image();
  img.decoding = 'async';
  img.src = `${getBaseUrl()}assets/fx/${name}.png`;
  textureCache.set(name, img);
  return img;
}

function getTintedSprite(name: ParticleTextureName, color: string): HTMLCanvasElement | null {
  const img = getTexture(name);
  if (!img || !img.complete || img.naturalWidth === 0) return null;
  const key = `${name}:${color}`;
  const existing = tintedCache.get(key);
  if (existing) return existing;
  if (typeof document === 'undefined') return null;
  const off = document.createElement('canvas');
  off.width = 64;
  off.height = 64;
  const octx = off.getContext('2d');
  if (!octx) return null;
  octx.drawImage(img, 0, 0, 64, 64);
  octx.globalCompositeOperation = 'source-in';
  octx.fillStyle = color;
  octx.fillRect(0, 0, 64, 64);
  if (tintedCache.size > 48) tintedCache.clear();
  tintedCache.set(key, off);
  return off;
}

function ensureCanvas(maxDpr: number): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') return null;
  if (!canvasEl || !canvasEl.isConnected) {
    const existing = document.getElementById(CANVAS_ID) as HTMLCanvasElement | null;
    canvasEl = existing ?? document.createElement('canvas');
    canvasEl.id = CANVAS_ID;
    canvasEl.setAttribute('aria-hidden', 'true');
    canvasEl.style.position = 'fixed';
    canvasEl.style.inset = '0';
    canvasEl.style.width = '100%';
    canvasEl.style.height = '100%';
    canvasEl.style.pointerEvents = 'none';
    canvasEl.style.zIndex = 'var(--z-fx, 20)';
    if (!canvasEl.isConnected) {
      document.body.appendChild(canvasEl);
    }
    ctx2d = canvasEl.getContext('2d');
  }
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.floor(window.innerWidth * dpr));
  const h = Math.max(1, Math.floor(window.innerHeight * dpr));
  if (canvasEl.width !== w || canvasEl.height !== h) {
    canvasEl.width = w;
    canvasEl.height = h;
  }
  if (ctx2d) {
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return ctx2d;
}

function tick(ts: number): void {
  const caps = getCurrentFxCapabilities(false);
  if (!caps.allowParticles || particles.length === 0) {
    clearFxCanvas();
    return;
  }

  const dt = lastFrameTs > 0 ? Math.min(64, Math.max(1, ts - lastFrameTs)) : 16.6;
  if (lastFrameTs > 0) {
    reportFrameSample(ts - lastFrameTs, ts);
  }
  lastFrameTs = ts;

  const ctx = ensureCanvas(caps.canvasMaxDpr);
  if (!ctx || !canvasEl) {
    rafId = null;
    particles = [];
    return;
  }

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const next: ActiveParticle[] = [];
  const dtSec = dt / 1000;
  for (const p of particles) {
    p.lifeMs += dt;
    if (p.lifeMs >= p.maxLifeMs) continue;
    p.vy += p.gravity * dtSec;
    p.x += p.vx * dtSec;
    p.y += p.vy * dtSec;
    p.rotation += p.vRot * dtSec;

    const progress = p.lifeMs / p.maxLifeMs;
    const alpha = Math.max(0, 1 - progress * progress);
    const drawSize = p.size * (0.7 + 0.3 * (1 - progress));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    const sprite = getTintedSprite(p.texture, p.color);
    if (sprite) {
      ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, drawSize / 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    next.push(p);
  }

  particles = next;
  if (particles.length > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    rafId = null;
    lastFrameTs = 0;
  }
}

export function enqueueParticles(newParticles: ActiveParticle[], examMode = false): number {
  const caps = getCurrentFxCapabilities(examMode);
  if (!caps.allowParticles || caps.maxParticles <= 0) return 0;

  const budget = Math.max(0, caps.maxParticles - particles.length);
  if (budget <= 0) return 0;

  const accepted = newParticles.slice(0, budget).map((p) => ({
    ...p,
    maxLifeMs: Math.min(MAX_DURATION_MS, Math.max(120, p.maxLifeMs)),
  }));
  if (accepted.length === 0) return 0;

  ensureCanvas(caps.canvasMaxDpr);
  particles.push(...accepted);

  if (rafId === null && typeof requestAnimationFrame === 'function') {
    lastFrameTs = 0;
    rafId = requestAnimationFrame(tick);
  }
  return accepted.length;
}

export function clearFxCanvas(): void {
  particles = [];
  lastFrameTs = 0;
  if (rafId !== null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(rafId);
  }
  rafId = null;
  if (ctx2d && canvasEl) {
    ctx2d.clearRect(0, 0, canvasEl.width, canvasEl.height);
  }
}

export function destroyFxCanvasForTest(): void {
  clearFxCanvas();
  if (canvasEl && canvasEl.isConnected) {
    canvasEl.remove();
  }
  canvasEl = null;
  ctx2d = null;
  tintedCache.clear();
}

export function getActiveParticleCount(): number {
  return particles.length;
}
