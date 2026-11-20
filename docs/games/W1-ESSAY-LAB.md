# W1 · Essay Lab: viết → Claude chấm (copy/dán) → sửa → chấm lại

> Chấm bằng **Claude chat theo cách copy và dán, không API, không tốn tiền**. Xem `docs/07-GRADING-WITH-CLAUDE.md` và `docs/grading/WRITING.md`.

## 1. Mục đích
- Writing là kỹ năng người Việt khó lên nhất. Mục tiêu tối thiểu là **7.0–7.5** (`01` §1).
- Không có giáo viên thì cần một **vòng phản hồi nhanh, cụ thể, có trích dẫn**, và quan trọng nhất là **bắt viết lại** (revision). Đây là chỗ học thực sự xảy ra.
- W1 phục vụ đủ 4 tiêu chí TR/TA, CC, LR, GRA cho Task 1 và Task 2.

## 2. Vì sao hiệu quả
- **Sản xuất trọn vẹn** dưới điều kiện thi (P3, P7): bấm giờ, đếm từ, tắt spellcheck.
- **Phản hồi chỉ ra đúng câu** của người học (P6), có **3 ưu tiên** (không ngập trong 20 lỗi).
- **Vòng sửa có Δ band:** người học thấy ngay hiệu quả khi sửa. Đây là phần thưởng nội tại mạnh nhất.
- **Portfolio:** so sánh bài cũ và mới cùng dạng. Đây là bằng chứng tiến bộ cụ thể.
- **Lỗi hệ thống chảy vào SRS** (`err:*`) nên cùng một lỗi không lặp lại mãi.

## 3. Core loop
```
CHỌN ĐỀ (Task 1 / Task 2; dạng; chủ đề; hoặc "đề gợi ý hôm nay")
→ (tuỳ chọn) PLAN 3–5' với khung dàn ý (Task 2: position + 2 ideas + support; Task 1: overview + 2–3 nhóm số liệu)
→ VIẾT (bấm giờ 20'/40', đếm từ, autosave)
→ NỘP → [Tự chấm nhanh: checklist + bài mẫu band 8 mở khoá]
→ 📋 COPY GÓI CHẤM → (Bang dán vào Claude, copy câu trả lời) → 📥 DÁN KẾT QUẢ → BÁO CÁO
→ SỬA: 3 ưu tiên → người học sửa ngay trong editor (đoạn bị trích nổi vàng)
→ 📋 GÓI CHẤM LẠI (kèm issue cũ) → 📥 DÁN → Δ band → so sánh với bài mẫu
→ Lưu portfolio + SRS
```

## 4. Luật chơi
### 4.1 Chế độ

| Chế độ | Thời gian | Hỗ trợ |
|---|---|---|
| **Exam** | Task 1: 20 phút, Task 2: 40 phút, hoặc full 60 phút cả 2 task | Không có khung dàn ý, không gợi ý. Hết giờ tự nộp. Tính band |
| **Training** | Đồng hồ chạy lên, có mục tiêu | Có khung dàn ý. Có "ngân hàng ý" (ideaBank) mở được với −1 sao. Có collocation gợi ý theo chủ đề (từ `usefulCollocationIds`, chỉ hiện các cụm đã học ở V2) |

### 4.2 Luật chấm
- Gói chấm, dán kết quả, hậu kiểm theo `07` §3–5.
- Code tính band task và band tổng. Phạt thiếu từ theo luật cứng.
- **Trạng thái bài:**
  - `draft`: đang viết
  - `awaiting_grade`: đã nộp, chưa dán kết quả
  - `graded`: đã có kết quả
  - `revised_n`: đã sửa lần n

  Trang Hôm nay nhắc các bài đang ở `awaiting_grade`.
- **Tự chấm nhanh (luôn có, không cần Claude):**
  - Task 2: checklist 6 mục:
    - quan điểm rõ ở mở bài
    - trả lời đủ các phần (`partsToAddress`)
    - mỗi thân bài 1 ý chính được giải thích, có ví dụ
    - có kết luận
    - ≥ 250 từ
    - không dùng cụm sáo rỗng (app tự dò danh sách cụm cấm)
  - Task 1: checklist dựa trên `keyFeatures`.
  - Bấm vào từng mục thì hiện đoạn tương ứng trong bài mẫu.
- **Vòng sửa:**
  - Tối đa 3 lần mỗi bài.
  - Gói chấm lại gửi: bài mới + danh sách issue cũ.
  - Claude ghi `revision.resolvedIssueQuotes`.
  - UI hiện Δ theo từng tiêu chí.

