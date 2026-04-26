import { createChartDocumentsFromIRealText } from './chart/index.js';
import { initializeSharpElevenTheme } from './src/features/app/app-theme.js';
import {
  consumePendingIRealLinkResult,
  isIRealDeepLink,
  storePendingIRealLink
} from './src/features/app/app-pending-mobile-import.js';
import { openIrealBrowser } from './src/features/app/ireal-browser.js';
import {
  loadPersistedChartLibrary,
  loadPersistedSetlists,
  persistChartLibrary,
  persistSetlists
} from './src/features/chart/chart-persistence.js';
import {
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
const CHIP_FILTER_OPTION_LIMIT = 12;
const CHART_MANAGE_FILTER_KEYS = ['origin', 'source', 'tag', 'setlist'] as const;
const FILTER_ACTION_ALL = '__all__';
const FILTER_ACTION_NONE = '__none__';

type ChartManageFilterKey = typeof CHART_MANAGE_FILTER_KEYS[number];
type ChartManageFilterMode = 'all' | 'custom';
type ChartManageFilterOption = {
  label: string;
  value: string;
};

const dom = {
  importIRealBackupButton: document.getElementById('import-ireal-backup-button') as HTMLButtonElement | null,
  openIRealForumButton: document.getElementById('open-ireal-forum-button') as HTMLButtonElement | null,
  irealBackupInput: document.getElementById('ireal-backup-input') as HTMLInputElement | null,
  irealImportActions: document.getElementById('ireal-import-actions'),
  irealLinkInput: document.getElementById('ireal-link-input') as HTMLInputElement | null,
  importIRealLinkButton: document.getElementById('import-ireal-link-button') as HTMLButtonElement | null,
  irealLinkImportSection: document.getElementById('ireal-link-import-section'),
  chartImportStatus: document.getElementById('chart-import-status'),
  manageChartSearchInput: document.getElementById('manage-chart-search-input') as HTMLInputElement | null,
  manageOriginFilterRow: document.getElementById('manage-origin-filter-row'),
  manageOriginFilter: document.getElementById('manage-origin-filter') as HTMLSelectElement | null,
  manageOriginFilterChips: document.getElementById('manage-origin-filter-chips'),
  manageSourceFilterRow: document.getElementById('manage-source-filter-row'),
  manageSourceFilter: document.getElementById('manage-source-filter') as HTMLSelectElement | null,
  manageSourceFilterChips: document.getElementById('manage-source-filter-chips'),
  manageTagFilterRow: document.getElementById('manage-tag-filter-row'),
  manageTagFilter: document.getElementById('manage-tag-filter') as HTMLSelectElement | null,
  manageTagFilterChips: document.getElementById('manage-tag-filter-chips'),
  manageSetlistFilterRow: document.getElementById('manage-setlist-filter-row'),
  manageSetlistFilter: document.getElementById('manage-setlist-filter') as HTMLSelectElement | null,
  manageSetlistFilterChips: document.getElementById('manage-setlist-filter-chips'),
  manageLibrarySummary: document.getElementById('manage-library-summary'),
  manageChartList: document.getElementById('manage-chart-list'),
  manageSetlistsSection: document.getElementById('manage-setlists-section'),
  manageSetlistList: document.getElementById('manage-setlist-list'),
  manageMetadataPanel: document.getElementById('manage-metadata-panel')
};

let currentDocuments: ChartDocument[] = [];
let currentSource = 'imported library';
let currentSetlists: ChartSetlist[] = [];
let resultsExpanded = false;
let activeSetlistMenuId = '';
let draggedSetlistItem: { setlistId: string; index: number } | null = null;
const activeManageFilters: Record<ChartManageFilterKey, Set<string>> = {
  origin: new Set(),
  source: new Set(),
  tag: new Set(),
  setlist: new Set()
};
const activeManageFilterModes: Record<ChartManageFilterKey, ChartManageFilterMode> = {
  origin: 'all',
  source: 'all',
  tag: 'all',
  setlist: 'all'
};

function setImportStatus(message: string, isError = false) {
  setChartImportStatus(dom.chartImportStatus, message, isError);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

function pluralizeChartLabel(count: number) {
  return `chart${count === 1 ? '' : 's'}`;
}

function isNativePlatform() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

function applyImportModeVisibility() {
  const isNative = isNativePlatform();
  if (dom.irealImportActions) {
    dom.irealImportActions.hidden = !isNative;
  }
  if (dom.irealLinkImportSection) {
    dom.irealLinkImportSection.hidden = isNative;
  }
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
  button.className = 'home-chart-entry-kebab';
  button.setAttribute('aria-label', label);
  button.addEventListener('pointerdown', (event) => event.stopPropagation());
  button.addEventListener('mousedown', (event) => event.stopPropagation());
  button.addEventListener('click', onClick);
  return button;
}

function getChartSubtitle(document: ChartDocument): string {
  const asText = (value: unknown): string => {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value !== 'string') return '';
    return value.trim();
  };
  const parts: string[] = [];
  const pushIfDistinct = (value: unknown): void => {
    const normalized = asText(value);
    if (!normalized || parts.includes(normalized)) return;
    parts.push(normalized);
  };
  const metadata = document.metadata;
  pushIfDistinct(metadata.composer);
  pushIfDistinct(metadata.artist);
  pushIfDistinct(metadata.author);
  pushIfDistinct(metadata['leadArtist']);
  pushIfDistinct(metadata['albumArtist']);
  pushIfDistinct(metadata.styleReference);
  pushIfDistinct(metadata.style);
  return parts.join(' - ');
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
  const origins = activeManageFilters.origin;
  const sources = activeManageFilters.source;
  const tags = activeManageFilters.tag;
  const setlistIds = activeManageFilters.setlist;
  const hasOriginFilter = activeManageFilterModes.origin === 'custom';
  const hasSourceFilter = activeManageFilterModes.source === 'custom';
  const hasTagFilter = activeManageFilterModes.tag === 'custom';
  const hasSetlistFilter = activeManageFilterModes.setlist === 'custom';
  const setlistChartIds = new Set(
    currentSetlists
      .filter((candidate) => setlistIds.has(candidate.id))
      .flatMap((setlist) => setlist.items.map((item) => item.chartId))
  );
  let documents = query ? filterChartDocuments(currentDocuments, query) : [...currentDocuments];
  if ([hasOriginFilter && origins.size === 0, hasSourceFilter && sources.size === 0, hasTagFilter && tags.size === 0, hasSetlistFilter && setlistIds.size === 0].some(Boolean)) {
    return [];
  }
  if (hasOriginFilter) documents = documents.filter((document) => origins.has(document.metadata?.origin === 'user' ? 'user' : 'imported'));
  if (hasSourceFilter) documents = documents.filter((document) => getChartSourceRefs(document).some((ref) => sources.has(ref.name)));
  if (hasTagFilter) documents = documents.filter((document) => (document.metadata?.userTags || []).some((candidate) => tags.has(candidate)));
  if (hasSetlistFilter) documents = documents.filter((document) => setlistChartIds.has(document.metadata.id));
  return documents;
}

function getFilterOptionValues(values: ChartManageFilterOption[]) {
  return values.map((option) => option.value);
}

function getSelectFilterOptions(select: HTMLSelectElement): ChartManageFilterOption[] {
  return Array.from(select.options)
    .filter((option) => option.value && option.value !== FILTER_ACTION_ALL && option.value !== FILTER_ACTION_NONE)
    .map((option) => ({ label: option.textContent?.replace(/^Selected - /, '') || option.value, value: option.value }));
}

function isFilterAllSelected(key: ChartManageFilterKey, values: ChartManageFilterOption[]) {
  const active = activeManageFilters[key];
  return activeManageFilterModes[key] === 'all'
    || (values.length > 0 && active.size === values.length && values.every((option) => active.has(option.value)));
}

function getSelectedFilterCount(key: ChartManageFilterKey, values: ChartManageFilterOption[]) {
  return isFilterAllSelected(key, values) ? values.length : activeManageFilters[key].size;
}

function selectFilterValue(key: ChartManageFilterKey, value: string, values: ChartManageFilterOption[]) {
  const active = activeManageFilters[key];
  if (value === FILTER_ACTION_ALL) {
    activeManageFilterModes[key] = 'all';
    active.clear();
  } else if (value === FILTER_ACTION_NONE) {
    activeManageFilterModes[key] = 'custom';
    active.clear();
  } else if (activeManageFilterModes[key] === 'all') {
    activeManageFilterModes[key] = 'custom';
    active.clear();
    getFilterOptionValues(values).forEach((optionValue) => active.add(optionValue));
    active.delete(value);
  } else if (active.has(value)) {
    active.delete(value);
  } else {
    active.add(value);
  }
  renderFacets();
  renderManageCharts();
}

function keepValidFilterValues(key: ChartManageFilterKey, values: ChartManageFilterOption[]) {
  const validValues = new Set(values.map((option) => option.value));
  activeManageFilters[key].forEach((value) => {
    if (!validValues.has(value)) activeManageFilters[key].delete(value);
  });
  if (values.length <= 1) {
    activeManageFilterModes[key] = 'all';
    activeManageFilters[key].clear();
  } else if (isFilterAllSelected(key, values)) {
    activeManageFilterModes[key] = 'all';
    activeManageFilters[key].clear();
  }
}

function setElementHidden(element: HTMLElement | null, shouldHide: boolean) {
  if (element) element.hidden = shouldHide;
}

function renderOptionList(select: HTMLSelectElement | null, label: string, values: ChartManageFilterOption[]) {
  if (!select) return;
  const active = activeManageFilters[select.dataset.filterKey as ChartManageFilterKey];
  const allSelected = isFilterAllSelected(select.dataset.filterKey as ChartManageFilterKey, values);
  const selectedCount = getSelectedFilterCount(select.dataset.filterKey as ChartManageFilterKey, values);
  select.replaceChildren(new Option(`${selectedCount}/${values.length} selected`, ''));
  select.append(new Option(label, FILTER_ACTION_ALL));
  select.append(new Option('None', FILTER_ACTION_NONE));
  for (const { label: optionLabel, value } of values) {
    select.append(new Option(allSelected || active?.has(value) ? `Selected - ${optionLabel}` : optionLabel, value));
  }
  select.value = '';
}

function renderFilterChips(host: HTMLElement | null, key: ChartManageFilterKey, values: ChartManageFilterOption[]) {
  if (!host) return;
  const active = activeManageFilters[key];
  const isAllSelected = isFilterAllSelected(key, values);
  const isNoneSelected = activeManageFilterModes[key] === 'custom' && active.size === 0;
  host.replaceChildren();
  const buttons = [
    { label: 'All', value: FILTER_ACTION_ALL },
    { label: 'None', value: FILTER_ACTION_NONE },
    ...values
  ].map(({ label, value }) => {
    const button = createButton(label, 'chart-manage-filter-chip');
    const isActive = value === FILTER_ACTION_ALL
      ? isAllSelected
      : value === FILTER_ACTION_NONE
        ? isNoneSelected
        : isAllSelected || active.has(value);
    button.setAttribute('aria-pressed', String(isActive));
    if (isActive) button.classList.add('is-active');
    button.addEventListener('click', () => selectFilterValue(key, value, values));
    return button;
  });
  host.append(...buttons);
}

function renderFilterControl({
  key,
  row,
  select,
  chipHost,
  allLabel,
  values
}: {
  key: ChartManageFilterKey;
  row: HTMLElement | null;
  select: HTMLSelectElement | null;
  chipHost: HTMLElement | null;
  allLabel: string;
  values: ChartManageFilterOption[];
}) {
  keepValidFilterValues(key, values);
  const shouldHide = values.length <= 1;
  const shouldUseChips = !shouldHide && values.length <= CHIP_FILTER_OPTION_LIMIT;
  if (select) select.dataset.filterKey = key;
  renderOptionList(select, allLabel, values);
  renderFilterChips(chipHost, key, values);
  setElementHidden(row, shouldHide);
  setElementHidden(select, shouldHide || shouldUseChips);
  setElementHidden(chipHost, shouldHide || !shouldUseChips);
}

function renderFacets() {
  const facets = listChartLibraryFacets(currentDocuments, currentSetlists);
  const originOptions = [
    currentDocuments.some((document) => document.metadata?.origin !== 'user') ? { label: 'Imported', value: 'imported' } : null,
    currentDocuments.some((document) => document.metadata?.origin === 'user') ? { label: 'User', value: 'user' } : null
  ].filter(Boolean) as ChartManageFilterOption[];
  renderFilterControl({
    key: 'origin',
    row: dom.manageOriginFilterRow,
    select: dom.manageOriginFilter,
    chipHost: dom.manageOriginFilterChips,
    allLabel: 'All origins',
    values: originOptions
  });
  renderFilterControl({
    key: 'source',
    row: dom.manageSourceFilterRow,
    select: dom.manageSourceFilter,
    chipHost: dom.manageSourceFilterChips,
    allLabel: 'All sources',
    values: facets.sources.map((source) => ({ label: source, value: source }))
  });
  renderFilterControl({
    key: 'tag',
    row: dom.manageTagFilterRow,
    select: dom.manageTagFilter,
    chipHost: dom.manageTagFilterChips,
    allLabel: 'All tags',
    values: facets.tags.map((tag) => ({ label: tag, value: tag }))
  });
  renderFilterControl({
    key: 'setlist',
    row: dom.manageSetlistFilterRow,
    select: dom.manageSetlistFilter,
    chipHost: dom.manageSetlistFilterChips,
    allLabel: 'All setlists',
    values: currentSetlists.map((setlist) => ({ label: setlist.name, value: setlist.id }))
  });
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
      createTextElement('span', 'home-list-title', `${documents.length} matching chart${documents.length === 1 ? '' : 's'}`),
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
    const subtitle = getChartSubtitle(chartDocument);
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
  if (!dom.manageSetlistsSection || !dom.manageSetlistList) return;
  const hasSetlists = currentSetlists.length > 0;
  dom.manageSetlistsSection.hidden = !hasSetlists;
  dom.manageSetlistList.replaceChildren();
  if (!hasSetlists) return;
  const documentsById = new Map(currentDocuments.map((document) => [document.metadata.id, document]));

  for (const setlist of currentSetlists) {
    const item = document.createElement('li');
    item.className = 'chart-manage-setlist-entry';

    const row = document.createElement('div');
    row.className = 'home-list-link chart-manage-setlist-row';

    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('setlist', setlist.id);
    const link = document.createElement('a');
    link.className = 'chart-manage-setlist-open';
    link.href = targetUrl.toString();
    link.append(
      createTextElement('span', 'home-list-title', setlist.name),
      createTextElement('span', 'home-list-meta', `${setlist.items.length} ${pluralizeChartLabel(setlist.items.length)}`)
    );

    const menuButton = createMetadataButton(`Manage ${setlist.name}`, (event) => {
      event.preventDefault();
      event.stopPropagation();
      activeSetlistMenuId = activeSetlistMenuId === setlist.id ? '' : setlist.id;
      renderSetlists();
    });
    row.append(link, menuButton);
    item.append(row);

    if (activeSetlistMenuId === setlist.id) item.append(renderSetlistMenu(setlist));

    const childList = document.createElement('ul');
    childList.className = 'home-list chart-manage-setlist-chart-list';
    setlist.items.forEach((setlistItem, index) => {
      const chartDocument = documentsById.get(setlistItem.chartId);
      const childItem = document.createElement('li');
      const childRow = document.createElement('div');
      childRow.className = 'home-list-link chart-manage-chart-row chart-manage-setlist-chart-row';
      childRow.draggable = true;
      childRow.dataset.setlistId = setlist.id;
      childRow.dataset.index = String(index);
      childRow.addEventListener('dragstart', (event) => {
        draggedSetlistItem = { setlistId: setlist.id, index };
        event.dataTransfer?.setData('text/plain', `${setlist.id}:${index}`);
        event.dataTransfer?.setDragImage(childRow, 12, 12);
      });
      childRow.addEventListener('dragend', () => {
        draggedSetlistItem = null;
      });
      childRow.addEventListener('dragover', (event) => {
        if (draggedSetlistItem?.setlistId !== setlist.id) return;
        event.preventDefault();
      });
      childRow.addEventListener('drop', (event) => {
        event.preventDefault();
        moveSetlistItem(setlist.id, draggedSetlistItem?.index ?? -1, index);
      });

      const childLink = document.createElement('a');
      childLink.className = 'chart-manage-chart-link';
      const chartUrl = new URL('./chart/index.html', window.location.href);
      chartUrl.searchParams.set('chart', setlistItem.chartId);
      childLink.href = chartUrl.toString();
      childLink.append(createTextElement('span', 'home-list-title', chartDocument?.metadata.title || setlistItem.chartId));

      const removeButton = createMetadataButton(`Remove ${chartDocument?.metadata.title || 'chart'} from ${setlist.name}`, (event) => {
        event.preventDefault();
        event.stopPropagation();
        removeSetlistItem(setlist.id, index);
      });
      childRow.append(childLink, removeButton);
      childItem.append(childRow);
      childList.append(childItem);
    });
    item.append(childList);
    dom.manageSetlistList.append(item);
  }
}

function renderSetlistMenu(setlist: ChartSetlist): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'chart-manage-setlist-menu';
  const renameButton = createButton('Rename', 'chart-manage-small-action');
  renameButton.addEventListener('click', () => renameSetlist(setlist));
  const deleteButton = createButton('Delete', 'chart-manage-small-action chart-manage-danger');
  deleteButton.addEventListener('click', () => deleteSetlist(setlist));
  menu.append(renameButton, deleteButton);
  return menu;
}

