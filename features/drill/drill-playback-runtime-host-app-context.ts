type DrillPlaybackRuntimeHostAppContextOptions = {
  dom?: Record<string, any>;
  runtimeState?: Record<string, any>;
  audioState?: Record<string, any>;
  preloadState?: Record<string, any>;
  playbackConstants?: Record<string, any>;
  runtimeHelpers?: Record<string, any>;
};

function cloneOptions(options: Record<string, any> = {}) {
  return { ...options };
}

export function createDrillPlaybackRuntimeHostAudioAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillPlaybackRuntimeHostConstantsAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillPlaybackRuntimeHostHelpersAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillPlaybackRuntimeHostPreloadAppContext(
  options: Record<string, any> = {}
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
