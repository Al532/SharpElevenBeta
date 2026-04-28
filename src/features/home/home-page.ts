import type { ChartDocument, ChartSetlist } from '../../core/types/contracts';
import type { HomeChartSummary } from '../chart/chart-persistence.js';
import type { SharpElevenThemeApi } from '../app/app-theme.js';

import { createChartDocumentsFromIRealText } from '../../../chart/index.js';
import {
  consumePendingIRealLinkResult,
  isIRealDeepLink,
  storePendingIRealLink
} from '../app/app-pending-mobile-import.js';
import { openIrealBrowser } from '../app/ireal-browser.js';
import {
  loadPersistedChartLibrary,
  loadPersistedSetlists,
  persistChartLibrary,
  persistSetlists,
  removePersistedChartReferences,
  loadRecentChartIds,
  loadPersistedRecentChartDocuments,
  loadPersistedHomeChartSummary,
  saveHomeChartSummaryFromLibrary
} from '../chart/chart-persistence.js';
import {
  applyBatchMetadataOperation,
  applyPerChartMetadataUpdate,
  filterChartDocuments,
  getChartSourceRefs,
  importDocumentsFromIRealText,
  normalizeChartTextKey
} from '../chart/chart-library.js';
import {
  bindChartImportControls,
  setChartImportStatus
} from '../chart/chart-import-controls.js';

type HomePageDom = {
  chartSearchInput: HTMLInputElement | null;
  chartSearchResults: HTMLElement | null;
  chartSearchEmpty: HTMLElement | null;
  importChartsButton: HTMLButtonElement | null;
  importChartsPopup: HTMLElement | null;
  importCloseButton: HTMLButtonElement | null;
  importIRealBackupButton: HTMLButtonElement | null;
  irealBackupRestoreSection: HTMLElement | null;
  irealBackupBackButton: HTMLButtonElement | null;
  irealBackupCloseButton: HTMLButtonElement | null;
  irealBackupFileButton: HTMLButtonElement | null;
  openIRealForumButton: HTMLButtonElement | null;
  irealBackupInput: HTMLInputElement | null;
  irealImportActions: HTMLElement | null;
  irealLinkInput: HTMLInputElement | null;
  importIRealLinkButton: HTMLButtonElement | null;
  irealLinkImportSection: HTMLElement | null;
  chartImportStatus: HTMLElement | null;
  themeButton: HTMLButtonElement | null;
  themeMenu: HTMLElement | null;
};

const IREAL_FORUM_TRACKS_URL = 'https://forums.irealpro.com';

let lastHomeViewportWidth = 0;
let maxHomeViewportHeightWithoutVirtualKeyboard = 0;

function isHomeTextEntryActive(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) return true;
  return activeElement instanceof HTMLElement && activeElement.isContentEditable;
}

function setStableHomeViewportHeight(height: number): void {
  if (!height) return;
  const stableHeight = `${height}px`;
  document.documentElement.style.setProperty('--home-stable-viewport-height', stableHeight);
  document.body?.style.setProperty('--home-stable-viewport-height', stableHeight);
}

function updateHomeViewportHeightReference(): number {
  const viewportWidth = Math.floor(Math.max(
    window.innerWidth || 0,
    document.documentElement.clientWidth || 0,
    window.visualViewport?.width || 0
  ));
  const viewportHeight = Math.floor(Math.max(
    window.innerHeight || 0,
    document.documentElement.clientHeight || 0,
    window.visualViewport?.height || 0
  ));
  const isTextEntryActive = isHomeTextEntryActive();
  const isNewWidth = viewportWidth && Math.abs(viewportWidth - lastHomeViewportWidth) > 1;

  if (isNewWidth) {
    lastHomeViewportWidth = viewportWidth;
    if (!isTextEntryActive || !maxHomeViewportHeightWithoutVirtualKeyboard) {
      maxHomeViewportHeightWithoutVirtualKeyboard = viewportHeight;
    }
  } else if (!isTextEntryActive) {
    maxHomeViewportHeightWithoutVirtualKeyboard = Math.max(
      maxHomeViewportHeightWithoutVirtualKeyboard,
      viewportHeight
    );
  }

  const stableViewportHeight = maxHomeViewportHeightWithoutVirtualKeyboard || viewportHeight;
  setStableHomeViewportHeight(stableViewportHeight);
  return stableViewportHeight;
}

