import baseConfig from './vite.web.config.js';

export default {
  ...baseConfig,
  build: {
    ...baseConfig.build,
    outDir: '../JazzProgressionTrainerDemo',
    // Keep previous hashed assets so a cached index.html on GitHub Pages
    // does not break while clients or the CDN still reference older bundles.
    emptyOutDir: false
  }
};
