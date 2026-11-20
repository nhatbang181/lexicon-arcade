#!/usr/bin/env node
/**
 * data-src/listening/build_listening.mjs
 *
 * Validator, blind-solve exporter, and public bundle builder for IELTS Listening V3.
 *
 * Usage:
 *   node data-src/listening/build_listening.mjs --check <slug>
 *   node data-src/listening/build_listening.mjs --check-all
 *   node data-src/listening/build_listening.mjs --export
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { ListeningEpisodeSchema } from '../../src/core/content/schemas.ts';
import {
  countIeltsTokens,
  checkWordLimit,
  normalizeWordLimit,
  canonicalizeIeltsExpression,
} from './_ielts_tokens.mjs';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'data-src', 'listening', 'episodes');
const BLIND_DIR = path.join(ROOT, 'data-src', 'listening', 'blind');
const PUB_DIR = path.join(ROOT, 'public', 'data', 'listening');
const PUB_EPISODES_DIR = path.join(PUB_DIR, 'episodes');

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const CURLY_RE = /[“”‘’]/;

export const COMPLETION_TYPES = new Set([
  'form_completion',
  'note_completion',
  'table_completion',
  'flowchart_completion',
  'sentence_completion',
  'summary_completion',
  'short_answer',
]);

export const VALID_VOICES = new Set([
  // Kokoro UK
  'bf_emma',
  'bf_isabella',
  'bf_alice',
  'bf_lily',
  'bm_george',
  'bm_lewis',
  'bm_daniel',
  'bm_fable',
  // Kokoro US
  'af_heart',
  'af_bella',
  'af_nicole',
  'af_sarah',
  'am_adam',
  'am_michael',
  // edge-tts AU/NZ/CA
  'edge:en-AU-NatashaNeural',
  'edge:en-AU-WilliamNeural',
  'edge:en-NZ-MollyNeural',
  'edge:en-NZ-MitchellNeural',
  'edge:en-CA-ClaraNeural',
  'edge:en-CA-LiamNeural',
]);

function wordCount(str) {
  return String(str || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizeForEvidence(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/£|\$|€/g, ' ')
    .replace(/[,.;:!?()"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether an accepted completion answer appears in the evidence script line
 * (verbatim, canonicalized number/unit/date/spelling, or spelled-out letter sequence).
 */
export function answerFoundInLine(acceptedAns, lineText, ttsText = '') {
  const combinedRaw = `${lineText} ${ttsText || ''}`;
  const normLine = normalizeForEvidence(combinedRaw);
  const normAns = normalizeForEvidence(acceptedAns);
  if (!normAns) return false;

  // 1. Direct normalized substring
  if (normLine.includes(normAns)) return true;

  // 2. Hyphen/space flexible match ("check-in" <-> "check in", "carpark" <-> "car park")
  const flatLine = normLine.replace(/[\s-]+/g, '');
  const flatAns = normAns.replace(/[\s-]+/g, '');
  if (flatAns.length >= 2 && flatLine.includes(flatAns)) return true;

  // 3. Spelled-out sequences in text like "W-H-I-T-E-L-A-W" or "W, H, I, T, E, L, A, W"
  const spelledRe = /\b(?:[A-Za-z][\s,-]+){2,}[A-Za-z]\b/g;
  const matches = combinedRaw.match(spelledRe) || [];
  for (const m of matches) {
    const collapsed = m.replace(/[^A-Za-z]/g, '').toLowerCase();
    if (collapsed === flatAns || collapsed.includes(flatAns)) return true;
  }

  // 4. Canonicalized IELTS expression match (e.g. "14 March" <-> "fourteenth of March", "£15" <-> "fifteen pounds")
  const canonAns = canonicalizeIeltsExpression(acceptedAns).canonical;
  const canonLine = canonicalizeIeltsExpression(lineText).canonical;
  const canonTts = ttsText ? canonicalizeIeltsExpression(ttsText).canonical : '';
  if (canonAns && (canonLine.includes(canonAns) || (canonTts && canonTts.includes(canonAns)))) {
    return true;
  }

  // 5. Phone/postcode digit matching (ignore spaces/hyphens)
  const digitsAns = acceptedAns.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const digitsLine = combinedRaw.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (/\d/.test(digitsAns) && digitsAns.length >= 3 && digitsLine.includes(digitsAns)) {
    return true;
  }

  // 6. All significant tokens of canonical answer present in canonical line
  const ansTokens = canonAns.split(' ').filter(Boolean);
  if (ansTokens.length >= 2) {
    const linePool = `${canonLine} ${canonTts}`;
    if (ansTokens.every((t) => linePool.includes(t))) return true;
  }

  return false;
}

