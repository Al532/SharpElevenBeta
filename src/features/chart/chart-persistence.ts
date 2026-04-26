import type { ChartDocument, PlaybackSettings } from '../../core/types/contracts';

import {
  loadChartUiSettings,
  loadSharedPlaybackSettings,
  saveChartUiSettings,
  saveSharedPlaybackSettings
} from '../../core/storage/app-state-storage.js';

const CHART_LIBRARY_DB_NAME = 'jpt-chart-library-v1';
const CHART_LIBRARY_STORE_NAME = 'libraries';
const CHART_DOCUMENT_STORE_NAME = 'documents';
const IMPORTED_CHART_LIBRARY_KEY = 'imported-chart-library';
const DEFAULT_MASTER_VOLUME_PERCENT = 50;
const DEFAULT_CHANNEL_VOLUME_PERCENT = 100;
const EMPTY_PLAYLIST_NAME = 'playlist';

type ChartLibraryPayload = {
  source: string;
  documents: ChartDocument[];
};

export type HomeChartSummary = {
  recentCharts: Array<{
    id: string;
    title: string;
  }>;
  playlists: Array<{
    name: string;
    count: number;
  }>;
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

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
  });
}

function openChartLibraryDatabase(): Promise<IDBDatabase | null> {
  const indexedDbFactory = getIndexedDbFactory();
  if (!indexedDbFactory) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = indexedDbFactory.open(CHART_LIBRARY_DB_NAME, 2);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CHART_LIBRARY_STORE_NAME)) {
        database.createObjectStore(CHART_LIBRARY_STORE_NAME);
      }
      if (!database.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)) {
        database.createObjectStore(CHART_DOCUMENT_STORE_NAME);
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

function normalizePersistedChartDocument(value: unknown): ChartDocument | null {
  if (!value || typeof value !== 'object') return null;
  const document = value as ChartDocument;
  if (!document.metadata?.id || !Array.isArray(document.bars) || document.bars.length === 0) return null;
  return document;
}

function normalizePersistedChartDocuments(value: unknown): ChartDocument[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizePersistedChartDocument)
    .filter((document): document is ChartDocument => Boolean(document));
}

function normalizeHomeChartSummary(value: unknown): HomeChartSummary | null {
  if (!value || typeof value !== 'object') return null;
  const recentChartsValue = (value as { recentCharts?: unknown }).recentCharts;
  const playlistsValue = (value as { playlists?: unknown }).playlists;

  const recentCharts = Array.isArray(recentChartsValue)
    ? recentChartsValue
        .map((chart) => {
          if (!chart || typeof chart !== 'object') return null;
          const id = String((chart as { id?: unknown }).id || '').trim();
          const title = String((chart as { title?: unknown }).title || '').trim();
          if (!id) return null;
          return {
            id,
            title: title || 'Untitled chart'
          };
        })
        .filter((chart): chart is HomeChartSummary['recentCharts'][number] => Boolean(chart))
        .slice(0, 3)
    : [];

  const playlists = Array.isArray(playlistsValue)
    ? playlistsValue
        .map((playlist) => {
          if (!playlist || typeof playlist !== 'object') return null;
          const name = String((playlist as { name?: unknown }).name || '').trim();
          const count = Number((playlist as { count?: unknown }).count || 0);
          if (!name || !Number.isFinite(count) || count <= 0) return null;
          return {
            name,
            count
          };
        })
        .filter((playlist): playlist is HomeChartSummary['playlists'][number] => Boolean(playlist))
    : [];

  if (recentCharts.length === 0 && playlists.length === 0) return null;
  return {
    recentCharts,
    playlists
  };
}

