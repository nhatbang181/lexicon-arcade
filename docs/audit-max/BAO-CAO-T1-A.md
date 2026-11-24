# BAO-CAO T1-A · Kho thẻ SRS có nội dung + V1 đúng

Nhánh `audit-max/T1-A` (từ `8c7d1fd`). Chỉ ghi việc đã làm và số đo. Không có điểm tự chấm.

## 1. Mã lỗi

| Mã | Trạng thái | Bằng chứng (test / số đo) |
|---|---|---|
| G1 Thẻ SRS có nội dung | ✅ phần của T1-A | Bảng `userItems` + `userItemRepo.upsertWithCard` (1 transaction, có test rollback); V1 có renderer `tfng_retry`, `head_retry`, `ltrap_replay`, `dict_full`, `err_user`; `grep "?? content\.[a-z]*\[0\]" src/games` = 0. Producer của game khác ghi `userItems` thuộc T2-A/B/C → `HANDOFF.md` mục 5. E2E chéo "sai Q4 ở L1 → V1 phát đúng đoạn Q4" chỉ kiểm được sau T2-B (phần V1 đã có test: `srsContent.test.ts` "ltrap:…", `extras.test.ts`) |
| G3 (phần V1) lưu giữa phiên | ✅ | `attemptRepo.saveProgress/finalize` (idempotent, test); V1 lưu debounce 500 ms, ngay ở checkpoint, flush `pagehide`/ẩn tab/rời màn. E2E: 5 thẻ → reload → 5 review + `due` đổi; rời route ngay sau câu trả lời vẫn đủ 2 review |
| V1-1 intro lặp | ✅ | `introSeenAt` + chèn `recog` cùng run; ngày sau không intro; mặt `recall_*`/`listen_spell` ở state New hiện đúng mặt (unit + E2E) |
| V1-2 hiện sai item | ✅ | Mọi tiền tố có renderer, id lạ → `null`, node bị bỏ, `missing_item` ghi ≤ 1 lần/thẻ/ngày; item `para` kiểu `not_equivalent` không làm thẻ V1 |
| V1-3 ghi fixture vào DB thật | ✅ | DB rỗng → EmptyState; E2E: 0 card `source:fixture`; `V1DailyRun.tsx` không import fixture. `grep v1_fixtures dist` còn 1 file do `placementData.ts` (ngoài quyền, mục 1 HANDOFF); sửa tạm file đó → grep rỗng |
| V1-4 nhiễu cố định | ✅ | Nhiễu seed theo `thẻ|reps|ngày|lần retry`, ưu tiên cùng từ loại + chủ đề + độ dài ±40%; test dữ liệu thật: 50 từ ≥ 30 bộ nhiễu khác nhau; hết chuỗi "khái niệm học thuật khác" |
| V1-5 vị trí đáp án cố định | ✅ | `placeCorrectSeeded`; test: cùng thẻ reps 0..3 ≥ 2 vị trí; cùng seed lặp lại y hệt; áp dụng cả `para_match` |
| V1-6 bịa "tuần trước" | ✅ | Không còn so sánh bịa; `computeLastWeekAccuracy` từ attempt V1 đã kết thúc 7–14 ngày trước, component truyền vào |
| V1-7 checkpoint không lưu | ✅ | Lưu ngay khi vào checkpoint (code) và câu chữ đã đúng sự thật. Chưa có E2E riêng cho checkpoint (cần ≥ 20 thẻ) ⏳ phần test |
| V1-8 checkpoint giả | ✅ | `insertNodeInStage`: node chèn lấy `stageIndex` của node đứng trước; test chạy trọn 2 chặng có 1 câu sai ở node 19 → đúng 1 `stage_checkpoint` |
| V1-9 hạn mức thẻ mới theo ngày | ✅ | `cardRepo.countNewCardsStartedSince(đầu ngày)` → `newCardsDoneToday`; test 15/14/13 đã học → 0/1/2 thẻ mới |
| V1-10 chẩn đoán bẫy sai | ✅ | Bỏ `?? l1Traps[0]`; chỉ hiện `whyVi` khi cụm gõ khớp từ trong bẫy |
| V1-11 dự báo ngày mai | ✅ | Hết ngày mai theo giờ máy (test 23:00) |
| V1-12 XP "Đã xem" | ✅ | "Đã xem" 0 XP; +5 ở lượt `recog` đúng đầu tiên của thẻ mới |
| V1-13 tự phát âm intro | ✅ | Sau 250 ms; trình duyệt chặn autoplay thì im lặng |
| V1-14 bản đồ mở đầu | ✅ | `startOnMap: true`, màn bản đồ + Enter/nút "Bắt đầu" |
| V1-15 `#000000` | ✅ | `grep "#000000" src/games` = 0; token `--color-boss-dim` chờ T3-A (HANDOFF mục 2) |
| V1-16 chữ "quay lại sau 3–5 node" | ✅ | Chữ theo pha (Boss: "ở cuối Boss"), bỏ chữ "node" |
| Bổ sung: D4 (chữ < 12 px) trong V1 | ✅ trong file của T1-A | Số node RunMap 10 px → 12 px; chip phím tắt trong nút V1 thay bằng chữ "(Enter)", "(H)". Chip 11 px của `AnswerInput`/`FeedbackPanel` → HANDOFF mục 3 |
| B5 câu hỏi ≤ 80 px | ⏳ | Không thuộc T1-A (U1/HUD là T4-A, HANDOFF mục 6); ở 390×844 thẻ bắt đầu y = 356 |

