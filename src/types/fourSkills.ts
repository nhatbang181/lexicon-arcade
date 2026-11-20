export type ListeningCategory =
  | 'spelling_trap'
  | 'number_date'
  | 'minimal_pair'
  | 'section4_academic';

export interface ListeningItem {
  id: string;
  word: string;
  ipa: string;
  audioText: string;
  category: ListeningCategory;
  meaningVi: string;
  trapExplanationVi: string;
  commonMistake: string;
  distractors: string[];
}

export interface ReadingHighlight {
  phrase: string;
  meaningVi: string;
  ipa?: string;
}

export type TfngAnswer = 'TRUE' | 'FALSE' | 'NOT GIVEN';

export interface TfngQuestion {
  id: string;
  statement: string;
  answer: TfngAnswer;
  evidenceQuote: string;
  explanationVi: string;
}

export interface ParaphraseTarget {
  id: string;
  questionPhrase: string;
  targetInPassage: string;
  distractors: string[];
  explanationVi: string;
}

export interface ReadingPassage {
  id: string;
  code: string;
  title: string;
  topic: string;
  paragraphs: string[];
  highlights: ReadingHighlight[];
  tfngQuestions: TfngQuestion[];
  paraphraseTargets: ParaphraseTarget[];
}

export interface ParaphraseItem {
  id: string;
  original: string;
  paraphrased: string;
  meaningVi: string;
  contextSentence: string;
  distractors: string[];
  explanationVi: string;
}

export interface ReadingSection {
  passages: ReadingPassage[];
  paraphrases: ParaphraseItem[];
}

export type WritingTaskType = 'Task 1' | 'Task 2';

export interface WritingUpgradeItem {
  id: string;
  taskType: WritingTaskType;
  category: string;
  band6Sentence: string;
  band8Sentence: string;
  targetChunk: string;
  distractors: string[];
  explanationVi: string;
}

export interface WritingErrorFixItem {
  id: string;
  category: string;
  sentenceWithError: string;
  errorSpan: string;
  correction: string;
  distractors: string[];
  fullCorrectSentence: string;
  explanationVi: string;
}

export interface WritingSection {
  upgrades: WritingUpgradeItem[];
  errorFixes: WritingErrorFixItem[];
}

export interface SpeakingPhraseItem {
  id: string;
  phrase: string;
  ipa: string;
  meaningVi: string;
  band6Equivalent: string;
  questionPrompt: string;
  sampleSentence: string;
  distractors: string[];
  explanationVi: string;
}

export interface SpeakingFrameworkStep {
  stepLabel: string;
  chunk: string;
  meaningVi: string;
}

export type SpeakingPart = 'Part 2' | 'Part 3';

export interface SpeakingFrameworkItem {
  id: string;
  part: SpeakingPart;
  topic: string;
  question: string;
  steps: SpeakingFrameworkStep[];
  fullSampleAnswer: string;
  tipsVi: string;
}

export interface PronunciationTrapItem {
  id: string;
  word: string;
  ipa: string;
  syllables: string[];
  stressIndex: number;
  commonError: string;
  meaningVi: string;
  tipVi: string;
  exampleSentence: string;
}

export interface SpeakingSection {
  naturalPhrases: SpeakingPhraseItem[];
  part23Frameworks: SpeakingFrameworkItem[];
  pronunciationTraps: PronunciationTrapItem[];
}

export interface IeltsFourSkillsMetadata {
  title: string;
  version: string;
  source: string;
  generatedAt: string;
  counts: {
    listening: number;
    readingPassages: number;
    readingParaphrases: number;
    writingUpgrades: number;
    writingErrorFixes: number;
    speakingNaturalPhrases: number;
    speakingFrameworks: number;
    speakingPronunciationTraps: number;
    speakingTotal: number;
  };
}

export interface IeltsFourSkillsData {
  metadata: IeltsFourSkillsMetadata;
  listening: ListeningItem[];
  reading: ReadingSection;
  writing: WritingSection;
  speaking: SpeakingSection;
}
