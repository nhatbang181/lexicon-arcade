import React, { useState, useEffect } from 'react';
import type { VocabData, Realm } from './types/vocab.ts';
import { gameStore } from './store/gameStore.ts';
import { soundEngine } from './audio/soundEngine.ts';
import { WorldMap } from './components/WorldMap.tsx';
import { GameCanvas } from './components/GameCanvas.tsx';
import { Shop } from './components/Shop.tsx';
import { Grimoire } from './components/Grimoire.tsx';
import { 
  Shield, Swords, Coins, Heart, Zap, Volume2, VolumeX, 
  BookOpen, Sparkles, Trophy, Flame, HelpCircle
} from 'lucide-react';

type ScreenMode = 'world_map' | 'combat' | 'shop' | 'grimoire';

export const App: React.FC = () => {
  const [vocabData, setVocabData] = useState<VocabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenMode>('world_map');
  const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);

  // Store state
  const [player, setPlayer] = useState(gameStore.getPlayer());
  const [totalStats, setTotalStats] = useState(gameStore.getTotalStats());
  const [srs, setSrs] = useState(gameStore.getSRS());
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());

  // Subscribe to game store updates
  useEffect(() => {
    const unsub = gameStore.subscribe(() => {
      setPlayer(gameStore.getPlayer());
      setTotalStats(gameStore.getTotalStats());
      setSrs(gameStore.getSRS());
    });
    return unsub;
  }, []);

  // Fetch pre-extracted Anki vocab dataset
  useEffect(() => {
    fetch('/data/anki_vocab.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data: VocabData) => {
        setVocabData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load vocab dataset:", err);
        setError("Could not load Anki vocabulary dataset. Please run scripts/extract_anki.py.");
        setLoading(false);
      });
  }, []);

  const handleSelectRealm = (realm: Realm) => {
    setSelectedRealm(realm);
    setCurrentScreen('combat');
    soundEngine.playAttackSound();
  };

  const handleExitToMap = () => {
    setCurrentScreen('world_map');
    setSelectedRealm(null);
  };

  const toggleSound = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-4xl animate-bounce mb-4 shadow-xl">
          ⚔️
        </div>
        <h1 className="text-2xl font-bold font-rpg text-amber-400">LEXICON QUEST</h1>
        <p className="text-xs text-slate-400 mt-2 font-mono">Loading 1,499 IELTS 8.0 vocabulary relics from Anki...</p>
      </div>
    );
  }

  if (error || !vocabData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 text-center">
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl max-w-md">
          <h2 className="text-lg font-bold text-red-400">Dataset Load Error</h2>
          <p className="text-xs text-slate-300 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Title */}
          <div 
            onClick={handleExitToMap}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl shadow-lg group-hover:scale-105 transition-transform">
              ⚔️
            </div>
            <div>
              <span className="text-sm font-black font-rpg tracking-wider text-amber-400">
                LEXICON QUEST
              </span>
              <span className="block text-[10px] text-slate-400 font-mono -mt-1">
                IELTS 8.0 RPG
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setCurrentScreen('world_map')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currentScreen === 'world_map'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Realms Map
            </button>

            <button
              onClick={() => setCurrentScreen('shop')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentScreen === 'shop'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Merchant Guild</span>
            </button>

            <button
              onClick={() => setCurrentScreen('grimoire')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentScreen === 'grimoire'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Grimoire Codex</span>
            </button>
          </nav>

          {/* Player Mini HUD */}
          <div className="flex items-center gap-3">
            {/* Level & EXP */}
            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-200 font-rpg">{player.name}</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded">
                  Lv.{player.level}
                </span>
              </div>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${Math.min(100, (player.exp / player.maxExp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Gold */}
            <div className="flex items-center gap-1 text-xs font-mono font-bold bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              <span>{player.gold}</span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
              title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {currentScreen === 'world_map' && (
          <WorldMap
            vocabData={vocabData}
            player={player}
            srs={srs}
            onSelectRealm={handleSelectRealm}
            onOpenShop={() => setCurrentScreen('shop')}
            onOpenGrimoire={() => setCurrentScreen('grimoire')}
          />
        )}

        {currentScreen === 'combat' && selectedRealm && (
          <GameCanvas
            realm={selectedRealm}
            onExit={handleExitToMap}
          />
        )}

        {currentScreen === 'shop' && (
          <Shop
            player={player}
            onExit={handleExitToMap}
          />
        )}

        {currentScreen === 'grimoire' && (
          <Grimoire
            vocabData={vocabData}
            srs={srs}
            onExit={handleExitToMap}
          />
        )}
      </main>
    </div>
  );
};

export default App;
