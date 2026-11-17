import { 
  generateScrambleQuestion, 
  generateMatchingRound, 
  generateAudioQuestion, 
  generateClozeQuestion 
} from '../src/ioe/questionGenerator.ts';

function runTests() {
  const mockWord = {
    id: 'w_test_1',
    word: 'curriculum',
    ipa: '/kəˈrɪkjələm/',
    pos: 'noun',
    meaning: 'chương trình giảng dạy',
    definition: 'the subjects that are studied in a school or course',
    collocations: ['national curriculum', 'revise the curriculum'],
    example: 'Many argue that the school curriculum should include practical life skills.',
    synonyms: ['syllabus', 'programme of study'],
    realmId: 'education'
  };

  const mockRealmWords = [
    mockWord,
    {
      id: 'w_test_2',
      word: 'pedagogy',
      ipa: '/ˈpedəɡɒdʒi/',
      pos: 'noun',
      meaning: 'phương pháp sư phạm',
      definition: 'the method and practice of teaching',
      collocations: ['innovative pedagogy'],
      example: 'Modern pedagogy emphasizes student participation.',
      synonyms: ['teaching method'],
      realmId: 'education'
    },
    {
      id: 'w_test_3',
      word: 'illiteracy',
      ipa: '/ɪˈlɪtərəsi/',
      pos: 'noun',
      meaning: 'nạn mù chữ',
      definition: 'the inability to read and write',
      collocations: ['eradicate illiteracy'],
      example: 'The government aims to eradicate adult illiteracy.',
      synonyms: ['ignorance'],
      realmId: 'education'
    },
    {
      id: 'w_test_4',
      word: 'vocational',
      ipa: '/vəʊˈkeɪʃənl/',
      pos: 'adjective',
      meaning: 'hướng nghiệp',
      definition: 'connected with the skills, knowledge, etc. that you need for a job',
      collocations: ['vocational training'],
      example: 'More students are opting for vocational courses.',
      synonyms: ['occupational'],
      realmId: 'education'
    }
  ];

  // 1. Scramble Test
  const scramble = generateScrambleQuestion(mockWord);
  if (!scramble || scramble.scrambledLetters.length !== mockWord.word.length) {
    throw new Error(`Scramble length mismatch: expected ${mockWord.word.length}, got ${scramble?.scrambledLetters.length}`);
  }
  if (scramble.originalWord !== mockWord.word) {
    throw new Error(`Original word mismatch: ${scramble.originalWord}`);
  }
  console.log(`✓ Scramble generation passed for '${mockWord.word}' (${scramble.scrambledLetters.join(' ')})`);

  // 2. Matching Round Test
  const matching = generateMatchingRound(mockRealmWords, 4);
  if (!matching || matching.cards.length !== 8) { // 4 pairs = 8 cards
    throw new Error(`Matching cards count mismatch: expected 8 cards, got ${matching?.cards.length}`);
  }
  console.log(`✓ Matching round generated with ${matching.cards.length} cards (4 pairs)`);

  // 3. Audio Question Test
  const audio = generateAudioQuestion(mockWord);
  if (!audio || audio.audioText !== mockWord.word || !audio.ipa) {
    throw new Error(`Audio question generation failed for '${mockWord.word}'`);
  }
  console.log(`✓ Audio listening question generated for '${mockWord.word}'`);

  // 4. Cloze Question Test
  const cloze = generateClozeQuestion(mockWord, mockRealmWords);
  if (!cloze || cloze.options.length !== 4 || cloze.options[cloze.correctIndex] !== mockWord.word) {
    throw new Error(`Cloze question generation failed: options=${cloze?.options}`);
  }
  console.log(`✓ Context cloze question generated with 4 options. Correct index: ${cloze.correctIndex}`);

  console.log("All IOE question engine tests passed 100%!");
}

runTests();
