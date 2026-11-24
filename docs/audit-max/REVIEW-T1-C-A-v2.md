# REVIEW T1-C (Vòng 1) – Reviewer A v2 – model Gemini 4 Argon Medium (rv-t1-c-2)

Nhánh `audit-max/T1-C` @ `341ca75`, worktree `D:\English-wt\T1-C`. Kiểm độc lập toàn bộ 14 lỗi của `REVIEW-T1-C-A.md` (1 CHẶN, 5 NẶNG, 8 NHẸ) trong diff `f108358..341ca75`. Mọi số liệu dưới đây do reviewer tự chạy ngày 24/11/2026.

## 1. Kiểm tra chống gian lận & phạm vi file
- `git diff --stat f108358..HEAD`: 60 file thay đổi (17 file code/test/doc sửa + 1 file test mới `scripts/validate/audio_meta.test.mjs` + 42 PNG trong `e2e/screenshots/**` được gỡ khỏi git index).
- Toàn bộ file sửa nằm trong quyền của T1-C. Không đụng `docs/audit-max/cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, `src/legacy/**`.
- `git ls-files e2e/screenshots` = **0** file. Sau khi chạy `screenshots.spec.ts`, `git status --short` hoàn toàn sạch (0 PNG mới/sửa).
- Không có `test.skip` hay `test.only` mới; `test.fixme` chỉ nằm ở `e2e/juice.spec.ts` (được phép tới đợt 4).

## 2. Kết quả tự chạy lại các cổng trọng tâm

| Lệnh | Kết quả tự chạy |
|---|---|
| `npx tsc --noEmit -p .` | exit 0, **0 lỗi** |
| `npm test` | exit 0, **43 file, 470/470 pass** (10,63 s ≤ 12 s, X17 đạt; có `scripts/validate/audio_meta.test.mjs` 5/5 pass) |
| `npm run validate:data` | exit 0, PASS (dev), báo đúng **6 cổng bị hoãn** (`INV-V4`, `INV-R8`, `INV-L5`, `INV-L7`, `INV-D1`, `INV-S4`) |
| `npm run validate:data:release` | exit 1, **2 835 lỗi** có mã đầy đủ: `INV-V4=1670 · INV-S4=841 · INV-D1=240 · INV-L7=32 · INV-L5=28 · INV-R8=24` |
| `npm run build` | exit 0 (16,70 s), precache **132 mục (1 443,86 KiB ≤ 1 500 KiB)**; số lần xuất hiện `LAZY_CHUNK_URL` trong `dist/sw.js` = **0** |
| `node scripts/qa/size-budget.mjs` | exit 0: JS `#/` **145,13 KB gzip** (≤ 250) · CSS chính **123,53 KB** (≤ 130) · chunk lazy lớn nhất `legacyEntry` **49,75 KB gzip** (≤ 120) · precache **1 444,4 KiB** (≤ 1 500) · 0 chuỗi rò bị chặn, 1 rò chờ (`r1_fixtures`) |
| `PW_PORT=5216 PW_CHANNEL=chrome npx playwright test e2e/offline.spec.ts e2e/screenshots.spec.ts e2e/perf.spec.ts e2e/motion.spec.ts --project=chromium` | exit 0: **18/18 pass** (1,7 phút): `motion` 5/5, `offline` 5/5, `perf` 3/3, `screenshots` 5/5 |
| `node scripts/qa/contrast.mjs` | exit 1: **144 cặp, 62 dưới ngưỡng WCAG** (dark 7, light 37, exam 18 — đã tính cả 9 cặp `--color-border` < 3:1) |
| `node scripts/qa/hardcoded-colors.mjs` | exit 1: **14 chỗ / 6 file** (quét 169 file; bắt thêm `bg-black/60` ở `Modal.tsx` và `Sheet.tsx`) |

## 3. Đối chiếu 14 lỗi vòng trước (`REVIEW-T1-C-A.md`)

| # | Mức cũ | Mã | Trạng thái | Xác nhận của Reviewer v2 |
|---|---|---|---|---|
| 1 | **CHẶN** | X7 | **ĐÃ SỬA** | `vite.config.ts` đưa regex trực tiếp vào thân hàm `runtimeCaching[0].urlPattern`. `dist/sw.js` còn 0 tham chiếu `LAZY_CHUNK_URL`. Khi offline mở lại `#/play/v1` và `#/play/r1` không còn `ReferenceError` hay `ERR_UI_BOUNDARY`; `caches.keys()` có đủ `lexicon-chunks` và `lexicon-data`. |
| 2 | **NẶNG** | X7 | **ĐÃ SỬA** | `e2e/offline.spec.ts` seed thẻ đến hạn vào `LexiconV3DB`, kiểm `caches.keys()`, tắt mạng (`setOffline(true)`), reload + chờ 3,5 s, kiểm 0 `"Thử lại"` / 0 `"Failed to fetch dynamically imported module"`, rồi gõ trả lời thật **3 thẻ** V1 (`Chính xác!`, `answered.size === 3`) và kiểm thêm R1 offline. |
| 3 | **NẶNG** | X4 | **ĐÃ SỬA** | `LegacyScreen.tsx` bỏ biến đếm `mounted`, kiểm trực tiếp `window.location.hash.startsWith('#/legacy')` kết hợp `MutationObserver` trên `document.head`, `hashchange` và sự kiện `load` trên `<link rel="stylesheet">` của `legacyEntry`. E2E rời `#/legacy` sau 50 ms và 300 ms ở cả dev (`screenshots.spec.ts`) lẫn build (`offline.spec.ts`) đều pass, sau 4 s ở `#/` `imageRendering !== 'pixelated'`. |
| 4 | **NẶNG** | D3 | **ĐÃ SỬA** | `scripts/validate/audio_meta.mjs` đối chiếu số khung và dung lượng byte khai báo trong Xing/Info với frame MPEG thực tế (`walkFrames`, lệch > 10% trả `null`), đồng thời duyệt frame thật cho file CBR. Có 5 unit test trong `audio_meta.test.mjs` (cắt 1/2 listening, cắt 1/4 vocab, nối 6× vocab, Info thiếu trường bytes bị cắt 25%, CBR nối rác cuối) đều pass. |
| 5 | **NẶNG** | D2, Q4 | **ĐÃ SỬA** | `scripts/qa/contrast.mjs` bỏ cờ ẩn tham khảo cho `--color-border`, luôn tính viền vào tổng lỗi theo D2 (144 cặp, 62 dưới ngưỡng). |
| 6 | **NẶNG** | X15, Q1 | **ĐÃ SỬA** | Đã gỡ PNG trong `e2e/screenshots/**` khỏi git index (`git ls-files e2e/screenshots` = 0) và cập nhật đúng số liệu trong `BAO-CAO-T1-C.md`. |
| 7 | NHẸ | P5 | **ĐÃ SỬA** | `e2e/perf.spec.ts` thêm test đo INP khi chọn đáp án 3 thẻ V1 trên bản build (CPU ×4, Fast 4G), tách khỏi event nút "Bắt đầu", ghi annotation `inp-v1-ms` và `slow-frames-v1>32ms`, hỗ trợ `PERF_STRICT=1` đòi ≤ 200 ms. |
| 8 | NHẸ | D2, Q4 | **ĐÃ SỬA** | `e2e/a11y.spec.ts` đổi tên test thành `"không vượt nợ axe (serious/critical)"`, trung thực với cơ chế `KNOWN_DEBT`. |
| 9 | NHẸ | D3 | **ĐÃ SỬA** | `scripts/validate/run_all.mjs` gắn mã `[INV-S4]` và chuỗi `pass --require-audio` cho cảnh báo/lỗi audio speaking; dev báo khớp **6 cổng bị hoãn**, release gom đủ 841 lỗi vào `INV-S4`. |
| 10 | NHẸ | X2 | **ĐÃ SỬA** | `.github/workflows/deploy.yml` đổi `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`, không huỷ deploy đang chạy trên `master`. |
| 11 | NHẸ | X9 | **ĐÃ SỬA** | `src/main.tsx` dùng timestamp cooldown 10 s (`RELOAD_COOLDOWN_MS = 10_000`) trong `sessionStorage` thay vì khóa vĩnh viễn suốt phiên tab. |
| 12 | NHẸ | D1 | **ĐÃ SỬA** | `scripts/qa/hardcoded-colors.mjs` quét cả `ChartRenderer.tsx` (chỉ che khối dữ liệu màu), thêm regex `hsla?(` và class Tailwind màu thô (`bg-/text-/border-`), bắt được 14 chỗ / 6 file. |
| 13 | NHẸ | – | **ĐÃ SỬA** | `scripts/qa/preview-server.mjs` thêm `public/`, `package.json`, `package-lock.json` vào `isStale()`. |
| 14 | NHẸ | J8 | **ĐÃ SỬA** | `e2e/motion.spec.ts` đo cả ở 200 ms và 600 ms, quét `getComputedStyle(el).transform !== 'none'` trên mọi phần tử HTML hiển thị, và bổ sung đối chứng dương cho `transformed`. |

Không phát hiện lỗi CHẶN hay NẶNG mới trong diff `341ca75`.

## 4. Phán quyết: **ĐẠT**
Tất cả 14 lỗi (1 CHẶN, 5 NẶNG, 8 NHẸ) từ vòng review trước đã được xử lý triệt để, có unit test / E2E đối chứng thật và toàn bộ cổng kiểm tra đều xanh. Đủ điều kiện đóng T1-C.
