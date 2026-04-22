export function createDrillPlaybackStateBindings(bindings: Record<string, any> = {}) {
  return {
    isEmbeddedMode: Boolean(bindings.isEmbeddedMode),
    getIsPlaying: bindings.getIsPlaying,
    getIsPaused: bindings.getIsPaused,
    getIsIntro: bindings.getIsIntro,
    getCurrentBeat: bindings.getCurrentBeat,
    getCurrentChordIdx: bindings.getCurrentChordIdx,
    getPaddedChordCount: bindings.getPaddedChordCount,
    getTempo: bindings.getTempo
  };
}

export function createDrillPatternUiBindings(bindings: Record<string, any> = {}) {
  return {
    clearProgressionEditingState: bindings.clearProgressionEditingState,
    closeProgressionManager: bindings.closeProgressionManager,
    setCustomPatternSelection: bindings.setCustomPatternSelection,
    setPatternName: bindings.setPatternName,
    setCustomPatternValue: bindings.setCustomPatternValue,
    setEditorPatternMode: bindings.setEditorPatternMode,
    syncPatternSelectionFromInput: bindings.syncPatternSelectionFromInput,
    setLastPatternSelectValue: bindings.setLastPatternSelectValue,
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
  };
}

export function createDrillNormalizationBindings(bindings: Record<string, any> = {}) {
  return {
    normalizePatternString: bindings.normalizePatternString,
    normalizePresetName: bindings.normalizePresetName,
    normalizePatternMode: bindings.normalizePatternMode,
    normalizeCompingStyle: bindings.normalizeCompingStyle,
    normalizeRepetitionsPerKey: bindings.normalizeRepetitionsPerKey,
    normalizeDisplayMode: bindings.normalizeDisplayMode,
    normalizeHarmonyDisplayMode: bindings.normalizeHarmonyDisplayMode
  };
}

export function createDrillPlaybackSettingsBindings(bindings: Record<string, any> = {}) {
  return {
    getSwingRatio: bindings.getSwingRatio,
    getCompingStyle: bindings.getCompingStyle,
    getDrumsMode: bindings.getDrumsMode,
    isWalkingBassEnabled: bindings.isWalkingBassEnabled,
    getRepetitionsPerKey: bindings.getRepetitionsPerKey,
    applyMixerSettings: bindings.applyMixerSettings
  };
}

export function createDrillPlaybackRuntimeBindings(bindings: Record<string, any> = {}) {
  return {
    ensureWalkingBassGenerator: bindings.ensureWalkingBassGenerator,
    getAudioContext: bindings.getAudioContext,
    noteFadeout: bindings.noteFadeout,
    stopActiveChordVoices: bindings.stopActiveChordVoices,
    rebuildPreparedCompingPlans: bindings.rebuildPreparedCompingPlans,
    buildPreparedBassPlan: bindings.buildPreparedBassPlan,
    getCurrentKey: bindings.getCurrentKey,
    preloadNearTermSamples: bindings.preloadNearTermSamples
  };
}

export function createDrillTransportActionBindings(bindings: Record<string, any> = {}) {
  return {
    startPlayback: bindings.startPlayback,
    stopPlayback: bindings.stopPlayback,
    togglePausePlayback: bindings.togglePausePlayback
  };
}

export function createDrillEmbeddedRuntimeContextBindings(bindings: Record<string, any> = {}) {
  return {
    dom: bindings.dom,
    patternUi: createDrillPatternUiBindings(bindings.patternUi || {}),
    normalization: createDrillNormalizationBindings(bindings.normalization || {}),
    playbackSettings: createDrillPlaybackSettingsBindings(bindings.playbackSettings || {}),
    playbackState: createDrillPlaybackStateBindings(bindings.playbackState || {}),
    playbackRuntime: createDrillPlaybackRuntimeBindings(bindings.playbackRuntime || {}),
    transportActions: createDrillTransportActionBindings(bindings.transportActions || {})
  };
}
