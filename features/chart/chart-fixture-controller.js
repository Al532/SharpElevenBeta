// @ts-check

/** @typedef {import('../../core/types/contracts').ChartDocument} ChartDocument */
/** @typedef {import('../../core/types/contracts').ChartPlaybackPlan} ChartPlaybackPlan */
/** @typedef {import('../../core/types/contracts').ChartScreenState} ChartScreenState */
/** @typedef {import('../../core/types/contracts').ChartSelectionController} ChartSelectionController */
/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import {
  createChartPlaybackPlanFromDocument,
  createChartViewModel,
  createPracticeSessionFromChartDocument
} from '../../chart/index.js';

/**
 * @param {{
 *   state?: Pick<ChartScreenState, 'fixtureLibrary' | 'filteredDocuments' | 'currentLibrarySourceLabel' | 'currentSearch'>,
 *   chartSearchInput?: HTMLInputElement | null,
 *   renderChartSelector?: (preferredId?: string | null) => void,
 *   renderFixture?: () => void,
 *   setImportStatus?: (message: string) => void,
 *   documents?: ChartDocument[],
 *   source?: string,
 *   preferredId?: string | null,
 *   statusMessage?: string
 * }} [options]
 * @returns {void}
 */
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

/**
 * @param {{
 *   state?: Pick<ChartScreenState, 'fixtureLibrary' | 'currentChartDocument' | 'currentViewModel' | 'currentPlaybackPlan' | 'currentPracticeSession' | 'currentSelectionPracticeSession'>,
 *   fixtureSelect?: HTMLSelectElement | null,
 *   transposeSelect?: HTMLSelectElement | null,
 *   tempoInput?: HTMLInputElement | null,
 *   getAvailableDocuments?: () => ChartDocument[],
 *   stopPlayback?: (options?: { resetPosition?: boolean }) => Promise<unknown>,
 *   createPracticeSessionOptions?: (playbackPlan: ChartPlaybackPlan) => { playbackPlan?: ChartPlaybackPlan, tempo?: number },
 *   persistChartId?: (chartId: string) => void,
 *   selectionController?: ChartSelectionController,
 *   sheetStyle?: HTMLElement | null,
 *   sheetTitle?: HTMLElement | null,
 *   sheetSubtitle?: HTMLElement | null,
 *   sheetTimeSignature?: HTMLElement | null,
 *   sheetKey?: HTMLElement | null,
 *   renderMeta?: (viewModel: any) => void,
 *   renderSheet?: (viewModel: any) => void,
 *   afterRenderSheet?: () => void,
 *   renderDiagnostics?: (playbackPlan: ChartPlaybackPlan) => void,
 *   renderTransport?: () => void,
 *   renderSelectionState?: () => void,
 *   updateChartNavigationState?: () => void
 * }} [options]
 * @returns {Promise<void>}
 */
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
  const playbackPlan = /** @type {ChartPlaybackPlan} */ (createChartPlaybackPlanFromDocument(chartDocument));
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
