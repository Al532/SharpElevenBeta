import type {
  ChartDocument,
  ChartPlaybackController,
  ChartPlaybackPlan,
  ChartScreenState,
  ChartSelectionController,
  ChartSheetRenderer,
  ChartViewModel,
  PlaybackBridgeProvider,
  PlaybackOperationResult,
  PlaybackSettings,
  PracticeSessionSpec
} from '../core/types/contracts';

import {
  createChartDocumentsFromIRealText,
} from '../chart/index.js';
import {
  loadPersistedChartId as loadPersistedChartIdFromStorage,
  loadPersistedPlaybackSettings as loadPersistedChartPlaybackSettings,
  persistChartId as persistChartIdToStorage,
  persistPlaybackSettings as persistChartPlaybackSettings
} from '../features/chart/chart-persistence.js';
import {
  filterChartDocuments,
  importDocumentsFromIRealText as importChartDocumentsFromIRealText
} from '../features/chart/chart-library.js';
import {
  applyImportedLibrary as applyImportedChartLibrary,
  renderSelectedFixture
} from '../features/chart/chart-fixture-controller.js';
import {
  createChartNavigationController,
  updateChartNavigationState as updateChartNavigationStateUi
} from '../features/chart/chart-navigation.js';
import { createChartPlaybackRuntimeContextBindings } from '../features/chart/chart-playback-runtime-context-bindings.js';
import { createChartDirectPlaybackRuntimeHost } from '../features/chart/chart-direct-playback-runtime-host.js';
import { createChartPlaybackRuntimeContext } from '../features/chart/chart-playback-runtime-context.js';
import {
  applyPlaybackTransportState,
  startPlaybackPolling,
  stopPlaybackPolling
} from '../features/chart/chart-playback-runtime.js';
import {
  renderChartMeta,
  renderChartSelector as renderChartSelectorUi,
  renderChartTransport
} from '../features/chart/chart-renderer.js';
import { createAppShellBindings } from '../features/app/app-shell-bindings.js';
import { initializeAppShell } from '../features/app/app-shell.js';
import { createChartSheetRenderer } from '../features/chart/chart-sheet-renderer.js';
import {
  bindChartImportControls,
  handleChartBackupFileSelection,
  handlePastedChartIRealLinkImport,
  importDefaultFixtureLibrary as importChartDefaultFixtureLibrary,
  setChartImportStatus
} from '../features/chart/chart-import-controls.js';
import {
  createChartBarSelectionBindings,
  createChartDefaultLibraryBindings,
  createChartDirectPlaybackRuntimeHostBindings,
  createChartFixtureRenderBindings,
  createChartImportedLibraryBindings,
  createChartImportControlsBindings,
  createChartImportStatusBindings,
  createChartLayoutObserversBindings,
  createChartLibraryImportBindings,
  createChartMetaBindings,
  createChartMixerBindings,
  createChartNavigationBindings,
  createChartNavigationStateBindings,
  createChartOverlayControlsBindings,
  createChartOverlayShellBindings,
  createChartPopoverBindings,
  createChartRuntimeControlsAppBindings,
  createChartRuntimeControlsBindings,
  createChartScreenAppBindings,
  createChartScreenBindings,
  createChartSelectionRenderBindings,
  createChartSelectorBindings,
  createChartSheetRendererAppBindings,
  createChartSheetRendererBindings,
  createChartTransportBindings
} from '../features/chart/chart-app-bindings.js';
import {
  bindChartLayoutObservers,
  closeAllChartPopovers,
  closeChartOverlay,
  initializeChartScreen,
  openChartOverlay,
  toggleChartPopover
} from '../features/chart/chart-ui-shell.js';
import { bindChartRuntimeControls } from '../features/chart/chart-runtime-controls.js';
import { createContiguousBarSelectionController } from '../features/chart/chart-selection-controller.js';
import {
  getSelectedPracticeSession as getSelectedPracticeSessionFromState,
  handleChartBarSelection,
  renderChartSelectionUi,
  updateChartMixerOutputs
} from '../features/chart/chart-screen-state.js';
import { renderChordSymbolHtml } from '../core/music/chord-symbol-display.js';
import voicingConfig from '../core/music/voicing-config.js';

