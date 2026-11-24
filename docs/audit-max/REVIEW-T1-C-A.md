# REVIEW T1-C – Reviewer A – model Claude Opus 5.5 (rv-T1-C)

Nhánh `audit-max/T1-C` @ `ef6df0f`, worktree `D:\English-wt\T1-C`. Chỉ xét 9 commit riêng của T1-C (`git log audit-max/T1-B..HEAD`, merge-base `00165f9`). Mọi số dưới đây do reviewer tự chạy ngày 24/11/2026, không chép từ BAO-CAO. Nhật ký ở `out/rv-*.txt|json`.

## 0. Chấm mù
Không áp dụng: đợt 1 có 1 reviewer, kiểm test + diff + cấu hình (`07` §3, `TASKS.md` vòng đời bước 4). T1-C không đổi UI.

## 1. Kết quả tự chạy lại

| Lệnh | Kết quả thật |
|---|---|
| `npx tsc --noEmit -p .` | exit 0, 0 lỗi |
| `npm test` (đã tắt server) | 35 file, 399/399 pass; Vitest 9,44 s, wall 11,6 s (≤ 12 s, X17 đạt). Lần chạy lúc có dev/preview server chạy song song: 16,7–20,4 s |
| `npm test -- --reporter=dot` (lệnh CI bước 3) | exit 0, 399/399 |
| `npm run validate:data` | exit 0, "PASS (dev)" + "5 cổng bị hoãn" (thực tế có 6 dòng NOTE hoãn, xem lỗi #9) |
| `npm run validate:data:release` | exit 1, **2 835 lỗi**: INV-V4 1 670 · KHÁC (speaking) 841 · INV-D1 240 · INV-L7 32 · INV-L5 28 · INV-R8 24. Bắt được cả audio (V4/L5/D1) lẫn blind-solve (R8/L7) |
| `PW_PORT=5214 PW_CHANNEL=chrome npx playwright test --project=chromium` | exit 0: 38 pass, 9 skipped (fixme của `juice.spec`), 0 flaky, 3,0 phút, retries 0 |
| `... --project=mobile` | exit 0: 17 pass (a11y 12 + motion 5) |
| axe (annotation, chromium) | today 6/5 CC + 1 LCN; hub 6/13 CC + 1 LCN; settings 3/7 CC + 1 LCN; V1 3/4 CC + 1 SRF; R1 1/6 CC + 1 SRF; W1 120/123 CC (dark/light). Số nợ trong `KNOWN_DEBT` = số đo, không bị thổi phồng |
| `A11Y_STRICT=1 ... -g "settings · dark"` | exit 1 (đỏ thật: "color-contrast: 3 node (cho phép 0)") – cơ chế nợ không che vi phạm mới |
| perf (annotation) | LCP Hôm nay **1 872 ms**; INP (bấm tab Hub) **72 ms**; 19 khung > 32 ms (chỉ ghi) |
| `npx vite build` | exit 0; **không** cảnh báo chunk > 500 KB; còn 8 cảnh báo "dynamic import will not move module" (`src/games/*/index.ts`, ngoài file T1-C); precache **131 mục, 1 435,88 KiB** (≤ 1 500); tự cộng file theo `dist/sw.js`: 1 442,9 KB |
| CSS | `index-*.css` 126 461 B (< 130 KB), `pixelated` = 0; CSS legacy tách riêng `legacyEntry-*.css` 107 093 B |
| Font trong `dist/assets` | 19 woff2, 0 woff |
| X6 | `grep "Thư viện component|DevComponentsScreen|SpeechDevScreen|dev/components|dev/speech" dist/assets/*.js` = 0 file; `#/dev/*` ở bản build rơi về Hôm nay |
| `size-budget.mjs` | exit 0: JS `#/` 136,25 KB gzip · CSS 123,5 KB · chunk lazy lớn nhất `legacyEntry` 49,75 KB · precache 1 436,42 KiB; 2 rò "CHỜ" (`v1_fixtures`, `r1_fixtures`, chủ T1-A/T2-A) |
| `hardcoded-colors.mjs` | exit 1: 13 chỗ / 5 file (khớp nền KIEM-THU) |
| `internal-jargon.mjs` | exit 1: 7 chỗ "FSRS" |
| `contrast.mjs` | exit 1: 135 cặp, 53 dưới ngưỡng; `--all`: 144 cặp, **62** (9 cặp viền bị loại khỏi số lỗi, lỗi #5) |
| `tap-targets.mjs` (360×800, dev) | exit 1: today/hub/stats/settings 0; 9 route `play/*` tổng 86 phần tử < 44 px |
| `audit-ui --route today,hub --vp 390x844,1280x800` | **0 CHẶN · 74 NẶNG** (M5 38, M1 8, M2 8, M3 8, M4 8, D7 4); không D3/D4/D5/J8/JS. Đã mở `390x844-dark-today-loi.png`, `1280x800-light-hub-loi.png`: font Be Vietnam Pro đúng, ảnh không bị pixel hoá; NẶNG đều thuộc T3-C / `registry.ts` (chữ FSRS). Ảnh: `out/review-T1-C-loi/` |
| CSP (vite preview bản build, 21 route kể cả 9 game, exam, legacy, dev/*) | 0 thông báo CSP/"Refused to"; 0 `console.error` trừ `#/legacy`: 1 lỗi 404 `/assets/soul_knight/items/coin_0.png` (đường dẫn tuyệt đối trong `src/legacy/**`, bỏ qua `base`; không phải lỗi T1-C, cấm sửa theo A2 → ghi HANDOFF) |
| YAML workflow | Parse bằng PyYAML OK: jobs `verify`, `deploy` (`needs: verify`, `if` push/dispatch trên master), `audit-ui` (`continue-on-error` cấp job); 0 bước có `continue-on-error` |
| Phạm vi file (`git diff --name-only 00165f9..HEAD`) | 30 file + 42 PNG `e2e/screenshots/**` + 18 ảnh `anh-sau/T1-C/**`; tất cả nằm trong danh sách độc quyền T1-C (+ `m1.spec`, `screenshots.spec`, docs được giao). Không đụng `cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, `src/legacy/**` |
| `test.skip/fixme/only` mới | chỉ `juice.spec.ts` (được phép tới hết đợt 3). `navigator.webdriver`, `data-audit-ignore`: 0 |

## 2. Lỗi tìm thấy (nặng → nhẹ)

| # | Vị trí | Mã luật | Mức | Mô tả | Cách sửa đề xuất |
|---|---|---|---|---|---|
| 1 | `vite.config.ts:44` + `:96` → `dist/sw.js` | X7 (Done), lỗi JS, P6 | **CHẶN** | `runtimeCaching[0].urlPattern` là hàm đóng gói biến ngoài `LAZY_CHUNK_URL`. workbox-build chỉ chép **thân hàm** vào `sw.js` (`({url:s})=>LAZY_CHUNK_URL.test(s.pathname)`), biến không được định nghĩa trong SW (`LAZY_CHUNK_URL` xuất hiện đúng 1 lần trong `dist/sw.js`). Route này đứng đầu nên mỗi request không precache đều ném ReferenceError ở bước so route → **không route runtime nào chạy**: sau khi mở V1 và tải lại (SW đang điều khiển trang), `caches.keys()` chỉ có `workbox-precache-v2` (130 mục), không có `lexicon-chunks`, `lexicon-data`, `lexicon-audio`. Tắt mạng + tải lại `#/play/v1` → sau 3,5 s màn **ERR_UI_BOUNDARY "Failed to fetch dynamically imported module …/v1-daily-run-*.js"** (lặp 3/3 lần; `#/play/r1` cũng vậy). Tiêu chí X7 "offline mở lại V1 chơi được" **không đạt**; dữ liệu JSON và audio cũng không được cache | Viết regex ngay trong hàm (`({url}) => /\/assets\/(…)/.test(url.pathname)`) hoặc dùng `urlPattern: new RegExp(...)`; sau build `grep` `sw.js` không còn tên biến ngoài; thêm assert trong `offline.spec` rằng `caches.keys()` chứa `lexicon-chunks` và `lexicon-data` |
| 2 | `e2e/offline.spec.ts:38-41` | X7, KIEM-THU §2.2 #14, P1 (E) | **NẶNG** | Test xanh giả, che lỗi #1: assert chạy ngay sau `domcontentloaded`; lúc đó header "V1 · Daily Run" đang hiện và "Thử lại" chưa có nên `toBeVisible` và `toHaveCount(0)` qua ngay. Đo lại cùng các bước: t = 500 ms "V1 visible=true, Thử lại=0"; t = 3,5 s "V1 visible=false, Thử lại=1". KIEM-THU #14 đòi "chơi 3 thẻ" offline, test không trả lời câu nào | Chờ phần tử của game (vd nút đáp án `1`) rồi trả lời 3 thẻ khi offline; kiểm "Thử lại"/`ERR_UI_BOUNDARY` sau khi trang ổn định (vd `expect.poll` 3 s), kiểm cache như #1 |
| 3 | `src/app/screens/LegacyScreen.tsx:27-41` | X4 (Done) | **NẶNG** | CSS legacy vẫn rò sang V3 khi rời `#/legacy` **trước khi** chunk legacy nạp xong. Thử trên bản build (`vite preview`) và dev: vào `#/legacy` rồi về `#/` sau 30 / 100 / 300 ms → sau 4 s ở Hôm nay `getComputedStyle(body).imageRendering = "pixelated"`, link `legacyEntry-*.css` vẫn bật; 0 ms và ≥ 800 ms thì đúng. Trên mạng chậm (Fast 4G, chunk 200 KB + CSS 107 KB) cửa sổ này dài hơn nhiều (người dùng bấm vào kho cũ rồi Back). Test X4 hiện chỉ đi đường "chờ legacy hiện xong rồi bấm nút" | Không dựa vào đếm mount: sau khi `import('./legacyEntry')` xong, tắt sheet nếu `location.hash` không bắt đầu `#/legacy`; hoặc `MutationObserver` trên `<head>` tự tắt link/style legacy mới chèn khi không ở route legacy. Thêm E2E "vào legacy rồi Back sau 50 ms" ở cả dev và bản build |
| 4 | `scripts/validate/audio_meta.mjs:49-54` | D3 | **NẶNG** | Thời lượng lấy từ số khung trong header Xing/Info, không đối chiếu với dung lượng thật. Thử: cắt `p1_001.mp3` còn 1/2 → vẫn 255,456 s; cắt `abandon.uk.mp3` còn 1/4 → vẫn 0,672 s; nối 6 lần → vẫn 0,672 s. Listening có sha256 nên bắt được, nhưng vocab và dictation (không có sha) bị cắt/hỏng khi render vẫn qua cổng release → đúng kiểu "xanh giả" mà D3 muốn chặn | Khi có Xing/Info: so `frames × bytesPerFrame` với số byte audio thật (lệch > 10 % = lỗi), hoặc duyệt khung đếm thật; thêm test đơn vị với file cắt cụt |
| 5 | `scripts/qa/contrast.mjs:46` | D2, Q4 | **NẶNG** | Cặp `--color-border` trên nền bị đánh dấu "tham khảo", không tính lỗi, trong khi LUAT D2 ghi rõ "viền thành phần tương tác ≥ 3:1". `--all` cho thấy 9 cặp 1,13–1,58:1 bị ẩn (53 → 62). Đây là nới ngưỡng của luật CHẶN bằng công cụ do builder viết, chỉ ghi ở BAO-CAO §5, không đưa AD duyệt (HANDOFF không có mục này) | Tính viền vào số lỗi như D2, hoặc ghi `HANDOFF.md` mục "Tranh chấp" để AD quyết; tới khi có quyết định thì mặc định đếm |
| 6 | `.gitignore` / commit `3da60ee`; `BAO-CAO-T1-C.md` dòng X15 | X15, Q1 (báo cáo phải đúng sự thật) | **NẶNG** | BAO-CAO ghi "gỡ 43 PNG khỏi index (`git rm --cached`) … `git status` không còn ảnh sau khi chạy E2E". Thực tế commit `3da60ee` **sửa** 42 PNG (vd `dev-components-1280.png` 269 KB → 611 KB), `git ls-files e2e/screenshots` = 43; sau lượt Playwright của reviewer `git status` có 13 PNG bị sửa (reviewer đã `git checkout` trả lại). Tiêu chí X15 "`git status` sạch sau khi chạy app" không đạt, và số liệu báo cáo sai | `git rm -r --cached e2e/screenshots` rồi commit; sửa dòng X15 trong BAO-CAO |
| 7 | `e2e/perf.spec.ts:57-90` | P5, KIEM-THU §2.2 #13 | NHẸ | INP đo khi bấm tab Hub, KIEM-THU đòi "INP chọn đáp án"; 19 khung > 32 ms chỉ ghi, không chặn (phần "30 s V1" hoãn sang `juice.spec`) | Thêm phép đo INP khi chọn đáp án V1 (bản build); ghi rõ phần frame hoãn tới đợt 4 trong HANDOFF |
| 8 | `e2e/a11y.spec.ts:7, 25-38, 47` | D2, Q4 | NHẸ | Tên test "axe 0 vi phạm serious/critical" nhưng cho phép nợ tới 123 node (W1). Cơ chế đỏ thật khi tăng/thêm luật mới (đã kiểm `A11Y_STRICT=1` đỏ), số nợ đúng bằng số đo; nhưng ngưỡng KIEM-THU #8 là 0 nên cần AD xác nhận | Đổi tên test thành "không vượt nợ axe"; xin AD duyệt nợ ở HANDOFF mục "Tranh chấp" |
| 9 | `scripts/validate/run_all.mjs:2376, 2419-2421` | D3 | NHẸ | Báo "5 cổng bị hoãn" nhưng có 6 dòng NOTE hoãn: dòng speaking ("public/audio/speaking/ not yet rendered … 841 audio paths") không khớp regex `--require-(audio\|blind)`, trong khi release đếm 841 lỗi KHÁC | Đưa dòng speaking vào danh sách hoãn (hoặc cho nó chuỗi `--require-audio`), gắn mã cho lỗi speaking |
| 10 | `.github/workflows/deploy.yml:11-13` | X2 | NHẸ | `cancel-in-progress: true` áp cả cho push master: push mới sẽ huỷ job `deploy` đang chạy giữa chừng (GitHub khuyên không huỷ deploy Pages) | `cancel-in-progress: ${{ github.event_name == 'pull_request' }}` |
| 11 | `src/main.tsx:33-46` | X9 | NHẸ | Cờ `sessionStorage` không bao giờ xoá: sau 1 lần tự tải lại trong một tab, lần deploy sau lỗi chunk sẽ không tự tải lại nữa | Lưu thời điểm, cho phép tải lại khi lần trước đã > 10 s, hoặc xoá cờ khi app nạp thành công |
| 12 | `scripts/qa/hardcoded-colors.mjs:10` | D1 | NHẸ | Bỏ qua **toàn bộ** `ChartRenderer.tsx` (D1 chỉ miễn dữ liệu biểu đồ); không bắt `hsl()` và class màu Tailwind thô (`bg-black/60`, nêu ở phụ lục D) | Chỉ miễn khối dữ liệu màu trong ChartRenderer; thêm mẫu `hsla?\(` và `\b(bg\|text\|border)-(black\|white\|[a-z]+-\d{2,3})` |
| 13 | `scripts/qa/preview-server.mjs` (`isStale`) | – | NHẸ | Chỉ so mtime `src/`, `vite.config.ts`, `index.html`; đổi `public/**` hoặc `package.json` thì E2E local đo bản `dist-e2e` cũ (CI không bị vì build mới) | Thêm `public/` và `package-lock.json` vào danh sách so |
| 14 | `e2e/motion.spec.ts` | J8, KIEM-THU §2.2 #10 | NHẸ | Đo animation transform đang chạy, chưa đo "0 `transform` khác `none` sau 200 ms" và chưa thử Cài đặt "Giảm chuyển động" của app (J8 nêu cả hai) | Thêm quét `getComputedStyle(el).transform` trên phần tử hiển thị; thêm 1 ca bật cài đặt trong app |

Ghi nhận ngoài phạm vi T1-C (không tính lỗi): `src/legacy/**` dùng đường dẫn tuyệt đối `/assets/soul_knight/...` nên bản build có `base:/lexicon-arcade/` trả 404 ở `#/legacy` → cần ghi `HANDOFF.md` cho AD (A2 cấm sửa legacy).

## 3. Rubric
Không chấm (đợt 1).

## 4. Chức năng (KE-HOACH-T1-C)

| Mục | Kết quả |
|---|---|
| `npm run dev/build/preview/test/validate:data/e2e/shots` | còn (đã chạy dev, build, preview, test, validate, e2e) |
| `#/legacy` mở và chạy | còn (preview + dev hiện "KHU TRÒ CHƠI HỌC THUẬT ĐA DẠNG", nút "Về Lexicon V3") |
| CSS legacy tắt khi rời legacy | còn ở đường chuẩn; **hỏng** khi rời sớm (lỗi #3) |
| PWA cài được, manifest | còn: `lang:vi`, icon 192/512/maskable 512 đúng kích thước thật |
| Offline mở lại V1 | **hỏng** (lỗi #1) |
| Spec cũ m1–m4, screenshots, shell-flow | còn (xanh) |

## 5. So với tham chiếu
Không áp dụng (đợt 1, không đổi UI).

## 6. Kiểm từng mã (Done của T1-C và phần còn lại)

| Mã | Kết luận | Bằng chứng |
|---|---|---|
| X1 | không tính (điều phối push) | – |
| X2 | **ĐẠT** (cấu trúc) | `verify` 8 bước đúng thứ tự X2 (`npm ci` → tsc → test → validate → cài Chromium → Playwright chromium → build → size-budget), Node 22, `pull_request` + push master + dispatch; `deploy` `needs: verify` và chỉ push/dispatch trên master; 0 bước `continue-on-error` (chỉ job `audit-ui` không chặn, đúng TASKS); `RELEASE_GATE` mặc định tắt (`vars.RELEASE_GATE == '1'`, chỉ master). Chưa chạy trên runner thật. NHẸ #10 |
| X3 | **ĐẠT** | project `chromium` (Desktop Chrome, không cố định `channel`) + `mobile` (Pixel 7); `PW_CHANNEL`, `PW_PORT`; 38 + 17 pass |
| X4 | **KHÔNG ĐẠT** | `pixelated` = 0 trong `index-*.css`, CSS chính 126 KB, chunk CSS legacy riêng; nhưng rò khi rời sớm (lỗi #3) |
| X7 | **KHÔNG ĐẠT** | icon, `lang`, `globIgnores`, precache 1 435,88 KiB đạt; `runtimeCaching` chết vì ReferenceError → offline V1 hỏng (lỗi #1), test che lỗi (lỗi #2). Chưa có Lighthouse |
| X8 | ĐẠT | 19 woff2, 0 woff; font hiển thị đúng trên ảnh audit-ui |
| X9 | một phần | `registerType:'prompt'`, `vite:preloadError` tải lại 1 lần; toast ở HANDOFF #1; NHẸ #11; chưa có E2E xoá chunk |
| X13 | ĐẠT | CSP + description + 2 `theme-color`; 0 lỗi CSP trên 21 route bản build |
| X14 | ĐẠT | `host:'127.0.0.1'` (localhost vẫn truy cập được) |
| X15 | **KHÔNG ĐẠT** | tên gói, `.gitignore` đúng; PNG vẫn bị theo dõi, BAO-CAO sai (lỗi #6); `.bat` ở HANDOFF #7 |
| X16 | chuyển HANDOFF #8 (ngoài file T1-C) | – |
| X17 | ĐẠT | 2 project node/jsdom, 35 file đủ, Vitest 9,44 s |
| D3 (script) | một phần | release exit 1 bắt đúng audio + blind; kiểm thời lượng yếu (lỗi #4), đếm cổng hoãn sai (#9) |
| QA 5 script | ĐẠT phần chạy được + in số | cả 5 chạy, in số, exit ≠ 0 khi vi phạm; `contrast` nới D2 (lỗi #5) |
| Chống gian lận | ĐẠT | file trong danh sách độc quyền; không sửa `cong-cu/**`/LUAT/KIEM-THU; không `test.skip` mới; nợ a11y có số thật và đỏ khi vi phạm mới; motion nợ = 0 và có đối chứng dương |

## 7. Phán quyết: **TRẢ VỀ**
Lý do: 1 lỗi CHẶN (#1: service worker ném ReferenceError, offline V1 hỏng, tiêu chí Done X7 không đạt) và tiêu chí Done X4 chưa đạt (#3). Vòng sửa: #1 → #2 → #3 → #4, #5, #6 → các NHẸ.
