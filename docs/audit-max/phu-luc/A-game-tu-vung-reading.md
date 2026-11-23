# Audit nhóm A: Từ vựng (V1, V2, V3) + Reading (R1, R2)

> Phạm vi: `src/games/v1-daily-run`, `v2-collocation-forge`, `v3-paraphrase-radar`, `r1-tfng-judge`, `r2-headline-editor`, `src/games/_shared` (phần các game này dùng), cùng các phụ thuộc trực tiếp (`src/design/components/*`, `src/core/srs/*`, `src/core/audio/sfx.ts`, `src/app/screens/PlayScreen.tsx`).
> Chế độ: CHỈ ĐỌC. Không sửa file nào trong `D:\English`.
> Đối chiếu: `AGENTS.md`, `docs/00-SPEC.md`, `docs/02-LEARNING-DESIGN.md`, `docs/10-MOTION-AND-SOUND.md`, `docs/games/{V1,V2,V3,R1,R2}*.md`.
> Mọi đường dẫn tương đối từ `D:\English`. Số dòng lấy theo file thật (CRLF; `Measure-Object -Line` của PowerShell đếm thiếu vì bỏ dòng trống).

Ký hiệu mức độ: **P0** chặn (hỏng mục tiêu học hoặc dữ liệu), **P1** nặng, **P2** vừa, **P3** nhẹ.

---

## 0. Tóm tắt điều hành

### Bảng điểm (/10)

| Game | Cơ chế | Độ vui | Sư phạm | Độ khó | Phần thưởng | Juice | TB |
|---|---|---|---|---|---|---|---|
| V1 Daily Run | 6 | 5 | 3 | 3 | 5 | 5 | 4,5 |
| V2 Collocation Forge | 6 | 5 | 6 | 3 | 4 | 5 | 4,8 |
| V3 Paraphrase Radar | 6 | 5 | 4 | 3 | 4 | 5 | 4,5 |
| R1 TFNG Judge | 8 | 5 | 8 | 3 | 4 | 4 | 5,3 |
| R2 Headline Editor | 7 | 5 | 7 | 4 | 4 | 4 | 5,2 |

Nhận xét chung: engine thuần thiết kế tốt và có test, nhưng **vòng nối giữa các game (SRS → V1) hỏng**. **Không game nào có độ khó thích ứng thật.** Juice dừng ở mức 2–3 kênh "đủ dùng": không có hạt ở mốc lớn, không đếm số ở recap, không rung, combo không lên cao độ. So với Balatro hay Duolingo, các game này là bài tập có hiệu ứng, chưa thành trò chơi có "cảm giác tay".

### 5 vấn đề nặng nhất

1. **[P0] V1 không bao giờ cho từ mới thoát khỏi thẻ giới thiệu.** Mọi thẻ vocab ở trạng thái `New` (kể cả face `recog` và các face vừa mở như `recall_meaning`) đều bị ép thành `intro`. Nút "Đã xem" không ghi FSRS, nên ngày nào thẻ đó cũng quay lại làm intro và ăn quota thẻ mới. Chuỗi `recog → recall → listen_spell` (P3 của `02`) không bao giờ chạy. Vị trí: `src/games/v1-daily-run/engine.ts:1598-1600`, `:699-702`, `:1868-1882`.
2. **[P0] V1 hiển thị sai item cho thẻ đến từ game khác.** `tfng:*` (R1), `head:*` (R2), `ltrap:*` (L1) không có nhánh render, nên rơi xuống nhánh vocab và hiện `content.vocab[0]`. `err:l1col_*` (V2) không có trong `error_patterns.json`, nên hiện `content.errors[0]`. FSRS sau đó chấm thẻ thật dựa trên câu trả lời cho một item không liên quan. Vị trí: `src/games/v1-daily-run/engine.ts:801, 821, 853, 875, 907` (các fallback `?? content.X[0]`), `:699-725`.
3. **[P0] Độ khó thích ứng không tồn tại.** `adjustDifficulty` (`src/core/adaptive/difficulty.ts:61`) không được gọi ở đâu ngoài test. `PlayScreen` cứng `mode="training" level={1}` (`src/app/screens/PlayScreen.tsx:120`). V2, V3, R1 và R2 không đọc `profile.skillLevels`. Kết quả: mọi người chơi đều ở level 1 mãi, và toàn bộ bảng §5 "Độ khó" của 4 game là code chết.
4. **[P1] V3 lộ đáp án.** Pill "Level 4" hiện trước khi trả lời, mà trong data L4 trùng 100% với `not_equivalent` (32/32 item). Ngoài ra, bấm vào một từ sẽ mở rộng thành **chính xác** span target hoặc decoy, nên người chơi dò được vị trí đáp án. Vị trí: `src/games/v3-paraphrase-radar/V3ParaphraseRadar.tsx:628-630`, `engine.ts:136-214`.
5. **[P1] Thoát giữa phiên mất sạch tiến độ.** Cả 5 game chỉ lưu khi vào recap. V1 còn ghi trên màn checkpoint "Tiến độ FSRS đã được ghi nhận" dù chưa lưu gì. Điều này vi phạm `02 §5` ("thoát giữa chừng vẫn lưu"). Vị trí: `src/games/v1-daily-run/V1DailyRun.tsx:281-307, 625`; `v2…/V2CollocationForge.tsx:331`; `v3…/V3ParaphraseRadar.tsx:354`; `r1…/R1TfngJudge.tsx:562`; `r2…/R2HeadlineEditor.tsx:177, 691`.

---

## 1. Vấn đề dùng chung (ảnh hưởng nhiều game)

