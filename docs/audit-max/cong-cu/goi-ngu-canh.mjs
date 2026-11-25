#!/usr/bin/env node
// goi-ngu-canh.mjs · Tạo "gói ngữ cảnh" cho agent con (builder / reviewer / fixer).
// Công cụ của điều phối (LUAT.md Q4): agent con KHÔNG sửa file này.
//
// Nguyên tắc: CHÉP NGUYÊN VĂN từ tài liệu gốc, không tóm tắt. Mã được trích mà không tìm thấy
// trong tài liệu gốc → thoát mã 1 (không tạo gói thiếu luật). Mã trùng tên ở nhiều file → lấy hết,
// ghi rõ file nguồn (thà thừa còn hơn rơi luật).
//
// Dùng: node docs/audit-max/cong-cu/goi-ngu-canh.mjs <TASK> <builder|reviewer|fixer> [--root <repo>] [--them-ma A1,B2]
// Ra:   docs/audit-max/goi/<TASK>-<vai>.md

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const GAME_IDS = new Set(['V1', 'V2', 'V3', 'R1', 'R2', 'L1', 'L2', 'W1', 'W2', 'S1', 'S2']);
const IGNORE_SINGLE = /^(T\d|E\d)$/; // mã task (T4), bậc hiệu ứng (E0..E3)
const VAI = ['builder', 'reviewer', 'fixer'];
// Gói thường 50–75 KB (≈ 1/3–1/4 danh sách ĐỌC cũ 220–275 KB). Ưu tiên không rơi luật hơn là gọn.
const NGUONG_CANH_BAO_KB = 80;

const PREFIX = '[A-Z]{1,3}\\d?-?[A-Z]?';

// ---------- mã ----------

/** Bung mọi mã trong đoạn văn: dải (V1-1..V1-16, F1–F3, L1-02..06, PP-C1..C6), wildcard (L2-*, K*), mã đơn. */
export function expandCodes(text) {
  const out = new Set();
  let rest = text;

  const range = new RegExp(`\\b(${PREFIX})(\\d{1,3})\\s*(\\.\\.|–|—)\\s*([A-Z]{0,3}\\d?-?[A-Z]?\\d{1,3})\\b`, 'g');
  rest = rest.replace(range, (m, p, a, sep, s2) => {
    // Dấu gạch "–" chỉ là dải khi vế sau có chữ ("F1–F3"); "D11 – 12 icon" không phải dải. ".." cho phép vế sau chỉ là số ("L1-02..06").
    if (sep !== '..' && !/^[A-Z]/.test(s2)) return m;
    // "V2–R2" là hai game, không phải dải: vế sau có chữ thì chữ phải khớp vế trước.
    const letters = (s) => (s.match(/^[A-Z]+/) || [''])[0];
    if (sep !== '..' && /^[A-Z]/.test(s2) && letters(s2) !== letters(p)) return m;
    const bStr = s2.startsWith(p) ? s2.slice(p.length) : (s2.match(/\d+$/) || [''])[0];
    const from = Number(a);
    const to = Number(bStr);
    if (!Number.isFinite(to) || to < from || to - from > 40) return m;
    const width = a.startsWith('0') ? a.length : 0;
    for (let n = from; n <= to; n++) {
      const code = p + String(n).padStart(width, '0');
      if (!GAME_IDS.has(code) && !IGNORE_SINGLE.test(code)) out.add(code);
    }
    return ' ';
  });

  // "L2-*", "K*" là wildcard; "**V1**" (chữ đậm markdown) thì không.
  const wild = new RegExp(`(?<![\\w*-])(${PREFIX})\\*(?!\\*)`, 'g');
  rest = rest.replace(wild, (m, p) => {
    out.add(`*${p}`);
    return ' ';
  });

  const single = /(?<![\w-])([A-Z]{1,3}\d?-[A-Z]?\d{1,3}|[A-Z]\d{1,2})(?![\w-])/g;
  let m;
  while ((m = single.exec(rest))) {
    const code = m[1];
    if (GAME_IDS.has(code) || IGNORE_SINGLE.test(code)) continue;
    const before = rest.slice(Math.max(0, m.index - 10), m.index);
    if (/cổng\W*$/i.test(before)) continue; // "cổng G3" là cổng (07 §2), không phải mã lỗi G3
    out.add(code);
  }
  return [...out];
}

