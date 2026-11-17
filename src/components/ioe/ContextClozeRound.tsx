import React, { useState, useEffect, useCallback } from 'react';
import type { ClozeQuestion } from '../../types/ioe.ts';
import { soundEngine } from '../../audio/soundEngine.ts';
import { speakEnglish } from '../../utils/speech.ts';

interface ContextClozeRoundProps {
  question: ClozeQuestion;
  onSuccess: (earnedScore: number) => void;
  onFail: (selectedOption: string) => void;
  onTimeout: () => void;
  combo: number;
}

export const ContextClozeRound: React.FC<ContextClozeRoundProps> = ({
  question,
  onSuccess,
  onFail,
  onTimeout,
  combo,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // Setup on question change
  useEffect(() => {
    setSelectedIndex(null);
    setIsAnswered(false);
    setTimeLeft(30);
  }, [question]);

  // Timer countdown
  useEffect(() => {
    if (isAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          soundEngine.playBuzzerSound();
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswered, onTimeout]);

  // Handle option selection
  const handleSelectOption = useCallback(
    (index: number) => {
      if (isAnswered) return;

      setSelectedIndex(index);
      setIsAnswered(true);

      const isCorrect = index === question.correctIndex;
      const chosenWord = question.options[index];

      if (isCorrect) {
        soundEngine.playVictorySound();
        speakEnglish(chosenWord);

        const baseScore = 150;
        const timeBonus = timeLeft * 5;
        const comboBonus = (combo || 1) * 30;
        const totalScore = baseScore + timeBonus + comboBonus;

        setTimeout(() => {
          onSuccess(totalScore);
        }, 1500);
      } else {
        soundEngine.playBuzzerSound();
        speakEnglish(question.options[question.correctIndex]);
        onFail(chosenWord);
      }
    },
    [isAnswered, question.correctIndex, question.options, timeLeft, combo, onSuccess, onFail]
  );

  // Keyboard shortcut listener (1, 2, 3, 4 or A, B, C, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered) return;

      const key = e.key.toUpperCase();
      let index = -1;

      if (key === '1' || key === 'A') index = 0;
      else if (key === '2' || key === 'B') index = 1;
      else if (key === '3' || key === 'C') index = 2;
      else if (key === '4' || key === 'D') index = 3;

      if (index >= 0 && index < question.options.length) {
        e.preventDefault();
        handleSelectOption(index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, question.options.length, handleSelectOption]);

  const timerPercent = Math.max(0, Math.min(100, (timeLeft / 30) * 100));
  const timerColor = timeLeft > 10 ? 'bg-amber-400' : 'bg-red-500 animate-pulse';

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Round Header & Context */}
      <div className="w-full pixel-frame-brown p-5 mb-5 shadow-2xl bg-amber-950/40 text-amber-100">
        <div className="flex items-center justify-between border-b border-amber-800/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-pixel bg-amber-500 text-stone-950 rounded shadow">
              ROUND 4
            </span>
            <h2 className="text-sm font-pixel text-amber-300">
              CONTEXT MASTERY / ĐIỀN KHUYẾT NGỮ CẢNH
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-pixel text-amber-400">⏱️ {timeLeft}s</span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-amber-900/60 mb-4">
          <div
            className={`h-full transition-all duration-300 ${timerColor}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Sentence Prompt */}
        <div className="space-y-3 bg-stone-900/80 p-5 rounded-lg border border-amber-800/40">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700">
              {question.pos}
            </span>
            <span className="text-sm font-semibold text-emerald-300">
              Nghĩa: <span className="text-amber-200">{question.meaning}</span>
            </span>
          </div>

          <div className="text-base sm:text-lg text-stone-200 leading-relaxed font-serif bg-stone-950/70 p-4 rounded border border-stone-800">
            &ldquo;{question.sentenceWithBlank}&rdquo;
          </div>

          {isAnswered && (
            <div className="mt-3 p-3 bg-stone-950/90 rounded border border-amber-600/40 text-xs sm:text-sm text-stone-300 whitespace-pre-line animate-fadeIn">
              <span className="text-amber-400 font-pixel text-xs block mb-1">📖 GIẢI THÍCH CHI TIẾT:</span>
              {question.explanation}
            </div>
          )}
        </div>
      </div>

      {/* 4 Distractor Options */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {question.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === question.correctIndex;

          let btnClass = 'bg-stone-900 border-2 border-stone-750 text-stone-200 hover:border-amber-400 hover:bg-stone-850';

          if (isAnswered) {
            if (isCorrect) {
              btnClass = 'bg-emerald-950 border-2 border-emerald-400 text-emerald-200 shadow-emerald-500/30 shadow-lg';
            } else if (isSelected) {
              btnClass = 'bg-red-950 border-2 border-red-500 text-red-200 animate-shake';
            } else {
              btnClass = 'bg-stone-950/50 border-stone-800 text-stone-500 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswered}
              className={`p-4 rounded-lg flex items-center justify-between text-left transition-all duration-150 select-none cursor-pointer ${btnClass}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-stone-950 border border-stone-700 flex items-center justify-center font-pixel text-xs text-amber-400">
                  {optionLetters[idx]}
                </span>
                <span className="font-semibold text-base sm:text-lg">
                  {option}
                </span>
              </div>

              {isAnswered && isCorrect && (
                <span className="text-emerald-400 font-pixel text-xs">✓ ĐÚNG</span>
              )}
              {isAnswered && isSelected && !isCorrect && (
                <span className="text-red-400 font-pixel text-xs">✗ SAI</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
