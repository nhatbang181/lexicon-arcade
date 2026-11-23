# 01 · CÁC GAME LUYỆN IELTS: cơ chế, độ vui, sư phạm, độ khó, phần thưởng, juice

> Danh sách lỗi đầy đủ (mỗi lỗi có file:dòng, mức, cách sửa, tiêu chí ĐẠT):
> - `phu-luc/A-game-tu-vung-reading.md`: V1, V2, V3, R1, R2 + `_shared`
> - `phu-luc/B-game-listening-writing-speaking.md`: L1, L2, W1, W2, hệ chấm Claude, Speaking, X1, audio
> File này tổng hợp: điểm, **gốc rễ** chung, vấn đề nặng nhất từng game, và **hướng nâng cấp để game vui thật**.
> Luật liên quan: `LUAT.md` B1–B7, J1–J9.

## 1. Điểm hiện tại (/10)

| Game | Cơ chế | Độ vui | Sư phạm | Độ khó | Thưởng | Juice | **TB** | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| V1 Daily Run | 6 | 5 | 3 | 3 | 5 | 5 | **4,5** | chơi được, lõi SRS hỏng |
| V2 Collocation Forge | 6 | 5 | 6 | 3 | 4 | 5 | **4,8** | chơi được |
| V3 Paraphrase Radar | 6 | 5 | 4 | 3 | 4 | 5 | **4,5** | chơi được, lộ đáp án |
| R1 TFNG Judge | 8 | 5 | 8 | 3 | 4 | 4 | **5,3** | tốt nhất về sư phạm |
| R2 Headline Editor | 7 | 5 | 7 | 4 | 4 | 4 | **5,2** | chơi được |
| L1 Trap Detector | 7 | 4 | 6 | 4 | 3 | 2 | **4,3** | 28/32 bài **không có audio** |
| L2 Dictation Ladder | 7 | 5 | 6 | 4 | 4 | 5 | **5,2** | 60/300 câu có audio |
| W1 Essay Lab | 7 | 3 | 6 | 3 | 3 | 2 | **4,0** | autosave giả, band bị làm bẩn |
| W2 Writing Sprints | 7 | 6 | 5 | 4 | 5 | 5 | **5,3** | nhịp tốt nhất |
| S1 Mock Examiner | – | – | – | – | – | – | **0** | placeholder (core ~25%) |
| S2 3-Second Rule | – | – | – | – | – | – | **0** | placeholder (~20%) |
| X1 Exam Room | – | – | – | – | – | – | **0** | placeholder (~5%, chưa có data) |
| **Trung bình 9 game có** | 6,8 | 4,8 | 5,8 | 3,4 | 4,0 | 4,1 | **4,8** | |

**Kết luận một câu:** engine thuần được thiết kế kỹ và có test (377 test xanh), nhưng **các dây nối giữa game bị đứt** (SRS, độ khó, lưu tiến độ), và **lớp "game" mới ở mức bài tập có hiệu ứng** – chưa có cảm giác tay, nghi thức thưởng, hay lựa chọn chiến thuật như Balatro/Duolingo.

## 2. Năm gốc rễ chung (sửa 1 chỗ, hết lỗi ở nhiều game)

