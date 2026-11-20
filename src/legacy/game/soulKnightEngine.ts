import { soulKnightAssets } from './soulKnightAssets.ts';
import { SOUL_KNIGHT_WEAPONS, SoulKnightWeapon } from './soulKnightWeapons.ts';
import { soundEngine } from '../audio/soundEngine.ts';
import type { VocabWord } from '../types/vocab.ts';

export interface PlayerBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  radius: number;
  life: number;
  isBouncing?: boolean;
}

export interface EnemyBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  life: number;
}

export interface SoulKnightMonster {
  id: string;
  name: string;
  type: 'skeleton' | 'goblin' | 'ogre' | 'boss';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  facing: 'left' | 'right';
  animTimer: number;
  attackCooldown: number;
  shootTimer: number;
  radius: number;
  barrierWord?: VocabWord;
  isBoss: boolean;
}

export interface SlashEffect {
  x: number;
  y: number;
  angle: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
}

export class SoulKnightEngine {
  public bullets: PlayerBullet[] = [];
  public enemyBullets: EnemyBullet[] = [];
  public slashes: SlashEffect[] = [];
  public monsters: SoulKnightMonster[] = [];
  public coins: { x: number; y: number; value: number; anim: number }[] = [];

  // Player Soul Knight Stats
  public hp: number = 6;
  public maxHp: number = 6;
  public shield: number = 5;
  public maxShield: number = 5;
  public energy: number = 200;
  public maxEnergy: number = 200;
  public coinsEarned: number = 0;
  public kills: number = 0;

  // Shield Regen Timer (regens after 4s without damage)
  private shieldRegenTimer: number = 0;

  // Weapon Inventory (Primary & Secondary)
  public primaryWeapon: SoulKnightWeapon = SOUL_KNIGHT_WEAPONS.sword_knight;
  public secondaryWeapon: SoulKnightWeapon = SOUL_KNIGHT_WEAPONS.staff_red;
  public activeWeaponSlot: 1 | 2 = 1;

  public attackTimer: number = 0;
  public weaponRecoil: number = 0; // weapon kickback offset
  public weaponSwingAngle: number = 0; // for melee sword swing
  public isSwinging: boolean = false;

  public getActiveWeapon(): SoulKnightWeapon {
    return this.activeWeaponSlot === 1 ? this.primaryWeapon : this.secondaryWeapon;
  }

  public swapWeapon() {
    this.activeWeaponSlot = this.activeWeaponSlot === 1 ? 2 : 1;
    soundEngine.playCoinSound();
  }

  public update(
    dt: number,
    playerX: number,
    playerY: number,
    isFiring: boolean,
    mouseWorldX: number,
    mouseWorldY: number,
    onEnemyKilled: (m: SoulKnightMonster) => void,
    onPlayerHit: () => void
  ) {
    const weapon = this.getActiveWeapon();

    // Shield Regen Logic
    if (this.shield < this.maxShield) {
      this.shieldRegenTimer += dt;
      if (this.shieldRegenTimer >= 3.5) {
        this.shield = Math.min(this.maxShield, this.shield + 1);
        this.shieldRegenTimer = 2.8; // ticks every 0.7s once regen starts
      }
    }

    // Weapon Cooldown & Recoil Recovery
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
    }
    if (this.weaponRecoil > 0) {
      this.weaponRecoil = Math.max(0, this.weaponRecoil - dt * 25);
    }
    if (this.isSwinging) {
      this.weaponSwingAngle += dt * 18;
      if (this.weaponSwingAngle >= Math.PI * 0.8) {
        this.isSwinging = false;
        this.weaponSwingAngle = 0;
      }
    }

    // Player Attack Execution
    if (isFiring && this.attackTimer <= 0) {
      if (this.energy >= weapon.energyCost) {
        this.executeAttack(playerX, playerY, mouseWorldX, mouseWorldY, weapon);
        this.energy -= weapon.energyCost;
        this.attackTimer = weapon.cooldown;
      }
    }

