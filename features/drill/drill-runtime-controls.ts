type DrillRuntimeControlsDom = {
  startStop?: HTMLElement | null;
  pause?: HTMLElement | null;
  tempoSlider?: HTMLInputElement | null;
  nextPreviewValue?: HTMLInputElement | null;
  nextPreviewUnitToggle?: HTMLInputElement | null;
  selectAllKeys?: HTMLElement | null;
  invertKeys?: HTMLElement | null;
  clearAllKeys?: HTMLElement | null;
  saveKeyPreset?: HTMLElement | null;
  loadKeyPreset?: HTMLElement | null;
  transpositionSelect?: HTMLSelectElement | null;
  displayMode?: HTMLSelectElement | null;
  harmonyDisplayMode?: HTMLSelectElement | null;
  useMajorTriangleSymbol?: HTMLInputElement | null;
  useHalfDiminishedSymbol?: HTMLInputElement | null;
  useDiminishedSymbol?: HTMLInputElement | null;
  showBeatIndicator?: HTMLInputElement | null;
  hideCurrentHarmony?: HTMLInputElement | null;
  masterVolume?: HTMLInputElement | null;
  bassVolume?: HTMLInputElement | null;
  stringsVolume?: HTMLInputElement | null;
  drumsVolume?: HTMLInputElement | null;
};

type DrillRuntimeControlsOptions = {
  dom?: DrillRuntimeControlsDom;
  onStartStopClick?: () => void;
  onPauseClick?: () => void;
  onTempoInput?: () => void;
  onNextPreviewValueChange?: () => void;
  onNextPreviewUnitToggleChange?: () => void;
  onSelectAllKeys?: () => void;
  onInvertKeys?: () => void;
  onClearKeys?: () => void;
  onSaveKeyPreset?: () => void;
  onLoadKeyPreset?: () => void;
  onTranspositionChange?: () => void;
  onDisplayModeChange?: () => void;
  onHarmonyDisplayModeChange?: () => void;
  onSymbolToggleChange?: () => void;
  onShowBeatIndicatorChange?: () => void;
  onHideCurrentHarmonyChange?: () => void;
  onMasterVolumeInput?: () => void;
  onBassVolumeInput?: () => void;
  onDrumsVolumeInput?: () => void;
  onMasterVolumeChange?: () => void;
  onBassVolumeChange?: () => void;
  onStringsVolumeChange?: () => void;
  onDrumsVolumeChange?: () => void;
};

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
}: DrillRuntimeControlsOptions = {}) {
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

