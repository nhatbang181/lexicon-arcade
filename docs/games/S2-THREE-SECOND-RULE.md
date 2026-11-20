# S2 · 3-Second Rule: phản xạ nói không dịch

## 1. Mục đích
- Bỏ thói quen **dịch trong đầu**. Đây là nguyên nhân số 1 khiến người Việt nói chậm và ngập ngừng tìm từ (FC ≤ 6.5).
- Rèn **khung trả lời Part 1/Part 3 tự động**: **A**nswer → **R**eason → **E**xample/Detail (ARE). Câu trả lời đủ dài (15–30 giây) và mạch lạc, không cụt kiểu "Yes, I do."
- Phiên ngắn 5–7 phút, làm được mỗi ngày.

## 2. Vì sao hiệu quả
- **Áp lực thời gian khởi động 3 giây** buộc phải dùng chunk tiếng Anh có sẵn thay vì dịch. Lặp nhiều thì các chunk đó tự động hoá.
- **Khung ARE** là một cách làm giảm tải nhận thức: không phải nghĩ cấu trúc, chỉ nghĩ nội dung.
- **Shadowing câu mẫu** ngay sau lượt nói: nghe mẫu band 8 cùng câu hỏi rồi nhại lại một lần. Học chunk, ngữ điệu, nối âm (P1 + bắt chước).
- **Cơ chế chơi chính là học:** chuỗi "tia chớp". Mỗi câu bắt đầu kịp trong 3 giây là một tia, chuỗi tia là combo. Thao tác chính là **mở miệng nói tiếng Anh**.

## 3. Core loop
```
Câu hỏi (audio examiner + chữ hiện 1s sau) → đếm ngược 3 → 2 → 1 (vòng tròn)
→ VAD phát hiện bắt đầu nói? (≤ 3s: ⚡ đạt; > 3s: "chậm", vẫn tiếp tục)
→ nói 15–30s (thanh ARE gợi ý: A ● R ○ E ○ – người học tự nhấn phím 1/2/3 khi chuyển ý, tuỳ chọn)
→ dừng (im 2s hoặc Space) → mini-feedback (latency, thời lượng, số từ)
→ ▶ nghe mẫu ARE (band 8) → 🎤 shadow 1 lần (không chấm) → câu tiếp
Phiên = 8 câu (6 Part 1 + 2 Part 3). Sau mỗi câu: tự tick ARE. Cuối phiên (tuỳ chọn): gói chấm gộp gửi Claude chat.
```

## 4. Luật chơi
- **Đạt "tia chớp" ⚡** khi start latency ≤ 3,0 giây **và** thời lượng nói ≥ 12 giây. Combo = số ⚡ liên tiếp.
- **XP:** ⚡ = 12, chậm nhưng đủ dài = 6, < 8 giây = 2. Shadow xong +3.
- **Tự chấm sau mỗi câu:**
  - Người học tick ARE (☐A ☐R ☐E) trong khi nghe lại bản ghi của mình (nút ▶, 1 lần).
  - App hiện transcript ASR để đối chiếu.
  - Tự chấm mỗi mục tick được +2 XP.
- **Gói chấm gộp cuối phiên (tuỳ chọn, 0 đồng):** gồm 8 transcript gửi Claude chat theo `docs/grading/SPRINTS.md` (kind `s2`). Dán `SprintResult` để nhận ARE ✓/✗ khách quan + `betterChunk`.

## 5. Độ khó

| Level | Thời gian khởi động | Thời lượng mục tiêu | Câu hỏi |
|---|---|---|---|
| 1–3 | 4 s | ≥ 10 s | Part 1 quen thuộc (home, work/study, hobbies) |
| 4–6 | 3 s | ≥ 15 s | Part 1 đợt hiện tại |
| 7–8 | 3 s | ≥ 20 s | + 2–3 câu Part 3 |
| 9–10 | 2 s | ≥ 25 s | Part 3 trừu tượng, có `hypothetical` |

## 6. Wireframe
```
┌ ✕ 3-Second Rule ───────────────────────────── 4/8 ──── ⚡⚡⚡ x3 ── +48 ┐
│                                                                      │
│      "Do you prefer studying in the morning or at night?"            │
│                                                                      │
│                          ╭─────╮                                     │
│                          │  2  │   ← vòng đếm ngược (màu speaking)    │
│                          ╰─────╯                                     │
│                 A ●────── R ○────── E ○        (nhấn 1/2/3)           │
│                                                     [Xong · Space]  │
│ ── sau lượt ──────────────────────────────────────────────────────── │
│  ⚡ Bắt đầu sau 1.8s · nói 21s · 54 từ                                │
│  Mẫu: "I'm definitely a morning person, mainly because…" [▶ nghe] [🎤 nhại lại] │
└──────────────────────────────────────────────────────────────────────┘
```

## 7. Feedback và câu thắng
- Mini-feedback sau mỗi lượt: chỉ có 3 số + mẫu. Không có lời phê dài.
- Cuối phiên: bảng 8 câu với ARE tự tick. Sau khi dán kết quả Claude thì có thêm ARE khách quan, 1–2 `betterChunk` đáng học, `tipVi`.
- **Câu thắng:**
  - "Start latency trung vị 1,6 giây (tuần trước 3,4 giây)".
  - Hoặc "8/8 tia chớp".

## 8. SRS
- `betterChunk` thành item `phrase:*` (face cloze ở V1), sau khi người học bấm "+ Thêm".
- `SpeakingPhrase` (data) được dùng làm chunk gợi ý ở màn intro phiên (2 phrase mỗi phiên, xoay vòng). Mỗi phrase có thẻ V1 riêng: nghe rồi điền.

## 9. Data
- `speaking/part1.json`: cần `areSample` cho ≥ 80% câu. Có audio mẫu (render từ `areSample` ghép lại, giọng `bf_emma` hoặc `bm_george`).
- `speaking/part3.json` (dùng ở level ≥ 7): cần `areSample` hoặc sinh bổ sung field tương tự.
- `speaking/phrases.json`.

## 10. UI, motion, sound riêng
- **Vòng đếm ngược:** số to, vòng giảm dần. Khi phát hiện tiếng nói thì vòng nổ thành tia ⚡ (SVG, 0,3 s). Hiệu ứng này **chạy sau khi lượt kết thúc**, không chạy trong lúc đang nói.
- Không SFX trong lúc ghi âm. SFX `correct` khi hiện kết quả ⚡.

## 11. Edge cases
- VAD bắt nhầm tiếng "ừm" hay tiếng thở là bắt đầu nói: yêu cầu ≥ 300 ms năng lượng liên tục mới tính.
- Người học nói tiếng Việt: ASR `en-GB` trả transcript rác hoặc rỗng. Nếu tỷ lệ từ nhận ra < 30% thì hiện "Hình như bạn chưa nói tiếng Anh?" và không tính ⚡.
- Không mic hoặc ASR: giống S1 §11.

## 12. Cổng nghiệm thu
- Unit test: logic ⚡ (latency, thời lượng), combo, tự chấm ARE, map `SprintResult` về câu.
- E2E fake media: phiên 8 câu, có 1 câu bắt đầu muộn (wav có 4 giây im lặng đầu) và kiểm không được ⚡.
- Ảnh chụp 3 độ rộng: đếm ngược, sau lượt, recap.

## 13. Không làm
- Không có chấm band cho S2 và không tính vào band estimator.
