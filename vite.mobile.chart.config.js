import { defineConfig } from 'vite';

export default defineConfig({
  root: 'chart-dev',
  base: './',
  publicDir: false,
  build: {
    outDir: '../mobile/www/chart-dev',
    emptyOutDir: true,
    sourcemap: false
  }
});