function persistSetlistChanges(setlists: ChartSetlist[], statusMessage: string) {
  currentSetlists = setlists;
  void persistSetlists(currentSetlists).then((persistedSetlists) => {
    currentSetlists = persistedSetlists;
    setImportStatus(statusMessage);
    renderManageUi();
  }).catch((error) => setImportStatus(`Failed to update setlists: ${getErrorMessage(error)}`, true));
}

function updateSetlistItems(setlistId: string, items: ChartSetlist['items'], statusMessage: string) {
  persistSetlistChanges(currentSetlists.map((setlist) => setlist.id === setlistId
    ? { ...setlist, items, updatedAt: new Date().toISOString() }
    : setlist), statusMessage);
}

function moveSetlistItem(setlistId: string, fromIndex: number, toIndex: number) {
  const setlist = currentSetlists.find((candidate) => candidate.id === setlistId);
  if (!setlist || fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
  updateSetlistItems(setlistId, reorderSetlistItems(setlist.items, fromIndex, toIndex), 'Setlist reordered.');
}

function removeSetlistItem(setlistId: string, itemIndex: number) {
  const setlist = currentSetlists.find((candidate) => candidate.id === setlistId);
  if (!setlist) return;
  updateSetlistItems(setlistId, setlist.items.filter((_, index) => index !== itemIndex), 'Removed chart from setlist.');
}

function renameSetlist(setlist: ChartSetlist) {
  const name = window.prompt('Rename setlist', setlist.name)?.trim();
  if (!name || name === setlist.name) return;
  activeSetlistMenuId = '';
  persistSetlistChanges(currentSetlists.map((candidate) => candidate.id === setlist.id
    ? { ...candidate, name, updatedAt: new Date().toISOString() }
    : candidate), 'Setlist renamed.');
}

function deleteSetlist(setlist: ChartSetlist) {
  if (!window.confirm(`Delete "${setlist.name}"?`)) return;
  activeSetlistMenuId = '';
  persistSetlistChanges(currentSetlists.filter((candidate) => candidate.id !== setlist.id), 'Setlist deleted.');
}

function renderManageUi() {
  renderFacets();
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

async function handlePastedIRealLinkImport() {
  const rawText = dom.irealLinkInput?.value || '';
  try {
    await importFromRawText(rawText, 'pasted-ireal-link');
  } finally {
    if (dom.irealLinkInput) {
      dom.irealLinkInput.value = '';
    }
  }
}

async function importPendingMobileIRealLink() {
  const pendingResult = await consumePendingIRealLinkResult();
  const pendingIRealLink = pendingResult.url;
  if (!pendingIRealLink && pendingResult.hadPendingMarker) {
    setImportStatus(pendingResult.errorMessage ? `iReal link detected, but the captured text could not be loaded: ${pendingResult.errorMessage}` : 'iReal link detected, but the captured text could not be loaded. Open the forum charts and tap the link again.', true);
    return;
  }
  if (!pendingIRealLink) return;
  setImportStatus('iReal link captured. Importing charts...');
  await importFromRawText(pendingIRealLink, 'pasted-ireal-link');
}

async function bindIncomingMobileIRealImports() {
  if (!isNativePlatform()) return;
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

function bindImportControls() {
  if (!isNativePlatform()) return;
  bindChartImportControls({
    importIRealBackupButton: dom.importIRealBackupButton,
    irealBackupInput: dom.irealBackupInput,
    openIRealForumButton: dom.openIRealForumButton,
    forumTracksUrl: IREAL_FORUM_TRACKS_URL,
    setImportStatus,
    onBackupFileSelection: handleBackupFileSelection,
    onOpenForumTracks: () => openIrealBrowser({ url: IREAL_FORUM_TRACKS_URL, title: 'Click on a link to import' })
  });
}

function bindWebIRealLinkImport() {
  dom.importIRealLinkButton?.addEventListener('click', () => {
    void handlePastedIRealLinkImport();
  });
  dom.irealLinkInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void handlePastedIRealLinkImport();
  });
}

applyImportModeVisibility();
bindImportControls();
bindWebIRealLinkImport();
void bindIncomingMobileIRealImports().then(() => {
  if (!isNativePlatform()) return;
  void importPendingMobileIRealLink();
});

dom.manageChartSearchInput?.addEventListener('input', renderManageCharts);
[dom.manageOriginFilter, dom.manageSourceFilter, dom.manageTagFilter, dom.manageSetlistFilter].forEach((element) => {
  element?.addEventListener('change', () => {
    const key = element.dataset.filterKey as ChartManageFilterKey | undefined;
    if (!key || !element.value) return;
    selectFilterValue(key, element.value, getSelectFilterOptions(element));
  });
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMetadataPanel();
});

void loadManageState().catch((error) => {
  setImportStatus(`Failed to load chart library: ${getErrorMessage(error)}`, true);
});
