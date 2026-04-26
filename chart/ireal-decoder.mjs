import { Playlist } from '../parsing-projects/ireal/node_modules/@music-i18n/ireal-musicxml/build/ireal-musicxml.mjs';
import chordQualityMap from './ireal-chord-qualities.json' with { type: 'json' };

export const IREAL_SCHEMA_VERSION = '2.0.0';

function normalizeModifier(rawModifier = '') {
  return chordQualityMap[rawModifier] ?? rawModifier;
}

function formatChord(chord) {
  if (!chord) return null;

  const specialRoot = chord.note || '';
  if (['x', 'r', 'p', 'W', 'n', ' '].includes(specialRoot)) {
    return {
      symbol: specialRoot,
      root: specialRoot,
      modifier: normalizeModifier(chord.modifiers || ''),
      raw_modifier: chord.modifiers || '',
      bass: chord.over ? chord.over.note : null,
      alternate: chord.alternate ? formatChord(chord.alternate) : null,
      is_special: true
    };
  }

  const symbol =
    `${chord.note}${normalizeModifier(chord.modifiers || '')}` +
    (chord.over?.note ? `/${chord.over.note}` : '');

  return {
    symbol,
    root: chord.note,
    modifier: normalizeModifier(chord.modifiers || ''),
    raw_modifier: chord.modifiers || '',
    bass: chord.over ? chord.over.note : null,
    alternate: chord.alternate ? formatChord(chord.alternate) : null,
    is_special: false
  };
}

function cloneChord(chord) {
  return JSON.parse(JSON.stringify(chord));
}

function cloneList(value) {
  return JSON.parse(JSON.stringify(value));
}

function simplifyCellSlot(cell) {
  return {
    bars: cell.bars || '',
    annots: Array.isArray(cell.annots) ? [...cell.annots] : [],
    comments: Array.isArray(cell.comments) ? [...cell.comments] : [],
    spacer: Number(cell.spacer || 0),
    chord: cell.chord ? simplifyChord(cell.chord) : null
  };
}

function cleanCommentText(comment) {
  return String(comment || '')
    .replace(/\s+/g, ' ')
    .replace(/^\*\d+/, '')
    .trim();
}

export function toSlug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function extractCommentDirectives(comments = []) {
  const directives = [];
  const freeText = [];

  for (const rawComment of comments) {
    const comment = cleanCommentText(rawComment);
    if (!comment) continue;

    if (/^\((\d+)x?s?\)$/i.test(comment)) {
      const [, times] = comment.match(/^\((\d+)x?s?\)$/i);
      directives.push({ type: 'repeat_hint', times: Number(times) });
      continue;
    }

    if (/^(\d+)x$/i.test(comment)) {
      const [, times] = comment.match(/^(\d+)x$/i);
      directives.push({ type: 'repeat_hint', times: Number(times) });
      continue;
    }

    if (/^\((\d+)\)$/i.test(comment)) {
      const [, times] = comment.match(/^\((\d+)\)$/i);
      directives.push({ type: 'repeat_hint', times: Number(times) });
      continue;
    }

    if (/^(\d+)$/i.test(comment)) {
      const [, times] = comment.match(/^(\d+)$/i);
      directives.push({ type: 'repeat_hint', times: Number(times) });
      continue;
    }

    if (/^D\.S\.\s*al\s*Coda$/i.test(comment)) {
      directives.push({ type: 'ds_al_coda' });
      continue;
    }

    if (/^D\.S\.\s*al\s*Fine$/i.test(comment)) {
      directives.push({ type: 'ds_al_fine' });
      continue;
    }

    if (/^D\.S\.\s*al\s*(\d+)(?:st|nd|rd|th)\s*(?:End\.?|ending)$/i.test(comment)) {
      const [, ending] = comment.match(/^D\.S\.\s*al\s*(\d+)(?:st|nd|rd|th)\s*(?:End\.?|ending)$/i);
      directives.push({ type: 'ds_al_ending', ending: Number(ending) });
      continue;
    }

    if (/^D\.C\.\s*al\s*Coda$/i.test(comment)) {
      directives.push({ type: 'dc_al_coda' });
      continue;
    }

    if (/^D\.C\.\s*al\s*Fine$/i.test(comment)) {
      directives.push({ type: 'dc_al_fine' });
      continue;
    }

    if (/^D\.C\.\s*al\s*(\d+)(?:st|nd|rd|th)\s*(?:End\.?|ending)$/i.test(comment)) {
      const [, ending] = comment.match(/^D\.C\.\s*al\s*(\d+)(?:st|nd|rd|th)\s*(?:End\.?|ending)$/i);
      directives.push({ type: 'dc_al_ending', ending: Number(ending) });
      continue;
    }

    if (/^D\.C\.\s*on\s*cue$/i.test(comment)) {
      directives.push({ type: 'dc_on_cue' });
      continue;
    }

    if (/^Fine$/i.test(comment)) {
      directives.push({ type: 'fine' });
      continue;
    }

    if (/^Fine\s*\((.+)\)$/i.test(comment)) {
      const [, qualifier] = comment.match(/^Fine\s*\((.+)\)$/i);
      directives.push({ type: 'fine', qualifier: qualifier.trim() });
      continue;
    }

    if (/^open$/i.test(comment)) {
      directives.push({ type: 'open_vamp' });
      continue;
    }

    if (/^open\s+vamp$/i.test(comment)) {
      directives.push({ type: 'open_vamp' });
      continue;
    }

    if (/^open\b/i.test(comment)) {
      directives.push({ type: 'open_instruction', text: comment });
      continue;
    }

    if (/^vamp(?:\b.*)?$/i.test(comment)) {
      directives.push({ type: 'vamp_instruction', text: comment });
      continue;
    }

    if (/^repeat and fade(?: out)?$/i.test(comment) || /^fade(?: out)?$/i.test(comment)) {
      directives.push({ type: 'fade_out', text: comment });
      continue;
    }

    freeText.push(comment);
  }

  return { directives, free_text: freeText };
}

