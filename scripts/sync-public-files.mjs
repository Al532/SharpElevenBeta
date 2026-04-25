import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
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
  'demo.html',
  'favicon.svg',
  'parsing-projects/review-standard-conversions.txt',
  'piano-sample-calibrator.html',
  'piano-sample-calibrator.js',
  'progression-suffixes.txt',
  'style.css',
  'theme.js'
];

const templatedFiles = new Set([
  'demo.html'
]);

function getPublicPath(relativePath) {
  return path.join(publicDir, relativePath);
}

function getProjectPath(relativePath) {
  return path.join(projectRoot, relativePath);
}

async function renderStaticFile(relativePath) {
  const content = await readFile(getPublicPath(relativePath), 'utf8');
  if (!templatedFiles.has(relativePath)) {
    return content;
  }

  return content.replaceAll('__APP_VERSION__', appVersion);
}

async function syncPublicFilesTo(targetDir) {
  await mkdir(targetDir, { recursive: true });

  for (const relativePath of mirroredFiles) {
    const destinationPath = path.join(targetDir, relativePath);
    await mkdir(path.dirname(destinationPath), { recursive: true });

    if (templatedFiles.has(relativePath)) {
      await writeFile(destinationPath, await renderStaticFile(relativePath), 'utf8');
      continue;
    }

    await copyFile(getPublicPath(relativePath), destinationPath);
  }
}

async function renderTemplatedOutput(targetDir) {
  const destinationPath = path.join(targetDir, 'demo.html');
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, await renderStaticFile('demo.html'), 'utf8');
}

if (scriptMode === 'root' || scriptMode === 'all') {
  await syncPublicFilesTo(projectRoot);
}

if (scriptMode === 'build' || scriptMode === 'all') {
  await renderTemplatedOutput(getProjectPath('build'));
}

if (scriptMode === 'mobile' || scriptMode === 'all') {
  await renderTemplatedOutput(getProjectPath(path.join('mobile', 'www')));
}

if (scriptMode === 'demo' || scriptMode === 'all') {
  await renderTemplatedOutput(path.resolve(projectRoot, '..', 'JazzProgressionTrainerDemo'));
}
