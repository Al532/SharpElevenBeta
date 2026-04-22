import {
  createChartPlaybackPlanFromDocument,
  createChartViewModel,
  createPracticeSessionFromChartDocument
} from '../../chart/index.js';

export function applyImportedLibrary({
  state,
  chartSearchInput,
  renderChartSelector,
  renderFixture,
  setImportStatus,
  documents,
  source,
  preferredId = null,
  statusMessage = ''
} = {}) {
  state.fixtureLibrary = {
    source,
    documents
  };
  state.filteredDocuments = [...documents];
  state.currentLibrarySourceLabel = source;
  if (chartSearchInput) {
    chartSearchInput.value = '';
  }
  state.currentSearch = '';
  renderChartSelector?.(preferredId);
  renderFixture?.();
  setImportStatus?.(statusMessage || `Loaded ${documents.length} charts from ${source}.`);
}

export async function renderSelectedFixture({
  state,
  fixtureSelect,
  transposeSelect,
  tempoInput,
  getAvailableDocuments,
  stopPlayback,
  createPracticeSessionOptions,
  persistChartId,
  selectionController,
  sheetStyle,
  sheetTitle,
  sheetSubtitle,
  sheetTimeSignature,
  sheetKey,
  renderMeta,
  renderSheet,
  afterRenderSheet,
  renderDiagnostics,
  renderTransport,
  renderSelectionState,
  updateChartNavigationState
} = {}) {
  if (!state.fixtureLibrary) return;

  const availableDocuments = getAvailableDocuments?.() || [];
  const selectedId = fixtureSelect?.value || availableDocuments[0]?.metadata?.id;
  const chartDocument = availableDocuments.find((document) => document.metadata.id === selectedId);
  if (!chartDocument) return;

  await stopPlayback?.({ resetPosition: true });

  const transposeSemitones = Number(transposeSelect?.value || 0);
  const viewModel = createChartViewModel(chartDocument, {
    displayTransposeSemitones: transposeSemitones
  });
  const playbackPlan = createChartPlaybackPlanFromDocument(chartDocument);
  const practiceSession = createPracticeSessionFromChartDocument(chartDocument, createPracticeSessionOptions?.(playbackPlan) || {});

  state.currentChartDocument = chartDocument;
  state.currentViewModel = viewModel;
  state.currentPlaybackPlan = playbackPlan;
  state.currentPracticeSession = practiceSession;
  selectionController?.setOrderedBarIds((chartDocument?.bars || []).map((bar) => bar.id));
  selectionController?.clear();
  state.currentSelectionPracticeSession = null;
  persistChartId?.(chartDocument.metadata.id);

  if (sheetStyle) sheetStyle.textContent = viewModel.metadata.composer || '';
  if (sheetTitle) sheetTitle.textContent = viewModel.metadata.title || '';
  if (sheetSubtitle) sheetSubtitle.textContent = viewModel.metadata.styleReference || viewModel.metadata.style || '';
  if (sheetTimeSignature) sheetTimeSignature.textContent = viewModel.metadata.primaryTimeSignature || '';
  if (sheetKey) sheetKey.textContent = viewModel.metadata.displayKey || viewModel.metadata.sourceKey || '';
  if (tempoInput) {
    tempoInput.value = String(chartDocument.metadata.tempo || tempoInput.value || 120);
  }

  renderMeta?.(viewModel);
  renderSheet?.(viewModel);
  afterRenderSheet?.();
  renderDiagnostics?.(playbackPlan);
  renderTransport?.();
  renderSelectionState?.();
  updateChartNavigationState?.();
}
