import type {
  ChartDocument,
  ChartSetlist,
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
} from '../src/core/types/contracts';

import { initializeSharpElevenTheme } from '../src/features/app/app-theme.js';
import {
  createChartDocumentsFromIRealText,
  parseNoteSymbol,
  transposeKeySymbol
} from './index.js';
import defaultIRealSourceText from '../parsing-projects/ireal/sources/jazz-1460.txt?raw';
import {
  loadPersistedChartDocument,
  loadPersistedChartDocumentById,
  loadPersistedChartLibrary,
  loadPersistedSetlists,
  persistChartLibrary,
  persistSetlists,
  removePersistedChartReferences
} from '../src/features/chart/chart-persistence.js';
import {
  applyBatchMetadataOperation,
  applyPerChartMetadataUpdate,
  filterChartDocuments,
  getChartSetlistMembership,
  getChartSourceRefs,
  importDocumentsFromIRealText as importChartDocumentsFromIRealText,
  previewProtectedChartDelete
} from '../src/features/chart/chart-library.js';
import {
  renderSelectedFixture
} from '../src/features/chart/chart-fixture-controller.js';
import {
  createChartNavigationController,
  updateChartNavigationState as updateChartNavigationStateUi
} from '../src/features/chart/chart-navigation.js';
import { createChartGestureController } from '../src/features/chart/chart-gesture-controller.js';
import { createChartPlaybackRuntimeContextBindings } from '../src/features/chart/chart-playback-runtime-context-bindings.js';
import { createChartDirectPlaybackRuntimeHost } from '../src/features/chart/chart-direct-playback-runtime-host.js';
import { createChartPlaybackRuntimeContext } from '../src/features/chart/chart-playback-runtime-context.js';
import {
  applyPlaybackTransportState,
  startPlaybackPolling,
  stopPlaybackPolling
} from '../src/features/chart/chart-playback-runtime.js';
import {
  renderChartMeta,
  renderChartSelector as renderChartSelectorUi,
  renderChartTransport
} from '../src/features/chart/chart-renderer.js';
import { createAppShellBindings } from '../src/features/app/app-shell-bindings.js';
import { initializeAppShell } from '../src/features/app/app-shell.js';
import {
  consumePendingIRealLinkResult,
  isIRealDeepLink,
  storePendingIRealLink
} from '../src/features/app/app-pending-mobile-import.js';
import { openIrealBrowser } from '../src/features/app/ireal-browser.js';
import { createChartSheetRenderer } from '../src/features/chart/chart-sheet-renderer.js';
import {
  bindChartImportControls,
  handleChartBackupFileSelection,
  handlePastedChartIRealLinkImport,
  importDefaultFixtureLibrary as importChartDefaultFixtureLibrary,
  setChartImportStatus
} from '../src/features/chart/chart-import-controls.js';
import {
  createChartDefaultLibraryBindings,
  createChartDirectPlaybackRuntimeHostBindings,
  createChartFixtureRenderBindings,
  createChartImportControlsBindings,
  createChartImportStatusBindings,
  createChartLayoutObserversBindings,
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
} from '../src/features/chart/chart-app-bindings.js';
import {
  bindChartLayoutObservers,
  closeAllChartPopovers,
  closeChartOverlay,
  initializeChartScreen,
  openChartOverlay,
  toggleChartPopover
} from '../src/features/chart/chart-ui-shell.js';
import { bindChartRuntimeControls } from '../src/features/chart/chart-runtime-controls.js';
import { createContiguousBarSelectionController } from '../src/features/chart/chart-selection-controller.js';
import {
  getSelectedPracticeSession as getSelectedPracticeSessionFromState,
  renderChartSelectionUi,
  updateChartMixerOutputs
} from '../src/features/chart/chart-screen-state.js';
import { createChartScreenDomRefs } from '../src/features/chart/chart-screen-dom.js';
import { createChartLibraryImportFlow } from '../src/features/chart/chart-library-import-flow.js';
import {
  applyChartDisplayCssVariables,
  measureChartTextScaleCompensation,
  syncChartCutoutPadding
} from '../src/features/chart/chart-display-css.js';
import {
  getChartBackHref,
  getChartBackOrigin,
  getRequestedChartId,
  getRequestedPlaylist,
  getRequestedSetlistId,
  loadPersistedChartId,
  loadPersistedInstrumentTransposition,
  loadPersistedPlaybackSettings,
  persistChartId as persistChartScreenId,
  persistInstrumentTransposition as persistChartInstrumentTransposition,
  persistPlaybackSettings as persistChartScreenPlaybackSettings,
  replaceCurrentChartIdInUrl
} from '../src/features/chart/chart-screen-persistence.js';
import { renderChordSymbolHtml } from '../src/core/music/chord-symbol-display.js';
import voicingConfig from '../src/core/music/voicing-config.js';
import { CHART_DISPLAY_CONFIG } from '../src/config/trainer-config.js';

const DEFAULT_TEMPO = 120;
const PLAYBACK_STATE_POLL_INTERVAL_MS = 120;
const IREAL_SOURCE_URL = '../parsing-projects/ireal/sources/jazz-1460.txt';
const IREAL_DEFAULT_PLAYLISTS_URL = 'https://www.irealpro.com/main-playlists/';
const IREAL_FORUM_TRACKS_URL = 'https://forums.irealpro.com/#songs.3';
const HARMONY_DISPLAY_MODE_DEFAULT = 'default';
const HARMONY_DISPLAY_MODE_RICH = 'rich';
const CHART_PLAYBACK_BRIDGE_MODE = 'direct';
const DEFAULT_MASTER_VOLUME_PERCENT = 50;
const DEFAULT_CHANNEL_VOLUME_PERCENT = 100;
const DEFAULT_COMPING_STYLE = 'piano';
const DEFAULT_BAR_GROUP_SIZE = CHART_DISPLAY_CONFIG.layout.barsPerRow;
const CHART_RENDER_PERF_LOG_PREFIX = '[SharpEleven chart perf]';
const CHART_RENDER_PERF_STORAGE_KEY = 'sharp-eleven-chart-render-perf';

const {
  DEFAULT_DISPLAY_QUALITY_ALIASES = {},
  RICH_DISPLAY_QUALITY_ALIASES = {}
} = voicingConfig;

initializeSharpElevenTheme();

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

function isNativePlatform() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

function applyImportModeVisibility() {
  const isNative = isNativePlatform();
  if (dom.irealImportActions) {
    dom.irealImportActions.hidden = !isNative;
  }
  if (dom.irealLinkImportSection) {
    dom.irealLinkImportSection.hidden = isNative;
  }
}

const dom = createChartScreenDomRefs(document);

function applyChartBackTarget() {
  const backOrigin = getChartBackOrigin();
  if (!dom.chartHomeButton) return;
  dom.chartHomeButton.href = getChartBackHref();
  const label = backOrigin === 'setlists'
    ? 'Back to setlists'
    : backOrigin === 'library'
      ? 'Back to Library'
      : 'Back to home';
  dom.chartHomeButton.setAttribute('aria-label', label);
  dom.chartHomeButton.setAttribute('title', label);
}

applyChartBackTarget();

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
  },
  selectionLoopActive: boolean,
  selectionLoopPlaybackPending: boolean,
  selectionLoopRestartPending: boolean
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
  },
  selectionLoopActive: false,
  selectionLoopPlaybackPending: false,
  selectionLoopRestartPending: false
};

let lastMobileOverlayTopHeight = -1;
let lastMobileOverlayBottomHeight = -1;
let lastMobileOverlayPushY = -1;

let chartTextScaleCompensation = 1;
let transposeOptionsChartId = '';
let chartRenderPerfPassId = 0;
let activeChartRenderPerfPassId = 0;
let chartLayoutFrame = 0;
let pendingChartLayoutNeedsOpticalPlacement = false;
const pendingChartLayoutReasons = new Set<string>();
let lastOpticalLayoutWidth = -1;
let lastOpticalLayoutFontsReady = false;
let didOpenRequestedMetadataPanel = false;
let chartMetadataPopoverRenderId = 0;
let chartTransitionCleanupTimer = 0;
const CHART_ACTION_FEEDBACK_CLASS = 'is-chart-action-feedback';
const CHART_ACTION_FEEDBACK_DURATION_MS = 520;
const chartActionFeedbackTimers = new WeakMap<HTMLButtonElement, number>();

