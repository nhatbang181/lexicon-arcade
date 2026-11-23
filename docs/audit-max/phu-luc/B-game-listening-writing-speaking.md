# Audit nhóm B — Lexicon Arcade V3 (L1, L2, W1, W2, chấm Claude, Speaking, audio)

> Phạm vi: chỉ đọc. Không sửa file nào trong `D:\English`. Ngày audit: 2026-11-23.
> Đường dẫn trong báo cáo là đường dẫn tương đối từ `D:\English`. Số dòng lấy theo `wc -l` thật (một số file dài hơn số liệu PowerShell báo).
> Cách kiểm chứng: đọc code và docs, chạy thử `scoreListeningAnswer` / `gradeDictationSentence` bằng `tsx` từ thư mục scratchpad (không ghi vào repo), quét dữ liệu `public/data` và `public/audio`.

---

## 0. Tóm tắt điều hành

| Game | Cơ chế | Độ vui | Sư phạm | Độ khó | Phần thưởng | Juice | TB |
|---|---|---|---|---|---|---|---|
| L1 Trap Detector | 7 | 4 | 6 | 4 | 3 | 2 | **4,3** |
| L2 Dictation Ladder | 7 | 5 | 6 | 4 | 4 | 5 | **5,2** |
| W1 Essay Lab | 7 | 3 | 6 | 3 | 3 | 2 | **4,0** |
| W2 Writing Sprints | 7 | 6 | 5 | 4 | 5 | 5 | **5,3** |
| S1 / S2 / X1 | — | — | — | — | — | — | **chưa có game** (0/10) |

**5 vấn đề nặng nhất**
1. **P0 · L1 “nghe” mà thực ra là đọc:** 28/32 episode không có MP3 (chỉ có `p1_001`, `p2_001`, `p3_001`, `p4_001`). Khi đó trình phát chuyển sang “chế độ mô phỏng” im lặng và hiện nút “Đọc kịch bản mô phỏng”, **kể cả ở Exam**. Kết quả vẫn được ghi vào band Listening (`src/games/l1-trap-detector/L1TrapDetector.tsx:1791-1836`, `src/core/audio/trackPlayer.ts:278-282`, `src/games/l1-trap-detector/engine.ts:1144-1155`).
2. **P0 · Vòng “lỗi chảy vào SRS” bị đứt ở mọi game trong phạm vi:** L1, L2, W1 và W2 tạo thẻ FSRS chỉ có `itemId` (`err:user_<hash>`, `err:w2_<slug>`, `ltrap:*`, `vocab:<slug>`) mà không lưu nội dung. Vì vậy V1 hiện **`content.errors[0]` / `content.vocab[0]`**, tức một thẻ không liên quan (`src/games/v1-daily-run/engine.ts:853,906`).
3. **P0 · Band Writing bị làm bẩn:** nút “Dán kết quả mẫu” (fixture test) hiện ở bản production. Mẫu được thay sẵn `attemptId` nên qua được kiểm tra. Nút “Phân tích & Lưu” bấm lại được nhiều lần, và mỗi lần lại ghi thêm band evidence và XP, kể cả khi `attemptId` lệch hoặc là bản sửa (`src/games/_shared/GradingPanel.tsx:438-465,640-650`, `src/games/w1-essay-lab/W1EssayLab.tsx:123-126,686-696`).
4. **P0 · W1 có thể mất bài 40 phút:** “tự động lưu nháp” là giả. Code chỉ đặt lại nhãn giờ mà không lưu gì (`W1EssayLab.tsx:394-404`). Nút “Chọn đề khác” xoá bài ngay, không hỏi lại (`:1160`). Exam hết giờ không tự nộp (`:384-392`).
5. **P1 · Chấm đáp án Listening sai với chuẩn IELTS:** số điện thoại gõ có dấu cách (`07741 829 360`) bị chấm `word_limit_exceeded`, ảnh hưởng 4 episode. `"9.30"` chỉ bằng `"9:30"` khi data có sẵn cả hai dạng. `"nine thirty"` thành `39`. `promptUnit` (£ in sẵn) không được dùng. `"second floor"` bị tính là có 1 số nên trượt giới hạn “TWO WORDS” (`src/core/scoring/listeningAnswer.ts:41-45,205-216,254-260,294-378,485-490`).

Ngoài 5 vấn đề trên: L2 chỉ có 60/300 câu có audio. Bộ chọn câu là tất định nên mỗi level luôn ra **đúng 10 câu cố định**. Level 7–10 không có data riêng. `PROGRESS.md` ghi “M3 ✅ 100%” là sai thực tế.

---

## 1. Thước đo “game thật” dùng trong audit

- **Balatro:** mỗi tương tác chính có ≥ 3 lớp phản hồi (chuyển động + âm thanh + hạt/hiệu ứng). Điểm số đếm lên, có cảm giác “nặng tay”.
- **Duolingo:** bài 3–5 phút, combo, XP bay lên, màn kết quả ăn mừng (đếm số, confetti, câu thắng).
- **Stardew/Celeste:** nhịp đều, phản hồi tay tức thì (< 100 ms), không phạt nặng.
- **Luật riêng của app** (`docs/10-MOTION-AND-SOUND.md`): khi đang phát audio học hoặc đang viết thì **cố ý im lặng**. Vì vậy thiếu juice ở pha nghe/viết **không** bị trừ điểm. Thiếu juice ở pha chấm, recap và mốc thì bị trừ.

**Thiếu chung, ảnh hưởng mọi game nhóm B** (xem thêm §7):
- `src/design/components/RecapScreen.tsx` (171 dòng) là màn tĩnh: không đếm số 0→N trong 0,8 s, không stagger 60 ms, không confetti. `canvas-confetti` không được dùng ở bất kỳ đâu trong `src/`. Lệch `docs/10` §2 (dòng Recap và dòng mốc).
- Không có rung (`navigator.vibrate`) ở đâu cả.
- `src/app/screens/PlayScreen.tsx:120` luôn truyền `mode="training" level={1}` và bỏ qua kết quả `onExit`. Vì vậy adaptive `src/core/adaptive/difficulty.ts` **không game nào dùng** (grep chỉ thấy `core/index.ts` export).

---

## 2. L1 · Trap Detector

### 2.1 Cơ chế và vòng lặp
- Vòng lặp: Chọn episode → Preview 30 s (training có chip đoán loại đáp án) → Nghe → (Exam: soát 30 s) → Chấm → Debrief (nghe lại đoạn đáp án và đoạn bẫy, transcript, tự gắn nhãn bẫy +5 XP) → Recap. Khớp spec §3.
- Độ dài phiên: 4–6 phút audio + 30 s preview + debrief. Phù hợp khung 5–12 phút.
- Điểm quyết định: chọn đáp án trong lúc nghe, tự gắn nhãn bẫy. Chip dự đoán không được chấm nên không phải điểm quyết định thật (xem L1-07).

