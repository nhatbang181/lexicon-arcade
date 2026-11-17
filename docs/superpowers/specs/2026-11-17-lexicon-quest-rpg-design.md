# LEXICON QUEST: The Realm of IELTS 8.0 — Design Specification

## 1. Executive Summary & Intent
**Lexicon Quest** is an immersive fantasy RPG designed to replace traditional, repetitive Anki flashcard reviews with engaging, high-retention gameplay. Players explore themed realms corresponding to IELTS 8.0 vocabulary topics, engaging in tactical turn-based battles where attacks, combos, and defenses are executed through active recall, collocations, sentence cloze context, and synonyms.

The primary directive is **Learning Quality First, wrapped in Genuine RPG Joy**:
- Active recall over passive recognition (cloze typing, collocation chaining, synonym matching).
- Context-rich learning using full example sentences and collocations extracted from the user's personal Anki collection (~1,515 notes / 2,400+ cards).
- Built-in Spaced Repetition (SRS) tracking so forgotten or mistyped words become recurring "Nemesis Beasts" in the dungeon.
- Immediate native voice synthesis (TTS) to train listening and phonetics for every vocabulary item.

---

## 2. Target Audience & Requirements
- **User**: Advanced/IELTS learner suffering from Anki fatigue.
- **Platform**: Web application (Vite + React + TypeScript + Tailwind CSS), runs locally in any modern browser (`http://localhost:5173`).
- **Data Source**: Directly extracted from `C:\Users\nhatb\AppData\Roaming\Anki2\Người dùng 1\collection.anki2`.
- **Offline / Standalone capability**: Pre-compiled JSON bundle placed in `public/data/anki_vocab.json` with a live sync script option.

---

## 3. Core Gameplay & Architecture

### 3.1 World Map & Dungeons (IELTS Topic Biomes)
Each zone corresponds to a deck in the user's Anki collection:
1. **The Scholastic Academy** (*Education* - 200 cards)
2. **The Primordial Grove** (*Environment* - 194 cards)
3. **The Cyber Foundry** (*Technology* - 200 cards)
4. **The Sanctuary of Vitae** (*Health* - 198 cards)
5. **The Merchant Metropolis** (*Work & Economy* - 206 cards)
6. **The Shadow Underworld** (*Society & Crime* - 202 cards)
7. **The Broadcast Citadel** (*Media* - 206 cards)
8. **The Steam Transit Hub** (*Urban & Transport* - 200 cards)
9. **The Astral Observatory** (*Science & Research* - 202 cards)
10. **The Grand Pantheon** (*Culture & Globalisation* - 204 cards)
11. **The Spire of Erudition** (*Academic Word List Sublists 1 & 2* - 120 cards)
12. **The Collocation Caverns & Paraphrase Arena** (Collocations, Paraphrase, Listening/Spelling)

### 3.2 Battle System (Turn-Based Tactical RPG)
- **Player Stats**: Level, HP (Health), MP (Mana), EXP, Gold, Attack Power, Shield.
- **Enemy Stats**: Name, Monster Sprite, HP, Attack, Weakness, Topic Affiliation.
- **Combat Actions (Language-driven Spells)**:
  1. **Cloze Strike (Context Attack)**: A real IELTS example sentence is shown with a blank. Player types or chooses the target word. Correct recall triggers a massive physical blow.
  2. **Collocation Combo**: The enemy prepares a defense; player must select the correct collocate (e.g., `revise the...` -> `curriculum`) to breach armor and execute a multi-hit combo.
  3. **Synonym / Paraphrase Parry**: Match the academic synonym or English definition to parry incoming boss damage.
  4. **IPA Spellcasting (Spelling/Phonics)**: Listen to the TTS audio pronunciation and spell the word correctly for a Critical Strike.
- **Battle Feedback**: Screen shakes on hits, floating damage numbers, retro Web Audio SFX (swords, magic, hits, fanfare), victory loot screen.

### 3.3 RPG Progression & Retention Mechanics
- **Loot & Shop**: Gold won from battles purchases weapons (boosts ATK), armor (reduces penalty on wrong answers), health potions, and hint scrolls.
- **Grimoire / Bestiary (Codex)**: A searchable library of all unlocked words, showing definition, IPA, audio button, example sentence, and mastery stars (0 to 5).
- **Spaced Repetition (SRS Leitner System)**:
  - Wrong answers reduce mastery score and tag the card as a "Nemesis".
  - Nemesis words are prioritized in future encounters until answered correctly 3 consecutive times.

---

## 4. Technical Constraints & Design Choices
- **UI/UX**: Responsive retro-modern fantasy aesthetic (dark mode slate/zinc palette, gold/amber accents, pixel-inspired badges and monster artwork).
- **Audio**: Web Audio API procedural sound synthesizer (no missing asset 404s) + native Web Speech API (`SpeechSynthesisUtterance`) for crystal clear pronunciation.
- **State Persistence**: `localStorage` saves player profile, XP, inventory, equipped gear, and SRS mastery progress.
- **Data Extractor**: Python script using standard `sqlite3` to pull all notes, tags, decks, and fields from Anki into structured JSON.
