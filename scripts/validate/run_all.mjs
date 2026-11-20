#!/usr/bin/env node
/**
 * scripts/validate/run_all.mjs
 * Master data & asset gate validator (`npm run validate:data`).
 *
 * Validates:
 *  - 100% of public/data/vocab/**, manifest.json, tips.json, roadmap.json
 *    against the canonical Zod schemas in src/core/content/schemas.ts
 *  - All data invariants [INV-PROV], [INV-V1..V5], [INV-C1..C3], [INV-P1..P3],
 *    [INV-E1], [INV-PV1], [INV-M1]
 *  - 0 CJK characters anywhere in V3 data
 *  - 0 duplicate IDs across all V3 collections, 0 duplicate vocab headwords
 *  - MVP count thresholds (vocab >= 2000, collocations >= 600 / >= 120 headwords,
 *    paraphrases >= 300, error_patterns >= 200 / >= 15 per tag, placement >= 20/band, tips >= 60)
 *  - Delegates asset/credits checks to scripts/validate/assets_credits.mjs
 */
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { z } from 'zod';
import {
  VocabItemSchema,
  CollocationItemSchema,
  ParaphraseItemSchema,
  ErrorItemSchema,
  ErrorTagSchema,
  PlacementVocabSchema,
  ReadingPassageSchema,
  ReadingQTypeSchema,
  TopicSchema,
  ManifestSchema,
  ProvenanceSchema,
} from '../../src/core/content/schemas.ts';
import { LEGACY_FILES, countPayloadItems, sha256NormalizedLf } from '../data/60_build_manifest.mjs';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const PUBLIC_DATA = path.join(PUBLIC_DIR, 'data');
const WORDLISTS_DIR = path.join(ROOT, 'data-src', 'wordlists');
const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const REQUIRE_AUDIO = process.argv.includes('--require-audio');
const REQUIRE_BLIND = process.argv.includes('--require-blind');

const errors = [];
const warnings = [];
const summary = [];

function fail(msg) {
  errors.push(msg);
}

function wordCount(str) {
  return String(str || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function readJsonChecked(relPath) {
  const fullPath = path.join(PUBLIC_DATA, relPath);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing required data file: public/data/${relPath}`);
    return null;
  }
  const raw = fs.readFileSync(fullPath, 'utf8');
  if (CJK_RE.test(raw)) {
    fail(`CJK character detected in public/data/${relPath}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    fail(`Invalid JSON in public/data/${relPath}: ${err.message}`);
    return null;
  }
}

function checkProvenanceInv(item, fileLabel) {
  const p = item?.provenance;
  if (!p) {
    fail(`[INV-PROV] ${fileLabel} (${item?.id ?? 'unknown'}): missing provenance`);
    return;
  }
  if (typeof p.createdBy === 'string' && p.createdBy.includes('llm')) {
    if (p.qa?.verifier !== 'pass' && p.qa?.verifier !== 'fixed') {
      fail(
        `[INV-PROV] ${fileLabel} (${item.id}): createdBy="${p.createdBy}" requires qa.verifier to be "pass" or "fixed"`
      );
    }
  }
}

function simpleLemmaForms(word) {
  const w = word.toLowerCase().trim();
  const out = new Set([w, `${w}s`, `${w}es`, `${w}ed`, `${w}ing`]);
  if (w.endsWith('e')) {
    out.add(`${w}d`);
    out.add(`${w.slice(0, -1)}ing`);
  }
  if (w.endsWith('y') && w.length > 2) {
    out.add(`${w.slice(0, -1)}ies`);
    out.add(`${w.slice(0, -1)}ied`);
  }
  return [...out];
}

function exampleMatchesVocab(exampleEn, headword, family) {
  const low = exampleEn.toLowerCase();
  const candidates = [headword, ...(family || []).map((f) => f.form)];
  for (const cand of candidates) {
    const forms = simpleLemmaForms(cand);
    if (forms.some((f) => low.includes(f))) return true;
    const parts = cand.toLowerCase().trim().split(/[\s-]+/);
    if (parts.length > 1) {
      const firstForms = simpleLemmaForms(parts[0]);
      const rest = parts.slice(1).join(' ');
      if (firstForms.some((ff) => low.includes(`${ff} ${rest}`))) return true;
    }
  }
  return false;
}

const globalIds = new Set();
function registerGlobalId(id, sourceLabel) {
  if (globalIds.has(id)) {
    fail(`Duplicate global ID "${id}" in ${sourceLabel}`);
  } else {
    globalIds.add(id);
  }
}

// ---------------------------------------------------------------------------
// 1. Validate public/data/vocab/words.json
// ---------------------------------------------------------------------------

const words = readJsonChecked('vocab/words.json');
const vocabIds = new Set();
const vocabHeadwords = new Set();

if (Array.isArray(words)) {
  if (words.length < 2000) {
    fail(`vocab/words.json has ${words.length} items (MVP minimum >= 2000)`);
  }
  const audioVocabDir = path.join(PUBLIC_DIR, 'audio', 'vocab');
  const hasAudioDir = fs.existsSync(audioVocabDir);
  let audioChecked = 0;
  let audioMissing = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const parsed = VocabItemSchema.safeParse(w);
    if (!parsed.success) {
      fail(
        `vocab/words.json[${i}] (${w?.id ?? 'no-id'}) schema error: ${parsed.error.issues
          .slice(0, 2)
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ')}`
      );
      continue;
    }
    checkProvenanceInv(w, 'vocab/words.json');

    // [INV-V1]
    if (vocabIds.has(w.id)) fail(`[INV-V1] Duplicate vocab id: ${w.id}`);
    vocabIds.add(w.id);
    registerGlobalId(w.id, 'vocab/words.json');

    const headNorm = w.headword.trim().toLowerCase();
    if (vocabHeadwords.has(headNorm)) fail(`[INV-V1] Duplicate vocab headword: "${w.headword}"`);
    vocabHeadwords.add(headNorm);

    // [INV-V2] (schema already enforces /^\/.+\/$/ and no CJK, double-check)
    if (!/^\/.+\/$/.test(w.ipa.uk) || CJK_RE.test(w.ipa.uk)) {
      fail(`[INV-V2] Invalid ipa.uk for ${w.id}: "${w.ipa.uk}"`);
    }

    // [INV-V3]
    for (let ei = 0; ei < w.examples.length; ei++) {
      if (!exampleMatchesVocab(w.examples[ei].en, w.headword, w.family)) {
        fail(`[INV-V3] ${w.id} examples[${ei}] does not contain headword/family "${w.headword}"`);
      }
    }

    // [INV-V4]
    if (!/^audio\/vocab\/[a-z0-9_]+\.uk\.mp3$/.test(w.audio.uk)) {
      fail(`[INV-V4] Invalid audio.uk relative path for ${w.id}: "${w.audio.uk}"`);
    } else if (hasAudioDir || REQUIRE_AUDIO) {
      const fullAudio = path.join(PUBLIC_DIR, w.audio.uk);
      if (fs.existsSync(fullAudio)) {
        if (fs.statSync(fullAudio).size === 0) {
          fail(`[INV-V4] Empty audio file for ${w.id}: public/${w.audio.uk}`);
        } else {
          audioChecked++;
        }
      } else {
        audioMissing++;
        if (REQUIRE_AUDIO) {
          fail(`[INV-V4] Missing audio file for ${w.id}: public/${w.audio.uk}`);
        }
      }
    }
  }

  if (!hasAudioDir && !REQUIRE_AUDIO) {
    warnings.push(
      `[INV-V4] public/audio/vocab/ not yet rendered (M1 audio pipeline step) — path format validated for all ${words.length} items.`
    );
  } else {
    if (hasAudioDir && audioChecked < 537) {
      fail(`[INV-V4] Expected >= 537 rendered priority vocab audio files in public/audio/vocab/, found ${audioChecked}`);
    }
    summary.push(`Vocab audio files verified: ${audioChecked}/${words.length} non-empty`);
    if (audioMissing > 0 && !REQUIRE_AUDIO) {
      warnings.push(
        `[INV-V4] ${audioMissing} non-priority vocab audio files pending (--all); pass --require-audio to enforce 100%.`
      );
    }
  }
  summary.push(`vocab/words.json: ${words.length} items (0 schema/INV errors)`);
} else if (words !== null) {
  fail('vocab/words.json must be a JSON array');
}

