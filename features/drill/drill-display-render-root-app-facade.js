// @ts-check

import {
  refreshDrillDisplayedHarmony,
  updateDrillKeyPickerLabels
} from './drill-display-runtime.js';

/**
 * Creates the drill display-render facade from live root-app bindings.
 * This keeps key-picker label glue and displayed-harmony refresh wiring out of
 * `app.js` while preserving the same render behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, Function>} [options.state]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillDisplayRenderRootAppFacade({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
} = {}) {
  const {
    getIsPlaying = () => false,
    getIsIntro = () => false,
    getCurrentKey = () => 0,
    getNextKeyValue = () => null,
    getCurrentChordIdx = () => 0,
    getPaddedChords = () => [],
    getNextRawChords = () => []
  } = state;
  const {
    keyNamesMajor = []
  } = constants;
  const {
    transposeDisplayPitchClass = (value) => value,
    getUpdateKeyCheckboxVisualState = () => () => {},
    getSyncSelectedKeysSummary = () => () => {},
    getRemainingBeatsUntilNextProgression = () => 0,
    shouldShowNextPreview = () => false,
    keyNameHtml = () => '',
    chordSymbolHtml = () => '',
    showNextCol = () => {},
    hideNextCol = () => {},
    applyDisplaySideLayout = () => {},
    applyCurrentHarmonyVisibility = () => {},
    fitHarmonyDisplay = () => {}
  } = helpers;

  function keyLabelForPicker(majorIndex) {
    return keyNamesMajor[transposeDisplayPitchClass(majorIndex)];
  }

  function updateKeyPickerLabels() {
    updateDrillKeyPickerLabels({
      keyCheckboxes: dom.keyCheckboxes,
      updateKeyCheckboxVisualState: getUpdateKeyCheckboxVisualState(),
      syncSelectedKeysSummary: getSyncSelectedKeysSummary()
    });
  }

  function refreshDisplayedHarmony() {
    refreshDrillDisplayedHarmony({
      isPlaying: getIsPlaying(),
      isIntro: getIsIntro(),
      currentKey: getCurrentKey(),
      nextKeyValue: getNextKeyValue(),
      currentChordIdx: getCurrentChordIdx(),
      paddedChords: getPaddedChords(),
      nextRawChords: getNextRawChords(),
      getRemainingBeatsUntilNextProgression,
      shouldShowNextPreview,
      keyNameHtml,
      chordSymbolHtml,
      showNextCol,
      hideNextCol,
      keyDisplay: dom.keyDisplay,
      chordDisplay: dom.chordDisplay,
      nextKeyDisplay: dom.nextKeyDisplay,
      nextChordDisplay: dom.nextChordDisplay,
      applyDisplaySideLayout,
      applyCurrentHarmonyVisibility,
      fitHarmonyDisplay
    });
  }

  return {
    keyLabelForPicker,
    updateKeyPickerLabels,
    refreshDisplayedHarmony
  };
}
