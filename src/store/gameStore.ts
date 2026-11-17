import type { PlayerState, Item, SRSMap, HeroClass } from '../types/game.ts';
import { soundEngine } from '../audio/soundEngine.ts';

const STORAGE_KEY_PLAYER = 'lexicon_quest_player_v1';
const STORAGE_KEY_SRS = 'lexicon_quest_srs_v1';

export const INITIAL_PLAYER: PlayerState = {
  name: 'Erudite Hero',
  heroClass: 'Scholar',
  level: 1,
  exp: 0,
  maxExp: 100,
  hp: 120,
  maxHp: 120,
  mp: 60,
  maxMp: 60,
  gold: 60,
  stats: {
    attack: 20,
    defense: 6,
    critRate: 0.08
  },
  equipped: {
    weapon: null,
    armor: null,
    relic: null
  },
  inventory: [
    {
      id: 'pot_heal_init',
      name: "Elixir of Vitality",
      type: 'potion',
      price: 30,
      desc: "Restores 80 HP.",
      icon: 'Heart',
      rarity: 'common',
      effect: 'heal_full'
    }
  ],
  streak: 0,
  maxStreak: 0,
  defeatedMonsters: 0,
  wordsMastered: 0
};

export class GameStore {
  private player: PlayerState;
  private srs: SRSMap;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.player = this.loadPlayer();
    this.srs = this.loadSRS();
  }

  private loadPlayer(): PlayerState {
    if (typeof window === 'undefined') return { ...INITIAL_PLAYER };
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYER);
      if (saved) {
        return { ...INITIAL_PLAYER, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return { ...INITIAL_PLAYER };
  }

  private loadSRS(): SRSMap {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SRS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {};
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(this.player));
      localStorage.setItem(STORAGE_KEY_SRS, JSON.stringify(this.srs));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public getPlayer(): PlayerState {
    return { ...this.player };
  }

  public getSRS(): SRSMap {
    return { ...this.srs };
  }

  public resetProgress() {
    this.player = { ...INITIAL_PLAYER };
    this.srs = {};
    this.save();
  }

  // Computed total stats including equipment
  public getTotalStats() {
    const base = { ...this.player.stats };
    let totalMaxHp = this.player.maxHp;
    let totalMaxMp = this.player.maxMp;

    const items = [this.player.equipped.weapon, this.player.equipped.armor, this.player.equipped.relic].filter(Boolean) as Item[];
    for (const it of items) {
      if (it.statBonus) {
        if (it.statBonus.attack) base.attack += it.statBonus.attack;
        if (it.statBonus.defense) base.defense += it.statBonus.defense;
        if (it.statBonus.critRate) base.critRate += it.statBonus.critRate;
        if (it.statBonus.hp) totalMaxHp += it.statBonus.hp;
        if (it.statBonus.mp) totalMaxMp += it.statBonus.mp;
      }
    }

    return {
      attack: base.attack,
      defense: base.defense,
      critRate: Math.min(0.75, base.critRate),
      maxHp: totalMaxHp,
      maxMp: totalMaxMp
    };
  }

  public gainExp(amount: number): boolean {
    // Relic bonus: +25% EXP if amulet equipped
    let finalExp = amount;
    if (this.player.equipped.relic?.id === 'rel_retention') {
      finalExp = Math.round(amount * 1.25);
    }

    this.player.exp += finalExp;
    let leveledUp = false;

    while (this.player.exp >= this.player.maxExp) {
      this.player.exp -= this.player.maxExp;
      this.player.level += 1;
      this.player.maxExp = Math.round(this.player.maxExp * 1.3);
      this.player.maxHp += 15;
      this.player.hp = this.player.maxHp; // full heal on level up
      this.player.maxMp += 8;
      this.player.mp = this.player.maxMp;
      this.player.stats.attack += 4;
      this.player.stats.defense += 2;
      leveledUp = true;
    }

    if (leveledUp) {
      soundEngine.playLevelUpSound();
    }
    this.save();
    return leveledUp;
  }

  public gainGold(amount: number) {
    let finalGold = amount;
    if (this.player.equipped.relic?.id === 'rel_thesaurus') {
      finalGold = Math.round(amount * 1.4);
    }
    this.player.gold += finalGold;
    soundEngine.playCoinSound();
    this.save();
  }

  public heal(amount: number) {
    const totalMaxHp = this.getTotalStats().maxHp;
    this.player.hp = Math.min(totalMaxHp, this.player.hp + amount);
    soundEngine.playPotionSound();
    this.save();
  }

  public restoreMp(amount: number) {
    const totalMaxMp = this.getTotalStats().maxMp;
    this.player.mp = Math.min(totalMaxMp, this.player.mp + amount);
    this.save();
  }

  public spendMp(amount: number): boolean {
    if (this.player.mp < amount) return false;
    this.player.mp -= amount;
    this.save();
    return true;
  }

  public takeDamage(rawDamage: number): number {
    const stats = this.getTotalStats();
    const reduced = Math.max(1, Math.round(rawDamage * (100 / (100 + stats.defense * 2))));
    this.player.hp = Math.max(0, this.player.hp - reduced);
    soundEngine.playHurtSound();
    this.save();
    return reduced;
  }

  public recordMonsterDefeated() {
    this.player.defeatedMonsters += 1;
    this.save();
  }

  // Record active recall answer in Spaced Repetition System
  public recordWordResult(wordId: string, isCorrect: boolean) {
    const now = Date.now();
    const existing = this.srs[wordId] || {
      box: 1,
      streak: 0,
      mistakes: 0,
      lastReviewed: 0,
      nextReview: 0,
      isNemesis: false
    };

    if (isCorrect) {
      existing.streak += 1;
      this.player.streak += 1;
      if (this.player.streak > this.player.maxStreak) {
        this.player.maxStreak = this.player.streak;
      }
      // Leitner promotion
      existing.box = Math.min(5, existing.box + 1);
      // Box 1: 1 day, Box 2: 3 days, Box 3: 7 days, Box 4: 14 days, Box 5: 30 days
      const intervals = [0, 1, 3, 7, 14, 30];
      existing.nextReview = now + intervals[existing.box] * 24 * 3600 * 1000;
      if (existing.streak >= 2) {
        existing.isNemesis = false;
      }
      if (existing.box >= 4) {
        this.player.wordsMastered += 1;
      }
    } else {
      this.player.streak = 0;
      existing.streak = 0;
      existing.mistakes += 1;
      existing.box = 1; // reset to box 1 on mistake
      existing.nextReview = now + 15 * 60 * 1000; // review in 15 mins
      existing.isNemesis = true;
      soundEngine.playBuzzerSound();
    }

    existing.lastReviewed = now;
    this.srs[wordId] = existing;
    this.save();
  }

  // Shop & Inventory
  public buyItem(item: Item): boolean {
    if (this.player.gold < item.price) return false;
    this.player.gold -= item.price;
    this.player.inventory.push({ ...item, id: `${item.id}_${Date.now()}` });
    soundEngine.playCoinSound();
    this.save();
    return true;
  }

  public equipItem(item: Item) {
    if (item.type === 'weapon') {
      this.player.equipped.weapon = item;
    } else if (item.type === 'armor') {
      this.player.equipped.armor = item;
    } else if (item.type === 'relic') {
      this.player.equipped.relic = item;
    }
    this.save();
  }

  public useItem(itemIndex: number): boolean {
    const item = this.player.inventory[itemIndex];
    if (!item) return false;

    if (item.type === 'potion') {
      if (item.effect === 'heal_full' || item.id.includes('pot_heal')) {
        this.heal(80);
      } else if (item.effect === 'mana_full' || item.id.includes('pot_mana')) {
        this.restoreMp(40);
      }
      this.player.inventory.splice(itemIndex, 1);
      this.save();
      return true;
    }
    return false;
  }
}

export const gameStore = new GameStore();