| # | Mức | Vị trí | Vấn đề và lý do | Cách sửa (thông số) | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| C1 | P0 | `src/app/screens/PlayScreen.tsx:120`; `src/core/adaptive/difficulty.ts:61` | `level={1}`, `mode="training"` bị cứng. `adjustDifficulty` không có caller. Không game nào ghi `profile.skillLevels[gameId]` sau phiên. Hiển thị "Level 1 · Training" cũng cứng (`PlayScreen.tsx:92`). | (1) PlayScreen đọc `profile.skillLevels[id]` và truyền vào `level`. Truyền `mode` từ route hoặc query. (2) Tạo `src/core/adaptive/sessionLevel.ts`: sau `attemptRepo.saveSession`, lấy 20 lượt gần nhất của game (`attempts.items`) rồi gọi `adjustDifficulty` (cửa sổ 20, cooldown 10), sau đó `profileRepo.update({skillLevels})`. Bỏ qua khi `mode==='exam'`. (3) Recap hiện pill "Level 4 → 5 ↑" khi đổi. | Unit test: 20 lượt đúng 95% thì level +1; 20 lượt 60% thì −1. E2E: chơi V3 hai phiên đúng 100%, phiên 3 có `timeLimitSec` = 22 (level 3). |
| C2 | P1 | V1 `V1DailyRun.tsx:281`; V2 `:331`; V3 `:354`; R1 `:562,620`; R2 `:177` | Chỉ lưu ở recap. Đóng tab hoặc bấm ✕ ở header PlayScreen thì mất FSRS, XP và attempt. | Thêm `attemptRepo.saveProgress(partial)` theo từng lượt (debounce 500 ms) hoặc `useEffect` cleanup và `pagehide` để flush `updatedCards`/`reviews`. V1: lưu tại mỗi checkpoint. | E2E: V1 trả lời 5 thẻ, reload trang, rồi kiểm DB có 5 review và `due` của 5 card đã đổi. |
| C3 | P2 | V2 `V2CollocationForge.tsx:644-646`; V3 `V3ParaphraseRadar.tsx:510`; R1 `R1TfngJudge.tsx:1417`; R2 `R2HeadlineEditor.tsx:430` | Nút "Ôn ngay N câu sai" chạy lại **toàn bộ** phiên với cùng item. XP được cộng lại và FSRS được chấm lại. Điều này vi phạm `02 §2.4` (chơi lại câu vừa làm = 0 XP) và `02 §5` (tối đa 5 câu sai). | Tạo phiên retry chỉ gồm tối đa 5 item sai, cờ `isRetry: true` thì XP = 0 và **không** gọi `scheduleCard`. | Unit test: retry session có `xp === 0` và `reviews.length === 0`. |
| C4 | P2 | `src/design/components/RecapScreen.tsx:38-171` | Recap tĩnh: không đếm số 0→N trong 0,8 s, không cho thẻ vào lần lượt cách 60 ms (`10 §2` bảng "Recap"), không có confetti ở mốc. Mặc định giả `accuracyPercent = 80`, `durationSec = 240` (`:31-32`). | Dùng `animate(0, N, {duration: 0.8, ease: ease.out})` của motion cho `scoreLabel` và XP. `staggerChildren: 0.06` cho các ô. Bỏ giá trị mặc định giả (bắt buộc truyền vào). | Ảnh chụp ở t = 400 ms cho thấy số đang chạy. Prop thiếu thì TypeScript báo lỗi. |
| C5 | P2 | Toàn bộ 5 game (grep `canvas-confetti` chỉ thấy trong `src/legacy`) | `canvas-confetti` đã cài (`package.json:20`) nhưng không game V3 nào dùng. `docs/10 §2` yêu cầu confetti 80 hạt, 2 màu kỹ năng ở lên level, item lên Mastered, streak 7-30-100. `attemptRepo.saveSession` đã trả về `totalXp` và `streakCount` (`attemptRepo.ts:56`) nhưng không ai đọc. | Tạo `src/design/celebrate.ts`: `celebrate({particleCount: 80, colors: [skill, accent], spread: 70, ticks: 120})`, tắt khi reduced-motion. Gọi khi `xpToLevel(before).level < xpToLevel(after).level`, khi `newlyMatureItemIds` có item Mastered, và khi streak chạm 7/30/100. Kèm SFX `levelUp`. | E2E: fixture XP sát ngưỡng, chơi 1 lượt thì thấy canvas confetti trong 600 ms và có `levelUp`. |
| C6 | P2 | Không game nào có `navigator.vibrate` | Thiếu kênh xúc giác trên điện thoại (`00-SPEC §2` nói có dùng điện thoại). | (Ghi vào DECISIONS) đúng `vibrate(12)`, sai `vibrate([8,40,8])`, mốc lớn `vibrate([20,30,20,30,40])`. Tắt khi reduced-motion hoặc exam. | Có helper `haptic(kind)` kèm unit test mock `navigator.vibrate`. |
| C7 | P2 | V2 `:394-401, 446-459`; V3 `:246-273, 280-288, 300-306`; V2 timer `:302-307` | `playSfx` và `setRemainingSec` được gọi **bên trong hàm updater của `setState`**. StrictMode chạy updater 2 lần nên SFX phát đôi ở dev. Đây là side-effect trong reducer. | Tính `next` ngoài updater (như V1 đang làm), rồi `setState(next)` và phát SFX sau đó. Timer: phát `tick` trong `useEffect([remaining])`. | Dev StrictMode: mỗi lượt đúng chỉ có 1 lệnh `howl.play('correct')` (spy). |
| C8 | P2 | `V1/engine.ts` 2437 dòng; `V1DailyRun.tsx` 1736; `V2CollocationForge.tsx` 1769; `V2/engine.ts` 1512; `R1TfngJudge.tsx` 1910 | Năm file vượt 1500 dòng. Mỗi component chứa nhiều màn (recap, checkpoint, play, faces) và logic điều phối. | Tách: V1 thành `faces/*.tsx` (8 face), `Hud.tsx`, `Checkpoint.tsx`; V1 engine thành `prompts.ts`, `scoring.ts`, `runState.ts`. R1 thành `JudgeView`, `PassageTrainingView`, `PassageExamView`. | Không file nào > 800 dòng. `npm test` vẫn xanh. |
| C9 | P3 | `ChoiceButton.tsx:28`, `AnswerInput.tsx:37`, các game dùng `useReducedMotion()` | Chỉ theo OS. `10 §4` yêu cầu thêm tuỳ chọn trong Cài đặt. | Hook `useMotionPref()` = `useReducedMotion() \|\| settings.reduceMotion`. | Bật setting thì `e2e/motion.spec` pass mà không cần emulate OS. |
| C10 | P3 | `src/core/audio/sfx.ts:62-83` | Bảng `10 §3` có cue `combo` cần lên cao độ theo bậc (rate 1.0/1.12/1.25), nhưng không game nào truyền `rate`. | Helper `playCombo(tier)` dùng `playSfx('streak', {rate: [1, 1.12, 1.25][tier]})`. | Spy: combo 3/5/10 lần lượt gọi rate 1/1.12/1.25. |

---

## 2. V1 · Daily Run

### 2.1 Cơ chế cốt lõi và vòng lặp
- Run gồm các node, chia chặng 20 thẻ, có checkpoint và boss 5 thẻ có retrievability thấp nhất. Mỗi node là 1 lượt gợi nhớ, nên đúng ý "cơ chế = học" (P4).
- Độ dài: tối đa 60 thẻ cộng boss, khoảng 8–15 phút. Chế độ bận 10 thẻ.
- Điểm quyết định: dùng gợi ý H (đổi lấy Hard) hay "Không nhớ". Ngoài hai lựa chọn này gần như không có quyết định nào khác (không chọn đường trên bản đồ, không rủi ro hay phần thưởng). Boss chỉ là "5 thẻ lặp lại" mà người chơi vừa làm trong cùng run.

### 2.2 Sư phạm
- Tốt: FSRS chỉ ghi lượt đầu (`engine.ts:1904-1907, 1941`). Thẻ sai hạ 1 bậc và chèn lại sau 3–5 node, tránh 2 thẻ cùng item liền nhau (`:1144-1186`). Có diff từng ký tự, `analyzeSpellingError`, chấp nhận biến thể Anh-Anh/Anh-Mỹ, typo 1 ký tự với từ ≥ 7 chữ thành `partial`/Hard (`:1276`).
- Hỏng: xem P0 V1-1, V1-2 bên dưới. Phân biệt lỗi (`err_fix` theo tag) có tồn tại, nhưng nguồn item lỗi từ V2 bị render sai.

### 2.3 Độ khó và thích ứng
- FSRS tự điều chỉnh khoảng ôn (đúng spec §5). `skillLevel` chỉ dùng cho mask chữ đầu và số lượt nghe, nhưng level không bao giờ được cập nhật (C1).
- MCQ `recog` luôn dùng 3 distractor giống nhau (V1-4), nên độ khó nhận diện gần 0 sau vài ngày.

