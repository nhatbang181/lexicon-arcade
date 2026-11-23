# 06 · PRODUCTION: hiệu năng, lỗi, test tự động, build và deploy, bảo mật, quản lý asset

> Số liệu chạy thật ngày 23/11/2026 trên máy Windows của Bang (sau `npm ci`). Chi tiết: `phu-luc/D-ui-flow-production.md` §1, §6.
> Luật liên quan: `LUAT.md` mục P, K.

## 1. Điểm hiện tại: **4/10**

| Tiêu chí | Điểm | Số liệu |
|---|---|---|
| Đúng kiểu / test đơn vị | 8 | `tsc --noEmit` 0 lỗi (27 s); `vitest` **377/377** pass, 31 file (23 s) |
| Kiểm dữ liệu | 8 | `validate:data` PASS (schema, manifest, credits); SFX 54 KB |
| Test E2E | 3 | 6 test smoke (m1–m4, screenshots); không có a11y, motion, perf, bàn phím, theme sáng; `channel:'chrome'` không chạy được trên CI ubuntu |
| Build / bundle | 4 | Entry **1 120 KB raw / 343 KB gzip** (ngân sách 250); CSS 251 KB vì Tailwind nạp 2 lần; route dev + fixture test trong bản production |
| Deploy | **1** | `origin/master` dừng ở `6b1598e` (19/11). **49 commit V3 chưa push.** URL production `https://<user>.github.io/lexicon-arcade/` vẫn là bản cũ `<title>IOE ARENA: IELTS 8.0 Olympic System` |
| CI | 2 | `deploy.yml` chỉ `npm ci` + `build` rồi deploy; không test, không validate, không chạy trên PR |
| PWA / offline | 3 | Icon 192/512 trỏ tới `app_icon.png` 256×256; data JSON (9,7 MB) và audio (13 MB) không cache; precache 3 MB toàn PNG legacy + 81 font; manifest `lang:"en"` |
| Bảo mật | 8 | 0 `innerHTML`/`dangerouslySetInnerHTML`/`eval`; kết quả chấm parse bằng zod; nhưng backup dùng `z.any()`, chưa có CSP |
| Bền dữ liệu | 3 | Không `storage.persist()`; restore xoá ghi âm; lỗi IndexedDB → skeleton vô hạn |
| Môi trường dev | 4 | `node_modules` **trống** khi bắt đầu audit; `server.host:true` mở dev server ra LAN; `.bat` cũ ở root |

## 2. Danh sách vấn đề và cách sửa