// ---------------------------------------------------------------------------
// 2. Validate public/data/vocab/collocations.json & [INV-V5]
// ---------------------------------------------------------------------------

const collocations = readJsonChecked('vocab/collocations.json');
const colIds = new Set();
const colHeadwords = new Set();

if (Array.isArray(collocations)) {
  if (collocations.length < 600) {
    fail(`vocab/collocations.json has ${collocations.length} items (MVP minimum >= 600)`);
  }

  for (let i = 0; i < collocations.length; i++) {
    const c = collocations[i];
    const parsed = CollocationItemSchema.safeParse(c);
    if (!parsed.success) {
      fail(
        `vocab/collocations.json[${i}] (${c?.id ?? 'no-id'}) schema error: ${parsed.error.issues
          .slice(0, 2)
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ')}`
      );
      continue;
    }
    checkProvenanceInv(c, 'vocab/collocations.json');

    if (colIds.has(c.id)) fail(`Duplicate collocation id: ${c.id}`);
    colIds.add(c.id);
    registerGlobalId(c.id, 'vocab/collocations.json');
    colHeadwords.add(c.headwordId);

    if (vocabIds.size > 0 && !vocabIds.has(c.headwordId)) {
      fail(`Collocation ${c.id} references missing headwordId "${c.headwordId}"`);
    }

    // [INV-C2]
    const allGapAnswers = new Set();
    for (let gi = 0; gi < c.gaps.length; gi++) {
      const g = c.gaps[gi];
      if (!g.answers.includes(g.primary)) {
        fail(`[INV-C2] ${c.id} gaps[${gi}].answers does not contain primary "${g.primary}"`);
      }
      const reconstructed = g.display.replace(/_{2,}/, g.primary);
      if (reconstructed.toLowerCase() !== c.phrase.toLowerCase()) {
        fail(
          `[INV-C2] ${c.id} gaps[${gi}] "${reconstructed}" !== phrase "${c.phrase}"`
        );
      }
      for (const a of g.answers) allGapAnswers.add(a.toLowerCase());
    }

    // [INV-C1]
    const exLow = c.example.toLowerCase();
    const phLow = c.phrase.toLowerCase();
    let exHasPhrase = exLow.includes(phLow);
    if (!exHasPhrase) {
      outer: for (const g of c.gaps) {
        for (const a of g.answers) {
          for (const form of simpleLemmaForms(a)) {
            const variant = g.display.replace(/_{2,}/, form).toLowerCase();
            if (exLow.includes(variant)) {
              exHasPhrase = true;
              break outer;
            }
          }
        }
      }
    }
    if (!exHasPhrase) {
      fail(`[INV-C1] ${c.id} example does not contain phrase "${c.phrase}"`);
    }

    // [INV-C3]
    for (let ti = 0; ti < c.l1Traps.length; ti++) {
      const wrongLow = c.l1Traps[ti].wrong.trim().toLowerCase();
      if (wrongLow === phLow || allGapAnswers.has(wrongLow)) {
        fail(`[INV-C3] ${c.id} l1Traps[${ti}].wrong "${c.l1Traps[ti].wrong}" collides with phrase/answers`);
      }
    }
  }

  if (colHeadwords.size < 120) {
    fail(`vocab/collocations.json covers ${colHeadwords.size} headwords (MVP minimum >= 120)`);
  }

  // [INV-V5] Cross-check VocabItem.collocationIds -> real collocations
  if (Array.isArray(words)) {
    for (const w of words) {
      for (const cid of w.collocationIds || []) {
        if (!colIds.has(cid)) {
          fail(`[INV-V5] ${w.id} references unknown collocationId "${cid}"`);
        }
      }
    }
  }
  summary.push(
    `vocab/collocations.json: ${collocations.length} items across ${colHeadwords.size} headwords`
  );
} else if (collocations !== null) {
  fail('vocab/collocations.json must be a JSON array');
}

