import type { ChartDocument, PlaybackSettings } from '../../core/types/contracts';

import {
  loadChartUiSettings,
  loadSharedPlaybackSettings,
  saveChartUiSettings,
  saveSharedPlaybackSettings
} from '../../core/storage/app-state-storage.js';

const CHART_LIBRARY_DB_NAME = 'jpt-chart-library-v1';
const CHART_LIBRARY_STORE_NAME = 'libraries';
const IMPORTED_CHART_LIBRARY_KEY = 'imported-chart-library';

function getIndexedDbFactory(): IDBFactory | null {
  return typeof window !== 'undefined' && window.indexedDB ? window.indexedDB : null;
}

function waitForRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

async function openChartLibraryDatabase(): Promise<IDBDatabase | null> {
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

function normalizePersistedChartLibrary(
  value: unknown
): { source: string; documents: ChartDocument[] } | null {
  if (!value || typeof value !== 'object') return null;

  const sourceValue = (value as { source?: unknown }).source;
  const source = typeof sourceValue === 'string' && sourceValue.trim()
    ? sourceValue.trim()
    : 'imported library';
  const documentsValue = (value as { documents?: unknown }).documents;
  const documents = Array.isArray(documentsValue)
    ? documentsValue as ChartDocument[]
    : [];
  if (documents.length === 0) return null;

  return {
    source,
    documents
  };
}

export function loadPersistedChartId({
  legacyStorageKey = ''
}: {
  legacyStorageKey?: string;
} = {}): string {
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

export function loadRecentChartIds(): string[] {
  const chartUiSettings = loadChartUiSettings();
  const recentChartIds = chartUiSettings?.recentChartIds;
  if (!Array.isArray(recentChartIds)) return [];

  return recentChartIds
    .map((chartId) => String(chartId || '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function persistChartId(
  chartId: string,
  { legacyStorageKey = '' }: { legacyStorageKey?: string } = {}
): void {
  const normalizedChartId = String(chartId || '').trim();
  const nextRecentChartIds = normalizedChartId
    ? [
        normalizedChartId,
        ...loadRecentChartIds().filter((recentChartId) => recentChartId !== normalizedChartId)
      ].slice(0, 3)
    : loadRecentChartIds();

  saveChartUiSettings({
    lastChartId: normalizedChartId,
    recentChartIds: nextRecentChartIds
  });
  if (!legacyStorageKey) return;
  try {
    if (!normalizedChartId) {
      window.localStorage.removeItem(legacyStorageKey);
      return;
    }
    window.localStorage.setItem(legacyStorageKey, normalizedChartId);
  } catch {
    // Ignore storage failures so chart-dev still works in restricted contexts.
  }
}

export function loadPersistedPlaybackSettings({
  legacyStorageKey = ''
}: {
  legacyStorageKey?: string;
} = {}): PlaybackSettings & Record<string, unknown> {
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

export function persistPlaybackSettings({
  playbackSettings = {},
  harmonyDisplayMode = 'default',
  useMajorTriangleSymbol = true,
  useHalfDiminishedSymbol = true,
  useDiminishedSymbol = true,
  legacyStorageKey = ''
}: {
  playbackSettings?: PlaybackSettings;
  harmonyDisplayMode?: string;
  useMajorTriangleSymbol?: boolean;
  useHalfDiminishedSymbol?: boolean;
  useDiminishedSymbol?: boolean;
  legacyStorageKey?: string;
} = {}): void {
  const nextSettings = {
    compingStyle: playbackSettings.compingStyle || 'piano',
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

export async function loadPersistedChartLibrary(): Promise<{ source: string; documents: ChartDocument[] } | null> {
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

export async function persistChartLibrary({
  source = 'imported library',
  documents = []
}: {
  source?: string;
  documents?: ChartDocument[];
} = {}): Promise<void> {
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

export async function clearPersistedChartLibrary(): Promise<void> {
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