### 2.2 Điểm mạnh đáng giữ
- **Debrief rất tốt về sư phạm:** sóng âm xanh/đỏ bấm được, nút “Nghe đoạn đáp án” và “Nghe đoạn bẫy” có timestamp, transcript bấm từng dòng để phát (`L1TrapDetector.tsx:1214-1560`). Đúng P6 (bằng chứng + nghe lại).
- **Tự gắn nhãn bẫy (metacognition)** khoá sau lần chọn đầu, nên không farm XP được (`engine.ts:976-979`). Chọn sai thì hiện nhãn đúng, không phạt.
- `classifyListeningError` kiểm `decoy` **trước** chính tả. Nhờ vậy “13 March” được tính là bẫy, không phải lỗi gõ (`engine.ts:738-746`).
- Exam mode: khoá tua/dừng/tốc độ ở cả UI lẫn `trackPlayer` (`trackPlayer.ts:240-242,288-290,314,346`). Chặn nộp sớm (`engine.ts:646-675`). Không tạo thẻ SRS từ episode `reserved` (`engine.ts:1108`). Catalog lọc bỏ `reserved` (`listeningLoader.ts:90-110`).
- Hỗ trợ đủ map labelling (MapView có phím và aria), MCQ chọn 2 kiểu IELTS, form/note/table.
- `listeningAnswer.ts` có 62 test, phủ word limit, số, ngày, tiền, UK/US, số nhiều.
- Chạy toàn bộ 381 đáp án trong data qua chính bộ chấm với `wordLimit` của nhóm: **0 đáp án tự trượt**.

### 2.3 Juice (tương tác chính và số kênh)
| Tương tác | Motion | SFX | Hạt | Rung | Số kênh |
|---|---|---|---|---|---|
| Chọn MCQ/ô bản đồ khi đang nghe | đổi màu ChoiceButton | `tap`, nhưng bị chặn vì audio đang phát | – | – | 1 (cố ý, đúng spec §10) |
| Gõ đáp án | – | – | – | – | 0 (cố ý) |
| Nộp bài → Debrief | không có chuyển cảnh | `correct`/`flip` (chỉ training, `:305-307`) | – | – | 1 |
| Gắn nhãn bẫy đúng | đổi viền xanh | `correct` (`:1434-1436`) | – | – | 2 |
| Gắn nhãn bẫy sai | đổi viền đỏ | – | – | – | 1 |
| Recap | tĩnh | `sessionDone` (`:347`) | – | – | 1 |
| Combo / +XP bay | không có | – | – | – | 0 |

**Juice 2/10.** Pha nghe im lặng là đúng spec. Debrief và Recap thì quá phẳng.

### 2.4 Danh sách vấn đề

