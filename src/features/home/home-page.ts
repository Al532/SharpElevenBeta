import type { ChartDocument } from '../../core/types/contracts';
import type { SharpElevenThemeApi } from '../app/app-theme.js';

import {
  type HomeChartSummary,
  loadPersistedChartLibrary,
  loadPersistedHomeChartSummary,
  loadRecentChartIds,
  saveHomeChartSummaryFromLibrary
} from '../chart/chart-persistence.js';
import {
  filterChartDocuments,
  getChartSourceRefs,
  normalizeChartTextKey
} from '../chart/chart-library.js';

type HomePageDom = {
  recentChartsList: HTMLElement | null;
  recentChartsEmpty: HTMLElement | null;
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
  const source = document.source || {};

  pushIfDistinct(parts, metadata.composer);
  pushIfDistinct(parts, metadata.artist);
  pushIfDistinct(parts, metadata.author);
  pushIfDistinct(parts, metadata['leadArtist']);
  pushIfDistinct(parts, metadata['albumArtist']);
  pushIfDistinct(parts, source['artist']);
  pushIfDistinct(parts, source['composer']);
  pushIfDistinct(parts, source['author']);
  for (const ref of getChartSourceRefs(document)) {
    pushIfDistinct(parts, ref.name);
  }

  pushIfDistinct(parts, metadata.styleReference);
  pushIfDistinct(parts, metadata.style);
  pushIfDistinct(parts, source['style']);
  pushIfDistinct(parts, source['genre']);
  pushIfDistinct(parts, source['category']);

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

function renderRecentCharts(
  documentsById: Map<string, ChartDocument>,
  dom: Pick<HomePageDom, 'recentChartsList' | 'recentChartsEmpty'>
): void {
  if (!dom.recentChartsList) return;
  const recentDocuments = loadRecentChartIds()
    .map((chartId) => documentsById.get(chartId))
    .filter((document): document is ChartDocument => Boolean(document));

  dom.recentChartsList.replaceChildren();
  dom.recentChartsEmpty?.classList.toggle('hidden', recentDocuments.length > 0);

  for (const chartDocument of recentDocuments) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('chart', chartDocument.metadata.id);
    link.href = targetUrl.toString();
    link.className = 'home-list-link';
    link.append(
      createTextElement('span', 'home-list-title', chartDocument.metadata.title || 'Untitled chart')
    );

    item.append(link);
    dom.recentChartsList.append(item);
  }
}

function renderRecentChartSummary(
  recentCharts: HomeChartSummary['recentCharts'],
  dom: Pick<HomePageDom, 'recentChartsList' | 'recentChartsEmpty'>
): void {
  if (!dom.recentChartsList) return;

  dom.recentChartsList.replaceChildren();
  dom.recentChartsEmpty?.classList.toggle('hidden', recentCharts.length > 0);

  for (const chart of recentCharts) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('chart', chart.id);
    link.href = targetUrl.toString();
    link.className = 'home-list-link';
    link.append(createTextElement('span', 'home-list-title', chart.title || 'Untitled chart'));

    item.append(link);
    dom.recentChartsList.append(item);
  }
}

function createChartLink(chartDocument: ChartDocument, className = 'home-list-link'): HTMLAnchorElement {
  const link = document.createElement('a');
  const targetUrl = new URL('./chart/index.html', window.location.href);
  targetUrl.searchParams.set('chart', chartDocument.metadata.id);
  link.href = targetUrl.toString();
  link.className = className;
  link.append(createTextElement('span', 'home-list-title', chartDocument.metadata.title || 'Untitled chart'));
  const subtitle = getChartSubtitle(chartDocument);
  if (subtitle) {
    link.append(createTextElement('span', 'home-list-meta', subtitle));
  }
  return link;
}

function renderChartSearch(
  documents: ChartDocument[],
  dom: Pick<HomePageDom, 'chartSearchInput' | 'chartSearchResults' | 'chartSearchEmpty'>
): void {
  if (!dom.chartSearchResults) return;
  const query = normalizeChartTextKey(dom.chartSearchInput?.value || '');
  const matches = query
    ? filterChartDocuments(documents, query).slice(0, 12)
    : documents
        .slice()
        .sort((left, right) => String(left.metadata?.title || '').localeCompare(String(right.metadata?.title || ''), 'en', { sensitivity: 'base' }))
        .slice(0, 8);

  dom.chartSearchResults.replaceChildren();
  const isEmpty = matches.length === 0;
  dom.chartSearchEmpty?.classList.toggle('hidden', !isEmpty);
  if (dom.chartSearchEmpty) {
    dom.chartSearchEmpty.textContent = documents.length === 0
      ? 'Import charts, then search by title.'
      : query
        ? 'No matching charts.'
        : 'Type a title, composer, style, or tag.';
  }

  for (const chartDocument of matches) {
    const item = document.createElement('li');
    item.append(createChartLink(chartDocument));
    dom.chartSearchResults.append(item);
  }
}

function renderHomeChartSummary(summary: HomeChartSummary, dom: HomePageDom): void {
  renderRecentChartSummary(summary.recentCharts, dom);
}

export async function initializeHomePage(dom: HomePageDom): Promise<void> {
  const cachedSummary = loadPersistedHomeChartSummary();
  if (cachedSummary) {
    renderHomeChartSummary(cachedSummary, dom);
  }
  initializeThemeSelector(dom.themeButton, dom.themeMenu);

  const persistedLibrary = await loadPersistedChartLibrary();
  const documents = persistedLibrary?.documents || [];
  const documentsById = new Map(
    documents.map((document) => [String(document.metadata?.id || ''), document])
  );

  renderRecentCharts(documentsById, dom);
  renderChartSearch(documents, dom);
  dom.chartSearchInput?.addEventListener('input', () => renderChartSearch(documents, dom));
  saveHomeChartSummaryFromLibrary(persistedLibrary);
}
