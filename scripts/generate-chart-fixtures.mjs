import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createChartDocumentFromIReal,
  createChartPlaybackPlanFromDocument,
  createDrillExportFromPlaybackPlan
} from '../chart/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'parsing-projects', 'ireal', 'playlists', 'jazz-1460', 'decoded-clean.json');
const targetDir = path.join(projectRoot, 'chart-dev', 'fixtures');
const targetPath = path.join(targetDir, 'chart-fixtures.json');
const mediumSwingTargetPath = path.join(targetDir, 'chart-medium-swing.json');

const SAMPLE_TITLES = Object.freeze([
  'Satin Doll',
  'Alice In Wonderland',
  'Body And Soul',
  'All The Things You Are',
  'Stella By Starlight'
]);

const MEDIUM_SWING_STYLE = 'medium swing';

function buildChartRecord(song, source) {
  const chartDocument = createChartDocumentFromIReal({
    song,
    playlistName: source.playlist_name,
    sourceFile: source.source_file
  });
  const playbackPlan = createChartPlaybackPlanFromDocument(chartDocument);
  return {
    ...chartDocument,
    preview: {
      diagnostics: playbackPlan.diagnostics,
      drillExport: createDrillExportFromPlaybackPlan(playbackPlan, chartDocument)
    }
  };
}

const raw = JSON.parse(await readFile(sourcePath, 'utf8'));
const documents = [];

for (const title of SAMPLE_TITLES) {
  const song = raw.songs.find(entry => entry.title === title);
  if (!song) {
    throw new Error(`Missing chart fixture source for "${title}".`);
  }
  documents.push(buildChartRecord(song, raw));
}

const mediumSwingDocuments = (raw.songs || [])
  .filter(song => String(song.style || '').trim().toLowerCase() === MEDIUM_SWING_STYLE)
  .sort((left, right) => {
    const titleComparison = String(left.title || '').localeCompare(String(right.title || ''), 'en', { sensitivity: 'base' });
    if (titleComparison !== 0) return titleComparison;
    return Number(left.index || 0) - Number(right.index || 0);
  })
  .map(song => buildChartRecord(song, raw));

await mkdir(targetDir, { recursive: true });
await writeFile(
  targetPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'parsing-projects/ireal/playlists/jazz-1460/decoded-clean.json',
    documents
  }, null, 2)}\n`,
  'utf8'
);

await writeFile(
  mediumSwingTargetPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'parsing-projects/ireal/playlists/jazz-1460/decoded-clean.json',
    filter: {
      style: 'Medium Swing'
    },
    documentCount: mediumSwingDocuments.length,
    documents: mediumSwingDocuments
  }, null, 2)}\n`,
  'utf8'
);

console.log(`Wrote ${documents.length} chart fixtures to ${path.relative(projectRoot, targetPath)}`);
console.log(`Wrote ${mediumSwingDocuments.length} Medium Swing charts to ${path.relative(projectRoot, mediumSwingTargetPath)}`);
