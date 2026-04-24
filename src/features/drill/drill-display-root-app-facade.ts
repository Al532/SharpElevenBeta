
import {
  applyDrillBeatIndicatorVisibility,
  applyDrillCurrentHarmonyVisibility,
  applyDrillDisplayMode,
  refreshDrillDisplayedHarmony,
  updateDrillKeyPickerLabels
} from './drill-display-runtime.js';

type DrillChordToken = {
  roman?: string;
  semitones?: number;
  bassSemitones?: number;
  inputType?: string;
};

type DrillDisplayDom = {
  keyCheckboxes?: ParentNode | null;
  nextHeader?: HTMLElement | null;
  nextKeyDisplay?: HTMLElement | null;
  nextChordDisplay?: HTMLElement | null;
  displayPlaceholder?: HTMLElement | null;
  reopenWelcome?: HTMLElement | null;
  displayPlaceholderMessage?: HTMLElement | null;
  beatDots?: HTMLElement[];
  beatIndicator?: HTMLElement | null;
  display?: HTMLElement | null;
  keyDisplay?: HTMLElement | null;
  chordDisplay?: HTMLElement | null;
};

type DrillDisplayState = {
  getIsPlaying?: () => boolean;
  getIsIntro?: () => boolean;
  getCurrentKey?: () => number;
  getNextKeyValue?: () => number | null;
  getCurrentChordIdx?: () => number;
  getPaddedChords?: () => DrillChordToken[];
  getNextRawChords?: () => DrillChordToken[];
  getShowBeatIndicatorEnabled?: () => boolean;
  getCurrentHarmonyHidden?: () => boolean;
  getDisplayMode?: () => string;
};

type DrillDisplayConstants = {
  keyNamesMajor?: string[];
  defaultDisplayPlaceholderMessage?: string;
};

type DrillDisplayHelpers = {
  transposeDisplayPitchClass?: (value: number) => number;
  getUpdateKeyCheckboxVisualState?: () => (label: HTMLElement, checkbox: HTMLInputElement, index: number) => void;
  getSyncSelectedKeysSummary?: () => () => void;
  getRemainingBeatsUntilNextProgression?: () => number;
  shouldShowNextPreview?: (currentKeyValue: number, upcomingKeyValue: number | null, remainingBeats: number) => boolean;
  keyNameHtml?: (key: number | null | undefined) => string;
  chordSymbolHtml?: (
    key: number | null | undefined,
    chord: DrillChordToken | null | undefined,
    isMinorOverride?: boolean | null,
    nextChord?: DrillChordToken | null
  ) => string;
  applyDisplaySideLayout?: () => void;
  fitHarmonyDisplay?: () => void;
};

type CreateDrillDisplayRootAppFacadeOptions = {
  dom?: DrillDisplayDom;
  state?: DrillDisplayState;
  constants?: DrillDisplayConstants;
  helpers?: DrillDisplayHelpers;
};

/**
 * Creates the drill display root facade from live root-app bindings. This
 * keeps the small display shell, render, and visibility contracts out of
 * `app.js` while preserving the same display behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, Function>} [options.state]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillDisplayRootAppFacade({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
}: CreateDrillDisplayRootAppFacadeOptions = {}) {
  const {
    getIsPlaying = () => false,
    getIsIntro = () => false,
    getCurrentKey = () => 0,
    getNextKeyValue = () => null,
    getCurrentChordIdx = () => 0,
    getPaddedChords = () => [],
    getNextRawChords = () => [],
    getShowBeatIndicatorEnabled = () => true,
    getCurrentHarmonyHidden = () => false,
    getDisplayMode = () => 'show-both'
  } = state;
  const {
    keyNamesMajor = [],
    defaultDisplayPlaceholderMessage = ''
  } = constants;
  const {
    transposeDisplayPitchClass = (value) => value,
    getUpdateKeyCheckboxVisualState = () => () => {},
    getSyncSelectedKeysSummary = () => () => {},
    getRemainingBeatsUntilNextProgression = () => 0,
    shouldShowNextPreview = () => false,
    keyNameHtml = () => '',
    chordSymbolHtml = () => '',
    applyDisplaySideLayout = () => {},
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

  function showNextCol() {
    dom.nextHeader.textContent = 'Next';
    dom.nextHeader.classList.remove('hidden');
    dom.nextKeyDisplay.classList.remove('hidden');
    dom.nextChordDisplay.classList.remove('hidden');
    fitHarmonyDisplay();
  }

  function hideNextCol() {
    dom.nextHeader.textContent = '';
    dom.nextHeader.classList.add('hidden');
    dom.nextKeyDisplay.classList.add('hidden');
    dom.nextChordDisplay.classList.add('hidden');
    fitHarmonyDisplay();
  }

  function setDisplayPlaceholderVisible(visible) {
    dom.displayPlaceholder?.classList.toggle('hidden', !visible);
    dom.reopenWelcome?.classList.toggle('hidden', !visible);
  }

  function setDisplayPlaceholderMessage(message = defaultDisplayPlaceholderMessage) {
    if (!dom.displayPlaceholderMessage) return;
    dom.displayPlaceholderMessage.textContent = message;
  }

  function updateBeatDots(beat, isIntro) {
    (dom.beatDots || []).forEach((dot, index) => {
      dot.classList.toggle('active', index === beat && !isIntro);
      dot.classList.toggle('intro', index === beat && isIntro);
    });
  }

  function clearBeatDots() {
    (dom.beatDots || []).forEach((dot) => {
      dot.classList.remove('active', 'intro');
    });
  }

  function applyBeatIndicatorVisibility() {
    applyDrillBeatIndicatorVisibility({
      beatIndicator: dom.beatIndicator,
      showBeatIndicatorEnabled: getShowBeatIndicatorEnabled()
    });
  }

  function isCurrentHarmonyHidden() {
    return getCurrentHarmonyHidden() === true;
  }

  function applyCurrentHarmonyVisibility() {
    applyDrillCurrentHarmonyVisibility({
      displayElement: dom.display,
      currentHarmonyHidden: isCurrentHarmonyHidden()
    });
  }

  function applyDisplayMode() {
    applyDrillDisplayMode({
      displayElement: dom.display,
      mode: getDisplayMode(),
      applyDisplaySideLayout,
      applyCurrentHarmonyVisibility,
      fitHarmonyDisplay
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
    showNextCol,
    hideNextCol,
    setDisplayPlaceholderVisible,
    setDisplayPlaceholderMessage,
    updateBeatDots,
    clearBeatDots,
    applyBeatIndicatorVisibility,
    isCurrentHarmonyHidden,
    applyCurrentHarmonyVisibility,
    applyDisplayMode,
    refreshDisplayedHarmony
  };
}


