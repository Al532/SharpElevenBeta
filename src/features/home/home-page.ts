import type { ChartDocument } from '../../core/types/contracts';
import type { SharpElevenThemeApi } from '../app/app-theme.js';

import {
  loadPersistedChartLibrary,
  loadRecentChartIds
} from '../chart/chart-persistence.js';

type HomePageDom = {
  recentChartsList: HTMLElement | null;
  recentChartsEmpty: HTMLElement | null;
  playlistsList: HTMLElement | null;
  playlistsEmpty: HTMLElement | null;
  themeSelect: HTMLSelectElement | null;
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
  const metadata = document.metadata || {};
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

function initializeThemeSelector(themeSelect: HomePageDom['themeSelect']): void {
  if (!themeSelect) return;

  const themeApi = (window as ThemeHost).SharpElevenTheme;
  if (!themeApi) {
    themeSelect.disabled = true;
    return;
  }

  const availableThemes = themeApi.listPalettes();
  themeSelect.replaceChildren();

  for (const paletteName of availableThemes) {
    const option = document.createElement('option');
    option.value = paletteName;
    option.textContent = paletteName;
    themeSelect.append(option);
  }

  themeSelect.value = themeApi.getPalette();
  themeSelect.disabled = false;

  themeSelect.addEventListener('change', () => {
    const selectedTheme = themeSelect.value;
    try {
      const appliedTheme = themeApi.setPalette(selectedTheme);
      themeSelect.value = appliedTheme;
    } catch (error) {
      console.error('Failed to change theme.', error);
      themeSelect.value = themeApi.getPalette();
    }
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

function renderPlaylists(
  documents: ChartDocument[],
  dom: Pick<HomePageDom, 'playlistsList' | 'playlistsEmpty'>
): void {
  if (!dom.playlistsList) return;
  const playlistCounts = new Map<string, number>();
  for (const document of documents) {
    const playlistName = String(document.source?.playlistName || '').trim();
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
    link.className = 'home-list-link';
    link.append(createTextElement('span', 'home-list-title', playlistName));
    link.append(createTextElement('span', 'home-list-meta', `${count} chart${count === 1 ? '' : 's'}`));
    item.append(link);
    dom.playlistsList.append(item);
  }
}

export async function initializeHomePage(dom: HomePageDom): Promise<void> {
  const persistedLibrary = await loadPersistedChartLibrary();
  const documents = persistedLibrary?.documents || [];
  const documentsById = new Map(
    documents.map((document) => [String(document.metadata?.id || ''), document])
  );

  renderRecentCharts(documentsById, dom);
  renderPlaylists(documents, dom);
  initializeThemeSelector(dom.themeSelect);
}
