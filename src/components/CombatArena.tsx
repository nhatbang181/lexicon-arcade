import React, { useState, useEffect } from 'react';
import type { VocabWord, Realm } from '../types/vocab.ts';
import type { Monster, CombatActionType, TurnResult } from '../types/game.ts';
import { generateMonster } from '../combat/monsterGenerator.ts';
import { gameStore } from '../store/gameStore.ts';
import { soundEngine } from '../audio/soundEngine.ts';
import { speakEnglish } from '../utils/speech.ts';
import { BattleActions } from './BattleActions.tsx';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, Volume2, VolumeX, Shield, Swords, Zap, Heart, 
  Flame, Award, Skull, ChevronRight, RefreshCw, Trophy, BookOpen
} from 'lucide-react';

interface CombatArenaProps {
  realm: Realm;
  onExit: () => void;
}

export const CombatArena: React.FC<CombatArenaProps> = ({ realm, onExit }) => {
  const [player, setPlayer] = useState(gameStore.getPlayer());
  const [totalStats, setTotalStats] = useState(gameStore.getTotalStats());
  const [floor, setFloor] = useState(1);
  const [monster, setMonster] = useState<Monster>(() => generateMonster(realm.id, player.level, 1));
  const [wordQueue, setWordQueue] = useState<VocabWord[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);

  // Combat animation states
  const [isHeroShaking, setIsHeroShaking] = useState(false);
  const [isMonsterShaking, setIsMonsterShaking] = useState(false);
  const [floatingDamage, setFloatingDamage] = useState<{ text: string; isCrit: boolean; isMonster: boolean } | null>(null);
  const [turnLog, setTurnLog] = useState<string>("Encounter begun! Use active recall to strike!");
  const [lastTurnResult, setLastTurnResult] = useState<TurnResult | null>(null);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showDefeatModal, setShowDefeatModal] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());
  const [actionLocked, setActionLocked] = useState(false);

  // Sync store
  useEffect(() => {
    const unsub = gameStore.subscribe(() => {
      setPlayer(gameStore.getPlayer());
      setTotalStats(gameStore.getTotalStats());
    });
    return unsub;
  }, []);

  // Initialize vocabulary queue for this dungeon run
  useEffect(() => {
    const srs = gameStore.getSRS();
    // Prioritize nemesis words or due words
    const sortedWords = [...realm.words].sort((a, b) => {
      const srsA = srs[a.id];
      const srsB = srs[b.id];
      if (srsA?.isNemesis && !srsB?.isNemesis) return -1;
      if (!srsA?.isNemesis && srsB?.isNemesis) return 1;
      return Math.random() - 0.5;
    });

    setWordQueue(sortedWords);
    setCurrentWordIdx(0);
  }, [realm]);

  const currentWord = wordQueue[currentWordIdx] || realm.words[0];

  // Spawn new monster when floor advances
  const startNewFloor = (nextFloor: number) => {
    const newMob = generateMonster(realm.id, player.level, nextFloor);
    setMonster(newMob);
    setFloor(nextFloor);
    setShowVictoryModal(false);
    setShowDefeatModal(false);
    setTurnLog(`Floor ${nextFloor}: ${newMob.name} emerges from the shadows!`);
    // Advance word
    setCurrentWordIdx((prev) => (prev + 1) % wordQueue.length);
  };

  const handleAction = async (action: CombatActionType, isCorrect: boolean, isTypingRecall: boolean) => {
    if (actionLocked || monster.hp <= 0 || player.hp <= 0) return;
    setActionLocked(true);

    // Speak word upon action
    speakEnglish(currentWord.word);

    // Record in Spaced Repetition engine
    gameStore.recordWordResult(currentWord.id, isCorrect);

    if (isCorrect) {
      // Calculate hero damage
      const baseAtk = totalStats.attack;
      let multiplier = 1.0;
      if (action === 'collocation') multiplier = 1.25;
      if (isTypingRecall) multiplier += 0.5; // +50% for strict active recall

      const isCrit = Math.random() < totalStats.critRate || isTypingRecall;
      if (isCrit) multiplier *= 1.6;

      const damage = Math.round(baseAtk * multiplier);
      const newMonsterHp = Math.max(0, monster.hp - damage);

      // Trigger animations
      setIsMonsterShaking(true);
      if (isCrit) {
        soundEngine.playCritSound();
      } else if (action === 'cloze') {
        soundEngine.playAttackSound();
      } else {
        soundEngine.playMagicSound();
      }

      setFloatingDamage({
        text: `-${damage}${isCrit ? ' CRIT!' : ''}`,
        isCrit,
        isMonster: true
      });

      setTurnLog(
        isCrit
          ? `💥 CRITICAL STRIKE! Flawless recall of "${currentWord.word}" dealt ${damage} massive damage!`
          : `⚔️ Direct hit! "${currentWord.word}" dealt ${damage} damage to ${monster.name}!`
      );

      setMonster(prev => ({ ...prev, hp: newMonsterHp }));

      setTimeout(() => {
        setIsMonsterShaking(false);
        setFloatingDamage(null);
      }, 700);

      // Check Victory
      if (newMonsterHp <= 0) {
        setTimeout(() => {
          soundEngine.playVictorySound();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
          gameStore.gainExp(monster.expReward);
          gameStore.gainGold(monster.goldReward);
          gameStore.recordMonsterDefeated();
          setShowVictoryModal(true);
          setActionLocked(false);
        }, 800);
        return;
      }
    } else {
      // Incorrect recall: Monster counter-attacks!
      soundEngine.playBuzzerSound();
      const rawMonsterAtk = monster.attack;
      const actualDamageTaken = gameStore.takeDamage(rawMonsterAtk);

      setIsHeroShaking(true);
      setFloatingDamage({
        text: `-${actualDamageTaken}`,
        isCrit: false,
        isMonster: false
      });

      setTurnLog(
        `❌ Recall failed! The correct word was "${currentWord.word}" (${currentWord.meaning}). ${monster.name} counter-attacked for ${actualDamageTaken} damage!`
      );

      setTimeout(() => {
        setIsHeroShaking(false);
        setFloatingDamage(null);
      }, 700);

      // Check Defeat
      if (player.hp - actualDamageTaken <= 0) {
        setTimeout(() => {
          soundEngine.playDefeatSound();
          setShowDefeatModal(true);
          setActionLocked(false);
        }, 800);
        return;
      }
    }

    // Advance to next word for next turn
    setTimeout(() => {
      setCurrentWordIdx((prev) => (prev + 1) % wordQueue.length);
      setActionLocked(false);
    }, 900);
  };

  const handleUseHint = (): boolean => {
    return gameStore.spendMp(10);
  };

  const handleDrinkPotion = () => {
    const potIdx = player.inventory.findIndex(it => it.type === 'potion' && (it.effect === 'heal_full' || it.id.includes('pot_heal')));
    if (potIdx !== -1) {
      gameStore.useItem(potIdx);
    }
  };

  const toggleSound = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  const potionCount = player.inventory.filter(it => it.type === 'potion' && (it.effect === 'heal_full' || it.id.includes('pot_heal'))).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur-md">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Map
        </button>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-3 py-1 rounded-lg">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Floor:</span>
            <span className="font-bold text-amber-300 font-mono">{floor}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-3 py-1 rounded-lg">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-400">Streak:</span>
            <span className="font-bold text-orange-300 font-mono">{player.streak}x</span>
          </div>

          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* BATTLE ARENA FIELD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* HERO CARD */}
        <div className={`relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl transition-transform ${isHeroShaking ? 'animate-shake' : ''}`}>
          {floatingDamage && !floatingDamage.isMonster && (
            <div className="absolute top-4 right-4 z-20 text-red-500 font-extrabold text-2xl font-mono animate-float-damage">
              {floatingDamage.text}
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-3xl shadow-inner">
                🧙‍♂️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100 font-rpg">{player.name}</h3>
                  <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    Lv. {player.level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  ATK: {totalStats.attack} · DEF: {totalStats.defense} · CRIT: {Math.round(totalStats.critRate * 100)}%
                </p>
              </div>
            </div>

            {/* Quick Potion button */}
            {potionCount > 0 && (
              <button
                onClick={handleDrinkPotion}
                title="Drink Elixir of Vitality (+80 HP)"
                className="flex items-center gap-1 text-xs bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 px-2.5 py-1.5 rounded-xl transition-all"
              >
                <Heart className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                <span>Potion ({potionCount})</span>
              </button>
            )}
          </div>

          {/* Health & Mana Gauges */}
          <div className="mt-4 space-y-2">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Heart className="w-3 h-3" /> HP
                </span>
                <span className="text-slate-300">{player.hp} / {totalStats.maxHp}</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (player.hp / totalStats.maxHp) * 100))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-blue-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" /> MP
                </span>
                <span className="text-slate-300">{player.mp} / {totalStats.maxMp}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (player.mp / totalStats.maxMp) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* MONSTER CARD */}
        <div className={`relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl transition-transform ${isMonsterShaking ? 'animate-shake' : ''}`}>
          {floatingDamage && floatingDamage.isMonster && (
            <div className={`absolute top-4 left-4 z-20 font-extrabold text-2xl font-mono animate-float-damage ${floatingDamage.isCrit ? 'text-amber-400 text-3xl font-black drop-shadow-md' : 'text-red-400'}`}>
              {floatingDamage.text}
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-3xl shadow-inner">
                {monster.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100 font-rpg">{monster.name}</h3>
                  {monster.isBoss && (
                    <span className="text-xs font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded animate-pulse">
                      BOSS
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 italic line-clamp-1">{monster.title}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono text-slate-400">ATK: {monster.attack}</span>
            </div>
          </div>

          {/* Monster Health Gauge */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <Skull className="w-3 h-3" /> Enemy Health
              </span>
              <span className="text-slate-300">{monster.hp} / {monster.maxHp}</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, (monster.hp / monster.maxHp) * 100))}%` }}
              />
            </div>
          </div>

          {/* Monster dialogue */}
          <div className="mt-3 px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 italic flex items-center gap-2">
            <span>💬</span>
            <span className="line-clamp-1">"{monster.quote}"</span>
          </div>
        </div>
      </div>

      {/* COMBAT ACTION LOG */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-300 flex items-center gap-2">
        <Swords className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="leading-snug">{turnLog}</span>
      </div>

      {/* BATTLE INPUT ACTIONS */}
      <BattleActions
        currentWord={currentWord}
        realmWords={realm.words}
        onActionSubmit={handleAction}
        disabled={actionLocked || monster.hp <= 0 || player.hp <= 0}
        playerMp={player.mp}
        onUseHint={handleUseHint}
      />

      {/* VICTORY MODAL */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-4xl">
              🏆
            </div>

            <div>
              <h2 className="text-2xl font-bold font-rpg text-amber-400">Victory!</h2>
              <p className="text-xs text-slate-400 mt-1">You vanquished {monster.name} on Floor {floor}!</p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs text-slate-400">EXP Gained</span>
                <p className="text-lg font-bold text-emerald-400 font-mono">+{monster.expReward}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Gold Won</span>
                <p className="text-lg font-bold text-amber-400 font-mono">+{monster.goldReward}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onExit}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                Return to Map
              </button>
              <button
                onClick={() => startNewFloor(floor + 1)}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-1"
              >
                <span>Descend to Floor {floor + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEFEAT MODAL */}
      {showDefeatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-4xl">
              💀
            </div>

            <div>
              <h2 className="text-2xl font-bold font-rpg text-red-400">Defeated!</h2>
              <p className="text-xs text-slate-400 mt-1">Your lexical mana was exhausted by {monster.name}.</p>
            </div>

            <p className="text-xs text-slate-400">
              Retreat to the sanctuary to recover your HP, review forgotten words in the Grimoire, and upgrade your gear in the Shop!
            </p>

            <button
              onClick={() => {
                gameStore.heal(totalStats.maxHp);
                onExit();
              }}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
            >
              Return to Sanctuary
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
