# 09 · PHƯƠNG PHÁP HỌC (ưu tiên số 2, chỉ sau dữ liệu)

> **Thứ tự ưu tiên của Bang (25/11/2026):** **1. Dữ liệu → 2. Phương pháp học → 3. UI/UX → 4. Tối ưu web → 5. Animation.**
> Khi phải chọn, hai thứ đầu luôn thắng. Một hiệu ứng đẹp làm hỏng phương pháp học (che chữ, làm vội, thưởng cái sai) là **lỗi CHẶN**.
> File này chọn các phương pháp **đã nổi tiếng và có nghiên cứu nền**, chuyển mỗi phương pháp thành **luật đo được** cho từng game. Mã luật dạng `PP-xx`. Luật PP cộng thêm vào `LUAT.md` mục B, không thay thế.

> **Cập nhật 25/11 sau nghiên cứu:**
> - Plan đầy đủ có nguồn ở `docs/audit-max/reports/Nghiên cứu plan game học IELTS.md`; ánh xạ vào task và các quyết định khi lệch ở `07-PLAN-TONG.md`.
> - Các mã PP-01..19 trong báo cáo **khác số** với bảng dưới. Khi giao việc, dùng mã của báo cáo, kèm tên phương pháp.
> - Bảng dưới vẫn đúng về luật. Điểm đã sửa theo bằng chứng: PP-05 (không trộn từ mới).
> - Điểm bổ sung theo bằng chứng:
>   - van tải thẻ mới (dừng khi hàng ôn > 150–200);
>   - thăm dò trễ ≥ 7 ngày;
>   - Coverage Meter;
>   - sổ lỗi → SRS;
>   - minimal pairs nhiều giọng;
>   - "không phạt việc học".

## 0. Tóm tắt 10 dòng
1. Ôn cách quãng bằng **FSRS** (hậu duệ của SuperMemo/Anki), không tự chế lịch ôn.
2. **Gợi nhớ chủ động** (testing effect): ≥ 70% lượt là tự nhớ/tự viết, không chỉ nhận diện.
3. **Phản hồi ngay, có giải thích, có bằng chứng** (Hattie: phản hồi là một trong các yếu tố tác động mạnh nhất).
4. **Độ khó vừa sức** (vùng 80–85% đúng; Krashen i+1, "desirable difficulties" của Bjork).
5. **Xen kẽ có chọn lọc**: từ mới học theo khối chủ đề; chỉ trộn ở lượt ôn và ở các loại dễ nhầm (TFNG↔YNNG…).
6. **Bốn mạch cân bằng** của Paul Nation: input có nghĩa, output có nghĩa, học có chủ đích về ngôn ngữ, luyện trôi chảy.
7. **Từ vựng theo tần suất** (NGSL, AWL của Coxhead) và **theo cụm** (Lexical Approach của Michael Lewis: collocation, chunk).
8. **Luyện có chủ đích** (Ericsson): mục tiêu hẹp, phản hồi tức thì, lặp ở mép năng lực; hiển thị band thay vì "level".
9. **Bám tiêu chí thật của IELTS** (band descriptors công khai) cho Writing/Speaking; chấm bằng gói Claude chat (DECISIONS B3).
10. **Thói quen hằng ngày** (vòng lặp ngắn, streak giờ VN, mục tiêu nhỏ) để có thời lượng tiếp xúc đủ.

## 1. Bảng phương pháp → luật → game

