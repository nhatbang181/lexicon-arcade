import React from 'react';
import { Heart, Zap, Coins, Skull, Clock, Volume2, VolumeX, Pause, Sparkles } from 'lucide-react';
import type { WeaponState } from '../game/weaponManager.ts';

interface GameHUDProps {
  hp: number;
  maxHp: number;
  level: number;
  exp: number;
  maxExp: number;
  kills: number;
  gold: number;
  elapsedSeconds: number;
  weaponState: WeaponState;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hp,
  maxHp,
  level,
  exp,
  maxExp,
  kills,
  gold,
  elapsedSeconds,
  weaponState,
  isMuted,
  onToggleMute,
  onPause
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const expPercent = Math.max(0, Math.min(100, (exp / maxExp) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-20">
      {/* Top Bar */}
      <div className="flex items-start justify-between">
        {/* Hero Health & EXP */}
        <div className="bg-slate-950/85 border border-slate-800/90 rounded-2xl p-3 backdrop-blur-md pointer-events-auto min-w-[220px]">
          <div className="flex items-center justify-between text-xs mb-1 font-mono">
            <span className="font-bold text-slate-100 flex items-center gap-1.5 font-rpg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Hero Lv.{level}
            </span>
            <span className="text-emerald-400 font-semibold">{hp} / {maxHp} HP</span>
          </div>

          {/* Health Bar */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-2">
            <div
              className={`h-full transition-all duration-200 ${
                hpPercent > 35 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-red-500 animate-pulse'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          {/* EXP Bar */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
            <span>EXP</span>
            <span>{exp} / {maxExp}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-200"
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>

        {/* Center Clock / Wave */}
        <div className="bg-slate-950/85 border border-slate-800/90 rounded-2xl px-5 py-2 backdrop-blur-md flex items-center gap-2 pointer-events-auto">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-lg font-mono font-black text-slate-100 tracking-wider">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        {/* Right Stats & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-950/85 border border-slate-800/90 rounded-2xl px-3 py-2 flex items-center gap-3 text-xs font-mono backdrop-blur-md">
            <div className="flex items-center gap-1 text-slate-300">
              <Skull className="w-3.5 h-3.5 text-red-400" />
              <span className="font-bold">{kills}</span>
            </div>

            <div className="flex items-center gap-1 text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              <span className="font-bold">{gold}</span>
            </div>
          </div>

          <button
            onClick={onToggleMute}
            className="p-2.5 bg-slate-950/85 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-100 transition-colors backdrop-blur-md"
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Bottom Area: Controls Reminder & Weapon Inventory */}
      <div className="flex items-end justify-between">
        {/* Active Weapon Chips */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2 backdrop-blur-md pointer-events-auto">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-900 rounded-lg text-xs font-mono text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Orbs: {weaponState.orbCount}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-slate-900 rounded-lg text-xs font-mono text-amber-300">
            <span>⚔️ Daggers</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-slate-900 rounded-lg text-xs font-mono text-purple-300">
            <span>⚡ Lightning</span>
          </div>
        </div>

        {/* Controls Tip */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-400 backdrop-blur-md pointer-events-auto">
          <span className="text-amber-400 font-bold">[W A S D / Arrows]</span> Move · <span className="text-amber-400 font-bold">[1-4]</span> Shatter Runes
        </div>
      </div>
    </div>
  );
};
