export interface SoulKnightWeapon {
  id: string;
  name: string;
  type: 'melee' | 'projectile' | 'staff' | 'bow' | 'hammer';
  spritePath: string;
  energyCost: number;
  damage: number;
  critRate: number;
  cooldown: number; // in seconds
  description: string;
}

export const SOUL_KNIGHT_WEAPONS: Record<string, SoulKnightWeapon> = {
  sword_knight: {
    id: 'sword_knight',
    name: "Knight's Broadsword",
    type: 'melee',
    spritePath: '/assets/soul_knight/weapons/sword_knight.png',
    energyCost: 0,
    damage: 35,
    critRate: 0.15,
    cooldown: 0.42,
    description: "Classic melee blade. Sweeping slash clears nearby foes and deflects enemy bullets."
  },
  sword_katana: {
    id: 'sword_katana',
    name: "Katana of Fluency",
    type: 'melee',
    spritePath: '/assets/soul_knight/weapons/sword_katana.png',
    energyCost: 0,
    damage: 48,
    critRate: 0.25,
    cooldown: 0.32,
    description: "Lightning-fast slashes with high critical strike probability."
  },
  sword_anime: {
    id: 'sword_anime',
    name: "Grand Claymore of Band 9.0",
    type: 'melee',
    spritePath: '/assets/soul_knight/weapons/sword_anime.png',
    energyCost: 2,
    damage: 75,
    critRate: 0.20,
    cooldown: 0.65,
    description: "Enormous holy sword unleashing sweeping energy shockwaves."
  },
  staff_red: {
    id: 'staff_red',
    name: "Staff of Lexical Conflagration",
    type: 'staff',
    spritePath: '/assets/soul_knight/weapons/staff_red.png',
    energyCost: 3,
    damage: 26,
    critRate: 0.12,
    cooldown: 0.48,
    description: "Channels triple homing fireballs towards the target cursor."
  },
  staff_green: {
    id: 'staff_green',
    name: "Staff of Arcane Collocations",
    type: 'staff',
    spritePath: '/assets/soul_knight/weapons/staff_green.png',
    energyCost: 2,
    damage: 34,
    critRate: 0.18,
    cooldown: 0.40,
    description: "Fires piercing emerald plasma that ricochets off dungeon walls."
  },
  bow: {
    id: 'bow',
    name: "Recurve Bow of the Scribe",
    type: 'bow',
    spritePath: '/assets/soul_knight/weapons/bow.png',
    energyCost: 2,
    damage: 55,
    critRate: 0.30,
    cooldown: 0.55,
    description: "High velocity piercing arrows capable of striking through monster ranks."
  },
  hammer: {
    id: 'hammer',
    name: "Goliath Word Hammer",
    type: 'hammer',
    spritePath: '/assets/soul_knight/weapons/hammer.png',
    energyCost: 3,
    damage: 65,
    critRate: 0.15,
    cooldown: 0.70,
    description: "Smashes the ground, emitting a 360-degree shockwave ring."
  }
};
