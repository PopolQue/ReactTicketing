/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        'reactticket-core': path.resolve(__dirname, '../reactticket-core/src'),
        reactticket: path.resolve(__dirname, '../reactticket/src'),
      },
    },
    ssr: {
      noExternal: ['posthog-js', '@posthog/react'],
    },
    esbuild: {
      drop: ['console', 'debugger'],
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.ts',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
      coverage: {
        thresholds: { lines: 70, functions: 70 },
      },
    },
    optimizeDeps: {
      exclude: ['reactticket'],
    },
    server: {
      allowedHosts: ['crescentlike-florencio-nonrustic.ngrok-free.dev'],
      fs: {
        allow: ['..'],
      },
      proxy: {
        '/ingest/static': {
          target: env.VITE_PUBLIC_POSTHOG_ASSETS_HOST,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ingest/, ''),
        },
        '/ingest/array': {
          target: env.VITE_PUBLIC_POSTHOG_ASSETS_HOST,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ingest/, ''),
        },
        '/ingest': {
          target: env.VITE_PUBLIC_POSTHOG_HOST,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ingest/, ''),
        },
      },
    },
  };
});
