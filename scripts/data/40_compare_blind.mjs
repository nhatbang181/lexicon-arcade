#!/usr/bin/env node
/**
 * scripts/data/40_compare_blind.mjs
 *
 * G3 Blind-solve comparator (docs/05-DATA-PIPELINE.md §5).
 * Compares a verifier's blind-solve answer sheet against ground-truth Reading
 * passages (public/data/reading/passages/*.json or --gold-dir <dir>) and outputs
 * per-passage match rates plus detailed mismatch diagnostics.
 *
 * Usage:
 *   node scripts/data/40_compare_blind.mjs --blind <file-or-dir> [--gold-dir <dir>] [--out <report.json>]
 *   node scripts/data/40_compare_blind.mjs --self-test
 *
 * Supported blind-solve JSON formats:
 *   1) Array of passage submissions:
 *      [{ "passageId": "rp:p1_001", "answers": [{ "qid": "p1_001_q01", "answer": "TRUE", "reason": "..." }] }]
 *   2) Single passage submission:
 *      { "passageId": "rp:p1_001", "answers": [...] }
 *   3) Map keyed by passageId:
 *      { "rp:p1_001": { "p1_001_q01": "TRUE", "2": "FALSE" } }
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const DEFAULT_GOLD_DIR = path.join(ROOT, 'public', 'data', 'reading', 'passages');

const TFNG_MAP = {
  t: 'TRUE',
  true: 'TRUE',
  f: 'FALSE',
  false: 'FALSE',
  ng: 'NOT GIVEN',
  'not given': 'NOT GIVEN',
  notgiven: 'NOT GIVEN',
};

const YNNG_MAP = {
  y: 'YES',
  yes: 'YES',
  n: 'NO',
  no: 'NO',
  ng: 'NOT GIVEN',
  'not given': 'NOT GIVEN',
  notgiven: 'NOT GIVEN',
};

function cleanToken(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.)]+$/, '')
    .replace(/\s+/g, ' ');
}

function cleanGap(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    .replace(/\s+/g, ' ');
}

export function compareQuestionAnswer(groupType, goldAnswer, blindRaw) {
  if (blindRaw === undefined || blindRaw === null || String(blindRaw).trim() === '') {
    return {
      match: false,
      expected: formatExpected(goldAnswer),
      received: '(missing)',
    };
  }

  if (groupType === 'tfng') {
    const exp = TFNG_MAP[cleanToken(goldAnswer.key)] ?? String(goldAnswer.key);
    const got = TFNG_MAP[cleanToken(blindRaw)] ?? cleanToken(blindRaw).toUpperCase();
    return { match: got === exp, expected: exp, received: got };
  }

  if (groupType === 'ynng') {
    const exp = YNNG_MAP[cleanToken(goldAnswer.key)] ?? String(goldAnswer.key);
    const got = YNNG_MAP[cleanToken(blindRaw)] ?? cleanToken(blindRaw).toUpperCase();
    return { match: got === exp, expected: exp, received: got };
  }

  if (groupType === 'headings') {
    const exp = cleanToken(goldAnswer.key);
    const got = cleanToken(blindRaw);
    return { match: got === exp, expected: exp, received: got };
  }

  if (
    groupType === 'mcq_single' ||
    groupType === 'matching' ||
    groupType === 'map_labelling' ||
    groupType === 'matching_info' ||
    groupType === 'matching_features' ||
    groupType === 'sentence_endings'
  ) {
    const rawExp = goldAnswer.key ?? goldAnswer.keys?.[0] ?? goldAnswer.accepted?.[0] ?? '';
    const exp = cleanToken(rawExp).toUpperCase();
    const got = cleanToken(blindRaw).toUpperCase();
    return { match: got === exp, expected: exp, received: got };
  }

  if (groupType === 'mcq_multi') {
    const expArr = (goldAnswer.keys || goldAnswer.accepted || []).map((k) => cleanToken(k).toUpperCase()).sort();
    const gotArr = (Array.isArray(blindRaw)
      ? blindRaw
      : String(blindRaw)
          .split(/[\s,;]+/)
          .filter(Boolean)
    )
      .map((k) => cleanToken(k).toUpperCase())
      .sort();
    const expStr = [...new Set(expArr)].join(',');
    const gotStr = [...new Set(gotArr)].join(',');
    return { match: expStr === gotStr, expected: expStr, received: gotStr };
  }

  // Gap-fill / completion / short_answer
  const accepted = (goldAnswer.accepted || []).map(cleanGap);
  const got = cleanGap(blindRaw);
  const compactGot = got.replace(/[\s-]+/g, '');
  const compactAccepted = accepted.map((a) => a.replace(/[\s-]+/g, ''));
  const isCodeOrNum = /^[a-z0-9]+$/.test(compactGot) && /\d/.test(compactGot);
  return {
    match: accepted.includes(got) || (isCodeOrNum && compactAccepted.includes(compactGot)),
    expected: (goldAnswer.accepted || []).join(' | '),
    received: String(blindRaw).trim(),
  };
}

function formatExpected(goldAnswer) {
  if (goldAnswer?.key) return goldAnswer.key;
  if (Array.isArray(goldAnswer?.keys)) return goldAnswer.keys.join(',');
  if (Array.isArray(goldAnswer?.accepted)) return goldAnswer.accepted.join(' | ');
  return '';
}

export function loadGoldPassages(goldDir = DEFAULT_GOLD_DIR) {
  const map = new Map();
  if (!fs.existsSync(goldDir)) {
    throw new Error(`Gold passages directory not found: ${goldDir}`);
  }
  for (const f of fs.readdirSync(goldDir).filter((x) => x.endsWith('.json')).sort()) {
    const p = JSON.parse(fs.readFileSync(path.join(goldDir, f), 'utf8'));
    if (p && p.id) {
      map.set(p.id, p);
    }
  }
  return map;
}

function normalizeSubmissionPayload(payload) {
  // Returns Map<passageId, Map<qidOrNumberStr, { answer, reason? }>>
  const out = new Map();

  const addPassageObj = (passageId, answers) => {
    if (!passageId) return;
    if (!out.has(passageId)) out.set(passageId, new Map());
    const qMap = out.get(passageId);

    if (Array.isArray(answers)) {
      for (const item of answers) {
        const val = { answer: item.answer, reason: item.reason };
        if (item.qid) qMap.set(String(item.qid), val);
        if (item.number !== undefined) qMap.set(String(item.number), val);
      }
    } else if (answers && typeof answers === 'object') {
      for (const [k, v] of Object.entries(answers)) {
        if (v && typeof v === 'object' && !Array.isArray(v) && 'answer' in v) {
          qMap.set(String(k), { answer: v.answer, reason: v.reason });
        } else {
          qMap.set(String(k), { answer: v });
        }
      }
    }
  };

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      addPassageObj(entry.passageId || entry.episodeId || entry.id, entry.answers);
    }
  } else if (payload && typeof payload === 'object') {
    if (payload.passageId || payload.episodeId || payload.id) {
      addPassageObj(payload.passageId || payload.episodeId || payload.id, payload.answers);
    } else {
      for (const [pid, ansObj] of Object.entries(payload)) {
        if (ansObj && typeof ansObj === 'object' && 'answers' in ansObj) {
          addPassageObj(pid, ansObj.answers);
        } else {
          addPassageObj(pid, ansObj);
        }
      }
    }
  }

  return out;
}

export function loadBlindSubmissions(blindPath) {
  const merged = new Map();
  const stat = fs.statSync(blindPath);
  const files = stat.isDirectory()
    ? fs
        .readdirSync(blindPath)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f) => path.join(blindPath, f))
    : [blindPath];

  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
    const norm = normalizeSubmissionPayload(raw);
    for (const [pid, qMap] of norm.entries()) {
      if (!merged.has(pid)) merged.set(pid, new Map());
      const dst = merged.get(pid);
      for (const [k, v] of qMap.entries()) dst.set(k, v);
    }
  }
  return merged;
}

export function compareBlindSolve(goldMap, blindMap) {
  const passageReports = [];
  let totalQuestions = 0;
  let totalMatched = 0;
  const allMismatches = [];

  for (const [passageId, blindAnswers] of blindMap.entries()) {
    const gold = goldMap.get(passageId);
    if (!gold) {
      allMismatches.push({
        passageId,
        qid: null,
        number: null,
        type: 'unknown_passage',
        expected: '(exists)',
        received: '(not found in gold directory)',
      });
      continue;
    }

    let pTotal = 0;
    let pMatched = 0;
    const pMismatches = [];

    for (const group of gold.questionGroups) {
      for (const q of group.questions) {
        pTotal++;
        totalQuestions++;
        const entry = blindAnswers.get(q.qid) ?? blindAnswers.get(String(q.number));
        const res = compareQuestionAnswer(group.type, q.answer, entry?.answer);
        if (res.match) {
          pMatched++;
          totalMatched++;
        } else {
          const mm = {
            passageId,
            qid: q.qid,
            number: q.number,
            type: group.type,
            prompt: q.prompt.split('\n')[0].slice(0, 120),
            expected: res.expected,
            received: res.received,
            ...(entry?.reason ? { blindReason: entry.reason } : {}),
          };
          pMismatches.push(mm);
          allMismatches.push(mm);
        }
      }
    }

    const accuracyPct = pTotal > 0 ? Number(((pMatched / pTotal) * 100).toFixed(2)) : 0;
    passageReports.push({
      passageId,
      level: gold.level,
      reserved: Boolean(gold.reserved),
      matched: pMatched,
      total: pTotal,
      accuracyPct,
      pass: pMatched === pTotal,
      mismatches: pMismatches,
    });
  }

  passageReports.sort((a, b) => a.passageId.localeCompare(b.passageId));
  const overallAccuracyPct =
    totalQuestions > 0 ? Number(((totalMatched / totalQuestions) * 100).toFixed(2)) : 0;

  return {
    evaluatedPassages: passageReports.length,
    totalMatched,
    totalQuestions,
    overallAccuracyPct,
    allPass: passageReports.length > 0 && allMismatches.length === 0,
    passages: passageReports,
    mismatches: allMismatches,
  };
}

function runSelfTest(goldDir) {
  const goldMap = loadGoldPassages(goldDir);
  if (goldMap.size === 0) {
    console.error(`[40_compare_blind] Self-test failed: no passages found in ${goldDir}`);
    process.exit(1);
  }
  const perfectBlind = new Map();
  for (const [pid, p] of goldMap.entries()) {
    const qMap = new Map();
    for (const g of p.questionGroups) {
      for (const q of g.questions) {
        const val = q.answer.key ?? q.answer.keys ?? q.answer.accepted?.[0];
        qMap.set(q.qid, { answer: val });
      }
    }
    perfectBlind.set(pid, qMap);
  }
  const report = compareBlindSolve(goldMap, perfectBlind);
  if (!report.allPass || report.overallAccuracyPct !== 100) {
    console.error('[40_compare_blind] Self-test failed on gold answers:', report.mismatches.slice(0, 5));
    process.exit(1);
  }
  // Verify mismatch detection on a mutated answer
  const firstPid = [...goldMap.keys()][0];
  const firstQid = goldMap.get(firstPid).questionGroups[0].questions[0].qid;
  perfectBlind.get(firstPid).set(firstQid, { answer: '__INTENTIONAL_WRONG__' });
  const badReport = compareBlindSolve(goldMap, perfectBlind);
  if (badReport.allPass || badReport.mismatches.length !== 1) {
    console.error('[40_compare_blind] Self-test failed to detect intentional mismatch');
    process.exit(1);
  }
  console.log(
    `[40_compare_blind] SELF-TEST PASS: ${report.evaluatedPassages} passages, ${report.totalMatched}/${report.totalQuestions} (100%), mismatch detection verified.`
  );
  process.exit(0);
}

function parseCliArgs(argv) {
  const opts = { goldDir: DEFAULT_GOLD_DIR, blindPath: null, outPath: null, selfTest: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--self-test') opts.selfTest = true;
    else if (a === '--blind' || a === '--answers') opts.blindPath = argv[++i];
    else if (a === '--gold-dir') opts.goldDir = argv[++i];
    else if (a === '--out') opts.outPath = argv[++i];
    else if (!a.startsWith('-') && !opts.blindPath) opts.blindPath = a;
  }
  return opts;
}

function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.selfTest) {
    runSelfTest(opts.goldDir);
    return;
  }
  if (!opts.blindPath) {
    console.error(
      'Usage: node scripts/data/40_compare_blind.mjs --blind <file-or-dir> [--gold-dir <dir>] [--out <report.json>]'
    );
    console.error('   or: node scripts/data/40_compare_blind.mjs --self-test');
    process.exit(1);
  }

  const goldMap = loadGoldPassages(opts.goldDir);
  const blindMap = loadBlindSubmissions(opts.blindPath);
  const report = compareBlindSolve(goldMap, blindMap);

  console.log('=== G3 Blind-Solve Comparison Report ===');
  for (const p of report.passages) {
    const tag = p.pass ? 'PASS' : 'FAIL';
    console.log(
      `  [${tag}] ${p.passageId.padEnd(14)} (${p.level}${p.reserved ? ' RES' : ''}): ${p.matched}/${p.total} (${p.accuracyPct}%)`
    );
  }
  console.log(
    `\nOverall: ${report.totalMatched}/${report.totalQuestions} (${report.overallAccuracyPct}%) across ${report.evaluatedPassages} passages.`
  );

  if (report.mismatches.length > 0) {
    console.log('\nMismatches:');
    for (const m of report.mismatches) {
      console.log(
        `  - ${m.passageId} #${m.number} (${m.qid}, ${m.type}): expected="${m.expected}" vs blind="${m.received}"`
      );
      if (m.blindReason) console.log(`      reason: ${m.blindReason}`);
    }
  }

  if (opts.outPath) {
    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    fs.writeFileSync(opts.outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
    console.log(`\nReport written to ${opts.outPath}`);
  }

  process.exit(report.allPass ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
