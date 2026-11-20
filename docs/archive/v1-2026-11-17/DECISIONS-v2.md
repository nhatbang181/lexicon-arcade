# DECISIONS.md – Lexicon Arcade IELTS 8.0 (V2.0)

## 1. Kiến trúc Dữ liệu (Mốc M1)
- **Giữ nguyên tương thích ngược cho `public/data/anki_vocab.json`:** Giữ cấu trúc `{ metadata, realms }` với 12 realms hiện có, nhưng bơm thêm toàn bộ từ vựng học thuật từ các sub-deck Anki chưa khai thác và bổ sung Academic Word List (AWL Sublists 3–10) + C1/C2 Academic Vocabulary để nâng tổng số từ lên **≥2,000 từ vựng sạch 100%** (0 ký tự CJK, có đủ `word`, `ipa`, `pos`, `meaning`, `definition`, `example`, `collocations`, `synonyms`).
- **Tạo kho dữ liệu 4 kỹ năng chuyên biệt `public/data/ielts_4skills.json` + kiểu dữ liệu `src/types/fourSkills.ts`:**
  - `listening`: ≥150 mục (trích từ sub-deck `9. Listening · Chính tả` + bổ sung bẫy chính tả Section 1 & 4, số liệu, từ dễ nhầm âm, câu dictation có đáp án và giải thích bẫy).
  - `reading`: 12 bài báo học thuật (`passages`: 5 bài gốc `A01–A05` từ Anki + 7 bài mới `A06–A12` chủ đề IELTS thực chiến, mỗi bài có đoạn văn, từ vựng điểm nhấn, câu hỏi True/False/Not Given và bài tập Paraphrase Sniper) + `paraphrases`: ≥150 cặp Paraphrase đồng nghĩa bẫy đề thi (từ sub-deck `3. Paraphrase` + mở rộng).
  - `writing`: ≥140 mục nâng cấp câu `upgrades` (từ sub-deck `5. Writing Task 1 & 2` + mở rộng Band 6.0 → Band 8.0) + ≥100 mục bắt lỗi sai `errorFixes` (cho sub-deck `6. Lỗi sai`).
  - `speaking`: ≥130 mục gồm `naturalPhrases` (cụm diễn đạt tự nhiên), `part23Frameworks` (khung triển khai Part 2–3), và `pronunciationTraps` (bẫy trọng âm & phát âm từ sub-deck `4. Speaking`).

## 2. Thiết kế Game & Polish (Mốc M2)
- **Cyber Snake V2 (`src/components/arcade/CyberSnakeGame.tsx`):**
  - Bỏ kiểu vẽ chữ cắt cụt `...` trong hạt tròn 26px.
  - Mỗi hạt trên lưới hiển thị ký hiệu `[A]`, `[B]`, `[C]`, `[D]` to rõ, kèm nhãn pill nổi (`rounded-full bg-slate-900/90 border`) hiển thị **100% nguyên từ tiếng Anh** ngay phía trên hạt.
  - Bảng HUD đối chiếu `[A]..[D]` hiển thị chữ lớn + IPA + nút đọc âm thanh.
  - Thêm cơ chế **Tactical Slow-Mo**: 3 giây đầu mỗi câu rắn tự giảm tốc độ để người chơi đọc từ, giữ phím `Shift` để bật/tắt chế độ đi chậm bất kỳ lúc nào, ăn đúng từ hiện thẻ tổng kết nhanh 1.2s.
- **4 Game Mới Chuyên Biệt Cho 4 Kỹ Năng (`src/components/arcade/`):**
  1. `ListeningDictationGame.tsx` (Listening)
  2. `ReadingSniperGame.tsx` (Reading)
  3. `WritingUpgraderGame.tsx` (Writing)
  4. `SpeakingFluencyGame.tsx` (Speaking)

## 3. Tích hợp Sảnh Arcade (Mốc M3)
- `ArcadeHub.tsx` có thanh lọc tab theo kỹ năng: `TẤT CẢ (12)` | `TỪ VỰNG & PHẢN XẠ` | `🎧 LISTENING` | `📖 READING` | `✍️ WRITING` | `🎙️ SPEAKING`.
