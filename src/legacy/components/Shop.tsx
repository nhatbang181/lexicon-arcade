import React, { useState } from 'react';
import type { PlayerState, Item } from '../types/game.ts';
import { gameStore } from '../store/gameStore.ts';
import { ArrowLeft, Check, Coins } from 'lucide-react';
import { getAssetPath } from '../utils/paths.ts';

interface ShopProps {
  player: PlayerState;
  onExit: () => void;
}

interface PixelPedestalItem {
  id: string;
  name: string;
  type: 'weapon' | 'potion' | 'relic';
  sprite: string;
  price: number;
  damage?: number;
  energyCost?: number;
  desc: string;
  rarity: 'Common' | 'Rare' | 'Legendary';
}

const PEDESTAL_ITEMS: PixelPedestalItem[] = [
  {
    id: 'sword_knight',
    name: "Knight's Broadsword",
    type: 'weapon',
    sprite: '/assets/soul_knight/weapons/sword_knight.png',
    price: 30,
    damage: 35,
    energyCost: 0,
    desc: "Sweeping blade slash. Slices through monsters and DEFLECTS enemy bullets back at them!",
    rarity: 'Common'
  },
  {
    id: 'sword_katana',
    name: "Katana of Fluency",
    type: 'weapon',
    sprite: '/assets/soul_knight/weapons/sword_katana.png',
    price: 90,
    damage: 48,
    energyCost: 0,
    desc: "Rapid razor-sharp slashes with +25% Critical Strike chance.",
    rarity: 'Rare'
  },
  {
    id: 'sword_anime',
    name: "Grand Claymore of Band 9.0",
    type: 'weapon',
    sprite: '/assets/soul_knight/weapons/sword_anime.png',
    price: 220,
    damage: 75,
    energyCost: 2,
    desc: "Enormous holy anime blade unleashing wide golden shockwave slashes.",
    rarity: 'Legendary'
  },
  {
    id: 'staff_red',
    name: "Staff of Conflagration",
    type: 'weapon',
    sprite: '/assets/soul_knight/weapons/staff_red.png',
    price: 120,
    damage: 26,
    energyCost: 3,
    desc: "Fires triple homing fireballs towards your crosshair.",
    rarity: 'Rare'
  },
  {
    id: 'staff_green',
    name: "Staff of Arcane Collocations",
    type: 'weapon',
    sprite: '/assets/soul_knight/weapons/staff_green.png',
    price: 110,
    damage: 34,
    energyCost: 2,
    desc: "Shoots piercing emerald plasma bolts that ricochet off dungeon stone walls.",
    rarity: 'Rare'
  },
  {
    id: 'bow',
    name: "Recurve Bow of the Scribe",
    type: 'weapon',
    sprite: '/assets/soul_knight/weapons/bow.png',
    price: 95,
    damage: 55,
    energyCost: 2,
    desc: "High velocity piercing arrows that punch through monster lines.",
    rarity: 'Rare'
  },
  {
    id: 'hammer',
    name: "Goliath Word Hammer",
    type: 'weapon',
    sprite: '/assets/soul_knight/weapons/hammer.png',
    price: 150,
    damage: 65,
    energyCost: 3,
    desc: "Smashes the floor with a 360-degree destructive shockwave ring.",
    rarity: 'Legendary'
  },
  {
    id: 'pot_heal',
    name: "Health Elixir Flask",
    type: 'potion',
    sprite: '/assets/soul_knight/items/potion_red.png',
    price: 25,
    desc: "Instantly restores +4 HP to survive deeper dungeon rooms.",
    rarity: 'Common'
  },
  {
    id: 'pot_mana',
    name: "Mana Energy Flask",
    type: 'potion',
    sprite: '/assets/soul_knight/items/potion_blue.png',
    price: 20,
    desc: "Restores +100 Energy to fuel heavy magic staff volleys.",
    rarity: 'Common'
  }
];

export const Shop: React.FC<ShopProps> = ({ player, onExit }) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleBuy = (item: PixelPedestalItem) => {
    if (player.gold < item.price) {
      setFeedback("NOT ENOUGH COINS IN THE PURSE!");
      setTimeout(() => setFeedback(null), 2500);
      return;
    }

    player.gold -= item.price;
    setFeedback(`ACQUIRED ${item.name.toUpperCase()}!`);
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="pixel-btn-blue px-3 py-2 text-[10px] flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO LOBBY</span>
        </button>

        <div className="flex items-center gap-2 pixel-frame-grey px-4 py-2">
          <img src={getAssetPath('/assets/soul_knight/items/coin_0.png')} alt="coin" className="w-5 h-5 pixelated" />
          <span className="font-pixel text-xs text-amber-400">{player.gold} GOLD</span>
        </div>
      </div>

      {/* Trader Banner */}
      <div className="pixel-frame-brown p-5 flex items-center gap-5">
        <div className="w-16 h-16 bg-slate-900 border-2 border-amber-500 rounded-xl flex items-center justify-center p-2 shrink-0">
          <img
            src={getAssetPath('/assets/soul_knight/weapons/staff_red.png')}
            alt="Trader"
            className="w-12 h-12 object-contain pixelated drop-shadow"
          />
        </div>
        <div>
          <h2 className="text-sm font-pixel text-amber-300">
            DUNGEON PEDESTAL TRADER
          </h2>
          <p className="text-xs font-mono text-amber-100/80 mt-1">
            "Spend dungeon coins won from vanquished monsters on legendary swords, staves, bows, and recovery flasks."
          </p>
        </div>
      </div>

      {feedback && (
        <div className="pixel-frame-grey p-2.5 text-center text-xs font-pixel text-amber-400 animate-pulse">
          {feedback}
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PEDESTAL_ITEMS.map((item) => (
          <div
            key={item.id}
            className="pixel-frame-grey p-4 flex flex-col justify-between hover:-translate-y-1 transition-transform"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[9px] font-pixel px-2 py-0.5 rounded ${
                  item.rarity === 'Legendary'
                    ? 'bg-amber-500 text-black'
                    : item.rarity === 'Rare'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}>
                  {item.rarity}
                </span>

                <div className="flex items-center gap-1 font-pixel text-xs text-amber-400">
                  <img src={getAssetPath('/assets/soul_knight/items/coin_0.png')} alt="coin" className="w-4 h-4 pixelated" />
                  <span>{item.price}</span>
                </div>
              </div>

              {/* Sprite Pedestal */}
              <div className="w-full h-24 bg-slate-950/70 border-2 border-slate-800 rounded-xl flex items-center justify-center p-3 mb-3 shadow-inner">
                <img
                  src={getAssetPath(item.sprite)}
                  alt={item.name}
                  className="max-h-16 max-w-16 object-contain pixelated drop-shadow-[0_4px_10px_rgba(251,191,36,0.4)]"
                />
              </div>

              <h3 className="text-xs font-pixel text-slate-100 leading-snug">
                {item.name}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-2 leading-relaxed">
                {item.desc}
              </p>

              {item.damage !== undefined && (
                <div className="mt-3 flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-red-400 font-bold">⚔️ {item.damage} ATK</span>
                  <span className="text-blue-400 font-bold">⚡ {item.energyCost} MP</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t-2 border-slate-800">
              <button
                onClick={() => handleBuy(item)}
                disabled={player.gold < item.price}
                className="w-full pixel-btn-yellow py-2 text-[10px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow"
              >
                <span>PURCHASE</span>
                <span className="text-[9px]">({item.price}G)</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
