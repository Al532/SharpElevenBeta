type PracticePlaybackRuntimeAppContextOptions = {
  dom?: Record<string, unknown>;
  runtimeState?: Record<string, unknown>;
  audioState?: Record<string, unknown>;
  preloadState?: Record<string, unknown>;
  playbackConstants?: Record<string, unknown>;
  runtimeHelpers?: Record<string, unknown>;
};

export function createPracticePlaybackRuntimeAppContextOptions({
  dom = {},
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
}: PracticePlaybackRuntimeAppContextOptions = {}) {
  return {
    dom,
    state: runtimeState,
    audio: audioState,
    preload: preloadState,
    constants: playbackConstants,
    helpers: runtimeHelpers
  };
}
