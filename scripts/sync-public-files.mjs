import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const scriptMode = process.argv[2] || 'public';
const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
const appVersion = packageJson.version;

const filesToSync = [
  'chord-symbol.css',
  'default-progressions.txt',
  'demo.html',
  'favicon.svg',
  'parsing-projects/review-standard-conversions.txt',
  'piano-sample-calibrator.html',
  'piano-sample-calibrator.js',
  'progression-suffixes.txt',
  'style.css'
];

const directoriesToSyncForBuild = [
  'assets'
];

const templatedFiles = new Set([
  'demo.html'
]);

async function getBuildOutDir() {
  const viteConfigPath = path.join(projectRoot, 'vite.config.js');
  const viteConfigContent = await readFile(viteConfigPath, 'utf8');
  const outDirMatch = viteConfigContent.match(/outDir\s*:\s*['"`]([^'"`]+)['"`]/);
  if (!outDirMatch) return null;
  return path.resolve(projectRoot, outDirMatch[1]);
}

async function syncToDirectory(targetDir, label) {
  await mkdir(targetDir, { recursive: true });

  for (const relativePath of filesToSync) {
    const sourcePath = path.join(projectRoot, relativePath);
    const destinationPath = path.join(targetDir, relativePath);
    await mkdir(path.dirname(destinationPath), { recursive: true });
    if (templatedFiles.has(relativePath)) {
      const sourceContent = await readFile(sourcePath, 'utf8');
      const renderedContent = sourceContent.replaceAll('__APP_VERSION__', appVersion);
      await writeFile(destinationPath, renderedContent, 'utf8');
    } else {
      await copyFile(sourcePath, destinationPath);
    }
  }
}

async function syncDirectoriesToBuild(targetDir, label) {
  for (const relativePath of directoriesToSyncForBuild) {
    const sourcePath = path.join(projectRoot, relativePath);
    const destinationPath = path.join(targetDir, relativePath);
    await cp(sourcePath, destinationPath, { recursive: true, force: true });
  }
}

if (scriptMode === 'public' || scriptMode === 'all') {
  await syncToDirectory(publicDir, 'public');
}

if (scriptMode === 'build' || scriptMode === 'all') {
  const buildOutDir = await getBuildOutDir();
  if (buildOutDir) {
    await syncToDirectory(buildOutDir, path.relative(projectRoot, buildOutDir) || path.basename(buildOutDir));
    await syncDirectoriesToBuild(buildOutDir, path.relative(projectRoot, buildOutDir) || path.basename(buildOutDir));
  }
}
