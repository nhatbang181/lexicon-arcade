import { defineConfig } from 'vitest/config';

// X17: logic thuần ở `src/core/**/*.test.ts` chạy môi trường node (không dựng jsdom cho từng file).
// jsdom chỉ dùng cho test React/DOM (`*.test.tsx`) và test ngoài `src/core`.
// Test trong src/core còn cần localStorage/DOM (migrate dữ liệu legacy) thì liệt kê ở đây để ở lại jsdom.
const CORE_NEEDS_DOM = ['src/core/storage/migrateLegacy.test.ts'];

const setupFiles = ['./src/test/setup.ts'];

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/core/**/*.ts'],
      exclude: ['src/core/**/*.test.ts', 'src/core/**/index.ts'],
    },
    projects: [
      {
        extends: false,
        test: {
          name: 'core-node',
          setupFiles,
          environment: 'node',
          include: ['src/core/**/*.test.ts'],
          exclude: [...CORE_NEEDS_DOM, '**/node_modules/**'],
        },
      },
      {
        extends: false,
        test: {
          name: 'ui-jsdom',
          setupFiles,
          environment: 'jsdom',
          pool: 'vmThreads',
          include: ['src/**/*.test.tsx', 'src/!(core)/**/*.test.ts', ...CORE_NEEDS_DOM],
          exclude: ['**/node_modules/**'],
        },
      },
    ],
  },
});
