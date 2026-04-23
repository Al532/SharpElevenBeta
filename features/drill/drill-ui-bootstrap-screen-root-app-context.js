// @ts-check

/**
 * Creates the drill UI bootstrap screen context from live root-app bindings.
 * This keeps the late screen bootstrap glue out of `app.js` while preserving
 * the same screen initialization behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, Function>} [options.state]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillUiBootstrapScreenRootAppContext({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
} = {}) {
  const {
    getProgressions = () => ({}),
    getSavedPatternSelection = () => '',
    getShouldPromptForDefaultProgressionsUpdate = () => false,
    getAppliedDefaultProgressionsFingerprint = () => '',
    setAppliedDefaultProgressionsFingerprint = () => {},
    setLastPatternSelectValue = () => {}
  } = state;
  const {
    customPatternOptionValue = ''
  } = constants;
  const {
    initializeSocialShareLinks = () => {},
    loadDefaultProgressions = async () => {},
    loadPatternHelp = async () => {},
    loadWelcomeStandards = async () => {},
    renderProgressionOptions = () => {},
    loadSettings = () => {},
    applySilentDefaultPresetResetMigration = () => false,
    saveSettings = () => {},
    buildKeyCheckboxes = () => {},
    updateKeyPickerLabels = () => {},
    applyDisplayMode = () => {},
    getSelectedProgressionPattern = () => '',
    hasSelectedProgression = () => false,
    getSelectedProgressionName = () => '',
    normalizePresetName = (value) => value,
    setEditorPatternMode = () => {},
    getSelectedProgressionMode = () => '',
    normalizePatternMode = (value) => value,
    syncPatternSelectionFromInput = () => {},
    syncProgressionManagerState = () => {},
    syncCustomPatternUI = () => {},
    normalizeChordsPerBarForCurrentPattern = () => {},
    applyPatternModeAvailability = () => {},
    promptForUpdatedDefaultProgressions = () => {},
    getDefaultProgressionsFingerprint = () => '',
    ensurePageSampleWarmup = () => {},
    consumePendingDrillSessionIntoUi = () => false,
    setWelcomeOverlayVisible = () => {},
    maybeShowWelcomeOverlay = () => {}
  } = helpers;

  return {
    initializeSocialShareLinks,
    loadDefaultProgressions,
    loadPatternHelp,
    loadWelcomeStandards,
    renderProgressionOptions,
    getInitialProgressionOption: () => Object.keys(getProgressions() || {})[0] || '',
    loadSettings,
    applySilentDefaultPresetResetMigration,
    getSavedPatternSelection,
    saveSettings,
    buildKeyCheckboxes,
    updateKeyPickerLabels,
    applyDisplayMode,
    hasCustomPatternValue: () => Boolean(dom.customPattern?.value),
    setCustomPatternValue: (value) => {
      if (dom.customPattern) {
        dom.customPattern.value = value || '';
      }
    },
    getSelectedProgressionPattern,
    hasSelectedProgression,
    setPatternNameFromSelectedProgression: () => {
      if (dom.patternName) {
        dom.patternName.value = getSelectedProgressionName();
      }
    },
    setPatternNameNormalized: () => {
      if (dom.patternName) {
        dom.patternName.value = normalizePresetName(dom.patternName.value);
      }
    },
    setEditorPatternModeFromSelectedProgression: () => {
      setEditorPatternMode(getSelectedProgressionMode());
    },
    setEditorPatternModeNormalized: () => {
      setEditorPatternMode(normalizePatternMode(dom.patternMode?.value));
    },
    customPatternOptionValue,
    applySavedPatternSelection: (optionValue) => {
      const savedPatternSelection = getSavedPatternSelection();
      if (savedPatternSelection === optionValue) {
        if (dom.patternSelect) {
          dom.patternSelect.value = optionValue;
        }
        return true;
      }
      if (
        savedPatternSelection &&
        Object.prototype.hasOwnProperty.call(getProgressions() || {}, savedPatternSelection)
      ) {
        if (dom.patternSelect) {
          dom.patternSelect.value = savedPatternSelection;
        }
        return true;
      }
      return false;
    },
    syncPatternSelectionFromInput,
    syncProgressionManagerState,
    syncCustomPatternUI,
    normalizeChordsPerBarForCurrentPattern,
    applyPatternModeAvailability,
    setLastPatternSelectValue: () => {
      setLastPatternSelectValue(dom.patternSelect?.value || '');
    },
    shouldPromptForDefaultProgressionsUpdate: getShouldPromptForDefaultProgressionsUpdate,
    promptForUpdatedDefaultProgressions,
    hasAppliedDefaultProgressionsFingerprint: () => Boolean(getAppliedDefaultProgressionsFingerprint()),
    setAppliedDefaultProgressionsFingerprint,
    getDefaultProgressionsFingerprint,
    ensurePageSampleWarmup,
    consumePendingDrillSessionIntoUi: ({ afterApply } = {}) => consumePendingDrillSessionIntoUi({
      afterApply
    }),
    setWelcomeOverlayVisible,
    maybeShowWelcomeOverlay
  };
}
