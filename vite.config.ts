import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { taamimApiPlugin } from './server/vite-api-plugin.mjs';

export default defineConfig({
  base: '/taamim/',
  plugins: [react(), taamimApiPlugin()],
});
