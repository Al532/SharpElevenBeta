import { initializeSharpElevenTheme } from '../app/app-theme.js';
import {
  loadPersistedChartLibrary,
  loadPersistedSetlists,
  persistChartLibrary,
  persistSetlists,
  removePersistedChartReferences
} from '../chart/chart-persistence.js';
import {
  applyBatchMetadataOperation,
  createEmptyChartSetlist,
  filterChartDocuments,
  getChartSourceRefs,
  getChartSetlistMembership,
  previewProtectedChartDelete,
  reorderSetlistItems
} from '../chart/chart-library.js';
import { writeChartLibrarySubsetSession } from '../chart/chart-library-subset-session.js';
import type { ChartDocument, ChartSetlist } from '../../core/types/contracts';
import {
  createChartEntryActionsController,
  createChartEntryMenuButton
} from '../chart/chart-entry-actions.js';
import {
  positionChartEntryMenu,
  type ChartEntryMenuPlacement
} from '../chart/chart-entry-menu-positioning.js';
import { createChartManagementDomRefs } from './chart-management-dom.js';
import {
  CHART_MANAGE_FILTER_KEYS,
  FILTER_SOURCE_USER_CHARTS,
  type ChartManageFilterKey,
  type ChartManageFilterMode,
  type ChartManageFilterOption,
  type ChartManagementMode,
  type SetlistDragItem
} from './chart-management-types.js';
import {
  createChartManagementDocumentIndex,
  createChartManagementFilterState,
  getFilteredChartManagementDocuments,
  getSelectFilterOptions,
  renderChartManagementFacets,
  selectChartManagementFilterValue,
  type ChartManagementDocumentIndex
} from './chart-management-filters.js';
import {
  createButton,
  createMetadataButton,
  createTextElement,
  getChartSubtitle,
  getErrorMessage,
  pluralizeChartLabel,
  setImportStatus,
  updateChartEntrySubtitleVisibility
} from './chart-management-view-helpers.js';
import {
  clearSetlistDropPreview,
  getDraggedLibraryChartId as getDraggedLibraryChartIdFromEvent,
  getSetlistDropTargetAtPoint,
  hasDraggedLibraryChart as hasDraggedLibraryChartState,
  showSetlistDropPreview
} from './chart-management-dnd.js';

let activeMode: ChartManagementMode = 'library';

function getPageClassName(name: string) {
  return `${activeMode}-${name}`;
}

function getPageChartLinkSelector() {
  return `.${getPageClassName('chart-link')}`;
}

const dom = createChartManagementDomRefs(document);

let currentDocuments: ChartDocument[] = [];
let isFullManageStateLoaded = false;
let currentSource = 'imported library';
let currentSetlists: ChartSetlist[] = [];
let activeSetlistMenuId = '';
let activeSetlistItemMenuKey = '';
let setlistActionMenu: HTMLElement | null = null;
let setlistActionMenuAnchor: HTMLElement | null = null;
let setlistActionMenuPlacement: ChartEntryMenuPlacement = 'anchored';
let pendingSetlistActionMenuPositionFrame = 0;
let addChartPopup: HTMLElement | null = null;
let draggedSetlistItem: SetlistDragItem | null = null;
let draggedLibraryChartId = '';
let setlistPointerStart: { x: number; y: number } | null = null;
let setlistPointerCurrent: { x: number; y: number } | null = null;
let setlistPointerId: number | null = null;
let setlistPointerType = '';
let setlistItemDragActivationTimer: ReturnType<typeof window.setTimeout> | null = null;
let isSetlistItemDragActive = false;
let isSetlistItemScrollActive = false;
let isCreateSetlistVisible = false;
let renamingSetlistId = '';
let pendingDeleteSetlistId = '';
const SETLIST_ITEM_DRAG_DELAY_MS = 240;
const SETLIST_ITEM_TAP_DISTANCE_PX = 6;
const LIBRARY_PREVIEW_ROW_HEIGHT_PX = 40;
const LIBRARY_PREVIEW_BOTTOM_GAP_PX = 4;
const CHART_MANAGEMENT_SESSION_CACHE_KEY = 'sharp-eleven-chart-management-session-cache-v1';
const CHART_MANAGEMENT_LIBRARY_FILTERS_KEY = 'sharp-eleven-library-filters-v1';
const collapsedSetlistIds = new Set<string>();
const filterState = createChartManagementFilterState();
let currentDocumentIndex: ChartManagementDocumentIndex = createChartManagementDocumentIndex([]);
let libraryPreviewStartIndex = 0;
let libraryPreviewPageSize = 1;
let libraryPreviewResizeFrame = 0;
let libraryDeleteReviewIncludesSetlisted = false;
let libraryDeleteReviewConfirmationVisible = false;
let libraryDeleteReviewConfirmationReadyAt = 0;
let libraryDeleteReviewConfirmationTimer: ReturnType<typeof window.setTimeout> | null = null;
let chartEntryActions: ReturnType<typeof createChartEntryActionsController> | null = null;

type ChartManagementCachedDocument = {
  id: string;
  title: string;
  composer?: string;
  style?: string;
  styleReference?: string;
  sourceRefs?: ChartDocument['source']['sourceRefs'];
};

type ChartManagementSessionCache = {
  version: 1;
  source: string;
  documents: ChartManagementCachedDocument[];
  setlists: ChartSetlist[];
  savedAt: number;
};

type ChartManagementPersistedFilter = {
  mode: ChartManageFilterMode;
  values: string[];
};

type ChartManagementPersistedLibraryFilters = {
  version: 1;
  query: string;
  filters: Partial<Record<ChartManageFilterKey, ChartManagementPersistedFilter>>;
  savedAt: number;
};

type DeleteReviewPlan = {
  activeSourceName: string;
  deleteDocuments: ChartDocument[];
  protectedDocuments: ChartDocument[];
  setlistedDeleteDocuments: ChartDocument[];
  skippedDocuments: ChartDocument[];
  sourceRefOnlyDocuments: ChartDocument[];
  setlistEntryDeleteCount: number;
};

function setCurrentDocuments(documents: ChartDocument[]): void {
  currentDocuments = documents;
  currentDocumentIndex = createChartManagementDocumentIndex(documents);
}

function isManageActionReady(): boolean {
  return isFullManageStateLoaded;
}

function toCachedDocument(document: ChartDocument): ChartManagementCachedDocument | null {
  const id = String(document.metadata?.id || '').trim();
  if (!id) return null;
  return {
    id,
    title: String(document.metadata?.title || '').trim() || 'Untitled chart',
    composer: typeof document.metadata?.composer === 'string' ? document.metadata.composer : '',
    style: typeof document.metadata?.style === 'string' ? document.metadata.style : '',
    styleReference: typeof document.metadata?.styleReference === 'string' ? document.metadata.styleReference : '',
    sourceRefs: getChartSourceRefs(document)
  };
}

function createDocumentFromCache(cachedDocument: ChartManagementCachedDocument): ChartDocument | null {
  const id = String(cachedDocument.id || '').trim();
  if (!id) return null;
  const sourceRefs = Array.isArray(cachedDocument.sourceRefs) ? cachedDocument.sourceRefs : [];
  return {
    schemaVersion: '1.0.0',
    metadata: {
      id,
      title: String(cachedDocument.title || '').trim() || 'Untitled chart',
      composer: String(cachedDocument.composer || ''),
      style: String(cachedDocument.style || ''),
      styleReference: String(cachedDocument.styleReference || '')
    },
    source: {
      sourceRefs,
      ...(sourceRefs[0]?.name ? { playlistName: sourceRefs[0].name } : {})
    },
    sections: [],
    bars: [],
    layout: null
  };
}

function readChartManagementSessionCache(): ChartManagementSessionCache | null {
  try {
    const rawCache = window.sessionStorage.getItem(CHART_MANAGEMENT_SESSION_CACHE_KEY);
    if (!rawCache) return null;
    const cache = JSON.parse(rawCache) as Partial<ChartManagementSessionCache>;
    if (cache.version !== 1 || !Array.isArray(cache.documents) || !Array.isArray(cache.setlists)) return null;
    return {
      version: 1,
      source: String(cache.source || 'imported library'),
      documents: cache.documents,
      setlists: cache.setlists,
      savedAt: Number(cache.savedAt || 0)
    };
  } catch {
    return null;
  }
}

