import type { DungeonData } from './dungeonGenerator.ts';
import { isWalkable, TILE_PX } from './dungeonGenerator.ts';

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export class PlayerEntity {
  public x: number;
  public y: number;
  public radius: number = 10;
  public speed: number = 175; // pixels per second
  public facing: 'left' | 'right' = 'right';
  public isMoving: boolean = false;
  public walkAnimTimer: number = 0;

  // Stats
  public hp: number = 100;
  public maxHp: number = 100;
  public level: number = 1;
  public exp: number = 0;
  public maxExp: number = 50;
  public kills: number = 0;
  public gold: number = 0;
  public invulnerableTimer: number = 0;

  constructor(spawnX: number, spawnY: number) {
    this.x = spawnX;
    this.y = spawnY;
  }

  public update(dt: number, input: PlayerInput, dungeon: DungeonData) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    let dx = 0;
    let dy = 0;

    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    this.isMoving = dx !== 0 || dy !== 0;

    if (this.isMoving) {
      this.walkAnimTimer += dt * 8;
      if (dx < 0) this.facing = 'left';
      if (dx > 0) this.facing = 'right';

      // Normalize diagonal
      const len = Math.hypot(dx, dy);
      const moveX = (dx / len) * this.speed * dt;
      const moveY = (dy / len) * this.speed * dt;

      // Smooth collision sliding: try X and Y separately
      const newX = this.x + moveX;
      if (this.canMoveTo(newX, this.y, dungeon)) {
        this.x = newX;
      }

      const newY = this.y + moveY;
      if (this.canMoveTo(this.x, newY, dungeon)) {
        this.y = newY;
      }
    } else {
      this.walkAnimTimer = 0;
    }
  }

  private canMoveTo(px: number, py: number, dungeon: DungeonData): boolean {
    const r = this.radius;
    // Check 4 bounding corners
    return (
      isWalkable(dungeon, px - r, py - r) &&
      isWalkable(dungeon, px + r, py - r) &&
      isWalkable(dungeon, px - r, py + r) &&
      isWalkable(dungeon, px + r, py + r)
    );
  }

  public takeDamage(dmg: number): boolean {
    if (this.invulnerableTimer > 0) return false;
    this.hp = Math.max(0, this.hp - dmg);
    this.invulnerableTimer = 0.5; // 0.5s i-frames
    return true;
  }

  public heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  public addExp(amount: number): boolean {
    this.exp += amount;
    if (this.exp >= this.maxExp) {
      this.exp -= this.maxExp;
      this.level += 1;
      this.maxExp = Math.round(this.maxExp * 1.35);
      this.maxHp += 15;
      this.hp = this.maxHp;
      return true; // leveled up
    }
    return false;
  }
}
