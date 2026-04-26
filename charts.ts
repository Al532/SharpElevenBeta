import { createChartDocumentsFromIRealText } from './chart/index.js';
import { initializeSharpElevenTheme } from './src/features/app/app-theme.js';
import {
  consumePendingIRealLinkResult,
  isIRealDeepLink,
  storePendingIRealLink
} from './src/features/app/app-pending-mobile-import.js';
import { openIrealBrowser } from './src/features/app/ireal-browser.js';
import {
  clearPersistedChartLibrary,
  loadPersistedChartLibrary,
  loadPersistedSetlists,
  persistChartLibrary,
  persistSetlists
} from './src/features/chart/chart-persistence.js';
import {
  filterChartDocuments,
  getChartSourceRefs,
  removeChartSourceFromDocuments,
  importDocumentsFromIRealText
} from './src/features/chart/chart-library.js';
import type { ChartDocument, ChartSetlist } from './src/core/types/contracts';
import {
  bindChartImportControls,
  setChartImportStatus
} from './src/features/chart/chart-import-controls.js';

initializeSharpElevenTheme();

const IREAL_FORUM_TRACKS_URL = 'https://forums.irealpro.com';

const dom = {
  importIRealBackupButton: document.getElementById('import-ireal-backup-button') as HTMLButtonElement | null,
  openIRealForumButton: document.getElementById('open-ireal-forum-button') as HTMLButtonElement | null,
  irealBackupInput: document.getElementById('ireal-backup-input') as HTMLInputElement | null,
  clearAllChartsButton: document.getElementById('clear-all-charts-button') as HTMLButtonElement | null,
  chartImportStatus: document.getElementById('chart-import-status'),
  manageChartSearchInput: document.getElementById('manage-chart-search-input') as HTMLInputElement | null,
  manageOriginFilter: document.getElementById('manage-origin-filter') as HTMLSelectElement | null,
  manageSourceFilter: document.getElementById('manage-source-filter') as HTMLSelectElement | null,
  manageLibrarySummary: document.getElementById('manage-library-summary'),
  manageChartList: document.getElementById('manage-chart-list'),
  manageSourceSummary: document.getElementById('manage-source-summary'),
  manageSourceList: document.getElementById('manage-source-list'),
  manageTagChartSelect: document.getElementById('manage-tag-chart-select') as HTMLSelectElement | null,
  manageTagInput: document.getElementById('manage-tag-input') as HTMLInputElement | null,
  manageSaveTagsButton: document.getElementById('manage-save-tags-button') as HTMLButtonElement | null,
  manageSetlistNameInput: document.getElementById('manage-setlist-name-input') as HTMLInputElement | null,
  manageCreateSetlistButton: document.getElementById('manage-create-setlist-button') as HTMLButtonElement | null,
  manageSetlistList: document.getElementById('manage-setlist-list')
};

let currentDocuments: ChartDocument[] = [];
let currentSource = 'imported library';
let currentSetlists: ChartSetlist[] = [];

function setImportStatus(message: string, isError = false) {
  setChartImportStatus(dom.chartImportStatus, message, isError);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

function pluralizeChartLabel(count: number) {
  return `chart${count === 1 ? '' : 's'}`;
}

function formatImportSummary(persistedLibrary: Awaited<ReturnType<typeof persistChartLibrary>>, fallbackCount: number, sourceFile: string) {
  const summary = persistedLibrary?.lastImportSummary;
  if (!summary) return `Loaded ${fallbackCount} ${pluralizeChartLabel(fallbackCount)} from ${sourceFile}.`;
  return [
    `Import from ${sourceFile}: ${summary.createdCount} new ${pluralizeChartLabel(summary.createdCount)}`,
    `${summary.duplicateCount} duplicate${summary.duplicateCount === 1 ? '' : 's'} skipped`,
    `${summary.sourceRefsAddedCount} source reference${summary.sourceRefsAddedCount === 1 ? '' : 's'} added`,
    `${summary.totalCount} total ${pluralizeChartLabel(summary.totalCount)} in library`
  ].join(' - ');
}

function createTextElement(tagName: string, className: string, textContent: string): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = textContent;
  return element;
}

function getChartSubtitle(document: ChartDocument): string {
  const parts = [
    document.metadata?.composer,
    document.metadata?.styleReference || document.metadata?.style || document.metadata?.canonicalGroove,
    document.metadata?.origin === 'user' ? 'User chart' : getChartSourceRefs(document).map((ref) => ref.name).join(', ')
  ].map((part) => String(part || '').trim()).filter(Boolean);
  return [...new Set(parts)].join(' - ');
}

