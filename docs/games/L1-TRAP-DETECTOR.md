# L1 · Trap Detector: nghe đúng format, bắt bẫy

## 1. Mục đích
- Muốn đạt **35–38/40 Listening** thì chỉ được sai 2–5 câu. Ở band 7+, phần lớn lỗi **không** do không nghe được, mà do **sập bẫy**:
  - self-correction
  - distractor number
  - đổi kế hoạch
  - phương án MCQ được nhắc rồi bị loại
- Cộng thêm lỗi **chính tả, số nhiều, giới hạn từ**.
- L1 luyện **đúng dạng đề** (đủ 12 dạng câu, 4 part), giải thích **từng bẫy**, và cho tua lại đúng đoạn bẫy.

## 2. Vì sao hiệu quả
- **P7:** format thật, nghe 1 lần ở exam mode.
- **P6:** feedback có timestamp, nghe lại đoạn bẫy và đọc transcript.
- **Siêu nhận thức (metacognition):** sau khi chấm, người học **tự gắn nhãn bẫy** mà mình vừa sập. Việc nhận diện loại bẫy giúp lần sau tự cảnh giác. Thống kê cho thấy loại bẫy nào hay sập nhất.
- **Dự đoán trước khi nghe:** dùng thời gian preview để đoán loại đáp án (số, tên, danh từ số nhiều…). Đây là kỹ năng chiến lược thật của band cao.

## 3. Core loop
```
Chọn episode (Part, chế độ) → PREVIEW (30s: đọc câu hỏi; training: đoán loại đáp án cho 3 chỗ trống – tuỳ chọn)
→ NGHE (audio chạy; người học điền/chọn trực tiếp khi nghe)
→ REVIEW 30s (exam) → CHẤM
→ DEBRIEF: mỗi câu sai → [▶ nghe đoạn evidence] [▶ nghe đoạn bẫy] [transcript highlight] [chọn loại bẫy mình sập]
→ Recap
```

## 4. Luật chơi
### 4.1 Hai chế độ

| | Training | Exam |
|---|---|---|
| Audio | Dừng, tua lại 5 giây, tốc độ 0.75/1/1.25 | 1 lần, không dừng, không tua |
| Preview | 30 giây + **đoán loại đáp án** (chip: số / ngày / tên / danh từ / số nhiều / tính từ) | 30 giây, chỉ đọc |
| Transcript | Mở sau khi chấm | Mở sau khi chấm |
| Tính band | Không | Có (`02` §7) |
| SFX | Có | Tắt |

### 4.2 Luật chấm (`core/scoring/listeningAnswer.ts`, theo luật IELTS)
- **Chuẩn hoá:**
  - bỏ hoa thường
  - trim, gộp khoảng trắng
  - chấp nhận biến thể chính tả UK/US
  - số: "15" = "fifteen"
  - giờ: "9.30" = "9:30" = "nine thirty"
  - ngày: "30 March" = "March 30" = "30th March"
  - tiền: "£12.50" = "12.50" khi đơn vị đã in sẵn trong câu hỏi
- **Sai chính tả = sai.** Không có điểm gần đúng ở exam. Ở training, sai 1 ký tự thì báo "sai chính tả" để phân loại lỗi, nhưng **vẫn tính sai**.
- **Vượt `wordLimit` = sai**, kể cả khi chứa đáp án. Báo lỗi loại `word_limit`.
- Thiếu "-s" của danh từ số nhiều khi đáp án là số nhiều thì sai, phân loại `plural_singular`.
- MCQ nhiều đáp án: mỗi key đúng là 1 điểm theo số câu, thứ tự không quan trọng.

### 4.3 XP
- Training: 10 mỗi câu đúng.
- Exam: 15 mỗi câu đúng, +50 nếu ≥ 9/10.
- Tự gắn đúng nhãn bẫy ở debrief: +5.

## 5. Độ khó (training)