function isEffectivelyEmptyBar(bar) {
  return bar.chords.length === 0 || bar.chords.every(chord => chord.root === ' ');
}

function resolveSpecialBars(bars) {
  for (let index = 0; index < bars.length; index += 1) {
    const bar = bars[index];
    bar.special_events = bar.special_events || [];
    bar.overlay_chords = bar.overlay_chords || [];
    const roots = bar.chords.map(chord => chord.root);
    const repeatedChordRoots = roots.filter(root => root === 'x' || root === 'r' || root === ' ');
    const literalChords = bar.chords.filter(chord => !['x', 'r', ' ', 'p', 'W', 'n'].includes(chord.root));

    if (roots.length > 0 && roots.every(root => root === 'x' || root === ' ')) {
      const sourceBar = bars[index - 1];
      if (sourceBar) {
        bar.source_event = 'single_bar_repeat';
        bar.repeated_from_bar = sourceBar.index;
        bar.chords = sourceBar.chords.map(cloneChord);
        bar.cell_slots = cloneList(sourceBar.cell_slots || []);
        if (sourceBar.special_events?.length) {
          bar.special_events.push(...cloneList(sourceBar.special_events));
        }
      }
      continue;
    }

    if (repeatedChordRoots.some(root => root === 'x') && literalChords.length > 0) {
      const sourceBar = bars[index - 1];
      if (sourceBar) {
        bar.source_event = 'single_bar_repeat_with_overlay';
        bar.repeated_from_bar = sourceBar.index;
        bar.overlay_chords = literalChords.map(cloneChord);
        bar.chords = sourceBar.chords.map(cloneChord);
        bar.cell_slots = cloneList(sourceBar.cell_slots || []);
        if (sourceBar.special_events?.length) {
          bar.special_events.push(...cloneList(sourceBar.special_events));
        }
      }
      continue;
    }

    if (roots.length > 0 && roots.every(root => root === 'r' || root === ' ')) {
      const firstSource = bars[index - 2];
      const secondSource = bars[index - 1];
      if (firstSource) {
        bar.source_event = 'double_bar_repeat_start';
        bar.repeated_from_bar = firstSource.index;
        bar.chords = firstSource.chords.map(cloneChord);
        bar.cell_slots = cloneList(firstSource.cell_slots || []);
        if (firstSource.special_events?.length) {
          bar.special_events.push(...cloneList(firstSource.special_events));
        }
      }

      const nextBar = bars[index + 1];
      if (nextBar && isEffectivelyEmptyBar(nextBar) && secondSource) {
        nextBar.source_event = 'double_bar_repeat_followup';
        nextBar.repeated_from_bar = secondSource.index;
        nextBar.chords = secondSource.chords.map(cloneChord);
        nextBar.cell_slots = cloneList(secondSource.cell_slots || []);
        nextBar.special_events = nextBar.special_events || [];
        if (secondSource.special_events?.length) {
          nextBar.special_events.push(...cloneList(secondSource.special_events));
        }
      }
      continue;
    }

    const resolvedChords = [];
    let pendingSlash = false;

    for (const chord of bar.chords) {
      if (chord.root === ' ') {
        bar.source_event = bar.source_event || 'alternate_or_blank_marker';
        continue;
      }

      if (chord.root === 'n') {
        bar.special_events.push({ type: 'no_chord_marker' });
        continue;
      }

      if (chord.root === 'p') {
        pendingSlash = true;
        bar.special_events.push({ type: 'slash_display_marker' });
        continue;
      }

      if (chord.root === 'W') {
        bar.special_events.push({
          type: 'invisible_root_marker',
          bass: chord.bass
        });
        pendingSlash = true;
        continue;
      }

      const nextChord = cloneChord(chord);
      if (pendingSlash) {
        nextChord.display_prefix = '/';
        pendingSlash = false;
      }
      resolvedChords.push(nextChord);
    }

    bar.chords = resolvedChords;

    if (bar.special_events.some(event => event.type === 'no_chord_marker') && bar.chords.length === 0) {
      bar.source_event = 'no_chord';
    }
  }
}

