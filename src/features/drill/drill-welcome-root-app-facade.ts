type DrillWelcomeDom = {
  welcomeOverlay?: HTMLElement | null;
  reopenWelcome?: HTMLElement | null;
  startStop?: HTMLElement | null;
  welcomeApply?: HTMLElement | null;
  welcomeStandardSelect?: HTMLSelectElement | null;
  welcomeGoalPanels?: NodeListOf<HTMLElement> | null;
  welcomeSummary?: HTMLElement | null;
  welcomeShowNextTime?: HTMLInputElement | null;
  patternName?: HTMLInputElement | null;
  customPattern?: HTMLInputElement | null;
  patternSelect?: HTMLSelectElement | null;
  majorMinor?: HTMLInputElement | null;
  transpositionSelect?: HTMLSelectElement | null;
  tempoSlider?: HTMLInputElement | null;
  tempoValue?: HTMLElement | null;
  repetitionsPerKey?: HTMLInputElement | HTMLSelectElement | null;
  chordsPerBar?: HTMLInputElement | HTMLSelectElement | null;
  compingStyle?: HTMLSelectElement | null;
  walkingBass?: HTMLInputElement | null;
  drumsSelect?: HTMLSelectElement | null;
  displayMode?: HTMLSelectElement | null;
  showBeatIndicator?: HTMLInputElement | null;
  hideCurrentHarmony?: HTMLInputElement | null;
  masterVolume?: HTMLInputElement | null;
  bassVolume?: HTMLInputElement | null;
  stringsVolume?: HTMLInputElement | null;
  drumsVolume?: HTMLInputElement | null;
};

type DrillWelcomeRecommendation = {
  summary?: string;
  goal?: string;
  presetName?: string;
  patternName?: string;
  pattern?: string;
  patternMode?: string;
  majorMinor?: boolean;
  instrument?: string | number;
  tempo?: string | number;
  repetitionsPerKey?: unknown;
  chordsPerBar?: unknown;
  doubleTime?: boolean;
  compingStyle?: string;
  customMediumSwingBass?: boolean;
  drumsMode?: string;
  displayMode?: string;
  showBeatIndicator?: boolean;
  hideCurrentHarmony?: boolean;
  masterVolume?: string;
  bassVolume?: string;
  stringsVolume?: string;
  drumsVolume?: string;
  nextPreviewLeadValue?: unknown;
  nextPreviewUnit?: unknown;
  enabledKeys?: boolean[];
};

type DrillWelcomeState = {
  getHasCompletedWelcomeOnboarding?: () => boolean;
  setHasCompletedWelcomeOnboarding?: (value: boolean) => void;
  getShouldShowWelcomeNextTime?: () => boolean;
  setShouldShowWelcomeNextTime?: (value: boolean) => void;
  getWelcomeStandards?: () => Record<string, DrillWelcomeRecommendation>;
  getProgressions?: () => Record<string, unknown>;
  setSuppressPatternSelectChange?: (value: boolean) => void;
  setProgressionSelectionBeforeEditing?: (value: string) => void;
  setIsCreatingProgression?: (value: boolean) => void;
  setLastPatternSelectValue?: (value: string) => void;
  setNextPreviewLeadValue?: (value: unknown) => void;
  getDefaultEnabledKeys?: () => boolean[];
};

type DrillWelcomeConstants = {
  CUSTOM_PATTERN_OPTION_VALUE?: string;
  DEFAULT_CHORDS_PER_BAR?: number;
  DRUM_MODE_FULL_SWING?: string;
  IS_EMBEDDED_DRILL_MODE?: boolean;
  NEXT_PREVIEW_UNIT_BARS?: string;
  PATTERN_MODE_BOTH?: string;
  WELCOME_GOAL_ONE_CHORD?: string;
  WELCOME_GOAL_PROGRESSION?: string;
  WELCOME_GOAL_STANDARD?: string;
  WELCOME_ONE_CHORDS?: Record<string, DrillWelcomeRecommendation>;
  WELCOME_PROGRESSIONS?: Record<string, DrillWelcomeRecommendation>;
  WELCOME_STANDARDS_FALLBACK?: Record<string, DrillWelcomeRecommendation>;
};

