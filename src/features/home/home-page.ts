import type { ChartDocument, ChartSetlist } from '../../core/types/contracts';
import type { HomeChartSummary } from '../chart/chart-persistence.js';
import type { SharpElevenThemeApi } from '../app/app-theme.js';

import { createChartDocumentsFromIRealText } from '../../../chart/index.js';
import {
  consumePendingIRealLinkResult,
  isIRealDeepLink,
  storePendingIRealLink
} from '../app/app-pending-mobile-import.js';
import { openIrealBrowser, openIrealHtml } from '../app/ireal-browser.js';
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
  filterChartDocuments,
  type IRealImportContext,
  importDocumentsFromIRealText,
  normalizeChartTextKey
} from '../chart/chart-library.js';
import {
  createChartEntryActionsController,
  createChartEntryMenuButton,
  type ChartEntryMenuTarget
} from '../chart/chart-entry-actions.js';
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

type HomeGuidanceAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
};

type HomeGuidancePanelOptions = {
  icon: 'import' | 'loading' | 'search' | 'success' | 'error';
  title?: string;
  detail: string;
  className?: string;
  actions?: HomeGuidanceAction[];
};

type HomeImportFeedback = {
  kind: 'idle' | 'importing' | 'success' | 'error';
  title?: string;
  detail?: string;
};

function createHomeGuidanceIcon(iconName: HomeGuidancePanelOptions['icon']): HTMLSpanElement {
  const icon = document.createElement('span');
  icon.className = `home-empty-import-icon home-empty-import-icon-${iconName}`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  if (iconName === 'search') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '10.2');
    circle.setAttribute('cy', '10.2');
    circle.setAttribute('r', '5.7');
    const handle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    handle.setAttribute('d', 'M14.4 14.4 20 20');
    svg.append(circle, handle);
  } else if (iconName === 'loading') {
    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc.setAttribute('d', 'M12 4a8 8 0 1 1-7.1 4.3');
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tick.setAttribute('d', 'M12 7v5l3 2');
    svg.append(arc, tick);
  } else if (iconName === 'success') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '8');
    const check = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    check.setAttribute('d', 'm8.5 12.2 2.2 2.2 4.8-5');
    svg.append(circle, check);
  } else if (iconName === 'error') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '8');
    const mark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mark.setAttribute('d', 'M12 7.8v5.1');
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dot.setAttribute('d', 'M12 16.2h.01');
    svg.append(circle, mark, dot);
  } else {
    const arrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowLine.setAttribute('d', 'M12 3v14');
    const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowHead.setAttribute('d', 'm6.5 11.5 5.5 5.5 5.5-5.5');
    const targetLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    targetLine.setAttribute('d', 'M5 21h14');
    svg.append(arrowLine, arrowHead, targetLine);
  }

  icon.append(svg);
  return icon;
}

function createHomeGuidanceCopy(titleText: string | undefined, detailText: string): HTMLSpanElement {
  const copy = document.createElement('span');
  copy.className = 'home-empty-import-copy';
  if (titleText) {
    const title = document.createElement('strong');
    title.textContent = titleText;
    copy.append(title);
  } else {
    copy.classList.add('home-empty-import-copy-no-title');
  }
  const detail = document.createElement('span');
  detail.textContent = detailText;
  copy.append(detail);
  return copy;
}

function createHomeGuidanceActions(actions: HomeGuidanceAction[] = []): HTMLDivElement | null {
  if (!actions.length) return null;
  const actionsElement = document.createElement('div');
  actionsElement.className = 'home-empty-import-actions';

  for (const action of actions) {
    const actionElement = action.href
      ? document.createElement('a')
      : document.createElement('button');
    actionElement.className = action.primary
      ? 'home-empty-import-action home-empty-import-action-primary'
      : 'home-empty-import-action';
    actionElement.textContent = action.label;

    if (action.href && actionElement instanceof HTMLAnchorElement) {
      actionElement.href = action.href;
    }
    if (actionElement instanceof HTMLButtonElement) {
      actionElement.type = 'button';
    }
    if (action.onClick) {
      actionElement.addEventListener('click', action.onClick);
    }
    actionsElement.append(actionElement);
  }

  return actionsElement;
}

function createHomeGuidancePanel({
  icon,
  title,
  detail,
  className = '',
  actions = []
}: HomeGuidancePanelOptions): HTMLDivElement {
  const panel = document.createElement('div');
  panel.className = `home-empty-import-panel home-empty-import-static ${className}`.trim();
  panel.append(createHomeGuidanceIcon(icon), createHomeGuidanceCopy(title, detail));
  const actionsElement = createHomeGuidanceActions(actions);
  if (actionsElement) panel.append(actionsElement);
  return panel;
}

