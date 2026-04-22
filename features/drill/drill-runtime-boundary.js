// @ts-check

/** @typedef {import('../../core/types/contracts').DrillPlaybackControllerOptions} DrillPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').EmbeddedDrillRuntimeOptions} EmbeddedDrillRuntimeOptions */
/** @typedef {import('../../core/types/contracts').EmbeddedPatternAdapterOptions} EmbeddedPatternAdapterOptions */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackSettingsAdapterOptions} EmbeddedPlaybackSettingsAdapterOptions */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackStateOptions} EmbeddedPlaybackStateOptions */

/**
 * Creates the direct playback-controller options used by the shared
 * playback runtime adapter. Keeping this in one place makes the runtime/audio
 * boundary explicit for the future TS extraction.
 *
 * @param {DrillPlaybackControllerOptions} options
 * @returns {DrillPlaybackControllerOptions}
 */
export function createDrillPlaybackControllerOptions(options = {}) {
  return {
    ensureWalkingBassGenerator: options.ensureWalkingBassGenerator,
    isPlaying: options.isPlaying,
    getAudioContext: options.getAudioContext,
    noteFadeout: options.noteFadeout,
    stopActiveChordVoices: options.stopActiveChordVoices,
    rebuildPreparedCompingPlans: options.rebuildPreparedCompingPlans,
    buildPreparedBassPlan: options.buildPreparedBassPlan,
    getCurrentKey: options.getCurrentKey,
    preloadNearTermSamples: options.preloadNearTermSamples,
    validateCustomPattern: options.validateCustomPattern,
    startPlayback: options.startPlayback,
    stopPlayback: options.stopPlayback,
    togglePausePlayback: options.togglePausePlayback
  };
}

export const createDirectPlaybackControllerOptions = createDrillPlaybackControllerOptions;

/**
 * Creates the embedded playback-state getter options used by the shared
 * embedded playback runtime. This isolates the direct app-state lookups from the
 * runtime boundary setup in `app.js`.
 *
 * @param {EmbeddedPlaybackStateOptions} options
 * @returns {EmbeddedPlaybackStateOptions}
 */
export function createEmbeddedPlaybackStateOptions(options = {}) {
  return {
    isEmbeddedMode: options.isEmbeddedMode,
    getIsPlaying: options.getIsPlaying,
    getIsPaused: options.getIsPaused,
    getIsIntro: options.getIsIntro,
    getCurrentBeat: options.getCurrentBeat,
    getCurrentChordIdx: options.getCurrentChordIdx,
    getPaddedChordCount: options.getPaddedChordCount,
    getCurrentPatternString: options.getCurrentPatternString,
    getCurrentPatternMode: options.getCurrentPatternMode,
    getPatternErrorText: options.getPatternErrorText,
    hasPatternError: options.hasPatternError,
    getTempo: options.getTempo,
    getSwingRatio: options.getSwingRatio
  };
}

/**
 * Creates the embedded pattern-adapter options used by the shared embedded
 * Drill runtime. This isolates the UI mutation surface from the runtime setup
 * in `app.js`.
 *
 * @param {EmbeddedPatternAdapterOptions} options
 * @returns {EmbeddedPatternAdapterOptions}
 */
export function createEmbeddedPatternAdapterOptions(options = {}) {
  return {
    stopIfPlaying: options.stopIfPlaying,
    clearProgressionEditingState: options.clearProgressionEditingState,
    closeProgressionManager: options.closeProgressionManager,
    setCustomPatternSelection: options.setCustomPatternSelection,
    setPatternName: options.setPatternName,
    setCustomPatternValue: options.setCustomPatternValue,
    setEditorPatternMode: options.setEditorPatternMode,
    syncPatternSelectionFromInput: options.syncPatternSelectionFromInput,
    setLastPatternSelectValue: options.setLastPatternSelectValue,
    applyEmbeddedPlaybackSettings: options.applyEmbeddedPlaybackSettings,
    syncCustomPatternUI: options.syncCustomPatternUI,
    normalizeChordsPerBarForCurrentPattern: options.normalizeChordsPerBarForCurrentPattern,
    applyPatternModeAvailability: options.applyPatternModeAvailability,
    syncPatternPreview: options.syncPatternPreview,
    applyDisplayMode: options.applyDisplayMode,
    applyBeatIndicatorVisibility: options.applyBeatIndicatorVisibility,
    applyCurrentHarmonyVisibility: options.applyCurrentHarmonyVisibility,
    updateKeyPickerLabels: options.updateKeyPickerLabels,
    refreshDisplayedHarmony: options.refreshDisplayedHarmony,
    fitHarmonyDisplay: options.fitHarmonyDisplay,
    validateCustomPattern: options.validateCustomPattern,
    getPatternErrorText: options.getPatternErrorText,
    getCurrentPatternString: options.getCurrentPatternString,
    normalizePatternString: options.normalizePatternString,
    normalizePresetName: options.normalizePresetName,
    normalizePatternMode: options.normalizePatternMode
  };
}

