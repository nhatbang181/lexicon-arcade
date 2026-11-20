import React from 'react';
import { useLocation } from 'wouter';
import {
  Flame,
  Snowflake,
  Star,
  Compass,
  LayoutGrid,
  Sparkles,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  Button,
  Pill,
  ProgressRing,
  BandMeter,
  EmptyState,
} from '../../design/components';
import { useTheme } from '../providers';

export const TodayScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const { targetBands, dailyGoalMin } = useTheme();

  return (
    <div className="space-y-6 pb-8">
      {/* Thanh chào & thông số nhanh */}
      <Card padding="md" className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Pill tone="info" icon={<Calendar className="w-3.5 h-3.5" />}>
              Lộ trình 6.0 → 8.0 Academic
            </Pill>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Chào Bang · Hôm nay học gì?
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
            Mỗi phút luyện đúng kỹ năng bài thi chấm. Không tốn tiền API, chấm bài qua Claude gói copy/dán.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-md)] border text-sm font-semibold tabular-nums"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Flame className="w-4 h-4" style={{ color: 'var(--color-writing)' }} />
            <span>0 ngày</span>
            <span
              className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-listening)',
              }}
              title="Lượt đóng băng bảo vệ streak"
            >
              <Snowflake className="w-3 h-3" />1
            </span>
          </div>

          <div
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-md)] border text-sm font-semibold tabular-nums"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Star className="w-4 h-4" style={{ color: 'var(--color-partial)' }} />
            <span>0 XP</span>
          </div>
        </div>
      </Card>

      {/* Bố cục 2 cột: Kế hoạch hôm nay & Band ước lượng */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái: Mục tiêu hôm nay (Empty state ấm áp) */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="md" className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                Mục tiêu hôm nay
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                Hoàn thành {dailyGoalMin} phút luyện tập tập trung để giữ nhịp hằng ngày.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right whitespace-nowrap">
                <div
                  className="text-sm font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
                >
                  0 / {dailyGoalMin} phút
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Chưa bắt đầu
                </div>
              </div>
              <ProgressRing value={0} max={dailyGoalMin} size={52} skill="info" label="0%" />
            </div>
          </Card>

          <EmptyState
            icon={<Compass className="w-7 h-7" />}
            title="Chưa có lịch học cá nhân hoá cho hôm nay"
            description="Bạn chưa làm bài định vị đầu vào hoặc chưa bắt đầu phiên học đầu tiên. Hãy định vị nhanh để hệ thống tự xếp 3–4 nhiệm vụ mỗi ngày, hoặc khám phá ngay 12 chế độ luyện tập."
            action={
              <Button
                variant="primary"
                skill="info"
                hotkey="Enter"
                leftIcon={<LayoutGrid className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/hub')}
              >
                Khám phá 12 Chế độ (Hub)
              </Button>
            }
            secondaryAction={
              <Button
                variant="secondary"
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={() => navigate('/placement')}
              >
                Làm bài kiểm tra đầu vào
              </Button>
            }
          />
        </div>

        {/* Cột phải: Đồng hồ Band ước lượng 4 kỹ năng */}
        <div className="lg:col-span-5">
          <Card padding="lg" className="space-y-5 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                    Band ước lượng
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                    Cập nhật tự động sau mỗi phiên luyện và thi thử
                  </p>
                </div>
                <Pill tone="reading">Mục tiêu 8.0</Pill>
              </div>

              <div className="space-y-4 pt-1">
                <BandMeter
                  skillCode="L"
                  skillLabel="Listening"
                  skill="listening"
                  currentBand={null}
                  targetBand={targetBands.L}
                />
                <BandMeter
                  skillCode="R"
                  skillLabel="Reading"
                  skill="reading"
                  currentBand={null}
                  targetBand={targetBands.R}
                />
                <BandMeter
                  skillCode="W"
                  skillLabel="Writing"
                  skill="writing"
                  currentBand={null}
                  targetBand={targetBands.W}
                />
                <BandMeter
                  skillCode="S"
                  skillLabel="Speaking"
                  skill="speaking"
                  currentBand={null}
                  targetBand={targetBands.S}
                />
              </div>
            </div>

            <div
              className="mt-6 p-3.5 rounded-[var(--radius-md)] border flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-dim)',
              }}
            >
              <span>Overall ước tính hiện tại:</span>
              <strong
                className="text-sm"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
              >
                Chưa định vị (–)
              </strong>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
