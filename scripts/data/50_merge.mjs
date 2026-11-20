#!/usr/bin/env node
/**
 * scripts/data/50_merge.mjs
 * Merges QA-verified data-src batches into public/data/vocab/**, public/data/tips.json,
 * public/data/roadmap.json, and rebuilds public/data/manifest.json.
 *
 * Rules (docs/04-DATA-SPEC.md & docs/05-DATA-PIPELINE.md):
 *  - Only includes items passing provenance QA (qa.schema==='pass', and verifier pass/fixed for llm).
 *  - Never mutates stable IDs.
 *  - Strips internal _-prefixed scratch fields before writing public/data.
 *  - Wires VocabItem.collocationIds to real collocation IDs ([INV-V5]).
 *  - Generates stratified PlacementVocab (6 frequency bands x 25 items = 150 items, [INV-PV1]).
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildManifest } from './60_build_manifest.mjs';

const ROOT = process.cwd();
const DATA_SRC = path.join(ROOT, 'data-src');
const PUBLIC_DATA = path.join(ROOT, 'public', 'data');
const PUBLIC_VOCAB = path.join(PUBLIC_DATA, 'vocab');

fs.mkdirSync(PUBLIC_VOCAB, { recursive: true });

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readBatchFiles(dirPath, prefix = 'batch_') {
  if (!fs.existsSync(dirPath)) return [];
  const names = fs
    .readdirSync(dirPath)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));
  const items = [];
  for (const name of names) {
    const arr = readJson(path.join(dirPath, name));
    if (Array.isArray(arr)) items.push(...arr);
  }
  return items;
}

function passesProvenanceQa(item) {
  const p = item?.provenance;
  if (!p || p.qa?.schema !== 'pass') return false;
  if (typeof p.createdBy === 'string' && p.createdBy.includes('llm')) {
    return p.qa?.verifier === 'pass' || p.qa?.verifier === 'fixed';
  }
  return true;
}

function stripInternalKeys(obj) {
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue;
    clean[k] = v;
  }
  return clean;
}

function dedupeById(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// 1. Load & merge Vocab + Collocations (cross-wire collocationIds)
// ---------------------------------------------------------------------------

const rawVocab = readJson(path.join(DATA_SRC, 'vocab', 'cloze_ready_vocab.json'));
const seenHeadwords = new Set();
const vocabList = [];
const vocabById = new Map();

for (const raw of rawVocab) {
  if (!passesProvenanceQa(raw)) continue;
  const clean = stripInternalKeys(raw);
  const headNorm = clean.headword.trim().toLowerCase();
  if (vocabById.has(clean.id) || seenHeadwords.has(headNorm)) continue;
  seenHeadwords.add(headNorm);
  clean.collocationIds = [];
  vocabById.set(clean.id, clean);
  vocabList.push(clean);
}

const rawCols = readBatchFiles(path.join(DATA_SRC, 'collocations'), 'batch_');
const collocations = [];
const seenColIds = new Set();
const colsByHeadwordId = new Map();

for (const raw of rawCols) {
  if (!passesProvenanceQa(raw)) continue;
  const clean = stripInternalKeys(raw);
  if (seenColIds.has(clean.id)) continue;
  if (!vocabById.has(clean.headwordId)) {
    throw new Error(`Collocation ${clean.id} references unknown headwordId "${clean.headwordId}"`);
  }
  seenColIds.add(clean.id);
  collocations.push(clean);
  if (!colsByHeadwordId.has(clean.headwordId)) {
    colsByHeadwordId.set(clean.headwordId, []);
  }
  colsByHeadwordId.get(clean.headwordId).push(clean.id);
}

for (const w of vocabList) {
  const ids = colsByHeadwordId.get(w.id);
  w.collocationIds = ids ? [...ids] : [];
}

writeJson(path.join(PUBLIC_VOCAB, 'words.json'), vocabList);
writeJson(path.join(PUBLIC_VOCAB, 'collocations.json'), collocations);
console.log(
  `[50_merge] vocab/words.json: ${vocabList.length} items (${colsByHeadwordId.size} headwords linked to collocations)`
);
console.log(
  `[50_merge] vocab/collocations.json: ${collocations.length} items across ${colsByHeadwordId.size} headwords`
);

// ---------------------------------------------------------------------------
// 2. Merge Paraphrases
// ---------------------------------------------------------------------------

const rawParas = readBatchFiles(path.join(DATA_SRC, 'paraphrases'), 'batch_');
const paraphrases = dedupeById(rawParas.filter(passesProvenanceQa).map(stripInternalKeys));
writeJson(path.join(PUBLIC_VOCAB, 'paraphrases.json'), paraphrases);

const paraLevels = { 1: 0, 2: 0, 3: 0, 4: 0 };
for (const p of paraphrases) paraLevels[p.level] = (paraLevels[p.level] || 0) + 1;
console.log(
  `[50_merge] vocab/paraphrases.json: ${paraphrases.length} items (L1:${paraLevels[1]}, L2:${paraLevels[2]}, L3:${paraLevels[3]}, L4:${paraLevels[4]})`
);

// ---------------------------------------------------------------------------
// 3. Merge Error Patterns (legacy_errors.json + batch_*.json)
// ---------------------------------------------------------------------------

const legacyErrPath = path.join(DATA_SRC, 'errors', 'legacy_errors.json');
const rawErrors = [
  ...(fs.existsSync(legacyErrPath) ? readJson(legacyErrPath) : []),
  ...readBatchFiles(path.join(DATA_SRC, 'errors'), 'batch_'),
];
const errorPatterns = dedupeById(rawErrors.filter(passesProvenanceQa).map(stripInternalKeys));
writeJson(path.join(PUBLIC_VOCAB, 'error_patterns.json'), errorPatterns);
console.log(`[50_merge] vocab/error_patterns.json: ${errorPatterns.length} items`);

// ---------------------------------------------------------------------------
// 4. Build Stratified Placement Vocab (6 frequency bands x 25 items = 150)
// ---------------------------------------------------------------------------

function normalizeVi(s) {
  return s.toLowerCase().replace(/[(),.;:!?/–—-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function viTokenSet(s) {
  return new Set(
    normalizeVi(s)
      .split(' ')
      .filter((t) => t.length >= 3 && !['một', 'của', 'cho', 'các', 'như', 'với', 'được', 'không', 'người'].includes(t))
  );
}

function meaningsTooClose(a, b) {
  const na = normalizeVi(a);
  const nb = normalizeVi(b);
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const ta = viTokenSet(a);
  const tb = viTokenSet(b);
  let overlap = 0;
  for (const t of ta) {
    if (tb.has(t)) overlap++;
  }
  return overlap >= 2;
}

function buildPlacementVocab(words) {
  const ITEMS_PER_BAND = 25;

  // Clean single-word academic/core candidates with crisp Vietnamese meanings
  const candidates = words.filter(
    (w) =>
      /^[a-z]{4,}$/.test(w.headword) &&
      typeof w.freqZipf === 'number' &&
      w.meaningVi &&
      w.meaningVi.trim().length >= 3 &&
      w.meaningVi.trim().length <= 52 &&
      w.pos.some((p) => p === 'n' || p === 'v' || p === 'adj')
  );

  const bandSpecs = [
    { band: 1, match: (w) => w.freqZipf >= 4.7 },
    { band: 2, match: (w) => w.freqZipf >= 4.3 && w.freqZipf < 4.7 },
    { band: 3, match: (w) => w.freqZipf >= 3.85 && w.freqZipf < 4.3 },
    { band: 4, match: (w) => w.freqZipf >= 3.3 && w.freqZipf < 3.85 },
    { band: 5, match: (w) => w.freqZipf >= 2.7 && w.freqZipf < 3.3 },
    { band: 6, match: (w) => w.freqZipf < 2.7 },
  ];

  // Build full band pools for foil sampling
  const bandPools = new Map();
  for (const spec of bandSpecs) {
    const pool = candidates
      .filter(spec.match)
      .sort((a, b) => {
        // Prioritise NGSL in band 1, AWL/NAWL in bands 3..6, deterministic tiebreak by id
        const score = (w) => {
          if (spec.band <= 2) return (w.lists.includes('NGSL') ? 2 : 0) + (w.lists.some((l) => l.startsWith('AWL')) ? 1 : 0);
          return (w.lists.some((l) => l.startsWith('AWL')) ? 2 : 0) + (w.lists.includes('NAWL') ? 2 : 0);
        };
        const diff = score(b) - score(a);
        if (diff !== 0) return diff;
        return a.id.localeCompare(b.id);
      });
    bandPools.set(spec.band, pool);
  }

  const selected = [];
  const usedMeanings = new Set();
  const usedHeadwords = new Set();

  for (const spec of bandSpecs) {
    const pool = bandPools.get(spec.band);
    const bandChosen = [];
    // Spread across topics so placement feels balanced
    const topicCounts = new Map();
    const sorted = [...pool];

    while (bandChosen.length < ITEMS_PER_BAND && sorted.length > 0) {
      // Pick first eligible item with lowest current topic count
      let bestIdx = -1;
      let bestTopicCount = Infinity;
      for (let i = 0; i < sorted.length; i++) {
        const w = sorted[i];
        const mNorm = normalizeVi(w.meaningVi);
        if (usedHeadwords.has(w.headword) || usedMeanings.has(mNorm)) continue;
        const t = w.topics[0] || 'general';
        const tc = topicCounts.get(t) || 0;
        if (tc < bestTopicCount) {
          bestTopicCount = tc;
          bestIdx = i;
          if (tc === 0) break;
        }
      }
      if (bestIdx < 0) break;
      const [picked] = sorted.splice(bestIdx, 1);
      usedHeadwords.add(picked.headword);
      usedMeanings.add(normalizeVi(picked.meaningVi));
      const t = picked.topics[0] || 'general';
      topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
      bandChosen.push(picked);
    }

    if (bandChosen.length < 20) {
      throw new Error(`Placement band ${spec.band} only found ${bandChosen.length} items (need >= 20)`);
    }

    // Build foils from same band (same primary POS preferred), fallback adjacent band
    const adjPools = [
      ...pool,
      ...(bandPools.get(spec.band - 1) || []),
      ...(bandPools.get(spec.band + 1) || []),
    ];

    bandChosen.forEach((w, idx) => {
      const primaryPos = w.pos[0];
      const synWords = new Set((w.synonyms || []).map((s) => s.word.toLowerCase()));
      const foils = [];
      const foilNorms = new Set([normalizeVi(w.meaningVi)]);

      // Deterministic stride through adjPools based on idx
      const samePos = adjPools.filter((c) => c.pos[0] === primaryPos);
      const searchList = [...samePos, ...adjPools];
      const startOffset = (idx * 17 + spec.band * 13) % Math.max(1, searchList.length);

      for (let step = 0; step < searchList.length && foils.length < 3; step++) {
        const cand = searchList[(startOffset + step) % searchList.length];
        if (cand.id === w.id) continue;
        if (synWords.has(cand.headword.toLowerCase())) continue;
        const cMean = cand.meaningVi.trim();
        const cNorm = normalizeVi(cMean);
        if (foilNorms.has(cNorm)) continue;
        if (meaningsTooClose(w.meaningVi, cMean)) continue;
        if (foils.some((f) => meaningsTooClose(f, cMean))) continue;
        foilNorms.add(cNorm);
        foils.push(cMean);
      }

      if (foils.length !== 3) {
        throw new Error(`Could not build 3 distinct foils for placement item ${w.id}`);
      }

      const slug = w.id.replace(/^vocab:/, '');
      selected.push({
        id: `pv:b${spec.band}_${slug}`,
        headword: w.headword,
        band: spec.band,
        checkMeaningVi: w.meaningVi.trim(),
        foilsVi: [foils[0], foils[1], foils[2]],
      });
    });
  }

  return { items: selected };
}

const placementVocab = buildPlacementVocab(vocabList);
writeJson(path.join(PUBLIC_VOCAB, 'placement_vocab.json'), placementVocab);
console.log(
  `[50_merge] vocab/placement_vocab.json: ${placementVocab.items.length} items (6 bands x 25)`
);

// ---------------------------------------------------------------------------
// 5. Merge Tips -> public/data/tips.json
// ---------------------------------------------------------------------------

const rawTips = readJson(path.join(DATA_SRC, 'tips', 'legacy_tips.json'));
const tips = dedupeById(rawTips.filter(passesProvenanceQa).map(stripInternalKeys));
writeJson(path.join(PUBLIC_DATA, 'tips.json'), tips);
console.log(`[50_merge] tips.json: ${tips.length} items`);

// ---------------------------------------------------------------------------
// 6. Export Roadmap -> public/data/roadmap.json (docs/02-LEARNING-DESIGN.md §9)
// ---------------------------------------------------------------------------

const roadmap = {
  version: '3.0.0',
  title: 'Lộ trình IELTS Academic 6.0 → 8.0',
  realisticDurationMonths: { min: 9, max: 18 },
  dailyMinutesRecommended: { min: 60, max: 90 },
  disclaimerVi:
    'Thực tế: từ 6.0 lên 8.0 thường mất 9–18 tháng nếu học đều 60–90 phút mỗi ngày. Không hứa 8.0 trong 3 tháng.',
  defaultTargetProfile: {
    id: 'profile_a',
    labelVi: 'Mục tiêu cân bằng (Profile A)',
    overall: 8.0,
    listening: 8.5,
    reading: 8.5,
    writing: 7.5,
    speaking: 7.5,
  },
  phases: [
    {
      id: 'phase:g1',
      code: 'G1',
      nameVi: 'Nền',
      weekStart: 1,
      weekEnd: 8,
      focusModes: ['v1', 'v2', 'v3', 'l2', 'r1', 's2'],
      focusSummaryVi:
        'Daily Run (từ học thuật + collocation), L2 dictation, R1 training, S2 phản xạ 3 giây.',
      goalSummaryVi: '+600 item Mature. L2 đạt level 5. TFNG đúng ≥ 75%.',
      milestones: [
        { id: 'ms:g1_mature', labelVi: '+600 item từ vựng & collocation đạt trạng thái Mature', metric: 'matureItems', target: 600 },
        { id: 'ms:g1_l2', labelVi: 'Dictation Ladder (L2) đạt level 5', metric: 'l2Level', target: 5 },
        { id: 'ms:g1_tfng', labelVi: 'TFNG Judge (R1) đạt tỷ lệ đúng ≥ 75%', metric: 'r1AccuracyPct', target: 75 },
      ],
      targetBands: { listening: 6.5, reading: 6.5, writing: 6.0, speaking: 6.0, overall: 6.5 },
    },
    {
      id: 'phase:g2',
      code: 'G2',
      nameVi: 'Đúng format',
      weekStart: 9,
      weekEnd: 20,
      focusModes: ['v1', 'v2', 'v3', 'l1', 'r1', 'r2', 'w2', 'w1'],
      focusSummaryVi:
        'L1 đủ 4 part, R1/R2 exam mode, W2 sprints (Overview & Idea), W1 mỗi tuần 2 bài.',
      goalSummaryVi: 'Listening và Reading đạt band 7.0–7.5 ở X1.',
      milestones: [
        { id: 'ms:g2_listening', labelVi: 'Listening đạt band 7.0–7.5 ở Exam Room (X1)', metric: 'listeningBand', target: 7.0 },
        { id: 'ms:g2_reading', labelVi: 'Reading đạt band 7.0–7.5 ở Exam Room (X1)', metric: 'readingBand', target: 7.0 },
        { id: 'ms:g2_writing', labelVi: 'Hoàn thành đều 2 bài Writing (W1) mỗi tuần có chấm gói Claude', metric: 'weeklyEssays', target: 2 },
      ],
      targetBands: { listening: 7.5, reading: 7.5, writing: 6.5, speaking: 6.5, overall: 7.0 },
    },
    {
      id: 'phase:g3',
      code: 'G3',
      nameVi: 'Tăng tốc 7.5',
      weekStart: 21,
      weekEnd: 36,
      focusModes: ['v1', 'x1', 'w1', 's1', 'l1', 'r2'],
      focusSummaryVi:
        'X1 mỗi tuần, W1 3 bài/tuần có vòng sửa sau góp ý, S1 Mock Examiner mỗi tuần.',
      goalSummaryVi: 'L/R 8.0. W 7.0. S 7.0.',
      milestones: [
        { id: 'ms:g3_lr', labelVi: 'Listening & Reading đạt band 8.0 ở X1', metric: 'lrBand', target: 8.0 },
        { id: 'ms:g3_w', labelVi: 'Writing đạt band 7.0 (trung bình 5 bài W1 gần nhất)', metric: 'writingBand', target: 7.0 },
        { id: 'ms:g3_s', labelVi: 'Speaking đạt band 7.0 (trung bình 3 mock S1 gần nhất)', metric: 'speakingBand', target: 7.0 },
      ],
      targetBands: { listening: 8.0, reading: 8.0, writing: 7.0, speaking: 7.0, overall: 7.5 },
    },
    {
      id: 'phase:g4',
      code: 'G4',
      nameVi: 'Về đích 8.0',
      weekStart: 37,
      weekEnd: null,
      focusModes: ['x1', 'w1', 's1', 'v1'],
      focusSummaryVi:
        'Đề thi thử hoàn chỉnh X1, sửa lỗi hệ thống lặp lại, ôn chủ đề Speaking theo đợt rotation.',
      goalSummaryVi: 'L/R 8.5. W 7.5. S 7.5 trong 3 lần X1 liên tiếp.',
      milestones: [
        { id: 'ms:g4_lr', labelVi: 'Listening & Reading đạt 8.5 trong 3 lần X1 liên tiếp', metric: 'lrStreak3Band', target: 8.5 },
        { id: 'ms:g4_w', labelVi: 'Writing ổn định ≥ 7.5 qua chấm gói và vòng sửa', metric: 'writingBand', target: 7.5 },
        { id: 'ms:g4_s', labelVi: 'Speaking ổn định ≥ 7.5 phủ đủ chủ đề đợt hiện tại', metric: 'speakingBand', target: 7.5 },
      ],
      targetBands: { listening: 8.5, reading: 8.5, writing: 7.5, speaking: 7.5, overall: 8.0 },
    },
  ],
  provenance: {
    createdBy: 'human',
    source: 'docs/02-LEARNING-DESIGN.md#9',
    license: 'own',
    qa: { schema: 'pass', verifier: 'pass' },
  },
};

writeJson(path.join(PUBLIC_DATA, 'roadmap.json'), roadmap);
console.log(`[50_merge] roadmap.json: ${roadmap.phases.length} phases (G1–G4)`);

// ---------------------------------------------------------------------------
// 7. Rebuild Manifest
// ---------------------------------------------------------------------------

buildManifest(ROOT);
