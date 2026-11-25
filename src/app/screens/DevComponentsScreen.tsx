import React, { useRef, useState } from 'react';
import {
  Button,
  Card,
  LiveCard,
  Mascot,
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
import {
  celebrate,
  emit,
  haptic,
  numberPop,
  screenPunch,
  useFxTier,
  useMotionPref,
} from '../../design/fx';
import { MASCOT_STATES } from '../../content/mascotLines';
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
  { id: 'cards-100', label: '100 thẻ ôn tập' },
  { id: 'cards-500', label: '500 thẻ ôn tập' },
  { id: 'cards-1000', label: '1000 thẻ ôn tập' },
  { id: 'band-65', label: 'Mốc Band 6.5' },
  { id: 'band-70', label: 'Mốc Band 7.0' },
  { id: 'band-75', label: 'Mốc Band 7.5' },
  { id: 'band-80', label: 'Mốc Band 8.0' },
  { id: 'first-essay', label: 'Bài viết đầu tiên' },
  { id: 'first-speaking', label: 'Bài nói đầu tiên' },
] as const;

const UI_ICON_ITEMS = [
  'xp',
  'goal',
  'calendar',
  'freeze',
  'party',
  'shield',
  'compass',
  'brain',
  'clock',
  'check',
  'rocket',
  'lightbulb',
  'bookmark',
  'chart',
  'cloud',
  'zzz',
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
  const motionPref = useMotionPref();
  const fx = useFxTier({ examMode: theme === 'exam' });

  const [answerText, setAnswerText] = useState('sustainable development');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [flipped3d, setFlipped3d] = useState(false);
  const [cardKeyClicks, setCardKeyClicks] = useState(0);
  const [comboDemo, setComboDemo] = useState(0);
  const [nextTaskNotice, setNextTaskNotice] = useState<string | null>(null);
  const [gradingDemoId, setGradingDemoId] =
    useState<(typeof GRADING_DEMO_SCENARIOS)[number]['id']>('task2');
  const [lastGradedSummary, setLastGradedSummary] = useState<string | null>(null);
  const punchCardRef = useRef<HTMLDivElement | null>(null);

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
        <div className="min-w-0">
          <Pill tone="info">Design System · Cổng G2</Pill>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>
            Thư viện component chuẩn V3
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
            Kiểm tra toàn bộ thành phần, trạng thái, hiệu ứng FX, nhân vật Lexi và asset trên 3 theme.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      {/* 1. Button, Pill, KeyHint, AudioButton & Interactive Card */}
      <Card padding="lg" className="space-y-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          1. Button · Pill · KeyHint · AudioButton · Card bàn phím
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
          <Button variant="primary" disabled>
            Đã khoá
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

        <Card
          interactive
          skillAccent="reading"
          padding="sm"
          onClick={() => setCardKeyClicks((c) => c + 1)}
          aria-label="Thẻ Card bấm được bằng bàn phím"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Card tương tác (Tab tới đây rồi bấm Enter hoặc Space · U16)
            </span>
            <Pill tone="info">Đã bấm: {cardKeyClicks}</Pill>
          </div>
        </Card>
      </Card>

      {/* 2. LiveCard 2D & 3D Flip + FX Engine Demo */}
      <Card padding="lg" className="space-y-5" data-testid="dev-livecard-fx-showcase">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              2. LiveCard (2D sống &amp; 3D lật WebKit-safe) · Hệ FX ({fx.tier})
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
              Nhấn scale 0.96 / 80ms, lật 3D 2 mặt tách biệt (chữ không ngược), hạt Kenney &amp; số bay +XP.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={motionPref.prefReducedMotion ? 'primary' : 'secondary'}
              onClick={() => motionPref.setPref({ prefReducedMotion: !motionPref.prefReducedMotion })}
            >
              Giảm chuyển động: {motionPref.prefReducedMotion ? 'Bật' : 'Tắt'}
            </Button>
            <Button
              size="sm"
              variant={motionPref.disableParticles ? 'primary' : 'secondary'}
              onClick={() => motionPref.setPref({ disableParticles: !motionPref.disableParticles })}
            >
              Tắt hạt: {motionPref.disableParticles ? 'Bật' : 'Tắt'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <LiveCard
            skill="vocab"
            edition="mastered"
            breathing
            tilt
            onClick={() => {
              playSfx('tap');
              haptic('tap');
            }}
            ariaLabel="LiveCard 2D Mastered"
          >
            <div className="flex items-center gap-4">
              <img
                src={`${baseUrl}assets/icons/fluent/games/v1.webp`}
                alt="V1 Daily Run"
                width={56}
                height={56}
                className="w-14 h-14 object-contain shrink-0"
              />
              <div className="min-w-0">
                <Pill tone="vocab">Mastered · 2D LiveCard</Pill>
                <p className="text-base font-bold mt-1.5" style={{ color: 'var(--color-text)' }}>
                  Thẻ thở nhẹ &amp; nghiêng theo con trỏ
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
                  Lớp bóng tách dùng ::before (không tạo div rỗng M5).
                </p>
              </div>
            </div>
          </LiveCard>

          <div className="space-y-3">
            <LiveCard
              skill="listening"
              flipped={flipped3d}
              onClick={() => {
                setFlipped3d((f) => !f);
                playSfx('flip');
              }}
              ariaLabel="Lật thẻ 3D kiểm chữ không ngược"
              backContent={
                <div className="space-y-1.5">
                  <Pill tone="correct">Mặt sau · Chữ đọc xuôi (SR-45)</Pill>
                  <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                    mitigate (v): giảm nhẹ, làm dịu bớt
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                    Mặt sau xoay sẵn 180° với backface-visibility: hidden.
                  </p>
                </div>
              }
            >
              <div className="space-y-1.5">
                <Pill tone="listening">Mặt trước · Bấm để lật 3D</Pill>
                <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                  mitigate /ˈmɪt.ɪ.ɡeɪt/
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Bấm vào thẻ hoặc nút bên dưới để lật kiểm tra 2 mặt.
                </p>
              </div>
            </LiveCard>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                data-testid="dev-flip-3d-btn"
                onClick={() => {
                  setFlipped3d((f) => !f);
                  playSfx('flip');
                }}
              >
                {flipped3d ? 'Lật về mặt trước' : 'Lật mặt sau 3D'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                data-testid="dev-fx-spark-btn"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  emit('spark', { x: r.left + r.width / 2, y: r.top, count: 14 });
                  numberPop('+15 XP', { x: r.left + r.width / 2, y: r.top - 8 });
                  const next = comboDemo + 1;
                  setComboDemo(next);
                  playSfx('correct', { combo: next });
                  haptic('correct');
                }}
              >
                Bắn hạt +XP (Combo {comboDemo})
              </Button>
              <Button
                size="sm"
                variant="secondary"
                data-testid="dev-fx-shake-btn"
                onClick={() => {
                  screenPunch(punchCardRef.current, { mode: 'wrong-card' });
                  playSfx('wrong');
                  haptic('wrong');
                }}
              >
                Lắc thẻ sai (±6px)
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void celebrate('session');
                  playSfx('levelUp');
                }}
              >
                Confetti mốc
              </Button>
            </div>
            <div
              ref={punchCardRef}
              className="rounded-[var(--radius-sm)] border px-3 py-2 text-xs"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-dim)',
              }}
            >
              Khung câu hỏi mẫu (chỉ khung này lắc ±6px khi sai, không rung toàn màn hình · L-7).
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Mascot Lexi · 8 Trạng thái */}
      <Card padding="lg" className="space-y-5" data-testid="dev-mascot-showcase">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              3. Nhân vật Lexi · 8 trạng thái (Fluent Emoji 3D · MIT)
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
              Tải lười WebP nền trong suốt, khung 1/1 object-contain, lời thoại tiếng Việt ngắn có số thật.
            </p>
          </div>
          <Button
            size="sm"
            variant={motionPref.showMascot ? 'secondary' : 'primary'}
            onClick={() => motionPref.setPref({ showMascot: !motionPref.showMascot })}
          >
            Hiện nhân vật: {motionPref.showMascot ? 'Bật' : 'Tắt'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MASCOT_STATES.map((st) => (
            <div
              key={st}
              className="rounded-[var(--radius-md)] border p-3 space-y-2"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="text-xs font-mono font-semibold" style={{ color: 'var(--color-text-dim)' }}>
                state=&ldquo;{st}&rdquo;
              </div>
              <Mascot state={st} size={72} showBubble examMode={theme === 'exam'} />
            </div>
          ))}
        </div>
      </Card>

      {/* 4. ProgressRing, BandMeter, Timer */}
      <Card padding="lg" className="space-y-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          4. ProgressRing · BandMeter · Timer
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

      {/* 5. AnswerInput & ChoiceButton */}
      <Card padding="lg" className="space-y-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          5. AnswerInput · ChoiceButton (đủ 6 trạng thái)
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
            status="wrong"
            helperText="Ô nhập ≥ 16px giúp iOS Safari không tự phóng to."
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
          <ChoiceButton indexLabel="F" label="Đáp án bị khoá (Disabled)" state="idle" disabled />
        </div>
      </Card>

      {/* 6. FeedbackPanel (with nextTipVi) & Toast & Modal/Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeedbackPanel
          open
          status="wrong"
          title="Chưa đúng — chú ý bẫy tự đính chính."
          correctAnswer="15th October"
          explanation="Người nói ban đầu nhắc tới 12th October nhưng ngay sau đó đính chính lại là 'Oh sorry, moved to the 15th'."
          evidenceQuote="Actually, the seminar was originally on the twelfth, but we pushed it to the fifteenth of October."
          nextTipVi="Khi nghe thấy ngày/giờ đầu tiên, chờ thêm 1 câu xem có từ 'actually' hay 'sorry' không."
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
              6. Modal · Sheet (focus trap + Esc preventDefault) · Skeleton
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

      {/* 7. RecapScreen (Balatro tally + nextTask + Mascot) & EmptyState */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-2">
          <RecapScreen
            scoreLabel="8/10"
            xpEarned={140}
            correctCount={8}
            comboMultiplier={1.5}
            winStatement="Bắt được 4/4 bẫy tự đính chính và bẫy số liệu trong Part 1."
            accuracyPercent={80}
            durationSec={315}
            nextTask={{ taskId: 'demo-v2', gameId: 'v2', title: 'V2 · Rèn cụm từ' }}
            onNextTask={() => setNextTaskNotice('Đã bấm nút tiếp tới V2 · Rèn cụm từ')}
            mistakes={[
              {
                id: 'm1',
                prompt: 'The library extension opens on ____.',
                userAnswer: 'Monday',
                correctAnswer: 'Wednesday',
                note: 'Bẫy gây nhiễu: Monday là lịch cũ trước khi cải tạo.',
              },
            ]}
            onRetryMistakes={() => undefined}
            onGoToday={() => setNextTaskNotice('Đã bấm Về Hôm nay')}
            examMode={theme === 'exam'}
            autoCelebrate={false}
          />
          {nextTaskNotice && (
            <p className="text-xs font-medium" style={{ color: 'var(--color-info)' }}>
              {nextTaskNotice}
            </p>
          )}
        </div>

        <EmptyState
          title="Hết thẻ ôn tập hôm nay"
          description="Bạn đã hoàn thành toàn bộ thẻ đến hạn hôm nay. Muốn mở thêm 10 từ học thuật mới chứ?"
          action={<Button variant="primary">Học thêm 10 từ mới</Button>}
        />
      </div>

      {/* 8. SFX Audio Sprite Test Board */}
      <Card padding="lg" className="space-y-5" data-testid="dev-sfx-test-board">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              8. SFX Audio Sprite · 12 Cue Chuẩn (tối đa 2 tiếng chồng · combo pitch)
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
              Howler audio sprite (chuẩn hoá −20 LUFS). Cue vừa phát:{' '}
              <span className="font-mono font-semibold" style={{ color: 'var(--color-info)' }}>
                {lastPlayedCue ?? 'chưa phát'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="dev-sfx-vol" className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
              Âm lượng: {muted ? 'Tắt (0%)' : `${sfxVolume}%`}
            </label>
            <input
              id="dev-sfx-vol"
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : sfxVolume}
              onChange={(e) => setSfxVolume(Number(e.target.value))}
              aria-label="Âm lượng SFX"
              className="w-28 min-h-[44px]"
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
                className="text-left rounded-xl p-3 min-h-[44px] transition-colors cursor-pointer"
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
                <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                  @{offsetMs}ms{cue.alias ? ` · alias: ${cue.alias}` : ''}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 9. Asset Preview: Fluent Emoji 3D + 6 unDraw SVG */}
      <Card padding="lg" className="space-y-6" data-testid="dev-assets-showcase">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            9. Bộ Asset Chuẩn V3 · 40 Icon Fluent 3D · 6 Minh hoạ unDraw
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
            Kiểm định bởi scripts/validate/assets_credits.mjs &amp; ghi nguồn 100% tại public/assets/CREDITS.md.
          </p>
        </div>

        {/* 12 Game Icons Fluent 3D */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            12 Game Icons (Fluent Emoji 3D · WebP 1/1 contain)
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
                  className="w-12 h-12 rounded-lg flex items-center justify-center p-1"
                  style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${item.skillColor}` }}
                >
                  <img
                    src={`${baseUrl}assets/icons/fluent/games/${item.id}.webp`}
                    alt={item.label}
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 12 Badge Icons Fluent 3D */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            12 Huy hiệu (Fluent Emoji 3D · WebP 1/1 contain)
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
                  className="w-12 h-12 rounded-lg flex items-center justify-center p-1"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <img
                    src={`${baseUrl}assets/icons/fluent/badges/${item.id}.webp`}
                    alt={item.label}
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 16 UI / Mission Icons Fluent 3D */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            16 Icon nhiệm vụ &amp; trạng thái (Fluent Emoji 3D)
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {UI_ICON_ITEMS.map((id) => (
              <div
                key={id}
                className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <img
                  src={`${baseUrl}assets/icons/fluent/ui/${id}.webp`}
                  alt={id}
                  loading="lazy"
                  className="w-9 h-9 object-contain"
                />
                <span className="text-xs font-mono" style={{ color: 'var(--color-text-dim)' }}>
                  {id}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6 unDraw Illustrations */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            6 Minh hoạ SVG unDraw (màu chủ đạo token · 4/3 contain)
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

      {/* 10. GradingPanel Demo */}
      <Card padding="lg" className="space-y-5" data-testid="dev-grading-panel-showcase">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              10. GradingPanel · Chấm bài qua Claude chat
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
              Thử trọn luồng 3 bước: Sao chép đề chấm → dán kết quả mẫu → Phân tích &amp; hậu kiểm trích dẫn.
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
        subtitle="Các thẻ bạn vừa trả lời vẫn được ghi nhận vào lịch ôn tập."
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
        subtitle="Chọn chế độ Luyện tập hoặc Thi thử trước khi bắt đầu."
        footer={
          <Button variant="primary" onClick={() => setSheetOpen(false)}>
            Bắt đầu phiên
          </Button>
        }
      >
        <p>Chế độ Luyện tập cho phép tua lại 5 giây và hiển thị vùng bẫy trên sóng âm sau khi nộp.</p>
      </Sheet>
    </div>
  );
};