| Level | Episode | Hỗ trợ |
|---|---|---|
| 1–2 | Part 1, difficulty ≤ 3 | Tốc độ 0.9× mặc định. Hiện "tín hiệu" (signpost) mờ cạnh câu hỏi khi audio tới gần (±10 s) |
| 3–4 | Part 1–2 | Tốc độ 1×. Còn tín hiệu |
| 5–6 | Part 1–3 | Bỏ tín hiệu |
| 7–8 | Part 2–4, difficulty ≥ 5 | Không được dừng |
| 9–10 | Part 3–4, difficulty ≥ 7 | Chế độ "exam-like": như exam nhưng không tính band |

## 6. Flow màn hình và wireframe
**Nghe (desktop):**
```
┌ ✕ Trap Detector · Part 1 · Training ───────── ▶ 01:42 / 05:10 ── [⏸][⟲5s][1.0×] ┐
│ ┌──────────── Questions 1–10 ─────────────┐  ┌── Waveform (mờ khi đang nghe) ──┐ │
│ │ Complete the form below.                 │  │ ▁▂▅▇▅▃▂▁▂▃▅▆▅▃▂▁▂▃▅▇▅▃▂▁        │ │
│ │ Write ONE WORD AND/OR A NUMBER.          │  └──────────────────────────────────┘ │
│ │                                          │                                       │
│ │  SPORTS CENTRE BOOKING FORM              │   Đoán trước (preview):              │
│ │  Name:      Jane [ 1 ________ ]          │   Q1 [tên riêng ✓] Q2 [số ✓]         │
│ │  Phone:     [ 2 ________ ]               │   Q3 [ngày]                          │
│ │  Course:    Beginners' [ 3 ________ ]    │                                       │
│ │  Start date: [ 4 ________ ]              │                                       │
│ │  ...                                     │                                       │
│ └──────────────────────────────────────────┘                                       │
│  1 2 3 4 5 6 7 8 9 10   (QuestionNav)                                 [Nộp]        │
└────────────────────────────────────────────────────────────────────────────────────┘
```
- **Map labelling:** `MapView` ở trái, danh sách câu ("12 Café ___") ở phải. Mỗi câu chọn chữ A–I (dropdown hoặc bấm ô chữ trên bản đồ). Hover vào ô chữ thì phóng to nhẹ.
- **MCQ:** `ChoiceButton` A–C. Câu chọn 2 trong 5 dùng checkbox, tối đa 2.

**Debrief:**
```
┌ Kết quả: 8/10 ─────────────────────────────────────────────────────────────┐
│ Q4 ✗  Bạn ghi: 13 March   Đáp án: 30 March                                 │
│     [▶ Nghe đoạn đáp án 02:11–02:19]  [▶ Nghe đoạn bẫy 02:05–02:10]          │
│     Transcript: "...starting on the ▒13th▒... oh sorry, no, the ▓30th▓ of March" │
│     Vì sao: Bẫy self-correction – người nói sửa lại ngay sau đó.             │
│     Bạn đã sập loại bẫy nào?  (●) self-correction ( ) distractor ( ) nghe nhầm số │
│ Q7 ✗  Bạn ghi: equipments   Đáp án: equipment  → lỗi số nhiều/không đếm được │
└────────────────────────────────────────────────────────────────────────────┘
```
- **Waveform sau khi chấm:** vùng đáp án màu xanh, vùng bẫy màu đỏ, bấm vào là phát đúng đoạn đó.

## 7. Feedback
- Mỗi câu sai có:
  - đáp án đúng
  - **loại lỗi do engine tự phân loại**: `wrong_content | spelling | plural | word_limit | trap:<type> | no_answer`
  - `explanationVi` của trap
  - nút nghe lại 2 đoạn
- **Tự gắn nhãn:** người học chọn nhãn. Nếu khác nhãn engine thì hiện nhãn đúng kèm 1 dòng giải thích. Đây là bài tập nhận diện, không phạt.
- **Câu thắng:** "Bắt được N/M bẫy (self-correction 3/3, distractor 2/3)". Hoặc nếu tốt hơn trung bình 7 ngày: "Lần đầu 10/10 ở Part 2".

