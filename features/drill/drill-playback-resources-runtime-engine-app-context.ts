// @ts-check
import './drill-playback-resources-types.js';

/**
 * Groups the live app-level playback-resources runtime-engine bindings into the
 * context object passed into the playback-resources assembly.
 *
 * @param {import('./drill-playback-resources-types.js').DrillPlaybackResourcesRuntimeBindings} [options]
 * @returns {import('./drill-playback-resources-types.js').DrillPlaybackResourcesRuntimeBindings}
 */
export function createDrillPlaybackResourcesRuntimeEngineAppContext(options = {}) {
  return { ...options };
}
