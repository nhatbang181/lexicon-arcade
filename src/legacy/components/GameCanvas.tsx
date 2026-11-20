import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Realm, VocabWord } from '../types/vocab.ts';
import { generateDungeon, TILE_PX, DungeonData } from '../game/dungeonGenerator.ts';
import { Camera } from '../game/camera.ts';
import { PlayerEntity, PlayerInput } from '../game/player.ts';
import { EnemyManager, EnemyEntity } from '../game/enemyManager.ts';
import { WeaponManager } from '../game/weaponManager.ts';
import { ParticleSystem } from '../game/particleSystem.ts';
import { canvasRenderer } from '../game/canvasRenderer.ts';
import { soundEngine } from '../audio/soundEngine.ts';
import { speakEnglish } from '../utils/speech.ts';
import { createBarrierPrompt, BarrierPrompt } from '../game/lexicalBarrier.ts';
import { GameHUD } from './GameHUD.tsx';
import { LexicalEventModal } from './LexicalEventModal.tsx';
import { LevelUpModal } from './LevelUpModal.tsx';
import { GameOverModal } from './GameOverModal.tsx';
import { gameStore } from '../store/gameStore.ts';

interface GameCanvasProps {
  realm: Realm;
  onExit: () => void;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  isCrit: boolean;
  alpha: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ realm, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game Engine State Refs
  const dungeonRef = useRef<DungeonData>(generateDungeon(42, 42));
  const playerRef = useRef<PlayerEntity>(
    new PlayerEntity(dungeonRef.current.spawnPoint.x, dungeonRef.current.spawnPoint.y)
  );
  const cameraRef = useRef<Camera>(new Camera(800, 600));
  const enemyManagerRef = useRef<EnemyManager>(new EnemyManager());
  const weaponManagerRef = useRef<WeaponManager>(new WeaponManager());
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const inputRef = useRef<PlayerInput>({ up: false, down: false, left: false, right: false });

