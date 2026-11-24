# BAO-CAO T2-B · L1 Trap Detector, L2 Dictation Ladder, chấm đáp án Listening, trình phát audio

Nhánh: `audit-max/T2-B` · Worktree: `D:\English-wt\T2-B` · Ngày hoàn thiện: 25/11/2026.

## 1. Phân chia phần agent trước vs phần làm tiếp

- **Phần agent trước (đã commit trước khi bàn giao):**
  - `6258ba6`: lập kế hoạch `docs/audit-max/KE-HOACH-T2-B.md`.
  - `20ba737`: chuẩn hoá đáp án Listening (số điện thoại, giờ, tiền, `nine thirty`, `second floor` — `L1-02..L1-06`), 30 test chuẩn hoá + test quét 381 đáp án dataset; `TrackPlayerController` tắt mô phỏng mặc định, phân biệt `NotAllowedError` (autoplay) với thiếu file, dùng lại element `preload()` (`X-05`); `sfx.ts` dựng lại `Howl` khi manifest khác (`X-04`).
  - Để lại 2 file chưa commit: `src/core/audio/audioAvailability.{ts,test.ts}`.
- **Phần làm tiếp (nhánh hiện tại, nối từ `ba9f2ad` đến cuối):**
  - Merge `master` (`f1ef649`) lấy đủ hồ sơ `docs/audit-max/antigravity/`.
  - `ba9f2ad`: hoàn thiện & commit `audioAvailability.{ts,test.ts}`, sửa chip `↵` 11 px → 12 px + gắn `<label htmlFor>` trong `AnswerInput.tsx` (`FX-1`, `L1-19`), bổ sung độ tin cậy audio Safari iOS (`navigator.audioSession.type = 'playback'`, `canplaythrough`, `unlock()`, tự `resume()` `AudioContext` khi `visibilitychange`/`pageshow`/`touchend` — `TU-03`).
  - `dfedff4`: hoàn thiện L1 (`listeningLoader.ts`, `engine.ts`, `L1TrapDetector.tsx`, `index.ts`, `TrackPlayer.tsx`) — lọc episode theo file MP3 tồn tại thật qua HEAD (`L1-01`), bỏ hoàn toàn kịch bản mô phỏng trong pha nghe/Exam (`SR-23`), 0 `bandEvidence` & 0 thẻ FSRS khi thiếu audio/mô phỏng (`SR-22`, `SR-89`), retry chỉ câu sai 0 XP 0 band kèm phát đúng đoạn clip (`L1-08`), lưu `l1.examDoneEpisodeIds` trong `kv` để Exam lần 2 0 band + modal xác nhận thoát Exam (`L1-09`), chặn bắt đầu Exam khi chưa `ready` + banner `autoplayBlocked` (`L1-10`), `promptUnit` từ template (`L1-05`), `allowSeek` lv ≥ 7 (`L1-13`), nhãn bẫy tiếng Việt trong câu thắng (`L1-15`), bỏ side-effect trong React state updater (`L1-17`), producer `userItemRepo.upsertWithCard` cho `ltrap:*` kèm `audioClip {src,start,end}` (`B6`, `PP-11`), `attemptRepo.saveProgress` + `registerProgressSaver` (`TU-02`, `F1`), bỏ static fixture `l1_fixtures` khỏi bundle (`X6`), bỏ dynamic import trùng trong `index.ts` (`X5`).
  - `e389254`: hoàn thiện L2 (`dictationLoader.ts`, `engine.ts`, `L2DictationLadder.tsx`, `index.ts`) và `MapView.tsx` — lọc câu theo file MP3 thật qua HEAD (`L2-01`), chọn câu có seed theo ngày + số phiên + tránh lặp 7 ngày + ưu tiên thẻ `dict_full` đến hạn (`L2-02`), chuẩn hoá `10,000-word` và `a.m.`/`p.m.` (`L2-04`), tích luỹ lỗi chính tả qua phiên trong `kv` (`L2-08`), bỏ side-effect trong updater + mở chặn SFX sau `pause()` (`L2-09`), retry câu sai 0 XP (`L2-12`), producer `userItemRepo.upsertWithCard` cho `dict:*` kèm `audioClip` (`B6`, `PP-11`), `attemptRepo.saveProgress` + `registerProgressSaver` (`TU-02`), bỏ `l2_fixtures` khỏi bundle (`X6`), bỏ dynamic import trùng (`X5`), bỏ nút `hotkey="Enter"` 11 px (`D4`), sửa nút zoom/badge trong `MapView.tsx` (≥ 44 px, ≥ 12 px, `scale ≤ 1.12`).
  - `e95b43a`: mở rộng `e2e/m3.spec.ts` gồm kiểm lọc MP3 thật, E2E chéo L1 sai bẫy Q4 → kiểm `userItems` + `cards` trong IndexedDB → sang V1 phát đúng đoạn `audioClip` `[89.37, 95.36]` của `p1_001.mp3`, và kiểm Exam/modal thoát.
  - `55c7458`: nâng nút chạm trong L1/L2 lên ≥ 44 px (`D3`) và thêm biểu tượng tai nghe/loa sẵn sàng nghe tôn trọng `prefers-reduced-motion` (`J8`, `J9`); lưu bộ ảnh `docs/audit-max/anh-sau/T2-B/`.

