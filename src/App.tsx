import React, { useState, useEffect } from 'react';
import type { VocabData, Realm } from './types/vocab.ts';
import { gameStore } from './store/gameStore.ts';
import { soundEngine } from './audio/soundEngine.ts';
import { WorldMap } from './components/WorldMap.tsx';
import { SoulKnightGame } from './components/SoulKnightGame.tsx';
import { Shop } from './components/Shop.tsx';
import { Grimoire } from './components/Grimoire.tsx';
import { Volume2, VolumeX } from 'lucide-react';

type ScreenMode = 'world_map' | 'combat' | 'shop' | 'grimoire';

export const App: React.FC = () => {
  const [vocabData, setVocabData] = useState<VocabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenMode>('world_map');
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
        setError("Could not load Anki vocabulary dataset.");
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#090b14] text-slate-100 font-pixel">
        <div className="w-16 h-16 mb-4 flex items-center justify-center">
          <img
            src="/assets/soul_knight/knight/idle_0.png"
            alt="Soul Knight"
            className="w-16 h-16 object-contain pixelated animate-bounce"
          />
        </div>
        <h1 className="text-xl font-bold text-amber-400">SOUL KNIGHT</h1>
        <p className="text-xs text-slate-400 mt-3 font-mono">Loading 1,499 IELTS 8.0 Runes & Dungeons...</p>
      </div>
    );
  }

  if (error || !vocabData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#090b14] text-slate-100 text-center font-pixel">
        <div className="pixel-frame-grey p-6 max-w-md">
          <h2 className="text-sm font-bold text-red-400">ERROR LOADING DUNGEONS</h2>
          <p className="text-xs font-mono text-slate-300 mt-3">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b14] text-slate-100 flex flex-col select-none">
      {/* RETRO SOUL KNIGHT TOP HUD HEADER */}
      <header className="sticky top-0 z-40 bg-[#090b14]/95 border-b-2 border-slate-800 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Title */}
          <div 
            onClick={handleExitToMap}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-slate-900 border-2 border-amber-500 rounded-xl flex items-center justify-center p-1 shadow-md group-hover:scale-105 transition-transform">
              <img
                src="/assets/soul_knight/knight/idle_0.png"
                alt="Soul Knight"
                className="w-8 h-8 object-contain pixelated"
              />
            </div>
            <div>
              <span className="text-xs font-pixel text-amber-400 tracking-wider">
                SOUL KNIGHT
              </span>
              <span className="block text-[9px] text-slate-400 font-pixel mt-0.5">
                LEXICON 8.0
              </span>
            </div>
          </div>

          {/* Retro Navigation Tabs */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('world_map')}
              className={`px-3 py-1.5 text-[10px] font-pixel transition-all ${
                currentScreen === 'world_map'
                  ? 'pixel-btn-yellow shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg'
              }`}
            >
              PORTALS
            </button>

            <button
              onClick={() => setCurrentScreen('shop')}
              className={`px-3 py-1.5 text-[10px] font-pixel transition-all ${
                currentScreen === 'shop'
                  ? 'pixel-btn-yellow shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg'
              }`}
            >
              TRADER
            </button>

            <button
              onClick={() => setCurrentScreen('grimoire')}
              className={`px-3 py-1.5 text-[10px] font-pixel transition-all ${
                currentScreen === 'grimoire'
                  ? 'pixel-btn-yellow shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg'
              }`}
            >
              CODEX
            </button>
          </nav>

          {/* Player Mini Gold & Audio Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 border-2 border-slate-800 px-3 py-1.5 rounded-xl text-xs font-pixel text-amber-400">
              <img src="/assets/soul_knight/items/coin_0.png" alt="coin" className="w-4 h-4 pixelated" />
              <span>{player.gold}</span>
            </div>

            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              title={isMuted ? "Unmute sound" : "Mute sound"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 pb-8">
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
          <SoulKnightGame
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
