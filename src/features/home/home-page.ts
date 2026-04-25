import type { ChartDocument } from '../../core/types/contracts';

import {
  loadPersistedChartLibrary,
  loadRecentChartIds
} from '../chart/chart-persistence.js';

type HomePageDom = {
  recentChartsList: HTMLElement | null;
  recentChartsEmpty: HTMLElement | null;
  playlistsList: HTMLElement | null;
  playlistsEmpty: HTMLElement | null;
};

function createTextElement(tagName: string, className: string, textContent: string): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = textContent;
  return element;
}

function getChartSubtitle(document: ChartDocument): string {
  const parts = [
    document.metadata?.composer,
    document.source?.playlistName,
    document.metadata?.styleReference || document.metadata?.style
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return parts.join(' - ');
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

    const subtitle = getChartSubtitle(chartDocument);
    if (subtitle) {
      link.append(createTextElement('span', 'home-list-meta', subtitle));
    }

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
}
