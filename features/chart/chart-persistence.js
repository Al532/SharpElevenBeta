// @ts-check

/** @typedef {import('../../core/types/contracts').ChartDocument} ChartDocument */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */

import {
  loadChartUiSettings,
  loadSharedPlaybackSettings,
  saveChartUiSettings,
  saveSharedPlaybackSettings
} from '../../core/storage/app-state-storage.js';

const CHART_LIBRARY_DB_NAME = 'jpt-chart-library-v1';
const CHART_LIBRARY_STORE_NAME = 'libraries';
const IMPORTED_CHART_LIBRARY_KEY = 'imported-chart-library';

/**
 * @returns {IDBFactory | null}
 */
function getIndexedDbFactory() {
  return typeof window !== 'undefined' && window.indexedDB ? window.indexedDB : null;
}

/**
 * @template T
 * @param {IDBRequest<T>} request
 * @returns {Promise<T>}
 */
function waitForRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

/**
 * @returns {Promise<IDBDatabase | null>}
 */
async function openChartLibraryDatabase() {
  const indexedDbFactory = getIndexedDbFactory();
  if (!indexedDbFactory) return null;

  return new Promise((resolve, reject) => {
    const request = indexedDbFactory.open(CHART_LIBRARY_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CHART_LIBRARY_STORE_NAME)) {
        database.createObjectStore(CHART_LIBRARY_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open chart library database.'));
  });
}

/**
 * @param {unknown} value
 * @returns {{ source: string, documents: ChartDocument[] } | null}
 */
function normalizePersistedChartLibrary(value) {
  if (!value || typeof value !== 'object') return null;

  const source = typeof value.source === 'string' && value.source.trim()
    ? value.source.trim()
    : 'imported library';
  const documents = Array.isArray(value.documents) ? value.documents : [];
  if (documents.length === 0) return null;

  return {
    source,
    documents
  };
}

/**
 * @param {{ legacyStorageKey?: string }} [options]
 * @returns {string}
 */
export function loadPersistedChartId({ legacyStorageKey = '' } = {}) {
  const chartUiSettings = loadChartUiSettings();
  if (chartUiSettings?.lastChartId) {
    return String(chartUiSettings.lastChartId);
  }
  if (!legacyStorageKey) return '';
  try {
    return window.localStorage.getItem(legacyStorageKey) || '';
  } catch {
    return '';
  }
}

/**
 * @param {string} chartId
 * @param {{ legacyStorageKey?: string }} [options]
 * @returns {void}
 */
export function persistChartId(chartId, { legacyStorageKey = '' } = {}) {
  saveChartUiSettings({ lastChartId: chartId || '' });
  if (!legacyStorageKey) return;
  try {
    if (!chartId) {
      window.localStorage.removeItem(legacyStorageKey);
      return;
    }
    window.localStorage.setItem(legacyStorageKey, chartId);
  } catch {
    // Ignore storage failures so chart-dev still works in restricted contexts.
  }
}

/**
 * @param {{ legacyStorageKey?: string }} [options]
 * @returns {PlaybackSettings & Record<string, unknown>}
 */
export function loadPersistedPlaybackSettings({ legacyStorageKey = '' } = {}) {
  const sharedPlaybackSettings = loadSharedPlaybackSettings({
    legacyChartStorageKey: legacyStorageKey
  });
  const chartUiSettings = loadChartUiSettings();

  return {
    ...(sharedPlaybackSettings || {}),
    ...((chartUiSettings?.chartPlaybackSettings && typeof chartUiSettings.chartPlaybackSettings === 'object')
      ? chartUiSettings.chartPlaybackSettings
      : {})
  };
}

/**
 * @param {{
 *   playbackSettings?: PlaybackSettings,
 *   harmonyDisplayMode?: string,
 *   useMajorTriangleSymbol?: boolean,
 *   useHalfDiminishedSymbol?: boolean,
 *   useDiminishedSymbol?: boolean,
 *   legacyStorageKey?: string
 * }} [options]
 * @returns {void}
 */
export function persistPlaybackSettings({
  playbackSettings = {},
  harmonyDisplayMode = 'default',
  useMajorTriangleSymbol = true,
  useHalfDiminishedSymbol = true,
  useDiminishedSymbol = true,
  legacyStorageKey = ''
} = {}) {
  const nextSettings = {
    compingStyle: playbackSettings.compingStyle || 'strings',
    drumsMode: playbackSettings.drumsMode || 'full_swing',
    customMediumSwingBass: playbackSettings.customMediumSwingBass !== false
  };

  saveSharedPlaybackSettings({
    ...nextSettings,
    masterVolume: Number(playbackSettings.masterVolume || 100),
    bassVolume: Number(playbackSettings.bassVolume || 100),
    stringsVolume: Number(playbackSettings.stringsVolume || 100),
    drumsVolume: Number(playbackSettings.drumsVolume || 100)
  });
  saveChartUiSettings({
    chartPlaybackSettings: {
      ...nextSettings,
      harmonyDisplayMode,
      useMajorTriangleSymbol,
      useHalfDiminishedSymbol,
      useDiminishedSymbol
    }
  });

  if (!legacyStorageKey) return;
  try {
    window.localStorage.setItem(legacyStorageKey, JSON.stringify({
      ...nextSettings,
      harmonyDisplayMode,
      useMajorTriangleSymbol,
      useHalfDiminishedSymbol,
      useDiminishedSymbol
    }));
  } catch {
    // Ignore storage failures so chart-dev still works in restricted contexts.
  }
}

/** @returns {Promise<{ source: string, documents: ChartDocument[] } | null>} */
export async function loadPersistedChartLibrary() {
  try {
    const database = await openChartLibraryDatabase();
    if (database) {
      try {
        const transaction = database.transaction(CHART_LIBRARY_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CHART_LIBRARY_STORE_NAME);
        const persistedValue = await waitForRequest(store.get(IMPORTED_CHART_LIBRARY_KEY));
        return normalizePersistedChartLibrary(persistedValue);
      } finally {
        database.close();
      }
    }
  } catch {
    // Fall back to localStorage-backed app state below.
  }

  const chartUiSettings = loadChartUiSettings();
  return normalizePersistedChartLibrary(chartUiSettings?.importedChartLibrary);
}

/**
 * @param {{ source?: string, documents?: ChartDocument[] }} [options]
 * @returns {Promise<void>}
 */
export async function persistChartLibrary({ source = 'imported library', documents = [] } = {}) {
  const normalizedLibrary = normalizePersistedChartLibrary({
    source,
    documents
  });

  if (!normalizedLibrary) {
    await clearPersistedChartLibrary();
    return;
  }

  try {
    const database = await openChartLibraryDatabase();
    if (!database) {
      saveChartUiSettings({
        importedChartLibrary: normalizedLibrary,
        importedChartLibrarySource: normalizedLibrary.source
      });
      return;
    }
    try {
      const transaction = database.transaction(CHART_LIBRARY_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CHART_LIBRARY_STORE_NAME);
      await waitForRequest(store.put(normalizedLibrary, IMPORTED_CHART_LIBRARY_KEY));
      saveChartUiSettings({
        importedChartLibrary: null,
        importedChartLibrarySource: normalizedLibrary.source
      });
    } finally {
      database.close();
    }
  } catch {
    saveChartUiSettings({
      importedChartLibrary: normalizedLibrary,
      importedChartLibrarySource: normalizedLibrary.source
    });
  }
}

/** @returns {Promise<void>} */
export async function clearPersistedChartLibrary() {
  saveChartUiSettings({
    importedChartLibrary: null,
    importedChartLibrarySource: ''
  });

  try {
    const database = await openChartLibraryDatabase();
    if (!database) return;
    try {
      const transaction = database.transaction(CHART_LIBRARY_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CHART_LIBRARY_STORE_NAME);
      await waitForRequest(store.delete(IMPORTED_CHART_LIBRARY_KEY));
    } finally {
      database.close();
    }
  } catch {
    // Ignore storage failures so the UI can still clear the in-memory library.
  }
}