### 4.3 XP
- Nộp bài đầy đủ: 60.
- Tự chấm checklist: +10.
- Dán kết quả Claude: +20.
- Mỗi lần sửa có ≥ 1 tiêu chí tăng: +30.
- Exam mode đủ thời gian và đủ từ: +40.

## 5. Độ khó và gợi ý đề
- `skillLevels.w1` (1–10) quyết định đề gợi ý:
  - level thấp: chủ đề quen (education, technology, health), dạng opinion hoặc adv_disadv
  - level cao: chủ đề trừu tượng (globalisation, arts, government), dạng discussion, two_part
- **Đề gợi ý hôm nay** xoay theo: dạng đề lâu chưa viết → chủ đề có ít collocation đã học → tiêu chí yếu nhất.

## 6. Flow màn hình và wireframe
**Viết:**
```
┌ ✕ Essay Lab · Task 2 · Exam ─────────────────────── ◷ 31:12 ──── 186 từ ─────┐
│ ┌── ĐỀ ─────────────────────────────────────────────────────────────────────┐ │
│ │ Some people believe that unpaid community service should be a compulsory  │ │
│ │ part of high school programmes. To what extent do you agree or disagree?  │ │
│ │ Write at least 250 words.                                                 │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│ ┌── BÀI LÀM (EssayEditor, spellcheck off, font UI 17px, rộng 72ch) ─────────┐ │
│ │ It is often argued that ...                                               │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│  Đã lưu nháp 12:04:33                                  [Nộp bài]              │
└───────────────────────────────────────────────────────────────────────────────┘
```
**Chờ chấm (ngay sau khi nộp):**
```
┌ Đã nộp · Task 2 · 268 từ · 38 phút ─────────────────────────────────────────────┐
│ ① Tự chấm nhanh   ☑ Quan điểm rõ  ☑ Đủ các phần  ☐ Ví dụ cụ thể ở thân bài 2 ...   │
│ ② Nhờ Claude chấm chi tiết                                                         │
│    [📋 Copy gói chấm]  [⬇ Tải .md]  [↗ Mở Claude]                                   │
│    Dán toàn bộ câu trả lời của Claude vào đây:                                     │
│    ┌──────────────────────────────────────────────────────────────────────────┐  │
│    │                                                                          │  │
│    └──────────────────────────────────────────────────────────────────────────┘  │
│                                                       [📥 Đọc kết quả]            │
│ [Xem bài mẫu band 8]                              [Để sau – lưu vào Portfolio]    │
└───────────────────────────────────────────────────────────────────────────────────┘
```
**Báo cáo (sau khi dán kết quả):**
```
┌ Kết quả · Task 2 ──────────────────────────────── Band ước tính 6.5 (độ tin cậy: vừa) ┐
│ TR 6.5   CC 6.5   LR 6.0   GRA 6.5        [Xem rubric]                              │
│ ┌ 3 ƯU TIÊN ─────────────────────────────────────────────────────────────────────┐  │
│ │ ① LR · Sửa collocation kiểu Việt: "make a crime" → "commit a crime" (2 chỗ)      │  │
│ │ ② TR · Thân bài 2 chưa có ví dụ cụ thể – thêm 1 ví dụ + hệ quả                   │  │
│ │ ③ GRA · Mạo từ: "the society" → "society" (danh từ chung, nghĩa khái quát)       │  │
│ └──────────────────────────────────────────────────────────────────────────────────┘  │
│ BÀI CỦA BẠN (các quote được tô vàng; bấm vào → hiện issue + fix)                      │
│ NÂNG CẤP CÂU (upgrades): "original" → "band-8 version" [+ Thêm vào ôn tập]            │
│                         [✍ Sửa bài (lần 1/3)]   [Xem bài mẫu band 8]  [Lưu & thoát]   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Rubric chi tiết:** 4 thẻ `RubricCard`. Mỗi thẻ có band, `summaryVi`, strengths (quote xanh), issues (quote đỏ hoặc vàng theo severity, fix, errorTag).
- **Bài mẫu band 8:** hiện song song với bài người học. Có `notes` (chú thích bên lề theo tiêu chí). **Chỉ mở sau khi đã nộp** (lần 1).
- **Task 1:** bên trái là `ChartRenderer` vẽ biểu đồ, bên phải là editor. Báo cáo có thêm checklist "Key features đã nêu: ✓ overall trend, ✗ lowest value 2010…" (từ `task1.keyFeaturesCovered` so với `keyFeatures`).

## 7. Feedback và câu thắng
- Nguyên tắc `02` §10. Không hiện quá 6 issue mỗi tiêu chí. Mặc định thu gọn, chỉ mở 3 ưu tiên.
- **Câu thắng:**
  - "Sau sửa: LR 6.0 → 6.5, GRA 6.5 → 7.0".
  - Hoặc "Bài thứ 3 dạng *discussion*: TR tăng từ 6.0 lên 7.0 so với bài đầu".

## 8. SRS
- `srsItems` từ kết quả Claude (đã lọc quote) thành item:
  - `collocation` → `col:user_<hash>` với `provenance.createdBy:'llm'`, `source:'essay_feedback'`, face `col_gap`
  - `error` → `err:user_<hash>` (face `err_fix`)
- Chỉ tạo khi người học bấm **"+ Thêm vào ôn tập"**, hoặc bật "tự thêm" trong cài đặt (mặc định **bật** cho error, **tắt** cho vocab).
- `errorTag` tần suất cao (≥ 3 lần trong 3 bài gần nhất) thì đề xuất phiên V1 lọc theo tag đó trên trang Hôm nay.

## 9. Data
- `writing/task2_prompts.json`, `writing/task1/*.json` (`04` §6). MVP 60 + 24, đầy đủ 150 + 60.
- `ChartRenderer` phải vẽ được 100% `Task1Visual` (gồm cả process và map). Cổng ảnh chụp mỗi kind.
- Chấm: `07` + `docs/grading/WRITING.md` (import `?raw`). Danh sách cụm sáo rỗng cho checklist nằm ở `public/data/writing/cliches.json` (≥ 40 cụm).

## 10. UI, motion, sound riêng
- **Trong lúc viết:** không có animation, không SFX (trừ `timeup`). Đồng hồ chỉ đổi màu.
- **Copy gói chấm:** nút đổi thành "✓ Đã copy" trong 2 giây. Ô dán tự focus khi quay lại tab (sự kiện `visibilitychange`).
- **Δ band:** số cũ trượt sang số mới, mũi tên xanh nếu tăng. Confetti nhẹ nếu tổng tăng ≥ 0,5 (đây là mốc).

## 11. Edge cases
- Bài < 50 từ: không tạo gói chấm. Báo "Bài quá ngắn để chấm".
- Dán kết quả sai định dạng hoặc của bài khác: theo `07` §4 bước 3 và 5.
- Clipboard bị chặn (trình duyệt từ chối): hiện gói chấm trong ô văn bản đã bôi sẵn để Bang tự Ctrl+C.
- Bài lạc đề (`relevance: off_topic`): hiện cảnh báo đỏ ở đầu báo cáo, TR tối đa 5.
- Người học dán văn bản (paste) > 100 ký tự liền: hiện cảnh báo nhẹ "Bài dán vào sẽ không phản ánh đúng khả năng", ghi cờ `pasted:true` vào attempt, **không tính band**.

## 12. Cổng nghiệm thu
- Unit test:
  - đếm từ (theo kiểu IELTS: từ có gạch nối tính 1, số tính 1)
  - hậu kiểm quote
  - tính band task và tổng
  - phạt thiếu từ
  - phát hiện paste
- Unit test `grading/packet.ts` (đủ thành phần, có attemptId) và `grading/parse.ts`: ≥ 15 case, gồm JSON đúng, JSON có chữ thừa trước và sau, thiếu trường, sai attemptId, quote không khớp, nhiều khối json (lấy khối cuối).
- Fixture: 3 câu trả lời Claude thật (Task 1, Task 2, chấm lại), lưu ở `src/test/fixtures/grading/`. Lấy bằng cách chấm thử 3 bài mẫu qua Claude chat.
- E2E (dán fixture):
  - viết, nộp, tự chấm, copy gói, dán kết quả, báo cáo, sửa, gói chấm lại, dán, Δ, xem bài mẫu, portfolio
  - Task 1 với 7 kind biểu đồ
- Ảnh chụp 3 độ rộng: viết (Task 1 và Task 2), báo cáo, rubric mở, model song song.

## 13. Không làm
- Không gọi API AI nào từ app. Không có nút "viết lại toàn bài". Không gợi ý câu tự động trong lúc viết (autocomplete).
- Không chấm General Training Task 1 (thư).
