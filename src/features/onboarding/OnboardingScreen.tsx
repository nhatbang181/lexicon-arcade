import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Database,
  Mic,
  Sparkles,
  Volume2,
  Target,
  User,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button, Card, Pill } from '../../design/components';
import { questionSlideVariants, reducedRouteVariants } from '../../design/motion';
import { db } from '../../core/storage/db';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import {
  migrateLegacyStorage,
  type MigrateLegacyResult,
} from '../../core/storage/migrateLegacy';
import { useTheme, type TargetBands } from '../../app/providers';

const BAND_OPTIONS = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];
const DAILY_GOAL_OPTIONS = [15, 30, 45, 60];
const DEFAULT_DAILY_GOAL = 30;

/** Câu mẫu thử loa (audio dictation đã có sẵn trong public/audio). */
const SAMPLE_SENTENCE = 'Final-year students must submit a ten-thousand-word dissertation in May.';
const SAMPLE_AUDIO_PATH = 'audio/dictation/dict_0001.mp3';

type DeviceTest = 'idle' | 'working' | 'ok' | 'fail';

const STEPS = [
  { id: 1, label: 'Chào mừng' },
  { id: 2, label: 'Mục tiêu 8.0' },
  { id: 3, label: 'Thiết bị' },
  { id: 4, label: 'Định vị đầu vào' },
] as const;

type StepNumber = 1 | 2 | 3 | 4;

