// @ts-check

/** @typedef {import('../core/types/contracts').ChartDocument} ChartDocument */
/** @typedef {import('../core/types/contracts').ChartPlaybackPlan} ChartPlaybackPlan */
/** @typedef {import('../core/types/contracts').ChartPlaybackController} ChartPlaybackController */
/** @typedef {import('../core/types/contracts').ChartSheetRenderer} ChartSheetRenderer */
/** @typedef {import('../core/types/contracts').ChartScreenState} ChartScreenState */
/** @typedef {import('../core/types/contracts').ChartSelectionController} ChartSelectionController */
/** @typedef {import('../core/types/contracts').ChartViewModel} ChartViewModel */
/** @typedef {import('../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../core/types/contracts').PlaybackBridgeProvider} PlaybackBridgeProvider */
/** @typedef {import('../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import {
  createChartDocumentsFromIRealText,
} from '../chart/index.js';
import {
  clearPersistedChartLibrary,
  loadPersistedChartLibrary,
  loadPersistedChartId as loadPersistedChartIdFromStorage,
  loadPersistedPlaybackSettings as loadPersistedChartPlaybackSettings,
  persistChartId as persistChartIdToStorage,
  persistChartLibrary,
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
import { bindChartLifecycleEvents } from '../features/chart/chart-lifecycle.js';
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
import { openIrealBrowser } from '../features/app/ireal-browser.js';
import { consumePendingIRealLink, isIRealDeepLink, storePendingIRealLink } from '../features/app/app-pending-mobile-import.js';
import { createChartSheetRenderer } from '../features/chart/chart-sheet-renderer.js';
import {
  bindChartImportControls,
  handleChartBackupFileSelection,
  handlePastedChartIRealLinkImport,
  setChartImportStatus
} from '../features/chart/chart-import-controls.js';
import {
  createChartBarSelectionBindings,
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
import { createMobileBackNavigationController } from '../features/app/app-mobile-back-navigation.js';
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

/**
 * @param {unknown} error
 * @returns {string}
 */
function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

/** @type {any} */
const dom = {
  appModeBadge: document.getElementById('app-mode-badge'),
  appModeDrillLink: document.getElementById('app-mode-drill-link'),
  appModeChartLink: document.getElementById('app-mode-chart-link'),
  chartSearchInput: document.getElementById('chart-search-input'),
  chartLibraryCount: document.getElementById('chart-library-count'),
  importIRealBackupButton: document.getElementById('import-ireal-backup-button'),
  openIRealDefaultPlaylistsButton: document.getElementById('open-ireal-default-playlists-button'),
  openIRealForumButton: document.getElementById('open-ireal-forum-button'),
  clearAllChartsButton: document.getElementById('clear-all-charts-button'),
  irealLinkInput: document.getElementById('ireal-link-input'),
  importIRealLinkButton: document.getElementById('import-ireal-link-button'),
  chartImportStatus: document.getElementById('chart-import-status'),
  irealBackupInput: document.getElementById('ireal-backup-input'),
  fixtureSelect: document.getElementById('fixture-select'),
  transposeSelect: document.getElementById('transpose-select'),
  harmonyDisplayMode: document.getElementById('harmony-display-mode'),
  useMajorTriangleSymbol: document.getElementById('use-major-triangle-symbol'),
  useHalfDiminishedSymbol: document.getElementById('use-half-diminished-symbol'),
  useDiminishedSymbol: document.getElementById('use-diminished-symbol'),
  tempoInput: document.getElementById('tempo-input'),
  sheetStyle: document.getElementById('sheet-style'),
  sheetTitle: document.getElementById('sheet-title'),
  sheetSubtitle: document.getElementById('sheet-subtitle'),
  sheetTimeSignature: document.getElementById('sheet-time-signature'),
  sheetKey: document.getElementById('sheet-key'),
  previousChartButton: document.getElementById('previous-chart-button'),
  nextChartButton: document.getElementById('next-chart-button'),
  sheetGrid: document.getElementById('sheet-grid'),
  chartMeta: document.getElementById('chart-meta'),
  diagnosticsList: document.getElementById('diagnostics-list'),
  transportStatus: document.getElementById('transport-status'),
  transportPosition: document.getElementById('transport-position'),
  playButton: document.getElementById('play-button'),
  stopButton: document.getElementById('stop-button'),
  compingStyleSelect: document.getElementById('comping-style-select'),
  drumsSelect: document.getElementById('drums-select'),
  walkingBassToggle: document.getElementById('walking-bass-toggle'),
  masterVolume: document.getElementById('master-volume'),
  masterVolumeValue: document.getElementById('master-volume-value'),
  bassVolume: document.getElementById('bass-volume'),
  bassVolumeValue: document.getElementById('bass-volume-value'),
  stringsVolume: document.getElementById('strings-volume'),
  stringsVolumeValue: document.getElementById('strings-volume-value'),
  drumsVolume: document.getElementById('drums-volume'),
  drumsVolumeValue: document.getElementById('drums-volume-value'),
  playbackBridgeFrame: document.getElementById('drill-bridge-frame'),
  selectionSummary: document.getElementById('selection-summary'),
  clearSelectionButton: document.getElementById('clear-selection-button'),
  sendSelectionToPracticeButton: document.getElementById('send-selection-to-drill-button'),
  mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
  mobileBackdrop: document.getElementById('chart-mobile-backdrop'),
  manageChartsButton: document.getElementById('manage-charts-button'),
  manageChartsPopover: document.getElementById('manage-charts-popover'),
  settingsButton: document.getElementById('settings-button'),
  settingsPopover: document.getElementById('settings-popover'),
  chartTopOverlay: document.getElementById('chart-top-overlay'),
  chartBottomOverlay: document.getElementById('chart-bottom-overlay'),
  chartApp: document.querySelector('.chart-app')
};

