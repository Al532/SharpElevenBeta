// @ts-check
import './drill-playback-resources-types.js';

/**
 * Groups the app-level bindings passed into the playback-resources assembly
 * before the shared playback-resources bindings normalization layer.
 *
 * @param {Partial<import('./drill-playback-resources-types.js').DrillPlaybackResourcesAppContextShape>} [options]
 * @returns {import('./drill-playback-resources-types.js').DrillPlaybackResourcesAppContextShape}
 */
export function createDrillPlaybackResourcesRuntimeAppBindings(options = {}) {
  return { ...options };
}