| # | Vị trí | Vấn đề | Mức | Cách sửa (lệnh / thông số) | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| X1 | git `master` vs `origin/master` | 49 commit (M0→M5) chưa push; production là bản V1/V2 cũ | **P0** | Sau khi CI mới (X2) xanh trên nhánh: `git push origin master`; kiểm `curl -s https://<user>.github.io/lexicon-arcade/ \| grep -o '<title>[^<]*'` | `<title>` chứa "Lexicon Arcade V3"; HTTP 200; `git rev-list --left-right --count origin/master...master` = `0 0` |
| X2 | `.github/workflows/deploy.yml:31-35` | Deploy không qua cổng nào | **P0** | Tách job `verify` (needs trước deploy), trigger thêm `pull_request`: `npm ci` → `npx tsc --noEmit -p .` → `npm test -- --reporter=dot` → `npm run validate:data` → `npx playwright install --with-deps chromium` → `npx playwright test --project=chromium` → `npm run build` → `npx size-limit`. Node 22 | PR có 1 test đỏ → check đỏ, job deploy không chạy |
| X3 | `playwright.config.ts:12` | `channel:'chrome'` buộc có Chrome cài sẵn | P1 | `projects:[{name:'chromium',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['Pixel 7']}}]`; giữ `chrome` chỉ khi chạy local bằng biến `PW_CHANNEL` | `npx playwright test` chạy trên ubuntu-latest |
| X4 | `src/app/screens/LegacyScreen.tsx:5` | `import '../../legacy/index.css'` tĩnh → CSS legacy (Tailwind lần 2 + `body{image-rendering:pixelated}`) vào bundle chính | P1 | Tạo `src/app/screens/legacyEntry.ts` (`import '../../legacy/index.css'; export { default } from '../../legacy/App';`), `React.lazy(() => import('./legacyEntry'))`. Không sửa `src/legacy/**` | `grep -c pixelated dist/assets/index-*.css` = 0; CSS chính < 130 KB raw |
| X5 | `src/app/routes.tsx:3-13` | Import tĩnh mọi màn (Placement 1 243 dòng, Portfolio kéo `core/grading` + prompt `.md?raw`, DevComponents 610 dòng) | P1 | `React.lazy` cho mọi route trừ Today; `<Suspense fallback={<Skeleton lines={4}/>}>`; `manualChunks: { vendor:['react','react-dom','wouter'], data:['dexie','dexie-react-hooks','ts-fsrs'], zod:['zod'] }`; bỏ export tĩnh trong `src/games/*/index.ts` (hết 8 cảnh báo "dynamic import will not move module") | JS tải ở `#/` ≤ 250 KB gzip; không cảnh báo chunk > 500 KB |
| X6 | `routes.tsx` (`/dev/components`, `/dev/speech`), `V1DailyRun.tsx:47-51` | Route dev và `r1_fixtures`/`v1_fixtures` có trong bản production | P2 | `{import.meta.env.DEV && <Route …/>}`; fixture chỉ import khi `MODE==='test'` | `grep -l "Thư viện component\|v1_fixtures" dist/assets/*.js` rỗng |
| X7 | `vite.config.ts:22-38` | Icon PWA sai, không maskable, `lang:"en"`, không cache data/audio, precache rác | P1 | Icon `pwa-192.png`, `pwa-512.png`, `maskable-512.png` (purpose `maskable`); `lang:'vi'`; `globIgnores:['**/soul_knight/**','assets/ui/**','**/*-cyrillic-*','**/*.woff']`; `runtimeCaching`: `/data/*.json` StaleWhileRevalidate, `/audio/*.mp3` CacheFirst + `rangeRequests:true`, 90 ngày | Lighthouse PWA không cảnh báo icon; precache ≤ 1,5 MB; offline mở lại V1 chơi được |
| X8 | `src/main.tsx:3-12` | Font nạp mọi subset (cyrillic, latin-ext, woff) | P2 | Import theo subset `@fontsource/be-vietnam-pro/vietnamese-400.css`, `latin-400.css` (tương tự 500/600/700/800 và 2 font còn lại) | Số file font trong `dist` ≤ 24, chỉ woff2 |
| X9 | `vite.config.ts:11`, `ErrorBoundary.tsx` | `registerType:'autoUpdate'` → sau deploy, chunk game cũ bị xoá → "Failed to fetch dynamically imported module" | P2 | `registerType:'prompt'` + toast "Có bản mới · Tải lại" chỉ hiện ngoài `/play/*`; ErrorBoundary bắt lỗi chunk → `location.reload()` 1 lần (cờ `sessionStorage`) | Xoá chunk giả lập → tự tải lại 1 lần, không vòng lặp |
| X10 | `routes.tsx:302`, `ErrorBoundary.tsx` | 1 ErrorBoundary chung, không reset khi đổi route | P2 | `<ErrorBoundary key={location}>` hoặc bọc từng route; màn lỗi có mã lỗi + "Thử lại" + "Về Hôm nay" | Lỗi ở Stats → bấm Hôm nay → hiện bình thường |
| X11 | `TodayDashboard.tsx:126-229`, `StatsScreen`, `PortfolioScreen`, `PlacementScreen` (0 `catch`) | Lỗi IndexedDB → skeleton vô hạn | P1 | Hook `useAsyncData(fn)` → `{data,error,loading,retry}`; lỗi → `EmptyState tone="error"` + mã `ERR_DB_<name>` + "Thử lại" | Mock reject → nút "Thử lại" trong 1 s |
| X12 | `backup.ts:46-57` | Nhập backup dùng `z.array(z.any())` | P2 | Schema thật cho `SRSCard`, `AttemptRecord`, `UserProfile` (`.passthrough()`), báo lỗi theo bảng/dòng | Backup có card thiếu `due` → `valid:false` |
| X13 | `index.html` | Không CSP, không description, `theme-color` cứng | P3 | `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'">` (kiểm Web Speech trước khi bật); description tiếng Việt; `theme-color` theo `media` | 0 lỗi CSP trong console E2E |
| X14 | `vite.config.ts:47` | `server.host:true` mở dev server ra LAN | P3 | `host:'127.0.0.1'`; LAN dùng `npm run dev -- --host` khi cần | – |
| X15 | root: `run_game.bat` (nội dung "Lexicon Quest RPG", tự chạy `python scripts\extract_anki.py` + `npm install`), `CHOI_GAME_TIENG_ANH.bat` (cứng `d:\English`), `LEXICON ARCADE.lnk` (chưa ignore); `package.json` tên `lexicon-quest`; `e2e/screenshots/` 43 PNG 6,3 MB tracked | P3 | Chuyển `.bat` vào `scripts/launch/` (hỏi Bang trước khi xoá `run_game.bat`); `.gitignore` thêm `*.lnk`, `e2e/screenshots/`, `test-results/`; `"name":"lexicon-arcade"` | `git status` sạch sau khi chạy app |
| X16 | `scripts/*.js`, `scripts/*.py` ở gốc `scripts/` (`test_combat.js`, `test_dungeon.js`, `download_soul_knight_assets.py`, `simulate_gameplay.js`…) | Script V1/V2 lẫn với pipeline V3 | P3 | Chuyển vào `scripts/legacy/` (không xoá) | `ls scripts/*.js` chỉ còn script V3 |
| X17 | `vitest.config.ts` | jsdom tạo 31 lần, 77% thời gian | P3 | `environmentMatchGlobs: [['src/core/**','node']]`; jsdom chỉ cho `*.test.tsx` | `npm test` ≤ 12 s |
| X18 | `tsconfig.json` | `noUnusedLocals:false`, `noUnusedParameters:false` → code chết (`xpToLevel`, `adjustDifficulty`) không bị phát hiện | P3 | Bật cả hai; sửa cảnh báo; thêm `knip` (dev, tuỳ chọn) để tìm export chết | `tsc` 0 lỗi với cờ bật |
| X19 | Không có kiểm hiệu năng | Ngân sách `03` §9 không ai đo | P2 | `size-limit` (dev) với ngưỡng §3; `e2e/perf.spec.ts` đọc `performance.getEntriesByType('resource')` và LCP qua `PerformanceObserver` trên `vite preview` | CI đỏ khi vượt ngân sách |
| X20 | `public/assets/soul_knight/**` (47 file), `public/assets/ui/**` (15 file), `public/roguelike_sheet.png`, `public/dungeon_tilemap.png` | Asset legacy vào precache; `CREDITS.md` ghi nguồn "0x72 itch.io" nhưng script tải thật từ `raw.githubusercontent.com/SARdude54/DungeonRPG` (`scripts/download_soul_knight_assets.py`) | P2 | Loại khỏi precache (X7); sửa `url_tai` trong CREDITS cho đúng nơi tải; kiểm sha256 với gói gốc 0x72 (CC0). Không xoá khi Bang chưa đồng ý | `validate:data` có kiểm `url_tai` ≠ rỗng; precache không chứa `soul_knight` |

