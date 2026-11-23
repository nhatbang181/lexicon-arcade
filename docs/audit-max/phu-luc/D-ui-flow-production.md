# Audit Lexicon Arcade V3: Design system, Flow, Production

> Ngày audit: 23/11/2026 · Chỉ đọc, không sửa file nào trong `D:\English` · Build kiểm tra ra thư mục scratchpad `dist-audit`, không đụng `dist/`.
> Phạm vi: A (design system, UI), B (flow người dùng), C (production). Không đọc sâu `src/games/*`.
> Bối cảnh: theo `PROGRESS.md` dự án đang ở M5 (Speaking). M6 mới là "polish, PWA, deploy", nên nhiều mục dưới đây là việc M6 chưa làm. Báo cáo vẫn chấm theo trạng thái hiện tại.

---

## 0. Điểm tổng

| Mảng | Điểm | Một câu |
|---|---|---|
| UI/UX (design system, component, a11y) | **6/10** | Token gọn, theme tối tương phản tốt, gần như không hard-code màu. Nhưng theme sáng trượt tương phản nặng, component thiếu hover và vùng chạm, chữ 12 px quá nhiều. |
| Animation và feedback (phần nền tảng) | **5/10** | `motion.ts` đúng spec, component tự kiểm reduced-motion. Nhưng không có lớp reduced-motion toàn cục, không có confetti hay ăn mừng ở V3, Recap tĩnh, âm lượng không được lưu. |
| Flow người dùng | **5/10** | Onboarding 3 bước nhanh, placement 3 phần có kết quả, Today có lý do đề xuất. Nhưng shell hiện streak/XP cứng bằng 0, Esc thoát game không hỏi, chơi xong về Hub thay vì về Today, ngày tính theo UTC, không có nhắc học, badge/level viết rồi nhưng không nối vào UI. |
| Production | **5/10** | tsc 0 lỗi, 377/377 test pass, validate:data pass. Nhưng CI deploy không chạy test, chunk chính 343 KB gzip (ngân sách 250), CSS legacy rò vào V3, icon PWA sai cỡ, offline không có data/audio, không xin `storage.persist()`. |

---

## 1. Kết quả chạy lệnh (số liệu thật)

| Lệnh | Kết quả | Thời gian |
|---|---|---|
| (trạng thái ban đầu) | `node_modules` **trống** lúc bắt đầu audit (repo không có dependency cài sẵn). Coordinator chạy `npm ci`, sau đó có 327 package. Script `.bat` ở root sẽ tự `npm install` nên người dùng không nhận ra. | — |
| `tsc --noEmit -p .` | **0 lỗi**, exit 0 | 27 s |
| `vitest run` | **31 file, 377/377 test pass**, 0 fail, 0 cảnh báo. jsdom được tạo 31 lần, chiếm 77% thời gian (167 s CPU) | 23,1 s (25 s tính cả khởi động) |
| `vite build --outDir …/dist-audit` | Thành công, exit 0. **1 chunk > 500 KB**, 8 cảnh báo "dynamic import will not move module", 2 cảnh báo comment `@__PURE__` của zod | 23 s (35 s tính cả khởi động) |
| `node scripts/validate/run_all.mjs` | **PASS** 100% schema, manifest, credits. SFX sprite 54,24 KB / 250 KB | 2 s |
| `playwright test` | Không chạy (cần dev server và Chrome; ngoài brief) | — |

### 1.1 Kích thước bundle (vite build)

| Chunk | Raw | Gzip | Ghi chú |
|---|---|---|---|
| **`index-*.js` (entry)** | **1.120,22 KB** | **342,98 KB** | **> 500 KB. Vượt ngân sách khởi động 250 KB gzip (`03` §9) thêm 37%** |
| `index-*.css` | 251,08 KB | 52,63 KB | Có **2 bản Tailwind** (V3 và `legacy/index.css`) |
| `App-*.js` (legacy, lazy) | 199,76 KB | 51,04 KB | Lazy, chấp nhận được |
| `l1-trap-detector` | 85,96 | 26,05 | Mọi chunk game đều < 150 KB gzip ✅ |
| `v1-daily-run` | 67,01 | 19,45 | |
| `ChartRenderer` | 63,45 | 20,03 | |
| `r1-tfng-judge` | 57,93 | 16,82 | |
| `w2-writing-sprints` | 56,73 | 16,92 | |
| `v2-collocation-forge` | 54,10 | 15,12 | |
| `SpeechDevScreen` (route dev) | 49,84 | 14,38 | Route dev vẫn có trong bản production |
| `l2-dictation-ladder` | 47,77 | 15,07 | |
| `r2-headline-editor` | 40,04 | 12,13 | |
| `w1-essay-lab` | 39,74 | 10,67 | |
| `r1_fixtures` | 36,02 | 11,70 | Fixture test nằm trong bundle production |
| `v3-paraphrase-radar` | 28,10 | 9,32 | |
| Font | 81 file (woff2 505 KB + woff 513 KB) | — | Đủ cả subset cyrillic, latin-ext. File `.woff` thừa vì mọi trình duyệt đích đều hỗ trợ woff2 |
| PWA precache | **174 mục, 3.021 KiB** | — | Gồm ~60 PNG legacy (soul_knight, ui) và cả 81 file font. **Không có** JSON data (9,7 MB) và audio (13 MB) |

Thành phần lớn trong entry (đếm chuỗi đặc trưng): zod (339 lần), placement data, prompt chấm `docs/grading/*.md?raw` (vì `PortfolioScreen` import tĩnh `core/grading`), Dexie, ts-fsrs, howler. Nguyên nhân gốc: `src/app/routes.tsx:3-13` import tĩnh mọi màn (Onboarding, Placement 1.243 dòng, Stats, Settings, Portfolio, DevComponents 610 dòng).

---

## 2. Điểm mạnh (giữ nguyên)

1. **Token màu kỷ luật.** Ngoài `tokens.css` chỉ có 13 chỗ hex trong toàn bộ `src` không phải legacy (W1 ×6, R2 ×4, V1 ×1, Portfolio ×1, Dev ×1), 0 chỗ `rgb(`, 2 class màu Tailwind thô (`bg-black/60` ở Modal/Sheet). Rất sạch.
2. **Theme tối tương phản tốt:** chữ chính 14,9:1, chữ phụ (dim) 7,15:1 trên surface. Exam theme đạt 18,9:1 / 10,3:1.
3. **`motion.ts` khớp đúng `10` §1** (dur, ease, spring, variant đúng/sai/feedback/modal). 9/21 component dùng `useReducedMotion()` và chuyển sang fade.
4. **SFX engine tốt:** sprite 54 KB, có chặn khi đang phát audio học (`setBlocked`), exam mode chỉ cho `timeup`, có nút tắt ở PlayScreen và slider âm lượng ở Settings.
5. **Logic thuần có test:** streak có freeze (bắt đầu với 1, +1 mỗi 7 ngày, tối đa 2), `saveSession` ghi attempt, SRS, XP, streak trong **một transaction** (`attemptRepo.ts:53-104`).
6. **Backup có schemaVersion, checksum, xác nhận 2 bước, khôi phục trong 1 transaction** (`backup.ts:190+`). Kết quả chấm dán vào được parse bằng zod (`grading/parse.ts:552`).
7. **Bảo mật sạch:** 0 `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` trong cả V3 lẫn legacy. Không có API key, không có analytics. Dữ liệu chỉ ở IndexedDB.
8. **Today có lý do đề xuất cho từng thẻ**, nút chính tô theo "việc tiếp theo" (`isPrimaryNext`), có "Đổi bài", có skeleton và empty state.
9. **Chunk game đều < 150 KB gzip**, mỗi game lazy-load qua registry.
10. Git sạch ở các mục quan trọng: `dist`, `tsbuildinfo`, `node_modules`, `_downloads` **không** bị track.