function writeChartManagementSessionCache(): void {
  const documents = currentDocuments
    .map(toCachedDocument)
    .filter((document): document is ChartManagementCachedDocument => Boolean(document));
  const cache: ChartManagementSessionCache = {
    version: 1,
    source: currentSource,
    documents,
    setlists: currentSetlists,
    savedAt: Date.now()
  };
  try {
    window.sessionStorage.setItem(CHART_MANAGEMENT_SESSION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Session cache is only an acceleration path; persistent storage remains authoritative.
  }
}

function readPersistedLibraryFilters(): ChartManagementPersistedLibraryFilters | null {
  try {
    const rawFilters = window.localStorage.getItem(CHART_MANAGEMENT_LIBRARY_FILTERS_KEY);
    if (!rawFilters) return null;
    const parsed = JSON.parse(rawFilters) as Partial<ChartManagementPersistedLibraryFilters>;
    if (parsed.version !== 1 || !parsed.filters || typeof parsed.filters !== 'object') return null;
    return {
      version: 1,
      query: String(parsed.query || ''),
      filters: parsed.filters,
      savedAt: Number(parsed.savedAt || 0)
    };
  } catch {
    return null;
  }
}

function applyPersistedLibraryFilters(): void {
  if (activeMode !== 'library') return;
  const persistedFilters = readPersistedLibraryFilters();
  if (!persistedFilters) return;
  if (dom.manageChartSearchInput) {
    dom.manageChartSearchInput.value = persistedFilters.query;
  }
  for (const key of CHART_MANAGE_FILTER_KEYS) {
    const persistedFilter = persistedFilters.filters[key];
    const active = filterState.activeFilters[key];
    active.clear();
    const values = Array.isArray(persistedFilter?.values)
      ? persistedFilter.values.map((value) => String(value || '').trim()).filter(Boolean)
      : [];
    values.forEach((value) => active.add(value));
    filterState.activeModes[key] = persistedFilter?.mode === 'custom' && active.size > 0
      ? 'custom'
      : 'all';
  }
}

function persistLibraryFilters(): void {
  if (activeMode !== 'library') return;
  const filters: Partial<Record<ChartManageFilterKey, ChartManagementPersistedFilter>> = {};
  for (const key of CHART_MANAGE_FILTER_KEYS) {
    filters[key] = {
      mode: filterState.activeModes[key],
      values: Array.from(filterState.activeFilters[key]).filter(Boolean)
    };
  }
  const state: ChartManagementPersistedLibraryFilters = {
    version: 1,
    query: dom.manageChartSearchInput?.value || '',
    filters,
    savedAt: Date.now()
  };
  try {
    window.localStorage.setItem(CHART_MANAGEMENT_LIBRARY_FILTERS_KEY, JSON.stringify(state));
  } catch {
    // Losing filter preferences should never block library browsing.
  }
}

function renderCachedManageStateIfAvailable(): void {
  const cache = readChartManagementSessionCache();
  if (!cache) return;
  setCurrentDocuments(cache.documents
    .map(createDocumentFromCache)
    .filter((document): document is ChartDocument => Boolean(document)));
  currentSource = cache.source;
  currentSetlists = cache.setlists;
  renderManageUi();
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
  return getFilteredChartManagementDocuments({
    documents: currentDocuments,
    documentIndex: currentDocumentIndex,
    setlists: currentSetlists,
    query,
    filterState
  });
}

function selectFilterValue(key: ChartManageFilterKey, value: string, values: ChartManageFilterOption[]) {
  selectChartManagementFilterValue({ filterState, key, value, values });
  libraryPreviewStartIndex = 0;
  renderFacets();
  persistLibraryFilters();
  renderManageCharts();
}

function hasActiveLibraryScope(): boolean {
  const hasQuery = Boolean(String(dom.manageChartSearchInput?.value || '').trim());
  const hasFilters = Object.values(filterState.activeModes).some((mode) => mode === 'custom');
  return hasQuery || hasFilters;
}

function getLibraryBatchScopeLabel(documents: ChartDocument[]): string {
  if (currentDocuments.length === 0) return 'No charts in the library';
  if (documents.length === 0) return 'No matching charts';
  return hasActiveLibraryScope() ? 'Current filters' : 'Entire library';
}

function getLibrarySubsetSourceLabel(documents: ChartDocument[]): string {
  return `Library - ${getLibraryBatchScopeLabel(documents).toLowerCase()}`;
}

function getActiveLibraryDeleteSourceName(): string {
  if (filterState.activeModes.source !== 'custom') return '';
  const activeSources = Array.from(filterState.activeFilters.source).filter(Boolean);
  if (activeSources.length !== 1 || activeSources[0] === FILTER_SOURCE_USER_CHARTS) return '';
  return activeSources[0];
}

function getLibraryPreviewPageSize(): number {
  if (!dom.manageChartList) return libraryPreviewPageSize;
  const visualViewport = window.visualViewport;
  const viewportBottom = visualViewport
    ? visualViewport.offsetTop + visualViewport.height
    : window.innerHeight || document.documentElement.clientHeight;
  const bodyRect = document.body?.getBoundingClientRect();
  const bodyBottom = bodyRect ? Math.min(viewportBottom, bodyRect.bottom) : viewportBottom;
  const bodyStyle = document.body ? getComputedStyle(document.body) : null;
  const bodyPaddingBottom = bodyStyle ? Number.parseFloat(bodyStyle.paddingBottom) || 0 : 0;
  const listTop = dom.manageChartList.getBoundingClientRect().top;
  const summaryHeight = dom.manageLibrarySummary && !dom.manageLibrarySummary.hidden
    ? dom.manageLibrarySummary.getBoundingClientRect().height
    : 0;
  const availableHeight = Math.max(
    0,
    bodyBottom - bodyPaddingBottom - listTop - summaryHeight - LIBRARY_PREVIEW_BOTTOM_GAP_PX
  );
  const listStyle = getComputedStyle(dom.manageChartList);
  const rowGap = Number.parseFloat(listStyle.rowGap) || 0;
  const measuredRow = dom.manageChartList.querySelector<HTMLElement>(':scope > li');
  const measuredRowHeight = measuredRow?.getBoundingClientRect().height || 0;
  const rowHeight = Math.ceil(measuredRowHeight)
    || Number.parseFloat(listStyle.getPropertyValue('--library-chart-row-height'))
    || LIBRARY_PREVIEW_ROW_HEIGHT_PX;
  return Math.max(1, Math.floor((availableHeight + rowGap) / (rowHeight + rowGap)));
}

function clampLibraryPreviewStart(documentsLength: number, pageSize = libraryPreviewPageSize): number {
  if (documentsLength <= 0) return 0;
  const maxStart = Math.max(0, documentsLength - Math.max(1, pageSize));
  return Math.min(Math.max(0, libraryPreviewStartIndex), maxStart);
}

function goToLibraryPreviewPage(direction: -1 | 1) {
  const documents = getFilteredManageDocuments();
  libraryPreviewStartIndex = clampLibraryPreviewStart(documents.length) + direction * libraryPreviewPageSize;
  renderManageCharts();
}

function goToLibraryPreviewStart(documentsLength: number, startIndex: number, pageSize = libraryPreviewPageSize) {
  libraryPreviewStartIndex = startIndex;
  libraryPreviewStartIndex = clampLibraryPreviewStart(documentsLength, pageSize);
  renderManageCharts();
}

function renderManageChartRows(documents: ChartDocument[], previewStart: number, previewEnd: number) {
  if (!dom.manageChartList) return;
  dom.manageChartList.replaceChildren();
  const fragment = document.createDocumentFragment();
  const subtitleLinks: HTMLElement[] = [];
  for (const chartDocument of documents.slice(previewStart, previewEnd)) {
    const item = document.createElement('li');
    const row = document.createElement('div');
    row.className = `home-list-link home-chart-entry ${getPageClassName('chart-row')}`;
    row.dataset.chartId = chartDocument.metadata.id;
    const content = document.createElement('a');
    content.className = `home-chart-entry-link ${getPageClassName('chart-link')}`;
    content.href = createChartHref(chartDocument);
    content.addEventListener('click', () => {
      writeChartLibrarySubsetSession({
        documents,
        source: getLibrarySubsetSourceLabel(documents)
      });
    });
    content.append(createTextElement('span', 'home-list-title', chartDocument.metadata.title || 'Untitled chart'));
    const subtitle = getChartSubtitle(chartDocument);
    if (subtitle) {
      content.append(createTextElement('span', 'home-list-meta', subtitle));
      subtitleLinks.push(content);
    }
    const menuButton = createChartEntryMenuButton(chartDocument, (target) => {
      if (!isManageActionReady()) return;
      chartEntryActions?.openMenu(target);
    });
    menuButton.disabled = !isManageActionReady();
    if (!isManageActionReady()) {
      menuButton.setAttribute('aria-label', `Loading actions for ${chartDocument.metadata.title || 'chart'}`);
    }
    row.append(content, menuButton);
    item.append(row);
    fragment.append(item);
  }
  dom.manageChartList.append(fragment);
  if (subtitleLinks.length > 0) {
    requestAnimationFrame(() => subtitleLinks.forEach(updateChartEntrySubtitleVisibility));
  }
}

function createChartHref(chartDocument: ChartDocument): string {
  const targetUrl = new URL('./chart/index.html', window.location.href);
  targetUrl.searchParams.set('chart', chartDocument.metadata.id);
  targetUrl.searchParams.set('from', activeMode);
  return targetUrl.toString();
}

function scheduleLibraryPreviewLayout() {
  if (activeMode !== 'library') return;
  if (libraryPreviewResizeFrame) return;
  libraryPreviewResizeFrame = window.requestAnimationFrame(() => {
    libraryPreviewResizeFrame = 0;
    renderManageCharts();
    document.querySelectorAll<HTMLElement>(getPageChartLinkSelector()).forEach(updateChartEntrySubtitleVisibility);
  });
}

function renderLibraryBatchSummary(
  documents: ChartDocument[],
  previewStart: number,
  previewEnd: number,
  pageSize: number
) {
  if (!dom.manageLibrarySummary) return;
  dom.manageLibrarySummary.replaceChildren();
  dom.manageLibrarySummary.hidden = false;

  const panel = document.createElement('div');
  panel.className = 'library-batch-panel';

  const countBlock = document.createElement('div');
  countBlock.className = 'library-batch-count';
  countBlock.append(
    createTextElement('strong', 'library-batch-count-title', `${documents.length} ${pluralizeChartLabel(documents.length)}`),
    createTextElement('span', 'library-batch-count-meta', getLibraryBatchScopeLabel(documents))
  );

  const activeSourceName = getActiveLibraryDeleteSourceName();
  const actionButton = createButton(activeSourceName ? 'Review cleanup' : 'Review delete', 'library-batch-action');
  actionButton.disabled = documents.length === 0 || !isManageActionReady();
  actionButton.setAttribute('aria-label', !isManageActionReady()
    ? 'Loading full chart data before library actions'
    : activeSourceName ? 'Review cleaning up the active source' : 'Review deleting all matching charts');
  actionButton.addEventListener('click', openLibraryDeleteReviewPanel);

  const previousButton = createButton('Prev', 'library-preview-page-action');
  previousButton.disabled = previewStart <= 0;
  previousButton.setAttribute('aria-label', 'Previous preview page');
  previousButton.addEventListener('click', () => goToLibraryPreviewPage(-1));
  const maxPreviewStart = Math.max(0, documents.length - Math.max(1, pageSize));
  const previewSlider = document.createElement('input');
  previewSlider.className = 'library-preview-slider';
  previewSlider.type = 'range';
  previewSlider.min = '1';
  previewSlider.max = String(maxPreviewStart + 1);
  previewSlider.step = '1';
  previewSlider.value = String(Math.min(maxPreviewStart + 1, previewStart + 1));
  previewSlider.disabled = documents.length <= pageSize;
  previewSlider.setAttribute('aria-label', 'Browse matching charts');
  previewSlider.setAttribute('aria-valuetext', documents.length > 0
    ? `Showing charts ${previewStart + 1} to ${previewEnd} of ${documents.length}`
    : 'No matching charts');
  previewSlider.addEventListener('input', () => {
    const nextStart = Number.parseInt(previewSlider.value, 10) - 1;
    const nextEnd = Math.min(documents.length, nextStart + pageSize);
    libraryPreviewStartIndex = nextStart;
    previewSlider.setAttribute('aria-valuetext', `Showing charts ${nextStart + 1} to ${nextEnd} of ${documents.length}`);
    previousButton.disabled = nextStart <= 0;
    nextButton.disabled = nextEnd >= documents.length;
    renderManageChartRows(documents, nextStart, nextEnd);
  });
  previewSlider.addEventListener('change', () => {
    goToLibraryPreviewStart(documents.length, Number.parseInt(previewSlider.value, 10) - 1, pageSize);
  });
  const nextButton = createButton('Next', 'library-preview-page-action');
  nextButton.disabled = previewEnd >= documents.length;
  nextButton.setAttribute('aria-label', 'Next preview page');
  nextButton.addEventListener('click', () => goToLibraryPreviewPage(1));
  const pager = document.createElement('div');
  pager.className = 'library-preview-pager';
  pager.hidden = documents.length <= pageSize;
  pager.append(previousButton, previewSlider, nextButton);
  const previewRow = document.createElement('div');
  previewRow.className = 'library-batch-preview-row';
  previewRow.hidden = documents.length <= pageSize;
  previewRow.append(pager);
  panel.append(countBlock, actionButton, previewRow);
  dom.manageLibrarySummary.append(panel);
}

function renderFacets() {
  renderChartManagementFacets({
    documents: currentDocuments,
    documentIndex: currentDocumentIndex,
    setlists: currentSetlists,
    dom,
    filterState,
    getPageClassName,
    onSelectFilterValue: selectFilterValue
  });
  persistLibraryFilters();
}

function renderManageCharts() {
  const documents = getFilteredManageDocuments();
  renderLibraryBatchSummary(documents, 0, Math.min(documents.length, 1), 1);
  if (!dom.manageChartList) return;
  dom.manageChartList.toggleAttribute('hidden', documents.length === 0);
  libraryPreviewPageSize = documents.length > 0 ? getLibraryPreviewPageSize() : 1;
  libraryPreviewStartIndex = clampLibraryPreviewStart(documents.length, libraryPreviewPageSize);
  const previewEnd = Math.min(documents.length, libraryPreviewStartIndex + libraryPreviewPageSize);
  renderLibraryBatchSummary(documents, libraryPreviewStartIndex, previewEnd, libraryPreviewPageSize);
  renderManageChartRows(documents, libraryPreviewStartIndex, previewEnd);
}

async function persistMetadataState({ documents, setlists }: { documents: ChartDocument[]; setlists: ChartSetlist[] }, statusMessage: string) {
  const persistedLibrary = await persistChartLibrary({ documents, source: currentSource, mergeWithExisting: false });
  setCurrentDocuments(persistedLibrary?.documents || documents);
  currentSource = persistedLibrary?.source || currentSource;
  currentSetlists = await persistSetlists(setlists);
  writeChartManagementSessionCache();
  setImportStatus(statusMessage);
  renderManageUi();
}

function persistChartEntrySetlists(nextSetlists: ChartSetlist[], statusMessage: string): void {
  currentSetlists = nextSetlists;
  writeChartManagementSessionCache();
  renderManageUi();
  void persistSetlists(nextSetlists)
    .then((persistedSetlists) => {
      currentSetlists = persistedSetlists;
      writeChartManagementSessionCache();
      setImportStatus(statusMessage);
      renderManageUi();
    })
    .catch((error) => {
      setImportStatus(`Failed to update setlists: ${getErrorMessage(error)}`, true);
    });
}

function getChartId(document: ChartDocument): string {
  return String(document.metadata?.id || '').trim();
}

function getChartSetlists(document: ChartDocument): ChartSetlist[] {
  const chartId = getChartId(document);
  return chartId ? getChartSetlistMembership(chartId, currentSetlists) : [];
}

function getSetlistEntryCount(documents: ChartDocument[]): number {
  const selectedIds = new Set(documents.map(getChartId).filter(Boolean));
  if (selectedIds.size === 0) return 0;
  return currentSetlists.reduce((count, setlist) => count + setlist.items.filter((item) => selectedIds.has(item.chartId)).length, 0);
}

function getDeleteReviewDocuments(documents: ChartDocument[], includeSetlisted: boolean): DeleteReviewPlan {
  const activeSourceName = getActiveLibraryDeleteSourceName();
  const chartIds = documents.map(getChartId).filter(Boolean);
  const preview = previewProtectedChartDelete({
    documents,
    setlists: currentSetlists,
    chartIds,
    activeSourceName
  });
  const setlistedDocuments = documents.filter((document) => getChartSetlists(document).length > 0);
  const setlistedIds = new Set(setlistedDocuments.map(getChartId).filter(Boolean));
  const sourceRefOnlyIds = new Set(preview.sourceRefOnlyChartIds);
  const rawDeleteIds = new Set(preview.deletedChartIds);
  const protectedDeleteIds = includeSetlisted
    ? new Set<string>()
    : new Set(Array.from(rawDeleteIds).filter((chartId) => setlistedIds.has(chartId)));
  const deleteIds = new Set(Array.from(rawDeleteIds).filter((chartId) => !protectedDeleteIds.has(chartId)));
  const knownAffectedIds = new Set([...rawDeleteIds, ...sourceRefOnlyIds]);
  const deleteDocuments = documents.filter((document) => deleteIds.has(getChartId(document)));
  const protectedDocuments = documents.filter((document) => protectedDeleteIds.has(getChartId(document)));
  const setlistedDeleteDocuments = documents.filter((document) => rawDeleteIds.has(getChartId(document)) && setlistedIds.has(getChartId(document)));
  const sourceRefOnlyDocuments = documents.filter((document) => sourceRefOnlyIds.has(getChartId(document)));
  const skippedDocuments = activeSourceName
    ? documents.filter((document) => {
      const chartId = getChartId(document);
      return chartId && !knownAffectedIds.has(chartId);
    })
    : [];
  return {
    activeSourceName,
    setlistedDeleteDocuments,
    protectedDocuments,
    skippedDocuments,
    sourceRefOnlyDocuments,
    deleteDocuments,
    setlistEntryDeleteCount: getSetlistEntryCount(deleteDocuments)
  };
}

function getSetlistUsageRows(documents: ChartDocument[]): Array<{ setlist: ChartSetlist; count: number }> {
  const selectedIds = new Set(documents.map(getChartId).filter(Boolean));
  return currentSetlists
    .map((setlist) => ({
      setlist,
      count: setlist.items.filter((item) => selectedIds.has(item.chartId)).length
    }))
    .filter((row) => row.count > 0)
    .sort((left, right) => right.count - left.count || left.setlist.name.localeCompare(right.setlist.name, 'en', { sensitivity: 'base' }));
}

function clearLibraryDeleteReviewConfirmationTimer(): void {
  if (!libraryDeleteReviewConfirmationTimer) return;
  window.clearTimeout(libraryDeleteReviewConfirmationTimer);
  libraryDeleteReviewConfirmationTimer = null;
}

function resetLibraryDeleteReviewConfirmation(): void {
  libraryDeleteReviewConfirmationVisible = false;
  libraryDeleteReviewConfirmationReadyAt = 0;
  clearLibraryDeleteReviewConfirmationTimer();
}

function closeLibraryDeleteReviewPanel(): void {
  libraryDeleteReviewIncludesSetlisted = false;
  resetLibraryDeleteReviewConfirmation();
  if (!dom.manageMetadataPanel) return;
  dom.manageMetadataPanel.classList.remove('library-delete-review-host');
  dom.manageMetadataPanel.hidden = true;
  dom.manageMetadataPanel.removeAttribute('role');
  dom.manageMetadataPanel.removeAttribute('aria-modal');
  dom.manageMetadataPanel.removeAttribute('aria-label');
  dom.manageMetadataPanel.replaceChildren();
}

function createDeleteReviewStat(label: string, value: string): HTMLElement {
  const item = document.createElement('div');
  item.className = `library-delete-review-stat${label === 'Will delete' ? ' is-primary' : ''}`;
  item.append(
    createTextElement('strong', 'library-delete-review-stat-value', value),
    createTextElement('span', 'library-delete-review-stat-label', label)
  );
  return item;
}

function createDeleteReviewDocumentList(documents: ChartDocument[], className: string): HTMLElement {
  const list = document.createElement('ul');
  list.className = className;
  for (const chartDocument of documents.slice(0, 6)) {
    const item = document.createElement('li');
    item.append(createTextElement('span', 'library-delete-review-usage-name', chartDocument.metadata?.title || 'Untitled chart'));
    list.append(item);
  }
  if (documents.length > 6) {
    const more = document.createElement('li');
    more.className = 'library-delete-review-more';
    more.textContent = `${documents.length - 6} more charts`;
    list.append(more);
  }
  return list;
}

function getDeleteReviewActionLabel(deleteCount: number, sourceRefOnlyCount: number): string {
  if (deleteCount > 0 && sourceRefOnlyCount > 0) return 'Apply changes';
  if (deleteCount > 0) return `Delete ${deleteCount}`;
  return `Update ${sourceRefOnlyCount}`;
}

function scheduleLibraryDeleteConfirmationRefresh(): void {
  clearLibraryDeleteReviewConfirmationTimer();
  if (!libraryDeleteReviewConfirmationVisible) return;
  const remainingMs = libraryDeleteReviewConfirmationReadyAt - Date.now();
  if (remainingMs <= 0) return;
  libraryDeleteReviewConfirmationTimer = window.setTimeout(renderLibraryDeleteReviewPanel, Math.min(remainingMs, 1000));
}

function renderLibraryDeleteConfirmationPanel({
  activeSourceName,
  deleteDocuments,
  protectedCount,
  setlistEntryDeleteCount,
  sourceRefOnlyDocuments
}: {
  activeSourceName: string;
  deleteDocuments: ChartDocument[];
  protectedCount: number;
  setlistEntryDeleteCount: number;
  sourceRefOnlyDocuments: ChartDocument[];
}): void {
  if (!dom.manageMetadataPanel) return;
  const deleteCount = deleteDocuments.length;
  const sourceRefOnlyCount = sourceRefOnlyDocuments.length;
  const remainingMs = Math.max(0, libraryDeleteReviewConfirmationReadyAt - Date.now());
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const canConfirm = remainingMs <= 0;
  const title = deleteCount > 0
    ? `Delete ${deleteCount} ${pluralizeChartLabel(deleteCount)}?`
    : `Update ${sourceRefOnlyCount} source reference${sourceRefOnlyCount === 1 ? '' : 's'}?`;

  const panel = document.createElement('section');
  panel.className = 'chart-metadata-panel-content library-delete-review-panel library-delete-confirm-panel';
  panel.setAttribute('aria-label', 'Confirm delete');

  const header = document.createElement('div');
  header.className = 'library-delete-review-header';
  header.append(
    createTextElement('h2', 'chart-metadata-title library-delete-review-title', title),
    createTextElement('p', 'library-delete-review-scope', 'This action cannot be undone.')
  );
  panel.append(header);

  const message = document.createElement('div');
  message.className = 'library-delete-confirm-message';
  const lines = [
    deleteCount > 0 ? `This will permanently remove ${deleteCount} ${pluralizeChartLabel(deleteCount)} from the library.` : '',
    sourceRefOnlyCount > 0 && activeSourceName
      ? `${sourceRefOnlyCount} matching ${pluralizeChartLabel(sourceRefOnlyCount)} also belong to another source and will stay in the library; only "${activeSourceName}" will be removed from their sources.`
      : '',
    protectedCount > 0 ? `${protectedCount} ${pluralizeChartLabel(protectedCount)} used in setlists will stay protected.` : '',
    setlistEntryDeleteCount > 0 ? `${setlistEntryDeleteCount} setlist entr${setlistEntryDeleteCount === 1 ? 'y' : 'ies'} will be removed.` : ''
  ].filter(Boolean);
  for (const line of lines) {
    message.append(createTextElement('p', '', line));
  }
  panel.append(message);

  const footer = document.createElement('div');
  footer.className = 'chart-metadata-footer-actions library-delete-review-actions';
  const cancelButton = createButton('Cancel', 'chart-metadata-cancel');
  cancelButton.addEventListener('click', closeLibraryDeleteReviewPanel);
  const confirmLabel = deleteCount > 0 ? 'Confirm delete' : 'Confirm update';
  const confirmButton = createButton(
    canConfirm ? confirmLabel : `${confirmLabel} (${remainingSeconds})`,
    'chart-metadata-danger-confirm'
  );
  confirmButton.disabled = !canConfirm;
  confirmButton.addEventListener('click', () => {
    if (!canConfirm) return;
    void deleteReviewedCharts(deleteDocuments, sourceRefOnlyDocuments, protectedCount, setlistEntryDeleteCount, activeSourceName);
  });
  footer.append(cancelButton, confirmButton);
  panel.append(footer);

  dom.manageMetadataPanel.replaceChildren(panel);
  dom.manageMetadataPanel.classList.add('library-delete-review-host');
  dom.manageMetadataPanel.hidden = false;
  dom.manageMetadataPanel.setAttribute('role', 'dialog');
  dom.manageMetadataPanel.setAttribute('aria-modal', 'true');
  dom.manageMetadataPanel.setAttribute('aria-label', 'Confirm delete');
  requestAnimationFrame(() => cancelButton.focus());
  scheduleLibraryDeleteConfirmationRefresh();
}

function renderLibraryDeleteReviewPanel(): void {
  if (!dom.manageMetadataPanel) return;
  const documents = getFilteredManageDocuments();
  const {
    activeSourceName,
    deleteDocuments,
    protectedDocuments,
    setlistedDeleteDocuments,
    skippedDocuments,
    sourceRefOnlyDocuments,
    setlistEntryDeleteCount
  } = getDeleteReviewDocuments(documents, libraryDeleteReviewIncludesSetlisted);
  const usageRows = getSetlistUsageRows(libraryDeleteReviewIncludesSetlisted ? deleteDocuments : protectedDocuments);
  const deleteCount = deleteDocuments.length;
  const sourceRefOnlyCount = sourceRefOnlyDocuments.length;
  const affectedCount = deleteCount + sourceRefOnlyCount;
  const reviewTitle = activeSourceName ? 'Review source cleanup' : 'Review delete';

  if (libraryDeleteReviewConfirmationVisible) {
    renderLibraryDeleteConfirmationPanel({
      activeSourceName,
      deleteDocuments,
      protectedCount: protectedDocuments.length,
      setlistEntryDeleteCount,
      sourceRefOnlyDocuments
    });
    return;
  }

  const panel = document.createElement('section');
  panel.className = 'chart-metadata-panel-content library-delete-review-panel';
  panel.setAttribute('aria-label', reviewTitle);

  const header = document.createElement('div');
  header.className = 'library-delete-review-header';
  const heading = document.createElement('div');
  heading.append(
    createTextElement('h2', 'chart-metadata-title library-delete-review-title', reviewTitle),
    createTextElement('p', 'library-delete-review-scope', getLibraryBatchScopeLabel(documents))
  );
  header.append(heading);
  panel.append(header);

  if (documents.length === 0) {
    panel.append(createTextElement('p', 'home-empty chart-metadata-empty', 'No matching charts.'));
  } else {
    const stats = document.createElement('div');
    stats.className = 'library-delete-review-stats';
    stats.append(
      createDeleteReviewStat('Matching', String(documents.length)),
      createDeleteReviewStat('Will delete', String(deleteCount)),
      ...(sourceRefOnlyCount > 0 ? [createDeleteReviewStat('Source refs', String(sourceRefOnlyCount))] : []),
      ...(protectedDocuments.length > 0 ? [createDeleteReviewStat('Protected', String(protectedDocuments.length))] : []),
      ...(setlistEntryDeleteCount > 0 ? [createDeleteReviewStat('Setlist entries', String(setlistEntryDeleteCount))] : [])
    );
    panel.append(stats);

    if (activeSourceName && sourceRefOnlyCount > 0) {
      const sourceNote = document.createElement('p');
      sourceNote.className = 'library-delete-review-note';
      sourceNote.textContent = `${sourceRefOnlyCount} matching ${pluralizeChartLabel(sourceRefOnlyCount)} also belong to another source. They will stay in the library; only "${activeSourceName}" will be removed from their sources.`;
      panel.append(sourceNote);
    }

    if (setlistedDeleteDocuments.length > 0) {
      const guard = document.createElement('label');
      guard.className = 'library-delete-review-guard';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = libraryDeleteReviewIncludesSetlisted;
      checkbox.addEventListener('change', () => {
        libraryDeleteReviewIncludesSetlisted = checkbox.checked;
        resetLibraryDeleteReviewConfirmation();
        renderLibraryDeleteReviewPanel();
      });
      const guardText = document.createElement('span');
      guardText.append(
        createTextElement('strong', '', 'Also delete charts used in setlists'),
        createTextElement('span', '', 'Off by default so setlists do not lose songs during library cleanup.')
      );
      guard.append(checkbox, guardText);
      panel.append(guard);
    }

    if (sourceRefOnlyDocuments.length > 0) {
      const sourceCleanup = document.createElement('section');
      sourceCleanup.className = 'library-delete-review-usage';
      sourceCleanup.append(
        createTextElement('h3', 'library-delete-review-section-title', 'Source references that will be removed'),
        createDeleteReviewDocumentList(sourceRefOnlyDocuments, 'library-delete-review-usage-list library-delete-review-document-list')
      );
      panel.append(sourceCleanup);
    }

    if (usageRows.length > 0) {
      const usage = document.createElement('section');
      usage.className = 'library-delete-review-usage';
      usage.append(createTextElement(
        'h3',
        'library-delete-review-section-title',
        libraryDeleteReviewIncludesSetlisted ? 'Setlist entries that will be removed' : 'Setlist usage protected'
      ));
      const usageList = document.createElement('ul');
      usageList.className = 'library-delete-review-usage-list';
      for (const row of usageRows.slice(0, 6)) {
        const item = document.createElement('li');
        item.append(
          createTextElement('span', 'library-delete-review-usage-name', row.setlist.name),
          createTextElement('span', 'library-delete-review-usage-count', `${row.count} ${pluralizeChartLabel(row.count)}`)
        );
        usageList.append(item);
      }
      if (usageRows.length > 6) {
        const more = document.createElement('li');
        more.className = 'library-delete-review-more';
        more.textContent = `${usageRows.length - 6} more setlists`;
        usageList.append(more);
      }
      usage.append(usageList);
      panel.append(usage);
    }

    if (skippedDocuments.length > 0) {
      const skipped = document.createElement('p');
      skipped.className = 'library-delete-review-note';
      skipped.textContent = `${skippedDocuments.length} matching ${pluralizeChartLabel(skippedDocuments.length)} will be skipped because they do not belong to the active source.`;
      panel.append(skipped);
    }
  }

  const footer = document.createElement('div');
  footer.className = 'chart-metadata-footer-actions library-delete-review-actions';
  const cancelButton = createButton('Cancel', 'chart-metadata-cancel');
  cancelButton.addEventListener('click', closeLibraryDeleteReviewPanel);
  const deleteButton = createButton(
    affectedCount > 0
      ? getDeleteReviewActionLabel(deleteCount, sourceRefOnlyCount)
      : 'Nothing to delete',
    'chart-metadata-danger-action'
  );
  deleteButton.disabled = affectedCount === 0;
  deleteButton.addEventListener('click', () => {
    libraryDeleteReviewConfirmationVisible = true;
    libraryDeleteReviewConfirmationReadyAt = Date.now() + 2000;
    renderLibraryDeleteReviewPanel();
  });
  footer.append(cancelButton, deleteButton);
  panel.append(footer);

  dom.manageMetadataPanel.replaceChildren(panel);
  dom.manageMetadataPanel.classList.add('library-delete-review-host');
  dom.manageMetadataPanel.hidden = false;
  dom.manageMetadataPanel.setAttribute('role', 'dialog');
  dom.manageMetadataPanel.setAttribute('aria-modal', 'true');
  dom.manageMetadataPanel.setAttribute('aria-label', reviewTitle);
  requestAnimationFrame(() => cancelButton.focus());
}

function openLibraryDeleteReviewPanel(): void {
  libraryDeleteReviewIncludesSetlisted = false;
  resetLibraryDeleteReviewConfirmation();
  renderLibraryDeleteReviewPanel();
}

async function deleteReviewedCharts(
  deleteDocuments: ChartDocument[],
  sourceRefOnlyDocuments: ChartDocument[],
  protectedCount: number,
  setlistEntryDeleteCount: number,
  activeSourceName: string
): Promise<void> {
  if (deleteDocuments.length === 0 && sourceRefOnlyDocuments.length === 0) return;
  const deleteChartIds = deleteDocuments.map(getChartId).filter(Boolean);
  const sourceRefOnlyChartIds = sourceRefOnlyDocuments.map(getChartId).filter(Boolean);
  const chartIds = [...deleteChartIds, ...sourceRefOnlyChartIds];
  const result = applyBatchMetadataOperation({
    documents: currentDocuments,
    setlists: currentSetlists,
    chartIds,
    operation: {
      kind: 'delete',
      ...(activeSourceName ? { activeSourceName } : {})
    }
  });
  if (deleteChartIds.length > 0) removePersistedChartReferences(deleteChartIds);
  const actionMessages = [
    deleteChartIds.length > 0 ? `Deleted ${deleteChartIds.length} ${pluralizeChartLabel(deleteChartIds.length)}` : '',
    sourceRefOnlyChartIds.length > 0 ? `Updated ${sourceRefOnlyChartIds.length} source reference${sourceRefOnlyChartIds.length === 1 ? '' : 's'}` : ''
  ].filter(Boolean);
  const protectedMessage = protectedCount > 0
    ? ` ${protectedCount} ${pluralizeChartLabel(protectedCount)} used in setlists kept.`
    : '';
  const setlistMessage = setlistEntryDeleteCount > 0
    ? ` Removed ${setlistEntryDeleteCount} setlist entr${setlistEntryDeleteCount === 1 ? 'y' : 'ies'}.`
    : '';
  await persistMetadataState(
    { documents: result.documents, setlists: result.setlists },
    `${actionMessages.join('. ')}.${protectedMessage}${setlistMessage}`
  );
  closeLibraryDeleteReviewPanel();
}

function createMenuButton(label: string, className = 'home-chart-entry-menu-item'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('role', 'menuitem');
  button.textContent = label;
  return button;
}

function ensureSetlistActionMenu(): HTMLElement {
  if (setlistActionMenu) return setlistActionMenu;
  setlistActionMenu = document.createElement('div');
  setlistActionMenu.className = 'home-chart-entry-menu setlists-action-menu';
  setlistActionMenu.hidden = true;
  setlistActionMenu.setAttribute('role', 'menu');
  setlistActionMenu.setAttribute('aria-label', 'Setlist actions');
  document.body.append(setlistActionMenu);
  return setlistActionMenu;
}

function ensureAddChartPopup(): HTMLElement {
  if (addChartPopup) return addChartPopup;
  addChartPopup = document.createElement('div');
  addChartPopup.className = 'home-setlist-popup setlists-add-chart-popup';
  addChartPopup.hidden = true;
  addChartPopup.setAttribute('role', 'dialog');
  addChartPopup.setAttribute('aria-modal', 'true');
  addChartPopup.setAttribute('aria-label', 'Add chart to setlist');
  document.body.append(addChartPopup);
  addChartPopup.addEventListener('click', (event) => {
    if (event.target === addChartPopup) closeAddChartPopup();
  });
  return addChartPopup;
}

function positionSetlistActionMenu(anchor: HTMLElement): void {
  const menu = ensureSetlistActionMenu();
  positionChartEntryMenu(menu, anchor, setlistActionMenuPlacement);
}

function scheduleSetlistActionMenuPosition(): void {
  if (setlistActionMenuPlacement !== 'centered-dialog') return;
  if (pendingSetlistActionMenuPositionFrame || !setlistActionMenuAnchor || !setlistActionMenu || setlistActionMenu.hidden) return;
  pendingSetlistActionMenuPositionFrame = window.requestAnimationFrame(() => {
    pendingSetlistActionMenuPositionFrame = 0;
    if (!setlistActionMenuAnchor || !setlistActionMenu || setlistActionMenu.hidden) return;
    positionSetlistActionMenu(setlistActionMenuAnchor);
  });
}

function closeSetlistActionMenu(): void {
  document.querySelectorAll<HTMLElement>('.setlists-body .home-chart-entry-kebab[aria-expanded="true"]')
    .forEach((button) => button.setAttribute('aria-expanded', 'false'));
  activeSetlistMenuId = '';
  activeSetlistItemMenuKey = '';
  pendingDeleteSetlistId = '';
  setlistActionMenuAnchor = null;
  setlistActionMenuPlacement = 'anchored';
  if (pendingSetlistActionMenuPositionFrame) {
    window.cancelAnimationFrame(pendingSetlistActionMenuPositionFrame);
    pendingSetlistActionMenuPositionFrame = 0;
  }
  if (!setlistActionMenu) return;
  setlistActionMenu.hidden = true;
  setlistActionMenu.classList.remove('is-confirming-delete');
  setlistActionMenu.setAttribute('role', 'menu');
  setlistActionMenu.setAttribute('aria-label', 'Setlist actions');
  setlistActionMenu.replaceChildren();
}

function renderSetlistDeleteConfirmation(setlist: ChartSetlist, anchor: HTMLElement): void {
  const menu = ensureSetlistActionMenu();
  pendingDeleteSetlistId = setlist.id;
  activeSetlistMenuId = setlist.id;
  activeSetlistItemMenuKey = '';
  setlistActionMenuAnchor = anchor;
  setlistActionMenuPlacement = 'centered-dialog';
  anchor.setAttribute('aria-expanded', 'true');
  menu.classList.add('is-confirming-delete');
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', 'Confirm setlist delete');

  const confirmation = document.createElement('div');
  confirmation.className = 'home-chart-entry-confirm';
  const title = createTextElement('strong', 'home-chart-entry-confirm-title', `Delete "${setlist.name}"?`);
  const message = createTextElement('p', 'home-chart-entry-confirm-message', 'Charts stay in your library.');
  const actions = document.createElement('div');
  actions.className = 'home-chart-entry-confirm-actions';
  const cancelButton = createMenuButton('Cancel');
  const confirmButton = createMenuButton('Delete', 'home-chart-entry-menu-item is-danger is-confirm-delete');
  cancelButton.addEventListener('click', closeSetlistActionMenu);
  confirmButton.addEventListener('click', () => {
    if (pendingDeleteSetlistId !== setlist.id) return;
    deleteSetlist(setlist);
  });
  actions.append(cancelButton, confirmButton);
  confirmation.append(title, message, actions);
  menu.replaceChildren(confirmation);
  menu.hidden = false;
  positionSetlistActionMenu(anchor);
  scheduleSetlistActionMenuPosition();
  requestAnimationFrame(() => cancelButton.focus());
}

function closeAddChartPopup(): void {
  if (!addChartPopup) return;
  addChartPopup.hidden = true;
  addChartPopup.replaceChildren();
}

function hasDraggedLibraryChart(event: DragEvent): boolean {
  return hasDraggedLibraryChartState({
    draggedSetlistItem,
    draggedLibraryChartId
  });
}

function getSetlistChartUrl(setlistId: string, chartId = ''): string {
  const targetUrl = new URL('./chart/index.html', window.location.href);
  targetUrl.searchParams.set('setlist', setlistId);
  if (chartId) targetUrl.searchParams.set('chart', chartId);
  targetUrl.searchParams.set('from', 'setlists');
  return targetUrl.toString();
}

function openSetlistInChart(setlistId: string, chartId = ''): void {
  window.location.assign(getSetlistChartUrl(setlistId, chartId));
}

function clearSetlistItemDragActivationTimer(): void {
  if (setlistItemDragActivationTimer === null) return;
  window.clearTimeout(setlistItemDragActivationTimer);
  setlistItemDragActivationTimer = null;
}

function scrollSetlistsPageBy(deltaY: number): void {
  const scrollingElement = document.scrollingElement || document.documentElement;
  scrollingElement.scrollTop += deltaY;
}

function resetSetlistItemPointerDrag(row?: HTMLElement): void {
  clearSetlistItemDragActivationTimer();
  draggedSetlistItem = null;
  setlistPointerStart = null;
  setlistPointerCurrent = null;
  setlistPointerId = null;
  setlistPointerType = '';
  isSetlistItemDragActive = false;
  isSetlistItemScrollActive = false;
  row?.classList.remove('is-dragging');
  clearSetlistDropPreview();
}

function openSetlistActionMenu(setlist: ChartSetlist, anchor: HTMLElement, forceOpen = false): void {
  const menu = ensureSetlistActionMenu();
  const isSameMenu = activeSetlistMenuId === setlist.id && !menu.hidden;
  if (!forceOpen) {
    closeSetlistActionMenu();
    closeAddChartPopup();
    if (isSameMenu) return;
  }

  activeSetlistMenuId = setlist.id;
  setlistActionMenuAnchor = anchor;
  setlistActionMenuPlacement = 'anchored';
  anchor.setAttribute('aria-expanded', 'true');
  menu.classList.remove('is-confirming-delete');
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Setlist actions');

  const openButton = createMenuButton('Open');
  openButton.disabled = setlist.items.length === 0;
  openButton.addEventListener('click', () => {
    if (setlist.items.length === 0) return;
    openSetlistInChart(setlist.id);
  });

  const addChartButton = createMenuButton('Add chart');
  addChartButton.addEventListener('click', () => {
    closeSetlistActionMenu();
    openAddChartPopup(setlist.id);
  });

  const renameButton = createMenuButton('Rename');
  renameButton.addEventListener('click', () => {
    closeSetlistActionMenu();
    renamingSetlistId = setlist.id;
    pendingDeleteSetlistId = '';
    renderSetlists();
  });

  const deleteButton = createMenuButton('Delete', 'home-chart-entry-menu-item is-danger');
  deleteButton.addEventListener('click', (event) => {
    event.stopPropagation();
    renderSetlistDeleteConfirmation(setlist, anchor);
  });

  menu.replaceChildren(openButton, addChartButton, renameButton, deleteButton);
  menu.hidden = false;
  positionSetlistActionMenu(anchor);
  requestAnimationFrame(() => (openButton.disabled ? addChartButton : openButton).focus());
}

function openSetlistItemActionMenu(setlist: ChartSetlist, itemIndex: number, anchor: HTMLElement): void {
  const menu = ensureSetlistActionMenu();
  const menuKey = `${setlist.id}:${itemIndex}`;
  const isSameMenu = activeSetlistItemMenuKey === menuKey && !menu.hidden;
  closeSetlistActionMenu();
  closeAddChartPopup();
  if (isSameMenu) return;

  activeSetlistMenuId = '';
  activeSetlistItemMenuKey = menuKey;
  setlistActionMenuAnchor = anchor;
  setlistActionMenuPlacement = 'anchored';
  anchor.setAttribute('aria-expanded', 'true');
  menu.setAttribute('aria-label', 'Setlist item actions');

  const removeButton = createMenuButton('Remove from setlist');
  removeButton.addEventListener('click', () => {
    closeSetlistActionMenu();
    removeSetlistItem(setlist.id, itemIndex);
  });

  menu.replaceChildren(removeButton);
  menu.hidden = false;
  positionSetlistActionMenu(anchor);
  requestAnimationFrame(() => removeButton.focus());
}

function renderAddChartPopup(setlistId: string, query = ''): void {
  const popup = ensureAddChartPopup();
  const setlist = currentSetlists.find((candidate) => candidate.id === setlistId);
  if (!setlist) {
    closeAddChartPopup();
    return;
  }

  const assignedChartIds = new Set(setlist.items.map((item) => item.chartId));
  const availableDocuments = currentDocuments.filter((document) => !assignedChartIds.has(document.metadata.id));
  const matchingDocuments = query ? filterChartDocuments(availableDocuments, query) : availableDocuments;

  const card = document.createElement('div');
  card.className = 'home-setlist-popup-card setlists-add-chart-card';

  const header = document.createElement('div');
  header.className = 'home-setlist-popup-header';
  header.append(createTextElement('strong', '', 'Add chart'));
  const closeButton = createButton('Close', 'home-metadata-close');
  closeButton.addEventListener('click', closeAddChartPopup);
  header.append(closeButton);

  const title = createTextElement('p', 'home-setlist-popup-chart-title', setlist.name);
  const searchLabel = document.createElement('label');
  searchLabel.className = 'home-search-field setlists-add-chart-search';
  const searchHint = createTextElement('span', 'sr-only', 'Search charts');
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Search charts';
  searchInput.value = query;
  searchInput.addEventListener('input', () => renderAddChartPopup(setlistId, searchInput.value));
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAddChartPopup();
  });
  searchLabel.append(searchHint, searchInput);

  const list = document.createElement('div');
  list.className = 'home-setlist-popup-list setlists-add-chart-list';
  if (currentDocuments.length === 0) {
    list.append(createTextElement('p', 'home-empty', 'No charts in library.'));
  } else if (availableDocuments.length === 0) {
    list.append(createTextElement('p', 'home-empty', 'All charts are already in this setlist.'));
  } else if (matchingDocuments.length === 0) {
    list.append(createTextElement('p', 'home-empty', 'No matching charts.'));
  } else {
    for (const chartDocument of matchingDocuments.slice(0, 40)) {
      const button = createButton(chartDocument.metadata.title || 'Untitled chart', 'home-setlist-popup-option setlists-add-chart-option');
      button.addEventListener('click', () => {
        addChartToSetlist(setlist.id, chartDocument.metadata.id);
        renderAddChartPopup(setlist.id, searchInput.value);
      });
      list.append(button);
    }
  }

  card.append(header, title, searchLabel, list);
  popup.replaceChildren(card);
  popup.hidden = false;
  requestAnimationFrame(() => searchInput.focus());
}

