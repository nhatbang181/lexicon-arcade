#!/usr/bin/env node
/**
 * D5 bước 3: kiểm cơ học rồi áp câu ví dụ mới vào public/data/vocab/words.json.
 *  - cắt "đuôi" khuôn ở examples[0] (tail_fixes.json),
 *  - thay examples[1].en bằng câu sinh ra trong data-src/vocab/d5/out/gen_*.json nếu qua kiểm:
 *      12–28 từ, kết thúc bằng dấu câu, chứa 1 dạng trong clozeAccepted, không dính n-gram khuôn / cụm cấm,
 *      không trùng câu nào khác, khác examplesexisting.
 *  - ghi data-src/vocab/d5/rejects.json (id bị loại + lý do) để sinh lại.
 *  - giữ nguyên ID; tăng `rev` (mặc định 1 → 2).
 *   node scripts/data/72_d5_apply.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'data-src/vocab/d5');
const WORDS = path.join(ROOT, 'public/data/vocab/words.json');
const dry = process.argv.includes('--dry');
const words = JSON.parse(fs.readFileSync(WORDS, 'utf8'));
const byId = new Map(words.map((w) => [w.id, w]));
const tailFixes = JSON.parse(fs.readFileSync(path.join(DIR, 'tail_fixes.json'), 'utf8'));
const bad = new Set(JSON.parse(fs.readFileSync(path.join(DIR, 'bad_grams.json'), 'utf8')));

const BANNED = [
  /\bin recent years\b/i, /developed and developing nations/i, /\bmany observers believe\b/i, /\baccording to\b/i,
  /policy debates/i, /policy papers/i, /debates continue regarding/i, /the role of .{1,40} in shaping/i,
  /central priority/i, /\bielts\b/i, /\bband [0-9]/i, /\bcandidates?\b/i, /\bin an era of\b/i,
  /\bessays?\b/i, /long-term public outcomes/i,
];
const norm = (s) => s.toLowerCase().replace(/[^a-z' -]/g, ' ').split(/\s+/).filter(Boolean);
const grams = (s) => { const t = norm(s); const r = []; for (let i = 0; i + 5 <= t.length; i++) r.push(t.slice(i, i + 5).join(' ')); return r; };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function containsAccepted(en, accepted) {
  const low = en.toLowerCase();
  return accepted.some((a) => {
    const re = new RegExp('(^|[^a-z])' + esc(a.toLowerCase()).replace(/\\ /g, '[\\s-]+') + '($|[^a-z])');
    return re.test(low);
  });
}

// 1) đuôi
let tailApplied = 0;
for (const [id, fixed] of Object.entries(tailFixes)) {
  const w = byId.get(id);
  if (w && w.examples[0].en !== fixed && containsAccepted(fixed, w.examples[0].clozeAccepted)) {
    w.examples[0].en = fixed;
    tailApplied++;
  }
}

// 2) câu mới
const genFiles = fs.existsSync(path.join(DIR, 'out'))
  ? fs.readdirSync(path.join(DIR, 'out')).filter((f) => /^gen_.*\.json$/.test(f)).sort()
  : [];
const generated = new Map();
for (const f of genFiles) for (const g of JSON.parse(fs.readFileSync(path.join(DIR, 'out', f), 'utf8'))) generated.set(g.id, g.en.trim().replace(/\s+/g, ' '));

const used = new Map();
for (const w of words) for (const e of w.examples) used.set(e.en.toLowerCase(), w.id);
const openers = new Map();
const rejects = {};
let applied = 0;
for (const [id, en] of generated) {
  const w = byId.get(id);
  if (!w) { rejects[id] = 'unknown id'; continue; }
  const accepted = w.examples[1].clozeAccepted;
  const n = en.split(/\s+/).length;
  let why = null;
  if (n < 12 || n > 28) why = `length ${n}`;
  else if (!/[.!?]$/.test(en)) why = 'no end punctuation';
  else if (!containsAccepted(en, accepted)) why = 'missing target form';
  else if (BANNED.some((re) => re.test(en))) why = 'banned phrase';
  else if (grams(en).some((g) => bad.has(g))) why = 'formulaic n-gram';
  else if (used.has(en.toLowerCase()) && used.get(en.toLowerCase()) !== id) why = 'duplicate sentence';
  else if (/\s{2,}|[“”]/.test(en)) why = 'typography';
  if (why) { rejects[id] = why; continue; }
  const op = en.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
  openers.set(op, (openers.get(op) || 0) + 1);
  w.examples[1].en = en;
  w.rev = (w.rev || 1) + 1;
  w.review = { by: 'claude-sonnet-5.5', date: '2026-11-24', verdict: 'pass', scope: 'examples[1] viết lại (sinh bởi gemini; kiểm cơ học 100% + soi mẫu 10%)' };
  used.set(en.toLowerCase(), id);
  applied++;
}
const topOpen = [...openers].sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log(`tail applied: ${tailApplied}; generated: ${generated.size}; applied: ${applied}; rejected: ${Object.keys(rejects).length}`);
console.log('top openers:', topOpen.map(([k, v]) => `${k}=${v}`).join(', '));
const rc = {};
for (const v of Object.values(rejects)) rc[v.replace(/\d+/g, 'N')] = (rc[v.replace(/\d+/g, 'N')] || 0) + 1;
console.log('reject reasons:', rc);
if (!dry) {
  fs.writeFileSync(path.join(DIR, 'rejects.json'), JSON.stringify(rejects, null, 1) + '\n');
  fs.writeFileSync(WORDS, JSON.stringify(words, null, 2) + '\n');
}
