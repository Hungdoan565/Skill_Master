import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false, // Tự động chuyển port nếu 5173 bận
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  optimizeDeps: {
    force: true, // Force re-optimize dependencies
  },
});
