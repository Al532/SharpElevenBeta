import { createChartDocument } from './chart-types.js';

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

function createDisplayState(bar, playbackSlots, overlaySlots) {
  const notationKind = bar?.source_event || 'written';

  if (notationKind === 'single_bar_repeat') {
    return {
      kind: 'single_bar_repeat',
      tokens: [{ kind: 'repeat_previous_bar', symbol: '%' }]
    };
  }

  if (notationKind === 'double_bar_repeat_start' || notationKind === 'double_bar_repeat_followup') {
    return {
      kind: notationKind,
      tokens: [{ kind: 'repeat_previous_two_bars', symbol: '%%' }]
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
    tokens: playbackSlots
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
    flags,
    directives: (rawBar.directives || []).map(normalizeDirective).filter(Boolean),
    comments: Array.isArray(rawBar.comments) ? [...rawBar.comments] : [],
    sourceEvent: rawBar.source_event || null,
    repeatedFromBar: rawBar.repeated_from_bar || null,
    specialEvents: Array.isArray(rawBar.special_events) ? JSON.parse(JSON.stringify(rawBar.special_events)) : [],
    notation: createDisplayState(rawBar, playbackSlots, overlaySlots),
    playback: {
      slots: playbackSlots,
      overlaySlots
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
  importedAt = new Date().toISOString()
}) {
  const sections = (song.sections || []).map(createSection);
  const bars = [];

  for (const rawSection of song.sections || []) {
    const sectionId = `${rawSection.label || 'section'}-${rawSection.occurrence || 1}`;
    for (const bar of rawSection.bars || []) {
      bars.push(createChartBar(bar, sectionId));
    }
  }

  return createChartDocument({
    metadata: {
      id: `${song.title || 'chart'}-${song.index || 0}`
        .toLowerCase()
        .replace(/[^\w]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      title: song.title || '',
      composer: song.composer || '',
      style: song.style || '',
      groove: song.groove || '',
      sourceKey: song.source_key || '',
      tempo: Number(song.bpm || 0),
      timeSignatures: Array.isArray(song.time_signatures) ? [...song.time_signatures] : [],
      primaryTimeSignature: song.time_signatures?.[0] || '',
      barCount: Number(song.bar_count || bars.length || 0)
    },
    source: {
      type: 'ireal-decoded-clean',
      playlistName,
      sourceFile,
      songIndex: song.index || 0,
      importedAt
    },
    sections,
    bars
  });
}