| ID | Vị trí | Vấn đề và lý do | Mức | Cách sửa (thông số) | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| L1-01 | `L1TrapDetector.tsx:1791-1836`; `src/core/audio/trackPlayer.ts:278-282,477-480,510-520`; dữ liệu `public/audio/listening/` | 28/32 episode thiếu MP3. Khi thiếu file, `play()` chuyển sang mô phỏng im lặng và sidebar cho “Đọc kịch bản mô phỏng” **cả ở Exam**. Đây là bài đọc trá hình, lệch spec §13 (“không phụ đề”). Kết quả vẫn ghi band L (`engine.ts:1144-1155`) | **P0** | (a) Render đủ 32 MP3. Nếu chưa render: ẩn episode thiếu audio khỏi catalog (thêm `hasAudio` vào `index.json`, lọc trong `loadListeningCatalog`). (b) Cấm hiển thị transcript khi `session.mode==='exam' \|\| phase==='listening'`. (c) `buildL1SessionSavePayload` không phát `bandEvidence` nếu `trackState.simulatedMode` | Catalog chỉ hiện episode có file. E2E: episode không có MP3 không bắt đầu được ở Exam. 0 band evidence từ phiên mô phỏng |
| L1-02 | `src/core/scoring/listeningAnswer.ts:294-378` (`countIeltsTokens`), `:321-325` | Số điện thoại gõ có dấu cách `"07741 829 360"` bị tính 3 số → `word_limit_exceeded` với “TWO WORDS AND/OR A NUMBER”. IELTS coi đây là 1 số. Đã kiểm trên data: `p1_001`, `p1_002`, `p1_003`, `p1_006` | **P1** | Trước khi đếm: gộp chuỗi nhóm chữ số cách nhau bằng dấu cách hoặc gạch nối, tổng ≥ 6 chữ số (`/\b\d{2,}(?:[ -]\d{2,})+\b/` → bỏ dấu cách). So khớp canonical cũng bỏ dấu cách trong chuỗi số | Test mới: `"07741 829 360"` vs `["07741829360"]` → `correct:true`. 4 episode trên qua kiểm thử biến thể |
| L1-03 | `listeningAnswer.ts:485-490` | `"9.30"` chỉ đổi thành `9:30` khi có am/pm. Thử: `"9.30"` vs `["9:30"]` → `minor_spelling_error`. Spec §4.2 yêu cầu bằng nhau. Hiện “chạy được” chỉ vì data nhân đôi `accepted` | P1 | Đổi regex thành `(\d{1,2})[.:](\d{2})\b` (am/pm tuỳ chọn), chỉ áp dụng khi giờ ≤ 24 và phút < 60 | `"9.30"`, `"9:30"`, `"9.30am"` đều khớp `"9:30"`. Thêm ≥ 4 test |
| L1-04 | `listeningAnswer.ts:254-260` (`parseNumberWords`) | `"nine thirty"` → `39` (cộng dồn), nên sai với `9:30`. Spec ghi rõ `"nine thirty"` = `9:30` | P1 | Nhận diện mẫu giờ: `ONES(1-12) + (TENS \| "fifteen" \| "o'clock" \| "oh five")` → `H:MM`. Thêm “half past / quarter to” | `"nine thirty"`, `"half past nine"` khớp `9:30`; `"quarter to ten"` khớp `9:45` |
| L1-05 | `listeningAnswer.ts:41-45` | `promptUnit` được khai báo nhưng không có chỗ nào đọc. Thử: `"£12.50"` vs `["12.50"]` → `wrong_answer`. Lệch spec §4.2 (tiền khi đơn vị in sẵn) | P1 | Nếu `promptUnit` có mặt hoặc `accepted` không có ký hiệu tiền: bỏ ký hiệu tiền / đơn vị ở cả 2 phía trước khi so. Engine truyền `promptUnit` từ `template.rows[].label` (vd “Monthly fee (£)”) | `"£12.50"` = `"12.50"` khi `promptUnit:'£'`. Test |
| L1-06 | `listeningAnswer.ts:205-216,389-390` | `isNumberWordToken` coi `second`, `first`, `one` là số. Vì vậy `"second floor"` dưới “NO MORE THAN TWO WORDS” (words_only) bị `word_limit_exceeded` dù chính là đáp án đúng (đã thử) | P2 | Ở mode `words_only`: tính token chữ số-từ là *word*, chỉ token chữ số thật (`\d`) là *number* | `"second floor"` hợp lệ với TWO WORDS. Test |
| L1-07 | `L1TrapDetector.tsx:927-962,1124-1154`; `engine.ts:468-483` | Chip “đoán loại đáp án” chỉ lưu lại, không bao giờ so với đáp án. Spec §6 có “Q1 [tên riêng ✓]”. Dự đoán không có phản hồi thì không học được chiến lược | P2 | Thêm `answerType` vào data (hoặc suy ra: regex số/ngày/tên viết hoa/-s). Debrief hiện ✓/✗ cho từng dự đoán, +2 XP mỗi dự đoán đúng | Debrief có dòng “Dự đoán đúng N/M”. Test engine `scorePredictions` |
| L1-08 | `L1TrapDetector.tsx:684-697` | “Ôn lại câu sai” thực ra phát lại **cả episode** và lại cộng full XP, lại ghi band nếu là Exam. Vi phạm `02` §2.4 (“chơi lại câu vừa làm 0 XP”) và §7 (thi lại không tính band) | P1 | Retry chỉ phát `primaryTrapClip ∪ evidence` của câu sai, chấm lại câu đó, `xp=0`, `countsForBand=false` | Retry xong: attempt mới có `xp=0`, không có `bandEvidence`. E2E |
| L1-09 | `L1TrapDetector.tsx:1594-1604`; `listeningLoader.ts` | Exam dùng chung pool training. Có thể làm lại cùng episode không giới hạn và lần nào cũng tính band. Nút “Đổi bài” giữa Exam không hỏi xác nhận | P1 | Lưu `examDoneEpisodeIds` trong kv. Episode đã làm Exam → lần sau `countsForBand=false` + nhãn “đã làm”. Modal xác nhận khi thoát giữa Exam | Lần 2 cùng episode: 0 band evidence. Thoát giữa chừng có modal |
| L1-10 | `L1TrapDetector.tsx:262-284`; `trackPlayer.ts:236-283` | Hết preview thì tự `play()` bất kể `status` (`loading`/`error`). Spec §11: “Exam không bắt đầu nếu chưa preload 100%”. Không phân biệt lỗi autoplay (`NotAllowedError`) với thiếu file: mọi lỗi `play()` đều thành “mô phỏng” | P1 | Chỉ cho bắt đầu khi `status ∈ {ready}` (lắng nghe thêm `canplaythrough`). Trong `catch` của `play()`: nếu `err.name==='NotAllowedError'` thì giữ `status:'ready'` + hiện nút “Bấm để phát”, không vào mô phỏng | Mock `play()` reject `NotAllowedError` → không vào `audio_missing`. Exam với file đang loading → nút “Bắt đầu nghe” disabled |
| L1-11 | `L1TrapDetector.tsx:229-260` | `startEpisode` không có `catch`: tải episode lỗi → unhandled rejection, không có UI báo lỗi. `listeningLoader.ts:137-159` còn rơi về fixture *khác* với bài đã chọn | P2 | Thêm `catch` → Toast “Không tải được bài, thử lại” + nút thử lại. Không fallback sang episode khác | Ném lỗi giả trong loader → có thông báo, không đổi bài |
| L1-12 | `engine.ts:748-752` | Câu sai bất kỳ có trap không ghi `decoy` đều bị gán `trap:<type>`, kể cả đáp án lạc hẳn. Thống kê “bẫy hay sập” bị phồng | P2 | Chỉ gán `trap:` khi khớp `decoy`, hoặc khi đáp án nằm trong transcript đoạn bẫy (substring sau chuẩn hoá). Còn lại là `wrong_content` | Test: đáp án ngẫu nhiên → `wrong_content` |
| L1-13 | `engine.ts:282-297`; `L1TrapDetector.tsx:1673-1675,1762` | Level 7–8 “không được dừng” (`allowRewind:false`) nhưng `examLocked:false`, nên vẫn tua được bằng Waveform và TrackPlayer `onSeek` | P2 | Thêm `allowSeek` vào config (false ở lv ≥ 7). Truyền `onSeek=undefined` và `interactive=false` | Lv 7: bấm waveform không đổi `currentTime` |
| L1-14 | `L1TrapDetector.tsx:1495-1558` | Transcript tô cả dòng, không tô **từ** decoy/đáp án như wireframe §6 (“▒13th▒ … ▓30th▓”) | P2 | Highlight inline: tìm `decoy` và `accepted[0]` trong `line.text` (không phân biệt hoa thường), bọc `<mark>` đỏ/xanh. Hiệu ứng quét 0,35 s theo `docs/10` | Ảnh chụp debrief có từ được tô |
| L1-15 | `engine.ts:1044-1070,1064` | Câu thắng in key thô `self_correction 3/3` thay vì nhãn tiếng Việt. Không so với trung bình 7 ngày như §7 | P3 | Dùng `LISTENING_TRAP_LABELS_VI`. Đọc attempts 7 ngày để sinh “Lần đầu 10/10 ở Part 2” | Recap hiện nhãn VN. Test câu thắng |
| L1-16 | `L1TrapDetector.tsx:176-178,384-387`; `engine.ts:689-690` | Mỗi tick `timeupdate` (4–20 Hz, mô phỏng 50 ms) gọi `setTrackState` làm render lại cả component 1882 dòng. `getActiveSignpostQid` gọi lại `resolveScriptTimings` + `flatten` mỗi lần | P2 | Tách `useTrackTime()` chỉ cho TrackPlayer/Waveform (ref + rAF). Memo hoá timings theo `episode.id` | React Profiler: < 2 lần render toàn component/giây khi đang nghe |
| L1-17 | `L1TrapDetector.tsx:299-309,1431-1438` | Gọi side-effect (`playSfx`, `setDebriefFilter`) **bên trong** updater của `setSession` → StrictMode chạy 2 lần, SFX kêu đôi ở dev | P2 | Tính `graded` ngoài updater rồi `setSession(graded)`, side-effect gọi sau | Dev StrictMode: 1 tiếng SFX mỗi lần nộp |
| L1-18 | `L1TrapDetector.tsx` (1882 dòng) | Quá 1500 dòng. Gộp picker + 5 view + renderQuestionGroup | P2 | Tách `EpisodePicker`, `QuestionGroupRenderer`, `DebriefView`, `ListeningView` (mỗi file < 500 dòng) | Không file nào > 600 dòng |
| L1-19 | `L1TrapDetector.tsx:896-912,1111-1123`; `src/design/components/AnswerInput.tsx:66-118` | Ô đáp án không có tên truy cập (chỉ có placeholder). `<label>` trong AnswerInput không gắn `htmlFor`. Bộ đếm “x/2 từ” của AnswerInput chỉ đếm chữ, lệch với bộ chấm | P2 | Truyền `aria-label={\`Câu ${q.number}: ${row.label}\`}`, sinh `id` và gắn `htmlFor`. Ẩn bộ đếm ở Exam (đề máy thật không có) | axe: 0 lỗi “form element has no label” |
| L1-20 | `L1TrapDetector.tsx:1166-1563,656-715` | Debrief/Recap không có chuyển động: không trượt vào, không count-up, không +XP bay, không confetti khi 10/10 | P2 | Debrief card stagger 60 ms; số điểm count-up 0,8 s; 10/10 Part mới → confetti 80 hạt + `levelUp`; gắn nhãn đúng → “+5” bay 24 px / 0,6 s | ≥ 3 kênh cho nộp bài và cho mốc 10/10 |
| L1-21 | `engine.ts:1128` | Tạo thẻ `ltrap` cả cho `no_answer`/`word_limit` (vì `\|\| r.trapTypes.length>0`) | P3 | Chỉ tạo khi `errorCategory.startsWith('trap:')` | Test |
| L1-22 | `L1TrapDetector.tsx:1192` | Pill tô xanh khi `correctCount >= 8`, cứng số, sai với episode < 10 câu | P3 | Dùng `≥ 80% total` | – |

### 2.5 Lệch spec (L1)
- §4.1 Exam “không bắt đầu nếu chưa preload 100%”: **chưa làm** (L1-10).
- §4.2 chuẩn hoá giờ/tiền: thiếu (L1-03/04/05).
- §5 adaptive: level do người dùng kéo slider. Level chỉ đổi mức hỗ trợ, **không** lọc episode theo Part/difficulty như bảng §5 (catalog luôn hiện tất cả).
- §6 transcript highlight inline: chưa (L1-14). Chip dự đoán ✓: chưa (L1-07).
- §7 câu thắng so 7 ngày: chưa (L1-15).
- §8 spelling → tạo vocab tạm kèm audio đoạn episode: chỉ tạo card trống (xem X-01).
- §12 “độ lệch hiển thị ≤ 100 ms”: `timeupdate` chỉ ~250 ms (`trackPlayer.ts:448-463`). Chưa đạt nếu đo.