// ---------------------------------------------------------------------------
// 3. Validate public/data/vocab/paraphrases.json
// ---------------------------------------------------------------------------

const paraphrases = readJsonChecked('vocab/paraphrases.json');
if (Array.isArray(paraphrases)) {
  if (paraphrases.length < 300) {
    fail(`vocab/paraphrases.json has ${paraphrases.length} items (MVP minimum >= 300)`);
  }
  const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (let i = 0; i < paraphrases.length; i++) {
    const p = paraphrases[i];
    const parsed = ParaphraseItemSchema.safeParse(p);
    if (!parsed.success) {
      fail(
        `vocab/paraphrases.json[${i}] (${p?.id ?? 'no-id'}) schema error: ${parsed.error.issues
          .slice(0, 2)
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ')}`
      );
      continue;
    }
    checkProvenanceInv(p, 'vocab/paraphrases.json');
    registerGlobalId(p.id, 'vocab/paraphrases.json');
    levelCounts[p.level] = (levelCounts[p.level] || 0) + 1;

    const wc = wordCount(p.context);
    if (wc < 40 || wc > 120) {
      fail(`vocab/paraphrases.json ${p.id}: context wordCount=${wc} outside [40, 120]`);
    }

    // Level <-> relation consistency ([INV-P3])
    if (p.level === 4 && p.relation !== 'not_equivalent') {
      fail(`[INV-P3] ${p.id}: level 4 must have relation="not_equivalent"`);
    }
    if (p.level !== 4 && p.relation !== 'equivalent') {
      fail(`[INV-P3] ${p.id}: level ${p.level} must have relation="equivalent"`);
    }

    // [INV-P1] Exact slice match
    const spans = [
      { label: 'target', ...p.target },
      ...p.decoys.map((d, di) => ({ label: `decoys[${di}]`, ...d })),
    ];
    for (const s of spans) {
      if (s.start >= s.end || s.end > p.context.length) {
        fail(`[INV-P1] ${p.id} ${s.label} out-of-bounds [${s.start}, ${s.end}]`);
      } else if (p.context.slice(s.start, s.end) !== s.text) {
        fail(
          `[INV-P1] ${p.id} ${s.label} slice "${p.context.slice(s.start, s.end)}" !== "${s.text}"`
        );
      }
    }

    // [INV-P2] Non-overlapping spans
    for (let a = 0; a < spans.length; a++) {
      for (let b = a + 1; b < spans.length; b++) {
        if (!(spans[a].end <= spans[b].start || spans[a].start >= spans[b].end)) {
          fail(`[INV-P2] ${p.id} overlapping spans: ${spans[a].label} and ${spans[b].label}`);
        }
      }
    }
  }

  for (const lvl of [1, 2, 3, 4]) {
    if (levelCounts[lvl] === 0) fail(`vocab/paraphrases.json missing level ${lvl} items`);
  }
  summary.push(
    `vocab/paraphrases.json: ${paraphrases.length} items (L1:${levelCounts[1]}, L2:${levelCounts[2]}, L3:${levelCounts[3]}, L4:${levelCounts[4]})`
  );
} else if (paraphrases !== null) {
  fail('vocab/paraphrases.json must be a JSON array');
}

// ---------------------------------------------------------------------------
// 4. Validate public/data/vocab/error_patterns.json
// ---------------------------------------------------------------------------

const errorPatterns = readJsonChecked('vocab/error_patterns.json');
if (Array.isArray(errorPatterns)) {
  if (errorPatterns.length < 200) {
    fail(`vocab/error_patterns.json has ${errorPatterns.length} items (MVP minimum >= 200)`);
  }
  const tagCounts = Object.fromEntries(ErrorTagSchema.options.map((t) => [t, 0]));

  for (let i = 0; i < errorPatterns.length; i++) {
    const e = errorPatterns[i];
    const parsed = ErrorItemSchema.safeParse(e);
    if (!parsed.success) {
      fail(
        `vocab/error_patterns.json[${i}] (${e?.id ?? 'no-id'}) schema error: ${parsed.error.issues
          .slice(0, 2)
          .map((x) => `${x.path.join('.')}: ${x.message}`)
          .join('; ')}`
      );
      continue;
    }
    checkProvenanceInv(e, 'vocab/error_patterns.json');
    registerGlobalId(e.id, 'vocab/error_patterns.json');
    tagCounts[e.tag] = (tagCounts[e.tag] || 0) + 1;

    // [INV-E1]
    if (e.wrong.trim() === e.correct.trim()) {
      fail(`[INV-E1] ${e.id}: wrong === correct`);
    }
    if (
      e.errorSpan.start < 0 ||
      e.errorSpan.end > e.wrong.length ||
      e.errorSpan.start >= e.errorSpan.end
    ) {
      fail(
        `[INV-E1] ${e.id}: errorSpan [${e.errorSpan.start}, ${e.errorSpan.end}] out of range for wrong.length=${e.wrong.length}`
      );
    }
    if (wordCount(e.ruleVi) > 25) {
      fail(`vocab/error_patterns.json ${e.id}: ruleVi exceeds 25 words (${wordCount(e.ruleVi)})`);
    }
  }

  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count < 15) {
      fail(`vocab/error_patterns.json tag "${tag}" has ${count} items (minimum >= 15)`);
    }
  }
  summary.push(
    `vocab/error_patterns.json: ${errorPatterns.length} items (${Object.keys(tagCounts).length} tags, min ${Math.min(...Object.values(tagCounts))}/tag)`
  );
} else if (errorPatterns !== null) {
  fail('vocab/error_patterns.json must be a JSON array');
}

