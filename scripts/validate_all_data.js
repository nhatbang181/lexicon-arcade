import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkCJK(str) {
  return /[\u4e00-\u9fff]/.test(str);
}

function checkObjForCJKOrEmpty(obj, pathPrefix = '') {
  const issues = [];
  function recurse(val, currentPath) {
    if (val === null || val === undefined) {
      issues.push(`Null/undefined at ${currentPath}`);
      return;
    }
    if (typeof val === 'string') {
      if (val.trim() === '') {
        issues.push(`Empty string at ${currentPath}`);
      }
      if (checkCJK(val)) {
        issues.push(`CJK character at ${currentPath}: "${val.substring(0, 30)}..."`);
      }
    } else if (Array.isArray(val)) {
      val.forEach((item, idx) => recurse(item, `${currentPath}[${idx}]`));
    } else if (typeof val === 'object') {
      for (const [k, v] of Object.entries(val)) {
        recurse(v, `${currentPath}.${k}`);
      }
    }
  }
  recurse(obj, pathPrefix);
  return issues;
}

const report = {
  anki: { pass: true, errors: [] },
  fourSkills: { pass: true, errors: [] },
  summary: {}
};

// 1. Validate anki_vocab.json
try {
  const ankiPath = path.resolve(__dirname, '../public/data/anki_vocab.json');
  if (!fs.existsSync(ankiPath)) {
    throw new Error('anki_vocab.json not found');
  }
  const ankiData = JSON.parse(fs.readFileSync(ankiPath, 'utf8'));

  const totalWords = ankiData.metadata?.totalWords ?? 0;
  const realmWordsSum = (ankiData.realms || []).reduce((s, r) => s + (r.words ? r.words.length : 0), 0);

  if (totalWords < 2000) {
    report.anki.errors.push(`metadata.totalWords (${totalWords}) < 2000`);
  }
  if (totalWords !== realmWordsSum) {
    report.anki.errors.push(`metadata.totalWords (${totalWords}) !== realm words sum (${realmWordsSum})`);
  }

  const seenWords = new Map();
  let cjkCount = 0;
  let wordDefects = 0;

  for (const realm of ankiData.realms || []) {
    for (const w of realm.words || []) {
      const lower = (w.word || '').trim().toLowerCase();
      if (!lower) {
        wordDefects++;
        report.anki.errors.push(`Word missing or empty word field in realm ${realm.name}`);
        continue;
      }
      if (seenWords.has(lower)) {
        report.anki.errors.push(`Duplicate word found: "${lower}" (first in ${seenWords.get(lower)}, again in ${realm.name})`);
      } else {
        seenWords.set(lower, realm.name);
      }

      const jsonStr = JSON.stringify(w);
      if (checkCJK(jsonStr)) {
        cjkCount++;
      }

      const issues = [];
      if (!w.word) issues.push('word');
      if (!w.ipa) issues.push('ipa');
      if (!w.pos) issues.push('pos');
      if (!w.meaning) issues.push('meaning');
      if (!w.example || w.example.trim().length < 25) issues.push(`example (len=${(w.example||'').trim().length})`);
      if (!w.collocations || w.collocations.length < 2) issues.push(`collocations (len=${(w.collocations||[]).length})`);
      if (!w.synonyms || w.synonyms.length < 2) issues.push(`synonyms (len=${(w.synonyms||[]).length})`);

      if (issues.length > 0) {
        wordDefects++;
        if (wordDefects <= 5) {
          report.anki.errors.push(`Word "${w.word || 'UNKNOWN'}" defect: missing/invalid [${issues.join(', ')}]`);
        }
      }
    }
  }

  if (cjkCount > 0) {
    report.anki.errors.push(`Found ${cjkCount} words containing CJK characters`);
  }
  if (wordDefects > 0) {
    report.anki.errors.push(`Total ${wordDefects} words with defects`);
  }

  report.anki.pass = report.anki.errors.length === 0;
  report.summary.anki = {
    totalWords,
    realmWordsSum,
    uniqueWords: seenWords.size,
    cjkCount,
    wordDefects,
    pass: report.anki.pass
  };
} catch (err) {
  report.anki.pass = false;
  report.anki.errors.push(err.message);
}

// 2. Validate ielts_4skills.json
try {
  const fsPath = path.resolve(__dirname, '../public/data/ielts_4skills.json');
  if (!fs.existsSync(fsPath)) {
    throw new Error('ielts_4skills.json not found');
  }
  const data = JSON.parse(fs.readFileSync(fsPath, 'utf8'));

  const lCount = (data.listening || []).length;
  if (lCount < 150) {
    report.fourSkills.errors.push(`listening count (${lCount}) < 150`);
  }

  const pCount = (data.reading?.passages || []).length;
  if (pCount !== 12) {
    report.fourSkills.errors.push(`reading.passages count (${pCount}) !== 12`);
  } else {
    data.reading.passages.forEach((p, idx) => {
      const tfng = (p.tfngQuestions || []).length;
      const pt = (p.paraphraseTargets || []).length;
      if (tfng < 3) report.fourSkills.errors.push(`passage[${idx}] "${p.title}" tfngQuestions (${tfng}) < 3`);
      if (pt < 3) report.fourSkills.errors.push(`passage[${idx}] "${p.title}" paraphraseTargets (${pt}) < 3`);
    });
  }

  const rParaCount = (data.reading?.paraphrases || []).length;
  if (rParaCount < 150) {
    report.fourSkills.errors.push(`reading.paraphrases count (${rParaCount}) < 150`);
  }

  const wUpgCount = (data.writing?.upgrades || []).length;
  if (wUpgCount < 140) {
    report.fourSkills.errors.push(`writing.upgrades count (${wUpgCount}) < 140`);
  }

  const wFixCount = (data.writing?.errorFixes || []).length;
  if (wFixCount < 100) {
    report.fourSkills.errors.push(`writing.errorFixes count (${wFixCount}) < 100`);
  }

  const sPhrases = (data.speaking?.naturalPhrases || []).length;
  if (sPhrases < 50) {
    report.fourSkills.errors.push(`speaking.naturalPhrases count (${sPhrases}) < 50`);
  }

  const sFrames = (data.speaking?.part23Frameworks || []).length;
  if (sFrames < 35) {
    report.fourSkills.errors.push(`speaking.part23Frameworks count (${sFrames}) < 35`);
  }

  const sTraps = (data.speaking?.pronunciationTraps || []).length;
  if (sTraps < 45) {
    report.fourSkills.errors.push(`speaking.pronunciationTraps count (${sTraps}) < 45`);
  }

  const issues = checkObjForCJKOrEmpty(data, 'root');
  if (issues.length > 0) {
    report.fourSkills.errors.push(`Found ${issues.length} CJK/null/empty issues: ${issues.slice(0, 5).join('; ')}`);
  }

  report.fourSkills.pass = report.fourSkills.errors.length === 0;
  report.summary.fourSkills = {
    listening: lCount,
    readingPassages: pCount,
    readingParaphrases: rParaCount,
    writingUpgrades: wUpgCount,
    writingErrorFixes: wFixCount,
    speakingNaturalPhrases: sPhrases,
    speakingFrameworks: sFrames,
    speakingTraps: sTraps,
    cjkOrEmptyIssues: issues.length,
    pass: report.fourSkills.pass
  };
} catch (err) {
  report.fourSkills.pass = false;
  report.fourSkills.errors.push(err.message);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.anki.pass && report.fourSkills.pass ? 0 : 1);
