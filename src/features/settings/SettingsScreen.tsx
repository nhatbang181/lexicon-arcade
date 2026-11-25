import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import {
  AlertTriangle,
  Archive,
  ArrowUpRight,
  Bell,
  CalendarPlus,
  Download,
  HardDrive,
  HeartHandshake,
  MonitorCheck,
  Moon,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Upload,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button, Card, Modal, Pill, Toast, type ToastTone } from '../../design/components';
import { useMotionPref } from '../../design/fx';
import { useAudio, useTheme, type AppTheme } from '../../app/providers';
import {
  clearAllUserData,
  estimateStorageUsage,
  exportBackup,
  importBackup,
  isQuotaExceededError,
  LAST_BACKUP_KV_KEY,
  requestPersistentStorage,
  shouldRemindBackup,
  verifyBackup,
  type BackupEnvelope,
  type BackupImportMode,
  type StorageUsageInfo,
} from '../../core/storage/backup';
import { db } from '../../core/storage/db';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import { downloadDailyReminderIcs } from '../today/icsReminder';

const BAND_OPTIONS = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

/** Khoá `kv` đồng bộ cả quy ước T3-C (`pref.*`) lẫn `FX_KV_KEYS` của T3-A (`pref:*`). */
const PREF_KEYS = {
  reducedMotion: ['pref.reducedMotion', 'pref:reducedMotion'] as const,
  particlesOff: ['pref.particlesOff', 'pref:disableParticles'] as const,
  hapticsOff: ['pref.hapticsOff', 'pref:disableHaptic'] as const,
  showMascot: ['pref.showMascot', 'pref:showMascot'] as const,
};

interface MotionPrefs {
  reducedMotion: boolean;
  particlesOff: boolean;
  hapticsOff: boolean;
  showMascot: boolean;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return 'Chưa rõ';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const SettingsScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const { theme, setTheme, targetBands, setTargetBands, dailyGoalMin, setDailyGoalMin } =
    useTheme();
  const { sfxVolume, setSfxVolume, muted, toggleMute } = useAudio();
  const motionPref = useMotionPref();

  const [notice, setNotice] = useState<{ tone: ToastTone; title: string; desc?: string } | null>(
    null,
  );
  const [displayName, setDisplayName] = useState('');
  const [reminderTime, setReminderTime] = useState('20:00');
  const prefs: MotionPrefs = {
    reducedMotion: motionPref.prefReducedMotion,
    particlesOff: motionPref.disableParticles,
    hapticsOff: motionPref.disableHaptic,
    showMascot: motionPref.showMascot,
  };

  const [storageInfo, setStorageInfo] = useState<StorageUsageInfo | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<number | null>(null);
  const [backupReminderDue, setBackupReminderDue] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<BackupImportMode>('merge');
  const [pendingRestore, setPendingRestore] = useState<{
    rawText: string;
    envelope: BackupEnvelope;
  } | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [keepRecordings, setKeepRecordings] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshMeta = async () => {
    const [
      nameRow,
      reminderRow,
      lastBackupRow,
      reminderStatus,
      storage,
    ] = await Promise.all([
      db.kv.get('display_name'),
      db.kv.get('study_reminder_time'),
      db.kv.get(LAST_BACKUP_KV_KEY),
      shouldRemindBackup(),
      estimateStorageUsage(),
    ]);

    if (typeof nameRow?.value === 'string') setDisplayName(nameRow.value);
    if (typeof reminderRow?.value === 'string' && /^\d{1,2}:\d{2}$/.test(reminderRow.value)) {
      setReminderTime(reminderRow.value);
    }
    setLastBackupAt(typeof lastBackupRow?.value === 'number' ? lastBackupRow.value : null);
    setBackupReminderDue(reminderStatus.due);
    setStorageInfo(storage);
  };

  useEffect(() => {
    void refreshMeta();
  }, []);

