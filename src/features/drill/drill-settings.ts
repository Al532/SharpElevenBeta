type MixerVolumeDefaults = {
  masterVolume?: number;
  bassVolume?: number;
  stringsVolume?: number;
  drumsVolume?: number;
};

type DrillSettingsToggleControl = {
  checked?: boolean;
};

type DrillSettingsValueControl = {
  value?: string;
};

type DrillSettingsTextControl = {
  textContent?: string;
};

type DrillProgressionEntryLike = {
  name?: string;
  pattern?: string;
  mode?: string;
};

type DrillEditingProgressionSnapshot = {
  name?: string;
  label?: string;
  pattern?: string;
  mode?: string;
};

type DrillEditingState =
  | {
      type: 'edit';
      editingPresetName?: string;
      presetSelectionBeforeEditing?: string;
      snapshot?: DrillEditingProgressionSnapshot | null;
    }
  | {
      type: 'create';
      presetSelectionBeforeEditing?: string;
    };

type DrillAppSettings = {
  enabledKeys?: readonly boolean[];
  pianoFadeSettings?: Record<string, unknown>;
  pianoMidiSettings?: Record<string, unknown>;
  majorMinor?: boolean;
  tempo?: number | string;
  repetitionsPerKey?: number | string;
  transposition?: string;
  chordsPerBar?: number | string;
  compingStyle?: string;
  customMediumSwingBass?: boolean;
  drumsMode?: string;
  displayMode?: string;
  harmonyDisplayMode?: string;
  useMajorTriangleSymbol?: boolean;
  useHalfDiminishedSymbol?: boolean;
  useDiminishedSymbol?: boolean;
  showBeatIndicator?: boolean;
  hideCurrentHarmony?: boolean;
  masterVolume?: string;
  bassVolume?: string;
  stringsVolume?: string;
  drumsVolume?: string;
  nextPreviewLeadValue?: number;
  nextPreviewUnit?: string;
} & Record<string, unknown>;

type DrillSettingsDom = {
  patternSelect?: DrillSettingsValueControl;
  patternName?: DrillSettingsValueControl;
  customPattern?: DrillSettingsValueControl;
  patternMode?: DrillSettingsValueControl;
  tempoSlider?: DrillSettingsValueControl;
  tempoValue?: DrillSettingsTextControl;
  repetitionsPerKey?: DrillSettingsValueControl;
  transpositionSelect?: DrillSettingsValueControl;
  chordsPerBar?: DrillSettingsValueControl;
  majorMinor?: DrillSettingsToggleControl;
  displayMode?: DrillSettingsValueControl;
  harmonyDisplayMode?: DrillSettingsValueControl;
  useMajorTriangleSymbol?: DrillSettingsToggleControl;
  useHalfDiminishedSymbol?: DrillSettingsToggleControl;
  useDiminishedSymbol?: DrillSettingsToggleControl;
  showBeatIndicator?: DrillSettingsToggleControl;
  hideCurrentHarmony?: DrillSettingsToggleControl;
  compingStyle?: DrillSettingsValueControl;
  walkingBass?: DrillSettingsToggleControl;
  drumsSelect?: DrillSettingsValueControl;
  masterVolume?: DrillSettingsValueControl;
  bassVolume?: DrillSettingsValueControl;
  stringsVolume?: DrillSettingsValueControl;
  drumsVolume?: DrillSettingsValueControl;
  welcomeShowNextTime?: DrillSettingsToggleControl;
  debugToggle?: DrillSettingsToggleControl;
} & Record<string, unknown>;

