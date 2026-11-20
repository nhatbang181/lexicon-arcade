# V1 · Daily Run: ôn tập hằng ngày kiểu "chạy màn"

## 1. Mục đích
- Là **cửa chính** để ôn mọi item trong SRS: từ, collocation, paraphrase, lỗi sai, bẫy nghe, câu dictation.
- Phục vụ:
  - **Lexical Resource** (Writing, Speaking)
  - tốc độ nhận ra paraphrase (Reading, Listening)
  - chính tả (Listening)
- Từ 6.0 lên 8.0 cần khoảng **+1.500–2.500 từ và cụm học thuật dùng được chủ động**. Không có ôn giãn cách thì không nhớ nổi khối lượng này.

## 2. Vì sao hiệu quả
- **P1, P2:** FSRS lên lịch. Mỗi thẻ là một lượt tự gợi nhớ.
- **P3:** face đi từ nhận diện lên tự gõ, rồi nghe và gõ.
- Việc dùng từ trong câu được luyện ở V2 (giai đoạn tự viết) và W1. V1 không có face chấm câu tự do vì app không gọi AI.
- **P7:** trộn nhiều loại item trong một run.
- **P4, cơ chế chơi chính là học:**
  - "Run" là chuỗi các node.
  - Tốc độ đi qua node = trả lời đúng và nhanh.
  - Boss cuối là các thẻ có retrievability thấp nhất.
  - Không có cơ chế nào ngoài việc nhớ ra.

## 3. Core loop
```
Mở run → Bản đồ run (N node) → [Node: 1 thẻ] prompt → người học trả lời → chấm → autoRate → FSRS cập nhật
       → (sai: thẻ chèn lại sau 3–5 node trong cùng run) → … → Boss (5 thẻ khó nhất) → Recap
```

## 4. Luật chơi
- **Quy mô run:**
  - Mặc định tất cả thẻ đến hạn (tối đa 60) + thẻ mới theo quota (`02` §3.5), chia thành **các chặng 20 thẻ**.
  - Hết mỗi chặng có checkpoint, dừng được và lưu.
  - Mục tiêu ngày ngắn ("chế độ bận"): run 10 thẻ.
- **Thứ tự:** quá hạn lâu và retrievability thấp lên trước. Cứ 4 thẻ ôn thì chèn 1 thẻ mới. Không để 2 thẻ cùng item liền nhau.
- **Thẻ sai:** quay lại trong run sau 3–5 thẻ, dạng **dễ hơn 1 bậc** (vd `recall_meaning` sai thì lần lại là `recog`). Phải đúng lại mới tính "đã sửa". FSRS chỉ ghi lượt **đầu tiên** là `Again`.
- **Boss:** 5 thẻ có retrievability thấp nhất trong run. Hiện kiểu "boss" (khung đỏ thẫm, thanh HP). Mỗi thẻ đúng trừ 20% HP. Sai **không** mất mạng, thẻ chỉ quay lại.
- **XP:**

  | Kết quả | XP |
  |---|---|
  | `Good` | 10 |
  | `Easy` | 12 |
  | `Hard` | 6 |
  | `Again` | 0 |
  | Thẻ mới học xong | 5 |
  | Combo (x2 từ 5 đúng liền, x3 từ 10) | Nhân XP |
  | Hạ boss | +50 |
  | Thẻ hiếm (`02` §2.3) | ×3 |

- Không có timer ép. Thời gian trả lời chỉ dùng cho autoRate.

### 4.1 Các face và cách trình bày

| Face | Prompt | Người học làm | Chấm |
|---|---|---|---|
| `intro` (item mới) | Thẻ giới thiệu: headword, IPA, 🔊 tự phát, nghĩa, 1 ví dụ, 2 collocation | Bấm "Đã xem" hoặc "Tôi biết rồi" | Không chấm. "Tôi biết rồi" thì kiểm ngay bằng `recall_meaning` |
| `recog` | Headword + 🔊 | Chọn nghĩa đúng trong 4 (1–4) | Đúng/sai |
| `recall_meaning` | Nghĩa tiếng Việt + definitionEn + POS + số chữ cái `_ _ _ _` | **Gõ headword** | So khớp chuẩn hoá. Sai 1 ký tự với từ ≥ 7 chữ là `partial` (Hard), hiện chỗ sai |
| `recall_cloze` | Câu ví dụ có chỗ trống + nghĩa | Gõ từ đúng **dạng** (chia thì, số nhiều) | Chấp nhận các dạng trong `family` nếu đúng ngữ pháp câu. Danh sách accepted sinh sẵn lúc build |
| `listen_spell` | Chỉ có 🔊 (phát 2 lần) | Gõ chính tả | Chính tả phải đúng 100%. Sai ở chữ đôi hay âm câm thì `tipVi` chỉ ra |
| `col_gap` (collocation) | `display` "___ an influence on" + nghĩa | Gõ phần thiếu | `answers[]` |
| `para_match` | questionPhrase | Chọn paraphrase đúng trong 4 (target + decoys + 1 từ ngẫu nhiên cùng topic) | |
| `err_fix` | Câu sai, đã gạch chân `errorSpan` | Gõ lại phần sửa | So với `correct` (chuẩn hoá) |

- **Gợi ý (H):**
  - `recall_*`: lộ chữ cái đầu, rồi lộ từng chữ.
  - `recog`: loại bớt 1 đáp án sai.
  - Dùng gợi ý là `Hard`.

