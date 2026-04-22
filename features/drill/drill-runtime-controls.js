export function initializeDrillRuntimeControls({
  dom,
  onStartStopClick,
  onPauseClick,
  onTempoInput,
  onNextPreviewValueChange,
  onNextPreviewUnitToggleChange,
  onSelectAllKeys,
  onInvertKeys,
  onClearKeys,
  onSaveKeyPreset,
  onLoadKeyPreset,
  onTranspositionChange,
  onDisplayModeChange,
  onHarmonyDisplayModeChange,
  onSymbolToggleChange,
  onShowBeatIndicatorChange,
  onHideCurrentHarmonyChange,
  onMasterVolumeInput,
  onBassVolumeInput,
  onDrumsVolumeInput,
  onMasterVolumeChange,
  onBassVolumeChange,
  onStringsVolumeChange,
  onDrumsVolumeChange
} = {}) {
  dom?.startStop?.addEventListener('click', () => {
    onStartStopClick?.();
  });

  dom?.pause?.addEventListener('click', () => {
    onPauseClick?.();
  });

  dom?.tempoSlider?.addEventListener('input', () => {
    onTempoInput?.();
  });

  dom?.nextPreviewValue?.addEventListener('change', () => {
    onNextPreviewValueChange?.();
  });

  dom?.nextPreviewUnitToggle?.addEventListener('change', () => {
    onNextPreviewUnitToggleChange?.();
  });

  dom?.selectAllKeys?.addEventListener('click', () => {
    onSelectAllKeys?.();
  });

  dom?.invertKeys?.addEventListener('click', () => {
    onInvertKeys?.();
  });

  dom?.clearAllKeys?.addEventListener('click', () => {
    onClearKeys?.();
  });

  dom?.saveKeyPreset?.addEventListener('click', () => {
    onSaveKeyPreset?.();
  });

  dom?.loadKeyPreset?.addEventListener('click', () => {
    onLoadKeyPreset?.();
  });

  dom?.transpositionSelect?.addEventListener('change', () => {
    onTranspositionChange?.();
  });

  dom?.displayMode?.addEventListener('change', () => {
    onDisplayModeChange?.();
  });

  dom?.harmonyDisplayMode?.addEventListener('change', () => {
    onHarmonyDisplayModeChange?.();
  });

  [
    dom?.useMajorTriangleSymbol,
    dom?.useHalfDiminishedSymbol,
    dom?.useDiminishedSymbol
  ].filter(Boolean).forEach((toggle) => {
    toggle.addEventListener('change', () => {
      onSymbolToggleChange?.();
    });
  });

  dom?.showBeatIndicator?.addEventListener('change', () => {
    onShowBeatIndicatorChange?.();
  });

  dom?.hideCurrentHarmony?.addEventListener('change', () => {
    onHideCurrentHarmonyChange?.();
  });

  dom?.masterVolume?.addEventListener('input', () => {
    onMasterVolumeInput?.();
  });

  dom?.bassVolume?.addEventListener('input', () => {
    onBassVolumeInput?.();
  });

  dom?.drumsVolume?.addEventListener('input', () => {
    onDrumsVolumeInput?.();
  });

  dom?.masterVolume?.addEventListener('change', () => {
    onMasterVolumeChange?.();
  });

  dom?.bassVolume?.addEventListener('change', () => {
    onBassVolumeChange?.();
  });

  dom?.stringsVolume?.addEventListener('change', () => {
    onStringsVolumeChange?.();
  });

  dom?.drumsVolume?.addEventListener('change', () => {
    onDrumsVolumeChange?.();
  });
}