### 2.4 Phần thưởng
- XP đúng bảng spec (`engine.ts:1063-1098`). Combo ×2 từ 5 đúng liền, ×3 từ 10. Thẻ hiếm ×3. Hạ boss +50.
- Thiếu: số "+XP" bay lên (`10 §2`), mốc lên level, thông báo "N từ lên Mature" có hiệu ứng. Câu thắng dự phòng bịa số liệu (V1-6).

### 2.5 Juice: kênh phản hồi theo tương tác

| Tương tác | Motion | SFX | Hạt | Rung | Khác | Số kênh |
|---|---|---|---|---|---|---|
| Chọn đáp án MCQ (1–4) | `ChoiceButton` đổi màu | không có `tap` | 0 | 0 | | 1 |
| Đúng (MCQ/gõ) | `correctPopVariants` scale 1→1.05→1 (0,3 s), glow `shadow-glow-ok`, chip collocation trượt y 10→0 (`V1DailyRun.tsx:974-976`) | `correct` + phát âm từ (`:343-351`) | 0 | 0 | tự chuyển 1,2 s | 3 |
| Sai | `wrongShakeVariants` x[0,-6,6,-4,4,0], viền đỏ | `wrong` (`:353`) | 0 | 0 | CharDiffBox tĩnh | 3 |
| Gần đúng (partial) | không nhấp nháy gạch chân 2 lần như `10 §2` | `correct` (giống đúng) | 0 | 0 | | 1–2 |
| Combo tăng | badge pop scale 1.25→1, không preset spring (`:772-775`) | `combo` chỉ khi ≥ 5, không đổi rate (`:340-341`) | 0 | 0 | lửa không lớn dần | 2 |
| +XP | không có số bay | — | — | — | Pill tĩnh `:989` | 1 |
| Boss trúng đòn | HP `scaleX` 0,25 s (`RunMap.tsx:230-233`) | `correct` thường | 0 | 0 | không rung màn | 2 |
| Hạ boss | 8 mảnh HP vỡ (`RunMap.tsx:241-259`) | `levelUp` (`V1DailyRun.tsx:338`) | 8 mảnh | 0 | | 3 |
| Checkpoint | ProgressRing tĩnh | không | 0 | 0 | | 1 |
| Hết giờ | không áp dụng (spec cấm timer) | | | | | — |
| Kết thúc run | Recap tĩnh | `sessionDone` (`:286`) | 0 | 0 | | 1–2 |

Không có trạng thái nghỉ "thở" ở node hiện tại (chỉ pulse 1 lần `RunMap.tsx:129-136`), không nghiêng hay nâng thẻ khi hover.

### 2.6 Danh sách vấn đề V1

| ID | Mức | Vị trí | Vấn đề và lý do | Cách sửa (thông số) | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| V1-1 | **P0** | `engine.ts:1598-1600`, `:699-702`, `:1868-1882` | `isNewVocab = state===New && vocab:` ép **mọi** face thành `intro`. "Đã xem" chỉ cộng 5 XP rồi advance, không `scheduleCard` và không đổi state. Hệ quả: (a) thẻ `recog` mới quay lại làm intro mỗi ngày và ăn quota; (b) face mở mới (`recall_meaning`, `recall_cloze`, `listen_spell`) cũng hiện thành intro; (c) nhánh "Tôi biết rồi" mở `recog/recall_*` ở state New (`:1999-2008`), các thẻ này lại thành intro. P3 (sản xuất) không bao giờ đạt. | Chỉ hiện `intro` khi `card.face === 'recog' && state === New && !introSeen[itemId]`. "Đã xem" thì ghi `introSeen` (field mới trên card hoặc `kv`) và chèn ngay node `recog` của item đó sau 2–3 node trong cùng run. Face `recall_*`/`listen_spell` ở state New render đúng face của nó. | Unit test: run 1 có intro, "Đã xem", rồi `recog` xuất hiện trong cùng run. Run 2 (ngày sau) không còn intro cho item đó. Card `recall_meaning` New render ra `recall_meaning`. |
| V1-2 | **P0** | `engine.ts:699-725` (thiếu nhánh `tfng:`/`head:`/`ltrap:`), `:801, 821, 853, 875, 907` (fallback `?? content.X[0]`) | `tfng_retry`/`head_retry` thành `recog`, rồi `buildPromptForCard` rơi xuống vocab và hiện `vocab[0]`. `ltrap:*` thành `listen_spell` và cũng ra `vocab[0]`. `err:l1col_*` (V2 tạo ở `v2…/engine.ts:196`) không có trong `errors`, nên hiện `errors[0]`. FSRS chấm thẻ thật bằng câu trả lời cho item khác. Vi phạm `02 §3.2` ("V1 render được **mọi** face") và anti-goal "một item sai làm hỏng niềm tin". | (1) Thêm prompt `tfng_retry` (đoạn chứa evidence + statement, nút T/F/NG) và `head_retry` (đoạn + 4 heading), nạp từ `reading/passages`. (2) `ltrap_replay`: phát đoạn audio bẫy. (3) `err:l1col_<colId>`: dựng câu từ `col.l1Traps` (wrong, rồi gõ `phrase`). (4) Bỏ mọi fallback `?? X[0]`: không tìm thấy item thì **bỏ node** và log `eventRepo.log('missing_item')`. | Unit test cho mỗi prefix `tfng:`, `head:`, `ltrap:`, `err:l1col_`: prompt chứa đúng text của item. Item không tồn tại thì node bị loại và không có review. |
| V1-3 | P1 | `V1DailyRun.tsx:137-142` | DB rỗng thì **ghi fixture test** (`buildV1FixtureCards`) vào IndexedDB thật của người dùng. Dữ liệu giả lẫn vào thống kê và FSRS. `src/test/fixtures` bị bundle vào production (`:47-51`). | DB rỗng thì hiện EmptyState "Làm placement hoặc chọn chủ đề" và gọi hàm seed thật từ `placementData`. Fixture chỉ dùng khi `import.meta.env.MODE === 'test'`. | Build prod không chứa chuỗi `v1_fixtures`. DB rỗng thì không có card `source: fixture`. |
| V1-4 | P1 | `engine.ts:930-936` | Distractor `recog` = `otherMeanings.slice(0,3)`, tức luôn là 3 nghĩa đầu của 2207 từ. Người chơi học thuộc 3 nghĩa sai. Placeholder "khái niệm học thuật khác (1)" làm lộ đáp án. | Chọn 3 distractor ngẫu nhiên có seed theo `cardId + reps`, ưu tiên cùng POS và cùng topic, độ dài nghĩa trong ±40%. | Test: 50 lần dựng prompt của 50 từ khác nhau cho ra ≥ 30 bộ distractor khác nhau. Không còn chuỗi "khái niệm học thuật khác". |
| V1-5 | P2 | `engine.ts:938`, `:831` | Vị trí đáp án đúng xoay theo tổng mã ký tự của `id`, nên cố định cho mỗi item qua mọi lần ôn. Người chơi nhớ vị trí thay vì nghĩa. | Seed theo `id + reps + dayKey`. | Test: cùng item, `reps` 0..3 cho ≥ 2 vị trí khác nhau. |
| V1-6 | P1 | `engine.ts:1133` | Khi không có dữ liệu tuần trước, câu thắng bịa "tuần trước X−5%". Đây là số liệu giả, vi phạm `02 §10` (khen cụ thể, có bằng chứng). | Fallback: "Tỷ lệ nhớ lượt đầu X% · combo dài nhất Y". `lastWeekAccuracy` lấy từ `attempts` 7 ngày trước (hiện component không truyền: `V1DailyRun.tsx:150-157`). | Test: `lastWeekAccuracy=null` thì chuỗi không chứa "tuần trước". |
| V1-7 | P1 | `V1DailyRun.tsx:625` | Checkpoint ghi "Tiến độ FSRS đã được ghi nhận" nhưng chưa lưu gì (chỉ lưu ở recap). | Lưu thật tại checkpoint (C2) hoặc sửa câu chữ. | E2E: checkpoint, reload, thì 20 review có trong DB. |
| V1-8 | P2 | `engine.ts:2146` + `:2378-2396` | Retry node giữ `stageIndex` của chặng cũ. Nếu bị chèn sang vùng chặng sau, chuyển từ retry (stage 0) sang node stage 1 sẽ bật **checkpoint giả** giữa chặng. | Retry node lấy `stageIndex` của node đứng trước vị trí chèn. | Test: sai ở node 19, retry chèn vào vị trí 22, chỉ có 1 checkpoint. |
| V1-9 | P2 | `V1DailyRun.tsx:150-157` | Không truyền `newCardsDoneToday`, nên mỗi run lại được 15 thẻ mới. Quota tính theo run, không theo ngày (`02 §3.5`). | Đếm review của card `state New` trong ngày từ `reviews` rồi truyền vào. | Chơi 2 run cùng ngày thì tổng thẻ mới ≤ 15. |
| V1-10 | P2 | `engine.ts:1397-1400` | `col_gap` sai thì `matchedTrap ?? l1Traps[0]` gắn giải thích "kiểu Việt" ngay cả khi người chơi không gõ cụm bẫy. Lỗi bị chẩn đoán sai. | Bỏ `?? l1Traps[0]`. Chỉ hiện `whyVi` khi khớp bẫy (dùng `scoreCollocationGap` của V2, vì nó đã chính xác hơn). | Test: gõ "xyz" thì `vnTrap` là undefined. |
| V1-11 | P3 | `engine.ts:2269` | "Dự báo ngày mai" dùng `now + 48h`, không phải hết ngày mai. | `endOfDay(now + 1 ngày)`. | Test với giờ cố định 23:00. |
| V1-12 | P3 | `engine.ts:1868-1877` | "Đã xem" +5 XP không cần gợi nhớ, vi phạm `02 §2.4` (XP chỉ từ gợi nhớ hoặc sản xuất). | Chuyển +5 sang lượt `recog` đúng đầu tiên của item mới. | |
| V1-13 | P3 | `V1DailyRun.tsx` (không có effect autoplay cho intro) | Spec §4.1: intro "🔊 tự phát". | `useEffect` khi `face==='intro'` thì `playCardAudio(audioUrl)` sau 250 ms. | |
| V1-14 | P3 | `V1DailyRun.tsx:150` (không truyền `startOnMap`) | Màn bản đồ đầu run (`map_intro`) không bao giờ hiện. | `startOnMap: true`. Map hiện full màn hình, Enter để bắt đầu. | |
| V1-15 | P3 | `V1DailyRun.tsx:668` | Màu cứng `#000000`, vi phạm `AGENTS §2`. | Dùng token `--color-boss-dim`. | grep `#000000` trong `src/games` = 0. |
| V1-16 | P3 | `V1DailyRun.tsx:1034` | Tiêu đề sai luôn ghi "quay lại sau 3–5 node", kể cả trong boss (boss chèn cuối hàng). | Đổi câu chữ theo `phase`. | |