## 5. Độ khó
V1 không dùng level adaptive (FSRS đã tự điều chỉnh). `skillLevels.v1` chỉ quyết định:
- level ≤ 3: `recall_meaning` hiện thêm chữ cái đầu sẵn
- level ≥ 7: `listen_spell` chỉ phát 1 lần

## 6. Wireframe
```
┌ ✕ Daily Run · Chặng 1/3 ─────────── ●●●●●○○○○○○○○○○○○○○○ 5/20 ───── 🔥x2 +84 ┐
│                                                                             │
│     Gõ từ tiếng Anh                                          [C1] [n.]       │
│                                                                             │
│     "chương trình giảng dạy"                                                │
│     the subjects that are studied in a school or course                     │
│                                                                             │
│     ┌───────────────────────────────────────────┐                          │
│     │ c u r r i c _ _ _ _                       │   10 chữ cái             │
│     └───────────────────────────────────────────┘                          │
│                                                                             │
│                                   [Gợi ý H]   [Không nhớ]   [Nộp ↵]         │
└─────────────────────────────────────────────────────────────────────────────┘
```
- **Bản đồ run** (màn đầu và giữa các chặng): đường ngang các node tròn có màu theo loại item (tím = vocab, cam = collocation, xanh lá = paraphrase, đỏ = lỗi, xanh dương = nghe), boss là node to ở cuối. Node đã qua thì tô đặc.
- **Feedback sau mỗi thẻ (≤ 1,2 s nếu đúng, chờ Enter nếu sai):**
  - Đúng: chip xanh + 🔊 phát từ + 1 collocation nổi lên.
  - Sai: hiện đáp án, so sánh chữ (chữ sai tô đỏ), ví dụ, `vnTrap` nếu có.

## 7. Recap và câu thắng
Recap gồm: số thẻ, % đúng lượt đầu, số item lên bậc mastery, dự báo "Ngày mai: 37 thẻ".

Câu thắng chọn theo thứ tự ưu tiên:
1. "N từ vừa lên Mature hoặc Mastered".
2. "Tỷ lệ nhớ lượt đầu X% (tuần trước Y%)".
3. "Bạn sửa được N lỗi *article* liên tiếp".

## 8. SRS
- Toàn bộ V1 là SRS. `autoRate` theo `02` §3.3.
- **Mở face mới** theo `02` §3.2, thực hiện ngay sau khi ghi review.

## 9. Data
- `vocab/words.json`, `collocations.json`, `paraphrases.json`, `error_patterns.json`, `listening/dictation.json` (face `listen_spell` dùng từ khó trong câu).
- Audio `public/audio/vocab/*`.
- **Accepted forms cho `recall_cloze`:** sinh lúc build bằng script `scripts/data/build_cloze_accept.mjs`. Lấy family + biến thể -s/-ed/-ing hợp lệ, verifier soát lại. Lưu trong field phụ `examples[i].clozeAccepted` (thêm vào schema khi làm).
- **Nguồn thẻ mới:** thứ tự ưu tiên là ⭐ → item từ feedback W1/S1 → AWL sublist thấp → topic đang học. Chọn được "Chủ đề tuần này" trong cài đặt V1.

## 10. UI, motion, sound riêng
- **Thanh tiến độ** dạng chuỗi chấm (dot), mỗi chấm đổi màu theo kết quả.
- **Boss:** khi vào boss thì nền tối hơn 10% và có thanh HP. Hạ boss thì HP vỡ thành mảnh (8 mảnh, 0,5 s) + SFX `levelup` nhỏ.
- **Ô gõ:** placeholder dạng `_ _ _` đúng số chữ (khoảng trắng hiện là `·`).

## 11. Edge cases
- Headword nhiều từ ("rote learning"): bỏ qua khác biệt khoảng trắng hoặc gạch nối khi chấm.
- Biến thể Anh-Anh/Anh-Mỹ (organise/organize) đều đúng. Bảng biến thể lưu trong `core/text/spellingVariants.ts`.
- Từ đồng âm khác nghĩa: prompt luôn có POS + định nghĩa để phân biệt.
- Không có thẻ đến hạn và đã hết quota thẻ mới: chuyển sang chế độ "Ôn thêm" với 20 thẻ có retrievability thấp nhất, **không** ghi FSRS. Chỉ luyện thêm, có nhãn rõ.
- Đổi ngày lúc nửa đêm khi đang chơi: run giữ ngày bắt đầu.

## 12. Cổng nghiệm thu
- Unit test `core/srs/*`:
  - `autoRate`: đủ 4 nhánh
  - mở face theo stability
  - queue: không 2 thẻ cùng item liền nhau, thẻ sai quay lại sau 3–5 thẻ
  - migrate legacy
- E2E: hoàn thành 1 run 20 thẻ chỉ bằng bàn phím. Kiểm số card thay đổi `due` = 20 trong DB.
- Hiệu năng: chuyển thẻ (nộp → thẻ mới hiển thị) ≤ 120 ms khi đúng (không tính feedback chờ).
- Ảnh chụp 3 độ rộng (360, 768, 1280) cho các face `recall_meaning`, `recog`, bản đồ run, boss, recap.

## 13. Không làm
- Không có bộ đếm thời gian áp lực.
- Không bắt người học tự chấm Again/Good.
- Không có thẻ chỉ đọc lặp lại.
