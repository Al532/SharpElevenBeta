type DrillPlaybackRuntimeHostAppContextOptions = {
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

export function createDrillPlaybackRuntimeHostAudioAppContext(
  options: Record<string, unknown> = {}
) {
  return cloneOptions(options);
}

export function createDrillPlaybackRuntimeHostConstantsAppContext(
  options: Record<string, unknown> = {}
) {
  return cloneOptions(options);
}

export function createDrillPlaybackRuntimeHostHelpersAppContext(
  options: Record<string, unknown> = {}
) {
  return cloneOptions(options);
}

export function createDrillPlaybackRuntimeHostPreloadAppContext(
  options: Record<string, unknown> = {}
) {
  return cloneOptions(options);
}

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
