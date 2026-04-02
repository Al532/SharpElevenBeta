import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'Public');

const filesToSync = [
  'default-presets.json',
  'pattern-suffixes.txt'
];

await mkdir(publicDir, { recursive: true });

for (const relativePath of filesToSync) {
  const sourcePath = path.join(projectRoot, relativePath);
  const destinationPath = path.join(publicDir, relativePath);
  await copyFile(sourcePath, destinationPath);
  console.log(`Synced ${relativePath} -> Public/${relativePath}`);
}