declare global {
  interface Window {
    __sharpElevenChartDebug?: {
      snapshot: () => unknown,
      inspectBar: (barOrRow?: number | { bar?: number, measure?: number, row?: number, line?: number, column?: number }, column?: number) => unknown,
      logBar: (barOrRow?: number | { bar?: number, measure?: number, row?: number, line?: number, column?: number }, column?: number) => unknown,
      layout: () => unknown
    },
    __sharpElevenChartLayoutDebug?: {
      getBypasses: () => Record<string, boolean>,
      setBypasses: (nextBypasses?: Record<string, boolean>) => Record<string, boolean>,
      clearBypasses: () => Record<string, boolean>,
      refresh: () => void,
      snapshot: () => unknown,
      inspectBar: (barOrRow?: number | { bar?: number, measure?: number, row?: number, line?: number, column?: number }, column?: number) => unknown,
      logBar: (barOrRow?: number | { bar?: number, measure?: number, row?: number, line?: number, column?: number }, column?: number) => unknown
    }
  }
}

let chartNavigationController: ReturnType<typeof createChartNavigationController> | null = null;

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

function persistChartId(chartId: string, chartDocument = state.currentChartDocument) {
  persistChartScreenId(chartId, chartDocument);
  replaceCurrentChartIdInUrl(chartId);
}

function persistInstrumentTransposition() {
  persistChartInstrumentTransposition(dom.instrumentTransposeSelect?.value || '0');
}

function setInstrumentTransposition(value: string | number, { render = false }: { render?: boolean } = {}) {
  const normalized = String(value);
  if (dom.instrumentTransposeSelect && Array.from(dom.instrumentTransposeSelect.options).some((option) => option.value === normalized)) {
    dom.instrumentTransposeSelect.value = normalized;
  }
  if (dom.transposeSelect && Array.from(dom.transposeSelect.options).some((option) => option.value === normalized)) {
    dom.transposeSelect.value = normalized;
  }
  persistInstrumentTransposition();
  if (render) {
    renderFixture();
    void syncPlaybackSettings().catch((error) => {
      if (dom.transportStatus) dom.transportStatus.textContent = `Playback settings error: ${getErrorMessage(error)}`;
    });
  }
}

function syncChartPopoverButtonStates() {
  dom.manageChartsButton?.setAttribute('aria-expanded', dom.manageChartsPopover && !dom.manageChartsPopover.hidden ? 'true' : 'false');
  dom.chartMetadataButton?.setAttribute('aria-expanded', dom.chartMetadataPopover && !dom.chartMetadataPopover.hidden ? 'true' : 'false');
  dom.instrumentSettingsButton?.setAttribute('aria-expanded', dom.instrumentSettingsPopover && !dom.instrumentSettingsPopover.hidden ? 'true' : 'false');
  dom.tempoButton?.setAttribute('aria-expanded', dom.tempoPopover && !dom.tempoPopover.hidden ? 'true' : 'false');
  dom.mixerButton?.setAttribute('aria-expanded', dom.mixerPopover && !dom.mixerPopover.hidden ? 'true' : 'false');
}

function shouldFlashChartActionFeedback(button: HTMLButtonElement) {
  if (button.disabled || button.getAttribute('aria-disabled') === 'true') return false;
  return button.getAttribute('aria-haspopup') !== 'menu';
}

function flashChartActionFeedback(button: HTMLButtonElement) {
  window.clearTimeout(chartActionFeedbackTimers.get(button));
  button.classList.remove(CHART_ACTION_FEEDBACK_CLASS);
  void button.offsetWidth;
  button.classList.add(CHART_ACTION_FEEDBACK_CLASS);
  chartActionFeedbackTimers.set(button, window.setTimeout(() => {
    button.classList.remove(CHART_ACTION_FEEDBACK_CLASS);
    chartActionFeedbackTimers.delete(button);
  }, CHART_ACTION_FEEDBACK_DURATION_MS));
}

function bindChartButtonFeedback() {
  dom.chartApp?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('button');
    if (!(button instanceof HTMLButtonElement) || !dom.chartApp?.contains(button)) return;
    if (shouldFlashChartActionFeedback(button)) {
      flashChartActionFeedback(button);
    }
  }, true);
}

function persistPlaybackSettings() {
  persistChartScreenPlaybackSettings({
    playbackSettings: getPlaybackSettings(),
    harmonyDisplayMode: normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value),
    useChordSymbolV2: false,
    useMajorTriangleSymbol: dom.useMajorTriangleSymbol?.checked !== false,
    useHalfDiminishedSymbol: dom.useHalfDiminishedSymbol?.checked !== false,
    useDiminishedSymbol: dom.useDiminishedSymbol?.checked !== false
  });
}

function applyPersistedPlaybackSettings() {
  const persisted = loadPersistedPlaybackSettings();

  if (dom.compingStyleSelect && Array.from(dom.compingStyleSelect.options).some((option) => option.value === DEFAULT_COMPING_STYLE)) {
    dom.compingStyleSelect.value = DEFAULT_COMPING_STYLE;
  }
  setInstrumentTransposition(loadPersistedInstrumentTransposition());

  if (!persisted) return;

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
  chartNavigationController = createChartNavigationController(createChartNavigationBindings({
    getDocuments: getAvailableDocuments,
    getSelectedId: () => dom.fixtureSelect?.value || state.currentChartDocument?.metadata?.id || '',
    setSelectedId: (id) => {
      if (dom.fixtureSelect) {
        dom.fixtureSelect.value = id;
      }
    },
    renderFixture,
    onAdjacentChartChange: animateAdjacentChartChange,
    previousChartButton: dom.previousChartButton,
    nextChartButton: dom.nextChartButton,
    sheetGrid: dom.sheetGrid,
    enableSwipeGestures: false
  }));
  chartNavigationController.bind();
}

function animateAdjacentChartChange(direction: number) {
  const chartWorkspace = dom.chartApp?.querySelector<HTMLElement>('.chart-workspace');
  if (!chartWorkspace) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

  window.clearTimeout(chartTransitionCleanupTimer);
  chartWorkspace.classList.remove('is-chart-transitioning', 'is-chart-slide-next', 'is-chart-slide-previous');
  void chartWorkspace.offsetWidth;

  chartWorkspace.classList.add(
    'is-chart-transitioning',
    direction > 0 ? 'is-chart-slide-next' : 'is-chart-slide-previous'
  );

  const cleanup = () => {
    window.clearTimeout(chartTransitionCleanupTimer);
    chartTransitionCleanupTimer = 0;
    chartWorkspace.classList.remove('is-chart-transitioning', 'is-chart-slide-next', 'is-chart-slide-previous');
  };
  chartWorkspace.addEventListener('animationend', cleanup, { once: true });
  chartTransitionCleanupTimer = window.setTimeout(cleanup, 260);
}

function setImportStatus(message: string, isError = false) {
  setChartImportStatus(...Object.values(createChartImportStatusBindings({
    chartImportStatus: dom.chartImportStatus,
    message,
    isError
  })) as [HTMLElement | null, string, boolean]);
}

const {
  importDocumentsFromIRealText,
  renderImportedLibrary,
  backfillChartDocumentIndexInBackground,
  applyImportedLibrary
} = createChartLibraryImportFlow({
  state,
  dom,
  importDocuments: createChartDocumentsFromIRealText,
  renderChartSelector,
  renderFixture,
  setImportStatus,
  getRequestedPlaylist,
  applySearchFilter,
  getChartRenderPerfNow,
  logChartRenderPerf
});

function getPlaybackSettings(): PlaybackSettings {
  return {
    transposition: getChartTransposeSemitones(),
    compingStyle: dom.compingStyleSelect?.value,
    drumsMode: dom.drumsSelect?.value,
    customMediumSwingBass: dom.walkingBassToggle?.checked,
    masterVolume: Number(dom.masterVolume?.value || DEFAULT_MASTER_VOLUME_PERCENT),
    bassVolume: Number(dom.bassVolume?.value || DEFAULT_CHANNEL_VOLUME_PERCENT),
    stringsVolume: Number(dom.stringsVolume?.value || DEFAULT_CHANNEL_VOLUME_PERCENT),
    drumsVolume: Number(dom.drumsVolume?.value || DEFAULT_CHANNEL_VOLUME_PERCENT)
  };
}

