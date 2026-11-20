import { SPRITES, SpriteKey } from './spriteAtlas.ts';

export class CanvasRenderer {
  private sheet: HTMLImageElement | null = null;
  private loaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const img = new Image();
      img.src = '/roguelike_sheet.png';
      img.onload = () => {
        this.loaded = true;
      };
      this.sheet = img;
    }
  }

  public isLoaded(): boolean {
    return this.loaded;
  }

  // Draw sprite from atlas
  public drawSprite(
    ctx: CanvasRenderingContext2D,
    key: SpriteKey,
    screenX: number,
    screenY: number,
    size: number = 32,
    flipX: boolean = false
  ) {
    if (!this.sheet || !this.loaded) {
      // Fallback colored box
      ctx.fillStyle = '#64748b';
      ctx.fillRect(screenX, screenY, size, size);
      return;
    }

    const def = SPRITES[key];
    if (!def) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (flipX) {
      ctx.translate(screenX + size, screenY);
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.sheet,
        def.x,
        def.y,
        def.w,
        def.h,
        0,
        0,
        size,
        size
      );
    } else {
      ctx.drawImage(
        this.sheet,
        def.x,
        def.y,
        def.w,
        def.h,
        screenX,
        screenY,
        size,
        size
      );
    }

    ctx.restore();
  }

  // Draw floating text (Damage, Crit, Heal)
  public drawFloatingText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string = '#f87171',
    isCrit: boolean = false,
    alpha: number = 1.0
  ) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.font = isCrit ? 'bold 20px "JetBrains Mono", monospace' : 'bold 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    
    // Text outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(text, x, y);

    // Text fill
    ctx.fillStyle = isCrit ? '#fbbf24' : color;
    ctx.fillText(text, x, y);

    ctx.restore();
  }

  // Draw Health Bar
  public drawHealthBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    current: number,
    max: number,
    isHero: boolean = false
  ) {
    ctx.save();
    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, w, h);

    // Foreground
    const pct = Math.max(0, Math.min(1, current / max));
    ctx.fillStyle = isHero ? (pct > 0.3 ? '#22c55e' : '#ef4444') : '#ef4444';
    ctx.fillRect(x, y, w * pct, h);

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.restore();
  }

  // Draw Torch Light Vignette around player
  public drawLighting(
    ctx: CanvasRenderingContext2D,
    playerScreenX: number,
    playerScreenY: number,
    viewportW: number,
    viewportH: number,
    radius: number = 220
  ) {
    ctx.save();
    const grad = ctx.createRadialGradient(
      playerScreenX,
      playerScreenY,
      radius * 0.4,
      playerScreenX,
      playerScreenY,
      radius
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, 'rgba(5, 8, 18, 0.4)');
    grad.addColorStop(1, 'rgba(2, 4, 10, 0.88)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewportW, viewportH);
    ctx.restore();
  }
}

export const canvasRenderer = new CanvasRenderer();
