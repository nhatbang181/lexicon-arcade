# BÁO CÁO T2-C · W1 Essay Lab, W2 Writing Sprints, Hệ chấm Claude, Portfolio

- **Nhánh / worktree:** `audit-max/T2-C` (`D:\English-wt\T2-C`)
- **Phạm vi file độc quyền:** `src/games/w1-essay-lab/**`, `src/games/w2-writing-sprints/**`, `src/games/_shared/GradingPanel.tsx`, `src/games/_shared/ChartRenderer.tsx`, `src/core/grading/**`, `src/core/storage/repos/essayRepo.ts`, `src/features/portfolio/**`, `src/test/fixtures/grading/**`, `e2e/m4.spec.ts`, `docs/audit-max/KE-HOACH-T2-C.md`, `docs/audit-max/BAO-CAO-T2-C.md`, `docs/audit-max/anh-sau/T2-C/**`, `docs/audit-max/HANDOFF.md`.

## 1. Phân tách phần agent trước vs phần làm tiếp

### Phần agent trước (`7f41297`, `fd9a30c` + 3 file sửa dở ở `w1-essay-lab/`)
- Ghi `docs/audit-max/KE-HOACH-T2-C.md` (SR-80).
- `src/core/grading/postcheck.ts` + `postcheck.test.ts`: chặn lệch `attemptId` (`blocking: true`, G-01), cảnh báo và chặn band evidence khi ẩn > 50% trích dẫn (G-02), đếm nhận xét cụ thể (`specificFeedbackCount >= 3`, PP-16 / SR-89), `allowBandEvidence`.
- `src/core/storage/repos/essayRepo.ts`: thêm `saveDraft`, `loadDraft`, `clearDraft`, `saveMeta`, `getMeta` (W1-01, W1-06).
- `src/games/_shared/ChartRenderer.tsx`: bổ sung `<desc>` và bảng dữ liệu thay thế cho trình đọc màn hình (G-04).
- `src/games/_shared/GradingPanel.tsx`: gộp "Copy gói & Mở Claude", tự phân tích khi dán, nhãn "ước lượng" (PP-16), ẩn nút mẫu ngoài DEV (W1-04), chống bấm lưu lặp (W1-05), giảm ma sát ≤ 6 thao tác (§4.5).
- Khởi tạo dở dang 3 file `w1-essay-lab/` (còn 5 lỗi TS và 1 test XP Exam đỏ).

### Phần làm tiếp (`r-t2-c-2`)
- **W1 (`src/games/w1-essay-lab/`):** sửa 5 lỗi TS, sửa lỗi autosave bị reset bởi đồng hồ 1s (`elapsedSecRef`), thêm banner khôi phục nháp + nút xoá nháp (W1-01), modal xác nhận "Bỏ bài đang viết?" (W1-02), tự nộp khi hết giờ Exam + `playSfx('timeup', { examMode: true })` + xử lý bài ngắn < 50 từ (W1-03), Exam = 0 XP & retry = 0 XP (SR-24, PP-C5), nạp mẫu Claude động chỉ khi `import.meta.env.DEV` (W1-04, SR-73), ghi `bandRepo` chỉ ở lần chấm đầu bản v1 không paste/không retry và `allowBandEvidence` (W1-05, PP-16 / SR-89), truyền `WritingCapOptions` vào `compareRevisionBands` (G-03), tự động và thủ công ghi `userItemRepo.upsertWithCard` cho lỗi Writing `err:user_*`/`col:user_*` (W1-07, W1-08, PP-11), `attemptRepo.saveProgress`/`finalize` + `registerProgressSaver` + `pagehide` (TU-02, F1), sửa Rollup warning `w1-essay-lab/index.ts` (X5), sửa D3/D7/D10/contrast token ở W1.
- **W2 (`src/games/w2-writing-sprints/`):** lưu cập nhật kết quả Claude sau Recap vào IndexedDB qua `attemptRepo.finalize` (W2-01), chọn đề có `seededShuffle` + loại đề đã làm trong 14 ngày (W2-02), chỉ chạy đồng hồ sau khi tải xong biểu đồ (W2-03), khoá checklist tự chấm trước khi mở Overview/Idea mẫu Band 8 (W2-04, PP-03), ghi `userItemRepo.upsertWithCard` cho cụm `err:w2_*` (W2-06, PP-11), ghi lượt 0★ khi hết giờ Cliché/Upgrade (W2-07), phím tắt `Ctrl/Cmd+Enter` nộp bài (W2-08), `attemptRepo.saveProgress` + `registerProgressSaver` (TU-02, F1), retry 0 XP (PP-C5), `sampleResponse` chỉ khi `DEV`, sửa nút quay lại ≥ 44px (D3).
- **Portfolio (`src/features/portfolio/PortfolioScreen.tsx`):** thêm modal xác nhận trước khi xoá bài (W1-02), mở lại `GradingPanel` ngay trong Portfolio cho bài `Chờ chấm` với đúng `attemptId` gốc (W1-06) + ghi `userItemRepo.upsertWithCard` (PP-11), thêm nhãn "Ước lượng Claude" (PP-16), bỏ chữ nội bộ `(docs/07 §6)`, bỏ màu hex `#0B0F1A`, nâng vùng chạm ≥ 44px và chữ ≥ 12px (SR-41).
- **Test & E2E (`engine.test.ts`, `e2e/m4.spec.ts`):** thêm unit test cho W1 XP Exam/retry, G-03 capOptions, W2-02 seeded selection; chuyển ảnh E2E sang `test-results/m4/`, bổ sung E2E kiểm W2-04 khoá mẫu trước khi xác nhận, W1-01 khôi phục nháp sau reload, và đếm thao tác chấm §4.5 (3 thao tác ≤ 6).

