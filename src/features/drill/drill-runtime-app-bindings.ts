import type { PracticePlaybackControllerOptions, EmbeddedPracticeRuntimeOptions } from '../../core/types/contracts';
import type { PracticePlaybackPatternUiBindings } from '../practice-playback/practice-playback-types.js';

type DrillRuntimeBindingMap = Record<string, unknown>;

type DrillEmbeddedPatternUiBindings = {
  clearProgressionEditingState?: () => void;
  closeProgressionManager?: () => void;
  setCustomPatternSelection?: () => void;
  setPatternName?: (value: string) => void;
  setCustomPatternValue?: (value: string) => void;
  setEditorPatternMode?: (value: string) => void;
  syncPatternSelectionFromInput?: () => void;
  setLastPatternSelectValue?: () => void;
  setPlaybackEndingCue?: PracticePlaybackPatternUiBindings['setPlaybackEndingCue'];
  setPlaybackPerformanceMap?: PracticePlaybackPatternUiBindings['setPlaybackPerformanceMap'];
  syncCustomPatternUI?: () => void;
  normalizeChordsPerBarForCurrentPattern?: () => void;
  applyPatternModeAvailability?: () => void;
  syncPatternPreview?: () => void;
  applyDisplayMode?: () => void;
  applyBeatIndicatorVisibility?: () => void;
  applyCurrentHarmonyVisibility?: () => void;
  updateKeyPickerLabels?: () => void;
  refreshDisplayedHarmony?: () => void;
  fitHarmonyDisplay?: () => void;
  validateCustomPattern?: () => boolean;
  getPatternErrorText?: () => string;
  getCurrentPatternString?: () => string;
  getCurrentPatternMode?: () => string;
};

type DrillEmbeddedNormalizationBindings = {
  normalizePatternString?: (value: string) => string;
  normalizePresetName?: (value: string) => string;
  normalizePatternMode?: (value: string) => string;
  normalizeCompingStyle?: (value: string) => string;
  normalizeRepetitionsPerKey?: (value: number | string) => number;
  normalizeDisplayMode?: (value: string) => string;
  normalizeHarmonyDisplayMode?: (value: string) => string;
};

type DrillEmbeddedPlaybackSettingsBindings = {
  getSwingRatio?: () => number;
  getCompingStyle?: () => string;
  getDrumsMode?: () => string;
  isWalkingBassEnabled?: () => boolean;
  getRepetitionsPerKey?: () => number;
  getFinitePlayback?: () => boolean;
  setFinitePlayback?: (enabled: boolean) => void;
  applyMixerSettings?: () => void;
};

type DrillEmbeddedTransportActions = {
  startPlayback?: () => Promise<void> | void;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
};

type DrillEmbeddedPlaybackStateBindings = NonNullable<EmbeddedPracticeRuntimeOptions['playbackStateOptions']>;
type DrillEmbeddedPlaybackControllerBindings = NonNullable<PracticePlaybackControllerOptions>;

function getBindingRecord(value: unknown): DrillRuntimeBindingMap {
  return value && typeof value === 'object'
    ? (value as DrillRuntimeBindingMap)
    : {};
}

export function createPracticePlaybackStateBindings(
  bindings: Record<string, unknown> = {}
): Partial<DrillEmbeddedPlaybackStateBindings> & Record<string, unknown> {
  return {
    isEmbeddedMode: Boolean(bindings.isEmbeddedMode),
    getIsPlaying: bindings.getIsPlaying,
    getIsPaused: bindings.getIsPaused,
    getIsIntro: bindings.getIsIntro,
    getCurrentBeat: bindings.getCurrentBeat,
    getCurrentChordIdx: bindings.getCurrentChordIdx,
    getPaddedChordCount: bindings.getPaddedChordCount,
    getTempo: bindings.getTempo
  } as Partial<DrillEmbeddedPlaybackStateBindings> & Record<string, unknown>;
}

