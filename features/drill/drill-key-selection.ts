// @ts-nocheck
export function buildDrillKeyCheckboxes({
  keyCheckboxes,
  enabledKeys = [],
  onKeyChange,
  updateKeyCheckboxVisualState,
  syncSelectedKeysSummary
} = {}) {
  if (!keyCheckboxes) return;
  keyCheckboxes.innerHTML = '';
  for (let index = 0; index < 12; index += 1) {
    const label = document.createElement('label');
    label.className = 'key-checkbox-label';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(enabledKeys[index]);
    checkbox.dataset.keyIndex = String(index);
    checkbox.addEventListener('change', () => {
      onKeyChange?.({
        index,
        checked: checkbox.checked,
        label,
        checkbox
      });
    });
    const text = document.createElement('span');
    text.className = 'key-checkbox-text';
    label.appendChild(checkbox);
    label.appendChild(text);
    updateKeyCheckboxVisualState?.(label, checkbox, index);
    keyCheckboxes.appendChild(label);
  }
  syncSelectedKeysSummary?.();
}

export function setAllDrillKeysEnabled({
  enabledKeys = [],
  applyEnabledKeys,
  saveSettings,
  isEnabled
} = {}) {
  applyEnabledKeys?.(enabledKeys.map(() => Boolean(isEnabled)));
  saveSettings?.();
}

export function invertDrillKeysEnabled({
  enabledKeys = [],
  applyEnabledKeys,
  saveSettings
} = {}) {
  applyEnabledKeys?.(enabledKeys.map((isEnabled) => !isEnabled));
  saveSettings?.();
}