  const handleSaveName = async () => {
    const clean = displayName.trim();
    if (clean) {
      await db.kv.put({ key: 'display_name', value: clean });
    } else {
      await db.kv.delete('display_name');
    }
    setNotice({
      tone: 'correct',
      title: 'Đã lưu tên hiển thị',
      desc: clean ? `Ứng dụng sẽ chào bạn là "${clean}".` : 'Đã quay về tên gọi mặc định "bạn".',
    });
  };

  const handleTogglePref = async (key: keyof MotionPrefs) => {
    const nextValue = !prefs[key];
    if (key === 'reducedMotion') motionPref.setPref({ prefReducedMotion: nextValue });
    else if (key === 'particlesOff') motionPref.setPref({ disableParticles: nextValue });
    else if (key === 'hapticsOff') motionPref.setPref({ disableHaptic: nextValue });
    else if (key === 'showMascot') motionPref.setPref({ showMascot: nextValue });
    const [k1, k2] = PREF_KEYS[key];
    await db.kv.bulkPut([
      { key: k1, value: nextValue },
      { key: k2, value: nextValue },
    ]);
  };

  const handleSaveReminderTime = async (value: string) => {
    setReminderTime(value);
    await db.kv.put({ key: 'study_reminder_time', value });
  };

  const handleRequestPersist = async () => {
    const granted = await requestPersistentStorage();
    const updated = await estimateStorageUsage();
    setStorageInfo(updated);
    if (granted === true) {
      setNotice({
        tone: 'correct',
        title: 'Đã bật chế độ giữ dữ liệu bền vững',
        desc: 'Trình duyệt sẽ ưu tiên không tự xoá dữ liệu học khi máy ít dung lượng.',
      });
    } else if (granted === false) {
      setNotice({
        tone: 'info',
        title: 'Trình duyệt chưa cấp quyền bền vững tự động',
        desc: 'Trên Safari/iPhone, hãy thêm ứng dụng ra Màn hình chính và sao lưu JSON định kỳ mỗi tuần.',
      });
    } else {
      setNotice({
        tone: 'info',
        title: 'Trình duyệt này không hỗ trợ API giữ bộ nhớ bền vững',
        desc: 'Bạn nên xuất tệp sao lưu .json mỗi tuần để an toàn tuyệt đối.',
      });
    }
  };

