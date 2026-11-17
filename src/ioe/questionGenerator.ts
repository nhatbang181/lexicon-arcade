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

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Mask target word (and common inflections: -s, -es, -ed, -ing) inside example sentence
 */
export function maskWordInSentence(sentence: string, word: string): string {
  if (!sentence) return `Context: [ _______ ] (${word})`;
  const base = escapeRegExp(word.trim());

  // Match exact word or common morphological inflections (plural, past tense, gerund)
  const inflectionRegex = new RegExp(`\\b${base}(s|es|ed|d|ing|ly)?\\b`, 'gi');
  if (inflectionRegex.test(sentence)) {
    return sentence.replace(inflectionRegex, '[ _______ ]');
  }

  // Fallback to general substring boundary
  const subRegex = new RegExp(base, 'gi');
  if (subRegex.test(sentence)) {
    return sentence.replace(subRegex, '[ _______ ]');
  }

  return `${sentence} (Target: [ _______ ])`;
}

/**
 * Helper to pick optimal words for each round
 */
export function selectRoundCandidates(words: VocabWord[]) {
  const safeWords = words.filter((w) => w && w.word && !/[?？]/.test(w.word));

  // 1. Candidate for Scramble: clean letters, no spaces, length 4 to 12
  const scramblePool = safeWords.filter(
    (w) => /^[a-zA-Z]{4,12}$/.test(w.word.trim())
  );
  const scrambleWord =
    scramblePool.length > 0
      ? scramblePool[Math.floor(Math.random() * scramblePool.length)]
      : safeWords[0];

  // 2. Candidate for Audio: has IPA and length <= 16
  const audioPool = safeWords.filter(
    (w) => w.id !== scrambleWord.id && w.ipa && w.word.length <= 16
  );
  const audioWord =
    audioPool.length > 0
      ? audioPool[Math.floor(Math.random() * audioPool.length)]
      : safeWords.find((w) => w.id !== scrambleWord.id) || safeWords[0];

  // 3. Candidate for Cloze: authentic sentence length > 25
  const clozePool = safeWords.filter(
    (w) =>
      w.id !== scrambleWord.id &&
      w.id !== audioWord.id &&
      w.example &&
      w.example.length > 25 &&
      !w.example.startsWith('Study item:')
  );
  const clozeWord =
    clozePool.length > 0
      ? clozePool[Math.floor(Math.random() * clozePool.length)]
      : safeWords.find((w) => w.id !== scrambleWord.id && w.id !== audioWord.id) || safeWords[0];

  return { scrambleWord, audioWord, clozeWord };
}

/**
 * 1. Round 1: Word Scramble Question Generator
 */
export function generateScrambleQuestion(word: VocabWord): ScrambleQuestion {
  const cleanWord = word.word.trim();
  const letters = cleanWord.split('');
  let scrambled = shuffleArray(letters);

  // If length > 1 and shuffle happens to be identical to original, re-shuffle or swap
  if (letters.length > 1 && scrambled.join('').toLowerCase() === cleanWord.toLowerCase()) {
    for (let attempts = 0; attempts < 10; attempts++) {
      scrambled = shuffleArray(letters);
      if (scrambled.join('').toLowerCase() !== cleanWord.toLowerCase()) break;
    }
    // If still identical, swap first two distinct chars
    if (scrambled.join('').toLowerCase() === cleanWord.toLowerCase() && letters.length >= 2) {
      const idx = letters.findIndex((ch, i) => i > 0 && ch.toLowerCase() !== letters[0].toLowerCase());
      if (idx > 0) {
        const temp = scrambled[0];
        scrambled[0] = scrambled[idx];
        scrambled[idx] = temp;
      }
    }
  }

  const maskedSentence = maskWordInSentence(word.example || '', cleanWord);

  return {
    id: `scramble_${word.id}_${Date.now()}`,
    wordId: word.id,
    originalWord: cleanWord,
    scrambledLetters: scrambled,
    pos: word.pos || 'vocabulary',
    meaning: word.meaning,
    definition: word.definition,
    maskedSentence,
    ipa: word.ipa,
    realmId: word.realmId,
  };
}

/**
 * 2. Round 2: Collocation & Synonym Matching Round Generator
 */
