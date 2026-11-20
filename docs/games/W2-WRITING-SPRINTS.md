# W2 · Writing Sprints: Overview Sprint (Task 1) và Idea Sprint (Task 2)

## 1. Mục đích
Hai kỹ năng nhỏ quyết định band lớn:
- **Overview Task 1.** Thiếu overview rõ ràng thì TA khó vượt 5–6. Overview tốt (nhóm xu hướng, so sánh tổng thể, không số liệu chi tiết) là cửa vào band 7+.
- **Lập ý Task 2.** Người Việt hay "nhồi từ mà không phát triển ý" (`01` §4.2). Idea Sprint luyện ra **quan điểm rõ + 2 ý chính liên quan + cách phát triển** trong 3 phút.

Viết cả bài thì tốn 40 phút. Sprint cho **nhiều lượt luyện ngắn** (P1, P2) vào đúng 2 điểm yếu này.

## 2. Vì sao hiệu quả
- **Luyện có chủ đích** (deliberate practice) một kỹ năng con, lặp nhiều, phản hồi ngay.
- **Tự đối chiếu với mẫu ngay sau mỗi lượt** (P1, P6): bản của mình đặt cạnh 2–3 overview mẫu, hoặc cạnh ideaBank, kèm checklist tự chấm.
  - Chạy hoàn toàn **trong app, không cần Claude, không tốn tiền**.
- **Tuỳ chọn** cuối phiên: **1 gói chấm gộp** cả phiên gửi Claude chat (`docs/grading/SPRINTS.md`) để có feedback sâu hơn.

## 3. Core loop
**Overview Sprint (6 biểu đồ mỗi phiên):**
```
Biểu đồ hiện (ChartRenderer) → 90s viết 1–2 câu overview
→ TỰ CHẤM: tick checklist ☐ xu hướng chung ☐ so sánh nổi bật ☐ không số liệu cụ thể ☐ khớp dữ liệu
   (app tự kiểm giúp: có chữ số trong câu → gợi ý bỏ tick "không số liệu")
→ So với overviewModels (2–3 mẫu, các cụm khoá được highlight) → tiếp
```
**Idea Sprint (4 đề mỗi phiên):**
```
Đề Task 2 hiện → 3 phút điền khung: [Quan điểm 1 câu] [Ý chính 1 + 1 câu phát triển] [Ý chính 2 + 1 câu phát triển] [Ví dụ cụ thể]
→ TỰ CHẤM: ☐ quan điểm rõ ☐ trả lời đủ phần (liệt kê partsToAddress) ☐ ý liên quan ☐ có phát triển ☐ ví dụ cụ thể
→ So với ideaBank (≥ 6 ý mẫu; ý gần nhất với ý của bạn được xếp lên đầu bằng so khớp từ khoá) → tiếp
```
**Cuối phiên (tuỳ chọn):** "📋 Copy gói chấm cả phiên" rồi dán kết quả Claude (`SprintResult`). App cập nhật sao từng lượt theo Claude, ghi đè phần tự chấm và đánh dấu "Claude".

## 4. Luật chơi
- **Đồng hồ:** Overview 90 giây, Idea 3 phút. Hết giờ thì tự nộp phần đã viết.
- **Sao tự chấm** = số mục checklist tick, quy về 0–3:
  - Overview: 4 mục → ≥ 4 = 3★, 3 = 2★, 2 = 1★.
  - Idea: 5 mục → 5 = 3★, 4 = 2★, 2–3 = 1★.
  - Tự chấm tối đa **3★**. Nếu checklist do app tự phát hiện mâu thuẫn (vd tick "không số liệu" mà câu có chữ số) thì hạ 1★ và báo.
- **XP:** 10 × sao. Dán kết quả Claude cuối phiên: +20.

## 5. Độ khó

| Level | Overview Sprint | Idea Sprint |
|---|---|---|
| 1–3 | bar, line, pie đơn giản | opinion, adv_disadv, chủ đề quen |
| 4–6 | table, mixed | problem_solution, positive_negative |
| 7–10 | process, map. 60 giây | discussion, two_part, chủ đề trừu tượng. 2,5 phút |

## 6. Wireframe
```
┌ ✕ Overview Sprint ───────────────────── 3/6 ───── ◷ 0:47 ──── ★★☆ +20 ┐
│  ┌──────── ChartRenderer (bar, đen trắng kiểu đề) ────────┐             │
│  │  ▇▇  ▇   ▇▇▇                                             │             │
│  └──────────────────────────────────────────────────────────┘             │
│  Overall, ____________________________________________________________   │
│                                                         [Nộp ↵]          │
│ ── sau nộp ──────────────────────────────────────────────────────────── │
│  Tự chấm: ☑ Xu hướng chung  ☐ So sánh nổi bật  ☑ Không số liệu  ☑ Khớp dữ liệu │
│  Mẫu band 8: "Overall, ... while ..."  (2 bản, bấm để xem bản khác)       │
└──────────────────────────────────────────────────────────────────────────┘
```

## 7. Feedback và câu thắng
- Mẫu có highlight các "cụm khoá" (vd *Overall*, *while*, *by far the*, *saw a steady rise*). Bấm vào cụm thì thêm vào ôn tập.
- **Câu thắng:** "Overview có xu hướng chung 6/6 lần". Hoặc "4/4 đề có quan điểm rõ ngay câu đầu".

## 8. SRS
- Overview mẫu **không** vào SRS (tránh học thuộc).
- Cụm khoá mà người học bấm, và `betterChunk` từ kết quả Claude, thành item `err:*`/cloze cho V1.

## 9. Data
- Dùng chung `writing/task1/*.json` (`overviewModels`, `keyFeatures`) và `writing/task2_prompts.json` (`ideaBank`, `partsToAddress`).
- **[INV-W2]** bảo đảm mỗi visual có ≥ 1 key feature dạng overall.
- Thêm field tuỳ chọn `overviewKeyPhrases: string[]` cho Task1Visual (cụm cần highlight).

## 10. UI, motion, sound riêng
- Đồng hồ là thanh ngang mảnh chạy hết chiều rộng, đổi màu ở 25% và 10%.
- Chấm sao: 3 sao hiện lần lượt (stagger 120 ms), SFX `correct` theo số sao (cao độ tăng dần).

## 11. Edge cases
- Bỏ trống ô: 0★, không cho tick checklist.
- Dán kết quả Claude không khớp số lượt (thiếu `ref`): chỉ cập nhật lượt có `ref`, báo số lượt thiếu.

## 12. Cổng nghiệm thu
- Unit test: quy đổi sao, phát hiện chữ số và mâu thuẫn checklist, xếp ideaBank theo độ gần, map `SprintResult` về lượt.
- E2E: 1 phiên Overview 6 lượt, 1 phiên Idea 4 lượt (tự chấm). 1 phiên có dán fixture `SprintResult`.
- Ảnh chụp 3 độ rộng: Overview đang viết (bar và map), Idea 4 ô, recap.

## 13. Không làm
- Không chấm band trong Sprint. Không tính vào band estimator. Không gọi API.
