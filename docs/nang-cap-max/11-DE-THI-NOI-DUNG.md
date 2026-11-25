# 11 · ĐỀ THI VÀ NỘI DUNG · đặc tả + cách soạn đề gốc chuẩn IELTS (thi máy 2026)

> Từ giữa 2026, IELTS chỉ còn thi trên máy (ielts.org 5/3/2026). Cấu trúc và cách chấm không đổi. Nguồn: R2 §A.
> Đặc tả viết bằng lời của mình, đặt ở `data-src/specs/`. Không chép câu hỏi chính thức.

## 1. Đặc tả theo kỹ năng

### 1.1 Listening (≈ 30 phút, 40 câu, nghe 1 lần, cuối bài 2 phút soát, không có thời gian chép đáp án)
| Part | Bối cảnh | Số người nói | Dạng câu hay gặp | Bẫy điển hình |
|---|---|---|---|---|
| 1 | Đời sống: đặt chỗ, đăng ký, hỏi thông tin | 2 | Form/Note/Table completion | Đánh vần tên, số điện thoại, sửa số ("15… sorry, 50"), ngày tháng, đơn vị |
| 2 | Độc thoại đời sống: hướng dẫn, giới thiệu địa điểm | 1 | MCQ, Map/Plan labelling, Matching | Hướng (left/right/opposite), "originally / now / in future", danh sách bị loại trừ |
| 3 | Thảo luận học thuật | 2–4 | MCQ nhiều đáp án, Matching, Sentence completion | **Đồng thuận 2 người** (một người đề xuất, người kia đồng ý/phản đối), đổi ý |
| 4 | Bài giảng học thuật | 1 | Note/Flow-chart/Summary completion | Paraphrase dày, từ học thuật, chuỗi nguyên nhân–kết quả |
- Giới hạn từ ("ONE WORD AND/OR A NUMBER", "NO MORE THAN TWO WORDS") kiểm chặt. Chính tả UK/US đều chấp nhận theo quy ước của đáp án.
- Tốc độ: L1–3 ≈ 140–160 wpm; L7–10 ≈ 170–190 wpm.
- Giọng: theo `10` §5.

### 1.2 Reading Academic (60 phút, 3 passage, 2.150–2.750 từ, 40 câu, 11 dạng)
| Dạng | Kỹ năng | Bẫy | Tối thiểu trong pool |
|---|---|---|---|
| TFNG | Đối chiếu sự kiện | NG ↔ F; so sánh hơn một vế; từ chỉ mức độ (all/some/often) | 150 |
| YNNG | Quan điểm tác giả | Nhầm sự kiện với quan điểm | 90 |
| Matching headings | Ý chính đoạn | Khớp từ khoá nhưng sai chức năng đoạn (IMRaD, R6 §B) | 90 |
| Matching information | Định vị chi tiết | Thông tin nằm ở đoạn khác đoạn chứa từ khoá | 60 |
| Matching features | Gán ý cho người/đối tượng | Tên lặp ở nhiều đoạn | 45 |
| Matching sentence endings | Ngữ pháp + nghĩa | Kết đúng ngữ pháp nhưng sai nghĩa | 45 |
| MCQ | Hiểu chi tiết/suy luận | Đáp án chép từ bài nhưng sai ý | 90 |
| Sentence completion | Định vị + giới hạn từ | Sai dạng từ | 60 |
| Summary/note/table/flow-chart completion | Tóm lược + paraphrase | Có/không có ngân hàng từ | 90 |
| Diagram label | Mô tả quy trình/cấu tạo | Thứ tự | 30 |
| Short-answer | Định vị | Giới hạn từ | 45 |
- Passage 1: sự kiện, dễ hơn. Passage 3: lập luận chi tiết, quan điểm.
- Ít nhất 1 passage mỗi đề có lập luận logic.
- Chức năng đoạn ghi trong metadata, để làm lớp IMRaD cho Matching headings.