// ---------------------------------------------------------------------------
// 5. Validate public/data/vocab/placement_vocab.json
// ---------------------------------------------------------------------------

const placementVocab = readJsonChecked('vocab/placement_vocab.json');
if (placementVocab !== null) {
  const parsed = PlacementVocabSchema.safeParse(placementVocab);
  if (!parsed.success) {
    fail(
      `vocab/placement_vocab.json schema error: ${parsed.error.issues
        .slice(0, 3)
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')}`
    );
  } else {
    const bandCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const seenHead = new Set();
    for (const item of placementVocab.items) {
      registerGlobalId(item.id, 'vocab/placement_vocab.json');
      const h = item.headword.trim().toLowerCase();
      if (seenHead.has(h)) fail(`Duplicate headword in placement_vocab.json: "${item.headword}"`);
      seenHead.add(h);
      bandCounts[item.band]++;

      const opts = [item.checkMeaningVi, ...item.foilsVi].map((s) => s.trim().toLowerCase());
      if (new Set(opts).size !== 4) {
        fail(`placement_vocab.json ${item.id}: duplicate answer/foil option`);
      }
    }
    for (const b of [1, 2, 3, 4, 5, 6]) {
      if (bandCounts[b] < 20) {
        fail(`[INV-PV1] placement_vocab.json band ${b} has ${bandCounts[b]} items (minimum >= 20)`);
      }
    }
    summary.push(
      `vocab/placement_vocab.json: ${placementVocab.items.length} items (bands 1..6: ${Object.values(bandCounts).join('/')})`
    );
  }
}

// ---------------------------------------------------------------------------
// 6. Validate public/data/tips.json
// ---------------------------------------------------------------------------

const TipItemSchema = z.object({
  id: z.string().startsWith('tip:'),
  title: z.string().min(1),
  tipVi: z.string().min(1),
  detailVi: z.string().optional(),
  skill: z.enum(['general', 'listening', 'reading', 'writing', 'speaking', 'vocab']),
  category: z.string().min(1).optional(),
  provenance: ProvenanceSchema,
});

const tips = readJsonChecked('tips.json');
if (Array.isArray(tips)) {
  if (tips.length < 60) {
    fail(`tips.json has ${tips.length} items (minimum >= 60)`);
  }
  for (let i = 0; i < tips.length; i++) {
    const t = tips[i];
    const parsed = TipItemSchema.safeParse(t);
    if (!parsed.success) {
      fail(
        `tips.json[${i}] (${t?.id ?? 'no-id'}) schema error: ${parsed.error.issues
          .slice(0, 2)
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ')}`
      );
      continue;
    }
    checkProvenanceInv(t, 'tips.json');
    registerGlobalId(t.id, 'tips.json');
    if (wordCount(t.tipVi) > 25) {
      fail(`tips.json ${t.id}: tipVi exceeds 25 words (${wordCount(t.tipVi)})`);
    }
  }
  summary.push(`tips.json: ${tips.length} items (all <= 25 words)`);
} else if (tips !== null) {
  fail('tips.json must be a JSON array');
}

// ---------------------------------------------------------------------------
// 7. Validate public/data/roadmap.json
// ---------------------------------------------------------------------------

const RoadmapSchema = z.object({
  version: z.string().min(1),
  title: z.string().min(1),
  realisticDurationMonths: z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  }),
  dailyMinutesRecommended: z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  }),
  disclaimerVi: z.string().min(1),
  defaultTargetProfile: z.object({
    id: z.string().min(1),
    labelVi: z.string().min(1),
    overall: z.number(),
    listening: z.number(),
    reading: z.number(),
    writing: z.number(),
    speaking: z.number(),
  }),
  phases: z
    .array(
      z.object({
        id: z.string().startsWith('phase:'),
        code: z.enum(['G1', 'G2', 'G3', 'G4']),
        nameVi: z.string().min(1),
        weekStart: z.number().int().positive(),
        weekEnd: z.number().int().positive().nullable(),
        focusModes: z.array(z.string().min(1)).min(1),
        focusSummaryVi: z.string().min(1),
        goalSummaryVi: z.string().min(1),
        milestones: z
          .array(
            z.object({
              id: z.string().min(1),
              labelVi: z.string().min(1),
              metric: z.string().min(1),
              target: z.number(),
            })
          )
          .min(1),
        targetBands: z.object({
          listening: z.number(),
          reading: z.number(),
          writing: z.number(),
          speaking: z.number(),
          overall: z.number(),
        }),
      })
    )
    .min(4),
  provenance: ProvenanceSchema,
});

const roadmap = readJsonChecked('roadmap.json');
if (roadmap !== null) {
  const parsed = RoadmapSchema.safeParse(roadmap);
  if (!parsed.success) {
    fail(
      `roadmap.json schema error: ${parsed.error.issues
        .slice(0, 3)
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')}`
    );
  } else {
    checkProvenanceInv(roadmap, 'roadmap.json');
    for (const ph of roadmap.phases) registerGlobalId(ph.id, 'roadmap.json');
    summary.push(`roadmap.json: ${roadmap.phases.length} phases (${roadmap.phases.map((p) => p.code).join(', ')})`);
  }
}

// ---------------------------------------------------------------------------
// 7b. Validate public/data/reading/** & [INV-R1..R7]
// ---------------------------------------------------------------------------

