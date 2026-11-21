import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  PenTool,
  Scale,
  Trash2,
} from 'lucide-react';
import { db, type EssayRecord, type UserProfile } from '../../core/storage/db';
import { bandRepo } from '../../core/storage/repos/bandRepo';
import { essayRepo } from '../../core/storage/repos/essayRepo';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import { Button, Card, EmptyState, Pill, Skeleton, Toast } from '../../design/components';
import {
  applyBiasOffsetToBand,
  computeBiasCalibration,
} from '../../games/w1-essay-lab/engine';

const BAND_OPTIONS = [
  3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0,
] as const;

type PortfolioFilter = 'all' | 'task1' | 'task2' | 'awaiting' | 'graded';

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export const PortfolioScreen: React.FC = () => {
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(true);
  const [essays, setEssays] = useState<EssayRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeBiasOffset, setActiveBiasOffset] = useState<number>(0);

  const [filter, setFilter] = useState<PortfolioFilter>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingOfficialId, setEditingOfficialId] = useState<number | null>(null);
  const [officialInput, setOfficialInput] = useState<string>('6.5');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, prof, kvBias] = await Promise.all([
        essayRepo.list(),
        profileRepo.getOrCreate(),
        db.kv.get('grading.biasOffset'),
      ]);
      setEssays(list);
      setProfile(prof);
      const savedOffset =
        typeof kvBias?.value === 'number'
          ? kvBias.value
          : prof.writingBiasOffset ?? 0;
      setActiveBiasOffset(savedOffset);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const calibration = useMemo(() => computeBiasCalibration(essays), [essays]);

  const gradedEssays = useMemo(
    () => essays.filter((e) => e.claudeResult !== undefined),
    [essays],
  );

  const awaitingCount = essays.length - gradedEssays.length;

  const avgCriteria = useMemo(() => {
    if (gradedEssays.length === 0) return null;
    const sum = { TR_TA: 0, CC: 0, LR: 0, GRA: 0 };
    for (const e of gradedEssays) {
      const c = e.claudeResult!.criteria;
      sum.TR_TA += c.TR_TA;
      sum.CC += c.CC;
      sum.LR += c.LR;
      sum.GRA += c.GRA;
    }
    const n = gradedEssays.length;
    return {
      TR_TA: Number((sum.TR_TA / n).toFixed(1)),
      CC: Number((sum.CC / n).toFixed(1)),
      LR: Number((sum.LR / n).toFixed(1)),
      GRA: Number((sum.GRA / n).toFixed(1)),
    };
  }, [gradedEssays]);

  const progressionPoints = useMemo(() => {
    return [...gradedEssays]
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-12)
      .map((e, idx) => ({
        id: e.id ?? idx,
        label: `${e.taskType === 'task1' ? 'T1' : 'T2'} #${idx + 1}`,
        claudeBand: e.claudeResult!.overallBand,
        adjustedBand: applyBiasOffsetToBand(e.claudeResult!.overallBand, activeBiasOffset),
        officialBand: e.officialBand,
      }));
  }, [gradedEssays, activeBiasOffset]);

  const filteredEssays = useMemo(() => {
    return essays.filter((e) => {
      if (filter === 'task1') return e.taskType === 'task1';
      if (filter === 'task2') return e.taskType === 'task2';
      if (filter === 'awaiting') return e.claudeResult === undefined;
      if (filter === 'graded') return e.claudeResult !== undefined;
      return true;
    });
  }, [essays, filter]);

  const handleSaveOfficialBand = useCallback(
    async (essay: EssayRecord) => {
      if (!essay.id) return;
      const band = Number(officialInput);
      if (!Number.isFinite(band) || band < 3 || band > 9) return;

      await essayRepo.update(essay.id, { officialBand: band });
      await bandRepo.add({
        skill: 'W',
        mode: 'exam',
        ts: Date.now(),
        band,
        taskType: essay.taskType,
        sourceGameId: 'w1',
      });
      setEditingOfficialId(null);
      setToastMsg(`Đã lưu điểm thật Band ${band.toFixed(1)} cho bài ${essay.promptId}.`);
      await loadData();
    },
    [officialInput, loadData],
  );

  const handleApplyBiasOffset = useCallback(
    async (offset: number) => {
      await db.kv.put({ key: 'grading.biasOffset', value: offset });
      await profileRepo.update({ writingBiasOffset: offset });
      setActiveBiasOffset(offset);
      setToastMsg(
        offset === 0
          ? 'Đã tắt biasOffset (về 0.0).'
          : `Đã bật biasOffset ${offset > 0 ? `+${offset.toFixed(1)}` : offset.toFixed(1)} cho ước lượng Writing.`,
      );
    },
    [],
  );

  const handleDeleteEssay = useCallback(
    async (id: number) => {
      await essayRepo.remove(id);
      setToastMsg('Đã xoá bài viết khỏi Portfolio.');
      await loadData();
    },
    [loadData],
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/hub')}
            >
              Hub
            </Button>
            <Pill tone="writing" size="sm">
              Portfolio Writing
            </Pill>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Hồ sơ bài viết & Hiệu chỉnh Điểm thật
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
            Theo dõi tiến bộ 4 tiêu chí TR/TA · CC · LR · GRA và đối chiếu điểm Claude với điểm thi thật / giám khảo chấm.
          </p>
        </div>

        <Button
          variant="primary"
          skill="writing"
          size="sm"
          leftIcon={<PenTool className="w-4 h-4" />}
          onClick={() => navigate('/play/w1')}
        >
          Viết bài mới (W1)
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
            Tổng số bài viết
          </span>
          <div className="font-mono text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
            {essays.length}
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            {gradedEssays.length} đã chấm · {awaitingCount} chờ chấm
          </span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
            Band gần nhất
          </span>
          <div className="font-mono text-2xl font-bold tabular-nums" style={{ color: 'var(--color-writing)' }}>
            {gradedEssays[0]?.claudeResult
              ? applyBiasOffsetToBand(
                  gradedEssays[0].claudeResult.overallBand,
                  activeBiasOffset,
                ).toFixed(1)
              : '—'}
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            Mục tiêu: {profile?.targetBands.W.toFixed(1) ?? '7.5'}
          </span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
            Trung bình 4 tiêu chí
          </span>
          {avgCriteria ? (
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs font-mono pt-0.5">
              <span style={{ color: 'var(--color-text)' }}>TR/TA: {avgCriteria.TR_TA}</span>
              <span style={{ color: 'var(--color-text)' }}>CC: {avgCriteria.CC}</span>
              <span style={{ color: 'var(--color-text)' }}>LR: {avgCriteria.LR}</span>
              <span style={{ color: 'var(--color-text)' }}>GRA: {avgCriteria.GRA}</span>
            </div>
          ) : (
            <div className="font-mono text-xl font-bold" style={{ color: 'var(--color-text-faint)' }}>
              —
            </div>
          )}
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
            Bias Offset hiện tại
          </span>
          <div className="font-mono text-2xl font-bold tabular-nums" style={{ color: 'var(--color-info)' }}>
            {activeBiasOffset > 0
              ? `+${activeBiasOffset.toFixed(1)}`
              : activeBiasOffset.toFixed(1)}
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            {calibration.sampleCount} bài có điểm thật
          </span>
        </Card>
      </div>

      {/* Compact Progression Chart */}
      {progressionPoints.length > 0 && (
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--color-writing)' }} />
              Biểu đồ tiến bộ Band ({progressionPoints.length} bài đã chấm gần nhất)
            </h2>
            <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
              Thang 3.0 – 9.0
            </span>
          </div>

          <div className="flex items-end gap-2 h-32 pt-4 px-1">
            {progressionPoints.map((pt) => {
              const pct = Math.max(12, Math.min(100, ((pt.adjustedBand - 3) / 6) * 100));
              return (
                <div key={pt.id} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span
                    className="font-mono text-[11px] font-bold tabular-nums"
                    style={{ color: 'var(--color-writing)' }}
                  >
                    {pt.adjustedBand.toFixed(1)}
                  </span>
                  <div
                    className="w-full max-w-[36px] rounded-t-[var(--radius-sm)] transition-all"
                    style={{
                      height: `${pct}%`,
                      backgroundColor:
                        pt.officialBand !== undefined
                          ? 'var(--color-correct)'
                          : 'var(--color-writing)',
                    }}
                    title={`${pt.label}: Claude ${pt.claudeBand.toFixed(1)}${
                      pt.officialBand !== undefined
                        ? ` · Điểm thật ${pt.officialBand.toFixed(1)}`
                        : ''
                    }`}
                  />
                  <span
                    className="text-[10px] font-mono truncate w-full text-center"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Bias Calibration Panel (docs/07 §6) */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Scale className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
            Kiểm chứng độ lệch Claude so với Điểm thật (docs/07 §6)
          </h2>
          <Pill tone={calibration.canShowStats ? 'info' : 'neutral'} size="sm">
            {calibration.sampleCount}/5 mẫu hiệu chỉnh
          </Pill>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
          {calibration.directionVi}
        </p>

        {calibration.canShowStats && (
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <span style={{ color: 'var(--color-text)' }}>
              Độ lệch TB (Điểm thật − Claude):{' '}
              <strong style={{ color: 'var(--color-info)' }}>
                {calibration.meanDiff > 0 ? `+${calibration.meanDiff.toFixed(2)}` : calibration.meanDiff.toFixed(2)}
              </strong>
            </span>
            <span style={{ color: 'var(--color-text-faint)' }}>
              (Task 1: {calibration.task1Count} · Task 2: {calibration.task2Count})
            </span>
          </div>
        )}

        {calibration.shouldSuggestOffset && activeBiasOffset !== calibration.suggestedOffset && (
          <div
            className="rounded-[var(--radius-sm)] border p-3 flex flex-wrap items-center justify-between gap-3"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-info)',
            }}
          >
            <div className="text-xs" style={{ color: 'var(--color-text)' }}>
              Đề xuất bật <code>biasOffset</code> ={' '}
              <strong className="font-mono">
                {calibration.suggestedOffset > 0
                  ? `+${calibration.suggestedOffset.toFixed(1)}`
                  : calibration.suggestedOffset.toFixed(1)}
              </strong>{' '}
              (áp vào ước lượng band, không sửa điểm gốc).
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => void handleApplyBiasOffset(calibration.suggestedOffset)}
            >
              Xác nhận bật biasOffset
            </Button>
          </div>
        )}

        {activeBiasOffset !== 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleApplyBiasOffset(0)}
            >
              Đặt lại biasOffset về 0.0
            </Button>
          </div>
        )}
      </Card>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['all', `Tất cả (${essays.length})`],
            ['task2', 'Task 2'],
            ['task1', 'Task 1'],
            ['graded', `Đã chấm (${gradedEssays.length})`],
            ['awaiting', `Chờ chấm (${awaitingCount})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer"
            style={{
              backgroundColor: filter === key ? 'var(--color-writing)' : 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: filter === key ? '#0B0F1A' : 'var(--color-text-dim)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Essays List */}
      {filteredEssays.length === 0 ? (
        <EmptyState
          title="Chưa có bài viết nào trong Portfolio"
          description="Bắt đầu luyện viết Task 1 hoặc Task 2 ở W1 · Essay Lab để lưu bài và theo dõi tiến bộ."
          action={
            <Button variant="primary" skill="writing" onClick={() => navigate('/play/w1')}>
              Mở W1 · Essay Lab
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredEssays.map((essay) => {
            const isExpanded = expandedId === essay.id;
            const isEditingOfficial = editingOfficialId === essay.id;
            return (
              <Card key={essay.id} padding="md" className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="writing" size="sm">
                        {essay.taskType === 'task1' ? 'Task 1' : 'Task 2'}
                      </Pill>
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                        {essay.promptId}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
                        {formatShortDate(essay.createdAt)} · {essay.wordCount} từ
                      </span>
                      {essay.revisionOfId && (
                        <Pill tone="vocab" size="sm">
                          Bản sửa
                        </Pill>
                      )}
                      {essay.claudeResult ? (
                        <Pill tone="info" size="sm">
                          Claude: {essay.claudeResult.overallBand.toFixed(1)}
                        </Pill>
                      ) : (
                        <Pill tone="partial" size="sm">
                          Chờ chấm
                        </Pill>
                      )}
                      {essay.officialBand !== undefined && (
                        <Pill tone="correct" size="sm">
                          Điểm thật: {essay.officialBand.toFixed(1)}
                        </Pill>
                      )}
                    </div>

                    {essay.claudeResult && (
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono" style={{ color: 'var(--color-text-dim)' }}>
                        <span>
                          {essay.taskType === 'task1' ? 'TA' : 'TR'}:{' '}
                          <strong style={{ color: 'var(--color-text)' }}>
                            {essay.claudeResult.criteria.TR_TA.toFixed(1)}
                          </strong>
                        </span>
                        <span>
                          CC:{' '}
                          <strong style={{ color: 'var(--color-text)' }}>
                            {essay.claudeResult.criteria.CC.toFixed(1)}
                          </strong>
                        </span>
                        <span>
                          LR:{' '}
                          <strong style={{ color: 'var(--color-text)' }}>
                            {essay.claudeResult.criteria.LR.toFixed(1)}
                          </strong>
                        </span>
                        <span>
                          GRA:{' '}
                          <strong style={{ color: 'var(--color-text)' }}>
                            {essay.claudeResult.criteria.GRA.toFixed(1)}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Award className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setEditingOfficialId(isEditingOfficial ? null : (essay.id ?? null));
                        setOfficialInput(
                          (essay.officialBand ?? essay.claudeResult?.overallBand ?? 6.5).toFixed(1),
                        );
                      }}
                    >
                      {essay.officialBand !== undefined ? 'Sửa điểm thật' : 'Nhập điểm thật'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : (essay.id ?? null))}
                      rightIcon={
                        isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      Xem bài
                    </Button>
                    {essay.id !== undefined && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteEssay(essay.id!)}
                        className="p-1.5 rounded-[var(--radius-sm)] border cursor-pointer"
                        style={{
                          backgroundColor: 'var(--color-surface-2)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-faint)',
                        }}
                        aria-label="Xoá bài viết"
                        title="Xoá bài viết"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Official Band Input Form */}
                {isEditingOfficial && (
                  <div
                    className="rounded-[var(--radius-sm)] border p-3 flex flex-wrap items-center gap-3"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <label
                      htmlFor={`official-band-${essay.id}`}
                      className="text-xs font-medium"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Điểm thi thật / giám khảo chấm:
                    </label>
                    <select
                      id={`official-band-${essay.id}`}
                      value={officialInput}
                      onChange={(e) => setOfficialInput(e.target.value)}
                      className="text-xs font-mono px-2.5 py-1.5 rounded-[var(--radius-sm)] border"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {BAND_OPTIONS.map((b) => (
                        <option key={b} value={b.toFixed(1)}>
                          Band {b.toFixed(1)}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="primary"
                      skill="writing"
                      size="sm"
                      onClick={() => void handleSaveOfficialBand(essay)}
                    >
                      Lưu điểm thật
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingOfficialId(null)}
                    >
                      Huỷ
                    </Button>
                  </div>
                )}

                {/* Expanded Essay Text */}
                {isExpanded && (
                  <div
                    className="rounded-[var(--radius-sm)] border p-4 space-y-2"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-dim)' }}>
                      <FileText className="w-3.5 h-3.5" />
                      Nội dung bài làm
                    </div>
                    <p
                      className="text-sm leading-relaxed whitespace-pre-line"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {essay.text}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <Toast title={toastMsg} tone="correct" onDismiss={() => setToastMsg(null)} />
        </div>
      )}
    </div>
  );
};

export default PortfolioScreen;
