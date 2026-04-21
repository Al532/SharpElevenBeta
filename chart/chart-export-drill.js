function normalizeSlotSymbol(slot) {
  return String(slot?.symbol || '').trim();
}

function compressBeatSlotsToDrillBar(symbols = []) {
  const normalized = (symbols || []).filter(Boolean);
  if (normalized.length === 0) return [];
  if (normalized.length === 1) return [normalized[0], normalized[0], normalized[0], normalized[0]];
  if (normalized.length === 2) return [normalized[0], normalized[0], normalized[1], normalized[1]];
  if (normalized.length === 4) return normalized;

  // Drill consumes bars as four beat-level harmony slots. Sample the
  // source subdivisions across the bar so denser iReal cell grids
  // (8 or 12 cells, for example) still collapse into a compatible bar.
  return Array.from({ length: 4 }, (_, beatIndex) => {
    const sourceIndex = Math.min(
      normalized.length - 1,
      Math.floor((beatIndex * normalized.length) / 4)
    );
    return normalized[sourceIndex];
  });
}

function resolveBeatSlotsFromCellSlots(cellSlots = []) {
  if (!Array.isArray(cellSlots) || cellSlots.length === 0) return [];

  const resolved = [];
  let activeChord = null;

  for (const cellSlot of cellSlots) {
    const cellChord = cellSlot?.chord ? normalizeSlotSymbol(cellSlot.chord) : '';
    if (cellChord) {
      activeChord = cellChord;
    }
    if (activeChord) {
      resolved.push(activeChord);
    }
  }

  return compressBeatSlotsToDrillBar(resolved);
}

function resolveBeatSlotsFromPlaybackSlots(playbackSlots = []) {
  const symbols = (playbackSlots || [])
    .map(normalizeSlotSymbol)
    .filter(Boolean);

  return compressBeatSlotsToDrillBar(symbols);
}

function resolveEntryBeatSlots(entry) {
  const fromCells = resolveBeatSlotsFromCellSlots(entry?.playbackCellSlots || []);
  if (fromCells.length > 0) return fromCells;
  return resolveBeatSlotsFromPlaybackSlots(entry?.playbackSlots || []);
}

export function createDrillExportFromPlaybackPlan(playbackPlan, chartDocument) {
  const bars = [];
  const engineBars = [];

  for (const entry of playbackPlan?.entries || []) {
    const symbols = (entry.playbackSlots || [])
      .map(normalizeSlotSymbol)
      .filter(Boolean);
    if (symbols.length === 0) continue;
    bars.push(symbols.join(' '));
    engineBars.push(resolveEntryBeatSlots(entry).join(' '));
  }

  const patternString = bars.join(' | ');
  const enginePatternString = engineBars.join(' | ');

  return {
    title: chartDocument?.metadata?.title || playbackPlan?.chartTitle || '',
    sourceKey: chartDocument?.metadata?.sourceKey || '',
    timeSignature: chartDocument?.metadata?.primaryTimeSignature || playbackPlan?.timeSignature || '',
    patternString,
    enginePatternString: enginePatternString ? `key: C | ${enginePatternString} |` : '',
    bars,
    engineBars
  };
}
