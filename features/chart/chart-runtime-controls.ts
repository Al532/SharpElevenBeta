type BindChartRuntimeControlsOptions = {
  chartSearchInput?: HTMLInputElement | null,
  fixtureSelect?: HTMLSelectElement | null,
  transposeSelect?: HTMLSelectElement | null,
  sheetGrid?: HTMLElement | null,
  harmonyDisplayMode?: HTMLSelectElement | null,
  useMajorTriangleSymbol?: HTMLInputElement | null,
  useHalfDiminishedSymbol?: HTMLInputElement | null,
  useDiminishedSymbol?: HTMLInputElement | null,
  tempoInput?: HTMLInputElement | null,
  compingStyleSelect?: HTMLSelectElement | null,
  drumsSelect?: HTMLSelectElement | null,
  walkingBassToggle?: HTMLInputElement | null,
  masterVolume?: HTMLInputElement | null,
  bassVolume?: HTMLInputElement | null,
  stringsVolume?: HTMLInputElement | null,
  drumsVolume?: HTMLInputElement | null,
  playButton?: HTMLButtonElement | null,
  stopButton?: HTMLButtonElement | null,
  clearSelectionButton?: HTMLButtonElement | null,
  sendSelectionToPracticeButton?: HTMLButtonElement | null,
  onSearch?: EventListener | null,
  onFixtureChange?: EventListener | null,
  onTransposeChange?: EventListener | null,
  onBarClick?: EventListener | null,
  onHarmonyDisplayModeChange?: EventListener | null,
  onSymbolToggleChange?: EventListener | null,
  onTempoChange?: EventListener | null,
  onPlaybackSettingChange?: EventListener | null,
  onMixerInput?: EventListener | null,
  onPlayClick?: EventListener | null,
  onStopClick?: EventListener | null,
  onClearSelection?: EventListener | null,
  onSendSelectionToPractice?: EventListener | null,
  onBeforeUnload?: EventListener | null
};

/**
 * @param {BindChartRuntimeControlsOptions} [options]
 * @returns {void}
 */
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
  sendSelectionToPracticeButton,
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
  onSendSelectionToPractice,
  onBeforeUnload
}: BindChartRuntimeControlsOptions = {}) {
  chartSearchInput?.addEventListener('input', onSearch);
  fixtureSelect?.addEventListener('change', onFixtureChange);
  transposeSelect?.addEventListener('change', onTransposeChange);
  sheetGrid?.addEventListener('click', onBarClick);
  harmonyDisplayMode?.addEventListener('change', onHarmonyDisplayModeChange);

  [
    useMajorTriangleSymbol,
    useHalfDiminishedSymbol,
    useDiminishedSymbol
  ].filter((toggle): toggle is HTMLInputElement => Boolean(toggle)).forEach((toggle) => {
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
  sendSelectionToPracticeButton?.addEventListener('click', onSendSelectionToPractice);

  window.addEventListener('beforeunload', onBeforeUnload);
}