## 2. File sửa (`git diff --name-only master...`, nằm gọn trong danh sách độc quyền)
- Lưu trữ: `src/core/storage/db.ts` (Dexie v2, bảng `userItems`, migrate), `repos/userItemRepo.ts` (mới), `repos/attemptRepo.ts` (`saveProgress`, `finalize`), `repos/cardRepo.ts` (`countNewCardsStartedSince`), `repos/index.ts`, `backup.ts` (`userItems` tùy chọn), `userItems.test.ts` (mới).
- SRS: `src/core/srs/fsrsAdapter.ts` (`SRSCard.introSeenAt?`, `CardSource` thêm `'fixture'`).
- V1: `engine.ts`, `V1DailyRun.tsx`, `RunMap.tsx`, `content.ts`, `extras.ts`, `seed.ts`, `starter.ts` (mới), `engine.test.ts`, `srsContent.test.ts`, `extras.test.ts` (mới).
- `src/test/fixtures/v1_fixtures.ts` (kiểu bundle chuyển sang `content.ts`; thẻ fixture đặt `source:'fixture'`).
- `e2e/v1-srs.spec.ts` (mới), `docs/audit-max/KE-HOACH-T1-A.md`, `HANDOFF.md`, `BAO-CAO-T1-A.md`, `anh-sau/T1-A/**`.
- Không commit: `playwright.t1a.config.ts` (port 5211), `out/`, `test-results/`.

