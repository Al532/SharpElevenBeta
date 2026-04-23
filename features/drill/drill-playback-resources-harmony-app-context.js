// @ts-check

/**
 * Groups the live app-level playback-resources harmony bindings into the context
 * object passed into the playback-resources assembly.
 *
 * @param {Record<string, any>} [options]
 * @returns {Record<string, any>}
 */
export function createDrillPlaybackResourcesHarmonyAppContext(options = {}) {
  return { ...options };
}
