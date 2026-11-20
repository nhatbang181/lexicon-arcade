import React, { useRef, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Sun,
  Moon,
  MonitorCheck,
  Volume2,
  VolumeX,
  Target,
  Download,
  Upload,
  Archive,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Card, Button, Pill, Toast, Modal, type ToastTone } from '../../design/components';
import { useTheme, useAudio, type AppTheme } from '../../app/providers';
import {
  exportBackup,
  importBackup,
  verifyBackup,
  type BackupEnvelope,
} from '../../core/storage/backup';
import { profileRepo } from '../../core/storage/repos/profileRepo';

const BAND_OPTIONS = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

export const SettingsScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const { theme, setTheme, targetBands, setTargetBands, dailyGoalMin, setDailyGoalMin } =
    useTheme();
  const { sfxVolume, setSfxVolume, muted, toggleMute } = useAudio();
  const [notice, setNotice] = useState<{ tone: ToastTone; title: string; desc?: string } | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<{
    rawText: string;
    envelope: BackupEnvelope;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

      setNotice({
        tone: 'correct',
        title: 'Đã xuất bản sao lưu JSON thành công',
        desc: `Gồm ${envelope.data.cards.length} thẻ SRS, ${envelope.data.attempts.length} phiên học và ${envelope.data.essays.length} bài viết.`,
      });
    } catch (err) {
      setNotice({
        tone: 'wrong',
        title: 'Không thể xuất sao lưu',
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
          title: 'File sao lưu không hợp lệ hoặc bị hỏng',
          desc: check.error ?? 'Không khớp checksum toàn vẹn.',
        });
        return;
      }
      setPendingRestore({ rawText: text, envelope: check.envelope });
    } catch (err) {
      setNotice({
        tone: 'wrong',
        title: 'Không thể đọc file sao lưu',
        desc: err instanceof Error ? err.message : 'Lỗi đọc file.',
      });
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setImporting(true);
    try {
      const { restoredCounts } = await importBackup(pendingRestore.rawText);
      const restoredProfile = await profileRepo.get();
      if (restoredProfile) {
        setTargetBands(restoredProfile.targetBands);
        setDailyGoalMin(restoredProfile.dailyGoalMin);
      }
      setPendingRestore(null);
      setNotice({
        tone: 'correct',
        title: 'Khôi phục dữ liệu thành công',
        desc: `Đã khôi phục ${restoredCounts.cards} thẻ SRS, ${restoredCounts.attempts} phiên học và ${restoredCounts.reviews} lượt ôn tập.`,
      });
    } catch (err) {
      setNotice({
        tone: 'wrong',
        title: 'Khôi phục thất bại',
        desc: err instanceof Error ? err.message : 'Lỗi ghi IndexedDB.',
      });
    } finally {
      setImporting(false);
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

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Cài đặt hệ thống
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
          Điều chỉnh giao diện, âm thanh, mục tiêu Band IELTS 8.0 và quản lý dữ liệu học tập trên máy.
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

      {/* 1. Giao diện */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
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
                className="p-4 rounded-[var(--radius-md)] border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2"
                style={{
                  backgroundColor: active
                    ? 'color-mix(in srgb, var(--color-info) 12%, var(--color-surface-2))'
                    : 'var(--color-surface-2)',
                  borderColor: active ? 'var(--color-info)' : 'var(--color-border)',
                }}
              >
                <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
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

      {/* 2. Mục tiêu Band & Thời lượng */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: 'var(--color-reading)' }} />
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Mục tiêu Band IELTS Academic
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

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            Thời lượng mục tiêu mỗi ngày:
          </span>
          <div className="flex items-center gap-2">
            {[15, 30, 45, 60, 90].map((min) => (
              <Button
                key={min}
                size="sm"
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

          <Button variant="secondary" size="sm" onClick={toggleMute}>
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
            className="flex-1 accent-[var(--color-listening)] cursor-pointer"
          />
          <span
            className="w-12 text-right text-sm font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {muted ? 0 : sfxVolume}%
          </span>
        </div>
      </Card>

      {/* 4. Sao lưu & Khôi phục khung */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Sao lưu & Khôi phục dữ liệu (IndexedDB)
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Toàn bộ tiến độ FSRS, bài viết và bản thu âm nằm trên trình duyệt của bạn, không gửi lên server.
            </p>
          </div>
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
            {importing ? 'Đang khôi phục...' : 'Khôi phục từ file'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => void handleFileSelected(e)}
            aria-label="Chọn file sao lưu JSON"
          />
        </div>

        <Modal
          open={pendingRestore !== null}
          onClose={() => !importing && setPendingRestore(null)}
          title="Xác nhận khôi phục dữ liệu"
          subtitle="Dữ liệu IndexedDB hiện tại trên trình duyệt sẽ được thay thế toàn bộ bằng bản sao lưu này."
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
                {importing ? 'Đang khôi phục...' : 'Xác nhận khôi phục'}
              </Button>
            </>
          }
        >
          {pendingRestore && (
            <div className="space-y-3">
              <div
                className="p-3 rounded-[var(--radius-md)] border flex items-start gap-2.5 text-xs"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--color-partial) 12%, var(--color-surface-2))',
                  borderColor: 'var(--color-partial)',
                  color: 'var(--color-text)',
                }}
              >
                <AlertTriangle
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: 'var(--color-partial)' }}
                />
                <span>
                  Hành động này sẽ ghi đè dữ liệu hiện tại. Hãy xuất bản sao lưu trước nếu bạn muốn
                  giữ lại tiến độ hiện tại.
                </span>
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
                  Số thẻ SRS:{' '}
                  <strong style={{ color: 'var(--color-text)' }}>
                    {pendingRestore.envelope.data.cards.length}
                  </strong>
                </div>
                <div>
                  Số phiên học:{' '}
                  <strong style={{ color: 'var(--color-text)' }}>
                    {pendingRestore.envelope.data.attempts.length}
                  </strong>
                </div>
                <div>
                  Lượt ôn tập:{' '}
                  <strong style={{ color: 'var(--color-text)' }}>
                    {pendingRestore.envelope.data.reviews.length}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </Card>

      {/* 5. Kho lưu trữ V1/V2 (Legacy) */}
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
              Mở lại phiên bản Arcade Zone, Đấu trường IOE, Cẩm nang 8.0 và Soul Knight RPG cũ với nguyên trạng dữ liệu.
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
