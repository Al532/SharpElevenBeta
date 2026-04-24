// @ts-check
import './drill-playback-resources-types.js';

/**
 * Groups the live app-level playback-resources progression-state bindings into the
 * context object passed into the playback-resources assembly.
 *
 * @param {import('./drill-playback-resources-types.js').DrillPlaybackResourcesProgressionStateBindings} [options]
 * @returns {import('./drill-playback-resources-types.js').DrillPlaybackResourcesProgressionStateBindings}
 */
export function createDrillPlaybackResourcesProgressionStateAppContext(options = {}) {
  return { ...options };
}
