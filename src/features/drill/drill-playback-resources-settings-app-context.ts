// @ts-check
import './drill-playback-resources-types.js';

/**
 * Groups the live app-level playback-resources settings bindings into the context
 * object passed into the playback-resources assembly.
 *
 * @param {import('./drill-playback-resources-types.js').DrillPlaybackResourcesSettingsBindings} [options]
 * @returns {import('./drill-playback-resources-types.js').DrillPlaybackResourcesSettingsBindings}
 */
export function createDrillPlaybackResourcesSettingsAppContext(options = {}) {
  return { ...options };
}
