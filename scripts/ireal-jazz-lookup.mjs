import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  decodePlaylistFile,
  buildCleanOutput,
  buildDetailedOutput,
  toSlug
} from '../chart/ireal-decoder.mjs';

const ROOT = process.cwd();
const SOURCE_PATH = path.join(ROOT, 'parsing-projects', 'ireal', 'sources', 'jazz-1460.txt');
const VERSIONED_CLEAN_PATH = path.join(ROOT, 'parsing-projects', 'ireal', 'playlists', 'jazz-1460', 'decoded-clean.json');
const TEMP_DIR = path.join(ROOT, '.codex-temp', 'ireal-jazz-1460');
const TEMP_CLEAN_PATH = path.join(TEMP_DIR, 'decoded-clean.json');
const TEMP_DETAILED_PATH = path.join(TEMP_DIR, 'decoded-detailed.json');
const TEMP_DOCUMENTS_PATH = path.join(TEMP_DIR, 'chart-documents.json');
const TEMP_INDEX_PATH = path.join(TEMP_DIR, 'lookup-index.json');

function parseArgs(argv) {
  const options = {
    regen: false,
    source: 'auto',
    title: '',
    index: 0,
    measure: 0,
    line: 0,
    context: 1,
    limit: 12,
    json: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] || '';

    if (arg === '--regen') options.regen = true;
    else if (arg === '--temp') options.source = 'temp';
    else if (arg === '--versioned') options.source = 'versioned';
    else if (arg === '--json') options.json = true;
    else if (arg === '--title' || arg === '-t') options.title = next();
    else if (arg === '--index' || arg === '-i') options.index = Number(next());
    else if (arg === '--measure' || arg === '--bar' || arg === '-m') options.measure = Number(next());
    else if (arg === '--line' || arg === '-l') options.line = Number(next());
    else if (arg === '--context' || arg === '-c') options.context = Math.max(0, Number(next()));
    else if (arg === '--limit') options.limit = Math.max(1, Number(next()));
    else if (arg === '--help' || arg === '-h') options.help = true;
  }

  return options;
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function importChartImporter() {
  return import(pathToFileURL(path.join(ROOT, 'chart', 'chart-import-ireal.ts')).href);
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function barSummary(bar) {
  const chords = (bar?.chords || []).map(chord => chord.symbol).filter(Boolean);
  const cells = (bar?.cell_slots || [])
    .map((cell) => cell?.chord?.symbol || cell?.bars || '')
    .filter(Boolean);
  return {
    index: bar.index,
    section: bar.section,
    chords,
    cells,
    flags: bar.flags || [],
    endings: bar.endings || [],
    directives: bar.directives || [],
    comments: bar.comments || [],
    textAnnotations: bar.text_annotations || [],
    sourceEvent: bar.source_event || null,
    repeatedFromBar: bar.repeated_from_bar || null,
    specialEvents: bar.special_events || []
  };
}

function internalBarSummary(bar) {
  return {
    id: bar?.id || '',
    index: bar?.index || 0,
    section: bar?.sectionLabel || '',
    notation: bar?.notation || null,
    playbackSlots: bar?.playback?.slots || [],
    cellSlots: bar?.playback?.cellSlots || [],
    flags: bar?.flags || [],
    endings: bar?.endings || [],
    directives: bar?.directives || [],
    comments: bar?.comments || [],
    textAnnotations: bar?.textAnnotations || [],
    sourceEvent: bar?.sourceEvent || null,
    repeatedFromBar: bar?.repeatedFromBar || null,
    specialEvents: bar?.specialEvents || []
  };
}

function findLineLayout(song, lineNumber) {
  const rows = song?.system_layout?.systems?.rows || song?.system_layout?.rows || [];
  const row = rows.find(candidate => Number(candidate.rowIndex || candidate.row_index) === lineNumber);
  if (!row) return null;

  const barIndices = row.barIds
    ? row.barIds.map(id => Number(String(id).replace(/^bar-/, ''))).filter(Number.isFinite)
    : (row.barIndices || row.bar_indices || []).map(Number).filter(Number.isFinite);

  return {
    rowIndex: Number(row.rowIndex || row.row_index || lineNumber),
    startCellIndex: Number(row.startCellIndex || row.start_cell_index || 0),
    leadingEmptyCells: Number(row.leadingEmptyCells || row.leading_empty_cells || 0),
    barIndices
  };
}

function selectBars(song, document, { measure, line, context }) {
  if (line > 0) {
    const layout = findLineLayout(song, line);
    const indices = new Set(layout?.barIndices || []);
    return {
      lineLayout: layout,
      cleanBars: (song.sections || []).flatMap(section => section.bars || []).filter(bar => indices.has(bar.index)),
      internalBars: (document?.bars || []).filter(bar => indices.has(bar.index))
    };
  }

  const allCleanBars = (song.sections || []).flatMap(section => section.bars || []);
  const allInternalBars = document?.bars || [];
  if (!measure) {
    return {
      lineLayout: null,
      cleanBars: allCleanBars,
      internalBars: allInternalBars
    };
  }

  const first = Math.max(1, measure - context);
  const last = measure + context;
  return {
    lineLayout: null,
    cleanBars: allCleanBars.filter(bar => bar.index >= first && bar.index <= last),
    internalBars: allInternalBars.filter(bar => bar.index >= first && bar.index <= last)
  };
}

function buildLookupIndex(cleanOutput) {
  return {
    generated_at: new Date().toISOString(),
    source_file: cleanOutput.source_file,
    playlist_name: cleanOutput.playlist_name,
    song_count: cleanOutput.song_count,
    songs: (cleanOutput.songs || []).map(song => ({
      index: song.index,
      title: song.title,
      composer: song.composer,
      slug: toSlug(`${song.title}-${song.composer}-${song.index}`),
      bar_count: song.bar_count,
      rows: song.system_layout?.systems?.rows?.map(row => ({
        rowIndex: row.rowIndex,
        barIndices: row.barIds.map(id => Number(String(id).replace(/^bar-/, ''))).filter(Number.isFinite)
      })) || []
    }))
  };
}

async function regenerateTemp() {
  const generatedAt = new Date().toISOString();
  const { playlist, decodedSongs } = await decodePlaylistFile(SOURCE_PATH, {
    sourceFileName: 'jazz-1460.txt',
    generatedAt
  });
  const cleanOutput = buildCleanOutput('jazz-1460.txt', playlist, decodedSongs, generatedAt);
  const detailedOutput = buildDetailedOutput('jazz-1460.txt', playlist, decodedSongs, generatedAt);
  const { createChartDocumentFromIReal } = await importChartImporter();
  const documents = (cleanOutput.songs || []).map(song => createChartDocumentFromIReal({
    song,
    playlistName: cleanOutput.playlist_name || '',
    sourceFile: cleanOutput.source_file || 'jazz-1460.txt',
    sourceType: 'ireal-source',
    importedAt: generatedAt
  }));

  await writeJson(TEMP_CLEAN_PATH, cleanOutput);
  await writeJson(TEMP_DETAILED_PATH, detailedOutput);
  await writeJson(TEMP_DOCUMENTS_PATH, documents);
  await writeJson(TEMP_INDEX_PATH, buildLookupIndex(cleanOutput));

  return { cleanOutput, documents, regenerated: true };
}

async function loadDataset(options) {
  if (options.regen) return regenerateTemp();

  const useTemp = options.source === 'temp' || (options.source === 'auto' && await pathExists(TEMP_CLEAN_PATH));
  const cleanPath = useTemp ? TEMP_CLEAN_PATH : VERSIONED_CLEAN_PATH;
  const cleanOutput = JSON.parse(await fs.readFile(cleanPath, 'utf8'));

  let documents = null;
  if (useTemp && await pathExists(TEMP_DOCUMENTS_PATH)) {
    documents = JSON.parse(await fs.readFile(TEMP_DOCUMENTS_PATH, 'utf8'));
  }

  return { cleanOutput, documents, regenerated: false, sourcePath: cleanPath };
}

function findSongs(cleanOutput, options) {
  const songs = cleanOutput.songs || [];
  if (options.index > 0) return songs.filter(song => Number(song.index) === options.index);
  if (!options.title) return songs.slice(0, options.limit);

  const query = normalizeSearchText(options.title);
  const exact = songs.filter(song => normalizeSearchText(song.title) === query);
  if (exact.length) return exact.slice(0, options.limit);

  return songs
    .filter(song => normalizeSearchText(`${song.title} ${song.composer}`).includes(query))
    .slice(0, options.limit);
}

async function makeDocumentForSong(cleanOutput, documents, song) {
  const cachedDocument = documents?.find(document => Number(document?.source?.songIndex) === Number(song.index));
  if (cachedDocument) return cachedDocument;

  const { createChartDocumentFromIReal } = await importChartImporter();
  return createChartDocumentFromIReal({
    song,
    playlistName: cleanOutput.playlist_name || '',
    sourceFile: cleanOutput.source_file || 'jazz-1460.txt',
    sourceType: 'ireal-source'
  });
}

function formatText(result) {
  const lines = [];
  lines.push(`${result.song.index}. ${result.song.title}${result.song.composer ? ` - ${result.song.composer}` : ''}`);
  lines.push(`style=${result.song.style || ''} groove=${result.song.groove || ''} key=${result.song.source_key || ''} bars=${result.song.bar_count}`);
  if (result.lineLayout) {
    lines.push(`line ${result.lineLayout.rowIndex}: bars ${result.lineLayout.barIndices.join(', ') || '(none)'}`);
  }
  lines.push('');
  lines.push('decoded-clean bars:');
  for (const bar of result.cleanBars) {
    lines.push(`  m.${bar.index}${bar.section ? ` [${bar.section}]` : ''}: ${(bar.chords || []).join(' | ') || '(empty)'}${bar.sourceEvent ? ` <${bar.sourceEvent}>` : ''}`);
    if (bar.cells?.length) lines.push(`    cells: ${bar.cells.join(' / ')}`);
    if (bar.flags?.length) lines.push(`    flags: ${bar.flags.join(', ')}`);
    if (bar.endings?.length) lines.push(`    endings: ${bar.endings.join(', ')}`);
    if (bar.comments?.length) lines.push(`    comments: ${bar.comments.join(' | ')}`);
    if (bar.directives?.length) lines.push(`    directives: ${bar.directives.map(directive => directive.type || JSON.stringify(directive)).join(', ')}`);
    if (bar.specialEvents?.length) lines.push(`    special: ${bar.specialEvents.map(event => event.type || event).join(', ')}`);
  }

  lines.push('');
  lines.push('Sharp11 internal bars:');
  for (const bar of result.internalBars) {
    const tokens = bar.notation?.tokens?.map(token => token.symbol || token.kind).filter(Boolean) || [];
    const slots = bar.playbackSlots.map(slot => slot.symbol).filter(Boolean);
    lines.push(`  ${bar.id}: notation=${bar.notation?.kind || ''} [${tokens.join(' | ')}] playback=[${slots.join(' | ')}]`);
    if (bar.cellSlots?.length) {
      lines.push(`    cells: ${bar.cellSlots.map(cell => cell?.chord?.symbol || cell?.bars || '').filter(Boolean).join(' / ')}`);
    }
  }

  return lines.join('\n');
}

function printHelp() {
  console.log(`Usage:
  node --import ./scripts/register-ts-source-loader.mjs scripts/ireal-jazz-lookup.mjs --title "Satin Doll" --measure 8
  node --import ./scripts/register-ts-source-loader.mjs scripts/ireal-jazz-lookup.mjs --index 1 --line 2
  node --import ./scripts/register-ts-source-loader.mjs scripts/ireal-jazz-lookup.mjs --regen

Options:
  --regen              Re-decode Jazz 1460 into .codex-temp/ireal-jazz-1460
  --temp               Read the regenerated temp cache
  --versioned          Read parsing-projects/ireal/playlists/jazz-1460/decoded-clean.json
  --title, -t          Search by title/composer substring
  --index, -i          Select source song index
  --measure, -m        Show one measure with --context bars around it
  --line, -l           Show the iReal layout row/line
  --json               Print JSON instead of compact text`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const { cleanOutput, documents, regenerated, sourcePath } = await loadDataset(options);
  if (regenerated && !options.title && !options.index) {
    console.log(`Regenerated Jazz 1460 temp cache in ${TEMP_DIR}`);
    console.log(`Songs: ${cleanOutput.song_count}`);
    return;
  }

  const matches = findSongs(cleanOutput, options);
  if (!matches.length) {
    console.log(`No Jazz 1460 chart matched ${options.index || options.title || '(empty query)'}.`);
    return;
  }

  const results = [];
  for (const song of matches) {
    const document = await makeDocumentForSong(cleanOutput, documents, song);
    const selection = selectBars(song, document, options);
    results.push({
      dataset: sourcePath || TEMP_CLEAN_PATH,
      playlist: cleanOutput.playlist_name,
      song: {
        index: song.index,
        title: song.title,
        composer: song.composer,
        style: song.style,
        groove: song.groove,
        source_key: song.source_key,
        bar_count: song.bar_count
      },
      lineLayout: selection.lineLayout,
      cleanBars: selection.cleanBars.map(barSummary),
      internalBars: selection.internalBars.map(internalBarSummary)
    });
  }

  if (options.json) {
    console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
    return;
  }

  console.log(results.map(formatText).join('\n\n---\n\n'));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