initializeAppShell(/** @type {any} */ (createAppShellBindings({
  mode: 'chart',
  drillLink: dom.appModeDrillLink,
  chartLink: dom.appModeChartLink,
  modeBadge: dom.appModeBadge
})));

/** @type {ChartScreenState & {
 *   chartPlaybackBridgeProvider: PlaybackBridgeProvider | null,
 *   swipeGesture: {
 *     pointerId: number | null,
 *     startX: number,
 *     startY: number,
 *     active: boolean
 *   }
 * }} */
const state = {
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
  selectionController: /** @type {ChartSelectionController} */ (createContiguousBarSelectionController()),
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

function isPopoverOpen(popover) {
  return Boolean(popover && !popover.hidden);
}

function isOverlayOpen() {
  return dom.chartApp?.classList.contains('overlay-open') === true;
}

function handleChartDismissibleBack() {
  if (isPopoverOpen(dom.settingsPopover) || isPopoverOpen(dom.manageChartsPopover)) {
    closeAllPopovers();
    chartBackNavigation.sync();
    return true;
  }
  if (isOverlayOpen()) {
    closeOverlay();
    chartBackNavigation.sync();
    return true;
  }
  return false;
}

const chartBackNavigation = createMobileBackNavigationController({
  canHandleBack: () => (
    isPopoverOpen(dom.settingsPopover)
    || isPopoverOpen(dom.manageChartsPopover)
    || isOverlayOpen()
  ),
  handleBack: handleChartDismissibleBack
});

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
    dom.transportStatus.textContent = message;
  },
  onPersistPlaybackSettings: persistPlaybackSettings
}));

function loadPersistedChartId() {
  return loadPersistedChartIdFromStorage({
    legacyStorageKey: LAST_CHART_STORAGE_KEY
  });
}

