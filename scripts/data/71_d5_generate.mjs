#!/usr/bin/env node
/**
 * D5 bước 2: gọi `agy -p` (Gemini, khác hãng với verifier) sinh lại examples[1] theo lô 40 từ.
 * Đọc data-src/vocab/d5/in_*.json + PROMPT.md, ghi data-src/vocab/d5/out/gen_NNNN.json.
 * Chạy lại được: bỏ qua lô đã có đầu ra hợp lệ.
 *   node scripts/data/71_d5_generate.mjs [--concurrency 4] [--batch 40]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'data-src/vocab/d5');
const OUT = path.join(DIR, 'out');
fs.mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? Number(args[args.indexOf(k) + 1]) : d);
const CONC = opt('--concurrency', 4);
const BATCH = opt('--batch', 40);
const AGY = process.env.AGY_BIN || 'agy';

const prompt = fs.readFileSync(path.join(DIR, 'PROMPT.md'), 'utf8');
const items = fs
  .readdirSync(DIR)
  .filter((f) => /^in_\d+\.json$/.test(f))
  .sort()
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));

const batches = [];
for (let i = 0; i < items.length; i += BATCH) batches.push(items.slice(i, i + BATCH));

function runAgy(text) {
  return new Promise((resolve, reject) => {
    const p = spawn(AGY, ['-p', text], { windowsHide: true });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => { p.kill(); reject(new Error('timeout')); }, 600000);
    p.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve(out) : reject(new Error(`exit ${code}: ${err.slice(0, 200)}`)); });
  });
}

function parseOut(raw, batch) {
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('no JSON array');
  const arr = JSON.parse(m[0]);
  const ids = new Set(batch.map((b) => b.id));
  const got = arr.filter((a) => a && ids.has(a.id) && typeof a.en === 'string');
  if (got.length < batch.length * 0.9) throw new Error(`only ${got.length}/${batch.length}`);
  return got;
}

const FROM_END = args.includes('--from-end');
let next = 0;
async function worker(w) {
  for (;;) {
    const k = next++;
    if (k >= batches.length) return;
    const bi = FROM_END ? batches.length - 1 - k : k;
    const file = path.join(OUT, `gen_${String(bi + 1).padStart(4, '0')}.json`);
    if (fs.existsSync(file) || fs.existsSync(file + '.lock')) continue;
    fs.writeFileSync(file + '.lock', String(process.pid));
    const batch = batches[bi];
    const compact = batch.map((b) => JSON.stringify(b)).join('\n');
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const raw = await runAgy(prompt + '\n' + compact + '\n\nOutput only the JSON array.');
        const got = parseOut(raw, batch);
        fs.writeFileSync(file, JSON.stringify(got, null, 1) + '\n');
        console.log(`[w${w}] batch ${bi + 1}/${batches.length} ok (${got.length})`);
        break;
      } catch (e) {
        console.log(`[w${w}] batch ${bi + 1} attempt ${attempt} failed: ${e.message}`);
      }
    }
  }
}
await Promise.all(Array.from({ length: CONC }, (_, i) => worker(i + 1)));
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.lock') && !fs.existsSync(path.join(OUT, f.replace('.lock', '')))) fs.rmSync(path.join(OUT, f));
console.log('done');
