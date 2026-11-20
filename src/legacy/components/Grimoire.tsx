import React, { useState, useMemo } from 'react';
import type { VocabData, VocabWord } from '../types/vocab.ts';
import type { SRSMap } from '../types/game.ts';
import { speakEnglish } from '../utils/speech.ts';
import { 
  Search, ArrowLeft, Volume2, Star, Skull, BookOpen, CheckCircle2
} from 'lucide-react';

interface GrimoireProps {
  vocabData: VocabData;
  srs: SRSMap;
  onExit: () => void;
}

export const Grimoire: React.FC<GrimoireProps> = ({ vocabData, srs, onExit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRealm, setSelectedRealm] = useState<string>('all');
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'nemesis' | 'mastered' | 'unseen'>('all');

  const allWords = useMemo(() => {
    return vocabData.realms.flatMap(r => r.words);
  }, [vocabData]);

  const filteredWords = useMemo(() => {
    return allWords.filter(w => {
      if (selectedRealm !== 'all' && w.realmId !== selectedRealm) return false;

      const srsData = srs[w.id];
      if (masteryFilter === 'nemesis' && !srsData?.isNemesis) return false;
      if (masteryFilter === 'mastered' && (!srsData || srsData.box < 4)) return false;
      if (masteryFilter === 'unseen' && srsData) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          w.word.toLowerCase().includes(query) ||
          w.meaning.toLowerCase().includes(query) ||
          w.definition.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allWords, selectedRealm, masteryFilter, searchTerm, srs]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="pixel-btn-blue px-3 py-2 text-[10px] flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO LOBBY</span>
        </button>

        <div className="pixel-frame-grey px-4 py-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h1 className="text-xs font-pixel text-slate-100">
            RUNIC CODEX: IELTS 8.0
          </h1>
          <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-amber-400">
            {filteredWords.length} / {allWords.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="pixel-frame-brown p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search vocabulary, meaning, or definition..."
              className="w-full bg-slate-950 border-2 border-amber-900/60 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          {/* Realm Selector */}
          <select
            value={selectedRealm}
            onChange={e => setSelectedRealm(e.target.value)}
            className="bg-slate-950 border-2 border-amber-900/60 text-slate-200 text-xs font-mono rounded-xl px-3 py-2 outline-none"
          >
            <option value="all">All Realms (12 Biomes)</option>
            {vocabData.realms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Mastery Filter */}
          <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-amber-900/60 text-xs font-pixel text-[10px]">
            <button
              onClick={() => setMasteryFilter('all')}
              className={`px-2.5 py-1 rounded transition-all ${
                masteryFilter === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMasteryFilter('nemesis')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                masteryFilter === 'nemesis' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <Skull className="w-3 h-3" /> Nemesis
            </button>
            <button
              onClick={() => setMasteryFilter('mastered')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                masteryFilter === 'mastered' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> Mastered
            </button>
          </div>
        </div>
      </div>

      {/* Words Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.slice(0, 120).map((word) => {
          const srsData = srs[word.id];
          const box = srsData?.box || 0;
          const isNemesis = srsData?.isNemesis;

          return (
            <div
              key={word.id}
              className="pixel-frame-grey p-4 flex flex-col justify-between hover:-translate-y-0.5 transition-transform"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-amber-300 font-pixel tracking-tight">
                        {word.word}
                      </h3>
                      <button
                        onClick={() => speakEnglish(word.word)}
                        className="p-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-300 transition-colors"
                        title="Pronounce word"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-cyan-400">{word.ipa}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-900 border border-slate-800 px-1.5 rounded">
                        {word.pos || 'word'}
                      </span>
                    </div>
                  </div>

                  {/* SRS Stars */}
                  <div className="flex items-center gap-0.5">
                    {isNemesis ? (
                      <span className="p-1 bg-red-950/80 border border-red-500 rounded text-red-400" title="Nemesis Word">
                        <Skull className="w-3 h-3" />
                      </span>
                    ) : (
                      [1, 2, 3, 4, 5].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3 h-3 ${
                            starIdx <= box
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-800'
                          }`}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-bold text-emerald-400 font-mono">
                    {word.meaning}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed font-mono">
                    {word.definition}
                  </p>
                </div>
              </div>

              <div className="pt-2 mt-3 border-t border-slate-800 space-y-2">
                {word.collocations && word.collocations.length > 0 && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    <span className="text-blue-400 font-bold">Collocations: </span>
                    <span className="italic">{word.collocations.slice(0, 2).join(' · ')}</span>
                  </div>
                )}

                {word.example && (
                  <div className="text-[11px] text-slate-300 italic bg-slate-950 p-2 rounded border border-slate-800 font-mono line-clamp-2">
                    "{word.example}"
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredWords.length > 120 && (
        <div className="text-center text-xs text-slate-500 py-3 font-mono">
          Showing first 120 of {filteredWords.length} results. Use search filter above to narrow down.
        </div>
      )}
    </div>
  );
};
