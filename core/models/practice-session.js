// @ts-check

/** @typedef {import('../types/contracts').PracticePlaybackBar} PracticePlaybackBar */
/** @typedef {import('../types/contracts').PracticeSessionSpec} PracticeSessionSpec */
/** @typedef {import('../types/contracts').ChartPlaybackEntry} ChartPlaybackEntry */

/**
 * @param {any} value
 * @returns {any}
 */
function deepClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/**
 * @param {any} value
 * @param {string} [fallback]
 * @returns {string}
 */
function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value : (value == null ? fallback : String(value));
}

/**
 * @param {any} value
 * @param {number} [fallback]
 * @returns {number}
 */
function normalizeNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

/**
 * @param {any} value
 * @returns {Record<string, any>}
 */
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

/**
 * @param {any} value
 * @returns {string}
 */
function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'session';
}

/**
 * @param {{ symbol?: string } | null | undefined} slot
 * @returns {string}
 */
function normalizeSlotSymbol(slot) {
  return String(slot?.symbol || '').trim();
}

/**
 * @param {string[]} [symbols]
 * @returns {string[]}
 */
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

/**
 * @param {Array<{ chord?: { symbol?: string } | null }>} [cellSlots]
 * @returns {string[]}
 */
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

/**
 * @param {Array<{ symbol?: string }>} [playbackSlots]
 * @returns {string[]}
 */
function resolveBeatSlotsFromPlaybackSlots(playbackSlots = []) {
  const symbols = (playbackSlots || [])
    .map(normalizeSlotSymbol)
    .filter(Boolean);

  return compressBeatSlotsToDrillBar(symbols);
}

/**
 * @param {{
 *   id?: string,
 *   index?: number,
 *   symbols?: string[],
 *   beatSlots?: string[],
 *   timeSignature?: string,
 *   sectionId?: string,
 *   sectionLabel?: string,
 *   metadata?: Record<string, any>
 * }} [options]
 * @returns {PracticePlaybackBar}
 */
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

/**
 * @param {ChartPlaybackEntry[]} [entries]
 * @returns {PracticePlaybackBar[]}
 */
export function createPracticePlaybackBarsFromChartEntries(entries = []) {
  return (entries || []).map((entry, entryIndex) => {
    const sourceEntry = /** @type {any} */ (entry);
    const symbols = (sourceEntry?.playbackSlots || [])
      .map(normalizeSlotSymbol)
      .filter(Boolean);
    const beatSlots = resolveBeatSlotsFromCellSlots(sourceEntry?.playbackCellSlots || []);
    const resolvedBeatSlots = beatSlots.length > 0
      ? beatSlots
      : resolveBeatSlotsFromPlaybackSlots(sourceEntry?.playbackSlots || []);

    return createPracticePlaybackBar({
      id: sourceEntry?.barId || `bar-${entryIndex + 1}`,
      index: Number(sourceEntry?.barIndex || entryIndex + 1),
      symbols,
      beatSlots: resolvedBeatSlots,
      timeSignature: sourceEntry?.timeSignature || '',
      sectionId: sourceEntry?.sectionId || '',
      sectionLabel: sourceEntry?.sectionLabel || '',
      metadata: {
        sourceEvent: sourceEntry?.sourceEvent || null,
        flags: Array.isArray(sourceEntry?.flags) ? [...sourceEntry.flags] : [],
        repeatedFromBar: sourceEntry?.repeatedFromBar || null
      }
    });
  }).filter((bar) => bar.symbols.length > 0 || bar.beatSlots.length > 0);
}

/**
 * @param {PracticePlaybackBar[]} [bars]
 * @returns {string}
 */
export function buildLegacyPatternStringFromPracticeBars(bars = []) {
  return (bars || [])
    .map((bar) => (bar?.symbols || []).filter(Boolean).join(' '))
    .filter(Boolean)
    .join(' | ');
}

/**
 * @param {PracticePlaybackBar[]} [bars]
 * @param {string} [key]
 * @returns {string}
 */
export function buildLegacyEnginePatternStringFromPracticeBars(bars = [], key = 'C') {
  const engineBars = (bars || [])
    .map((bar) => (bar?.beatSlots || []).filter(Boolean).join(' '))
    .filter(Boolean);

  return engineBars.length > 0 ? `key: ${key} | ${engineBars.join(' | ')} |` : '';
}

/**
 * @param {Record<string, any> & { playback?: { bars?: PracticePlaybackBar[] } }} [options]
 * @returns {PracticeSessionSpec}
 */
export function createPracticeSessionSpec({
  id = '',
  source = 'custom',
  title = '',
  tempo = 120,
  timeSignature = '',
  playback = /** @type {{ bars?: PracticePlaybackBar[] }} */ ({}),
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

/**
 * @param {PracticeSessionSpec | null | undefined} session
 * @returns {PracticeSessionSpec | null | undefined}
 */
export function clonePracticeSessionSpec(session) {
  return deepClone(session);
}
