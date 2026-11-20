import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/lexicon-arcade/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'app_icon.png'],
      manifest: {
        name: 'Lexicon Arcade V3 · Lộ trình 8.0',
        short_name: 'Lexicon 8.0',
        description: 'Ứng dụng luyện IELTS Academic 6.0 → 8.0 dạng Focus Arcade',
        theme_color: '#0B0F1A',
        background_color: '#0B0F1A',
        display: 'standalone',
        icons: [
          {
            src: 'app_icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'app_icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
}));
