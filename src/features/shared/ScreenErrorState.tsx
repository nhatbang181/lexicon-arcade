import React from 'react';
import { useLocation } from 'wouter';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button, Card } from '../../design/components';

export interface ScreenErrorStateProps {
  title?: string;
  error: Error | string;
  code?: string;
  onRetry: () => void;
}

/** Màn lỗi chuẩn cho các màn khung khi tải dữ liệu thất bại (X11). */
export const ScreenErrorState: React.FC<ScreenErrorStateProps> = ({
  title = 'Không tải được dữ liệu',
  error,
  code = 'ERR-LOAD',
  onRetry,
}) => {
  const [, navigate] = useLocation();
  const message = typeof error === 'string' ? error : error.message || 'Lỗi không xác định.';

  return (
    <Card
      padding="lg"
      className="max-w-lg mx-auto my-6 space-y-4 text-center"
      data-testid="screen-error-state"
    >
      <div
        className="w-12 h-12 rounded-full mx-auto flex items-center justify-center border"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-wrong) 14%, var(--color-surface-2))',
          borderColor: 'var(--color-wrong)',
          color: 'var(--color-wrong)',
        }}
      >
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
          {message}
        </p>
        <p
          className="text-xs tabular-nums"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
        >
          Mã lỗi: {code}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <Button
          variant="primary"
          skill="info"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={onRetry}
          data-testid="screen-error-retry"
        >
          Thử lại
        </Button>
        <Button
          variant="secondary"
          leftIcon={<Home className="w-4 h-4" />}
          onClick={() => navigate('/')}
        >
          Về Hôm nay
        </Button>
      </div>
    </Card>
  );
};
