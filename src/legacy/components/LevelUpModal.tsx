import React from 'react';
import { Sparkles, Swords, Zap, Wind, Heart, Coins } from 'lucide-react';

export interface UpgradeOption {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
}

const ALL_UPGRADES: UpgradeOption[] = [
  {
    id: 'add_orb',
    title: "+1 Orbiting Lexicon Orb",
    desc: "Adds an additional magical orb circling the hero, continuously damaging surrounding enemies.",
    icon: 'Sparkles',
    color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40'
  },
  {
    id: 'boost_dagger',
    title: "Sharpened Lexical Daggers",
    desc: "Increases projectile dagger damage by +35% and adds +1 enemy piercing.",
    icon: 'Swords',
    color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40'
  },
  {
    id: 'boost_lightning',
    title: "Arch-Lightning Surge",
    desc: "Reduces Chain Lightning cooldown by 25% and zaps 2 additional enemies simultaneously.",
    icon: 'Zap',
    color: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/40'
  },
  {
    id: 'boost_speed',
    title: "Boots of Swift Recall",
    desc: "Increases hero movement speed by +20% for superior monster dodging.",
    icon: 'Wind',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40'
  },
  {
    id: 'boost_health',
    title: "Heart of the Polyglot",
    desc: "Instantly restores 60 HP and permanently raises Max HP by +25.",
    icon: 'Heart',
    color: 'from-red-500/20 to-rose-500/20 text-red-300 border-red-500/40'
  },
  {
    id: 'gold_bounty',
    title: "Scholastic Gold Bounty",
    desc: "Instantly awards +80 Gold to fund gear upgrades in the Merchant Emporium.",
    icon: 'Coins',
    color: 'from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/40'
  }
];

interface LevelUpModalProps {
  level: number;
  onSelectUpgrade: (upgradeId: string) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, onSelectUpgrade }) => {
  // Pick 3 random upgrades
  const options = React.useMemo(() => {
    return [...ALL_UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
  }, [level]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-3xl">
          🌟
        </div>

        <div>
          <h2 className="text-2xl font-black font-rpg text-amber-400">
            LEVEL UP! (Level {level})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select a Roguelike Powerup to empower your lexical arsenal:
          </p>
        </div>

        <div className="space-y-2.5 text-left">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelectUpgrade(opt.id)}
              className={`w-full p-4 rounded-2xl bg-gradient-to-r ${opt.color} border hover:scale-[1.02] transition-all flex items-start gap-3.5 group`}
            >
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors font-rpg">
                  {opt.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {opt.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