## 2. Trạng thái mã lỗi

| Mã | Trạng thái | Bằng chứng / Ghi chú |
|---|---|---|
| FX-1 | ✅ | Chip `↵` trong `AnswerInput.tsx` đổi sang 12 px (`text-xs`), 0 lỗi D4 ở `audit-ui` |
| L1-01 | ✅ | `loadListeningCatalog` lọc HEAD MP3 thật (4/32 bài hiện có MP3); bỏ hẳn kịch bản mô phỏng; 0 band / 0 SRS khi thiếu audio (`engine.test.ts`, `e2e/m3.spec.ts`) |
| L1-02..06 | ✅ | Chuẩn hoá số điện thoại, giờ, tiền (`promptUnit`), `nine thirty`, `second floor`; 30 test chuẩn hoá + 381/381 đáp án dataset 0 tự trượt |
| L1-08 | ✅ | `createL1RetrySession` chỉ ôn câu sai, 0 XP kể cả gắn nhãn bẫy, 0 band, nút phát đoạn clip từng câu (`engine.test.ts`) |
| L1-09 | ✅ | Lưu `l1.examDoneEpisodeIds` trong `kv`, Exam lần 2 0 band + nhãn "Đã làm Exam", modal xác nhận thoát giữa Exam (`engine.test.ts`, `e2e/m3.spec.ts`) |
| L1-10 | ✅ | `NotAllowedError` giữ `ready` + `autoplayBlocked` + nút "Bấm để phát"; Exam chặn bắt đầu khi chưa `ready` (`trackPlayer.test.ts`) |
| L1-11, L1-12, L1-13, L1-15, L1-17, L1-19, L1-21, L1-22 | ✅ | Báo lỗi tải bài không fallback sai bài; phân loại `wrong_content` chặt; `allowSeek=false` ở lv ≥ 7; nhãn bẫy tiếng Việt; bỏ side-effect trong updater; `aria-label` + `htmlFor`; chỉ tạo `ltrap` khi `trap:*`; pill Debrief theo tỷ lệ ≥ 80% |
| L2-01 | ✅ | `loadDictationPool` lọc HEAD MP3 thật (60/300 câu hiện có MP3), bỏ chế độ mô phỏng im lặng (`engine.test.ts`) |
| L2-02 | ✅ | `selectL2SessionItems` dùng seed theo ngày + số phiên, tránh lặp 7 ngày, ưu tiên thẻ `dict_full` đến hạn (`engine.test.ts`) |
| L2-04, L2-08, L2-09, L2-12 | ✅ | Chuẩn hoá `10,000-word` & `a.m.`/`p.m.`; `l2.spellingMiss` qua nhiều phiên; bỏ side-effect trong updater + mở SFX sau `pause()`; retry 0 XP (`engine.test.ts`) |
| TU-02 / F1 | ✅ | `attemptRepo.saveProgress` + `attemptRepo.finalize` + `registerProgressSaver` ở cả L1 và L2 |
| TU-03 | ✅ | `ensurePlaybackAudioSession()` (`audioSession.type='playback'`), `canplaythrough`, `unlock()`, tự `resume()` `AudioContext` khi quay lại foreground (`sfx.test.ts`, `trackPlayer.test.ts`) |
| PP-11 / B6 / X-01 | ✅ | Producer `userItemRepo.upsertWithCard` cho `ltrap:*` (kèm `audioClip {src,start,end}`, `|` giữa đáp án) và `dict:*`; E2E chéo L1 → V1 xanh |
| X-04, X-05 | ✅ | SFX dựng lại `Howl` sau manifest; `load()` tái sử dụng `preload()` (`sfx.test.ts`, `trackPlayer.test.ts`) |
| X5, X6 | ✅ | 0 cảnh báo Rollup dynamic import ở `l1`/`l2`; 0 xuất hiện `l1_fixtures`/`l2_fixtures` trong `dist/assets/*.js` |
| L1-07, L1-14, L1-16, L1-18, L1-20 | ⏳ | Thuộc đợt juice/refactor sau (`T4-B`); không thuộc P0/P1 bắt buộc của T2-B |
| L2-03, L2-05, L2-06, L2-07, L2-10, L2-11 | ⏳ | Dữ liệu L2 level 7–10 và mốc `focus` start/end thuộc `T3-B`; juice/combo thuộc `T4-B` |

