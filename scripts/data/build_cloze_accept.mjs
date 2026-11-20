#!/usr/bin/env node
/**
 * scripts/data/build_cloze_accept.mjs
 * Generates examples[i].clozeAccepted for every VocabItem:
 * - Detects the exact surface form used in examples[i].en (headword, family form, or inflection)
 * - Populates clozeAccepted with headword + matched surface form + valid inflections (-s/-es/-ed/-ing/-ies)
 *   + family forms + UK/US spelling variants
 * - Verifies [INV-V3] (every example contains headword or a family/inflected form)
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const VOCAB_DIR = path.join(ROOT, 'data-src', 'vocab');
const INPUT_PATH = path.join(VOCAB_DIR, 'ipa_checked_vocab.json');
const OUTPUT_PATH = path.join(VOCAB_DIR, 'cloze_ready_vocab.json');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const IRREGULAR_VERBS = {
  rise: ['rises', 'rose', 'risen', 'rising'],
  fall: ['falls', 'fell', 'fallen', 'falling'],
  grow: ['grows', 'grew', 'grown', 'growing'],
  lead: ['leads', 'led', 'leading'],
  hold: ['holds', 'held', 'holding'],
  bear: ['bears', 'bore', 'borne', 'bearing'],
  drive: ['drives', 'drove', 'driven', 'driving'],
  seek: ['seeks', 'sought', 'seeking'],
  strike: ['strikes', 'struck', 'striking'],
  undergo: ['undergoes', 'underwent', 'undergone', 'undergoing'],
  overcome: ['overcomes', 'overcame', 'overcoming'],
  withdraw: ['withdraws', 'withdrew', 'withdrawn', 'withdrawing'],
  withstand: ['withstands', 'withstood', 'withstanding'],
  offset: ['offsets', 'offsetting'],
  outstrip: ['outstrips', 'outstripped', 'outstripping'],
};

const IRREGULAR_NOUNS = {
  phenomenon: ['phenomena'],
  criterion: ['criteria'],
  curriculum: ['curricula', 'curriculums'],
  analysis: ['analyses'],
  crisis: ['crises'],
  hypothesis: ['hypotheses'],
  thesis: ['theses'],
  basis: ['bases'],
  emphasis: ['emphases'],
  medium: ['media'],
  datum: ['data'],
  stimulus: ['stimuli'],
  index: ['indices', 'indexes'],
  matrix: ['matrices', 'matrixes'],
};

function addUkUsVariants(w, forms) {
  if (w.endsWith('ise')) forms.add(w.slice(0, -3) + 'ize');
  if (w.endsWith('ize')) forms.add(w.slice(0, -3) + 'ise');
  if (w.endsWith('isation')) forms.add(w.slice(0, -7) + 'ization');
  if (w.endsWith('ization')) forms.add(w.slice(0, -7) + 'isation');
  if (w.endsWith('ised')) forms.add(w.slice(0, -4) + 'ized');
  if (w.endsWith('ized')) forms.add(w.slice(0, -4) + 'ised');
  if (w.endsWith('ising')) forms.add(w.slice(0, -5) + 'izing');
  if (w.endsWith('izing')) forms.add(w.slice(0, -5) + 'ising');
  if (w.includes('our') && !w.startsWith('our') && !w.includes('hour') && !w.includes('four')) {
    forms.add(w.replace(/our/g, 'or'));
  }
  if (w.endsWith('re') && w.length > 4 && !/[aeiou]re$/.test(w)) {
    forms.add(w.slice(0, -2) + 'er');
  }
}

function addPluralForm(w, forms) {
  if (Object.hasOwn(IRREGULAR_NOUNS, w)) {
    for (const irr of IRREGULAR_NOUNS[w]) forms.add(irr);
    return;
  }
  if (/(?:s|x|z|ch|sh)$/.test(w)) {
    forms.add(w + 'es');
  } else if (/[^aeiou]y$/.test(w) && w.length > 2) {
    forms.add(w.slice(0, -1) + 'ies');
  } else {
    forms.add(w + 's');
  }
}

function addVerbForms(w, forms) {
  if (Object.hasOwn(IRREGULAR_VERBS, w)) {
    for (const irr of IRREGULAR_VERBS[w]) forms.add(irr);
    return;
  }
  // 3rd person singular
  if (/(?:s|x|z|ch|sh|o)$/.test(w)) {
    forms.add(w + 'es');
  } else if (/[^aeiou]y$/.test(w) && w.length > 2) {
    forms.add(w.slice(0, -1) + 'ies');
  } else {
    forms.add(w + 's');
  }
  // Past / past participle
  if (w.endsWith('e') && w.length > 2) {
    forms.add(w + 'd');
  } else if (/[^aeiou]y$/.test(w) && w.length > 2) {
    forms.add(w.slice(0, -1) + 'ied');
  } else {
    forms.add(w + 'ed');
  }
  // Present participle
  if (w.endsWith('e') && w.length > 2 && !w.endsWith('ee') && !w.endsWith('ye') && !w.endsWith('oe')) {
    forms.add(w.slice(0, -1) + 'ing');
  } else {
    forms.add(w + 'ing');
  }
}

/**
 * Generates broad search candidates for matching the surface form in ex.en.
 */
