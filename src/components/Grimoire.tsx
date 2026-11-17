import React, { useState, useMemo } from 'react';
import type { VocabData, VocabWord } from '../types/vocab.ts';
import type { SRSMap } from '../types/game.ts';
import { speakEnglish } from '../utils/speech.ts';
import { 
  Search, ArrowLeft, Volume2, Star, Skull, BookOpen, 
  Sparkles, Filter, CheckCircle2, Bookmark
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

  // Flatten all words
  const allWords = useMemo(() => {
    return vocabData.realms.flatMap(r => r.words);
  }, [vocabData]);

  // Filter words
  const filteredWords = useMemo(() => {
    return allWords.filter(w => {
      // Realm filter
      if (selectedRealm !== 'all' && w.realmId !== selectedRealm) {
        return false;
      }

      const srsData = srs[w.id];

      // Mastery filter
      if (masteryFilter === 'nemesis' && !srsData?.isNemesis) return false;
      if (masteryFilter === 'mastered' && (!srsData || srsData.box < 4)) return false;
      if (masteryFilter === 'unseen' && srsData) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchWord = w.word.toLowerCase().includes(query);
        const matchMeaning = w.meaning.toLowerCase().includes(query);
        const matchDef = w.definition.toLowerCase().includes(query);
        return matchWord || matchMeaning || matchDef;
      }

      return true;
    });
  }, [allWords, selectedRealm, masteryFilter, searchTerm, srs]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-amber-400 bg-slate-800 hover:bg-slate-700/80 px-3 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Map
        </button>

        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold font-rpg text-slate-100">
            Grimoire Codex of IELTS 8.0
          </h1>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {filteredWords.length} / {allWords.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search vocabulary, meaning, or definition..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          {/* Realm Selector */}
          <select
            value={selectedRealm}
            onChange={e => setSelectedRealm(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none"
          >
            <option value="all">All Realms (12 Biomes)</option>
            {vocabData.realms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Mastery Filter */}
          <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMasteryFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                masteryFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMasteryFilter('nemesis')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                masteryFilter === 'nemesis' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <Skull className="w-3 h-3" /> Nemesis
            </button>
            <button
              onClick={() => setMasteryFilter('mastered')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                masteryFilter === 'mastered' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> Mastered
            </button>
            <button
              onClick={() => setMasteryFilter('unseen')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                masteryFilter === 'unseen' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unseen
            </button>
          </div>
        </div>
      </div>

      {/* Words Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.slice(0, 150).map((word) => {
          const srsData = srs[word.id];
          const box = srsData?.box || 0;
          const isNemesis = srsData?.isNemesis;

          return (
            <div
              key={word.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-100 font-mono tracking-tight">
                        {word.word}
                      </h3>
                      <button
                        onClick={() => speakEnglish(word.word)}
                        className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                        title="Pronounce word"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-indigo-400">{word.ipa}</span>
                      <span className="text-[11px] font-mono text-slate-500 uppercase bg-slate-800 px-1.5 rounded">
                        {word.pos || 'word'}
                      </span>
                    </div>
                  </div>

                  {/* SRS Leitner Box indicator */}
                  <div className="flex items-center gap-0.5">
                    {isNemesis ? (
                      <span className="p-1 bg-red-950/60 border border-red-500/40 rounded-md text-red-400" title="Nemesis Word (Mistake made recently)">
                        <Skull className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      [1, 2, 3, 4, 5].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3 h-3 ${
                            starIdx <= box
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Meaning & Definition */}
                <div className="mt-3">
                  <p className="text-xs font-bold text-amber-300">
                    {word.meaning}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {word.definition}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                {/* Collocations */}
                {word.collocations && word.collocations.length > 0 && (
                  <div className="text-[11px] text-slate-400">
                    <span className="text-blue-400 font-semibold font-mono">Collocations: </span>
                    <span className="italic">{word.collocations.slice(0, 2).join(' · ')}</span>
                  </div>
                )}

                {/* Example sentence */}
                {word.example && (
                  <div className="text-[11px] text-slate-300 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 line-clamp-2">
                    "{word.example}"
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredWords.length > 150 && (
        <div className="text-center text-xs text-slate-500 py-4">
          Showing first 150 of {filteredWords.length} results. Use search filter to narrow down.
        </div>
      )}
    </div>
  );
};