const DEFAULT_TEMPO = 120;
const DEFAULT_BAR_GROUP_SIZE = 4;
const PLAYBACK_STATE_POLL_INTERVAL_MS = 120;
const IREAL_SOURCE_URL = '../parsing-projects/ireal/sources/jazz-1460.txt';
const IREAL_DEFAULT_PLAYLISTS_URL = 'https://www.irealpro.com/main-playlists/';
const IREAL_FORUM_TRACKS_URL = 'https://forums.irealpro.com/#songs.3';
const LAST_CHART_STORAGE_KEY = 'jpt-chart-dev-last-chart-id';
const PLAYBACK_SETTINGS_STORAGE_KEY = 'jpt-chart-dev-playback-settings';
const HARMONY_DISPLAY_MODE_DEFAULT = 'default';
const HARMONY_DISPLAY_MODE_RICH = 'rich';
const CHART_PLAYBACK_BRIDGE_MODE = 'direct';

const {
  DEFAULT_DISPLAY_QUALITY_ALIASES = {},
  RICH_DISPLAY_QUALITY_ALIASES = {}
} = voicingConfig;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

const dom = {
  appModeBadge: document.getElementById('app-mode-badge'),
  appModeDrillLink: document.getElementById('app-mode-drill-link') as HTMLAnchorElement | null,
  appModeChartLink: document.getElementById('app-mode-chart-link') as HTMLAnchorElement | null,
  chartSearchInput: document.getElementById('chart-search-input') as HTMLInputElement | null,
  chartLibraryCount: document.getElementById('chart-library-count'),
  importIRealBackupButton: document.getElementById('import-ireal-backup-button') as HTMLButtonElement | null,
  openIRealDefaultPlaylistsButton: document.getElementById('open-ireal-default-playlists-button') as HTMLButtonElement | null,
  openIRealForumButton: document.getElementById('open-ireal-forum-button') as HTMLButtonElement | null,
  irealLinkInput: document.getElementById('ireal-link-input') as HTMLInputElement | null,
  importIRealLinkButton: document.getElementById('import-ireal-link-button') as HTMLButtonElement | null,
  chartImportStatus: document.getElementById('chart-import-status'),
  irealBackupInput: document.getElementById('ireal-backup-input') as HTMLInputElement | null,
  fixtureSelect: document.getElementById('fixture-select') as HTMLSelectElement | null,
  transposeSelect: document.getElementById('transpose-select') as HTMLSelectElement | null,
  harmonyDisplayMode: document.getElementById('harmony-display-mode') as HTMLSelectElement | null,
  useMajorTriangleSymbol: document.getElementById('use-major-triangle-symbol') as HTMLInputElement | null,
  useHalfDiminishedSymbol: document.getElementById('use-half-diminished-symbol') as HTMLInputElement | null,
  useDiminishedSymbol: document.getElementById('use-diminished-symbol') as HTMLInputElement | null,
  tempoInput: document.getElementById('tempo-input') as HTMLInputElement | null,
  sheetStyle: document.getElementById('sheet-style'),
  sheetTitle: document.getElementById('sheet-title'),
  sheetSubtitle: document.getElementById('sheet-subtitle'),
  sheetTimeSignature: document.getElementById('sheet-time-signature'),
  sheetKey: document.getElementById('sheet-key'),
  previousChartButton: document.getElementById('previous-chart-button') as HTMLButtonElement | null,
  nextChartButton: document.getElementById('next-chart-button') as HTMLButtonElement | null,
  sheetGrid: document.getElementById('sheet-grid'),
  chartMeta: document.getElementById('chart-meta'),
  diagnosticsList: document.getElementById('diagnostics-list'),
  transportStatus: document.getElementById('transport-status'),
  transportPosition: document.getElementById('transport-position'),
  playButton: document.getElementById('play-button') as HTMLButtonElement | null,
  stopButton: document.getElementById('stop-button') as HTMLButtonElement | null,
  compingStyleSelect: document.getElementById('comping-style-select') as HTMLSelectElement | null,
  drumsSelect: document.getElementById('drums-select') as HTMLSelectElement | null,
  walkingBassToggle: document.getElementById('walking-bass-toggle') as HTMLInputElement | null,
  masterVolume: document.getElementById('master-volume') as HTMLInputElement | null,
  masterVolumeValue: document.getElementById('master-volume-value'),
  bassVolume: document.getElementById('bass-volume') as HTMLInputElement | null,
  bassVolumeValue: document.getElementById('bass-volume-value'),
  stringsVolume: document.getElementById('strings-volume') as HTMLInputElement | null,
  stringsVolumeValue: document.getElementById('strings-volume-value'),
  drumsVolume: document.getElementById('drums-volume') as HTMLInputElement | null,
  drumsVolumeValue: document.getElementById('drums-volume-value'),
  playbackBridgeFrame: document.getElementById('drill-bridge-frame') as HTMLIFrameElement | null,
  selectionSummary: document.getElementById('selection-summary'),
  clearSelectionButton: document.getElementById('clear-selection-button') as HTMLButtonElement | null,
  sendSelectionToPracticeButton: document.getElementById('send-selection-to-drill-button') as HTMLButtonElement | null,
  mobileMenuToggle: document.getElementById('mobile-menu-toggle') as HTMLButtonElement | null,
  mobileBackdrop: document.getElementById('chart-mobile-backdrop'),
  manageChartsButton: document.getElementById('manage-charts-button') as HTMLButtonElement | null,
  manageChartsPopover: document.getElementById('manage-charts-popover'),
  settingsButton: document.getElementById('settings-button') as HTMLButtonElement | null,
  settingsPopover: document.getElementById('settings-popover'),
  chartTopOverlay: document.getElementById('chart-top-overlay'),
  chartBottomOverlay: document.getElementById('chart-bottom-overlay'),
  chartApp: document.querySelector('.chart-app')
};

