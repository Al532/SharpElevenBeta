import { createChartDocument } from './chart-types.js';

const DEFAULT_CANONICAL_GROOVE = 'Jazz-Medium Swing';

const CANONICAL_GROOVE_DEFAULT_TEMPOS = Object.freeze({
  'Jazz-Afro 12/8': 110,
  'Jazz-Ballad Swing': 60,
  'Jazz-Bossa Nova': 140,
  'Jazz-Even 8ths': 140,
  'Jazz-Even 16ths': 90,
  'Jazz-Latin': 180,
  'Jazz-Latin/Swing': 180,
  'Jazz-Medium Swing': 120,
  'Jazz-Medium Up Swing': 160,
  'Jazz-Up Tempo Swing': 240,
  'Latin-Argentina: Tango': 130,
  'Latin-Brazil: Samba': 220,
  'Latin-Cuba: Bolero': 90,
  'Pop-Country': 180,
  'Pop-Disco': 120,
  'Pop-Funk': 140,
  'Pop-Reggae': 90,
  'Pop-Rock': 115,
  'Pop-Slow Rock': 70,
  'Pop-Soul': 95
});

const EXPLICIT_GROOVE_TO_CANONICAL = Object.freeze({
  'Jazz-Ballad Swing': { canonicalGroove: 'Jazz-Ballad Swing' },
  'Jazz-Bossa Nova': { canonicalGroove: 'Jazz-Bossa Nova' },
  'Jazz-Even 8ths': { canonicalGroove: 'Jazz-Even 8ths' },
  'Jazz-Gypsy Jazz': { canonicalGroove: 'Pop-Rock', subStyle: 'gypsy-jazz' },
  'Jazz-Latin': { canonicalGroove: 'Jazz-Latin' },
  'Jazz-Medium Swing': { canonicalGroove: 'Jazz-Medium Swing' },
  'Jazz-Medium Up Swing': { canonicalGroove: 'Jazz-Medium Up Swing' },
  'Jazz-Slow Swing': { canonicalGroove: 'Jazz-Medium Swing', subStyle: 'slow-swing' },
  'Jazz-Swing Two/Four': { canonicalGroove: 'Jazz-Latin/Swing', subStyle: 'two-four' },
  'Jazz-Up Tempo Swing': { canonicalGroove: 'Jazz-Up Tempo Swing' },
  'Latin-Argentina: Tango': { canonicalGroove: 'Latin-Argentina: Tango' },
  'Latin-Brazil: Samba': { canonicalGroove: 'Latin-Brazil: Samba' },
  'Latin-Brazil: Bossa Acoustic': { canonicalGroove: 'Jazz-Bossa Nova', subStyle: 'acoustic' },
  'Latin-Brazil: Bossa Electric': { canonicalGroove: 'Jazz-Bossa Nova', subStyle: 'electric' },
  'Latin-Cuba: Bolero': { canonicalGroove: 'Latin-Cuba: Bolero' },
  'Latin-Cuba: Cha Cha Cha': { canonicalGroove: 'Latin-Cuba: Cha Cha Cha' },
  'Latin-Cuba: Son Montuno 2–3': { canonicalGroove: 'Latin-Cuba: Son Montuno', subStyle: '2-3' },
  'Latin-Cuba: Son Montuno 3–2': { canonicalGroove: 'Latin-Cuba: Son Montuno', subStyle: '3-2' },
  'Pop-Bluegrass': { canonicalGroove: 'Pop-Bluegrass' },
  'Pop-Country': { canonicalGroove: 'Pop-Country' },
  'Pop-Disco': { canonicalGroove: 'Pop-Disco' },
  'Pop-Funk': { canonicalGroove: 'Pop-Funk' },
  'Pop-Reggae': { canonicalGroove: 'Pop-Reggae' },
  'Pop-RnB': { canonicalGroove: 'Pop-Soul', subStyle: 'rnb' },
  'Pop-Rock': { canonicalGroove: 'Pop-Rock' },
  'Pop-Rock 12/8': { canonicalGroove: 'Pop-Rock', subStyle: '12-8' },
  'Pop-Shuffle': { canonicalGroove: 'Pop-Rock', subStyle: 'shuffle' },
  'Pop-Slow Rock': { canonicalGroove: 'Pop-Slow Rock' },
  'Pop-Smooth': { canonicalGroove: 'Pop-Soul', subStyle: 'smooth' },
  'Pop-Soul': { canonicalGroove: 'Pop-Soul' }
});

