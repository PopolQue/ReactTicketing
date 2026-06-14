import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'reactticket-core': path.resolve(__dirname, '../reactticket-core/src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  esbuild: {
    drop: ['console', 'debugger']
  }
});
