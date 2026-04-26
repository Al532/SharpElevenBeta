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
  createEmptyChartSetlist,
  filterChartDocuments,
  getChartSetlistMembership,
  getChartSourceRefs,
  importDocumentsFromIRealText,
  listChartLibraryFacets,
  reorderSetlistItems
} from './src/features/chart/chart-library.js';
import type { ChartDocument, ChartSetlist } from './src/core/types/contracts';
import {
  bindChartImportControls,
  setChartImportStatus
} from './src/features/chart/chart-import-controls.js';
import {
  closeChartMetadataPanel,
  openChartMetadataPanel
} from './src/features/chart/chart-metadata-panel.js';

initializeSharpElevenTheme();

const IREAL_FORUM_TRACKS_URL = 'https://forums.irealpro.com';
const VISIBLE_RESULT_LIMIT = 80;

const dom = {
  importIRealBackupButton: document.getElementById('import-ireal-backup-button') as HTMLButtonElement | null,
  openIRealForumButton: document.getElementById('open-ireal-forum-button') as HTMLButtonElement | null,
  irealBackupInput: document.getElementById('ireal-backup-input') as HTMLInputElement | null,
  clearAllChartsButton: document.getElementById('clear-all-charts-button') as HTMLButtonElement | null,
  chartImportStatus: document.getElementById('chart-import-status'),
  manageGlobalSummary: document.getElementById('manage-global-summary'),
  manageChartSearchInput: document.getElementById('manage-chart-search-input') as HTMLInputElement | null,
  manageOriginFilter: document.getElementById('manage-origin-filter') as HTMLSelectElement | null,
  manageSourceFilter: document.getElementById('manage-source-filter') as HTMLSelectElement | null,
  manageTagFilter: document.getElementById('manage-tag-filter') as HTMLSelectElement | null,
  manageSetlistFilter: document.getElementById('manage-setlist-filter') as HTMLSelectElement | null,
  manageLibrarySummary: document.getElementById('manage-library-summary'),
  manageChartList: document.getElementById('manage-chart-list'),
  manageSetlistNameInput: document.getElementById('manage-setlist-name-input') as HTMLInputElement | null,
  manageCreateSetlistButton: document.getElementById('manage-create-setlist-button') as HTMLButtonElement | null,
  manageSetlistList: document.getElementById('manage-setlist-list'),
  manageSetlistDetail: document.getElementById('manage-setlist-detail'),
  manageMetadataPanel: document.getElementById('manage-metadata-panel')
};

let currentDocuments: ChartDocument[] = [];
let currentSource = 'imported library';
let currentSetlists: ChartSetlist[] = [];
let resultsExpanded = false;
let activeSetlistId = '';

function setImportStatus(message: string, isError = false) {
  setChartImportStatus(dom.chartImportStatus, message, isError);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

function pluralizeChartLabel(count: number) {
  return `chart${count === 1 ? '' : 's'}`;
}

function createTextElement(tagName: string, className: string, textContent: string): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = textContent;
  return element;
}

function createButton(label: string, className = 'home-primary-action'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  return button;
}

function createMetadataButton(label: string, onClick: (event: MouseEvent) => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'home-chart-entry-kebab chart-manage-metadata-button';
  button.setAttribute('aria-label', label);
  button.addEventListener('click', onClick);
  button.append(
    createTextElement('span', 'home-chart-entry-dot', ''),
    createTextElement('span', 'home-chart-entry-dot', ''),
    createTextElement('span', 'home-chart-entry-dot', '')
  );
  return button;
}