function createEmptyChartImportPrompt(onImportCharts: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'home-empty-import-panel home-empty-import-button';
  button.setAttribute('aria-label', 'No charts available. Click here to import charts from other formats.');
  button.append(
    createHomeGuidanceIcon('import'),
    createHomeGuidanceCopy('No charts available.', 'Click here to import charts from other formats.')
  );
  button.addEventListener('click', onImportCharts);
  return button;
}

function createLibraryBrowsePrompt(onSearchCharts: () => void): HTMLDivElement {
  return createHomeGuidancePanel({
    icon: 'search',
    detail: 'Use the dashboard search to open a chart quickly. Open Library if you want to browse the full catalog.',
    actions: [
      { label: 'Search charts', onClick: onSearchCharts, primary: true },
      { label: 'Open Library', href: './library.html' }
    ]
  });
}

function createImportingPrompt(title: string, detail: string): HTMLDivElement {
  return createHomeGuidancePanel({
    icon: 'loading',
    title,
    detail,
    className: 'home-empty-import-busy'
  });
}

function createImportSuccessPrompt(title: string, detail: string, onSearchCharts: () => void): HTMLDivElement {
  return createHomeGuidancePanel({
    icon: 'success',
    title,
    detail,
    className: 'home-empty-import-success',
    actions: [
      { label: 'Search charts', onClick: onSearchCharts, primary: true },
      { label: 'Open Library', href: './library.html' }
    ]
  });
}

function createImportErrorPrompt(title: string, detail: string, onImportCharts: () => void): HTMLDivElement {
  return createHomeGuidancePanel({
    icon: 'error',
    title,
    detail,
    className: 'home-empty-import-error',
    actions: [
      { label: 'Try again', onClick: onImportCharts, primary: true }
    ]
  });
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
  const metadataButton = createChartEntryMenuButton(chartDocument, onMenu);
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
  dom.chartSearchEmpty?.classList.remove('home-empty-import', 'hidden');
  if (dom.chartSearchEmpty) {
    dom.chartSearchEmpty.replaceChildren();
    dom.chartSearchEmpty.classList.add('hidden');
  }
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
  onImportCharts: () => void,
  onSearchCharts: () => void,
  importFeedback: HomeImportFeedback,
  dom: Pick<HomePageDom, 'chartSearchInput' | 'chartSearchResults' | 'chartSearchEmpty'>
): void {
  if (!dom.chartSearchResults) return;
  const query = normalizeChartTextKey(dom.chartSearchInput?.value || '');
  const matches = query
    ? filterChartDocuments(documents, query)
    : recentDocuments;

  dom.chartSearchResults.replaceChildren();
  if (dom.chartSearchEmpty) {
    dom.chartSearchEmpty.classList.remove('home-empty-import');
    if (importFeedback.kind === 'importing') {
      dom.chartSearchEmpty.replaceChildren(createImportingPrompt(
        importFeedback.title || 'Importing charts...',
        importFeedback.detail || 'This can take a few seconds. Keep this page open while Sharp Eleven finishes.'
      ));
      dom.chartSearchEmpty.classList.add('home-empty-import');
      dom.chartSearchEmpty.classList.remove('hidden');
      return;
    }
    if (importFeedback.kind === 'success') {
      dom.chartSearchEmpty.replaceChildren(createImportSuccessPrompt(
        importFeedback.title || 'Charts imported.',
        importFeedback.detail || 'Use the dashboard search to open one quickly. Open Library if you want to browse the full catalog.',
        onSearchCharts
      ));
      dom.chartSearchEmpty.classList.add('home-empty-import');
      dom.chartSearchEmpty.classList.remove('hidden');
      return;
    }
    if (importFeedback.kind === 'error') {
      dom.chartSearchEmpty.replaceChildren(createImportErrorPrompt(
        importFeedback.title || 'Import failed.',
        importFeedback.detail || 'Open Import charts to try again.',
        onImportCharts
      ));
      dom.chartSearchEmpty.classList.add('home-empty-import');
      dom.chartSearchEmpty.classList.remove('hidden');
      return;
    }
    if (documents.length === 0) {
      dom.chartSearchEmpty.replaceChildren(createEmptyChartImportPrompt(onImportCharts));
      dom.chartSearchEmpty.classList.add('home-empty-import');
      dom.chartSearchEmpty.classList.remove('hidden');
      return;
    }
    if (!query && matches.length === 0) {
      dom.chartSearchEmpty.replaceChildren(createLibraryBrowsePrompt(onSearchCharts));
      dom.chartSearchEmpty.classList.add('home-empty-import');
      dom.chartSearchEmpty.classList.remove('hidden');
      return;
    }
    if (query && matches.length === 0) {
      dom.chartSearchEmpty.replaceChildren('No matching charts.');
      dom.chartSearchEmpty.classList.remove('hidden');
      return;
    }
    dom.chartSearchEmpty.replaceChildren();
    dom.chartSearchEmpty.classList.add('hidden');
  }

  const availableHeight = getAvailableChartListHeight(dom.chartSearchResults);
  const maxListBottom = dom.chartSearchResults.getBoundingClientRect().top + availableHeight;
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
}

