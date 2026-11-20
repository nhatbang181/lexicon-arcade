import React, { useState, useEffect } from 'react';
import type { VocabData, Realm } from './types/vocab.ts';
import { gameStore } from './store/gameStore.ts';
import { soundEngine } from './audio/soundEngine.ts';
import { WorldMap } from './components/WorldMap.tsx';
import { IOEArenaGame } from './components/ioe/IOEArenaGame.tsx';
import { ArcadeHub } from './components/arcade/ArcadeHub.tsx';
import { SoulKnightGame } from './components/SoulKnightGame.tsx';
import { Shop } from './components/Shop.tsx';
import { Grimoire } from './components/Grimoire.tsx';
import { StrategyHandbook } from './components/StrategyHandbook.tsx';
import { Volume2, VolumeX } from 'lucide-react';
import { getAssetPath } from './utils/paths.ts';

type ScreenMode = 'arcade' | 'ioe_arena' | 'world_map' | 'soul_knight' | 'handbook' | 'shop' | 'grimoire';

export const App: React.FC = () => {
  const [vocabData, setVocabData] = useState<VocabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenMode>('arcade');
  const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);

  // Store state
  const [player, setPlayer] = useState(gameStore.getPlayer());
  const [srs, setSrs] = useState(gameStore.getSRS());
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());

  // Subscribe to game store updates
  useEffect(() => {
    const unsub = gameStore.subscribe(() => {
      setPlayer(gameStore.getPlayer());
      setSrs(gameStore.getSRS());
    });
    return unsub;
  }, []);

  // Fetch Anki vocab dataset
  useEffect(() => {
    fetch(getAssetPath('/data/anki_vocab.json'))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data: VocabData) => {
        setVocabData(data);
        if (data.realms && data.realms.length > 0) {
          setSelectedRealm(data.realms[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load vocab dataset:', err);
        setError('Could not load Anki vocabulary dataset.');
        setLoading(false);
      });
  }, []);

  const handleSelectRealm = (realm: Realm) => {
    setSelectedRealm(realm);
    setCurrentScreen('ioe_arena');
    soundEngine.playAttackSound();
  };

  const handleNextRealm = () => {
    if (!vocabData || !selectedRealm) return;
    const currentIndex = vocabData.realms.findIndex((r) => r.id === selectedRealm.id);
    const nextIndex = (currentIndex + 1) % vocabData.realms.length;
    setSelectedRealm(vocabData.realms[nextIndex]);
    setCurrentScreen('ioe_arena');
  };

  const handleExitToMap = () => {
    setCurrentScreen('arcade');
  };

  const toggleSound = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#090b14] text-slate-100 font-arcade">
        <div className="w-16 h-16 mb-4 flex items-center justify-center">
          <img
            src={getAssetPath('/assets/soul_knight/knight/idle_0.png')}
            alt="Hero"
            className="w-16 h-16 object-contain pixelated animate-bounce"
          />
        </div>
        <h1 className="text-xl font-bold text-amber-400">THE LEXICON ARCADE</h1>
        <p className="text-xs text-slate-400 mt-3 font-mono">
          Loading 1,437 IELTS 8.0 Runes & Games...
        </p>
      </div>
    );
  }

  if (error || !vocabData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#090b14] text-slate-100 text-center font-arcade">
        <div className="pixel-frame-grey p-6 max-w-md">
          <h2 className="text-sm font-bold text-red-400">ERROR LOADING VOCABULARY</h2>
          <p className="text-xs font-mono text-slate-300 mt-3">{error}</p>
        </div>
      </div>
    );
  }

  const activeRealm = selectedRealm || vocabData.realms[0];

  return (
    <div className="min-h-screen bg-[#090b14] text-slate-100 flex flex-col select-none">
      {/* RETRO TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-[#090b14]/95 border-b-2 border-slate-800 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Title */}
          <div
            onClick={() => setCurrentScreen('arcade')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-slate-900 border-2 border-amber-500 rounded-xl flex items-center justify-center p-1 shadow-md group-hover:scale-105 transition-transform">
              <span className="text-xl">🕹️</span>
            </div>
            <div>
              <span className="text-xs font-arcade font-bold text-amber-400 tracking-wider">
                LEXICON ARCADE
              </span>
              <span className="block text-[10px] text-slate-400 font-arcade mt-0.5">
                IELTS 8.0 GAMING
              </span>
            </div>
          </div>

          {/* Retro Navigation Tabs */}
          <nav className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCurrentScreen('arcade')}
              className={`px-3 py-1.5 text-xs font-arcade font-bold transition-all cursor-pointer ${
                currentScreen === 'arcade'
                  ? 'pixel-btn-yellow shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg'
              }`}
            >
              🕹️ ARCADE ZONE
            </button>

            <button
              onClick={() => setCurrentScreen('ioe_arena')}
              className={`px-3 py-1.5 text-xs font-arcade font-bold transition-all cursor-pointer ${
                currentScreen === 'ioe_arena'
                  ? 'pixel-btn-yellow shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg'
              }`}
            >
              🏆 ĐẤU TRƯỜNG IOE
            </button>

            <button
              onClick={() => setCurrentScreen('handbook')}
              className={`px-3 py-1.5 text-xs font-arcade font-bold transition-all cursor-pointer ${
                currentScreen === 'handbook'
                  ? 'pixel-btn-yellow shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg'
              }`}
            >
              💡 CẨM NANG 8.0
            </button>

            <button
              onClick={() => setCurrentScreen('world_map')}
              className={`px-3 py-1.5 text-xs font-arcade font-bold transition-all cursor-pointer ${
                currentScreen === 'world_map'
                  ? 'pixel-btn-yellow shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg'
              }`}
            >
              🗺️ 12 CHỦ ĐỀ
            </button>

            <button
              onClick={() => setCurrentScreen('grimoire')}
              className={`px-3 py-1.5 text-xs font-arcade font-bold transition-all cursor-pointer ${
                currentScreen === 'grimoire'
                  ? 'pixel-btn-yellow shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg'
              }`}
            >
              📖 TỪ ĐIỂN
            </button>

            <button
              onClick={() => setCurrentScreen('soul_knight')}
              className={`px-3 py-1.5 text-xs font-arcade font-bold transition-all cursor-pointer hidden md:block ${
                currentScreen === 'soul_knight'
                  ? 'pixel-btn-yellow shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg'
              }`}
            >
              ⚔️ SOUL KNIGHT
            </button>
          </nav>

          {/* Player Mini Gold & Audio Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 border-2 border-slate-800 px-3 py-1.5 rounded-xl text-xs font-pixel text-amber-400">
              <img
                src="/assets/soul_knight/items/coin_0.png"
                alt="coin"
                className="w-4 h-4 pixelated"
              />
              <span>{player.gold}</span>
            </div>

            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 pb-8">
        {currentScreen === 'arcade' && (
          <ArcadeHub
            vocabData={vocabData}
            onLaunchIOEArena={(realm) => {
              setSelectedRealm(realm);
              setCurrentScreen('ioe_arena');
            }}
            onLaunchSoulKnight={(realm) => {
              setSelectedRealm(realm);
              setCurrentScreen('soul_knight');
            }}
            onExit={handleExitToMap}
          />
        )}

        {currentScreen === 'ioe_arena' && activeRealm && (
          <IOEArenaGame
            realm={activeRealm}
            allRealms={vocabData.realms}
            onSelectRealm={handleSelectRealm}
            onExit={handleExitToMap}
            onNextRealm={handleNextRealm}
          />
        )}

        {currentScreen === 'handbook' && (
          <StrategyHandbook
            onExit={handleExitToMap}
          />
        )}

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

        {currentScreen === 'soul_knight' && activeRealm && (
          <SoulKnightGame
            realm={activeRealm}
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
