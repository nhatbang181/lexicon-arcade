#!/usr/bin/env node
// KIEM-THU §2.2 mục 6 (D1): màu cứng trong src/** (hex, rgb(), rgba()) – phải dùng token.
// Bỏ qua: src/legacy/**, src/design/tokens.css, file test/fixture, dữ liệu màu của ChartRenderer.
// Dùng: node scripts/qa/hardcoded-colors.mjs [--json] ; thoát 1 nếu còn màu cứng.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, parseArgs, walk, stripComments, isTestFile } from './_lib.mjs';

const args = parseArgs();
const SKIP_FILES = new Set(['src/design/tokens.css', 'src/games/_shared/ChartRenderer.tsx']);
const files = walk(
  'src',
  (rel) => /\.(tsx?|css)$/.test(rel) && !SKIP_FILES.has(rel) && !isTestFile(rel),
  (rel) => rel === 'src/legacy',
);

const HEX = /(?<![\w&#/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g;
const FUNC = /\brgba?\(\s*\d/g;
const hits = [];
for (const rel of files) {
  const text = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  text.split('\n').forEach((line, i) => {
    for (const re of [HEX, FUNC]) {
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
  console.log(`\nMàu cứng: ${hits.length} chỗ / ${byFile.size} file (quét ${files.length} file, bỏ legacy, tokens.css, ChartRenderer, test)`);
}
process.exit(hits.length > 0 ? 1 : 0);