initializeAppShell(createAppShellBindings({
  mode: 'chart',
  drillLink: dom.appModeDrillLink,
  chartLink: dom.appModeChartLink,
  modeBadge: dom.appModeBadge
}));

type ExtendedChartScreenState = ChartScreenState & {
  chartPlaybackBridgeProvider: PlaybackBridgeProvider | null,
  swipeGesture: {
    pointerId: number | null,
    startX: number,
    startY: number,
    active: boolean
  }
};

const state: ExtendedChartScreenState = {
  fixtureLibrary: null,
  filteredDocuments: [],
  currentChartDocument: null,
  currentViewModel: null,
  currentPlaybackPlan: null,
  currentPracticeSession: null,
  currentSelectionPracticeSession: null,
  currentLibrarySourceLabel: '',
  chartPlaybackBridgeProvider: null,
  activeBarId: null,
  activePlaybackEntryIndex: -1,
  chartPlaybackController: null,
  chartSheetRenderer: null,
  selectionController: createContiguousBarSelectionController() as ChartSelectionController,
  playbackPollTimer: null,
  isPlaying: false,
  isPaused: false,
  currentSearch: '',
  swipeGesture: {
    pointerId: null,
    startX: 0,
    startY: 0,
    active: false
  }
};

const chartDirectPlaybackRuntimeHost = createChartDirectPlaybackRuntimeHost(createChartDirectPlaybackRuntimeHostBindings({
  getExistingFrame: () => dom.playbackBridgeFrame,
  setFrame: (frame) => {
    dom.playbackBridgeFrame = frame;
  },
  getTempo,
  getCurrentChartTitle: () => state.currentChartDocument?.metadata?.title || 'Chart Dev'
}));

const playbackRuntimeContext = createChartPlaybackRuntimeContext(createChartPlaybackRuntimeContextBindings({
  state,
  mode: CHART_PLAYBACK_BRIDGE_MODE,
  directPlaybackRuntimeHost: chartDirectPlaybackRuntimeHost,
  getTempo,
  getCurrentChartTitle: () => state.currentChartDocument?.metadata?.title || 'Chart Dev',
  getSelectedPracticeSession,
  getPlaybackSettings,
  getCurrentBarCount: () => state.currentPlaybackPlan?.entries?.length || 0,
  setActivePlaybackPosition,
  resetActivePlaybackPosition,
  renderTransport,
  updateActiveHighlights,
  onTransportStatus: (message) => {
    if (dom.transportStatus) dom.transportStatus.textContent = message;
  },
  onPersistPlaybackSettings: persistPlaybackSettings
}));

function loadPersistedChartId() {
  return loadPersistedChartIdFromStorage({
    legacyStorageKey: LAST_CHART_STORAGE_KEY
  });
}

function persistChartId(chartId: string) {
  persistChartIdToStorage(chartId, {
    legacyStorageKey: LAST_CHART_STORAGE_KEY
  });
}

function loadPersistedPlaybackSettings() {
  return loadPersistedChartPlaybackSettings({
    legacyStorageKey: PLAYBACK_SETTINGS_STORAGE_KEY
  });
}

function persistPlaybackSettings() {
  persistChartPlaybackSettings({
    playbackSettings: getPlaybackSettings(),
    harmonyDisplayMode: normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value),
    useMajorTriangleSymbol: dom.useMajorTriangleSymbol?.checked !== false,
    useHalfDiminishedSymbol: dom.useHalfDiminishedSymbol?.checked !== false,
    useDiminishedSymbol: dom.useDiminishedSymbol?.checked !== false,
    legacyStorageKey: PLAYBACK_SETTINGS_STORAGE_KEY
  });
}

