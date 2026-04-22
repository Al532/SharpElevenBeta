type DrillPlaybackRuntimeAppContextOptions = {
  dom?: Record<string, any>;
  runtimeState?: Record<string, any>;
  audioState?: Record<string, any>;
  preloadState?: Record<string, any>;
  playbackConstants?: Record<string, any>;
  runtimeHelpers?: Record<string, any>;
};

export function createDrillPlaybackRuntimeAppContextOptions({
  dom = {},
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
}: DrillPlaybackRuntimeAppContextOptions = {}) {
  return {
    dom,
    state: runtimeState,
    audio: audioState,
    preload: preloadState,
    constants: playbackConstants,
    helpers: runtimeHelpers
  };
}
