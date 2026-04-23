import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const mobileWwwDir = path.join(projectRoot, 'mobile', 'www');
const bundledChartLibraryDestination = path.join(
  mobileWwwDir,
  'parsing-projects',
  'ireal',
  'sources'
);

await mkdir(mobileWwwDir, { recursive: true });

await cp(path.join(projectRoot, 'assets'), path.join(mobileWwwDir, 'assets'), {
  recursive: true,
  force: true
});

await rm(bundledChartLibraryDestination, {
  recursive: true,
  force: true
});
