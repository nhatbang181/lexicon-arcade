# BÁO CÁO T2-A · V2, V3, R1, R2 (nhánh `audit-max/T2-A`)

## 1. Phân chia phần việc
- **Agent trước (`18f648f` + 7 file dở):** tạo `KE-HOACH-T2-A.md`; viết xong engine V2 (`V2-1..V2-10`, `engine.t2a.test.ts`, `progressSaver.ts`, `rng.ts`) và chép `progressSaver.ts`/`rng.ts` sang V3/R1/R2; bắt đầu sửa đầu file `V2CollocationForge.tsx`.
- **Phần hoàn thiện tiếp (`4ca26cd`, `b78c6ab`, `83b3fbe`, `6116672` + commit cuối):**
  - Merge `master` mới nhất (lấy đủ `docs/audit-max/antigravity/`).
  - Hoàn thiện `V2CollocationForge.tsx`, `v2/loader.ts`, `v2/index.ts`: lưu từng lượt (`attemptRepo.saveProgress` + `registerProgressSaver`), producer `userItemRepo.upsertWithCard` cho `err:l1col_*`, retry 0 XP, nhiều bẫy Tôi (`V2-4`), bỏ remount đe (`V2-11`), bỏ side-effect trong updater (`C7`), bỏ header trùng (`U3`), vùng chạm 44px (`D3`), bỏ `KeyHint` 11px (`D4`).
  - Hoàn thiện V3 (`engine.ts`, `V3ParaphraseRadar.tsx`, `loader.ts`, `index.ts`, `engine.t2a.test.ts`): ẩn Level trước khi khoá (`V3-1`), chunk độc lập đáp án (`V3-2`), chọn item có seed + tránh lặp 24h (`V3-3`), sửa `avoidedDecoy` (`V3-4`), `role="listbox"` + phím ←/→/Shift+←/→/Space (`V3-5`), bỏ side-effect trong updater (`V3-6`/`C7`), hệ số combo (`V3-7`), `<Timer>` + tick 10s (`V3-8`), retry 0 XP (`C3`), lưu từng lượt (`TU-02`).
  - Hoàn thiện R1 + dùng chung (`Highlighter.tsx`, `ExamFrame.tsx`, `PassageView.tsx`, `r1/engine.ts`, `r1/R1TfngJudge.tsx`, `r1/readingLoader.ts`, `r1/index.ts`, `r1/engine.t2a.test.ts`): Highlighter pointer + touch + `selectionchange` + bàn phím ↑/↓/Enter (`R1-5`, `S-1`), `ExamFrame` đếm tham chiếu (`S-2`), `selectR1Passage` lọc theo `allowedPassageLevels` + tránh lặp 14 ngày + ưu tiên YNNG ở level ≥ 7 (`R1-1`, `PP-05`), level 8 = 55s (`R1-2`), phím `1/2/3` (`R1-4`), producer `userItemRepo.upsertWithCard` cho `tfng:*` (`G1`), lưu từng lượt + `registerProgressSaver` (`TU-02`), retry 0 XP (`C3`), thay `<select>` bằng nút + `Sheet` (`D3`/`D10`).
  - Hoàn thiện R2 (`r2/engine.ts`, `r2/R2HeadlineEditor.tsx`, `r2/readingLoader.ts`, `r2/index.ts`, `r2/engine.t2a.test.ts`): hết tràn ngang 360/375/390 (`U7`), thay `<select>` bằng nút + `Sheet` (`D10`), `selectR2Passage` tránh lặp 14 ngày (`R2-1`), `bandEvidence` chế độ exam (`R2-3`), SFX nộp cả bài (`R2-4`), reduced-motion cho rung heading (`R2-5`), bỏ hex `#0B0F1A` (`R2-6`), producer `userItemRepo.upsertWithCard` cho `head:*` (`G1`), lưu từng lượt + `registerProgressSaver` (`TU-02`), retry 0 XP (`C3`).
  - Cập nhật `e2e/m1.spec.ts`, `e2e/m2.spec.ts`: xuất ảnh sang `test-results/` thay vì ghi đè `e2e/screenshots/`, thêm test listbox bàn phím + ẩn Level V3, thêm test 0 tràn ngang R2 ở 360px, thêm E2E chéo R1 → V1 `tfng_retry`.

