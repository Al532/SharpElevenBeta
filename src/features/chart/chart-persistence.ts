import type { ChartDocument, ChartSetlist, ChartUserSettings, PlaybackSettings } from '../../core/types/contracts';

import {
  loadChartUiSettings,
  loadSharedPlaybackSettings,
  saveChartUiSettings,
  saveSharedPlaybackSettings
} from '../../core/storage/app-state-storage.js';
import {
  CHART_CONTENT_HASH_VERSION,
  getChartSourceRefs,
  mergeChartSourceRefs,
  normalizeChartLibraryDocument
} from './chart-library.js';
import { resetTransientChartPerformanceCueState } from '../../../chart/chart-performance.js';

const CHART_LIBRARY_DB_NAME = 'jpt-chart-library-v1';
const CHART_LIBRARY_STORE_NAME = 'libraries';
const CHART_DOCUMENT_STORE_NAME = 'documents';
const CHART_SETLIST_STORE_NAME = 'setlists';
const CHART_USER_SETTINGS_STORE_NAME = 'chartUserSettings';
const IMPORTED_CHART_LIBRARY_KEY = 'imported-chart-library';
const CHART_SETLISTS_KEY = 'chart-setlists';
const DEFAULT_MASTER_VOLUME_PERCENT = 50;
const DEFAULT_CHANNEL_VOLUME_PERCENT = 100;
const EMPTY_PLAYLIST_NAME = 'playlist';
const RECENT_CHART_STORAGE_LIMIT = 10;
const TEMPORARY_CHART_TEST_SOURCE_NAMES = new Set([
  'iReal behavior tests',
  'Playback ending tests',
  'Performance cue demos'
]);

type ChartLibraryPayload = {
  source: string;
  documents: ChartDocument[];
  lastImportSummary?: ChartImportSummary;
};

type LoadPersistedChartLibraryOptions = {
  includeIRealBehaviorTestCharts?: boolean;
};

type ChartTestFixtureModule = {
  appendIRealBehaviorTestCharts?: (documents: ChartDocument[]) => ChartDocument[];
};

export type ChartImportSummary = {
  source: string;
  incomingCount: number;
  createdCount: number;
  duplicateCount: number;
  sourceRefsAddedCount: number;
  userChartsIgnoredCount: number;
  totalCount: number;
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

function queueLegacyChartUserTagCleanup(database: IDBDatabase, transaction: IDBTransaction): void {
  if (database.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)) {
    const documentStore = transaction.objectStore(CHART_DOCUMENT_STORE_NAME);
    const documentCursorRequest = documentStore.openCursor();
    documentCursorRequest.onsuccess = () => {
      const cursor = documentCursorRequest.result;
      if (!cursor) return;
      cursor.update(stripLegacyChartUserTags(cursor.value as ChartDocument));
      cursor.continue();
    };
  }

  if (database.objectStoreNames.contains(CHART_LIBRARY_STORE_NAME)) {
    const libraryStore = transaction.objectStore(CHART_LIBRARY_STORE_NAME);
    const libraryCursorRequest = libraryStore.openCursor();
    libraryCursorRequest.onsuccess = () => {
      const cursor = libraryCursorRequest.result;
      if (!cursor) return;
      const payload = cursor.value as ChartLibraryPayload;
      if (payload && typeof payload === 'object' && Array.isArray(payload.documents)) {
        cursor.update({
          ...payload,
          documents: payload.documents.map(stripLegacyChartUserTags)
        });
      }
      cursor.continue();
    };
  }
}

function openChartLibraryDatabase(): Promise<IDBDatabase | null> {
  const indexedDbFactory = getIndexedDbFactory();
  if (!indexedDbFactory) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = indexedDbFactory.open(CHART_LIBRARY_DB_NAME, 5);
    request.onupgradeneeded = (event) => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CHART_LIBRARY_STORE_NAME)) {
        database.createObjectStore(CHART_LIBRARY_STORE_NAME);
      }
      if (!database.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)) {
        database.createObjectStore(CHART_DOCUMENT_STORE_NAME);
      }
      if (!database.objectStoreNames.contains(CHART_SETLIST_STORE_NAME)) {
        database.createObjectStore(CHART_SETLIST_STORE_NAME);
      }
      if (!database.objectStoreNames.contains(CHART_USER_SETTINGS_STORE_NAME)) {
        database.createObjectStore(CHART_USER_SETTINGS_STORE_NAME, { keyPath: 'chartId' });
      }
      if (event.oldVersion < 4 && request.transaction) {
        queueLegacyChartUserTagCleanup(database, request.transaction);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open chart library database.'));
  });
}