### 2.7 Juice: đề xuất cụ thể V1
- **Đúng:** giữ `correctPopVariants`. Thêm icon ✓ vẽ nét `pathLength 0→1` trong 0,3 s (`10 §2`). Thêm số "+12" bay y 0→−24 px, opacity 1→0, `dur.celebrate` (0,6 s), gộp nếu nhiều lần trong 1 s. ĐẠT: 4 kênh (pop, glow, ✓, +XP) cộng SFX.
- **Combo:** `spring.bouncy`, scale 1.3→1. Icon lửa lớn theo bậc (16/20/24 px ở ×1/×2/×3). SFX `streak` rate 1/1.12/1.25. Combo vỡ: số rơi y +8 px và mờ, không âm báo.
- **Boss trúng đòn:** card rung `x: [0,-4,4,0]` 0,15 s, HP bar loé trắng opacity 0→0,6→0 trong 0,2 s, SFX `correct` rate 0.9 (nặng hơn).
- **Hạ boss:** giữ 8 mảnh, thêm `celebrate()` 80 hạt (nếu DECISIONS cho boss là "mốc").
- **Node hiện tại:** "thở" scale 1↔1.06, 1,6 s, lặp (chỉ ở node tròn, không đụng vùng chữ).

---

## 3. V2 · Collocation Forge

### 3.1 Cơ chế cốt lõi và vòng lặp
- Ba giai đoạn Nung → Đập → Tôi, có thêm bước Tự viết khi level ≥ 7 và Sprint 60 s. Mỗi "nhát đập" là một câu gõ, nên đúng P3/P4.
- Phiên khoảng 4–7 phút (3 câu chọn, 6–8 câu gõ, 2–3 vòng bẫy).
- Điểm quyết định: dùng gợi ý hay không. Giai đoạn Tôi có quyết định "cụm nào sai", đây là phần thú vị nhất. Nung thì không có quyết định thật (V2-1).

### 3.2 Sư phạm
- Tốt: `scoreCollocationGap` kiểm bẫy L1 trước, nhận cả full phrase lẫn token gap, bỏ mạo từ thừa, và có `alt_accepted` "Cũng có thể dùng: …" (`engine.ts:440-546`). Tạo `err:l1col_*` với Again khi mắc bẫy (`:977-993`). Feedback lỗi L1 có so sánh gạch ngang (`:478-481`).
- Yếu: câu sai ở Đập không quay lại trong phiên (`nextDapQuestion :1061-1090`), vi phạm P2 của `02 §1`. Câu sai không có "1 câu ví dụ khác" thật: `buildAlternativeExample` (`:292`) sinh từ template.

### 3.3 Độ khó
- Có bảng level (`selectGapForLevel`, số cụm sai 1–2 ở Tôi, Tự viết ≥ 7), nhưng level luôn là 1 (C1). Đập ở level 4–6 không sắp theo band (`:600-604` trả 0).

### 3.4 Phần thưởng
- XP đúng bảng (`:18-24`). Sprint có kỷ lục cá nhân trong `kv`.
- Sprint XP = `10 × combo` không trần (`:1403`): 30 câu đúng liền cho 10·(1+…+30) = 4650 XP, gấp khoảng 30 lần một lò đầy đủ. Lạm phát XP làm mất ý nghĩa thang level (V2-3).
- Không có màn "Kỷ lục mới!".