function countSyllables(rawWord) {
  let w = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  w = w.replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

function computeFleschKincaid(paragraphs) {
  const fullText = paragraphs.map((p) => p.text).join(' ');
  const cleaned = fullText
    .replace(/\b(Dr|Prof|Mr|Mrs|Ms|St|Fig|No|vs|al|Inc|Ltd|Jan|Feb|Mar|Apr|Aug|Sept|Oct|Nov|Dec)\./g, '$1')
    .replace(/\b(e\.g|i\.e)\./gi, 'eg');
  const sentences = cleaned
    .split(/[.!?]+(?=\s|$)/)
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z]/.test(s));
  const tokens = fullText.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
  if (tokens.length === 0 || sentences.length === 0) return 0;
  let syllables = 0;
  for (const t of tokens) syllables += countSyllables(t);
  return Number((0.39 * (tokens.length / sentences.length) + 11.8 * (syllables / tokens.length) - 15.59).toFixed(2));
}

function buildAcademicWordSet() {
  const exact = new Set();
  const stems = new Set();
  const addWord = (w) => {
    const low = String(w || '').toLowerCase().trim();
    if (!low) return;
    exact.add(low);
    if (low.endsWith('ize')) exact.add(low.slice(0, -3) + 'ise');
    if (low.endsWith('yze')) exact.add(low.slice(0, -3) + 'yse');
    if (low.length >= 5) {
      stems.add(low.replace(/(?:e|y|ion|ation|ition|ment|ness|ity|al|ic|ive|ous|ise|ize|ate|ed|ing|er|or|s)$/, ''));
    }
  };
  const awlPath = path.join(WORDLISTS_DIR, 'awl_sublists.json');
  const nawlPath = path.join(WORDLISTS_DIR, 'nawl.json');
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
  return { exact, stems };
}

function computeAcademicRatioPct(paragraphs, academicSet) {
  const fullText = paragraphs.map((p) => p.text).join(' ');
  const tokens = fullText.match(/[A-Za-z]+/g) || [];
  if (tokens.length === 0) return 0;
  let matched = 0;
  for (const rawToken of tokens) {
    const w = rawToken.toLowerCase().replace(/[^a-z]/g, '');
    if (w.length < 4) continue;
    if (academicSet.exact.has(w)) {
      matched++;
      continue;
    }
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
    if (candidates.some((c) => c.length >= 4 && academicSet.exact.has(c))) {
      matched++;
      continue;
    }
    if (w.length >= 7) {
      const stripped = w.replace(
        /(?:ation|ition|isation|ization|mental|ically|ingly|edly|able|ible|ment|ness|tion|sion|ised|ising|ally|ity|ive|ous|ist|ism|ing|ise|ate|al|ic|ed|er|or|ly|es|s)$/,
        ''
      );
      if (stripped.length >= 5 && academicSet.stems.has(stripped)) matched++;
    }
  }
  return Number(((matched / tokens.length) * 100).toFixed(2));
}