async function normalizePersistedChartLibrary(
  value: unknown
): Promise<ChartLibraryPayload | null> {
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
    documents: await Promise.all(documents.map((document) => normalizeChartLibraryDocument(document))),
    lastImportSummary: normalizeChartImportSummary((value as { lastImportSummary?: unknown }).lastImportSummary)
  };
}

function getViteEnv(): Record<string, unknown> {
  return ((import.meta as ImportMeta & { env?: Record<string, unknown> }).env || {});
}

function shouldIncludeTemporaryChartFixtures({
  includeIRealBehaviorTestCharts = true
}: LoadPersistedChartLibraryOptions = {}): boolean {
  if (!includeIRealBehaviorTestCharts) return false;
  const env = getViteEnv();
  return env.DEV === true || env.VITE_INCLUDE_CHART_TEST_FIXTURES === 'true';
}

async function loadChartTestFixtureModule(): Promise<ChartTestFixtureModule | null> {
  const env = import.meta.env as Record<string, unknown> | undefined;
  if (env?.DEV === true || env?.VITE_INCLUDE_CHART_TEST_FIXTURES === 'true') {
    try {
      return await import('../../../chart/ireal-behavior-test-fixtures.js') as ChartTestFixtureModule;
    } catch (_error) {
      return null;
    }
  }
  return null;
}

function isTemporaryChartTestChart(document: ChartDocument | null | undefined): boolean {
  const documentId = String(document?.metadata?.id || '');
  if (documentId.startsWith('ireal-behavior-')) return true;
  if (documentId.startsWith('playback-ending-')) return true;
  if (documentId.startsWith('cue-demo-')) return true;
  return document?.source?.sourceRefs?.some((sourceRef) => (
    TEMPORARY_CHART_TEST_SOURCE_NAMES.has(String(sourceRef.name || ''))
  )) === true;
}

function removeTemporaryChartTestCharts(documents: ChartDocument[] = []): ChartDocument[] {
  return documents.filter((document) => !isTemporaryChartTestChart(document));
}

async function applyTemporaryChartFixtures(
  library: ChartLibraryPayload | null,
  options: LoadPersistedChartLibraryOptions = {}
): Promise<ChartLibraryPayload | null> {
  if (!library || !shouldIncludeTemporaryChartFixtures(options)) return library;
  const fixtureModule = await loadChartTestFixtureModule();
  const appendTestCharts = fixtureModule?.appendIRealBehaviorTestCharts;
  if (typeof appendTestCharts !== 'function') return library;
  return {
    ...library,
    documents: appendTestCharts(library.documents)
  };
}

function normalizeChartImportSummary(value: unknown): ChartImportSummary | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const summary = value as Partial<ChartImportSummary>;
  return {
    source: String(summary.source || ''),
    incomingCount: Number(summary.incomingCount || 0),
    createdCount: Number(summary.createdCount || 0),
    duplicateCount: Number(summary.duplicateCount || 0),
    sourceRefsAddedCount: Number(summary.sourceRefsAddedCount || 0),
    userChartsIgnoredCount: Number(summary.userChartsIgnoredCount || 0),
    totalCount: Number(summary.totalCount || 0)
  };
}

function stripLegacyChartUserTags(document: ChartDocument): ChartDocument {
  const metadata = document.metadata as Record<string, unknown> | undefined;
  if (!metadata || !Object.prototype.hasOwnProperty.call(metadata, 'userTags')) return document;
  const { userTags: _userTags, ...metadataWithoutUserTags } = metadata;
  return {
    ...document,
    metadata: metadataWithoutUserTags as ChartDocument['metadata']
  };
}

function normalizePersistedChartDocument(value: unknown): ChartDocument | null {
  if (!value || typeof value !== 'object') return null;
  const document = value as ChartDocument;
  if (!document.metadata?.id || !Array.isArray(document.bars) || document.bars.length === 0) return null;
  return stripLegacyChartUserTags(document);
}

function normalizeUserSettingsTempo(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(40, Math.min(320, Math.round(parsed)));
}