function persistChartId(chartId) {
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

  if (persisted.compingStyle && Array.from(dom.compingStyleSelect.options).some((option) => option.value === persisted.compingStyle)) {
    dom.compingStyleSelect.value = persisted.compingStyle;
  }

  if (persisted.drumsMode && Array.from(dom.drumsSelect.options).some((option) => option.value === persisted.drumsMode)) {
    dom.drumsSelect.value = persisted.drumsMode;
  }

  if (persisted.customMediumSwingBass !== undefined) {
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

function normalizeHarmonyDisplayMode(mode) {
  return [
    HARMONY_DISPLAY_MODE_DEFAULT,
    HARMONY_DISPLAY_MODE_RICH
  ].includes(mode)
    ? mode
    : HARMONY_DISPLAY_MODE_DEFAULT;
}

function getDisplayAliasQuality(quality, displayMode) {
  if (!quality) return quality;
  if (displayMode === HARMONY_DISPLAY_MODE_RICH) {
    return RICH_DISPLAY_QUALITY_ALIASES[quality] || quality;
  }
  return DEFAULT_DISPLAY_QUALITY_ALIASES[quality] || quality;
}

function getAvailableDocuments() {
  return state.filteredDocuments.length > 0
    ? state.filteredDocuments
    : (state.fixtureLibrary?.documents || []);
}

function updateChartNavigationState() {
  updateChartNavigationStateUi(/** @type {any} */ (createChartNavigationStateBindings({
    previousChartButton: dom.previousChartButton,
    nextChartButton: dom.nextChartButton,
    documents: getAvailableDocuments(),
    selectedId: dom.fixtureSelect?.value || state.currentChartDocument?.metadata?.id || ''
  })));
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

function setImportStatus(message, isError = false) {
  const bindings = createChartImportStatusBindings({
    chartImportStatus: dom.chartImportStatus,
    message,
    isError
  });
  setChartImportStatus(bindings.chartImportStatus, bindings.message, bindings.isError);
}

async function importIncomingIRealLink(rawText, sourceLabel = 'incoming iReal link') {
  const trimmedText = String(rawText || '').trim();
  if (!trimmedText) return false;
  try {
    const documents = await importDocumentsFromIRealText(trimmedText, sourceLabel);
    applyImportedLibrary({
      documents,
      source: sourceLabel,
      statusMessage: `Loaded ${documents.length} charts from ${sourceLabel}.`
    });
    return true;
  } catch (error) {
    setImportStatus(`Import failed: ${getErrorMessage(error)}`, true);
    return false;
  }
}

async function consumePendingMobileImport() {
  const pendingIRealLink = consumePendingIRealLink();
  if (!pendingIRealLink) return false;
  dom.irealLinkInput.value = pendingIRealLink;
  return importIncomingIRealLink(pendingIRealLink, 'incoming iReal link');
}

async function bindIncomingMobileImports() {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  let appPlugin = null;
  try {
    const capacitorAppModule = await import('@capacitor/app');
    appPlugin = capacitorAppModule?.App || null;
  } catch (_error) {
    appPlugin = window.Capacitor?.Plugins?.App || null;
  }
  if (!appPlugin?.addListener) return;

  appPlugin.addListener('appUrlOpen', async ({ url }) => {
    if (!isIRealDeepLink(url)) return;
    storePendingIRealLink(url);
    await consumePendingMobileImport();
  });
}

async function importDocumentsFromIRealText(rawText, sourceFile = '') {
  return importChartDocumentsFromIRealText(/** @type {any} */ (createChartLibraryImportBindings({
    rawText,
    sourceFile,
    importDocuments: createChartDocumentsFromIRealText
  })));
}

function applyImportedLibrary({ documents, source, preferredId = null, statusMessage = '' }) {
  void persistChartLibrary({
    source,
    documents
  });
  applyImportedChartLibrary(/** @type {any} */ (createChartImportedLibraryBindings({
    state,
    chartSearchInput: dom.chartSearchInput,
    renderChartSelector,
    renderFixture,
    setImportStatus,
    documents,
    source,
    preferredId,
    statusMessage
  })));
}

async function restorePersistedChartLibrary() {
  const persistedLibrary = await loadPersistedChartLibrary();
  if (!persistedLibrary) {
    renderChartSelector();
    return;
  }

  applyImportedChartLibrary(/** @type {any} */ (createChartImportedLibraryBindings({
    state,
    chartSearchInput: dom.chartSearchInput,
    renderChartSelector,
    renderFixture,
    setImportStatus,
    documents: persistedLibrary.documents,
    source: persistedLibrary.source,
    preferredId: loadPersistedChartId(),
    statusMessage: ''
  })));
}

function getPlaybackSettings() {
  /** @type {PlaybackSettings} */
  return {
    compingStyle: dom.compingStyleSelect.value,
    drumsMode: dom.drumsSelect.value,
    customMediumSwingBass: dom.walkingBassToggle.checked,
    masterVolume: Number(dom.masterVolume.value || 100),
    bassVolume: Number(dom.bassVolume.value || 100),
    stringsVolume: Number(dom.stringsVolume.value || 100),
    drumsVolume: Number(dom.drumsVolume.value || 100)
  };
}

function getSelectedPracticeSession() {
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
  const parsed = Number(dom.tempoInput.value || DEFAULT_TEMPO);
  return Number.isFinite(parsed) ? Math.max(40, Math.min(320, parsed)) : DEFAULT_TEMPO;
}

function getDisplayedBarGroupSize() {
  return DEFAULT_BAR_GROUP_SIZE;
}

function renderSheet(viewModel) {
  getChartSheetRenderer().renderSheet(viewModel);
}

function updateSheetGridGap() {
  getChartSheetRenderer().updateSheetGridGap();
}

function applyOpticalPlacements() {
  getChartSheetRenderer().applyOpticalPlacements();
}

function renderDiagnostics(playbackPlan) {
  getChartSheetRenderer().renderDiagnostics(playbackPlan);
}

function setActivePlaybackPosition(barId, entryIndex) {
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
    const htmlElement = /** @type {HTMLElement} */ (element);
    htmlElement.classList.toggle('is-active', htmlElement.dataset.barId === state.activeBarId);
  });

  document.querySelectorAll('.chart-playback-entry').forEach((element) => {
    const htmlElement = /** @type {HTMLElement} */ (element);
    htmlElement.classList.toggle('is-active', Number(htmlElement.dataset.entryIndex) === state.activePlaybackEntryIndex);
  });
}

function updateSelectionHighlights() {
  const selectedBarIds = new Set(state.selectionController.getSelection().barIds);
  document.querySelectorAll('.chart-bar-cell').forEach((element) => {
    const htmlElement = /** @type {HTMLElement} */ (element);
    htmlElement.classList.toggle('is-selected', selectedBarIds.has(htmlElement.dataset.barId));
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
    /** @type {PlaybackOperationResult} */
    const result = await getChartPlaybackController().syncPlaybackSettings();
    if (!result?.ok) {
      throw new Error(result?.errorMessage || 'Failed to sync playback settings.');
    }
    if (!state.isPlaying) {
      dom.transportStatus.textContent = 'Ready';
    }
  } catch (error) {
    dom.transportStatus.textContent = `Playback settings error: ${getErrorMessage(error)}`;
  }
}

function navigateToPracticeWithSelection() {
  getChartPlaybackController().navigateToPracticeWithSelection();
}

/** @returns {PlaybackBridgeProvider} */
function getChartPlaybackBridgeProvider() {
  return playbackRuntimeContext.getPlaybackBridgeProvider();
}

function getChartPlaybackController() {
  return playbackRuntimeContext.getPlaybackController();
}

function getChartSheetRenderer() {
  if (state.chartSheetRenderer) return state.chartSheetRenderer;

  state.chartSheetRenderer = /** @type {ChartSheetRenderer} */ (createChartSheetRenderer(createChartSheetRendererBindings(createChartSheetRendererAppBindings({
    sheetGrid: dom.sheetGrid,
    diagnosticsList: dom.diagnosticsList,
    getDisplayedBarGroupSize,
    getHarmonyDisplayMode: () => normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value),
    getFallbackTimeSignature: () => state.currentViewModel?.metadata?.primaryTimeSignature || '',
    renderChordMarkup,
    isBarActive: (bar) => bar?.id === state.activeBarId,
    isBarSelected: (bar) => state.selectionController.getSelection().barIds.includes(bar?.id)
  }))));

  return state.chartSheetRenderer;
}

/**
 * @param {ChartViewModel} viewModel
 * @returns {void}
 */
function renderMeta(viewModel) {
  const bindings = createChartMetaBindings({
    chartMeta: dom.chartMeta,
    viewModel
  });
  renderChartMeta(bindings.chartMeta, bindings.viewModel);
}

function renderChordMarkup(token, harmonyDisplayMode) {
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
  renderChartTransport(/** @type {any} */ (createChartTransportBindings({
    transportStatusElement: dom.transportStatus,
    transportPositionElement: dom.transportPosition,
    playButton: dom.playButton,
    stopButton: dom.stopButton,
    totalBars: getSelectedPracticeSession()?.playback?.bars?.length || state.currentPlaybackPlan?.entries?.length || 0,
    activePlaybackEntryIndex: state.activePlaybackEntryIndex,
    isPlaying: state.isPlaying,
    isPaused: state.isPaused
  })));
}

function renderChartSelector(preferredId = null) {
  const documents = getAvailableDocuments();
  const previousId = preferredId || state.currentChartDocument?.metadata?.id || dom.fixtureSelect.value;
  const selectedId = renderChartSelectorUi(/** @type {any} */ (createChartSelectorBindings({
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
  })));
  if (selectedId) {
    dom.fixtureSelect.value = selectedId;
  }
  updateChartNavigationState();
}

function applySearchFilter() {
  const query = String(dom.chartSearchInput.value || '').trim().toLowerCase();
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
      dom.transportStatus.textContent = 'Ready';
      renderTransport();
    },
    renderSelectionState,
    updateChartNavigationState
  }));
}

