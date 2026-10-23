import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pkgJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
const pkgVersion = pkgJson.version || '0.25.0';

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  build: {
    assetsInlineLimit: file => (file.endsWith('.woff2') ? false : undefined),
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.APP_VERSION || pkgVersion),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