function normalizeUserSettingsTransposition(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return ((Math.round(parsed) % 12) + 12) % 12;
}

function sanitizeChartUserPlaybackSettings(settings: PlaybackSettings | null): PlaybackSettings | null {
  if (!settings || typeof settings !== 'object') return null;
  const sanitizedSettings = { ...(settings as PlaybackSettings & Record<string, unknown>) };
  delete sanitizedSettings.chartPerformance;
  delete sanitizedSettings.chartPerformances;
  delete sanitizedSettings.chartSimplePerformance;
  return sanitizedSettings;
}

function normalizeChartUserSettings(value: unknown, fallbackChartId = ''): ChartUserSettings | null {
  if (!value || typeof value !== 'object') return null;
  const settings = value as Partial<ChartUserSettings>;
  const chartId = String(settings.chartId || fallbackChartId || '').trim();
  if (!chartId) return null;

  const tempo = normalizeUserSettingsTempo(settings.tempo);
  const transposition = normalizeUserSettingsTransposition(settings.transposition);
  const playbackSettings = settings.playbackSettings && typeof settings.playbackSettings === 'object'
    ? sanitizeChartUserPlaybackSettings(settings.playbackSettings as PlaybackSettings)
    : null;

  return {
    schemaVersion: '1.0.0',
    chartId,
    ...(tempo !== null ? { tempo } : {}),
    ...(transposition !== null ? { transposition } : {}),
    ...(playbackSettings ? { playbackSettings } : {}),
    ...(settings.chartSimplePerformance ? { chartSimplePerformance: settings.chartSimplePerformance } : {}),
    ...(settings.chartPerformance ? {
      chartPerformance: resetTransientChartPerformanceCueState(settings.chartPerformance)
    } : {}),
    updatedAt: String(settings.updatedAt || new Date().toISOString())
  };
}

function normalizeSetlist(value: unknown): ChartSetlist | null {
  if (!value || typeof value !== 'object') return null;
  const setlist = value as Partial<ChartSetlist>;
  const id = String(setlist.id || '').trim();
  const name = String(setlist.name || '').trim();
  if (!id || !name) return null;
  const items = Array.isArray(setlist.items)
    ? setlist.items
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const chartId = String((item as { chartId?: unknown }).chartId || '').trim();
          if (!chartId) return null;
          const tempoOverride = Number((item as { tempoOverride?: unknown }).tempoOverride || 0);
          return {
            ...(item as Record<string, unknown>),
            chartId,
            ...(Number.isFinite(tempoOverride) && tempoOverride > 0 ? { tempoOverride } : {})
          };
        })
        .filter((item): item is ChartSetlist['items'][number] => Boolean(item))
    : [];
  return {
    ...setlist,
    id,
    name,
    items,
    createdAt: String(setlist.createdAt || new Date().toISOString()),
    updatedAt: String(setlist.updatedAt || new Date().toISOString())
  };
}

function normalizeSetlists(value: unknown): ChartSetlist[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeSetlist).filter((setlist): setlist is ChartSetlist => Boolean(setlist));
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
        .slice(0, RECENT_CHART_STORAGE_LIMIT)
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
  const documents = removeTemporaryChartTestCharts(library?.documents || []);
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
    const sourceRefs = getChartSourceRefs(document);
    for (const ref of sourceRefs) {
      const playlistName = String(ref.name || library?.source || '').trim();
      if (!playlistName) continue;
      playlistCounts.set(playlistName, (playlistCounts.get(playlistName) || 0) + 1);
    }
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
  ].slice(0, RECENT_CHART_STORAGE_LIMIT);

  saveHomeChartSummary({
    ...previousSummary,
    recentCharts
  });
}

