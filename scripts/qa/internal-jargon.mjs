#!/usr/bin/env node
// D7: thuật ngữ nội bộ lộ ra giao diện. Quét CHỮ NGƯỜI DÙNG THẤY trong mã nguồn (chuỗi, JSX text,
// các thuộc tính title/aria-label/placeholder), không quét tên biến hay chú thích.
// Cùng mẫu với audit-ui.mjs (JARGON) + vài mã nội bộ khác. Thoát 1 nếu còn.
// Dùng: node scripts/qa/internal-jargon.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, parseArgs, walk, stripComments, isTestFile } from './_lib.mjs';

const args = parseArgs();
const JARGON = /(Mốc M\d|Level \d+ ·|Node \d+\/\d+|\bFSRS\b|Δ ?band|\bINV-[A-Z]|gói copy\/dán)/;
const files = walk(
  'src',
  (rel) => /\.tsx?$/.test(rel) && !isTestFile(rel),
  (rel) => rel === 'src/legacy' || rel === 'src/core/content/schemas',
);
// File chứa dữ liệu/hằng nội bộ không hiển thị trực tiếp thì bỏ (schema, fixture).
// Màn dev (chỉ có khi import.meta.env.DEV) không tới người học.
const SKIP = (rel) => /Dev[A-Za-z]*Screen\.tsx$/.test(rel) || /fixtures?\//.test(rel) || /_fixtures\.ts$/.test(rel) || /\/schemas?\.ts$/.test(rel);

const STRING = /(['"`])((?:\\.|(?!\1).)*)\1/g;
const JSX_TEXT = />([^<>{}\n]*[A-Za-zÀ-ỹ][^<>{}\n]*)</g;
const hits = [];
for (const rel of files) {
  if (SKIP(rel)) continue;
  const text = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  text.split('\n').forEach((line, i) => {
    if (/^\s*(import|export \* from|export \{[^}]*\} from)\b/.test(line)) return;
    const seen = new Set();
    for (const m of line.matchAll(STRING)) {
      const s = m[2];
      if (/^[\w./@#:-]+$/.test(s)) continue; // đường dẫn, id, khoá
      const j = JARGON.exec(s);
      if (j) seen.add(j[0]);
    }
    for (const m of line.matchAll(JSX_TEXT)) {
      const j = JARGON.exec(m[1]);
      if (j) seen.add(j[0]);
    }
    for (const term of seen) hits.push({ file: rel, line: i + 1, term, text: line.trim().slice(0, 140) });
  });
}

if (args.json) console.log(JSON.stringify({ total: hits.length, hits }, null, 2));
else {
  for (const h of hits) console.log(`${h.file}:${h.line}  [${h.term}]  ${h.text}`);
  console.log(`\nThuật ngữ nội bộ lộ ra giao diện: ${hits.length} chỗ (quét ${files.length} file)`);
}
process.exit(hits.length > 0 ? 1 : 0);
