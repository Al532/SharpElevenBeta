
import {
  buildDrillKeyCheckboxes,
  invertDrillKeysEnabled,
  setAllDrillKeysEnabled
} from './drill-key-selection.js';
import { initializeKeyPickerUi } from './drill-ui-runtime.js';

type KeysAssemblyDom = {
  selectedKeysSummary?: HTMLElement | null,
  keyCheckboxes?: HTMLElement | null,
  keyPicker?: HTMLElement | null,
  keyPickerBackdrop?: HTMLElement | null,
  closeKeyPicker?: HTMLElement | null
};

type KeysAssemblyState = {
  getEnabledKeys?: () => boolean[],
  setEnabledKeys?: (value: boolean[]) => void,
  setKeyPool?: (value: unknown[]) => void,
  getSavedKeySelectionPreset?: () => boolean[] | null,
  setSavedKeySelectionPreset?: (value: boolean[]) => void
};

type KeysAssemblyConstants = {
  PIANO_BLACK_KEY_COLUMNS?: Record<number, number>,
  PIANO_WHITE_KEY_COLUMNS?: Record<number, number>
};

type KeysAssemblyHelpers = {
  setKeyPickerOpen?: (isOpen: boolean) => void,
  stopPlaybackIfRunning?: () => void,
  getDisplayTranspositionSemitones?: () => number,
  keyLabelForPicker?: (value: number) => string,
  renderAccidentalTextHtml?: (value: string) => string,
  saveStoredKeySelectionPreset?: (value: boolean[] | null) => void,
  saveSettings?: () => void,
  trackEvent?: (name: string, props?: Record<string, unknown>) => void,
  alert?: (message: string) => void
};

type KeysAssemblyOptions = {
  dom?: KeysAssemblyDom,
  state?: KeysAssemblyState,
  constants?: KeysAssemblyConstants,
  helpers?: KeysAssemblyHelpers
};

/**
 * Creates the drill keys assembly from live root-app bindings. This keeps the
 * key picker, selected-keys UI, and key-preset workflow together in one domain
 * surface while preserving the same key-selection behavior.
 *
 * @param {object} [options]
 * @param {KeysAssemblyDom} [options.dom]
 * @param {KeysAssemblyState} [options.state]
 * @param {KeysAssemblyConstants} [options.constants]
 * @param {KeysAssemblyHelpers} [options.helpers]
 */
export function createDrillKeysRootAppAssembly({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
}: KeysAssemblyOptions = {}) {
  const {
    getEnabledKeys = () => [],
    setEnabledKeys = () => {},
    setKeyPool = () => {},
    getSavedKeySelectionPreset = () => null,
    setSavedKeySelectionPreset = () => {}
  } = state;
  const {
    PIANO_BLACK_KEY_COLUMNS = {},
    PIANO_WHITE_KEY_COLUMNS = {}
  } = constants;
  const {
    setKeyPickerOpen = () => {},
    stopPlaybackIfRunning = () => {},
    getDisplayTranspositionSemitones = () => 0,
    keyLabelForPicker = (value) => String(value),
    renderAccidentalTextHtml = (value) => String(value),
    saveStoredKeySelectionPreset = () => {},
    saveSettings = () => {},
    trackEvent = () => {},
    alert = () => {}
  } = helpers;

  function getEnabledKeyCount() {
    return getEnabledKeys().filter(Boolean).length;
  }

  function persistKeySelectionPreset() {
    saveStoredKeySelectionPreset(getSavedKeySelectionPreset());
  }

  function syncSelectedKeysSummary() {
    if (!dom.selectedKeysSummary) return;
    if (getEnabledKeyCount() === 12) {
      dom.selectedKeysSummary.innerHTML = 'Keys: All';
      return;
    }

    const selectedKeys = getEnabledKeys()
      .map((isEnabled, index) => (isEnabled ? keyLabelForPicker(index) : null))
      .filter(Boolean);
    dom.selectedKeysSummary.innerHTML = `Keys: ${selectedKeys.map(renderAccidentalTextHtml).join(' &middot; ')}`;
  }

  function restoreAllKeysIfNoneSelectedOnClose() {
    if (getEnabledKeyCount() !== 0) return;
    applyEnabledKeys(getEnabledKeys().map(() => true));
    saveSettings();
  }

  function isBlackDisplayPitchClass(pitchClass) {
    return [1, 3, 6, 8, 10].includes(pitchClass);
  }

  function updateKeyCheckboxVisualState(label, checkbox, keyIndex) {
    const displayPitchClass = (keyIndex + getDisplayTranspositionSemitones() + 12) % 12;
    const isBlackKey = isBlackDisplayPitchClass(displayPitchClass);
    const text = label.querySelector('.key-checkbox-text');
    label.classList.toggle('is-selected', checkbox.checked);
    label.classList.toggle('key-checkbox-black', isBlackKey);
    label.classList.toggle('key-checkbox-white', !isBlackKey);
    label.style.gridRow = isBlackKey ? '1' : '2';
    label.style.gridColumn = String(
      isBlackKey
        ? PIANO_BLACK_KEY_COLUMNS[displayPitchClass]
        : PIANO_WHITE_KEY_COLUMNS[displayPitchClass]
    );

    if (text) {
      text.innerHTML = renderAccidentalTextHtml(keyLabelForPicker(keyIndex));
    }
  }

  function syncKeyCheckboxStates() {
    dom.keyCheckboxes?.querySelectorAll<HTMLElement>('.key-checkbox-label').forEach((label, index) => {
      const checkbox = label.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (!checkbox) return;
      checkbox.checked = getEnabledKeys()[index];
      updateKeyCheckboxVisualState(label, checkbox, index);
    });
  }

  function applyEnabledKeys(nextEnabledKeys) {
    if (!Array.isArray(nextEnabledKeys) || nextEnabledKeys.length !== 12) return;
    setEnabledKeys(nextEnabledKeys.map(Boolean));
    setKeyPool([]);
    syncKeyCheckboxStates();
    syncSelectedKeysSummary();
  }

  function saveCurrentKeySelectionPreset() {
    setSavedKeySelectionPreset(getEnabledKeys().map(Boolean));
    persistKeySelectionPreset();
    trackEvent('key_preset_saved', {
      enabled_keys: getEnabledKeyCount()
    });
  }

  function loadKeySelectionPreset() {
    const savedKeySelectionPreset = getSavedKeySelectionPreset();
    if (!Array.isArray(savedKeySelectionPreset) || savedKeySelectionPreset.length !== 12) {
      alert('No saved key preset yet.');
      return;
    }

    applyEnabledKeys(savedKeySelectionPreset);
    saveSettings();
    trackEvent('key_preset_loaded', {
      enabled_keys: getEnabledKeyCount()
    });
  }

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
    invertKeysEnabled,
    getEnabledKeyCount,
    persistKeySelectionPreset,
    syncSelectedKeysSummary,
    restoreAllKeysIfNoneSelectedOnClose,
    isBlackDisplayPitchClass,
    updateKeyCheckboxVisualState,
    syncKeyCheckboxStates,
    applyEnabledKeys,
    saveCurrentKeySelectionPreset,
    loadKeySelectionPreset
  };
}


