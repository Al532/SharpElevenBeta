// @ts-check

import { validateDrillCustomPattern } from './drill-pattern-validation.js';

export function createStateRef(get, set = undefined) {
  return { get, set };
}

/**
 * Creates small app-level support helpers that are still consumed from
 * `app.js` while keeping their logic out of the entry file.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.runtimeState]
 * @param {Record<string, any>} [options.runtimeConstants]
 * @param {Record<string, any>} [options.runtimeHelpers]
 */
export function createDrillAppRuntimeSupportRootAppAssembly({
  dom = {},
  runtimeState = {},
  runtimeConstants = {},
  runtimeHelpers = {}
} = {}) {
  const {
    getCurrentRawChords = () => [],
    setCurrentRawChords = () => {},
    setNextRawChords = () => {},
    setOneChordQualityPool = () => {},
    setOneChordQualityPoolSignature = () => {},
    setCurrentOneChordQualityValue = () => {},
    setNextOneChordQualityValue = () => {},
    getCurrentPatternString = () => '',
    getIsPlaying = () => false,
    getPlaybackSessionController = () => null,
    setPlaybackSessionController = () => {}
  } = runtimeState;

  const {
    oneChordDefaultQualities = []
  } = runtimeConstants;

  const {
    isCustomPatternSelected = () => false,
    normalizePatternString = (value) => value,
    analyzePattern = () => ({}),
    parseOneChordSpec = () => ({ active: false, qualities: [] }),
    createOneChordToken = (value) => value,
    parsePattern = () => [],
    normalizeCompingStyle = (value) => value,
    normalizeRepetitionsPerKey = (value) => value,
    stopPlayback = () => {},
    getDisplayFacade = () => ({})
  } = runtimeHelpers;

  function buildProgression() {
    const currentRawChords = getCurrentRawChords();
    if (currentRawChords.length > 0) return currentRawChords;

    const oneChordSpec = parseOneChordSpec(getCurrentPatternString());
    if (oneChordSpec.active) {
      const fallbackQuality = oneChordSpec.qualities[0] || oneChordDefaultQualities[0];
      return [createOneChordToken(fallbackQuality)];
    }

    const raw = parsePattern(getCurrentPatternString());
    if (raw.length === 0) return parsePattern('II-V-I');
    return raw;
  }

  function validateCustomPattern() {
    return validateDrillCustomPattern({
      isCustomPatternSelected,
      getCustomPatternValue: () => String(dom.customPattern?.value || ''),
      normalizePatternString,
      analyzePattern,
      patternErrorElement: dom.patternError
    });
  }

  function setKeyPickerOpen(isOpen) {
    if (!dom.keyPicker) return;
    dom.keyPicker.open = Boolean(isOpen);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function getPianoVoicingMode() {
    normalizeCompingStyle(dom.compingStyle?.value);
    return 'piano';
  }

  function getRepetitionsPerKey() {
    return normalizeRepetitionsPerKey(dom.repetitionsPerKey?.value);
  }

  function clearOneChordCycleState() {
    setCurrentRawChords([]);
    setNextRawChords([]);
    setOneChordQualityPool([]);
    setOneChordQualityPoolSignature('');
    setCurrentOneChordQualityValue('');
    setNextOneChordQualityValue('');
  }

  function toAnalyticsToken(value, fallback = 'unknown') {
    const normalized = String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return normalized || fallback;
  }

  function stopPlaybackIfRunning() {
    if (!getIsPlaying()) return;
    stopPlayback();
  }

  function keyLabelForPicker(majorIndex) {
    return getDisplayFacade().keyLabelForPicker(majorIndex);
  }

  function updateKeyPickerLabels() {
    return getDisplayFacade().updateKeyPickerLabels();
  }

  function refreshDisplayedHarmony() {
    return getDisplayFacade().refreshDisplayedHarmony();
  }

  function resolvePlaybackSessionController(fallbackController) {
    const existingController = getPlaybackSessionController();
    if (existingController) return existingController;
    setPlaybackSessionController(fallbackController);
    return fallbackController;
  }

  return {
    buildProgression,
    validateCustomPattern,
    createStateRef,
    setKeyPickerOpen,
    escapeHtml,
    getPianoVoicingMode,
    getRepetitionsPerKey,
    clearOneChordCycleState,
    toAnalyticsToken,
    stopPlaybackIfRunning,
    keyLabelForPicker,
    updateKeyPickerLabels,
    refreshDisplayedHarmony,
    resolvePlaybackSessionController
  };
}
