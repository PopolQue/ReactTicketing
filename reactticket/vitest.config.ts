import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    alias: {
      'reactticket-core': resolve(__dirname, '../reactticket-core/src')
    }
  }
});
