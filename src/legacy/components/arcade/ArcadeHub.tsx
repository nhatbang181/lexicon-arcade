import React, { useState } from 'react';
import type { Realm, VocabData } from '../../types/vocab.ts';
import { SpeedTyperGame } from './SpeedTyperGame.tsx';
import { OddOneOutGame } from './OddOneOutGame.tsx';
import { TrueFalseDuelGame } from './TrueFalseDuelGame.tsx';
import { CyberSnakeGame } from './CyberSnakeGame.tsx';
import { CyberDefusalGame } from './CyberDefusalGame.tsx';
import { SentenceArchitectGame } from './SentenceArchitectGame.tsx';
import { 
  Zap, 
  Eye, 
  CheckSquare, 
  Trophy, 
  Sword, 
  Radio, 
  ShieldAlert, 
  Building2 
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine.ts';

type ActiveArcadeGame = 
  | 'none' 
  | 'speed_typer' 
  | 'odd_one_out' 
  | 'true_false'
  | 'cyber_snake'
  | 'cyber_defusal'
  | 'sentence_architect';

interface ArcadeHubProps {
  vocabData: VocabData;
  onLaunchIOEArena: (realm: Realm) => void;
  onLaunchSoulKnight: (realm: Realm) => void;
  onExit: () => void;
}

export const ArcadeHub: React.FC<ArcadeHubProps> = ({
  vocabData,
  onLaunchIOEArena,
  onLaunchSoulKnight,
  onExit: _onExit,
}) => {
  const [selectedRealmId, setSelectedRealmId] = useState<string>(
    vocabData.realms[0]?.id || ''
  );
  const [activeGame, setActiveGame] = useState<ActiveArcadeGame>('none');

  const selectedRealm =
    vocabData.realms.find((r) => r.id === selectedRealmId) || vocabData.realms[0];

  const handleLaunchGame = (game: ActiveArcadeGame) => {
    soundEngine.playAttackSound();
    setActiveGame(game);
  };

  // If playing Speed Typer
  if (activeGame === 'speed_typer' && selectedRealm) {
    return (
      <SpeedTyperGame
        words={selectedRealm.words}
        realmName={selectedRealm.name}
        onExit={() => setActiveGame('none')}
      />
    );
  }

  // If playing Odd One Out
  if (activeGame === 'odd_one_out' && selectedRealm) {
    return (
      <OddOneOutGame
        currentRealm={selectedRealm}
        allRealms={vocabData.realms}
        onExit={() => setActiveGame('none')}
      />
    );
  }

  // If playing True / False Duel
  if (activeGame === 'true_false' && selectedRealm) {
    return (
      <TrueFalseDuelGame
        realm={selectedRealm}
        onExit={() => setActiveGame('none')}
      />
    );
  }

  // If playing Cyber Snake
  if (activeGame === 'cyber_snake' && selectedRealm) {
    return (
      <CyberSnakeGame
        words={selectedRealm.words}
        realmName={selectedRealm.name}
        onExit={() => setActiveGame('none')}
      />
    );
  }

  // If playing Cyber Defusal
  if (activeGame === 'cyber_defusal' && selectedRealm) {
    return (
      <CyberDefusalGame
        words={selectedRealm.words}
        realmName={selectedRealm.name}
        onExit={() => setActiveGame('none')}
      />
    );
  }

  // If playing Sentence Architect
  if (activeGame === 'sentence_architect' && selectedRealm) {
    return (
      <SentenceArchitectGame
        words={selectedRealm.words}
        realmName={selectedRealm.name}
        onExit={() => setActiveGame('none')}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 select-none">
      {/* Arcade Lobby Banner */}
      <div className="pixel-frame-brown p-6 text-stone-100 bg-stone-900/95 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-950 border-2 border-amber-500 rounded-2xl flex items-center justify-center p-2 shadow-inner">
              <span className="text-3xl">🕹️</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-[10px] font-arcade font-bold bg-amber-500 text-stone-950 rounded">
                  ARCADE ARENA
                </span>
                <span className="text-xs font-mono text-amber-300/80">
                  · {vocabData.metadata.totalWords} Từ vựng IELTS 8.0 & IOE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-arcade font-bold text-amber-300">
                KHU TRÒ CHƠI HỌC THUẬT ĐA DẠNG
              </h1>
              <p className="text-xs text-stone-300 font-sans mt-1">
                8 Chế độ game kích thích tư duy, phản xạ nhanh, chính tả và ngữ pháp học thuật!
              </p>
            </div>
          </div>

          {/* Realm Topic Selector */}
          <div className="flex flex-col items-start md:items-end w-full md:w-auto">
            <span className="text-[10px] font-arcade font-bold text-stone-400 mb-1">
              CHỌN CHỦ ĐỀ LUYỆN TẬP:
            </span>
            <select
              value={selectedRealmId}
              onChange={(e) => setSelectedRealmId(e.target.value)}
              className="w-full md:w-auto bg-stone-950 text-amber-300 font-arcade font-bold text-xs px-3 py-2 rounded-lg border-2 border-amber-700/80 focus:outline-none focus:border-amber-400 cursor-pointer shadow"
            >
              {vocabData.realms.map((r) => (
                <option key={r.id} value={r.id} className="bg-stone-900 text-stone-200">
                  {r.name} ({r.words.length} từ)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Arcade Games */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Game 1: Speed Typer */}
        <div className="pixel-frame-grey p-5 bg-stone-900/90 flex flex-col justify-between hover:border-amber-500/80 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-700 text-cyan-400">
                <Zap className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-arcade font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                TỐC ĐỘ GÕ PHÍM
              </span>
            </div>

            <h3 className="text-base font-arcade font-bold text-amber-200 group-hover:text-amber-300 mb-2">
              ⚡ SPEED TYPER (BẮN CHỮ)
            </h3>
            <p className="text-xs text-stone-400 font-sans leading-relaxed mb-4">
              Gõ phím bắn hạ thiên thạch từ vựng đang rơi xuống căn cứ. Rèn luyện tốc độ gõ phím & trí nhớ mặt chữ cho Listening/Writing!
            </p>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-stone-400">Độ khó: ★★★★☆</span>
            <button
              type="button"
              onClick={() => handleLaunchGame('speed_typer')}
              className="pixel-btn-yellow px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>CHƠI NGAY</span>
              <span>▶</span>
            </button>
          </div>
        </div>

        {/* Game 2: Cyber Snake */}
        <div className="pixel-frame-grey p-5 bg-stone-900/90 flex flex-col justify-between hover:border-amber-500/80 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-400">
                <Radio className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-arcade font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                RETRO ARCADE
              </span>
            </div>

            <h3 className="text-base font-arcade font-bold text-amber-200 group-hover:text-amber-300 mb-2">
              🐍 CYBER SNAKE (SĂN TỪ)
            </h3>
            <p className="text-xs text-stone-400 font-sans leading-relaxed mb-4">
              Điều khiển rắn retro bằng phím WASD / Mũi tên săn đúng quả cầu từ vựng khớp nghĩa. Thử thách phản xạ đọc lướt cực nhanh!
            </p>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-stone-400">Độ khó: ★★★☆☆</span>
            <button
              type="button"
              onClick={() => handleLaunchGame('cyber_snake')}
              className="pixel-btn-green px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>CHƠI NGAY</span>
              <span>▶</span>
            </button>
          </div>
        </div>

        {/* Game 3: Cyber Defusal */}
        <div className="pixel-frame-grey p-5 bg-stone-900/90 flex flex-col justify-between hover:border-amber-500/80 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-red-950/80 border border-red-700 text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-arcade font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                BOM TÍCH TẮC
              </span>
            </div>

            <h3 className="text-base font-arcade font-bold text-amber-200 group-hover:text-amber-300 mb-2">
              💣 GỠ BOM MẬT MÃ (DEFUSAL)
            </h3>
            <p className="text-xs text-stone-400 font-sans leading-relaxed mb-4">
              Giải mã từ vựng bí ẩn trước khi bom kích nổ trong 60 giây. Mỗi lần đoán sai chữ cái, 1 mạch dây điện tử sẽ bị đứt!
            </p>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-stone-400">Độ khó: ★★★★☆</span>
            <button
              type="button"
              onClick={() => handleLaunchGame('cyber_defusal')}
              className="pixel-btn-red px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>CHƠI NGAY</span>
              <span>▶</span>
            </button>
          </div>
        </div>

        {/* Game 4: Sentence Architect */}
        <div className="pixel-frame-grey p-5 bg-stone-900/90 flex flex-col justify-between hover:border-amber-500/80 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-700 text-amber-400">
                <Building2 className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-arcade font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                NGỮ PHÁP IOE
              </span>
            </div>

            <h3 className="text-base font-arcade font-bold text-amber-200 group-hover:text-amber-300 mb-2">
              🏗️ KIẾN TRÚC SƯ CÂU
            </h3>
            <p className="text-xs text-stone-400 font-sans leading-relaxed mb-4">
              Ghép các khối từ thành câu văn học thuật IELTS hoàn chỉnh. Rèn luyện tư duy cú pháp, mệnh đề và trật tự từ tự nhiên!
            </p>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-stone-400">Độ khó: ★★★★☆</span>
            <button
              type="button"
              onClick={() => handleLaunchGame('sentence_architect')}
              className="pixel-btn-yellow px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>CHƠI NGAY</span>
              <span>▶</span>
            </button>
          </div>
        </div>

        {/* Game 5: Odd One Out */}
        <div className="pixel-frame-grey p-5 bg-stone-900/90 flex flex-col justify-between hover:border-amber-500/80 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-700 text-purple-400">
                <Eye className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-arcade font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                IOE OLYMPIC
              </span>
            </div>

            <h3 className="text-base font-arcade font-bold text-amber-200 group-hover:text-amber-300 mb-2">
              🕵️ ODD ONE OUT (KẺ MẠO DANH)
            </h3>
            <p className="text-xs text-stone-400 font-sans leading-relaxed mb-4">
              Tìm 1 từ lạc loài không thuộc cùng nhóm ngữ nghĩa với 3 từ còn lại trong 12 giây. Dạng bài kinh điển của kỳ thi IOE!
            </p>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-stone-400">Độ khó: ★★★☆☆</span>
            <button
              type="button"
              onClick={() => handleLaunchGame('odd_one_out')}
              className="pixel-btn-blue px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>CHƠI NGAY</span>
              <span>▶</span>
            </button>
          </div>
        </div>

        {/* Game 6: True / False Duel */}
        <div className="pixel-frame-grey p-5 bg-stone-900/90 flex flex-col justify-between hover:border-amber-500/80 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-400">
                <CheckSquare className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-arcade font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                PHẢN XẠ 6 GIÂY
              </span>
            </div>

            <h3 className="text-base font-arcade font-bold text-amber-200 group-hover:text-amber-300 mb-2">
              ⚖️ ĐỐI KHÁNG ĐÚNG / SAI
            </h3>
            <p className="text-xs text-stone-400 font-sans leading-relaxed mb-4">
              Bấm phím [F] (Sai) và [J] (Đúng) để xác nhận cặp từ vựng - định nghĩa trong 6 giây. Kích hoạt chuỗi FEVER nhân đôi điểm!
            </p>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-stone-400">Độ khó: ★★★☆☆</span>
            <button
              type="button"
              onClick={() => handleLaunchGame('true_false')}
              className="pixel-btn-green px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>CHƠI NGAY</span>
              <span>▶</span>
            </button>
          </div>
        </div>

        {/* Game 7: IOE Arena 4-Round Olympic */}
        <div className="pixel-frame-grey p-5 bg-stone-900/90 flex flex-col justify-between hover:border-amber-500/80 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-700 text-amber-400">
                <Trophy className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-arcade font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                ĐẤU TRƯỜNG CHÍNH
              </span>
            </div>

            <h3 className="text-base font-arcade font-bold text-amber-200 group-hover:text-amber-300 mb-2">
              🏆 ĐẤU TRƯỜNG IOE (4 CHẶNG)
            </h3>
            <p className="text-xs text-stone-400 font-sans leading-relaxed mb-4">
              Thử thách liên hoàn: Sắp xếp chữ cái → Nối cặp Collocation → Nghe âm điền từ → Điền khuyết ngữ cảnh. Đoạt huy chương vàng!
            </p>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-stone-400">Độ khó: ★★★★★</span>
            <button
              type="button"
              onClick={() => onLaunchIOEArena(selectedRealm)}
              className="pixel-btn-yellow px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>VÀO THI</span>
              <span>▶</span>
            </button>
          </div>
        </div>

        {/* Game 8: Soul Knight Action RPG */}
        <div className="pixel-frame-grey p-5 bg-stone-900/90 flex flex-col justify-between hover:border-amber-500/80 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-400">
                <Sword className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-arcade font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                HÀNH ĐỘNG SINH TỒN
              </span>
            </div>

            <h3 className="text-base font-arcade font-bold text-amber-200 group-hover:text-amber-300 mb-2">
              ⚔️ SOUL KNIGHT ROGUELIKE
            </h3>
            <p className="text-xs text-stone-400 font-sans leading-relaxed mb-4">
              Điều khiển hiệp sĩ chạy phím WASD trong hầm ngục, nhặt vũ khí, né đạn quái vật và kích nổ bom thần dọn sàn bằng từ vựng IELTS!
            </p>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-stone-400">Độ khó: ★★★★☆</span>
            <button
              type="button"
              onClick={() => onLaunchSoulKnight(selectedRealm)}
              className="pixel-btn-red px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>XÔNG VÀO</span>
              <span>▶</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