function generateSearchInflections(base) {
  const w = base.trim().toLowerCase();
  if (!w) return [];
  const forms = new Set([w]);
  addUkUsVariants(w, forms);

  if (!/\s/.test(w)) {
    addPluralForm(w, forms);
    addVerbForms(w, forms);
    if (/[aeiou][^aeiouwxy]$/.test(w) && w.length >= 3) {
      const last = w[w.length - 1];
      forms.add(w + last + 'ed');
      forms.add(w + last + 'ing');
    }
    if (w.endsWith('y') && w.length > 2 && !/[aeiou]y$/.test(w)) {
      forms.add(w.slice(0, -1) + 'ier');
      forms.add(w.slice(0, -1) + 'iest');
    }
  } else {
    const parts = w.split(/\s+/);
    const first = parts[0];
    const rest = parts.slice(1).join(' ');
    for (const f of generateSearchInflections(first)) {
      forms.add(`${f} ${rest}`);
    }
    const last = parts[parts.length - 1];
    const init = parts.slice(0, -1).join(' ');
    const lastPlurals = new Set();
    addPluralForm(last, lastPlurals);
    for (const l of lastPlurals) {
      forms.add(`${init} ${l}`);
    }
    forms.add(w.replace(/\s+/g, '-'));
  }

  if (w.includes('-')) {
    forms.add(w.replace(/-/g, ' '));
  }

  return [...forms];
}

/**
 * Generates grammatically valid clozeAccepted forms based on POS (no bogus non-words).
 */
function generateValidClozeForms(base, posList = []) {
  const w = base.trim().toLowerCase();
  if (!w) return [];
  const forms = new Set([w]);
  addUkUsVariants(w, forms);

  const posSet = new Set(posList);
  if (!/\s/.test(w)) {
    if (posSet.has('n')) addPluralForm(w, forms);
    if (posSet.has('v')) addVerbForms(w, forms);
  } else {
    forms.add(w.replace(/\s+/g, '-'));
  }
  if (w.includes('-')) {
    forms.add(w.replace(/-/g, ' '));
  }

  // Also add UK/US variants of generated valid forms
  for (const f of [...forms]) {
    addUkUsVariants(f, forms);
  }

  return [...forms];
}

function findMatchedSurface(sentence, candidates) {
  // Sort longest first so multi-word phrases match before substrings
  const sorted = [...candidates].sort((a, b) => b.length - a.length);
  for (const cand of sorted) {
    const re = new RegExp(`(?<![A-Za-z])${escapeRegex(cand)}(?![A-Za-z])`, 'i');
    const m = sentence.match(re);
    if (m) return m[0].toLowerCase();
  }
  return null;
}

export function processVocabItems(items) {
  let totalExamples = 0;
  let matchedCount = 0;
  const unmatched = [];

  for (const item of items) {
    const hw = item.headword.trim();
    const baseForms = new Set(generateSearchInflections(hw));
    const familyForms = new Set();
    if (Array.isArray(item.family)) {
      for (const f of item.family) {
        if (f?.form) {
          familyForms.add(f.form.toLowerCase());
          for (const inf of generateSearchInflections(f.form)) {
            familyForms.add(inf);
          }
        }
      }
    }

    const allCandidates = [...new Set([...baseForms, ...familyForms])];
    const validClozeForms = generateValidClozeForms(hw, item.pos || []);

    for (const ex of item.examples || []) {
      totalExamples++;
      const matched = findMatchedSurface(ex.en, allCandidates);
      const accepted = new Set();

      if (matched) {
        matchedCount++;
        accepted.add(matched);
      } else {
        // Fallback: check stem match in sentence (handles rare morphological forms)
        const stem = hw.toLowerCase().length > 5 ? hw.toLowerCase().slice(0, -2) : hw.toLowerCase();
        const stemRe = new RegExp(`\\b${escapeRegex(stem)}[a-z]*\\b`, 'i');
        const sm = ex.en.match(stemRe);
        if (sm) {
          matchedCount++;
          accepted.add(sm[0].toLowerCase());
          // Also add matched form to family if not already headword inflection
          if (!item.family) item.family = [];
          if (!item.family.some((f) => f.form.toLowerCase() === sm[0].toLowerCase())) {
            item.family.push({ form: sm[0].toLowerCase(), pos: item.pos[0] || 'n' });
          }
        } else {
          unmatched.push({ id: item.id, headword: hw, en: ex.en });
        }
      }

      accepted.add(hw.toLowerCase());

      // Include UK/US variant of matched surface & headword
      for (const form of [...accepted]) {
        addUkUsVariants(form, accepted);
      }

      // Add POS-appropriate valid inflections (no bogus non-words), capped at 6 total
      for (const inf of validClozeForms) {
        if (accepted.size >= 6) break;
        if (inf.length >= 2) accepted.add(inf);
      }

      ex.clozeAccepted = [...accepted];
    }
  }

  return { totalExamples, matchedCount, unmatched };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('build_cloze_accept.mjs')) {
  const items = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  // Merge any extra vocab files in data-src/vocab/extra_*.json
  const extraFiles = fs.readdirSync(VOCAB_DIR).filter((f) => f.startsWith('extra_') && f.endsWith('.json')).sort();
  const seenHw = new Set(items.map((x) => x.headword.toLowerCase()));
  for (const ef of extraFiles) {
    const extras = JSON.parse(fs.readFileSync(path.join(VOCAB_DIR, ef), 'utf8'));
    for (const ex of extras) {
      if (!seenHw.has(ex.headword.toLowerCase())) {
        seenHw.add(ex.headword.toLowerCase());
        items.push(ex);
      }
    }
  }

  const res = processVocabItems(items);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2) + '\n', 'utf8');
  console.log(
    `[build_cloze_accept] Processed ${items.length} vocab items (${res.totalExamples} examples, ` +
    `matched=${res.matchedCount}/${res.totalExamples}, unmatched=${res.unmatched.length}) -> ${path.basename(OUTPUT_PATH)}`,
  );
  if (res.unmatched.length > 0) {
    console.error('Unmatched sample:', res.unmatched.slice(0, 10));
    process.exit(1);
  }
}
