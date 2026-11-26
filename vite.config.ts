import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://qa.elevate-pdc.shikshalokam.org',
        changeOrigin: true,
        secure: false,
        headers: {
          Authorization: 'Basic cWE6VzlVcCpdMDU4Zio=',
        },
      },
    },
  },
});
