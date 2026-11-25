#!/usr/bin/env node
/**
 * Chạy `agy -p` (Gemini) theo lô cho một việc sinh/kiểm nội dung (tiện ích chung của T3-B).
 *   node scripts/data/gem_run.mjs --prompt <file.md> --in <items.json> --out <dir> [--batch 40] [--concurrency 4] [--from-end]
 * Mỗi phần tử của items.json có `id`; Gemini trả mảng JSON, mỗi phần tử có cùng `id`.
 * Đầu ra mỗi lô: <out>/gen_NNNN.json (chạy lại bỏ qua lô đã có). Cần ≥ 90% id của lô quay về.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const get = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const PROMPT = fs.readFileSync(get('--prompt'), 'utf8');
const ITEMS = JSON.parse(fs.readFileSync(get('--in'), 'utf8'));
const OUT = get('--out');
const BATCH = Number(get('--batch', 40));
const CONC = Number(get('--concurrency', 4));
const FROM_END = args.includes('--from-end');
const AGY = process.env.AGY_BIN || 'agy';
fs.mkdirSync(OUT, { recursive: true });

const batches = [];
for (let i = 0; i < ITEMS.length; i += BATCH) batches.push(ITEMS.slice(i, i + BATCH));

function runAgy(text) {
  return new Promise((resolve, reject) => {
    const p = spawn(AGY, ['-p', text], { windowsHide: true });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => { p.kill(); reject(new Error('timeout')); }, 900000);
    p.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve(out) : reject(new Error(`exit ${code}: ${err.slice(0, 200)}`)); });
  });
}
function parseOut(raw, batch) {
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('no JSON array');
  const arr = JSON.parse(m[0]);
  const ids = new Set(batch.map((b) => b.id));
  const got = arr.filter((a) => a && ids.has(a.id));
  if (got.length < batch.length * 0.9) throw new Error(`only ${got.length}/${batch.length}`);
  return got;
}
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
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const raw = await runAgy(PROMPT + '\n' + compact + '\n\nOutput only the JSON array.');
        const got = parseOut(raw, batch);
        fs.writeFileSync(file, JSON.stringify(got, null, 1) + '\n');
        console.log(`[w${w}] batch ${bi + 1}/${batches.length} ok (${got.length})`);
        ok = true;
      } catch (e) {
        console.log(`[w${w}] batch ${bi + 1} attempt ${attempt} failed: ${e.message}`);
      }
    }
    if (!ok) fs.rmSync(file + '.lock', { force: true });
  }
}
await Promise.all(Array.from({ length: CONC }, (_, i) => worker(i + 1)));
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.lock') && fs.existsSync(path.join(OUT, f.replace('.lock', '')))) fs.rmSync(path.join(OUT, f));
console.log('done');