function openAddChartPopup(setlistId: string): void {
  renderAddChartPopup(setlistId);
}

function renderSetlists() {
  if (!dom.manageSetlistsSection || !dom.manageSetlistList) return;
  dom.manageSetlistsSection.hidden = false;
  dom.manageSetlistList.replaceChildren();
  if (isCreateSetlistVisible) dom.manageSetlistList.append(renderCreateSetlistForm());
  if (currentSetlists.length === 0) {
    const item = document.createElement('li');
    item.append(createTextElement('p', 'home-empty', 'No setlists yet.'));
    dom.manageSetlistList.append(item);
    return;
  }
  const documentsById = new Map(currentDocuments.map((document) => [document.metadata.id, document]));

  for (const setlist of currentSetlists) {
    const item = document.createElement('li');
    item.className = getPageClassName('setlist-entry');
    const isEmptySetlist = setlist.items.length === 0;
    const isCollapsed = isEmptySetlist || collapsedSetlistIds.has(setlist.id);
    if (isEmptySetlist) collapsedSetlistIds.add(setlist.id);

    const row = document.createElement('div');
    row.className = `home-list-link ${getPageClassName('setlist-row')}`;
    row.style.display = 'grid';
    row.style.gridTemplateColumns = 'minmax(0, 1fr) auto';
    row.style.alignItems = 'center';
    row.style.columnGap = '0.65rem';
    row.classList.toggle('can-receive-chart', draggedLibraryChartId !== '');
    row.setAttribute('aria-expanded', String(!isCollapsed));
    row.dataset.setlistDropId = setlist.id;
    row.addEventListener('click', (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('.home-chart-entry-kebab')) return;
      if (isEmptySetlist) {
        collapsedSetlistIds.add(setlist.id);
        return;
      }
      if (isCollapsed) collapsedSetlistIds.delete(setlist.id);
      else collapsedSetlistIds.add(setlist.id);
      renderSetlists();
    });
    row.addEventListener('dragover', (event) => {
      if (!hasDraggedLibraryChart(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      showSetlistDropPreview({ setlistId: setlist.id });
    });
    row.addEventListener('drop', (event) => {
      if (!hasDraggedLibraryChart(event)) return;
      event.preventDefault();
      clearSetlistDropPreview();
      addChartToSetlist(setlist.id, getDraggedLibraryChartIdFromEvent(event, draggedLibraryChartId));
    });

    const content = document.createElement('div');
    content.className = getPageClassName('setlist-open');
    content.append(
      createTextElement('span', 'home-list-title', setlist.name),
      createTextElement('span', 'home-list-meta', `${setlist.items.length} ${pluralizeChartLabel(setlist.items.length)}`)
    );

    const menuButton = createMetadataButton(`Manage ${setlist.name}`, (event) => {
      event.preventDefault();
      event.stopPropagation();
      activeSetlistItemMenuKey = '';
      openSetlistActionMenu(setlist, menuButton);
    });
    menuButton.setAttribute('aria-haspopup', 'menu');
    menuButton.setAttribute('aria-expanded', 'false');
    row.append(content, menuButton);
    item.append(row);

    if (renamingSetlistId === setlist.id) item.append(renderSetlistMenu(setlist));

    const childList = document.createElement('ul');
    childList.className = `home-list ${getPageClassName('setlist-chart-list')}`;
    childList.hidden = isCollapsed;
    childList.dataset.setlistDropId = setlist.id;
    childList.dataset.setlistChildListId = setlist.id;
    childList.addEventListener('dragover', (event) => {
      if (!hasDraggedLibraryChart(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      showSetlistDropPreview({ setlistId: setlist.id });
    });
    childList.addEventListener('drop', (event) => {
      event.preventDefault();
      const dropTarget = getSetlistDropTargetAtPoint(event.clientX, event.clientY);
      clearSetlistDropPreview();
      addChartToSetlist(setlist.id, getDraggedLibraryChartIdFromEvent(event, draggedLibraryChartId), dropTarget?.index);
    });
    setlist.items.forEach((setlistItem, index) => {
      const chartDocument = documentsById.get(setlistItem.chartId);
      const childItem = document.createElement('li');
      const childRow = document.createElement('div');
      childRow.className = `home-list-link ${getPageClassName('chart-row')} ${getPageClassName('setlist-chart-row')}`;
      childRow.classList.toggle('can-receive-chart', draggedLibraryChartId !== '' || draggedSetlistItem?.setlistId === setlist.id);
      childRow.draggable = false;
      childRow.dataset.setlistId = setlist.id;
      childRow.dataset.index = String(index);
      childRow.dataset.setlistDropId = setlist.id;
      childRow.dataset.setlistDropIndex = String(index);
      childRow.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        if (event.target instanceof HTMLElement && event.target.closest('.home-chart-entry-kebab')) return;
        resetSetlistItemPointerDrag();
        draggedLibraryChartId = '';
        setlistPointerStart = { x: event.clientX, y: event.clientY };
        setlistPointerCurrent = { x: event.clientX, y: event.clientY };
        setlistPointerId = event.pointerId;
        setlistPointerType = event.pointerType;
        setlistItemDragActivationTimer = window.setTimeout(() => {
          if (setlistPointerId !== event.pointerId || !setlistPointerStart || isSetlistItemScrollActive) return;
          const currentPoint = setlistPointerCurrent || setlistPointerStart;
          const movedDistance = Math.hypot(currentPoint.x - setlistPointerStart.x, currentPoint.y - setlistPointerStart.y);
          if (movedDistance > SETLIST_ITEM_TAP_DISTANCE_PX) return;
          draggedSetlistItem = { setlistId: setlist.id, index };
          isSetlistItemDragActive = true;
          childRow.classList.add('is-dragging');
          childRow.setPointerCapture(event.pointerId);
          const target = getSetlistDropTargetAtPoint(currentPoint.x, currentPoint.y);
          showSetlistDropPreview(target?.setlistId === setlist.id ? target : { setlistId: setlist.id, index });
        }, SETLIST_ITEM_DRAG_DELAY_MS);
      });
      childRow.addEventListener('pointermove', (event) => {
        if (setlistPointerId !== event.pointerId || !setlistPointerStart) return;
        const previousPoint = setlistPointerCurrent || setlistPointerStart;
        const nextPoint = { x: event.clientX, y: event.clientY };
        setlistPointerCurrent = nextPoint;
        const movedDistance = Math.hypot(nextPoint.x - setlistPointerStart.x, nextPoint.y - setlistPointerStart.y);
        if (isSetlistItemScrollActive) {
          event.preventDefault();
          scrollSetlistsPageBy(previousPoint.y - nextPoint.y);
          return;
        }
        if (!isSetlistItemDragActive) {
          if (movedDistance > SETLIST_ITEM_TAP_DISTANCE_PX) {
            clearSetlistItemDragActivationTimer();
            if (setlistPointerType === 'touch' || setlistPointerType === 'pen') {
              isSetlistItemScrollActive = true;
              event.preventDefault();
              scrollSetlistsPageBy(previousPoint.y - nextPoint.y);
            } else {
              resetSetlistItemPointerDrag(childRow);
            }
          }
          return;
        }
        if (!draggedSetlistItem) return;
        event.preventDefault();
        const target = getSetlistDropTargetAtPoint(event.clientX, event.clientY);
        showSetlistDropPreview(target?.setlistId === draggedSetlistItem.setlistId ? target : null);
      });
      childRow.addEventListener('pointerup', (event) => {
        if (setlistPointerId !== event.pointerId) return;
        clearSetlistItemDragActivationTimer();
        const start = setlistPointerStart;
        const draggedItem = draggedSetlistItem;
        const wasDragActive = isSetlistItemDragActive;
        const wasScrollActive = isSetlistItemScrollActive;
        draggedSetlistItem = null;
        setlistPointerStart = null;
        setlistPointerCurrent = null;
        setlistPointerId = null;
        setlistPointerType = '';
        isSetlistItemDragActive = false;
        isSetlistItemScrollActive = false;
        childRow.classList.remove('is-dragging');
        if (childRow.hasPointerCapture(event.pointerId)) childRow.releasePointerCapture(event.pointerId);
        const dropTarget = getSetlistDropTargetAtPoint(event.clientX, event.clientY);
        clearSetlistDropPreview();
        const movedDistance = start
          ? Math.hypot(event.clientX - start.x, event.clientY - start.y)
          : 0;
        if (!wasDragActive) {
          if (wasScrollActive) {
            event.preventDefault();
            return;
          }
          if (movedDistance <= SETLIST_ITEM_TAP_DISTANCE_PX) {
            openSetlistInChart(setlist.id, setlistItem.chartId);
          }
          return;
        }
        event.preventDefault();
        if (!draggedItem) return;
        if (!dropTarget || dropTarget.setlistId !== draggedItem.setlistId) return;
        moveSetlistItem(draggedItem.setlistId, draggedItem.index, dropTarget.index ?? setlist.items.length);
      });
      childRow.addEventListener('pointercancel', (event) => {
        if (childRow.hasPointerCapture(event.pointerId)) childRow.releasePointerCapture(event.pointerId);
        resetSetlistItemPointerDrag(childRow);
      });
      childRow.addEventListener('dragstart', (event) => {
        draggedLibraryChartId = '';
        draggedSetlistItem = { setlistId: setlist.id, index };
        event.dataTransfer?.setData('text/plain', `${setlist.id}:${index}`);
        event.dataTransfer?.setDragImage(childRow, 12, 12);
      });
      childRow.addEventListener('dragend', () => {
        draggedSetlistItem = null;
        clearSetlistDropPreview();
      });
      childRow.addEventListener('dragover', (event) => {
        if (draggedSetlistItem?.setlistId === setlist.id || hasDraggedLibraryChart(event)) {
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = draggedLibraryChartId ? 'copy' : 'move';
          const dropTarget = getSetlistDropTargetAtPoint(event.clientX, event.clientY);
          showSetlistDropPreview(dropTarget?.setlistId === setlist.id ? dropTarget : { setlistId: setlist.id, index });
        }
      });
      childRow.addEventListener('drop', (event) => {
        event.preventDefault();
        const dropTarget = getSetlistDropTargetAtPoint(event.clientX, event.clientY);
        clearSetlistDropPreview();
        const draggedChartId = getDraggedLibraryChartIdFromEvent(event, draggedLibraryChartId);
        const beforeIndex = dropTarget?.setlistId === setlist.id ? dropTarget.index : index;
        if (draggedChartId) addChartToSetlist(setlist.id, draggedChartId, beforeIndex);
        else moveSetlistItem(setlist.id, draggedSetlistItem?.index ?? -1, beforeIndex ?? index);
      });
      const childContent = document.createElement('div');
      childContent.className = getPageClassName('chart-link');
      childContent.append(createTextElement('span', 'home-list-title', chartDocument?.metadata.title || setlistItem.chartId));

      const removeButton = createMetadataButton(`Remove ${chartDocument?.metadata.title || 'chart'} from ${setlist.name}`, (event) => {
        event.preventDefault();
        event.stopPropagation();
        openSetlistItemActionMenu(setlist, index, removeButton);
      });
      removeButton.setAttribute('aria-haspopup', 'menu');
      removeButton.setAttribute('aria-expanded', 'false');
      childRow.append(childContent, removeButton);
      childItem.append(childRow);
      childList.append(childItem);
    });
    item.append(childList);
    dom.manageSetlistList.append(item);
  }
}

function renderSetlistMenu(setlist: ChartSetlist): HTMLElement {
  const menu = document.createElement('div');
  menu.className = getPageClassName('setlist-menu');
  const input = document.createElement('input');
  input.className = `${getPageClassName('text-input')} ${getPageClassName('setlist-menu-input')}`;
  input.type = 'text';
  input.value = setlist.name;
  input.placeholder = 'Setlist name';
  const saveButton = createButton('Validate', getPageClassName('small-action'));
  const cancelButton = createButton('Cancel', getPageClassName('small-action'));
  const saveRename = () => renameSetlist(setlist, input.value);
  saveButton.addEventListener('click', saveRename);
  cancelButton.addEventListener('click', () => {
    renamingSetlistId = '';
    renderSetlists();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') saveRename();
    if (event.key === 'Escape') {
      renamingSetlistId = '';
      renderSetlists();
    }
  });
  menu.append(input, saveButton, cancelButton);
  requestAnimationFrame(() => input.focus());
  return menu;
}

function renderCreateSetlistForm(): HTMLElement {
  const item = document.createElement('li');
  const row = document.createElement('div');
  row.className = `${getPageClassName('setlist-menu')} ${getPageClassName('create-setlist-row')}`;
  const input = document.createElement('input');
  input.className = `${getPageClassName('text-input')} ${getPageClassName('setlist-menu-input')}`;
  input.type = 'text';
  input.placeholder = 'New setlist';
  const addButton = createButton('Validate', getPageClassName('small-action'));
  const cancelButton = createButton('Cancel', getPageClassName('small-action'));
  const submit = () => {
    void createSetlist(input.value).catch((error) => setImportStatus(`Failed to create setlist: ${getErrorMessage(error)}`, true));
  };
  addButton.addEventListener('click', submit);
  cancelButton.addEventListener('click', () => {
    isCreateSetlistVisible = false;
    renderSetlists();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submit();
    if (event.key === 'Escape') {
      isCreateSetlistVisible = false;
      renderSetlists();
    }
  });
  row.append(input, addButton, cancelButton);
  item.append(row);
  requestAnimationFrame(() => input.focus());
  return item;
}

function persistSetlistChanges(setlists: ChartSetlist[], statusMessage: string) {
  currentSetlists = setlists;
  writeChartManagementSessionCache();
  renderManageUi();
  void persistSetlists(currentSetlists).then((persistedSetlists) => {
    currentSetlists = persistedSetlists;
    writeChartManagementSessionCache();
    setImportStatus(statusMessage);
    renderManageUi();
  }).catch((error) => setImportStatus(`Failed to update setlists: ${getErrorMessage(error)}`, true));
}

function updateSetlistItems(setlistId: string, items: ChartSetlist['items'], statusMessage: string) {
  persistSetlistChanges(currentSetlists.map((setlist) => setlist.id === setlistId
    ? { ...setlist, items, updatedAt: new Date().toISOString() }
    : setlist), statusMessage);
}

function getReorderDestinationIndex(fromIndex: number, beforeIndex: number, itemCount: number): number {
  const clampedBeforeIndex = Math.max(0, Math.min(beforeIndex, itemCount));
  return clampedBeforeIndex > fromIndex ? clampedBeforeIndex - 1 : clampedBeforeIndex;
}

function moveSetlistItem(setlistId: string, fromIndex: number, beforeIndex: number) {
  const setlist = currentSetlists.find((candidate) => candidate.id === setlistId);
  const toIndex = getReorderDestinationIndex(fromIndex, beforeIndex, setlist?.items.length || 0);
  if (!setlist || fromIndex < 0 || beforeIndex < 0 || fromIndex === toIndex) return;
  activeSetlistItemMenuKey = '';
  updateSetlistItems(setlistId, reorderSetlistItems(setlist.items, fromIndex, toIndex), 'Setlist reordered.');
}

function removeSetlistItem(setlistId: string, itemIndex: number) {
  const setlist = currentSetlists.find((candidate) => candidate.id === setlistId);
  if (!setlist) return;
  activeSetlistItemMenuKey = '';
  updateSetlistItems(setlistId, setlist.items.filter((_, index) => index !== itemIndex), 'Removed chart from setlist.');
}

function addChartToSetlist(setlistId: string, chartId: string, beforeIndex?: number) {
  if (!chartId) return;
  const setlist = currentSetlists.find((candidate) => candidate.id === setlistId);
  if (!setlist) return;
  draggedLibraryChartId = '';
  activeSetlistItemMenuKey = '';
  collapsedSetlistIds.delete(setlistId);
  if (setlist.items.some((item) => item.chartId === chartId)) {
    setImportStatus('Chart is already in this setlist.');
    return;
  }
  const nextItems = [...setlist.items];
  const insertIndex = Number.isInteger(beforeIndex)
    ? Math.max(0, Math.min(beforeIndex as number, nextItems.length))
    : nextItems.length;
  nextItems.splice(insertIndex, 0, { chartId });
  updateSetlistItems(setlistId, nextItems, 'Added chart to setlist.');
}

function renameSetlist(setlist: ChartSetlist, rawName: string) {
  const name = rawName.trim();
  if (!name || name === setlist.name) return;
  activeSetlistMenuId = '';
  renamingSetlistId = '';
  persistSetlistChanges(currentSetlists.map((candidate) => candidate.id === setlist.id
    ? { ...candidate, name, updatedAt: new Date().toISOString() }
    : candidate), 'Setlist renamed.');
}

function deleteSetlist(setlist: ChartSetlist) {
  closeSetlistActionMenu();
  closeAddChartPopup();
  activeSetlistMenuId = '';
  activeSetlistItemMenuKey = '';
  pendingDeleteSetlistId = '';
  collapsedSetlistIds.delete(setlist.id);
  persistSetlistChanges(currentSetlists.filter((candidate) => candidate.id !== setlist.id), 'Setlist deleted.');
}

async function createSetlist(rawName: string) {
  const name = rawName.trim();
  if (!name) return;
  currentSetlists = [...currentSetlists, createEmptyChartSetlist(name)];
  isCreateSetlistVisible = false;
  writeChartManagementSessionCache();
  renderManageUi();
  currentSetlists = await persistSetlists(currentSetlists);
  writeChartManagementSessionCache();
  setImportStatus(`Created setlist "${name}".`);
  renderManageUi();
}

function renderManageUi() {
  if (activeMode === 'library') {
    renderFacets();
    renderManageCharts();
  } else {
    renderSetlists();
  }
}

async function loadManageState() {
  const [persistedLibrary, persistedSetlists] = await Promise.all([
    loadPersistedChartLibrary(),
    loadPersistedSetlists()
  ]);
  setCurrentDocuments(persistedLibrary?.documents || []);
  isFullManageStateLoaded = true;
  currentSource = persistedLibrary?.source || 'imported library';
  currentSetlists = persistedSetlists;
  writeChartManagementSessionCache();
  renderManageUi();
}

function bindChartManagementEvents() {
  dom.manageChartSearchInput?.addEventListener('input', () => {
    libraryPreviewStartIndex = 0;
    persistLibraryFilters();
    renderManageCharts();
  });
  window.addEventListener('resize', () => {
    scheduleSetlistActionMenuPosition();
    if (activeMode === 'library') {
      scheduleLibraryPreviewLayout();
      return;
    }
    document.querySelectorAll<HTMLElement>(getPageChartLinkSelector()).forEach(updateChartEntrySubtitleVisibility);
  });
  window.visualViewport?.addEventListener('resize', () => {
    scheduleSetlistActionMenuPosition();
    scheduleLibraryPreviewLayout();
  });
  [dom.manageSourceFilter, dom.manageStyleFilter, dom.manageSetlistFilter].forEach((element) => {
    element?.addEventListener('change', () => {
      const key = element.dataset.filterKey as ChartManageFilterKey | undefined;
      if (!key || !element.value) return;
      selectFilterValue(key, element.value, getSelectFilterOptions(element));
    });
  });
  dom.manageCreateSetlistButton?.addEventListener('click', () => {
    closeSetlistActionMenu();
    closeAddChartPopup();
    isCreateSetlistVisible = !isCreateSetlistVisible;
    renamingSetlistId = '';
    pendingDeleteSetlistId = '';
    renderSetlists();
  });
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node)) return;
    if (setlistActionMenu?.contains(event.target)) return;
    if (event.target instanceof HTMLElement && event.target.closest('.setlists-setlist-row .home-chart-entry-kebab')) return;
    closeSetlistActionMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeLibraryDeleteReviewPanel();
    chartEntryActions?.closeAll();
    closeSetlistActionMenu();
    closeAddChartPopup();
  });
}

export function initializeChartManagementPage(mode: ChartManagementMode) {
  activeMode = mode;
  initializeSharpElevenTheme();
  applyPersistedLibraryFilters();
  chartEntryActions = createChartEntryActionsController({
    getState: () => ({ documents: currentDocuments, setlists: currentSetlists }),
    persistState: persistMetadataState,
    persistSetlists: persistChartEntrySetlists,
    removeChartReferences: removePersistedChartReferences
  });
  bindChartManagementEvents();
  renderCachedManageStateIfAvailable();
  void loadManageState().catch((error) => {
    setImportStatus(`Failed to load chart library: ${getErrorMessage(error)}`, true);
  });
}
