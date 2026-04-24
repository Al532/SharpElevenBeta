export type DrillEventTargetLike = EventTarget | {
  addEventListener?: (...args: unknown[]) => void;
};

export type DrillVisibilityTargetLike = DrillEventTargetLike & {
  hidden?: boolean;
};

export type DrillUiAnalyticsLink = {
  element?: HTMLElement | null;
  trackEvent?: (eventName: string, props?: Record<string, unknown>) => void;
};

export type DrillUiWelcomeControls = Record<string, unknown>;

export type DrillUiDomInputControl = {
  value?: string;
  checked?: boolean;
  textContent?: string | null;
  focus?: () => void;
  select?: () => void;
  addEventListener?: (eventName: string, listener: (...args: unknown[]) => void) => void;
};

export type DrillUiSettingsDom = {
  tempoSlider?: DrillUiDomInputControl;
  repetitionsPerKey?: DrillUiDomInputControl;
  patternSelect?: DrillUiDomInputControl;
  patternName?: DrillUiDomInputControl;
  customPattern?: DrillUiDomInputControl;
  patternMode?: DrillUiDomInputControl;
  patternModeBoth?: DrillUiDomInputControl;
  chordsPerBar?: DrillUiDomInputControl;
  doubleTimeToggle?: DrillUiDomInputControl;
  majorMinor?: DrillUiDomInputControl;
  compingStyle?: DrillUiDomInputControl;
  walkingBass?: DrillUiDomInputControl;
  stringsVolume?: DrillUiDomInputControl;
  drumsSelect?: DrillUiDomInputControl;
  debugToggle?: DrillUiDomInputControl;
  resetSettings?: DrillUiDomInputControl;
  pianoSettingsCopy?: DrillUiDomInputControl;
  pianoSettingsJson?: DrillUiDomInputControl;
  pianoSettingsApply?: DrillUiDomInputControl;
  pianoSettingsReset?: DrillUiDomInputControl;
} & Record<string, unknown>;

export type DrillUiSettingsControls = {
  dom?: DrillUiSettingsDom;
  saveSettings?: () => void;
  stopPlaybackIfRunning?: () => void;
  trackEvent?: (eventName: string, props?: Record<string, unknown>) => void;
  getTempoBucket?: () => string | number;
  getRepetitionsPerKey?: () => number;
  getSelectedChordsPerBar?: () => number;
  isPlaying?: () => boolean;
  getAudioContext?: () => BaseAudioContext | null;
  noteFadeout?: number;
  stopActiveChordVoices?: (audioTime: number, fadeout: number) => void;
  rebuildPreparedCompingPlans?: (currentKey: number) => void;
  getCurrentKey?: () => number;
  preloadNearTermSamples?: () => Promise<unknown>;
  getCompingStyle?: () => string;
  isWalkingBassEnabled?: () => boolean;
  ensureWalkingBassGenerator?: () => Promise<unknown>;
  buildPreparedBassPlan?: () => void;
  applyMixerSettings?: () => void;
  isChordsEnabled?: () => boolean;
  setAnalyticsDebugEnabled?: (enabled: boolean) => void;
  resetPlaybackSettings?: () => void;
};

export type DrillUiPianoPresetControls = {
  dom?: DrillUiSettingsDom;
  refreshPianoSettingsJson?: () => void;
  setPianoMidiStatus?: (message: string) => void;
  applyPianoPresetFromJsonText?: (jsonText: string) => void;
  getPianoMidiSettings?: () => { enabled?: boolean } | null | undefined;
  refreshMidiInputs?: () => Promise<unknown>;
  normalizePianoFadeSettings?: <T>(settings: T) => T;
  normalizePianoMidiSettings?: <T>(settings: T) => T;
  defaultPianoFadeSettings?: unknown;
  defaultPianoMidiSettings?: unknown;
  setPianoFadeSettings?: (settings: unknown) => void;
  setPianoMidiSettings?: (settings: unknown) => void;
  stopAllMidiPianoVoices?: (force?: boolean) => void;
  syncPianoToolsUi?: () => void;
  attachMidiInput?: () => void;
  saveSettings?: () => void;
  clipboard?: Clipboard;
  alert?: (message?: string) => void;
};

