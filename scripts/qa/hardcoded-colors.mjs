#!/usr/bin/env node
// KIEM-THU §2.2 mục 6 (D1): màu cứng trong src/** (hex, rgb/rgba, hsl/hsla, class màu Tailwind thô) – phải dùng token.
// Bỏ qua: src/legacy/**, src/design/tokens.css, file test/fixture, và khối dữ liệu màu trong ChartRenderer.tsx (nếu có).
// Dùng: node scripts/qa/hardcoded-colors.mjs [--json] ; thoát 1 nếu còn màu cứng.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, parseArgs, walk, stripComments, isTestFile } from './_lib.mjs';

const args = parseArgs();
const SKIP_FILES = new Set(['src/design/tokens.css']);
const CHART_RENDERER = 'src/games/_shared/ChartRenderer.tsx';
const files = walk(
  'src',
  (rel) => /\.(tsx?|css)$/.test(rel) && !SKIP_FILES.has(rel) && !isTestFile(rel),
  (rel) => rel === 'src/legacy',
);

// Chỉ miễn khối dữ liệu màu biểu đồ trong ChartRenderer (đánh dấu bằng comment hoặc hằng SERIES_COLORS/DATA_COLORS).
function maskChartDataColors(source) {
  return source
    .replace(/\/\*\s*chart-data-colors-start\s*\*\/[\s\S]*?\/\*\s*chart-data-colors-end\s*\*\//g, (m) =>
      m.replace(/[^\n]/g, ' '),
    )
    .replace(/const\s+(?:CHART|SERIES|DATA)_COLORS\s*(?::[^=]+)?=\s*\[[\s\S]*?\];/g, (m) =>
      m.replace(/[^\n]/g, ' '),
    );
}

const HEX = /(?<![\w&#/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g;
const FUNC = /\b(?:rgba?|hsla?)\(\s*\d/g;
const TW_RAW = /\b(?:bg|text|border)-(?:black|white|[a-z]+-\d{2,3})(?:\/\d{1,3})?\b/g;
const hits = [];
for (const rel of files) {
  const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const text = stripComments(rel === CHART_RENDERER ? maskChartDataColors(raw) : raw);
  text.split('\n').forEach((line, i) => {
    for (const re of [HEX, FUNC, TW_RAW]) {
      re.lastIndex = 0;
      for (const m of line.matchAll(re)) hits.push({ file: rel, line: i + 1, text: line.trim().slice(0, 120), match: m[0] });
    }
  });
}

const byFile = new Map();
for (const h of hits) byFile.set(h.file, (byFile.get(h.file) ?? 0) + 1);
if (args.json) console.log(JSON.stringify({ total: hits.length, files: byFile.size, hits }, null, 2));
else {
  for (const h of hits) console.log(`${h.file}:${h.line}  ${h.match}  ${h.text}`);
  console.log(`\nMàu cứng: ${hits.length} chỗ / ${byFile.size} file (quét ${files.length} file, bỏ legacy, tokens.css, test)`);
}
process.exit(hits.length > 0 ? 1 : 0);
