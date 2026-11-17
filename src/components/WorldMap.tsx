import React from 'react';
import type { Realm, VocabData } from '../types/vocab.ts';
import type { PlayerState, SRSMap } from '../types/game.ts';
import { 
  GraduationCap, Trees, Cpu, HeartPulse, Coins, ShieldAlert, 
  Radio, TrainFront, Telescope, Globe2, BookOpenCheck, Sparkles,
  Play, Flame, Skull, CheckCircle2, ChevronRight
} from 'lucide-react';

interface WorldMapProps {
  vocabData: VocabData;
  player: PlayerState;
  srs: SRSMap;
  onSelectRealm: (realm: Realm) => void;
  onOpenShop: () => void;
  onOpenGrimoire: () => void;
}

// Icon dictionary
const REALM_ICONS: Record<string, React.FC<{ className?: string }>> = {
  GraduationCap,
  Trees,
  Cpu,
  HeartPulse,
  Coins,
  ShieldAlert,
  Radio,
  TrainFront,
  Telescope,
  Globe2,
  BookOpenCheck,
  Sparkles
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
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                IELTS 8.0 Realm Explorer
              </span>
              <span className="text-xs text-slate-400">· 1,499 Vocabulary Relics</span>
            </div>
            <h1 className="text-3xl font-black font-rpg text-slate-100 tracking-wide">
              The Chronicles of Lexicon
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Choose a realm to explore. Battle academic monsters using active sentence cloze recall, collocations, and synonyms to master IELTS 8.0 band vocabulary.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenShop}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 rounded-2xl text-xs font-bold text-amber-300 transition-all shadow-sm"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Merchant Guild ({player.gold} Gold)</span>
            </button>

            <button
              onClick={onOpenGrimoire}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-2xl text-xs font-bold text-slate-200 transition-all shadow-sm"
            >
              <BookOpenCheck className="w-4 h-4 text-indigo-400" />
              <span>Grimoire Codex</span>
            </button>
          </div>
        </div>
      </div>

      {/* Realms Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-rpg text-slate-200">Select a Realm</h2>
          <span className="text-xs text-slate-400 font-mono">12 Themed Dungeons</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vocabData.realms.map((realm, idx) => {
            const IconComponent = REALM_ICONS[realm.icon] || Sparkles;
            
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
                className="group relative bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner border"
                      style={{
                        backgroundColor: `${realm.accent}15`,
                        borderColor: `${realm.accent}40`,
                        color: realm.accent
                      }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <span className="text-xs font-mono text-slate-500 font-semibold">
                      Realm {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors font-rpg">
                    {realm.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {realm.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>{realm.words.length} Vocabulary Relics</span>
                    <span className="text-amber-300 font-semibold">{masteryPercent}% Mastered</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${masteryPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    {nemesisCount > 0 ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded">
                        <Skull className="w-3 h-3" /> {nemesisCount} Nemesis Beasts
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Tier: IELTS 8.0</span>
                    )}

                    <div className="flex items-center gap-1 text-xs font-bold text-slate-300 group-hover:text-amber-400 transition-colors">
                      <span>Enter</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
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
