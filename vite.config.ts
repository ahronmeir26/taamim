import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/taamim/',
  plugins: [react()],
  server: {
    proxy: {
      '/taamim/api': 'http://127.0.0.1:8787',
    },
  },
});
