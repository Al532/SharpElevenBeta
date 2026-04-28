import { initializeSharpElevenTheme } from '../app/app-theme.js';
import {
  loadPersistedChartLibrary,
  loadPersistedSetlists,
  persistChartLibrary,
  persistSetlists
} from '../chart/chart-persistence.js';
import {
  createEmptyChartSetlist,
  filterChartDocuments,
  getChartSourceRefs,
  getChartSetlistMembership,
  reorderSetlistItems
} from '../chart/chart-library.js';
import type { ChartDocument, ChartSetlist } from '../../core/types/contracts';
import {
  closeChartMetadataPanel,
  openChartMetadataPanel
} from '../chart/chart-metadata-panel.js';
import { createChartManagementDomRefs } from './chart-management-dom.js';
import {
  type ChartManageFilterKey,
  type ChartManageFilterOption,
  type ChartManagementMode,
  type SetlistDragItem
} from './chart-management-types.js';
import {
  createChartManagementFilterState,
  getFilteredChartManagementDocuments,
  getSelectFilterOptions,
  renderChartManagementFacets,
  selectChartManagementFilterValue
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
let currentSource = 'imported library';
let currentSetlists: ChartSetlist[] = [];
let activeSetlistMenuId = '';
let activeSetlistItemMenuKey = '';
let setlistActionMenu: HTMLElement | null = null;
let addChartPopup: HTMLElement | null = null;
let draggedSetlistItem: SetlistDragItem | null = null;
let draggedLibraryChartId = '';
let setlistPointerStart: { x: number; y: number } | null = null;
let setlistPointerCurrent: { x: number; y: number } | null = null;
let setlistPointerId: number | null = null;
let setlistItemDragActivationTimer: ReturnType<typeof window.setTimeout> | null = null;
let isSetlistItemDragActive = false;
let isCreateSetlistVisible = false;
let renamingSetlistId = '';
let pendingDeleteSetlistId = '';
const SETLIST_ITEM_DRAG_DELAY_MS = 240;
const SETLIST_ITEM_TAP_DISTANCE_PX = 6;
const SETLIST_ITEM_PRE_DRAG_SCROLL_DISTANCE_PX = 12;
const CHART_MANAGEMENT_SESSION_CACHE_KEY = 'sharp-eleven-chart-management-session-cache-v1';
const collapsedSetlistIds = new Set<string>();
const filterState = createChartManagementFilterState();

type ChartManagementCachedDocument = {
  id: string;
  title: string;
  composer?: string;
  origin?: string;
  style?: string;
  styleReference?: string;
  userTags?: string[];
  sourceRefs?: ChartDocument['source']['sourceRefs'];
};

type ChartManagementSessionCache = {
  version: 1;
  source: string;
  documents: ChartManagementCachedDocument[];
  setlists: ChartSetlist[];
  savedAt: number;
};

function toCachedDocument(document: ChartDocument): ChartManagementCachedDocument | null {
  const id = String(document.metadata?.id || '').trim();
  if (!id) return null;
  return {
    id,
    title: String(document.metadata?.title || '').trim() || 'Untitled chart',
    composer: typeof document.metadata?.composer === 'string' ? document.metadata.composer : '',
    origin: typeof document.metadata?.origin === 'string' ? document.metadata.origin : '',
    style: typeof document.metadata?.style === 'string' ? document.metadata.style : '',
    styleReference: typeof document.metadata?.styleReference === 'string' ? document.metadata.styleReference : '',
    userTags: Array.isArray(document.metadata?.userTags)
      ? document.metadata.userTags.map((tag) => String(tag || '').trim()).filter(Boolean)
      : [],
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
      origin: String(cachedDocument.origin || 'imported'),
      style: String(cachedDocument.style || ''),
      styleReference: String(cachedDocument.styleReference || ''),
      userTags: Array.isArray(cachedDocument.userTags)
        ? cachedDocument.userTags.map((tag) => String(tag || '').trim()).filter(Boolean)
        : []
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

function renderCachedSetlistsIfAvailable(): void {
  if (activeMode !== 'setlists') return;
  const cache = readChartManagementSessionCache();
  if (!cache) return;
  currentDocuments = cache.documents
    .map(createDocumentFromCache)
    .filter((document): document is ChartDocument => Boolean(document));
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
    setlists: currentSetlists,
    query,
    filterState
  });
}

function selectFilterValue(key: ChartManageFilterKey, value: string, values: ChartManageFilterOption[]) {
  selectChartManagementFilterValue({ filterState, key, value, values });
  renderFacets();
  renderManageCharts();
}

function renderFacets() {
  renderChartManagementFacets({
    documents: currentDocuments,
    setlists: currentSetlists,
    dom,
    filterState,
    getPageClassName,
    onSelectFilterValue: selectFilterValue
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
      row.className = `home-list-link home-chart-entry ${getPageClassName('summary-row')}`;
      const summaryButton = document.createElement('button');
      summaryButton.type = 'button';
      summaryButton.className = getPageClassName('summary-open');
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
    row.className = `home-list-link ${getPageClassName('chart-row')}`;
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
    content.className = getPageClassName('chart-link');
    content.append(createTextElement('span', 'home-list-title', chartDocument.metadata.title || 'Untitled chart'));
    const subtitle = getChartSubtitle(chartDocument);
    if (subtitle) {
      content.append(createTextElement('span', 'home-list-meta', subtitle));
      requestAnimationFrame(() => updateChartEntrySubtitleVisibility(content));
    }
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
  writeChartManagementSessionCache();
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
  const anchorRect = anchor.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const margin = 8;
  const left = Math.min(
    Math.max(margin, anchorRect.right - menuRect.width),
    Math.max(margin, window.innerWidth - menuRect.width - margin)
  );
  const top = Math.min(
    anchorRect.bottom + 4,
    Math.max(margin, window.innerHeight - menuRect.height - margin)
  );
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function closeSetlistActionMenu(): void {
  document.querySelectorAll<HTMLElement>('.setlists-body .home-chart-entry-kebab[aria-expanded="true"]')
    .forEach((button) => button.setAttribute('aria-expanded', 'false'));
  activeSetlistMenuId = '';
  activeSetlistItemMenuKey = '';
  pendingDeleteSetlistId = '';
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

function resetSetlistItemPointerDrag(row?: HTMLElement): void {
  clearSetlistItemDragActivationTimer();
  draggedSetlistItem = null;
  setlistPointerStart = null;
  setlistPointerCurrent = null;
  setlistPointerId = null;
  isSetlistItemDragActive = false;
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
  anchor.setAttribute('aria-expanded', 'true');
  menu.classList.remove('is-confirming-delete');
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Setlist actions');

  const openButton = createMenuButton('Open');
  openButton.addEventListener('click', () => {
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
  requestAnimationFrame(() => openButton.focus());
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
    const isCollapsed = collapsedSetlistIds.has(setlist.id);

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
        setlistItemDragActivationTimer = window.setTimeout(() => {
          if (setlistPointerId !== event.pointerId || !setlistPointerStart) return;
          draggedSetlistItem = { setlistId: setlist.id, index };
          isSetlistItemDragActive = true;
          childRow.classList.add('is-dragging');
          childRow.setPointerCapture(event.pointerId);
          const currentPoint = setlistPointerCurrent || setlistPointerStart;
          const target = getSetlistDropTargetAtPoint(currentPoint.x, currentPoint.y);
          showSetlistDropPreview(target?.setlistId === setlist.id ? target : { setlistId: setlist.id, index });
        }, SETLIST_ITEM_DRAG_DELAY_MS);
      });
      childRow.addEventListener('pointermove', (event) => {
        if (setlistPointerId !== event.pointerId || !setlistPointerStart) return;
        setlistPointerCurrent = { x: event.clientX, y: event.clientY };
        const movedDistance = Math.hypot(event.clientX - setlistPointerStart.x, event.clientY - setlistPointerStart.y);
        if (!isSetlistItemDragActive) {
          if (movedDistance > SETLIST_ITEM_PRE_DRAG_SCROLL_DISTANCE_PX) {
            resetSetlistItemPointerDrag(childRow);
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
        draggedSetlistItem = null;
        setlistPointerStart = null;
        setlistPointerCurrent = null;
        setlistPointerId = null;
        isSetlistItemDragActive = false;
        childRow.classList.remove('is-dragging');
        if (childRow.hasPointerCapture(event.pointerId)) childRow.releasePointerCapture(event.pointerId);
        const dropTarget = getSetlistDropTargetAtPoint(event.clientX, event.clientY);
        clearSetlistDropPreview();
        const movedDistance = start
          ? Math.hypot(event.clientX - start.x, event.clientY - start.y)
          : 0;
        if (!wasDragActive) {
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
  input.placeholder = 'New setlist name';
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
  currentDocuments = persistedLibrary?.documents || [];
  currentSource = persistedLibrary?.source || 'imported library';
  currentSetlists = persistedSetlists;
  writeChartManagementSessionCache();
  renderManageUi();
}

function bindChartManagementEvents() {
  dom.manageChartSearchInput?.addEventListener('input', renderManageCharts);
  window.addEventListener('resize', () => {
    document.querySelectorAll<HTMLElement>(getPageChartLinkSelector()).forEach(updateChartEntrySubtitleVisibility);
  });
  [dom.manageOriginFilter, dom.manageSourceFilter, dom.manageTagFilter, dom.manageSetlistFilter].forEach((element) => {
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
    closeMetadataPanel();
    closeSetlistActionMenu();
    closeAddChartPopup();
  });
}

export function initializeChartManagementPage(mode: ChartManagementMode) {
  activeMode = mode;
  initializeSharpElevenTheme();
  bindChartManagementEvents();
  renderCachedSetlistsIfAvailable();
  void loadManageState().catch((error) => {
    setImportStatus(`Failed to load chart library: ${getErrorMessage(error)}`, true);
  });
}
