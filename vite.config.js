import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator';

const packageJsonUrl = new URL('./package.json', import.meta.url);
const packageJson = JSON.parse(readFileSync(fileURLToPath(packageJsonUrl), 'utf8'));

export default defineConfig({
  base: './',
  publicDir: 'Public',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
  plugins: [
    obfuscatorPlugin({
      apply: 'build',
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
    outDir: '../JazzProgressionTrainerDemo',
    emptyOutDir: true
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