function getChartTransposeSemitones() {
  const parsed = Number(dom.transposeSelect?.value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTransposeSourceKey(chartDocument: ChartDocument | null | undefined) {
  const sourceKey = String(chartDocument?.metadata?.sourceKey || '').trim();
  const tonic = sourceKey.match(/^([A-G](?:b|#)?)/)?.[1] || '';
  return parseNoteSymbol(tonic) ? sourceKey : 'C';
}

function populateTransposeOptions(chartDocument: ChartDocument | null | undefined) {
  if (!dom.transposeSelect || !chartDocument) return;
  const chartId = chartDocument.metadata?.id || '';
  if (transposeOptionsChartId === chartId && dom.transposeSelect.options.length > 0) return;

  transposeOptionsChartId = chartId;
  const sourceKey = getTransposeSourceKey(chartDocument);
  dom.transposeSelect.innerHTML = '';
  for (let offset = 0; offset < 12; offset += 1) {
    const option = document.createElement('option');
    option.value = String(offset);
    option.textContent = transposeKeySymbol(sourceKey, offset) || sourceKey;
    dom.transposeSelect.appendChild(option);
  }
  setInstrumentTransposition(dom.instrumentTransposeSelect?.value || '0');
}

function handleChartTransposeChange() {
  const value = String(dom.transposeSelect?.value || '0');
  if (dom.instrumentTransposeSelect && Array.from(dom.instrumentTransposeSelect.options).some((option) => option.value === value)) {
    dom.instrumentTransposeSelect.value = value;
    persistInstrumentTransposition();
  }
  renderFixture();
}

function getSelectedPracticeSession(): PracticeSessionSpec | null {
  return getSelectedPracticeSessionFromState(state);
}

function hasActiveSelection() {
  return state.selectionController.getSelection().barIds.length > 0;
}

function canClearChartSelection() {
  return !state.isPlaying && !state.isPaused && !state.selectionLoopPlaybackPending;
}

function setSelectionLoopActive(active: boolean) {
  state.selectionLoopActive = Boolean(active);
  if (!state.selectionLoopActive) {
    state.selectionLoopPlaybackPending = false;
    state.selectionLoopRestartPending = false;
  }
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

function syncTempoControls(tempo = getTempo()) {
  const normalizedTempo = Math.round(Math.max(40, Math.min(320, Number(tempo) || DEFAULT_TEMPO)));
  if (dom.tempoInput) dom.tempoInput.value = String(normalizedTempo);
  if (dom.tempoRange) dom.tempoRange.value = String(normalizedTempo);
  if (dom.tempoButtonLabel) dom.tempoButtonLabel.textContent = `${normalizedTempo} bpm`;
  if (dom.tempoPopoverValue) dom.tempoPopoverValue.textContent = String(normalizedTempo);
}

function setTempo(value: number | string, { syncPlayback = false }: { syncPlayback?: boolean } = {}) {
  const parsed = Number(value);
  const nextTempo = Number.isFinite(parsed) ? Math.max(40, Math.min(320, Math.round(parsed))) : DEFAULT_TEMPO;
  syncTempoControls(nextTempo);
  renderTransport();
  if (syncPlayback) {
    void syncPlaybackSettings().catch((error) => {
      if (dom.transportStatus) dom.transportStatus.textContent = `Playback settings error: ${getErrorMessage(error)}`;
    });
  }
}

function closeBottomPopovers() {
  if (dom.tempoPopover) dom.tempoPopover.hidden = true;
  if (dom.tempoButton) dom.tempoButton.setAttribute('aria-expanded', 'false');
  if (dom.mixerPopover) dom.mixerPopover.hidden = true;
  if (dom.mixerButton) dom.mixerButton.setAttribute('aria-expanded', 'false');
  syncChartPopoverButtonStates();
}

function isMetadataPopoverActive() {
  return Boolean(dom.chartMetadataPopover && !dom.chartMetadataPopover.hidden);
}

function bindBottomControlPopovers() {
  syncTempoControls();

  dom.tempoButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isMetadataPopoverActive()) {
      event.preventDefault();
      closeBottomPopovers();
      return;
    }
    const willOpen = Boolean(dom.tempoPopover?.hidden);
    closeAllChartPopovers((createChartPopoverBindings({
      popovers: [dom.manageChartsPopover, dom.instrumentSettingsPopover]
    }) as { popovers: Array<HTMLElement | null> }).popovers);
    dom.instrumentSettingsButton?.setAttribute('aria-expanded', 'false');
    if (dom.tempoPopover) dom.tempoPopover.hidden = !willOpen;
    syncChartPopoverButtonStates();
    syncMobileOverlayDrawerLayout();
  });

  dom.tempoPopover?.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  dom.mixerButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isMetadataPopoverActive()) {
      event.preventDefault();
      closeBottomPopovers();
      return;
    }
    const willOpen = Boolean(dom.mixerPopover?.hidden);
    closeAllChartPopovers((createChartPopoverBindings({
      popovers: [dom.manageChartsPopover, dom.instrumentSettingsPopover]
    }) as { popovers: Array<HTMLElement | null> }).popovers);
    dom.instrumentSettingsButton?.setAttribute('aria-expanded', 'false');
    if (dom.tempoPopover) dom.tempoPopover.hidden = true;
    dom.tempoButton?.setAttribute('aria-expanded', 'false');
    if (dom.mixerPopover) dom.mixerPopover.hidden = !willOpen;
    syncChartPopoverButtonStates();
    syncMobileOverlayDrawerLayout();
  });

  dom.mixerPopover?.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  dom.chartMetadataPopover?.addEventListener('focusin', () => {
    closeBottomPopovers();
  });

  dom.tempoRange?.addEventListener('input', () => {
    setTempo(dom.tempoRange?.value || DEFAULT_TEMPO, { syncPlayback: true });
  });

  dom.tempoInput?.addEventListener('change', () => {
    setTempo(dom.tempoInput?.value || DEFAULT_TEMPO, { syncPlayback: true });
  });

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('.chart-bottom-popover-wrap')) return;
    closeBottomPopovers();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeBottomPopovers();
  });
}

function getDisplayedBarGroupSize() {
  return DEFAULT_BAR_GROUP_SIZE;
}

function getChartRenderPerfNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function isChartRenderPerfEnabled() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('chartPerf') === '1' || params.has('perf')) return true;
    if (params.get('chartPerf') === '0') return false;
    return window.localStorage?.getItem(CHART_RENDER_PERF_STORAGE_KEY) === '1';
  } catch (_error) {
    return false;
  }
}

function logChartRenderPerf(label: string, startedAt: number, details: Record<string, unknown> = {}) {
  if (!isChartRenderPerfEnabled()) return;
  const durationMs = getChartRenderPerfNow() - startedAt;
  console.info(`${CHART_RENDER_PERF_LOG_PREFIX} ${JSON.stringify({
    label,
    passId: activeChartRenderPerfPassId,
    durationMs: Math.round(durationMs * 100) / 100,
    ...details
  })}`);
}

function renderSheet(viewModel: ChartViewModel) {
  const startedAt = getChartRenderPerfNow();
  activeChartRenderPerfPassId = chartRenderPerfPassId + 1;
  getChartSheetRenderer().renderSheet(viewModel);
  chartRenderPerfPassId = activeChartRenderPerfPassId;
  logChartRenderPerf('renderSheet', startedAt, {
    chartTitle: viewModel?.metadata?.title || '',
    bars: viewModel?.bars?.length || 0
  });
}

function runChartLayout({
  includeOpticalPlacement = false,
  reasons = []
}: {
  includeOpticalPlacement?: boolean,
  reasons?: string[]
} = {}) {
  const startedAt = getChartRenderPerfNow();
  if (includeOpticalPlacement) {
    applyOpticalPlacements();
  }
  updateSheetGridGap();
  logChartRenderPerf('scheduledChartLayout', startedAt, {
    includeOpticalPlacement,
    reasons
  });
}

function scheduleChartLayout({
  includeOpticalPlacement = false,
  reason = 'layout'
}: {
  includeOpticalPlacement?: boolean,
  reason?: string
} = {}) {
  pendingChartLayoutNeedsOpticalPlacement ||= includeOpticalPlacement;
  pendingChartLayoutReasons.add(reason);
  if (chartLayoutFrame) return;

  chartLayoutFrame = window.requestAnimationFrame(() => {
    chartLayoutFrame = 0;
    const shouldApplyOpticalPlacement = pendingChartLayoutNeedsOpticalPlacement;
    const reasons = Array.from(pendingChartLayoutReasons);
    pendingChartLayoutNeedsOpticalPlacement = false;
    pendingChartLayoutReasons.clear();
    runChartLayout({
      includeOpticalPlacement: shouldApplyOpticalPlacement,
      reasons
    });
  });
}

function shouldRunObserverOpticalPlacement() {
  if (lastOpticalLayoutWidth !== window.innerWidth) return true;
  return !lastOpticalLayoutFontsReady && document.fonts?.status === 'loaded';
}

function updateSheetGridGap() {
  const startedAt = getChartRenderPerfNow();
  getChartSheetRenderer().updateSheetGridGap();
  logChartRenderPerf('updateSheetGridGap', startedAt);
}

function applyOpticalPlacements() {
  const startedAt = getChartRenderPerfNow();
  getChartSheetRenderer().applyOpticalPlacements();
  lastOpticalLayoutWidth = window.innerWidth;
  lastOpticalLayoutFontsReady = document.fonts?.status === 'loaded';
  logChartRenderPerf('applyOpticalPlacements', startedAt);
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
  renderSelectionMenu();
}