const STYLE_TO_CANONICAL = Object.freeze({
  Afro: { canonicalGroove: 'Jazz-Afro 12/8' },
  Ballad: { canonicalGroove: 'Jazz-Ballad Swing' },
  'Baião': { canonicalGroove: 'Baião' },
  Bluegrass: { canonicalGroove: 'Pop-Bluegrass' },
  Bossa: { canonicalGroove: 'Jazz-Bossa Nova' },
  'Bossa Nova': { canonicalGroove: 'Jazz-Bossa Nova' },
  'Cha Cha': { canonicalGroove: 'Latin-Cuba: Cha Cha Cha' },
  'Even 16ths': { canonicalGroove: 'Jazz-Even 16ths' },
  'Even 8ths': { canonicalGroove: 'Jazz-Even 8ths' },
  'Country Waltz': { canonicalGroove: 'Pop-Country', subStyle: 'waltz' },
  'Electro Pop': { canonicalGroove: 'Pop-Rock', subStyle: 'electro-pop' },
  Folk: { canonicalGroove: 'Pop-Rock', subStyle: 'folk' },
  'Folk Rock': { canonicalGroove: 'Pop-Rock', subStyle: 'folk-rock' },
  Funk: { canonicalGroove: 'Pop-Funk' },
  Latin: { canonicalGroove: 'Jazz-Latin' },
  'Latin-Swing': { canonicalGroove: 'Jazz-Latin/Swing' },
  Bolero: { canonicalGroove: 'Latin-Cuba: Bolero' },
  Country: { canonicalGroove: 'Pop-Country' },
  Disco: { canonicalGroove: 'Pop-Disco' },
  'Medium Country': { canonicalGroove: 'Pop-Country', subStyle: 'medium-country' },
  'Medium Up Swing': { canonicalGroove: 'Jazz-Medium Up Swing' },
  Pop: { canonicalGroove: 'Pop-Rock' },
  'Pop Ballad': { canonicalGroove: 'Pop-Slow Rock', subStyle: 'ballad' },
  'Pop Rock': { canonicalGroove: 'Pop-Rock' },
  Reggae: { canonicalGroove: 'Pop-Reggae' },
  "R'n'B": { canonicalGroove: 'Pop-Soul', subStyle: 'rnb' },
  Rock: { canonicalGroove: 'Pop-Rock' },
  'Rock Pop': { canonicalGroove: 'Pop-Rock' },
  RnB: { canonicalGroove: 'Pop-Soul', subStyle: 'rnb' },
  Salsa: { canonicalGroove: 'Latin-Cuba: Son Montuno', subStyle: 'salsa' },
  Samba: { canonicalGroove: 'Latin-Brazil: Samba' },
  'Samba Funk': { canonicalGroove: 'Latin-Brazil: Samba', subStyle: 'funk' },
  Shuffle: { canonicalGroove: 'Pop-Rock', subStyle: 'shuffle' },
  'Slow Rock': { canonicalGroove: 'Pop-Slow Rock' },
  'Slow Bossa': { canonicalGroove: 'Jazz-Bossa Nova', subStyle: 'slow-bossa' },
  Son: { canonicalGroove: 'Latin-Cuba: Son Montuno' },
  Soul: { canonicalGroove: 'Pop-Soul' },
  Tango: { canonicalGroove: 'Latin-Argentina: Tango' },
  'Up Tempo Swing': { canonicalGroove: 'Jazz-Up Tempo Swing' }
});

const DEFAULT_STYLE_SUBSTYLES = Object.freeze({
  Afoxe: 'afoxe',
  Blues: 'blues',
  Calypso: 'calypso',
  Chacarera: 'chacarera',
  Choro: 'choro',
  Forro: 'forro',
  Marchinha: 'marchinha',
  'Medium Slow': 'medium-slow',
  MPB: 'mpb',
  'Slow Swing': 'slow-swing',
  Waltz: 'waltz',
  Xote: 'xote'
});

