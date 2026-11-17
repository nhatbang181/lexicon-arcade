import React, { useState, useEffect, useMemo } from 'react';
import { Search, Lightbulb, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine.ts';

interface StrategyItem {
  id: string;
  title: string;
  category: string;
  answer: string;
  detail: string;
}

interface StrategyData {
  title: string;
  totalStrategies: number;
  strategies: StrategyItem[];
}

interface StrategyHandbookProps {
  onExit: () => void;
}

export const StrategyHandbook: React.FC<StrategyHandbookProps> = ({ onExit }) => {
  const [data, setData] = useState<StrategyData | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/data/ielts_strategies.json')
      .then((res) => res.json())
      .then((d: StrategyData) => setData(d))
      .catch((err) => console.error('Failed to load strategies:', err));
  }, []);

  const categories = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.strategies.forEach((s) => {
      if (/writing/i.test(s.title)) set.add('WRITING');
      else if (/speaking|part 1|part 2|part 3/i.test(s.title)) set.add('SPEAKING');
      else if (/listening/i.test(s.title)) set.add('LISTENING');
      else if (/reading/i.test(s.title)) set.add('READING');
      else set.add('GENERAL TIPS');
    });
    return ['ALL', ...Array.from(set)];
  }, [data]);

  const toggleExpand = (id: string) => {
    soundEngine.playAttackSound();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredStrategies = useMemo(() => {
    if (!data) return [];
    return data.strategies.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.answer.toLowerCase().includes(search.toLowerCase()) ||
        s.detail.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedCategory === 'ALL') return true;
      if (selectedCategory === 'WRITING') return /writing/i.test(s.title);
      if (selectedCategory === 'SPEAKING') return /speaking|part 1|part 2|part 3/i.test(s.title);
      if (selectedCategory === 'LISTENING') return /listening/i.test(s.title);
      if (selectedCategory === 'READING') return /reading/i.test(s.title);
      return !/writing|speaking|part 1|part 2|part 3|listening|reading/i.test(s.title);
    });
  }, [data, search, selectedCategory]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 select-none">
      {/* Header Banner */}
      <div className="pixel-frame-brown p-6 text-stone-100 bg-stone-900/90 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💡</span>
            <div>
              <h1 className="text-lg sm:text-xl font-arcade font-bold text-amber-300">
                CẨM NANG BÍ QUYẾT IELTS 8.0
              </h1>
              <p className="text-xs text-stone-400 mt-1">
                Tổng hợp {data?.totalStrategies || 62} chiến thuật, khung trả lời và quy tắc tính điểm từ bộ thẻ Anki
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="pixel-btn-red px-3 py-1.5 text-xs cursor-pointer"
          >
            ✕ THOÁT
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm chiến thuật, câu hỏi, mẹo thi..."
              className="w-full pl-9 pr-4 py-2 bg-stone-950 text-stone-200 text-sm rounded-lg border border-stone-800 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-arcade font-bold rounded transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Cards List */}
      <div className="space-y-3">
        {filteredStrategies.map((s) => {
          const isExpanded = expandedIds.has(s.id);
          return (
            <div
              key={s.id}
              className="pixel-frame-grey p-4 bg-stone-900/90 text-stone-100 hover:border-amber-500/70 transition-colors"
            >
              <div
                onClick={() => toggleExpand(s.id)}
                className="flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <h3 className="font-semibold text-sm sm:text-base text-amber-200">
                    {s.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  )}
                </div>
              </div>

              {/* Answer content */}
              <div className="mt-3 pl-6 space-y-2 border-t border-stone-800/80 pt-3">
                <div className="text-sm text-stone-200 leading-relaxed font-sans">
                  <strong className="text-amber-300">Chiến lược:</strong> {s.answer}
                </div>

                {s.detail && (
                  <div className="text-xs text-stone-400 bg-stone-950/60 p-2.5 rounded border border-stone-800 leading-relaxed">
                    <span className="text-emerald-400 font-mono text-[10px] block mb-1">
                      CHI TIẾT & VÍ DỤ:
                    </span>
                    {s.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredStrategies.length === 0 && (
          <div className="text-center py-12 text-stone-500 font-mono text-sm">
            Không tìm thấy chiến lược nào phù hợp với từ khóa &ldquo;{search}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
};
