import { initializeSharpElevenTheme } from './src/features/app/app-theme.js';
import {
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
  listChartLibraryFacets,
  reorderSetlistItems
} from './src/features/chart/chart-library.js';
import type { ChartDocument, ChartSetlist } from './src/core/types/contracts';
import {
  closeChartMetadataPanel,
  openChartMetadataPanel
} from './src/features/chart/chart-metadata-panel.js';

initializeSharpElevenTheme();

const CHIP_FILTER_OPTION_LIMIT = 12;
const CHART_MANAGE_FILTER_KEYS = ['origin', 'source', 'tag', 'setlist'] as const;
const FILTER_ACTION_ALL = '__all__';
const FILTER_ACTION_NONE = '__none__';
const FILTER_TAG_NO_TAG = '__no_tag__';

type ChartManageFilterKey = typeof CHART_MANAGE_FILTER_KEYS[number];
type ChartManageFilterMode = 'all' | 'custom';
type ChartManageFilterOption = {
  label: string;
  value: string;
};

const dom = {
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
  manageCreateSetlistButton: document.getElementById('manage-create-setlist-button') as HTMLButtonElement | null,
  manageSetlistList: document.getElementById('manage-setlist-list'),
  manageMetadataPanel: document.getElementById('manage-metadata-panel')
};

let currentDocuments: ChartDocument[] = [];
let currentSource = 'imported library';
let currentSetlists: ChartSetlist[] = [];
let activeSetlistMenuId = '';
let activeSetlistItemMenuKey = '';
let draggedSetlistItem: { setlistId: string; index: number } | null = null;
let draggedSetlistOrderIndex: number | null = null;
let draggedLibraryChartId = '';
let setlistPointerStart: { x: number; y: number } | null = null;
let isCreateSetlistVisible = false;
let renamingSetlistId = '';
let pendingDeleteSetlistId = '';
const collapsedSetlistIds = new Set<string>();
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
  if (isError) console.error(message);
  else console.info(message);
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
  if (hasTagFilter) {
    documents = documents.filter((document) => {
      const documentTags = (document.metadata?.userTags || []).map((tag) => String(tag || '').trim()).filter(Boolean);
      return (documentTags.length === 0 && tags.has(FILTER_TAG_NO_TAG))
        || documentTags.some((candidate) => tags.has(candidate));
    });
  }
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
  return activeManageFilterModes[key] === 'custom'
    && values.length > 0
    && active.size === values.length
    && values.every((option) => active.has(option.value));
}

function getSelectedFilterCount(key: ChartManageFilterKey, values: ChartManageFilterOption[]) {
  return activeManageFilterModes[key] === 'all' ? 0 : isFilterAllSelected(key, values) ? values.length : activeManageFilters[key].size;
}

