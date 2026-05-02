import { createEmbeddedPracticeRuntimeAppContextOptions } from './practice-playback-embedded-runtime-app-context.js';
import { createPracticePlaybackEmbeddedRuntimeHostBindings } from './practice-playback-embedded-runtime-host.js';
import { createPracticePlaybackEmbeddedRuntimeContextBindings } from './practice-playback-embedded-runtime-app-bindings.js';
import type { PracticePlaybackControllerOptions, EmbeddedPracticeRuntimeOptions } from '../../core/types/contracts';
import type { PracticePlaybackPatternUiBindings } from '../practice-playback/practice-playback-types.js';

type PracticePlaybackEmbeddedRuntimeDom = Record<string, unknown>;
type PracticePlaybackEmbeddedPatternUiBindings = {
  clearProgressionEditingState?: () => void;
  closeProgressionManager?: () => void;
  setCustomPatternSelection?: () => void;
  setPatternName?: (value: string) => void;
  setCustomPatternValue?: (value: string) => void;
  setEditorPatternMode?: (value: string) => void;
  syncPatternSelectionFromInput?: () => void;
  setLastPatternSelectValue?: () => void;
  setPlaybackEndingCue?: PracticePlaybackPatternUiBindings['setPlaybackEndingCue'];
  setPlaybackPerformanceMap?: PracticePlaybackPatternUiBindings['setPlaybackPerformanceMap'];
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
type PracticePlaybackEmbeddedPlaybackStateBindings = NonNullable<EmbeddedPracticeRuntimeOptions['playbackStateOptions']>;
type PracticePlaybackEmbeddedPlaybackControllerBindings = NonNullable<PracticePlaybackControllerOptions>;
type PracticePlaybackEmbeddedNormalizationBindings = {
  normalizePatternString?: (value: string) => string;
  normalizePresetName?: (value: string) => string;
  normalizePatternMode?: (value: string) => string;
  normalizeCompingStyle?: (value: string) => string;
  normalizeRepetitionsPerKey?: (value: number | string) => number;
  normalizeDisplayMode?: (value: string) => string;
  normalizeHarmonyDisplayMode?: (value: string) => string;
};
type PracticePlaybackEmbeddedPlaybackSettingsBindings = {
  getSwingRatio?: () => number;
  getCompingStyle?: () => string;
  getDrumsMode?: () => string;
  isWalkingBassEnabled?: () => boolean;
  getRepetitionsPerKey?: () => number;
  getFinitePlayback?: () => boolean;
  setFinitePlayback?: (enabled: boolean) => void;
  applyMixerSettings?: () => void;
};
type PracticePlaybackEmbeddedTransportActions = {
  startPlayback?: () => Promise<void> | void;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
};

export function createPracticePlaybackEmbeddedRuntimeAppAssembly({
  dom,
  host = {},
  patternUi = {},
  normalization = {},
  playbackSettings = {},
  playbackState = {},
  playbackRuntime = {},
  transportActions = {}
}: {
  dom?: PracticePlaybackEmbeddedRuntimeDom;
  host?: Record<string, unknown>;
  patternUi?: PracticePlaybackEmbeddedPatternUiBindings;
  normalization?: PracticePlaybackEmbeddedNormalizationBindings;
  playbackSettings?: PracticePlaybackEmbeddedPlaybackSettingsBindings;
  playbackState?: Partial<PracticePlaybackEmbeddedPlaybackStateBindings> & Record<string, unknown>;
  playbackRuntime?: Partial<PracticePlaybackEmbeddedPlaybackControllerBindings> & Record<string, unknown>;
  transportActions?: PracticePlaybackEmbeddedTransportActions;
} = {}) {
  const hostBindings = createPracticePlaybackEmbeddedRuntimeHostBindings({
    dom,
    ...host
  });

  return createEmbeddedPracticeRuntimeAppContextOptions(
    createPracticePlaybackEmbeddedRuntimeContextBindings({
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
