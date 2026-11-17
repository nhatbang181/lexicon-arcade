import React, { useState } from 'react';
import type { Realm } from '../../types/vocab.ts';
import { soundEngine } from '../../audio/soundEngine.ts';

interface IOEGameHUDProps {
  hearts: number;
  maxHearts?: number;
  score: number;
  combo: number;
  roundIndex: number;
  totalRounds?: number;
  realmName: string;
  allRealms?: Realm[];
  onSwitchRealm?: (realm: Realm) => void;
  onOpenMistakes: () => void;
  mistakeCount: number;
  onExit: () => void;
}

export const IOEGameHUD: React.FC<IOEGameHUDProps> = ({
  hearts,
  maxHearts = 3,
  score,
  combo,
  roundIndex,
  totalRounds = 4,
  realmName,
  allRealms,
  onSwitchRealm,
  onOpenMistakes,
  mistakeCount,
  onExit,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.isMuted());

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleRealmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!allRealms || !onSwitchRealm) return;
    const targetRealm = allRealms.find((r) => r.id === e.target.value);
    if (targetRealm) {
      soundEngine.playAttackSound();
      onSwitchRealm(targetRealm);
    }
  };

  return (
    <header className="w-full max-w-5xl mx-auto mb-6 select-none">
      <div className="pixel-frame-brown p-3.5 bg-stone-900/95 flex flex-wrap items-center justify-between gap-4 border-amber-900/80 shadow-2xl">
        {/* Left: Exit + Realm info + Round badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onExit}
            className="pixel-btn-red px-2.5 py-1.5 text-[11px] flex items-center gap-1.5 cursor-pointer"
            title="Thoát về bản đồ chủ đề"
          >
            <span>◀</span>
            <span className="hidden sm:inline">THOÁT</span>
          </button>

          <div className="flex flex-col">
            {allRealms && allRealms.length > 0 && onSwitchRealm ? (
              <select
                value={allRealms.find((r) => r.name === realmName)?.id || ''}
                onChange={handleRealmChange}
                className="bg-stone-950 text-amber-300 font-pixel text-[10px] px-2 py-1 rounded border border-amber-800/80 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {allRealms.map((r) => (
                  <option key={r.id} value={r.id} className="bg-stone-900 text-stone-200">
                    {r.name} ({r.words.length})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[10px] font-pixel text-amber-400/90 tracking-wider">
                {realmName.toUpperCase()}
              </span>
            )}

            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-[10px] font-pixel bg-indigo-950 text-indigo-300 border border-indigo-700 rounded">
                CHẶNG {roundIndex}/{totalRounds}
              </span>
            </div>
          </div>
        </div>

        {/* Center: 3 Hearts & Combo Meter */}
        <div className="flex items-center gap-5">
          {/* Hearts */}
          <div className="flex items-center gap-1.5 bg-stone-950/80 px-3 py-1.5 rounded-lg border border-stone-800">
            {Array.from({ length: maxHearts }).map((_, i) => (
              <span
                key={i}
                className={`text-lg sm:text-xl transition-transform duration-200 ${
                  i < hearts
                    ? 'text-red-500 scale-100 filter drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]'
                    : 'text-stone-700 opacity-40 scale-90'
                }`}
                title={i < hearts ? 'Tim còn sống' : 'Đã mất 1 mạng'}
              >
                {i < hearts ? '❤️' : '🖤'}
              </span>
            ))}
          </div>

          {/* Combo Multiplier */}
          {combo > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-400/60 rounded-md text-amber-300 animate-pulse">
              <span className="text-xs">🔥</span>
              <span className="font-pixel text-[11px] font-bold">x{combo} COMBO!</span>
            </div>
          )}
        </div>

        {/* Right: Score + Mistake Bank + Sound Toggle */}
        <div className="flex items-center gap-3">
          {/* Score Counter */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-stone-400">ĐIỂM SỐ</span>
            <span className="font-pixel text-sm sm:text-base text-amber-300 drop-shadow">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Mistake Bank Button */}
          <button
            type="button"
            onClick={onOpenMistakes}
            className="pixel-btn-blue px-2.5 py-1.5 text-[10px] flex items-center gap-1.5 relative cursor-pointer"
            title="Xem ngân hàng các từ bị sai"
          >
            <span>📚</span>
            <span className="hidden md:inline">SỔ TAY</span>
            {mistakeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-mono flex items-center justify-center -top-2 -right-2 absolute border border-red-300 shadow">
                {mistakeCount}
              </span>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-1.5 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            <span className="text-base">{isMuted ? '🔇' : '🔊'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
