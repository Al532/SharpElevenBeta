type DrillPianoToolsTextControl = {
  value?: string;
  textContent?: string | null;
  focus?: () => void;
  select?: () => void;
  addEventListener?: (eventName: string, listener: (...args: unknown[]) => void) => void;
};

type DrillPianoToolsToggleControl = {
  checked?: boolean;
  addEventListener?: (eventName: string, listener: (...args: unknown[]) => void) => void;
};

type DrillPianoToolsButtonControl = {
  addEventListener?: (eventName: string, listener: (...args: unknown[]) => void) => void;
};

type DrillPianoToolsDom = {
  pianoMidiStatus?: DrillPianoToolsTextControl;
  pianoTimeConstantLow?: DrillPianoToolsTextControl;
  pianoTimeConstantHigh?: DrillPianoToolsTextControl;
  pianoSettingsJson?: DrillPianoToolsTextControl;
  pianoMidiEnabled?: DrillPianoToolsToggleControl;
  pianoMidiSustain?: DrillPianoToolsToggleControl;
  pianoMidiInput?: DrillPianoToolsTextControl;
  pianoMidiRefresh?: DrillPianoToolsButtonControl;
} & Record<string, unknown>;

type DrillPianoSettings = {
  timeConstantLow?: number | string;
  timeConstantHigh?: number | string;
  enabled?: boolean;
  sustainPedalEnabled?: boolean;
  inputId?: string;
} & Record<string, unknown>;

type DrillPianoSettingsApplyOptions = {
  persist?: boolean;
  reconnect?: boolean;
};

type ApplyDrillPianoFadeSettingsOptions = {
  nextSettings?: DrillPianoSettings;
  normalizePianoFadeSettings?: (value: unknown) => DrillPianoSettings;
  setPianoFadeSettings?: (value: DrillPianoSettings) => void;
  dom?: DrillPianoToolsDom;
  version?: string;
  getPianoMidiSettings?: () => DrillPianoSettings;
  saveSettings?: () => void;
  persist?: boolean;
};

type ApplyDrillPianoMidiSettingsOptions = {
  nextSettings?: DrillPianoSettings;
  normalizePianoMidiSettings?: (value: unknown) => DrillPianoSettings;
  setPianoMidiSettings?: (value: DrillPianoSettings) => void;
  dom?: DrillPianoToolsDom;
  version?: string;
  getPianoFadeSettings?: () => DrillPianoSettings;
  attachMidiInput?: () => void;
  saveSettings?: () => void;
  persist?: boolean;
  reconnect?: boolean;
};

export function formatDrillPianoSettingNumber(value: unknown) {
  return String(Math.round(Number(value || 0) * 1000) / 1000);
}

export function setDrillPianoMidiStatus(dom: DrillPianoToolsDom, message: string) {
  if (dom?.pianoMidiStatus) {
    dom.pianoMidiStatus.textContent = message;
  }
}

export function syncDrillPianoFadeControlsFromState({
  dom,
  pianoFadeSettings
}: {
  dom?: DrillPianoToolsDom;
  pianoFadeSettings?: DrillPianoSettings;
} = {}) {
  if (dom?.pianoTimeConstantLow) {
    dom.pianoTimeConstantLow.value = formatDrillPianoSettingNumber(pianoFadeSettings?.timeConstantLow);
  }
  if (dom?.pianoTimeConstantHigh) {
    dom.pianoTimeConstantHigh.value = formatDrillPianoSettingNumber(pianoFadeSettings?.timeConstantHigh);
  }
}

export function createDrillPianoSettingsPresetObject({
  version,
  pianoFadeSettings,
  pianoMidiSettings
}: {
  version?: string;
  pianoFadeSettings?: DrillPianoSettings;
  pianoMidiSettings?: DrillPianoSettings;
} = {}) {
  return {
    version,
    fadeSettings: { ...(pianoFadeSettings || {}) },
    midiSettings: { ...(pianoMidiSettings || {}) }
  };
}

