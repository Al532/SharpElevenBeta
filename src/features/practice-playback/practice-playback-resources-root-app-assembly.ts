// @ts-check

import { createPracticePlaybackResourcesAppAssembly } from './practice-playback-resources-app-assembly.js';
import { createPracticePlaybackResourcesAppContext } from './practice-playback-resources-app-context.js';

/**
 * Creates the drill playback resources assembly from live root-app bindings.
 * This keeps the playback-preparation/resources contract out of `app.js`
 * while preserving the existing app-context and bindings layers.
 *
 * @param {Partial<import('./practice-playback-resources-types.js').PracticePlaybackResourcesAppContextShape>} [options]
 * @returns {ReturnType<typeof createPracticePlaybackResourcesAppAssembly>}
 */
export function createPracticePlaybackResourcesRootAppAssembly({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
} = {}) {
  return createPracticePlaybackResourcesAppAssembly(
    createPracticePlaybackResourcesAppContext({
      harmony,
      progressionState,
      playbackSettings,
      runtime,
      audioFacade
    })
  );
}