### 3.5 Juice

| Tương tác | Motion | SFX | Hạt | Rung | Số kênh |
|---|---|---|---|---|---|
| Chọn câu ở Nung | đổi viền | `tap` (`:389`) | 0 | 0 | 2 |
| Đúng (Đập/Tôi/Sprint) | panel `feedbackSlideVariants` (spring.soft) | `correct`, hoặc `streak` khi combo ≥ 3 (`:428`) | 6 tia lửa 0,35 s (`:791-818`) | 0 | 3 |
| Sai | đe rung `wrongShakeVariants` (`:780-783`) | `wrong` | 0 | 0 | 2–3 |
| Bẫy L1 ở Tôi bị lật | SVG nứt opacity/scale (`:1370-1394`) | `correct`/`wrong` | 0 | 0 | 2 |
| Combo | Pill tĩnh `x{combo}` (`:737-741`), không pop | `streak` cùng cao độ | 0 | 0 | 1 |
| Thêm vào kệ "Đã rèn" | không bay vào kệ (spec §6), chip hiện tĩnh (`:1264-1277`) | — | 0 | 0 | 0 |
| Sprint 10 s cuối | Timer component | `tick` | 0 | 0 | 2 |
| Hết giờ Sprint | — | `countdownEnd` (`:297`) | 0 | 0 | 1 |
| Hoàn thành lò (+40) | không | không có cue riêng | 0 | 0 | 0 |
| Kết thúc | Recap tĩnh | `sessionDone` | 0 | 0 | 1 |

### 3.6 Danh sách vấn đề V2

| ID | Mức | Vị trí | Vấn đề và lý do | Cách sửa | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| V2-1 | P1 | `engine.ts:552-597`; `V2CollocationForge.tsx:878` | Nung giải được không cần biết collocation: 2 câu đúng chính là `example` của `cols[0]` và `cols[1]` vừa hiện ở màn xem trước 8 s, và câu bẫy **luôn ở vị trí 2** (index 1). Bấm 1+3 là thắng. | Màn xem trước dùng `cols[0..2]`, quiz dùng câu **khác** (example thứ 2 hoặc từ `collocations` cùng topic). Xáo vị trí bằng seed. Spec "8 giây/thẻ": hiện lần lượt 3 thẻ × 8 s. | Test: 20 phiên seed khác nhau thì câu bẫy xuất hiện ở cả 3 vị trí. Câu trong quiz ≠ câu trong preview. |
| V2-2 | P1 | `V2CollocationForge.tsx:644-646`, `:238-251` | "Ôn ngay câu sai" chạy lại cả lò với `existingCards` **cũ** (trước phiên). FSRS chấm từ snapshot cũ rồi ghi đè lịch vừa lưu. XP cộng lại (C3). | Sau `saveSession`, nạp lại `cardRepo.getAll()` vào `existingCards`. Retry chỉ gồm câu sai, XP 0, không FSRS. | Test tích hợp: 2 phiên liên tiếp thì `reviews[1].prevState.reps` = `reviews[0]` sau lịch. |
| V2-3 | P1 | `engine.ts:1403` | Sprint XP `10 × combo` tuyến tính không trần, gây lạm phát XP. | `10 × min(getComboMultiplier(combo), 3)`, dùng bậc ×1/×2/×3 như V1 (5/10 đúng liền). Ghi DECISIONS. | Test: 30 đúng liền thì XP ≤ 30×30 = 900. |
| V2-4 | P2 | `engine.ts:1106-1144`; `:636-644` | Level ≥ 4 có vòng 2 cụm sai, nhưng chỉ bấm được 1 cụm, nên cụm bẫy thứ 2 không bao giờ được kiểm. | Bước `spot` cho chọn nhiều thẻ (toggle, 1–4), nút "Xác nhận". Chấm theo tập. | Test: vòng 2 bẫy, chọn đúng 2 thì +20, chọn 1 thì +10 kèm đánh dấu bẫy bị sót. |
| V2-5 | P2 | `engine.ts:683` | Vòng 0: bẫy luôn ở index 0 (xoay theo `r`). | Xáo vị trí bằng seed. | |
| V2-6 | P2 | `engine.ts:1061-1090` | Câu Đập sai không quay lại trong phiên. | Chèn lại câu sai ở cuối hàng Đập (tối đa 1 lần), XP 0, không FSRS lần 2. | Test: sai câu 2 thì câu đó xuất hiện lại trước khi sang Tôi. |
| V2-7 | P2 | `engine.ts:735-749`, `:1395-1396` | Sprint lấy **toàn bộ** collocation theo thứ tự data (không phải "headword đã rèn", không ngẫu nhiên). Ít item thì vòng lặp lại cùng câu và chấm FSRS nhiều lần trong 60 s. | Pool = card `col_gap` đã có, sắp theo `due`, xáo. Mỗi card chỉ review 1 lần mỗi sprint (lần sau XP vẫn có, không FSRS). | Test: sprint 40 câu với pool 10 thì `reviews` ≤ 10. |
| V2-8 | P2 | `engine.ts:1119-1135` + `:1200-1216` | Ở Tôi, bấm sai cụm rồi sửa sai thì **2 review Again** cho cùng card `err_fix` trong vài giây. | Gộp: 1 review mỗi vòng, rating theo kết quả tổng. | |
| V2-9 | P3 | `engine.ts:489` | `hasLeadingArticleInDisplay(...) \|\| true`: điều kiện luôn đúng, code chết. | Bỏ `\|\| true` hoặc bỏ hàm. | |
| V2-10 | P3 | `engine.ts:1340-1344` | Bước Tự viết coi là "đã dùng" nếu câu chứa từ gap (`have`, `make`…), nên khớp quá dễ. | Yêu cầu chứa cả `phrase` đã bỏ mạo từ (cho phép biến hình động từ). | |
| V2-11 | P3 | `V2CollocationForge.tsx:780-783` | Đe remount theo `key={anvilShakeKey}`, nên mỗi lần sai cả khối đe (gồm AudioButton) remount, mất focus và trạng thái audio. | Dùng `useAnimate` hoặc `controls.start('wrong')` thay vì đổi key. | |

### 3.7 Juice: đề xuất V2
- **Đúng:** giữ 6 tia lửa. Thêm SFX kim loại `impactMetal_light` (Kenney Impact, như spec §10), đe "nảy" scale 1→0.97→1.03→1 bằng `spring.bouncy`. Cụm vừa rèn bay từ câu xuống kệ: `layoutId={col.id}`, 0,35 s. ĐẠT: 4 kênh.
- **Hoàn thành lò:** đe phát sáng, viền `--color-writing` opacity 0→1→0 trong 0,6 s, cue `sessionDone`, và confetti nếu tránh 3/3 bẫy.
- **Sprint:** combo pop `spring.bouncy`. Cao độ `streak` tăng theo bậc. Kỷ lục mới: toast cộng `levelUp`.

---

## 4. V3 · Paraphrase Radar

