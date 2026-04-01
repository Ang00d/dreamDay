import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,       // Puerto del frontend en desarrollo
    proxy: {
      // Redirige /api/* al backend (evita problemas de CORS en desarrollo)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