function firstCell(line) {
  const c = line.match(/^\s*\|\s*([^|]+?)\s*\|/);
  return c ? c[1].replace(/[*`]/g, '').trim() : null;
}
function bulletToken(line) {
  const b = line.match(/^\s*[-*]\s+\**`?([A-Z][A-Z0-9-]*[0-9])/);
  return b ? b[1] : null;
}
function matchCode(token, code) {
  if (!token) return false;
  if (code.startsWith('*')) {
    const p = code.slice(1);
    return token.startsWith(p) && /^\d+$/.test(token.slice(p.length));
  }
  return token === code;
}

/** Tìm định nghĩa của một mã (dòng bảng có ô đầu = mã, hoặc gạch đầu dòng mở đầu bằng mã). */
export function findCodeDefs(code, sources) {
  const defs = [];
  for (const { file, lines } of sources) {
    let fence = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*```/.test(line)) { fence = !fence; continue; }
      if (fence) continue;
      if (matchCode(firstCell(line), code)) {
        defs.push({ file, text: line });
        continue;
      }
      if (matchCode(bulletToken(line), code)) {
        const indent = line.match(/^\s*/)[0].length;
        const block = [line];
        for (let j = i + 1; j < lines.length; j++) {
          const l = lines[j];
          if (!l.trim()) break;
          if (l.match(/^\s*/)[0].length <= indent) break;
          block.push(l);
        }
        defs.push({ file, text: block.join('\n') });
      }
    }
  }
  return defs;
}

// ---------- mục ----------

function headings(lines) {
  const hs = [];
  let fence = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { fence = !fence; return; }
    if (fence) return;
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) hs.push({ i, level: h[1].length, title: h[2].replace(/[*`]/g, '').trim() });
  });
  return hs;
}

/** Lấy nguyên văn một mục theo số (vd "3", "6.3", "5b", "2.2"); "*" = cả file. Không lấy sang mục ngang hàng kế tiếp. */
export function extractSection(md, sec) {
  if (sec === '*') return md.trimEnd();
  const lines = md.split(/\r?\n/);
  const hs = headings(lines);
  const esc = sec.replace(/\./g, '\\.');
  const re = new RegExp(`^(?:§\\s*)?${esc}(?:[.\\s·:)]|$)`);
  const k = hs.findIndex((h) => re.test(h.title));
  if (k < 0) return null;
  const start = hs[k].i;
  const next = hs.slice(k + 1).find((h) => h.level <= hs[k].level);
  const end = next ? next.i : lines.length;
  return lines.slice(start, end).join('\n').trimEnd();
}

// ---------- TASKS.md ----------

/** Trả về phần của task trong TASKS.md: text để đưa vào gói, codeText để dò mã, filesText, các task "như Tx-Y". */
export function taskText(tasksMd, task) {
  const lines = tasksMd.split(/\r?\n/);
  const hs = headings(lines);
  const firstWave = hs.find((h) => h.level === 2 && /^ĐỢT\s/i.test(h.title));
  const preamble = lines.slice(0, firstWave ? firstWave.i : 0).join('\n').trimEnd();

  const own = hs.find((h) => h.level === 3 && (h.title === task || h.title.startsWith(task + ' ')));
  let text, codeText, filesText;
  if (own) {
    const next = hs.find((h) => h.i > own.i && h.level <= 3);
    text = lines.slice(own.i, next ? next.i : lines.length).join('\n').trimEnd();
    codeText = text;
    const fl = text.split('\n').find((l) => /File độc quyền/i.test(l));
    filesText = fl || '';
  } else {
    const rowIdx = lines.findIndex((l) => firstCell(l) === task);
    if (rowIdx < 0) return null;
    const wave = [...hs].reverse().find((h) => h.level === 2 && h.i < rowIdx);
    const next = hs.find((h) => h.i > wave.i && h.level <= 2);
    const waveLines = lines.slice(wave.i, next ? next.i : lines.length);
    text = waveLines.join('\n').trimEnd();
    codeText = [lines[rowIdx], ...waveLines.filter((l) => !/^\s*\|/.test(l))].join('\n');
    filesText = (lines[rowIdx].split('|')[2] || '').trim();
  }
  const nhu = [...filesText.matchAll(/như\s+(T\d-[A-Z])/g)].map((x) => x[1]);
  const nhuFiles = nhu.map((t) => {
    const r = taskText(tasksMd, t);
    return r ? `(${t}) ${r.filesText}` : `(${t}) KHÔNG TÌM THẤY`;
  });
  return { text, codeText, filesText, nhu, nhuFiles, preamble };
}

