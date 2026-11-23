// audit-ui.mjs – Đo giao diện ĐỊNH LƯỢNG cho đợt audit-max (D:\English\docs\audit-max\KIEM-THU.md §2).
// Do người viết audit (vai Art Director / điều phối) viết. Builder, Fixer, Reviewer KHÔNG được sửa file này
// hay ngưỡng bên dưới (LUAT.md Q4). Thấy sai → ghi HANDOFF.md.
//
// Cần dev server: npx vite --port 5199 --strictPort   (hoặc BASE_URL=http://127.0.0.1:4173 cho vite preview)
// Chạy từ D:\English:
//   node docs/audit-max/cong-cu/audit-ui.mjs                                   # 20 route × 390,1280 × dark,light
//   node docs/audit-max/cong-cu/audit-ui.mjs --route hub,play/v1 --vp 390x844 --theme dark
//   Thêm: --out <thư-mục> (mặc định out/audit-ui), --fmt jpg|png (mặc định png; chấm mù dùng jpg cả 2 bên),
//         --reduced 1 (giả lập prefers-reduced-motion), --no-loi 1 (không xuất ảnh khoanh lỗi)
//   Route viết KHÔNG có "/" đầu (Git Bash đổi "/hub" thành đường dẫn ổ đĩa). Route gốc là "today".
// Ra: <out>/report.json, <out>/BAO-CAO.md, ảnh <vp>-<theme>-<route>.<fmt>, ảnh khoanh lỗi <...>-loi.png
//     (viền đỏ = CHẶN, cam = NẶNG, vàng = NHẸ). Mã thoát 1 nếu có lỗi CHẶN.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../package.json', import.meta.url));
const { chromium } = require('@playwright/test');

const A = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i];
  if (k.startsWith('--')) { const v = process.argv[i + 1]; if (!v || v.startsWith('--')) A[k.slice(2)] = '1'; else { A[k.slice(2)] = v; i++; } }
}
const BASE = (process.env.BASE_URL || 'http://localhost:5199') + '/#';
const OUT = path.resolve(A.out || 'out/audit-ui');
fs.mkdirSync(OUT, { recursive: true });
const ALL = 'today,onboarding,placement,hub,stats,settings,portfolio,library,play/v1,play/v2,play/v3,play/r1,play/r2,play/l1,play/l2,play/w1,play/w2,play/s1,play/s2,exam';
const ROUTES = (A.route || ALL).split(',').filter(Boolean).map((r) => r.replace(/^\/+/, ''));
const VPS = (A.vp || '390x844,1280x800').split(',').map((s) => s.split('x').map(Number));
const THEMES = (A.theme || 'dark,light').split(',');
const FMT = A.fmt === 'jpg' ? 'jpeg' : 'png';
const EXT = FMT === 'jpeg' ? 'jpg' : 'png';

// Mức độ CỐ ĐỊNH theo LUAT.md (bảng mức độ). KHÔNG SỬA.
const SEV = {
  JS: 'CHẶN', D5: 'CHẶN', D4: 'CHẶN', D7: 'NẶNG', D3: 'NẶNG', D10: 'NẶNG', D11: 'NẶNG',
  M1: 'NẶNG', M2: 'NẶNG', M3: 'NẶNG', M4: 'NẶNG', M5: 'NẶNG', M7: 'NẶNG', J9: 'NẶNG', J8: 'CHẶN', J10: 'CHẶN', Q5: 'CHẶN',
};
// Màn "khung" (không phải vùng học) – áp luật mật độ hình M*. Màn chơi được miễn M* (Focus Arcade) trừ J9.
const FRAME = new Set(['today', 'onboarding', 'hub', 'stats', 'library', 'portfolio']);
const PLAY = (r) => r.startsWith('play/') || r === 'exam';
const JARGON = /(Mốc M\d|Level \d+ ·|Node \d+\/\d+|\bFSRS\b|Δ ?band|\bINV-[A-Z]|gói copy\/dán)/;

