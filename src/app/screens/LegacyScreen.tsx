import React, { Suspense, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button, Skeleton } from '../../design/components';

type SheetNode = HTMLLinkElement | HTMLStyleElement;

// Vite không gỡ CSS của chunk lazy khi rời route. CSS legacy có `body{image-rendering:pixelated}` và
// Tailwind lần 2, nên phải tắt khi rời #/legacy để không rò sang V3 (X4).
// Nhận diện: build = <link> của chunk `legacyEntry-*.css`; dev = <style data-vite-dev-id=".../src/legacy/...">.
const isLegacySheet = (node: SheetNode): boolean =>
  node instanceof HTMLLinkElement
    ? node.href.includes('legacyEntry')
    : (node.dataset.viteDevId ?? '').split('\\').join('/').includes('/src/legacy/');

const readLegacySheets = (): SheetNode[] =>
  Array.from(document.querySelectorAll<SheetNode>('link[rel="stylesheet"], style')).filter(isLegacySheet);

const setSheetsDisabled = (nodes: SheetNode[], disabled: boolean): void => {
  for (const node of nodes) {
    if (node instanceof HTMLLinkElement) node.disabled = disabled;
    else if (node.sheet) node.sheet.disabled = disabled;
  }
};

const loadLegacy = () => import('./legacyEntry');
const LegacyApp = React.lazy(loadLegacy);
let mounted = 0;

export const LegacyScreen: React.FC = () => {
  const [, navigate] = useLocation();

  useEffect(() => {
    mounted += 1;
    setSheetsDisabled(readLegacySheets(), false);
    void loadLegacy().then(() => setSheetsDisabled(readLegacySheets(), mounted === 0));
    return () => {
      mounted -= 1;
      if (mounted === 0) setSheetsDisabled(readLegacySheets(), true);
    };
  }, []);

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
