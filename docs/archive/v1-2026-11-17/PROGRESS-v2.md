# PROGRESS.md – Tiến Độ Điều Phối Lexicon Arcade IELTS 8.0 (V2.0)

## Trạng thái hiện tại: TẠM DỪNG THEO YÊU CẦU (Chờ hồi quota – đã chốt xong 100% Mốc M1)

### Mốc M1: Nền tảng Dữ liệu IELTS 8.0 & 4 Kỹ Năng [DONE - PASS - ĐÃ MERGE MASTER]
- [x] `r-data-vocab`: Mở rộng `public/data/anki_vocab.json` lên **2,152 từ** sạch 100% (commit `2518674`).
- [x] `r-data-4skills`: Tạo `src/types/fourSkills.ts` và `public/data/ielts_4skills.json` (L:160, R:12 bài báo + 160 paraphrase, W:150 upgrade + 108 errorFix, S:55 cụm + 38 khung + 50 phát âm) (commit `0dafb8f`).
- [x] `rv-data-gate`: Cổng M1 PASS 100% (`scripts/validate_all_data.js`, `tsc --noEmit` 0 lỗi, commit `562f676`).

### Mốc M2: Đại Tu Game Cũ & Xây 4 Game Mới Cho 4 Kỹ Năng [PAUSED – SẴN SÀNG CHẠY TIẾP]
- [ ] `r-polish-arcade`: Làm lại `CyberSnakeGame.tsx` V2 (hạt A/B/C/D + pill nguyên chữ + Tactical Slow-Mo) & polish `SpeedTyperGame.tsx`, `CyberDefusalGame.tsx`.
- [ ] `r-game-listen`: Xây `ListeningDictationGame.tsx` + `ReadingSniperGame.tsx`.
- [ ] `r-game-write`: Xây `WritingUpgraderGame.tsx`.
- [ ] `r-game-speak`: Xây `SpeakingFluencyGame.tsx`.

### Mốc M3: Tích Hợp Sảnh 12 Game, Kiểm Chéo & Deploy [PENDING]
- [ ] `r-hub-integrate`: Nâng cấp `ArcadeHub.tsx` với bộ lọc 4 kỹ năng & 12 chế độ game.
- [ ] `rv-final-audit`: Kiểm chéo toàn bộ diff, `npm run build` 0 lỗi.
- [ ] `r-deploy`: Push GitHub Pages & xác nhận HTTP 200 live.

## Ghi chú khi chạy lại phiên sau
- Toàn bộ Mốc M1 đã nằm gọn trong nhánh `master` (sạch 100%, đã pass cổng kiểm định).
- Phiên sau chỉ cần gõ tiếp `/dieu-phoi chạy tiếp từ Mốc M2 theo PROGRESS.md` là chạy thẳng vào 4 game 4 kỹ năng + Rắn V2 và deploy.
