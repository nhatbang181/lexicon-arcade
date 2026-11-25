#!/usr/bin/env node
/**
 * Generate Gate G1 contact sheets (dark + light themes, real iPhone & laptop sizes)
 * into docs/audit-max/bang-asset/<group>-{dark,light}.png using Playwright Chromium.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, 'public', 'assets');
const OUT_DIR = path.join(ROOT, 'docs', 'audit-max', 'bang-asset');
const PORT = 4191;

fs.mkdirSync(OUT_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.css': 'text/css; charset=utf-8',
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/sheet.html') {
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(currentHtml);
        return;
      }
      const safeRel = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
      const fullPath = path.join(ROOT, 'public', safeRel);
      if (!fullPath.startsWith(path.join(ROOT, 'public')) || !fs.existsSync(fullPath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(fullPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(fullPath).pipe(res);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

let currentHtml = '';

function kb(relPath) {
  const full = path.join(ROOT, relPath);
  return `${(fs.statSync(full).size / 1024).toFixed(1)} KB`;
}

function themeCss(theme) {
  if (theme === 'dark') {
    return `
      --bg: #0B0F1A; --surface: #121829; --surface2: #1A2238;
      --border: #606E8E; --text: #E8ECF5; --dim: #9AA5BE; --accent: #A78BFA;
    `;
  }
  return `
    --bg: #F7F8FB; --surface: #FFFFFF; --surface2: #F1F3F8;
    --border: #7B8598; --text: #0F172A; --dim: #475569; --accent: #5B21B6;
  `;
}

function wrapHtml(title, subtitle, theme, bodyHtml, width = 960) {
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<style>
@font-face {
  font-family: "Baloo 2";
  src: url("/assets/fonts/baloo-2-vietnamese-700.woff2") format("woff2");
  font-weight: 700;
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
}
@font-face {
  font-family: "Baloo 2";
  src: url("/assets/fonts/baloo-2-latin-700.woff2") format("woff2");
  font-weight: 700;
  unicode-range: U+0020-007E, U+2013-2014, U+2018-2019, U+201C-201D, U+2022, U+2026, U+00B0-00B1, U+00B7, U+00D7, U+2248;
}
:root { ${themeCss(theme)} }
* { box-sizing: border-box; }
body {
  margin: 0; padding: 24px; width: ${width}px;
  background: var(--bg); color: var(--text);
  font-family: "Segoe UI", system-ui, sans-serif;
}
header { margin-bottom: 18px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
h1 { margin: 0 0 4px; font-family: "Baloo 2", system-ui, sans-serif; font-size: 26px; line-height: 1.2; }
.sub { margin: 0; font-size: 13px; color: var(--dim); }
.grid { display: grid; gap: 14px; }
.card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; padding: 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.row { display: flex; align-items: flex-end; justify-content: center; gap: 12px; padding: 6px 0; }
.box {
  background: var(--surface2); border: 1px dashed var(--border);
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.box img { width: 100%; height: 100%; object-fit: contain; display: block; }
.meta { display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; }
.label { font-weight: 700; }
.size { color: var(--dim); font-family: monospace; font-size: 11px; }
.font-demo {
  background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
  padding: 16px; margin-top: 14px;
}
.font-demo .big { font-family: "Baloo 2", system-ui, sans-serif; font-size: 32px; font-weight: 700; margin: 0 0 6px; }
.font-demo .sample { font-family: "Baloo 2", system-ui, sans-serif; font-size: 18px; font-weight: 700; margin: 0; color: var(--accent); }
</style>
</head>
<body>
<header>
  <h1>${title} · ${theme.toUpperCase()}</h1>
  <p class="sub">${subtitle}</p>
</header>
${bodyHtml}
</body>
</html>`;
}

const LEXI_STATES = [
  ['idle', 'Nghỉ / Sẵn sàng'],
  ['chao', 'Chào bạn'],
  ['co-vu', 'Cổ vũ'],
  ['vui', 'Vui mừng'],
  ['an-mung', 'Ăn mừng mốc'],
  ['dong-vien', 'Động viên'],
  ['suy-nghi', 'Suy nghĩ'],
  ['ngu', 'Nghỉ ngơi / Empty'],
];

const GAMES = [
  ['v1', 'V1 Daily Run'],
  ['v2', 'V2 Collocation'],
  ['v3', 'V3 Paraphrase'],
  ['l1', 'L1 Trap Detector'],
  ['l2', 'L2 Dictation'],
  ['r1', 'R1 TFNG Judge'],
  ['r2', 'R2 Headlines'],
  ['w1', 'W1 Essay Lab'],
  ['w2', 'W2 Sprints'],
  ['s1', 'S1 Mock Exam'],
  ['s2', 'S2 3-Sec Rule'],
  ['x1', 'X1 Exam Room'],
];

const BADGES = [
  'streak-7', 'streak-30', 'streak-100',
  'cards-100', 'cards-500', 'cards-1000',
  'band-65', 'band-70', 'band-75', 'band-80',
  'first-essay', 'first-speaking',
];

const UI_ICONS = [
  'xp', 'goal', 'calendar', 'freeze', 'party', 'shield', 'compass', 'brain',
  'clock', 'check', 'rocket', 'lightbulb', 'bookmark', 'chart', 'cloud', 'zzz',
];

const ILLUSTRATIONS = [
  ['welcome', 'Welcome (Onboarding)'],
  ['goals', 'Goals (Mục tiêu ngày)'],
  ['devices', 'Devices (Thiết bị & Loa)'],
  ['placement', 'Placement (Định vị)'],
  ['empty-cards', 'Empty Cards (Hết thẻ)'],
  ['offline', 'Offline (Ngoại tuyến)'],
];

const PARTICLES = ['spark', 'star', 'circle', 'flare', 'smoke', 'flame', 'magic', 'twirl'];

function buildLexiBody() {
  const cards = LEXI_STATES.map(([st, desc]) => {
    const rel = `public/assets/mascot/lexi-${st}.webp`;
    return `<div class="card">
      <div class="row">
        <div class="box" style="width:72px;height:72px"><img src="/assets/mascot/lexi-${st}.webp" alt="${st}"/></div>
        <div class="box" style="width:120px;height:120px"><img src="/assets/mascot/lexi-${st}.webp" alt="${st}"/></div>
      </div>
      <div class="meta"><span class="label">${st}</span><span class="size">${kb(rel)} · 72 / 120 px</span></div>
      <div class="sub">${desc}</div>
    </div>`;
  }).join('');
  return `<div class="grid" style="grid-template-columns:repeat(4,1fr)">${cards}</div>`;
}

function buildGamesBody() {
  const cards = GAMES.map(([id, name]) => {
    const rel = `public/assets/icons/fluent/games/${id}.webp`;
    return `<div class="card">
      <div class="row">
        <div class="box" style="width:32px;height:32px"><img src="/assets/icons/fluent/games/${id}.webp" alt="${id}"/></div>
        <div class="box" style="width:48px;height:48px"><img src="/assets/icons/fluent/games/${id}.webp" alt="${id}"/></div>
        <div class="box" style="width:96px;height:96px"><img src="/assets/icons/fluent/games/${id}.webp" alt="${id}"/></div>
      </div>
      <div class="meta"><span class="label">${name}</span><span class="size">${kb(rel)}</span></div>
      <div class="sub">32 · 48 · 96 px (1/1 contain)</div>
    </div>`;
  }).join('');
  return `<div class="grid" style="grid-template-columns:repeat(4,1fr)">${cards}</div>`;
}

function buildBadgesUiBody() {
  const bCards = BADGES.map((id) => {
    const rel = `public/assets/icons/fluent/badges/${id}.webp`;
    return `<div class="card">
      <div class="row">
        <div class="box" style="width:32px;height:32px"><img src="/assets/icons/fluent/badges/${id}.webp" alt="${id}"/></div>
        <div class="box" style="width:48px;height:48px"><img src="/assets/icons/fluent/badges/${id}.webp" alt="${id}"/></div>
      </div>
      <div class="meta"><span class="label">${id}</span><span class="size">${kb(rel)}</span></div>
    </div>`;
  }).join('');
  const uCards = UI_ICONS.map((id) => {
    const rel = `public/assets/icons/fluent/ui/${id}.webp`;
    return `<div class="card">
      <div class="row">
        <div class="box" style="width:32px;height:32px"><img src="/assets/icons/fluent/ui/${id}.webp" alt="${id}"/></div>
        <div class="box" style="width:48px;height:48px"><img src="/assets/icons/fluent/ui/${id}.webp" alt="${id}"/></div>
      </div>
      <div class="meta"><span class="label">${id}</span><span class="size">${kb(rel)}</span></div>
    </div>`;
  }).join('');
  return `
    <h2 style="margin:0 0 10px;font-size:15px">12 Huy hiệu (Fluent Emoji 3D · 32 / 48 px)</h2>
    <div class="grid" style="grid-template-columns:repeat(6,1fr);margin-bottom:18px">${bCards}</div>
    <h2 style="margin:0 0 10px;font-size:15px">16 Icon nhiệm vụ / trạng thái / Bùa (Fluent Emoji 3D · 32 / 48 px)</h2>
    <div class="grid" style="grid-template-columns:repeat(8,1fr)">${uCards}</div>
  `;
}

function buildIllustrationsBody() {
  const cards = ILLUSTRATIONS.map(([id, title]) => {
    const rel = `public/assets/illustrations/${id}.svg`;
    return `<div class="card">
      <div class="box" style="aspect-ratio:4/3;width:100%;padding:10px">
        <img src="/assets/illustrations/${id}.svg" alt="${id}"/>
      </div>
      <div class="meta"><span class="label">${title}</span><span class="size">${kb(rel)} · 4/3 contain</span></div>
    </div>`;
  }).join('');
  const fontBlock = `
    <div class="font-demo">
      <div class="meta" style="margin-bottom:8px"><span class="label">Font hiển thị Baloo 2 Bold (OFL-1.1 · latin + vietnamese)</span><span class="size">${kb('public/assets/fonts/baloo-2-vietnamese-700.woff2')} + ${kb('public/assets/fonts/baloo-2-latin-700.woff2')}</span></div>
      <p class="big">Luyện IELTS 8.0 · Band ≈ 7.5 · +1.250 XP</p>
      <p class="sample">Ăn mừng chuỗi 30 ngày! Đừng bỏ lỡ mục tiêu hôm nay — ă â đ ê ô ơ ư ế ồ ữ ệ ả ạ</p>
    </div>`;
  return `<div class="grid" style="grid-template-columns:repeat(3,1fr)">${cards}</div>${fontBlock}`;
}

function buildFxBody(theme) {
  const tintFilter = theme === 'light' ? 'filter: brightness(0.2) sepia(1) hue-rotate(210deg) saturate(5);' : '';
  const cards = PARTICLES.map((id) => {
    const rel = `public/assets/fx/${id}.png`;
    return `<div class="card">
      <div class="row">
        <div class="box" style="width:32px;height:32px;background:#121829"><img src="/assets/fx/${id}.png" alt="${id}"/></div>
        <div class="box" style="width:64px;height:64px;background:${theme === 'dark' ? '#1A2238' : '#EEF2FF'}">
          <img src="/assets/fx/${id}.png" alt="${id}" style="${tintFilter}"/>
        </div>
      </div>
      <div class="meta"><span class="label">${id}.png</span><span class="size">${kb(rel)} · 64×64</span></div>
    </div>`;
  }).join('');
  return `<div class="grid" style="grid-template-columns:repeat(4,1fr)">${cards}</div>`;
}

const SHEETS = [
  { name: 'lexi', title: 'Lexi Mascot · 8 Trạng thái', sub: 'Microsoft Fluent Emoji 3D (MIT) · nền trong suốt · iPhone 72 px & 120 px (1/1 contain)', build: buildLexiBody, width: 1080 },
  { name: 'games', title: '12 Icon Game · Fluent Emoji 3D', sub: 'Microsoft Fluent Emoji 3D (MIT) · 32 / 48 / 96 px (1/1 contain, ≤ 20 KB/file)', build: buildGamesBody, width: 1120 },
  { name: 'badges-ui', title: '28 Icon Huy hiệu & Nhiệm vụ · Fluent Emoji 3D', sub: 'Microsoft Fluent Emoji 3D (MIT) · 32 / 48 px (1/1 contain, ≤ 20 KB/file)', build: buildBadgesUiBody, width: 1200 },
  { name: 'illustrations', title: '6 Minh họa SVG unDraw & Font Baloo 2', sub: 'unDraw License (#3B82F6 accent, 4/3 contain) + Baloo 2 Bold OFL-1.1 (latin + vietnamese)', build: buildIllustrationsBody, width: 1040 },
  { name: 'fx', title: '8 Texture Hạt VFX · Kenney Particle Pack', sub: 'Kenney CC0 · 64×64 compact PNG · trái: gốc trắng trên nền tối, phải: áp màu theo theme', build: buildFxBody, width: 960 },
];

async function main() {
  const server = await startStaticServer();
  const channel = process.env.PW_CHANNEL || 'chrome';
  const browser = await chromium.launch({ headless: true, channel });
  try {
    for (const s of SHEETS) {
      for (const theme of ['dark', 'light']) {
        currentHtml = wrapHtml(s.title, s.sub, theme, s.build(theme), s.width);
        const page = await browser.newPage({ viewport: { width: s.width, height: 800 }, deviceScaleFactor: 1 });
        await page.goto(`http://127.0.0.1:${PORT}/sheet.html`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const outFile = path.join(OUT_DIR, `${s.name}-${theme}.png`);
        await page.screenshot({ path: outFile, fullPage: true });
        await page.close();
        console.log(`Generated ${path.relative(ROOT, outFile)}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
