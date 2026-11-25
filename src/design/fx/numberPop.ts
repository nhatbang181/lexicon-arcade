import { getCurrentFxCapabilities } from './fxTier';

export interface NumberPopOptions {
  x: number;
  y: number;
  to?: { x: number; y: number };
  colorVar?: string;
  durationMs?: number;
  examMode?: boolean;
}

const LAYER_ID = 'lexicon-fx-pop-layer';

function ensurePopLayer(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  let layer = document.getElementById(LAYER_ID);
  if (!layer) {
    layer = document.createElement('div');
    layer.id = LAYER_ID;
    layer.setAttribute('aria-hidden', 'true');
    layer.style.position = 'fixed';
    layer.style.inset = '0';
    layer.style.pointerEvents = 'none';
    layer.style.overflow = 'hidden';
    layer.style.zIndex = 'var(--z-fx, 20)';
    document.body.appendChild(layer);
  }
  return layer;
}

/**
 * Số bay "+10 XP" / "+1" bằng DOM + transform/opacity (không chạm layout, sắc nét ở màn Retina).
 * Tắt ở chế độ reduced-motion, bậc Thấp và Exam.
 */
export function numberPop(text: string, options: NumberPopOptions): boolean {
  const caps = getCurrentFxCapabilities(options.examMode);
  if (!caps.allowE1Slide) return false;
  const layer = ensurePopLayer();
  if (!layer) return false;

  const el = document.createElement('span');
  el.textContent = text;
  el.style.position = 'fixed';
  el.style.left = '0';
  el.style.top = '0';
  el.style.fontFamily = 'var(--font-display)';
  el.style.fontWeight = '700';
  el.style.fontSize = '16px';
  el.style.lineHeight = '1';
  el.style.color = options.colorVar ?? 'var(--color-correct)';
  el.style.pointerEvents = 'none';
  el.style.userSelect = 'none';
  el.style.transform = `translate3d(${options.x}px, ${options.y}px, 0)`;

  layer.appendChild(el);

  const dx = options.to ? options.to.x - options.x : 0;
  const dy = options.to ? options.to.y - options.y : -34;
  const duration = Math.min(900, Math.max(240, options.durationMs ?? 560));

  if (typeof el.animate === 'function') {
    const anim = el.animate(
      [
        { transform: `translate3d(${options.x}px, ${options.y}px, 0) scale(0.92)`, opacity: 0 },
        {
          transform: `translate3d(${options.x + dx * 0.25}px, ${options.y + dy * 0.3}px, 0) scale(1.05)`,
          opacity: 1,
          offset: 0.2,
        },
        {
          transform: `translate3d(${options.x + dx}px, ${options.y + dy}px, 0) scale(1)`,
          opacity: 0,
        },
      ],
      { duration, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' },
    );
    anim.onfinish = () => el.remove();
  } else {
    setTimeout(() => el.remove(), duration);
  }
  return true;
}
