# Lexicon Survivors: 2D Roguelike Action RPG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a genuine 2D Top-Down Roguelike Action RPG ("Lexicon Survivors") using HTML5 Canvas and Kenney CC0 pixel art sprites, where the player actively moves a hero with WASD/Arrow keys, dodges monster swarms, levels up auto-weapons, and detonates screen-clearing AoE spells by solving IELTS 8.0 context barriers and runes.

**Architecture:** A high-performance 60 FPS HTML5 Canvas 2D engine rendered directly inside a React 19 application. Uses `public/roguelike_sheet.png` for pixel-art tilemaps, heroes, monsters, weapons, and particle effects. Backed by procedural Web Audio SFX and Web Speech API phonetics. Vocabulary data is dynamically pulled from the 1,499 Anki IELTS words in `public/data/anki_vocab.json`.

**Tech Stack:** TypeScript / React 19 / HTML5 Canvas 2D / Vite / Tailwind CSS / Kenney CC0 Roguelike Assets / Web Audio API / Web Speech API

**Spec:** `docs/superpowers/specs/2026-11-17-lexicon-survivors-design.md`

## Global Constraints
- Target directory: `d:\English`
- Operating System: Windows 11 with PowerShell
- Data source: `public/data/anki_vocab.json` (1,499 clean IELTS 8.0 cards)
- Spritesheet: `public/roguelike_sheet.png` (968 x 526, 17px grid tile step)
- Must be a real playable video game with fluid 60 FPS movement, collision, camera tracking, enemy AI, and juicy audio-visual feedback.

## Review Focus
1. Canvas rendering must maintain pixel-crisp art (`imageSmoothingEnabled = false`) with 3x scale.
2. Collision detection must smoothly slide against dungeon walls rather than sticking.
3. Swarm performance must maintain smooth 60 FPS with 50+ simultaneous enemies and particles.
4. Lexical barriers must integrate naturally into combat without interrupting the player's movement flow (e.g. quick numeric keys 1-4 or prompt popouts).
5. Audio pronunciation (Web Speech API) must play reliably without overlapping or blocking game loop frames.

---

### Task 1: Kenney Sprite Slicer & Canvas Rendering Engine

**Files:**
- Create: `src/game/spriteAtlas.ts`
- Create: `src/game/canvasRenderer.ts`
- Test: `scripts/test_sprites.js`

**Interfaces:**
- `SpriteCoord`: `{ col: number, row: number, width?: number, height?: number }`
- Named sprites:
  - Hero: `HERO_IDLE`, `HERO_WALK`
  - Tiles: `FLOOR_STONE`, `WALL_TOP`, `WALL_FRONT`, `DOOR`, `CHEST_CLOSED`, `CHEST_OPEN`
  - Enemies: `MONSTER_SLIME`, `MONSTER_BAT`, `MONSTER_SKELETON`, `MONSTER_ORC`, `MONSTER_GHOST`, `MONSTER_BOSS`
  - Items/VFX: `GEM_BLUE`, `GEM_RED`, `ORB`, `SWORD`, `LIGHTNING`
- Slicer function: `drawSprite(ctx, spriteKey, x, y, size, flipX)`

- [ ] **Step 1: Write `src/game/spriteAtlas.ts` with exact tile coordinates in Kenney 17px grid**
- [ ] **Step 2: Implement canvas drawing utilities in `src/game/canvasRenderer.ts`**
- [ ] **Step 3: Write test script to verify all sprite coordinates are within sheet dimensions**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Git commit**

---

### Task 2: 2D Procedural Dungeon, Camera, & Player Movement

**Files:**
- Create: `src/game/dungeonGenerator.ts`
- Create: `src/game/camera.ts`
- Create: `src/game/player.ts`

**Interfaces:**
- `DungeonMap`: `{ width: number, height: number, tiles: number[][], rooms: Rect[], spawnPoint: Point, chests: Point[] }`
- `Player`: `{ x: number, y: number, vx: number, vy: number, hp: number, maxHp: number, speed: number, facing: 'left' | 'right' }`
- `Camera`: `{ x: number, y: number, follow(targetX, targetY, mapW, mapH, viewportW, viewportH) }`

