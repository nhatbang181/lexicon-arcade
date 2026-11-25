#!/usr/bin/env node
// D10 bước 1: đo tỷ lệ item có ≥1 decoy chung lemma với questionPhrase; xuất danh sách cần sửa.
import fs from 'node:fs';
import path from 'node:path';
import { sharesLemma } from './_lemma.mjs';
const p = JSON.parse(fs.readFileSync('public/data/vocab/paraphrases.json', 'utf8'));
const ok = (x) => x.decoys.some((d) => sharesLemma(x.questionPhrase, d.text));
const bad = p.filter((x) => !ok(x));
console.log(`decoy chung lemma: ${p.length - bad.length}/${p.length} (${(((p.length - bad.length) / p.length) * 100).toFixed(1)}%); cần sửa: ${bad.length}`);
if (process.argv.includes('--write')) {
  const items = bad.map((x) => ({ id: x.id, level: x.level, relation: x.relation, questionPhrase: x.questionPhrase, context: x.context, targetText: x.target.text, decoys: x.decoys.map((d) => ({ text: d.text, whyVi: d.whyVi })) }));
  fs.writeFileSync('data-src/paraphrases/d10/in.json', JSON.stringify(items));
}