type DrillSettingsState = {
  getEditingProgressionName?: () => string;
  getProgressionSelectionBeforeEditing?: () => string;
  getEditingProgressionSnapshot?: () => DrillEditingProgressionSnapshot | null;
  getIsCreatingProgression?: () => boolean;
  getHasCompletedWelcomeOnboarding?: () => boolean;
  setHasCompletedWelcomeOnboarding?: (value: boolean) => void;
  getShouldShowWelcomeNextTime?: () => boolean;
  setShouldShowWelcomeNextTime?: (value: boolean) => void;
  getProgressions?: () => Record<string, DrillProgressionEntryLike>;
  setProgressions?: (value: Record<string, DrillProgressionEntryLike>) => void;
  getAppliedDefaultProgressionsFingerprint?: () => string;
  setAppliedDefaultProgressionsFingerprint?: (value: string) => void;
  getAcknowledgedDefaultProgressionsVersion?: () => string;
  setAcknowledgedDefaultProgressionsVersion?: (value: string) => void;
  getAppliedOneTimeMigrations?: () => unknown;
  setAppliedOneTimeMigrations?: (value: unknown) => void;
  getNextPreviewLeadValue?: () => number;
  setNextPreviewLeadValue?: (value: number) => void;
  getEnabledKeys?: () => boolean[];
  setEnabledKeys?: (value: boolean[]) => void;
  getPianoFadeSettings?: () => Record<string, unknown>;
  setPianoFadeSettings?: (value: Record<string, unknown>) => void;
  getPianoMidiSettings?: () => Record<string, unknown>;
  setPianoMidiSettings?: (value: Record<string, unknown>) => void;
  getHadStoredProgressions?: () => boolean;
  setHadStoredProgressions?: (value: boolean) => void;
  getSavedPatternSelection?: () => string | null;
  setSavedPatternSelection?: (value: string | null) => void;
  getShouldPersistRecoveredDefaultProgressions?: () => boolean;
  setShouldPersistRecoveredDefaultProgressions?: (value: boolean) => void;
  setLastStandaloneCustomName?: (value: string) => void;
  setLastStandaloneCustomPattern?: (value: string) => void;
  setLastStandaloneCustomMode?: (value: string) => void;
  getDefaultProgressionsVersion?: () => string;
  setEditingProgressionName?: (value: string) => void;
  setProgressionSelectionBeforeEditing?: (value: string) => void;
  setEditingProgressionSnapshot?: (value: DrillEditingProgressionSnapshot) => void;
  setIsCreatingProgression?: (value: boolean) => void;
  setLastPatternSelectValue?: (value: string) => void;
  setShouldPromptForDefaultProgressionsUpdate?: (value: boolean) => void;
} & Record<string, unknown>;

type DrillSettingsHelpers = {
  isEditingPreset?: () => boolean;
  getDefaultProgressionsFingerprint?: () => string;
  getCurrentPatternName?: () => string;
  normalizePatternString?: (value: unknown) => string;
  getCurrentPatternMode?: () => string;
  getRepetitionsPerKey?: () => number;
  getNextPreviewInputUnit?: () => string;
  getSelectedChordsPerBar?: () => number;
  normalizeDisplayMode?: (value: unknown) => string;
  normalizeHarmonyDisplayMode?: (value: unknown) => string;
  getCompingStyle?: () => string;
  isWalkingBassEnabled?: () => boolean;
  isChordsEnabled?: () => boolean;
  getDrumsMode?: () => string;
  syncPianoToolsUi?: () => void;
  applyMixerSettings?: () => void;
  syncNextPreviewControlDisplay?: () => void;
  applyBeatIndicatorVisibility?: () => void;
  applyCurrentHarmonyVisibility?: () => void;
  normalizePresetName?: (value: unknown) => string;
  normalizePatternMode?: (value: unknown) => string;
  resetStandaloneCustomDraft?: () => void;
  getAnalyticsDebugEnabled?: () => boolean;
  syncProgressionManagerState?: () => void;
  applyPatternModeAvailability?: () => void;
  saveSettings?: () => void;
  normalizeAppliedOneTimeMigrations?: (value: unknown) => unknown;
  normalizeProgressionsMap?: (value: unknown) => Record<string, DrillProgressionEntryLike>;
  renderProgressionOptions?: (patternSelect?: unknown) => void;
  setEditorPatternMode?: (value: string) => void;
  normalizeRepetitionsPerKey?: (value: unknown) => number;
  normalizeNextPreviewLeadValue?: (value: unknown) => number;
  setNextPreviewInputUnit?: (value: string) => void;
  normalizeChordsPerBar?: (value: unknown) => number;
  syncDoubleTimeToggle?: () => void;
  normalizeCompingStyle?: (value: unknown) => string;
  shouldApplyMasterVolumeDefault50Migration?: () => boolean;
  normalizePianoFadeSettings?: (value: unknown) => Record<string, unknown>;
  normalizePianoMidiSettings?: (value: unknown) => Record<string, unknown>;
  getProgressionEntry?: (name: string) => DrillProgressionEntryLike | null | undefined;
  createDefaultAppSettings?: () => DrillAppSettings;
  clearProgressionEditingState?: () => void;
  closeProgressionManager?: () => void;
  setPatternSelectValue?: (value: string) => void;
  getSelectedProgressionName?: () => string;
  getSelectedProgressionMode?: () => string;
  applyEnabledKeys?: (enabledKeys: readonly boolean[]) => void;
  stopAllMidiPianoVoices?: (force?: boolean) => void;
  attachMidiInput?: () => void;
  applyDisplayMode?: () => void;
  syncCustomPatternUI?: () => void;
  syncPatternPreview?: () => void;
  refreshDisplayedHarmony?: () => void;
  trackEvent?: (eventName: string, props?: Record<string, unknown>) => void;
} & Record<string, unknown>;

