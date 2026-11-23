#!/usr/bin/env node
// D3: vùng chạm < 44 px của phần tử tương tác, đo bằng Chromium thật ở khung điện thoại.
// Cùng quy tắc với audit-ui.mjs (D3) để số liệu so được; script này chạy nhanh theo danh sách route.
// Cần server: `npx vite --port 5199 --strictPort` (hoặc vite preview) và BASE_URL.
// Dùng: BASE_URL=http://127.0.0.1:5199 node scripts/qa/tap-targets.mjs --routes today,hub,play/v2 [--vp 360x800] [--json]
// Route viết như audit-ui.mjs: không có "/" đầu, route gốc là "today" (có "/" đầu cũng được).
import { createRequire } from 'node:module';
import { parseArgs, ROOT } from './_lib.mjs';
import path from 'node:path';

const require = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = require('@playwright/test');

const args = parseArgs();
const BASE = (process.env.BASE_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const [W, H] = (args.vp ?? '360x800').split('x').map(Number);
const MIN = Number(args.min ?? 44);
// "today" = route gốc. Git Bash đổi "/" đơn lẻ thành đường dẫn ổ đĩa (vd "D:/Git/") nên cũng coi là route gốc.
const toRoute = (r) => (r === 'today' || /^[A-Za-z]:[\/]/.test(r) ? '' : r.replace(/^\/+/, ''));
const routes = (args.routes ?? 'today,hub,stats,settings,play/v1,play/v2,play/v3,play/r1,play/r2,play/l1,play/l2,play/w1,play/w2')
  .split(',')
  .filter(Boolean)
  .map(toRoute);

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const context = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true });
const results = [];
for (const route of routes) {
  const page = await context.newPage();
  await page.goto(`${BASE}/#/${route}`, { waitUntil: 'networkidle' }).catch(() => undefined);
  await page.waitForTimeout(600);
  const found = await page.evaluate((min) => {
    const shown = (el) => {
      for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.05) return false;
      }
      return true;
    };
    const out = [];
    let total = 0;
    for (const el of document.querySelectorAll('button, a[href], [role=button], input:not([type=hidden]), select, textarea')) {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
      if (!shown(el)) continue;
      if (el.tagName === 'SPAN' && el.closest('p, [data-passage], article')) continue;
      total++;
      if (r.width < min || r.height < min) {
        out.push({
          size: `${Math.round(r.width)}x${Math.round(r.height)}`,
          label: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 32),
        });
      }
    }
    return { total, small: out };
  }, MIN);
  results.push({ route: `/${route}`, ...found });
  await page.close();
}
await browser.close();

const smallTotal = results.reduce((a, r) => a + r.small.length, 0);
if (args.json) console.log(JSON.stringify({ viewport: `${W}x${H}`, min: MIN, smallTotal, results }, null, 2));
else {
  console.log(`Vùng chạm < ${MIN}px ở ${W}x${H} (${BASE})`);
  for (const r of results) {
    console.log(`  ${r.small.length === 0 ? 'OK  ' : 'NHỎ '} ${r.route}: ${r.small.length}/${r.total} phần tử tương tác nhỏ`);
    for (const s of r.small.slice(0, 8)) console.log(`        ${s.size}  ${s.label}`);
  }
  console.log(`\nTổng: ${smallTotal} phần tử dưới ${MIN}px trên ${results.length} route`);
}
process.exit(smallTotal > 0 ? 1 : 0);
