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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('@supabase')) return 'vendor-supabase';
          }
        }
      }
    }
  }
});