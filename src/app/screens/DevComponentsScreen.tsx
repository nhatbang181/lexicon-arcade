import React, { useState } from 'react';
import {
  Button,
  Card,
  Pill,
  ProgressRing,
  BandMeter,
  Timer,
  Modal,
  Sheet,
  Toast,
  AnswerInput,
  ChoiceButton,
  KeyHint,
  AudioButton,
  FeedbackPanel,
  RecapScreen,
  EmptyState,
  Skeleton,
} from '../../design/components';
import { CANONICAL_SFX_CUES, DEFAULT_SFX_SPRITE } from '../../core/audio/sfx';
import { GradingPanel, type GradingPanelGradedPayload } from '../../games/_shared';
import {
  SPEAKING_CLAUDE_RESPONSE,
  SPEAKING_FIXTURE_ATTEMPT,
  SPRINT_OVERVIEW_CLAUDE_RESPONSE,
  SPRINT_OVERVIEW_FIXTURE_ATTEMPT,
  TASK1_CLAUDE_RESPONSE,
  TASK1_FIXTURE_ATTEMPT,
  TASK2_CLAUDE_RESPONSE,
  TASK2_FIXTURE_ATTEMPT,
} from '../../test/fixtures/grading';
import { useAudio, useTheme } from '../providers';

const GAME_ICON_ITEMS = [
  { id: 'v1', label: 'V1 · Daily Run', skillColor: 'var(--color-vocab)' },
  { id: 'v2', label: 'V2 · Collocation Forge', skillColor: 'var(--color-vocab)' },
  { id: 'v3', label: 'V3 · Paraphrase Radar', skillColor: 'var(--color-vocab)' },
  { id: 'l1', label: 'L1 · Trap Detector', skillColor: 'var(--color-listening)' },
  { id: 'l2', label: 'L2 · Dictation Ladder', skillColor: 'var(--color-listening)' },
  { id: 'r1', label: 'R1 · TFNG Judge', skillColor: 'var(--color-reading)' },
  { id: 'r2', label: 'R2 · Headline Editor', skillColor: 'var(--color-reading)' },
  { id: 'w1', label: 'W1 · Essay Lab', skillColor: 'var(--color-writing)' },
  { id: 'w2', label: 'W2 · Writing Sprints', skillColor: 'var(--color-writing)' },
  { id: 's1', label: 'S1 · Mock Examiner', skillColor: 'var(--color-speaking)' },
  { id: 's2', label: 'S2 · 3-Second Rule', skillColor: 'var(--color-speaking)' },
  { id: 'x1', label: 'X1 · Exam Room', skillColor: 'var(--color-exam)' },
] as const;

const BADGE_ICON_ITEMS = [
  { id: 'streak-7', label: 'Streak 7 ngày' },
  { id: 'streak-30', label: 'Streak 30 ngày' },
  { id: 'streak-100', label: 'Streak 100 ngày' },
  { id: 'cards-100', label: '100 thẻ FSRS' },
  { id: 'cards-500', label: '500 thẻ FSRS' },
  { id: 'cards-1000', label: '1000 thẻ FSRS' },
  { id: 'band-65', label: 'Mốc Band 6.5' },
  { id: 'band-70', label: 'Mốc Band 7.0' },
  { id: 'band-75', label: 'Mốc Band 7.5' },
  { id: 'band-80', label: 'Mốc Band 8.0' },
  { id: 'first-essay', label: 'Bài viết đầu tiên' },
  { id: 'first-speaking', label: 'Bài nói đầu tiên' },
] as const;

const ILLUSTRATION_ITEMS = [
  { id: 'welcome', label: 'Welcome · Lộ trình 8.0' },
  { id: 'goals', label: 'Goals · Mục tiêu Band' },
  { id: 'devices', label: 'Devices · Thiết bị & Tai nghe' },
  { id: 'placement', label: 'Placement · Kiểm tra đầu vào' },
  { id: 'empty-cards', label: 'Empty Cards · Hết thẻ đến hạn' },
  { id: 'offline', label: 'Offline · Chế độ ngoại tuyến' },
] as const;

const GRADING_DEMO_SCENARIOS = [
  {
    id: 'task2' as const,
    label: 'Task 2 Essay',
    packetInput: TASK2_FIXTURE_ATTEMPT,
    sampleResponse: TASK2_CLAUDE_RESPONSE,
  },
  {
    id: 'task1' as const,
    label: 'Task 1 Report',
    packetInput: TASK1_FIXTURE_ATTEMPT,
    sampleResponse: TASK1_CLAUDE_RESPONSE,
  },
  {
    id: 'speaking' as const,
    label: 'Speaking Mock',
    packetInput: SPEAKING_FIXTURE_ATTEMPT,
    sampleResponse: SPEAKING_CLAUDE_RESPONSE,
  },
  {
    id: 'sprint' as const,
    label: 'W2 Overview Sprint',
    packetInput: SPRINT_OVERVIEW_FIXTURE_ATTEMPT,
    sampleResponse: SPRINT_OVERVIEW_CLAUDE_RESPONSE,
  },
] as const;