## 3. Số đo trước → sau (cùng máy, cùng công cụ)
| Kiểm | Trước | Sau |
|---|---|---|
| `npx tsc --noEmit -p .` | 0 lỗi | 0 lỗi |
| `npm test` | 377 pass / 31 file | **419 pass / 34 file** |
| `npx vitest run src/core/storage src/core/srs src/games/v1-daily-run` | – | 76 pass / 7 file |
| `npm run validate:data` | PASS | PASS |
| `e2e/v1-srs.spec.ts` | chưa có | 4/4 pass, 0 `console.error`/`pageerror`; `e2e/m1.spec.ts` vẫn pass |
| `grep -rn "?? content\.[a-z]*\[0\]" src/games` | có (V1: 5 chỗ trong engine) | **0** (V1 = 0; game khác = 0) |
| `grep -l v1_fixtures dist/assets/*.js` | 1 file (entry) | 1 file (entry, do `placementData.ts`); khi sửa tạm 2 dòng ở `placementData.ts`: rỗng |
| `audit-ui play/v1` (3 khung × 2 theme) CHẶN | 38 (D4: 8 ở 820, 11 ở 1280, mỗi theme) | **0** |
| `audit-ui play/v1` NẶNG mỗi khung | 6 (390) · 8 (820) · 8 (1280) | **3** mỗi khung: D3 ×2 + D7 (cả 3 ở header `PlayScreen.tsx` của T1-B) |
| `audit-ui today` (T1-A không sửa route này) | 24 CHẶN · 94 NẶNG | 28 CHẶN · 62 NẶNG (số đổi giữa hai lượt đo, chưa rõ nguyên nhân; không có file nào của T1-A nằm trong màn Today) |
| Tổng `audit-ui` 12 lượt | 62 CHẶN · 138 NẶNG | 28 CHẶN · 80 NẶNG (toàn bộ CHẶN còn lại ở `today`) |

Lưu ý đo: `audit-ui` mở V1 với DB trống nên chỉ đo EmptyState. Trạng thái có thẻ được chụp bằng script seed IndexedDB (ngoài công cụ), 14 mặt × (đúng/sai) ở 390×844 tối + vài mặt ở 820, 1280, 390 sáng: ở các khung đó 0 tràn ngang; chữ < 12 px còn lại chỉ là chip `↵` của `AnswerInput`/`FeedbackPanel` (design, HANDOFF mục 3).

Đã mở xem bằng mắt: `390x844-dark-play_v1-loi.png`, `1280x800-dark-play_v1-loi.png`, `820x1180-light-play_v1-loi.png` (viền cam chỉ ở header PlayScreen), cùng các ảnh `seed-*-tfng_retry*.png`, `seed-*-ltrap_replay-sai.png`, `seed-*-intro.png`.

## 4. Ảnh và video (`docs/audit-max/anh-sau/T1-A/`)
- `audit-ui`: `{390x844,820x1180,1280x800}-{dark,light}-{play_v1,today}[-loi].png`, `report.json`, `BAO-CAO.md`; số đo nền trước ở `do-nen-truoc/`.
- Sau tương tác (DB có thẻ): `seed/seed-<khung>-<theme>-<mặt>.png` và `…-sai.png` (sau khi trả lời sai, toàn trang), `seed-…-map.png`.
- Video: `seed/v1-recog-390x844-dark.webm` (Playwright `recordVideo`, bản đồ → thẻ nhận diện → trả lời → phản hồi, ~8 s; dài hơn mốc 3–5 s).

## 5. Chức năng giữ nguyên (đối chiếu `KE-HOACH-T1-A.md` mục 1–10)
HUD (pill chặng, Boss, nút Chế độ bận, chấm tiến độ, combo, XP), RunMap, thẻ node + pill, intro ("Tôi biết rồi", "Đã xem", phát âm), 4 lựa chọn + phím 1–4 + gợi ý loại, 5 mặt gõ + Enter + Nộp + Gợi ý + Không nhớ + lượt nghe giới hạn, phản hồi (banner collocation, CharDiffBox, FeedbackPanel, Enter, tự chuyển 1,2 s), checkpoint ("Lưu & Dừng", "Đi tiếp"), Boss, Recap (4 thẻ số, làm lại câu sai, Về Hôm nay). Thay đổi có chủ ý: nhãn nút ghi phím tắt bằng chữ thay cho chip; "Đã xem" không còn "+5 XP"; "Ôn thêm" không còn lấy thẻ mới; không còn tự dựng run bằng fixture khi DB rỗng. Thêm: EmptyState, màn lỗi, màn "đã ôn xong", bản đồ mở đầu, 5 mặt mới.