## 8. SRS
- Câu sai do **spelling** thì đáp án đưa vào V1 face `listen_spell` (tạo vocab item tạm nếu từ chưa có: `vocab:<slug>` với `lists:['TOPIC']`, lấy audio từ đoạn episode).
- Câu sai do **bẫy** thì tạo item `ltrap:<episodeId>_<qid>` (face `ltrap_replay`):
  - V1 phát lại **đoạn audio ngắn** (bẫy + đáp án, 6–15 giây)
  - người học gõ đáp án
  - lần ôn sau dùng **cùng đoạn** cho đến khi đúng 2 lần, sau đó FSRS lên lịch như thường
- Câu từ episode `reserved` (X1) **không** tạo item (tránh lộ đề).

## 9. Data
- `listening/episodes/*.json` (`04` §4) + audio (`06`).
- MVP 24 episode training (6 mỗi part) + 8 reserved. Đầy đủ 80 + 32.
- **Phân bố dạng câu** tối thiểu ở bộ đầy đủ:

  | Part | Dạng câu |
  |---|---|
  | 1 | form, note, table completion; ≥ 4 episode có MCQ |
  | 2 | ≥ 6 episode map/plan; ≥ 6 MCQ hoặc matching |
  | 3 | MCQ, matching, flow-chart |
  | 4 | note, summary, table, flow-chart completion |

- **Map:** `MapSpec` vẽ được bằng `MapView`. Có 8–10 ô chữ, có la bàn, lối vào. Ảnh chụp map phải đọc được ở 360 px (phóng to bằng pinch).
- Sinh: `05` §4.5. QA: G1–G5. **Blind-solve trên transcript phải đúng 10/10** và **ASR vòng ngược thấy rõ đáp án** (`06` §5).

## 10. UI, motion, sound riêng
- **Khi đang phát audio:** chặn SFX, ẩn combo, tắt mọi animation không cần thiết (để tập trung).
- **Exam mode:**
  - giao diện `[data-mode="exam"]`
  - QuestionNav đúng kiểu đề máy
  - có nút cờ đánh dấu
  - âm lượng chỉnh bằng thanh trượt
  - **không** có nút dừng
- Trong lúc nghe, ô đang "tới lượt" theo thời gian (dựa trên `evidence.start`) **không** được tự highlight ở exam (lộ đáp án). Ở training level 1–4 thì có hiện mờ "tín hiệu".

## 11. Edge cases
- Người học bấm Nộp trước khi audio hết (training): hỏi xác nhận. Exam: không cho nộp sớm trước khi audio hết + 30 giây.
- Audio lỗi hoặc chưa tải xong: không bắt đầu. Hiện nút tải lại. Exam không bắt đầu nếu chưa preload 100%.
- Tab bị ẩn khi đang exam: audio vẫn chạy (giống thi thật), hiện cảnh báo khi quay lại.
- Đáp án có nhiều cách viết hợp lệ (vd "car park" / "carpark"): dùng `accepted[]` trong data + bảng biến thể.

## 12. Cổng nghiệm thu
- Unit test `listeningAnswer.ts` ≥ 40 case: số, ngày, giờ, tiền, UK/US, word limit, số nhiều, hoa thường, MCQ nhiều đáp án.
- Data: 100% episode qua [INV-L1..L7] và audio QA. Soi mẫu 2 episode mỗi part bằng tai.
- E2E: 1 episode training (có map) và 1 exam chạy hết. Debrief phát đúng đoạn (kiểm `currentTime` nằm trong `[start-0.2, end+0.2]`).
- Độ lệch hiển thị thời gian so với audio ≤ 100 ms.
- Ảnh chụp 3 độ rộng: preview, đang nghe (form), map, debrief.

## 13. Không làm
- Không dùng TTS trình duyệt.
- Không có phụ đề khi đang nghe (cả training).
- Không làm General Training Part 3/4.
