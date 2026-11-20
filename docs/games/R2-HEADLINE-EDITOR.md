# R2 · Headline Editor: biên tập viên chọn tiêu đề (Matching Headings)

## 1. Mục đích
- Matching Headings thường xuất hiện 5–7 câu mỗi đề, hay ở passage đầu hoặc giữa.
- Dạng này đòi kỹ năng **đọc lướt tìm ý chính** (skimming) và **phân biệt ý chính với chi tiết**. Đây là kỹ năng người Việt ít được dạy: quen đọc kỹ từng câu nên hết giờ.
- R2 luyện đồng thời:
  - tốc độ đọc lướt
  - nhận diện câu chủ đề
  - loại 5 kiểu heading bẫy (`01` §3.2)

## 2. Vì sao hiệu quả
- **Hai bước tách bạch:**
  - (a) tự xác định ý chính bằng cách bôi `mainIdeaSpan`
  - (b) chọn heading

  Việc tách này buộc tư duy "ý chính trước, đáp án sau" thay vì dò từ khoá.
- **Đồng hồ đọc lướt giảm dần** theo level: luyện tốc độ có kiểm soát (P5).
- **Phản hồi theo loại distractor:** dạy vì sao heading hấp dẫn lại sai (P6).
- **Cơ chế chơi chính là học:** "toà soạn". Mỗi đoạn là một bài báo chờ lên trang, người học là biên tập viên đặt tít. Đặt đúng thì bài lên "trang nhất" (trang báo dựng dần).

## 3. Core loop
```
Danh sách heading (i–ix) ghim bên phải
→ Đoạn A hiện (các đoạn khác mờ) + đồng hồ đọc lướt
→ ① BÔI Ý CHÍNH (1 câu/cụm) – tuỳ level có thể bỏ qua
→ ② CHỌN TÍT (bấm heading hoặc phím số La Mã 1–9)
→ chấm → feedback (mainIdeaSpan + vì sao heading bạn chọn sai: distractorType)
→ đoạn tiếp … → trang báo hoàn chỉnh → Recap
Phiên = 1 passage (5–7 đoạn).
```

## 4. Luật chơi
- **Chấm:**

  | Heading | Ý chính | XP |
  |---|---|---|
  | Đúng | Bôi trùng `mainIdeaSpan` (IoU ≥ 0,3, hoặc cùng câu) | 15 |
  | Đúng | Bôi sai chỗ | 10 |
  | Sai | Bôi đúng ý chính | 3 + feedback "bạn hiểu đúng ý, nhưng heading … là `too_broad`" |
  | Sai | Bôi sai | 0 |

- **Mỗi heading chỉ dùng 1 lần** (như đề thật). Heading đã dùng thì mờ. Đổi lại được trước khi chấm cả bài nếu chọn chế độ "chấm cuối".
- **Hai kiểu chấm:**
  - **Từng đoạn** (mặc định ở training level ≤ 6): feedback ngay.
  - **Cuối bài** (level ≥ 7 và exam): giống đề thật, có thể sửa lựa chọn.
- **Đồng hồ đọc lướt:** mỗi đoạn có mục tiêu thời gian. Vượt mục tiêu không bị phạt, chỉ mất "thưởng tốc độ" (+5 XP nếu đạt).

## 5. Độ khó

| Level | Mục tiêu thời gian/đoạn | Bước ① | Số heading thừa | Distractor |
|---|---|---|---|---|
| 1–2 | 75 s | Bắt buộc | +2 | `detail_only`, `keyword_match` |
| 3–4 | 60 s | Bắt buộc | +2 | + `too_broad` |
| 5–6 | 45 s | Tuỳ chọn (+5 XP nếu làm) | +3 | + `adjacent_paragraph` |
| 7–8 | 35 s | Tuỳ chọn | +3 | Đủ 5 loại |
| 9–10 | 30 s | Tắt | +3 | Đủ 5 loại, P3 |

