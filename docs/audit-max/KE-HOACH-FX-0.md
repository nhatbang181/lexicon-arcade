# KẾ HOẠCH · FX-0 + FX-2 + vá nợ nhỏ

- **Nhánh / worktree:** `audit-max/FX-0` (`D:\English-wt\FX-0`).
- **File sửa (độc quyền):** `src/games/v1-daily-run/**`, `src/core/srs/**`, `src/core/scoring/listeningAnswer.ts`, `src/core/scoring/listeningAnswer.normalize.test.ts`, `e2e/v1-srs.spec.ts`, `docs/audit-max/KE-HOACH-FX-0.md`, `docs/audit-max/BAO-CAO-FX-0.md`.

## Phạm vi việc làm
1. **FX-0 (`listen_spell` kiểm MP3 thật — SR-22, PP-C1):** dùng `src/core/audio/audioAvailability.ts` kiểm file MP3 thật cho mọi thẻ `listen_spell` (cả `vocab:*` và `dict:*`). Nếu thiếu MP3 thật: `vocab:*` hạ về thẻ gợi nhớ hợp lệ (`recall_meaning`/`recall_cloze`), `dict:*` bỏ node + log `missing_item` (`reason: 'missing_audio'`), không chấm FSRS trên thẻ nghe không có âm thanh.
2. **FX-2 (`PP-02`, `PP-C4`, `L-5`, `L-11`):**
   - Van tải thẻ mới trong `src/core/srs/queue.ts` + nối vào V1: mặc định 15 thẻ mới/ngày; tự giảm (15→10→5) khi tỷ lệ nhớ lượt đầu 7 ngày < 80%; tạm dừng (= 0) khi `dueCount > 150`; hiện lý do sư phạm trên UI (`SR-87`).
   - Vòng phục hồi (Recovery Round): vắng ≥ 3 ngày (mốc 04:00 giờ địa phương) và `dueCount > 50` → giới hạn phiên ≤ 50 thẻ + nhãn "Vòng phục hồi · tối đa 50 thẻ".
   - Từ mới theo khối chủ đề (`L-5`/`PP-05`): gom thẻ mới theo `topics[0]` trong lần học đầu, chỉ trộn ở lượt ôn.
3. **Vá nợ nhỏ:** đăng ký `registerProgressSaver` ở `V1DailyRun.tsx` (`TU-02`/`F1`); bỏ cảnh báo Rollup dynamic import ở `src/games/v1-daily-run/index.ts` (`X5`); sửa regex dòng 408 và 708 ở `src/core/scoring/listeningAnswer.ts` + test `"1,500"`/`"10,000"`.

## Nút & chức năng V1 giữ nguyên (SR-80, SR-90)
- Màn rỗng: `Bắt đầu với 15 từ khởi động`, link `Làm placement`; màn đã xong: `Về Hôm nay`.
- Màn `map_intro`: `RunMap`, nút `Chế độ bận (10 thẻ)` / `Đổi sang Tiêu chuẩn`, nút `Bắt đầu (Enter)`.
- Màn chơi / Pha Boss: HUD (Chặng, chuỗi chấm, combo, XP, nút đổi chế độ bận), `RunMap`, phát audio (`AudioButton`), 13 mặt thẻ (kể cả `intro`: `Đã xem` / `Đã biết từ này`), `Gợi ý (H)`, `Không nhớ`, `Nộp (Enter)`, `FeedbackPanel` + `CharDiffBox` + tự chuyển 1,2 s.
- Checkpoint: `ProgressRing`, `Lưu & Dừng tại đây`, `Đi tiếp Chặng N (Enter)`.
- Recap: 4 thẻ chỉ số, `RecapScreen`, `Làm lại câu sai`, `Về Hôm nay`.
- Lưu tiến độ giữa phiên (`attemptRepo.saveProgress` / `finalize`, flush khi ẩn tab / thoát).