function selectFilterValue(key: ChartManageFilterKey, value: string, values: ChartManageFilterOption[]) {
  const active = activeManageFilters[key];
  if (value === FILTER_ACTION_ALL) {
    activeManageFilterModes[key] = 'custom';
    active.clear();
    getFilterOptionValues(values).forEach((optionValue) => active.add(optionValue));
  } else if (value === FILTER_ACTION_NONE) {
    activeManageFilterModes[key] = 'all';
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
  const isFilterCleared = activeManageFilterModes[key] === 'all';
  host.replaceChildren();
  const buttons = [
    { label: 'All', value: FILTER_ACTION_ALL },
    { label: 'None', value: FILTER_ACTION_NONE },
    ...values
  ].map(({ label, value }) => {
    const button = createButton(label, 'chart-manage-filter-chip');
    const isFilterAction = value === FILTER_ACTION_ALL || value === FILTER_ACTION_NONE;
    const isActive = value === FILTER_ACTION_ALL
      ? isAllSelected
      : value === FILTER_ACTION_NONE
        ? isFilterCleared
        : !isFilterAction && active.has(value);
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
  const tagOptions = [
    ...facets.tags.map((tag) => ({ label: tag, value: tag })),
    currentDocuments.some((document) => (document.metadata?.userTags || []).map((tag) => String(tag || '').trim()).filter(Boolean).length === 0)
      ? { label: 'No tag', value: FILTER_TAG_NO_TAG }
      : null
  ].filter(Boolean) as ChartManageFilterOption[];
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
    values: tagOptions
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
  const shouldSummarize = documents.length === 0 || documents.length > 5;
  if (dom.manageLibrarySummary) {
    dom.manageLibrarySummary.replaceChildren();
    dom.manageLibrarySummary.hidden = !shouldSummarize;
    if (shouldSummarize) {
      const row = document.createElement('div');
      row.className = 'home-list-link home-chart-entry chart-manage-summary-row';
      const summaryButton = document.createElement('button');
      summaryButton.type = 'button';
      summaryButton.className = 'chart-manage-summary-open';
      summaryButton.append(createTextElement('span', 'home-list-title', `${documents.length} matching chart${documents.length === 1 ? '' : 's'}`));
      const metadataButton = createMetadataButton('Edit metadata for matching charts', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openMatchingMetadataPanel();
      });
      row.append(summaryButton, metadataButton);
      dom.manageLibrarySummary.append(row);
    }
  }
  if (!dom.manageChartList) return;
  dom.manageChartList.toggleAttribute('hidden', shouldSummarize);
  dom.manageChartList.classList.toggle('is-direct', !shouldSummarize);
  dom.manageChartList.replaceChildren();
  if (shouldSummarize) return;
  for (const chartDocument of documents) {
    const item = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'home-list-link chart-manage-chart-row';
    row.dataset.chartId = chartDocument.metadata.id;
    row.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      draggedSetlistItem = null;
      draggedLibraryChartId = chartDocument.metadata.id;
      row.classList.add('is-dragging');
      row.setPointerCapture(event.pointerId);
    });
    row.addEventListener('pointermove', (event) => {
      if (!draggedLibraryChartId) return;
      showSetlistDropPreview(getSetlistDropTargetAtPoint(event.clientX, event.clientY));
    });
    row.addEventListener('pointerup', (event) => {
      const chartId = draggedLibraryChartId;
      draggedLibraryChartId = '';
      row.classList.remove('is-dragging');
      const dropTarget = getSetlistDropTargetAtPoint(event.clientX, event.clientY);
      clearSetlistDropPreview();
      if (!chartId) return;
      if (!dropTarget) return;
      addChartToSetlist(dropTarget.setlistId, chartId, dropTarget.index);
    });
    row.addEventListener('pointercancel', () => {
      draggedLibraryChartId = '';
      row.classList.remove('is-dragging');
      clearSetlistDropPreview();
    });
    row.addEventListener('dragstart', (event) => {
      draggedSetlistItem = null;
      draggedLibraryChartId = chartDocument.metadata.id;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('text/plain', `chart:${chartDocument.metadata.id}`);
      }
      event.dataTransfer?.setDragImage(row, 12, 12);
    });
    row.addEventListener('dragend', () => {
      draggedLibraryChartId = '';
      clearSetlistDropPreview();
    });
    const content = document.createElement('div');
    content.className = 'chart-manage-chart-link';
    content.append(createTextElement('span', 'home-list-title', chartDocument.metadata.title || 'Untitled chart'));
    const subtitle = getChartSubtitle(chartDocument);
    if (subtitle) content.append(createTextElement('span', 'home-list-meta', subtitle));
    const menuButton = createMetadataButton(`Edit metadata for ${chartDocument.metadata.title || 'chart'}`, (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMetadataPanel(chartDocument.metadata.id);
    });
    row.append(content, menuButton);
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

function getDraggedLibraryChartId(event: DragEvent): string {
  const payload = event.dataTransfer?.getData('text/plain') || '';
  if (payload.startsWith('chart:')) return payload.slice('chart:'.length);
  return draggedLibraryChartId;
}

function hasDraggedLibraryChart(event: DragEvent): boolean {
  if (draggedSetlistOrderIndex !== null || draggedSetlistItem) return false;
  return Boolean(draggedLibraryChartId);
}

function getSetlistDropTargetAtPoint(clientX: number, clientY: number): { setlistId: string; index?: number } | null {
  const element = document.elementFromPoint(clientX, clientY);
  const target = element instanceof HTMLElement ? element.closest<HTMLElement>('[data-setlist-drop-id]') : null;
  if (!target) return null;
  const setlistId = target.dataset.setlistDropId || '';
  if (!setlistId) return null;
  const rawIndex = target.dataset.setlistDropIndex;
  const index = rawIndex === undefined ? undefined : Number(rawIndex);
  return Number.isFinite(index) ? { setlistId, index } : { setlistId };
}

function findSetlistChildList(setlistId: string): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-setlist-child-list-id]'))
    .find((element) => element.dataset.setlistChildListId === setlistId);
}