export const DevComponentsScreen: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { sfxVolume, setSfxVolume, muted, toggleMute, playSfx, lastPlayedCue } = useAudio();
  const [answerText, setAnswerText] = useState('sustainable development');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [gradingDemoId, setGradingDemoId] = useState<(typeof GRADING_DEMO_SCENARIOS)[number]['id']>('task2');
  const [lastGradedSummary, setLastGradedSummary] = useState<string | null>(null);

  const activeGradingDemo =
    GRADING_DEMO_SCENARIOS.find((s) => s.id === gradingDemoId) ?? GRADING_DEMO_SCENARIOS[0];

  const handleDemoGraded = (payload: GradingPanelGradedPayload) => {
    const bandText =
      payload.postcheck.computedOverallBand !== null
        ? `Band ${payload.postcheck.computedOverallBand.toFixed(1)}`
        : 'Sprint (sao)';
    setLastGradedSummary(
      `onGraded: ${payload.parsed.data.kind} · ${payload.parsed.data.attemptId} · ${bandText} · ${payload.postcheck.quoteAudit.verifiedCount}/${payload.postcheck.quoteAudit.totalChecked} quotes khớp`,
    );
  };

  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="space-y-8 pb-12" data-testid="dev-components-showcase">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Pill tone="info">Design System · 08-DESIGN-SYSTEM.md</Pill>
          <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>
            Thư viện 17 UI Components chuẩn V3
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
            Kiểm tra trực quan toàn bộ component ở các trạng thái và bảng màu Editorial Academic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={theme === 'dark' ? 'primary' : 'secondary'}
            onClick={() => setTheme('dark')}
          >
            Theme Dark
          </Button>
          <Button
            size="sm"
            variant={theme === 'light' ? 'primary' : 'secondary'}
            onClick={() => setTheme('light')}
          >
            Theme Light
          </Button>
          <Button
            size="sm"
            variant={theme === 'exam' ? 'primary' : 'secondary'}
            onClick={() => setTheme('exam')}
          >
            Theme Exam
          </Button>
        </div>
      </div>

      {/* 1. Button, Pill, KeyHint, AudioButton */}
      <Card padding="lg" className="space-y-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          1. Button · Pill · KeyHint · AudioButton
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" skill="vocab" hotkey="Enter">
            Primary Vocab
          </Button>
          <Button variant="primary" skill="listening">
            Listening
          </Button>
          <Button variant="primary" skill="reading">
            Reading
          </Button>
          <Button variant="secondary" hotkey="H">
            Gợi ý
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>
            Đang tải
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="vocab">V1 · Từ vựng</Pill>
          <Pill tone="listening">L1 · Listening</Pill>
          <Pill tone="reading">R1 · Reading</Pill>
          <Pill tone="writing">W1 · Writing</Pill>
          <Pill tone="speaking">S1 · Speaking</Pill>
          <Pill tone="exam">X1 · Thi thử</Pill>
          <Pill tone="correct">Đúng</Pill>
          <Pill tone="wrong">Sai</Pill>
          <Pill tone="partial">Gần đúng</Pill>
          <KeyHint keyName="Esc" />
          <KeyHint keyName="Space" />
          <AudioButton
            playing={audioPlaying}
            onToggle={() => setAudioPlaying((p) => !p)}
            label={audioPlaying ? 'Đang phát mẫu' : 'Nghe phát âm UK'}
          />
        </div>
      </Card>

      {/* 2. ProgressRing, BandMeter, Timer */}
      <Card padding="lg" className="space-y-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          2. ProgressRing · BandMeter · Timer
        </h2>
        <div className="flex flex-wrap items-center gap-6">
          <ProgressRing value={18} max={30} skill="info" label="18/30'" />
          <ProgressRing value={75} max={100} skill="vocab" />
          <ProgressRing value={100} max={100} skill="reading" />
          <Timer remainingSec={245} totalSec={300} />
          <Timer remainingSec={40} totalSec={300} />
          <Timer remainingSec={15} totalSec={300} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <BandMeter
            skillCode="L"
            skillLabel="Listening"
            skill="listening"
            currentBand={7.0}
            targetBand={8.5}
            confidence={0.5}
            trend="up"
          />
          <BandMeter
            skillCode="R"
            skillLabel="Reading"
            skill="reading"
            currentBand={null}
            targetBand={8.5}
          />
        </div>
      </Card>

      {/* 3. AnswerInput & ChoiceButton */}
      <Card padding="lg" className="space-y-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          3. AnswerInput · ChoiceButton
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnswerInput
            label="NO MORE THAN TWO WORDS"
            wordLimit={2}
            value={answerText}
            onChange={setAnswerText}
            status="correct"
            helperText="Chấp nhận biến thể Anh-Anh và Anh-Mỹ."
          />
          <AnswerInput
            label="ONE WORD ONLY"
            wordLimit={1}
            value="unprecedented"
            onChange={() => undefined}
            status="idle"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ChoiceButton indexLabel="A" label="Trạng thái mặc định (Idle)" state="idle" />
          <ChoiceButton indexLabel="B" label="Đang chọn (Selected)" state="selected" />
          <ChoiceButton indexLabel="C" label="Đáp án đúng (Correct)" state="correct" />
          <ChoiceButton indexLabel="D" label="Đáp án sai (Wrong)" state="wrong" />
          <ChoiceButton
            indexLabel="E"
            label="Hiện đáp án đúng sau khi chọn sai (Reveal Correct)"
            state="reveal-correct"
          />
        </div>
      </Card>

      {/* 4. FeedbackPanel & Toast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeedbackPanel
          open
          status="correct"
          title="Đúng, bạn bắt được bẫy self-correction."
          correctAnswer="15th October"
          explanation="Người nói ban đầu nhắc tới 12th October nhưng ngay sau đó đính chính lại là 'Oh sorry, moved to the 15th'."
          evidenceQuote="Actually, the seminar was originally on the twelfth, but we pushed it to the fifteenth of October."
          onNext={() => undefined}
          onFlagItem={() => undefined}
        />

        <div className="space-y-4">
          <Toast
            tone="correct"
            title="Hoàn thành mục tiêu hôm nay"
            description="Bạn đã giữ chuỗi 12 ngày học liên tiếp (+120 XP)."
          />
          <Toast
            tone="partial"
            title="Lưu ý chính tả số nhiều"
            description="Từ 'student' thiếu hậu tố -s trong ngữ cảnh 'many international students'."
          />
          <Card padding="md" className="space-y-3">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              5. Modal · Sheet · Skeleton
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="secondary" onClick={() => setModalOpen(true)}>
                Mở Modal mẫu
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSheetOpen(true)}>
                Mở Sheet mẫu
              </Button>
            </div>
            <Skeleton lines={2} />
          </Card>
        </div>
      </div>

      {/* 6. RecapScreen & EmptyState */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <RecapScreen
          scoreLabel="8/10"
          xpEarned={140}
          winStatement="Bắt được 4/4 bẫy self-correction và distractor số liệu trong Part 1."
          accuracyPercent={80}
          durationSec={315}
          mistakes={[
            {
              id: 'm1',
              prompt: 'The library extension opens on ____.',
              userAnswer: 'Monday',
              correctAnswer: 'Wednesday',
              note: 'Bẫy distractor: Monday là lịch cũ trước khi cải tạo.',
            },
          ]}
          onRetryMistakes={() => undefined}
          onGoToday={() => undefined}
        />

        <EmptyState
          title="Hết thẻ ôn tập hôm nay"
          description="Bạn đã hoàn thành toàn bộ thẻ FSRS đến hạn. Muốn mở thêm 10 từ học thuật mới chứ?"
          action={<Button variant="primary">Học thêm 10 từ mới</Button>}
        />
      </div>

      {/* 7. SFX Audio Sprite Test Board */}
      <Card padding="lg" className="space-y-5" data-testid="dev-sfx-test-board">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              7. SFX Audio Sprite · 12 Cue Chuẩn (10-MOTION-AND-SOUND.md §3)
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
              Howler audio sprite (`sfx.webm` / `sfx.mp3` + `sfx.json`, chuẩn hoá −20 LUFS). Cue vừa phát:{' '}
              <span className="font-mono font-semibold" style={{ color: 'var(--color-info)' }}>
                {lastPlayedCue ?? 'chưa phát'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
              Âm lượng: {muted ? 'Tắt (0%)' : `${sfxVolume}%`}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : sfxVolume}
              onChange={(e) => setSfxVolume(Number(e.target.value))}
              aria-label="Âm lượng SFX"
              className="w-28 accent-blue-500"
            />
            <Button size="sm" variant="secondary" onClick={toggleMute}>
              {muted ? 'Bật âm' : 'Tắt âm'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {CANONICAL_SFX_CUES.map((cue) => {
            const [offsetMs, durationMs] = DEFAULT_SFX_SPRITE[cue.name] ?? [0, 0];
            const isLast = lastPlayedCue === cue.name;
            return (
              <button
                key={cue.name}
                type="button"
                data-testid={`sfx-btn-${cue.name}`}
                onClick={() => playSfx(cue.name)}
                className="text-left rounded-xl p-3 transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: `1px solid ${isLast ? 'var(--color-info)' : 'var(--color-border)'}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    ▶ {cue.label}
                  </span>
                  <span className="font-mono text-xs" style={{ color: 'var(--color-text-faint)' }}>
                    {durationMs}ms
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
                  {cue.descriptionVi}
                </p>
                <p className="font-mono text-[11px] mt-1" style={{ color: 'var(--color-text-faint)' }}>
                  @{offsetMs}ms{cue.alias ? ` · alias: ${cue.alias}` : ''}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 8. Asset Preview: 12 Game Icons, 12 Badge Icons, 6 Illustrations */}
      <Card padding="lg" className="space-y-6" data-testid="dev-assets-showcase">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            8. Bộ Asset Chuẩn V3 · 12 Game Icons · 12 Huy hiệu · 6 Minh hoạ unDraw
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
            Kiểm định bởi `scripts/validate/assets_credits.mjs` & ghi nguồn 100% tại `public/assets/CREDITS.md`.
          </p>
        </div>

        {/* 12 Game Icons */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            12 Game Icons (`public/assets/icons/games/*.svg` · game-icons.net CC BY 3.0)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {GAME_ICON_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center gap-2 rounded-xl p-3 text-center"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${item.skillColor}` }}
                >
                  <img
                    src={`${baseUrl}assets/icons/games/${item.id}.svg`}
                    alt={item.label}
                    className="w-6 h-6"
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 12 Badge Icons */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            12 Badge Icons (`public/assets/icons/badges/*.svg` · game-icons.net CC BY 3.0)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {BADGE_ICON_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center gap-2 rounded-xl p-3 text-center"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <img
                    src={`${baseUrl}assets/icons/badges/${item.id}.svg`}
                    alt={item.label}
                    className="w-6 h-6"
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6 unDraw Illustrations */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            6 Minh hoạ SVG (`public/assets/illustrations/*.svg` · unDraw style `#3B82F6`)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ILLUSTRATION_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center gap-2 rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <img
                  src={`${baseUrl}assets/illustrations/${item.id}.svg`}
                  alt={item.label}
                  className="w-full max-w-[220px] h-32 object-contain"
                />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 9. GradingPanel Demo (07-GRADING-WITH-CLAUDE.md) */}
      <Card padding="lg" className="space-y-5" data-testid="dev-grading-panel-showcase">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              9. GradingPanel · Chấm bài 0 đồng qua Claude chat (07-GRADING-WITH-CLAUDE.md)
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
              Thử trọn luồng 3 bước: Copy gói chấm → bấm &ldquo;Dán kết quả mẫu&rdquo; → Phân tích &amp;
              Hậu kiểm trích dẫn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {GRADING_DEMO_SCENARIOS.map((sc) => (
              <Button
                key={sc.id}
                size="sm"
                variant={gradingDemoId === sc.id ? 'primary' : 'secondary'}
                skill={sc.id === 'speaking' ? 'speaking' : 'writing'}
                onClick={() => {
                  setGradingDemoId(sc.id);
                  setLastGradedSummary(null);
                }}
              >
                {sc.label}
              </Button>
            ))}
          </div>
        </div>

        {lastGradedSummary && (
          <div
            className="rounded-[var(--radius-sm)] border px-3 py-2 text-xs font-mono"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-correct)',
              color: 'var(--color-correct)',
            }}
            data-testid="dev-grading-callback-summary"
          >
            {lastGradedSummary}
          </div>
        )}

        <GradingPanel
          packetInput={activeGradingDemo.packetInput}
          sampleResponse={activeGradingDemo.sampleResponse}
          onGraded={handleDemoGraded}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Lưu phần đã làm và thoát?"
        subtitle="Các thẻ bạn vừa trả lời vẫn được ghi nhận vào lịch FSRS."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Tiếp tục học
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              Thoát phiên
            </Button>
          </>
        }
      >
        Bạn đã hoàn thành 7/10 câu trong phiên này.
      </Modal>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Cấu hình phiên luyện L1 · Trap Detector"
        subtitle="Chọn chế độ Training hoặc Exam trước khi bắt đầu."
        footer={
          <Button variant="primary" onClick={() => setSheetOpen(false)}>
            Bắt đầu phiên
          </Button>
        }
      >
        <p>Chế độ Training cho phép tua lại 5 giây và hiển thị vùng bẫy trên sóng âm sau khi nộp.</p>
      </Sheet>
    </div>
  );
};