function getChartSubtitle(document: ChartDocument): string {
  const parts = [
    document.metadata?.composer,
    document.metadata?.styleReference || document.metadata?.style || document.metadata?.canonicalGroove,
    document.metadata?.origin === 'user' ? 'User chart' : getChartSourceRefs(document).map((ref) => ref.name).join(', ')
  ].map((part) => String(part || '').trim()).filter(Boolean);
  return [...new Set(parts)].join(' - ');
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

function getFilteredManageDocuments(): ChartDocument[] {
  const query = dom.manageChartSearchInput?.value || '';
  const origin = dom.manageOriginFilter?.value || '';
  const source = dom.manageSourceFilter?.value || '';
  const tag = dom.manageTagFilter?.value || '';
  const setlistId = dom.manageSetlistFilter?.value || '';
  const setlist = currentSetlists.find((candidate) => candidate.id === setlistId);
  const setlistChartIds = new Set((setlist?.items || []).map((item) => item.chartId));
  let documents = query ? filterChartDocuments(currentDocuments, query) : [...currentDocuments];
  if (origin) documents = documents.filter((document) => document.metadata?.origin === origin);
  if (source) documents = documents.filter((document) => getChartSourceRefs(document).some((ref) => ref.name === source));
  if (tag) documents = documents.filter((document) => (document.metadata?.userTags || []).some((candidate) => candidate === tag));
  if (setlistId) documents = documents.filter((document) => setlistChartIds.has(document.metadata.id));
  return documents;
}

function renderOptionList(select: HTMLSelectElement | null, label: string, values: string[], previousValue = '') {
  if (!select) return;
  const fallbackValue = previousValue || select.value;
  select.replaceChildren(new Option(label, ''));
  for (const value of values) select.append(new Option(value, value));
  if ([...select.options].some((option) => option.value === fallbackValue)) select.value = fallbackValue;
}

function renderFacets() {
  const facets = listChartLibraryFacets(currentDocuments, currentSetlists);
  renderOptionList(dom.manageSourceFilter, 'All sources', facets.sources);
  renderOptionList(dom.manageTagFilter, 'All tags', facets.tags);
  if (dom.manageSetlistFilter) {
    const previousValue = dom.manageSetlistFilter.value;
    dom.manageSetlistFilter.replaceChildren(new Option('All setlists', ''));
    for (const setlist of currentSetlists) dom.manageSetlistFilter.append(new Option(setlist.name, setlist.id));
    if ([...dom.manageSetlistFilter.options].some((option) => option.value === previousValue)) dom.manageSetlistFilter.value = previousValue;
  }
}

function renderGlobalSummary() {
  if (!dom.manageGlobalSummary) return;
  const facets = listChartLibraryFacets(currentDocuments, currentSetlists);
  const importedCount = currentDocuments.filter((document) => document.metadata?.origin !== 'user').length;
  const userCount = currentDocuments.filter((document) => document.metadata?.origin === 'user').length;
  const entries = [
    ['Total charts', currentDocuments.length],
    ['Imported', importedCount],
    ['User', userCount],
    ['Sources', facets.sources.length],
    ['Tags', facets.tags.length],
    ['Setlists', currentSetlists.length]
  ];
  dom.manageGlobalSummary.replaceChildren(...entries.map(([label, value]) => {
    const card = document.createElement('div');
    card.className = 'chart-manage-summary-card';
    card.append(createTextElement('strong', '', String(value)));
    card.append(createTextElement('span', '', String(label)));
    return card;
  }));
}

function renderManageCharts() {
  const documents = getFilteredManageDocuments();
  const visibleDocuments = documents.slice(0, VISIBLE_RESULT_LIMIT);
  if (dom.manageLibrarySummary) {
    const row = document.createElement('div');
    row.className = 'home-list-link home-chart-entry chart-manage-summary-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = 'minmax(0, 1fr)';
    row.style.alignItems = 'center';
    row.style.columnGap = '0.65rem';
    row.style.position = 'relative';
    row.style.paddingRight = '3.4rem';
    const summaryButton = document.createElement('button');
    summaryButton.type = 'button';
    summaryButton.className = 'chart-manage-summary-open';
    summaryButton.append(
      createTextElement('span', 'home-list-title', `${documents.length} matching track${documents.length === 1 ? '' : 's'}`),
      createTextElement('span', 'home-list-meta', resultsExpanded ? 'Click to hide' : 'Click to show')
    );
    summaryButton.addEventListener('click', () => {
      resultsExpanded = !resultsExpanded;
      renderManageCharts();
    });
    const metadataButton = createMetadataButton('Edit metadata for matching charts', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMatchingMetadataPanel();
    });
    row.append(summaryButton, metadataButton);
    dom.manageLibrarySummary.replaceChildren(row);
  }
  if (!dom.manageChartList) return;
  dom.manageChartList.toggleAttribute('hidden', !resultsExpanded);
  dom.manageChartList.replaceChildren();
  if (!resultsExpanded) return;
  for (const chartDocument of visibleDocuments) {
    const item = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'home-list-link chart-manage-chart-row';
    const link = document.createElement('a');
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('chart', chartDocument.metadata.id);
    link.href = targetUrl.toString();
    link.className = 'chart-manage-chart-link';
    link.append(createTextElement('span', 'home-list-title', chartDocument.metadata.title || 'Untitled chart'));
    const usage = getChartSetlistMembership(chartDocument.metadata.id, currentSetlists).map((setlist) => setlist.name);
    const subtitle = [getChartSubtitle(chartDocument), usage.length ? `Setlists: ${usage.join(', ')}` : ''].filter(Boolean).join(' - ');
    if (subtitle) link.append(createTextElement('span', 'home-list-meta', subtitle));
    const menuButton = createMetadataButton(`Edit metadata for ${chartDocument.metadata.title || 'chart'}`, (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMetadataPanel(chartDocument.metadata.id);
    });
    row.append(link, menuButton);
    item.append(row);
    dom.manageChartList.append(item);
  }
}