async function measure(page, route) {
  return page.evaluate(({ route, isFrame, isPlay, jargonSrc }) => {
    const W = innerWidth, H = innerHeight, VA = W * H, v = [], m = {};
    const add = (code, msg, r) => v.push({ code, msg: String(msg).slice(0, 160), rect: r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null });
    const shown = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.05) return false; } return true; };
    const inView = (r) => r.width >= 8 && r.height >= 8 && r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;
    // Chuyển động đang chạy (≥ 16px, trong khung nhìn)
    m.anims = document.getAnimations().filter((a) => { const t = a.effect && a.effect.target; if (!t || !t.getBoundingClientRect || a.playState !== 'running') return false; const r = t.getBoundingClientRect(); return r.width >= 16 && r.height >= 16 && inView(r); }).length;
    m.infiniteAnims = document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.getTiming().iterations === Infinity).length;
    // Cửa thoát: cấm data-audit-ignore
    const esc = document.querySelectorAll('[data-audit-ignore]').length; m.escapes = esc;
    if (esc) add('Q5', `${esc} phần tử data-audit-ignore (cấm)`);
    // D5 tràn ngang
    const de = document.documentElement; m.overflowX = de.scrollWidth - de.clientWidth;
    if (m.overflowX > 0) add('D5', `tràn ngang ${m.overflowX}px`, { x: W - 8, y: 0, width: 8, height: H });
    const all = [...document.querySelectorAll('body *')];
    // D3 vùng chạm < 44 (bỏ span chữ trong đoạn văn có thể chọn, bỏ input range được bọc riêng)
    let small = 0;
    for (const el of document.querySelectorAll('button, a[href], [role=button], input:not([type=hidden]), select, textarea')) {
      const r = el.getBoundingClientRect(); if (!inView(r) || !shown(el)) continue;
      if (el.tagName === 'SPAN' && el.closest('p, [data-passage], article')) continue;
      if (r.width < 44 || r.height < 44) { small++; if (small <= 25) add('D3', `vùng chạm ${Math.round(r.width)}×${Math.round(r.height)}: ${(el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30)}`, r); }
    }
    m.smallTargets = small;
    // D10 control gốc trình duyệt lộ ra (select, range, date, checkbox không bọc appearance)
    let native = 0;
    for (const el of document.querySelectorAll('select, input[type=range], input[type=date], input[type=time], input[type=checkbox], input[type=radio]')) {
      const r = el.getBoundingClientRect(); if (!inView(r) || !shown(el)) continue;
      if (getComputedStyle(el).appearance !== 'none') { native++; add('D10', `control gốc <${el.tagName.toLowerCase()} ${el.type || ''}> chưa bọc`, r); }
    }
    m.nativeControls = native;
    // D4 chữ < 12px ; D7 thuật ngữ nội bộ
    const jargon = new RegExp(jargonSrc); let tiny = 0, jar = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent.trim(); if (t.length < 2) continue;
      const el = n.parentElement; if (!el || !shown(el)) continue;
      const range = document.createRange(); range.selectNodeContents(n); const r = range.getBoundingClientRect(); if (!inView(r)) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 12) { tiny++; if (tiny <= 25) add('D4', `chữ ${fs}px: "${t.slice(0, 24)}"`, r); }
      const mj = t.match(jargon); if (mj) { jar++; if (jar <= 10) add('D7', `thuật ngữ nội bộ "${mj[1]}"`, r); }
    }
    m.tinyText = tiny; m.jargon = jar;
    // Hình: icon nét (lucide), icon màu (img/svg không phải lucide, 24–160px), hình lớn (≥ 15% khung nhìn)
    let mono = 0, color = 0, bigArea = 0; const iconSrc = new Map();
    for (const el of all) {
      const tag = el.tagName.toLowerCase();
      if (tag !== 'img' && tag !== 'svg' && tag !== 'canvas' && !(getComputedStyle(el).backgroundImage || '').includes('url(')) continue;
      if (tag === 'svg' && el.parentElement && el.parentElement.closest('svg')) continue;
      const r = el.getBoundingClientRect(); if (!inView(r) || !shown(el)) continue;
      const cls = (el.getAttribute('class') || '');
      if (tag === 'svg' && cls.includes('lucide')) { mono++; continue; }
      const area = r.width * r.height;
      if (area >= 0.15 * VA) { bigArea++; continue; }
      if (Math.min(r.width, r.height) >= 32 && Math.max(r.width, r.height) <= 160) {
        color++;
        const key = tag === 'img' ? el.currentSrc || el.src : (el.innerHTML || '').slice(0, 200);
        if (key) iconSrc.set(key, (iconSrc.get(key) || 0) + 1);
      }
    }
    m.monoIcons = mono; m.colorIcons = color; m.bigPictures = bigArea;
    // Nhân vật dẫn đường (LUAT M3, J10): phần tử [data-mascot], đo hộp hiển thị
    const mascots = [...document.querySelectorAll('[data-mascot]')].filter((el) => { const r = el.getBoundingClientRect(); return inView(r) && shown(el); });
    m.mascots = mascots.map((el) => { const r = el.getBoundingClientRect(); return { state: el.getAttribute('data-mascot'), h: Math.round(r.height), w: Math.round(r.width) }; });
    if (isFrame) {
      if (bigArea < 1) add('M1', 'màn đầu không có minh họa/cảnh ≥ 15% khung nhìn');
      if (color < 6) add('M2', `chỉ ${color} icon màu ≥ 32px (cần ≥ 6); icon nét đơn sắc: ${mono}`);
      const maxH = W >= 1024 ? 220 : 160;
      const okMascot = mascots.filter((el) => { const h = el.getBoundingClientRect().height; return h >= 72 && h <= maxH; });
      if (!okMascot.length) add('M3', mascots.length ? `nhân vật cao ${m.mascots.map((x) => x.h).join('/')}px (cần 72–${maxH}px)` : 'màn khung không có nhân vật dẫn đường [data-mascot]', mascots[0] ? mascots[0].getBoundingClientRect() : null);
      // Nhân vật không được đè chữ (J10)
      for (const mel of mascots) {
        const mr = mel.getBoundingClientRect();
        const hit = [...document.querySelectorAll('p, h1, h2, h3, button, label, li')].find((t) => { if (mel.contains(t) || t.contains(mel)) return false; const r = t.getBoundingClientRect(); return inView(r) && shown(t) && t.textContent.trim().length > 1 && r.left < mr.right - 4 && r.right > mr.left + 4 && r.top < mr.bottom - 4 && r.bottom > mr.top + 4; });
        if (hit) add('J10', `nhân vật đè chữ/nút: "${hit.textContent.trim().slice(0, 24)}"`, mr);
      }
      if (m.anims < 1) add('M4', 'không có vật nào đang chuyển động');
      const dup = [...iconSrc.values()].filter((n) => n > 1).length; if (dup) add('M7', `${dup} icon lặp lại giữa các thẻ cùng màn`);
      // M5 hộp chỉ có chữ: thẻ/khối có nền + viền, cao ≥ 80px, không có hình nào bên trong
      let textOnly = 0;
      for (const el of document.querySelectorAll('section, article, [class*="rounded"]')) {
        const r = el.getBoundingClientRect(); if (!inView(r) || r.height < 80 || r.width < 160 || !shown(el)) continue;
        const s = getComputedStyle(el); if (s.backgroundColor === 'rgba(0, 0, 0, 0)' && s.borderTopWidth === '0px') continue;
        if (el.querySelector('img, canvas, svg:not(.lucide), [style*="url("]')) continue;
        if (el.querySelector('section, article')) continue;
        textOnly++; if (textOnly <= 10) add('M5', 'hộp chỉ có chữ (không hình/icon màu)', r);
      }
      m.textOnlyBoxes = textOnly;
    }
    if (isPlay && m.anims < 1) add('J9', 'màn chơi đứng yên hoàn toàn khi chờ người chơi');
    // J10: nhân vật không được có mặt ở màn chơi lúc đang làm câu (chỉ Recap/interstitial – đánh dấu data-mascot-ok trên khung Recap)
    if (isPlay) for (const mel of mascots) if (!mel.closest('[data-mascot-ok]')) add('J10', 'nhân vật xuất hiện trong màn chơi ngoài Recap/interstitial', mel.getBoundingClientRect());
    return { v, m };
  }, { route, isFrame: FRAME.has(route), isPlay: PLAY(route), jargonSrc: JARGON.source });
}

