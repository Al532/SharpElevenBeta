import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const mobileWwwDir = path.join(projectRoot, 'mobile', 'www');
const bundledChartLibrarySource = path.join(
  projectRoot,
  'parsing-projects',
  'ireal',
  'sources'
);
const bundledChartLibraryDestination = path.join(
  mobileWwwDir,
  'parsing-projects',
  'ireal',
  'sources'
);

await mkdir(mobileWwwDir, { recursive: true });
await mkdir(bundledChartLibraryDestination, { recursive: true });

await cp(path.join(projectRoot, 'assets'), path.join(mobileWwwDir, 'assets'), {
  recursive: true,
  force: true
});

await cp(bundledChartLibrarySource, bundledChartLibraryDestination, {
  recursive: true,
  force: true
});