async function persistMetadataState({ documents, setlists }: { documents: ChartDocument[]; setlists: ChartSetlist[] }, statusMessage: string) {
  const persistedLibrary = await persistChartLibrary({ documents, source: currentSource, mergeWithExisting: false });
  currentDocuments = persistedLibrary?.documents || documents;
  currentSource = persistedLibrary?.source || currentSource;
  currentSetlists = await persistSetlists(setlists);
  setImportStatus(statusMessage);
  renderManageUi();
}

function openMetadataPanel(chartId: string) {
  if (!dom.manageMetadataPanel) return;
  openChartMetadataPanel({
    host: dom.manageMetadataPanel,
    target: { kind: 'single', chartId },
    getState: () => ({ documents: currentDocuments, setlists: currentSetlists }),
    persistState: persistMetadataState
  });
}

function openMatchingMetadataPanel() {
  if (!dom.manageMetadataPanel) return;
  openChartMetadataPanel({
    host: dom.manageMetadataPanel,
    target: {
      kind: 'batch',
      title: 'Matching charts',
      getChartIds: () => getFilteredManageDocuments().map((document) => document.metadata.id)
    },
    getState: () => ({ documents: currentDocuments, setlists: currentSetlists }),
    persistState: persistMetadataState
  });
}

function closeMetadataPanel() {
  closeChartMetadataPanel(dom.manageMetadataPanel);
}

function renderSetlists() {
  if (!dom.manageSetlistList) return;
  dom.manageSetlistList.replaceChildren();
  for (const setlist of currentSetlists) {
    const item = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'home-list-link chart-manage-setlist-row';
    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'chart-manage-setlist-open';
    label.append(createTextElement('span', 'home-list-title', setlist.name));
    label.append(createTextElement('span', 'home-list-meta', `${setlist.items.length} ${pluralizeChartLabel(setlist.items.length)} - manual playback`));
    label.addEventListener('click', () => {
      activeSetlistId = setlist.id;
      renderSetlistDetail();
    });
    const playLink = document.createElement('a');
    playLink.className = 'chart-manage-small-action';
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('setlist', setlist.id);
    playLink.href = targetUrl.toString();
    playLink.textContent = 'Play';
    row.append(label, playLink);
    item.append(row);
    dom.manageSetlistList.append(item);
  }
  renderSetlistDetail();
}

function renderSetlistDetail() {
  if (!dom.manageSetlistDetail) return;
  const setlist = currentSetlists.find((candidate) => candidate.id === activeSetlistId);
  dom.manageSetlistDetail.hidden = !setlist;
  dom.manageSetlistDetail.replaceChildren();
  if (!setlist) return;
  const documentsById = new Map(currentDocuments.map((document) => [document.metadata.id, document]));
  dom.manageSetlistDetail.append(createTextElement('h3', '', `Manage ${setlist.name}`));
  const list = document.createElement('ol');
  list.className = 'chart-manage-ordered-list';
  setlist.items.forEach((item, index) => {
    const chartDocument = documentsById.get(item.chartId);
    const row = document.createElement('li');
    row.draggable = true;
    row.dataset.index = String(index);
    row.append(createTextElement('span', 'home-list-title', chartDocument?.metadata.title || item.chartId));
    const upButton = createButton('Up', 'chart-manage-small-action');
    const downButton = createButton('Down', 'chart-manage-small-action');
    const removeButton = createButton('Remove', 'chart-manage-small-action chart-manage-danger');
    upButton.disabled = index === 0;
    downButton.disabled = index === setlist.items.length - 1;
    upButton.addEventListener('click', () => updateSetlistItems(setlist.id, reorderSetlistItems(setlist.items, index, index - 1), 'Setlist reordered.'));
    downButton.addEventListener('click', () => updateSetlistItems(setlist.id, reorderSetlistItems(setlist.items, index, index + 1), 'Setlist reordered.'));
    removeButton.addEventListener('click', () => updateSetlistItems(setlist.id, setlist.items.filter((_, itemIndex) => itemIndex !== index), 'Removed setlist entry.'));
    row.addEventListener('dragstart', (event) => event.dataTransfer?.setData('text/plain', String(index)));
    row.addEventListener('dragover', (event) => event.preventDefault());
    row.addEventListener('drop', (event) => {
      event.preventDefault();
      const fromIndex = Number(event.dataTransfer?.getData('text/plain'));
      updateSetlistItems(setlist.id, reorderSetlistItems(setlist.items, fromIndex, index), 'Setlist reordered.');
    });
    row.append(upButton, downButton, removeButton);
    list.append(row);
  });
  dom.manageSetlistDetail.append(list);
}