function createTextElement(tagName: string, className: string, textContent: string): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = textContent;
  return element;
}

function isNativePlatform() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

function getChartSubtitle(document: ChartDocument): string {
  return typeof document.metadata.composer === 'string' ? document.metadata.composer.trim() : '';
}

function updateChartEntrySubtitleVisibility(link: HTMLElement): void {
  const title = link.querySelector<HTMLElement>('.home-list-title');
  const meta = link.querySelector<HTMLElement>('.home-list-meta');
  if (!title || !meta) return;
  meta.hidden = true;
  const gapWidth = Number.parseFloat(getComputedStyle(link).columnGap || '0') || 0;
  meta.hidden = title.scrollWidth + gapWidth > link.clientWidth;
}

type ThemeHost = Window & {
  SharpElevenTheme?: SharpElevenThemeApi;
};

type ChartEntryMenuTarget = {
  chartId: string;
  anchor: HTMLElement;
};

const THEME_LABELS = new Map<string, string>([
  ['classic-paper', 'Classic Paper'],
  ['blue-note', 'Blue Note'],
  ['dark-jazz', 'Dark Jazz']
]);

function getThemeLabel(paletteName: string): string {
  return THEME_LABELS.get(paletteName) ?? paletteName;
}

function initializeThemeSelector(
  themeButton: HomePageDom['themeButton'],
  themeMenu: HomePageDom['themeMenu']
): void {
  if (!themeButton || !themeMenu) return;
  const themeApi = (window as ThemeHost).SharpElevenTheme;
  if (!themeApi) {
    themeButton.disabled = true;
    return;
  }

  const availableThemes = themeApi.listPalettes();
  const setMenuOpen = (isOpen: boolean): void => {
    themeMenu.classList.toggle('hidden', !isOpen);
    themeButton.setAttribute('aria-expanded', String(isOpen));
  };

  const renderSelectedTheme = (): void => {
    themeButton.textContent = `Theme: ${getThemeLabel(themeApi.getPalette())}`;
  };

  themeMenu.replaceChildren();

  for (const paletteName of availableThemes) {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'home-theme-menu-item';
    option.setAttribute('role', 'menuitemradio');
    option.dataset.theme = paletteName;
    option.textContent = `Theme: ${getThemeLabel(paletteName)}`;
    option.addEventListener('click', () => {
      try {
        themeApi.setPalette(paletteName);
        renderSelectedTheme();
        setMenuOpen(false);
      } catch (error) {
        console.error('Failed to change theme.', error);
        renderSelectedTheme();
      }
    });
    themeMenu.append(option);
  }

  renderSelectedTheme();
  themeButton.disabled = false;

  themeButton.addEventListener('click', () => {
    setMenuOpen(themeMenu.classList.contains('hidden'));
  });

  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && (themeButton.contains(event.target) || themeMenu.contains(event.target))) {
      return;
    }
    setMenuOpen(false);
  });
}

function createChartLink(chartDocument: ChartDocument, className = 'home-list-link'): HTMLAnchorElement {
  const link = document.createElement('a');
  const targetUrl = new URL('./chart/index.html', window.location.href);
  targetUrl.searchParams.set('chart', chartDocument.metadata.id);
  targetUrl.searchParams.set('from', 'home');
  link.href = targetUrl.toString();
  link.className = className;
  link.style.textDecoration = 'none';
  link.style.display = 'flex';
  link.style.flexWrap = 'nowrap';
  link.style.columnGap = '0.28rem';
  link.style.rowGap = '0.12rem';
  link.style.alignItems = 'baseline';
  link.append(createTextElement('span', 'home-list-title', chartDocument.metadata.title || 'Untitled chart'));
  const subtitle = getChartSubtitle(chartDocument);
  if (subtitle) {
    link.append(createTextElement('span', 'home-list-meta', subtitle));
    requestAnimationFrame(() => updateChartEntrySubtitleVisibility(link));
  }
  return link;
}

