type DrillPlaybackResourcesAppContextOptions = {
  harmony?: Record<string, any>;
  progressionState?: Record<string, any>;
  playbackSettings?: Record<string, any>;
  runtime?: Record<string, any>;
  audioFacade?: Record<string, any>;
};

function cloneOptions(options: Record<string, any> = {}) {
  return { ...options };
}

export function createDrillPlaybackResourcesHarmonyAppContext(options: Record<string, any> = {}) {
  return cloneOptions(options);
}

export function createDrillPlaybackResourcesProgressionStateAppContext(options: Record<string, any> = {}) {
  return cloneOptions(options);
}

export function createDrillPlaybackResourcesRuntimeEngineAppContext(options: Record<string, any> = {}) {
  return cloneOptions(options);
}

export function createDrillPlaybackResourcesSettingsAppContext(options: Record<string, any> = {}) {
  return cloneOptions(options);
}

export function createDrillPlaybackResourcesAppContext({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
}: DrillPlaybackResourcesAppContextOptions = {}) {
  return {
    harmony,
    progressionState,
    playbackSettings,
    runtime,
    audioFacade
  };
}