function updateSetlistItems(setlistId: string, items: ChartSetlist['items'], statusMessage: string) {
  currentSetlists = currentSetlists.map((setlist) => setlist.id === setlistId
    ? { ...setlist, items, updatedAt: new Date().toISOString() }
    : setlist);
  void persistSetlists(currentSetlists).then((setlists) => {
    currentSetlists = setlists;
    setImportStatus(statusMessage);
    renderManageUi();
  }).catch((error) => setImportStatus(`Failed to update setlist: ${getErrorMessage(error)}`, true));
}

async function createSetlist() {
  const name = String(dom.manageSetlistNameInput?.value || '').trim();
  if (!name) {
    setImportStatus('Name the setlist first.', true);
    return;
  }
  currentSetlists = await persistSetlists([...currentSetlists, createEmptyChartSetlist(name)]);
  if (dom.manageSetlistNameInput) dom.manageSetlistNameInput.value = '';
  setImportStatus(`Created empty setlist "${name}".`);
  renderManageUi();
}

function renderManageUi() {
  renderFacets();
  renderGlobalSummary();
  renderManageCharts();
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
    const persistedLibrary = await persistChartLibrary({ documents, source: sourceFile, mergeWithExisting: true });
    if (!persistedLibrary || persistedLibrary.documents.length === 0) throw new Error('The imported chart library could not be confirmed in persistent storage.');
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
    await importFromRawText(await file.text(), file.name);
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
    setImportStatus(pendingResult.errorMessage ? `iReal link detected, but the captured text could not be loaded: ${pendingResult.errorMessage}` : 'iReal link detected, but the captured text could not be loaded. Open the forum tracks and tap the link again.', true);
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
    // Keep listener active.
  }
  appPlugin.addListener('appUrlOpen', ({ url }: { url?: string }) => handleIncomingUrl(String(url || '')));
}

bindChartImportControls({
  importIRealBackupButton: dom.importIRealBackupButton,
  irealBackupInput: dom.irealBackupInput,
  openIRealForumButton: dom.openIRealForumButton,
  forumTracksUrl: IREAL_FORUM_TRACKS_URL,
  setImportStatus,
  onBackupFileSelection: handleBackupFileSelection,
  onOpenForumTracks: () => openIrealBrowser({ url: IREAL_FORUM_TRACKS_URL, title: 'Click on a link to import' })
});

void bindIncomingMobileIRealImports().then(() => importPendingMobileIRealLink());

dom.clearAllChartsButton?.addEventListener('click', async () => {
  try {
    await clearPersistedChartLibrary();
    currentDocuments = [];
    currentSetlists = [];
    closeMetadataPanel();
    setImportStatus('All charts removed.');
    renderManageUi();
  } catch (error) {
    setImportStatus(`Failed to remove charts: ${getErrorMessage(error)}`, true);
  }
});

[dom.manageChartSearchInput, dom.manageOriginFilter, dom.manageSourceFilter, dom.manageTagFilter, dom.manageSetlistFilter].forEach((element) => {
  element?.addEventListener('input', renderManageCharts);
  element?.addEventListener('change', renderManageCharts);
});
dom.manageCreateSetlistButton?.addEventListener('click', () => {
  void createSetlist().catch((error) => setImportStatus(`Failed to create setlist: ${getErrorMessage(error)}`, true));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMetadataPanel();
});

void loadManageState().catch((error) => {
  setImportStatus(`Failed to load chart library: ${getErrorMessage(error)}`, true);
});