## 2. Bảng mã lỗi
| Mã | Trạng thái | Ghi chú |
|---|---|---|
| V2-1..V2-11, PP-11 (`err:l1col_*`) | ✅ | 33/33 unit test V2 xanh |
| V3-1..V3-8 | ✅ | 18/18 unit test V3 + E2E listbox & ẩn Level xanh |
| R1-1..R1-5, PP-05 (YNNG), `tfng:*`, S-1, S-2 | ✅ | 28/28 unit test R1 + E2E chéo R1 → V1 `tfng_retry` xanh |
| R2-1, R2-3..R2-6, U7, `head:*` | ✅ | 19/19 unit test R2 + 0 tràn ngang 360/375/390 |
| TU-02 (`saveProgress` + `registerProgressSaver`), C3 (retry 0 XP), U3, C7 | ✅ | Đủ 4 game V2, V3, R1, R2 |
| X5 (Rollup warning `index.ts`) | ✅ | 0 cảnh báo Rollup cho `v2`, `v3`, `r1`, `r2` |
| X6 (`r1_fixtures`, `v2v3_fixtures` trong dist) | ⏳ | `r1_fixtures`: 0 file trong `dist/assets/*.js`. `v2v3_fixtures`: 0 trong chunk V2/V3/R1/R2; còn 1 chunk chung vì `src/games/_shared/index.ts` → `vocabLoaders.ts` (ngoài danh sách file độc quyền T2-A, đã ghi `HANDOFF.md`) |
| R1-6 (tách file >800 dòng), R2-2 (lọc distractor theo level), R2-7 (tít bay `layoutId`), J9 (chuyển động nghỉ) | ⏳ | Phạm vi refactor / Đợt 4 juice (T4-A) |

## 3. Kết quả kiểm chứng (số đo thật)
1. `npx tsc --noEmit -p .`: **exit 0** (0 lỗi).
2. `npx vitest run src/games/v2-collocation-forge src/games/v3-paraphrase-radar src/games/r1-tfng-judge src/games/r2-headline-editor`: **9/9 file, 98/98 test pass** (V2: 33, V3: 18, R1: 28, R2: 19).
3. `npm test`: **48/48 file, 506/506 test pass** (30.97s).
4. `npm run validate:data`: **exit 0**.
5. `PW_PORT=5231 PW_CHANNEL=chrome npx playwright test e2e/m1.spec.ts e2e/m2.spec.ts`: **4/4 pass (39.1s)**, 0 `console.error` (gồm full M1, V3 listbox + ẩn Level, R1+R2 + 0 tràn ngang R2 ở 360px, E2E chéo R1 → V1 `tfng_retry`).
6. `npx vite build`: **exit 0** (19.24s, precache 133 entries / 1445.76 KiB).
   - Cảnh báo Rollup cho `v2/v3/r1/r2`: **0**.
   - `r1_fixtures` trong `dist/assets/*.js`: **0 file**.
   - `v2v3_fixtures` trong chunk `v2/v3/r1/r2`: **0 file** (còn ở `index`, `PlacementScreen`, `w1`, `w2` do `_shared/vocabLoaders.ts` ngoài quyền sửa).
7. `audit-ui` (`play/v2,play/v3,play/r1,play/r2` × `390x844,375x667,820x1180,1280x800` × `dark,light` = 32 lượt → `docs/audit-max/anh-sau/T2-A/`):
   - **Trước khi sửa D3/D10:** 0 CHẶN · 69 NẶNG (`D3:34, J9:24, D10:11`) · 0 NHẸ.
   - **Sau khi sửa:** **0 CHẶN · 24 NẶNG (`J9:24`) · 0 NHẸ** (0 `D3`, 0 `D4`, 0 `D5`, 0 `D10`).
   - Theo khung:
     - `390x844` (dark/light): V2 `0/0`, V3 `0/1`, R1 `0/1`, R2 `0/1`
     - `375x667` (dark/light): V2 `0/0`, V3 `0/1`, R1 `0/1`, R2 `0/1`
     - `820x1180` (dark/light): V2 `0/0`, V3 `0/1`, R1 `0/1`, R2 `0/1`
     - `1280x800` (dark/light): V2 `0/0`, V3 `0/1`, R1 `0/1`, R2 `0/1`

## 4. Chức năng giữ nguyên
Toàn bộ danh sách nút/chức năng trong `docs/audit-max/KE-HOACH-T2-A.md` (V2 Nung/Đập/Tôi/Tự viết/Sprint/Đổi lò, V3 click/kéo/bàn phím/N/decoy ①②, R1 Judge/Passage Luyện/Exam 20p/Glossary/cỡ chữ/ma trận 3×3/paraphrase SRS, R2 Từng đoạn/Chấm cuối/bôi ý chính/Kho tít desktop+Sheet/Recap trang báo) được giữ nguyên; chỉ bỏ nút thoát ✕ trùng ở header trong game (dùng nút ✕ của `PlayScreen`).

## 5. Quyết định
- Thay `<select>` chọn bài đọc ở R1 và R2 bằng nút `min-h-[44px]` + `Sheet` để vừa đạt `D3` (44px) vừa hết `D10` (control gốc) và hết `D5` tràn ngang trên 375/390.
- Tách loader cục bộ `loader.ts` (V2/V3) và bỏ import tĩnh `r1_fixtures` (R1/R2) để không kéo fixture vào chunk của 4 game T2-A mà không cần sửa `src/games/_shared/vocabLoaders.ts` (ngoài file độc quyền).
- Giữ `J9` (1 NẶNG/màn ở V3/R1/R2) thay vì thêm animation giả để tuân thủ `SR-12`; phần chuyển động nghỉ sẽ thuộc Đợt 4 (`T4-A`).
