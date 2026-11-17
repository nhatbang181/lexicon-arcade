import type { VocabWord } from './vocab.ts';

export type HeroClass = 'Scholar' | 'Knight' | 'Rogue';

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'relic' | 'potion' | 'scroll';
  price: number;
  desc: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  statBonus?: {
    attack?: number;
    defense?: number;
    hp?: number;
    mp?: number;
    critRate?: number;
  };
  effect?: 'heal_full' | 'mana_full' | 'reveal_hint' | 'double_gold';
}

export interface PlayerStats {
  attack: number;
  defense: number;
  critRate: number; // 0.05 to 0.50
}

export interface PlayerState {
  name: string;
  heroClass: HeroClass;
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  stats: PlayerStats;
  equipped: {
    weapon: Item | null;
    armor: Item | null;
    relic: Item | null;
  };
  inventory: Item[];
  streak: number;
  maxStreak: number;
  defeatedMonsters: number;
  wordsMastered: number;
}

export interface WordSRS {
  box: number; // 1 to 5 (Leitner system)
  streak: number;
  mistakes: number;
  lastReviewed: number;
  nextReview: number;
  isNemesis: boolean;
}

export type SRSMap = Record<string, WordSRS>;

export interface Monster {
  id: string;
  name: string;
  title: string;
  realmId: string;
  avatar: string;
  hp: number;
  maxHp: number;
  attack: number;
  isBoss: boolean;
  expReward: number;
  goldReward: number;
  quote: string;
}

export type CombatActionType = 'cloze' | 'collocation' | 'synonym' | 'spell';

export interface TurnResult {
  damageDealt: number;
  isCrit: boolean;
  damageTaken: number;
  message: string;
  wordUsed: VocabWord;
  isVictory: boolean;
  isDefeat: boolean;
  expGained: number;
  goldGained: number;
}
