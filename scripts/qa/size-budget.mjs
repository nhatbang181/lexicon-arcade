#!/usr/bin/env node
// Ngân sách bundle (06-PRODUCTION §3, KIEM-THU §2.2 mục 11 + 12). Chạy SAU `npm run build`.
//   JS khởi động ở `#/` (entry + modulepreload trong dist/index.html), gzip  ≤ 250 KB
//   CSS chính (raw, file css gắn trong index.html)                           ≤ 130 KB
//   Mỗi chunk lazy (gzip)                                                    ≤ 120 KB
//   Precache PWA (raw, theo dist/sw.js)                                      ≤ 1500 KiB
//   Rò dev/test vào bản production: chuỗi cấm trong dist/assets
// Dùng: node scripts/qa/size-budget.mjs [--dist dist] [--json] [--strict-leaks]
// Mặc định chuỗi rò nhóm "đang chờ chủ file khác" chỉ cảnh báo; --strict-leaks coi mọi chuỗi rò là lỗi.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ROOT, parseArgs } from './_lib.mjs';

const args = parseArgs();
const DIST = path.resolve(ROOT, args.dist ?? 'dist');
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`Không thấy ${path.join(DIST, 'index.html')}: chạy "npm run build" trước.`);
  process.exit(2);
}
const KB = 1024;
const gz = (file) => zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length;
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1]);
const toFile = (u) => path.join(DIST, u.replace(/^\/lexicon-arcade\//, '').replace(/^\.?\//, ''));
const entryJs = refs.filter((u) => u.endsWith('.js')).map(toFile);
const entryCss = refs.filter((u) => u.endsWith('.css')).map(toFile);

const results = [];
const check = (name, value, limit, unit) => results.push({ name, value: +value.toFixed(2), limit, unit, ok: value <= limit });

check('JS khởi động ở #/ (gzip)', entryJs.reduce((a, f) => a + gz(f), 0) / KB, 250, 'KB');
check('CSS chính (raw)', entryCss.reduce((a, f) => a + fs.statSync(f).size, 0) / KB, 130, 'KB');

const assets = fs.readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.js')).map((f) => path.join(DIST, 'assets', f));
const entrySet = new Set(entryJs);
let worst = { name: '-', kb: 0 };
for (const f of assets) {
  if (entrySet.has(f)) continue;
  const kb = gz(f) / KB;
  if (kb > worst.kb) worst = { name: path.basename(f), kb };
}
check(`Chunk lazy lớn nhất (gzip): ${worst.name}`, worst.kb, 120, 'KB');

const swFile = path.join(DIST, 'sw.js');
if (fs.existsSync(swFile)) {
  const sw = fs.readFileSync(swFile, 'utf8');
  const urls = [...new Set([...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]))];
  const bytes = urls.reduce((a, u) => a + (fs.existsSync(path.join(DIST, u)) ? fs.statSync(path.join(DIST, u)).size : 0), 0);
  check(`Precache PWA (${urls.length} file, raw)`, bytes / KB, 1500, 'KiB');
} else results.push({ name: 'Precache PWA', value: 0, limit: 1500, unit: 'KiB', ok: false, note: 'không có dist/sw.js' });

// Rò dev/test: chuỗi cấm trong mọi file dist/assets (js + css)
const LEAKS = [
  { s: 'Thư viện component', scope: 'all', owner: 'T1-B (route dev)' },
  { s: 'TASK2_CLAUDE_RESPONSE', scope: 'all', owner: 'T2-C' },
  { s: 'pixelated', scope: 'entry-css', owner: 'T1-C (CSS legacy)' },
  { s: 'v1_fixtures', scope: 'all', owner: 'T1-A (V1)', pending: true },
  { s: 'r1_fixtures', scope: 'all', owner: 'T2-A (R1)', pending: true },
];
const allFiles = fs.readdirSync(path.join(DIST, 'assets')).filter((f) => /\.(js|css)$/.test(f)).map((f) => path.join(DIST, 'assets', f));
const leaks = [];
for (const L of LEAKS) {
  const pool = L.scope === 'entry-css' ? entryCss : allFiles;
  const found = pool.filter((f) => fs.readFileSync(f, 'utf8').includes(L.s)).map((f) => path.basename(f));
  leaks.push({ ...L, found, ok: found.length === 0 });
}

const failedNumbers = results.filter((r) => !r.ok);
const hardLeaks = leaks.filter((l) => !l.ok && (args['strict-leaks'] || !l.pending));
if (args.json) console.log(JSON.stringify({ results, leaks }, null, 2));
else {
  console.log('Ngân sách (dist =', path.relative(ROOT, DIST) || '.', ')');
  for (const r of results) console.log(`  ${r.ok ? 'OK  ' : 'VƯỢT'} ${r.name}: ${r.value} ${r.unit} (ngưỡng ${r.limit})${r.note ? ' - ' + r.note : ''}`);
  console.log('Rò dev/test vào bản production:');
  for (const l of leaks) {
    const tag = l.ok ? 'OK  ' : l.pending && !args['strict-leaks'] ? 'CHỜ ' : 'RÒ  ';
    console.log(`  ${tag} "${l.s}" ${l.ok ? '' : `trong ${l.found.join(', ')} (chủ: ${l.owner})`}`);
  }
  console.log(`\nKết quả: ${failedNumbers.length} chỉ số vượt, ${hardLeaks.length} chuỗi rò bị chặn, ${leaks.filter((l) => !l.ok && l.pending).length} rò đang chờ chủ file.`);
}
process.exit(failedNumbers.length + hardLeaks.length > 0 ? 1 : 0);