function applyPersistedPlaybackSettings() {
  const persisted = loadPersistedPlaybackSettings();
  if (!persisted) return;

  if (persisted.compingStyle && dom.compingStyleSelect && Array.from(dom.compingStyleSelect.options).some((option) => option.value === persisted.compingStyle)) {
    dom.compingStyleSelect.value = persisted.compingStyle;
  }

  if (persisted.drumsMode && dom.drumsSelect && Array.from(dom.drumsSelect.options).some((option) => option.value === persisted.drumsMode)) {
    dom.drumsSelect.value = persisted.drumsMode;
  }

  if (persisted.customMediumSwingBass !== undefined && dom.walkingBassToggle) {
    dom.walkingBassToggle.checked = Boolean(persisted.customMediumSwingBass);
  }

  if (dom.harmonyDisplayMode && persisted.harmonyDisplayMode) {
    dom.harmonyDisplayMode.value = normalizeHarmonyDisplayMode(persisted.harmonyDisplayMode);
  }

  if (dom.useMajorTriangleSymbol && persisted.useMajorTriangleSymbol !== undefined) {
    dom.useMajorTriangleSymbol.checked = Boolean(persisted.useMajorTriangleSymbol);
  }

  if (dom.useHalfDiminishedSymbol && persisted.useHalfDiminishedSymbol !== undefined) {
    dom.useHalfDiminishedSymbol.checked = Boolean(persisted.useHalfDiminishedSymbol);
  }

  if (dom.useDiminishedSymbol && persisted.useDiminishedSymbol !== undefined) {
    dom.useDiminishedSymbol.checked = Boolean(persisted.useDiminishedSymbol);
  }

  if (persisted.masterVolume !== undefined && dom.masterVolume) {
    dom.masterVolume.value = String(persisted.masterVolume);
  }
  if (persisted.bassVolume !== undefined && dom.bassVolume) {
    dom.bassVolume.value = String(persisted.bassVolume);
  }
  if (persisted.stringsVolume !== undefined && dom.stringsVolume) {
    dom.stringsVolume.value = String(persisted.stringsVolume);
  }
  if (persisted.drumsVolume !== undefined && dom.drumsVolume) {
    dom.drumsVolume.value = String(persisted.drumsVolume);
  }
}

function normalizeHarmonyDisplayMode(mode: string | undefined) {
  return [
    HARMONY_DISPLAY_MODE_DEFAULT,
    HARMONY_DISPLAY_MODE_RICH
  ].includes(String(mode))
    ? String(mode)
    : HARMONY_DISPLAY_MODE_DEFAULT;
}

function getDisplayAliasQuality(quality: string, displayMode: string) {
  if (!quality) return quality;
  if (displayMode === HARMONY_DISPLAY_MODE_RICH) {
    return RICH_DISPLAY_QUALITY_ALIASES[quality] || quality;
  }
  return DEFAULT_DISPLAY_QUALITY_ALIASES[quality] || quality;
}

function getAvailableDocuments(): ChartDocument[] {
  return state.filteredDocuments.length > 0
    ? state.filteredDocuments
    : (state.fixtureLibrary?.documents || []);
}

function updateChartNavigationState() {
  updateChartNavigationStateUi(createChartNavigationStateBindings({
    previousChartButton: dom.previousChartButton,
    nextChartButton: dom.nextChartButton,
    documents: getAvailableDocuments(),
    selectedId: dom.fixtureSelect?.value || state.currentChartDocument?.metadata?.id || ''
  }));
}

function bindChartNavigationControls() {
  createChartNavigationController(createChartNavigationBindings({
    getDocuments: getAvailableDocuments,
    getSelectedId: () => dom.fixtureSelect?.value || state.currentChartDocument?.metadata?.id || '',
    setSelectedId: (id) => {
      if (dom.fixtureSelect) {
        dom.fixtureSelect.value = id;
      }
    },
    renderFixture,
    previousChartButton: dom.previousChartButton,
    nextChartButton: dom.nextChartButton,
    sheetGrid: dom.sheetGrid
  })).bind();
}

function setImportStatus(message: string, isError = false) {
  const bindings = createChartImportStatusBindings({
    chartImportStatus: dom.chartImportStatus,
    message,
    isError
  });
  setChartImportStatus(bindings.chartImportStatus, bindings.message, bindings.isError);
}

async function importDocumentsFromIRealText(rawText: string, sourceFile = '') {
  return importChartDocumentsFromIRealText(createChartLibraryImportBindings({
    rawText,
    sourceFile,
    importDocuments: createChartDocumentsFromIRealText
  }));
}

