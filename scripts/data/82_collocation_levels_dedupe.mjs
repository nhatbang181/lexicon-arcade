#!/usr/bin/env node
/**
 * D9 + `level` cho collocation (04 §3).
 *  - D9: 15 cặp `phrase` trùng → giữ bản đầu, bản sau `deprecated:true` + `aliasOf:<id bản đầu>` (không đổi ID, không xoá).
 *  - level 1–10 từ bandTarget: 7 → L7 (cụm ≤ 3 từ) hoặc L8; 8 → L8 (≤ 3 từ) hoặc L9; 9 → L10.
 * Chạy lại được (idempotent).
 */
import fs from 'node:fs';
import path from 'node:path';
const F = path.join(process.cwd(), 'public/data/vocab/collocations.json');
const cols = JSON.parse(fs.readFileSync(F, 'utf8'));
const seen = new Map();
let dep = 0;
for (const c of cols) {
  const key = c.phrase.toLowerCase().replace(/\s+/g, ' ').trim();
  if (c.deprecated) continue;
  if (seen.has(key)) {
    c.deprecated = true;
    c.aliasOf = seen.get(key);
    dep++;
  } else seen.set(key, c.id);
}
const nWords = (c) => c.phrase.trim().split(/\s+/).length;
for (const c of cols) {
  if (typeof c.bandTarget !== 'number' || c.bandTarget < 7) continue; // mục band 4–6 nằm ở file khác
  const long = nWords(c) >= 4 || c.pattern === 'PHRASE' || c.gaps.length > 1;
  c.level = c.bandTarget === 9 ? 10 : c.bandTarget === 8 ? (long ? 9 : 8) : long ? 8 : 7;
}
fs.writeFileSync(F, JSON.stringify(cols, null, 2) + '\n');
const dist = {};
for (const c of cols) if (!c.deprecated) dist[c.level] = (dist[c.level] || 0) + 1;
console.log(`deprecated mới: ${dep}; tổng deprecated: ${cols.filter((c) => c.deprecated).length}; level (hoạt động):`, dist);