type DrillSettingsConstants = {
  welcomeOnboardingSettingsKey?: string;
  welcomeShowNextTimeSettingsKey?: string;
  welcomeVersionSettingsKey?: string;
  welcomeVersion?: string;
  customPatternOptionValue?: string;
  nextPreviewUnitBars?: string;
  defaultChordsPerBar?: number;
  defaultProgressions?: Record<string, DrillProgressionEntryLike>;
  displayModeKeyOnly?: string;
  displayModeShowBoth?: string;
  drumModeMetronome24?: string;
  drumModeOff?: string;
  defaultMasterVolumePercent?: string;
  defaultPianoFadeSettings?: Record<string, unknown>;
  defaultPianoMidiSettings?: Record<string, unknown>;
} & Record<string, unknown>;

type DrillLoadedSettings = {
  presets?: Record<string, DrillProgressionEntryLike>;
  presetsCleared?: boolean;
  defaultPresetsFingerprintApplied?: string;
  defaultPresetsVersionAcknowledged?: string;
  appliedOneTimeMigrations?: unknown;
  patternSelect?: string;
  customPatternName?: unknown;
  customPattern?: unknown;
  patternMode?: unknown;
  tempo?: string;
  repetitionsPerKey?: unknown;
  transposition?: unknown;
  nextPreviewLeadValue?: unknown;
  nextPreviewLeadBars?: unknown;
  nextPreviewUnit?: string;
  chordsPerBar?: unknown;
  doubleTime?: boolean;
  majorMinor?: boolean;
  displayMode?: unknown;
  hideChords?: boolean;
  harmonyDisplayMode?: unknown;
  useMajorTriangleSymbol?: unknown;
  useHalfDiminishedSymbol?: unknown;
  useDiminishedSymbol?: unknown;
  showBeatIndicator?: unknown;
  hideCurrentHarmony?: unknown;
  compingStyle?: unknown;
  customMediumSwingBass?: unknown;
  chordMode?: boolean;
  drumsMode?: string;
  metronome?: boolean;
  masterVolume?: string;
  bassVolume?: string;
  stringsVolume?: string;
  drumsVolume?: string;
  enabledKeys?: boolean[];
  pianoFadeSettings?: unknown;
  pianoMidiSettings?: unknown;
  editingState?: DrillEditingState | null;
  [key: string]: unknown;
};

function normalizeSavedMixerVolume(value, fallbackValue) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.max(0, Math.min(100, parsed));
  }
  return Number(fallbackValue);
}

export function saveDrillSettings({
  saveSharedPlaybackSettings,
  saveStoredProgressionSettings,
  buildSettingsSnapshot,
  getCompingStyle,
  getDrumsMode,
  isWalkingBassEnabled,
  dom,
  defaultMixerVolumes = {}
}: {
  saveSharedPlaybackSettings?: (value: Record<string, unknown>) => void;
  saveStoredProgressionSettings?: (value: Record<string, unknown>) => void;
  buildSettingsSnapshot?: () => Record<string, unknown>;
  getCompingStyle?: () => string;
  getDrumsMode?: () => string;
  isWalkingBassEnabled?: () => boolean;
  dom?: DrillSettingsDom;
  defaultMixerVolumes?: MixerVolumeDefaults;
} = {}) {
  saveSharedPlaybackSettings?.({
    compingStyle: getCompingStyle?.(),
    drumsMode: getDrumsMode?.(),
    customMediumSwingBass: isWalkingBassEnabled?.(),
    masterVolume: normalizeSavedMixerVolume(dom?.masterVolume?.value, defaultMixerVolumes.masterVolume ?? 50),
    bassVolume: normalizeSavedMixerVolume(dom?.bassVolume?.value, defaultMixerVolumes.bassVolume ?? 100),
    stringsVolume: normalizeSavedMixerVolume(dom?.stringsVolume?.value, defaultMixerVolumes.stringsVolume ?? 100),
    drumsVolume: normalizeSavedMixerVolume(dom?.drumsVolume?.value, defaultMixerVolumes.drumsVolume ?? 100)
  });
  saveStoredProgressionSettings?.(buildSettingsSnapshot?.());
}

export function createDefaultDrillAppSettingsFactory(defaults: DrillAppSettings = {}) {
  const defaultAppSettings: DrillAppSettings = Object.freeze({
    ...defaults,
    enabledKeys: Object.freeze(
      Array.isArray(defaults.enabledKeys) && defaults.enabledKeys.length === 12
        ? defaults.enabledKeys.map(Boolean)
        : new Array(12).fill(true)
    ),
    pianoFadeSettings: Object.freeze({ ...(defaults.pianoFadeSettings || {}) }),
    pianoMidiSettings: Object.freeze({ ...(defaults.pianoMidiSettings || {}) })
  });

  return function createDefaultAppSettings(overrides: DrillAppSettings = {}): DrillAppSettings {
    return {
      ...defaultAppSettings,
      ...overrides,
      enabledKeys: Array.isArray(overrides.enabledKeys) && overrides.enabledKeys.length === 12
        ? overrides.enabledKeys.map(Boolean)
        : [...defaultAppSettings.enabledKeys]
    };
  };
}