function getAvailableChartListHeight(listElement: HTMLElement): number {
  const listTop = listElement.getBoundingClientRect().top;
  const footer = document.querySelector<HTMLElement>('.home-footer');
  const actions = document.querySelector<HTMLElement>('.home-actions');
  const viewportHeight = getViewportHeightWithoutVirtualKeyboard();
  const footerTop = footer?.getBoundingClientRect().top || viewportHeight;
  const actionsTop = actions?.getBoundingClientRect().top || viewportHeight;
  const visibleBottom = Math.min(actionsTop, footerTop, viewportHeight);
  return Math.max(0, visibleBottom - listTop - 4);
}

function getViewportHeightWithoutVirtualKeyboard(): number {
  return updateHomeViewportHeightReference();
}

function createChartRow(chartDocument: ChartDocument, onMenu: (target: ChartEntryMenuTarget) => void): HTMLLIElement {
  const item = document.createElement('li');
  const row = document.createElement('div');
  row.className = 'home-list-link home-chart-entry';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = 'minmax(0, 1fr)';
  row.style.alignItems = 'center';
  row.style.columnGap = '0.65rem';
  row.style.position = 'relative';
  row.style.paddingRight = '3.4rem';
  const link = createChartLink(chartDocument, 'home-chart-entry-link');
  const metadataButton = document.createElement('button');
  metadataButton.type = 'button';
  metadataButton.className = 'home-chart-entry-kebab';
  metadataButton.setAttribute('aria-label', `Open actions for ${chartDocument.metadata.title || 'chart'}`);
  metadataButton.setAttribute('aria-haspopup', 'menu');
  metadataButton.setAttribute('aria-expanded', 'false');
  metadataButton.addEventListener('pointerdown', (event) => event.stopPropagation());
  metadataButton.addEventListener('mousedown', (event) => event.stopPropagation());
  metadataButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onMenu({ chartId: chartDocument.metadata.id, anchor: metadataButton });
  });
  row.append(link, metadataButton);
  item.append(row);
  return item;
}

function createSummaryChartDocument(chart: HomeChartSummary['recentCharts'][number]): ChartDocument {
  return {
    schemaVersion: '1.0.0',
    metadata: {
      id: chart.id,
      title: chart.title
    },
    source: {},
    sections: [],
    bars: [],
    layout: null
  };
}

function createChartPreviewRow(chartDocument: ChartDocument): HTMLLIElement {
  const item = document.createElement('li');
  const row = document.createElement('div');
  row.className = 'home-list-link home-chart-entry';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = 'minmax(0, 1fr)';
  row.style.alignItems = 'center';
  row.style.position = 'relative';
  row.style.paddingRight = '3.4rem';
  const metadataButton = document.createElement('button');
  metadataButton.type = 'button';
  metadataButton.className = 'home-chart-entry-kebab';
  metadataButton.setAttribute('aria-label', `Open actions for ${chartDocument.metadata.title || 'chart'}`);
  metadataButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  row.append(createChartLink(chartDocument, 'home-chart-entry-link'), metadataButton);
  item.append(row);
  return item;
}

function renderHomeChartSummaryPreview(
  summary: HomeChartSummary | null,
  dom: Pick<HomePageDom, 'chartSearchInput' | 'chartSearchResults' | 'chartSearchEmpty'>
): void {
  if (!dom.chartSearchResults || dom.chartSearchInput?.value) return;
  const recentDocuments = loadPersistedRecentChartDocuments();
  const previewDocuments = recentDocuments.length
    ? recentDocuments
    : (summary?.recentCharts || []).map(createSummaryChartDocument);
  if (!previewDocuments.length) return;
  dom.chartSearchEmpty?.classList.add('hidden');
  dom.chartSearchResults.replaceChildren();
  const availableHeight = getAvailableChartListHeight(dom.chartSearchResults);
  const maxListBottom = dom.chartSearchResults.getBoundingClientRect().top + availableHeight;

  for (const chartDocument of previewDocuments) {
    dom.chartSearchResults.append(createChartPreviewRow(chartDocument));
    const last = dom.chartSearchResults.lastElementChild;
    if (!last) break;
    if (last.getBoundingClientRect().bottom > maxListBottom) {
      last.remove();
      break;
    }
  }
}