export function generateMatchingRound(
  realmWords: VocabWord[],
  pairCount = 6
): MatchingRoundData {
  // Prioritize words with collocations or synonyms
  const richWords = realmWords.filter(
    (w) =>
      (w.collocations && w.collocations.length > 0) ||
      (w.synonyms && w.synonyms.length > 0)
  );

  const pool = richWords.length >= pairCount ? richWords : realmWords;
  const shuffledWords = shuffleArray(pool);
  const selectedWords = shuffledWords.slice(0, Math.min(pairCount, shuffledWords.length));
  const cards: MatchingCard[] = [];

  selectedWords.forEach((word, idx) => {
    const pairId = `pair_${word.id}_${idx}`;
    let leftText = '';
    let rightText = '';
    let pairType: MatchingCard['type'] = 'word';
    let label = 'Word';

    // Strategy A: Valid 2-word Collocation split (e.g. "national curriculum")
    const splittableColloc = word.collocations?.find((c) => {
      const parts = c.trim().split(/\s+/);
      return parts.length >= 2 && parts.length <= 4;
    });

    if (splittableColloc) {
      const parts = splittableColloc.trim().split(/\s+/);
      const mid = Math.ceil(parts.length / 2);
      leftText = parts.slice(0, mid).join(' ');
      rightText = parts.slice(mid).join(' ');
      pairType = 'collocation_left';
      label = 'Collocation';
    }
    // Strategy B: Word <-> Synonym (e.g. "curriculum" <-> "syllabus")
    else if (word.synonyms && word.synonyms.length > 0 && word.synonyms[0].trim()) {
      leftText = word.word;
      rightText = word.synonyms[0].trim();
      pairType = 'synonym';
      label = 'Synonym';
    }
    // Strategy C: Word <-> Concise Vietnamese Meaning
    else {
      leftText = word.word;
      // Truncate long meaning to first clause, max 35 chars
      const shortMeaning = word.meaning.split(/[,;.(]/)[0].trim().slice(0, 35);
      rightText = shortMeaning || word.meaning.slice(0, 35);
      pairType = 'meaning';
      label = 'Meaning';
    }

    cards.push({
      id: `${pairId}_A`,
      pairId,
      text: leftText,
      type: pairType,
      categoryLabel: label,
    });

    cards.push({
      id: `${pairId}_B`,
      pairId,
      text: rightText,
      type: pairType === 'collocation_left' ? 'collocation_right' : 'meaning',
      categoryLabel: label,
    });
  });

  return {
    id: `matching_round_${Date.now()}`,
    cards: shuffleArray(cards),
    totalPairs: selectedWords.length,
  };
}

/**
 * 3. Round 3: Audio Obstacle Question Generator
 */
export function generateAudioQuestion(word: VocabWord): AudioQuestion {
  const cleanWord = word.word.trim();
  const sentenceWithBlank = maskWordInSentence(word.example || '', cleanWord);

  const acceptedAnswers = [
    cleanWord.toLowerCase(),
    ...(word.synonyms || []).map((s) => s.toLowerCase().trim()),
  ];

  return {
    id: `audio_${word.id}_${Date.now()}`,
    wordId: word.id,
    audioText: cleanWord,
    sentenceWithBlank,
    ipa: word.ipa,
    pos: word.pos || 'vocabulary',
    meaning: word.meaning,
    correctAnswer: cleanWord.toLowerCase(),
    acceptedAnswers,
    realmId: word.realmId,
  };
}

/**
 * 4. Round 4: Context Mastery Cloze Question Generator
 */
export function generateClozeQuestion(
  word: VocabWord,
  realmWords: VocabWord[]
): ClozeQuestion {
  const cleanWord = word.word.trim();
  const sentenceWithBlank = maskWordInSentence(word.example || '', cleanWord);

  // Pick 3 distractors from the realm with same POS if possible
  const samePosCandidates = realmWords.filter(
    (w) =>
      w.id !== word.id &&
      w.word.toLowerCase() !== cleanWord.toLowerCase() &&
      w.pos?.toLowerCase() === word.pos?.toLowerCase() &&
      w.word.length > 2 &&
      !/[?？]/.test(w.word)
  );

  let distractorPool =
    samePosCandidates.length >= 3
      ? samePosCandidates
      : realmWords.filter(
          (w) =>
            w.id !== word.id &&
            w.word.toLowerCase() !== cleanWord.toLowerCase() &&
            !/[?？]/.test(w.word)
        );

  if (distractorPool.length < 3) {
    distractorPool = [
      { word: 'fundamental', pos: 'adjective', meaning: 'cơ bản' } as VocabWord,
      { word: 'comprehensive', pos: 'adjective', meaning: 'toàn diện' } as VocabWord,
      { word: 'phenomenon', pos: 'noun', meaning: 'hiện tượng' } as VocabWord,
    ];
  }

  const shuffledDistractors = shuffleArray(distractorPool).slice(0, 3);
  const options = shuffleArray([cleanWord, ...shuffledDistractors.map((d) => d.word.trim())]);
  const correctIndex = options.indexOf(cleanWord);

  const explanation = `${cleanWord} (${word.pos || 'từ vựng'}): ${word.meaning}.\nĐịnh nghĩa: ${
    word.definition || 'Chính xác trong ngữ cảnh.'
  }`;

  return {
    id: `cloze_${word.id}_${Date.now()}`,
    wordId: word.id,
    sentenceWithBlank,
    options,
    correctIndex,
    explanation,
    meaning: word.meaning,
    pos: word.pos || 'từ vựng',
    realmId: word.realmId,
  };
}