| # | Gốc rễ | Vị trí | Ảnh hưởng | Mức | Cách sửa | Tiêu chí ĐẠT |
|---|---|---|---|---|---|---|
| G1 | **Thẻ SRS không có nội dung.** L1, L2, W1, W2, V2 tạo thẻ chỉ có `itemId` (`err:user_*`, `err:w2_*`, `ltrap:*`, `err:l1col_*`); R1/R2 tạo `tfng:*`, `head:*` nhưng V1 không có renderer → V1 rơi về `content.vocab[0]` / `content.errors[0]` và **chấm FSRS thẻ thật bằng câu trả lời cho item khác** | tạo: `l1 engine.ts:1114-1139`, `l2 engine.ts:978-993`, `W1EssayLab.tsx:721-731`, `W2WritingSprints.tsx:327-329`, `v2 engine.ts:196`; đọc: `v1 engine.ts:699-725, 801, 821, 853, 875, 906-907` | toàn bộ vòng "lỗi → ôn lại" (`docs/02` §3.4) hiển thị sai | **P0** | Bảng Dexie mới `userItems {id, kind, front, back, noteVi, audioClip?{src,start,end}, source, createdAt}` (tăng version + migrate, `LUAT.md` P8). Producer ghi item + card trong 1 transaction. V1 thêm renderer `tfng_retry`, `head_retry`, `ltrap_replay`, `dict_full`, `err_user`. **Bỏ mọi fallback `?? X[0]`**: không tìm thấy item → bỏ node + `eventRepo.log('missing_item')` | E2E: sai Q4 ở L1 → V1 phát đúng đoạn bẫy Q4; thêm 1 lỗi W1 → V1 hiện đúng câu đó; grep `?? content\.\w+\[0\]` trong `src/games` = 0 |
| G2 | **Không có độ khó thích ứng.** `PlayScreen` truyền cứng `mode="training" level={1}`; `adjustDifficulty` không có caller; config độ khó của V2, V3, R1, R2, L1 là code chết | `src/app/screens/PlayScreen.tsx:92,120`; `src/core/adaptive/difficulty.ts:61` | mọi người chơi ở level 1 mãi; placement vô nghĩa | **P0** | `src/core/adaptive/sessionLevel.ts` (xem `05-FLOW.md` F6); mỗi game đọc `level` từ props, không tự giữ level | Unit: 20 lượt 95% → +1; 60% → −1. E2E: V3 hai phiên 100% → phiên 3 `timeLimitSec` giảm |
| G3 | **Chỉ lưu ở màn Recap.** Thoát giữa phiên (✕, Esc, đóng tab) mất FSRS, XP, attempt; W1 "tự lưu nháp" là giả | `V1DailyRun.tsx:281-307,625`; V2 `:331`; V3 `:354`; R1 `:562`; R2 `:177`; `W1EssayLab.tsx:394-404` | mất bài viết 40 phút; mất tiến độ ôn | **P0** | `attemptRepo.saveProgress` mỗi lượt (debounce 500 ms) + flush `pagehide`; W1 `essayRepo.saveDraft` debounce 1,5 s + hỏi khôi phục | V1: 5 thẻ → reload → 5 review trong DB. W1: 30 từ → reload → khôi phục đủ |
| G4 | **"Ôn lại câu sai" chạy lại cả phiên**, cộng lại XP, chấm lại FSRS, ghi lại band (L1 Exam) | V2 `:644-646`, V3 `:510`, R1 `:1417`, R2 `:430`, L1 `:684-697` | lạm phát XP, FSRS bị chấm đôi, band bẩn | P1 | Phiên retry: tối đa 5 câu sai, `isRetry:true` → XP 0, không `scheduleCard`, không `bandEvidence` | Unit: retry `xp===0 && reviews.length===0` |
| G5 | **Recap tĩnh + không có nghi thức thưởng.** `canvas-confetti` đã cài nhưng **không game V3 nào gọi**; Recap có số giả mặc định (`accuracyPercent=80`, `durationSec=240`); badge/level có code nhưng không nối | `src/design/components/RecapScreen.tsx:31-32`; `badges.ts:112`; `xp.ts:105` | cảm giác "làm xong bài tập" thay vì "thắng ván" | P1 | Recap mới theo `03-ANIMATION-FEEDBACK.md` §3 dòng 16; `celebrate()` dùng chung; nối badge/level vào `saveSession` | Recap ≥ 3 kênh; 0 giá trị mặc định giả |

## 3. Vấn đề nặng nhất của từng game (top 3, đầy đủ ở phụ lục)