function renderSelectionMenu() {
  const selectionCount = state.selectionController.getSelection().barIds.length;
  const hasSession = Boolean(state.currentSelectionPracticeSession);
  if (selectionCount === 0) {
    if (state.selectionLoopActive) {
      setSelectionLoopActive(false);
    }
    if (dom.selectionMenu) {
      dom.selectionMenu.hidden = true;
      dom.selectionMenu.setAttribute('aria-hidden', 'true');
    }
    return;
  }

  if (state.selectionLoopActive || state.selectionLoopPlaybackPending || state.isPlaying || state.isPaused) {
    if (dom.selectionLoopButton) {
      dom.selectionLoopButton.textContent = 'Loop';
      dom.selectionLoopButton.classList.remove('is-active');
    }
    if (dom.selectionMenu) {
      dom.selectionMenu.hidden = true;
      dom.selectionMenu.setAttribute('aria-hidden', 'true');
    }
    return;
  }

  if (dom.selectionMenu) {
    dom.selectionMenu.hidden = false;
    dom.selectionMenu.setAttribute('aria-hidden', 'false');
    positionSelectionMenu();
  }
  if (dom.selectionLoopButton) {
    dom.selectionLoopButton.disabled = !hasSession;
    dom.selectionLoopButton.textContent = state.selectionLoopActive ? 'Looping...' : 'Loop';
    dom.selectionLoopButton.classList.toggle('is-active', state.selectionLoopActive);
  }
  if (dom.selectionCreateDrillButton) {
    dom.selectionCreateDrillButton.disabled = !hasSession;
  }
}

function maybeRestartSelectionLoop(previousState: { isPlaying: boolean; isPaused: boolean }, nextState: { isPlaying?: boolean; isPaused?: boolean } | null | undefined) {
  if (!state.selectionLoopActive || state.selectionLoopRestartPending) return;
  if (!previousState.isPlaying || previousState.isPaused) return;
  if (nextState?.isPlaying || nextState?.isPaused) return;
  if (!hasActiveSelection() || !state.currentSelectionPracticeSession?.playback?.enginePatternString) {
    setSelectionLoopActive(false);
    renderSelectionState();
    return;
  }

  state.selectionLoopRestartPending = true;
  window.setTimeout(async () => {
    try {
      if (!state.selectionLoopActive) return;
      await startPlayback({
        cancelSelectionLoop: false
      });
    } catch (error) {
      setSelectionLoopActive(false);
      renderSelectionState();
      if (dom.transportStatus) dom.transportStatus.textContent = `Playback error: ${getErrorMessage(error)}`;
    } finally {
      state.selectionLoopRestartPending = false;
      renderSelectionState();
    }
  }, 0);
}

function applyChartPlaybackState(nextState: { isPlaying?: boolean; isPaused?: boolean } | null | undefined, { allowSelectionLoopRestart = true } = {}) {
  const previousState = {
    isPlaying: Boolean(state.isPlaying),
    isPaused: Boolean(state.isPaused)
  };
  applyPlaybackTransportState({
    state,
    nextState
  });
  if (allowSelectionLoopRestart) {
    maybeRestartSelectionLoop(previousState, nextState);
  }
  renderSelectionState();
}

function syncPlaybackState() {
  const nextState = getChartPlaybackController().syncPlaybackState();
  applyChartPlaybackState(nextState);
}

async function stopPlayback({ resetPosition = true, cancelSelectionLoop = true }: { resetPosition?: boolean; cancelSelectionLoop?: boolean } = {}) {
  if (cancelSelectionLoop) {
    setSelectionLoopActive(false);
  }
  stopPlaybackPolling({
    state
  });
  if (resetPosition) {
    resetActivePlaybackPosition();
  }
  applyChartPlaybackState({ isPlaying: false, isPaused: false }, {
    allowSelectionLoopRestart: false
  });
  const nextState = await getChartPlaybackController().stopPlayback({ resetPosition });
  applyChartPlaybackState(nextState, {
    allowSelectionLoopRestart: false
  });
}

async function startPlayback({ cancelSelectionLoop = true }: { cancelSelectionLoop?: boolean } = {}) {
  if (cancelSelectionLoop) {
    setSelectionLoopActive(false);
  }
  const shouldMarkLoopPending = !cancelSelectionLoop && state.selectionLoopActive;
  if (shouldMarkLoopPending) {
    state.selectionLoopPlaybackPending = true;
  }
  try {
    const nextState = await getChartPlaybackController().startPlayback();
    applyChartPlaybackState('isPlaying' in nextState
      ? nextState
      : { isPlaying: false, isPaused: false }, {
      allowSelectionLoopRestart: false
    });
    startPlaybackPolling({
      state,
      intervalMs: PLAYBACK_STATE_POLL_INTERVAL_MS,
      onTick: syncPlaybackState
    });
    syncPlaybackState();
  } finally {
    if (shouldMarkLoopPending) {
      state.selectionLoopPlaybackPending = false;
    }
  }
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
  setSelectionLoopActive(false);
  getChartPlaybackController().navigateToPracticeWithSelection();
}

function clearChartSelection() {
  if (!canClearChartSelection()) {
    openOverlay();
    return;
  }
  const shouldStopLoopPlayback = state.selectionLoopActive && (state.isPlaying || state.isPaused);
  setSelectionLoopActive(false);
  state.selectionController.clear();
  renderSelectionState();
  if (shouldStopLoopPlayback) {
    void stopPlayback({
      resetPosition: true,
      cancelSelectionLoop: false
    });
  }
}

async function startSelectionLoop() {
  if (!hasActiveSelection() || !state.currentSelectionPracticeSession?.playback?.enginePatternString) return;
  setSelectionLoopActive(true);
  state.selectionLoopPlaybackPending = true;
  if (dom.selectionMenu) {
    dom.selectionMenu.hidden = true;
    dom.selectionMenu.setAttribute('aria-hidden', 'true');
  }
  renderSelectionState();
  try {
    if (state.isPlaying || state.isPaused || state.activePlaybackEntryIndex >= 0) {
      await stopPlayback({
        resetPosition: true,
        cancelSelectionLoop: false
      });
    }
    await startPlayback({
      cancelSelectionLoop: false
    });
    state.selectionLoopPlaybackPending = false;
    closeOverlay();
  } catch (error) {
    state.selectionLoopPlaybackPending = false;
    setSelectionLoopActive(false);
    renderSelectionState();
    if (dom.transportStatus) dom.transportStatus.textContent = `Playback error: ${getErrorMessage(error)}`;
  }
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
    getTextScaleCompensation: () => chartTextScaleCompensation,
    getFallbackTimeSignature: () => state.currentViewModel?.metadata?.primaryTimeSignature || '',
    renderChordMarkup,
    isBarActive: (bar) => bar?.id === state.activeBarId,
    isBarSelected: (bar) => state.selectionController.getSelection().barIds.includes(bar?.id)
  })));

  return state.chartSheetRenderer;
}

function getCurrentChartDebugSnapshot() {
  const renderer = getChartSheetRenderer();
  const layout = renderer.getLayoutDebugSnapshot?.() as { bars?: any[] } | null | undefined;
  return {
    generatedAt: new Date().toISOString(),
    chart: {
      id: state.currentChartDocument?.metadata?.id || null,
      title: state.currentChartDocument?.metadata?.title || null,
      composer: state.currentChartDocument?.metadata?.composer || null,
      sourceKey: state.currentChartDocument?.metadata?.sourceKey || null,
      displayKey: state.currentViewModel?.metadata?.displayKey || null,
      timeSignature: state.currentViewModel?.metadata?.primaryTimeSignature || null,
      librarySource: state.currentLibrarySourceLabel,
      selectedId: dom.fixtureSelect?.value || null,
      transpose: Number(dom.transposeSelect?.value || 0)
    },
    renderOptions: {
      harmonyDisplayMode: normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value),
      chordSymbols: getChordSymbolRenderOptions(),
      textScaleCompensation: chartTextScaleCompensation
    },
    document: state.currentChartDocument,
    viewModel: state.currentViewModel,
    playbackDiagnostics: state.currentPlaybackPlan?.diagnostics || [],
    layout
  };
}

