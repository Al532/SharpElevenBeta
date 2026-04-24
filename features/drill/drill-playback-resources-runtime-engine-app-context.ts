// @ts-check

/**
 * Groups the live app-level playback-resources runtime-engine bindings into the
 * context object passed into the playback-resources assembly.
 *
 * @param {Record<string, any>} [options]
 * @returns {Record<string, any>}
 */
export function createDrillPlaybackResourcesRuntimeEngineAppContext(options = {}) {
  return { ...options };
}