---

## 3. L2 · Dictation Ladder

### 3.1 Cơ chế và vòng lặp
- Phát (K lượt) → gõ cả câu → chấm theo từ (Levenshtein) → diff màu + “Điểm nghe khó” (IPA nối âm) → câu tiếp. 10 câu/phiên, khoảng 5–7 phút. Đúng spec §3.
- Điểm quyết định: dùng lượt phát nào, có dùng 0,75× (−30%) không, gõ trước khi phát xong.

### 3.2 Điểm mạnh đáng giữ
- **Phân loại 5 loại lỗi** đúng spec (`engine.ts:460-495`). Chuẩn hoá tốt: contraction, gạch nối, % và số chữ↔số (`:400-430`). UK/US được chấp nhận (đã thử `traveling` = `travelling`, `program` = `programme`).
- **Diff hiện dần** stagger 25 ms, tối đa 0,6 s, có tôn trọng reduced-motion (`L2DictationLadder.tsx:248-254`). Đúng `docs/10` và spec §10.
- Nút Phát có vòng sóng chạy quanh khi đang phát (`:1048-1071`). Phím tắt R / Enter (`:569-587`). Textarea có `<label htmlFor>` và tắt spellcheck/autocorrect (`:1124-1148`).
- SRS ánh xạ điểm ra rating đúng bảng §8 (`engine.ts:513-517`). Cập nhật thẻ `dict_full` đã tồn tại (`:949-974`).
- Leo bậc có lưu `skillLevels.l2` (`L2DictationLadder.tsx:537-555`). Đây là game duy nhất trong nhóm B ghi level bền.

### 3.3 Juice
| Tương tác | Motion | SFX | Hạt | Rung | Kênh |
|---|---|---|---|---|---|
| Bấm Phát | 2 vòng sóng scale 1→1,55 lặp | audio câu | – | – | 2 |
| Nộp câu | panel trượt + diff stagger + % tô màu | `correct`/`tap`/`wrong` (`:491-504`) | – | – | **3–4** |
| Câu hoàn hảo | pill “Hoàn hảo +5 XP” (không động) | như trên | – | – | +1 |
| Đủ điều kiện lên level | banner tĩnh | – | – | – | 1 (spec: confetti + `levelup`) |
| Recap | tĩnh + thanh lỗi `transition-all` | `sessionDone` | – | – | 1–2 |
| Combo câu hoàn hảo liên tiếp | **không có** | – | – | – | 0 |

**Juice 5/10.** Pha chấm đạt mức Balatro tối thiểu. Mốc và recap còn phẳng.

### 3.4 Danh sách vấn đề

| ID | Vị trí | Vấn đề và lý do | Mức | Cách sửa | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| L2-01 | `public/audio/dictation/` (60 file) so với `public/data/listening/dictation.json` (300 câu); `L2DictationLadder.tsx:404-426` | Chỉ 10 câu mỗi level (L1–L6) có MP3. 240 câu thiếu audio → `load()` lỗi → mô phỏng **im lặng**, người học không nghe được gì mà vẫn bị chấm | **P0** | Render đủ 300 câu. Trong lúc chờ, `selectL2SessionItems` lọc `hasAudio` (thêm cờ vào manifest) | 100% câu được chọn có file. Script kiểm: `missing=0` |
| L2-02 | `src/games/l2-dictation-ladder/engine.ts:689-704` | Chọn câu **tất định** (sắp theo khoảng cách level rồi theo `id`): mỗi level luôn ra **đúng 10 câu đó**. Chơi lần 2 là nhớ đáp án, sai P1/P2 và chống farm XP | P1 | Trộn có seed theo ngày. Loại câu đã làm trong 7 ngày (đọc attempts). Ưu tiên thẻ `dict_full` đến hạn | 2 phiên liên tiếp cùng level trùng ≤ 2/10 câu (khi pool ≥ 30) |
| L2-03 | dữ liệu `dictation.json` (level 1–6 × 50); `engine.ts:276-281,696-700` | Không có câu level 7–10. Lv 7–10 lấy câu lv 6, chỉ bớt lượt phát. Spec §5 có level 10 “tự sửa, giọng chồng” | P1 | Sinh 4 × 50 câu lv 7–10 theo `05` §6.4 (WPM ≥ 170, giọng AU/NZ/CA) | `count(level>=7) ≥ 200`, có audio |
| L2-04 | `engine.ts:400-430` | `"10,000-word"` → `"10 000 word"`, chấm 2 lỗi `number` (91%) với câu chuẩn “ten-thousand-word”. `"a.m."` → `"a m"` (2 token) ≠ `"am"` | P2 | Trước khi bỏ dấu câu: `s.replace(/(\d),(\d{3})\b/g,'$1$2')`, `a\.m\.?`→`am`, `p\.m\.?`→`pm` | Thử lại 2 case trên → 100% |
| L2-05 | `L2DictationLadder.tsx:474-484` | “0.75× đoạn này” phát lại **cả câu**, không phải đoạn focus như spec §3/§6 | P2 | Thêm `focus[].startSec/endSec` (lấy timestamp từ Kokoro/edge-tts) và `playSegment(start-0.2, end+0.2)` ở rate 0,75 | E2E: `currentTime` nằm trong đoạn ±0,2 s |
| L2-06 | `engine.ts:758-760`; `L2DictationLadder.tsx:1108-1118` | 0,75× (−30%) mở cho mọi level. Spec §4 chỉ cho lv 7–10 như lượt +1 | P3 | `canPlaySlow = level >= 7 && !slowPlayUsed`. Lv 1–6 cho “0,75×” thay một lượt K | Lv 3: nút 0,75× ẩn hoặc dùng chung K |
| L2-07 | `engine.ts:859-865` | Chỉ có lên level, không có xuống level (`02` §4: < 70% → −1). Không có cửa sổ trượt 20 lượt | P2 | Dùng `src/core/adaptive/difficulty.ts` với 20 câu gần nhất. Trung bình < 70% → đề xuất lv −1 | Test: 20 câu 60% → đề xuất giảm |
| L2-08 | `engine.ts:883-886,978-1004` | “Sai chính tả 2 lần” chỉ đếm **trong 1 phiên**. Một từ hiếm khi lặp trong 10 câu nên gần như không bao giờ sinh thẻ `listen_spell` | P2 | Lưu `kv['l2.spellingMiss'][word]` qua các phiên | Sai “accommodation” ở 2 phiên khác nhau → có thẻ |
| L2-09 | `L2DictationLadder.tsx:491-504` | `playSfx` nằm trong updater `setSession` (StrictMode kêu đôi). Nếu nộp khi audio đang phát thì `sfxEngine.blocked` còn `true` → mất SFX chấm | P2 | Tính `next` ngoài updater. Gọi `sfxEngine.setBlocked(false)` ngay sau `controller.pause()` | Nộp khi đang phát vẫn nghe `correct` |
| L2-10 | `L2DictationLadder.tsx:780-833` | Lên level chỉ có banner. `docs/10` §2: lên level = confetti 80 hạt + `levelUp` | P2 | Bấm “Lên Level” → confetti 2 màu listening + `playSfx('levelUp')` + LadderRail nhảy lên (spring.bouncy) | 3 kênh khi lên bậc |
| L2-11 | toàn game | Không có combo (chuỗi câu ≥ 90%). Thiếu vòng thưởng ngắn kiểu Duolingo | P2 | Combo x2/x3/x5 ở 2/3/5 câu ≥ 90% liên tiếp, `combo` SFX rate 1,0/1,12/1,25. Vỡ combo không có âm | HUD hiện 🔥x3. Test engine `comboAfter` |
| L2-12 | `L2DictationLadder.tsx:557-567` | Ôn lại câu sai lại cộng XP và lưu attempt mới | P3 | Phiên retry: `xp=0`, chỉ cập nhật SRS | attempt retry `xp=0` |

