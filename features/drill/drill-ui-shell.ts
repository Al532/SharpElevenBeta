type InitializeDrillScreenOptions = Record<string, any>;

export async function initializeDrillScreen({
  initializeSocialShareLinks,
  loadDefaultProgressions,
  loadPatternHelp,
  loadWelcomeStandards,
  renderProgressionOptions,
  getInitialProgressionOption,
  loadSettings,
  applySilentDefaultPresetResetMigration,
  getSavedPatternSelection,
  saveSettings,
  buildKeyCheckboxes,
  updateKeyPickerLabels,
  applyDisplayMode,
  hasCustomPatternValue,
  setCustomPatternValue,
  getSelectedProgressionPattern,
  hasSelectedProgression,
  setPatternNameFromSelectedProgression,
  setPatternNameNormalized,
  setEditorPatternModeFromSelectedProgression,
  setEditorPatternModeNormalized,
  customPatternOptionValue,
  applySavedPatternSelection,
  syncPatternSelectionFromInput,
  syncProgressionManagerState,
  syncCustomPatternUI,
  normalizeChordsPerBarForCurrentPattern,
  applyPatternModeAvailability,
  setLastPatternSelectValue,
  shouldPromptForDefaultProgressionsUpdate,
  promptForUpdatedDefaultProgressions,
  hasAppliedDefaultProgressionsFingerprint,
  setAppliedDefaultProgressionsFingerprint,
  getDefaultProgressionsFingerprint,
  ensurePageSampleWarmup,
  consumePendingPracticeSessionIntoUi,
  setWelcomeOverlayVisible,
  maybeShowWelcomeOverlay
}: InitializeDrillScreenOptions = {}) {
  initializeSocialShareLinks?.();

  await Promise.all([
    loadDefaultProgressions?.(),
    loadPatternHelp?.(),
    loadWelcomeStandards?.()
  ]);

  renderProgressionOptions?.(getInitialProgressionOption?.() || '');
  loadSettings?.();
  const appliedSilentPresetReset = applySilentDefaultPresetResetMigration?.();
  if (appliedSilentPresetReset) {
    renderProgressionOptions?.(getSavedPatternSelection?.());
    saveSettings?.();
  }
  buildKeyCheckboxes?.();
  updateKeyPickerLabels?.();
  applyDisplayMode?.();
  if (!hasCustomPatternValue?.()) {
    setCustomPatternValue?.(getSelectedProgressionPattern?.());
  }
  if (hasSelectedProgression?.()) {
    setPatternNameFromSelectedProgression?.();
    setEditorPatternModeFromSelectedProgression?.();
  } else {
    setPatternNameNormalized?.();
    setEditorPatternModeNormalized?.();
  }
  if (!applySavedPatternSelection?.(customPatternOptionValue)) {
    syncPatternSelectionFromInput?.();
  }
  syncProgressionManagerState?.();
  syncCustomPatternUI?.();
  normalizeChordsPerBarForCurrentPattern?.();
  applyPatternModeAvailability?.();
  setLastPatternSelectValue?.();

  if (shouldPromptForDefaultProgressionsUpdate?.()) {
    promptForUpdatedDefaultProgressions?.();
  } else if (!hasAppliedDefaultProgressionsFingerprint?.()) {
    setAppliedDefaultProgressionsFingerprint?.(getDefaultProgressionsFingerprint?.());
  }

  ensurePageSampleWarmup?.();
  normalizeChordsPerBarForCurrentPattern?.();

  const importedPendingSession = consumePendingPracticeSessionIntoUi?.({
    afterApply: () => {
      saveSettings?.();
      setWelcomeOverlayVisible?.(false);
    }
  });
  if (importedPendingSession) {
    return;
  }

  maybeShowWelcomeOverlay?.();
}

