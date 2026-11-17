# Lexicon Quest: IELTS 8.0 RPG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the user's 1,515 Anki IELTS 8.0 flashcards into an immersive, high-retention turn-based RPG web game ("Lexicon Quest") with context cloze battles, collocation combos, native TTS pronunciation, equipment progression, and Spaced Repetition mastery.

**Architecture:** A modern web app built with Vite + React + TypeScript + Tailwind CSS and Lucide icons, backed by procedural Web Audio sound synthesis and Web Speech API phonetics. Vocabulary data is extracted directly from the user's Anki SQLite collection into an optimized JSON database with deck hierarchy, collocations, definitions, IPA, and example sentences. Player state and SRS learning progress persist in `localStorage`.

**Tech Stack:** React 19 / TypeScript / Vite / Tailwind CSS / Lucide React / Web Audio API / Web Speech API / Python 3.11 SQLite extractor

**Spec:** `docs/superpowers/specs/2026-11-17-lexicon-quest-rpg-design.md`

## Global Constraints
- Target directory: `d:\English`
- Operating System: Windows 11 with PowerShell
- Data source: `C:\Users\nhatb\AppData\Roaming\Anki2\Người dùng 1\collection.anki2`
- No external audio network dependencies: all sound effects procedurally synthesized via Web Audio API; all voice pronunciations powered by browser native `window.speechSynthesis`.
- Complete responsive desktop experience, running on `http://localhost:5173`.

## Review Focus
1. Non-standard characters or HTML tags in Anki fields (e.g. `<b>`, `<div>`, `&nbsp;`, `\x1f` delimiters) must be sanitized cleanly into plain text.
2. Missing or partial fields (some notes lack synonyms or collocations) must have safe fallbacks and not crash combat mechanics.
3. Offline resilience: app must run fully in browser with zero required external API keys or paid services.
4. Active recall rigor: user must be able to choose between Typing mode (strict active recall) and Multiple-Choice mode (accessible fast mode).
5. State persistence: leveling up, gold, inventory, and word SRS intervals must survive page refresh.

---

### Task 1: Anki Data Extraction Pipeline & Validation

**Files:**
- Create: `scripts/extract_anki.py`
- Test: `scripts/test_extract.py`
- Produces: `public/data/anki_vocab.json`

**Interfaces:**
- Consumes: `C:\Users\nhatb\AppData\Roaming\Anki2\Người dùng 1\collection.anki2`
- Produces: `VocabData` JSON format:
  ```json
  {
    "realms": [
      {
        "id": "education",
        "name": "The Scholastic Citadel",
        "deck": "IELTS 8.0 > 1. Từ vựng theo chủ đề > 01 · Education",
        "words": [
          {
            "id": "w_1234",
            "word": "curriculum",
            "ipa": "/kəˈrɪkjələm/",
            "pos": "noun",
            "meaning": "chương trình giảng dạy",
            "definition": "the subjects that are studied in a school, college or course",
            "collocations": ["national curriculum", "revise the curriculum"],
            "example": "Many argue that the school curriculum should include practical life skills.",
            "synonyms": ["syllabus", "programme of study"]
          }
        ]
      }
    ]
  }
  ```

- [ ] **Step 1: Write test script `scripts/test_extract.py`**
Verify that the output JSON contains non-empty realms, word records with sanitized text (no raw HTML `<br>` or `&amp;`), and expected fields (`word`, `meaning`, `definition`, `example`).

- [ ] **Step 2: Run test to verify it fails before script creation**
Run: `python scripts/test_extract.py`
Expected: FAIL (file not found)

- [ ] **Step 3: Implement `scripts/extract_anki.py`**
Read from collection.anki2 with custom collation, extract all notes for IELTS 8.0 decks, parse and clean fields, group by 12 distinct game realms, write to `public/data/anki_vocab.json`.

- [ ] **Step 4: Run test to verify it passes**
Run: `python scripts/test_extract.py`
Expected: PASS with 1,200+ clean extracted words across realms.

