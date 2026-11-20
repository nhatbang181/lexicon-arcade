import { Item } from '../types/game';

export const SHOP_ITEMS: Item[] = [
  // Weapons
  {
    id: 'wpn_quill',
    name: "Quill of the Scribe",
    type: 'weapon',
    price: 50,
    desc: "A finely sharpened feather quill. Adds accuracy and punch to every written answer.",
    icon: 'Feather',
    rarity: 'common',
    statBonus: { attack: 8 }
  },
  {
    id: 'wpn_blade',
    name: "Lexicon Dagger",
    type: 'weapon',
    price: 150,
    desc: "Forged with etymological silver. Slices through complex distractors with ease.",
    icon: 'Sword',
    rarity: 'rare',
    statBonus: { attack: 18, critRate: 0.05 }
  },
  {
    id: 'wpn_greatsword',
    name: "Academic Claymore",
    type: 'weapon',
    price: 350,
    desc: "A weighty blade inscribed with Academic Word List runes. Crushes monstrous jargon.",
    icon: 'Shield',
    rarity: 'rare',
    statBonus: { attack: 35, critRate: 0.08 }
  },
  {
    id: 'wpn_staff',
    name: "Staff of the Polyglot",
    type: 'weapon',
    price: 750,
    desc: "Harnesses universal syntax to channel devastating linguistic magic.",
    icon: 'Wand2',
    rarity: 'epic',
    statBonus: { attack: 65, critRate: 0.12, mp: 30 }
  },
  {
    id: 'wpn_excalibur',
    name: "Excalibur of Band 9.0",
    type: 'weapon',
    price: 1500,
    desc: "The legendary holy blade of linguistic perfection. Smite any lexical mistake instantly.",
    icon: 'Sparkles',
    rarity: 'legendary',
    statBonus: { attack: 110, critRate: 0.20, hp: 100 }
  },

  // Armor
  {
    id: 'arm_tunic',
    name: "Scholar's Linen Tunic",
    type: 'armor',
    price: 40,
    desc: "Lightweight garments comfortable for long hours in the library.",
    icon: 'Shirt',
    rarity: 'common',
    statBonus: { defense: 4, hp: 20 }
  },
  {
    id: 'arm_chainmail',
    name: "Chainmail of Resilience",
    type: 'armor',
    price: 140,
    desc: "Interlinked steel rings that cushion the mental blow of difficult questions.",
    icon: 'Shield',
    rarity: 'rare',
    statBonus: { defense: 14, hp: 50 }
  },
  {
    id: 'arm_plate',
    name: "Grammarian's Plate",
    type: 'armor',
    price: 320,
    desc: "Solid breastplate proofed against grammatical slips and pronunciation traps.",
    icon: 'ShieldCheck',
    rarity: 'rare',
    statBonus: { defense: 28, hp: 120 }
  },
  {
    id: 'arm_robes',
    name: "Celestial Robes of Band 9.0",
    type: 'armor',
    price: 1200,
    desc: "Woven from starlight and erudition. Greatly minimizes all incoming mistake damage.",
    icon: 'Crown',
    rarity: 'legendary',
    statBonus: { defense: 60, hp: 280, mp: 50 }
  },

  // Relics
  {
    id: 'rel_retention',
    name: "Amulet of Retention",
    type: 'relic',
    price: 200,
    desc: "An ancient talisman that accelerates memory consolidation (+25% EXP from all battles).",
    icon: 'Gem',
    rarity: 'rare',
    statBonus: { mp: 20 }
  },
  {
    id: 'rel_thesaurus',
    name: "Midas Thesaurus",
    type: 'relic',
    price: 300,
    desc: "Transforms vocabulary mastery into pure gold (+40% Gold earned from defeats).",
    icon: 'Coins',
    rarity: 'epic',
    statBonus: { critRate: 0.05 }
  },
  {
    id: 'rel_oracle',
    name: "Eye of the Lexicographer",
    type: 'relic',
    price: 500,
    desc: "Bestows acute linguistic clarity (+15% Critical Hit chance across all spells).",
    icon: 'Eye',
    rarity: 'legendary',
    statBonus: { attack: 15, critRate: 0.15 }
  },

  // Consumables
  {
    id: 'pot_heal',
    name: "Elixir of Vitality",
    type: 'potion',
    price: 30,
    desc: "Restores 80 HP during or after intense vocabulary combat.",
    icon: 'Heart',
    rarity: 'common',
    effect: 'heal_full'
  },
  {
    id: 'pot_mana',
    name: "Draught of Clarity",
    type: 'potion',
    price: 25,
    desc: "Restores 40 MP to empower advanced combo spells.",
    icon: 'Zap',
    rarity: 'common',
    effect: 'mana_full'
  }
];
