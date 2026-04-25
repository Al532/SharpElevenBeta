import { defineConfig } from 'vite';

export default defineConfig({
  root: 'chart',
  publicDir: false,
  server: {
    host: true,
    port: 5180
  }
});