function normalizeGrooveMetadata(song) {
  const styleReference = String(song?.style || '').trim();
  const grooveReference = String(song?.groove || '').trim();
  const explicitMapping = EXPLICIT_GROOVE_TO_CANONICAL[grooveReference];
  const styleMapping = STYLE_TO_CANONICAL[styleReference];
  const mapping = explicitMapping || styleMapping || null;
  const canonicalGroove = mapping?.canonicalGroove || grooveReference || (styleReference ? DEFAULT_CANONICAL_GROOVE : '');
  const subStyle = mapping?.subStyle || (!explicitMapping && !styleMapping && styleReference ? (DEFAULT_STYLE_SUBSTYLES[styleReference] || '') : '');
  const grooveSource = explicitMapping
    ? 'groove'
    : styleMapping
      ? 'style'
      : grooveReference
        ? 'groove-reference'
        : styleReference
          ? 'default'
          : 'unknown';
  const defaultTempo = CANONICAL_GROOVE_DEFAULT_TEMPOS[canonicalGroove] || 0;
  const sourceTempo = Number(song?.bpm || 0);
  const resolvedTempo = sourceTempo > 0 ? sourceTempo : defaultTempo;

  return {
    styleReference,
    grooveReference,
    canonicalGroove,
    subStyle,
    grooveSource,
    defaultTempo,
    sourceTempo,
    resolvedTempo
  };
}

function normalizeEndingTokens(tokens = []) {
  return tokens
    .map(token => String(token || '').trim())
    .filter(Boolean)
    .map(token => {
      const match = token.match(/^N(\d+)$/i);
      return match ? Number(match[1]) : token;
    });
}

function normalizeFlags(flags = []) {
  return Array.from(new Set((flags || []).map(flag => String(flag || '').trim()).filter(Boolean)));
}

function normalizeDirective(directive) {
  if (!directive || typeof directive !== 'object') return null;
  return JSON.parse(JSON.stringify(directive));
}

function normalizeChordSlot(chord) {
  const symbol = String(chord?.symbol || '').trim();
  return {
    kind: 'chord',
    symbol,
    root: chord?.root || '',
    quality: chord?.modifier || '',
    bass: chord?.bass || null,
    displayPrefix: chord?.display_prefix || '',
    alternate: chord?.alternate ? normalizeChordSlot(chord.alternate) : null
  };
}

function withSourceCellPlacement(token, sourceCellIndex, sourceCellCount) {
  return {
    ...token,
    sourceCellIndex,
    sourceCellCount
  };
}

function createSlashMarkerToken(sourceCellIndex, sourceCellCount) {
  return withSourceCellPlacement({
    kind: 'slash_marker',
    symbol: '/',
    displayOnly: true
  }, sourceCellIndex, sourceCellCount);
}

function createAlternateChordToken(chord, sourceCellIndex, sourceCellCount) {
  return withSourceCellPlacement({
    ...normalizeChordSlot(chord),
    kind: 'alternate_chord',
    displayOnly: true
  }, sourceCellIndex, sourceCellCount);
}

function isDisplayableCellChord(chord) {
  if (!chord) return false;
  return ![' ', 'x', 'r', 'n', 'W'].includes(chord.root || '');
}

function createDisplayTokensFromCellSlots(cellSlots = [], { includeStandaloneAlternates = false } = {}) {
  const sourceCellCount = cellSlots.length;
  const tokens = [];

  for (const [sourceCellIndex, cellSlot] of cellSlots.entries()) {
    const chord = cellSlot?.chord || null;
    if (!chord) continue;

    if (chord.root === 'p') {
      tokens.push(createSlashMarkerToken(sourceCellIndex, sourceCellCount));
      continue;
    }

    if (includeStandaloneAlternates && chord.alternate) {
      tokens.push(createAlternateChordToken(chord.alternate, sourceCellIndex, sourceCellCount));
    }

    if (isDisplayableCellChord(chord)) {
      tokens.push(withSourceCellPlacement(normalizeChordSlot(chord), sourceCellIndex, sourceCellCount));
    }
  }

  return tokens;
}

function normalizeCellSlot(cell) {
  return {
    bars: String(cell?.bars || ''),
    annots: Array.isArray(cell?.annots) ? [...cell.annots] : [],
    comments: Array.isArray(cell?.comments) ? [...cell.comments] : [],
    spacer: Number(cell?.spacer || 0),
    chord: cell?.chord ? normalizeChordSlot(cell.chord) : null
  };
}

