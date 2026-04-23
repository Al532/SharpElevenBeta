// @ts-check

/** @typedef {import('../../core/types/contracts').ChartDocument} ChartDocument */

/**
 * @param {HTMLElement | null | undefined} chartMetaElement
 * @param {{ metadata: Record<string, any>, bars: any[] }} viewModel
 * @returns {void}
 */
export function renderChartMeta(chartMetaElement, viewModel) {
  if (!chartMetaElement) return;
  const items = [
    ['Title', viewModel.metadata.title],
    ['Composer', viewModel.metadata.composer],
    ['Style', viewModel.metadata.styleReference || viewModel.metadata.style || '-'],
    ['Source key', viewModel.metadata.sourceKey],
    ['Display key', viewModel.metadata.displayKey],
    ['Time', viewModel.metadata.primaryTimeSignature || '-'],
    ['Bars', String(viewModel.metadata.barCount || viewModel.bars.length)]
  ];

  chartMetaElement.innerHTML = items
    .map(([term, value]) => `<dt>${term}</dt><dd>${value}</dd>`)
    .join('');
}

/**
 * @param {{
 *   transportStatusElement?: HTMLElement | null,
 *   transportPositionElement?: HTMLElement | null,
 *   playButton?: HTMLButtonElement | null,
 *   stopButton?: HTMLButtonElement | null,
 *   totalBars?: number,
 *   activePlaybackEntryIndex?: number,
 *   isPlaying?: boolean,
 *   isPaused?: boolean
 * }} [options]
 * @returns {void}
 */
export function renderChartTransport({
  transportStatusElement,
  transportPositionElement,
  playButton,
  stopButton,
  totalBars = 0,
  activePlaybackEntryIndex = -1,
  isPlaying = false,
  isPaused = false
} = {}) {
  const currentBar = activePlaybackEntryIndex >= 0 ? activePlaybackEntryIndex + 1 : 0;
  if (!isPlaying && transportStatusElement?.textContent === 'Playing') {
    transportStatusElement.textContent = 'Ready';
  }
  if (transportPositionElement) {
    transportPositionElement.textContent = `Bar ${currentBar} / ${totalBars}`;
  }
  if (stopButton) {
    stopButton.disabled = !isPlaying && activePlaybackEntryIndex < 0;
  }
  if (playButton) {
    if (isPlaying && isPaused) {
      playButton.textContent = 'Resume';
    } else if (isPlaying) {
      playButton.textContent = 'Pause';
    } else {
      playButton.textContent = 'Start';
    }
  }
}

/**
 * @param {{
 *   fixtureSelect?: HTMLSelectElement | null,
 *   chartLibraryCount?: HTMLElement | null,
 *   sheetStyle?: HTMLElement | null,
 *   sheetTitle?: HTMLElement | null,
 *   sheetSubtitle?: HTMLElement | null,
 *   sheetTimeSignature?: HTMLElement | null,
 *   sheetKey?: HTMLElement | null,
 *   sheetGrid?: HTMLElement | null,
 *   chartMeta?: HTMLElement | null,
 *   diagnosticsList?: HTMLElement | null,
 *   currentSearch?: string,
 *   currentLibrarySourceLabel?: string,
 *   documents?: ChartDocument[],
 *   totalDocumentCount?: number,
 *   previousId?: string,
 *   onEmptyState?: () => void
 * }} [options]
 * @returns {string | null}
 */
export function renderChartSelector({
  fixtureSelect,
  chartLibraryCount,
  sheetStyle,
  sheetTitle,
  sheetSubtitle,
  sheetTimeSignature,
  sheetKey,
  sheetGrid,
  chartMeta,
  diagnosticsList,
  currentSearch = '',
  currentLibrarySourceLabel = '',
  documents = [],
  totalDocumentCount = 0,
  previousId = '',
  onEmptyState
} = {}) {
  if (!fixtureSelect || !chartLibraryCount) return null;

  if (documents.length === 0) {
    fixtureSelect.innerHTML = '';
    fixtureSelect.disabled = true;
    chartLibraryCount.textContent = currentSearch
      ? 'No matching charts'
      : 'No charts loaded';
    if (sheetStyle) sheetStyle.textContent = '';
    if (sheetTitle) sheetTitle.textContent = 'No chart';
    if (sheetSubtitle) sheetSubtitle.textContent = '';
    if (sheetTimeSignature) sheetTimeSignature.textContent = '';
    if (sheetKey) sheetKey.textContent = '';
    if (sheetGrid) sheetGrid.innerHTML = '';
    if (chartMeta) chartMeta.innerHTML = '';
    if (diagnosticsList) diagnosticsList.innerHTML = '<li>No diagnostics.</li>';
    if (typeof onEmptyState === 'function') onEmptyState();
    return null;
  }

  fixtureSelect.disabled = false;
  fixtureSelect.innerHTML = documents
    .map((document) => {
      const composer = document.metadata.composer ? ` - ${document.metadata.composer}` : '';
      const playlist = document.source?.playlistName ? ` [${document.source.playlistName}]` : '';
      return `<option value="${document.metadata.id}">${document.metadata.title}${composer}${playlist}</option>`;
    })
    .join('');

  const selectedId = documents.some((document) => document.metadata.id === previousId)
    ? previousId
    : documents[0].metadata.id;
  fixtureSelect.value = selectedId;

  const resultLabel = `${documents.length} / ${totalDocumentCount || documents.length}`;
  const suffix = currentLibrarySourceLabel ? ` from ${currentLibrarySourceLabel}` : '';
  chartLibraryCount.textContent = currentSearch
    ? `${resultLabel} charts match${suffix}`
    : `${resultLabel} charts${suffix}`;

  return selectedId;
}

/**
 * @param {{
 *   selectionSummaryElement?: HTMLElement | null,
 *   clearSelectionButton?: HTMLButtonElement | null,
 *   sendSelectionToPracticeButton?: HTMLButtonElement | null,
 *   selectedBarIds?: string[],
 *   hasSession?: boolean,
 *   updateSelectionHighlights?: () => void
 * }} [options]
 * @returns {void}
 */
export function renderChartSelectionState({
  selectionSummaryElement,
  clearSelectionButton,
  sendSelectionToPracticeButton,
  selectedBarIds = [],
  hasSession = false,
  updateSelectionHighlights
} = {}) {
  const count = selectedBarIds.length;
  if (selectionSummaryElement) {
    selectionSummaryElement.textContent = count > 0
      ? `${count} bar${count > 1 ? 's' : ''} selected`
      : 'No selection';
  }
  if (clearSelectionButton) {
    clearSelectionButton.disabled = count === 0;
  }
  if (sendSelectionToPracticeButton) {
    sendSelectionToPracticeButton.disabled = !hasSession;
  }
  if (typeof updateSelectionHighlights === 'function') {
    updateSelectionHighlights();
  }
}