## 3. File đã tạo / sửa (toàn bộ nằm trong danh sách độc quyền T2-B)

- `src/core/audio/audioAvailability.ts`, `src/core/audio/audioAvailability.test.ts`
- `src/core/audio/trackPlayer.ts`, `src/core/audio/trackPlayer.test.ts`
- `src/core/audio/sfx.ts`, `src/core/audio/sfx.test.ts`
- `src/core/scoring/listeningAnswer.ts`, `src/core/scoring/listeningAnswer.normalize.test.ts`, `src/core/scoring/listeningAnswer.dataset.test.ts`
- `src/design/components/AnswerInput.tsx`, `src/design/components/TrackPlayer.tsx`, `src/design/components/MapView.tsx`
- `src/games/l1-trap-detector/listeningLoader.ts`, `engine.ts`, `engine.test.ts`, `L1TrapDetector.tsx`, `index.ts`
- `src/games/l2-dictation-ladder/dictationLoader.ts`, `engine.ts`, `engine.test.ts`, `L2DictationLadder.tsx`, `index.ts`
- `e2e/m3.spec.ts`
- `docs/audit-max/KE-HOACH-T2-B.md`, `docs/audit-max/BAO-CAO-T2-B.md`, `docs/audit-max/anh-sau/T2-B/**`

