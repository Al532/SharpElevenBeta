import type { ChartDocument } from '../../core/types/contracts';
import type { SharpElevenThemeApi } from '../app/app-theme.js';

import {
  type HomeChartSummary,
  loadPersistedChartLibrary,
  loadPersistedHomeChartSummary,
  loadRecentChartIds,
  saveHomeChartSummaryFromLibrary
} from '../chart/chart-persistence.js';

type HomePageDom = {
  recentChartsList: HTMLElement | null;
  recentChartsEmpty: HTMLElement | null;
  playlistsList: HTMLElement | null;
  playlistsEmpty: HTMLElement | null;
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
  pushIfDistinct(parts, source['playlistName']);

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

function renderPlaylists(
  documents: ChartDocument[],
  librarySource: string,
  dom: Pick<HomePageDom, 'playlistsList' | 'playlistsEmpty'>
): void {
  if (!dom.playlistsList) return;
  const playlistCounts = new Map<string, number>();
  for (const document of documents) {
    const playlistName = String(document.source?.playlistName || librarySource || '').trim();
    if (!playlistName) continue;
    playlistCounts.set(playlistName, (playlistCounts.get(playlistName) || 0) + 1);
  }

  const playlists = [...playlistCounts.entries()]
    .sort(([leftName], [rightName]) => leftName.localeCompare(rightName, 'en', { sensitivity: 'base' }));

  dom.playlistsList.replaceChildren();
  dom.playlistsEmpty?.classList.toggle('hidden', playlists.length > 0);

  for (const [playlistName, count] of playlists) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('playlist', playlistName);
    link.href = targetUrl.toString();
    link.className = 'home-list-link home-playlist-link';
    link.append(createTextElement('span', 'home-list-title', playlistName));
    link.append(createTextElement('span', 'home-list-meta', `(${count})`));
    item.append(link);
    dom.playlistsList.append(item);
  }
}

function renderPlaylistSummary(
  playlists: HomeChartSummary['playlists'],
  dom: Pick<HomePageDom, 'playlistsList' | 'playlistsEmpty'>
): void {
  if (!dom.playlistsList) return;

  dom.playlistsList.replaceChildren();
  dom.playlistsEmpty?.classList.toggle('hidden', playlists.length > 0);

  for (const playlist of playlists) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('playlist', playlist.name);
    link.href = targetUrl.toString();
    link.className = 'home-list-link home-playlist-link';
    link.append(createTextElement('span', 'home-list-title', playlist.name));
    link.append(createTextElement('span', 'home-list-meta', `(${playlist.count})`));
    item.append(link);
    dom.playlistsList.append(item);
  }
}

function renderHomeChartSummary(summary: HomeChartSummary, dom: HomePageDom): void {
  renderRecentChartSummary(summary.recentCharts, dom);
  renderPlaylistSummary(summary.playlists, dom);
}

export async function initializeHomePage(dom: HomePageDom): Promise<void> {
  const cachedSummary = loadPersistedHomeChartSummary();
  if (cachedSummary) {
    renderHomeChartSummary(cachedSummary, dom);
  }
  initializeThemeSelector(dom.themeButton, dom.themeMenu);

  const persistedLibrary = await loadPersistedChartLibrary();
  const documents = persistedLibrary?.documents || [];
  const librarySource = String(persistedLibrary?.source || '').trim();
  const documentsById = new Map(
    documents.map((document) => [String(document.metadata?.id || ''), document])
  );

  renderRecentCharts(documentsById, dom);
  renderPlaylists(documents, librarySource, dom);
  saveHomeChartSummaryFromLibrary(persistedLibrary);
}
