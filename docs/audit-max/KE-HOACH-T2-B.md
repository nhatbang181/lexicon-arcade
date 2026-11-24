# KE-HOACH T2-B · L1 Trap Detector, L2 Dictation Ladder, chấm đáp án Listening, trình phát

Nhánh `audit-max/T2-B` (worktree `D:\English-wt\T2-B`) · bản kế hoạch 25/11/2026. Không điểm thẩm mỹ.

**Route:** `#/play/l1` (mode `training|exam`, `level`), `#/play/l2`. Vào qua Hôm nay (`?from=today&task=`) hoặc Hub.
**Thành phần:** `L1TrapDetector.tsx` + `engine.ts` + `listeningLoader.ts` · `L2DictationLadder.tsx` + `engine.ts` + `dictationLoader.ts` · `src/core/scoring/listeningAnswer.ts` · `src/core/audio/{trackPlayer,sfx}.ts` (+ mới `audioAvailability.ts`) · `TrackPlayer`, `Waveform`, `MapView`, `AnswerInput` · `l1_fixtures.ts` · `e2e/m3.spec.ts` + `e2e/t2b-*.spec.ts`.
**Ghi chú đường dẫn:** `src/core/content/{listening,dictation}Loader.ts` trong TASKS.md thực ra nằm ở `src/games/l1-…/listeningLoader.ts` và `src/games/l2-…/dictationLoader.ts` (đã thuộc `games/**` của T2-B).
**Asset:** không thêm. Không sửa `public/audio/**`, `public/data/**` (T3-B). Thiếu dữ liệu L2 level 7–10 và mốc `focus` start/end → ⏳ chuyển T3-B.

## Rủi ro
1. T3-B đang render MP3 listening: bộ lọc phải kiểm file **thật** (HEAD, bỏ `text/html` của SPA) chứ không tin JSON; episode có MP3 nhưng timestamp = 0 bị từ chối khi bắt đầu.
2. Đổi quy tắc đếm từ/số có thể làm đáp án đúng trượt → script quét 381 đáp án trong data chạy bằng chính bộ chấm.
3. L1 1882 dòng: sửa theo nhát nhỏ, tách file chỉ khi không gây hồi quy; e2e `m3` chạy sau mỗi nhát.
4. Trạng thái khó vào: Exam cần audio `ready` (p1_001..p4_001 có MP3); retry; debrief → mở bằng E2E (nhập sai Q4, nộp bài). L2 cần DB trống/có thẻ → seed qua `indexedDB` trong spec.

## DANH SÁCH NÚT / CHỨC NĂNG phải còn nguyên
**L1 chọn bài:** Quay lại · Training/Exam (tính band) · thanh Cấp độ 1–10 · lọc Tất cả/Part 1–4 · thẻ bài (tiêu đề, độ khó, số câu, thời lượng, giọng) · Bắt đầu.
**L1 pha đọc trước:** đếm ngược 30 s · Bắt đầu nghe · chip đoán loại đáp án (6 loại) · ô đáp án form/note/table · MCQ 1 đáp án · MCQ chọn 2 · bản đồ (bấm chữ + select) · Đổi bài.
**L1 pha nghe/soát:** TrackPlayer (phát/dừng, tua 5 s, thanh tiến trình, tốc độ 0.75/0.9/1/1.25, âm lượng, tắt tiếng; Exam khoá) · QuestionNav (nhảy câu, cờ) · Nộp bài (xác nhận khi chưa nghe hết ở Training) · đếm ngược 30 s soát Exam + tự nộp · cảnh báo chuyển tab Exam.
**L1 Debrief:** sóng âm xanh/đỏ bấm được · lọc Chỉ câu sai/Tất cả · Nghe đoạn đáp án · Nghe đoạn bẫy · transcript bấm từng dòng · tự gắn nhãn bẫy (+5 XP, khoá sau lần chọn) · Hoàn tất & xem Recap.
**L1 Recap:** điểm, XP, câu thắng, danh sách câu sai, Ôn lại câu sai, Về Hôm nay.
**L2 intro:** Thoát · thang 10 bậc chọn level · thẻ Bậc/Lượt phát/Điều kiện lên bậc · Bắt đầu phiên.
**L2 phiên:** nút Phát (R) · Phát chậm 0.75× · ô gõ (Enter nộp) · Nộp bài · bảng chấm (%, diff từng từ, nhãn lỗi, Điểm nghe khó) · 0.75× đoạn này · Câu tiếp theo (Enter) · đếm câu · chấm lượt phát · XP.
**L2 Recap:** thống kê 5 loại lỗi · banner lên bậc + Lên Level N · Chơi ngay Level N · Ôn lại câu sai · Về Hôm nay.

## Việc (theo TASKS.md T2-B) → mã
- **L1-01** catalog lọc theo file MP3 thật; Exam không bắt đầu khi audio chưa `ready`; bỏ nút "Đọc kịch bản mô phỏng"; 0 `bandEvidence` nếu phiên mô phỏng. **L2-01** lọc câu thiếu audio.
- **L1-02..06** chuẩn hoá đáp án (số điện thoại, giờ, tiền, `nine thirty`, `second floor`) + ≥ 12 test. Script 381 đáp án.
- **L1-08/09** retry chỉ câu sai (đúng đoạn), 0 XP, 0 band; `examDoneEpisodeIds` trong kv, Exam lần 2 không tính band, xác nhận khi thoát giữa Exam. **L1-10** `NotAllowedError` ≠ thiếu file, Exam chặn bắt đầu nếu chưa `ready`.
- **L2-02** chọn câu có seed theo ngày, bỏ câu 7 ngày, ưu tiên thẻ `dict_full` đến hạn. **L2-04/09/12** + `L2-07/08` nếu kịp.
- Producer `userItems`: `ltrap:*` (kèm `audioClip{src,start,end}`, `|` giữa các đáp án) và `dict:*`; lưu từng lượt `attemptRepo.saveProgress` + `registerProgressSaver`; nhận `level`/`mode`; retry 0 XP (G3/G4 phần L).
- **X-04** SFX dựng lại Howl khi manifest khác; **X-05** `load()` dùng lại `preload()`.
- B2: câu sai hiện đáp án + lý do + trích transcript kèm mốc thời gian (Debrief và Recap). D3/D4/D10/J9 ở màn chọn bài và intro.
