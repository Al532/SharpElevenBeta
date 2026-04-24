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

export function createDrillPlaybackResourcesAppBindings(
  options: DrillPlaybackResourcesAppContextOptions = {}
): DrillPlaybackResourcesAppContextShape {
  return createDrillPlaybackResourcesAppContext(options);
}

export function createDrillPlaybackResourcesRuntimeAppBindings(
  options: DrillPlaybackResourcesAppContextOptions = {}
): DrillPlaybackResourcesAppContextShape {
  return createDrillPlaybackResourcesAppContext(options);
}

export function createDrillPlaybackResourcesAppContext({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
}: DrillPlaybackResourcesAppContextOptions = {}): DrillPlaybackResourcesAppContextShape {
  return {
    harmony: cloneOptions(harmony as DrillPlaybackResourcesHarmonyBindings),
    progressionState: cloneOptions(progressionState as DrillPlaybackResourcesProgressionStateBindings),
    playbackSettings: cloneOptions(playbackSettings as DrillPlaybackResourcesSettingsBindings),
    runtime: cloneOptions(runtime as DrillPlaybackResourcesRuntimeBindings),
    audioFacade: cloneOptions(audioFacade as DrillPlaybackResourcesAudioFacade)
  };
}
