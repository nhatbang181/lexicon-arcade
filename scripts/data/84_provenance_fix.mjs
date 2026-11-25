#!/usr/bin/env node
/**
 * D6: khai nguồn đúng cho words.json (04 §2 D6, §4).
 *  - Từ do LLM sinh (`llm:anki-expand@…`): createdBy "llm" (không nhận "review" khi chưa có biên bản soi).
 *  - Từ có headword lấy từ danh sách Anki nhưng nghĩa/IPA/ví dụ do LLM làm giàu (`anki:<topic>+llm-enrichment`):
 *      source "llm:enrichment@2026-11-20 (headword: wordlist:anki-<topic>)", createdBy "llm".
 *  - Từ import thuần (`anki:<topic>`): source "wordlist:anki-<topic>" (giữ createdBy "import").
 *  - Chỉ những từ đã có biên bản soi thật (`review.verdict` do bước D5 ghi) mới là "llm+review".
 *  - Giữ `qa.verifier` (validator INV-PROV bắt buộc cho item LLM) nhưng gắn `qa.verifierBasis`
 *    = "sample" (soi mẫu theo lô, data-src/verdict_m1_vocab.json) hoặc "d5-rewrite" (đã soi câu mới).
 * Chạy lại được.
 */
import fs from 'node:fs';
import path from 'node:path';
const F = path.join(process.cwd(), 'public/data/vocab/words.json');
const words = JSON.parse(fs.readFileSync(F, 'utf8'));
const stat = {};
const bump = (k) => (stat[k] = (stat[k] || 0) + 1);
for (const w of words) {
  const p = w.provenance;
  const src = p.source;
  let m;
  if (/^llm:anki-expand@/.test(src)) {
    p.createdBy = w.review ? 'llm+review' : 'llm';
    bump('anki-expand→llm');
  } else if ((m = /^anki:([a-z]+)\+llm-enrichment$/.exec(src))) {
    p.source = `llm:enrichment@2026-11-20 (headword: wordlist:anki-${m[1]})`;
    p.createdBy = w.review ? 'llm+review' : 'llm';
    bump('enrichment');
  } else if ((m = /^anki:([a-z]+)$/.exec(src))) {
    p.source = `wordlist:anki-${m[1]}`;
    bump('import');
  } else if (/^llm:gemini@/.test(src)) {
    p.createdBy = w.review ? 'llm+review' : 'llm';
    bump('gemini');
  }
  if (p.qa?.verifier) p.qa.verifierBasis = w.review ? 'd5-rewrite' : 'sample';
}
fs.writeFileSync(F, JSON.stringify(words, null, 2) + '\n');
const left = words.filter((w) => w.provenance.createdBy.includes('llm') && /^anki:/.test(w.provenance.source)).length;
console.log('D6', stat, '| item LLM còn source anki:* =', left);
