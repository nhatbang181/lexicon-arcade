import React, { useEffect, useState } from 'react';
import type { BarrierPrompt } from '../game/lexicalBarrier.ts';
import { Volume2, Sparkles, ShieldAlert, KeyRound } from 'lucide-react';
import { speakEnglish } from '../utils/speech.ts';

interface LexicalEventModalProps {
  barrier: BarrierPrompt;
  onSolve: (isCorrect: boolean) => void;
  onDismiss?: () => void;
}

export const LexicalEventModal: React.FC<LexicalEventModalProps> = ({
  barrier,
  onSolve,
  onDismiss
}) => {
  const [typedInput, setTypedInput] = useState('');

  // Keyboard hotkeys [1], [2], [3], [4]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < barrier.options.length) {
          onSolve(idx === barrier.correctIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [barrier, onSolve]);

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = typedInput.trim().toLowerCase();
    const target = barrier.word.word.trim().toLowerCase();
    const isCorrect = cleanInput === target;
    onSolve(isCorrect);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[92%] bg-slate-950/95 border-2 border-amber-500/70 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-bounce-in">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          {barrier.source === 'chest' ? (
            <KeyRound className="w-4 h-4 text-amber-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          )}
          <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 font-rpg">
            {barrier.source === 'chest' ? 'Ancient Lexical Chest' : '⚡ Elite Barrier: Shatter for Smart Bomb!'}
          </span>
        </div>

        <button
          onClick={() => speakEnglish(barrier.word.word)}
          className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-amber-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg"
          title="Audio hint"
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono">{barrier.word.ipa || 'Phonetics'}</span>
        </button>
      </div>

      {/* Sentence prompt */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 mb-3">
        <div className="text-[11px] text-slate-400 italic mb-1 flex items-center justify-between">
          <span>{barrier.word.meaning}</span>
          <span className="uppercase font-mono font-bold text-amber-400/90">{barrier.word.pos || 'IELTS'}</span>
        </div>
        <p className="text-slate-100 text-sm font-semibold leading-relaxed">
          "{barrier.maskedSentence}"
        </p>
      </div>

      {/* Options mapped to keys 1, 2, 3, 4 */}
      <div className="grid grid-cols-2 gap-2">
        {barrier.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onSolve(idx === barrier.correctIndex)}
            className="flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-400 rounded-xl text-left text-xs font-mono font-bold text-slate-200 hover:text-amber-300 transition-all group"
          >
            <span>{opt}</span>
            <span className="text-[10px] text-slate-500 group-hover:text-amber-400 border border-slate-800 group-hover:border-amber-500/50 px-1.5 py-0.5 rounded">
              [{idx + 1}]
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