function applyImportedLibrary({ documents, source, preferredId = null, statusMessage = '' }: {
  documents: ChartDocument[],
  source: string,
  preferredId?: string | null,
  statusMessage?: string
}) {
  applyImportedChartLibrary(createChartImportedLibraryBindings({
    state,
    chartSearchInput: dom.chartSearchInput,
    renderChartSelector,
    renderFixture,
    setImportStatus,
    documents,
    source,
    preferredId,
    statusMessage
  }));
}

function getPlaybackSettings(): PlaybackSettings {
  return {
    compingStyle: dom.compingStyleSelect?.value,
    drumsMode: dom.drumsSelect?.value,
    customMediumSwingBass: dom.walkingBassToggle?.checked,
    masterVolume: Number(dom.masterVolume?.value || 100),
    bassVolume: Number(dom.bassVolume?.value || 100),
    stringsVolume: Number(dom.stringsVolume?.value || 100),
    drumsVolume: Number(dom.drumsVolume?.value || 100)
  };
}

function getSelectedPracticeSession(): PracticeSessionSpec | null {
  return getSelectedPracticeSessionFromState(state);
}

function updateMixerOutputs() {
  updateChartMixerOutputs(createChartMixerBindings({
    masterVolume: dom.masterVolume,
    masterVolumeValue: dom.masterVolumeValue,
    bassVolume: dom.bassVolume,
    bassVolumeValue: dom.bassVolumeValue,
    stringsVolume: dom.stringsVolume,
    stringsVolumeValue: dom.stringsVolumeValue,
    drumsVolume: dom.drumsVolume,
    drumsVolumeValue: dom.drumsVolumeValue
  }));
}

function getTempo() {
  const parsed = Number(dom.tempoInput?.value || DEFAULT_TEMPO);
  return Number.isFinite(parsed) ? Math.max(40, Math.min(320, parsed)) : DEFAULT_TEMPO;
}

function getDisplayedBarGroupSize() {
  return DEFAULT_BAR_GROUP_SIZE;
}

function renderSheet(viewModel: ChartViewModel) {
  getChartSheetRenderer().renderSheet(viewModel);
}

function updateSheetGridGap() {
  getChartSheetRenderer().updateSheetGridGap();
}

function applyOpticalPlacements() {
  getChartSheetRenderer().applyOpticalPlacements();
}

function renderDiagnostics(playbackPlan: ChartPlaybackPlan | null) {
  getChartSheetRenderer().renderDiagnostics(playbackPlan);
}

function setActivePlaybackPosition(barId: string | null, entryIndex: number) {
  state.activeBarId = barId;
  state.activePlaybackEntryIndex = entryIndex;
  renderTransport();
  updateActiveHighlights();
}

function resetActivePlaybackPosition() {
  setActivePlaybackPosition(null, -1);
}

function updateActiveHighlights() {
  document.querySelectorAll('.chart-bar-cell').forEach((element) => {
    const htmlElement = element as HTMLElement;
    htmlElement.classList.toggle('is-active', htmlElement.dataset.barId === state.activeBarId);
  });

  document.querySelectorAll('.chart-playback-entry').forEach((element) => {
    const htmlElement = element as HTMLElement;
    htmlElement.classList.toggle('is-active', Number(htmlElement.dataset.entryIndex) === state.activePlaybackEntryIndex);
  });
}

function updateSelectionHighlights() {
  const selectedBarIds = new Set(state.selectionController.getSelection().barIds);
  document.querySelectorAll('.chart-bar-cell').forEach((element) => {
    const htmlElement = element as HTMLElement;
    htmlElement.classList.toggle('is-selected', selectedBarIds.has(htmlElement.dataset.barId || ''));
  });
}

function renderSelectionState() {
  renderChartSelectionUi(createChartSelectionRenderBindings({
    state,
    getTempo,
    selectionSummaryElement: dom.selectionSummary,
    clearSelectionButton: dom.clearSelectionButton,
    sendSelectionToPracticeButton: dom.sendSelectionToPracticeButton,
    updateSelectionHighlights
  }));
}

function syncPlaybackState() {
  const nextState = getChartPlaybackController().syncPlaybackState();
  applyPlaybackTransportState({
    state,
    nextState
  });
}

async function stopPlayback({ resetPosition = true } = {}) {
  stopPlaybackPolling({
    state
  });
  const nextState = await getChartPlaybackController().stopPlayback({ resetPosition });
  applyPlaybackTransportState({
    state,
    nextState
  });
}

async function startPlayback() {
  const nextState = await getChartPlaybackController().startPlayback();
  applyPlaybackTransportState({
    state,
    nextState: 'isPlaying' in nextState
      ? nextState
      : { isPlaying: false, isPaused: false }
  });
  startPlaybackPolling({
    state,
    intervalMs: PLAYBACK_STATE_POLL_INTERVAL_MS,
    onTick: syncPlaybackState
  });
  syncPlaybackState();
}

