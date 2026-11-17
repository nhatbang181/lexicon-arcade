import type { VocabWord } from '../types/vocab.ts';

export interface BarrierPrompt {
  id: string;
  source: 'elite' | 'chest';
  word: VocabWord;
  maskedSentence: string;
  options: string[]; // 4 choices (1 correct + 3 distractors)
  correctIndex: number;
}

export function createBarrierPrompt(
  word: VocabWord,
  allWords: VocabWord[],
  source: 'elite' | 'chest' = 'elite'
): BarrierPrompt {
  // Mask sentence with blank
  const rawExample = word.example || `The concept of ${word.word} is central to academic study.`;
  const escapedWord = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedWord, 'gi');
  const maskedSentence = rawExample.replace(regex, '________');

  // Distractors from same realm
  const otherWords = allWords
    .filter(w => w.id !== word.id && w.word.toLowerCase() !== word.word.toLowerCase())
    .map(w => w.word);

  const shuffled = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [...shuffled, word.word].sort(() => Math.random() - 0.5);
  const correctIndex = options.indexOf(word.word);

  return {
    id: `barrier_${Date.now()}_${Math.random()}`,
    source,
    word,
    maskedSentence,
    options,
    correctIndex
  };
}
