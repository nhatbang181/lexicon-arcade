import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { MatchingRoundData, MatchingCard } from '../../types/ioe.ts';
import { soundEngine } from '../../audio/soundEngine.ts';
import { speakEnglish } from '../../utils/speech.ts';

interface MatchingPairsRoundProps {
  data: MatchingRoundData;
  onSuccess: (earnedScore: number) => void;
  onFail: (errorInfo: string) => void;
  onTimeout: () => void;
  combo: number;
}

export const MatchingPairsRound: React.FC<MatchingPairsRoundProps> = ({
  data,
  onSuccess,
  onFail: _onFail,
  onTimeout,
  combo,
}) => {
  const [selectedLeft, setSelectedLeft] = useState<MatchingCard | null>(null);
  const [selectedRight, setSelectedRight] = useState<MatchingCard | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set());
  const [mismatchedPair, setMismatchedPair] = useState<{ leftId: string; rightId: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [roundCompleted, setRoundCompleted] = useState<boolean>(false);

  // Split cards into Left Side (Part 1) and Right Side (Part 2), shuffle right side
  const { leftCards, rightCards } = useMemo(() => {
    const lefts: MatchingCard[] = [];
    const rights: MatchingCard[] = [];

    data.cards.forEach((card) => {
      if (card.id.endsWith('_A')) {
        lefts.push(card);
      } else {
        rights.push(card);
      }
    });

    // Shuffle rights so they don't align directly opposite their pairs
    const shuffledRights = [...rights].sort(() => 0.5 - Math.random());
    return { leftCards: lefts, rightCards: shuffledRights };
  }, [data]);

  // Reset state on data change
  useEffect(() => {
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedPairIds(new Set());
    setMismatchedPair(null);
    setTimeLeft(45);
    setRoundCompleted(false);
  }, [data]);

  // Timer countdown (45 seconds)
  useEffect(() => {
    if (roundCompleted) return;

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
  }, [roundCompleted, onTimeout]);

  // Evaluate match when both sides are selected
  const evaluateMatch = useCallback(
    (left: MatchingCard, right: MatchingCard) => {
      if (left.pairId === right.pairId) {
        // MATCH!
        soundEngine.playCoinSound();
        if (left.type !== 'meaning' && right.type !== 'meaning') {
          speakEnglish(`${left.text} ${right.text}`);
        }

        const newMatched = new Set(matchedPairIds);
        newMatched.add(left.pairId);
        setMatchedPairIds(newMatched);
        setSelectedLeft(null);
        setSelectedRight(null);

        // Check if all pairs cleared
        if (newMatched.size >= data.totalPairs) {
          setRoundCompleted(true);
          soundEngine.playVictorySound();
          const baseScore = 200;
          const timeBonus = timeLeft * 4;
          const comboBonus = (combo || 1) * 30;
          const totalScore = baseScore + timeBonus + comboBonus;

          setTimeout(() => {
            onSuccess(totalScore);
          }, 1200);
        }
      } else {
        // MISMATCH - Fair mechanics: NO heart penalty!
        // Just resets combo and briefly flashes red
        soundEngine.playBuzzerSound();
        setMismatchedPair({ leftId: left.id, rightId: right.id });

        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
          setMismatchedPair(null);
        }, 500);
      }
    },
    [matchedPairIds, data.totalPairs, timeLeft, combo, onSuccess]
  );

  // Click handler for left side
  const handleLeftClick = (card: MatchingCard) => {
    if (matchedPairIds.has(card.pairId) || mismatchedPair || roundCompleted) return;

    soundEngine.playAttackSound();
    setSelectedLeft(card);

    if (selectedRight) {
      evaluateMatch(card, selectedRight);
    }
  };

  // Click handler for right side
  const handleRightClick = (card: MatchingCard) => {
    if (matchedPairIds.has(card.pairId) || mismatchedPair || roundCompleted) return;

    soundEngine.playAttackSound();
    setSelectedRight(card);

    if (selectedLeft) {
      evaluateMatch(selectedLeft, card);
    }
  };

  const timerPercent = Math.max(0, Math.min(100, (timeLeft / 45) * 100));
  const timerColor = timeLeft > 12 ? 'bg-amber-400' : 'bg-red-500 animate-pulse';

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Round Header */}
      <div className="w-full pixel-frame-brown p-5 mb-5 shadow-2xl bg-amber-950/40 text-amber-100">
        <div className="flex items-center justify-between border-b border-amber-800/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-pixel bg-amber-500 text-stone-950 rounded shadow">
              ROUND 2
            </span>
            <h2 className="text-sm font-arcade font-bold text-amber-300 tracking-wide">
              COLLOCATION LINK / NỐI CẶP TỪ
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-arcade font-bold text-emerald-400">
              Đã nối: {matchedPairIds.size}/{data.totalPairs}
            </span>
            <span className="text-xs font-pixel text-amber-400">⏱️ {timeLeft}s</span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-amber-900/60 mb-3">
          <div
            className={`h-full transition-all duration-300 ${timerColor}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        <div className="text-xs text-stone-300 bg-stone-900/80 p-3 rounded border border-amber-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">💡 Hướng dẫn:</span>
            <span>Chọn 1 thẻ ở Cột Trái và 1 thẻ tương ứng ở Cột Phải để ghép cặp Collocation / Đồng nghĩa.</span>
          </div>
          <span className="font-arcade text-xs text-amber-300 hidden sm:inline">x{combo || 1} COMBO</span>
        </div>
      </div>

      {/* 2-Column Matching Board */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Left Column (Part 1 / Root Word) */}
        <div className="space-y-3">
          <div className="text-xs font-arcade font-bold text-amber-300/90 text-center tracking-wider mb-2">
            CỘT TRÁI (VẾ 1)
          </div>

          {leftCards.map((card, idx) => {
            const isMatched = matchedPairIds.has(card.pairId);
            const isSelected = selectedLeft?.id === card.id;
            const isMismatched = mismatchedPair?.leftId === card.id;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleLeftClick(card)}
                disabled={isMatched || roundCompleted}
                className={`w-full min-h-[58px] p-3.5 rounded-lg flex items-center justify-between text-left transition-all duration-150 select-none ${
                  isMatched
                    ? 'bg-emerald-950/70 border-2 border-emerald-500/80 text-emerald-200 opacity-60 cursor-default scale-98'
                    : isMismatched
                    ? 'bg-red-950/90 border-2 border-red-500 text-red-200 animate-shake'
                    : isSelected
                    ? 'bg-amber-400 text-stone-950 border-2 border-amber-200 shadow-amber-400/40 shadow-lg scale-102 font-bold'
                    : 'bg-stone-900 border-2 border-stone-700 hover:border-amber-400/80 hover:bg-stone-850 text-stone-100 cursor-pointer active:scale-98'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded flex items-center justify-center font-mono text-xs font-bold ${
                      isSelected
                        ? 'bg-stone-950 text-amber-300'
                        : isMatched
                        ? 'bg-emerald-900 text-emerald-300'
                        : 'bg-stone-950 border border-stone-700 text-stone-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm sm:text-base font-semibold">
                    {card.text}
                  </span>
                </div>

                {isMatched ? (
                  <span className="text-xs font-arcade font-bold text-emerald-400">✓ ĐÃ GHÉP</span>
                ) : isSelected ? (
                  <span className="text-[10px] font-arcade font-bold bg-stone-950 px-2 py-0.5 rounded text-amber-300">
                    ĐANG CHỌN
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-950/80 text-stone-400 border border-stone-800">
                    {card.categoryLabel || 'Từ'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column (Part 2 / Matching Partner) */}
        <div className="space-y-3">
          <div className="text-xs font-arcade font-bold text-amber-300/90 text-center tracking-wider mb-2">
            CỘT PHẢI (VẾ 2 ĐỐI ỨNG)
          </div>

          {rightCards.map((card, idx) => {
            const isMatched = matchedPairIds.has(card.pairId);
            const isSelected = selectedRight?.id === card.id;
            const isMismatched = mismatchedPair?.rightId === card.id;
            const letter = String.fromCharCode(65 + idx); // A, B, C, D...

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleRightClick(card)}
                disabled={isMatched || roundCompleted}
                className={`w-full min-h-[58px] p-3.5 rounded-lg flex items-center justify-between text-left transition-all duration-150 select-none ${
                  isMatched
                    ? 'bg-emerald-950/70 border-2 border-emerald-500/80 text-emerald-200 opacity-60 cursor-default scale-98'
                    : isMismatched
                    ? 'bg-red-950/90 border-2 border-red-500 text-red-200 animate-shake'
                    : isSelected
                    ? 'bg-amber-400 text-stone-950 border-2 border-amber-200 shadow-amber-400/40 shadow-lg scale-102 font-bold'
                    : 'bg-stone-900 border-2 border-stone-700 hover:border-amber-400/80 hover:bg-stone-850 text-stone-100 cursor-pointer active:scale-98'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded flex items-center justify-center font-mono text-xs font-bold ${
                      isSelected
                        ? 'bg-stone-950 text-amber-300'
                        : isMatched
                        ? 'bg-emerald-900 text-emerald-300'
                        : 'bg-stone-950 border border-stone-700 text-stone-400'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm sm:text-base font-semibold">
                    {card.text}
                  </span>
                </div>

                {isMatched ? (
                  <span className="text-xs font-arcade font-bold text-emerald-400">✓ ĐÃ GHÉP</span>
                ) : isSelected ? (
                  <span className="text-[10px] font-arcade font-bold bg-stone-950 px-2 py-0.5 rounded text-amber-300">
                    ĐANG CHỌN
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-950/80 text-stone-400 border border-stone-800">
                    {card.categoryLabel || 'Cặp'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