### 3.5 Lệch spec (L2)
- §5 thang 10 level: chỉ có content 6 level (L2-03).
- §6 thang leo dọc ở intro/recap: **có** (`LadderRail`).
- §9 MVP 300 câu: có text, nhưng **audio chỉ 20%** (L2-01).
- §10 “không SFX khi audio phát”: đúng.

---

## 4. W1 · Essay Lab

### 4.1 Cơ chế và vòng lặp
- Chọn đề (lọc dạng/chủ đề/tìm kiếm, “đề gợi ý”) → Viết (đồng hồ, đếm từ, dò cliché theo thời gian thực, paste detection) → Nộp → Checklist tự chấm + bài mẫu band 8 → GradingPanel (copy gói → Claude → dán) → Báo cáo 4 tiêu chí → Sửa (tối đa 3) → so sánh Δ. Đủ vòng spec §3.
- Phiên 25–50 phút, vượt khung 5–12 phút nhưng chấp nhận được vì là “bài lớn”.
- Điểm quyết định: dàn ý, chọn từ (cliché), có sửa bài hay không.

### 4.2 Điểm mạnh đáng giữ
- **Vòng sửa có Δ theo từng tiêu chí** (`W1EssayLab.tsx:1652-1711`; `engine.ts:512-561`). Đây là phần thưởng nội tại đúng tinh thần spec §2.
- **Dò cliché realtime** với 50 cụm, có biến thể, không đếm trùng chỗ chồng lấn, sắp theo mức nặng (`engine.ts:248-315`).
- Bài mẫu band 8 có ghi chú bên lề, **chỉ mở sau khi nộp** (`:1622-1629,1786-1792`). Đúng `07` §7.
- Paste > 100 ký tự → cảnh báo và không ghi band (`:534-541,687`).
- `ChartRenderer` vẽ đủ 7 loại (`src/games/_shared/ChartRenderer.tsx:1278-1313`). Data 24 visual phủ đủ 7 loại.
- Bias calibration theo `07` §6 (`engine.ts:589-642`).

### 4.3 Juice
| Tương tác | Motion | SFX | Hạt | Kênh |
|---|---|---|---|---|
| Gõ bài | đếm từ đổi màu | – | – | 1 (cố ý) |
| Nộp bài | Toast | – | – | 1 |
| Copy gói | nút “✓ Đã copy” 2 s + Toast | – | – | 2 |
| Dán → báo cáo | khối báo cáo trượt lên y12 | – | – | 1–2 |
| Δ band sau sửa | số tĩnh tô màu | – | – (spec: confetti nếu tổng ≥ +0,5) | 1 |

**Juice 2/10.** W1 không gọi `playSfx` lần nào (grep 0 kết quả).

### 4.4 Danh sách vấn đề

| ID | Vị trí | Vấn đề và lý do | Mức | Cách sửa | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| W1-01 | `src/games/w1-essay-lab/W1EssayLab.tsx:394-404,1348-1350,1414-1416` | “Đã lưu nháp lúc …” là **giả**: chỉ đặt chuỗi giờ, không ghi IndexedDB. Đóng tab hay bấm thoát là mất bài 40 phút | **P0** | Debounce 1,5 s → `essayRepo.saveDraft({promptId, text, elapsedSec, status:'draft'})`. Khi mở lại W1: nếu có draft < 24 h thì hỏi “Tiếp tục bài đang viết?” | E2E: gõ 30 từ, reload → khôi phục đủ 30 từ và đồng hồ |
| W1-02 | `W1EssayLab.tsx:1160,1800` | “Chọn đề khác” và “Viết đề mới” xoá state ngay, không xác nhận | P1 | Nếu `essayText` > 20 từ và chưa nộp → Modal “Bỏ bài đang viết?” (có nút Lưu nháp) | Bấm khi có 50 từ → modal xuất hiện |
| W1-03 | `W1EssayLab.tsx:384-392,1186-1188`; `engine.ts:190-225` | Exam: hết giờ **không tự nộp** (spec §4.1). `formatClock` hiện “-00:12”. Không có SFX `timeup`. Nếu < 50 từ thì không nộp được luôn | P1 | Ở Exam, khi `remainingSec<=0`: `playSfx('timeup',{examMode:true})` → `handleSubmitEssay({forced:true})`, cho phép nộp < 50 từ (lưu nhưng không tạo gói). Đồng hồ dùng `performance.now()` | Test giả lập clock: 40:00 → stage `review`, có record |
| W1-04 | `src/games/_shared/GradingPanel.tsx:640-650,432-436`; `W1EssayLab.tsx:123-126,653-656,1779` | Nút “Dán kết quả mẫu” (fixture `TASK*_CLAUDE_RESPONSE`) hiện ở production. `attemptId` bị thay cho khớp → bấm là có band, XP và evidence giả. Fixture test cũng bị đóng vào bundle | **P0** | Chỉ render khi `import.meta.env.DEV`. Truyền `sampleResponse` có điều kiện ở W1 | `npm run build` + grep bundle không có chuỗi fixture. Production không có nút |
| W1-05 | `GradingPanel.tsx:438-465,670-679`; `W1EssayLab.tsx:659-718` | “Phân tích & Lưu” bấm lại được → mỗi lần lại `bandRepo.add` + `profile.xp += 20/50`. Kết quả có `attemptIdMismatch` (`postcheck.ts:267-272`) vẫn được lưu. Bản sửa v2/v3 cũng ghi band → band W bị nâng nhờ sửa nhiều lần | P1 | (a) Sau `graded` thì disable nút (hoặc idempotent theo `hash(rawResponse)`). (b) Mismatch → chặn `onGraded`, bắt xác nhận. (c) Chỉ ghi band evidence cho bản 1 ở Exam (hoặc training đủ thời gian, không paste), không ghi cho revision | Bấm 3 lần → 1 band record. Dán JSON của bài khác → không có record |
| W1-06 | `W1EssayLab.tsx:550-558` | `EssayRecord` không lưu `attemptId`, `pasted`, `mode`, `durationSec`. Rời trang khi đang `awaiting_grade` thì không dán lại được (attemptId mới sẽ lệch). Spec §11 yêu cầu ghi cờ `pasted:true` | P1 | Thêm các trường vào record. Portfolio mở lại GradingPanel với `packetInput` dựng từ record | Nộp → thoát → mở Portfolio → dán kết quả → khớp attemptId |
| W1-07 | `W1EssayLab.tsx:720-734`; `src/games/v1-daily-run/engine.ts:851-853` | “+ Thêm vào ôn tập” tạo card `err:user_<hash>`/`col:user_<hash>` **không lưu front/back** → V1 hiện `content.errors[0]`. Xem X-01 | **P0** | Xem X-01 | Thẻ trong V1 hiện đúng câu lỗi của người học |
| W1-08 | `W1EssayLab.tsx:720-734`; spec §8 | Spec: lỗi `error` mặc định **tự thêm** vào SRS. Hiện chỉ thêm khi bấm tay | P2 | Sau `handleGraded`: tự upsert `srsItems.kind==='error'`. Có setting tắt | Dán kết quả có 3 error → 3 card |
| W1-09 | `W1EssayLab.tsx:1251-1277,1329-1345` | Vòng sửa chỉ liệt kê issue cũ, **không tô vàng** đoạn bị trích trong editor (spec §3) | P2 | Overlay `<mark>` sau textarea (mirror div) cho các `quote` còn tồn tại. Bấm vào → hiện fix | Ảnh chụp revise có đoạn tô vàng |
| W1-10 | `W1EssayLab.tsx:1652-1711` | Δ band tĩnh. Spec §10: số cũ trượt sang số mới, mũi tên xanh, confetti nếu tổng ≥ +0,5 | P2 | `motion` x:-12→0 cho số mới; overallDelta ≥ 0,5 → confetti 80 hạt + `levelUp` | 3 kênh khi Δ ≥ 0,5 |
| W1-11 | `GradingPanel.tsx` (khối báo cáo 777-1105) | Báo cáo không hiện **bài của người học với quote tô màu** bấm được (spec §6 “BÀI CỦA BẠN”) | P2 | Render `sourceText` với span theo `issues[].quote` (đỏ/vàng theo severity) | Bấm quote → mở issue tương ứng |
| W1-12 | `W1EssayLab.tsx:523-531`; `engine.ts:801-813` | “Đề gợi ý” chỉ xét difficulty gần `level` (luôn = 1 từ PlayScreen). Spec §5: xoay dạng lâu chưa viết → chủ đề ít collocation → tiêu chí yếu | P3 | Điểm = w1·ngày-từ-lần-cuối-cùng-dạng + w2·(1−tỉ lệ collocation đã học) + w3·gap tiêu chí yếu | Test: dạng chưa viết lâu nhất được chọn |
| W1-13 | `W1EssayLab.tsx:617-626,711-712` | XP checklist/chấm được cộng thẳng `profileRepo.update({xp})`, không qua `attemptRepo` → thống kê XP theo game lệch | P3 | Cộng qua attempt phụ hoặc `attemptRepo.addXp(gameId)` | Thống kê W1 XP = tổng thực nhận |
| W1-14 | `W1EssayLab.tsx` (1818 dòng) | Quá 1500 dòng | P2 | Tách `PromptSelector`, `EssayEditor`, `ReviewStage`, `Band8ModelViewer` | < 600 dòng/file |
| W1-15 | `W1EssayLab.tsx:1304-1370` | Idea Bank mở được mà không bị “−1 sao” (spec §4.1). Không có “full 60 phút cả 2 task” | P3 | Ghi `helpUsed` vào record, trừ XP/sao. Thêm mode `exam_full` | – |

