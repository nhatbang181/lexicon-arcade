# V2 · Collocation Forge: rèn collocation học thuật

## 1. Mục đích
- **Lexical Resource** ở band 7 yêu cầu dùng từ "có ý thức về văn phong và collocation". Ở band 8 phải "khéo léo, hiếm khi sai collocation" (`01` §4.1).
- Lỗi collocation **dịch từ tiếng Việt** là lỗi hệ thống của người Việt:
  - make a crime
  - learn knowledge
  - big effect
  - increase awareness of
- Game luyện 2 năng lực:
  - (a) **Tự gọi ra** từ đi kèm đúng.
  - (b) **Nhận ra collocation "kiểu Việt"** để không viết chúng.

## 2. Vì sao hiệu quả
- **P3:** người học phải gõ ra, không chỉ chọn.
- **P1:** mỗi lần nhập là một lần gợi nhớ.
- **Học qua đối lập:** đặt collocation đúng cạnh lỗi L1 giúp phân biệt rõ hơn.
- **P4:** cơ chế "rèn" (nung, đập, tôi) là ẩn dụ, nhưng **mỗi nhát đập là một câu trả lời**. Không có thao tác nào khác.

## 3. Core loop
Một phiên = **1 "lò rèn" quanh 1 headword trung tâm** (vd *impact*), gồm 6–10 collocation, đi qua 3 giai đoạn:
```
[1 NUNG – Nhận diện]  Xem headword + 3 collocation mẫu trong câu (8 giây/thẻ, có 🔊) → chọn câu dùng đúng nghĩa (2 câu)
[2 ĐẬP – Sản xuất]    Điền phần thiếu: "___ a profound impact on" (gõ) × 6–8
[3 TÔI – Bẫy L1]      4 cụm, 1–2 cụm sai kiểu Việt → bấm chọn cụm SAI + gõ bản sửa
→ Thành phẩm: "Vũ khí" = thẻ collocation đã rèn (vào SRS) → Recap
```
- **Chế độ Sprint (60 giây):** collocation ngẫu nhiên từ các headword đã rèn, gõ liên tục, tính combo. Dùng để ôn nhanh, không mở item mới.

## 4. Luật chơi
- **Giai đoạn 2:**
  - Mỗi câu có 1 lần gõ và 1 gợi ý (lộ chữ đầu).
  - Đáp án nằm trong `answers[]` thì đúng. `primary` là đáp án "đẹp nhất". Nếu người học gõ một đáp án đúng khác thì hiện "Đúng. Cũng có thể dùng: *exert*".
  - Gõ ra cụm nằm trong `l1Traps.wrong` thì báo lỗi đặc biệt: "Đây là collocation kiểu Việt" kèm `whyVi`.
- **Giai đoạn 3:** chọn đúng cụm sai được 1 điểm, gõ bản sửa đúng được thêm 1 điểm.
- **XP:**

  | Kết quả | XP |
  |---|---|
  | Đúng ở giai đoạn 2 | 12 |
  | Đúng ở giai đoạn 3 | 10 + 8 |
  | Hoàn thành lò | +40 |

- **Sprint:** 60 giây. Mỗi câu đúng +10 × combo. Kỷ lục cá nhân lưu trong `kv`.
- **Chọn headword cho lò:**
  - Mặc định: headword thuộc topic của **đề Task 2 gần nhất** Bang làm, hoặc topic tuần.
  - Ưu tiên headword có nhiều collocation chưa học.
  - Bang có thể chọn thủ công trong sheet.

## 5. Độ khó (level 1–10)

| Level | Thay đổi |
|---|---|
| 1–3 | `bandTarget` 7. Gợi ý: hiện số chữ cái. Giai đoạn 3 có 1 cụm sai |
| 4–6 | Thêm `bandTarget` 8. Không hiện số chữ cái. Giai đoạn 3 có 1–2 cụm sai |
| 7–10 | `bandTarget` 8–9. Gap đặt ở vị trí khó (giới từ, tính từ). Có 1 câu "tự viết" dùng 2 collocation vừa rèn. Tự so với `example` + checklist (đúng cụm? đúng giới từ? đúng nghĩa?). Câu tự viết được lưu vào Portfolio để có thể gửi Claude chấm cùng bài W1 |

