#!/usr/bin/env node
/**
 * D19: chuẩn hoá ipa.uk kiểu Anh-Anh (không r sau nguyên âm khi không có nguyên âm theo sau; Britfone/Cambridge UK).
 *   /ˈtenjər/ → /ˈtenjə/, /ˈmælweər/ → /ˈmælweə/, /ˌkaʊntərˈækt/ giữ nguyên (r trước nguyên âm).
 * Chỉ động đến words.json `ipa.uk`; in danh sách thay đổi. Chạy lại được.
 */
import fs from 'node:fs';
import path from 'node:path';
const F = path.join(process.cwd(), 'public/data/vocab/words.json');
const words = JSON.parse(fs.readFileSync(F, 'utf8'));
const V = 'əɪeɛæɒʊɔɑʌaiuoː';
// r sau nguyên âm và không đứng trước nguyên âm (hết từ, khoảng trắng, dấu nhấn, phụ âm) → bỏ
const re = new RegExp(`([${V}])r(?![${V}])`, 'g');
let n = 0;
const changes = [];
for (const w of words) {
  const old = w.ipa.uk;
  // bảo vệ "(r)" kiểu từ điển: bỏ ngoặc, rồi xử lý
  let s = old.replace(/\(r\)/g, 'r');
  s = s.replace(re, '$1');
  if (s !== old) {
    w.ipa.uk = s;
    n++;
    if (changes.length < 12) changes.push(`${w.id}: ${old} → ${s}`);
  }
}
fs.writeFileSync(F, JSON.stringify(words, null, 2) + '\n');
const left = words.filter((w) => new RegExp(`[${V}]r(?![${V}])`).test(w.ipa.uk)).length;
const dots = words.filter((w) => w.ipa.uk.includes('.')).length;
console.log(`IPA đã chuẩn hoá: ${n}; còn r sau nguyên âm: ${left}; còn dấu chấm: ${dots}`);
console.log(changes.join('\n'));
