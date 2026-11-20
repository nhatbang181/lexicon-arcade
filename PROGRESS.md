# PROGRESS.md – Tiến Độ Điều Phối Lexicon Arcade IELTS 8.0 (V2.0)

## Trạng thái hiện tại: Mốc M1 PASS 100% -> Đang chạy Mốc M2 (Đợt 2A)

### Mốc M1: Nền tảng Dữ liệu IELTS 8.0 & 4 Kỹ Năng [DONE - PASS]
- [x] `r-data-vocab` (`gemini-4-neon-high`): Mở rộng `public/data/anki_vocab.json` lên **2,152 từ** sạch 100% (commit `2518674`).
- [x] `r-data-4skills` (`gemini-4-neon-high`): Tạo `src/types/fourSkills.ts` và `public/data/ielts_4skills.json` (L:160, R:12 bài + 160 paraphrase, W:150 upgrade + 108 errorFix, S:55+38+50) (commit `0dafb8f`).
- [x] `rv-data-gate` (`gemini-3.8-flash-medium`): Cổng M1 PASS 100% (`scripts/validate_all_data.js`, `tsc --noEmit` 0 lỗi).

### Mốc M2: Đại Tu Game Cũ & Xây 4 Game Mới Cho 4 Kỹ Năng [IN PROGRESS]
- [ ] `r-polish-arcade` (`gemini-4-neon-medium`, thay Argon do Argon còn 2%): Làm lại `CyberSnakeGame.tsx` V2 & polish `SpeedTyperGame.tsx`, `CyberDefusalGame.tsx`.
- [ ] `r-game-listen` (`gemini-4-neon-medium`): Xây `ListeningDictationGame.tsx` + `ReadingSniperGame.tsx`.
- [ ] `r-game-write` (`gemini-4-neon-medium`): Xây `WritingUpgraderGame.tsx` (chờ đợt 2B).
- [ ] `r-game-speak` (`gemini-4-neon-medium`): Xây `SpeakingFluencyGame.tsx` (chờ đợt 2B).

### Mốc M3: Tích Hợp Sảnh 12 Game, Kiểm Chéo & Deploy [PENDING]
- [ ] `r-hub-integrate`: Nâng cấp `ArcadeHub.tsx` với bộ lọc 4 kỹ năng & 12 chế độ game.
- [ ] `rv-final-audit`: Kiểm chéo toàn bộ diff, `npm run build` 0 lỗi.
- [ ] `r-deploy`: Push GitHub Pages & xác nhận HTTP 200 live.

## Lỗi đã biết
- Quota `gemini-4-argon-*` còn 2% -> tự động chuyển tác giả M2 sang `gemini-4-neon-medium` (cùng tầng Gemini 4).