## 6. Quyết định (điều phối gộp vào `DECISIONS.md`)
- `userItems` giữ đúng trường của spec, thêm `kind` ('error'|'collocation'|'tfng'|'head'|'ltrap'|'dict'|'other'); `back` có thể liệt kê đáp án thay thế ngăn bằng `|` hoặc `;`.
- `saveProgress` nhận **toàn bộ** review của phiên (chỉ thêm cuối); repo tự ghi phần chưa ghi và chỉ cộng phần chênh XP; ≥ 5 review giữa phiên là đủ điều kiện streak. Attempt có `status`, `reviewsSaved`, `xpApplied` (trường không index nên chỉ cần Dexie v2 cho bảng mới; migrate đặt `status:'final'` cho attempt cũ).
- `SRSCard.introSeenAt` (không dùng `kv`): thẻ mở khóa từ từ đã trả lời cũng được đánh dấu để không phải xem intro.
- Backup: `userItems` là trường tùy chọn, `BACKUP_SCHEMA_VERSION` giữ 1, backup cũ vẫn xác minh được (có test).
- Thẻ khởi động khi DB rỗng: 15 từ B2/C1 có `freqZipf` cao nhất từ `words.json`, thẻ `recog` mới, `source:'curriculum'` (không dùng `placementData` để không kéo fixture vào V1).
- Ôn thêm (`extra_practice`) chỉ lấy thẻ đã học (state ≠ New); hạn mức thẻ mới tính trên mọi game theo ngày giờ máy (T1-B sẽ đổi mốc 04:00 theo F3).
- Item `para` có `relation:'not_equivalent'` (V3 Level 4) không thành thẻ V1.
- `scoreListeningAnswer` (T2-B) dùng làm hàm chấm `ltrap_replay`; `alignTranscript` chấm `dict_full` (đúng hết = Good, sai ≤ 1 từ với câu ≥ 7 từ = Hard).
- Gợi ý ở thẻ chọn đáp án luôn chừa ≥ 2 lựa chọn (trước đây loại tới còn 1). Thẻ `dict_full` không có Gợi ý.
- Reading retry: câu hỏi + lựa chọn lên trước, đoạn văn nằm trong khung cuộn (`max-h 36vh`); bằng chứng chỉ tô sau khi trả lời.
- Phần seed của E2E nằm trong `e2e/v1-srs.spec.ts` (không tạo `e2e/fixtures/seed-profile.ts` vì ngoài danh sách độc quyền).

## 7. Chỗ chưa chắc
- Chưa có E2E riêng cho checkpoint/Boss/Recap và chưa chạy profile hiệu năng; checkpoint chỉ kiểm bằng đọc code.
- Cờ `pagehide` ghi IndexedDB lúc đóng tab thật chưa kiểm bằng trình duyệt (chỉ kiểm đổi route và `visibilitychange` theo logic); phần rời route đã có E2E.
- `ltrap_replay`/`dict_full` chưa kiểm nghe thật (headless); đoạn bẫy dùng `currentTime` + `timeupdate`. Episode chưa có MP3 (28/32) hiện chữ kịch bản thay audio.
- 3 NẶNG còn lại của `play/v1` và D4 của chip 11 px nằm ngoài quyền (HANDOFF).

## Vòng fixer 1 (đợt audit-max, trả về từ REVIEW-T1-A-A)

