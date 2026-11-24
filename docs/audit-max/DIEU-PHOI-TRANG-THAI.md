# Trạng thái điều phối audit-max · cập nhật 24/11/2026

> Agent tiếp theo (Antigravity hay Claude): đọc `BAN-GIAO-AGENT.md` trước, rồi file này để biết đang ở đâu.
> Kế hoạch gốc không đổi: `TASKS.md` (4 đợt). File này chỉ ghi tiến độ và việc kế tiếp.
> Bang yêu cầu: chạy hết 4 đợt, KHÔNG dừng chờ duyệt ở cổng, báo một lần ở cuối.
> Builder và reviewer phải là 2 model khác nhau (LUAT Q2). Trước đây dùng Sonnet high để làm, Opus high để kiểm.

## Đang ở đâu: Đợt 1 (T1-A, T1-B, T1-C) ĐÃ MERGE `master` · Đang chốt cổng G0 (push + CI)

| Task | Nhánh / worktree | Trạng thái |
|---|---|---|
| T1-B | `audit-max/T1-B` · `D:\English-wt\T1-B` | ĐẠT sau fixer vòng 1 (`REVIEW-T1-B-A.md`). **Đã merge vào master** |
| T1-A | `audit-max/T1-A` · `D:\English-wt\T1-A` | ĐẠT sau fixer vòng 1 (`6e47564`, `REVIEW-T1-A-A.md`). **Đã merge vào master**. Còn ⏳: `listen_spell` chưa kiểm audio |
| T1-C | `audit-max/T1-C` · `D:\English-wt\T1-C` | ĐẠT sau fixer vòng 1 (`341ca75`, `REVIEW-T1-C-A-v2.md` Argon Medium: 0 CHẶN / 0 NẶNG, 470/470 test, 18/18 Playwright). **Đã merge vào master (`5a77c1d`)** |
| master | `D:\English` | Đủ T1-A + T1-B + T1-C + `DECISIONS.md` → push `origin/master` & kiểm CI `verify` + production `<title>` V3 |
| T3-B (chạy sớm) | `audit-max/T3-B` · `D:\English-wt\T3-B` | Đã commit `577b3bf` (300/300 MP3 dictation) và `49d70b8` (blind-solve D4: 24/24 Reading + 32/32 Listening). Đang dở 18/32 MP3 listening (còn 14 bài): **không reset** |

## Việc kế tiếp (đúng thứ tự)
1. **Chốt cổng G0**: push `origin/master`, xác nhận workflow `verify` + `deploy` xanh trên GitHub và production `<title>` là V3.
2. **Đợt 2** (`T2-A`, `T2-B`, `T2-C` theo `TASKS.md`, mỗi task worktree riêng `D:\English-wt\T2-*` từ `master` mới nhất) + tiếp nối **T3-B** (render nốt 14/32 MP3 listening → D5–D17; dừng hỏi Bang nếu `public/audio` > 400 MB).
3. **Đợt 3 → Đợt 4** theo `TASKS.md` (cổng G1, G2, G3, G4).
   - Lưu ý quota: bể Gemini 5h còn < 15% (reset `2026-11-24T06:27:00Z` = 13:27 VN / 16:57 local) → chạy tối đa 1 worker khi < 25%, dừng ở cổng gần nhất khi < 10%.
