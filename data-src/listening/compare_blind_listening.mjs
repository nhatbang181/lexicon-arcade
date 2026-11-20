#!/usr/bin/env node
/**
 * data-src/listening/compare_blind_listening.mjs
 *
 * G3 Blind-solve comparator for IELTS Listening V3 (docs/05-DATA-PIPELINE.md §5).
 * Compares a verifier's blind-solve answers against ground-truth Listening episodes
 * in public/data/listening/episodes/*.json using the official IELTS scorer.
 *
 * Usage:
 *   node data-src/listening/compare_blind_listening.mjs --self-test
 *   node data-src/listening/compare_blind_listening.mjs --blind <file-or-dir> [--out <report.json>]
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  countIeltsTokens,
  checkWordLimit,
  normalizeWordLimit,
  canonicalizeIeltsExpression,
} from './_ielts_tokens.mjs';
import { COMPLETION_TYPES } from './build_listening.mjs';

const ROOT = process.cwd();
const GOLD_DIR = path.join(ROOT, 'public', 'data', 'listening', 'episodes');

function cleanKey(v) {
  return String(v ?? '')
    .trim()
    .toUpperCase()
    .replace(/[.)]+$/, '');
}

function compareQuestion(group, q, blindRaw) {
  if (blindRaw === undefined || blindRaw === null || String(blindRaw).trim() === '') {
    return { match: false, expected: (q.answer.keys || q.answer.accepted).join(' | '), received: '(missing)' };
  }
  if (COMPLETION_TYPES.has(group.type)) {
    const rawStr = String(blindRaw).trim();
    const wl = normalizeWordLimit(group.wordLimit);
    const { wordCount, numberCount } = countIeltsTokens(rawStr);
    if (!checkWordLimit(wordCount, numberCount, wl)) {
      return {
        match: false,
        expected: q.answer.accepted.join(' | '),
        received: rawStr,
        reason: 'word_limit_exceeded',
      };
    }
    const gotCanon = canonicalizeIeltsExpression(rawStr).canonical;
    const ok = q.answer.accepted.some(
      (a) => canonicalizeIeltsExpression(a).canonical === gotCanon || a.trim().toLowerCase() === rawStr.toLowerCase()
    );
    return {
      match: ok,
      expected: q.answer.accepted.join(' | '),
      received: rawStr,
      reason: ok ? 'exact' : 'wrong_answer',
    };
  }
  if (group.type === 'mcq_multi') {
    const exp = [...new Set((q.answer.keys || q.answer.accepted).map(cleanKey))].sort();
    const gotArr = Array.isArray(blindRaw)
      ? blindRaw
      : String(blindRaw)
          .split(/[\s,;]+/)
          .filter(Boolean);
    const got = [...new Set(gotArr.map(cleanKey))].sort();
    // Accept either exact set match OR single valid key from the pair if solver answered per-question
    const exactSet = exp.join(',') === got.join(',');
    const singleMember = got.length === 1 && exp.includes(got[0]);
    return {
      match: exactSet || singleMember,
      expected: exp.join(','),
      received: got.join(','),
    };
  }
  const expKeys = (q.answer.keys || q.answer.accepted).map(cleanKey);
  const got = cleanKey(blindRaw);
  return {
    match: expKeys.includes(got),
    expected: expKeys.join(' | '),
    received: got,
  };
}

function loadGoldEpisodes() {
  const files = fs
    .readdirSync(GOLD_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(GOLD_DIR, f), 'utf8')));
}

function loadBlindSubmissions(blindPath) {
  const byEpId = new Map();
  const ingest = (obj) => {
    if (Array.isArray(obj)) {
      for (const item of obj) ingest(item);
      return;
    }
    if (obj && typeof obj === 'object') {
      const epId = obj.episodeId || obj.id;
      if (epId && Array.isArray(obj.answers)) {
        const map = {};
        for (const a of obj.answers) {
          if (a.qid) map[a.qid] = a.answer;
          if (a.number != null) map[String(a.number)] = a.answer;
        }
        byEpId.set(epId, map);
        return;
      }
      for (const [k, v] of Object.entries(obj)) {
        if (k.startsWith('lep:') && v && typeof v === 'object') {
          byEpId.set(k, v);
        }
      }
    }
  };

  const stat = fs.statSync(blindPath);
  if (stat.isDirectory()) {
    for (const f of fs.readdirSync(blindPath).filter((x) => x.endsWith('.json'))) {
      ingest(JSON.parse(fs.readFileSync(path.join(blindPath, f), 'utf8')));
    }
  } else {
    ingest(JSON.parse(fs.readFileSync(blindPath, 'utf8')));
  }
  return byEpId;
}

function main() {
  const args = process.argv.slice(2);
  const goldEpisodes = loadGoldEpisodes();

  let blindMap;
  if (args.includes('--self-test')) {
    blindMap = new Map();
    for (const ep of goldEpisodes) {
      const ans = {};
      for (const g of ep.questionGroups) {
        for (const q of g.questions) {
          ans[q.qid] = g.type === 'mcq_multi' ? q.answer.keys || q.answer.accepted : (q.answer.keys?.[0] ?? q.answer.accepted[0]);
        }
      }
      blindMap.set(ep.id, ans);
    }
  } else if (args.includes('--blind')) {
    const p = args[args.indexOf('--blind') + 1];
    blindMap = loadBlindSubmissions(p);
  } else {
    console.error('Usage: --self-test | --blind <file-or-dir> [--out <report.json>]');
    process.exit(1);
  }

  let totalQs = 0;
  let totalMatched = 0;
  let perfectEpisodes = 0;
  const perEpisode = [];

  for (const ep of goldEpisodes) {
    const sub = blindMap.get(ep.id) || {};
    let matched = 0;
    let count = 0;
    const mismatches = [];
    for (const g of ep.questionGroups) {
      for (const q of g.questions) {
        count++;
        totalQs++;
        const rawAns = sub[q.qid] !== undefined ? sub[q.qid] : sub[String(q.number)];
        const res = compareQuestion(g, q, rawAns);
        if (res.match) {
          matched++;
          totalMatched++;
        } else {
          mismatches.push({ qid: q.qid, number: q.number, ...res });
        }
      }
    }
    if (matched === count) perfectEpisodes++;
    perEpisode.push({ episodeId: ep.id, matched, total: count, mismatches });
  }

  const report = {
    episodes: goldEpisodes.length,
    perfectEpisodes,
    totalQuestions: totalQs,
    totalMatched,
    accuracyPct: Number(((totalMatched / Math.max(1, totalQs)) * 100).toFixed(2)),
    perEpisode,
  };

  if (args.includes('--out')) {
    const outPath = args[args.indexOf('--out') + 1];
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  }

  console.log(
    `[compare_blind_listening] ${perfectEpisodes}/${goldEpisodes.length} perfect episodes, ${totalMatched}/${totalQs} questions (${report.accuracyPct}%)`
  );
  if (totalMatched !== totalQs) {
    for (const ep of perEpisode.filter((x) => x.mismatches.length > 0)) {
      console.error(`  ${ep.episodeId}: ${ep.matched}/${ep.total} — mismatches:`, ep.mismatches);
    }
    process.exit(1);
  }
}

main();