- [ ] **Step 1: Implement procedural dungeon generator in `src/game/dungeonGenerator.ts`**
- [ ] **Step 2: Implement camera tracking and boundary clamping in `src/game/camera.ts`**
- [ ] **Step 3: Implement player entity with 8-direction WASD movement and AABB wall collisions in `src/game/player.ts`**
- [ ] **Step 4: Verify dungeon generation and wall collision logic via node test**
- [ ] **Step 5: Git commit**

---

### Task 3: Swarm Enemy AI, Auto-Weapons, & Roguelite Upgrades

**Files:**
- Create: `src/game/enemyManager.ts`
- Create: `src/game/weaponManager.ts`
- Create: `src/game/particleSystem.ts`

**Interfaces:**
- `Enemy`: `{ id: number, type: string, x: number, y: number, hp: number, maxHp: number, speed: number, damage: number, isElite: boolean }`
- `Weapon`: `OrbitingOrbs`, `DaggerSlash`, `ChainLightning`, `HolyAura`
- `Particle`: Blood/spark particles with velocity, gravity, lifespan, and color.
- Drop EXP gems on enemy death; magnet collect when player approaches.

- [ ] **Step 1: Implement EnemyManager with swarm tracking and spawning waves**
- [ ] **Step 2: Implement WeaponManager with auto-targeting and orbiting orbs**
- [ ] **Step 3: Implement ParticleSystem for juicy hit and death explosions**
- [ ] **Step 4: Implement EXP collection and in-game Level-Up upgrade selection**
- [ ] **Step 5: Git commit**

---

### Task 4: IELTS 8.0 Lexical Barrier & Screen-Clearing Runes

**Files:**
- Create: `src/game/lexicalBarrier.ts`
- Create: `src/components/LexicalEventModal.tsx`
- Modify: `src/game/enemyManager.ts`

**Interfaces:**
- `LexicalBarrier`: Attached to Elite monsters and ancient chests.
  - Shows cloze sentence with missing word or collocation prompt.
  - When breached:
    - Casts massive AoE detonation (500+ damage to all visible enemies).
    - Speaks word via `speakEnglish()`.
    - Drops high-tier loot/gold.
    - Records in SRS Leitner memory.

- [ ] **Step 1: Implement lexical barrier spawning and trigger logic**
- [ ] **Step 2: Connect Web Speech API audio for instant phonetic pronunciation on barrier breach**
- [ ] **Step 3: Test barrier resolution and damage radius**
- [ ] **Step 4: Git commit**

---

### Task 5: 2D Game Canvas Component & UI HUD

**Files:**
- Create: `src/components/GameCanvas.tsx`
- Create: `src/components/GameHUD.tsx`
- Create: `src/components/GameOverModal.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Full-screen 60 FPS game loop using `requestAnimationFrame`.
- Pixel-styled HUD:
  - Health bar & EXP bar
  - Active weapons icons
  - Kill counter & Survival timer (e.g. `04:25`)
  - Floating IELTS Lexical Barrier prompt
  - Sound & Pause controls

- [ ] **Step 1: Build `src/components/GameCanvas.tsx` integrating game loop, renderer, player, enemies, and weapons**
- [ ] **Step 2: Build `src/components/GameHUD.tsx` and modal overlays**
- [ ] **Step 3: Assemble into `src/App.tsx` with smooth start/run transition**
- [ ] **Step 4: Git commit**

---

### Task 6: Build Verification, Audio Engine Polish, & Run Validation

**Files:**
- Verify: Full TypeScript compilation & Vite production bundle
- Test: In-browser 60 FPS live test

- [ ] **Step 1: Run `npm run build` to verify zero errors across all modules**
- [ ] **Step 2: Verify game responds at `http://localhost:5173`**
- [ ] **Step 3: Git commit & launch update**