| Game | # | Vấn đề | Vị trí | Mức |
|---|---|---|---|---|
| **V1** | V1-1 | Mọi thẻ vocab `New` bị ép thành thẻ giới thiệu; "Đã xem" không ghi FSRS → từ mới **không bao giờ** tới bước tự gõ | `v1 engine.ts:1598-1600, 699-702, 1868-1882` | P0 |
| | V1-3 | DB rỗng → ghi **fixture test** vào IndexedDB thật | `V1DailyRun.tsx:137-142` | P1 |
| | V1-4 | 3 nghĩa nhiễu luôn là 3 nghĩa đầu của 2 207 từ; vị trí đáp án cố định theo id | `engine.ts:930-938` | P1 |
| **V2** | V2-1 | Màn "Nung" giải được không cần biết collocation: câu đúng = câu vừa xem, câu bẫy luôn ở vị trí 2 | `v2 engine.ts:552-597` | P1 |
| | V2-3 | Sprint XP `10 × combo` không trần (30 câu = 4 650 XP) | `engine.ts:1403` | P1 |
| | V2-4 | Vòng 2 cụm sai chỉ cho chọn 1 | `engine.ts:1106-1144` | P2 |
| **V3** | V3-1 | Pill "Level 4" hiện trước khi trả lời, mà Level 4 = luôn "KHÔNG CÓ" (32/32) | `V3ParaphraseRadar.tsx:628-630` | P1 |
| | V3-2 | Bấm 1 từ tô đúng biên span đáp án → dò được đáp án | `v3 engine.ts:136-214` | P1 |
| | V3-3 | Phiên nào cũng 12 item đầu tiên | `engine.ts:285-293` | P1 |
| **R1** | R1-1 | Luôn mở cùng 1 passage; `allowedPassageLevels` không dùng | `R1TfngJudge.tsx:472-473` | P2 |
| | R1-5 | Bôi bằng chứng chỉ bằng chuột (không touch, không phím) | `Highlighter.tsx:375` | P2 |
| **R2** | R2-2 | `extraHeadings` và lọc loại nhiễu theo level không dùng | `r2 engine.ts:160-192` | P2 |
| | R2-3 | Exam không ghi band Reading | `R2HeadlineEditor.tsx:200-218` | P2 |
| **L1** | L1-01 | 28/32 episode thiếu MP3 → "mô phỏng im lặng" + "Đọc kịch bản" **cả ở Exam**, vẫn ghi band Listening | `L1TrapDetector.tsx:1791-1836`; `trackPlayer.ts:278-282`; `engine.ts:1144` | P0 |
| | L1-02..06 | Chấm đáp án lệch chuẩn IELTS: số điện thoại có dấu cách bị tính quá số từ; `9.30`≠`9:30`; `nine thirty`=39; `£12.50`≠`12.50`; `second floor` trượt TWO WORDS | `src/core/scoring/listeningAnswer.ts:41-45, 205-216, 254-260, 294-378, 485-490` | P1 |
| | L1-08/09 | Retry phát lại cả bài, cộng lại XP và band; Exam làm lại vô hạn vẫn tính band | `L1TrapDetector.tsx:684-697, 1594-1604` | P1 |
| **L2** | L2-01 | 240/300 câu không có audio; bộ chọn tất định → mỗi level luôn đúng 10 câu cố định; không có data level 7–10 | phụ lục B §3.4 | P0/P1 |
| **W1** | W1-01 | Autosave giả; "Chọn đề khác" xoá bài không hỏi; Exam hết giờ không tự nộp | `W1EssayLab.tsx:394-404, 1160, 384-392` | P0 |
| | W1-04/05 | Nút "Dán kết quả mẫu" (fixture) có ở production; "Phân tích & Lưu" bấm nhiều lần = nhiều band + XP; lệch attemptId vẫn lưu | `GradingPanel.tsx:438-465, 640-650`; `postcheck.ts:267-272` | P0 |
| | §4.5 | Luồng chấm copy/dán: ~9 thao tác + 2 lần đổi tab | phụ lục B §4.5 | P2 |
| **W2** | W2-01 | Kết quả Claude dán sau Recap không bao giờ được lưu | `W2WritingSprints.tsx:472-501, 636-651` | P1 |
| | W2-02 | Cùng level luôn ra cùng 6 biểu đồ / 4 đề | `w2 engine.ts:301-316, 486-501` | P1 |
| | W2-04 | Bài mẫu hiện cùng lúc với checklist tự chấm → sao bị phồng | `W2WritingSprints.tsx:1175-1312` | P2 |
| **S1/S2/X1** | – | Chưa có game. Speech core có (~2 800 dòng + test), data text có, **0 file audio giám khảo**, `public/data/exam/` không tồn tại | `src/games/registry.ts:154-214` | P1 (lỗ hổng sản phẩm lớn nhất: Speaking ≥ 7,5 không có chỗ luyện) |