async function syncPlaybackSettings() {
  try {
    const result: PlaybackOperationResult = await getChartPlaybackController().syncPlaybackSettings();
    if (!result?.ok) {
      throw new Error(result?.errorMessage || 'Failed to sync playback settings.');
    }
    if (!state.isPlaying && dom.transportStatus) {
      dom.transportStatus.textContent = 'Ready';
    }
  } catch (error) {
    if (dom.transportStatus) {
      dom.transportStatus.textContent = `Playback settings error: ${getErrorMessage(error)}`;
    }
  }
}

function navigateToPracticeWithSelection() {
  getChartPlaybackController().navigateToPracticeWithSelection();
}

function getChartPlaybackBridgeProvider(): PlaybackBridgeProvider {
  return playbackRuntimeContext.getPlaybackBridgeProvider();
}

function getChartPlaybackController(): ChartPlaybackController {
  return playbackRuntimeContext.getPlaybackController();
}

function getChartSheetRenderer(): ChartSheetRenderer {
  if (state.chartSheetRenderer) return state.chartSheetRenderer;

  state.chartSheetRenderer = createChartSheetRenderer(createChartSheetRendererBindings(createChartSheetRendererAppBindings({
    sheetGrid: dom.sheetGrid,
    diagnosticsList: dom.diagnosticsList,
    getDisplayedBarGroupSize,
    getHarmonyDisplayMode: () => normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value),
    getFallbackTimeSignature: () => state.currentViewModel?.metadata?.primaryTimeSignature || '',
    renderChordMarkup,
    isBarActive: (bar) => bar?.id === state.activeBarId,
    isBarSelected: (bar) => state.selectionController.getSelection().barIds.includes(bar?.id)
  })));

  return state.chartSheetRenderer;
}

function renderMeta(viewModel: ChartViewModel) {
  const bindings = createChartMetaBindings({
    chartMeta: dom.chartMeta,
    viewModel
  });
  renderChartMeta(bindings.chartMeta, bindings.viewModel);
}

function renderChordMarkup(token: any, harmonyDisplayMode: string) {
  return renderChordSymbolHtml(
    token.root || '',
    getDisplayAliasQuality(token.quality || '', harmonyDisplayMode),
    token.bass || null,
    getChordSymbolRenderOptions()
  );
}

function getChordSymbolRenderOptions() {
  return {
    useMajorTriangleSymbol: dom.useMajorTriangleSymbol?.checked !== false,
    useHalfDiminishedSymbol: dom.useHalfDiminishedSymbol?.checked !== false,
    useDiminishedSymbol: dom.useDiminishedSymbol?.checked !== false
  };
}

function renderTransport() {
  renderChartTransport(createChartTransportBindings({
    transportStatusElement: dom.transportStatus,
    transportPositionElement: dom.transportPosition,
    playButton: dom.playButton,
    stopButton: dom.stopButton,
    totalBars: getSelectedPracticeSession()?.playback?.bars?.length || state.currentPlaybackPlan?.entries?.length || 0,
    activePlaybackEntryIndex: state.activePlaybackEntryIndex,
    isPlaying: state.isPlaying,
    isPaused: state.isPaused
  }));
}

function renderChartSelector(preferredId: string | null = null) {
  const documents = getAvailableDocuments();
  const previousId = preferredId || state.currentChartDocument?.metadata?.id || dom.fixtureSelect?.value || '';
  const selectedId = renderChartSelectorUi(createChartSelectorBindings({
    fixtureSelect: dom.fixtureSelect,
    chartLibraryCount: dom.chartLibraryCount,
    sheetStyle: dom.sheetStyle,
    sheetTitle: dom.sheetTitle,
    sheetSubtitle: dom.sheetSubtitle,
    sheetTimeSignature: dom.sheetTimeSignature,
    sheetKey: dom.sheetKey,
    sheetGrid: dom.sheetGrid,
    chartMeta: dom.chartMeta,
    diagnosticsList: dom.diagnosticsList,
    currentSearch: state.currentSearch,
    currentLibrarySourceLabel: state.currentLibrarySourceLabel,
    documents,
    totalDocumentCount: state.fixtureLibrary?.documents?.length || documents.length,
    previousId,
    onEmptyState: () => {
      state.currentChartDocument = null;
      state.currentViewModel = null;
      state.currentPlaybackPlan = null;
      state.currentPracticeSession = null;
      state.currentSelectionPracticeSession = null;
      resetActivePlaybackPosition();
      renderTransport();
      renderSelectionState();
    }
  }));
  if (selectedId && dom.fixtureSelect) {
    dom.fixtureSelect.value = selectedId;
  }
  updateChartNavigationState();
}

