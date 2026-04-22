export function formatDrillPianoSettingNumber(value) {
  return String(Math.round(Number(value || 0) * 1000) / 1000);
}

export function setDrillPianoMidiStatus(dom, message) {
  if (dom?.pianoMidiStatus) {
    dom.pianoMidiStatus.textContent = message;
  }
}

export function syncDrillPianoFadeControlsFromState({
  dom,
  pianoFadeSettings
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
} = {}) {
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
} = {}) {
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
} = {}) {
  function setPianoMidiStatus(message) {
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

  function applyPianoFadeSettings(nextSettings, { persist = true } = {}) {
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

  function applyPianoMidiSettings(nextSettings, { persist = true, reconnect = true } = {}) {
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

  function applyPianoPresetFromJsonText(jsonText) {
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
  applyPianoFadeSettings,
  refreshMidiInputs,
  stopAllMidiPianoVoices,
  applyPianoMidiSettings,
  getPianoMidiSettings,
  ensureMidiPianoRangePreload
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