| Mã | Phương pháp (nguồn nổi tiếng) | Ý chính | Luật đo được trong app | Game áp dụng | Cách kiểm |
|---|---|---|---|---|---|
| PP-01 | **Spaced repetition** (Ebbinghaus → SuperMemo/Leitner → Anki → **FSRS**) | Ôn đúng lúc sắp quên | Mọi item học được (từ, cụm, lỗi sai, bẫy nghe, câu chép) đều thành thẻ FSRS qua `src/core/srs`. Không game nào tự chế lịch. Thẻ đến hạn **luôn** được ưu tiên trước thẻ mới ở Hôm nay | V1 chính; mọi game là "producer" thẻ (`userItems`) | Unit: chấm Again/Good đổi `due` đúng; E2E: sai ở R1/L1/V2/W → V1 có thẻ đúng nội dung |
| PP-02 | **Retrieval practice / testing effect** (Roediger & Karpicke 2006) | Tự gợi nhớ nhớ lâu hơn đọc lại | ≥ 70% lượt trong phiên là **gợi nhớ hoặc sản xuất** (gõ từ, điền cloze, chép chính tả, viết lại câu), ≤ 30% chỉ chọn đáp án. Thẻ mới: xem → **gợi nhớ ngay trong phiên** (không chỉ xem) | V1, V2, L2, W2 | Thống kê loại lượt trong `attempts`; reviewer đếm 1 phiên |
| PP-03 | **Feedback** (Hattie & Timperley 2007) | Phản hồi phải nói: đúng/sai, vì sao, làm gì tiếp | Câu sai: đáp án + lý do 1 câu tiếng Việt + **bằng chứng bấm được** (quote đoạn văn, nút nghe lại đúng đoạn audio, ví dụ dùng từ) + "lần sau để ý gì" ≤ 12 từ. Phản hồi ≤ 100 ms | Mọi game | Reviewer bấm 1 câu sai mỗi game; E2E kiểm 3 phần tử có mặt |
| PP-04 | **Comprehensible input i+1** (Krashen) + **desirable difficulties** (Bjork) | Hơi khó hơn mức hiện tại là học tốt nhất | Độ khó thích ứng: cửa sổ 20 lượt, ≥ 90% → +1 bậc, ≤ 65% → −1, cooldown 10, mục tiêu vùng **80–85%** (B6). Bài đọc/nghe: người học biết ≥ 95% từ (ước theo `level` của từ) | Mọi game | Unit `sessionLevel`; validator đo độ phủ từ của passage theo band |
| PP-05 | **Interleaving có chọn lọc** (meta-analysis Brunmair & Richter 2019: trộn có lợi trung bình g = 0.42, nhưng **với danh sách từ thì học theo khối thắng, g = −0.39**) | Trộn chỉ giúp khi cần phân biệt các thứ dễ nhầm | **Thẻ mới học theo khối chủ đề**, không trộn chủ đề ở lần học đầu. **Lượt ôn** trong V1 được trộn loại thẻ (từ, cụm, lỗi sai, nghe lại), không quá 4 thẻ cùng loại liên tiếp. Chỉ trộn có chủ đích các cặp dễ nhầm: TFNG↔YNNG (R1 thêm ≥ 30% YNNG khi TFNG ≥ 80%), Headings↔Matching Information, các dạng biểu đồ W2, cặp từ confusables | V1, R1, R2, W2, Hôm nay | Unit chọn thẻ V1 (0 phiên trộn chủ đề với thẻ mới); planner test |
| PP-06 | **Four strands** (Paul Nation) | Cân bằng ~25% mỗi mạch: input, output, học ngôn ngữ, trôi chảy | Thống kê tuần chia thời gian theo 4 mạch (đọc/nghe có nghĩa · viết/nói · từ/cụm/ngữ pháp · luyện nhanh có giờ). Mạch nào < 15% trong 7 ngày → Hôm nay đề xuất bù | Hôm nay, Thống kê | Unit planner; hiển thị ở Thống kê |
| PP-07 | **Từ tần suất cao** (Nation; NGSL của Browne; **AWL** của Coxhead) | 2 000 từ thông dụng + 570 họ từ học thuật phủ phần lớn văn bản học thuật | Thẻ mới theo thứ tự: band hiện tại → tần suất (`freqZipf`) → danh sách học thuật. Từ hiếm (zipf thấp) chỉ khi band ≥ 7.5 | V1 chọn thẻ mới | Unit thứ tự thẻ mới |
| PP-08 | **Lexical Approach** (Michael Lewis) + collocation (Oxford Collocations) | Học theo cụm, không học từ rời | Mỗi từ học có ≥ 1 collocation thật + 1 câu ví dụ tự nhiên 12–28 từ. Lỗi collocation kiểu người Việt (dịch sát) là thẻ riêng | V2, V1 | Validator: từ trong pool có `collocations[0]`; soi mẫu D8 |
| PP-09 | **Noticing hypothesis** (Schmidt) | Phải "nhận ra" khác biệt mới học được | Câu sai hiện **chỗ khác** (gạch chân ký tự/từ sai so với đáp án), không chỉ hiện đáp án | L2, V1 gõ, W2 | Reviewer xem ảnh sau tương tác |
| PP-10 | **Output hypothesis** (Swain) | Phải sản xuất để thấy lỗ hổng | Mỗi ngày có ≥ 1 việc sản xuất (viết câu, viết đoạn, nói) trong kế hoạch Hôm nay khi người học có ≥ 20 phút | Hôm nay, W1, W2, S1/S2 | Unit planner |
| PP-11 | **Deliberate practice** (Ericsson) | Mục tiêu hẹp + phản hồi ngay + lặp ở mép năng lực | Mỗi phiên có 1 mục tiêu hẹp hiển thị ("Bắt 8 bẫy self-correction"); Recap đo đúng mục tiêu đó; lỗi lặp lại ≥ 3 lần thành "điểm yếu" có bài luyện riêng | Mọi game, Recap | Reviewer; unit đếm lỗi lặp |
| PP-12 | **Dictation & shadowing** (phương pháp nghe kinh điển) | Chép chính tả buộc nghe từng âm | L2 thang 10 bậc; nghe lại không giới hạn ở luyện, giới hạn ở thi; câu chép sai thành thẻ `dict:*` | L2 | E2E |
| PP-13 | **Bám đề thi thật** (IELTS band descriptors công khai, dạng câu Cambridge/IDP/BC mô tả công khai, **không** chép đề) | Học đúng thứ được chấm | Dạng câu đúng chuẩn IELTS (TFNG vs YNNG, Matching Headings, Form/Note completion…); Writing chấm 4 tiêu chí TR/CC/LR/GRA; Speaking FC/LR/GRA/P | R1, R2, L1, W1, W2, S1, S2, X1 | Reviewer đối chiếu dạng câu; C1 grep |
| PP-14 | **Bẫy đề thật** (distractor: paraphrase, self-correction, số gần đúng) | IELTS Listening/Reading đánh vào bẫy | L1 mỗi episode có ≥ 2 loại bẫy được gắn nhãn; R1 câu NG có lý do "không có thông tin" chỉ rõ | L1, R1 | Validator nhãn bẫy; D8 |
| PP-15 | **Habit / micro-goals** (BJ Fogg; nghiên cứu habit formation) | Việc nhỏ, đều, có tín hiệu | Mục tiêu ngày mặc định 30 phút, chia 3 việc ≤ 10 phút; "giữ chuỗi" chỉ cần 5 phút; streak theo giờ VN, đổi ngày lúc 04:00; không phạt nặng khi gãy | Hôm nay, shell | Unit streak; E2E daily-loop |
| PP-16 | **Mastery learning** (Bloom) | Chỉ tiến khi nắm vững | Item "Mastered" = FSRS stability ≥ 21 ngày **và** 3 lần gần nhất đúng; band chỉ tăng khi đủ dữ liệu (≥ 40 lượt của kỹ năng đó) | Thống kê, V1 | Unit |
| PP-17 | **Dual coding** (Paivio) | Lời + hình nhớ tốt hơn | Từ cụ thể (danh từ vật thể) có icon/ảnh khi có sẵn; **không** đặt hình trong vùng chữ bài đọc | V1 thẻ từ | Reviewer |
| PP-18 | **Metacognition / calibration** | Người học biết mình biết gì | V1 trước khi lật hỏi "chắc chắn?" (tuỳ chọn) để chấm Hard/Good; Thống kê hiện "dự đoán vs thực tế" | V1, Thống kê | Unit |

