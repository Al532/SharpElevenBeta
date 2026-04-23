// @ts-check

/**
 * Groups the app-level bindings passed into the playback-resources assembly
 * before the shared playback-resources bindings normalization layer.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillPlaybackResourcesRuntimeAppBindings(options = {}) {
  return { ...options };
}