export type DrillUiLifecycleControls = {
  visibilityTarget?: DrillVisibilityTargetLike;
  userGestureTarget?: DrillEventTargetLike;
  getIsPlaying?: () => boolean;
  getIsPaused?: () => boolean;
  getAudioContext?: () => BaseAudioContext | null;
  resumeAudioContext?: () => Promise<unknown> | unknown;
  togglePausePlayback?: () => Promise<unknown> | unknown;
};

export type DrillUiBootstrapScreenContext = {
  initializeSocialShareLinks?: () => void;
  loadDefaultProgressions?: () => Promise<unknown>;
  loadPatternHelp?: () => Promise<unknown>;
  loadWelcomeStandards?: () => Promise<unknown>;
  renderProgressionOptions?: (selectedValue?: string) => void;
  getInitialProgressionOption?: () => string;
  loadSettings?: () => void;
  applySilentDefaultPresetResetMigration?: () => boolean;
  getSavedPatternSelection?: () => string;
  saveSettings?: () => void;
  buildKeyCheckboxes?: () => void;
  updateKeyPickerLabels?: () => void;
  applyDisplayMode?: () => void;
  hasCustomPatternValue?: () => boolean;
  setCustomPatternValue?: (value: string) => void;
  getSelectedProgressionPattern?: () => string;
  hasSelectedProgression?: () => boolean;
  setPatternNameFromSelectedProgression?: () => void;
  setPatternNameNormalized?: () => void;
  setEditorPatternModeFromSelectedProgression?: () => void;
  setEditorPatternModeNormalized?: () => void;
  customPatternOptionValue?: string;
  applySavedPatternSelection?: (optionValue?: string) => boolean;
  syncPatternSelectionFromInput?: () => void;
  syncProgressionManagerState?: () => void;
  syncCustomPatternUI?: () => void;
  normalizeChordsPerBarForCurrentPattern?: () => void;
  applyPatternModeAvailability?: () => void;
  setLastPatternSelectValue?: () => void;
  shouldPromptForDefaultProgressionsUpdate?: () => boolean;
  promptForUpdatedDefaultProgressions?: () => void;
  hasAppliedDefaultProgressionsFingerprint?: () => boolean;
  setAppliedDefaultProgressionsFingerprint?: (value: string) => void;
  getDefaultProgressionsFingerprint?: () => string;
  ensurePageSampleWarmup?: () => void;
  consumePendingPracticeSessionIntoUi?: (options?: { afterApply?: () => void }) => boolean;
  setWelcomeOverlayVisible?: (visible: boolean) => void;
  maybeShowWelcomeOverlay?: () => void;
};

export type DrillUiBootstrapRuntimeControlsContext = {
  dom?: Record<string, unknown>;
  onStartStopClick?: () => void;
  onPauseClick?: () => void;
  onTempoInput?: () => void;
  onNextPreviewValueChange?: () => void;
  onNextPreviewUnitToggleChange?: () => void;
  onSelectAllKeys?: () => void;
  onInvertKeys?: () => void;
  onClearKeys?: () => void;
  onSaveKeyPreset?: () => void;
  onLoadKeyPreset?: () => void;
  onTranspositionChange?: () => void;
  onDisplayModeChange?: () => void;
  onHarmonyDisplayModeChange?: () => void;
  onSymbolToggleChange?: () => void;
  onShowBeatIndicatorChange?: () => void;
  onHideCurrentHarmonyChange?: () => void;
  onMasterVolumeInput?: () => void;
  onBassVolumeInput?: () => void;
  onDrumsVolumeInput?: () => void;
  onMasterVolumeChange?: () => void;
  onBassVolumeChange?: () => void;
  onStringsVolumeChange?: () => void;
  onDrumsVolumeChange?: () => void;
};

export type DrillUiBootstrapScreenDom = {
  customPattern?: { value?: string };
  patternName?: { value?: string };
  patternMode?: { value?: string };
  patternSelect?: { value?: string };
} & Record<string, unknown>;

export type DrillUiBootstrapScreenState = {
  getProgressions?: () => Record<string, unknown>;
  getSavedPatternSelection?: () => string;
  getShouldPromptForDefaultProgressionsUpdate?: () => boolean;
  getAppliedDefaultProgressionsFingerprint?: () => string;
  setAppliedDefaultProgressionsFingerprint?: (value: string) => void;
  setLastPatternSelectValue?: (value: string) => void;
};

export type DrillUiBootstrapScreenConstants = {
  customPatternOptionValue?: string;
};