export function validateEpisodeObject(ep, filename = '') {
  const errors = [];
  const warnings = [];
  const rawStr = JSON.stringify(ep);

  if (CJK_RE.test(rawStr)) errors.push(`${ep?.id || filename}: contains CJK character`);
  if (CURLY_RE.test(rawStr)) errors.push(`${ep?.id || filename}: contains curly quote (“”‘’) — use straight quotes`);

  const parsed = ListeningEpisodeSchema.safeParse(ep);
  if (!parsed.success) {
    for (const issue of parsed.error.issues.slice(0, 8)) {
      errors.push(`${ep?.id || filename} schema: ${issue.path.join('.')}: ${issue.message}`);
    }
    return { errors, warnings, stats: null };
  }

  const slug = ep.id.replace(/^lep:/, '');
  if (filename && path.basename(filename, '.json') !== slug) {
    errors.push(`${ep.id}: filename "${filename}" does not match slug "${slug}.json"`);
  }

  // Provenance check
  if (ep.provenance.createdBy.includes('llm')) {
    if (ep.provenance.qa.verifier !== 'pass' && ep.provenance.qa.verifier !== 'fixed') {
      errors.push(`[INV-PROV] ${ep.id}: llm item requires provenance.qa.verifier = "pass" or "fixed"`);
    }
  }
  const hasEdgeVoice = ep.speakers.some((s) => s.voice.startsWith('edge:'));
  if (hasEdgeVoice && ep.provenance.license !== 'edge-tts (personal use)') {
    errors.push(`${ep.id}: episode uses edge-tts voice so provenance.license must be "edge-tts (personal use)"`);
  }

  // Speaker & voice checks
  const speakerIds = new Set();
  for (const sp of ep.speakers) {
    if (speakerIds.has(sp.id)) errors.push(`${ep.id}: duplicate speaker id "${sp.id}"`);
    speakerIds.add(sp.id);
    if (!VALID_VOICES.has(sp.voice)) {
      errors.push(`${ep.id}: speaker "${sp.id}" uses invalid voice "${sp.voice}"`);
    }
  }
  if (ep.part === 1 && ep.speakers.length !== 2) {
    errors.push(`${ep.id}: Part 1 must have 2 speakers (got ${ep.speakers.length})`);
  }
  if ((ep.part === 2 || ep.part === 4) && ep.speakers.length !== 1) {
    errors.push(`${ep.id}: Part ${ep.part} must have 1 speaker (got ${ep.speakers.length})`);
  }
  if (ep.part === 3 && (ep.speakers.length < 2 || ep.speakers.length > 3)) {
    errors.push(`${ep.id}: Part 3 must have 2-3 speakers (got ${ep.speakers.length})`);
  }

  // Script checks
  const lineIndexById = new Map();
  const lineById = new Map();
  let totalScriptWords = 0;
  for (let i = 0; i < ep.script.length; i++) {
    const line = ep.script[i];
    if (lineIndexById.has(line.lineId)) {
      errors.push(`${ep.id}: duplicate script lineId "${line.lineId}"`);
    }
    lineIndexById.set(line.lineId, i);
    lineById.set(line.lineId, line);
    if (!speakerIds.has(line.speakerId)) {
      errors.push(`${ep.id}: script[${i}] unknown speakerId "${line.speakerId}"`);
    }
    totalScriptWords += wordCount(line.text);
  }

  const [minWords, maxWords] = ep.part === 4 ? [620, 1100] : [500, 980];
  if (totalScriptWords < minWords || totalScriptWords > maxWords) {
    warnings.push(`${ep.id}: script wordCount=${totalScriptWords} (recommended ${minWords}-${maxWords})`);
  }

  // Audio path check
  const expectedAudioPath = `audio/listening/${slug}.mp3`;
  if (ep.audio.path !== expectedAudioPath) {
    errors.push(`${ep.id}: audio.path="${ep.audio.path}" !== expected "${expectedAudioPath}"`);
  }

  // Question checks ([INV-L1..L4])
  const allQs = [];
  const seenNumbers = new Set();
  const seenQids = new Set();
  let completionCount = 0;
  let totalTraps = 0;
  let hasP1SelfOrNum = false;
  let hasP1Spelling = false;
  let hasMap = false;

  for (const g of ep.questionGroups) {
    const isCompletion = COMPLETION_TYPES.has(g.type);
    if (isCompletion && !g.wordLimit) {
      errors.push(`[INV-L2] ${ep.id} ${g.groupId}: completion group missing wordLimit`);
    }
    const wlSpec = g.wordLimit ? normalizeWordLimit(g.wordLimit) : null;

    if (g.type === 'map_labelling') {
      hasMap = true;
      if (!g.map) {
        errors.push(`${ep.id} ${g.groupId}: map_labelling group missing MapSpec`);
      } else {
        if (g.map.viewBox !== '0 0 800 560') {
          errors.push(`${ep.id} ${g.groupId}: MapSpec viewBox should be "0 0 800 560"`);
        }
        if (!g.map.compass) errors.push(`${ep.id} ${g.groupId}: MapSpec compass must be true`);
        if (!g.map.youAreHere) errors.push(`${ep.id} ${g.groupId}: MapSpec missing youAreHere`);
        if (g.map.slots.length < 8) {
          errors.push(`${ep.id} ${g.groupId}: MapSpec needs >= 8 slots (got ${g.map.slots.length})`);
        }
        if (g.map.shapes.length < 6) {
          errors.push(`${ep.id} ${g.groupId}: MapSpec needs >= 6 shapes (got ${g.map.shapes.length})`);
        }
      }
    }

    const optionKeys = new Set((g.options || []).map((o) => o.key));
    const slotKeys = new Set((g.map?.slots || []).map((s) => s.key));
    const usedMapKeys = new Set();

    if (g.template) {
      const blankQids = new Set(g.template.rows.map((r) => r.blankQid).filter(Boolean));
      for (const q of g.questions) {
        if (!blankQids.has(q.qid)) {
          warnings.push(`${ep.id} ${g.groupId}: template missing blankQid for ${q.qid}`);
        }
      }
    }

    for (const q of g.questions) {
      allQs.push({ group: g, q });
      if (seenNumbers.has(q.number)) errors.push(`[INV-L1] ${ep.id}: duplicate question number ${q.number}`);
      seenNumbers.add(q.number);
      if (seenQids.has(q.qid)) errors.push(`[INV-L1] ${ep.id}: duplicate qid "${q.qid}"`);
      seenQids.add(q.qid);

      if (!lineById.has(q.evidence.lineId)) {
        errors.push(`[INV-L3] ${ep.id} ${q.qid}: unknown evidence.lineId "${q.evidence.lineId}"`);
      }

      if (isCompletion) {
        completionCount++;
        if (!q.answer.accepted || q.answer.accepted.length === 0) {
          errors.push(`[INV-L2] ${ep.id} ${q.qid}: completion answer.accepted is empty`);
        } else {
          const evLine = lineById.get(q.evidence.lineId);
          for (const ans of q.answer.accepted) {
            if (wlSpec) {
              const { wordCount: wc, numberCount: nc } = countIeltsTokens(ans);
              if (!checkWordLimit(wc, nc, wlSpec)) {
                errors.push(
                  `[INV-L2] ${ep.id} ${q.qid}: accepted "${ans}" (${wc}w, ${nc}n) violates wordLimit (${g.wordLimit.words}w, allowNumber=${g.wordLimit.allowNumber})`
                );
              }
            }
            if (evLine && !answerFoundInLine(ans, evLine.text, evLine.ttsText)) {
              errors.push(
                `[INV-L3] ${ep.id} ${q.qid}: accepted "${ans}" not found in evidence line ${q.evidence.lineId} ("${evLine.text}")`
              );
            }
          }
        }
      } else {
        // MCQ / matching / map_labelling
        if (!q.answer.keys || q.answer.keys.length === 0) {
          errors.push(`${ep.id} ${q.qid}: ${g.type} missing answer.keys`);
        } else {
          for (const k of q.answer.keys) {
            if (g.type === 'map_labelling') {
              if (!slotKeys.has(k)) errors.push(`${ep.id} ${q.qid}: map answer key "${k}" not in MapSpec.slots`);
              if (usedMapKeys.has(k)) errors.push(`${ep.id} ${q.qid}: duplicate map slot key "${k}"`);
              usedMapKeys.add(k);
            } else if (optionKeys.size > 0 && !optionKeys.has(k)) {
              errors.push(`${ep.id} ${q.qid}: answer key "${k}" not in group.options`);
            }
          }
        }
        if (!q.answer.accepted || q.answer.accepted.length === 0) {
          errors.push(`${ep.id} ${q.qid}: answer.accepted must include key(s)`);
        }
      }

      for (const tr of q.traps) {
        totalTraps++;
        if (!lineById.has(tr.lineId)) {
          errors.push(`[INV-L4] ${ep.id} ${q.qid}: unknown trap lineId "${tr.lineId}"`);
        }
        if (tr.type === 'self_correction' || tr.type === 'distractor_number') {
          hasP1SelfOrNum = true;
        }
        if (tr.type === 'spelling_out') {
          hasP1Spelling = true;
          const evLine = lineById.get(q.evidence.lineId);
          if (evLine && (!evLine.ttsText || !/,/.test(evLine.ttsText))) {
            errors.push(`[INV-L4] ${ep.id} ${q.qid}: spelling_out evidence line ${q.evidence.lineId} needs ttsText with comma-separated letters`);
          }
        }
      }
    }
  }

  // [INV-L1] Exactly 10 questions numbered 1..10
  if (allQs.length !== 10) {
    errors.push(`[INV-L1] ${ep.id}: expected 10 questions, got ${allQs.length}`);
  } else {
    for (let n = 1; n <= 10; n++) {
      if (!seenNumbers.has(n)) errors.push(`[INV-L1] ${ep.id}: missing question number ${n}`);
    }
  }
  if ((ep.part === 1 || ep.part === 4) && completionCount < 6) {
    errors.push(`[INV-L1] ${ep.id}: Part ${ep.part} requires >= 6 completion questions (got ${completionCount})`);
  }

  // Evidence order check (non-decreasing line index by question number)
  const sortedByNum = [...allQs].sort((a, b) => a.q.number - b.q.number);
  let prevIdx = -1;
  for (const { q } of sortedByNum) {
    const curIdx = lineIndexById.get(q.evidence.lineId);
    if (typeof curIdx === 'number') {
      if (curIdx < prevIdx) {
        errors.push(`${ep.id} ${q.qid}: evidence line ${q.evidence.lineId} (idx ${curIdx}) precedes previous question (idx ${prevIdx})`);
      }
      prevIdx = curIdx;
    }
  }

  // [INV-L4] Traps check
  if (totalTraps < 3) {
    errors.push(`[INV-L4] ${ep.id}: requires >= 3 traps (got ${totalTraps})`);
  }
  if (ep.part === 1) {
    if (!hasP1SelfOrNum) errors.push(`[INV-L4] ${ep.id}: Part 1 requires >= 1 self_correction or distractor_number trap`);
    if (!hasP1Spelling) errors.push(`[INV-L4] ${ep.id}: Part 1 requires >= 1 spelling_out trap`);
  }

  return {
    errors,
    warnings,
    stats: {
      id: ep.id,
      slug,
      part: ep.part,
      reserved: ep.reserved === true,
      words: totalScriptWords,
      questions: allQs.length,
      completionCount,
      traps: totalTraps,
      hasMap,
      accents: [...new Set(ep.speakers.map((s) => s.accent))],
      voices: ep.speakers.map((s) => s.voice),
      questionTypes: [...new Set(ep.questionGroups.map((g) => g.type))],
    },
  };
}

