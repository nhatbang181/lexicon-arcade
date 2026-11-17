import React, { useState, useEffect, useCallback, useTransition } from 'react';
import type { ScrambleQuestion } from '../../types/ioe.ts';
import { soundEngine } from '../../audio/soundEngine.ts';
import { speakEnglish } from '../../utils/speech.ts';

interface WordScrambleRoundProps {
  question: ScrambleQuestion;
  onSuccess: (earnedScore: number) => void;
  onFail: (failedWord: string) => void;
  onTimeout: () => void;
  combo: number;
}

interface TileItem {
  id: string;
  char: string;
  originalIndex: number;
}

export const WordScrambleRound: React.FC<WordScrambleRoundProps> = ({
  question,
  onSuccess,
  onFail,
  onTimeout,
  combo,
}) => {
  const [, startTransition] = useTransition();

  // Initialize available tiles and selected tiles
  const [availableTiles, setAvailableTiles] = useState<TileItem[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<TileItem[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // Setup tiles when question changes
  useEffect(() => {
    const tiles: TileItem[] = question.scrambledLetters.map((char, index) => ({
      id: `tile_${index}_${char}`,
      char,
      originalIndex: index,
    }));
    startTransition(() => {
      setAvailableTiles(tiles);
      setSelectedTiles([]);
      setIsAnswered(false);
      setIsError(false);
      setTimeLeft(30);
    });
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

  // Handle letter check
  const checkAnswer = useCallback(
    (currentSelected: TileItem[]) => {
      const userWord = currentSelected.map((t) => t.char).join('');
      const targetWord = question.originalWord;

      if (userWord.toLowerCase() === targetWord.toLowerCase()) {
        // Correct answer!
        setIsAnswered(true);
        soundEngine.playVictorySound();
        speakEnglish(targetWord);

        const baseScore = 100;
        const timeBonus = timeLeft * 5;
        const comboBonus = (combo || 1) * 20;
        const totalScore = baseScore + timeBonus + comboBonus;

        setTimeout(() => {
          onSuccess(totalScore);
        }, 1300);
      } else {
        // Wrong answer
        setIsError(true);
        soundEngine.playBuzzerSound();
        setTimeout(() => setIsError(false), 600);
        onFail(userWord);
      }
    },
    [question.originalWord, timeLeft, combo, onSuccess, onFail]
  );

  // Pick tile from available bank
  const handleSelectTile = useCallback(
    (tile: TileItem) => {
      if (isAnswered) return;
      soundEngine.playCoinSound();

      const newAvailable = availableTiles.filter((t) => t.id !== tile.id);
      const newSelected = [...selectedTiles, tile];

      setAvailableTiles(newAvailable);
      setSelectedTiles(newSelected);

      // If word is fully formed, verify answer
      if (newSelected.length === question.originalWord.length) {
        checkAnswer(newSelected);
      }
    },
    [availableTiles, selectedTiles, isAnswered, question.originalWord.length, checkAnswer]
  );

  // Remove tile from answer slot back to bank
  const handleDeselectTile = useCallback(
    (tile: TileItem) => {
      if (isAnswered) return;
      soundEngine.playAttackSound();

      setSelectedTiles((prev) => prev.filter((t) => t.id !== tile.id));
      setAvailableTiles((prev) => [...prev, tile]);
    },
    [isAnswered]
  );

  // Backspace last placed tile
  const handleBackspace = useCallback(() => {
    if (isAnswered || selectedTiles.length === 0) return;
    const lastTile = selectedTiles[selectedTiles.length - 1];
    handleDeselectTile(lastTile);
  }, [isAnswered, selectedTiles, handleDeselectTile]);

  // Reset all tiles
  const handleReset = useCallback(() => {
    if (isAnswered) return;
    soundEngine.playAttackSound();
    const allTiles: TileItem[] = question.scrambledLetters.map((char, index) => ({
      id: `tile_${index}_${char}`,
      char,
      originalIndex: index,
    }));
    setAvailableTiles(allTiles);
    setSelectedTiles([]);
  }, [isAnswered, question.scrambledLetters]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleReset();
        return;
      }

      const key = e.key.toLowerCase();
      // Match a character available in bank
      const matchingTile = availableTiles.find(
        (t) => t.char.toLowerCase() === key
      );

      if (matchingTile) {
        e.preventDefault();
        handleSelectTile(matchingTile);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [availableTiles, isAnswered, handleBackspace, handleReset, handleSelectTile]);

  // Percentage for timer bar
  const timerPercent = Math.max(0, Math.min(100, (timeLeft / 30) * 100));
  const timerColor = timeLeft > 10 ? 'bg-amber-400' : 'bg-red-500 animate-pulse';

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Round Header & Clues */}
      <div className="w-full pixel-frame-brown p-5 mb-5 shadow-2xl bg-amber-950/40 text-amber-100">
        <div className="flex items-center justify-between border-b border-amber-800/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-pixel bg-amber-500 text-stone-950 rounded shadow">
              ROUND 1
            </span>
            <h2 className="text-sm font-pixel text-amber-300">
              DEFEAT THE WORD / SẮP XẾP KÝ TỰ
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

        {/* Linguistic Clues */}
        <div className="space-y-3 bg-stone-900/80 p-4 rounded-lg border border-amber-800/40">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700">
              {question.pos}
            </span>
            <span className="text-xs text-stone-400 font-mono">
              [ {question.originalWord.length} chữ cái ]
            </span>
            {isAnswered && (
              <span className="text-xs text-emerald-400 font-mono font-bold animate-bounce">
                IPA: {question.ipa}
              </span>
            )}
          </div>

          <div className="text-base sm:text-lg font-semibold text-emerald-300">
            Nghĩa tiếng Việt: <span className="text-amber-200">{question.meaning}</span>
          </div>

          {question.maskedSentence && (
            <div className="text-xs sm:text-sm text-stone-300 italic bg-stone-950/60 p-2.5 rounded border border-stone-800 leading-relaxed">
              &ldquo;{question.maskedSentence}&rdquo;
            </div>
          )}
        </div>
      </div>

      {/* Answer Slots Display */}
      <div
        className={`w-full pixel-frame-grey p-5 mb-5 flex flex-col items-center bg-stone-900/90 transition-transform ${
          isError ? 'animate-shake border-red-500' : ''
        } ${isAnswered ? 'border-emerald-500 shadow-emerald-500/20 shadow-lg' : ''}`}
      >
        <div className="text-xs font-pixel text-stone-400 mb-3 uppercase tracking-wider">
          {isAnswered ? '✓ CHÍNH XÁC!' : 'Ô ĐIỀN TỪ (Gõ phím hoặc bấm ô)'}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 min-h-[58px] p-2 bg-stone-950/80 rounded-lg border border-stone-800 w-full">
          {Array.from({ length: question.originalWord.length }).map((_, idx) => {
            const tile = selectedTiles[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => tile && handleDeselectTile(tile)}
                className={`w-11 h-12 sm:w-12 sm:h-14 flex items-center justify-center text-lg sm:text-xl font-pixel rounded transition-all select-none ${
                  tile
                    ? isAnswered
                      ? 'bg-emerald-600 text-white border-2 border-emerald-300 shadow-md'
                      : 'bg-amber-400 text-stone-950 border-2 border-amber-300 shadow-md hover:bg-amber-300 cursor-pointer active:scale-95'
                    : 'bg-stone-800/80 text-stone-600 border border-stone-700/50'
                }`}
                title={tile ? 'Bấm để trả lại' : undefined}
              >
                {tile ? tile.char.toUpperCase() : '_'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrambled Letter Bank */}
      <div className="w-full pixel-frame-tan p-4 mb-4 flex flex-col items-center bg-stone-900/60">
        <div className="text-xs font-pixel text-amber-200 mb-3 uppercase tracking-wider">
          KÝ TỰ KHẢ DỤNG
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 min-h-[56px] w-full">
          {availableTiles.length === 0 && !isAnswered && (
            <div className="text-xs text-stone-400 italic">
              Đã điền hết các ký tự. Đang kiểm tra...
            </div>
          )}

          {availableTiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleSelectTile(tile)}
              className="w-11 h-12 sm:w-12 sm:h-14 bg-stone-800 text-amber-300 border-2 border-amber-500/70 hover:border-amber-400 hover:bg-stone-700 active:scale-95 rounded text-lg sm:text-xl font-pixel flex items-center justify-center cursor-pointer shadow transition-all select-none"
            >
              {tile.char.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3 w-full justify-center">
        <button
          type="button"
          onClick={handleBackspace}
          disabled={selectedTiles.length === 0 || isAnswered}
          className="pixel-btn-yellow px-4 py-2 text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>⌫</span>
          <span>XÓA (Backspace)</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={selectedTiles.length === 0 || isAnswered}
          className="pixel-btn-red px-4 py-2 text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>↺</span>
          <span>LÀM LẠI (Esc)</span>
        </button>
      </div>
    </div>
  );
};