### 4.5 Ma sát UX của luồng chấm copy/dán (W1, và cũng áp cho W2)
Đếm thao tác tối thiểu hiện tại: **Nộp → (tick checklist) → Copy gói → Mở Claude.ai (link riêng) → Ctrl+V + Enter → chờ → chọn toàn bộ câu trả lời + Ctrl+C → quay lại tab → (ô dán tự focus) → Ctrl+V → bấm “Phân tích & Lưu”.** Tổng khoảng **9 thao tác và 2 lần đổi tab**.

Đã tốt:
- Tự focus ô dán khi quay lại tab (`GradingPanel.tsx:379-394`).
- Clipboard bị chặn → mở sẵn textarea đã bôi chọn (`:408-420`).
- Tải `.md`.
- Lời nhắc sửa JSON 1 chạm (`:467-479`).
- Parser chịu lỗi tốt: lấy khối json cuối, fence chưa đóng, ngoặc kép cong, dấu phẩy thừa (`src/core/grading/parse.ts:131-200,302-370`).

Đề xuất giảm ma sát (P2):
1. Gộp “Copy gói + Mở Claude” thành 1 nút. `window.open('https://claude.ai/new')` chạy ngay sau `writeText`. Giảm 1 thao tác.
2. Nút “📥 Dán từ clipboard” dùng `navigator.clipboard.readText()` và **tự phân tích** khi dán (sự kiện `onPaste` có > 200 ký tự và có `{`). Giảm 2 thao tác.
3. Hiện hướng dẫn “Bấm nút Copy ở cuối câu trả lời Claude” thay cho việc bôi đen thủ công.
4. Lưu trạng thái `awaiting_grade` (W1-06) và hiện badge “2 bài chờ chấm” ở Hôm nay.

**Tiêu chí ĐẠT:** từ lúc nộp đến khi có báo cáo ≤ **6 thao tác**, đo bằng script E2E đếm click/phím.

---

## 5. W2 · Writing Sprints

### 5.1 Cơ chế và vòng lặp
- 5 loại sprint: Overview (6 × 90 s), Idea (4 × 3 phút), **Thesis, Cliché Surgery, Academic Upgrade** (3 loại cuối nằm ngoài spec). Mỗi lượt 1–3 phút, phiên 5–12 phút. Nhịp tốt nhất nhóm B.
- Điểm quyết định: viết overview/khung ý dưới áp lực giờ, tự tick checklist, chọn đáp án ở 2 sprint MCQ.

### 5.2 Điểm mạnh đáng giữ
- **Sao hiện lần lượt** stagger 120 ms bằng `spring.bouncy` (`W2WritingSprints.tsx:157-191`). Đúng spec §10.
- **SFX `correct` tăng cao độ theo số sao** (`rate: 1 + stars*0.06`, `:1215,1479`). Đúng tinh thần Balatro.
- Thanh giờ chỉ dùng `scaleX`, đổi màu ở 25% và 10% (`:1090-1107`; `engine.ts:116-122`). Đúng luật “chỉ animate transform”.
- Có streak 🔥 (`engine.ts:136-145`). Hết giờ tự chuyển review + `countdownEnd` (`:313-319`).
- Phát hiện chữ số trong overview và tự hạ 1★ khi tick “không số liệu” (`engine.ts:181-259`). Năm 4 chữ số được miễn, hợp lý.
- Xếp ideaBank theo độ trùng từ khoá (`engine.ts:461-484`).
- Map `SprintResult` của Claude có báo lượt thiếu (`:636-651,899-912`).

### 5.3 Juice
| Tương tác | Motion | SFX | Hạt | Kênh |
|---|---|---|---|---|
| Vào lượt mới | card fade + y10 | `tap` | – | 2 |
| Nộp bài viết | chuyển review | `flip` / thesis: `correct`/`wrong` có pitch | – | 2 |
| Tick checklist | sao pop stagger spring | `correct` pitch tăng | – | **3** |
| Chọn MCQ (cliché/upgrade) | đổi màu | `correct` rate 1,12 / `wrong` | – | 2 |
| Streak | số 🔥 (không pop) | – | – | 1 |
| Dán Claude | Toast | `levelUp` | – | 2 |
| Recap | tĩnh | `sessionDone` | – | 1–2 |

**Juice 5/10.**

### 5.4 Danh sách vấn đề

