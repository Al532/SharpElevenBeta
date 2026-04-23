// @ts-check

import { initializeDrillPianoControls } from './drill-piano-tools.js';
import { initializeDrillRuntimeControls } from './drill-runtime-controls.js';
import { initializeDrillScreen } from './drill-ui-shell.js';
import { initializeHarmonyDisplayObservers } from './drill-ui-runtime.js';

function createScreenContext({
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
    consumePendingPracticeSessionIntoUi = () => false,
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
    consumePendingPracticeSessionIntoUi: ({ afterApply } = {}) => consumePendingPracticeSessionIntoUi({
      afterApply
    }),
    setWelcomeOverlayVisible,
    maybeShowWelcomeOverlay
  };
}

function createRuntimeControlsContext({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
} = {}) {
  const {
    getIsPlaying = () => false,
    getAudioContext = () => null,
    getCurrentKey = () => 0,
    getNextPreviewLeadUnit = () => '',
    getNextPreviewInputUnit = () => ''
  } = state;
  const {
    noteFadeout = 0,
    nextPreviewUnitBars = '',
    nextPreviewUnitSeconds = ''
  } = constants;
  const {
    stop = () => {},
    start = () => {},
    togglePause = () => {},
    syncNextPreviewControlDisplay = () => {},
    refreshDisplayedHarmony = () => {},
    stopActiveChordVoices = () => {},
    rebuildPreparedCompingPlans = () => {},
    buildPreparedBassPlan = () => {},
    commitNextPreviewValueFromInput = () => {},
    saveSettings = () => {},
    trackEvent = () => {},
    formatPreviewNumber = (value) => String(value),
    getNextPreviewLeadBars = () => 0,
    getNextPreviewLeadSeconds = () => 0,
    convertNextPreviewValueToUnit = () => {},
    setNextPreviewInputUnit = () => {},
    setAllKeysEnabled = () => {},
    getEnabledKeyCount = () => 0,
    invertKeysEnabled = () => {},
    saveCurrentKeySelectionPreset = () => {},
    loadKeySelectionPreset = () => {},
    updateKeyPickerLabels = () => {},
    syncPatternPreview = () => {},
    applyDisplayMode = () => {},
    normalizeDisplayMode = (value) => value,
    normalizeHarmonyDisplayMode = (value) => value,
    applyBeatIndicatorVisibility = () => {},
    applyCurrentHarmonyVisibility = () => {},
    fitHarmonyDisplay = () => {},
    applyMixerSettings = () => {}
  } = helpers;

  return {
    dom,
    onStartStopClick: () => {
      if (getIsPlaying()) stop();
      else start();
    },
    onPauseClick: togglePause,
    onTempoInput: () => {
      if (dom.tempoValue && dom.tempoSlider) {
        dom.tempoValue.textContent = dom.tempoSlider.value;
      }
      syncNextPreviewControlDisplay();
      refreshDisplayedHarmony();
      const audioContext = getAudioContext();
      if (getIsPlaying() && audioContext) {
        stopActiveChordVoices(audioContext.currentTime, noteFadeout);
        rebuildPreparedCompingPlans(getCurrentKey());
        buildPreparedBassPlan();
      }
    },
    onNextPreviewValueChange: () => {
      commitNextPreviewValueFromInput();
      saveSettings();
      trackEvent('next_preview_changed', {
        next_preview_unit: getNextPreviewInputUnit(),
        next_preview_bars: formatPreviewNumber(getNextPreviewLeadBars()),
        next_preview_seconds: formatPreviewNumber(getNextPreviewLeadSeconds(), 1)
      });
    },
    onNextPreviewUnitToggleChange: () => {
      convertNextPreviewValueToUnit(
        dom.nextPreviewUnitToggle?.checked ? nextPreviewUnitSeconds : nextPreviewUnitBars
      );
      setNextPreviewInputUnit(getNextPreviewLeadUnit());
      syncNextPreviewControlDisplay();
      refreshDisplayedHarmony();
      saveSettings();
      trackEvent('next_preview_unit_changed', {
        next_preview_unit: getNextPreviewInputUnit()
      });
    },
    onSelectAllKeys: () => {
      setAllKeysEnabled(true);
      trackEvent('all_keys_selected', {
        enabled_keys: getEnabledKeyCount()
      });
    },
    onInvertKeys: () => {
      invertKeysEnabled();
      trackEvent('key_selection_inverted', {
        enabled_keys: getEnabledKeyCount()
      });
    },
    onClearKeys: () => {
      setAllKeysEnabled(false);
      trackEvent('all_keys_cleared', {
        enabled_keys: getEnabledKeyCount()
      });
    },
    onSaveKeyPreset: saveCurrentKeySelectionPreset,
    onLoadKeyPreset: loadKeySelectionPreset,
    onTranspositionChange: () => {
      updateKeyPickerLabels();
      refreshDisplayedHarmony();
      saveSettings();
      syncPatternPreview();
      trackEvent('display_transposition_changed', {
        transposition: dom.transpositionSelect?.value
      });
    },
    onDisplayModeChange: () => {
      applyDisplayMode();
      saveSettings();
      trackEvent('display_mode_changed', {
        display_mode: normalizeDisplayMode(dom.displayMode?.value)
      });
    },
    onHarmonyDisplayModeChange: () => {
      refreshDisplayedHarmony();
      saveSettings();
      trackEvent('harmony_display_mode_changed', {
        alternate_display: normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value)
      });
    },
    onSymbolToggleChange: () => {
      refreshDisplayedHarmony();
      saveSettings();
    },
    onShowBeatIndicatorChange: () => {
      applyBeatIndicatorVisibility();
      saveSettings();
    },
    onHideCurrentHarmonyChange: () => {
      applyCurrentHarmonyVisibility();
      refreshDisplayedHarmony();
      fitHarmonyDisplay();
      saveSettings();
    },
    onMasterVolumeInput: applyMixerSettings,
    onBassVolumeInput: applyMixerSettings,
    onDrumsVolumeInput: applyMixerSettings,
    onMasterVolumeChange: () => {
      saveSettings();
      trackEvent('master_volume_changed', {
        volume_percent: Number(dom.masterVolume?.value)
      });
    },
    onBassVolumeChange: () => {
      saveSettings();
      trackEvent('bass_volume_changed', {
        volume_percent: Number(dom.bassVolume?.value)
      });
    },
    onStringsVolumeChange: () => {
      saveSettings();
      trackEvent('strings_volume_changed', {
        volume_percent: Number(dom.stringsVolume?.value)
      });
    },
    onDrumsVolumeChange: () => {
      saveSettings();
      trackEvent('drums_volume_changed', {
        volume_percent: Number(dom.drumsVolume?.value)
      });
    }
  };
}

