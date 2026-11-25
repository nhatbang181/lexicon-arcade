# REVIEW T2-B – Reviewer A (rv-t2-b) – model gemini-4-argon-high

> **Đợt 2 · Kiểm chéo độc lập:** Builder chạy `gemini-4-neon-high`; Reviewer (`rv-t2-b`) chạy `gemini-4-argon-high` (khác model tác giả).
> Worktree kiểm: `D:\English-wt\T2-B` (nhánh `audit-max/T2-B`, HEAD `b9d2d58`, merge-base với `master`: `f1ef649b50117ccb7a87932f6bd0eda8ab35a10c`).
> Phần chấm mù §0 bỏ qua ở Đợt 2 theo `07-QUY-TRINH-KIEM-CHEO.md` §3–4. Toàn bộ số đo dưới đây do `rv-t2-b` tự chạy lại độc lập trên port riêng (`5227`, `5237`).

---

## 0. Chấm mù
*(Bỏ qua ở Đợt 2 theo quy định `07-QUY-TRINH-KIEM-CHEO.md` §3: Đợt 1–2 tập trung vào test, logic sư phạm, chống gian lận và diff; chấm mù thực hiện từ Đợt 3).*

---

## 1. Kết quả tự chạy lại

### 1.1. Lệnh kiểm kỹ thuật & dữ liệu (`KIEM-THU.md` §2)

| # | Lệnh tự chạy bởi `rv-t2-b` | Kết quả thật | Ghi chú / Bằng chứng |
|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | **Exit 0** (0 lỗi) | TypeScript strict sạch hoàn toàn |
| 2 | `npx vitest run src/core/scoring src/core/audio src/games/l1-trap-detector src/games/l2-dictation-ladder` | **Exit 0** · **10/10** file · **185/185** test đạt | Thời gian 4,04 s (`sfx.test` 4, `trackPlayer.test` 14, `audioAvailability.test` 5, `listeningAnswer.dataset.test` 3, `listeningAnswer.normalize.test` 30, `listeningAnswer.test` 53, `readingAnswer.test` 11, `evidence.test` 5, `l1/engine.test` 30, `l2/engine.test` 30) |
| 3 | Quét 381 đáp án dataset (`src/core/scoring/listeningAnswer.dataset.test.ts`) | **Exit 0** · **381/381** đáp án đúng (**0 tự trượt**) | Đọc đủ 32/32 episode JSON, kiểm cả biến thể gõ HOA + khoảng trắng thừa |
| 4 | `npm test` | **Exit 0** · **47/47** file · **534/534** test đạt | Toàn bộ unit test repo xanh (15,09 s) |
| 5 | `npm run validate:data` | **Exit 0** (PASS dev) | Schema, invariant, manifest (97 file), CREDITS (95/95 file = 100%) đạt |
| 6 | `PW_PORT=5237 PW_CHANNEL=chrome npx playwright test e2e/m3.spec.ts --project=chromium` | **Exit 0** · **3/3** test đạt (26,4 s) · **0 `console.error`** | (1) L1 lọc MP3 thật (`lep:p1_001` hiện, `lep:p1_002` ẩn) + L2 diff 3 khung; (2) E2E chéo L1 sai bẫy Q4 → tạo `userItems` (`ltrap:p1_001_lep_p1_001_q04`) + `cards` (`#ltrap_replay`) → sang V1 phát đúng `audio/listening/p1_001.mp3` đoạn `[89.37, 95.36]`; (3) L1 Exam 0 kịch bản mô phỏng + modal xác nhận thoát Exam |
| 7 | `npx vite build` + kiểm rò fixture & cảnh báo Rollup | **Exit 0** (19,47 s) · **0** rò `l1_fixtures`/`l2_fixtures` · **0** cảnh báo Rollup L1/L2 | `Select-String dist\assets\*.js -Pattern "l1_fixtures\|l2_fixtures\|L1_FIXTURE\|L2_FIXTURE"` = **0**; chunk `l1-trap-detector` = `80.69 kB` (`22.57 kB` gzip ≤ 120 kB), `l2-dictation-ladder` = `47.97 kB` (`15.06 kB` gzip ≤ 120 kB) |
| 8 | `node scripts/qa/size-budget.mjs` | **Exit 0** | JS khởi động `#/`: `148.39 KB` gzip (≤ 250), CSS: `124.99 KB` (≤ 130), Precache PWA: `1452.2 KiB` (≤ 1500) |

### 1.2. Kết quả `audit-ui.mjs` trên 7 khung × 2 theme (`out/rv-t2-b/`)

- Lệnh chạy:
  `BASE_URL=http://127.0.0.1:5227 node docs/audit-max/cong-cu/audit-ui.mjs --route play/l1,play/l2 --vp 390x844,375x667,430x932,820x1180,1180x820,1280x800,1366x768 --theme dark,light --out out/rv-t2-b`
- Tổng kết **28 lượt** (2 route × 7 khung × 2 theme): **`0 CHẶN · 0 NẶNG · 0 NHẸ`** (0 ảnh `*-loi.png` phát sinh).
- Kiểm `--reduced 1` (`prefers-reduced-motion: reduce`, `390x844` dark, xuất ra `out/rv-t2-b-reduced`): **`0 CHẶN`** (`J8` đạt: toàn bộ animation dừng khi bật reduced-motion; công cụ chỉ báo `J9:2` do animation đã tắt như mong đợi).