function createHomeChartSummary(library: ChartLibraryPayload | null): HomeChartSummary | null {
  const documents = library?.documents || [];
  if (documents.length === 0) return null;

  const documentsById = new Map(
    documents.map((document) => [String(document.metadata?.id || ''), document])
  );
  const recentCharts = loadRecentChartIds()
    .map((chartId) => documentsById.get(chartId))
    .filter((document): document is ChartDocument => Boolean(document))
    .map((document) => ({
      id: String(document.metadata.id || ''),
      title: String(document.metadata.title || '').trim() || 'Untitled chart'
    }));

  const playlistCounts = new Map<string, number>();
  for (const document of documents) {
    const playlistName = String(document.source?.playlistName || library?.source || '').trim();
    if (!playlistName) continue;
    playlistCounts.set(playlistName, (playlistCounts.get(playlistName) || 0) + 1);
  }

  const playlists = [...playlistCounts.entries()]
    .sort(([leftName], [rightName]) => leftName.localeCompare(rightName, 'en', { sensitivity: 'base' }))
    .map(([name, count]) => ({
      name,
      count
    }));

  if (recentCharts.length === 0 && playlists.length === 0) return null;
  return {
    recentCharts,
    playlists
  };
}

function saveHomeChartSummary(summary: HomeChartSummary | null): void {
  saveChartUiSettings({
    homeChartSummary: summary
  });
}

export function loadPersistedHomeChartSummary(): HomeChartSummary | null {
  const chartUiSettings = loadChartUiSettings();
  return normalizeHomeChartSummary(chartUiSettings?.homeChartSummary);
}

export function saveHomeChartSummaryFromLibrary(library: ChartLibraryPayload | null): void {
  saveHomeChartSummary(createHomeChartSummary(library));
}

function updateHomeChartSummaryRecentChart(chartDocument: ChartDocument | null | undefined): void {
  if (!chartDocument?.metadata?.id) return;
  const previousSummary = loadPersistedHomeChartSummary();
  if (!previousSummary) return;

  const id = String(chartDocument.metadata.id || '').trim();
  const title = String(chartDocument.metadata.title || '').trim() || 'Untitled chart';
  const recentCharts = [
    { id, title },
    ...previousSummary.recentCharts.filter((chart) => chart.id !== id)
  ].slice(0, 3);

  saveHomeChartSummary({
    ...previousSummary,
    recentCharts
  });
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
  if (chartUiSettings && Object.prototype.hasOwnProperty.call(chartUiSettings, 'lastChartId')) {
    return String(chartUiSettings.lastChartId || '');
  }
  if (!legacyStorageKey) return '';
  try {
    return window.localStorage.getItem(legacyStorageKey) || '';
  } catch {
    return '';
  }
}

export function loadPersistedChartDocument(chartId = ''): ChartDocument | null {
  const chartUiSettings = loadChartUiSettings();
  const requestedChartId = String(chartId || '').trim();
  const recentChartDocuments = normalizePersistedChartDocuments(chartUiSettings?.recentChartDocuments);
  if (requestedChartId) {
    const lastChartDocument = normalizePersistedChartDocument(chartUiSettings?.lastChartDocument);
    if (lastChartDocument?.metadata.id === requestedChartId) return lastChartDocument;
    return recentChartDocuments.find((document) => document.metadata.id === requestedChartId) || null;
  }
  return normalizePersistedChartDocument(chartUiSettings?.lastChartDocument)
    || recentChartDocuments[0]
    || null;
}

export async function loadPersistedChartDocumentById(chartId = ''): Promise<ChartDocument | null> {
  const requestedChartId = String(chartId || '').trim();
  if (!requestedChartId) return loadPersistedChartDocument();

  try {
    const database = await openChartLibraryDatabase();
    if (database?.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)) {
      try {
        const transaction = database.transaction(CHART_DOCUMENT_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CHART_DOCUMENT_STORE_NAME);
        const persistedDocument = await waitForRequest(store.get(requestedChartId));
        return normalizePersistedChartDocument(persistedDocument);
      } finally {
        database.close();
      }
    }
  } catch {
    // Fall back to localStorage-backed recent document snapshots below.
  }

  return loadPersistedChartDocument(requestedChartId);
}