### 4.1 Cơ chế cốt lõi và vòng lặp
- 12 lượt, mỗi lượt 14–25 s, phiên khoảng 4–5 phút. Hành động "khoá mục tiêu" (bấm hoặc kéo bôi cụm) chính là thao tác định vị của bài thi (P7). Cơ chế tốt.
- Điểm quyết định: chọn cụm nào trong khi bị áp lực giờ, và "KHÔNG CÓ" hay chọn. Quyết định thú vị nhưng bị lộ (V3-1, V3-2).

### 4.2 Sư phạm
- Tốt: chấm IoU theo ký tự 0,5/0,2, bắt decoy kèm `whyVi`, cảnh báo "chọn cả câu" (`engine.ts:463-541`). Sau chấm, target có viền xanh và decoy có viền cam đánh số ①② (`V3ParaphraseRadar.tsx:728-837`). Ghi tag `keyword_echo` khi ≥ 2 lần (`:385-391`).
- Hỏng: xem V3-1..V3-4.

### 4.3 Độ khó
- Bảng level đúng spec (`engine.ts:30-45`) nhưng level luôn là 1 (C1). Chọn item tất định: luôn 12 item đầu mỗi bucket (V3-3).

### 4.4 Phần thưởng
- 10 × hệ số tốc độ 1,5/1,2/1. Spec "Combo như chuẩn" nhưng không có hệ số combo (`engine.ts:486`).

### 4.5 Juice

| Tương tác | Motion | SFX | Hạt | Rung | Số kênh |
|---|---|---|---|---|---|
| Bấm từ (chọn cụm) | nền 28% và gạch chân (đổi màu) | `tap` (`:456`) | 0 | 0 | 2 |
| Khoá đúng | 4 góc ngoặc thu lại 0,25 s (`:753-787`) | `correct`/`streak` | 0 | 0 | 2–3 |
| Trúng decoy | ngoặc bật ra rồi rơi, scale 1.25, y +12 (`:814-822`) | `wrong` | 0 | 0 | 2 |
| Sai thường | không rung | `wrong` | 0 | 0 | 1 |
| 5 s cuối | ring đổi màu (`ProgressRing`), không pulse | `tick` (chỉ 5 s, spec 10 s) (`:302`) | 0 | 0 | 2 |
| Hết giờ | — | `countdownEnd` | 0 | 0 | 1 |
| Combo | Pill tĩnh (`:590-594`) | `streak` | 0 | 0 | 1 |
| Radar quét | vạch quét lề trái opacity 0,08, 2,5 s (`:648-663`), đúng spec | — | — | — | 1 (ambient) |
| Kết thúc | Recap tĩnh | `sessionDone` | 0 | 0 | 1 |

### 4.6 Danh sách vấn đề V3

| ID | Mức | Vị trí | Vấn đề và lý do | Cách sửa | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| V3-1 | **P1** | `V3ParaphraseRadar.tsx:628-630` | Pill "Level N" hiện **trước** khi trả lời. Data: L4 ↔ `not_equivalent` 32/32 (kiểm `public/data/vocab/paraphrases.json`). Thấy "Level 4" là biết bấm N. Bài tiền đề cho NOT GIVEN mất tác dụng. | Ẩn level trước khi chấm. Chỉ hiện ở feedback. | E2E: DOM trước khi khoá không chứa "Level". |
| V3-2 | **P1** | `engine.ts:136-214`; `V3ParaphraseRadar.tsx:448-462` | Mỗi target hoặc decoy là một chunk riêng, còn chữ thường bị chia cụm 3 từ. Bấm 1 từ thì nền tô **đúng** biên span đáp án (IoU = 1). Người chơi dò chunk "lạ độ dài" để tìm 2–3 ứng viên. | Chunk hoá độc lập với đáp án: dùng tokenizer cụm từ (cụm danh từ/động từ theo stopword) **trước**, không neo theo `target`/`decoy`. Chấm vẫn theo IoU. | Test: với 50 item, tỉ lệ chunk trùng khít target ≤ 30%. |
| V3-3 | P1 | `engine.ts:285-293` | Luôn lấy `pool[0..n]` theo thứ tự data, nên phiên nào cũng ra cùng 12 item. Học thuộc vị trí, và FSRS bị chấm lại cho item chưa đến hạn. | Ưu tiên card `para_match` đến hạn, rồi item chưa gặp, xáo theo seed ngày. Không lặp item đã chơi trong 24 h. | Test: 2 phiên liên tiếp trùng ≤ 2 item (khi pool ≥ 48). |
| V3-4 | P2 | `engine.ts:751-752` | "Né decoy" tính cả timeout, "KHÔNG CÓ" sai và không chọn, nên câu thắng bị thổi phồng. | `avoidedDecoy = isDecoyRound && correct`. | Test: timeout thì `decoysAvoided` không tăng. |
| V3-5 | P2 | `V3ParaphraseRadar.tsx:696-709` | Mỗi từ là `role="button" tabIndex=0`, nên đoạn 120 từ có 120 điểm Tab. Không có `aria-pressed`. Không chọn cụm nhiều từ bằng bàn phím được. | Một vùng `role="listbox"` với phím ←/→ di chuyển, Shift+←/→ mở rộng, Space chọn, `aria-activedescendant`. | Axe: 0 vi phạm. E2E: chọn cụm 3 từ chỉ bằng bàn phím. |
| V3-6 | P2 | `V3ParaphraseRadar.tsx:246-288, 300-306` | Side-effect trong updater (C7). | Như C7. | |
| V3-7 | P3 | `engine.ts:486` | Không có hệ số combo (spec §4). | `× getComboMultiplier(combo)` (cùng bảng V1). | |
| V3-8 | P3 | `V3ParaphraseRadar.tsx:302` | `tick` chỉ ở 5 s cuối, `10 §3` nói 10 s. Timer không pulse 1↔1.04 ở 10% (`10 §2`). | Dùng `Timer` component (đã có pulse) thay `ProgressRing`, tick ≤ 10 s. | |

### 4.7 Juice: đề xuất V3
- **Khoá đúng:** giữ ngoặc. Thêm vòng "ping" quanh target (scale 0.9→1.15, opacity 0.6→0, 0,35 s) và SFX `highlight` trước `correct` 60 ms (cảm giác "bíp khoá"). Số "+15" bay lên ở góc span.
- **Trúng decoy:** giữ ngoặc rơi, thêm `wrongShakeVariants` cho cả khung đoạn văn (biên độ 4 px).
- **Combo:** pop `spring.bouncy`, rate cao độ theo bậc.

---

## 5. R1 · TFNG Judge

### 5.1 Cơ chế cốt lõi và vòng lặp
- Phiên toà: trình vật chứng (bôi) rồi tuyên án T/F/NG. Bước ① bắt buộc (`engine.ts:606-626`). Đây là ví dụ tốt nhất của "cơ chế = học" trong nhóm.
- Một phiên là toàn bộ câu TFNG/YNNG của 1 passage (spec 6–8). Có Passage mode training và exam (ExamFrame 20 phút, tự nộp: `_shared/ExamFrame.tsx:88-95`).
- Điểm quyết định: bôi đâu, "Không tìm thấy" hay bôi, F hay NG. Quyết định thật và có giá trị thi.