function getSourceCounts(documents = currentDocuments): Map<string, number> {
  const counts = new Map<string, number>();
  for (const document of documents) {
    if (document.metadata?.origin === 'user') continue;
    for (const sourceRef of getChartSourceRefs(document)) {
      const name = String(sourceRef.name || '').trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }
  return counts;
}

function getSetlistUsage(chartId: string): string[] {
  return currentSetlists
    .filter((setlist) => setlist.items.some((item) => item.chartId === chartId))
    .map((setlist) => setlist.name);
}

function getFilteredManageDocuments(): ChartDocument[] {
  const query = dom.manageChartSearchInput?.value || '';
  const origin = dom.manageOriginFilter?.value || '';
  const source = dom.manageSourceFilter?.value || '';
  let documents = query ? filterChartDocuments(currentDocuments, query) : [...currentDocuments];
  if (origin) {
    documents = documents.filter((document) => document.metadata?.origin === origin);
  }
  if (source) {
    documents = documents.filter((document) => getChartSourceRefs(document).some((ref) => ref.name === source));
  }
  return documents;
}

function renderManageSourceOptions() {
  if (!dom.manageSourceFilter) return;
  const previousValue = dom.manageSourceFilter.value;
  const counts = getSourceCounts();
  dom.manageSourceFilter.replaceChildren(new Option('All sources', ''));
  [...counts.keys()].sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }))
    .forEach((sourceName) => dom.manageSourceFilter?.append(new Option(sourceName, sourceName)));
  if ([...dom.manageSourceFilter.options].some((option) => option.value === previousValue)) {
    dom.manageSourceFilter.value = previousValue;
  }
}

function renderManageCharts() {
  if (!dom.manageChartList) return;
  const documents = getFilteredManageDocuments();
  dom.manageChartList.replaceChildren();
  if (dom.manageLibrarySummary) {
    dom.manageLibrarySummary.textContent = `${documents.length} / ${currentDocuments.length} charts shown.`;
  }
  for (const chartDocument of documents.slice(0, 80)) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('chart', chartDocument.metadata.id);
    link.href = targetUrl.toString();
    link.className = 'home-list-link';
    link.append(createTextElement('span', 'home-list-title', chartDocument.metadata.title || 'Untitled chart'));
    const usage = getSetlistUsage(chartDocument.metadata.id);
    const subtitle = [getChartSubtitle(chartDocument), usage.length ? `Setlists: ${usage.join(', ')}` : ''].filter(Boolean).join(' - ');
    if (subtitle) link.append(createTextElement('span', 'home-list-meta', subtitle));
    item.append(link);
    dom.manageChartList.append(item);
  }
}

function renderManageSources() {
  if (!dom.manageSourceList) return;
  const counts = getSourceCounts();
  dom.manageSourceList.replaceChildren();
  if (dom.manageSourceSummary) {
    dom.manageSourceSummary.textContent = counts.size
      ? `${counts.size} source${counts.size === 1 ? '' : 's'} tracked. Removing a source keeps charts that also belong to another source.`
      : 'No imported sources yet.';
  }
  for (const [sourceName, count] of [...counts.entries()].sort(([left], [right]) => left.localeCompare(right, 'en', { sensitivity: 'base' }))) {
    const item = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'home-list-link chart-manage-source-row';
    const label = document.createElement('span');
    label.append(createTextElement('span', 'home-list-title', sourceName));
    label.append(createTextElement('span', 'home-list-meta', `${count} ${pluralizeChartLabel(count)}`));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'home-primary-action chart-manage-danger';
    button.textContent = 'Remove source';
    button.addEventListener('click', () => removeSource(sourceName));
    row.append(label, button);
    item.append(row);
    dom.manageSourceList.append(item);
  }
}

function renderManageTags() {
  if (!dom.manageTagChartSelect) return;
  const previousValue = dom.manageTagChartSelect.value;
  dom.manageTagChartSelect.replaceChildren();
  for (const chartDocument of currentDocuments.slice().sort((left, right) => String(left.metadata?.title || '').localeCompare(String(right.metadata?.title || ''), 'en', { sensitivity: 'base' }))) {
    dom.manageTagChartSelect.append(new Option(chartDocument.metadata.title || 'Untitled chart', chartDocument.metadata.id));
  }
  if ([...dom.manageTagChartSelect.options].some((option) => option.value === previousValue)) {
    dom.manageTagChartSelect.value = previousValue;
  }
  syncTagInput();
}

function syncTagInput() {
  if (!dom.manageTagInput || !dom.manageTagChartSelect) return;
  const selectedDocument = currentDocuments.find((document) => document.metadata.id === dom.manageTagChartSelect?.value);
  dom.manageTagInput.value = Array.isArray(selectedDocument?.metadata?.userTags)
    ? selectedDocument.metadata.userTags.join(', ')
    : '';
}

