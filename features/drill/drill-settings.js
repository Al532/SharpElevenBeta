export function saveDrillSettings({
  saveSharedPlaybackSettings,
  saveStoredProgressionSettings,
  buildSettingsSnapshot,
  getCompingStyle,
  getDrumsMode,
  isWalkingBassEnabled,
  dom
} = {}) {
  saveSharedPlaybackSettings?.({
    compingStyle: getCompingStyle?.(),
    drumsMode: getDrumsMode?.(),
    customMediumSwingBass: isWalkingBassEnabled?.(),
    masterVolume: Number(dom?.masterVolume?.value || 0),
    bassVolume: Number(dom?.bassVolume?.value || 0),
    stringsVolume: Number(dom?.stringsVolume?.value || 0),
    drumsVolume: Number(dom?.drumsVolume?.value || 0)
  });
  saveStoredProgressionSettings?.(buildSettingsSnapshot?.());
}

export function createDefaultDrillAppSettingsFactory(defaults = {}) {
  const defaultAppSettings = Object.freeze({
    ...defaults,
    enabledKeys: Object.freeze(
      Array.isArray(defaults.enabledKeys) && defaults.enabledKeys.length === 12
        ? defaults.enabledKeys.map(Boolean)
        : new Array(12).fill(true)
    ),
    pianoFadeSettings: Object.freeze({ ...(defaults.pianoFadeSettings || {}) }),
    pianoMidiSettings: Object.freeze({ ...(defaults.pianoMidiSettings || {}) })
  });

  return function createDefaultAppSettings(overrides = {}) {
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
} = {}) {
  return function buildSettingsSnapshot() {
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
} = {}) {
  return function applyLoadedSettings(s) {
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
      dom.stringsVolume.value = 0;
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

export function createDrillPlaybackSettingsResetter({
  dom = {},
  state = {},
  helpers = {}
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
} = {}) {
  const storedSettings = loadStoredProgressionSettings?.();
  if (storedSettings) {
    applyLoadedSettings?.(storedSettings);
  }
  setSavedKeySelectionPreset?.(loadStoredKeySelectionPreset?.());
  finalizeLoadedSettings?.();
}
