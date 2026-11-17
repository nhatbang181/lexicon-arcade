import React, { useState, useEffect, useCallback } from 'react';
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
  onFail,
  onTimeout,
  combo,
}) => {
  const [cards, setCards] = useState<MatchingCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set());
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [mismatchedIds, setMismatchedIds] = useState<string[]>([]);
  const [roundCompleted, setRoundCompleted] = useState<boolean>(false);

  // Initialize cards
  useEffect(() => {
    setCards(data.cards);
    setFlippedIds([]);
    setMatchedPairIds(new Set());
    setIsEvaluating(false);
    setTimeLeft(60);
    setMismatchedIds([]);
    setRoundCompleted(false);
  }, [data]);

  // Timer countdown
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

  // Card click handler
  const handleCardClick = useCallback(
    (card: MatchingCard) => {
      if (isEvaluating || roundCompleted) return;
      // Cannot click if already matched or currently flipped
      if (matchedPairIds.has(card.pairId) || flippedIds.includes(card.id)) return;

      soundEngine.playAttackSound();
      const newFlipped = [...flippedIds, card.id];
      setFlippedIds(newFlipped);

      // If this is the second card flipped, evaluate match
      if (newFlipped.length === 2) {
        setIsEvaluating(true);
        const [firstId, secondId] = newFlipped;
        const firstCard = cards.find((c) => c.id === firstId);
        const secondCard = cards.find((c) => c.id === secondId);

        if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
          // MATCH!
          soundEngine.playCoinSound();
          if (firstCard.type !== 'meaning') {
            speakEnglish(`${firstCard.text} ${secondCard.text}`);
          }

          const newMatched = new Set(matchedPairIds);
          newMatched.add(firstCard.pairId);
          setMatchedPairIds(newMatched);
          setFlippedIds([]);
          setIsEvaluating(false);

          // Check if all pairs matched
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
          // MISMATCH!
          soundEngine.playBuzzerSound();
          setMismatchedIds([firstId, secondId]);
          onFail(`${firstCard?.text || ''} ≠ ${secondCard?.text || ''}`);

          setTimeout(() => {
            setFlippedIds([]);
            setMismatchedIds([]);
            setIsEvaluating(false);
          }, 900);
        }
      }
    },
    [isEvaluating, roundCompleted, matchedPairIds, flippedIds, cards, data.totalPairs, timeLeft, combo, onSuccess, onFail]
  );

  const timerPercent = Math.max(0, Math.min(100, (timeLeft / 60) * 100));
  const timerColor = timeLeft > 15 ? 'bg-amber-400' : 'bg-red-500 animate-pulse';

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
              MATCHING PAIRS / CẶP BÀI TRÙNG
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-arcade font-bold text-emerald-400">
              Ghép: {matchedPairIds.size}/{data.totalPairs}
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

        <div className="text-xs text-stone-300 bg-stone-900/80 p-2.5 rounded border border-amber-800/40 flex items-center justify-between">
          <span>Tìm các cặp tương ứng: Collocations (cụm đi cùng nhau) hoặc Từ đồng nghĩa (Synonyms)</span>
          <span className="font-mono text-amber-300">Combo hiện tại: x{combo || 1}</span>
        </div>
      </div>

      {/* 12-Card Grid */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {cards.map((card) => {
          const isMatched = matchedPairIds.has(card.pairId);
          const isFlipped = flippedIds.includes(card.id) || isMatched;
          const isError = mismatchedIds.includes(card.id);

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card)}
              disabled={isMatched || isEvaluating}
              className={`min-h-[110px] sm:min-h-[125px] p-3 rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 select-none relative shadow-lg ${
                isMatched
                  ? 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 opacity-90 scale-95'
                  : isFlipped
                  ? isError
                    ? 'bg-red-950/90 border-2 border-red-500 text-red-200 animate-shake'
                    : 'bg-stone-800 border-2 border-amber-400 text-amber-200 scale-102 shadow-amber-400/20 shadow-xl'
                  : 'bg-stone-900 border-2 border-stone-700 hover:border-amber-500/70 hover:bg-stone-850 cursor-pointer active:scale-95'
              }`}
            >
              {isFlipped ? (
                <>
                  {card.categoryLabel && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-950/70 text-amber-400/80 mb-1 border border-stone-800">
                      {card.categoryLabel}
                    </span>
                  )}
                  <span className="text-sm sm:text-base font-semibold leading-snug break-words">
                    {card.text}
                  </span>
                  {isMatched && (
                    <span className="text-xs text-emerald-400 font-pixel mt-1">✓ MATCH</span>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-2xl text-amber-500/70 font-pixel">?</span>
                  <span className="text-[10px] text-stone-500 font-mono">BẤM LẬT THẺ</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