### 5.2 Sư phạm
- Rất tốt: chấm 2 lớp 4 nhánh (Chuẩn/Đúng may/Hiểu sai/Lạc) có chẩn đoán riêng (`engine.ts:664-696`). NG xử lý đúng spec. Chặn bôi cả đoạn (`:323-327`). Ma trận nhầm lẫn 30 ngày lưu ở `kv` (`R1TfngJudge.tsx:604-611`). Gợi ý paraphrase từ `steps` có nút "+ Thêm vào ôn tập" (`engine.ts:372-404`). Tạo `tfng:<qid>` khi sai.
- Hỏng do nơi khác: thẻ `tfng:` sang V1 bị render sai (V1-2), nên vòng ôn lại của R1 thực tế không có.

### 5.3 Độ khó
- `getR1DifficultyConfig` có đủ 5 bậc, nhưng `allowedPassageLevels` và `mixTfngAndYnng` **không được dùng** (`engine.ts:48-110`, grep không có caller). Passage mặc định luôn là bài đầu tiên có câu TFNG (`R1TfngJudge.tsx:472-473`). Level luôn là 1 (C1).

### 5.4 Phần thưởng
- XP 15/5/0/0, gợi ý đoạn −50%. Không combo, không mốc. Recap có ma trận nhầm lẫn (tốt cho "cảm giác giỏi lên").

### 5.5 Juice

| Tương tác | Motion | SFX | Hạt | Rung | Số kênh |
|---|---|---|---|---|---|
| Bôi vật chứng | mark hiện (opacity/scale) | `highlight` (`:677`) | 0 | 0 | 2 |
| Tuyên án (bấm T/F/N) | búa scale 1→0.92→1, 0,12 s (`:1678-1687`) | `tap` rate 0.85 (`:691`) | 0 | 0 | 2 |
| Chuẩn | nút đáp án viền xanh, panel spring.soft | `correct` | 0 | 0 | 3 |
| Đúng may | viền vàng | `reveal` | 0 | 0 | 2 |
| Hiểu sai / Lạc | viền đỏ, **không rung** | `wrong` | 0 | 0 | 2 |
| Vàng quét bằng chứng | fade/scale 0,35 s (`Highlighter.tsx:420-426`), không quét trái→phải như `10 §2`; có auto-scroll (`Highlighter.tsx:254-263`) | — | 0 | 0 | 1–2 |
| Vượt mục tiêu giờ | chữ đổi màu (`:1143-1152`) | không | 0 | 0 | 1 |
| Hết giờ exam | — | `countdownEnd` | 0 | 0 | 1 |
| Kết thúc | Recap tĩnh + ma trận | `sessionDone` | 0 | 0 | 1–2 |

### 5.6 Danh sách vấn đề R1

| ID | Mức | Vị trí | Vấn đề và lý do | Cách sửa | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| R1-1 | P2 | `engine.ts:48-110`; `R1TfngJudge.tsx:472-473` | `allowedPassageLevels` và `mixTfngAndYnng` là cấu hình chết. Mặc định luôn mở cùng 1 passage (24 bài có sẵn), nên học thuộc đáp án. | Chọn passage: lọc theo `allowedPassageLevels`, loại bài chơi trong 14 ngày (`attempts`), ưu tiên bài chưa chơi. Level ≥ 7 trộn câu TFNG và YNNG của 2 passage. | Test: 3 phiên liên tiếp ra 3 passage khác nhau. Level 9 chỉ ra P3. |
| R1-2 | P2 | `engine.ts:97` | Level 7–8 mục tiêu 65 s/câu. Spec: 55 s từ level 8+. | Level 8: 55. | |
| R1-3 | P3 | `engine.ts:667-670` | `fsrsRating` (Easy khi ≤ 30 s, bỏ qua `cardStreak` ≥ 2 của `02 §3.3`) được tính nhưng không dùng ở đâu. Code chết, gây hiểu nhầm. | Bỏ field hoặc dùng `autoRate`. | |
| R1-4 | P3 | `R1TfngJudge.tsx:745-753` | Phím N là NOT GIVEN ở TFNG nhưng là NO ở YNNG. Khi trộn ở level ≥ 7 sẽ dễ bấm nhầm theo phản xạ. | Ở YNNG, đổi nhãn nút thành "NO (N)" và có banner đổi dạng 1,5 s khi chuyển nhóm. Hoặc dùng phím 1/2/3 chung. | |
| R1-5 | P2 | `Highlighter.tsx:375` (`onMouseUp`) | Bôi chỉ bằng chuột. Không có pointer/touch, không có bàn phím. Spec §11 yêu cầu chạm-giữ-kéo trên mobile. | Đổi sang `onPointerUp` cộng `selectionchange`. Bàn phím: chế độ "Chọn câu" điều hướng bằng ↑/↓ theo câu, Enter để bôi. | E2E mobile 360 px: bôi được 1 câu bằng touch. |
| R1-6 | P3 | `R1TfngJudge.tsx` (vấn đề cấu trúc) | 1910 dòng (C8). | Tách 3 view. | |

### 5.7 Juice: đề xuất R1
- **Tuyên án:** búa 0,12 s là ổn. Thêm "thud": card câu hỏi dịch y 0→2→0 px trong 0,12 s và một vòng sóng (scale 0.8→1.4, opacity 0.4→0, 0,3 s) ở nút.
- **Chuẩn:** thêm con dấu "CHUẨN" đóng xuống (scale 1.4→1, rotate −8°, `spring.bouncy`) trên panel.
- **Sai:** `wrongShakeVariants` cho nút đã chọn.
- **Vàng quét:** `clip-path` không được animate theo luật transform/opacity. Dùng lớp phủ `scaleX 0→1`, `origin-left`, 0,4 s (`10 §2`).
- **Kết thúc với ≥ 6/7 Chuẩn hoặc FALSE/NG 5/5:** toast "Phán quyết sắc bén" cộng `levelUp` (là mốc kỹ năng, cần ghi DECISIONS).

---

## 6. R2 · Headline Editor

### 6.1 Cơ chế cốt lõi và vòng lặp
- Toà soạn: bôi ý chính rồi đặt tít. Heading chỉ dùng 1 lần, bị khoá. Có chấm từng đoạn và chấm cuối bài (`engine.ts:184-192`). Phiên 5–7 đoạn, khoảng 5–8 phút.
- Điểm quyết định: tít nào khi còn heading thừa. Ở chế độ cuối bài có thể đổi chéo. Tốt.

### 6.2 Sư phạm
- Tốt: 4 nhánh XP đúng spec, thưởng tốc độ +5 (`engine.ts:368-469`). Feedback theo `distractorType`; heading không có trong distractor thì suy ra `adjacent_paragraph` (`:330-358`). Tạo `head:<qid>` khi sai, không tạo cho passage reserved.
- Hỏng do nơi khác: `head:` sang V1 bị render sai (V1-2).

### 6.3 Độ khó
- Có công tắc level 3/8 thủ công trong UI (`R2HeadlineEditor.tsx:741, 762`), tốt hơn các game khác. Nhưng `extraHeadings` không dùng (`engine.ts:160-192`), số heading là số có trong data. Lọc loại distractor theo level (spec §5) chưa làm.

### 6.4 Phần thưởng
- XP, thưởng tốc độ. Recap "trang báo". Không combo, không mốc.

### 6.5 Juice