function normalizeTextAnnotation(annotation) {
  const text = String(annotation?.text || '').trim();
  if (!text) return null;
  const sourceCellCount = Math.max(1, Number(annotation?.source_cell_count || annotation?.sourceCellCount || 4));
  const sourceCellIndex = Math.max(
    0,
    Math.min(sourceCellCount - 1, Number(annotation?.source_cell_index || annotation?.sourceCellIndex || 0))
  );
  const yOffset = Number(annotation?.y_offset ?? annotation?.yOffset);

  return {
    text,
    raw: String(annotation?.raw || ''),
    offsetCode: annotation?.offset_code ? String(annotation.offset_code) : null,
    yOffset: Number.isFinite(yOffset) ? yOffset : null,
    sourceCellIndex,
    sourceCellCount,
    vertical: Number.isFinite(yOffset) && yOffset <= 4 ? 'above' : 'below'
  };
}

function normalizeSystemLayout(systemLayout, bars) {
  if (!systemLayout || typeof systemLayout !== 'object') return null;

  const barIdByIndex = new Map((bars || []).map(bar => [bar.index, bar.id]));
  const normalizedRows = Array.isArray(systemLayout.rows)
    ? systemLayout.rows.map(row => {
      const barIndices = Array.isArray(row?.bar_indices)
        ? row.bar_indices
          .map(value => Number(value))
          .filter(Number.isInteger)
        : [];

      return {
        rowIndex: Number(row?.row_index || 0),
        startCellIndex: Number(row?.start_cell_index || 0),
        leadingEmptyCells: Number(row?.leading_empty_cells || 0),
        leadingEmptyBars: Number(row?.leading_empty_bars || 0),
        barIndices,
        barIds: barIndices
          .map(barIndex => barIdByIndex.get(barIndex))
          .filter(Boolean)
      };
    }).filter(row => row.rowIndex > 0)
    : [];

  if (!normalizedRows.length) return null;

  return {
    source: 'ireal',
    systems: {
      cellsPerRow: Number(systemLayout.cells_per_row || 16),
      totalCells: Number(systemLayout.total_cells || 0),
      rowCount: normalizedRows.length,
      rows: normalizedRows
    }
  };
}

function createDisplayState(bar, playbackSlots, overlaySlots) {
  const notationKind = bar?.source_event || 'written';
  const displayCellSlots = Array.isArray(bar?.display_cell_slots) && bar.display_cell_slots.length > 0
    ? bar.display_cell_slots
    : bar?.cell_slots;
  const cellDisplayTokens = createDisplayTokensFromCellSlots(displayCellSlots);
  const alternateDisplayTokens = createDisplayTokensFromCellSlots(displayCellSlots, {
    includeStandaloneAlternates: true
  }).filter(token => token.kind === 'alternate_chord');

  if (notationKind === 'single_bar_repeat') {
    return {
      kind: 'single_bar_repeat',
      tokens: [
        { kind: 'repeat_previous_bar', symbol: '%', sourceCellCount: displayCellSlots?.length || 0 },
        ...alternateDisplayTokens
      ]
    };
  }

  if (notationKind === 'double_bar_repeat_start' || notationKind === 'double_bar_repeat_followup') {
    return {
      kind: notationKind,
      tokens: [
        { kind: 'repeat_previous_two_bars', symbol: '%%', sourceCellCount: displayCellSlots?.length || 0 },
        ...alternateDisplayTokens
      ]
    };
  }

  if (notationKind === 'single_bar_repeat_with_overlay') {
    return {
      kind: notationKind,
      tokens: [
        { kind: 'repeat_previous_bar', symbol: '%' },
        ...overlaySlots
      ]
    };
  }

  if (notationKind === 'no_chord') {
    return {
      kind: 'no_chord',
      tokens: [{ kind: 'no_chord', symbol: 'N.C.' }]
    };
  }

  return {
    kind: 'written',
    tokens: cellDisplayTokens.length > 0 ? cellDisplayTokens : playbackSlots
  };
}