export async function initializeHomePage(dom: HomePageDom): Promise<void> {
  initializeThemeSelector(dom.themeButton, dom.themeMenu);
  renderHomeChartSummaryPreview(loadPersistedHomeChartSummary(), dom);

  let persistedLibrary = await loadPersistedChartLibrary();
  let setlists = await loadPersistedSetlists();
  let documents = persistedLibrary?.documents || [];
  let activeImportRunId = 0;
  let isHomeImportRunning = false;
  let importFeedback: HomeImportFeedback = { kind: 'idle' };
  let setlistPersistQueue = Promise.resolve();

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

  const focusChartSearch = (): void => {
    if (importFeedback.kind === 'success' || importFeedback.kind === 'error') {
      importFeedback = { kind: 'idle' };
      rerender();
    }
    requestAnimationFrame(() => dom.chartSearchInput?.focus());
  };

  const rerender = (): void => {
    updateChartSearchPlaceholder();
    renderChartSearch(documents, getRecentDocuments(), openChartEntryMenu, openImportPopup, focusChartSearch, importFeedback, dom);
  };

  let pendingFeedbackLayoutFrame = 0;
  const scheduleFeedbackLayoutRerender = (): void => {
    if (pendingFeedbackLayoutFrame) return;
    pendingFeedbackLayoutFrame = window.requestAnimationFrame(() => {
      pendingFeedbackLayoutFrame = 0;
      if (isHomeTextEntryActive()) return;
      rerender();
    });
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

  const chartEntryActions = createChartEntryActionsController({
    getState: () => ({ documents, setlists }),
    persistState: persistMetadataState,
    persistSetlists: (nextSetlists, statusMessage) => {
      setlists = nextSetlists;
      rerender();
      persistSetlistsInBackground(nextSetlists, statusMessage);
    },
    removeChartReferences: removePersistedChartReferences
  });
  const openChartEntryMenu = chartEntryActions.openMenu;

  const setImportStatus = (message: string, isError = false): void => {
    if (isError && message && importFeedback.kind !== 'error') {
      importFeedback = {
        kind: 'error',
        title: 'Import needs attention.',
        detail: message
      };
    }
    setChartImportStatus(dom.chartImportStatus, '', false);
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
    if (dom.importCloseButton) dom.importCloseButton.hidden = false;
  };

  const showBackupRestoreView = (): void => {
    if (dom.irealImportActions) dom.irealImportActions.hidden = true;
    if (dom.irealLinkImportSection) dom.irealLinkImportSection.hidden = true;
    if (dom.irealBackupRestoreSection) dom.irealBackupRestoreSection.hidden = false;
    if (dom.importCloseButton) dom.importCloseButton.hidden = true;
    requestAnimationFrame(() => dom.irealBackupCloseButton?.focus());
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
    importFeedback = { kind: 'idle' };
    setImportStatus('');
  };

  const importFromRawText = async (rawText: string, sourceFile: string, importContext?: IRealImportContext): Promise<void> => {
    const trimmedText = String(rawText || '').trim();
    if (!trimmedText) {
      setImportStatus('Paste an irealb:// link first.', true);
      return;
    }
    const runId = activeImportRunId + 1;
    activeImportRunId = runId;
    isHomeImportRunning = true;
    closeImportPopup();
    importFeedback = {
      kind: 'importing',
      title: 'Importing charts...',
      detail: `Reading ${sourceFile}. This can take a few seconds, so keep this page open.`
    };
    setImportStatus('');
    try {
      const importedDocuments = await importDocumentsFromIRealText({
        rawText: trimmedText,
        sourceFile,
        importContext,
        importDocuments: ({ rawText: sourceText, sourceFile: importedSourceFile = '' }) =>
          createChartDocumentsFromIRealText({ rawText: sourceText, sourceFile: importedSourceFile })
      });
      if (runId !== activeImportRunId) return;
      if (!importedDocuments.length) {
        importFeedback = {
          kind: 'error',
          title: 'No charts imported.',
          detail: `Sharp Eleven did not find any usable chart in ${sourceFile}.`
        };
        setImportStatus('');
        return;
      }
      persistedLibrary = await persistChartLibrary({ documents: importedDocuments, source: sourceFile, mergeWithExisting: true });
      if (runId !== activeImportRunId) return;
      if (!persistedLibrary || persistedLibrary.documents.length === 0) throw new Error('The imported chart library could not be confirmed in persistent storage.');
      documents = persistedLibrary.documents;
      setlists = await loadPersistedSetlists();
      if (runId !== activeImportRunId) return;
      saveHomeChartSummaryFromLibrary(persistedLibrary);
      const hasVisibleRecentCharts = getRecentDocuments().length > 0;
      importFeedback = hasVisibleRecentCharts
        ? { kind: 'idle' }
        : {
            kind: 'success',
            title: `Imported ${importedDocuments.length} chart${importedDocuments.length === 1 ? '' : 's'}.`,
            detail: 'Use the dashboard search to open one quickly. Open Library if you want to browse the full catalog.'
          };
      setImportStatus('');
    } catch (error) {
      if (runId === activeImportRunId) {
        const message = error instanceof Error ? error.message : String(error || 'Unknown error');
        importFeedback = {
          kind: 'error',
          title: 'Import failed.',
          detail: message
        };
        setImportStatus(`Import failed: ${message}`, true);
      }
    } finally {
      if (runId === activeImportRunId) {
        isHomeImportRunning = false;
      }
    }
  };

  const handlePastedIRealLinkImport = async (): Promise<void> => {
    const rawText = dom.irealLinkInput?.value || '';
    if (dom.irealLinkInput) dom.irealLinkInput.value = '';
    await importFromRawText(rawText, 'pasted-ireal-link', { origin: 'pasted-link' });
  };

  const handleBackupFileSelection = async (event: Event & { target: HTMLInputElement | null }): Promise<void> => {
    const file = event.target?.files?.[0];
    if (!file) return;
    try {
      closeImportPopup();
      importFeedback = {
        kind: 'importing',
        title: 'Opening backup...',
        detail: `Reading ${file.name}. Keep this page open.`
      };
      setImportStatus('');
      await openIrealHtml({
        html: await file.text(),
        title: file.name,
        baseUrl: `https://localhost/shared-import/${encodeURIComponent(file.name)}`
      });
      importFeedback = {
        kind: 'idle'
      };
      setImportStatus('Backup opened. Tap an iReal link in the backup to import it.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || 'Unknown error');
      importFeedback = {
        kind: 'error',
        title: 'Could not open backup.',
        detail: message
      };
      setImportStatus(`Could not open backup: ${error instanceof Error ? error.message : String(error || 'Unknown error')}`, true);
    } finally {
      if (event.target) event.target.value = '';
    }
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
    await importFromRawText(pendingIRealLink, 'pasted-ireal-link', {
      origin: pendingResult.importOrigin || (pendingResult.hadPendingMarker ? 'unknown' : undefined),
      referrerUrl: pendingResult.referrerUrl
    });
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
      importFeedback = {
        kind: 'importing',
        title: 'Preparing iReal link...',
        detail: 'Loading the captured text. Keep this page open.'
      };
      setImportStatus('');
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
  if (new URLSearchParams(window.location.search).get('import') === 'charts') openImportPopup();
  void bindIncomingMobileIRealImports().then(() => importPendingMobileIRealLink());
  updateHomeViewportHeightReference();
  rerender();
  clearStaleImportStatus();

  if (dom.chartSearchEmpty && typeof ResizeObserver !== 'undefined') {
    const feedbackLayoutObserver = new ResizeObserver(scheduleFeedbackLayoutRerender);
    feedbackLayoutObserver.observe(dom.chartSearchEmpty);
    window.addEventListener('pagehide', () => {
      feedbackLayoutObserver.disconnect();
      if (pendingFeedbackLayoutFrame) {
        window.cancelAnimationFrame(pendingFeedbackLayoutFrame);
        pendingFeedbackLayoutFrame = 0;
      }
    }, { once: true });
  }
  window.addEventListener('load', rerender, { once: true });
  document.fonts?.ready.then(rerender).catch(() => undefined);
  dom.chartSearchInput?.addEventListener('input', () => {
    if (importFeedback.kind === 'success' || importFeedback.kind === 'error') {
      importFeedback = { kind: 'idle' };
    }
    rerender();
  });
  window.addEventListener('resize', handleViewportResize);
  window.visualViewport?.addEventListener('resize', handleViewportResize);
  window.addEventListener('pagehide', cancelActiveImport);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      chartEntryActions.closeAll();
      closeImportPopup();
    }
  });
  saveHomeChartSummaryFromLibrary(persistedLibrary);
}
