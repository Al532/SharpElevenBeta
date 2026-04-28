import type { ChartDocument, PlaybackSettings } from '../../core/types/contracts.js';
import {
  loadPersistedChartId as loadPersistedChartIdFromStorage,
  loadPersistedPlaybackSettings as loadPersistedChartPlaybackSettings,
  persistPlaybackSettings as persistChartPlaybackSettings,
  persistChartId as persistChartIdToStorage
} from './chart-persistence.js';

const LAST_CHART_STORAGE_KEY = 'sharp-eleven-chart-last-chart-id';
const PLAYBACK_SETTINGS_STORAGE_KEY = 'sharp-eleven-chart-playback-settings';
const INSTRUMENT_TRANSPOSITION_STORAGE_KEY = 'sharp-eleven-chart-instrument-transposition';

export function loadPersistedChartId() {
  const requestedChartId = new URLSearchParams(window.location.search).get('chart');
  if (requestedChartId) return requestedChartId;

  return loadPersistedChartIdFromStorage({
    legacyStorageKey: LAST_CHART_STORAGE_KEY
  });
}

export function getRequestedPlaylist() {
  return new URLSearchParams(window.location.search).get('playlist') || '';
}

export function getRequestedSetlistId() {
  return new URLSearchParams(window.location.search).get('setlist') || '';
}

export function persistChartId(chartId: string, chartDocument: ChartDocument | null | undefined) {
  persistChartIdToStorage(chartId, {
    legacyStorageKey: LAST_CHART_STORAGE_KEY,
    chartDocument
  });
}

export function loadPersistedPlaybackSettings() {
  return loadPersistedChartPlaybackSettings({
    legacyStorageKey: PLAYBACK_SETTINGS_STORAGE_KEY
  });
}

export function persistPlaybackSettings({
  playbackSettings = {},
  harmonyDisplayMode = 'default',
  useMajorTriangleSymbol = true,
  useHalfDiminishedSymbol = true,
  useDiminishedSymbol = true
}: {
  playbackSettings?: PlaybackSettings;
  harmonyDisplayMode?: string;
  useMajorTriangleSymbol?: boolean;
  useHalfDiminishedSymbol?: boolean;
  useDiminishedSymbol?: boolean;
} = {}) {
  persistChartPlaybackSettings({
    playbackSettings,
    harmonyDisplayMode,
    useMajorTriangleSymbol,
    useHalfDiminishedSymbol,
    useDiminishedSymbol,
    legacyStorageKey: PLAYBACK_SETTINGS_STORAGE_KEY
  });
}

export function loadPersistedInstrumentTransposition() {
  try {
    return window.localStorage.getItem(INSTRUMENT_TRANSPOSITION_STORAGE_KEY) || '0';
  } catch {
    return '0';
  }
}

export function persistInstrumentTransposition(value: string | number | null | undefined) {
  try {
    window.localStorage.setItem(INSTRUMENT_TRANSPOSITION_STORAGE_KEY, String(value || '0'));
  } catch {
    // Ignore storage failures so the chart remains usable in restricted contexts.
  }
}