| Mã lỗi | Đã sửa thế nào | File | Số đo sau |
|---|---|---|---|
| #1 NẶNG `ltrap_replay` lộ transcript khi thiếu MP3 | `loadV1Extras` kiểm file audio (HEAD, coi `text/html` của SPA là "không có"); thiếu → không dựng ref, ghi `missingAudio`; `resolveV1Face` trả `null` → bỏ node, không review/FSRS, `missing_item` kèm `reason:'missing_audio'`. Bỏ hẳn khối hiện `transcriptLine` trước khi trả lời; câu báo lỗi audio không còn nói "đối chiếu IPA" cho thẻ nghe | `extras.ts`, `content.ts`, `engine.ts`, `V1DailyRun.tsx` | `audioMissing.test.ts`: thiếu MP3 → 0 node, 0 review; có MP3 → giữ node |
| #2 NẶNG `dict_full` thiếu audio chấm Again | Cùng cơ chế cho `dict:*` (truyền `dictations` vào `loadV1Extras`); thêm `refundNodeAudioPlay`: audio lỗi khi phát thì trả lại lượt nghe | `extras.ts`, `engine.ts`, `V1DailyRun.tsx` | test: `dict:0011` (không MP3) bị bỏ, `dict:0001` giữ; hoàn lượt đúng node |
| `v1_fixtures` trong bundle | Bỏ import + `V1_FIXTURE_VOCAB` trong `buildStarterVocabCards` (chỉ dùng id từ `words.json`; nạp lỗi → không tạo thẻ, V1 hiện EmptyState) | `placementData.ts` | `vite build` + `grep -l v1_fixtures dist/assets/*.js` = **rỗng** |
| #3 NHẸ thiếu E2E V1-7 | Ca E2E: seed 25 thẻ, trả lời 20 → "Tiến độ đã được lưu" → reload → 20 review, attempt `in_progress` `reviewsSaved 20`, thẻ đầu run sau không thuộc 20 thẻ đã ôn | `e2e/v1-srs.spec.ts` | 5/5 E2E pass |
| #5 NHẸ ghi trùng khi "Làm lại câu sai" nhanh | Tách `progressSaver.ts`: mỗi run 1 session, job chụp session lúc xếp hàng nên job `finalize` run cũ không tạo attempt mới; bỏ lần `saveProgress` thừa ngay sau khi tạo attempt | `progressSaver.ts`, `V1DailyRun.tsx` | `progressSaver.test.ts` 3 test (có ca reset trước khi job chạy) |
| #4 NHẸ `err_user` in câu sai vào khung bằng chứng | `exampleEn` = câu ví dụ đúng của cụm (`l1col`), bỏ cho `userItem` (không có ví dụ đúng riêng); bỏ `vnTrap` lặp ghi chú (không còn nhãn "Bẫy hay gặp" gắn vào ghi chú lỗi của người học) | `engine.ts` | `srsContent.test.ts`: bằng chứng ≠ câu sai, `vnTrap` rỗng |
| #6 NHẸ run thoát giữa chừng không vào "tuần trước" | `computeLastWeekAccuracy` tính attempt `in_progress` có `reviewsSaved > 0` | `engine.ts` | test mới: 75% |
| #7 NHẸ attempt rác `0/1` | `total` giữa phiên = số lượt đầu thật (0 được phép); chỉ Recap mới `max(1, …)` | `engine.ts` | test: chỉ xem intro → `total 0` |
| #8 NHẸ `recog` sai không nói vì sao | Thêm 1 câu: lựa chọn đã bấm là nghĩa của từ khác | `engine.ts` | `tsc`, 87 test |
| #9 NHẸ `finalize` không payload | Dùng `qualifiesForStreak` như nhánh có payload (hành vi không đổi vì chốt 1 phiên luôn đủ điều kiện; chỉ thống nhất luật) | `attemptRepo.ts` | test storage pass |

Số đo vòng này: `tsc` 0 lỗi · `npm test` 430/430 · `validate:data` PASS · `vitest storage+srs+v1-daily-run` 9 file / 87 test · `e2e/v1-srs.spec.ts` 5/5 · build + grep `v1_fixtures` rỗng · `audit-ui play/v1` (390×844, 1280×800, 2 theme): **0 CHẶN**, 12 NẶNG = 3/khung, đều ở header `PlayScreen.tsx` (T1-B). Ảnh track không bị ghi đè, không commit ảnh e2e.

Chưa làm / ghi chú: `listen_spell` của từ vựng (`vocab.audio.uk`, 1670/2207 từ thiếu audio) vẫn chưa kiểm audio (reviewer ghi là có từ trước, ngoài danh sách sửa vòng này); kiểm tồn tại audio dùng HEAD nên khi offline hoàn toàn (lỗi mạng) thẻ nghe vẫn vào run.