## 4. Độ khó và độ phủ band (chuẩn mới)

- **Một thang chung** cho mọi game: level 1–10 ↔ band mục tiêu. `level = clamp(round((band − 4.0) × 2) + 1, 1, 10)` → band 4.0 = L1, 6.0 = L5, 8.0 = L9, 8.5+ = L10.
- **Cửa sổ 20 lượt, mục tiêu đúng 80–85%** (`docs/02`): ≥ 90% → +1; ≤ 65% → −1; cooldown 10 lượt. Exam không đổi level.
- **Hiển thị**: chip "Band ≈ 6.5" (không hiện "Level N", luật D7). Lên level → nghi thức file 03 §3 dòng 19.
- **Chọn item**: mỗi game lọc pool theo `difficulty` trong `[level−1, level+1]`, ưu tiên thẻ đến hạn → item chưa gặp → item cũ nhất; xáo theo seed `ngày + gameId`; không lặp item đã chơi trong 24 h (V3, W2) hoặc 14 ngày (R1, R2 passage).
- Ngưỡng độ phủ dữ liệu theo band: xem `04-DATA-NOI-DUNG.md` §3.

## 5. Kinh tế phần thưởng (thống nhất, ghi vào `DECISIONS.md`)

> Bảng này **thay** các hệ số riêng hiện có (V1 ×2 ở 5 đúng liền/×3 ở 10, V2 Sprint `10 × combo` không trần, V3 không có combo). Mục đích: một thang XP công bằng giữa các game, không lạm phát.

| Hành động | XP | Ghi chú |
|---|---|---|
| Gợi nhớ đúng lượt đầu (V1/V2/V3, câu luyện) | 10 | × combo (×1 → ×1,5 ở 5 đúng liền → ×2 ở 10), **trần ×2** |
| Sản xuất đúng (gõ cả cụm, chép cả câu, viết câu) | 15 | × combo, trần ×2 |
| Bằng chứng chuẩn (R1 "Chuẩn", L1 gắn nhãn bẫy đúng) | +5 | |
| Hoàn thành phiên | +20 | chỉ 1 lần/game/ngày ở mức đầy đủ, lần sau +5 |
| Bài viết W1 nộp đủ thời gian (không paste) | 50 | chấm Claude +20, **chỉ bản 1** |
| Retry, "Đã xem" thẻ intro, chơi lại item trong 24 h | **0** | |
| Exam | 0 XP (B7); chỉ band | |

**Level người chơi**: `xpToLevel` hiện có; đường cong `XP(level) = 100 × level^1.6`. Lên level → nghi thức + mở 1 "Bùa" (mục 6.2).
**Huy hiệu** (12 cái đã có trong `badges.ts`): nối vào `saveSession`, hiện toast + thẻ huy hiệu trong Thống kê.
**Bộ sưu tập**: mỗi item lên *Mastered* thành 1 thẻ trong "Sổ từ" (Thư viện) có "edition" ánh kim (file 03 §5) – cảm giác sưu tầm kiểu Pokédex, đúng hành động học (B1).

## 6. Hướng nâng cấp để game **vui thật** (không phá sư phạm)

### 6.1 Nguyên tắc
1. Cơ chế vẫn là hành động học (B1). "Vui" đến từ **lựa chọn có rủi ro – phần thưởng**, **nhịp**, **nghi thức thưởng**, **sưu tầm**, không đến từ trang trí.
2. Mỗi game có **1 quyết định thật mỗi lượt** (bây giờ V1/V3 gần như không có).
3. Mỗi phiên có **đỉnh cảm xúc**: boss, combo dài, kỷ lục, lên band.

### 6.2 Hệ "Bùa" (học từ Balatro Joker, áp lên hành động học) – P2, làm sau khi hết P0/P1
- Người chơi giữ tối đa **3 Bùa** đang dùng; Bùa mở khi lên level người chơi hoặc đạt huy hiệu.
- Mỗi Bùa **chỉ thay đổi cách tính điểm của hành động học**, không cho đáp án. Ví dụ:
  | Bùa | Hiệu ứng | Khuyến khích hành vi học |
  |---|---|---|
  | Thợ rèn | collocation gõ đúng không cần gợi ý ×1,5 XP | tự sản xuất |
  | Tai thính | L2 đúng ở lượt phát đầu +5 | nghe kỹ lần đầu |
  | Thẩm phán | R1 "Chuẩn" liên tiếp 3 lần → +15 | bằng chứng chính xác |
  | Không cầu cứu | phiên không dùng gợi ý → ×1,2 XP cuối phiên | tự gợi nhớ |
  | Bậc thầy chính tả | V1 `listen_spell` đúng 5 liền → mở thẻ hiếm | chính tả |
