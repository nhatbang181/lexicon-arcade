import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../audio/soundEngine.ts';

interface IOERoundSummaryProps {
  score: number;
  maxCombo: number;
  heartsRemaining: number;
  totalWordsLearned: number;
  realmName: string;
  isVictory: boolean;
  onPlayAgain: () => void;
  onNextRealm: () => void;
  onOpenMistakes: () => void;
  mistakeCount: number;
}

export const IOERoundSummary: React.FC<IOERoundSummaryProps> = ({
  score,
  maxCombo,
  heartsRemaining,
  totalWordsLearned,
  realmName,
  isVictory,
  onPlayAgain,
  onNextRealm,
  onOpenMistakes,
  mistakeCount,
}) => {
  useEffect(() => {
    if (isVictory) {
      soundEngine.playLevelUpSound();
      // Burst confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      const timer = setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      soundEngine.playDefeatSound();
    }
  }, [isVictory]);

  const getMedalInfo = () => {
    if (!isVictory) return null;
    if (heartsRemaining === 3) {
      return {
        badge: '🥇',
        title: 'HUY CHƯƠNG VÀNG OLYMPIC',
        desc: 'Hoàn hảo không mất mạng nào! IELTS 8.0 Master!',
        color: 'text-amber-300',
      };
    }
    if (heartsRemaining === 2) {
      return {
        badge: '🥈',
        title: 'HUY CHƯƠNG BẠC',
        desc: 'Xuất sắc! Vượt qua cả 4 chặng thử thách khắt khe!',
        color: 'text-slate-300',
      };
    }
    return {
      badge: '🥉',
      title: 'HUY CHƯƠNG ĐỒNG',
      desc: 'Chiến thắng kiên cường ở những giây phút cuối!',
      color: 'text-amber-600',
    };
  };

  const medal = getMedalInfo();

  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-6 pixel-frame-brown bg-stone-900/95 text-stone-100 shadow-2xl flex flex-col items-center select-none">
      {/* Result Title */}
      <div className="text-center mb-6">
        <span className="text-xs font-pixel text-amber-400/90 uppercase tracking-widest block mb-2">
          {realmName}
        </span>
        <h1
          className={`text-2xl sm:text-3xl font-pixel uppercase tracking-wide ${
            isVictory ? 'text-amber-300 animate-bounce' : 'text-red-400'
          }`}
        >
          {isVictory ? '🏆 CHINH PHỤC THÀNH CÔNG!' : '💀 HẾT MẠNG RỒI!'}
        </h1>
      </div>

      {/* Medal Presentation */}
      {isVictory && medal && (
        <div className="w-full bg-stone-950/80 p-5 rounded-xl border-2 border-amber-500/50 flex flex-col items-center text-center mb-6">
          <span className="text-5xl sm:text-6xl mb-2 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
            {medal.badge}
          </span>
          <h3 className={`text-base sm:text-lg font-pixel ${medal.color} mb-1`}>
            {medal.title}
          </h3>
          <p className="text-xs sm:text-sm text-stone-300">{medal.desc}</p>
        </div>
      )}

      {/* Performance Stats */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-stone-950/70 p-3 rounded-lg border border-stone-800 text-center">
          <div className="text-[10px] font-mono text-stone-400 mb-1">TỔNG ĐIỂM</div>
          <div className="text-lg font-pixel text-amber-300">{score.toLocaleString()}</div>
        </div>

        <div className="bg-stone-950/70 p-3 rounded-lg border border-stone-800 text-center">
          <div className="text-[10px] font-mono text-stone-400 mb-1">COMBO CAO NHẤT</div>
          <div className="text-lg font-pixel text-orange-400">x{maxCombo}</div>
        </div>

        <div className="bg-stone-950/70 p-3 rounded-lg border border-stone-800 text-center">
          <div className="text-[10px] font-mono text-stone-400 mb-1">TIM CÒN LẠI</div>
          <div className="text-lg font-pixel text-red-400">
            {heartsRemaining}/3 ❤️
          </div>
        </div>

        <div className="bg-stone-950/70 p-3 rounded-lg border border-stone-800 text-center">
          <div className="text-[10px] font-mono text-stone-400 mb-1">TỪ ĐÃ THỰC HÀNH</div>
          <div className="text-lg font-pixel text-emerald-400">{totalWordsLearned}</div>
        </div>
      </div>

      {/* Mistake Reminder if any */}
      {mistakeCount > 0 && (
        <div className="w-full bg-red-950/40 border border-red-800/60 p-3.5 rounded-lg mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div className="text-xs text-red-200">
              Có <span className="font-bold text-amber-300">{mistakeCount}</span> từ chưa nhớ.
              Hệ thống đã lưu vào Sổ tay để bạn ôn tập.
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenMistakes}
            className="pixel-btn-yellow px-3 py-1.5 text-[10px] whitespace-nowrap"
          >
            XEM NGAY
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        {isVictory ? (
          <>
            <button
              type="button"
              onClick={onNextRealm}
              className="pixel-btn-green px-5 py-2.5 text-xs flex items-center gap-2"
            >
              <span>CHỦ ĐỀ TIẾP THEO</span>
              <span>▶</span>
            </button>
            <button
              type="button"
              onClick={onPlayAgain}
              className="pixel-btn-blue px-4 py-2.5 text-xs"
            >
              CHƠI LẠI VÒNG NÀY
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onPlayAgain}
              className="pixel-btn-yellow px-5 py-2.5 text-xs flex items-center gap-2"
            >
              <span>↺</span>
              <span>THỬ LẠI NGAY</span>
            </button>
            <button
              type="button"
              onClick={onNextRealm}
              className="pixel-btn-red px-4 py-2.5 text-xs"
            >
              ĐỔI CHỦ ĐỀ KHÁC
            </button>
          </>
        )}
      </div>
    </div>
  );
};