function resolveDebugBarTarget(
  layoutBars: any[],
  barOrRow?: number | { bar?: number, measure?: number, row?: number, line?: number, column?: number },
  column?: number
) {
  if (typeof barOrRow === 'object' && barOrRow) {
    const barIndex = Number(barOrRow.bar ?? barOrRow.measure);
    const rowIndex = Number(barOrRow.row ?? barOrRow.line);
    const columnIndex = Number(barOrRow.column ?? column);
    if (Number.isFinite(barIndex)) return layoutBars.find((bar) => Number(bar.barIndex) === barIndex) || null;
    if (Number.isFinite(rowIndex) && Number.isFinite(columnIndex)) {
      return layoutBars.find((bar) => Number(bar.rowIndex) === rowIndex && Number(bar.columnIndex) === columnIndex) || null;
    }
    return null;
  }

  if (Number.isFinite(Number(barOrRow)) && Number.isFinite(Number(column))) {
    return layoutBars.find((bar) => Number(bar.rowIndex) === Number(barOrRow) && Number(bar.columnIndex) === Number(column)) || null;
  }

  if (Number.isFinite(Number(barOrRow))) {
    return layoutBars.find((bar) => Number(bar.barIndex) === Number(barOrRow)) || null;
  }

  return null;
}

function inspectCurrentChartDebugBar(
  barOrRow?: number | { bar?: number, measure?: number, row?: number, line?: number, column?: number },
  column?: number
) {
  const snapshot = getCurrentChartDebugSnapshot() as { layout?: { bars?: any[] }, viewModel?: { bars?: any[] } };
  const layoutBars = snapshot.layout?.bars || [];
  const layoutBar = resolveDebugBarTarget(layoutBars, barOrRow, column);
  const documentBar = layoutBar
    ? (snapshot.viewModel?.bars || []).find((bar) => bar.id === layoutBar.barId || Number(bar.index) === Number(layoutBar.barIndex))
    : null;
  return {
    chart: (snapshot as any).chart,
    bar: documentBar,
    layout: layoutBar,
    nearby: layoutBar
      ? layoutBars.filter((bar) => bar.rowIndex === layoutBar.rowIndex)
      : []
  };
}

function refreshChartLayoutDebug() {
  applyOpticalPlacements();
  updateSheetGridGap();
}

function installChartDebugApi() {
  const logBar = (barOrRow, column) => {
    const result = inspectCurrentChartDebugBar(barOrRow, column) as { layout?: { tokens?: any[] } };
    console.log('[SharpEleven chart debug]', result);
    if (result.layout?.tokens) {
      console.table(result.layout.tokens.map((token) => ({
        slot: token.slotIndex,
        symbol: token.symbol,
        offsetPx: Number(token.offsetPx).toFixed(2),
        anchorDeltaPx: Number(token.anchorDeltaPx).toFixed(2),
        overlapNextPx: Number(token.overlapWithNextPx).toFixed(2),
        tokenScaleX: token.tokenScaleX,
        rootScaleX: token.rootScaleX
      })));
    }
    return result;
  };

  const layoutDebugApi = {
    getBypasses: () => getChartSheetRenderer().getLayoutDebugBypasses?.() || {},
    setBypasses: (nextBypasses: Record<string, boolean> = {}) => {
      const updated = getChartSheetRenderer().setLayoutDebugBypasses?.(nextBypasses) || {};
      refreshChartLayoutDebug();
      return updated;
    },
    clearBypasses: () => {
      const updated = getChartSheetRenderer().clearLayoutDebugBypasses?.() || {};
      refreshChartLayoutDebug();
      return updated;
    },
    refresh: refreshChartLayoutDebug,
    snapshot: getCurrentChartDebugSnapshot,
    inspectBar: inspectCurrentChartDebugBar,
    logBar
  };

  window.__sharpElevenChartLayoutDebug = layoutDebugApi;
  window.__sharpElevenChartDebug = {
    snapshot: getCurrentChartDebugSnapshot,
    inspectBar: inspectCurrentChartDebugBar,
    logBar,
    layout: () => window.__sharpElevenChartLayoutDebug
  };
}

function renderMeta(viewModel: ChartViewModel) {
  renderChartMeta(...Object.values(createChartMetaBindings({
    chartMeta: dom.chartMeta,
    viewModel
  })) as [Element | null, ChartViewModel]);
}

function renderChordMarkup(token: any, harmonyDisplayMode: string) {
  const root = token.root || '';
  const quality = getDisplayAliasQuality(token.quality || '', harmonyDisplayMode);
  const bass = token.bass || null;
  const options = getChordSymbolRenderOptions();

  return renderChordSymbolHtml(
    root,
    quality,
    bass,
    options
  );
}

function getChordSymbolRenderOptions() {
  return {
    useChordSymbolV2: false,
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
  const availableDocuments = getAvailableDocuments();
  const selectedId = dom.fixtureSelect?.value || availableDocuments[0]?.metadata?.id || '';
  const isNewChartSelection = state.currentChartDocument?.metadata?.id !== selectedId;
  populateTransposeOptions(availableDocuments.find((document) => document.metadata.id === selectedId));
  renderSelectedFixture(createChartFixtureRenderBindings({
    state,
    fixtureSelect: dom.fixtureSelect,
    transposeSelect: dom.transposeSelect,
    tempoInput: dom.tempoInput,
    getAvailableDocuments,
    resetTempo: isNewChartSelection,
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
      scheduleChartLayout({
        includeOpticalPlacement: true,
        reason: 'afterRenderSheet'
      });
    },
    renderDiagnostics,
    renderTransport: () => {
      if (dom.transportStatus) dom.transportStatus.textContent = 'Ready';
      syncTempoControls();
      renderTransport();
    },
    renderSelectionState,
    updateChartNavigationState
  }));
  if (dom.chartMetadataPopover && !dom.chartMetadataPopover.hidden) {
    void renderChartMetadataPopover();
  }
  if (!didOpenRequestedMetadataPanel && new URLSearchParams(window.location.search).get('metadata') === '1') {
    didOpenRequestedMetadataPanel = true;
    openOverlay();
    void renderChartMetadataPopover();
    dom.chartMetadataPopover?.removeAttribute('hidden');
    syncChartPopoverButtonStates();
  }
}

function getSelectedBarBounds(): DOMRect | null {
  const selectedBarIds = new Set(state.selectionController.getSelection().barIds);
  const selectedCells = Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-cell'))
    .filter((element) => selectedBarIds.has(element.dataset.barId || ''));
  if (selectedCells.length === 0) return null;

  const rects = selectedCells
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
  if (rects.length === 0) return null;

  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

function getVisibleOverlayRect(element: Element | null | undefined): DOMRect | null {
  if (!(element instanceof HTMLElement)) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const style = getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) <= 0.01) return null;
  return rect;
}

function getSelectionMenuVerticalBounds() {
  const viewport = window.visualViewport;
  const viewportHeight = viewport?.height || window.innerHeight || document.documentElement.clientHeight;
  const viewportTop = viewport?.offsetTop || 0;
  let top = viewportTop;
  let bottom = viewportTop + viewportHeight;

  if (dom.chartApp?.classList.contains('overlay-open')) {
    const topBarRect = getVisibleOverlayRect(dom.chartTopOverlay?.querySelector('.chart-top-bar') || dom.chartTopOverlay);
    const bottomOverlayRect = getVisibleOverlayRect(dom.chartBottomOverlay);
    if (topBarRect) {
      top = Math.max(top, topBarRect.bottom);
    }
    if (bottomOverlayRect) {
      bottom = Math.min(bottom, bottomOverlayRect.top);
    }
  }

  return { top, bottom };
}

function positionSelectionMenu() {
  if (!dom.selectionMenu || dom.selectionMenu.hidden) return;
  const selectionBounds = getSelectedBarBounds();
  if (!selectionBounds) return;

  const menuRect = dom.selectionMenu.getBoundingClientRect();
  const viewport = window.visualViewport;
  const viewportWidth = viewport?.width || window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = viewport?.height || window.innerHeight || document.documentElement.clientHeight;
  const viewportLeft = viewport?.offsetLeft || 0;
  const viewportTop = viewport?.offsetTop || 0;
  const margin = 8;
  const menuWidth = Math.max(menuRect.width, 1);
  const menuHeight = Math.max(menuRect.height, 1);
  const preferredLeft = selectionBounds.left + (selectionBounds.width / 2);
  const minLeft = viewportLeft + margin + (menuWidth / 2);
  const maxLeft = viewportLeft + viewportWidth - margin - (menuWidth / 2);
  const nextLeft = Math.max(minLeft, Math.min(maxLeft, preferredLeft));
  const verticalBounds = getSelectionMenuVerticalBounds();
  const topCandidate = selectionBounds.top - menuHeight - margin;
  const bottomCandidate = selectionBounds.bottom + margin;
  const topFits = topCandidate >= verticalBounds.top + margin;
  const bottomFits = bottomCandidate + menuHeight <= verticalBounds.bottom - margin;
  const availableAbove = selectionBounds.top - verticalBounds.top;
  const availableBelow = verticalBounds.bottom - selectionBounds.bottom;
  const nextTop = topFits && (!bottomFits || availableAbove >= availableBelow)
    ? topCandidate
    : Math.min(bottomCandidate, verticalBounds.bottom - menuHeight - margin);

  dom.selectionMenu.style.left = `${nextLeft}px`;
  dom.selectionMenu.style.top = `${Math.max(verticalBounds.top + margin, nextTop)}px`;
}