    // Update Player Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Check hits on monsters
      for (let mIdx = this.monsters.length - 1; mIdx >= 0; mIdx--) {
        const m = this.monsters[mIdx];
        const dist = Math.hypot(m.x - b.x, m.y - b.y);
        if (dist < m.radius + b.radius) {
          m.hp -= b.damage;
          b.life = 0; // destroy bullet

          if (m.hp <= 0) {
            this.killMonster(mIdx, onEnemyKilled);
          }
          break;
        }
      }

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
      }
    }

    // Update Enemy Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.x += eb.vx * dt;
      eb.y += eb.vy * dt;
      eb.life -= dt;

      // Check hit on player
      const dist = Math.hypot(playerX - eb.x, playerY - eb.y);
      if (dist < eb.radius + 12) {
        this.takeDamage(eb.damage);
        onPlayerHit();
        eb.life = 0;
      }

      // Check if player's sword slash deflects enemy bullet!
      if (this.isSwinging && weapon.type === 'melee') {
        const slashDist = Math.hypot(playerX - eb.x, playerY - eb.y);
        if (slashDist < 45) {
          // Deflect bullet towards cursor!
          eb.life = 0;
          this.bullets.push({
            x: eb.x,
            y: eb.y,
            vx: -eb.vx * 1.5,
            vy: -eb.vy * 1.5,
            damage: 30,
            color: '#38bdf8',
            radius: 6,
            life: 1.5
          });
          soundEngine.playCritSound();
        }
      }

      if (eb.life <= 0) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // Update Slash Effects
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      this.slashes[i].life -= dt;
      if (this.slashes[i].life <= 0) {
        this.slashes.splice(i, 1);
      }
    }

    // Update Monsters (AI & Shooting)
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      m.animTimer += dt;
      m.shootTimer += dt;

      const dx = playerX - m.x;
      const dy = playerY - m.y;
      const dist = Math.hypot(dx, dy);

      m.facing = dx < 0 ? 'left' : 'right';

      // Move towards player if not too close
      if (dist > (m.type === 'skeleton' ? 140 : 25)) {
        m.x += (dx / dist) * m.speed * dt;
        m.y += (dy / dist) * m.speed * dt;
      }

      // Skeleton & Boss ranged bullet attacks
      if (m.type === 'skeleton' && m.shootTimer >= 2.0 && dist < 320) {
        m.shootTimer = 0;
        const angle = Math.atan2(dy, dx);
        this.enemyBullets.push({
          x: m.x,
          y: m.y,
          vx: Math.cos(angle) * 190,
          vy: Math.sin(angle) * 190,
          damage: 1,
          radius: 5,
          color: '#ef4444',
          life: 2.2
        });
      } else if (m.isBoss && m.shootTimer >= 1.6) {
        m.shootTimer = 0;
        // Boss 3-way spread attack
        const baseAngle = Math.atan2(dy, dx);
        [-0.3, 0, 0.3].forEach(offset => {
          this.enemyBullets.push({
            x: m.x,
            y: m.y,
            vx: Math.cos(baseAngle + offset) * 220,
            vy: Math.sin(baseAngle + offset) * 220,
            damage: 2,
            radius: 7,
            color: '#a855f7',
            life: 2.5
          });
        });
        soundEngine.playMagicSound();
      }

      // Melee contact damage
      if (dist < m.radius + 12) {
        if (m.attackCooldown <= 0) {
          this.takeDamage(m.isBoss ? 2 : 1);
          onPlayerHit();
          m.attackCooldown = 1.0;
        }
      }
      if (m.attackCooldown > 0) {
        m.attackCooldown -= dt;
      }
    }

    // Magnet Coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.anim += dt * 6;
      const cdx = playerX - c.x;
      const cdy = playerY - c.y;
      const cdist = Math.hypot(cdx, cdy);

      if (cdist < 65) {
        c.x += (cdx / cdist) * 260 * dt;
        c.y += (cdy / cdist) * 260 * dt;
        if (cdist < 16) {
          this.coinsEarned += c.value;
          this.energy = Math.min(this.maxEnergy, this.energy + 5); // coins restore energy
          this.coins.splice(i, 1);
          soundEngine.playCoinSound();
        }
      }
    }
  }

  private executeAttack(
    px: number,
    py: number,
    targetX: number,
    targetY: number,
    weapon: SoulKnightWeapon
  ) {
    const angle = Math.atan2(targetY - py, targetX - px);
    this.weaponRecoil = 8;

    if (weapon.type === 'melee' || weapon.type === 'hammer') {
      this.isSwinging = true;
      this.weaponSwingAngle = -Math.PI * 0.4;
      soundEngine.playAttackSound();

      // Spawn slash wave
      this.slashes.push({
        x: px + Math.cos(angle) * 22,
        y: py + Math.sin(angle) * 22,
        angle,
        radius: weapon.id === 'sword_anime' ? 52 : 36,
        life: 0.16,
        maxLife: 0.16,
        color: weapon.id === 'sword_anime' ? '#fbbf24' : '#38bdf8'
      });

      // Hit monsters in cone
      const range = weapon.id === 'sword_anime' ? 65 : 48;
      for (let mIdx = this.monsters.length - 1; mIdx >= 0; mIdx--) {
        const m = this.monsters[mIdx];
        const dist = Math.hypot(m.x - px, m.y - py);
        if (dist < range) {
          m.hp -= weapon.damage;
          if (m.hp <= 0) {
            this.killMonster(mIdx, () => {});
          }
        }
      }
    } else if (weapon.type === 'staff') {
      soundEngine.playMagicSound();
      // Triple homing or spread fireballs
      [-0.18, 0, 0.18].forEach(offset => {
        const a = angle + offset;
        this.bullets.push({
          x: px + Math.cos(a) * 18,
          y: py + Math.sin(a) * 18,
          vx: Math.cos(a) * 360,
          vy: Math.sin(a) * 360,
          damage: weapon.damage,
          color: weapon.id === 'staff_red' ? '#ef4444' : '#22c55e',
          radius: 6,
          life: 1.6
        });
      });
    } else if (weapon.type === 'bow') {
      soundEngine.playAttackSound();
      // High speed piercing arrow
      this.bullets.push({
        x: px + Math.cos(angle) * 18,
        y: py + Math.sin(angle) * 18,
        vx: Math.cos(angle) * 480,
        vy: Math.sin(angle) * 480,
        damage: weapon.damage,
        color: '#facc15',
        radius: 5,
        life: 1.8
      });
    }
  }

  public takeDamage(dmg: number) {
    this.shieldRegenTimer = 0; // reset shield regen countdown
    soundEngine.playHurtSound();

    if (this.shield >= dmg) {
      this.shield -= dmg;
    } else {
      const leftover = dmg - this.shield;
      this.shield = 0;
      this.hp = Math.max(0, this.hp - leftover);
    }
  }

  private killMonster(index: number, onEnemyKilled: (m: SoulKnightMonster) => void) {
    const m = this.monsters[index];
    this.monsters.splice(index, 1);
    this.kills += 1;

    // Drop coins
    const coinCount = m.isBoss ? 8 : m.type === 'ogre' ? 4 : 2;
    for (let c = 0; c < coinCount; c++) {
      this.coins.push({
        x: m.x + (Math.random() - 0.5) * 20,
        y: m.y + (Math.random() - 0.5) * 20,
        value: 5,
        anim: Math.random() * 4
      });
    }

    onEnemyKilled(m);
  }
}
