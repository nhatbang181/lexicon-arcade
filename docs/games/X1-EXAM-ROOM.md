# X1 · Exam Room: phòng thi thử trên máy

## 1. Mục đích
- Đo band thật nhất có thể (nguồn chính cho band estimator L/R, `02` §7).
- Luyện **sức bền và chiến lược thời gian**: 30 phút nghe liên tục, 60 phút đọc 3 bài.
- Làm quen **giao diện thi trên máy** (bắt buộc từ năm 2026, `01` §0).

## 2. Vì sao hiệu quả
- **P7:** kiểm tra đúng điều kiện thi giúp kiến thức chuyển giao được sang bài thi thật.
- Thi thử định kỳ (testing effect) cũng là một lượt luyện.
- Kết quả có **phân tích theo dạng câu và bẫy** nên chỉ ra chính xác cần luyện gì. Kết quả này đi thẳng vào planner.

## 3. Core loop
```
Chọn test (xt:*) → chọn phần: Listening (≈30') | Reading (60') | Cả hai (nghỉ 5' giữa)
→ Màn hướng dẫn (giống đề máy) → LÀM BÀI (exam UI, không XP/SFX)
→ Nộp/hết giờ → Điểm thô /40 → Band (bảng 01 §1) → Phân tích:
   theo Part/Passage; theo dạng câu; theo trapType; thời gian dùng mỗi passage
→ Review từng câu (giống debrief L1/R1) → cập nhật band estimator + planner
```

## 4. Luật chơi
- **Listening:**
  - 4 episode của test chạy liền, có preview của từng part (30 giây). Không dừng.
  - Cuối bài có 2 phút xem lại.
  - Chấm theo `listeningAnswer.ts`.
- **Reading:**
  - 60 phút chung cho 3 passage, chuyển qua lại tự do.
  - Có gợi ý chia thời gian (17/20/23 phút) ở dạng chỉ báo nhỏ, tắt được.
  - Hết giờ thì tự nộp.
- **Giao diện thi máy:**
  - Header có tên ứng viên ("Candidate"), đồng hồ, nút Help.
  - Nội dung chia đôi.
  - QuestionNav dưới cùng có trạng thái câu.
  - Highlight và ghi chú bằng chuột phải hoặc nút.
  - Cỡ chữ chỉnh được.
  - **Không** dùng logo hay tên thương hiệu IELTS, BC, IDP.
- **XP:** hoàn thành Listening +100, Reading +150. Mỗi band đạt ≥ mục tiêu: +100 (mốc, có confetti).
- **Test đã làm:** đánh dấu "đã làm". Làm lại được nhưng kết quả lần 2 **không tính band** (đã biết đáp án).

## 5. Độ khó
Không adaptive. Độ khó là độ khó của test. Tiêu đề test ghi độ khó tổng (trung bình difficulty của các thành phần).

## 6. Wireframe (Reading)
```
┌ Candidate · Reading ───────────────────────────────────── ◷ 42:18 ── [Help] [≡] ┐
│ ┌─ Part 2 · "The economics of attention" ──────────┐ ┌─ Questions 14–19 ───────┐ │
│ │ A  ...                                            │ │ Do the following …        │ │
│ │ B  ...                                            │ │ 14 ○TRUE ○FALSE ○NOT GIVEN│ │
│ │ (highlight vàng nhạt, ghi chú 📝 gắn span)         │ │ ...                       │ │
│ └───────────────────────────────────────────────────┘ └───────────────────────────┘ │
│ Part 1 ▢▢▢▢▢▢▢▢▢▢▢▢▢  Part 2 ▣▣▣▣▢▢▢▢▢▢▢▢▢  Part 3 ▢▢▢▢▢▢▢▢▢▢▢▢▢▢   🚩 [Review] [Submit]│
└────────────────────────────────────────────────────────────────────────────────────┘
```

## 7. Kết quả và phân tích
- Điểm thô, band, so với lần trước.
- **Bảng theo dạng câu:** dạng, số câu, đúng, % (vd "Summary completion 3/5 · 60%").
- **Top 3 trapType hay sập.** Mỗi dòng có nút "Luyện ngay" (mở L1/R1 với bộ lọc tương ứng).
- **Reading:** thời gian thực tế mỗi passage (đo bằng thời gian focus vào passage), kèm cảnh báo nếu passage 3 < 18 phút.
- **Câu thắng:** "Listening 35/40, band 8.0 lần đầu tiên". Hoặc "Reading tăng 3 câu so với lần trước".

## 8. SRS
Không tạo item từ test reserved ([INV-X1]). Chỉ cập nhật thống kê trapType và band.

## 9. Data
`exam/tests.json` (`04` §8). MVP 2 test, đầy đủ 8. Các thành phần của test dùng episode và passage có `reserved`.

## 10. UI, motion, sound
- `[data-mode="exam"]` toàn bộ. Không animation trừ chuyển trang tối thiểu (fade 0,1 s). Không SFX trừ `timeup`.
- Màn kết quả trở lại theme thường, có animation Recap.

## 11. Edge cases
- Đóng tab giữa chừng: trạng thái lưu mỗi 10 giây gồm đáp án, highlight, thời gian còn lại. Mở lại thì hỏi "Tiếp tục bài thi (còn 23:10)?". Listening không tiếp tục được giữa audio: cho làm lại từ đầu part đó và đánh dấu "bị gián đoạn", không tính band.
- Đồng hồ máy bị đổi hoặc tab ngủ: đồng hồ tính bằng `performance.now()` + mốc thời gian lưu. Không tin `Date.now()` cho đếm ngược.

## 12. Cổng nghiệm thu
- Unit test: tổng hợp điểm, quy đổi band (biên 34/35/36…), phân tích theo dạng, khôi phục trạng thái.
- E2E: 1 test Reading đầy đủ với clock giả (tua nhanh), 1 test Listening với audio rút gọn (fixture 20 giây mỗi part).
- Ảnh chụp 3 độ rộng: Reading exam, Listening exam, kết quả.

## 13. Không làm
- Không làm Writing hay Speaking trong X1. Thi thử Writing dùng W1 Exam (full 60 phút). Thi thử Speaking dùng S1 Full mock.