function createChartMetadataText(tagName: string, className: string, textContent: string): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = textContent;
  return element;
}

function createChartMetadataButton(label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chart-metadata-small-action';
  button.textContent = label;
  return button;
}

async function persistCurrentChartMetadataState(nextDocuments: ChartDocument[], nextSetlists: ChartSetlist[], message: string, preferredId: string | null = null) {
  const persistedLibrary = await persistChartLibrary({
    documents: nextDocuments,
    source: state.currentLibrarySourceLabel || 'imported library',
    mergeWithExisting: false
  });
  await persistSetlists(nextSetlists);
  if (persistedLibrary?.documents) {
    state.fixtureLibrary = {
      ...(state.fixtureLibrary || {}),
      documents: persistedLibrary.documents,
      source: persistedLibrary.source
    };
    state.filteredDocuments = filterChartDocuments(persistedLibrary.documents, state.currentSearch);
  } else {
    state.fixtureLibrary = {
      ...(state.fixtureLibrary || {}),
      documents: [],
      source: state.currentLibrarySourceLabel || 'imported library'
    };
    state.filteredDocuments = [];
  }
  if (dom.transportStatus) dom.transportStatus.textContent = message;
  renderChartSelector(preferredId);
  renderFixture();
}

async function renderChartMetadataPopover() {
  if (!dom.chartMetadataPopover) return;
  const renderId = ++chartMetadataPopoverRenderId;
  const chartDocument = state.currentChartDocument;
  dom.chartMetadataPopover.replaceChildren();
  if (!chartDocument) {
    dom.chartMetadataPopover.append(createChartMetadataText('p', 'chart-import-status', 'No chart loaded.'));
    return;
  }
  const allDocuments = state.fixtureLibrary?.documents || [chartDocument];
  const setlists = await loadPersistedSetlists();
  if (renderId !== chartMetadataPopoverRenderId) return;
  const chartId = chartDocument.metadata.id;
  const sources = getChartSourceRefs(chartDocument).map((ref) => ref.name);
  const memberships = getChartSetlistMembership(chartId, setlists);
  const facts = document.createElement('dl');
  facts.className = 'chart-metadata-facts';
  let setlistSummaryValue: HTMLElement | null = null;
  [
    ['Composer', chartDocument.metadata.composer || 'None'],
    ['Style', chartDocument.metadata.styleReference || chartDocument.metadata.style || 'None'],
    ['Sources', sources.join(', ') || 'User chart'],
    ['Setlists', memberships.map((setlist) => setlist.name).join(', ') || 'None']
  ].forEach(([label, value]) => {
    const valueElement = createChartMetadataText('dd', '', value);
    if (label === 'Setlists') setlistSummaryValue = valueElement;
    facts.append(createChartMetadataText('dt', '', label));
    facts.append(valueElement);
  });
  dom.chartMetadataPopover.append(createChartMetadataText('h3', '', chartDocument.metadata.title || 'Untitled chart'), facts);

  const newSetlistOptionValue = '__new_setlist__';
  const setlistSelect = document.createElement('select');
  setlists.forEach((setlist) => setlistSelect.append(new Option(setlist.name, setlist.id)));
  setlistSelect.append(new Option('New setlist', newSetlistOptionValue));
  const newSetlistInput = document.createElement('input');
  newSetlistInput.type = 'text';
  newSetlistInput.placeholder = 'New setlist';
  const addSetlistButton = createChartMetadataButton('Add to setlist');
  const showPendingSetlistMembership = (setlistName: string) => {
    if (!setlistSummaryValue) return;
    const names = new Set([
      ...memberships.map((setlist) => setlist.name),
      ...String(setlistSummaryValue.textContent || '').split(',').map((name) => name.trim()).filter((name) => name && name !== 'None'),
      setlistName
    ]);
    setlistSummaryValue.textContent = [...names].join(', ') || 'None';
  };
  const syncSetlistControls = () => {
    const isNewSetlist = setlistSelect.value === newSetlistOptionValue;
    newSetlistInput.hidden = !isNewSetlist;
    addSetlistButton.textContent = isNewSetlist ? 'Create and add' : 'Add to setlist';
  };
  const submitSetlistChange = async () => {
    const isNewSetlist = setlistSelect.value === newSetlistOptionValue;
    if (isNewSetlist) {
      const name = newSetlistInput.value.trim();
      if (!name) return;
      showPendingSetlistMembership(name);
      const result = applyPerChartMetadataUpdate({ documents: allDocuments, setlists, chartId, patch: { createSetlistName: name } });
      await persistCurrentChartMetadataState(result.documents, result.setlists, `Created "${name}".`);
      await renderChartMetadataPopover();
      return;
    }

    if (!setlistSelect.value) return;
    showPendingSetlistMembership(setlistSelect.selectedOptions[0]?.textContent || '');
    const result = applyPerChartMetadataUpdate({ documents: allDocuments, setlists, chartId, patch: { addSetlistIds: [setlistSelect.value] } });
    await persistCurrentChartMetadataState(result.documents, result.setlists, 'Updated setlist membership.');
    await renderChartMetadataPopover();
  };
  setlistSelect.addEventListener('change', syncSetlistControls);
  addSetlistButton.addEventListener('click', submitSetlistChange);
  newSetlistInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void submitSetlistChange();
  });
  syncSetlistControls();
  const setlistActionRow = document.createElement('div');
  setlistActionRow.className = 'chart-metadata-setlist-action-row';
  setlistActionRow.append(setlistSelect, addSetlistButton);
  dom.chartMetadataPopover.append(createChartMetadataText('h3', '', 'Setlists'), setlistActionRow, newSetlistInput);

  const deletePreview = previewProtectedChartDelete({ documents: allDocuments, setlists, chartIds: [chartId] });
  const deleteButton = createChartMetadataButton('Delete chart');
  deleteButton.addEventListener('click', async () => {
    const confirmed = window.confirm(`Delete "${chartDocument.metadata.title || 'chart'}"?\n\nThis will delete ${deletePreview.deletedChartCount} chart and remove ${deletePreview.setlistUsageCount} setlist entr${deletePreview.setlistUsageCount === 1 ? 'y' : 'ies'}.\n\nThis action cannot be undone.`);
    if (!confirmed) return;
    const result = applyBatchMetadataOperation({ documents: allDocuments, setlists, chartIds: [chartId], operation: { kind: 'delete' } });
    const deletedIds = (result.preview as { deletedChartIds?: string[] }).deletedChartIds || [chartId];
    const deletedIdSet = new Set(deletedIds);
    const currentIndex = allDocuments.findIndex((document) => document.metadata.id === chartId);
    const nextPreferredDocument = result.documents.slice(currentIndex).find((document) => !deletedIdSet.has(document.metadata.id))
      || result.documents.find((document) => !deletedIdSet.has(document.metadata.id))
      || null;
    removePersistedChartReferences(deletedIds);
    await persistCurrentChartMetadataState(result.documents, result.setlists, 'Chart deleted.', nextPreferredDocument?.metadata.id || null);
    dom.chartMetadataPopover?.setAttribute('hidden', '');
    syncChartPopoverButtonStates();
  });
  dom.chartMetadataPopover.append(deleteButton);
}

function closeAllPopovers() {
  closeAllChartPopovers((createChartPopoverBindings({
    popovers: [dom.manageChartsPopover, dom.instrumentSettingsPopover, dom.chartMetadataPopover]
  }) as { popovers: Array<HTMLElement | null> }).popovers);
  dom.instrumentSettingsButton?.setAttribute('aria-expanded', 'false');
  dom.chartMetadataButton?.setAttribute('aria-expanded', 'false');
  closeBottomPopovers();
  syncChartPopoverButtonStates();
}

function closeOpenPopovers() {
  const popovers = [dom.manageChartsPopover, dom.instrumentSettingsPopover, dom.chartMetadataPopover, dom.tempoPopover, dom.mixerPopover];
  const hasOpenPopover = popovers.some((popover) => popover && !popover.hidden);
  if (!hasOpenPopover) return false;
  closeAllPopovers();
  syncMobileOverlayDrawerLayout();
  return true;
}

