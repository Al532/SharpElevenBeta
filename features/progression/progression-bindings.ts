export function bindProgressionControls({ dom, constants, state, helpers }) {
  const {
    PATTERN_MODE_BOTH,
    PATTERN_MODE_MAJOR,
    PATTERN_MODE_MINOR
  } = constants;
  const {
    applyPatternModeAvailability,
    cancelProgressionEdit,
    clearAllProgressions,
    clearOneChordCycleState,
    clearProgressionEditingState,
    closeProgressionManager,
    ensureSessionStarted,
    getProgressionAnalyticsProps,
    getSelectedProgressionMode,
    getSelectedProgressionName,
    getSelectedProgressionPattern,
    isCustomPatternSelected,
    isEditingProgression,
    isOneChordModeActive,
    markDefaultProgressionsPromptHandled,
    mergeUpdatedDefaultProgressions,
    normalizePatternString,
    normalizeChordsPerBarForCurrentPattern,
    normalizePresetName,
    normalizePresetNameForInput,
    registerSessionAction,
    rememberStandaloneCustomDraft,
    replaceProgressionsWithDefaultList,
    restoreDefaultProgressions,
    saveCurrentProgression,
    setEditorPatternMode,
    setProgressionFeedback,
    stopPlaybackIfRunning,
    startNewProgression,
    syncCustomPatternUI,
    syncPatternPreview,
    syncPatternSelectionFromInput,
    syncProgressionManagerState,
    toggleProgressionManager,
    trackEvent,
    trackProgressionEvent,
    toAnalyticsToken,
    validateCustomPattern
  } = helpers;

  dom.patternSelect.addEventListener('change', () => {
    ensureSessionStarted('pattern_select');
    if (state.suppressPatternSelectChange) {
      state.lastPatternSelectValue = dom.patternSelect.value;
      return;
    }
    const previousPatternSelection = state.lastPatternSelectValue;
    if (previousPatternSelection !== dom.patternSelect.value) {
      stopPlaybackIfRunning();
    }
    clearOneChordCycleState();
    if (isCustomPatternSelected() && !isEditingProgression()) {
      startNewProgression(previousPatternSelection);
      trackEvent('custom_progression_started', {
        previous_selection: previousPatternSelection ? toAnalyticsToken(previousPatternSelection) : 'none'
      });
      registerSessionAction('custom_progression_started');
      state.lastPatternSelectValue = dom.patternSelect.value;
      return;
    }
    if (!isCustomPatternSelected()) {
      clearProgressionEditingState();
      dom.patternName.value = getSelectedProgressionName();
      dom.customPattern.value = getSelectedProgressionPattern();
      setEditorPatternMode(getSelectedProgressionMode());
    }
    if (isCustomPatternSelected() && !isEditingProgression()) {
      rememberStandaloneCustomDraft();
    }
    syncCustomPatternUI();
    normalizeChordsPerBarForCurrentPattern();
    syncProgressionManagerState();
    setProgressionFeedback('');
    validateCustomPattern();
    applyPatternModeAvailability();
    if (!isCustomPatternSelected()) {
      trackProgressionEvent('progression_selected');
      if (previousPatternSelection !== dom.patternSelect.value) {
        trackEvent('preset_changed', {
          progression_id: `preset_${toAnalyticsToken(dom.patternSelect.value)}`,
          previous_progression_id: previousPatternSelection ? `preset_${toAnalyticsToken(previousPatternSelection)}` : 'none'
        });
      }
      registerSessionAction('preset_changed');
    }
    state.lastPatternSelectValue = dom.patternSelect.value;
  });

  dom.customPattern.addEventListener('input', () => {
    clearOneChordCycleState();
    rememberStandaloneCustomDraft();
    syncPatternSelectionFromInput();
    syncProgressionManagerState();
    setProgressionFeedback('');
    normalizeChordsPerBarForCurrentPattern();
    validateCustomPattern();
    applyPatternModeAvailability();
    syncPatternPreview();
  });

  dom.customPattern.addEventListener('change', () => {
    ensureSessionStarted('custom_progression');
    dom.customPattern.value = normalizePatternString(dom.customPattern.value);
    clearOneChordCycleState();
    rememberStandaloneCustomDraft();
    syncPatternSelectionFromInput();
    syncProgressionManagerState();
    normalizeChordsPerBarForCurrentPattern();
    const isValid = validateCustomPattern();
    applyPatternModeAvailability();
    syncPatternPreview();
    if (dom.customPattern.value && isValid) {
      trackProgressionEvent('custom_progression_committed');
      const progressionProps = getProgressionAnalyticsProps();
      trackEvent('custom_progression_used', {
        progression_mode: progressionProps.progression_mode,
        progression_kind: progressionProps.progression_kind
      });
      registerSessionAction('custom_progression_used');
    }
  });

  dom.patternMode.addEventListener('change', () => {
    setEditorPatternMode(dom.patternMode.value);
    rememberStandaloneCustomDraft();
    syncPatternSelectionFromInput();
    syncProgressionManagerState();
    setProgressionFeedback('');
    applyPatternModeAvailability();
    trackProgressionEvent('pattern_mode_changed');
  });

  dom.patternModeBoth?.addEventListener('change', () => {
    const nextMode = dom.patternModeBoth.checked
      ? PATTERN_MODE_BOTH
      : (dom.majorMinor.checked ? PATTERN_MODE_MINOR : PATTERN_MODE_MAJOR);
    setEditorPatternMode(nextMode, { syncMajorMinor: false });
    rememberStandaloneCustomDraft();
    syncPatternSelectionFromInput();
    syncProgressionManagerState();
    setProgressionFeedback('');
    applyPatternModeAvailability();
    trackProgressionEvent('pattern_mode_changed');
  });

  dom.patternName.addEventListener('input', () => {
    dom.patternName.value = normalizePresetNameForInput(dom.patternName.value);
    rememberStandaloneCustomDraft();
    syncProgressionManagerState();
    setProgressionFeedback('');
  });

  dom.patternName.addEventListener('change', () => {
    dom.patternName.value = normalizePresetName(dom.patternName.value);
  });

  dom.majorMinor.addEventListener('change', () => {
    if (isCustomPatternSelected() && !dom.patternModeBoth?.checked && !isOneChordModeActive()) {
      setEditorPatternMode(dom.majorMinor.checked ? PATTERN_MODE_MINOR : PATTERN_MODE_MAJOR, { syncMajorMinor: false });
      rememberStandaloneCustomDraft();
      syncPatternSelectionFromInput();
      syncProgressionManagerState();
      setProgressionFeedback('');
      applyPatternModeAvailability();
    }
    helpers.updateKeyPickerLabels();
    state.keyPool = [];
    helpers.refreshDisplayedHarmony();
    syncPatternPreview();
    trackProgressionEvent('major_minor_toggled', {
      tonal_mode: dom.majorMinor.checked ? 'minor' : 'major'
    });
  });

  dom.saveProgression?.addEventListener('click', saveCurrentProgression);
  dom.cancelProgressionEdit?.addEventListener('click', cancelProgressionEdit);
  dom.newProgression?.addEventListener('click', () => startNewProgression());
  dom.manageProgressions?.addEventListener('click', () => {
    ensureSessionStarted('preset_manager');
    registerSessionAction('preset_manager_opened');
    toggleProgressionManager();
  });
  dom.closeProgressionManager?.addEventListener('click', () => {
    closeProgressionManager();
    syncProgressionManagerState();
  });
  dom.restoreDefaultProgressions?.addEventListener('click', restoreDefaultProgressions);
  dom.clearAllProgressions?.addEventListener('click', clearAllProgressions);
  dom.progressionUpdateReplace?.addEventListener('click', replaceProgressionsWithDefaultList);
  dom.progressionUpdateMerge?.addEventListener('click', mergeUpdatedDefaultProgressions);
  dom.progressionUpdateKeep?.addEventListener('click', () => {
    markDefaultProgressionsPromptHandled();
    setProgressionFeedback('Kept your current progression list.');
  });
}