export function createDrillSettingsSnapshotBuilder({
  constants = {},
  dom = {},
  state = {},
  helpers = {}
}: {
  constants?: DrillSettingsConstants;
  dom?: DrillSettingsDom;
  state?: DrillSettingsState;
  helpers?: DrillSettingsHelpers;
} = {}) {
  return function buildSettingsSnapshot(): Record<string, unknown> {
    const editingState = helpers.isEditingPreset?.()
      ? {
          type: 'edit',
          editingPresetName: state.getEditingProgressionName?.(),
          presetSelectionBeforeEditing: state.getProgressionSelectionBeforeEditing?.(),
          snapshot: state.getEditingProgressionSnapshot?.()
            ? { ...state.getEditingProgressionSnapshot() }
            : null
        }
      : (state.getIsCreatingProgression?.()
          ? {
              type: 'create',
              presetSelectionBeforeEditing: state.getProgressionSelectionBeforeEditing?.()
            }
          : null);

    return {
      [constants.welcomeOnboardingSettingsKey]: state.getHasCompletedWelcomeOnboarding?.(),
      [constants.welcomeShowNextTimeSettingsKey]: state.getShouldShowWelcomeNextTime?.(),
      [constants.welcomeVersionSettingsKey]: constants.welcomeVersion,
      presets: state.getProgressions?.(),
      presetsCleared: Object.keys(state.getProgressions?.() || {}).length === 0,
      defaultPresetsFingerprintApplied: state.getAppliedDefaultProgressionsFingerprint?.()
        || helpers.getDefaultProgressionsFingerprint?.(),
      defaultPresetsVersionAcknowledged: state.getAcknowledgedDefaultProgressionsVersion?.() || '',
      appliedOneTimeMigrations: state.getAppliedOneTimeMigrations?.(),
      editingState,
      patternSelect: dom.patternSelect?.value,
      customPatternName: helpers.getCurrentPatternName?.(),
      customPattern: helpers.normalizePatternString?.(dom.customPattern?.value),
      patternMode: helpers.getCurrentPatternMode?.(),
      tempo: dom.tempoSlider?.value,
      repetitionsPerKey: helpers.getRepetitionsPerKey?.(),
      transposition: dom.transpositionSelect?.value,
      nextPreviewLeadValue: state.getNextPreviewLeadValue?.(),
      nextPreviewUnit: helpers.getNextPreviewInputUnit?.(),
      chordsPerBar: helpers.getSelectedChordsPerBar?.(),
      doubleTime: helpers.getSelectedChordsPerBar?.() > 1,
      majorMinor: dom.majorMinor?.checked,
      displayMode: helpers.normalizeDisplayMode?.(dom.displayMode?.value),
      harmonyDisplayMode: helpers.normalizeHarmonyDisplayMode?.(dom.harmonyDisplayMode?.value),
      useMajorTriangleSymbol: dom.useMajorTriangleSymbol?.checked !== false,
      useHalfDiminishedSymbol: dom.useHalfDiminishedSymbol?.checked !== false,
      useDiminishedSymbol: dom.useDiminishedSymbol?.checked !== false,
      showBeatIndicator: dom.showBeatIndicator?.checked !== false,
      hideCurrentHarmony: dom.hideCurrentHarmony?.checked === true,
      compingStyle: helpers.getCompingStyle?.(),
      customMediumSwingBass: helpers.isWalkingBassEnabled?.(),
      chordMode: helpers.isChordsEnabled?.(),
      drumsMode: helpers.getDrumsMode?.(),
      masterVolume: dom.masterVolume?.value,
      bassVolume: dom.bassVolume?.value,
      stringsVolume: dom.stringsVolume?.value,
      drumsVolume: dom.drumsVolume?.value,
      enabledKeys: state.getEnabledKeys?.(),
      pianoFadeSettings: state.getPianoFadeSettings?.(),
      pianoMidiSettings: state.getPianoMidiSettings?.()
    };
  };
}

