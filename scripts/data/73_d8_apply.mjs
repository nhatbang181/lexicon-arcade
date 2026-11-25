#!/usr/bin/env node
/**
 * D8: kiểm cơ học rồi áp l1Traps (bẫy collocation kiểu Việt, sinh bởi gemini) vào public/data/vocab/collocations.json.
 *  - không đổi ID; tăng rev; gắn review. Bỏ từng bẫy "wrong" thực ra là tiếng Anh đúng / vô nghĩa (DROP_WRONG, do soi tay).
 *  - loại cả item nếu whyVi có chữ meta (IELTS/Band) hoặc không còn bẫy hợp lệ -> giữ nguyên bẫy cũ.
 *   node scripts/data/73_d8_apply.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const FILE = path.join(ROOT, 'public/data/vocab/collocations.json');
const OUT = path.join(ROOT, 'data-src/collocations/d8/out');
const dry = process.argv.includes('--dry');
const cols = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const byId = new Map(cols.map((c) => [c.id, c]));
const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const DROP_WRONG = new Set(['judge the impact of', 'invest into education', 'invest into prevention', 'a possible solution for', 'a vital role for', 'food safety',
  'get a consensus about', 'scare reckless behaviour', 'implement reality solutions', 'money incentives', 'cover a gap in the market', 'clear inequality',
  'the unemployment ratio', 'the capacity of V-ing', 'finance literacy', 'curb unsocial behaviour', 'pose a dangerous risk', 'repair habitats', 'repair ecosystems', 'transport methods']);
const gen = [];
for (const f of fs.readdirSync(OUT).filter((f) => /^gen_.*\.json$/.test(f)).sort()) gen.push(...JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')));
const stat = { applied: 0, kept: 0, trapsDropped: 0 }; const rej = {};
for (const g of gen) {
  const x = byId.get(g.id); let why = null;
  if (!x) why = 'unknown id';
  else if (!Array.isArray(g.l1Traps) || g.l1Traps.length < 1 || g.l1Traps.length > 2) why = 'trap count';
  const kept = [];
  if (!why) {
    const ans = x.gaps.flatMap((q) => q.answers.map((a) => a.toLowerCase()));
    const phrase = x.phrase.toLowerCase();
    for (const t of g.l1Traps) {
      const w = (t.wrong || '').trim(), y = (t.whyVi || '').trim(), wl = w.toLowerCase();
      if (!w || !y) { why = 'empty'; break; }
      if (/ielts|band\s*\d|cambridge/i.test(y + ' ' + w)) { why = 'meta text'; break; }
      if (!VI.test(y)) { why = 'whyVi not Vietnamese'; break; }
      if (y.split(/\s+/).length > 30) { why = 'whyVi too long'; break; }
      if (wl === phrase || ans.some((a) => x.gaps.some((q) => q.display.toLowerCase().replace('___', a) === wl))) { why = 'wrong equals a valid form'; break; }
      if (DROP_WRONG.has(wl)) { stat.trapsDropped++; continue; }
      if (kept.some((k) => k.wrong.toLowerCase() === wl)) continue;
      kept.push({ wrong: w, whyVi: y });
    }
    if (!why && !kept.length) why = 'no valid trap left';
  }
  if (why) { rej[g.id] = why; stat.kept++; continue; }
  x.l1Traps = kept;
  x.rev = (x.rev || 1) + 1;
  x.review = { by: 'claude-sonnet-5.5', date: '2026-11-25', verdict: 'pass', scope: 'l1Traps viết lại (sinh bởi gemini; kiểm cơ học 100% + soi tay toàn bộ cụm "wrong")' };
  stat.applied++;
}
console.log(JSON.stringify(stat), 'rejected:', Object.keys(rej).length, rej);
if (!dry) {
  fs.writeFileSync(path.join(ROOT, 'data-src/collocations/d8/rejects.json'), JSON.stringify(rej, null, 1) + '\n');
  fs.writeFileSync(FILE, JSON.stringify(cols, null, 2) + '\n');
}
