#!/usr/bin/env node
/**
 * data-src/writing/_verify_batch.mjs
 * Verifies a Task 2 or Task 1 writing batch JSON against Zod schemas,
 * [INV-W1..W3], UK spelling, zero cliches, zero CJK, real col:* IDs, and exact offsets.
 *
 * Usage:
 *   node --import tsx data-src/writing/_verify_batch.mjs task2 data-src/writing/batches/t2_b1.json
 *   node --import tsx data-src/writing/_verify_batch.mjs task1 data-src/writing/batches/t1_b1.json
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  WritingTask2PromptSchema,
  WritingTask1PromptSchema,
} from '../../src/core/content/schemas.ts';

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

// Common US spellings to reject in UK-spelling Academic Writing
const US_SPELLING_RE =
  /\b(organize[sd]?|organizing|organization[s]?|analyze[sd]?|analyzing|color[s]?|colored|coloring|center[s]?|centered|behavior[s]?|behavioral|labor(?:ed|ing|s)?|neighbor(?:s|hood|ing)?|prioritize[sd]?|prioritizing|emphasize[sd]?|emphasizing|recognize[sd]?|recognizing|minimize[sd]?|minimizing|maximize[sd]?|maximizing|urbanization|globalization|criticize[sd]?|criticizing|summarize[sd]?|summarizing|defense[s]?|traveling|traveled|modeling|modeled|fulfill(?:ed|ing|s)?|favor(?:ed|ing|s|able)?|honor(?:ed|ing|s)?|humor(?:ous)?|realize[sd]?|realizing|utilize[sd]?|utilizing|utilization|modernize[sd]?|modernizing|modernization|subsidize[sd]?|subsidizing|standardize[sd]?|standardizing|specialize[sd]?|specializing|characterize[sd]?|characterizing|commercialize[sd]?|commercialization|privatize[sd]?|privatization|industrialize[sd]?|industrialization|mechanize[sd]?|mechanization|stabilize[sd]?|stabilizing|optimize[sd]?|optimizing|memorize[sd]?|memorizing|digitize[sd]?|digitization|decarbonize[sd]?|decarbonization|pediatric|anemia|catalog(?:s)?|dialog(?:s)?|enroll(?:ed|ing|ment)?|canceled|canceling|leveled|leveling|fueled|fueling|program(?:s)?)\b/gi;

export function countWords(str) {
  return String(str || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function loadClichePatterns(rootDir = process.cwd()) {
  const clichePath = path.join(rootDir, 'data-src', 'writing', 'cliches.json');
  const cliches = JSON.parse(fs.readFileSync(clichePath, 'utf8'));
  const patterns = [];
  for (const c of cliches) {
    for (const p of [c.phrase, ...(c.variants || [])]) {
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      patterns.push({ id: c.id, phrase: p, re: new RegExp(`\\b${escaped}\\b`, 'i') });
    }
  }
  return patterns;
}

export function loadValidColIds(rootDir = process.cwd()) {
  const cols = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'public', 'data', 'vocab', 'collocations.json'), 'utf8')
  );
  return new Set(cols.map((c) => c.id));
}

export function extractNumbersFromString(str) {
  // Matches integers, decimals, comma-grouped numbers like 1,250 or 45.6
  const matches = String(str || '').match(/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b|\b\d+(?:\.\d+)?\b/g) || [];
  return matches.map((m) => Number(m.replace(/,/g, ''))).filter((n) => Number.isFinite(n));
}

export function collectTask1AllowedNumbers(item) {
  const rawNums = new Set();
  const dataValues = [];

  const addFromText = (t) => {
    for (const n of extractNumbersFromString(t)) rawNums.add(n);
  };

  addFromText(item.prompt);
  if (item.chart) {
    addFromText(item.chart.title);
    addFromText(item.chart.unit);
    addFromText(item.chart.xLabel);
    addFromText(item.chart.yLabel);
    for (const cat of item.chart.categories) addFromText(cat);
    for (const s of item.chart.series) {
      addFromText(s.name);
      for (const v of s.values) {
        rawNums.add(v);
        dataValues.push(v);
      }
    }
  }
  if (item.table) {
    addFromText(item.table.title);
    for (const col of item.table.columns) addFromText(col);
    for (const row of item.table.rows) {
      for (const cell of row) {
        if (typeof cell === 'number') {
          rawNums.add(cell);
          dataValues.push(cell);
        } else {
          for (const n of extractNumbersFromString(cell)) {
            rawNums.add(n);
            dataValues.push(n);
          }
        }
      }
    }
  }
  if (item.process) {
    addFromText(item.process.title);
    for (const st of item.process.steps) addFromText(st.label);
    rawNums.add(item.process.steps.length);
  }
  if (item.maps) {
    addFromText(item.maps.before.year);
    addFromText(item.maps.after.year);
    const y1 = Number(item.maps.before.year);
    const y2 = Number(item.maps.after.year);
    if (Number.isFinite(y1) && Number.isFinite(y2)) rawNums.add(Math.abs(y2 - y1));
    for (const sh of [...item.maps.before.shapes, ...item.maps.after.shapes]) {
      addFromText(sh.label);
    }
  }

  // Also allow pairwise differences, sums, ratios, and % changes of dataValues
  const derived = new Set(rawNums);
  for (let i = 0; i < dataValues.length; i++) {
    const a = dataValues[i];
    for (let j = i + 1; j < dataValues.length; j++) {
      const b = dataValues[j];
      derived.add(Math.abs(a - b));
      derived.add(a + b);
      if (a > 0) {
        derived.add(b / a);
        derived.add(Math.abs((b - a) / a) * 100);
      }
      if (b > 0) {
        derived.add(a / b);
        derived.add(Math.abs((a - b) / b) * 100);
      }
    }
  }
  // Allow total of each series / row
  if (item.chart) {
    for (const s of item.chart.series) {
      derived.add(s.values.reduce((acc, v) => acc + v, 0));
    }
  }
  return { rawNums, derived };
}

export function isNumberGrounded(n, allowedSet) {
  for (const cand of allowedSet) {
    if (Math.abs(cand - n) <= 1.05) return true;
  }
  return false;
}

export function verifyTask2Items(items, { validColIds, clichePatterns }) {
  const errs = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const parsed = WritingTask2PromptSchema.safeParse(item);
    if (!parsed.success) {
      errs.push(
        `Task2[${i}] (${item?.id}): schema error: ${parsed.error.issues
          .slice(0, 3)
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ')}`
      );
      continue;
    }
    const raw = JSON.stringify(item);
    if (CJK_RE.test(raw)) errs.push(`${item.id}: contains CJK`);

    // [INV-W1]
    const actualWc = countWords(item.band8Model.text);
    if (actualWc < 270 || actualWc > 320) {
      errs.push(`[INV-W1] ${item.id}: actual wordCount=${actualWc} outside [270, 320]`);
    }
    if (Math.abs(item.band8Model.wordCount - actualWc) > 2) {
      errs.push(`[INV-W1] ${item.id}: declared wordCount=${item.band8Model.wordCount} != actual=${actualWc}`);
    }

    // Idea bank >= 6
    if (item.ideaBank.length < 6) {
      errs.push(`${item.id}: ideaBank has ${item.ideaBank.length} items (minimum >= 6)`);
    }

    // Notes >= 6 and valid offsets
    if (item.band8Model.notes.length < 6) {
      errs.push(`${item.id}: band8Model.notes has ${item.band8Model.notes.length} (minimum >= 6)`);
    }
    for (let ni = 0; ni < item.band8Model.notes.length; ni++) {
      const note = item.band8Model.notes[ni];
      if (note.start < 0 || note.end > item.band8Model.text.length || note.start >= note.end) {
        errs.push(`${item.id}: notes[${ni}] invalid range [${note.start}, ${note.end}]`);
      }
    }

    // Collocations exist
    if (item.usefulCollocationIds.length < 3) {
      errs.push(`${item.id}: usefulCollocationIds has ${item.usefulCollocationIds.length} (minimum >= 3)`);
    }
    for (const cid of item.usefulCollocationIds) {
      if (!validColIds.has(cid)) {
        errs.push(`${item.id}: unknown collocationId "${cid}"`);
      }
    }

    // Zero cliches in model
    for (const cp of clichePatterns) {
      if (cp.re.test(item.band8Model.text)) {
        errs.push(`${item.id}: band8Model contains cliché "${cp.phrase}" (${cp.id})`);
      }
    }

    // UK spelling check on prompt + band8Model + ideaBank
    const enText = [
      item.prompt,
      item.band8Model.text,
      ...item.ideaBank.map((ib) => `${ib.idea} ${ib.develop}`),
    ].join('\n');
    const usMatches = enText.match(US_SPELLING_RE);
    if (usMatches) {
      errs.push(`${item.id}: US spelling detected: ${[...new Set(usMatches)].join(', ')}`);
    }
  }
  return errs;
}

export function verifyTask1Items(items, { clichePatterns }) {
  const errs = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const parsed = WritingTask1PromptSchema.safeParse(item);
    if (!parsed.success) {
      errs.push(
        `Task1[${i}] (${item?.id}): schema error: ${parsed.error.issues
          .slice(0, 3)
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ')}`
      );
      continue;
    }
    const raw = JSON.stringify(item);
    if (CJK_RE.test(raw)) errs.push(`${item.id}: contains CJK`);

    // [INV-W1]
    const actualWc = countWords(item.band8Model.text);
    if (actualWc < 165 || actualWc > 200) {
      errs.push(`[INV-W1] ${item.id}: actual wordCount=${actualWc} outside [165, 200]`);
    }
    if (Math.abs(item.band8Model.wordCount - actualWc) > 2) {
      errs.push(`[INV-W1] ${item.id}: declared wordCount=${item.band8Model.wordCount} != actual=${actualWc}`);
    }

    // [INV-W2]
    if (item.keyFeatures.length < 3) {
      errs.push(`[INV-W2] ${item.id}: keyFeatures.length=${item.keyFeatures.length} (< 3)`);
    }
    const hasOverallMust = item.keyFeatures.some(
      (kf) => (kf.kind === 'overall_trend' || kf.kind === 'grouping') && kf.mustMention === true
    );
    if (!hasOverallMust) {
      errs.push(`[INV-W2] ${item.id}: needs >= 1 keyFeature with kind overall_trend|grouping and mustMention=true`);
    }

    // Visual presence & structural invariants per kind
    if (item.kind === 'bar' || item.kind === 'line' || item.kind === 'pie') {
      if (!item.chart) errs.push(`${item.id}: kind="${item.kind}" requires chart`);
      else {
        for (const s of item.chart.series) {
          if (s.values.length !== item.chart.categories.length) {
            errs.push(`${item.id}: series "${s.name}" length ${s.values.length} != categories ${item.chart.categories.length}`);
          }
        }
        if (item.kind === 'pie') {
          if (item.chart.pie !== true) errs.push(`${item.id}: pie kind must set chart.pie=true`);
          for (const s of item.chart.series) {
            const sum = s.values.reduce((a, b) => a + b, 0);
            if (Math.abs(sum - 100) > 0.01) {
              errs.push(`${item.id}: pie series "${s.name}" sums to ${sum} (must be 100)`);
            }
          }
        }
      }
    } else if (item.kind === 'table') {
      if (!item.table) errs.push(`${item.id}: kind="table" requires table`);
      else {
        for (let ri = 0; ri < item.table.rows.length; ri++) {
          if (item.table.rows[ri].length !== item.table.columns.length) {
            errs.push(`${item.id}: table row[${ri}] length != columns length`);
          }
        }
      }
    } else if (item.kind === 'mixed') {
      if (!item.chart || !item.table) {
        errs.push(`${item.id}: kind="mixed" requires both chart and table`);
      } else {
        for (const s of item.chart.series) {
          if (s.values.length !== item.chart.categories.length) {
            errs.push(`${item.id}: mixed chart series "${s.name}" length mismatch`);
          }
        }
        if (item.chart.pie) {
          for (const s of item.chart.series) {
            const sum = s.values.reduce((a, b) => a + b, 0);
            if (Math.abs(sum - 100) > 0.01) {
              errs.push(`${item.id}: mixed pie series "${s.name}" sums to ${sum} (must be 100)`);
            }
          }
        }
        for (let ri = 0; ri < item.table.rows.length; ri++) {
          if (item.table.rows[ri].length !== item.table.columns.length) {
            errs.push(`${item.id}: mixed table row[${ri}] length != columns length`);
          }
        }
      }
    } else if (item.kind === 'process') {
      if (!item.process) errs.push(`${item.id}: kind="process" requires process`);
      else {
        const stepIds = new Set(item.process.steps.map((s) => s.id));
        if (item.process.steps.length < 6 || item.process.steps.length > 10) {
          errs.push(`${item.id}: process steps=${item.process.steps.length} outside [6, 10]`);
        }
        for (const [u, v] of item.process.edges) {
          if (!stepIds.has(u) || !stepIds.has(v)) {
            errs.push(`${item.id}: process edge [${u}, ${v}] references unknown step`);
          }
        }
      }
    } else if (item.kind === 'map') {
      if (!item.maps) errs.push(`${item.id}: kind="map" requires maps`);
      else {
        if (item.maps.before.year === item.maps.after.year) {
          errs.push(`${item.id}: maps before.year === after.year`);
        }
        if (item.maps.before.shapes.length < 6 || item.maps.after.shapes.length < 6) {
          errs.push(`${item.id}: maps must have >= 6 shapes in both before and after`);
        }
      }
    }

    // Overview models >= 2 & overviewKeyPhrases present in overviewModels
    if (item.overviewModels.length < 2) {
      errs.push(`${item.id}: overviewModels has ${item.overviewModels.length} (minimum >= 2)`);
    }
    const allOverviews = item.overviewModels.join(' ').toLowerCase();
    for (const kp of item.overviewKeyPhrases || []) {
      if (!allOverviews.includes(kp.toLowerCase())) {
        errs.push(`${item.id}: overviewKeyPhrase "${kp}" not found in overviewModels`);
      }
    }

    // [INV-W3] Numeric grounding in band8Model for quantitative visuals
    if (['bar', 'line', 'pie', 'table', 'mixed'].includes(item.kind)) {
      const { derived } = collectTask1AllowedNumbers(item);
      const modelNums = extractNumbersFromString(item.band8Model.text);
      for (const n of modelNums) {
        if (!isNumberGrounded(n, derived)) {
          errs.push(`[INV-W3] ${item.id}: number ${n} in band8Model not grounded in chart/table data`);
        }
      }
    }

    // Zero cliches
    for (const cp of clichePatterns) {
      if (cp.re.test(item.band8Model.text) || cp.re.test(item.overviewModels.join(' '))) {
        errs.push(`${item.id}: contains cliché "${cp.phrase}" (${cp.id})`);
      }
    }

    // UK spelling
    const enText = [
      item.prompt,
      item.band8Model.text,
      ...item.overviewModels,
      ...item.keyFeatures.map((k) => k.textEn),
    ].join('\n');
    const usMatches = enText.match(US_SPELLING_RE);
    if (usMatches) {
      errs.push(`${item.id}: US spelling detected: ${[...new Set(usMatches)].join(', ')}`);
    }
  }
  return errs;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || '')) {
  const [, , mode, filePath] = process.argv;
  if (!mode || !filePath) {
    console.error('Usage: node --import tsx data-src/writing/_verify_batch.mjs <task1|task2> <file.json>');
    process.exit(2);
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const clichePatterns = loadClichePatterns();
  const validColIds = loadValidColIds();
  const errs =
    mode === 'task2'
      ? verifyTask2Items(data, { validColIds, clichePatterns })
      : verifyTask1Items(data, { clichePatterns });
  if (errs.length > 0) {
    console.error(`FAIL (${errs.length} errors in ${filePath}):`);
    for (const e of errs) console.error(' -', e);
    process.exit(1);
  }
  console.log(`PASS (${data.length} ${mode} items verified in ${filePath})`);
}