- Bùa là thẻ `LiveCard` có edition; hiển thị ở HUD góc phải (thu nhỏ).
- Exam: Bùa tắt.

### 6.3 Đề xuất theo game

| Game | Thêm quyết định / đỉnh cảm xúc | Thông số |
|---|---|---|
| V1 | Bản đồ run có **ngã ba** sau mỗi chặng: "Đường an toàn" (thẻ đến hạn thường) hoặc "Đường gai" (5 thẻ retrievability thấp nhất, ×1,5 XP). Boss có **luật boss** ngẫu nhiên: "không gợi ý", "phải gõ", "chỉ nghe" | ngã ba hiện 1,2 s, Enter = an toàn, → = gai |
| V2 | Nung = chọn **1 trong 3 lò** (chủ đề) – quyết định trước phiên; Tôi = chọn nhiều cụm sai (V2-4) | tối đa 4 cụm/vòng |
| V3 | **Đặt cược**: trước khi khoá, chọn "Chắc" (×1,5 nếu đúng, −combo nếu sai) hoặc "Thử" (×1) | phím 1/2 |
| R1 | **Con dấu**: "Chuẩn" đóng dấu đỏ; 5 Chuẩn liên tiếp = "Phán quyết sắc bén" | dấu `scale 1.4→1`, `rotate −8°` |
| R2 | Tít **bay** từ kho sang đoạn (`layoutId`); nộp cả bài lật kết quả từng đoạn 120 ms (kiểu Balatro tính điểm từng lá) | |
| L1 | Chip **dự đoán loại đáp án** được chấm (+2 XP/đúng) → quyết định thật trước khi nghe | |
| L2 | "Thang" leo có tầng thật: đúng 3 câu liền ở tốc độ hiện tại → mở tầng nhanh hơn ngay trong phiên | |
| W1 | Mục tiêu nhỏ trong bài lớn: "0 cliché", "≥ 3 collocation đã rèn", "đủ 250 từ trước 35 phút" → 3 ngôi sao hiện ở Recap | |
| W2 | giữ nhịp hiện tại; thêm combo pop + cao độ | |
| S2 (mới) | ⚡ combo khi bắt đầu nói < 3 s; vòng sáng theo RMS; 8 câu/phiên | làm **trước** S1 |

## 7. Thứ tự làm (khớp `TASKS.md`)
1. **Đợt 1 – Sửa móng (P0):** G1, G2, G3, L1-01 (ẩn bài thiếu audio + chặn transcript ở Exam), W1-04/05, V1-1, V1-3.
2. **Đợt 2 – Đúng và công bằng (P1):** G4, V1-4, V2-1/3, V3-1/2/3, L1-02..10, W1-02/03/06, W2-01/02, render audio L1 (28) + L2 (240).
3. **Đợt 3 – Juice và thưởng:** G5, file 03 bảng §3 cho mọi game, kinh tế XP §5, huy hiệu, bộ sưu tập.
4. **Đợt 4 – Vui thật:** Bùa §6.2, đề xuất §6.3, S2 → S1 → X1 (phối hợp M5, `LUAT.md` A3).

## 8. Tiêu chí ĐẠT của mảng
- 0 lỗi P0/P1 còn mở trong 2 phụ lục A, B (đánh dấu ✅ kèm commit).
- Mỗi game: E2E chơi 1 phiên **chỉ bằng bàn phím** pass; thoát giữa phiên giữ dữ liệu; retry 0 XP.
- Rubric `KIEM-THU.md` §3, chấm từng game: "Cơ chế" ≥ 8, "Độ vui" ≥ 8, "Sư phạm" ≥ 9, "Độ khó thích ứng" ≥ 8, "Phần thưởng" ≥ 8, "Juice" ≥ 9.
