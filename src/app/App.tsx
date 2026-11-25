import React, { useEffect, useState } from 'react';
import { Link, Router, useLocation } from 'wouter';
import {
  CalendarCheck2,
  LayoutGrid,
  BarChart3,
  BookMarked,
  Settings,
  Flame,
  Star,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { ThemeProvider, AudioProvider } from './providers';
import { AppRoutes } from './routes';
import { useAppHashLocation, useAppHashSearch } from './hashRouter';
import { useShellStats } from './useShellStats';

interface NavItem {
  path: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    label: 'Hôm nay',
    shortLabel: 'Hôm nay',
    icon: <CalendarCheck2 className="w-5 h-5" />,
  },
  {
    path: '/hub',
    label: '12 Chế độ (Hub)',
    shortLabel: '12 Chế độ',
    icon: <LayoutGrid className="w-5 h-5" />,
  },
  {
    path: '/stats',
    label: 'Thống kê',
    shortLabel: 'Thống kê',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    path: '/library',
    label: 'Thư viện',
    shortLabel: 'Thư viện',
    icon: <BookMarked className="w-5 h-5" />,
  },
  {
    path: '/settings',
    label: 'Cài đặt',
    shortLabel: 'Cài đặt',
    icon: <Settings className="w-5 h-5" />,
  },
];