export const OnboardingScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const prefersReduced = useReducedMotion();
  const { setTargetBands: syncTargetBands, setDailyGoalMin: syncDailyGoal } = useTheme();

  const [step, setStep] = useState<StepNumber>(1);
  const [displayName, setDisplayName] = useState('');
  const [targetBands, setTargetBands] = useState<TargetBands>({
    L: 8.5,
    R: 8.5,
    W: 7.5,
    S: 7.5,
  });
  const [dailyGoalMin, setDailyGoalMin] = useState<number>(DEFAULT_DAILY_GOAL);
  const [examDate, setExamDate] = useState<string>('');
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrateLegacyResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [speakerTest, setSpeakerTest] = useState<DeviceTest>('idle');
  const [micTest, setMicTest] = useState<DeviceTest>('idle');
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const baseUrl = import.meta.env.BASE_URL;

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [profile, savedName, doneRow] = await Promise.all([
          profileRepo.get(),
          db.kv.get('display_name'),
          db.kv.get('onboarding_done'),
        ]);
        if (!active) return;
        if (typeof savedName?.value === 'string' && savedName.value.trim()) {
          setDisplayName(savedName.value);
        }
        if (profile) {
          setTargetBands(profile.targetBands);
          // Lần đầu: mặc định 30 phút (F10). Làm lại thiết lập: giữ lựa chọn đã lưu nếu hợp lệ.
          if (doneRow?.value === true && DAILY_GOAL_OPTIONS.includes(profile.dailyGoalMin)) {
            setDailyGoalMin(profile.dailyGoalMin);
          }
          if (profile.examDate) {
            setExamDate(profile.examDate);
          }
        }
      } catch {
        // Use defaults if IndexedDB is initializing
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleMigrateLegacy = async () => {
    setMigrating(true);
    try {
      const res = await migrateLegacyStorage();
      setMigrationResult(res);
    } finally {
      setMigrating(false);
    }
  };

  const persistOnboarding = async (skippedPlacement: boolean) => {
    setSaving(true);
    try {
      const cleanName = displayName.trim();
      await profileRepo.update({
        targetBands,
        dailyGoalMin,
        examDate: examDate.trim() || null,
      });
      await db.kv.bulkPut([
        { key: 'onboarding_done', value: true },
        { key: 'onboarding_skipped', value: skippedPlacement },
      ]);
      if (cleanName) {
        await db.kv.put({ key: 'display_name', value: cleanName });
      } else {
        await db.kv.delete('display_name');
      }
      syncTargetBands(targetBands);
      syncDailyGoal(dailyGoalMin);
      navigate(skippedPlacement ? '/' : '/placement');
    } finally {
      setSaving(false);
    }
  };

  const playSample = () => {
    setSpeakerTest('working');
    try {
      sampleAudioRef.current?.pause();
      const audio = new Audio(`${baseUrl}${SAMPLE_AUDIO_PATH}`);
      sampleAudioRef.current = audio;
      audio.onended = () => setSpeakerTest('ok');
      audio.onerror = () => setSpeakerTest('fail');
      void audio.play().catch(() => setSpeakerTest('fail'));
    } catch {
      setSpeakerTest('fail');
    }
  };

  const testMic = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicTest('fail');
      return;
    }
    setMicTest('working');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicTest('ok');
    } catch {
      setMicTest('fail');
    }
  };

  useEffect(() => {
    const audioEl = sampleAudioRef;
    return () => audioEl.current?.pause();
  }, []);

  // Enter = hành động chính của bước hiện tại (onboarding chỉ bằng bàn phím, F10).
  const goPrimary = useCallback(() => {
    if (saving) return;
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
    else void persistOnboarding(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, step, displayName, targetBands, dailyGoalMin, examDate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing || e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const target = e.target;
      if (target instanceof Element && target.closest('button, a, select, textarea, summary')) {
        return; // phần tử đang focus tự xử lý Enter
      }
      e.preventDefault();
      goPrimary();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goPrimary]);

  const motionVariants = prefersReduced ? reducedRouteVariants : questionSlideVariants;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Thanh tiến độ 3 bước */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span style={{ color: 'var(--color-info)' }}>
            Bước {step} / {STEPS.length} · {STEPS[step - 1].label}
          </span>
          <span
            className="tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
          >
            {Math.round((step / STEPS.length) * 100)}%
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-2)' }}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(step / STEPS.length) * 100}%`,
              backgroundColor: 'var(--color-info)',
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="onboarding-step-1"
            variants={motionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card padding="lg" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <img
                  src={`${baseUrl}assets/illustrations/welcome.svg`}
                  alt="Chào mừng đến với Lexicon Arcade V3"
                  className="w-40 h-32 object-contain shrink-0"
                />
                <div className="space-y-2 text-center sm:text-left">
                  <Pill tone="info" icon={<Sparkles className="w-3.5 h-3.5" />}>
                    Lexicon Arcade V3 · Lộ trình 8.0
                  </Pill>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    Chào mừng tới Lộ trình IELTS 8.0
                  </h1>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                    Từ khoảng 6.0 lên 8.0 Academic cần nhịp học thật 30–60 phút mỗi ngày trong 9–18
                    tháng. Không API tốn phí, dữ liệu lưu ngay trên máy của bạn.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="onboarding-display-name"
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'var(--color-text)' }}
                >
                  <User className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
                  Tên hiển thị của bạn
                </label>
                <input
                  id="onboarding-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tên của bạn (tuỳ chọn)"
                  maxLength={32}
                  autoFocus
                  className="w-full h-11 px-3.5 rounded-[var(--radius-md)] border text-base font-medium"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              {/* Kiểm tra migrate dữ liệu cũ */}
              <div
                className="p-4 rounded-[var(--radius-md)] border space-y-3"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <Database className="w-4 h-4" style={{ color: 'var(--color-vocab)' }} />
                      Đã từng chơi Lexicon Arcade V1/V2?
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                      Chuyển thẻ ôn, ngân hàng lỗi sai và XP cũ sang bản mới (không xoá dữ liệu
                      cũ).
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleMigrateLegacy}
                    disabled={migrating}
                    data-testid="onboarding-migrate-btn"
                  >
                    {migrating ? 'Đang kiểm tra...' : 'Kiểm tra dữ liệu cũ'}
                  </Button>
                </div>

                {migrationResult && (
                  <div
                    className="text-xs px-3 py-2 rounded-[var(--radius-sm)] border flex items-center gap-2"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    <CheckCircle2
                      className="w-4 h-4 shrink-0"
                      style={{ color: 'var(--color-correct)' }}
                    />
                    {migrationResult.skipped ? (
                      <span>Dữ liệu V1/V2 đã được đồng bộ trước đó.</span>
                    ) : migrationResult.srsCardsMigrated +
                        migrationResult.mistakeCardsMigrated +
                        migrationResult.xpMigrated >
                      0 ? (
                      <span>
                        Đã chuyển {migrationResult.srsCardsMigrated} thẻ SRS,{' '}
                        {migrationResult.mistakeCardsMigrated} lỗi sai và{' '}
                        {migrationResult.xpMigrated} XP từ bản cũ.
                      </span>
                    ) : (
                      <span>
                        Không tìm thấy dữ liệu bản cũ trên trình duyệt này — sẵn sàng bắt đầu mới!
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  skill="info"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setStep(2)}
                  data-testid="onboarding-next-1"
                >
                  Tiếp tục
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="onboarding-step-2"
            variants={motionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card padding="lg" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <img
                  src={`${baseUrl}assets/illustrations/goals.svg`}
                  alt="Thiết lập mục tiêu Band IELTS"
                  className="w-40 h-32 object-contain shrink-0"
                />
                <div className="space-y-1.5 text-center sm:text-left">
                  <Pill tone="reading" icon={<Target className="w-3.5 h-3.5" />}>
                    Mục tiêu cá nhân
                  </Pill>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    Chọn mục tiêu Band & Thời lượng ngày
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
                    Kế hoạch Hôm nay sẽ tự động ưu tiên kỹ năng đang cách xa mục tiêu nhất.
                  </p>
                </div>
              </div>

              {/* Target Bands */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(
                  [
                    { key: 'L', label: 'Listening', color: 'var(--color-listening)' },
                    { key: 'R', label: 'Reading', color: 'var(--color-reading)' },
                    { key: 'W', label: 'Writing', color: 'var(--color-writing)' },
                    { key: 'S', label: 'Speaking', color: 'var(--color-speaking)' },
                  ] as const
                ).map((sk) => (
                  <div
                    key={sk.key}
                    className="p-3 rounded-[var(--radius-md)] border space-y-1.5"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <label
                      htmlFor={`ob-band-${sk.key}`}
                      className="block text-xs font-semibold"
                      style={{ color: sk.color }}
                    >
                      {sk.label} ({sk.key})
                    </label>
                    <select
                      id={`ob-band-${sk.key}`}
                      value={targetBands[sk.key]}
                      onChange={(e) =>
                        setTargetBands((prev) => ({
                          ...prev,
                          [sk.key]: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded border text-sm font-bold tabular-nums"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {BAND_OPTIONS.map((b) => (
                        <option key={b} value={b}>
                          Band {b.toFixed(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Thời lượng mỗi ngày */}
              <div className="space-y-2">
                <span className="block text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Thời lượng học mỗi ngày
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {DAILY_GOAL_OPTIONS.map((min) => {
                    const selected = dailyGoalMin === min;
                    return (
                      <Button
                        key={min}
                        variant={selected ? 'primary' : 'secondary'}
                        skill="info"
                        onClick={() => setDailyGoalMin(min)}
                        data-testid={`onboarding-goal-${min}`}
                      >
                        {min} phút/ngày
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Ngày thi dự kiến */}
              <div className="space-y-2">
                <label
                  htmlFor="onboarding-exam-date"
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'var(--color-text)' }}
                >
                  <Calendar className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
                  Ngày thi dự kiến (tuỳ chọn)
                </label>
                <input
                  id="onboarding-exam-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full sm:w-64 h-10 px-3 rounded-[var(--radius-md)] border text-sm"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => setStep(1)}
                >
                  Quay lại
                </Button>
                <Button
                  variant="primary"
                  skill="info"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  autoFocus
                  onClick={() => setStep(3)}
                  data-testid="onboarding-next-2"
                >
                  Tiếp tục
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="onboarding-step-3"
            variants={motionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card padding="lg" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <img
                  src={`${baseUrl}assets/illustrations/devices.svg`}
                  alt="Loa và micro"
                  className="w-40 h-32 object-contain shrink-0"
                />
                <div className="space-y-2 text-center sm:text-left">
                  <Pill tone="listening" icon={<Volume2 className="w-3.5 h-3.5" />}>
                    Thiết bị
                  </Pill>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    Thử loa và micro
                  </h1>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                    Nghe một câu mẫu và thử micro để chắc chắn Listening và Speaking chạy được. Bạn
                    có thể bỏ qua và thử lại trong Cài đặt.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-[var(--radius-md)] border space-y-3"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <p className="text-sm font-serif leading-relaxed" style={{ color: 'var(--color-text)' }}>
                    “{SAMPLE_SENTENCE}”
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Volume2 className="w-4 h-4" />}
                    onClick={playSample}
                    data-testid="onboarding-test-speaker"
                  >
                    Nghe câu mẫu
                  </Button>
                  <p className="text-xs" role="status" style={{ color: 'var(--color-text-dim)' }}>
                    {speakerTest === 'working' && 'Đang phát…'}
                    {speakerTest === 'ok' && 'Đã phát xong. Nếu bạn nghe được là loa ổn.'}
                    {speakerTest === 'fail' && 'Không phát được âm thanh. Kiểm tra loa hoặc âm lượng.'}
                  </p>
                </div>

                <div
                  className="p-4 rounded-[var(--radius-md)] border space-y-3"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                    Speaking cần micro. Trình duyệt sẽ hỏi quyền khi bạn bấm nút.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Mic className="w-4 h-4" />}
                    onClick={() => void testMic()}
                    loading={micTest === 'working'}
                    data-testid="onboarding-test-mic"
                  >
                    Thử micro
                  </Button>
                  <p className="text-xs" role="status" style={{ color: 'var(--color-text-dim)' }}>
                    {micTest === 'ok' && 'Micro hoạt động.'}
                    {micTest === 'fail' &&
                      'Chưa dùng được micro. Các phần Listening, Reading, Writing vẫn học bình thường.'}
                  </p>
                </div>
              </div>

              <ul className="space-y-1.5 text-sm" style={{ color: 'var(--color-text-dim)' }}>
                <li>1. Writing và Speaking được Claude chấm, không dùng API và không tốn tiền.</li>
                <li>2. App tạo sẵn nội dung để bạn dán vào Claude, rồi dán kết quả về lại app.</li>
                <li>3. Bài viết và ghi âm chỉ lưu trên máy của bạn.</li>
              </ul>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => setStep(2)}
                >
                  Quay lại
                </Button>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(4)}
                    data-testid="onboarding-skip-devices"
                  >
                    Bỏ qua
                  </Button>
                  <Button
                    variant="primary"
                    skill="info"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    autoFocus
                    onClick={() => setStep(4)}
                    data-testid="onboarding-next-3"
                  >
                    Tiếp tục
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="onboarding-step-4"
            variants={motionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card padding="lg" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <img
                  src={`${baseUrl}assets/illustrations/placement.svg`}
                  alt="Bài định vị từ vựng nhanh"
                  className="w-40 h-32 object-contain shrink-0"
                />
                <div className="space-y-2 text-center sm:text-left">
                  <Pill tone="vocab" icon={<Sparkles className="w-3.5 h-3.5" />}>
                    Bước cuối · Khởi tạo bộ thẻ ôn
                  </Pill>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    Định vị nhanh vốn từ học thuật
                  </h1>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                    15 câu trắc nghiệm phân tầng Band 5.5 → 8.5 (chỉ mất ~3 phút). Hệ thống sẽ ước
                    lượng band từ vựng ban đầu và nạp sẵn 15 thẻ khởi đầu vào Daily Run (V1).
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <Button
                  variant="ghost"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => setStep(3)}
                  disabled={saving}
                >
                  Quay lại
                </Button>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => void persistOnboarding(true)}
                    disabled={saving}
                    data-testid="onboarding-skip-placement"
                  >
                    Bỏ qua để vào Hôm nay ngay
                  </Button>
                  <Button
                    variant="primary"
                    skill="vocab"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    autoFocus
                    onClick={() => void persistOnboarding(false)}
                    disabled={saving}
                    data-testid="onboarding-start-placement"
                  >
                    Làm Placement từ vựng (3 phút)
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
