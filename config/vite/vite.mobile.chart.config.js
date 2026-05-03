import { defineConfig } from 'vite';

const includeChartTestFixtures = process.env.VITE_INCLUDE_CHART_TEST_FIXTURES ?? 'false';

export default defineConfig({
  root: 'chart',
  base: './',
  publicDir: false,
  define: {
    'import.meta.env.VITE_INCLUDE_CHART_TEST_FIXTURES': JSON.stringify(includeChartTestFixtures)
  },
  build: {
    outDir: '../mobile/www/chart',
    emptyOutDir: true,
    sourcemap: false
  }
});