function findSetlistDropRow(setlistId: string, index: number): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-setlist-drop-index]'))
    .find((element) => element.dataset.setlistDropId === setlistId && Number(element.dataset.setlistDropIndex) === index);
}

function clearSetlistDropPreview() {
  document.querySelectorAll('.has-drop-preview-before, .has-drop-preview-end').forEach((element) => {
    element.classList.remove('has-drop-preview-before', 'has-drop-preview-end');
  });
}

function clearSetlistOrderPreview() {
  document.querySelectorAll('.has-setlist-order-preview-before').forEach((element) => {
    element.classList.remove('has-setlist-order-preview-before');
  });
}

function showSetlistOrderPreview(index: number) {
  clearSetlistOrderPreview();
  Array.from(document.querySelectorAll<HTMLElement>('[data-setlist-order-index]'))
    .find((element) => Number(element.dataset.setlistOrderIndex) === index)
    ?.classList.add('has-setlist-order-preview-before');
}

function showSetlistDropPreview(target: { setlistId: string; index?: number } | null) {
  clearSetlistDropPreview();
  if (!target) return;
  if (Number.isFinite(target.index)) {
    findSetlistDropRow(target.setlistId, target.index as number)?.classList.add('has-drop-preview-before');
  } else {
    findSetlistChildList(target.setlistId)?.classList.add('has-drop-preview-end');
  }
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

  for (const [setlistIndex, setlist] of currentSetlists.entries()) {
    const item = document.createElement('li');
    item.className = 'chart-manage-setlist-entry';
    item.dataset.setlistOrderIndex = String(setlistIndex);
    const isCollapsed = collapsedSetlistIds.has(setlist.id);

    const row = document.createElement('div');
    row.className = 'home-list-link chart-manage-setlist-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = 'minmax(0, 1fr) auto';
    row.style.alignItems = 'center';
    row.style.columnGap = '0.65rem';
    row.draggable = true;
    row.classList.toggle('can-receive-chart', draggedLibraryChartId !== '');
    row.setAttribute('aria-expanded', String(!isCollapsed));
    row.dataset.setlistDropId = setlist.id;
    row.addEventListener('dragstart', (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('.home-chart-entry-kebab')) return;
      draggedLibraryChartId = '';
      draggedSetlistItem = null;
      draggedSetlistOrderIndex = setlistIndex;
      event.dataTransfer?.setData('text/plain', `setlist-order:${setlistIndex}`);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer?.setDragImage(row, 12, 12);
    });
    row.addEventListener('dragend', () => {
      draggedSetlistOrderIndex = null;
      clearSetlistOrderPreview();
    });
    row.addEventListener('dragover', (event) => {
      if (draggedSetlistOrderIndex === null) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      showSetlistOrderPreview(setlistIndex);
    });
    row.addEventListener('drop', (event) => {
      if (draggedSetlistOrderIndex === null) return;
      event.preventDefault();
      const fromIndex = draggedSetlistOrderIndex;
      draggedSetlistOrderIndex = null;
      clearSetlistOrderPreview();
      moveSetlist(fromIndex, setlistIndex);
    });
    row.addEventListener('click', (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('.home-chart-entry-kebab')) return;
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
      event.preventDefault();
      clearSetlistDropPreview();
      addChartToSetlist(setlist.id, getDraggedLibraryChartId(event));
    });

    const content = document.createElement('div');
    content.className = 'chart-manage-setlist-open';
    content.append(
      createTextElement('span', 'home-list-title', setlist.name),
      createTextElement('span', 'home-list-meta', `${setlist.items.length} ${pluralizeChartLabel(setlist.items.length)}`)
    );

    const menuButton = createMetadataButton(`Manage ${setlist.name}`, (event) => {
      event.preventDefault();
      event.stopPropagation();
      activeSetlistMenuId = activeSetlistMenuId === setlist.id ? '' : setlist.id;
      activeSetlistItemMenuKey = '';
      renderSetlists();
    });
    row.append(content, menuButton);
    item.append(row);

    if (activeSetlistMenuId === setlist.id) item.append(renderSetlistMenu(setlist));

    const childList = document.createElement('ul');
    childList.className = 'home-list chart-manage-setlist-chart-list';
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
      clearSetlistDropPreview();
      addChartToSetlist(setlist.id, getDraggedLibraryChartId(event));
    });
    setlist.items.forEach((setlistItem, index) => {
      const chartDocument = documentsById.get(setlistItem.chartId);
      const childItem = document.createElement('li');
      const childMenuKey = `${setlist.id}:${index}`;
      const childRow = document.createElement('div');
      childRow.className = 'home-list-link chart-manage-chart-row chart-manage-setlist-chart-row';
      childRow.classList.toggle('can-receive-chart', draggedLibraryChartId !== '' || draggedSetlistItem?.setlistId === setlist.id);
      childRow.draggable = true;
      childRow.dataset.setlistId = setlist.id;
      childRow.dataset.index = String(index);
      childRow.dataset.setlistDropId = setlist.id;
      childRow.dataset.setlistDropIndex = String(index);
      childRow.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        if (event.target instanceof HTMLElement && event.target.closest('.home-chart-entry-kebab')) return;
        event.preventDefault();
        draggedLibraryChartId = '';
        draggedSetlistItem = { setlistId: setlist.id, index };
        setlistPointerStart = { x: event.clientX, y: event.clientY };
        childRow.classList.add('is-dragging');
        childRow.setPointerCapture(event.pointerId);
      });
      childRow.addEventListener('pointermove', (event) => {
        if (!draggedSetlistItem) return;
        const target = getSetlistDropTargetAtPoint(event.clientX, event.clientY);
        showSetlistDropPreview(target?.setlistId === draggedSetlistItem.setlistId ? target : null);
      });
      childRow.addEventListener('pointerup', (event) => {
        const draggedItem = draggedSetlistItem;
        draggedSetlistItem = null;
        childRow.classList.remove('is-dragging');
        const dropTarget = getSetlistDropTargetAtPoint(event.clientX, event.clientY);
        clearSetlistDropPreview();
        if (!draggedItem) return;
        const movedDistance = setlistPointerStart
          ? Math.hypot(event.clientX - setlistPointerStart.x, event.clientY - setlistPointerStart.y)
          : 0;
        setlistPointerStart = null;
        if (movedDistance < 6) return;
        if (!dropTarget || dropTarget.setlistId !== draggedItem.setlistId) return;
        moveSetlistItem(draggedItem.setlistId, draggedItem.index, dropTarget.index ?? setlist.items.length - 1);
      });
      childRow.addEventListener('pointercancel', () => {
        draggedSetlistItem = null;
        setlistPointerStart = null;
        childRow.classList.remove('is-dragging');
        clearSetlistDropPreview();
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
          showSetlistDropPreview({ setlistId: setlist.id, index });
        }
      });
      childRow.addEventListener('drop', (event) => {
        event.preventDefault();
        clearSetlistDropPreview();
        const draggedChartId = getDraggedLibraryChartId(event);
        if (draggedChartId) addChartToSetlist(setlist.id, draggedChartId, index);
        else moveSetlistItem(setlist.id, draggedSetlistItem?.index ?? -1, index);
      });
      const childContent = document.createElement('div');
      childContent.className = 'chart-manage-chart-link';
      childContent.append(createTextElement('span', 'home-list-title', chartDocument?.metadata.title || setlistItem.chartId));

      const removeButton = createMetadataButton(`Remove ${chartDocument?.metadata.title || 'chart'} from ${setlist.name}`, (event) => {
        event.preventDefault();
        event.stopPropagation();
        activeSetlistItemMenuKey = activeSetlistItemMenuKey === childMenuKey ? '' : childMenuKey;
        activeSetlistMenuId = '';
        renderSetlists();
      });
      childRow.append(childContent);
      childItem.append(childRow, removeButton);
      if (activeSetlistItemMenuKey === childMenuKey) childItem.append(renderSetlistItemMenu(setlist.id, index));
      childList.append(childItem);
    });
    item.append(childList);
    dom.manageSetlistList.append(item);
  }
}

