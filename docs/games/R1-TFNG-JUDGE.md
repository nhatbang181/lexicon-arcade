# R1 · TFNG Judge: phán xử True/False/Not Given có bằng chứng

## 1. Mục đích
- TFNG và YNNG chiếm khoảng 6–14/40 câu mỗi đề. Đây là dạng **người band 6–7 mất điểm nhiều nhất**:
  - nhầm FALSE với NOT GIVEN
  - sập bẫy qualifier hoặc keyword
- Muốn 35+/40 Reading thì TFNG phải đúng ≥ 90%.
- R1 cũng là nơi luyện **thao tác định vị**: tìm đúng câu trong bài trước khi kết luận.
- R1 có **Passage mode**: một passage đầy đủ với mọi dạng câu, chạy được ở training và exam. Đây là chỗ luyện đủ 11+ dạng câu Reading. TFNG Judge là trọng tâm, các dạng khác dùng chung engine chấm.

## 2. Vì sao hiệu quả
- **Bắt buộc có bằng chứng:** phải bôi câu bằng chứng trước khi được chọn T/F/NG. Việc này loại bỏ đoán mò và buộc làm đúng quy trình (định vị → so sánh → kết luận).
- **Chấm hai lớp** (đúng kết luận + đúng bằng chứng) cho biết người học **đúng vì hiểu** hay **đúng vì may**.
- **Feedback theo `trapType`** dạy quy luật. Thống kê cho thấy loại bẫy hay sập.
- **Cơ chế chơi chính là học:** phiên toà. Câu khẳng định là "lời khai", bài đọc là "hồ sơ", người học trình "vật chứng" (span) rồi "tuyên án".

## 3. Core loop
**Chế độ Judge (training, chỉ TFNG/YNNG):**
```
Mở passage (PassageView trái) + "lời khai" (câu hỏi, phải)
→ ① TRÌNH VẬT CHỨNG: bôi đoạn trong bài (hoặc bấm "Không tìm thấy thông tin trực tiếp" nếu nghĩ NG)
→ ② TUYÊN ÁN: TRUE / FALSE / NOT GIVEN (phím T / F / N; YNNG: Y / N / G)
→ CHẤM 2 lớp → FeedbackPanel (quote đúng + steps + trapType) → câu tiếp
Phiên = 1 passage, 6–8 câu TFNG (hoặc YNNG).
```
**Chế độ Passage (training hoặc exam):** làm passage đầy đủ 13–14 câu, mọi dạng, giao diện thi máy. Exam: 20 phút mỗi passage, không có bước vật chứng, chấm cuối bài. Training: có thể bật "yêu cầu vật chứng" cho mọi câu.

## 4. Luật chơi
- **Bước ① là bắt buộc ở Judge mode.** Không bôi gì thì nút tuyên án mờ. Ngoại lệ: chọn "Không tìm thấy thông tin trực tiếp", khi đó chỉ được chọn NG hoặc F.
- **Chấm:**

  | Kết luận | Bằng chứng | Kết quả | XP |
  |---|---|---|---|
  | Đúng | IoU với span đáp án ≥ 0,3, hoặc nằm cùng câu | **Chuẩn** | 15 |
  | Đúng | Sai chỗ | **Đúng may** (Hard) | 5. Hiện "Bạn đúng, nhưng bằng chứng nằm ở…" |
  | Sai | Đúng chỗ | **Hiểu sai** (Again) | 0. Feedback tập trung vào logic so sánh |
  | Sai | Sai chỗ | **Lạc** (Again) | 0. Feedback tập trung vào định vị (từ khoá, paraphrase) |

  - NG: đáp án evidence là "span gần nhất". Chọn "Không tìm thấy" + NG thì tính chuẩn. Bôi đúng span gần nhất + NG cũng tính chuẩn.
- **Thời gian (training):** không giới hạn, nhưng có đồng hồ chạy lên. Có mục tiêu: **≤ 75 giây/câu** ở level 5, **≤ 55 giây** ở level 8+.
- **Passage exam:** 20 phút, hết giờ tự nộp. Chấm theo `core/scoring/readingAnswer.ts` (completion: đúng chính tả, đúng `wordLimit`, chữ phải có trong bài).

## 5. Độ khó

| Level | Passage | Hỗ trợ |
|---|---|---|
| 1–2 | P1, có `glossary` | Câu hỏi sắp theo thứ tự xuất hiện. Có nút "gợi ý đoạn" (chỉ ra đoạn chứa thông tin, −50% XP) |
| 3–4 | P1–P2 | Còn gợi ý đoạn. Bỏ glossary |
| 5–6 | P2 | Không gợi ý. Mục tiêu 75 giây/câu |
| 7–8 | P2–P3 | Trộn TFNG và YNNG trong cùng phiên |
| 9–10 | P3 | Mục tiêu 55 giây/câu. Cảnh báo khi > 90 giây |

