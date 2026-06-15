import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      thresholds: { lines: 70, functions: 70 }
    }
  }
});
