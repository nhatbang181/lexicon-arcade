import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const realNodeModules = (() => {
  try {
    return fs.realpathSync(path.resolve(process.cwd(), 'node_modules'));
  } catch {
    return path.resolve(process.cwd(), 'node_modules');
  }
})();

// X8: fontsource kèm cả bản .woff cho trình duyệt cũ. Chỉ giữ woff2 để dist nhỏ và không có font thừa.
const fontsourceWoff2Only = (): Plugin => ({
  name: 'fontsource-woff2-only',
  enforce: 'pre',
  transform(code, id) {
    if (!id.includes('@fontsource') || !id.endsWith('.css')) return null;
    return code.replace(/,\s*url\([^)]*\.woff\)\s*format\('woff'\)/g, '');
  },
});

// X13: CSP chỉ chèn vào bản build (dev cần script nội tuyến của React Refresh và websocket HMR).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

const cspMeta = (): Plugin => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
  ],
});

// Chunk nạp lười: 9 game, Placement, màn phụ, ChartRenderer/GradingPanel/Highlighter/MapView/PassageView, kho legacy, fixture test.
const LAZY_CHUNK_GLOBS = [
  'assets/{v1,v2,v3,r1,r2,l1,l2,w1,w2}-*.js',
  'assets/{PlacementScreen,ChartRenderer,GradingPanel,PortfolioScreen,OnboardingScreen,SettingsScreen,StatsScreen,Highlighter,MapView,PassageView,listeningAnswer,legacyEntry}-*.{js,css}',
  'assets/*_fixtures-*.js',
];
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/lexicon-arcade/' : '/',
  plugins: [
    fontsourceWoff2Only(),
    cspMeta(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico'],
      // Icon manifest do trình duyệt tự tải khi cài; không cần nằm trong precache (≤ 1,5 MB).
      includeManifestIcons: false,
      manifest: {
        name: 'Lexicon Arcade V3 · Lộ trình 8.0',
        short_name: 'Lexicon 8.0',
        description: 'Ứng dụng luyện IELTS Academic 6.0 → 8.0 dạng Focus Arcade',
        lang: 'vi',
        theme_color: '#0B0F1A',
        background_color: '#0B0F1A',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Precache chỉ giữ vỏ app (entry, vendor, CSS, font, màn khung). Chunk game, kho legacy và fixture
        // nạp lười, được cache lúc chạy (runtimeCaching bên dưới) để precache ≤ 1,5 MB.
        globIgnores: [
          '**/soul_knight/**',
          'assets/ui/**',
          'roguelike_sheet.png',
          'dungeon_tilemap.png',
          'app_icon.png',
          'app_icon.ico',
          'pwa-*.png',
          'maskable-*.png',
          '**/*-cyrillic-*',
          '**/*-greek-*',
          '**/*.woff',
          LAZY_CHUNK_GLOBS,
        ].flat(),
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Workbox chỉ chép thân hàm vào sw.js nên regex phải nằm trong hàm (biến ngoài → ReferenceError trong SW).
            urlPattern: ({ url }) =>
              /\/assets\/((v[123]|r[12]|l[12]|w[12])-|PlacementScreen-|ChartRenderer-|GradingPanel-|PortfolioScreen-|OnboardingScreen-|SettingsScreen-|StatsScreen-|Highlighter-|MapView-|PassageView-|listeningAnswer-|legacyEntry-|[a-z0-9]+_fixtures-)/.test(
                url.pathname,
              ),
            handler: 'CacheFirst',
            options: {
              cacheName: 'lexicon-chunks',
              expiration: { maxEntries: 80, maxAgeSeconds: 90 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/data/') && url.pathname.endsWith('.json'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'lexicon-data',
              expiration: { maxEntries: 200, maxAgeSeconds: 90 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/audio/') && /\.(mp3|webm|ogg)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'lexicon-audio',
              expiration: { maxEntries: 1500, maxAgeSeconds: 90 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    // X14: không mở dev server ra LAN. Cần LAN thì `npm run dev -- --host`.
    host: '127.0.0.1',
    fs: {
      allow: [process.cwd(), realNodeModules],
    },
  },
}));