export function recordRecentChartDocument(chartDocument: ChartDocument | null | undefined): void {
  if (!chartDocument?.metadata?.id) return;
  if (isTemporaryChartTestChart(chartDocument)) return;
  persistChartId(String(chartDocument.metadata.id || ''), {
    chartDocument
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
  const normalizedExistingDocuments = existingLibrary.documents;
  const normalizedImportedDocuments = importedLibrary.documents;
  const existingDocumentIds = new Set<string>(
    normalizedExistingDocuments
      .map((document) => String(document?.metadata?.id || '').trim())
      .filter(Boolean)
  );
  const importedHashLookup = new Map<string, ChartDocument>();
  let createdCount = 0;
  let duplicateCount = 0;
  let sourceRefsAddedCount = 0;
  let userChartsIgnoredCount = 0;

  for (const existingDocument of normalizedExistingDocuments) {
    if (getChartSourceRefs(existingDocument).length === 0) {
      userChartsIgnoredCount += 1;
      continue;
    }
    const hashKey = `${existingDocument.metadata?.contentHashVersion || ''}:${existingDocument.metadata?.contentHash || ''}`;
    if (existingDocument.metadata?.contentHashVersion === CHART_CONTENT_HASH_VERSION && existingDocument.metadata?.contentHash) {
      importedHashLookup.set(hashKey, existingDocument);
    }
  }

  const nextDocuments = [...normalizedExistingDocuments];

  for (const document of normalizedImportedDocuments) {
    const hashKey = `${document.metadata?.contentHashVersion || ''}:${document.metadata?.contentHash || ''}`;
    const existingImportedDocument = document.metadata?.contentHashVersion === CHART_CONTENT_HASH_VERSION
      && document.metadata?.contentHash
      ? importedHashLookup.get(hashKey)
      : null;

    if (existingImportedDocument) {
      duplicateCount += 1;
      const beforeCount = getChartSourceRefs(existingImportedDocument).length;
      existingImportedDocument.source = {
        ...(existingImportedDocument.source || {}),
        sourceRefs: mergeChartSourceRefs(getChartSourceRefs(existingImportedDocument), getChartSourceRefs(document))
      };
      const afterCount = getChartSourceRefs(existingImportedDocument).length;
      if (afterCount > beforeCount) sourceRefsAddedCount += 1;
      continue;
    }

    const documentId = String(document?.metadata?.id || '').trim();
    if (documentId && existingDocumentIds.has(documentId)) {
      const nextId = `${documentId}-${slugSuffixForHash(document.metadata?.contentHash || String(nextDocuments.length + 1))}`;
      document.metadata = {
        ...document.metadata,
        id: nextId
      };
    }
    if (document.metadata?.id) {
      existingDocumentIds.add(String(document.metadata.id));
    }
    nextDocuments.push(document);
    if (document.metadata?.contentHashVersion === CHART_CONTENT_HASH_VERSION && document.metadata?.contentHash) {
      importedHashLookup.set(hashKey, document);
    }
    createdCount += 1;
  }

  return {
    source: importedLibrary.source,
    documents: nextDocuments,
    lastImportSummary: {
      source: importedLibrary.source,
      incomingCount: normalizedImportedDocuments.length,
      createdCount,
      duplicateCount,
      sourceRefsAddedCount,
      userChartsIgnoredCount,
      totalCount: nextDocuments.length
    }
  };
}

function slugSuffixForHash(value: unknown): string {
  return String(value || '')
    .replace(/^sha256:/, '')
    .replace(/[^\w]+/g, '')
    .slice(0, 10) || 'copy';
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
    .slice(0, RECENT_CHART_STORAGE_LIMIT);
}

export function loadPersistedRecentChartDocuments(): ChartDocument[] {
  const chartUiSettings = loadChartUiSettings();
  const recentChartDocumentsById = new Map(
    normalizePersistedChartDocuments(chartUiSettings?.recentChartDocuments)
      .map((document) => [document.metadata.id, document])
  );

  return loadRecentChartIds()
    .map((chartId) => recentChartDocumentsById.get(chartId))
    .filter((document): document is ChartDocument => Boolean(document));
}

export function removePersistedChartReferences(chartIds: string[] = []): void {
  const deletedIds = new Set(chartIds.map((chartId) => String(chartId || '').trim()).filter(Boolean));
  if (deletedIds.size === 0) return;

  const chartUiSettings = loadChartUiSettings();
  const lastChartId = String(chartUiSettings?.lastChartId || '').trim();
  const recentChartIds = loadRecentChartIds().filter((chartId) => !deletedIds.has(chartId));
  const recentChartDocuments = normalizePersistedChartDocuments(chartUiSettings?.recentChartDocuments)
    .filter((document) => !deletedIds.has(String(document.metadata?.id || '')));
  const lastChartDocument = normalizePersistedChartDocument(chartUiSettings?.lastChartDocument);
  const homeChartSummary = normalizeHomeChartSummary(chartUiSettings?.homeChartSummary);

  saveChartUiSettings({
    lastChartId: deletedIds.has(lastChartId) ? '' : lastChartId,
    recentChartIds,
    recentChartDocuments,
    ...(lastChartDocument && deletedIds.has(String(lastChartDocument.metadata?.id || '')) ? { lastChartDocument: null } : {}),
    ...(homeChartSummary ? {
      homeChartSummary: {
        ...homeChartSummary,
        recentCharts: homeChartSummary.recentCharts.filter((chart) => !deletedIds.has(chart.id))
      }
    } : {})
  });
  void deletePersistedChartUserSettings([...deletedIds]);
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
      ].slice(0, RECENT_CHART_STORAGE_LIMIT)
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
  chordEnrichmentMode = 'mainstream-jazz',
  useChordSymbolV2 = false,
  useMajorTriangleSymbol = true,
  useHalfDiminishedSymbol = true,
  useDiminishedSymbol = true,
  legacyStorageKey = ''
}: {
  playbackSettings?: PlaybackSettings;
  harmonyDisplayMode?: string;
  chordEnrichmentMode?: string;
  useChordSymbolV2?: boolean;
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
      chartRepeatCount: playbackSettings.chartRepeatCount,
      chartRepeatInfinite: playbackSettings.chartRepeatInfinite === true,
      harmonyDisplayMode,
      chordEnrichmentMode,
      useChordSymbolV2,
      useMajorTriangleSymbol,
      useHalfDiminishedSymbol,
      useDiminishedSymbol
    }
  });

  if (!legacyStorageKey) return;
  try {
    window.localStorage.setItem(legacyStorageKey, JSON.stringify({
      ...nextSettings,
      chartRepeatCount: playbackSettings.chartRepeatCount,
      chartRepeatInfinite: playbackSettings.chartRepeatInfinite === true,
      harmonyDisplayMode,
      chordEnrichmentMode,
      useChordSymbolV2,
      useMajorTriangleSymbol,
      useHalfDiminishedSymbol,
      useDiminishedSymbol
    }));
  } catch {
    // Ignore storage failures so charts still work in restricted contexts.
  }
}

