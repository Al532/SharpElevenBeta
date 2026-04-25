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
const DEFAULT_MASTER_VOLUME_PERCENT = 50;
const DEFAULT_CHANNEL_VOLUME_PERCENT = 100;
const EMPTY_PLAYLIST_NAME = 'playlist';

type ChartLibraryPayload = {
  source: string;
  documents: ChartDocument[];
};

function normalizeMixerVolume(value: unknown, fallbackValue: number): number {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return fallbackValue;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallbackValue;
  return Math.max(0, Math.min(100, parsed));
}

function getIndexedDbFactory(): IDBFactory | null {
  return typeof window !== 'undefined' && window.indexedDB ? window.indexedDB : null;
}

function toLowerPlaylistName(value: string): string {
  return value.toLowerCase();
}

function normalizePlaylistName(value: unknown): string {
  return String(value || '').trim() || EMPTY_PLAYLIST_NAME;
}

function waitForRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

function openChartLibraryDatabase(): Promise<IDBDatabase | null> {
  const indexedDbFactory = getIndexedDbFactory();
  if (!indexedDbFactory) return Promise.resolve(null);

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
): ChartLibraryPayload | null {
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

function collectExistingPlaylistNameLookup(documents: ChartDocument[]): Set<string> {
  const playlistNameLookup = new Set<string>();
  for (const document of documents) {
    playlistNameLookup.add(toLowerPlaylistName(
      normalizePlaylistName(document?.source?.playlistName)
    ));
  }
  return playlistNameLookup;
}

function resolveUniquePlaylistName(
  requestedName: string,
  usedPlaylistNameLookup: Set<string>,
  requestedPlaylistNameCache: Map<string, string>
): string {
  const requestedPlaylistName = normalizePlaylistName(requestedName);
  const memoized = requestedPlaylistNameCache.get(requestedPlaylistName);
  if (memoized) return memoized;

  if (!usedPlaylistNameLookup.has(toLowerPlaylistName(requestedPlaylistName))) {
    usedPlaylistNameLookup.add(toLowerPlaylistName(requestedPlaylistName));
    requestedPlaylistNameCache.set(requestedPlaylistName, requestedPlaylistName);
    return requestedPlaylistName;
  }

  let suffix = 2;
  let candidate = `${requestedPlaylistName} (${suffix})`;
  while (usedPlaylistNameLookup.has(toLowerPlaylistName(candidate))) {
    suffix += 1;
    candidate = `${requestedPlaylistName} (${suffix})`;
  }
  usedPlaylistNameLookup.add(toLowerPlaylistName(candidate));
  requestedPlaylistNameCache.set(requestedPlaylistName, candidate);
  return candidate;
}

function mergePersistedChartLibrary(
  existingLibrary: ChartLibraryPayload,
  importedLibrary: ChartLibraryPayload
): ChartLibraryPayload {
  const playlistNameLookup = collectExistingPlaylistNameLookup(existingLibrary.documents);
  const requestedPlaylistNameCache = new Map<string, string>();
  const existingDocumentIds = new Set<string>(
    existingLibrary.documents
      .map((document) => String(document?.metadata?.id || '').trim())
      .filter(Boolean)
  );

  const normalizedImportedDocuments = importedLibrary.documents.map((document) => {
    const requestedPlaylistName = resolveUniquePlaylistName(
      normalizePlaylistName(document?.source?.playlistName || importedLibrary.source),
      playlistNameLookup,
      requestedPlaylistNameCache
    );

    return {
      ...document,
      source: {
        ...(document.source || {}),
        playlistName: requestedPlaylistName
      }
    };
  });

  const dedupedImportedDocuments = normalizedImportedDocuments.filter((document) => {
    const documentId = String(document?.metadata?.id || '').trim();
    if (!documentId || existingDocumentIds.has(documentId)) return false;
    existingDocumentIds.add(documentId);
    return true;
  });

  return {
    source: importedLibrary.source,
    documents: [...existingLibrary.documents, ...dedupedImportedDocuments]
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
    // Ignore storage failures so charts still work in restricted contexts.
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
    masterVolume: normalizeMixerVolume(playbackSettings.masterVolume, DEFAULT_MASTER_VOLUME_PERCENT),
    bassVolume: normalizeMixerVolume(playbackSettings.bassVolume, DEFAULT_CHANNEL_VOLUME_PERCENT),
    stringsVolume: normalizeMixerVolume(playbackSettings.stringsVolume, DEFAULT_CHANNEL_VOLUME_PERCENT),
    drumsVolume: normalizeMixerVolume(playbackSettings.drumsVolume, DEFAULT_CHANNEL_VOLUME_PERCENT)
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
    // Ignore storage failures so charts still work in restricted contexts.
  }
}

export async function loadPersistedChartLibrary(): Promise<ChartLibraryPayload | null> {
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
  documents = [],
  mergeWithExisting = false
}: {
  source?: string;
  documents?: ChartDocument[];
  mergeWithExisting?: boolean;
}): Promise<ChartLibraryPayload | null> {
  const normalizedLibrary = normalizePersistedChartLibrary({
    source,
    documents
  });

  if (!normalizedLibrary) {
    await clearPersistedChartLibrary();
    return null;
  }

  let mergedLibrary = normalizedLibrary;
  try {
    if (mergeWithExisting) {
      const existingLibrary = await loadPersistedChartLibrary();
      if (existingLibrary?.documents?.length) {
        mergedLibrary = mergePersistedChartLibrary(
          existingLibrary,
          normalizedLibrary
        );
      }
    }
  } catch {
    // Continue with the incoming library if existing read fails.
  }

  try {
    const database = await openChartLibraryDatabase();
    if (!database) {
      saveChartUiSettings({
        importedChartLibrary: mergedLibrary,
        importedChartLibrarySource: mergedLibrary.source
      });
      return mergedLibrary;
    }
    try {
      const transaction = database.transaction(CHART_LIBRARY_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CHART_LIBRARY_STORE_NAME);
      await waitForRequest(store.put(mergedLibrary, IMPORTED_CHART_LIBRARY_KEY));
      saveChartUiSettings({
        importedChartLibrary: null,
        importedChartLibrarySource: mergedLibrary.source
      });
    } finally {
      database.close();
    }
  } catch {
    saveChartUiSettings({
      importedChartLibrary: mergedLibrary,
      importedChartLibrarySource: mergedLibrary.source
    });
  }

  return mergedLibrary;
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
