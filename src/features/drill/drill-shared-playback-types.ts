import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSessionController,
  PlaybackSettings
} from '../../core/types/contracts';

export type DrillSharedPlaybackHostBindings = {
  customPatternOptionValue?: string;
  setSuppressPatternSelectChange?: (value: boolean) => void;
  setPatternSelectValue?: (value: string) => void;
  setEditorPatternMode?: (value: string) => void;
  syncPatternSelectionFromInput?: () => void;
  getLastPatternSelectValue?: () => string;
  setLastPatternSelectValue?: (value: string) => void;
  getIsPlaying?: () => boolean;
  getIsPaused?: () => boolean;
  getIsIntro?: () => boolean;
  getCurrentBeat?: () => number;
  getCurrentChordIdx?: () => number;
  getPaddedChordCount?: () => number;
  getTempo?: () => number;
  getAudioContext?: () => BaseAudioContext | null;
  getCurrentKey?: () => number;
  startPlayback?: () => Promise<void> | void;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
};

export type DrillSharedPlaybackPatternUiBindings = {
  clearProgressionEditingState?: () => void;
  closeProgressionManager?: () => void;
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
  getCurrentPatternString?: () => string;
  getCurrentPatternMode?: () => string;
};

export type DrillSharedPlaybackNormalizationBindings = {
  normalizePatternString?: (value: unknown) => string;
  normalizePresetName?: (value: unknown) => string;
  normalizePatternMode?: (value: unknown) => string;
  normalizeCompingStyle?: (value: unknown) => string;
  normalizeRepetitionsPerKey?: (value: unknown) => number;
  normalizeDisplayMode?: (value: unknown) => string;
  normalizeHarmonyDisplayMode?: (value: unknown) => string;
};

export type DrillSharedPlaybackSettingsBindings = {
  getSwingRatio?: () => number;
  getCompingStyle?: () => string;
  getDrumsMode?: () => string;
  isWalkingBassEnabled?: () => boolean;
  getRepetitionsPerKey?: () => number;
  applyMixerSettings?: () => void;
};

export type DrillSharedPlaybackRuntimeBindings = {
  ensureWalkingBassGenerator?: () => Promise<unknown>;
  getAudioContext?: () => BaseAudioContext | null;
  noteFadeout?: number;
  stopActiveChordVoices?: (audioTime: number, fadeout: number) => void;
  rebuildPreparedCompingPlans?: (currentKey: number) => void;
  buildPreparedBassPlan?: () => void;
  getCurrentKey?: () => number;
  preloadNearTermSamples?: () => Promise<unknown>;
  validateCustomPattern?: () => boolean;
};

export type DrillSharedPlaybackStateBindings = {
  isEmbeddedMode?: boolean;
  getIsPlaying?: () => boolean;
  getIsPaused?: () => boolean;
  getIsIntro?: () => boolean;
  getCurrentBeat?: () => number;
  getCurrentChordIdx?: () => number;
  getPaddedChordCount?: () => number;
  getTempo?: () => number;
};

export type DrillSharedPlaybackTransportBindings = {
  startPlayback?: () => Promise<void> | void;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
};

export type DrillSharedPlaybackEmbeddedBindings = {
  dom?: Record<string, unknown>;
  host?: DrillSharedPlaybackHostBindings;
  patternUi?: DrillSharedPlaybackPatternUiBindings;
  normalization?: DrillSharedPlaybackNormalizationBindings;
  playbackSettings?: DrillSharedPlaybackSettingsBindings;
  playbackState?: DrillSharedPlaybackStateBindings;
  playbackRuntime?: DrillSharedPlaybackRuntimeBindings;
  transportActions?: DrillSharedPlaybackTransportBindings;
};

export type DrillSharedPlaybackDirectBindings = {
  playbackRuntime?: DrillSharedPlaybackRuntimeBindings;
  playbackState?: DrillSharedPlaybackStateBindings;
  transportActions?: DrillSharedPlaybackTransportBindings;
};

export type DrillSharedPlaybackAppBindings = {
  embedded?: DrillSharedPlaybackEmbeddedBindings;
  direct?: DrillSharedPlaybackDirectBindings;
  publishDirectGlobals?: boolean;
};

export type DrillSharedPlaybackAppAssembly = {
  playbackController: PlaybackSessionController;
  applyEmbeddedPattern: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState: () => Partial<PlaybackRuntimeState> | null | undefined;
  directPlaybackControllerOptions: DirectPlaybackControllerOptions;
};
