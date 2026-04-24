type PracticePlaybackRuntimeHostAppContextOptions = {
  dom?: Record<string, unknown>;
  runtimeState?: Record<string, unknown>;
  audioState?: Record<string, unknown>;
  preloadState?: Record<string, unknown>;
  playbackConstants?: Record<string, unknown>;
  runtimeHelpers?: Record<string, unknown>;
};

function cloneOptions<T extends Record<string, unknown>>(options: T): T {
  return { ...options };
}

export function createPracticePlaybackRuntimeHostAudioAppContext(
  options: Record<string, unknown> = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackRuntimeHostConstantsAppContext(
  options: Record<string, unknown> = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackRuntimeHostHelpersAppContext(
  options: Record<string, unknown> = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackRuntimeHostPreloadAppContext(
  options: Record<string, unknown> = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackRuntimeHostStateAppContext({
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
}: Omit<PracticePlaybackRuntimeHostAppContextOptions, 'dom'> = {}) {
  return {
    runtimeState,
    audioState,
    preloadState,
    playbackConstants,
    runtimeHelpers
  };
}

export function createPracticePlaybackRuntimeHostAppContext({
  dom = {},
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
}: PracticePlaybackRuntimeHostAppContextOptions = {}) {
  return {
    dom,
    runtimeState,
    audioState,
    preloadState,
    playbackConstants,
    runtimeHelpers
  };
}
