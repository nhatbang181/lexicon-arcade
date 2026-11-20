#!/usr/bin/env node
/**
 * data-src/reading/build_passages.mjs
 *
 * Compiles authored Reading passages from `data-src/reading/passages/*.json`:
 *  - Auto-computes exact `wordCount` and exact character offsets (`start`, `end`)
 *    for every `Span` (`evidence[]` and `mainIdeaSpan`) from `quote` inside `paragraph.text`.
 *  - Validates every passage against `ReadingPassageSchema` + [INV-R1..R7] + UK spelling + CJK.
 *  - Outputs:
 *      public/data/reading/passages/<slug>.json
 *      public/data/reading/index.json
 *      data-src/reading/blind/<slug>.blind.json (answer-stripped for rv-data-reading blind-solve)
 *
 * Usage:
 *   node data-src/reading/build_passages.mjs --check p1_001   # validate single draft
 *   node data-src/reading/build_passages.mjs                  # compile all 24 passages
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { ReadingPassageSchema } from '../../src/core/content/schemas.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const SRC_PASSAGES_DIR = path.join(ROOT, 'data-src', 'reading', 'passages');
const BLIND_DIR = path.join(ROOT, 'data-src', 'reading', 'blind');
const OUT_READING_DIR = path.join(ROOT, 'public', 'data', 'reading');
const OUT_PASSAGES_DIR = path.join(OUT_READING_DIR, 'passages');
const WORDLISTS_DIR = path.join(ROOT, 'data-src', 'wordlists');

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

const LEVEL_WORD_LIMITS = {
  P1: [650, 850],
  P2: [750, 900],
  P3: [800, 950],
};

const LEVEL_FK_LIMITS = {
  P1: [10.0, 12.0],
  P2: [11.0, 13.0],
  P3: [12.0, 15.0],
};

// ---------------------------------------------------------------------------
// Text metrics: wordCount, Flesch-Kincaid Grade, AWL/NAWL ratio, UK spelling
// ---------------------------------------------------------------------------

export function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function countSyllables(rawWord) {
  let w = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;

  // Handle common silent endings
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  w = w.replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function computeFleschKincaid(paragraphs) {
  const fullText = paragraphs.map((p) => p.text).join(' ');
  const cleaned = fullText
    .replace(/\b(Dr|Prof|Mr|Mrs|Ms|St|Fig|No|vs|al|Inc|Ltd|Jan|Feb|Mar|Apr|Aug|Sept|Oct|Nov|Dec)\./g, '$1')
    .replace(/\b(e\.g|i\.e)\./gi, 'eg');
  const sentences = cleaned
    .split(/[.!?]+(?=\s|$)/)
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z]/.test(s));
  const words = fullText.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
  if (words.length === 0 || sentences.length === 0) {
    return { grade: 0, words: words.length, sentences: sentences.length, syllables: 0 };
  }
  let syllables = 0;
  for (const w of words) {
    syllables += countSyllables(w);
  }
  const grade = 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;
  return {
    grade: Number(grade.toFixed(2)),
    words: words.length,
    sentences: sentences.length,
    syllables,
  };
}

let cachedAcademicStems = null;

function buildAcademicStemSet() {
  if (cachedAcademicStems) return cachedAcademicStems;
  const exact = new Set();
  const stems = new Set();

  const awlPath = path.join(WORDLISTS_DIR, 'awl_sublists.json');
  const nawlPath = path.join(WORDLISTS_DIR, 'nawl.json');

  const addWord = (w) => {
    const low = String(w || '').toLowerCase().trim();
    if (!low) return;
    exact.add(low);
    // Add British spelling counterpart for -ize/-yze/-or
    if (low.endsWith('ize')) exact.add(low.slice(0, -3) + 'ise');
    if (low.endsWith('yze')) exact.add(low.slice(0, -3) + 'yse');
    if (low.length >= 5) {
      stems.add(low.replace(/(?:e|y|ion|ation|ition|ment|ness|ity|al|ic|ive|ous|ise|ize|ate|ed|ing|er|or|s)$/, ''));
    }
  };

  if (fs.existsSync(awlPath)) {
    const awl = JSON.parse(fs.readFileSync(awlPath, 'utf8'));
    for (const list of Object.values(awl.sublists || {})) {
      for (const w of list) addWord(w);
    }
  }
  if (fs.existsSync(nawlPath)) {
    const nawl = JSON.parse(fs.readFileSync(nawlPath, 'utf8'));
    for (const w of nawl.words || []) addWord(w);
  }

  cachedAcademicStems = { exact, stems };
  return cachedAcademicStems;
}

function tokenIsAcademic(rawToken, academicSet) {
  const w = rawToken.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length < 4) return false;
  if (academicSet.exact.has(w)) return true;

  // Inflection stripping
  const candidates = [
    w.replace(/ies$/, 'y'),
    w.replace(/ied$/, 'y'),
    w.replace(/ves$/, 'f'),
    w.replace(/es$/, ''),
    w.replace(/s$/, ''),
    w.replace(/ed$/, ''),
    w.replace(/ed$/, 'e'),
    w.replace(/ing$/, ''),
    w.replace(/ing$/, 'e'),
    w.replace(/ly$/, ''),
    w.replace(/ally$/, ''),
    w.replace(/isation$/, 'ise'),
    w.replace(/ization$/, 'ize'),
    w.replace(/ation$/, 'ate'),
    w.replace(/ation$/, 'e'),
    w.replace(/tion$/, 'te'),
    w.replace(/tion$/, 't'),
    w.replace(/sion$/, 'de'),
    w.replace(/ment$/, ''),
    w.replace(/ness$/, ''),
    w.replace(/ity$/, ''),
    w.replace(/ity$/, 'e'),
    w.replace(/al$/, ''),
    w.replace(/al$/, 'e'),
    w.replace(/ic$/, ''),
    w.replace(/ic$/, 'y'),
    w.replace(/ive$/, ''),
    w.replace(/ive$/, 'e'),
    w.replace(/able$/, ''),
    w.replace(/able$/, 'e'),
    w.replace(/ible$/, ''),
    w.replace(/er$/, ''),
    w.replace(/er$/, 'e'),
    w.replace(/or$/, ''),
    w.replace(/ist$/, ''),
    w.replace(/ism$/, ''),
    w.replace(/ised$/, 'ise'),
    w.replace(/ising$/, 'ise'),
    w.replace(/ises$/, 'ise'),
  ];

  for (const c of candidates) {
    if (c.length >= 4 && academicSet.exact.has(c)) return true;
  }
  // Prefix/derivational check for longer academic words
  if (w.length >= 7) {
    const stripped = w.replace(/(?:ation|ition|isation|ization|mental|ically|ingly|edly|able|ible|ment|ness|tion|sion|ised|ising|ally|ity|ive|ous|ist|ism|ing|ise|ate|al|ic|ed|er|or|ly|es|s)$/, '');
    if (stripped.length >= 5 && academicSet.stems.has(stripped)) return true;
  }
  return false;
}

export function computeAcademicRatio(paragraphs) {
  const academicSet = buildAcademicStemSet();
  const fullText = paragraphs.map((p) => p.text).join(' ');
  const tokens = fullText.match(/[A-Za-z]+/g) || [];
  if (tokens.length === 0) return { ratioPct: 0, matched: 0, total: 0 };
  let matched = 0;
  for (const t of tokens) {
    if (tokenIsAcademic(t, academicSet)) matched++;
  }
  return {
    ratioPct: Number(((matched / tokens.length) * 100).toFixed(2)),
    matched,
    total: tokens.length,
  };
}

const US_SPELLING_EXCEPTIONS = new Set([
  'size', 'sizes', 'sized', 'sizing', 'oversize', 'oversized', 'resize', 'resized',
  'prize', 'prizes', 'prized', 'seize', 'seizes', 'seized', 'seizing',
  'capsize', 'capsized', 'capsizes', 'citizen', 'citizens', 'horizon', 'horizons',
  'maize', 'enzyme', 'enzymes', 'ozone', 'bronze', 'breeze', 'freeze', 'squeeze',
  'gaze', 'haze', 'maze', 'graze', 'blaze', 'daze', 'raze', 'amaze', 'craze', 'glaze', 'laze',
  'trapezoid', 'lizard', 'wizard', 'hazard', 'hazards', 'blizzard', 'quartz', 'waltz',
]);

const US_EXACT_RE = /\b(color|colors|colored|coloring|colorful|center|centers|centered|centering|behavior|behaviors|behavioral|behavioural_no|labor|labors|labored|laboring|favor|favors|favored|favoring|favorable|unfavorable|neighbor|neighbors|neighboring|neighborhood|neighborhoods|defense|defenses|offense|offenses|traveled|traveling|traveler|travelers|modeled|modeling|canceled|canceling|labeled|labeling|fueled|fueling|skeptic|skeptics|skeptical|skepticism|aluminum|gray|grays|artifact|artifacts|aging|judgment|judgments|fetus|pediatric|hemoglobin|anemia|archeology|archeological|catalog|catalogs|analyze|analyzes|analyzed|analyzing|paralyze|paralyzed|catalyze|catalyzed)\b/gi;
const US_IZE_RE = /\b[a-z]{3,}(?:ize|izes|ized|izing|ization|izations)\b/gi;

export function findUsSpellings(text) {
  const hits = new Set();
  for (const m of text.matchAll(US_EXACT_RE)) {
    hits.add(m[0]);
  }
  for (const m of text.matchAll(US_IZE_RE)) {
    const low = m[0].toLowerCase();
    if (!US_SPELLING_EXCEPTIONS.has(low)) {
      hits.add(m[0]);
    }
  }
  return [...hits];
}

// ---------------------------------------------------------------------------
// Span resolver & Passage compiler/validator
// ---------------------------------------------------------------------------

function resolveSpan(span, paraMap, label) {
  if (!span || typeof span !== 'object') {
    throw new Error(`${label}: span is missing or not an object`);
  }
  const pText = paraMap.get(span.paragraph);
  if (typeof pText !== 'string') {
    throw new Error(`${label}: unknown paragraph "${span.paragraph}"`);
  }
  const quote = span.quote;
  if (typeof quote !== 'string' || quote.length === 0) {
    throw new Error(`${label}: empty quote`);
  }

  // If explicit start/end already match verbatim, keep them
  if (
    Number.isInteger(span.start) &&
    Number.isInteger(span.end) &&
    span.start >= 0 &&
    span.end <= pText.length &&
    pText.slice(span.start, span.end) === quote
  ) {
    return { paragraph: span.paragraph, start: span.start, end: span.end, quote };
  }

  const idx = pText.indexOf(quote);
  if (idx === -1) {
    throw new Error(
      `${label}: quote not found verbatim in paragraph ${span.paragraph}: "${quote.slice(0, 80)}"`
    );
  }
  return {
    paragraph: span.paragraph,
    start: idx,
    end: idx + quote.length,
    quote,
  };
}

function countAnswerTokens(ans) {
  const tokens = String(ans || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let words = 0;
  let numbers = 0;
  for (const t of tokens) {
    const clean = t.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
    if (/^\d+(?:[.,]\d+)?%?$/.test(clean)) {
      numbers++;
    } else if (clean.length > 0) {
      words++;
    }
  }
  return { total: tokens.length, words, numbers };
}

function normalizeForVerbatimCheck(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ');
}

export function compileAndValidatePassage(rawPassage, fileLabel) {
  const errors = [];
  const warnings = [];

  // Deep clone
  const p = JSON.parse(JSON.stringify(rawPassage));

  // CJK check
  if (CJK_RE.test(JSON.stringify(p))) {
    errors.push(`${fileLabel}: CJK character detected`);
  }

  // Paragraph map
  const paraMap = new Map();
  const expectedLabels = 'ABCDEFGH'.split('');
  if (!Array.isArray(p.paragraphs) || p.paragraphs.length < 5 || p.paragraphs.length > 8) {
    errors.push(`${fileLabel}: paragraphs.length=${p.paragraphs?.length ?? 0} must be in [5, 8]`);
  } else {
    p.paragraphs.forEach((para, idx) => {
      if (para.label !== expectedLabels[idx]) {
        errors.push(`${fileLabel}: paragraph[${idx}] label "${para.label}" should be "${expectedLabels[idx]}"`);
      }
      paraMap.set(para.label, para.text);
    });
  }

  // Exact wordCount
  const fullPassageText = (p.paragraphs || []).map((x) => x.text).join(' ');
  const actualWordCount = countWords(fullPassageText);
  p.wordCount = actualWordCount;

  // [INV-R2] Word count range by level
  const [minW, maxW] = LEVEL_WORD_LIMITS[p.level] || [650, 950];
  if (actualWordCount < minW || actualWordCount > maxW) {
    errors.push(
      `[INV-R2] ${fileLabel} (${p.level}): wordCount=${actualWordCount} outside [${minW}, ${maxW}]`
    );
  }

  // [INV-R7] Readability & AWL/NAWL
  const fk = computeFleschKincaid(p.paragraphs || []);
  const [minFk, maxFk] = LEVEL_FK_LIMITS[p.level] || [10, 15];
  if (fk.grade < minFk || fk.grade > maxFk) {
    errors.push(
      `[INV-R7] ${fileLabel} (${p.level}): Flesch-Kincaid Grade=${fk.grade} outside [${minFk}, ${maxFk}] (words=${fk.words}, sents=${fk.sentences}, syl=${fk.syllables})`
    );
  }
  const acad = computeAcademicRatio(p.paragraphs || []);
  if (acad.ratioPct < 6.0) {
    errors.push(
      `[INV-R7] ${fileLabel}: AWL/NAWL ratio=${acad.ratioPct}% < 6% (${acad.matched}/${acad.total})`
    );
  }

  // UK spelling check across passage + questions
  const usHitsPassage = findUsSpellings(fullPassageText);
  if (usHitsPassage.length > 0) {
    errors.push(`${fileLabel}: US spelling in passage: ${usHitsPassage.join(', ')}`);
  }

  // Resolve all spans & validate question groups
  let totalQuestions = 0;
  const seenNumbers = new Set();
  const seenQids = new Set();
  let hasTfngOrYnng = false;
  const normFullPassage = normalizeForVerbatimCheck(fullPassageText);

  if (!Array.isArray(p.questionGroups) || p.questionGroups.length < 2) {
    errors.push(`[INV-R3] ${fileLabel}: must have >= 2 questionGroups`);
  } else {
    const groupTypes = new Set(p.questionGroups.map((g) => g.type));
    if (groupTypes.size < 2) {
      errors.push(`[INV-R3] ${fileLabel}: must have >= 2 distinct question group types`);
    }

    for (const g of p.questionGroups) {
      const qCount = Array.isArray(g.questions) ? g.questions.length : 0;
      totalQuestions += qCount;

      if (g.type === 'tfng' || g.type === 'ynng') {
        hasTfngOrYnng = true;
        if (qCount < 5 || qCount > 8) {
          errors.push(`${fileLabel} ${g.groupId}: ${g.type} must have 5-8 questions (got ${qCount})`);
        }
        const allowedKeys =
          g.type === 'tfng' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN'];
        const dist = Object.fromEntries(allowedKeys.map((k) => [k, 0]));

        for (const q of g.questions) {
          if (!allowedKeys.includes(q.answer?.key)) {
            errors.push(`${fileLabel} ${q.qid}: invalid ${g.type} answer key "${q.answer?.key}"`);
          } else {
            dist[q.answer.key]++;
          }
          if (!q.trapType) {
            errors.push(`${fileLabel} ${q.qid}: ${g.type} question missing trapType`);
          }
          if (!Array.isArray(q.steps) || q.steps.length < 2 || q.steps.length > 4) {
            errors.push(`${fileLabel} ${q.qid}: steps must have 2-4 items`);
          }
          if (!Array.isArray(q.evidence) || q.evidence.length === 0) {
            errors.push(`${fileLabel} ${q.qid}: ${g.type} question must include at least 1 evidence span`);
          }
          const usQ = findUsSpellings(q.prompt);
          if (usQ.length > 0) {
            errors.push(`${fileLabel} ${q.qid}: US spelling in prompt: ${usQ.join(', ')}`);
          }
        }

        // [INV-R4]
        for (const k of allowedKeys) {
          if (dist[k] === 0) {
            errors.push(`[INV-R4] ${fileLabel} ${g.groupId}: missing answer category "${k}"`);
          }
          if (dist[k] / qCount > 0.5) {
            errors.push(`[INV-R4] ${fileLabel} ${g.groupId}: "${k}" has ${dist[k]}/${qCount} (> 50%)`);
          }
          if (qCount === 6 && dist[k] < 2) {
            errors.push(`[INV-R4] ${fileLabel} ${g.groupId}: 6-question group requires >= 2 of "${k}" (got ${dist[k]})`);
          }
        }
      }

      if (g.type === 'headings') {
        const headingKeys = new Set((g.headings || []).map((h) => h.key));
        if (!Array.isArray(g.headings) || g.headings.length < qCount + 2) {
          errors.push(
            `[INV-R5] ${fileLabel} ${g.groupId}: headings.length (${g.headings?.length ?? 0}) < paragraphsAsked + 2 (${qCount + 2})`
          );
        }
        const usedHeadingAnswers = new Set();
        for (const q of g.questions) {
          const ansKey = q.answer?.key;
          if (!ansKey || !headingKeys.has(ansKey)) {
            errors.push(`[INV-R5] ${fileLabel} ${q.qid}: answer.key "${ansKey}" not in headings`);
          } else if (usedHeadingAnswers.has(ansKey)) {
            errors.push(`[INV-R5] ${fileLabel} ${q.qid}: duplicate heading answer "${ansKey}"`);
          } else {
            usedHeadingAnswers.add(ansKey);
          }

          if (!q.mainIdeaSpan) {
            errors.push(`[INV-R5] ${fileLabel} ${q.qid}: headings question missing mainIdeaSpan`);
          }
          if (!Array.isArray(q.headingDistractors) || q.headingDistractors.length < 2) {
            errors.push(`[INV-R5] ${fileLabel} ${q.qid}: needs >= 2 headingDistractors`);
          } else {
            const types = new Set(q.headingDistractors.map((d) => d.type));
            if (types.size < 2) {
              errors.push(`[INV-R5] ${fileLabel} ${q.qid}: headingDistractors need >= 2 distinct types`);
            }
            for (const d of q.headingDistractors) {
              if (!headingKeys.has(d.key)) {
                errors.push(`[INV-R5] ${fileLabel} ${q.qid}: distractor key "${d.key}" not in headings`);
              }
              if (d.key === ansKey) {
                errors.push(`[INV-R5] ${fileLabel} ${q.qid}: distractor key "${d.key}" equals correct answer`);
              }
            }
          }
        }
      }

      if (
        g.type === 'summary_completion' ||
        g.type === 'sentence_completion' ||
        g.type === 'table_completion' ||
        g.type === 'flowchart_completion' ||
        g.type === 'short_answer'
      ) {
        if (!g.wordLimit) {
          errors.push(`[INV-R6] ${fileLabel} ${g.groupId}: ${g.type} missing wordLimit`);
        }
        if (g.type === 'summary_completion') {
          if (!g.summaryText) {
            errors.push(`${fileLabel} ${g.groupId}: summary_completion missing summaryText`);
          } else {
            for (const q of g.questions) {
              if (!g.summaryText.includes(`[Q${q.number}]`)) {
                errors.push(`${fileLabel} ${g.groupId}: summaryText missing placeholder [Q${q.number}]`);
              }
            }
          }
        }
        for (const q of g.questions) {
          const accepted = q.answer?.accepted;
          if (!Array.isArray(accepted) || accepted.length === 0) {
            errors.push(`[INV-R6] ${fileLabel} ${q.qid}: completion missing answer.accepted`);
            continue;
          }
          for (const ans of accepted) {
            const normAns = normalizeForVerbatimCheck(ans);
            if (!normFullPassage.includes(normAns)) {
              errors.push(`[INV-R6] ${fileLabel} ${q.qid}: accepted answer "${ans}" not found verbatim in passage`);
            }
            if (g.wordLimit) {
              const tok = countAnswerTokens(ans);
              if (tok.words > g.wordLimit.words) {
                errors.push(
                  `[INV-R6] ${fileLabel} ${q.qid}: answer "${ans}" has ${tok.words} words > limit ${g.wordLimit.words}`
                );
              }
              if (!g.wordLimit.allowNumber && tok.numbers > 0) {
                errors.push(
                  `[INV-R6] ${fileLabel} ${q.qid}: answer "${ans}" contains a number but allowNumber=false`
                );
              }
              if (g.wordLimit.allowNumber && tok.numbers > 1) {
                errors.push(
                  `[INV-R6] ${fileLabel} ${q.qid}: answer "${ans}" has >1 number`
                );
              }
            }
          }
        }
      }

      if (g.type === 'mcq_single' || g.type === 'matching_features') {
        const optionKeys = new Set((g.options || []).map((o) => o.key));
        for (const q of g.questions) {
          // For mcq_single, options can be group-level or embedded in prompt; check key validity if group.options present
          if (g.options && g.options.length > 0 && q.answer?.key && !optionKeys.has(q.answer.key)) {
            errors.push(`${fileLabel} ${q.qid}: answer.key "${q.answer.key}" not in group options`);
          }
        }
      }

      if (g.type === 'matching_info') {
        for (const q of g.questions) {
          const ansKey = q.answer?.key;
          if (!ansKey || !paraMap.has(ansKey)) {
            errors.push(`${fileLabel} ${q.qid}: matching_info answer.key "${ansKey}" is not a valid paragraph label`);
          }
        }
      }

      // Resolve spans & check question numbering / qid uniqueness / explanationVi length
      for (const q of g.questions) {
        if (seenNumbers.has(q.number)) {
          errors.push(`${fileLabel}: duplicate question number ${q.number}`);
        }
        seenNumbers.add(q.number);

        if (seenQids.has(q.qid)) {
          errors.push(`${fileLabel}: duplicate qid ${q.qid}`);
        }
        seenQids.add(q.qid);

        // Resolve evidence spans
        if (Array.isArray(q.evidence)) {
          q.evidence = q.evidence.map((sp, idx) => {
            try {
              return resolveSpan(sp, paraMap, `${fileLabel} ${q.qid} evidence[${idx}]`);
            } catch (err) {
              errors.push(`[INV-R1] ${err.message}`);
              return sp;
            }
          });
        }

        // Resolve mainIdeaSpan
        if (q.mainIdeaSpan) {
          try {
            q.mainIdeaSpan = resolveSpan(q.mainIdeaSpan, paraMap, `${fileLabel} ${q.qid} mainIdeaSpan`);
          } catch (err) {
            errors.push(`[INV-R1] ${err.message}`);
          }
        }

        // Check explanationVi sentence count <= 2 (allow abbreviations)
        if (typeof q.explanationVi === 'string') {
          const sents = q.explanationVi
            .replace(/\b(vd|tr|đoạn|câu|P1|P2|P3)\./gi, '$1')
            .split(/[.!?]+(?=\s|$)/)
            .map((s) => s.trim())
            .filter(Boolean);
          if (sents.length > 2) {
            warnings.push(`${fileLabel} ${q.qid}: explanationVi has ${sents.length} sentences (spec recommends <= 2)`);
          }
        }
      }
    }
  }

  // [INV-R3] Total questions 13 or 14, numbered 1..N
  if (totalQuestions !== 13 && totalQuestions !== 14) {
    errors.push(`[INV-R3] ${fileLabel}: totalQuestions=${totalQuestions}, must be 13 or 14`);
  }
  for (let n = 1; n <= totalQuestions; n++) {
    if (!seenNumbers.has(n)) {
      errors.push(`${fileLabel}: missing question number ${n}`);
    }
  }
  if (!hasTfngOrYnng) {
    errors.push(`${fileLabel}: missing mandatory TFNG or YNNG group`);
  }

  // Zod schema validation
  const parsed = ReadingPassageSchema.safeParse(p);
  if (!parsed.success) {
    for (const issue of parsed.error.issues.slice(0, 6)) {
      errors.push(`Schema ${fileLabel} [${issue.path.join('.')}]: ${issue.message}`);
    }
  }

  return {
    passage: p,
    metrics: {
      wordCount: actualWordCount,
      paragraphs: p.paragraphs?.length ?? 0,
      questions: totalQuestions,
      fkGrade: fk.grade,
      academicPct: acad.ratioPct,
    },
    errors,
    warnings,
  };
}

export function stripAnswersForBlindSolve(passage) {
  return {
    id: passage.id,
    level: passage.level,
    reserved: Boolean(passage.reserved),
    title: passage.title,
    subtitle: passage.subtitle,
    topic: passage.topic,
    wordCount: passage.wordCount,
    paragraphs: passage.paragraphs,
    questionGroups: passage.questionGroups.map((g) => ({
      groupId: g.groupId,
      type: g.type,
      instructions: g.instructions,
      ...(g.wordLimit ? { wordLimit: g.wordLimit } : {}),
      ...(g.options ? { options: g.options } : {}),
      ...(g.headings ? { headings: g.headings } : {}),
      ...(g.summaryText ? { summaryText: g.summaryText } : {}),
      questions: g.questions.map((q) => ({
        qid: q.qid,
        number: q.number,
        prompt: q.prompt,
      })),
    })),
  };
}

function slugFromPassageId(id) {
  return id.replace(/^rp:/, '');
}

function runCli() {
  const args = process.argv.slice(2);
  const checkIdx = args.indexOf('--check');

  if (checkIdx !== -1) {
    const target = args[checkIdx + 1];
    if (!target) {
      console.error('Usage: node data-src/reading/build_passages.mjs --check <slug>');
      process.exit(1);
    }
    const fname = target.endsWith('.json') ? target : `${target}.json`;
    const full = path.isAbsolute(fname) ? fname : path.join(SRC_PASSAGES_DIR, fname);
    if (!fs.existsSync(full)) {
      console.error(`File not found: ${full}`);
      process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
    const res = compileAndValidatePassage(raw, path.basename(full));
    console.log(
      `[CHECK] ${raw.id} (${raw.level}${raw.reserved ? ' RESERVED' : ''}): ` +
        `words=${res.metrics.wordCount}, paras=${res.metrics.paragraphs}, qs=${res.metrics.questions}, ` +
        `FK=${res.metrics.fkGrade}, AWL/NAWL=${res.metrics.academicPct}%`
    );
    for (const w of res.warnings) console.log(`  [WARN] ${w}`);
    if (res.errors.length > 0) {
      for (const e of res.errors) console.error(`  [ERR] ${e}`);
      process.exit(1);
    }
    // Rewrite resolved offsets back to source file nicely formatted if --write-back passed
    if (args.includes('--write-back')) {
      fs.writeFileSync(full, JSON.stringify(res.passage, null, 2) + '\n', 'utf8');
    }
    console.log('  PASS');
    process.exit(0);
  }

  // Full compile mode
  if (!fs.existsSync(SRC_PASSAGES_DIR)) {
    console.error(`Source directory not found: ${SRC_PASSAGES_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(SRC_PASSAGES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  fs.mkdirSync(OUT_PASSAGES_DIR, { recursive: true });
  fs.mkdirSync(BLIND_DIR, { recursive: true });

  const allErrors = [];
  const allWarnings = [];
  const indexEntries = [];
  const blindBundle = [];
  const seenIds = new Set();
  const seenQids = new Set();

  for (const file of files) {
    const full = path.join(SRC_PASSAGES_DIR, file);
    const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
    const res = compileAndValidatePassage(raw, file);
    allWarnings.push(...res.warnings);
    allErrors.push(...res.errors);

    if (res.errors.length > 0) continue;

    const p = res.passage;
    if (seenIds.has(p.id)) {
      allErrors.push(`Duplicate passage id: ${p.id}`);
      continue;
    }
    seenIds.add(p.id);

    for (const g of p.questionGroups) {
      for (const q of g.questions) {
        if (seenQids.has(q.qid)) {
          allErrors.push(`Duplicate global qid: ${q.qid}`);
        }
        seenQids.add(q.qid);
      }
    }

    const slug = slugFromPassageId(p.id);
    // Persist resolved offsets back to data-src/reading/passages/<slug>.json
    fs.writeFileSync(full, JSON.stringify(p, null, 2) + '\n', 'utf8');

    // Emit public/data/reading/passages/<slug>.json
    const outPassagePath = path.join(OUT_PASSAGES_DIR, `${slug}.json`);
    fs.writeFileSync(outPassagePath, JSON.stringify(p, null, 2) + '\n', 'utf8');

    // Emit blind-solve version in data-src/reading/blind/<slug>.blind.json
    const blindObj = stripAnswersForBlindSolve(p);
    const outBlindPath = path.join(BLIND_DIR, `${slug}.blind.json`);
    fs.writeFileSync(outBlindPath, JSON.stringify(blindObj, null, 2) + '\n', 'utf8');
    blindBundle.push(blindObj);

    const qTypes = [...new Set(p.questionGroups.map((g) => g.type))];
    const qCount = p.questionGroups.reduce((sum, g) => sum + g.questions.length, 0);

    indexEntries.push({
      id: p.id,
      file: `data/reading/passages/${slug}.json`,
      level: p.level,
      reserved: Boolean(p.reserved),
      title: p.title,
      ...(p.subtitle ? { subtitle: p.subtitle } : {}),
      topic: p.topic,
      wordCount: p.wordCount,
      paragraphCount: p.paragraphs.length,
      questionCount: qCount,
      questionTypes: qTypes,
      hasTfng: qTypes.includes('tfng'),
      hasYnng: qTypes.includes('ynng'),
      hasHeadings: qTypes.includes('headings'),
    });

    console.log(
      `[OK] ${p.id.padEnd(14)} ${p.level} ${p.reserved ? 'RES' : 'TRN'} ` +
        `words=${res.metrics.wordCount} FK=${res.metrics.fkGrade} AWL=${res.metrics.academicPct}% ` +
        `qs=${qCount} [${qTypes.join(', ')}]`
    );
  }

  for (const w of allWarnings) console.log(`[WARN] ${w}`);

  if (allErrors.length > 0) {
    console.error(`\nBUILD FAILED (${allErrors.length} errors):`);
    for (const e of allErrors) console.error(`  - ${e}`);
    process.exit(1);
  }

  // Sort index cleanly: P1 training -> P2 training -> P3 training -> reserved
  indexEntries.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(
    path.join(OUT_READING_DIR, 'index.json'),
    JSON.stringify(indexEntries, null, 2) + '\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(BLIND_DIR, 'all_blind_passages.json'),
    JSON.stringify(blindBundle, null, 2) + '\n',
    'utf8'
  );

  console.log(`\nCompiled ${indexEntries.length} passages -> public/data/reading/ & data-src/reading/blind/`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runCli();
}
