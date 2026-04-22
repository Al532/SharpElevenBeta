type DrillPlaybackResourcesStateAppContextOptions = {
  harmony?: Record<string, any>;
  progressionState?: Record<string, any>;
  playbackSettings?: Record<string, any>;
  runtime?: Record<string, any>;
  audioFacade?: Record<string, any>;
};

export function createDrillPlaybackResourcesStateAppContext({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
}: DrillPlaybackResourcesStateAppContextOptions = {}) {
  return {
    harmony,
    progressionState,
    playbackSettings,
    runtime,
    audioFacade
  };
}
