type DrillPlaybackRuntimeHostStateAppContextOptions = {
  runtimeState?: Record<string, any>;
  audioState?: Record<string, any>;
  preloadState?: Record<string, any>;
  playbackConstants?: Record<string, any>;
  runtimeHelpers?: Record<string, any>;
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
