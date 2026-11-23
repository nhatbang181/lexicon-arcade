# BAO-CAO T1-C · Cổng production + công cụ QA

Nhánh `audit-max/T1-C` (worktree `D:\English-wt\T1-C`, đặt trên T1-B `00165f9`), 24/11/2026. Báo cáo chỉ ghi việc đã làm và số đo; không có điểm tự chấm. Không push, không merge (điều phối làm).

## 1. Mã lỗi

| Mã | Trạng thái | Việc đã làm / lý do chưa xong | Bằng chứng |
|---|---|---|---|
| X1 | ⏳ | Theo chỉ đạo: không push. Workflow đã kiểm cú pháp và chạy tay 8 bước (mục 4). Còn: điều phối merge, push, kiểm `<title>` production | `npx @action-validator/cli` exit 0 (có đối chứng: file cố ý hỏng cho `errors`) |
| X2 | ✅ (chưa chạy trên runner thật) | `deploy.yml`: job `verify` (Node 22, `pull_request` + push master + chạy tay) 8 bước; `deploy` có `needs: verify`, chỉ chạy push/chạy tay trên master; job `audit-ui` riêng, `continue-on-error`, không nằm trong `needs`; bước 4b chạy `validate:data:release` khi master và biến `RELEASE_GATE=1` | mục 4 |
| X3 | ✅ | `playwright.config.ts`: project `chromium` (Desktop Chrome) + `mobile` (Pixel 7, chỉ chạy `a11y`, `motion`); bỏ `channel:'chrome'` cố định, local đặt `PW_CHANNEL=chrome`; cổng đổi bằng `PW_PORT` (mặc định 5173); `retries:1` khi `CI` | chromium 38 pass + 9 fixme; mobile 17 pass |
| X4 | ✅ | `legacyEntry.ts` (CSS legacy + `legacy/App`), `LegacyScreen` nạp lười qua nó và **tắt** các thẻ CSS legacy khi rời `#/legacy`, bật lại khi vào lại (Vite không gỡ CSS chunk lazy, nên không tắt thì `image-rendering:pixelated` rò sang V3 sau khi đã vào legacy) | `screenshots.spec` "X4" và `offline.spec` "X4 (bản build)"; audit-ui today/hub: 0 phần tử `pixelated`; `grep -c pixelated dist/assets/index-*.css` = 0 |
| X7 | ✅ | Icon `pwa-192/512` + `maskable-512` (purpose `maskable`), `lang:'vi'`, `globIgnores` (soul_knight, assets/ui, sprite legacy, font cyrillic/greek/woff, icon manifest), `includeManifestIcons:false`, `runtimeCaching`: `/data/*.json` StaleWhileRevalidate, `/audio/*` CacheFirst + `rangeRequests`, chunk game/legacy/fixture CacheFirst (90 ngày) | precache 3 021 → **1 435,9 KiB** (mục 3); `offline.spec`: mở V1, tắt mạng, tải lại, vẫn mở; manifest đủ 3 icon, `lang` vi. ⏳ chưa chạy Lighthouse |
| X8 | ✅ | `main.tsx` nạp theo subset (be-vietnam-pro, jetbrains-mono: latin + vietnamese; source-serif-4 thêm latin-ext cho IPA); plugin nhỏ trong `vite.config.ts` bỏ `url(...woff)` nên dist chỉ còn woff2 | 81 file font (woff + woff2) → **19 woff2**, 0 woff (3 subset nhỏ được Vite nhúng data URI) |
| X9 | ✅ phần SW và chunk · ⏳ toast | `registerType:'prompt'`, `injectRegister:false`; `main.tsx` gọi `registerSW`, phát sự kiện `lexicon:sw-update` và đặt `window.__lexiconApplyUpdate`; `vite:preloadError` tải lại đúng 1 lần (cờ `sessionStorage`). ⏳ Toast "Có bản mới · Tải lại" nằm ở shell (`HANDOFF` T1-C #1) | chưa có test E2E giả lập xoá chunk |
| X13 | ✅ | `index.html`: description tiếng Việt, 2 thẻ `theme-color` theo `media`. CSP `<meta http-equiv>` chèn **chỉ ở bản build** (plugin `csp-meta`), vì dev cần script nội tuyến của React Refresh và websocket HMR | `offline.spec` chạy trên bản build có CSP: 0 `console.error`. Phát hiện và sửa khi kiểm: Vite nhúng font nhỏ dạng `data:` nên `font-src` phải có `data:` |
| X14 | ✅ | `server.host:'127.0.0.1'`; Playwright dùng `http://127.0.0.1:<PW_PORT>` | – |
| X15 | ✅ phần gitignore/tên · ⏳ chuyển `.bat` | `.gitignore`: `*.lnk`, `e2e/screenshots/`, `test-results/`, `playwright-report/`, `out/`, `dist-e2e`, `playwright.t1*.config.ts`; `"name":"lexicon-arcade"`; gỡ 43 PNG khỏi index (`git rm --cached`, file vẫn nằm trên đĩa). ⏳ chuyển `.bat` vào `scripts/launch/` (HANDOFF #7) | `git status` không còn ảnh sau khi chạy E2E |
| X16 | ⏳ | Chuyển `scripts/*.js,*.py` vào `scripts/legacy/` nằm ngoài danh sách file của T1-C (HANDOFF #8) | – |
| X17 | ✅ | `vitest.config.ts`: 2 project, `core-node` (`src/core/**/*.test.ts`, môi trường node), `ui-jsdom` (còn lại + `migrateLegacy.test.ts` cần `localStorage`), `pool:'vmThreads'` cho jsdom | mục 3 |
| D3 | ✅ phần script · ⏳ bật ở CI | `npm run validate:data:release` (`--require-audio --require-blind`); `scripts/validate/audio_meta.mjs` đọc MP3 không cần thư viện: thời lượng (vocab 0,3–4 s, dictation 1–20 s, listening khớp `durationSec` ±2 s) và sha256 khớp `audio.sha256`; chế độ dev gom thành 1 dòng NOTE; in "N cổng bị hoãn" màu vàng thay "PASS 100%"; lỗi theo mã. ⏳ Biến repo `RELEASE_GATE=1` bật sau T3-B (HANDOFF #10) | release: **2 835 lỗi** (V4 1 670, speaking 841, D1 240, L7 32, L5 28, R8 24); dev: PASS, 5 cổng hoãn. 601 file audio hiện có (537 vocab, 4 listening, 60 dictation): 0 bất thường |
| QA | ✅ | 5 script `scripts/qa/` + `_lib.mjs`, `preview-server.mjs` (mục 3) | – |
| E2E khung | ✅ | `a11y`, `motion`, `perf`, `offline` chạy thật; `juice` = 9 `test.fixme` (đợt 4) | mục 3 |
| Thêm | ✅ | `m1.spec.ts` (bước Thiết bị, "Chào bạn") và `screenshots.spec.ts` ("Chào bạn") sửa theo HANDOFF #1, #2, đã đánh dấu; thêm test X4 vào `screenshots.spec.ts` | m1, screenshots xanh |

## 2. File sửa
`.github/workflows/deploy.yml`, `playwright.config.ts`, `vite.config.ts`, `vitest.config.ts`, `package.json`, `package-lock.json`, `index.html`, `src/main.tsx`, `.gitignore`, `src/app/screens/LegacyScreen.tsx`, mới `src/app/screens/legacyEntry.ts`; `scripts/validate/run_all.mjs`, mới `scripts/validate/audio_meta.mjs`; mới `scripts/qa/{_lib,tap-targets,contrast,hardcoded-colors,internal-jargon,size-budget,preview-server}.mjs`; `e2e/{a11y,motion,perf,offline,juice}.spec.ts` (mới), `e2e/m1.spec.ts`, `e2e/screenshots.spec.ts`; `docs/audit-max/{KE-HOACH,BAO-CAO}-T1-C.md`, `HANDOFF.md`, `anh-sau/T1-C/**`. Thư viện mới: `@axe-core/playwright` (devDependency, TASKS cho phép). Không thêm `size-limit` (dùng `size-budget.mjs`). Không đụng `cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, `DECISIONS.md`, `src/legacy/**`, `src/core/storage|srs`, `src/games/**`.

## 3. Số đo trước → sau
"Trước" = build/test ở `00165f9` (T1-B) đo lại bằng worktree tạm; "sau" = nhánh này.

| Phép đo | Trước | Sau |
|---|---|---|
| `npx tsc --noEmit -p .` | 0 lỗi | 0 lỗi |
| `npm test` | 399 test, 35 file, Vitest 15,6 s (wall 19,4 s) | 399 test, 35 file, Vitest **10,3 s** (wall 12,9 s); jsdom dựng 13 lần, node cho phần còn lại |
| `npm run validate:data` | PASS (không nói cổng hoãn) | PASS (dev), "5 cổng bị hoãn" |
| `npm run validate:data:release` | 2 835 lỗi (không chạy được bằng npm) | exit 1, 2 835 lỗi, có thống kê theo mã (T3-B làm về 0) |
| Precache PWA (workbox, KiB) | 2 983,3 (237 file) | **1 435,9** (131 file); `size-budget` đo lại 1 436,4 |
| JS khởi động ở `#/` (gzip) | 139,3 | 136,3 (ngưỡng 250) |
| CSS chính (raw) | 152 501 B | 126 461 B (ngưỡng 130 KB) |
| Chunk lazy lớn nhất (gzip) | – | 49,75 KB `legacyEntry` (ngưỡng 120) |
| Font trong `dist/assets` | 81 (woff + woff2) | 19 woff2 |
| Cảnh báo chunk > 500 KB | không | không (còn 8 cảnh báo Rollup "dynamic import will not move module" ở `src/games/*/index.ts`, HANDOFF #4) |
| `grep pixelated` trong CSS gắn ở `index.html` | 0 (nhờ lazy route của T1-B, nhưng CSS không bị tắt khi rời legacy) | 0 và có test tắt/bật |
| Rò chuỗi dev/test vào `dist/assets` | – | `Thư viện component` 0, `TASK2_CLAUDE_RESPONSE` 0, `v1_fixtures` còn (T1-A), `r1_fixtures` còn (T2-A) |
| `PW_PORT=5213 npx playwright test --project=chromium` (CI=true) | m1, screenshots đỏ | 47 test: **38 pass, 9 fixme, 0 fail**, 3,0 phút |
| `--project=mobile` | – | 17 pass (`a11y` 12, `motion` 5) |
| Perf (bản build, CPU ×4, 9 Mbps, 170 ms) | chưa đo | LCP Hôm nay 2 196 ms (≤ 2 500, biên hẹp); INP khi bấm tab Hub 104 ms (≤ 200); 19 khung > 32 ms trong lượt thao tác (chỉ ghi lại) |
| axe (serious/critical, 12 trang × theme) | chưa đo | 0 vi phạm mới; nợ có số liệu ở `KNOWN_DEBT`: `color-contrast` 1–14 node (W1 120–123), `label-content-name-mismatch` 1, `scrollable-region-focusable` 1 |

5 script QA (chạy thật, in số):

| Script | Kết quả hiện tại |
|---|---|
| `size-budget.mjs` | 0 chỉ số vượt; 2 chuỗi rò "CHỜ" (`v1_fixtures`, `r1_fixtures`); `--strict-leaks` coi chúng là lỗi |
| `contrast.mjs` | 135 cặp token, 53 dưới WCAG (dark 4, light 37, exam 12); theme sáng chữ `--color-bg` trên màu nhấn 1,81–3,99:1 |
| `hardcoded-colors.mjs` | 13 chỗ / 5 file (bằng số nền của `KIEM-THU` §2.1) |
| `internal-jargon.mjs` | 7 chỗ (tất cả là chữ "FSRS": `registry.ts`, `v1-daily-run/index.ts`, `V1DailyRun.tsx` ×2, `StatsScreen.tsx`, `L2DictationLadder.tsx`, `sfx.ts`) |
| `tap-targets.mjs` (360×800, dev) | Hôm nay, Hub, Thống kê, Cài đặt: 0; 9 route `play/*`: 86 phần tử < 44 px (V3 49 vì từng từ chọn được, W1 13, L1 9, R1 7, V2 4…) |

`audit-ui --route today,hub --vp 390x844,1280x800` (dark + light, 8 lượt): **0 CHẶN · 74 NẶNG** (M5 38, M1 8, M2 8, M3 8, M4 8, D7 4); không có D3, D4, D5, J8. Toàn bộ NẶNG là mật độ hình/nhân vật (T3-C) và chữ "FSRS" ở Hub (HANDOFF T1-B #3b). Ảnh + khoanh lỗi: `docs/audit-max/anh-sau/T1-C/`; đã mở xem `390x844-dark-today-loi.png` (font Be Vietnam Pro hiển thị đúng, bố cục không đổi). Không có thay đổi giao diện nên không có ảnh sau tương tác/video.

## 4. Chạy tay 8 bước workflow `verify` (máy Windows, Chrome cài sẵn)

| # | Bước | Kết quả |
|---|---|---|
| 1 | `npm ci` | xong (28 s), lockfile khớp |
| 2 | `npx tsc --noEmit -p .` | 0 lỗi |
| 3 | `npm test -- --reporter=dot` | 399/399 |
| 4 | `npm run validate:data` | PASS (dev) |
| 5 | `npx playwright install --with-deps chromium` | **không chạy ở máy** (tải trình duyệt ~170 MB; chưa có sự đồng ý). Thay bằng `PW_CHANNEL=chrome`. Trên CI bước này là bước thật |
| 6 | `npx playwright test --project=chromium` (`CI=true`) | 38 pass, 9 fixme, 0 fail |
| 7 | `npm run build` | exit 0, không cảnh báo chunk > 500 KB |
| 8 | `node scripts/qa/size-budget.mjs` | exit 0 |
Bước 4b (`validate:data:release`) chỉ chạy khi `RELEASE_GATE=1`; chạy tay ra exit 1 (2 835 lỗi) nên chưa được bật.

## 5. Quyết định
- Thêm `e2e/m1.spec.ts` và `e2e/screenshots.spec.ts` vào quyền sửa của T1-C (điều phối giao); sửa theo HANDOFF #1, #2, không skip, không nới assert; đánh dấu "ĐÃ XỬ LÝ" ở HANDOFF.
- Mục 6 (X1): không push, không merge; chỉ đảm bảo workflow chạy được.
- CI dùng Chromium của Playwright (không `channel:'chrome'`); local đặt `PW_CHANNEL=chrome`. Local chưa cài Chromium của Playwright nên mọi lần chạy ở máy dùng Chrome.
- Không thêm `size-limit`: `scripts/qa/size-budget.mjs` đo gzip, raw, precache, rò chuỗi; ít phụ thuộc hơn.
- Ngân sách precache 1,5 MB đạt bằng cách chuyển chunk game, `PlacementScreen`, `ChartRenderer`, kho legacy và fixture sang cache lúc chạy (CacheFirst) thay vì precache; icon manifest không precache. Hệ quả: game chưa mở lần nào thì chưa dùng offline được; game đã mở một lần thì offline chạy.
- a11y và motion dùng "nợ" có số liệu (`KNOWN_DEBT`): vi phạm mới là đỏ, số nút vi phạm không được tăng; đặt `A11Y_STRICT=1` / `MOTION_STRICT=1` để đòi 0. Lý do: nợ contrast thuộc T3-A/T3-C, không để CI đỏ vĩnh viễn trước G0. Cần hạ số khi trả nợ.
- `size-budget.mjs`: chuỗi rò `v1_fixtures`, `r1_fixtures` chỉ cảnh báo ("CHỜ") vì chủ file là T1-A/T2-A; `--strict-leaks` chặn.
- `contrast.mjs`: viền (`--color-border`) chỉ liệt kê khi `--all`, không tính lỗi (WCAG 1.4.11 chỉ áp cho ranh giới thành phần thiết yếu).
- CSP chỉ ở bản build (dev bị chặn bởi React Refresh); `font-src` có `data:` vì Vite nhúng font nhỏ.
- E2E `perf`/`offline` tự build vào `dist-e2e/` và chạy `vite preview` ở `PW_PORT+1000` (build lại khi mã nguồn mới hơn); không phụ thuộc thứ tự bước build của CI.
- `validate:data` (dev) chỉ gom bất thường audio thành 1 NOTE, release mới là lỗi, để không làm đỏ cổng hiện tại.

## 6. Chức năng giữ nguyên (đối chiếu `KE-HOACH-T1-C.md`)
`npm run dev|build|preview|test|validate:data|e2e|shots` còn nguyên (thêm `validate:data:release`, `qa:*`); `#/legacy` vẫn mở và chạy (test `screenshots.spec` "Verify #/legacy mounts cleanly"); mọi spec cũ (m1–m4, screenshots, shell-flow) xanh; offline mở lại V1 được. Không đổi UI.

## 7. Chưa chắc
- Workflow chưa chạy trên runner Ubuntu thật: số nợ axe, ngưỡng LCP 2 500 ms (đo 2 196 ms ở máy này) và font có thể lệch trên Linux; đã đặt `retries:1` cho `CI`. Nếu `verify` đỏ ở lần đầu, xem artifact `playwright-test-results`.
- Chưa chạy Lighthouse PWA, chưa kiểm cài đặt thật trên điện thoại.
- Chưa có test E2E cho đường "chunk bị xoá sau deploy" (`vite:preloadError`).
