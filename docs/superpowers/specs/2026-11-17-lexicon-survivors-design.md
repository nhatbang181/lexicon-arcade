# LEXICON SURVIVORS: 2D Roguelike Action RPG — Specification

## 1. Vision & Core Philosophy
Transform IELTS 8.0 Anki vocabulary into a genuine, highly addictive 2D Top-Down Action Roguelike (in the style of *Vampire Survivors* meets *The Typing of the Dead* / *Binding of Isaac*). 

The player physically moves a pixel hero across a procedural 2D dungeon using **WASD / Arrow Keys**, dodging swarms of animated monsters (rendered with Kenney CC0 16x16 pixel sprites). 
Vocabulary learning is woven directly into gameplay through **Lexical Runes, Boss Barriers, and Spell Blasts**:
- Elite monsters and bosses spawn with IELTS 8.0 context cloze & collocation barriers. Solving/shattering them triggers screen-clearing AoE spells (Chain Lightning, Meteor Storm, Holy Nova).
- Ancient Shrines & Treasure Chests scattered across the map drop legendary weapons upon solving lexical runes.
- Native English text-to-speech audio pronounces every encountered word at moments of peak dopamine (boss kills, level ups, chest unlocks).

---

## 2. Gameplay Systems

### 2.1 2D Game Engine (HTML5 Canvas 60 FPS)
- **Controls**: WASD / Arrow Keys for smooth 8-directional movement. Spacebar / Click for burst spells.
- **Rendering**: Real-time canvas renderer slicing 16x16 tiles from `public/roguelike_sheet.png`:
  - Dungeon floors, walls, columns, torches with flickering light.
  - Player character with walking animations, direction facing, and slash VFX.
  - 8+ Monster types (Slimes, Bats, Skeletons, Orcs, Ghosts, Necromancers, Golems, Boss Wyrms) with distinct movement speeds and AI tracking.
- **Juice & Feel**:
  - Screen shake on impacts and explosions.
  - Particle spray when enemies die or gems are collected.
  - Floating damage numbers (white for normal, gold for critical hits).
  - Meaty procedural Web Audio SFX (swords, hits, level up, gem chime).

### 2.2 Roguelike Combat & Weapons
- **Auto-Weapons & Orbitals**:
  - *Academic Quill Dagger*: Rapidly stabs the nearest enemy.
  - *Lexicon Orb*: Orbits around the player damaging all enemies that touch it.
  - *Chain Lightning*: Zaps multiple enemies periodically.
  - *Garlic Holy Aura*: Deals continuous damage to surrounding swarms.
- **EXP & Upgrades**:
  - Defeated monsters drop glowing EXP gems.
  - Leveling up pauses the action and presents 3 Roguelike powerups (Weapon upgrades, Speed Boots, Magnet, Max HP, Attack Power).

### 2.3 IELTS 8.0 Learning Integration
- **Rune Barriers (Elite & Boss Foes)**:
  - Mini-bosses arrive carrying a glowing Word Barrier (showing context sentence with blank or collocation).
  - Answering the prompt (either quick hotkey 1-4 or typing) detonates the barrier, dealing 500+ AoE explosion damage to all nearby enemies!
- **Ancient Chests**:
  - Scattered in dungeon rooms. Interacting presents a word definition/collocation clue. Opening grants rare relics and massive gold.
- **Spaced Repetition (SRS Leitner tracking)**:
  - Mistakes are recorded in `localStorage`. Words missed become "Nemesis Bosses" in future runs.
- **Audio Phonetics**:
  - Web Speech API speaks words with native English accent on barrier breaches.

---

## 3. Tech Stack & Architecture
- **Language**: TypeScript + React 19 + HTML5 Canvas
- **Renderer**: Pure high-performance Canvas 2D engine with sprite batching and camera tracking
- **Assets**: Kenney CC0 Roguelike Spritesheet (`public/roguelike_sheet.png`)
- **Audio**: Procedural Web Audio Engine + Web Speech API
- **Data**: 1,499 IELTS 8.0 words in `public/data/anki_vocab.json`
