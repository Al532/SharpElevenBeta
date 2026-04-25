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
} from '../src/core/types/contracts';

import { initializeSharpElevenTheme } from '../src/features/app/app-theme.js';
import {
  createChartDocumentsFromIRealText,
} from './index.js';
import defaultIRealSourceText from '../parsing-projects/ireal/sources/jazz-1460.txt?raw';
import {
  loadPersistedChartId as loadPersistedChartIdFromStorage,
  persistChartLibrary,
  loadPersistedPlaybackSettings as loadPersistedChartPlaybackSettings,
  persistChartId as persistChartIdToStorage,
  persistPlaybackSettings as persistChartPlaybackSettings
} from '../src/features/chart/chart-persistence.js';
import {
  filterChartDocuments,
  importDocumentsFromIRealText as importChartDocumentsFromIRealText
} from '../src/features/chart/chart-library.js';
import {
  applyImportedLibrary as applyImportedChartLibrary,
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
import { renderChordSymbolHtml } from '../src/core/music/chord-symbol-display.js';
import voicingConfig from '../src/core/music/voicing-config.js';
import { CHART_DISPLAY_CONFIG } from '../src/config/trainer-config.js';

const DEFAULT_TEMPO = 120;
const PLAYBACK_STATE_POLL_INTERVAL_MS = 120;
const IREAL_SOURCE_URL = '../parsing-projects/ireal/sources/jazz-1460.txt';
const IREAL_DEFAULT_PLAYLISTS_URL = 'https://www.irealpro.com/main-playlists/';
const IREAL_FORUM_TRACKS_URL = 'https://forums.irealpro.com/#songs.3';
const LAST_CHART_STORAGE_KEY = 'sharp-eleven-chart-last-chart-id';
const PLAYBACK_SETTINGS_STORAGE_KEY = 'sharp-eleven-chart-playback-settings';
const HARMONY_DISPLAY_MODE_DEFAULT = 'default';
const HARMONY_DISPLAY_MODE_RICH = 'rich';
const CHART_PLAYBACK_BRIDGE_MODE = 'direct';
const DEFAULT_MASTER_VOLUME_PERCENT = 50;
const DEFAULT_CHANNEL_VOLUME_PERCENT = 100;
const DEFAULT_BAR_GROUP_SIZE = CHART_DISPLAY_CONFIG.layout.barsPerRow;
const CHART_TEXT_SCALE_COMPENSATION_CSS_VAR = CHART_DISPLAY_CONFIG.textScaleCompensation.cssVarName;

const {
  DEFAULT_DISPLAY_QUALITY_ALIASES = {},
  RICH_DISPLAY_QUALITY_ALIASES = {}
} = voicingConfig;

initializeSharpElevenTheme();

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
  playbackBridgeFrame: document.getElementById('playback-bridge-frame') as HTMLIFrameElement | null,
  selectionSummary: document.getElementById('selection-summary'),
  clearSelectionButton: document.getElementById('clear-selection-button') as HTMLButtonElement | null,
  sendSelectionToPracticeButton: document.getElementById('send-selection-to-practice-button') as HTMLButtonElement | null,
  selectionMenu: document.getElementById('chart-selection-menu'),
  selectionLoopButton: document.getElementById('selection-loop-button') as HTMLButtonElement | null,
  selectionCreateDrillButton: document.getElementById('selection-create-drill-button') as HTMLButtonElement | null,
  mobileMenuToggle: document.getElementById('mobile-menu-toggle') as HTMLButtonElement | null,
  mobileBackdrop: document.getElementById('chart-mobile-backdrop'),
  manageChartsButton: document.getElementById('manage-charts-button') as HTMLButtonElement | null,
  manageChartsPopover: document.getElementById('manage-charts-popover'),
  settingsButton: document.getElementById('settings-button') as HTMLButtonElement | null,
  settingsPopover: document.getElementById('settings-popover'),
  chartTopOverlay: document.getElementById('chart-top-overlay'),
  chartBottomOverlay: document.getElementById('chart-bottom-overlay'),
  chartApp: document.querySelector<HTMLElement>('.chart-app')
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
  },
  selectionLoopActive: boolean,
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
  selectionLoopRestartPending: false
};

