
import { loadDrillSettings, saveDrillSettings } from './drill-settings.js';

type DrillSettingsPersistenceDom = Record<string, unknown>;

type DrillSettingsPersistenceConstants = {
  defaultMixerVolumes?: Record<string, number>;
};

type DrillSettingsPersistenceHelpers = {
  saveSharedPlaybackSettings?: (value: Record<string, unknown>) => void;
  saveStoredProgressionSettings?: (value: Record<string, unknown>) => void;
  buildSettingsSnapshot?: () => Record<string, unknown>;
  getCompingStyle?: () => string;
  getDrumsMode?: () => string;
  isWalkingBassEnabled?: () => boolean;
  loadStoredProgressionSettings?: () => Record<string, unknown> | null;
  loadStoredKeySelectionPreset?: () => unknown;
  applyLoadedSettings?: (value: Record<string, unknown>) => void;
  finalizeLoadedSettings?: () => void;
};

type DrillSettingsPersistenceState = {
  setSavedKeySelectionPreset?: (value: unknown) => void;
};

type CreateDrillSettingsPersistenceRootAppAssemblyOptions = {
  dom?: DrillSettingsPersistenceDom;
  constants?: DrillSettingsPersistenceConstants;
  helpers?: DrillSettingsPersistenceHelpers;
  state?: DrillSettingsPersistenceState;
};

/**
 * Creates the drill settings-persistence assembly from live root-app bindings.
 * This keeps the save/load wrapper glue out of `app.js` while preserving the
 * same persistence behavior.
 *
 * @param {object} [options]
 * @param {DrillSettingsPersistenceDom} [options.dom]
 * @param {DrillSettingsPersistenceConstants} [options.constants]
 * @param {DrillSettingsPersistenceHelpers} [options.helpers]
 * @param {DrillSettingsPersistenceState} [options.state]
 */
export function createDrillSettingsPersistenceRootAppAssembly({
  dom = {},
  constants = {},
  helpers = {},
  state = {}
}: CreateDrillSettingsPersistenceRootAppAssemblyOptions = {}) {
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