function togglePopover(targetPopover: HTMLElement | null, otherPopover: HTMLElement | null) {
  closeBottomPopovers();
  const bindings = createChartPopoverBindings({
  targetPopover,
  popovers: [targetPopover, otherPopover, dom.instrumentSettingsPopover, dom.chartMetadataPopover]
  }) as { targetPopover: HTMLElement | null, popovers: Array<HTMLElement | null> };
  toggleChartPopover(bindings.targetPopover, bindings.popovers);
  syncChartPopoverButtonStates();
  syncMobileOverlayDrawerLayout();
}

function syncMobileOverlayDrawerLayout() {
  if (!dom.chartApp) return;
  const topHeight = Math.ceil(dom.chartTopOverlay?.querySelector('.chart-top-bar')?.getBoundingClientRect().height || 0);
  const bottomHeight = Math.ceil(dom.chartBottomOverlay?.getBoundingClientRect().height || 0);
  const pushY = topHeight > 0 ? topHeight + 10 : 0;

  if (
    topHeight === lastMobileOverlayTopHeight
    && bottomHeight === lastMobileOverlayBottomHeight
    && pushY === lastMobileOverlayPushY
  ) {
    return;
  }

  lastMobileOverlayTopHeight = topHeight;
  lastMobileOverlayBottomHeight = bottomHeight;
  lastMobileOverlayPushY = pushY;

  dom.chartApp.style.setProperty('--chart-mobile-top-overlay-height', `${topHeight}px`);
  dom.chartApp.style.setProperty('--chart-mobile-bottom-overlay-height', `${bottomHeight}px`);
  dom.chartApp.style.setProperty('--chart-overlay-push-y', `${pushY}px`);
}

function bindMobileOverlayDrawerLayout() {
  const syncMobileSafeLayout = () => {
    syncChartCutoutPadding();
    syncMobileOverlayDrawerLayout();
  };

  syncMobileSafeLayout();
  window.addEventListener('resize', syncMobileSafeLayout);
  window.addEventListener('orientationchange', syncMobileSafeLayout);
  window.visualViewport?.addEventListener('resize', syncMobileSafeLayout);

  if (typeof ResizeObserver === 'undefined') return;

  let overlayLayoutFrame = 0;
  const overlayLayoutObserver = new ResizeObserver(() => {
    if (overlayLayoutFrame) return;
    overlayLayoutFrame = window.requestAnimationFrame(() => {
      overlayLayoutFrame = 0;
      syncMobileSafeLayout();
    });
  });

  const topBar = dom.chartTopOverlay?.querySelector('.chart-top-bar');
  if (topBar) {
    overlayLayoutObserver.observe(topBar);
  }
  if (dom.chartBottomOverlay) {
    overlayLayoutObserver.observe(dom.chartBottomOverlay);
  }
}

function handleSyntheticAndroidBack() {
  const popovers = [dom.manageChartsPopover, dom.instrumentSettingsPopover, dom.chartMetadataPopover, dom.tempoPopover, dom.mixerPopover];
  const hasOpenPopover = popovers.some((popover) => popover && !popover.hidden);
  if (hasOpenPopover) {
    closeAllPopovers();
    syncMobileOverlayDrawerLayout();
    return true;
  }

  if (dom.chartApp?.classList.contains('overlay-open')) {
    closeOverlay();
    return true;
  }

  return false;
}

function bindDesktopAndroidBackShortcut() {
  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const isBrowserBackKey = event.key === 'BrowserBack';
    const isDesktopShortcut = event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key.toLowerCase() === 'b';
    if (!isBrowserBackKey && !isDesktopShortcut) return;
    event.preventDefault();
    handleSyntheticAndroidBack();
  });
}

function openOverlay() {
  syncMobileOverlayDrawerLayout();
  openChartOverlay(createChartOverlayShellBindings({
    chartApp: dom.chartApp,
    chartTopOverlay: dom.chartTopOverlay,
    chartBottomOverlay: dom.chartBottomOverlay
  }));
}

function closeOverlay() {
  closeBottomPopovers();
  closeChartOverlay(createChartOverlayShellBindings({
    chartApp: dom.chartApp,
    chartTopOverlay: dom.chartTopOverlay,
    chartBottomOverlay: dom.chartBottomOverlay,
    popovers: [dom.manageChartsPopover, dom.instrumentSettingsPopover, dom.chartMetadataPopover]
  }));
  dom.instrumentSettingsButton?.setAttribute('aria-expanded', 'false');
  dom.chartMetadataButton?.setAttribute('aria-expanded', 'false');
  syncChartPopoverButtonStates();
  syncMobileOverlayDrawerLayout();
}

function exportCurrentChartPdf() {
  const previousTitle = document.title;
  const chartTitle = state.currentViewModel?.metadata?.title
    || state.currentChartDocument?.metadata?.title
    || 'Chart';
  const restoreTitle = () => {
    document.title = previousTitle;
    window.removeEventListener('afterprint', restoreTitle);
  };

  closeOverlay();
  document.title = `${chartTitle} - SharpEleven`;
  window.addEventListener('afterprint', restoreTitle, { once: true });
  window.setTimeout(() => {
    window.print();
    window.setTimeout(restoreTitle, 1000);
  }, 0);
}

