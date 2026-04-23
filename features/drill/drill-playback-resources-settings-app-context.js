// @ts-check

/**
 * Groups the live app-level playback-resources settings bindings into the context
 * object passed into the playback-resources assembly.
 *
 * @param {Record<string, any>} [options]
 * @returns {Record<string, any>}
 */
export function createDrillPlaybackResourcesSettingsAppContext(options = {}) {
  return { ...options };
}
