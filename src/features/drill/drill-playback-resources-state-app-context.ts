import type { DrillPlaybackResourcesAppContextShape } from './drill-playback-resources-types.js';

type DrillPlaybackResourcesStateAppContextOptions = Partial<DrillPlaybackResourcesAppContextShape>;

export function createDrillPlaybackResourcesStateAppContext({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
}: DrillPlaybackResourcesStateAppContextOptions = {}): DrillPlaybackResourcesAppContextShape {
  return {
    harmony,
    progressionState,
    playbackSettings,
    runtime,
    audioFacade
  };
}
