import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/auth':       { target: 'http://localhost:8081', changeOrigin: true },
      '/api/users':      { target: 'http://localhost:8081', changeOrigin: true },
      '/api/menu-items': { target: 'http://localhost:8082', changeOrigin: true },
      '/api/categories': { target: 'http://localhost:8082', changeOrigin: true },
      '/api/combos':     { target: 'http://localhost:8082', changeOrigin: true },
      '/api/sessions':   { target: 'http://localhost:8083', changeOrigin: true },
      '/api/orders':     { target: 'http://localhost:8083', changeOrigin: true },
      '/api/bills':      { target: 'http://localhost:8084', changeOrigin: true },
      '/ws':             { target: 'http://localhost:8083', changeOrigin: true, ws: true },
    },
  },
});