function makeBlindEpisode(ep) {
  return {
    id: ep.id,
    part: ep.part,
    reserved: ep.reserved === true,
    title: ep.title,
    contextEn: ep.contextEn,
    difficulty: ep.difficulty,
    speakers: ep.speakers.map(({ id, name, role, accent }) => ({ id, name, role, accent })),
    script: ep.script.map(({ lineId, speakerId, text }) => ({ lineId, speakerId, text })),
    questionGroups: ep.questionGroups.map((g) => ({
      groupId: g.groupId,
      type: g.type,
      instructions: g.instructions,
      ...(g.wordLimit ? { wordLimit: g.wordLimit } : {}),
      ...(g.template ? { template: g.template } : {}),
      ...(g.map ? { map: g.map } : {}),
      ...(g.options ? { options: g.options } : {}),
      questions: g.questions.map((q) => ({
        qid: q.qid,
        number: q.number,
        prompt: q.prompt,
      })),
    })),
  };
}

function makeIndexEntry(ep) {
  const slug = ep.id.replace(/^lep:/, '');
  let trapCount = 0;
  let questionCount = 0;
  let hasMap = false;
  const qTypes = [];
  for (const g of ep.questionGroups) {
    if (!qTypes.includes(g.type)) qTypes.push(g.type);
    if (g.type === 'map_labelling' && g.map) hasMap = true;
    questionCount += g.questions.length;
    for (const q of g.questions) trapCount += q.traps.length;
  }
  return {
    id: ep.id,
    file: `data/listening/episodes/${slug}.json`,
    part: ep.part,
    reserved: ep.reserved === true,
    title: ep.title,
    contextEn: ep.contextEn,
    difficulty: ep.difficulty,
    accents: [...new Set(ep.speakers.map((s) => s.accent))],
    channel: ep.channel || 'normal',
    audioPath: ep.audio.path,
    durationSec: ep.audio.durationSec,
    questionCount,
    questionTypes: qTypes,
    hasMap,
    trapCount,
  };
}

