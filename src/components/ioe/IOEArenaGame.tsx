import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Realm, VocabWord } from '../../types/vocab.ts';
import type { 
  MistakeRecord, 
  ScrambleQuestion, 
  MatchingRoundData, 
  AudioQuestion, 
  ClozeQuestion 
} from '../../types/ioe.ts';
import { 
  generateScrambleQuestion, 
  generateMatchingRound, 
  generateAudioQuestion, 
  generateClozeQuestion 
} from '../../ioe/questionGenerator.ts';

import { IOEGameHUD } from './IOEGameHUD.tsx';
import { WordScrambleRound } from './WordScrambleRound.tsx';
import { MatchingPairsRound } from './MatchingPairsRound.tsx';
import { AudioListeningRound } from './AudioListeningRound.tsx';
import { ContextClozeRound } from './ContextClozeRound.tsx';
import { IOERoundSummary } from './IOERoundSummary.tsx';
import { MistakeBankModal } from './MistakeBankModal.tsx';

interface IOEArenaGameProps {
  realm: Realm;
  onExit: () => void;
  onNextRealm: () => void;
}

const STORAGE_MISTAKES_KEY = 'ioe_mistakes';

export const IOEArenaGame: React.FC<IOEArenaGameProps> = ({
  realm,
  onExit,
  onNextRealm,
}) => {
  // Game progress state
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [hearts, setHearts] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [maxCombo, setMaxCombo] = useState<number>(1);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  // Mistake bank modal state
  const [isMistakeModalOpen, setIsMistakeModalOpen] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MISTAKES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync mistakes to localStorage
  const saveMistakes = useCallback((newMistakes: MistakeRecord[]) => {
    setMistakes(newMistakes);
    try {
      localStorage.setItem(STORAGE_MISTAKES_KEY, JSON.stringify(newMistakes));
    } catch {
      // Ignore quota errors
    }
  }, []);

  const addMistake = useCallback(
    (record: Omit<MistakeRecord, 'id' | 'timestamp'>) => {
      const newEntry: MistakeRecord = {
        ...record,
        id: `mistake_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
      };
      saveMistakes([newEntry, ...mistakes.filter((m) => m.word.toLowerCase() !== record.word.toLowerCase())]);
    },
    [mistakes, saveMistakes]
  );

  const removeMistake = useCallback(
    (id: string) => {
      saveMistakes(mistakes.filter((m) => m.id !== id));
    },
    [mistakes, saveMistakes]
  );

  const clearAllMistakes = useCallback(() => {
    saveMistakes([]);
  }, [saveMistakes]);

  // Generate Questions for current realm
  const realmWords = useMemo(() => realm.words || [], [realm]);

  const [scrambleQ, setScrambleQ] = useState<ScrambleQuestion | null>(null);
  const [matchingData, setMatchingData] = useState<MatchingRoundData | null>(null);
  const [audioQ, setAudioQ] = useState<AudioQuestion | null>(null);
  const [clozeQ, setClozeQ] = useState<ClozeQuestion | null>(null);
  const [activeTargetWord, setActiveTargetWord] = useState<VocabWord | null>(null);

  // Setup round questions
  const initChallenge = useCallback(() => {
    if (!realmWords || realmWords.length === 0) return;

    // Pick random target words
    const shuffled = [...realmWords].sort(() => 0.5 - Math.random());
    const word1 = shuffled[0];
    const word3 = shuffled[1] || shuffled[0];
    const word4 = shuffled[2] || shuffled[0];

    setActiveTargetWord(word1);
    setScrambleQ(generateScrambleQuestion(word1));
    setMatchingData(generateMatchingRound(realmWords, 6));
    setAudioQ(generateAudioQuestion(word3));
    setClozeQ(generateClozeQuestion(word4, realmWords));

    setCurrentRound(1);
    setHearts(3);
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setIsGameOver(false);
    setIsVictory(false);
  }, [realmWords]);

  useEffect(() => {
    initChallenge();
  }, [initChallenge]);

  // Round success handler
  const handleSuccess = (earnedScore: number) => {
    const nextCombo = combo + 1;
    setScore((prev) => prev + earnedScore);
    setCombo(nextCombo);
    setMaxCombo((prev) => Math.max(prev, nextCombo));

    if (currentRound >= 4) {
      // Completed all 4 rounds!
      setIsVictory(true);
      setIsGameOver(true);
    } else {
      setCurrentRound((prev) => prev + 1);
    }
  };

  // Round failure handler
  const handleFail = (failedAnswer: string) => {
    setCombo(1);

    // Record mistake
    if (currentRound === 1 && scrambleQ) {
      addMistake({
        word: scrambleQ.originalWord,
        meaning: scrambleQ.meaning,
        ipa: scrambleQ.ipa,
        pos: scrambleQ.pos,
        roundType: 'scramble',
        failedAnswer,
        correctAnswer: scrambleQ.originalWord,
        contextSentence: scrambleQ.maskedSentence,
        realmId: realm.id,
      });
    } else if (currentRound === 2) {
      addMistake({
        word: 'Matching Pairs Collocation',
        meaning: failedAnswer,
        ipa: '',
        pos: 'collocation',
        roundType: 'matching',
        failedAnswer,
        correctAnswer: 'Cặp ghép chính xác',
        realmId: realm.id,
      });
    } else if (currentRound === 3 && audioQ) {
      addMistake({
        word: audioQ.correctAnswer,
        meaning: audioQ.meaning,
        ipa: audioQ.ipa,
        pos: audioQ.pos,
        roundType: 'audio',
        failedAnswer,
        correctAnswer: audioQ.correctAnswer,
        contextSentence: audioQ.sentenceWithBlank,
        realmId: realm.id,
      });
    } else if (currentRound === 4 && clozeQ) {
      addMistake({
        word: clozeQ.options[clozeQ.correctIndex],
        meaning: clozeQ.meaning,
        ipa: '',
        pos: clozeQ.pos,
        roundType: 'cloze',
        failedAnswer,
        correctAnswer: clozeQ.options[clozeQ.correctIndex],
        contextSentence: clozeQ.sentenceWithBlank,
        realmId: realm.id,
      });
    }

    setHearts((prev) => {
      const nextHearts = prev - 1;
      if (nextHearts <= 0) {
        setIsGameOver(true);
        setIsVictory(false);
        return 0;
      }
      return nextHearts;
    });
  };

  const handleTimeout = () => {
    handleFail('Hết thời gian (Timeout)');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col p-4 sm:p-6 custom-scrollbar">
      {/* HUD Header */}
      <IOEGameHUD
        hearts={hearts}
        maxHearts={3}
        score={score}
        combo={combo}
        roundIndex={currentRound}
        totalRounds={4}
        realmName={realm.name}
        onOpenMistakes={() => setIsMistakeModalOpen(true)}
        mistakeCount={mistakes.length}
        onExit={onExit}
      />

      {/* Main Play Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto">
        {isGameOver ? (
          <IOERoundSummary
            score={score}
            maxCombo={maxCombo}
            heartsRemaining={hearts}
            totalWordsLearned={currentRound * 3}
            realmName={realm.name}
            isVictory={isVictory}
            onPlayAgain={initChallenge}
            onNextRealm={onNextRealm}
            onOpenMistakes={() => setIsMistakeModalOpen(true)}
            mistakeCount={mistakes.length}
          />
        ) : (
          <>
            {currentRound === 1 && scrambleQ && (
              <WordScrambleRound
                question={scrambleQ}
                onSuccess={handleSuccess}
                onFail={handleFail}
                onTimeout={handleTimeout}
                combo={combo}
              />
            )}

            {currentRound === 2 && matchingData && (
              <MatchingPairsRound
                data={matchingData}
                onSuccess={handleSuccess}
                onFail={handleFail}
                onTimeout={handleTimeout}
                combo={combo}
              />
            )}

            {currentRound === 3 && audioQ && (
              <AudioListeningRound
                question={audioQ}
                onSuccess={handleSuccess}
                onFail={handleFail}
                onTimeout={handleTimeout}
                combo={combo}
              />
            )}

            {currentRound === 4 && clozeQ && (
              <ContextClozeRound
                question={clozeQ}
                onSuccess={handleSuccess}
                onFail={handleFail}
                onTimeout={handleTimeout}
                combo={combo}
              />
            )}
          </>
        )}
      </main>

      {/* Mistake Bank Modal */}
      <MistakeBankModal
        isOpen={isMistakeModalOpen}
        onClose={() => setIsMistakeModalOpen(false)}
        mistakes={mistakes}
        onRemoveMistake={removeMistake}
        onClearAll={clearAllMistakes}
      />
    </div>
  );
};
