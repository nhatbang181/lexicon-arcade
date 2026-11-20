import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { VocabWord } from '../../types/vocab.ts';
import { soundEngine } from '../../audio/soundEngine.ts';
import { 
  Building2, 
  RotateCcw, 
  Volume2, 
  Lightbulb, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ArrowRight,
  Trophy,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SentenceArchitectGameProps {
  words: VocabWord[];
  realmName: string;
  onExit: () => void;
}

interface SentenceChunk {
  id: string;
  text: string;
  originalIndex: number;
}

interface ArchitectQuestion {
  word: VocabWord;
  originalSentence: string;
  vietnameseMeaning: string;
  chunks: SentenceChunk[];
}

function chunkSentenceSmart(sentence: string): string[] {
  // If sentence has commas, split by comma first
  if (sentence.includes(',')) {
    const parts = sentence.split(',').map((p) => p.trim()).filter(Boolean);
    const result: string[] = [];
    parts.forEach((p, idx) => {
      const words = p.split(/\s+/);
      const isLastPart = idx === parts.length - 1;
      const commaSuffix = isLastPart ? '' : ',';
      if (words.length <= 4) {
        result.push(words.join(' ') + commaSuffix);
      } else {
        const mid = Math.ceil(words.length / 2);
        result.push(words.slice(0, mid).join(' '));
        result.push(words.slice(mid).join(' ') + commaSuffix);
      }
    });
    if (result.length >= 3 && result.length <= 6) return result;
  }

  // Fallback: group words into 2-3 words per chunk
  const words = sentence.trim().split(/\s+/);
  const targetChunkCount = Math.min(5, Math.max(3, Math.floor(words.length / 2.8)));
  const chunkSize = Math.ceil(words.length / targetChunkCount);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

export const SentenceArchitectGame: React.FC<SentenceArchitectGameProps> = ({
  words,
  realmName,
  onExit,
}) => {
  // Eligible words with substantial sentences
  const eligibleWords = useMemo(
    () =>
      words.filter(
        (w) =>
          w &&
          w.example &&
          w.example.trim().length >= 25 &&
          !w.example.includes('?') &&
          !w.example.startsWith('Study item:') &&
          w.meaning
      ),
    [words]
  );

  const [currentQuestion, setCurrentQuestion] = useState<ArchitectQuestion | null>(null);
  const [availableChunks, setAvailableChunks] = useState<SentenceChunk[]>([]);
  const [assembledChunks, setAssembledChunks] = useState<SentenceChunk[]>([]);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [sentencesCompleted, setSentencesCompleted] = useState<number>(0);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [mismatchedIndices, setMismatchedIndices] = useState<number[]>([]);

  // TTS helper
  const speakSentence = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.88;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Generate question
  const loadNewSentence = useCallback(
    (avoidWordId?: string) => {
      if (eligibleWords.length === 0) return;
      const pool = eligibleWords.filter((w) => w.id !== avoidWordId);
      const chosenWord = pool[Math.floor(Math.random() * pool.length)] || eligibleWords[0];

      const rawChunks = chunkSentenceSmart(chosenWord.example.trim());
      const chunkObjs: SentenceChunk[] = rawChunks.map((text, idx) => ({
        id: `chunk_${idx}_${Math.random()}`,
        text,
        originalIndex: idx,
      }));

      // Shuffle available chunks
      const shuffled = [...chunkObjs].sort(() => 0.5 - Math.random());

      // If shuffle accidentally matches original order, swap first two
      if (shuffled.every((c, idx) => c.originalIndex === idx) && shuffled.length >= 2) {
        const tmp = shuffled[0];
        shuffled[0] = shuffled[1];
        shuffled[1] = tmp;
      }

      setCurrentQuestion({
        word: chosenWord,
        originalSentence: chosenWord.example.trim(),
        vietnameseMeaning: chosenWord.meaning,
        chunks: chunkObjs,
      });

      setAvailableChunks(shuffled);
      setAssembledChunks([]);
      setIsAnswered(false);
      setIsCorrect(false);
      setHintUsed(false);
      setMismatchedIndices([]);
    },
    [eligibleWords]
  );

  // Initialize on mount
  useEffect(() => {
    loadNewSentence();
  }, [loadNewSentence]);

  // Click chunk in available tray -> moves to dock
  const handleSelectChunk = (chunk: SentenceChunk) => {
    if (isAnswered && isCorrect) return;
    soundEngine.playAttackSound();
    setAvailableChunks((prev) => prev.filter((c) => c.id !== chunk.id));
    setAssembledChunks((prev) => [...prev, chunk]);
    setMismatchedIndices([]);
  };

  // Click chunk in dock -> moves back to tray
  const handleRemoveChunk = (chunk: SentenceChunk) => {
    if (isAnswered && isCorrect) return;
    soundEngine.playAttackSound();
    setAssembledChunks((prev) => prev.filter((c) => c.id !== chunk.id));
    setAvailableChunks((prev) => [...prev, chunk]);
    setMismatchedIndices([]);
  };

  // Reorder chunk in dock
  const handleShiftChunk = (index: number, direction: 'left' | 'right') => {
    if (isAnswered && isCorrect) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= assembledChunks.length) return;

    soundEngine.playAttackSound();
    setAssembledChunks((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
    setMismatchedIndices([]);
  };

  // Reset all chunks
  const handleReset = () => {
    if (!currentQuestion || (isAnswered && isCorrect)) return;
    soundEngine.playAttackSound();
    const all = [...availableChunks, ...assembledChunks].sort(() => 0.5 - Math.random());
    setAvailableChunks(all);
    setAssembledChunks([]);
    setMismatchedIndices([]);
  };

  // Auto-place next correct chunk (Hint)
  const handleHint = () => {
    if (!currentQuestion || isAnswered || availableChunks.length === 0) return;
    soundEngine.playPotionSound();
    setHintUsed(true);

    const nextIndex = assembledChunks.length;
    const correctNextChunk = availableChunks.find((c) => c.originalIndex === nextIndex);

    if (correctNextChunk) {
      setAvailableChunks((prev) => prev.filter((c) => c.id !== correctNextChunk.id));
      setAssembledChunks((prev) => [...prev, correctNextChunk]);
    } else {
      // If user had wrong pieces assembled, suggest reset
      handleReset();
    }
  };

  // Check assembled sentence
  const handleCheckSentence = () => {
    if (!currentQuestion) return;

    // Check if count matches
    if (assembledChunks.length !== currentQuestion.chunks.length) {
      soundEngine.playBuzzerSound();
      return;
    }

    const wrongPositions: number[] = [];
    assembledChunks.forEach((chunk, idx) => {
      if (chunk.originalIndex !== idx) {
        wrongPositions.push(idx);
      }
    });

    if (wrongPositions.length === 0) {
      // 100% CORRECT!
      soundEngine.playVictorySound();
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });

      speakSentence(currentQuestion.originalSentence);

      const basePoints = hintUsed ? 60 : 120;
      const comboMultiplier = 1 + combo * 0.15;
      const points = Math.round(basePoints * comboMultiplier);

      setScore((s) => s + points);
      setCombo((c) => c + 1);
      setSentencesCompleted((s) => s + 1);
      setIsCorrect(true);
      setIsAnswered(true);
      setMismatchedIndices([]);
    } else {
      // INCORRECT
      soundEngine.playBuzzerSound();
      setCombo(0);
      setMismatchedIndices(wrongPositions);
      setIsCorrect(false);
      setIsAnswered(true);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center font-arcade text-amber-300">
        Đang khởi tạo các khối ngữ pháp câu...
      </div>
    );
  }

  const allChunksPlaced = assembledChunks.length === currentQuestion.chunks.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* Top Banner & Stats */}
      <div className="pixel-frame-brown p-4 bg-stone-900/95 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-950 border border-amber-700 text-amber-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-arcade font-bold text-amber-300 flex items-center gap-2">
              <span>KIẾN TRÚC SƯ CÂU (SENTENCE ARCHITECT)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                IOE SYNTAX
              </span>
            </h2>
            <span className="text-[11px] font-sans text-stone-400">
              Chủ đề: <strong className="text-amber-200">{realmName}</strong>
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
            <div>
              <div className="text-[9px] font-arcade text-stone-400">ĐÃ XÂY</div>
              <div className="text-sm font-arcade font-bold text-emerald-400">
                {sentencesCompleted} 🏗️
              </div>
            </div>
            {combo > 1 && (
              <div className="border-l border-stone-800 pl-2">
                <div className="text-[9px] font-arcade text-cyan-400">COMBO</div>
                <div className="text-sm font-arcade font-bold text-cyan-300">x{combo}</div>
              </div>
            )}
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

      {/* Clue Panel: Target Word & Meaning */}
      <div className="pixel-frame-grey p-4 bg-slate-950 border-2 border-stone-800 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-arcade font-bold bg-amber-500 text-stone-950 rounded">
                TỪ TRỌNG TÂM: {currentQuestion.word.word.toUpperCase()}
              </span>
              {currentQuestion.word.pos && (
                <span className="text-xs font-mono text-stone-400">
                  [{currentQuestion.word.pos}]
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-vietnam font-semibold text-emerald-300">
              "{currentQuestion.vietnameseMeaning}"
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleHint}
              disabled={isCorrect || availableChunks.length === 0}
              className="px-2.5 py-1 text-[11px] font-arcade bg-stone-800 text-amber-300 rounded border border-amber-600/40 hover:bg-stone-700 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>GỢI Ý CỤM TIẾP</span>
            </button>
            <button
              type="button"
              onClick={() => speakSentence(currentQuestion.originalSentence)}
              title="Nghe câu mẫu"
              className="p-2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Assembly Dock (Vùng Ghép Câu) */}
      <div className="pixel-frame-brown p-4 bg-stone-900/90">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-arcade font-bold text-amber-300 flex items-center gap-1.5">
            <span>DOCK GHÉP CÂU (BẤM KHỐI TỪ ĐỂ ĐẶT VÀO / RÚT LẠI):</span>
          </div>
          {assembledChunks.length > 0 && !isCorrect && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-arcade text-stone-400 hover:text-rose-400 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>LÀM LẠI</span>
            </button>
          )}
        </div>

        {/* Assembled chunks strip */}
        <div
          className={`min-h-[80px] p-3 rounded-xl border-2 transition-all flex flex-wrap items-center gap-2 ${
            isCorrect
              ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              : mismatchedIndices.length > 0
              ? 'bg-red-950/20 border-red-500/80'
              : 'bg-stone-950 border-stone-800'
          }`}
        >
          {assembledChunks.length === 0 ? (
            <div className="w-full text-center text-xs font-sans text-stone-500 py-3">
              Chưa có cụm từ nào. Hãy bấm vào các khối từ bên dưới để xây dựng câu hoàn chỉnh!
            </div>
          ) : (
            assembledChunks.map((chunk, index) => {
              const isMismatched = mismatchedIndices.includes(index);
              return (
                <div
                  key={chunk.id}
                  className={`group relative flex items-center rounded-lg border px-3 py-2 text-xs sm:text-sm font-sans font-semibold transition-all ${
                    isCorrect
                      ? 'bg-emerald-900/80 border-emerald-400 text-emerald-100 shadow-sm'
                      : isMismatched
                      ? 'bg-red-950/90 border-red-500 text-red-200 animate-shake'
                      : 'bg-stone-800 hover:bg-stone-750 border-amber-600/60 text-amber-200 shadow'
                  }`}
                >
                  <span
                    onClick={() => handleRemoveChunk(chunk)}
                    className="cursor-pointer select-none"
                    title="Bấm để đưa về khay"
                  >
                    {chunk.text}
                  </span>

                  {/* Left / Right fine-tuning arrows */}
                  {!isCorrect && (
                    <div className="ml-2 flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleShiftChunk(index, 'left')}
                          className="p-0.5 rounded hover:bg-stone-700 text-stone-400 hover:text-white"
                          title="Di chuyển sang trái"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      )}
                      {index < assembledChunks.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleShiftChunk(index, 'right')}
                          className="p-0.5 rounded hover:bg-stone-700 text-stone-400 hover:text-white"
                          title="Di chuyển sang phải"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Check Button Bar */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-mono text-stone-400">
            Tiến độ: {assembledChunks.length} / {currentQuestion.chunks.length} cụm từ
          </span>

          {!isCorrect ? (
            <button
              type="button"
              disabled={!allChunksPlaced}
              onClick={handleCheckSentence}
              className={`px-5 py-2 text-xs flex items-center gap-2 cursor-pointer transition shadow ${
                allChunksPlaced
                  ? 'pixel-btn-yellow'
                  : 'bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed'
              }`}
            >
              <span>KIỂM TRA CÂU</span>
              <span>✓</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => loadNewSentence(currentQuestion.word.id)}
              className="pixel-btn-green px-5 py-2 text-xs flex items-center gap-2 cursor-pointer shadow"
            >
              <Sparkles className="w-4 h-4" />
              <span>CÂU TIẾP THEO</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>

      {/* Available Chunks Tray */}
      <div className="pixel-frame-grey p-4 bg-slate-950 border border-stone-800">
        <div className="text-[10px] font-arcade font-bold text-stone-400 mb-2.5">
          CÁC KHỐI TỪ VỰNG KHẢ DỤNG (BẤM ĐỂ ĐẶT VÀO CÂU):
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-h-[50px]">
          {availableChunks.length === 0 ? (
            <div className="text-xs font-sans text-stone-500 italic">
              Đã đưa toàn bộ các khối từ vào Dock. Nhấn "KIỂM TRA CÂU" để xem kết quả!
            </div>
          ) : (
            availableChunks.map((chunk) => (
              <button
                key={chunk.id}
                type="button"
                onClick={() => handleSelectChunk(chunk)}
                className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 border-2 border-stone-700 hover:border-amber-400 text-xs sm:text-sm font-sans font-semibold text-stone-200 transition active:scale-95 shadow cursor-pointer"
              >
                {chunk.text}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Linguistic Breakdown on Correct */}
      {isCorrect && (
        <div className="pixel-frame-green p-4 bg-emerald-950/40 border-2 border-emerald-500/80 rounded-xl space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-300 font-arcade font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>XUẤT SẮC! CÂU HỌC THUẬT HOÀN HẢO (+{hintUsed ? '60' : '120'}đ)</span>
          </div>

          <div className="text-sm sm:text-base font-sans font-semibold text-white bg-emerald-900/40 p-3 rounded-lg border border-emerald-700/50">
            "{currentQuestion.originalSentence}"
          </div>

          <div className="text-xs font-vietnam text-emerald-200/90 leading-relaxed pt-1">
            💡 <strong>Phân tích cú pháp:</strong> Câu chứa từ khóa{' '}
            <strong className="text-amber-300">"{currentQuestion.word.word}"</strong> (
            {currentQuestion.word.meaning}) liên kết mạch lạc giữa các mệnh đề trạng ngữ và cụm danh từ
            học thuật chuẩn band điểm 8.0+.
          </div>
        </div>
      )}

      {/* Error feedback if wrong */}
      {isAnswered && !isCorrect && (
        <div className="p-3 bg-red-950/70 border border-red-700 rounded-lg text-xs font-vietnam text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              Một số vị trí khối từ chưa đúng thứ tự (được đánh dấu viền đỏ). Hãy bấm vào để đổi chỗ hoặc nhấn "Làm lại"!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
