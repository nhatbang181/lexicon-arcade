# 02 · Thiết kế học tập: tâm lý người học, SRS, động lực, lộ trình, band estimator

> File này là "luật vật lý" của app. Mọi game phải tuân theo. Game nào vi phạm thì không qua cổng review.

## 1. Bảy nguyên tắc học (có bằng chứng) và cách áp dụng

| # | Nguyên tắc | Bằng chứng | Luật cho app |
|---|---|---|---|
| P1 | **Tự gợi nhớ tốt hơn đọc lại** (retrieval practice) | Testing effect. Hiệu quả lớn hơn khi học có giãn cách ([PMC review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8638698)) | Mỗi lượt chơi bắt người học **tự nhớ ra** trước, rồi mới xem đáp án. Không có màn "chỉ đọc" kéo dài quá 1 thẻ giới thiệu |
| P2 | **Giãn cách** (spacing) | Meta-analysis về học từ vựng bằng công nghệ | Một bộ lập lịch **FSRS** chung cho cả app (§3). Thẻ sai quay lại trong cùng phiên rồi theo lịch |
| P3 | **Sản xuất tốt hơn nhận diện** cho band 7+ | Mô tả band LR và GRA yêu cầu *dùng* được từ | Mỗi item phải đi qua được bậc **tự gõ hoặc tự nói ra**. MCQ chỉ là bậc đầu |
| P4 | **Gamification chỉ tăng động lực, không tăng trí nhớ** | Thí nghiệm Groningen 2025: points và progress bar tăng động lực nhưng không tăng kết quả học ([UU repo](https://research-portal.uu.nl/ws/portalfiles/portal/277804433/1-s2.0-S0747563225003097-main.pdf)) | **Cơ chế chơi phải chính là hành động học** (intrinsic integration). Điểm và hiệu ứng chỉ là lớp phủ. Cấm cơ chế mà kỹ năng điều khiển không liên quan tới tiếng Anh |
| P5 | **Độ khó vừa sức** (desirable difficulty) | Vùng phát triển gần, flow | Bộ điều chỉnh độ khó nhắm **tỷ lệ đúng 80–85%** (§4) |
| P6 | **Phản hồi tức thì và có lời giải thích** | Feedback có giải thích hiệu quả hơn chỉ báo đúng/sai | Mỗi câu sai: (a) đáp án đúng, (b) **vì sao** (tiếng Việt, ≤ 2 câu), (c) bằng chứng (quote, timestamp audio), (d) nút "nghe lại hoặc xem lại" |
| P7 | **Xen kẽ** (interleaving) và **chuyển giao sang bài thi** | Interleaving giúp phân biệt các dạng | Daily Run trộn nhiều loại thẻ. Mỗi game có **Exam mode** giống format thật. Mỗi tuần có 1 bài thi thử (X1) |

## 2. Tâm lý: vì sao muốn học tiếp mỗi ngày

Dùng **Self-Determination Theory** (cảm giác giỏi lên, tự chủ, gắn kết) và vòng thói quen (tín hiệu → hành động → phần thưởng → đầu tư).

### 2.1 Cảm giác giỏi lên (quan trọng nhất)
- **Band meter cho từng kỹ năng** (§7) hiện trên trang Hôm nay. Có mũi tên ↑↓ so với tuần trước.
- Mỗi phiên kết thúc bằng **1 câu thắng cụ thể**, ví dụ:
  - "Hôm nay bạn bắt được 7/8 bẫy self-correction (tuần trước 4/8)."
  - "12 từ vừa lên mức Mature."
- **Mastery của item:** New → Learning → Young (khoảng < 21 ngày) → Mature (≥ 21 ngày) → Mastered (≥ 90 ngày và lần gợi nhớ gần nhất đúng). Có bộ đếm "Từ đã thuộc thật".

### 2.2 Tự chủ
- Trang **Hôm nay** tự đề xuất kế hoạch (§6) và luôn cho **"Đổi"** sang game khác.
- Không khoá game theo cấp độ. Chỉ **khuyến nghị** độ khó.

### 2.3 Thói quen và giữ chân
- **Mục tiêu hằng ngày nhỏ:** mặc định 30 phút hoặc 3 "vòng". Chọn được 15/30/45/60 phút.
- **Streak có "Đóng băng":**
  - Mỗi 7 ngày liền được 1 lượt đóng băng, giữ tối đa 2.
  - Ngày bận chỉ cần làm **1 Daily Run ngắn (≥ 5 thẻ)** là giữ được streak.
  - Mất streak **không** xoá XP hay tiến độ.
- **Không game over giữa phiên.** Sai không làm mất mạng. Sai làm giảm combo, thẻ quay lại sau (P1, P2).
  - *Ngoại lệ:* Exam mode chạy đúng luật thi (hết giờ là nộp).
- **Phần thưởng biến thiên, rẻ:**
  - "Thẻ hiếm": item khó ở mức Mastered lâu ngày, xuất hiện ngẫu nhiên 1/30 thẻ, gấp 3 XP.
  - Huy hiệu tuần.
  - Không dùng hộp quà may rủi.
- **Đầu tư:** người học tự gắn ⭐ vào item muốn ôn thêm, tự viết ví dụ cho từ. Bài viết và ghi âm được lưu lại thành **portfolio** để xem mình tiến bộ.
- **Nhắc học:** PWA, có thể bật thông báo vào giờ Bang chọn (Notifications API, tuỳ chọn). Thêm lời nhắc kế hoạch cụ thể: "Học lúc ___ sau khi ___".

### 2.4 Chống tác dụng ngược
- Không đếm XP theo thời gian mở app. **XP chỉ đến từ lượt gợi nhớ hoặc sản xuất** có chấm điểm.
- Không để dễ quá mà vẫn được thưởng: chơi lại câu vừa làm chỉ được 0 XP.
- Không hiệu ứng tràn màn hình mỗi câu đúng. Confetti chỉ dùng ở các mốc lớn (xem `10-MOTION-AND-SOUND.md`).

## 3. Bộ não SRS chung (FSRS)

### 3.1 Thư viện và tham số
- **Thư viện:** `ts-fsrs` (MIT, https://github.com/open-spaced-repetition/ts-fsrs). Cài bản stable mới nhất, ghi số version vào `DECISIONS.md`.
- **Tham số mặc định:**
  - `request_retention = 0.90`
  - `maximum_interval = 365` (thi trong khoảng 12–18 tháng nên không cần dài hơn)
  - `enable_fuzz = true`
- Sau ≥ 1.000 lượt review thì cho phép **tối ưu tham số** (tuỳ chọn ở M6). Nếu ts-fsrs có optimizer dùng được trong trình duyệt thì dùng, không có thì bỏ qua.

### 3.2 Item và Card
- **Item:** một đơn vị kiến thức có ID ổn định. Ví dụ:
  - từ `vocab:curriculum`
  - collocation `col:allocate_funding`
  - cặp paraphrase `para:0123`
  - câu dictation `dict:0456`
  - bẫy nghe `ltrap:0789`
  - mẫu lỗi `err:article_0012`
- **Card:** một **mặt (face)** của item, có lịch FSRS riêng. Ví dụ một từ có các face:
  - `recog`: nhận diện, chọn nghĩa
  - `recall_meaning`: thấy nghĩa hoặc định nghĩa, gõ ra từ
  - `recall_cloze`: điền vào câu ví dụ
  - `listen_spell`: nghe rồi gõ

**Luật mở face** (tăng dần độ khó, đúng P3):
1. Item mới: thẻ giới thiệu → `recog`.
2. Khi `recog` có stability ≥ 3 ngày thì mở `recall_meaning` và `recall_cloze`.
3. Khi `recall_*` có stability ≥ 10 ngày thì mở `listen_spell`.

Mastery của item lấy theo **face khó nhất đã mở**.

**Danh sách đầy đủ các face** (enum `Face` trong `src/core/srs/faces.ts`):

| Face | Item | Game tạo ra | Mô tả |
|---|---|---|---|
| `intro` | vocab | V1 | Thẻ giới thiệu, không lên lịch |
| `recog` | vocab | V1 | Chọn nghĩa |
| `recall_meaning` | vocab | V1 | Gõ headword từ nghĩa |
| `recall_cloze` | vocab | V1 | Điền vào câu |
| `listen_spell` | vocab | V1, L1, L2, S1 | Nghe rồi gõ |
| `col_gap` | collocation | V2, W1 | Gõ phần thiếu |
| `para_match` | paraphrase | V3 | Chọn 1 trong 4 |
| `err_fix` | error / phrase | V2, W1, W2, S1, S2 | Sửa câu sai, cloze |
| `ltrap_replay` | ltrap | L1 | Nghe đoạn bẫy rồi gõ đáp án |
| `dict_full` | dict | L2 | Chép cả câu |
| `tfng_retry` | tfng | R1 | Đoạn + câu → T/F/NG. Retire sau 3 lần |
| `head_retry` | head | R2 | Đoạn + 4 heading. Retire sau 3 lần |

V1 Daily Run render được **mọi** face trong bảng trên.

### 3.3 Tự quy điểm (không bắt người học tự chấm Again/Hard/Good/Easy)
Hàm `autoRate(result)` trong `src/core/srs/autoRate.ts`:

| Kết quả | Rating |
|---|---|
| Sai, hoặc phải xem đáp án | `Again` |
| Đúng nhưng dùng gợi ý, sai 1 ký tự với `listen_spell`, hoặc thời gian > p90 thời gian của face đó | `Hard` |
| Đúng, không gợi ý, thời gian trong khoảng p25–p90 | `Good` |
| Đúng, không gợi ý, thời gian < p25 và streak của card ≥ 2 | `Easy` |

- Các mốc p25/p90 tính theo lịch sử của Bang cho từng face. Chưa có dữ liệu thì dùng mặc định:

| Face | p25 | p90 |
|---|---|---|
| `recog` | 2,5 giây | 8 giây |
| `recall_*` | 4 giây | 15 giây |
| `listen_spell` | 5 giây | 18 giây |

- Có nút **"Tôi biết từ này rồi"** ở thẻ giới thiệu. Bấm vào thì đẩy item thẳng lên `recall_meaning`, nhưng **phải trả lời đúng 1 lần** mới được tính.

### 3.4 Item từ game khác chảy vào SRS
| Nguồn | Item được tạo |
|---|---|
| Câu sai ở L1/L2/R1/R2 | Item loại `ltrap`, `dict`, `tfng_pattern`… (face riêng) |
| Lỗi Claude tìm thấy ở W1/S1 (kết quả dán vào) | Item `err:*` (face: sửa câu sai) |
| Collocation/từ Claude gợi ý nâng cấp | Item `col:*` hoặc `vocab:*` gắn nhãn `source: "essay_feedback"` |

Thay thế cho "Mistake Bank" cũ trong localStorage. Dữ liệu cũ được migrate một lần, xem `03-ARCHITECTURE.md` §7.

### 3.5 Giới hạn mỗi ngày
- **Thẻ mới:** mặc định 15/ngày, chỉnh được 5–40.
- **Review:** không giới hạn. Nếu backlog > 200 thì Daily Run chỉ lấy 120 thẻ quá hạn lâu nhất, ưu tiên retrievability thấp, và hiện cảnh báo nhẹ.
- **Tỷ lệ mới/ôn trong một run:** 1 thẻ mới sau mỗi 4 thẻ ôn.

## 4. Điều chỉnh độ khó (dùng chung)
`src/core/adaptive/difficulty.ts`:
- Mỗi game có `level` (1–10) cho mỗi người học. Lưu trong `profile.skillLevels[gameId]`.
- **Cửa sổ trượt 20 lượt gần nhất:**
  - tỷ lệ đúng > 90% → level +1
  - tỷ lệ đúng < 70% → level −1
  - nằm trong 70–90% thì giữ nguyên
  - không đổi level quá 1 lần mỗi 10 lượt
- Mỗi game tự định nghĩa level ảnh hưởng tới những gì (tốc độ audio, độ dài passage, số distractor, thời gian…). Xem file từng game.
- **Exam mode bỏ qua adaptive**, dùng độ khó thật của đề.

## 5. Mẫu phiên học (session) dùng chung
Mọi game theo khung sau. Thành phần UI nằm trong `09-UX-FLOWS.md`.
```
[Intro 1 màn: mục tiêu phiên + 1 mẹo ≤ 25 từ]
   → [Vòng chơi: N lượt, mỗi lượt: prompt → tự trả lời → chấm → feedback ngắn]
   → [Recap: điểm, 1 "câu thắng", danh sách sai bấm vào để xem lại, nút "ôn lại câu sai ngay" (tối đa 5)]
   → [Ghi SRS + XP + band evidence]
```
- **Độ dài mặc định:** 5–12 phút mỗi phiên. Bấm thoát giữa chừng thì phần đã làm vẫn được lưu.

## 6. Trang "Hôm nay": planner tự động
Hàm `buildTodayPlan(profile, now)` trong `src/core/planner/today.ts`. Nó trả về 3–5 thẻ hoạt động, tổng thời gian khớp mục tiêu ngày.

**Thứ tự ưu tiên:**
1. **Daily Run (V1)** luôn đứng đầu nếu có thẻ đến hạn.
2. **Kỹ năng yếu nhất.** Tính `gap = targetBand[skill] − estimatedBand[skill]`, chọn kỹ năng có gap lớn nhất. Gợi ý game hợp nhất của kỹ năng đó: game có level thấp nhất hoặc lâu chưa chơi nhất.
3. **Xoay vòng.** Không gợi ý cùng một kỹ năng sản xuất (W hoặc S) 2 ngày liền nếu kỹ năng đó không phải yếu nhất.
4. **Thi thử tuần (X1).** Gợi ý mỗi 7 ngày, ưu tiên cuối tuần: 1 Listening + 1 Reading đầy đủ. Mỗi 14 ngày thêm 1 bài Writing đầy đủ. Mỗi 14 ngày thêm 1 Mock Speaking.

**Target band mặc định:** L 8.5, R 8.5, W 7.5, S 7.5 (profile A ở `01` §1). Chỉnh được trong Cài đặt.

**Trường hợp ngày bận:** mục tiêu ngày 15 phút → chỉ Daily Run + 1 game ngắn (V2/V3/L2/S2).

## 7. Band estimator
`src/core/band/estimator.ts`. Hiện trên trang Hôm nay và Thống kê, kèm **độ tin cậy** (thấp/vừa/cao) theo số bằng chứng.

| Kỹ năng | Bằng chứng | Công thức |
|---|---|---|
| Listening | Exam mode của L1 và X1 (mỗi câu đúng format, chấm khách quan) | Lấy tỷ lệ đúng có trọng số thời gian (bài 30 ngày gần nhất nặng gấp 2) × 40 → tra bảng `01` §1. Cần ≥ 40 câu mới hiện số, < 40 câu hiện "–" |
| Reading | Exam mode của R1/R2 và X1 | Như Listening |
| Writing | Điểm Claude của W1 (bài đầy đủ, đã dán kết quả). Điểm thật Bang nhập vào được ưu tiên | Trung bình 5 bài gần nhất, Task 2 nhân 2. Cộng `biasOffset` nếu Bang đã xác nhận (mặc định 0, xem `07-GRADING-WITH-CLAUDE.md` §6). Làm tròn 0.5 |
| Speaking | Điểm Claude của S1 (mock đầy đủ, đã dán kết quả) | Trung bình 3 mock gần nhất. Làm tròn 0.5 |
| Vocab (phụ) | Vocab size test (placement) và số item Mature | Không phải band. Hiện "≈ N từ học thuật chủ động" |

- **Overall:** quy tắc làm tròn như `01` §1. Chỉ hiện khi cả 4 kỹ năng có số.
- **Kết quả từ chế độ luyện tập** (không phải Exam mode) **không** tính vào band. Chế độ luyện có gợi ý và adaptive nên số liệu bị lệch.

## 8. Bài kiểm tra đầu vào (placement), làm ở onboarding, khoảng 25–35 phút, bỏ qua được
1. **Vocab size (5 phút):** 60 từ lấy mẫu theo dải tần suất (NGSL/NAWL/AWL). Người học chọn "Biết nghĩa / Không chắc / Không biết". Có câu kiểm tra ngẫu nhiên 1/5 từ để phát hiện tự khai sai. Ra số vocab ước lượng và seed level cho V1/V2.
2. **Listening (10 phút):** 1 mini-section Part 1 (10 câu) + 1 đoạn Part 3 (5 câu) từ L1 Exam pool.
3. **Reading (12 phút):** 1 passage cỡ Passage 2 với 8 câu (TFNG + headings + completion).
4. **Writing (tuỳ chọn, 15 phút):** 1 Task 2 rút gọn (≥ 150 từ). Tạo gói chấm, dán kết quả lúc nào cũng được. Chưa dán thì Writing để "–".
5. **Speaking (tuỳ chọn, 4 phút):** 3 câu Part 1 + 1 cue card nói 1 phút, cần micro. Metrics có ngay, band có sau khi dán kết quả Claude.

Kết quả placement được dùng để:
- seed `estimatedBand` (độ tin cậy "thấp")
- seed `skillLevels`
- hiện màn "Bản đồ 6.0 → 8.0" (§9)

Làm lại được mỗi 30 ngày.

## 9. Lộ trình 6.0 → 8.0
Hiện trong app dạng timeline. Nội dung chính xác nằm trong data `public/data/roadmap.json`.

**Thực tế:** từ 6.0 lên 8.0 thường mất **9–18 tháng** nếu học đều 60–90 phút mỗi ngày. App phải nói thật điều này ở onboarding. Không hứa "8.0 trong 3 tháng".

| Giai đoạn | Tuần | Trọng tâm | Mục tiêu đo được |
|---|---|---|---|
| G1 Nền | 1–8 | Daily Run (từ học thuật + collocation), L2 dictation, R1 training, S2 | +600 item Mature. L2 đạt level 5. TFNG đúng ≥ 75% |
| G2 Đúng format | 9–20 | L1 đủ 4 part, R1/R2 exam mode, W2 sprints, W1 mỗi tuần 2 bài | Listening và Reading đạt band 7.0–7.5 ở X1 |
| G3 Tăng tốc 7.5 | 21–36 | X1 mỗi tuần, W1 3 bài/tuần có vòng sửa, S1 mỗi tuần | L/R 8.0. W 7.0. S 7.0 |
| G4 Về đích 8.0 | 37+ | Đề thi thử hoàn chỉnh, sửa lỗi hệ thống, chủ đề Speaking theo đợt | L/R 8.5. W 7.5. S 7.5 trong 3 lần X1 liên tiếp |

## 10. Phản hồi: luật viết lời giải thích (cho cả data và prompt chấm)
- **Tiếng Việt, ngắn:** ≤ 2 câu mỗi lỗi. Thuật ngữ IELTS giữ tiếng Anh (paraphrase, collocation, overview…).
- **Luôn có bằng chứng:**
  - Reading: quote nguyên văn.
  - Listening: `[mm:ss]` kèm transcript.
  - Writing/Speaking: trích câu của chính người học.
- **Chỉ ra quy luật, không chỉ đáp án.** Ví dụ: "Bẫy *qualifier*: bài nói *some*, câu hỏi nói *most* → FALSE."
- **Một lỗi, một hành động sửa cụ thể.** Không viết chung chung kiểu "cần cải thiện từ vựng".
- **Khen cụ thể.** Khen có trích dẫn, tối đa 1 lời khen mỗi lượt feedback.
