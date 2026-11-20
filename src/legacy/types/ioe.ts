import type { VocabWord } from './vocab';

export type IOERoundType = 'scramble' | 'matching' | 'audio' | 'cloze';

export interface ScrambleQuestion {
  id: string;
  wordId: string;
  originalWord: string;
  scrambledLetters: string[];
  pos: string;
  meaning: string;
  definition: string;
  maskedSentence: string;
  ipa: string;
  realmId: string;
}

export interface MatchingCard {
  id: string;
  pairId: string;
  text: string;
  type: 'collocation_left' | 'collocation_right' | 'word' | 'synonym' | 'meaning';
  categoryLabel?: string; // e.g. "Collocation", "Synonym", "Định nghĩa"
}

export interface MatchingRoundData {
  id: string;
  cards: MatchingCard[];
  totalPairs: number;
}

export interface AudioQuestion {
  id: string;
  wordId: string;
  audioText: string;
  sentenceWithBlank: string;
  ipa: string;
  pos: string;
  meaning: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
  realmId: string;
}

export interface ClozeQuestion {
  id: string;
  wordId: string;
  sentenceWithBlank: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  meaning: string;
  pos: string;
  realmId: string;
}

export interface MistakeRecord {
  id: string;
  word: string;
  meaning: string;
  ipa: string;
  pos: string;
  roundType: IOERoundType;
  failedAnswer?: string;
  correctAnswer: string;
  contextSentence?: string;
  timestamp: number;
  realmId: string;
}