function renderChartSearch(
  documents: ChartDocument[],
  recentDocuments: ChartDocument[],
  onMenu: (target: ChartEntryMenuTarget) => void,
  dom: Pick<HomePageDom, 'chartSearchInput' | 'chartSearchResults' | 'chartSearchEmpty'>
): void {
  if (!dom.chartSearchResults) return;
  const query = normalizeChartTextKey(dom.chartSearchInput?.value || '');
  dom.chartSearchEmpty?.classList.add('hidden');
  const availableHeight = getAvailableChartListHeight(dom.chartSearchResults);
  const maxListBottom = dom.chartSearchResults.getBoundingClientRect().top + availableHeight;
  const matches = query
    ? filterChartDocuments(documents, query)
    : recentDocuments;

  dom.chartSearchResults.replaceChildren();
  for (const chartDocument of matches) {
    dom.chartSearchResults.append(createChartRow(chartDocument, onMenu));
    const last = dom.chartSearchResults.lastElementChild;
    if (!last) break;
    if (last.getBoundingClientRect().bottom > maxListBottom) {
      dom.chartSearchResults.lastElementChild?.remove();
      break;
    }
  }

  while (
    dom.chartSearchResults.lastElementChild
    && dom.chartSearchResults.lastElementChild.getBoundingClientRect().bottom > maxListBottom
  ) {
    dom.chartSearchResults.lastElementChild.remove();
  }

  const isEmpty = dom.chartSearchResults.children.length === 0;
  if (dom.chartSearchEmpty) {
    const emptyMessage = documents.length === 0
      ? 'Import charts, then search by title.'
      : query
        ? 'No matching charts.'
        : '';
    dom.chartSearchEmpty.textContent = emptyMessage;
    dom.chartSearchEmpty.classList.toggle('hidden', !isEmpty || !emptyMessage);
  }
}

