export function createEmbeddedPatternAdapter({
  stopIfPlaying,
  clearProgressionEditingState,
  closeProgressionManager,
  setCustomPatternSelection,
  setPatternName,
  setCustomPatternValue,
  setEditorPatternMode,
  syncPatternSelectionFromInput,
  setLastPatternSelectValue,
  applyEmbeddedPlaybackSettings,
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
} = {}) {
  return function applyEmbeddedPattern({
    patternName = 'Chart Dev',
    patternString = '',
    patternMode = 'both',
    tempo = null,
    transposition = null,
    compingStyle = null,
    drumsMode = null,
    customMediumSwingBass = null,
    repetitionsPerKey = 1,
    displayMode = null,
    harmonyDisplayMode = null,
    showBeatIndicator = null,
    hideCurrentHarmony = null,
    masterVolume = null,
    bassVolume = null,
    stringsVolume = null,
    drumsVolume = null
  } = {}) {
    const normalizedPattern = normalizePatternString?.(patternString) || String(patternString || '').trim();

    stopIfPlaying?.();
    clearProgressionEditingState?.();
    closeProgressionManager?.();
    setCustomPatternSelection?.();
    setPatternName?.(normalizePresetName?.(patternName) || patternName);
    setCustomPatternValue?.(normalizedPattern);
    setEditorPatternMode?.(normalizePatternMode?.(patternMode || 'both') || patternMode || 'both');
    syncPatternSelectionFromInput?.();
    setLastPatternSelectValue?.();

    applyEmbeddedPlaybackSettings?.({
      tempo,
      transposition,
      compingStyle,
      drumsMode,
      customMediumSwingBass,
      repetitionsPerKey,
      displayMode,
      harmonyDisplayMode,
      showBeatIndicator,
      hideCurrentHarmony,
      masterVolume,
      bassVolume,
      stringsVolume,
      drumsVolume
    });

    syncCustomPatternUI?.();
    normalizeChordsPerBarForCurrentPattern?.();
    applyPatternModeAvailability?.();
    syncPatternPreview?.();
    applyDisplayMode?.();
    applyBeatIndicatorVisibility?.();
    applyCurrentHarmonyVisibility?.();
    updateKeyPickerLabels?.();
    refreshDisplayedHarmony?.();
    fitHarmonyDisplay?.();

    const isValid = validateCustomPattern?.();
    return {
      ok: Boolean(isValid),
      errorMessage: isValid ? null : String(getPatternErrorText?.() || 'Invalid custom pattern'),
      normalizedPattern,
      currentPatternString: getCurrentPatternString?.()
    };
  };
}

export function createEmbeddedPlaybackSettingsAdapter({
  setTempo,
  setTransposition,
  setCompingStyle,
  setDrumsMode,
  setWalkingBassEnabled,
  setRepetitionsPerKey,
  setDisplayMode,
  setHarmonyDisplayMode,
  setShowBeatIndicator,
  setHideCurrentHarmony,
  setMasterVolume,
  setBassVolume,
  setStringsVolume,
  setDrumsVolume,
  applyMixerSettings,
  getPlaybackSettingsSnapshot,
  normalizeEmbeddedVolume
} = {}) {
  return function applyEmbeddedPlaybackSettings({
    tempo = null,
    transposition = null,
    compingStyle = null,
    drumsMode = null,
    customMediumSwingBass = null,
    repetitionsPerKey = null,
    displayMode = null,
    harmonyDisplayMode = null,
    showBeatIndicator = null,
    hideCurrentHarmony = null,
    masterVolume = null,
    bassVolume = null,
    stringsVolume = null,
    drumsVolume = null
  } = {}) {
    if (tempo !== null) setTempo?.(tempo);
    if (transposition !== null) setTransposition?.(transposition);
    if (compingStyle !== null) setCompingStyle?.(compingStyle);
    if (drumsMode !== null) setDrumsMode?.(drumsMode);
    if (customMediumSwingBass !== null) setWalkingBassEnabled?.(customMediumSwingBass);
    if (repetitionsPerKey !== null) setRepetitionsPerKey?.(repetitionsPerKey);
    if (displayMode !== null) setDisplayMode?.(displayMode);
    if (harmonyDisplayMode !== null) setHarmonyDisplayMode?.(harmonyDisplayMode);
    if (showBeatIndicator !== null) setShowBeatIndicator?.(showBeatIndicator);
    if (hideCurrentHarmony !== null) setHideCurrentHarmony?.(hideCurrentHarmony);

    const normalizedMaster = normalizeEmbeddedVolume?.(masterVolume);
    if (normalizedMaster !== null && normalizedMaster !== undefined) setMasterVolume?.(normalizedMaster);
    const normalizedBass = normalizeEmbeddedVolume?.(bassVolume);
    if (normalizedBass !== null && normalizedBass !== undefined) setBassVolume?.(normalizedBass);
    const normalizedStrings = normalizeEmbeddedVolume?.(stringsVolume);
    if (normalizedStrings !== null && normalizedStrings !== undefined) setStringsVolume?.(normalizedStrings);
    const normalizedDrums = normalizeEmbeddedVolume?.(drumsVolume);
    if (normalizedDrums !== null && normalizedDrums !== undefined) setDrumsVolume?.(normalizedDrums);

    applyMixerSettings?.();
    return getPlaybackSettingsSnapshot?.();
  };
}
