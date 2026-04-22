// @ts-check

/** @typedef {import('../../core/types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */

/**
 * @param {{
 *   stopIfPlaying?: () => void,
 *   clearProgressionEditingState?: () => void,
 *   closeProgressionManager?: () => void,
 *   setCustomPatternSelection?: () => void,
 *   setPatternName?: (name: string) => void,
 *   setCustomPatternValue?: (pattern: string) => void,
 *   setEditorPatternMode?: (mode: string) => void,
 *   syncPatternSelectionFromInput?: () => void,
 *   setLastPatternSelectValue?: () => void,
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
 *   syncCustomPatternUI?: () => void,
 *   normalizeChordsPerBarForCurrentPattern?: () => void,
 *   applyPatternModeAvailability?: () => void,
 *   syncPatternPreview?: () => void,
 *   applyDisplayMode?: () => void,
 *   applyBeatIndicatorVisibility?: () => void,
 *   applyCurrentHarmonyVisibility?: () => void,
 *   updateKeyPickerLabels?: () => void,
 *   refreshDisplayedHarmony?: () => void,
 *   fitHarmonyDisplay?: () => void,
 *   validateCustomPattern?: () => boolean,
 *   getPatternErrorText?: () => string,
 *   getCurrentPatternString?: () => string,
 *   normalizePatternString?: (pattern: string) => string,
 *   normalizePresetName?: (name: string) => string,
 *   normalizePatternMode?: (mode: string) => string
 * }} [options]
 * @returns {(payload?: Partial<EmbeddedPatternPayload>) => { ok: boolean, errorMessage: string | null, normalizedPattern: string, currentPatternString: string | undefined }}
 */
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
  /**
   * @param {Partial<EmbeddedPatternPayload>} [payload]
   */
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

/**
 * @param {{
 *   setTempo?: (tempo: number | string) => void,
 *   setTransposition?: (transposition: number | string) => void,
 *   setCompingStyle?: (style: string) => void,
 *   setDrumsMode?: (mode: string) => void,
 *   setWalkingBassEnabled?: (enabled: boolean) => void,
 *   setRepetitionsPerKey?: (count: number) => void,
 *   setDisplayMode?: (mode: string) => void,
 *   setHarmonyDisplayMode?: (mode: string) => void,
 *   setShowBeatIndicator?: (visible: boolean) => void,
 *   setHideCurrentHarmony?: (hidden: boolean) => void,
 *   setMasterVolume?: (value: string | number) => void,
 *   setBassVolume?: (value: string | number) => void,
 *   setStringsVolume?: (value: string | number) => void,
 *   setDrumsVolume?: (value: string | number) => void,
 *   applyMixerSettings?: () => void,
 *   getPlaybackSettingsSnapshot?: () => PlaybackSettings,
 *   normalizeEmbeddedVolume?: (value: unknown) => string | null
 * }} [options]
 * @returns {(settings?: PlaybackSettings) => PlaybackSettings | undefined}
 */
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
  /**
   * @param {PlaybackSettings} [settings]
   */
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
