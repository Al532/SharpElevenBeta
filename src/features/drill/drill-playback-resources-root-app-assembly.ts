// @ts-check

import { createDrillPlaybackResourcesAppAssembly } from './drill-playback-resources-app-assembly.js';
import { createDrillPlaybackResourcesAppContext } from './drill-playback-resources-app-context.js';

/**
 * Creates the drill playback resources assembly from live root-app bindings.
 * This keeps the playback-preparation/resources contract out of `app.js`
 * while preserving the existing app-context and bindings layers.
 *
 * @param {Partial<import('./drill-playback-resources-types.js').DrillPlaybackResourcesAppContextShape>} [options]
 * @returns {ReturnType<typeof createDrillPlaybackResourcesAppAssembly>}
 */
export function createDrillPlaybackResourcesRootAppAssembly({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
} = {}) {
  return createDrillPlaybackResourcesAppAssembly(
    createDrillPlaybackResourcesAppContext({
      harmony,
      progressionState,
      playbackSettings,
      runtime,
      audioFacade
    })
  );
}
