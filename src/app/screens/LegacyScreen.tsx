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
    ? node.rel === 'stylesheet' && node.href.includes('legacyEntry')
    : (node.dataset.viteDevId ?? '').split('\\').join('/').includes('/src/legacy/');

const readLegacySheets = (): SheetNode[] =>
  Array.from(document.querySelectorAll<SheetNode>('link[rel="stylesheet"], style')).filter(isLegacySheet);

const loadLegacy = () => import('./legacyEntry');
const LegacyApp = React.lazy(loadLegacy);

// Chunk legacy có thể nạp xong (và chèn CSS vào <head>) SAU khi người dùng đã rời #/legacy. Vì vậy không đếm
// mount mà kiểm trực tiếp route hiện tại + canh <head>: bất kỳ sheet legacy nào xuất hiện khi không ở #/legacy đều bị tắt ngay.
let observer: MutationObserver | null = null;

const isOnLegacyRoute = (): boolean =>
  typeof window !== 'undefined' && window.location.hash.startsWith('#/legacy');

const disableSheet = (node: SheetNode): void => {
  if (node instanceof HTMLLinkElement) {
    node.disabled = true;
    if (!node.sheet) {
      node.addEventListener(
        'load',
        () => {
          if (!isOnLegacyRoute()) node.disabled = true;
        },
        { once: true },
      );
    }
  } else if (node.sheet) {
    node.sheet.disabled = true;
  }
};

const syncLegacySheets = (): void => {
  const active = isOnLegacyRoute();
  for (const node of readLegacySheets()) {
    if (active) {
      if (node instanceof HTMLLinkElement) node.disabled = false;
      else if (node.sheet) node.sheet.disabled = false;
    } else {
      disableSheet(node);
    }
  }
};

const ensureObserver = (): void => {
  if (observer || typeof MutationObserver === 'undefined') return;
  observer = new MutationObserver((records) => {
    for (const node of records.flatMap((r) => Array.from(r.addedNodes))) {
      if (!(node instanceof HTMLLinkElement || node instanceof HTMLStyleElement) || !isLegacySheet(node)) continue;
      if (!isOnLegacyRoute()) {
        disableSheet(node);
      } else if (node instanceof HTMLLinkElement && !node.sheet) {
        // Nếu người dùng rời #/legacy trước khi <link> tải xong, vẫn tắt ngay khi sheet tải xong.
        node.addEventListener(
          'load',
          () => {
            if (!isOnLegacyRoute()) node.disabled = true;
          },
          { once: true },
        );
      }
    }
  });
  observer.observe(document.head, { childList: true });
  window.addEventListener('hashchange', syncLegacySheets);
};

// Gắn ngay khi module nạp: React có thể render (và nạp chunk legacy) trong lúc chưa commit/mount màn này.
ensureObserver();

export const LegacyScreen: React.FC = () => {
  const [, navigate] = useLocation();

  useEffect(() => {
    syncLegacySheets();
    void loadLegacy().then(() => {
      syncLegacySheets();
    });
    return () => {
      syncLegacySheets();
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
