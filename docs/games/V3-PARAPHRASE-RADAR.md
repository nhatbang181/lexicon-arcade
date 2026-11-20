# V3 · Paraphrase Radar: dò paraphrase trong văn bản

## 1. Mục đích
- Gần như **mọi câu** Reading và Listening đều dùng paraphrase: câu hỏi nói khác với bài hoặc audio.
- Người ở band 6 thường đi tìm **từ giống hệt** (keyword matching) nên sập bẫy `keyword_echo`.
- V3 là **cầu nối** giữa từ vựng với R1, R2, L1. Nó luyện phản xạ: thấy cụm A thì tìm **ý tương đương** trong đoạn văn, bỏ qua **từ trùng**.

## 2. Vì sao hiệu quả
- Luyện đúng thao tác của bài thi (P7): **định vị thông tin bằng nghĩa**.
- Áp lực thời gian vừa phải: tăng tốc độ quét mà vẫn tự gợi nhớ.
- Có decoy (cụm chứa từ khoá giống) nên dạy luôn cách tránh `keyword_echo`.
- **Cơ chế chơi chính là học:** radar quét đoạn văn, người học "khoá mục tiêu" bằng cách bôi hoặc bấm vào cụm. Không có gì khác.

## 3. Core loop
```
Hiện questionPhrase (to, trên cùng) → đoạn context (40–120 từ) hiện ra → đồng hồ radar chạy
→ người học bấm/bôi cụm tương đương trong đoạn (hoặc bấm "KHÔNG CÓ" nếu level 4 not_equivalent)
→ chấm: trùng target (IoU ≥ 0.5) = đúng; trúng decoy = sai + giải thích decoy → tiếp
Phiên = 12 lượt, trộn level theo độ khó người học.
```

## 4. Luật chơi
- **Thời gian mỗi lượt** theo level (§5). Hết giờ tính là sai, hiện đáp án.
- **Cách chọn:**
  - Bấm vào 1 từ thì tự mở rộng ra cụm (chunk) có sẵn từ tokenizer.
  - Kéo bôi để chọn chính xác.
  - Bấm lại để bỏ chọn.
  - Enter để khoá.
- **Chấm:**
  - Span người chọn giao với target có IoU ≥ 0,5 thì đúng.
  - IoU 0,2–0,5 thì gần đúng (Hard, ½ XP).
  - Trúng decoy thì sai, hiện `whyVi` của decoy.
- **Level 4** (`relation: not_equivalent`): đáp án đúng là bấm **"KHÔNG CÓ TRONG ĐOẠN"** (phím N). Đây là tiền đề cho NOT GIVEN ở R1.
- **XP:** 10 × hệ số tốc độ. Hệ số = 1,5 nếu dùng < 40% thời gian, 1,2 nếu < 70%, còn lại 1. Combo như chuẩn.

## 5. Độ khó

| Level | Trộn level item (L1:L2:L3:L4) | Thời gian/lượt | Context |
|---|---|---|---|
| 1–2 | 7:3:0:0 | 25 s | 40–60 từ |
| 3–4 | 4:4:2:0 | 22 s | 50–80 từ |
| 5–6 | 2:3:4:1 | 20 s | 60–100 từ |
| 7–8 | 1:3:4:2 | 17 s | 80–120 từ |
| 9–10 | 1:2:4:3 | 14 s | 100–120 từ, decoy 3 |

## 6. Wireframe
```
┌ ✕ Paraphrase Radar ─────────────── 6/12 ───── ◷ 14s ─── 🔥x2 +96 ┐
│  TÌM Ý TƯƠNG ĐƯƠNG:  « a significant drop in birth rates »       │
│  ───────────────────────────────────────────────────────────────  │
│  Across much of Europe, ▒fertility has declined markedly▒ since    │
│  the 1970s. Although rates of marriage remain fairly stable, the   │
│  number of births per woman ...  (đoạn văn font serif 18px)        │
│                                                                  │
│            [KHÔNG CÓ TRONG ĐOẠN  N]          [Khoá ↵]             │
└──────────────────────────────────────────────────────────────────┘
```
- **Hiệu ứng radar:** một vạch quét mờ (opacity 0,08) chạy từ trên xuống mỗi 2,5 s **ở lề trái**, không đè lên chữ. Đồng hồ là vòng tròn đếm ngược ở góc.
- Sau khi chấm: target viền xanh, decoy viền cam nét đứt có số ①②, kèm chú thích ngắn bên dưới.

## 7. Feedback
- **Đúng:** "✓ *a significant drop* ↔ *declined markedly* (L2: đổi dạng từ: drop n. → decline v.)".
- **Sai (trúng decoy):** "✗ *birth rates* lặp đúng từ khoá nhưng nói về… → bẫy keyword_echo" + chỉ target đúng.
- **Câu thắng:** "Bạn né được N/M decoy keyword_echo. Thời gian trung bình X s (lần trước Y s)."

## 8. SRS
- Mỗi item hoàn thành thì cập nhật card `para:*#para_match` (V1 sẽ ôn lại dạng chọn 4).
- Chọn nhầm decoy 2 lần với cùng loại thì ghi tag thống kê `keyword_echo` cho Thống kê (`09` §8).

## 9. Data
- `vocab/paraphrases.json` (`04` §3). MVP 300, đầy đủ 800, tỷ lệ level 3:3:3:1.
- Đoạn `context` có thể tái dùng đoạn văn từ passage R1 hoặc từ 12 bài đọc cũ (`05` §3), nhưng **không** lấy từ passage `reserved`.

## 10. UI, motion, sound riêng
- Khi khoá đúng: viền target "khoá mục tiêu" (4 góc ngoặc vuông thu lại quanh cụm, 0,25 s), SFX `correct`.
- Trúng decoy: góc ngoặc bật ra rồi rơi, SFX `wrong`.
- Không có hiệu ứng nhấp nháy trên chữ.

## 11. Edge cases
- Target là cụm không liền nhau: dữ liệu V3 **cấm** loại này. Validator kiểm `target` là 1 span liền.
- Người học bôi quá rộng (cả câu) thì IoU thấp, coi là gần đúng hoặc sai. Feedback nhắc "Chọn đúng cụm, không chọn cả câu".
- Trên cảm ứng: chạm giữ để bôi, chạm nhanh để chọn chunk.

## 12. Cổng nghiệm thu
- Unit test: tokenizer chunking, IoU, chấm not_equivalent, hệ số tốc độ.
- Data: [INV-P1..P3] pass, blind-solve (`05` §5) **cũng áp dụng cho V3**: model kiểm phải tìm đúng target ≥ 98%.
- E2E: 1 phiên 12 lượt, có 1 lượt N (không có).
- Ảnh chụp 3 độ rộng: đang chơi, sau chấm (có decoy), recap.

## 13. Không làm
- Không có dạng chọn 4 đáp án trong V3. Dạng đó đã nằm ở V1 `para_match`.
