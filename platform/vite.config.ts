/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'reactticket-core': path.resolve(__dirname, '../reactticket-core/src'),
      'reactticket': path.resolve(__dirname, '../reactticket/src'),
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      thresholds: { lines: 70, functions: 70 }
    }
  },
  server: {
    allowedHosts: ["crescentlike-florencio-nonrustic.ngrok-free.dev"]
  }
})