| ID | Vị trí | Vấn đề và lý do | Mức | Cách sửa | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| W2-01 | `src/games/w2-writing-sprints/W2WritingSprints.tsx:472-501,587-591,636-651` | Session lưu **một lần** lúc vào recap (`savedSessionRef`). Dán kết quả Claude sau đó chỉ đổi state: sao mới và +20 XP **không bao giờ được lưu** | P1 | `handleClaudeGraded` gọi `attemptRepo.updateAttempt(id, {score, xp: +20, items})` (cần lưu `attemptId` trả về từ lần save đầu) | Dán Claude → reload thống kê → XP và sao cập nhật |
| W2-02 | `src/games/w2-writing-sprints/engine.ts:301-316,486-501` | `selectOverviewPrompts`/`selectIdeaPrompts` tất định: cùng level luôn ra cùng 6 biểu đồ / 4 đề | P1 | Shuffle có seed theo ngày + loại `ref` đã làm trong 14 ngày | 2 phiên liên tiếp trùng ≤ 1/6 biểu đồ |
| W2-03 | `W2WritingSprints.tsx:298-311,1122-1124` | Đồng hồ 90 s chạy cả khi biểu đồ còn đang tải (Skeleton) → mất giây | P2 | Chỉ chạy interval khi `!task1Loading && activeTask1` | Chậm mạng 2 s → vẫn đủ 90 s nhìn thấy chart |
| W2-04 | `W2WritingSprints.tsx:1175-1312` | Bài mẫu band 8 hiện **cùng lúc** với checklist → người học tick theo mẫu, sao tự chấm bị phồng | P2 | Hai bước: tick → “Xác nhận tự chấm” (khoá checkbox) → mới hiện mẫu. Sao chốt ở bước khoá | Ảnh chụp: trước khi xác nhận không thấy mẫu |
| W2-05 | `engine.ts:42-93` (thesis/cliche/upgrade); `docs/games/W2-WRITING-SPRINTS.md` §3 | 3 sprint ngoài spec, chưa ghi `DECISIONS.md`. Cliché/Upgrade là **MCQ nhận diện** (P3 yêu cầu sản xuất) | P3 | Ghi quyết định vào `DECISIONS.md`. Đổi Cliché/Upgrade sang **gõ lại câu** (chấm bằng cụm khoá + không còn cliché) | Có dòng trong DECISIONS. ≥ 1 bậc gõ cho mỗi sprint |
| W2-06 | `W2WritingSprints.tsx:322-338` | Lưu cụm khoá thành `err:w2_<slug>` không có nội dung → V1 hiện thẻ khác (X-01) | **P0** (thuộc X-01) | Xem X-01 | – |
| W2-07 | `W2WritingSprints.tsx:544-579` | Cliché/Upgrade hết giờ mà chưa chọn → `currentClicheScore=null` → `record=null` → lượt **biến mất** khỏi recap | P3 | Hết giờ → ghi lượt 0★ `responseText:'(hết giờ)'` | Recap luôn có đủ N lượt |
| W2-08 | `W2WritingSprints.tsx:1144-1172` | Không có phím Ctrl+Enter để nộp. Textarea không có giới hạn câu | P3 | `onKeyDown` Ctrl/⌘+Enter → `handleSubmitWritten` | – |
| W2-09 | `W2WritingSprints.tsx:1075-1083` | Streak chỉ là số tĩnh. Spec `docs/10` có combo pop (scale 1,3→1) + lửa lớn dần + `combo` SFX | P2 | Pop khi tăng, rơi mờ khi vỡ. `playSfx('combo',{rate:[1,1.12,1.25][tier]})` ở x3/x5 | 3 kênh ở mốc x3 |
| W2-10 | `W2WritingSprints.tsx` (1882 dòng) | Quá 1500 dòng: 5 sprint trong 1 file | P2 | Mỗi sprint một component `OverviewRound.tsx`… | < 600 dòng/file |

### 5.5 Lệch spec (W2)
- §3/§13: thêm 3 sprint ngoài spec (W2-05).
- §5 lv 7–10 Overview chỉ lấy process/map với 60 s: **có**.
- §9 `overviewKeyPhrases` tuỳ chọn: có fallback.
- §8 cụm khoá → SRS: có nút nhưng thẻ hỏng (X-01).

---

## 6. Hệ chấm dùng chung (`src/core/grading/`, `docs/grading/`, `GradingPanel`, `ChartRenderer`)

### Điểm mạnh
- Prompt chỉ có một nguồn (`docs/grading/*.md`, `?raw`), có `PROMPT_VERSION` (`w-1.0`, `s-1.0`, `sp-1.0`).
- Parser chịu lỗi tốt (xem §4.5). `resolveGradingSchema(family, promptVersion)` sẵn cho nhiều phiên bản schema (`parse.ts:551`).
- Hậu kiểm: quote mờ ≥ 0,9 (`postcheck.ts:21-90`), app đè `wordCount`, trần TR/TA (< 150/250 từ → 5,5; lạc đề → 5,0; Task 1 không overview → 5,5) (`bands.ts:71-145`), cảnh báo `attemptId` lệch (`postcheck.ts:267-272`).
- Test: parse 272 dòng, postcheck 188, packet 109, bands 110.

### Vấn đề
| ID | Vị trí | Vấn đề | Mức | Cách sửa | ĐẠT |
|---|---|---|---|---|---|
| G-01 | `postcheck.ts:267-272` + nơi gọi `onGraded` | Lệch attemptId chỉ là *warning*, game vẫn lưu | P1 | Trả `blocking:true`. GradingPanel không gọi `onGraded` cho tới khi người dùng xác nhận “Đúng bài này” | Test: mismatch → `onGraded` không chạy |
| G-02 | `postcheck.ts:503` | Ẩn > 50% quote (dấu hiệu dán nhầm bài hoặc Claude bịa) vẫn chấp nhận band | P2 | `hiddenCount/totalChecked > 0.5` → cảnh báo đỏ + không ghi band evidence | Dán mẫu cho bài khác → không có band |
| G-03 | `W1 engine.ts:541-543` dùng `computeWritingTaskBand` không có cap | Overall Δ trong thẻ so sánh có thể lệch với “Band ước tính” (đã có cap) | P2 | Truyền `capOptions` (wordCount, relevance, overviewPresent) | Hai số bằng nhau trong mọi fixture |
| G-04 | `src/games/_shared/ChartRenderer.tsx:248-249,536-537,762-763,1120-1121` | SVG chỉ có `aria-label` = tiêu đề, người dùng trình đọc màn hình không có dữ liệu | P3 | Thêm `<desc>` hoặc nút “Xem dạng bảng” (dùng chung bảng của packet) | axe: biểu đồ có text thay thế chứa số liệu |

---

## 7. Lỗi xuyên game (gốc rễ ảnh hưởng nhóm B)

