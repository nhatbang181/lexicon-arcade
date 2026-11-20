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

function generateInflections(base) {
  const w = base.trim().toLowerCase();
  if (!w) return [];
  const forms = new Set([w]);

  // UK <-> US variants
  if (w.endsWith('ise')) forms.add(w.slice(0, -3) + 'ize');
  if (w.endsWith('ize')) forms.add(w.slice(0, -3) + 'ise');
  if (w.endsWith('isation')) forms.add(w.slice(0, -7) + 'ization');
  if (w.endsWith('ization')) forms.add(w.slice(0, -7) + 'isation');
  if (w.endsWith('ised')) forms.add(w.slice(0, -4) + 'ized');
  if (w.endsWith('ising')) forms.add(w.slice(0, -5) + 'izing');
  if (w.includes('our') && !w.startsWith('our') && !w.includes('hour') && !w.includes('four')) {
    forms.add(w.replace(/our/g, 'or'));
  }
  if (w.endsWith('re') && w.length > 4 && !/[aeiou]re$/.test(w)) {
    forms.add(w.slice(0, -2) + 'er');
  }

  // Only generate morphological inflections for single words (or first/last word of phrase handled separately)
  if (!/\s/.test(w)) {
    forms.add(w + 's');
    forms.add(w + 'es');
    forms.add(w + 'ed');
    forms.add(w + 'ing');

    if (w.endsWith('e') && w.length > 2) {
      forms.add(w + 'd');
      if (!w.endsWith('ee') && !w.endsWith('ye') && !w.endsWith('oe')) {
        forms.add(w.slice(0, -1) + 'ing');
      }
    }
    if (w.endsWith('y') && w.length > 2 && !/[aeiou]y$/.test(w)) {
      forms.add(w.slice(0, -1) + 'ies');
      forms.add(w.slice(0, -1) + 'ied');
      forms.add(w.slice(0, -1) + 'ier');
      forms.add(w.slice(0, -1) + 'iest');
    }
    // CVC doubling for short verbs/adjs (e.g. cram -> crammed, cramming; enrol -> enrolled, enrolling)
    if (/[aeiou][^aeiouwxy]$/.test(w) && w.length >= 3) {
      const last = w[w.length - 1];
      forms.add(w + last + 'ed');
      forms.add(w + last + 'ing');
    }
    // Past/plural irregulars common in IELTS
    const irregulars = {
      rise: ['rose', 'risen', 'rising'],
      fall: ['fell', 'fallen', 'falling'],
      grow: ['grew', 'grown', 'growing'],
      lead: ['led', 'leading'],
      hold: ['held', 'holding'],
      bear: ['bore', 'borne', 'bearing'],
      drive: ['drove', 'driven', 'driving'],
      seek: ['sought', 'seeking'],
      strike: ['struck', 'striking'],
      undergo: ['underwent', 'undergone', 'undergoing'],
      overcome: ['overcame', 'overcoming'],
      withdraw: ['withdrew', 'withdrawn', 'withdrawing'],
      withstand: ['withstood', 'withstanding'],
      offset: ['offsetting'],
      outstrip: ['outstripped', 'outstripping'],
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
    if (Object.hasOwn(irregulars, w)) {
      for (const irr of irregulars[w]) forms.add(irr);
    }
  } else {
    // Multi-word phrase: allow verb inflection on first word & plural on last word
    const parts = w.split(/\s+/);
    const first = parts[0];
    const rest = parts.slice(1).join(' ');
    for (const f of generateInflections(first)) {
      forms.add(`${f} ${rest}`);
    }
    const last = parts[parts.length - 1];
    const init = parts.slice(0, -1).join(' ');
    for (const l of [last + 's', last + 'es']) {
      forms.add(`${init} ${l}`);
    }
    // Hyphenated <-> spaced
    forms.add(w.replace(/\s+/g, '-'));
  }

  if (w.includes('-')) {
    forms.add(w.replace(/-/g, ' '));
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
    const baseForms = new Set(generateInflections(hw));
    const familyForms = new Set();
    if (Array.isArray(item.family)) {
      for (const f of item.family) {
        if (f?.form) {
          familyForms.add(f.form.toLowerCase());
          for (const inf of generateInflections(f.form)) {
            familyForms.add(inf);
          }
        }
      }
    }

    const allCandidates = [...new Set([...baseForms, ...familyForms])];

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
        if (form.endsWith('ise')) accepted.add(form.slice(0, -3) + 'ize');
        if (form.endsWith('ize')) accepted.add(form.slice(0, -3) + 'ise');
        if (form.endsWith('ised')) accepted.add(form.slice(0, -4) + 'ized');
        if (form.endsWith('ising')) accepted.add(form.slice(0, -5) + 'izing');
        if (form.endsWith('isation')) accepted.add(form.slice(0, -7) + 'ization');
        if (form.includes('our') && !form.startsWith('our')) accepted.add(form.replace(/our/g, 'or'));
      }

      // Add up to 6 key inflections & family forms so V1 cloze accepts valid morphological answers
      for (const inf of generateInflections(hw).slice(0, 8)) {
        if (inf.length >= 2) accepted.add(inf);
      }
      if (Array.isArray(item.family)) {
        for (const f of item.family.slice(0, 4)) {
          if (f?.form) accepted.add(f.form.toLowerCase());
        }
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