function applySearchFilter() {
  const query = String(dom.chartSearchInput?.value || '').trim().toLowerCase();
  state.currentSearch = query;
  const allDocuments = state.fixtureLibrary?.documents || [];
  state.filteredDocuments = filterChartDocuments(allDocuments, query);

  renderChartSelector();
  if (state.filteredDocuments.length > 0) {
    renderFixture();
  }
}

function renderFixture() {
  renderSelectedFixture(createChartFixtureRenderBindings({
    state,
    fixtureSelect: dom.fixtureSelect,
    transposeSelect: dom.transposeSelect,
    tempoInput: dom.tempoInput,
    getAvailableDocuments,
    stopPlayback,
    createPracticeSessionOptions: (playbackPlan) => ({
      playbackPlan,
      tempo: getTempo()
    }),
    persistChartId,
    selectionController: state.selectionController,
    sheetStyle: dom.sheetStyle,
    sheetTitle: dom.sheetTitle,
    sheetSubtitle: dom.sheetSubtitle,
    sheetTimeSignature: dom.sheetTimeSignature,
    sheetKey: dom.sheetKey,
    renderMeta,
    renderSheet,
    afterRenderSheet: () => {
      requestAnimationFrame(() => {
        updateSheetGridGap();
        applyOpticalPlacements();
      });
    },
    renderDiagnostics,
    renderTransport: () => {
      if (dom.transportStatus) dom.transportStatus.textContent = 'Ready';
      renderTransport();
    },
    renderSelectionState,
    updateChartNavigationState
  }));
}

function handleBarSelection(event: Event) {
  handleChartBarSelection(createChartBarSelectionBindings({
    event,
    selectionController: state.selectionController,
    renderSelectionState
  }));
}

function closeAllPopovers() {
  const bindings = createChartPopoverBindings({
    popovers: [dom.manageChartsPopover, dom.settingsPopover]
  });
  closeAllChartPopovers(bindings.popovers);
}

function togglePopover(targetPopover: HTMLElement | null, otherPopover: HTMLElement | null) {
  const bindings = createChartPopoverBindings({
    targetPopover,
    popovers: [targetPopover, otherPopover]
  });
  toggleChartPopover(bindings.targetPopover, bindings.popovers);
}

function openOverlay() {
  openChartOverlay(createChartOverlayShellBindings({
    chartApp: dom.chartApp,
    chartTopOverlay: dom.chartTopOverlay,
    chartBottomOverlay: dom.chartBottomOverlay
  }));
}

function closeOverlay() {
  closeChartOverlay(createChartOverlayShellBindings({
    chartApp: dom.chartApp,
    chartTopOverlay: dom.chartTopOverlay,
    chartBottomOverlay: dom.chartBottomOverlay,
    popovers: [dom.manageChartsPopover, dom.settingsPopover]
  }));
}

async function importDefaultFixtureLibrary() {
  return importChartDefaultFixtureLibrary(createChartDefaultLibraryBindings({
    sourceUrl: IREAL_SOURCE_URL,
    importDocumentsFromIRealText,
    applyImportedLibrary,
    loadPersistedChartId
  }));
}

async function handleBackupFileSelection(event: Event & { target: HTMLInputElement }) {
  return handleChartBackupFileSelection({
    event,
    importDocumentsFromIRealText,
    applyImportedLibrary,
    setImportStatus
  });
}

async function handlePastedIRealLinkImport() {
  return handlePastedChartIRealLinkImport({
    rawText: dom.irealLinkInput?.value || '',
    importDocumentsFromIRealText,
    applyImportedLibrary,
    setImportStatus
  });
}

function bindImportControls() {
  bindChartImportControls(createChartImportControlsBindings({
    importIRealBackupButton: dom.importIRealBackupButton,
    irealBackupInput: dom.irealBackupInput,
    openIRealDefaultPlaylistsButton: dom.openIRealDefaultPlaylistsButton,
    openIRealForumButton: dom.openIRealForumButton,
    importIRealLinkButton: dom.importIRealLinkButton,
    irealLinkInput: dom.irealLinkInput,
    defaultPlaylistsUrl: IREAL_DEFAULT_PLAYLISTS_URL,
    forumTracksUrl: IREAL_FORUM_TRACKS_URL,
    setImportStatus,
    onBackupFileSelection: handleBackupFileSelection,
    onPastedLinkImport: handlePastedIRealLinkImport
  }));
}