/**
 * Creates the embedded playback-settings adapter options used by the shared
 * embedded playback runtime. This keeps the control-synchronization surface
 * explicit outside `app.js`.
 *
 * @param {EmbeddedPlaybackSettingsAdapterOptions} options
 * @returns {EmbeddedPlaybackSettingsAdapterOptions}
 */
export function createEmbeddedPlaybackSettingsAdapterOptions(options = {}) {
  return {
    setTempo: options.setTempo,
    setTransposition: options.setTransposition,
    setCompingStyle: options.setCompingStyle,
    setDrumsMode: options.setDrumsMode,
    setWalkingBassEnabled: options.setWalkingBassEnabled,
    setRepetitionsPerKey: options.setRepetitionsPerKey,
    setDisplayMode: options.setDisplayMode,
    setHarmonyDisplayMode: options.setHarmonyDisplayMode,
    setShowBeatIndicator: options.setShowBeatIndicator,
    setHideCurrentHarmony: options.setHideCurrentHarmony,
    setMasterVolume: options.setMasterVolume,
    setBassVolume: options.setBassVolume,
    setStringsVolume: options.setStringsVolume,
    setDrumsVolume: options.setDrumsVolume,
    applyMixerSettings: options.applyMixerSettings,
    getPlaybackSettingsSnapshot: options.getPlaybackSettingsSnapshot,
    normalizeEmbeddedVolume: options.normalizeEmbeddedVolume
  };
}

/**
 * Creates the full options object consumed by `initializeEmbeddedDrillRuntime`.
 * This keeps the runtime boundary assembly explicit and contained in one place
 * instead of rebuilding the object inline in `app.js`.
 *
 * @param {EmbeddedDrillRuntimeOptions} options
 * @returns {EmbeddedDrillRuntimeOptions}
 */
export function createEmbeddedDrillRuntimeOptions(options = {}) {
  return {
    patternAdapterOptions: createEmbeddedPatternAdapterOptions(options.patternAdapterOptions || {}),
    playbackSettingsAdapterOptions: createEmbeddedPlaybackSettingsAdapterOptions(options.playbackSettingsAdapterOptions || {}),
    playbackStateOptions: createEmbeddedPlaybackStateOptions(options.playbackStateOptions || {}),
    playbackControllerOptions: createDrillPlaybackControllerOptions(options.playbackControllerOptions || {})
  };
}

