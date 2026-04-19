import { defineConfig } from 'vite';

export default defineConfig({
  root: 'chart-dev',
  publicDir: false,
  server: {
    host: true,
    port: 5180
  }
});
