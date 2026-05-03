import type {
  ChartDocument,
  ChartPerformance,
  ChartPerformanceCue,
  ChartSimplePerformanceState,
  ChartSetlist,
  ChartUserSettings,
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
import { enforceBetaAccess } from '../src/features/app/app-beta-access.js';
import {
  createChartDocumentsFromIRealText,
  createDefaultChartPerformance,
  createChartPlaybackPlanFromDocument,
  createPlayFromBarPlaybackPlan,
  createPracticeSessionFromChartDocument,
  createPracticeSessionFromChartPlaybackPlan,
  createPracticeSessionFromChartSelection,
  getPlaybackStartChordIndexForBarId,
  markExecutedChartPerformanceCuesConsumed,
  normalizeChartPerformance,
  parseNoteSymbol,
  resolveChartPerformanceCueTargetBarIndexForSession,
  prepareArmedChartPerformanceCuesForPlayback,
  resetTransientChartPerformanceCueState,
  normalizeChartChordDisplayLevel,
  normalizeChordEnrichmentMode,
  normalizeChartSimplePerformanceState,
  resolveChartPerformanceRepeatState,
  restoreAppliedChartPerformanceCues,
  restoreConsumedChartPerformanceCues,
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
import { readChartLibrarySubsetSession } from '../src/features/chart/chart-library-subset-session.js';
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
  createMobileBackNavigationController,
  navigateBackWithFallback
} from '../src/features/app/app-mobile-back-navigation.js';
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
  loadChartUserSettings,
  loadPersistedChartId,
  loadPersistedInstrumentTransposition,
  loadPersistedPlaybackSettings,
  persistChartId as persistChartScreenId,
  persistChartUserSettings,
  persistInstrumentTransposition as persistChartInstrumentTransposition,
  persistPlaybackSettings as persistChartScreenPlaybackSettings,
  resetChartUserSettings,
  replaceCurrentChartIdInUrl
} from '../src/features/chart/chart-screen-persistence.js';
import { renderChordSymbolHtml } from '../src/core/music/chord-symbol-display.js';
import voicingConfig from '../src/core/music/voicing-config.js';
import { CHART_DISPLAY_CONFIG } from '../src/config/trainer-config.js';

const DEFAULT_TEMPO = 120;
const DEFAULT_CHART_REPEAT_COUNT = 1;
const CHART_REPEAT_INFINITE_LABEL = '\u221e';
const PLAYBACK_STATE_POLL_INTERVAL_MS = 120;
const IREAL_SOURCE_URL = 'default-library.dat';
const IREAL_DEFAULT_PLAYLISTS_URL = 'https://www.irealpro.com/main-playlists/';
const IREAL_FORUM_TRACKS_URL = 'https://forums.irealpro.com/#songs.3';
const HARMONY_DISPLAY_MODE_LIGHT = 'light';
const HARMONY_DISPLAY_MODE_RICH = 'rich';
const CHART_PLAYBACK_BRIDGE_MODE = 'direct';
const DEFAULT_MASTER_VOLUME_PERCENT = 50;
const DEFAULT_CHANNEL_VOLUME_PERCENT = 100;
const DEFAULT_COMPING_STYLE = 'piano';
const DEFAULT_BAR_GROUP_SIZE = CHART_DISPLAY_CONFIG.layout.barsPerRow;
const CHART_RENDER_PERF_LOG_PREFIX = '[SharpEleven chart perf]';
const CHART_RENDER_PERF_STORAGE_KEY = 'sharp-eleven-chart-render-perf';
const PERFORMANCE_CUE_POINTER_CLICK_SUPPRESS_MS = 450;
const CHART_MAJOR_KEY_TILES = Object.freeze([
  { label: 'C', semitone: 0 },
  { label: 'Db', semitone: 1 },
  { label: 'D', semitone: 2 },
  { label: 'Eb', semitone: 3 },
  { label: 'E', semitone: 4 },
  { label: 'F', semitone: 5 },
  { label: 'Gb', semitone: 6 },
  { label: 'G', semitone: 7 },
  { label: 'Ab', semitone: 8 },
  { label: 'A', semitone: 9 },
  { label: 'Bb', semitone: 10 },
  { label: 'B', semitone: 11 }
]);
const CHART_MINOR_KEY_TILES = Object.freeze([
  { label: 'Cm', semitone: 0 },
  { label: 'C#m', semitone: 1 },
  { label: 'Dm', semitone: 2 },
  { label: 'Ebm', semitone: 3 },
  { label: 'Em', semitone: 4 },
  { label: 'Fm', semitone: 5 },
  { label: 'F#m', semitone: 6 },
  { label: 'Gm', semitone: 7 },
  { label: 'Abm', semitone: 8 },
  { label: 'Am', semitone: 9 },
  { label: 'Bbm', semitone: 10 },
  { label: 'Bm', semitone: 11 }
]);

const {
  DEFAULT_DISPLAY_QUALITY_ALIASES = {},
  RICH_DISPLAY_QUALITY_ALIASES = {}
} = voicingConfig;

initializeSharpElevenTheme();

await enforceBetaAccess();

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
  selectionLoopRestartPending: boolean,
  chartSimplePerformance: ChartSimplePerformanceState,
  chartPerformance: ChartPerformance | null,
  chartPerformances: Record<string, ChartPerformance>,
  currentChartUserSettings: ChartUserSettings | null,
  playFromBarPracticeSession: PracticeSessionSpec | null
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
  selectionLoopRestartPending: false,
  chartSimplePerformance: { mode: 'infinite', repeatMode: 'infinite' },
  chartPerformance: null,
  chartPerformances: {},
  currentChartUserSettings: null,
  playFromBarPracticeSession: null
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
let chartUserSettingsRenderToken = 0;
let suppressChartUserSettingsPersistence = false;
const CHART_ACTION_FEEDBACK_CLASS = 'is-chart-action-feedback';
const CHART_ACTION_FEEDBACK_DURATION_MS = 520;
const CHART_ACTION_POINTER_CLICK_SUPPRESS_MS = 700;
const CHART_PERFORMANCE_CUE_TYPES = Object.freeze({
  armCoda: 'arm_coda',
  exitRepeat: 'exit_repeat',
  playbackFeelToggle: 'playback_feel_toggle',
  legacyBassFeelToggle: 'bass_feel_toggle',
  modulate: 'modulate'
});
const CHART_PERFORMANCE_CUE_BOUNDARIES = Object.freeze({
  nextBar: 'next_bar',
  nextCodaJump: 'next_coda_jump',
  nextRepeatBoundary: 'next_repeat_boundary',
  nextSection: 'next_section'
});
const CHART_PERFORMANCE_MODULATE_MIN = -12;
const CHART_PERFORMANCE_MODULATE_MAX = 12;
const chartActionFeedbackTimers = new WeakMap<HTMLButtonElement, number>();
const chartActionFeedbackPointerTimes = new WeakMap<HTMLButtonElement, number>();
let chartPlaybackFeelMode: 'four' | 'two' = 'four';

function getOppositePlaybackFeelMode(mode: unknown): 'four' | 'two' {
  return mode === 'two' ? 'four' : 'two';
}

function normalizePlaybackFeelMode(value: unknown): 'four' | 'two' {
  return value === 'four' ? 'four' : 'two';
}

function normalizePlaybackFeelCueBoundary(value: unknown) {
  return value === CHART_PERFORMANCE_CUE_BOUNDARIES.nextSection
    ? CHART_PERFORMANCE_CUE_BOUNDARIES.nextSection
    : CHART_PERFORMANCE_CUE_BOUNDARIES.nextBar;
}

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
  syncTransposeTileSelection();
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
  dom.repeatCountButton?.setAttribute('aria-expanded', dom.repeatCountPopover && !dom.repeatCountPopover.hidden ? 'true' : 'false');
  dom.keyButton?.setAttribute('aria-expanded', dom.keyPopover && !dom.keyPopover.hidden ? 'true' : 'false');
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
  dom.chartApp?.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('button');
    if (!(button instanceof HTMLButtonElement) || !dom.chartApp?.contains(button)) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (shouldFlashChartActionFeedback(button)) {
      chartActionFeedbackPointerTimes.set(button, window.performance.now());
      flashChartActionFeedback(button);
    }
  }, true);

  dom.chartApp?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('button');
    if (!(button instanceof HTMLButtonElement) || !dom.chartApp?.contains(button)) return;
    const lastPointerFeedbackTime = chartActionFeedbackPointerTimes.get(button) || 0;
    if (lastPointerFeedbackTime && window.performance.now() - lastPointerFeedbackTime < CHART_ACTION_POINTER_CLICK_SUPPRESS_MS) return;
    if (shouldFlashChartActionFeedback(button)) {
      flashChartActionFeedback(button);
    }
  }, true);
}

function persistPlaybackSettings() {
  persistChartScreenPlaybackSettings({
    playbackSettings: getPlaybackSettings(),
    harmonyDisplayMode: normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value),
    chordEnrichmentMode: normalizeChordEnrichmentMode(dom.chordEnrichmentMode?.value),
    useChordSymbolV2: false,
    useMajorTriangleSymbol: dom.useMajorTriangleSymbol?.checked !== false,
    useHalfDiminishedSymbol: dom.useHalfDiminishedSymbol?.checked !== false,
    useDiminishedSymbol: dom.useDiminishedSymbol?.checked !== false
  });
  persistCurrentChartUserSettings();
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

  if (dom.chordEnrichmentMode && persisted.chordEnrichmentMode) {
    dom.chordEnrichmentMode.value = normalizeChordEnrichmentMode(persisted.chordEnrichmentMode);
  }

  syncChordDisplayHelp();

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

  if (persisted.chartSimplePerformance !== undefined) {
    state.chartSimplePerformance = { mode: 'infinite', repeatMode: 'infinite' };
  } else if (persisted.chartRepeatInfinite !== undefined) {
    state.chartSimplePerformance = { mode: 'infinite', repeatMode: 'infinite' };
  }
  syncRepeatCountControls();
}

function normalizeHarmonyDisplayMode(mode: string | undefined) {
  const normalized = String(mode || '');
  if (normalized === 'default') return HARMONY_DISPLAY_MODE_LIGHT;
  return normalizeChartChordDisplayLevel(normalized);
}

function getChordDisplayHelpText(displayMode: string) {
  const normalizedMode = normalizeHarmonyDisplayMode(displayMode);
  if (normalizedMode === HARMONY_DISPLAY_MODE_LIGHT) {
    return 'Shows a lighter version, making the grid visually clearer.';
  }
  if (normalizedMode === HARMONY_DISPLAY_MODE_RICH) {
    return 'Shows the chords as rendered by playback after chord enrichment.';
  }
  return 'Shows the chords as initially entered.';
}

