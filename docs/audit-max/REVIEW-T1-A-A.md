# REVIEW T1-A – Reviewer A (rv-T1-A) – model Claude Opus 5.5

Nhánh `audit-max/T1-A` (HEAD `83e3ff6`), worktree `D:\English-wt\T1-A`. Đợt 1: 1 reviewer, kiểm test + diff + logic + chức năng. **Chưa chấm mù rubric thẩm mỹ** (theo phân công đợt 1).
Số liệu dưới đây do reviewer tự chạy lại ngày 24/11/2026. Không lấy số từ BAO-CAO/HANDOFF.

## 0. Chấm mù
Không làm ở đợt 1 (điều phối giao: chỉ kiểm logic/chức năng). Mục 3 (rubric) và mục 5 (tham chiếu) cũng bỏ qua.

## 1. Kết quả tự chạy lại

| Kiểm | Kết quả thật |
|---|---|
| `npx tsc --noEmit -p .` | exit 0, 0 lỗi |
| `npm test` | **34/34 file, 419/419 test pass** |
| `npm run validate:data` | exit 0, PASS |
| `npx vitest run src/core/storage src/core/srs src/games/v1-daily-run` | **7 file, 76 test pass** |
| `npx playwright test -c playwright.t1a.config.ts e2e/v1-srs.spec.ts e2e/m1.spec.ts` | **5/5 pass** (4 của v1-srs + m1), 0 console error. Lưu ý: `m1.spec` ghi đè 12 ảnh đã track trong `e2e/screenshots/m1/` – reviewer đã `git checkout` trả lại |
| `grep -rn "?? content\.[a-z]*\[0\]" src/games` | **0 dòng** |
| `npx vite build && grep -l v1_fixtures dist/assets/*.js` | build OK; **còn 1 file** `dist/assets/index-DbAfowjL.js`, do `src/features/placement/placementData.ts:9,465` (ngoài quyền T1-A, đã ghi HANDOFF mục 1). Không tính lỗi builder; tiêu chí Done "rỗng" **chưa đạt** cho tới khi fixer sửa file này. Code V1 không còn import fixture (grep `src/` ngoài test chỉ ra placementData) |
| `audit-ui --route play/v1 --vp 390x844,820x1180,1280x800 --theme dark,light` | **0 CHẶN · 18 NẶNG** (D3 ×12, D7 ×6) = 3 NẶNG/khung, cả 3 ở header `PlayScreen.tsx` (nút ✕, nút âm thanh 35–36 px; nhãn "Level 1 · Training") → của T1-B. Ảnh `out/review-T1-A-loi/*-loi.png` đã mở xem: chỉ có viền cam ở header. Công cụ chỉ thấy EmptyState (DB trống) |
| Đo chữ < 12 px khi DB có thẻ (script reviewer, 390×844, recog/recall_cloze/tfng_retry + phản hồi sai) | chỉ có `<kbd>` 11 px ("↵", "Enter") của `AnswerInput`/`FeedbackPanel`/`KeyHint` (design, T3-A, HANDOFF mục 3). Không có chữ < 12 px trong file của T1-A |
| Câu hỏi ở 390×844 (B5) | thẻ bắt đầu y = 302 (recog) / 356 (tfng). B5 thuộc T4-A (HANDOFF mục 6), không tính cho T1-A |

**Số của builder khớp số reviewer đo** (419/34, 76/7, 4/4 E2E, 3 NẶNG/khung, 0 CHẶN). Không thấy thổi phồng số.

