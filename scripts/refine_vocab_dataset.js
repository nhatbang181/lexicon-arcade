import fs from 'fs';

const rawData = fs.readFileSync('public/data/anki_vocab.json', 'utf8');
const data = JSON.parse(rawData);

// 1. Clean non-breaking spaces
function cleanText(str) {
  if (!str) return '';
  return str.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

const strategyCards = [];
let cleanedCount = 0;
let updatedExamplesCount = 0;

data.realms.forEach((realm) => {
  const filteredWords = [];

  realm.words.forEach((w) => {
    // Check if it's a Vietnamese Strategy / Q&A flashcard
    const isVietnameseQA =
      /[?？]/.test(w.word) ||
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(w.word) ||
      w.word.startsWith('Overall, it is clear that') ||
      w.word.startsWith("That's an interesting question") ||
      w.word.startsWith('Let me think for a second') ||
      w.word.startsWith("As far as I'm concerned");

    if (isVietnameseQA) {
      strategyCards.push({
        id: w.id,
        title: cleanText(w.word),
        category: realm.name,
        answer: cleanText(w.meaning),
        detail: cleanText(w.definition),
      });
      return; // exclude from vocab testing pool
    }

    // Clean all text fields
    w.word = cleanText(w.word);
    w.ipa = cleanText(w.ipa);
    w.pos = cleanText(w.pos).toLowerCase();
    w.meaning = cleanText(w.meaning);
    w.definition = cleanText(w.definition);
    w.example = cleanText(w.example);
    w.collocations = (w.collocations || []).map(cleanText).filter(Boolean);
    w.synonyms = (w.synonyms || []).map(cleanText).filter(Boolean);

    // Refine Collins study item cards
    if (w.example.startsWith('Study item:')) {
      updatedExamplesCount++;
      const def = w.definition;

      // Extract POS if embedded
      if (/^([A-Z\-]+)/.test(def)) {
        const rawPos = def.match(/^([A-Z\-]+)/)[1];
        if (rawPos.startsWith('N-')) w.pos = 'noun';
        else if (rawPos.startsWith('V-')) w.pos = 'verb';
        else if (rawPos.startsWith('ADJ')) w.pos = 'adjective';
        else if (rawPos.startsWith('ADV')) w.pos = 'adverb';
      }

      // Extract authentic sentence from definition if possible
      const sentences = def.split(/(?<=[.?!])\s+/);
      const sentenceWithWord = sentences.find((s) =>
        new RegExp(`\\b${escapeRegExp(w.word)}\\b`, 'i').test(s)
      );

      if (sentenceWithWord) {
        w.example = sentenceWithWord;
      } else if (sentences.length > 0) {
        w.example = sentences[0];
      }
    }

    cleanedCount++;
    filteredWords.push(w);
  });

  realm.words = filteredWords;
});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Update metadata
data.metadata.totalWords = data.realms.reduce((acc, r) => acc + r.words.length, 0);

// Save cleaned vocab
fs.writeFileSync('public/data/anki_vocab.json', JSON.stringify(data, null, 2), 'utf8');

// Save strategy handbook
fs.writeFileSync(
  'public/data/ielts_strategies.json',
  JSON.stringify(
    {
      title: 'IELTS 8.0 Master Strategy Handbook',
      totalStrategies: strategyCards.length,
      strategies: strategyCards,
    },
    null,
    2
  ),
  'utf8'
);

console.log('--- REFINEMENT COMPLETE ---');
console.log('Total pure English vocab words:', data.metadata.totalWords);
console.log('Total strategy guide cards separated:', strategyCards.length);
console.log('Study items updated with real sentences:', updatedExamplesCount);