export function refreshDrillPianoSettingsJson({
  dom,
  version,
  pianoFadeSettings,
  pianoMidiSettings
}: {
  dom?: DrillPianoToolsDom;
  version?: string;
  pianoFadeSettings?: DrillPianoSettings;
  pianoMidiSettings?: DrillPianoSettings;
} = {}) {
  if (!dom?.pianoSettingsJson) return;
  dom.pianoSettingsJson.value = JSON.stringify(
    createDrillPianoSettingsPresetObject({
      version,
      pianoFadeSettings,
      pianoMidiSettings
    }),
    null,
    2
  );
}

export function syncDrillPianoMidiControlsFromState({
  dom,
  pianoMidiSettings
}: {
  dom?: DrillPianoToolsDom;
  pianoMidiSettings?: DrillPianoSettings;
} = {}) {
  if (dom?.pianoMidiEnabled) {
    dom.pianoMidiEnabled.checked = Boolean(pianoMidiSettings?.enabled);
  }
  if (dom?.pianoMidiSustain) {
    dom.pianoMidiSustain.checked = pianoMidiSettings?.sustainPedalEnabled !== false;
  }
  if (dom?.pianoMidiInput && pianoMidiSettings?.inputId) {
    dom.pianoMidiInput.value = pianoMidiSettings.inputId;
  }
}

export function syncDrillPianoToolsUi({
  dom,
  version,
  pianoFadeSettings,
  pianoMidiSettings
}: {
  dom?: DrillPianoToolsDom;
  version?: string;
  pianoFadeSettings?: DrillPianoSettings;
  pianoMidiSettings?: DrillPianoSettings;
} = {}) {
  syncDrillPianoFadeControlsFromState({
    dom,
    pianoFadeSettings
  });
  syncDrillPianoMidiControlsFromState({
    dom,
    pianoMidiSettings
  });
  refreshDrillPianoSettingsJson({
    dom,
    version,
    pianoFadeSettings,
    pianoMidiSettings
  });
}

export function readDrillPianoFadeSettingsFromControls({
  dom,
  normalizePianoFadeSettings
}: {
  dom?: DrillPianoToolsDom;
  normalizePianoFadeSettings?: (value: unknown) => DrillPianoSettings;
} = {}) {
  return normalizePianoFadeSettings?.({
    timeConstantLow: dom?.pianoTimeConstantLow?.value,
    timeConstantHigh: dom?.pianoTimeConstantHigh?.value
  });
}

export function applyDrillPianoFadeSettings({
  nextSettings,
  normalizePianoFadeSettings,
  setPianoFadeSettings,
  dom,
  version,
  getPianoMidiSettings,
  saveSettings,
  persist = true
}: ApplyDrillPianoFadeSettingsOptions = {}) {
  const normalized = normalizePianoFadeSettings?.(nextSettings);
  setPianoFadeSettings?.(normalized);
  syncDrillPianoFadeControlsFromState({
    dom,
    pianoFadeSettings: normalized
  });
  refreshDrillPianoSettingsJson({
    dom,
    version,
    pianoFadeSettings: normalized,
    pianoMidiSettings: getPianoMidiSettings?.()
  });
  if (persist) {
    saveSettings?.();
  }
}

export function applyDrillPianoMidiSettings({
  nextSettings,
  normalizePianoMidiSettings,
  setPianoMidiSettings,
  dom,
  version,
  getPianoFadeSettings,
  attachMidiInput,
  saveSettings,
  persist = true,
  reconnect = true
}: ApplyDrillPianoMidiSettingsOptions = {}) {
  const normalized = normalizePianoMidiSettings?.(nextSettings);
  setPianoMidiSettings?.(normalized);
  syncDrillPianoMidiControlsFromState({
    dom,
    pianoMidiSettings: normalized
  });
  if (reconnect) {
    attachMidiInput?.();
  }
  refreshDrillPianoSettingsJson({
    dom,
    version,
    pianoFadeSettings: getPianoFadeSettings?.(),
    pianoMidiSettings: normalized
  });
  if (persist) {
    saveSettings?.();
  }
}