function inferFlags(openBar, closeBar, annotations = [], comments = []) {
  const flags = [];
  if (openBar === '{') flags.push('repeat_start_barline');
  if (closeBar === '}') flags.push('repeat_end_barline');
  if (openBar === '[') flags.push('section_start_barline');
  if (closeBar === ']') flags.push('section_end_barline');
  if (closeBar === 'Z') flags.push('final_bar');
  if (annotations.includes('Q')) flags.push('coda');
  if (annotations.includes('S')) flags.push('segno');
  if (annotations.includes('f')) flags.push('fermata');
  if (annotations.includes('U')) flags.push('end');

  const normalizedComments = comments.map(comment => String(comment).trim()).filter(Boolean);
  if (normalizedComments.some(comment => /D\.S\./i.test(comment))) flags.push('ds');
  if (normalizedComments.some(comment => /D\.C\./i.test(comment))) flags.push('dc');
  if (normalizedComments.some(comment => /Fine/i.test(comment))) flags.push('fine');
  return flags;
}

function extractBarAnnotations(annots = []) {
  const section = annots.find(token => token.startsWith('*'))?.slice(1) || null;
  const timeSignature = annots.find(token => /^T\d+$/.test(token)) || null;
  const endings = annots.filter(token => /^N\d+$/.test(token));
  const chordSizes = annots.filter(token => token === 's' || token === 'l');
  const remaining = annots.filter(
    token =>
      token !== `*${section}` &&
      token !== timeSignature &&
      !/^N\d+$/.test(token) &&
      token !== 's' &&
      token !== 'l'
  );

  const formattedTimeSignature = (() => {
    if (!timeSignature) return null;
    const value = timeSignature.slice(1);
    if (value.length === 2 && value.startsWith('1')) return `${value}/8`;
    return `${value.slice(0, -1)}/${value.slice(-1)}`;
  })();

  return {
    section,
    time_signature: formattedTimeSignature,
    endings,
    chord_sizes: chordSizes,
    raw: annots,
    misc: remaining
  };
}

function buildSystemLayout(cells = [], bars = []) {
  const CELLS_PER_ROW = 16;
  const rowsByIndex = new Map();

  for (const bar of bars) {
    const startCellIndex = Number(bar?.start_cell_index);
    if (!Number.isInteger(startCellIndex) || startCellIndex < 0) continue;
    const rowIndex = Math.floor(startCellIndex / CELLS_PER_ROW);
    const leadingEmptyCells = startCellIndex % CELLS_PER_ROW;
    if (!rowsByIndex.has(rowIndex)) {
      rowsByIndex.set(rowIndex, {
        row_index: rowIndex + 1,
        start_cell_index: rowIndex * CELLS_PER_ROW,
        leading_empty_cells: leadingEmptyCells,
        leading_empty_bars: Math.floor(leadingEmptyCells / 4),
        bar_indices: []
      });
    }
    rowsByIndex.get(rowIndex).bar_indices.push(bar.index);
  }

  const rows = [...rowsByIndex.values()].sort((left, right) => left.row_index - right.row_index);

  return {
    cells_per_row: CELLS_PER_ROW,
    total_cells: Array.isArray(cells) ? cells.length : 0,
    rows
  };
}

