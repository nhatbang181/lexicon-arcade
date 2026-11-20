import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Realm, VocabWord } from '../types/vocab.ts';
import { generateDungeon, TILE_PX, DungeonData } from '../game/dungeonGenerator.ts';
import { Camera } from '../game/camera.ts';
import { PlayerEntity, PlayerInput } from '../game/player.ts';
import { SoulKnightEngine, SoulKnightMonster } from '../game/soulKnightEngine.ts';
import { soulKnightRenderer } from '../game/soulKnightRenderer.ts';
import { soundEngine } from '../audio/soundEngine.ts';
import { speakEnglish } from '../utils/speech.ts';
import { createBarrierPrompt, BarrierPrompt } from '../game/lexicalBarrier.ts';
import { SoulKnightHUD } from './SoulKnightHUD.tsx';
import { LexicalEventModal } from './LexicalEventModal.tsx';
import { GameOverModal } from './GameOverModal.tsx';
import { gameStore } from '../store/gameStore.ts';
import { soulKnightAssets } from '../game/soulKnightAssets.ts';

interface SoulKnightGameProps {
  realm: Realm;
  onExit: () => void;
}

export const SoulKnightGame: React.FC<SoulKnightGameProps> = ({ realm, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Engine References
  const dungeonRef = useRef<DungeonData>(generateDungeon(38, 38));
  const playerRef = useRef<PlayerEntity>(
    new PlayerEntity(dungeonRef.current.spawnPoint.x, dungeonRef.current.spawnPoint.y)
  );
  const cameraRef = useRef<Camera>(new Camera(960, 640));
  const engineRef = useRef<SoulKnightEngine>(new SoulKnightEngine());

  // Mouse & Input References
  const inputRef = useRef<PlayerInput>({ up: false, down: false, left: false, right: false });
  const mouseScreenRef = useRef<{ x: number; y: number }>({ x: 480, y: 320 });
  const isMouseDownRef = useRef<boolean>(false);

  // UI state
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());
  const [activeBarrier, setActiveBarrier] = useState<BarrierPrompt | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [wordsSolved, setWordsSolved] = useState(0);
  const [hudTick, setHudTick] = useState(0); // force HUD re-renders

  // Spawn initial room monsters
  useEffect(() => {
    const dungeon = dungeonRef.current;
    const engine = engineRef.current;
    engine.monsters = [];

    // Populate rooms with Skeletons, Goblins, Ogres, and Boss
    dungeon.rooms.forEach((room, idx) => {
      if (idx === 0) return; // Skip spawn room

      const isBossRoom = idx === dungeon.rooms.length - 1;
      const count = isBossRoom ? 1 : Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < count; i++) {
        const mx = (room.x + Math.floor(Math.random() * (room.w - 2)) + 1) * TILE_PX;
        const my = (room.y + Math.floor(Math.random() * (room.h - 2)) + 1) * TILE_PX;

        const types: ('skeleton' | 'goblin' | 'ogre')[] = ['skeleton', 'goblin', 'ogre'];
        const monsterType = isBossRoom ? 'boss' : types[Math.floor(Math.random() * types.length)];

        let hp = monsterType === 'boss' ? 450 : monsterType === 'ogre' ? 120 : monsterType === 'skeleton' ? 50 : 35;
        let speed = monsterType === 'goblin' ? 105 : monsterType === 'skeleton' ? 65 : 55;

        // Attach IELTS Word Barrier to Boss and 1 out of 3 monsters
        let barrierWord: VocabWord | undefined;
        if ((isBossRoom || Math.random() < 0.35) && realm.words.length > 0) {
          barrierWord = realm.words[Math.floor(Math.random() * realm.words.length)];
        }

        engine.monsters.push({
          id: `mob_${idx}_${i}`,
          name: isBossRoom ? "Demon Lord Examiel" : monsterType.toUpperCase(),
          type: monsterType,
          x: mx,
          y: my,
          hp,
          maxHp: hp,
          speed,
          facing: 'left',
          animTimer: Math.random() * 4,
          attackCooldown: 0,
          shootTimer: Math.random() * 2,
          radius: isBossRoom ? 28 : monsterType === 'ogre' ? 22 : 16,
          barrierWord,
          isBoss: isBossRoom
        });
      }
    });
  }, [realm]);

  // Handle Keyboard & Mouse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW', 'w', 'W'].includes(e.code)) inputRef.current.up = true;
      if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code)) inputRef.current.down = true;
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code)) inputRef.current.left = true;
      if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code)) inputRef.current.right = true;

      // Q to Swap Weapon
      if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q') {
        engineRef.current.swapWeapon();
        setHudTick(t => t + 1);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW', 'w', 'W'].includes(e.code)) inputRef.current.up = false;
      if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code)) inputRef.current.down = false;
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code)) inputRef.current.left = false;
      if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code)) inputRef.current.right = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mouseScreenRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) isMouseDownRef.current = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isMouseDownRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Handle Barrier Resolution (Smart Bomb AoE!)
  const handleSolveBarrier = useCallback((isCorrect: boolean) => {
    if (!activeBarrier) return;

    gameStore.recordWordResult(activeBarrier.word.id, isCorrect);

    if (isCorrect) {
      soundEngine.playCritSound();
      speakEnglish(activeBarrier.word.word);

      const player = playerRef.current;
      const engine = engineRef.current;

      // Smart Bomb blast
      for (let i = engine.monsters.length - 1; i >= 0; i--) {
        const m = engine.monsters[i];
        const dist = Math.hypot(m.x - player.x, m.y - player.y);
        if (dist < 450) {
          m.hp -= 400;
          if (m.hp <= 0) {
            engine.monsters.splice(i, 1);
            engine.kills += 1;
            engine.coinsEarned += m.isBoss ? 40 : 10;
          }
        }
      }

      engine.coinsEarned += 25;
      engine.energy = Math.min(engine.maxEnergy, engine.energy + 50); // restore mana
      setWordsSolved(w => w + 1);
    } else {
      soundEngine.playBuzzerSound();
      engineRef.current.takeDamage(1);
    }

    setActiveBarrier(null);
    setHudTick(t => t + 1);
  }, [activeBarrier]);

  // Main 60 FPS Game Loop
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
      const engine = engineRef.current;

      if (isGameOver) return;

      setElapsedTime(t => t + dt);

      // 1. Update Player Movement
      player.update(dt, inputRef.current, dungeon);

      // Check chests
      for (const chest of dungeon.chests) {
        if (!chest.opened) {
          const d = Math.hypot(chest.x - player.x, chest.y - player.y);
          if (d < 32 && !activeBarrier) {
            chest.opened = true;
            soundEngine.playCoinSound();
            const randomWord = realm.words[Math.floor(Math.random() * realm.words.length)];
            setActiveBarrier(createBarrierPrompt(randomWord, realm.words, 'chest'));
            break;
          }
        }
      }

      // 2. Update Camera (Smooth tracking)
      camera.update(
        player.x,
        player.y,
        dungeon.width * TILE_PX,
        dungeon.height * TILE_PX,
        canvas.width,
        canvas.height
      );

      // Mouse world position
      const mouseWorldX = camera.x + mouseScreenRef.current.x;
      const mouseWorldY = camera.y + mouseScreenRef.current.y;

      // Player facing cursor
      player.facing = mouseWorldX < player.x ? 'left' : 'right';

      // 3. Update Soul Knight Engine (Combat, Bullets, Monsters)
      engine.update(
        dt,
        player.x,
        player.y,
        isMouseDownRef.current,
        mouseWorldX,
        mouseWorldY,
        (killedMonster) => {
          soundEngine.playCritSound();
        },
        () => {
          // Player took damage
          if (engine.hp <= 0 && !isGameOver) {
            soundEngine.playDefeatSound();
            setIsGameOver(true);
          }
        }
      );

      // Check Elite Barrier approach
      for (const m of engine.monsters) {
        if (m.barrierWord && !activeBarrier) {
          const dist = Math.hypot(m.x - player.x, m.y - player.y);
          if (dist < 180) {
            setActiveBarrier(createBarrierPrompt(m.barrierWord, realm.words, 'elite'));
            m.barrierWord = undefined; // trigger once
            break;
          }
        }
      }

      // 4. Render Soul Knight Frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      soulKnightRenderer.draw(
        ctx,
        canvas.width,
        canvas.height,
        camera.x,
        camera.y,
        player.x,
        player.y,
        player.facing,
        player.isMoving,
        player.walkAnimTimer,
        mouseWorldX,
        mouseWorldY,
        dungeon,
        engine
      );

      // Trigger HUD re-render occasionally
      setHudTick(t => (t + 1) % 60);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [realm, activeBarrier, isGameOver]);

  const handleRestart = () => {
    dungeonRef.current = generateDungeon(38, 38);
    playerRef.current = new PlayerEntity(dungeonRef.current.spawnPoint.x, dungeonRef.current.spawnPoint.y);
    engineRef.current = new SoulKnightEngine();
    setActiveBarrier(null);
    setIsGameOver(false);
    setElapsedTime(0);
    setWordsSolved(0);
  };

  const toggleSound = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="relative w-full h-[calc(100vh-65px)] bg-slate-950 overflow-hidden flex items-center justify-center select-none cursor-crosshair">
      <canvas
        ref={canvasRef}
        width={960}
        height={640}
        className="border-2 border-slate-800 rounded-3xl shadow-2xl bg-black max-w-full max-h-full"
      />

      {/* Soul Knight HUD */}
      <SoulKnightHUD
        engine={engineRef.current}
        realmName={realm.name}
        isMuted={isMuted}
        onToggleMute={toggleSound}
        onExit={onExit}
      />

      {/* Lexical Event Modal (Barrier / Chest) */}
      {activeBarrier && (
        <LexicalEventModal
          barrier={activeBarrier}
          onSolve={handleSolveBarrier}
          onDismiss={() => setActiveBarrier(null)}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          isVictory={engineRef.current.monsters.length === 0}
          survivalTime={elapsedTime}
          kills={engineRef.current.kills}
          gold={engineRef.current.coinsEarned}
          wordsSolved={wordsSolved}
          onRestart={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
};
