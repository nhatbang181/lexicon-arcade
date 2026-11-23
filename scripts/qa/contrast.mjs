#!/usr/bin/env node
// D2: tương phản WCAG 2.x của các cặp token trong src/design/tokens.css, theo từng theme.
// Đọc token thật (không tự ghi số), tính tỷ lệ, in bảng, thoát 1 nếu có cặp dưới ngưỡng.
//   chữ thường ≥ 4,5 · thành phần giao diện (viền, icon) ≥ 3,0
// Dùng: node scripts/qa/contrast.mjs [--theme dark,light,exam] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, parseArgs } from './_lib.mjs';

const args = parseArgs();
const css = fs.readFileSync(path.join(ROOT, 'src/design/tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function blockVars(selectorRe) {
  const vars = {};
  for (const m of css.matchAll(new RegExp(`(${selectorRe})\\s*\\{([^}]*)\\}`, 'g'))) {
    for (const v of m[2].matchAll(/--color-([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) vars[v[1]] = v[2];
  }
  return vars;
}
const base = blockVars('@theme');
const THEMES = {
  dark: { ...base, ...blockVars('\\[data-theme="dark"\\]') },
  light: { ...base, ...blockVars('\\[data-theme="light"\\]') },
  exam: { ...base, ...blockVars('\\[data-theme="exam"\\],\\s*\\[data-mode="exam"\\]') },
};

const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lum(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((x) => x + x).join('');
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const SURFACES = ['bg', 'surface', 'surface-2'];
const ACCENTS = ['vocab', 'listening', 'reading', 'writing', 'speaking', 'correct', 'wrong', 'partial', 'info'];
const pairs = []; // [fg, bg, ngưỡng, mô tả]
for (const bg of SURFACES) for (const fg of ['text', 'text-dim', 'text-faint']) pairs.push([fg, bg, 4.5, 'chữ']);
for (const bg of ['bg', 'surface']) for (const fg of ACCENTS) pairs.push([fg, bg, 4.5, 'chữ màu nhấn']);
for (const bg of ACCENTS) pairs.push(['bg', bg, 4.5, 'chữ trên nút màu (Button primary: color=bg)']);
// Viền trang trí không bắt buộc 3:1 (WCAG 1.4.11 chỉ áp cho ranh giới thành phần thiết yếu): chỉ liệt kê khi --all.
for (const bg of SURFACES) pairs.push(['border', bg, 3.0, 'viền (tham khảo)', true]);
for (const fg of ACCENTS) pairs.push([fg, 'bg', 3.0, 'icon/viền màu nhấn']);

const want = (args.theme ?? 'dark,light,exam').split(',');
const rows = [];
for (const theme of want) {
  const t = THEMES[theme];
  for (const [fg, bg, min, what, info] of pairs) {
    if (info && !args.all) continue;
    if (!t[fg] || !t[bg]) continue;
    const r = ratio(t[fg], t[bg]);
    rows.push({ theme, fg, bg, fgHex: t[fg], bgHex: t[bg], ratio: +r.toFixed(2), min, what, ok: r >= min });
  }
}
const fails = rows.filter((r) => !r.ok);
if (args.json) console.log(JSON.stringify({ pairs: rows.length, fails: fails.length, rows }, null, 2));
else {
  for (const theme of want) {
    const mine = rows.filter((r) => r.theme === theme);
    const bad = mine.filter((r) => !r.ok);
    console.log(`\n[${theme}] ${mine.length} cặp, ${bad.length} dưới ngưỡng`);
    for (const r of bad) console.log(`  ${r.ratio.toFixed(2)} < ${r.min}  ${r.fg} ${r.fgHex} trên ${r.bg} ${r.bgHex}  (${r.what})`);
  }
  console.log(`\nTổng: ${rows.length} cặp, ${fails.length} dưới ngưỡng WCAG`);
}
process.exit(fails.length > 0 ? 1 : 0);