async function drawBoxes(page, v) {
  await page.evaluate((v) => {
    const host = document.createElement('div'); host.id = '__audit_boxes'; host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    const col = { 'CHẶN': '#ff1744', 'NẶNG': '#ff9100', 'NHẸ': '#ffd600' };
    for (const x of v) {
      if (!x.rect) continue; const d = document.createElement('div'); const [l, t, w, h] = x.rect;
      d.style.cssText = `position:absolute;left:${l}px;top:${t}px;width:${w}px;height:${h}px;outline:3px solid ${col[x.sev] || '#ff1744'};outline-offset:1px`;
      const tag = document.createElement('span'); tag.textContent = x.code; tag.style.cssText = `position:absolute;left:0;top:-14px;font:700 11px monospace;background:${col[x.sev]};color:#000;padding:0 2px`;
      d.appendChild(tag); host.appendChild(d);
    }
    document.body.appendChild(host);
  }, v);
}

const browser = await chromium.launch({ headless: true }).catch(() => chromium.launch({ channel: 'chrome', headless: true }));
const report = { at: new Date().toISOString(), base: BASE, runs: [] };
for (const [w, h] of VPS) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: A.reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      const errs = [];
      const onC = (msg) => { if (msg.type() === 'error') errs.push(msg.text().slice(0, 160)); };
      const onE = (e) => errs.push('pageerror: ' + String(e).slice(0, 160));
      page.on('console', onC); page.on('pageerror', onE);
      const hash = route === 'today' ? '/' : '/' + route;
      await page.goto(BASE + hash, { waitUntil: 'networkidle' }).catch((e) => errs.push('goto: ' + e.message));
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      await page.waitForTimeout(1000);
      const { v, m } = await measure(page, route);
      if (A.reduced && m.infiniteAnims) v.push({ code: 'J8', msg: `reduced-motion vẫn còn ${m.infiniteAnims} animation lặp vô hạn`, rect: null });
      for (const e of [...new Set(errs)].slice(0, 5)) v.push({ code: 'JS', msg: e, rect: null });
      for (const x of v) x.sev = SEV[x.code] || 'NHẸ';
      const base = `${w}x${h}-${theme}-${route.replace(/\//g, '_')}`;
      await page.screenshot({ path: path.join(OUT, `${base}.${EXT}`), type: FMT, ...(FMT === 'jpeg' ? { quality: 85 } : {}) });
      if (!A['no-loi'] && v.some((x) => x.rect)) {
        await drawBoxes(page, v);
        await page.screenshot({ path: path.join(OUT, `${base}-loi.png`) });
        await page.evaluate(() => document.getElementById('__audit_boxes')?.remove());
      }
      report.runs.push({ vp: `${w}x${h}`, theme, route, metrics: m, violations: v });
      page.off('console', onC); page.off('pageerror', onE);
    }
    await ctx.close();
  }
}
await browser.close();

