# 01 · IELTS Academic – bản tóm tắt đề thi để thiết kế game

> Mục đích: mọi worker hiểu **bài thi thật chấm cái gì**. Game phải luyện đúng thứ đó.
> Các mô tả band trong file này được **tự diễn đạt lại** để thiết kế, không chép nguyên văn. Khi cần chính xác tuyệt đối, xem bản gốc:
> - Writing band descriptors (bản cập nhật tháng 5/2023): https://ielts.org/cdn/ielts-downloadable-assets/ielts-guidance-and-support/ielts-guides/ielts-writing-band-descriptors.pdf
> - Trang IELTS.org cho từng kỹ năng.

## 0. Năm 2026 có gì thay đổi (đã kiểm chứng ngày 20/11/2026)
- **Chỉ đổi cách thi, không đổi nội dung.**
  - Thi giấy dừng từ khoảng giữa năm 2026 (buổi cuối ở đa số thị trường là 27/06/2026). Hiện thi chủ yếu trên máy tính.
  - Ở một số nước có hình thức "IELTS on Computer with Writing on Paper".
  - Dạng câu hỏi, thời gian, thang 0–9 và 4 tiêu chí chấm Writing/Speaking **giữ nguyên**.
- **One Skill Retake:** được thi lại 1 kỹ năng (chỉ áp dụng cho hình thức thi máy).
- Nhiều blog nói về "thay đổi lớn" (phạt bài học thuộc template, Speaking qua video, Reading kiểu mới…). Những tin này **không có nguồn chính thức. Không thiết kế theo chúng.**
- **Hệ quả cho app:** chế độ thi (X1, và chế độ Exam của L1/R1) phải mô phỏng **giao diện thi trên máy**:
  - gõ đáp án
  - highlight và ghi chú trên bài đọc
  - bộ đếm từ khi viết
  - thanh điều hướng câu hỏi
  - đánh dấu (flag) câu để xem lại
  - đồng hồ đếm ngược