function renderSetlistMenu(setlist: ChartSetlist): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'chart-manage-setlist-menu';
  if (renamingSetlistId === setlist.id) {
    const input = document.createElement('input');
    input.className = 'chart-manage-text-input chart-manage-setlist-menu-input';
    input.type = 'text';
    input.value = setlist.name;
    input.placeholder = 'Setlist name';
    const saveButton = createButton('Validate', 'chart-manage-small-action');
    const cancelButton = createButton('Cancel', 'chart-manage-small-action');
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
    return menu;
  }
  const playButton = createButton('Play', 'chart-manage-small-action');
  playButton.addEventListener('click', () => {
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('setlist', setlist.id);
    window.location.assign(targetUrl.toString());
  });
  const renameButton = createButton('Rename', 'chart-manage-small-action');
  renameButton.addEventListener('click', () => {
    renamingSetlistId = setlist.id;
    pendingDeleteSetlistId = '';
    renderSetlists();
  });
  const deleteButton = createButton(pendingDeleteSetlistId === setlist.id ? 'Confirm delete' : 'Delete', 'chart-manage-small-action chart-manage-danger');
  deleteButton.addEventListener('click', () => deleteSetlist(setlist));
  menu.append(playButton, renameButton, deleteButton);
  return menu;
}

function renderSetlistItemMenu(setlistId: string, itemIndex: number): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'chart-manage-setlist-menu chart-manage-setlist-item-menu';
  const deleteButton = createButton('Delete from setlist', 'chart-manage-small-action chart-manage-danger');
  deleteButton.addEventListener('click', () => {
    activeSetlistItemMenuKey = '';
    removeSetlistItem(setlistId, itemIndex);
  });
  menu.append(deleteButton);
  return menu;
}

