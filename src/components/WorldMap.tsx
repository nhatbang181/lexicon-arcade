import React from 'react';
import type { Realm, VocabData } from '../types/vocab.ts';
import type { PlayerState, SRSMap } from '../types/game.ts';
import { 
  Coins, BookOpen, Skull, Trophy, Play, Sparkles, Flame, Shield
} from 'lucide-react';
import { getAssetPath } from '../utils/paths.ts';

interface WorldMapProps {
  vocabData: VocabData;
  player: PlayerState;
  srs: SRSMap;
  onSelectRealm: (realm: Realm) => void;
  onOpenShop: () => void;
  onOpenGrimoire: () => void;
}

// Map each realm to a distinctive Soul Knight monster / weapon sprite for preview
const REALM_SPRITES: Record<string, string> = {
  education: '/assets/soul_knight/knight/idle_0.png',
  environment: '/assets/soul_knight/monsters/goblin_idle_0.png',
  technology: '/assets/soul_knight/weapons/staff_green.png',
  health: '/assets/soul_knight/items/potion_red.png',
  economy: '/assets/soul_knight/items/coin_0.png',
  society: '/assets/soul_knight/monsters/skeleton_idle_0.png',
  media: '/assets/soul_knight/weapons/bow.png',
  transport: '/assets/soul_knight/weapons/hammer.png',
  science: '/assets/soul_knight/weapons/staff_red.png',
  culture: '/assets/soul_knight/weapons/sword_katana.png',
  awl: '/assets/soul_knight/weapons/sword_anime.png',
  mastery: '/assets/soul_knight/monsters/boss_idle_0.png'
};

export const WorldMap: React.FC<WorldMapProps> = ({
  vocabData,
  player,
  srs,
  onSelectRealm,
  onOpenShop,
  onOpenGrimoire
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* SOUL KNIGHT LOBBY BANNER */}
      <div className="pixel-frame-brown p-6 text-slate-100 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Animated Knight Avatar */}
            <div className="w-20 h-20 bg-slate-900/80 border-4 border-amber-600/80 rounded-2xl flex items-center justify-center p-2 shadow-inner">
              <img
                src={getAssetPath('/assets/soul_knight/knight/idle_0.png')}
                alt="Soul Knight"
                className="w-16 h-16 object-contain pixelated drop-shadow-[0_4px_10px_rgba(251,191,36,0.5)] animate-pulse"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-pixel bg-amber-500 text-black px-2 py-0.5 rounded shadow">
                  IELTS 8.0 DUNGEON LOBBY
                </span>
                <span className="text-xs font-mono text-amber-200/80">· {vocabData.metadata.totalWords} Ancient Runes</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black font-pixel text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
                SOUL KNIGHT: LEXICON
              </h1>
              <p className="text-xs font-mono text-amber-100/80 mt-1 max-w-xl leading-relaxed">
                Step through the dungeon portals. Use WASD to dodge enemy bullet-hell, wield 360° aimed weapons, and shatter IELTS 8.0 barriers to trigger screen-clearing smart bombs!
              </p>
            </div>
          </div>

          {/* Quick Hub Navigation */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenShop}
              className="pixel-btn-yellow px-4 py-3 flex items-center gap-2 text-[11px] shadow-lg hover:scale-105"
            >
              <img src={getAssetPath('/assets/soul_knight/items/coin_0.png')} alt="coin" className="w-5 h-5 pixelated" />
              <span>TRADER GUILD</span>
            </button>

            <button
              onClick={onOpenGrimoire}
              className="pixel-btn-blue px-4 py-3 flex items-center gap-2 text-[11px] shadow-lg hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              <span>RUNIC CODEX</span>
            </button>
          </div>
        </div>
      </div>

      {/* PORTAL GATES SELECTION (12 IELTS REALMS) */}
      <div>
        <div className="flex items-center justify-between mb-4 border-b-2 border-slate-800 pb-2">
          <h2 className="text-base font-pixel text-amber-400 flex items-center gap-2">
            <span>⚔️</span> DUNGEON PORTAL GATES
          </h2>
          <span className="text-xs font-mono text-slate-400">12 Biomes · Soul Knight Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vocabData.realms.map((realm, idx) => {
            const previewSprite = REALM_SPRITES[realm.id] || '/assets/soul_knight/weapons/sword_knight.png';

            // Calculate realm stats
            const realmWordIds = new Set(realm.words.map(w => w.id));
            let masteredCount = 0;
            let nemesisCount = 0;

            for (const [wid, data] of Object.entries(srs)) {
              if (realmWordIds.has(wid)) {
                if (data.box >= 4) masteredCount += 1;
                if (data.isNemesis) nemesisCount += 1;
              }
            }

            const masteryPercent = Math.round((masteredCount / realm.words.length) * 100);

            return (
              <div
                key={realm.id}
                onClick={() => onSelectRealm(realm)}
                className="pixel-frame-grey p-5 cursor-pointer transition-all duration-150 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 bg-slate-900 border-2 border-slate-700 rounded-xl flex items-center justify-center p-2 shadow-inner group-hover:border-amber-400 transition-colors">
                      <img
                        src={getAssetPath(previewSprite)}
                        alt={realm.name}
                        className="w-10 h-10 object-contain pixelated drop-shadow group-hover:scale-110 transition-transform"
                      />
                    </div>

                    <span className="text-[10px] font-pixel text-amber-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                      G{String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold font-pixel text-slate-100 group-hover:text-amber-300 transition-colors leading-snug">
                    {realm.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed font-mono">
                    {realm.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t-2 border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>{realm.words.length} Runes</span>
                    <span className="text-amber-300 font-bold">{masteryPercent}% Done</span>
                  </div>

                  {/* Pixel Segmented Progress Bar */}
                  <div className="w-full h-3 bg-slate-950 rounded border-2 border-slate-800 overflow-hidden mb-3 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${masteryPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    {nemesisCount > 0 ? (
                      <span className="flex items-center gap-1 text-[10px] font-pixel text-red-400 bg-red-950/60 border border-red-800 px-1.5 py-0.5 rounded">
                        <Skull className="w-3 h-3" /> {nemesisCount} Nemesis
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">IELTS 8.0</span>
                    )}

                    <button className="pixel-btn-yellow px-3 py-1.5 text-[10px] flex items-center gap-1 shadow">
                      <span>ENTER</span>
                      <Play className="w-3 h-3 fill-black" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
