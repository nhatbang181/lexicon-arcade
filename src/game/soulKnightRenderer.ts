import { soulKnightAssets } from './soulKnightAssets.ts';
import type { SoulKnightEngine } from './soulKnightEngine.ts';
import type { DungeonData } from './dungeonGenerator.ts';
import { TILE_PX } from './dungeonGenerator.ts';

export class SoulKnightRenderer {
  public draw(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    cameraX: number,
    cameraY: number,
    playerX: number,
    playerY: number,
    playerFacing: 'left' | 'right',
    isMoving: boolean,
    walkAnimTimer: number,
    mouseWorldX: number,
    mouseWorldY: number,
    dungeon: DungeonData,
    engine: SoulKnightEngine
  ) {
    ctx.imageSmoothingEnabled = false;

    // 1. Draw Dungeon Floor & Walls
    const startTileX = Math.max(0, Math.floor(cameraX / TILE_PX));
    const endTileX = Math.min(dungeon.width - 1, Math.ceil((cameraX + canvasW) / TILE_PX));
    const startTileY = Math.max(0, Math.floor(cameraY / TILE_PX));
    const endTileY = Math.min(dungeon.height - 1, Math.ceil((cameraY + canvasH) / TILE_PX));

    const floorImg = soulKnightAssets.get('/assets/soul_knight/tiles/floor_1.png');
    const wallMidImg = soulKnightAssets.get('/assets/soul_knight/tiles/wall_mid.png');
    const wallTopImg = soulKnightAssets.get('/assets/soul_knight/tiles/wall_top_mid.png');

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tile = dungeon.tiles[ty][tx];
        const sx = tx * TILE_PX - cameraX;
        const sy = ty * TILE_PX - cameraY;

        if (tile === 1) {
          // Floor
          if (floorImg) {
            ctx.drawImage(floorImg, sx, sy, TILE_PX, TILE_PX);
          } else {
            ctx.fillStyle = '#222738';
            ctx.fillRect(sx, sy, TILE_PX, TILE_PX);
          }
        } else if (tile === 2) {
          // Wall (top + mid for 3D depth)
          if (wallTopImg && wallMidImg) {
            ctx.drawImage(wallTopImg, sx, sy - 10, TILE_PX, 16);
            ctx.drawImage(wallMidImg, sx, sy + 6, TILE_PX, 26);
          } else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(sx, sy, TILE_PX, TILE_PX);
          }
        }
      }
    }

    // 2. Draw Chests
    const chestClosed = soulKnightAssets.get('/assets/soul_knight/items/chest_closed.png');
    const chestOpen = soulKnightAssets.get('/assets/soul_knight/items/chest_open.png');
    for (const c of dungeon.chests) {
      const sx = c.x - cameraX - 16;
      const sy = c.y - cameraY - 16;
      const img = c.opened ? chestOpen : chestClosed;
      if (img) {
        ctx.drawImage(img, sx, sy, 32, 32);
      }
    }

    // 3. Draw Coins
    const coin0 = soulKnightAssets.get('/assets/soul_knight/items/coin_0.png');
    const coin1 = soulKnightAssets.get('/assets/soul_knight/items/coin_1.png');
    for (const coin of engine.coins) {
      const sx = coin.x - cameraX - 8;
      const sy = coin.y - cameraY - 8;
      const coinImg = Math.floor(coin.anim) % 2 === 0 ? coin0 : coin1;
      if (coinImg) {
        ctx.drawImage(coinImg, sx, sy, 16, 16);
      }
    }

    // 4. Draw Slash Wave Effects
    for (const s of engine.slashes) {
      ctx.save();
      const sx = s.x - cameraX;
      const sy = s.y - cameraY;
      ctx.translate(sx, sy);
      ctx.rotate(s.angle);

      ctx.beginPath();
      ctx.arc(0, 0, s.radius, -0.6, 0.6);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 6;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw Monsters
    for (const m of engine.monsters) {
      const sx = m.x - cameraX - 16;
      const sy = m.y - cameraY - 16;
      const frameIdx = Math.floor(m.animTimer * 6) % 2;

      let monsterPath = `/assets/soul_knight/monsters/${m.type}_idle_${frameIdx}.png`;
      if (m.isBoss) {
        monsterPath = `/assets/soul_knight/monsters/boss_idle_${frameIdx}.png`;
      }

      const mImg = soulKnightAssets.get(monsterPath);
      const mSize = m.isBoss ? 56 : m.type === 'ogre' ? 44 : 32;

      if (mImg) {
        ctx.save();
        if (m.facing === 'left') {
          ctx.translate(sx + mSize, sy);
          ctx.scale(-1, 1);
          ctx.drawImage(mImg, 0, 0, mSize, mSize);
        } else {
          ctx.drawImage(mImg, sx, sy, mSize, mSize);
        }
        ctx.restore();
      }

      // Monster health bar
      const hpPct = Math.max(0, m.hp / m.maxHp);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx, sy - 8, mSize, 4);
      ctx.fillStyle = m.isBoss ? '#a855f7' : '#ef4444';
      ctx.fillRect(sx, sy - 8, mSize * hpPct, 4);

      // Elite Barrier prompt badge
      if (m.barrierWord) {
        ctx.save();
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ BARRIER', sx + mSize / 2, sy - 12);
        ctx.restore();
      }
    }

    // 6. Draw Player Bullets
    for (const b of engine.bullets) {
      const bx = b.x - cameraX;
      const by = b.y - cameraY;
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    }

    // 7. Draw Enemy Red/Purple Bullets
    for (const eb of engine.enemyBullets) {
      const ebx = eb.x - cameraX;
      const eby = eb.y - cameraY;
      ctx.save();
      ctx.beginPath();
      ctx.arc(ebx, eby, eb.radius, 0, Math.PI * 2);
      ctx.fillStyle = eb.color;
      ctx.shadowColor = eb.color;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();
    }

    // 8. Draw Player Knight & Weapon In Hand
    const heroFrame = isMoving
      ? Math.floor(walkAnimTimer * 8) % 4
      : Math.floor(walkAnimTimer * 4) % 4;
    const heroPath = isMoving
      ? `/assets/soul_knight/knight/run_${heroFrame}.png`
      : `/assets/soul_knight/knight/idle_${heroFrame}.png`;
    const heroImg = soulKnightAssets.get(heroPath);

    const px = playerX - cameraX;
    const py = playerY - cameraY;

    // A. Draw Knight Body
    ctx.save();
    if (playerFacing === 'left') {
      ctx.translate(px + 16, py - 16);
      ctx.scale(-1, 1);
      if (heroImg) ctx.drawImage(heroImg, 0, 0, 32, 32);
    } else {
      if (heroImg) ctx.drawImage(heroImg, px - 16, py - 16, 32, 32);
    }
    ctx.restore();

    // B. Draw Aimed Weapon in Hand!
    const activeWeapon = engine.getActiveWeapon();
    const weaponImg = soulKnightAssets.get(activeWeapon.spritePath);
    const aimAngle = Math.atan2(mouseWorldY - playerY, mouseWorldX - playerX);

    if (weaponImg) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(aimAngle + (engine.isSwinging ? engine.weaponSwingAngle : 0));

      // Recoil translation
      const recoilOffset = -engine.weaponRecoil;
      ctx.translate(14 + recoilOffset, 0);

      // Flip weapon if aiming left
      if (Math.abs(aimAngle) > Math.PI / 2) {
        ctx.scale(1, -1);
      }

      ctx.drawImage(weaponImg, 0, -10, 24, 20);
      ctx.restore();
    }

    // 9. Draw Atmospheric Lighting Vignette
    ctx.save();
    const grad = ctx.createRadialGradient(px, py, 90, px, py, 320);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, 'rgba(4, 7, 18, 0.45)');
    grad.addColorStop(1, 'rgba(2, 4, 10, 0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();

    // 10. Draw Soul Knight Crosshair
    const mouseScreenX = mouseWorldX - cameraX;
    const mouseScreenY = mouseWorldY - cameraY;
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouseScreenX, mouseScreenY, 8, 0, Math.PI * 2);
    ctx.moveTo(mouseScreenX - 12, mouseScreenY);
    ctx.lineTo(mouseScreenX + 12, mouseScreenY);
    ctx.moveTo(mouseScreenX, mouseScreenY - 12);
    ctx.lineTo(mouseScreenX, mouseScreenY + 12);
    ctx.stroke();
    ctx.restore();
  }
}

export const soulKnightRenderer = new SoulKnightRenderer();
