# IOE ARENA: The IELTS 8.0 Olympic Challenge — Specification

## 1. Vision & Purpose
Transform the user's 1,499 Anki IELTS 8.0 cards into an authentic, gamified **IOE (Internet Olympiads of English)** challenge system. Instead of passive flashcards or motor-distracting action controls, **100% of cognitive effort is dedicated to active language mastery**:
- Correct spelling and letter order (Defeat the Word)
- Natural collocations and academic synonyms (Matching Pairs)
- Native phonetics and listening comprehension (Audio Obstacle)
- Real-world sentence cloze context (Context Cloze)

All wrapped in exciting arcade gamification: 3-heart life system, combo multipliers, countdown timers, pixel UI frames, and an automatic Mistake Bank (SRS).

---

## 2. The 4 Olympic Game Rounds

### Round 1: Defeat the Word (Sắp Xếp Ký Tự)
- Word letters are scrambled into draggable/clickable letter blocks.
- Clues displayed: Meaning (Vietnamese), POS badge, masked academic sentence.
- Player clicks tiles or types on keyboard. Letters snap into place with satisfying audio.
- Success triggers native TTS pronunciation and points.

### Round 2: Matching Pairs (Cặp Bài Trùng Collocation & Synonym)
- A 12-card grid (6 pairs).
- Pairs drawn directly from Anki:
  - Verb + Noun Collocation (`rely on` <-> `rote learning`)
  - Target Word + Academic Synonym (`curriculum` <-> `syllabus`)
- Flip & match mechanics with combo multipliers for consecutive matches.

### Round 3: Audio Obstacle (Nghe Âm & Điền Từ)
- Native English speech playback with normal (1.0x) and slow (0.8x) speeds.
- Player listens and types the target word in a sentence blank.
- IPA transcription and explanation shown upon submission.

### Round 4: Context Mastery (Điền Khuyết Ngữ Cảnh)
- Full authentic IELTS 8.0 sentence with a missing word.
- 4 smart distractors of the same part of speech from the same topic realm.
- Detailed linguistic explanation displayed on completion.

---

## 3. Gamification Mechanics ("Kiểu Game Game Tí")
- **3 Hearts / Lives (❤️❤️❤️)**: Wrong answers cost 1 heart. Game over screen offers 1-click mistake replay.
- **Combo Meter (x1, x2, x3, x5)**: Consecutive correct answers multiply score.
- **Timer Countdown**: 30-second ticking clock per question with color-shifting bar.
- **Medal System**: Bronze, Silver, Gold, Platinum Olympic medals awarded per realm.
- **Mistake Bank (Ngân Hàng Câu Sai)**: Incorrect words automatically recorded in `localStorage` for focused review.
