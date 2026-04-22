// @ts-check

import { createEmbeddedDrillRuntimeAppOptions } from './drill-runtime-boundary.js';

/**
 * Creates the app-level embedded playback runtime options from grouped runtime
 * concerns instead of a single flat object. This keeps `app.js` focused on its
 * own state/DOM bindings while the runtime boundary stays reusable.
 *
 * @param {{
 *   dom?: Record<string, any>,
 *   patternUi?: Record<string, any>,
 *   normalization?: Record<string, any>,
 *   playbackSettings?: Record<string, any>,
 *   playbackState?: Record<string, any>,
 *   playbackRuntime?: Record<string, any>,
 *   transportActions?: Record<string, any>
 * }} [options]
 */
export function createEmbeddedDrillRuntimeAppContextOptions({
  dom,
  patternUi = {},
  normalization = {},
  playbackSettings = {},
  playbackState = {},
  playbackRuntime = {},
  transportActions = {}
} = {}) {
  return createEmbeddedDrillRuntimeAppOptions({
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
    startPlayback: transportActions.startPlayback,
    stopPlayback: transportActions.stopPlayback,
    togglePausePlayback: transportActions.togglePausePlayback,
    applyMixerSettings: playbackSettings.applyMixerSettings
  });
}
