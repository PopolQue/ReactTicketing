import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/ReactTicketing/',
  plugins: [react()],
  resolve: {
    alias: {
      '@ReactTicket': path.resolve(__dirname, '../../reactticket/src'),
    },
  },
});