type DrillWelcomeHelpers = {
  createDefaultAppSettings?: (options?: { goal?: string; instrument?: string }) => DrillWelcomeRecommendation & { enabledKeys: boolean[] };
  normalizeRepetitionsPerKey?: (value: unknown) => number;
  normalizeChordsPerBar?: (value: unknown) => number;
  normalizeCompingStyle?: (value: unknown) => string;
  normalizeDisplayMode?: (value: unknown) => string;
  clearProgressionEditingState?: () => void;
  closeProgressionManager?: () => void;
  setPatternSelectValue?: (value: string) => void;
  getSelectedProgressionName?: () => string;
  getSelectedProgressionPattern?: () => string;
  setEditorPatternMode?: (value: string) => void;
  getSelectedProgressionMode?: () => string;
  syncPatternSelectionFromInput?: () => void;
  syncDoubleTimeToggle?: () => void;
  applyEnabledKeys?: (value: boolean[]) => void;
  syncCustomPatternUI?: () => void;
  normalizeChordsPerBarForCurrentPattern?: () => void;
  syncProgressionManagerState?: () => void;
  applyPatternModeAvailability?: () => void;
  validateCustomPattern?: () => boolean;
  syncPatternPreview?: () => void;
  syncNextPreviewControlDisplay?: () => void;
  applyDisplayMode?: () => void;
  applyBeatIndicatorVisibility?: () => void;
  applyCurrentHarmonyVisibility?: () => void;
  applyMixerSettings?: () => void;
  updateKeyPickerLabels?: () => void;
  refreshDisplayedHarmony?: () => void;
  saveSettings?: () => void;
  start?: () => void;
  trackEvent?: (name: string, payload?: Record<string, unknown>) => void;
  setNextPreviewInputUnit?: (value: unknown) => void;
  normalizeNextPreviewLeadValue?: (value: unknown) => unknown;
};

type DrillWelcomeRootAppFacadeOptions = {
  dom?: DrillWelcomeDom;
  state?: DrillWelcomeState;
  constants?: DrillWelcomeConstants;
  helpers?: DrillWelcomeHelpers;
};

/**
 * Creates the drill welcome/onboarding facade from live root-app bindings.
 * This keeps the welcome recommendation, overlay, and preset-application
 * workflow out of `app.js` while preserving the same onboarding behavior.
 *
 * @param {object} [options]
 * @param {object} [options.dom]
 * @param {object} [options.state]
 * @param {object} [options.constants]
 * @param {object} [options.helpers]
 */