/**
 * Creates the embedded playback runtime options from the app-level UI/runtime
 * context. This consolidates the large `initializeEmbeddedDrillRuntime(...)`
 * assembly block so `app.js` no longer rebuilds the whole boundary inline.
 *
 * @param {{
 *   dom: Record<string, any>,
 *   customPatternOptionValue: string,
 *   stopIfPlaying: () => void,
 *   clearProgressionEditingState: () => void,
 *   closeProgressionManager: () => void,
 *   setCustomPatternSelection: () => void,
 *   setPatternName: (value: string) => void,
 *   setCustomPatternValue: (value: string) => void,
 *   setEditorPatternMode: (value: string) => void,
 *   syncPatternSelectionFromInput: () => void,
 *   setLastPatternSelectValue: () => void,
 *   syncCustomPatternUI: () => void,
 *   normalizeChordsPerBarForCurrentPattern: () => void,
 *   applyPatternModeAvailability: () => void,
 *   syncPatternPreview: () => void,
 *   applyDisplayMode: () => void,
 *   applyBeatIndicatorVisibility: () => void,
 *   applyCurrentHarmonyVisibility: () => void,
 *   updateKeyPickerLabels: () => void,
 *   refreshDisplayedHarmony: () => void,
 *   fitHarmonyDisplay: () => void,
 *   validateCustomPattern: () => boolean,
 *   getPatternErrorText: () => string,
 *   getCurrentPatternString: () => string,
 *   getCurrentPatternMode: () => string,
 *   normalizePatternString: (value: string) => string,
 *   normalizePresetName: (value: string) => string,
 *   normalizePatternMode: (value: string) => string,
 *   normalizeCompingStyle: (value: string) => string,
 *   normalizeRepetitionsPerKey: (value: number | string) => number,
 *   normalizeDisplayMode: (value: string) => string,
 *   normalizeHarmonyDisplayMode: (value: string) => string,
 *   getSwingRatio: () => number,
 *   getCompingStyle: () => string,
 *   getDrumsMode: () => string,
 *   isWalkingBassEnabled: () => boolean,
 *   getRepetitionsPerKey: () => number,
 *   isEmbeddedMode: boolean,
 *   getIsPlaying: () => boolean,
 *   getIsPaused: () => boolean,
 *   getIsIntro: () => boolean,
 *   getCurrentBeat: () => number,
 *   getCurrentChordIdx: () => number,
 *   getPaddedChordCount: () => number,
 *   getTempo: () => number,
 *   ensureWalkingBassGenerator: () => Promise<unknown>,
 *   getAudioContext: () => BaseAudioContext | null,
 *   noteFadeout: number,
 *   stopActiveChordVoices: (audioTime: number, fadeout: number) => void,
 *   rebuildPreparedCompingPlans: (currentKey: number) => void,
 *   buildPreparedBassPlan: () => void,
 *   getCurrentKey: () => number,
 *   preloadNearTermSamples: () => Promise<unknown>,
 *   startPlayback: () => Promise<void>,
 *   stopPlayback: () => void,
 *   togglePausePlayback: () => void,
 *   applyMixerSettings: () => void
 * }} options
 * @returns {EmbeddedDrillRuntimeOptions}
 */
