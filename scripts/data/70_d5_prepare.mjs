#!/usr/bin/env node
/**
 * D5 bước 1: tìm câu ví dụ khuôn đúc trong words.json, cắt "đuôi" nối thêm ở examples[0],
 * và xuất các lô đầu vào (data-src/vocab/d5/in_NNN.json, 100 từ/lô) để sinh lại examples[1].
 * Không sửa words.json; bước áp dụng là 71_d5_apply.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const W = path.join(ROOT, 'public/data/vocab/words.json');
const OUT = path.join(ROOT, 'data-src/vocab/d5');
const words = JSON.parse(fs.readFileSync(W, 'utf8'));
const norm = (s) => s.toLowerCase().replace(/[^a-z' -]/g, ' ').split(/\s+/).filter(Boolean);
const grams = (s) => { const t = norm(s); const r = []; for (let i = 0; i + 5 <= t.length; i++) r.push(t.slice(i, i + 5).join(' ')); return r; };

const cnt = new Map();
for (const x of words) {
  const seen = new Set();
  for (const e of x.examples) for (const g of grams(e.en)) if (!seen.has(g)) { seen.add(g); cnt.set(g, (cnt.get(g) || 0) + 1); }
}
const bad = new Set([...cnt].filter(([, c]) => c >= 15).map(([g]) => g));
export const isFormulaic = (s) => grams(s).some((g) => bad.has(g));

// Các "đuôi" bị nối vào examples[0]
const TAILS = [
  'across modern secondary schools and universities', 'in many rapidly warming regions around the world',
  'across fast-evolving digital industries and public services', 'within overstretched national healthcare systems today',
  'during periods of sustained fiscal pressure and inflation', 'in efforts to maintain public safety and legal fairness',
  'in an era of instant digital broadcasting and news feeds', 'across congested urban commuter networks worldwide',
  'in peer-reviewed academic studies and modern laboratories', 'within increasingly diverse contemporary societies',
  'across both urban and rural areas', 'across both urban and rural regions',
];
const stripTail = (en) => {
  for (const t of TAILS) {
    const re = new RegExp('\\s+' + t + '(?=[.!?]$)', 'i');
    if (re.test(en)) return en.replace(re, '');
  }
  return en;
};

const tailFixes = {};
const todo = [];
for (const x of words) {
  const e0 = x.examples[0];
  const s0 = stripTail(e0.en);
  if (s0 !== e0.en) tailFixes[x.id] = s0;
  const e1 = x.examples[1];
  if (e1 && isFormulaic(e1.en)) {
    todo.push({
      id: x.id, headword: x.headword, pos: x.pos, level: x.level, topics: x.topics,
      definitionEn: x.definitionEn, meaningVi: x.meaningVi,
      existingExample: s0, mustContainOneOf: e1.clozeAccepted,
    });
  }
}
fs.writeFileSync(path.join(OUT, 'bad_grams.json'), JSON.stringify([...bad].sort(), null, 0) + '\n');
fs.writeFileSync(path.join(OUT, 'tail_fixes.json'), JSON.stringify(tailFixes, null, 1) + '\n');
const stillFormulaic0 = words.filter((x) => isFormulaic(tailFixes[x.id] ?? x.examples[0].en)).map((x) => x.id);
fs.writeFileSync(path.join(OUT, 'todo_ex0_still_formulaic.json'), JSON.stringify(stillFormulaic0, null, 1) + '\n');
const B = 100;
for (let i = 0; i < todo.length; i += B) {
  const n = String(i / B + 1).padStart(3, '0');
  fs.writeFileSync(path.join(OUT, `in_${n}.json`), JSON.stringify(todo.slice(i, i + B), null, 1) + '\n');
}
console.log(`tail fixes: ${Object.keys(tailFixes).length}; ex0 vẫn khuôn sau cắt: ${stillFormulaic0.length}; ex1 cần sinh lại: ${todo.length} (${Math.ceil(todo.length / B)} lô)`);