export function createDrillWelcomeRootAppFacade({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
}: DrillWelcomeRootAppFacadeOptions = {}) {
  const {
    getHasCompletedWelcomeOnboarding = () => false,
    setHasCompletedWelcomeOnboarding = () => {},
    getShouldShowWelcomeNextTime = () => true,
    setShouldShowWelcomeNextTime = () => {},
    getWelcomeStandards = () => ({}),
    getProgressions = () => ({}),
    setSuppressPatternSelectChange = () => {},
    setProgressionSelectionBeforeEditing = () => {},
    setIsCreatingProgression = () => {},
    setLastPatternSelectValue = () => {},
    setNextPreviewLeadValue = () => {},
    getDefaultEnabledKeys = () => new Array(12).fill(true)
  } = state;
  const {
    CUSTOM_PATTERN_OPTION_VALUE = '__custom__',
    DEFAULT_CHORDS_PER_BAR = 1,
    DRUM_MODE_FULL_SWING = 'swing',
    IS_EMBEDDED_DRILL_MODE = false,
    NEXT_PREVIEW_UNIT_BARS = 'bars',
    PATTERN_MODE_BOTH = 'both',
    WELCOME_GOAL_ONE_CHORD = 'one-chord',
    WELCOME_GOAL_PROGRESSION = 'progression',
    WELCOME_GOAL_STANDARD = 'standard',
    WELCOME_ONE_CHORDS = {},
    WELCOME_PROGRESSIONS = {},
    WELCOME_STANDARDS_FALLBACK = {}
  } = constants;
  const {
    createDefaultAppSettings = () => ({ enabledKeys: getDefaultEnabledKeys() }),
    normalizeRepetitionsPerKey = (value) => value,
    normalizeChordsPerBar = (value) => value,
    normalizeCompingStyle = (value) => String(value ?? ''),
    normalizeDisplayMode = (value) => String(value ?? ''),
    clearProgressionEditingState = () => {},
    closeProgressionManager = () => {},
    setPatternSelectValue = () => {},
    getSelectedProgressionName = () => '',
    getSelectedProgressionPattern = () => '',
    setEditorPatternMode = () => {},
    getSelectedProgressionMode = () => PATTERN_MODE_BOTH,
    syncPatternSelectionFromInput = () => {},
    syncDoubleTimeToggle = () => {},
    applyEnabledKeys = () => {},
    syncCustomPatternUI = () => {},
    normalizeChordsPerBarForCurrentPattern = () => {},
    syncProgressionManagerState = () => {},
    applyPatternModeAvailability = () => {},
    validateCustomPattern = () => true,
    syncPatternPreview = () => {},
    syncNextPreviewControlDisplay = () => {},
    applyDisplayMode = () => {},
    applyBeatIndicatorVisibility = () => {},
    applyCurrentHarmonyVisibility = () => {},
    applyMixerSettings = () => {},
    updateKeyPickerLabels = () => {},
    refreshDisplayedHarmony = () => {},
    saveSettings = () => {},
    start = () => {},
    trackEvent = () => {},
    setNextPreviewInputUnit = () => {},
    normalizeNextPreviewLeadValue = (value) => value
  } = helpers;

  function getCheckedInputValue(name, fallback = '') {
    return document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value || fallback;
  }

  function setWelcomeOverlayVisible(isVisible) {
    if (!dom.welcomeOverlay) return;
    if (!isVisible) {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && dom.welcomeOverlay.contains(activeElement)) {
        const nextFocusTarget = dom.reopenWelcome || dom.startStop || document.body;
        if (nextFocusTarget instanceof HTMLElement) {
          nextFocusTarget.focus();
        } else {
          activeElement.blur();
        }
      }
    }
    dom.welcomeOverlay.classList.toggle('hidden', !isVisible);
    dom.welcomeOverlay.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
    dom.welcomeOverlay.toggleAttribute('inert', !isVisible);
    document.body.classList.toggle('welcome-open', isVisible);
    if (isVisible) {
      window.requestAnimationFrame(() => {
        dom.welcomeApply?.focus();
      });
    }
  }

  function getSelectedWelcomeRecommendation() {
    const goal = getCheckedInputValue('welcome-goal', WELCOME_GOAL_PROGRESSION);
    const instrument = getCheckedInputValue('welcome-instrument', '0');

    const baseConfig = createDefaultAppSettings({
      goal,
      instrument
    });

    if (goal === WELCOME_GOAL_ONE_CHORD) {
      const quality = getCheckedInputValue('welcome-one-chord', 'maj7');
      return {
        ...baseConfig,
        ...WELCOME_ONE_CHORDS[quality],
        customMediumSwingBass: false,
        nextPreviewLeadValue: 2,
        nextPreviewUnit: NEXT_PREVIEW_UNIT_BARS
      };
    }

    if (goal === WELCOME_GOAL_STANDARD) {
      const welcomeStandards = getWelcomeStandards();
      const standard = dom.welcomeStandardSelect?.value || Object.keys(welcomeStandards)[0] || 'all-the-things-you-are';
      return {
        ...baseConfig,
        ...(welcomeStandards[standard]
          || WELCOME_STANDARDS_FALLBACK[standard]
          || Object.values(welcomeStandards)[0]
          || Object.values(WELCOME_STANDARDS_FALLBACK)[0]),
        enabledKeys: [...createDefaultAppSettings().enabledKeys]
      };
    }

    const progression = getCheckedInputValue('welcome-progression', 'ii-v-i-major');
    return {
      ...baseConfig,
      ...WELCOME_PROGRESSIONS[progression]
    };
  }

  function updateWelcomePanelVisibility() {
    const goal = getCheckedInputValue('welcome-goal', WELCOME_GOAL_PROGRESSION);
    dom.welcomeGoalPanels?.forEach((panel) => {
      panel.classList.toggle('hidden', panel.dataset.welcomePanel !== goal);
    });
  }

  function updateWelcomeSummary() {
    const recommendation = getSelectedWelcomeRecommendation();
    if (dom.welcomeSummary) {
      dom.welcomeSummary.textContent = recommendation.summary || 'Suggested preset: moderate tempo and adapted playback settings.';
    }
  }

  function markWelcomeOnboardingCompleted() {
    setHasCompletedWelcomeOnboarding(true);
  }

  function syncWelcomeShowNextTimePreference() {
    setShouldShowWelcomeNextTime(dom.welcomeShowNextTime?.checked !== false);
  }

  function applyWelcomeRecommendation() {
    const recommendation = getSelectedWelcomeRecommendation();

    clearProgressionEditingState();
    closeProgressionManager();

    setSuppressPatternSelectChange(true);
    if (recommendation.presetName) {
      setPatternSelectValue(recommendation.presetName);
      dom.patternName.value = getSelectedProgressionName();
      dom.customPattern.value = getSelectedProgressionPattern();
      setEditorPatternMode(getSelectedProgressionMode());
    } else {
      setProgressionSelectionBeforeEditing(Object.keys(getProgressions())[0] || '');
      setIsCreatingProgression(true);
      setPatternSelectValue(CUSTOM_PATTERN_OPTION_VALUE);
      dom.patternName.value = recommendation.patternName || '';
      dom.customPattern.value = recommendation.pattern || '';
      setEditorPatternMode(recommendation.patternMode || PATTERN_MODE_BOTH);
      syncPatternSelectionFromInput();
    }
    setSuppressPatternSelectChange(false);
    setLastPatternSelectValue(dom.patternSelect.value);

    dom.majorMinor.checked = Boolean(recommendation.majorMinor);
    dom.transpositionSelect.value = String(recommendation.instrument || '0');
    dom.tempoSlider.value = String(recommendation.tempo || 120);
    dom.tempoValue.textContent = dom.tempoSlider.value;
    if (dom.repetitionsPerKey) {
      dom.repetitionsPerKey.value = String(normalizeRepetitionsPerKey(recommendation.repetitionsPerKey));
    }
    if (dom.chordsPerBar) {
      const recommendedChordsPerBar = recommendation.chordsPerBar !== undefined
        ? recommendation.chordsPerBar
        : (recommendation.doubleTime ? 2 : DEFAULT_CHORDS_PER_BAR);
      dom.chordsPerBar.value = String(normalizeChordsPerBar(recommendedChordsPerBar));
      syncDoubleTimeToggle();
    }
    if (dom.compingStyle) {
      dom.compingStyle.value = normalizeCompingStyle(recommendation.compingStyle);
    }
    if (dom.walkingBass) {
      dom.walkingBass.checked = recommendation.customMediumSwingBass !== false;
    }
    if (dom.drumsSelect) {
      dom.drumsSelect.value = recommendation.drumsMode || DRUM_MODE_FULL_SWING;
    }
    if (dom.displayMode) {
      dom.displayMode.value = normalizeDisplayMode(recommendation.displayMode);
    }
    if (dom.showBeatIndicator) {
      dom.showBeatIndicator.checked = recommendation.showBeatIndicator !== false;
    }
    if (dom.hideCurrentHarmony) {
      dom.hideCurrentHarmony.checked = recommendation.hideCurrentHarmony === true;
    }
    if (dom.masterVolume) dom.masterVolume.value = recommendation.masterVolume || '100';
    if (dom.bassVolume) dom.bassVolume.value = recommendation.bassVolume || '100';
    if (dom.stringsVolume) dom.stringsVolume.value = recommendation.stringsVolume || '100';
    if (dom.drumsVolume) dom.drumsVolume.value = recommendation.drumsVolume || '100';

    setNextPreviewLeadValue(normalizeNextPreviewLeadValue(recommendation.nextPreviewLeadValue));
    setNextPreviewInputUnit(recommendation.nextPreviewUnit);
    applyEnabledKeys(
      Array.isArray(recommendation.enabledKeys) && recommendation.enabledKeys.length === 12
        ? recommendation.enabledKeys
        : getDefaultEnabledKeys()
    );

    syncCustomPatternUI();
    normalizeChordsPerBarForCurrentPattern();
    syncProgressionManagerState();
    applyPatternModeAvailability();
    validateCustomPattern();
    syncPatternPreview();
    syncNextPreviewControlDisplay();
    applyDisplayMode();
    applyBeatIndicatorVisibility();
    applyCurrentHarmonyVisibility();
    applyMixerSettings();
    updateKeyPickerLabels();
    refreshDisplayedHarmony();

    syncWelcomeShowNextTimePreference();
    markWelcomeOnboardingCompleted();
    saveSettings();
    setWelcomeOverlayVisible(false);
    start();

    trackEvent('welcome_preset_applied', {
      welcome_goal: recommendation.goal,
      welcome_progression: getCheckedInputValue('welcome-progression', 'ii-v-i-major'),
      welcome_one_chord: getCheckedInputValue('welcome-one-chord', 'maj7'),
      welcome_standard: dom.welcomeStandardSelect?.value || '',
      transposition: recommendation.instrument || '0',
      progression_mode: recommendation.majorMinor ? 'minor' : 'major'
    });
  }

  function skipWelcomeOverlay() {
    syncWelcomeShowNextTimePreference();
    markWelcomeOnboardingCompleted();
    saveSettings();
    setWelcomeOverlayVisible(false);
    trackEvent('welcome_skipped');
  }

  function maybeShowWelcomeOverlay() {
    return;
  }

  return {
    getCheckedInputValue,
    setWelcomeOverlayVisible,
    getSelectedWelcomeRecommendation,
    updateWelcomePanelVisibility,
    updateWelcomeSummary,
    markWelcomeOnboardingCompleted,
    syncWelcomeShowNextTimePreference,
    applyWelcomeRecommendation,
    skipWelcomeOverlay,
    maybeShowWelcomeOverlay
  };
}