### Chống gian lận (07 §5)
- `git diff --name-only master...HEAD`: 20 file code/test + docs, **tất cả nằm trong danh sách độc quyền T1-A** (`src/core/storage/**`, `src/core/srs/fsrsAdapter.ts`, `src/games/v1-daily-run/**`, `src/test/fixtures/v1_fixtures.ts`, `e2e/v1-srs.spec.ts`, `docs/audit-max/{KE-HOACH,BAO-CAO}-T1-A.md`, `HANDOFF.md`, `anh-sau/T1-A/**`). Không đụng `cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, `scripts/**`.
- `test.skip/fixme/only` mới: 0. `data-audit-ignore`, `navigator.webdriver`: 0. Diff không thêm `aria-hidden`/`opacity:0`.
- Chuỗi UI bị mất so với master: chỉ "Ôn thêm (Không ghi FSRS)" → đổi thành "Ôn thêm (không tính vào lịch ôn)" (đổi chữ, không mất chức năng).

## 2. Lỗi tìm thấy (nặng → nhẹ)

| # | Màn/route | Khung + theme | Vị trí | Mã luật | Mức | Mô tả | Cách sửa đề xuất |
|---|---|---|---|---|---|---|---|
| 1 | `play/v1`, mặt `ltrap_replay`, episode **không có MP3** (28/32 episode) | 390×844 dark, ảnh `out/review-T1-A/N390-ltrap_replay-noaudio.png` (x 44, y 570, w 304, h 100) | `V1DailyRun.tsx:2084-2091` (hiện `transcriptLine` khi `audioMissing`); `extras.ts:138` (`buildListeningRef` không kiểm audio) | `01` G1 + L1-01 ("Listening là đọc"), "không lộ đáp án" (`01` §Đợt 2) | **NẶNG** | Bấm "Nghe đoạn bẫy" khi thiếu MP3 → **hiện nguyên câu kịch bản chứa đáp án trước khi trả lời** (vd câu hỏi "Guest's surname", trích dẫn "…Daniel Aldridge… A-L-D-R-I-D-G-E"). Thẻ Listening thành thẻ đọc chép, FSRS vẫn chấm (Good) cho thẻ `ltrap_replay` → lịch ôn Listening bị thổi phồng. Builder biết (BAO-CAO §7) nhưng chọn cách lộ đáp án. Câu báo "hãy đối chiếu IPA" sai ngữ cảnh (không có IPA) | Khi episode không có audio: bỏ node (log `missing_audio`, không review) **hoặc** hiện transcript chỉ **sau** khi nộp; kiểm tồn tại audio lúc `loadV1Extras` (HEAD/manifest). Sửa câu báo cho mặt nghe |
| 2 | `play/v1`, mặt `dict_full`, câu chưa có MP3 (240/300 câu `dictation.json`) | 390×844 dark, ảnh `out/review-T1-A/N390-dict_full-noaudio.png` (x 44, y 420, w 304, h 185) | `V1DailyRun.tsx:2103-2136`; `engine.ts:1269` (dựng prompt không kiểm audio), `engine.ts:1945` (chấm) | `01` G1 (chấm FSRS sai), D1 (`04`) | **NẶNG** | Không có audio thì không có cách nào biết câu cần chép → người học chắc chắn sai → FSRS ghi **Again** cho thẻ thật. Nút "Phát câu" vẫn trừ lượt nghe (3→2) dù không phát được | Như #1: bỏ node / không ghi FSRS khi audio thiếu; không trừ lượt nghe khi phát lỗi. Thêm test: dict thiếu audio → không review |
| 3 | V1-7 checkpoint | – | `e2e/v1-srs.spec.ts` (thiếu ca) | `BAN-GIAO` §8.2 ("mỗi lỗi sửa có test chứng minh tiêu chí ĐẠT"), tiêu chí ĐẠT V1-7 | NHẸ | Tiêu chí ĐẠT V1-7 là E2E "checkpoint → reload → 20 review"; builder ghi ⏳, không có test. **Chức năng thì đúng**: reviewer tự chạy (`out/review-T1-A/checkpoint.mjs`, 25 thẻ đến hạn, trả lời 20 → checkpoint → reload sau 300 ms) → DB có **20 review**, attempt `in_progress` 20/20, XP 470 | Thêm ca E2E như script reviewer vào `e2e/v1-srs.spec.ts` |
| 4 | `play/v1`, `err_user` sai | 1280×800 dark, ảnh `out/review-T1-A/P-1-err_user-sai.png` (x 300, y 557, w 683, h 495) | `engine.ts:1988` (`exampleEn: prompt.front`); `V1DailyRun.tsx:1290-1317` | B2 (bằng chứng), D6 | NHẸ | Phản hồi sai lặp "Đáp án chuẩn" 2 lần (CharDiffBox + FeedbackPanel) và lặp ghi chú; khung **bằng chứng** (gạch vàng, kiểu trích dẫn) lại in **câu sai** "The informations are useful" như thể là ví dụ đúng; ghi chú lỗi của chính người học bị gắn nhãn "Bẫy hay gặp" | `exampleEn` = câu đúng (`back`) hoặc gắn nhãn "Câu bạn viết"; ẩn đáp án trùng ở 1 trong 2 khối |
| 5 | Lưu tiến độ | – | `V1DailyRun.tsx:146-155` + `:163-166` + `:839` | G3 | NHẸ | `attemptIdRef` đọc lúc job trong `saveChainRef` **chạy**, không phải lúc xếp hàng. Nếu bấm "Làm lại câu sai" (gọi `resetPersistence`) trước khi job `finalize` của Recap chạy xong, job cũ thấy `attemptIdRef === undefined` → tạo attempt mới và ghi lại **toàn bộ review + XP lần 2**. Cửa sổ vài chục ms, khó gặp nhưng là lỗi trùng dữ liệu | Chụp `attemptId` theo từng run (closure/ref theo `runId`), hoặc `await saveChainRef.current` trước khi reset |
| 6 | Câu thắng (V1-6) | – | `engine.ts:1563` | V1-6 | NHẸ | `computeLastWeekAccuracy` bỏ attempt `in_progress`; mọi run thoát bằng ✕/đóng tab (không vào Recap) ở mãi `in_progress` → người hay thoát giữa chừng không bao giờ có số "tuần trước". Không bịa số (đạt V1-6), chỉ là mất dữ liệu thật | Tính cả attempt `in_progress` có `reviewsSaved > 0`, hoặc finalize khi thoát màn |
| 7 | Attempt rác | – | `engine.ts:3125` (`total: Math.max(1, …)`) | G3 | NHẸ | Chỉ bấm "Đã xem" ở 1 thẻ intro rồi thoát → DB có attempt `score 0 / total 1` (đã thấy khi bấm thử kịch bản B). Nếu attempt như vậy được chốt sẽ kéo tỷ lệ tuần trước xuống 0% | Không tạo attempt khi `attemptItems.length === 0` (chỉ lưu thẻ) hoặc để `total` = 0 và bỏ qua khi tính |
| 8 | `recog` sai | 390×844 dark, ảnh `out/review-T1-A/S390-recog-sai.png` (x 38, y 1015, w 315, h 30) | `engine.ts:1677-1679` (có từ trước T1-A) | B2 (lý do) | NHẸ | "Lý do" chỉ lặp lại nghĩa đúng (`"didactic" có nghĩa chuẩn là …`), không nói vì sao lựa chọn đã bấm sai | Thêm 1 câu phân biệt nghĩa nhiễu đã chọn (hoặc `vnTrap`) |
| 9 | `attemptRepo.finalize` không payload | – | `attemptRepo.ts:165` | G3 | NHẸ | Nhánh không payload cập nhật streak vô điều kiện (kể cả 0 review). V1 hiện không gọi nhánh này | Áp `qualifiesForStreak` như nhánh có payload |

Ghi nhận ngoài quyền T1-A (không tính lỗi builder): `placementData.ts` kéo `v1_fixtures` vào bundle (fixer sửa); header PlayScreen 3 NẶNG (T1-B); `<kbd>` 11 px (T3-A); dữ liệu không có trường `review.verdict` ở `words.json` (0/2207 – C2, việc của T3-B, V1 dùng toàn bộ làm pool); 1670/2207 từ thiếu audio UK nên `listen_spell` của từ vựng cũng gặp vấn đề như #2 (có từ trước, nhưng V1-1 nay mở được các mặt này thật).

## 3. Rubric
Không chấm ở đợt 1.

## 4. Chức năng (bấm thử, Chrome headless, dev server 5206)

Script: `out/review-T1-A/hands-on.mjs`, `probe.mjs`, `checkpoint.mjs`, `smalltext.mjs`, `noaudio.mjs`; log `out/review-T1-A/hands-on.log`. 0 `console.error`/`pageerror` ở mọi kịch bản.

**Kịch bản A – seed DB, 1 đúng 1 sai, reload:** seed 4 thẻ `vocab:*#recall_meaning` (Review, đến hạn, reps 3) + `tfng`, `head`, `ltrap`, `err:l1col_`, `err:user_x1` (có userItem), `err:user_nope` (không có item).
- Thẻ đúng `vocab:didactic#recall_meaning`: review rating 3, prevState 2; reps 3 → 4, state Review, due **+336 h**.
- Thẻ sai `err:l1col_impact_a_profound_impact_on#err_fix` (render `err_user`: câu bẫy "a big impact on" → gõ "a profound impact on"): rating 1, lapses 0 → 1, state 2 → **3 (Relearning)**, due **+0,17 h**.
- Sau reload: đúng 2 review, attempt `in_progress` score 1/2, XP 10, `reviewsSaved 2`.
- Nội dung ↔ thẻ: node `vocab:didactic` chứa đúng nghĩa của chính item (`data-item-id` khớp nội dung).
- `err:user_nope` bị bỏ khỏi run, có đúng 1 event `missing_item` cardId `err:user_nope#err_fix`.
- Với reps 1 (tránh luật "nghỉ hưu" của thẻ retry): 5 mặt mới `err_user` (l1col, userItem), `head_retry`, `ltrap_replay`, `tfng_retry` đều hiện **đúng item** (đoạn văn, câu phát biểu, đáp án, trích bằng chứng tô sáng). Phản hồi sai có Đáp án + lý do tiếng Việt + trích dẫn (B2 đạt ở tfng/head/ltrap/err_user/recog).

**Kịch bản B – DB rỗng / intro:** DB rỗng → EmptyState "Chưa có thẻ nào để ôn", **0 thẻ, 0 thẻ `source:fixture`**, Dexie version 20 (v2). "Bắt đầu với 15 từ khởi động" → 15 thẻ `recog` New `curriculum`. Intro → "Đã xem" → reload: thẻ có `introSeenAt`, state New; run mới hiện item đó ở mặt **recog** (không intro lại).

**Kịch bản C – hạn mức ngày (V1-9):** seed 15 review `prevState New` hôm nay (gameId v2) + 5 thẻ New → "Hôm nay đã ôn xong … hạn mức thẻ mới hôm nay đã dùng hết". Seed 13 → "Lượt chạy hôm nay: **2 thẻ**".

**Kịch bản D – migrate DB v1 thật trong Chrome (P8):** tạo IndexedDB `LexiconV3DB` version 10 (= Dexie v1, đủ 10 bảng + index) có 1 card, 1 attempt V1, 1 kv → mở `#/play/v1`: version 20, có bảng `userItems`, card giữ nguyên và chơi được ("Lượt chạy hôm nay: 1 thẻ"), attempt cũ `status: final`, kv `keep = 42`. Kèm test đơn vị `userItems.test.ts` (fake-indexeddb) migrate v1 có dữ liệu → v2.

**Checkpoint (V1-7):** 20 thẻ → màn checkpoint "Tiến độ đã được lưu." → reload → 20 review trong DB (câu chữ đúng sự thật).

**Danh sách nút trong KE-HOACH:** HUD (Chặng, chấm tiến độ, XP, nút Chế độ bận), RunMap, pill mặt/Làm lại/CEFR/POS, intro (Đã xem, Tôi biết rồi), 4 lựa chọn + phím 1–4, ô gõ + Enter + Gợi ý (H) + Không nhớ + Nộp, phản hồi + Tiếp/Enter, checkpoint (Lưu & Dừng, Đi tiếp), EmptyState (2 nút), màn "đã ôn xong": **còn**. Boss và Recap không bấm hết trong đợt này (chỉ đọc code: `finishAtCheckpoint` → Recap → `persist(final)`), không thấy mất.

## 4b. Bảng tiêu chí ĐẠT (`phu-luc/A` §2.6, `01` G1)

| Mã | Tiêu chí ĐẠT | Kết quả | Bằng chứng |
|---|---|---|---|
| G1 (phần V1) | V1 hiện đúng item cho thẻ của game khác; bỏ fallback `[0]`; thiếu item → bỏ node + `missing_item`; `userItems` + `upsertWithCard` 1 transaction | **Đạt một phần** | grep = 0; kịch bản A (5 mặt mới đúng item, `missing_item` ghi đúng); test rollback `upsertWithCard`. **Chưa đạt** với `ltrap_replay`/`dict_full` khi thiếu audio (lỗi #1, #2): V1 không "phát đúng đoạn bẫy" mà lộ transcript / chấm Again thẻ không làm được |
| G3 (phần V1) | 5 thẻ → reload → 5 review | Đạt | E2E builder + kịch bản A, checkpoint |
| P8 | tăng version + migrate + test DB cũ có dữ liệu | Đạt | `db.ts` version(2) + upgrade; `userItems.test.ts`; kịch bản D trong Chrome |
| B3 | FSRS chỉ ghi qua `src/core/srs` | Đạt | V1 dùng `scheduleCard`/`createNewCard`; không gán `due/stability` tay (grep). `introSeenAt` không phải lịch |
| V1-1 | intro 1 lần, "Đã xem" → recog cùng run, ngày sau không intro, mặt New khác hiện đúng mặt | Đạt | unit `srsContent.test.ts:83-152`; E2E builder; kịch bản B |
| V1-2 | mọi tiền tố có renderer, id lạ → bỏ node, không review | Đạt (trừ ghi chú audio ở G1) | unit `srsContent.test.ts:154-262`; kịch bản A |
| V1-3 | DB rỗng không ghi fixture; build không có `v1_fixtures` | **Đạt phần T1-A** / bundle chưa đạt | EmptyState 0 thẻ fixture; dist còn 1 file do `placementData.ts` (ngoài quyền) |
| V1-4 | 50 từ → ≥ 30 bộ nhiễu; không còn "khái niệm học thuật khác" | Đạt | unit `srsContent.test.ts:285-312` (dữ liệu thật); ảnh recog: nhiễu cùng từ loại |
| V1-5 | cùng item, reps 0..3 → ≥ 2 vị trí | Đạt | unit `srsContent.test.ts:314-345`; `seed.ts` FNV + mulberry |
| V1-6 | `lastWeekAccuracy=null` → không chứa "tuần trước" | Đạt | unit `:347-372`; `computeLastWeekAccuracy` lấy attempt thật (ghi chú #6) |
| V1-7 | checkpoint → reload → 20 review | Đạt (chức năng) / thiếu test | kịch bản checkpoint của reviewer; lỗi #3 |
| V1-8 | sai ở node 19, retry chèn vị trí 22 → 1 checkpoint | Đạt | unit `srsContent.test.ts:443` |
| V1-9 | 2 run cùng ngày tổng thẻ mới ≤ 15 | Đạt | unit `:374`, `extras.test.ts:111`; kịch bản C (15 → 0 thẻ mới, 13 → 2) |

## 5. So với tham chiếu
Không làm ở đợt 1.

## 6. Luật script chưa đo, đã kiểm bằng cách nào
- B2: mở ảnh phản hồi sai của recog, tfng_retry, head_retry, ltrap_replay, err_user (mục 4) – có đủ 3 phần; lỗi #4, #8 là chất lượng.
- B3, P8: đọc diff + test đơn vị + kịch bản D trong Chrome.
- D4 khi có thẻ: script đo computed font-size mọi phần tử có chữ (mục 1).
- Q5/Q6: grep diff + so chuỗi UI với master (mục 1).

## Phán quyết: **TRẢ VỀ** (1 vòng fixer, phạm vi nhỏ)
Móng lưu trữ, migrate, FSRS, V1-1…V1-9 làm thật và đã kiểm lại bằng tay; số trong BAO-CAO đúng. Trả về vì 2 lỗi NẶNG trong code T1-A làm sai đúng thứ G1 nhắm tới (chấm FSRS trên câu không làm được / đáp án lộ sẵn): #1 `ltrap_replay` lộ transcript chứa đáp án khi thiếu MP3 (28/32 episode), #2 `dict_full` thiếu audio vẫn chấm Again (240/300 câu). Fixer làm #1, #2, thêm E2E #3; #4–#9 NHẸ sửa trước merge. Riêng `placementData.ts` (v1_fixtures trong dist): điều phối giao fixer như đã định.
