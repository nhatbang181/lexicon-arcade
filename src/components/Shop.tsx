import React, { useState } from 'react';
import type { PlayerState, Item } from '../types/game.ts';
import { SHOP_ITEMS } from '../data/shopItems.ts';
import { gameStore } from '../store/gameStore.ts';
import { 
  ArrowLeft, Coins, Shield, Swords, Wand2, Shirt, 
  Crown, Gem, Heart, Zap, Sparkles, Check, Package
} from 'lucide-react';

interface ShopProps {
  player: PlayerState;
  onExit: () => void;
}

const RARITY_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  common: { border: 'border-slate-700', bg: 'bg-slate-800/40', text: 'text-slate-400' },
  rare: { border: 'border-blue-500/50', bg: 'bg-blue-950/30', text: 'text-blue-400' },
  epic: { border: 'border-purple-500/50', bg: 'bg-purple-950/30', text: 'text-purple-400' },
  legendary: { border: 'border-amber-500/60', bg: 'bg-amber-950/40', text: 'text-amber-400' }
};

export const Shop: React.FC<ShopProps> = ({ player, onExit }) => {
  const [filter, setFilter] = useState<'all' | 'weapon' | 'armor' | 'relic' | 'potion'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredItems = SHOP_ITEMS.filter(it => filter === 'all' || it.type === filter);

  const isEquipped = (item: Item) => {
    return (
      player.equipped.weapon?.id.startsWith(item.id) ||
      player.equipped.armor?.id.startsWith(item.id) ||
      player.equipped.relic?.id.startsWith(item.id)
    );
  };

  const hasInInventory = (item: Item) => {
    return player.inventory.some(it => it.id.startsWith(item.id));
  };

  const handleBuy = (item: Item) => {
    if (player.gold < item.price) {
      setFeedback("Not enough gold to acquire this item!");
      setTimeout(() => setFeedback(null), 2500);
      return;
    }

    const ok = gameStore.buyItem(item);
    if (ok) {
      setFeedback(`Acquired ${item.name}!`);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleEquip = (item: Item) => {
    const owned = player.inventory.find(it => it.id.startsWith(item.id));
    if (owned) {
      gameStore.equipItem(owned);
      setFeedback(`Equipped ${item.name}!`);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-amber-400 bg-slate-800 hover:bg-slate-700/80 px-3 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Map
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-300">Your Coffers:</span>
            <span className="font-bold text-amber-300 font-mono text-sm">{player.gold} Gold</span>
          </div>
        </div>
      </div>

      {/* Merchant Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl">
          🧙
        </div>
        <div>
          <h2 className="text-lg font-bold font-rpg text-amber-300">
            Arch-Librarian's Emporium
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            "Gold won from defeating lexical beasts may be exchanged for enchanted instruments, protective robes, and memory talismans."
          </p>
        </div>
      </div>

      {feedback && (
        <div className="px-4 py-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs font-semibold text-amber-300 text-center animate-pulse">
          {feedback}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {(['all', 'weapon', 'armor', 'relic', 'potion'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === tab
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Item Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const equipped = isEquipped(item);
          const owned = hasInInventory(item);
          const rarity = RARITY_COLORS[item.rarity];

          return (
            <div
              key={item.id}
              className={`bg-slate-900/90 border ${rarity.border} rounded-2xl p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-lg`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${rarity.bg} ${rarity.text}`}>
                    {item.rarity} · {item.type}
                  </span>

                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400 font-mono">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{item.price}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-100 font-rpg mt-1">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {item.desc}
                </p>

                {/* Stat Bonuses */}
                {item.statBonus && (
                  <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {item.statBonus.attack && (
                      <span className="bg-red-950/50 text-red-300 border border-red-800/40 px-2 py-0.5 rounded">
                        +{item.statBonus.attack} ATK
                      </span>
                    )}
                    {item.statBonus.defense && (
                      <span className="bg-blue-950/50 text-blue-300 border border-blue-800/40 px-2 py-0.5 rounded">
                        +{item.statBonus.defense} DEF
                      </span>
                    )}
                    {item.statBonus.hp && (
                      <span className="bg-emerald-950/50 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 rounded">
                        +{item.statBonus.hp} HP
                      </span>
                    )}
                    {item.statBonus.mp && (
                      <span className="bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 px-2 py-0.5 rounded">
                        +{item.statBonus.mp} MP
                      </span>
                    )}
                    {item.statBonus.critRate && (
                      <span className="bg-amber-950/50 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded">
                        +{Math.round(item.statBonus.critRate * 100)}% CRIT
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {equipped ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <Check className="w-4 h-4" /> Equipped
                  </span>
                ) : owned && item.type !== 'potion' ? (
                  <button
                    onClick={() => handleEquip(item)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                  >
                    Equip Item
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={player.gold < item.price}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Purchase ({item.price} Gold)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