  const handleExportBackup = async () => {
    setExporting(true);
    try {
      const envelope = await exportBackup();
      const json = JSON.stringify(envelope, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const dateStamp = envelope.exportedAt.slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lexicon-arcade-backup-${dateStamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await refreshMeta();
      setNotice({
        tone: 'correct',
        title: 'Đã xuất bản sao lưu JSON thành công',
        desc: `Gồm ${envelope.data.cards.length} thẻ ôn, ${envelope.data.attempts.length} phiên học, ${envelope.data.essays.length} bài viết và ${envelope.data.userItems?.length ?? 0} mục tự tạo.`,
      });
    } catch (err) {
      setNotice({
        tone: 'wrong',
        title: isQuotaExceededError(err) ? 'Bộ nhớ trình duyệt đã đầy' : 'Không thể xuất sao lưu',
        desc: err instanceof Error ? err.message : 'Lỗi không xác định.',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const check = verifyBackup(text);
      if (!check.valid || !check.envelope) {
        setNotice({
          tone: 'wrong',
          title: 'Tệp sao lưu không hợp lệ hoặc bị hỏng',
          desc: check.error ?? 'Không khớp mã kiểm tra toàn vẹn.',
        });
        return;
      }
      setImportMode('merge');
      setPendingRestore({ rawText: text, envelope: check.envelope });
    } catch (err) {
      setNotice({
        tone: 'wrong',
        title: 'Không thể đọc tệp sao lưu',
        desc: err instanceof Error ? err.message : 'Lỗi đọc tệp.',
      });
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setImporting(true);
    try {
      const { restoredCounts, mode } = await importBackup(pendingRestore.rawText, undefined, {
        mode: importMode,
      });
      const restoredProfile = await profileRepo.get();
      if (restoredProfile) {
        setTargetBands(restoredProfile.targetBands);
        setDailyGoalMin(restoredProfile.dailyGoalMin);
      }
      setPendingRestore(null);
      await refreshMeta();
      setNotice({
        tone: 'correct',
        title:
          mode === 'merge'
            ? 'Đã gộp dữ liệu sao lưu thành công'
            : 'Đã khôi phục dữ liệu thành công',
        desc: `Đã cập nhật ${restoredCounts.cards} thẻ ôn, ${restoredCounts.attempts} phiên học, ${restoredCounts.reviews} lượt ôn và ${restoredCounts.userItems} mục tự tạo.`,
      });
    } catch (err) {
      setNotice({
        tone: 'wrong',
        title: isQuotaExceededError(err) ? 'Bộ nhớ trình duyệt đã đầy' : 'Khôi phục thất bại',
        desc: err instanceof Error ? err.message : 'Lỗi ghi IndexedDB.',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    setDeleting(true);
    try {
      await clearAllUserData({ keepRecordings });
      setDeleteModalOpen(false);
      setDeleteStep(1);
      await refreshMeta();
      setNotice({
        tone: 'info',
        title: 'Đã xoá dữ liệu học cục bộ',
        desc: keepRecordings
          ? 'Các bản ghi âm Speaking của bạn vẫn được giữ nguyên.'
          : 'Toàn bộ dữ liệu học trên trình duyệt đã được đặt lại.',
      });
    } catch (err) {
      setNotice({
        tone: 'wrong',
        title: 'Không thể xoá dữ liệu',
        desc: err instanceof Error ? err.message : 'Lỗi thao tác IndexedDB.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const themeOptions: Array<{ id: AppTheme; label: string; desc: string; icon: React.ReactNode }> =
    [
      {
        id: 'light',
        label: 'Sáng (Editorial Light)',
        desc: 'Nền giấy sáng, độ tương phản cao cho ban ngày.',
        icon: <Sun className="w-4 h-4" />,
      },
      {
        id: 'dark',
        label: 'Tối (Focus Arcade)',
        desc: 'Nền tối sâu, điểm nhấn màu kỹ năng, đỡ mỏi mắt.',
        icon: <Moon className="w-4 h-4" />,
      },
      {
        id: 'exam',
        label: 'Thi máy (Computer-delivered)',
        desc: 'Trắng – đen trung tính, tắt hiệu ứng màu như phòng thi thật.',
        icon: <MonitorCheck className="w-4 h-4" />,
      },
    ];

  const motionSwitches: Array<{
    key: keyof MotionPrefs;
    label: string;
    desc: string;
    testId: string;
  }> = [
    {
      key: 'reducedMotion',
      label: 'Giảm chuyển động',
      desc: 'Tắt hiệu ứng trượt, lật 3D và chuyển cảnh động trên toàn ứng dụng.',
      testId: 'pref-reduced-motion',
    },
    {
      key: 'particlesOff',
      label: 'Tắt hạt hiệu ứng',
      desc: 'Tắt pháo hoa và hạt bắn khi trả lời đúng hoặc đạt chuỗi.',
      testId: 'pref-particles-off',
    },
    {
      key: 'hapticsOff',
      label: 'Tắt rung phản hồi',
      desc: 'Không rung điện thoại khi bấm đáp án hay hoàn thành phiên.',
      testId: 'pref-haptics-off',
    },
    {
      key: 'showMascot',
      label: 'Hiện nhân vật đồng hành (Lexi)',
      desc: 'Hiển thị nhân vật Lexi ở các màn khung (Hôm nay, Hub, Thống kê). Luôn tự ẩn khi làm bài.',
      testId: 'pref-show-mascot',
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Cài đặt hệ thống
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
          Điều chỉnh hồ sơ, giao diện, chuyển động, giờ nhắc học, sao lưu và cài đặt an toàn trên
          iPhone.
        </p>
      </div>

      {notice && (
        <Toast
          tone={notice.tone}
          title={notice.title}
          description={notice.desc}
          onDismiss={() => setNotice(null)}
        />
      )}

      {/* 0. Hồ sơ & Tên hiển thị */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Hồ sơ người học
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Đổi tên hiển thị ở màn Hôm nay (lưu cục bộ trên máy).
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nhập tên của bạn (bỏ trống để gọi là bạn)"
            maxLength={32}
            aria-label="Tên hiển thị của bạn"
            data-testid="settings-display-name"
            className="flex-1 min-h-[44px] px-3.5 rounded-[var(--radius-md)] border text-base font-medium"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
          <Button
            variant="secondary"
            onClick={() => void handleSaveName()}
            data-testid="settings-save-name"
          >
            Lưu tên
          </Button>
        </div>
      </Card>

      {/* 1. Giao diện */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Giao diện hiển thị
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
              Chuyển đổi tức thì giữa Sáng, Tối và chế độ Thi máy.
            </p>
          </div>
          <Pill tone="info">Đang chọn: {theme.toUpperCase()}</Pill>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const active = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className="p-4 min-h-[44px] rounded-[var(--radius-md)] border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2"
                style={{
                  backgroundColor: active
                    ? 'color-mix(in srgb, var(--color-info) 12%, var(--color-surface-2))'
                    : 'var(--color-surface-2)',
                  borderColor: active ? 'var(--color-info)' : 'var(--color-border)',
                }}
              >
                <div
                  className="flex items-center gap-2 font-semibold text-sm"
                  style={{ color: 'var(--color-text)' }}
                >
                  <span style={{ color: active ? 'var(--color-info)' : 'var(--color-text-dim)' }}>
                    {opt.icon}
                  </span>
                  <span>{opt.label}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 1b. Chuyển động, Hiệu ứng & Nhân vật (khớp T3-A useMotionPref) */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: 'var(--color-vocab)' }} />
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Chuyển động, Hiệu ứng & Nhân vật
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Tôn trọng cài đặt giảm chuyển động của hệ điều hành và cho phép tắt riêng từng nhóm hiệu
              ứng.
            </p>
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {motionSwitches.map((sw) => {
            const checked = prefs[sw.key];
            return (
              <div
                key={sw.key}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {sw.label}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                    {sw.desc}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  aria-label={sw.label}
                  data-testid={sw.testId}
                  onClick={() => void handleTogglePref(sw.key)}
                  className="inline-flex items-center justify-center min-w-[68px] min-h-[44px] px-3 rounded-[var(--radius-md)] border text-xs font-bold cursor-pointer shrink-0 transition-colors"
                  style={{
                    backgroundColor: checked
                      ? 'var(--color-info)'
                      : 'var(--color-surface-2)',
                    borderColor: checked ? 'var(--color-info)' : 'var(--color-border)',
                    color: checked
                      ? 'var(--color-on-accent, var(--color-bg))'
                      : 'var(--color-text-dim)',
                  }}
                >
                  {checked ? 'Bật' : 'Tắt'}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. Mục tiêu Band & Thời lượng & Giờ nhắc học */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: 'var(--color-reading)' }} />
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Mục tiêu Band & Lịch nhắc học
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Mặc định lộ trình 8.0 Overall: Listening 8.5 · Reading 8.5 · Writing 7.5 · Speaking 7.5
            </p>
          </div>
        </div>

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
              className="p-3.5 rounded-[var(--radius-md)] border space-y-2"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <label
                htmlFor={`target-band-${sk.key}`}
                className="block text-xs font-semibold"
                style={{ color: sk.color }}
              >
                {sk.label} ({sk.key})
              </label>
              <select
                id={`target-band-${sk.key}`}
                value={targetBands[sk.key]}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTargetBands((prev) => {
                    const next = { ...prev, [sk.key]: val };
                    void profileRepo.update({ targetBands: next });
                    return next;
                  });
                }}
                className="w-full min-h-[44px] px-2.5 py-1.5 rounded border text-base font-bold tabular-nums appearance-none"
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

        <div
          className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            Thời lượng mục tiêu mỗi ngày:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {[15, 30, 45, 60, 90].map((min) => (
              <Button
                key={min}
                size="md"
                variant={dailyGoalMin === min ? 'primary' : 'secondary'}
                onClick={() => {
                  setDailyGoalMin(min);
                  void profileRepo.update({ dailyGoalMin: min });
                }}
              >
                {min} phút
              </Button>
            ))}
          </div>
        </div>

        <div
          className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
            <label
              htmlFor="settings-reminder-time"
              className="text-sm font-medium"
              style={{ color: 'var(--color-text)' }}
            >
              Giờ nhắc học hằng ngày (tối đa 1 nhắc/ngày):
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="settings-reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e) => void handleSaveReminderTime(e.target.value)}
              data-testid="settings-reminder-time"
              className="min-h-[44px] px-3 rounded-[var(--radius-md)] border text-base font-semibold tabular-nums appearance-none"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
            <Button
              variant="secondary"
              leftIcon={<CalendarPlus className="w-4 h-4" />}
              onClick={() => downloadDailyReminderIcs(reminderTime, dailyGoalMin)}
              data-testid="settings-export-ics"
            >
              Xuất lịch (.ics)
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Âm thanh SFX */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {muted || sfxVolume === 0 ? (
              <VolumeX className="w-5 h-5" style={{ color: 'var(--color-wrong)' }} />
            ) : (
              <Volume2 className="w-5 h-5" style={{ color: 'var(--color-listening)' }} />
            )}
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                Âm thanh & Hiệu ứng (SFX)
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                Tự động tắt trong chế độ Thi máy hoặc khi đang phát bài nghe / thu âm.
              </p>
            </div>
          </div>

          <Button variant="secondary" size="md" onClick={toggleMute}>
            {muted ? 'Đang tắt tiếng' : 'Tắt tiếng'}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : sfxVolume}
            onChange={(e) => setSfxVolume(Number(e.target.value))}
            aria-label="Âm lượng SFX"
            className="flex-1 min-h-[44px] appearance-none rounded-full h-2 cursor-pointer"
            style={{ backgroundColor: 'var(--color-surface-2)' }}
          />
          <span
            className="w-12 text-right text-sm font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {muted ? 0 : sfxVolume}%
          </span>
        </div>
      </Card>

      {/* 4. P0 An toàn iPhone PWA & Dung lượng bộ nhớ (PB-09, L-12, TU-01, F18) */}
      <Card skillAccent="info" padding="lg" className="space-y-4" data-testid="settings-iphone-pwa">
        <div className="flex items-start gap-2.5">
          <Smartphone className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-info)' }} />
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Cài ứng dụng trên iPhone & Bảo vệ bộ nhớ
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
              Thêm vào Màn hình chính để học toàn màn hình, hạn chế iOS tự dọn bộ nhớ trình duyệt.
            </p>
          </div>
        </div>

        {/* Cảnh báo P0 trước khi cài trên iPhone */}
        <div
          className="p-3.5 rounded-[var(--radius-md)] border space-y-2.5"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--color-partial) 12%, var(--color-surface-2))',
            borderColor: 'var(--color-partial)',
          }}
        >
          <div className="flex items-start gap-2.5 text-xs" style={{ color: 'var(--color-text)' }}>
            <AlertTriangle
              className="w-4 h-4 shrink-0 mt-0.5"
              style={{ color: 'var(--color-partial)' }}
            />
            <div className="space-y-1 leading-relaxed">
              <strong>Lưu ý quan trọng trước khi cài trên iPhone (Safari):</strong> dữ liệu học
              trong tab Safari <strong>không tự chuyển</strong> sang ứng dụng mới trên Màn hình
              chính. Hãy bấm <strong>Sao lưu trước khi cài</strong> ngay bên dưới, cài ra Màn hình
              chính xong rồi vào Cài đặt → Khôi phục (chế độ Gộp).
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              skill="info"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => void handleExportBackup()}
              disabled={exporting}
              data-testid="settings-backup-before-pwa"
            >
              Sao lưu trước khi cài
            </Button>
          </div>
        </div>

        <ol className="space-y-1.5 text-xs list-decimal list-inside" style={{ color: 'var(--color-text-dim)' }}>
          <li>Mở trang này bằng trình duyệt <strong>Safari</strong> trên iPhone.</li>
          <li>Bấm nút <strong>Chia sẻ (ô vuông có mũi tên lên)</strong> ở thanh dưới cùng.</li>
          <li>Chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong> rồi mở ứng dụng từ biểu tượng mới.</li>
        </ol>

        {/* Dung lượng lưu trữ + persist() */}
        <div
          className="p-3.5 rounded-[var(--radius-md)] border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-2.5 text-xs">
            <HardDrive className="w-4 h-4 shrink-0" style={{ color: 'var(--color-listening)' }} />
            <div className="space-y-0.5">
              <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                Dung lượng ước tính: {formatBytes(storageInfo?.usageBytes ?? null)}
                {storageInfo?.quotaBytes ? ` / ${formatBytes(storageInfo.quotaBytes)}` : ''}
              </div>
              <div style={{ color: 'var(--color-text-dim)' }}>
                Trạng thái giữ dữ liệu:{' '}
                <strong>
                  {storageInfo?.persisted === true
                    ? 'Bền vững (đã bảo vệ)'
                    : storageInfo?.persisted === false
                      ? 'Mặc định (nên bật bền vững)'
                      : 'Chưa xác định'}
                </strong>
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => void handleRequestPersist()}
            data-testid="settings-request-persist"
          >
            Giữ dữ liệu bền vững
          </Button>
        </div>
      </Card>

      {/* 5. P0 Sao lưu & Khôi phục (Gộp / Thay thế) + Xoá dữ liệu (PB-05, X12, PB-12) */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                Sao lưu & Khôi phục dữ liệu (IndexedDB)
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                Toàn bộ thẻ ôn, mục tự tạo, bài viết và bản thu nằm ngay trên máy của bạn, không gửi
                lên máy chủ.
              </p>
            </div>
          </div>
          <Pill tone={backupReminderDue ? 'partial' : 'neutral'}>
            {lastBackupAt
              ? `Sao lưu cuối: ${new Date(lastBackupAt).toLocaleDateString('vi-VN')}`
              : 'Chưa sao lưu lần nào'}
          </Pill>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => void handleExportBackup()}
            disabled={exporting}
            data-testid="settings-export-backup"
          >
            {exporting ? 'Đang xuất...' : 'Xuất bản sao lưu (.json)'}
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            data-testid="settings-import-backup"
          >
            {importing ? 'Đang khôi phục...' : 'Khôi phục từ tệp'}
          </Button>
          <Button
            variant="ghost"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => {
              setDeleteStep(1);
              setKeepRecordings(true);
              setDeleteModalOpen(true);
            }}
            data-testid="settings-delete-data"
          >
            Xoá dữ liệu học
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => void handleFileSelected(e)}
            aria-label="Chọn tệp sao lưu JSON"
            data-testid="settings-import-input"
          />
        </div>

        {/* Modal xác nhận khôi phục: hỗ trợ cả Gộp (mặc định) và Thay thế */}
        <Modal
          open={pendingRestore !== null}
          onClose={() => !importing && setPendingRestore(null)}
          title="Xác nhận nhập bản sao lưu"
          subtitle="Chọn Gộp để giữ dữ liệu hiện có (khuyên dùng) hoặc Thay thế toàn bộ."
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setPendingRestore(null)}
                disabled={importing}
              >
                Huỷ
              </Button>
              <Button
                variant="primary"
                skill="info"
                onClick={() => void handleConfirmRestore()}
                disabled={importing}
                data-testid="settings-confirm-restore"
              >
                {importing
                  ? 'Đang xử lý...'
                  : importMode === 'merge'
                    ? 'Xác nhận gộp dữ liệu'
                    : 'Xác nhận thay thế toàn bộ'}
              </Button>
            </>
          }
        >
          {pendingRestore && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Chế độ nhập sao lưu">
                <button
                  type="button"
                  role="radio"
                  aria-checked={importMode === 'merge'}
                  onClick={() => setImportMode('merge')}
                  data-testid="settings-import-mode-merge"
                  className="p-3 min-h-[44px] rounded-[var(--radius-md)] border text-left cursor-pointer space-y-1"
                  style={{
                    backgroundColor:
                      importMode === 'merge'
                        ? 'color-mix(in srgb, var(--color-info) 14%, var(--color-surface-2))'
                        : 'var(--color-surface-2)',
                    borderColor: importMode === 'merge' ? 'var(--color-info)' : 'var(--color-border)',
                  }}
                >
                  <div className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                    Gộp dữ liệu (Khuyên dùng)
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                    Giữ tiến độ mới hơn, thêm thẻ & bài còn thiếu, không làm mất bản ghi âm trên máy.
                  </p>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={importMode === 'replace'}
                  onClick={() => setImportMode('replace')}
                  data-testid="settings-import-mode-replace"
                  className="p-3 min-h-[44px] rounded-[var(--radius-md)] border text-left cursor-pointer space-y-1"
                  style={{
                    backgroundColor:
                      importMode === 'replace'
                        ? 'color-mix(in srgb, var(--color-partial) 14%, var(--color-surface-2))'
                        : 'var(--color-surface-2)',
                    borderColor:
                      importMode === 'replace' ? 'var(--color-partial)' : 'var(--color-border)',
                  }}
                >
                  <div className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                    Thay thế toàn bộ
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                    Ghi đè sạch dữ liệu hiện tại bằng đúng nội dung trong tệp sao lưu.
                  </p>
                </button>
              </div>

              <div
                className="p-3 rounded-[var(--radius-md)] border space-y-1 text-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-dim)',
                }}
              >
                <div>
                  Thời điểm xuất:{' '}
                  <strong style={{ color: 'var(--color-text)' }}>
                    {new Date(pendingRestore.envelope.exportedAt).toLocaleString('vi-VN')}
                  </strong>
                </div>
                <div>
                  Số thẻ ôn:{' '}
                  <strong style={{ color: 'var(--color-text)' }}>
                    {pendingRestore.envelope.data.cards.length}
                  </strong>{' '}
                  · Mục tự tạo:{' '}
                  <strong style={{ color: 'var(--color-text)' }}>
                    {pendingRestore.envelope.data.userItems?.length ?? 0}
                  </strong>
                </div>
                <div>
                  Số phiên học:{' '}
                  <strong style={{ color: 'var(--color-text)' }}>
                    {pendingRestore.envelope.data.attempts.length}
                  </strong>{' '}
                  · Bài viết:{' '}
                  <strong style={{ color: 'var(--color-text)' }}>
                    {pendingRestore.envelope.data.essays.length}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal PB-12: Xoá dữ liệu 2 bước có gợi ý sao lưu trước */}
        <Modal
          open={deleteModalOpen}
          onClose={() => !deleting && setDeleteModalOpen(false)}
          title={deleteStep === 1 ? 'Xoá dữ liệu học trên máy?' : 'Xác nhận lần cuối'}
          subtitle={
            deleteStep === 1
              ? 'Nên xuất một bản sao lưu .json trước khi xoá để có thể khôi phục khi cần.'
              : 'Hành động này không thể hoàn tác nếu bạn chưa xuất bản sao lưu.'
          }
          footer={
            deleteStep === 1 ? (
              <>
                <Button variant="secondary" onClick={() => void handleExportBackup()}>
                  Sao lưu trước
                </Button>
                <Button variant="primary" skill="writing" onClick={() => setDeleteStep(2)}>
                  Tiếp tục xoá
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                >
                  Huỷ
                </Button>
                <Button
                  variant="primary"
                  skill="writing"
                  onClick={() => void handleConfirmDeleteAll()}
                  disabled={deleting}
                  data-testid="settings-confirm-delete"
                >
                  {deleting ? 'Đang xoá...' : 'Xoá dữ liệu ngay'}
                </Button>
              </>
            )
          }
        >
          <div className="space-y-3 text-xs" style={{ color: 'var(--color-text-dim)' }}>
            <p>
              Toàn bộ tiến độ ôn thẻ, lịch sử phiên học, bài viết và cài đặt trên trình duyệt này sẽ
              được đặt lại.
            </p>
            <label className="flex items-center gap-2.5 min-h-[44px] cursor-pointer text-sm" style={{ color: 'var(--color-text)' }}>
              <input
                type="checkbox"
                checked={keepRecordings}
                onChange={(e) => setKeepRecordings(e.target.checked)}
                className="w-5 h-5 appearance-none rounded border checked:bg-[var(--color-info)]"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <span>Giữ lại các bản ghi âm Speaking trên máy</span>
            </label>
          </div>
        </Modal>
      </Card>