## 6. Wireframe
```
┌ ✕ Headline Editor · "Saving the world's seed banks" ─── Đoạn C (3/6) ── ◷ 0:32/0:45 ┐
│ ┌─── BẢN THẢO ────────────────────────────────┐ ┌─── KHO TÍT ─────────────────────┐ │
│ │ A ▒▒▒▒▒▒▒ (mờ, đã đặt tít: iv) ✓            │ │ i   Funding problems ahead       │ │
│ │ B ▒▒▒▒▒▒▒ (mờ, đã đặt tít: vii) ✓           │ │ ii  A global network emerges ←dùng│ │
│ │ C  Despite these advances, the vaults face  │ │ iii Why diversity matters        │ │
│ │    an uncertain financial future. Most ...  │ │ iv  Origins of an idea      (đã) │ │
│ │    (đoạn đang làm, chữ rõ, nền sáng hơn)     │ │ v   ...                          │ │
│ │ D ░░░░ (ẩn tới khi tới lượt)                 │ │                                  │ │
│ └──────────────────────────────────────────────┘ └──────────────────────────────────┘ │
│  ① Bôi ý chính  ✓        ② Chọn tít: [ i ]                       [Đặt tít ↵]         │
└───────────────────────────────────────────────────────────────────────────────────────┘
```
- **Trang báo:** sau khi chấm, heading đúng "in" lên đầu đoạn bằng font serif đậm, kiểu tít báo.
- **Recap** hiện toàn bộ bài dưới dạng một trang báo có đủ tít.

## 7. Feedback
- **Đúng:** mainIdeaSpan bôi vàng + "Ý chính: … → tít *ii*".
- **Sai:**
  - "Bạn chọn *v*: **detail_only**. Tít này chỉ nói về ví dụ ở câu 3, không phải ý cả đoạn" (lấy từ `headingDistractors.whyVi`).
  - Nếu heading người học chọn không có trong `headingDistractors` thì dùng câu chung theo loại suy ra (đúng với đoạn khác thì là `adjacent_paragraph`).
- **Câu thắng:** "6/6 tít đúng, thời gian trung bình 38 giây/đoạn (mục tiêu 45 giây)". Hoặc "Bạn không còn sập *keyword_match* (0/6)".

## 8. SRS
- Sai thì tạo item `head:<qid>` (face `head_retry`): V1 hiện **đoạn văn** + 4 heading (đúng + 3 distractor của nó), chọn 1. Ôn tối đa 3 lần rồi retire.
- Không tạo item từ passage reserved.

## 9. Data
- Dùng chung `reading/passages/*.json`. Passage nào có nhóm `headings` thì R2 dùng được.
- Cần mỗi câu headings có `mainIdeaSpan` + ≥ 2 `headingDistractors` ([INV-R5]).
- Số lượng: ≥ 40% passage training có nhóm headings (MVP ≥ 8 passage, đầy đủ ≥ 25).

## 10. UI, motion, sound riêng
- **Đoạn đang làm:** nền `--color-surface-2`, viền trái màu reading. Các đoạn khác mờ 40%. Chuyển đoạn bằng cách cuộn mượt + fade.
- **Đặt tít:** heading bay từ kho sang đầu đoạn (shared layout animation), SFX `page`.
- **Sai:** heading bay về kho và rung nhẹ.

## 11. Edge cases
- Passage có câu ví dụ "Example: Paragraph A → iv" như đề thật: đánh dấu đoạn ví dụ đã điền sẵn, heading đó loại khỏi kho.
- Màn hình hẹp: kho tít thành bottom sheet kéo lên được. Phím số vẫn chọn được.
- Heading La Mã: phím 1–9 tương ứng i–ix, phím 0 là x.

## 12. Cổng nghiệm thu
- Unit test: chấm 4 nhánh, khoá heading đã dùng, chấm cuối bài có sửa lựa chọn.
- Data: [INV-R5] pass + blind-solve 100% cho nhóm headings.
- E2E: 1 passage 6 đoạn ở level 3 (chấm từng đoạn) và level 8 (chấm cuối).
- Ảnh chụp 3 độ rộng: đang làm, feedback sai, trang báo recap.

## 13. Không làm
- Không có kéo thả bắt buộc. Kéo thả chỉ là tuỳ chọn, bấm và phím tắt là chính.