function loadFallbackChartUserSettings(chartId: string): ChartUserSettings | null {
  const chartUiSettings = loadChartUiSettings();
  const settingsById = chartUiSettings?.chartUserSettingsById;
  if (!settingsById || typeof settingsById !== 'object') return null;
  return normalizeChartUserSettings((settingsById as Record<string, unknown>)[chartId], chartId);
}

function saveFallbackChartUserSettings(settings: ChartUserSettings): void {
  const chartUiSettings = loadChartUiSettings();
  const settingsById = chartUiSettings?.chartUserSettingsById && typeof chartUiSettings.chartUserSettingsById === 'object'
    ? chartUiSettings.chartUserSettingsById as Record<string, unknown>
    : {};
  saveChartUiSettings({
    chartUserSettingsById: {
      ...settingsById,
      [settings.chartId]: settings
    }
  });
}

function deleteFallbackChartUserSettings(chartIds: string[]): void {
  const chartUiSettings = loadChartUiSettings();
  const settingsById = chartUiSettings?.chartUserSettingsById && typeof chartUiSettings.chartUserSettingsById === 'object'
    ? { ...chartUiSettings.chartUserSettingsById as Record<string, unknown> }
    : {};
  chartIds.forEach((chartId) => {
    delete settingsById[chartId];
  });
  saveChartUiSettings({ chartUserSettingsById: settingsById });
}

export async function loadChartUserSettings(chartId = ''): Promise<ChartUserSettings | null> {
  const normalizedChartId = String(chartId || '').trim();
  if (!normalizedChartId) return null;
  try {
    const database = await openChartLibraryDatabase();
    if (database?.objectStoreNames.contains(CHART_USER_SETTINGS_STORE_NAME)) {
      try {
        const transaction = database.transaction(CHART_USER_SETTINGS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CHART_USER_SETTINGS_STORE_NAME);
        const settings = await waitForRequest(store.get(normalizedChartId));
        return normalizeChartUserSettings(settings, normalizedChartId);
      } finally {
        database.close();
      }
    }
  } catch {
    // Fall back to localStorage-backed app state below.
  }
  return loadFallbackChartUserSettings(normalizedChartId);
}