function handleBarSelection(event) {
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
  chartBackNavigation.sync();
}

function togglePopover(targetPopover, otherPopover) {
  const bindings = createChartPopoverBindings({
    targetPopover,
    popovers: [targetPopover, otherPopover]
  });
  toggleChartPopover(bindings.targetPopover, bindings.popovers);
  chartBackNavigation.sync();
}

function openOverlay() {
  openChartOverlay(createChartOverlayShellBindings({
    chartApp: dom.chartApp,
    chartTopOverlay: dom.chartTopOverlay,
    chartBottomOverlay: dom.chartBottomOverlay
  }));
  chartBackNavigation.sync();
}

function closeOverlay() {
  closeChartOverlay(createChartOverlayShellBindings({
    chartApp: dom.chartApp,
    chartTopOverlay: dom.chartTopOverlay,
    chartBottomOverlay: dom.chartBottomOverlay,
    popovers: [dom.manageChartsPopover, dom.settingsPopover]
  }));
  chartBackNavigation.sync();
}

async function clearAllCharts() {
  if (!state.fixtureLibrary?.documents?.length) {
    setImportStatus('No charts to remove.');
    closeAllPopovers();
    return;
  }

  const shouldClear = window.confirm('Remove all imported charts from this device?');
  if (!shouldClear) return;

  await stopPlayback({ resetPosition: true });
  state.selectionController.clear();
  state.fixtureLibrary = null;
  state.filteredDocuments = [];
  state.currentLibrarySourceLabel = '';
  state.currentSearch = '';
  dom.chartSearchInput.value = '';
  dom.irealLinkInput.value = '';
  persistChartId('');
  await clearPersistedChartLibrary();
  renderChartSelector();
  closeAllPopovers();
  setImportStatus('All charts removed from this device.');
}

