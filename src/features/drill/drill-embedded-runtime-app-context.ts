import { createEmbeddedPracticeRuntimeAppOptions } from './drill-runtime-boundary.js';
import type { PracticePlaybackControllerOptions, EmbeddedPracticeRuntimeOptions } from '../../core/types/contracts';

type DrillEmbeddedRuntimeDom = Record<string, unknown>;
type DrillEmbeddedPatternUiBindings = {
  clearProgressionEditingState?: () => void;
  closeProgressionManager?: () => void;
  setCustomPatternSelection?: () => void;
  setPatternName?: (value: string) => void;
  setCustomPatternValue?: (value: string) => void;
  setEditorPatternMode?: (value: string) => void;
  syncPatternSelectionFromInput?: () => void;
  setLastPatternSelectValue?: () => void;
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
type DrillEmbeddedPlaybackStateBindings = NonNullable<EmbeddedPracticeRuntimeOptions['playbackStateOptions']>;
type DrillEmbeddedPlaybackControllerBindings = NonNullable<PracticePlaybackControllerOptions>;
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

export function createEmbeddedPracticeRuntimeAppContextOptions({
  dom,
  patternUi = {},
  normalization = {},
  playbackSettings = {},
  playbackState = {},
  playbackRuntime = {},
  transportActions = {}
}: {
  dom?: DrillEmbeddedRuntimeDom;
  patternUi?: DrillEmbeddedPatternUiBindings;
  normalization?: DrillEmbeddedNormalizationBindings;
  playbackSettings?: DrillEmbeddedPlaybackSettingsBindings;
  playbackState?: Partial<DrillEmbeddedPlaybackStateBindings> & Record<string, unknown>;
  playbackRuntime?: Partial<DrillEmbeddedPlaybackControllerBindings> & Record<string, unknown>;
  transportActions?: DrillEmbeddedTransportActions;
} = {}) {
  return createEmbeddedPracticeRuntimeAppOptions({
    dom,
    stopIfPlaying() {
      if (playbackState.getIsPlaying?.()) {
        transportActions.stopPlayback?.();
      }
    },
    clearProgressionEditingState: patternUi.clearProgressionEditingState,
    closeProgressionManager: patternUi.closeProgressionManager,
    setCustomPatternSelection: patternUi.setCustomPatternSelection,
    setPatternName: patternUi.setPatternName,
    setCustomPatternValue: patternUi.setCustomPatternValue,
    setEditorPatternMode: patternUi.setEditorPatternMode,
    syncPatternSelectionFromInput: patternUi.syncPatternSelectionFromInput,
    setLastPatternSelectValue: patternUi.setLastPatternSelectValue,
    syncCustomPatternUI: patternUi.syncCustomPatternUI,
    normalizeChordsPerBarForCurrentPattern: patternUi.normalizeChordsPerBarForCurrentPattern,
    applyPatternModeAvailability: patternUi.applyPatternModeAvailability,
    syncPatternPreview: patternUi.syncPatternPreview,
    applyDisplayMode: patternUi.applyDisplayMode,
    applyBeatIndicatorVisibility: patternUi.applyBeatIndicatorVisibility,
    applyCurrentHarmonyVisibility: patternUi.applyCurrentHarmonyVisibility,
    updateKeyPickerLabels: patternUi.updateKeyPickerLabels,
    refreshDisplayedHarmony: patternUi.refreshDisplayedHarmony,
    fitHarmonyDisplay: patternUi.fitHarmonyDisplay,
    validateCustomPattern: patternUi.validateCustomPattern,
    getPatternErrorText: patternUi.getPatternErrorText,
    getCurrentPatternString: patternUi.getCurrentPatternString,
    getCurrentPatternMode: patternUi.getCurrentPatternMode,
    normalizePatternString: normalization.normalizePatternString,
    normalizePresetName: normalization.normalizePresetName,
    normalizePatternMode: normalization.normalizePatternMode,
    normalizeCompingStyle: normalization.normalizeCompingStyle,
    normalizeRepetitionsPerKey: normalization.normalizeRepetitionsPerKey,
    normalizeDisplayMode: normalization.normalizeDisplayMode,
    normalizeHarmonyDisplayMode: normalization.normalizeHarmonyDisplayMode,
    getSwingRatio: playbackSettings.getSwingRatio,
    getCompingStyle: playbackSettings.getCompingStyle,
    getDrumsMode: playbackSettings.getDrumsMode,
    isWalkingBassEnabled: playbackSettings.isWalkingBassEnabled,
    getRepetitionsPerKey: playbackSettings.getRepetitionsPerKey,
    getFinitePlayback: playbackSettings.getFinitePlayback,
    setFinitePlayback: playbackSettings.setFinitePlayback,
    isEmbeddedMode: playbackState.isEmbeddedMode,
    getIsPlaying: playbackState.getIsPlaying,
    getIsPaused: playbackState.getIsPaused,
    getIsIntro: playbackState.getIsIntro,
    getCurrentBeat: playbackState.getCurrentBeat,
    getCurrentChordIdx: playbackState.getCurrentChordIdx,
    getPaddedChordCount: playbackState.getPaddedChordCount,
    getTempo: playbackState.getTempo,
    ensureWalkingBassGenerator: playbackRuntime.ensureWalkingBassGenerator,
    getAudioContext: playbackRuntime.getAudioContext,
    noteFadeout: playbackRuntime.noteFadeout,
    stopActiveChordVoices: playbackRuntime.stopActiveChordVoices,
    rebuildPreparedCompingPlans: playbackRuntime.rebuildPreparedCompingPlans,
    buildPreparedBassPlan: playbackRuntime.buildPreparedBassPlan,
    getCurrentKey: playbackRuntime.getCurrentKey,
    preloadNearTermSamples: playbackRuntime.preloadNearTermSamples,
    startPlayback: async () => {
      await transportActions.startPlayback?.();
    },
    stopPlayback: transportActions.stopPlayback,
    togglePausePlayback: transportActions.togglePausePlayback,
    applyMixerSettings: playbackSettings.applyMixerSettings
  });
}
