import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createFlattenedFrozenSuffixLibrary,
  FROZEN_SUFFIX_BLOCK_IDS
} from './suffix-block-library.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(scriptDir, 'frozen-suffix-catalog.json');
const outputPath = path.join(scriptDir, 'frozen-suffix-runtime.json');

const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const snapshot = catalog.snapshots.find((item) => item.status === 'active') || catalog.snapshots[0];
if (!snapshot) throw new Error('No frozen suffix snapshot found.');

const roleFontIds = snapshot.roles;
const atlases = await loadAtlases(roleFontIds);
const blocks = createFlattenedFrozenSuffixLibrary({
  roleFontIds,
  getAtlas: (fontId) => atlases[fontId] || null,
  tuning: snapshot.tuning
});

const payload = {
  version: 1,
  sourceSnapshotId: snapshot.id,
  sourceFrozenBlockIds: [...FROZEN_SUFFIX_BLOCK_IDS],
  roles: roleFontIds,
  size: snapshot.size,
  weight: snapshot.weight,
  blockCount: blocks.length,
  blocks
};

await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote ${path.relative(process.cwd(), outputPath)} (${blocks.length} blocks).`);

async function loadAtlases(roleFontIds) {
  const uniqueFontIds = [...new Set(Object.values(roleFontIds))];
  const entries = await Promise.all(uniqueFontIds.map(async (fontId) => {
    const atlasPath = path.join(scriptDir, 'atlases', `${fontId}.json`);
    return [fontId, JSON.parse(await fs.readFile(atlasPath, 'utf8'))];
  }));
  return Object.fromEntries(entries);
}
