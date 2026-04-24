type KeyCheckboxLabel = HTMLLabelElement & {
  querySelector(selectors: '.key-checkbox-text'): HTMLSpanElement | null,
  querySelector(selectors: 'input[type="checkbox"]'): HTMLInputElement | null
};

type BuildDrillKeyCheckboxesOptions = {
  keyCheckboxes?: HTMLElement | null,
  enabledKeys?: boolean[],
  onKeyChange?: (payload: {
    index: number,
    checked: boolean,
    label: HTMLLabelElement,
    checkbox: HTMLInputElement
  }) => void,
  updateKeyCheckboxVisualState?: (label: HTMLLabelElement, checkbox: HTMLInputElement, index: number) => void,
  syncSelectedKeysSummary?: () => void
};

type ToggleDrillKeysOptions = {
  enabledKeys?: boolean[],
  applyEnabledKeys?: (enabledKeys: boolean[]) => void,
  saveSettings?: () => void,
  isEnabled?: boolean
};

export function buildDrillKeyCheckboxes({
  keyCheckboxes,
  enabledKeys = [],
  onKeyChange,
  updateKeyCheckboxVisualState,
  syncSelectedKeysSummary
}: BuildDrillKeyCheckboxesOptions = {}) {
  if (!keyCheckboxes) return;
  keyCheckboxes.innerHTML = '';
  for (let index = 0; index < 12; index += 1) {
    const label = document.createElement('label') as KeyCheckboxLabel;
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
}: ToggleDrillKeysOptions = {}) {
  applyEnabledKeys?.(enabledKeys.map(() => Boolean(isEnabled)));
  saveSettings?.();
}

export function invertDrillKeysEnabled({
  enabledKeys = [],
  applyEnabledKeys,
  saveSettings
}: ToggleDrillKeysOptions = {}) {
  applyEnabledKeys?.(enabledKeys.map((isEnabled) => !isEnabled));
  saveSettings?.();
}

