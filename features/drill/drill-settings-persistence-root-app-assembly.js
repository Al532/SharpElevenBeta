// @ts-check

import { loadDrillSettings, saveDrillSettings } from './drill-settings.js';

/**
 * Creates the drill settings-persistence assembly from live root-app bindings.
 * This keeps the save/load wrapper glue out of `app.js` while preserving the
 * same persistence behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, Function>} [options.helpers]
 * @param {Record<string, Function>} [options.state]
 */
export function createDrillSettingsPersistenceRootAppAssembly({
  dom = {},
  constants = {},
  helpers = {},
  state = {}
} = {}) {
  const {
    defaultMixerVolumes = {}
  } = constants;
  const {
    saveSharedPlaybackSettings,
    saveStoredProgressionSettings,
    buildSettingsSnapshot,
    getCompingStyle,
    getDrumsMode,
    isWalkingBassEnabled,
    loadStoredProgressionSettings,
    loadStoredKeySelectionPreset,
    applyLoadedSettings,
    finalizeLoadedSettings
  } = helpers;
  const {
    setSavedKeySelectionPreset = () => {}
  } = state;

  function saveSettings() {
    saveDrillSettings({
      saveSharedPlaybackSettings,
      saveStoredProgressionSettings,
      buildSettingsSnapshot,
      getCompingStyle,
      getDrumsMode,
      isWalkingBassEnabled,
      dom,
      defaultMixerVolumes
    });
  }

  function loadSettings() {
    loadDrillSettings({
      loadStoredProgressionSettings,
      loadStoredKeySelectionPreset,
      applyLoadedSettings,
      finalizeLoadedSettings,
      setSavedKeySelectionPreset
    });
  }

  return {
    saveSettings,
    loadSettings
  };
}