## 2. Luật sư phạm cứng (CHẶN)
- **PP-C1** Không chấm FSRS cho lượt mà người học **không thể** làm đúng: thiếu audio, thiếu nội dung, lỗi tải, hết giờ do lỗi app (SR-22).
- **PP-C2** Không có phần thưởng (XP, hạt, SFX vui) cho câu **sai**. Không có phạt mất tiến độ cho câu sai trong luyện tập (B4).
- **PP-C3** Không lộ đáp án trước khi trả lời (SR-23).
- **PP-C4** Thẻ đến hạn luôn được ưu tiên trước thẻ mới; quota thẻ mới/ngày theo cài đặt (mặc định 15) và **tự giảm** khi tỷ lệ nhớ lượt đầu < 80% trong 7 ngày (`KIEM-THU` §5).
- **PP-C5** XP không lạm phát: retry 0 XP, có trần XP/phiên, XP tỉ lệ với **lượt gợi nhớ đúng**, không với số lần bấm.
- **PP-C6** Mọi nội dung học (câu, audio, đáp án) đi qua pipeline + validator + review khác model (C2, C4). Game **không** đọc dữ liệu legacy LLM (C6).

## 3. Việc cụ thể cần làm (gắn vào task có sẵn)

| Việc | PP | Gắn vào task (file độc quyền) | Ưu tiên |
|---|---|---|---|
| Thống kê loại lượt (gợi nhớ/sản xuất/nhận diện) lưu theo attempt | PP-02 | T3-C (`attemptRepo`) | P1 |
| V1 trộn loại thẻ, không quá 4 cùng loại liên tiếp | PP-05 | T4-A (V1) | P1 |
| Planner bù mạch thiếu (4 strands) + đề xuất xen kỹ năng | PP-05, PP-06 | T3-C (`src/features/**`) | P1 |
| Thẻ mới theo band → tần suất → AWL; cần trường `level` + `freqZipf` + cờ `awl` trong dữ liệu | PP-07 | T3-B (dữ liệu) → T4-A (V1 chọn) | **P0** |
| Mỗi từ có collocation + ví dụ tự nhiên | PP-08 | T3-B | **P0** |
| "Lần sau để ý gì" trong FeedbackPanel; gạch chỗ khác ở L2/V1 gõ | PP-03, PP-09 | T3-A (`FeedbackPanel`), T2-B (L2), T4-A (V1) | P1 |
| Mục tiêu hẹp mỗi phiên + Recap đo đúng mục tiêu | PP-11 | T3-A (Recap) + T4-* (mỗi game cấp mục tiêu) | P1 |
| Quota thẻ mới tự giảm theo tỷ lệ nhớ | PP-C4 | T4-A (V1) hoặc FX nhỏ đầu Đợt 3 | P1 |
| Mastered = stability ≥ 21 + 3 lần đúng | PP-16 | T3-C (gamification) | P2 |
| Độ phủ từ của passage theo band (≥ 95% từ biết ở band mục tiêu) | PP-04 | T3-B (validator mới trong `scripts/data`) | P2 |

## 4. Cách reviewer chấm phần phương pháp (rubric R1 Sư phạm, trọng số cao nhất 15%)
1. Chơi 1 phiên mỗi game ở 390×844, trả lời **2 đúng, 2 sai, 1 bỏ qua**.
2. Kiểm PP-03 (đủ 3 phần phản hồi), PP-C2 (không thưởng cái sai), PP-C1 (thẻ thiếu audio bị bỏ).
3. Sang V1: thẻ từ các lượt sai có mặt, đúng nội dung, đúng đoạn audio.
4. Đếm tỷ lệ lượt gợi nhớ/sản xuất (PP-02).
5. Ghi điểm R1 theo mốc 4/7/10 trong `KIEM-THU.md` §3.1, có dẫn ảnh.

Một lỗi PP-C* = CHẶN; mỗi luật PP-01..18 không đạt ở game áp dụng = NẶNG cho R1.
