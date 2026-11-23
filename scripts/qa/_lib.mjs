// Tiện ích dùng chung cho scripts/qa/*.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function parseArgs(argv = process.argv.slice(2)) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[k.slice(2)] = '1';
    else {
      out[k.slice(2)] = next;
      i++;
    }
  }
  return out;
}

/** Duyệt đệ quy, trả đường dẫn tương đối (dấu /) của file khớp `accept`. */
export function walk(dir, accept, skipDir = () => false) {
  const out = [];
  const visit = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      const rel = path.relative(ROOT, full).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (!skipDir(rel)) visit(full);
      } else if (accept(rel)) out.push(rel);
    }
  };
  visit(path.join(ROOT, dir));
  return out;
}

/** Bỏ chú thích // và /* *\/ nhưng giữ nguyên số dòng (thay bằng khoảng trắng). */
export function stripComments(src) {
  let out = '';
  let i = 0;
  let str = null;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (str) {
      out += c;
      if (c === '\\') {
        out += n ?? '';
        i += 2;
        continue;
      }
      if (c === str) str = null;
      i++;
      continue;
    }
    if (c === '/' && n === '/' && src[i - 1] !== ':') {
      while (i < src.length && src[i] !== '\n') {
        out += ' ';
        i++;
      }
      continue;
    }
    if (c === '/' && n === '*') {
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      out += '  ';
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') str = c;
    out += c;
    i++;
  }
  return out;
}

export const isTestFile = (rel) => /\.(test|spec)\.[tj]sx?$/.test(rel) || rel.startsWith('src/test/');
