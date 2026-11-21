#!/usr/bin/env node
/**
 * data-src/writing/build_writing_data.mjs
 * Merges verified M4 Writing batches (Task 2 + Task 1 + Cliches) into public/data/writing/**
 * and rebuilds public/data/manifest.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  countWords,
  loadClichePatterns,
  loadValidColIds,
  verifyTask1Items,
  verifyTask2Items,
} from './_verify_batch.mjs';
import { buildManifest } from '../../scripts/data/60_build_manifest.mjs';

const ROOT = process.cwd();
const BATCHES_DIR = path.join(ROOT, 'data-src', 'writing', 'batches');
const OUT_WRITING = path.join(ROOT, 'public', 'data', 'writing');
const OUT_TASK1 = path.join(OUT_WRITING, 'task1');

const TASK2_BATCHES = [
  't2_01_opinion_adv.json',
  't2_02_prob_posneg.json',
  't2_03_disc_twopart.json',
];

const TASK1_BATCHES = [
  't1_01_charts.json',
  't1_02_complex.json',
];

function writeLfJson(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const text = JSON.stringify(obj, null, 2).replace(/\r\n/g, '\n') + '\n';
  fs.writeFileSync(filePath, text, 'utf8');
}

function getTask1Title(item) {
  if (item.chart?.title) return item.chart.title;
  if (item.table?.title) return item.table.title;
  if (item.process?.title) return item.process.title;
  if (item.maps) {
    const firstSentence = item.prompt.split('.')[0].trim();
    return firstSentence.replace(/^The\s+(?:two\s+)?maps?\s+(?:below\s+)?shows?\s+/i, '').slice(0, 90);
  }
  return item.id;
}

function main() {
  const clichePatterns = loadClichePatterns(ROOT);
  const validColIds = loadValidColIds(ROOT);

  // 1. Load & verify Task 2
  const task2All = [];
  for (const fname of TASK2_BATCHES) {
    const full = path.join(BATCHES_DIR, fname);
    if (!fs.existsSync(full)) {
      throw new Error(`Missing Task 2 batch: ${full}`);
    }
    const items = JSON.parse(fs.readFileSync(full, 'utf8'));
    for (const item of items) {
      item.band8Model.wordCount = countWords(item.band8Model.text);
      task2All.push(item);
    }
  }
  task2All.sort((a, b) => a.id.localeCompare(b.id));

  const t2Errs = verifyTask2Items(task2All, { validColIds, clichePatterns });
  if (t2Errs.length > 0) {
    console.error(`Task 2 merge verification failed (${t2Errs.length} errors):`);
    for (const e of t2Errs.slice(0, 30)) console.error(' -', e);
    process.exit(1);
  }

  // 2. Load & verify Task 1
  const task1All = [];
  for (const fname of TASK1_BATCHES) {
    const full = path.join(BATCHES_DIR, fname);
    if (!fs.existsSync(full)) {
      throw new Error(`Missing Task 1 batch: ${full}`);
    }
    const items = JSON.parse(fs.readFileSync(full, 'utf8'));
    for (const item of items) {
      item.band8Model.wordCount = countWords(item.band8Model.text);
      task1All.push(item);
    }
  }
  task1All.sort((a, b) => a.id.localeCompare(b.id));

  const t1Errs = verifyTask1Items(task1All, { clichePatterns });
  if (t1Errs.length > 0) {
    console.error(`Task 1 merge verification failed (${t1Errs.length} errors):`);
    for (const e of t1Errs.slice(0, 30)) console.error(' -', e);
    process.exit(1);
  }

  // 3. Load cliches
  const cliches = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data-src', 'writing', 'cliches.json'), 'utf8')
  );

  // 4. Write public/data/writing/**
  fs.mkdirSync(OUT_TASK1, { recursive: true });
  writeLfJson(path.join(OUT_WRITING, 'task2_prompts.json'), task2All);
  writeLfJson(path.join(OUT_WRITING, 'cliches.json'), cliches);

  const task1Index = [];
  for (const item of task1All) {
    const slug = item.id.replace(/^w1:/, 'w1_');
    const relFile = `data/writing/task1/${slug}.json`;
    writeLfJson(path.join(OUT_TASK1, `${slug}.json`), item);
    task1Index.push({
      id: item.id,
      file: relFile,
      kind: item.kind,
      topic: item.topic,
      difficulty: item.difficulty,
      title: getTask1Title(item),
      promptPreview: item.prompt.slice(0, 140),
      keyFeatureCount: item.keyFeatures.length,
      wordCount: item.band8Model.wordCount,
    });
  }
  writeLfJson(path.join(OUT_TASK1, 'index.json'), task1Index);

  // 5. Rebuild manifest.json
  buildManifest(ROOT);

  console.log(
    `[build_writing_data] Wrote ${task2All.length} Task 2 prompts, ${task1All.length} Task 1 visuals (+ index.json), ${cliches.length} cliches.`
  );
}

main();
