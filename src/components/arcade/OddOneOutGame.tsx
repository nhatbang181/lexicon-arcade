import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Realm, VocabWord } from '../../types/vocab.ts';
import { soundEngine } from '../../audio/soundEngine.ts';
import { speakEnglish } from '../../utils/speech.ts';

interface OddOneOutQuestion {
  id: string;
  options: {
    word: VocabWord;
    isImpostor: boolean;
    originRealm: string;
  }[];
  impostorWord: VocabWord;
  themeRealmName: string;
  impostorRealmName: string;
}

interface OddOneOutGameProps {
  currentRealm: Realm;
  allRealms: Realm[];
  onExit: () => void;
}

export const OddOneOutGame: React.FC<OddOneOutGameProps> = ({
  currentRealm,
  allRealms,
  onExit,
}) => {
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [maxCombo, setMaxCombo] = useState<number>(1);
  const [hearts, setHearts] = useState<number>(3);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(12);
  const [isMatchOver, setIsMatchOver] = useState<boolean>(false);

  const TOTAL_QUESTIONS = 10;

  // Generate 10 Odd-One-Out questions
  const questions = useMemo<OddOneOutQuestion[]>(() => {
    const list: OddOneOutQuestion[] = [];
    const otherRealms = allRealms.filter((r) => r.id !== currentRealm.id);
    if (otherRealms.length === 0) return [];

    const themeWords = [...currentRealm.words].sort(() => 0.5 - Math.random());

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const w1 = themeWords[(i * 3) % themeWords.length];
      const w2 = themeWords[(i * 3 + 1) % themeWords.length];
      const w3 = themeWords[(i * 3 + 2) % themeWords.length];

      // Pick an impostor from another realm
      const foreignRealm = otherRealms[i % otherRealms.length];
      const impostorWord =
        foreignRealm.words[Math.floor(Math.random() * foreignRealm.words.length)];

      const options = [
        { word: w1, isImpostor: false, originRealm: currentRealm.name },
        { word: w2, isImpostor: false, originRealm: currentRealm.name },
        { word: w3, isImpostor: false, originRealm: currentRealm.name },
        { word: impostorWord, isImpostor: true, originRealm: foreignRealm.name },
      ].sort(() => 0.5 - Math.random());

      list.push({
        id: `odd_${i}_${Date.now()}`,
        options,
        impostorWord,
        themeRealmName: currentRealm.name,
        impostorRealmName: foreignRealm.name,
      });
    }

    return list;
  }, [currentRealm, allRealms]);

  const currentQ = questions[questionIndex];

  // Timer countdown (12s per question)
  useEffect(() => {
    if (isAnswered || isMatchOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          soundEngine.playBuzzerSound();
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswered, isMatchOver, questionIndex]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    setIsAnswered(true);
    setCombo(1);
    setHearts((h) => {
      const next = h - 1;
      if (next <= 0) {
        setIsMatchOver(true);
        return 0;
      }
      return next;
    });

    setTimeout(() => {
      nextQuestion();
    }, 1800);
  }, [questionIndex]);

  // Advance to next question
  const nextQuestion = () => {
    if (questionIndex + 1 >= TOTAL_QUESTIONS || hearts <= 0) {
      setIsMatchOver(true);
      if (hearts > 0) {
        soundEngine.playVictorySound();
      } else {
        soundEngine.playDefeatSound();
      }
    } else {
      setQuestionIndex((prev) => prev + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
      setTimeLeft(12);
    }
  };

  // Option selection
  const handleSelect = (idx: number) => {
    if (isAnswered || isMatchOver) return;

    setSelectedIdx(idx);
    setIsAnswered(true);

    const chosen = currentQ.options[idx];
    if (chosen.isImpostor) {
      // Correct!
      soundEngine.playCoinSound();
      speakEnglish(chosen.word.word);

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));

      const pointsEarned = 100 + timeLeft * 10 + combo * 20;
      setScore((s) => s + pointsEarned);

      setTimeout(() => {
        nextQuestion();
      }, 1500);
    } else {
      // Wrong!
      soundEngine.playBuzzerSound();
      setCombo(1);
      setHearts((h) => {
        const next = h - 1;
        if (next <= 0) {
          setTimeout(() => setIsMatchOver(true), 1500);
          return 0;
        }
        return next;
      });

      setTimeout(() => {
        nextQuestion();
      }, 1800);
    }
  };

  // Keyboard listener [1, 2, 3, 4]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered || isMatchOver) return;
      if (e.key === 'Escape') {
        onExit();
        return;
      }

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < 4) {
          e.preventDefault();
          handleSelect(idx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isMatchOver, currentQ]);

  const restartMatch = () => {
    setQuestionIndex(0);
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setHearts(3);
    setSelectedIdx(null);
    setIsAnswered(false);
    setTimeLeft(12);
    setIsMatchOver(false);
  };

  const timerPercent = Math.max(0, Math.min(100, (timeLeft / 12) * 100));
  const timerColor = timeLeft > 4 ? 'bg-amber-400' : 'bg-red-500 animate-pulse';

  if (!currentQ) return null;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none">
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
              🕵️ ODD ONE OUT: KẺ MẠO DANH TỪ VỰNG
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              CÂU {questionIndex + 1}/{TOTAL_QUESTIONS} · CHỦ ĐỀ CHÍNH: {currentRealm.name.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Hearts & Combo */}
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

          {combo > 1 && (
            <div className="font-arcade text-xs text-amber-300 px-2 py-0.5 bg-amber-500/20 border border-amber-400/60 rounded animate-pulse">
              🔥 x{combo} COMBO
            </div>
          )}

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-stone-400">ĐIỂM</span>
            <span className="font-pixel text-sm text-amber-300">{score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Play Area */}
      {isMatchOver ? (
        <div className="w-full max-w-lg pixel-frame-grey p-8 bg-stone-900/95 flex flex-col items-center text-center shadow-2xl">
          <span className="text-5xl mb-3">{hearts > 0 ? '🏆' : '💀'}</span>
          <h2 className="text-2xl font-arcade font-bold text-amber-300 mb-2">
            {hearts > 0 ? 'CHINH PHỤC THÀNH CÔNG!' : 'HẾT MẠNG RỒI!'}
          </h2>
          <p className="text-xs text-stone-400 mb-6">
            Bạn đã hoàn thành thử thách Kẻ Mạo Danh Từ Vựng với chuỗi combo x{maxCombo}!
          </p>

          <div className="bg-stone-950 border border-stone-800 p-4 rounded-lg w-full mb-6 text-center">
            <div className="text-xs font-mono text-stone-400">TỔNG ĐIỂM SỐ</div>
            <div className="text-2xl font-pixel text-amber-300 mt-1">{score.toLocaleString()}</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={restartMatch}
              className="pixel-btn-yellow px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
            >
              <span>↺</span>
              <span>CHƠI LẠI</span>
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
          {/* Question Banner & Timer */}
          <div className="w-full pixel-frame-tan p-5 mb-5 bg-stone-900/80">
            <div className="flex items-center justify-between mb-3">
              <span className="font-arcade font-bold text-sm text-amber-200">
                Tìm 1 từ KHÔNG THUỘC chủ đề &ldquo;{currentRealm.name}&rdquo;:
              </span>
              <span className="font-pixel text-xs text-amber-400">⏱️ {timeLeft}s</span>
            </div>

            {/* Timer bar */}
            <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div
                className={`h-full transition-all duration-300 ${timerColor}`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>
          </div>

          {/* 4 Cards Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedIdx === idx;
              const isImpostor = opt.isImpostor;

              let cardStyle =
                'bg-stone-900 border-2 border-stone-700 hover:border-amber-400 hover:bg-stone-850 cursor-pointer';

              if (isAnswered) {
                if (isImpostor) {
                  cardStyle =
                    'bg-emerald-950 border-2 border-emerald-400 text-emerald-200 shadow-emerald-500/30 shadow-lg';
                } else if (isSelected && !isImpostor) {
                  cardStyle = 'bg-red-950 border-2 border-red-500 text-red-200 animate-shake';
                } else {
                  cardStyle = 'bg-stone-950/60 border-stone-800 text-stone-600 opacity-50';
                }
              }

              return (
                <button
                  key={opt.word.id}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={`p-4 rounded-xl flex flex-col text-left transition-all duration-150 select-none ${cardStyle}`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded bg-stone-950 border border-stone-700 flex items-center justify-center font-mono text-xs text-amber-400">
                        {idx + 1}
                      </span>
                      <span className="font-arcade font-bold text-lg text-amber-200">
                        {opt.word.word}
                      </span>
                    </div>

                    {isAnswered && isImpostor && (
                      <span className="text-xs font-arcade font-bold text-emerald-400">
                        🎯 KẺ MẠO DANH
                      </span>
                    )}
                    {isAnswered && isSelected && !isImpostor && (
                      <span className="text-xs font-arcade font-bold text-red-400">
                        ✗ NHẦM RỒI
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-stone-300 font-sans mt-1">
                    {opt.word.meaning}
                  </span>

                  {isAnswered && (
                    <span className="text-[10px] font-mono text-stone-400 mt-2 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                      Gốc: {opt.originRealm}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Rationale explanation box upon answer */}
          {isAnswered && (
            <div className="w-full p-4 bg-stone-900 border border-amber-700/60 rounded-xl text-xs text-stone-200 animate-fadeIn flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <strong className="text-amber-300 font-arcade text-xs block mb-0.5">
                  GIẢI THÍCH:
                </strong>
                Từ <strong className="text-emerald-300">&ldquo;{currentQ.impostorWord.word}&rdquo;</strong>{' '}
                ({currentQ.impostorWord.meaning}) thuộc chủ đề{' '}
                <span className="text-amber-300 font-semibold">{currentQ.impostorRealmName}</span>,
                trong khi 3 từ còn lại đều thuộc chủ đề{' '}
                <span className="text-cyan-300 font-semibold">{currentQ.themeRealmName}</span>!
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