async function handleBackupFileSelection(event) {
  return handleChartBackupFileSelection({
    event,
    importDocumentsFromIRealText,
    applyImportedLibrary,
    setImportStatus
  });
}

async function handlePastedIRealLinkImport() {
  return handlePastedChartIRealLinkImport({
    rawText: dom.irealLinkInput.value,
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
    onPastedLinkImport: handlePastedIRealLinkImport,
    onOpenForumTracks: () => openIrealBrowser({
      url: IREAL_FORUM_TRACKS_URL,
      title: 'iReal forum tracks'
    })
  }));
  dom.clearAllChartsButton?.addEventListener('click', () => {
    void clearAllCharts();
  });
}

async function loadFixtures() {
  await initializeChartScreen(createChartScreenBindings(createChartScreenAppBindings({
    applyPersistedPlaybackSettings,
    bindImportControls,
    bindChartNavigationControls,
    importDefaultFixtureLibrary: restorePersistedChartLibrary,
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
            dom.transportStatus.textContent = `Playback error: ${getErrorMessage(error)}`;
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
        onManageChartsToggle: () => togglePopover(dom.manageChartsPopover, dom.settingsPopover),
        onSettingsToggle: () => togglePopover(dom.settingsPopover, dom.manageChartsPopover)
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
      dom.transportStatus.textContent = message;
    }
  })));
  await consumePendingMobileImport();
}

loadFixtures().catch((error) => {
  dom.transportStatus.textContent = `Failed to load charts: ${getErrorMessage(error)}`;
});

void bindIncomingMobileImports();

bindChartLifecycleEvents({
  lifecycleTarget: window,
  visibilityTarget: document,
  state,
  intervalMs: PLAYBACK_STATE_POLL_INTERVAL_MS,
  onTick: syncPlaybackState
});
