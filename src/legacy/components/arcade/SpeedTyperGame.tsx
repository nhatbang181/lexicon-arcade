import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { VocabWord } from '../../types/vocab.ts';
import { soundEngine } from '../../audio/soundEngine.ts';
import { speakEnglish } from '../../utils/speech.ts';

interface FallingWord {
  id: string;
  word: VocabWord;
  text: string;
  typedLength: number;
  x: number; // percentage 10% to 80%
  y: number; // percentage 0% to 100%
  speed: number;
}

interface SpeedTyperGameProps {
  words: VocabWord[];
  realmName: string;
  onExit: () => void;
}

export const SpeedTyperGame: React.FC<SpeedTyperGameProps> = ({
  words,
  realmName,
  onExit,
}) => {
  const [activeWords, setActiveWords] = useState<FallingWord[]>([]);
  const [targetWordId, setTargetWordId] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [shields, setShields] = useState<number>(3);
  const [wordsCleared, setWordsCleared] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [floatingNotification, setFloatingNotification] = useState<{
    text: string;
    subText: string;
    x: number;
    y: number;
  } | null>(null);

  // Pool of clean single words
  const eligibleWords = useRef<VocabWord[]>([]);
  useEffect(() => {
    eligibleWords.current = words.filter(
      (w) => /^[a-zA-Z]{4,12}$/.test(w.word.trim())
    );
  }, [words]);

  // Spawn a falling word
  const spawnWord = useCallback(() => {
    const pool = eligibleWords.current;
    if (pool.length === 0) return;

    const randomWord = pool[Math.floor(Math.random() * pool.length)];
    const id = `falling_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const x = 12 + Math.random() * 66; // between 12% and 78% width

    setActiveWords((prev) => {
      // Limit max 4 simultaneous falling words
      if (prev.length >= 4) return prev;
      // Avoid duplicate words on screen
      if (prev.some((w) => w.text.toLowerCase() === randomWord.word.toLowerCase())) {
        return prev;
      }
      return [
        ...prev,
        {
          id,
          word: randomWord,
          text: randomWord.word.toLowerCase(),
          typedLength: 0,
          x,
          y: 5,
          speed: 0.12 + Math.random() * 0.08, // speed per frame
        },
      ];
    });
  }, []);

  // Main game physics tick (60 FPS)
  useEffect(() => {
    if (isGameOver) return;

    const interval = setInterval(() => {
      setActiveWords((prev) => {
        let shieldHit = false;
        const nextWords: FallingWord[] = [];

        for (const item of prev) {
          const nextY = item.y + item.speed;

          if (nextY >= 88) {
            // Reached bottom shield!
            shieldHit = true;
          } else {
            nextWords.push({ ...item, y: nextY });
          }
        }

        if (shieldHit) {
          soundEngine.playHurtSound();
          setStreak(0);
          setTargetWordId(null);
          setShields((s) => {
            const next = s - 1;
            if (next <= 0) {
              soundEngine.playDefeatSound();
              setIsGameOver(true);
              return 0;
            }
            return next;
          });
        }

        return nextWords;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isGameOver]);

  // Spawn timer
  useEffect(() => {
    if (isGameOver) return;

    spawnWord();
    const timer = setInterval(() => {
      spawnWord();
    }, 2400);

    return () => clearInterval(timer);
  }, [isGameOver, spawnWord]);

  // Keyboard typing listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      if (e.key === 'Escape') {
        onExit();
        return;
      }

      const key = e.key.toLowerCase();
      if (!/^[a-z]$/.test(key)) return;

      setActiveWords((prev) => {
        // If we already locked on a target
        let target = prev.find((w) => w.id === targetWordId);

        // If no target or target doesn't match next char, find word whose next char matches
        if (!target || target.text[target.typedLength] !== key) {
          const matching = prev.find((w) => w.text[w.typedLength] === key);
          if (matching) {
            target = matching;
            setTargetWordId(matching.id);
          } else {
            // Typing error
            soundEngine.playBuzzerSound();
            return prev;
          }
        }

        if (target && target.text[target.typedLength] === key) {
          soundEngine.playAttackSound();
          const nextTyped = target.typedLength + 1;

          // Word completely typed! DESTROY!
          if (nextTyped >= target.text.length) {
            soundEngine.playCritSound();
            speakEnglish(target.text);

            const pointsEarned = 100 + target.text.length * 10 + streak * 15;
            setScore((s) => s + pointsEarned);
            setStreak((st) => st + 1);
            setWordsCleared((w) => w + 1);
            setTargetWordId(null);

            setFloatingNotification({
              text: `+${pointsEarned} ${target.text.toUpperCase()}`,
              subText: target.word.meaning,
              x: target.x,
              y: target.y,
            });
            setTimeout(() => setFloatingNotification(null), 1200);

            return prev.filter((w) => w.id !== target.id);
          }

          // Advance typed position on target
          return prev.map((w) =>
            w.id === target.id ? { ...w, typedLength: nextTyped } : w
          );
        }

        return prev;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, targetWordId, streak, onExit]);

  const restartGame = () => {
    setActiveWords([]);
    setTargetWordId(null);
    setScore(0);
    setStreak(0);
    setShields(3);
    setWordsCleared(0);
    setIsGameOver(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center select-none">
      {/* Game HUD Bar */}
      <div className="w-full pixel-frame-brown p-3.5 mb-4 bg-stone-900/95 flex flex-wrap items-center justify-between gap-4 border-amber-900/80 shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="pixel-btn-red px-2.5 py-1 text-xs cursor-pointer"
          >
            ◀ THOÁT
          </button>

          <div className="flex flex-col">
            <span className="text-xs font-arcade font-bold text-amber-300">
              ⚡ SPEED TYPER: {realmName.toUpperCase()}
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              Gõ phím để bắn phá thiên thạch từ vựng IELTS 8.0
            </span>
          </div>
        </div>

        {/* Shields & Streak */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-stone-950 px-2.5 py-1 rounded border border-stone-800">
            <span className="text-[10px] font-mono text-stone-400 mr-1">LÁ CHẮN:</span>
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`text-base ${
                  i < shields ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]' : 'text-stone-700'
                }`}
              >
                {i < shields ? '🛡️' : '🖤'}
              </span>
            ))}
          </div>

          {streak > 1 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-400/60 rounded text-amber-300 animate-pulse font-arcade text-xs">
              🔥 x{streak} STREAK
            </div>
          )}

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-stone-400">ĐIỂM SỐ</span>
            <span className="font-pixel text-sm text-amber-300">{score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Arcade Canvas Area */}
      <div className="w-full h-[520px] bg-stone-950/95 border-4 border-stone-800 rounded-xl relative overflow-hidden shadow-2xl">
        {/* Starfield background */}
        <div className="absolute inset-0 bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

        {/* Floating Notification upon Kill */}
        {floatingNotification && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-500 animate-bounce"
            style={{
              left: `${floatingNotification.x}%`,
              top: `${Math.max(10, floatingNotification.y - 8)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-emerald-950/90 border border-emerald-400 px-3 py-1.5 rounded-lg shadow-lg text-center">
              <span className="font-arcade font-bold text-xs text-emerald-300 block">
                {floatingNotification.text}
              </span>
              <span className="text-[11px] text-amber-200 font-sans block">
                {floatingNotification.subText}
              </span>
            </div>
          </div>
        )}

        {/* Falling Words */}
        {activeWords.map((item) => {
          const isTarget = targetWordId === item.id;
          const typedPart = item.text.slice(0, item.typedLength);
          const remainingPart = item.text.slice(item.typedLength);

          return (
            <div
              key={item.id}
              className={`absolute transition-transform duration-75 flex flex-col items-center ${
                isTarget ? 'scale-105 z-10' : 'scale-100'
              }`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: 'translateX(-50%)',
              }}
            >
              {/* Word Frame */}
              <div
                className={`px-3 py-1.5 rounded-lg border-2 flex items-center shadow-lg ${
                  isTarget
                    ? 'bg-amber-950/90 border-amber-400 shadow-amber-400/40'
                    : 'bg-stone-900/90 border-stone-700'
                }`}
              >
                <span className="font-arcade font-bold text-base text-amber-300 tracking-wider">
                  {typedPart.toUpperCase()}
                </span>
                <span className="font-arcade font-bold text-base text-stone-200 tracking-wider">
                  {remainingPart.toUpperCase()}
                </span>
              </div>

              {/* Vietnamese Meaning clue */}
              <span className="text-[11px] text-stone-400 bg-stone-950/80 px-2 py-0.5 rounded border border-stone-800 mt-1 max-w-[160px] truncate text-center">
                {item.word.meaning}
              </span>
            </div>
          );
        })}

        {/* Player Laser Turret at Bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <div className="w-12 h-6 bg-cyan-600 rounded-t-xl border-t-2 border-x-2 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
          <div className="w-20 h-4 bg-stone-800 rounded border border-cyan-500" />
        </div>

        {/* Shield Energy Line */}
        <div className="absolute bottom-10 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />

        {/* Game Over Modal */}
        {isGameOver && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
            <span className="text-5xl mb-2">💥</span>
            <h2 className="text-2xl font-arcade font-bold text-red-400 uppercase mb-2">
              LÁ CHẮN ĐÃ VỠ!
            </h2>
            <p className="text-xs text-stone-400 font-mono mb-4 text-center max-w-sm">
              Bạn đã tiêu diệt thành công {wordsCleared} từ vựng IELTS 8.0 với tốc độ cao!
            </p>

            <div className="bg-stone-900 border border-stone-800 p-4 rounded-lg mb-6 text-center w-64">
              <div className="text-[10px] text-stone-400 font-mono">TỔNG ĐIỂM BẮN TỪ</div>
              <div className="text-2xl font-pixel text-amber-300 mt-1">
                {score.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={restartGame}
                className="pixel-btn-yellow px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>↺</span>
                <span>BẮN LẠI</span>
              </button>

              <button
                type="button"
                onClick={onExit}
                className="pixel-btn-red px-4 py-2.5 text-xs cursor-pointer"
              >
                THOÁT RA
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="mt-3 text-xs text-stone-400 flex items-center gap-2">
        <span className="text-amber-400 font-bold">⌨️ Hướng dẫn:</span>
        <span>Gõ chữ cái đầu tiên của từ đang rơi để khóa mục tiêu, gõ hoàn thành từ để bắn hạ và nghe phát âm!</span>
      </div>
    </div>
  );
};