export function createDrillLoadedSettingsFinalizer({
  constants = {},
  dom = {},
  state = {},
  helpers = {}
}: {
  constants?: DrillSettingsConstants;
  dom?: DrillSettingsDom;
  state?: DrillSettingsState;
  helpers?: DrillSettingsHelpers;
} = {}) {
  return function finalizeLoadedSettings() {
    if (!state.getAppliedDefaultProgressionsFingerprint?.() && !state.getHadStoredProgressions?.()) {
      state.setAppliedDefaultProgressionsFingerprint?.(helpers.getDefaultProgressionsFingerprint?.());
    }

    helpers.syncPianoToolsUi?.();
    helpers.applyMixerSettings?.();
    helpers.syncNextPreviewControlDisplay?.();
    helpers.applyBeatIndicatorVisibility?.();
    helpers.applyCurrentHarmonyVisibility?.();

    if (dom.repetitionsPerKey) {
      dom.repetitionsPerKey.value = String(helpers.getRepetitionsPerKey?.());
    }

    if (state.getSavedPatternSelection?.() === constants.customPatternOptionValue || state.getIsCreatingProgression?.()) {
      state.setLastStandaloneCustomName?.(helpers.normalizePresetName?.(dom.patternName?.value));
      state.setLastStandaloneCustomPattern?.(helpers.normalizePatternString?.(dom.customPattern?.value));
      state.setLastStandaloneCustomMode?.(helpers.normalizePatternMode?.(dom.patternMode?.value));
    } else {
      helpers.resetStandaloneCustomDraft?.();
    }

    if (dom.debugToggle) {
      dom.debugToggle.checked = helpers.getAnalyticsDebugEnabled?.();
    }

    helpers.syncProgressionManagerState?.();
    helpers.applyPatternModeAvailability?.();

    if (state.getShouldPersistRecoveredDefaultProgressions?.()) {
      state.setShouldPersistRecoveredDefaultProgressions?.(false);
      helpers.saveSettings?.();
    }
  };
}