/**
 * Creates the drill UI bootstrap assembly from live root-app bindings.
 * This keeps the late screen/control/observer initialization contracts out of
 * `app.js` while preserving the same one-shot drill UI bootstrap behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.screen]
 * @param {Record<string, any>} [options.screenDom]
 * @param {Record<string, any>} [options.screenState]
 * @param {Record<string, any>} [options.screenConstants]
 * @param {Record<string, any>} [options.screenHelpers]
 * @param {Record<string, any>} [options.harmonyDisplayObservers]
 * @param {Record<string, any>} [options.pianoControls]
 * @param {Record<string, any>} [options.runtimeControls]
 * @param {Record<string, any>} [options.runtimeControlsDom]
 * @param {Record<string, any>} [options.runtimeControlsState]
 * @param {Record<string, any>} [options.runtimeControlsConstants]
 * @param {Record<string, any>} [options.runtimeControlsHelpers]
 */
export function createDrillUiBootstrapRootAppAssembly({
  screen = {},
  screenDom = {},
  screenState = {},
  screenConstants = {},
  screenHelpers = {},
  harmonyDisplayObservers = {},
  pianoControls = {},
  runtimeControls = {},
  runtimeControlsDom = {},
  runtimeControlsState = {},
  runtimeControlsConstants = {},
  runtimeControlsHelpers = {}
} = {}) {
  const resolvedScreen = Object.keys(screen).length > 0
    ? screen
    : createScreenContext({
        dom: screenDom,
        state: screenState,
        constants: screenConstants,
        helpers: screenHelpers
      });
  const resolvedRuntimeControls = Object.keys(runtimeControls).length > 0
    ? runtimeControls
    : createRuntimeControlsContext({
        dom: runtimeControlsDom,
        state: runtimeControlsState,
        constants: runtimeControlsConstants,
        helpers: runtimeControlsHelpers
      });

  return {
    initializeScreen: () => initializeDrillScreen(resolvedScreen),
    initializeHarmonyDisplayObservers: () => initializeHarmonyDisplayObservers(harmonyDisplayObservers),
    initializePianoControls: () => initializeDrillPianoControls(pianoControls),
    initializeRuntimeControls: () => initializeDrillRuntimeControls(resolvedRuntimeControls)
  };
}
