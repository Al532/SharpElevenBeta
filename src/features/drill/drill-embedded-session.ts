import type {
  EmbeddedPatternPayload,
  PlaybackSettings
} from '../../core/types/contracts';

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
  setPlaybackEndingCue,
  setPlaybackPerformanceMap,
  setPlaybackStartChordIndex,
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
}: {
  stopIfPlaying?: () => void;
  clearProgressionEditingState?: () => void;
  closeProgressionManager?: () => void;
  setCustomPatternSelection?: () => void;
  setPatternName?: (name: string) => void;
  setCustomPatternValue?: (pattern: string) => void;
  setEditorPatternMode?: (mode: string) => void;
  syncPatternSelectionFromInput?: () => void;
  setLastPatternSelectValue?: () => void;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  setPlaybackEndingCue?: (endingCue: EmbeddedPatternPayload['endingCue'] | null) => void;
  setPlaybackPerformanceMap?: (performanceMap: EmbeddedPatternPayload['performanceMap'] | null) => void;
  setPlaybackStartChordIndex?: (chordIndex: number) => void;
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
  normalizePatternString?: (pattern: string) => string;
  normalizePresetName?: (name: string) => string;
  normalizePatternMode?: (mode: string) => string;
} = {}) {
  return function applyEmbeddedPattern({
    patternName = 'Chart Dev',
    patternString = '',
    endingCue = null,
    performanceMap = null,
    playbackStartChordIndex = null,
    patternMode = 'both',
    tempo = null,
    transposition = null,
    compingStyle = null,
    drumsMode = null,
    customMediumSwingBass = null,
    repetitionsPerKey = 1,
    finitePlayback = false,
    displayMode = null,
    harmonyDisplayMode = null,
    showBeatIndicator = null,
    hideCurrentHarmony = null,
    masterVolume = null,
    bassVolume = null,
    stringsVolume = null,
    drumsVolume = null
  }: Partial<EmbeddedPatternPayload> = {}) {
    const normalizedPattern = normalizePatternString?.(patternString) || String(patternString || '').trim();

    stopIfPlaying?.();
    clearProgressionEditingState?.();
    closeProgressionManager?.();
    setCustomPatternSelection?.();
    setPatternName?.(normalizePresetName?.(patternName) || patternName);
    setCustomPatternValue?.(normalizedPattern);
    setPlaybackEndingCue?.(endingCue || null);
    setPlaybackPerformanceMap?.(performanceMap || null);
    setPlaybackStartChordIndex?.(Number.isFinite(Number(playbackStartChordIndex))
      ? Math.max(0, Math.round(Number(playbackStartChordIndex)))
      : 0);
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
      finitePlayback,
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
      performanceMap,
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
  setFinitePlayback,
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
}: {
  setTempo?: (tempo: number | string) => void;
  setTransposition?: (transposition: number | string) => void;
  setCompingStyle?: (style: string) => void;
  setDrumsMode?: (mode: string) => void;
  setWalkingBassEnabled?: (enabled: boolean) => void;
  setRepetitionsPerKey?: (count: number) => void;
  setFinitePlayback?: (enabled: boolean) => void;
  setDisplayMode?: (mode: string) => void;
  setHarmonyDisplayMode?: (mode: string) => void;
  setShowBeatIndicator?: (visible: boolean) => void;
  setHideCurrentHarmony?: (hidden: boolean) => void;
  setMasterVolume?: (value: string | number) => void;
  setBassVolume?: (value: string | number) => void;
  setStringsVolume?: (value: string | number) => void;
  setDrumsVolume?: (value: string | number) => void;
  applyMixerSettings?: () => void;
  getPlaybackSettingsSnapshot?: () => PlaybackSettings;
  normalizeEmbeddedVolume?: (value: unknown) => string | null;
} = {}) {
  return function applyEmbeddedPlaybackSettings({
    tempo = null,
    transposition = null,
    compingStyle = null,
    drumsMode = null,
    customMediumSwingBass = null,
    repetitionsPerKey = null,
    finitePlayback = null,
    displayMode = null,
    harmonyDisplayMode = null,
    showBeatIndicator = null,
    hideCurrentHarmony = null,
    masterVolume = null,
    bassVolume = null,
    stringsVolume = null,
    drumsVolume = null
  }: PlaybackSettings = {}): PlaybackSettings | undefined {
    if (tempo !== null) setTempo?.(tempo);
    if (transposition !== null) setTransposition?.(transposition);
    if (compingStyle !== null) setCompingStyle?.(compingStyle);
    if (drumsMode !== null) setDrumsMode?.(drumsMode);
    if (customMediumSwingBass !== null) setWalkingBassEnabled?.(customMediumSwingBass);
    if (repetitionsPerKey !== null) setRepetitionsPerKey?.(repetitionsPerKey);
    if (finitePlayback !== null) setFinitePlayback?.(finitePlayback === true);
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