// Tổng hợp
const count = (sev) => report.runs.reduce((n, r) => n + r.violations.filter((x) => x.sev === sev).length, 0);
report.total = { CHAN: count('CHẶN'), NANG: count('NẶNG'), NHE: count('NHẸ') };
const byCode = {}; for (const r of report.runs) for (const x of r.violations) byCode[x.code] = (byCode[x.code] || 0) + 1;
report.byCode = byCode;
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
const lines = [`# audit-ui · ${report.at}`, '', `Tổng: **${report.total.CHAN} CHẶN · ${report.total.NANG} NẶNG · ${report.total.NHE} NHẸ** trên ${report.runs.length} lượt (route × khung × theme).`, '', '| Mã | Số lần | Mức |', '|---|---|---|',
  ...Object.entries(byCode).sort((a, b) => b[1] - a[1]).map(([c, n]) => `| ${c} | ${n} | ${SEV[c] || 'NHẸ'} |`), '',
  '| Khung | Theme | Route | CHẶN | NẶNG | tràn | chạm<44 | chữ<12 | icon màu | icon nét | hình lớn | nhân vật | chuyển động |', '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...report.runs.map((r) => `| ${r.vp} | ${r.theme} | ${r.route} | ${r.violations.filter((x) => x.sev === 'CHẶN').length} | ${r.violations.filter((x) => x.sev === 'NẶNG').length} | ${r.metrics.overflowX} | ${r.metrics.smallTargets} | ${r.metrics.tinyText} | ${r.metrics.colorIcons} | ${r.metrics.monoIcons} | ${r.metrics.bigPictures} | ${(r.metrics.mascots || []).length} | ${r.metrics.anims} |`)];
fs.writeFileSync(path.join(OUT, 'BAO-CAO.md'), lines.join('\n') + '\n');
console.log(`audit-ui: ${report.total.CHAN} CHẶN · ${report.total.NANG} NẶNG · ${report.total.NHE} NHẸ → ${OUT}`);
console.log(Object.entries(byCode).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}:${n}`).join('  '));
process.exit(report.total.CHAN > 0 ? 1 : 0);