| Khung | Theme | Route | CHẶN | NẶNG | Tràn ngang (D5) | Chạm < 44 (D3) | Chữ < 12 (D4) | Icon nét | Chuyển động |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| 390×844 | dark | play/l1 | 0 | 0 | 0 | 0 | 0 | 6 | 1 |
| 390×844 | dark | play/l2 | 0 | 0 | 0 | 0 | 0 | 2 | 6 *(đang Skeleton)* |
| 390×844 | light | play/l1 | 0 | 0 | 0 | 0 | 0 | 6 | 1 |
| 390×844 | light | play/l2 | 0 | 0 | 0 | 0 | 0 | 2 | 6 *(đang Skeleton)* |
| 375×667 | dark | play/l1 | 0 | 0 | 0 | 0 | 0 | 5 | 1 |
| 375×667 | dark | play/l2 | 0 | 0 | 0 | 0 | 0 | 5 | 1 |
| 375×667 | light | play/l1 | 0 | 0 | 0 | 0 | 0 | 5 | 1 |
| 375×667 | light | play/l2 | 0 | 0 | 0 | 0 | 0 | 5 | 1 |
| 430×932 | dark | play/l1 | 0 | 0 | 0 | 0 | 0 | 7 | 1 |
| 430×932 | dark | play/l2 | 0 | 0 | 0 | 0 | 0 | 6 | 1 |
| 430×932 | light | play/l1 | 0 | 0 | 0 | 0 | 0 | 7 | 1 |
| 430×932 | light | play/l2 | 0 | 0 | 0 | 0 | 0 | 6 | 1 |
| 820×1180 | dark | play/l1 | 0 | 0 | 0 | 0 | 0 | 10 | 1 |
| 820×1180 | dark | play/l2 | 0 | 0 | 0 | 0 | 0 | 2 | 6 *(đang Skeleton)* |
| 820×1180 | light | play/l1 | 0 | 0 | 0 | 0 | 0 | 10 | 1 |
| 820×1180 | light | play/l2 | 0 | 0 | 0 | 0 | 0 | 6 | 1 |
| 1180×820 | dark | play/l1 | 0 | 0 | 0 | 0 | 0 | 10 | 1 |
| 1180×820 | dark | play/l2 | 0 | 0 | 0 | 0 | 0 | 6 | 1 |
| 1180×820 | light | play/l1 | 0 | 0 | 0 | 0 | 0 | 10 | 1 |
| 1180×820 | light | play/l2 | 0 | 0 | 0 | 0 | 0 | 2 | 6 *(đang Skeleton)* |
| 1280×800 | dark | play/l1 | 0 | 0 | 0 | 0 | 0 | 10 | 1 |
| 1280×800 | dark | play/l2 | 0 | 0 | 0 | 0 | 0 | 6 | 1 |
| 1280×800 | light | play/l1 | 0 | 0 | 0 | 0 | 0 | 10 | 1 |
| 1280×800 | light | play/l2 | 0 | 0 | 0 | 0 | 0 | 6 | 1 |
| 1366×768 | dark | play/l1 | 0 | 0 | 0 | 0 | 0 | 8 | 1 |
| 1366×768 | dark | play/l2 | 0 | 0 | 0 | 0 | 0 | 6 | 1 |
| 1366×768 | light | play/l1 | 0 | 0 | 0 | 0 | 0 | 8 | 1 |
| 1366×768 | light | play/l2 | 0 | 0 | 0 | 0 | 0 | 6 | 1 |

### 1.3. Kiểm chống gian lận (`07-QUY-TRINH-KIEM-CHEO.md` §5 & `04-LUAT-CUNG.md`)

