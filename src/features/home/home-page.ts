import type { ChartDocument, ChartSetlist } from '../../core/types/contracts';
import type { SharpElevenThemeApi } from '../app/app-theme.js';

import {
  loadPersistedChartLibrary,
  loadPersistedSetlists,
  persistChartLibrary,
  persistSetlists,
  loadRecentChartIds,
  saveHomeChartSummaryFromLibrary
} from '../chart/chart-persistence.js';
import {
  filterChartDocuments,
  getChartSourceRefs,
  normalizeChartTextKey
} from '../chart/chart-library.js';
import {
  closeChartMetadataPanel,
  openChartMetadataPanel
} from '../chart/chart-metadata-panel.js';

type HomePageDom = {
  chartSearchInput: HTMLInputElement | null;
  chartSearchResults: HTMLElement | null;
  chartSearchEmpty: HTMLElement | null;
  themeButton: HTMLButtonElement | null;
  themeMenu: HTMLElement | null;
};

function createTextElement(tagName: string, className: string, textContent: string): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = textContent;
  return element;
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
  const footerTop = footer?.getBoundingClientRect().top || window.innerHeight;
  const visibleBottom = Math.min(footerTop, window.innerHeight);
  return Math.max(0, visibleBottom - listTop - 12);
}

function getViewportHeight(): number {
  return Math.floor(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight);
}

function isHomePageOverflowing(): boolean {
  const viewportHeight = getViewportHeight();
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
  metadataButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onMetadata(chartDocument.metadata.id);
  });
  metadataButton.style.textDecoration = 'none';
  metadataButton.style.display = 'inline-flex';
  metadataButton.style.flexDirection = 'column';
  metadataButton.style.gap = '0.18rem';
  metadataButton.style.alignItems = 'center';
  metadataButton.style.justifyContent = 'center';
  metadataButton.style.position = 'absolute';
  metadataButton.style.top = '50%';
  metadataButton.style.right = '0.35rem';
  metadataButton.style.transform = 'translateY(-50%)';
  metadataButton.style.width = '2.6rem';
  metadataButton.style.height = '2.6rem';
  metadataButton.style.zIndex = '2';
  metadataButton.style.color = 'currentColor';
  metadataButton.style.border = '0';
  metadataButton.style.background = 'transparent';
  metadataButton.style.boxShadow = 'none';
  metadataButton.style.padding = '0';
  metadataButton.style.margin = '0';
  metadataButton.style.appearance = 'none';
  metadataButton.style.webkitAppearance = 'none';
  metadataButton.append(
    createTextElement('span', 'home-chart-entry-dot', ''),
    createTextElement('span', 'home-chart-entry-dot', ''),
    createTextElement('span', 'home-chart-entry-dot', '')
  );
  metadataButton.querySelectorAll<HTMLElement>('.home-chart-entry-dot').forEach((dot) => {
    dot.style.display = 'block';
    dot.style.width = '0.28rem';
    dot.style.height = '0.28rem';
    dot.style.borderRadius = '999px';
    dot.style.background = 'currentColor';
    dot.style.opacity = '0.9';
  });
  row.append(link, metadataButton);
  item.append(row);
  return item;
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
  dom.chartSearchEmpty?.classList.toggle('hidden', !isEmpty);
  if (dom.chartSearchEmpty) {
    dom.chartSearchEmpty.textContent = documents.length === 0
      ? 'Import charts, then search by title.'
      : query
        ? 'No matching charts.'
        : 'No recent charts yet. Type a title, composer, style, or tag.';
  }
}

export async function initializeHomePage(dom: HomePageDom): Promise<void> {
  initializeThemeSelector(dom.themeButton, dom.themeMenu);

  let persistedLibrary = await loadPersistedChartLibrary();
  let setlists = await loadPersistedSetlists();
  let documents = persistedLibrary?.documents || [];
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

  const rerender = (): void => {
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

  rerender();
  dom.chartSearchInput?.addEventListener('input', rerender);
  window.addEventListener('resize', rerender);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeChartMetadataPanel(metadataPanel);
  });
  saveHomeChartSummaryFromLibrary(persistedLibrary);
}