export function createEmbeddedDrillRuntimeAppOptions({
  dom,
  stopIfPlaying,
  clearProgressionEditingState,
  closeProgressionManager,
  setCustomPatternSelection,
  setPatternName,
  setCustomPatternValue,
  setEditorPatternMode,
  syncPatternSelectionFromInput,
  setLastPatternSelectValue,
  syncCustomPatternUI,
  normalizeChordsPerBarForCurrentPattern,
  applyPatternModeAvailability,
  syncPatternPreview,
  applyDisplayMode,
  applyBeatIndicatorVisibility,
  applyCurrentHarmonyVisibility,
  updateKeyPickerLabels,
  refreshDisplayedHarmony,
  fitHarmonyDisplay,
  validateCustomPattern,
  getPatternErrorText,
  getCurrentPatternString,
  getCurrentPatternMode,
  normalizePatternString,
  normalizePresetName,
  normalizePatternMode,
  normalizeCompingStyle,
  normalizeRepetitionsPerKey,
  normalizeDisplayMode,
  normalizeHarmonyDisplayMode,
  getSwingRatio,
  getCompingStyle,
  getDrumsMode,
  isWalkingBassEnabled,
  getRepetitionsPerKey,
  isEmbeddedMode,
  getIsPlaying,
  getIsPaused,
  getIsIntro,
  getCurrentBeat,
  getCurrentChordIdx,
  getPaddedChordCount,
  getTempo,
  ensureWalkingBassGenerator,
  getAudioContext,
  noteFadeout,
  stopActiveChordVoices,
  rebuildPreparedCompingPlans,
  buildPreparedBassPlan,
  getCurrentKey,
  preloadNearTermSamples,
  startPlayback,
  stopPlayback,
  togglePausePlayback,
  applyMixerSettings
}) {
  return createEmbeddedDrillRuntimeOptions({
    patternAdapterOptions: {
      stopIfPlaying,
      clearProgressionEditingState,
      closeProgressionManager,
      setCustomPatternSelection,
      setPatternName,
      setCustomPatternValue,
      setEditorPatternMode,
      syncPatternSelectionFromInput,
      setLastPatternSelectValue,
      syncCustomPatternUI,
      normalizeChordsPerBarForCurrentPattern,
      applyPatternModeAvailability,
      syncPatternPreview,
      applyDisplayMode,
      applyBeatIndicatorVisibility,
      applyCurrentHarmonyVisibility,
      updateKeyPickerLabels,
      refreshDisplayedHarmony,
      fitHarmonyDisplay,
      validateCustomPattern,
      getPatternErrorText,
      getCurrentPatternString,
      normalizePatternString,
      normalizePresetName,
      normalizePatternMode
    },
    playbackSettingsAdapterOptions: {
      setTempo: (value) => {
        if (dom.tempoSlider) {
          dom.tempoSlider.value = String(value);
          dom.tempoValue.textContent = dom.tempoSlider.value;
        }
      },
      setTransposition: (value) => {
        if (dom.transpositionSelect) {
          dom.transpositionSelect.value = String(value);
        }
      },
      setCompingStyle: (value) => {
        if (dom.compingStyle) {
          dom.compingStyle.value = normalizeCompingStyle(value);
        }
      },
      setDrumsMode: (value) => {
        if (dom.drumsSelect) {
          dom.drumsSelect.value = value;
        }
      },
      setWalkingBassEnabled: (value) => {
        if (dom.walkingBass) {
          dom.walkingBass.checked = Boolean(value);
        }
      },
      setRepetitionsPerKey: (value) => {
        if (dom.repetitionsPerKey) {
          dom.repetitionsPerKey.value = String(normalizeRepetitionsPerKey(value));
        }
      },
      setDisplayMode: (value) => {
        if (dom.displayMode) {
          dom.displayMode.value = normalizeDisplayMode(value);
        }
      },
      setHarmonyDisplayMode: (value) => {
        if (dom.harmonyDisplayMode) {
          dom.harmonyDisplayMode.value = normalizeHarmonyDisplayMode(value);
        }
      },
      setShowBeatIndicator: (value) => {
        if (dom.showBeatIndicator) {
          dom.showBeatIndicator.checked = Boolean(value);
        }
      },
      setHideCurrentHarmony: (value) => {
        if (dom.hideCurrentHarmony) {
          dom.hideCurrentHarmony.checked = Boolean(value);
        }
      },
      setMasterVolume: (value) => {
        if (dom.masterVolume) {
          dom.masterVolume.value = value;
        }
      },
      setBassVolume: (value) => {
        if (dom.bassVolume) {
          dom.bassVolume.value = value;
        }
      },
      setStringsVolume: (value) => {
        if (dom.stringsVolume) {
          dom.stringsVolume.value = value;
        }
      },
      setDrumsVolume: (value) => {
        if (dom.drumsVolume) {
          dom.drumsVolume.value = value;
        }
      },
      applyMixerSettings,
      getPlaybackSettingsSnapshot: () => ({
        tempo: Number(dom.tempoSlider?.value || 0),
        swingRatio: getSwingRatio(),
        transposition: dom.transpositionSelect?.value || '0',
        compingStyle: getCompingStyle(),
        drumsMode: getDrumsMode(),
        customMediumSwingBass: isWalkingBassEnabled(),
        repetitionsPerKey: getRepetitionsPerKey(),
        displayMode: normalizeDisplayMode(dom.displayMode?.value),
        harmonyDisplayMode: normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value),
        showBeatIndicator: dom.showBeatIndicator?.checked !== false,
        hideCurrentHarmony: dom.hideCurrentHarmony?.checked === true,
        masterVolume: Number(dom.masterVolume?.value || 0),
        bassVolume: Number(dom.bassVolume?.value || 0),
        stringsVolume: Number(dom.stringsVolume?.value || 0),
        drumsVolume: Number(dom.drumsVolume?.value || 0)
      })
    },
    playbackStateOptions: {
      isEmbeddedMode,
      getIsPlaying,
      getIsPaused,
      getIsIntro,
      getCurrentBeat,
      getCurrentChordIdx,
      getPaddedChordCount,
      getCurrentPatternString,
      getCurrentPatternMode,
      getPatternErrorText: () => String(dom.patternError?.textContent || ''),
      hasPatternError: () => !dom.patternError?.classList.contains('hidden'),
      getTempo,
      getSwingRatio
    },
    playbackControllerOptions: {
      ensureWalkingBassGenerator,
      isPlaying: getIsPlaying,
      getAudioContext,
      noteFadeout,
      stopActiveChordVoices,
      rebuildPreparedCompingPlans,
      buildPreparedBassPlan,
      getCurrentKey,
      preloadNearTermSamples,
      validateCustomPattern,
      startPlayback,
      stopPlayback,
      togglePausePlayback
    }
  });
}