export async function persistChartUserSettings(
  chartId = '',
  patch: Partial<ChartUserSettings> = {}
): Promise<ChartUserSettings | null> {
  const normalizedChartId = String(chartId || '').trim();
  if (!normalizedChartId) return null;
  const previousSettings = await loadChartUserSettings(normalizedChartId);
  const nextSettings = normalizeChartUserSettings({
    ...(previousSettings || {}),
    ...(patch || {}),
    chartId: normalizedChartId,
    updatedAt: new Date().toISOString()
  }, normalizedChartId);
  if (!nextSettings) return null;

  try {
    const database = await openChartLibraryDatabase();
    if (database?.objectStoreNames.contains(CHART_USER_SETTINGS_STORE_NAME)) {
      try {
        const transaction = database.transaction(CHART_USER_SETTINGS_STORE_NAME, 'readwrite');
        transaction.objectStore(CHART_USER_SETTINGS_STORE_NAME).put(nextSettings);
        await waitForTransaction(transaction);
      } finally {
        database.close();
      }
      saveFallbackChartUserSettings(nextSettings);
      return nextSettings;
    }
  } catch {
    // Fall back to localStorage-backed app state below.
  }

  saveFallbackChartUserSettings(nextSettings);
  return nextSettings;
}

export async function deletePersistedChartUserSettings(chartIds: string[] = []): Promise<void> {
  const normalizedChartIds = chartIds.map((chartId) => String(chartId || '').trim()).filter(Boolean);
  if (normalizedChartIds.length === 0) return;

  try {
    const database = await openChartLibraryDatabase();
    if (database?.objectStoreNames.contains(CHART_USER_SETTINGS_STORE_NAME)) {
      try {
        const transaction = database.transaction(CHART_USER_SETTINGS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHART_USER_SETTINGS_STORE_NAME);
        normalizedChartIds.forEach((chartId) => {
          store.delete(chartId);
        });
        await waitForTransaction(transaction);
      } finally {
        database.close();
      }
    }
  } catch {
    // Keep the fallback cleanup below.
  }

  deleteFallbackChartUserSettings(normalizedChartIds);
}