function syncChordDisplayHelp() {
  if (!dom.chordDisplayHelp) return;
  dom.chordDisplayHelp.textContent = getChordDisplayHelpText(dom.harmonyDisplayMode?.value || '');
}

function getDisplayAliasQuality(quality: string, displayMode: string) {
  if (!quality) return quality;
  if (displayMode === HARMONY_DISPLAY_MODE_RICH) {
    return RICH_DISPLAY_QUALITY_ALIASES[quality] || quality;
  }
  if (displayMode === HARMONY_DISPLAY_MODE_LIGHT) {
    return DEFAULT_DISPLAY_QUALITY_ALIASES[quality] || quality;
  }
  return quality;
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
  const chartRepeatInfinite = isChartRepeatInfinite();
  return {
    transposition: getChartTransposeSemitones(),
    chartRepeatCount: getChartRepeatCount(),
    chartRepeatInfinite,
    repetitionsPerKey: 1,
    finitePlayback: state.selectionLoopActive ? false : !chartRepeatInfinite,
    compingStyle: dom.compingStyleSelect?.value,
    drumsMode: dom.drumsSelect?.value,
    customMediumSwingBass: dom.walkingBassToggle?.checked,
    masterVolume: Number(dom.masterVolume?.value || DEFAULT_MASTER_VOLUME_PERCENT),
    bassVolume: Number(dom.bassVolume?.value || DEFAULT_CHANNEL_VOLUME_PERCENT),
    stringsVolume: Number(dom.stringsVolume?.value || DEFAULT_CHANNEL_VOLUME_PERCENT),
    drumsVolume: Number(dom.drumsVolume?.value || DEFAULT_CHANNEL_VOLUME_PERCENT)
  };
}

function getCurrentChartId() {
  return String(state.currentChartDocument?.metadata?.id || '').trim();
}

function buildCurrentChartUserSettingsPatch(): Partial<ChartUserSettings> {
  return {
    tempo: getTempo(),
    transposition: getChartTransposeSemitones(),
    playbackSettings: getPlaybackSettings(),
    chartSimplePerformance: state.chartSimplePerformance,
    chartPerformance: resetTransientChartPerformanceCueState(getCurrentChartPerformance())
  };
}

function persistCurrentChartUserSettings(patch: Partial<ChartUserSettings> = {}) {
  if (suppressChartUserSettingsPersistence) return;
  const chartId = getCurrentChartId();
  if (!chartId) return;
  const nextPatch = {
    ...buildCurrentChartUserSettingsPatch(),
    ...(patch || {})
  };
  void persistChartUserSettings(chartId, nextPatch).then((settings) => {
    if (settings && getCurrentChartId() === chartId) {
      state.currentChartUserSettings = settings;
    }
  }).catch((error) => {
    if (dom.transportStatus) {
      dom.transportStatus.textContent = `Chart settings error: ${getErrorMessage(error)}`;
    }
  });
}

function applyChartUserPlaybackSettings(settings: ChartUserSettings | null) {
  const playbackSettings = settings?.playbackSettings;
  if (!playbackSettings || typeof playbackSettings !== 'object') return;

  if (playbackSettings.compingStyle && dom.compingStyleSelect && Array.from(dom.compingStyleSelect.options).some((option) => option.value === playbackSettings.compingStyle)) {
    dom.compingStyleSelect.value = String(playbackSettings.compingStyle);
  }
  if (playbackSettings.drumsMode && dom.drumsSelect && Array.from(dom.drumsSelect.options).some((option) => option.value === playbackSettings.drumsMode)) {
    dom.drumsSelect.value = String(playbackSettings.drumsMode);
  }
  if (playbackSettings.customMediumSwingBass !== undefined && dom.walkingBassToggle) {
    dom.walkingBassToggle.checked = Boolean(playbackSettings.customMediumSwingBass);
  }
  if (playbackSettings.masterVolume !== undefined && dom.masterVolume) {
    dom.masterVolume.value = String(playbackSettings.masterVolume);
  }
  if (playbackSettings.bassVolume !== undefined && dom.bassVolume) {
    dom.bassVolume.value = String(playbackSettings.bassVolume);
  }
  if (playbackSettings.stringsVolume !== undefined && dom.stringsVolume) {
    dom.stringsVolume.value = String(playbackSettings.stringsVolume);
  }
  if (playbackSettings.drumsVolume !== undefined && dom.drumsVolume) {
    dom.drumsVolume.value = String(playbackSettings.drumsVolume);
  }
  updateMixerOutputs();
}

