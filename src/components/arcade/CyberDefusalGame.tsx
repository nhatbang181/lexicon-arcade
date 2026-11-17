import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { VocabWord } from '../../types/vocab.ts';
import { soundEngine } from '../../audio/soundEngine.ts';
import { 
  ShieldAlert, 
  RotateCcw, 
  Volume2, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  Zap,
  Terminal
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CyberDefusalGameProps {
  words: VocabWord[];
  realmName: string;
  onExit: () => void;
}

interface WireCircuit {
  id: number;
  name: string;
  color: string;
  bgCut: string;
  isCut: boolean;
}

const INITIAL_WIRES: WireCircuit[] = [
  { id: 1, name: 'ALPHA CABLE', color: 'from-rose-500 to-red-600', bgCut: 'border-red-900 text-red-900', isCut: false },
  { id: 2, name: 'BETA CABLE', color: 'from-cyan-400 to-blue-600', bgCut: 'border-blue-900 text-blue-900', isCut: false },
  { id: 3, name: 'GAMMA CABLE', color: 'from-emerald-400 to-green-600', bgCut: 'border-green-900 text-green-900', isCut: false },
  { id: 4, name: 'DELTA CABLE', color: 'from-amber-400 to-yellow-600', bgCut: 'border-yellow-900 text-yellow-900', isCut: false },
  { id: 5, name: 'OMEGA CABLE', color: 'from-purple-400 to-fuchsia-600', bgCut: 'border-purple-900 text-purple-900', isCut: false },
];

const QWERTY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const CyberDefusalGame: React.FC<CyberDefusalGameProps> = ({
  words,
  realmName,
  onExit,
}) => {
  // Filter clean single words
  const validWords = useMemo(
    () =>
      words.filter(
        (w) =>
          w &&
          w.word &&
          /^[a-zA-Z]{4,14}$/.test(w.word.trim()) &&
          w.meaning &&
          !/[?？]/.test(w.word)
      ),
    [words]
  );

  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wires, setWires] = useState<WireCircuit[]>(INITIAL_WIRES);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [bombsDefused, setBombsDefused] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [showIpa, setShowIpa] = useState<boolean>(false);
  const [showSentenceHint, setShowSentenceHint] = useState<boolean>(false);
  const [sparksActive, setSparksActive] = useState<boolean>(false);

  // TTS helper
  const speakWord = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Pick a new word
  const loadNewBomb = useCallback(
    (avoidWordId?: string) => {
      if (validWords.length === 0) return;
      const pool = validWords.filter((w) => w.id !== avoidWordId);
      const chosen = pool[Math.floor(Math.random() * pool.length)] || validWords[0];

      setCurrentWord(chosen);
      setGuessedLetters(new Set());
      setWires(INITIAL_WIRES.map((w) => ({ ...w, isCut: false })));
      setTimeLeft(60);
      setIsSuccess(false);
      setIsExploded(false);
      setShowIpa(false);
      setShowSentenceHint(false);
      setSparksActive(false);
    },
    [validWords]
  );

  // Mount
  useEffect(() => {
    loadNewBomb();
  }, [loadNewBomb]);

  // Timer Tick
  useEffect(() => {
    if (isSuccess || isExploded || !currentWord) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired -> Detonation!
          soundEngine.playBuzzerSound();
          setIsExploded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, isExploded, currentWord]);

  // Target word letters
  const targetLetters = useMemo(() => {
    if (!currentWord) return [];
    return currentWord.word.toUpperCase().split('');
  }, [currentWord]);

  // Distinct letters needed to win
  const uniqueLetters = useMemo(() => {
    return new Set(targetLetters);
  }, [targetLetters]);

  // Handle letter guess
  const handleGuess = useCallback(
    (letter: string) => {
      if (isSuccess || isExploded || !currentWord) return;
      const upper = letter.toUpperCase();
      if (guessedLetters.has(upper)) return;

      const nextGuessed = new Set(guessedLetters);
      nextGuessed.add(upper);
      setGuessedLetters(nextGuessed);

      // Check if letter exists in target
      if (uniqueLetters.has(upper)) {
        soundEngine.playCoinSound();

        // Check if all letters guessed
        const allGuessed = Array.from(uniqueLetters).every((ch) => nextGuessed.has(ch));
        if (allGuessed) {
          // DEFUSED!
          soundEngine.playVictorySound();
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
          speakWord(currentWord.word);

          const uncutedWires = wires.filter((w) => !w.isCut).length;
          const pointsEarned = 100 + timeLeft * 5 + uncutedWires * 40;
          setScore((s) => s + pointsEarned);
          setBombsDefused((b) => b + 1);
          setIsSuccess(true);
        }
      } else {
        // Wrong letter -> CUT A WIRE!
        soundEngine.playAttackSound();
        setSparksActive(true);
        setTimeout(() => setSparksActive(false), 400);

        setWires((prevWires) => {
          const firstIntactIndex = prevWires.findIndex((w) => !w.isCut);
          if (firstIntactIndex !== -1) {
            const nextWires = [...prevWires];
            nextWires[firstIntactIndex] = { ...nextWires[firstIntactIndex], isCut: true };

            // Check if all wires cut
            const allCut = nextWires.every((w) => w.isCut);
            if (allCut) {
              soundEngine.playBuzzerSound();
              setIsExploded(true);
            }
            return nextWires;
          }
          return prevWires;
        });
      }
    },
    [isSuccess, isExploded, currentWord, guessedLetters, uniqueLetters, wires, timeLeft, speakWord]
  );

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuccess || isExploded) return;
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleGuess(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuess, isSuccess, isExploded]);

  if (!currentWord) {
    return (
      <div className="p-8 text-center font-arcade text-amber-300">
        Đang khởi động thiết bị gỡ bom...
      </div>
    );
  }

  const remainingWires = wires.filter((w) => !w.isCut).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* Top Banner & Stats */}
      <div className="pixel-frame-brown p-4 bg-stone-900/95 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-950 border border-red-700 text-red-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-arcade font-bold text-amber-300 flex items-center gap-2">
              <span>CYBER DEFUSAL: GỠ BOM MẬT MÃ</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                DEFUSE PROTOCOL
              </span>
            </h2>
            <span className="text-[11px] font-sans text-stone-400">
              Chủ đề: <strong className="text-amber-200">{realmName}</strong>
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {/* Bomb Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${
              timeLeft <= 15
                ? 'bg-red-950 border-red-600 text-red-400 animate-pulse'
                : 'bg-stone-950 border-stone-800 text-amber-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>00:{timeLeft.toString().padStart(2, '0')}</span>
          </div>

          {/* Score & Defused Count */}
          <div className="flex items-center gap-3 bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
            <div>
              <div className="text-[9px] font-arcade text-stone-400">ĐÃ GỠ</div>
              <div className="text-sm font-arcade font-bold text-emerald-400">
                {bombsDefused} 💣
              </div>
            </div>
            <div className="border-l border-stone-800 pl-2">
              <div className="text-[9px] font-arcade text-stone-400">ĐIỂM</div>
              <div className="text-sm font-arcade font-bold text-amber-300">{score}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="pixel-btn-grey px-3 py-1.5 text-xs cursor-pointer"
          >
            THOÁT
          </button>
        </div>
      </div>

      {/* Main Terminal Screen */}
      <div
        className={`pixel-frame-grey p-5 bg-slate-950 border-2 relative overflow-hidden transition-all duration-300 ${
          sparksActive
            ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
            : isSuccess
            ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
            : 'border-cyan-800/80'
        }`}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Terminal className="w-4 h-4" />
            <span>DEFUSAL TERMINAL v2.4 // TARGET ID: {currentWord.id.slice(0, 10)}</span>
          </div>
          <div className="text-xs font-mono text-stone-400 flex items-center gap-1.5">
            <span>DÂY NGUỒN CÒN LẠI:</span>
            <span className="font-bold text-amber-300">{remainingWires} / 5</span>
          </div>
        </div>

        {/* Clue Panel: Meaning & Context */}
        <div className="bg-stone-900/90 p-4 rounded-xl border border-stone-800 mb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-arcade font-bold text-stone-400 uppercase tracking-wider block mb-1">
                TẬP LỆNH GIẢI NGHĨA (MISSION INTEL):
              </span>
              <div className="text-sm sm:text-base font-vietnam font-semibold text-emerald-300 leading-snug">
                "{currentWord.meaning}"
              </div>
              {currentWord.pos && (
                <div className="text-xs font-mono text-stone-400 mt-1">
                  Loại từ: <span className="text-cyan-300">[{currentWord.pos}]</span> · Độ dài:{' '}
                  <span className="text-amber-300">{currentWord.word.length} chữ cái</span>
                </div>
              )}
            </div>

            {/* Hint Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {!showIpa && currentWord.ipa && (
                <button
                  type="button"
                  onClick={() => setShowIpa(true)}
                  className="px-2.5 py-1 text-[11px] font-arcade bg-stone-800 text-amber-300 rounded border border-amber-600/40 hover:bg-stone-700 transition cursor-pointer flex items-center gap-1"
                >
                  <Lightbulb className="w-3 h-3 text-amber-400" />
                  <span>GỢI Ý IPA</span>
                </button>
              )}
              {!showSentenceHint && currentWord.example && (
                <button
                  type="button"
                  onClick={() => setShowSentenceHint(true)}
                  className="px-2.5 py-1 text-[11px] font-arcade bg-stone-800 text-cyan-300 rounded border border-cyan-600/40 hover:bg-stone-700 transition cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>CÂU VÍ DỤ</span>
                </button>
              )}
            </div>
          </div>

          {/* Revealed Hints */}
          {showIpa && (
            <div className="mt-2 pt-2 border-t border-stone-800 text-xs font-mono text-amber-200">
              💡 Phiên âm IPA: <strong>{currentWord.ipa}</strong>
            </div>
          )}
          {showSentenceHint && (
            <div className="mt-2 pt-2 border-t border-stone-800 text-xs font-sans text-cyan-200 italic">
              📄 Ví dụ ngữ cảnh: "{currentWord.example}"
            </div>
          )}
        </div>

        {/* Wires & Target Letters Display */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-6">
          {/* 5 Electronic Cables */}
          <div className="space-y-2 bg-stone-900/60 p-3 rounded-lg border border-stone-800">
            <div className="text-[10px] font-arcade font-bold text-stone-400 mb-1">
              5 MẠCH ĐIỆN TỬ (WIRES):
            </div>
            {wires.map((wire) => (
              <div
                key={wire.id}
                className={`p-1.5 rounded flex items-center justify-between text-[11px] font-mono border transition-all ${
                  wire.isCut
                    ? 'border-red-950 bg-red-950/40 text-stone-600 line-through opacity-60'
                    : `border-stone-700 bg-stone-900 text-stone-200`
                }`}
              >
                <span>{wire.name}</span>
                {wire.isCut ? (
                  <span className="text-red-500 font-bold">⚡ ĐÃ ĐỨT</span>
                ) : (
                  <div className={`w-3.5 h-3.5 rounded-full bg-linear-to-r ${wire.color} animate-pulse`} />
                )}
              </div>
            ))}
          </div>

          {/* Letter Reveal Display */}
          <div className="md:col-span-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-4 bg-slate-900/80 rounded-xl border border-stone-800 min-h-[100px]">
            {targetLetters.map((letter, idx) => {
              const isRevealed = guessedLetters.has(letter) || isSuccess || isExploded;
              return (
                <div
                  key={idx}
                  className={`w-9 h-12 sm:w-11 sm:h-14 rounded-lg flex items-center justify-center font-mono font-bold text-lg sm:text-2xl transition-all border-2 ${
                    isRevealed
                      ? isExploded && !guessedLetters.has(letter)
                        ? 'bg-red-950/80 border-red-500 text-red-300'
                        : 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                      : 'bg-stone-950 border-stone-700 text-transparent'
                  }`}
                >
                  {isRevealed ? letter : '_'}
                </div>
              );
            })}
          </div>
        </div>

        {/* QWERTY Keyboard */}
        <div className="space-y-1.5 max-w-2xl mx-auto mb-2">
          {QWERTY_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1 sm:gap-1.5">
              {row.map((letter) => {
                const isGuessed = guessedLetters.has(letter);
                const isCorrect = isGuessed && uniqueLetters.has(letter);
                const isWrong = isGuessed && !uniqueLetters.has(letter);

                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={isGuessed || isSuccess || isExploded}
                    onClick={() => handleGuess(letter)}
                    className={`w-8 h-10 sm:w-10 sm:h-11 rounded font-mono font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center border ${
                      isCorrect
                        ? 'bg-emerald-700 border-emerald-400 text-white shadow-sm opacity-90'
                        : isWrong
                        ? 'bg-red-950/60 border-red-900 text-stone-600 line-through opacity-40 cursor-not-allowed'
                        : 'bg-stone-900 hover:bg-stone-800 text-stone-200 border-stone-700 hover:border-amber-400 active:scale-95'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="text-[10px] font-sans text-stone-400 text-center mt-2">
          💡 Bạn có thể bấm trực tiếp các phím chữ cái A-Z trên bàn phím máy tính!
        </div>

        {/* Victory Overlay Modal */}
        {isSuccess && (
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2 animate-bounce" />
            <h3 className="text-2xl font-arcade font-bold text-emerald-300 mb-1">
              BOM ĐÃ ĐƯỢC VÔ HIỆU HÓA!
            </h3>
            <div className="text-xl font-mono font-bold text-amber-300 mb-2 flex items-center gap-2">
              <span>{currentWord.word}</span>
              <button
                type="button"
                onClick={() => speakWord(currentWord.word)}
                className="p-1 rounded bg-stone-800 text-cyan-300 hover:bg-stone-700 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs font-mono text-cyan-300 mb-2">
              IPA: {currentWord.ipa || '—'} · Loại từ: [{currentWord.pos || 'n'}]
            </div>
            <p className="text-xs text-stone-200 font-vietnam max-w-md mb-4 bg-stone-900/90 p-3 rounded-lg border border-stone-800">
              "{currentWord.meaning}"
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadNewBomb(currentWord.id)}
                className="pixel-btn-green px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>GỠ QUẢ BOM TIẾP THEO</span>
              </button>
              <button
                type="button"
                onClick={onExit}
                className="pixel-btn-grey px-4 py-2.5 text-xs cursor-pointer shadow"
              >
                VỀ SẢNH
              </button>
            </div>
          </div>
        )}

        {/* Exploded / Defeat Overlay Modal */}
        {isExploded && (
          <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in">
            <XCircle className="w-14 h-14 text-red-500 mb-2 animate-pulse" />
            <h3 className="text-2xl font-arcade font-bold text-red-400 mb-1">
              BOM ĐÃ KÍCH NỔ!
            </h3>
            <div className="text-base text-stone-300 font-sans mb-2">
              Từ mật mã chính xác là:
            </div>
            <div className="text-2xl font-mono font-bold text-amber-300 mb-1 flex items-center gap-2">
              <span>{currentWord.word}</span>
              <button
                type="button"
                onClick={() => speakWord(currentWord.word)}
                className="p-1 rounded bg-stone-800 text-cyan-300 hover:bg-stone-700 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs font-mono text-cyan-300 mb-2">
              {currentWord.ipa} · [{currentWord.pos || 'từ vựng'}]
            </div>
            <p className="text-xs text-stone-200 font-vietnam max-w-md mb-4 bg-stone-900/90 p-3 rounded-lg border border-stone-800">
              "{currentWord.meaning}"
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadNewBomb(currentWord.id)}
                className="pixel-btn-yellow px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer shadow"
              >
                <RotateCcw className="w-4 h-4" />
                <span>THỬ LẠI QUẢ BOM KHÁC</span>
              </button>
              <button
                type="button"
                onClick={onExit}
                className="pixel-btn-grey px-4 py-2.5 text-xs cursor-pointer shadow"
              >
                VỀ SẢNH
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