## 6. Wireframe
```
┌ ✕ Collocation Forge · IMPACT ───────── Giai đoạn 2/3: ĐẬP ──── 4/8 ── 🔥x3 ┐
│                         ╔══════════╗                                       │
│                         ║  IMPACT  ║   n. /ˈɪmpækt/  🔊                    │
│                         ╚══════════╝                                       │
│   Urban sprawl can  [________]  a profound impact on local wildlife.       │
│                       ▲ gõ ở đây                    "có ảnh hưởng sâu sắc tới" │
│                                                 [Gợi ý H]   [Nộp ↵]        │
│   Đã rèn:  ▣ mitigate the impact  ▣ a detrimental impact  ▢ ▢ ▢ ▢          │
└────────────────────────────────────────────────────────────────────────────┘
```
- Headword đặt trên "đe" ở giữa. Mỗi collocation rèn xong thì bay vào kệ "Đã rèn" phía dưới.
- **Giai đoạn 3:** 4 thẻ cụm từ xếp lưới 2×2. Bấm vào cụm sai thì lật ra ô gõ bản sửa.

## 7. Feedback
- **Đúng:** hiện cả cụm hoàn chỉnh trong câu, phát 🔊 cả câu (audio collocation dùng chung pipeline vocab, render câu `example`).
- **Sai:** đáp án đúng + `meaningVi` + **1 câu ví dụ khác**.
- **Lỗi L1:** khung riêng màu đỏ thẫm, ghi "Collocation kiểu Việt" + `whyVi` + so sánh: ~~make a crime~~ → **commit a crime**.
- **Câu thắng:** "Rèn xong N collocation quanh *impact*. Bạn tránh được 3/3 bẫy kiểu Việt."

## 8. SRS
- Mỗi collocation hoàn thành ở giai đoạn 2 thì mở card `col:*#col_gap`, rate theo `autoRate`.
- Mỗi `l1Trap` bị mắc (chọn sai hoặc gõ ra cụm sai) thì tạo item `err:l1col_<colId>` với face `err_fix`.
- Sprint chỉ ghi review cho card đã có (như một lượt ôn bình thường).

## 9. Data
- `vocab/collocations.json` theo `04` §3. Số lượng: MVP 600, đầy đủ 1.500 (`05` §6).
- Mỗi headword trung tâm (lò) cần ≥ 6 collocation và ≥ 2 `l1Traps` tổng cộng.
- Danh sách 120 headword trung tâm đầu tiên ưu tiên các danh từ và động từ Task 2:
  - **Danh từ:** impact, effect, influence, issue, problem, solution, measure, policy, approach, factor, role, benefit, drawback, risk, demand, pressure, awareness, attitude, behaviour, development, growth, decline, trend, access, opportunity, responsibility, consequence, evidence, research, knowledge, skill, education, crime, pollution, resource, economy, technology, health…
  - **Động từ:** address, tackle, reduce, increase, raise, pose, play, take, make, have, gain, exert, alleviate, mitigate, foster, promote…
  - Worker lập đủ danh sách 120 và ghi vào `data-src/collocations/HEADWORDS.md`.
- Cách sinh và kiểm: `05` §4.2 + verifier 3 câu hỏi. **Đây là loại data rủi ro cao**, bắt buộc soi mẫu 15% thay vì 10%.

## 10. UI, motion, sound riêng
- **Đúng:** đe loé tia lửa (6 hạt nhỏ bắn ra, CSS transform, 0,35 s), SFX `correct` + tiếng "keng" kim loại nhẹ (Kenney Impact Sounds, `impactMetal_light_00x`).
- **Sai:** đe rung nhẹ, không có tia lửa.
- **Giai đoạn 3:** cụm sai bị "nứt" (đường nứt SVG vẽ nét 0,3 s).
- Mỗi giai đoạn có màu viền riêng: 1 cam nhạt (nung), 2 cam (đập), 3 xanh thép (tôi).

## 11. Edge cases
- Nhiều đáp án đúng có độ tự nhiên khác nhau: chấp nhận hết, ghi chú `primary`.
- Người học gõ đúng nhưng sai mạo từ hoặc số nhiều trong phần gap: chấm dựa trên `answers` đã chuẩn hoá (bỏ a/an/the ở đầu nếu display đã có mạo từ).
- Headword có ít hơn 6 collocation đạt chất lượng: không mở lò đó, ghi vào `HEADWORDS.md` là "cần thêm data".

## 12. Cổng nghiệm thu
- Unit test `engine.ts`: chấm gap (answers, primary, l1Trap), chuyển giai đoạn, sinh item SRS.
- Data: 100% collocation qua [INV-C1..C3] và verifier. Soi mẫu 15% ghi trong REVIEW_LOG, không lỗi nghiêm trọng.
- E2E: 1 lò đầy đủ 3 giai đoạn + 1 Sprint 60 giây chạy bằng bàn phím.
- Ảnh chụp 3 độ rộng: giai đoạn 2, giai đoạn 3, recap.

## 13. Không làm
- Không dạy collocation hiếm, văn chương hoặc thành ngữ cổ.
- Không có kéo thả (chậm, không luyện sản xuất).
