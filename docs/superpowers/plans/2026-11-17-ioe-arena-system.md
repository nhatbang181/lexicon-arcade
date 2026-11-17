# IOE Arena: IELTS 8.0 Olympic System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the 1,499 Anki IELTS 8.0 vocabulary cards into a gamified IOE (Olympic Tiếng Anh) interactive suite featuring 4 distinct question rounds (Letter Scramble, Collocation Matching, Audio Listening, Context Cloze) with combo streaks, 3-heart life system, timer countdowns, and an automated Mistake Bank (SRS).

**Architecture:** A modular React 19 + TypeScript component architecture integrated into the existing Vite app. Uses `public/data/anki_vocab.json` as the linguistic database, procedural Web Audio for arcade feedback, Web Speech API for phonetics, and Kenney pixel UI frames for retro arcade polish.

**Tech Stack:** React 19 / TypeScript / Vite / Tailwind CSS / Web Audio API / Web Speech API / Canvas Confetti / Kenney Pixel UI Assets

**Spec:** `docs/superpowers/specs/2026-11-17-ioe-arena-spec.md`

## Global Constraints
- Target directory: `d:\English`
- Operating System: Windows 11 with PowerShell
- Data source: `public/data/anki_vocab.json` (1,499 clean IELTS 8.0 words across 12 realms)
- Assets: Kenney Pixel UI (`/assets/ui/frame_brown.png`, `frame_grey.png`, `btn_yellow.png`, `btn_blue.png`, etc.)
- Audio: Procedural Web Audio synth + Web Speech API (no broken network audio)

## Review Focus
1. Scrambled letters must always be valid anagrams of the target word and handle multi-word phrases cleanly.
2. Collocation matching pairs must generate clean splits without syntax errors even if Anki field has delimiters.
3. Audio Listening must fall back gracefully if Web Speech is paused or busy.
4. Mistake Bank must correctly persist to `localStorage` and filter out mastered cards.
5. All rounds must fit desktop screens cleanly without awkward vertical scrolling.

---

### Task 1: IOE Question Generation Engine

**Files:**
- Create: `src/ioe/questionGenerator.ts`
- Test: `scripts/test_ioe_engine.js`

**Interfaces:**
- Produces:
  - `generateScrambleQuestion(word: VocabWord): ScrambleQuestion`
  - `generateMatchingPairs(words: VocabWord[]): MatchingRoundData`
  - `generateAudioQuestion(word: VocabWord): AudioQuestion`
  - `generateClozeQuestion(word: VocabWord, realmWords: VocabWord[]): ClozeQuestion`

- [ ] **Step 1: Write test script `scripts/test_ioe_engine.js`**
- [ ] **Step 2: Run test to verify it fails before implementation**
- [ ] **Step 3: Implement `src/ioe/questionGenerator.ts`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Git commit**

---

### Task 2: Round 1 — Defeat the Word (Sắp Xếp Ký Tự)

**Files:**
- Create: `src/components/ioe/WordScrambleRound.tsx`

**Interfaces:**
- Interactive letter tiles that can be clicked or typed via physical keyboard.
- Displays meaning in Vietnamese, POS badge, example sentence with blank.
- Backspace / Reset buttons, time countdown bar.
- On solve: plays chime, speaks English word, awards points with combo multiplier.

- [ ] **Step 1: Implement `src/components/ioe/WordScrambleRound.tsx`**
- [ ] **Step 2: Add keyboard event listeners for instant typing support**
- [ ] **Step 3: Verify build with `npm run build`**
- [ ] **Step 4: Git commit**

---

### Task 3: Round 2 — Matching Pairs (Cặp Bài Trùng Collocation)

**Files:**
- Create: `src/components/ioe/MatchingPairsRound.tsx`

**Interfaces:**
- 12-card grid (6 matching pairs).
- Supports Collocation Pairs (`rely on` <-> `rote learning`) & Synonym Pairs (`curriculum` <-> `syllabus`).
- Flip animations, error shake, combo match fanfare.

- [ ] **Step 1: Implement `src/components/ioe/MatchingPairsRound.tsx`**
- [ ] **Step 2: Add combo streak multipliers and match feedback**
- [ ] **Step 3: Verify build with `npm run build`**
- [ ] **Step 4: Git commit**

---

### Task 4: Rounds 3 & 4 — Audio Listening & Context Cloze

**Files:**
- Create: `src/components/ioe/AudioListeningRound.tsx`
- Create: `src/components/ioe/ContextClozeRound.tsx`

**Interfaces:**
- `AudioListeningRound`: Audio button (Normal 1.0x & Slow 0.8x), sentence cloze input, IPA reveal.
- `ContextClozeRound`: Authentic IELTS sentence with missing word, 4 smart distractors, detailed linguistic breakdown on answer.

- [ ] **Step 1: Implement `src/components/ioe/AudioListeningRound.tsx`**
- [ ] **Step 2: Implement `src/components/ioe/ContextClozeRound.tsx`**
- [ ] **Step 3: Verify build with `npm run build`**
- [ ] **Step 4: Git commit**

---

### Task 5: IOE Arena Game Loop, HUD, & Mistake Bank

**Files:**
- Create: `src/components/ioe/IOEGameHUD.tsx`
- Create: `src/components/ioe/IOEArenaGame.tsx`
- Create: `src/components/ioe/IOERoundSummary.tsx`
- Create: `src/components/ioe/MistakeBankModal.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Orchestrates the 4 rounds sequentially or allows practice mode.
- Tracks 3 Hearts (❤️❤️❤️), Score, Combo Multiplier, Round progress.
- Mistake Bank: records all failed questions in `localStorage`, allows targeted 1-click review.

- [ ] **Step 1: Build `src/components/ioe/IOEGameHUD.tsx` with hearts, timer, combo bar, score**
- [ ] **Step 2: Build `src/components/ioe/IOEArenaGame.tsx` managing rounds transition**
- [ ] **Step 3: Build `src/components/ioe/IOERoundSummary.tsx` with medal awards & confetti**
- [ ] **Step 4: Build `src/components/ioe/MistakeBankModal.tsx` for SRS review**
- [ ] **Step 5: Integrate into `src/App.tsx` as primary game mode**
- [ ] **Step 6: Git commit**

---

### Task 6: Full Verification & Launch

**Files:**
- Verify: Full TypeScript compilation & Vite bundle
- Update: `README.md` and start script `run_game.bat`

- [ ] **Step 1: Run `npm run build` to ensure 100% clean bundle**
- [ ] **Step 2: Verify in-browser operation at `http://localhost:5173`**
- [ ] **Step 3: Git commit & launch update**