const ShellLayout: React.FC = () => {
  const [location] = useLocation();
  const stats = useShellStats();
  const xpText = `${stats.xp.toLocaleString('vi-VN')} XP`;
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);

  // X9: lắng nghe sự kiện có bản Service Worker mới; chỉ hiện toast ngoài /play/* và /exam.
  useEffect(() => {
    const onSwUpdate = () => setSwUpdateAvailable(true);
    window.addEventListener('lexicon:sw-update', onSwUpdate);
    return () => window.removeEventListener('lexicon:sw-update', onSwUpdate);
  }, []);

  // PB-09: tự xin quyền lưu trữ bền vững khi mở dưới dạng PWA trên màn hình chính.
  useEffect(() => {
    const isStandalone =
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone && typeof navigator !== 'undefined' && navigator.storage?.persist) {
      void navigator.storage.persist().catch(() => undefined);
    }
  }, []);

  const handleApplySwUpdate = () => {
    const apply = (window as Window & { __lexiconApplyUpdate?: () => void }).__lexiconApplyUpdate;
    if (typeof apply === 'function') {
      apply();
    } else {
      window.location.reload();
    }
  };

  // Ẩn shell khi đang ở trong phiên game hoặc màn legacy
  const isFullscreenRoute =
    location.startsWith('/play/') || location === '/legacy' || location.startsWith('/exam');

  if (isFullscreenRoute) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <AppRoutes />
      </div>
    );
  }

  const isNavActive = (itemPath: string) => {
    if (itemPath === '/') return location === '/' || location === '';
    if (itemPath === '/hub') return location.startsWith('/hub') || location.startsWith('/practice');
    return location.startsWith(itemPath);
  };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      {/* Sidebar Desktop (>= 1024px, rộng 240px chuẩn 08 §4) */}
      <aside
        className="hidden lg:flex lg:w-[240px] lg:shrink-0 lg:flex-col lg:justify-between border-r p-4 sticky top-0 h-screen"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        aria-label="Điều hướng chính"
      >
        <div className="space-y-6">
          {/* Logo */}
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-2 py-1.5 min-h-[44px] rounded-[var(--radius-md)] text-left cursor-pointer"
            aria-label="Lexicon Arcade, về Hôm nay"
          >
            <div
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-info) 16%, var(--color-surface-2))',
                borderColor: 'var(--color-info)',
                color: 'var(--color-info)',
              }}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold tracking-tight truncate" style={{ color: 'var(--color-text)' }}>
                Lexicon Arcade
              </div>
              <div className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
                V3 · Lộ trình 8.0
              </div>
            </div>
          </Link>

          {/* Menu 5 mục */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={active ? 'page' : undefined}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-[var(--radius-md)] flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer"
                  style={{
                    backgroundColor: active
                      ? 'color-mix(in srgb, var(--color-info) 14%, var(--color-surface-2))'
                      : 'transparent',
                    color: active ? 'var(--color-text)' : 'var(--color-text-dim)',
                    borderLeft: active ? '3px solid var(--color-info)' : '3px solid transparent',
                  }}
                >
                  <span style={{ color: active ? 'var(--color-info)' : 'var(--color-text-dim)' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Streak & XP ở đáy sidebar */}
        <div
          className="p-3.5 rounded-[var(--radius-md)] border space-y-2"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--color-text)' }}>
              <Flame className="w-4 h-4" style={{ color: 'var(--color-writing)' }} />
              Chuỗi ngày học
            </span>
            <span
              className="font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
              data-testid="shell-streak"
            >
              {stats.streak} ngày
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--color-text)' }}>
              <Star className="w-4 h-4" style={{ color: 'var(--color-partial)' }} />
              Tổng kinh nghiệm
            </span>
            <span
              className="font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
              data-testid="shell-xp"
            >
              {xpText}
            </span>
          </div>
        </div>
      </aside>

      {/* Header nhỏ cho Mobile/Tablet (<1024px) */}
      <header
        className="flex lg:hidden items-center justify-between px-4 py-3 border-b sticky top-0 z-30"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 min-h-[44px] text-left cursor-pointer"
          aria-label="Lexicon Arcade, về Hôm nay"
        >
          <div
            className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center border"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-info) 16%, var(--color-surface-2))',
              borderColor: 'var(--color-info)',
              color: 'var(--color-info)',
            }}
          >
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold block leading-none" style={{ color: 'var(--color-text)' }}>
              Lexicon Arcade
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Lộ trình 8.0
            </span>
          </div>
        </Link>

        <div
          className="flex items-center gap-3 text-xs font-semibold tabular-nums"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span className="inline-flex items-center gap-1" data-testid="shell-streak-mobile">
            <Flame className="w-3.5 h-3.5" style={{ color: 'var(--color-writing)' }} />
            {stats.streak}
          </span>
          <span className="inline-flex items-center gap-1" data-testid="shell-xp-mobile">
            <Star className="w-3.5 h-3.5" style={{ color: 'var(--color-partial)' }} />
            {xpText}
          </span>
        </div>
      </header>

      {/* Vùng nội dung chính (tối đa 1200px chuẩn 08 §4) */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="max-w-[1200px] mx-auto">
          {swUpdateAvailable && !isFullscreenRoute && (
            <div
              role="status"
              aria-live="polite"
              data-testid="sw-update-toast"
              className="mb-4 px-4 py-3 rounded-[var(--radius-md)] border flex flex-wrap items-center justify-between gap-3"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-info) 12%, var(--color-surface))',
                borderColor: 'var(--color-info)',
                color: 'var(--color-text)',
              }}
            >
              <span className="text-sm font-semibold">
                Có bản mới của Lexicon Arcade. Tải lại để áp dụng?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplySwUpdate}
                  data-testid="sw-update-reload"
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-[var(--radius-md)] text-sm font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-info)',
                    color: 'var(--color-on-accent, var(--color-bg))',
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Tải lại
                </button>
                <button
                  type="button"
                  onClick={() => setSwUpdateAvailable(false)}
                  className="inline-flex items-center min-h-[44px] px-3 py-2 rounded-[var(--radius-md)] border text-sm font-medium cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-dim)',
                  }}
                >
                  Để sau
                </button>
              </div>
            </div>
          )}
          <AppRoutes />
        </div>
      </main>

      {/* Bottom Tab Bar cho Mobile & Tablet (<1024px) */}
      <nav
        className="flex lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t justify-around items-center px-1 py-1.5"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        aria-label="Điều hướng di động"
      >
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center min-w-[60px] min-h-[44px] px-2 py-1 rounded-[var(--radius-sm)] text-xs font-medium cursor-pointer"
              style={{
                color: active ? 'var(--color-info)' : 'var(--color-text-dim)',
              }}
            >
              {item.icon}
              <span className="mt-0.5 truncate">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AudioProvider>
        <Router hook={useAppHashLocation} searchHook={useAppHashSearch}>
          <ShellLayout />
        </Router>
      </AudioProvider>
    </ThemeProvider>
  );
};

export default App;
