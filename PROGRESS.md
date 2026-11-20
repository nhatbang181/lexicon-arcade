# PROGRESS.md – Tiến Độ Điều Phối Lexicon Arcade IELTS 8.0 (V2.0)

## Trạng thái hiện tại: Đang chạy Mốc M1 (Nền tảng Dữ liệu IELTS 8.0 & 4 Kỹ Năng)

### Mốc M1: Nền tảng Dữ liệu IELTS 8.0 & 4 Kỹ Năng
- [ ] `r-data-vocab` (`gemini-4-neon-high`): Mở rộng `public/data/anki_vocab.json` lên ≥2,000 từ vựng sạch 100% (bổ sung AWL Sublists 3–10 & C1/C2 vocabulary).
- [ ] `r-data-4skills` (`gemini-4-neon-high`): Tạo `src/types/fourSkills.ts` và `public/data/ielts_4skills.json` (Listening ≥150, Reading 12 bài báo + ≥150 Paraphrase, Writing ≥240 mục, Speaking ≥130 mục).
- [ ] `rv-data-gate` (`gemini-3.8-flash-high`): Kiểm chéo schema, số lượng, 0 CJK, 0 trường rỗng (`scripts/validate_all_data.js`).

### Mốc M2: Đại Tu Game Cũ & Xây 4 Game Mới Cho 4 Kỹ Năng
- [ ] `r-polish-arcade` (`gemini-4-argon-high`): Làm lại `CyberSnakeGame.tsx` V2 (hạt A/B/C/D + pill nguyên chữ + Tactical Slow-Mo) & polish `SpeedTyperGame.tsx`, `CyberDefusalGame.tsx`.
- [ ] `r-game-listen` (`gemini-4-argon-high`): Xây `ListeningDictationGame.tsx` + `ReadingSniperGame.tsx`.
- [ ] `r-game-write` (`gemini-4-argon-high`): Xây `WritingUpgraderGame.tsx`.
- [ ] `r-game-speak` (`gemini-4-argon-high`): Xây `SpeakingFluencyGame.tsx`.

### Mốc M3: Tích Hợp Sảnh 12 Game, Kiểm Chéo & Deploy
- [ ] `r-hub-integrate` (`gemini-4-argon-high`): Nâng cấp `ArcadeHub.tsx` với bộ lọc 4 kỹ năng & 12 chế độ game.
- [ ] `rv-final-audit` (`gemini-4-neon-high`): Kiểm chéo toàn bộ diff, `npm run build` 0 lỗi, test simulation 12 game.
- [ ] `r-deploy` (`gemini-3.8-flash-high`): Push GitHub Pages & xác nhận HTTP 200 live.

## Lỗi đã biết
- Chưa có.
