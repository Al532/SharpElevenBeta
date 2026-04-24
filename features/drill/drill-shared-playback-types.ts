import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSessionController,
  PlaybackSettings
} from '../../core/types/contracts';

export type DrillSharedPlaybackHostBindings = Record<string, unknown>;
export type DrillSharedPlaybackPatternUiBindings = Record<string, unknown>;
export type DrillSharedPlaybackNormalizationBindings = Record<string, unknown>;
export type DrillSharedPlaybackSettingsBindings = Record<string, unknown>;
export type DrillSharedPlaybackRuntimeBindings = Record<string, unknown>;
export type DrillSharedPlaybackStateBindings = Record<string, unknown>;
export type DrillSharedPlaybackTransportBindings = Record<string, unknown>;

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