export function createDrillLoadedSettingsApplier({
  constants = {},
  dom = {},
  state = {},
  helpers = {}
}: {
  constants?: DrillSettingsConstants;
  dom?: DrillSettingsDom;
  state?: DrillSettingsState;
  helpers?: DrillSettingsHelpers;
} = {}) {
  return function applyLoadedSettings(s: DrillLoadedSettings) {
    if (!s || typeof s !== 'object') return;

    state.setHasCompletedWelcomeOnboarding?.(
      s[constants.welcomeOnboardingSettingsKey] !== undefined
        ? Boolean(s[constants.welcomeOnboardingSettingsKey])
        : true
    );
    state.setShouldShowWelcomeNextTime?.(
      s[constants.welcomeShowNextTimeSettingsKey] !== undefined
        ? Boolean(s[constants.welcomeShowNextTimeSettingsKey])
        : true
    );

    if (s[constants.welcomeVersionSettingsKey] !== constants.welcomeVersion) {
      state.setHasCompletedWelcomeOnboarding?.(false);
    }
    if (dom.welcomeShowNextTime) {
      dom.welcomeShowNextTime.checked = state.getShouldShowWelcomeNextTime?.();
    }

    const hasStoredPresets = Boolean(s.presets && typeof s.presets === 'object' && !Array.isArray(s.presets));
    const storedPresetCount = hasStoredPresets ? Object.keys(s.presets).length : 0;
    const storedEmptyListWasIntentional = s.presetsCleared === true;
    state.setHadStoredProgressions?.(storedPresetCount > 0);

    const storedDefaultPresetsFingerprint = typeof s.defaultPresetsFingerprintApplied === 'string'
      ? s.defaultPresetsFingerprintApplied
      : '';
    const storedAcknowledgedVersion = typeof s.defaultPresetsVersionAcknowledged === 'string'
      ? s.defaultPresetsVersionAcknowledged
      : '';

    state.setAppliedOneTimeMigrations?.(helpers.normalizeAppliedOneTimeMigrations?.(s.appliedOneTimeMigrations));
    state.setAppliedDefaultProgressionsFingerprint?.(storedDefaultPresetsFingerprint);
    state.setAcknowledgedDefaultProgressionsVersion?.(storedAcknowledgedVersion);
    state.setSavedPatternSelection?.(typeof s.patternSelect === 'string' ? s.patternSelect : null);

    if (hasStoredPresets && (storedPresetCount > 0 || storedEmptyListWasIntentional)) {
      state.setProgressions?.(helpers.normalizeProgressionsMap?.(s.presets));
    } else if (hasStoredPresets && storedPresetCount === 0 && Object.keys(constants.defaultProgressions || {}).length > 0) {
      state.setProgressions?.(helpers.normalizeProgressionsMap?.(constants.defaultProgressions));
      state.setShouldPersistRecoveredDefaultProgressions?.(true);
    }

    helpers.renderProgressionOptions?.(s.patternSelect);
    if (s.patternSelect !== undefined && dom.patternSelect) dom.patternSelect.value = s.patternSelect;
    if (s.customPatternName !== undefined && dom.patternName) {
      dom.patternName.value = helpers.normalizePresetName?.(s.customPatternName);
    }
    if (s.customPattern !== undefined && dom.customPattern) {
      dom.customPattern.value = helpers.normalizePatternString?.(s.customPattern);
    }
    if (s.patternMode !== undefined && dom.patternMode) {
      helpers.setEditorPatternMode?.(helpers.normalizePatternMode?.(s.patternMode));
    }
    if (s.tempo !== undefined) {
      dom.tempoSlider.value = s.tempo;
      dom.tempoValue.textContent = s.tempo;
    }
    if (s.repetitionsPerKey !== undefined && dom.repetitionsPerKey) {
      dom.repetitionsPerKey.value = String(helpers.normalizeRepetitionsPerKey?.(s.repetitionsPerKey));
    }
    if (s.transposition !== undefined && dom.transpositionSelect) {
      dom.transpositionSelect.value = String(s.transposition);
    }
    if (s.nextPreviewLeadValue !== undefined) {
      state.setNextPreviewLeadValue?.(helpers.normalizeNextPreviewLeadValue?.(s.nextPreviewLeadValue));
    } else if (s.nextPreviewLeadBars !== undefined) {
      state.setNextPreviewLeadValue?.(helpers.normalizeNextPreviewLeadValue?.(s.nextPreviewLeadBars));
    }
    if (s.nextPreviewUnit !== undefined) {
      helpers.setNextPreviewInputUnit?.(s.nextPreviewUnit);
    } else {
      helpers.setNextPreviewInputUnit?.(constants.nextPreviewUnitBars);
    }
    if (dom.chordsPerBar) {
      const storedChordsPerBar = s.chordsPerBar !== undefined
        ? s.chordsPerBar
        : (s.doubleTime ? 2 : constants.defaultChordsPerBar);
      dom.chordsPerBar.value = String(helpers.normalizeChordsPerBar?.(storedChordsPerBar));
      helpers.syncDoubleTimeToggle?.();
    }
    if (s.majorMinor !== undefined && dom.majorMinor) {
      dom.majorMinor.checked = s.majorMinor;
    }
    if (s.displayMode !== undefined && dom.displayMode) {
      dom.displayMode.value = helpers.normalizeDisplayMode?.(s.displayMode);
    } else if (s.hideChords !== undefined && dom.displayMode) {
      dom.displayMode.value = s.hideChords ? constants.displayModeKeyOnly : constants.displayModeShowBoth;
    }
    if (s.harmonyDisplayMode !== undefined && dom.harmonyDisplayMode) {
      dom.harmonyDisplayMode.value = helpers.normalizeHarmonyDisplayMode?.(s.harmonyDisplayMode);
    }
    if (s.useMajorTriangleSymbol !== undefined && dom.useMajorTriangleSymbol) {
      dom.useMajorTriangleSymbol.checked = Boolean(s.useMajorTriangleSymbol);
    }
    if (s.useHalfDiminishedSymbol !== undefined && dom.useHalfDiminishedSymbol) {
      dom.useHalfDiminishedSymbol.checked = Boolean(s.useHalfDiminishedSymbol);
    }
    if (s.useDiminishedSymbol !== undefined && dom.useDiminishedSymbol) {
      dom.useDiminishedSymbol.checked = Boolean(s.useDiminishedSymbol);
    }
    if (s.showBeatIndicator !== undefined && dom.showBeatIndicator) {
      dom.showBeatIndicator.checked = Boolean(s.showBeatIndicator);
    }
    if (s.hideCurrentHarmony !== undefined && dom.hideCurrentHarmony) {
      dom.hideCurrentHarmony.checked = Boolean(s.hideCurrentHarmony);
    }
    if (s.compingStyle !== undefined && dom.compingStyle) {
      dom.compingStyle.value = helpers.normalizeCompingStyle?.(s.compingStyle);
    }
    if (s.customMediumSwingBass !== undefined && dom.walkingBass) {
      dom.walkingBass.checked = Boolean(s.customMediumSwingBass);
    }
    if (s.chordMode !== undefined && s.chordMode === false && dom.stringsVolume) {
      dom.stringsVolume.value = '0';
    }
    if (s.drumsMode !== undefined && dom.drumsSelect) {
      dom.drumsSelect.value = s.drumsMode;
    } else if (s.metronome !== undefined && dom.drumsSelect) {
      dom.drumsSelect.value = s.metronome ? constants.drumModeMetronome24 : constants.drumModeOff;
    }

    const shouldResetMasterVolumeOnce = helpers.shouldApplyMasterVolumeDefault50Migration?.();
    if (dom.masterVolume) {
      dom.masterVolume.value = shouldResetMasterVolumeOnce
        ? constants.defaultMasterVolumePercent
        : (s.masterVolume ?? constants.defaultMasterVolumePercent);
    }
    if (s.bassVolume !== undefined && dom.bassVolume) dom.bassVolume.value = s.bassVolume;
    if (s.stringsVolume !== undefined && dom.stringsVolume) dom.stringsVolume.value = s.stringsVolume;
    if (s.drumsVolume !== undefined && dom.drumsVolume) dom.drumsVolume.value = s.drumsVolume;
    if (s.enabledKeys !== undefined && Array.isArray(s.enabledKeys) && s.enabledKeys.length === 12) {
      state.setEnabledKeys?.(s.enabledKeys);
    }
    state.setPianoFadeSettings?.(
      helpers.normalizePianoFadeSettings?.(s.pianoFadeSettings || constants.defaultPianoFadeSettings)
    );
    state.setPianoMidiSettings?.(
      helpers.normalizePianoMidiSettings?.(s.pianoMidiSettings || constants.defaultPianoMidiSettings)
    );

    const storedEditingState = s.editingState && typeof s.editingState === 'object'
      ? s.editingState
      : null;
    if (storedEditingState?.type === 'edit') {
      const storedEditingName = typeof storedEditingState.editingPresetName === 'string'
        ? storedEditingState.editingPresetName
        : '';
      const progressions = state.getProgressions?.() || {};
      if (storedEditingName && Object.prototype.hasOwnProperty.call(progressions, storedEditingName)) {
        state.setEditingProgressionName?.(storedEditingName);
        state.setProgressionSelectionBeforeEditing?.(
          typeof storedEditingState.presetSelectionBeforeEditing === 'string'
            ? storedEditingState.presetSelectionBeforeEditing
            : storedEditingName
        );
        const snapshot = storedEditingState.snapshot && typeof storedEditingState.snapshot === 'object'
          ? storedEditingState.snapshot
          : null;
        state.setEditingProgressionSnapshot?.(snapshot ? {
          name: typeof snapshot.name === 'string' ? snapshot.name : storedEditingName,
          label: typeof snapshot.label === 'string' ? snapshot.label : (helpers.getProgressionEntry?.(storedEditingName)?.name || ''),
          pattern: typeof snapshot.pattern === 'string' ? snapshot.pattern : (helpers.getProgressionEntry?.(storedEditingName)?.pattern || ''),
          mode: helpers.normalizePatternMode?.(snapshot.mode)
        } : {
          name: storedEditingName,
          label: helpers.getProgressionEntry?.(storedEditingName)?.name || '',
          pattern: helpers.getProgressionEntry?.(storedEditingName)?.pattern || '',
          mode: helpers.normalizePatternMode?.(helpers.getProgressionEntry?.(storedEditingName)?.mode)
        });
        state.setIsCreatingProgression?.(false);
        state.setSavedPatternSelection?.(constants.customPatternOptionValue);
        if (dom.patternSelect) {
          dom.patternSelect.value = constants.customPatternOptionValue;
        }
      }
    } else if (storedEditingState?.type === 'create') {
      state.setIsCreatingProgression?.(true);
      state.setProgressionSelectionBeforeEditing?.(
        typeof storedEditingState.presetSelectionBeforeEditing === 'string'
          ? storedEditingState.presetSelectionBeforeEditing
          : ''
      );
      state.setSavedPatternSelection?.(constants.customPatternOptionValue);
      if (dom.patternSelect) {
        dom.patternSelect.value = constants.customPatternOptionValue;
      }
    }

    state.setShouldPromptForDefaultProgressionsUpdate?.(
      Boolean(state.getHadStoredProgressions?.())
      && state.getAcknowledgedDefaultProgressionsVersion?.() !== state.getDefaultProgressionsVersion?.()
    );
  };
}

