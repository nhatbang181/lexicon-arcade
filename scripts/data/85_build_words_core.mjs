#!/usr/bin/env node
/**
 * D17: tách public/data/vocab/words.json thành:
 *  - public/data/vocab/words.core.json (minified, < 1 MB thô): id, headword, pos, ipa, meaningVi, level, cefr, topics, audio
 *  - public/data/vocab/words.detail.json (minified): map id -> phần chi tiết còn lại (definitionEn, examples, collocationIds, register, lists, synonyms, vnTrap, freqZipf, provenance, audioProvenance, review, rev)
 * Giữ nguyên public/data/vocab/words.json song song để không phá loader hiện tại (loader đổi qua HANDOFF).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const VOCAB_DIR = path.join(ROOT, 'public', 'data', 'vocab');
const wordsPath = path.join(VOCAB_DIR, 'words.json');
const corePath = path.join(VOCAB_DIR, 'words.core.json');
const detailPath = path.join(VOCAB_DIR, 'words.detail.json');

const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const core = [];
const detail = {};

for (const w of words) {
  core.push({
    id: w.id,
    headword: w.headword,
    pos: w.pos,
    ipa: w.ipa,
    meaningVi: w.meaningVi,
    level: w.level,
    cefr: w.cefr,
    topics: w.topics,
    audio: w.audio,
  });
  const {
    id, headword, pos, ipa, meaningVi, level, cefr, topics, audio,
    ...rest
  } = w;
  detail[id] = rest;
}

const coreJson = JSON.stringify(core);
const detailJson = JSON.stringify(detail);
fs.writeFileSync(corePath, coreJson, 'utf8');
fs.writeFileSync(detailPath, detailJson, 'utf8');

const coreKb = (Buffer.byteLength(coreJson, 'utf8') / 1024).toFixed(1);
const detailKb = (Buffer.byteLength(detailJson, 'utf8') / 1024).toFixed(1);
const origKb = (fs.statSync(wordsPath).size / 1024).toFixed(1);
console.log(`[85_build_words_core] words=${words.length} | words.json=${origKb} KB | words.core.json=${coreKb} KB | words.detail.json=${detailKb} KB`);
if (Buffer.byteLength(coreJson, 'utf8') >= 1024 * 1024) {
  console.error('ERROR: words.core.json exceeds 1 MB!');
  process.exit(1);
}