function createChartBar(rawBar, sectionId) {
  const playbackSlots = (rawBar?.chords || []).map(normalizeChordSlot);
  const overlaySlots = (rawBar?.overlay_chords || []).map(normalizeChordSlot);
  const flags = normalizeFlags(rawBar?.flags);
  return {
    id: `bar-${rawBar.index}`,
    index: rawBar.index,
    sectionId,
    sectionLabel: rawBar.section,
    timeSignature: rawBar.time_signature || null,
    spacerCount: Number(rawBar.spacer_count || 0),
    endings: normalizeEndingTokens(rawBar.endings),
    chordSizes: Array.isArray(rawBar.chord_sizes) ? [...rawBar.chord_sizes] : [],
    annotationMisc: Array.isArray(rawBar.annotation_misc) ? [...rawBar.annotation_misc] : [],
    flags,
    directives: (rawBar.directives || []).map(normalizeDirective).filter(Boolean),
    comments: Array.isArray(rawBar.comments) ? [...rawBar.comments] : [],
    textAnnotations: Array.isArray(rawBar.text_annotations)
      ? rawBar.text_annotations.map(normalizeTextAnnotation).filter(Boolean)
      : [],
    sourceEvent: rawBar.source_event || null,
    repeatedFromBar: rawBar.repeated_from_bar || null,
    specialEvents: Array.isArray(rawBar.special_events) ? JSON.parse(JSON.stringify(rawBar.special_events)) : [],
    notation: createDisplayState(rawBar, playbackSlots, overlaySlots),
    playback: {
      slots: playbackSlots,
      overlaySlots,
      cellSlots: Array.isArray(rawBar?.cell_slots) ? rawBar.cell_slots.map(normalizeCellSlot) : []
    }
  };
}

function createSection(section) {
  return {
    id: `${section.label || 'section'}-${section.occurrence || 1}`,
    label: section.label || '',
    occurrence: section.occurrence || 1,
    barIds: (section.bars || []).map(bar => `bar-${bar.index}`)
  };
}

export function createChartDocumentFromIReal({
  song,
  playlistName = '',
  sourceFile = '',
  sourceType = 'ireal-decoded-clean',
  importedAt = new Date().toISOString()
}) {
  const grooveMetadata = normalizeGrooveMetadata(song);
  const sections = (song.sections || []).map(createSection);
  const bars = [];

  for (const rawSection of song.sections || []) {
    const sectionId = `${rawSection.label || 'section'}-${rawSection.occurrence || 1}`;
    for (const bar of rawSection.bars || []) {
      bars.push(createChartBar(bar, sectionId));
    }
  }

  const layout = normalizeSystemLayout(song.system_layout, bars);

  return createChartDocument({
    metadata: {
      id: `${song.title || 'chart'}-${song.index || 0}`
        .toLowerCase()
        .replace(/[^\w]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      title: song.title || '',
      composer: song.composer || '',
      style: grooveMetadata.styleReference,
      groove: grooveMetadata.grooveReference,
      styleReference: grooveMetadata.styleReference,
      grooveReference: grooveMetadata.grooveReference,
      canonicalGroove: grooveMetadata.canonicalGroove,
      grooveSubStyle: grooveMetadata.subStyle,
      grooveSource: grooveMetadata.grooveSource,
      sourceKey: song.source_key || '',
      sourceTranspose: Number(song.transpose || 0),
      sourceRepeats: Number(song.repeats || 0),
      tempo: grooveMetadata.resolvedTempo,
      sourceTempo: grooveMetadata.sourceTempo,
      defaultTempo: grooveMetadata.defaultTempo,
      timeSignatures: Array.isArray(song.time_signatures) ? [...song.time_signatures] : [],
      primaryTimeSignature: song.time_signatures?.[0] || '',
      barCount: Number(song.bar_count || bars.length || 0)
    },
    source: {
      type: sourceType,
      playlistName,
      sourceFile,
      songIndex: song.index || 0,
      importedAt
    },
    sections,
    bars,
    layout
  });
}

export async function createChartDocumentsFromIRealText({
  rawText,
  sourceFile = '',
  importedAt = new Date().toISOString()
}) {
  const { decodePlaylistRaw } = await import('./ireal-decoder.mjs');
  const { cleanOutput } = decodePlaylistRaw(rawText, {
    sourceFileName: sourceFile
  });

  return (cleanOutput.songs || []).map(song => createChartDocumentFromIReal({
    song,
    playlistName: cleanOutput.playlist_name || '',
    sourceFile: cleanOutput.source_file || sourceFile,
    sourceType: 'ireal-source',
    importedAt
  }));
}

export async function createChartDocumentsFromIRealSource({
  sourcePath,
  importedAt = new Date().toISOString()
}) {
  const sourceFile = sourcePath.split(/[/\\]/).pop() || '';
  const { decodePlaylistFile } = await import('./ireal-decoder.mjs');
  const { cleanOutput } = await decodePlaylistFile(sourcePath, { sourceFileName: sourceFile });

  return (cleanOutput.songs || []).map(song => createChartDocumentFromIReal({
    song,
    playlistName: cleanOutput.playlist_name || '',
    sourceFile: cleanOutput.source_file || sourceFile,
    sourceType: 'ireal-source',
    importedAt
  }));
}
