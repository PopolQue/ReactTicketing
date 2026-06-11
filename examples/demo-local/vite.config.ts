import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@ReactTicket': path.resolve(__dirname, '../../reactticket/src'),
      'reactticket-core': path.resolve(__dirname, '../../reactticket-core/src'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
    },
  },
});
