// @ts-check

import {
  buildDrillKeyCheckboxes,
  invertDrillKeysEnabled,
  setAllDrillKeysEnabled
} from './drill-key-selection.js';
import { initializeKeyPickerUi } from './drill-ui-runtime.js';

/**
 * Creates the drill key-picker root assembly from live root-app bindings.
 * This keeps the picker initialization and checkbox/bulk-toggle wiring out of
 * `app.js` while preserving the same key-selection side effects.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, Function>} [options.state]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillKeyPickerRootAppAssembly({
  dom = {},
  state = {},
  helpers = {}
} = {}) {
  const {
    getEnabledKeys = () => [],
    setEnabledKeys = () => {},
    setKeyPool = () => {}
  } = state;
  const {
    setKeyPickerOpen = () => {},
    stopPlaybackIfRunning = () => {},
    restoreAllKeysIfNoneSelectedOnClose = () => {},
    updateKeyCheckboxVisualState = () => {},
    syncSelectedKeysSummary = () => {},
    saveSettings = () => {},
    trackEvent = () => {},
    getEnabledKeyCount = () => 0,
    applyEnabledKeys = () => {}
  } = helpers;

  function initialize() {
    initializeKeyPickerUi({
      keyPicker: dom.keyPicker,
      keyPickerBackdrop: dom.keyPickerBackdrop,
      closeKeyPickerButton: dom.closeKeyPicker,
      selectedKeysSummary: dom.selectedKeysSummary,
      setKeyPickerOpen,
      stopPlaybackIfRunning,
      restoreAllKeysIfNoneSelectedOnClose
    });
  }

  function buildKeyCheckboxes() {
    buildDrillKeyCheckboxes({
      keyCheckboxes: dom.keyCheckboxes,
      enabledKeys: getEnabledKeys(),
      updateKeyCheckboxVisualState,
      syncSelectedKeysSummary,
      onKeyChange: ({ index, checked, label, checkbox }) => {
        const nextEnabledKeys = getEnabledKeys().slice();
        nextEnabledKeys[index] = checked;
        setEnabledKeys(nextEnabledKeys);
        updateKeyCheckboxVisualState(label, checkbox, index);
        setKeyPool([]);
        syncSelectedKeysSummary();
        saveSettings();
        trackEvent('key_selection_changed', {
          enabled_keys: getEnabledKeyCount(),
          key_index: index,
          key_state: checked ? 'enabled' : 'disabled'
        });
      }
    });
  }

  function setAllKeysEnabled(isEnabled) {
    setAllDrillKeysEnabled({
      enabledKeys: getEnabledKeys(),
      applyEnabledKeys,
      saveSettings,
      isEnabled
    });
  }

  function invertKeysEnabled() {
    invertDrillKeysEnabled({
      enabledKeys: getEnabledKeys(),
      applyEnabledKeys,
      saveSettings
    });
  }

  return {
    initialize,
    buildKeyCheckboxes,
    setAllKeysEnabled,
    invertKeysEnabled
  };
}
