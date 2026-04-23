// @ts-check

/**
 * Creates the shared-playback pattern UI root context from live root-app bindings.
 * This keeps the large pattern-UI contract out of `app.js` while preserving the
 * same shared-playback UI/runtime bridge behavior.
 *
 * @param {object} [options]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillSharedPlaybackPatternUiRootAppContext({
  helpers = {}
} = {}) {
  const {
    clearProgressionEditingState = () => {},
    closeProgressionManager = () => {},
    syncCustomPatternUI = () => {},
    normalizeChordsPerBarForCurrentPattern = () => {},
    applyPatternModeAvailability = () => {},
    syncPatternPreview = () => {},
    applyDisplayMode = () => {},
    applyBeatIndicatorVisibility = () => {},
    applyCurrentHarmonyVisibility = () => {},
    updateKeyPickerLabels = () => {},
    refreshDisplayedHarmony = () => {},
    fitHarmonyDisplay = () => {},
    validateCustomPattern = () => true,
    getCurrentPatternString = () => '',
    getCurrentPatternMode = () => ''
  } = helpers;

  return {
    clearProgressionEditingState,
    closeProgressionManager,
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
    getCurrentPatternString,
    getCurrentPatternMode
  };
}
