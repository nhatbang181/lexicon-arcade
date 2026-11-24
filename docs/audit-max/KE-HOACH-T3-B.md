# KE-HOACH-T3-B · Dữ liệu và audio (D1–D19)

- **Worktree / nhánh:** `D:\English-wt\T3-B` (`audit-max/T3-B`)
- **Phạm vi độc quyền:** `public/data/**`, `public/audio/**` (trừ `speaking/**`), `data-src/**`, `scripts/data/**`, `scripts/audio/**`, `REVIEW_LOG.md`, `docs/audit-max/*T3-B*`
- **Ngân sách cứng:** tổng `public/audio/` ≤ 400 MB (hiện 24.00 MB); không đổi ID đã phát hành; không đụng `src/**`, `public/audio/speaking/**`, `docs/audit-max/cong-cu/**`.

## Hiện trạng lúc nhận bàn giao
- Audio: Listening 9/32, Dictation 264/300, Vocab 537/2207 (tổng 24.00 MB).
- Blind-solve: Reading & Listening đang làm dở (`data-src/{reading,listening}/blind_answers.json`), 0 item đã gắn `qa.blindSolve`.
- `validate:data` hiện lỗi 9 SHA-256 trong `manifest.json` do các JSON đã sửa chưa rebuild manifest.

## Các mốc thực hiện & checkpoint commit
1. **Mốc 1 · Dictation 300/300 (D2):** chạy `render_dictation.py --all` render nốt 36/300 MP3, gắn `audioProvenance`, rebuild manifest, commit checkpoint.
2. **Mốc 2 · Listening 32/32 (D1):** chạy `render_episode.py --all` render nốt 23/32 MP3 (và re-render nếu `p2_001`/`p4_001` vượt INV-L6), cập nhật timestamp/sha256/loudnessLUFS/`audioProvenance`, rebuild manifest, commit checkpoint.
3. **Mốc 3 · Blind-solve 24/24 Reading & 32/32 Listening (D4):** hoàn thiện `blind_answers.json`, chạy `scripts/data/40_compare_blind.mjs`, gắn `qa.blindSolve: "pass"`, sửa câu mơ hồ nếu phát hiện, commit checkpoint.
4. **Mốc 4 · Vocab audio & D5–D19:**
   - Render vocab audio còn thiếu theo batch (giám sát dung lượng `public/audio/` << 400 MB), gắn `audioProvenance`, lập `public/audio/CREDITS.md` (D12).
   - Sửa provenance sai (D6), sinh lại câu ví dụ khuôn đúc & sai ngữ pháp (D5), chuẩn hoá IPA (D19), xử lý trùng collocation (D9), decoy paraphrase (D10), bổ sung `level` (bảng 04 §3), tạo 2 `ExamTest` (D14), kiểm `validate:data` và `validate:data:release` (trừ speaking thuộc M5).
5. **Mốc 5 · Kiểm thử & báo cáo:** chạy `npm run validate:data` và `node scripts/validate/run_all.mjs --require-audio --require-blind`, ghi `REVIEW_LOG.md` và `docs/audit-max/BAO-CAO-T3-B.md`, commit sạch, báo `@coordinator`.

## Rủi ro & biện pháp
- Edge-tts giới hạn tốc độ / lỗi mạng → chạy concurrency vừa phải (4–6), có retry backoff sẵn trong `common.py`, commit theo batch.
- Dung lượng `public/audio/` → đo sau mỗi batch render, dừng hỏi nếu tiệm cận 400 MB.
- `manifest.json` lệch SHA-256 → luôn rebuild manifest trước mỗi checkpoint commit.
