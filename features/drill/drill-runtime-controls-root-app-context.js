// @ts-check

/**
 * Creates the drill runtime-controls context from live root-app bindings.
 * This keeps the late runtime-control glue out of `app.js` while preserving
 * the same event callback behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, Function>} [options.state]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillRuntimeControlsRootAppContext({
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
