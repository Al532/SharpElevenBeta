import { createEmbeddedDrillRuntimeAppContextOptions } from './drill-embedded-runtime-app-context.js';
import { createDrillEmbeddedRuntimeHostBindings } from './drill-embedded-runtime-host.js';
import { createDrillEmbeddedRuntimeContextBindings } from './drill-runtime-app-bindings.js';
import type { DrillPlaybackControllerOptions, EmbeddedDrillRuntimeOptions } from '../../core/types/contracts';

type DrillEmbeddedRuntimeDom = Record<string, unknown>;
type DrillEmbeddedPatternUiBindings = {
  clearProgressionEditingState?: () => void;
  closeProgressionManager?: () => void;
  setCustomPatternSelection?: () => void;
  setPatternName?: (value: string) => void;
  setCustomPatternValue?: (value: string) => void;
  setEditorPatternMode?: (value: string) => void;
  syncPatternSelectionFromInput?: () => void;
  setLastPatternSelectValue?: () => void;
  syncCustomPatternUI?: () => void;
  normalizeChordsPerBarForCurrentPattern?: () => void;
  applyPatternModeAvailability?: () => void;
  syncPatternPreview?: () => void;
  applyDisplayMode?: () => void;
  applyBeatIndicatorVisibility?: () => void;
  applyCurrentHarmonyVisibility?: () => void;
  updateKeyPickerLabels?: () => void;
  refreshDisplayedHarmony?: () => void;
  fitHarmonyDisplay?: () => void;
  validateCustomPattern?: () => boolean;
  getPatternErrorText?: () => string;
  getCurrentPatternString?: () => string;
  getCurrentPatternMode?: () => string;
};
type DrillEmbeddedPlaybackStateBindings = NonNullable<EmbeddedDrillRuntimeOptions['playbackStateOptions']>;
type DrillEmbeddedPlaybackControllerBindings = NonNullable<DrillPlaybackControllerOptions>;
type DrillEmbeddedNormalizationBindings = {
  normalizePatternString?: (value: string) => string;
  normalizePresetName?: (value: string) => string;
  normalizePatternMode?: (value: string) => string;
  normalizeCompingStyle?: (value: string) => string;
  normalizeRepetitionsPerKey?: (value: number | string) => number;
  normalizeDisplayMode?: (value: string) => string;
  normalizeHarmonyDisplayMode?: (value: string) => string;
};
type DrillEmbeddedPlaybackSettingsBindings = {
  getSwingRatio?: () => number;
  getCompingStyle?: () => string;
  getDrumsMode?: () => string;
  isWalkingBassEnabled?: () => boolean;
  getRepetitionsPerKey?: () => number;
  applyMixerSettings?: () => void;
};
type DrillEmbeddedTransportActions = {
  startPlayback?: () => Promise<void> | void;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
};

export function createDrillEmbeddedRuntimeAppAssembly({
  dom,
  host = {},
  patternUi = {},
  normalization = {},
  playbackSettings = {},
  playbackState = {},
  playbackRuntime = {},
  transportActions = {}
}: {
  dom?: DrillEmbeddedRuntimeDom;
  host?: Record<string, unknown>;
  patternUi?: DrillEmbeddedPatternUiBindings;
  normalization?: DrillEmbeddedNormalizationBindings;
  playbackSettings?: DrillEmbeddedPlaybackSettingsBindings;
  playbackState?: Partial<DrillEmbeddedPlaybackStateBindings> & Record<string, unknown>;
  playbackRuntime?: Partial<DrillEmbeddedPlaybackControllerBindings> & Record<string, unknown>;
  transportActions?: DrillEmbeddedTransportActions;
} = {}) {
  const hostBindings = createDrillEmbeddedRuntimeHostBindings({
    dom,
    ...host
  });

  return createEmbeddedDrillRuntimeAppContextOptions(
    createDrillEmbeddedRuntimeContextBindings({
      dom,
      patternUi: {
        ...hostBindings.patternUi,
        ...patternUi
      },
      normalization,
      playbackSettings,
      playbackState: {
        ...hostBindings.playbackState,
        ...playbackState
      },
      playbackRuntime: {
        ...hostBindings.playbackRuntime,
        ...playbackRuntime
      },
      transportActions: {
        ...hostBindings.transportActions,
        ...transportActions
      }
    })
  );
}
