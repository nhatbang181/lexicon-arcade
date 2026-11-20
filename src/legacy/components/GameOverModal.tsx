import React from 'react';
import { Skull, Trophy, RotateCcw, ArrowLeft, Coins, Flame } from 'lucide-react';

interface GameOverModalProps {
  isVictory: boolean;
  survivalTime: number;
  kills: number;
  gold: number;
  wordsSolved: number;
  onRestart: () => void;
  onExit: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  survivalTime,
  kills,
  gold,
  wordsSolved,
  onRestart,
  onExit
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">
        <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center text-4xl border-2 ${
          isVictory ? 'bg-amber-500/20 border-amber-500' : 'bg-red-500/20 border-red-500'
        }`}>
          {isVictory ? '🏆' : '💀'}
        </div>

        <div>
          <h2 className={`text-2xl font-black font-rpg ${
            isVictory ? 'text-amber-400' : 'text-red-400'
          }`}>
            {isVictory ? 'DUNGEON CONQUERED!' : 'HERO FALLEN'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isVictory ? 'You purged the realm of all lexical beasts!' : 'The monster horde overwhelmed your lexical defenses.'}
          </p>
        </div>

        {/* Run Summary Grid */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs font-mono">
          <div className="text-left">
            <span className="text-slate-500">Survival Time</span>
            <p className="text-base font-bold text-slate-100">{formatTime(survivalTime)}</p>
          </div>

          <div className="text-left">
            <span className="text-slate-500">Monsters Vanquished</span>
            <p className="text-base font-bold text-red-400">{kills}</p>
          </div>

          <div className="text-left">
            <span className="text-slate-500">Gold Plundered</span>
            <p className="text-base font-bold text-amber-400">+{gold} Gold</p>
          </div>

          <div className="text-left">
            <span className="text-slate-500">IELTS Barriers Solved</span>
            <p className="text-base font-bold text-emerald-400">{wordsSolved} Words</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Map</span>
          </button>

          <button
            onClick={onRestart}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
