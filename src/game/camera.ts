export class Camera {
  public x: number = 0;
  public y: number = 0;
  public width: number = 800;
  public height: number = 600;

  constructor(viewportW: number = 800, viewportH: number = 600) {
    this.width = viewportW;
    this.height = viewportH;
  }

  public update(
    targetX: number,
    targetY: number,
    mapPixelW: number,
    mapPixelH: number,
    viewportW: number,
    viewportH: number
  ) {
    this.width = viewportW;
    this.height = viewportH;

    // Center target
    const desiredX = targetX - viewportW / 2;
    const desiredY = targetY - viewportH / 2;

    // Smooth lerp
    this.x += (desiredX - this.x) * 0.15;
    this.y += (desiredY - this.y) * 0.15;

    // Clamp inside map boundaries
    const maxX = Math.max(0, mapPixelW - viewportW);
    const maxY = Math.max(0, mapPixelH - viewportH);

    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(0, Math.min(maxY, this.y));
  }

  public worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: Math.round(wx - this.x),
      y: Math.round(wy - this.y)
    };
  }

  public isVisible(wx: number, wy: number, size: number = 32): boolean {
    const screenX = wx - this.x;
    const screenY = wy - this.y;
    return (
      screenX + size >= -50 &&
      screenX <= this.width + 50 &&
      screenY + size >= -50 &&
      screenY <= this.height + 50
    );
  }
}