| ID | Vị trí | Vấn đề | Mức | Cách sửa | ĐẠT |
|---|---|---|---|---|---|
| **X-01** | Nơi tạo thẻ: `src/games/l1-trap-detector/engine.ts:1114-1139`, `src/games/l2-dictation-ladder/engine.ts:978-993`, `src/games/w1-essay-lab/W1EssayLab.tsx:721-731`, `src/games/w2-writing-sprints/W2WritingSprints.tsx:327-329`. Nơi đọc: `src/games/v1-daily-run/engine.ts:705-720,853,906` | Thẻ chỉ có `itemId`, không có kho “user items”. V1 dùng `find(...) ?? content.errors[0]` / `vocab[0]`. `ltrap_replay` bị map sang `listen_spell` của vocab. `dict_full` thành “nghe 1 từ”. **Toàn bộ vòng “lỗi → SRS” (02 §3.4) hiển thị sai nội dung** | **P0** | Thêm bảng Dexie `userItems {id, kind, front, back, noteVi, audioClip?{src,start,end}, source}`. Producer ghi item cùng card trong 1 transaction. V1: không tìm thấy item thì **bỏ qua card** (không fallback `[0]`). Thêm renderer `ltrap_replay` (playSegment) và `dict_full` (chép cả câu, chấm bằng `gradeDictationSentence`) | E2E: sai Q4 L1 → V1 phát đúng đoạn bẫy Q4. Thêm 1 lỗi W1 → V1 hiện đúng câu đó. 0 lần fallback `[0]` (log) |
| X-02 | `src/app/screens/PlayScreen.tsx:120`; `src/core/adaptive/difficulty.ts` | Mọi game nhận `level=1`, `mode='training'`. Adaptive 80–85% không game nào dùng | P1 | PlayScreen đọc `profile.skillLevels[gameId]`, sau phiên gọi `difficulty.update(window20)` và lưu | Chơi 20 lượt > 90% → level +1 được lưu |
| X-03 | `src/design/components/RecapScreen.tsx` | Recap tĩnh: không count-up, không stagger, không confetti. Không có cơ chế “+XP bay” dùng chung | P2 | Count-up 0,8 s easeOut; thẻ thống kê stagger 60 ms; prop `milestone` → confetti 80 hạt (canvas-confetti, đã có trong `docs/10`); component `XpFloat` dùng chung | Recap có ≥ 3 kênh. Reduced-motion → fade 0,1 s |
| X-04 | `src/core/audio/sfx.ts:96-129` | `syncManifest()` cập nhật `spriteMap` **sau** khi đã tạo `Howl` → offset mới không vào Howl. Hiện vô hại vì `sfx.json` trùng default | P3 | Tạo `Howl` sau khi `await syncManifest()`, hoặc dựng lại Howl khi manifest khác | Đổi offset trong `sfx.json` → âm phát đúng |
| X-05 | `src/core/audio/trackPlayer.ts:123,210-222,419` | `preload()` tạo element vào `preloadedAudio` nhưng `load()` không bao giờ dùng lại (code chết) | P3 | `load(url)`: nếu `preloadedAudio?.src===resolved` thì dùng lại | Câu tiếp L2 phát < 100 ms sau bấm (đã cache) |
| X-06 | `PROGRESS.md:22` | Ghi “M3 ✅ 100%” trong khi audio 4/32 episode, 60/300 dictation | P1 (quy trình) | Cổng nghiệm thu M3 phải có script `missing audio = 0` | Script CI fail khi thiếu file |

---

## 8. Speaking (S1, S2) và X1: mức độ thiếu

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Speech core (recorder, VAD, ASR tự restart, metrics) | **Có, khá đủ** (~2.800 dòng + test) | `src/core/speech/asr.ts:267-647` (restart, ghép đoạn chồng, ánh xạ lỗi `not-allowed`/`audio-capture`/`network` ở `:225-265`), `vad.ts` (tự hiệu chỉnh nhiễu 1 s, onset/hangover), `metrics.ts:410-753` (WPM, pause, MATTR, fillers, so dải band 8), `recorder.ts` (chọn opus/webm/mp4, `permission_denied`) |
| Prompt chấm Speaking | Có | `docs/grading/SPEAKING.md` (`s-1.0`), `SPRINTS.md` có kind `s2` |
| Data Speaking | Có text: Part 1 30 topic, Part 2 40, Part 3 40, phrases 80, có `areSample` | `public/data/speaking/*.json` |
| Audio giám khảo / mẫu ARE | **0 file** (không có `public/audio/speaking/`) | data trỏ `audio/speaking/*.mp3` |
| Game S1 Mock Examiner | **Chưa có** (registry `coming_soon`, dùng `GamePlaceholder`) | `src/games/registry.ts:154,205-214` |
| Game S2 3-Second Rule | **Chưa có** | `registry.ts:166` |
| Game X1 Exam Room | **Chưa có UI**, **chưa có data** (`public/data/exam/` không tồn tại), 8 episode reserved không có audio | `registry.ts:178` |
| Màn kiểm tra mic, báo cáo metrics, portfolio ghi âm, gói chấm Speaking | Chưa có | – |

**Ước lượng hoàn thành:** S1 ≈ 25% (core + data + prompt), S2 ≈ 20%, X1 ≈ 5%. Không thể đạt mục tiêu Speaking ≥ 7,5 khi chưa có chỗ luyện nói. Đây là **lỗ hổng sản phẩm lớn nhất** theo `00-SPEC` §5 (“thiếu sản xuất ngôn ngữ”).

**Đề xuất thứ tự (P1):**
1. Render audio giám khảo (Kokoro/edge-tts, ~110 câu × 3 s ≈ 6 MB).
2. Làm S2 trước (phiên 5–7 phút, tái dùng VAD latency, ⚡ combo → juice dễ).
3. Làm S1.
4. Làm X1 sau khi đủ 8 episode reserved có audio.

**Tiêu chí ĐẠT S2:** E2E fake-media 8 câu chạy hết. wav có 4 s im lặng đầu → không có ⚡ (spec §12).

**Lưu ý trước khi làm S1/S2** (từ đọc core):
- `asr.ts` chỉ ánh xạ lỗi. Game cần màn hướng dẫn cấp quyền và thử lại (S1 §11).
- `docs/10` §3 yêu cầu chặn SFX khi ghi âm. `sfxEngine.setBlocked` phải được recorder bật, chưa có chỗ nối.

---

## 9. Audio: tổng kết `trackPlayer` và `sfx`

**Điểm mạnh:**
- Không dùng `speechSynthesis` (đúng AGENTS §3).
- `examLocked` chặn ở tầng controller, không chỉ ở UI.
- `playSegment` tự dừng ở `endSec`, có segment watcher 50 ms.
- Test 242 dòng.
- `sfx.ts` đúng luật Exam chỉ cho `timeup`, âm lượng mặc định 60%, có `rate` cho pitch.

**Vấn đề** đã nêu ở L1-10 (lỗi autoplay bị coi là thiếu file), L1-16 (re-render), X-04, X-05, và độ phân giải `timeupdate` (§2.5).

**Xử lý lỗi audio:** có `onRetryLoad` (`L1TrapDetector.tsx:1686-1691`), nhưng trạng thái `audio_missing` **không chặn** bắt đầu bài (L1-01/L1-10). Spec §11 yêu cầu “không bắt đầu, hiện nút tải lại”.

**Phụ đề / transcript (a11y):**
- L1 có transcript đầy đủ sau khi chấm (tốt).
- L2 hiện câu gốc sau khi chấm (diff).
- Chưa có tuỳ chọn cho người khiếm thính (ngoài phạm vi IELTS nên chấp nhận).

---

## 10. Kế hoạch sửa ưu tiên (đề xuất)

| Đợt | Việc | Ước lượng |
|---|---|---|
| 1 (P0) | X-01 kho userItems + renderer V1; W1-04 gỡ nút mẫu; W1-01 autosave thật; L1-01 ẩn episode thiếu audio + chặn transcript ở Exam; L2-01 lọc câu có audio | 2–3 ngày |
| 2 (P1) | Render 28 MP3 L1 + 240 MP3 L2; L1-02..05 chuẩn hoá đáp án (+ ≥ 12 test); W1-02/03/05/06; W2-01/02; L1-08/09/10; L2-02/03; X-02 adaptive | 4–6 ngày |
| 3 (P2) | Juice: X-03 Recap, L1-20, L2-10/11, W1-10, W2-09; ma sát chấm (§4.5); tách file > 1500 dòng | 3–4 ngày |
| 4 | S2 → S1 → X1 (§8) | theo M5/M6 |