| Tương tác | Motion | SFX | Hạt | Rung | Số kênh |
|---|---|---|---|---|---|
| Chọn tít | nút đổi màu (không bay sang đoạn như spec §10, không có `layoutId`) | `page` (`:247`) | 0 | 0 | 2 |
| Tít đã dùng bị từ chối | `wrongShakeVariants` (bỏ qua reduced-motion, `:607`) | `wrong` | 0 | 0 | 2 |
| Chấm đúng (từng đoạn) | tít in lên đầu đoạn bằng spring.snappy (`:979-986`) | `correct` | 0 | 0 | 2–3 |
| Chấm sai | feedback remount theo `shakeTrigger` (`:1076`) | `wrong` | 0 | 0 | 2 |
| Nộp cả bài (level ≥ 7) | không | **không có SFX** (`:281-297`) | 0 | 0 | 0–1 |
| Chuyển đoạn | cuộn mượt (`:166-175`) | `page` | 0 | 0 | 2 |
| Kết thúc | Recap | `sessionDone` | 0 | 0 | 1 |

### 6.6 Danh sách vấn đề R2

| ID | Mức | Vị trí | Vấn đề và lý do | Cách sửa | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| R2-1 | P2 | `R2HeadlineEditor.tsx:117-121` | Luôn mở `catalog[0]` (18 bài có headings). | Như R1-1. | |
| R2-2 | P2 | `engine.ts:160-192` | `extraHeadings` (+2/+3) và lọc loại distractor theo level không dùng. Độ khó không đổi theo level. | Khi tạo phiên: lấy heading đúng cộng `extraHeadings` heading bẫy, chọn theo `distractorType` được phép ở level đó. | Test: level 1 có `headings.length` = số đoạn + 2, chỉ gồm `detail_only` và `keyword_match`. |
| R2-3 | P2 | `R2HeadlineEditor.tsx:200-218` | Exam mode không ghi `bandEvidence`. `02 §7` nói exam của R1/R2 tính vào band Reading. | Thêm `bandEvidence` khi `gameMode==='exam'`. | |
| R2-4 | P2 | `R2HeadlineEditor.tsx:281-297` | Nộp cả bài không có phản hồi âm thanh hay chuyển động cho từng kết quả. | Lật lần lượt từng đoạn cách 120 ms, mỗi đoạn `correct`/`wrong` với âm lượng 60%, rồi `sessionDone`. | |
| R2-5 | P3 | `R2HeadlineEditor.tsx:607` | Rung heading không kiểm reduced-motion. | `variants={prefersReduced ? undefined : wrongShakeVariants}`. | `e2e/motion.spec` pass. |
| R2-6 | P3 | `R2HeadlineEditor.tsx:628` | Màu cứng `#0B0F1A`. | Token `--color-on-reading`. | |
| R2-7 | P3 | spec §10 | Tít không "bay" từ kho sang đầu đoạn (không có `layoutId`). Sai thì không bay về. | `layoutId={'head-'+key}` giữa nút trong kho và tít in, `spring.soft`. | |

---

## 7. `_shared` (phần dùng bởi nhóm A)

| ID | Mức | Vị trí | Vấn đề | Cách sửa |
|---|---|---|---|---|
| S-1 | P2 | `_shared/PassageView.tsx` + `design/components/Highlighter.tsx:375` | Bôi bằng chuột (xem R1-5). Toolbar exam có `role="toolbar"` (tốt). Tab Bài đọc/Câu hỏi có `role="tab"` và `aria-selected` (tốt). | Như R1-5. |
| S-2 | P3 | `_shared/ExamFrame.tsx:68-71` | `setExamMode(true)` toàn cục khi mount. Nếu 2 ExamFrame chồng (hiếm) thì unmount 1 cái sẽ bật lại SFX. | Đếm tham chiếu (`examModeRefCount`). |

Điểm mạnh `_shared`: ExamFrame tắt SFX trừ `countdownEnd`, tự nộp khi hết giờ, giao diện thi trung tính đúng `10 §3` và R1 §10.

---

## 8. Điểm mạnh đáng giữ (không đụng khi refactor)

- **Engine thuần, có test:** `v1…/engine.test.ts` (711 dòng), V2 353, V3 281, R1 520, R2 347. Logic không import React, đúng `AGENTS §2`.
- **V1:** FSRS chỉ ghi lượt đầu. Chèn lại 3–5 node, tránh liền item. `computeCharDiff` và `analyzeSpellingError` (gợi ý chữ đôi, âm câm). Biến thể Anh-Anh/Anh-Mỹ. Boss HP vỡ 8 mảnh. Tự chuyển 1,2 s khi đúng, chờ Enter khi sai (đúng spec §6). Toàn bộ chơi được bằng bàn phím (1–4, H, Enter).
- **V2:** `scoreCollocationGap` phát hiện bẫy L1 cả dạng token lẫn full phrase. Thông điệp "Cũng có thể dùng". Khung so sánh ~~sai~~ → **đúng**. 6 tia lửa đúng thông số spec (0,35 s, transform/opacity). Item `err:l1col_*` cho SRS.
- **V3:** IoU theo ký tự có 3 ngưỡng. Hệ số tốc độ. Cảnh báo "chọn cả câu". Ngoặc khoá mục tiêu 0,25 s. Decoy đánh số ①②. Vạch radar ở lề trái không đè chữ. Log tag `keyword_echo`.
- **R1:** chấm 2 lớp 4 nhánh có chẩn đoán định vị/logic riêng. Xử lý NG chuẩn. Chặn bôi quá rộng (1,35 × câu). Ma trận 30 ngày. Gợi ý paraphrase vào SRS. ExamFrame tự nộp.
- **R2:** khoá heading 1 lần. Hai chế độ chấm. Suy luận `adjacent_paragraph`. Tít in kiểu báo bằng spring. Phím 1–9/0.

---

## 9. Lộ trình sửa đề xuất (theo thứ tự)

1. **Tuần 1 (P0):** V1-1 (intro loop), V1-2 (render mọi face, bỏ fallback `[0]`), C1 (adaptive + PlayScreen truyền level/mode).
2. **Tuần 2 (P1):** C2 (lưu từng phần), V1-3/4/6/7, V2-1/2/3, V3-1/2/3.
3. **Tuần 3 (Juice pass):** C4 (recap đếm số + stagger), C5 (confetti ở mốc), C10 (cao độ combo), "+XP" bay lên, ✓ vẽ nét. Mục tiêu ĐẠT: mọi tương tác "đúng" có ≥ 4 kênh (motion + SFX + màu/glow + số/hạt). Mọi "kết thúc" có ≥ 3 kênh (đếm số, SFX, confetti khi đạt mốc).
4. **Tuần 4 (P2/P3 và refactor):** C7, C8, a11y (V3-5, R1-5), các lệch spec còn lại.

Cổng đo cho juice (đề xuất bổ sung vào `docs/13-QA-AND-POLISH.md`):
- Spy `playSfx`: mỗi kết quả lượt có đúng 1 cue kết quả. Combo 3/5/10 có `rate` 1/1.12/1.25.
- `e2e/motion.spec.ts` mở rộng cho V2, V3, R2 (hiện chỉ V1 và R1).
- Profile 30 s của V2 Sprint (CPU 4×): không frame nào > 32 ms.
