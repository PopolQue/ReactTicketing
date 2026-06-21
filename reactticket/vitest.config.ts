import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    alias: {
      'reactticket-core': resolve(__dirname, '../reactticket-core/src'),
    },
    server: {
      deps: {
        inline: ['reactticket-core'],
      },
    },
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      include: [resolve(__dirname, 'src/**/*')],
      exclude: ['src/**/*.test.*', 'src/**/__tests__/**/*'],
      thresholds: { lines: 70, functions: 70 },
    },
  },
});