export function applyDrillPianoPresetFromJsonText({
  jsonText,
  normalizePianoFadeSettings,
  normalizePianoMidiSettings,
  getCurrentPianoMidiSettings,
  setPianoFadeSettings,
  setPianoMidiSettings,
  dom,
  version,
  attachMidiInput,
  saveSettings
}: {
  jsonText?: string;
  normalizePianoFadeSettings?: (value: unknown) => DrillPianoSettings;
  normalizePianoMidiSettings?: (value: unknown) => DrillPianoSettings;
  getCurrentPianoMidiSettings?: () => DrillPianoSettings;
  setPianoFadeSettings?: (value: DrillPianoSettings) => void;
  setPianoMidiSettings?: (value: DrillPianoSettings) => void;
  dom?: DrillPianoToolsDom;
  version?: string;
  attachMidiInput?: () => void;
  saveSettings?: () => void;
} = {}) {
  const parsed = JSON.parse(jsonText);
  const fadeSettings = normalizePianoFadeSettings?.(parsed.fadeSettings || parsed);
  const midiSettings = normalizePianoMidiSettings?.(
    parsed.midiSettings || getCurrentPianoMidiSettings?.()
  );
  setPianoFadeSettings?.(fadeSettings);
  setPianoMidiSettings?.(midiSettings);
  syncDrillPianoToolsUi({
    dom,
    version,
    pianoFadeSettings: fadeSettings,
    pianoMidiSettings: midiSettings
  });
  attachMidiInput?.();
  saveSettings?.();
}

export function createDrillPianoToolsAppFacade({
  dom,
  version,
  getPianoFadeSettings,
  setPianoFadeSettings,
  normalizePianoFadeSettings,
  getPianoMidiSettings,
  setPianoMidiSettings,
  normalizePianoMidiSettings,
  attachMidiInput,
  saveSettings
}: {
  dom?: DrillPianoToolsDom;
  version?: string;
  getPianoFadeSettings?: () => DrillPianoSettings;
  setPianoFadeSettings?: (value: DrillPianoSettings) => void;
  normalizePianoFadeSettings?: (value: unknown) => DrillPianoSettings;
  getPianoMidiSettings?: () => DrillPianoSettings;
  setPianoMidiSettings?: (value: DrillPianoSettings) => void;
  normalizePianoMidiSettings?: (value: unknown) => DrillPianoSettings;
  attachMidiInput?: () => void;
  saveSettings?: () => void;
} = {}) {
  function setPianoMidiStatus(message: string) {
    setDrillPianoMidiStatus(dom, message);
  }

  function refreshPianoSettingsJson() {
    refreshDrillPianoSettingsJson({
      dom,
      version,
      pianoFadeSettings: getPianoFadeSettings?.(),
      pianoMidiSettings: getPianoMidiSettings?.()
    });
  }

  function syncPianoToolsUi() {
    syncDrillPianoToolsUi({
      dom,
      version,
      pianoFadeSettings: getPianoFadeSettings?.(),
      pianoMidiSettings: getPianoMidiSettings?.()
    });
  }

  function readPianoFadeSettingsFromControls() {
    return readDrillPianoFadeSettingsFromControls({
      dom,
      normalizePianoFadeSettings
    });
  }

  function applyPianoFadeSettings(nextSettings: DrillPianoSettings, { persist = true }: DrillPianoSettingsApplyOptions = {}) {
    applyDrillPianoFadeSettings({
      nextSettings,
      normalizePianoFadeSettings,
      setPianoFadeSettings,
      dom,
      version,
      getPianoMidiSettings,
      saveSettings,
      persist
    });
  }

  function applyPianoMidiSettings(nextSettings: DrillPianoSettings, { persist = true, reconnect = true }: DrillPianoSettingsApplyOptions = {}) {
    applyDrillPianoMidiSettings({
      nextSettings,
      normalizePianoMidiSettings,
      setPianoMidiSettings,
      dom,
      version,
      getPianoFadeSettings,
      attachMidiInput,
      saveSettings,
      persist,
      reconnect
    });
  }

  function applyPianoPresetFromJsonText(jsonText: string) {
    applyDrillPianoPresetFromJsonText({
      jsonText,
      normalizePianoFadeSettings,
      normalizePianoMidiSettings,
      getCurrentPianoMidiSettings: getPianoMidiSettings,
      setPianoFadeSettings,
      setPianoMidiSettings,
      dom,
      version,
      attachMidiInput,
      saveSettings
    });
  }

  return {
    setPianoMidiStatus,
    refreshPianoSettingsJson,
    syncPianoToolsUi,
    readPianoFadeSettingsFromControls,
    applyPianoFadeSettings,
    applyPianoMidiSettings,
    applyPianoPresetFromJsonText
  };
}