export type DrillUiBootstrapScreenHelpers = {
  initializeSocialShareLinks?: () => void;
  loadDefaultProgressions?: () => Promise<unknown>;
  loadPatternHelp?: () => Promise<unknown>;
  loadWelcomeStandards?: () => Promise<unknown>;
  renderProgressionOptions?: (selectedValue?: string) => void;
  loadSettings?: () => void;
  applySilentDefaultPresetResetMigration?: () => boolean;
  saveSettings?: () => void;
  buildKeyCheckboxes?: () => void;
  updateKeyPickerLabels?: () => void;
  applyDisplayMode?: () => void;
  getSelectedProgressionPattern?: () => string;
  hasSelectedProgression?: () => boolean;
  getSelectedProgressionName?: () => string;
  normalizePresetName?: (value: unknown) => string;
  setEditorPatternMode?: (value: string) => void;
  getSelectedProgressionMode?: () => string;
  normalizePatternMode?: (value: unknown) => string;
  syncPatternSelectionFromInput?: () => void;
  syncProgressionManagerState?: () => void;
  syncCustomPatternUI?: () => void;
  normalizeChordsPerBarForCurrentPattern?: () => void;
  applyPatternModeAvailability?: () => void;
  promptForUpdatedDefaultProgressions?: () => void;
  getDefaultProgressionsFingerprint?: () => string;
  ensurePageSampleWarmup?: () => void;
  consumePendingPracticeSessionIntoUi?: (options?: { afterApply?: () => void }) => boolean;
  setWelcomeOverlayVisible?: (visible: boolean) => void;
  maybeShowWelcomeOverlay?: () => void;
};

export type DrillUiBootstrapRuntimeControlsDom = {
  tempoValue?: { textContent?: string | null };
  tempoSlider?: { value?: string };
  nextPreviewUnitToggle?: { checked?: boolean };
  transpositionSelect?: { value?: string };
  displayMode?: { value?: string };
  harmonyDisplayMode?: { value?: string };
  masterVolume?: { value?: string };
  bassVolume?: { value?: string };
  stringsVolume?: { value?: string };
  drumsVolume?: { value?: string };
} & Record<string, unknown>;

export type DrillUiBootstrapRuntimeControlsState = {
  getIsPlaying?: () => boolean;
  getAudioContext?: () => BaseAudioContext | null;
  getCurrentKey?: () => number;
  getNextPreviewLeadUnit?: () => string;
  getNextPreviewInputUnit?: () => string;
};

export type DrillUiBootstrapRuntimeControlsConstants = {
  noteFadeout?: number;
  nextPreviewUnitBars?: string;
  nextPreviewUnitSeconds?: string;
};

export type DrillUiBootstrapRuntimeControlsHelpers = {
  stop?: () => void;
  start?: () => void;
  togglePause?: () => void;
  syncNextPreviewControlDisplay?: () => void;
  refreshDisplayedHarmony?: () => void;
  stopActiveChordVoices?: (audioTime: number, fadeout: number) => void;
  rebuildPreparedCompingPlans?: (currentKey: number) => void;
  buildPreparedBassPlan?: () => void;
  commitNextPreviewValueFromInput?: () => void;
  saveSettings?: () => void;
  trackEvent?: (eventName: string, props?: Record<string, unknown>) => void;
  formatPreviewNumber?: (value: unknown, maximumFractionDigits?: number) => string;
  getNextPreviewLeadBars?: () => number;
  getNextPreviewLeadSeconds?: () => number;
  convertNextPreviewValueToUnit?: (value: string) => void;
  setNextPreviewInputUnit?: (value: string) => void;
  setAllKeysEnabled?: (enabled: boolean) => void;
  getEnabledKeyCount?: () => number;
  invertKeysEnabled?: () => void;
  saveCurrentKeySelectionPreset?: () => void;
  loadKeySelectionPreset?: () => void;
  updateKeyPickerLabels?: () => void;
  syncPatternPreview?: () => void;
  applyDisplayMode?: () => void;
  normalizeDisplayMode?: (value: unknown) => string;
  normalizeHarmonyDisplayMode?: (value: unknown) => string;
  applyBeatIndicatorVisibility?: () => void;
  applyCurrentHarmonyVisibility?: () => void;
  fitHarmonyDisplay?: () => void;
  applyMixerSettings?: () => void;
};
