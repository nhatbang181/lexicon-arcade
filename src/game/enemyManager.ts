import type { SpriteKey } from './spriteAtlas.ts';
import type { DungeonData } from './dungeonGenerator.ts';
import { isWalkable } from './dungeonGenerator.ts';
import type { VocabWord } from '../types/vocab.ts';

export interface EnemyEntity {
  id: string;
  type: SpriteKey;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  expValue: number;
  isElite: boolean;
  isBoss: boolean;
  barrierWord?: VocabWord; // Optional IELTS Barrier
  facing: 'left' | 'right';
  hitFlashTimer: number;
}

export interface ExpGem {
  id: string;
  x: number;
  y: number;
  value: number;
  type: 'blue' | 'red' | 'gold';
}

export class EnemyManager {
  public enemies: EnemyEntity[] = [];
  public gems: ExpGem[] = [];
  private spawnTimer: number = 0;
  private waveDifficulty: number = 1;
  private idCounter: number = 0;

  public update(
    dt: number,
    playerX: number,
    playerY: number,
    dungeon: DungeonData,
    vocabPool: VocabWord[]
  ) {
    this.spawnTimer += dt;
    this.waveDifficulty += dt * 0.05; // scales over time

    // Spawn waves every 1.2 seconds if under cap (max 50 enemies)
    if (this.spawnTimer >= 1.2 && this.enemies.length < 50) {
      this.spawnTimer = 0;
      this.spawnWave(playerX, playerY, dungeon, vocabPool);
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
      }

      // Chase player
      const dx = playerX - e.x;
      const dy = playerY - e.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        const vx = (dx / dist) * e.speed * dt;
        const vy = (dy / dist) * e.speed * dt;

        e.facing = dx < 0 ? 'left' : 'right';

        // Check movement (ghosts pass walls, others collide)
        if (e.type === 'GHOST') {
          e.x += vx;
          e.y += vy;
        } else {
          if (isWalkable(dungeon, e.x + vx, e.y)) {
            e.x += vx;
          }
          if (isWalkable(dungeon, e.x, e.y + vy)) {
            e.y += vy;
          }
        }
      }
    }

    // Magnet gems towards player
    const magnetRadius = 80;
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      const gdx = playerX - g.x;
      const gdy = playerY - g.y;
      const gdist = Math.hypot(gdx, gdy);

      if (gdist < magnetRadius) {
        // Fly towards player
        const spd = 280 * dt;
        g.x += (gdx / gdist) * spd;
        g.y += (gdy / gdist) * spd;
      }
    }
  }

  private spawnWave(
    playerX: number,
    playerY: number,
    dungeon: DungeonData,
    vocabPool: VocabWord[]
  ) {
    // Pick angle outside viewport
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = Math.random() * 80 + 380;
    const sx = playerX + Math.cos(spawnAngle) * spawnDist;
    const sy = playerY + Math.sin(spawnAngle) * spawnDist;

    // Pick monster type based on difficulty
    const rand = Math.random();
    let type: SpriteKey = 'SLIME';
    let hp = 25 + this.waveDifficulty * 6;
    let speed = 65;
    let damage = 8;
    let expValue = 12;
    let isElite = false;
    let isBoss = false;
    let name = "Dungeon Slime";

    if (rand < 0.35) {
      type = 'SLIME';
      name = "Slime";
      speed = 65;
      hp = 25 + this.waveDifficulty * 5;
    } else if (rand < 0.65) {
      type = 'BAT';
      name = "Vampiric Bat";
      speed = 110;
      hp = 18 + this.waveDifficulty * 4;
      damage = 10;
    } else if (rand < 0.85) {
      type = 'SKELETON';
      name = "Skeleton Warrior";
      speed = 80;
      hp = 45 + this.waveDifficulty * 8;
      damage = 14;
    } else if (rand < 0.95) {
      type = 'ORC';
      name = "Orc Marauder";
      speed = 70;
      hp = 80 + this.waveDifficulty * 12;
      damage = 18;
      expValue = 25;
    } else {
      // Elite / Barrier Monster
      type = 'GHOST';
      name = "Lexical Wraith";
      speed = 85;
      hp = 120 + this.waveDifficulty * 15;
      damage = 20;
      isElite = true;
      expValue = 40;
    }

    // Attach IELTS Word Barrier to Elite monsters
    let barrierWord: VocabWord | undefined;
    if (isElite && vocabPool.length > 0) {
      barrierWord = vocabPool[Math.floor(Math.random() * vocabPool.length)];
    }

    this.idCounter++;
    this.enemies.push({
      id: `mob_${this.idCounter}`,
      type,
      name,
      x: sx,
      y: sy,
      hp,
      maxHp: hp,
      speed,
      damage,
      radius: 12,
      expValue,
      isElite,
      isBoss,
      barrierWord,
      facing: 'left',
      hitFlashTimer: 0
    });
  }

  public killEnemy(index: number): ExpGem {
    const e = this.enemies[index];
    this.enemies.splice(index, 1);

    const gem: ExpGem = {
      id: `gem_${Date.now()}_${Math.random()}`,
      x: e.x,
      y: e.y,
      value: e.expValue,
      type: e.isElite || e.isBoss ? 'gold' : e.expValue > 20 ? 'red' : 'blue'
    };
    this.gems.push(gem);
    return gem;
  }
}
