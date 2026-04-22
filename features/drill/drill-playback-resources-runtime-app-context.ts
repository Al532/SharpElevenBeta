type DrillPlaybackResourcesRuntimeAppContextOptions = {
  harmony?: Record<string, any>;
  progressionState?: Record<string, any>;
  playbackSettings?: Record<string, any>;
  runtime?: Record<string, any>;
  audioFacade?: Record<string, any>;
};

export function createDrillPlaybackResourcesRuntimeAppContext({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
}: DrillPlaybackResourcesRuntimeAppContextOptions = {}) {
  return {
    harmony,
    progressionState,
    playbackSettings,
    runtime,
    audioFacade
  };
}
