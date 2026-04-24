
import { initializeDrillPianoControls } from './drill-piano-tools.js';
import { initializeDrillRuntimeControls } from './drill-runtime-controls.js';
import { initializeDrillScreen } from './drill-ui-shell.js';
import { initializeHarmonyDisplayObservers } from './drill-ui-runtime.js';
import type {
  DrillUiBootstrapRuntimeControlsContext,
  DrillUiBootstrapRuntimeControlsConstants,
  DrillUiBootstrapRuntimeControlsDom,
  DrillUiBootstrapRuntimeControlsHelpers,
  DrillUiBootstrapRuntimeControlsState,
  DrillUiBootstrapScreenConstants,
  DrillUiBootstrapScreenContext,
  DrillUiBootstrapScreenDom,
  DrillUiBootstrapScreenHelpers,
  DrillUiBootstrapScreenState
} from './drill-ui-types.js';

type CreateDrillUiBootstrapRootAppAssemblyOptions = {
  screen?: DrillUiBootstrapScreenContext;
  screenDom?: DrillUiBootstrapScreenDom;
  screenState?: DrillUiBootstrapScreenState;
  screenConstants?: DrillUiBootstrapScreenConstants;
  screenHelpers?: DrillUiBootstrapScreenHelpers;
  harmonyDisplayObservers?: Record<string, unknown>;
  pianoControls?: Record<string, unknown>;
  runtimeControls?: DrillUiBootstrapRuntimeControlsContext;
  runtimeControlsDom?: DrillUiBootstrapRuntimeControlsDom;
  runtimeControlsState?: DrillUiBootstrapRuntimeControlsState;
  runtimeControlsConstants?: DrillUiBootstrapRuntimeControlsConstants;
  runtimeControlsHelpers?: DrillUiBootstrapRuntimeControlsHelpers;
};

function createScreenContext({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
}: {
  dom?: DrillUiBootstrapScreenDom;
  state?: DrillUiBootstrapScreenState;
  constants?: DrillUiBootstrapScreenConstants;
  helpers?: DrillUiBootstrapScreenHelpers;
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
    normalizePresetName = (value: unknown) => String(value ?? ''),
    setEditorPatternMode = () => {},
    getSelectedProgressionMode = () => '',
    normalizePatternMode = (value: unknown) => String(value ?? ''),
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

  const context: DrillUiBootstrapScreenContext = {
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
    consumePendingPracticeSessionIntoUi: ({ afterApply }: { afterApply?: () => void } = {}) => consumePendingPracticeSessionIntoUi({
      afterApply
    }),
    setWelcomeOverlayVisible,
    maybeShowWelcomeOverlay
  };

  return context;
}

function createRuntimeControlsContext({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
}: {
  dom?: DrillUiBootstrapRuntimeControlsDom;
  state?: DrillUiBootstrapRuntimeControlsState;
  constants?: DrillUiBootstrapRuntimeControlsConstants;
  helpers?: DrillUiBootstrapRuntimeControlsHelpers;
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
    formatPreviewNumber = (value: unknown) => String(value),
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
    normalizeDisplayMode = (value: unknown) => String(value ?? ''),
    normalizeHarmonyDisplayMode = (value: unknown) => String(value ?? ''),
    applyBeatIndicatorVisibility = () => {},
    applyCurrentHarmonyVisibility = () => {},
    fitHarmonyDisplay = () => {},
    applyMixerSettings = () => {}
  } = helpers;

  const context: DrillUiBootstrapRuntimeControlsContext = {
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

  return context;
}

/**
 * Creates the drill UI bootstrap assembly from live root-app bindings.
 * This keeps the late screen/control/observer initialization contracts out of
 * `app.js` while preserving the same one-shot drill UI bootstrap behavior.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.screen]
 * @param {Record<string, unknown>} [options.screenDom]
 * @param {Record<string, unknown>} [options.screenState]
 * @param {Record<string, unknown>} [options.screenConstants]
 * @param {Record<string, unknown>} [options.screenHelpers]
 * @param {Record<string, unknown>} [options.harmonyDisplayObservers]
 * @param {Record<string, unknown>} [options.pianoControls]
 * @param {Record<string, unknown>} [options.runtimeControls]
 * @param {Record<string, unknown>} [options.runtimeControlsDom]
 * @param {Record<string, unknown>} [options.runtimeControlsState]
 * @param {Record<string, unknown>} [options.runtimeControlsConstants]
 * @param {Record<string, unknown>} [options.runtimeControlsHelpers]
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
}: CreateDrillUiBootstrapRootAppAssemblyOptions = {}) {
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


