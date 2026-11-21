#!/usr/bin/env node
/**
 * data-src/speaking/build_speaking_data.mjs
 * Merges M5 Speaking batches into public/data/speaking/{part1,part2,part3,phrases}.json,
 * attaches provenance, computes estSeconds, verifies schemas & invariants [INV-S1..S3],
 * and rebuilds public/data/manifest.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  SpeakingPart1TopicSchema,
  SpeakingCueCardSchema,
  SpeakingPart3SetSchema,
  SpeakingPhraseSchema,
} from '../../src/core/content/schemas.ts';
import { buildManifest } from '../../scripts/data/60_build_manifest.mjs';

const ROOT = process.cwd();
const BATCHES_DIR = path.join(ROOT, 'data-src', 'speaking', 'batches');
const OUT_SPEAKING = path.join(ROOT, 'public', 'data', 'speaking');

const PART1_BATCHES = ['p1_01_15.json', 'p1_16_30.json'];
const PART23_BATCHES = [
  'p23_01_10.json',
  'p23_11_20.json',
  'p23_21_30.json',
  'p23_31_40.json',
];
const PHRASES_FILE = 'phrases.json';

const PROVENANCE = {
  createdBy: 'llm+review',
  source: 'llm:gemini@2026-11-21',
  license: 'own',
  qa: {
    schema: 'pass',
    verifier: 'pass',
    blindSolve: 'na',
  },
};

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const PLACEHOLDER_RE = /\b(?:TODO|TBD|FIXME|LOREM IPSUM|PLACEHOLDER)\b/i;

function countWords(str) {
  return String(str || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function writeLfJson(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const text = JSON.stringify(obj, null, 2).replace(/\r\n/g, '\n') + '\n';
  fs.writeFileSync(filePath, text, 'utf8');
}

function main() {
  const errors = [];

  // 1. Load Part 1
  const part1 = [];
  for (const fname of PART1_BATCHES) {
    const raw = fs.readFileSync(path.join(BATCHES_DIR, fname), 'utf8');
    if (CJK_RE.test(raw)) errors.push(`CJK detected in ${fname}`);
    if (PLACEHOLDER_RE.test(raw)) errors.push(`Placeholder detected in ${fname}`);
    const items = JSON.parse(raw);
    for (const item of items) {
      part1.push({ ...item, provenance: item.provenance ?? PROVENANCE });
    }
  }

  // 2. Load Part 2 & Part 3
  const part2 = [];
  const part3 = [];
  for (const fname of PART23_BATCHES) {
    const raw = fs.readFileSync(path.join(BATCHES_DIR, fname), 'utf8');
    if (CJK_RE.test(raw)) errors.push(`CJK detected in ${fname}`);
    if (PLACEHOLDER_RE.test(raw)) errors.push(`Placeholder detected in ${fname}`);
    const pairs = JSON.parse(raw);
    for (const pair of pairs) {
      const wc = countWords(pair.cueCard.band8Sample.text);
      const estSeconds = Math.round((wc / 145) * 60);
      part2.push({
        ...pair.cueCard,
        band8Sample: {
          text: pair.cueCard.band8Sample.text,
          estSeconds,
        },
        provenance: pair.cueCard.provenance ?? PROVENANCE,
      });
      part3.push({
        ...pair.part3Set,
        provenance: pair.part3Set.provenance ?? PROVENANCE,
      });
    }
  }

  // 3. Load Phrases
  const phrasesRaw = fs.readFileSync(path.join(BATCHES_DIR, PHRASES_FILE), 'utf8');
  if (CJK_RE.test(phrasesRaw)) errors.push(`CJK detected in ${PHRASES_FILE}`);
  if (PLACEHOLDER_RE.test(phrasesRaw)) errors.push(`Placeholder detected in ${PHRASES_FILE}`);
  const phrases = JSON.parse(phrasesRaw).map((p) => ({
    ...p,
    provenance: p.provenance ?? PROVENANCE,
  }));

  // 4. Audit word counts & schemas
  const p2WordCounts = [];
  const p1AreCounts = [];

  for (const t of part1) {
    const res = SpeakingPart1TopicSchema.safeParse(t);
    if (!res.success) errors.push(`Part1 ${t.id}: ${res.error.message}`);
    if (t.questions.length < 4 || t.questions.length > 5) {
      errors.push(`Part1 ${t.id}: has ${t.questions.length} questions (expected 4-5)`);
    }
    for (const q of t.questions) {
      if (!q.areSample) {
        errors.push(`Part1 ${t.id} ${q.qid}: missing areSample`);
      } else {
        const wc = countWords(`${q.areSample.answer} ${q.areSample.reason} ${q.areSample.example}`);
        p1AreCounts.push({ qid: q.qid, wc });
        if (wc < 30 || wc > 85) {
          errors.push(`Part1 ${q.qid}: areSample wordCount=${wc} outside [30, 85]`);
        }
      }
    }
  }

  for (const c of part2) {
    const res = SpeakingCueCardSchema.safeParse(c);
    if (!res.success) errors.push(`Part2 ${c.id}: ${res.error.message}`);
    const wc = countWords(c.band8Sample.text);
    p2WordCounts.push({ id: c.id, wc });
    if (wc < 250 || wc > 330) {
      errors.push(`Part2 ${c.id}: band8Sample wordCount=${wc} outside [250, 330]`);
    }
    if (c.sampleNotes.length === 0 || c.sampleNotes.length > 10) {
      errors.push(`Part2 ${c.id}: sampleNotes.length=${c.sampleNotes.length} outside [1, 10]`);
    }
  }

  for (const s of part3) {
    const res = SpeakingPart3SetSchema.safeParse(s);
    if (!res.success) errors.push(`Part3 ${s.id}: ${res.error.message}`);
    if (s.questions.length < 5) {
      errors.push(`Part3 ${s.id}: has ${s.questions.length} questions (expected >= 5)`);
    }
    for (const q of s.questions) {
      if (q.followUps.length < 2 || q.followUps.length > 3) {
        errors.push(`Part3 ${s.id} ${q.qid}: has ${q.followUps.length} followUps (expected 2-3)`);
      }
    }
  }

  for (const p of phrases) {
    const res = SpeakingPhraseSchema.safeParse(p);
    if (!res.success) errors.push(`Phrase ${p.id}: ${res.error.message}`);
  }

  // Check US spelling slips
  const US_SPELLING_RE = /\b(?:organize|organized|organizes|organizing|color|colors|colored|favorite|favorites|neighborhood|neighborhoods|traveling|traveled|center|centers|realize|realized|realizes|realizing|behavior|behaviors|recognize|recognized|recognizes|recognizing|catalog|programing|canceled|canceling|theater|theaters|meter|meters|kilometer|kilometers)\b/gi;
  const allJson = JSON.stringify({ part1, part2, part3, phrases });
  const usMatches = allJson.match(US_SPELLING_RE);
  if (usMatches) {
    errors.push(`US spelling detected (${usMatches.length}): ${[...new Set(usMatches)].join(', ')}`);
  }

  if (errors.length > 0) {
    console.error(`[build_speaking_data] FAILED (${errors.length} issues):`);
    for (const e of errors.slice(0, 40)) console.error(' -', e);
    process.exit(1);
  }

  // 5. Write output JSONs
  writeLfJson(path.join(OUT_SPEAKING, 'part1.json'), part1);
  writeLfJson(path.join(OUT_SPEAKING, 'part2.json'), part2);
  writeLfJson(path.join(OUT_SPEAKING, 'part3.json'), part3);
  writeLfJson(path.join(OUT_SPEAKING, 'phrases.json'), phrases);

  // 6. Rebuild manifest
  buildManifest(ROOT);

  const p2Min = Math.min(...p2WordCounts.map((x) => x.wc));
  const p2Max = Math.max(...p2WordCounts.map((x) => x.wc));
  const p1Min = Math.min(...p1AreCounts.map((x) => x.wc));
  const p1Max = Math.max(...p1AreCounts.map((x) => x.wc));

  console.log(
    `[build_speaking_data] OK: ${part1.length} Part 1 topics (${p1AreCounts.length} Qs, ARE ${p1Min}-${p1Max}w), ${part2.length} Part 2 cue cards (sample ${p2Min}-${p2Max}w), ${part3.length} Part 3 sets (${part3.reduce((s, x) => s + x.questions.length, 0)} Qs), ${phrases.length} phrases.`
  );
}

main();