function decodeSong(song, index) {
  const bars = [];
  let currentBar = null;
  let sectionLabel = null;
  let sectionOccurrence = 0;
  const sections = [];
  let currentSection = null;

  const flushSection = () => {
    if (currentSection && currentSection.bars.length) sections.push(currentSection);
    currentSection = null;
  };

  const startSectionIfNeeded = (nextLabel) => {
    const effectiveLabel = nextLabel || sectionLabel || 'untitled';
    if (!currentSection || currentSection.label !== effectiveLabel) {
      flushSection();
      if (effectiveLabel !== sectionLabel) sectionOccurrence = 1;
      else sectionOccurrence += 1;
      currentSection = { label: effectiveLabel, occurrence: sectionOccurrence, bars: [] };
      sectionLabel = effectiveLabel;
    }
  };

  const finalizeBar = () => {
    if (!currentBar) return;
    const annotations = extractBarAnnotations(currentBar.annotations);
    const nextLabel = annotations.section;
    startSectionIfNeeded(nextLabel);

      const normalizedBar = {
        index: bars.length + 1,
        start_cell_index: currentBar.start_cell_index,
        open_bar: currentBar.open_bar || '',
        close_bar: currentBar.close_bar || '',
        comments: currentBar.comments,
      spacer_count: currentBar.spacer_count || 0,
        comment_directives: extractCommentDirectives(currentBar.comments),
        inferred_flags: inferFlags(currentBar.open_bar, currentBar.close_bar, currentBar.annotations, currentBar.comments),
        section: currentSection.label,
        annotations,
        chords: currentBar.chords,
        cell_slots: currentBar.cell_slots
      };

    bars.push(normalizedBar);
    currentSection.bars.push(normalizedBar);
    currentBar = null;
  };

  for (const [cellIndex, cell] of song.cells.entries()) {
    const opensBar = cell.bars && /[\(\[\{]/.test(cell.bars);
    const closesBar = cell.bars && /[\)\]\}Z]/.test(cell.bars);

    if (!currentBar && (opensBar || cell.chord || (cell.annots && cell.annots.length))) {
      currentBar = {
        start_cell_index: cellIndex,
        open_bar: opensBar ? cell.bars : '',
        close_bar: '',
        annotations: [],
        comments: [],
        chords: [],
        cell_slots: []
      };
    }

    if (!currentBar) continue;

    if (opensBar && !currentBar.open_bar) currentBar.open_bar = cell.bars;
    if (cell.annots?.length) currentBar.annotations.push(...cell.annots);
    if (cell.comments?.length) currentBar.comments.push(...cell.comments);
    if (cell.spacer) currentBar.spacer_count = Math.max(currentBar.spacer_count || 0, cell.spacer);
    const formattedChord = cell.chord ? formatChord(cell.chord) : null;
    if (formattedChord) currentBar.chords.push(formattedChord);
    currentBar.cell_slots.push({
      bars: cell.bars || '',
      annots: Array.isArray(cell.annots) ? [...cell.annots] : [],
      comments: Array.isArray(cell.comments) ? [...cell.comments] : [],
      spacer: Number(cell.spacer || 0),
      chord: formattedChord ? cloneChord(formattedChord) : null
    });
    if (closesBar) currentBar.close_bar = cell.bars;

    if (closesBar) finalizeBar();
  }

  finalizeBar();
  flushSection();
  resolveSpecialBars(bars);

  const linearProgression = bars.flatMap(bar => bar.chords.map(chord => chord.symbol));
  const uniqueTimeSignatures = [...new Set(bars.map(bar => bar.annotations.time_signature).filter(Boolean))];

  return {
    index: index + 1,
    title: song.title,
    composer: song.composer,
    style: song.style,
    groove: song.groove || '',
    source_key: song.key,
    transpose: song.transpose,
    bpm: song.bpm || 0,
    repeats: song.repeats,
    status: 'decoded_from_ireal_playlist',
    confidence: 'high',
    notes: [],
    time_signatures: uniqueTimeSignatures,
    bars,
    sections,
    system_layout: buildSystemLayout(song.cells, bars),
    linear_progression: linearProgression.join(' '),
    linear_progression_symbols: linearProgression
  };
}

function simplifyChord(chord) {
  return {
    symbol: `${chord.display_prefix || ''}${chord.symbol}`,
    root: chord.root,
    ...(chord.display_prefix ? { display_prefix: chord.display_prefix } : {}),
    ...(chord.modifier ? { modifier: chord.modifier } : {}),
    ...(chord.bass ? { bass: chord.bass } : {}),
    ...(chord.alternate ? { alternate: simplifyChord(chord.alternate) } : {})
  };
}

