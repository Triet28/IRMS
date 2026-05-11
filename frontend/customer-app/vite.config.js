import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api/menu-items': { target: 'http://localhost:8082', changeOrigin: true },
      '/api/combos':     { target: 'http://localhost:8082', changeOrigin: true },
      '/api/sessions':   { target: 'http://localhost:8083', changeOrigin: true },
      '/api/orders':     { target: 'http://localhost:8083', changeOrigin: true },
      '/ws':             { target: 'http://localhost:8083', changeOrigin: true, ws: true },
    },
  },
});