- `git diff --name-only $(git merge-base master HEAD)..HEAD`: 100% file nằm gọn trong phạm vi độc quyền của T2-B (`src/core/audio/**`, `src/core/scoring/**`, `src/design/components/{AnswerInput,MapView,TrackPlayer}.tsx`, `src/games/l1-trap-detector/**`, `src/games/l2-dictation-ladder/**`, `e2e/m3.spec.ts`, `docs/audit-max/{KE-HOACH-T2-B,BAO-CAO-T2-B}.md`, `docs/audit-max/anh-sau/T2-B/**`).
- **0** chỉnh sửa vào `docs/audit-max/cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, `DECISIONS.md`, `scripts/qa/**`, `scripts/validate/**` (`SR-11` / `Q4`).
- **0** `test.skip`, `it.skip`, `test.fixme`, `data-audit-ignore`, `navigator.webdriver`, `opacity:0` lách công cụ (`SR-12` / `Q5`).
- **0** file rác (`dist/`, `node_modules/`, `test-results/`, `out/`, `e2e/screenshots/**`, `*.lnk`) bị track trong git (`SR-07` / `P7`).

---

## 2. Lỗi tìm thấy (6 lỗi: 0 CHẶN · 1 NẶNG · 5 NHẸ, xếp nặng → nhẹ)

| # | Màn / File:dòng | Khung + theme | Vị trí / Tọa độ | Mã luật | Mức | Mô tả chi tiết | Cách sửa đề xuất |
|---|---|---|---|---|---|---|---|
| 1 | `src/core/scoring/listeningAnswer.ts:408` và `:708` | Mọi khung (`play/l1` pha chấm đáp án số) | `countIeltsTokens` (`:408`) & `canonicalizeIeltsExpression` (`:708`) | `L1-02..05` / `SR-20` | **NẶNG** | Ở dòng `:408`, regex xóa dấu phẩy phân cách hàng nghìn viết là `.replace(/(\d),(\d{3}) /g, '$1$2')` (có khoảng trắng `' '` ở cuối thay vì `\b`). Khi người học gõ đáp án chỉ gồm số có dấu phẩy như `"1,500"` hoặc `"10,000"` hoặc `"£1,500"` (ở cuối chuỗi, không có từ theo sau), dòng `:408` không khớp; ngay sau đó dòng `:409` `.replace(/[,;!?"]/g, ' ')` tách `"1,500"` thành `"1 500"`, và `collapseDigitGroups` chỉ gộp khi tổng ≥ 6 chữ số → `countIeltsTokens("1,500")` trả về `{ wordCount: 0, numberCount: 2 }`. Với câu giới hạn `ONE WORD AND/OR A NUMBER` hoặc `A NUMBER ONLY` (`maxNumbers: 1`), đáp án `"1,500"` bị chấm sai `word_limit_exceeded` (false-negative). Tương tự, dòng `:581` `.replace(/(\d),(\d{3})\b/g, '$1$2')` chỉ xóa được 1 dấu phẩy trong `"1,000,000"`, và dòng `:708` `.replace(/(?<![\d:])(\d{1,2}):00(?!\d\|:\|\s*(?:am\|pm) )/g, '$1')` bị mất `\b` sau `(?:am\|pm)`. | Tại `listeningAnswer.ts:408` và `:581`, đổi thành `.replace(/(\d),(?=\d{3}\b)/g, '$1')` (giống L2 `engine.ts:407`). Tại `:708`, đổi `(?:am\|pm) ` thành `(?:am\|pm)\b`. Thêm unit test `scoreListeningAnswer('1,500', ['1500'], { wordLimit: 'Write A NUMBER ONLY.' })` → `correct: true`. |
| 2 | `play/l2` (`src/games/l2-dictation-ladder/dictationLoader.ts:74`, `src/core/audio/audioAvailability.ts:52`) | `390x844` dark/light, `820x1180` dark, `1180x820` light | `(16, 88, 358, 220)` trên ảnh `out/rv-t2-b/390x844-dark-play_l2.png` | `SR-49` / `L2-01` | **NHẸ** | `loadDictationPool()` gọi `filterByAudioFile` bắn đồng thời **300 request `HEAD`** (`dict_0001.mp3`..`dict_0300.mp3`) qua `Promise.all` ngay khi vào `#/play/l2`. Khi cache lạnh, 300 request đồng thời (240 file chưa render trả 404/SPA HTML) mất ~0,8–1,2 s mới xong, khiến 4/14 lượt chụp tự động của `audit-ui.mjs` chụp trúng màn `<Skeleton>` (`data-testid="l2-loading"`). (10/14 lượt còn lại bao gồm `375x667`, `430x932`, `1280x800`, `1366x768` và ảnh `docs/audit-max/anh-sau/T2-B/390x844-dark-play_l2.png` hiện đầy đủ màn Intro L2 với 0 lỗi). | Ưu tiên kiểm `HEAD` trước cho 50 câu của bậc `startLvl` hiện tại để hiển thị màn Intro L2 ngay (< 150 ms), sau đó kiểm nền các bậc còn lại hoặc đọc danh sách file có sẵn từ manifest khi T3-B hoàn tất. |
| 3 | `play/l1` pha làm bài Part 2 Bản đồ (`src/design/components/MapView.tsx:273,314,324,336,346,383,493`) | `390x844`, `375x667` (khi mở bài `lep:p2_001`) | Khung SVG `MapView` (`viewBox="0 0 600 400"`) | `D4` / `SR-41` | **NHẸ** | Bên trong SVG của `MapView.tsx`, một số thẻ `<text>` còn đặt cỡ chữ nhỏ hơn 12: nhãn đường `fontSize={shape.kind === 'road' ? 11 : 12}` (`:273`), chữ la bàn `N` `fontSize={11}` (`:314`), `E/W/S` `fontSize={9}` (`:324,336,346`), nhãn `"You are here"` `fontSize={10}` (`:383`), và số thứ tự câu đã gán trên slot `fontSize={9}` (`:493`). Khi co theo `viewBox` 600 px xuống màn iPhone 375–390 px, chữ hiển thị thực tế < 12 px. | Tăng `fontSize` tối thiểu trong `MapView.tsx` lên `12` (hoặc `13–14` để sau khi scale `viewBox` trên mobile vẫn đạt ≥ 12 px). |
| 4 | `src/games/l2-dictation-ladder/engine.ts:1050-1088` so với `:1164-1192` | Logic lưu cuối phiên L2 (`recap`) | `buildL2UserItems` vs `buildL2SessionSavePayload` | `PP-01` / `L2-08` / `B6` | **NHẸ** | Khi người học sai chính tả cùng một từ ≥ 2 lần qua các phiên (`L2-08`), `buildL2SessionSavePayload` (`:1164-1192`) tạo thẻ FSRS `vocab:<slug>#listen_spell`. Tuy nhiên `buildL2UserItems` (`:1050-1088`) hiện chỉ tạo bản ghi `userItems` cho `dict:*` (`dict_full`), chưa tạo `userItem` kèm `audioClip` cho `vocab:<slug>` (khác với L1 `buildL1UserItems` ở `l1/engine.ts:1274-1295` đã ghi cả hai). Nếu từ đó không thuộc 537/2207 từ đã có MP3 trong `words.json`, V1 sẽ bỏ qua thẻ `listen_spell` đó vì thiếu audio (`FX-0`). | Trong `buildL2UserItems`, bổ sung tạo `UserItemInput` cho các từ đạt ngưỡng `L2_SPELLING_CARD_THRESHOLD` (hoặc gắn `audioClip` câu chứa từ đó) tương tự `buildL1UserItems`. |
| 5 | `play/l1` & `play/l2` (`src/games/l1-trap-detector/L1TrapDetector.tsx:558-566`, `src/games/l2-dictation-ladder/L2DictationLadder.tsx:768-776,1135-1146,1240`) | `390x844` dark/light (`390x844-dark-play_l1.png`, `375x667-dark-play_l2.png`) | L1 nút `Quay lại` `(20, 128, 107, 44)`; L2 nút `Thoát` `(16, 77, 94, 44)` | `U3` / `J9` | **NHẸ** | (a) Ngay dưới thanh header của `PlayScreen` (đã có nút `✕` thoát tại `(16, 6, 44, 44)` và tiêu đề `L1`/`L2`), màn chọn bài L1 vẫn có nút `← Quay lại` và màn L2 có nút `← Thoát` trùng chức năng (`U3` — builder giữ lại để không vi phạm `Q6` mất nút trong `KE-HOACH-T2-B.md`). (b) Ở pha `playing` của L2, khi chưa bấm `Phát (R)`, vòng sóng quanh nút Phát chưa chạy nên màn chờ chưa có phần tử chuyển động nhẹ ngoài vùng chữ (`J9`). | Ở đợt juice `T4-B` (khi điều phối cho phép gộp nút thoát trùng theo `U3`), bỏ nút `Quay lại`/`Thoát` phụ ở màn đầu và thêm hiệu ứng thở nhẹ (`motion-safe:animate-pulse`) trên viền nút `Phát (R)` lúc chờ lượt phát đầu tiên. |
| 6 | `src/games/l1-trap-detector/L1TrapDetector.tsx` (2162 dòng) & `src/games/l2-dictation-ladder/L2DictationLadder.tsx` (1524 dòng) | Mã nguồn component | Toàn file | `L1-18` | **NHẸ** | Cả hai file component chính vượt 1500 dòng (`L1TrapDetector.tsx` 2162 dòng, `L2DictationLadder.tsx` 1524 dòng). Đây là mã P2 `L1-18` đã được ghi nhận hoãn sang `T4-B` để tránh rủi ro hồi quy khi sửa logic P0/P1 ở Đợt 2. | Ở `T4-B`, tách `EpisodePicker`, `QuestionGroupRenderer`, `DebriefView`, `LadderRail`, `DiffTokenView` ra các file con `< 600` dòng. |

---

## 3. Bảng tiêu chí ĐẠT từng mã lỗi của T2-B (kèm bằng chứng thật)

*(Đợt 2 chưa chấm điểm rubric thẩm mỹ R1–R10 theo `07-QUY-TRINH-KIEM-CHEO.md` §3; thay bằng bảng nghiệm thu từng mã lỗi kỹ thuật & sư phạm của T2-B).*

| Mã lỗi / Yêu cầu | Mức gốc | Trạng thái | Bằng chứng thật (`rv-t2-b` kiểm chứng) |
|---|---|---|---|
| **L1-01** · Lọc episode theo file MP3 thật (HEAD), cấm transcript/kịch bản mô phỏng ở Exam & pha nghe, 0 band / 0 SRS khi thiếu audio | P0 (`SR-22`, `SR-23`, `SR-89`) | **ĐẠT** | `audioAvailability.ts:24-64` gửi `HEAD` và loại `text/html` (SPA fallback); `listeningLoader.ts:107-154` lọc còn 4/32 bài có MP3 thật (`p1_001..p4_001`) + `hasRealScriptTimings`; `L1TrapDetector.tsx:2049` bỏ hẳn khối "Đọc kịch bản mô phỏng"; `l1/engine.ts:1265,1391,1431` chặn `bandEvidence` và `updatedCards` khi `simulatedMode \|\| audioMissing`. E2E `e2e/m3.spec.ts` kiểm `lep:p1_002` không xuất hiện và Exam 0 chữ "Đọc kịch bản mô phỏng". |
| **L1-02** · Số điện thoại gõ theo nhóm chữ số (`"07741 829 360"`, `"0121-496-0123"`) tính là 1 số | P1 | **ĐẠT** | `collapseDigitGroups` (`listeningAnswer.ts:299-307`) gộp nhóm chữ số ≥ 6 số trước khi đếm token và chuẩn hoá. Unit test `listeningAnswer.normalize.test.ts:16-38` đạt. |
| **L1-03** · Giờ `"9.30"` = `"9:30"` không cần `am/pm`, không nhầm với tiền thập phân | P1 | **ĐẠT** | `listeningAnswer.ts:629-634` chuyển `H.MM` (giờ ≤ 24, phút < 60, không đi kèm đơn vị tiền/đo lường) thành `H:MM`. Unit test `:40-56` đạt. |
| **L1-04** · Giờ nói bằng chữ (`"nine thirty"`, `"half past nine"`, `"quarter to ten"`, `"nine oh five"`) = `9:30`, `9:45`, `9:05` và đếm là 1 số | P1 | **ĐẠT** | `parseSpokenTime` (`listeningAnswer.ts:350-383`) tích hợp ở cả `countIeltsTokens` (`:448-455`) và `canonicalizeIeltsExpression` (`:651-657`). Unit test `:58-77` đạt. |
| **L1-05** · Tiền/đơn vị in sẵn cạnh ô trống (`promptUnit`: `"£12.50"` = `"12.50"`) | P1 | **ĐẠT** (còn 1 lỗi NẶNG nhỏ với số có dấu phẩy cuối chuỗi ở Lỗi #1) | `extractPromptUnit` (`l1/engine.ts:825-840`) trích ký hiệu tiền/đơn vị từ `row.label/value/suffix`; `listeningAnswer.ts:620-626,856-873` đối sánh bỏ đơn vị hai chiều. Unit test `:79-96` và `l1/engine.test.ts:732-738` đạt. (Lưu ý sửa regex dấu phẩy `:408` nêu ở Mục 2 Lỗi #1). |
| **L1-06** · `"second floor"`, `"first"` hợp lệ dưới `"NO MORE THAN TWO WORDS"` (`words_only`) | P2 | **ĐẠT** | `countIeltsTokens` nhận `numberWordsAsWords: limit?.mode === 'words_only'` (`listeningAnswer.ts:448,459,789-791`), chỉ coi chữ số thật `\d` là number ở chế độ `words_only`. Unit test `:98-120` đạt. |
| **381/381 đáp án dataset** · Quét toàn bộ đáp án trong 32 episode | P0 | **ĐẠT** | `listeningAnswer.dataset.test.ts` chạy 32 episode, **381/381** đáp án chấp nhận đạt `correct: true` (0 tự trượt). |
| **L1-08** · Retry ("Ôn lại câu sai") chỉ ôn câu sai, phát đúng đoạn clip, 0 XP, 0 band | P1 | **ĐẠT** | `createL1RetrySession` (`l1/engine.ts:511-576`) lọc chỉ câu sai (giữ nguyên nhóm `paired mcq_multi`), tính `retryClipMap` (`primaryTrapClip ∪ evidence`), đặt `isRetry: true`, `countsForBand: false`, `totalXp: 0` kể cả khi gắn nhãn bẫy (`:1145`). UI có nút `l1-retry-play-clip-{number}` (`L1TrapDetector.tsx:1105-1119,1327-1343`). |
| **L1-09** · Lưu `l1.examDoneEpisodeIds` trong `kv`, Exam lần 2 0 band + badge "Đã làm Exam", modal xác nhận thoát giữa Exam | P1 | **ĐẠT** | `L1TrapDetector.tsx:223-230,464-468,778-782,1831-1838,2130-2157` + `l1/engine.ts:464,1430`. Đã kiểm bằng unit test (`l1/engine.test.ts:687-696`) và E2E (`e2e/m3.spec.ts:256-284`). |
| **L1-10** · Phân biệt `NotAllowedError` (autoplay) với thiếu file; Exam chặn bắt đầu khi chưa `ready` | P1 | **ĐẠT** | `trackPlayer.ts:334-336,377-386` giữ `status: 'ready'` + `autoplayBlocked: true` khi gặp `NotAllowedError`; `TrackPlayer.tsx:278-312` hiện banner + nút "Bấm để phát"; `L1TrapDetector.tsx:338-339,359-365,1872-1884` khoá nút "Bắt đầu nghe" ở Exam tới khi `status === 'ready'`. |
| **L1-11, L1-12, L1-13, L1-15, L1-17, L1-19, L1-21, L1-22** | P2/P3 | **ĐẠT** | `L1-11`: `loadListeningEpisode` ném lỗi, UI hiện card lỗi + nút Thử lại, không fallback sai bài. `L1-12`: chỉ gán `trap:*` khi khớp decoy hoặc substring dòng bẫy. `L1-13`: `allowSeek: false` ở lv ≥ 7. `L1-15`: `buildL1WinStatement` dùng `LISTENING_TRAP_LABELS_VI`. `L1-17`: bỏ side-effect khỏi `setSession` updater. `L1-19`: `AnswerInput` dùng `useId()` gắn `<label htmlFor>` + `aria-label` + ẩn đếm từ ở Exam. `L1-21`: chỉ tạo thẻ `ltrap` khi `errorCategory.startsWith('trap:')`. `L1-22`: pill Debrief xanh theo tỷ lệ `>= 0.8`. |
| **L2-01** · Lọc câu L2 theo file MP3 tồn tại thật qua HEAD, bỏ mô phỏng im lặng | P0 (`SR-22`) | **ĐẠT** | `dictationLoader.ts:74-78` lọc `filterByAudioFile` (giữ 60/300 câu có MP3 thật); `trackPlayer.ts:180` mặc định `allowSimulation = false`; `l2/engine.ts:1124` bỏ qua SRS khi `audioMissing`. |
| **L2-02** · Chọn câu L2 có seed theo ngày + số phiên, loại câu đã làm 7 ngày, ưu tiên thẻ `dict_full` đến hạn | P1 | **ĐẠT** | `selectL2SessionItems` (`l2/engine.ts:743-805`) + `L2DictationLadder.tsx:384-421,654-657`. Unit test `l2/engine.test.ts:447-468` kiểm 2 phiên liên tiếp `overlap === 0` và thẻ due lên đầu. |
| **L2-04, L2-08, L2-09, L2-12** | P2/P3 | **ĐẠT** | `L2-04`: `normalizeDictationText` xử lý `10,000-word` = `ten-thousand-word` và `a.m.`/`p.m.` = `am`/`pm` (100%). `L2-08`: lưu `l2.spellingMiss` trong `db.kv` qua các phiên. `L2-09`: bỏ side-effect trong updater + `sfxEngine.setBlocked(false)` ngay sau `pause()`. `L2-12`: retry 0 XP. |
| **Producer `userItems` (`B6` / `PP-11` / `X-01`)** · Ghi `userItemRepo.upsertWithCard` cho `ltrap:*` (kèm `audioClip {src,start,end}`) và `dict:*` | P0 | **ĐẠT** | `L1TrapDetector.tsx:455-461` (`buildL1UserItems`) và `L2DictationLadder.tsx:635-641` (`buildL2UserItems`). E2E chéo `e2e/m3.spec.ts:89-254` xác nhận IndexedDB có `ltrap:p1_001_lep_p1_001_q04` với `audioClip: { src: 'audio/listening/p1_001.mp3', start: 89.37, end: 95.36 }` và V1 phát đúng đoạn `[89.37, 95.36]`. |
| **Lưu tiến độ từng lượt (`TU-02` / `F1`)** · `attemptRepo.saveProgress` + `attemptRepo.finalize` + `registerProgressSaver` | P1 | **ĐẠT** | Cả L1 (`L1TrapDetector.tsx:256-284,447-452`) và L2 (`L2DictationLadder.tsx:463-483,587-600,626-631`) đều lưu tiến độ từng câu, đăng ký `registerProgressSaver` và gọi `finalize` khi vào Recap. |
| **FX-1** · Chip `↵` trong `AnswerInput.tsx` ≥ 12 px | P0 (`D4`) | **ĐẠT** | `src/design/components/AnswerInput.tsx:131-143` dùng `<kbd className="... text-xs ...">↵</kbd>` (12 px). `audit-ui.mjs` báo 0 lỗi `D4`. |
| **TU-03** · Độ tin cậy audio Safari iOS (`14-TOI-UU-WEB.md` §9) | P1 | **ĐẠT** | `trackPlayer.ts:129-139,320-326,593` đặt `navigator.audioSession.type = 'playback'`, lắng nghe `canplaythrough`, gọi `unlock()` ở thao tác chạm; `sfx.ts:117-150` tự `resume()` `AudioContext` khi `suspended`/`interrupted` ở `visibilitychange`, `pageshow`, `touchend`. |
| **X-04, X-05, X5, X6** · SFX manifest rebuild, reuse `preload()`, 0 Rollup warning L1/L2, 0 fixture leak trong `dist` | P1/P3 | **ĐẠT** | `sfx.ts:176-187` dựng lại `Howl` khi manifest đổi (`X-04`); `trackPlayer.ts:250-264,287-306` tái sử dụng element `preload()` (`X-05`); `vite build` 0 cảnh báo Rollup ở L1/L2 (`X5`) và 0 chuỗi `l1_fixtures`/`l2_fixtures` trong `dist/assets/*.js` (`X6`). |

---

## 4. Chức năng (đối chiếu `KE-HOACH-T2-B.md` – `LUAT.md` Q6 / `SR-80`)

Đã đối chiếu và kiểm tra toàn bộ danh sách nút/chức năng trong `docs/audit-max/KE-HOACH-T2-B.md`:

- **L1 chọn bài:**
  - Nút `Quay lại` (`L1TrapDetector.tsx:558-566`): **Còn, hoạt động**.
  - Chuyển chế độ `Training` / `Exam (tính band)` (`:592-617`): **Còn, hoạt động**.
  - Thanh trượt `Cấp độ 1–10` ở Training (`:665-679`): **Còn, hoạt động**.
  - Bộ lọc `Tất cả (4)` / `Part 1..4` (`:713-732`): **Còn, hoạt động** (chỉ hiện bài có MP3 thật).
  - Thẻ bài nghe (tiêu đề, độ khó, số câu, thời lượng, giọng, badge `Bản đồ SVG`, thêm badge `Đã làm Exam`) + nút `Bắt đầu`: **Còn, hoạt động**.
- **L1 pha đọc trước (Preview 30 s):**
  - Đồng hồ đếm ngược 30 s + nút `Bắt đầu nghe` (khoá khi Exam còn đang tải audio): **Còn, hoạt động**.
  - Chip đoán loại đáp án (6 loại: Số, Ngày/Giờ, Tên riêng, Danh từ, Số nhiều `-s`, Tính từ): **Còn, hoạt động**.
  - Ô đáp án form/note/table, MCQ 1 đáp án, MCQ chọn 2, bản đồ SVG (`MapView` bấm chữ cái + `<select>`): **Còn, hoạt động**.
  - Nút `Đổi bài` (ở Exam mở modal xác nhận thoát `L1-09`): **Còn, hoạt động**.
- **L1 pha nghe / soát (Listening & Exam Review):**
  - `TrackPlayer` (phát/dừng, tua 5 s, thanh tiến trình, tốc độ `0.75×/1.0×/1.25×`, âm lượng, tắt tiếng; Exam khoá tua/dừng/tốc độ, Lv 7–8 khoá dừng & tua): **Còn, hoạt động**.
  - `QuestionNav` (nhảy câu, cắm cờ): **Còn, hoạt động**.
  - Nộp bài (modal xác nhận khi nộp sớm ở Training; đếm ngược 30 s soát Exam + tự nộp + cảnh báo chuyển tab Exam): **Còn, hoạt động**.
  - Nút `"Đọc kịch bản mô phỏng"`: **Đã gỡ bỏ theo đúng yêu cầu `KE-HOACH-T2-B.md` & `L1-01`/`SR-23`**.
- **L1 Debrief & Recap:**
  - Sóng âm `Waveform` xanh/đỏ bấm được · lọc `Chỉ câu sai`/`Tất cả` · nút `Nghe đoạn đáp án` · nút `Nghe đoạn bẫy` · transcript bấm từng dòng · tự gắn nhãn bẫy (+5 XP ở phiên thường, 0 XP ở phiên retry, khoá sau lần chọn đầu) · nút `Hoàn tất & xem Recap`: **Còn đủ, hoạt động**.
  - `RecapScreen`: điểm, XP, câu thắng tiếng Việt, danh sách câu sai, nút `Ôn lại câu sai` (chỉ câu sai + nút nghe đoạn clip từng câu), nút `Về Hôm nay`: **Còn đủ, hoạt động**.
- **L2 Intro / Phiên / Recap:**
  - Màn Intro: nút `Thoát`, thang 10 bậc `LadderRail` bấm chọn level, 3 thẻ thông số (Bậc đang chọn / Số lượt phát tối đa / Điều kiện lên bậc), nút `Bắt đầu phiên 10 câu`: **Còn đủ, hoạt động**.
  - Màn Phiên: nút `Phát (R)` kèm vòng sóng, nút `Phát chậm 0.75× (−30%)`, ô gõ `textarea` (`Enter` nộp), nút `Nộp bài (Enter)`, bảng chấm (`%`, diff từng từ có stagger, pill nhãn lỗi, hộp `Điểm nghe khó` kèm IPA), nút `0.75× đoạn này`, nút `Câu tiếp theo (Enter)`, bộ đếm câu `1/10`, chấm lượt phát `●●○`, bộ đếm `+XP`: **Còn đủ, hoạt động**.
  - Màn Recap: thống kê 5 loại lỗi có thanh phần trăm, banner đủ điều kiện lên bậc + nút `Lên Level N` + `Chơi ngay Level N`, nút `Ôn lại câu sai` (0 XP), nút `Về Hôm nay`: **Còn đủ, hoạt động**.

→ **0 chức năng cũ bị mất** (`SR-80` / `Q6` đạt).

---

## 5. So với tham chiếu

1. **`play/l1` – Màn chọn bài (`out/rv-t2-b/390x844-dark-play_l1.png`, `1280x800-dark-play_l1.png`):**
   - *Giống Duolingo / app luyện thi chuẩn ở:* phân tách rõ chế độ `Training` và `Exam (tính band)`, thẻ bài nghe sạch, chỉ hiện bài có âm thanh thật, vùng chạm đạt ≥ 44 px trên mọi khung iPhone/iPad/laptop.
   - *Còn kém Balatro / Duolingo ở:* mật độ hình minh họa/icon màu chưa có (0 icon màu Fluent Emoji, chỉ dùng icon nét `lucide-react` — thuộc phạm vi Đợt 3 `T3-A` và Đợt 4 `T4-B`).
2. **`play/l1` – Màn Debrief phân tích bẫy (`test-results/m3/` & `L1TrapDetector.tsx:1386-1796`):**
   - *Giống công cụ học có chủ đích (Deliberate Practice) ở:* sóng âm đánh dấu vùng đáp án (xanh) và vùng bẫy (đỏ) bấm để phát đúng đoạn `[start, end]`, bước siêu nhận thức tự gắn nhãn bẫy (+5 XP) và tự động đẩy thẻ `ltrap_replay` kèm `audioClip` sang V1.
   - *Còn kém ở:* transcript hiện mới tô nền cả dòng thoại chứ chưa tô nổi (`<mark>`) chính cụm từ decoy/đáp án trong dòng (`L1-14`, hoãn sang `T4-B`), và chưa có hiệu ứng count-up/stagger ở Debrief/Recap (`L1-20`, thuộc `T3-A`/`T4-B`).
3. **`play/l2` – Màn Intro & Chấm diff từng từ (`out/rv-t2-b/430x932-dark-play_l2.png`, `1280x800-dark-play_l2.png`):**
   - *Giống Duolingo / Balatro ở:* pha chấm hiện diff từng từ với hiệu ứng stagger 25 ms, phân loại rõ 5 nhóm lỗi nghe (âm cuối, âm yếu, chính tả, số, sai từ) kèm hộp "Điểm nghe khó" (IPA nối âm) và thang 10 bậc trực quan.
   - *Còn kém ở:* lần tải lạnh đầu tiên bắn 300 request `HEAD` làm màn `<Skeleton>` giữ ~1 giây (Lỗi #2), và chưa có chuỗi combo câu hoàn hảo liên tiếp (`L2-11`, thuộc `T4-B`).

---

## 6. Luật script chưa đo, đã kiểm bằng cách nào

| Mã luật | Nội dung luật | Cách `rv-t2-b` đã kiểm | Kết quả |
|---|---|---|---|
| **B2 / SR-21 / PP-03** | Mọi câu sai có đáp án đúng + lý do tiếng Việt + bằng chứng bấm được | Đọc `L1TrapDetector.tsx:1578-1632` (hiện "Bạn ghi", "Đáp án", lý do `explanationVi`/`feedbackVi`, nút "Nghe đoạn đáp án" + "Nghe đoạn bẫy" có timestamp) và `L2DictationLadder.tsx:1420-1496` (diff từ sai/thiếu + "Điểm nghe khó" + nút "0.75× đoạn này"); chạy E2E `e2e/m3.spec.ts` | **ĐẠT** |
| **B3 / SR-22 / PP-C1** | Ghi FSRS qua `src/core/srs`; tuyệt đối không chấm FSRS khi thiếu audio | Kiểm `l1/engine.ts:1265,1391`, `l2/engine.ts:1124` và chạy unit test `l1/engine.test.ts:635-649`, `l2/engine.test.ts:522-544`, `v1-daily-run/audioMissing.test.ts` | **ĐẠT** |
| **SR-23 / PP-C3** | Không lộ đáp án / transcript trước khi trả lời hoặc ở Exam | Đọc `L1TrapDetector.tsx:1804-2090` (pha `preview`/`listening`/`review` hoàn toàn không render transcript) + E2E `e2e/m3.spec.ts:275` | **ĐẠT** |
| **B7 / SR-24 / SR-89** | Exam không SFX (trừ `timeup`/`countdownEnd`), không tính band ở phiên mô phỏng / retry / làm lại lần 2 | Kiểm `sfx.ts:235-239`, `L1TrapDetector.tsx:235-237,396,408`, `l1/engine.ts:464,1427-1433` và unit test `l1/engine.test.ts:635-696` | **ĐẠT** |
| **TU-02 / F1** | Lưu tiến độ từng lượt `attemptRepo.saveProgress` + `registerProgressSaver` | Kiểm `L1TrapDetector.tsx:256-284` và `L2DictationLadder.tsx:463-483,587-600` | **ĐẠT** |
| **TU-03** | Độ tin cậy audio Safari iOS (`audioSession = 'playback'`, `AudioContext.resume()`, `canplaythrough`) | Kiểm `trackPlayer.ts:129-139,320-326`, `sfx.ts:117-150` và chạy `trackPlayer.test.ts:343-358`, `sfx.test.ts:79-89` | **ĐẠT** |
| **J8 / SR-48** | Tôn trọng `prefers-reduced-motion: reduce` | Chạy `audit-ui.mjs --route play/l1,play/l2 --vp 390x844 --theme dark --reduced 1 --out out/rv-t2-b-reduced` + kiểm `motion-safe:animate-pulse` và `useReducedMotion()` trong `AnswerInput.tsx`, `L2DictationLadder.tsx` | **ĐẠT** (0 CHẶN) |

---

## 7. Phán quyết: **ĐẠT**

- **Số lỗi:** **0 CHẶN** · **1 NẶNG** (ở `src/core/scoring/listeningAnswer.ts:408,708`, ≤ 2 NẶNG/màn) · **5 NHẸ**.
- **Điều kiện Đợt 2:** Toàn bộ tiêu chí P0/P1 của T2-B trong `TASKS.md` và `phu-luc/B` đã hoàn thành và có unit test + E2E chứng minh; 381/381 đáp án dataset 0 tự trượt; E2E chéo L1 → V1 phát đúng `audioClip` đoạn bẫy; `audit-ui.mjs` trên 7 khung × 2 theme đạt **0 CHẶN · 0 NẶNG · 0 NHẸ**; 0 vi phạm chống gian lận.
- **Khuyến nghị trước/sau khi merge:** Sửa nhanh 2 dòng regex mất `\b` ở `src/core/scoring/listeningAnswer.ts:408,581,708` (Lỗi #1 — NẶNG) để số có dấu phẩy hàng nghìn ở cuối chuỗi (`"1,500"`) không bị đếm thành 2 số.