export function initializeDrillPianoControls({
  dom,
  readPianoFadeSettingsFromControls,
  refreshPianoSettingsJson,
  setPianoFadeSettings,
  applyPianoFadeSettings,
  refreshMidiInputs,
  stopAllMidiPianoVoices,
  applyPianoMidiSettings,
  getPianoMidiSettings,
  ensureMidiPianoRangePreload
}: {
  dom?: DrillPianoToolsDom;
  readPianoFadeSettingsFromControls?: () => DrillPianoSettings;
  refreshPianoSettingsJson?: () => void;
  setPianoFadeSettings?: (value: DrillPianoSettings) => void;
  applyPianoFadeSettings?: (value: DrillPianoSettings) => void;
  refreshMidiInputs?: () => Promise<void> | void;
  stopAllMidiPianoVoices?: (immediate?: boolean) => void;
  applyPianoMidiSettings?: (value: DrillPianoSettings, options?: { reconnect?: boolean }) => void;
  getPianoMidiSettings?: () => DrillPianoSettings;
  ensureMidiPianoRangePreload?: () => void;
} = {}) {
  [
    dom?.pianoTimeConstantLow,
    dom?.pianoTimeConstantHigh
  ].filter(Boolean).forEach((input) => {
    input.addEventListener('input', () => {
      setPianoFadeSettings?.(readPianoFadeSettingsFromControls?.());
      refreshPianoSettingsJson?.();
    });
    input.addEventListener('change', () => {
      applyPianoFadeSettings?.(readPianoFadeSettingsFromControls?.());
    });
  });

  dom?.pianoMidiEnabled?.addEventListener('change', async () => {
    if (dom.pianoMidiEnabled.checked) {
      await refreshMidiInputs?.();
    } else {
      stopAllMidiPianoVoices?.(true);
    }
    applyPianoMidiSettings?.({
      ...(getPianoMidiSettings?.() || {}),
      enabled: dom.pianoMidiEnabled.checked
    });
    if (dom.pianoMidiEnabled.checked) {
      ensureMidiPianoRangePreload?.();
    }
  });

  dom?.pianoMidiInput?.addEventListener('change', () => {
    applyPianoMidiSettings?.({
      ...(getPianoMidiSettings?.() || {}),
      inputId: dom.pianoMidiInput.value
    });
  });

  dom?.pianoMidiSustain?.addEventListener('change', () => {
    applyPianoMidiSettings?.({
      ...(getPianoMidiSettings?.() || {}),
      sustainPedalEnabled: dom.pianoMidiSustain.checked
    }, { reconnect: false });
  });

  dom?.pianoMidiRefresh?.addEventListener('click', () => {
    refreshMidiInputs?.();
  });
}

