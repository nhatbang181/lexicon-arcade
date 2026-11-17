import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { AudioQuestion } from '../../types/ioe.ts';
import { soundEngine } from '../../audio/soundEngine.ts';
import { speakEnglish } from '../../utils/speech.ts';

interface AudioListeningRoundProps {
  question: AudioQuestion;
  onSuccess: (earnedScore: number) => void;
  onFail: (failedAnswer: string) => void;
  onTimeout: () => void;
  combo: number;
}

export const AudioListeningRound: React.FC<AudioListeningRoundProps> = ({
  question,
  onSuccess,
  onFail,
  onTimeout,
  combo,
}) => {
  const [userInput, setUserInput] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showIpaHint, setShowIpaHint] = useState<boolean>(false);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const inputRef = useRef<HTMLInputElement>(null);

  // Play audio helper
  const playAudio = useCallback(async (rate = 0.9) => {
    setIsPlayingAudio(true);
    await speakEnglish(question.audioText, rate);
    setIsPlayingAudio(false);
  }, [question.audioText]);

  // Initial setup & auto-play
  useEffect(() => {
    setUserInput('');
    setShowIpaHint(false);
    setIsAnswered(false);
    setIsError(false);
    setTimeLeft(30);

    // Auto play audio after 400ms
    const timer = setTimeout(() => {
      playAudio(0.9);
      inputRef.current?.focus();
    }, 400);

    return () => clearTimeout(timer);
  }, [question, playAudio]);

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

  // Submit answer
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (isAnswered || !userInput.trim()) return;

      const cleanInput = userInput.trim().toLowerCase();
      const cleanTarget = question.correctAnswer.toLowerCase();

      if (cleanInput === cleanTarget) {
        // Correct!
        setIsAnswered(true);
        soundEngine.playVictorySound();
        speakEnglish(question.audioText);

        const baseScore = 120;
        const timeBonus = timeLeft * 4;
        const comboBonus = (combo || 1) * 25;
        const hintPenalty = showIpaHint ? 20 : 0;
        const totalScore = Math.max(50, baseScore + timeBonus + comboBonus - hintPenalty);

        setTimeout(() => {
          onSuccess(totalScore);
        }, 1300);
      } else {
        // Incorrect
        setIsError(true);
        soundEngine.playBuzzerSound();
        setTimeout(() => setIsError(false), 700);
        onFail(userInput.trim());
      }
    },
    [userInput, question.correctAnswer, question.audioText, isAnswered, timeLeft, combo, showIpaHint, onSuccess, onFail]
  );

  const timerPercent = Math.max(0, Math.min(100, (timeLeft / 30) * 100));
  const timerColor = timeLeft > 10 ? 'bg-amber-400' : 'bg-red-500 animate-pulse';

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Round Header & Clues */}
      <div className="w-full pixel-frame-brown p-5 mb-5 shadow-2xl bg-amber-950/40 text-amber-100">
        <div className="flex items-center justify-between border-b border-amber-800/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-pixel bg-amber-500 text-stone-950 rounded shadow">
              ROUND 3
            </span>
            <h2 className="text-sm font-pixel text-amber-300">
              AUDIO OBSTACLE / NGHE VÀ ĐIỀN TỪ
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

        {/* Audio Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-4 bg-stone-950/70 rounded-lg border border-amber-800/40 mb-4">
          <button
            type="button"
            onClick={() => playAudio(0.9)}
            disabled={isPlayingAudio}
            className={`pixel-btn-yellow px-5 py-2.5 text-xs flex items-center gap-2 ${
              isPlayingAudio ? 'animate-pulse' : ''
            }`}
          >
            <span>🔊</span>
            <span>{isPlayingAudio ? 'ĐANG PHÁT...' : 'NGHE PHÁT ÂM (1.0x)'}</span>
          </button>

          <button
            type="button"
            onClick={() => playAudio(0.7)}
            disabled={isPlayingAudio}
            className="pixel-btn-blue px-4 py-2 text-xs flex items-center gap-2"
          >
            <span>🐢</span>
            <span>NGHE CHẬM (0.7x)</span>
          </button>

          {!showIpaHint && (
            <button
              type="button"
              onClick={() => setShowIpaHint(true)}
              className="text-xs font-pixel text-amber-400/80 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
            >
              [ 💡 XEM PHIÊN ÂM IPA ]
            </button>
          )}
        </div>

        {/* Clues */}
        <div className="space-y-3 bg-stone-900/80 p-4 rounded-lg border border-amber-800/40">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700">
              {question.pos}
            </span>
            <span className="text-xs text-stone-400 font-mono">
              [ {question.correctAnswer.length} chữ cái ]
            </span>
            {(showIpaHint || isAnswered) && (
              <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700">
                IPA: {question.ipa}
              </span>
            )}
          </div>

          <div className="text-base sm:text-lg font-semibold text-emerald-300">
            Nghĩa tiếng Việt: <span className="text-amber-200">{question.meaning}</span>
          </div>

          {question.sentenceWithBlank && (
            <div className="text-xs sm:text-sm text-stone-300 italic bg-stone-950/60 p-2.5 rounded border border-stone-800 leading-relaxed">
              &ldquo;{question.sentenceWithBlank}&rdquo;
            </div>
          )}
        </div>
      </div>

      {/* Answer Form */}
      <form
        onSubmit={handleSubmit}
        className={`w-full pixel-frame-grey p-5 flex flex-col sm:flex-row items-center gap-4 bg-stone-900/90 transition-transform ${
          isError ? 'animate-shake border-red-500' : ''
        } ${isAnswered ? 'border-emerald-500 shadow-emerald-500/20 shadow-lg' : ''}`}
      >
        <div className="w-full relative">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isAnswered}
            placeholder="Gõ từ bạn nghe được..."
            className="w-full px-4 py-3 bg-stone-950 text-amber-200 font-mono text-lg rounded-lg border-2 border-stone-700 focus:border-amber-400 focus:outline-none placeholder:text-stone-600"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {isAnswered && (
            <span className="absolute right-3 top-3 text-emerald-400 font-pixel text-xs">
              ✓ ĐÚNG!
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isAnswered || !userInput.trim()}
          className="w-full sm:w-auto pixel-btn-green px-6 py-3 text-xs flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>XÁC NHẬN</span>
          <span>↵</span>
        </button>
      </form>
    </div>
  );
};
