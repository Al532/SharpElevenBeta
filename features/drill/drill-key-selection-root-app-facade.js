// @ts-check

/**
 * Creates the drill key-selection facade from live root-app bindings.
 * This keeps the enabled-keys UI/preset workflow out of `app.js` while
 * preserving the same key selection behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, Function>} [options.state]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillKeySelectionRootAppFacade({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
} = {}) {
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
    dom.keyCheckboxes?.querySelectorAll('.key-checkbox-label').forEach((label, index) => {
      const checkbox = label.querySelector('input[type="checkbox"]');
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

  return {
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
