import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator';

const packageJsonUrl = new URL('../../package.json', import.meta.url);
const packageJson = JSON.parse(readFileSync(fileURLToPath(packageJsonUrl), 'utf8'));
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  base: './',
  publicDir: 'public',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
  plugins: [
    obfuscatorPlugin({
      apply: 'build',
      exclude: [/node_modules/, /chart[\\/]chart-import-ireal\.ts$/, /chart[\\/]ireal-decoder\.mjs$/],
      options: {
        compact: true,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        stringArray: true,
        stringArrayThreshold: 0.75,
        splitStrings: true,
        splitStringsChunkLength: 8
      }
    })
  ],
  build: {
    sourcemap: false,
    outDir: 'build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(repositoryRoot, 'index.html'),
        irealBackupViewer: resolve(repositoryRoot, 'ireal-backup-viewer.html'),
        drill: resolve(repositoryRoot, 'drill.html'),
        setlists: resolve(repositoryRoot, 'setlists.html'),
        library: resolve(repositoryRoot, 'library.html')
      }
    }
  },
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: true,
    port: 4173
  }
});
