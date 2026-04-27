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
  loadRecentChartIds,
  loadPersistedRecentChartDocuments,
  loadPersistedHomeChartSummary,
  saveHomeChartSummaryFromLibrary
} from '../chart/chart-persistence.js';
import {
  filterChartDocuments,
  getChartSourceRefs,
  importDocumentsFromIRealText,
  normalizeChartTextKey
} from '../chart/chart-library.js';
import {
  bindChartImportControls,
  setChartImportStatus
} from '../chart/chart-import-controls.js';
import {
  closeChartMetadataPanel,
  openChartMetadataPanel
} from '../chart/chart-metadata-panel.js';

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
  const asText = (value: unknown): string => {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed;
  };

  const pushIfDistinct = (list: string[], value: unknown): void => {
    const normalized = asText(value);
    if (!normalized || list.includes(normalized)) return;
    list.push(normalized);
  };

  const parts: string[] = [];
  const metadata = document.metadata;

  pushIfDistinct(parts, metadata.composer);
  pushIfDistinct(parts, metadata.artist);
  pushIfDistinct(parts, metadata.author);
  pushIfDistinct(parts, metadata['leadArtist']);
  pushIfDistinct(parts, metadata['albumArtist']);

  pushIfDistinct(parts, metadata.styleReference);
  pushIfDistinct(parts, metadata.style);

  return parts.join(' - ');

}

type ThemeHost = Window & {
  SharpElevenTheme?: SharpElevenThemeApi;
};

const THEME_LABELS = new Map<string, string>([
  ['classic-paper', 'Classic Paper'],
  ['blue-note', 'Blue Note']
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
  link.href = targetUrl.toString();
  link.className = className;
  link.style.textDecoration = 'none';
  link.style.display = 'flex';
  link.style.flexWrap = 'wrap';
  link.style.columnGap = '0.28rem';
  link.style.rowGap = '0.12rem';
  link.style.alignItems = 'baseline';
  link.append(createTextElement('span', 'home-list-title', chartDocument.metadata.title || 'Untitled chart'));
  const subtitle = getChartSubtitle(chartDocument);
  if (subtitle) {
    link.append(createTextElement('span', 'home-list-meta', subtitle));
  }
  return link;
}

function getAvailableChartListHeight(listElement: HTMLElement): number {
  const listTop = listElement.getBoundingClientRect().top;
  const footer = document.querySelector<HTMLElement>('.home-footer');
  const viewportHeight = getViewportHeightWithoutVirtualKeyboard();
  const footerTop = footer?.getBoundingClientRect().top || viewportHeight;
  const visibleBottom = Math.min(footerTop, viewportHeight);
  return Math.max(0, visibleBottom - listTop - 12);
}

function getViewportHeightWithoutVirtualKeyboard(): number {
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
  if (viewportWidth && Math.abs(viewportWidth - lastHomeViewportWidth) > 1) {
    lastHomeViewportWidth = viewportWidth;
    maxHomeViewportHeightWithoutVirtualKeyboard = viewportHeight;
  } else {
    maxHomeViewportHeightWithoutVirtualKeyboard = Math.max(
      maxHomeViewportHeightWithoutVirtualKeyboard,
      viewportHeight
    );
  }
  return maxHomeViewportHeightWithoutVirtualKeyboard || viewportHeight;
}

function isHomePageOverflowing(): boolean {
  const viewportHeight = getViewportHeightWithoutVirtualKeyboard();
  const documentHeight = Math.ceil(Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight || 0
  ));
  return documentHeight > viewportHeight + 1;
}

function createChartRow(chartDocument: ChartDocument, onMetadata: (chartId: string) => void): HTMLLIElement {
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
  metadataButton.setAttribute('aria-label', `Open metadata for ${chartDocument.metadata.title || 'chart'}`);
  metadataButton.addEventListener('pointerdown', (event) => event.stopPropagation());
  metadataButton.addEventListener('mousedown', (event) => event.stopPropagation());
  metadataButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onMetadata(chartDocument.metadata.id);
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
  metadataButton.setAttribute('aria-label', `Open metadata for ${chartDocument.metadata.title || 'chart'}`);
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
    if (last.getBoundingClientRect().bottom > maxListBottom || isHomePageOverflowing()) {
      last.remove();
      break;
    }
  }
}

function renderChartSearch(
  documents: ChartDocument[],
  recentDocuments: ChartDocument[],
  onMetadata: (chartId: string) => void,
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
    dom.chartSearchResults.append(createChartRow(chartDocument, onMetadata));
    const last = dom.chartSearchResults.lastElementChild;
    if (!last) break;
    if (last.getBoundingClientRect().bottom > maxListBottom || isHomePageOverflowing()) {
      dom.chartSearchResults.lastElementChild?.remove();
      break;
    }
  }

  while (dom.chartSearchResults.lastElementChild && isHomePageOverflowing()) {
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
  const metadataPanel = document.createElement('div');
  metadataPanel.className = 'chart-metadata-panel';
  metadataPanel.hidden = true;
  document.body.append(metadataPanel);

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
        ? `Search ${chartCount} ${chartLabel} by title, composer, style, or tag`
        : 'Search by title, composer, style, or tag'
    );
  };

  const rerender = (): void => {
    updateChartSearchPlaceholder();
    renderChartSearch(documents, getRecentDocuments(), openMetadata, dom);
  };

  const persistMetadataState = async ({ documents: nextDocuments, setlists: nextSetlists }: { documents: ChartDocument[]; setlists: ChartSetlist[] }, _statusMessage: string): Promise<void> => {
    persistedLibrary = await persistChartLibrary({ documents: nextDocuments, source: persistedLibrary?.source || 'imported library', mergeWithExisting: false });
    documents = persistedLibrary?.documents || nextDocuments;
    setlists = await persistSetlists(nextSetlists);
    saveHomeChartSummaryFromLibrary(persistedLibrary);
    rerender();
  };

  function openMetadata(chartId: string): void {
    openChartMetadataPanel({
      host: metadataPanel,
      target: { kind: 'single', chartId },
      getState: () => ({ documents, setlists }),
      persistState: persistMetadataState
    });
  }

  const setImportStatus = (message: string, isError = false): void => {
    setChartImportStatus(dom.chartImportStatus, message, isError);
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
  if (new URLSearchParams(window.location.search).get('import') === 'charts') openImportPopup();
  void bindIncomingMobileIRealImports().then(() => importPendingMobileIRealLink());
  rerender();
  clearStaleImportStatus();

  dom.chartSearchInput?.addEventListener('input', rerender);
  window.addEventListener('resize', rerender);
  window.addEventListener('pagehide', cancelActiveImport);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeChartMetadataPanel(metadataPanel);
      closeImportPopup();
    }
  });
  saveHomeChartSummaryFromLibrary(persistedLibrary);
}
