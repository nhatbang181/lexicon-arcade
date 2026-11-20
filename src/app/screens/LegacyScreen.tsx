import React, { Suspense } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button, Skeleton } from '../../design/components';
import '../../legacy/index.css';

const LegacyApp = React.lazy(() => import('../../legacy/App'));

export const LegacyScreen: React.FC = () => {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="px-4 py-2 border-b flex items-center justify-between gap-4 z-50"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
          <span>Kho lưu trữ V1/V2 (Legacy Mode)</span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => navigate('/settings')}
        >
          Về Lexicon V3
        </Button>
      </div>

      <div className="flex-1">
        <Suspense
          fallback={
            <div className="p-8 max-w-xl mx-auto space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton lines={3} />
            </div>
          }
        >
          <LegacyApp />
        </Suspense>
      </div>
    </div>
  );
};
