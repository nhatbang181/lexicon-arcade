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
  ManifestSchema,
  ProvenanceSchema,
} from '../../src/core/content/schemas.ts';
import { LEGACY_FILES, countPayloadItems, sha256NormalizedLf } from '../data/60_build_manifest.mjs';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const PUBLIC_DATA = path.join(PUBLIC_DIR, 'data');
const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const REQUIRE_AUDIO = process.argv.includes('--require-audio');

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
  const checkAudioFiles = REQUIRE_AUDIO || fs.existsSync(audioVocabDir);
  let audioChecked = 0;

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
    } else if (checkAudioFiles) {
      const fullAudio = path.join(PUBLIC_DIR, w.audio.uk);
      if (!fs.existsSync(fullAudio) || fs.statSync(fullAudio).size === 0) {
        fail(`[INV-V4] Missing or empty audio file for ${w.id}: public/${w.audio.uk}`);
      } else {
        audioChecked++;
      }
    }
  }

  if (!checkAudioFiles) {
    warnings.push(
      `[INV-V4] public/audio/vocab/ not yet rendered (M1 audio pipeline step) — path format validated for all ${words.length} items.`
    );
  } else {
    summary.push(`Vocab audio files verified: ${audioChecked}/${words.length}`);
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