export async function loadPersistedChartLibrary(
  options: LoadPersistedChartLibraryOptions = {}
): Promise<ChartLibraryPayload | null> {
  try {
    const database = await openChartLibraryDatabase();
    if (database) {
      try {
        const transaction = database.transaction(CHART_LIBRARY_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CHART_LIBRARY_STORE_NAME);
        const persistedValue = await waitForRequest(store.get(IMPORTED_CHART_LIBRARY_KEY));
        return await applyTemporaryChartFixtures(
          await normalizePersistedChartLibrary(persistedValue),
          options
        );
      } finally {
        database.close();
      }
    }
  } catch {
    // Fall back to localStorage-backed app state below.
  }

  const chartUiSettings = loadChartUiSettings();
  return await applyTemporaryChartFixtures(
    await normalizePersistedChartLibrary(chartUiSettings?.importedChartLibrary),
    options
  );
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
  const normalizedLibrary = await normalizePersistedChartLibrary({
    source,
    documents: removeTemporaryChartTestCharts(documents)
  });

  if (!normalizedLibrary) {
    await clearPersistedChartLibrary();
    return null;
  }

  let mergedLibrary = normalizedLibrary;
  normalizedLibrary.lastImportSummary = {
    source: normalizedLibrary.source,
    incomingCount: normalizedLibrary.documents.length,
    createdCount: normalizedLibrary.documents.length,
    duplicateCount: 0,
    sourceRefsAddedCount: 0,
    userChartsIgnoredCount: 0,
    totalCount: normalizedLibrary.documents.length
  };
  try {
    if (mergeWithExisting) {
      const existingLibrary = await loadPersistedChartLibrary({
        includeIRealBehaviorTestCharts: false
      });
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

  if (normalizedLibrary.documents.length === 1) {
    recordRecentChartDocument(mergedLibrary.documents.find((document) => document.metadata.id === normalizedLibrary.documents[0].metadata.id)
      || normalizedLibrary.documents[0]);
  }

  try {
    const database = await openChartLibraryDatabase();
    if (!database) {
      saveChartUiSettings({
        importedChartLibrary: mergedLibrary,
        importedChartLibrarySource: mergedLibrary.source,
        homeChartSummary: createHomeChartSummary(mergedLibrary)
      });
      return await applyTemporaryChartFixtures(mergedLibrary);
    }
    try {
      const storeNames = database.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)
        ? [CHART_LIBRARY_STORE_NAME, CHART_DOCUMENT_STORE_NAME]
        : [CHART_LIBRARY_STORE_NAME];
      const transaction = database.transaction(storeNames, 'readwrite');
      const transactionDone = waitForTransaction(transaction);
      const store = transaction.objectStore(CHART_LIBRARY_STORE_NAME);
      store.put(mergedLibrary, IMPORTED_CHART_LIBRARY_KEY);
      if (database.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)) {
        const documentStore = transaction.objectStore(CHART_DOCUMENT_STORE_NAME);
        documentStore.clear();
        for (const document of mergedLibrary.documents) {
          const documentId = String(document?.metadata?.id || '').trim();
          if (!documentId) continue;
          documentStore.put(document, documentId);
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

  return await applyTemporaryChartFixtures(mergedLibrary);
}

export async function loadPersistedSetlists(): Promise<ChartSetlist[]> {
  try {
    const database = await openChartLibraryDatabase();
    if (database?.objectStoreNames.contains(CHART_SETLIST_STORE_NAME)) {
      try {
        const transaction = database.transaction(CHART_SETLIST_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CHART_SETLIST_STORE_NAME);
        const persistedValue = await waitForRequest(store.get(CHART_SETLISTS_KEY));
        return normalizeSetlists(persistedValue);
      } finally {
        database.close();
      }
    }
  } catch {
    // Fall back to app-state storage below.
  }

  const chartUiSettings = loadChartUiSettings();
  return normalizeSetlists(chartUiSettings?.chartSetlists);
}

export async function persistSetlists(setlists: ChartSetlist[] = []): Promise<ChartSetlist[]> {
  const normalizedSetlists = normalizeSetlists(setlists);
  saveChartUiSettings({ chartSetlists: normalizedSetlists });
  try {
    const database = await openChartLibraryDatabase();
    if (!database?.objectStoreNames.contains(CHART_SETLIST_STORE_NAME)) return normalizedSetlists;
    try {
      const transaction = database.transaction(CHART_SETLIST_STORE_NAME, 'readwrite');
      const transactionDone = waitForTransaction(transaction);
      await waitForRequest(transaction.objectStore(CHART_SETLIST_STORE_NAME).put(normalizedSetlists, CHART_SETLISTS_KEY));
      await transactionDone;
    } finally {
      database.close();
    }
  } catch {
    // App-state fallback has already been saved.
  }
  return normalizedSetlists;
}

export async function clearPersistedChartLibrary(): Promise<void> {
  saveChartUiSettings({
    importedChartLibrary: null,
    importedChartLibrarySource: '',
    homeChartSummary: null,
    lastChartId: '',
    recentChartIds: [],
    chartSetlists: []
  });

  try {
    const database = await openChartLibraryDatabase();
    if (!database) return;
    try {
      const storeNames = [
        CHART_LIBRARY_STORE_NAME,
        ...(database.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME) ? [CHART_DOCUMENT_STORE_NAME] : []),
        ...(database.objectStoreNames.contains(CHART_SETLIST_STORE_NAME) ? [CHART_SETLIST_STORE_NAME] : [])
      ];
      const transaction = database.transaction(storeNames, 'readwrite');
      const transactionDone = waitForTransaction(transaction);
      const store = transaction.objectStore(CHART_LIBRARY_STORE_NAME);
      await waitForRequest(store.delete(IMPORTED_CHART_LIBRARY_KEY));
      if (database.objectStoreNames.contains(CHART_DOCUMENT_STORE_NAME)) {
        await waitForRequest(transaction.objectStore(CHART_DOCUMENT_STORE_NAME).clear());
      }
      if (database.objectStoreNames.contains(CHART_SETLIST_STORE_NAME)) {
        await waitForRequest(transaction.objectStore(CHART_SETLIST_STORE_NAME).delete(CHART_SETLISTS_KEY));
      }
      await transactionDone;
    } finally {
      database.close();
    }
  } catch {
    // Ignore storage failures so the UI can still clear the in-memory library.
  }
}
