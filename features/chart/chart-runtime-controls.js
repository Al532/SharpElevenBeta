export function bindChartRuntimeControls({
  chartSearchInput,
  fixtureSelect,
  transposeSelect,
  sheetGrid,
  harmonyDisplayMode,
  useMajorTriangleSymbol,
  useHalfDiminishedSymbol,
  useDiminishedSymbol,
  tempoInput,
  compingStyleSelect,
  drumsSelect,
  walkingBassToggle,
  masterVolume,
  bassVolume,
  stringsVolume,
  drumsVolume,
  playButton,
  stopButton,
  clearSelectionButton,
  sendSelectionToDrillButton,
  onSearch,
  onFixtureChange,
  onTransposeChange,
  onBarClick,
  onHarmonyDisplayModeChange,
  onSymbolToggleChange,
  onTempoChange,
  onPlaybackSettingChange,
  onMixerInput,
  onPlayClick,
  onStopClick,
  onClearSelection,
  onSendSelectionToDrill,
  onBeforeUnload
} = {}) {
  chartSearchInput?.addEventListener('input', onSearch);
  fixtureSelect?.addEventListener('change', onFixtureChange);
  transposeSelect?.addEventListener('change', onTransposeChange);
  sheetGrid?.addEventListener('click', onBarClick);
  harmonyDisplayMode?.addEventListener('change', onHarmonyDisplayModeChange);

  [
    useMajorTriangleSymbol,
    useHalfDiminishedSymbol,
    useDiminishedSymbol
  ].filter(Boolean).forEach((toggle) => {
    toggle.addEventListener('change', onSymbolToggleChange);
  });

  tempoInput?.addEventListener('change', onTempoChange);
  compingStyleSelect?.addEventListener('change', onPlaybackSettingChange);
  drumsSelect?.addEventListener('change', onPlaybackSettingChange);
  walkingBassToggle?.addEventListener('change', onPlaybackSettingChange);

  [masterVolume, bassVolume, stringsVolume, drumsVolume].forEach((slider) => {
    slider?.addEventListener('input', onMixerInput);
  });

  playButton?.addEventListener('click', onPlayClick);
  stopButton?.addEventListener('click', onStopClick);
  clearSelectionButton?.addEventListener('click', onClearSelection);
  sendSelectionToDrillButton?.addEventListener('click', onSendSelectionToDrill);

  window.addEventListener('beforeunload', onBeforeUnload);
}
