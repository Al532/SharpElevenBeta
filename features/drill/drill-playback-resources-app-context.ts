import type {
  DrillPlaybackResourcesAppContextShape,
  DrillPlaybackResourcesAudioFacade,
  DrillPlaybackResourcesHarmonyBindings,
  DrillPlaybackResourcesProgressionStateBindings,
  DrillPlaybackResourcesRuntimeBindings,
  DrillPlaybackResourcesSettingsBindings
} from './drill-playback-resources-types.js';

type DrillPlaybackResourcesAppContextOptions = Partial<DrillPlaybackResourcesAppContextShape>;

function cloneOptions<T extends Record<string, unknown>>(options: T): T {
  return { ...options };
}

export function createDrillPlaybackResourcesHarmonyAppContext(
  options: DrillPlaybackResourcesHarmonyBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillPlaybackResourcesProgressionStateAppContext(
  options: DrillPlaybackResourcesProgressionStateBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillPlaybackResourcesRuntimeEngineAppContext(
  options: DrillPlaybackResourcesRuntimeBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillPlaybackResourcesSettingsAppContext(
  options: DrillPlaybackResourcesSettingsBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillPlaybackResourcesAppContext({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
}: DrillPlaybackResourcesAppContextOptions = {}): DrillPlaybackResourcesAppContextShape {
  return {
    harmony: harmony as DrillPlaybackResourcesHarmonyBindings,
    progressionState: progressionState as DrillPlaybackResourcesProgressionStateBindings,
    playbackSettings: playbackSettings as DrillPlaybackResourcesSettingsBindings,
    runtime: runtime as DrillPlaybackResourcesRuntimeBindings,
    audioFacade: audioFacade as DrillPlaybackResourcesAudioFacade
  };
}