## 6. Wireframe (desktop ≥ 1024: chia đôi; < 900: tab "Bài đọc | Câu hỏi")
```
┌ ✕ TFNG Judge · P2 "The hidden cost of urban trees" ── 3/7 ── ◷ 00:41 ── +45 ┐
│ ┌──── HỒ SƠ (Passage) ─────────────────────┐ ┌──── LỜI KHAI #3 ───────────────┐ │
│ │ A  Across rapidly expanding metropolitan │ │ "Most cities have already       │ │
│ │    areas, dark asphalt roads and dense    │ │  doubled their tree canopy."    │ │
│ │    concrete towers intensify ...          │ │                                 │ │
│ │ B  Urban greenery lowers neighbourhood    │ │ ① Trình vật chứng: bôi câu      │ │
│ │    temperatures ... ▒Some▒ ▒cities▒ ▒have▒ │ │    trong hồ sơ                  │ │
│ │    ▒expanded▒ ▒their▒ ▒canopy▒ ▒by▒ ...    │ │    [Không tìm thấy thông tin]   │ │
│ │ C  ...                                    │ │ ② Tuyên án                      │ │
│ │  (Source Serif 18/1.7, max 68ch)          │ │  [TRUE T] [FALSE F] [NOT GIVEN N]│ │
│ └───────────────────────────────────────────┘ └─────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────┘
```
**FeedbackPanel:**
```
✗ Hiểu sai — Đáp án: FALSE (bạn chọn NOT GIVEN)
Vật chứng: "Some cities have expanded their canopy by 10%..." (đoạn B)
Bẫy: qualifier + number — câu hỏi "most… doubled", bài "some… by 10%" → mâu thuẫn rõ → FALSE
Các bước: ① Từ khoá: cities, tree canopy ② Định vị đoạn B ③ So: most≠some, doubled≠10% ④ Có mâu thuẫn → FALSE
```

## 7. Feedback
- Luôn có: đáp án, quote (bôi vàng trong bài, tự cuộn tới), `trapType` (pill), `steps` (2–4 bước), `explanationVi`.
- **Câu thắng:**
  - "Chuẩn N/M (đúng cả bằng chứng)".
  - Hoặc "Phân biệt FALSE/NOT GIVEN: 5/5".
  - Hoặc "Tốc độ trung bình 58 giây/câu (mục tiêu 75 giây)".
- **Thống kê:** ma trận nhầm lẫn T/F/NG (3×3) của 30 ngày gần nhất, hiện ở Recap và Thống kê.

## 8. SRS
- Câu "Hiểu sai" hoặc "Lạc" thì tạo item `tfng:<qid>` (face `tfng_retry`):
  - V1 hiện **đoạn chứa bằng chứng** (không cả bài) + câu khẳng định
  - người học chọn T/F/NG
  - ôn lại tối đa 3 lần rồi tự **retire** (suspend) để tránh học thuộc đáp án
- Cụm paraphrase trong `steps` (vd "doubled" ↔ "by 100%") được đề xuất thành item `para:*` mới. Người học bấm "+ Thêm vào ôn tập".
- Câu `reserved` (X1) không tạo item.

## 9. Data
- `reading/passages/*.json` (`04` §5). MVP 18 training + 6 reserved. Đầy đủ 60 + 24.
- **Judge mode cần** mỗi passage có ≥ 1 nhóm TFNG hoặc YNNG 5–8 câu. Tỷ lệ passage có YNNG ≥ 30% (thường ở P3).
- **Passage mode cần** đủ mọi dạng câu trong toàn kho. Mỗi `RQType` xuất hiện ở ≥ 6 passage.
- Sinh: `05` §4.4. QA bắt buộc G1–G4. **Blind-solve 100%.**

## 10. UI, motion, sound riêng
- **Highlighter:** bôi vật chứng màu xanh dương nhạt. Sau chấm, span đáp án được quét màu vàng (`10` §2).
- **Tuyên án:** nút bấm có "dấu búa" nhỏ (icon gavel) đập xuống (scale 1 → 0,92 → 1, 0,12 s) + SFX `tap` trầm hơn bình thường (howler rate 0.85).
- **Exam mode:**
  - giao diện thi máy
  - highlight bằng chuột phải hoặc nút
  - ghi chú (note) gắn vào span
  - QuestionNav có cờ
  - không có XP hay animation thưởng trong lúc làm

## 11. Edge cases
- Bằng chứng trải trên 2 câu: data cho phép nhiều Span. Người học bôi 1 trong 2 là đạt.
- Người học bôi cả đoạn: IoU thấp nên tính "Đúng may". Feedback nhắc "bôi câu cụ thể".
- Cỡ chữ tuỳ chỉnh (16–22): reflow không làm lệch toạ độ span. Span lưu theo **chỉ số ký tự**, không theo pixel.
- Mobile: bôi bằng chạm-giữ-kéo. Có nút "Chọn câu" (tự bôi cả câu chứa con trỏ).

## 12. Cổng nghiệm thu
- Unit test: chấm 2 lớp (4 nhánh + NG), IoU theo ký tự đa đoạn, chấm completion (wordLimit, chính tả, có trong bài), tất cả `RQType`.
- Data: [INV-R1..R8] pass, blind-solve 100%, soi mẫu 10% passage (đọc cả bài + mọi câu).
- E2E: Judge 7 câu bằng bàn phím + chuột bôi. Passage exam 20 phút (dùng clock giả lập để tua nhanh) tự nộp khi hết giờ.
- Ảnh chụp 3 độ rộng: Judge đang bôi, feedback, Passage exam (thi máy), ma trận nhầm lẫn.

## 13. Không làm
- Không cho xem đáp án trước khi tuyên án.
- Không làm passage < 650 từ ở Passage mode. Bài "mini" cũ chỉ dùng trong Judge level 1–2.
