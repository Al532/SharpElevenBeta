
import { validateDrillCustomPattern } from './drill-pattern-validation.js';

type StateRef<T> = {
  get: () => T;
  set?: (value: T) => void;
};

type DrillAppRuntimeSupportElementLike = {
  value?: string;
  open?: boolean;
};

type DrillAppRuntimeSupportDom = {
  customPattern?: HTMLElement | DrillAppRuntimeSupportElementLike | null;
  patternError?: Element | null;
  keyPicker?: HTMLElement | DrillAppRuntimeSupportElementLike | null;
  compingStyle?: HTMLElement | DrillAppRuntimeSupportElementLike | null;
  repetitionsPerKey?: HTMLElement | DrillAppRuntimeSupportElementLike | null;
};

type DrillAppRuntimeSupportState = {
  getCurrentRawChords?: () => unknown[];
  setCurrentRawChords?: (value: unknown[]) => void;
  setNextRawChords?: (value: unknown[]) => void;
  setOneChordQualityPool?: (value: string[]) => void;
  setOneChordQualityPoolSignature?: (value: string) => void;
  setCurrentOneChordQualityValue?: (value: string) => void;
  setNextOneChordQualityValue?: (value: string) => void;
  getCurrentPatternString?: () => string;
  getIsPlaying?: () => boolean;
  getPlaybackSessionController?: () => unknown;
  setPlaybackSessionController?: (value: unknown) => void;
};

type DrillAppRuntimeSupportConstants = {
  oneChordDefaultQualities?: string[];
};

type DrillAppRuntimeSupportDisplayFacade = {
  keyLabelForPicker?: (majorIndex: number) => string;
  updateKeyPickerLabels?: () => void;
  refreshDisplayedHarmony?: () => void;
};

type DrillAppRuntimeSupportHelpers = {
  isCustomPatternSelected?: () => boolean;
  normalizePatternString?: (value: string) => string;
  analyzePattern?: (value: string) => unknown;
  parseOneChordSpec?: (value: string) => { active: boolean; qualities: string[] };
  createOneChordToken?: (value: string) => unknown;
  parsePattern?: (value: string) => unknown[];
  normalizeCompingStyle?: (value: string | undefined) => string;
  normalizeRepetitionsPerKey?: (value: string | undefined) => number;
  stopPlayback?: () => void;
  getDisplayFacade?: () => DrillAppRuntimeSupportDisplayFacade;
};

type DrillAppRuntimeSupportOptions = {
  dom?: DrillAppRuntimeSupportDom;
  runtimeState?: DrillAppRuntimeSupportState;
  runtimeConstants?: DrillAppRuntimeSupportConstants;
  runtimeHelpers?: DrillAppRuntimeSupportHelpers;
};

export function createStateRef<T>(get: () => T, set: ((value: T) => void) | undefined = undefined): StateRef<T> {
  return { get, set };
}

/**
 * Creates small app-level support helpers that are still consumed from
 * `app.js` while keeping their logic out of the entry file.
 *
 * @param {object} [options]
 * @param {object} [options.dom]
 * @param {object} [options.runtimeState]
 * @param {object} [options.runtimeConstants]
 * @param {object} [options.runtimeHelpers]
 */
export function createDrillAppRuntimeSupportRootAppAssembly({
  dom = {},
  runtimeState = {},
  runtimeConstants = {},
  runtimeHelpers = {}
}: DrillAppRuntimeSupportOptions = {}) {
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
    normalizeCompingStyle = (value) => String(value ?? ''),
    normalizeRepetitionsPerKey = (value) => Number(value ?? 0),
    stopPlayback = () => {},
    getDisplayFacade = (): DrillAppRuntimeSupportDisplayFacade => ({})
  } = runtimeHelpers;

  function getElementValue(element: HTMLElement | DrillAppRuntimeSupportElementLike | null | undefined) {
    return (element as DrillAppRuntimeSupportElementLike | null | undefined)?.value;
  }

  function setElementOpen(element: HTMLElement | DrillAppRuntimeSupportElementLike | null | undefined, isOpen: boolean) {
    if (!element) return;
    (element as DrillAppRuntimeSupportElementLike).open = isOpen;
  }

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
      getCustomPatternValue: () => String(getElementValue(dom.customPattern) || ''),
      normalizePatternString,
      analyzePattern,
      patternErrorElement: dom.patternError
    });
  }

  function setKeyPickerOpen(isOpen) {
    setElementOpen(dom.keyPicker, Boolean(isOpen));
  }

  function escapeHtml(value: unknown) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function getPianoVoicingMode() {
    normalizeCompingStyle(getElementValue(dom.compingStyle));
    return 'piano';
  }

  function getRepetitionsPerKey() {
    return normalizeRepetitionsPerKey(getElementValue(dom.repetitionsPerKey));
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
    return getDisplayFacade().keyLabelForPicker?.(majorIndex);
  }

  function updateKeyPickerLabels() {
    return getDisplayFacade().updateKeyPickerLabels?.();
  }

  function refreshDisplayedHarmony() {
    return getDisplayFacade().refreshDisplayedHarmony?.();
  }

  function resolvePlaybackSessionController<T>(fallbackController: T) {
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