---

## 3. Danh sách vấn đề

Thang mức độ: **P0** mất dữ liệu hoặc hỏng luồng chính · **P1** ảnh hưởng rõ tới trải nghiệm hoặc phát hành · **P2** nên sửa trước M6 xong · **P3** đánh bóng.

### 3.1 P0

#### P0-1. Esc thoát game ngay, không hỏi, kể cả khi Esc dùng cho việc khác
- **Vị trí:** `src/app/screens/PlayScreen.tsx:22-30` (listener `keydown` trên `window` gọi `navigate('/hub')`).
- **Lý do:** `09` §6 yêu cầu hộp "Lưu phần đã làm và thoát?". Hiện tại một lần Esc unmount game ngay lập tức. Tệ hơn, các listener khác cũng nhận Esc cùng lúc. Ví dụ `V3ParaphraseRadar.tsx:339` dùng Esc để bỏ chọn span, và `Modal.tsx:27-34` dùng Esc để đóng modal. Người dùng chỉ muốn đóng modal hay bỏ chọn nhưng bị văng khỏi phiên. Phần đang làm dở có thể mất (PlayScreen bỏ qua `result` của `onExit`).
- **Cách sửa:**
  1. Bỏ listener ở PlayScreen. Thay bằng `requestExit()` mở `<Modal>` xác nhận ("Lưu và thoát" / "Chơi tiếp", focus mặc định "Chơi tiếp").
  2. Chỉ xử lý Esc khi `!e.defaultPrevented` và không có dialog nào đang mở. Component nào tự dùng Esc thì gọi `e.preventDefault()` (sửa Modal, Sheet, V3).
  3. Truyền `onExit(result)` → nếu có result chưa lưu thì gọi `attemptRepo.saveSession` trước khi điều hướng.
- **Tiêu chí ĐẠT:** E2E: vào `/play/v3`, chọn span, bấm Esc → vẫn ở `/play/v3`. Mở modal, bấm Esc → modal đóng, URL không đổi. Bấm Esc khi không có gì mở → hiện hộp xác nhận. Chọn "Lưu và thoát" → `db.attempts.count()` tăng 1.

### 3.2 P1

#### P1-1. Shell hiện streak và XP cứng bằng 0
- **Vị trí:** `src/app/App.tsx:165` ("0 ngày"), `:177` ("0 XP"), `:221` và `:224` (header mobile).
- **Lý do:** Sidebar và header là chỗ người dùng nhìn thấy nhiều nhất. Nó luôn hiện 0 trong khi Today hiện số thật, nên trông như mất dữ liệu. Đây là động lực chính kiểu Duolingo nhưng bị vô hiệu.
- **Cách sửa:** `const profile = useLiveQuery(() => db.profile.get('me'))` (dexie-react-hooks đã cài). Hiện `profile?.streak.count`, `profile?.xp.toLocaleString('vi-VN')`, kèm ❄️ số freeze.
- **Tiêu chí ĐẠT:** Sau 1 phiên V1, sidebar và header mobile hiện cùng số với `today-streak-badge` / `today-xp-badge`, không cần reload (E2E so sánh text).

#### P1-2. Ngày học tính theo UTC, lệch 7 giờ với người dùng ở Việt Nam
- **Vị trí:** `src/core/gamification/streak.ts:38-43` (`getUTCFullYear/Month/Date`). Hàm này cũng được dùng ở `TodayDashboard.tsx` để đánh dấu "đã xong hôm nay" và ở `attemptRepo.ts:82`.
- **Lý do:** Ở UTC+7, ngày mới bắt đầu lúc **07:00 sáng**. Ví dụ: học thứ Hai 08:00, thứ Ba 06:30 (bị tính là thứ Hai UTC), thứ Tư 08:00 → `diff = 2` → mất 1 freeze hoặc gãy streak dù ngày nào cũng học. Phiên lúc 06:00 cũng không được đánh dấu xong trên Today.
- **Cách sửa:** `formatDateKey` dùng giờ địa phương (`getFullYear/getMonth/getDate`). Nên cho phép "giờ chuyển ngày" lùi về 04:00 như Duolingo/Anki: `new Date(ts - 4*3600e3)`. Thêm test với `TZ=Asia/Ho_Chi_Minh`.
- **Tiêu chí ĐẠT:** Unit test: các phiên 08:00 T2, 06:30 T3, 08:00 T4 (giờ VN) → `count = 3`, `freezes` không giảm. Phiên lúc 06:00 làm thẻ Today chuyển sang "Hoàn thành".

#### P1-3. Chơi xong về Hub thay vì về Today, không có "việc tiếp theo"
- **Vị trí:** `PlayScreen.tsx:61` và `:120` (`onExit={() => navigate('/hub')}`), `RecapScreen.tsx:150-168` (chỉ có "Ôn câu sai" và "Về Hôm nay").
- **Lý do:** Vòng lặp hằng ngày (`09` §1: Hôm nay → Game → Recap → Hôm nay) bị đứt. Duolingo luôn đưa người học về đường học và gợi ý bài kế. `09` §7 yêu cầu nút "Tiếp: ③ …".
- **Cách sửa:** Truyền `?from=today&task=<id>`. `onExit` → `navigate(from === 'today' ? '/' : '/hub')`. RecapScreen nhận thêm prop `nextTask?: {title, onStart}` và hiện nút primary "Tiếp: {title}" (phím Enter). Nút "Về Hôm nay" chuyển thành secondary.
- **Tiêu chí ĐẠT:** E2E: Today → bắt đầu task 1 → hoàn thành → Recap có nút "Tiếp: <task 2>" → bấm → URL là `/play/<task2>`. Thoát → URL `#/`.

#### P1-4. Level và mode cứng: luôn "Level 1 · Training"
- **Vị trí:** `PlayScreen.tsx:92` (chuỗi cứng), `:120` (`mode="training" level={1}`).
- **Lý do:** `profile.skillLevels` và `core/adaptive/difficulty.ts` có nhưng không được dùng. Placement chỉnh level L1/L2/R1/R2 rồi bị bỏ qua. Không vào được exam/sprint (route `?mode=` trong `09` §2 không được đọc). Hub thiếu "sheet chọn chế độ" (`09` §5).
- **Cách sửa:** Đọc `useSearch()` của wouter lấy `mode`, `ref`. Lấy level từ `profile.skillLevels[gameId] ?? 1`. Hiện nhãn động. Hub mở `<Sheet>` chọn Training/Exam/Sprint theo `game.modes`.
- **Tiêu chí ĐẠT:** Sau placement có `skillLevels.l1 = 3` → `/play/l1` hiện "Level 3 · Training" và game nhận `level=3`. `/play/l1?mode=exam` → nhãn "Exam", `data-mode="exam"`.