let lastMobileOverlayTopHeight = -1;
let lastMobileOverlayBottomHeight = -1;
let lastMobileOverlayPushY = -1;

let chartTextScaleCompensation = 1;

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

function readSafeAreaInsets() {
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.inset = '0';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.paddingTop = 'env(safe-area-inset-top)';
  probe.style.paddingRight = 'env(safe-area-inset-right)';
  probe.style.paddingBottom = 'env(safe-area-inset-bottom)';
  probe.style.paddingLeft = 'env(safe-area-inset-left)';
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe);
  const insets = {
    top: parseFloat(computed.paddingTop) || 0,
    right: parseFloat(computed.paddingRight) || 0,
    bottom: parseFloat(computed.paddingBottom) || 0,
    left: parseFloat(computed.paddingLeft) || 0
  };
  probe.remove();
  return insets;
}

function syncChartCutoutPadding() {
  const extraPadding = CHART_DISPLAY_CONFIG.sheetHeader.cutoutSidePaddingPx;
  const insets = readSafeAreaInsets();
  const maxInset = Math.max(insets.top, insets.right, insets.bottom, insets.left);
  const rootStyle = document.documentElement.style;
  const isCutoutSide = (side: keyof typeof insets) => maxInset > 0 && insets[side] === maxInset;
  (['top', 'right', 'bottom', 'left'] as const).forEach((side) => {
    rootStyle.setProperty(
      `--chart-runtime-cutout-padding-${side}`,
      side !== 'top' && isCutoutSide(side) ? `${extraPadding}px` : '0px'
    );
  });
}

function applyChartDisplayCssVariables() {
  const rootStyle = document.documentElement.style;
  const { rowSpacing, sheetHeader, barGeometry, chordSizing, displacement } = CHART_DISPLAY_CONFIG;

  const setCssVar = (name: string, value: string | number) => {
    rootStyle.setProperty(name, String(value));
  };

  setCssVar('--chart-config-row-gap-min', `${rowSpacing.minPx}px`);
  setCssVar('--chart-config-sheet-bottom-margin', `${CHART_DISPLAY_CONFIG.layout.sheetBottomMarginPx}px`);
  setCssVar('--chart-config-sheet-header-padding-top-portrait', `${sheetHeader.portraitTopPaddingPx}px`);
  setCssVar('--chart-config-sheet-header-padding-top-landscape', `${sheetHeader.landscapeTopPaddingPx}px`);
  setCssVar('--chart-config-cutout-side-padding', `${sheetHeader.cutoutSidePaddingPx}px`);
  setCssVar('--chart-config-sheet-title-offset-x', `${sheetHeader.titleOffsetXPx}px`);

  setCssVar('--chart-config-bar-cell-min-height', `${barGeometry.cellMinHeightPx}px`);
  setCssVar('--chart-config-bar-cell-vertical-size', `${barGeometry.cellVerticalSizePx}px`);
  setCssVar('--chart-config-bar-cell-bottom-margin', `${barGeometry.cellBottomMarginPx}px`);
  setCssVar('--chart-config-bar-content-inset-x', `${displacement.contentHorizontalInsetPx}px`);
  setCssVar('--chart-config-bar-line-height', `${barGeometry.barLine.heightPx}px`);
  setCssVar('--chart-config-bar-body-size', `${chordSizing.baseRem}rem`);
  syncChartCutoutPadding();
}