      {/* 6. Quyền riêng tư & Ghi công (PB-12, PB-13) */}
      <Card padding="lg" className="space-y-3" data-testid="settings-credits">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5" style={{ color: 'var(--color-reading)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Quyền riêng tư & Ghi công
          </h2>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
          <strong>Quyền riêng tư:</strong> Lexicon Arcade lưu 100% dữ liệu học trong IndexedDB ngay
          trên thiết bị của bạn, không theo dõi người dùng và không gọi API AI trả phí. Phần chấm
          Writing/Speaking hoạt động bằng cách bạn tự dán bài vào Claude chat.
        </p>
        <div
          className="p-3 rounded-[var(--radius-md)] border text-xs space-y-1.5"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-dim)',
          }}
        >
          <div>
            <strong style={{ color: 'var(--color-text)' }}>Nội dung & nguồn mở:</strong> Đề luyện tập
            gốc (không phải đề thi thật); nhãn CEFR tham chiếu CEFR-J (Tono Lab, TUFS) & Octanove
            (CC BY-SA 4.0); bộ từ tần suất NGSL/AWL.
          </div>
          <div>
            <strong style={{ color: 'var(--color-text)' }}>Đồ hoạ, âm thanh & phông chữ:</strong>{' '}
            Kenney Asset Packs (CC0), Fluent Emoji (MIT), Be Vietnam Pro & Source Serif 4 (OFL).
          </div>
          <div>
            <strong style={{ color: 'var(--color-text)' }}>Thư viện lõi:</strong> React, Vite, Dexie,
            ts-fsrs, Motion, Lucide, Zod, Wouter.
          </div>
        </div>
      </Card>

      {/* 7. Kho lưu trữ V1/V2 (Legacy) */}
      <Card skillAccent="vocab" padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5" style={{ color: 'var(--color-vocab)' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                Kho lưu trữ V1/V2 (Legacy)
              </h2>
              <Pill tone="vocab">Đóng băng</Pill>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
              Mở lại phiên bản Arcade Zone, Đấu trường IOE, Cẩm nang 8.0 và Soul Knight RPG cũ với
              nguyên trạng dữ liệu.
            </p>
          </div>

          <Button
            variant="secondary"
            skill="vocab"
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
            onClick={() => navigate('/legacy')}
          >
            Mở Kho lưu trữ V1/V2
          </Button>
        </div>
      </Card>
    </div>
  );
};