function countCompletionTokens(ans) {
  const tokens = String(ans || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let wordsCnt = 0;
  let numbersCnt = 0;
  for (const t of tokens) {
    const clean = t.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
    if (/^\d+(?:[.,]\d+)?%?$/.test(clean)) numbersCnt++;
    else if (clean.length > 0) wordsCnt++;
  }
  return { wordsCnt, numbersCnt };
}

const ReadingIndexEntrySchema = z.object({
  id: z.string().startsWith('rp:'),
  file: z.string().regex(/^data\/reading\/passages\/[a-z0-9_]+\.json$/),
  level: z.enum(['P1', 'P2', 'P3']),
  reserved: z.boolean(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  topic: TopicSchema,
  wordCount: z.number().int().positive(),
  paragraphCount: z.number().int().min(5).max(8),
  questionCount: z.number().int().min(13).max(14),
  questionTypes: z.array(ReadingQTypeSchema).min(2),
  hasTfng: z.boolean(),
  hasYnng: z.boolean(),
  hasHeadings: z.boolean(),
});

const readingDir = path.join(PUBLIC_DATA, 'reading');
const readingPassagesDir = path.join(readingDir, 'passages');

if (fs.existsSync(readingDir)) {
  const readingIndex = readJsonChecked('reading/index.json');
  const academicSet = buildAcademicWordSet();

  const LEVEL_WORD_LIMITS = { P1: [650, 850], P2: [750, 900], P3: [800, 950] };
  const LEVEL_FK_LIMITS = { P1: [10.0, 12.0], P2: [11.0, 13.0], P3: [12.0, 15.0] };

  const diskPassageFiles = fs.existsSync(readingPassagesDir)
    ? fs
        .readdirSync(readingPassagesDir)
        .filter((f) => f.endsWith('.json'))
        .sort()
    : [];

  const indexByFile = new Map();
  if (Array.isArray(readingIndex)) {
    for (let i = 0; i < readingIndex.length; i++) {
      const entry = readingIndex[i];
      const parsed = ReadingIndexEntrySchema.safeParse(entry);
      if (!parsed.success) {
        fail(
          `reading/index.json[${i}] (${entry?.id ?? 'no-id'}) schema error: ${parsed.error.issues
            .slice(0, 2)
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join('; ')}`
        );
        continue;
      }
      const fname = path.basename(entry.file);
      if (indexByFile.has(fname)) {
        fail(`reading/index.json duplicate file reference: ${entry.file}`);
      }
      indexByFile.set(fname, entry);
      if (!fs.existsSync(path.join(PUBLIC_DIR, entry.file))) {
        fail(`reading/index.json references missing passage file: public/${entry.file}`);
      }
    }
  } else if (readingIndex !== null) {
    fail('reading/index.json must be a JSON array');
  }

  for (const fname of diskPassageFiles) {
    if (!indexByFile.has(fname)) {
      fail(`public/data/reading/passages/${fname} is missing from reading/index.json`);
    }
  }

  let trainingCount = 0;
  let reservedCount = 0;
  let ynngPassages = 0;
  let headingsPassages = 0;
  let headingsTrainingPassages = 0;
  let totalReadingQuestions = 0;
  let blindVerifiedCount = 0;
  const levelCounts = { P1: { training: 0, reserved: 0 }, P2: { training: 0, reserved: 0 }, P3: { training: 0, reserved: 0 } };
  const rqTypePassageCounts = {};

  for (const fname of diskPassageFiles) {
    const relPath = `reading/passages/${fname}`;
    const p = readJsonChecked(relPath);
    if (!p) continue;

    const parsed = ReadingPassageSchema.safeParse(p);
    if (!parsed.success) {
      fail(
        `${relPath} (${p?.id ?? 'no-id'}) schema error: ${parsed.error.issues
          .slice(0, 3)
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ')}`
      );
      continue;
    }

    checkProvenanceInv(p, relPath);
    registerGlobalId(p.id, relPath);

    if (p.provenance?.qa?.blindSolve === 'pass') {
      blindVerifiedCount++;
    } else if (REQUIRE_BLIND) {
      fail(`[INV-R8] ${relPath} (${p.id}): provenance.qa.blindSolve must be "pass"`);
    }

    const isReserved = p.reserved === true;
    if (isReserved) {
      reservedCount++;
      levelCounts[p.level].reserved++;
    } else {
      trainingCount++;
      levelCounts[p.level].training++;
    }

    // Paragraph map & [INV-R2]
    const paraMap = new Map();
    const expectedLabels = 'ABCDEFGH'.split('');
    if (!p.mini && (p.paragraphs.length < 5 || p.paragraphs.length > 8)) {
      fail(`[INV-R2] ${p.id}: paragraphs.length=${p.paragraphs.length} outside [5, 8]`);
    }
    p.paragraphs.forEach((para, idx) => {
      if (para.label !== expectedLabels[idx]) {
        fail(`${p.id}: paragraph[${idx}] label "${para.label}" !== "${expectedLabels[idx]}"`);
      }
      paraMap.set(para.label, para.text);
    });

    const fullPassageText = p.paragraphs.map((x) => x.text).join(' ');
    const actualWords = wordCount(fullPassageText);
    const diffRatio = Math.abs(p.wordCount - actualWords) / Math.max(1, actualWords);
    if (diffRatio > 0.02) {
      fail(`[INV-R2] ${p.id}: declared wordCount=${p.wordCount} differs >2% from actual ${actualWords}`);
    }
    if (!p.mini) {
      const [minW, maxW] = LEVEL_WORD_LIMITS[p.level];
      if (actualWords < minW || actualWords > maxW) {
        fail(`[INV-R2] ${p.id} (${p.level}): wordCount=${actualWords} outside [${minW}, ${maxW}]`);
      }

      // [INV-R7] Readability + AWL/NAWL ratio
      const fk = computeFleschKincaid(p.paragraphs);
      const [minFk, maxFk] = LEVEL_FK_LIMITS[p.level];
      if (fk < minFk || fk > maxFk) {
        fail(`[INV-R7] ${p.id} (${p.level}): Flesch-Kincaid Grade=${fk} outside [${minFk}, ${maxFk}]`);
      }
      const acadPct = computeAcademicRatioPct(p.paragraphs, academicSet);
      if (acadPct < 6.0) {
        fail(`[INV-R7] ${p.id}: AWL/NAWL ratio=${acadPct}% < 6%`);
      }
    }

    const normPassage = fullPassageText
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ');

    const validateSpan = (sp, ctxLabel) => {
      const txt = paraMap.get(sp.paragraph);
      if (typeof txt !== 'string') {
        fail(`[INV-R1] ${ctxLabel}: unknown paragraph "${sp.paragraph}"`);
        return;
      }
      if (sp.start < 0 || sp.end <= sp.start || sp.end > txt.length) {
        fail(`[INV-R1] ${ctxLabel}: span [${sp.start}, ${sp.end}] out of bounds for paragraph ${sp.paragraph}`);
        return;
      }
      if (txt.slice(sp.start, sp.end) !== sp.quote) {
        fail(`[INV-R1] ${ctxLabel}: quote does not match paragraph ${sp.paragraph}.slice(${sp.start}, ${sp.end})`);
      }
    };

    const groupTypesInPassage = new Set();
    const seenNums = new Set();
    let passageQs = 0;
    let hasJudgeGroup = false;

    for (const g of p.questionGroups) {
      groupTypesInPassage.add(g.type);
      const qLen = g.questions.length;
      passageQs += qLen;
      totalReadingQuestions += qLen;

      if (g.type === 'tfng' || g.type === 'ynng') {
        hasJudgeGroup = true;
        if (qLen < 5 || qLen > 8) {
          fail(`${p.id} ${g.groupId}: ${g.type} group has ${qLen} questions (must be 5-8)`);
        }
        const allowedKeys = g.type === 'tfng' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN'];
        const counts = Object.fromEntries(allowedKeys.map((k) => [k, 0]));
        for (const q of g.questions) {
          if (!allowedKeys.includes(q.answer?.key)) {
            fail(`[INV-R4] ${p.id} ${q.qid}: invalid ${g.type} key "${q.answer?.key}"`);
          } else {
            counts[q.answer.key]++;
          }
          if (!q.trapType) fail(`${p.id} ${q.qid}: missing trapType`);
          if (!Array.isArray(q.steps) || q.steps.length < 2 || q.steps.length > 4) {
            fail(`${p.id} ${q.qid}: steps must have 2-4 entries`);
          }
          if (!Array.isArray(q.evidence) || q.evidence.length === 0) {
            fail(`${p.id} ${q.qid}: missing evidence span`);
          }
        }
        // [INV-R4]
        for (const k of allowedKeys) {
          if (counts[k] === 0) fail(`[INV-R4] ${p.id} ${g.groupId}: missing "${k}"`);
          if (counts[k] / qLen > 0.5) fail(`[INV-R4] ${p.id} ${g.groupId}: "${k}" exceeds 50% (${counts[k]}/${qLen})`);
          if (qLen === 6 && counts[k] < 2) {
            fail(`[INV-R4] ${p.id} ${g.groupId}: 6-question group needs >= 2 "${k}" (got ${counts[k]})`);
          }
        }
      }

      if (g.type === 'headings') {
        const headingKeys = new Set((g.headings || []).map((h) => h.key));
        if (!Array.isArray(g.headings) || g.headings.length < qLen + 2) {
          fail(`[INV-R5] ${p.id} ${g.groupId}: headings.length < paragraphsAsked + 2`);
        }
        const usedKeys = new Set();
        for (const q of g.questions) {
          const ansKey = q.answer?.key;
          if (!ansKey || !headingKeys.has(ansKey)) {
            fail(`[INV-R5] ${p.id} ${q.qid}: invalid heading answer "${ansKey}"`);
          } else if (usedKeys.has(ansKey)) {
            fail(`[INV-R5] ${p.id} ${q.qid}: duplicate heading answer "${ansKey}"`);
          } else {
            usedKeys.add(ansKey);
          }
          if (!q.mainIdeaSpan) {
            fail(`[INV-R5] ${p.id} ${q.qid}: missing mainIdeaSpan`);
          }
          if (!Array.isArray(q.headingDistractors) || q.headingDistractors.length < 2) {
            fail(`[INV-R5] ${p.id} ${q.qid}: needs >= 2 headingDistractors`);
          } else {
            const types = new Set(q.headingDistractors.map((d) => d.type));
            if (types.size < 2) fail(`[INV-R5] ${p.id} ${q.qid}: headingDistractors need >= 2 distinct types`);
            for (const d of q.headingDistractors) {
              if (!headingKeys.has(d.key) || d.key === ansKey) {
                fail(`[INV-R5] ${p.id} ${q.qid}: invalid distractor key "${d.key}"`);
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
        if (!g.wordLimit) fail(`[INV-R6] ${p.id} ${g.groupId}: missing wordLimit`);
        if (g.type === 'summary_completion' && g.summaryText) {
          for (const q of g.questions) {
            if (!g.summaryText.includes(`[Q${q.number}]`)) {
              fail(`${p.id} ${g.groupId}: summaryText missing [Q${q.number}]`);
            }
          }
        }
        for (const q of g.questions) {
          const accepted = q.answer?.accepted;
          if (!Array.isArray(accepted) || accepted.length === 0) {
            fail(`[INV-R6] ${p.id} ${q.qid}: missing answer.accepted`);
            continue;
          }
          for (const ans of accepted) {
            const normAns = ans.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
            if (!normPassage.includes(normAns)) {
              fail(`[INV-R6] ${p.id} ${q.qid}: answer "${ans}" not found verbatim in passage`);
            }
            if (g.wordLimit) {
              const { wordsCnt, numbersCnt } = countCompletionTokens(ans);
              if (wordsCnt > g.wordLimit.words) {
                fail(`[INV-R6] ${p.id} ${q.qid}: "${ans}" exceeds wordLimit (${wordsCnt} > ${g.wordLimit.words})`);
              }
              if (!g.wordLimit.allowNumber && numbersCnt > 0) {
                fail(`[INV-R6] ${p.id} ${q.qid}: "${ans}" has number when allowNumber=false`);
              }
            }
          }
        }
      }

      for (const q of g.questions) {
        registerGlobalId(q.qid, relPath);
        if (seenNums.has(q.number)) fail(`${p.id}: duplicate question number ${q.number}`);
        seenNums.add(q.number);
        for (let si = 0; si < q.evidence.length; si++) {
          validateSpan(q.evidence[si], `${p.id} ${q.qid} evidence[${si}]`);
        }
        if (q.mainIdeaSpan) {
          validateSpan(q.mainIdeaSpan, `${p.id} ${q.qid} mainIdeaSpan`);
        }
      }
    }

    // [INV-R3]
    if (!p.mini) {
      if (passageQs !== 13 && passageQs !== 14) {
        fail(`[INV-R3] ${p.id}: question count=${passageQs}, must be 13 or 14`);
      }
      if (groupTypesInPassage.size < 2) {
        fail(`[INV-R3] ${p.id}: must have >= 2 distinct question group types`);
      }
      if (!hasJudgeGroup) {
        fail(`${p.id}: missing mandatory TFNG or YNNG group`);
      }
    }

    for (const t of groupTypesInPassage) {
      rqTypePassageCounts[t] = (rqTypePassageCounts[t] || 0) + 1;
    }
    if (groupTypesInPassage.has('ynng')) ynngPassages++;
    if (groupTypesInPassage.has('headings')) {
      headingsPassages++;
      if (!isReserved) headingsTrainingPassages++;
    }

    // Verify reading/index.json metadata matches passage file
    const idxEntry = indexByFile.get(fname);
    if (idxEntry) {
      if (idxEntry.id !== p.id) fail(`reading/index.json id mismatch for ${fname}`);
      if (idxEntry.level !== p.level) fail(`reading/index.json level mismatch for ${p.id}`);
      if (idxEntry.reserved !== isReserved) fail(`reading/index.json reserved mismatch for ${p.id}`);
      if (idxEntry.wordCount !== p.wordCount) fail(`reading/index.json wordCount mismatch for ${p.id}`);
      if (idxEntry.paragraphCount !== p.paragraphs.length) fail(`reading/index.json paragraphCount mismatch for ${p.id}`);
      if (idxEntry.questionCount !== passageQs) fail(`reading/index.json questionCount mismatch for ${p.id}`);
      if (idxEntry.hasTfng !== groupTypesInPassage.has('tfng')) fail(`reading/index.json hasTfng mismatch for ${p.id}`);
      if (idxEntry.hasYnng !== groupTypesInPassage.has('ynng')) fail(`reading/index.json hasYnng mismatch for ${p.id}`);
      if (idxEntry.hasHeadings !== groupTypesInPassage.has('headings')) fail(`reading/index.json hasHeadings mismatch for ${p.id}`);
    }
  }

  const totalPassages = trainingCount + reservedCount;
  if (trainingCount < 18) fail(`reading: only ${trainingCount} training passages (MVP minimum >= 18)`);
  if (reservedCount < 6) fail(`reading: only ${reservedCount} reserved passages (MVP minimum >= 6)`);
  for (const lvl of ['P1', 'P2', 'P3']) {
    if (levelCounts[lvl].training < 6) fail(`reading: ${lvl} training has ${levelCounts[lvl].training} (minimum >= 6)`);
    if (levelCounts[lvl].reserved < 2) fail(`reading: ${lvl} reserved has ${levelCounts[lvl].reserved} (minimum >= 2)`);
  }
  if (totalPassages > 0 && ynngPassages / totalPassages < 0.3) {
    fail(`reading: YNNG passages=${ynngPassages}/${totalPassages} (< 30% minimum)`);
  }
  if (headingsPassages < 16) {
    fail(`reading: headings passages=${headingsPassages} (minimum >= 16/24)`);
  }
  if (headingsTrainingPassages < 8) {
    fail(`reading: training headings passages=${headingsTrainingPassages} (R2 minimum >= 8)`);
  }
  for (const reqType of ['summary_completion', 'sentence_completion', 'mcq_single', 'matching_info', 'matching_features']) {
    const cnt = rqTypePassageCounts[reqType] || 0;
    if (cnt < 6) {
      fail(`reading: RQType "${reqType}" appears in ${cnt} passages (minimum >= 6)`);
    }
  }

  if (blindVerifiedCount < totalPassages && !REQUIRE_BLIND) {
    warnings.push(
      `[INV-R8] ${totalPassages - blindVerifiedCount}/${totalPassages} reading passages pending rv-data-reading blind-solve (pass --require-blind to enforce).`
    );
  }

  const rqSummary = Object.entries(rqTypePassageCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');
  summary.push(
    `reading: ${totalPassages} passages (${trainingCount} training + ${reservedCount} reserved; ` +
      `P1:${levelCounts.P1.training}+${levelCounts.P1.reserved}, P2:${levelCounts.P2.training}+${levelCounts.P2.reserved}, P3:${levelCounts.P3.training}+${levelCounts.P3.reserved}; ` +
      `${totalReadingQuestions} questions; ${rqSummary})`
  );
}

// ---------------------------------------------------------------------------
// 8. Validate public/data/manifest.json & [INV-M1]
// ---------------------------------------------------------------------------

function walkV3DataJson(dir, baseDir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkV3DataJson(full, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      const rel = path.relative(baseDir, full).split(path.sep).join('/');
      if (rel === 'manifest.json' || LEGACY_FILES.has(rel)) continue;
      results.push({ rel, full });
    }
  }
  return results.sort((a, b) => a.rel.localeCompare(b.rel));
}

const manifest = readJsonChecked('manifest.json');
if (manifest !== null) {
  const parsed = ManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    fail(
      `manifest.json schema error: ${parsed.error.issues
        .slice(0, 3)
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')}`
    );
  } else {
    const diskFiles = walkV3DataJson(PUBLIC_DATA, PUBLIC_DATA);
    const diskMap = new Map(diskFiles.map((f) => [f.rel, f.full]));

    // Every V3 json file on disk must be in manifest ([INV-M1])
    for (const { rel, full } of diskFiles) {
      const entry = manifest.files[rel];
      if (!entry) {
        fail(`[INV-M1] File public/data/${rel} is missing from manifest.json`);
        continue;
      }
      const rawText = fs.readFileSync(full, 'utf8');
      const actualSha = sha256NormalizedLf(rawText);
      if (entry.sha256 !== actualSha) {
        fail(`[INV-M1] SHA-256 mismatch for ${rel} in manifest.json`);
      }
      const actualCount = countPayloadItems(JSON.parse(rawText));
      if (entry.count !== actualCount) {
        fail(`[INV-M1] Count mismatch for ${rel}: manifest=${entry.count}, actual=${actualCount}`);
      }
    }

    // No dangling manifest entries
    for (const rel of Object.keys(manifest.files)) {
      if (!diskMap.has(rel)) {
        fail(`[INV-M1] Dangling entry in manifest.json (file missing): public/data/${rel}`);
      }
    }
    summary.push(`manifest.json: ${Object.keys(manifest.files).length} files verified (SHA-256 + count match)`);
  }
}

// ---------------------------------------------------------------------------
// 9. Run scripts/validate/assets_credits.mjs
// ---------------------------------------------------------------------------

console.log('=== V3 Data Validation Summary ===');
for (const line of summary) console.log(`  [OK] ${line}`);
for (const w of warnings) console.log(`  [NOTE] ${w}`);

let assetsOk = true;
try {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'validate', 'assets_credits.mjs')], {
    stdio: 'inherit',
  });
} catch {
  assetsOk = false;
  fail('scripts/validate/assets_credits.mjs FAILED');
}

if (errors.length > 0 || !assetsOk) {
  console.error(`\nDATA VALIDATION FAILED (${errors.length} error${errors.length === 1 ? '' : 's'}):`);
  for (const err of errors.slice(0, 40)) {
    console.error(`  - ${err}`);
  }
  if (errors.length > 40) {
    console.error(`  ... and ${errors.length - 40} more errors.`);
  }
  process.exit(1);
}

console.log('\nPASS: 100% V3 data schemas, invariants, manifest integrity, and asset credits verified.');
process.exit(0);
