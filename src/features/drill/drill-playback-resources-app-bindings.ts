// @ts-check
import './drill-playback-resources-types.js';

/**
 * Groups the app-owned harmony/progression/runtime bindings passed into the
 * drill playback resources assembly.
 *
 * @param {Partial<import('./drill-playback-resources-types.js').DrillPlaybackResourcesAppContextShape>} [options]
 * @returns {import('./drill-playback-resources-types.js').DrillPlaybackResourcesAppContextShape}
 */
export function createDrillPlaybackResourcesAppBindings({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
} = {}) {
  return {
    harmony,
    progressionState,
    playbackSettings,
    runtime,
    audioFacade
  };
}
