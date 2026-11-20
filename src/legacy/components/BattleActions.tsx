import React, { useState, useEffect } from 'react';
import type { VocabWord } from '../types/vocab.ts';
import type { CombatActionType } from '../types/game.ts';
import { Volume2, Sparkles, Shield, Wand2, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { speakEnglish } from '../utils/speech.ts';

interface BattleActionsProps {
  currentWord: VocabWord;
  realmWords: VocabWord[];
  onActionSubmit: (action: CombatActionType, isCorrect: boolean, isTypingRecall: boolean) => void;
  disabled: boolean;
  playerMp: number;
  onUseHint: () => boolean;
}

export const BattleActions: React.FC<BattleActionsProps> = ({
  currentWord,
  realmWords,
  onActionSubmit,
  disabled,
  playerMp,
  onUseHint
}) => {
  const [activeTab, setActiveTab] = useState<CombatActionType>('cloze');
  const [typedInput, setTypedInput] = useState('');
  const [distractors, setDistractors] = useState<string[]>([]);
  const [synonymDistractors, setSynonymDistractors] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintText, setHintText] = useState('');
  const [mode, setMode] = useState<'type' | 'mcq'>('type');

  // Prepare distractors when current word changes
  useEffect(() => {
    setTypedInput('');
    setHintUsed(false);
    setHintText('');

    // Distractor generation
    const otherWords = realmWords
      .filter(w => w.id !== currentWord.id && w.word.toLowerCase() !== currentWord.word.toLowerCase())
      .map(w => w.word);

    // Shuffle and pick 3
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [...shuffledOthers, currentWord.word].sort(() => Math.random() - 0.5);
    setDistractors(allOptions);

    // Synonym distractors
    const correctSyn = currentWord.synonyms && currentWord.synonyms.length > 0 
      ? currentWord.synonyms[0] 
      : currentWord.definition.slice(0, 45) + '...';

    const otherSyns = realmWords
      .filter(w => w.id !== currentWord.id)
      .map(w => w.synonyms && w.synonyms.length > 0 ? w.synonyms[0] : w.definition.slice(0, 45) + '...')
      .filter(s => s && s !== correctSyn);

    const shuffledSyns = [...otherSyns].sort(() => Math.random() - 0.5).slice(0, 3);
    setSynonymDistractors([...shuffledSyns, correctSyn].sort(() => Math.random() - 0.5));
  }, [currentWord, realmWords]);

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !typedInput.trim()) return;

    const normalizedInput = typedInput.trim().toLowerCase();
    const targetWord = currentWord.word.trim().toLowerCase();

    // Check exact match or close match without punctuation
    const isCorrect = normalizedInput === targetWord || 
                      normalizedInput === targetWord.replace(/[-_]/g, ' ') ||
                      targetWord.replace(/[-_]/g, ' ') === normalizedInput;

    onActionSubmit('cloze', isCorrect, true);
    setTypedInput('');
  };

  const handleOptionSelect = (selectedWord: string) => {
    if (disabled) return;
    const isCorrect = selectedWord.toLowerCase() === currentWord.word.toLowerCase();
    onActionSubmit('cloze', isCorrect, false);
  };

  const handleCollocationSelect = (selected: string) => {
    if (disabled) return;
    const isCorrect = selected.toLowerCase() === currentWord.word.toLowerCase();
    onActionSubmit('collocation', isCorrect, false);
  };

  const handleSynonymSelect = (selected: string) => {
    if (disabled) return;
    const correctSyn = currentWord.synonyms && currentWord.synonyms.length > 0 
      ? currentWord.synonyms[0] 
      : currentWord.definition.slice(0, 45) + '...';
    const isCorrect = selected === correctSyn;
    onActionSubmit('synonym', isCorrect, false);
  };

  const triggerHint = () => {
    if (hintUsed || disabled) return;
    const success = onUseHint();
    if (success) {
      setHintUsed(true);
      setHintText(`Hint: Starts with "${currentWord.word.slice(0, 2).toUpperCase()}..." · Meaning: ${currentWord.meaning}`);
    }
  };

  // Mask sentence with blank
  const renderClozeSentence = () => {
    const rawExample = currentWord.example || `The concept of ${currentWord.word} is central to academic study.`;
    const escapedWord = currentWord.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedWord, 'gi');
    return rawExample.replace(regex, '________');
  };

  // Collocation prompt
  const targetCollocation = currentWord.collocations && currentWord.collocations.length > 0
    ? currentWord.collocations[0]
    : `${currentWord.word} concept`;

  const renderCollocationPrompt = () => {
    const escapedWord = currentWord.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedWord, 'gi');
    return targetCollocation.replace(regex, '________');
  };

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Spell Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('cloze')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'cloze'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Cloze Strike
          </button>

          <button
            onClick={() => setActiveTab('collocation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'collocation'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Collocation Combo
          </button>

          <button
            onClick={() => setActiveTab('synonym')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'synonym'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Synonym Parry
          </button>
        </div>

        {/* Audio Pronunciation & Hint */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => speakEnglish(currentWord.word)}
            title="Hear native English pronunciation"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors border border-slate-700"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">{currentWord.ipa || 'Audio'}</span>
          </button>

          <button
            onClick={triggerHint}
            disabled={hintUsed || playerMp < 10 || disabled}
            title="Spend 10 MP for lexical hint"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors ${
              hintUsed
                ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed'
                : playerMp >= 10
                ? 'bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900 border-indigo-700/60'
                : 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Hint (10 MP)
          </button>
        </div>
      </div>

      {/* Hint Alert if Active */}
      {hintText && (
        <div className="mb-3 px-3 py-2 bg-indigo-950/40 border border-indigo-500/30 rounded-lg text-xs text-indigo-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{hintText}</span>
        </div>
      )}

      {/* TAB 1: CLOZE STRIKE */}
      {activeTab === 'cloze' && (
        <div className="space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase tracking-wider font-semibold text-amber-400/90">
                Context Cloze Sentence · {currentWord.pos || 'vocabulary'}
              </span>
              <span className="italic text-slate-400">{currentWord.meaning}</span>
            </div>
            <p className="text-slate-100 text-base leading-relaxed font-medium">
              "{renderClozeSentence()}"
            </p>
          </div>

          {/* Mode Switch: Typing vs Multiple Choice */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {mode === 'type' ? '⚡ Active Recall Typing (+50% Crit Strike Damage)' : 'Multiple Choice Mode'}
            </span>
            <button
              onClick={() => setMode(mode === 'type' ? 'mcq' : 'type')}
              className="text-xs text-amber-400/80 hover:text-amber-300 underline font-mono"
            >
              Switch to {mode === 'type' ? 'Buttons' : 'Typing'}
            </button>
          </div>

          {mode === 'type' ? (
            <form onSubmit={handleTypeSubmit} className="flex gap-2">
              <input
                type="text"
                value={typedInput}
                onChange={e => setTypedInput(e.target.value)}
                placeholder="Type the exact vocabulary word to strike..."
                autoFocus
                disabled={disabled}
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm font-mono outline-none transition-all"
              />
              <button
                type="submit"
                disabled={disabled || !typedInput.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-amber-500/25 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Cast
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {distractors.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(word)}
                  disabled={disabled}
                  className="p-3 bg-slate-950/70 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/60 rounded-xl text-left font-mono text-sm text-slate-200 hover:text-amber-300 transition-all flex items-center justify-between group"
                >
                  <span>{word}</span>
                  <span className="text-xs text-slate-600 group-hover:text-amber-400">[{idx + 1}]</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COLLOCATION COMBO */}
      {activeTab === 'collocation' && (
        <div className="space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              Natural Collocation Chain
            </div>
            <p className="text-slate-100 text-lg font-mono font-bold">
              "{renderCollocationPrompt()}"
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Select the word that naturally collocate with this phrase for a multi-hit combo!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {distractors.map((word, idx) => (
              <button
                key={idx}
                onClick={() => handleCollocationSelect(word)}
                disabled={disabled}
                className="p-3 bg-slate-950/70 hover:bg-blue-950/30 border border-slate-800 hover:border-blue-500/60 rounded-xl text-left font-mono text-sm text-slate-200 hover:text-blue-300 transition-all flex items-center justify-between group"
              >
                <span>{word}</span>
                <span className="text-xs text-slate-600 group-hover:text-blue-400">Combo [{idx + 1}]</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SYNONYM PARRY */}
      {activeTab === 'synonym' && (
        <div className="space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
              Academic Synonym / Formal Definition
            </div>
            <p className="text-slate-100 text-base font-medium">
              Target Word: <span className="font-bold text-amber-300 font-mono text-lg">{currentWord.word}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Match the exact academic synonym or definition to raise your Aegis shield and reflect the enemy's attack!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {synonymDistractors.map((syn, idx) => (
              <button
                key={idx}
                onClick={() => handleSynonymSelect(syn)}
                disabled={disabled}
                className="p-3 bg-slate-950/70 hover:bg-purple-950/30 border border-slate-800 hover:border-purple-500/60 rounded-xl text-left text-xs text-slate-200 hover:text-purple-300 transition-all leading-snug line-clamp-2"
              >
                {syn}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
