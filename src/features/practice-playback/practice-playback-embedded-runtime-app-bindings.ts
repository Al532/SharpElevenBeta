import type { PracticePlaybackControllerOptions, EmbeddedPracticeRuntimeOptions } from '../../core/types/contracts';
import type { PracticePlaybackPatternUiBindings } from './practice-playback-types.js';

type PracticePlaybackRuntimeBindingMap = Record<string, unknown>;

type PracticePlaybackEmbeddedPatternUiBindings = {
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
  setPlaybackStartChordIndex?: PracticePlaybackPatternUiBindings['setPlaybackStartChordIndex'];
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

type PracticePlaybackEmbeddedNormalizationBindings = {
  normalizePatternString?: (value: string) => string;
  normalizePresetName?: (value: string) => string;
  normalizePatternMode?: (value: string) => string;
  normalizeCompingStyle?: (value: string) => string;
  normalizeRepetitionsPerKey?: (value: number | string) => number;
  normalizeDisplayMode?: (value: string) => string;
  normalizeHarmonyDisplayMode?: (value: string) => string;
};

type PracticePlaybackEmbeddedPlaybackSettingsBindings = {
  getSwingRatio?: () => number;
  getCompingStyle?: () => string;
  getDrumsMode?: () => string;
  isWalkingBassEnabled?: () => boolean;
  getRepetitionsPerKey?: () => number;
  getFinitePlayback?: () => boolean;
  setFinitePlayback?: (enabled: boolean) => void;
  applyMixerSettings?: () => void;
};

type PracticePlaybackEmbeddedTransportActions = {
  startPlayback?: () => Promise<void> | void;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
};

type PracticePlaybackEmbeddedPlaybackStateBindings = NonNullable<EmbeddedPracticeRuntimeOptions['playbackStateOptions']>;
type PracticePlaybackEmbeddedPlaybackControllerBindings = NonNullable<PracticePlaybackControllerOptions>;

function getBindingRecord(value: unknown): PracticePlaybackRuntimeBindingMap {
  return value && typeof value === 'object'
    ? (value as PracticePlaybackRuntimeBindingMap)
    : {};
}

export function createPracticePlaybackStateBindings(
  bindings: Record<string, unknown> = {}
): Partial<PracticePlaybackEmbeddedPlaybackStateBindings> & Record<string, unknown> {
  return {
    isEmbeddedMode: Boolean(bindings.isEmbeddedMode),
    getIsPlaying: bindings.getIsPlaying,
    getIsPaused: bindings.getIsPaused,
    getIsIntro: bindings.getIsIntro,
    getCurrentBeat: bindings.getCurrentBeat,
    getCurrentChordIdx: bindings.getCurrentChordIdx,
    getPaddedChordCount: bindings.getPaddedChordCount,
    getTempo: bindings.getTempo
  } as Partial<PracticePlaybackEmbeddedPlaybackStateBindings> & Record<string, unknown>;
}

export function createPracticePatternUiBindings(
  bindings: Record<string, unknown> = {}
): PracticePlaybackEmbeddedPatternUiBindings {
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
    setPlaybackStartChordIndex: bindings.setPlaybackStartChordIndex,
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
  } as PracticePlaybackEmbeddedPatternUiBindings;
}

export function createPracticePlaybackNormalizationBindings(
  bindings: Record<string, unknown> = {}
): PracticePlaybackEmbeddedNormalizationBindings {
  return {
    normalizePatternString: bindings.normalizePatternString,
    normalizePresetName: bindings.normalizePresetName,
    normalizePatternMode: bindings.normalizePatternMode,
    normalizeCompingStyle: bindings.normalizeCompingStyle,
    normalizeRepetitionsPerKey: bindings.normalizeRepetitionsPerKey,
    normalizeDisplayMode: bindings.normalizeDisplayMode,
    normalizeHarmonyDisplayMode: bindings.normalizeHarmonyDisplayMode
  } as PracticePlaybackEmbeddedNormalizationBindings;
}

export function createPracticePlaybackSettingsBindings(
  bindings: Record<string, unknown> = {}
): PracticePlaybackEmbeddedPlaybackSettingsBindings {
  return {
    getSwingRatio: bindings.getSwingRatio,
    getCompingStyle: bindings.getCompingStyle,
    getDrumsMode: bindings.getDrumsMode,
    isWalkingBassEnabled: bindings.isWalkingBassEnabled,
    getRepetitionsPerKey: bindings.getRepetitionsPerKey,
    getFinitePlayback: bindings.getFinitePlayback,
    setFinitePlayback: bindings.setFinitePlayback,
    applyMixerSettings: bindings.applyMixerSettings
  } as PracticePlaybackEmbeddedPlaybackSettingsBindings;
}

export function createPracticePlaybackRuntimeBindings(
  bindings: Record<string, unknown> = {}
): Partial<PracticePlaybackEmbeddedPlaybackControllerBindings> & Record<string, unknown> {
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
  } as Partial<PracticePlaybackEmbeddedPlaybackControllerBindings> & Record<string, unknown>;
}

export function createPracticePlaybackTransportActionBindings(
  bindings: Record<string, unknown> = {}
): PracticePlaybackEmbeddedTransportActions {
  return {
    startPlayback: bindings.startPlayback,
    stopPlayback: bindings.stopPlayback,
    togglePausePlayback: bindings.togglePausePlayback
  } as PracticePlaybackEmbeddedTransportActions;
}

export function createPracticePlaybackEmbeddedRuntimeContextBindings(bindings: Record<string, unknown> = {}) {
  return {
    dom: getBindingRecord(bindings.dom),
    patternUi: createPracticePatternUiBindings(getBindingRecord(bindings.patternUi)),
    normalization: createPracticePlaybackNormalizationBindings(getBindingRecord(bindings.normalization)),
    playbackSettings: createPracticePlaybackSettingsBindings(getBindingRecord(bindings.playbackSettings)),
    playbackState: createPracticePlaybackStateBindings(getBindingRecord(bindings.playbackState)),
    playbackRuntime: createPracticePlaybackRuntimeBindings(getBindingRecord(bindings.playbackRuntime)),
    transportActions: createPracticePlaybackTransportActionBindings(getBindingRecord(bindings.transportActions))
  };
}