export async function initializeHomePage(dom: HomePageDom): Promise<void> {
  initializeThemeSelector(dom.themeButton, dom.themeMenu);
  renderHomeChartSummaryPreview(loadPersistedHomeChartSummary(), dom);

  let persistedLibrary = await loadPersistedChartLibrary();
  let setlists = await loadPersistedSetlists();
  let documents = persistedLibrary?.documents || [];
  let activeImportRunId = 0;
  let isHomeImportRunning = false;
  let activeChartMenu: ChartEntryMenuTarget | null = null;
  let activeSetlistPopupChartId = '';
  let setlistPersistQueue = Promise.resolve();
  const chartEntryMenu = document.createElement('div');
  chartEntryMenu.className = 'home-chart-entry-menu';
  chartEntryMenu.hidden = true;
  chartEntryMenu.setAttribute('role', 'menu');
  chartEntryMenu.setAttribute('aria-label', 'Chart actions');
  const setlistPopup = document.createElement('div');
  setlistPopup.className = 'home-setlist-popup';
  setlistPopup.hidden = true;
  setlistPopup.setAttribute('role', 'dialog');
  setlistPopup.setAttribute('aria-modal', 'true');
  setlistPopup.setAttribute('aria-label', 'Add chart to setlist');
  document.body.append(chartEntryMenu, setlistPopup);

  const getRecentDocuments = (): ChartDocument[] => {
    const documentsById = new Map(
      documents.map((document) => [String(document.metadata?.id || ''), document])
    );
    return loadRecentChartIds()
      .map((chartId) => documentsById.get(chartId))
      .filter((document): document is ChartDocument => Boolean(document));
  };

  const updateChartSearchPlaceholder = (): void => {
    const chartCount = documents.length;
    const chartLabel = chartCount === 1 ? 'chart' : 'charts';
    dom.chartSearchInput?.setAttribute(
      'placeholder',
      chartCount > 0
        ? `Search ${chartCount} ${chartLabel}`
        : 'Search charts'
    );
  };

  const rerender = (): void => {
    updateChartSearchPlaceholder();
    renderChartSearch(documents, getRecentDocuments(), openChartEntryMenu, dom);
  };

  const handleViewportResize = (): void => {
    updateHomeViewportHeightReference();
    if (isHomeTextEntryActive()) return;
    rerender();
  };

  const persistMetadataState = async ({ documents: nextDocuments, setlists: nextSetlists }: { documents: ChartDocument[]; setlists: ChartSetlist[] }, _statusMessage: string): Promise<void> => {
    persistedLibrary = await persistChartLibrary({ documents: nextDocuments, source: persistedLibrary?.source || 'imported library', mergeWithExisting: false });
    documents = persistedLibrary?.documents || nextDocuments;
    setlists = await persistSetlists(nextSetlists);
    saveHomeChartSummaryFromLibrary(persistedLibrary);
    rerender();
  };

  const closeChartEntryMenu = (): void => {
    activeChartMenu?.anchor.setAttribute('aria-expanded', 'false');
    activeChartMenu = null;
    chartEntryMenu.hidden = true;
    chartEntryMenu.replaceChildren();
  };

  const closeSetlistPopup = (): void => {
    activeSetlistPopupChartId = '';
    setlistPopup.hidden = true;
    setlistPopup.replaceChildren();
  };

  const persistSetlistsInBackground = (nextSetlists: ChartSetlist[], statusMessage: string): void => {
    const snapshot = nextSetlists;
    setlistPersistQueue = setlistPersistQueue
      .catch(() => undefined)
      .then(async () => {
        const persistedSetlists = await persistSetlists(snapshot);
        if (setlists === snapshot) setlists = persistedSetlists;
        setImportStatus(statusMessage);
      })
      .catch((error) => {
        setImportStatus(`Failed to update setlists: ${error instanceof Error ? error.message : String(error || 'Unknown error')}`, true);
      });
  };

  const updateChartSetlistAssignment = (chartId: string, patch: Parameters<typeof applyPerChartMetadataUpdate>[0]['patch'], statusMessage: string): void => {
    const result = applyPerChartMetadataUpdate({
      documents,
      setlists,
      chartId,
      patch
    });
    setlists = result.setlists;
    if (activeSetlistPopupChartId === chartId && patch.createSetlistName) {
      renderSetlistPopup(chartId, 'input');
    }
    persistSetlistsInBackground(setlists, statusMessage);
  };

  const deleteChart = async (chartId: string): Promise<void> => {
    const chartDocument = documents.find((document) => document.metadata?.id === chartId);
    if (!chartDocument) return;
    const confirmed = window.confirm(`Delete "${chartDocument.metadata.title || 'chart'}"?\n\nThis will remove it from the library and all setlists. This action cannot be undone.`);
    if (!confirmed) return;
    const result = applyBatchMetadataOperation({
      documents,
      setlists,
      chartIds: [chartId],
      operation: { kind: 'delete' }
    });
    removePersistedChartReferences([chartId]);
    await persistMetadataState({ documents: result.documents, setlists: result.setlists }, 'Chart deleted.');
    closeSetlistPopup();
    closeChartEntryMenu();
  };

  const createMenuButton = (label: string, className = 'home-chart-entry-menu-item'): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('role', 'menuitem');
    button.textContent = label;
    return button;
  };

  const positionChartEntryMenu = (anchor: HTMLElement): void => {
    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = chartEntryMenu.getBoundingClientRect();
    const margin = 8;
    const left = Math.min(
      Math.max(margin, anchorRect.right - menuRect.width),
      Math.max(margin, window.innerWidth - menuRect.width - margin)
    );
    const top = Math.min(
      anchorRect.bottom + 4,
      Math.max(margin, window.innerHeight - menuRect.height - margin)
    );
    chartEntryMenu.style.left = `${left}px`;
    chartEntryMenu.style.top = `${top}px`;
  };

  function openChartEntryMenu(target: ChartEntryMenuTarget): void {
    const chartDocument = documents.find((document) => document.metadata?.id === target.chartId);
    if (!chartDocument) return;
    const isSameMenu = activeChartMenu?.chartId === target.chartId && !chartEntryMenu.hidden;
    closeSetlistPopup();
    closeChartEntryMenu();
    if (isSameMenu) return;

    activeChartMenu = target;
    target.anchor.setAttribute('aria-expanded', 'true');
    const addButton = createMenuButton('Add to setlist');
    addButton.addEventListener('click', () => {
      closeChartEntryMenu();
      openSetlistPopup(target.chartId);
    });
    const deleteButton = createMenuButton('Delete', 'home-chart-entry-menu-item is-danger');
    deleteButton.addEventListener('click', () => void deleteChart(target.chartId));
    chartEntryMenu.replaceChildren(addButton, deleteButton);
    chartEntryMenu.hidden = false;
    positionChartEntryMenu(target.anchor);
    requestAnimationFrame(() => addButton.focus());
  }

  function renderSetlistPopup(chartId: string, focusTarget: 'first' | 'input' | 'none' = 'none'): void {
    const chartDocument = documents.find((document) => document.metadata?.id === chartId);
    if (!chartDocument) return;

    const card = document.createElement('div');
    card.className = 'home-setlist-popup-card';
    const header = document.createElement('div');
    header.className = 'home-setlist-popup-header';
    header.append(createTextElement('strong', '', 'Add to setlist'));
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'home-metadata-close';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', closeSetlistPopup);
    header.append(closeButton);

    const title = createTextElement('p', 'home-setlist-popup-chart-title', chartDocument.metadata.title || 'Untitled chart');
    const list = document.createElement('div');
    list.className = 'home-setlist-popup-list';
    const memberships = new Set(
      setlists
        .filter((setlist) => setlist.items.some((item) => item.chartId === chartId))
        .map((setlist) => setlist.id)
    );
    if (setlists.length === 0) {
      list.append(createTextElement('p', 'home-empty', 'No setlists yet.'));
    } else {
      for (const setlist of setlists) {
        const isAssigned = memberships.has(setlist.id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'home-setlist-popup-option';
        button.classList.toggle('is-selected', isAssigned);
        button.setAttribute('aria-pressed', String(isAssigned));
        const setlistName = createTextElement('span', 'home-setlist-popup-option-label', setlist.name);
        const checkmark = createTextElement('span', 'home-setlist-popup-check', '\u2713');
        checkmark.setAttribute('aria-hidden', 'true');
        button.addEventListener('click', () => {
          const shouldAdd = button.getAttribute('aria-pressed') !== 'true';
          button.classList.toggle('is-selected', shouldAdd);
          button.setAttribute('aria-pressed', String(shouldAdd));
          updateChartSetlistAssignment(
            chartId,
            shouldAdd ? { addSetlistIds: [setlist.id] } : { removeSetlistIds: [setlist.id] },
            shouldAdd ? 'Added chart to setlist.' : 'Removed chart from setlist.'
          );
        });
        button.append(setlistName, checkmark);
        list.append(button);
      }
    }

    const createRow = document.createElement('div');
    createRow.className = 'home-setlist-popup-create-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'home-setlist-popup-input';
    input.placeholder = 'New setlist name';
    const createButton = document.createElement('button');
    createButton.type = 'button';
    createButton.className = 'home-primary-action';
    createButton.textContent = 'Create';
    const submitCreate = (): void => {
      const name = input.value.trim();
      if (!name || activeSetlistPopupChartId !== chartId) return;
      updateChartSetlistAssignment(chartId, { createSetlistName: name }, `Created "${name}".`);
    };
    createButton.addEventListener('click', submitCreate);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submitCreate();
      if (event.key === 'Escape') closeSetlistPopup();
    });
    createRow.append(input, createButton);
    card.append(header, title, list, createRow);
    setlistPopup.replaceChildren(card);
    setlistPopup.hidden = false;
    if (focusTarget === 'first') {
      requestAnimationFrame(() => {
        const firstSetlistButton = setlistPopup.querySelector<HTMLButtonElement>('.home-setlist-popup-option');
        (firstSetlistButton || input).focus();
      });
    } else if (focusTarget === 'input') {
      requestAnimationFrame(() => input.focus());
    }
  }

  function openSetlistPopup(chartId: string): void {
    activeSetlistPopupChartId = chartId;
    renderSetlistPopup(chartId, 'first');
  }

  const setImportStatus = (message: string, isError = false): void => {
    setChartImportStatus(dom.chartImportStatus, message, isError);
    rerender();
  };

  const clearStaleImportStatus = (): void => {
    const currentMessage = String(dom.chartImportStatus?.textContent || '');
    if (!/^(?:Importing|iReal link detected|iReal link captured)/i.test(currentMessage)) return;
    if (isHomeImportRunning) return;
    setImportStatus('');
  };

  const showImportMainView = (): void => {
    applyImportModeVisibility();
    if (dom.irealBackupRestoreSection) dom.irealBackupRestoreSection.hidden = true;
  };

  const showBackupRestoreView = (): void => {
    if (dom.irealImportActions) dom.irealImportActions.hidden = true;
    if (dom.irealLinkImportSection) dom.irealLinkImportSection.hidden = true;
    if (dom.irealBackupRestoreSection) dom.irealBackupRestoreSection.hidden = false;
  };

  const openImportPopup = (): void => {
    if (!dom.importChartsPopup) return;
    showImportMainView();
    dom.importChartsPopup.hidden = false;
    dom.importChartsButton?.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => dom.irealLinkInput?.focus());
  };

  const closeImportPopup = (): void => {
    if (!dom.importChartsPopup) return;
    dom.importChartsPopup.hidden = true;
    dom.importChartsButton?.setAttribute('aria-expanded', 'false');
    showImportMainView();
  };

  const applyImportModeVisibility = (): void => {
    const isNative = isNativePlatform();
    if (dom.irealImportActions) dom.irealImportActions.hidden = !isNative;
    if (dom.irealLinkImportSection) dom.irealLinkImportSection.hidden = isNative;
  };

  const cancelActiveImport = (): void => {
    if (!isHomeImportRunning) return;
    activeImportRunId += 1;
    isHomeImportRunning = false;
    setImportStatus('');
  };

  const importFromRawText = async (rawText: string, sourceFile: string): Promise<void> => {
    const trimmedText = String(rawText || '').trim();
    if (!trimmedText) {
      setImportStatus('Paste an irealb:// link first.', true);
      return;
    }
    const runId = activeImportRunId + 1;
    activeImportRunId = runId;
    isHomeImportRunning = true;
    closeImportPopup();
    setImportStatus(`Importing charts from ${sourceFile}. Please wait...`);
    try {
      const importedDocuments = await importDocumentsFromIRealText({
        rawText: trimmedText,
        sourceFile,
        importDocuments: ({ rawText: sourceText, sourceFile: importedSourceFile = '' }) =>
          createChartDocumentsFromIRealText({ rawText: sourceText, sourceFile: importedSourceFile })
      });
      if (runId !== activeImportRunId) return;
      if (!importedDocuments.length) {
        setImportStatus(`No charts imported from ${sourceFile}.`);
        return;
      }
      persistedLibrary = await persistChartLibrary({ documents: importedDocuments, source: sourceFile, mergeWithExisting: true });
      if (runId !== activeImportRunId) return;
      if (!persistedLibrary || persistedLibrary.documents.length === 0) throw new Error('The imported chart library could not be confirmed in persistent storage.');
      documents = persistedLibrary.documents;
      setlists = await loadPersistedSetlists();
      if (runId !== activeImportRunId) return;
      saveHomeChartSummaryFromLibrary(persistedLibrary);
      rerender();
      setImportStatus(`Imported ${importedDocuments.length} chart${importedDocuments.length === 1 ? '' : 's'} from ${sourceFile}.`);
    } catch (error) {
      if (runId === activeImportRunId) {
        setImportStatus(`Import failed: ${error instanceof Error ? error.message : String(error || 'Unknown error')}`, true);
      }
    } finally {
      if (runId === activeImportRunId) {
        isHomeImportRunning = false;
      }
    }
  };

  const handleBackupFileSelection = async (event: Event & { target: HTMLInputElement | null }): Promise<void> => {
    const file = event.target?.files?.[0];
    if (!file) return;
    try {
      await importFromRawText(await file.text(), file.name);
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  const handlePastedIRealLinkImport = async (): Promise<void> => {
    const rawText = dom.irealLinkInput?.value || '';
    if (dom.irealLinkInput) dom.irealLinkInput.value = '';
    await importFromRawText(rawText, 'pasted-ireal-link');
  };

  const importPendingMobileIRealLink = async (): Promise<void> => {
    const pendingResult = await consumePendingIRealLinkResult();
    const pendingIRealLink = pendingResult.url;
    if (!pendingIRealLink && pendingResult.hadPendingMarker) {
      setImportStatus(pendingResult.errorMessage ? `iReal link detected, but the captured text could not be loaded: ${pendingResult.errorMessage}` : 'iReal link detected, but the captured text could not be loaded. Open the forum charts and tap the link again.', true);
      openImportPopup();
      return;
    }
    if (!pendingIRealLink) return;
    setImportStatus('iReal link captured. Importing charts...');
    await importFromRawText(pendingIRealLink, 'pasted-ireal-link');
  };

  const bindIncomingMobileIRealImports = async (): Promise<void> => {
    if (!isNativePlatform()) return;
    let appPlugin = null;
    try {
      const capacitorAppModule = await import('@capacitor/app');
      appPlugin = capacitorAppModule?.App || null;
    } catch (_error) {
      appPlugin = window.Capacitor?.Plugins?.App || null;
    }
    if (!appPlugin?.addListener) return;
    const handleIncomingUrl = (url: string): void => {
      if (!isIRealDeepLink(url)) return;
      storePendingIRealLink(url);
      closeImportPopup();
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
  };

  applyImportModeVisibility();
  bindChartImportControls({
    irealBackupInput: dom.irealBackupInput,
    openIRealForumButton: dom.openIRealForumButton,
    forumTracksUrl: IREAL_FORUM_TRACKS_URL,
    setImportStatus,
    onBackupFileSelection: handleBackupFileSelection,
    onOpenForumTracks: async () => {
      closeImportPopup();
      setImportStatus('Opening iReal forum charts...');
      return openIrealBrowser({ url: IREAL_FORUM_TRACKS_URL, title: 'Click on a link to import' });
    }
  });
  dom.importIRealBackupButton?.addEventListener('click', showBackupRestoreView);
  dom.irealBackupBackButton?.addEventListener('click', showImportMainView);
  dom.irealBackupCloseButton?.addEventListener('click', closeImportPopup);
  dom.irealBackupFileButton?.addEventListener('click', () => dom.irealBackupInput?.click());
  dom.importIRealLinkButton?.addEventListener('click', () => void handlePastedIRealLinkImport());
  dom.irealLinkInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void handlePastedIRealLinkImport();
  });
  dom.importChartsButton?.addEventListener('click', openImportPopup);
  dom.importCloseButton?.addEventListener('click', closeImportPopup);
  dom.importChartsPopup?.addEventListener('click', (event) => {
    if (event.target === dom.importChartsPopup) closeImportPopup();
  });
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node)) return;
    if (chartEntryMenu.contains(event.target) || activeChartMenu?.anchor.contains(event.target)) return;
    closeChartEntryMenu();
  });
  if (new URLSearchParams(window.location.search).get('import') === 'charts') openImportPopup();
  void bindIncomingMobileIRealImports().then(() => importPendingMobileIRealLink());
  updateHomeViewportHeightReference();
  rerender();
  clearStaleImportStatus();

  dom.chartSearchInput?.addEventListener('input', rerender);
  window.addEventListener('resize', handleViewportResize);
  window.visualViewport?.addEventListener('resize', handleViewportResize);
  window.addEventListener('pagehide', cancelActiveImport);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSetlistPopup();
      closeChartEntryMenu();
      closeImportPopup();
    }
  });
  saveHomeChartSummaryFromLibrary(persistedLibrary);
}