async function saveSelectedTags() {
  const selectedId = dom.manageTagChartSelect?.value || '';
  const selectedDocument = currentDocuments.find((document) => document.metadata.id === selectedId);
  if (!selectedDocument) return;
  const tags = String(dom.manageTagInput?.value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  currentDocuments = currentDocuments.map((document) => document.metadata.id === selectedId
    ? { ...document, metadata: { ...document.metadata, userTags: tags } }
    : document);
  await persistChartLibrary({ documents: currentDocuments, source: currentSource, mergeWithExisting: false });
  setImportStatus(`Saved ${tags.length} tag${tags.length === 1 ? '' : 's'} for ${selectedDocument.metadata.title || 'chart'}.`);
  renderManageUi();
}

function renderSetlists() {
  if (!dom.manageSetlistList) return;
  dom.manageSetlistList.replaceChildren();
  for (const setlist of currentSetlists) {
    const item = document.createElement('li');
    const row = document.createElement('a');
    row.className = 'home-list-link chart-manage-setlist-row';
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('setlist', setlist.id);
    row.href = targetUrl.toString();
    const label = document.createElement('span');
    label.append(createTextElement('span', 'home-list-title', setlist.name));
    label.append(createTextElement('span', 'home-list-meta', `${setlist.items.length} ${pluralizeChartLabel(setlist.items.length)} - manual playback`));
    row.append(label);
    item.append(row);
    dom.manageSetlistList.append(item);
  }
}

async function createSetlist() {
  const name = String(dom.manageSetlistNameInput?.value || '').trim();
  if (!name) {
    setImportStatus('Name the setlist first.', true);
    return;
  }
  const now = new Date().toISOString();
  const chartIds = getFilteredManageDocuments().map((document) => document.metadata.id).filter(Boolean);
  if (chartIds.length === 0) {
    setImportStatus('Filter or import charts before creating a setlist.', true);
    return;
  }
  currentSetlists = await persistSetlists([
    ...currentSetlists,
    {
      id: `setlist-${Date.now().toString(36)}`,
      name,
      items: chartIds.map((chartId) => ({ chartId })),
      createdAt: now,
      updatedAt: now
    }
  ]);
  if (dom.manageSetlistNameInput) dom.manageSetlistNameInput.value = '';
  setImportStatus(`Created setlist "${name}" with ${chartIds.length} ${pluralizeChartLabel(chartIds.length)}.`);
  renderSetlists();
}

async function removeSource(sourceName: string) {
  const preview = removeChartSourceFromDocuments(currentDocuments, sourceName);
  const usedInSetlists = currentDocuments
    .filter((document) => getChartSourceRefs(document).some((ref) => ref.name === sourceName))
    .filter((document) => getSetlistUsage(document.metadata.id).length > 0)
    .length;
  const confirmed = window.confirm(
    `Remove source "${sourceName}"?\n\n${preview.removedChartCount} charts will be deleted.\n${preview.updatedChartCount} charts will be kept with this source removed.\n${preview.ignoredUserChartCount} user charts will be ignored.\n${usedInSetlists} affected charts are used in setlists.`
  );
  if (!confirmed) return;
  currentDocuments = preview.documents;
  const persistedLibrary = await persistChartLibrary({
    documents: currentDocuments,
    source: currentSource,
    mergeWithExisting: false
  });
  currentDocuments = persistedLibrary?.documents || currentDocuments;
  setImportStatus(`Removed source "${sourceName}": ${preview.removedChartCount} charts deleted, ${preview.updatedChartCount} charts kept.`);
  renderManageUi();
}

function renderManageUi() {
  renderManageSourceOptions();
  renderManageCharts();
  renderManageSources();
  renderManageTags();
  renderSetlists();
}

async function loadManageState() {
  const persistedLibrary = await loadPersistedChartLibrary();
  currentDocuments = persistedLibrary?.documents || [];
  currentSource = persistedLibrary?.source || 'imported library';
  currentSetlists = await loadPersistedSetlists();
  renderManageUi();
}

async function importFromRawText(rawText: string, sourceFile: string) {
  const trimmedText = String(rawText || '').trim();
  if (!trimmedText) {
    setImportStatus('Paste an irealb:// link first.', true);
    return;
  }

  try {
    const documents = await importDocumentsFromIRealText({
      rawText: trimmedText,
      sourceFile,
      importDocuments: ({ rawText, sourceFile: importedSourceFile = '' }) =>
        createChartDocumentsFromIRealText({ rawText, sourceFile: importedSourceFile })
    });

    if (!documents.length) {
      setImportStatus(`No charts imported from ${sourceFile}.`);
      return;
    }

    const persistedLibrary = await persistChartLibrary({
      documents,
      source: sourceFile,
      mergeWithExisting: true
    });

    if (!persistedLibrary || persistedLibrary.documents.length === 0) {
      throw new Error('The imported chart library could not be confirmed in persistent storage.');
    }

    currentDocuments = persistedLibrary.documents;
    currentSource = persistedLibrary.source;
    setImportStatus(formatImportSummary(persistedLibrary, documents.length, sourceFile));
    renderManageUi();
  } catch (error) {
    setImportStatus(`Import failed: ${getErrorMessage(error)}`, true);
  }
}

async function handleBackupFileSelection(event: Event & { target: HTMLInputElement | null }) {
  const file = event.target?.files?.[0];
  if (!file) return;

  try {
    const rawText = await file.text();
    await importFromRawText(rawText, file.name);
  } catch (error) {
    setImportStatus(`Import failed: ${getErrorMessage(error)}`, true);
  } finally {
    if (event.target) event.target.value = '';
  }
}

async function importPendingMobileIRealLink() {
  const pendingResult = await consumePendingIRealLinkResult();
  const pendingIRealLink = pendingResult.url;

  if (!pendingIRealLink && pendingResult.hadPendingMarker) {
    setImportStatus(
      pendingResult.errorMessage
        ? `iReal link detected, but the captured text could not be loaded: ${pendingResult.errorMessage}`
        : 'iReal link detected, but the captured text could not be loaded. Open the forum tracks and tap the link again.',
      true
    );
    return;
  }

  if (!pendingIRealLink) return;

  setImportStatus('iReal link captured. Importing charts...');
  await importFromRawText(pendingIRealLink, 'pasted-ireal-link');
}

async function bindIncomingMobileIRealImports() {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  let appPlugin = null;
  try {
    const capacitorAppModule = await import('@capacitor/app');
    appPlugin = capacitorAppModule?.App || null;
  } catch (_error) {
    appPlugin = window.Capacitor?.Plugins?.App || null;
  }
  if (!appPlugin?.addListener) return;

  const handleIncomingUrl = (url: string) => {
    if (!isIRealDeepLink(url)) return;
    storePendingIRealLink(url);
    setImportStatus('iReal link detected. Loading captured text...');
    void importPendingMobileIRealLink();
  };

  try {
    const launchUrl = await appPlugin.getLaunchUrl?.();
    handleIncomingUrl(String(launchUrl?.url || ''));
  } catch (_error) {
    // Keep the live listener active even if launch URL retrieval fails.
  }

  appPlugin.addListener('appUrlOpen', ({ url }: { url?: string }) => {
    handleIncomingUrl(String(url || ''));
  });
}

bindChartImportControls({
  importIRealBackupButton: dom.importIRealBackupButton,
  irealBackupInput: dom.irealBackupInput,
  openIRealForumButton: dom.openIRealForumButton,
  forumTracksUrl: IREAL_FORUM_TRACKS_URL,
  setImportStatus,
  onBackupFileSelection: handleBackupFileSelection,
  onOpenForumTracks: () => openIrealBrowser({
    url: IREAL_FORUM_TRACKS_URL,
    title: 'Click on a link to import'
  })
});

void bindIncomingMobileIRealImports().then(() => importPendingMobileIRealLink());

dom.clearAllChartsButton?.addEventListener('click', async () => {
  try {
    await clearPersistedChartLibrary();
    currentDocuments = [];
    setImportStatus('All charts removed.');
    renderManageUi();
  } catch (error) {
    setImportStatus(`Failed to remove charts: ${getErrorMessage(error)}`, true);
  }
});

dom.manageChartSearchInput?.addEventListener('input', renderManageCharts);
dom.manageOriginFilter?.addEventListener('change', renderManageCharts);
dom.manageSourceFilter?.addEventListener('change', renderManageCharts);
dom.manageTagChartSelect?.addEventListener('change', syncTagInput);
dom.manageSaveTagsButton?.addEventListener('click', () => {
  void saveSelectedTags().catch((error) => setImportStatus(`Failed to save tags: ${getErrorMessage(error)}`, true));
});
dom.manageCreateSetlistButton?.addEventListener('click', () => {
  void createSetlist().catch((error) => setImportStatus(`Failed to create setlist: ${getErrorMessage(error)}`, true));
});

void loadManageState().catch((error) => {
  setImportStatus(`Failed to load chart library: ${getErrorMessage(error)}`, true);
});
