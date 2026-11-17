import type { VocabWord } from '../types/vocab.ts';
import type { 
  ScrambleQuestion, 
  MatchingCard, 
  MatchingRoundData, 
  AudioQuestion, 
  ClozeQuestion 
} from '../types/ioe.ts';

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Mask target word inside example sentence
 */
function maskWordInSentence(sentence: string, word: string): string {
  if (!sentence) return `Context: [ _______ ] (${word})`;
  const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
  if (regex.test(sentence)) {
    return sentence.replace(regex, '[ _______ ]');
  }
  // If no word boundary match (e.g. inflections), try substring
  const subRegex = new RegExp(escapeRegExp(word), 'gi');
  if (subRegex.test(sentence)) {
    return sentence.replace(subRegex, '[ _______ ]');
  }
  return `${sentence} (Target: [ _______ ])`;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 1. Round 1: Word Scramble Question Generator
 */
export function generateScrambleQuestion(word: VocabWord): ScrambleQuestion {
  const letters = word.word.split('');
  let scrambled = shuffleArray(letters);

  // If length > 1 and shuffle happens to be identical to original, re-shuffle or swap
  if (letters.length > 1 && scrambled.join('') === word.word) {
    for (let attempts = 0; attempts < 10; attempts++) {
      scrambled = shuffleArray(letters);
      if (scrambled.join('') !== word.word) break;
    }
    // If still identical (e.g. all identical chars or unlucky), swap first two
    if (scrambled.join('') === word.word && letters[0] !== letters[1]) {
      const temp = scrambled[0];
      scrambled[0] = scrambled[1];
      scrambled[1] = temp;
    }
  }

  const maskedSentence = maskWordInSentence(word.example || '', word.word);

  return {
    id: `scramble_${word.id}_${Date.now()}`,
    wordId: word.id,
    originalWord: word.word,
    scrambledLetters: scrambled,
    pos: word.pos,
    meaning: word.meaning,
    definition: word.definition,
    maskedSentence,
    ipa: word.ipa,
    realmId: word.realmId
  };
}

/**
 * 2. Round 2: Collocation & Synonym Matching Round Generator
 */
export function generateMatchingRound(
  realmWords: VocabWord[], 
  pairCount = 6
): MatchingRoundData {
  const shuffledWords = shuffleArray(realmWords);
  const selectedWords = shuffledWords.slice(0, Math.min(pairCount, shuffledWords.length));
  const cards: MatchingCard[] = [];

  selectedWords.forEach((word, idx) => {
    const pairId = `pair_${word.id}_${idx}`;
    let leftText = '';
    let rightText = '';
    let pairType: MatchingCard['type'] = 'word';

    // Strategy A: Valid 2-word Collocation split (e.g. "national curriculum")
    const splittableColloc = word.collocations?.find(c => {
      const parts = c.trim().split(/\s+/);
      return parts.length >= 2 && parts.length <= 4;
    });

    if (splittableColloc) {
      const parts = splittableColloc.trim().split(/\s+/);
      const mid = Math.ceil(parts.length / 2);
      leftText = parts.slice(0, mid).join(' ');
      rightText = parts.slice(mid).join(' ');
      pairType = 'collocation_left';
    } 
    // Strategy B: Word <-> Synonym (e.g. "curriculum" <-> "syllabus")
    else if (word.synonyms && word.synonyms.length > 0 && word.synonyms[0].trim()) {
      leftText = word.word;
      rightText = word.synonyms[0].trim();
      pairType = 'synonym';
    } 
    // Strategy C: Word <-> Vietnamese Meaning
    else {
      leftText = word.word;
      rightText = word.meaning;
      pairType = 'meaning';
    }

    cards.push({
      id: `${pairId}_A`,
      pairId,
      text: leftText,
      type: pairType,
      categoryLabel: pairType === 'collocation_left' ? 'Collocation Part 1' : 'Word'
    });

    cards.push({
      id: `${pairId}_B`,
      pairId,
      text: rightText,
      type: pairType === 'collocation_left' ? 'collocation_right' : 'meaning',
      categoryLabel: pairType === 'collocation_left' ? 'Collocation Part 2' : (pairType === 'synonym' ? 'Synonym' : 'Meaning')
    });
  });

  return {
    id: `matching_round_${Date.now()}`,
    cards: shuffleArray(cards),
    totalPairs: selectedWords.length
  };
}

/**
 * 3. Round 3: Audio Obstacle Question Generator
 */
export function generateAudioQuestion(word: VocabWord): AudioQuestion {
  const sentenceWithBlank = maskWordInSentence(word.example || '', word.word);

  return {
    id: `audio_${word.id}_${Date.now()}`,
    wordId: word.id,
    audioText: word.word,
    sentenceWithBlank,
    ipa: word.ipa,
    pos: word.pos,
    meaning: word.meaning,
    correctAnswer: word.word.toLowerCase().trim(),
    realmId: word.realmId
  };
}

/**
 * 4. Round 4: Context Mastery Cloze Question Generator
 */
export function generateClozeQuestion(
  word: VocabWord, 
  realmWords: VocabWord[]
): ClozeQuestion {
  const sentenceWithBlank = maskWordInSentence(word.example || '', word.word);

  // Pick 3 distractors from the realm with the same POS if possible, otherwise any other word
  const samePosCandidates = realmWords.filter(
    w => w.id !== word.id && w.pos?.toLowerCase() === word.pos?.toLowerCase()
  );
  
  let distractorPool = samePosCandidates.length >= 3 
    ? samePosCandidates 
    : realmWords.filter(w => w.id !== word.id);

  if (distractorPool.length < 3) {
    // Fallback if realm is very small
    distractorPool = [
      { word: 'fundamental' } as VocabWord,
      { word: 'comprehensive' } as VocabWord,
      { word: 'phenomenon' } as VocabWord
    ];
  }

  const shuffledDistractors = shuffleArray(distractorPool).slice(0, 3);
  const options = shuffleArray([
    word.word,
    ...shuffledDistractors.map(d => d.word)
  ]);

  const correctIndex = options.indexOf(word.word);

  const explanation = `${word.word} (${word.pos}): ${word.meaning}.\nĐịnh nghĩa: ${word.definition || 'Chính xác trong ngữ cảnh.'}`;

  return {
    id: `cloze_${word.id}_${Date.now()}`,
    wordId: word.id,
    sentenceWithBlank,
    options,
    correctIndex,
    explanation,
    meaning: word.meaning,
    pos: word.pos,
    realmId: word.realmId
  };
}
