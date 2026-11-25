#!/usr/bin/env node
/**
 * D10 bước 3: kiểm cơ học rồi áp decoy paraphrase cải thiện vào public/data/vocab/paraphrases.json.
 *  - Đọc data-src/paraphrases/d10/out/gen_*.json
 *  - Kiểm:
 *      + target.text giữ nguyên từng ký tự và xuất hiện đúng 1 lần trong context mới
 *      + đúng 2 decoys, mỗi decoy.text xuất hiện nguyên văn trong context, 2–10 từ
 *      + target và 2 decoys không chồng lấn (non-overlapping spans)
 *      + ít nhất 1 decoy chung lemma với questionPhrase (sharesLemma)
 *      + context 30–130 từ, không chứa từ cấm Cambridge/IELTS meta
 *      + whyVi không rỗng
 *  - Tính lại chính xác start/end cho target và decoys; giữ nguyên ID; tăng rev; gắn review.
 *   node scripts/data/74_d10_apply.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { sharesLemma } from './_lemma.mjs';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'data-src/paraphrases/d10');
const OUT_DIR = path.join(DIR, 'out');
const PARA_PATH = path.join(ROOT, 'public/data/vocab/paraphrases.json');
const dry = process.argv.includes('--dry');

const items = JSON.parse(fs.readFileSync(PARA_PATH, 'utf8'));
const byId = new Map(items.map((x) => [x.id, x]));

const genFiles = fs.existsSync(OUT_DIR)
  ? fs.readdirSync(OUT_DIR).filter((f) => /^gen_.*\.json$/.test(f)).sort()
  : [];

const generated = new Map();
for (const f of genFiles) {
  const arr = JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8'));
  for (const g of arr) if (g && g.id) generated.set(g.id, g);
}

const BANNED_META = /\b(cambridge ielts|official ielts|ielts|band [0-9])\b/i;

function findAll(haystack, needle) {
  const res = [];
  if (!needle) return res;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    res.push([pos, pos + needle.length]);
    pos += 1;
  }
  return res;
}

function overlaps(a, b) {
  return a[0] < b[1] && b[0] < a[1];
}

const rejects = {};
let applied = 0;

for (const [id, g] of generated) {
  const orig = byId.get(id);
  if (!orig) { rejects[id] = 'unknown id'; continue; }
  const ctx = String(g.context || '').trim().replace(/\s+/g, ' ');
  const wc = ctx.split(/\s+/).length;
  if (wc < 30 || wc > 130) { rejects[id] = `context length ${wc}`; continue; }
  if (BANNED_META.test(ctx)) { rejects[id] = 'banned meta in context'; continue; }

  const tText = orig.target.text;
  const tHits = findAll(ctx, tText);
  if (tHits.length !== 1) { rejects[id] = `target hits=${tHits.length}`; continue; }
  const tSpan = tHits[0];

  if (!Array.isArray(g.decoys) || g.decoys.length !== 2) {
    rejects[id] = `decoys count=${g.decoys?.length}`;
    continue;
  }

  const placed = [];
  let badDecoy = null;
  for (const d of g.decoys) {
    const dText = String(d?.text || '').trim();
    const whyVi = String(d?.whyVi || '').trim();
    const dw = dText.split(/\s+/).length;
    if (!dText || dw < 2 || dw > 10) { badDecoy = `decoy len ${dw}`; break; }
    if (!whyVi || BANNED_META.test(whyVi)) { badDecoy = 'bad whyVi'; break; }
    const hits = findAll(ctx, dText).filter((sp) => !overlaps(sp, tSpan) && placed.every((p) => !overlaps(sp, [p.start, p.end])));
    if (hits.length === 0) { badDecoy = `decoy not found/overlaps: ${dText}`; break; }
    placed.push({ text: dText, start: hits[0][0], end: hits[0][1], whyVi });
  }
  if (badDecoy) { rejects[id] = badDecoy; continue; }

  if (!placed.some((d) => sharesLemma(orig.questionPhrase, d.text))) {
    rejects[id] = 'no decoy shares lemma';
    continue;
  }

  orig.context = ctx;
  orig.target = { text: tText, start: tSpan[0], end: tSpan[1] };
  orig.decoys = placed;
  orig.rev = (orig.rev || 1) + 1;
  orig.review = {
    by: 'claude-sonnet-5.5',
    date: '2026-11-25',
    verdict: 'pass',
    scope: 'D10 decoys cải thiện (sinh bởi gemini; kiểm cơ học 100% + kiểm chéo Claude)',
  };
  applied++;
}

const okAfter = items.filter((x) => x.decoys.some((d) => sharesLemma(x.questionPhrase, d.text))).length;
console.log(`generated=${generated.size} | applied=${applied} | rejected=${Object.keys(rejects).length} | total sharesLemma=${okAfter}/${items.length} (${((okAfter / items.length) * 100).toFixed(1)}%)`);
if (Object.keys(rejects).length > 0) {
  const rc = {};
  for (const v of Object.values(rejects)) rc[v.split(':')[0]] = (rc[v.split(':')[0]] || 0) + 1;
  console.log('reject summary:', rc);
}
if (!dry) {
  fs.writeFileSync(path.join(DIR, 'rejects.json'), JSON.stringify(rejects, null, 2) + '\n');
  fs.writeFileSync(PARA_PATH, JSON.stringify(items, null, 2) + '\n');
}
