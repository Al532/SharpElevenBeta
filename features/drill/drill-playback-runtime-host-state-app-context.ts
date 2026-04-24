type DrillPlaybackRuntimeHostStateAppContextOptions = {
  runtimeState?: Record<string, unknown>;
  audioState?: Record<string, unknown>;
  preloadState?: Record<string, unknown>;
  playbackConstants?: Record<string, unknown>;
  runtimeHelpers?: Record<string, unknown>;
};

export function createDrillPlaybackRuntimeHostStateAppContext({
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
}: DrillPlaybackRuntimeHostStateAppContextOptions = {}) {
  return {
    runtimeState,
    audioState,
    preloadState,
    playbackConstants,
    runtimeHelpers
  };
}