- [ ] **Step 5: Git commit**
```bash
git add scripts/ public/data/
git commit -m "feat(data): extract and clean IELTS 8.0 vocabulary from Anki"
```

---

### Task 2: Project Scaffolding & Procedural Web Audio Engine

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/index.css`, `src/main.tsx`
- Create: `src/audio/soundEngine.ts`
- Test: `src/audio/__tests__/soundEngine.test.ts` or node test runner

**Interfaces:**
- Produces: `soundEngine`:
  - `playAttackSound()`
  - `playMagicSound()`
  - `playCritSound()`
  - `playHurtSound()`
  - `playVictorySound()`
  - `playDefeatSound()`
  - `playCoinSound()`
  - `playLevelUpSound()`
  - `toggleMute()`

- [ ] **Step 1: Scaffold Vite + React + TypeScript + Tailwind project**
Install dependencies (`react`, `react-dom`, `lucide-react`, `canvas-confetti`, `clsx`, `tailwind-merge`, and dev dependencies).

- [ ] **Step 2: Implement procedural Web Audio synthesizer in `src/audio/soundEngine.ts`**
Generate synth tones using `AudioContext` (oscillators, gain nodes, frequency sweeps, noise buffers) for all RPG SFX without external audio files.

- [ ] **Step 3: Verify sound engine compiles and exports cleanly**
Run: `npm run build` or `npx tsc --noEmit`
Expected: PASS with zero errors.

- [ ] **Step 4: Git commit**
```bash
git add package.json tsconfig.json vite.config.ts src/
git commit -m "feat(audio): scaffold app and create procedural Web Audio synthesizer"
```

---

### Task 3: RPG Core Models, SRS Engine, & State Store

**Files:**
- Create: `src/types/game.ts`
- Create: `src/types/vocab.ts`
- Create: `src/store/gameStore.ts`
- Test: `src/store/__tests__/gameStore.test.ts`

**Interfaces:**
- `PlayerState`: `{ level: number, exp: number, maxExp: number, hp: number, maxHp: number, gold: number, inventory: InventoryItem[], equipped: Equipment, stats: Stats }`
- `SRSProgress`: `{ [wordId: string]: { box: number, nextReview: number, streak: number, mistakes: number } }`
- Actions: `gainExp(amount)`, `gainGold(amount)`, `takeDamage(amount)`, `heal(amount)`, `recordWordResult(wordId, isCorrect)`, `buyItem(item)`, `equipItem(item)`

- [ ] **Step 1: Write type definitions in `src/types/game.ts` and `src/types/vocab.ts`**
- [ ] **Step 2: Implement state store and SRS Leitner algorithm in `src/store/gameStore.ts`**
Handles Level calculation formula: `Math.floor(100 * Math.pow(1.25, level - 1))`, HP scaling, equipment stat bonuses, and Leitner box promotion (1->5) or demotion upon mistake. Persists in `localStorage`.
- [ ] **Step 3: Write test script to verify state transitions & SRS math**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Git commit**
```bash
git add src/types/ src/store/
git commit -m "feat(store): implement RPG character store and SRS progression engine"
```

---

### Task 4: Monster Generator & Turn-Based Combat Arena

**Files:**
- Create: `src/combat/monsterGenerator.ts`
- Create: `src/components/CombatArena.tsx`
- Create: `src/components/BattleActions.tsx`
- Create: `src/components/BattleFeedback.tsx`

**Interfaces:**
- Consumes: `VocabWord`, `PlayerState`, `soundEngine`, `gameStore`
- Produces: Complete combat screen with:
  - Monster banner & animated SVG/CSS health bar
  - Hero status & MP/HP gauges
  - 3 action tabs:
    1. `Cloze Strike`: Fill in blank in IELTS example sentence (Type or Smart Pick)
    2. `Collocation Combo`: Match the collocate phrase
    3. `Synonym Ward`: Identify synonymous term for shield/parry
  - Floating damage numbers & screen shake on strike
  - Web Speech API pronunciation on every spell cast

- [ ] **Step 1: Implement `src/combat/monsterGenerator.ts`**
Generate realm-themed monsters with distinct names, descriptions, elemental avatars, and stats scaled to floor and player level.
- [ ] **Step 2: Build `src/components/BattleActions.tsx`**
Create interactive input widgets for Cloze, Collocation combo, and Synonym matching with smart distractors generated from the same realm.
- [ ] **Step 3: Build `src/components/CombatArena.tsx`**
Connect turn loop: Player Turn -> Action Resolution -> Damage -> Monster Turn -> Win/Loss evaluation.
- [ ] **Step 4: Test combat loop with simulated turns**
- [ ] **Step 5: Git commit**
```bash
git add src/combat/ src/components/CombatArena.tsx src/components/BattleActions.tsx
git commit -m "feat(combat): implement turn-based vocabulary combat arena"
```

---

### Task 5: World Map & Biome Selection (IELTS Realms)

**Files:**
- Create: `src/components/WorldMap.tsx`
- Create: `src/components/RealmCard.tsx`
- Create: `src/components/HeaderNav.tsx`

**Interfaces:**
- Consumes: `public/data/anki_vocab.json`, `gameStore`
- Displays all 12 biomes (Education, Environment, Tech, Health, Crime, AWL, etc.) with card count, mastery percentage, recommended level, and enter button.

- [ ] **Step 1: Implement `src/components/WorldMap.tsx` with realm icons and progress indicators**
- [ ] **Step 2: Implement audio pronunciation preview button on hover/click**
- [ ] **Step 3: Add biome difficulty scaling and unlock criteria**
- [ ] **Step 4: Verify navigation between World Map and Combat Arena**
- [ ] **Step 5: Git commit**
```bash
git add src/components/WorldMap.tsx src/components/RealmCard.tsx
git commit -m "feat(world): implement realm selection map and progression tracking"
```

---

### Task 6: The Grimoire (Lexical Bestiary) & Shop System

**Files:**
- Create: `src/components/Grimoire.tsx`
- Create: `src/components/Shop.tsx`
- Create: `src/data/shopItems.ts`

**Interfaces:**
- `Grimoire`: Search bar, filter by realm, filter by mastery level, listen to audio button, full definition, collocations, examples.
- `Shop`: Weapons (e.g. *Excalibur of Vocabulary*, +ATK), Shields (*Aegis of Accuracy*, reduces mistake damage), Potions (Health, Mana, Hint Elixir).

- [ ] **Step 1: Implement `src/data/shopItems.ts` with balanced RPG equipment and consumables**
- [ ] **Step 2: Implement `src/components/Shop.tsx` with purchase and equip logic**
- [ ] **Step 3: Implement `src/components/Grimoire.tsx` with instant search, filtering, and TTS pronunciation**
- [ ] **Step 4: Verify shop transactions deduct gold and apply equipment stat bonuses**
- [ ] **Step 5: Git commit**
```bash
git add src/data/shopItems.ts src/components/Shop.tsx src/components/Grimoire.tsx
git commit -m "feat(rpg): implement shop equipment and lexical grimoire codex"
```

---

### Task 7: Full Integration, Asset Polish, & Launch Verification

**Files:**
- Modify: `src/App.tsx`
- Test: Full end-to-end user verification
- Create: `README.md` and start script `run_game.bat`

- [ ] **Step 1: Assemble all screens into `src/App.tsx` (World Map, Combat, Grimoire, Shop, Character Modal)**
- [ ] **Step 2: Add keyboard shortcuts (Enter to submit, 1-4 for quick selection, Space to replay audio pronunciation)**
- [ ] **Step 3: Add confetti animation on dungeon clear and level up**
- [ ] **Step 4: Create one-click launcher `run_game.bat` for instant local play**
- [ ] **Step 5: Verify build with `npm run build` and run local dev server**
- [ ] **Step 6: Git commit & launch game**
```bash
git add .
git commit -m "feat(game): finalize Lexicon Quest RPG with launcher and instructions"
```
