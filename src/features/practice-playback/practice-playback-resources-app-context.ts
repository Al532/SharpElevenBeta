import type {
  PracticePlaybackResourcesAppContextShape,
  PracticePlaybackResourcesAudioFacade,
  PracticePlaybackResourcesHarmonyBindings,
  PracticePlaybackResourcesProgressionStateBindings,
  PracticePlaybackResourcesRuntimeBindings,
  PracticePlaybackResourcesSettingsBindings
} from './practice-playback-resources-types.js';

type PracticePlaybackResourcesAppContextOptions = Partial<PracticePlaybackResourcesAppContextShape>;

function cloneOptions<T extends Record<string, unknown>>(options: T): T {
  return { ...options };
}

export function createPracticePlaybackResourcesHarmonyAppContext(
  options: PracticePlaybackResourcesHarmonyBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackResourcesProgressionStateAppContext(
  options: PracticePlaybackResourcesProgressionStateBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackResourcesRuntimeEngineAppContext(
  options: PracticePlaybackResourcesRuntimeBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackResourcesSettingsAppContext(
  options: PracticePlaybackResourcesSettingsBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackResourcesAppBindings(
  options: PracticePlaybackResourcesAppContextOptions = {}
): PracticePlaybackResourcesAppContextShape {
  return createPracticePlaybackResourcesAppContext(options);
}

export function createPracticePlaybackResourcesRuntimeAppBindings(
  options: PracticePlaybackResourcesAppContextOptions = {}
): PracticePlaybackResourcesAppContextShape {
  return createPracticePlaybackResourcesAppContext(options);
}

export function createPracticePlaybackResourcesAppContext({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
}: PracticePlaybackResourcesAppContextOptions = {}): PracticePlaybackResourcesAppContextShape {
  return {
    harmony: cloneOptions(harmony as PracticePlaybackResourcesHarmonyBindings),
    progressionState: cloneOptions(progressionState as PracticePlaybackResourcesProgressionStateBindings),
    playbackSettings: cloneOptions(playbackSettings as PracticePlaybackResourcesSettingsBindings),
    runtime: cloneOptions(runtime as PracticePlaybackResourcesRuntimeBindings),
    audioFacade: cloneOptions(audioFacade as PracticePlaybackResourcesAudioFacade)
  };
}