async function loadFixtures() {
  await initializeChartScreen(createChartScreenBindings(createChartScreenAppBindings({
    applyPersistedPlaybackSettings,
    bindImportControls,
    bindChartNavigationControls,
    importDefaultFixtureLibrary,
    bindRuntimeControls: () => {
      bindChartRuntimeControls(createChartRuntimeControlsBindings(createChartRuntimeControlsAppBindings({
        chartSearchInput: dom.chartSearchInput,
        fixtureSelect: dom.fixtureSelect,
        transposeSelect: dom.transposeSelect,
        sheetGrid: dom.sheetGrid,
        harmonyDisplayMode: dom.harmonyDisplayMode,
        useMajorTriangleSymbol: dom.useMajorTriangleSymbol,
        useHalfDiminishedSymbol: dom.useHalfDiminishedSymbol,
        useDiminishedSymbol: dom.useDiminishedSymbol,
        tempoInput: dom.tempoInput,
        compingStyleSelect: dom.compingStyleSelect,
        drumsSelect: dom.drumsSelect,
        walkingBassToggle: dom.walkingBassToggle,
        masterVolume: dom.masterVolume,
        bassVolume: dom.bassVolume,
        stringsVolume: dom.stringsVolume,
        drumsVolume: dom.drumsVolume,
        playButton: dom.playButton,
        stopButton: dom.stopButton,
        clearSelectionButton: dom.clearSelectionButton,
    sendSelectionToPracticeButton: dom.sendSelectionToPracticeButton,
        onSearch: applySearchFilter,
        onFixtureChange: renderFixture,
        onTransposeChange: renderFixture,
        onBarClick: handleBarSelection,
        onHarmonyDisplayModeChange: () => {
          persistPlaybackSettings();
          renderFixture();
        },
        onSymbolToggleChange: () => {
          persistPlaybackSettings();
          renderFixture();
        },
        onTempoChange: renderTransport,
        onPlaybackSettingChange: syncPlaybackSettings,
        onMixerInput: () => {
          updateMixerOutputs();
          syncPlaybackSettings();
        },
        onPlayClick: async () => {
          if (state.isPlaying) {
            const playbackController = getChartPlaybackController();
            if (playbackController) {
              await playbackController.pauseToggle();
              syncPlaybackState();
            }
            return;
          }
          try {
            await startPlayback();
            closeOverlay();
          } catch (error) {
            if (dom.transportStatus) dom.transportStatus.textContent = `Playback error: ${getErrorMessage(error)}`;
            state.isPlaying = false;
            renderTransport();
          }
        },
        onStopClick: () => {
          stopPlayback({ resetPosition: true });
        },
        onClearSelection: () => {
          state.selectionController.clear();
          renderSelectionState();
        },
    onSendSelectionToPractice: navigateToPracticeWithSelection,
        onBeforeUnload: () => {
          stopPlayback({ resetPosition: true });
        }
      })));
    },
    bindOverlayControls: () => {
      const bindings = createChartOverlayControlsBindings({
        mobileMenuToggle: dom.mobileMenuToggle,
        mobileBackdrop: dom.mobileBackdrop,
        manageChartsButton: dom.manageChartsButton,
        settingsButton: dom.settingsButton,
        onOpenOverlay: openOverlay,
        onCloseOverlay: closeOverlay,
        onManageChartsToggle: () => togglePopover(dom.manageChartsPopover as HTMLElement | null, dom.settingsPopover as HTMLElement | null),
        onSettingsToggle: () => togglePopover(dom.settingsPopover as HTMLElement | null, dom.manageChartsPopover as HTMLElement | null)
      });
      bindings.mobileMenuToggle?.addEventListener('click', bindings.onOpenOverlay);
      bindings.mobileBackdrop?.addEventListener('click', bindings.onCloseOverlay);
      bindings.manageChartsButton?.addEventListener('click', bindings.onManageChartsToggle);
      bindings.settingsButton?.addEventListener('click', bindings.onSettingsToggle);
    },
    bindLayoutObservers: () => {
      bindChartLayoutObservers(createChartLayoutObserversBindings({
        sheetGrid: dom.sheetGrid,
        updateSheetGridGap,
        applyOpticalPlacements
      }));
    },
    updateMixerOutputs,
    renderFixture,
    ensurePlaybackReady: async () => {
      getChartPlaybackController();
      await getChartPlaybackController().ensureReady();
    },
    syncPlaybackSettings,
    setTransportStatus: (message) => {
      if (dom.transportStatus) dom.transportStatus.textContent = message;
    }
  })));
}

loadFixtures().catch((error) => {
  if (dom.transportStatus) {
    dom.transportStatus.textContent = `Failed to load charts: ${getErrorMessage(error)}`;
  }
});
