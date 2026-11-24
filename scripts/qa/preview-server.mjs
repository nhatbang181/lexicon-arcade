// Dựng bản build production vào `dist-e2e/` rồi chạy `vite preview` để E2E đo hiệu năng và offline
// (dev server không có service worker và không có CSP). Dùng trong e2e/perf.spec.ts, e2e/offline.spec.ts.
//   const srv = await startPreview({ port }); ... await srv.stop();
// Build lại khi dist-e2e chưa có, cũ hơn mã nguồn, hoặc đặt PW_REBUILD=1. Base production là /lexicon-arcade/.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './_lib.mjs';

const OUT_DIR = 'dist-e2e';
const BASE = '/lexicon-arcade/';
const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

function newestMtime(dir) {
  let newest = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    newest = Math.max(newest, e.isDirectory() ? newestMtime(full) : fs.statSync(full).mtimeMs);
  }
  return newest;
}

// Build cũ hơn mã nguồn thì build lại, để E2E không đo nhầm bản cũ.
function mtimeOrZero(p) {
  return fs.existsSync(p) ? fs.statSync(p).mtimeMs : 0;
}

function isStale() {
  const index = path.join(ROOT, OUT_DIR, 'index.html');
  if (!fs.existsSync(index)) return true;
  const built = fs.statSync(index).mtimeMs;
  const inputs = [
    newestMtime(path.join(ROOT, 'src')),
    newestMtime(path.join(ROOT, 'public')),
    mtimeOrZero(path.join(ROOT, 'vite.config.ts')),
    mtimeOrZero(path.join(ROOT, 'index.html')),
    mtimeOrZero(path.join(ROOT, 'package.json')),
    mtimeOrZero(path.join(ROOT, 'package-lock.json')),
  ];
  return Math.max(...inputs) > built;
}

async function waitFor(url, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* chưa sẵn sàng */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`vite preview không sẵn sàng sau ${timeoutMs} ms: ${url}`);
}

export async function startPreview({ port }) {
  if (isStale() || process.env.PW_REBUILD === '1') {
    const r = spawnSync(process.execPath, [viteBin, 'build', '--outDir', OUT_DIR, '--emptyOutDir'], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    if (r.status !== 0) throw new Error('vite build cho E2E thất bại');
  }
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--outDir', OUT_DIR, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: ROOT, stdio: 'ignore' },
  );
  const url = `http://127.0.0.1:${port}${BASE}`;
  await waitFor(url, 30_000);
  return {
    url,
    stop: async () => {
      child.kill();
    },
  };
}