## 3. Ngân sách hiệu năng (đo trên `vite preview`, Chrome, CPU ×4, mạng Fast 4G)

| Chỉ số | Hiện tại | Ngưỡng ĐẠT |
|---|---|---|
| JS khởi động (entry + vendor, gzip) | 343 KB | ≤ **250 KB** |
| CSS chính (raw) | 251 KB | ≤ **130 KB** |
| Chunk mỗi game (gzip) | 9–26 KB ✅ | ≤ 120 KB |
| LCP Hôm nay | chưa đo | ≤ **2,5 s** (mục tiêu 1,5 s) |
| INP (chọn đáp án) | chưa đo | ≤ **200 ms** |
| Frame > 32 ms do animation (30 s V1) | chưa đo | **0** |
| Precache PWA | 3 021 KiB | ≤ **1 500 KiB** |
| Lần tải đầu data 1 game | chưa đo | ≤ 400 KB (tải lười theo game) |

## 4. Quản lý asset (quy trình chuẩn)

1. Tải: `python scripts/assets/fetch_assets.py --group <nhóm>` → `scripts/assets/_downloads/<nhóm>/` (gitignore). Chỉ URL trong allowlist `docs/11-ASSETS.md` §1 + bảng `03-ANIMATION-FEEDBACK.md` §9.
2. Duyệt: mở từng file, kiểm giấy phép trên **trang tải** (không tin mô tả lại), kiểm kích thước theo `LUAT.md` K6.
3. Tối ưu: PNG `oxipng -o 4`, SVG `svgo`, âm thanh qua `scripts/assets/build_sfx_sprite.py` (−20 LUFS).
4. Ghi: 1 dòng `public/assets/CREDITS.md` + 1 mục `scripts/assets/assets.manifest.json` (`file, url_trang, url_tai, tac_gia, giay_phep, ngay_tai, sha256, chinh_sua`).
5. Kiểm: `node scripts/validate/assets_credits.mjs` (đã có) mở rộng kiểm `sha256` khớp và `url_tai` có mặt.

## 5. Tiêu chí ĐẠT của mảng
- CI mới chạy đủ 8 bước, xanh trên `master`; production `<title>` V3, HTTP 200.
- Bảng §3: mọi chỉ số đạt ngưỡng.
- `npm run e2e` chạy được trên ubuntu (Chromium), ≥ 12 test gồm a11y, motion, perf, daily-loop, offline.
- 0 `console.error` trong toàn bộ lượt E2E.
- Rubric `KIEM-THU.md` §3 "Độ tin cậy kỹ thuật" ≥ 9.