function renderCreateSetlistForm(): HTMLElement {
  const item = document.createElement('li');
  const row = document.createElement('div');
  row.className = 'chart-manage-setlist-menu chart-manage-create-setlist-row';
  const input = document.createElement('input');
  input.className = 'chart-manage-text-input chart-manage-setlist-menu-input';
  input.type = 'text';
  input.placeholder = 'New setlist name';
  const addButton = createButton('Validate', 'chart-manage-small-action');
  const cancelButton = createButton('Cancel', 'chart-manage-small-action');
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
  activeSetlistItemMenuKey = '';
  updateSetlistItems(setlistId, reorderSetlistItems(setlist.items, fromIndex, toIndex), 'Setlist reordered.');
}

function moveSetlist(fromIndex: number, toIndex: number) {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= currentSetlists.length || toIndex >= currentSetlists.length || fromIndex === toIndex) return;
  const nextSetlists = [...currentSetlists];
  const [movedSetlist] = nextSetlists.splice(fromIndex, 1);
  nextSetlists.splice(toIndex, 0, movedSetlist);
  activeSetlistMenuId = '';
  activeSetlistItemMenuKey = '';
  persistSetlistChanges(nextSetlists.map((setlist) => setlist.id === movedSetlist.id
    ? { ...setlist, updatedAt: new Date().toISOString() }
    : setlist), 'Setlists reordered.');
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
  if (pendingDeleteSetlistId !== setlist.id) {
    pendingDeleteSetlistId = setlist.id;
    renderSetlists();
    return;
  }
  activeSetlistMenuId = '';
  activeSetlistItemMenuKey = '';
  pendingDeleteSetlistId = '';
  collapsedSetlistIds.delete(setlist.id);
  persistSetlistChanges(currentSetlists.filter((candidate) => candidate.id !== setlist.id), 'Setlist deleted.');
}

async function createSetlist(rawName: string) {
  const name = rawName.trim();
  if (!name) return;
  currentSetlists = await persistSetlists([...currentSetlists, createEmptyChartSetlist(name)]);
  isCreateSetlistVisible = false;
  setImportStatus(`Created setlist "${name}".`);
  renderManageUi();
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

dom.manageChartSearchInput?.addEventListener('input', renderManageCharts);
[dom.manageOriginFilter, dom.manageSourceFilter, dom.manageTagFilter, dom.manageSetlistFilter].forEach((element) => {
  element?.addEventListener('change', () => {
    const key = element.dataset.filterKey as ChartManageFilterKey | undefined;
    if (!key || !element.value) return;
    selectFilterValue(key, element.value, getSelectFilterOptions(element));
  });
});
dom.manageCreateSetlistButton?.addEventListener('click', () => {
  isCreateSetlistVisible = !isCreateSetlistVisible;
  renamingSetlistId = '';
  pendingDeleteSetlistId = '';
  renderSetlists();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMetadataPanel();
});

void loadManageState().catch((error) => {
  setImportStatus(`Failed to load chart library: ${getErrorMessage(error)}`, true);
});
