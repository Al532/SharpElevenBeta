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
const CHART_BACK_ORIGIN_STORAGE_KEY = 'sharp-eleven-chart-back-origin';

type ChartBackOrigin = 'home' | 'setlists';

function normalizeChartBackOrigin(value: unknown): ChartBackOrigin | '' {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'home' || normalized === 'setlists') return normalized;
  return '';
}

function readStoredChartBackOrigin(): ChartBackOrigin | '' {
  try {
    return normalizeChartBackOrigin(window.sessionStorage.getItem(CHART_BACK_ORIGIN_STORAGE_KEY));
  } catch {
    return '';
  }
}

function persistChartBackOrigin(origin: ChartBackOrigin): void {
  try {
    window.sessionStorage.setItem(CHART_BACK_ORIGIN_STORAGE_KEY, origin);
  } catch {
    // Ignore storage failures; the static home fallback still works.
  }
}

function getReferrerChartBackOrigin(referrer = document.referrer): ChartBackOrigin | '' {
  if (!referrer) return '';
  try {
    const referrerUrl = new URL(referrer);
    const currentUrl = new URL(window.location.href);
    if (referrerUrl.origin !== currentUrl.origin) return '';
    const path = referrerUrl.pathname.replace(/\/+$/, '');
    if (path.endsWith('/setlists.html')) return 'setlists';
    if (path.endsWith('/index.html') || path === currentUrl.pathname.replace(/\/chart\/index\.html$/, '')) return 'home';
  } catch {
    return '';
  }
  return '';
}

export function loadPersistedChartId() {
  const requestedChartId = getRequestedChartId();
  if (requestedChartId) return requestedChartId;

  return loadPersistedChartIdFromStorage({
    legacyStorageKey: LAST_CHART_STORAGE_KEY
  });
}

export function getRequestedChartId() {
  return new URLSearchParams(window.location.search).get('chart') || '';
}

export function getChartBackOrigin(): ChartBackOrigin {
  const requestedOrigin = normalizeChartBackOrigin(new URLSearchParams(window.location.search).get('from'));
  const origin = requestedOrigin || getReferrerChartBackOrigin() || readStoredChartBackOrigin() || 'home';
  persistChartBackOrigin(origin);
  return origin;
}

export function getChartBackHref() {
  return getChartBackOrigin() === 'setlists' ? '../setlists.html' : '../index.html';
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