  // UI state
  const [hudHp, setHudHp] = useState(100);
  const [hudMaxHp, setHudMaxHp] = useState(100);
  const [hudLevel, setHudLevel] = useState(1);
  const [hudExp, setHudExp] = useState(0);
  const [hudMaxExp, setHudMaxExp] = useState(50);
  const [hudKills, setHudKills] = useState(0);
  const [hudGold, setHudGold] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());
  const [activeBarrier, setActiveBarrier] = useState<BarrierPrompt | null>(null);
  const [levelUpPending, setLevelUpPending] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [wordsSolvedCount, setWordsSolvedCount] = useState(0);

  const activeBarrierEnemyId = useRef<string | null>(null);

  // Sync keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW', 'w', 'W'].includes(e.code)) inputRef.current.up = true;
      if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code)) inputRef.current.down = true;
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code)) inputRef.current.left = true;
      if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code)) inputRef.current.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW', 'w', 'W'].includes(e.code)) inputRef.current.up = false;
      if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code)) inputRef.current.down = false;
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code)) inputRef.current.left = false;
      if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code)) inputRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle Lexical Barrier Resolution (Smart Bomb AoE!)
  const handleSolveBarrier = useCallback((isCorrect: boolean) => {
    if (!activeBarrier) return;

    // Record in Spaced Repetition engine
    gameStore.recordWordResult(activeBarrier.word.id, isCorrect);

    if (isCorrect) {
      soundEngine.playCritSound();
      speakEnglish(activeBarrier.word.word);

      // SMART BOMB: Kill or heavily damage all enemies in 450px radius!
      const player = playerRef.current;
      const em = enemyManagerRef.current;
      const ps = particleSystemRef.current;

      ps.emit(player.x, player.y, '#f59e0b', 35, 220); // Golden shockwave
      ps.emit(player.x, player.y, '#a855f7', 25, 180);

      // Damage all nearby enemies
      for (let i = em.enemies.length - 1; i >= 0; i--) {
        const e = em.enemies[i];
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < 420) {
          e.hp -= 600;
          if (e.hp <= 0) {
            em.killEnemy(i);
            player.kills += 1;
            player.gold += 15;
            ps.emit(e.x, e.y, '#ef4444', 12, 120);
          }
        }
      }

      player.gold += 35;
      setWordsSolvedCount(prev => prev + 1);
      floatingTextsRef.current.push({
        id: Date.now(),
        text: `⚡ LEXICAL BURST! "${activeBarrier.word.word.toUpperCase()}"`,
        x: player.x,
        y: player.y - 30,
        color: '#fbbf24',
        isCrit: true,
        alpha: 1.0
      });
    } else {
      soundEngine.playBuzzerSound();
      playerRef.current.takeDamage(20);
      floatingTextsRef.current.push({
        id: Date.now(),
        text: `❌ RECALL MISSED! (-20 HP)`,
        x: playerRef.current.x,
        y: playerRef.current.y - 25,
        color: '#ef4444',
        isCrit: false,
        alpha: 1.0
      });
    }

    setActiveBarrier(null);
    activeBarrierEnemyId.current = null;
  }, [activeBarrier]);

  // Handle Roguelike Level-Up Upgrade Selection
  const handleSelectUpgrade = (upgradeId: string) => {
    const wm = weaponManagerRef.current;
    const player = playerRef.current;

    if (upgradeId === 'add_orb') {
      wm.state.orbCount = Math.min(6, wm.state.orbCount + 1);
    } else if (upgradeId === 'boost_dagger') {
      wm.state.daggerDamage = Math.round(wm.state.daggerDamage * 1.35);
      wm.state.daggerCooldown = Math.max(0.35, wm.state.daggerCooldown * 0.85);
    } else if (upgradeId === 'boost_lightning') {
      wm.state.lightningDamage = Math.round(wm.state.lightningDamage * 1.4);
      wm.state.lightningCooldown = Math.max(1.0, wm.state.lightningCooldown * 0.75);
    } else if (upgradeId === 'boost_speed') {
      player.speed = Math.round(player.speed * 1.2);
    } else if (upgradeId === 'boost_health') {
      player.maxHp += 25;
      player.heal(60);
    } else if (upgradeId === 'gold_bounty') {
      player.gold += 80;
    }

    soundEngine.playLevelUpSound();
    setLevelUpPending(null);
  };

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);

      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dungeon = dungeonRef.current;
      const player = playerRef.current;
      const camera = cameraRef.current;
      const em = enemyManagerRef.current;
      const wm = weaponManagerRef.current;
      const ps = particleSystemRef.current;

      // Handle pause during Level Up or Game Over
      if (levelUpPending !== null || isGameOver) {
        return;
      }

      setElapsedTime(prev => prev + dt);

      // 1. UPDATE PLAYER
      player.update(dt, inputRef.current, dungeon);

      // Check chest interaction
      for (const chest of dungeon.chests) {
        if (!chest.opened) {
          const d = Math.hypot(chest.x - player.x, chest.y - player.y);
          if (d < 30 && !activeBarrier) {
            chest.opened = true;
            soundEngine.playCoinSound();
            const randomWord = realm.words[Math.floor(Math.random() * realm.words.length)];
            setActiveBarrier(createBarrierPrompt(randomWord, realm.words, 'chest'));
            break;
          }
        }
      }

      // 2. UPDATE CAMERA
      camera.update(
        player.x,
        player.y,
        dungeon.width * TILE_PX,
        dungeon.height * TILE_PX,
        canvas.width,
        canvas.height
      );

      // 3. UPDATE ENEMIES
      em.update(dt, player.x, player.y, dungeon, realm.words);

      // Check enemy collisions with player
      for (const e of em.enemies) {
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < player.radius + e.radius) {
          const took = player.takeDamage(e.damage);
          if (took) {
            soundEngine.playHurtSound();
            ps.emit(player.x, player.y, '#ef4444', 6, 80);
          }
        }

        // Trigger Elite Lexical Barrier when approaching
        if (e.isElite && e.barrierWord && !activeBarrier && dist < 220 && activeBarrierEnemyId.current !== e.id) {
          activeBarrierEnemyId.current = e.id;
          setActiveBarrier(createBarrierPrompt(e.barrierWord, realm.words, 'elite'));
        }
      }

      // 4. UPDATE WEAPONS & COLLISION
      wm.update(dt, player.x, player.y, em.enemies, (enemyIdx, damage, isCrit) => {
        const e = em.enemies[enemyIdx];
        if (!e) return;

        e.hp -= damage;
        e.hitFlashTimer = 0.12;

        floatingTextsRef.current.push({
          id: Date.now() + Math.random(),
          text: `-${Math.round(damage)}`,
          x: e.x + (Math.random() - 0.5) * 15,
          y: e.y - 12,
          color: isCrit ? '#fbbf24' : '#f87171',
          isCrit,
          alpha: 1.0
        });

        ps.emit(e.x, e.y, isCrit ? '#fbbf24' : '#ef4444', 4, 70);

        if (e.hp <= 0) {
          em.killEnemy(enemyIdx);
          player.kills += 1;
          player.gold += e.isElite ? 20 : 3;
          ps.emit(e.x, e.y, '#fbbf24', 12, 130);
          soundEngine.playCoinSound();
        }
      });

      // 5. EXP GEM PICKUP
      for (let i = em.gems.length - 1; i >= 0; i--) {
        const g = em.gems[i];
        if (Math.hypot(g.x - player.x, g.y - player.y) < player.radius + 12) {
          em.gems.splice(i, 1);
          soundEngine.playCoinSound();
          ps.emit(player.x, player.y, '#38bdf8', 4, 60);
          const didLevel = player.addExp(g.value);
          if (didLevel) {
            soundEngine.playLevelUpSound();
            setLevelUpPending(player.level);
          }
        }
      }

      // Check player death
      if (player.hp <= 0 && !isGameOver) {
        soundEngine.playDefeatSound();
        setIsGameOver(true);
      }

      // 6. UPDATE PARTICLES & TEXTS
      ps.update(dt);
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= dt * 28;
        ft.alpha -= dt * 1.5;
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // Sync HUD
      setHudHp(player.hp);
      setHudMaxHp(player.maxHp);
      setHudLevel(player.level);
      setHudExp(player.exp);
      setHudMaxExp(player.maxExp);
      setHudKills(player.kills);
      setHudGold(player.gold);

      // ==========================================
      // 7. RENDER PASS (CANVAS 60 FPS)
      // ==========================================
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // A. Draw Dungeon Tiles
      const startTileX = Math.max(0, Math.floor(camera.x / TILE_PX));
      const endTileX = Math.min(dungeon.width - 1, Math.ceil((camera.x + canvas.width) / TILE_PX));
      const startTileY = Math.max(0, Math.floor(camera.y / TILE_PX));
      const endTileY = Math.min(dungeon.height - 1, Math.ceil((camera.y + canvas.height) / TILE_PX));

      for (let ty = startTileY; ty <= endTileY; ty++) {
        for (let tx = startTileX; tx <= endTileX; tx++) {
          const tile = dungeon.tiles[ty][tx];
          const screenX = tx * TILE_PX - camera.x;
          const screenY = ty * TILE_PX - camera.y;

          if (tile === 1) {
            // Floor
            canvasRenderer.drawSprite(ctx, 'FLOOR', screenX, screenY, TILE_PX);
          } else if (tile === 2) {
            // Wall
            canvasRenderer.drawSprite(ctx, 'WALL_TOP', screenX, screenY, TILE_PX);
          }
        }
      }

      // B. Draw Chests
      for (const chest of dungeon.chests) {
        if (camera.isVisible(chest.x, chest.y)) {
          const sx = chest.x - camera.x;
          const sy = chest.y - camera.y;
          canvasRenderer.drawSprite(
            ctx,
            chest.opened ? 'CHEST_OPEN' : 'CHEST_CLOSED',
            sx - 16,
            sy - 16,
            32
          );
        }
      }

      // C. Draw EXP Gems
      for (const g of em.gems) {
        if (camera.isVisible(g.x, g.y)) {
          const sx = g.x - camera.x;
          const sy = g.y - camera.y;
          const gemSprite = g.type === 'gold' ? 'GEM_GOLD' : g.type === 'red' ? 'GEM_RED' : 'GEM_BLUE';
          canvasRenderer.drawSprite(ctx, gemSprite, sx - 8, sy - 8, 16);
        }
      }

      // D. Draw Enemies
      for (const e of em.enemies) {
        if (camera.isVisible(e.x, e.y)) {
          const sx = e.x - camera.x - 16;
          const sy = e.y - camera.y - 16;

          canvasRenderer.drawSprite(
            ctx,
            e.type,
            sx,
            sy,
            e.isElite ? 42 : 32,
            e.facing === 'left'
          );

          // Enemy health bar
          canvasRenderer.drawHealthBar(ctx, sx, sy - 6, 32, 4, e.hp, e.maxHp, false);

          // Elite Barrier Rune indicator
          if (e.isElite) {
            ctx.save();
            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#fbbf24';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ BARRIER', sx + 16, sy - 10);
            ctx.restore();
          }
        }
      }

      // E. Draw Player Hero
      const playerScreenX = player.x - camera.x;
      const playerScreenY = player.y - camera.y;
      const heroBob = player.isMoving ? Math.sin(player.walkAnimTimer) * 3 : 0;

      canvasRenderer.drawSprite(
        ctx,
        'HERO_KNIGHT',
        playerScreenX - 16,
        playerScreenY - 16 + heroBob,
        32,
        player.facing === 'left'
      );

      // F. Draw Weapons (Orbs, Daggers, Lightning)
      wm.draw(ctx, camera.x, camera.y, player.x, player.y);

      // G. Draw Particles
      ps.draw(ctx, camera.x, camera.y);

      // H. Draw Floating Texts
      for (const ft of floatingTextsRef.current) {
        const sx = ft.x - camera.x;
        const sy = ft.y - camera.y;
        canvasRenderer.drawFloatingText(ctx, ft.text, sx, sy, ft.color, ft.isCrit, ft.alpha);
      }

      // I. Draw Torch Light Vignette
      canvasRenderer.drawLighting(ctx, playerScreenX, playerScreenY, canvas.width, canvas.height, 260);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [realm, activeBarrier, levelUpPending, isGameOver]);

  const toggleSound = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  const handleRestart = () => {
    dungeonRef.current = generateDungeon(42, 42);
    playerRef.current = new PlayerEntity(dungeonRef.current.spawnPoint.x, dungeonRef.current.spawnPoint.y);
    enemyManagerRef.current = new EnemyManager();
    weaponManagerRef.current = new WeaponManager();
    floatingTextsRef.current = [];
    setActiveBarrier(null);
    setLevelUpPending(null);
    setIsGameOver(false);
    setIsVictory(false);
    setElapsedTime(0);
    setWordsSolvedCount(0);
  };

  return (
    <div className="relative w-full h-[calc(100vh-65px)] bg-slate-950 overflow-hidden flex items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        width={960}
        height={640}
        className="border-2 border-slate-800 rounded-3xl shadow-2xl bg-black cursor-crosshair max-w-full max-h-full"
      />

      {/* Retro Game HUD */}
      <GameHUD
        hp={hudHp}
        maxHp={hudMaxHp}
        level={hudLevel}
        exp={hudExp}
        maxExp={hudMaxExp}
        kills={hudKills}
        gold={hudGold}
        elapsedSeconds={elapsedTime}
        weaponState={weaponManagerRef.current.state}
        isMuted={isMuted}
        onToggleMute={toggleSound}
        onPause={() => {}}
      />

      {/* Lexical Event Modal (Barrier / Chest) */}
      {activeBarrier && (
        <LexicalEventModal
          barrier={activeBarrier}
          onSolve={handleSolveBarrier}
          onDismiss={() => setActiveBarrier(null)}
        />
      )}

      {/* Roguelike Level Up Modal */}
      {levelUpPending !== null && (
        <LevelUpModal
          level={levelUpPending}
          onSelectUpgrade={handleSelectUpgrade}
        />
      )}

      {/* Game Over / Victory Modal */}
      {isGameOver && (
        <GameOverModal
          isVictory={isVictory}
          survivalTime={elapsedTime}
          kills={hudKills}
          gold={hudGold}
          wordsSolved={wordsSolvedCount}
          onRestart={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
};