export function pathPrefixes(filesText) {
  return [...filesText.matchAll(/`([^`]+)`/g)]
    .map((x) => x[1].replace(/\/?\*\*.*$/, '').replace(/\{.*$/, '').replace(/\/$/, '').replace(/^\.\//, ''))
    .filter((p) => p.includes('/') && p.length >= 6);
}

/** Mục trong HANDOFF.md có nhắc task, đợt, hoặc đường dẫn file độc quyền của task. */
export function handoffItems(md, keys) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let heading = '';
  let lastHeadingOut = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^#{1,6}\s/.test(l)) { heading = l; continue; }
    if (!/^\s*([-*]|\d+\.|\|)\s/.test(l)) continue;
    const block = [l];
    for (let j = i + 1; j < lines.length; j++) {
      const n = lines[j];
      if (!n.trim() || /^#{1,6}\s/.test(n) || /^\s*([-*]|\d+\.|\|)\s/.test(n)) break;
      block.push(n);
    }
    const t = block.join('\n');
    if (keys.some((k) => t.includes(k))) {
      if (lastHeadingOut !== heading) { out.push(heading); lastHeadingOut = heading; }
      out.push(t);
    }
  }
  return out.join('\n');
}

// ---------- tạo gói ----------

function readRel(root, rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function resolveDoc(root, name) {
  for (const dir of ['docs/audit-max', 'docs/audit-max/antigravity']) {
    if (fs.existsSync(path.join(root, dir, name))) return `${dir}/${name}`;
  }
  return null;
}
function resolveNumbered(root, nn) {
  const dir = path.join(root, 'docs/audit-max');
  const f = fs.readdirSync(dir).find((x) => x.startsWith(nn + '-') && x.endsWith('.md'));
  return f ? `docs/audit-max/${f}` : null;
}
function resolvePhuLuc(root, letter) {
  const dir = path.join(root, 'docs/audit-max/phu-luc');
  const f = fs.readdirSync(dir).find((x) => x.startsWith(letter + '-') && x.endsWith('.md'));
  return f ? `docs/audit-max/phu-luc/${f}` : null;
}

function expandSecRange(a, b) {
  if (!b) return [a];
  const from = Number(a);
  const to = Number(b);
  if (!Number.isInteger(from) || !Number.isInteger(to) || to < from) return [a];
  return Array.from({ length: to - from + 1 }, (_, k) => String(from + k));
}

/** Tham chiếu mục trong đoạn văn: "03 §3", "`07` §2", "02 §3–§4", "`KIEM-THU.md` §3", "`phu-luc/A…` §2.6". */
export function sectionRefs(text) {
  const refs = [];
  const SEC = '(\\d+[a-z]?(?:\\.\\d+)?)(?:\\s*[–-]\\s*§?\\s*(\\d+))?';
  for (const m of text.matchAll(new RegExp(`(?<![\\w.-])(0[1-8])\`?\\s*§\\s*${SEC}`, 'g'))) {
    for (const s of expandSecRange(m[2], m[3])) refs.push({ kind: 'nn', key: m[1], sec: s });
  }
  for (const m of text.matchAll(new RegExp(`\`?([A-Z0-9][\\w-]*\\.md)\`?\\s*§\\s*${SEC}`, 'g'))) {
    for (const s of expandSecRange(m[2], m[3])) refs.push({ kind: 'file', key: m[1], sec: s });
  }
  for (const m of text.matchAll(new RegExp(`phu-luc\\/([A-E])[^\\s\`]*\`?\\s*§\\s*${SEC}`, 'g'))) {
    for (const s of expandSecRange(m[2], m[3])) refs.push({ kind: 'pl', key: m[1], sec: s });
  }
  return refs;
}

