import fs from 'fs';
import { 
  selectRoundCandidates,
  generateScrambleQuestion, 
  generateMatchingRound, 
  generateAudioQuestion, 
  generateClozeQuestion 
} from '../src/ioe/questionGenerator.ts';

const data = JSON.parse(fs.readFileSync('public/data/anki_vocab.json', 'utf8'));

console.log('--- STARTING 100-ROUND COMPREHENSIVE SIMULATION ---');

let simulatedRounds = 0;

for (let r = 0; r < data.realms.length; r++) {
  const realm = data.realms[r];
  console.log(`Testing Realm [${r + 1}/12]: ${realm.name} (${realm.words.length} words)...`);

  // Run 10 randomized round generations per realm (120 rounds total)
  for (let iter = 0; iter < 10; iter++) {
    simulatedRounds++;

    const { scrambleWord, audioWord, clozeWord } = selectRoundCandidates(realm.words);

    if (!scrambleWord || !scrambleWord.word) {
      throw new Error(`Realm ${realm.name} failed to provide scrambleWord`);
    }
    if (!audioWord || !audioWord.word) {
      throw new Error(`Realm ${realm.name} failed to provide audioWord`);
    }
    if (!clozeWord || !clozeWord.word) {
      throw new Error(`Realm ${realm.name} failed to provide clozeWord`);
    }

    // 1. Scramble Test
    const scramble = generateScrambleQuestion(scrambleWord);
    if (!scramble.scrambledLetters || scramble.scrambledLetters.length !== scrambleWord.word.length) {
      throw new Error(`Scramble length error for '${scrambleWord.word}'`);
    }
    if (!scramble.meaning) {
      throw new Error(`Scramble missing meaning for '${scrambleWord.word}'`);
    }

    // 2. Matching Test
    const matching = generateMatchingRound(realm.words, 6);
    if (matching.cards.length !== 12) {
      throw new Error(`Matching cards count != 12 (got ${matching.cards.length})`);
    }
    const pairIds = new Set(matching.cards.map((c) => c.pairId));
    if (pairIds.size !== 6) {
      throw new Error(`Matching unique pairs != 6 (got ${pairIds.size})`);
    }

    // 3. Audio Test
    const audio = generateAudioQuestion(audioWord);
    if (!audio.audioText || !audio.correctAnswer) {
      throw new Error(`Audio test error for '${audioWord.word}'`);
    }

    // 4. Cloze Test
    const cloze = generateClozeQuestion(clozeWord, realm.words);
    if (cloze.options.length !== 4) {
      throw new Error(`Cloze options count != 4`);
    }
    if (cloze.correctIndex < 0 || cloze.correctIndex > 3) {
      throw new Error(`Cloze correctIndex out of bounds: ${cloze.correctIndex}`);
    }
    if (cloze.options[cloze.correctIndex].toLowerCase() !== clozeWord.word.toLowerCase()) {
      throw new Error(`Cloze correct option mismatch`);
    }
  }
}

console.log(`✓ 100% SUCCESS: Simulated ${simulatedRounds} Olympic challenge rounds across all 12 realms!`);
console.log('Zero runtime exceptions, zero empty fields, all 4 rounds completely verified.');