function loadEpisodeFile(slug) {
  const filePath = path.join(SRC_DIR, slug.endsWith('.json') ? slug : `${slug}.json`);
  const raw = fs.readFileSync(filePath, 'utf8');
  return { filePath, ep: JSON.parse(raw) };
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--check')) {
    const slug = args[args.indexOf('--check') + 1];
    if (!slug) {
      console.error('Usage: --check <slug>');
      process.exit(1);
    }
    const { filePath, ep } = loadEpisodeFile(slug);
    const res = validateEpisodeObject(ep, path.basename(filePath));
    for (const w of res.warnings) console.log(`  [WARN] ${w}`);
    if (res.errors.length > 0) {
      for (const e of res.errors) console.error(`  [ERR] ${e}`);
      process.exit(1);
    }
    console.log(
      `[OK] ${res.stats.id} (P${res.stats.part}, ${res.stats.reserved ? 'reserved' : 'training'}, ${res.stats.words}w, ${res.stats.questions}q, ${res.stats.traps} traps, map=${res.stats.hasMap}, accents=${res.stats.accents.join('/')})`
    );
    process.exit(0);
  }

  const files = fs.existsSync(SRC_DIR)
    ? fs
        .readdirSync(SRC_DIR)
        .filter((f) => f.endsWith('.json'))
        .sort()
    : [];

  if (files.length === 0) {
    console.error(`No episode JSON files found in ${SRC_DIR}`);
    process.exit(1);
  }

  const allEpisodes = [];
  const allErrors = [];
  let mapCount = 0;
  let edgeCount = 0;

  for (const fname of files) {
    const { ep } = loadEpisodeFile(fname);
    const res = validateEpisodeObject(ep, fname);
    for (const w of res.warnings) console.log(`  [WARN] ${w}`);
    if (res.errors.length > 0) {
      allErrors.push(...res.errors);
    } else {
      allEpisodes.push(ep);
      if (res.stats.hasMap) mapCount++;
      if (ep.speakers.some((s) => s.voice.startsWith('edge:'))) edgeCount++;
    }
  }

  if (allErrors.length > 0) {
    console.error(`FAILED with ${allErrors.length} error(s):`);
    for (const e of allErrors.slice(0, 50)) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `[OK] Validated ${allEpisodes.length} episodes (maps=${mapCount}, edge-tts AU/NZ/CA=${edgeCount})`
  );

  if (args.includes('--export')) {
    fs.mkdirSync(PUB_EPISODES_DIR, { recursive: true });
    fs.mkdirSync(BLIND_DIR, { recursive: true });

    const indexEntries = [];
    const blindAll = [];

    for (const ep of allEpisodes) {
      const slug = ep.id.replace(/^lep:/, '');
      const pubFile = path.join(PUB_EPISODES_DIR, `${slug}.json`);
      fs.writeFileSync(pubFile, JSON.stringify(ep, null, 2) + '\n', 'utf8');

      indexEntries.push(makeIndexEntry(ep));

      const blind = makeBlindEpisode(ep);
      blindAll.push(blind);
      const blindFile = path.join(BLIND_DIR, `${slug}.blind.json`);
      fs.writeFileSync(blindFile, JSON.stringify(blind, null, 2) + '\n', 'utf8');
    }

    fs.writeFileSync(
      path.join(PUB_DIR, 'index.json'),
      JSON.stringify(indexEntries, null, 2) + '\n',
      'utf8'
    );
    fs.writeFileSync(
      path.join(BLIND_DIR, 'all_blind_episodes.json'),
      JSON.stringify(blindAll, null, 2) + '\n',
      'utf8'
    );
    console.log(
      `[EXPORT] Wrote ${allEpisodes.length} episodes -> public/data/listening/episodes/, index.json, and data-src/listening/blind/`
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
