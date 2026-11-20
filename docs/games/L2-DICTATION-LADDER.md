# L2 · Dictation Ladder: chép chính tả leo thang

## 1. Mục đích
- Luyện nghe **từ dưới lên** (bottom-up): nhận ra từng từ trong dòng nói nhanh.
- Đánh vào điểm yếu của người Việt (`01` §2.2):
  - âm cuối
  - âm yếu
  - nối âm, nuốt âm
  - số
  - chính tả học thuật
- Đây là nền cho L1. Không nghe ra "a/the/-s/-ed" thì không thể chắc 35+/40.

## 2. Vì sao hiệu quả
- Dictation là một trong các hoạt động kiểm chứng tốt cho nhận diện âm vị và từ.
- **P6:** phân tích lỗi **theo loại**, không chỉ báo sai.
- **P5:** thang 10 level, tốc độ và độ khó tăng dần.
- **Cơ chế chơi chính là học:** leo thang, mỗi bậc là một câu chép đúng.

## 3. Core loop
```
Phát câu (tối đa K lần) → người học gõ cả câu → CHẤM theo từ (căn chỉnh Levenshtein)
→ hiện diff: từ đúng (xanh), thiếu (gạch đỏ), sai (đỏ + đáp án), thừa (gạch ngang)
→ "Điểm nghe khó" (focus): giải thích nối âm/âm yếu + ▶ phát chậm 0.75× đoạn đó → tiếp
Phiên = 10 câu.
```

## 4. Luật chơi
- **Số lần phát (K):** level 1–3 phát 3 lần, 4–6 phát 2 lần, 7–10 phát 1 lần (+1 lần ở tốc độ 0.75× với giá −30% điểm).
- **Chấm** (`core/text/align.ts`):
  1. Chuẩn hoá: bỏ dấu câu, hoa thường, gộp khoảng trắng. Contraction và dạng đầy đủ tương đương (`don't` = `do not`). Số: chữ = số.
  2. Căn chỉnh từ bằng Levenshtein mức từ (chi phí: thay 1, xoá 1, thêm 1).
  3. Phân loại từng lỗi:

     | Loại | Điều kiện |
     |---|---|
     | `final_consonant` | Thiếu hoặc sai -s/-es/-ed/-t/-d ở cuối từ, gốc từ giống nhau |
     | `weak_form` | Thiếu hoặc sai từ chức năng: a, an, the, to, of, for, and, can, have, has, are, was, were, at, in, on |
     | `spelling` | Đúng từ (khoảng cách ký tự ≤ 2, độ dài ≥ 5) nhưng sai chữ |
     | `number` | Sai số |
     | `wrong_word` | Các trường hợp còn lại |

- **Điểm câu** = số từ đúng / tổng số từ đáp án. Câu "hoàn hảo" (100%) +5 XP thưởng.
- **Leo bậc:** trong 1 phiên, ≥ 8/10 câu đạt ≥ 90% thì đề xuất lên level (theo `02` §4).

## 5. Độ khó
Theo bảng `05` §6.4 (WPM, độ dài, giọng, đặc điểm). Thêm level 10: câu có tự sửa và giọng chồng nhẹ.

## 6. Wireframe
```
┌ ✕ Dictation Ladder · Level 5 ──────────── 3/10 ── lượt phát: ●●○ ── +45 ┐
│                           [ ▶  Phát  (R) ]                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ the number of students who applied for the course has risen...     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                       [Nộp ↵]          │
│ ── sau khi chấm ─────────────────────────────────────────────────────  │
│  The number of students who ~~apply~~ **applied** for ▢**the** course     │
│  has risen ...                     91%                                  │
│  ⓘ "applied for the" → /əˈplaɪd fə ðə/ – "-ed" nối vào "for", "for" đọc yếu │
│     [▶ 0.75× đoạn này]                                   [Tiếp ↵]        │
└─────────────────────────────────────────────────────────────────────────┘
```
- **Thang leo:** ở màn intro và recap có thang dọc 10 bậc, nhân vật chấm tròn đứng ở level hiện tại.

## 7. Feedback
- **Diff màu:** xanh đúng, đỏ sai, gạch đỏ thiếu, gạch xám thừa.
- **Focus tips** lấy từ `focus[]` của data (tối đa 2). Nếu engine phát hiện lỗi `final_consonant` hay `weak_form` mà data không có focus tương ứng thì dùng tip chung theo loại.
- **Câu thắng:** "Lỗi âm cuối giảm từ X% xuống Y% so với 7 ngày trước". Hoặc "8/10 câu hoàn hảo ở level 5".

## 8. SRS
- Câu < 70% thì tạo hoặc cập nhật item `dict:*` với face `dict_full` (V1 phát lại câu, người học gõ, chấm như L2). Rate:

  | Điểm | Rating |
  |---|---|
  | ≥ 95% | Good |
  | 80–95% | Hard |
  | < 80% | Again |

- Từ bị lỗi `spelling` 2 lần thì tạo vocab item cho V1 face `listen_spell`.

## 9. Data
- `listening/dictation.json` (`04` §4). MVP 300, đầy đủ 1.000 (100 mỗi level).
- **Nguồn:** câu cắt từ episode training (tốt nhất) + câu mới phủ đặc điểm. **Không** cắt từ episode reserved.
- Audio render riêng từng câu (không cắt từ file episode, để có khoảng lặng sạch), cùng giọng với speaker gốc nếu lấy từ episode.

## 10. UI, motion, sound riêng
- Nút Phát to, ở giữa. Trong lúc phát thì vòng sóng chạy quanh nút. Hết lượt phát thì nút xám.
- **Diff hiện dần** theo thứ tự từ (stagger 25 ms mỗi từ, tối đa 0,6 s tổng).
- Không có SFX trong lúc audio đang phát.

## 11. Edge cases
- Gõ trước khi phát xong: cho phép.
- Người học gõ thêm dấu câu hoặc viết hoa: bỏ qua khi chấm.
- Câu có tên riêng: chấp nhận nhiều cách viết nếu data có `accepted` (bổ sung field tuỳ chọn `acceptedVariants`).
- Từ ghép có hoặc không có gạch nối ("well-known" / "well known") tính là đúng.

## 12. Cổng nghiệm thu
- Unit test `align.ts` ≥ 30 case: thứ tự, thiếu, thừa, contraction, số, phân loại 5 loại lỗi.
- Data: [INV-D1] pass, audio QA pass (WER = 0 với `text`).
- E2E: 1 phiên 10 câu ở level 1 và 1 phiên ở level 7 (giới hạn 1 lượt phát).
- Ảnh chụp 3 độ rộng: đang gõ, diff, recap.

## 13. Không làm
- Không chấm theo ký tự trên toàn câu. Chỉ chấm theo từ.
- Không có chế độ chọn đáp án.