async function importDefaultFixtureLibrary() {
  const preferredId = loadPersistedChartId();
  const snapshotStartedAt = getChartRenderPerfNow();
  let fastChartDocument = loadPersistedChartDocument(preferredId);
  logChartRenderPerf('loadPersistedChartDocument', snapshotStartedAt, {
    requestedChartId: preferredId,
    chartId: fastChartDocument?.metadata?.id || '',
    bars: fastChartDocument?.bars?.length || 0
  });
  if (!fastChartDocument && preferredId) {
    const indexedDocumentStartedAt = getChartRenderPerfNow();
    fastChartDocument = await loadPersistedChartDocumentById(preferredId);
    logChartRenderPerf('loadPersistedChartDocumentById', indexedDocumentStartedAt, {
      requestedChartId: preferredId,
      chartId: fastChartDocument?.metadata?.id || '',
      bars: fastChartDocument?.bars?.length || 0
    });
  }

  if (fastChartDocument && !state.currentViewModel) {
    renderImportedLibrary({
      documents: [fastChartDocument],
      source: 'recent chart snapshot',
      preferredId: fastChartDocument.metadata.id,
      statusMessage: 'Loading chart library...',
      renderSelectedChart: true
    });
  }

  const cacheStartedAt = getChartRenderPerfNow();
  const persistedLibrary = await loadPersistedChartLibrary();
  logChartRenderPerf('loadPersistedChartLibrary', cacheStartedAt, {
    documents: persistedLibrary?.documents?.length || 0,
    source: persistedLibrary?.source || ''
  });

  if (persistedLibrary?.documents?.length) {
    const requestedSetlistId = getRequestedSetlistId();
    if (requestedSetlistId) {
      const setlists = await loadPersistedSetlists();
      const requestedSetlist = setlists.find((setlist) => setlist.id === requestedSetlistId);
      if (requestedSetlist) {
        const documentsById = new Map(persistedLibrary.documents.map((document) => [String(document.metadata?.id || ''), document]));
        const setlistDocuments = requestedSetlist.items
          .map((item) => documentsById.get(String(item.chartId || '')))
          .filter((document): document is ChartDocument => Boolean(document));
        if (setlistDocuments.length > 0) {
          const requestedChartId = getRequestedChartId();
          const preferredSetlistDocument = requestedChartId
            ? setlistDocuments.find((document) => document.metadata.id === requestedChartId)
            : null;
          renderImportedLibrary({
            documents: setlistDocuments,
            source: `setlist ${requestedSetlist.name}`,
            preferredId: (preferredSetlistDocument || setlistDocuments[0]).metadata.id,
            statusMessage: `Loaded setlist "${requestedSetlist.name}" (${setlistDocuments.length} charts). Use previous and next to move manually.`,
            renderSelectedChart: true
          });
          return;
        }
      }
    }

    const canKeepCurrentChart = Boolean(
      state.currentChartDocument?.metadata?.id
      && state.currentChartDocument.metadata.id === preferredId
    );
    renderImportedLibrary({
      documents: persistedLibrary.documents,
      source: persistedLibrary.source,
      preferredId,
      statusMessage: `Loaded ${persistedLibrary.documents.length} charts from the cached chart library.`,
      renderSelectedChart: !canKeepCurrentChart
    });
    void backfillChartDocumentIndexInBackground({
      documents: persistedLibrary.documents,
      source: persistedLibrary.source
    });
    return;
  }

  return importChartDefaultFixtureLibrary(createChartDefaultLibraryBindings({
    sourceUrl: IREAL_SOURCE_URL,
    rawText: defaultIRealSourceText,
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

async function importPendingMobileIRealLink() {
  const pendingResult = await consumePendingIRealLinkResult();
  const pendingIRealLink = pendingResult.url;

  if (!pendingIRealLink && pendingResult.hadPendingMarker) {
    setImportStatus(
      pendingResult.errorMessage
        ? `iReal link detected, but the captured text could not be loaded: ${pendingResult.errorMessage}`
        : 'iReal link detected, but the captured text could not be loaded. Open the forum charts and tap the link again.',
      true
    );
    return;
  }

  if (!pendingIRealLink) return;

  if (dom.irealLinkInput) {
    dom.irealLinkInput.value = pendingIRealLink;
  }
  setImportStatus('iReal link captured. Importing charts...');

  await handlePastedChartIRealLinkImport({
    rawText: pendingIRealLink,
    importContext: {
      origin: pendingResult.importOrigin || (pendingResult.hadPendingMarker ? 'unknown' : undefined),
      referrerUrl: pendingResult.referrerUrl
    },
    importDocumentsFromIRealText,
    applyImportedLibrary,
    setImportStatus
  });
}

async function bindIncomingMobileIRealImports() {
  if (!isNativePlatform()) return;
  let appPlugin = null;
  try {
    const capacitorAppModule = await import('@capacitor/app');
    appPlugin = capacitorAppModule?.App || null;
  } catch (_error) {
    appPlugin = window.Capacitor?.Plugins?.App || null;
  }
  if (!appPlugin?.addListener) return;

  const handleIncomingUrl = (url: string) => {
    if (!isIRealDeepLink(url)) return;
    storePendingIRealLink(url);
    setImportStatus('iReal link detected. Loading captured text...');
    void importPendingMobileIRealLink();
  };

  try {
    const launchUrl = await appPlugin.getLaunchUrl?.();
    handleIncomingUrl(String(launchUrl?.url || ''));
  } catch (_error) {
    // Keep the live listener active even if launch URL retrieval fails.
  }

  appPlugin.addListener('appUrlOpen', ({ url }: { url?: string }) => {
    handleIncomingUrl(String(url || ''));
  });
}

function bindImportControls() {
  applyImportModeVisibility();
  bindChartImportControls(createChartImportControlsBindings({
    importIRealBackupButton: dom.importIRealBackupButton,
    irealBackupInput: dom.irealBackupInput,
    openIRealForumButton: dom.openIRealForumButton,
    importIRealLinkButton: dom.importIRealLinkButton,
    irealLinkInput: dom.irealLinkInput,
    forumTracksUrl: IREAL_FORUM_TRACKS_URL,
    setImportStatus,
    onBackupFileSelection: handleBackupFileSelection,
    onPastedLinkImport: handlePastedIRealLinkImport,
    onOpenForumTracks: () => openIrealBrowser({
      url: IREAL_FORUM_TRACKS_URL,
      title: 'Click on a link to import'
    })
  }));
}

async function loadFixtures() {
  const requestedPlaylist = getRequestedPlaylist();
  if (requestedPlaylist && dom.chartSearchInput) {
    dom.chartSearchInput.value = requestedPlaylist;
  }

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
        useChordSymbolV2: dom.useChordSymbolV2,
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
        exportChartPdfButton: dom.exportChartPdfButton,
        onSearch: applySearchFilter,
        onFixtureChange: renderFixture,
        onTransposeChange: handleChartTransposeChange,
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
            await startPlayback({
              cancelSelectionLoop: !state.selectionLoopActive
            });
            closeOverlay();
          } catch (error) {
            if (dom.transportStatus) dom.transportStatus.textContent = `Playback error: ${getErrorMessage(error)}`;
            state.isPlaying = false;
            renderTransport();
          }
        },
        onStopClick: () => {
          stopPlayback({
            resetPosition: true,
            cancelSelectionLoop: !state.selectionLoopActive
          });
        },
        onClearSelection: () => {
          clearChartSelection();
        },
        onSendSelectionToPractice: navigateToPracticeWithSelection,
        onExportChartPdf: exportCurrentChartPdf,
        onBeforeUnload: () => {
          stopPlayback({ resetPosition: true });
        }
      })));
      dom.selectionLoopButton?.addEventListener('click', () => {
        void startSelectionLoop();
      });
      dom.selectionCreateDrillButton?.addEventListener('click', navigateToPracticeWithSelection);
      window.addEventListener('resize', positionSelectionMenu);
      window.visualViewport?.addEventListener('resize', positionSelectionMenu);
      window.visualViewport?.addEventListener('scroll', positionSelectionMenu);
      dom.sheetGrid?.addEventListener('scroll', positionSelectionMenu, { passive: true });
      bindBottomControlPopovers();
      createChartGestureController({
        sheetGrid: dom.sheetGrid,
        selectionController: state.selectionController,
        renderSelectionState,
        hasActiveSelection,
        canClearSelection: canClearChartSelection,
        clearSelection: clearChartSelection,
        openOverlay,
        closeOverlay,
        closeOpenPopovers,
        goToAdjacentChart: (direction) => chartNavigationController?.goToAdjacentChart(direction) ?? false
      }).bind();
    },
      bindOverlayControls: () => {
        bindMobileOverlayDrawerLayout();
        bindDesktopAndroidBackShortcut();
        const bindings = createChartOverlayControlsBindings({
          mobileMenuToggle: dom.mobileMenuToggle,
          mobileBackdrop: dom.mobileBackdrop,
        manageChartsButton: dom.manageChartsButton,
        onOpenOverlay: openOverlay,
        onCloseOverlay: closeOverlay,
        onManageChartsToggle: () => togglePopover(dom.manageChartsPopover as HTMLElement | null, null)
      }) as {
        mobileMenuToggle?: HTMLButtonElement | null,
        mobileBackdrop?: HTMLElement | null,
        manageChartsButton?: HTMLButtonElement | null,
        onOpenOverlay: () => void,
        onCloseOverlay: () => void,
        onManageChartsToggle: () => void
      };
      bindings.mobileMenuToggle?.addEventListener('click', bindings.onOpenOverlay);
      bindings.mobileBackdrop?.addEventListener('click', bindings.onCloseOverlay);
      bindings.manageChartsButton?.addEventListener('click', () => {
        bindings.onManageChartsToggle();
        syncChartPopoverButtonStates();
      });
      dom.chartMetadataButton?.addEventListener('click', () => {
        closeBottomPopovers();
        const wasOpen = Boolean(dom.chartMetadataPopover && !dom.chartMetadataPopover.hidden);
        closeAllChartPopovers([dom.manageChartsPopover, dom.instrumentSettingsPopover, dom.chartMetadataPopover]);
        if (!wasOpen) {
          void renderChartMetadataPopover();
          dom.chartMetadataPopover?.removeAttribute('hidden');
        }
        syncChartPopoverButtonStates();
        syncMobileOverlayDrawerLayout();
      });
      dom.instrumentSettingsButton?.addEventListener('click', () => {
        closeBottomPopovers();
        const wasOpen = Boolean(dom.instrumentSettingsPopover && !dom.instrumentSettingsPopover.hidden);
        closeAllChartPopovers([dom.manageChartsPopover, dom.instrumentSettingsPopover, dom.chartMetadataPopover]);
        if (!wasOpen) dom.instrumentSettingsPopover?.removeAttribute('hidden');
        syncChartPopoverButtonStates();
        syncMobileOverlayDrawerLayout();
      });
      dom.instrumentTransposeSelect?.addEventListener('change', () => {
        setInstrumentTransposition(dom.instrumentTransposeSelect?.value || '0', { render: true });
      });
    },
    bindLayoutObservers: () => {
      bindChartLayoutObservers(createChartLayoutObserversBindings({
        sheetGrid: dom.sheetGrid,
        updateSheetGridGap: () => scheduleChartLayout({ reason: 'layoutObserver' }),
        applyOpticalPlacements: () => scheduleChartLayout({
          includeOpticalPlacement: shouldRunObserverOpticalPlacement(),
          reason: 'viewportLayoutObserver'
        })
      }));
    },
    updateMixerOutputs,
    renderFixture: () => {
      if (!state.currentViewModel) {
        renderFixture();
      }
    },
    ensurePlaybackReady: async () => {
      getChartPlaybackController();
      await getChartPlaybackController().ensureReady();
    },
    syncPlaybackSettings,
    setTransportStatus: (message) => {
      if (dom.transportStatus) dom.transportStatus.textContent = message;
    }
  })));

  await bindIncomingMobileIRealImports();
  await importPendingMobileIRealLink();
}

applyChartDisplayCssVariables();
chartTextScaleCompensation = measureChartTextScaleCompensation();
installChartDebugApi();
bindChartButtonFeedback();

loadFixtures().catch((error) => {
  if (dom.transportStatus) {
    dom.transportStatus.textContent = `Failed to load charts: ${getErrorMessage(error)}`;
  }
});

