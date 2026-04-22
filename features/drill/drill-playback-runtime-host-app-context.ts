type DrillPlaybackRuntimeHostAppContextOptions = {
  dom?: Record<string, any>;
  runtimeState?: Record<string, any>;
  audioState?: Record<string, any>;
  preloadState?: Record<string, any>;
  playbackConstants?: Record<string, any>;
  runtimeHelpers?: Record<string, any>;
};

export function createDrillPlaybackRuntimeHostAppContext({
  dom = {},
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
}: DrillPlaybackRuntimeHostAppContextOptions = {}) {
  return {
    dom,
    runtimeState,
    audioState,
    preloadState,
    playbackConstants,
    runtimeHelpers
  };
}
