# KE-HOACH T1-A · Kho thẻ SRS có nội dung + V1 đúng

Nhánh `audit-max/T1-A` (worktree `D:\English-wt\T1-A`). Route đụng: `#/play/v1` (không đổi shell, PlayScreen, Today).
Mã lỗi: G1, G3 (phần V1), V1-1…V1-16 (tiêu chí ĐẠT chính: V1-1…V1-9).

## Thành phần
- `src/core/storage/db.ts`: Dexie v2, bảng `userItems`, migrate (attempt cũ → `status:'final'`). `repos/userItemRepo.ts` (`upsertWithCard` 1 transaction). `attemptRepo.saveProgress/finalize`. `backup.ts` thêm `userItems` (tùy chọn, backup cũ vẫn đọc được).
- `src/core/srs/fsrsAdapter.ts`: `SRSCard.introSeenAt?`, `CardSource` thêm `'fixture'`.
- `src/games/v1-daily-run/`: `content.ts` (kiểu bundle + extras), `extras.ts` (nạp userItems / passage / episode theo thẻ), `seed.ts` (RNG có seed, thẻ khởi động từ words.json), engine (map thẻ → mặt, intro 1 lần, distractor seed, 5 mặt mới, bỏ `?? X[0]`), `V1DailyRun.tsx` (EmptyState, lưu từng lượt, 5 renderer mới).
- Fixture chỉ còn dùng trong test (`MODE==='test'`/vitest); không import fixture từ code chạy.

## Rủi ro
- `src/features/placement/placementData.ts` (ngoài quyền) vẫn import `V1_FIXTURE_VOCAB` ⇒ chuỗi `v1_fixtures` còn trong bundle entry → ghi HANDOFF.
- Thẻ `err:user_*`/`err:w2_*`/`col:user_*` cũ chưa có `userItems` (producer thuộc T2-C/T2-A) ⇒ V1 bỏ node + log `missing_item`, không hiện item sai.
- audit-ui chỉ thấy EmptyState của V1 (DB trống); trạng thái có thẻ chụp bằng E2E/script seed IndexedDB.

## Cách vào trạng thái khó
E2E `e2e/v1-srs.spec.ts` ghi thẳng vào IndexedDB `LexiconV3DB` (cards state Review, vocab thật từ `words.json`), mở `#/play/v1`. Recap: trả lời hết hoặc "Lưu & Dừng" ở checkpoint. DB rỗng: context mới.

## DANH SÁCH MỌI NÚT / CHỨC NĂNG V1 (phải còn nguyên)
1. HUD: pill Chặng n/N · pill "Pha Boss" · pill "Ôn thêm (Không ghi FSRS)" · nút đổi Chế độ bận ↔ Tiêu chuẩn (chỉ ở node đầu) · chuỗi chấm tiến độ · combo ×2/×3 · XP cộng dồn.
2. RunMap (bản đồ node, chặng, HP boss).
3. Thẻ node: pill mặt thẻ, pill "Làm lại", pill "Thẻ hiếm ×3 XP", pill CEFR/POS.
4. Intro: nút phát âm · "Tôi biết rồi (Kiểm ngay)" · "Đã xem" · tự phát âm.
5. recog / para_match: 4 lựa chọn, phím 1–4, Gợi ý loại 1 đáp án.
6. recall_meaning / recall_cloze / listen_spell / col_gap / err_fix: ô gõ, Enter nộp, nút Nộp, Gợi ý (H, lộ chữ), Không nhớ, phát âm giới hạn lượt (listen_spell).
7. Phản hồi: banner collocation (đúng), CharDiffBox (sai), FeedbackPanel + Enter/nút Tiếp, tự chuyển 1,2 s khi đúng.
8. Checkpoint: "Lưu & Dừng tại đây" · "Đi tiếp Chặng" (Enter) · RunMap + ring.
9. Boss: 5 thẻ khó nhất, HP, +50 XP khi hạ.
10. Recap: 4 thẻ số, RecapScreen (Làm lại câu sai, Về Hôm nay), lưu phiên.
11. Mới: EmptyState (bắt đầu với thẻ khởi động / đi placement) · thẻ `tfng_retry`, `head_retry`, `ltrap_replay`, `dict_full`, `err_user` · bản đồ mở đầu (Enter bắt đầu).