const CODE_SOURCES = [
  'docs/audit-max/LUAT.md',
  'docs/audit-max/antigravity/04-LUAT-CUNG.md',
  'docs/audit-max/01-GAME.md',
  'docs/audit-max/02-UI-UX.md',
  'docs/audit-max/03-ANIMATION-FEEDBACK.md',
  'docs/audit-max/04-DATA-NOI-DUNG.md',
  'docs/audit-max/05-FLOW.md',
  'docs/audit-max/06-PRODUCTION.md',
  'docs/audit-max/07-QUY-TRINH-KIEM-CHEO.md',
  'docs/audit-max/08-NGUON-ASSET.md',
  'docs/audit-max/KIEM-THU.md',
  'docs/audit-max/antigravity/02-KE-HOACH.md',
  'docs/audit-max/antigravity/07-PLAN-TONG.md',
  'docs/audit-max/antigravity/09-PHUONG-PHAP-HOC.md',
  'docs/audit-max/antigravity/10-DATA.md',
  'docs/audit-max/antigravity/11-ASSET.md',
  'docs/audit-max/antigravity/12-UI-UX.md',
  'docs/audit-max/antigravity/13-ANIMATION.md',
  'docs/audit-max/antigravity/14-TOI-UU-WEB.md',
  'docs/audit-max/antigravity/15-PRODUCTION-BO-SUNG.md',
  'docs/audit-max/antigravity/16-GHI-CHU-BAY.md',
];