## 2. Trạng thái mã công việc

| Mã | Trạng thái | Ghi chú |
|---|---|---|
| W1-01 | ✅ | Autosave thật vào IndexedDB (1,2s debounce, không bị reset bởi tick đồng hồ) + khôi phục nháp sau reload |
| W1-02 | ✅ | Modal xác nhận khi rời bài > 20 từ (W1) và khi xoá bài trong Portfolio |
| W1-03 | ✅ | Exam hết giờ tự nộp (`forced: true`), phát `timeup`, đồng hồ không hiện số âm, 0 XP ở Exam (`SR-24`) |
| W1-04 / SR-73 | ✅ | Nút mẫu chỉ ở DEV; `TASK2_CLAUDE_RESPONSE` trong `dist/assets/*.js` = 0 |
| W1-05 / G-01 / G-02 | ✅ | Chặn lệch `attemptId` (`blocking: true`), ẩn > 50% quote không ghi band, chỉ ghi band lần chấm đầu bản v1 |
| W1-06 | ✅ | Lưu `attemptId/pasted/mode/durationSec` vào `essayRepo` meta; Portfolio mở lại `GradingPanel` đúng `attemptId` |
| W1-07 / W1-08 / PP-11 | ✅ | Producer `userItemRepo.upsertWithCard` cho `err:user_*`, `col:user_*`, `err:w2_*` đủ `front/back/noteVi` |
| G-03 / G-04 | ✅ | `compareRevisionBands` nhận `WritingCapOptions`; `ChartRenderer` có `<desc>` và chế độ bảng |
| PP-16 / SR-89 | ✅ | Nhãn "ước lượng", kiểm ≥ 3 nhận xét cụ thể, chỉ lần chấm đầu tính band |
| §4.5 (≤ 6 thao tác) | ✅ | Đo bằng E2E `e2e/m4.spec.ts`: 3 thao tác từ nộp bài → báo cáo chấm |
| W2-01..W2-04, W2-06..W2-08 | ✅ | Lưu kết quả Claude sau Recap, chọn đề có seed + loại 14 ngày, chờ tải chart mới đếm giờ, khoá tự chấm trước mẫu, `userItems`, timeout 0★, Ctrl+Enter |
| TU-02 / F1 / X5 | ✅ | `attemptRepo.saveProgress` + `registerProgressSaver` + `pagehide` cho W1 & W2; 0 cảnh báo Rollup W1/W2 |
| W1-09..15, W2-05/09/10 | ⏳ | Tách file/animation Δ/combo thuộc phạm vi Đợt 4 (`T4-C`) |

## 3. Kết quả lệnh kiểm (số thật)

