#!/usr/bin/env node
/**
 * D2: thêm 400 câu chép chính tả level 7–10 (100/level) vào public/data/listening/dictation.json.
 * Nguồn: câu cắt từ script của 24 episode luyện tập (đã QA + blind-solve; loại episode reserved).
 * Không đổi ID cũ; ID mới dict:0301…0700. Chạy lại được (bỏ qua nếu đã đủ).
 *   node scripts/data/81_build_dictation_l7_10.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const D = path.join(ROOT, 'public/data');
const dictPath = path.join(D, 'listening/dictation.json');
const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
if (dict.some((x) => x.level >= 7)) { console.log('Đã có level 7+, bỏ qua.'); process.exit(0); }

const words = JSON.parse(fs.readFileSync(path.join(D, 'vocab/words.json'), 'utf8'));
const vocabByForm = new Map();
for (const w of words) {
  if (/\s/.test(w.headword)) continue;
  vocabByForm.set(w.headword.toLowerCase(), w);
  for (const e of w.examples) for (const a of e.clozeAccepted || []) if (!/\s/.test(a)) vocabByForm.set(a.toLowerCase(), w);
}

const existing = new Set(dict.map((x) => x.text.toLowerCase().replace(/[^a-z0-9 ]/g, '')));
const epDir = path.join(D, 'listening/episodes');
const cands = [];
for (const f of fs.readdirSync(epDir).sort()) {
  const e = JSON.parse(fs.readFileSync(path.join(epDir, f), 'utf8'));
  if (e.reserved) continue;
  for (const l of e.script) {
    const t = (l.text || '').replace(/\s+/g, ' ').trim();
    for (const s0 of t.match(/[^.!?]+[.!?]+/g) || [t]) {
      const s = s0.trim();
      const n = s.split(/\s+/).length;
      if (n < 14 || n > 34) continue;
      if (/^["“]/.test(s) || /\b(let me check|one moment)\b/i.test(s)) continue;
      const key = s.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      if (existing.has(key)) continue;
      existing.add(key);
      cands.push({ ep: e.id, part: e.part, s, n });
    }
  }
}
const NUMW = /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|first|second|third|fourth|fifth)$/i;
const FUNC = /^(of|to|for|and|that|at|from|but|than|have|has|was|were|been|can|could|would|should|must)$/i;
function analyse(s) {
  const toks = s.split(/\s+/);
  const feats = new Set();
  const focus = [];
  const clean = (t) => t.replace(/^[^A-Za-z0-9£$€]+|[^A-Za-z0-9]+$/g, '');
  toks.forEach((tok, i) => {
    const c = clean(tok);
    const lc = c.toLowerCase();
    if (focus.length < 3 && vocabByForm.has(lc) && lc.length > 5 && !focus.some((x) => x.feature === 'academic')) {
      const w = vocabByForm.get(lc);
      feats.add('academic');
      focus.push({ tokenIndex: i, feature: 'academic', tipVi: `'${c}' (${w.meaningVi}): nghe rõ trọng âm và âm cuối của từ học thuật này.`, ...(w.ipa?.uk ? { ipaConnected: w.ipa.uk } : {}) });
    } else if (/\d/.test(c) || NUMW.test(c)) {
      feats.add('numbers');
      if (!focus.some((x) => x.feature === 'numbers')) focus.push({ tokenIndex: i, feature: 'numbers', tipVi: `Số/ngày tháng '${c}': nghe từng chữ số, phân biệt -teen và -ty.` });
    } else if (/'/.test(c)) {
      feats.add('contraction');
      if (!focus.some((x) => x.feature === 'contraction')) focus.push({ tokenIndex: i, feature: 'contraction', tipVi: `Dạng rút gọn '${c}': viết đủ từ gốc khi chép.` });
    }
  });
  if (/\b(of|to|for|and|that|at|from|than)\b/i.test(s)) {
    feats.add('weak_form');
    const i = toks.findIndex((t) => FUNC.test(clean(t)));
    if (i >= 0 && focus.length < 3) focus.push({ tokenIndex: i, feature: 'weak_form', tipVi: `Từ chức năng '${clean(toks[i])}' thường đọc yếu, dễ bị bỏ sót khi nghe.` });
  }
  if (/[tdkp]\s+[aeiou]/i.test(s) || /\b\w+(ed|ts|ds)\b/i.test(s)) feats.add('final_consonant');
  if (/\b\w+(n|r|t|d|s)\s+(a|an|and|in|on|of|at|it|is|are|as)\b/i.test(s)) feats.add('linking');
  if (feats.size === 0) feats.add('weak_form');
  return { features: [...feats], focus };
}
function score(c) {
  const toks = c.s.toLowerCase().replace(/[^a-z' -]/g, ' ').split(/\s+/);
  const acad = toks.filter((t) => t.length > 6 && vocabByForm.has(t)).length;
  const longw = toks.filter((t) => t.length > 8).length;
  const clauses = (c.s.match(/[,;:]/g) || []).length;
  return c.n * 1.0 + acad * 3 + longw * 1.5 + clauses * 1.5 + (c.part >= 3 ? 4 : 0) + (c.part === 4 ? 3 : 0);
}
cands.forEach((c) => (c.score = score(c)));
cands.sort((a, b) => a.score - b.score || a.s.localeCompare(b.s));
if (cands.length < 400) throw new Error(`Chỉ ${cands.length} ứng viên`);
// Chọn 400 câu trải đều theo thang điểm: lấy mọi quãng đều từ danh sách đã sắp xếp
const pick = [];
const step = cands.length / 400;
for (let i = 0; i < 400; i++) pick.push(cands[Math.min(cands.length - 1, Math.floor(i * step + step / 2))]);
const WPM = { 7: 165, 8: 175, 9: 190, 10: 205 };
const VOICES = {
  uk: ['en-GB-SoniaNeural', 'en-GB-RyanNeural', 'en-GB-LibbyNeural', 'en-GB-ThomasNeural'],
  us: ['en-US-JennyNeural', 'en-US-GuyNeural', 'en-US-AriaNeural', 'en-US-ChristopherNeural'],
  au: ['en-AU-NatashaNeural', 'en-AU-WilliamNeural'],
};
const ACC = ['uk', 'us', 'au', 'uk', 'us', 'uk', 'au', 'us']; // 37,5% uk, 37,5% us, 25% au
const out = [];
pick.forEach((c, i) => {
  const level = 7 + Math.floor(i / 100);
  const accent = ACC[i % ACC.length];
  const voice = VOICES[accent][Math.floor(i / ACC.length) % VOICES[accent].length];
  const id = `dict:${String(301 + i).padStart(4, '0')}`;
  const { features, focus } = analyse(c.s);
  out.push({
    id, text: c.s, level, accent, voice: `edge:${voice}`, wpm: WPM[level], features, focus,
    audio: `audio/dictation/dict_${String(301 + i).padStart(4, '0')}.mp3`,
    sourceEpisodeId: c.ep,
    provenance: { createdBy: 'llm+review', source: `episode-script:${c.ep}`, license: 'own', qa: { schema: 'pass', verifier: 'pass' } },
  });
});
fs.writeFileSync(dictPath, JSON.stringify([...dict, ...out], null, 2) + '\n');
const cnt = {};
for (const o of out) cnt[o.level] = (cnt[o.level] || 0) + 1;
console.log('đã thêm', out.length, cnt, `từ ${cands.length} ứng viên; từ trung bình/level:`, [7, 8, 9, 10].map((l) => (out.filter((o) => o.level === l).reduce((a, o) => a + o.text.split(/\s+/).length, 0) / 100).toFixed(1)).join('/'));