### 1.3 Writing Academic (60 phút)
- **Task 1** (≥ 150 từ, ~20'), 7 dạng: line, bar, pie, table, mixed, process, map.
  - Tiêu chí TA band 7–8: overview rõ, dữ liệu **gom nhóm**, xu hướng và khác biệt chính, số liệu minh hoạ chọn lọc.
- **Task 2** (≥ 250 từ, ~40', trọng số gấp đôi), 5 dạng: opinion (agree/disagree), discussion (+ opinion), problem–solution, advantages–disadvantages, two-part question.
- Thi máy: gõ phím, đếm từ, ghi chú không chấm, không gạch đầu dòng.

### 1.4 Speaking (11–14')
- P1: 4–5', chủ đề quen, 2–3 câu mỗi trả lời có lý do.
- P2: 1' chuẩn bị, nói 1'45"–2', có thể 1–2 câu hỏi thêm.
- P3: 4–5', trừu tượng, có phản đề (counter) và nhiều góc nhìn.

## 2. Quy trình soạn đề gốc (kênh C, `10` §2)
1. Chọn spec + band mục tiêu + chủ đề (25 chủ đề IELTS, cân đối theo `topic_trends`).
2. Gom **dữ kiện** từ nguồn mở (kênh A/B), ghi `fact_sources[]`.
3. **Model A** soạn passage/script theo khung chức năng đoạn; đúng độ dài; độ phủ từ đạt.
4. **Model A** soạn câu hỏi theo phân bố dạng; mỗi câu có `answer`, `evidence_span`, `why_vi` (1 câu), `trap_type`.
5. **Model B khác hãng**:
   - giải mù (không thấy đáp án);
   - kiểm sự thật;
   - kiểm không có câu nào trùng ≥ 12 từ liên tiếp với nguồn (trừ ND nguyên văn ở kênh B);
   - kiểm "đúng 1 đáp án".
6. Bộ kiểm tự động: TFNG qua NLI few-shot; Listening qua whisper; coverage/readability.
7. Soi mẫu 10%, ghi `REVIEW_LOG.md`.
8. Xuất với nhãn **"Đề luyện tập gốc của Lexicon Arcade, không phải đề thi thật"**, không dùng logo IELTS.

## 3. Mock test (X1) và Band Gate
- **Bộ L/R đầy đủ:** 40 câu, phân bố dạng như đề thật, đủ 4 Part/3 passage, giọng đa dạng.
- **Giao diện như thi máy:** highlight, ghi chú, Listening 2 phút soát cuối bài, Reading không có thời gian chép đáp án.
- **Dành riêng:** item mock không xuất hiện trong luyện tập. Mỗi bộ làm có giờ 1 lần; làm lại chỉ để chữa, không tính band.
- **Band Gate 6.5 → 7.0 → 7.5 → 8.0:** qua cổng khi 2 mock liên tiếp đạt mục tiêu của kỹ năng đó (L/R theo bảng quy đổi; W/S theo khoảng đã hiệu chỉnh, lấy **cận dưới**).

## 4. Task 1 chi tiết (N2 Overview Forge cần)
- Mỗi đề có: dữ liệu gốc (OWID), `key_features[]` (3–5 điểm chính), `groups[]` (cách gom nhóm hợp lý), `overview_reference` (2 câu), bài mẫu band 7 và band 8 (khác nhau ở chọn lọc, gom nhóm, từ chính xác).
- Process/map: SVG tự vẽ + danh sách bước/thay đổi + **từ vựng theo ngành** (R5: "How It's Made").

## 5. Idea Bank (Task 2 và Speaking P3)
- 12 chủ đề lớn: giáo dục, công nghệ, môi trường, sức khoẻ, đô thị hoá/giao thông, kinh tế/việc làm, xã hội/gia đình, văn hoá/du lịch, chính phủ/luật, khoa học/vũ trụ, truyền thông/quảng cáo, thể thao/giải trí.
- Mỗi chủ đề ≥ 10 ý. Mỗi ý gồm:
  - claim;
  - cơ chế (why/how);
  - **ví dụ cụ thể có dữ kiện + nguồn** (OWID/Wikipedia);
  - phản đề;
  - 5 collocation chủ đề.
- Đây là "brainstorm theo chủ đề lớn" của Phùng Tiến Thành (9.0, R3 §B).
- Người học được **thêm ý của mình** (lưu cục bộ).

## 6. Ngân hàng Speaking
- P1/P2/P3 theo §1.4, gắn `topic`, `level`, `quarter`.
- Mỗi câu có 3 cách hỏi (biến thể) để chống học thuộc.
- **Câu trả lời mẫu theo văn nói:**
  - discourse marker kiểu nói ("Well, to be honest…", "I guess…", "The thing is…"), không dùng "Firstly, Moreover" kiểu Writing (R5 `_winter712_`);
  - P2 có trải nghiệm cụ thể;
  - P3 có phản đề.
- Khung ý: PEEL nói (Point–Explain–Example–Link); 4 "trục lái" để kéo dài (tiền, gia đình, đa dạng, kích cỡ; R5 `linhnguyenthi22.5`); P2 mở thẳng → trải nghiệm → vòng lại cue card → cảm nghĩ (R5 `phuc.hg__`).
- Idea bank tái dùng 50% + 50% chỉnh theo đề (R5 `chippp_p`).