## 4. Kết quả lệnh kiểm (số đo thật trên mã cuối)

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit -p .` | Exit 0 (0 lỗi) |
| `npx vitest run src/core/scoring src/core/audio src/games/l1-trap-detector src/games/l2-dictation-ladder` | Exit 0 · 10/10 file, **185/185** test đạt |
| Quét 381 đáp án trong `public/data/listening/episodes/*.json` (`listeningAnswer.dataset.test.ts`) | Exit 0 · **381/381** đáp án đúng (0 tự trượt) · 30 test chuẩn hoá L1-02..06 |
| `npm test` | Exit 0 · 47/47 file, **534/534** test đạt |
| `npm run validate:data` | Exit 0 (PASS dev; 6 ghi chú audio/blind-solve của T3-B giữ nguyên) |
| `PW_PORT=5232 PW_CHANNEL=chrome npx playwright test e2e/m3.spec.ts --project=chromium` | Exit 0 · **3/3** test đạt (0 `console.error`), gồm E2E chéo L1 → V1 phát `p1_001.mp3` ở mốc `89.37s` |
| `npx vite build && node scripts/qa/size-budget.mjs` | Exit 0 · JS khởi động `148.4 KB` gzip (≤ 250), CSS `124.99 KB` (≤ 130), chunk L1 `22.51 KB` / L2 `15.04 KB` gzip (≤ 120), precache `1452.2 KiB` (≤ 1500), 0 cảnh báo Rollup L1/L2, `l1_fixtures`/`l2_fixtures` trong `dist/assets/*.js` = **0** |

## 5. Số đo `audit-ui` trước → sau (`play/l1`, `play/l2`)

Lệnh: `BASE_URL=http://127.0.0.1:5222 node docs/audit-max/cong-cu/audit-ui.mjs --route play/l1,play/l2 --vp 390x844,375x667,820x1180,1280x800 --theme dark,light --out docs/audit-max/anh-sau/T2-B`

- **Trước lượt sửa UI cuối (sau sửa logic):** `0 CHẶN · 38 NẶNG · 0 NHẸ` (`D3: 26`, `J9: 12` — các nút `size="sm"` cao 36 px và chấm trạng thái 10 px nhỏ hơn ngưỡng 16 px).
- **Sau lượt sửa UI cuối:** **`0 CHẶN · 0 NẶNG · 0 NHẸ`** trên toàn bộ **16/16 lượt** (4 khung × 2 theme × 2 route):

| Khung | Theme | Route | CHẶN | NẶNG | Tràn ngang | Chạm < 44 | Chữ < 12 | Control gốc (D10) |
|---|---|---|---:|---:|---:|---:|---:|---:|
| 390×844 | dark | play/l1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 390×844 | dark | play/l2 | 0 | 0 | 0 | 0 | 0 | 0 |
| 390×844 | light | play/l1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 390×844 | light | play/l2 | 0 | 0 | 0 | 0 | 0 | 0 |
| 375×667 | dark | play/l1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 375×667 | dark | play/l2 | 0 | 0 | 0 | 0 | 0 | 0 |
| 375×667 | light | play/l1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 375×667 | light | play/l2 | 0 | 0 | 0 | 0 | 0 | 0 |
| 820×1180 | dark/light | play/l1, play/l2 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1280×800 | dark/light | play/l1, play/l2 | 0 | 0 | 0 | 0 | 0 | 0 |

- Kiểm `--reduced 1` (`prefers-reduced-motion: reduce`, 390×844 dark): **0 CHẶN** (chuyển động dừng khi bật reduced-motion — xác nhận `J8`).
- Thư mục ảnh sau: `D:\English-wt\T2-B\docs\audit-max\anh-sau\T2-B\`.

## 6. Chức năng cũ giữ nguyên (đối chiếu `KE-HOACH-T2-B.md`)

- **L1 chọn bài:** Quay lại · Training/Exam (tính band) · thanh Cấp độ 1–10 · lọc Tất cả/Part 1–4 · thẻ bài (tiêu đề, độ khó, số câu, thời lượng, giọng, thêm badge Đã làm Exam) · Bắt đầu.
- **L1 pha đọc trước / nghe / soát / Debrief / Recap:** đếm ngược 30 s, chip đoán loại đáp án, form/note/table/MCQ 1/MCQ chọn 2/bản đồ SVG, TrackPlayer đầy đủ điều khiển (Exam khoá), QuestionNav + cờ, Nộp bài có xác nhận, 30 s soát Exam + tự nộp, cảnh báo chuyển tab Exam, sóng âm xanh/đỏ bấm được, lọc Chỉ câu sai/Tất cả, Nghe đoạn đáp án/bẫy, transcript bấm dòng, tự gắn nhãn bẫy (+5 XP trừ retry), Recap + Ôn lại câu sai + Về Hôm nay.
- **L2 intro / phiên / Recap:** Thoát, thang 10 bậc chọn level, 3 thẻ thông số, Bắt đầu phiên, Phát (R), Phát chậm 0.75×, ô gõ Enter, bảng chấm diff từng từ + nhãn lỗi + Điểm nghe khó, 0.75× đoạn này, Câu tiếp theo (Enter), thống kê 5 loại lỗi, banner lên bậc + Lên Level N + Chơi ngay Level N + Ôn lại câu sai + Về Hôm nay.

## 7. Quyết định

- **2026-11-25 · r-t2-b:** Giữ `export default` trong `src/games/{l1-trap-detector,l2-dictation-ladder}/index.ts` và đổi `L1_GAME_DEFINITION.load` / `L2_GAME_DEFINITION.load` sang `Promise.resolve({ default })` thay vì bỏ `export default`, vì `src/games/registry.ts` (ngoài phạm vi T2-B) dynamic-import trực tiếp `./l1-trap-detector` và `./l2-dictation-ladder`. Cách này giữ `tsc` 0 lỗi, vẫn tách chunk lazy riêng cho L1/L2 và hết hoàn toàn cảnh báo Rollup (X5).
- **2026-11-25 · r-t2-b:** Đưa E2E chéo L1 → V1 và kiểm Exam/retry vào ngay `e2e/m3.spec.ts` (file độc quyền của T2-B) và xuất ảnh chụp E2E vào `test-results/m3/` thay vì `e2e/screenshots/m3/` để tuân thủ SR-01 và SR-07.
- **2026-11-25 · r-t2-b:** Trong `AnswerInput.tsx`, render trực tiếp `<kbd>` cỡ 12 px (`text-xs`) thay vì dùng `<KeyHint>` (11 px, thuộc `T3-A`) để đóng `FX-1` mà không sửa file ngoài quyền.

## 8. Chỗ chưa chắc

- Chưa chạy thử trên máy iPhone Safari vật lý (chỉ kiểm qua unit test `navigator.audioSession`/`AudioContext.resume` và Playwright Chromium ở khung 390×844, 375×667); cần kiểm thực tế trên iPhone khi Bang nghiệm thu mốc.
- Khi T3-B render thêm 28/32 MP3 L1 và 240/300 MP3 L2, `loadListeningCatalog`/`loadDictationPool` sẽ tự nhận qua HEAD check mà không cần sửa code; tuy nhiên với 300 câu L2, nếu host giới hạn tốc độ HEAD đồng thời thì có thể cần giới hạn concurrency theo lô nhỏ.