| Lệnh kiểm | Kết quả |
|---|---|
| `npx tsc --noEmit -p .` | Exit 0 (0 lỗi) |
| `npx vitest run src/core/grading src/games/w1-essay-lab src/games/w2-writing-sprints` | 6/6 file pass, 79/79 test pass (9+20+7+9+16+18) |
| `npm test` | 47/47 file pass, 538/538 test pass (28.09s) |
| `npm run validate:data` | Exit 0 (PASS dev; 6 cổng audio/blind-solve hoãn cho T3-B) |
| `PW_PORT=5233 PW_CHANNEL=chrome npx playwright test e2e/m4.spec.ts --project=chromium` | 2/2 test pass (38.3s), 0 console/page/network error, thao tác chấm = 3 ≤ 6 |
| `npx vite build` | Exit 0 (26.11s), 0 cảnh báo Rollup cho `w1-essay-lab` và `w2-writing-sprints` |
| `node scripts/qa/size-budget.mjs` | 0 chỉ số vượt, 0 chuỗi rò bị chặn (JS `#/` 148.27 KB/250, CSS 125.13 KB/130, lazy max 50.64 KB/120, precache 1495.19 KiB/1500) |
| Grep `TASK2_CLAUDE_RESPONSE` trong `dist/assets/*.js` | **0** |

## 4. Số đo `audit-ui.mjs` (trước → sau)

Lệnh: `BASE_URL=http://localhost:5223 node docs/audit-max/cong-cu/audit-ui.mjs --route play/w1,play/w2,portfolio --vp 390x844,375x667,820x1180,1280x800 --theme dark,light --out docs/audit-max/anh-sau/T2-C`

- **Trước sửa UI:** `0 CHẶN · 151 NẶNG · 0 NHẸ` (`D3:64  M5:26  J9:16  M1:8  M2:8  M3:8  M4:8  D7:7  D10:6`)
- **Sau sửa UI:** `0 CHẶN · 79 NẶNG · 0 NHẸ` (`M5:26  J9:15  M1:8  M2:8  M3:8  M4:8  D10:6` — **0 D3, 0 D4, 0 D5, 0 D7**)

| Route | 390x844 (dark/light) | 375x667 (dark/light) | 820x1180 (dark/light) | 1280x800 (dark/light) | Ghi chú lỗi NẶNG còn lại |
|---|---|---|---|---|---|
| `play/w1` | 0 CHẶN · 2/2 NẶNG | 0 CHẶN · 1/1 NẶNG | 0 CHẶN · 2/2 NẶNG | 0 CHẶN · 2/2 NẶNG | `J9` (chuyển động nghỉ Đợt 4) + `D10` ở `<select>` lọc chủ đề |
| `play/w2` | 0 CHẶN · 0/1 NẶNG | 0 CHẶN · 1/1 NẶNG | 0 CHẶN · 1/1 NẶNG | 0 CHẶN · 1/1 NẶNG | Chỉ `J9` (chuyển động nghỉ Đợt 4) |
| `portfolio` | 0 CHẶN · 5/5 NẶNG | 0 CHẶN · 4/4 NẶNG | 0 CHẶN · 10/10 NẶNG | 0 CHẶN · 10/10 NẶNG | Chỉ `M1..M5` (mật độ hình/mascot khung thuộc Đợt 3 T3-A/T3-C) |

Thư mục ảnh: `docs/audit-max/anh-sau/T2-C/` (đã mở xem toàn bộ ảnh `*-loi.png` ở 390 và 375).

## 5. Chức năng giữ nguyên (SR-80, SR-90)
- Giữ đủ mọi nút và luồng liệt kê trong `docs/audit-max/KE-HOACH-T2-C.md`: W1 (Task 2/Task 1, Training/Exam, bộ lọc/tìm đề, dàn ý, Idea Bank/Key Features, dò Cliché, phát hiện paste, checklist, Band 8 model, sửa bài v2/v3, so sánh Δ, GradingPanel), W2 (5 sprint, HUD, tự chấm, mẫu Band 8 + lưu SRS, Recap + Claude gộp), Portfolio (4 KPI, biểu đồ tiến bộ, hiệu chỉnh `biasOffset`, 5 bộ lọc, nhập/sửa điểm thật, xem bài, chấm lại bài chờ chấm, xoá bài có xác nhận).

## 6. Quyết định
- **Cập nhật kết quả Claude sau Recap W2 (`W2-01`):** dùng `attemptRepo.finalize(savedAttemptId, { attempt })` thay vì sửa `attemptRepo.ts` (ngoài phạm vi độc quyền T2-C) vì `writeProgress` trong `attemptRepo.ts` cập nhật bản ghi theo ID và chỉ cộng phần chênh `xpDelta`.
- **Không giả animation (`J9`) và không gắn asset giả (`M1..M5`):** tuân thủ `SR-12`; các mục này thuộc Đợt 3 (`T3-A`/`T3-C`) và Đợt 4 (`T4-C`).
- **Tắt server:** đã tắt Vite trên port `5223` và không để process Playwright/Vite nào chạy nền.