function measureChartTextScaleCompensation() {
  const probe = document.createElement('div');
  probe.textContent = CHART_DISPLAY_CONFIG.textScaleCompensation.probeText;
  probe.style.position = 'fixed';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.fontSize = `${CHART_DISPLAY_CONFIG.textScaleCompensation.referenceFontSizePx}px`;
  probe.style.lineHeight = '1';
  probe.style.whiteSpace = 'nowrap';
  document.body.appendChild(probe);
  const computedFontPx = parseFloat(getComputedStyle(probe).fontSize);
  probe.remove();

  if (!computedFontPx || !Number.isFinite(computedFontPx)) {
    chartTextScaleCompensation = 1;
  } else {
    chartTextScaleCompensation = Math.max(
      CHART_DISPLAY_CONFIG.textScaleCompensation.minCompensation,
      Math.min(
        CHART_DISPLAY_CONFIG.textScaleCompensation.maxCompensation,
        CHART_DISPLAY_CONFIG.textScaleCompensation.referenceFontSizePx / computedFontPx
      )
    );
  }

  document.documentElement.style.setProperty(
    CHART_TEXT_SCALE_COMPENSATION_CSS_VAR,
    chartTextScaleCompensation.toFixed(4)
  );
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

function loadPersistedChartId() {
  const requestedChartId = new URLSearchParams(window.location.search).get('chart');
  if (requestedChartId) return requestedChartId;

  return loadPersistedChartIdFromStorage({
    legacyStorageKey: LAST_CHART_STORAGE_KEY
  });
}

function getRequestedPlaylist() {
  return new URLSearchParams(window.location.search).get('playlist') || '';
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
  chartNavigationController = createChartNavigationController(createChartNavigationBindings({
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
    sheetGrid: dom.sheetGrid,
    enableSwipeGestures: false
  }));
  chartNavigationController.bind();
}

function setImportStatus(message: string, isError = false) {
  setChartImportStatus(...Object.values(createChartImportStatusBindings({
    chartImportStatus: dom.chartImportStatus,
    message,
    isError
  })) as [HTMLElement | null, string, boolean]);
}

async function importDocumentsFromIRealText(rawText: string, sourceFile = '') {
  return importChartDocumentsFromIRealText(createChartLibraryImportBindings({
    rawText,
    sourceFile,
    importDocuments: createChartDocumentsFromIRealText
  }));
}

async function applyImportedLibrary({ documents, source, preferredId = null, statusMessage = '' }: {
  documents: ChartDocument[],
  source: string,
  preferredId?: string | null,
  statusMessage?: string
}): Promise<void> {
  let nextDocuments = documents;

  if (documents.length > 0) {
    const shouldMerge = source !== 'bundled default library';
    const persistedLibrary = await persistChartLibrary({
      documents,
      source,
      mergeWithExisting: shouldMerge
    });

    if (!persistedLibrary) {
      throw new Error('The imported chart library could not be confirmed in persistent storage.');
    }

    if (persistedLibrary.documents.length === 0) {
      throw new Error('The imported chart library could not be confirmed in persistent storage.');
    }

    nextDocuments = persistedLibrary.documents;
    source = persistedLibrary.source;
  }
  applyImportedChartLibrary(createChartImportedLibraryBindings({
    state,
    chartSearchInput: dom.chartSearchInput,
    renderChartSelector,
    renderFixture,
    setImportStatus,
    documents: nextDocuments,
    source,
    preferredId,
    statusMessage
  }));

  const requestedPlaylist = getRequestedPlaylist();
  if (requestedPlaylist && dom.chartSearchInput) {
    dom.chartSearchInput.value = requestedPlaylist;
    applySearchFilter();
  }
}

function getPlaybackSettings(): PlaybackSettings {
  return {
    compingStyle: dom.compingStyleSelect?.value,
    drumsMode: dom.drumsSelect?.value,
    customMediumSwingBass: dom.walkingBassToggle?.checked,
    masterVolume: Number(dom.masterVolume?.value || DEFAULT_MASTER_VOLUME_PERCENT),
    bassVolume: Number(dom.bassVolume?.value || DEFAULT_CHANNEL_VOLUME_PERCENT),
    stringsVolume: Number(dom.stringsVolume?.value || DEFAULT_CHANNEL_VOLUME_PERCENT),
    drumsVolume: Number(dom.drumsVolume?.value || DEFAULT_CHANNEL_VOLUME_PERCENT)
  };
}

function getSelectedPracticeSession(): PracticeSessionSpec | null {
  return getSelectedPracticeSessionFromState(state);
}

function hasActiveSelection() {
  return state.selectionController.getSelection().barIds.length > 0;
}

function setSelectionLoopActive(active: boolean) {
  state.selectionLoopActive = Boolean(active);
  if (!state.selectionLoopActive) {
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

  if (dom.selectionMenu) {
    dom.selectionMenu.hidden = false;
    dom.selectionMenu.setAttribute('aria-hidden', 'false');
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
    closeOverlay();
  } catch (error) {
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
        applyOpticalPlacements();
        updateSheetGridGap();
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

function closeAllPopovers() {
  closeAllChartPopovers((createChartPopoverBindings({
    popovers: [dom.manageChartsPopover, dom.settingsPopover]
  }) as { popovers: Array<HTMLElement | null> }).popovers);
}

function togglePopover(targetPopover: HTMLElement | null, otherPopover: HTMLElement | null) {
  const bindings = createChartPopoverBindings({
    targetPopover,
    popovers: [targetPopover, otherPopover]
  }) as { targetPopover: HTMLElement | null, popovers: Array<HTMLElement | null> };
  toggleChartPopover(bindings.targetPopover, bindings.popovers);
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
  const popovers = [dom.manageChartsPopover, dom.settingsPopover];
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
  closeChartOverlay(createChartOverlayShellBindings({
    chartApp: dom.chartApp,
    chartTopOverlay: dom.chartTopOverlay,
    chartBottomOverlay: dom.chartBottomOverlay,
    popovers: [dom.manageChartsPopover, dom.settingsPopover]
  }));
  syncMobileOverlayDrawerLayout();
}

async function importDefaultFixtureLibrary() {
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
        : 'iReal link detected, but the captured text could not be loaded. Open the forum tracks and tap the link again.',
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
    importDocumentsFromIRealText,
    applyImportedLibrary,
    setImportStatus
  });
}

async function bindIncomingMobileIRealImports() {
  if (!window.Capacitor?.isNativePlatform?.()) return;
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
          clearChartSelection();
        },
        onSendSelectionToPractice: navigateToPracticeWithSelection,
        onBeforeUnload: () => {
          stopPlayback({ resetPosition: true });
        }
      })));
      dom.selectionLoopButton?.addEventListener('click', () => {
        void startSelectionLoop();
      });
      dom.selectionCreateDrillButton?.addEventListener('click', navigateToPracticeWithSelection);
      createChartGestureController({
        sheetGrid: dom.sheetGrid,
        selectionController: state.selectionController,
        renderSelectionState,
        hasActiveSelection,
        clearSelection: clearChartSelection,
        openOverlay,
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
        settingsButton: dom.settingsButton,
        onOpenOverlay: openOverlay,
        onCloseOverlay: closeOverlay,
        onManageChartsToggle: () => togglePopover(dom.manageChartsPopover as HTMLElement | null, dom.settingsPopover as HTMLElement | null),
        onSettingsToggle: () => togglePopover(dom.settingsPopover as HTMLElement | null, dom.manageChartsPopover as HTMLElement | null)
      }) as {
        mobileMenuToggle?: HTMLButtonElement | null,
        mobileBackdrop?: HTMLElement | null,
        manageChartsButton?: HTMLButtonElement | null,
        settingsButton?: HTMLButtonElement | null,
        onOpenOverlay: () => void,
        onCloseOverlay: () => void,
        onManageChartsToggle: () => void,
        onSettingsToggle: () => void
      };
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

  await bindIncomingMobileIRealImports();
  await importPendingMobileIRealLink();
}

applyChartDisplayCssVariables();
measureChartTextScaleCompensation();
installChartDebugApi();

loadFixtures().catch((error) => {
  if (dom.transportStatus) {
    dom.transportStatus.textContent = `Failed to load charts: ${getErrorMessage(error)}`;
  }
});

