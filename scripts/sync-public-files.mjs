import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const scriptMode = process.argv[2] || 'root';
const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
const appVersion = packageJson.version;

const mirroredFiles = [
  'chord-symbol.css',
  'default-progressions.txt',
  'favicon.svg',
  'parsing-projects/review-standard-conversions.txt',
  'piano-sample-calibrator.html',
  'piano-sample-calibrator.js',
  'progression-suffixes.txt',
  'style.css',
  'theme.css',
  'theme-bootstrap.js',
  'theme-palettes.css',
  'theme.js'
];

const mirroredBinaryFiles = [
  'logo/classic-paper.png',
  'logo/dark-mode.png'
];

const staticAssetPaths = [
  '13_heavy_hi-hat_chick.mp3',
  'MP3',
  'Piano',
  'ride',
  'fonts',
  'music-symbols'
];

function getPublicPath(relativePath) {
  return path.join(publicDir, relativePath);
}

function getProjectPath(relativePath) {
  return path.join(projectRoot, relativePath);
}

async function renderStaticFile(relativePath) {
  const content = await readFile(getPublicPath(relativePath), 'utf8');
  return content.replaceAll('__APP_VERSION__', appVersion);
}

async function syncPublicFilesTo(targetDir) {
  await mkdir(targetDir, { recursive: true });

  for (const relativePath of mirroredFiles) {
    const destinationPath = path.join(targetDir, relativePath);
    await mkdir(path.dirname(destinationPath), { recursive: true });

    await writeFile(destinationPath, await renderStaticFile(relativePath), 'utf8');
  }

  for (const relativePath of mirroredBinaryFiles) {
    const destinationPath = path.join(targetDir, relativePath);
    await mkdir(path.dirname(destinationPath), { recursive: true });

    await cp(getPublicPath(relativePath), destinationPath, { force: true });
  }
}

async function syncStaticAssetsTo(targetDir) {
  const sourceAssetsDir = path.join(projectRoot, 'assets');
  const targetAssetsDir = path.join(targetDir, 'assets');
  await mkdir(targetAssetsDir, { recursive: true });

  for (const relativePath of staticAssetPaths) {
    await cp(
      path.join(sourceAssetsDir, relativePath),
      path.join(targetAssetsDir, relativePath),
      { recursive: true, force: true }
    );
  }
}

if (scriptMode === 'root' || scriptMode === 'all') {
  await syncPublicFilesTo(projectRoot);
}

if (scriptMode === 'build') {
  const buildDir = path.join(projectRoot, 'build');
  await syncPublicFilesTo(buildDir);
  await syncStaticAssetsTo(buildDir);
}

if (scriptMode === 'mobile') {
  const mobileBuildDir = path.join(projectRoot, 'mobile/www');
  await syncPublicFilesTo(mobileBuildDir);
  await syncStaticAssetsTo(mobileBuildDir);
}

if (scriptMode === 'demo') {
  const demoBuildDir = path.join(projectRoot, 'dist');
  await syncPublicFilesTo(demoBuildDir);
  await syncStaticAssetsTo(demoBuildDir);
}
