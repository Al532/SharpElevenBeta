function deepClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value : (value == null ? fallback : String(value));
}

function normalizeNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function normalizeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export const PRACTICE_SESSION_SCHEMA_VERSION = '1.0.0';

export const PRACTICE_SESSION_CONTRACT = Object.freeze({
  schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
  requiredTopLevelFields: [
    'schemaVersion',
    'id',
    'source',
    'title',
    'tempo',
    'timeSignature',
    'playback',
    'display',
    'selection',
    'origin'
  ],
  requiredPlaybackFields: ['bars', 'patternString', 'enginePatternString'],
  notes: [
    'Practice sessions are JSON-safe plain objects.',
    'Playback bars are normalized before pattern strings are derived.',
    'Display, selection, and origin remain optional payloads but are always JSON-safe.'
  ]
});

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'session';
}

function normalizeSlotSymbol(slot) {
  return String(slot?.symbol || '').trim();
}

function compressBeatSlotsToDrillBar(symbols = []) {
  const normalized = (symbols || []).filter(Boolean);
  if (normalized.length === 0) return [];
  if (normalized.length === 1) return [normalized[0], normalized[0], normalized[0], normalized[0]];
  if (normalized.length === 2) return [normalized[0], normalized[0], normalized[1], normalized[1]];
  if (normalized.length === 4) return normalized;

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

export function createPracticePlaybackBar({
  id = '',
  index = 0,
  symbols = [],
  beatSlots = [],
  timeSignature = '',
  sectionId = '',
  sectionLabel = '',
  metadata = {}
} = {}) {
  const normalizedSymbols = (symbols || []).map(String).filter(Boolean);
  const normalizedBeatSlots = (beatSlots || []).map(String).filter(Boolean);

  return {
    id: normalizeString(id) || `bar-${normalizeNumber(index, 0)}`,
    index: normalizeNumber(index, 0),
    timeSignature: normalizeString(timeSignature),
    sectionId: normalizeString(sectionId),
    sectionLabel: normalizeString(sectionLabel),
    symbols: normalizedSymbols,
    beatSlots: normalizedBeatSlots,
    metadata: deepClone(normalizeObject(metadata)) || {}
  };
}

export function createPracticePlaybackBarsFromChartEntries(entries = []) {
  return (entries || []).map((entry, entryIndex) => {
    const symbols = (entry?.playbackSlots || [])
      .map(normalizeSlotSymbol)
      .filter(Boolean);
    const beatSlots = resolveBeatSlotsFromCellSlots(entry?.playbackCellSlots || []);
    const resolvedBeatSlots = beatSlots.length > 0
      ? beatSlots
      : resolveBeatSlotsFromPlaybackSlots(entry?.playbackSlots || []);

    return createPracticePlaybackBar({
      id: entry?.barId || `bar-${entryIndex + 1}`,
      index: Number(entry?.barIndex || entryIndex + 1),
      symbols,
      beatSlots: resolvedBeatSlots,
      timeSignature: entry?.timeSignature || '',
      sectionId: entry?.sectionId || '',
      sectionLabel: entry?.sectionLabel || '',
      metadata: {
        sourceEvent: entry?.sourceEvent || null,
        flags: Array.isArray(entry?.flags) ? [...entry.flags] : [],
        repeatedFromBar: entry?.repeatedFromBar || null
      }
    });
  }).filter((bar) => bar.symbols.length > 0 || bar.beatSlots.length > 0);
}

export function buildLegacyPatternStringFromPracticeBars(bars = []) {
  return (bars || [])
    .map((bar) => (bar?.symbols || []).filter(Boolean).join(' '))
    .filter(Boolean)
    .join(' | ');
}

export function buildLegacyEnginePatternStringFromPracticeBars(bars = [], key = 'C') {
  const engineBars = (bars || [])
    .map((bar) => (bar?.beatSlots || []).filter(Boolean).join(' '))
    .filter(Boolean);

  return engineBars.length > 0 ? `key: ${key} | ${engineBars.join(' | ')} |` : '';
}

export function createPracticeSessionSpec({
  id = '',
  source = 'custom',
  title = '',
  tempo = 120,
  timeSignature = '',
  playback = {},
  display = {},
  selection = null,
  origin = null
} = {}) {
  const bars = Array.isArray(playback?.bars) ? playback.bars.map(createPracticePlaybackBar) : [];
  const resolvedSource = normalizeString(source, 'custom') || 'custom';
  const resolvedTitle = normalizeString(title).trim() || 'Practice session';
  const resolvedId = normalizeString(id).trim() || `${slugify(resolvedSource)}-${slugify(resolvedTitle)}`;

  const patternString = buildLegacyPatternStringFromPracticeBars(bars);
  const enginePatternString = buildLegacyEnginePatternStringFromPracticeBars(bars);

  return {
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    id: resolvedId,
    source: resolvedSource,
    title: resolvedTitle,
    tempo: Number.isFinite(Number(tempo)) ? Number(tempo) : 120,
    timeSignature: normalizeString(timeSignature),
    playback: {
      bars,
      patternString,
      enginePatternString
    },
    display: deepClone(normalizeObject(display)) || {},
    selection: selection ? deepClone(selection) : null,
    origin: origin ? deepClone(origin) : null
  };
}

export function clonePracticeSessionSpec(session) {
  return deepClone(session);
}
