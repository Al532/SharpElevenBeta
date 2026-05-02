import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSessionController,
  PlaybackSettings
} from '../../core/types/contracts';

export type PracticePlaybackHostBindings = {
  customPatternOptionValue?: string;
  setSuppressPatternSelectChange?: (value: boolean) => void;
  setPatternSelectValue?: (value: string) => void;
  setEditorPatternMode?: (value: string) => void;
  syncPatternSelectionFromInput?: () => void;
  getLastPatternSelectValue?: () => string;
  setLastPatternSelectValue?: (value: string) => void;
  setPlaybackEndingCue?: (endingCue: EmbeddedPatternPayload['endingCue'] | null) => void;
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

export type PracticePlaybackPatternUiBindings = {
  clearProgressionEditingState?: () => void;
  closeProgressionManager?: () => void;
  setPlaybackEndingCue?: (endingCue: EmbeddedPatternPayload['endingCue'] | null) => void;
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

export type PracticePlaybackNormalizationBindings = {
  normalizePatternString?: (value: unknown) => string;
  normalizePresetName?: (value: unknown) => string;
  normalizePatternMode?: (value: unknown) => string;
  normalizeCompingStyle?: (value: unknown) => string;
  normalizeRepetitionsPerKey?: (value: unknown) => number;
  normalizeDisplayMode?: (value: unknown) => string;
  normalizeHarmonyDisplayMode?: (value: unknown) => string;
};

export type PracticePlaybackSettingsBindings = {
  getSwingRatio?: () => number;
  getCompingStyle?: () => string;
  getDrumsMode?: () => string;
  isWalkingBassEnabled?: () => boolean;
  getRepetitionsPerKey?: () => number;
  getFinitePlayback?: () => boolean;
  setFinitePlayback?: (enabled: boolean) => void;
  applyMixerSettings?: () => void;
};

export type PracticePlaybackRuntimeBindings = {
  ensureWalkingBassGenerator?: () => Promise<unknown>;
  getAudioContext?: () => BaseAudioContext | null;
  noteFadeout?: number;
  stopActiveChordVoices?: (audioTime: number, fadeout: number) => void;
  rebuildPreparedCompingPlans?: (currentKey: number) => void;
  buildPreparedBassPlan?: () => void;
  getCurrentKey?: () => number;
  preloadNearTermSamples?: () => Promise<unknown>;
  validateCustomPattern?: () => boolean;
  queuePerformanceCue?: (cue: unknown, sessionSpec?: unknown, playbackSettings?: PlaybackSettings) => PlaybackOperationResult | Promise<PlaybackOperationResult>;
};

export type PracticePlaybackStateBindings = {
  isEmbeddedMode?: boolean;
  getIsPlaying?: () => boolean;
  getIsPaused?: () => boolean;
  getIsIntro?: () => boolean;
  getCurrentBeat?: () => number;
  getCurrentChordIdx?: () => number;
  getPaddedChordCount?: () => number;
  getTempo?: () => number;
};

export type PracticePlaybackTransportBindings = {
  startPlayback?: () => Promise<void> | void;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
};

export type PracticePlaybackEmbeddedBindings = {
  dom?: Record<string, unknown>;
  host?: PracticePlaybackHostBindings;
  patternUi?: PracticePlaybackPatternUiBindings;
  normalization?: PracticePlaybackNormalizationBindings;
  playbackSettings?: PracticePlaybackSettingsBindings;
  playbackState?: PracticePlaybackStateBindings;
  playbackRuntime?: PracticePlaybackRuntimeBindings;
  transportActions?: PracticePlaybackTransportBindings;
};

export type PracticePlaybackDirectBindings = {
  playbackRuntime?: PracticePlaybackRuntimeBindings;
  playbackState?: PracticePlaybackStateBindings;
  transportActions?: PracticePlaybackTransportBindings;
};

export type PracticePlaybackAppBindings = {
  embedded?: PracticePlaybackEmbeddedBindings;
  direct?: PracticePlaybackDirectBindings;
  publishDirectGlobals?: boolean;
};

export type PracticePlaybackAppAssembly = {
  playbackController: PlaybackSessionController;
  applyEmbeddedPattern: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState: () => Partial<PlaybackRuntimeState> | null | undefined;
  directPlaybackControllerOptions: DirectPlaybackControllerOptions;
};