function applyChartUserSettingsToControls(
  chartDocument: ChartDocument,
  settings: ChartUserSettings | null,
  { resetTempo = false }: { resetTempo?: boolean } = {}
) {
  suppressChartUserSettingsPersistence = true;
  try {
    applyChartUserPlaybackSettings(settings);
    if (settings?.chartSimplePerformance) {
      state.chartSimplePerformance = normalizeChartSimplePerformanceState(settings.chartSimplePerformance);
    } else {
      state.chartSimplePerformance = { mode: 'infinite', repeatMode: 'infinite' };
    }

    const normalizedPerformance = resetTransientChartPerformanceCueState(
      normalizeChartPerformance(settings?.chartPerformance, chartDocument)
    );
    state.chartPerformance = normalizedPerformance;
    if (normalizedPerformance) {
      state.chartPerformances[chartDocument.metadata?.id || normalizedPerformance.chartId] = normalizedPerformance;
    } else {
      delete state.chartPerformances[chartDocument.metadata?.id || ''];
    }

    if (dom.transposeSelect && settings?.transposition !== undefined && settings.transposition !== null) {
      const transposition = String(settings.transposition);
      if (Array.from(dom.transposeSelect.options).some((option) => option.value === transposition)) {
        dom.transposeSelect.value = transposition;
      }
    } else if (dom.transposeSelect && resetTempo) {
      dom.transposeSelect.value = '0';
    }
    syncTransposeTileSelection();

    if (resetTempo) {
      syncTempoControls(settings?.tempo ?? chartDocument.metadata.tempo ?? DEFAULT_TEMPO);
    }
    syncRepeatCountControls();
  } finally {
    suppressChartUserSettingsPersistence = false;
  }
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

function getTransposeSourceInfo(chartDocument: ChartDocument | null | undefined = state.currentChartDocument) {
  const sourceKey = getTransposeSourceKey(chartDocument);
  const match = sourceKey.match(/^([A-G](?:b|#)?)([-m]?)$/);
  const tonic = match?.[1] || 'C';
  const parsed = parseNoteSymbol(tonic);
  return {
    sourceKey,
    sourceSemitone: parsed?.semitone ?? 0,
    isMinor: match?.[2] === '-' || match?.[2] === 'm'
  };
}

function normalizeTransposeOffset(value: number) {
  return ((value % 12) + 12) % 12;
}

function getTransposeOffsetForTarget(targetSemitone: number, chartDocument: ChartDocument | null | undefined = state.currentChartDocument) {
  const { sourceSemitone } = getTransposeSourceInfo(chartDocument);
  return normalizeTransposeOffset(targetSemitone - sourceSemitone);
}

function getTransposeTargetSemitone(chartDocument: ChartDocument | null | undefined = state.currentChartDocument) {
  const { sourceSemitone } = getTransposeSourceInfo(chartDocument);
  return normalizeTransposeOffset(sourceSemitone + getChartTransposeSemitones());
}

function getTransposeButtonLabel(chartDocument: ChartDocument | null | undefined = state.currentChartDocument) {
  const targetSemitone = getTransposeTargetSemitone(chartDocument);
  const tiles = getTransposeSourceInfo(chartDocument).isMinor ? CHART_MINOR_KEY_TILES : CHART_MAJOR_KEY_TILES;
  return tiles.find((tile) => tile.semitone === targetSemitone)?.label || 'C';
}

function syncTransposeTileSelection() {
  const selectedOffset = getChartTransposeSemitones();
  const buttonLabel = getTransposeButtonLabel();
  const selectedMode = getTransposeSourceInfo().isMinor ? 'minor' : 'major';
  if (dom.keyButtonLabel) dom.keyButtonLabel.textContent = buttonLabel;
  if (dom.majorKeySection) dom.majorKeySection.hidden = selectedMode !== 'major';
  if (dom.minorKeySection) dom.minorKeySection.hidden = selectedMode !== 'minor';

  [dom.majorKeyGrid, dom.minorKeyGrid].forEach((grid) => {
    grid?.querySelectorAll<HTMLButtonElement>('.chart-key-tile').forEach((tile) => {
      const isSelected = tile.dataset.offset === String(selectedOffset) && tile.dataset.mode === selectedMode;
      tile.classList.toggle('is-selected', isSelected);
      tile.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  });
}

function renderTransposeTileGrid(grid: HTMLElement | null, tiles: readonly { label: string, semitone: number }[], mode: 'major' | 'minor') {
  if (!grid) return;
  grid.innerHTML = '';
  tiles.forEach((tile) => {
    const button = document.createElement('button');
    const offset = getTransposeOffsetForTarget(tile.semitone);
    button.type = 'button';
    button.className = 'chart-key-tile';
    button.dataset.offset = String(offset);
    button.dataset.mode = mode;
    button.textContent = tile.label;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      if (dom.transposeSelect) dom.transposeSelect.value = String(offset);
      handleChartTransposeChange();
      if (dom.keyPopover) dom.keyPopover.hidden = true;
      dom.keyButton?.setAttribute('aria-expanded', 'false');
      syncTransposeTileSelection();
      syncMobileOverlayDrawerLayout();
    });
    grid.appendChild(button);
  });
}

function renderTransposeTiles() {
  renderTransposeTileGrid(dom.majorKeyGrid, CHART_MAJOR_KEY_TILES, 'major');
  renderTransposeTileGrid(dom.minorKeyGrid, CHART_MINOR_KEY_TILES, 'minor');
  syncTransposeTileSelection();
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
  renderTransposeTiles();
}

function handleChartTransposeChange() {
  const value = String(dom.transposeSelect?.value || '0');
  if (dom.instrumentTransposeSelect && Array.from(dom.instrumentTransposeSelect.options).some((option) => option.value === value)) {
    dom.instrumentTransposeSelect.value = value;
    persistInstrumentTransposition();
  }
  syncTransposeTileSelection();
  persistCurrentChartUserSettings({ transposition: getChartTransposeSemitones() });
  renderFixture();
}

function getSelectedPracticeSession(): PracticeSessionSpec | null {
  if (state.playFromBarPracticeSession) {
    return state.playFromBarPracticeSession;
  }
  return getSelectedPracticeSessionFromState(state);
}

function hasActiveSelection() {
  return state.selectionController.getSelection().barIds.length > 0;
}

function canModifyChartSelection() {
  return !state.isPlaying && !state.isPaused && !state.selectionLoopPlaybackPending;
}

function canClearChartSelection() {
  return canModifyChartSelection();
}

function setSelectionLoopActive(active: boolean) {
  state.selectionLoopActive = Boolean(active);
  if (!state.selectionLoopActive) {
    state.selectionLoopPlaybackPending = false;
    state.selectionLoopRestartPending = false;
  }
}

function clearPlayFromBarSession() {
  state.playFromBarPracticeSession = null;
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
  persistCurrentChartUserSettings({ tempo: nextTempo });
  rebuildCurrentPlaybackSessionForPerformanceCues({ allowDuringPlayback: true });
  renderSelectionState();
  renderTransport();
  if (syncPlayback) {
    void syncPlaybackSettings().catch((error) => {
      if (dom.transportStatus) dom.transportStatus.textContent = `Playback settings error: ${getErrorMessage(error)}`;
    });
  }
}

function normalizeChartRepeatCount(value: unknown, fallback = DEFAULT_CHART_REPEAT_COUNT) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(15, Math.round(parsed))) : fallback;
}

function getCurrentChartPerformance() {
  const activeChartId = String(state.currentChartDocument?.metadata?.id || '');
  const currentPerformance = activeChartId
    ? state.chartPerformances[activeChartId] || state.chartPerformance
    : state.chartPerformance;
  if (!currentPerformance) return null;
  if (activeChartId && currentPerformance.chartId !== activeChartId) return null;
  return currentPerformance;
}

function getChartPerformanceForDocument(chartDocument: ChartDocument | null | undefined) {
  const chartId = String(chartDocument?.metadata?.id || '');
  if (!chartId) return null;
  const storedPerformance = state.chartPerformances[chartId];
  if (storedPerformance?.chartId === chartId) return storedPerformance;
  if (state.chartPerformance?.chartId === chartId) return state.chartPerformance;
  return resetTransientChartPerformanceCueState(
    normalizeChartPerformance(state.currentChartUserSettings?.chartPerformance, chartDocument || null)
  );
}

function hasCodaPerformanceCue(chartDocument: ChartDocument | null | undefined = state.currentChartDocument) {
  const performance = getChartPerformanceForDocument(chartDocument);
  return (performance?.cues || []).some((cue) => cue.type === CHART_PERFORMANCE_CUE_TYPES.armCoda);
}

function hasLastChorusPerformanceCue(performance: ChartPerformance | null | undefined = getCurrentChartPerformance()) {
  return (performance?.cues || []).some((cue) => cue.type === CHART_PERFORMANCE_CUE_TYPES.armCoda);
}

function createCurrentPlaybackPlanOptions(chartDocument: ChartDocument | null | undefined = state.currentChartDocument) {
  return {
    tempo: getTempo(),
    repeatCount: getChartRepeatPlanCount(),
    deferCodaJumpsUntilCue: hasCodaPerformanceCue(chartDocument)
  };
}

function rebuildCurrentPlaybackSessionForPerformanceCues(
  { allowDuringPlayback = false }: { allowDuringPlayback?: boolean } = {}
) {
  const chartDocument = state.currentChartDocument;
  if (!chartDocument || (!allowDuringPlayback && (state.isPlaying || state.isPaused))) return;
  const playbackPlan = createChartPlaybackPlanFromDocument(
    chartDocument,
    createCurrentPlaybackPlanOptions(chartDocument)
  ) as ChartPlaybackPlan;
  state.currentPlaybackPlan = playbackPlan;
  state.currentPracticeSession = createPracticeSessionFromChartDocument(chartDocument, {
    playbackPlan,
    tempo: getTempo(),
    transposition: getChartTransposeSemitones()
  });
  renderDiagnostics(playbackPlan);
  renderTransport();
}

function ensureCurrentChartPerformance() {
  const selectedDocument = state.currentChartDocument;
  if (!selectedDocument) return null;
  const currentPerformance = getCurrentChartPerformance() || createDefaultChartPerformance(selectedDocument, {
    repeatMode: isChartRepeatInfinite() ? 'infinite' : 'finite',
    repeatCount: getChartRepeatCount()
  });
  state.chartPerformance = currentPerformance;
  state.chartPerformances[selectedDocument.metadata?.id || currentPerformance.chartId] = currentPerformance;
  return currentPerformance;
}

function createChartPerformanceCueId(type: string) {
  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `chart-cue-${type}-${suffix}`;
}

function getChartPerformanceCueLabel(cue: ChartPerformanceCue | null | undefined) {
  if (!cue) return '';
  if (cue.type === CHART_PERFORMANCE_CUE_TYPES.armCoda) return 'last chorus';
  if (cue.type === CHART_PERFORMANCE_CUE_TYPES.exitRepeat) return 'exit vamp';
  if (isPlaybackFeelToggleCue(cue)) {
    const feelLabel = normalizePlaybackFeelMode(cue.playbackFeel || cue.bassFeel) === 'two'
      ? 'two-feel'
      : 'four-feel';
    const boundaryLabel = cue.boundary === CHART_PERFORMANCE_CUE_BOUNDARIES.nextSection ? 'section' : 'bar';
    return `${feelLabel} (${boundaryLabel})`;
  }
  if (cue.type === CHART_PERFORMANCE_CUE_TYPES.modulate) {
    const semitones = Number(cue.semitones || 0);
    const signed = semitones > 0 ? `+${semitones}` : String(semitones);
    return `mod ${signed}`;
  }
  return String(cue.type || 'cue').replace(/_/g, ' ');
}

function isPlaybackFeelToggleCue(cue: ChartPerformanceCue | null | undefined) {
  return cue?.type === CHART_PERFORMANCE_CUE_TYPES.playbackFeelToggle
    || cue?.type === CHART_PERFORMANCE_CUE_TYPES.legacyBassFeelToggle;
}

function hasPlaybackFeelPerformanceCueForBoundary(
  performance: ChartPerformance | null | undefined,
  boundary: unknown
) {
  const normalizedBoundary = normalizePlaybackFeelCueBoundary(boundary);
  return Boolean((performance?.cues || []).some((cue) => {
    return isPlaybackFeelToggleCue(cue) && normalizePlaybackFeelCueBoundary(cue.boundary) === normalizedBoundary;
  }));
}

function syncPerformanceFeelBoundaryToggle(value: unknown = dom.performanceFeelBoundaryInput?.value) {
  const boundary = normalizePlaybackFeelCueBoundary(value);
  if (dom.performanceFeelBoundaryInput) {
    dom.performanceFeelBoundaryInput.value = boundary;
  }
  document.querySelectorAll<HTMLButtonElement>('[data-chart-performance-feel-boundary]').forEach((button) => {
    const isSelected = button.dataset.chartPerformanceFeelBoundary === boundary;
    button.classList.toggle('is-selected', isSelected);
    button.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  });
  document
    .querySelector<HTMLElement>('.chart-performance-feel-boundary-toggle')
    ?.classList.toggle('is-section-selected', boundary === CHART_PERFORMANCE_CUE_BOUNDARIES.nextSection);
}

function getChartPerformanceCueBoundary(type: string) {
  if (type === CHART_PERFORMANCE_CUE_TYPES.armCoda) return CHART_PERFORMANCE_CUE_BOUNDARIES.nextCodaJump;
  if (type === CHART_PERFORMANCE_CUE_TYPES.exitRepeat) return CHART_PERFORMANCE_CUE_BOUNDARIES.nextRepeatBoundary;
  if (type === CHART_PERFORMANCE_CUE_TYPES.playbackFeelToggle) {
    return normalizePlaybackFeelCueBoundary(dom.performanceFeelBoundaryInput?.value);
  }
  return CHART_PERFORMANCE_CUE_BOUNDARIES.nextSection;
}

function normalizeModulateSemitones(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(CHART_PERFORMANCE_MODULATE_MIN, Math.min(CHART_PERFORMANCE_MODULATE_MAX, Math.round(parsed)));
}

function updateCurrentChartPerformance(
  nextPerformance: ChartPerformance | null,
  { persist = true }: { persist?: boolean } = {}
) {
  const selectedDocument = state.currentChartDocument;
  if (!selectedDocument || !nextPerformance) return;
  state.chartPerformance = nextPerformance;
  state.chartPerformances[selectedDocument.metadata?.id || nextPerformance.chartId] = nextPerformance;
  state.chartSimplePerformance = {
    mode: nextPerformance.repeatMode === 'finite' ? 'once' : 'infinite',
    repeatMode: nextPerformance.repeatMode
  };
  syncRepeatCountControls();
  renderPerformanceCueBar();
  rebuildCurrentPlaybackSessionForPerformanceCues();
  if (persist) {
    persistCurrentChartUserSettings({
      chartSimplePerformance: state.chartSimplePerformance,
      chartPerformance: resetTransientChartPerformanceCueState(nextPerformance)
    });
  }
}

function syncCurrentPlaybackFeelCuesForMode(
  currentMode: 'four' | 'two' = chartPlaybackFeelMode,
  { persist = false }: { persist?: boolean } = {}
) {
  const selectedDocument = state.currentChartDocument;
  const currentPerformance = getCurrentChartPerformance();
  if (!selectedDocument || !currentPerformance?.cues?.length) return;
  const result = syncPlaybackFeelPerformanceCuesForMode(currentPerformance.cues, currentMode);
  if (!result.changed) return;
  updateCurrentChartPerformance(createDefaultChartPerformance(selectedDocument, {
    ...currentPerformance,
    cues: result.cues,
    updatedAt: new Date().toISOString()
  }), {
    persist
  });
}

function createPerformanceCue(type: string, boundary: string = getChartPerformanceCueBoundary(type)): ChartPerformanceCue {
  const cue: ChartPerformanceCue = {
    id: createChartPerformanceCueId(type),
    type,
    boundary,
    status: 'idle',
    createdAt: new Date().toISOString()
  };
  if (type === CHART_PERFORMANCE_CUE_TYPES.modulate) {
    cue.semitones = normalizeModulateSemitones(dom.performanceModulateInput?.value);
  }
  if (type === CHART_PERFORMANCE_CUE_TYPES.playbackFeelToggle) {
    cue.boundary = normalizePlaybackFeelCueBoundary(cue.boundary);
    cue.playbackFeel = getOppositePlaybackFeelMode(chartPlaybackFeelMode);
  }
  return cue;
}

function hasSupportedVampCueTarget() {
  const repeatRegions = state.currentPracticeSession?.playback?.performanceMap?.repeatRegions || [];
  return repeatRegions.some((region) => region?.isVamp === true);
}

function getActiveVampRepeatRegion(currentBarIndex = getCurrentPlaybackBarIndex()) {
  const repeatRegions = state.currentPracticeSession?.playback?.performanceMap?.repeatRegions || [];
  return repeatRegions.find((region) => {
    if (region?.isVamp !== true) return false;
    const start = Number(region.startBarIndex);
    const end = Number(region.endBarIndex);
    return Number.isFinite(start) && Number.isFinite(end) && currentBarIndex >= start && currentBarIndex <= end;
  }) || null;
}

function isPlaybackStopped() {
  return !state.isPlaying && !state.isPaused;
}

function canShowExitVampCue() {
  if (isPlaybackStopped()) return hasSupportedVampCueTarget();
  return Boolean(getActiveVampRepeatRegion());
}

function addPerformanceCue(type: string) {
  const selectedDocument = state.currentChartDocument;
  if (!selectedDocument) return;
  const currentPerformance = ensureCurrentChartPerformance();
  if (!currentPerformance) return;
  if (type === CHART_PERFORMANCE_CUE_TYPES.armCoda && hasLastChorusPerformanceCue(currentPerformance)) return;
  const cueBoundary = getChartPerformanceCueBoundary(type);
  if (
    type === CHART_PERFORMANCE_CUE_TYPES.playbackFeelToggle
    && hasPlaybackFeelPerformanceCueForBoundary(currentPerformance, cueBoundary)
  ) return;
  if (type === CHART_PERFORMANCE_CUE_TYPES.exitRepeat && !canShowExitVampCue()) return;
  const nextPerformance = createDefaultChartPerformance(selectedDocument, {
    ...currentPerformance,
    cues: [...(currentPerformance.cues || []), createPerformanceCue(type, cueBoundary)],
    updatedAt: new Date().toISOString()
  });
  updateCurrentChartPerformance(nextPerformance);
}

function getCurrentPlaybackBarIndex() {
  const entry = state.activePlaybackEntryIndex >= 0
    ? state.currentPlaybackPlan?.entries?.[state.activePlaybackEntryIndex]
    : null;
  const parsedEntryIndex = Number(entry?.barIndex);
  if (Number.isFinite(parsedEntryIndex) && parsedEntryIndex > 0) return parsedEntryIndex;
  const parsedActiveBarIndex = Number(state.currentChartDocument?.bars?.find((bar) => bar.id === state.activeBarId)?.index);
  return Number.isFinite(parsedActiveBarIndex) && parsedActiveBarIndex > 0 ? parsedActiveBarIndex : 0;
}

function getLastPlaybackBarIndex() {
  const playbackBars = state.currentPracticeSession?.playback?.bars || [];
  const lastPlaybackBarIndex = Number(playbackBars[playbackBars.length - 1]?.index);
  if (Number.isFinite(lastPlaybackBarIndex) && lastPlaybackBarIndex > 0) return lastPlaybackBarIndex;
  const chartBars = state.currentChartDocument?.bars || [];
  const lastChartBarIndex = Number(chartBars[chartBars.length - 1]?.index);
  return Number.isFinite(lastChartBarIndex) && lastChartBarIndex > 0 ? lastChartBarIndex : null;
}

function resolvePerformanceCueTargetBarIndex(cue: ChartPerformanceCue, currentBarIndex = getCurrentPlaybackBarIndex()) {
  return resolveChartPerformanceCueTargetBarIndexForSession(
    cue,
    getSelectedPracticeSession(),
    currentBarIndex,
    getLastPlaybackBarIndex()
  );
}

let activePlaybackPerformanceCueIds = new Set<string>();

function getUpdatedCueStatus(cue: ChartPerformanceCue) {
  return cue.status === 'armed' ? 'idle' : 'armed';
}

function rememberAppliedPerformanceCue(cue: ChartPerformanceCue) {
  if (cue.type !== CHART_PERFORMANCE_CUE_TYPES.armCoda) return;
  if (cue.status === 'armed') {
    activePlaybackPerformanceCueIds.add(cue.id);
  } else {
    activePlaybackPerformanceCueIds.delete(cue.id);
  }
}

function getSyncedIdlePlaybackFeelCue(cue: ChartPerformanceCue, currentMode: 'four' | 'two'): ChartPerformanceCue {
  return {
    ...cue,
    status: 'idle',
    playbackFeel: getOppositePlaybackFeelMode(currentMode),
    bassFeel: undefined,
    targetBarIndex: null,
    targetOnNextProgression: null,
    armedAtBarIndex: null,
    consumedAtBarIndex: null
  };
}

function syncPlaybackFeelPerformanceCuesForMode(
  cues: ChartPerformanceCue[] = [],
  currentMode: 'four' | 'two' = chartPlaybackFeelMode
) {
  let changed = false;
  const nextCues = cues.map((cue) => {
    if (!isPlaybackFeelToggleCue(cue)) return cue;
    const nextCue = getSyncedIdlePlaybackFeelCue(cue, currentMode);
    if (
      cue.status !== nextCue.status
      || cue.playbackFeel !== nextCue.playbackFeel
      || cue.bassFeel !== nextCue.bassFeel
      || cue.targetBarIndex !== nextCue.targetBarIndex
      || cue.targetOnNextProgression !== nextCue.targetOnNextProgression
      || cue.armedAtBarIndex !== nextCue.armedAtBarIndex
      || cue.consumedAtBarIndex !== nextCue.consumedAtBarIndex
    ) {
      changed = true;
      return nextCue;
    }
    return cue;
  });
  return { cues: changed ? nextCues : cues, changed };
}

function shouldTrackLivePerformanceCue() {
  return Boolean(state.isPlaying || state.isPaused);
}

function canApplyPerformanceCueImmediately(cue: ChartPerformanceCue) {
  if (cue.type !== CHART_PERFORMANCE_CUE_TYPES.armCoda || !shouldTrackLivePerformanceCue()) return true;
  const targetBarIndex = Number(cue.targetBarIndex);
  const currentBarIndex = getCurrentPlaybackBarIndex();
  if (!Number.isFinite(targetBarIndex) || targetBarIndex <= 0 || !Number.isFinite(currentBarIndex) || currentBarIndex <= 0) {
    return true;
  }
  return currentBarIndex < targetBarIndex;
}

async function queuePerformanceCue(
  cue: ChartPerformanceCue,
  playbackSession: PracticeSessionSpec | null = getSelectedPracticeSession(),
  { trackForActiveSession = shouldTrackLivePerformanceCue() }: { trackForActiveSession?: boolean } = {}
) {
  try {
    const cuePayload = {
      ...cue,
      playbackSession
    };
    const result = await getChartPlaybackController().queuePerformanceCue(cuePayload);
    const queuedCue = result?.cue as ChartPerformanceCue | undefined;
    if (
      queuedCue
      && isPlaybackFeelToggleCue(cue)
      && (
        queuedCue.targetBarIndex !== cue.targetBarIndex
        || queuedCue.targetOnNextProgression !== cue.targetOnNextProgression
      )
    ) {
      syncQueuedPlaybackFeelCueTarget(queuedCue);
    }
    if (trackForActiveSession && result?.ok !== false) {
      rememberAppliedPerformanceCue(cue);
    }
  } catch (error) {
    console.error('[chart-cue] queue failed', error);
    if (dom.transportStatus) dom.transportStatus.textContent = `Cue error: ${getErrorMessage(error)}`;
  }
}

function syncQueuedPlaybackFeelCueTarget(queuedCue: ChartPerformanceCue) {
  const selectedDocument = state.currentChartDocument;
  const currentPerformance = getCurrentChartPerformance();
  if (!selectedDocument || !currentPerformance?.cues?.length || !queuedCue?.id) return;
  let changed = false;
  const nextCues = currentPerformance.cues.map((cue) => {
    if (cue.id !== queuedCue.id || !isPlaybackFeelToggleCue(cue) || cue.status !== 'armed') return cue;
    const nextCue = {
      ...cue,
      targetBarIndex: queuedCue.targetBarIndex ?? null,
      targetOnNextProgression: queuedCue.targetOnNextProgression === true ? true : null
    };
    if (
      cue.targetBarIndex !== nextCue.targetBarIndex
      || cue.targetOnNextProgression !== nextCue.targetOnNextProgression
    ) {
      changed = true;
      return nextCue;
    }
    return cue;
  });
  if (!changed) return;
  updateCurrentChartPerformance(createDefaultChartPerformance(selectedDocument, {
    ...currentPerformance,
    cues: nextCues,
    updatedAt: new Date().toISOString()
  }), {
    persist: false
  });
}

function getStartupPlaybackFeelCueForArmedPerformance(
  playbackSession: PracticeSessionSpec | null = getSelectedPracticeSession()
): ChartPerformanceCue | null {
  const cue = (getCurrentChartPerformance()?.cues || [])
    .find((candidate) => candidate.status === 'armed' && isPlaybackFeelToggleCue(candidate));
  if (!cue) return null;
  const playbackFeel = normalizePlaybackFeelMode(cue.playbackFeel || cue.bassFeel);
  return {
    ...cue,
    id: `chart-startup-playback-feel-${cue.id || Date.now()}`,
    type: 'playback_feel_set',
    boundary: CHART_PERFORMANCE_CUE_BOUNDARIES.nextBar,
    status: 'armed',
    playbackFeel,
    bassFeel: undefined,
    playbackSession
  };
}

async function resetPlaybackFeelModeAfterStop() {
  chartPlaybackFeelMode = 'four';
  syncCurrentPlaybackFeelCuesForMode('four', { persist: false });
  try {
    await getChartPlaybackController().queuePerformanceCue({
      id: `chart-playback-feel-reset-${Date.now()}`,
      type: 'playback_feel_set',
      boundary: CHART_PERFORMANCE_CUE_BOUNDARIES.nextBar,
      status: 'armed',
      playbackFeel: 'four',
      createdAt: new Date().toISOString(),
      playbackSession: getSelectedPracticeSession()
    });
  } catch (error) {
    console.error('[chart-cue] playback feel reset failed', error);
  }
}

function togglePerformanceCue(cueId: string) {
  const selectedDocument = state.currentChartDocument;
  const currentPerformance = getCurrentChartPerformance();
  if (!selectedDocument || !currentPerformance) return;
  let queuedCue: ChartPerformanceCue | null = null;
  const nextCues = (currentPerformance.cues || []).map((cue) => {
    if (cue.id !== cueId) return cue;
    const status = getUpdatedCueStatus(cue);
    const isPlaybackFeelCue = isPlaybackFeelToggleCue(cue);
    const resolvedTargetBarIndex = status === 'armed' ? resolvePerformanceCueTargetBarIndex(cue) : null;
    const useNextChorusBoundary = status === 'armed'
      && isPlaybackFeelCue
      && resolvedTargetBarIndex === null;
    const targetBarIndex = useNextChorusBoundary ? getLastPlaybackBarIndex() : resolvedTargetBarIndex;
    const nextCue = {
      ...cue,
      status,
      playbackFeel: isPlaybackFeelCue
        ? normalizePlaybackFeelMode(cue.playbackFeel || cue.bassFeel || getOppositePlaybackFeelMode(chartPlaybackFeelMode))
        : cue.playbackFeel,
      targetBarIndex,
      targetOnNextProgression: useNextChorusBoundary ? true : null,
      armedAtBarIndex: status === 'armed' ? getCurrentPlaybackBarIndex() : null
    };
    if (
      status === 'armed'
      || cue.type === CHART_PERFORMANCE_CUE_TYPES.armCoda
      || isPlaybackFeelCue
    ) queuedCue = nextCue;
    return nextCue;
  });
  updateCurrentChartPerformance(createDefaultChartPerformance(selectedDocument, {
    ...currentPerformance,
    cues: nextCues,
    updatedAt: new Date().toISOString()
  }));
  if (queuedCue && canApplyPerformanceCueImmediately(queuedCue)) void queuePerformanceCue(queuedCue);
}

function prepareArmedPerformanceCuesForPlayback(playbackSession: PracticeSessionSpec | null) {
  const selectedDocument = state.currentChartDocument;
  const currentPerformance = getCurrentChartPerformance();
  if (!selectedDocument || !currentPerformance?.cues?.length) return [];
  const result = prepareArmedChartPerformanceCuesForPlayback(
    currentPerformance.cues,
    (cue) => resolveChartPerformanceCueTargetBarIndexForSession(
      cue,
      playbackSession,
      undefined,
      getLastPlaybackBarIndex()
    )
  );
  if (result.changed) {
    updateCurrentChartPerformance(createDefaultChartPerformance(selectedDocument, {
      ...currentPerformance,
      cues: result.cues,
      updatedAt: new Date().toISOString()
    }), {
      persist: false
    });
  }
  return result.armedCues;
}

function deletePerformanceCue(cueId: string) {
  const selectedDocument = state.currentChartDocument;
  const currentPerformance = getCurrentChartPerformance();
  if (!selectedDocument || !currentPerformance) return;
  const targetCue = (currentPerformance.cues || []).find((cue) => cue.id === cueId);
  if (!targetCue) return;
  if (targetCue.status === 'armed' && !window.confirm(`Remove armed cue "${getChartPerformanceCueLabel(targetCue)}"?`)) {
    return;
  }
  updateCurrentChartPerformance(createDefaultChartPerformance(selectedDocument, {
    ...currentPerformance,
    cues: (currentPerformance.cues || []).filter((cue) => cue.id !== cueId),
    updatedAt: new Date().toISOString()
  }));
  if (targetCue.type === CHART_PERFORMANCE_CUE_TYPES.armCoda) {
    activePlaybackPerformanceCueIds.delete(targetCue.id);
    if (targetCue.status === 'armed') {
      void queuePerformanceCue({
        ...targetCue,
        status: 'idle',
        targetBarIndex: null,
        armedAtBarIndex: null
      });
    }
  } else if (isPlaybackFeelToggleCue(targetCue) && targetCue.status === 'armed') {
    void queuePerformanceCue({
      ...targetCue,
      status: 'idle',
      targetBarIndex: null,
      targetOnNextProgression: null,
      armedAtBarIndex: null
    });
  }
}

let lastPerformanceCuePointerActivation = {
  cueId: '',
  at: 0
};

function getPerformanceCueButtonFromEvent(event: Event) {
  const target = event.target instanceof HTMLElement ? event.target : null;
  return target?.closest<HTMLButtonElement>('[data-chart-performance-cue-id]') || null;
}

function isPerformanceCueDeleteTarget(event: Event) {
  const target = event.target instanceof HTMLElement ? event.target : null;
  return Boolean(target?.closest('[data-chart-performance-cue-delete="true"]'));
}

function activatePerformanceCueButton(cueButton: HTMLButtonElement, event: Event) {
  const cueId = cueButton.dataset.chartPerformanceCueId || '';
  if (!cueId) return false;

  event.preventDefault();
  event.stopPropagation();

  if (isPerformanceCueDeleteTarget(event)) {
    deletePerformanceCue(cueId);
  } else {
    togglePerformanceCue(cueId);
  }

  return true;
}

function shouldIgnoreSyntheticPerformanceCueClick(cueId: string) {
  return Boolean(
    cueId
    && lastPerformanceCuePointerActivation.cueId === cueId
    && Date.now() - lastPerformanceCuePointerActivation.at < PERFORMANCE_CUE_POINTER_CLICK_SUPPRESS_MS
  );
}

function consumeExecutedPerformanceCues() {
  const selectedDocument = state.currentChartDocument;
  const currentPerformance = getCurrentChartPerformance();
  if (!selectedDocument || !currentPerformance?.cues?.length) return;
  const currentPlaybackBarIndex = getCurrentPlaybackBarIndex();
  const result = markExecutedChartPerformanceCuesConsumed(
    currentPerformance.cues,
    currentPlaybackBarIndex,
    (cue) => cue.type !== CHART_PERFORMANCE_CUE_TYPES.armCoda || activePlaybackPerformanceCueIds.has(cue.id)
  );
  if (!result.changed) return;
  const activeVampRegion = getActiveVampRepeatRegion(currentPlaybackBarIndex);
  const executedPlaybackFeelCue = result.cues.find((cue, index) => {
    const previousCue = currentPerformance.cues[index];
    return isPlaybackFeelToggleCue(cue)
      && previousCue?.status === 'armed'
      && cue.status === 'consumed';
  });
  const appliedPlaybackFeelMode = executedPlaybackFeelCue
    ? normalizePlaybackFeelMode(executedPlaybackFeelCue.playbackFeel || executedPlaybackFeelCue.bassFeel)
    : null;
  const nextCues = result.cues.map((cue, index) => {
    const previousCue = currentPerformance.cues[index];
    if (isPlaybackFeelToggleCue(cue) && appliedPlaybackFeelMode) {
      return getSyncedIdlePlaybackFeelCue(cue, appliedPlaybackFeelMode);
    }
    if (
      cue.type !== CHART_PERFORMANCE_CUE_TYPES.exitRepeat
      || previousCue?.status !== 'armed'
      || cue.status !== 'consumed'
    ) {
      return cue;
    }
    return {
      ...cue,
      consumedAtPlaybackEntryIndex: state.activePlaybackEntryIndex,
      consumedAtVampRegionId: activeVampRegion?.id || null
    };
  });
  if (appliedPlaybackFeelMode) {
    chartPlaybackFeelMode = appliedPlaybackFeelMode;
  }
  updateCurrentChartPerformance(createDefaultChartPerformance(selectedDocument, {
    ...currentPerformance,
    cues: nextCues,
    updatedAt: new Date().toISOString()
  }), {
    persist: false
  });
}

function refreshConsumedExitVampCuesForCurrentPosition() {
  const selectedDocument = state.currentChartDocument;
  const currentPerformance = getCurrentChartPerformance();
  if (!selectedDocument || !currentPerformance?.cues?.length) return;
  const activeVampRegion = getActiveVampRepeatRegion();
  let changed = false;
  const nextCues = currentPerformance.cues.map((cue) => {
    if (cue.type !== CHART_PERFORMANCE_CUE_TYPES.exitRepeat || cue.status !== 'consumed') return cue;
    if (activeVampRegion && cue.consumedAtVampRegionId === activeVampRegion.id) return cue;
    changed = true;
    return {
      ...cue,
      status: 'idle',
      targetBarIndex: null,
      armedAtBarIndex: null,
      consumedAtBarIndex: null,
      consumedAtPlaybackEntryIndex: null,
      consumedAtVampRegionId: null
    };
  });
  if (!changed) return;
  updateCurrentChartPerformance(createDefaultChartPerformance(selectedDocument, {
    ...currentPerformance,
    cues: nextCues,
    updatedAt: new Date().toISOString()
  }), {
    persist: false
  });
}

function restoreSessionPerformanceCues({ persist = true }: { persist?: boolean } = {}) {
  const selectedDocument = state.currentChartDocument;
  const currentPerformance = getCurrentChartPerformance();
  if (!selectedDocument || !currentPerformance?.cues?.length) {
    activePlaybackPerformanceCueIds.clear();
    return;
  }
  const feelSyncResult = syncPlaybackFeelPerformanceCuesForMode(currentPerformance.cues, 'four');
  const consumedResult = restoreConsumedChartPerformanceCues(feelSyncResult.cues);
  const appliedResult = restoreAppliedChartPerformanceCues(consumedResult.cues, activePlaybackPerformanceCueIds);
  activePlaybackPerformanceCueIds.clear();
  if (!feelSyncResult.changed && !consumedResult.changed && !appliedResult.changed) return;
  updateCurrentChartPerformance(createDefaultChartPerformance(selectedDocument, {
    ...currentPerformance,
    cues: appliedResult.cues,
    updatedAt: new Date().toISOString()
  }), {
    persist
  });
}

function renderPerformanceCueBar() {
  const cueBar = dom.performanceCueBar;
  if (!cueBar) return;
  const performance = getCurrentChartPerformance();
  const cues = (performance?.cues || []).filter((cue) => {
    if (cue.status === 'consumed') return false;
    if (cue.type !== CHART_PERFORMANCE_CUE_TYPES.exitRepeat) return true;
    return canShowExitVampCue();
  });
  const isEditing = Boolean(dom.performanceMenu && !dom.performanceMenu.hidden);
  cueBar.hidden = cues.length === 0;
  const nextHtml = cues.map((cue) => {
    const isArmed = cue.status === 'armed';
    const label = getChartPerformanceCueLabel(cue);
    return `<button type="button" class="chart-performance-cue-pill${isArmed ? ' is-armed' : ''}${isEditing ? ' is-editing' : ''}" data-chart-performance-cue-id="${cue.id}" aria-pressed="${isArmed ? 'true' : 'false'}"><span>${label}</span>${isEditing ? '<span class="chart-performance-cue-delete" data-chart-performance-cue-delete="true" aria-label="Delete cue">×</span>' : ''}</button>`;
  }).join('');
  if (cueBar.innerHTML !== nextHtml) {
    cueBar.innerHTML = nextHtml;
  }
}

function getActiveChartPerformance() {
  const currentPerformance = getCurrentChartPerformance();
  if (!currentPerformance?.active) return null;
  return currentPerformance;
}

function getChartRepeatCount() {
  return normalizeChartRepeatCount(resolveChartPerformanceRepeatState({
    activePerformance: getActiveChartPerformance(),
    simplePerformance: state.chartSimplePerformance
  }).repeatCount, 1);
}

function isChartRepeatInfinite() {
  return resolveChartPerformanceRepeatState({
    activePerformance: getActiveChartPerformance(),
    simplePerformance: state.chartSimplePerformance
  }).infinite;
}

function getChartRepeatPlanCount() {
  return isChartRepeatInfinite() ? 1 : getChartRepeatCount();
}

function getSourceRepeatCount(chartDocument: ChartDocument | null | undefined = state.currentChartDocument) {
  return normalizeChartRepeatCount(chartDocument?.metadata?.sourceRepeats, DEFAULT_CHART_REPEAT_COUNT);
}

function syncRepeatCountControls(
  value: unknown = getChartRepeatCount(),
  { infinite = isChartRepeatInfinite() }: { infinite?: boolean } = {}
) {
  const currentPerformance = getCurrentChartPerformance();
  const normalizedRepeatCount = normalizeChartRepeatCount(value);
  const label = infinite ? CHART_REPEAT_INFINITE_LABEL : `${normalizedRepeatCount}x`;
  if (!infinite) {
    if (dom.repeatCountInput) dom.repeatCountInput.value = String(normalizedRepeatCount);
    if (dom.repeatCountSelect) dom.repeatCountSelect.value = String(normalizedRepeatCount);
    if (dom.repeatCountRange) dom.repeatCountRange.value = String(normalizedRepeatCount);
  }
  if (dom.repeatCountInput) dom.repeatCountInput.disabled = infinite;
  if (dom.repeatCountSelect) dom.repeatCountSelect.disabled = infinite;
  if (dom.repeatCountRange) dom.repeatCountRange.disabled = infinite;
  if (dom.repeatCountDecrease) dom.repeatCountDecrease.disabled = infinite;
  if (dom.repeatCountIncrease) dom.repeatCountIncrease.disabled = infinite;
  if (dom.repeatCountLabel) dom.repeatCountLabel.textContent = label;
  if (dom.repeatCountValue) dom.repeatCountValue.textContent = label;
  dom.repeatCountLabel?.classList.toggle('chart-repeat-infinity-symbol', label === CHART_REPEAT_INFINITE_LABEL);
  dom.repeatCountValue?.classList.toggle('chart-repeat-infinity-symbol', label === CHART_REPEAT_INFINITE_LABEL);
  if (dom.repeatInfiniteButton) {
    dom.repeatInfiniteButton.setAttribute('aria-pressed', infinite ? 'true' : 'false');
  }
  if (dom.repeatCountPopover) {
    dom.repeatCountPopover.classList.toggle('is-infinite', infinite);
    dom.repeatCountPopover.classList.toggle('has-active-performance', Boolean(currentPerformance));
  }
  if (dom.performanceActionButton) {
    dom.performanceActionButton.textContent = "Add 'on-cue' triggers";
    dom.performanceActionButton.disabled = !state.currentChartDocument;
    dom.performanceActionButton.setAttribute('aria-expanded', dom.performanceMenu && !dom.performanceMenu.hidden ? 'true' : 'false');
  }
  const hasLastChorusCue = hasLastChorusPerformanceCue(currentPerformance);
  const hasVampCueTarget = canShowExitVampCue();
  dom.performanceMenu?.querySelectorAll<HTMLButtonElement>('[data-chart-performance-cue-type]').forEach((button) => {
    const cueType = button.dataset.chartPerformanceCueType;
    const isLastChorusButton = cueType === CHART_PERFORMANCE_CUE_TYPES.armCoda;
    const isExitVampButton = cueType === CHART_PERFORMANCE_CUE_TYPES.exitRepeat;
    const option = button.closest<HTMLElement>('[data-chart-performance-cue-option]');
    if (isExitVampButton) {
      const shouldHide = !hasVampCueTarget;
      button.hidden = shouldHide;
      if (option) option.hidden = shouldHide;
    }
    button.disabled = isLastChorusButton && hasLastChorusCue;
  });
  renderPerformanceCueBar();
}

function setChartRepeatCount(value: unknown, { render = false }: { render?: boolean } = {}) {
  const selectedDocument = state.currentChartDocument;
  if (!selectedDocument) return;
  const currentPerformance = ensureCurrentChartPerformance();
  if (!currentPerformance) return;
  const nextPerformance = createDefaultChartPerformance(selectedDocument, {
    ...currentPerformance,
    repeatMode: 'finite',
    repeatCount: normalizeChartRepeatCount(value, currentPerformance.repeatCount || 1),
    updatedAt: new Date().toISOString()
  });
  updateCurrentChartPerformance(nextPerformance);
  if (render) {
    renderFixture();
  }
}

function setChartRepeatInfinite(value: boolean, { render = true }: { render?: boolean } = {}) {
  const selectedDocument = state.currentChartDocument;
  if (!selectedDocument) return;
  const currentPerformance = ensureCurrentChartPerformance();
  if (!currentPerformance) return;
  const nextPerformance = createDefaultChartPerformance(selectedDocument, {
    ...currentPerformance,
    repeatMode: value ? 'infinite' : 'finite',
    repeatCount: normalizeChartRepeatCount(currentPerformance.repeatCount || dom.repeatCountSelect?.value || 1),
    updatedAt: new Date().toISOString()
  });
  updateCurrentChartPerformance(nextPerformance);
  if (render) {
    renderTransport();
  } else {
    renderTransport();
  }
}

function closeBottomPopovers() {
  if (dom.tempoPopover) dom.tempoPopover.hidden = true;
  if (dom.tempoButton) dom.tempoButton.setAttribute('aria-expanded', 'false');
  if (dom.repeatCountPopover) dom.repeatCountPopover.hidden = true;
  if (dom.repeatCountButton) dom.repeatCountButton.setAttribute('aria-expanded', 'false');
  if (dom.performanceMenu) dom.performanceMenu.hidden = true;
  if (dom.performanceActionButton) dom.performanceActionButton.setAttribute('aria-expanded', 'false');
  renderPerformanceCueBar();
  if (dom.keyPopover) dom.keyPopover.hidden = true;
  if (dom.keyButton) dom.keyButton.setAttribute('aria-expanded', 'false');
  if (dom.mixerPopover) dom.mixerPopover.hidden = true;
  if (dom.mixerButton) dom.mixerButton.setAttribute('aria-expanded', 'false');
  syncChartPopoverButtonStates();
}

function closePerformanceMenu() {
  if (dom.performanceMenu) dom.performanceMenu.hidden = true;
  dom.performanceActionButton?.setAttribute('aria-expanded', 'false');
  renderPerformanceCueBar();
}

function isMetadataPopoverActive() {
  return Boolean(dom.chartMetadataPopover && !dom.chartMetadataPopover.hidden);
}

function bindBottomControlPopovers() {
  syncTempoControls();
  syncRepeatCountControls();
  syncPerformanceFeelBoundaryToggle();

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
    if (dom.repeatCountPopover) dom.repeatCountPopover.hidden = true;
    dom.repeatCountButton?.setAttribute('aria-expanded', 'false');
    closePerformanceMenu();
    if (dom.keyPopover) dom.keyPopover.hidden = true;
    dom.keyButton?.setAttribute('aria-expanded', 'false');
    if (dom.mixerPopover) dom.mixerPopover.hidden = true;
    dom.mixerButton?.setAttribute('aria-expanded', 'false');
    if (dom.tempoPopover) dom.tempoPopover.hidden = !willOpen;
    syncChartPopoverButtonStates();
    syncMobileOverlayDrawerLayout();
  });

  dom.tempoPopover?.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  dom.repeatCountButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isMetadataPopoverActive()) {
      event.preventDefault();
      closeBottomPopovers();
      return;
    }
    const willOpen = Boolean(dom.repeatCountPopover?.hidden);
    closeAllChartPopovers((createChartPopoverBindings({
      popovers: [dom.manageChartsPopover, dom.instrumentSettingsPopover]
    }) as { popovers: Array<HTMLElement | null> }).popovers);
    dom.instrumentSettingsButton?.setAttribute('aria-expanded', 'false');
    if (dom.tempoPopover) dom.tempoPopover.hidden = true;
    dom.tempoButton?.setAttribute('aria-expanded', 'false');
    if (dom.keyPopover) dom.keyPopover.hidden = true;
    dom.keyButton?.setAttribute('aria-expanded', 'false');
    if (dom.mixerPopover) dom.mixerPopover.hidden = true;
    dom.mixerButton?.setAttribute('aria-expanded', 'false');
    if (dom.repeatCountPopover) dom.repeatCountPopover.hidden = !willOpen;
    if (!willOpen) closePerformanceMenu();
    syncChartPopoverButtonStates();
    syncMobileOverlayDrawerLayout();
  });

  dom.repeatCountPopover?.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  dom.keyButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isMetadataPopoverActive()) {
      event.preventDefault();
      closeBottomPopovers();
      return;
    }
    const willOpen = Boolean(dom.keyPopover?.hidden);
    closeAllChartPopovers((createChartPopoverBindings({
      popovers: [dom.manageChartsPopover, dom.instrumentSettingsPopover]
    }) as { popovers: Array<HTMLElement | null> }).popovers);
    dom.instrumentSettingsButton?.setAttribute('aria-expanded', 'false');
    if (dom.tempoPopover) dom.tempoPopover.hidden = true;
    dom.tempoButton?.setAttribute('aria-expanded', 'false');
    if (dom.repeatCountPopover) dom.repeatCountPopover.hidden = true;
    dom.repeatCountButton?.setAttribute('aria-expanded', 'false');
    closePerformanceMenu();
    if (dom.mixerPopover) dom.mixerPopover.hidden = true;
    dom.mixerButton?.setAttribute('aria-expanded', 'false');
    renderTransposeTiles();
    if (dom.keyPopover) dom.keyPopover.hidden = !willOpen;
    dom.keyButton?.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    syncChartPopoverButtonStates();
    syncMobileOverlayDrawerLayout();
  });

  dom.keyPopover?.addEventListener('click', (event) => {
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
    if (dom.repeatCountPopover) dom.repeatCountPopover.hidden = true;
    dom.repeatCountButton?.setAttribute('aria-expanded', 'false');
    closePerformanceMenu();
    if (dom.keyPopover) dom.keyPopover.hidden = true;
    dom.keyButton?.setAttribute('aria-expanded', 'false');
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

  dom.repeatInfiniteButton?.addEventListener('click', () => {
    setChartRepeatInfinite(!isChartRepeatInfinite());
  });

  dom.repeatCountSelect?.addEventListener('change', () => {
    setChartRepeatCount(dom.repeatCountSelect?.value || 1);
  });

  dom.repeatCountRange?.addEventListener('input', () => {
    setChartRepeatCount(dom.repeatCountRange?.value || 1);
  });

  dom.repeatCountDecrease?.addEventListener('click', () => {
    setChartRepeatCount(getChartRepeatCount() - 1);
  });

  dom.repeatCountIncrease?.addEventListener('click', () => {
    setChartRepeatCount(getChartRepeatCount() + 1);
  });

  dom.performanceActionButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    const selectedDocument = state.currentChartDocument;
    if (!selectedDocument) return;
    ensureCurrentChartPerformance();
    const willOpen = Boolean(dom.performanceMenu?.hidden);
    if (dom.performanceMenu) dom.performanceMenu.hidden = !willOpen;
    dom.performanceActionButton?.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    syncRepeatCountControls();
    renderPerformanceCueBar();
    syncMobileOverlayDrawerLayout();
  });

  dom.performanceMenu?.addEventListener('click', (event) => {
    event.stopPropagation();
    const target = event.target instanceof HTMLElement ? event.target : null;
    const boundaryButton = target?.closest<HTMLButtonElement>('[data-chart-performance-feel-boundary]');
    if (boundaryButton) {
      syncPerformanceFeelBoundaryToggle(boundaryButton.dataset.chartPerformanceFeelBoundary);
      return;
    }
    const cueButton = target?.closest<HTMLButtonElement>('[data-chart-performance-cue-type]');
    if (!cueButton) return;
    addPerformanceCue(cueButton.dataset.chartPerformanceCueType || '');
    syncRepeatCountControls();
    renderPerformanceCueBar();
    syncMobileOverlayDrawerLayout();
  });

  dom.performanceCueBar?.addEventListener('click', (event) => {
    const cueButton = getPerformanceCueButtonFromEvent(event);
    if (!cueButton) return;
    const cueId = cueButton.dataset.chartPerformanceCueId || '';
    if (shouldIgnoreSyntheticPerformanceCueClick(cueId)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    activatePerformanceCueButton(cueButton, event);
  });

  dom.performanceCueBar?.addEventListener('pointerdown', (event) => {
    if (getPerformanceCueButtonFromEvent(event)) {
      event.stopPropagation();
    }
  });

  dom.performanceCueBar?.addEventListener('pointerup', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    const cueButton = getPerformanceCueButtonFromEvent(event);
    if (!cueButton) return;
    if (activatePerformanceCueButton(cueButton, event)) {
      lastPerformanceCuePointerActivation = {
        cueId: cueButton.dataset.chartPerformanceCueId || '',
        at: Date.now()
      };
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('.chart-bottom-overlay')) return;
    if (target?.closest('.chart-bottom-popover-wrap')) return;
    if (dom.repeatCountPopover && !dom.repeatCountPopover.hidden) return;
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
  refreshConsumedExitVampCuesForCurrentPosition();
  consumeExecutedPerformanceCues();
  renderTransport();
  updateActiveHighlights();
  renderPerformanceCueBar();
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
    getTransposition: getChartTransposeSemitones,
    selectionSummaryElement: dom.selectionSummary,
    clearSelectionButton: dom.clearSelectionButton,
    sendSelectionToPracticeButton: dom.sendSelectionToPracticeButton,
    isSelectionLocked: !canModifyChartSelection(),
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
    clearPlayFromBarSession();
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
  }
  const shouldShowPlayFromBar = selectionCount === 1;
  const shouldShowSelectionActions = selectionCount > 1;
  if (dom.selectionLoopButton) {
    dom.selectionLoopButton.hidden = !shouldShowSelectionActions;
    dom.selectionLoopButton.disabled = !hasSession;
    dom.selectionLoopButton.textContent = state.selectionLoopActive ? 'Looping...' : 'Loop';
    dom.selectionLoopButton.classList.toggle('is-active', state.selectionLoopActive);
    dom.selectionLoopButton.classList.toggle('chart-selection-menu-button-primary', shouldShowSelectionActions);
  }
  if (dom.selectionPlayFromBarButton) {
    dom.selectionPlayFromBarButton.hidden = !shouldShowPlayFromBar;
    dom.selectionPlayFromBarButton.disabled = !hasSession;
    dom.selectionPlayFromBarButton.classList.toggle('chart-selection-menu-button-primary', shouldShowPlayFromBar);
  }
  if (dom.selectionCreateDrillButton) {
    dom.selectionCreateDrillButton.hidden = !shouldShowSelectionActions;
    dom.selectionCreateDrillButton.disabled = !hasSession;
    dom.selectionCreateDrillButton.classList.remove('chart-selection-menu-button-primary');
  }
  if (dom.selectionMenu) {
    positionSelectionMenu();
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
  if (previousState.isPlaying && !state.isPlaying && !state.isPaused) {
    stopPlaybackPolling({
      state
    });
    restoreSessionPerformanceCues();
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
  clearPlayFromBarSession();
  stopPlaybackPolling({
    state
  });
  if (resetPosition) {
    resetActivePlaybackPosition();
  }
  applyChartPlaybackState({ isPlaying: false, isPaused: false }, {
    allowSelectionLoopRestart: false
  });
  try {
    const nextState = await getChartPlaybackController().stopPlayback({ resetPosition });
    applyChartPlaybackState(nextState, {
      allowSelectionLoopRestart: false
    });
  } finally {
    await resetPlaybackFeelModeAfterStop();
    restoreSessionPerformanceCues();
  }
}

async function startPlayback({
  cancelSelectionLoop = true,
  practiceSessionOverride = null
}: {
  cancelSelectionLoop?: boolean;
  practiceSessionOverride?: PracticeSessionSpec | null;
} = {}) {
  if (cancelSelectionLoop) {
    setSelectionLoopActive(false);
  }
  state.playFromBarPracticeSession = practiceSessionOverride;
  const shouldMarkLoopPending = !cancelSelectionLoop && state.selectionLoopActive;
  if (shouldMarkLoopPending) {
    state.selectionLoopPlaybackPending = true;
  }
  try {
    activePlaybackPerformanceCueIds.clear();
    if (!practiceSessionOverride) {
      rebuildCurrentPlaybackSessionForPerformanceCues();
    }
    const playbackSession = getSelectedPracticeSession();
    const armedCues = prepareArmedPerformanceCuesForPlayback(playbackSession);
    const startupPlaybackFeelCue = getStartupPlaybackFeelCueForArmedPerformance(playbackSession);
    if (startupPlaybackFeelCue) {
      chartPlaybackFeelMode = normalizePlaybackFeelMode(startupPlaybackFeelCue.playbackFeel);
    }
    const nextState = await getChartPlaybackController().startPlayback({
      startupPerformanceCue: startupPlaybackFeelCue
    });
    await Promise.all(armedCues.map((cue) => queuePerformanceCue(cue, playbackSession, {
      trackForActiveSession: true
    })));
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

async function handleCompingStyleChange() {
  try {
    if (state.isPlaying || state.isPaused) {
      await stopPlayback({
        resetPosition: true
      });
    }
    await syncPlaybackSettings();
  } catch (error) {
    if (dom.transportStatus) {
      dom.transportStatus.textContent = `Playback settings error: ${getErrorMessage(error)}`;
    }
  }
}

function navigateToPracticeWithSelection() {
  setSelectionLoopActive(false);
  clearPlayFromBarSession();
  getChartPlaybackController().navigateToPracticeWithSelection();
}

function clearChartSelection() {
  if (!canClearChartSelection()) {
    openOverlay();
    return;
  }
  const shouldStopLoopPlayback = state.selectionLoopActive && (state.isPlaying || state.isPaused);
  setSelectionLoopActive(false);
  clearPlayFromBarSession();
  state.selectionController.clear();
  renderSelectionState();
  if (shouldStopLoopPlayback) {
    void stopPlayback({
      resetPosition: true,
      cancelSelectionLoop: false
    });
  }
}

function createSelectionLoopPracticeSession(): PracticeSessionSpec | null {
  const practiceSession = state.currentSelectionPracticeSession;
  if (!practiceSession?.playback?.enginePatternString) return null;
  return {
    ...practiceSession,
    id: `${practiceSession.id || 'chart-selection'}-loop`,
    playback: {
      ...practiceSession.playback,
      endingCue: null
    },
    origin: {
      ...(practiceSession.origin || {}),
      mode: 'chart-selection-loop'
    }
  };
}

async function startSelectionLoop() {
  const practiceSession = createSelectionLoopPracticeSession();
  if (!hasActiveSelection() || !practiceSession) return;
  clearPlayFromBarSession();
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
      cancelSelectionLoop: false,
      practiceSessionOverride: practiceSession
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
      syncRepeatCountControls();
      renderPerformanceCueBar();
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

async function renderFixture() {
  const availableDocuments = getAvailableDocuments();
  const selectedId = dom.fixtureSelect?.value || availableDocuments[0]?.metadata?.id || '';
  const isNewChartSelection = state.currentChartDocument?.metadata?.id !== selectedId;
  const selectedDocument = availableDocuments.find((document) => document.metadata.id === selectedId);
  populateTransposeOptions(selectedDocument);
  const renderToken = ++chartUserSettingsRenderToken;
  const chartUserSettings = selectedDocument
    ? await loadChartUserSettings(selectedDocument.metadata?.id || '')
    : null;
  if (renderToken !== chartUserSettingsRenderToken) return;
  state.currentChartUserSettings = chartUserSettings;
  if (isNewChartSelection) {
    if (selectedDocument) {
      applyChartUserSettingsToControls(selectedDocument, chartUserSettings, { resetTempo: true });
    }
  } else if (selectedDocument && chartUserSettings?.chartPerformance) {
    const normalizedPerformance = resetTransientChartPerformanceCueState(
      normalizeChartPerformance(chartUserSettings.chartPerformance, selectedDocument)
    );
    state.chartPerformance = normalizedPerformance;
    if (normalizedPerformance) {
      state.chartPerformances[selectedDocument.metadata?.id || ''] = normalizedPerformance;
    }
  }
  await renderSelectedFixture(createChartFixtureRenderBindings({
    state,
    fixtureSelect: dom.fixtureSelect,
    transposeSelect: dom.transposeSelect,
    chordDisplayLevel: normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value),
    tempoInput: dom.tempoInput,
    getAvailableDocuments,
    resetTempo: false,
    stopPlayback,
    createPlaybackPlanOptions: (chartDocument) => createCurrentPlaybackPlanOptions(chartDocument),
    createPracticeSessionOptions: (playbackPlan) => ({
      playbackPlan,
      tempo: getTempo(),
      transposition: getChartTransposeSemitones()
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
  syncRepeatCountControls();
  renderPerformanceCueBar();
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

function createPlayFromSelectedBarSession(): PracticeSessionSpec | null {
  const chartDocument = state.currentChartDocument;
  const selectedBarIds = state.selectionController.getSelection().barIds;
  if (!chartDocument || selectedBarIds.length === 0) return null;

  const startBarId = selectedBarIds[0];
  const chartRepeatInfinite = isChartRepeatInfinite();
  const runtimeRepeatCount = chartRepeatInfinite ? 1 : getChartRepeatCount();
  const playbackPlan = createChartPlaybackPlanFromDocument(
    chartDocument,
    {
      ...createCurrentPlaybackPlanOptions(chartDocument),
      repeatCount: 1
    }
  ) as ChartPlaybackPlan;
  const startEntryIndex = (playbackPlan.entries || []).findIndex((entry) => entry.barId === startBarId);
  if (startEntryIndex < 0) return null;

  const effectivePlaybackPlan = createPlayFromBarPlaybackPlan({
    playbackPlan,
    startBarId,
    repeatCount: runtimeRepeatCount,
    infinite: chartRepeatInfinite
  });
  if (!effectivePlaybackPlan) return null;

  const startBar = chartDocument.bars?.find((bar) => bar.id === startBarId) || null;
  const effectiveEntries = effectivePlaybackPlan.entries || [];
  const lastEntry = effectiveEntries[effectiveEntries.length - 1];
  const session = createPracticeSessionFromChartPlaybackPlan({
    chartDocument,
    playbackPlan: effectivePlaybackPlan,
    source: 'chart-play-from-bar',
    title: `${chartDocument.metadata?.title || 'Chart'} - from bar ${startBar?.index ?? playbackPlan.entries[startEntryIndex]?.barIndex ?? ''}`.trim(),
    tempo: getTempo(),
    transposition: getChartTransposeSemitones(),
    selection: {
      startBarId,
      endBarId: lastEntry?.barId || startBarId,
      barIds: effectiveEntries.map((entry) => entry.barId),
      startBarIndex: startBar?.index ?? playbackPlan.entries[startEntryIndex]?.barIndex ?? null,
      endBarIndex: lastEntry?.barIndex ?? null
    },
    origin: {
      chartId: chartDocument.metadata?.id || '',
      sourceKey: chartDocument.metadata?.sourceKey || '',
      mode: 'chart-selection'
    }
  });

  const playbackStartChordIndex = getPlaybackStartChordIndexForBarId(session.playback.bars, startBarId);

  return {
    ...session,
    id: `${session.id || chartDocument.metadata?.id || 'chart'}-from-bar-${startBar?.index ?? startEntryIndex + 1}`,
    playback: {
      ...session.playback,
      playbackStartChordIndex,
      runtimeRepeatCount: 1
    },
    origin: {
      ...(session.origin || {}),
      mode: 'chart-play-from-bar'
    }
  };
}

async function playFromSelectedBar() {
  const practiceSession = createPlayFromSelectedBarSession();
  if (!practiceSession?.playback?.enginePatternString) return;
  try {
    if (state.isPlaying || state.isPaused || state.activePlaybackEntryIndex >= 0) {
      await stopPlayback({
        resetPosition: true
      });
    }
    await startPlayback({
      practiceSessionOverride: practiceSession
    });
    closeOverlay();
  } catch (error) {
    clearPlayFromBarSession();
    if (dom.transportStatus) dom.transportStatus.textContent = `Playback error: ${getErrorMessage(error)}`;
    state.isPlaying = false;
    renderTransport();
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
  const appRect = dom.chartApp?.getBoundingClientRect();
  let top = Math.max(viewportTop, appRect?.top ?? viewportTop);
  let bottom = Math.min(viewportTop + viewportHeight, appRect?.bottom ?? viewportTop + viewportHeight);

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

  const viewport = window.visualViewport;
  const viewportWidth = viewport?.width || window.innerWidth || document.documentElement.clientWidth;
  const viewportLeft = viewport?.offsetLeft || 0;
  const appRect = dom.chartApp?.getBoundingClientRect();
  const frameLeft = appRect?.left ?? 0;
  const frameTop = appRect?.top ?? 0;
  const boundsLeft = Math.max(viewportLeft, appRect?.left ?? viewportLeft);
  const boundsRight = Math.min(viewportLeft + viewportWidth, appRect?.right ?? viewportLeft + viewportWidth);
  const margin = 8;
  const availableWidth = Math.max(1, boundsRight - boundsLeft - (margin * 2));
  dom.selectionMenu.style.maxWidth = `${availableWidth}px`;
  const menuRect = dom.selectionMenu.getBoundingClientRect();
  const menuWidth = Math.max(menuRect.width, 1);
  const menuHeight = Math.max(menuRect.height, 1);
  const preferredLeft = selectionBounds.left + (selectionBounds.width / 2);
  const minLeft = boundsLeft + margin + (menuWidth / 2);
  const maxLeft = boundsRight - margin - (menuWidth / 2);
  const nextLeft = maxLeft >= minLeft
    ? Math.max(minLeft, Math.min(maxLeft, preferredLeft))
    : boundsLeft + ((boundsRight - boundsLeft) / 2);
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

  dom.selectionMenu.style.left = `${nextLeft - frameLeft}px`;
  dom.selectionMenu.style.top = `${Math.max(verticalBounds.top + margin, nextTop) - frameTop}px`;
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
  chartBackNavigation.sync();
}

function closeOpenPopovers() {
  const popovers = [dom.manageChartsPopover, dom.instrumentSettingsPopover, dom.chartMetadataPopover, dom.tempoPopover, dom.keyPopover, dom.mixerPopover];
  const hasOpenPopover = popovers.some((popover) => popover && !popover.hidden);
  if (!hasOpenPopover) return false;
  closeAllPopovers();
  syncMobileOverlayDrawerLayout();
  chartBackNavigation.sync();
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
  chartBackNavigation.sync();
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
  const popovers = [dom.manageChartsPopover, dom.instrumentSettingsPopover, dom.chartMetadataPopover, dom.tempoPopover, dom.repeatCountPopover, dom.keyPopover, dom.mixerPopover];
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
    if (handleSyntheticAndroidBack()) return;
    navigateBackWithFallback({ fallbackHref: getChartBackHref() });
  });
}

function openOverlay() {
  syncMobileOverlayDrawerLayout();
  openChartOverlay(createChartOverlayShellBindings({
    chartApp: dom.chartApp,
    chartTopOverlay: dom.chartTopOverlay,
    chartBottomOverlay: dom.chartBottomOverlay
  }));
  chartBackNavigation.sync();
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
  chartBackNavigation.sync();
}

const canHandleChartBack = (): boolean => (
  Boolean(dom.chartApp?.classList.contains('overlay-open'))
  || [dom.manageChartsPopover, dom.instrumentSettingsPopover, dom.chartMetadataPopover, dom.tempoPopover, dom.repeatCountPopover, dom.keyPopover, dom.mixerPopover]
    .some((popover) => popover && !popover.hidden)
);

const chartBackNavigation = createMobileBackNavigationController({
  canHandleBack: canHandleChartBack,
  handleBack: handleSyntheticAndroidBack
});

if (typeof MutationObserver !== 'undefined') {
  const chartBackObserver = new MutationObserver(() => {
    chartBackNavigation.sync();
  });
  if (dom.chartApp) {
    chartBackObserver.observe(dom.chartApp, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  [dom.manageChartsPopover, dom.instrumentSettingsPopover, dom.chartMetadataPopover, dom.tempoPopover, dom.repeatCountPopover, dom.keyPopover, dom.mixerPopover]
    .forEach((popover) => {
      if (!popover) return;
      chartBackObserver.observe(popover, {
        attributes: true,
        attributeFilter: ['hidden']
      });
    });
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

async function resetCurrentChartToDefaults() {
  const chartDocument = state.currentChartDocument;
  const chartId = String(chartDocument?.metadata?.id || '').trim();
  if (!chartDocument || !chartId) return;
  const hasPerformanceCues = Boolean(getCurrentChartPerformance()?.cues?.length);
  if (hasPerformanceCues && !window.confirm('Reset this chart to defaults? Performance cues for this chart will be removed.')) {
    return;
  }

  await resetChartUserSettings(chartId);
  state.currentChartUserSettings = null;
  delete state.chartPerformances[chartId];
  suppressChartUserSettingsPersistence = true;
  try {
    state.chartSimplePerformance = { mode: 'infinite', repeatMode: 'infinite' };
    state.chartPerformance = null;
    if (dom.transposeSelect) dom.transposeSelect.value = '0';
    syncTransposeTileSelection();
    syncTempoControls(chartDocument.metadata.tempo || DEFAULT_TEMPO);
    syncRepeatCountControls();
    renderTransport();
  } finally {
    suppressChartUserSettingsPersistence = false;
  }
  if (dom.transportStatus) {
    dom.transportStatus.textContent = 'Chart defaults restored';
  }
  await renderFixture();
  void syncPlaybackSettings();
}

function getRequestedLibrarySubset(documents: ChartDocument[] = []): { documents: ChartDocument[]; source: string } | null {
  const requestedOrigin = String(new URLSearchParams(window.location.search).get('from') || '').trim().toLowerCase();
  if (requestedOrigin !== 'library') return null;

  const subsetSession = readChartLibrarySubsetSession();
  if (!subsetSession) return null;

  const requestedChartId = getRequestedChartId();
  if (requestedChartId && !subsetSession.chartIds.includes(requestedChartId)) return null;

  const documentsById = new Map(documents.map((document) => [String(document.metadata?.id || ''), document]));
  const subsetDocuments = subsetSession.chartIds
    .map((chartId) => documentsById.get(chartId))
    .filter((document): document is ChartDocument => Boolean(document));

  if (subsetDocuments.length === 0) return null;

  return {
    documents: subsetDocuments,
    source: subsetSession.source || 'Library selection'
  };
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

    const requestedLibrarySubset = getRequestedLibrarySubset(persistedLibrary.documents);
    if (requestedLibrarySubset) {
      const requestedChartId = getRequestedChartId();
      const preferredLibraryDocument = requestedChartId
        ? requestedLibrarySubset.documents.find((document) => document.metadata.id === requestedChartId)
        : null;
      renderImportedLibrary({
        documents: requestedLibrarySubset.documents,
        source: requestedLibrarySubset.source,
        preferredId: (preferredLibraryDocument || requestedLibrarySubset.documents[0]).metadata.id,
        statusMessage: `Loaded ${requestedLibrarySubset.source} (${requestedLibrarySubset.documents.length} charts). Use previous and next to move manually.`,
        renderSelectedChart: true
      });
      return;
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
        chordEnrichmentMode: dom.chordEnrichmentMode,
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
          syncChordDisplayHelp();
          persistPlaybackSettings();
          renderFixture();
        },
        onChordEnrichmentModeChange: () => {
          persistPlaybackSettings();
        },
        onSymbolToggleChange: () => {
          persistPlaybackSettings();
          renderFixture();
        },
        onTempoChange: renderTransport,
        onCompingStyleChange: () => {
          void handleCompingStyleChange();
        },
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
          if (state.selectionController.getSelection().barIds.length === 1) {
            await playFromSelectedBar();
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
      dom.selectionPlayFromBarButton?.addEventListener('click', () => {
        void playFromSelectedBar();
      });
      dom.selectionCreateDrillButton?.addEventListener('click', navigateToPracticeWithSelection);
      dom.resetChartSettingsButton?.addEventListener('click', () => {
        void resetCurrentChartToDefaults().catch((error) => {
          if (dom.transportStatus) dom.transportStatus.textContent = `Chart reset error: ${getErrorMessage(error)}`;
        });
      });
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
        canModifySelection: canModifyChartSelection,
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