export function createPracticePatternUiBindings(
  bindings: Record<string, unknown> = {}
): DrillEmbeddedPatternUiBindings {
  return {
    clearProgressionEditingState: bindings.clearProgressionEditingState,
    closeProgressionManager: bindings.closeProgressionManager,
    setCustomPatternSelection: bindings.setCustomPatternSelection,
    setPatternName: bindings.setPatternName,
    setCustomPatternValue: bindings.setCustomPatternValue,
    setEditorPatternMode: bindings.setEditorPatternMode,
    syncPatternSelectionFromInput: bindings.syncPatternSelectionFromInput,
    setLastPatternSelectValue: bindings.setLastPatternSelectValue,
    setPlaybackEndingCue: bindings.setPlaybackEndingCue,
    setPlaybackPerformanceMap: bindings.setPlaybackPerformanceMap,
    syncCustomPatternUI: bindings.syncCustomPatternUI,
    normalizeChordsPerBarForCurrentPattern: bindings.normalizeChordsPerBarForCurrentPattern,
    applyPatternModeAvailability: bindings.applyPatternModeAvailability,
    syncPatternPreview: bindings.syncPatternPreview,
    applyDisplayMode: bindings.applyDisplayMode,
    applyBeatIndicatorVisibility: bindings.applyBeatIndicatorVisibility,
    applyCurrentHarmonyVisibility: bindings.applyCurrentHarmonyVisibility,
    updateKeyPickerLabels: bindings.updateKeyPickerLabels,
    refreshDisplayedHarmony: bindings.refreshDisplayedHarmony,
    fitHarmonyDisplay: bindings.fitHarmonyDisplay,
    validateCustomPattern: bindings.validateCustomPattern,
    getPatternErrorText: bindings.getPatternErrorText,
    getCurrentPatternString: bindings.getCurrentPatternString,
    getCurrentPatternMode: bindings.getCurrentPatternMode
  } as DrillEmbeddedPatternUiBindings;
}

export function createDrillNormalizationBindings(
  bindings: Record<string, unknown> = {}
): DrillEmbeddedNormalizationBindings {
  return {
    normalizePatternString: bindings.normalizePatternString,
    normalizePresetName: bindings.normalizePresetName,
    normalizePatternMode: bindings.normalizePatternMode,
    normalizeCompingStyle: bindings.normalizeCompingStyle,
    normalizeRepetitionsPerKey: bindings.normalizeRepetitionsPerKey,
    normalizeDisplayMode: bindings.normalizeDisplayMode,
    normalizeHarmonyDisplayMode: bindings.normalizeHarmonyDisplayMode
  } as DrillEmbeddedNormalizationBindings;
}

export function createPracticePlaybackSettingsBindings(
  bindings: Record<string, unknown> = {}
): DrillEmbeddedPlaybackSettingsBindings {
  return {
    getSwingRatio: bindings.getSwingRatio,
    getCompingStyle: bindings.getCompingStyle,
    getDrumsMode: bindings.getDrumsMode,
    isWalkingBassEnabled: bindings.isWalkingBassEnabled,
    getRepetitionsPerKey: bindings.getRepetitionsPerKey,
    getFinitePlayback: bindings.getFinitePlayback,
    setFinitePlayback: bindings.setFinitePlayback,
    applyMixerSettings: bindings.applyMixerSettings
  } as DrillEmbeddedPlaybackSettingsBindings;
}

export function createPracticePlaybackRuntimeBindings(
  bindings: Record<string, unknown> = {}
): Partial<DrillEmbeddedPlaybackControllerBindings> & Record<string, unknown> {
  return {
    ensureWalkingBassGenerator: bindings.ensureWalkingBassGenerator,
    getAudioContext: bindings.getAudioContext,
    noteFadeout: bindings.noteFadeout,
    stopActiveChordVoices: bindings.stopActiveChordVoices,
    rebuildPreparedCompingPlans: bindings.rebuildPreparedCompingPlans,
    buildPreparedBassPlan: bindings.buildPreparedBassPlan,
    getCurrentKey: bindings.getCurrentKey,
    preloadNearTermSamples: bindings.preloadNearTermSamples,
    queuePerformanceCue: bindings.queuePerformanceCue
  } as Partial<DrillEmbeddedPlaybackControllerBindings> & Record<string, unknown>;
}

export function createDrillTransportActionBindings(
  bindings: Record<string, unknown> = {}
): DrillEmbeddedTransportActions {
  return {
    startPlayback: bindings.startPlayback,
    stopPlayback: bindings.stopPlayback,
    togglePausePlayback: bindings.togglePausePlayback
  } as DrillEmbeddedTransportActions;
}

export function createDrillEmbeddedRuntimeContextBindings(bindings: Record<string, unknown> = {}) {
  return {
    dom: getBindingRecord(bindings.dom),
    patternUi: createPracticePatternUiBindings(getBindingRecord(bindings.patternUi)),
    normalization: createDrillNormalizationBindings(getBindingRecord(bindings.normalization)),
    playbackSettings: createPracticePlaybackSettingsBindings(getBindingRecord(bindings.playbackSettings)),
    playbackState: createPracticePlaybackStateBindings(getBindingRecord(bindings.playbackState)),
    playbackRuntime: createPracticePlaybackRuntimeBindings(getBindingRecord(bindings.playbackRuntime)),
    transportActions: createDrillTransportActionBindings(getBindingRecord(bindings.transportActions))
  };
}
