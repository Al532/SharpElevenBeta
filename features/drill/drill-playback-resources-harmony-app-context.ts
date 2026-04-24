// @ts-check
import './drill-playback-resources-types.js';

/**
 * Groups the live app-level playback-resources harmony bindings into the context
 * object passed into the playback-resources assembly.
 *
 * @param {import('./drill-playback-resources-types.js').DrillPlaybackResourcesHarmonyBindings} [options]
 * @returns {import('./drill-playback-resources-types.js').DrillPlaybackResourcesHarmonyBindings}
 */
export function createDrillPlaybackResourcesHarmonyAppContext(options = {}) {
  return { ...options };
}
