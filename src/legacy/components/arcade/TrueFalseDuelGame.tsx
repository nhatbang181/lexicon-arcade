import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Realm, VocabWord } from '../../types/vocab.ts';
import { soundEngine } from '../../audio/soundEngine.ts';
import { speakEnglish } from '../../utils/speech.ts';

interface DuelCard {
  id: string;
  word: VocabWord;
  displayedPairing: string;
  isPairingCorrect: boolean;
  actualMeaning: string;
}

interface TrueFalseDuelGameProps {
  realm: Realm;
  onExit: () => void;
}

export const TrueFalseDuelGame: React.FC<TrueFalseDuelGameProps> = ({
  realm,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(6);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const TOTAL_CARDS = 15;

  // Generate 15 rapid True/False duel cards
  const cards = useMemo<DuelCard[]>(() => {
    const list: DuelCard[] = [];
    const pool = [...realm.words].sort(() => 0.5 - Math.random());

    for (let i = 0; i < TOTAL_CARDS; i++) {
      const targetWord = pool[i % pool.length];
      const isCorrect = Math.random() >= 0.45; // ~55% true, ~45% false

      let displayedPairing = '';
      if (isCorrect) {
        // Use true meaning or synonym
        displayedPairing =
          targetWord.synonyms && targetWord.synonyms.length > 0 && Math.random() > 0.5
            ? `Đồng nghĩa: ${targetWord.synonyms[0]}`
            : targetWord.meaning;
      } else {
        // Use false meaning from another word
        const otherWord = pool[(i + 3) % pool.length];
        displayedPairing = otherWord.meaning;
      }

      list.push({
        id: `duel_${i}_${Date.now()}`,
        word: targetWord,
        displayedPairing,
        isPairingCorrect: isCorrect,
        actualMeaning: targetWord.meaning,
      });
    }

    return list;
  }, [realm]);

  const currentCard = cards[currentIndex];

  // Timer countdown (6s rapid fire)
  useEffect(() => {
    if (isGameOver || feedback) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          soundEngine.playBuzzerSound();
          handleAnswer(null); // timeout counts as wrong
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, feedback, currentIndex]);

  // Answer handler
  const handleAnswer = useCallback(
    (userGuess: boolean | null) => {
      if (feedback || isGameOver || !currentCard) return;

      const isSuccess = userGuess === currentCard.isPairingCorrect;

      if (isSuccess) {
        soundEngine.playCoinSound();
        speakEnglish(currentCard.word.word);
        setFeedback('correct');

        const nextStreak = streak + 1;
        setStreak(nextStreak);
        setMaxStreak((ms) => Math.max(ms, nextStreak));

        const earned = 50 + timeLeft * 10 + nextStreak * 15;
        setScore((s) => s + earned);
      } else {
        soundEngine.playBuzzerSound();
        setFeedback('wrong');
        setStreak(0);

        setHearts((h) => {
          const next = h - 1;
          if (next <= 0) {
            soundEngine.playDefeatSound();
            setIsGameOver(true);
            return 0;
          }
          return next;
        });
      }

      setTimeout(() => {
        if (currentIndex + 1 >= TOTAL_CARDS) {
          soundEngine.playVictorySound();
          setIsGameOver(true);
        } else {
          setCurrentIndex((idx) => idx + 1);
          setTimeLeft(6);
          setFeedback(null);
        }
      }, 700);
    },
    [feedback, isGameOver, currentCard, streak, timeLeft, currentIndex]
  );

  // Keyboard controls: [F] or [←] for False, [J] or [→] for True
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || feedback) return;

      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleAnswer(false);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'j') {
        e.preventDefault();
        handleAnswer(true);
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswer, isGameOver, feedback, onExit]);

  const restartDuel = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setHearts(3);
    setTimeLeft(6);
    setFeedback(null);
    setIsGameOver(false);
  };

  const timerPercent = Math.max(0, Math.min(100, (timeLeft / 6) * 100));

  if (!currentCard) return null;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center select-none">
      {/* HUD Header */}
      <div className="w-full pixel-frame-brown p-3.5 mb-5 bg-stone-900/95 flex flex-wrap items-center justify-between gap-4 border-amber-900/80 shadow-2xl">
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
              ⚡ ĐỐI KHÁNG ĐÚNG / SAI
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              THẺ {currentIndex + 1}/{TOTAL_CARDS} · CHỦ ĐỀ: {realm.name.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Hearts & Streak */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-stone-950 px-2.5 py-1 rounded border border-stone-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`text-base ${i < hearts ? 'text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]' : 'text-stone-700'}`}
              >
                {i < hearts ? '❤️' : '🖤'}
              </span>
            ))}
          </div>

          {streak > 1 && (
            <div className="font-arcade text-xs text-amber-300 px-2 py-0.5 bg-amber-500/20 border border-amber-400/60 rounded animate-pulse">
              🔥 x{streak} FEVER!
            </div>
          )}

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-stone-400">ĐIỂM</span>
            <span className="font-pixel text-sm text-amber-300">{score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Duel Screen */}
      {isGameOver ? (
        <div className="w-full max-w-md pixel-frame-grey p-8 bg-stone-900/95 flex flex-col items-center text-center shadow-2xl">
          <span className="text-5xl mb-3">{hearts > 0 ? '🏆' : '💀'}</span>
          <h2 className="text-2xl font-arcade font-bold text-amber-300 mb-2">
            {hearts > 0 ? 'CHIẾN THẮNG ĐỐI KHÁNG!' : 'HẾT MẠNG RỒI!'}
          </h2>
          <p className="text-xs text-stone-400 mb-6">
            Chuỗi đúng liên tiếp cao nhất: <span className="text-amber-300 font-bold">x{maxStreak}</span>
          </p>

          <div className="bg-stone-950 border border-stone-800 p-4 rounded-lg w-full mb-6 text-center">
            <div className="text-xs font-mono text-stone-400">TỔNG ĐIỂM SỐ</div>
            <div className="text-2xl font-pixel text-amber-300 mt-1">{score.toLocaleString()}</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={restartDuel}
              className="pixel-btn-yellow px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
            >
              <span>↺</span>
              <span>ĐẤU LẠI</span>
            </button>

            <button
              type="button"
              onClick={onExit}
              className="pixel-btn-red px-4 py-2.5 text-xs cursor-pointer"
            >
              THOÁT
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          {/* Card Box */}
          <div
            className={`w-full pixel-frame-tan p-8 mb-6 bg-stone-900/90 flex flex-col items-center text-center transition-all duration-150 ${
              feedback === 'correct'
                ? 'border-emerald-400 bg-emerald-950/40 shadow-emerald-500/20 shadow-xl'
                : feedback === 'wrong'
                ? 'border-red-500 bg-red-950/40 animate-shake'
                : ''
            }`}
          >
            {/* Rapid Timer Line */}
            <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800 mb-6">
              <div
                className={`h-full transition-all duration-300 ${
                  timeLeft > 2 ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
                }`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>

            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 mb-3">
              {currentCard.word.pos || 'IELTS 8.0'}
            </span>

            <h1 className="text-3xl sm:text-4xl font-arcade font-bold text-amber-300 tracking-wide mb-4">
              {currentCard.word.word.toUpperCase()}
            </h1>

            <div className="w-16 h-0.5 bg-amber-600/50 mb-4" />

            <div className="text-base sm:text-lg text-stone-100 font-sans font-medium px-4 py-3 bg-stone-950/70 rounded-lg border border-stone-800 max-w-xl">
              &ldquo;{currentCard.displayedPairing}&rdquo;
            </div>

            {feedback && (
              <div className="mt-4 font-arcade font-bold text-sm">
                {feedback === 'correct' ? (
                  <span className="text-emerald-400">✓ CHÍNH XÁC!</span>
                ) : (
                  <span className="text-red-400">
                    ✗ SAI RỒI! Nghĩa đúng: {currentCard.actualMeaning}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons: FALSE [← / F] & TRUE [→ / J] */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              type="button"
              onClick={() => handleAnswer(false)}
              disabled={Boolean(feedback)}
              className="pixel-btn-red py-4 text-center flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <div className="text-lg font-arcade font-bold">✗ SAI (FALSE)</div>
              <span className="text-[10px] font-mono text-stone-300">Phím [F] hoặc [←]</span>
            </button>

            <button
              type="button"
              onClick={() => handleAnswer(true)}
              disabled={Boolean(feedback)}
              className="pixel-btn-green py-4 text-center flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <div className="text-lg font-arcade font-bold">✓ ĐÚNG (TRUE)</div>
              <span className="text-[10px] font-mono text-stone-300">Phím [J] hoặc [→]</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