function summarizeBar(bar) {
  return {
    index: bar.index,
    section: bar.section,
    chords: bar.chords.map(simplifyChord),
    overlay_chords: (bar.overlay_chords || []).map(simplifyChord),
    cell_slots: (bar.cell_slots || []).map(simplifyCellSlot),
    source_event: bar.source_event || null,
    repeated_from_bar: bar.repeated_from_bar || null,
    endings: bar.annotations.endings || [],
    chord_sizes: bar.annotations.chord_sizes || [],
    annotation_misc: bar.annotations.misc || [],
    flags: bar.inferred_flags || [],
    time_signature: bar.annotations.time_signature || null,
    spacer_count: bar.spacer_count || 0,
    directives: bar.comment_directives?.directives || [],
    comments: bar.comment_directives?.free_text || [],
    special_events: bar.special_events || []
  };
}

export function buildCleanSong(song) {
  const machineSections = song.sections.map(section => ({
    label: section.label,
    occurrence: section.occurrence,
    bars: section.bars.map(bar => summarizeBar(bar))
  }));

  return {
    index: song.index,
    title: song.title,
    composer: song.composer,
    style: song.style,
    groove: song.groove,
    source_key: song.source_key,
    transpose: song.transpose,
    bpm: song.bpm,
    repeats: song.repeats,
    time_signatures: song.time_signatures,
    bar_count: song.bars.length,
    system_layout: song.system_layout || null,
    sections: machineSections
  };
}

export function buildDetailedOutput(sourceFileName, playlist, decodedSongs, generatedAt) {
  return {
    schema_version: IREAL_SCHEMA_VERSION,
    source_file: sourceFileName,
    source_format: 'iReal Pro playlist URI',
    playlist_name: playlist.name,
    generated_at: generatedAt,
    song_count: decodedSongs.length,
    notes: [
      'Decoded with a local wrapper around @music-i18n/ireal-musicxml.',
      'Chord modifiers were normalized to app-friendly ASCII spellings where possible.',
      'Repeat and ending markers are preserved as raw annotations and inferred flags on bars.'
    ],
    songs: decodedSongs
  };
}

export function buildCleanOutput(sourceFileName, playlist, decodedSongs, generatedAt) {
  return {
    schema_version: IREAL_SCHEMA_VERSION,
    source_file: sourceFileName,
    source_format: 'iReal Pro playlist URI',
    playlist_name: playlist.name,
    generated_at: generatedAt,
    song_count: decodedSongs.length,
    enums: {
      source_event: [
        'single_bar_repeat',
        'single_bar_repeat_with_overlay',
        'double_bar_repeat_start',
        'double_bar_repeat_followup',
        'no_chord',
        'alternate_or_blank_marker'
      ],
      flags: [
        'repeat_start_barline',
        'repeat_end_barline',
        'section_start_barline',
        'section_end_barline',
        'final_bar',
        'coda',
        'segno',
        'fermata',
        'end',
        'ds',
        'dc',
        'fine'
      ],
      directives: [
        'repeat_hint',
        'ds_al_coda',
        'dc_al_fine',
        'dc_al_coda',
        'dc_al_ending',
        'dc_on_cue',
        'ds_al_fine',
        'ds_al_ending',
        'fine',
        'open_vamp',
        'open_instruction',
        'vamp_instruction',
        'fade_out'
      ],
      special_events: [
        'no_chord_marker',
        'slash_display_marker',
        'invisible_root_marker'
      ]
    },
    notes: [
      'Machine-oriented export derived from decoded-detailed.json.',
      'Keeps only parser-relevant structure: sections, bars, normalized chords, repeats, overlays, directives, and flags.',
      'Bar-level collections are always present as arrays, and optional scalar links are explicit nulls.'
    ],
    songs: decodedSongs.map(buildCleanSong)
  };
}

export function decodePlaylistRaw(raw, {
  sourceFileName = '',
  generatedAt = new Date().toISOString()
} = {}) {
  const playlist = new Playlist(raw);
  const decodedSongs = playlist.songs.map((song, songIndex) => decodeSong(song, songIndex));
  return {
    playlist,
    decodedSongs,
    detailedOutput: buildDetailedOutput(sourceFileName, playlist, decodedSongs, generatedAt),
    cleanOutput: buildCleanOutput(sourceFileName, playlist, decodedSongs, generatedAt)
  };
}

export async function decodePlaylistFile(sourcePath, options = {}) {
  const fs = await import('node:fs/promises');
  const raw = await fs.readFile(sourcePath, 'utf8');
  return decodePlaylistRaw(raw, {
    sourceFileName: options.sourceFileName || String(sourcePath || '').split(/[/\\]/).pop() || '',
    generatedAt: options.generatedAt
  });
}
