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
  clearSetlistOrderPreview,
  getDraggedLibraryChartId as getDraggedLibraryChartIdFromEvent,
  getSetlistDropTargetAtPoint,
  hasDraggedLibraryChart as hasDraggedLibraryChartState,
  showSetlistDropPreview,
  showSetlistOrderPreview
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
let draggedSetlistOrderIndex: number | null = null;
let draggedLibraryChartId = '';
let setlistPointerStart: { x: number; y: number } | null = null;
let isCreateSetlistVisible = false;
let renamingSetlistId = '';
let pendingDeleteSetlistId = '';
const collapsedSetlistIds = new Set<string>();
const filterState = createChartManagementFilterState();

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
  if (!setlistActionMenu) return;
  setlistActionMenu.hidden = true;
  setlistActionMenu.replaceChildren();
}

function closeAddChartPopup(): void {
  if (!addChartPopup) return;
  addChartPopup.hidden = true;
  addChartPopup.replaceChildren();
}

function hasDraggedLibraryChart(event: DragEvent): boolean {
  return hasDraggedLibraryChartState({
    draggedSetlistOrderIndex,
    draggedSetlistItem,
    draggedLibraryChartId
  });
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
  menu.setAttribute('aria-label', 'Setlist actions');

  const openButton = createMenuButton('Open');
  openButton.addEventListener('click', () => {
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('setlist', setlist.id);
    window.location.assign(targetUrl.toString());
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

  const deleteButton = createMenuButton(
    pendingDeleteSetlistId === setlist.id ? 'Confirm delete' : 'Delete',
    'home-chart-entry-menu-item is-danger'
  );
  deleteButton.addEventListener('click', () => {
    if (pendingDeleteSetlistId !== setlist.id) {
      pendingDeleteSetlistId = setlist.id;
      openSetlistActionMenu(setlist, anchor, true);
      requestAnimationFrame(() => deleteButton.focus());
      return;
    }
    deleteSetlist(setlist);
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

  for (const [setlistIndex, setlist] of currentSetlists.entries()) {
    const item = document.createElement('li');
    item.className = getPageClassName('setlist-entry');
    item.dataset.setlistOrderIndex = String(setlistIndex);
    const isCollapsed = collapsedSetlistIds.has(setlist.id);

    const row = document.createElement('div');
    row.className = `home-list-link ${getPageClassName('setlist-row')}`;
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
      clearSetlistDropPreview();
      addChartToSetlist(setlist.id, getDraggedLibraryChartIdFromEvent(event, draggedLibraryChartId));
    });
    setlist.items.forEach((setlistItem, index) => {
      const chartDocument = documentsById.get(setlistItem.chartId);
      const childItem = document.createElement('li');
      const childRow = document.createElement('div');
      childRow.className = `home-list-link ${getPageClassName('chart-row')} ${getPageClassName('setlist-chart-row')}`;
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
        const draggedChartId = getDraggedLibraryChartIdFromEvent(event, draggedLibraryChartId);
        if (draggedChartId) addChartToSetlist(setlist.id, draggedChartId, index);
        else moveSetlistItem(setlist.id, draggedSetlistItem?.index ?? -1, index);
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
      childRow.append(childContent);
      childItem.append(childRow, removeButton);
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
  currentSetlists = await persistSetlists([...currentSetlists, createEmptyChartSetlist(name)]);
  isCreateSetlistVisible = false;
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
  const persistedLibrary = await loadPersistedChartLibrary();
  currentDocuments = persistedLibrary?.documents || [];
  currentSource = persistedLibrary?.source || 'imported library';
  currentSetlists = await loadPersistedSetlists();
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
  void loadManageState().catch((error) => {
    setImportStatus(`Failed to load chart library: ${getErrorMessage(error)}`, true);
  });
}
