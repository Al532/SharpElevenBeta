type DrillPlaybackResourcesAppContextOptions = {
  harmony?: Record<string, any>;
  progressionState?: Record<string, any>;
  playbackSettings?: Record<string, any>;
  runtime?: Record<string, any>;
  audioFacade?: Record<string, any>;
};

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
