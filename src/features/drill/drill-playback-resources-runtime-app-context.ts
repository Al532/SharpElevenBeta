import type { DrillPlaybackResourcesAppContextShape } from './drill-playback-resources-types.js';

type DrillPlaybackResourcesRuntimeAppContextOptions = Partial<DrillPlaybackResourcesAppContextShape>;

export function createDrillPlaybackResourcesRuntimeAppContext({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
}: DrillPlaybackResourcesRuntimeAppContextOptions = {}): DrillPlaybackResourcesAppContextShape {
  return {
    harmony,
    progressionState,
    playbackSettings,
    runtime,
    audioFacade
  };
}
