export function saveDrillSettings({
  saveSharedPlaybackSettings,
  saveStoredProgressionSettings,
  buildSettingsSnapshot,
  getCompingStyle,
  getDrumsMode,
  isWalkingBassEnabled,
  dom
} = {}) {
  saveSharedPlaybackSettings?.({
    compingStyle: getCompingStyle?.(),
    drumsMode: getDrumsMode?.(),
    customMediumSwingBass: isWalkingBassEnabled?.(),
    masterVolume: Number(dom?.masterVolume?.value || 0),
    bassVolume: Number(dom?.bassVolume?.value || 0),
    stringsVolume: Number(dom?.stringsVolume?.value || 0),
    drumsVolume: Number(dom?.drumsVolume?.value || 0)
  });
  saveStoredProgressionSettings?.(buildSettingsSnapshot?.());
}

export function loadDrillSettings({
  loadStoredProgressionSettings,
  loadStoredKeySelectionPreset,
  applyLoadedSettings,
  finalizeLoadedSettings,
  setSavedKeySelectionPreset
} = {}) {
  const storedSettings = loadStoredProgressionSettings?.();
  if (storedSettings) {
    applyLoadedSettings?.(storedSettings);
  }
  setSavedKeySelectionPreset?.(loadStoredKeySelectionPreset?.());
  finalizeLoadedSettings?.();
}
