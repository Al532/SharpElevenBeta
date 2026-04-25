import { defineConfig } from 'vite';

export default defineConfig({
  root: 'chart',
  base: './',
  publicDir: false,
  build: {
    outDir: '../mobile/www/chart',
    emptyOutDir: true,
    sourcemap: false
  }
});
