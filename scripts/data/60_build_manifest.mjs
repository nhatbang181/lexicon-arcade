#!/usr/bin/env node
/**
 * scripts/data/60_build_manifest.mjs
 * Scans public/data/**\/*.json (excluding manifest.json and legacy V2 files),
 * computes SHA-256 digests and item counts, and writes public/data/manifest.json
 * matching ManifestSchema in src/core/content/schemas.ts.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const LEGACY_FILES = new Set([
  'anki_vocab.json',
  'ielts_4skills.json',
  'ielts_strategies.json',
]);

function walkJsonFiles(dir, baseDir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkJsonFiles(full, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      const rel = path.relative(baseDir, full).split(path.sep).join('/');
      if (rel === 'manifest.json' || LEGACY_FILES.has(rel)) continue;
      results.push({ rel, full });
    }
  }
  return results.sort((a, b) => a.rel.localeCompare(b.rel));
}

export function countPayloadItems(parsed) {
  if (Array.isArray(parsed)) return parsed.length;
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.items)) return parsed.items.length;
    if (Array.isArray(parsed.phases)) return parsed.phases.length;
  }
  return 1;
}

export function sha256NormalizedLf(rawText) {
  const normalized = rawText.replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function buildManifest(rootDir = process.cwd()) {
  const publicDataDir = path.join(rootDir, 'public', 'data');
  const entries = walkJsonFiles(publicDataDir, publicDataDir);

  const files = {};
  const totals = {};

  for (const { rel, full } of entries) {
    const rawText = fs.readFileSync(full, 'utf8');
    const sha256 = sha256NormalizedLf(rawText);
    const parsed = JSON.parse(rawText);
    const count = countPayloadItems(parsed);
    files[rel] = { sha256, count };

    if (rel === 'vocab/words.json') totals.vocab = count;
    else if (rel === 'vocab/collocations.json') totals.collocations = count;
    else if (rel === 'vocab/paraphrases.json') totals.paraphrases = count;
    else if (rel === 'vocab/error_patterns.json') totals.errorPatterns = count;
    else if (rel === 'vocab/placement_vocab.json') totals.placementVocab = count;
    else if (rel === 'tips.json') totals.tips = count;
    else if (rel === 'roadmap.json') totals.roadmapPhases = count;
    else if (rel.startsWith('reading/passages/')) {
      totals.readingPassages = (totals.readingPassages || 0) + 1;
      if (parsed && parsed.reserved === true) {
        totals.readingReserved = (totals.readingReserved || 0) + 1;
      } else {
        totals.readingTraining = (totals.readingTraining || 0) + 1;
      }
      if (parsed && Array.isArray(parsed.questionGroups)) {
        const qCount = parsed.questionGroups.reduce(
          (sum, g) => sum + (Array.isArray(g.questions) ? g.questions.length : 0),
          0
        );
        totals.readingQuestions = (totals.readingQuestions || 0) + qCount;
      }
    }
    else if (rel.startsWith('listening/episodes/')) totals.listeningEpisodes = (totals.listeningEpisodes || 0) + 1;
    else if (rel === 'listening/dictation.json') totals.dictation = count;
    else if (rel === 'writing/task2_prompts.json') totals.writingTask2 = count;
    else if (rel.startsWith('writing/task1/') && rel !== 'writing/task1/index.json') {
      totals.writingTask1 = (totals.writingTask1 || 0) + 1;
    } else if (rel === 'speaking/part1.json') totals.speakingPart1 = count;
    else if (rel === 'speaking/part2.json') totals.speakingPart2 = count;
    else if (rel === 'speaking/part3.json') totals.speakingPart3 = count;
    else if (rel === 'speaking/phrases.json') totals.speakingPhrases = count;
    else if (rel === 'exam/tests.json') totals.examTests = count;
  }

  const manifest = {
    version: '3.0.0',
    builtAt: new Date().toISOString(),
    totals,
    files,
  };

  const outPath = path.join(publicDataDir, 'manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(
    `[60_build_manifest] Wrote ${Object.keys(files).length} entries -> public/data/manifest.json`
  );
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  buildManifest();
}
