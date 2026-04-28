import type {
  ChartPlaybackEntry,
  PracticePlaybackBar,
  PracticeSessionSpec
} from '../types/contracts';

import { distributeChordsToMeterBeatSlots, parseQuarterTimeSignature } from '../music/meter.js';

function deepClone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : (value == null ? fallback : String(value));
}

function normalizeNumber(value: unknown, fallback = 0): number {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function normalizeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
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

function slugify(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'session';
}

function normalizeSlotSymbol(slot: {
  symbol?: string;
  root?: string;
  quality?: string;
  modifier?: string;
  bass?: string | null;
  displayPrefix?: string;
  display_prefix?: string;
} | null | undefined): string {
  const root = String(slot?.root || '').trim();
  if (['p', 'n', 'r', 'x', 'W'].includes(root)) return '';

  const quality = String(slot?.quality ?? slot?.modifier ?? '').trim();
  const bass = String(slot?.bass || '').trim();
  if (root && bass) {
    return `${root}${quality}/${bass}`;
  }

  let symbol = String(slot?.symbol || '').trim();
  const displayPrefix = String(slot?.displayPrefix || slot?.display_prefix || '').trim();
  if (displayPrefix && symbol.startsWith(displayPrefix)) {
    symbol = symbol.slice(displayPrefix.length).trim();
  }
  if (['p', 'n', 'r', 'x', 'W'].includes(symbol)) return '';
  return symbol;
}

function compressBeatSlotsToDrillBar(symbols: string[] = [], timeSignature = '4/4'): string[] {
  const normalized = (symbols || []).filter(Boolean);
  const meter = parseQuarterTimeSignature(timeSignature);
  if (normalized.length === 0) return [];
  if (normalized.length === meter.numerator) return normalized;

  return Array.from({ length: meter.numerator }, (_, beatIndex) => {
    const sourceIndex = Math.min(
      normalized.length - 1,
      Math.floor((beatIndex * normalized.length) / meter.numerator)
    );
    return normalized[sourceIndex];
  });
}

function resolveBeatSlotsFromCellSlots(
  cellSlots: Array<{
    chord?: {
      symbol?: string;
      root?: string;
      quality?: string;
      modifier?: string;
      bass?: string | null;
      displayPrefix?: string;
      display_prefix?: string;
    } | null;
  }> = [],
  timeSignature = '4/4'
): string[] {
  if (!Array.isArray(cellSlots) || cellSlots.length === 0) return [];

  const resolved: string[] = [];
  let activeChord: string | null = null;

  for (const cellSlot of cellSlots) {
    const cellChord = cellSlot?.chord ? normalizeSlotSymbol(cellSlot.chord) : '';
    if (cellChord) {
      activeChord = cellChord;
    }
    if (activeChord) {
      resolved.push(activeChord);
    }
  }

  return compressBeatSlotsToDrillBar(resolved, timeSignature);
}

function resolveBeatSlotsFromPlaybackSlots(
  playbackSlots: Array<{ symbol?: string }> = [],
  timeSignature = '4/4'
): string[] {
  const symbols = (playbackSlots || [])
    .map(normalizeSlotSymbol)
    .filter(Boolean);

  return distributeChordsToMeterBeatSlots(symbols, timeSignature).beatSlots;
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
}: {
  id?: string;
  index?: number;
  symbols?: string[];
  beatSlots?: string[];
  timeSignature?: string;
  sectionId?: string;
  sectionLabel?: string;
  metadata?: Record<string, unknown>;
} = {}): PracticePlaybackBar {
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

export function createPracticePlaybackBarsFromChartEntries(
  entries: ChartPlaybackEntry[] = [],
  defaultTimeSignature = '4/4'
): PracticePlaybackBar[] {
  let activeTimeSignature = parseQuarterTimeSignature(defaultTimeSignature).timeSignature;
  return (entries || []).map((entry, entryIndex) => {
    const sourceEntry = entry as ChartPlaybackEntry & {
      sourceEvent?: string | null;
      repeatedFromBar?: number | null;
    };
    const symbols = (sourceEntry?.playbackSlots || [])
      .map(normalizeSlotSymbol)
      .filter(Boolean);
    const timeSignature = parseQuarterTimeSignature(sourceEntry?.timeSignature || activeTimeSignature).timeSignature;
    activeTimeSignature = timeSignature;
    const beatSlots = resolveBeatSlotsFromCellSlots(sourceEntry?.playbackCellSlots || [], timeSignature);
    const resolvedBeatSlots = beatSlots.length > 0
      ? beatSlots
      : resolveBeatSlotsFromPlaybackSlots(sourceEntry?.playbackSlots || [], timeSignature);

    return createPracticePlaybackBar({
      id: sourceEntry?.barId || `bar-${entryIndex + 1}`,
      index: Number(sourceEntry?.barIndex || entryIndex + 1),
      symbols,
      beatSlots: resolvedBeatSlots,
      timeSignature,
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

export function buildLegacyPatternStringFromPracticeBars(bars: PracticePlaybackBar[] = []): string {
  return (bars || [])
    .map((bar) => (bar?.symbols || []).filter(Boolean).join(' '))
    .filter(Boolean)
    .join(' | ');
}

export function buildLegacyEnginePatternStringFromPracticeBars(
  bars: PracticePlaybackBar[] = [],
  key = 'C'
): string {
  let activeTimeSignature = '4/4';
  const engineBars = (bars || [])
    .map((bar) => {
      const body = (bar?.beatSlots || []).filter(Boolean).join(' ');
      if (!body) return '';
      const barTimeSignature = parseQuarterTimeSignature(bar?.timeSignature || activeTimeSignature).timeSignature;
      const timePrefix = barTimeSignature !== activeTimeSignature ? `@${barTimeSignature} ` : '';
      activeTimeSignature = barTimeSignature;
      return `${timePrefix}${body}`;
    })
    .filter(Boolean);

  return engineBars.length > 0 ? `key: ${key} | ${engineBars.join(' | ')} |` : '';
}

type PracticeSessionSpecInput = Omit<Partial<PracticeSessionSpec>, 'playback'> & {
  playback?: { bars?: PracticePlaybackBar[] };
};

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
}: PracticeSessionSpecInput = {}): PracticeSessionSpec {
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

export function clonePracticeSessionSpec(
  session: PracticeSessionSpec | null | undefined
): PracticeSessionSpec | null | undefined {
  return deepClone(session);
}
