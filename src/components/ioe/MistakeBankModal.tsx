import React from 'react';
import type { MistakeRecord } from '../../types/ioe.ts';
import { speakEnglish } from '../../utils/speech.ts';
import { soundEngine } from '../../audio/soundEngine.ts';

interface MistakeBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  mistakes: MistakeRecord[];
  onRemoveMistake: (id: string) => void;
  onClearAll: () => void;
}

export const MistakeBankModal: React.FC<MistakeBankModalProps> = ({
  isOpen,
  onClose,
  mistakes,
  onRemoveMistake,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const handleSpeak = (word: string) => {
    soundEngine.playAttackSound();
    speakEnglish(word);
  };

  const handleMastered = (id: string) => {
    soundEngine.playCoinSound();
    onRemoveMistake(id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl pixel-frame-brown bg-stone-900 text-stone-100 p-6 max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">📚</span>
            <div>
              <h2 className="text-base sm:text-lg font-pixel text-amber-300">
                SỔ TAY ÔN TẬP / MISTAKE BANK
              </h2>
              <p className="text-xs text-stone-400">
                Lưu trữ tự động các câu & từ bạn trả lời sai để luyện tập lại
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn-red px-2.5 py-1 text-xs"
          >
            ✕ ĐÓNG
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {mistakes.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-stone-400">
              <span className="text-4xl mb-3">🌟</span>
              <p className="font-pixel text-xs text-amber-200 mb-1">
                SỔ TAY TRỐNG!
              </p>
              <p className="text-xs">
                Bạn chưa làm sai từ nào hoặc đã chinh phục hết tất cả các câu hỏi!
              </p>
            </div>
          ) : (
            mistakes.map((record) => (
              <div
                key={record.id}
                className="bg-stone-950/80 border border-amber-900/60 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-amber-700/80 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-lg font-bold font-serif text-amber-300">
                      {record.word}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSpeak(record.word)}
                      className="text-stone-400 hover:text-amber-400 text-sm cursor-pointer p-0.5"
                      title="Nghe phát âm"
                    >
                      🔊
                    </button>
                    {record.ipa && (
                      <span className="text-xs font-mono text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                        {record.ipa}
                      </span>
                    )}
                    {record.pos && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {record.pos}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-stone-200">
                    <span className="text-emerald-400 font-medium">Nghĩa:</span> {record.meaning}
                  </div>

                  {record.failedAnswer && (
                    <div className="text-xs text-red-400/90 font-mono">
                      Bạn đã trả lời: <span className="line-through">{record.failedAnswer}</span>
                    </div>
                  )}

                  {record.contextSentence && (
                    <div className="text-xs text-stone-400 italic">
                      &ldquo;{record.contextSentence}&rdquo;
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleMastered(record.id)}
                    className="pixel-btn-green px-3 py-1.5 text-[10px] whitespace-nowrap"
                    title="Đã nhớ từ này, xóa khỏi sổ tay"
                  >
                    ✓ ĐÃ THUỘC
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {mistakes.length > 0 && (
          <div className="pt-4 border-t border-amber-900/60 mt-4 flex items-center justify-between">
            <span className="text-xs text-stone-400">
              Tổng cộng: <strong className="text-amber-300">{mistakes.length}</strong> từ
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-red-400/80 hover:text-red-300 underline cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
