import type { EnemyEntity } from './enemyManager.ts';
import { soundEngine } from '../audio/soundEngine.ts';

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  pierce: number;
  life: number;
}

export interface WeaponState {
  orbCount: number;
  orbDamage: number;
  daggerCooldown: number;
  daggerDamage: number;
  lightningCooldown: number;
  lightningDamage: number;
  auraRadius: number;
  auraDamage: number;
}

export class WeaponManager {
  public state: WeaponState = {
    orbCount: 2,
    orbDamage: 18,
    daggerCooldown: 0.7,
    daggerDamage: 32,
    lightningCooldown: 2.2,
    lightningDamage: 55,
    auraRadius: 65,
    auraDamage: 15
  };

  public orbAngle: number = 0;
  public projectiles: Projectile[] = [];
  public lightningBolts: { x1: number; y1: number; x2: number; y2: number; life: number }[] = [];
  
  private daggerTimer: number = 0;
  private lightningTimer: number = 0;
  private auraTimer: number = 0;

  public update(
    dt: number,
    playerX: number,
    playerY: number,
    enemies: EnemyEntity[],
    onDamageEnemy: (enemyIdx: number, damage: number, isCrit: boolean) => void
  ) {
    // 1. Rotate Orbiting Orbs
    this.orbAngle += dt * 3.5;
    const orbDist = 58;

    for (let i = 0; i < this.state.orbCount; i++) {
      const angle = this.orbAngle + (i * Math.PI * 2) / this.state.orbCount;
      const ox = playerX + Math.cos(angle) * orbDist;
      const oy = playerY + Math.sin(angle) * orbDist;

      // Check collision with enemies
      for (let eIdx = 0; eIdx < enemies.length; eIdx++) {
        const e = enemies[eIdx];
        const dist = Math.hypot(e.x - ox, e.y - oy);
        if (dist < e.radius + 12) {
          onDamageEnemy(eIdx, this.state.orbDamage * dt * 4, false);
        }
      }
    }

    // 2. Quill Projectiles
    this.daggerTimer += dt;
    if (this.daggerTimer >= this.state.daggerCooldown && enemies.length > 0) {
      this.daggerTimer = 0;
      this.fireDagger(playerX, playerY, enemies);
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Check enemy hit
      let hit = false;
      for (let eIdx = 0; eIdx < enemies.length; eIdx++) {
        const e = enemies[eIdx];
        if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + 8) {
          onDamageEnemy(eIdx, p.damage, true);
          p.pierce -= 1;
          hit = true;
          if (p.pierce <= 0) break;
        }
      }

      if (hit && p.pierce <= 0 || p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 3. Chain Lightning
    this.lightningTimer += dt;
    if (this.lightningTimer >= this.state.lightningCooldown && enemies.length > 0) {
      this.lightningTimer = 0;
      this.triggerLightning(playerX, playerY, enemies, onDamageEnemy);
    }

    // Fade lightning bolts
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      this.lightningBolts[i].life -= dt;
      if (this.lightningBolts[i].life <= 0) {
        this.lightningBolts.splice(i, 1);
      }
    }
  }

  private fireDagger(playerX: number, playerY: number, enemies: EnemyEntity[]) {
    // Find closest enemy
    let closest: EnemyEntity | null = null;
    let closestDist = Infinity;

    for (const e of enemies) {
      const d = Math.hypot(e.x - playerX, e.y - playerY);
      if (d < closestDist) {
        closestDist = d;
        closest = e;
      }
    }

    if (!closest) return;

    const angle = Math.atan2(closest.y - playerY, closest.x - playerX);
    const speed = 400;

    this.projectiles.push({
      x: playerX,
      y: playerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: this.state.daggerDamage,
      pierce: 2,
      life: 1.5
    });

    soundEngine.playAttackSound();
  }

  private triggerLightning(
    playerX: number,
    playerY: number,
    enemies: EnemyEntity[],
    onDamageEnemy: (enemyIdx: number, damage: number, isCrit: boolean) => void
  ) {
    const targets = [...enemies].sort(() => Math.random() - 0.5).slice(0, 3);
    for (const t of targets) {
      const idx = enemies.indexOf(t);
      if (idx !== -1) {
        onDamageEnemy(idx, this.state.lightningDamage, true);
        this.lightningBolts.push({
          x1: playerX,
          y1: playerY,
          x2: t.x,
          y2: t.y,
          life: 0.18
        });
      }
    }
    soundEngine.playCritSound();
  }

  // Draw weapons, orbs, and bolts
  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    playerX: number,
    playerY: number
  ) {
    ctx.save();

    // 1. Draw Orbiting Orbs
    const orbDist = 58;
    for (let i = 0; i < this.state.orbCount; i++) {
      const angle = this.orbAngle + (i * Math.PI * 2) / this.state.orbCount;
      const ox = playerX + Math.cos(angle) * orbDist - cameraX;
      const oy = playerY + Math.sin(angle) * orbDist - cameraY;

      // Glow circle
      ctx.beginPath();
      ctx.arc(ox, oy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
      ctx.fill();
    }

    // 2. Draw Projectiles
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fbbf24';
    ctx.fillStyle = '#fef08a';
    for (const p of this.projectiles) {
      const px = p.x - cameraX;
      const py = p.y - cameraY;
      ctx.fillRect(px - 3, py - 3, 6, 6);
    }

    // 3. Draw Lightning Bolts
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#e9d5ff';
    ctx.lineWidth = 3;
    for (const b of this.lightningBolts) {
      ctx.beginPath();
      ctx.moveTo(b.x1 - cameraX, b.y1 - cameraY);
      // Zigzag
      const midX = (b.x1 + b.x2) / 2 + (Math.random() - 0.5) * 30;
      const midY = (b.y1 + b.y2) / 2 + (Math.random() - 0.5) * 30;
      ctx.lineTo(midX - cameraX, midY - cameraY);
      ctx.lineTo(b.x2 - cameraX, b.y2 - cameraY);
      ctx.stroke();
    }

    ctx.restore();
  }
}