- Nguồn: [ieltsbiz](https://ieltsbiz.com/blog/ielts-changes-2026), [prepex](https://prepex.ai/blog/ielts-changes-2026), [British Council CD](https://takeielts.britishcouncil.org/computer-delivered/listening).

## 1. Muốn đạt 8.0 overall cần profile như thế nào
Overall là trung bình 4 kỹ năng rồi làm tròn tới nửa band gần nhất:
- phần lẻ .25 làm tròn lên .5
- phần lẻ .75 làm tròn lên band kế tiếp

**Hai profile thực tế cho người Việt đang ở 6.0:**

| Profile | L | R | W | S | TB | Overall |
|---|---|---|---|---|---|---|
| A (khuyến nghị) | 8.5 | 8.5 | 7.0 | 7.5 | 7.875 | **8.0** |
| B | 8.0 | 8.5 | 7.5 | 7.5 | 7.875 | **8.0** |

**Chiến lược:**
- Listening và Reading là chỗ người Việt dễ đẩy lên 8.5–9 nhất, vì có thể luyện số lượng lớn và chấm khách quan.
- Writing và Speaking cần đạt tối thiểu 7.0–7.5.
- Vì vậy app ưu tiên:
  1. **Khối lượng luyện L/R thật lớn và đúng format.**
  2. **Vòng phản hồi W/S thật chất lượng.**
  3. Từ vựng làm nền cho cả bốn kỹ năng. Lượng từ học thuật tương quan r ≈ .65 với Listening và .60 với Reading ở người học Việt Nam ([LTA 2021](https://languagetestingasia.springeropen.com/track/pdf/10.1186/s40468-021-00131-8)).

### Bảng quy đổi điểm thô → band (xấp xỉ, mỗi đề lệch ±1 câu)

| Band | Listening (/40) | Academic Reading (/40) |
|---|---|---|
| 9.0 | 39–40 | 39–40 |
| 8.5 | 37–38 | 37–38 |
| 8.0 | 35–36 | 35–36 |
| 7.5 | 32–34 | 33–34 |
| 7.0 | 30–31 | 30–32 |
| 6.5 | 26–29 | 27–29 |
| 6.0 | 23–25 | 23–26 |
| 5.5 | 18–22 | 19–22 |
| 5.0 | 16–17 | 15–18 |

Bảng này dùng cho **band estimator** (xem `02-LEARNING-DESIGN.md` §7). Lưu thành hằng số `src/core/band/tables.ts`.

## 2. Listening (khoảng 30 phút, 40 câu, mỗi đoạn chỉ nghe 1 lần)

| Part | Bối cảnh | Số người nói | Dạng câu hay gặp |
|---|---|---|---|
| 1 | Giao dịch đời thường (đặt chỗ, đăng ký, hỏi thông tin) | 2 | Form/note/table completion |
| 2 | Độc thoại đời thường (hướng dẫn tham quan, giới thiệu cơ sở) | 1 | Map/plan labelling, MCQ, matching |
| 3 | Thảo luận học thuật (sinh viên với tutor) | 2–4 | MCQ, matching, flow-chart |
| 4 | Bài giảng học thuật | 1 | Note/summary completion, thường không có ngắt giữa chừng |

- **Dạng câu chính thức:**
  - multiple choice
  - matching
  - plan/map/diagram labelling
  - form/note/table/flow-chart/summary completion
  - sentence completion
  - short-answer
- Dạng nào cũng có thể xuất hiện ở bất kỳ part nào.
- **Luật chấm:**
  - Chính tả phải đúng. Anh-Anh hay Anh-Mỹ đều được.
  - Phải đúng giới hạn từ, ví dụ "NO MORE THAN TWO WORDS AND/OR A NUMBER".
  - Không phân biệt hoa thường.
  - Số viết bằng chữ số hay chữ đều được.
- **Giọng đọc:** Anh, Úc, New Zealand, Mỹ, Canada.
- **Thi trên máy:** không có 10 phút chép đáp án như thi giấy. Cuối bài có khoảng 2 phút để xem lại. Có thời gian đọc trước câu hỏi trước mỗi part.

### 2.1 Bộ bẫy Listening (L1 Trap Detector bắt buộc phải có đủ)
Mỗi item bẫy gắn một `trapType`:

| `trapType` | Mô tả | Ví dụ |
|---|---|---|
| `self_correction` | Người nói nói ra rồi tự sửa | "on the 13th… sorry, the 30th" |
| `changed_plan` | Phương án ban đầu bị đổi | "We were going to meet Tuesday but…" |
| `distractor_number` | Nhiều con số xuất hiện, chỉ một số là đáp án | giá cũ/mới, số người dự kiến/thực tế |
| `spelling_out` | Đánh vần tên, mã bưu chính, email | "That's S-H-A-W-E" |
| `double_letter` | Đánh vần có chữ đôi | "double T", "double-oh" |
| `negation_shift` | Có phủ định hoặc đối lập | "not the main hall but the annexe" |
| `option_mentioned_rejected` | MCQ: cả 3 phương án đều được nhắc nhưng 2 bị loại | |
| `synonym_paraphrase` | Câu hỏi và audio dùng từ khác nhau | "inexpensive" ↔ "doesn't cost much" |
| `plural_singular` | Đáp án là số nhiều | phải ghi "-s" |
| `word_limit` | Đáp án dài hơn giới hạn từ nếu chép nguyên | |
| `homophone_minimal_pair` | Từ dễ nghe nhầm | "fifteen/fifty", "ship/sheep" |
| `signpost_skip` | Người nghe bị lạc khi người nói chuyển ý | "Moving on to…", "Another point…" |
| `map_direction` | Hướng và vị trí trên bản đồ | "opposite", "to the left of", "just past" |

### 2.2 Điểm yếu nghe hay gặp ở người Việt (để thiết kế L2)
- Không nghe ra **âm cuối**: -s/-z, -t/-d, -ed, -ks.
- Không nghe ra **âm yếu** của từ chức năng: to /tə/, for /fə/, of /əv/, can /kən/.
- Không nhận ra **nối âm** và **nuốt âm**: "next day" → /neks deɪ/, "want to" → /ˈwɒnə/.
- Dễ nhầm số: -teen với -ty, cách đọc năm, giá tiền, giờ.
- Nghe được nghĩa nhưng **chép sai chính tả**. Một số từ hay sai:
  - accommodation
  - February, Wednesday
  - environment, government
  - necessary
  - recommend
  - questionnaire

## 3. Academic Reading (60 phút, 3 passage, 40 câu)
- **Tổng độ dài 2.150–2.750 từ**, mỗi passage khoảng 700–950 từ. Độ khó và mức trừu tượng tăng dần từ passage 1 đến passage 3.
- **Nguồn bài:** sách, tạp chí, báo, viết cho độc giả phổ thông. Ít nhất một bài có lập luận logic chi tiết.
- **Dạng câu:**
  - MCQ
  - **True/False/Not Given** (thông tin)
  - **Yes/No/Not Given** (quan điểm của tác giả)
  - Matching information (đoạn nào chứa thông tin)
  - **Matching headings**
  - Matching features
  - Matching sentence endings
  - Sentence completion
  - Summary/note/table/flow-chart completion (từ trong bài hoặc chọn từ danh sách)
  - Diagram label completion
  - Short-answer
- **Không có thêm thời gian chép đáp án.** Thi trên máy: màn hình chia đôi, bài đọc bên trái và câu hỏi bên phải. Có highlight và ghi chú.

### 3.1 Luật logic TFNG/YNNG (R1 phải dạy đúng như sau)
- **TRUE/YES:** bài nói đúng ý của câu, có thể bằng cách diễn đạt khác.
- **FALSE/NO:** bài nói **ngược lại** với câu. Phải có chỗ mâu thuẫn rõ ràng.
- **NOT GIVEN:** bài **không cho đủ thông tin** để xác nhận hay bác bỏ. Bài có thể nhắc tới chủ đề đó nhưng không nói về đúng điểm mà câu khẳng định.
- **Các nhóm bẫy** (trường `trapType` của câu TFNG):

| `trapType` | Mô tả |
|---|---|
| `qualifier` | all/some/most/always/usually/never |
| `comparison` | more/less/the most/first |
| `causation` | A gây ra B, hay chỉ là A đi kèm B |
| `time_sequence` | trước/sau, lần đầu tiên |
| `number_date` | số liệu, ngày tháng |
| `opinion_vs_fact` | ý kiến hay sự thật |
| `partial_match` | khớp một nửa câu, nửa còn lại không được nhắc → NG |
| `keyword_echo` | câu dùng đúng từ trong bài nhưng ý khác |
| `extra_claim` | câu thêm một chi tiết bài không nói → NG |

### 3.2 Matching Headings – các kiểu heading bẫy (R2)

| `distractorType` | Mô tả |
|---|---|
| `detail_only` | Chỉ đúng với một chi tiết trong đoạn, không phải ý chính |
| `too_broad` | Bao trùm cả bài, không riêng đoạn này |
| `keyword_match` | Chứa từ khoá xuất hiện trong đoạn nhưng sai trọng tâm |
| `adjacent_paragraph` | Đúng với đoạn bên cạnh |
| `opposite_stance` | Ngược với thái độ của đoạn |

## 4. Academic Writing (60 phút)
- **Task 1:** ≥150 từ, khoảng 20 phút. Mô tả biểu đồ cột, đường, tròn, bảng, kết hợp, quy trình, hoặc bản đồ trước/sau.
- **Task 2:** ≥250 từ, khoảng 40 phút. Điểm Task 2 **nặng gấp đôi** Task 1.
- **4 tiêu chí, mỗi tiêu chí 25%:**
  - Task Achievement (Task 1) / Task Response (Task 2)
  - Coherence & Cohesion
  - Lexical Resource
  - Grammatical Range & Accuracy
- **Các dạng đề Task 2** (enum `essayType`):

| `essayType` | Dạng đề |
|---|---|
| `opinion` | To what extent do you agree… |
| `discussion` | Discuss both views and give your opinion |
| `adv_disadv` | Advantages/disadvantages, hoặc "outweigh" |
| `problem_solution` | Nguyên nhân/vấn đề và giải pháp |
| `two_part` | Hai câu hỏi trực tiếp |
| `positive_negative` | Is this a positive or negative development |

### 4.1 Khác biệt giữa band 7 và band 8 (tự diễn đạt lại, dùng làm rubric chấm và feedback)

| Tiêu chí | Band 7 | Band 8 |
|---|---|---|
| TR (Task 2) | Trả lời đủ các phần. Quan điểm rõ. Ý chính được mở rộng nhưng có thể khái quát quá mức hoặc thiếu tập trung | Trả lời **đủ và sâu** mọi phần. Ý **liên quan, được mở rộng và có dẫn chứng**. Chỉ thỉnh thoảng có sơ suất |
| TA (Task 1) | Có overview rõ. Nêu và làm nổi bật các đặc điểm chính, có thể cần phát triển thêm | Overview rõ. Đặc điểm chính được chọn lọc, **làm nổi bật và minh hoạ bằng số liệu** đầy đủ, chính xác |
| CC | Tổ chức logic, có tiến triển rõ. Dùng nhiều phương tiện liên kết, đôi chỗ dùng sai hoặc dùng quá nhiều | Trình tự logic. **Liên kết được kiểm soát tốt, không lộ.** Chia đoạn hợp lý |
| LR | Đủ vốn từ để linh hoạt. Dùng từ ít phổ biến, **có ý thức về văn phong và collocation**. Thỉnh thoảng sai cách chọn từ hoặc chính tả | Vốn từ **rộng, dùng trôi chảy và linh hoạt để diễn đạt chính xác**. Dùng **khéo** từ ít phổ biến và thành ngữ. Hiếm khi sai collocation hoặc chính tả |
| GRA | Dùng nhiều cấu trúc phức. **Nhiều câu không lỗi.** Ngữ pháp và dấu câu kiểm soát tốt | Cấu trúc **rộng, linh hoạt, chính xác**. **Đa số câu không có lỗi.** Lỗi hiếm và không hệ thống |

### 4.2 Điểm yếu Writing hay gặp ở người Việt
Nguồn: [VNU 2025](https://js.vnu.edu.vn/ER/article/view/5268/4149), [VietnamNet](https://vietnamnet.vn/en/teacher-scores-9-0-on-ielts-after-years-of-effort-2368462.html).
- Khó nhất là **Lexical Resource** và **Coherence & Cohesion**.
- **Nhồi từ khó mà không phát triển ý.** Quá tải từ nối "Moreover/Furthermore".
- Lỗi ngữ pháp có hệ thống (enum `errorTag`):

| `errorTag` | Lỗi |
|---|---|
| `article` | Mạo từ a/an/the |
| `plural` | Số nhiều, danh từ không đếm được (informations, researches) |
| `sva` | Hoà hợp chủ ngữ và động từ |
| `tense` | Thì |
| `word_form` | Dạng từ (economy/economic) |
| `preposition` | Giới từ |
| `run_on` | Câu dính liền, comma splice |
| `fragment` | Câu thiếu thành phần |
| `l1_collocation` | Collocation dịch từ tiếng Việt (make a crime, learn knowledge) |
| `register` | Văn phong thân mật trong bài học thuật |

- Task 1: **thiếu overview** hoặc overview yếu, liệt kê số liệu mà không so sánh, không nhóm dữ liệu.

## 5. Speaking (11–14 phút)

| Part | Thời lượng | Nội dung |
|---|---|---|
| 1 | 4–5 phút | Câu hỏi về bản thân, chủ đề quen thuộc. 2–3 nhóm chủ đề |
| 2 | 1 phút chuẩn bị + 1–2 phút nói | Cue card có các gợi ý. Giám khảo có thể hỏi thêm 1–2 câu |
| 3 | 4–5 phút | Thảo luận trừu tượng, liên quan tới chủ đề Part 2 |

- **4 tiêu chí:** Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation.
- **Chủ đề đổi theo 3 đợt mỗi năm:** tháng 1–4, 5–8, 9–12. Nhóm chủ đề lớn ổn định, câu hỏi cụ thể đổi từng đợt ([Cathoven](https://resources.cathoven.com/ielts-speaking/topics-2026)).
  - Hôm nay 20/11/2026 nên đợt hiện tại là **tháng 9–12/2026**. Đợt kế tiếp là **tháng 1–4/2027**.
  - Data Speaking phải có trường `rotation` (vd `2026-Q3` hoặc `2027-Q1`, hiểu Q là đợt 4 tháng) và `evergreen: true/false`.

### 5.1 Band 8 Speaking (tự diễn đạt lại)

| Tiêu chí | Band 8 |
|---|---|
| FC | Nói trôi chảy. Chỉ thỉnh thoảng lặp từ hoặc tự sửa. Ngập ngừng là để **nghĩ ý**, không phải để **tìm từ**. Phát triển chủ đề mạch lạc |
| LR | Từ rộng và linh hoạt, diễn đạt chính xác. Dùng khéo từ ít phổ biến và thành ngữ. Paraphrase hiệu quả |
| GRA | Cấu trúc rộng, dùng linh hoạt. Đa số câu không lỗi |
| P | Dùng nhiều đặc điểm phát âm (trọng âm, ngữ điệu, nối âm, ngắt cụm). Dễ hiểu suốt bài. Giọng mẹ đẻ ảnh hưởng rất ít |

### 5.2 Điểm yếu Speaking hay gặp ở người Việt
Nguồn: [VNU](https://js.vnu.edu.vn/FS/article/view/2573), [VietnamNet](https://vietnamnet.vn/en/teacher-scores-9-0-on-ielts-after-years-of-effort-2368462.html).
- Hồi hộp ở Part 1.
- Quản lý thời gian kém ở Part 2: hết ý sau 40–60 giây.
- Tư duy trừu tượng yếu ở Part 3.
- **Dịch trong đầu** nên chậm bắt đầu và ngập ngừng tìm từ. Đây là đích của S2 (3-Second Rule).
- Phát âm:
  - mất âm cuối
  - sai trọng âm từ (eCOnomy hay ecoNOmy)
  - ngữ điệu phẳng
  - âm /θ/ /ð/ /ʃ/ /ʒ/
  - nguyên âm dài và ngắn (ship/sheep)
