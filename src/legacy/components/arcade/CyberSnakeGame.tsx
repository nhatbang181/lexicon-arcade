import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { VocabWord } from '../../types/vocab.ts';
import { soundEngine } from '../../audio/soundEngine.ts';
import { 
  Heart, 
  RotateCcw, 
  Volume2, 
  Trophy, 
  Pause, 
  Play, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

interface CyberSnakeGameProps {
  words: VocabWord[];
  realmName: string;
  onExit: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface FoodOrb {
  word: VocabWord;
  x: number;
  y: number;
  isTarget: boolean;
}

const GRID_SIZE = 18; // 18x18 grid
const CELL_SIZE = 26; // 468x468 canvas
const CANVAS_DIM = GRID_SIZE * CELL_SIZE;

export const CyberSnakeGame: React.FC<CyberSnakeGameProps> = ({
  words,
  realmName,
  onExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Filter words that have valid English and meaning
  const validWords = useRef<VocabWord[]>(
    words.filter((w) => w && w.word && w.meaning && !/[?？]/.test(w.word))
  ).current;

  // Game States
  const [snake, setSnake] = useState<Point[]>([
    { x: 9, y: 9 },
    { x: 9, y: 10 },
    { x: 9, y: 11 },
  ]);
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 }); // Moving UP
  const nextDirection = useRef<Point>({ x: 0, y: -1 });

  const [currentTarget, setCurrentTarget] = useState<VocabWord | null>(null);
  const [orbs, setOrbs] = useState<FoodOrb[]>([]);
  const [shields, setShields] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [wordsMastered, setWordsMastered] = useState<VocabWord[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [recentMatch, setRecentMatch] = useState<{ text: string; success: boolean } | null>(null);
  const [showIpaHint, setShowIpaHint] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(140);

  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lexicon_snake_highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // TTS helper
  const speakWord = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Helper to spawn 1 target orb and 2 distractor orbs at empty coordinates
  const spawnNewRound = useCallback(
    (currentSnakeBody: Point[], avoidWordId?: string) => {
      if (validWords.length === 0) return;

      // Pick target word
      const eligiblePool = validWords.filter((w) => w.id !== avoidWordId);
      const target =
        eligiblePool[Math.floor(Math.random() * eligiblePool.length)] || validWords[0];
      setCurrentTarget(target);
      setShowIpaHint(false);

      // Pick 2 distractors
      const distractorPool = validWords.filter((w) => w.id !== target.id);
      const shuffledDistractors = [...distractorPool].sort(() => 0.5 - Math.random());
      const distractors = shuffledDistractors.slice(0, 2);

      const itemsToPlace = [
        { word: target, isTarget: true },
        ...distractors.map((w) => ({ word: w, isTarget: false })),
      ];

      // Find free grid locations
      const occupied = new Set(currentSnakeBody.map((p) => `${p.x},${p.y}`));
      const placedOrbs: FoodOrb[] = [];

      for (const item of itemsToPlace) {
        let attempts = 0;
        let x = 0;
        let y = 0;
        let key = '';

        do {
          x = Math.floor(Math.random() * GRID_SIZE);
          y = Math.floor(Math.random() * GRID_SIZE);
          key = `${x},${y}`;
          attempts++;
        } while ((occupied.has(key) || placedOrbs.some((o) => o.x === x && o.y === y)) && attempts < 100);

        placedOrbs.push({
          word: item.word,
          x,
          y,
          isTarget: item.isTarget,
        });
      }

      setOrbs(placedOrbs);
    },
    [validWords]
  );

  // Initialize game
  const initGame = useCallback(() => {
    const initialSnake: Point[] = [
      { x: 9, y: 9 },
      { x: 9, y: 10 },
      { x: 9, y: 11 },
    ];
    setSnake(initialSnake);
    setDirection({ x: 0, y: -1 });
    nextDirection.current = { x: 0, y: -1 };
    setShields(3);
    setScore(0);
    setStreak(0);
    setWordsMastered([]);
    setIsGameOver(false);
    setIsPaused(false);
    setRecentMatch(null);
    setSpeedMs(140);
    spawnNewRound(initialSnake);
  }, [spawnNewRound]);

  // Initial mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid controlling while typing or if game over
      if (isGameOver) return;

      const key = e.key.toLowerCase();

      // Pause toggle
      if (key === ' ' || key === 'spacebar') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
        return;
      }

      if (isPaused) return;

      const currentDir = nextDirection.current;

      // Arrow Up or W
      if ((key === 'arrowup' || key === 'w') && currentDir.y === 0) {
        e.preventDefault();
        nextDirection.current = { x: 0, y: -1 };
      }
      // Arrow Down or S
      else if ((key === 'arrowdown' || key === 's') && currentDir.y === 0) {
        e.preventDefault();
        nextDirection.current = { x: 0, y: 1 };
      }
      // Arrow Left or A
      else if ((key === 'arrowleft' || key === 'a') && currentDir.x === 0) {
        e.preventDefault();
        nextDirection.current = { x: -1, y: 0 };
      }
      // Arrow Right or D
      else if ((key === 'arrowright' || key === 'd') && currentDir.x === 0) {
        e.preventDefault();
        nextDirection.current = { x: 1, y: 0 };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, isPaused]);

  // Main Game Loop (Step Tick)
  useEffect(() => {
    if (isGameOver || isPaused || !currentTarget) return;

    const timer = setInterval(() => {
      setSnake((prevSnake) => {
        const dir = nextDirection.current;
        setDirection(dir);

        const head = prevSnake[0];
        // Wrap around walls for smooth gameplay
        let newX = head.x + dir.x;
        let newY = head.y + dir.y;

        if (newX < 0) newX = GRID_SIZE - 1;
        if (newX >= GRID_SIZE) newX = 0;
        if (newY < 0) newY = GRID_SIZE - 1;
        if (newY >= GRID_SIZE) newY = 0;

        const newHead: Point = { x: newX, y: newY };

        // Check self-collision
        const isBitten = prevSnake.slice(1).some((seg) => seg.x === newHead.x && seg.y === newHead.y);
        if (isBitten) {
          soundEngine.playHurtSound();
          setShields((s) => {
            const nextShield = s - 1;
            if (nextShield <= 0) {
              soundEngine.playDefeatSound();
              setIsGameOver(true);
            }
            return nextShield;
          });
          setStreak(0);
          setRecentMatch({ text: '⚠️ Cắn phải đuôi! Mất 1 khiên', success: false });
          // Cut tail back to length 3
          return prevSnake.slice(0, 3);
        }

        // Check Orb Collision
        const orbIndex = orbs.findIndex((o) => o.x === newHead.x && o.y === newHead.y);

        if (orbIndex !== -1) {
          const eatenOrb = orbs[orbIndex];

          if (eatenOrb.isTarget) {
            // EATEN CORRECT WORD!
            soundEngine.playCoinSound();
            speakWord(eatenOrb.word.word);

            const pointsGained = Math.round(100 * (1 + streak * 0.15));
            setScore((sc) => {
              const newTotal = sc + pointsGained;
              if (newTotal > highScore) {
                setHighScore(newTotal);
                localStorage.setItem('lexicon_snake_highscore', String(newTotal));
              }
              return newTotal;
            });

            setStreak((st) => st + 1);
            setWordsMastered((prev) => [...prev, eatenOrb.word]);
            setRecentMatch({
              text: `✨ +${pointsGained}đ: ${eatenOrb.word.word} - ${eatenOrb.word.meaning}`,
              success: true,
            });

            // Increase speed slightly up to a limit
            setSpeedMs((spd) => Math.max(90, spd - 2));

            // Grow snake (don't pop tail)
            const newSnake = [newHead, ...prevSnake];
            spawnNewRound(newSnake, eatenOrb.word.id);
            return newSnake;
          } else {
            // EATEN WRONG DISTRACTOR WORD!
            soundEngine.playBuzzerSound();
            setStreak(0);
            setRecentMatch({
              text: `❌ Sai rồi! "${eatenOrb.word.word}" không khớp nghĩa`,
              success: false,
            });

            setShields((s) => {
              const nextShield = s - 1;
              if (nextShield <= 0) {
                soundEngine.playDefeatSound();
                setIsGameOver(true);
              }
              return nextShield;
            });

            // Remove only the wrong orb so player can still hunt the correct one
            setOrbs((curOrbs) => curOrbs.filter((_, idx) => idx !== orbIndex));

            // Don't grow
            return [newHead, ...prevSnake.slice(0, -1)];
          }
        }

        // Normal move without eating
        return [newHead, ...prevSnake.slice(0, -1)];
      });
    }, speedMs);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused, currentTarget, orbs, speedMs, streak, highScore, spawnNewRound, speakWord]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear board
    ctx.fillStyle = '#0f172a'; // Deep slate
    ctx.fillRect(0, 0, CANVAS_DIM, CANVAS_DIM);

    // Draw Subtle Cyber Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_DIM);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_DIM, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw Food Orbs
    orbs.forEach((orb) => {
      const cx = orb.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = orb.y * CELL_SIZE + CELL_SIZE / 2;
      const radius = CELL_SIZE / 2 - 3;

      // Glow effect
      ctx.shadowBlur = orb.isTarget ? 14 : 8;
      ctx.shadowColor = orb.isTarget ? '#10b981' : '#f59e0b';

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = orb.isTarget ? '#059669' : '#d97706';
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = orb.isTarget ? '#34d399' : '#fcd34d';
      ctx.stroke();

      // Reset shadow for text
      ctx.shadowBlur = 0;

      // Draw Word Label above or on orb
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Truncate display if long
      const displayLabel =
        orb.word.word.length > 7 ? `${orb.word.word.slice(0, 6)}…` : orb.word.word;
      ctx.fillText(displayLabel, cx, cy);
    });

    // Draw Snake Body
    snake.forEach((segment, index) => {
      const sx = segment.x * CELL_SIZE;
      const sy = segment.y * CELL_SIZE;

      if (index === 0) {
        // Head
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#38bdf8';
        ctx.fillStyle = '#38bdf8'; // Neon Cyan
        ctx.beginPath();
        ctx.roundRect(sx + 2, sy + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Eyes
        ctx.fillStyle = '#0f172a';
        const eyeOffset = 6;
        let e1x = sx + eyeOffset;
        let e1y = sy + eyeOffset;
        let e2x = sx + CELL_SIZE - eyeOffset;
        let e2y = sy + eyeOffset;

        if (direction.x === 1) {
          e1x = sx + CELL_SIZE - eyeOffset;
          e1y = sy + eyeOffset;
          e2x = sx + CELL_SIZE - eyeOffset;
          e2y = sy + CELL_SIZE - eyeOffset;
        } else if (direction.x === -1) {
          e1x = sx + eyeOffset;
          e1y = sy + eyeOffset;
          e2x = sx + eyeOffset;
          e2y = sy + CELL_SIZE - eyeOffset;
        } else if (direction.y === 1) {
          e1x = sx + eyeOffset;
          e1y = sy + CELL_SIZE - eyeOffset;
          e2x = sx + CELL_SIZE - eyeOffset;
          e2y = sy + CELL_SIZE - eyeOffset;
        }

        ctx.beginPath();
        ctx.arc(e1x, e1y, 2, 0, Math.PI * 2);
        ctx.arc(e2x, e2y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body Segment with gradient fading
        const alpha = Math.max(0.35, 1 - index / (snake.length + 5));
        ctx.fillStyle = `rgba(14, 165, 233, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(sx + 3, sy + 3, CELL_SIZE - 6, CELL_SIZE - 6, 4);
        ctx.fill();
      }
    });

    // Reset shadow
    ctx.shadowBlur = 0;
  }, [snake, orbs, direction]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* Top Navigation & Status Bar */}
      <div className="pixel-frame-brown p-4 bg-stone-900/95 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐍</span>
          <div>
            <h2 className="text-base font-arcade font-bold text-amber-300">
              CYBER SNAKE: SĂN TỪ VỰNG
            </h2>
            <span className="text-[11px] font-sans text-stone-400">
              Chủ đề: <strong className="text-amber-200">{realmName}</strong>
            </span>
          </div>
        </div>

        {/* Lives & Stats */}
        <div className="flex items-center gap-4">
          {/* Shields */}
          <div className="flex items-center gap-1 bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
            {[1, 2, 3].map((heart) => (
              <Heart
                key={heart}
                className={`w-4 h-4 ${
                  heart <= shields
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-stone-700'
                }`}
              />
            ))}
          </div>

          {/* Score & Streak */}
          <div className="flex items-center gap-3 bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
            <div>
              <div className="text-[9px] font-arcade text-stone-400">ĐIỂM SỐ</div>
              <div className="text-sm font-arcade font-bold text-amber-400">{score}</div>
            </div>
            {streak > 1 && (
              <div className="border-l border-stone-800 pl-2">
                <div className="text-[9px] font-arcade text-emerald-400">COMBO</div>
                <div className="text-sm font-arcade font-bold text-emerald-300">x{streak}</div>
              </div>
            )}
            <div className="border-l border-stone-800 pl-2">
              <div className="text-[9px] font-arcade text-stone-400">KỶ LỤC</div>
              <div className="text-sm font-arcade font-bold text-stone-300">{highScore}</div>
            </div>
          </div>

          {/* Pause & Exit */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="pixel-btn-blue px-3 py-1.5 text-xs flex items-center gap-1 cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="pixel-btn-grey px-3 py-1.5 text-xs cursor-pointer"
          >
            THOÁT
          </button>
        </div>
      </div>

      {/* Target Mission Banner */}
      <div className="pixel-frame-grey p-4 bg-slate-950 border-2 border-emerald-500/50 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-arcade font-bold bg-emerald-500 text-stone-950 rounded">
                🎯 MỤC TIÊU SĂN:
              </span>
              <span className="text-xs text-stone-400 font-sans">
                Hãy điều khiển rắn ăn quả cầu từ vựng có nghĩa bên dưới:
              </span>
            </div>
            <div className="text-sm sm:text-base font-vietnam font-semibold text-emerald-300">
              "{currentTarget?.meaning}"
            </div>
            {showIpaHint && currentTarget?.ipa && (
              <div className="text-xs font-mono text-cyan-300 mt-1">
                Gợi ý IPA: {currentTarget.ipa} ({currentTarget.pos || 'từ vựng'})
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {!showIpaHint && (
              <button
                type="button"
                onClick={() => setShowIpaHint(true)}
                className="px-2.5 py-1 text-[11px] font-arcade bg-stone-800 text-amber-300 rounded border border-amber-600/40 hover:bg-stone-700 transition cursor-pointer"
              >
                💡 GỢI Ý IPA
              </button>
            )}
            <button
              type="button"
              onClick={() => currentTarget && speakWord(currentTarget.word)}
              title="Phát âm từ mục tiêu"
              className="p-2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Game Area Layout */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-5">
        {/* Main Canvas Screen */}
        <div className="relative border-4 border-stone-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
          <canvas
            ref={canvasRef}
            width={CANVAS_DIM}
            height={CANVAS_DIM}
            className="block cursor-crosshair"
          />

          {/* Pause Overlay */}
          {isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-20">
              <Pause className="w-12 h-12 text-amber-400 mb-2 animate-pulse" />
              <h3 className="text-xl font-arcade font-bold text-amber-300 mb-2">TẠM DỪNG</h3>
              <p className="text-xs text-stone-300 font-sans mb-4">
                Nhấn [SPACE] hoặc bấm nút bên dưới để tiếp tục săn từ vựng!
              </p>
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="pixel-btn-green px-5 py-2 text-xs flex items-center gap-2 cursor-pointer shadow"
              >
                <Play className="w-4 h-4" />
                <span>TIẾP TỤC</span>
              </button>
            </div>
          )}

          {/* Game Over Modal */}
          {isGameOver && (
            <div className="absolute inset-0 bg-stone-950/95 flex flex-col items-center justify-center text-center p-6 z-30">
              <Trophy className="w-12 h-12 text-amber-400 mb-3" />
              <h3 className="text-2xl font-arcade font-bold text-rose-400 mb-1">
                KẾT THÚC CHẶNG SĂN
              </h3>
              <div className="text-base font-arcade text-amber-300 mb-4">
                TỔNG ĐIỂM: {score} · TỪ ĐÃ THU HOẠCH: {wordsMastered.length}
              </div>

              {/* List of Words Learnt */}
              {wordsMastered.length > 0 && (
                <div className="w-full max-h-40 overflow-y-auto mb-4 bg-stone-900/90 p-3 rounded-lg border border-stone-800 text-left space-y-1.5">
                  <div className="text-[10px] font-arcade font-bold text-stone-400 mb-1">
                    TỪ VỰNG BẠN VỪA THU HOẠCH ĐƯỢC:
                  </div>
                  {wordsMastered.map((w, idx) => (
                    <div key={idx} className="text-xs flex items-center justify-between text-stone-300">
                      <span className="font-bold text-emerald-400">{w.word}</span>
                      <span className="text-[11px] text-stone-400 font-vietnam truncate max-w-[200px]">
                        {w.meaning}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={initGame}
                  className="pixel-btn-yellow px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer shadow"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>CHƠI LẠI</span>
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="pixel-btn-grey px-4 py-2.5 text-xs cursor-pointer shadow"
                >
                  QUAY LẠI SẢNH
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Controls & Active Orbs Info */}
        <div className="flex flex-col gap-4 w-full md:w-64">
          {/* Recent Match Feedback Toast */}
          {recentMatch && (
            <div
              className={`p-3 rounded-lg border text-xs font-vietnam transition-all duration-300 ${
                recentMatch.success
                  ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-200'
                  : 'bg-rose-950/70 border-rose-600/70 text-rose-200'
              }`}
            >
              {recentMatch.text}
            </div>
          )}

          {/* Live Clue List of Orbs */}
          <div className="pixel-frame-grey p-3 bg-stone-900/90 text-xs">
            <div className="font-arcade font-bold text-stone-300 text-[11px] mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>CÁC QUẢ CẦU ĐANG TRÊN BÀN:</span>
            </div>
            <div className="space-y-1.5">
              {orbs.map((o, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 rounded bg-stone-950 border border-stone-800"
                >
                  <span className="font-bold text-stone-200 font-mono">{o.word.word}</span>
                  <button
                    type="button"
                    onClick={() => speakWord(o.word.word)}
                    className="p-1 text-stone-400 hover:text-cyan-300 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* D-Pad Virtual Buttons for Touch / Mouse */}
          <div className="pixel-frame-brown p-3 bg-stone-900/95 flex flex-col items-center">
            <div className="text-[10px] font-arcade font-bold text-stone-400 mb-2">
              ĐIỀU KHIỂN HƯỚNG
            </div>
            <div className="grid grid-cols-3 gap-1.5 w-36">
              <div />
              <button
                type="button"
                onClick={() => {
                  if (nextDirection.current.y === 0) nextDirection.current = { x: 0, y: -1 };
                }}
                className="pixel-btn-blue p-2.5 flex items-center justify-center cursor-pointer"
                title="Lên (W / ↑)"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div />

              <button
                type="button"
                onClick={() => {
                  if (nextDirection.current.x === 0) nextDirection.current = { x: -1, y: 0 };
                }}
                className="pixel-btn-blue p-2.5 flex items-center justify-center cursor-pointer"
                title="Trái (A / ←)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center text-xs font-mono text-stone-500">
                WASD
              </div>
              <button
                type="button"
                onClick={() => {
                  if (nextDirection.current.x === 0) nextDirection.current = { x: 1, y: 0 };
                }}
                className="pixel-btn-blue p-2.5 flex items-center justify-center cursor-pointer"
                title="Phải (D / →)"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div />
              <button
                type="button"
                onClick={() => {
                  if (nextDirection.current.y === 0) nextDirection.current = { x: 0, y: 1 };
                }}
                className="pixel-btn-blue p-2.5 flex items-center justify-center cursor-pointer"
                title="Xuống (S / ↓)"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <div />
            </div>
            <span className="text-[9px] font-sans text-stone-400 mt-2 text-center">
              Dùng phím Mũi tên / WASD / Chạm phím
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