#### P1-5. Theme sáng trượt tương phản ở hầu hết màu kỹ năng và trạng thái
- **Vị trí:** `src/design/tokens.css:68-77` (theme light chỉ đổi màu nền và chữ, **giữ nguyên** màu kỹ năng sáng). `Button.tsx:53-58` (primary: chữ `--color-bg` trên nền màu kỹ năng). `Pill.tsx:42-46`. `FeedbackPanel.tsx:290`, `RecapScreen.tsx:54/137` (chữ màu `--color-correct`).
- **Số đo (WCAG):**

| Cặp (theme sáng) | Tỷ lệ | Ngưỡng |
|---|---|---|
| Nút primary listening (#F7F8FB trên #06B6D4) | **2,29** | 4,5 |
| Nút primary writing (#F7F8FB trên #F59E0B) | **2,02** | 4,5 |
| Nút primary reading / correct | **2,39 / 2,15** | 4,5 |
| Nút primary info (mặc định!) | **3,46** | 4,5 |
| Nút danger (#F7F8FB trên #EF4444) | 3,54 | 4,5 |
| Chữ `--color-correct` trên trắng (đáp án đúng, +XP) | **2,28** | 4,5 |
| Chữ `--color-partial` trên trắng | **1,92** | 4,5 |
| Pill writing / partial / correct (chữ trên nền pha 14%) | **1,93 / 1,75 / 2,02** | 4,5 |

- **Cách sửa:** Thêm vào `[data-theme="light"]` bộ màu đậm (Tailwind 800). Đã đo bằng script:
  `--color-vocab:#5B21B6; --color-listening:#155E75; --color-reading:#065F46; --color-writing:#92400E; --color-speaking:#9F1239; --color-correct:#166534; --color-wrong:#991B1B; --color-partial:#854D0E; --color-info:#1E40AF;`
  Pill đạt 5,55–7,02:1, chữ trên nền #F7F8FB đạt 6,45–8,46:1. Ở theme sáng, nút primary đổi chữ sang `#FFFFFF` (dùng token mới `--color-on-accent`). Với màu 700 thì chữ trắng đạt 4,92–7,10:1.
- **Tiêu chí ĐẠT:** `e2e/a11y.spec.ts` chạy axe-core ở cả `data-theme="light"` và `"dark"` cho Today, Hub, Settings, 1 game → 0 vi phạm `color-contrast`.

#### P1-6. CSS legacy rò vào V3: `body { image-rendering: pixelated }` và Tailwind bị nạp 2 lần
- **Vị trí:** `src/app/screens/LegacyScreen.tsx:5` (`import '../../legacy/index.css'` tĩnh). Vì routes import LegacyScreen tĩnh nên CSS này vào bundle chính. `src/legacy/index.css:1-7` có `@import "tailwindcss"` và `body{image-rendering:pixelated; font-family:…}`. Đã xác nhận trong `index-*.css` đã build: có rule `body{image-rendering:pixelated;…}` ngay sau rule body của V3, cùng các class `.pixel-frame-*`.
- **Lý do:** Mọi ảnh, SVG raster và illustration trong V3 bị render kiểu pixel (răng cưa khi scale). Font body bị legacy ghi đè. CSS phình lên 251 KB (gấp đôi preflight/utilities). Trái với `08` §1 "bỏ phong cách pixel". `url('/assets/ui/…')` trong legacy CSS là đường dẫn tuyệt đối, sẽ 404 dưới `/lexicon-arcade/`.
- **Cách sửa:** (Không sửa `src/legacy/**`, theo AGENTS §2.) Chuyển `import '../../legacy/index.css'` vào trong module lazy, ví dụ tạo `src/app/screens/legacyEntry.ts` gồm `import '../../legacy/index.css'; export { default } from '../../legacy/App';` rồi `React.lazy(() => import('./legacyEntry'))`. Vite sẽ tách CSS thành file riêng, chỉ nạp khi vào `#/legacy`. Khi rời `#/legacy` nên `location.reload()` để gỡ CSS (hoặc chấp nhận).
- **Tiêu chí ĐẠT:** `grep -c "pixelated" dist/assets/index-*.css` = 0. CSS chính < 130 KB raw. Có 1 file CSS riêng cho chunk legacy.

#### P1-7. Bundle khởi động 343 KB gzip, vượt ngân sách 250 KB
- **Vị trí:** `src/app/routes.tsx:3-13`. `PortfolioScreen` kéo `core/grading` (prompt `.md?raw` và schema zod) vào entry. DevComponents và placement data cũng vào entry.
- **Cách sửa:** `React.lazy` cho mọi route trừ Today: Onboarding, Placement, Stats, Settings, Portfolio, Hub, Library, DevComponents. Bọc `<Suspense fallback={<Skeleton lines={4}/>}>` trong `AppRoutes`. Route dev chỉ đăng ký khi `import.meta.env.DEV`. Thêm `build.rollupOptions.output.manualChunks: { vendor: ['react','react-dom','wouter'], data: ['dexie','dexie-react-hooks','ts-fsrs'], zod: ['zod'] }`. Bỏ `export { V1DailyRun }` / `export default` tĩnh trong `src/games/*/index.ts` để hết 8 cảnh báo "dynamic import will not move module". Chuyển `r1_fixtures` ra khỏi đường import production.
- **Tiêu chí ĐẠT:** `npx vite build`: không còn cảnh báo > 500 KB. Tổng JS gzip tải ở `#/` (entry + vendor + Today) ≤ 250 KB. Đo bằng `e2e/perf.spec.ts` (đọc `performance.getEntriesByType('resource')`). LCP Today ≤ 1,5 s trên `vite preview`.

#### P1-8. CI deploy thẳng lên production, không chạy test hay validate
- **Vị trí:** `.github/workflows/deploy.yml:31-35` (chỉ `npm ci` rồi `npm run build`).
- **Lý do:** 377 unit test, `validate:data` và E2E đều không chặn deploy. Commit làm hỏng dữ liệu hoặc logic chấm vẫn lên Pages.
- **Cách sửa:** Thêm job `verify` chạy trước `build-and-deploy` (`needs: verify`):
  ```yaml
  - run: npm ci
  - run: npx tsc --noEmit -p .
  - run: npm test -- --reporter=dot
  - run: npm run validate:data
  - run: npx playwright install --with-deps chromium
  - run: npx playwright test --project=chromium   # cần bỏ channel:'chrome' hoặc thêm project chromium
  ```
  Thêm trigger `pull_request`. Cân nhắc Node 22 (đồng bộ `@types/node ^22`).
- **Tiêu chí ĐẠT:** Một PR làm hỏng 1 test → check đỏ và job deploy không chạy.

#### P1-9. PWA: icon sai cỡ, offline không có nội dung học
- **Vị trí:** `vite.config.ts:22-33`, `:35-38`.
- **Lý do:**
  1. Cả icon 192 và 512 đều trỏ tới `app_icon.png`, file thật là **256×256, 3,2 KB**. Chrome sẽ báo icon sai kích thước, splash và icon cài đặt bị mờ. Trong khi `public/pwa-192.png` (192×192), `pwa-512.png` (512×512) và `maskable-512.png` **đã có sẵn nhưng không dùng**. Không có icon `purpose: "maskable"`.
  2. `globPatterns` không có `json`, `mp3`, `webm`, và không có `runtimeCaching` → offline mở được shell nhưng mọi game lỗi tải data. `03` §2 yêu cầu "cache shell, data, audio".
  3. Precache có ~60 PNG legacy và 81 file font (cả `.woff` thừa, khoảng 1 MB).
  4. Manifest sinh ra có `"lang":"en"` trong khi app tiếng Việt.
- **Cách sửa:**
  ```ts
  icons: [
    { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  lang: 'vi',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,svg,woff2}', 'pwa-*.png', 'maskable-512.png', 'assets/sfx/*', 'data/manifest.json'],
    globIgnores: ['**/soul_knight/**', 'assets/ui/**', '**/*-cyrillic-*', '**/*.woff'],
    runtimeCaching: [
      { urlPattern: /\/data\/.*\.json$/, handler: 'StaleWhileRevalidate', options: { cacheName: 'data', expiration: { maxEntries: 200 } } },
      { urlPattern: /\/audio\/.*\.mp3$/, handler: 'CacheFirst', options: { cacheName: 'audio', rangeRequests: true, expiration: { maxEntries: 800, maxAgeSeconds: 60*60*24*90 } } },
    ],
  }
  ```
  Đổi `main.tsx:3-12` sang import theo subset, ví dụ `@fontsource/be-vietnam-pro/vietnamese-400.css` và `latin-400.css`, để bỏ cyrillic và latin-ext không cần.
- **Tiêu chí ĐẠT:** Lighthouse PWA: không còn cảnh báo icon, có maskable. Precache ≤ 1,5 MB. E2E: mở V1 online một lần, chuyển `context.setOffline(true)`, reload, V1 vẫn chơi được.

#### P1-10. Dữ liệu người học có thể mất: không `persist()`, khôi phục xoá ghi âm
- **Vị trí:** không có `navigator.storage.persist` ở đâu trong `src` (grep 0 kết quả). `backup.ts:110` bỏ `audioBlob` khi xuất, trong khi khôi phục `clear()` toàn bộ bảng `recordings` rồi ghi bản không có audio.
- **Lý do:** App không có server, toàn bộ tiến độ nằm trong IndexedDB. Không xin persist thì trình duyệt có thể dọn khi thiếu dung lượng, Safari có thể xoá sau 7 ngày không mở nếu chưa cài PWA. Khôi phục một bản backup sẽ **xoá vĩnh viễn mọi ghi âm Speaking** đang có trên máy. Thiếu chế độ "gộp" và "Xoá toàn bộ (gõ XOA)" theo `09` §10.
- **Cách sửa:** Khi khởi động (sau onboarding) gọi `navigator.storage?.persist?.()` và ghi kết quả vào `kv['storage_persisted']`. Settings hiện trạng thái và `navigator.storage.estimate()`. Khi khôi phục, giữ lại `audioBlob` của bản ghi trùng `id` (đọc trước, merge sau), hoặc cảnh báo rõ "N ghi âm sẽ bị xoá". Thêm lựa chọn "Gộp" dùng `bulkPut` không `clear()`. Nhắc sao lưu nếu > 7 ngày chưa xuất (`kv['last_backup_at']`).
- **Tiêu chí ĐẠT:** Unit test: DB có 2 recording có blob, khôi phục backup chứa cùng 2 id → blob vẫn còn. Settings hiện "Lưu trữ bền: Có/Không" và dung lượng đã dùng.

#### P1-11. Lỗi IndexedDB làm Today, Stats, Portfolio kẹt skeleton mãi
- **Vị trí:** `TodayDashboard.tsx:126-229` (`loadTodayData` không có try/catch), `StatsScreen.tsx`, `PortfolioScreen.tsx`, `PlacementScreen.tsx` (0 khối `catch`). `OnboardingScreen.tsx:95-113` (`persistOnboarding` chỉ có `finally`).
- **Lý do:** Firefox private, hết quota, hoặc Dexie lỗi khi nâng version → promise reject, `loading` không bao giờ về `false`, người dùng thấy skeleton vô hạn. Sai `09` §11 ("màn lỗi có nút Thử lại và mã lỗi").
- **Cách sửa:** Tạo hook dùng chung `useAsyncData(fn)` trả `{data, error, loading, retry}`. Khi lỗi, render `<EmptyState tone="error" title="Không đọc được dữ liệu trên máy" description={`Mã: ERR_DB_${err.name}`} action={<Button onClick={retry}>Thử lại</Button>}/>`.
- **Tiêu chí ĐẠT:** Unit/E2E: mock `db.profile.get` reject → trong 1 s có nút "Thử lại", không còn skeleton.

#### P1-12. Lưới an toàn reduced-motion không có ở mức toàn cục
- **Vị trí:** `tokens.css` không có `@media (prefers-reduced-motion)`. Không có `<MotionConfig reducedMotion="user">` ở `App.tsx`. Settings không có công tắc "giảm chuyển động" (`09` §10). `Skeleton.tsx:15,27` (`animate-pulse`), `Button.tsx:86` (`active:scale`), `Card.tsx:260` (`hover:-translate-y-0.5`), `OnboardingScreen.tsx:142` (`transition-all` trên `width`) đều không kiểm.
- **Lý do:** Chỉ component nào tự gọi `useReducedMotion()` mới tôn trọng. Animation CSS và các game quên kiểm sẽ vẫn chạy. Setting riêng của app thì không có.
- **Cách sửa:** (1) Bọc app bằng `<MotionConfig reducedMotion={settingReduce ? 'always' : 'user'}>`. (2) Thêm vào `tokens.css`:
  `@media (prefers-reduced-motion: reduce){ *,*::before,*::after{ animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.1s!important; scroll-behavior:auto!important } }`
  và bản tương tự cho `[data-reduce-motion="true"]`. (3) Thêm toggle trong Settings, lưu vào `kv`. (4) Đổi progress bar onboarding sang `transform: scaleX()`.
- **Tiêu chí ĐẠT:** `e2e/motion.spec.ts` (đã ghi trong `10` §5 nhưng chưa có): `emulateMedia({reducedMotion:'reduce'})`, sau 200 ms không element nào có `transform` khác `none` hoặc `matrix(1, 0, 0, 1, 0, 0)` trên Today và V1.

### 3.3 P2

| # | Vấn đề | Vị trí | Cách sửa (thông số) | Tiêu chí ĐẠT |
|---|---|---|---|---|
| P2-1 | **Âm lượng và mute không được lưu**, mất khi reload. `profile.sfxVolume` mặc định `0.7` (thang 0–1) trong khi Provider dùng 60 (thang 0–100). Migrate legacy "muted" ghi vào profile nhưng không bao giờ được đọc | `AudioProvider.tsx:33-41`, `profileRepo.ts:43` | Thống nhất thang 0–100, mặc định 60. Đọc từ `profile.sfxVolume` khi mount, ghi bằng `profileRepo.update` (debounce 300 ms) | Đặt 25%, reload → slider vẫn 25%, `sfxEngine.getVolume() === 25` |
| P2-2 | **Theme, mục tiêu band, phút/ngày không lưu ở ThemeProvider**. Không có lựa chọn "theo hệ thống" (`09` §10). Theme luôn về dark khi reload | `ThemeProvider.tsx:166-168` | Lưu `profile.theme`. Thêm `'system'` dùng `matchMedia('(prefers-color-scheme: light)')`. Cập nhật `<meta name="theme-color">` theo theme | Chọn Light, reload → `html[data-theme="light"]` |
| P2-3 | **Badge và level viết rồi nhưng không dùng**: `evaluateNewBadges` (`badges.ts:112`) và `xpToLevel` (`xp.ts:105`) không được gọi ở đâu. Stats hiện badge nhưng không bao giờ mở khoá. Không có level trong UI | `attemptRepo.saveSession` | Trong transaction: `const newBadges = evaluateNewBadges(...)`, ghi `profile.badges`, trả `{newBadges, levelUp}` cho game để hiện toast và confetti | Phiên đầu tiên → badge "first session" có trong `profile.badges` và hiện toast |
| P2-4 | **Kết quả streak bị bỏ**: `freezeUsed`, `freezeEarned`, `broken` không tới UI. Today hiện `streak.count` cũ ngay cả khi streak đã gãy 5 ngày (không dùng `checkStreakStatus`) | `attemptRepo.ts:87-89`, `TodayDashboard.tsx:275` | Trả các cờ về UI để hiện toast ("Đã dùng 1 ❄️ để giữ chuỗi 12 ngày"). Khi hiển thị: `health==='broken' ? 0 : count`. Thêm banner "Chuỗi đang gặp nguy" khi `active_at_risk` sau 18:00 | Mock lastActiveDay = 5 ngày trước → Today hiện "0 ngày" |
| P2-5 | **Không có nhắc học** (Notification hay banner). Duolingo dựa nhiều vào việc này | toàn app | Không cần server: (a) banner trong app khi mở lúc ≥ 18:00 mà chưa đạt mục tiêu; (b) xin `Notification.requestPermission()` sau khi xong mục tiêu ngày đầu tiên, rồi khi mở PWA gọi `registration.showNotification` cho ngày kế (giới hạn của PWA, ghi rõ). (c) xuất file `.ics` nhắc hằng ngày vào lịch | Có cài đặt "Giờ nhắc" và banner xuất hiện đúng điều kiện |
| P2-6 | **Xong mục tiêu ngày không có phản hồi**: không ring-complete, không toast, không SFX `goal` (`09` §4, `10` §2) | `TodayDashboard.tsx:286+`, `ProgressRing.tsx` | Khi `progressPct` vượt 100 lần đầu trong ngày (ghi `kv['goal_celebrated_<date>']`): ring đầy, `playSfx('goal')`, toast "Xong mục tiêu hôm nay", confetti 80 hạt (nếu không reduce) | E2E: seed attempts đủ phút → toast hiện đúng 1 lần mỗi ngày |
| P2-7 | **Không có confetti hay particle trong V3**: `canvas-confetti` chỉ dùng trong `src/legacy/**` (4 file) | `src/design` | Tạo `design/celebrate.ts`: `celebrate({ colors:[skillA, skillB], particleCount:80, spread:70, disableForReducedMotion:true })`. Chỉ gọi ở level up, Mastered, streak 7/30/100 | Grep `celebrate(` có ở saveSession handler. Reduced-motion → không vẽ canvas |
| P2-8 | **RecapScreen tĩnh và có số giả**: mặc định `accuracyPercent=80`, `durationSec=240` (game quên truyền sẽ hiện số bịa). Không đếm điểm lên, không stagger 60 ms, câu sai không bấm mở lại được | `RecapScreen.tsx:31-32`, `:46-57`, `:123-145` | Bỏ mặc định (bắt buộc truyền hoặc ẩn ô). `useCountUp(0→N, 800ms, easeOut)` bằng `animate()` của motion. Danh sách vào lần lượt `staggerChildren: 0.06`. Mỗi câu sai là `<button>` mở FeedbackPanel | Không truyền accuracy → ô "Chính xác" không hiện. Số XP đếm trong 0,8 s |
| P2-9 | **Vùng chạm < 44 px**: Button `sm` 36 px (`Button.tsx:46`, dùng cho "Đổi bài", "Bắt đầu" trên Today). Nút đóng Modal/Sheet và nút thoát/âm lượng ở PlayScreen `w-9 h-9` = 36 px (`Modal.tsx:84`, `Sheet.tsx:92`, `PlayScreen.tsx:62,98`). Nút đóng Toast `p-1` khoảng 24 px (`Toast.tsx:178`). Nút "Báo item sai" khoảng 26 px (`FeedbackPanel.tsx:264`). QuestionNav `min-h-[38px]`. TrackPlayer 34–36 px | các file nêu | `sm` → `min-h-[44px]` trên màn cảm ứng: `min-h-9 pointer-coarse:min-h-11` (Tailwind 4 có variant `pointer-coarse`). Icon button `w-11 h-11` (44 px). Toast close `p-2.5` + icon 16 → 36, hoặc thêm `::after` vùng chạm 44 | axe `target-size` 0 vi phạm ở 360×780. Playwright đo `boundingBox().height >= 44` cho mọi `button` ở viewport mobile |
| P2-10 | **Thiếu trạng thái hover/active rõ**: chỉ 6 chỗ `hover:` trong design/app/features. `ChoiceButton` không có hover (`08` §5 yêu cầu). Button chỉ `hover:opacity-90` (gần như không thấy). `transition-opacity` nên `active:scale-[0.99]` nhảy cụt và quá nhỏ. Disabled chỉ `opacity-50`. Phần lớn dùng inline `style={{}}` nên không gắn được hover | `Button.tsx:86`, `ChoiceButton.tsx:192` | Chuyển màu sang class dùng biến: `bg-(--accent) hover:bg-[color-mix(in_srgb,var(--accent)_88%,white)] active:scale-[0.97] transition-[transform,background-color] duration-150`. ChoiceButton idle: `hover:border-(--color-info) hover:bg-(--color-surface-2)` | Ảnh chụp trạng thái hover/active/focus/disabled cho Button và ChoiceButton trong `/dev/components` khác nhau rõ (diff pixel > 2%) |
| P2-11 | **Modal và Sheet chưa đạt a11y**: không bẫy focus, không đưa focus vào khi mở, không trả focus khi đóng. `id="modal-title"` cố định (2 modal → trùng id) | `Modal.tsx:39-44`, `Sheet.tsx` | Dùng `useId()` cho title. Khi mở: lưu `document.activeElement`, focus phần tử đầu tiên. Tab vòng trong dialog. Khi đóng: trả focus. Hoặc dùng `<dialog>` gốc với `showModal()` | axe 0 lỗi. E2E: mở modal, Tab 10 lần → focus vẫn trong dialog |
| P2-12 | **Card interactive không dùng được bằng bàn phím**: `div` có `cursor-pointer` + onClick, không có role, tabIndex hay onKeyDown | `Card.tsx:257-261`, `HubScreen.tsx:99` | Khi `interactive`: render `<button>` hoặc thêm `role="button" tabIndex={0}` và Enter/Space | Tab tới thẻ Hub, Enter → vào game |
| P2-13 | **Chữ nhỏ áp đảo**: `text-xs` (12 px) dùng 407 lần, `text-[11px]` 37, `text-[10px]` 4, so với `text-base` 66. `08` §3 quy định body 16/15 px, chú thích 13/12 | toàn `app/`, `features/`, `design/` | Thêm thang chữ vào `@theme`: `--text-caption:13px; --text-body:16px; --text-question:20px; --text-h2:20px; --text-h1:28px; --text-display:48px` (kèm line-height). Mô tả/lý do trên Today dùng `text-sm` tối thiểu. Cấm `text-[10px]`, `text-[11px]` ở nội dung | Số `text-xs` + `text-[1Xpx]` trong features ≤ 120. Không còn chữ < 12 px |
| P2-14 | **Chữ faint ở theme tối dưới AA**: `#6B7690` trên surface **3,89:1**, trên surface-2 **3,47:1** (cần 4,5). Viền `#26304A` trên surface 1,35:1 (viền input nên ≥ 3:1) | `tokens.css:11,64` | `--color-text-faint:#8792AB` (5,66 trên surface, 5,06 trên surface-2). Thêm `--color-border-strong:#56627F` (2,90, gần 3:1) cho input và ô đáp án. Theme sáng dùng `#8A94A6` (3,06) | Script contrast: mọi cặp text/nền ≥ 4,5 |
| P2-15 | **Onboarding thiếu bước "Thiết bị" và lựa chọn 15 phút**: 3 bước thay vì 4 (`09` §3), không kiểm tai nghe hay micro, không giới thiệu chấm qua Claude. Lựa chọn phút/ngày `[30,45,60,90]` thay vì `15/30/45/60`. Không có mốc thấp kiểu Duolingo (5–15 phút) để giữ streak ngày bận | `OnboardingScreen.tsx:25-31` | Thêm bước 3 "Thiết bị" (phát 1 câu mẫu `public/audio/...`, nút thử mic → transcript, 3 dòng giải thích chấm qua Claude, có nút "Bỏ qua"). Options `[15,30,45,60]`, mặc định 30 | E2E onboarding đếm 4 bước. Hoàn thành ≤ 90 s bằng phím Enter liên tục |
| P2-16 | **Tên mặc định "Bang" cứng trong code**: hiện "Chào Bang" cho bất kỳ ai | `TodayDashboard.tsx:116`, `:140-143`, `OnboardingScreen.tsx:39,98` | Mặc định `''` → "Chào bạn" | Profile mới → h1 "Chào bạn · Hôm nay học gì?" |
| P2-17 | **Today còn logic giai đoạn M1**: `READY_M1_GAMES`, `SWAP_POOL` có `s2` (chưa sẵn sàng), `normalizePlanForM1` ép V1–V3 lên đầu dù L1, L2, R1, R2, W1, W2 đã chạy được. Thiếu phím Enter cho thẻ đầu (`09` §4). Thiếu "câu thắng gần nhất", "tuần này" | `TodayDashboard.tsx:43-89`, `:255-266` | Lọc swap theo `isGameReady`. Bỏ `normalizePlanForM1`, để planner chọn theo khoảng cách band. Thêm `keydown Enter` → `navigate('/play/'+firstUnfinishedTask.gameId)` (bỏ qua nếu focus đang ở input) | "Đổi bài" không bao giờ ra game chưa sẵn sàng. Enter trên Today mở task đầu tiên chưa xong |
| P2-18 | **Xoá bài viết không hỏi lại, xoá vĩnh viễn** | `PortfolioScreen.tsx:161-168` | Modal xác nhận, hoặc toast "Đã xoá · Hoàn tác" 5 s (soft-delete `deletedAt`) | Bấm xoá → có xác nhận hoặc hoàn tác |
| P2-19 | **Route dev có trong bản production**: `/dev/components` (import tĩnh, 610 dòng), `/dev/speech`. Còn có `r1_fixtures` chunk | `routes.tsx:320-327` | `{import.meta.env.DEV && <Route …/>}` và lazy | `grep -c "Thư viện component" dist/assets/*.js` = 0 |
| P2-20 | **Backup chỉ kiểm cấu trúc ngoài**: `z.array(z.any())` cho mọi bảng, nên file sửa tay có card thiếu `due` vẫn được nhập và làm hỏng FSRS | `backup.ts:46-57` | Dùng schema thật cho `SRSCard`, `AttemptRecord`, `UserProfile` (`z.object({...}).passthrough()`), báo lỗi theo dòng | Test: backup có card thiếu `due` → `valid:false` với thông báo rõ |
| P2-21 | **E2E chỉ ở mức smoke**: 6 test (m1–m4, screenshots), không có `a11y.spec.ts`, `motion.spec.ts`, `perf.spec.ts` dù `08` §2, `10` §5, `03` §9 yêu cầu. Không kiểm "chơi chỉ bằng bàn phím", backup/restore, theme sáng. `channel:'chrome'` buộc phải có Chrome cài sẵn (CI sẽ lỗi) | `playwright.config.ts:12`, `e2e/` | Thêm `projects: [{name:'chromium', use:{...devices['Desktop Chrome']}}]`, bỏ `channel`. Thêm `@axe-core/playwright` và 3 spec còn thiếu. Thêm spec onboarding → V1 → Recap → Today bằng bàn phím | `npx playwright test` chạy được trên ubuntu-latest. Có ≥ 10 test, gồm a11y, motion, perf |
| P2-22 | **Không có Thư viện**: `/library` là placeholder (`PlaceholderScreens.tsx:46`), trong khi tab đáy hiện ngang hàng 4 mục còn lại. Không có tab "Thi" | `App.tsx:24-55` | Ẩn tab Thư viện tới khi xong, hoặc gắn nhãn "Sắp có". Sau M6 đổi nav thành Hôm nay / Luyện / Thi / Thống kê / Thêm | — |
| P2-23 | **Cập nhật PWA có thể làm vỡ phiên**: `registerType:'autoUpdate'`, chunk cũ bị xoá khỏi precache, game lazy-load sau khi deploy mới sẽ lỗi "Failed to fetch dynamically imported module" và rơi vào ErrorBoundary chung | `vite.config.ts:11`, `ErrorBoundary.tsx` | `registerType:'prompt'` + toast "Có bản mới · Tải lại" chỉ hiện ngoài `/play/*`. ErrorBoundary bắt lỗi chunk → `location.reload()` 1 lần | Mô phỏng: xoá chunk game, vào game → tự reload hoặc có nút rõ |
| P2-24 | **ErrorBoundary chỉ có 1 ở ngoài Switch** và không reset khi đổi route. Lỗi ở Stats làm mọi route khác cũng hiện màn lỗi tới khi bấm "Thử lại" | `routes.tsx:302`, `ErrorBoundary.tsx` | `<ErrorBoundary key={location}>` hoặc bọc từng route | Lỗi ở Stats → bấm tab Hôm nay → Today hiện bình thường |

### 3.4 P3

| # | Vấn đề | Vị trí | Cách sửa |
|---|---|---|---|
| P3-1 | Không có thang chữ/line-height trong token (chỉ có màu, radius, spacing). Spacing lệch lưới 8 px: `1.5/2.5/3.5` (6/10/14 px) dùng 119 lần | `tokens.css` | Thêm `--text-*` (xem P2-13). Chấp nhận bước 4 px, bỏ 6/10/14 |
| P3-2 | `index.html` thiếu `<meta name="description">`, `theme-color` cứng màu tối, không có `<noscript>` | `index.html` | Thêm description tiếng Việt, `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F7F8FB">` |
| P3-3 | `server.host: true` mở dev server ra toàn mạng LAN | `vite.config.ts:47` | `host: '127.0.0.1'`, bật LAN bằng `--host` khi cần |
| P3-4 | Rác ở root: `run_game.bat` (tracked, nội dung cũ "Lexicon Quest RPG", tự gọi `python scripts\extract_anki.py` và `npm install`), `CHOI_GAME_TIENG_ANH.bat` (tracked, cứng `d:\English`), `LEXICON ARCADE.lnk` (untracked, chưa ignore). `e2e/screenshots/` có 43 PNG, 6,3 MB được track | root | Chuyển `.bat` vào `scripts/launch/` hoặc xoá `run_game.bat` (hỏi Bang). Thêm `*.lnk` vào `.gitignore`. Cân nhắc ignore `e2e/screenshots/` hoặc dùng Git LFS |
| P3-5 | `package.json` tên vẫn là `lexicon-quest` | `package.json:2` | `"name": "lexicon-arcade"` |
| P3-6 | Vitest tạo jsdom 31 lần, chiếm 77% thời gian | `vitest.config.ts` | `environment:'node'` cho `src/core/**` (`environmentMatchGlobs`), jsdom chỉ cho `*.test.tsx`. Dự kiến giảm còn khoảng 8–10 s |
| P3-7 | `KeyHint` 22 px, chữ 11 px | `KeyHint.tsx:11` | 12 px, ẩn trên thiết bị `pointer-coarse` |
| P3-8 | SFX `tap` dài 20 ms (gần như không nghe), Button không có SFX `tap` | `sfx.json`, `Button.tsx` | Cắt lại `tap` khoảng 40–60 ms. Thêm prop `sfx?: SfxName` cho Button (mặc định không phát) |
| P3-9 | Timer `aria-label` đổi mỗi giây | `Timer.tsx:229-230` | Nhãn tĩnh + vùng `aria-live` riêng chỉ báo ở 5 phút, 1 phút, 10 giây (`09` §12) |

---

## 4. Thiết kế: bảng tương phản đầy đủ (từ token)

Tính theo WCAG 2.x (độ chói tương đối). Ngưỡng AA: chữ thường 4,5, chữ lớn ≥ 24 px là 3,0, viền/UI là 3,0.

**Theme tối**

| Chữ \ Nền | bg #0B0F1A | surface #121829 | surface-2 #1A2238 |
|---|---|---|---|
| text #E8ECF5 | 16,17 ✅ | 14,93 ✅ | 13,35 ✅ |
| text-dim #9AA5BE | 7,74 ✅ | 7,15 ✅ | 6,39 ✅ |
| text-faint #6B7690 | 4,21 ❌ | **3,89 ❌** | **3,47 ❌** |
| border #26304A (UI) | — | 1,35 ❌ | — |

Màu kỹ năng làm chữ trên surface (tối): vocab 4,17 ❌, listening 7,28, reading 6,97, writing 8,23, speaking 4,81, exam 6,89, correct 7,76, wrong 4,70, partial 9,21, info 4,80. Pill (chữ trên nền pha 14%): **vocab 3,57 ❌**, **speaking 4,22 ❌**, **wrong 4,12 ❌**, **info 4,03 ❌**, các màu khác ≥ 5,5.
Nút primary (chữ #0B0F1A trên màu kỹ năng): vocab 4,52 (vừa đủ), speaking 5,21, info 5,20, danger 5,08, các màu khác ≥ 7,4 ✅. Gợi ý: Pill tối dùng màu sáng hơn 1 bậc (vocab `#A78BFA` → nút 7,03:1).

**Theme sáng**

| Chữ \ Nền | bg #F7F8FB | surface #FFFFFF | surface-2 #F1F3F8 |
|---|---|---|---|
| text #0F172A | 16,81 ✅ | 17,85 ✅ | 16,08 ✅ |
| text-dim #475569 | 7,14 ✅ | 7,58 ✅ | 6,83 ✅ |
| text-faint #64748B | 4,48 ❌ (sát) | 4,76 ✅ | 4,29 ❌ |
| border #E2E6EF | — | 1,25 ❌ | — |

Màu kỹ năng trên trắng: vocab 4,23, listening **2,43**, reading **2,54**, writing **2,15**, speaking 3,67, exam **2,56**, correct **2,28**, wrong 3,76, partial **1,92**, info 3,68. Tất cả ❌. Nút primary (chữ #F7F8FB): 1,81–3,99 ❌. Bộ thay thế (Tailwind 800) và số đo xem P1-5.

**Exam:** text 18,88, dim 10,31, faint 4,83 trên trắng ✅. faint trên surface-2 là 4,39 (sát ngưỡng).

---

## 5. Flow người dùng: đo và so với Duolingo

| Hạng mục | Hiện trạng Lexicon V3 | Duolingo | Khoảng cách |
|---|---|---|---|
| Lần đầu mở app | Vào thẳng Today, có banner "Thiết lập lần đầu (~90 giây)". Không bắt buộc | Bắt buộc onboarding ngắn, vào bài đầu < 60 s | Chấp nhận được (app 1 người dùng) |
| Onboarding | **3 bước** (Chào → Mục tiêu: tên, 4 band, phút/ngày, ngày thi → Placement hay bỏ qua). Ước tính **60–90 s**. Có thanh tiến độ, animation trượt, hỗ trợ reduced-motion | 5–7 câu hỏi, mỗi câu 1 chạm | Thiếu bước thiết bị. Thiếu mốc 15 phút |
| Placement | Từ vựng **12–15 câu**, Reading **1 passage + 6 câu**, Listening **6 câu** có audio. Khoảng 27 câu, ước tính **8–12 phút**, 3 màn kết quả trung gian, mỗi phần có nút "Bỏ qua, về Hôm nay". Placeholder vẫn ghi "~25 phút, 20 câu" (lỗi thời) | 5–10 phút, thích ứng | Tốt. Nên gộp thành 1 màn kết quả cuối |
| Vòng lặp Today | Có danh sách 3 task, lý do, phút, nút chính nổi bật cho task tiếp theo, vòng mục tiêu phút. **Nhưng:** chơi xong về Hub (P1-3), không có Enter, không có ăn mừng khi xong mục tiêu, shell hiện 0 | Nút "Bắt đầu" to, rõ, quay về đường học sau mỗi bài | Việc tiếp theo **rõ trên Today nhưng vòng lặp bị đứt sau mỗi phiên** |
| Streak | Có freeze (1 lúc đầu, +1 mỗi 7 ngày, tối đa 2), tự dùng khi lỡ 1 ngày. **Ngày theo UTC** (P1-2). Không báo khi freeze được dùng, kiếm được hoặc khi gãy | Freeze mua bằng gem, có streak repair, thông báo rõ | Logic tốt, phần hiển thị yếu |
| Nhắc học | **Không có** | Push hằng ngày, email | Thiếu hoàn toàn (P2-5) |
| Mục tiêu ngày | Theo phút (30/45/60/90), vòng tiến độ | Theo XP (10/20/30/50) | Không có phản hồi khi đạt (P2-6) |
| Màn kết quả | RecapScreen: điểm, +XP, chính xác, thời gian, câu thắng, danh sách sai, ôn lại. Tĩnh, có số mặc định giả (P2-8) | Đếm XP, confetti, streak +1 hoạt hình, nút tiếp tục | Thiếu cảm giác thưởng |
| Level/badge | Có code, **không nối vào UI** (P2-3) | Level, league, achievement | Code chết |
| Empty state | Today, Stats, Portfolio, Hub có `EmptyState` với CTA | — | Tốt |
| Lỗi tải data | Loader throw rõ ràng (`loaders.ts:61`). **Màn feature không bắt lỗi DB** (P1-11). Có 1 ErrorBoundary chung | — | Thiếu nút "Thử lại" và mã lỗi |
| Backup/restore | Xuất/nhập JSON có checksum, xác nhận 2 bước. **Thiếu** gộp, xoá toàn bộ, persist, giữ ghi âm (P1-10) | Đồng bộ đám mây | Ổn cho app offline, cần vá chỗ mất ghi âm |
| Thoát giữa phiên | **Esc thoát ngay, không hỏi** (P0-1) | Hỏi "Bạn chắc chứ? Sẽ mất tiến độ" | Nghiêm trọng |

---

## 6. Production: kiểm tra từng mục

| Mục | Kết quả |
|---|---|
| `tsc` | 0 lỗi ✅. Lưu ý: `noUnusedLocals:false`, `noUnusedParameters:false`, nên code chết như `xpToLevel` không bị phát hiện |
| Unit test | 377/377 ✅. Có test cho mọi thư mục `core/*` và mọi game. **Không có test** cho `features/*` và `design/components/*` (trừ ChartRenderer) |
| CI (`deploy.yml`) | ❌ Chỉ build và deploy. Không test, không validate, không e2e, không chạy trên PR (P1-8) |
| Playwright | `channel:'chrome'`, 1 worker, 6 test smoke + screenshot 3 viewport. Thiếu a11y, motion, perf, bàn phím, theme sáng (P2-21) |
| PWA | Icon sai (P1-9). Không cache data/audio. Precache 3 MB toàn rác legacy và font. `maximumFileSizeToCacheInBytes: 5 MB` hợp lý nhưng không có tác dụng vì JSON không nằm trong glob |
| `index.html` | `lang="vi"` ✅, viewport ✅, `data-theme="dark"` mặc định ✅. Thiếu description. Manifest sinh ra `lang:"en"` ❌ |
| Bảo mật | 0 sink nguy hiểm ✅. Không có CSP (GitHub Pages không đặt header, có thể thêm `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'">`; cần kiểm Web Speech và Claude link trước khi bật). Dữ liệu người dùng: IndexedDB (Dexie `LexiconV3DB`), localStorage chỉ legacy đọc để migrate. Import JSON: backup dùng zod nhưng `z.any()` (P2-20). Kết quả chấm dùng zod đầy đủ ✅ |
| Legacy có bundle không | JS legacy **lazy** (chunk `App-*.js`, 200 KB) ✅. **CSS legacy vào bundle chính** ❌ (P1-6). PNG legacy vào precache ❌ |
| Git | `dist`, `tsbuildinfo`, `node_modules`, `_downloads` không track ✅. `.bat` ×2 tracked, `.lnk` untracked nhưng chưa ignore, screenshot 6,3 MB tracked (P3-4). `.git` nặng 37 MB (audio 601 file và data được track, đúng chủ đích) |
| node_modules | **Trống lúc bắt đầu audit**. Sau `npm ci` (coordinator chạy) có 327 package, mọi lệnh chạy được |
| Hard-code màu | 13 hex trong 5 file, chủ yếu `'#0B0F1A'` làm chữ trên nút đang chọn (W1 ×6, R2 ×4, Portfolio ×1). Thay bằng `var(--color-on-accent)` (P1-5). Không có `rgb(` ngoài token |

---

## 7. Lộ trình sửa đề xuất (theo thứ tự)

1. **Ngày 1 (P0, P1 nhanh):** P0-1 Esc. P1-1 shell streak/XP. P1-2 ngày địa phương. P1-6 tách CSS legacy. P1-9 icon PWA và `lang`. P1-8 thêm job verify vào CI.
2. **Ngày 2:** P1-3 vòng Today → Game → Recap → Today. P1-4 level/mode thật. P1-11 xử lý lỗi DB. P1-10 `persist()` và giữ ghi âm khi restore.
3. **Ngày 3:** P1-5 bảng màu theme sáng và `--color-on-accent`. P2-14 faint/border. P1-12 reduced-motion toàn cục. P2-9 vùng chạm 44 px. P2-10 hover/active.
4. **Ngày 4:** P1-7 lazy route và manualChunks. P1-9 runtimeCaching data/audio. Font theo subset.
5. **M6 polish:** P2-3 badge/level, P2-6 và P2-7 ăn mừng, P2-8 Recap động, P2-5 nhắc học, P2-21 thêm 3 spec E2E còn thiếu.

**Cổng đo cuối (đề xuất đưa vào `13-QA`):** entry JS ≤ 250 KB gzip · CSS ≤ 130 KB raw · precache ≤ 1,5 MB · axe 0 serious/critical ở 2 theme · mọi `button` ≥ 44 px ở 360 px · reduced-motion spec pass · CI chặn deploy khi test đỏ · offline mở V1 được.