export function buildPack({ root, task, vai, themMa = [] }) {
  const cfg = JSON.parse(readRel(root, 'docs/audit-max/goi/them.json'));
  const errors = [];
  const parts = [];
  const seenSections = new Set();
  const sizeOf = (s) => Buffer.byteLength(s, 'utf8');

  const addSection = (rel, sec, why) => {
    const key = `${rel}#${sec}`;
    if (seenSections.has(key)) return;
    seenSections.add(key);
    if (!rel || !fs.existsSync(path.join(root, rel))) {
      errors.push(`Không tìm thấy file cho mục ${sec} (${why})`);
      return;
    }
    const body = extractSection(readRel(root, rel), sec);
    if (body == null) {
      if (!(cfg.bo_qua_muc || {})[key]) errors.push(`Không tìm thấy mục §${sec} trong ${rel} (${why})`);
      return;
    }
    // Không chép trùng: mục con đã nằm trong mục cha thì bỏ; mục cha đến sau thì thay mục con.
    if (parts.some((p) => p.includes(body))) return;
    for (let i = parts.length - 1; i >= 0; i--) {
      const m = parts[i].match(/^\n---\n<!-- nguồn: [^\n]*-->\n([\s\S]*)\n$/);
      if (m && body.includes(m[1])) parts.splice(i, 1);
    }
    parts.push(`\n---\n<!-- nguồn: ${rel} ${sec === '*' ? '(cả file)' : '§' + sec} · lý do: ${why} -->\n${body}\n`);
  };

  // 1. Phần của task trong TASKS.md
  const tasksMd = readRel(root, 'docs/audit-max/TASKS.md');
  const t = taskText(tasksMd, task);
  if (!t) throw new Error(`Không tìm thấy task ${task} trong TASKS.md`);

  const header = [];
  let commit = '?';
  try { commit = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim(); } catch {}
  header.push(`# GÓI NGỮ CẢNH · ${task} · ${vai}`);
  header.push('');
  header.push(`> Tạo bởi \`docs/audit-max/cong-cu/goi-ngu-canh.mjs\` từ commit \`${commit}\` lúc ${new Date().toISOString()}. **Đừng sửa tay**: chạy lại script.`);
  header.push('> Mọi đoạn dưới đây **chép nguyên văn** từ tài liệu gốc (ghi nguồn ở đầu mỗi đoạn). Gói này thay cho danh sách "ĐỌC" dài trước đây.');
  header.push('> Thứ tự ưu tiên khi mâu thuẫn giữ nguyên: `DECISIONS.md` > `LUAT.md` > `01…08`, `TASKS.md`, `KIEM-THU.md` > `antigravity/` > tài liệu khác > code.');
  header.push('> **Thiếu luật hoặc nghi ngờ:** tra file gốc theo mã, vd `rg -n "\\| J1 \\|" docs/audit-max`. Gói không đủ không phải lý do để đoán.');
  header.push('');
  header.push('## Phạm vi của task');
  header.push('');
  header.push(t.text);
  if (t.nhuFiles.length) {
    header.push('');
    header.push('**File độc quyền của task được nhắc ("như …"):**');
    for (const f of t.nhuFiles) header.push(`- ${f}`);
  }
  parts.push(header.join('\n') + '\n');
  parts.push(`\n---\n<!-- nguồn: docs/audit-max/TASKS.md (phần đầu, áp mọi task) -->\n${t.preamble}\n`);

  // 2. Độ khó, bước con
  const doKho = readRel(root, 'docs/audit-max/antigravity/05-DO-KHO-TASK.md');
  const rows = doKho.split(/\r?\n/).filter((l) => (firstCell(l) || '').startsWith(task));
  if (rows.length) {
    const head = doKho.split(/\r?\n/).filter((l) => /^\|\s*Task\s*\|/.test(l) || /^\|\s*---/.test(l)).slice(0, 2);
    parts.push(`\n---\n<!-- nguồn: docs/audit-max/antigravity/05-DO-KHO-TASK.md §1 (dòng của ${task}) -->\n${[...head, ...rows].join('\n')}\n`);
  }
  const step = extractSection(doKho, task);
  if (step) parts.push(`\n---\n<!-- nguồn: docs/audit-max/antigravity/05-DO-KHO-TASK.md §2 ${task} -->\n${step}\n`);

  // 3. Mục mặc định theo vai và theo task
  const groups = [cfg.all, cfg[vai]];
  for (const [prefix, g] of Object.entries(cfg.theo_task || {})) if (task.startsWith(prefix)) groups.push(g[vai] ? { ...g, ...g[vai] } : g);
  const extraCodes = [];
  for (const g of groups) {
    if (!g) continue;
    for (const [rel, sec] of g.sections || []) addSection(`docs/audit-max/${rel}`, sec, `mặc định (${vai})`);
    for (const rel of g.files || []) addSection(`docs/audit-max/${rel}`, '*', `mặc định (${vai})`);
    extraCodes.push(...(g.codes || []));
  }

  // 4. Mục được trích trong phần task
  for (const r of sectionRefs(t.codeText)) {
    const rel = r.kind === 'nn' ? resolveNumbered(root, r.key) : r.kind === 'pl' ? resolvePhuLuc(root, r.key) : resolveDoc(root, r.key);
    if (!rel) { errors.push(`Không tìm thấy file "${r.key}" (được trích trong ${task})`); continue; }
    addSection(rel, r.sec, `được trích trong ${task}`);
  }

  // 5. Mã được trích
  const sources = CODE_SOURCES.filter((rel) => fs.existsSync(path.join(root, rel)))
    .map((rel) => ({ file: rel, lines: readRel(root, rel).split(/\r?\n/) }));
  for (const dir of ['docs/audit-max/phu-luc']) {
    for (const f of fs.readdirSync(path.join(root, dir)).filter((x) => x.endsWith('.md'))) {
      sources.push({ file: `${dir}/${f}`, lines: readRel(root, `${dir}/${f}`).split(/\r?\n/) });
    }
  }
  const boQua = cfg.bo_qua || {};
  const codes = [...new Set([...expandCodes(t.codeText), ...extraCodes, ...themMa])].filter((c) => !boQua[c]);
  const packSoFar = () => parts.join('');
  const codeOut = [];
  const found = [];
  for (const c of codes) {
    const defs = findCodeDefs(c, sources);
    if (!defs.length) { errors.push(`Mã ${c} được trích nhưng không có định nghĩa trong tài liệu gốc`); continue; }
    found.push(c);
    const fresh = defs.filter((d) => !packSoFar().includes(d.text));
    if (!fresh.length) continue;
    codeOut.push(`<!-- ${c}: ${[...new Set(fresh.map((d) => d.file))].join(', ')} -->`);
    for (const d of fresh) codeOut.push(d.text.includes('\n') ? d.text : `${d.text}  ← \`${path.basename(d.file)}\``);
  }
  if (codeOut.length) parts.push(`\n---\n## Mã luật và mã lỗi được trích (nguyên văn, kèm file nguồn)\n\n${codeOut.join('\n')}\n`);

  // 6. HANDOFF
  const wave = task.match(/^T(\d)/);
  const keys = [task, ...t.nhu, ...pathPrefixes(t.filesText + ' ' + t.nhuFiles.join(' '))];
  if (wave) keys.push(`Đợt ${wave[1]}`, `đợt ${wave[1]}`);
  const hf = handoffItems(readRel(root, 'docs/audit-max/HANDOFF.md'), keys);
  parts.push(`\n---\n## HANDOFF liên quan (lọc theo: ${keys.join(', ')})\n\n> Đọc thêm \`docs/audit-max/HANDOFF.md\` **trong worktree của task** nếu nó mới hơn master.\n\n${hf || '(không có mục nào khớp)'}\n`);

  // 7. Danh sách nguồn
  const files = [...new Set([...seenSections].map((k) => k.split('#')[0]))];
  parts.push(`\n---\n## Nguồn đã dùng\n\n${['docs/audit-max/TASKS.md', 'docs/audit-max/antigravity/05-DO-KHO-TASK.md', ...files, 'docs/audit-max/HANDOFF.md'].map((f) => `- \`${f}\``).join('\n')}\n\nMã đã lấy: ${found.join(', ') || '(không)'}\n`);

  return { text: parts.join(''), errors, codes: found };
}

// ---------- CLI ----------

function main(argv) {
  const args = argv.slice(2);
  const task = args[0];
  const vai = args[1];
  const rootIdx = args.indexOf('--root');
  const themIdx = args.indexOf('--them-ma');
  const root = rootIdx >= 0 ? path.resolve(args[rootIdx + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const themMa = themIdx >= 0 ? args[themIdx + 1].split(',').map((s) => s.trim()).filter(Boolean) : [];
  if (!task || !VAI.includes(vai)) {
    console.error('Dùng: node docs/audit-max/cong-cu/goi-ngu-canh.mjs <TASK> <builder|reviewer|fixer> [--root <repo>] [--them-ma A1,B2]');
    process.exit(2);
  }
  let res;
  try {
    res = buildPack({ root, task, vai, themMa });
  } catch (e) {
    console.error(`LỖI: ${e.message}`);
    process.exit(1);
  }
  if (res.errors.length) {
    console.error(`LỖI: gói ${task}-${vai} thiếu ${res.errors.length} mục, KHÔNG tạo gói:`);
    for (const e of res.errors) console.error(`  - ${e}`);
    console.error('Sửa tài liệu gốc, hoặc thêm vào docs/audit-max/goi/them.json "bo_qua" / "bo_qua_muc" kèm lý do.');
    process.exit(1);
  }
  const outRel = `docs/audit-max/goi/${task}-${vai}.md`;
  fs.writeFileSync(path.join(root, outRel), res.text, 'utf8');
  const kb = Buffer.byteLength(res.text, 'utf8') / 1024;
  console.log(`OK ${outRel} · ${kb.toFixed(1)} KB · ${res.codes.length} mã`);
  if (kb > NGUONG_CANH_BAO_KB) console.log(`CẢNH BÁO: gói > ${NGUONG_CANH_BAO_KB} KB, xem lại them.json (mục mặc định nào thừa).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv);