export function createPracticePlaybackSettingsResetter({
  dom = {},
  state = {},
  helpers = {}
}: {
  dom?: DrillSettingsDom;
  state?: DrillSettingsState;
  helpers?: DrillSettingsHelpers;
} = {}) {
  return function resetPlaybackSettings() {
    const standardSettings = helpers.createDefaultAppSettings?.();

    const progressions = state.getProgressions?.() || {};
    const firstProgressionKey = Object.keys(progressions)[0] || '';
    if (firstProgressionKey) {
      helpers.clearProgressionEditingState?.();
      helpers.closeProgressionManager?.();
      helpers.setPatternSelectValue?.(firstProgressionKey);
      if (dom.patternName) {
        dom.patternName.value = helpers.getSelectedProgressionName?.();
      }
      if (dom.customPattern) {
        dom.customPattern.value = '';
      }
      helpers.setEditorPatternMode?.(helpers.getSelectedProgressionMode?.());
      state.setLastPatternSelectValue?.(dom.patternSelect?.value || '');
    }

    if (dom.majorMinor) dom.majorMinor.checked = standardSettings.majorMinor;
    if (dom.tempoSlider) dom.tempoSlider.value = String(standardSettings.tempo);
    if (dom.tempoValue) dom.tempoValue.textContent = String(standardSettings.tempo);
    if (dom.repetitionsPerKey) dom.repetitionsPerKey.value = String(standardSettings.repetitionsPerKey);
    if (dom.transpositionSelect) dom.transpositionSelect.value = standardSettings.transposition;
    if (dom.chordsPerBar) dom.chordsPerBar.value = String(standardSettings.chordsPerBar);
    helpers.syncDoubleTimeToggle?.();
    if (dom.compingStyle) dom.compingStyle.value = standardSettings.compingStyle;
    if (dom.walkingBass) dom.walkingBass.checked = standardSettings.customMediumSwingBass;
    if (dom.drumsSelect) dom.drumsSelect.value = standardSettings.drumsMode;
    helpers.applyEnabledKeys?.(standardSettings.enabledKeys);
    if (dom.displayMode) dom.displayMode.value = standardSettings.displayMode;
    if (dom.harmonyDisplayMode) dom.harmonyDisplayMode.value = standardSettings.harmonyDisplayMode;
    if (dom.useMajorTriangleSymbol) dom.useMajorTriangleSymbol.checked = standardSettings.useMajorTriangleSymbol;
    if (dom.useHalfDiminishedSymbol) dom.useHalfDiminishedSymbol.checked = standardSettings.useHalfDiminishedSymbol;
    if (dom.useDiminishedSymbol) dom.useDiminishedSymbol.checked = standardSettings.useDiminishedSymbol;
    if (dom.showBeatIndicator) dom.showBeatIndicator.checked = standardSettings.showBeatIndicator;
    if (dom.hideCurrentHarmony) dom.hideCurrentHarmony.checked = standardSettings.hideCurrentHarmony;
    if (dom.masterVolume) dom.masterVolume.value = standardSettings.masterVolume;
    if (dom.bassVolume) dom.bassVolume.value = standardSettings.bassVolume;
    if (dom.stringsVolume) dom.stringsVolume.value = standardSettings.stringsVolume;
    if (dom.drumsVolume) dom.drumsVolume.value = standardSettings.drumsVolume;

    state.setPianoFadeSettings?.(helpers.normalizePianoFadeSettings?.(standardSettings.pianoFadeSettings));
    state.setPianoMidiSettings?.(helpers.normalizePianoMidiSettings?.(standardSettings.pianoMidiSettings));
    helpers.stopAllMidiPianoVoices?.(true);
    helpers.syncPianoToolsUi?.();
    helpers.attachMidiInput?.();
    state.setNextPreviewLeadValue?.(standardSettings.nextPreviewLeadValue);
    helpers.setNextPreviewInputUnit?.(standardSettings.nextPreviewUnit);
    helpers.applyMixerSettings?.();
    helpers.syncNextPreviewControlDisplay?.();
    helpers.applyDisplayMode?.();
    helpers.applyBeatIndicatorVisibility?.();
    helpers.applyCurrentHarmonyVisibility?.();
    helpers.syncCustomPatternUI?.();
    helpers.syncProgressionManagerState?.();
    helpers.applyPatternModeAvailability?.();
    helpers.syncPatternPreview?.();
    helpers.refreshDisplayedHarmony?.();
    helpers.saveSettings?.();
    helpers.trackEvent?.('settings_reset');
  };
}

export function loadDrillSettings({
  loadStoredProgressionSettings,
  loadStoredKeySelectionPreset,
  applyLoadedSettings,
  finalizeLoadedSettings,
  setSavedKeySelectionPreset
}: {
  loadStoredProgressionSettings?: () => Record<string, unknown> | null;
  loadStoredKeySelectionPreset?: () => unknown;
  applyLoadedSettings?: (value: Record<string, unknown>) => void;
  finalizeLoadedSettings?: () => void;
  setSavedKeySelectionPreset?: (value: unknown) => void;
} = {}) {
  const storedSettings = loadStoredProgressionSettings?.();
  if (storedSettings) {
    applyLoadedSettings?.(storedSettings);
  }
  setSavedKeySelectionPreset?.(loadStoredKeySelectionPreset?.());
  finalizeLoadedSettings?.();
}

