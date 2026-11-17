import React from 'react';
import { Heart, Shield, Zap, Coins, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import type { SoulKnightEngine } from '../game/soulKnightEngine.ts';

interface SoulKnightHUDProps {
  engine: SoulKnightEngine;
  realmName: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
}

export const SoulKnightHUD: React.FC<SoulKnightHUDProps> = ({
  engine,
  realmName,
  isMuted,
  onToggleMute,
  onExit
}) => {
  const hpPct = Math.max(0, (engine.hp / engine.maxHp) * 100);
  const shieldPct = Math.max(0, (engine.shield / engine.maxShield) * 100);
  const energyPct = Math.max(0, (engine.energy / engine.maxEnergy) * 100);

  const activeWeapon = engine.getActiveWeapon();
  const secondaryWeapon = engine.activeWeaponSlot === 1 ? engine.secondaryWeapon : engine.primaryWeapon;

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-20 select-none">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        {/* SOUL KNIGHT STATS HUD (HP, Shield, Energy) */}
        <div className="space-y-1.5 pointer-events-auto bg-slate-950/90 border-2 border-slate-800 rounded-2xl p-3 backdrop-blur-md shadow-2xl min-w-[210px]">
          {/* Health Bar (Red) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-red-600 flex items-center justify-center text-white shrink-0 shadow">
              <Heart className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-mono font-bold text-red-300">
                <span>HP</span>
                <span>{engine.hp}/{engine.maxHp}</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-red-950">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-200"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Shield Bar (Silver / Armor) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-slate-400 flex items-center justify-center text-slate-950 shrink-0 shadow">
              <Shield className="w-3.5 h-3.5 fill-slate-950" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-mono font-bold text-slate-300">
                <span>SHIELD</span>
                <span>{engine.shield}/{engine.maxShield}</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-slate-400 to-slate-200 transition-all duration-200"
                  style={{ width: `${shieldPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Energy Bar (Blue / Mana) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white shrink-0 shadow">
              <Zap className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-mono font-bold text-blue-300">
                <span>ENERGY</span>
                <span>{engine.energy}/{engine.maxEnergy}</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-blue-950">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-200"
                  style={{ width: `${energyPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Realm Name & Kills */}
        <div className="flex items-center gap-3 bg-slate-950/85 border border-slate-800 px-4 py-2 rounded-2xl backdrop-blur-md">
          <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 font-rpg">
            {realmName}
          </span>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
            <span>💀</span>
            <span>{engine.kills}</span>
          </div>
        </div>

        {/* Top Right Coins & Menu */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold text-amber-400 backdrop-blur-md">
            <Coins className="w-4 h-4" />
            <span>{engine.coinsEarned}</span>
          </div>

          <button
            onClick={onToggleMute}
            className="p-2.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-100 transition-colors backdrop-blur-md"
            title="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onExit}
            className="p-2.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-amber-400 transition-colors backdrop-blur-md"
            title="Return to Map"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Area: Controls Tip & Soul Knight Weapon Slot Card */}
      <div className="flex items-end justify-between">
        {/* Controls Reminder */}
        <div className="bg-slate-950/85 border border-slate-800/90 rounded-2xl px-4 py-2 text-xs font-mono text-slate-300 backdrop-blur-md pointer-events-auto flex items-center gap-3">
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold">WASD</kbd> Move</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold">L-Click</kbd> Attack</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold">Q</kbd> Swap Weapon</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold">1-4</kbd> Shatter Rune</span>
        </div>

        {/* SOUL KNIGHT WEAPON HUD CARD */}
        <div 
          onClick={() => engine.swapWeapon()}
          className="pointer-events-auto cursor-pointer group bg-slate-950/95 border-2 border-amber-500/80 hover:border-amber-400 rounded-2xl p-3 backdrop-blur-md shadow-2xl flex items-center gap-3 transition-transform hover:scale-105"
        >
          {/* Active Weapon Sprite Box */}
          <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1.5 relative shadow-inner">
            <img
              src={activeWeapon.spritePath}
              alt={activeWeapon.name}
              className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            />
            <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold bg-amber-500 text-slate-950 px-1 rounded">
              SLOT {engine.activeWeaponSlot}
            </span>
          </div>

          {/* Weapon Details */}
          <div className="text-left pr-2">
            <h4 className="text-xs font-extrabold text-slate-100 font-rpg group-hover:text-amber-300 transition-colors">
              {activeWeapon.name}
            </h4>
            <div className="flex items-center gap-2 text-[11px] font-mono mt-1">
              <span className="text-red-400 font-bold">⚔️ {activeWeapon.damage} ATK</span>
              <span className="text-blue-400 font-bold">⚡ {activeWeapon.energyCost} MP</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block italic">
              Tap [Q] or click to swap
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