export async function hasPersistedChartDocumentIndex(): Promise<boolean> {
  try {
    const database = await openChartLibraryDatabase();
    if (!database?.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)) return false;
    try {
      const transaction = database.transaction(CHART_DOCUMENT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CHART_DOCUMENT_STORE_NAME);
      const count = await waitForRequest(store.count());
      return count > 0;
    } finally {
      database.close();
    }
  } catch {
    return false;
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
  { legacyStorageKey = '', chartDocument = null }: { legacyStorageKey?: string; chartDocument?: ChartDocument | null } = {}
): void {
  const chartUiSettings = loadChartUiSettings();
  const normalizedChartId = String(chartId || '').trim();
  const nextRecentChartIds = normalizedChartId
    ? [
        normalizedChartId,
        ...loadRecentChartIds().filter((recentChartId) => recentChartId !== normalizedChartId)
      ].slice(0, 3)
    : loadRecentChartIds();
  const recentChartDocumentsById = new Map(
    normalizePersistedChartDocuments(chartUiSettings?.recentChartDocuments)
      .map((document) => [document.metadata.id, document])
  );
  if (normalizedChartId && chartDocument) {
    recentChartDocumentsById.set(normalizedChartId, chartDocument);
  }
  const nextRecentChartDocuments = nextRecentChartIds
    .map((recentChartId) => recentChartDocumentsById.get(recentChartId))
    .filter((document): document is ChartDocument => Boolean(document));

  saveChartUiSettings({
    lastChartId: normalizedChartId,
    recentChartIds: nextRecentChartIds,
    recentChartDocuments: nextRecentChartDocuments,
    ...(chartDocument ? { lastChartDocument: chartDocument } : {}),
    ...(!normalizedChartId ? { lastChartDocument: null, recentChartDocuments: [] } : {})
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
  updateHomeChartSummaryRecentChart(chartDocument);
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
        importedChartLibrarySource: mergedLibrary.source,
        homeChartSummary: createHomeChartSummary(mergedLibrary)
      });
      return mergedLibrary;
    }
    try {
      const storeNames = database.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)
        ? [CHART_LIBRARY_STORE_NAME, CHART_DOCUMENT_STORE_NAME]
        : [CHART_LIBRARY_STORE_NAME];
      const transaction = database.transaction(storeNames, 'readwrite');
      const transactionDone = waitForTransaction(transaction);
      const store = transaction.objectStore(CHART_LIBRARY_STORE_NAME);
      await waitForRequest(store.put(mergedLibrary, IMPORTED_CHART_LIBRARY_KEY));
      if (database.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)) {
        const documentStore = transaction.objectStore(CHART_DOCUMENT_STORE_NAME);
        await waitForRequest(documentStore.clear());
        for (const document of mergedLibrary.documents) {
          const documentId = String(document?.metadata?.id || '').trim();
          if (!documentId) continue;
          await waitForRequest(documentStore.put(document, documentId));
        }
      }
      await transactionDone;
      saveChartUiSettings({
        importedChartLibrary: null,
        importedChartLibrarySource: mergedLibrary.source,
        homeChartSummary: createHomeChartSummary(mergedLibrary)
      });
    } finally {
      database.close();
    }
  } catch {
    saveChartUiSettings({
      importedChartLibrary: mergedLibrary,
      importedChartLibrarySource: mergedLibrary.source,
      homeChartSummary: createHomeChartSummary(mergedLibrary)
    });
  }

  return mergedLibrary;
}

export async function clearPersistedChartLibrary(): Promise<void> {
  saveChartUiSettings({
    importedChartLibrary: null,
    importedChartLibrarySource: '',
    homeChartSummary: null,
    lastChartId: '',
    recentChartIds: []
  });

  try {
    const database = await openChartLibraryDatabase();
    if (!database) return;
    try {
      const storeNames = database.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)
        ? [CHART_LIBRARY_STORE_NAME, CHART_DOCUMENT_STORE_NAME]
        : [CHART_LIBRARY_STORE_NAME];
      const transaction = database.transaction(storeNames, 'readwrite');
      const transactionDone = waitForTransaction(transaction);
      const store = transaction.objectStore(CHART_LIBRARY_STORE_NAME);
      await waitForRequest(store.delete(IMPORTED_CHART_LIBRARY_KEY));
      if (database.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)) {
        await waitForRequest(transaction.objectStore(CHART_DOCUMENT_STORE_NAME).clear());
      }
      await transactionDone;
    } finally {
      database.close();
    }
  } catch {
    // Ignore storage failures so the UI can still clear the in-memory library.
  }
}
